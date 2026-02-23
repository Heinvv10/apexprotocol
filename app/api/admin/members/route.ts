import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { getSession } from '@/lib/auth';
import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  host: 'smtp.apexprotocol.co.za',
  port: 465,
  secure: true,
  auth: { user: 'orders@apexprotocol.co.za', pass: 'Mitzi@19780203' },
  tls: { rejectUnauthorized: false },
});

export async function GET() {
  const session = await getSession();
  if (!session?.is_admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const db = getDb();
  
  // Get members with order statistics
  const members = await db.prepare(`
    SELECT 
      u.id,
      u.name,
      u.email,
      u.phone,
      u.referral,
      u.approved,
      u.is_admin,
      u.created_at,
      COUNT(o.id) as order_count,
      SUM(CASE WHEN o.status IN ('Completed', 'Delivered') THEN 1 ELSE 0 END) as completed_orders,
      SUM(CASE WHEN o.status NOT IN ('Completed', 'Delivered', 'Cancelled') THEN 1 ELSE 0 END) as pending_orders,
      COALESCE(SUM(o.total), 0) as total_spent,
      MAX(o.created_at) as last_order_date
    FROM users u
    LEFT JOIN orders o ON u.id = o.user_id
    WHERE u.is_admin = 0
    GROUP BY u.id, u.name, u.email, u.phone, u.referral, u.approved, u.is_admin, u.created_at
    ORDER BY u.created_at DESC
  `).all();

  return NextResponse.json({ members });
}

export async function PATCH(req: NextRequest) {
  const session = await getSession();
  if (!session?.is_admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { userId, action } = await req.json();
  if (!userId || !['approve', 'reject'].includes(action)) {
    return NextResponse.json({ error: 'userId and action (approve/reject) required' }, { status: 400 });
  }

  const db = getDb();
  const user = await db.prepare('SELECT * FROM users WHERE id = ?').get(userId) as any;
  if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });

  if (action === 'approve') {
    await db.prepare('UPDATE users SET approved = 1 WHERE id = ?').run(userId);

    // Send approval email
    const html = `
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
            <p style="font-family:Arial;font-size:16px;color:#e5e7eb;margin:0;">Hi ${user.name.split(' ')[0]},</p>
            <p style="font-family:Arial;font-size:14px;color:#9ca3af;margin:15px 0 0;line-height:1.6;">
              Your access request has been <strong style="color:#00d4ff;">approved</strong>. Welcome to Apex Protocol.
            </p>
            <p style="font-family:Arial;font-size:14px;color:#9ca3af;margin:10px 0 0;line-height:1.6;">
              You can now log in with the email and password you registered with.
            </p>
          </td>
        </tr>
        <tr>
          <td style="padding:20px 40px;text-align:center;">
            <a href="https://apexprotocol.co.za/auth/login" style="display:inline-block;background:#00d4ff;color:#000;font-family:Arial;font-size:14px;font-weight:bold;padding:12px 30px;border-radius:6px;text-decoration:none;letter-spacing:1px;">SIGN IN NOW</a>
          </td>
        </tr>
        <tr>
          <td style="padding:10px 40px 30px;">
            <p style="font-family:Arial;font-size:13px;color:#6b7280;margin:0;text-align:center;">Browse our catalog and place your first order.</p>
          </td>
        </tr>
        <tr>
          <td style="background-color:#0d1117;padding:15px 40px;text-align:center;border-top:1px solid #1f2937;">
            <p style="font-family:Arial;font-size:11px;color:#4b5563;margin:0;letter-spacing:1px;">APEX PROTOCOL — orders@apexprotocol.co.za</p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body></html>`;

    try {
      await transporter.sendMail({
        from: '"Apex Protocol" <orders@apexprotocol.co.za>',
        to: user.email,
        subject: 'Access Approved — Welcome to Apex Protocol',
        html,
        text: `Hi ${user.name.split(' ')[0]}, your access request has been approved! Log in at https://apexprotocol.co.za/auth/login with your registered email and password.`,
      });
    } catch (e) {
      console.error('Failed to send approval email:', e);
    }

    return NextResponse.json({ ok: true, message: 'User approved' });
  }

  if (action === 'reject') {
    await db.prepare('DELETE FROM users WHERE id = ?').run(userId);
    return NextResponse.json({ ok: true, message: 'User rejected and removed' });
  }
}
