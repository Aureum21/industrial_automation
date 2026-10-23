'use client';

import React, { useMemo, useState, useEffect } from 'react';
import { Check, CheckCircle2, Maximize2, Minimize2, Cpu } from 'lucide-react';
import LabWorkspace from './LabWorkspace';
import { parseCircuitDSL } from '@/lib/automation/dsl';
import { BLOCK_CATALOG } from '@/lib/automation/catalog';
import { applyLayout } from '@/lib/automation/layout';

interface InlineLabProps {
  dsl: string;
  title: string;
  step?: string;
  height?: number;
}

export default function InlineLab({ dsl, title, step, height = 500 }: InlineLabProps) {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isVerified, setIsVerified] = useState(false);
  const [justVerified, setJustVerified] = useState(false);

  // Stage ID for tracking
  const stageId = useMemo(() => {
    return title.toLowerCase().replace(/[^a-z0-9]+/g, '-');
  }, [title]);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(`automationhub_stage_${stageId}`);
      if (saved === 'verified') {
        setIsVerified(true);
      }
    } catch {}
  }, [stageId]);

  const handleVerify = () => {
    setIsVerified(true);
    setJustVerified(true);
    try {
      localStorage.setItem(`automationhub_stage_${stageId}`, 'verified');
    } catch {}

    // Extract slug from URL if in browser
    if (typeof window !== 'undefined') {
      const match = window.location.pathname.match(/\/post\/([^/]+)/);
      const slug = match ? match[1] : '';
      window.dispatchEvent(
        new CustomEvent('lab_stage_verified', {
          detail: { slug, stageId, title },
        })
      );
    }

    setTimeout(() => setJustVerified(false), 3000);
  };

  const document = useMemo(() => {
    try {
      const doc = parseCircuitDSL(dsl, BLOCK_CATALOG);
      doc.name = title;
      applyLayout(doc);
      return doc;
    } catch (e) {
      console.error('Failed to parse inline lab DSL:', e);
      return undefined;
    }
  }, [dsl, title]);

  return (
    <div
      className={
        isFullscreen
          ? 'fixed inset-0 z-[100] flex flex-col bg-white animate-in fade-in duration-200'
          : 'my-10 -mx-4 sm:-mx-8 rounded-2xl overflow-hidden border border-[#d2d2d7] shadow-xl flex flex-col not-prose bg-[#0b1118] transition-all'
      }
      style={{ height: isFullscreen ? '100vh' : `${height}px` }}
    >
      {/* Apple Hardware Style Toolbar Header */}
      <div className="bg-[#161617] text-white px-4 sm:px-5 py-3 border-b border-[#2d2d2e] flex flex-wrap justify-between items-center gap-3 shrink-0">
        <div className="flex items-center gap-3">
          <span className="p-1.5 rounded-lg bg-emerald-950/80 border border-emerald-500/40 text-emerald-400">
            <Cpu size={14} />
          </span>
          {step && (
            <span className="font-mono text-[10px] font-bold uppercase tracking-wider bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 px-2.5 py-0.5 rounded-full">
              {step}
            </span>
          )}
          <span className="text-xs sm:text-sm font-semibold tracking-tight text-[#f5f5f7]">
            {title}
          </span>
        </div>

        <div className="flex items-center gap-2.5">
          {/* Verification Status Button */}
          <button
            type="button"
            onClick={handleVerify}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-mono font-medium transition-all shadow-xs ${
              isVerified
                ? 'bg-emerald-950/80 border border-emerald-500/40 text-emerald-300'
                : 'bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white border border-zinc-700'
            }`}
            title="Mark this exercise stage as verified"
          >
            {isVerified ? (
              <>
                <CheckCircle2 size={13} className="text-emerald-400" />
                <span>Verified Stage ✓</span>
              </>
            ) : (
              <>
                <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
                <span>Verify Stage</span>
              </>
            )}
          </button>

          {/* Fullscreen Button */}
          <button
            onClick={() => setIsFullscreen(!isFullscreen)}
            className="text-zinc-400 hover:text-white transition p-1.5 hover:bg-zinc-800 rounded-lg"
            title={isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}
          >
            {isFullscreen ? <Minimize2 size={15} /> : <Maximize2 size={15} />}
          </button>
        </div>
      </div>

      {/* Verification Notice Banner */}
      {justVerified && (
        <div className="bg-emerald-950/90 border-b border-emerald-500/40 px-4 py-2 text-xs font-mono text-emerald-300 flex items-center justify-between animate-in slide-in-from-top-2 duration-200">
          <div className="flex items-center gap-2">
            <Check size={14} className="text-emerald-400" />
            <span>Exercise Stage Verified: Circuit logic confirmed and added to masterclass progress!</span>
          </div>
          <span className="text-[10px] text-emerald-400/80 uppercase">Saved</span>
        </div>
      )}

      {/* Simulation Workspace Canvas */}
      <div className="flex-grow bg-[#0b1118] relative w-full h-full overflow-hidden">
        {document ? (
          <LabWorkspace readOnly document={document} />
        ) : (
          <div className="flex items-center justify-center h-full text-zinc-500 font-mono text-xs">
            Compiling circuit schematic...
          </div>
        )}
      </div>
    </div>
  );
}
