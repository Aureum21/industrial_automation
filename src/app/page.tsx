'use client';
import { useState, useMemo } from 'react';
import Link from 'next/link';
import { BLOG_POSTS } from '@/lib/mockPosts';
import Image from 'next/image';

type Floor = 'G' | 'B1' | 'B2' | 'B3';
type DoorState = 'open' | 'closing' | 'closed' | 'opening';

const FLOOR_INDEX: Record<Floor, number> = { G: 0, B1: 1, B2: 2, B3: 3 };
const FLOORS: Floor[] = ['G', 'B1', 'B2', 'B3'];

export default function Home() {
  const [activeFloor, setActiveFloor] = useState<Floor>('G');
  const [doorState, setDoorState] = useState<DoorState>('open');
  const [isMoving, setIsMoving] = useState(false);
  const [targetFloor, setTargetFloor] = useState<Floor>('G');
  const [showAllArticles, setShowAllArticles] = useState(false);

  const sortedPosts = useMemo(() => {
    return [...BLOG_POSTS].sort((a, b) => (b.views ?? 0) - (a.views ?? 0));
  }, []);

  const visiblePosts = showAllArticles ? sortedPosts : sortedPosts.slice(0, 6);

  const goToFloor = (floor: Floor) => {
    if (floor === activeFloor || doorState !== 'open') return;
    setTargetFloor(floor);
    setDoorState('closing');

    setTimeout(() => {
      setDoorState('closed');
      setIsMoving(true);
      
      // Calculate dynamic duration based on floors traveled. 
      // Base time 1.5s + 0.5s per floor crossed.
      const diff = Math.abs(FLOOR_INDEX[floor] - FLOOR_INDEX[activeFloor]);
      const moveDuration = 1000 + (diff * 500);

      // Trigger the slide
      setActiveFloor(floor);

      setTimeout(() => {
        setIsMoving(false);
        setDoorState('opening');

        setTimeout(() => {
          setDoorState('open');
        }, 1200); 
      }, moveDuration); 
    }, 1200); 
  };

  const leftDoorTransform = (doorState === 'open' || doorState === 'opening') ? 'translateX(-100%)' : 'translateX(0)';
  const rightDoorTransform = (doorState === 'open' || doorState === 'opening') ? 'translateX(100%)' : 'translateX(0)';

  return (
    <main className="w-full h-screen overflow-hidden bg-black relative flex">
      {/* Main Floor View / Elevator Shaft */}
      <div className="flex-1 h-full relative overflow-hidden bg-zinc-950">
        
        <div 
          className="w-full flex flex-col transition-transform ease-in-out"
          style={{ 
            height: '400vh',
            transform: `translateY(-${FLOOR_INDEX[activeFloor] * 25}%)`,
            transitionDuration: isMoving ? `${1000 + Math.abs(FLOOR_INDEX[targetFloor] - FLOOR_INDEX[activeFloor]) * 500}ms` : '0ms'
          }}
        >
          {/* Ground Floor (G) */}
          <div className="h-screen w-full relative flex items-center justify-center text-center">
            <div className="absolute inset-0 z-0">
              <Image src="/hero_bg.jpg" alt="Future of Automation" fill className="object-cover" priority />
              <div className="absolute inset-0 bg-black/60" />
            </div>
            <div className="relative z-10 p-8 max-w-4xl text-white">
              <h1 className="text-6xl md:text-8xl font-serif font-bold tracking-tighter mb-6 shadow-black drop-shadow-xl">AutomationHub</h1>
              <p className="text-xl md:text-3xl font-light text-gray-200 shadow-black drop-shadow-md">The future of industrial logic and AI is here.</p>
            </div>
          </div>

          {/* Basement 1 (B1) - Data Archive (Blog) */}
          <div className="h-screen w-full bg-[#050505] text-gray-200 p-8 overflow-y-auto relative">
            {/* Subtle animated background grid */}
            <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:40px_40px] pointer-events-none" />
            
            <div className="max-w-7xl mx-auto py-16 pb-32 relative z-10">
              <div className="mb-14 flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-zinc-800/80 pb-8">
                <div>
                  <p className="text-green-500 font-mono text-xs tracking-widest mb-2 shadow-green-500/20 drop-shadow-md">
                    [ DIRECTORY ACCESS // RANKED BY READERSHIP ]
                  </p>
                  <h2 className="text-4xl md:text-5xl font-black uppercase tracking-tighter text-white">Schematics Archive</h2>
                  <div className="h-1 w-24 bg-green-500 mt-4 shadow-[0_0_15px_rgba(34,197,94,0.5)]" />
                </div>
                <div className="font-mono text-xs text-zinc-400 bg-zinc-900/60 border border-zinc-800 px-4 py-2 rounded">
                  <span className="text-emerald-400">● SORT:</span> MOST VIEWED FIRST · <span className="text-zinc-200">{visiblePosts.length}</span> OF <span className="text-zinc-200">{sortedPosts.length}</span> SCHEMATICS
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {visiblePosts.map((article, i) => (
                  <Link key={article.slug} href={`/post/${article.slug}`} className="group relative block bg-zinc-900/40 backdrop-blur-sm border border-zinc-800 p-6 hover:bg-zinc-800/60 transition-all duration-300 overflow-hidden hover:-translate-y-1 hover:shadow-[0_10px_30px_-10px_rgba(34,197,94,0.15)] flex flex-col justify-between">
                    
                    {/* Hover Glow Effect */}
                    <div className="absolute top-0 left-0 w-1 h-full bg-zinc-700 group-hover:bg-green-500 transition-colors shadow-[0_0_10px_rgba(34,197,94,0)] group-hover:shadow-[0_0_10px_rgba(34,197,94,0.8)]" />
                    
                    <div>
                      <div className="flex justify-between items-center mb-6 gap-2">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-[10px] text-zinc-500 group-hover:text-green-400 transition-colors">
                            SYS.DOC.{String(i + 1).padStart(3, '0')}
                          </span>
                          <span className="font-mono text-[9px] px-1.5 py-0.5 rounded bg-zinc-800/80 text-zinc-400 border border-zinc-700/60">
                            #{i + 1}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-[10px] text-emerald-400 bg-emerald-950/50 border border-emerald-500/20 px-2 py-0.5 rounded tracking-wider font-semibold">
                            ⚡ {article.views.toLocaleString()} VIEWS
                          </span>
                          <span className="bg-green-500/10 text-green-400 border border-green-500/20 px-2 py-0.5 text-[10px] uppercase font-bold tracking-wider">
                            {article.tag}
                          </span>
                        </div>
                      </div>

                      <h3 className="text-2xl font-bold mb-3 text-zinc-100 group-hover:text-white transition-colors leading-tight">{article.title}</h3>
                      <p className="text-zinc-400 text-sm mb-8 line-clamp-3 group-hover:text-zinc-300 transition-colors">{article.excerpt}</p>
                    </div>
                    
                    <div className="pt-4 border-t border-zinc-800/60 flex items-center justify-between font-mono text-xs text-zinc-500">
                      <div className="flex flex-col gap-1">
                        <span><span className="text-zinc-600">&gt; AUTH:</span> {article.author}</span>
                        <span><span className="text-zinc-600">&gt; DATE:</span> {article.date}</span>
                      </div>
                      <div className="text-right">
                        <span className="text-green-500/0 group-hover:text-green-500 transition-colors mr-2">→</span>
                        {article.readingTime}
                      </div>
                    </div>
                  </Link>
                ))}
              </div>

              {sortedPosts.length > 6 && (
                <div className="mt-14 flex justify-center">
                  <button
                    onClick={() => setShowAllArticles(prev => !prev)}
                    className="group relative inline-flex items-center gap-3 px-8 py-4 bg-zinc-900/90 backdrop-blur-md border border-zinc-700 hover:border-green-500 rounded-sm font-mono text-xs tracking-widest uppercase text-zinc-200 hover:text-white transition-all duration-300 shadow-2xl hover:shadow-[0_0_25px_rgba(34,197,94,0.25)] hover:-translate-y-0.5 cursor-pointer"
                  >
                    <span className="text-green-400 font-bold group-hover:scale-125 transition-transform">
                      {showAllArticles ? '▲' : '▼'}
                    </span>
                    <span>
                      {showAllArticles
                        ? 'COLLAPSE ARCHIVE'
                        : `READ MORE (+${sortedPosts.length - 6} SCHEMATICS)`}
                    </span>
                    <span className="bg-zinc-800 text-zinc-400 border border-zinc-700 px-2 py-0.5 rounded text-[10px] ml-2">
                      {visiblePosts.length} / {sortedPosts.length}
                    </span>
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Basement 2 (B2) - The Lab */}
          <div className="h-screen w-full bg-gray-50 flex items-center justify-center text-center">
            <div className="max-w-2xl p-8 relative z-10">
              <h2 className="text-5xl font-extrabold text-gray-900 mb-6">Enter The Lab</h2>
              <p className="text-xl text-gray-600 mb-10">Start building, simulating, and validating your control logic in a fully interactive visual environment.</p>
              <Link href="/lab" className="inline-block bg-green-600 hover:bg-green-700 text-white font-bold text-lg px-8 py-4 rounded-full transition shadow-xl hover:shadow-2xl transform hover:-translate-y-1">
                Launch Workspace
              </Link>
            </div>
          </div>

          {/* Basement 3 (B3) - Footer/About */}
          <div className="h-screen w-full bg-zinc-900 text-white p-12 flex flex-col justify-between overflow-y-auto">
            <div className="max-w-5xl mx-auto w-full pt-16">
              <h2 className="text-4xl font-bold mb-12">AutomationHub</h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-gray-400">
                <div className="flex flex-col gap-4">
                  <h4 className="text-white font-semibold mb-2">Platform</h4>
                  <Link href="/lab" className="hover:text-white transition">Workspace</Link>
                  <Link href="#" className="hover:text-white transition">HMI Builder</Link>
                  <Link href="#" className="hover:text-white transition">Logic Engine</Link>
                </div>
                <div className="flex flex-col gap-4">
                  <h4 className="text-white font-semibold mb-2">Resources</h4>
                  <button onClick={() => goToFloor('B1')} className="text-left hover:text-white transition">Blog</button>
                  <Link href="#" className="hover:text-white transition">Documentation</Link>
                  <Link href="#" className="hover:text-white transition">Tutorials</Link>
                </div>
                <div className="flex flex-col gap-4">
                  <h4 className="text-white font-semibold mb-2">Company</h4>
                  <Link href="#" className="hover:text-white transition">About Us</Link>
                  <Link href="#" className="hover:text-white transition">Careers</Link>
                  <Link href="#" className="hover:text-white transition">Contact</Link>
                </div>
                <div className="flex flex-col gap-4">
                  <h4 className="text-white font-semibold mb-2">Legal</h4>
                  <Link href="#" className="hover:text-white transition">Privacy Policy</Link>
                  <Link href="#" className="hover:text-white transition">Terms of Service</Link>
                </div>
              </div>
            </div>
            <div className="text-center text-gray-600 mt-24">
              © {new Date().getFullYear()} AutomationHub. All rights reserved.
            </div>
          </div>
        </div>
        
        {/* Elevator Glass Doors overlaying the view */}
        <div 
          className={`absolute top-0 left-0 w-[50.2%] h-full bg-slate-900/40 backdrop-blur-md border-r-2 border-white/20 shadow-[10px_0_30px_rgba(0,0,0,0.5)] z-40 transition-transform duration-[1200ms] ease-in-out ${doorState === 'open' ? 'pointer-events-none' : ''}`}
          style={{ transform: leftDoorTransform }}
        >
           {/* Glass reflections */}
           <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent w-1/2" />
        </div>
        <div 
          className={`absolute top-0 right-0 w-[50.2%] h-full bg-slate-900/40 backdrop-blur-md border-l-2 border-white/20 shadow-[-10px_0_30px_rgba(0,0,0,0.5)] z-40 transition-transform duration-[1200ms] ease-in-out ${doorState === 'open' ? 'pointer-events-none' : ''}`}
          style={{ transform: rightDoorTransform }}
        >
           {/* Glass reflections */}
           <div className="absolute inset-0 bg-gradient-to-l from-transparent via-white/5 to-transparent w-1/2 right-0" />
        </div>
      </div>

      {/* Elevator Control Panel */}
      <div className="w-24 md:w-32 h-full bg-zinc-900 border-l-4 border-zinc-950 z-50 flex flex-col items-center py-12 shadow-2xl shrink-0 relative overflow-hidden">
        {/* Metallic brush texture effect */}
        <div className="absolute inset-0 opacity-10 bg-[repeating-linear-gradient(90deg,transparent,transparent_2px,#fff_2px,#fff_4px)]" />
        
        <div className="relative z-10 bg-black w-16 md:w-20 h-12 md:h-16 rounded mb-8 md:mb-12 flex flex-col items-center justify-center border-2 border-zinc-800 shadow-inner">
          <div className={`text-red-500 font-mono text-2xl md:text-3xl tracking-widest font-bold ${isMoving ? 'animate-pulse' : ''}`}>
            {isMoving ? '...' : activeFloor}
          </div>
        </div>

        <div className="relative z-10 flex flex-col gap-4 md:gap-6">
          {FLOORS.map(floor => (
            <button
              key={floor}
              onClick={() => goToFloor(floor)}
              disabled={doorState !== 'open'}
              className="group relative flex items-center justify-center w-12 md:w-16 h-12 md:h-16 rounded-full bg-zinc-800 border-4 border-zinc-700 shadow-lg hover:border-zinc-500 transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <div className={`absolute inset-1 rounded-full ${targetFloor === floor && doorState !== 'open' ? 'bg-red-500/20' : ''}`} />
              <div className={`absolute inset-1 rounded-full ${activeFloor === floor && doorState === 'open' ? 'bg-green-500/10' : ''}`} />
              <span className={`font-bold font-mono text-lg md:text-xl z-10 ${targetFloor === floor && doorState !== 'open' ? 'text-red-400' : (activeFloor === floor && doorState === 'open' ? 'text-green-400' : 'text-zinc-400 group-hover:text-zinc-200')}`}>
                {floor}
              </span>
            </button>
          ))}
        </div>
        
        <div className="relative z-10 mt-auto text-zinc-500 font-mono text-[10px] tracking-widest text-center">
          CAPACITY<br/>1200 KG
        </div>
      </div>
    </main>
  );
}
