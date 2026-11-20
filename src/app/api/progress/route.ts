import { ok, readJson, route } from '@/server/http';
import { requireUser } from '@/server/auth/session';
import { loadProgress, syncProgress } from '@/server/services/progress';
import { progressInputSchema } from '@/shared/progress';

/** GET /api/progress — the signed-in user's solved challenges. */
export const GET = route(async () => {
  const user = await requireUser();
  return ok({ progress: await loadProgress(user) });
});

/** POST /api/progress — merge solves from this browser; returns the merged progress. */
export const POST = route(async (req: Request) => {
  const user = await requireUser();
  const { solved } = await readJson(req, progressInputSchema, 20_000);
  return ok({ progress: await syncProgress(user, solved) });
});
