# ADR-0003: Present toron.dev as the Autonomous Agent Stack

**Status:** Accepted (2026-09-25)

**Scope:** toron.dev public positioning, navigation, information architecture, and the relationship between toron, flywheel, beads, and chiebukuro.

## Context

The site began as a toron-first product page. The product has since grown into a stack of cooperating planes:

- **toron** carries signed mail, identity, receipts, reservations, and durable records.
- **flywheel** turns goals into crews, workflows, loops, and autonomous execution.
- **beads** records work, dependencies, verification gates, and close evidence.
- **chiebukuro** supplies durable knowledge and memory when the swarm needs to remember more than a mailbox can hold.

These projects are not four unrelated products. They are the planes of one fully autonomous multi-agent workflow: intent becomes a plan, the plan becomes claimed work, agents communicate through toron, flywheel keeps the system moving, beads preserve accountability, and chiebukuro compounds what the swarm learns.

The previous site decisions treated flywheel as a section and explicitly deferred chiebukuro. The public experience no longer matches that boundary. The site must show the complete stack without hiding the ownership boundaries between planes.

## Decision

### D1 — Stack-first positioning

The homepage presents toron.dev as **the autonomous agent stack**. The product headline remains **“Mail for machines.”** because the mailbox is still the clearest entry point, but the supporting positioning is:

> **The mailbox is the transport. The stack is what keeps the work moving.**

The site must show all four planes and their boundaries, not imply that every capability belongs to toron.

### D2 — Four planes, one execution loop

The primary visual and explanatory model is:

```text
goal → flywheel plans/dispatches → beads claims/verifies
  → toron carries signed work + receipts → chiebukuro recalls/compounds
  → evidence returns to the next planning cycle
```

The ownership table is canonical:

| Concern | Primary plane |
| --- | --- |
| Mail, identity, receipts, reservations, archive | toron |
| Spawn, dispatch, loops, workflows, cron, coalitions | flywheel |
| Work items, dependencies, gates, close evidence | beads |
| Curated knowledge, episodic memory, synthesis | chiebukuro |

### D3 — Public pages explain the whole loop

The public information architecture includes `/architecture`, `/how-it-works`, `/features`, `/security`, `/compare`, `/roadmap`, `/faq`, and `/agent-guide.md`. The landing page links to the full stack instead of presenting a single-product funnel.

### D4 — One canonical source per fact

- Product schemas, tool names, resources, and CLI counts come from generated catalogs.
- Product behavior and operator procedures remain canonical in each product repository, especially `toron/docs/guides`.
- The site renders a selected public projection or links back to the canonical guide. It never becomes a second hand-maintained product manual.
- Stack counts and boundaries are labeled when parity, additive tools, or snapshot freshness differ.

### D5 — Preserve the existing site constraints

Next.js 16.3.x, Fumadocs v16, Tailwind 4.3, build-time Mermaid, the locked toron design tokens, Vercel Web Analytics, and the sites-monorepo layout remain in force. The redesign changes the story and page coverage, not the deployment or product ownership model.

## Options considered

### Option A — Keep toron-only landing pages and add four unrelated product links

Rejected. It preserves the current page structure but hides the system-level value and makes autonomous execution look like a collection of tools.

### Option B — Build four separate microsites

Rejected. It duplicates navigation, identity, visual language, and documentation drift while weakening the fact that the planes compose.

### Option C — One stack-first site with explicit plane ownership

Selected. It preserves one coherent product experience while keeping each plane’s boundary truthful.

## Consequences

- The homepage and architecture page need a stack-first information model.
- The navigation and landing copy must mention all four planes.
- A guide-sync projection is needed for canonical product documentation.
- The site can no longer claim that chiebukuro is out of scope. ADR-0001 D5 and ADR-0002 D1 are superseded on that point.
- The site must distinguish “toron has 38 parity tools” from “the toron repository exposes 40 MCP tools including additive tools” wherever a count is shown.

## Implementation plan

- Add a shared marketing site layout for all non-docs routes.
- Add `/architecture`, `/features`, `/compare`, `/security`, `/roadmap`, `/faq`, `/blog`, and `/agent-guide.md` routes.
- Add `/how-it-works` with the eight build-time Mermaid diagrams from ADR-0001.
- Replace the toron-only hero support copy with the four-plane stack and execution-loop narrative.
- Remove the framer-motion dependency; use CSS-only motion to satisfy ADR-0001 D2.
- Add a public guide projection or canonical-guide links with a freshness check before publishing snapshots.
- Add route-level smoke checks for every public nav destination.
- Keep generated tool pages and catalog counts in `apps/toron-dev/scripts/generate-tool-docs.mjs` and `catalog/`.

## Verification

- [x] `npx pnpm@11.21.0 build` is green.
- [x] `npx pnpm@11.21.0 --filter toron-dev lint` is green.
- [x] Every top-level navigation destination returns a successful response.
- [x] `/architecture` names all four planes and states ownership boundaries.
- [x] `/how-it-works` contains eight build-time Mermaid diagrams.
- [x] No page imports `framer-motion` or ships client-side Mermaid.
- [ ] Guide freshness checks distinguish the toron 40-tool product surface from the 38-tool parity catalog.
- [x] The site copy never presents chiebukuro or beads as capabilities owned by toron.

## Implementation evidence

- 2026-09-25: `npx pnpm@11.21.0 build` completed with 61 generated routes, including 38 tool pages, the stack pages, `/opengraph-image`, `/sitemap.xml`, and `/robots.txt`.
- 2026-09-25: `npx pnpm@11.21.0 --filter toron-dev lint` and `git diff --check` completed cleanly.
- 2026-09-25: HTTP smoke checks returned 200 for every public route and static asset, `/api/search` returned a static search index, `install.sh` passed `sh -n`, and `latest.json` parsed as JSON.
- The guide source remains canonical in `toron/docs/guides`; this site links to it rather than duplicating the manuals. A future public projection can add a freshness gate when the product repository exposes a stable site-sync contract.
- The current generated catalog carries an AM-Rust parity string, not a four-harness matrix. The site does not invent harness status that the product catalog does not provide.
