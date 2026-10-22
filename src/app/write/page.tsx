'use client';

import React, { useState, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { UploadCloud, FileCode, CheckCircle, AlertTriangle, Eye, ArrowRight, Download, PlusCircle, Trash2 } from 'lucide-react';
import LabWorkspace from '@/components/lab/LabWorkspace';
import { parseUploadedFileContent, saveCustomPost, renderSectionsToReact, type ExternalBlogPost } from '@/lib/blogStorage';

type EditorBlock = {
  id: string;
  type: 'text' | 'simulation';
  content?: string;
};

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
    },
    {
      type: 'markdown',
      content: '### Stage 2: Closed-Loop Vessel Pressure Regulation\n\nOnce the vacuum is established, an analog vacuum transmitter controls the bypass bleed valve to hold chamber pressure stable:'
    },
    {
      type: 'lab',
      title: 'Stage 2: Pressure Regulation Loop',
      step: 'Stage 2 of 3',
      height: 480,
      dsl: `circuit "Stage 2: Pressure Loop" version 1 {
  sp: ANALOG_INPUT(label="Vacuum Target SP (mbar)", value=50)
  sensor: ANALOG_INPUT(label="Chamber Transmitter PV", value=62)
  pi: PI_CONTROLLER(kp=1.5, ki=0.2, min=0, max=100)
  bleed_valve: ANALOG_OUTPUT(label="Bleed Valve Position %")

  sp.Q -> pi.SP
  sensor.Q -> pi.PV
  pi.Q -> bleed_valve.A
}`
    },
    {
      type: 'markdown',
      content: '## Field Commissioning Lessons\n\n- Always install mechanical vacuum relief valves alongside electronic limit switches.\n- Never bypass cooling water delta-pressure transmitters during winter startup.'
    }
  ]
};

