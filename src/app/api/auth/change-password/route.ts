import { ok, readJson, route } from '@/server/http';
import { requireUser } from '@/server/auth/session';
import { changePassword } from '@/server/services/auth';
import { changePasswordSchema } from '@/shared/validation';

export const POST = route(async (req: Request) => {
  const user = await requireUser();
  const input = await readJson(req, changePasswordSchema, 4_000);
  await changePassword(user, input);
  return ok({ changed: true });
});
