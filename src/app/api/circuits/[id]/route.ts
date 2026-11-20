import { HttpError, ok, route } from '@/server/http';
import { requireUser } from '@/server/auth/session';
import { getGalleryCircuit, removeCircuit } from '@/server/services/gallery';
import { galleryIdSchema } from '@/shared/gallery';

type Context = { params: Promise<{ id: string }> };

async function circuitId(context: Context): Promise<string> {
  const parsed = galleryIdSchema.safeParse((await context.params).id);
  if (!parsed.success) throw new HttpError(404, 'This circuit does not exist.');
  return parsed.data;
}

export const GET = route(async (_req: Request, context: Context) => {
  const circuit = await getGalleryCircuit(await circuitId(context));
  if (!circuit) throw new HttpError(404, 'This circuit does not exist.');
  return ok({ circuit });
});

export const DELETE = route(async (_req: Request, context: Context) => {
  const user = await requireUser();
  await removeCircuit(user, await circuitId(context));
  return ok({ deleted: true });
});
