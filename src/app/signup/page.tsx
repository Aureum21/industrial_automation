'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function SignUpRedirect() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/signin?mode=signup');
  }, [router]);

  return (
    <div className="min-h-[calc(100vh-64px)] bg-[#fbfbfd] flex items-center justify-center text-[#86868b] font-mono text-xs">
      Transferring to Engineer Registration Terminal...
    </div>
  );
}
