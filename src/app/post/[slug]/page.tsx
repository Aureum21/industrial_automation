import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { ArticleSections } from '@/lib/content/render';
import { DEFAULT_MASTERCLASSES } from '@/lib/defaultArticlesData';
import { getPublishedPost } from '@/server/services/content';
import { SITE_NAME, SITE_URL } from '@/shared/site';
import PostClientView, { type PostViewModel } from './PostClientView';

const countLabs = (sections: { type: string }[]) => sections.filter((section) => section.type === 'lab').length;

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const published = await getPublishedPost(slug);
  if (!published) return { title: `Not found // ${SITE_NAME}` };

  const post = published.source === 'static' ? published.post : published.doc;
  const title = `${post.title} // ${SITE_NAME}`;
  return {
    title,
    description: post.excerpt,
    authors: [{ name: post.author }],
    alternates: { canonical: `${SITE_URL}/post/${slug}` },
    openGraph: {
      title,
      description: post.excerpt,
      type: 'article',
      url: `${SITE_URL}/post/${slug}`,
      siteName: SITE_NAME,
      authors: [post.author],
      tags: [post.tag, 'Industrial Automation', 'PLC', 'Control Systems'],
    },
    twitter: { card: 'summary_large_image', title, description: post.excerpt },
  };
}

export default async function PostPage({ params }: PageProps) {
  const { slug } = await params;
  const published = await getPublishedPost(slug);
  if (!published) notFound();

  const view: PostViewModel =
    published.source === 'static'
      ? {
          slug,
          title: published.post.title,
          excerpt: published.post.excerpt,
          author: published.post.author,
          date: published.post.date,
          readingTime: published.post.readingTime,
          tag: published.post.tag,
          dsl: published.post.dsl,
          views: published.views,
          labCount: countLabs(DEFAULT_MASTERCLASSES.find((doc) => doc.slug === slug)?.sections ?? []),
        }
      : {
          slug,
          title: published.doc.title,
          excerpt: published.doc.excerpt,
          author: published.doc.author,
          authorId: published.doc.authorId,
          date: published.doc.date,
          readingTime: published.doc.readingTime,
          tag: published.doc.tag,
          dsl: '',
          views: published.views,
          labCount: countLabs(published.doc.sections),
        };

  const content = published.source === 'static' ? published.post.content : <ArticleSections sections={published.doc.sections} />;
  return <PostClientView post={view}>{content}</PostClientView>;
}
