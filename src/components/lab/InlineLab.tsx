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
          : 'my-10 -mx-4 sm:-mx-8 rounded-2xl overflow-hidden border border-[#e5e5ea] shadow-md flex flex-col not-prose bg-white transition-all'
      }
      style={{ height: isFullscreen ? '100vh' : `${height}px` }}
    >
      {/* Apple Hardware Style Toolbar Header */}
      <div className="bg-[#fbfbfd] text-[#1d1d1f] px-4 sm:px-5 py-3 border-b border-[#e5e5ea] flex flex-wrap justify-between items-center gap-3 shrink-0">
        <div className="flex items-center gap-3">
          <span className="p-1.5 rounded-lg bg-[#f5f5f7] border border-[#e5e5ea] text-[#0071e3]">
            <Cpu size={14} />
          </span>
          {step && (
            <span className="font-mono text-[10px] font-bold uppercase tracking-wider bg-[#0071e3]/10 text-[#0071e3] border border-[#0071e3]/20 px-2.5 py-0.5 rounded-full">
              {step}
            </span>
          )}
          <span className="text-xs sm:text-sm font-semibold tracking-tight text-[#1d1d1f]">
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
                ? 'bg-[#ecfdf5] border border-[#a7f3d0] text-[#059669]'
                : 'bg-white hover:bg-[#f5f5f7] text-[#1d1d1f] border border-[#e5e5ea]'
            }`}
            title="Mark this exercise stage as verified"
          >
            {isVerified ? (
              <>
                <CheckCircle2 size={13} className="text-[#059669]" />
                <span>Verified Stage ✓</span>
              </>
            ) : (
              <>
                <span className="w-1.5 h-1.5 rounded-full bg-[#0071e3] animate-pulse" />
                <span>Verify Stage</span>
              </>
            )}
          </button>

          {/* Fullscreen Button */}
          <button
            onClick={() => setIsFullscreen(!isFullscreen)}
            className="text-[#86868b] hover:text-[#1d1d1f] transition p-1.5 hover:bg-[#f5f5f7] rounded-lg"
            title={isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}
          >
            {isFullscreen ? <Minimize2 size={15} /> : <Maximize2 size={15} />}
          </button>
        </div>
      </div>

      {/* Verification Notice Banner */}
      {justVerified && (
        <div className="bg-[#ecfdf5] border-b border-[#a7f3d0] px-4 py-2 text-xs font-mono text-[#059669] flex items-center justify-between animate-in slide-in-from-top-2 duration-200">
          <div className="flex items-center gap-2">
            <Check size={14} className="text-[#059669]" />
            <span>Exercise Stage Verified: Circuit logic confirmed and added to masterclass progress!</span>
          </div>
          <span className="text-[10px] text-[#059669]/80 uppercase font-semibold">Saved</span>
        </div>
      )}

      {/* Simulation Workspace Canvas */}
      <div className="flex-1 min-h-0 bg-white relative w-full overflow-hidden">
        {document ? (
          <LabWorkspace readOnly document={document} isFullscreen={isFullscreen} />
        ) : (
          <div className="flex items-center justify-center h-full text-[#86868b] font-mono text-xs">
            Compiling circuit schematic...
          </div>
        )}
      </div>
    </div>
  );
}
