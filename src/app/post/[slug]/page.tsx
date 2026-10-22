'use client';
import { useEffect, useMemo, useState } from 'react';
import { useParams } from 'next/navigation';
import LabWorkspace from '@/components/lab/LabWorkspace';
import { BLOG_POSTS, type BlogPost } from '@/lib/mockPosts';
import { getPostBySlug } from '@/lib/blogStorage';
import { getCurrentUser, type User } from '@/lib/auth';
import { parseCircuitDSL } from '@/lib/automation/dsl';
import { BLOCK_CATALOG } from '@/lib/automation/catalog';
import { applyLayout } from '@/lib/automation/layout';
import Link from 'next/link';
import { Edit, ExternalLink } from 'lucide-react';

export default function PostPage() {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const params = useParams();
  const slug = params.slug as string;
  
  const [post, setPost] = useState<BlogPost | undefined>(() => BLOG_POSTS.find(p => p.slug === slug));
  const [user, setUser] = useState<User | null>(null);
  const [liveViews, setLiveViews] = useState<number | null>(null);

  useEffect(() => {
    setUser(getCurrentUser());
    const found = getPostBySlug(slug);
    if (found) {
      setPost(found);
      setLiveViews(found.views ?? 1);
    }

    // Record real visitor read count in Neon PostgreSQL
    const sessionKey = 'has_read_' + slug;
    const alreadyReadThisSession = typeof window !== 'undefined' && sessionStorage.getItem(sessionKey);

    if (!alreadyReadThisSession) {
      if (typeof window !== 'undefined') {
        sessionStorage.setItem(sessionKey, '1');
      }
      fetch('/api/views', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ slug }),
      })
        .then((res) => res.json())
        .then((data) => {
          if (data.ok && typeof data.views === 'number') {
            setLiveViews(data.views);
          }
        })
        .catch(() => {});
    } else {
      fetch('/api/views')
        .then((res) => res.json())
        .then((data) => {
          if (data.ok && data.views && typeof data.views[slug] === 'number') {
            setLiveViews(data.views[slug]);
          }
        })
        .catch(() => {});
    }
  }, [slug]);
  
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
      <article className="mx-auto max-w-3xl px-5 sm:px-8 mt-12 sm:mt-16">
        {user && (user.name === post.author || user.name.toUpperCase() === 'ALAZAR' || user.role.includes('Architect')) && (
          <div className="mb-8 p-3 rounded-xl bg-emerald-50 border border-emerald-200 flex flex-wrap items-center justify-between gap-3 text-xs font-mono text-emerald-900 shadow-sm">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>
                <strong>AUTHOR STATION:</strong> Verified as {user.name}
              </span>
            </div>
            <Link
              href={`/write?edit=${post.slug}`}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold transition shadow-xs"
            >
              <Edit size={13} />
              <span>Edit This Publication</span>
            </Link>
          </div>
        )}

        <h1 className="text-4xl sm:text-5xl font-serif font-extrabold tracking-tight mb-8 leading-tight">
          {post.title}
        </h1>
        
        <div className="flex items-center gap-4 mb-10 pb-8 border-b border-gray-100">
          <div className="w-12 h-12 rounded-full bg-emerald-100 border border-emerald-300 flex items-center justify-center text-sm font-bold text-emerald-800 shrink-0 font-mono">
            AW
          </div>
          <div>
            <a
              href="https://www.linkedin.com/in/alazar-wake-45915a276/"
              target="_blank"
              rel="noopener noreferrer"
              className="font-semibold text-gray-950 hover:text-emerald-700 transition inline-flex items-center gap-1.5 group text-sm sm:text-base leading-snug"
              title="Open LinkedIn Profile"
            >
              <span>{post.author}</span>
              <ExternalLink size={14} className="text-gray-400 group-hover:text-emerald-600 shrink-0" />
            </a>
            <div className="text-xs text-gray-500 flex flex-wrap items-center gap-2 mt-1.5 font-mono">
              <span>{post.readingTime}</span>
              <span>·</span>
              <span>{post.date}</span>
              <span>·</span>
              <span className="text-emerald-700 bg-emerald-50 border border-emerald-200/80 px-2 py-0.5 rounded font-semibold flex items-center gap-1 shadow-xs">
                ⚡ {liveViews ?? post.views ?? 1} reads
              </span>
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
