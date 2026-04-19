import { logger } from "@/lib/logger";
/**
 * Database Error Handler Utility (F137)
 * Provides consistent error handling and logging for all GraphQL resolver database operations
 */

/**
 * Error types that can be identified from database error messages
 */
export type DatabaseErrorType =
  | "unique_constraint"
  | "foreign_key"
  | "not_null"
  | "check_constraint"
  | "connection"
  | "timeout"
  | "unknown";

/**
 * Configuration for error handling
 */
export interface ErrorHandlerConfig {
  /** The operation being performed (e.g., "fetching brand", "creating recommendation") */
  operation: string;
  /** The entity type being operated on (e.g., "Brand", "Mention") */
  entityType?: string;
  /** The entity ID if applicable */
  entityId?: string;
  /** Whether to log the error to console (default: true) */
  logError?: boolean;
}

/**
 * Result of a not-found check
 */
export interface NotFoundResult<T> {
  found: true;
  data: T;
}

/**
 * Classifies a database error into a known type
 * @param error - The error to classify
 * @returns The classified error type
 */
export function classifyDatabaseError(error: unknown): DatabaseErrorType {
  if (!(error instanceof Error)) return "unknown";

  const message = error.message.toLowerCase();

  if (message.includes("unique") || message.includes("duplicate")) {
    return "unique_constraint";
  }

  if (message.includes("foreign key") || message.includes("violates foreign key")) {
    return "foreign_key";
  }

  if (message.includes("not null") || message.includes("null value")) {
    return "not_null";
  }

  if (message.includes("check constraint") || message.includes("violates check constraint")) {
    return "check_constraint";
  }

  if (
    message.includes("connection") ||
    message.includes("connect") ||
    message.includes("econnrefused")
  ) {
    return "connection";
  }

  if (message.includes("timeout") || message.includes("timed out")) {
    return "timeout";
  }

  return "unknown";
}

/**
 * Creates a user-friendly error message based on the error type and context
 * @param errorType - The classified error type
 * @param config - Error handler configuration
 * @returns A user-friendly error message
 */
function createUserFriendlyMessage(
  errorType: DatabaseErrorType,
  config: ErrorHandlerConfig
): string {
  const entityName = config.entityType || "resource";

  switch (errorType) {
    case "unique_constraint":
      return `A ${entityName.toLowerCase()} with this information already exists.`;

    case "foreign_key":
      return `Cannot complete ${config.operation}. Referenced ${entityName.toLowerCase()} does not exist or has associated records.`;

    case "not_null":
      return `Required field is missing for ${entityName.toLowerCase()}.`;

    case "check_constraint":
      return `Invalid data provided for ${entityName.toLowerCase()}.`;

    case "connection":
      return "Database connection failed. Please try again later.";

    case "timeout":
      return "Operation timed out. Please try again later.";

    default:
      return `Failed to complete ${config.operation}. Please try again later.`;
  }
}

/**
 * Handles database errors consistently across all resolvers
 *
 * @param error - The error thrown by the database operation
 * @param config - Configuration for error handling
 * @throws Always throws a user-friendly error
 *
 * @example
 * ```typescript
 * try {
 *   const result = await db.select().from(schema.brands).where(eq(schema.brands.id, id));
 *   return result[0];
 * } catch (error) {
 *   handleDatabaseError(error, { operation: "fetching brand", entityType: "Brand", entityId: id });
 * }
 * ```
 */
export function handleDatabaseError(
  error: unknown,
  config: ErrorHandlerConfig
): never {
  const { operation, entityType, entityId, logError = true } = config;

  // Log the error for debugging
  if (logError) {
    const context = entityId
      ? `${entityType || "Entity"} ${entityId}`
      : entityType || "resource";
    console.error(`Database error ${operation} (${context}):`, error);
  }

  // Classify and create appropriate user message
  const errorType = classifyDatabaseError(error);
  const userMessage = createUserFriendlyMessage(errorType, config);

  throw new Error(userMessage);
}

/**
 * Checks if a database query result exists and handles not-found cases
 *
 * @param result - The result from a database query (typically result[0] from Drizzle)
 * @param entityType - The type of entity being checked (e.g., "Brand", "Mention")
 * @param options - Additional options for handling
 * @returns The result if found
 * @throws Error if not found and throwIfNotFound is true (default)
 *
 * @example
 * ```typescript
 * // Throw if not found (default)
 * const brand = handleNotFound(result[0], "Brand");
 *
 * // Return null instead of throwing
 * const brand = handleNotFound(result[0], "Brand", { throwIfNotFound: false });
 * ```
 */
