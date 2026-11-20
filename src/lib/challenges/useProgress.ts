'use client';

import { useCallback, useEffect } from 'react';
import { progressApi } from '@/lib/api/client';
import { useSession } from '@/lib/auth';
import { useStoredValue, writeStoredValue } from '@/lib/useStoredValue';
import { mergeProgress, toEntries, type ChallengeProgress } from '@/shared/progress';
import { PROGRESS_KEY } from './starter';

const NO_PROGRESS: ChallengeProgress = {};
const syncedFor = new Set<string>();

function readLocal(): ChallengeProgress {
  try {
    return JSON.parse(localStorage.getItem(PROGRESS_KEY) ?? '{}') as ChallengeProgress;
  } catch {
    return {};
  }
}

async function push(progress: ChallengeProgress) {
  const result = await progressApi.sync(toEntries(progress));
  // Merge again with whatever was solved locally while the request was in flight.
  if (result.ok) writeStoredValue(PROGRESS_KEY, mergeProgress(readLocal(), result.data.progress));
}

/**
 * Challenge progress, stored in this browser and, when signed in, in the account.
 * On sign-in the two are merged (union, earliest solve time wins), once per page load per user.
 */
export function useChallengeProgress(): [ChallengeProgress, (slug: string) => void] {
  const { user } = useSession();
  const [progress] = useStoredValue<ChallengeProgress>(PROGRESS_KEY, NO_PROGRESS);
  const userId = user?.id;

  useEffect(() => {
    if (!userId || syncedFor.has(userId)) return;
    syncedFor.add(userId);
    void push(readLocal());
  }, [userId]);

  const markSolved = useCallback(
    (slug: string) => {
      const local = readLocal();
      if (local[slug]) return;
      const entry = { [slug]: { solvedAt: new Date().toISOString() } };
      writeStoredValue(PROGRESS_KEY, { ...local, ...entry });
      if (userId) void push(entry);
    },
    [userId],
  );

  return [progress, markSolved];
}
