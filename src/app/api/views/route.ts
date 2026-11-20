import { z } from 'zod';
import { HttpError, ok, readJson, route } from '@/server/http';
import { db, isDbConfigured } from '@/server/db';
import { getAllViewCounts, incrementViewCount } from '@/server/repos/views';
import { slugSchema } from '@/shared/validation';

export const GET = route(async () => {
  if (!isDbConfigured()) return ok({ views: {} });
  return ok({ views: await getAllViewCounts(await db()) });
});

/** Records one read. The client sends this at most once per browser session per post. */
export const POST = route(async (req: Request) => {
  const { slug } = await readJson(req, z.object({ slug: slugSchema }), 1_000);
  if (!isDbConfigured()) throw new HttpError(503, 'Read counts are not available on this deployment.');
  return ok({ slug, views: await incrementViewCount(await db(), slug) });
});
