import 'server-only';
import type { Sql } from '../db';
import type { ChallengeProgress } from '@/shared/progress';

export async function getProgress(sql: Sql, userId: string): Promise<ChallengeProgress> {
  const rows = (await sql`SELECT challenge_slug, solved_at FROM challenge_progress WHERE user_id = ${userId}`) as { challenge_slug: string; solved_at: string | Date }[];
  return Object.fromEntries(rows.map((row) => [row.challenge_slug, { solvedAt: new Date(row.solved_at).toISOString() }]));
}

/** Adds solves; an existing solve keeps the earlier of the two times. */
export async function addProgress(sql: Sql, userId: string, progress: ChallengeProgress): Promise<void> {
  const slugs = Object.keys(progress);
  if (!slugs.length) return;
  const times = slugs.map((slug) => progress[slug].solvedAt);
  await sql`
    INSERT INTO challenge_progress (user_id, challenge_slug, solved_at)
    SELECT ${userId}, slug, solved_at::timestamptz
    FROM UNNEST(${slugs}::text[], ${times}::text[]) AS input(slug, solved_at)
    ON CONFLICT (user_id, challenge_slug) DO UPDATE SET solved_at = LEAST(challenge_progress.solved_at, EXCLUDED.solved_at)`;
}
