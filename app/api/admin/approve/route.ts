import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { getSession } from '@/lib/auth';
import nodemailer from 'nodemailer';
import { randomBytes } from 'crypto';

const transporter = nodemailer.createTransport({
  host: 'smtp.apexprotocol.co.za',
  port: 465,
  secure: true,
  auth: { user: 'orders@apexprotocol.co.za', pass: 'Mitzi@19780203' },
  tls: { rejectUnauthorized: false },
});

export async function POST(req: NextRequest) {
  const session = getSession();
  if (!session?.isAdmin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { requestId } = await req.json();
  if (!requestId) {
    return NextResponse.json({ error: 'requestId required' }, { status: 400 });
  }

  const db = getDb();

  // Get the contact request
  const request = db.prepare('SELECT * FROM contact_requests WHERE id = ?').get(requestId) as any;
  if (!request) {
    return NextResponse.json({ error: 'Request not found' }, { status: 404 });
  }

  // Generate a temporary password
  const tempPassword = randomBytes(4).toString('hex') + '!A1'; // e.g. "a3f2b1c0!A1"

  // Check if user already exists
  const existingUser = db.prepare('SELECT id FROM users WHERE email = ?').get(request.email) as any;
  
  if (existingUser) {
    // Update password
    const bcrypt = require('bcryptjs');
    const hash = bcrypt.hashSync(tempPassword, 10);
    db.prepare('UPDATE users SET password_hash = ? WHERE id = ?').run(hash, existingUser.id);
  } else {
    // Create user account
    const bcrypt = require('bcryptjs');
    const hash = bcrypt.hashSync(tempPassword, 10);
    db.prepare('INSERT INTO users (name, email, password_hash) VALUES (?, ?, ?)')
      .run(`${request.first_name} ${request.last_name}`, request.email, hash);
  }

  // Update request status
  db.prepare("UPDATE contact_requests SET status = 'approved' WHERE id = ?").run(requestId);

  // Send approval email with credentials
  const approvalHtml = `
<!DOCTYPE html>
<html><head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;background-color:#0a0a0a;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#0a0a0a;padding:40px 0;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="background-color:#111827;border-radius:8px;overflow:hidden;">
        
        <tr>
          <td style="padding:40px 40px 20px;text-align:center;">
            <h1 style="color:#fff;font-family:Arial;font-size:28px;margin:0;letter-spacing:4px;">APEX PROTOCOL</h1>
            <div style="width:40px;height:2px;background:#00d4ff;margin:15px auto 0;"></div>
          </td>
        </tr>

        <tr>
          <td style="padding:20px 40px;">
            <p style="font-family:Arial;font-size:16px;color:#e5e7eb;margin:0;">
              Hi ${request.first_name},
            </p>
            <p style="font-family:Arial;font-size:14px;color:#9ca3af;margin:15px 0 0;line-height:1.6;">
              Your access request has been <strong style="color:#00d4ff;">approved</strong>. Welcome to Apex Protocol.
            </p>
          </td>
        </tr>

        <tr>
          <td style="padding:15px 40px;">
            <table width="100%" style="background-color:#1f2937;border-radius:8px;border:1px solid #00d4ff33;">
              <tr><td style="padding:20px;">
                <p style="font-family:Arial;font-size:12px;color:#00d4ff;margin:0 0 12px;text-transform:uppercase;letter-spacing:1px;">Your Login Credentials</p>
                <table style="font-family:Arial;font-size:14px;color:#e5e7eb;">
                  <tr><td style="padding:4px 15px 4px 0;color:#9ca3af;">Email:</td><td style="font-weight:bold;">${request.email}</td></tr>
                  <tr><td style="padding:4px 15px 4px 0;color:#9ca3af;">Password:</td><td style="font-weight:bold;font-family:'Courier New',monospace;color:#00d4ff;font-size:16px;">${tempPassword}</td></tr>
                </table>
                <p style="font-family:Arial;font-size:12px;color:#ef4444;margin:12px 0 0;font-weight:bold;">
                  ⚠️ Please change your password after first login.
                </p>
              </td></tr>
            </table>
          </td>
        </tr>

        <tr>
          <td style="padding:20px 40px;text-align:center;">
            <a href="https://apexprotocol.co.za/auth/login" style="display:inline-block;background:#00d4ff;color:#000;font-family:Arial;font-size:14px;font-weight:bold;padding:12px 30px;border-radius:6px;text-decoration:none;letter-spacing:1px;">SIGN IN NOW</a>
          </td>
        </tr>

        <tr>
          <td style="padding:10px 40px 30px;">
            <p style="font-family:Arial;font-size:13px;color:#6b7280;margin:0;text-align:center;">
              Browse our catalog and place your first order.
            </p>
          </td>
        </tr>

        <tr>
          <td style="background-color:#0d1117;padding:15px 40px;text-align:center;border-top:1px solid #1f2937;">
            <p style="font-family:Arial;font-size:11px;color:#4b5563;margin:0;letter-spacing:1px;">
              APEX PROTOCOL — orders@apexprotocol.co.za
            </p>
          </td>
        </tr>

      </table>
    </td></tr>
  </table>
</body></html>`;

  await transporter.sendMail({
    from: '"Apex Protocol" <orders@apexprotocol.co.za>',
    to: request.email,
    subject: 'Access Approved — Welcome to Apex Protocol',
    html: approvalHtml,
    text: `Hi ${request.first_name}, your access has been approved! Login at https://apexprotocol.co.za/auth/login with email: ${request.email} and password: ${tempPassword}. Please change your password after first login.`,
  });

  return NextResponse.json({ ok: true, email: request.email });
}
