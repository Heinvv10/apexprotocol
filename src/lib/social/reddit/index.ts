/**
 * Public API of the Reddit platform module.
 *
 * Consumed by the apex-reddit skill. Other modules should NOT reach into
 * individual files; internal layout may change.
 */

export { loginToReddit, RedditDetectionAbort } from "./login-flow";
export type { LoginResult } from "./login-flow";

export { composePost, composeComment } from "./post-composer";
export type {
  PostContent,
  TextPostContent,
  LinkPostContent,
  PostResult,
} from "./post-composer";
