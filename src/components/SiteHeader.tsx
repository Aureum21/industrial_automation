import Link from 'next/link';
import { Edit } from 'lucide-react';

export default function SiteHeader() {
  return (
    <header className="sticky top-0 z-50 bg-white border-b border-gray-200">
      <div className="mx-auto flex h-[64px] max-w-7xl items-center justify-between px-5 sm:px-8">
        <div className="flex items-center gap-4">
          <Link href="/" className="text-2xl font-bold tracking-tighter text-black font-serif">
            AutomationHub
          </Link>
        </div>

        <nav className="flex items-center gap-6">
          <Link href="/write" className="flex items-center gap-2 text-sm text-gray-600 hover:text-black transition">
            <Edit size={18} strokeWidth={1.5} />
            Write
          </Link>
          <Link href="/signin" className="text-sm text-gray-600 hover:text-black transition">
            Sign In
          </Link>
          <Link href="/signup" className="rounded-full bg-black px-4 py-2 text-sm font-medium text-white transition hover:bg-gray-800">
            Get started
          </Link>
        </nav>
      </div>
    </header>
  );
}
