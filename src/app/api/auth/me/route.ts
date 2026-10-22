import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getDb, isDbConfigured } from '@/lib/db';

export async function GET() {
  if (!isDbConfigured()) {
    return NextResponse.json({ ok: false, user: null, configured: false });
  }

  try {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get('station_session');

    if (!sessionCookie || !sessionCookie.value) {
      return NextResponse.json({ ok: false, user: null, configured: true });
    }

    const sql = getDb();
    if (!sql) {
      return NextResponse.json({ ok: false, user: null });
    }

    const rows = await sql`
      SELECT u.id, u.name, u.email, u.role, u.station_id, u.avatar, u.bio, u.created_at
      FROM sessions s
      JOIN users u ON s.user_id = u.id
      WHERE s.id = ${sessionCookie.value} AND s.expires_at > NOW()
      LIMIT 1;
    `;

    if (!rows || rows.length === 0) {
      return NextResponse.json({ ok: false, user: null, configured: true });
    }

    const u = rows[0] as {
      id: string;
      name: string;
      email: string;
      role: string;
      station_id: string;
      avatar: string;
      bio: string;
      created_at: string;
    };

    return NextResponse.json({
      ok: true,
      configured: true,
      user: {
        id: u.id,
        name: u.name,
        email: u.email,
        role: u.role,
        stationId: u.station_id,
        avatar: u.avatar,
        bio: u.bio,
        joinedDate: new Date(u.created_at).toLocaleDateString('en-US', {
          month: 'short',
          year: 'numeric',
        }),
      },
    });
  } catch (err) {
    console.error('Session check error:', err);
    return NextResponse.json({ ok: false, user: null, error: (err as Error).message });
  }
}
