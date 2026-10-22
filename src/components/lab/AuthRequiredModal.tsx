'use client';

import React from 'react';
import Link from 'next/link';
import { ShieldCheck, X, Zap, ArrowRight, Lock } from 'lucide-react';
import { DEMO_USERS, setCurrentUser } from '@/lib/auth';

interface AuthRequiredModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAuthenticated: () => void;
}

export default function AuthRequiredModal({
  isOpen,
  onClose,
  onAuthenticated,
}: AuthRequiredModalProps) {
  if (!isOpen) return null;

  const handleQuickLoginAsAlazar = () => {
    const alazarUser = DEMO_USERS[0];
    setCurrentUser(alazarUser);
    onAuthenticated();
    onClose();
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="auth-modal-title"
      className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-200"
    >
      <div className="relative w-full max-w-md rounded-2xl border border-zinc-700/80 bg-zinc-950 p-6 sm:p-8 shadow-2xl text-zinc-100 shadow-emerald-500/10">
        {/* Close Button */}
        <button
          onClick={onClose}
          aria-label="Close authentication modal"
          className="absolute top-4 right-4 p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition"
        >
          <X size={18} />
        </button>

        {/* Header Icon & Tag */}
        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shadow-[0_0_15px_rgba(16,185,129,0.2)]">
            <ShieldCheck size={24} />
          </div>
          <div>
            <span className="font-mono text-[10px] uppercase tracking-wider text-emerald-400 font-bold block">
              ENGINEER ACCESS GATE
            </span>
            <h3 id="auth-modal-title" className="text-xl font-bold text-white tracking-tight">
              Sign In to Run Simulation
            </h3>
          </div>
        </div>

        {/* Explanatory Text */}
        <div className="text-xs sm:text-sm text-zinc-300 leading-relaxed space-y-2 mb-6">
          <p>
            You are free to <strong>read all articles</strong>, <strong>wire components</strong>, and{' '}
            <strong>inspect schematics</strong> without signing in.
          </p>
          <p className="text-zinc-400 text-xs">
            To start the real-time simulation clock, toggle live signal states, and execute scan cycles,
            please authenticate your station.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="space-y-3">
          {/* Quick 1-Click Authenticate as ALAZAR */}
          <button
            type="button"
            onClick={handleQuickLoginAsAlazar}
            className="w-full flex items-center justify-between px-4 py-3.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-bold text-sm transition shadow-[0_0_20px_rgba(16,185,129,0.3)] group cursor-pointer"
          >
            <div className="flex items-center gap-2">
              <Zap size={16} className="fill-current text-zinc-950" />
              <span>Continue as ALAZAR (Lead Architect)</span>
            </div>
            <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
          </button>

          {/* Go to full signin console */}
          <Link
            href="/signin?returnUrl=/lab"
            onClick={onClose}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-700/80 text-zinc-200 font-semibold text-xs transition"
          >
            <Lock size={14} className="text-zinc-400" />
            <span>Sign In with Station ID / Password</span>
          </Link>

          {/* Cancel */}
          <button
            type="button"
            onClick={onClose}
            className="w-full text-center py-2 text-xs text-zinc-500 hover:text-zinc-300 font-mono transition cursor-pointer"
          >
            Cancel · Keep Designing Without Running
          </button>
        </div>
      </div>
    </div>
  );
}
