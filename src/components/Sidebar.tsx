'use client';
import { useState } from 'react';
import Link from 'next/link';
import { BLOCK_DEFINITIONS, CATEGORIES } from '@/lib/automation/catalog';
import type { BlockType } from '@/lib/automation/types';
import { Search } from 'lucide-react';

export default function Sidebar({ onAdd }: { onAdd: (type: BlockType) => void }) {
  const [query, setQuery] = useState('');
  const [showPlanned, setShowPlanned] = useState(false);
  const filtered = BLOCK_DEFINITIONS.filter(block => (showPlanned || block.status === 'ready') && `${block.name} ${block.type} ${block.description}`.toLowerCase().includes(query.toLowerCase()));

  return (
    <aside className="lab-sidebar flex w-64 shrink-0 flex-col border-r border-[#e5e5ea] bg-[#fbfbfd] text-[#1d1d1f]">
      <div className="border-b border-[#e5e5ea] p-4 bg-white">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold text-[#1d1d1f] tracking-tight">Components</h2>
          <span className="font-mono text-[10px] px-2 py-0.5 rounded-full bg-[#f5f5f7] border border-[#e5e5ea] text-[#86868b]">
            {BLOCK_DEFINITIONS.filter(b => b.status === 'ready').length} live
          </span>
        </div>
        <p className="mt-1 text-[11px] text-[#86868b] leading-tight">Click to add, or drag onto canvas.</p>
        <div className="relative mt-2.5">
          <input
            type="search"
            aria-label="Search components"
            placeholder="Search blocks…"
            value={query}
            onChange={event => setQuery(event.target.value)}
            className="w-full rounded-xl border border-[#e5e5ea] bg-[#f5f5f7] px-3 py-1.5 text-xs text-[#1d1d1f] placeholder-[#86868b] outline-none focus:border-[#0071e3] focus:bg-white transition-all"
          />
        </div>
        <label className="mt-2.5 flex items-center gap-2 text-[11px] text-[#86868b] cursor-pointer">
          <input
            type="checkbox"
            checked={showPlanned}
            onChange={event => setShowPlanned(event.target.checked)}
            className="rounded border-[#e5e5ea] text-[#0071e3] focus:ring-[#0071e3]"
          />
          Show future roadmap blocks
        </label>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto px-3 py-2 space-y-2">
        {CATEGORIES.map(category => {
          const blocks = filtered.filter(block => block.category === category);
          return blocks.length ? (
            <details key={category} open className="group">
              <summary className="cursor-pointer py-1.5 text-[10px] font-mono font-semibold uppercase tracking-wider text-[#86868b] flex items-center justify-between select-none">
                <span>{category}</span>
                <span className="font-mono text-[9px] px-1.5 py-0.2 rounded-full bg-[#f5f5f7] text-[#86868b]">
                  {blocks.length}
                </span>
              </summary>
              <div className="space-y-1 mt-1">
                {blocks.map(block => (
                  <button
                    key={block.type}
                    disabled={block.status !== 'ready'}
                    draggable={block.status === 'ready'}
                    onDragStart={event => {
                      event.dataTransfer.setData('application/fieldnotes-block', block.type);
                      event.dataTransfer.effectAllowed = 'copy';
                    }}
                    onClick={() => onAdd(block.type)}
                    title={block.description}
                    className="flex w-full items-center gap-2.5 rounded-xl border border-[#e5e5ea] bg-white p-2 text-left transition hover:border-[#0071e3]/40 hover:bg-[#f5f5f7] disabled:cursor-default disabled:opacity-40 shadow-2xs"
                  >
                    <span className={`flex h-6 min-w-7 items-center justify-center rounded-md border font-mono text-[9px] font-bold ${
                      block.outputs[0]?.kind === 'analog'
                        ? 'border-cyan-200 bg-cyan-50 text-cyan-800'
                        : 'border-[#e5e5ea] bg-[#f5f5f7] text-[#1d1d1f]'
                    }`}>
                      {block.shortName}
                    </span>
                    <span className="flex-1 text-[11px] font-medium text-[#1d1d1f] truncate">
                      {block.name}
                    </span>
                    {block.status === 'planned' && (
                      <span className="text-[9px] font-mono text-[#86868b]">P{block.phase}</span>
                    )}
                  </button>
                ))}
              </div>
            </details>
          ) : null;
        })}
        {!filtered.length && <p className="py-6 text-xs text-[#86868b] text-center">No matching components.</p>}
      </div>

      <Link
        href="/library"
        className="border-t border-[#e5e5ea] bg-white px-4 py-3 text-xs font-mono font-medium text-[#0071e3] hover:bg-[#f5f5f7] transition flex items-center justify-between"
      >
        <span>Full Component Catalog</span>
        <span>↗</span>
      </Link>
    </aside>
  );
}
