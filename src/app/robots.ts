import type { MetadataRoute } from 'next';
import { SITE_URL } from '@/shared/site';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [{ userAgent: '*', allow: '/', disallow: ['/api/', '/write', '/signin', '/signup', '/embed'] }],
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
