import 'server-only';
import { randomBytes } from 'node:crypto';
import { cache } from 'react';
import { connection } from 'next/server';
import { db, isDbConfigured } from '../db';
import { HttpError } from '../http';
import { RATE_RULES, consumeRateLimit } from '../rateLimit';
import type { AuthUser } from '../repos/users';
import * as gallery from '../repos/gallery';
import { parseCircuitDocument } from '@/lib/automation/documents';
import { GALLERY_LIMITS, type GalleryCircuit, type GalleryInput, type GallerySummary } from '@/shared/gallery';
import { canDeleteGalleryCircuit } from '@/shared/permissions';

export async function listGallery(ownerId?: string): Promise<GallerySummary[]> {
  await connection();
  if (!isDbConfigured()) return [];
  return gallery.listCircuits(await db(), GALLERY_LIMITS.pageSize, ownerId);
}

export const getGalleryCircuit = cache(async (id: string): Promise<GalleryCircuit | null> => {
  await connection();
  if (!isDbConfigured()) return null;
  return gallery.getCircuit(await db(), id);
});

export async function publishCircuit(user: AuthUser, input: GalleryInput): Promise<GallerySummary> {
  const sql = await db();
  await consumeRateLimit(sql, RATE_RULES.galleryPerUser, user.id);
  let document;
  try {
    // Same validation as importing a file: known blocks, valid parameters and wiring, size limits.
    document = parseCircuitDocument(JSON.stringify(input.document ?? null));
  } catch (error) {
    throw new HttpError(400, error instanceof Error ? error.message : 'The circuit is not valid.');
  }
  if (!document.blocks.length) throw new HttpError(400, 'Add some blocks before publishing.');
  document.name = input.title;
  const forkedFrom = input.forkedFrom && (await gallery.getCircuit(sql, input.forkedFrom)) ? input.forkedFrom : null;
  const id = randomBytes(9).toString('base64url');
  await gallery.insertCircuit(sql, { id, ownerId: user.id, title: input.title, description: input.description, document, forkedFrom });
  const saved = await gallery.getCircuit(sql, id);
  if (!saved) throw new HttpError(500, 'The circuit was not saved. Please try again.');
  const { document: _document, ...summary } = saved;
  void _document;
  return summary;
}

export async function removeCircuit(user: AuthUser, id: string): Promise<void> {
  const sql = await db();
  const circuit = await gallery.getCircuit(sql, id);
  if (!circuit) throw new HttpError(404, 'This circuit no longer exists.');
  if (!canDeleteGalleryCircuit(user, circuit)) throw new HttpError(403, 'Only the author or the site owner can delete this circuit.');
  await gallery.deleteCircuit(sql, id);
}
