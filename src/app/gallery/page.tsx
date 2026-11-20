import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowRight, Boxes, GitFork } from 'lucide-react';
import { listGallery } from '@/server/services/gallery';
import { SITE_NAME, SITE_URL } from '@/shared/site';

export const metadata: Metadata = {
  title: `Community circuit gallery // ${SITE_NAME}`,
  description: 'PLC and logic circuits built by the community. Run any of them in your browser, open your own copy, and publish your own.',
  alternates: { canonical: `${SITE_URL}/gallery` },
};

const formatDate = (iso: string) => new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

export default async function GalleryPage() {
  const circuits = await listGallery();

  return (
    <main className="min-h-screen bg-[#fbfbfd] px-5 py-12 text-[#1d1d1f] sm:px-8">
      <div className="mx-auto max-w-6xl">
        <header className="mb-10 flex flex-wrap items-end justify-between gap-6">
          <div className="max-w-2xl">
            <p className="font-mono text-xs uppercase tracking-widest text-[#059669]">Community</p>
            <h1 className="mt-2 text-4xl font-bold tracking-tight">Circuit gallery</h1>
            <p className="mt-3 text-lg text-[#515154]">Circuits built by people learning and working in automation. Run them, open your own copy, improve them.</p>
          </div>
          <Link href="/lab" className="inline-flex items-center gap-2 rounded-full bg-[#0071e3] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#0077ed]">
            Build and publish yours <ArrowRight size={15} />
          </Link>
        </header>

        {circuits.length ? (
          <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {circuits.map((circuit) => (
              <li key={circuit.id}>
                <Link href={`/gallery/${circuit.id}`} className="group flex h-full flex-col rounded-2xl border border-[#e5e5ea] bg-white p-5 transition hover:border-[#0071e3]/40 hover:shadow-sm">
                  <h2 className="font-semibold group-hover:text-[#0071e3]">{circuit.title}</h2>
                  <p className="mt-2 line-clamp-3 flex-1 text-sm text-[#515154]">{circuit.description || 'No description.'}</p>
                  <p className="mt-4 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-[#86868b]">
                    <span>{circuit.author}</span>
                    <span>{formatDate(circuit.createdAt)}</span>
                    <span className="inline-flex items-center gap-1"><Boxes size={12} /> {circuit.blockCount} blocks</span>
                    {circuit.forkedFrom && <span className="inline-flex items-center gap-1"><GitFork size={12} /> remix</span>}
                  </p>
                </Link>
              </li>
            ))}
          </ul>
        ) : (
          <div className="rounded-2xl border border-dashed border-[#d2d2d7] bg-white p-12 text-center">
            <h2 className="text-xl font-semibold">Nothing here yet. Be the first.</h2>
            <p className="mx-auto mt-2 max-w-md text-sm text-[#515154]">Build a circuit in the Logic Lab and press Publish. A start/stop interlock, a traffic light, a tank controller: anything that helps someone learn.</p>
            <Link href="/lab" className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-[#0071e3]">Open the Logic Lab <ArrowRight size={14} /></Link>
          </div>
        )}
      </div>
    </main>
  );
}
