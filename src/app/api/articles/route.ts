import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getDb, initDb, isDbConfigured } from '@/lib/db';
import { AUTHOR_NAME, AUTHOR_LINKEDIN } from '@/lib/mockPosts';
import { CORE_MASTERCLASS_SLUGS, type ExternalBlogPost } from '@/lib/blogStorage';

interface SessionUser {
  id: string;
  name: string;
  email: string;
  isLeadAuthor: boolean;
}

async function verifyUserSession(): Promise<{
  authenticated: boolean;
  user?: SessionUser;
  error?: string;
  status?: number;
}> {
  try {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get('station_session');

    if (!sessionCookie || !sessionCookie.value) {
      return {
        authenticated: false,
        error: 'Authentication required. Please sign in to create or edit masterclasses.',
        status: 401,
      };
    }

    const sql = getDb();
    if (!sql) {
      return { authenticated: false, error: 'Database connection unavailable.', status: 500 };
    }

    const rows = await sql`
      SELECT u.id, u.name, u.email
      FROM sessions s
      JOIN users u ON s.user_id = u.id
      WHERE s.id = ${sessionCookie.value} AND s.expires_at > NOW()
      LIMIT 1;
    `;

    if (!rows || rows.length === 0) {
      return {
        authenticated: false,
        error: 'Session expired or invalid. Please sign in again.',
        status: 401,
      };
    }

    const u = rows[0] as { id: string; name: string; email: string };
    const email = (u.email || '').toLowerCase();
    const name = (u.name || '').toLowerCase();
    const isLeadAuthor =
      email === 'alazar@industrialautomation.website' ||
      email.startsWith('alazar') ||
      name.includes('alazar');

    return {
      authenticated: true,
      user: {
        id: u.id,
        name: u.name,
        email: u.email,
        isLeadAuthor,
      },
    };
  } catch (err) {
    return { authenticated: false, error: (err as Error).message, status: 500 };
  }
}

