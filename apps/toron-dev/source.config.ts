import { existsSync, readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { defineConfig } from 'fumadocs-mdx/config';
import rehypeMermaid, { type RehypeMermaidOptions } from 'rehype-mermaid';

// Vercel's build image ships no NSS libraries for Playwright's Chromium, so its
// build extracts @sparticuz/chromium first (scripts/vercel-chromium.mjs) and
// leaves this sidecar naming the launcher. Reading a file keeps this config
// synchronous; local builds find no sidecar and use Playwright's own Chromium.
const chromiumSidecar = join(tmpdir(), 'toron-dev-vercel-chromium.json');

function mermaidOptions(): RehypeMermaidOptions | undefined {
  if (!existsSync(chromiumSidecar)) {
    return undefined;
  }
  const { executablePath, args } = JSON.parse(readFileSync(chromiumSidecar, 'utf8')) as {
    executablePath: string;
    args: string[];
  };
  // The AL2023 libraries sit next to the binary and are found through the
  // loader path, matching @sparticuz/chromium's setupLambdaEnvironment.
  process.env.LD_LIBRARY_PATH = dirname(executablePath);
  return { launchOptions: { executablePath, args } };
}

export default defineConfig({
  mdxOptions: {
    // Prepend so mermaid fenced blocks become inline SVG before the
    // fumadocs code plugin touches them (ADR-0002 D6: build-time mermaid).
    rehypePlugins: (plugins) => [[rehypeMermaid, mermaidOptions()], ...plugins],
  },
});
