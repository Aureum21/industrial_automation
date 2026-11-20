'use client';

import { useState } from 'react';
import Link from 'next/link';
import { galleryApi } from '@/lib/api/client';
import { useSession } from '@/lib/auth';
import type { CircuitDocument } from '@/lib/automation/types';
import { GALLERY_LIMITS } from '@/shared/gallery';

/** Publishes the current lab circuit to the community gallery. */
export default function PublishDialog({ getDocument, defaultTitle, onClose }: { getDocument: () => CircuitDocument; defaultTitle: string; onClose: () => void }) {
  const { user, checked } = useSession();
  const [title, setTitle] = useState(defaultTitle === 'Untitled circuit' ? '' : defaultTitle);
  const [description, setDescription] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [published, setPublished] = useState<string | null>(null);

  const publish = async () => {
    setBusy(true);
    setError('');
    const forkedFrom = new URLSearchParams(window.location.search).get('fork') ?? undefined;
    const result = await galleryApi.publish({ title, description, document: getDocument(), ...(forkedFrom ? { forkedFrom } : {}) });
    setBusy(false);
    if (result.ok) setPublished(result.data.circuit.id);
    else setError(result.error);
  };

  return (
    <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/40 p-6" role="dialog" aria-modal="true" aria-labelledby="publish-title">
      <div className="w-full max-w-lg rounded-xl border border-gray-200 bg-white p-6 shadow-xl">
        <h2 id="publish-title" className="text-lg font-semibold">{published ? 'Published' : 'Publish to the gallery'}</h2>
        {published ? (
          <>
            <p className="mt-2 text-sm text-gray-500">Your circuit is live. Anyone can run it and open their own copy.</p>
            <div className="mt-5 flex justify-end gap-2">
              <button className="lab-button" onClick={onClose}>Close</button>
              <Link className="lab-button primary" href={`/gallery/${published}`}>View it</Link>
            </div>
          </>
        ) : !checked ? (
          <p className="mt-4 text-sm text-gray-500">Checking your account...</p>
        ) : !user ? (
          <>
            <p className="mt-2 text-sm text-gray-500">Sign in to publish under your name. Save your circuit first; it stays in this browser while you sign in.</p>
            <div className="mt-5 flex justify-end gap-2">
              <button className="lab-button" onClick={onClose}>Cancel</button>
              <Link className="lab-button primary" href="/signin?redirect=/lab">Sign in</Link>
            </div>
          </>
        ) : (
          <form onSubmit={(event) => { event.preventDefault(); void publish(); }}>
            <p className="mt-2 text-sm text-gray-500">Published circuits are public: anyone can run them and open a copy. Inputs start in their current state.</p>
            <label className="mt-4 block text-xs font-medium text-gray-600" htmlFor="publish-name">Title</label>
            <input id="publish-name" required minLength={3} maxLength={GALLERY_LIMITS.title} value={title} onChange={(event) => setTitle(event.target.value)} placeholder="e.g. Car park barrier with occupancy counter" className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-[#0071e3]" />
            <label className="mt-4 block text-xs font-medium text-gray-600" htmlFor="publish-description">What does it do? How should people try it?</label>
            <textarea id="publish-description" rows={4} maxLength={GALLERY_LIMITS.description} value={description} onChange={(event) => setDescription(event.target.value)} placeholder="Press Entry to let a car in. The barrier stays closed when the car park is full." className="mt-1 w-full resize-y rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-[#0071e3]" />
            {error && <p role="alert" className="mt-3 text-sm text-red-600">{error}</p>}
            <p className="mt-3 text-xs text-gray-400">Publishing as {user.name}.</p>
            <div className="mt-5 flex justify-end gap-2">
              <button type="button" className="lab-button" onClick={onClose}>Cancel</button>
              <button type="submit" className="lab-button primary" disabled={busy}>{busy ? 'Publishing...' : 'Publish'}</button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
