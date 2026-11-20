import 'server-only';
import type { Sql } from '../db';
import type { CircuitDocument } from '@/lib/automation/types';
import type { GalleryCircuit, GallerySummary } from '@/shared/gallery';

interface Row {
  id: string;
  title: string;
  description: string;
  author: string;
  owner_id: string;
  block_count: number;
  forked_from: string | null;
  created_at: string | Date;
  document?: CircuitDocument | string;
}

const toSummary = (row: Row): GallerySummary => ({
  id: row.id,
  title: row.title,
  description: row.description,
  author: row.author,
  ownerId: row.owner_id,
  blockCount: Number(row.block_count) || 0,
  forkedFrom: row.forked_from,
  createdAt: new Date(row.created_at).toISOString(),
});

export async function listCircuits(sql: Sql, limit: number, ownerId?: string): Promise<GallerySummary[]> {
  const rows = (ownerId
    ? await sql`
        SELECT g.id, g.title, g.description, u.name AS author, g.owner_id, g.block_count, g.forked_from, g.created_at
        FROM gallery_circuits g JOIN users u ON u.id = g.owner_id
        WHERE g.owner_id = ${ownerId} ORDER BY g.created_at DESC LIMIT ${limit}`
    : await sql`
        SELECT g.id, g.title, g.description, u.name AS author, g.owner_id, g.block_count, g.forked_from, g.created_at
        FROM gallery_circuits g JOIN users u ON u.id = g.owner_id
        ORDER BY g.created_at DESC LIMIT ${limit}`) as Row[];
  return rows.map(toSummary);
}

export async function getCircuit(sql: Sql, id: string): Promise<GalleryCircuit | null> {
  const rows = (await sql`
    SELECT g.id, g.title, g.description, u.name AS author, g.owner_id, g.block_count, g.forked_from, g.created_at, g.document
    FROM gallery_circuits g JOIN users u ON u.id = g.owner_id WHERE g.id = ${id}`) as Row[];
  const row = rows[0];
  if (!row) return null;
  const document = typeof row.document === 'string' ? (JSON.parse(row.document) as CircuitDocument) : row.document!;
  return { ...toSummary(row), document };
}

export async function insertCircuit(
  sql: Sql,
  circuit: { id: string; ownerId: string; title: string; description: string; document: CircuitDocument; forkedFrom: string | null },
): Promise<void> {
  await sql`
    INSERT INTO gallery_circuits (id, owner_id, title, description, document, block_count, forked_from)
    VALUES (${circuit.id}, ${circuit.ownerId}, ${circuit.title}, ${circuit.description}, ${JSON.stringify(circuit.document)}::jsonb,
            ${circuit.document.blocks.length}, ${circuit.forkedFrom})`;
}

export async function deleteCircuit(sql: Sql, id: string): Promise<void> {
  await sql`DELETE FROM gallery_circuits WHERE id = ${id}`;
}
