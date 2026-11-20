'use client';

import { useEffect, useState } from 'react';
import { ExternalLink } from 'lucide-react';
import LabWorkspace from '@/components/lab/LabWorkspace';
import { decodeCircuitFragment } from '@/lib/automation/share';
import type { CircuitDocument } from '@/lib/automation/types';

type State = { status: 'loading' } | { status: 'ready'; doc: CircuitDocument; hash: string } | { status: 'error'; message: string };

export default function EmbeddedCircuit() {
  const [state, setState] = useState<State>({ status: 'loading' });

  useEffect(() => {
    let cancelled = false;
    const open = async () => {
      const hash = window.location.hash;
      try {
        const doc = await decodeCircuitFragment(hash);
        if (cancelled) return;
        setState(doc ? { status: 'ready', doc, hash } : { status: 'error', message: 'No circuit in this embed link. Create one with "Share link" in the Logic Lab.' });
      } catch (error) {
        if (!cancelled) setState({ status: 'error', message: error instanceof Error ? error.message : 'This circuit could not be opened.' });
      }
    };
    void open();
    window.addEventListener('hashchange', open);
    return () => {
      cancelled = true;
      window.removeEventListener('hashchange', open);
    };
  }, []);

  return (
    <div className="flex h-dvh w-full flex-col overflow-hidden bg-white">
      <div className="min-h-0 flex-1">
        {state.status === 'ready' ? (
          <LabWorkspace key={state.hash} readOnly document={state.doc} />
        ) : (
          <p className="flex h-full items-center justify-center p-6 text-center font-mono text-xs text-[#86868b]">
            {state.status === 'loading' ? 'Loading circuit...' : state.message}
          </p>
        )}
      </div>
      <a
        href={state.status === 'ready' ? `/lab${state.hash}` : '/lab'}
        target="_blank"
        rel="noopener"
        className="flex shrink-0 items-center justify-between gap-2 border-t border-[#e5e5ea] bg-[#fbfbfd] px-3 py-1.5 text-[11px] text-[#515154] hover:text-[#0071e3]"
      >
        <span className="truncate">{state.status === 'ready' ? state.doc.name : 'Logic Lab'} · simulated with AutomationHub</span>
        <span className="inline-flex shrink-0 items-center gap-1 font-medium">
          Open and edit <ExternalLink size={11} />
        </span>
      </a>
    </div>
  );
}
