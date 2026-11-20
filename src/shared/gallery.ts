import { z } from 'zod';
import type { CircuitDocument } from '../lib/automation/types.ts';

export const GALLERY_LIMITS = { title: 120, description: 2000, bodyBytes: 400_000, pageSize: 60 } as const;

export const galleryInputSchema = z.object({
  title: z.string().trim().min(3, 'Give the circuit a title of at least 3 characters.').max(GALLERY_LIMITS.title),
  description: z.string().trim().max(GALLERY_LIMITS.description).default(''),
  /** Validated again with parseCircuitDocument on the server. */
  document: z.unknown(),
  forkedFrom: z.string().regex(/^[A-Za-z0-9_-]{6,32}$/).optional(),
});
export type GalleryInput = z.infer<typeof galleryInputSchema>;

export const galleryIdSchema = z.string().regex(/^[A-Za-z0-9_-]{6,32}$/, 'Unknown circuit.');

export interface GallerySummary {
  id: string;
  title: string;
  description: string;
  author: string;
  ownerId: string;
  blockCount: number;
  forkedFrom: string | null;
  createdAt: string;
}

export interface GalleryCircuit extends GallerySummary {
  document: CircuitDocument;
}
