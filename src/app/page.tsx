'use client';

import React, { useState, useMemo, useEffect } from 'react';
import Link from 'next/link';
import {
  Cpu,
  ArrowRight,
  ExternalLink,
  ShieldCheck,
  Activity,
  Layers,
  Zap,
  CheckCircle2,
  Terminal,
  BookOpen,
  Sparkles,
} from 'lucide-react';
import { BLOG_POSTS, AUTHOR_NAME, AUTHOR_LINKEDIN, type BlogPost } from '@/lib/mockPosts';
import { getAllPosts, syncArticlesFromCloud } from '@/lib/blogStorage';
import InlineLab from '@/components/lab/InlineLab';

export default function Home() {
  const [posts, setPosts] = useState<BlogPost[]>(BLOG_POSTS);

  useEffect(() => {
    setPosts(getAllPosts());

    // Fetch live actual read counts and synced articles from Neon DB
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

  const totalReads = useMemo(() => {
    return posts.reduce((sum, p) => sum + (p.views || 1), 0);
  }, [posts]);

  // Interactive Hero Demo Circuit (Start/Stop with Dry Suction Permissive)
  const heroCircuitDsl = `circuit "Intake Permissive Interlock" version 1 {
  start_btn: INPUT(label="Start Pushbutton", value=true)
  stop_btn: INPUT(label="E-Stop / Stop", value=false)
  permissive_suction: INPUT(label="LSL-101 Suction OK", value=true)
  motor_latch: RS_LATCH()
  safety_gate: AND()
  pump_contactor: OUTPUT(label="P-101A Motor Run")

  start_btn.Q -> motor_latch.S
  stop_btn.Q -> motor_latch.R
  motor_latch.Q -> safety_gate.A
  permissive_suction.Q -> safety_gate.B
  safety_gate.Q -> pump_contactor.A
}`;

  return (
    <main className="bg-[#fbfbfd] min-h-screen text-[#1d1d1f] font-sans antialiased selection:bg-[#0071e3]/15 selection:text-[#0071e3]">
      {/* 1. HERO SECTION (Apple Cupertino Clean Aesthetic) */}
      <section className="pt-16 pb-20 px-5 sm:px-8 border-b border-[#e5e5ea] overflow-hidden relative">
        <div className="max-w-5xl mx-auto text-center">
          {/* Subtle Tag Pill */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#f5f5f7] border border-[#e5e5ea] text-xs font-mono font-medium text-[#1d1d1f] mb-6 shadow-2xs">
            <span className="w-2 h-2 rounded-full bg-[#059669] animate-pulse" />
            <span>INDUSTRIAL SCADA &amp; DETERMINISTIC CONTROLS</span>
          </div>

          {/* Hero Headline */}
          <h1 className="text-4xl sm:text-6xl md:text-7xl font-bold tracking-tight text-[#1d1d1f] leading-[1.08] mb-6">
            Deterministic Control Logic.
            <br />
            <span className="text-[#86868b]">Engineered for Real Plants.</span>
          </h1>

          {/* Subtitle */}
          <p className="max-w-2xl mx-auto text-lg sm:text-xl text-[#515154] leading-relaxed mb-10 font-normal">
            Interactive Function Block Diagrams, closed-loop process simulations, and fail-safe interlocks — authored for modern electrical and controls engineers.
          </p>

          {/* Call to Actions */}
          <div className="flex flex-wrap items-center justify-center gap-3.5">
            <Link
              href="/blogs"
              className="px-6 py-3 rounded-full bg-[#0071e3] hover:bg-[#0077ed] text-white font-medium text-sm transition-all shadow-sm hover:shadow-md flex items-center gap-2"
            >
              <span>Explore 10 Masterclasses</span>
              <ArrowRight size={15} />
            </Link>
            <Link
              href="/lab"
              className="px-6 py-3 rounded-full bg-white hover:bg-[#f5f5f7] border border-[#d2d2d7] text-[#1d1d1f] font-medium text-sm transition-all shadow-2xs flex items-center gap-2"
            >
              <Cpu size={16} className="text-[#059669]" />
              <span>Launch Logic Lab</span>
            </Link>
          </div>

          {/* Platform Metrics Bar */}
          <div className="mt-12 flex flex-wrap items-center justify-center gap-6 sm:gap-12 text-xs font-mono text-[#86868b] pt-8 border-t border-[#e5e5ea]/80">
            <div>
              <strong className="text-[#1d1d1f] text-sm">10</strong> MASTERCLASSES
            </div>
            <div>•</div>
            <div>
              <strong className="text-[#1d1d1f] text-sm">30</strong> INTERACTIVE FBD LABS
            </div>
            <div>•</div>
            <div>
              <strong className="text-[#059669] text-sm">⚡ {totalReads}</strong> PLATFORM READS
            </div>
            <div>•</div>
            <div>
              <strong className="text-[#1d1d1f] text-sm">100%</strong> FREE &amp; OPEN
            </div>
          </div>
        </div>

        {/* Live Interactive Hero Hardware Simulator */}
        <div className="max-w-4xl mx-auto mt-14">
          <div className="text-center mb-3">
            <span className="text-xs font-mono font-medium text-[#86868b] uppercase tracking-wider">
              [ LIVE HARDWARE SIMULATION · TOGGLE INPUTS BELOW ]
            </span>
          </div>
          <InlineLab
            dsl={heroCircuitDsl}
            title="Intake Permissive Interlock (Try toggling LSL-101 Suction)"
            step="INTERACTIVE DEMO"
            height={460}
          />
        </div>
      </section>

      {/* 2. THE THREE ENGINEERING PILLARS */}
      <section className="py-20 px-5 sm:px-8 bg-[#f5f5f7] border-b border-[#e5e5ea]">
        <div className="max-w-6xl mx-auto">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-[#1d1d1f] mb-4">
              Built on First-Principles Control Theory
            </h2>
            <p className="text-base sm:text-lg text-[#86868b]">
              Every masterclass is structured to diagnose real catastrophic failures, calculate engineering tolerances, and implement verified logic.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-8 rounded-2xl bg-white border border-[#e5e5ea] shadow-xs">
              <span className="w-10 h-10 rounded-xl bg-[#0071e3]/10 text-[#0071e3] flex items-center justify-center mb-5">
                <Cpu size={20} />
              </span>
              <h3 className="text-lg font-bold text-[#1d1d1f] mb-2 tracking-tight">
                Deterministic Execution
              </h3>
              <p className="text-sm text-[#515154] leading-relaxed">
                Single-scan cycle evaluation guarantees that race conditions, contact bounce, and feedback loops are handled without ambiguous simulation timing drift.
              </p>
            </div>

            <div className="p-8 rounded-2xl bg-white border border-[#e5e5ea] shadow-xs">
              <span className="w-10 h-10 rounded-xl bg-[#059669]/10 text-[#059669] flex items-center justify-center mb-5">
                <Activity size={20} />
              </span>
              <h3 className="text-lg font-bold text-[#1d1d1f] mb-2 tracking-tight">
                P&amp;ID Incident Case Studies
              </h3>
              <p className="text-sm text-[#515154] leading-relaxed">
                From municipal cavitation blowouts to $240,000 hydraulic press amputations, every schematic starts with a real-world root cause failure analysis.
              </p>
            </div>

            <div className="p-8 rounded-2xl bg-white border border-[#e5e5ea] shadow-xs">
              <span className="w-10 h-10 rounded-xl bg-[#dc2626]/10 text-[#dc2626] flex items-center justify-center mb-5">
                <ShieldCheck size={20} />
              </span>
              <h3 className="text-lg font-bold text-[#1d1d1f] mb-2 tracking-tight">
                Hardware Safety Failsafes
              </h3>
              <p className="text-sm text-[#515154] leading-relaxed">
                Learn why software loops cannot replace physical safety relays, implementing strict ISO 13851 Category 4 / PL e dual-channel monitored architectures.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 3. THE 10 MASTERCLASSES ARCHIVE */}
      <section className="py-20 px-5 sm:px-8 border-b border-[#e5e5ea]">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-12">
            <div>
              <div className="text-xs font-mono text-[#0071e3] font-semibold uppercase tracking-wider mb-2">
                COMPLETE CURRICULUM
              </div>
              <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-[#1d1d1f]">
                Published Masterclasses
              </h2>
            </div>
            <Link
              href="/blogs"
              className="text-xs font-mono font-medium text-[#0071e3] hover:text-[#0077ed] inline-flex items-center gap-1"
            >
              <span>View Searchable Directory</span>
              <ArrowRight size={13} />
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {posts.map((post) => (
              <Link
                key={post.slug}
                href={`/post/${post.slug}`}
                className="group p-7 rounded-2xl bg-white border border-[#e5e5ea] hover:border-[#d2d2d7] hover:shadow-lg transition-all duration-300 flex flex-col justify-between"
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
        </div>
      </section>

      {/* 4. AUTHOR SPOTLIGHT (Personal Brand / LinkedIn) */}
      <section className="py-20 px-5 sm:px-8 bg-white border-b border-[#e5e5ea]">
        <div className="max-w-4xl mx-auto p-8 sm:p-12 rounded-3xl bg-[#f5f5f7] border border-[#e5e5ea] flex flex-col sm:flex-row items-center gap-8 shadow-xs">
          <div className="w-24 h-24 rounded-full bg-[#1d1d1f] text-white flex items-center justify-center font-bold text-2xl font-mono shrink-0 shadow-md">
            AW
          </div>
          <div className="flex-1 text-center sm:text-left">
            <div className="text-xs font-mono uppercase tracking-widest text-[#059669] font-bold mb-1.5">
              LEAD AUTHOR &amp; RESEARCHER
            </div>
            <h3 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#1d1d1f] mb-2">
              Alazar Wake Kore
            </h3>
            <p className="text-sm text-[#515154] leading-relaxed mb-4">
              Electrical Engineering Technology Senior at Higher Colleges of Technology (UAE) specializing in deterministic PLC logic, SCADA safety interlocks, and closed-loop process control.
            </p>
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-3">
              <a
                href={AUTHOR_LINKEDIN}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-[#1d1d1f] hover:bg-black text-white text-xs font-medium transition shadow-xs"
              >
                <span>Connect on LinkedIn</span>
                <ExternalLink size={13} />
              </a>
              <Link
                href="/write"
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-white hover:bg-[#e5e5ea] border border-[#d2d2d7] text-[#1d1d1f] text-xs font-medium transition shadow-2xs"
              >
                <span>Open Author Studio</span>
                <ArrowRight size={13} />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* 5. MINIMALIST APPLE FOOTER */}
      <footer className="py-12 px-5 sm:px-8 text-xs text-[#86868b] font-sans">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="w-5 h-5 rounded-md bg-[#1d1d1f] text-white flex items-center justify-center text-[10px] font-bold font-mono">
              ⚡
            </span>
            <span className="font-semibold text-[#1d1d1f]">AutomationHub</span>
            <span>—</span>
            <span>Industrial Control Systems Education</span>
          </div>
          <div className="flex items-center gap-4 font-mono text-[11px]">
            <a href={AUTHOR_LINKEDIN} target="_blank" rel="noopener noreferrer" className="hover:text-[#1d1d1f]">
              LinkedIn
            </a>
            <span>•</span>
            <Link href="/blogs" className="hover:text-[#1d1d1f]">
              Archive
            </Link>
            <span>•</span>
            <Link href="/lab" className="hover:text-[#1d1d1f]">
              Logic Lab
            </Link>
          </div>
        </div>
      </footer>
    </main>
  );
}
