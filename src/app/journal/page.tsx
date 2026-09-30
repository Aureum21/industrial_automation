import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowUpRight, BookOpen } from 'lucide-react';
import { articles, formatArticleDate } from '@/lib/content/articles';

export const metadata: Metadata = { title: 'Engineering journal', description: 'Practical notes on industrial automation, from scan cycles and control patterns to analog signals.' };

export default function JournalPage() {
  return (
    <main id="main-content" className="mx-auto w-full max-w-6xl px-5 py-12 sm:px-8 lg:py-16">
      <header className="mb-12 grid gap-6 border-b border-[#233241] pb-10 md:grid-cols-[1.5fr_1fr] md:items-end">
        <div><p className="mb-5 font-mono text-[11px] uppercase tracking-[0.2em] text-[#72d9e5]">The engineering journal / 001</p><h1 className="text-5xl leading-tight font-medium tracking-[-0.05em] sm:text-6xl">Notes from<br /><span className="text-[#c4ef72]">the workbench.</span></h1></div>
        <p className="max-w-md text-base leading-7 text-[#91a2b7]">Small, useful explanations of the ideas behind industrial automation. Each note starts with a principle and gives you something to investigate.</p>
      </header>
      <div className="mb-5 flex items-center justify-between"><span className="text-sm text-[#bdccda]">All fieldnotes</span><span className="font-mono text-xs text-[#70859b]">{String(articles.length).padStart(2, '0')} NOTES</span></div>
      <div className="space-y-4">
        {articles.map((article, index) => (
          <article key={article.slug} className="group rounded-xl border border-[#233241] bg-[#101a24] transition hover:border-[#4b6040]">
            <Link href={`/journal/${article.slug}`} className="grid gap-5 p-6 sm:grid-cols-[64px_1fr_100px] sm:gap-7 sm:p-8">
              <span className="font-mono text-3xl font-light text-[#40586c]">0{index + 1}</span>
              <div><p className="mb-3 font-mono text-[10px] uppercase tracking-widest text-[#72d9e5]">{article.category}</p><h2 className="text-2xl font-medium tracking-tight text-[#e5edf5]">{article.title}</h2><p className="mt-3 max-w-2xl text-sm leading-6 text-[#91a2b7]">{article.excerpt}</p><div className="mt-5 flex items-center gap-3 text-xs text-[#748aa0]"><time dateTime={article.date}>{formatArticleDate(article.date)}</time><span aria-hidden="true">·</span><span>{article.readingMinutes} min read</span>{article.example && <span className="rounded border border-[#2b443e] px-2 py-1 text-[10px] text-[#a9c48b]">Lab exercise</span>}</div></div>
              <ArrowUpRight size={22} strokeWidth={1.3} className="self-center text-[#71899f] transition group-hover:text-[#c4ef72] sm:justify-self-end" />
            </Link>
          </article>
        ))}
      </div>
      <aside className="mt-10 flex flex-col gap-6 rounded-xl border border-dashed border-[#2c3f4d] p-6 sm:flex-row sm:items-center sm:justify-between"><div className="flex items-start gap-4"><BookOpen size={23} strokeWidth={1.4} className="shrink-0 text-[#72d9e5]" /><div><h2 className="text-sm font-medium">The best way to understand a circuit is to change it.</h2><p className="mt-2 text-sm text-[#91a2b7]">Take an idea from a note into the interactive logic lab.</p></div></div><Link href="/lab" className="inline-flex shrink-0 items-center gap-3 text-sm text-[#c4ef72]">Open the lab <ArrowUpRight size={16} /></Link></aside>
    </main>
  );
}

