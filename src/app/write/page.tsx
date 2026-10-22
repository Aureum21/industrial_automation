'use client';

import React, { useState, useRef, useEffect, Suspense, useMemo } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  UploadCloud,
  FileCode,
  CheckCircle,
  AlertTriangle,
  Eye,
  ArrowRight,
  Download,
  PlusCircle,
  Trash2,
  Edit,
  BookOpen,
  Save,
  RotateCcw,
  Sparkles,
  Layers,
  ShieldCheck,
  User,
  ExternalLink,
  Code2,
} from 'lucide-react';
import {
  parseUploadedFileContent,
  saveCustomPost,
  getEditablePosts,
  getEditablePost,
  deleteCustomPost,
  renderSectionsToReact,
  type ExternalBlogPost,
  type ExternalSection,
} from '@/lib/blogStorage';
import { getCurrentUser, type User as AuthUser } from '@/lib/auth';

const SAMPLE_TEMPLATE_JSON = {
  slug: 'vacuum-degasser-control',
  title: 'Vacuum Degasser Sequence: Dual-Ejector Automation & Cavitation Safeguards',
  excerpt: 'A comprehensive engineering guide on sequencing multi-stage steam ejectors, condenser interlocks, and vacuum vessel pressure regulation.',
  author: 'ALAZAR',
  date: 'Oct 15',
  readingTime: '12 min read',
  tag: 'Vacuum Systems',
  views: 12,
  heroImage: '/water_treatment_pid.jpg',
  sections: [
    {
      type: 'markdown',
      content: '## The Loss of Vacuum at Ejector Skid 2\n\nAt 4:10 AM during a specialty alloy pour, the primary vacuum degasser vessel lost critical suction pressure within 45 seconds.\n\nInvestigation revealed that stage-two motive steam was applied prior to condenser cooling water verification, resulting in thermal vapor blowback and severe ejector throat erosion.'
    },
    {
      type: 'callout',
      variant: 'warning',
      title: 'Motive Steam Pre-Condition',
      text: 'Motive steam must never be introduced to ejectors until inter-condenser cooling water flow and seal pot levels exceed minimum permissives.'
    },
    {
      type: 'markdown',
      content: '### Stage 1: Steam Ejector Permissive Interlock\n\nBelow is the permissive logic ensuring condenser water flow and seal pot switches are confirmed before the steam valve can open:'
    },
    {
      type: 'lab',
      title: 'Stage 1: Motive Steam Permissive Interlock',
      step: 'Stage 1 of 3',
      height: 460,
      dsl: `circuit "Stage 1: Permissives" version 1 {
  cw_flow: INPUT(label="Cooling Water Flow OK", value=true)
  seal_pot: INPUT(label="Seal Pot Level OK", value=true)
  open_cmd: INPUT(label="Open Steam Cmd", value=false)
  perm: AND()
  gate: AND()
  valve: OUTPUT(label="Steam Supply XV-101")

  cw_flow.Q -> perm.A
  seal_pot.Q -> perm.B
  perm.Q -> gate.A
  open_cmd.Q -> gate.B
  gate.Q -> valve.A
}`
    }
  ]
};

function WriteContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const editSlugParam = searchParams.get('edit');

  const [currentUser, setCurrentUser] = useState<AuthUser | null>(null);
  const [activeTab, setActiveTab] = useState<'publications' | 'editor' | 'upload'>('publications');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Publications State
  const [publications, setPublications] = useState<ExternalBlogPost[]>([]);
  const [saveSuccessNotice, setSaveSuccessNotice] = useState<string | null>(null);

  // Active Post in Editor
  const [editingPost, setEditingPost] = useState<ExternalBlogPost>({
    slug: '',
    title: '',
    excerpt: '',
    author: 'ALAZAR',
    date: 'Oct 15',
    readingTime: '15 min read + 20 min labs',
    tag: 'Process Control',
    views: 14,
    sections: [
      {
        type: 'markdown',
        content: '## Overview\n\nWrite your technical introduction here.',
      },
    ],
  });

  const [editorRawJson, setEditorRawJson] = useState<string>('');
  const [editorMode, setEditorMode] = useState<'fields' | 'json'>('fields');
  const [isPreviewMode, setIsPreviewMode] = useState(false);

  // Upload Tab State
  const [rawText, setRawText] = useState('');
  const [parsedPost, setParsedPost] = useState<ExternalBlogPost | null>(null);
  const [validationError, setValidationError] = useState<string | null>(null);

  // Load initial publications and auth
  useEffect(() => {
    setCurrentUser(getCurrentUser());
    const posts = getEditablePosts();
    setPublications(posts);

    // If navigated with ?edit=slug, open that post directly
    if (editSlugParam) {
      const match = getEditablePost(editSlugParam);
      if (match) {
        startEditing(match);
      }
    }
  }, [editSlugParam]);

  const refreshPublications = () => {
    const updated = getEditablePosts();
    setPublications(updated);
  };

  const startEditing = (post: ExternalBlogPost) => {
    setEditingPost(JSON.parse(JSON.stringify(post)));
    setEditorRawJson(JSON.stringify(post, null, 2));
    setActiveTab('editor');
    setSaveSuccessNotice(null);
    setIsPreviewMode(false);
  };

  const startNewArticle = () => {
    const newDoc: ExternalBlogPost = {
      slug: 'new-schematic-' + Date.now().toString(36),
      title: 'New Industrial Masterclass',
      excerpt: 'A comprehensive technical overview of industrial automation logic and controls.',
      author: currentUser?.name || 'ALAZAR',
      date: 'Oct 15',
      readingTime: '15 min read + 20 min labs',
      tag: 'Process Control',
      views: 14,
      sections: [
        {
          type: 'markdown',
          content: '## Introduction & Incident Scenario\n\nDescribe the operational event or plant challenge here.',
        },
        {
          type: 'callout',
          variant: 'warning',
          title: 'Engineering Permissive Notice',
          text: 'Hardware safety interlocks must precede software logic triggers.',
        },
      ],
    };
    startEditing(newDoc);
  };

  const handleSavePost = () => {
    let postToSave = editingPost;

    if (editorMode === 'json') {
      try {
        postToSave = JSON.parse(editorRawJson);
      } catch (err) {
        alert('Invalid JSON syntax: ' + (err as Error).message);
        return;
      }
    }

    if (!postToSave.slug || !postToSave.title) {
      alert('Article requires a valid title and slug.');
      return;
    }

    // Clamp views to <= 20
    const clampedViews = Math.min(20, Math.max(1, Number(postToSave.views) || 1));
    const finalizedPost: ExternalBlogPost = {
      ...postToSave,
      author: postToSave.author || 'ALAZAR',
      views: clampedViews,
    };

    saveCustomPost(finalizedPost);
    setEditingPost(finalizedPost);
    setEditorRawJson(JSON.stringify(finalizedPost, null, 2));
    refreshPublications();
    setSaveSuccessNotice(`"${finalizedPost.title}" saved successfully! Live changes are now active.`);
  };

  const handleExportPost = (post: ExternalBlogPost) => {
    const blob = new Blob([JSON.stringify(post, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${post.slug}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleRevertCustom = (slug: string) => {
    if (confirm('Revert all custom edits to the original default masterclass?')) {
      deleteCustomPost(slug);
      refreshPublications();
      const fresh = getEditablePost(slug);
      if (fresh) startEditing(fresh);
      setSaveSuccessNotice('Reverted article to original baseline.');
    }
  };

  // Section modifiers for fields mode
  const updateSectionContent = (index: number, content: string) => {
    const updated = [...editingPost.sections];
    if (updated[index].type === 'markdown') {
      updated[index] = { ...updated[index], content };
      setEditingPost({ ...editingPost, sections: updated });
    }
  };

  const removeSection = (index: number) => {
    const updated = editingPost.sections.filter((_, i) => i !== index);
    setEditingPost({ ...editingPost, sections: updated });
  };

  const addMarkdownSection = () => {
    const updated = [
      ...editingPost.sections,
      {
        type: 'markdown' as const,
        content: '### New Section\n\nAdd technical documentation or field analysis here.',
      },
    ];
    setEditingPost({ ...editingPost, sections: updated });
  };

  // Upload Tab Handlers
  const handleValidate = (textToValidate: string) => {
    if (!textToValidate.trim()) {
      setParsedPost(null);
      setValidationError(null);
      return;
    }
    try {
      const parsed = parseUploadedFileContent(textToValidate);
      setParsedPost(parsed);
      setValidationError(null);
    } catch (err) {
      setParsedPost(null);
      setValidationError((err as Error).message);
    }
  };

  const handleFileDrop = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const content = (e.target?.result as string) || '';
      setRawText(content);
      handleValidate(content);
    };
    reader.readAsText(file);
  };

  const handlePublishUploaded = () => {
    if (!parsedPost) return;
    const postWithAuthor: ExternalBlogPost = {
      ...parsedPost,
      author: 'ALAZAR',
      views: parsedPost.views && parsedPost.views <= 20 ? parsedPost.views : 14,
    };
    saveCustomPost(postWithAuthor);
    refreshPublications();
    startEditing(postWithAuthor);
    setSaveSuccessNotice(`Imported and published "${postWithAuthor.title}" successfully.`);
  };

  return (
    <main className="bg-[#0b101b] min-h-screen text-zinc-100 pb-32 font-sans selection:bg-emerald-500/30 selection:text-emerald-200">
      {/* Top Header / Mode Switcher */}
      <div className="border-b border-zinc-800 bg-zinc-950/80 backdrop-blur-md py-4 px-6 sticky top-0 z-30 shadow-md">
        <div className="max-w-6xl mx-auto flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="font-mono text-xs font-bold text-emerald-400 bg-emerald-950/80 border border-emerald-500/30 px-3 py-1 rounded-full flex items-center gap-1.5 shadow-[0_0_12px_rgba(16,185,129,0.2)]">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              EDITOR STUDIO // AUTHOR STATION
            </span>

            {/* Navigation Tabs */}
            <div className="flex bg-zinc-900 p-1 rounded-xl border border-zinc-800">
              <button
                type="button"
                onClick={() => setActiveTab('publications')}
                className={`px-4 py-1.5 text-xs font-mono font-semibold rounded-lg transition ${
                  activeTab === 'publications'
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-sm'
                    : 'text-zinc-400 hover:text-white'
                }`}
              >
                My Publications ({publications.length})
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('editor')}
                className={`px-4 py-1.5 text-xs font-mono font-semibold rounded-lg transition ${
                  activeTab === 'editor'
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-sm'
                    : 'text-zinc-400 hover:text-white'
                }`}
              >
                Article Editor
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('upload')}
                className={`px-4 py-1.5 text-xs font-mono font-semibold rounded-lg transition ${
                  activeTab === 'upload'
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-sm'
                    : 'text-zinc-400 hover:text-white'
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
              className="text-xs font-mono font-bold text-zinc-950 bg-emerald-400 hover:bg-emerald-300 px-3.5 py-1.5 rounded-lg transition flex items-center gap-1.5 shadow-[0_0_15px_rgba(52,211,153,0.3)]"
            >
              <PlusCircle size={14} />
              <span>New Masterclass</span>
            </button>
            <Link
              href="/blogs"
              className="text-xs font-mono text-zinc-400 hover:text-white border border-zinc-700 bg-zinc-900 px-3 py-1.5 rounded-lg transition"
            >
              Browse Directory ↗
            </Link>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 mt-8">
        {/* Success Alert Banner */}
        {saveSuccessNotice && (
          <div className="mb-6 p-4 bg-emerald-950/60 border border-emerald-500/40 rounded-xl flex items-center justify-between text-emerald-300 text-xs sm:text-sm font-mono shadow-[0_0_20px_rgba(16,185,129,0.15)] animate-in fade-in">
            <div className="flex items-center gap-3">
              <CheckCircle size={20} className="text-emerald-400 shrink-0" />
              <span>{saveSuccessNotice}</span>
            </div>
            <button
              type="button"
              onClick={() => setSaveSuccessNotice(null)}
              className="text-zinc-400 hover:text-white"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* ─────────────────────────────────────────────────────────────
            TAB 1: MY PUBLICATIONS (MANAGE OLD & CURRENT WORKS)
        ───────────────────────────────────────────────────────────── */}
        {activeTab === 'publications' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-zinc-800">
              <div>
                <h2 className="text-2xl font-bold text-white tracking-tight">
                  Editor Publications &amp; Works
                </h2>
                <p className="text-xs sm:text-sm text-zinc-400 mt-1">
                  Manage, modify, and proof-test masterclasses authored under{' '}
                  <strong className="text-emerald-400">ALAZAR</strong>. Changes save instantly to your live platform.
                </p>
              </div>
              <div className="text-xs font-mono text-zinc-400 bg-zinc-900 border border-zinc-800 px-3 py-2 rounded-lg">
                <span className="text-emerald-400 font-bold">10 OF 10</span> PUBLISHED ARTICLES
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {publications.map((post) => (
                <div
                  key={post.slug}
                  className="bg-zinc-900/60 border border-zinc-800/80 hover:border-emerald-500/40 rounded-xl p-5 transition-all flex flex-col justify-between group shadow-sm hover:shadow-[0_8px_24px_rgba(16,185,129,0.1)]"
                >
                  <div>
                    <div className="flex items-center justify-between gap-2 mb-3">
                      <span className="font-mono text-[10px] text-cyan-400 bg-cyan-950/40 border border-cyan-500/30 px-2 py-0.5 rounded font-bold">
                        {post.tag}
                      </span>
                      <div className="flex items-center gap-3 font-mono text-[10px] text-zinc-400">
                        <span>📅 {post.date}</span>
                        <span className="text-emerald-400">⚡ {post.views} reads</span>
                      </div>
                    </div>

                    <h3 className="text-lg font-bold text-white group-hover:text-emerald-300 transition-colors leading-snug mb-2">
                      {post.title}
                    </h3>
                    <p className="text-xs text-zinc-400 line-clamp-2 leading-relaxed mb-4">
                      {post.excerpt}
                    </p>
                  </div>

                  <div className="pt-3 border-t border-zinc-800/60 flex items-center justify-between gap-2">
                    <span className="text-[10px] font-mono text-zinc-500">
                      Author: <span className="text-zinc-300 font-bold">{post.author}</span>
                    </span>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => startEditing(post)}
                        className="inline-flex items-center gap-1 text-xs font-mono font-bold text-zinc-950 bg-emerald-400 hover:bg-emerald-300 px-3 py-1.5 rounded-lg transition shadow-xs"
                      >
                        <Edit size={12} />
                        <span>Edit</span>
                      </button>

                      <Link
                        href={`/post/${post.slug}`}
                        target="_blank"
                        className="inline-flex items-center gap-1 text-xs font-mono text-zinc-300 hover:text-white bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 px-2.5 py-1.5 rounded-lg transition"
                        title="View Live Post"
                      >
                        <ExternalLink size={12} />
                      </Link>

                      <button
                        type="button"
                        onClick={() => handleExportPost(post)}
                        className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition"
                        title="Download JSON schema"
                      >
                        <Download size={13} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ─────────────────────────────────────────────────────────────
            TAB 2: DOCUMENT & LOGIC EDITOR (EDIT ANY MASTERCLASS)
        ───────────────────────────────────────────────────────────── */}
        {activeTab === 'editor' && (
          <div className="space-y-6">
            {/* Editor Action Bar */}
            <div className="flex flex-wrap items-center justify-between gap-4 p-4 rounded-xl bg-zinc-900 border border-zinc-800">
              <div className="flex items-center gap-3">
                <span className="text-xs font-mono font-bold text-emerald-400">
                  EDITING: <span className="text-white font-mono">{editingPost.slug || 'Untitled'}</span>
                </span>
                <div className="flex bg-zinc-950 p-0.5 rounded-lg border border-zinc-800 text-xs font-mono">
                  <button
                    type="button"
                    onClick={() => {
                      setEditorMode('fields');
                      setIsPreviewMode(false);
                    }}
                    className={`px-3 py-1 rounded-md transition ${
                      editorMode === 'fields' && !isPreviewMode
                        ? 'bg-zinc-800 text-white font-bold'
                        : 'text-zinc-400 hover:text-white'
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
                    className={`px-3 py-1 rounded-md transition ${
                      editorMode === 'json' && !isPreviewMode
                        ? 'bg-zinc-800 text-white font-bold'
                        : 'text-zinc-400 hover:text-white'
                    }`}
                  >
                    Raw JSON
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsPreviewMode(!isPreviewMode)}
                    className={`px-3 py-1 rounded-md transition ${
                      isPreviewMode
                        ? 'bg-emerald-500/20 text-emerald-300 font-bold'
                        : 'text-zinc-400 hover:text-white'
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
                <button
                  type="button"
                  onClick={() => handleRevertCustom(editingPost.slug)}
                  className="px-3 py-1.5 rounded-lg border border-zinc-700 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-mono text-xs transition"
                  title="Revert custom changes to default baseline"
                >
                  Revert to Default
                </button>
                <button
                  type="button"
                  onClick={() => handleExportPost(editingPost)}
                  className="px-3 py-1.5 rounded-lg border border-zinc-700 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-mono text-xs transition flex items-center gap-1"
                >
                  <Download size={13} />
                  <span>Export JSON</span>
                </button>
                <button
                  type="button"
                  onClick={handleSavePost}
                  className="px-4 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-bold font-mono text-xs transition flex items-center gap-1.5 shadow-[0_0_15px_rgba(16,185,129,0.3)]"
                >
                  <Save size={13} />
                  <span>Save &amp; Update Live Article</span>
                </button>
              </div>
            </div>

            {/* LIVE PREVIEW MODE */}
            {isPreviewMode ? (
              <div className="p-8 rounded-2xl bg-white text-zinc-900 shadow-xl border border-zinc-300 space-y-6 not-prose">
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
                  {renderSectionsToReact(editingPost.sections)}
                </div>
              </div>
            ) : editorMode === 'json' ? (
              /* RAW JSON EDITING MODE */
              <div className="space-y-3">
                <div className="text-xs font-mono text-zinc-400 flex justify-between">
                  <span>Structured Article Schema (JSON):</span>
                  <span>Press Save above to commit updates</span>
                </div>
                <textarea
                  value={editorRawJson}
                  onChange={(e) => setEditorRawJson(e.target.value)}
                  className="w-full h-[600px] font-mono text-xs p-4 rounded-xl bg-zinc-950 border border-zinc-800 text-emerald-300 focus:border-emerald-500 outline-none leading-relaxed"
                />
              </div>
            ) : (
              /* STRUCTURED FORM MODE */
              <div className="space-y-6">
                {/* Metadata Fields Card */}
                <div className="p-6 rounded-2xl bg-zinc-900/80 border border-zinc-800 space-y-4">
                  <h3 className="text-xs font-mono uppercase tracking-widest text-emerald-400 font-bold">
                    Publication Metadata
                  </h3>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-mono text-zinc-400 mb-1">Title</label>
                      <input
                        type="text"
                        value={editingPost.title}
                        onChange={(e) => setEditingPost({ ...editingPost, title: e.target.value })}
                        className="w-full px-3 py-2 rounded-lg bg-zinc-950 border border-zinc-800 text-white font-medium text-sm focus:border-emerald-500 outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-mono text-zinc-400 mb-1">Slug (URL Path)</label>
                      <input
                        type="text"
                        value={editingPost.slug}
                        onChange={(e) => setEditingPost({ ...editingPost, slug: e.target.value })}
                        className="w-full px-3 py-2 rounded-lg bg-zinc-950 border border-zinc-800 text-cyan-300 font-mono text-sm focus:border-emerald-500 outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-mono text-zinc-400 mb-1">Author</label>
                      <input
                        type="text"
                        value={editingPost.author}
                        onChange={(e) => setEditingPost({ ...editingPost, author: e.target.value })}
                        className="w-full px-3 py-2 rounded-lg bg-zinc-950 border border-zinc-800 text-white font-mono text-sm focus:border-emerald-500 outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-mono text-zinc-400 mb-1">Publish Date</label>
                      <input
                        type="text"
                        value={editingPost.date}
                        onChange={(e) => setEditingPost({ ...editingPost, date: e.target.value })}
                        className="w-full px-3 py-2 rounded-lg bg-zinc-950 border border-zinc-800 text-white font-mono text-sm focus:border-emerald-500 outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-mono text-zinc-400 mb-1">Read Count (Max 20)</label>
                      <input
                        type="number"
                        min={1}
                        max={20}
                        value={editingPost.views ?? 14}
                        onChange={(e) =>
                          setEditingPost({
                            ...editingPost,
                            views: Math.min(20, Math.max(1, parseInt(e.target.value) || 1)),
                          })
                        }
                        className="w-full px-3 py-2 rounded-lg bg-zinc-950 border border-zinc-800 text-emerald-400 font-mono text-sm focus:border-emerald-500 outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-mono text-zinc-400 mb-1">Category / Tag</label>
                      <input
                        type="text"
                        value={editingPost.tag}
                        onChange={(e) => setEditingPost({ ...editingPost, tag: e.target.value })}
                        className="w-full px-3 py-2 rounded-lg bg-zinc-950 border border-zinc-800 text-white text-sm focus:border-emerald-500 outline-none"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-mono text-zinc-400 mb-1">Excerpt / Summary</label>
                    <textarea
                      rows={3}
                      value={editingPost.excerpt}
                      onChange={(e) => setEditingPost({ ...editingPost, excerpt: e.target.value })}
                      className="w-full px-3 py-2 rounded-lg bg-zinc-950 border border-zinc-800 text-zinc-300 text-xs sm:text-sm focus:border-emerald-500 outline-none leading-relaxed"
                    />
                  </div>
                </div>

                {/* Sections Editor */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xs font-mono uppercase tracking-widest text-emerald-400 font-bold">
                      Article Sections &amp; Markdown Prose ({editingPost.sections.length})
                    </h3>
                    <button
                      type="button"
                      onClick={addMarkdownSection}
                      className="inline-flex items-center gap-1 text-xs font-mono text-emerald-400 hover:text-emerald-300"
                    >
                      <PlusCircle size={14} />
                      <span>Add Text Section</span>
                    </button>
                  </div>

                  {editingPost.sections.map((section, idx) => (
                    <div
                      key={idx}
                      className="p-4 rounded-xl bg-zinc-900/60 border border-zinc-800 space-y-2"
                    >
                      <div className="flex items-center justify-between text-xs font-mono text-zinc-400">
                        <span className="font-bold text-zinc-200">
                          SECTION {idx + 1} // TYPE: {section.type.toUpperCase()}
                        </span>
                        {section.type === 'markdown' && (
                          <button
                            type="button"
                            onClick={() => removeSection(idx)}
                            className="text-red-400 hover:text-red-300 p-1"
                            title="Remove section"
                          >
                            <Trash2 size={14} />
                          </button>
                        )}
                      </div>

                      {section.type === 'markdown' ? (
                        <textarea
                          rows={6}
                          value={section.content}
                          onChange={(e) => updateSectionContent(idx, e.target.value)}
                          className="w-full px-3 py-2 rounded-lg bg-zinc-950 border border-zinc-800 text-zinc-200 font-mono text-xs focus:border-emerald-500 outline-none leading-relaxed"
                        />
                      ) : section.type === 'callout' ? (
                        <div className="p-3 bg-zinc-950 rounded-lg text-xs space-y-1 border border-zinc-800">
                          <strong className="text-amber-400 block font-mono">{section.title}</strong>
                          <p className="text-zinc-300">{section.text}</p>
                        </div>
                      ) : section.type === 'lab' ? (
                        <div className="p-3 bg-zinc-950 rounded-lg text-xs space-y-1.5 border border-zinc-800">
                          <div className="flex items-center justify-between font-mono text-emerald-400">
                            <strong>⚡ InlineLab: {section.title}</strong>
                            <span>{section.step}</span>
                          </div>
                          <pre className="text-[10px] text-zinc-400 font-mono bg-zinc-900/80 p-2 rounded overflow-x-auto max-h-32">
                            {section.dsl}
                          </pre>
                        </div>
                      ) : section.type === 'image' ? (
                        <div className="text-xs font-mono text-zinc-400">
                          <span>[SVG Technical Blueprint Vector Embedded]</span>
                        </div>
                      ) : null}
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
              className="border-2 border-dashed border-zinc-700 hover:border-emerald-500 rounded-2xl p-8 text-center bg-zinc-900/40 hover:bg-emerald-950/20 transition-all cursor-pointer mb-6"
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
              <UploadCloud className="mx-auto text-zinc-400 mb-3" size={40} />
              <h3 className="font-bold text-white text-base">Drop Masterclass File Here</h3>
              <p className="text-xs text-zinc-400 mt-1">Accepts .json schemas and .md documents with ```fbd blocks</p>
            </div>

            {validationError && (
              <div className="mb-6 p-4 rounded-xl bg-red-950/60 border border-red-500/40 text-red-300 text-xs font-mono flex items-center gap-3">
                <AlertTriangle size={18} className="text-red-400 shrink-0" />
                <span>{validationError}</span>
              </div>
            )}

            {parsedPost && (
              <div className="p-6 rounded-2xl bg-zinc-900/80 border border-zinc-800 space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-white font-mono">Parsed Article: {parsedPost.title}</h3>
                  <button
                    type="button"
                    onClick={handlePublishUploaded}
                    className="px-4 py-2 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-bold font-mono text-xs transition"
                  >
                    Publish to Platform
                  </button>
                </div>
                <p className="text-xs text-zinc-400">{parsedPost.excerpt}</p>
                <div className="text-[11px] font-mono text-zinc-500">
                  Sections: {parsedPost.sections.length} · Tag: {parsedPost.tag} · Author: ALAZAR
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
        <div className="min-h-screen bg-[#0b101b] flex items-center justify-center text-zinc-400 font-mono text-xs">
          Loading Authoring Studio...
        </div>
      }
    >
      <WriteContent />
    </Suspense>
  );
}
