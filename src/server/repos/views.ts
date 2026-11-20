import 'server-only';
import type { Sql } from '../db';

export async function getAllViewCounts(sql: Sql): Promise<Record<string, number>> {
  const rows = (await sql`SELECT slug, views FROM article_views`) as { slug: string; views: number }[];
  return Object.fromEntries(rows.map((row) => [row.slug, Number(row.views) || 0]));
}

export async function incrementViewCount(sql: Sql, slug: string): Promise<number> {
  const rows = (await sql`
    INSERT INTO article_views (slug, views) VALUES (${slug}, 1)
    ON CONFLICT (slug) DO UPDATE SET views = article_views.views + 1, updated_at = NOW()
    RETURNING views`) as { views: number }[];
  return Number(rows[0]?.views) || 0;
}
