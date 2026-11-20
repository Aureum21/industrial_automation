import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { CHALLENGES, getChallenge } from '@/lib/challenges/catalog';
import { SITE_NAME, SITE_URL } from '@/shared/site';
import ChallengeView from './ChallengeView';

type Props = { params: Promise<{ slug: string }> };

export function generateStaticParams() {
  return CHALLENGES.map((challenge) => ({ slug: challenge.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const challenge = getChallenge((await params).slug);
  if (!challenge) return { title: `Not found // ${SITE_NAME}` };
  const title = `${challenge.title}: PLC logic challenge // ${SITE_NAME}`;
  return {
    title,
    description: challenge.summary,
    alternates: { canonical: `${SITE_URL}/challenges/${challenge.slug}` },
    openGraph: { title, description: challenge.summary, url: `${SITE_URL}/challenges/${challenge.slug}`, siteName: SITE_NAME },
  };
}

export default async function ChallengePage({ params }: Props) {
  const { slug } = await params;
  const index = CHALLENGES.findIndex((challenge) => challenge.slug === slug);
  if (index === -1) notFound();
  const neighbour = (i: number) => (CHALLENGES[i] ? { slug: CHALLENGES[i].slug, title: CHALLENGES[i].title } : undefined);
  return <ChallengeView challenge={CHALLENGES[index]} index={index} total={CHALLENGES.length} previous={neighbour(index - 1)} next={neighbour(index + 1)} />;
}
