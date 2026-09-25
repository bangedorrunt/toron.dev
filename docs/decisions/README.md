# Architecture Decision Records (ADR)

This repo's decisions. Website-scope ADRs were **moved from the toron repo
and renumbered** on 2026-08-14 — site decisions live in the site repo.

| ID | Title | Status |
| :--- | :--- | :--- |
| [0001](0001-website-architecture-and-feature-presentation.md) | toron.dev Website Architecture and Feature Presentation | **Accepted** (2026-08-13; was toron ADR-0013; 11 decisions via 2-round captain grilling; dark + Nostr violet; Next.js + Fumadocs; kill-the-daemon hero; flywheel as section; companion flywheel ADR-0004) |
| [0002](0002-site-repo-spec-sync-and-hosting.md) | toron.dev Site Repository, Spec-Sync Pipeline, and Hosting Tier | **Accepted** (2026-08-14; generated catalogs + CI freshness gates; **product scope superseded by ADR-0003**; **amends ADR-0001 D3** — Next 16.3.x, Fumadocs v16, build-time mermaid, Vercel Web Analytics) |
| [0003](0003-autonomous-agent-stack-site.md) | Present toron.dev as the Autonomous Agent Stack | **Accepted** (2026-09-25; toron + flywheel + beads + chiebukuro; four-plane autonomous workflow) |
| [0002 appendix](0002-vercel-hobby-facts.md) | Vercel Hobby Tier Facts | research-verified 2026-08-14 |

## Cross-repo ADRs referenced here

- **toron repo** `docs/decisions/` — product decisions (ADR-0015 integration
  contract, ADR-0007 parity freeze, etc.)
- **flywheel repo** `docs/decisions/0004-flywheel-web-presence.md` — flywheel's
  section of toron.dev + the spin-out path (references pre-move ADR numbering:
  "toron ADR-0013" = this repo's ADR-0001)

## Amendment policy

Stack/copy changes to the site amend ADR-0001 via new ADRs here (see ADR-0002
D6 for the precedent). The D3 stack table in ADR-0001 is **superseded by
ADR-0002 D6** — read them together.
