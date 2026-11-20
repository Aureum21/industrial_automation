import type { Metadata } from 'next';
import { getPostSummaries } from '@/server/services/content';
import BlogsDirectory from './BlogsDirectory';

export const metadata: Metadata = {
  title: 'Masterclasses // AutomationHub',
  description: 'Interactive industrial automation articles with live, runnable control-logic labs.',
};

export default async function BlogsPage() {
  return <BlogsDirectory posts={await getPostSummaries()} />;
}
