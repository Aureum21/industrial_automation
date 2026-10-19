'use client';

import { useState, useMemo, useEffect } from 'react';
import Link from 'next/link';
import {
  Search,
  SlidersHorizontal,
  Cpu,
  BookOpen,
  ArrowRight,
  TrendingUp,
  Sparkles,
  Layers,
  ShieldCheck,
  Zap,
  Activity,
  Droplets,
  Wind,
  Sun,
  PenTool,
} from 'lucide-react';
import { BLOG_POSTS, type BlogPost } from '@/lib/mockPosts';
import { getAllPosts } from '@/lib/blogStorage';

const CATEGORIES = [
  'All Topics',
  'Process & PID',
  'Safety & Interlocks',
  'Material Handling',
  'Water & Environment',
  'HVAC & Building',
  'Energy & Microgrid',
] as const;

type CategoryFilter = (typeof CATEGORIES)[number];

function getCategoryIcon(tag: string) {
  const t = tag.toLowerCase();
  if (t.includes('water') || t.includes('p&id')) return <Droplets size={14} className="text-cyan-400" />;
  if (t.includes('heat') || t.includes('pid') || t.includes('process')) return <Activity size={14} className="text-orange-400" />;
  if (t.includes('safe') || t.includes('press') || t.includes('esd')) return <ShieldCheck size={14} className="text-red-400" />;
  if (t.includes('hvac') || t.includes('climate')) return <Wind size={14} className="text-sky-400" />;
  if (t.includes('solar') || t.includes('energy')) return <Sun size={14} className="text-amber-400" />;
  if (t.includes('convey') || t.includes('sorting')) return <Layers size={14} className="text-emerald-400" />;
  return <Zap size={14} className="text-emerald-400" />;
}

