import type { MetadataRoute } from 'next';

// Per-route change frequency and priority, rather than one default for
// everything: the walkthroughs and the landing page are the pages that move.
const routes: [string, MetadataRoute.Sitemap[number]['changeFrequency'], number][] = [
  ['', 'weekly', 1],
  ['/architecture', 'monthly', 0.8],
  ['/how-it-works', 'monthly', 0.8],
  ['/features', 'monthly', 0.7],
  ['/security', 'monthly', 0.8],
  ['/compare', 'monthly', 0.7],
  ['/roadmap', 'monthly', 0.6],
  ['/faq', 'monthly', 0.6],
  ['/blog', 'weekly', 0.6],
  ['/agent-guide.md', 'monthly', 0.8],
  ['/docs', 'weekly', 0.9],
  ['/docs/guides', 'weekly', 0.9],
  ['/docs/guides/first-signed-handoff', 'weekly', 0.9],
  ['/docs/guides/run-a-swarm-loop', 'weekly', 0.8],
  ['/docs/guides/crash-recovery', 'weekly', 0.8],
  ['/docs/guides/close-with-evidence', 'weekly', 0.8],
  ['/docs/reference', 'weekly', 0.7],
];

export default function sitemap(): MetadataRoute.Sitemap {
  const base = 'https://toron.dev';
  return routes.map(([route, changeFrequency, priority]) => ({
    url: `${base}${route}`,
    changeFrequency,
    priority,
  }));
}
