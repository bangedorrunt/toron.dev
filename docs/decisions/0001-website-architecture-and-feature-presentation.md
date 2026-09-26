# ADR-0001: toron.dev Website Architecture and Feature Presentation

**Status:** Accepted (2026-08-13)
**Renumbered:** moved from toron repo `ADR-0013` → toron.dev repo `ADR-0001`
(2026-08-14). Website decisions live in the site repo; toron repo retains a
pointer in its decisions index.
**Scope:** toron.dev marketing site, docs, and feature-visualization strategy
**Research basis:** forensic teardowns of swarmtools.ai (Next.js + Fumadocs + Tailwind + Vercel) and herdr.dev (Astro + Starlight + Cloudflare), conducted via 3-agent flywheel research swarm
**Decided via:** 2-round captain grilling (11 decisions locked)

## Context

toron has no web presence. The product is a **durable, cryptographically-signed
coordination + collaboration layer for agent swarms** built on Nostr — 38 MCP
tools, a Resonate-backed durable workflow engine, @mention job dispatch, debate,
crew steering, file reservations, build slots, a Git archive system-of-record,
and federation. flywheel orchestrates swarms on top. The full feature surface
(14 subsystems) is more complex than any comparable product's website handles.

Two reference sites were forensically analyzed:

- **swarmtools.ai** (Joel Hooks, OpenCode swarm plugin): Next.js 15 + Fumadocs +
  Tailwind v4 + Vercel. Dark neutral-950 + amber/honey. The defining pattern:
  **ASCII-art architecture diagrams** (`<pre>` monospace, zero-asset) showing
  coordinator→workers→hive topology. Problem→Solution red/amber color split.
  Numbered single-page onboarding. Kleppmann authority quote. No social proof.
  Minimal sitemap.

