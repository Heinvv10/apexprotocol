import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import bcrypt from 'bcryptjs';
import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  host: 'smtp.apexprotocol.co.za',
  port: 465,
  secure: true,
  auth: { user: 'orders@apexprotocol.co.za', pass: 'Mitzi@19780203' },
  tls: { rejectUnauthorized: false },
});

export async function POST(req: NextRequest) {
  const { name, email, phone, password, referral } = await req.json();

  if (!name || !email || !password || password.length < 6) {
    return NextResponse.json({ error: 'Name, email, and password (min 6 chars) required' }, { status: 400 });
  }

  if (!referral?.trim()) {
    return NextResponse.json({ error: 'A referral is required to register' }, { status: 400 });
  }

  const db = getDb();
  const existing = await db.prepare('SELECT id FROM users WHERE email = ?').get(email);
  if (existing) {
    return NextResponse.json({ error: 'Email already registered' }, { status: 400 });
  }

  const hash = bcrypt.hashSync(password, 10);
  await db.prepare('INSERT INTO users (email, password_hash, name, phone, referral, approved) VALUES (?, ?, ?, ?, ?, 0)')
    .run(email, hash, name, phone || null, referral.trim());

  // Send notification to admin
  const adminHtml = `
<!DOCTYPE html>
<html><head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;background-color:#0a0a0a;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#0a0a0a;padding:40px 0;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="background-color:#111827;border-radius:8px;overflow:hidden;">
        <tr>
          <td style="padding:30px 40px 15px;text-align:center;">
            <h1 style="color:#fff;font-family:Arial;font-size:24px;margin:0;letter-spacing:3px;">APEX PROTOCOL</h1>
            <div style="width:40px;height:2px;background:#00d4ff;margin:12px auto 0;"></div>
          </td>
        </tr>
        <tr>
          <td style="padding:15px 40px;">
            <h2 style="color:#00d4ff;font-family:Arial;font-size:18px;margin:0;">🔔 New Access Request</h2>
          </td>
        </tr>
        <tr>
          <td style="padding:10px 40px;">
            <table width="100%" style="background-color:#1f2937;border-radius:8px;border:1px solid #374151;">
              <tr><td style="padding:20px;">
                <table style="font-family:Arial;font-size:14px;color:#e5e7eb;width:100%;">
                  <tr><td style="padding:5px 0;color:#9ca3af;width:120px;">Name:</td><td style="font-weight:bold;">${name}</td></tr>
                  <tr><td style="padding:5px 0;color:#9ca3af;">Email:</td><td style="font-weight:bold;">${email}</td></tr>
                  ${phone ? `<tr><td style="padding:5px 0;color:#9ca3af;">Phone:</td><td style="font-weight:bold;">${phone}</td></tr>` : ''}
                  <tr><td style="padding:5px 0;color:#9ca3af;">Referred by:</td><td style="font-weight:bold;color:#00d4ff;">${referral}</td></tr>
                </table>
              </td></tr>
            </table>
          </td>
        </tr>
        <tr>
          <td style="padding:20px 40px;text-align:center;">
            <p style="font-family:Arial;font-size:13px;color:#6b7280;margin:0;">
              Log in to the admin panel to approve or reject this request.
            </p>
          </td>
        </tr>
        <tr>
          <td style="background-color:#0d1117;padding:12px 40px;text-align:center;border-top:1px solid #1f2937;">
            <p style="font-family:Arial;font-size:11px;color:#4b5563;margin:0;">APEX PROTOCOL ADMIN</p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body></html>`;

  try {
    await transporter.sendMail({
      from: '"Apex Protocol" <orders@apexprotocol.co.za>',
      to: 'admin@apexprotocol.co.za',
      subject: `🔔 New Access Request — ${name} (referred by ${referral})`,
      html: adminHtml,
      text: `New access request:\nName: ${name}\nEmail: ${email}\nPhone: ${phone || 'N/A'}\nReferred by: ${referral}\n\nLog in to admin panel to approve.`,
    });
  } catch (e) {
    console.error('Failed to send admin notification:', e);
  }

  return NextResponse.json({ ok: true, message: 'Access request submitted' });
}
