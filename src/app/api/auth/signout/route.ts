import { ok, route } from '@/server/http';
import { clearSessionCookie, destroyCurrentSession } from '@/server/auth/session';

export const POST = route(async () => {
  await destroyCurrentSession();
  const res = ok({ signedOut: true });
  clearSessionCookie(res);
  return res;
});
