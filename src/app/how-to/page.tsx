import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowRight, CheckCircle2 } from 'lucide-react';
import { HOW_TOS } from '@/lib/howto/catalog';
import { SITE_NAME, SITE_URL } from '@/shared/site';

export const metadata: Metadata = {
  title: `PLC programming examples and how-to guides // ${SITE_NAME}`,
  description: 'Classic PLC programs explained and verified: traffic light, car wash, garage door, bottle filling, sorting, tank level, pumps and alarms. Run each one live.',
  alternates: { canonical: `${SITE_URL}/how-to` },
};

const LEVEL = { beginner: 'Beginner', intermediate: 'Intermediate', advanced: 'Advanced' } as const;

export default function HowToIndex() {
  return (
    <main className="min-h-screen bg-[#fbfbfd] px-5 py-12 text-[#1d1d1f] sm:px-8">
      <div className="mx-auto max-w-5xl">
        <header className="mb-10 max-w-3xl">
          <p className="font-mono text-xs uppercase tracking-widest text-[#059669]">How-to guides</p>
          <h1 className="mt-2 text-4xl font-bold tracking-tight">PLC programming examples you can run</h1>
          <p className="mt-3 text-lg text-[#515154]">
            The classic exercises from every PLC course, each with a working circuit in the browser, the ladder diagram, step-by-step build instructions and Arduino code.
            Every circuit is tested automatically against its requirements.
          </p>
        </header>
        <ul className="grid gap-4 sm:grid-cols-2">
          {HOW_TOS.map((guide) => (
            <li key={guide.slug}>
              <Link href={`/how-to/${guide.slug}`} className="group flex h-full flex-col rounded-2xl border border-[#e5e5ea] bg-white p-5 transition hover:border-[#0071e3]/40 hover:shadow-sm">
                <span className="text-xs font-medium text-[#86868b]">{LEVEL[guide.level]}</span>
                <h2 className="mt-1 font-semibold leading-snug group-hover:text-[#0071e3]">{guide.title}</h2>
                <p className="mt-2 line-clamp-3 flex-1 text-sm text-[#515154]">{guide.answer}</p>
                <span className="mt-4 flex items-center justify-between text-xs">
                  <span className="inline-flex items-center gap-1 text-[#059669]"><CheckCircle2 size={12} /> Verified circuit</span>
                  <span className="inline-flex items-center gap-1 font-medium text-[#0071e3]">Open guide <ArrowRight size={12} /></span>
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </main>
  );
}
