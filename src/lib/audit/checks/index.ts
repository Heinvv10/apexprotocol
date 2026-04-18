/**
 * Audit Checks Index
 * Exports all audit check modules for GEO/AEO optimization
 */

export { checkAiCrawlers } from "./ai-crawler-check";
export { checkEntityAuthority } from "./entity-authority-check";
export {
  checkContentChunking,
  type ContentChunkingResult,
} from "./content-chunking-check";
export { checkPageSpeed, type PageSpeedResult } from "./pagespeed-check";
