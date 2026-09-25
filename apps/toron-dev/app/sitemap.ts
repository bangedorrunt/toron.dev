import type { MetadataRoute } from 'next';

const routes = [
  '',
  '/architecture',
  '/how-it-works',
  '/features',
  '/security',
  '/compare',
  '/roadmap',
  '/faq',
  '/blog',
  '/agent-guide.md',
];

export default function sitemap(): MetadataRoute.Sitemap {
  const base = 'https://toron.dev';
  return routes.map((route) => ({ url: `${base}${route}`, changeFrequency: route === '' ? 'weekly' : 'monthly', priority: route === '' ? 1 : 0.7 }));
}
