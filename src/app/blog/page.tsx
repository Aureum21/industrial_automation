'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function BlogRedirect() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/blogs');
  }, [router]);

  return (
    <div className="min-h-screen bg-[#070b14] flex items-center justify-center text-zinc-400 font-mono text-xs">
      Navigating to Schematics &amp; Blogs Directory...
    </div>
  );
}
