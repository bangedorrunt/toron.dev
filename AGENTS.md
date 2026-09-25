# toron.dev — Agent Instructions

Marketing + docs site for the autonomous agent stack: toron, flywheel, beads, and chiebukuro. Sites-monorepo, Vercel-hosted.

**Current scope:** toron owns signed transport and records, flywheel owns orchestration, beads owns work evidence, and chiebukuro owns knowledge and memory. ADR-0003 supersedes the earlier toron-only scope on this point.

**Generated:** 2026-08-14
**Repo:** bangedorrunt/toron.dev

## READ BEFORE ANY WORK

1. `docs/decisions/0001-website-architecture-and-feature-presentation.md`
   — the site spec (13 decisions: positioning, visual language, hero, sitemap).
2. `docs/decisions/0002-site-repo-spec-sync-and-hosting.md` — repo strategy,
   drift prevention, hosting. **D6 amends 0001's D3 stack table** — the
   effective stack is Next.js 16.3.x + Fumadocs v16 + Tailwind 4.3 +
   build-time mermaid + Vercel Web Analytics.
3. `.agents/.agents/skills/README.md` — the dogfooded skills index. **MUST read the named
   skill before the matching work** (below).

## SKILLS CONTRACT (dogfooded — read before matching work)

| Work | Read first |
|---|---|
| ANY Next.js code (files, routes, RSC, data, metadata) | `.agents/skills/next-best-practices/SKILL.md` |
| ANY React component / perf-sensitive code | `.agents/skills/vercel-react-best-practices/SKILL.md` |
| UI structure, color/typography/spacing choices, visual polish | `.agents/skills/ui-ux-pro-max/SKILL.md` |
| Caching / cacheComponents / PPR / partial prefetching (Next 16) | `.agents/skills/next-cache-components-adoption/`, `.agents/skills/next-partial-prefetching-adoption/` |
| Dev-loop discipline (build/test/lint cycle) | `.agents/skills/next-dev-loop/SKILL.md` |

Design tokens + brand language are LOCKED by ADR-0001 D2 — `--toron-*`
tokens, dark `#0a0a0f` default, Nostr violet `#8b5cf6`, state glyphs,
Space Grotesk / JetBrains Mono / Inter. Do not invent a second palette.

## STRUCTURE

- `apps/toron-dev/` — the Next.js app (Vercel Root Directory)
- `packages/tokens/` — design tokens, shared marketing + docs
- `catalog/` — GENERATED tool/CLI surface JSON. Never hand-edit. `catalog/
  toron-mcp.json` shape is the contract consumed by the tool-page generator
  (ADR-0002 D3/D4).
- `scripts/sync-catalogs.sh` — pull fresh catalogs from product repos
- `.agents/skills/` — dogfooded agent skills (do not modify; upstream installs)

## HARD RULES

- **No hand-typed schemas.** Tool pages generate from `catalog/`. If the
  catalog lacks a field, fix the extractor in the product repo, not the site.
- **No second design system.** Everything consumes `packages/tokens`.
- **Pin exact versions** in `apps/toron-dev/package.json` (Next 16.2.x had a
  Turbopack font-resolution bug — pin + test font builds; fallback
  `next/font/local`).
- Mermaid renders at BUILD time (rehype-mermaid, inline SVG). Never ship
  client-side mermaid for static diagrams.
- Analytics = Vercel Web Analytics only (ADR-0002 D6). No GA, no cookies,
  no consent banner.
- Product repos (toron, flywheel) never carry website code (ADR-0002 D2).
- i18n deferred: EN only until copy stabilizes (ADR-0001 D3).

## CREW CONDUCT (2026-08-14 swarm lessons — binding)

- **Blocked = mail the captain and STOP.** Never stub, fake, or placeholder an
  artifact to get past a blocker. A sync that cannot fetch its upstream is a
  BLOCKER, not an excuse to commit `{"tools":[{"name":"x"}}`.
- **Done-reports carry evidence**: the exact command you ran + its result
  (build/test/preview). Commit messages state verified evidence, never intent.
- **Consumer lanes validate against the producer's REAL artifact** (mailed or
  committed) before reporting done. Stubs and seed files don't count. If the
  producer isn't done, wait or mail them — do not assume the interface.
- Commit messages: no semicolons (the toron repo shell guard rejects them).

## COMMANDS

```bash
pnpm install && pnpm build     # apps/toron-dev build must be green
pnpm dev                       # local dev
scripts/sync-catalogs.sh       # refresh catalogs from product repos
```

## BUILD PHASES (ADR-0001 D11)

Phase 1 landing → Phase 2 docs scaffold → Phase 3 how-it-works →
Phase 4 security/compare/features → Phase 5 blog/roadmap/agent-guide →
Phase 6 i18n (deferred). See `.flywheel/SWARM-PLAN.md` for current lanes.
