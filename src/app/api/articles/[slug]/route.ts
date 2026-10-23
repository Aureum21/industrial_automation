import { NextResponse } from 'next/server';
import { getDb, initDb, isDbConfigured } from '@/lib/db';
import type { ExternalBlogPost } from '@/lib/blogStorage';

export async function GET(
  request: Request,
  props: { params: Promise<{ slug: string }> }
) {
  const { slug } = await props.params;

  if (!isDbConfigured()) {
    return NextResponse.json({ ok: false, post: null, error: 'Database not configured' }, { status: 404 });
  }

  try {
    await initDb();
    const sql = getDb();
    if (!sql) {
      return NextResponse.json({ ok: false, post: null }, { status: 500 });
    }

    const rows = await sql`
      SELECT content_json
      FROM articles
      WHERE slug = ${slug}
      LIMIT 1;
    `;

    if (!rows || rows.length === 0) {
      return NextResponse.json({ ok: false, post: null }, { status: 404 });
    }

    const post = rows[0]?.content_json as ExternalBlogPost;
    return NextResponse.json({ ok: true, post });
  } catch (err) {
    console.error('Failed to get article from Neon:', err);
    return NextResponse.json({ ok: false, post: null, error: (err as Error).message }, { status: 500 });
  }
}
