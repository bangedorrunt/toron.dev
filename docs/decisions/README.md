# Architecture Decision Records (ADR)

This repo's decisions. Website-scope ADRs were **moved from the toron repo
and renumbered** on 2026-08-14 — site decisions live in the site repo.

| ID                                                                      | Title                                                           | Status                                                                                                                                                                                                     |
| :---------------------------------------------------------------------- | :-------------------------------------------------------------- | :--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| [0001](0001-website-architecture-and-feature-presentation.md)           | toron.dev Website Architecture and Feature Presentation         | **Accepted** (2026-08-13; was toron ADR-0013; 11 decisions via 2-round captain grilling; dark + Nostr violet; Next.js + Fumadocs; kill-the-daemon hero; flywheel as section; companion flywheel ADR-0004)  |
| [0002](0002-site-repo-spec-sync-and-hosting.md)                         | toron.dev Site Repository, Spec-Sync Pipeline, and Hosting Tier | **Accepted** (2026-08-14; generated catalogs + CI freshness gates; **product scope superseded by ADR-0003**; **amends ADR-0001 D3** — Next 16.3.x, Fumadocs v16, build-time mermaid, Vercel Web Analytics) |
| [0003](0003-autonomous-agent-stack-site.md)                             | Present toron.dev as the Autonomous Agent Stack                 | **Accepted** (2026-09-25; toron + flywheel + beads + chiebukuro; four-plane autonomous workflow)                                                                                                           |
| [0004](0004-linear-grade-site-and-walkthrough-guides.md)                | Linear-grade Site and Walkthrough Guides                        | **Accepted** (walkthrough shape: one outcome, numbered steps, real output, a named failure mode per step)                                                                                                  |
| [0005](0005-canonical-origin-and-machine-readable-docs.md)              | Canonical Origin and Machine-Readable Docs                      | **Accepted** (canonical origin; `/llms.txt`, `/llms-full.txt`, `/docs/:slug*.md`, `/api/mcp`)                                                                                                              |
| [0006](0006-project-product-guides-into-the-site.md)                    | Project Product Guides into the Site                            | **Accepted** (44 guides projected from the product repos, hash-locked in `catalog/guides.lock.json`)                                                                                                       |
| [0007](0007-motion-scale-and-native-effect-vocabulary.md)               | Motion Scale and Native Effect Vocabulary                       | **Accepted** (reduced-motion is a separate concern, not a smaller version of the same animation)                                                                                                           |
| [0008](0008-bun-oxlint-oxfmt-toolchain.md)                              | bun, oxlint, and oxfmt as the Site Toolchain                    | **Accepted** (2026-09-27; **amends ADR-0002 D6** for package manager, linter, and formatter; coverage measured, not assumed)                                                                               |
| [0009](0009-the-characters-travel-and-the-motion-runtime-is-adopted.md) | The Four Characters Travel, and the Motion Runtime Is Adopted   | **Accepted** (2026-09-27; **supersedes ADR-0007 D6** — the richness condition D6 wrote for itself; marketing routes +37.3–37.4 KB gzipped, docs +0, measured)                                              |
| [0010](0010-depth-particles-and-a-morph-that-plays-on-the-click.md)     | Depth, Particles, a Morph That Plays on the Click, and an Icon Set | **Accepted** (2026-09-27; **amends ADR-0009 D5** — the soft navigation now morphs, timed by React's `<ViewTransition>`, and the frame wait that made the first attempt hang is measured; depth is zero-byte CSS, particles +0.7 KB, the morph 0 KB, and the apple touch icon was being built but never linked)                                              |
| [0002 appendix](0002-vercel-hobby-facts.md)                             | Vercel Hobby Tier Facts                                         | research-verified 2026-08-14                                                                                                                                                                               |

## Cross-repo ADRs referenced here

- **toron repo** `docs/decisions/` — product decisions (ADR-0015 integration
  contract, ADR-0007 parity freeze, etc.)
- **flywheel repo** `docs/decisions/0004-flywheel-web-presence.md` — flywheel's
  section of toron.dev + the spin-out path (references pre-move ADR numbering:
  "toron ADR-0013" = this repo's ADR-0001)

## Amendment policy

Stack/copy changes to the site amend ADR-0001 via new ADRs here (see ADR-0002
D6 for the precedent). The D3 stack table in ADR-0001 is **superseded by
ADR-0002 D6** — read them together. The package manager, linter, and formatter
rows are **superseded by ADR-0008**.

An ADR's `## Verification` section is a record of what was run when the
decision was accepted, including the command as it was written then. Later
toolchain ADRs change the command; the historical line stays as written.

A superseded decision is **left in place**, not edited: its measurement is the
record of what was true when it was made. ADR-0007 D6 declined the Motion
library on measured bytes and named the condition that would reverse it; the
condition was met, so ADR-0009 supersedes that decision and leaves the numbers
that were true then exactly as they were written.

An **amended** decision is left in place too, for the same reason: ADR-0009 D5
recorded the morph as playing only on a document navigation, with the measurement
behind it. ADR-0010 D4 closes that limit and keeps the record of the limit as it
was.
