import 'server-only';
import { db } from '../db';
import { addProgress, getProgress } from '../repos/progress';
import { consumeRateLimit, RATE_RULES } from '../rateLimit';
import type { AuthUser } from '../repos/users';
import { sanitizeProgress, type ChallengeProgress } from '@/shared/progress';

export async function loadProgress(user: AuthUser): Promise<ChallengeProgress> {
  return getProgress(await db(), user.id);
}

/** Merges the client's solves into the account and returns the account's full progress. */
export async function syncProgress(user: AuthUser, solved: { slug: string; solvedAt: string }[]): Promise<ChallengeProgress> {
  const sql = await db();
  await consumeRateLimit(sql, RATE_RULES.progressPerUser, user.id);
  await addProgress(sql, user.id, sanitizeProgress(solved));
  return getProgress(sql, user.id);
}
