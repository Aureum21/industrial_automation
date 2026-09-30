import type { Metadata } from 'next';
import SiteHeader from '@/components/SiteHeader';
import './globals.css';

export const metadata: Metadata = {
  title: 'Automation Hub',
  description: 'A place to write, read, and connect about industrial automation.',
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
