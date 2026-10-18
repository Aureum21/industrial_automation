'use client';

import React from 'react';
import InlineLab from '@/components/lab/InlineLab';
import { parseCircuitDSL } from '@/lib/automation/dsl';
import { BLOCK_CATALOG } from '@/lib/automation/catalog';
import { BLOG_POSTS, type BlogPost } from '@/lib/mockPosts';

export type ExternalSection =
  | { type: 'markdown'; content: string }
  | { type: 'image'; src: string; caption?: string; alt?: string }
  | { type: 'lab'; dsl: string; title: string; step?: string; height?: number }
  | { type: 'callout'; variant?: 'info' | 'warning' | 'success'; title?: string; text: string };

export interface ExternalBlogPost {
  slug: string;
  title: string;
  excerpt: string;
  author: string;
  date: string;
  readingTime: string;
  tag: string;
  views?: number;
  heroImage?: string;
  sections: ExternalSection[];
}

const STORAGE_KEY_CUSTOM_POSTS = 'automationhub_custom_posts';

/** Render simple markdown prose and headers safely */
function SimpleMarkdownRenderer({ text }: { text: string }) {
  const lines = text.split('\n');
  const elements: React.ReactNode[] = [];
  let currentParagraph: string[] = [];

  const flushParagraph = (key: string) => {
    if (currentParagraph.length > 0) {
      elements.push(
        <p key={key} className="mb-4 leading-relaxed text-zinc-800">
          {currentParagraph.join(' ')}
        </p>
      );
      currentParagraph = [];
    }
  };

  lines.forEach((line, index) => {
    const trimmed = line.trim();
    if (!trimmed) {
      flushParagraph(`p-${index}`);
      return;
    }

    if (trimmed.startsWith('### ')) {
      flushParagraph(`p-before-h3-${index}`);
      elements.push(
        <h3 key={`h3-${index}`} className="text-xl font-bold font-serif text-zinc-900 mt-8 mb-3">
          {trimmed.slice(4)}
        </h3>
      );
    } else if (trimmed.startsWith('## ')) {
      flushParagraph(`p-before-h2-${index}`);
      elements.push(
        <h2 key={`h2-${index}`} className="text-2xl font-bold font-serif text-zinc-900 mt-10 mb-4">
          {trimmed.slice(3)}
        </h2>
      );
    } else if (trimmed.startsWith('# ')) {
      flushParagraph(`p-before-h1-${index}`);
      elements.push(
        <h1 key={`h1-${index}`} className="text-3xl font-extrabold font-serif text-zinc-950 mt-12 mb-5">
          {trimmed.slice(2)}
        </h1>
      );
    } else if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
      flushParagraph(`p-before-li-${index}`);
      elements.push(
        <li key={`li-${index}`} className="ml-6 list-disc mb-1.5 text-zinc-800">
          {trimmed.slice(2)}
        </li>
      );
    } else {
      currentParagraph.push(trimmed);
    }
  });

  flushParagraph('p-final');
  return <div className="prose prose-zinc max-w-none">{elements}</div>;
}

export function renderSectionsToReact(sections: ExternalSection[]): React.ReactNode {
  return (
    <div className="space-y-6">
      {sections.map((sec, i) => {
        if (sec.type === 'markdown') {
          return <SimpleMarkdownRenderer key={`sec-${i}`} text={sec.content} />;
        }
        if (sec.type === 'image') {
          return (
            <div key={`sec-${i}`} className="my-8 not-prose rounded-xl overflow-hidden border border-zinc-300 shadow-xl bg-white">
              <img src={sec.src} alt={sec.alt || 'Post diagram'} className="w-full h-auto object-cover max-h-[550px]" />
              {sec.caption && (
                <div className="p-3 bg-zinc-900 border-t border-zinc-800 text-xs font-mono text-zinc-400 flex justify-between items-center">
                  <span className="text-emerald-400 font-semibold">{sec.caption}</span>
                </div>
              )}
            </div>
          );
        }
        if (sec.type === 'lab') {
          return (
            <InlineLab
              key={`sec-${i}`}
              dsl={sec.dsl}
              title={sec.title}
              step={sec.step}
              height={sec.height || 480}
            />
          );
        }
        if (sec.type === 'callout') {
          const isSuccess = sec.variant === 'success';
          const isWarning = sec.variant === 'warning';
          const bg = isSuccess ? 'bg-emerald-50 border-emerald-500 text-emerald-950' : isWarning ? 'bg-amber-50 border-amber-500 text-amber-950' : 'bg-blue-50 border-blue-500 text-blue-950';
          return (
            <div key={`sec-${i}`} className={`border-l-4 p-4 rounded-r-lg my-4 text-sm font-sans ${bg}`}>
              {sec.title && <strong className="block font-semibold mb-1">{sec.title}</strong>}
              <p>{sec.text}</p>
            </div>
          );
        }
        return null;
      })}
    </div>
  );
}

export function convertExternalToBlogPost(external: ExternalBlogPost): BlogPost {
  return {
    slug: external.slug,
    title: external.title,
    excerpt: external.excerpt,
    author: external.author,
    date: external.date,
    readingTime: external.readingTime,
    tag: external.tag,
    views: external.views ?? 1000,
    content: renderSectionsToReact(external.sections),
    dsl: '',
  };
}

