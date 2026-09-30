import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

export default function NotFound() {
  return <main id="main-content" className="mx-auto max-w-2xl px-6 py-24"><p className="mb-5 font-mono text-xs tracking-widest text-[#72d9e5]">404 / OPEN CIRCUIT</p><h1 className="text-4xl font-medium tracking-tight">This connection leads nowhere.</h1><p className="mt-5 text-base leading-7 text-[#91a2b7]">The page or fieldnote you requested could not be found.</p><Link href="/" className="mt-8 inline-flex items-center gap-3 rounded-lg bg-[#c4ef72] px-5 py-3 text-sm font-semibold text-[#122018]"><ArrowLeft size={15} /> Back to Fieldnotes</Link></main>;
}
