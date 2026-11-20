import 'server-only';
import { db } from '../db';
import { HttpError } from '../http';
import { burnPasswordCheck, hashPassword, verifyPassword } from '../auth/password';
import { createSession, revokeOtherSessions } from '../auth/session';
import * as users from '../repos/users';
import type { AuthUser, PublicUser } from '../repos/users';
import type { z } from 'zod';
import type { changePasswordSchema, signInSchema, signUpSchema } from '@/shared/validation';

interface SessionResult {
  user: PublicUser;
  token: string;
  expiresAt: Date;
}

export async function signUp(input: z.infer<typeof signUpSchema>): Promise<SessionResult> {
  const sql = await db();
  if (await users.isNameOrEmailTaken(sql, input.name, input.email)) {
    throw new HttpError(409, 'That username or email is already registered.');
  }
  const row = await users.insertUser(sql, {
    name: input.name,
    email: input.email.toLowerCase(),
    passwordHash: await hashPassword(input.password),
    role: input.role || 'Engineer',
  });
  const session = await createSession(sql, row.id);
  return { user: users.toPublicUser(row), ...session };
}

export async function signIn(input: z.infer<typeof signInSchema>): Promise<SessionResult> {
  const sql = await db();
  const row = await users.findUserForSignIn(sql, input.identifier);
  if (!row) {
    await burnPasswordCheck(input.password);
    throw new HttpError(401, 'Incorrect username/email or password.');
  }
  if (!(await verifyPassword(input.password, row.password_hash))) {
    throw new HttpError(401, 'Incorrect username/email or password.');
  }
  const session = await createSession(sql, row.id);
  return { user: users.toPublicUser(row), ...session };
}

export async function getProfile(user: AuthUser): Promise<PublicUser> {
  const sql = await db();
  const row = await users.findUserById(sql, user.id);
  if (!row) throw new HttpError(401, 'Please sign in to continue.');
  return users.toPublicUser(row);
}

/** Changes the signed-in user's password. Other sessions of that user are signed out. */
export async function changePassword(user: AuthUser, input: z.infer<typeof changePasswordSchema>): Promise<void> {
  const sql = await db();
  const row = await users.findUserById(sql, user.id);
  if (!row || !(await verifyPassword(input.currentPassword, row.password_hash))) {
    throw new HttpError(401, 'Your current password is incorrect.');
  }
  await users.updatePasswordHash(sql, user.id, await hashPassword(input.newPassword));
  await revokeOtherSessions(user.id);
}
