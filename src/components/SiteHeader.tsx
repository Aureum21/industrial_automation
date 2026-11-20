'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LogOut, Cpu } from 'lucide-react';
import { signOut, useSession } from '@/lib/auth';

export default function SiteHeader() {
  const { user } = useSession();
  const pathname = usePathname();
  const hasUser = Boolean(user);
  // Embedded circuits run inside other sites' iframes: no site chrome.
  if (pathname?.startsWith('/embed')) return null;

  const navLinks = [
    { href: '/challenges', label: 'Challenges' },
    { href: '/lab', label: 'Logic Lab' },
    { href: '/gallery', label: 'Gallery' },
    { href: '/blogs', label: 'Masterclasses' },
    { href: '/library', label: 'Catalog' },
    ...(hasUser ? [{ href: '/write', label: 'Studio' }] : []),
  ];

  return (
    <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-xl border-b border-[#e5e5ea] transition-all">
      <div className="mx-auto flex h-[58px] max-w-7xl items-center justify-between px-5 sm:px-8">
        {/* Brand / Logo */}
        <Link href="/" className="flex items-center gap-2.5 group">
          <span className="w-8 h-8 rounded-xl bg-[#1d1d1f] text-white flex items-center justify-center font-bold shadow-xs group-hover:scale-105 transition-transform">
            <Cpu size={17} className="text-emerald-400" />
          </span>
          <span className="text-lg font-bold tracking-tight text-[#1d1d1f] font-sans">
            AutomationHub
          </span>
        </Link>

        {/* Apple Style Nav Pill Links */}
        <nav className="flex items-center gap-1 sm:gap-2">
          {navLinks.map((link) => {
            const isActive = pathname === link.href || (link.href !== '/' && pathname.startsWith(link.href));
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`px-3.5 py-1.5 rounded-full text-xs font-medium transition-all ${
                  isActive
                    ? 'bg-[#1d1d1f] text-white shadow-xs'
                    : 'text-[#515154] hover:text-[#1d1d1f] hover:bg-[#f5f5f7]'
                }`}
              >
                {link.label}
              </Link>
            );
          })}

          <div className="h-4 w-[1px] bg-[#e5e5ea] mx-1 sm:mx-2" />

          {/* User Authentication Pill */}
          {user ? (
            <div className="flex items-center gap-2">
              <Link
                href="/signin"
                className="flex items-center gap-2 bg-[#f5f5f7] hover:bg-[#e5e5ea] border border-[#e5e5ea] px-3 py-1 rounded-full text-xs font-medium text-[#1d1d1f] transition shadow-xs"
                title={`Signed in as: ${user.name}`}
              >
                <span className="w-5 h-5 rounded-full bg-[#1d1d1f] text-white font-bold flex items-center justify-center text-[10px] font-mono">
                  {user.name.slice(0, 2).toUpperCase()}
                </span>
                <span className="hidden sm:inline font-sans font-medium text-xs">
                  {user.name}
                </span>
              </Link>
              <button
                onClick={() => void signOut()}
                className="text-[#86868b] hover:text-red-600 transition p-1.5 rounded-full hover:bg-[#f5f5f7]"
                title="Sign out of station"
                type="button"
              >
                <LogOut size={14} />
              </button>
            </div>
          ) : (
            <Link
              href="/signin"
              className="px-4 py-1.5 rounded-full bg-[#0071e3] hover:bg-[#0077ed] text-white text-xs font-medium transition shadow-xs"
            >
              Sign In
            </Link>
          )}
        </nav>
      </div>
    </header>
  );
}
