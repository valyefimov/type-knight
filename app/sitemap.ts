import type { MetadataRoute } from 'next';
import { CHALLENGES } from '@/lib/challenges';

const SITE_URL = 'https://type-knight.vercel.app';

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    { url: SITE_URL, changeFrequency: 'weekly', priority: 1 },
    ...CHALLENGES.map((c) => ({
      url: `${SITE_URL}/quest/${c.slug}`,
      changeFrequency: 'monthly' as const,
      priority: 0.7,
    })),
  ];
}
