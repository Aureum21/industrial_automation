import { HttpError, ok, readJson, route } from '@/server/http';
import { requireUser } from '@/server/auth/session';
import { listManageableArticles, saveArticle } from '@/server/services/articles';
import { ARTICLE_LIMITS } from '@/shared/articles';
import { articleInputSchema } from '@/shared/validation';

/** GET /api/articles?scope=mine — articles the signed-in user can manage (Studio). */
export const GET = route(async (req: Request) => {
  const scope = new URL(req.url).searchParams.get('scope');
  if (scope !== 'mine') throw new HttpError(400, 'Only scope=mine is supported. Public pages read articles on the server.');
  const user = await requireUser();
  return ok({ articles: await listManageableArticles(user) });
});

/** POST /api/articles — create or update an article (permission rules in shared/permissions). */
export const POST = route(async (req: Request) => {
  const user = await requireUser();
  const input = await readJson(req, articleInputSchema, ARTICLE_LIMITS.bodyBytes);
  return ok({ article: await saveArticle(user, input) });
});
