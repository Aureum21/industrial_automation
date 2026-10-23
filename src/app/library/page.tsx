'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import {
  Search,
  X,
  Cpu,
  Clock,
  Activity,
  Layers,
  Zap,
  Gauge,
  ArrowRight,
  Sparkles,
  SlidersHorizontal,
  CheckCircle2,
  Boxes,
  HelpCircle,
  RotateCcw,
} from 'lucide-react';
import { BLOCK_DEFINITIONS, CATEGORIES } from '@/lib/automation/catalog';
import { BlockIcon } from '@/components/lab/BlockIcons';
import type { BlockDefinition } from '@/lib/automation/types';

// Helper to assign thematic icons and accent colors to categories
function getCategoryMeta(category: string) {
  switch (category) {
    case 'Digital I/O':
      return { icon: Zap, color: 'text-amber-600', border: 'border-amber-200', bg: 'bg-amber-50' };
    case 'Analog I/O':
      return { icon: Activity, color: 'text-cyan-700', border: 'border-cyan-200', bg: 'bg-cyan-50' };
    case 'Timers':
      return { icon: Clock, color: 'text-sky-700', border: 'border-sky-200', bg: 'bg-sky-50' };
    case 'Counters':
      return { icon: Layers, color: 'text-indigo-700', border: 'border-indigo-200', bg: 'bg-indigo-50' };
    case 'Logic':
      return { icon: Cpu, color: 'text-[#059669]', border: 'border-emerald-200', bg: 'bg-emerald-50' };
    case 'Analog processing':
    case 'Analog & math':
      return { icon: SlidersHorizontal, color: 'text-teal-700', border: 'border-teal-200', bg: 'bg-teal-50' };
    case 'Mechatronics':
      return { icon: Gauge, color: 'text-violet-700', border: 'border-violet-200', bg: 'bg-violet-50' };
    case 'Memory & utilities':
      return { icon: Boxes, color: 'text-fuchsia-700', border: 'border-fuchsia-200', bg: 'bg-fuchsia-50' };
    default:
      return { icon: Sparkles, color: 'text-[#059669]', border: 'border-emerald-200', bg: 'bg-emerald-50' };
  }
}

