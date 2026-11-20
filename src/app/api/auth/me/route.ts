import { ok, route } from '@/server/http';
import { getCurrentUser } from '@/server/auth/session';
import { isDbConfigured } from '@/server/db';
import { getProfile } from '@/server/services/auth';

/** The signed-in user's profile, or `user: null`. `accounts` tells the UI whether sign-in is available. */
export const GET = route(async () => {
  if (!isDbConfigured()) return ok({ user: null, accounts: false });
  const session = await getCurrentUser();
  return ok({ user: session ? await getProfile(session) : null, accounts: true });
});
