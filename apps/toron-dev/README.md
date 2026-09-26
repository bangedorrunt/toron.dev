# toron-dev

The toron.dev marketing + docs site (Next.js App Router, Fumadocs, Tailwind).
This directory is the Vercel project's Root Directory, so Vercel commands run
from here and `vercel.json` at the repo root is read for the project.

## Dev

The toolchain is pinned by mise at the repo root (Node 26.10.0, bun 1.4.2):

```bash
mise install   # once
bun install
bun run dev       # http://localhost:3000
bun run build     # must be green before pushing
bun run lint      # oxlint
bun run format    # oxfmt
```

`bun run build` runs the prebuild chain first: `scripts/generate-tool-docs.mjs`
(generates the tool pages from `catalog/`), `scripts/check-guides.mjs`, and
`playwright install chromium` for build-time mermaid.

## Deploys

Pushes to `main` deploy production through the Vercel Git integration, and pull
requests get preview deployments. Production serves at
<https://toronmail.vercel.app>.

Two Vercel-image specifics worth knowing:

- Builds run on Amazon Linux 2023, which lacks the NSS libraries Playwright's
  Chromium needs. `scripts/vercel-chromium.mjs` extracts `@sparticuz/chromium`
  and leaves a sidecar that `source.config.ts` reads to launch mermaid
  rendering.
- `vercel.json`'s `ignoreCommand` skips builds whose diff misses the app,
  package, and catalog paths.

Manual fallback when the Git integration is unavailable: `vercel deploy --prod`.
