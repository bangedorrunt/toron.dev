// Vercel's build image is Amazon Linux 2023 without the NSS libraries
// Playwright's bundled Chromium links against, so rehype-mermaid cannot launch
// the browser Playwright downloads there (libnspr4.so missing). @sparticuz/chromium
// ships an AL2023-compatible Chromium plus those libraries; extracting it is not
// enough on its own, because the package sets LD_LIBRARY_PATH in this process
// while the browser launches in `next build`. The sidecar carries both the
// launcher path and those environment values.
//
// Runs only on Vercel; local builds keep Playwright's own Chromium.
import { writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

// Kept in sync with source.config.ts (both read this one path).
const sidecarPath = join(tmpdir(), 'toron-dev-vercel-chromium.json');

if (!process.env.VERCEL) {
  console.log('[vercel-chromium] not a Vercel build, keeping Playwright Chromium');
  process.exit(0);
}

const { default: chromium } = await import('@sparticuz/chromium');
const executablePath = await chromium.executablePath();
// Importing the package fills these in (setupLambdaEnvironment). Without them
// the loader cannot find the AL2023 libraries and Chromium exits 127.
const env = {
  LD_LIBRARY_PATH: process.env.LD_LIBRARY_PATH,
  FONTCONFIG_PATH: process.env.FONTCONFIG_PATH,
  HOME: process.env.HOME,
};
writeFileSync(sidecarPath, JSON.stringify({ executablePath, args: chromium.args, env }));
console.log(
  `[vercel-chromium] extracted ${executablePath} (${chromium.args.length} serverless args, LD_LIBRARY_PATH=${String(env.LD_LIBRARY_PATH)})`,
);
