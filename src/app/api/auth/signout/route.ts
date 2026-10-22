import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getDb, isDbConfigured } from '@/lib/db';

export async function POST() {
  try {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get('station_session');

    if (sessionCookie?.value && isDbConfigured()) {
      const sql = getDb();
      if (sql) {
        await sql`
          DELETE FROM sessions WHERE id = ${sessionCookie.value};
        `;
      }
    }

    const res = NextResponse.json({ ok: true, message: 'Signed out successfully.' });
    res.cookies.set('station_session', '', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 0,
    });

    return res;
  } catch (err) {
    console.error('Signout error:', err);
    return NextResponse.json({ ok: false, error: (err as Error).message }, { status: 500 });
  }
}
