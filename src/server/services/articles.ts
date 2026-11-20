import 'server-only';
import { db } from '../db';
import { HttpError } from '../http';
import type { AuthUser } from '../repos/users';
import * as articles from '../repos/articles';
import type { ArticleDocument } from '@/shared/articles';
import { canDeleteArticle, canEditArticle, isSiteOwner } from '@/shared/permissions';
import { OWNER_HANDLE } from '@/shared/site';
import type { ArticleInput } from '@/shared/validation';

function estimateReadingTime(input: ArticleInput): string {
  const words = input.sections
    .map((section) => (section.type === 'markdown' ? section.content : section.type === 'callout' ? section.text : ''))
    .join(' ')
    .split(/\s+/)
    .filter(Boolean).length;
  const labs = input.sections.filter((section) => section.type === 'lab').length;
  const minutes = Math.max(1, Math.round(words / 200));
  return labs ? `${minutes} min read + ${labs} lab${labs === 1 ? '' : 's'}` : `${minutes} min read`;
}

/** Validated input → stored document. Non-owners always publish under their own username. */
function toDocument(input: ArticleInput, user: AuthUser): ArticleDocument {
  return {
    slug: input.slug,
    title: input.title,
    excerpt: input.excerpt,
    author: isSiteOwner(user) ? input.author || OWNER_HANDLE : user.name,
    date: input.date || new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
    readingTime: input.readingTime || estimateReadingTime(input),
    tag: input.tag || 'Automation',
    ...(input.heroImage ? { heroImage: input.heroImage } : {}),
    sections: input.sections,
  };
}

export async function saveArticle(user: AuthUser, input: ArticleInput): Promise<ArticleDocument> {
  const sql = await db();
  const authorId = await articles.getArticleAuthorId(sql, input.slug);
  const target = { slug: input.slug, exists: authorId !== undefined, authorId };
  if (!canEditArticle(target, user)) {
    throw new HttpError(403, 'You do not have permission to edit this article.');
  }
  const doc = toDocument(input, user);
  await articles.upsertArticle(sql, doc, user.id);
  return { ...doc, authorId: authorId ?? user.id };
}

export async function removeArticle(user: AuthUser, slug: string): Promise<void> {
  const sql = await db();
  const authorId = await articles.getArticleAuthorId(sql, slug);
  const target = { slug, exists: authorId !== undefined, authorId };
  if (!target.exists) throw new HttpError(404, 'Article not found.');
  if (!canDeleteArticle(target, user)) throw new HttpError(403, 'You do not have permission to delete this article.');
  await articles.deleteArticle(sql, slug);
}

/** Articles the user may manage: their own, or every stored article for the owner. */
export async function listManageableArticles(user: AuthUser): Promise<ArticleDocument[]> {
  const sql = await db();
  return isSiteOwner(user) ? articles.listArticles(sql) : articles.listArticlesByAuthor(sql, user.id);
}

export async function getStoredArticle(slug: string): Promise<ArticleDocument | null> {
  const sql = await db();
  return articles.getArticle(sql, slug);
}
