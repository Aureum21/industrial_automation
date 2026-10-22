import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getDb, isDbConfigured, initDb } from '@/lib/db';
import { verifyPassword, hashPassword } from '@/lib/authCrypto';

export async function POST(req: Request) {
  if (!isDbConfigured()) {
    return NextResponse.json(
      { ok: false, error: 'Database is not configured. Please add DATABASE_URL.' },
      { status: 503 }
    );
  }

  try {
    await initDb();
    const sql = getDb();
    if (!sql) {
      return NextResponse.json({ ok: false, error: 'Database unavailable' }, { status: 500 });
    }

    const body = await req.json();
    const { emailOrUsername, currentPassword, newPassword } = body;

    const cleanNewPass = (newPassword || '').trim();
    const cleanCurrentPass = (currentPassword || '').trim();

    if (!cleanNewPass || cleanNewPass.length < 6) {
      return NextResponse.json(
        { ok: false, error: 'New password must be at least 6 characters long.' },
        { status: 400 }
      );
    }

    if (!cleanCurrentPass) {
      return NextResponse.json(
        { ok: false, error: 'Current password is required to confirm identity.' },
        { status: 400 }
      );
    }

    let userRow: { id: string; password_hash: string; name: string } | null = null;

    // 1. Try resolving user via active session cookie first
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get('station_session');

    if (sessionCookie?.value) {
      const rows = await sql`
        SELECT u.id, u.password_hash, u.name
        FROM sessions s
        JOIN users u ON s.user_id = u.id
        WHERE s.id = ${sessionCookie.value} AND s.expires_at > NOW()
        LIMIT 1;
      `;
      if (rows && rows.length > 0) {
        userRow = rows[0] as { id: string; password_hash: string; name: string };
      }
    }

    // 2. If not found via session, try finding via emailOrUsername identifier
    if (!userRow && emailOrUsername) {
      const identifier = emailOrUsername.trim();
      const rows = await sql`
        SELECT id, password_hash, name
        FROM users
        WHERE LOWER(email) = LOWER(${identifier})
           OR LOWER(name) = LOWER(${identifier})
           OR LOWER(SPLIT_PART(name, ' ', 1)) = LOWER(${identifier})
        LIMIT 1;
      `;
      if (rows && rows.length > 0) {
        userRow = rows[0] as { id: string; password_hash: string; name: string };
      }
    }

    if (!userRow) {
      return NextResponse.json(
        { ok: false, error: 'User account not found. Please log in first or check your username/email.' },
        { status: 404 }
      );
    }

    // 3. Verify current password
    const isCurrentValid = await verifyPassword(cleanCurrentPass, userRow.password_hash);
    if (!isCurrentValid) {
      return NextResponse.json(
        { ok: false, error: 'Current password is incorrect.' },
        { status: 401 }
      );
    }

    // 4. Hash new password and update in Neon DB
    const newHash = await hashPassword(cleanNewPass);
    await sql`
      UPDATE users
      SET password_hash = ${newHash}
      WHERE id = ${userRow.id};
    `;

    return NextResponse.json({
      ok: true,
      message: `Password updated successfully for ${userRow.name}. You can now sign in with your new password.`,
    });
  } catch (err) {
    console.error('Change password error:', err);
    return NextResponse.json(
      { ok: false, error: (err as Error).message || 'Failed to update password.' },
      { status: 500 }
    );
  }
}
