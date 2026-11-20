import type { MetadataRoute } from 'next';
import { DOCUMENTED_BLOCKS, blockSlug } from '@/lib/automation/blockPages';
import { CHALLENGES } from '@/lib/challenges/catalog';
import { getPostSummaries } from '@/server/services/content';
import { SITE_URL } from '@/shared/site';

const asDate = (value: string | undefined) => {
  const parsed = value ? new Date(value) : undefined;
  return parsed && !Number.isNaN(parsed.getTime()) ? parsed : undefined;
};

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const page = (path: string, priority: number, lastModified?: Date): MetadataRoute.Sitemap[number] => ({ url: `${SITE_URL}${path}`, priority, lastModified });

  // Articles come from the database; the sitemap must still render if it is unreachable.
  const posts = await getPostSummaries().catch(() => []);

  return [
    page('/', 1),
    page('/challenges', 0.9),
    page('/lab', 0.9),
    page('/blogs', 0.8),
    page('/library', 0.8),
    ...CHALLENGES.map((challenge) => page(`/challenges/${challenge.slug}`, 0.7)),
    ...DOCUMENTED_BLOCKS.map((block) => page(`/library/${blockSlug(block.type)}`, 0.6)),
    ...posts.map((post) => page(`/post/${post.slug}`, 0.7, asDate(post.date))),
  ];
}
