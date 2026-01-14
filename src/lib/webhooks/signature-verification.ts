/**
 * Webhook Signature Verification
 * HMAC-SHA256 signature verification for webhook security
 * Prevents webhook spoofing and ensures data integrity
 */

import crypto from 'crypto';

/**
 * Generate HMAC-SHA256 signature
 */
export function generateSignature(payload: string, secret: string): string {
  return crypto
    .createHmac('sha256', secret)
    .update(payload)
    .digest('hex');
}

/**
 * Webhook Signature Verifier
 * Validates incoming webhook signatures before processing
 */
export class WebhookSignatureVerifier {
  /**
   * Timing-safe comparison that handles different length signatures
   * Prevents timing attacks while handling length mismatches
   */
  private safeCompare(provided: string, expected: string): boolean {
    const providedBuf = Buffer.from(provided);
    const expectedBuf = Buffer.from(expected);

    // If lengths differ, still do a comparison to prevent timing leak
    if (providedBuf.length !== expectedBuf.length) {
      crypto.timingSafeEqual(expectedBuf, expectedBuf);
      return false;
    }

    return crypto.timingSafeEqual(providedBuf, expectedBuf);
  }

  /**
   * Verify Mautic webhook signature
   */
  verifyMauticSignature(
    payload: string,
    signature: string,
    secret: string
  ): boolean {
    const expectedSignature = generateSignature(payload, secret);
    return this.safeCompare(signature, expectedSignature);
  }

  /**
   * Verify ListMonk webhook signature
   */
  verifyListMonkSignature(
    payload: string,
    signature: string,
    secret: string
  ): boolean {
    const expectedSignature = generateSignature(payload, secret);
    return this.safeCompare(signature, expectedSignature);
  }

  /**
   * Verify Postiz webhook signature
   */
  verifyPostizSignature(
    payload: string,
    signature: string,
    secret: string
  ): boolean {
    const expectedSignature = generateSignature(payload, secret);
    return this.safeCompare(signature, expectedSignature);
  }

  /**
   * Extract signature from header value
   * Handles prefixed signatures like "sha256=abc123"
   */
  extractSignature(headerValue: string, prefix?: string): string {
    if (!headerValue) return '';

    if (prefix && headerValue.startsWith(prefix)) {
      return headerValue.slice(prefix.length);
    }

    return headerValue;
  }

  /**
   * Verify any webhook signature with custom prefix handling
   */
  verifySignature(
    payload: string,
    signature: string,
    secret: string,
    options?: { prefix?: string }
  ): boolean {
    const cleanSignature = options?.prefix
      ? this.extractSignature(signature, options.prefix)
      : signature;

    const expectedSignature = generateSignature(payload, secret);
    return this.safeCompare(cleanSignature, expectedSignature);
  }
}

// Export singleton instance
export const webhookSignatureVerifier = new WebhookSignatureVerifier();
