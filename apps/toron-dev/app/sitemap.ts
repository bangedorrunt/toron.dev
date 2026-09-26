import type { MetadataRoute } from "next";
import { absoluteUrl } from "@/lib/shared";
import { source } from "@/lib/source";

// governed-by: ADR-0005 D3
//
// Only the marketing routes are listed by hand, because their change frequency
// and priority are editorial judgements. Every docs URL is derived from the
// source tree, so a guide, a plane section, or a generated tool page lands in
// the sitemap by existing. This file used to hand-list docs URLs and had
// already fallen behind by the four plane pages.
const routes: [string, MetadataRoute.Sitemap[number]["changeFrequency"], number][] = [
  ["", "weekly", 1],
  ["/architecture", "monthly", 0.8],
  ["/how-it-works", "monthly", 0.8],
  ["/features", "monthly", 0.7],
  ["/security", "monthly", 0.8],
  ["/compare", "monthly", 0.7],
  ["/roadmap", "monthly", 0.6],
  ["/faq", "monthly", 0.6],
  ["/blog", "weekly", 0.6],
  ["/agent-guide.md", "monthly", 0.8],
];

export default function sitemap(): MetadataRoute.Sitemap {
  const marketing = routes.map(([route, changeFrequency, priority]) => ({
    url: absoluteUrl(route),
    changeFrequency,
    priority,
  }));

  // The walkthroughs are the pages that move most, so they outrank the
  // reference material. Everything the source exposes is listed; a page that
  // renders but is not here is drift the build gate now fails on.
  const docs = source.getPages().map((page) => ({
    url: absoluteUrl(page.url),
    changeFrequency: page.url.includes("/guides/") ? ("weekly" as const) : ("monthly" as const),
    priority: page.url === "/docs" ? 0.9 : page.url.startsWith("/docs/tools") ? 0.5 : 0.8,
  }));

  return [...marketing, ...docs];
}
