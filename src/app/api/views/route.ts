import { NextResponse } from 'next/server';
import { getDb, initDb, isDbConfigured } from '@/lib/db';

export async function GET() {
  if (!isDbConfigured()) {
    return NextResponse.json({ ok: false, views: {}, configured: false });
  }

  try {
    await initDb();
    const sql = getDb();
    if (!sql) {
      return NextResponse.json({ ok: false, views: {} });
    }

    const rows = await sql`
      SELECT slug, views FROM article_views;
    `;

    const viewsMap: Record<string, number> = {};
    for (const r of rows as { slug: string; views: number }[]) {
      viewsMap[r.slug] = Number(r.views) || 1;
    }

    return NextResponse.json({ ok: true, views: viewsMap, configured: true });
  } catch (err) {
    console.error('Failed to get views:', err);
    return NextResponse.json({ ok: false, views: {}, error: (err as Error).message });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const slug = (body.slug || '').trim();

    if (!slug) {
      return NextResponse.json({ ok: false, error: 'Slug is required.' }, { status: 400 });
    }

    if (!isDbConfigured()) {
      return NextResponse.json({ ok: true, slug, views: 1, offline: true });
    }

    await initDb();
    const sql = getDb();
    if (!sql) {
      return NextResponse.json({ ok: false, error: 'Database unavailable' }, { status: 500 });
    }

    const result = await sql`
      INSERT INTO article_views (slug, views)
      VALUES (${slug}, 1)
      ON CONFLICT (slug)
      DO UPDATE SET views = article_views.views + 1, updated_at = NOW()
      RETURNING views;
    `;

    const updatedViews = Number(result[0]?.views) || 1;

    return NextResponse.json({
      ok: true,
      slug,
      views: updatedViews,
    });
  } catch (err) {
    console.error('Failed to record view:', err);
    return NextResponse.json({ ok: false, error: (err as Error).message }, { status: 500 });
  }
}
