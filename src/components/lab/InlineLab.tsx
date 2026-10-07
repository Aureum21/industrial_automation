'use client';

import React, { useMemo, useState } from 'react';
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

export default function InlineLab({ dsl, title, step, height = 480 }: InlineLabProps) {
  const [isFullscreen, setIsFullscreen] = useState(false);

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
          ? 'fixed inset-0 z-[100] flex flex-col bg-white'
          : 'my-10 -mx-4 sm:-mx-8 rounded-xl overflow-hidden border border-zinc-300 shadow-xl flex flex-col not-prose bg-zinc-950'
      }
      style={{ height: isFullscreen ? '100vh' : `${height}px` }}
    >
      <div className="bg-zinc-900 text-white px-4 py-2.5 border-b border-zinc-800 flex justify-between items-center shrink-0">
        <div className="flex items-center gap-2.5">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
          {step && (
            <span className="font-mono text-[10px] font-bold uppercase bg-emerald-950/80 text-emerald-400 border border-emerald-500/30 px-2 py-0.5 rounded">
              {step}
            </span>
          )}
          <span className="text-xs font-mono font-bold tracking-wider uppercase text-zinc-100">
            {title}
          </span>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-[11px] font-mono text-zinc-400 hidden sm:inline">
            [ INTERACTIVE SIMULATION · LIVE FBD ]
          </span>
          <button
            onClick={() => setIsFullscreen(!isFullscreen)}
            className="text-zinc-400 hover:text-white transition p-1 hover:bg-zinc-800 rounded"
            title={isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}
          >
            {isFullscreen ? (
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 8h12v12H8z M4 16V4h12" />
              </svg>
            ) : (
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4h16v16H4z" />
              </svg>
            )}
          </button>
        </div>
      </div>
      <div className="flex-grow bg-[#0b1118] relative w-full h-full overflow-hidden">
        {document ? (
          <LabWorkspace readOnly document={document} />
        ) : (
          <div className="flex items-center justify-center h-full text-zinc-500 font-mono text-sm">
            Circuit model compiling...
          </div>
        )}
      </div>
    </div>
  );
}
