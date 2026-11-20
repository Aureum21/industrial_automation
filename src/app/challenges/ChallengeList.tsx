'use client';

import Link from 'next/link';
import { ArrowRight, CheckCircle2 } from 'lucide-react';
import { useChallengeProgress } from '@/lib/challenges/useProgress';
import { useSession } from '@/lib/auth';
import type { Challenge } from '@/lib/challenges/types';

type Item = Pick<Challenge, 'slug' | 'title' | 'summary' | 'level' | 'concepts'>;

const LEVELS: { level: Challenge['level']; title: string; blurb: string }[] = [
  { level: 'beginner', title: 'Beginner', blurb: 'Wires, gates, memory and your first timers.' },
  { level: 'intermediate', title: 'Intermediate', blurb: 'Counters, analog signals, hysteresis and interlocks.' },
  { level: 'advanced', title: 'Advanced', blurb: 'Complete control sequences with safety constraints.' },
];

export default function ChallengeList({ items }: { items: Item[] }) {
  const [progress] = useChallengeProgress();
  const { user } = useSession();
  const solved = items.filter((item) => progress[item.slug]).length;
  const nextUp = items.find((item) => !progress[item.slug]);

  return (
    <>
      <div className="mb-10 flex flex-wrap items-center gap-4 rounded-2xl border border-[#e5e5ea] bg-white p-5 shadow-xs">
        <div className="flex-1 min-w-[200px]">
          <p className="text-sm font-semibold">
            {solved} of {items.length} solved
          </p>
          <div className="mt-2 h-2 overflow-hidden rounded-full bg-[#f5f5f7]">
            <div className="h-full rounded-full bg-emerald-500 transition-all" style={{ width: `${(solved / items.length) * 100}%` }} />
          </div>
          <p className="mt-2 text-xs text-[#86868b]">
            {user ? (
              'Progress is saved to your account and syncs across devices.'
            ) : (
              <>
                Progress is kept in this browser. <Link href="/signin?redirect=/challenges" className="text-[#0071e3] hover:underline">Sign in</Link> to keep it on every device.
              </>
            )}
          </p>
        </div>
        {nextUp && (
          <Link href={`/challenges/${nextUp.slug}`} className="inline-flex items-center gap-2 rounded-full bg-[#0071e3] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#0077ed]">
            {solved ? 'Continue' : 'Start'}: {nextUp.title} <ArrowRight size={15} />
          </Link>
        )}
      </div>

      {LEVELS.map(({ level, title, blurb }) => {
        const group = items.filter((item) => item.level === level);
        if (!group.length) return null;
        return (
          <section key={level} className="mb-12">
            <h2 className="text-xl font-bold tracking-tight">{title}</h2>
            <p className="mb-4 text-sm text-[#86868b]">{blurb}</p>
            <ol className="grid gap-3 sm:grid-cols-2">
              {group.map((item) => {
                const done = Boolean(progress[item.slug]);
                const number = items.indexOf(item) + 1;
                return (
                  <li key={item.slug}>
                    <Link
                      href={`/challenges/${item.slug}`}
                      className="group flex h-full gap-4 rounded-2xl border border-[#e5e5ea] bg-white p-5 transition hover:border-[#0071e3]/40 hover:shadow-md"
                    >
                      <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full font-mono text-xs font-bold ${done ? 'bg-emerald-600 text-white' : 'bg-[#f5f5f7] text-[#515154]'}`}>
                        {done ? <CheckCircle2 size={16} /> : number}
                      </span>
                      <span className="min-w-0">
                        <span className="block font-semibold group-hover:text-[#0071e3]">{item.title}</span>
                        <span className="mt-1 block text-sm text-[#515154]">{item.summary}</span>
                        <span className="mt-2 flex flex-wrap gap-1.5">
                          {item.concepts.map((concept) => (
                            <span key={concept} className="rounded-full bg-[#f5f5f7] px-2 py-0.5 text-[11px] text-[#515154]">{concept}</span>
                          ))}
                        </span>
                      </span>
                    </Link>
                  </li>
                );
              })}
            </ol>
          </section>
        );
      })}
    </>
  );
}