export default function LibraryPage() {
  const [query, setQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All components');
  const [readyOnly, setReadyOnly] = useState<boolean>(false);
  const [signalFilter, setSignalFilter] = useState<'all' | 'digital' | 'analog'>('all');

  // Compute category counts
  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = { 'All components': BLOCK_DEFINITIONS.length };
    BLOCK_DEFINITIONS.forEach((b) => {
      counts[b.category] = (counts[b.category] || 0) + 1;
    });
    return counts;
  }, []);

  const totalCataloged = BLOCK_DEFINITIONS.length;
  const totalReady = useMemo(
    () => BLOCK_DEFINITIONS.filter((b) => b.status === 'ready').length,
    []
  );

  // Filter blocks
  const filteredBlocks = useMemo(() => {
    const q = query.trim().toLowerCase();
    return BLOCK_DEFINITIONS.filter((block) => {
      // Category filter
      if (selectedCategory !== 'All components' && block.category !== selectedCategory) {
        return false;
      }

      // Ready filter
      if (readyOnly && block.status !== 'ready') {
        return false;
      }

      // Signal filter
      if (signalFilter === 'digital') {
        const hasDigital =
          block.inputs.some((p) => p.kind === 'digital') ||
          block.outputs.some((p) => p.kind === 'digital');
        if (!hasDigital) return false;
      } else if (signalFilter === 'analog') {
        const hasAnalog =
          block.inputs.some((p) => p.kind === 'analog') ||
          block.outputs.some((p) => p.kind === 'analog');
        if (!hasAnalog) return false;
      }

      // Text query search
      if (!q) return true;
      const haystack = `${block.name} ${block.shortName} ${block.type} ${block.description} ${block.category} ${block.inputs.map((p) => p.id).join(' ')} ${block.outputs.map((p) => p.id).join(' ')}`.toLowerCase();
      return haystack.includes(q);
    });
  }, [query, selectedCategory, readyOnly, signalFilter]);

  const hasActiveFilters =
    query.trim() !== '' ||
    selectedCategory !== 'All components' ||
    readyOnly ||
    signalFilter !== 'all';

  const resetFilters = () => {
    setQuery('');
    setSelectedCategory('All components');
    setReadyOnly(false);
    setSignalFilter('all');
  };

  return (
    <div className="min-h-screen bg-[#fbfbfd] text-[#1d1d1f] relative overflow-hidden font-sans antialiased selection:bg-[#0071e3]/15 selection:text-[#0071e3]">
      {/* Background subtle Apple dot grid */}
      <div className="absolute inset-0 bg-[radial-gradient(#e5e5ea_1px,transparent_1px)] [background-size:24px_24px] pointer-events-none opacity-60" />

      <main id="main-content" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16 relative z-10">
        {/* Header Hero Section */}
        <header className="mb-12 border-b border-[#e5e5ea] pb-12">
          <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-8">
            <div className="max-w-3xl">
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#f5f5f7] border border-[#e5e5ea] text-[#1d1d1f] font-mono text-xs uppercase tracking-wider mb-4 shadow-2xs">
                <span className="w-2 h-2 rounded-full bg-[#059669] animate-pulse" />
                <span>AutomationHub // Component Specification &amp; Signal Registry</span>
              </div>
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-[#1d1d1f] leading-tight">
                One Library.{' '}
                <span className="text-[#86868b]">
                  Every Signal.
                </span>
              </h1>
              <p className="mt-4 text-base sm:text-lg text-[#515154] leading-relaxed max-w-2xl font-normal">
                Explore standardized IEC 61131-3 logic gates, analog signal conditioning, PID controllers,
                and mechatronics. Every block executes on a deterministic 1ms simulation cycle with typed I/O pins.
              </p>
            </div>

            {/* KPI Stat Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 lg:gap-4 w-full lg:w-auto">
              <div className="bg-white border border-[#e5e5ea] rounded-2xl p-5 shadow-xs">
                <div className="text-2xl sm:text-3xl font-bold text-[#1d1d1f] tracking-tight">
                  {totalCataloged}
                </div>
                <div className="text-[11px] font-mono uppercase tracking-wider text-[#86868b] mt-1">
                  Cataloged
                </div>
              </div>

              <div className="bg-white border border-[#e5e5ea] rounded-2xl p-5 shadow-xs">
                <div className="text-2xl sm:text-3xl font-bold text-[#059669] flex items-center gap-2">
                  <span>{totalReady}</span>
                  <span className="w-2 h-2 rounded-full bg-[#059669] animate-pulse" />
                </div>
                <div className="text-[11px] font-mono uppercase tracking-wider text-[#059669] font-medium mt-1">
                  Ready in Lab
                </div>
              </div>

              <div className="bg-white border border-[#e5e5ea] rounded-2xl p-5 shadow-xs">
                <div className="text-2xl sm:text-3xl font-bold text-[#0071e3]">10</div>
                <div className="text-[11px] font-mono uppercase tracking-wider text-[#86868b] mt-1">
                  Domains
                </div>
              </div>

              <div className="bg-white border border-[#e5e5ea] rounded-2xl p-5 shadow-xs">
                <div className="text-2xl sm:text-3xl font-bold text-[#1d1d1f]">1 ms</div>
                <div className="text-[11px] font-mono uppercase tracking-wider text-[#86868b] mt-1">
                  Scan Cycle
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* Command Center: High-Visibility Search & Filters */}
        <section className="mb-10 space-y-5" aria-label="Search and component filters">
          {/* Main Search Row */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            {/* Prominent Search Input */}
            <div className="relative flex-1 group">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-[#86868b] group-focus-within:text-[#0071e3] transition-colors">
                <Search size={18} />
              </div>
              <input
                type="search"
                aria-label="Search component library"
                placeholder="Search components by name, type, pin, or function (e.g. 'PID', 'Timer', 'Analog', 'TON')..."
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                className="w-full rounded-2xl bg-white border-2 border-[#e5e5ea] hover:border-[#d2d2d7] focus:border-[#0071e3] focus:ring-4 focus:ring-[#0071e3]/10 text-[#1d1d1f] placeholder-[#86868b] text-sm sm:text-base py-3.5 pl-12 pr-24 outline-none transition-all shadow-xs"
              />
              <div className="absolute inset-y-0 right-0 pr-3 flex items-center gap-1.5">
                {query && (
                  <button
                    type="button"
                    onClick={() => setQuery('')}
                    aria-label="Clear search query"
                    className="p-1 rounded-md text-[#86868b] hover:text-[#1d1d1f] hover:bg-[#f5f5f7] transition"
                  >
                    <X size={16} />
                  </button>
                )}
                <span className="hidden sm:inline-block px-2 py-0.5 text-[10px] font-mono text-[#86868b] bg-[#f5f5f7] border border-[#e5e5ea] rounded">
                  ESC
                </span>
              </div>
            </div>

            {/* Quick Toggle: Simulatable Only */}
            <button
              type="button"
              onClick={() => setReadyOnly(!readyOnly)}
              className={`flex items-center justify-center gap-2 px-4 py-3.5 rounded-2xl border font-mono text-xs sm:text-sm font-medium transition-all shadow-xs ${
                readyOnly
                  ? 'bg-emerald-50 border-emerald-300 text-emerald-800'
                  : 'bg-white border-[#e5e5ea] text-[#1d1d1f] hover:bg-[#f5f5f7] hover:border-[#d2d2d7]'
              }`}
            >
              <span
                className={`w-2 h-2 rounded-full ${
                  readyOnly ? 'bg-emerald-500 animate-pulse' : 'bg-[#86868b]'
                }`}
              />
              <span>Ready in Lab ({totalReady})</span>
            </button>

            {/* Signal Kind Filter */}
            <div className="flex items-center bg-[#f5f5f7] border border-[#e5e5ea] rounded-2xl p-1 font-mono text-xs shadow-2xs">
              <button
                type="button"
                onClick={() => setSignalFilter('all')}
                className={`px-3.5 py-2 rounded-xl transition ${
                  signalFilter === 'all'
                    ? 'bg-white text-[#1d1d1f] font-semibold shadow-xs'
                    : 'text-[#86868b] hover:text-[#1d1d1f]'
                }`}
              >
                All I/O
              </button>
              <button
                type="button"
                onClick={() => setSignalFilter('digital')}
                className={`px-3.5 py-2 rounded-xl transition ${
                  signalFilter === 'digital'
                    ? 'bg-white text-[#059669] font-semibold shadow-xs'
                    : 'text-[#86868b] hover:text-[#1d1d1f]'
                }`}
              >
                Digital
              </button>
              <button
                type="button"
                onClick={() => setSignalFilter('analog')}
                className={`px-3.5 py-2 rounded-xl transition ${
                  signalFilter === 'analog'
                    ? 'bg-white text-cyan-700 font-semibold shadow-xs'
                    : 'text-[#86868b] hover:text-[#1d1d1f]'
                }`}
              >
                Analog
              </button>
            </div>
          </div>

          {/* Category Tabs / Filter Pills */}
          <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-[#e5e5ea] scrollbar-track-transparent">
            {['All components', ...CATEGORIES].map((cat) => {
              const count = categoryCounts[cat] || 0;
              const isSelected = selectedCategory === cat;
              return (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setSelectedCategory(cat)}
                  className={`flex items-center gap-2 px-3.5 py-1.5 rounded-full border text-xs whitespace-nowrap transition-all font-mono shadow-2xs ${
                    isSelected
                      ? 'bg-[#1d1d1f] border-[#1d1d1f] text-white font-semibold'
                      : 'bg-white border-[#e5e5ea] text-[#1d1d1f] hover:bg-[#f5f5f7] hover:border-[#d2d2d7]'
                  }`}
                >
                  <span>{cat}</span>
                  <span
                    className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                      isSelected
                        ? 'bg-white/20 text-white'
                        : 'bg-[#f5f5f7] text-[#86868b]'
                    }`}
                  >
                    {count}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Filter Status & Active Reset Indicator */}
          <div className="flex items-center justify-between text-xs font-mono text-[#86868b] pt-2 border-t border-[#e5e5ea]">
            <div className="flex items-center gap-2">
              <span className="text-[#059669] font-semibold">● SHOWING:</span>
              <span className="text-[#1d1d1f] font-bold">{filteredBlocks.length}</span> of{' '}
              <span>{totalCataloged}</span> COMPONENTS
              {readyOnly && <span className="text-[#059669]">· SIMULATABLE ONLY</span>}
              {selectedCategory !== 'All components' && (
                <span className="text-[#0071e3]">· {selectedCategory.toUpperCase()}</span>
              )}
            </div>

            {hasActiveFilters && (
              <button
                type="button"
                onClick={resetFilters}
                className="flex items-center gap-1.5 text-[#86868b] hover:text-[#0071e3] transition font-mono text-xs"
              >
                <RotateCcw size={12} />
                <span>Reset all filters</span>
              </button>
            )}
          </div>
        </section>

        {/* Component Cards Grid */}
        <section aria-label="Component catalog results">
          {filteredBlocks.length === 0 ? (
            <div className="my-16 flex flex-col items-center justify-center text-center p-12 rounded-2xl border border-[#e5e5ea] bg-white shadow-xs max-w-xl mx-auto">
              <div className="w-16 h-16 rounded-2xl bg-[#f5f5f7] border border-[#e5e5ea] flex items-center justify-center text-[#86868b] mb-4">
                <HelpCircle size={32} />
              </div>
              <h2 className="text-xl font-bold text-[#1d1d1f] mb-2">No components found</h2>
              <p className="text-sm text-[#86868b] mb-6">
                No catalog blocks match &ldquo;<span className="text-[#0071e3] font-mono">{query}</span>&rdquo; with the selected filters.
              </p>
              <button
                type="button"
                onClick={resetFilters}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#0071e3] hover:bg-[#0077ed] text-white font-medium text-sm transition shadow-xs"
              >
                <RotateCcw size={14} />
                <span>Clear All Filters</span>
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {filteredBlocks.map((block: BlockDefinition) => {
                const meta = getCategoryMeta(block.category);
                const CategoryIcon = meta.icon;
                const isReady = block.status === 'ready';

                return (
                  <article
                    key={block.type}
                    className="group relative bg-white border border-[#e5e5ea] hover:border-[#0071e3]/40 rounded-2xl p-6 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md flex flex-col justify-between overflow-hidden shadow-xs"
                  >
                    <div>
                      {/* Top Header: Symbol Icon, Short Code & Status Badge */}
                      <div className="flex items-center justify-between gap-3 mb-4">
                        <div className="flex items-center gap-2.5">
                          {/* IEC Block Icon Box */}
                          <div className="w-10 h-10 rounded-xl bg-[#f5f5f7] border border-[#e5e5ea] flex items-center justify-center text-[#1d1d1f] group-hover:border-[#0071e3]/40 transition-colors">
                            <BlockIcon type={block.type} />
                          </div>
                          <div>
                            <span className="font-mono text-xs font-bold text-[#1d1d1f] bg-[#f5f5f7] border border-[#e5e5ea] px-2 py-0.5 rounded-lg tracking-wider">
                              [{block.shortName}]
                            </span>
                          </div>
                        </div>

                        {/* Status Badge */}
                        {isReady ? (
                          <span className="inline-flex items-center gap-1.5 font-mono text-[11px] px-2.5 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 font-medium">
                            <span className="w-1.5 h-1.5 rounded-full bg-[#059669] animate-pulse" />
                            Ready in Lab
                          </span>
                        ) : (
                          <span className="font-mono text-[10px] px-2.5 py-1 rounded-full bg-[#f5f5f7] border border-[#e5e5ea] text-[#86868b]">
                            Roadmap · P{block.phase}
                          </span>
                        )}
                      </div>

                      {/* Domain / Category Tag */}
                      <div className="flex items-center gap-1.5 mb-2">
                        <CategoryIcon size={12} className={meta.color} />
                        <span className="text-[10px] font-mono uppercase tracking-wider text-[#86868b]">
                          {block.category}
                        </span>
                      </div>

                      {/* Block Name */}
                      <h2 className="text-xl font-bold text-[#1d1d1f] group-hover:text-[#0071e3] transition-colors mb-2.5 leading-snug">
                        {block.name}
                      </h2>

                      {/* Block Description */}
                      <p className="text-xs sm:text-sm text-[#515154] leading-relaxed mb-6 font-normal">
                        {block.description}
                      </p>
                    </div>

                    {/* Bottom Technical Specifications */}
                    <div className="pt-4 border-t border-[#e5e5ea] space-y-3">
                      {/* Pin Matrix */}
                      <div className="grid grid-cols-2 gap-2 text-[10px] font-mono">
                        {/* IN Pins */}
                        <div className="bg-[#f5f5f7] border border-[#e5e5ea] rounded-xl p-2.5">
                          <div className="text-[#86868b] uppercase tracking-widest text-[9px] mb-1 font-semibold">
                            Inputs ({block.inputs.length})
                          </div>
                          <div className="flex flex-wrap gap-1">
                            {block.inputs.length > 0 ? (
                              block.inputs.map((pin) => (
                                <span
                                  key={pin.id}
                                  title={`${pin.label} (${pin.kind})`}
                                  className={`px-1.5 py-0.5 rounded border shadow-2xs ${
                                    pin.kind === 'analog'
                                      ? 'bg-white border-cyan-200 text-cyan-800'
                                      : 'bg-white border-emerald-200 text-emerald-800'
                                  }`}
                                >
                                  {pin.id}
                                </span>
                              ))
                            ) : (
                              <span className="text-[#86868b]">—</span>
                            )}
                          </div>
                        </div>

                        {/* OUT Pins */}
                        <div className="bg-[#f5f5f7] border border-[#e5e5ea] rounded-xl p-2.5">
                          <div className="text-[#86868b] uppercase tracking-widest text-[9px] mb-1 font-semibold">
                            Outputs ({block.outputs.length})
                          </div>
                          <div className="flex flex-wrap gap-1">
                            {block.outputs.length > 0 ? (
                              block.outputs.map((pin) => (
                                <span
                                  key={pin.id}
                                  title={`${pin.label} (${pin.kind})`}
                                  className={`px-1.5 py-0.5 rounded border shadow-2xs ${
                                    pin.kind === 'analog'
                                      ? 'bg-white border-cyan-200 text-cyan-800'
                                      : 'bg-white border-emerald-200 text-emerald-800'
                                  }`}
                                >
                                  {pin.id}
                                </span>
                              ))
                            ) : (
                              <span className="text-[#86868b]">—</span>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Interactive Launch Link */}
                      <div className="flex items-center justify-between pt-1">
                        <span className="text-[10px] font-mono text-[#86868b]">
                          TYPE: <span className="text-[#1d1d1f] font-semibold">{block.type}</span>
                        </span>
                        {isReady ? (
                          <Link
                            href="/lab"
                            className="inline-flex items-center gap-1 text-xs font-mono font-medium text-[#0071e3] hover:underline transition-colors group-hover:translate-x-0.5"
                          >
                            <span>Wire in Lab</span>
                            <ArrowRight size={12} />
                          </Link>
                        ) : (
                          <span className="text-[10px] font-mono text-[#86868b]">
                            Planned Phase {block.phase}
                          </span>
                        )}
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </section>

        {/* Bottom Call to Action Workbench */}
        <section className="mt-16 relative overflow-hidden rounded-2xl border border-[#e5e5ea] bg-white p-8 sm:p-10 shadow-xs">
          <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-6">
            <div>
              <div className="inline-flex items-center gap-1.5 text-xs font-mono text-[#059669] uppercase tracking-widest mb-2 font-bold">
                <CheckCircle2 size={14} />
                <span>74 Validated Logic Blocks Ready Today</span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-bold text-[#1d1d1f] tracking-tight">
                Ready to wire these blocks together?
              </h2>
              <p className="mt-2 text-sm text-[#515154] max-w-xl">
                Open the interactive visual logic editor. Drop components on the canvas, route signals with
                live oscilloscope waveforms, and export verified JSON schematics.
              </p>
            </div>
            <Link
              href="/lab"
              className="inline-flex items-center gap-2 px-6 py-3.5 rounded-xl bg-[#0071e3] hover:bg-[#0077ed] text-white font-medium text-sm transition shadow-xs whitespace-nowrap"
            >
              <span>Open the Logic Lab</span>
              <ArrowRight size={16} />
            </Link>
          </div>
        </section>
      </main>
    </div>
  );
}
