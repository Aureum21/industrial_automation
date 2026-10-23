import type { Metadata } from 'next';
import { BLOG_POSTS, AUTHOR_NAME, AUTHOR_LINKEDIN } from '@/lib/mockPosts';
import PostClientView from './PostClientView';

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const post = BLOG_POSTS.find((p) => p.slug === slug);

  if (!post) {
    return {
      title: 'Masterclass Not Found // AutomationHub',
      description: 'Industrial automation schematics and logic controls.',
    };
  }

  const title = `${post.title} // AutomationHub`;
  const description = post.excerpt;

  return {
    title,
    description,
    authors: [{ name: 'Alazar Wake Kore', url: AUTHOR_LINKEDIN }],
    openGraph: {
      title,
      description,
      type: 'article',
      url: `https://www.industrialautomation.website/post/${slug}`,
      siteName: 'AutomationHub',
      publishedTime: '2026-10-15T00:00:00.000Z',
      authors: [AUTHOR_NAME],
      tags: [post.tag, 'Industrial Automation', 'PLC', 'SCADA', 'Control Systems'],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      creator: '@AlazarWake',
    },
  };
}

export default async function PostPage({ params }: PageProps) {
  const { slug } = await params;
  const post = BLOG_POSTS.find((p) => p.slug === slug);

  return <PostClientView slug={slug} initialPost={post} />;
}
