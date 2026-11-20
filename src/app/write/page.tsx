'use client';

import React, { useCallback, useEffect, useMemo, useRef, useState, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import {
  UploadCloud,
  CheckCircle,
  AlertTriangle,
  Eye,
  Download,
  PlusCircle,
  Trash2,
  Edit,
  BookOpen,
  Save,
  ExternalLink,
  Lock,
  LogIn,
  Cpu,
  ArrowUp,
  ArrowDown,
  Play,
  FolderOpen,
} from 'lucide-react';
import InlineLab from '@/components/lab/InlineLab';
import { useSession } from '@/lib/auth';
import { articlesApi } from '@/lib/api/client';
import { ArticleSections } from '@/lib/content/render';
import { parseArticleUpload } from '@/lib/content/upload';
import { DEFAULT_MASTERCLASSES } from '@/lib/defaultArticlesData';
import { stringifyCircuitDSL, parseCircuitDSL } from '@/lib/automation/dsl';
import { BLOCK_CATALOG } from '@/lib/automation/catalog';
import { getExample } from '@/lib/automation/examples';
import { parseCircuitDocument, STORAGE_KEY as LAB_STORAGE_KEY } from '@/lib/automation/documents';
import type { ArticleDocument, ArticleSection } from '@/shared/articles';
import { CORE_MASTERCLASS_SLUGS, canEditArticle, isSiteOwner } from '@/shared/permissions';
import { OWNER_HANDLE } from '@/shared/site';
import type { ArticleInput } from '@/shared/validation';

type Notice = { kind: 'success' | 'error'; text: string };
type CalloutVariant = NonNullable<Extract<ArticleSection, { type: 'callout' }>['variant']>;

function toInput(post: ArticleDocument): ArticleInput {
  return {
    slug: post.slug.trim(),
    title: post.title,
    excerpt: post.excerpt ?? '',
    author: post.author || undefined,
    date: post.date || undefined,
    readingTime: post.readingTime || undefined,
    tag: post.tag || undefined,
    heroImage: post.heroImage || undefined,
    sections: post.sections,
  };
}

function starterLab(presetId: string, index: number): ArticleSection {
  const example = getExample(presetId);
  return { type: 'lab', title: `Stage ${index}: ${example.name}`, step: `Stage ${index}`, dsl: stringifyCircuitDSL(example), height: 480 };
}

function WriteContent() {
  const searchParams = useSearchParams();
  const editSlugParam = searchParams.get('edit');
  const { user: currentUser, checked, accounts } = useSession();
  const isAuthor = isSiteOwner(currentUser);

  const [activeTab, setActiveTab] = useState<'publications' | 'editor' | 'upload'>('publications');
  const fileInputRef = useRef<HTMLInputElement>(null);

  /** Articles stored in the database that this user may manage. */
  const [stored, setStored] = useState<ArticleDocument[]>([]);
  const [loadingStored, setLoadingStored] = useState(true);
  const [notice, setNotice] = useState<Notice | null>(null);
  const [saving, setSaving] = useState(false);

  const [editingPost, setEditingPost] = useState<ArticleDocument>({
    slug: '',
    title: '',
    excerpt: '',
    author: '',
    date: '',
    readingTime: '',
    tag: 'Automation',
    sections: [{ type: 'markdown', content: '## Overview\n\nWrite your introduction here.' }],
  });
  const [previewingLabs, setPreviewingLabs] = useState<Record<number, boolean>>({});
  const [editorRawJson, setEditorRawJson] = useState('');
  const [editorMode, setEditorMode] = useState<'fields' | 'json'>('fields');
  const [isPreviewMode, setIsPreviewMode] = useState(false);

  const [parsedPost, setParsedPost] = useState<ArticleInput | null>(null);
  const [validationError, setValidationError] = useState<string | null>(null);

  const storedBySlug = useMemo(() => new Map(stored.map((post) => [post.slug, post])), [stored]);

  /** The owner also sees built-in masterclasses that have never been edited (they live in code). */
  const publications = useMemo(() => {
    if (!isAuthor) return stored;
    return [...stored, ...DEFAULT_MASTERCLASSES.filter((post) => !storedBySlug.has(post.slug))];
  }, [isAuthor, stored, storedBySlug]);

  const isPostEditable = useMemo(() => {
    const existing = storedBySlug.get(editingPost.slug.trim());
    return canEditArticle({ slug: editingPost.slug.trim(), exists: Boolean(existing), authorId: existing?.authorId ?? null }, currentUser);
  }, [currentUser, editingPost.slug, storedBySlug]);

  const startEditing = useCallback((post: ArticleDocument) => {
    setEditingPost(structuredClone(post));
    setEditorRawJson(JSON.stringify(post, null, 2));
    setPreviewingLabs({});
    setActiveTab('editor');
    setNotice(null);
    setIsPreviewMode(false);
  }, []);

  // Load the user's articles; then honour a /write?edit=<slug> deep link once.
  const openedFromParam = useRef(false);
  useEffect(() => {
    if (!currentUser) return;
    let cancelled = false;
    void articlesApi.listMine().then((result) => {
      if (cancelled) return;
      setLoadingStored(false);
      if (!result.ok) {
        setNotice({ kind: 'error', text: `Could not load your articles: ${result.error}` });
        return;
      }
      const mine = result.data.articles;
      setStored(mine);
      if (editSlugParam && !openedFromParam.current) {
        openedFromParam.current = true;
        const candidates = isSiteOwner(currentUser) ? [...mine, ...DEFAULT_MASTERCLASSES] : mine;
        const match = candidates.find((post) => post.slug === editSlugParam);
        if (match) startEditing(match);
        else setNotice({ kind: 'error', text: `You can't edit "${editSlugParam}", or it doesn't exist.` });
      }
    });
    return () => {
      cancelled = true;
    };
  }, [currentUser, editSlugParam, startEditing]);


  const startNewArticle = () => {
    startEditing({
      slug: `article-${Date.now().toString(36)}`,
      title: 'New article',
      excerpt: '',
      author: isAuthor ? OWNER_HANDLE : currentUser?.name ?? '',
      date: '',
      readingTime: '',
      tag: 'Automation',
      sections: [
        { type: 'markdown', content: '## Introduction\n\nDescribe the problem this circuit solves.' },
        starterLab('start-stop', 1),
      ],
    });
  };

  const handleSavePost = async () => {
    let postToSave = editingPost;
    if (editorMode === 'json') {
      try {
        postToSave = JSON.parse(editorRawJson) as ArticleDocument;
      } catch (err) {
        setNotice({ kind: 'error', text: `Invalid JSON: ${(err as Error).message}` });
        return;
      }
    }
    setSaving(true);
    const result = await articlesApi.save(toInput(postToSave));
    setSaving(false);
    if (!result.ok) {
      setNotice({ kind: 'error', text: result.error });
      return;
    }
    const saved = result.data.article;
    setEditingPost(saved);
    setEditorRawJson(JSON.stringify(saved, null, 2));
    setStored((previous) => [saved, ...previous.filter((post) => post.slug !== saved.slug)]);
    setNotice({ kind: 'success', text: `"${saved.title}" is published.` });
  };

  const handleDeleteCustom = async (slug: string) => {
    if (!confirm('Delete this article permanently?')) return;
    const result = await articlesApi.remove(slug);
    if (!result.ok) {
      setNotice({ kind: 'error', text: result.error });
      return;
    }
    setStored((previous) => previous.filter((post) => post.slug !== slug));
    setActiveTab('publications');
    setNotice({ kind: 'success', text: 'Article deleted.' });
  };

  const handleExportPost = (post: ArticleDocument) => {
    const blob = new Blob([JSON.stringify(post, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${post.slug}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  /** Owner only: drop the stored edit of a built-in masterclass so the original is served again. */
  const handleRevertCustom = async (slug: string) => {
    const original = DEFAULT_MASTERCLASSES.find((post) => post.slug === slug);
    if (!original) return;
    if (!storedBySlug.has(slug)) {
      startEditing(original);
      return;
    }
    if (!confirm('Discard your edits and restore the original version of this masterclass?')) return;
    const result = await articlesApi.remove(slug);
    if (!result.ok) {
      setNotice({ kind: 'error', text: result.error });
      return;
    }
    setStored((previous) => previous.filter((post) => post.slug !== slug));
    startEditing(original);
    setNotice({ kind: 'success', text: 'Restored the original version.' });
  };

  const updateSection = (index: number, patch: Partial<ArticleSection>) => {
    const sections = editingPost.sections.map((section, i) => (i === index ? ({ ...section, ...patch } as ArticleSection) : section));
    setEditingPost({ ...editingPost, sections });
  };
  const updateMarkdownSection = (index: number, content: string) => updateSection(index, { content });
  const updateCalloutSection = (index: number, patch: { title?: string; text?: string; variant?: CalloutVariant }) => updateSection(index, patch);
  const updateLabSection = (index: number, patch: { title?: string; step?: string; dsl?: string; height?: number }) => updateSection(index, patch);

  const removeSection = (index: number) => {
    setEditingPost({ ...editingPost, sections: editingPost.sections.filter((_, i) => i !== index) });
  };

  const moveSection = (index: number, direction: 'up' | 'down') => {
    const target = direction === 'up' ? index - 1 : index + 1;
    if (target < 0 || target >= editingPost.sections.length) return;
    const sections = [...editingPost.sections];
    [sections[index], sections[target]] = [sections[target], sections[index]];
    setEditingPost({ ...editingPost, sections });
  };

  const addMarkdownSection = () =>
    setEditingPost({ ...editingPost, sections: [...editingPost.sections, { type: 'markdown', content: '### New section\n\n' }] });

  const addCalloutSection = () =>
    setEditingPost({
      ...editingPost,
      sections: [...editingPost.sections, { type: 'callout', variant: 'warning', title: 'Note', text: '' }],
    });

  const addLabSection = (presetId = 'start-stop') => {
    const index = editingPost.sections.filter((section) => section.type === 'lab').length + 1;
    setEditingPost({ ...editingPost, sections: [...editingPost.sections, starterLab(presetId, index)] });
  };

  const loadCircuitText = (index: number, text: string, fallbackTitle: string) => {
    try {
      const doc = parseCircuitDocument(text);
      updateLabSection(index, { dsl: stringifyCircuitDSL(doc), title: doc.name || fallbackTitle });
      setNotice({ kind: 'success', text: `Loaded "${doc.name || fallbackTitle}" into lab ${index + 1}.` });
    } catch (err) {
      setNotice({ kind: 'error', text: `That circuit could not be loaded: ${(err as Error).message}` });
    }
  };

  const importActiveCircuitFromLab = (index: number) => {
    let raw: string | null = null;
    try {
      raw = localStorage.getItem(LAB_STORAGE_KEY);
    } catch {}
    if (!raw) {
      setNotice({ kind: 'error', text: 'No saved circuit found. Build one in the Logic Lab, press Save there, then import it here.' });
      return;
    }
    loadCircuitText(index, raw, 'Imported circuit');
  };

  const handleCircuitFileUpload = (index: number, file: File) => {
    void file.text().then((text) => loadCircuitText(index, text, file.name));
  };

  const handleValidate = (text: string) => {
    if (!text.trim()) {
      setParsedPost(null);
      setValidationError(null);
      return;
    }
    try {
      setParsedPost(parseArticleUpload(text));
      setValidationError(null);
    } catch (err) {
      setParsedPost(null);
      setValidationError((err as Error).message);
    }
  };

  const handleFileDrop = (file: File) => {
    void file.text().then(handleValidate);
  };

  const handlePublishUploaded = async () => {
    if (!parsedPost) return;
    setSaving(true);
    const result = await articlesApi.save(parsedPost);
    setSaving(false);
    if (!result.ok) {
      setNotice({ kind: 'error', text: result.error });
      return;
    }
    const saved = result.data.article;
    setStored((previous) => [saved, ...previous.filter((post) => post.slug !== saved.slug)]);
    startEditing(saved);
    setNotice({ kind: 'success', text: `Imported and published "${saved.title}".` });
  };

  if (!checked) {
    return (
      <div className="min-h-screen bg-[#fbfbfd] flex flex-col items-center justify-center text-[#1d1d1f] font-sans px-4">
        <div className="w-8 h-8 rounded-full border-2 border-[#e5e5ea] border-t-[#0071e3] animate-spin mb-4" />
        <p className="text-xs font-mono text-[#86868b]">Checking your session…</p>
      </div>
    );
  }

  if (!currentUser) {
    const redirectUrl = editSlugParam ? `/write?edit=${encodeURIComponent(editSlugParam)}` : '/write';
    return (
      <main className="min-h-[calc(100vh-64px)] bg-[#fbfbfd] flex flex-col justify-center items-center px-4 py-16 font-sans antialiased">
        <div className="max-w-md w-full bg-white border border-[#e5e5ea] rounded-3xl p-8 sm:p-10 shadow-sm text-center">
          <div className="w-16 h-16 rounded-2xl bg-[#f5f5f7] border border-[#e5e5ea] flex items-center justify-center mx-auto mb-6">
            <Lock size={28} className="text-[#0071e3]" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#1d1d1f] mb-3">Sign in to write</h1>
          <p className="text-sm text-[#515154] leading-relaxed mb-6">
            {accounts
              ? 'The Studio is open to everyone with a free account. Write articles with live, runnable circuits and publish them to the site.'
              : 'Accounts are not available on this deployment because no database is configured.'}
          </p>
          {accounts && (
            <div className="space-y-3">
              <Link
                href={`/signin?redirect=${encodeURIComponent(redirectUrl)}`}
                className="w-full py-3 px-5 rounded-full bg-[#0071e3] hover:bg-[#0077ed] text-white font-medium text-sm flex items-center justify-center gap-2 shadow-xs transition-all"
              >
                <LogIn size={15} />
                <span>Sign in</span>
              </Link>
              <Link
                href={`/signin?mode=signup&redirect=${encodeURIComponent(redirectUrl)}`}
                className="w-full py-3 px-5 rounded-full bg-white hover:bg-[#f5f5f7] border border-[#e5e5ea] text-[#1d1d1f] font-medium text-sm flex items-center justify-center gap-2 transition"
              >
                <span>Create a free account</span>
              </Link>
            </div>
          )}
        </div>
      </main>
    );
  }

  return (
    <main className="bg-[#fbfbfd] min-h-screen text-[#1d1d1f] pb-32 font-sans selection:bg-[#0071e3]/20 selection:text-[#0071e3]">
      {/* Top Header / Mode Switcher */}
      <div className="border-b border-[#e5e5ea] bg-white/80 backdrop-blur-xl py-4 px-6 sticky top-0 z-30 shadow-xs">
        <div className="max-w-6xl mx-auto flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="font-mono text-xs font-semibold text-[#1d1d1f] bg-white border border-[#e5e5ea] px-3 py-1 rounded-full flex items-center gap-1.5 shadow-xs">
              <span className="w-2 h-2 rounded-full bg-[#059669] animate-pulse" />
              <span>STUDIO // {currentUser.name}</span>
            </span>

            {/* Navigation Tabs */}
            <div className="flex bg-[#f5f5f7] p-1 rounded-xl border border-[#e5e5ea]">
              <button
                type="button"
                onClick={() => setActiveTab('publications')}
                className={`px-4 py-1.5 text-xs font-mono font-semibold rounded-lg transition ${
                  activeTab === 'publications'
                    ? 'bg-white text-[#1d1d1f] shadow-xs'
                    : 'text-[#86868b] hover:text-[#1d1d1f]'
                }`}
              >
                My Publications ({publications.length})
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('editor')}
                className={`px-4 py-1.5 text-xs font-mono font-semibold rounded-lg transition ${
                  activeTab === 'editor'
                    ? 'bg-white text-[#1d1d1f] shadow-xs'
                    : 'text-[#86868b] hover:text-[#1d1d1f]'
                }`}
              >
                Article Editor
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('upload')}
                className={`px-4 py-1.5 text-xs font-mono font-semibold rounded-lg transition ${
                  activeTab === 'upload'
                    ? 'bg-white text-[#1d1d1f] shadow-xs'
                    : 'text-[#86868b] hover:text-[#1d1d1f]'
                }`}
              >
                Import JSON / MD
              </button>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={startNewArticle}
              className="text-xs font-mono font-medium text-white bg-[#0071e3] hover:bg-[#0077ed] px-3.5 py-1.5 rounded-xl transition flex items-center gap-1.5 shadow-xs"
            >
              <PlusCircle size={14} />
              <span>New article</span>
            </button>
            <Link
              href="/blogs"
              className="text-xs font-mono text-[#1d1d1f] hover:bg-[#f5f5f7] border border-[#e5e5ea] bg-white px-3 py-1.5 rounded-xl transition shadow-xs"
            >
              Browse Directory ↗
            </Link>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 mt-8">
        {/* Status banner */}
        {notice && (
          <div
            role={notice.kind === 'error' ? 'alert' : 'status'}
            className={`mb-6 p-4 rounded-2xl flex items-center justify-between gap-4 text-xs sm:text-sm font-mono shadow-xs border ${
              notice.kind === 'error' ? 'bg-red-50 border-red-200 text-red-800' : 'bg-emerald-50 border-emerald-200 text-emerald-800'
            }`}
          >
            <div className="flex items-center gap-3">
              {notice.kind === 'error' ? <AlertTriangle size={20} className="text-red-600 shrink-0" /> : <CheckCircle size={20} className="text-emerald-600 shrink-0" />}
              <span>{notice.text}</span>
            </div>
            <button type="button" onClick={() => setNotice(null)} className="text-[#86868b] hover:text-[#1d1d1f]">
              Dismiss
            </button>
          </div>
        )}

        {/* ─────────────────────────────────────────────────────────────
            TAB 1: MY PUBLICATIONS (MANAGE OLD & CURRENT WORKS)
        ───────────────────────────────────────────────────────────── */}
        {activeTab === 'publications' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#e5e5ea]">
              <div>
                <h2 className="text-2xl font-bold text-[#1d1d1f] tracking-tight">
                  {`${currentUser.name}’s articles`}
                </h2>
                <p className="text-xs sm:text-sm text-[#86868b] mt-1">
                  {isAuthor ? 'All published articles, plus the built-in masterclasses.' : 'Articles you have published.'}
                </p>
              </div>
              <div className="text-xs font-mono text-[#1d1d1f] bg-white border border-[#e5e5ea] px-3.5 py-2 rounded-xl shadow-xs">
                <span className="text-[#0071e3] font-bold">{publications.length}</span>{' '}
                {publications.length === 1 ? 'ARTICLE' : 'ARTICLES'}
              </div>
            </div>

            {loadingStored ? (
              <p className="text-xs font-mono text-[#86868b]">Loading…</p>
            ) : publications.length === 0 ? (
              <div className="bg-white border border-dashed border-[#d2d2d7] rounded-3xl p-10 sm:p-14 text-center">
                <div className="w-14 h-14 rounded-2xl bg-[#f5f5f7] border border-[#e5e5ea] flex items-center justify-center mx-auto mb-4 text-[#0071e3]">
                  <BookOpen size={24} />
                </div>
                <h3 className="text-lg font-bold text-[#1d1d1f] mb-2">No articles yet</h3>
                <p className="text-xs sm:text-sm text-[#86868b] max-w-md mx-auto mb-6 leading-relaxed">
                  Write about a control problem you know well and embed a live circuit readers can run.
                </p>
                <button
                  type="button"
                  onClick={startNewArticle}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-[#0071e3] hover:bg-[#0077ed] text-white text-xs font-medium shadow-xs transition"
                >
                  <PlusCircle size={15} />
                  <span>Write your first article</span>
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {publications.map((post) => (
                  <div
                    key={post.slug}
                    className="bg-white border border-[#e5e5ea] hover:border-[#0071e3]/40 rounded-2xl p-5 sm:p-6 transition-all flex flex-col justify-between group shadow-xs hover:shadow-md"
                  >
                    <div>
                      <div className="flex items-center justify-between gap-2 mb-3">
                        <span className="font-mono text-[10px] text-cyan-800 bg-cyan-50 border border-cyan-200 px-2.5 py-0.5 rounded-full font-bold">
                          {post.tag}
                        </span>
                        <div className="flex items-center gap-3 font-mono text-[10px] text-[#86868b]">
                          <span>{post.date}</span>
                          {!storedBySlug.has(post.slug) && <span className="text-[#86868b]">built-in</span>}
                        </div>
                      </div>

                      <h3 className="text-lg font-bold text-[#1d1d1f] group-hover:text-[#0071e3] transition-colors leading-snug mb-2">
                        {post.title}
                      </h3>
                      <p className="text-xs text-[#424245] line-clamp-2 leading-relaxed mb-4">
                        {post.excerpt}
                      </p>
                    </div>

                    <div className="pt-3 border-t border-[#e5e5ea] flex items-center justify-between gap-2">
                      <span className="text-[10px] font-mono text-[#86868b] truncate max-w-[180px]">
                        Author: <span className="text-[#1d1d1f] font-semibold">{post.author}</span>
                      </span>

                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => startEditing(post)}
                          className="inline-flex items-center gap-1 text-xs font-mono font-medium text-white bg-[#0071e3] hover:bg-[#0077ed] px-3 py-1.5 rounded-lg transition shadow-xs"
                        >
                          <Edit size={12} />
                          <span>Edit</span>
                        </button>

                        <Link
                          href={`/post/${post.slug}`}
                          target="_blank"
                          className="inline-flex items-center gap-1 text-xs font-mono text-[#1d1d1f] hover:bg-[#e5e5ea] bg-[#f5f5f7] border border-[#e5e5ea] px-2.5 py-1.5 rounded-lg transition"
                          title="View Live Post"
                        >
                          <ExternalLink size={12} />
                        </Link>

                        <button
                          type="button"
                          onClick={() => handleExportPost(post)}
                          className="p-1.5 rounded-lg text-[#86868b] hover:text-[#1d1d1f] hover:bg-[#f5f5f7] transition"
                          title="Download JSON schema"
                        >
                          <Download size={13} />
                        </button>

                        {!CORE_MASTERCLASS_SLUGS.has(post.slug) && storedBySlug.has(post.slug) && (
                          <button
                            type="button"
                            onClick={() => void handleDeleteCustom(post.slug)}
                            className="p-1.5 rounded-lg text-[#86868b] hover:text-red-600 hover:bg-red-50 transition"
                            title="Delete Masterclass"
                          >
                            <Trash2 size={13} />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ─────────────────────────────────────────────────────────────
            TAB 2: DOCUMENT & LOGIC EDITOR (EDIT ANY MASTERCLASS)
        ───────────────────────────────────────────────────────────── */}
        {activeTab === 'editor' && (
          <div className="space-y-6">
            {/* Editor Action Bar */}
            <div className="flex flex-wrap items-center justify-between gap-4 p-4 rounded-2xl bg-white border border-[#e5e5ea] shadow-xs">
              <div className="flex items-center gap-3">
                <span className="text-xs font-mono font-bold text-[#86868b]">
                  EDITING: <span className="text-[#1d1d1f] font-mono">{editingPost.slug || 'Untitled'}</span>
                </span>
                <div className="flex bg-[#f5f5f7] p-0.5 rounded-xl border border-[#e5e5ea] text-xs font-mono">
                  <button
                    type="button"
                    onClick={() => {
                      setEditorMode('fields');
                      setIsPreviewMode(false);
                    }}
                    className={`px-3 py-1 rounded-lg transition ${
                      editorMode === 'fields' && !isPreviewMode
                        ? 'bg-white text-[#1d1d1f] font-bold shadow-xs'
                        : 'text-[#86868b] hover:text-[#1d1d1f]'
                    }`}
                  >
                    Form Mode
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setEditorMode('json');
                      setEditorRawJson(JSON.stringify(editingPost, null, 2));
                      setIsPreviewMode(false);
                    }}
                    className={`px-3 py-1 rounded-lg transition ${
                      editorMode === 'json' && !isPreviewMode
                        ? 'bg-white text-[#1d1d1f] font-bold shadow-xs'
                        : 'text-[#86868b] hover:text-[#1d1d1f]'
                    }`}
                  >
                    Raw JSON
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsPreviewMode(!isPreviewMode)}
                    className={`px-3 py-1 rounded-lg transition ${
                      isPreviewMode
                        ? 'bg-[#0071e3] text-white font-bold shadow-xs'
                        : 'text-[#86868b] hover:text-[#1d1d1f]'
                    }`}
                  >
                    <span className="flex items-center gap-1">
                      <Eye size={12} />
                      <span>Live Preview</span>
                    </span>
                  </button>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {isAuthor && CORE_MASTERCLASS_SLUGS.has(editingPost.slug) && (
                  <button
                    type="button"
                    onClick={() => void handleRevertCustom(editingPost.slug)}
                    className="px-3.5 py-1.5 rounded-xl border border-[#e5e5ea] bg-white hover:bg-[#f5f5f7] text-[#86868b] hover:text-[#1d1d1f] font-mono text-xs transition shadow-xs"
                    title="Revert custom changes to default baseline"
                  >
                    Restore original
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => handleExportPost(editingPost)}
                  className="px-3.5 py-1.5 rounded-xl border border-[#e5e5ea] bg-white hover:bg-[#f5f5f7] text-[#1d1d1f] font-mono text-xs transition flex items-center gap-1 shadow-xs"
                >
                  <Download size={13} />
                  <span>Export JSON</span>
                </button>
                <button
                  type="button"
                  onClick={() => void handleSavePost()}
                  disabled={saving || !isPostEditable}
                  className="px-4 py-1.5 rounded-xl bg-[#0071e3] hover:bg-[#0077ed] text-white font-medium font-mono text-xs transition flex items-center gap-1.5 shadow-xs disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Save size={13} />
                  <span>{saving ? 'Publishing…' : 'Publish'}</span>
                </button>
              </div>
            </div>

            {/* LIVE PREVIEW MODE */}
            {isPreviewMode ? (
              <div className="p-8 rounded-2xl bg-white text-zinc-900 shadow-md border border-[#e5e5ea] space-y-6 not-prose">
                <div className="pb-4 border-b border-gray-200 flex justify-between items-center text-xs font-mono text-gray-500">
                  <span>PREVIEW RENDERING // {editingPost.slug}</span>
                  <span>Author: {editingPost.author} · {editingPost.date}</span>
                </div>
                <h1 className="text-3xl sm:text-4xl font-serif font-bold text-gray-950 leading-tight">
                  {editingPost.title}
                </h1>
                <p className="text-base text-gray-600 font-serif leading-relaxed italic">
                  {editingPost.excerpt}
                </p>
                <div className="pt-4">
                  <ArticleSections sections={editingPost.sections} />
                </div>
              </div>
            ) : editorMode === 'json' ? (
              /* RAW JSON EDITING MODE */
              <div className="space-y-3">
                <div className="text-xs font-mono text-[#86868b] flex justify-between">
                  <span>Structured Article Schema (JSON):</span>
                  <span>{isPostEditable ? 'Press Save above to commit updates' : 'Read-Only Core Article Schema'}</span>
                </div>
                <textarea
                  value={editorRawJson}
                  readOnly={!isPostEditable}
                  onChange={(e) => setEditorRawJson(e.target.value)}
                  className={`w-full h-[600px] font-mono text-xs p-4 rounded-2xl bg-[#1d1d1f] border border-zinc-700 text-emerald-300 outline-none leading-relaxed shadow-inner ${
                    isPostEditable ? 'focus:border-[#0071e3]' : 'opacity-90 cursor-default'
                  }`}
                />
              </div>
            ) : (
              /* STRUCTURED FORM MODE */
              <div className="space-y-6">
                {/* Metadata Fields Card */}
                <div className="p-6 rounded-2xl bg-white border border-[#e5e5ea] shadow-xs space-y-4">
                  <h3 className="text-xs font-mono uppercase tracking-widest text-[#86868b] font-bold">
                    Publication Metadata {!isPostEditable && '(Locked: core masterclass)'}
                  </h3>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-mono text-[#86868b] mb-1">Title</label>
                      <input
                        type="text"
                        value={editingPost.title}
                        readOnly={!isPostEditable}
                        onChange={(e) => setEditingPost({ ...editingPost, title: e.target.value })}
                        className={`w-full px-3.5 py-2.5 rounded-xl bg-[#f5f5f7] border border-[#e5e5ea] text-[#1d1d1f] font-medium text-sm outline-none transition ${
                          isPostEditable ? 'focus:border-[#0071e3] focus:bg-white' : 'cursor-default opacity-85'
                        }`}
                        placeholder="e.g. Dual-Pump Sequencing & Cavitation Trip Automation"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-mono text-[#86868b] mb-1">Slug (URL Path)</label>
                      <input
                        type="text"
                        value={editingPost.slug}
                        readOnly={!isPostEditable}
                        onChange={(e) => setEditingPost({ ...editingPost, slug: e.target.value })}
                        className={`w-full px-3.5 py-2.5 rounded-xl bg-[#f5f5f7] border border-[#e5e5ea] text-[#0071e3] font-mono text-sm outline-none transition ${
                          isPostEditable ? 'focus:border-[#0071e3] focus:bg-white' : 'cursor-default opacity-85'
                        }`}
                        placeholder="e.g. dual-pump-sequencing"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-mono text-[#86868b] mb-1">Author</label>
                      <input
                        type="text"
                        value={isAuthor ? editingPost.author : currentUser.name}
                        readOnly={!isPostEditable || !isAuthor}
                        title={isAuthor ? undefined : 'Articles are published under your username.'}
                        onChange={(e) => setEditingPost({ ...editingPost, author: e.target.value })}
                        className={`w-full px-3.5 py-2.5 rounded-xl bg-[#f5f5f7] border border-[#e5e5ea] text-[#1d1d1f] font-mono text-sm outline-none transition ${
                          isPostEditable ? 'focus:border-[#0071e3] focus:bg-white' : 'cursor-default opacity-85'
                        }`}
                        placeholder={OWNER_HANDLE}
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-mono text-[#86868b] mb-1">Category / Tag</label>
                      <input
                        type="text"
                        value={editingPost.tag}
                        readOnly={!isPostEditable}
                        onChange={(e) => setEditingPost({ ...editingPost, tag: e.target.value })}
                        className={`w-full px-3.5 py-2.5 rounded-xl bg-[#f5f5f7] border border-[#e5e5ea] text-[#1d1d1f] text-sm outline-none transition ${
                          isPostEditable ? 'focus:border-[#0071e3] focus:bg-white' : 'cursor-default opacity-85'
                        }`}
                        placeholder="e.g. Process Control, Safety / ESD, Renewables"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-mono text-[#86868b] mb-1">Excerpt / Technical Summary</label>
                    <textarea
                      rows={3}
                      value={editingPost.excerpt}
                      readOnly={!isPostEditable}
                      onChange={(e) => setEditingPost({ ...editingPost, excerpt: e.target.value })}
                      className={`w-full px-3.5 py-2.5 rounded-xl bg-[#f5f5f7] border border-[#e5e5ea] text-[#424245] text-xs sm:text-sm outline-none leading-relaxed transition ${
                        isPostEditable ? 'focus:border-[#0071e3] focus:bg-white' : 'cursor-default opacity-85'
                      }`}
                      placeholder="A comprehensive technical breakdown of industrial automation logic, permissive conditions, and fail-safes."
                    />
                  </div>
                </div>

                {/* Sections Editor */}
                <div className="space-y-4">
                  <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
                    <div>
                      <h3 className="text-xs font-mono uppercase tracking-widest text-[#86868b] font-bold">
                        Article Sections ({editingPost.sections.length})
                      </h3>
                      <p className="text-[11px] text-[#86868b] mt-0.5">
                        Build your masterclass by interleaving markdown prose, warning callouts, and interactive circuits.
                      </p>
                    </div>

                    {isPostEditable && (
                      <div className="flex flex-wrap items-center gap-2">
                        <button
                          type="button"
                          onClick={addMarkdownSection}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white hover:bg-[#f5f5f7] border border-[#e5e5ea] text-xs font-mono text-[#1d1d1f] shadow-xs transition"
                          title="Add Markdown Prose"
                        >
                          <PlusCircle size={13} className="text-[#0071e3]" />
                          <span>+ Text Section</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => addLabSection('start-stop')}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-100/80 border border-emerald-200 text-xs font-mono text-emerald-800 shadow-xs transition font-semibold"
                          title="Add Interactive Logic Lab"
                        >
                          <Cpu size={13} className="text-emerald-600" />
                          <span>+ Interactive Lab</span>
                        </button>

                        <button
                          type="button"
                          onClick={addCalloutSection}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-50 hover:bg-amber-100/80 border border-amber-200 text-xs font-mono text-amber-800 shadow-xs transition"
                          title="Add Engineering Notice / Callout"
                        >
                          <AlertTriangle size={13} className="text-amber-600" />
                          <span>+ Warning Callout</span>
                        </button>
                      </div>
                    )}
                  </div>

                  {editingPost.sections.map((section, idx) => (
                    <div
                      key={idx}
                      className="p-5 rounded-2xl bg-white border border-[#e5e5ea] shadow-xs space-y-4"
                    >
                      {/* Section Card Header */}
                      <div className="flex items-center justify-between text-xs font-mono text-[#86868b] pb-2 border-b border-[#e5e5ea]">
                        <div className="flex items-center gap-2">
                          <span className="w-5 h-5 rounded-md bg-[#f5f5f7] border border-[#e5e5ea] text-[#1d1d1f] flex items-center justify-center text-[10px] font-bold">
                            {idx + 1}
                          </span>
                          <span className="font-bold text-[#1d1d1f] uppercase tracking-wider">
                            {section.type === 'lab' ? '⚡ INTERACTIVE LOGIC LAB' : section.type === 'callout' ? '⚠️ SAFETY / PERMISSIVE CALLOUT' : '📝 MARKDOWN PROSE'}
                          </span>
                        </div>

                        {isPostEditable && (
                          <div className="flex items-center gap-1">
                            <button
                              type="button"
                              disabled={idx === 0}
                              onClick={() => moveSection(idx, 'up')}
                              className="p-1 rounded-lg hover:bg-[#f5f5f7] text-[#86868b] hover:text-[#1d1d1f] disabled:opacity-30 disabled:hover:bg-transparent"
                              title="Move section up"
                            >
                              <ArrowUp size={13} />
                            </button>
                            <button
                              type="button"
                              disabled={idx === editingPost.sections.length - 1}
                              onClick={() => moveSection(idx, 'down')}
                              className="p-1 rounded-lg hover:bg-[#f5f5f7] text-[#86868b] hover:text-[#1d1d1f] disabled:opacity-30 disabled:hover:bg-transparent"
                              title="Move section down"
                            >
                              <ArrowDown size={13} />
                            </button>
                            <button
                              type="button"
                              onClick={() => removeSection(idx)}
                              className="p-1 rounded-lg hover:bg-red-50 text-[#86868b] hover:text-red-600 ml-1 transition"
                              title="Remove section"
                            >
                              <Trash2 size={13} />
                            </button>
                          </div>
                        )}
                      </div>

                      {/* MARKDOWN SECTION */}
                      {section.type === 'markdown' && (
                        <div className="space-y-1.5">
                          <textarea
                            rows={6}
                            value={section.content}
                            readOnly={!isPostEditable}
                            onChange={(e) => updateMarkdownSection(idx, e.target.value)}
                            className={`w-full px-3.5 py-2.5 rounded-xl bg-[#f5f5f7] border border-[#e5e5ea] text-[#1d1d1f] font-mono text-xs outline-none leading-relaxed transition ${
                              isPostEditable ? 'focus:border-[#0071e3] focus:bg-white' : 'cursor-default opacity-85'
                            }`}
                            placeholder="Write your technical explanation, incident details, or schematics narrative using Markdown..."
                          />
                        </div>
                      )}

                      {/* CALLOUT SECTION */}
                      {section.type === 'callout' && (
                        <div className="space-y-3">
                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                            <div className="sm:col-span-2">
                              <label className="block text-[11px] font-mono text-[#86868b] mb-1">Callout Title</label>
                              <input
                                type="text"
                                value={section.title || ''}
                                readOnly={!isPostEditable}
                                onChange={(e) => updateCalloutSection(idx, { title: e.target.value })}
                                className="w-full px-3 py-1.5 rounded-lg bg-[#f5f5f7] border border-[#e5e5ea] text-xs font-mono text-[#1d1d1f] outline-none"
                                placeholder="e.g. Critical Safety Permissive"
                              />
                            </div>
                            <div>
                              <label className="block text-[11px] font-mono text-[#86868b] mb-1">Variant Type</label>
                              <select
                                value={section.variant || 'warning'}
                                disabled={!isPostEditable}
                                onChange={(e) => updateCalloutSection(idx, { variant: e.target.value as CalloutVariant })}
                                className="w-full px-3 py-1.5 rounded-lg bg-[#f5f5f7] border border-[#e5e5ea] text-xs font-mono text-[#1d1d1f] outline-none"
                              >
                                <option value="warning">Warning (Amber)</option>
                                <option value="info">Info (Blue)</option>
                                <option value="success">Success (Green)</option>
                                <option value="error">Danger (Red)</option>
                              </select>
                            </div>
                          </div>
                          <div>
                            <label className="block text-[11px] font-mono text-[#86868b] mb-1">Notice Body</label>
                            <textarea
                              rows={2}
                              value={section.text}
                              readOnly={!isPostEditable}
                              onChange={(e) => updateCalloutSection(idx, { text: e.target.value })}
                              className="w-full px-3 py-2 rounded-lg bg-[#f5f5f7] border border-[#e5e5ea] text-xs text-[#1d1d1f] outline-none"
                              placeholder="Detail the permissive condition or physical interlock requirement..."
                            />
                          </div>
                        </div>
                      )}

                      {/* INTERACTIVE LAB SECTION */}
                      {section.type === 'lab' && (
                        <div className="space-y-4">
                          {/* Lab Parameters Row */}
                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                            <div className="sm:col-span-2">
                              <label className="block text-[11px] font-mono text-[#86868b] mb-1">Lab Title</label>
                              <input
                                type="text"
                                value={section.title}
                                readOnly={!isPostEditable}
                                onChange={(e) => updateLabSection(idx, { title: e.target.value })}
                                className="w-full px-3 py-1.5 rounded-lg bg-[#f5f5f7] border border-[#e5e5ea] text-xs font-mono text-[#1d1d1f] outline-none"
                                placeholder="e.g. Stage 1: Dual-Ejector Motive Permissive"
                              />
                            </div>
                            <div>
                              <label className="block text-[11px] font-mono text-[#86868b] mb-1">Stage Badge</label>
                              <input
                                type="text"
                                value={section.step || ''}
                                readOnly={!isPostEditable}
                                onChange={(e) => updateLabSection(idx, { step: e.target.value })}
                                className="w-full px-3 py-1.5 rounded-lg bg-[#f5f5f7] border border-[#e5e5ea] text-xs font-mono text-[#1d1d1f] outline-none"
                                placeholder="e.g. Stage 1 of 3"
                              />
                            </div>
                          </div>

                          {/* Lab Control & Import Toolbar */}
                          {isPostEditable && (
                            <div className="p-3 bg-[#fbfbfd] rounded-xl border border-[#e5e5ea] flex flex-wrap items-center justify-between gap-2.5">
                              <div className="flex flex-wrap items-center gap-1.5">
                                <button
                                  type="button"
                                  onClick={() => setPreviewingLabs(prev => ({ ...prev, [idx]: !prev[idx] }))}
                                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-mono font-medium transition shadow-xs ${
                                    previewingLabs[idx]
                                      ? 'bg-[#1d1d1f] text-white'
                                      : 'bg-emerald-600 hover:bg-emerald-700 text-white'
                                  }`}
                                >
                                  <Play size={12} />
                                  <span>{previewingLabs[idx] ? 'Return to Code Editor' : 'Test Live Circuit ⚡'}</span>
                                </button>

                                <button
                                  type="button"
                                  onClick={() => importActiveCircuitFromLab(idx)}
                                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white hover:bg-[#f5f5f7] border border-[#e5e5ea] text-xs font-mono text-[#1d1d1f] transition shadow-xs"
                                  title="Import the active visual circuit currently wired in your Logic Lab workspace"
                                >
                                  <Download size={12} className="text-[#0071e3]" />
                                  <span>Import from Visual Lab</span>
                                </button>

                                <label className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white hover:bg-[#f5f5f7] border border-[#e5e5ea] text-xs font-mono text-[#1d1d1f] cursor-pointer transition shadow-xs">
                                  <FolderOpen size={12} />
                                  <span>Upload .json</span>
                                  <input
                                    type="file"
                                    accept=".json"
                                    className="hidden"
                                    onChange={(e) => {
                                      const file = e.target.files?.[0];
                                      if (file) handleCircuitFileUpload(idx, file);
                                    }}
                                  />
                                </label>
                              </div>

                              <div className="flex items-center gap-2">
                                <span className="text-[11px] font-mono text-[#86868b]">Presets:</span>
                                <div className="flex items-center gap-1">
                                  <button
                                    type="button"
                                    onClick={() => updateLabSection(idx, { dsl: stringifyCircuitDSL(getExample('start-stop')), title: 'Motor Start/Stop Interlock' })}
                                    className="px-2 py-1 rounded bg-white hover:bg-[#f5f5f7] border border-[#e5e5ea] text-[10px] font-mono text-[#1d1d1f]"
                                  >
                                    Latch
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => updateLabSection(idx, { dsl: stringifyCircuitDSL(getExample('and')), title: 'Two-Input Safety AND' })}
                                    className="px-2 py-1 rounded bg-white hover:bg-[#f5f5f7] border border-[#e5e5ea] text-[10px] font-mono text-[#1d1d1f]"
                                  >
                                    AND Gate
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => updateLabSection(idx, { dsl: stringifyCircuitDSL(getExample('analog')), title: 'Analog Sensor Scaling' })}
                                    className="px-2 py-1 rounded bg-white hover:bg-[#f5f5f7] border border-[#e5e5ea] text-[10px] font-mono text-[#1d1d1f]"
                                  >
                                    Analog Scale
                                  </button>
                                </div>
                                <a
                                  href="/lab"
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-[11px] font-mono text-[#0071e3] hover:underline flex items-center gap-0.5 ml-2"
                                  title="Open Visual Logic Lab in another tab to draw circuit visually"
                                >
                                  Open /lab ↗
                                </a>
                              </div>
                            </div>
                          )}

                          {/* Card Body: Live Simulation Preview vs DSL Code Editor */}
                          {previewingLabs[idx] ? (
                            <div className="rounded-2xl overflow-hidden border border-[#e5e5ea] shadow-sm bg-white">
                              <div className="p-3 bg-[#f5f5f7] border-b border-[#e5e5ea] flex items-center justify-between text-xs font-mono text-emerald-800">
                                <span>⚡ LIVE INLINE SIMULATION TEST RUNNER</span>
                                <button
                                  type="button"
                                  onClick={() => setPreviewingLabs(prev => ({ ...prev, [idx]: false }))}
                                  className="text-xs text-[#0071e3] hover:underline"
                                >
                                  Close Preview &amp; Edit Code
                                </button>
                              </div>
                              <InlineLab
                                dsl={section.dsl}
                                title={section.title}
                                step={section.step}
                                height={section.height || 460}
                              />
                            </div>
                          ) : (
                            <div className="space-y-2">
                              <textarea
                                rows={8}
                                value={section.dsl}
                                readOnly={!isPostEditable}
                                onChange={(e) => updateLabSection(idx, { dsl: e.target.value })}
                                className={`w-full p-4 rounded-xl font-mono text-xs text-emerald-300 bg-[#1d1d1f] border border-zinc-700 outline-none leading-relaxed shadow-inner ${
                                  isPostEditable ? 'focus:border-[#0071e3]' : 'opacity-90 cursor-default'
                                }`}
                                placeholder="circuit &quot;Stage Name&quot; version 1 { ... }"
                              />

                              {/* DSL Live Syntax Feedback Badge */}
                              <div className="flex items-center justify-between text-[11px] font-mono">
                                {(() => {
                                  try {
                                    const doc = parseCircuitDSL(section.dsl, BLOCK_CATALOG);
                                    return (
                                      <span className="text-emerald-700 flex items-center gap-1.5 font-semibold">
                                        <CheckCircle size={13} />
                                        <span>DSL Valid: {doc.blocks.length} blocks · {doc.connections.length} wires connected</span>
                                      </span>
                                    );
                                  } catch (err) {
                                    return (
                                      <span className="text-amber-700 flex items-center gap-1.5">
                                        <AlertTriangle size={13} />
                                        <span>Syntax Notice: {(err as Error).message}</span>
                                      </span>
                                    );
                                  }
                                })()}

                                <span className="text-[#86868b]">
                                  Tip: Wire visually in <Link href="/lab" target="_blank" className="text-[#0071e3] underline">/lab</Link> and click &quot;Import from Visual Lab&quot;
                                </span>
                              </div>
                            </div>
                          )}
                        </div>
                      )}

                      {/* IMAGE SECTION */}
                      {section.type === 'image' && (
                        <div className="p-4 bg-[#f5f5f7] rounded-xl text-xs font-mono text-[#86868b] space-y-2">
                          <div className="flex items-center justify-between">
                            <span>Technical Schematic Vector Asset:</span>
                            <span className="text-[#1d1d1f]">{section.src}</span>
                          </div>
                          {section.caption && <p className="italic text-[#515154]">{section.caption}</p>}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ─────────────────────────────────────────────────────────────
            TAB 3: UPLOAD FILE (JSON / MARKDOWN)
        ───────────────────────────────────────────────────────────── */}
        {activeTab === 'upload' && (
          <div>
            <div
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => {
                e.preventDefault();
                if (e.dataTransfer.files?.[0]) handleFileDrop(e.dataTransfer.files[0]);
              }}
              className="border-2 border-dashed border-[#d2d2d7] hover:border-[#0071e3] rounded-2xl p-8 text-center bg-white hover:bg-[#f5f5f7] transition-all cursor-pointer mb-6 shadow-xs"
              onClick={() => fileInputRef.current?.click()}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".json,.md,text/markdown,application/json"
                className="hidden"
                onChange={(e) => {
                  if (e.target.files?.[0]) handleFileDrop(e.target.files[0]);
                }}
              />
              <UploadCloud className="mx-auto text-[#86868b] mb-3" size={40} />
              <h3 className="font-bold text-[#1d1d1f] text-base">Drop an article file here</h3>
              <p className="text-xs text-[#86868b] mt-1">Accepts .json schemas and .md documents with ```fbd blocks</p>
            </div>

            {validationError && (
              <div className="mb-6 p-4 rounded-2xl bg-red-50 border border-red-200 text-red-700 text-xs font-mono flex items-center gap-3">
                <AlertTriangle size={18} className="text-red-500 shrink-0" />
                <span>{validationError}</span>
              </div>
            )}

            {parsedPost && (
              <div className="p-6 rounded-2xl bg-white border border-[#e5e5ea] shadow-xs space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-[#1d1d1f] font-mono">Parsed Article: {parsedPost.title}</h3>
                  <button
                    type="button"
                    onClick={() => void handlePublishUploaded()}
                    disabled={saving}
                    className="px-4 py-2 rounded-xl bg-[#0071e3] hover:bg-[#0077ed] text-white font-medium font-mono text-xs transition shadow-xs disabled:opacity-50"
                  >
                    {saving ? 'Publishing…' : 'Publish'}
                  </button>
                </div>
                <p className="text-xs text-[#424245]">{parsedPost.excerpt}</p>
                <div className="text-[11px] font-mono text-[#86868b]">
                  Sections: {parsedPost.sections.length} · Tag: {parsedPost.tag || 'Automation'} · Author: {isAuthor ? parsedPost.author || OWNER_HANDLE : currentUser.name}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </main>
  );
}

export default function WritePage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#fbfbfd] flex items-center justify-center text-[#86868b] font-mono text-xs">
          Loading Studio…
        </div>
      }
    >
      <WriteContent />
    </Suspense>
  );
}
