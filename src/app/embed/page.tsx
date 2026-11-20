import type { Metadata } from 'next';
import EmbeddedCircuit from './EmbeddedCircuit';

export const metadata: Metadata = {
  title: 'Embedded circuit // AutomationHub',
  robots: { index: false, follow: true },
};

/** Iframe target: /embed#c=1.<payload>. The circuit lives in the fragment, so this page is static. */
export default function EmbedPage() {
  return <EmbeddedCircuit />;
}
