import React from 'react';
import InlineLab from '@/components/lab/InlineLab';
import type { ArticleSection } from '@/shared/articles';
import { isSafeImageUrl, isSafeLinkUrl } from '@/shared/urls';

/**
 * Renders article sections (markdown, images, callouts, live labs) to React.
 * No HTML from the author is ever injected: markdown is parsed into elements, and link/image
 * URLs that are not http(s) or site-relative are dropped.
 */

function renderInline(text: string): React.ReactNode {
  const parts: React.ReactNode[] = [];
  const regex = /(\[([^\]]+)\]\(([^)]+)\))|(\*\*([^*]+)\*\*)|(`([^`]+)`)|(\*([^*]+)\*)/g;
  let lastIdx = 0;
  let match: RegExpExecArray | null;

  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIdx) parts.push(text.slice(lastIdx, match.index));
    if (match[1]) {
      const href = match[3].trim();
      if (isSafeLinkUrl(href)) {
        const external = !href.startsWith('/') && !href.startsWith('#');
        parts.push(
          <a
            key={`link-${match.index}`}
            href={href}
            {...(external ? { target: '_blank', rel: 'noopener noreferrer nofollow' } : {})}
            className="text-emerald-600 underline hover:text-emerald-700 font-medium"
          >
            {match[2]}
          </a>,
        );
      } else {
        parts.push(match[2]);
      }
    } else if (match[4]) {
      parts.push(
        <strong key={`bold-${match.index}`} className="font-semibold text-zinc-900">
          {match[5]}
        </strong>,
      );
    } else if (match[6]) {
      parts.push(
        <code key={`code-${match.index}`} className="px-1.5 py-0.5 rounded bg-zinc-100 text-zinc-800 font-mono text-xs border border-zinc-200">
          {match[7]}
        </code>,
      );
    } else if (match[8]) {
      parts.push(<em key={`em-${match.index}`}>{match[9]}</em>);
    }
    lastIdx = match.index + match[0].length;
  }
  if (lastIdx < text.length) parts.push(text.slice(lastIdx));
  return parts.length > 0 ? parts : text;
}

const isBlockStart = (line: string) =>
  line.startsWith('#') || line.startsWith('```') || line.startsWith('|') || /^\d+\.\s/.test(line) || line.startsWith('- ') || line.startsWith('* ');

