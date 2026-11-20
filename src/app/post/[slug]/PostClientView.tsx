'use client';

import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { Edit, CheckCircle2, Award, ArrowLeft, Share2 } from 'lucide-react';
import LabWorkspace from '@/components/lab/LabWorkspace';
import { parseCircuitDSL } from '@/lib/automation/dsl';
import { BLOCK_CATALOG } from '@/lib/automation/catalog';
import { applyLayout } from '@/lib/automation/layout';
import { useSession } from '@/lib/auth';
import { viewsApi } from '@/lib/api/client';
import { useStoredValue } from '@/lib/useStoredValue';
import { canEditArticle } from '@/shared/permissions';

/** Serializable post metadata passed from the server page. The body arrives as `children`. */
export interface PostViewModel {
  slug: string;
  title: string;
  excerpt: string;
  author: string;
  authorId?: string;
  date: string;
  readingTime: string;
  tag: string;
  /** Optional single-lab circuit shown after the article body. */
  dsl: string;
  views: number;
  /** Number of verifiable lab stages in the article (0 hides the progress pill). */
  labCount: number;
}

const NO_STAGES: string[] = [];

export default function PostClientView({ post, children }: { post: PostViewModel; children: React.ReactNode }) {
  const { user } = useSession();
  const [views, setViews] = useState(post.views);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const progressKey = `automationhub_lab_progress_${post.slug}`;
  const [completedStages, setCompletedStages] = useStoredValue<string[]>(progressKey, NO_STAGES);

  // Count one read per browser session.
  useEffect(() => {
    const key = `has_read_${post.slug}`;
    try {
      if (sessionStorage.getItem(key)) return;
      sessionStorage.setItem(key, '1');
    } catch {
      return;
    }
    void viewsApi.record(post.slug).then((result) => {
      if (result.ok) setViews(result.data.views);
    });
  }, [post.slug]);

  // Inline labs announce verified stages with a window event.
  useEffect(() => {
    const onVerified = (event: Event) => {
      const detail = (event as CustomEvent<{ slug: string; stageId: string }>).detail;
      if (detail?.slug !== post.slug || completedStages.includes(detail.stageId)) return;
      setCompletedStages([...completedStages, detail.stageId]);
    };
    window.addEventListener('lab_stage_verified', onVerified);
    return () => window.removeEventListener('lab_stage_verified', onVerified);
  }, [post.slug, completedStages, setCompletedStages]);

  const singleLabDoc = useMemo(() => {
    if (!post.dsl) return undefined;
    try {
      const doc = parseCircuitDSL(post.dsl, BLOCK_CATALOG);
      doc.name = post.title;
      applyLayout(doc);
      return doc;
    } catch {
      return undefined;
    }
  }, [post.dsl, post.title]);

  const handleShare = () => {
    void navigator.clipboard?.writeText(window.location.href).then(() => {
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2500);
    });
  };

  const canEdit = canEditArticle({ slug: post.slug, exists: true, authorId: post.authorId ?? null }, user);
  const totalStages = post.labCount;
  const doneStages = Math.min(completedStages.length, totalStages);
  const isMasterclassComplete = totalStages > 0 && doneStages >= totalStages;

  return (
    <main className="bg-[#fbfbfd] min-h-screen text-[#1d1d1f] font-sans pb-32 antialiased selection:bg-[#0071e3]/15 selection:text-[#0071e3]">
      {/* Top Floating Apple Header Progress Bar */}
      <div className="sticky top-[64px] z-30 bg-white/85 backdrop-blur-md border-b border-[#e5e5ea] py-2.5 px-4 sm:px-8 transition-all">
        <div className="max-w-4xl mx-auto flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Link
              href="/blogs"
              className="inline-flex items-center gap-1.5 text-xs text-[#86868b] hover:text-[#1d1d1f] transition font-medium"
            >
              <ArrowLeft size={14} />
              <span>All Masterclasses</span>
            </Link>
            <span className="text-[#d2d2d7]">|</span>
            <span className="text-xs font-medium text-[#1d1d1f] truncate max-w-[200px] sm:max-w-[360px]">
              {post.title}
            </span>
          </div>

          <div className="flex items-center gap-3">
            {/* Lab Progress Pill */}
            {totalStages > 0 && (
            <div className="flex items-center gap-2 bg-[#f5f5f7] border border-[#e5e5ea] px-3 py-1 rounded-full text-xs font-mono">
              {isMasterclassComplete ? (
                <span className="text-[#059669] font-bold flex items-center gap-1.5">
                  <CheckCircle2 size={13} className="text-[#059669]" />
                  All labs verified ({doneStages}/{totalStages})
                </span>
              ) : (
                <span className="text-[#86868b] flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#0071e3]" />
                  Lab Progress: <strong className="text-[#1d1d1f]">{doneStages}/{totalStages}</strong>
                </span>
              )}
            </div>
            )}

            {/* Share Button */}
            <button
              onClick={handleShare}
              className="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-medium text-[#1d1d1f] bg-[#f5f5f7] hover:bg-[#e5e5ea] border border-[#e5e5ea] rounded-full transition"
              title="Copy shareable link"
            >
              <Share2 size={12} className="text-[#86868b]" />
              <span>{copiedLink ? 'Copied! ✓' : 'Share'}</span>
            </button>
          </div>
        </div>
      </div>

      <article className="mx-auto max-w-3xl px-5 sm:px-8 mt-10 sm:mt-14">
        {/* Author Station Banner (Only when logged in as the author of this masterclass) */}
        {user && canEdit && (
          <div className="mb-8 p-4 rounded-2xl bg-[#f5f5f7] border border-[#e5e5ea] flex flex-wrap items-center justify-between gap-3 text-xs shadow-xs">
            <div className="flex items-center gap-2.5">
              <span className="w-2 h-2 rounded-full bg-[#059669] animate-pulse" />
              <span className="text-[#1d1d1f] font-medium font-mono">
                Signed in as <strong className="text-[#059669]">{user.name}</strong>
              </span>
            </div>
            <Link
              href={`/write?edit=${post.slug}`}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-[#1d1d1f] hover:bg-black text-white font-medium text-xs transition shadow-xs"
            >
              <Edit size={12} />
              <span>Edit in Studio</span>
            </Link>
          </div>
        )}

        {/* Masterclass Category & Status Tag */}
        <div className="flex flex-wrap items-center gap-2.5 mb-4">
          <span className="text-[11px] font-mono uppercase tracking-wider font-semibold text-[#0071e3] bg-[#0071e3]/10 border border-[#0071e3]/20 px-3 py-1 rounded-full">
            {post.tag}
          </span>
        </div>

        {/* Main Title */}
        <h1 className="text-3xl sm:text-5xl font-bold tracking-tight text-[#1d1d1f] leading-tight mb-6">
          {post.title}
        </h1>

        {/* Excerpt Summary */}
        <p className="text-lg sm:text-xl text-[#86868b] leading-relaxed mb-8 font-normal">
          {post.excerpt}
        </p>

        {/* Apple Style Author Bar */}
        <div className="flex items-center justify-between gap-4 py-6 border-y border-[#e5e5ea] mb-12">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-[#1d1d1f] text-white flex items-center justify-center text-sm font-bold font-mono shrink-0 shadow-sm">
              {(post.author || '?').slice(0, 2).toUpperCase()}
            </div>
            <div>
              <span className="font-semibold text-[#1d1d1f] text-sm sm:text-base leading-snug">
                {post.author}
              </span>
              <div className="text-xs text-[#86868b] flex flex-wrap items-center gap-2 mt-1.5 font-mono">
                <span>{post.readingTime}</span>
                <span>·</span>
                <span>{post.date}</span>
                {views > 0 && (
                  <>
                    <span>·</span>
                    <span className="text-[#059669] font-medium bg-[#ecfdf5] border border-[#a7f3d0] px-2 py-0.5 rounded-full">
                      {views} {views === 1 ? 'read' : 'reads'}
                    </span>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Masterclass Content & Interactive Stages */}
        <div className="prose prose-zinc max-w-none text-base leading-relaxed text-[#1d1d1f] mb-16">
          {children}
        </div>

        {/* Standalone Single Lab fallback (if post uses direct dsl) */}
        {post.dsl && singleLabDoc && (
          <div
            className={
              isFullscreen
                ? 'fixed inset-0 z-[100] flex flex-col bg-white'
                : 'my-12 -mx-4 sm:-mx-8 rounded-2xl overflow-hidden border border-[#e5e5ea] shadow-md flex flex-col bg-white'
            }
          >
            <div className="bg-[#fbfbfd] text-[#1d1d1f] px-5 py-3 border-b border-[#e5e5ea] flex justify-between items-center shrink-0">
              <span className="text-xs font-mono font-bold uppercase tracking-wider text-[#059669]">
                Interactive Simulation Lab
              </span>
              <button
                onClick={() => setIsFullscreen(!isFullscreen)}
                className="text-[#86868b] hover:text-[#1d1d1f] transition text-xs font-mono"
              >
                {isFullscreen ? 'Exit Fullscreen' : 'Fullscreen ↗'}
              </button>
            </div>
            <div className="h-[560px] relative w-full overflow-hidden bg-white">
              <LabWorkspace readOnly document={singleLabDoc} isFullscreen={isFullscreen} />
            </div>
          </div>
        )}

        {/* Masterclass Completion Celebration Card */}
        {isMasterclassComplete && (
          <div className="mt-12 p-6 rounded-2xl bg-gradient-to-br from-[#f0fdf4] to-[#ecfdf5] border border-[#a7f3d0] shadow-sm flex items-start gap-4">
            <div className="p-3 rounded-xl bg-[#059669] text-white shrink-0 shadow-sm">
              <Award size={24} />
            </div>
            <div>
              <h3 className="text-lg font-bold text-[#065f46] mb-1">
                All labs verified
              </h3>
              <p className="text-xs sm:text-sm text-[#047857] leading-relaxed mb-3">
                You have worked through every lab in this article.
              </p>
              <div className="flex items-center gap-3">
                <Link
                  href="/blogs"
                  className="px-4 py-2 rounded-full bg-[#059669] hover:bg-[#047857] text-white text-xs font-medium transition shadow-xs"
                >
                  Explore Next Masterclass →
                </Link>
              </div>
            </div>
          </div>
        )}
      </article>
    </main>
  );
}
