/**
 * Public API of the LinkedIn platform module.
 *
 * Consumed by the apex-linkedin skill. Other modules should NOT reach into
 * individual files; internal layout may change.
 */

export { loginToLinkedIn, LinkedInDetectionAbort } from "./login-flow";
export type { LoginResult } from "./login-flow";

export { composePost, composePagePost } from "./post-composer";
export type { PostContent, PostResult } from "./post-composer";
