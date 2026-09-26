// Vercel's build image is Amazon Linux 2023 without the NSS libraries
// Playwright's bundled Chromium links against, so rehype-mermaid cannot launch
// the browser Playwright downloads there (libnspr4.so missing). @sparticuz/chromium
// ships an AL2023-compatible Chromium plus those libraries (bin/al2023.tar.br).
// Extract it and hand the launcher config to source.config.ts through a sidecar
// file, which keeps that config synchronous and bundler-safe.
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
writeFileSync(sidecarPath, JSON.stringify({ executablePath, args: chromium.args }));
console.log(
  `[vercel-chromium] extracted ${executablePath} (${chromium.args.length} serverless args)`,
);
