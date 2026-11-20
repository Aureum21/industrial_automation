'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { GitFork, Trash2 } from 'lucide-react';
import LabWorkspace from '@/components/lab/LabWorkspace';
import { galleryApi } from '@/lib/api/client';
import { useSession } from '@/lib/auth';
import { encodeCircuitFragment } from '@/lib/automation/share';
import type { GalleryCircuit } from '@/shared/gallery';
import { canDeleteGalleryCircuit } from '@/shared/permissions';

export default function GalleryCircuitView({ circuit }: { circuit: GalleryCircuit }) {
  const router = useRouter();
  const { user } = useSession();
  const [error, setError] = useState('');

  const openCopy = async () => {
    try {
      router.push(`/lab?fork=${encodeURIComponent(circuit.id)}#${await encodeCircuitFragment(circuit.document)}`);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Could not open a copy.');
    }
  };

  const remove = async () => {
    if (!confirm(`Delete "${circuit.title}" from the gallery? This cannot be undone.`)) return;
    const result = await galleryApi.remove(circuit.id);
    if (!result.ok) return setError(result.error);
    router.push('/gallery');
    router.refresh();
  };

  return (
    <>
      <div className="mt-6 flex flex-wrap items-center gap-3">
        <button onClick={() => void openCopy()} className="inline-flex items-center gap-2 rounded-full bg-[#0071e3] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#0077ed]">
          <GitFork size={15} /> Open a copy in the Lab
        </button>
        {canDeleteGalleryCircuit(user, circuit) && (
          <button onClick={() => void remove()} className="inline-flex items-center gap-2 rounded-full border border-red-200 px-4 py-2.5 text-sm font-medium text-red-600 hover:bg-red-50">
            <Trash2 size={14} /> Delete{user?.id !== circuit.ownerId ? ' (moderation)' : ''}
          </button>
        )}
        {error && <p role="alert" className="text-sm text-red-600">{error}</p>}
      </div>
      <div className="mt-6 h-[560px] overflow-hidden rounded-2xl border border-[#e5e5ea] bg-white">
        <LabWorkspace readOnly document={circuit.document} />
      </div>
    </>
  );
}
