import { ok, readJson, route } from '@/server/http';
import { setSessionCookie } from '@/server/auth/session';
import { clientIp } from '@/server/rateLimit';
import { signIn } from '@/server/services/auth';
import { signInSchema } from '@/shared/validation';

export const POST = route(async (req: Request) => {
  const input = await readJson(req, signInSchema, 4_000);
  const { user, token, expiresAt } = await signIn(input, clientIp(req));
  const res = ok({ user });
  setSessionCookie(res, token, expiresAt);
  return res;
});
