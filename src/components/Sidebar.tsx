'use client';
import { useState } from 'react';
import Link from 'next/link';
import { BLOCK_DEFINITIONS, CATEGORIES } from '@/lib/automation/catalog';
import type { BlockType } from '@/lib/automation/types';

export default function Sidebar({ onAdd }: { onAdd: (type: BlockType) => void }) {
  const [query, setQuery] = useState('');
  const [showPlanned, setShowPlanned] = useState(false);
  const filtered = BLOCK_DEFINITIONS.filter(block => !block.hidden && (showPlanned || block.status === 'ready') && `${block.name} ${block.type} ${block.description}`.toLowerCase().includes(query.toLowerCase()));
  return <aside className="lab-sidebar flex w-64 shrink-0 flex-col border-r border-gray-200 bg-white">
    <div className="border-b border-gray-200 p-4"><div className="flex items-center justify-between"><h2 className="text-sm font-semibold">Components</h2><span className="font-mono text-[10px] text-gray-500">{BLOCK_DEFINITIONS.filter(b => b.status === 'ready').length} live</span></div><p className="mt-1.5 text-[11px] leading-5 text-gray-500">Click to add, or drag onto the canvas.</p><input type="search" aria-label="Search components" placeholder="Search components…" value={query} onChange={event => setQuery(event.target.value)} className="mt-3 w-full rounded-md border border-gray-200 bg-gray-50 px-3 py-2 text-xs outline-none focus:border-[#c4ef72]" /><label className="mt-3 flex items-center gap-2 text-[11px] text-gray-500"><input type="checkbox" checked={showPlanned} onChange={event => setShowPlanned(event.target.checked)} className="accent-green-500" />Show future components</label></div>
    <div className="min-h-0 flex-1 overflow-y-auto px-3 py-2">{CATEGORIES.map(category => {
      const blocks = filtered.filter(block => block.category === category);
      return blocks.length ? <details key={category} open className="mb-2"><summary className="cursor-pointer py-3 text-[10px] font-semibold uppercase tracking-[.14em] text-gray-500">{category}<span className="float-right font-mono">{blocks.length}</span></summary><div className="space-y-1">{blocks.map(block => <button key={block.type} disabled={block.status !== 'ready'} draggable={block.status === 'ready'} onDragStart={event => { event.dataTransfer.setData('application/fieldnotes-block', block.type); event.dataTransfer.effectAllowed = 'copy'; }} onClick={() => onAdd(block.type)} title={block.description} className="flex w-full items-center gap-3 rounded-md border border-transparent px-2 py-2 text-left transition hover:border-green-200 hover:bg-green-50 disabled:cursor-default disabled:opacity-40"><span className={`flex h-7 min-w-8 items-center justify-center rounded border px-1 font-mono text-[10px] ${block.outputs[0]?.kind === 'analog' ? 'border-cyan-200 text-cyan-700' : 'border-green-200 text-green-700'}`}>{block.shortName}</span><span className="flex-1 text-[11px] text-gray-900">{block.name}</span>{block.status === 'planned' && <span className="text-[9px] text-gray-500">P{block.phase}</span>}</button>)}</div></details> : null;
    })}{!filtered.length && <p className="py-6 text-xs text-gray-500">No matching components.</p>}</div>
    <Link href="/library" className="border-t border-gray-200 px-4 py-3 text-[11px] text-green-700 hover:bg-gray-50">Explore all {BLOCK_DEFINITIONS.length} components ↗</Link>
  </aside>;
}
