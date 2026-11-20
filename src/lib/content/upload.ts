import type { ArticleSection } from '../../shared/articles.ts';
import { articleInputSchema, firstIssue, type ArticleInput } from '../../shared/validation.ts';

/**
 * Parses an uploaded article: either the JSON article format, or Markdown with optional
 * front matter and ```fbd code fences for labs:
 *
 *   ---
 *   slug: my-article
 *   title: My article
 *   ---
 *   Prose...
 *   ```fbd title="Stage 1" step="1 of 3" height=480
 *   circuit "Stage 1" version 1 { ... }
 *   ```
 *
 * Throws an Error with a readable message when the content is invalid.
 */
export function parseArticleUpload(raw: string): ArticleInput {
  const text = raw.trim();
  const candidate = text.startsWith('{') ? parseJson(text) : parseMarkdown(text);
  const result = articleInputSchema.safeParse(candidate);
  if (!result.success) throw new Error(firstIssue(result.error));
  return result.data;
}

function parseJson(text: string): unknown {
  try {
    return JSON.parse(text);
  } catch (error) {
    throw new Error(`Invalid JSON: ${error instanceof Error ? error.message : 'parse error'}`);
  }
}

function parseMarkdown(text: string): unknown {
  let body = text;
  const meta: Record<string, string> = {};
  if (text.startsWith('---')) {
    const end = text.indexOf('\n---', 3);
    if (end !== -1) {
      for (const line of text.slice(3, end).split('\n')) {
        const colon = line.indexOf(':');
        if (colon !== -1) meta[line.slice(0, colon).trim()] = line.slice(colon + 1).trim();
      }
      body = text.slice(end + 4).trim();
    }
  }

  const sections: ArticleSection[] = [];
  const fence = /```fbd([^\n]*)\n([\s\S]*?)```/g;
  let last = 0;
  let match: RegExpExecArray | null;
  while ((match = fence.exec(body)) !== null) {
    const before = body.slice(last, match.index).trim();
    if (before) sections.push({ type: 'markdown', content: before });
    const header = match[1];
    const height = header.match(/height=(\d+)/);
    sections.push({
      type: 'lab',
      title: header.match(/title="([^"]+)"/)?.[1] ?? 'Interactive simulation',
      step: header.match(/step="([^"]+)"/)?.[1],
      height: height ? Number(height[1]) : 480,
      dsl: match[2].trim(),
    });
    last = match.index + match[0].length;
  }
  const rest = body.slice(last).trim();
  if (rest) sections.push({ type: 'markdown', content: rest });

  return {
    slug: meta.slug || `article-${Date.now().toString(36)}`,
    title: meta.title || 'Untitled article',
    excerpt: meta.excerpt || '',
    author: meta.author,
    date: meta.date,
    readingTime: meta.readingTime,
    tag: meta.tag,
    sections,
  };
}
