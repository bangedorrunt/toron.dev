# SWARM PLAN — toron.dev scaffold (2026-08-14)

Captain: bangedorrunt. Crews: 4 opencode agents. Project mailbox: `toron`.
Specs: `docs/decisions/0001-*.md` (site spec) + `docs/decisions/0002-*.md`
(repo/sync/hosting, **D6 = effective stack**). Rules: `AGENTS.md` (read first —
includes the skills contract: named skill BEFORE matching work).

Product repos (read-only reference): `~/workspace/toron`, `~/workspace/flywheel`.

## Lanes

### Lane 1 — App bootstrap (blocking for lanes 2+3)
- pnpm workspace root + `apps/toron-dev`: create-next-app **Next.js 16.3.x**
  (App Router, TS, Turbopack), pin exact versions.
- Fumadocs **v16** (`fumadocs-ui`, `fumadocs-mdx`, `fumadocs-core`) wired to
  `app/docs`; Tailwind **v4.3** with `@theme` importing
  `packages/tokens`.
- Build-time mermaid: `rehype-mermaid` + `mermaid-isomorphic` (inline SVG
  strategy) in the MDX pipeline; Playwright/Chromium as devDependency for CI.
- Fonts via `next/font/google`: Space Grotesk (display), JetBrains Mono
  (terminal/code), Inter (body). If the Next 16.2.x Turbopack font bug bites:
  pin the working exact version or fall back to `next/font/local` — note it
  in the PR.
- `vercel.json` with Root Directory `apps/toron-dev` + Ignored Build Step
  path filter (site repo only rebuilds on `apps/**`, `packages/**`,
  `catalog/**` changes).
- **Done =** `pnpm install && pnpm build` green at repo root; `/docs` renders
  a Fumadocs shell page.

### Lane 2 — Tokens + design system (after lane 1)
- `packages/tokens`: the ADR-0001 D2 token set verbatim
  (`--toron-bg #0a0a0f`, `--toron-violet #8b5cf6`, green/amber/red/ink/body/
  border/radius/max) as a Tailwind v4 `@theme` CSS file + TS export.
- Dark default + ink/paper toggle (localStorage, `class` strategy).
- State-glyph component set (✉ ✓ ✓✓ ○ ◉ ↻ ✖) per ADR-0001 D2.
- Base components: Terminal pane, ASCII `<pre>` strip, sealed-envelope badge,
  violet-glow hero backdrop. CSS-only motion (pulse, envelope arrival).
- **Read `.agents/skills/ui-ux-pro-max/SKILL.md` first** for accessibility/contrast
  rules on dark bg.
- **Done =** tokens package consumed by app; toggle persists; glyphs render.

### Lane 3 — Docs scaffold + tool-page generator (after lane 1)
- Fumadocs sidebar with the ADR-0001 D7 groups (Identity 6 · Messaging 5 ·
  Contacts 4 · File-reservations 5 · Search 2 · Macros 4 · Product-bus 5 ·
  Build-slots 3 · Infrastructure 4).
- Tool-page generator: reads `catalog/toron-mcp.json` → one page per tool
  (input/output schema tables, example, parity note) + `/docs/reference`
  parity grid. Schema-rendering is generic over the JSON — NO tool name or
  schema hand-typed anywhere (grep-clean rule in AGENTS.md).
- Orama search wired (Fumadocs built-in; zero external service).
- **Read `.agents/skills/next-best-practices` + `.agents/skills/vercel-react-best-practices`
  first.**
- **Done =** stub catalog's 2 tools generate pages; adding a tool to the
  catalog JSON produces its page on next build; ⌘K finds it.

### Lane 4 — Catalog pipeline (independent; touches toron repo + site repo)
- toron repo: `toron catalog` subcommand (or test-emitted artifact) emitting
  `docs/catalog/toron-mcp.json` per the contract in
  `toron.dev/catalog/README.md` — all 38 tools with input/output JSON
  schemas verbatim from the `#[tool]` definitions + the 25 resources + CLI
  `Command` enum. governed-by marker: ADR-0016 → cite
  `// governed-by: toron.dev ADR-0002`.
- Freshness gate: cargo test regenerates + diffs — fails red on surface
  change without regen (fmt --check pattern).
- Site repo: `scripts/sync-catalogs.sh` (git clone --depth 1 of product
  repos → copy catalogs → verify `tools.length == 38`).
- **Done =** real 38-tool catalog lands in `toron.dev/catalog/`; the toron
  CI gate exists and passes; lane 3's generator consumes it green.

## Coordination

- Mail via toron (project `toron`). Reserve files before editing
  (`flywheel mail reserve`). Blocked → mail captain with T-code.
- Lanes 2+3 start after lane 1 reports done via mail.
- Commit style: conventional commits. Never touch `.agents/skills/` contents.
- Do NOT edit `docs/decisions/` — specs are captain-frozen.
