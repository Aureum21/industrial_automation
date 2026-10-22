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
  ExternalLink,
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
      return { icon: Zap, color: 'text-amber-400', border: 'border-amber-500/30', bg: 'bg-amber-500/10' };
    case 'Analog I/O':
      return { icon: Activity, color: 'text-cyan-400', border: 'border-cyan-500/30', bg: 'bg-cyan-500/10' };
    case 'Timers':
      return { icon: Clock, color: 'text-sky-400', border: 'border-sky-500/30', bg: 'bg-sky-500/10' };
    case 'Counters':
      return { icon: Layers, color: 'text-indigo-400', border: 'border-indigo-500/30', bg: 'bg-indigo-500/10' };
    case 'Logic':
      return { icon: Cpu, color: 'text-emerald-400', border: 'border-emerald-500/30', bg: 'bg-emerald-500/10' };
    case 'Analog processing':
    case 'Analog & math':
      return { icon: SlidersHorizontal, color: 'text-teal-400', border: 'border-teal-500/30', bg: 'bg-teal-500/10' };
    case 'Mechatronics':
      return { icon: Gauge, color: 'text-violet-400', border: 'border-violet-500/30', bg: 'bg-violet-500/10' };
    case 'Memory & utilities':
      return { icon: Boxes, color: 'text-fuchsia-400', border: 'border-fuchsia-500/30', bg: 'bg-fuchsia-500/10' };
    default:
      return { icon: Sparkles, color: 'text-emerald-400', border: 'border-emerald-500/30', bg: 'bg-emerald-500/10' };
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
    <div className="min-h-screen bg-[#070b14] text-zinc-100 relative overflow-hidden selection:bg-emerald-500/30 selection:text-emerald-200">
      {/* Industrial Blueprint Background Grid */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(114,217,229,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(114,217,229,0.03)_1px,transparent_1px)] bg-[size:40px_40px] pointer-events-none" />

      {/* Atmospheric Ambient Glows */}
      <div className="absolute top-0 right-1/4 w-[600px] h-[600px] bg-emerald-500/5 rounded-full blur-[150px] pointer-events-none" />
      <div className="absolute top-1/3 left-10 w-[500px] h-[500px] bg-cyan-500/5 rounded-full blur-[130px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-10 w-[450px] h-[450px] bg-sky-500/5 rounded-full blur-[140px] pointer-events-none" />

      <main id="main-content" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16 relative z-10">
        {/* Header Hero Section */}
        <header className="mb-12 border-b border-zinc-800/80 pb-12">
          <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-8">
            <div className="max-w-3xl">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 font-mono text-[11px] uppercase tracking-wider mb-4 shadow-[0_0_15px_rgba(16,185,129,0.15)]">
                <Cpu size={14} />
                <span>AutomationHub // Component Specification &amp; Signal Registry</span>
              </div>
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight text-white leading-tight">
                One Library.{' '}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 via-teal-300 to-cyan-400">
                  Every Signal.
                </span>
              </h1>
              <p className="mt-4 text-base sm:text-lg text-zinc-400 leading-relaxed max-w-2xl">
                Explore standardized IEC 61131-3 logic gates, analog signal conditioning, PID controllers,
                and mechatronics. Every block executes on a deterministic 1ms simulation cycle with typed I/O pins.
              </p>
            </div>

            {/* KPI Stat Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 lg:gap-4 w-full lg:w-auto">
              <div className="bg-zinc-900/60 border border-zinc-800/90 rounded-xl p-4 backdrop-blur-sm">
                <div className="text-2xl sm:text-3xl font-mono font-bold text-white tracking-tight">
                  {totalCataloged}
                </div>
                <div className="text-[11px] font-mono uppercase tracking-wider text-zinc-400 mt-1">
                  Cataloged
                </div>
              </div>

              <div className="bg-emerald-950/20 border border-emerald-500/30 rounded-xl p-4 backdrop-blur-sm">
                <div className="text-2xl sm:text-3xl font-mono font-bold text-emerald-400 flex items-center gap-2">
                  <span>{totalReady}</span>
                  <span className="relative flex h-2.5 w-2.5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
                  </span>
                </div>
                <div className="text-[11px] font-mono uppercase tracking-wider text-emerald-400/80 mt-1">
                  Ready in Lab
                </div>
              </div>

              <div className="bg-zinc-900/60 border border-zinc-800/90 rounded-xl p-4 backdrop-blur-sm">
                <div className="text-2xl sm:text-3xl font-mono font-bold text-cyan-400">10</div>
                <div className="text-[11px] font-mono uppercase tracking-wider text-zinc-400 mt-1">
                  Domains
                </div>
              </div>

              <div className="bg-zinc-900/60 border border-zinc-800/90 rounded-xl p-4 backdrop-blur-sm">
                <div className="text-2xl sm:text-3xl font-mono font-bold text-amber-400">1 ms</div>
                <div className="text-[11px] font-mono uppercase tracking-wider text-zinc-400 mt-1">
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
            {/* Prominent Illuminated Search Input */}
            <div className="relative flex-1 group">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-emerald-400 group-focus-within:text-cyan-400 transition-colors">
                <Search size={20} />
              </div>
              <input
                type="search"
                aria-label="Search component library"
                placeholder="Search components by name, type, pin, or function (e.g. 'PID', 'Timer', 'Analog', 'TON')..."
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                className="w-full rounded-xl bg-zinc-900/90 border-2 border-zinc-700/80 hover:border-zinc-600 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/20 text-white placeholder-zinc-400 text-sm sm:text-base py-3.5 pl-12 pr-24 outline-none transition-all shadow-[0_4px_20px_rgba(0,0,0,0.5)]"
              />
              <div className="absolute inset-y-0 right-0 pr-3 flex items-center gap-1.5">
                {query && (
                  <button
                    type="button"
                    onClick={() => setQuery('')}
                    aria-label="Clear search query"
                    className="p-1 rounded-md text-zinc-400 hover:text-white hover:bg-zinc-800 transition"
                  >
                    <X size={16} />
                  </button>
                )}
                <span className="hidden sm:inline-block px-2 py-0.5 text-[10px] font-mono text-zinc-400 bg-zinc-800 border border-zinc-700 rounded">
                  ESC
                </span>
              </div>
            </div>

            {/* Quick Toggle: Simulatable Only */}
            <button
              type="button"
              onClick={() => setReadyOnly(!readyOnly)}
              className={`flex items-center justify-center gap-2 px-4 py-3.5 rounded-xl border font-mono text-xs sm:text-sm font-medium transition-all ${
                readyOnly
                  ? 'bg-emerald-500/20 border-emerald-500 text-emerald-300 shadow-[0_0_20px_rgba(16,185,129,0.25)]'
                  : 'bg-zinc-900/80 border-zinc-800 text-zinc-400 hover:text-zinc-200 hover:border-zinc-700'
              }`}
            >
              <span
                className={`w-2.5 h-2.5 rounded-full ${
                  readyOnly ? 'bg-emerald-400 animate-pulse' : 'bg-zinc-600'
                }`}
              />
              <span>Ready in Lab ({totalReady})</span>
            </button>

            {/* Signal Kind Filter */}
            <div className="flex items-center bg-zinc-900/80 border border-zinc-800 rounded-xl p-1 font-mono text-xs">
              <button
                type="button"
                onClick={() => setSignalFilter('all')}
                className={`px-3 py-2 rounded-lg transition ${
                  signalFilter === 'all'
                    ? 'bg-zinc-800 text-white font-semibold shadow-sm'
                    : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                All I/O
              </button>
              <button
                type="button"
                onClick={() => setSignalFilter('digital')}
                className={`px-3 py-2 rounded-lg transition ${
                  signalFilter === 'digital'
                    ? 'bg-emerald-500/20 text-emerald-300 font-semibold shadow-sm'
                    : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                Digital
              </button>
              <button
                type="button"
                onClick={() => setSignalFilter('analog')}
                className={`px-3 py-2 rounded-lg transition ${
                  signalFilter === 'analog'
                    ? 'bg-cyan-500/20 text-cyan-300 font-semibold shadow-sm'
                    : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                Analog
              </button>
            </div>
          </div>

          {/* Category Tabs / Filter Pills */}
          <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-zinc-800 scrollbar-track-transparent">
            {['All components', ...CATEGORIES].map((cat) => {
              const count = categoryCounts[cat] || 0;
              const isSelected = selectedCategory === cat;
              return (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setSelectedCategory(cat)}
                  className={`flex items-center gap-2 px-3.5 py-1.5 rounded-full border text-xs whitespace-nowrap transition-all font-mono ${
                    isSelected
                      ? 'bg-emerald-500/15 border-emerald-500/60 text-emerald-300 font-bold shadow-[0_0_15px_rgba(16,185,129,0.15)]'
                      : 'bg-zinc-900/60 border-zinc-800/90 text-zinc-400 hover:text-zinc-200 hover:border-zinc-700'
                  }`}
                >
                  <span>{cat}</span>
                  <span
                    className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                      isSelected
                        ? 'bg-emerald-500/30 text-emerald-200'
                        : 'bg-zinc-800 text-zinc-400'
                    }`}
                  >
                    {count}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Filter Status & Active Reset Indicator */}
          <div className="flex items-center justify-between text-xs font-mono text-zinc-400 pt-1 border-t border-zinc-800/50">
            <div className="flex items-center gap-2">
              <span className="text-emerald-400 font-semibold">● SHOWING:</span>
              <span className="text-zinc-200 font-bold">{filteredBlocks.length}</span> of{' '}
              <span className="text-zinc-400">{totalCataloged}</span> COMPONENTS
              {readyOnly && <span className="text-emerald-400">· SIMULATABLE ONLY</span>}
              {selectedCategory !== 'All components' && (
                <span className="text-cyan-400">· {selectedCategory.toUpperCase()}</span>
              )}
            </div>

            {hasActiveFilters && (
              <button
                type="button"
                onClick={resetFilters}
                className="flex items-center gap-1.5 text-zinc-400 hover:text-emerald-400 transition font-mono text-xs"
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
            <div className="my-16 flex flex-col items-center justify-center text-center p-12 rounded-2xl border border-zinc-800 bg-zinc-900/40 backdrop-blur-sm max-w-xl mx-auto">
              <div className="w-16 h-16 rounded-2xl bg-zinc-800/80 border border-zinc-700/80 flex items-center justify-center text-zinc-400 mb-4">
                <HelpCircle size={32} />
              </div>
              <h2 className="text-xl font-bold text-white mb-2">No components found</h2>
              <p className="text-sm text-zinc-400 mb-6">
                No catalog blocks match &ldquo;<span className="text-emerald-400 font-mono">{query}</span>&rdquo; with the selected filters.
              </p>
              <button
                type="button"
                onClick={resetFilters}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-bold text-sm transition shadow-[0_0_20px_rgba(16,185,129,0.3)]"
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
                    className="group relative bg-zinc-900/60 hover:bg-zinc-900/90 backdrop-blur-sm border border-zinc-800/80 hover:border-emerald-500/50 rounded-2xl p-6 transition-all duration-200 hover:-translate-y-1 hover:shadow-[0_12px_32px_-12px_rgba(16,185,129,0.2)] flex flex-col justify-between overflow-hidden"
                  >
                    {/* Hover Top Glow Line */}
                    <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-emerald-500/0 to-transparent group-hover:via-emerald-400 transition-all duration-300" />

                    <div>
                      {/* Top Header: Symbol Icon, Short Code & Status Badge */}
                      <div className="flex items-center justify-between gap-3 mb-4">
                        <div className="flex items-center gap-2.5">
                          {/* IEC Block Icon Box */}
                          <div className="w-10 h-10 rounded-xl bg-zinc-800/80 border border-zinc-700/60 flex items-center justify-center text-emerald-400 group-hover:text-emerald-300 group-hover:border-emerald-500/40 transition-colors shadow-inner">
                            <BlockIcon type={block.type} />
                          </div>
                          <div>
                            <span className="font-mono text-sm font-bold text-cyan-400 bg-cyan-950/40 border border-cyan-500/30 px-2 py-0.5 rounded tracking-wider">
                              [{block.shortName}]
                            </span>
                          </div>
                        </div>

                        {/* Status Badge */}
                        {isReady ? (
                          <span className="inline-flex items-center gap-1.5 font-mono text-[11px] px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 font-medium">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                            Ready in Lab
                          </span>
                        ) : (
                          <span className="font-mono text-[10px] px-2.5 py-1 rounded-full bg-zinc-800/80 border border-zinc-700/60 text-zinc-400">
                            Roadmap · P{block.phase}
                          </span>
                        )}
                      </div>

                      {/* Domain / Category Tag */}
                      <div className="flex items-center gap-1.5 mb-2">
                        <CategoryIcon size={12} className={meta.color} />
                        <span className="text-[10px] font-mono uppercase tracking-wider text-zinc-400">
                          {block.category}
                        </span>
                      </div>

                      {/* Block Name */}
                      <h2 className="text-xl font-bold text-white group-hover:text-emerald-300 transition-colors mb-2.5">
                        {block.name}
                      </h2>

                      {/* Block Description */}
                      <p className="text-xs text-zinc-400 leading-relaxed mb-6">
                        {block.description}
                      </p>
                    </div>

                    {/* Bottom Technical Specifications */}
                    <div className="pt-4 border-t border-zinc-800/60 space-y-3">
                      {/* Pin Matrix */}
                      <div className="grid grid-cols-2 gap-2 text-[10px] font-mono">
                        {/* IN Pins */}
                        <div className="bg-zinc-950/50 border border-zinc-800/70 rounded-lg p-2">
                          <div className="text-zinc-500 uppercase tracking-widest text-[9px] mb-1 font-semibold">
                            Inputs ({block.inputs.length})
                          </div>
                          <div className="flex flex-wrap gap-1">
                            {block.inputs.length > 0 ? (
                              block.inputs.map((pin) => (
                                <span
                                  key={pin.id}
                                  title={`${pin.label} (${pin.kind})`}
                                  className={`px-1.5 py-0.5 rounded border ${
                                    pin.kind === 'analog'
                                      ? 'bg-cyan-950/60 border-cyan-500/30 text-cyan-300'
                                      : 'bg-emerald-950/60 border-emerald-500/30 text-emerald-300'
                                  }`}
                                >
                                  {pin.id}
                                </span>
                              ))
                            ) : (
                              <span className="text-zinc-600">—</span>
                            )}
                          </div>
                        </div>

                        {/* OUT Pins */}
                        <div className="bg-zinc-950/50 border border-zinc-800/70 rounded-lg p-2">
                          <div className="text-zinc-500 uppercase tracking-widest text-[9px] mb-1 font-semibold">
                            Outputs ({block.outputs.length})
                          </div>
                          <div className="flex flex-wrap gap-1">
                            {block.outputs.length > 0 ? (
                              block.outputs.map((pin) => (
                                <span
                                  key={pin.id}
                                  title={`${pin.label} (${pin.kind})`}
                                  className={`px-1.5 py-0.5 rounded border ${
                                    pin.kind === 'analog'
                                      ? 'bg-cyan-950/60 border-cyan-500/30 text-cyan-300'
                                      : 'bg-emerald-950/60 border-emerald-500/30 text-emerald-300'
                                  }`}
                                >
                                  {pin.id}
                                </span>
                              ))
                            ) : (
                              <span className="text-zinc-600">—</span>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Interactive Launch Link */}
                      <div className="flex items-center justify-between pt-1">
                        <span className="text-[10px] font-mono text-zinc-500">
                          TYPE: <span className="text-zinc-400">{block.type}</span>
                        </span>
                        {isReady ? (
                          <Link
                            href="/lab"
                            className="inline-flex items-center gap-1 text-xs font-mono font-bold text-emerald-400 hover:text-emerald-300 transition-colors group-hover:translate-x-0.5"
                          >
                            <span>Wire in Lab</span>
                            <ArrowRight size={12} />
                          </Link>
                        ) : (
                          <span className="text-[10px] font-mono text-zinc-600">
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
        <section className="mt-16 relative overflow-hidden rounded-2xl border border-emerald-500/30 bg-gradient-to-r from-emerald-950/30 via-zinc-900/80 to-cyan-950/30 p-8 sm:p-10 shadow-[0_10px_40px_rgba(0,0,0,0.6)]">
          <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-6">
            <div>
              <div className="inline-flex items-center gap-1.5 text-xs font-mono text-emerald-400 uppercase tracking-widest mb-2 font-bold">
                <CheckCircle2 size={14} />
                <span>74 Validated Logic Blocks Ready Today</span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
                Ready to wire these blocks together?
              </h2>
              <p className="mt-2 text-sm text-zinc-400 max-w-xl">
                Open the interactive visual logic editor. Drop components on the canvas, route signals with
                live oscilloscope waveforms, and export verified JSON schematics.
              </p>
            </div>
            <Link
              href="/lab"
              className="inline-flex items-center gap-2 px-6 py-3.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-bold text-sm transition shadow-[0_0_25px_rgba(16,185,129,0.35)] whitespace-nowrap"
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
