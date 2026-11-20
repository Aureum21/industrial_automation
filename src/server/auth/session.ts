import 'server-only';
import { cache } from 'react';
import { cookies } from 'next/headers';
import type { NextResponse } from 'next/server';
import { db, isDbConfigured, type Sql } from '../db';
import { HttpError } from '../http';
import { hashToken, newSessionToken } from './password';
import type { AuthUser } from '../repos/users';

export const SESSION_COOKIE = 'ah_session';
const SESSION_DAYS = 30;

export async function createSession(sql: Sql, userId: string): Promise<{ token: string; expiresAt: Date }> {
  const token = newSessionToken();
  const expiresAt = new Date(Date.now() + SESSION_DAYS * 24 * 60 * 60 * 1000);
  await sql`INSERT INTO sessions (id, user_id, expires_at) VALUES (${hashToken(token)}, ${userId}, ${expiresAt.toISOString()})`;
  // Opportunistic cleanup keeps the table small without a cron job.
  await sql`DELETE FROM sessions WHERE user_id = ${userId} AND expires_at < NOW()`;
  return { token, expiresAt };
}

export function setSessionCookie(res: NextResponse, token: string, expiresAt: Date): void {
  res.cookies.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    expires: expiresAt,
  });
}

export function clearSessionCookie(res: NextResponse): void {
  res.cookies.set(SESSION_COOKIE, '', { httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'lax', path: '/', maxAge: 0 });
}

/** The signed-in user for this request, or null. Cached for the duration of one request. */
export const getCurrentUser = cache(async (): Promise<AuthUser | null> => {
  if (!isDbConfigured()) return null;
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  if (!token) return null;
  const sql = await db();
  const rows = (await sql`
    SELECT u.id, u.name, u.email, u.is_owner
    FROM sessions s JOIN users u ON u.id = s.user_id
    WHERE s.id = ${hashToken(token)} AND s.expires_at > NOW()
    LIMIT 1`) as { id: string; name: string; email: string; is_owner: boolean }[];
  const row = rows[0];
  return row ? { id: row.id, name: row.name, email: row.email, isOwner: row.is_owner === true } : null;
});

export async function requireUser(): Promise<AuthUser> {
  const user = await getCurrentUser();
  if (!user) throw new HttpError(401, 'Please sign in to continue.');
  return user;
}

export async function destroyCurrentSession(): Promise<void> {
  if (!isDbConfigured()) return;
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  if (!token) return;
  const sql = await db();
  await sql`DELETE FROM sessions WHERE id = ${hashToken(token)}`;
}

/** Signs the user out everywhere except the current browser (used after a password change). */
export async function revokeOtherSessions(userId: string): Promise<void> {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  const sql = await db();
  await sql`DELETE FROM sessions WHERE user_id = ${userId} AND id <> ${token ? hashToken(token) : ''}`;
}
