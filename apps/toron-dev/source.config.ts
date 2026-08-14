import { defineConfig } from 'fumadocs-mdx/config';
import rehypeMermaid from 'rehype-mermaid';

export default defineConfig({
  mdxOptions: {
    // Prepend so mermaid fenced blocks become inline SVG before the
    // fumadocs code plugin touches them (ADR-0002 D6: build-time mermaid).
    rehypePlugins: (plugins) => [rehypeMermaid, ...plugins],
  },
});
