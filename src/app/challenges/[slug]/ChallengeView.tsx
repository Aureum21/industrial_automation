'use client';

import { useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, ArrowRight, CheckCircle2, ChevronDown, Lightbulb, Play, XCircle } from 'lucide-react';
import LabWorkspace, { type LabController } from '@/components/lab/LabWorkspace';
import { MarkdownBlock } from '@/lib/content/render';
import { gradeChallenge } from '@/lib/challenges/grader';
import { PROGRESS_KEY, starterDocument, workKey, type ChallengeProgress } from '@/lib/challenges/starter';
import type { Challenge, GradeResult } from '@/lib/challenges/types';
import { useStoredValue } from '@/lib/useStoredValue';

const NO_PROGRESS: ChallengeProgress = {};
const LEVEL_STYLE: Record<Challenge['level'], string> = {
  beginner: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  intermediate: 'bg-sky-50 text-sky-700 border-sky-200',
  advanced: 'bg-violet-50 text-violet-700 border-violet-200',
};

interface Neighbour {
  slug: string;
  title: string;
}

export default function ChallengeView({ challenge, index, total, previous, next }: { challenge: Challenge; index: number; total: number; previous?: Neighbour; next?: Neighbour }) {
  const lab = useRef<LabController>(null);
  const resultsRef = useRef<HTMLElement>(null);
  const starter = useMemo(() => starterDocument(challenge), [challenge]);
  const [result, setResult] = useState<GradeResult | null>(null);
  const [hintsShown, setHintsShown] = useState(0);
  const [progress, setProgress] = useStoredValue<ChallengeProgress>(PROGRESS_KEY, NO_PROGRESS);
  const solved = Boolean(progress[challenge.slug]);

  const check = () => {
    const doc = lab.current?.getDocument();
    if (!doc) return;
    const graded = gradeChallenge(challenge, doc);
    setResult(graded);
    requestAnimationFrame(() => resultsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' }));
    if (graded.passed && !solved) setProgress({ ...progress, [challenge.slug]: { solvedAt: new Date().toISOString() } });
  };

  return (
    <main className="flex flex-col lg:flex-row lg:h-[calc(100dvh-58px)] bg-[#fbfbfd] text-[#1d1d1f]">
      <aside className="lg:w-[400px] lg:shrink-0 lg:overflow-y-auto border-b lg:border-b-0 lg:border-r border-[#e5e5ea] bg-white">
        <div className="p-6 space-y-6">
          <div className="flex items-center justify-between text-xs">
            <Link href="/challenges" className="inline-flex items-center gap-1.5 text-[#86868b] hover:text-[#1d1d1f]">
              <ArrowLeft size={13} /> All challenges
            </Link>
            <span className="font-mono text-[#86868b]">
              {index + 1} / {total}
            </span>
          </div>

          <header>
            <div className="mb-3 flex flex-wrap items-center gap-2">
              <span className={`rounded-full border px-2.5 py-0.5 text-[11px] font-medium capitalize ${LEVEL_STYLE[challenge.level]}`}>{challenge.level}</span>
              {challenge.concepts.map((concept) => (
                <span key={concept} className="rounded-full bg-[#f5f5f7] px-2.5 py-0.5 text-[11px] text-[#515154]">{concept}</span>
              ))}
              {solved && (
                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-600 px-2.5 py-0.5 text-[11px] font-medium text-white">
                  <CheckCircle2 size={11} /> Solved
                </span>
              )}
            </div>
            <h1 className="text-2xl font-bold tracking-tight">{challenge.title}</h1>
          </header>

          <div className="text-sm [&_p]:text-sm [&_p]:text-[#3a3a3c]">
            <MarkdownBlock text={challenge.brief} />
          </div>

          <section>
            <h2 className="mb-2 text-xs font-semibold uppercase tracking-wider text-[#86868b]">Your circuit must</h2>
            <ul className="space-y-1.5 text-sm text-[#1d1d1f]">
              {challenge.requirements.map((requirement) => (
                <li key={requirement} className="flex gap-2">
                  <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-[#0071e3]" />
                  {requirement}
                </li>
              ))}
            </ul>
          </section>

          <section className="space-y-2">
            {challenge.hints.slice(0, hintsShown).map((hint, i) => (
              <p key={hint} className="flex gap-2 rounded-xl bg-amber-50 p-3 text-sm text-amber-900">
                <Lightbulb size={15} className="mt-0.5 shrink-0" />
                <span>
                  <strong className="font-semibold">Hint {i + 1}.</strong> {hint}
                </span>
              </p>
            ))}
            {hintsShown < challenge.hints.length && (
              <button type="button" onClick={() => setHintsShown(hintsShown + 1)} className="inline-flex items-center gap-1 text-xs font-medium text-[#0071e3] hover:underline">
                <ChevronDown size={13} /> {hintsShown === 0 ? 'Show a hint' : 'Show another hint'} ({hintsShown}/{challenge.hints.length})
              </button>
            )}
          </section>

          <div className="sticky bottom-0 -mx-6 border-t border-[#e5e5ea] bg-white/95 px-6 py-4 backdrop-blur">
            <button
              type="button"
              onClick={check}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#0071e3] py-2.5 text-sm font-semibold text-white transition hover:bg-[#0077ed]"
            >
              <Play size={14} /> Check my circuit
            </button>
            <p className="mt-2 text-center text-[11px] text-[#86868b]">Runs {challenge.scenarios.length} test{challenge.scenarios.length === 1 ? '' : 's'} on a fresh copy of your circuit. Your work is saved in this browser.</p>
          </div>

          {result && (
            <section ref={resultsRef} aria-live="polite" className="space-y-3">
              {result.passed ? (
                <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4">
                  <p className="flex items-center gap-2 font-semibold text-emerald-800">
                    <CheckCircle2 size={18} /> All tests passed
                  </p>
                  <p className="mt-1 text-sm text-emerald-900">Your circuit does everything this challenge asks.</p>
                  {next && (
                    <Link href={`/challenges/${next.slug}`} className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-emerald-600 px-4 py-1.5 text-xs font-semibold text-white hover:bg-emerald-700">
                      Next: {next.title} <ArrowRight size={13} />
                    </Link>
                  )}
                </div>
              ) : result.setupErrors.length > 0 ? (
                <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">
                  {result.setupErrors.map((error) => (
                    <p key={error}>{error}</p>
                  ))}
                </div>
              ) : null}
              <ul className="space-y-2">
                {result.scenarios.map((scenario) => (
                  <li key={scenario.name} className="rounded-xl border border-[#e5e5ea] p-3 text-sm">
                    <p className="flex items-center gap-2 font-medium">
                      {scenario.passed ? <CheckCircle2 size={15} className="text-emerald-600" /> : <XCircle size={15} className="text-red-600" />}
                      {scenario.name}
                    </p>
                    {scenario.failure && <p className="mt-1.5 pl-6 text-[13px] leading-relaxed text-[#515154]">{scenario.failure}</p>}
                  </li>
                ))}
              </ul>
            </section>
          )}

          <nav className="flex justify-between gap-3 border-t border-[#e5e5ea] pt-4 text-xs">
            {previous ? (
              <Link href={`/challenges/${previous.slug}`} className="inline-flex items-center gap-1 text-[#86868b] hover:text-[#1d1d1f]">
                <ArrowLeft size={12} /> {previous.title}
              </Link>
            ) : (
              <span />
            )}
            {next && (
              <Link href={`/challenges/${next.slug}`} className="inline-flex items-center gap-1 text-[#86868b] hover:text-[#1d1d1f]">
                {next.title} <ArrowRight size={12} />
              </Link>
            )}
          </nav>
        </div>
      </aside>

      <section className="h-[640px] lg:h-auto lg:flex-1 min-w-0" aria-label="Circuit editor">
        <LabWorkspace ref={lab} document={starter} persistKey={workKey(challenge.slug)} />
      </section>
    </main>
  );
}
