import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft, GitFork } from 'lucide-react';
import { getGalleryCircuit } from '@/server/services/gallery';
import { galleryIdSchema } from '@/shared/gallery';
import { SITE_NAME, SITE_URL } from '@/shared/site';
import GalleryCircuitView from './GalleryCircuitView';

type Props = { params: Promise<{ id: string }> };

async function load(params: Props['params']) {
  const parsed = galleryIdSchema.safeParse((await params).id);
  return parsed.success ? getGalleryCircuit(parsed.data) : null;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const circuit = await load(params);
  if (!circuit) return { title: `Not found // ${SITE_NAME}` };
  const description = circuit.description.slice(0, 160) || `A ${circuit.blockCount}-block logic circuit by ${circuit.author}. Run it in your browser.`;
  return {
    title: `${circuit.title} by ${circuit.author} // ${SITE_NAME}`,
    description,
    alternates: { canonical: `${SITE_URL}/gallery/${circuit.id}` },
    openGraph: { title: circuit.title, description, url: `${SITE_URL}/gallery/${circuit.id}`, siteName: SITE_NAME },
  };
}

export default async function GalleryCircuitPage({ params }: Props) {
  const circuit = await load(params);
  if (!circuit) notFound();

  return (
    <main className="min-h-screen bg-[#fbfbfd] px-5 py-10 text-[#1d1d1f] sm:px-8">
      <div className="mx-auto max-w-6xl">
        <Link href="/gallery" className="mb-6 inline-flex items-center gap-1.5 text-xs text-[#86868b] hover:text-[#1d1d1f]">
          <ArrowLeft size={13} /> Gallery
        </Link>
        <h1 className="text-3xl font-bold tracking-tight">{circuit.title}</h1>
        <p className="mt-2 text-sm text-[#86868b]">
          by {circuit.author} · {new Date(circuit.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })} · {circuit.blockCount} blocks
          {circuit.forkedFrom && (
            <>
              {' · '}
              <Link href={`/gallery/${circuit.forkedFrom}`} className="inline-flex items-center gap-1 text-[#0071e3] hover:underline">
                <GitFork size={12} /> remixed from another circuit
              </Link>
            </>
          )}
        </p>
        {circuit.description && <p className="mt-4 max-w-3xl whitespace-pre-line text-[#3a3a3c]">{circuit.description}</p>}
        <GalleryCircuitView circuit={circuit} />
      </div>
    </main>
  );
}
