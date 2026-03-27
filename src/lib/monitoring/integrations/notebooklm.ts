import { MultiPlatformQueryResult } from "../multi-platform-query";
import { createErrorResult } from "./shared-analysis";

/**
 * Google NotebookLM Integration
 *
 * NotebookLM does not have a public API.
 * This integration returns an error to indicate the platform cannot be queried.
 */

export async function queryNotebookLM(
  brandId: string,
  integrationId: string,
  query: string,
  brandContext?: string
): Promise<MultiPlatformQueryResult> {
  return createErrorResult(
    "notebooklm",
    integrationId,
    "NotebookLM has no public API"
  );
}
