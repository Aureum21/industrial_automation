'use client';
import { useMemo, useState } from 'react';
import { useParams } from 'next/navigation';
import LabWorkspace from '@/components/lab/LabWorkspace';
import { BLOG_POSTS } from '@/lib/mockPosts';
import { parseCircuitDSL } from '@/lib/automation/dsl';
import { BLOCK_CATALOG } from '@/lib/automation/catalog';
import { applyLayout } from '@/lib/automation/layout';
import Link from 'next/link';

export default function PostPage() {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const params = useParams();
  const slug = params.slug as string;
  
  const post = BLOG_POSTS.find(p => p.slug === slug);
  
  const document = useMemo(() => {
    if (!post?.dsl) return undefined;
    try {
      const doc = parseCircuitDSL(post.dsl, BLOCK_CATALOG);
      doc.name = post.title;
      applyLayout(doc);
      return doc;
    } catch (e) {
      console.error(e);
      return undefined;
    }
  }, [post]);

  if (!post) {
    return (
      <main className="bg-white min-h-screen text-gray-900 pb-32 pt-32 flex flex-col items-center">
        <h1 className="text-4xl font-serif">Post not found</h1>
        <Link href="/" className="mt-8 text-green-600 hover:underline">Return home</Link>
      </main>
    );
  }

  return (
    <main className="bg-white min-h-screen text-gray-900 pb-32">
      <article className="mx-auto max-w-3xl px-5 sm:px-8 mt-16">
        <h1 className="text-4xl sm:text-5xl font-serif font-extrabold tracking-tight mb-8 leading-tight">
          {post.title}
        </h1>
        
        <div className="flex items-center gap-4 mb-10 pb-8 border-b border-gray-100">
          <div className="w-12 h-12 rounded-full bg-gray-200 flex items-center justify-center text-lg font-bold text-gray-500">
            {post.author[0]}
          </div>
          <div>
            <div className="font-medium text-gray-900">{post.author}</div>
            <div className="text-sm text-gray-500 flex gap-2">
              <span>{post.readingTime}</span>
              <span>·</span>
              <span>{post.date}</span>
            </div>
          </div>
        </div>

        <div className="prose prose-lg prose-gray max-w-none font-serif text-xl leading-relaxed text-gray-800 mb-12">
          {post.content}
        </div>

        {/* Embedded Interactive Simulation (for single-lab posts) */}
        {post.dsl && document && (
          <div className={isFullscreen 
            ? "fixed inset-0 z-[100] flex flex-col bg-white" 
            : "my-16 -mx-5 sm:-mx-12 rounded-xl overflow-hidden border border-gray-200 shadow-xl h-[600px] flex flex-col"
          }>
            <div className="bg-gray-50 px-4 py-2 border-b border-gray-200 flex justify-between items-center shrink-0">
               <span className="text-xs font-bold text-gray-500 uppercase tracking-widest">Interactive Simulation</span>
               <div className="flex items-center gap-3">
                 <span className="text-xs text-gray-400 hidden sm:inline">Powered by AutomationHub</span>
                 <button onClick={() => setIsFullscreen(!isFullscreen)} className="text-gray-400 hover:text-gray-700 transition" title={isFullscreen ? 'Minimize' : 'Maximize'}>
                   <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                     {isFullscreen ? (
                       <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 8h12v12H8z M4 16V4h12" />
                     ) : (
                       <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4h16v16H4z" />
                     )}
                   </svg>
                 </button>
               </div>
            </div>
            <div className="flex-grow bg-[#0b1118] relative w-full h-full overflow-hidden">
              <LabWorkspace readOnly document={document} />
            </div>
          </div>
        )}

      </article>
    </main>
  );
}
