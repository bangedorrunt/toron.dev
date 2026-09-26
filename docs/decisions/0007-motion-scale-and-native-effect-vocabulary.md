# ADR-0007: A motion scale and an effect vocabulary, in CSS

**Status:** Accepted (2026-09-27)
**Scope:** How motion behaves on toron.dev, and which runtime pays for it.

**Depends on:** ADR-0001 D2 (the `--toron-*` token lock and the state glyph language), ADR-0002 D6 (the effective stack), ADR-0006 (the guides now projected into `/docs`, which is why that tree is worth animating).

## Context

The site had motion, in the sense that it had transitions. It did not have a motion *system*. Measured across the whole stylesheet, before any change: **six transition rules, two durations (0.15s and 0.18s), one easing curve, and no tokens for any of them.**

Four defects followed from that, and only the first is the kind you notice.

**1. There was no scale, so there was no vocabulary.** Two durations cannot express a difference between a control responding to a press and a page arriving. Every timing in the site was a guess that happened to be adjacent to another guess.

**2. All six transitions animated paint properties.** `background-color`, `border-color`, `color`. These are the expensive ones. Each frame of a border-colour transition asks the compositor for a new raster of the element, its border, and everything that overlaps it, and none of that work is guaranteed off the main thread. The site was paying main-thread layout-and-paint cost for effects that did not need it.

**3. The crash cycle, which is the best idea here, was enacted in the weakest available vocabulary.** The hero daemon runs a twelve-second loop: steady work, a crash, a restart, a resume. The three interesting transitions — crash, restart, resume — were **all cross-fades on opacity alone**. So a crash, a recovery from a crash, and a clean resume were visually identical events. The one place the site spends a viewer's full attention for twelve continuous seconds was the one place it had nothing to say.

**4. The loop was ungated and it decayed.** It ran whether or not anyone was looking at it, and its 12s cycle meant that a reader who arrived mid-loop saw an arbitrary phase of it.

