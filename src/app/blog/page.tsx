'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function BlogRedirect() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/blogs');
  }, [router]);

  return (
    <div className="min-h-screen bg-[#fbfbfd] flex items-center justify-center text-[#86868b] font-mono text-xs">
      Navigating to Schematics &amp; Blogs Directory...
    </div>
  );
}
