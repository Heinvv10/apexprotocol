import { NextRequest, NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";
import { getUserId, getOrganizationId } from "@/lib/auth/supabase-server";
import { db } from "@/lib/db";
import { auditShares, organizations, brands } from "@/lib/db/schema";
import { isShareActive } from "@/lib/share/token";
import { sendMail, isSmtpConfigured } from "@/lib/notifications/smtp";

interface RouteParams {
  params: Promise<{ token: string }>;
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function buildShareUrl(token: string, request: NextRequest): string {
  const base = process.env.NEXT_PUBLIC_APP_URL || request.nextUrl.origin;
  return `${base}/shared/audit/${token}`;
}

export async function POST(request: NextRequest, { params }: RouteParams) {
  const userId = await getUserId();
  const orgId = await getOrganizationId();
  if (!userId || !orgId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!isSmtpConfigured()) {
    return NextResponse.json(
      { error: "Email is not configured on this server." },
      { status: 503 },
    );
  }

  const { token } = await params;
  const body = await request.json().catch(() => ({}));
  const recipient = typeof body?.to === "string" ? body.to.trim() : "";
  const note = typeof body?.message === "string" ? body.message.trim() : "";

  if (!EMAIL_RE.test(recipient)) {
    return NextResponse.json(
      { error: "Provide a valid recipient email." },
      { status: 400 },
    );
  }

  const share = await db.query.auditShares.findFirst({
    where: and(
      eq(auditShares.token, token),
      eq(auditShares.organizationId, orgId),
    ),
  });
  if (!share || !isShareActive(share)) {
    return NextResponse.json({ error: "Share not found or inactive" }, { status: 404 });
  }

  const [org, brand] = await Promise.all([
    db.query.organizations.findFirst({ where: eq(organizations.id, orgId) }),
    db.query.brands.findFirst({ where: eq(brands.id, share.brandId) }),
  ]);

  const agencyName = org?.name ?? "ApexGEO";
  const brandName = brand?.name ?? "your brand";
  const url = buildShareUrl(token, request);

  const subject = `AI visibility report for ${brandName}`;
  const noteBlock = note
    ? `<p style="margin:16px 0;padding:12px 16px;border-left:3px solid #00E5CC;background:#0f1628;color:#cbd5e1;border-radius:4px;font-size:14px;line-height:1.6;">${escapeHtml(note)}</p>`
    : "";

  const html = `
    <div style="font-family:-apple-system,Segoe UI,Roboto,sans-serif;background:#0a0f1a;color:#e2e8f0;padding:32px 16px;">
      <div style="max-width:560px;margin:0 auto;background:#141930;border-radius:12px;padding:32px;">
        <p style="font-size:12px;letter-spacing:0.15em;text-transform:uppercase;color:#00E5CC;margin:0 0 8px;">${escapeHtml(agencyName)}</p>
        <h1 style="font-size:22px;margin:0 0 16px;color:#f8fafc;">Your AI visibility report is ready</h1>
        <p style="margin:0 0 16px;line-height:1.6;font-size:15px;color:#cbd5e1;">
          ${escapeHtml(agencyName)} has shared an AI visibility report for <strong style="color:#f8fafc;">${escapeHtml(brandName)}</strong>. The report covers how your brand is currently being found and cited by AI platforms like ChatGPT, Claude, Gemini and Perplexity — plus the priority actions that will move the score.
        </p>
        ${noteBlock}
        <p style="margin:24px 0;">
          <a href="${url}" style="display:inline-block;background:#00E5CC;color:#0a0f1a;font-weight:600;text-decoration:none;padding:12px 24px;border-radius:8px;font-size:15px;">View report</a>
        </p>
        <p style="font-size:12px;color:#64748b;margin:24px 0 0;line-height:1.5;">
          Or open this link in your browser:<br>
          <a href="${url}" style="color:#64748b;word-break:break-all;">${escapeHtml(url)}</a>
        </p>
        <hr style="border:none;border-top:1px solid #1e293b;margin:24px 0;">
        <p style="font-size:11px;color:#475569;margin:0;line-height:1.5;">
          Sent by ${escapeHtml(agencyName)} via ApexGEO — the AI visibility platform.
        </p>
      </div>
    </div>
  `;

  const text = [
    `${agencyName} has shared an AI visibility report for ${brandName}.`,
    note ? `\nMessage from ${agencyName}:\n${note}` : "",
    `\nView report: ${url}`,
    `\nSent by ${agencyName} via ApexGEO.`,
  ].join("");

  const result = await sendMail({ to: recipient, subject, html, text });
  if (!result.success) {
    return NextResponse.json(
      { error: "Email send failed", details: result.error },
      { status: 502 },
    );
  }

  return NextResponse.json({ success: true, messageId: result.id });
}
