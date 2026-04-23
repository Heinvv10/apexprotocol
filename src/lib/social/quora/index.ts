/**
 * Public API of the Quora platform module.
 *
 * Consumed by the apex-quora skill. Other modules should NOT reach into
 * individual files; internal layout may change.
 */

export { loginToQuora, QuoraDetectionAbort } from "./login-flow";
export type { LoginResult } from "./login-flow";

export { composeAnswer } from "./post-composer";
export type { AnswerContent, PostResult } from "./post-composer";
