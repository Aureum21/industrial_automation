import type { Metadata } from 'next';
import SiteHeader from '@/components/SiteHeader';
import './globals.css';

export const metadata: Metadata = {
  title: { default: 'Fieldnotes — Automation engineering', template: '%s | Fieldnotes' },
  description: 'Practical industrial automation notes, an interactive logic lab, and a growing library of control components. Read, build, and understand.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full bg-[#0b1118] text-[#e5edf5]">
        <a href="#main-content" className="sr-only focus:fixed focus:top-2 focus:left-2 focus:z-50 focus:not-sr-only focus:rounded focus:bg-[#c4ef72] focus:px-4 focus:py-2 focus:text-[#122018]">Skip to content</a>
        <SiteHeader />
        {children}
      </body>
    </html>
  );
}