export function handleNotFound<T>(
  result: T | undefined | null,
  entityType: string,
  options: { throwIfNotFound?: boolean; entityId?: string } = {}
): T | null {
  const { throwIfNotFound = true, entityId } = options;

  if (result === undefined || result === null) {
    if (throwIfNotFound) {
      const identifier = entityId ? ` with id ${entityId}` : "";
      throw new Error(`${entityType}${identifier} not found`);
    }
    return null;
  }

  return result;
}

/**
 * Handles constraint violation errors with specific messages
 *
 * @param error - The error to check for constraint violations
 * @param config - Configuration for constraint violation handling
 * @throws If the error is a constraint violation, throws with a user-friendly message
 * @returns false if not a constraint violation (allows caller to handle other errors)
 *
 * @example
 * ```typescript
 * try {
 *   await db.insert(schema.brands).values({ ... });
 * } catch (error) {
 *   // Handle specific constraint violations
 *   if (handleConstraintViolation(error, {
 *     entityType: "Brand",
 *     uniqueFields: ["name", "domain"],
 *     foreignKeyMessage: "Referenced organization does not exist"
 *   })) {
 *     return; // Error was handled and thrown
 *   }
 *   // Handle other errors
 *   handleDatabaseError(error, { operation: "creating brand" });
 * }
 * ```
 */
export function handleConstraintViolation(
  error: unknown,
  config: {
    entityType: string;
    uniqueFields?: string[];
    foreignKeyMessage?: string;
    checkConstraintMessage?: string;
  }
): boolean {
  if (!(error instanceof Error)) return false;

  const errorType = classifyDatabaseError(error);
  const { entityType, uniqueFields, foreignKeyMessage, checkConstraintMessage } = config;

  switch (errorType) {
    case "unique_constraint": {
      const fields = uniqueFields?.join(" or ") || "this information";
      throw new Error(
        `A ${entityType.toLowerCase()} with ${fields} already exists.`
      );
    }

    case "foreign_key": {
      const message =
        foreignKeyMessage ||
        `Cannot complete operation. Referenced ${entityType.toLowerCase()} does not exist or has associated records.`;
      throw new Error(message);
    }

    case "check_constraint": {
      const message =
        checkConstraintMessage || `Invalid data provided for ${entityType.toLowerCase()}.`;
      throw new Error(message);
    }

    default:
      return false;
  }
}

/**
 * Wraps a resolver function with consistent error handling
 *
 * @param resolverFn - The resolver function to wrap
 * @param config - Configuration for error handling
 * @returns A wrapped resolver function with error handling
 *
 * @example
 * ```typescript
 * const getBrand = withErrorHandling(
 *   async (_, { id }, context) => {
 *     context.requireAuth();
 *     const result = await db.select().from(schema.brands).where(eq(schema.brands.id, id));
 *     return handleNotFound(result[0], "Brand", { entityId: id });
 *   },
 *   { operation: "fetching brand", entityType: "Brand" }
 * );
 * ```
 */
export function withErrorHandling<TArgs, TResult>(
  resolverFn: (
    parent: unknown,
    args: TArgs,
    context: unknown,
    info: unknown
  ) => Promise<TResult>,
  config: ErrorHandlerConfig
): (
  parent: unknown,
  args: TArgs,
  context: unknown,
  info: unknown
) => Promise<TResult> {
  return async (parent, args, context, info) => {
    try {
      return await resolverFn(parent, args, context, info);
    } catch (error) {
      // Re-throw known errors (not found, unauthorized, etc.)
      if (isKnownError(error)) {
        throw error;
      }
      handleDatabaseError(error, config);
    }
  };
}

/**
 * Checks if an error is a known/expected error that should be re-thrown as-is
 * @param error - The error to check
 * @returns true if the error is known and should be re-thrown
 */
export function isKnownError(error: unknown): boolean {
  if (!(error instanceof Error)) return false;

  const knownMessages = [
    "not found",
    "unauthorized",
    "already exists",
    "cannot delete",
    "cannot complete",
    "required field",
    "invalid data",
  ];

  const message = error.message.toLowerCase();
  return knownMessages.some((known) => message.includes(known));
}

/**
 * Logs a database operation for debugging without throwing
 * @param operation - Description of the operation
 * @param details - Additional details to log
 */
export function logDatabaseOperation(
  operation: string,
  details?: Record<string, unknown>
): void {
  if (process.env.NODE_ENV === "development") {
    logger.info(`[DB] ${operation}`, details ? JSON.stringify(details) : "");
  }
}
