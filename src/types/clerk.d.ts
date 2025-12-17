/**
 * Clerk Type Declarations
 * Extends Clerk's type system with custom metadata fields
 */

import "@clerk/nextjs";

declare global {
  interface CustomJwtSessionClaims {
    publicMetadata?: {
      isSuperAdmin?: boolean;
    };
    metadata?: {
      isSuperAdmin?: boolean;
    };
  }
}

// Augment Clerk's types with our custom publicMetadata
declare module "@clerk/nextjs" {
  interface PublicMetadata {
    isSuperAdmin?: boolean;
  }
}

export {};
