import 'server-only';
import { randomBytes } from 'node:crypto';
import type { Sql } from '../db';

interface UserRow {
  id: string;
  name: string;
  email: string;
  password_hash: string;
  role: string | null;
  bio: string | null;
  created_at: string;
  is_owner: boolean;
}

/** What the API ever reveals about a user. Email is included only for the user themselves. */
export interface PublicUser {
  id: string;
  name: string;
  email: string;
  role: string;
  bio: string;
  joinedDate: string;
  isOwner: boolean;
}

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  isOwner: boolean;
}

export function toPublicUser(row: Omit<UserRow, 'password_hash'>): PublicUser {
  return {
    id: row.id,
    name: row.name,
    email: row.email,
    role: row.role ?? '',
    bio: row.bio ?? '',
    joinedDate: new Date(row.created_at).toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
    isOwner: row.is_owner === true,
  };
}

/** Exact, case-insensitive match on email or username. */
export async function findUserForSignIn(sql: Sql, identifier: string): Promise<UserRow | null> {
  const rows = (await sql`
    SELECT id, name, email, password_hash, role, bio, created_at, is_owner
    FROM users
    WHERE LOWER(email) = LOWER(${identifier}) OR LOWER(name) = LOWER(${identifier})
    ORDER BY (LOWER(email) = LOWER(${identifier})) DESC
    LIMIT 1`) as UserRow[];
  return rows[0] ?? null;
}

export async function findUserById(sql: Sql, id: string): Promise<UserRow | null> {
  const rows = (await sql`
    SELECT id, name, email, password_hash, role, bio, created_at, is_owner
    FROM users WHERE id = ${id} LIMIT 1`) as UserRow[];
  return rows[0] ?? null;
}

export async function isNameOrEmailTaken(sql: Sql, name: string, email: string): Promise<boolean> {
  const rows = (await sql`
    SELECT 1 FROM users WHERE LOWER(email) = LOWER(${email}) OR LOWER(name) = LOWER(${name}) LIMIT 1`) as unknown[];
  return rows.length > 0;
}

export async function insertUser(
  sql: Sql,
  input: { name: string; email: string; passwordHash: string; role: string },
): Promise<UserRow> {
  const id = `usr-${randomBytes(9).toString('base64url')}`;
  const rows = (await sql`
    INSERT INTO users (id, name, email, password_hash, role, bio, is_owner)
    VALUES (${id}, ${input.name}, ${input.email}, ${input.passwordHash}, ${input.role}, '', FALSE)
    RETURNING id, name, email, password_hash, role, bio, created_at, is_owner`) as UserRow[];
  return rows[0];
}

export async function updatePasswordHash(sql: Sql, userId: string, passwordHash: string): Promise<void> {
  await sql`UPDATE users SET password_hash = ${passwordHash} WHERE id = ${userId}`;
}
