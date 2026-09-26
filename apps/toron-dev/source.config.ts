import { existsSync, readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { defineConfig } from 'fumadocs-mdx/config';
import rehypeMermaid, { type RehypeMermaidOptions } from 'rehype-mermaid';

// Vercel's build image ships no NSS libraries for Playwright's Chromium, so its
// build extracts @sparticuz/chromium first (scripts/vercel-chromium.mjs) and
// leaves this sidecar naming the launcher plus the environment Chromium needs.
// Reading a file keeps this config synchronous; local builds find no sidecar
// and use Playwright's own Chromium.
const chromiumSidecar = join(tmpdir(), 'toron-dev-vercel-chromium.json');

interface ChromiumSidecar {
  executablePath: string;
  args: string[];
  env: { LD_LIBRARY_PATH?: string; FONTCONFIG_PATH?: string; HOME?: string };
}

function mermaidOptions(): RehypeMermaidOptions | undefined {
  if (!existsSync(chromiumSidecar)) {
    return undefined;
  }
  const { executablePath, args, env } = JSON.parse(
    readFileSync(chromiumSidecar, 'utf8'),
  ) as ChromiumSidecar;
  // Chromium finds its AL2023 libraries (tmpdir()/al2023/lib) and fonts through
  // these; the package computes them, the script passes them through.
  for (const [key, value] of Object.entries(env)) {
    if (value) {
      process.env[key] = value;
    }
  }
  return { launchOptions: { executablePath, args } };
}

export default defineConfig({
  mdxOptions: {
    // Prepend so mermaid fenced blocks become inline SVG before the
    // fumadocs code plugin touches them (ADR-0002 D6: build-time mermaid).
    rehypePlugins: (plugins) => [[rehypeMermaid, mermaidOptions()], ...plugins],
  },
});