There was also a standing question in the request that this decision has to answer on the record, because it is a real trade and not an obvious one: **should this use the Motion library (Framer Motion's successor, `motion` for React)?** It is the standard answer, it would have done most of this work, and it is still the wrong answer here. D6 says why, with numbers.

## Decision

### D1 — Motion gets tokens, in `packages/tokens`, next to the colour tokens

```
--toron-dur-instant: 90ms    --toron-dur-fast:   150ms
--toron-dur-base:   220ms    --toron-dur-slow:   380ms
--toron-dur-ambient: 12s

--toron-ease-standard: cubic-bezier(0.2, 0, 0, 1)
--toron-ease-enter:    cubic-bezier(0, 0, 0.2, 1)
--toron-ease-exit:     cubic-bezier(0.4, 0, 1, 1)
--toron-ease-settle:   cubic-bezier(0.22, 1, 0.36, 1)
--toron-ease-stepped:  steps(1, end)
```

Five durations and five curves, chosen by what the motion *means*: `enter` decelerates into a place, `exit` accelerates out of one, `settle` overshoots slightly because something has landed, `standard` is the honest default, and `stepped` is the honest admission that a state change can be a cut.

The counts are low deliberately. A scale with thirty steps is not a scale, it is a list, and it makes every choice a negotiation. These five are enough to say "response", "transition", "arrival", "landing", and "this is ambient and not a transition at all".

Existing timings are converted to tokens, including `.toron-toggle`, which had its own three-property rule.

### D2 — Hovers animate only what the compositor can animate for free

The `transition-property` for every interactive surface is now `opacity`, full stop. Border and background changes are carried by a pseudo-element layer instead.

Each hoverable surface gets a single `::after` — a "veil" — holding `border: 1px solid var(--toron-veil-border)` and `background: var(--toron-veil-wash)`, at `z-index: -1` under an `isolation: isolate` parent. Hovering fades the veil in. The paint cost lands once, on a layer the compositor already has, and the transition itself is a compositor property.

The surfaces and what each veil carries:

| surface | border | wash | note |
|---|---|---|---|
| `.toron-btn` | yes | yes | full lift |
| `.toron-home__pill` | yes | no | a `color` transition is kept, deliberately: the pill's identity *is* its colour, and a coloured chip going colourless is a worse affordance than one border |
| `.toron-stack-strip__item` | no | yes | |
| `.toron-card--link` | yes | yes | |

This is written as **one selector list**, not as per-element classes. `toron-btn` appears 53 times across 10 files; a variant class would have had to be added 53 times to fix a property the selector could set once.

The two remaining paint transitions in the stylesheet — `.toron-home__pill` and `.toron-toggle` — are named here so a later reader does not "fix" them.

### D3 — The crash cycle speaks in space, not in opacity

The three events now have three different vocabularies, so they cannot be confused:

- **crash** — a decaying three-step lateral jolt (`-3px`, `+2px`, `-1px`) on `linear` timing. A crash is an impulse with friction, and the decaying amplitude says the energy is dissipating. A cross-fade said only "something changed".
- **restart** — a `scaleX(0 → 1)` wipe from `transform-origin: left center` on `--toron-ease-enter`. The process starts again *from the left*, which is what a restarting process does.
- **resume** — arrives from `translateY(6px)` with a 1px overshoot on `--toron-ease-settle`. Work settling back into place.
- **steady** — unchanged, deliberately. It is the baseline the other three are read against.

### D4 — The loop is gated on visibility, by one observer, and nothing else

`components/cycle-gate.tsx` is a `'use client'` component that renders a single hidden `<span>`. It attaches **one** `IntersectionObserver` (`rootMargin: '120px 0px'`) to the nearest `section` and sets `data-cycle="running" | "idle"` on the host. One rule pauses the five hero animations when the hero is off screen.

`animation-play-state`, not `animation: none`, because a paused animation resumes at the phase it was paused at. Removing the animation would restart the crash from the top, which reads as a second crash.

The hero stays a **server component**. Promoting it to a client component to host the observer would ship its entire tree — the four workflow lines, the status text, the glyphs — as JavaScript to save one attribute flip. The gate is separated precisely so that is not forced.

### D5 — Route transitions come from `@view-transition`, at zero bytes

`@view-transition { navigation: auto }` asks the browser to snapshot the outgoing and incoming documents and animate between them on every same-origin navigation. It is a **cross-document** feature, so it covers Next.js navigations with no client component, no router hook, and no JavaScript.

The default cross-fade is left almost alone. A route change is a change of page, and a page change that swoops draws attention to itself rather than to the content that arrived. Only the direction and the pace are tuned, from the D1 scale, so it reads as the same site turning a page.

### D6 — Scroll-linked reveals are `@supports`-gated, and the Motion library is declined

`@supports (animation-timeline: view())` reveals content as it enters the viewport, on `animation-range: entry 0% cover 32%`, with `.toron-grid > *` staggered by 4% per child so a group arrives as a group.

**Scroll-driven animation is supported in Chrome and Safari 26. Firefox is the holdout.** So `@supports` is not decoration here, it is the whole fallback strategy: a browser without it renders the final state, which for a content site is the correct behaviour and not a degraded one. A reader who never sees a reveal still sees all the content.

Every selector in that block was checked against a real class in a real component before being written. An earlier draft named `.toron-home__section`, which matches nothing in any component — a reveal on a selector with no subject is a rule that looks like coverage and animates nothing.

Measured on `/`: **61 unique reveal targets**, deduplicated across selectors (the raw per-selector sum is 77, because `.toron-grid > *` and `.toron-tile` / `.toron-card` overlap). `.toron-page__header` and `.toron-walk__step` count zero on the homepage and match only on the docs pages that render them; they are in the block because those pages are where they appear, not because the homepage proves them.

**The Motion library (`motion`, formerly Framer Motion) is declined.** The measured reason, not a preference:

- Gzipped JavaScript actually transferred by a first visit to `/`: **232.2 KB across 12 files**, measured before this change, against **232.6 KB across 13 files** after. The whole-site static bundle is 400.7 KB gzipped across 30 files either way. This change therefore adds **0.4 KB and one file** — the `CycleGate` chunk from D4 — and nothing else. The whole site pays 0.17% more than before.
- `motion`/React adds approximately **34 KB gzipped**, which against the per-page figure is **15% growth on a first visit**, not the 8.5% the whole-bundle number suggests.
- The requirement for this site is stated in the ADR-0002 stack decision as fast, and restated in this session's request as *"must extreme fast"*.

D5 and D6 deliver cross-route transitions and scroll-linked reveals, plus the whole D2 compositor rewrite and the D3 spatial vocabulary, for **0.4 KB**. A 34 KB tax — 15% of a first visit — on the exact axis the requirement names, to obtain effects the platform now ships natively, is not a close call.

The library would still be the right answer if the requirement were richness rather than speed: spring physics, layout projection, gesture handling, and `AnimatePresence` exit coordination have no CSS equivalent. If that ever becomes the goal, this is the decision to supersede, and D1's token scale is what a runtime would be configured from anyway.

### D7 — Reduced motion neutralises the new effects explicitly, including the scroll one

A scroll-linked animation is **not** governed by `animation-duration` in the way a time-based one is, so it cannot be switched off by shortening durations. Both new blocks are neutralised by name inside the existing `@media (prefers-reduced-motion: reduce)` block, and the D4 gate is left in place because it changes nothing for those readers.

### D8 — Dead motion CSS is deleted, not left

`.toron-tile--link` matched nothing in any component. A selector that no element carries is not harmless; it is a claim about the design that is false, and the next reader takes it as true. It is removed.

`.toron-prose` is in the same state — CSS-only, zero `.tsx` users. It is **recorded here as dead and not yet removed**, because deleting it belongs with whatever work finally settles the docs prose classes, and doing it here would be an unrelated change riding a commit that has a receipt attached to it.

### D9 — A product name is capitalised wherever it is displayed, and only there

The four plane slugs are lowercase because they are **path segments** (`/docs/guides/toron`). They were also being displayed lowercase, as section titles, as sidebar group labels, and in the homepage stack strip, because the slug and the display name were the same string.

They are now separate. `plane.plane` stays lowercase everywhere it addresses a path; a capitalised `planeLabel` is derived from it in the one place a title is written. Eight surfaces changed: the four section pages (`title:` frontmatter), the four generated guide-folder `meta.json` files, and the four stack-strip labels.

**Guide titles were deliberately left alone.** The section pages' guide rows and the projected guide bodies carry the **upstream** titles from the product repositories, and `check-freshness.mjs` fails the build when a row's title disagrees with the repo's frontmatter. Recapitalising those here would be this site editing another project's prose, which is exactly what ADR-0006 D4 forbids, and it would fail the gate. The six genuinely lowercase upstream titles (`toron quick start`, `chiebukuro CLI reference`, and similar) are the product repositories' to fix, and are filed there.

The 404 on `/docs/guides/<plane>` is pre-existing and unchanged by this decision: those folders carry a `meta.json` and a guide index but no index page, so the URL was never routable. The `meta.json` title is a sidebar **group label** and is verified as one.

## Options considered

**Use the Motion library.** Rejected on measured bytes. D6 gives the arithmetic and the condition under which it becomes correct.

**Animate transform/opacity per component, with variant props in TSX.** Rejected. The same effect in the stylesheet is one rule instead of 53 call sites, cannot drift out of sync with the tokens, and costs nothing to parse. The site's motion is a design-system concern and belongs in the design system.

**Promote the hero to a client component and run the cycle from React state.** Rejected. It would ship the hero's whole tree as JavaScript to control five `animation-play-state` values, which is the exact trade D4 exists to avoid.

**Keep the cross-fade for crash, restart, and resume.** Rejected as the reason for this ADR. It is the defect: three distinct events rendering identically, in the one element that holds a viewer's attention.

**Pause the cycle with `document.visibilityState`.** Rejected. That only catches a backgrounded *tab*. A reader who has scrolled past the hero is still looking at the tab, and the loop still runs. Visibility of the element is the thing that was actually wrong.

**Ship a reveal animation that hides content and is then progressively enhanced.** Rejected. If `@supports` fails, content must be fully visible. The reveal therefore animates *from* hidden with `fill: both` inside the `@supports` block, never outside it.

## Consequences

- `packages/tokens/theme.css` gains 10 tokens and `packages/tokens/README.md` documents them. Every timing in the site can now be changed by editing one block.
- The hero cycle is paused when off screen. A reader who lands mid-loop still sees a phase of it, but no CPU is spent once it leaves the viewport.
- Firefox readers get no scroll-linked reveal. They get the final state, which is correct. This is a known, accepted gap, not a bug to be chased.
- Gzipped JS on a first visit to `/` goes from 232.2 KB to 232.6 KB (+0.4 KB, one file, the `CycleGate` chunk). The whole-site static bundle is unchanged at 400.7 KB. **No runtime dependency was added.**
- **This stylesheet's own** remaining paint transitions are `.toron-home__pill` (`color`) and `.toron-toggle` (`color, border-color, background-color`), both intentional. A future "no more paint transitions" sweep must not remove them without replacing the affordance. The 13 further paint transitions measured on `/` are Tailwind `transition-colors` utilities inside **Fumadocs' docs shell**, and are deliberately out of scope; they are a vendor-override decision, not a motion one.
- `.toron-prose` is recorded dead and still present.
- Six upstream guide titles are lowercase and stay lowercase **here**, on purpose, because the gate binds them to the product repositories' frontmatter. They are filed in those repositories, not fixed on this site.

## Verification

Measured in Chrome against the running site, not asserted:

- `pnpm build` green, `Compiled successfully in 3.8s`, 213/213 static pages. The freshness gate stays green.
- `pnpm build` green. The freshness gate reports `44 projected guide(s) … 0 skip(s), green`, and the one skip line it prints is the declared `NOT_CHECKED` upstream comparison, not a failure. `next build` reports `Compiled successfully in 3.8s` and 213/213 static pages.
- Gzipped JS transferred by a first visit to `/`: **before 232.2 KB / 12 files, after 232.6 KB / 13 files.** The +0.4 KB and the one added file are the `CycleGate` client chunk. The whole-site static bundle is 400.7 KB gzipped across 30 files both before and after. This is *not* zero added bytes and the ADR does not claim it is; the 0.4 KB buys the D4 visibility gate, and everything else in this ADR ships in CSS.
- `typeof document.startViewTransition === 'function'` is `true`. `CSS.supports('animation-timeline: view()')` is `true`.
- Computed style on `.toron-tile`: `animation-name: toron-reveal`, `animation-timeline: view()`, `animation-duration: 0.38s`, `animation-range: entry cover 30%`, `animation-fill-mode: both`.
- Veil computed styles on all four surfaces: parent `isolation: isolate`, `position: relative`, `transition-property: opacity` with `transition-duration: 0s`; the `::after` carries `opacity: 0` at rest, a 1px veil border, the correct per-surface wash, `z-index: -1`, and its own `opacity 0.15s cubic-bezier(0.2, 0, 0, 1)`. The zero duration on the parent is deliberate: the parent must not fade, only the veil layer. `.toron-home__pill` is the one surface that keeps a `color 0.15s` transition on the parent, per the D2 table.
- A stepped scroll walk from 0 to 8000px in 350ms increments leaves **61 reveal targets, 0 of them below 0.9 opacity**. An earlier reading of "2 cards invisible" was a false alarm: they were at 0.968 and 0.989, mid-animation samples with no scrolling ancestor, which is the animation working.
- Section titles render capitalised in the built HTML: `<title>Toron | toron.dev</title>`, and the same for Flywheel, Beads, Chiebukuro. The docs sidebar links read `Toron`, `Flywheel`, `Beads`, `Chiebukuro`; the guide sidebar group labels read `Toron guides`, `Flywheel guides`, `Beads guides`, `Chiebukuro guides`; the homepage stack strip reads `Toron`, `Flywheel`, `Beads`, `Chiebukuro`. Re-running `sync-guides.mjs` after the generator change reports `44 guide(s) projected across 4 plane(s), 0 written, 44 already current`, so the capitalisation is generated, not hand-edited, and re-running it changes nothing.
- **Paint transitions still present on `/`, audited by computed style, 15 elements in three groups:**
  - **2 are ours and intentional** — `.toron-home__pill` (`color`) and `.toron-toggle` (`color, border-color, background-color`).
  - **13 are Fumadocs', not this stylesheet's** — the docs shell's own Tailwind `transition-colors` utilities at `0.15s` (8 elements) and `0.1s` (5 elements), on the navbar, the sidebar disclosure buttons, the copy-code buttons, and the mobile menu trigger.
  - **1 is a transform, not a paint** — the icon inside the mobile menu button, `transform, translate, scale, rotate` at `0.3s`. Already compositor-friendly.

  So the accurate claim is not "two remain" but "**this stylesheet's own paint transitions are down to the two that are deliberate, and the rest belong to the framework's docs shell.**" Changing the Fumadocs shell is not a motion change, it is a vendor-override decision, and it is not taken here.
