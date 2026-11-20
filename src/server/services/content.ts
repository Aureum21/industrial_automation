import 'server-only';
import { cache } from 'react';
import { connection } from 'next/server';
import { BLOG_POSTS, type BlogPost } from '@/lib/mockPosts';
import type { ArticleDocument, PostSummary } from '@/shared/articles';
import { db, isDbConfigured } from '../db';
import * as articles from '../repos/articles';
import { getAllViewCounts } from '../repos/views';

/**
 * Published content for the public pages. Built-in masterclasses live in code; community
 * articles (and owner edits of built-ins) live in the database and take precedence.
 * If the database is unavailable the built-ins are still served.
 */

export type PublishedPost =
  | { source: 'static'; post: BlogPost; views: number }
  | { source: 'database'; doc: ArticleDocument; views: number };

function summarize(post: Pick<BlogPost, 'slug' | 'title' | 'excerpt' | 'author' | 'date' | 'readingTime' | 'tag'>, views: number): PostSummary {
  return {
    slug: post.slug,
    title: post.title,
    excerpt: post.excerpt,
    author: post.author,
    date: post.date,
    readingTime: post.readingTime,
    tag: post.tag,
    views,
  };
}

async function loadDatabaseContent(): Promise<{ docs: ArticleDocument[]; views: Record<string, number> }> {
  if (!isDbConfigured()) return { docs: [], views: {} };
  try {
    const sql = await db();
    const [docs, views] = await Promise.all([articles.listArticles(sql), getAllViewCounts(sql)]);
    return { docs, views };
  } catch (error) {
    console.error('Falling back to built-in content; database read failed:', error);
    return { docs: [], views: {} };
  }
}

export async function getPostSummaries(): Promise<PostSummary[]> {
  await connection();
  const { docs, views } = await loadDatabaseContent();
  const stored = new Map(docs.map((doc) => [doc.slug, doc]));
  const builtIn = BLOG_POSTS.filter((post) => !stored.has(post.slug)).map((post) => summarize(post, views[post.slug] ?? 0));
  const community = docs.map((doc) => summarize(doc, views[doc.slug] ?? 0));
  return [...community, ...builtIn];
}

/** Cached per request so generateMetadata and the page share one lookup. */
export const getPublishedPost = cache(async (slug: string): Promise<PublishedPost | null> => {
  await connection();
  const staticPost = BLOG_POSTS.find((post) => post.slug === slug);
  if (!isDbConfigured()) return staticPost ? { source: 'static', post: staticPost, views: 0 } : null;
  try {
    const sql = await db();
    const [doc, views] = await Promise.all([articles.getArticle(sql, slug), getAllViewCounts(sql)]);
    if (doc) return { source: 'database', doc, views: views[slug] ?? 0 };
    return staticPost ? { source: 'static', post: staticPost, views: views[slug] ?? 0 } : null;
  } catch (error) {
    console.error(`Database read failed for post "${slug}":`, error);
    return staticPost ? { source: 'static', post: staticPost, views: 0 } : null;
  }
});
