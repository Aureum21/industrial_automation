'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Edit, LogOut, User as UserIcon, Cpu } from 'lucide-react';
import { getCurrentUser, clearCurrentUser, AUTH_CHANGE_EVENT, type User } from '@/lib/auth';

export default function SiteHeader() {
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    setUser(getCurrentUser());

    const handleAuthChange = (e: Event) => {
      const customEvent = e as CustomEvent<User | null>;
      setUser(customEvent.detail ?? getCurrentUser());
    };

    window.addEventListener(AUTH_CHANGE_EVENT, handleAuthChange);
    window.addEventListener('storage', () => setUser(getCurrentUser()));

    return () => {
      window.removeEventListener(AUTH_CHANGE_EVENT, handleAuthChange);
    };
  }, []);

  const handleSignOut = () => {
    clearCurrentUser();
    setUser(null);
  };

  return (
    <header className="sticky top-0 z-50 bg-white border-b border-gray-200">
      <div className="mx-auto flex h-[64px] max-w-7xl items-center justify-between px-5 sm:px-8">
        <div className="flex items-center gap-4">
          <Link href="/" className="text-2xl font-bold tracking-tighter text-black font-serif">
            AutomationHub
          </Link>
        </div>

        <nav className="flex items-center gap-3 sm:gap-5">
          <Link
            href="/library"
            className="text-sm font-medium text-gray-700 hover:text-black transition"
          >
            Library
          </Link>

          <Link
            href="/lab"
            className="hidden sm:inline-flex items-center gap-1.5 text-sm font-medium text-gray-700 hover:text-black transition"
          >
            <Cpu size={15} className="text-emerald-600" />
            <span>Logic Lab</span>
          </Link>

          <Link
            href="/write"
            className="flex items-center gap-1.5 text-sm text-gray-600 hover:text-black transition"
          >
            <Edit size={16} strokeWidth={1.5} />
            <span className="hidden sm:inline">Write</span>
          </Link>

          {user ? (
            <div className="flex items-center gap-2">
              <Link
                href="/signin"
                className="flex items-center gap-2 text-xs font-mono text-gray-800 bg-gray-100 hover:bg-gray-200 border border-gray-300 px-3 py-1.5 rounded-full transition"
                title={`Station User: ${user.name} (${user.role})`}
              >
                <span className="w-5 h-5 rounded-full bg-emerald-500 text-zinc-950 font-bold flex items-center justify-center text-[10px]">
                  {user.avatar || 'EN'}
                </span>
                <span className="hidden sm:inline font-sans font-medium text-xs">
                  {user.name.split(' ')[0]}
                </span>
              </Link>
              <button
                onClick={handleSignOut}
                className="text-gray-400 hover:text-red-600 transition p-1"
                title="Sign out of station"
                type="button"
              >
                <LogOut size={16} />
              </button>
            </div>
          ) : (
            <Link
              href="/signin"
              className="text-sm text-gray-600 hover:text-black transition"
            >
              Sign In
            </Link>
          )}

          <Link
            href="/blogs"
            className="rounded-full bg-black px-4 py-2 text-sm font-medium text-white transition hover:bg-gray-800 shadow-sm"
          >
            Blogs
          </Link>
        </nav>
      </div>
    </header>
  );
}
