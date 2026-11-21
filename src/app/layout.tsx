import type { Metadata } from 'next';
import SiteHeader from '@/components/SiteHeader';
import './globals.css';
import { SITE_URL } from '@/shared/site';

export const metadata: Metadata = {
  // Absolute URLs for og:image, canonical and alternates.
  metadataBase: new URL(SITE_URL),
  title: 'AutomationHub // Industrial Logic & Automation',
  description: 'Interactive industrial automation masterclasses, deterministic PLC logic simulations, and SCADA engineering controls.',
  icons: {
    icon: [
      { url: '/icon.svg', type: 'image/svg+xml' },
      { url: '/icon.png', type: 'image/png', sizes: '32x32' },
      { url: '/favicon.ico' },
    ],
    apple: [
      { url: '/apple-icon.png', sizes: '180x180', type: 'image/png' },
    ],
    shortcut: '/favicon.ico',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full bg-white text-gray-900 font-sans selection:bg-green-200">
        <SiteHeader />
        {children}
      </body>
    </html>
  );
}
