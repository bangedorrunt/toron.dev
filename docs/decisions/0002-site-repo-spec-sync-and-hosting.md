// governed-by: ADR-0001, toron ADR-0015

# ADR-0002: toron.dev Site Repository, Spec-Sync Pipeline, and Hosting Tier

**Status:** Accepted (2026-08-14)
**Renumbered:** moved from toron repo `ADR-0016` → toron.dev repo `ADR-0002`
(2026-08-14). Vercel Hobby facts appendix moved alongside as
`0002-vercel-hobby-facts.md`.
**Related:** ADR-0001 (website architecture — this ADR operationalizes it),
toron ADR-0015 (flywheel↔toron boundary), flywheel ADR-0004 (flywheel section + spin-out path)
**Decided via:** round-3 captain grilling (5 decisions locked + 4 research-forced ADR-0001 D3 amendments)

## Context

ADR-0001 locked the site's architecture (Next.js 15 + Fumadocs + Tailwind v4 +
Vercel, toron-first positioning, flywheel as a section). Three operational
questions remained open:

1. **Product scope.** The captain maintains ≥3 products (toron, flywheel,
   chiebukuro). flywheel's section status (ADR-0001 D5) rests on a hard
   dependency: flywheel is meaningless without toron's transport. chiebukuro
   shares **no dependency** with toron — its spine is Resonate + QMD, not Nostr
   mail. A toron.dev section for chiebukuro would break the rationale D5 was
   built on.
2. **Repository strategy.** Where does site code live: inside a product repo,
   or a new dedicated repo? (1 Vercel project = 1 repo or repo subdir.)
3. **Spec/API drift.** toron already runs a *manual* 5-surface sync contract
   (Command enum → MCP `#[tool]` → AGENTS.md → SKILL.md → tool-count constant).
   It exists precisely because manual sync drifts. The website is surface #6.
   Hand-maintained docs would guarantee the failure mode.

## Decision

### D1 — Product scope: toron + flywheel only; chiebukuro deferred (superseded by ADR-0003 on 2026-09-25)

> ADR-0003 expands the public site to present toron, flywheel, beads, and chiebukuro as four planes of one autonomous agent stack. The generated-catalog and site-repository decisions below remain in force.

The original ADR-0002 scope was **toron + flywheel only**. It deferred
chiebukuro because chiebukuro did not share toron’s transport dependency at
that time. ADR-0003 supersedes that product-scope decision: the site now
presents toron, flywheel, beads, and chiebukuro as four planes of one
autonomous stack. The original funnel rationale is retained here as history,
not as the current site boundary.

A standalone chiebukuro site remains a later spin-out option when its external
audience warrants it.

### D2 — Site code: new dedicated repo, sites-monorepo layout

A new repo `toron.dev`, sibling of toron/flywheel. The Vercel project imports
this repo. **Product repos never carry website code or web commits.**

Layout is a sites-monorepo from day one, so the flywheel.dev spin-out
(flywheel ADR-0004 §4) is a new Vercel project + Root Directory switch, not a
code move:

```
toron.dev/                  # the repo
├── apps/
│   └── toron-dev/          # Vercel project #1 (root dir) — this site
├── packages/
│   └── tokens/             # shared --toron-* design tokens (ADR-0001 D2)
├── catalog/                # vendored fallback snapshots (see D3)
└── scripts/sync-catalogs   # pull catalogs from product repos
```

### D3 — Drift prevention: generated catalogs + CI freshness gates

The website never hand-copies a tool schema, command name, or count. The
pipeline:

1. **Each product repo emits a committed machine-readable catalog** of its
   public surface:
   - **toron** → `toron catalog` (subcommand or test-emitted artifact,
     `docs/catalog/toron-mcp.json`): all 38 MCP tools (name, description,
     input/output JSON schema) + the 25 resources + the CLI `Command` enum.
     The 38 names remain frozen per ADR-0007 C3 / the parity catalogs.
   - **flywheel** → equivalent catalog of its CLI commands + workflow YAML
     schema (triggers × actions).
2. **Product CI freshness gate** (the `cargo fmt --check` pattern): a test
   regenerates the catalog and diffs against the committed copy. A surface
   change without a catalog regen is **unmergeable**. Drift cannot land.
3. **Site build fetches catalogs at build time** from the product repos
   (raw.githubusercontent, pinned to branch head). No human copy step. The
   `catalog/` snapshots in the site repo are a build fallback only.
4. **Rebuild wiring:** product-repo CI pings the site's Vercel Deploy Hook
   when `docs/catalog/**` changes → site rebuilds with fresh schemas within
   minutes. Nightly scheduled rebuild as the belt-and-braces fallback.
5. **Long-term (explicit goal):** the same catalogs become the generator
   source for `SKILL.md` / AGENTS.md surface tables — collapsing the manual
   5-surface contract into one generated surface consumed by docs, skill, and
   site.

### D4 — Tool reference: generate-embed

