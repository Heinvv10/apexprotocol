import { NextRequest, NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";
import { getUserId, getOrganizationId, currentDbUser } from "@/lib/auth/supabase-server";
import { db } from "@/lib/db";
import { audits, auditShares, brands, organizations } from "@/lib/db/schema";
import type { AuditIssue } from "@/lib/db/schema";
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

function grade(score: number): string {
  if (score >= 90) return "A";
  if (score >= 75) return "B";
  if (score >= 60) return "C";
  if (score >= 45) return "D";
  return "F";
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

  const [org, brand, audit, sender] = await Promise.all([
    db.query.organizations.findFirst({ where: eq(organizations.id, orgId) }),
    db.query.brands.findFirst({ where: eq(brands.id, share.brandId) }),
    db.query.audits.findFirst({ where: eq(audits.id, share.auditId) }),
    currentDbUser(),
  ]);

  const agencyName = org?.name ?? "ApexGEO";
  const brandName = brand?.name ?? "your brand";
  const brandDomain = brand?.domain ?? null;
  const url = buildShareUrl(token, request);
  const senderName = sender?.name ?? null;
  const senderEmail = sender?.email ?? null;

  const issues: AuditIssue[] = audit?.issues ?? [];
  const score = audit?.overallScore ?? 0;
  const gradeLetter = grade(score);
  const counts = {
    critical: audit?.criticalCount ?? issues.filter((i) => i.severity === "critical").length,
    high: audit?.highCount ?? issues.filter((i) => i.severity === "high").length,
    medium: audit?.mediumCount ?? issues.filter((i) => i.severity === "medium").length,
    low: audit?.lowCount ?? issues.filter((i) => i.severity === "low").length,
  };
  const topTasks = issues
    .filter((i) => i.severity === "critical" || i.severity === "high")
    .slice(0, 3);

  const subject = `${brandName} AI visibility report — Score ${score}/100 (${gradeLetter})`;

  const preheader = `${counts.critical + counts.high} high-priority tasks. Grade ${gradeLetter}. ${agencyName} prepared this for you.`;

  const noteBlock = note
    ? `
        <tr><td style="padding:24px 32px 0;">
          <div style="border-left:3px solid #00C2B3;background:#f8fafc;padding:14px 18px;border-radius:4px;">
            <p style="margin:0 0 4px;font-size:11px;letter-spacing:0.12em;text-transform:uppercase;color:#64748b;font-weight:600;">Note from ${escapeHtml(senderName ?? agencyName)}</p>
            <p style="margin:0;font-size:14px;line-height:1.6;color:#334155;white-space:pre-wrap;">${escapeHtml(note)}</p>
          </div>
        </td></tr>`
    : "";

  const topTasksRows = topTasks
    .map((issue, i) => {
      const color =
        issue.severity === "critical" ? "#DC2626" : "#EA580C";
      const label = issue.severity === "critical" ? "Critical" : "High";
      return `
        <tr><td style="padding:0 32px 16px;">
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0"><tr>
            <td valign="top" width="28" style="padding-top:2px;color:#94a3b8;font-weight:700;font-size:14px;">${String(
              i + 1,
            ).padStart(2, "0")}</td>
            <td valign="top" style="padding-left:12px;">
              <span style="display:inline-block;background:${color}1a;color:${color};font-size:10px;font-weight:700;letter-spacing:0.08em;text-transform:uppercase;padding:2px 8px;border-radius:10px;margin-bottom:6px;">${label} · ${escapeHtml(issue.category)}</span>
              <p style="margin:4px 0 2px;font-size:14px;font-weight:600;color:#0f172a;line-height:1.4;">${escapeHtml(issue.title)}</p>
              <p style="margin:0;font-size:13px;line-height:1.5;color:#475569;">${escapeHtml((issue.recommendation || issue.description || "").slice(0, 180))}</p>
            </td>
          </tr></table>
        </td></tr>`;
    })
    .join("");

  const html = `<!doctype html>
<html lang="en"><head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="x-apple-disable-message-reformatting">
<meta name="color-scheme" content="light">
<meta name="supported-color-schemes" content="light">
<title>${escapeHtml(subject)}</title>
</head>
<body style="margin:0;padding:0;background:#f1f5f9;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:#0f172a;">
<div style="display:none;max-height:0;overflow:hidden;opacity:0;">${escapeHtml(preheader)}</div>
<table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background:#f1f5f9;">
  <tr><td align="center" style="padding:32px 16px;">
    <table role="presentation" width="600" cellspacing="0" cellpadding="0" border="0" style="background:#ffffff;border-radius:12px;overflow:hidden;max-width:600px;box-shadow:0 1px 3px rgba(15,23,42,0.06);">
      <tr><td style="padding:24px 32px 20px;border-bottom:1px solid #e2e8f0;">
        <p style="margin:0;font-size:11px;letter-spacing:0.15em;text-transform:uppercase;color:#64748b;font-weight:600;">Prepared by ${escapeHtml(agencyName)}</p>
      </td></tr>
      <tr><td style="padding:28px 32px 8px;">
        <h1 style="margin:0;font-size:22px;font-weight:700;color:#0f172a;line-height:1.3;">AI visibility report for <span style="color:#0f172a;">${escapeHtml(brandName)}</span></h1>
        ${brandDomain ? `<p style="margin:6px 0 0;font-size:13px;color:#64748b;">${escapeHtml(brandDomain)}</p>` : ""}
      </td></tr>
      <tr><td style="padding:16px 32px 4px;">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
          <tr>
            <td valign="top" width="40%" style="padding:16px;background:#f8fafc;border-radius:8px;">
              <p style="margin:0;font-size:11px;letter-spacing:0.1em;text-transform:uppercase;color:#64748b;font-weight:600;">Overall score</p>
              <p style="margin:6px 0 0;font-size:36px;font-weight:800;color:#0f172a;line-height:1;">${score}<span style="font-size:16px;color:#94a3b8;font-weight:500;"> / 100</span></p>
              <p style="margin:4px 0 0;font-size:13px;color:#475569;">Grade <strong style="color:#0f172a;">${gradeLetter}</strong></p>
            </td>
            <td width="16"></td>
            <td valign="top" style="padding:16px;background:#f8fafc;border-radius:8px;">
              <p style="margin:0;font-size:11px;letter-spacing:0.1em;text-transform:uppercase;color:#64748b;font-weight:600;">Issues to resolve</p>
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="margin-top:8px;">
                <tr>
                  <td width="25%" style="text-align:center;"><p style="margin:0;font-size:20px;font-weight:700;color:#DC2626;">${counts.critical}</p><p style="margin:0;font-size:10px;color:#64748b;text-transform:uppercase;letter-spacing:0.05em;">Crit</p></td>
                  <td width="25%" style="text-align:center;"><p style="margin:0;font-size:20px;font-weight:700;color:#EA580C;">${counts.high}</p><p style="margin:0;font-size:10px;color:#64748b;text-transform:uppercase;letter-spacing:0.05em;">High</p></td>
                  <td width="25%" style="text-align:center;"><p style="margin:0;font-size:20px;font-weight:700;color:#CA8A04;">${counts.medium}</p><p style="margin:0;font-size:10px;color:#64748b;text-transform:uppercase;letter-spacing:0.05em;">Med</p></td>
                  <td width="25%" style="text-align:center;"><p style="margin:0;font-size:20px;font-weight:700;color:#65A30D;">${counts.low}</p><p style="margin:0;font-size:10px;color:#64748b;text-transform:uppercase;letter-spacing:0.05em;">Low</p></td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </td></tr>
      ${noteBlock}
      ${
        topTasksRows
          ? `<tr><td style="padding:24px 32px 8px;">
              <p style="margin:0 0 12px;font-size:11px;letter-spacing:0.12em;text-transform:uppercase;color:#64748b;font-weight:600;">Top priorities</p>
            </td></tr>
            ${topTasksRows}`
          : ""
      }
      <tr><td align="center" style="padding:16px 32px 28px;">
        <a href="${url}" style="display:inline-block;background:#0f172a;color:#ffffff;font-weight:600;text-decoration:none;padding:12px 28px;border-radius:8px;font-size:14px;">Open the full report</a>
        <p style="margin:12px 0 0;font-size:12px;color:#64748b;">Includes every outstanding task with a how-to-fix recommendation.</p>
      </td></tr>
      <tr><td style="padding:18px 32px 24px;border-top:1px solid #e2e8f0;background:#f8fafc;">
        <p style="margin:0 0 6px;font-size:11px;color:#64748b;line-height:1.5;">This report was shared directly with you by ${escapeHtml(senderName ?? agencyName)}${senderEmail ? ` (${escapeHtml(senderEmail)})` : ""}. Reply to this email to reach ${escapeHtml(senderName ? senderName.split(" ")[0] : agencyName)} directly.</p>
        <p style="margin:0;font-size:11px;color:#94a3b8;">Powered by <a href="https://apexgeo.app" style="color:#64748b;text-decoration:none;">ApexGEO</a> · AI visibility platform</p>
      </td></tr>
    </table>
  </td></tr>
</table>
</body></html>`;

  const text = [
    `${brandName} — AI visibility report`,
    brandDomain ? `Domain: ${brandDomain}` : "",
    `Overall score: ${score}/100 (Grade ${gradeLetter})`,
    `Issues: ${counts.critical} critical · ${counts.high} high · ${counts.medium} medium · ${counts.low} low`,
    "",
    note ? `Note from ${senderName ?? agencyName}:\n${note}\n` : "",
    topTasks.length
      ? "Top priorities:\n" +
        topTasks
          .map(
            (t, i) =>
              `${i + 1}. [${t.severity.toUpperCase()}] ${t.title}\n   ${t.recommendation || t.description}`,
          )
          .join("\n\n") +
        "\n"
      : "",
    `Open the full report: ${url}`,
    "",
    `Shared by ${senderName ?? agencyName}${senderEmail ? ` <${senderEmail}>` : ""} via ApexGEO.`,
    "Reply to this email to reach them directly.",
  ]
    .filter(Boolean)
    .join("\n");

  const result = await sendMail({
    to: recipient,
    subject,
    html,
    text,
    replyTo: senderEmail ?? undefined,
    headers: {
      "X-Entity-Ref-ID": share.id,
      "X-Auto-Response-Suppress": "OOF, AutoReply",
    },
  });
  if (!result.success) {
    return NextResponse.json(
      { error: "Email send failed", details: result.error },
      { status: 502 },
    );
  }

  return NextResponse.json({ success: true, messageId: result.id });
}
