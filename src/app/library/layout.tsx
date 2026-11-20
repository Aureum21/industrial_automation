import type { Metadata } from 'next';
import { SITE_NAME, SITE_URL } from '@/shared/site';

export const metadata: Metadata = {
  title: `PLC function block library: timers, latches, counters, PID // ${SITE_NAME}`,
  description: 'Every logic block in the free AutomationHub simulator, with a plain explanation, pins, settings and a live demo you can run in the browser.',
  alternates: { canonical: `${SITE_URL}/library` },
};

export default function LibraryLayout({ children }: { children: React.ReactNode }) {
  return children;
}