export function MarkdownBlock({ text }: { text: string }) {
  const lines = text.split('\n');
  const elements: React.ReactNode[] = [];
  let i = 0;

  while (i < lines.length) {
    const trimmed = lines[i].trim();
    if (!trimmed) {
      i++;
      continue;
    }

    if (trimmed.startsWith('```')) {
      const code: string[] = [];
      i++;
      while (i < lines.length && !lines[i].trim().startsWith('```')) code.push(lines[i++]);
      if (i < lines.length) i++;
      elements.push(
        <pre key={`code-${elements.length}`} className="bg-zinc-900 text-emerald-400 p-4 rounded-lg font-mono text-xs sm:text-sm overflow-x-auto my-4 border border-zinc-800">
          <code>{code.join('\n')}</code>
        </pre>,
      );
      continue;
    }

    if (trimmed.startsWith('|') && trimmed.endsWith('|')) {
      const tableLines: string[] = [];
      while (i < lines.length && lines[i].trim().startsWith('|') && lines[i].trim().endsWith('|')) tableLines.push(lines[i++].trim());
      if (tableLines.length >= 2) {
        const rows = tableLines.map((line) => line.split('|').slice(1, -1).map((cell) => cell.trim()));
        const separator = rows[1].every((cell) => /^:?-+:?$/.test(cell));
        const body = separator ? rows.slice(2) : rows.slice(1);
        elements.push(
          <div key={`table-${elements.length}`} className="my-6 overflow-x-auto not-prose rounded-xl border border-zinc-200 shadow-sm bg-white">
            <table className="min-w-full divide-y divide-zinc-200 text-sm text-left">
              <thead className="bg-zinc-50 text-xs font-semibold uppercase tracking-wider text-zinc-600">
                <tr>
                  {rows[0].map((header, hi) => (
                    <th key={hi} className="px-4 py-3 border-b border-zinc-200">{renderInline(header)}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100 bg-white">
                {body.map((row, ri) => (
                  <tr key={ri} className="hover:bg-zinc-50/80 transition-colors">
                    {row.map((cell, ci) => (
                      <td key={ci} className="px-4 py-3 text-zinc-800 whitespace-normal">{renderInline(cell)}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>,
        );
        continue;
      }
      // A single |...| line is treated as a paragraph below.
      i -= tableLines.length;
    }

    const heading = /^(#{1,3})\s+(.*)$/.exec(trimmed);
    if (heading) {
      const level = heading[1].length;
      const content = renderInline(heading[2]);
      const key = `h-${elements.length}`;
      if (level === 1) elements.push(<h1 key={key} className="text-3xl font-extrabold font-serif text-zinc-950 mt-12 mb-5">{content}</h1>);
      else if (level === 2) elements.push(<h2 key={key} className="text-2xl font-bold font-serif text-zinc-900 mt-10 mb-4">{content}</h2>);
      else elements.push(<h3 key={key} className="text-xl font-bold font-serif text-zinc-900 mt-8 mb-3">{content}</h3>);
      i++;
      continue;
    }

    if (/^\d+\.\s/.test(trimmed)) {
      const items: string[] = [];
      while (i < lines.length && /^\d+\.\s/.test(lines[i].trim())) items.push(lines[i++].trim().replace(/^\d+\.\s*/, ''));
      elements.push(
        <ol key={`ol-${elements.length}`} className="list-decimal pl-6 space-y-2 my-4 text-zinc-800">
          {items.map((item, idx) => <li key={idx} className="leading-relaxed">{renderInline(item)}</li>)}
        </ol>,
      );
      continue;
    }

    if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
      const items: string[] = [];
      while (i < lines.length && (lines[i].trim().startsWith('- ') || lines[i].trim().startsWith('* '))) items.push(lines[i++].trim().slice(2));
      elements.push(
        <ul key={`ul-${elements.length}`} className="list-disc pl-6 space-y-2 my-4 text-zinc-800">
          {items.map((item, idx) => <li key={idx} className="leading-relaxed">{renderInline(item)}</li>)}
        </ul>,
      );
      continue;
    }

    const paragraph: string[] = [trimmed];
    i++;
    while (i < lines.length && lines[i].trim() && !isBlockStart(lines[i].trim())) paragraph.push(lines[i++].trim());
    elements.push(
      <p key={`p-${elements.length}`} className="mb-4 leading-relaxed text-zinc-800">
        {renderInline(paragraph.join(' '))}
      </p>,
    );
  }

  return <div className="prose prose-zinc max-w-none">{elements}</div>;
}

const CALLOUT_STYLES: Record<NonNullable<Extract<ArticleSection, { type: 'callout' }>['variant']>, string> = {
  info: 'bg-blue-50 border-blue-500 text-blue-950',
  warning: 'bg-amber-50 border-amber-500 text-amber-950',
  success: 'bg-emerald-50 border-emerald-500 text-emerald-950',
  error: 'bg-red-50 border-red-500 text-red-950',
};

export function ArticleSections({ sections }: { sections: ArticleSection[] }) {
  return (
    <div className="space-y-6">
      {sections.map((section, i) => {
        switch (section.type) {
          case 'markdown':
            return <MarkdownBlock key={i} text={section.content} />;
          case 'image':
            if (!isSafeImageUrl(section.src)) return null;
            return (
              <figure key={i} className="my-8 not-prose rounded-xl overflow-hidden border border-zinc-300 shadow-xl bg-white">
                {/* eslint-disable-next-line @next/next/no-img-element -- author-supplied images can be any host or a data URI */}
                <img src={section.src} alt={section.alt || ''} className="w-full h-auto object-cover max-h-[550px]" loading="lazy" />
                {section.caption && (
                  <figcaption className="p-3 bg-zinc-900 border-t border-zinc-800 text-xs font-mono text-emerald-400 font-semibold">{section.caption}</figcaption>
                )}
              </figure>
            );
          case 'lab':
            return <InlineLab key={i} dsl={section.dsl} title={section.title} step={section.step} height={section.height || 480} />;
          case 'callout':
            return (
              <div key={i} className={`border-l-4 p-4 rounded-r-lg my-4 text-sm font-sans ${CALLOUT_STYLES[section.variant ?? 'info']}`}>
                {section.title && <strong className="block font-semibold mb-1">{section.title}</strong>}
                <p>{section.text}</p>
              </div>
            );
          default:
            return null;
        }
      })}
    </div>
  );
}
