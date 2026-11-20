import 'server-only';
import type { Sql } from './db';
import { HttpError } from './http';

/**
 * Fixed-window rate limiting stored in Postgres, so limits hold across serverless instances.
 * Each call counts one attempt; exceeding `limit` within `windowSeconds` throws HTTP 429.
 */
export interface RateRule {
  /** Namespace, e.g. 'signin-ip'. */
  name: string;
  limit: number;
  windowSeconds: number;
}

export const RATE_RULES = {
  signInPerIp: { name: 'signin-ip', limit: 20, windowSeconds: 15 * 60 },
  signInPerAccount: { name: 'signin-id', limit: 8, windowSeconds: 15 * 60 },
  signUpPerIp: { name: 'signup-ip', limit: 5, windowSeconds: 60 * 60 },
  passwordChangePerUser: { name: 'pwchange', limit: 5, windowSeconds: 15 * 60 },
  publishPerUser: { name: 'publish', limit: 60, windowSeconds: 60 * 60 },
  galleryPerUser: { name: 'gallery', limit: 30, windowSeconds: 60 * 60 },
} satisfies Record<string, RateRule>;

/** Client IP as reported by the hosting proxy (Vercel sets x-forwarded-for). */
export function clientIp(req: Request): string {
  const forwarded = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim();
  return forwarded || req.headers.get('x-real-ip')?.trim() || 'unknown';
}

export async function consumeRateLimit(sql: Sql, rule: RateRule, subject: string): Promise<void> {
  const key = `${rule.name}:${subject.toLowerCase()}`.slice(0, 255);
  const rows = (await sql`
    INSERT INTO rate_limits (key, window_start, count) VALUES (${key}, NOW(), 1)
    ON CONFLICT (key) DO UPDATE SET
      count = CASE WHEN rate_limits.window_start < NOW() - make_interval(secs => ${rule.windowSeconds}) THEN 1 ELSE rate_limits.count + 1 END,
      window_start = CASE WHEN rate_limits.window_start < NOW() - make_interval(secs => ${rule.windowSeconds}) THEN NOW() ELSE rate_limits.window_start END
    RETURNING count, EXTRACT(EPOCH FROM (window_start + make_interval(secs => ${rule.windowSeconds}) - NOW()))::int AS retry_after`) as { count: number; retry_after: number }[];
  // Occasionally drop stale counters so the table stays small.
  if (Math.random() < 0.02) await sql`DELETE FROM rate_limits WHERE window_start < NOW() - INTERVAL '1 day'`;
  const row = rows[0];
  if (row && Number(row.count) > rule.limit) {
    const minutes = Math.max(1, Math.ceil(Number(row.retry_after) / 60));
    throw new HttpError(429, `Too many attempts. Please wait ${minutes} minute${minutes === 1 ? '' : 's'} and try again.`);
  }
}
