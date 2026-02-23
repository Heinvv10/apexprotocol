import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

export async function POST(req: NextRequest) {
  const { firstName, lastName, email, referral, message } = await req.json();
  if (!firstName || !lastName || !email || !referral) {
    return NextResponse.json({ error: 'Required fields missing' }, { status: 400 });
  }

  const db = getDb();
  // Ensure contact_requests table exists with referral column
  db.exec(`
    CREATE TABLE IF NOT EXISTS contact_requests (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      first_name TEXT NOT NULL,
      last_name TEXT NOT NULL,
      email TEXT NOT NULL,
      referral TEXT,
      message TEXT,
      created_at TEXT DEFAULT (datetime('now'))
    )
  `);

  // Add referral column if it doesn't exist (migration)
  try {
    db.exec(`ALTER TABLE contact_requests ADD COLUMN referral TEXT`);
  } catch {}

  db.prepare('INSERT INTO contact_requests (first_name, last_name, email, referral, message) VALUES (?, ?, ?, ?, ?)')
    .run(firstName, lastName, email, referral, message || null);

  // Send email notification to admin
  const emailBody = `New access request received:

Name: ${firstName} ${lastName}
Email: ${email}
Referred by: ${referral}
Message: ${message || 'None'}

Submitted: ${new Date().toLocaleString('en-ZA', { timeZone: 'Africa/Johannesburg' })}
`;

  try {
    // Send email via himalaya
    const tempFile = `/tmp/contact-${Date.now()}.txt`;
    require('fs').writeFileSync(tempFile, emailBody);
    
    await execAsync(
      `himalaya -a orders message send --to "admin@apexprotocol.co.za" --subject "New Access Request - ${firstName} ${lastName}" --body "${tempFile}"`
    );
    
    require('fs').unlinkSync(tempFile);
  } catch (err) {
    console.error('Failed to send email notification:', err);
    // Don't fail the request if email fails
  }

  return NextResponse.json({ ok: true });
}
