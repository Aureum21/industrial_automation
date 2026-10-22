import { NextResponse } from 'next/server';
import { getDb, initDb, isDbConfigured } from '@/lib/db';
import { verifyPassword, generateSessionId } from '@/lib/authCrypto';

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
    const { emailOrUsername, password } = body;

    const identifier = (emailOrUsername || '').trim();
    const cleanPassword = (password || '').trim();

    if (!identifier || !cleanPassword) {
      return NextResponse.json(
        { ok: false, error: 'Username/Email and password are required.' },
        { status: 400 }
      );
    }

    // Query user by email, full name, or username/first name (case-insensitive)
    const rows = await sql`
      SELECT id, name, email, password_hash, role, station_id, avatar, bio, created_at
      FROM users
      WHERE LOWER(email) = LOWER(${identifier}) 
         OR LOWER(name) = LOWER(${identifier})
         OR LOWER(SPLIT_PART(name, ' ', 1)) = LOWER(${identifier})
      LIMIT 1;
    `;

    if (!rows || rows.length === 0) {
      return NextResponse.json(
        { ok: false, error: 'Invalid username/email or password.' },
        { status: 401 }
      );
    }

    const userRow = rows[0] as {
      id: string;
      name: string;
      email: string;
      password_hash: string;
      role: string;
      station_id: string;
      avatar: string;
      bio: string;
      created_at: string;
    };

    const isMatch = await verifyPassword(cleanPassword, userRow.password_hash);
    if (!isMatch) {
      return NextResponse.json(
        { ok: false, error: 'Invalid username/email or password.' },
        { status: 401 }
      );
    }

    // Create a 30-day session
    const sessionId = generateSessionId();
    const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

    await sql`
      INSERT INTO sessions (id, user_id, expires_at)
      VALUES (${sessionId}, ${userRow.id}, ${expiresAt.toISOString()});
    `;

    const userPayload = {
      id: userRow.id,
      name: userRow.name,
      email: userRow.email,
      role: userRow.role,
      stationId: userRow.station_id,
      avatar: userRow.avatar,
      bio: userRow.bio,
      joinedDate: new Date(userRow.created_at).toLocaleDateString('en-US', {
        month: 'short',
        year: 'numeric',
      }),
    };

    const res = NextResponse.json({
      ok: true,
      user: userPayload,
      message: 'Console session authenticated successfully.',
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
    console.error('Sign-in error:', err);
    return NextResponse.json(
      { ok: false, error: (err as Error).message || 'Internal server error' },
      { status: 500 }
    );
  }
}
