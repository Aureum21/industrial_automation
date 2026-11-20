import type { Metadata } from 'next';
import { CHALLENGES } from '@/lib/challenges/catalog';
import { SITE_NAME, SITE_URL } from '@/shared/site';
import ChallengeList from './ChallengeList';

export const metadata: Metadata = {
  title: `PLC logic challenges // ${SITE_NAME}`,
  description: 'Practice industrial control logic in your browser. Build the circuit, press Check, and get instant feedback from automatic tests.',
  alternates: { canonical: `${SITE_URL}/challenges` },
};

export default function ChallengesPage() {
  const items = CHALLENGES.map(({ slug, title, summary, level, concepts }) => ({ slug, title, summary, level, concepts }));
  return (
    <main className="min-h-screen bg-[#fbfbfd] px-5 py-14 text-[#1d1d1f] sm:px-8">
      <div className="mx-auto max-w-4xl">
        <header className="mb-8">
          <p className="mb-3 font-mono text-xs font-semibold uppercase tracking-widest text-[#0071e3]">Practice</p>
          <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">Control logic challenges</h1>
          <p className="mt-4 max-w-2xl text-lg text-[#515154]">
            Each challenge gives you the inputs and outputs of a real control problem. Build the logic in between, press <strong>Check</strong>, and automatic tests tell you exactly what works and what does not. No installs, no hardware, free.
          </p>
        </header>
        <ChallengeList items={items} />
      </div>
    </main>
  );
}
