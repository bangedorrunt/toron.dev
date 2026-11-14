# ADR-0011: A quiet application interface, not a hacker-night theme

**Status:** Accepted (2026-11-14)
**Scope:** The site's palette values, density, structural surfaces, chrome, and command interaction.
**Amends:** ADR-0004 D1 (palette values), D3/D4 (rendering grammar and hero composition).
**Supersedes:** ADR-0010 D1–D3 (depth layers and the particle field). ADR-0010 D4/D5 (the morph and the icon set) remain in force.
**Retains:** ADR-0007's motion scale, ADR-0004 D2 (Inter throughout), and every design-token, catalog, and guide-projection rule from ADR-0002/0003/0006.

## Context

ADR-0004 moved the site to Linear's palette and type, then rendered it with the
opposite instincts: a blue-black canvas, a fixed indigo bloom, a parallax grid, a
particle canvas, window traffic lights, rounded cards for every content block, and
a centered marketing hero with oversized type. The result was Linear *colors* on a
hacker-night *interface*.

The request for this change was explicit: reproduce the discipline behind the
reference, not its hues. Calm, dense, precise, keyboard-first, low-noise. Hierarchy
from typography, spacing, opacity, tonal contrast, and position — not from
containers, shadows, gradients, or accent paint. Every element that can be removed
without reducing usability should be removed.

## Decision

### D1 — Neutral graphite, one restrained accent, muted semantics

The palette is retuned away from blue-black and saturated status paint:

```
ink (dark, ground truth)
--toron-bg            #0B0C0E      --toron-ink            #F4F5F6
--toron-surface       #111214      --toron-body           #9A9EA6
--toron-raised        #17181B      --toron-muted          #7B7F87
--toron-overlay       #1C1E22      --toron-border         #24262B
--toron-accent        #6E79D6      --toron-border-strong  #35383F
--toron-accent-bright #A0A8F5
--toron-green         #63A98A      --toron-amber          #C8A75F      --toron-red #C97C7C
```

The accent is one indigo, used for active navigation, focus, selection, links, and
the primary action. Status colour is semantically meaningful but desaturated, so a
red gate row reads as a state rather than an alarm. Paper remains the accessibility
variant, re-derived from the same neutral hues.

### D2 — Density is a token system, not a per-page judgment

The site uses a 4px base scale (`4/8/12/16/20/24/32/40`), a 30px control height, a
34px list row, a 26px small control, and 6px/8px radii (4px for chips and keys).
Type is compact: 13–15px body, 11–13px metadata, section headings around 1.3–1.7rem,
display headings around 2.15–3.35rem with tight negative tracking. Large headings
inside application screens are rejected; the landing display is the one place a
larger size is allowed, and even there it is smaller than ADR-0004's.

### D3 — Structure is hairline and whitespace; cards are exceptional

Content sections are separated by a 1px border and 32–56px of space. Capability
blocks, install steps, feature groups, FAQ rows, API rows, and product surfaces are
flat rows or columns with a top hairline — not rounded cards with their own
background. The elevated surface is reserved for popovers and dialogs. The fixed
bloom, parallax grid, CTA glow, particle canvas, hover rake, and window traffic
lights are removed. The product window keeps one 30px bar, a 5px accent glyph, a
mono title, and a right-aligned meta line.

### D4 — The command menu is a first-class surface

`⌘K` / `Ctrl+K` opens a grouped command palette from any route. `/` opens it when
the reader is not typing. Arrows move, Enter runs, Escape closes, Home/End jump.
Rows are 32px and grouped as Navigate, Planes, Documentation, Actions; documentation
entries are fetched from a statically generated `/search-index.json` on first open
so the client bundle does not carry every page title. The palette exposes page
navigation, the four plane pages, the docs entry points, a copy-install action, and
the repository. The trigger lives in the nav and shows its shortcut inline.

### D5 — One docs chrome, mapped to the site tokens

Fumadocs' `--color-fd-*` variables are mapped onto the `--toron-*` tokens instead of
shipping a second palette. The docs nav is 48px, links are 12px, rows are 28px, and
the prose column is capped at 820px. Fumadocs' own search provider is disabled and
its theme toggle is hidden: the command menu and the site toggle already own those
actions, and two controls for one job is the noise this ADR exists to remove.

### D6 — Motion stays, decoration does not

The motion scale from ADR-0007 is retained, as are the hover veil, the view
transition, and the reduced-motion guard. Parallax, the depth blooms, and the
particle field are removed with their elements. The issue board now reads as a
grouped list rather than a four-column card board.

### D7 — Marketing pages use the same dense grammar as the product figures

The landing hero is a two-column composition: claim and actions on the left, a
server-rendered product surface on the right. The capability index is a two-column
table of 8rem label / description rows. Install steps are single 40px rows with the
command in mono. Closing links are full-width rows with a hairline separator. The
board figure groups ready, in-progress, blocked, and closed into one list with
34px rows, state glyphs, and a small chip.

## Consequences

- `apps/toron-dev/components/particle-field.tsx` is deleted. The CTA imports no
  client canvas and no longer pays for one.
- `apps/toron-dev/scripts/render-strip.mjs` no longer asserts depth or particle
  properties; its character, morph, and icon checks remain valid.
- The command menu introduces one client component that is present on every route.
  It ships the static command list and fetches the docs index lazily.
- The docs shell's vendor search provider is disabled and its theme control is
  hidden. The `/api/search` index remains available to machine consumers; the
  command palette intentionally indexes titles and descriptions, not page bodies.
- The palette values are an amendment, not a new design system: `--toron-*` remains
  the only namespace and `packages/tokens` remains the only source.

## Verification

```bash
bun run --filter toron-dev format          # 0
bun run --filter toron-dev lint            # 0 errors (69 remaining warnings)
cd apps/toron-dev && bun run build         # 0; 216/216 static pages
```

By inspection:

- No `toron-bg__*`, `toron-cta__particles`, `toron-home__pill`, or primary-button
  rake selector survives in `app/global.css` or any component.
- The built home HTML contains `toron-cmd-trigger`, `toron-index__row`, and
  `toron-steps__row`, and exactly one command dialog.
- The built docs HTML contains the command trigger and no visible vendor search or
  theme toggle.
- No new palette namespace: only `--toron-*` and the mapped `--color-fd-*`.
