import { ok, readJson, route } from '@/server/http';
import { setSessionCookie } from '@/server/auth/session';
import { clientIp } from '@/server/rateLimit';
import { signUp } from '@/server/services/auth';
import { signUpSchema } from '@/shared/validation';

export const POST = route(async (req: Request) => {
  const input = await readJson(req, signUpSchema, 8_000);
  const { user, token, expiresAt } = await signUp(input, clientIp(req));
  const res = ok({ user }, { status: 201 });
  setSessionCookie(res, token, expiresAt);
  return res;
});
