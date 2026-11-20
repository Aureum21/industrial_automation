/**
 * Article data model shared by the API, the server pages and the Studio editor.
 * An article is a list of sections: markdown prose, images, callouts and live labs (circuit DSL).
 */
export type ArticleSection =
  | { type: 'markdown'; content: string }
  | { type: 'image'; src: string; caption?: string; alt?: string }
  | { type: 'lab'; dsl: string; title: string; step?: string; height?: number }
  | { type: 'callout'; variant?: 'info' | 'warning' | 'success' | 'error'; title?: string; text: string };

export interface ArticleDocument {
  slug: string;
  title: string;
  excerpt: string;
  author: string;
  authorUrl?: string;
  authorId?: string;
  date: string;
  readingTime: string;
  tag: string;
  heroImage?: string;
  sections: ArticleSection[];
}

/** Lightweight listing entry for directories and the home page. */
export interface PostSummary {
  slug: string;
  title: string;
  excerpt: string;
  author: string;
  date: string;
  readingTime: string;
  tag: string;
  views: number;
}

export const ARTICLE_LIMITS = {
  slug: 128,
  title: 200,
  excerpt: 600,
  author: 80,
  tag: 64,
  date: 32,
  readingTime: 64,
  sections: 120,
  markdown: 60_000,
  calloutText: 4_000,
  dsl: 40_000,
  imageSrc: 300_000,
  /** Upper bound for the whole JSON request body when saving an article. */
  bodyBytes: 2_000_000,
} as const;
