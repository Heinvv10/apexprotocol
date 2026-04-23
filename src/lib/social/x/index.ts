/**
 * Public API of the X (Twitter) automation layer.
 *
 * Sits on top of @/lib/social/browser (the shared foundation) and adds
 * X-specific login-flow and post-composer logic.
 */

export {
  loginToX,
  XDetectionAbort,
  type LoginResult,
} from "./login-flow";

export {
  composePost,
  composeThread,
  type PostResult,
} from "./post-composer";
