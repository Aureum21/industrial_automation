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
  Lock,
  LogIn,
  ShieldAlert,
} from 'lucide-react';
import {
  parseUploadedFileContent,
  saveCustomPost,
  getEditablePosts,
  getEditablePost,
  deleteCustomPost,
  renderSectionsToReact,
  CORE_MASTERCLASS_SLUGS,
  isAuthorUser,
  type ExternalBlogPost,
  type ExternalSection,
} from '@/lib/blogStorage';
import { checkSessionWithNeon, getCurrentUser, type User as AuthUser } from '@/lib/auth';
import { AUTHOR_NAME, AUTHOR_LINKEDIN } from '@/lib/mockPosts';

const SAMPLE_TEMPLATE_JSON = {
  slug: 'vacuum-degasser-control',
  title: 'Vacuum Degasser Sequence: Dual-Ejector Automation & Cavitation Safeguards',
  excerpt: 'A comprehensive engineering guide on sequencing multi-stage steam ejectors, condenser interlocks, and vacuum vessel pressure regulation.',
  author: AUTHOR_NAME,
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
  const isAuthor = useMemo(() => isAuthorUser(currentUser), [currentUser]);
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
    author: AUTHOR_NAME,
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
    // 1. Initial cached user state
    setCurrentUser(getCurrentUser());

    // 2. Validate live server session against Neon PostgreSQL
    checkSessionWithNeon().then((serverUser) => {
      if (serverUser) {
        setCurrentUser(serverUser);
      }
    });

    const posts = getEditablePosts();
    setPublications(posts);

    // Fetch live read counts from Neon PostgreSQL
    fetch('/api/views')
      .then((res) => res.json())
      .then((data) => {
        if (data.ok && data.views) {
          setPublications((prev) =>
            prev.map((p) => ({
              ...p,
              views: data.views[p.slug] !== undefined ? data.views[p.slug] : p.views,
            }))
          );
        }
      })
      .catch(() => {});

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
    fetch('/api/views')
      .then((res) => res.json())
      .then((data) => {
        if (data.ok && data.views) {
          setPublications((prev) =>
            prev.map((p) => ({
              ...p,
              views: data.views[p.slug] !== undefined ? data.views[p.slug] : p.views,
            }))
          );
        }
      })
      .catch(() => {});
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
      author: currentUser?.name || AUTHOR_NAME,
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

    // Security check: Only author Alazar Wake Kore can modify core masterclasses
    if (!isAuthor && (CORE_MASTERCLASS_SLUGS.has(postToSave.slug) || (postToSave.author && postToSave.author.toLowerCase().includes('alazar')))) {
      alert('Access Restricted: The 10 core masterclasses are protected and can only be modified by author Alazar Wake Kore. Please sign in as Alazar to save.');
      return;
    }

    const finalizedPost: ExternalBlogPost = {
      ...postToSave,
      author: postToSave.author || AUTHOR_NAME,
      date: postToSave.date || 'Oct 15',
      views: Number(postToSave.views) || 1,
    };

    const result = saveCustomPost(finalizedPost);
    if (result && !result.ok) {
      alert(result.error || 'Failed to save post.');
      return;
    }

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
    if (!isAuthor) {
      alert('Access Restricted: Only author Alazar Wake Kore can revert or modify masterclasses.');
      return;
    }
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
    if (!isAuthor && (CORE_MASTERCLASS_SLUGS.has(parsedPost.slug) || (parsedPost.author && parsedPost.author.toLowerCase().includes('alazar')))) {
      alert('Access Restricted: The 10 core masterclasses are protected and can only be published by author Alazar Wake Kore. Please sign in as Alazar to publish.');
      return;
    }
    const postWithAuthor: ExternalBlogPost = {
      ...parsedPost,
      author: AUTHOR_NAME,
      views: parsedPost.views && parsedPost.views <= 20 ? parsedPost.views : 14,
    };
    const result = saveCustomPost(postWithAuthor);
    if (result && !result.ok) {
      alert(result.error || 'Failed to publish post.');
      return;
    }
    refreshPublications();
    startEditing(postWithAuthor);
    setSaveSuccessNotice(`Imported and published "${postWithAuthor.title}" successfully.`);
  };

  return (
    <main className="bg-[#fbfbfd] min-h-screen text-[#1d1d1f] pb-32 font-sans selection:bg-[#0071e3]/20 selection:text-[#0071e3]">
      {/* Top Header / Mode Switcher */}
      <div className="border-b border-[#e5e5ea] bg-white/80 backdrop-blur-xl py-4 px-6 sticky top-0 z-30 shadow-xs">
        <div className="max-w-6xl mx-auto flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            {isAuthor ? (
              <span className="font-mono text-xs font-semibold text-[#1d1d1f] bg-white border border-[#e5e5ea] px-3 py-1 rounded-full flex items-center gap-1.5 shadow-xs">
                <span className="w-2 h-2 rounded-full bg-[#059669] animate-pulse" />
                <span>AUTHOR STATION // {currentUser?.name || 'ALAZAR WAKE KORE'}</span>
              </span>
            ) : (
              <span className="font-mono text-xs font-medium text-[#86868b] bg-[#f5f5f7] border border-[#e5e5ea] px-3 py-1 rounded-full flex items-center gap-1.5 shadow-2xs">
                <Lock size={12} className="text-amber-600" />
                <span>READ-ONLY STUDIO // GUEST MODE</span>
              </span>
            )}

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
            {isAuthor ? (
              <button
                type="button"
                onClick={startNewArticle}
                className="text-xs font-mono font-medium text-white bg-[#0071e3] hover:bg-[#0077ed] px-3.5 py-1.5 rounded-xl transition flex items-center gap-1.5 shadow-xs"
              >
                <PlusCircle size={14} />
                <span>New Masterclass</span>
              </button>
            ) : (
              <Link
                href="/signin?redirect=/write"
                className="text-xs font-mono font-medium text-white bg-[#1d1d1f] hover:bg-black px-3.5 py-1.5 rounded-xl transition flex items-center gap-1.5 shadow-xs"
              >
                <LogIn size={13} />
                <span>Sign In as Alazar</span>
              </Link>
            )}
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
        {/* Author Security Notice Banner if not logged in as Alazar */}
        {!isAuthor && (
          <div className="mb-6 p-4 rounded-2xl bg-amber-50/80 border border-amber-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-2xs">
            <div className="flex items-start sm:items-center gap-3">
              <span className="p-2 rounded-xl bg-amber-100 text-amber-800 shrink-0">
                <Lock size={16} />
              </span>
              <div>
                <div className="text-xs font-bold text-amber-900 font-mono uppercase tracking-wider">
                  AUTHOR AUTHENTICATION REQUIRED
                </div>
                <p className="text-xs text-amber-800 mt-0.5 leading-relaxed">
                  The 10 industrial masterclasses are locked and can only be modified by primary author <strong>Alazar Wake Kore</strong>. You can inspect schematics in read-only mode, or sign in to edit.
                </p>
              </div>
            </div>
            <Link
              href="/signin?redirect=/write"
              className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-full bg-[#1d1d1f] hover:bg-black text-white text-xs font-semibold shrink-0 shadow-xs transition"
            >
              <LogIn size={13} />
              <span>Sign In as Alazar</span>
            </Link>
          </div>
        )}

        {/* Success Alert Banner */}
        {saveSuccessNotice && (
          <div className="mb-6 p-4 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center justify-between text-emerald-800 text-xs sm:text-sm font-mono shadow-xs animate-in fade-in">
            <div className="flex items-center gap-3">
              <CheckCircle size={20} className="text-emerald-600 shrink-0" />
              <span>{saveSuccessNotice}</span>
            </div>
            <button
              type="button"
              onClick={() => setSaveSuccessNotice(null)}
              className="text-[#86868b] hover:text-[#1d1d1f]"
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
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#e5e5ea]">
              <div>
                <h2 className="text-2xl font-bold text-[#1d1d1f] tracking-tight">
                  Editor Publications &amp; Works
                </h2>
                <p className="text-xs sm:text-sm text-[#86868b] mt-1">
                  Manage, modify, and proof-test masterclasses authored by{' '}
                  <a
                    href={AUTHOR_LINKEDIN}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[#0071e3] hover:underline font-bold inline-flex items-center gap-1"
                  >
                    Alazar Wake Kore
                    <ExternalLink size={12} />
                  </a>
                  . Changes save instantly to your live platform.
                </p>
              </div>
              <div className="text-xs font-mono text-[#1d1d1f] bg-white border border-[#e5e5ea] px-3.5 py-2 rounded-xl shadow-xs">
                <span className="text-[#0071e3] font-bold">10 OF 10</span> PUBLISHED ARTICLES
              </div>
            </div>

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
                        <span>📅 {post.date}</span>
                        <span className="text-emerald-700 font-semibold">⚡ {post.views} reads</span>
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
                    <span className="text-[10px] font-mono text-[#86868b]">
                      Author: <span className="text-[#1d1d1f] font-semibold">{post.author}</span>
                    </span>

                    <div className="flex items-center gap-2">
                      {isAuthor ? (
                        <button
                          type="button"
                          onClick={() => startEditing(post)}
                          className="inline-flex items-center gap-1 text-xs font-mono font-medium text-white bg-[#0071e3] hover:bg-[#0077ed] px-3 py-1.5 rounded-lg transition shadow-xs"
                        >
                          <Edit size={12} />
                          <span>Edit</span>
                        </button>
                      ) : (
                        <>
                          <Link
                            href={`/signin?redirect=/write?edit=${post.slug}`}
                            className="inline-flex items-center gap-1 text-xs font-mono font-medium text-[#86868b] hover:text-[#1d1d1f] bg-[#f5f5f7] hover:bg-[#e5e5ea] border border-[#e5e5ea] px-2.5 py-1.5 rounded-lg transition"
                            title="Sign in as Alazar to edit this masterclass"
                          >
                            <Lock size={11} className="text-amber-600" />
                            <span>Locked</span>
                          </Link>
                          <button
                            type="button"
                            onClick={() => startEditing(post)}
                            className="inline-flex items-center gap-1 text-xs font-mono text-[#515154] hover:text-[#1d1d1f] hover:bg-[#f5f5f7] border border-[#e5e5ea] px-2.5 py-1.5 rounded-lg transition"
                            title="Inspect schematic in read-only mode"
                          >
                            <Eye size={12} />
                            <span>Inspect</span>
                          </button>
                        </>
                      )}

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
                <button
                  type="button"
                  disabled={!isAuthor}
                  onClick={() => handleRevertCustom(editingPost.slug)}
                  className={`px-3.5 py-1.5 rounded-xl border border-[#e5e5ea] font-mono text-xs transition shadow-xs ${
                    isAuthor
                      ? 'bg-white hover:bg-[#f5f5f7] text-[#86868b] hover:text-[#1d1d1f]'
                      : 'bg-[#f5f5f7] text-[#86868b] opacity-40 cursor-not-allowed'
                  }`}
                  title="Revert custom changes to default baseline"
                >
                  Revert to Default
                </button>
                <button
                  type="button"
                  onClick={() => handleExportPost(editingPost)}
                  className="px-3.5 py-1.5 rounded-xl border border-[#e5e5ea] bg-white hover:bg-[#f5f5f7] text-[#1d1d1f] font-mono text-xs transition flex items-center gap-1 shadow-xs"
                >
                  <Download size={13} />
                  <span>Export JSON</span>
                </button>
                {isAuthor ? (
                  <button
                    type="button"
                    onClick={handleSavePost}
                    className="px-4 py-1.5 rounded-xl bg-[#0071e3] hover:bg-[#0077ed] text-white font-medium font-mono text-xs transition flex items-center gap-1.5 shadow-xs"
                  >
                    <Save size={13} />
                    <span>Save &amp; Update Live Article</span>
                  </button>
                ) : (
                  <Link
                    href={`/signin?redirect=/write?edit=${editingPost.slug}`}
                    className="px-4 py-1.5 rounded-xl bg-[#1d1d1f] hover:bg-black text-white font-medium font-mono text-xs transition flex items-center gap-1.5 shadow-xs"
                    title="Sign in as Alazar to save edits"
                  >
                    <Lock size={13} />
                    <span>Sign in as Alazar to Save</span>
                  </Link>
                )}
              </div>
            </div>

            {/* Read-Only Notice Banner in Editor if not logged in as Alazar */}
            {!isAuthor && (
              <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-xs font-mono text-amber-900 shadow-2xs">
                <div className="flex items-center gap-3">
                  <span className="p-1.5 rounded-lg bg-amber-100 text-amber-800 shrink-0">
                    <Lock size={15} />
                  </span>
                  <div>
                    <strong>READ-ONLY INSPECTION MODE:</strong> This masterclass is authored by Alazar Wake Kore. Saving edits or publishing modifications requires author authentication.
                  </div>
                </div>
                <Link
                  href={`/signin?redirect=/write?edit=${editingPost.slug}`}
                  className="px-4 py-1.5 rounded-full bg-[#1d1d1f] hover:bg-black text-white font-sans font-semibold text-xs shrink-0 transition"
                >
                  Sign In to Enable Editing
                </Link>
              </div>
            )}

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
                  {renderSectionsToReact(editingPost.sections)}
                </div>
              </div>
            ) : editorMode === 'json' ? (
              /* RAW JSON EDITING MODE */
              <div className="space-y-3">
                <div className="text-xs font-mono text-[#86868b] flex justify-between">
                  <span>Structured Article Schema (JSON):</span>
                  <span>Press Save above to commit updates</span>
                </div>
                <textarea
                  value={editorRawJson}
                  readOnly={!isAuthor}
                  onChange={(e) => setEditorRawJson(e.target.value)}
                  className={`w-full h-[600px] font-mono text-xs p-4 rounded-2xl bg-[#1d1d1f] border border-zinc-700 text-emerald-300 outline-none leading-relaxed shadow-inner ${
                    isAuthor ? 'focus:border-[#0071e3]' : 'opacity-90 cursor-default'
                  }`}
                />
              </div>
            ) : (
              /* STRUCTURED FORM MODE */
              <div className="space-y-6">
                {/* Metadata Fields Card */}
                <div className="p-6 rounded-2xl bg-white border border-[#e5e5ea] shadow-xs space-y-4">
                  <h3 className="text-xs font-mono uppercase tracking-widest text-[#86868b] font-bold">
                    Publication Metadata {!isAuthor && '(Locked: Read-Only)'}
                  </h3>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-mono text-[#86868b] mb-1">Title</label>
                      <input
                        type="text"
                        value={editingPost.title}
                        readOnly={!isAuthor}
                        onChange={(e) => setEditingPost({ ...editingPost, title: e.target.value })}
                        className={`w-full px-3.5 py-2.5 rounded-xl bg-[#f5f5f7] border border-[#e5e5ea] text-[#1d1d1f] font-medium text-sm outline-none ${
                          isAuthor ? 'focus:border-[#0071e3] focus:bg-white' : 'cursor-default'
                        }`}
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-mono text-[#86868b] mb-1">Slug (URL Path)</label>
                      <input
                        type="text"
                        value={editingPost.slug}
                        readOnly={!isAuthor}
                        onChange={(e) => setEditingPost({ ...editingPost, slug: e.target.value })}
                        className={`w-full px-3.5 py-2.5 rounded-xl bg-[#f5f5f7] border border-[#e5e5ea] text-[#0071e3] font-mono text-sm outline-none ${
                          isAuthor ? 'focus:border-[#0071e3] focus:bg-white' : 'cursor-default'
                        }`}
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-mono text-[#86868b] mb-1">Author</label>
                      <input
                        type="text"
                        value={editingPost.author}
                        readOnly={!isAuthor}
                        onChange={(e) => setEditingPost({ ...editingPost, author: e.target.value })}
                        className={`w-full px-3.5 py-2.5 rounded-xl bg-[#f5f5f7] border border-[#e5e5ea] text-[#1d1d1f] font-mono text-sm outline-none ${
                          isAuthor ? 'focus:border-[#0071e3] focus:bg-white' : 'cursor-default'
                        }`}
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-mono text-[#86868b] mb-1">Category / Tag</label>
                      <input
                        type="text"
                        value={editingPost.tag}
                        readOnly={!isAuthor}
                        onChange={(e) => setEditingPost({ ...editingPost, tag: e.target.value })}
                        className={`w-full px-3.5 py-2.5 rounded-xl bg-[#f5f5f7] border border-[#e5e5ea] text-[#1d1d1f] text-sm outline-none ${
                          isAuthor ? 'focus:border-[#0071e3] focus:bg-white' : 'cursor-default'
                        }`}
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-mono text-[#86868b] mb-1">Excerpt / Summary</label>
                    <textarea
                      rows={3}
                      value={editingPost.excerpt}
                      readOnly={!isAuthor}
                      onChange={(e) => setEditingPost({ ...editingPost, excerpt: e.target.value })}
                      className={`w-full px-3.5 py-2.5 rounded-xl bg-[#f5f5f7] border border-[#e5e5ea] text-[#424245] text-xs sm:text-sm outline-none leading-relaxed ${
                        isAuthor ? 'focus:border-[#0071e3] focus:bg-white' : 'cursor-default'
                      }`}
                    />
                  </div>
                </div>

                {/* Sections Editor */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xs font-mono uppercase tracking-widest text-[#86868b] font-bold">
                      Article Sections &amp; Markdown Prose ({editingPost.sections.length})
                    </h3>
                    {isAuthor && (
                      <button
                        type="button"
                        onClick={addMarkdownSection}
                        className="inline-flex items-center gap-1 text-xs font-mono text-[#0071e3] hover:underline"
                      >
                        <PlusCircle size={14} />
                        <span>Add Text Section</span>
                      </button>
                    )}
                  </div>

                  {editingPost.sections.map((section, idx) => (
                    <div
                      key={idx}
                      className="p-5 rounded-2xl bg-white border border-[#e5e5ea] shadow-xs space-y-2.5"
                    >
                      <div className="flex items-center justify-between text-xs font-mono text-[#86868b]">
                        <span className="font-bold text-[#1d1d1f]">
                          SECTION {idx + 1} // TYPE: {section.type.toUpperCase()}
                        </span>
                        {isAuthor && section.type === 'markdown' && (
                          <button
                            type="button"
                            onClick={() => removeSection(idx)}
                            className="text-red-500 hover:text-red-700 p-1"
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
                          readOnly={!isAuthor}
                          onChange={(e) => updateSectionContent(idx, e.target.value)}
                          className={`w-full px-3.5 py-2.5 rounded-xl bg-[#f5f5f7] border border-[#e5e5ea] text-[#1d1d1f] font-mono text-xs outline-none leading-relaxed ${
                            isAuthor ? 'focus:border-[#0071e3] focus:bg-white' : 'cursor-default'
                          }`}
                        />
                      ) : section.type === 'callout' ? (
                        <div className="p-3.5 bg-amber-50/80 rounded-xl text-xs space-y-1 border border-amber-200">
                          <strong className="text-amber-800 block font-mono">{section.title}</strong>
                          <p className="text-amber-900">{section.text}</p>
                        </div>
                      ) : section.type === 'lab' ? (
                        <div className="p-3.5 bg-[#f5f5f7] rounded-xl text-xs space-y-2 border border-[#e5e5ea]">
                          <div className="flex items-center justify-between font-mono text-emerald-700">
                            <strong>⚡ InlineLab: {section.title}</strong>
                            <span>{section.step}</span>
                          </div>
                          <pre className="text-[10px] text-emerald-400 font-mono bg-[#1d1d1f] p-3 rounded-lg overflow-x-auto max-h-32">
                            {section.dsl}
                          </pre>
                        </div>
                      ) : section.type === 'image' ? (
                        <div className="text-xs font-mono text-[#86868b]">
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
              <h3 className="font-bold text-[#1d1d1f] text-base">Drop Masterclass File Here</h3>
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
                  {isAuthor ? (
                    <button
                      type="button"
                      onClick={handlePublishUploaded}
                      className="px-4 py-2 rounded-xl bg-[#0071e3] hover:bg-[#0077ed] text-white font-medium font-mono text-xs transition shadow-xs"
                    >
                      Publish to Platform
                    </button>
                  ) : (
                    <Link
                      href="/signin?redirect=/write"
                      className="px-4 py-2 rounded-xl bg-[#1d1d1f] hover:bg-black text-white font-medium font-mono text-xs transition shadow-xs flex items-center gap-1.5"
                    >
                      <Lock size={12} className="text-amber-400" />
                      <span>Sign in as Alazar to Publish</span>
                    </Link>
                  )}
                </div>
                <p className="text-xs text-[#424245]">{parsedPost.excerpt}</p>
                <div className="text-[11px] font-mono text-[#86868b]">
                  Sections: {parsedPost.sections.length} · Tag: {parsedPost.tag} · Author: Alazar Wake Kore
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
          Loading Authoring Studio...
        </div>
      }
    >
      <WriteContent />
    </Suspense>
  );
}
