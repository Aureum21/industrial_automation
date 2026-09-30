import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft, ArrowUpRight, CircuitBoard } from 'lucide-react';
import { articles, getArticle, formatArticleDate } from '@/lib/content/articles';

type ArticlePageProps = { params: Promise<{ slug: string }> };

export function generateStaticParams() {
  return articles.map(({ slug }) => ({ slug }));
}

export async function generateMetadata({ params }: ArticlePageProps): Promise<Metadata> {
  const { slug } = await params;
  const article = getArticle(slug);
  return article ? { title: article.title, description: article.excerpt } : { title: 'Note not found' };
}

export default async function ArticlePage({ params }: ArticlePageProps) {
  const { slug } = await params;
  const article = getArticle(slug);
  if (!article) notFound();

  return (
    <main id="main-content" className="mx-auto w-full max-w-6xl px-5 py-10 sm:px-8 lg:py-14">
      <Link href="/journal" className="mb-10 inline-flex items-center gap-2 text-xs text-[#91a2b7] hover:text-[#c4ef72]"><ArrowLeft size={14} /> Back to the journal</Link>
      <div className="grid gap-12 lg:grid-cols-[minmax(0,1fr)_240px] lg:gap-20">
        <article>
          <header className="mb-10 border-b border-[#233241] pb-8"><p className="mb-5 font-mono text-[11px] uppercase tracking-[0.2em] text-[#72d9e5]">{article.category}</p><h1 className="max-w-3xl text-4xl leading-[1.12] font-medium tracking-[-0.04em] sm:text-5xl">{article.title}</h1><p className="mt-6 text-lg leading-8 text-[#91a2b7]">{article.excerpt}</p><div className="mt-6 flex flex-wrap items-center gap-3 font-mono text-[10px] uppercase tracking-wider text-[#74899d]"><span>Fieldnotes / Learning series</span><span aria-hidden="true">·</span><time dateTime={article.date}>{formatArticleDate(article.date)}</time><span aria-hidden="true">·</span><span>{article.readingMinutes} min read</span></div></header>
          <div className="space-y-10">
            {article.sections.map((section) => (
              <section key={section.id} id={section.id} className="scroll-mt-6"><h2 className="mb-4 text-2xl font-medium tracking-tight text-[#e5edf5]">{section.heading}</h2><div className="space-y-4">{section.paragraphs.map((paragraph) => <p key={paragraph} className="text-[15px] leading-7 text-[#a8b8c9]">{paragraph}</p>)}</div>{section.code && <pre className="mt-5 overflow-x-auto rounded-lg border border-[#293b45] bg-[#111e26] p-5 text-xs leading-6 text-[#c4ef72]"><code>{section.code}</code></pre>}{section.bullets && <ul className="mt-5 space-y-3 border-l border-[#496443] pl-5 text-sm leading-6 text-[#a8b8c9]">{section.bullets.map((bullet) => <li key={bullet} className="list-inside list-disc marker:text-[#c4ef72]">{bullet}</li>)}</ul>}</section>
            ))}
          </div>
          <aside className="mt-10 rounded-xl border border-[#c4ef72]/20 bg-[#c4ef72]/5 p-6"><p className="mb-3 font-mono text-[10px] uppercase tracking-[0.2em] text-[#c4ef72]">Take to the workbench</p><p className="text-lg leading-7 text-[#d5e5cb]">{article.takeaway}</p></aside>
          <div className="mt-9 flex flex-wrap items-center justify-between gap-4 border-t border-[#233241] pt-6"><Link href="/journal" className="inline-flex items-center gap-2 text-sm text-[#91a2b7]"><ArrowLeft size={15} /> More fieldnotes</Link><Link href={article.example ? `/lab?example=${article.example}` : '/library'} className="inline-flex items-center gap-3 text-sm text-[#c4ef72]">{article.example ? 'Try the lab exercise' : 'Explore analog components'}<ArrowUpRight size={16} /></Link></div>
        </article>
        <aside className="self-start lg:sticky lg:top-8">
          <nav aria-label="In this note" className="border-l border-[#233241] pl-5"><p className="mb-5 font-mono text-[10px] uppercase tracking-[0.2em] text-[#637d94]">In this note</p><ol className="space-y-4">{article.sections.map((section, index) => <li key={section.id}><a href={`#${section.id}`} className="flex gap-3 text-xs leading-5 text-[#91a2b7] hover:text-[#c4ef72]"><span className="font-mono text-[#50697d]">0{index + 1}</span>{section.heading}</a></li>)}</ol></nav>
          {article.example && <div className="mt-9 rounded-xl border border-[#233241] bg-[#101a24] p-5"><CircuitBoard size={24} strokeWidth={1.4} className="mb-4 text-[#72d9e5]" /><h2 className="text-sm font-medium">Put the idea to work.</h2><p className="mt-2 text-xs leading-5 text-[#91a2b7]">Open the example, change the inputs, and observe the result.</p><Link href={`/lab?example=${article.example}`} className="mt-5 inline-flex items-center gap-2 text-xs text-[#c4ef72]">Open example <ArrowUpRight size={14} /></Link></div>}
        </aside>
      </div>
    </main>
  );
}