export default function BlogsPage() {
  const [posts, setPosts] = useState<BlogPost[]>(BLOG_POSTS);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<CategoryFilter>('All Topics');
  const [sortBy, setSortBy] = useState<'views' | 'date' | 'readingTime' | 'title'>('views');

  useEffect(() => {
    setPosts(getAllPosts());
  }, []);

  // Filter posts
  const filteredPosts = useMemo(() => {
    return posts.filter((post) => {
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !q ||
        post.title.toLowerCase().includes(q) ||
        post.excerpt.toLowerCase().includes(q) ||
        post.author.toLowerCase().includes(q) ||
        post.tag.toLowerCase().includes(q);

      if (!matchesSearch) return false;

      if (selectedCategory === 'All Topics') return true;
      const tagLower = post.tag.toLowerCase();
      if (selectedCategory === 'Process & PID') {
        return tagLower.includes('pid') || tagLower.includes('heater') || tagLower.includes('tank');
      }
      if (selectedCategory === 'Safety & Interlocks') {
        return tagLower.includes('safety') || tagLower.includes('esd') || tagLower.includes('traffic');
      }
      if (selectedCategory === 'Material Handling') {
        return tagLower.includes('conveyor') || tagLower.includes('sorting') || tagLower.includes('pump');
      }
      if (selectedCategory === 'Water & Environment') {
        return tagLower.includes('water') || tagLower.includes('treatment') || tagLower.includes('pump');
      }
      if (selectedCategory === 'HVAC & Building') {
        return tagLower.includes('hvac') || tagLower.includes('economizer');
      }
      if (selectedCategory === 'Energy & Microgrid') {
        return tagLower.includes('solar') || tagLower.includes('energy') || tagLower.includes('logging');
      }
      return true;
    });
  }, [posts, searchQuery, selectedCategory]);

  // Sort posts
  const sortedPosts = useMemo(() => {
    return [...filteredPosts].sort((a, b) => {
      if (sortBy === 'views') {
        return (b.views ?? 0) - (a.views ?? 0);
      }
      if (sortBy === 'date') {
        return new Date(b.date).getTime() - new Date(a.date).getTime();
      }
      if (sortBy === 'readingTime') {
        const aMin = parseInt(a.readingTime) || 5;
        const bMin = parseInt(b.readingTime) || 5;
        return aMin - bMin;
      }
      if (sortBy === 'title') {
        return a.title.localeCompare(b.title);
      }
      return 0;
    });
  }, [filteredPosts, sortBy]);

  // Top featured masterclass
  const featuredPost = useMemo(() => {
    return posts.find((p) => p.slug === 'water-treatment') || posts[0];
  }, [posts]);

  // Calculate total views
  const totalViews = useMemo(() => {
    return posts.reduce((acc, p) => acc + (p.views ?? 0), 0);
  }, [posts]);

  return (
    <div className="min-h-screen bg-[#070b14] text-zinc-100 relative overflow-hidden">
      {/* Background blueprint grid */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(114,217,229,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(114,217,229,0.03)_1px,transparent_1px)] bg-[size:40px_40px] pointer-events-none" />
      <div className="absolute top-0 right-1/4 w-[500px] h-[500px] bg-emerald-500/5 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute bottom-1/3 left-10 w-[400px] h-[400px] bg-cyan-500/5 rounded-full blur-[120px] pointer-events-none" />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 relative z-10">
        {/* Header Hero Section */}
        <header className="mb-12 border-b border-zinc-800/80 pb-10">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 font-mono text-[11px] uppercase tracking-wider mb-4">
                <Cpu size={14} />
                <span>AutomationHub // Schematics &amp; Fieldnotes</span>
              </div>
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-serif font-black tracking-tight text-white leading-tight">
                Engineering Masterclasses <br />
                <span className="text-emerald-400 font-sans tracking-tighter">
                  &amp; Interactive Logic Labs
                </span>
              </h1>
              <p className="mt-4 max-w-2xl text-base text-zinc-400 leading-relaxed">
                Explore hands-on industrial schematics, Function Block Diagram (FBD) architectures, and field-tested control patterns verified on live simulation engines.
              </p>
            </div>

            {/* Quick Metrics */}
            <div className="grid grid-cols-3 gap-3 bg-zinc-900/60 border border-zinc-800/80 p-4 rounded-xl backdrop-blur-md font-mono shrink-0">
              <div className="text-center px-2">
                <div className="text-xl sm:text-2xl font-bold text-white">{posts.length}</div>
                <div className="text-[10px] text-zinc-500 uppercase tracking-wider mt-0.5">Schematics</div>
              </div>
              <div className="text-center border-x border-zinc-800 px-3">
                <div className="text-xl sm:text-2xl font-bold text-emerald-400">
                  {totalViews > 1000 ? `${(totalViews / 1000).toFixed(0)}k+` : totalViews}
                </div>
                <div className="text-[10px] text-zinc-500 uppercase tracking-wider mt-0.5">Total Reads</div>
              </div>
              <div className="text-center px-2">
                <div className="text-xl sm:text-2xl font-bold text-cyan-400">100%</div>
                <div className="text-[10px] text-zinc-500 uppercase tracking-wider mt-0.5">Interactive</div>
              </div>
            </div>
          </div>
        </header>

        {/* Featured Masterclass Banner */}
        {featuredPost && (
          <section className="mb-14">
            <div className="relative rounded-2xl border border-zinc-800 bg-gradient-to-br from-zinc-900/90 via-zinc-900/50 to-zinc-950 p-6 sm:p-8 overflow-hidden group hover:border-emerald-500/50 transition-all duration-300 shadow-2xl hover:shadow-[0_0_30px_rgba(34,197,94,0.15)]">
              <div className="absolute top-0 right-0 w-80 h-80 bg-emerald-500/10 rounded-full blur-3xl group-hover:bg-emerald-500/20 transition-all pointer-events-none" />
              
              <div className="relative z-10 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-8">
                <div className="max-w-3xl">
                  <div className="flex flex-wrap items-center gap-2.5 mb-4">
                    <span className="px-2.5 py-1 rounded bg-emerald-500 text-zinc-950 font-bold font-mono text-[10px] uppercase tracking-wider flex items-center gap-1.5 shadow-md shadow-emerald-500/30">
                      <Sparkles size={12} />
                      FEATURED MASTERCLASS
                    </span>
                    <span className="px-2.5 py-1 rounded bg-zinc-800/80 border border-zinc-700 text-zinc-300 font-mono text-[10px] uppercase tracking-wider flex items-center gap-1">
                      {getCategoryIcon(featuredPost.tag)}
                      {featuredPost.tag}
                    </span>
                    <span className="text-xs font-mono text-emerald-400">
                      ⚡ {(featuredPost.views ?? 0).toLocaleString()} Views
                    </span>
                  </div>

                  <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-white group-hover:text-emerald-300 transition-colors leading-tight mb-3">
                    {featuredPost.title}
                  </h2>
                  <p className="text-zinc-300 text-sm sm:text-base leading-relaxed mb-6">
                    {featuredPost.excerpt}
                  </p>

                  <div className="flex flex-wrap items-center gap-4 text-xs font-mono text-zinc-400">
                    <span>
                      <strong className="text-zinc-200">Author:</strong> {featuredPost.author}
                    </span>
                    <span>•</span>
                    <span>
                      <strong className="text-zinc-200">Date:</strong> {featuredPost.date}
                    </span>
                    <span>•</span>
                    <span>
                      <strong className="text-zinc-200">Duration:</strong> {featuredPost.readingTime}
                    </span>
                  </div>
                </div>

                <div className="shrink-0 flex flex-col sm:flex-row lg:flex-col gap-3 w-full lg:w-auto">
                  <Link
                    href={`/post/${featuredPost.slug}`}
                    className="inline-flex items-center justify-center gap-2 px-6 py-3.5 bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-bold rounded-xl text-sm transition-all shadow-lg shadow-emerald-500/25 hover:shadow-emerald-500/40 hover:-translate-y-0.5 cursor-pointer"
                  >
                    <span>Launch Masterclass</span>
                    <ArrowRight size={16} />
                  </Link>
                  <Link
                    href="/lab"
                    className="inline-flex items-center justify-center gap-2 px-6 py-3.5 bg-zinc-800/80 hover:bg-zinc-700/80 border border-zinc-700 text-zinc-200 hover:text-white font-mono rounded-xl text-xs transition-colors"
                  >
                    <span>Open Logic Lab ↗</span>
                  </Link>
                </div>
              </div>
            </div>
          </section>
        )}

        {/* Filter and Search Bar */}
        <div className="mb-8 space-y-4">
          <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
            {/* Search Input */}
            <div className="relative flex-1 max-w-md">
              <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-zinc-500">
                <Search size={16} />
              </span>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search schematics, tags, or concepts (e.g. PID, Conveyor, Safety)..."
                className="w-full pl-10 pr-4 py-2.5 bg-zinc-900/80 border border-zinc-800 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 rounded-xl text-sm text-white placeholder-zinc-500 outline-none transition-all"
              />
            </div>

            {/* Sort Dropdown */}
            <div className="flex items-center gap-3">
              <span className="text-xs font-mono text-zinc-400 flex items-center gap-1.5 shrink-0">
                <SlidersHorizontal size={14} />
                Sort:
              </span>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="bg-zinc-900/80 border border-zinc-800 text-xs font-mono text-zinc-200 rounded-xl px-3 py-2 outline-none focus:border-emerald-500"
              >
                <option value="views">Most Read (Views)</option>
                <option value="date">Newest First</option>
                <option value="readingTime">Shortest Read</option>
                <option value="title">Alphabetical (A-Z)</option>
              </select>
            </div>
          </div>

          {/* Category Tabs */}
          <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
            {CATEGORIES.map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setSelectedCategory(cat)}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-mono whitespace-nowrap transition-all cursor-pointer ${
                  selectedCategory === cat
                    ? 'bg-emerald-500 text-zinc-950 font-bold shadow-md shadow-emerald-500/20'
                    : 'bg-zinc-900/60 border border-zinc-800 text-zinc-400 hover:text-white hover:border-zinc-700'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Results Counter */}
        <div className="mb-6 flex items-center justify-between text-xs font-mono text-zinc-400 border-b border-zinc-800/60 pb-3">
          <span>
            SHOWING <strong className="text-white">{sortedPosts.length}</strong> OF{' '}
            <strong className="text-white">{posts.length}</strong> SCHEMATICS
          </span>
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="text-emerald-400 hover:text-emerald-300 underline"
            >
              Clear search filter
            </button>
          )}
        </div>

        {/* Blog Post Grid */}
        {sortedPosts.length === 0 ? (
          <div className="py-20 text-center rounded-2xl border border-dashed border-zinc-800 bg-zinc-950/40 p-8">
            <Cpu size={36} className="mx-auto text-zinc-600 mb-3" />
            <h3 className="text-lg font-bold text-zinc-300 font-serif">No Schematics Found</h3>
            <p className="text-xs text-zinc-500 mt-1 max-w-sm mx-auto">
              No articles match your search criteria. Try clearing search filters or choosing a different category.
            </p>
            <button
              onClick={() => {
                setSearchQuery('');
                setSelectedCategory('All Topics');
              }}
              className="mt-4 px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-white text-xs font-mono rounded-lg transition-colors"
            >
              Reset All Filters
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {sortedPosts.map((post, i) => (
              <Link
                key={post.slug}
                href={`/post/${post.slug}`}
                className="group relative flex flex-col justify-between bg-zinc-900/40 backdrop-blur-sm border border-zinc-800 hover:border-zinc-700 rounded-xl p-6 transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_12px_30px_-10px_rgba(34,197,94,0.15)] overflow-hidden"
              >
                {/* Accent line on hover */}
                <div className="absolute top-0 left-0 right-0 h-1 bg-transparent group-hover:bg-gradient-to-r group-hover:from-emerald-500 group-hover:to-cyan-400 transition-all duration-300" />

                <div>
                  {/* Top metadata badge row */}
                  <div className="flex items-center justify-between gap-2 mb-4">
                    <span className="flex items-center gap-1.5 px-2 py-0.5 rounded bg-zinc-800/80 border border-zinc-700/60 font-mono text-[10px] uppercase tracking-wider text-zinc-300">
                      {getCategoryIcon(post.tag)}
                      {post.tag}
                    </span>
                    <span className="font-mono text-[10px] text-emerald-400 bg-emerald-950/40 border border-emerald-500/20 px-2 py-0.5 rounded font-semibold">
                      ⚡ {(post.views ?? 0).toLocaleString()}
                    </span>
                  </div>

                  {/* Title & Excerpt */}
                  <h3 className="text-xl font-bold text-zinc-100 group-hover:text-emerald-300 transition-colors leading-snug mb-3">
                    {post.title}
                  </h3>
                  <p className="text-zinc-400 text-xs sm:text-sm line-clamp-3 leading-relaxed mb-6">
                    {post.excerpt}
                  </p>
                </div>

                {/* Footer metadata */}
                <div className="pt-4 border-t border-zinc-800/70 flex items-center justify-between font-mono text-[11px] text-zinc-500">
                  <div className="truncate max-w-[170px]">
                    <span className="text-zinc-600">&gt;</span> {post.author}
                  </div>
                  <div className="flex items-center gap-2 text-zinc-400 group-hover:text-emerald-400 transition-colors shrink-0">
                    <span>{post.readingTime}</span>
                    <span className="transform group-hover:translate-x-1 transition-transform">→</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}

        {/* Bottom Authoring & Lab CTA */}
        <section className="mt-16 pt-12 border-t border-zinc-800 grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="p-6 rounded-2xl border border-zinc-800 bg-zinc-950/60 flex items-start gap-4">
            <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 shrink-0">
              <PenTool size={22} />
            </div>
            <div>
              <h4 className="text-base font-bold text-white font-serif">Share an Automation Schematic</h4>
              <p className="text-xs text-zinc-400 mt-1 leading-relaxed">
                Have a proven PLC pattern or industrial control case study? Import JSON or write directly in the AutomationHub Studio.
              </p>
              <Link
                href="/write"
                className="mt-3 inline-flex items-center gap-1.5 text-xs font-mono text-emerald-400 hover:text-emerald-300 font-semibold"
              >
                Open Authoring Studio <ArrowRight size={13} />
              </Link>
            </div>
          </div>

          <div className="p-6 rounded-2xl border border-zinc-800 bg-zinc-950/60 flex items-start gap-4">
            <div className="w-12 h-12 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400 shrink-0">
              <BookOpen size={22} />
            </div>
            <div>
              <h4 className="text-base font-bold text-white font-serif">Engineering Journal Fieldnotes</h4>
              <p className="text-xs text-zinc-400 mt-1 leading-relaxed">
                Review fundamental scan-cycle dynamics, relay ladder logic principles, and analog signal conditioning notes.
              </p>
              <Link
                href="/journal"
                className="mt-3 inline-flex items-center gap-1.5 text-xs font-mono text-cyan-400 hover:text-cyan-300 font-semibold"
              >
                Read Workbench Notes <ArrowRight size={13} />
              </Link>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