/** Parses either pure JSON or Markdown with ```fbd blocks into an ExternalBlogPost */
export function parseUploadedFileContent(raw: string): ExternalBlogPost {
  const trimmed = raw.trim();

  // Try JSON parsing first
  if (trimmed.startsWith('{')) {
    const data = JSON.parse(trimmed) as ExternalBlogPost;
    if (!data.slug || !data.title || !Array.isArray(data.sections)) {
      throw new Error('Invalid JSON format: "slug", "title", and "sections" array are required.');
    }
    // Validate all embedded DSLs
    data.sections.forEach((sec, idx) => {
      if (sec.type === 'lab') {
        try {
          parseCircuitDSL(sec.dsl, BLOCK_CATALOG);
        } catch (err) {
          throw new Error(`Section ${idx + 1} (Lab: "${sec.title}") has invalid FBD DSL: ${(err as Error).message}`);
        }
      }
    });
    return data;
  }

  // Parse Frontmatter + Markdown format
  let frontmatterText = '';
  let bodyText = trimmed;

  if (trimmed.startsWith('---')) {
    const secondDelim = trimmed.indexOf('---', 3);
    if (secondDelim !== -1) {
      frontmatterText = trimmed.slice(3, secondDelim).trim();
      bodyText = trimmed.slice(secondDelim + 3).trim();
    }
  }

  const meta: Record<string, string> = {};
  frontmatterText.split('\n').forEach(line => {
    const colon = line.indexOf(':');
    if (colon !== -1) {
      const key = line.slice(0, colon).trim();
      const val = line.slice(colon + 1).trim();
      meta[key] = val;
    }
  });

  const slug = meta.slug || 'untitled-post-' + Date.now();
  const title = meta.title || 'Untitled Post';
  const excerpt = meta.excerpt || 'An interactive industrial automation article.';
  const author = meta.author || 'Automation Engineer';
  const date = meta.date || 'Recent';
  const readingTime = meta.readingTime || '10 min read';
  const tag = meta.tag || 'Automation';
  const views = Number(meta.views) || 1200;

  // Split body by ```fbd code blocks
  const sections: ExternalSection[] = [];
  const fbdRegex = /```fbd([^\n]*)\n([\s\S]*?)```/g;
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = fbdRegex.exec(bodyText)) !== null) {
    const textBefore = bodyText.slice(lastIndex, match.index).trim();
    if (textBefore) {
      sections.push({ type: 'markdown', content: textBefore });
    }

    const headerParams = match[1];
    const dslCode = match[2].trim();

    // Parse attributes like title="..." step="..." height=480
    const titleMatch = headerParams.match(/title="([^"]+)"/);
    const stepMatch = headerParams.match(/step="([^"]+)"/);
    const heightMatch = headerParams.match(/height=(\d+)/);

    const labTitle = titleMatch ? titleMatch[1] : 'Interactive Simulation';
    const labStep = stepMatch ? stepMatch[1] : undefined;
    const labHeight = heightMatch ? Number(heightMatch[1]) : 480;

    // Validate DSL
    try {
      parseCircuitDSL(dslCode, BLOCK_CATALOG);
    } catch (err) {
      throw new Error(`FBD Lab "${labTitle}" has invalid DSL: ${(err as Error).message}`);
    }

    sections.push({
      type: 'lab',
      title: labTitle,
      step: labStep,
      height: labHeight,
      dsl: dslCode,
    });

    lastIndex = match.index + match[0].length;
  }

  const trailingText = bodyText.slice(lastIndex).trim();
  if (trailingText) {
    sections.push({ type: 'markdown', content: trailingText });
  }

  return {
    slug,
    title,
    excerpt,
    author,
    date,
    readingTime,
    tag,
    views,
    sections,
  };
}

export function saveCustomPost(external: ExternalBlogPost): void {
  if (typeof window === 'undefined') return;
  try {
    const existingRaw = localStorage.getItem(STORAGE_KEY_CUSTOM_POSTS);
    const existingList: ExternalBlogPost[] = existingRaw ? JSON.parse(existingRaw) : [];
    // Replace if same slug, otherwise prepend
    const filtered = existingList.filter(p => p.slug !== external.slug);
    filtered.unshift(external);
    localStorage.setItem(STORAGE_KEY_CUSTOM_POSTS, JSON.stringify(filtered));
  } catch (e) {
    console.error('Failed to save custom post:', e);
  }
}

export function getCustomBlogPosts(): BlogPost[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY_CUSTOM_POSTS);
    if (!raw) return [];
    const list: ExternalBlogPost[] = JSON.parse(raw);
    return list.map(convertExternalToBlogPost);
  } catch {
    return [];
  }
}

export function getAllPosts(): BlogPost[] {
  const custom = getCustomBlogPosts();
  // Merge custom posts ahead of built-in posts
  const customSlugs = new Set(custom.map(p => p.slug));
  const builtIn = BLOG_POSTS.filter(p => !customSlugs.has(p.slug));
  return [...custom, ...builtIn];
}

export function getPostBySlug(slug: string): BlogPost | undefined {
  const all = getAllPosts();
  return all.find(p => p.slug === slug);
}
