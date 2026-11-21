import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft, ArrowRight, CheckCircle2, Cpu } from 'lucide-react';
import InlineLab from '@/components/lab/InlineLab';
import { BLOCK_CATALOG } from '@/lib/automation/catalog';
import { blockSlug } from '@/lib/automation/blockPages';
import { parseCircuitDSL } from '@/lib/automation/dsl';
import { CHALLENGES } from '@/lib/challenges/catalog';
import { autoAssignPins, generateArduinoSketch } from '@/lib/codegen/arduinoGenerator';
import { HOW_TOS, getHowTo } from '@/lib/howto/catalog';
import { HOW_TO_CATEGORIES } from '@/lib/howto/categories';
import { MarkdownBlock } from '@/lib/content/render';
import { SITE_NAME, SITE_URL } from '@/shared/site';

type Props = { params: Promise<{ slug: string }> };

export function generateStaticParams() {
  return HOW_TOS.map((guide) => ({ slug: guide.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const guide = getHowTo((await params).slug);
  if (!guide) return { title: `Not found // ${SITE_NAME}` };
  const url = `${SITE_URL}/how-to/${guide.slug}`;
  return {
    title: guide.title,
    description: guide.description,
    alternates: { canonical: url },
    openGraph: { title: guide.title, description: guide.description, url, siteName: SITE_NAME, type: 'article' },
  };
}

function arduinoSketch(circuit: string) {
  const doc = parseCircuitDSL(circuit, BLOCK_CATALOG);
  const pins = autoAssignPins(doc, 'uno');
  return generateArduinoSketch(doc, { board: 'uno', scanCycleMs: 100, enableSerialTelemetry: false, telemetryIntervalMs: 1000, pinAssignments: pins });
}

export default async function HowToPage({ params }: Props) {
  const guide = getHowTo((await params).slug);
  if (!guide) notFound();
  const url = `${SITE_URL}/how-to/${guide.slug}`;
  const related = (guide.challenges ?? []).map((slug) => CHALLENGES.find((challenge) => challenge.slug === slug)).filter((challenge) => challenge !== undefined);
  // Same topic first, then guides that share blocks, so the links are relevant.
  const category = HOW_TO_CATEGORIES.find((group) => group.slugs.includes(guide.slug));
  const sameTopic = (category?.slugs ?? []).filter((slug) => slug !== guide.slug);
  const sharesBlocks = HOW_TOS.filter((other) => other.slug !== guide.slug && !sameTopic.includes(other.slug) && other.blocks.some((type) => guide.blocks.includes(type))).map((other) => other.slug);
  const others = [...sameTopic, ...sharesBlocks].slice(0, 8).map((slug) => getHowTo(slug)!);
  const sketch = arduinoSketch(guide.circuit);
  // Analog inputs are set with sliders, which only the function block view has.
  const analog = guide.inputs.some((pin) => pin.type === 'ANALOG_INPUT');
  const jsonLd = [
    {
      '@context': 'https://schema.org',
      '@type': 'TechArticle',
      headline: guide.title,
      description: guide.description,
      url,
      author: { '@type': 'Person', name: 'alex_eng_aut' },
      publisher: { '@type': 'Organization', name: SITE_NAME, url: SITE_URL },
      proficiencyLevel: guide.level === 'beginner' ? 'Beginner' : 'Expert',
    },
    {
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      mainEntity: guide.faq.map((item) => ({ '@type': 'Question', name: item.q, acceptedAnswer: { '@type': 'Answer', text: item.a } })),
    },
  ];

  return (
    <main className="min-h-screen bg-[#fbfbfd] px-5 py-12 text-[#1d1d1f] sm:px-8">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, '\\u003c') }} />
      <article className="mx-auto max-w-3xl">
        <Link href="/how-to" className="mb-8 inline-flex items-center gap-1.5 text-xs text-[#86868b] hover:text-[#1d1d1f]">
          <ArrowLeft size={13} /> How-to guides
        </Link>
        <h1 className="text-3xl font-bold leading-tight tracking-tight sm:text-4xl">{guide.title}</h1>

        <p className="mt-6 rounded-2xl border border-[#059669]/20 bg-[#059669]/5 p-5 text-lg leading-relaxed text-[#1d1d1f]">{guide.answer}</p>

        <section className="mt-10">
          <h2 className="mb-1 text-xl font-bold">Try the working circuit</h2>
          <ul className="mb-3 list-disc space-y-0.5 pl-5 text-sm text-[#515154]">
            {!analog && <li>Press Run, then click a switch contact in the ladder to operate it. Green means power flows.</li>}
            {guide.tryIt.map((line) => <li key={line}>{line}</li>)}
          </ul>
          <InlineLab dsl={guide.circuit} title={guide.title} step="LIVE" height={600} verifiable={false} initialView={analog ? 'visual' : 'ladder'} />
          <p className="mt-2 flex items-center gap-1.5 text-xs text-[#059669]">
            <CheckCircle2 size={13} /> Verified: this circuit passes {guide.scenarios.length} automated test scenarios
            {guide.never?.length ? ', and is checked on every simulated scan for unsafe combinations of outputs' : ''}.
            {analog ? 'Switch to "Ladder view" for the ladder diagram.' : 'Switch to "Function blocks" for the function block diagram and the logic analyzer.'}
          </p>
        </section>

        <section className="mt-10">
          <h2 className="mb-3 text-xl font-bold">Inputs and outputs</h2>
          <div className="overflow-x-auto rounded-xl border border-[#e5e5ea] bg-white">
            <table className="min-w-full text-sm">
              <thead className="bg-[#f5f5f7] text-left text-xs text-[#86868b]">
                <tr><th className="px-3 py-2">Signal</th><th className="px-3 py-2">Type</th><th className="px-3 py-2">Real device</th></tr>
              </thead>
              <tbody className="divide-y divide-[#e5e5ea]">
                {[...guide.inputs.map((pin) => ({ ...pin, kind: pin.type === 'ANALOG_INPUT' ? 'Analog input' : 'Digital input' })), ...guide.outputs.map((pin) => ({ ...pin, kind: 'Digital output' }))].map((pin) => (
                  <tr key={pin.id}>
                    <td className="px-3 py-2 font-medium">{pin.label}</td>
                    <td className="px-3 py-2 text-[#515154]">{pin.kind}</td>
                    <td className="px-3 py-2 text-[#515154]">{pin.device}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section className="mt-10">
          <h2 className="mb-2 text-xl font-bold">How it works</h2>
          <MarkdownBlock text={guide.explanation} />
        </section>

        <section className="mt-10">
          <h2 className="mb-4 text-xl font-bold">Step by step</h2>
          <ol className="space-y-4">
            {guide.steps.map((step, index) => (
              <li key={step.title} className="flex gap-4">
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#1d1d1f] text-xs font-bold text-white">{index + 1}</span>
                <div>
                  <h3 className="font-semibold">{step.title}</h3>
                  <p className="mt-0.5 text-[#3a3a3c]">{step.text}</p>
                </div>
              </li>
            ))}
          </ol>
        </section>

        <section className="mt-10">
          <h2 className="mb-3 text-xl font-bold">Common mistakes</h2>
          <ul className="list-disc space-y-2 pl-5 text-[#3a3a3c]">
            {guide.mistakes.map((mistake) => <li key={mistake}>{mistake}</li>)}
          </ul>
        </section>

        <section className="mt-10">
          <h2 className="mb-2 flex items-center gap-2 text-xl font-bold"><Cpu size={18} className="text-amber-600" /> Arduino code</h2>
          <p className="mb-3 text-sm text-[#515154]">
            The same logic as a non-blocking Arduino Uno sketch, generated from the circuit. Pin numbers are assigned automatically and listed at the top; open the circuit in the Logic Lab to change them.
          </p>
          <details className="rounded-xl border border-[#e5e5ea] bg-white">
            <summary className="cursor-pointer px-4 py-3 text-sm font-medium">Show the sketch ({sketch.split('\n').length} lines)</summary>
            <pre className="max-h-[480px] overflow-auto border-t border-[#e5e5ea] bg-[#1d1d1f] p-4 text-[11px] leading-relaxed text-[#e5e5ea]"><code>{sketch}</code></pre>
          </details>
        </section>

        <section className="mt-10">
          <h2 className="mb-4 text-xl font-bold">Frequently asked questions</h2>
          <div className="space-y-5">
            {guide.faq.map((item) => (
              <div key={item.q}>
                <h3 className="font-semibold">{item.q}</h3>
                <p className="mt-1 text-[#3a3a3c]">{item.a}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="mt-10 grid gap-6 sm:grid-cols-2">
          <div>
            <h2 className="mb-3 text-lg font-bold">Blocks used</h2>
            <ul className="flex flex-wrap gap-2">
              {guide.blocks.map((type) => (
                <li key={type}>
                  <Link href={`/library/${blockSlug(type)}`} className="inline-block rounded-full border border-[#e5e5ea] bg-white px-3 py-1 text-xs hover:border-[#0071e3]/40 hover:text-[#0071e3]">
                    {BLOCK_CATALOG[type].name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
          {related.length > 0 && (
            <div>
              <h2 className="mb-3 text-lg font-bold">Practise it yourself</h2>
              <ul className="space-y-2">
                {related.map((challenge) => (
                  <li key={challenge.slug}>
                    <Link href={`/challenges/${challenge.slug}`} className="inline-flex items-center gap-1 text-sm font-medium text-[#0071e3] hover:underline">
                      Challenge: {challenge.title} <ArrowRight size={12} />
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </section>

        <nav aria-label="More how-to guides" className="mt-12 border-t border-[#e5e5ea] pt-6">
          <h2 className="mb-3 text-sm font-semibold text-[#86868b]">{category ? `More in ${category.title}` : 'More PLC examples'}</h2>
          <ul className="grid gap-2 sm:grid-cols-2">
            {others.map((other) => (
              <li key={other.slug}>
                <Link href={`/how-to/${other.slug}`} className="text-sm text-[#0071e3] hover:underline">{other.title}</Link>
              </li>
            ))}
          </ul>
        </nav>
      </article>
    </main>
  );
}
