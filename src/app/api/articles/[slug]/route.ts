import { HttpError, ok, route } from '@/server/http';
import { requireUser } from '@/server/auth/session';
import { getStoredArticle, removeArticle } from '@/server/services/articles';
import { slugSchema } from '@/shared/validation';

type Context = { params: Promise<{ slug: string }> };

async function readSlug(context: Context): Promise<string> {
  const parsed = slugSchema.safeParse((await context.params).slug);
  if (!parsed.success) throw new HttpError(400, 'Invalid article slug.');
  return parsed.data;
}

export const GET = route(async (_req: Request, context: Context) => {
  const article = await getStoredArticle(await readSlug(context));
  if (!article) throw new HttpError(404, 'Article not found.');
  return ok({ article });
});

export const DELETE = route(async (_req: Request, context: Context) => {
  const user = await requireUser();
  await removeArticle(user, await readSlug(context));
  return ok({ deleted: true });
});