export async function GET(req: Request) {
  if (!isDbConfigured()) {
    return NextResponse.json({ ok: true, articles: [], configured: false });
  }

  try {
    await initDb();
    const sql = getDb();
    if (!sql) {
      return NextResponse.json({ ok: true, articles: [] });
    }

    const { searchParams } = new URL(req.url);
    const scope = searchParams.get('scope');

    // Scoped query: Returns only articles belonging to the authenticated author
    if (scope === 'my') {
      const auth = await verifyUserSession();
      if (!auth.authenticated || !auth.user) {
        return NextResponse.json({ ok: false, error: 'Unauthorized', articles: [] }, { status: 401 });
      }

      // Lead Author Alazar: return all his created articles + legacy null author_id articles
      if (auth.user.isLeadAuthor) {
        const rows = await sql`
          SELECT slug, content_json, author_id, author_email, updated_at
          FROM articles
          WHERE author_id = ${auth.user.id} OR LOWER(author_email) = ${auth.user.email.toLowerCase()} OR author_id IS NULL
          ORDER BY updated_at DESC;
        `;
        const articles: ExternalBlogPost[] = [];
        for (const r of rows as { slug: string; content_json: unknown }[]) {
          if (r.content_json && typeof r.content_json === 'object') {
            articles.push(r.content_json as ExternalBlogPost);
          }
        }
        return NextResponse.json({ ok: true, articles, configured: true });
      }

      // Other Authors: Strictly return articles matching their user ID or email
      const rows = await sql`
        SELECT slug, content_json, author_id, author_email, updated_at
        FROM articles
        WHERE author_id = ${auth.user.id} OR LOWER(author_email) = ${auth.user.email.toLowerCase()}
        ORDER BY updated_at DESC;
      `;
      const articles: ExternalBlogPost[] = [];
      for (const r of rows as { slug: string; content_json: unknown }[]) {
        if (r.content_json && typeof r.content_json === 'object') {
          articles.push(r.content_json as ExternalBlogPost);
        }
      }
      return NextResponse.json({ ok: true, articles, configured: true });
    }

    // Default: Return public list for /blogs
    const rows = await sql`
      SELECT slug, content_json, author_id, author_email, updated_at
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

    // Security interlock: Any authenticated user can publish their own articles!
    const authCheck = await verifyUserSession();
    if (!authCheck.authenticated || !authCheck.user) {
      return NextResponse.json(
        { ok: false, error: authCheck.error || 'Authentication required to publish.' },
        { status: authCheck.status || 401 }
      );
    }

    const { user } = authCheck;

    // 1. Guard core masterclasses: only lead author Alazar can modify them
    if (CORE_MASTERCLASS_SLUGS.has(post.slug) && !user.isLeadAuthor) {
      return NextResponse.json(
        { ok: false, error: 'Permission denied: The 10 core masterclasses are reserved for Alazar Wake Kore.' },
        { status: 403 }
      );
    }

    // 2. Guard existing articles: verify ownership
    const existing = await sql`
      SELECT slug, author_id, author_email
      FROM articles
      WHERE slug = ${post.slug}
      LIMIT 1;
    `;

    if (existing && existing.length > 0) {
      const row = existing[0] as { slug: string; author_id: string | null; author_email: string | null };
      const isOwner =
        user.isLeadAuthor ||
        (row.author_id && row.author_id === user.id) ||
        (row.author_email && row.author_email.toLowerCase() === user.email.toLowerCase());

      if (!isOwner) {
        return NextResponse.json(
          { ok: false, error: 'Permission denied: This article was authored by another engineer and cannot be overwritten.' },
          { status: 403 }
        );
      }
    }

    // Stamp identity
    const authorName = post.author || user.name;
    const authorUrl = post.authorUrl || (user.isLeadAuthor ? AUTHOR_LINKEDIN : undefined);
    const dateStr = post.date || new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    const readingTime = post.readingTime || '12 min read';
    const tag = post.tag || 'Process Control';
    const views = Number(post.views) || 1;

    // Attach metadata inside content_json as well
    const finalizedPost: ExternalBlogPost = {
      ...post,
      author: authorName,
      authorUrl,
      authorId: user.id,
      authorEmail: user.email,
    };
    const jsonContent = JSON.stringify(finalizedPost);

    await sql`
      INSERT INTO articles (slug, title, excerpt, author, author_url, author_id, author_email, date_str, reading_time, tag, views, content_json, updated_at)
      VALUES (
        ${post.slug},
        ${post.title},
        ${post.excerpt || ''},
        ${authorName},
        ${authorUrl || null},
        ${user.id},
        ${user.email},
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
        author_id = COALESCE(articles.author_id, EXCLUDED.author_id),
        author_email = COALESCE(articles.author_email, EXCLUDED.author_email),
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

    const authCheck = await verifyUserSession();
    if (!authCheck.authenticated || !authCheck.user) {
      return NextResponse.json(
        { ok: false, error: authCheck.error || 'Authentication required to delete.' },
        { status: authCheck.status || 401 }
      );
    }

    const { user } = authCheck;

    // 1. Guard core masterclasses
    if (CORE_MASTERCLASS_SLUGS.has(slug) && !user.isLeadAuthor) {
      return NextResponse.json(
        { ok: false, error: 'Permission denied: The 10 core masterclasses cannot be deleted.' },
        { status: 403 }
      );
    }

    // 2. Guard existing articles: verify ownership
    const existing = await sql`
      SELECT slug, author_id, author_email
      FROM articles
      WHERE slug = ${slug}
      LIMIT 1;
    `;

    if (existing && existing.length > 0) {
      const row = existing[0] as { slug: string; author_id: string | null; author_email: string | null };
      const isOwner =
        user.isLeadAuthor ||
        (row.author_id && row.author_id === user.id) ||
        (row.author_email && row.author_email.toLowerCase() === user.email.toLowerCase());

      if (!isOwner) {
        return NextResponse.json(
          { ok: false, error: 'Permission denied: You do not own this article.' },
          { status: 403 }
        );
      }
    }

    await sql`
      DELETE FROM articles WHERE slug = ${slug};
    `;

    return NextResponse.json({ ok: true, slug, message: 'Article deleted from Neon database.' });
  } catch (err) {
    console.error('Failed to delete article:', err);
    return NextResponse.json({ ok: false, error: (err as Error).message }, { status: 500 });
  }
}