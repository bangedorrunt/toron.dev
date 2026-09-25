# toron.dev

Marketing + docs site for **toron** (Nostr-native agent mailbox), **flywheel**
(swarm orchestration), **beads** (work evidence), and **chiebukuro** (knowledge
and memory). Together they form a fully autonomous multi-agent workflow stack.
"Mail for machines."

Sites-monorepo per [ADR-0002 D2](docs/decisions/0002-site-repo-spec-sync-and-hosting.md):

```
toron.dev/
├── apps/
│   └── toron-dev/          # Vercel project #1 (Root Directory) — the site
├── packages/
│   └── tokens/             # shared --toron-* design tokens (ADR-0001 D2)
├── catalog/                # tool/CLI surface catalogs (generated — see ADR-0002 D3)
├── scripts/
│   └── sync-catalogs.sh    # pull catalogs from product repos
├── .agents/skills/          # dogfooded agent skills (see .agents/skills/README.md)
├── docs/decisions/         # ADR-0001 (architecture) + ADR-0002 (repo/sync/hosting)
└── .flywheel/              # swarm plans
```

## Stack (ADR-0002 D6 — supersedes ADR-0001 D3)

Next.js 16.3.x (App Router, Turbopack, React 19.2) · Fumadocs v16 ·
Tailwind CSS v4.3 · Mermaid at build time (rehype-mermaid → inline SVG, zero
client JS) · Vercel Web Analytics · Vercel Hobby → Pro on triggers.

## The one rule

Tool schemas, command names, and counts are **never hand-typed**. They come
from generated catalogs (ADR-0002 D3/D4). If it's not in the catalog, it's not
on the site.
