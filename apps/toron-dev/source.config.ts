import { defineConfig } from "fumadocs-mdx/config";
import { rehypePele } from "./lib/rehype-pele";

export default defineConfig({
  mdxOptions: {
    // Prepend so mermaid fenced blocks become inline, themed SVG before the
    // fumadocs code plugin touches them.
    rehypePlugins: (plugins) => [[rehypePele, {}], ...plugins],
  },
});
