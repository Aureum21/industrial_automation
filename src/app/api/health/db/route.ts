import { NextResponse } from 'next/server';
import { getDb, initDb, isDbConfigured } from '@/lib/db';

export async function GET() {
  if (!isDbConfigured()) {
    return NextResponse.json({
      ok: false,
      status: 'NOT_CONFIGURED',
      message:
        'DATABASE_URL environment variable is not defined. Paste your Neon connection string in .env.local and Vercel Environment Variables.',
    });
  }

  try {
    const initResult = await initDb();
    const sql = getDb();

    if (!sql) {
      return NextResponse.json({
        ok: false,
        status: 'CONNECTION_FAILED',
        message: 'Could not instantiate Neon SQL client.',
      });
    }

    const result = await sql`SELECT NOW() as db_time, current_database() as db_name, version() as pg_version;`;
    const userCount = await sql`SELECT COUNT(*)::int as count FROM users;`;

    return NextResponse.json({
      ok: true,
      status: 'CONNECTED',
      database: result[0]?.db_name,
      dbTime: result[0]?.db_time,
      version: result[0]?.pg_version,
      usersCount: userCount[0]?.count,
      initResult,
      message: 'Successfully connected to Neon PostgreSQL database.',
    });
  } catch (err) {
    return NextResponse.json(
      {
        ok: false,
        status: 'ERROR',
        error: (err as Error).message,
        hint: 'Check that your Neon project is active and that your connection string includes sslmode=require',
      },
      { status: 500 }
    );
  }
}
