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
`scripts/check-freshness.mjs`. Mermaid fences render through Pele at build time;
no browser install is required.

## Deploys

Pushes to `main` deploy production through the Vercel Git integration, and pull
requests get preview deployments. Production serves at
<https://toronmail.vercel.app>.

One Vercel-image specific worth knowing:

- `vercel.json`'s `ignoreCommand` skips builds whose diff misses the app,
  package, and catalog paths.

Manual fallback when the Git integration is unavailable: `vercel deploy --prod`.
