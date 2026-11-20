import { z } from 'zod';
import { CHALLENGES } from '../lib/challenges/catalog.ts';

/** slug → when it was first solved (ISO string). */
export type ChallengeProgress = Record<string, { solvedAt: string }>;

const KNOWN = new Set(CHALLENGES.map((challenge) => challenge.slug));

export const progressInputSchema = z.object({
  solved: z
    .array(z.object({ slug: z.string().max(64), solvedAt: z.string().max(40) }))
    .max(200),
});

/**
 * Cleans progress sent by a client: unknown challenges are dropped, unreadable or future
 * timestamps become `now`, and duplicates keep the earliest time.
 */
export function sanitizeProgress(entries: { slug: string; solvedAt: string }[], now = new Date()): ChallengeProgress {
  const out: ChallengeProgress = {};
  for (const { slug, solvedAt } of entries) {
    if (!KNOWN.has(slug)) continue;
    const time = new Date(solvedAt);
    const valid = !Number.isNaN(time.getTime()) && time <= now && time.getFullYear() >= 2024 ? time : now;
    const iso = valid.toISOString();
    if (!out[slug] || iso < out[slug].solvedAt) out[slug] = { solvedAt: iso };
  }
  return out;
}

/** Union of two progress maps, keeping the earliest solve time per challenge. */
export function mergeProgress(a: ChallengeProgress, b: ChallengeProgress): ChallengeProgress {
  const out: ChallengeProgress = { ...a };
  for (const [slug, entry] of Object.entries(b)) {
    if (!out[slug] || entry.solvedAt < out[slug].solvedAt) out[slug] = entry;
  }
  return out;
}

export const toEntries = (progress: ChallengeProgress) => Object.entries(progress).map(([slug, { solvedAt }]) => ({ slug, solvedAt }));
