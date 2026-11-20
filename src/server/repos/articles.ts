import 'server-only';
import type { Sql } from '../db';
import type { ArticleDocument } from '@/shared/articles';

interface ArticleRow {
  slug: string;
  author_id: string | null;
  content_json: unknown;
}

function toDocument(row: ArticleRow): ArticleDocument | null {
  const doc = row.content_json;
  if (!doc || typeof doc !== 'object') return null;
  const { authorEmail: _email, views: _views, ...rest } = doc as ArticleDocument & { authorEmail?: unknown; views?: unknown };
  return { ...rest, slug: row.slug, authorId: row.author_id ?? undefined };
}

export async function listArticles(sql: Sql): Promise<ArticleDocument[]> {
  const rows = (await sql`SELECT slug, author_id, content_json FROM articles ORDER BY updated_at DESC`) as ArticleRow[];
  return rows.map(toDocument).filter((doc): doc is ArticleDocument => doc !== null);
}

export async function listArticlesByAuthor(sql: Sql, userId: string): Promise<ArticleDocument[]> {
  const rows = (await sql`
    SELECT slug, author_id, content_json FROM articles WHERE author_id = ${userId} ORDER BY updated_at DESC`) as ArticleRow[];
  return rows.map(toDocument).filter((doc): doc is ArticleDocument => doc !== null);
}

export async function getArticle(sql: Sql, slug: string): Promise<ArticleDocument | null> {
  const rows = (await sql`SELECT slug, author_id, content_json FROM articles WHERE slug = ${slug} LIMIT 1`) as ArticleRow[];
  return rows[0] ? toDocument(rows[0]) : null;
}

/** Returns the stored author of a slug: `undefined` when the slug is free, `null` for legacy rows without an author. */
export async function getArticleAuthorId(sql: Sql, slug: string): Promise<string | null | undefined> {
  const rows = (await sql`SELECT author_id FROM articles WHERE slug = ${slug} LIMIT 1`) as { author_id: string | null }[];
  return rows.length ? rows[0].author_id : undefined;
}

/** Inserts or replaces an article. The original author is never changed by an update. */
export async function upsertArticle(sql: Sql, doc: ArticleDocument, authorId: string): Promise<void> {
  const { authorId: _ignored, ...content } = doc;
  await sql`
    INSERT INTO articles (slug, title, excerpt, author, author_url, author_id, date_str, reading_time, tag, content_json, updated_at)
    VALUES (${doc.slug}, ${doc.title}, ${doc.excerpt}, ${doc.author}, ${doc.authorUrl ?? null}, ${authorId},
            ${doc.date}, ${doc.readingTime}, ${doc.tag}, ${JSON.stringify(content)}::jsonb, NOW())
    ON CONFLICT (slug) DO UPDATE SET
      title = EXCLUDED.title,
      excerpt = EXCLUDED.excerpt,
      author = EXCLUDED.author,
      author_url = EXCLUDED.author_url,
      author_id = COALESCE(articles.author_id, EXCLUDED.author_id),
      date_str = EXCLUDED.date_str,
      reading_time = EXCLUDED.reading_time,
      tag = EXCLUDED.tag,
      content_json = EXCLUDED.content_json,
      updated_at = NOW()`;
}

export async function deleteArticle(sql: Sql, slug: string): Promise<void> {
  await sql`DELETE FROM articles WHERE slug = ${slug}`;
}
