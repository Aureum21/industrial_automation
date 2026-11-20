import { ok, route } from '@/server/http';
import { db, isDbConfigured } from '@/server/db';

/** Liveness check. Deliberately reveals nothing beyond up/down. */
export const GET = route(async () => {
  if (!isDbConfigured()) return ok({ status: 'ok', database: 'not_configured' });
  try {
    const sql = await db();
    await sql`SELECT 1`;
    return ok({ status: 'ok', database: 'up' });
  } catch (error) {
    console.error('Health check failed:', error);
    return ok({ status: 'degraded', database: 'down' }, { status: 503 });
  }
});
