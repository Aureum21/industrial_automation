'use client';
import { useState } from 'react';
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

          {/* Basement 1 (B1) - Blog/Library */}
          <div className="h-screen w-full bg-white text-gray-900 p-8 overflow-y-auto">
            <div className="max-w-4xl mx-auto py-12 pb-32">
              <h2 className="text-4xl font-bold mb-10 border-b pb-4">Library & Articles</h2>
              <div className="flex flex-col gap-8">
                {BLOG_POSTS.map(article => (
                  <Link key={article.slug} href={`/post/${article.slug}`} className="group block border border-gray-100 p-6 rounded-xl hover:shadow-lg transition bg-white relative z-10 cursor-pointer">
                    <h3 className="text-2xl font-bold mb-2 group-hover:text-green-600">{article.title}</h3>
                    <p className="text-gray-600 mb-4">{article.excerpt}</p>
                    <div className="flex gap-4 text-sm text-gray-400">
                      <span>{article.author}</span>
                      <span>{article.date}</span>
                      <span className="bg-gray-100 rounded-full px-3 py-1 text-gray-600 text-[10px] uppercase font-bold">{article.tag}</span>
                    </div>
                  </Link>
                ))}
              </div>
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
