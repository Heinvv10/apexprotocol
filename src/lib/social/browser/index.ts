/**
 * Public API of the apex-social-browser foundation.
 *
 * Platform-specific skills (apex-x-twitter, apex-linkedin, etc.) import
 * from here. Consumers should NOT reach into individual modules — changes
 * to internal layout should not break platform skills.
 */

export {
  createCredential,
  getCredential,
  findCredential,
  listCredentialsForBrand,
  updateSessionState,
  markFlagged,
  getOneTimeCode,
  type CreateCredentialInput,
  type DecryptedCredential,
} from "./credential-vault";

export {
  dwell,
  humanType,
  humanClick,
  humanScroll,
  humanKey,
} from "./human-interaction";

export {
  checkWriteQuota,
  assertWriteQuota,
  QuotaExceededError,
  type QuotaCheckResult,
} from "./quota-enforcer";

export { logAction, type LogActionInput } from "./action-log";

export {
  launchSocialBrowser,
  type LaunchSocialBrowserOptions,
} from "./launcher";

export {
  generateCode,
  verifyCode,
  secondsUntilNextCode,
  type TOTPOptions,
} from "./totp";