- **herdr.dev** (Can Celik, terminal multiplexer for agents, 28k stars, YC F26):
  Astro 5 + Starlight + Pagefind + Cloudflare. Paper-light `#f0eee9` + electric
  blue. The defining patterns: **interactive terminal mock as hero** (clickable
  panes, "it's a live layout, not an image"), **live stats band** (pulsing-dot
  stars/installs/plugins), **top-level `/compare` page** (honest 9-tool matrix),
  **agent-first onboarding** (`/agent-guide.md` — the user's existing agent reads
  it and sets up its own mailbox), **semantic state-glyph vocabulary**
  (`● working · ○ idle · ◉ blocked · done`), **self-referential dogfooding**
  (hero mock edits itself), and **positioning enforced everywhere** ("the
  runtime, not another window").

toron is neither a **tool** (swarmtools: coordination primitives) nor a
**runtime** (herdr: terminals that stay open). toron is the **transport + trust
+ record layer underneath the swarm** — the mailbox agents talk through, the
identity they sign with, the workflow engine that survives crashes, the archive
that proves what happened. The website's job: make a protocol feel like a
product, and make 14 subsystems legible in 30 seconds.

## Decision

### D1 — Positioning: "Mail for machines."

toron's hero headline is `Mail for machines.` The mailbox is the primary product
surface; crash-survivable workflows and the audit archive are backstops.
toron's refrain, enforced in every section: **"the mailbox is the transport,
not an app."** MCP clients are just clients; toron is the system of record.

Rejected alternatives: "The mailbox is the missing layer" (abstract, harder to
grasp cold); "Agents die. Their mail doesn't." (aggressive, narrows to
durability); "Where agents talk" (reads reactive to herdr's "where do agents
run?").

### D2 — Visual language: dark-first + Nostr violet

> **Amended 2026-09-26 by ADR-0004 D1/D2.** The palette below is superseded:
a near-black canvas (`#08090A`) with an indigo accent (`#5E6AD2`), and Inter
for both display and body (Space Grotesk dropped). `--toron-violet` is renamed
`--toron-accent`. The state-glyph system, the ink/paper split, the CSS-only
motion rule, and the `--toron-*` namespace all remain in force.

Dark `#0a0a0f` background, Nostr violet `#8b5cf6` primary accent. State-glyph
system:

```
✉ sealed (E2E)   ✓ delivered   ✓✓ acked   ○ pending
◉ blocked        ↻ resumed      ✖ rejected
```

Color tokens:

```
--toron-bg: #0a0a0f  --toron-violet: #8b5cf6  --toron-green: #34d399
--toron-amber: #f59e0b  --toron-red: #f87171  --toron-ink: #f5f3ff
--toron-body: #a3a3b8  --toron-border: #26262e  --radius: 6px  --max: 1160px
```

Typography: **Space Grotesk** (display headings), **JetBrains Mono** (terminal,
code, stats, diagrams), **Inter** (body).

Signature motifs: (1) sealed envelope `✉` as logo/divider/favicon/badge; (2)
ASCII topology strips between sections; (3) state glyphs; (4) violet glow
(`blur-3xl from-violet-500/10`) behind hero; (5) CSS-only motion (pulsing dots,
envelope arrival, hover glow — no Framer Motion / GSAP).

An **ink/paper toggle** (herdr's shared dark/light storage-key pattern) provides
accessibility — dark is the ground truth, paper is the light variant.

**Rationale:** herdr's paper-light was a differentiation move against a
dark-terminal field; toron differentiates against herdr. Nostr tooling is
dark-first; `#8b5cf6` violet is the de-facto Nostr identity color. Protocol-night
is honest for a crypto-signed product. State glyphs pop on dark; they wash out
on paper.

### D3 — Tech stack: Next.js 15 + Fumadocs + Tailwind v4 + Vercel

| Layer | Choice | Why |
|---|---|---|
| Framework | Next.js 15 (App Router, Turbopack, RSC) | Rich client interactivity for the kill-the-daemon hero demo (React state machine). RSC streaming, Turbopack. |
| Docs | Fumadocs | ⌘K search, reading progress, sidebar, version dropdown, i18n, Shiki code blocks. Proven on swarmtools.ai. |
| CSS | Tailwind CSS v4 | Design tokens (`--toron-*`), utility velocity. Shared token file between marketing + docs. |
| Diagrams | Mermaid.js in-browser + pre-rendered SVG fallback | Mermaid for sequence/state diagrams (protocol flows); SVG fallback for crawlers/OG images (fixes herdr's JS-only plugins gap). |
| ASCII art | Static `<pre>` blocks (swarmtools pattern) | Topology snapshots, install output, logos. Zero-asset, on-brand. |
| Fonts | Space Grotesk + JetBrains Mono + Inter | Mono-forward identity from both references; Space Grotesk = crypto/modern display face. |
| Hosting | Vercel | swarmtools-proven. Deployment hashes, edge, analytics-ready. |
| Analytics | Plausible (self-hosted) | Privacy-aligned with an E2E-encrypted product. |
| Schema | JSON-LD `SoftwareApplication` + `WebSite` + `FAQPage` | swarmtools pattern; fix herdr's thin SEO footprint. |
| i18n | EN primary; ja + zh-cn deferred | Agent-automation audiences are global; ship after EN copy stable. |

**Rejected:** Astro + Starlight (crew 3 recommendation — simpler, Cloudflare-native,
but static-first model fights the kill-the-daemon demo's client-side state
needs). The captain chose Next.js for the richer client interactivity the hero
demo demands.

### D4 — Hero demo: kill-the-daemon (crash → resume)

> **Amended 2026-09-26 by ADR-0004 D4.** The simulated daemon remains, but it is
demoted from sole hero to the crash-recovery section figure. The hero is now a
claim, the four-plane lede, and a rendered mailbox surface.

The hero visual is a **simulated React state machine** rendering a toron serve
terminal:

- Terminal pane titled `toron serve · bus: 3 agents · 0 egress`
- Sealed envelopes `✉` arriving between `pi` and `opencode` panes
- A workflow pane hits an approval gate → **CRASH** (red flash) → daemon
  restarts → `↻ resumed` (green)
- Live counters: `messages sent · workflows resumed after crash`
- Self-referential (herdr dogfooding pattern): the mock's own task is "mail the
  site agent: ship the new build"

**Why simulated, not real:** a real embedded daemon requires an always-on
backend, safety review of what visitors see, and uptime guarantees. A
deterministic state machine ships fast, has no security surface, and looks real.
Upgrade path to a real daemon stream is documented as a v2 option.

### D5 — flywheel scope: section of toron.dev (superseded by ADR-0003 on 2026-09-25)

> ADR-0003 expands the public site from a toron-first section model to a four-plane stack model. The visual language, dark-first palette, abstraction ladder, and build-time Mermaid rules below remain in force.

flywheel is presented as a **section of toron.dev**, not a separate site. A
**layer-ownership table** on `/architecture` explains who-owns-what:

| Concern | Owned by |
|---|---|
| Mailbox, transport, identity, archive | **toron** |
| Spawn, dispatch, monitor, durable loop | **flywheel** |
| Beads / backlog | br/bv |
| Orchestration vocab (profiles, squads, workflows, cron, coalitions) | **flywheel** (over toron) |

flywheel gets its own `/architecture#flywheel` explainer + the durable-loop
diagram (Diagram E), but the brand is unified under toron.dev.

### D6 — Crypto depth: trust badge on landing, deep crypto on /security

The landing page shows **only**: a "sealed ✉" badge, "the relay never sees
plaintext" copy, and the gift-wrap unwrap concept in the compare matrix. Deep
cryptography (Schnorr math, NIP-49 KDF, key derivation, operator-key model) lives
entirely on the **/security** page — a toron-unique page neither competitor can
have.

**Rationale:** showing keys/key-gen on the landing page risks intimidating
non-crypto devs. The E2E guarantee is the differentiator; the mechanism is the
proof — they belong on different surfaces.

### D7 — Tool docs: grouped sidebar, tool-per-page

Fumadocs sidebar with **9 grouped sections**: Identity (6) · Messaging (5) ·
Contacts (4) · File-reservations (5) · Search (2) · Macros (4) · Product-bus
(5) · Build-slots (3) · Infrastructure (4). Each of the 38 tools gets one page
with: input/output schema, code example, AM-Rust parity note. A parity grid on
`/docs/reference` shows all 38 × 4 harnesses.

### D8 — Compare page: 5-way, honest one-liners

`/compare` is a **top-level nav item** (herdr pattern). 5 columns: swarmtools ·
herdr · mcp_agent_mail_rust (AM-Rust — the parity target) · plain-MCP memory
tools · no-coordination baseline. Unique rows: E2E at rest, crash-survivable
logic, crypto-native identity, auditable archive, federation, harness parity.
Honest one-liners per cell (herdr "categories, not enemies" tone): "swarmtools
coordinates parallel work; it doesn't carry encrypted mail." "herdr holds
terminals open; toron carries the messages and workflows inside them. They
compose."

### D9 — Voice: solo founder

First-person, opinionated, memorable (herdr's Can Celik pattern). Blog titles:
"Your agents have no memory of each other." · "We killed our own daemon in
production. Nothing was lost. That's the product." · "Why the receipt is the
proof."

### D10 — Feature visualization: the abstraction ladder

> **Amended 2026-09-26 by ADR-0004 D3.** The ladder survives as information
> architecture. What changes is the rendering: each layer is presented as a
> numbered section carrying a server-rendered product surface. Mermaid is now
> reserved for protocol behavior; ASCII strips are retired as a primary visual.

toron's 14 features are organized into **6 layers**, one diagram per layer,
progressive disclosure. Every page deep-links up/down the ladder. The visitor
can stop at any layer with a complete mental model.

| Layer | Question | Features | Primary visual |
|---|---|---|---|
| 0 · Problem | "Why does this exist?" | — | Problem/solution color split |
| 1 · Message | "How do agents talk?" | Mailbox (1), @mention (4) | Diagram B (sequence) + envelope motif |
| 2 · Trust | "How do I know it's real + private?" | Identity (2), Federation (12) | Gift-wrap unwrap + zero-egress badge |
| 3 · Process | "How does work survive?" | Workflows (3), Debate (5), flywheel (13) | Diagrams C, E, F |
| 4 · Coordination | "How do agents share safely?" | Steering (6), Reservations (7), Slots (8), Contacts (9), Products (10) | Diagram G + policy matrix + slot locks |
| 5 · Permanence | "What's the record?" | Archive (11) | Diagram H (dual recovery) |
| 6 · Compatibility | "Will it run with what I have?" | MCP parity (14) | Harness logos + parity grid |

**The 8 mermaid diagrams** (inline in /how-it-works, pre-rendered SVG fallback):

- **A** — Architecture stack: agents → MCP → toron-core (bus + nostr + index) → workflow + jobs; archive + relays; flywheel on top
- **B** — Message flow: agentA → sign → NIP-17 gift-wrap → bus → deliver → agentB → receipt → reply (sequenceDiagram)
- **C** — Durable workflow lifecycle: trigger → running → suspended (approval/crash) → resumed → completed (stateDiagram)
- **D** — @mention job race: sender → 43001 → announce → two agents claim → first-claimer-wins (43004) → loser rejected → complete (43006) (sequenceDiagram)
- **E** — flywheel durable loop: spawn → poll → dispatch → watch → crash → resume → dedup → coalitions (flowchart)
- **F** — Debate flow: proposition → rounds 1..N → judge → verdict → ack (flowchart)
- **G** — File reservation lifecycle: intent → soft-conflict → held → renew → release (stateDiagram)
- **H** — Dual-recovery: live bus + Git archive + crash path → rebuild from git → replay → converge (flowchart)

ASCII topology strips (swarmtools S1 pattern) are used for "at a glance" layer
overviews; mermaid is used for stateful protocol flows ASCII can't express.
**ASCII = topology, mermaid = behavior.**

### D11 — Build order

| Phase | Deliverable |
|---|---|
| 1 | Landing: hero mock + Diagrams A/B/C + stats band + 6-step install arc + problem/solution split |
| 2 | Fumadocs scaffold: Getting Started, Concepts, Tools (38 in 7 groups), Workflows, Jobs, Ops |
| 3 | /how-it-works: all 8 mermaid diagrams + micro-demos |
| 4 | /security (trust story) + /compare (5-way) + /features (14-feature index) |
| 5 | /blog + /roadmap + /agent-guide.md + install.sh + /faq |
| 6 | i18n (ja, zh-cn) — deferred |

### D12 — Site map

```
toron.dev/
├── /              Landing — hero mock + problem/solution + 6-step install + 5 feature sections
├── /features      14-feature index, 5 pillars (Trust · Process · Coordination · Scale · Orchestration)
├── /architecture  Stack diagram + abstraction ladder + layer-ownership table (toron vs flywheel vs br/bv)
├── /how-it-works  8 mermaid diagrams + micro-demos
├── /compare       5-way matrix (swarmtools · herdr · AM-Rust · plain-MCP · baseline)
├── /security      Trust story: gift-wrap, key handling, zero-egress, operator key, audit, dual-recovery
├── /docs          Fumadocs reference (Getting Started · Concepts · Tools · Workflows · Jobs · Ops · Recipes · ADRs · FAQ)
├── /blog          Founder voice
├── /roadmap       Honest future (federation on, workflow gallery, relay presets)
├── /agent-guide.md  Agent-first onboarding (plain markdown — agent reads it, sets up its mailbox)
├── install.sh     ASCII-art installer + latest.json version manifest
└── /faq           Objections
```

Nav: `toron · Docs · How it works · Features · Compare · Blog` + right cluster:
`@npub`, ink/paper toggle, GitHub (live stars), `Install` (→ #install).

### D13 — What the site will NOT do

- No redacted-teaser sections (herdr's section 05 — ages badly; /roadmap is
  honest instead).
- No pricing page (MIT + Apache; the license IS the pricing — state it in the
  hero).
- No 38-tool dump on the homepage (three hero tools max; rest in grouped docs).
- No JS-only content without SSR/static fallback (diagrams pre-rendered; listings
  server-rendered).
- No claims without a demo — every differentiator gets a visual that runs in the
  page.

## Consequences

- **toron gets a first-class web presence** that positions it as the trust +
  transport layer, distinct from both swarmtools (primitives) and herdr
  (runtime). The kill-the-daemon hero demo makes crash-survivability visceral
  — toron's strongest differentiator — within 5 seconds of landing.
- **Next.js + Fumadocs** is a heavier build than Astro, but the client-side
  interactivity for the hero mock justifies it. Maintenance cost: one framework,
  one Vercel deployment, one design-token file shared between marketing + docs.
- **flywheel's breadth is partially subordinated** to toron's mailbox narrative
  (section of toron.dev). If flywheel's orchestration story grows, ADR-0004
  (flywheel) documents the spin-out path to flywheel.dev.
- **Solo founder voice** requires a designated writer for blog posts. If no one
  writes, the blog stays empty and the founder-voice positioning weakens.
- **Mermaid in-browser** means diagram rendering requires JS. Pre-rendered SVG
  fallbacks mitigate crawlers/no-JS, but add a build step (diagram → SVG at
  build time).
- **Simulated daemon mock** is a credibility risk if visitors detect it's canned.
  The upgrade path to a real embedded daemon stream is documented (v2).

## Verification

```bash
# Phase 1 (landing + hero):
# - `npm run dev` boots Next.js + Fumadocs locally
# - Landing page renders: hero mock (kill-the-daemon animation plays), problem/solution
#   split, 6-step install arc, Diagrams A/B/C as mermaid (rendered + SVG fallback)
# - Lighthouse: LCP < 2.5s, no layout shift from hero animation
# - ink/paper toggle persists via localStorage

# Phase 2 (docs):
# - Fumadocs sidebar shows 7 groups, 38 tool pages
# - ⌘K search returns results for tool names
# - Each tool page has: inputSchema, outputSchema, example, parity note

# Phase 3 (how-it-works):
# - All 8 mermaid diagrams render (A-H)
# - Each diagram has a "run it" micro-demo
# - SVG fallback exists for each (view-source on no-JS)

# Phase 4 (security + compare + features):
# - /compare renders 5-column matrix with honest one-liners
# - /security covers: gift-wrap, NIP-49, zero-egress, operator key, dual-recovery
# - /features shows 14 features in 5 pillars, each with its visual pattern

# Cross-cutting:
# - Dark theme default; violet #8b5cf6 primary; state glyphs render correctly
# - JSON-LD validates (SoftwareApplication + WebSite + FAQPage)
# - Plausible analytics loads (no GA)
# - Vercel deployment succeeds; HTTPS; og:image renders
```

## Open questions

1. **Domain:** toron.dev availability (assumed throughout).
2. **Hosted relay:** roadmap item, or strictly local-first forever? (Affects
   /roadmap + federation visual.)
3. **Analytics consent:** Plausible self-hosted acceptable?
4. **Blog cadence:** who writes, how often?

## More information

- Research artifacts (removed from repo after ADR consolidation; summarized
  herein): swarmtools.ai teardown, herdr.dev teardown, competitive synthesis
  with all 8 mermaid diagrams.
- Companion ADR: flywheel ADR-0004 (flywheel's web presence as a section of
  toron.dev + the spin-out path).