ADR-0001 D7's 38 tool pages and the `/docs/reference` parity grid are
**generated from the catalogs at build time** (schema, example, parity note).
Hand-written prose is limited to concepts, guides, and narratives. Schemas are
never typed by hand on the site — if it's not in the catalog, it's not on the
site.

### D5 — Hosting: Vercel Hobby now, Pro on documented triggers

Vercel **Hobby** (free) from day one. Upgrade to Pro ($20/mo) when **any**
trigger fires:

- **T1 — Commercial use:** anything monetized runs on the site (ToS: Hobby is
  non-commercial; an OSS product marketing site is gray — the moment it stops
  being gray, pay).
- **T2 — Quota pressure:** sustained >50% of any Hobby quota (bandwidth,
  image optimization, function hours) for 2 consecutive months.
- **T3 — Feature ceiling:** a launch-blocking feature exists only on Pro
  (e.g. team features, higher concurrency).

Tier facts (limits, ToS wording, deploy-hook/API availability) are recorded in
[0002-vercel-hobby-facts.md](0002-vercel-hobby-facts.md), research-verified
2026-08-14, and re-checked when a trigger is evaluated.

### D6 — ADR-0001 D3 amendments (research-verified 2026-08-14)

> The framework, docs, diagram, and analytics rows below stand. The package
> manager, linter, and formatter are **superseded by ADR-0008** (bun, oxlint,
> oxfmt).

Research crews (VercelPlatform2, StackCurrency2) found ADR-0001's D3 stack
row stale one day after acceptance. Amended:

| D3 row | Was | Now | Why |
|---|---|---|---|
| Framework | Next.js 15 | **Next.js 16.3.x** | 15.x = maintenance LTS, EOL 2026-10-21; Turbopack default+stable in 16; ships React 19.2 |
| Docs | Fumadocs (unversioned) | **Fumadocs v16 (16.14.x)** | v16 peer-deps REQUIRE Next 16 + React ^19.2 + Tailwind ^4 — "Next 15 + latest Fumadocs" was already incompatible |
| Diagrams | Mermaid in-browser + SVG fallback | **Mermaid at build time** (rehype-mermaid + mermaid-isomorphic → inline SVG) | Zero client JS; SVG fallback inherent; dodges the 5K/mo image-optimization quota. Cost: Playwright + Chromium in CI (~12s for 32 diagrams, cacheable) |
| Analytics | Plausible self-hosted | **Vercel Web Analytics free** (captain-locked) | Plausible CE needs Docker + ClickHouse + 2 GB RAM; no free PaaS home (Fly.io free tier gone; Vercel runs no stateful services). Vercel WA: cookieless, no consent banner, 50K events/mo = 5× projected traffic, 1-month reporting window, no custom events on Hobby |

Verified current, unchanged: Tailwind v4.3.3 (`@theme` stable), next/font
self-hosting (watch the Next 16.2.x Turbopack font-resolution bug — pin the
exact Next version), JSON-LD, i18n.

Analytics revisit trigger: custom events needed, or sustained >50K events/mo
→ self-hosted Plausible on owned infra (Oracle Always Free or a small VPS).

## Consequences

- **One more repo** (`toron.dev`) with its own CI; product repos gain a
  catalog extractor + freshness test (small, mechanical, governed-by-marked).
- **Drift is structurally impossible**: unmergeable in product repos (CI
  gate), un-staleable on the site (build-time fetch + deploy hook).
- **chiebukuro has no separate web presence** until its trigger fires; it is
  currently represented as the knowledge and memory plane inside the stack
  site under ADR-0003.
- The flywheel.dev spin-out path (flywheel ADR-0004 §4) becomes cheap: new
  Vercel project, same repo, shared `packages/tokens`.
- SKILL.md manual sync remains the known-drift surface until D3.5 lands;
  the pipeline is designed to absorb it.

## Vercel Hobby facts (research-verified 2026-08-14)

Verdict: **Hobby is sufficient** for a static-heavy docs site at <10k
pageviews/mo. Full numbers, the non-commercial ToS wording, and the three
binding constraints (fair-use markers, 100 GB FDT pause-not-bill overflow,
1 concurrent build + 100 deployments/day) live in
[0002-vercel-hobby-facts.md](0002-vercel-hobby-facts.md).

## Verification

```bash
# Build-phase gates (checked when the site repo + extractors ship):
#
# toron repo:
#   cargo test catalog_freshness        # RED if surface changed without regen
#   toron catalog --json | jq '.tools | length'   # == 38
#
# site repo (apps/toron-dev):
#   npm run build                       # succeeds; 38 tool pages generated
#   # no hardcoded tool names outside generated output:
#   ! grep -rn 'acknowledge_message' apps/toron-dev/content --include='*.mdx'
#
# deploy wiring:
#   curl -X POST "$VERCEL_DEPLOY_HOOK"  # product CI on docs/catalog/** change
#
# tier:
#   # T1/T2/T3 triggers recorded here; evaluate on any quota warning email
```
