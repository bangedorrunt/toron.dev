import type { MetadataRoute } from 'next';
import { absoluteUrl } from '@/lib/shared';

// governed-by: ADR-0005 D1 — the origin comes from the one constant, never a
// literal here. This file used to name a domain that serves a different
// product, which sent crawlers to an unrelated Mac app.
export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: '*', allow: '/' },
    sitemap: absoluteUrl('/sitemap.xml'),
  };
}
