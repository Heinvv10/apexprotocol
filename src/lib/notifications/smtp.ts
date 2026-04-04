/**
 * SMTP Email Transport
 * Replaces Resend with direct SMTP (ISP / custom mail server)
 * Config via environment variables:
 *   SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, SMTP_FROM_EMAIL, SMTP_FROM_NAME
 */

import nodemailer from "nodemailer";
import type { Transporter } from "nodemailer";

export interface SmtpConfig {
  host: string;
  port: number;
  secure: boolean; // true for 465, false for 587/25
  user: string;
  pass: string;
  fromEmail: string;
  fromName: string;
}

export interface MailOptions {
  to: string | string[];
  cc?: string[];
  bcc?: string[];
  subject: string;
  html?: string;
  text?: string;
  replyTo?: string;
}

export interface SendResult {
  id: string;
  success: boolean;
  error?: string;
}

let _transporter: Transporter | null = null;
let _config: SmtpConfig | null = null;

/**
 * Get SMTP config from environment
 */
export function getSmtpConfig(): SmtpConfig | null {
  const host = process.env.SMTP_HOST;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  if (!host || !user || !pass) return null;

  const port = parseInt(process.env.SMTP_PORT || "465", 10);
  const secure = port === 465;

  return {
    host,
    port,
    secure,
    user,
    pass,
    fromEmail: process.env.SMTP_FROM_EMAIL || user,
    fromName: process.env.SMTP_FROM_NAME || "ApexGEO",
  };
}

/**
 * Get (or create) the nodemailer transporter
 */
function getTransporter(): Transporter {
  const config = getSmtpConfig();
  if (!config) {
    throw new Error(
      "SMTP not configured. Set SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS in environment."
    );
  }

  // Re-create if config changed
  if (!_transporter || JSON.stringify(config) !== JSON.stringify(_config)) {
    _config = config;
    _transporter = nodemailer.createTransport({
      host: config.host,
      port: config.port,
      secure: config.secure,
      auth: {
        user: config.user,
        pass: config.pass,
      },
      tls: {
        rejectUnauthorized: false, // ISP certs sometimes self-signed
      },
    });
  }

  return _transporter;
}

/**
 * Send an email via SMTP
 */
export async function sendMail(options: MailOptions): Promise<SendResult> {
  try {
    const config = getSmtpConfig();
    if (!config) {
      throw new Error("SMTP_HOST, SMTP_USER, SMTP_PASS are not set.");
    }

    const transporter = getTransporter();

    const info = await transporter.sendMail({
      from: `"${config.fromName}" <${config.fromEmail}>`,
      to: Array.isArray(options.to) ? options.to.join(", ") : options.to,
      cc: options.cc?.join(", "),
      bcc: options.bcc?.join(", "),
      replyTo: options.replyTo,
      subject: options.subject,
      html: options.html,
      text: options.text,
    });

    return { id: info.messageId, success: true };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return { id: "", success: false, error: message };
  }
}

/**
 * Verify SMTP connection (use in health checks)
 */
export async function verifySmtp(): Promise<{ ok: boolean; error?: string }> {
  try {
    const transporter = getTransporter();
    await transporter.verify();
    return { ok: true };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : String(err),
    };
  }
}

/**
 * Is SMTP configured?
 */
export function isSmtpConfigured(): boolean {
  return getSmtpConfig() !== null;
}
