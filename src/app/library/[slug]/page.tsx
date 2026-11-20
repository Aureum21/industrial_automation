import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft, ArrowRight, Cpu } from 'lucide-react';
import InlineLab from '@/components/lab/InlineLab';
import { BlockIcon } from '@/components/lab/BlockIcons';
import { BLOCK_GUIDES } from '@/lib/automation/blockGuides';
import { DOCUMENTED_BLOCKS, blockFromSlug, blockSlug, demoCircuit } from '@/lib/automation/blockPages';
import { stringifyCircuitDSL } from '@/lib/automation/dsl';
import { CHALLENGES } from '@/lib/challenges/catalog';
import { arduinoSupport } from '@/lib/codegen/arduinoGenerator';
import { MarkdownBlock } from '@/lib/content/render';
import { SITE_NAME, SITE_URL } from '@/shared/site';

type Props = { params: Promise<{ slug: string }> };

export function generateStaticParams() {
  return DOCUMENTED_BLOCKS.map((block) => ({ slug: blockSlug(block.type) }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const block = blockFromSlug((await params).slug);
  if (!block) return { title: `Not found // ${SITE_NAME}` };
  const guide = BLOCK_GUIDES[block.type];
  const title = `${guide?.headline ?? block.name}: how it works, with a live simulator`;
  const url = `${SITE_URL}/library/${blockSlug(block.type)}`;
  return {
    title,
    description: `${block.description} Try the ${block.name.toLowerCase()} in a free browser simulator and export it to Arduino.`,
    alternates: { canonical: url },
    openGraph: { title, description: block.description, url, siteName: SITE_NAME, type: 'article' },
  };
}

const SUPPORT_TEXT = {
  supported: 'Exports to Arduino (.ino) and runs exactly like the simulator.',
  'simulation-only': 'Simulation only: it models a physical machine, so it has no Arduino equivalent.',
  'not-yet': 'Not yet supported by the Arduino exporter.',
};

export default async function BlockPage({ params }: Props) {
  const block = blockFromSlug((await params).slug);
  if (!block) notFound();
  const guide = BLOCK_GUIDES[block.type];
  const related = (guide?.challenges ?? []).map((slug) => CHALLENGES.find((challenge) => challenge.slug === slug)).filter(Boolean);
  const siblings = DOCUMENTED_BLOCKS.filter((other) => other.category === block.category && other.type !== block.type);
  const demo = stringifyCircuitDSL(demoCircuit(block.type));
  const url = `${SITE_URL}/library/${blockSlug(block.type)}`;
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'TechArticle',
    headline: guide?.headline ?? block.name,
    description: block.description,
    url,
    author: { '@type': 'Person', name: 'alex_eng_aut' },
    publisher: { '@type': 'Organization', name: SITE_NAME, url: SITE_URL },
  };

  return (
    <main className="min-h-screen bg-[#fbfbfd] px-5 py-12 text-[#1d1d1f] sm:px-8">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, '\\u003c') }} />
      <article className="mx-auto max-w-3xl">
        <Link href="/library" className="mb-8 inline-flex items-center gap-1.5 text-xs text-[#86868b] hover:text-[#1d1d1f]">
          <ArrowLeft size={13} /> Component library
        </Link>

        <header className="mb-8 flex items-start gap-4">
          <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border border-[#e5e5ea] bg-white text-[#059669]">
            <BlockIcon type={block.type} />
          </span>
          <div>
            <p className="font-mono text-xs uppercase tracking-wider text-[#86868b]">
              {block.category} · [{block.shortName}]
            </p>
            <h1 className="mt-1 text-3xl font-bold tracking-tight sm:text-4xl">{guide?.headline ?? block.name}</h1>
            <p className="mt-3 text-lg text-[#515154]">{block.description}</p>
          </div>
        </header>

        {guide && (
          <section className="mb-10">
            <h2 className="mb-2 text-xl font-bold">How it behaves</h2>
            <MarkdownBlock text={guide.behaviour} />
          </section>
        )}

        <section className="mb-10">
          <h2 className="mb-1 text-xl font-bold">Try it</h2>
          <p className="mb-2 text-sm text-[#515154]">Press Run, then toggle the inputs on the left and watch the outputs and the logic analyzer.</p>
          <InlineLab dsl={demo} title={`${block.name} demo`} step="LIVE" height={460} verifiable={false} />
        </section>

        <section className="mb-10 grid gap-6 sm:grid-cols-2">
          <div>
            <h2 className="mb-3 text-lg font-bold">Pins</h2>
            <table className="w-full text-sm">
              <tbody className="divide-y divide-[#e5e5ea]">
                {block.inputs.map((pin) => (
                  <tr key={`in-${pin.id}`}>
                    <td className="py-1.5 pr-3 font-mono text-xs text-[#86868b]">in</td>
                    <td className="py-1.5 pr-3 font-mono font-semibold">{pin.id}</td>
                    <td className="py-1.5 text-[#515154]">{pin.label} · {pin.kind}</td>
                  </tr>
                ))}
                {block.outputs.map((pin) => (
                  <tr key={`out-${pin.id}`}>
                    <td className="py-1.5 pr-3 font-mono text-xs text-[#86868b]">out</td>
                    <td className="py-1.5 pr-3 font-mono font-semibold">{pin.id}</td>
                    <td className="py-1.5 text-[#515154]">{pin.label} · {pin.kind}</td>
                  </tr>
                ))}
                {!block.inputs.length && !block.outputs.length && (
                  <tr>
                    <td className="py-1.5 text-[#86868b]">None</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          <div>
            <h2 className="mb-3 text-lg font-bold">Settings</h2>
            {block.parameters.length ? (
              <table className="w-full text-sm">
                <tbody className="divide-y divide-[#e5e5ea]">
                  {block.parameters.map((parameter) => (
                    <tr key={parameter.key}>
                      <td className="py-1.5 pr-3 font-medium">{parameter.label}</td>
                      <td className="py-1.5 font-mono text-xs text-[#515154]">
                        default {String(parameter.defaultValue)}
                        {parameter.unit ? ` ${parameter.unit}` : ''}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <p className="text-sm text-[#86868b]">No settings.</p>
            )}
          </div>
        </section>

        {guide && (
          <section className="mb-10 grid gap-6 sm:grid-cols-2">
            <div>
              <h2 className="mb-3 text-lg font-bold">Typical uses</h2>
              <ul className="list-disc space-y-1.5 pl-5 text-sm text-[#3a3a3c]">
                {guide.uses.map((use) => <li key={use}>{use}</li>)}
              </ul>
            </div>
            <div>
              <h2 className="mb-3 text-lg font-bold">Common mistakes</h2>
              <ul className="list-disc space-y-1.5 pl-5 text-sm text-[#3a3a3c]">
                {guide.mistakes.map((mistake) => <li key={mistake}>{mistake}</li>)}
              </ul>
            </div>
          </section>
        )}

        <p className="mb-10 flex items-center gap-2 rounded-xl border border-[#e5e5ea] bg-white p-4 text-sm text-[#515154]">
          <Cpu size={16} className="shrink-0 text-amber-600" /> {SUPPORT_TEXT[arduinoSupport(block.type)]}
        </p>

        {related.length > 0 && (
          <section className="mb-10">
            <h2 className="mb-3 text-lg font-bold">Practise it</h2>
            <div className="grid gap-3 sm:grid-cols-2">
              {related.map((challenge) => (
                <Link key={challenge!.slug} href={`/challenges/${challenge!.slug}`} className="group rounded-2xl border border-[#e5e5ea] bg-white p-4 hover:border-[#0071e3]/40">
                  <span className="font-semibold group-hover:text-[#0071e3]">{challenge!.title}</span>
                  <span className="mt-1 block text-sm text-[#515154]">{challenge!.summary}</span>
                  <span className="mt-2 inline-flex items-center gap-1 text-xs font-medium text-[#0071e3]">
                    Start challenge <ArrowRight size={12} />
                  </span>
                </Link>
              ))}
            </div>
          </section>
        )}

        {siblings.length > 0 && (
          <nav aria-label={`More ${block.category} blocks`} className="border-t border-[#e5e5ea] pt-6">
            <h2 className="mb-3 text-sm font-semibold text-[#86868b]">More in {block.category}</h2>
            <ul className="flex flex-wrap gap-2">
              {siblings.map((other) => (
                <li key={other.type}>
                  <Link href={`/library/${blockSlug(other.type)}`} className="inline-block rounded-full border border-[#e5e5ea] bg-white px-3 py-1 text-xs hover:border-[#0071e3]/40 hover:text-[#0071e3]">
                    {other.name}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        )}
      </article>
    </main>
  );
}
