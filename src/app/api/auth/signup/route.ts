import { NextResponse } from 'next/server';
import { getDb, initDb, isDbConfigured } from '@/lib/db';
import { hashPassword, generateSessionId } from '@/lib/authCrypto';

export async function POST(req: Request) {
  if (!isDbConfigured()) {
    return NextResponse.json(
      {
        ok: false,
        error: 'Neon PostgreSQL database is not connected. Add DATABASE_URL to your environment variables to enable live user accounts.',
      },
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
    const { name, email, password, stationId, role, bio } = body;

    const trimmedName = (name || '').trim();
    const trimmedEmail = (email || '').trim().toLowerCase();
    const cleanPassword = (password || '').trim();

    if (!trimmedName || !trimmedEmail || !cleanPassword) {
      return NextResponse.json(
        { ok: false, error: 'Name, email, and password are required.' },
        { status: 400 }
      );
    }

    if (cleanPassword.length < 6) {
      return NextResponse.json(
        { ok: false, error: 'Password must be at least 6 characters long.' },
        { status: 400 }
      );
    }

    // Check if email or username already taken
    const existing = await sql`
      SELECT id FROM users 
      WHERE LOWER(email) = ${trimmedEmail} OR LOWER(name) = LOWER(${trimmedName})
      LIMIT 1;
    `;

    if (existing && existing.length > 0) {
      return NextResponse.json(
        { ok: false, error: 'An engineer account with this email or username already exists.' },
        { status: 409 }
      );
    }

    // Hash password
    const passwordHash = await hashPassword(cleanPassword);
    const userId = `usr-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;
    const avatar = trimmedName
      .split(' ')
      .filter(Boolean)
      .slice(0, 2)
      .map((n: string) => n[0].toUpperCase())
      .join('') || 'OP';

    const assignedRole = role || 'Certified Controls Engineer';
    const assignedStation = stationId || 'TERMINAL-LOCAL-01';

    // Insert user
    await sql`
      INSERT INTO users (id, name, email, password_hash, role, station_id, avatar, bio)
      VALUES (${userId}, ${trimmedName}, ${trimmedEmail}, ${passwordHash}, ${assignedRole}, ${assignedStation}, ${avatar}, ${bio || ''});
    `;

    // Create 30-day session
    const sessionId = generateSessionId();
    const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

    await sql`
      INSERT INTO sessions (id, user_id, expires_at)
      VALUES (${sessionId}, ${userId}, ${expiresAt.toISOString()});
    `;

    const userPayload = {
      id: userId,
      name: trimmedName,
      email: trimmedEmail,
      role: assignedRole,
      stationId: assignedStation,
      avatar,
      bio: bio || '',
      joinedDate: new Date().toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
    };

    const res = NextResponse.json({
      ok: true,
      user: userPayload,
      message: 'Account successfully registered and connected to Neon Database.',
    });

    res.cookies.set('station_session', sessionId, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      expires: expiresAt,
    });

    return res;
  } catch (err) {
    console.error('Signup error:', err);
    return NextResponse.json(
      { ok: false, error: (err as Error).message || 'Internal server error' },
      { status: 500 }
    );
  }
}
