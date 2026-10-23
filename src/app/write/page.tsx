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
  Cpu,
  ArrowUp,
  ArrowDown,
  Play,
  FolderOpen,
  Check,
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
  canEditPost,
  type ExternalBlogPost,
  type ExternalSection,
} from '@/lib/blogStorage';
import { checkSessionWithNeon, getCurrentUser, type User as AuthUser } from '@/lib/auth';
import { AUTHOR_NAME, AUTHOR_LINKEDIN } from '@/lib/mockPosts';
import { DEFAULT_MASTERCLASSES } from '@/lib/defaultArticlesData';
import InlineLab from '@/components/lab/InlineLab';
import { stringifyCircuitDSL, parseCircuitDSL } from '@/lib/automation/dsl';
import { BLOCK_CATALOG } from '@/lib/automation/catalog';
import { getExample, EXAMPLES } from '@/lib/automation/examples';
import { STORAGE_KEY as LAB_STORAGE_KEY } from '@/lib/automation/documents';

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
  const [isAuthChecking, setIsAuthChecking] = useState(true);
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
    author: '',
    date: 'Oct 15',
    readingTime: '15 min read + 20 min labs',
    tag: 'Process Control',
    views: 1,
    sections: [
      {
        type: 'markdown',
        content: '## Overview\n\nWrite your technical introduction here.',
      },
    ],
  });

  // Determines whether the current user can edit the post currently in the editor
  const isPostEditable = useMemo(() => {
    if (!currentUser) return false;
    if (editingPost.slug && CORE_MASTERCLASS_SLUGS.has(editingPost.slug)) {
      return isAuthor;
    }
    return true;
  }, [currentUser, editingPost.slug, isAuthor]);

  // Tracks which lab sections have their live interactive simulation preview toggled on
  const [previewingLabs, setPreviewingLabs] = useState<Record<number, boolean>>({});

  const [editorRawJson, setEditorRawJson] = useState<string>('');
  const [editorMode, setEditorMode] = useState<'fields' | 'json'>('fields');
  const [isPreviewMode, setIsPreviewMode] = useState(false);

  // Upload Tab State
  const [rawText, setRawText] = useState('');
  const [parsedPost, setParsedPost] = useState<ExternalBlogPost | null>(null);
  const [validationError, setValidationError] = useState<string | null>(null);

  const refreshPublications = (userToUse = currentUser) => {
    if (!userToUse) return;
    const updated = getEditablePosts(userToUse);
    setPublications(updated);

    fetch('/api/articles?scope=my')
      .then((res) => res.json())
      .then((data) => {
        if (data.ok && Array.isArray(data.articles)) {
          const isLead = isAuthorUser(userToUse);
          if (isLead) {
            const cloudSlugs = new Set(data.articles.map((a: ExternalBlogPost) => a.slug));
            const defaults = DEFAULT_MASTERCLASSES.filter((p) => !cloudSlugs.has(p.slug));
            setPublications([...data.articles, ...defaults]);
          } else {
            // For community authors: ONLY their articles! Alazar's articles are never mixed in.
            setPublications(data.articles);
          }
        }
      })
      .catch(() => {});
  };

  // Load initial publications and auth
  useEffect(() => {
    // 1. Initial cached user state
    const local = getCurrentUser();
    if (local) {
      setCurrentUser(local);
      const posts = getEditablePosts(local);
      setPublications(posts);
    }

    // 2. Validate live server session against Neon PostgreSQL
    checkSessionWithNeon()
      .then((serverUser) => {
        const active = serverUser || local;
        if (active) {
          setCurrentUser(active);
          refreshPublications(active);

          // If navigated with ?edit=slug, open that post directly
          if (editSlugParam) {
            // Guard: non-authors cannot edit core masterclasses
            if (CORE_MASTERCLASS_SLUGS.has(editSlugParam) && !isAuthorUser(active)) {
              alert('Access Restricted: Core masterclasses are reserved and can only be edited by Alazar Wake Kore.');
              router.replace('/write');
              return;
            }
            const match = getEditablePost(editSlugParam, active);
            if (match) {
              startEditing(match);
            }
          }
        } else {
          setCurrentUser(null);
          setPublications([]);
        }
      })
      .finally(() => {
        setIsAuthChecking(false);
      });

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
  }, [editSlugParam]);

  const startEditing = (post: ExternalBlogPost) => {
    setEditingPost(JSON.parse(JSON.stringify(post)));
    setEditorRawJson(JSON.stringify(post, null, 2));
    setActiveTab('editor');
    setSaveSuccessNotice(null);
    setIsPreviewMode(false);
  };

  const startNewArticle = () => {
    const authorName = currentUser?.name || 'Engineer';
    let defaultDsl = '';
    try {
      defaultDsl = stringifyCircuitDSL(getExample('start-stop'));
    } catch {
      defaultDsl = `circuit "Stage 1: Permissive Interlock" version 1 {
  start: INPUT(label="Start Pushbutton", value=false)
  stop: INPUT(label="Stop Pushbutton", value=true)
  latch: RS_LATCH(label="Motor Run Latch")
  motor: OUTPUT(label="Motor Contactor M1")

  start.Q -> latch.S
  stop.Q -> latch.R
  latch.Q -> motor.A
}`;
    }

    const newDoc: ExternalBlogPost = {
      slug: 'schematic-' + Date.now().toString(36),
      title: 'New Industrial Masterclass',
      excerpt: 'A comprehensive technical overview of industrial automation logic and controls.',
      author: authorName,
      authorId: currentUser?.id,
      authorEmail: currentUser?.email,
      date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      readingTime: '15 min read + 20 min labs',
      tag: 'Process Control',
      views: 1,
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
        {
          type: 'lab',
          title: 'Stage 1: Motor Start / Stop Interlock',
          step: 'Stage 1 of 3',
          dsl: defaultDsl,
          height: 480,
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
    if (!isAuthor && CORE_MASTERCLASS_SLUGS.has(postToSave.slug)) {
      alert('Access Restricted: The 10 core masterclasses are protected and can only be modified by author Alazar Wake Kore.');
      return;
    }

    const finalizedPost: ExternalBlogPost = {
      ...postToSave,
      author: postToSave.author || currentUser?.name || 'Engineer',
      authorId: postToSave.authorId || currentUser?.id,
      authorEmail: postToSave.authorEmail || currentUser?.email,
      date: postToSave.date || new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      views: Number(postToSave.views) || 1,
    };

    const result = saveCustomPost(finalizedPost, currentUser);
    if (result && !result.ok) {
      alert(result.error || 'Failed to save post.');
      return;
    }

    setEditingPost(finalizedPost);
    setEditorRawJson(JSON.stringify(finalizedPost, null, 2));
    refreshPublications(currentUser);
    setSaveSuccessNotice(`"${finalizedPost.title}" saved successfully! Live changes are now active.`);
  };

  const handleDeleteCustom = (slug: string) => {
    if (CORE_MASTERCLASS_SLUGS.has(slug) && !isAuthor) {
      alert('Access Restricted: Core masterclasses cannot be deleted.');
      return;
    }
    if (confirm('Are you sure you want to delete this masterclass?')) {
      deleteCustomPost(slug, currentUser);
      refreshPublications(currentUser);
      setActiveTab('publications');
      setSaveSuccessNotice('Masterclass deleted successfully.');
    }
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
      deleteCustomPost(slug, currentUser);
      refreshPublications(currentUser);
      const fresh = getEditablePost(slug, currentUser);
      if (fresh) startEditing(fresh);
      setSaveSuccessNotice('Reverted article to original baseline.');
    }
  };

  // Section modifiers for fields mode
  const updateMarkdownSection = (index: number, content: string) => {
    const updated = [...editingPost.sections];
    if (updated[index].type === 'markdown') {
      updated[index] = { ...updated[index], content };
      setEditingPost({ ...editingPost, sections: updated });
    }
  };

  const updateCalloutSection = (
    index: number,
    patch: { title?: string; text?: string; variant?: 'info' | 'warning' | 'success' | 'error' }
  ) => {
    const updated = [...editingPost.sections];
    if (updated[index].type === 'callout') {
      updated[index] = { ...updated[index], ...patch };
      setEditingPost({ ...editingPost, sections: updated });
    }
  };

  const updateLabSection = (
    index: number,
    patch: { title?: string; step?: string; dsl?: string; height?: number }
  ) => {
    const updated = [...editingPost.sections];
    if (updated[index].type === 'lab') {
      updated[index] = { ...updated[index], ...patch };
      setEditingPost({ ...editingPost, sections: updated });
    }
  };

  const removeSection = (index: number) => {
    const updated = editingPost.sections.filter((_, i) => i !== index);
    setEditingPost({ ...editingPost, sections: updated });
  };

  const moveSection = (index: number, direction: 'up' | 'down') => {
    const target = direction === 'up' ? index - 1 : index + 1;
    if (target < 0 || target >= editingPost.sections.length) return;
    const updated = [...editingPost.sections];
    const temp = updated[index];
    updated[index] = updated[target];
    updated[target] = temp;
    setEditingPost({ ...editingPost, sections: updated });
  };

  const addMarkdownSection = () => {
    const updated: ExternalSection[] = [
      ...editingPost.sections,
      {
        type: 'markdown',
        content: '### New Section Heading\n\nExplain your operational control concepts, ladder rungs, or sensor topologies here.',
      },
    ];
    setEditingPost({ ...editingPost, sections: updated });
  };

  const addCalloutSection = () => {
    const updated: ExternalSection[] = [
      ...editingPost.sections,
      {
        type: 'callout',
        variant: 'warning',
        title: 'Safety Interlock Permissive',
        text: 'All emergency stop conditions and hardware relays must be verified before proceeding.',
      },
    ];
    setEditingPost({ ...editingPost, sections: updated });
  };

  const addLabSection = (presetId = 'start-stop') => {
    let dsl = '';
    let labTitle = 'Control Interlock';
    try {
      dsl = stringifyCircuitDSL(getExample(presetId));
      labTitle = getExample(presetId).name;
    } catch {
      dsl = `circuit "Stage 1: Permissive Interlock" version 1 {
  start: INPUT(label="Start Pushbutton", value=false)
  stop: INPUT(label="Stop Pushbutton", value=true)
  latch: RS_LATCH(label="Motor Run Latch")
  motor: OUTPUT(label="Motor Contactor M1")

  start.Q -> latch.S
  stop.Q -> latch.R
  latch.Q -> motor.A
}`;
    }

    const labCount = editingPost.sections.filter((s) => s.type === 'lab').length + 1;
    const updated: ExternalSection[] = [
      ...editingPost.sections,
      {
        type: 'lab',
        title: `Stage ${labCount}: ${labTitle}`,
        step: `Stage ${labCount} of ${Math.max(3, labCount)}`,
        dsl,
        height: 480,
      },
    ];
    setEditingPost({ ...editingPost, sections: updated });
  };

  const importActiveCircuitFromLab = (index: number) => {
    if (typeof window === 'undefined') return;
    try {
      const raw = localStorage.getItem(LAB_STORAGE_KEY);
      if (!raw) {
        alert('No active circuit found in your Visual Lab workspace. Open /lab to design or wire a circuit, then return here to import it!');
        return;
      }
      const doc = JSON.parse(raw);
      const dsl = stringifyCircuitDSL(doc);
      updateLabSection(index, { dsl, title: doc.name || 'Imported Lab Circuit' });
      alert(`Successfully imported "${doc.name || 'Visual Circuit'}" from your Logic Lab workspace!`);
    } catch (err) {
      alert('Failed to parse circuit from Logic Lab: ' + (err as Error).message);
    }
  };

  const handleCircuitFileUpload = (index: number, file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const content = (e.target?.result as string) || '';
        const doc = JSON.parse(content);
        const dsl = stringifyCircuitDSL(doc);
        updateLabSection(index, { dsl, title: doc.name || 'Uploaded Circuit' });
        alert(`Loaded "${doc.name || file.name}" into this lab!`);
      } catch (err) {
        alert('Invalid circuit JSON file: ' + (err as Error).message);
      }
    };
    reader.readAsText(file);
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
    if (!isAuthor && CORE_MASTERCLASS_SLUGS.has(parsedPost.slug)) {
      alert('Access Restricted: Core masterclasses can only be modified by author Alazar Wake Kore.');
      return;
    }
    const postWithAuthor: ExternalBlogPost = {
      ...parsedPost,
      author: parsedPost.author || currentUser?.name || 'Engineer',
      authorId: currentUser?.id,
      authorEmail: currentUser?.email,
      views: parsedPost.views && parsedPost.views <= 20 ? parsedPost.views : 1,
    };
    const result = saveCustomPost(postWithAuthor, currentUser);
    if (result && !result.ok) {
      alert(result.error || 'Failed to publish post.');
      return;
    }
    refreshPublications(currentUser);
    startEditing(postWithAuthor);
    setSaveSuccessNotice(`Imported and published "${postWithAuthor.title}" successfully.`);
  };

  if (isAuthChecking) {
    return (
      <div className="min-h-screen bg-[#fbfbfd] flex flex-col items-center justify-center text-[#1d1d1f] font-sans px-4">
        <div className="w-8 h-8 rounded-full border-2 border-[#e5e5ea] border-t-[#0071e3] animate-spin mb-4" />
        <p className="text-xs font-mono text-[#86868b] tracking-wider uppercase">
          Verifying author security credentials...
        </p>
      </div>
    );
  }

  // Security interlock: Must be authenticated to access Author Studio
  if (!currentUser) {
    const redirectUrl = editSlugParam ? `/write?edit=${encodeURIComponent(editSlugParam)}` : '/write';
    return (
      <main className="min-h-[calc(100vh-64px)] bg-[#fbfbfd] flex flex-col justify-center items-center px-4 py-16 font-sans antialiased selection:bg-[#0071e3]/15 selection:text-[#0071e3]">
        <div className="max-w-md w-full bg-white border border-[#e5e5ea] rounded-3xl p-8 sm:p-10 shadow-sm text-center">
          <div className="w-16 h-16 rounded-2xl bg-[#f5f5f7] border border-[#e5e5ea] flex items-center justify-center mx-auto mb-6 text-[#1d1d1f] shadow-2xs">
            <Lock size={28} className="text-[#0071e3]" />
          </div>

          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#f5f5f7] border border-[#e5e5ea] text-[11px] font-mono text-[#86868b] uppercase tracking-wider mb-4">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            <span>Author Studio // Creator Hub</span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#1d1d1f] mb-3">
            Author Access Required
          </h1>

          <p className="text-sm text-[#515154] leading-relaxed mb-6">
            The Authoring Studio is available to all registered engineers. Sign in to your station account to compose, preview, and publish technical masterclasses with embedded circuit simulations.
          </p>

          <div className="space-y-3">
            <Link
              href={`/signin?redirect=${encodeURIComponent(redirectUrl)}`}
              className="w-full py-3 px-5 rounded-full bg-[#0071e3] hover:bg-[#0077ed] text-white font-medium text-sm flex items-center justify-center gap-2 shadow-xs hover:shadow-md transition-all"
            >
              <LogIn size={15} />
              <span>Sign In to Station</span>
            </Link>

            <Link
              href={`/signup?redirect=${encodeURIComponent(redirectUrl)}`}
              className="w-full py-3 px-5 rounded-full bg-white hover:bg-[#f5f5f7] border border-[#e5e5ea] text-[#1d1d1f] font-medium text-sm flex items-center justify-center gap-2 transition"
            >
              <span>Create Station Account</span>
            </Link>
          </div>
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
              <span>AUTHOR STATION // {currentUser?.name || 'ALAZAR WAKE KORE'}</span>
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
              <span>New Masterclass</span>
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
                  {isAuthor ? 'Lead Author Publications & Works' : `${currentUser.name}’s Masterclasses`}
                </h2>
                <p className="text-xs sm:text-sm text-[#86868b] mt-1">
                  {isAuthor ? (
                    <>
                      Manage, modify, and proof-test core masterclasses authored by{' '}
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
                    </>
                  ) : (
                    'Manage, edit, and proof-test your technical masterclasses. Changes sync to the cloud and execute live circuits in the browser.'
                  )}
                </p>
              </div>
              <div className="text-xs font-mono text-[#1d1d1f] bg-white border border-[#e5e5ea] px-3.5 py-2 rounded-xl shadow-xs">
                <span className="text-[#0071e3] font-bold">{publications.length}</span>{' '}
                {publications.length === 1 ? 'PUBLISHED ARTICLE' : 'PUBLISHED ARTICLES'}
              </div>
            </div>

            {publications.length === 0 ? (
              <div className="bg-white border border-dashed border-[#d2d2d7] rounded-3xl p-10 sm:p-14 text-center">
                <div className="w-14 h-14 rounded-2xl bg-[#f5f5f7] border border-[#e5e5ea] flex items-center justify-center mx-auto mb-4 text-[#0071e3]">
                  <BookOpen size={24} />
                </div>
                <h3 className="text-lg font-bold text-[#1d1d1f] mb-2">No Published Masterclasses Yet</h3>
                <p className="text-xs sm:text-sm text-[#86868b] max-w-md mx-auto mb-6 leading-relaxed">
                  You haven&apos;t composed any masterclasses yet. Start your first engineering guide with interactive circuit simulations, custom ladder/FBD logic, and real-time verification.
                </p>
                <button
                  type="button"
                  onClick={startNewArticle}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-[#0071e3] hover:bg-[#0077ed] text-white text-xs font-medium shadow-xs transition"
                >
                  <PlusCircle size={15} />
                  <span>Start Your First Masterclass</span>
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
                          <span>📅 {post.date}</span>
                          <span className="text-emerald-700 font-semibold">⚡ {post.views || 1} reads</span>
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

                        {!CORE_MASTERCLASS_SLUGS.has(post.slug) && (
                          <button
                            type="button"
                            onClick={() => handleDeleteCustom(post.slug)}
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
                    onClick={() => handleRevertCustom(editingPost.slug)}
                    className="px-3.5 py-1.5 rounded-xl border border-[#e5e5ea] bg-white hover:bg-[#f5f5f7] text-[#86868b] hover:text-[#1d1d1f] font-mono text-xs transition shadow-xs"
                    title="Revert custom changes to default baseline"
                  >
                    Revert to Default
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
                  onClick={handleSavePost}
                  className="px-4 py-1.5 rounded-xl bg-[#0071e3] hover:bg-[#0077ed] text-white font-medium font-mono text-xs transition flex items-center gap-1.5 shadow-xs"
                >
                  <Save size={13} />
                  <span>Save &amp; Update Live Article</span>
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
                  {renderSectionsToReact(editingPost.sections)}
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
                    Publication Metadata {!isPostEditable && '(Locked: Core Masterclass authored by Alazar Wake Kore)'}
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
                      <label className="block text-xs font-mono text-[#86868b] mb-1">Author Name / Credentials</label>
                      <input
                        type="text"
                        value={editingPost.author}
                        readOnly={!isPostEditable}
                        onChange={(e) => setEditingPost({ ...editingPost, author: e.target.value })}
                        className={`w-full px-3.5 py-2.5 rounded-xl bg-[#f5f5f7] border border-[#e5e5ea] text-[#1d1d1f] font-mono text-sm outline-none transition ${
                          isPostEditable ? 'focus:border-[#0071e3] focus:bg-white' : 'cursor-default opacity-85'
                        }`}
                        placeholder="Your Name and Engineering Specialization"
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
                                onChange={(e) => updateCalloutSection(idx, { variant: e.target.value as any })}
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