export default function WritePage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'upload' | 'manual'>('upload');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Upload Tab State
  const [rawText, setRawText] = useState('');
  const [parsedPost, setParsedPost] = useState<ExternalBlogPost | null>(null);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [isPreviewMode, setIsPreviewMode] = useState(false);
  const [isPublished, setIsPublished] = useState(false);

  // Manual Tab State
  const [manualTitle, setManualTitle] = useState('');
  const [fullscreenBlockId, setFullscreenBlockId] = useState<string | null>(null);
  const [manualBlocks, setManualBlocks] = useState<EditorBlock[]>([
    { id: '1', type: 'text', content: '' }
  ]);

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

  const handlePublish = () => {
    if (!parsedPost) return;
    const postWithAuthor: ExternalBlogPost = {
      ...parsedPost,
      author: 'ALAZAR',
      views: parsedPost.views && parsedPost.views <= 20 ? parsedPost.views : 14,
    };
    saveCustomPost(postWithAuthor);
    setIsPublished(true);
  };

  const handleDownloadSample = () => {
    const blob = new Blob([JSON.stringify(SAMPLE_TEMPLATE_JSON, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'automationhub_sample_article.json';
    a.click();
    URL.revokeObjectURL(url);
  };

  // Manual Editor Methods
  const addSimulationBlock = (index: number) => {
    const next = [...manualBlocks];
    next.splice(index + 1, 0, { id: crypto.randomUUID(), type: 'simulation' });
    next.splice(index + 2, 0, { id: crypto.randomUUID(), type: 'text', content: '' });
    setManualBlocks(next);
  };

  const removeManualBlock = (id: string) => {
    setManualBlocks(manualBlocks.filter(b => b.id !== id));
  };

  const updateManualText = (id: string, content: string) => {
    setManualBlocks(manualBlocks.map(b => b.id === id ? { ...b, content } : b));
  };

  return (
    <main className="bg-white min-h-screen text-gray-900 pb-32 font-sans">
      {/* Top Header / Mode Switcher */}
      <div className="border-b border-gray-200 bg-gray-50 py-4 px-6 sticky top-0 z-30 shadow-xs">
        <div className="max-w-5xl mx-auto flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="font-mono text-xs font-bold text-green-700 bg-green-100 px-2.5 py-1 rounded">
              AUTHORING STUDIO
            </span>
            <div className="flex bg-gray-200 p-0.5 rounded-lg border border-gray-300">
              <button
                onClick={() => setActiveTab('upload')}
                className={`px-4 py-1.5 text-xs font-semibold rounded-md transition ${
                  activeTab === 'upload' ? 'bg-white shadow text-gray-900' : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Upload Article File (JSON / MD)
              </button>
              <button
                onClick={() => setActiveTab('manual')}
                className={`px-4 py-1.5 text-xs font-semibold rounded-md transition ${
                  activeTab === 'manual' ? 'bg-white shadow text-gray-900' : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Canvas Editor
              </button>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Link
              href="/docs"
              target="_blank"
              className="text-xs font-mono text-gray-600 hover:text-black border border-gray-300 bg-white px-3 py-1.5 rounded transition"
            >
              📖 View Authoring Manual
            </Link>
            <button
              onClick={handleDownloadSample}
              className="text-xs font-mono text-gray-600 hover:text-black border border-gray-300 bg-white px-3 py-1.5 rounded transition flex items-center gap-1.5"
            >
              <Download size={14} /> Download Sample Template
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-5 sm:px-8 mt-10">
        {activeTab === 'upload' ? (
          <div>
            {/* Published Success Banner */}
            {isPublished && parsedPost && (
              <div className="mb-8 p-6 bg-emerald-50 border border-emerald-300 rounded-xl flex items-center justify-between shadow-sm">
                <div className="flex items-center gap-3">
                  <CheckCircle className="text-emerald-600" size={28} />
                  <div>
                    <h3 className="font-bold text-emerald-950 text-base">Article Published Successfully!</h3>
                    <p className="text-xs text-emerald-800">
                      Your article is now live in the elevator archive under B1 and accessible via URL.
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => router.push(`/post/${parsedPost.slug}`)}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs px-4 py-2.5 rounded-lg transition flex items-center gap-1.5 shadow"
                >
                  View Published Post <ArrowRight size={14} />
                </button>
              </div>
            )}

            {/* Drag & Drop Zone */}
            <div
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => {
                e.preventDefault();
                if (e.dataTransfer.files?.[0]) handleFileDrop(e.dataTransfer.files[0]);
              }}
              className="border-2 border-dashed border-gray-300 hover:border-green-600 rounded-2xl p-8 text-center bg-gray-50/60 hover:bg-green-50/20 transition-all cursor-pointer mb-6"
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
              <UploadCloud size={44} className="mx-auto text-gray-400 mb-3" />
              <h3 className="text-base font-semibold text-gray-800">
                Drag and drop your article file here, or <span className="text-green-600 underline">browse</span>
              </h3>
              <p className="text-xs text-gray-500 mt-1">
                Supports AutomationHub JSON (<code>.json</code>) or Markdown with <code>```fbd</code> code blocks (<code>.md</code>)
              </p>
            </div>

            {/* Raw Text Input Area */}
            <div className="mb-6">
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-mono font-bold uppercase text-gray-600 flex items-center gap-1.5">
                  <FileCode size={14} /> Paste or Edit Article Source
                </label>
                {validationError ? (
                  <span className="text-xs font-mono text-red-600 flex items-center gap-1">
                    <AlertTriangle size={14} /> Syntax Error
                  </span>
                ) : parsedPost ? (
                  <span className="text-xs font-mono text-emerald-600 flex items-center gap-1 font-semibold">
                    <CheckCircle size={14} /> Validated: {parsedPost.sections.filter(s => s.type === 'lab').length} FBD Labs Verified
                  </span>
                ) : null}
              </div>

              <textarea
                value={rawText}
                onChange={(e) => {
                  setRawText(e.target.value);
                  handleValidate(e.target.value);
                }}
                placeholder="Paste your JSON or Markdown with ```fbd blocks here, or upload a file above..."
                className="w-full h-64 p-4 font-mono text-xs text-gray-800 bg-gray-50 border border-gray-300 rounded-xl outline-none focus:ring-2 focus:ring-green-500 resize-y leading-relaxed"
                spellCheck={false}
              />

              {validationError && (
                <div className="mt-2 p-3 bg-red-50 border border-red-200 rounded-lg text-xs font-mono text-red-700">
                  {validationError}
                </div>
              )}
            </div>

            {/* Action Bar */}
            <div className="flex flex-wrap items-center justify-between gap-4 py-4 border-t border-gray-200">
              <div className="flex items-center gap-3">
                <button
                  disabled={!parsedPost}
                  onClick={() => setIsPreviewMode(!isPreviewMode)}
                  className={`px-4 py-2 rounded-lg text-xs font-semibold flex items-center gap-1.5 border transition ${
                    isPreviewMode
                      ? 'bg-zinc-800 text-white border-zinc-800'
                      : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50 disabled:opacity-50'
                  }`}
                >
                  <Eye size={14} /> {isPreviewMode ? 'Hide Live Preview' : 'Show Live Preview'}
                </button>
              </div>

              <div className="flex items-center gap-3">
                <button
                  disabled={!parsedPost}
                  onClick={handlePublish}
                  className="bg-green-600 hover:bg-green-700 disabled:bg-gray-300 text-white font-bold text-xs px-6 py-2.5 rounded-lg transition shadow-md hover:shadow-lg disabled:cursor-not-allowed flex items-center gap-2"
                >
                  Publish to Archive <ArrowRight size={14} />
                </button>
              </div>
            </div>

            {/* Live Preview Mode */}
            {isPreviewMode && parsedPost && (
              <div className="mt-10 p-8 border border-zinc-200 rounded-2xl bg-white shadow-xl">
                <div className="border-b border-gray-100 pb-6 mb-8">
                  <span className="font-mono text-xs text-green-600 uppercase font-bold tracking-wider">
                    [ LIVE ARTICLE PREVIEW ]
                  </span>
                  <h1 className="text-3xl sm:text-4xl font-serif font-extrabold text-zinc-950 mt-2 mb-4">
                    {parsedPost.title}
                  </h1>
                  <div className="flex items-center gap-3 text-xs text-gray-500 font-mono">
                    <span>{parsedPost.author}</span>
                    <span>·</span>
                    <span>{parsedPost.date}</span>
                    <span>·</span>
                    <span>{parsedPost.readingTime}</span>
                    <span className="bg-gray-100 text-gray-700 px-2 py-0.5 rounded font-bold">
                      {parsedPost.tag}
                    </span>
                  </div>
                </div>

                <div className="prose prose-lg prose-gray max-w-none font-serif leading-relaxed text-gray-800">
                  {renderSectionsToReact(parsedPost.sections)}
                </div>
              </div>
            )}
          </div>
        ) : (
          /* Manual Block Editor */
          <div className="relative">
            <input 
              type="text" 
              placeholder="Title" 
              value={manualTitle}
              onChange={(e) => setManualTitle(e.target.value)}
              className="w-full text-5xl font-serif font-bold outline-none placeholder:text-gray-300 mb-8 bg-transparent"
            />
            
            <div className="flex flex-col gap-8">
              {manualBlocks.map((block, index) => (
                <div key={block.id} className="relative group flex items-start gap-4">
                  <div className="relative pt-1 opacity-70 hover:opacity-100 transition-opacity">
                    <button 
                      onClick={() => addSimulationBlock(index)}
                      className="text-gray-400 hover:text-black transition-colors"
                      title="Insert simulation block"
                    >
                      <PlusCircle size={32} strokeWidth={1} />
                    </button>
                  </div>

                  <div className="flex-grow w-full min-w-0">
                    {block.type === 'text' ? (
                      <div className="relative group/text">
                        <textarea 
                          placeholder="Tell your story..." 
                          className="w-full text-xl font-serif text-gray-800 outline-none placeholder:text-gray-300 bg-transparent min-h-[100px] resize-none leading-relaxed pr-8"
                          value={block.content}
                          onChange={(e) => {
                            updateManualText(block.id, e.target.value);
                            e.target.style.height = 'auto';
                            e.target.style.height = e.target.scrollHeight + 'px';
                          }}
                        />
                        {manualBlocks.length > 1 && (
                          <button 
                            onClick={() => removeManualBlock(block.id)} 
                            className="absolute right-0 top-2 opacity-0 group-hover/text:opacity-100 text-gray-300 hover:text-red-500 transition-all"
                            title="Delete text block"
                          >
                            <Trash2 size={18} />
                          </button>
                        )}
                      </div>
                    ) : (
                      <div className={fullscreenBlockId === block.id 
                        ? "fixed inset-0 z-[100] flex flex-col bg-white" 
                        : "relative rounded-xl overflow-hidden border border-gray-200 shadow-xl h-[540px] flex flex-col w-full"
                      }>
                        <div className="bg-gray-50 px-4 py-2 border-b border-gray-200 flex justify-between items-center z-10 shrink-0">
                           <span className="text-xs font-bold text-gray-500 uppercase tracking-widest">Interactive Simulation</span>
                           <div className="flex items-center gap-3">
                             <button onClick={() => setFullscreenBlockId(fullscreenBlockId === block.id ? null : block.id)} className="text-gray-400 hover:text-gray-700 transition" title={fullscreenBlockId === block.id ? 'Minimize' : 'Maximize'}>
                               <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                 {fullscreenBlockId === block.id ? (
                                   <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 8h12v12H8z M4 16V4h12" />
                                 ) : (
                                   <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4h16v16H4z" />
                                 )}
                               </svg>
                             </button>
                             <button onClick={() => removeManualBlock(block.id)} className="text-red-500 hover:text-red-700 transition" title="Delete block">
                               <Trash2 size={16} />
                             </button>
                           </div>
                        </div>
                        <div className="flex-grow bg-[#0b1118] relative w-full h-full overflow-hidden">
                          <LabWorkspace />
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
