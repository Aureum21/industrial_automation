'use client';

import React, { useState, useMemo, useEffect } from 'react';
import Link from 'next/link';
import {
  Search,
  BookOpen,
  Cpu,
  Layers,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  Activity,
  Wind,
  Sun,
  Zap,
  CheckCircle2,
} from 'lucide-react';
import { BLOG_POSTS, AUTHOR_LINKEDIN, type BlogPost } from '@/lib/mockPosts';
import { getAllPosts, syncArticlesFromCloud } from '@/lib/blogStorage';

type CategoryFilter =
  | 'All Topics'
  | 'Process Control'
  | 'Control Systems'
  | 'Intermediate'
  | 'Safety'
  | 'Safety / ESD'
  | 'HVAC / Climate'
  | 'Renewables / IoT';

const CATEGORIES: CategoryFilter[] = [
  'All Topics',
  'Process Control',
  'Control Systems',
  'Intermediate',
  'Safety',
  'Safety / ESD',
  'HVAC / Climate',
  'Renewables / IoT',
];

export default function BlogsPage() {
  const [posts, setPosts] = useState<BlogPost[]>(BLOG_POSTS);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<CategoryFilter>('All Topics');
  const [sortBy, setSortBy] = useState<'views' | 'date' | 'readingTime' | 'title'>('views');

  useEffect(() => {
    setPosts(getAllPosts());

    // Fetch live actual read counts from Neon PostgreSQL database
    fetch('/api/views')
      .then((res) => res.json())
      .then((data) => {
        if (data.ok && data.views) {
          setPosts((prev) =>
            prev.map((p) => ({
              ...p,
              views: data.views[p.slug] !== undefined ? data.views[p.slug] : p.views,
            }))
          );
        }
      })
      .catch(() => {});

    syncArticlesFromCloud().then((cloudPosts) => {
      if (cloudPosts.length > 0) {
        setPosts(getAllPosts());
      }
    });
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
      if (selectedCategory === 'Safety' && (post.tag.includes('Safety') || post.tag.includes('ESD'))) return true;
      return post.tag.toLowerCase() === selectedCategory.toLowerCase();
    });
  }, [posts, searchQuery, selectedCategory]);

  // Sort posts
  const sortedPosts = useMemo(() => {
    return [...filteredPosts].sort((a, b) => {
      if (sortBy === 'views') {
        return (b.views ?? 0) - (a.views ?? 0);
      }
      if (sortBy === 'date') {
        return b.date.localeCompare(a.date);
      }
      if (sortBy === 'readingTime') {
        const aMin = parseInt(a.readingTime) || 10;
        const bMin = parseInt(b.readingTime) || 10;
        return aMin - bMin;
      }
      if (sortBy === 'title') {
        return a.title.localeCompare(b.title);
      }
      return 0;
    });
  }, [filteredPosts, sortBy]);

  // Featured post: most read
  const featuredPost = useMemo(() => {
    if (selectedCategory !== 'All Topics' || searchQuery.trim()) return null;
    return [...posts].sort((a, b) => (b.views ?? 0) - (a.views ?? 0))[0];
  }, [posts, selectedCategory, searchQuery]);

  const totalViews = useMemo(() => {
    return posts.reduce((acc, p) => acc + (p.views ?? 0), 0);
  }, [posts]);

  return (
    <main className="bg-[#fbfbfd] min-h-screen text-[#1d1d1f] font-sans antialiased pb-32 selection:bg-[#0071e3]/15 selection:text-[#0071e3]">
      <div className="max-w-6xl mx-auto px-5 sm:px-8 pt-12 sm:pt-16">
        {/* Header Hero Section */}
        <header className="mb-12 border-b border-[#e5e5ea] pb-10">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#f5f5f7] border border-[#e5e5ea] text-[#0071e3] font-mono text-xs uppercase tracking-wider mb-4 font-semibold">
                <Cpu size={14} />
                <span>AutomationHub // Curated Masterclasses</span>
              </div>
              <h1 className="text-3xl sm:text-5xl font-bold tracking-tight text-[#1d1d1f] leading-tight">
                Industrial Logic &amp; Controls <br />
                <span className="text-[#86868b] font-normal">Schematics Archive</span>
              </h1>
              <p className="mt-3 max-w-2xl text-base text-[#515154] leading-relaxed">
                Explore real plant failure post-mortems, deterministic Function Block Diagram (FBD) architectures, and interactive simulation labs verified on the browser engine.
              </p>
            </div>

            {/* Quick Metrics Bar */}
            <div className="flex items-center gap-3 bg-white border border-[#e5e5ea] p-3 sm:p-4 rounded-2xl shadow-2xs font-mono shrink-0">
              <div className="text-center px-3">
                <div className="text-lg sm:text-xl font-bold text-[#1d1d1f]">{posts.length}</div>
                <div className="text-[10px] text-[#86868b] uppercase tracking-wider">Schematics</div>
              </div>
              <div className="h-8 w-[1px] bg-[#e5e5ea]" />
              <div className="text-center px-3">
                <div className="text-lg sm:text-xl font-bold text-[#059669]">
                  ⚡ {totalViews}
                </div>
                <div className="text-[10px] text-[#86868b] uppercase tracking-wider">Total Reads</div>
              </div>
              <div className="h-8 w-[1px] bg-[#e5e5ea]" />
              <div className="text-center px-3">
                <div className="text-lg sm:text-xl font-bold text-[#0071e3]">100%</div>
                <div className="text-[10px] text-[#86868b] uppercase tracking-wider">Interactive</div>
              </div>
            </div>
          </div>
        </header>

        {/* Featured Masterclass Card */}
        {featuredPost && (
          <section className="mb-14">
            <div className="rounded-3xl border border-[#e5e5ea] bg-white p-6 sm:p-10 shadow-sm hover:shadow-lg hover:border-[#d2d2d7] transition-all duration-300">
              <div className="flex flex-wrap items-center gap-2.5 mb-4">
                <span className="px-3 py-1 rounded-full bg-[#1d1d1f] text-white font-mono text-[10px] uppercase tracking-wider font-semibold flex items-center gap-1.5 shadow-xs">
                  <Sparkles size={11} className="text-emerald-400" />
                  FEATURED MASTERCLASS
                </span>
                <span className="px-3 py-1 rounded-full bg-[#f5f5f7] border border-[#e5e5ea] text-[#1d1d1f] font-mono text-[10px] uppercase tracking-wider font-medium">
                  {featuredPost.tag}
                </span>
                <span className="text-xs font-mono text-[#059669] font-medium">
                  ⚡ {featuredPost.views ?? 0} {(featuredPost.views ?? 0) === 1 ? 'read' : 'reads'}
                </span>
              </div>

              <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-[#1d1d1f] leading-tight mb-4 tracking-tight">
                {featuredPost.title}
              </h2>
              <p className="text-[#515154] text-base sm:text-lg leading-relaxed mb-6 font-normal">
                {featuredPost.excerpt}
              </p>

              <div className="pt-6 border-t border-[#f5f5f7] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <span className="text-xs text-[#86868b] font-medium">
                    Authored by{' '}
                    <a
                      href={AUTHOR_LINKEDIN}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[#1d1d1f] hover:text-[#0071e3] font-semibold underline decoration-dotted"
                    >
                      Alazar Wake Kore (HCT Senior) ↗
                    </a>
                  </span>
                  <span className="text-[#d2d2d7]">•</span>
                  <span className="text-xs font-mono text-[#86868b]">{featuredPost.date}</span>
                </div>

                <Link
                  href={`/post/${featuredPost.slug}`}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-[#0071e3] hover:bg-[#0077ed] text-white font-medium text-xs transition shadow-xs self-start sm:self-auto"
                >
                  <span>Launch Masterclass</span>
                  <ArrowRight size={13} />
                </Link>
              </div>
            </div>
          </section>
        )}

        {/* Search & Filter Toolbar (Apple Segmented Style) */}
        <section className="mb-10">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
            {/* Apple Pill Search Input */}
            <div className="relative flex-1 max-w-md">
              <Search
                size={16}
                className="absolute left-4 top-1/2 -translate-y-1/2 text-[#86868b] pointer-events-none"
              />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search masterclasses by keyword, P&ID tag, topic..."
                className="w-full pl-11 pr-10 py-2.5 rounded-full bg-white border border-[#e5e5ea] text-sm text-[#1d1d1f] placeholder-[#86868b] focus:border-[#0071e3] focus:ring-2 focus:ring-[#0071e3]/10 outline-none transition shadow-2xs"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-mono text-[#86868b] hover:text-[#1d1d1f]"
                >
                  ✕
                </button>
              )}
            </div>

            {/* Sort selector */}
            <div className="flex items-center gap-2">
              <span className="text-xs text-[#86868b] font-medium font-sans">Sort by:</span>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as 'views' | 'date' | 'readingTime' | 'title')}
                className="px-3.5 py-2 rounded-full bg-white border border-[#e5e5ea] text-xs font-mono text-[#1d1d1f] focus:border-[#0071e3] outline-none cursor-pointer shadow-2xs"
              >
                <option value="views">Most Read (Live Views)</option>
                <option value="date">Publish Date (Recent)</option>
                <option value="readingTime">Duration</option>
                <option value="title">Alphabetical (A-Z)</option>
              </select>
            </div>
          </div>

          {/* Topic Pills Filter */}
          <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
            {CATEGORIES.map((cat) => {
              const isSelected = selectedCategory === cat;
              return (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-4 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all shadow-2xs ${
                    isSelected
                      ? 'bg-[#1d1d1f] text-white shadow-xs'
                      : 'bg-white text-[#515154] hover:text-[#1d1d1f] hover:bg-[#f5f5f7] border border-[#e5e5ea]'
                  }`}
                >
                  {cat}
                </button>
              );
            })}
          </div>
        </section>

        {/* Masterclasses Grid */}
        <section>
          {sortedPosts.length === 0 ? (
            <div className="p-12 text-center rounded-3xl bg-white border border-[#e5e5ea]">
              <p className="text-sm text-[#86868b] mb-4">No masterclasses match your search query.</p>
              <button
                onClick={() => {
                  setSearchQuery('');
                  setSelectedCategory('All Topics');
                }}
                className="px-4 py-2 rounded-full bg-[#1d1d1f] text-white text-xs font-medium"
              >
                Reset Filters
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {sortedPosts.map((post) => (
                <Link
                  key={post.slug}
                  href={`/post/${post.slug}`}
                  className="group p-7 rounded-2xl bg-white border border-[#e5e5ea] hover:border-[#d2d2d7] hover:shadow-md transition-all duration-300 flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between gap-2 mb-3">
                      <span className="text-[11px] font-mono font-semibold uppercase px-2.5 py-0.5 rounded-full bg-[#f5f5f7] border border-[#e5e5ea] text-[#1d1d1f]">
                        {post.tag}
                      </span>
                      <div className="flex items-center gap-3 text-[11px] font-mono text-[#86868b]">
                        <span>{post.date}</span>
                        <span className="text-[#059669] font-medium">⚡ {post.views} reads</span>
                      </div>
                    </div>

                    <h3 className="text-lg font-bold text-[#1d1d1f] group-hover:text-[#0071e3] transition-colors leading-snug mb-2.5">
                      {post.title}
                    </h3>
                    <p className="text-xs sm:text-sm text-[#515154] line-clamp-3 leading-relaxed mb-6 font-normal">
                      {post.excerpt}
                    </p>
                  </div>

                  <div className="pt-4 border-t border-[#f5f5f7] flex items-center justify-between text-xs text-[#86868b]">
                    <span
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        window.open(AUTHOR_LINKEDIN, '_blank');
                      }}
                      className="hover:text-[#0071e3] transition truncate max-w-[280px] font-medium"
                      title={post.author}
                    >
                      Alazar Wake Kore (HCT Senior)
                    </span>
                    <span className="font-mono text-[#1d1d1f] group-hover:text-[#0071e3] flex items-center gap-1 font-medium transition-colors">
                      <span>{post.readingTime.split('+')[0]}</span>
                      <span>→</span>
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
