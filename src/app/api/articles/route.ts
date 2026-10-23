import { NextResponse } from 'next/server';
import { getDb, initDb, isDbConfigured } from '@/lib/db';
import { AUTHOR_NAME, AUTHOR_LINKEDIN } from '@/lib/mockPosts';
import type { ExternalBlogPost } from '@/lib/blogStorage';

export async function GET() {
  if (!isDbConfigured()) {
    return NextResponse.json({ ok: true, articles: [], configured: false });
  }

  try {
    await initDb();
    const sql = getDb();
    if (!sql) {
      return NextResponse.json({ ok: true, articles: [] });
    }

    const rows = await sql`
      SELECT slug, content_json, updated_at
      FROM articles
      ORDER BY updated_at DESC;
    `;

    const articles: ExternalBlogPost[] = [];
    for (const r of rows as { slug: string; content_json: unknown }[]) {
      if (r.content_json && typeof r.content_json === 'object') {
        articles.push(r.content_json as ExternalBlogPost);
      }
    }

    return NextResponse.json({ ok: true, articles, configured: true });
  } catch (err) {
    console.error('Failed to query articles from Neon:', err);
    return NextResponse.json({ ok: false, articles: [], error: (err as Error).message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const post = (await req.json()) as ExternalBlogPost;

    if (!post || !post.slug || !post.title) {
      return NextResponse.json(
        { ok: false, error: 'Article slug and title are required.' },
        { status: 400 }
      );
    }

    if (!isDbConfigured()) {
      return NextResponse.json(
        { ok: false, error: 'Neon database is not configured. Article saved locally.' },
        { status: 503 }
      );
    }

    await initDb();
    const sql = getDb();
    if (!sql) {
      return NextResponse.json({ ok: false, error: 'Database unavailable' }, { status: 500 });
    }

    const author = post.author || AUTHOR_NAME;
    const authorUrl = AUTHOR_LINKEDIN;
    const dateStr = post.date || 'Oct 15';
    const readingTime = post.readingTime || '15 min read';
    const tag = post.tag || 'Process Control';
    const views = Number(post.views) || 1;
    const jsonContent = JSON.stringify(post);

    await sql`
      INSERT INTO articles (slug, title, excerpt, author, author_url, date_str, reading_time, tag, views, content_json, updated_at)
      VALUES (
        ${post.slug},
        ${post.title},
        ${post.excerpt || ''},
        ${author},
        ${authorUrl},
        ${dateStr},
        ${readingTime},
        ${tag},
        ${views},
        ${jsonContent}::jsonb,
        NOW()
      )
      ON CONFLICT (slug)
      DO UPDATE SET
        title = EXCLUDED.title,
        excerpt = EXCLUDED.excerpt,
        author = EXCLUDED.author,
        author_url = EXCLUDED.author_url,
        date_str = EXCLUDED.date_str,
        reading_time = EXCLUDED.reading_time,
        tag = EXCLUDED.tag,
        views = EXCLUDED.views,
        content_json = EXCLUDED.content_json,
        updated_at = NOW();
    `;

    return NextResponse.json({
      ok: true,
      slug: post.slug,
      message: `"${post.title}" saved successfully to Neon cloud database.`,
    });
  } catch (err) {
    console.error('Failed to save article to Neon:', err);
    return NextResponse.json(
      { ok: false, error: (err as Error).message || 'Failed to save article.' },
      { status: 500 }
    );
  }
}

export async function DELETE(req: Request) {
  try {
    const { slug } = await req.json();
    if (!slug) {
      return NextResponse.json({ ok: false, error: 'Slug is required.' }, { status: 400 });
    }

    if (!isDbConfigured()) {
      return NextResponse.json({ ok: true, deleted: false });
    }

    await initDb();
    const sql = getDb();
    if (!sql) return NextResponse.json({ ok: false, error: 'Database unavailable' }, { status: 500 });

    await sql`
      DELETE FROM articles WHERE slug = ${slug};
    `;

    return NextResponse.json({ ok: true, slug, message: 'Article deleted from Neon database.' });
  } catch (err) {
    console.error('Failed to delete article:', err);
    return NextResponse.json({ ok: false, error: (err as Error).message }, { status: 500 });
  }
}
