import { HttpError, ok, readJson, route } from '@/server/http';
import { requireUser } from '@/server/auth/session';
import { listGallery, publishCircuit } from '@/server/services/gallery';
import { GALLERY_LIMITS, galleryInputSchema } from '@/shared/gallery';

/** GET /api/circuits[?scope=mine] — newest published circuits. */
export const GET = route(async (req: Request) => {
  const scope = new URL(req.url).searchParams.get('scope');
  if (scope && scope !== 'mine') throw new HttpError(400, 'Only scope=mine is supported.');
  const ownerId = scope === 'mine' ? (await requireUser()).id : undefined;
  return ok({ circuits: await listGallery(ownerId) });
});

/** POST /api/circuits — publish a circuit to the gallery. */
export const POST = route(async (req: Request) => {
  const user = await requireUser();
  const input = await readJson(req, galleryInputSchema, GALLERY_LIMITS.bodyBytes);
  return ok({ circuit: await publishCircuit(user, input) });
});
