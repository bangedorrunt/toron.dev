import { createMDX } from 'fumadocs-mdx/next';

const withMDX = createMDX();

/** @type {import('next').NextConfig} */
const config = {
  reactStrictMode: true,
  // governed-by: ADR-0005 D2
  //
  // The public Markdown spelling of a docs page is its own URL plus `.md`, so
  // `/docs/toron.md` is the page an agent can fetch. The second rule covers
  // the docs index, which has no slug segment and would otherwise be the one
  // page in the tree with no Markdown URL.
  //
  // getPageMarkdownUrl builds the destination spelling of these same routes,
  // so the button a reader clicks and the route that answers cannot drift.
  async rewrites() {
    return [
      { source: '/docs/:slug*.md', destination: '/llms.mdx/docs/:slug*/content.md' },
      { source: '/docs.md', destination: '/llms.mdx/docs/content.md' },
    ];
  },
};

export default withMDX(config);
