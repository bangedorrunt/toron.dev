# ADR-0010: Depth, particles, a morph that plays on the click, and an icon set

**Status:** Accepted (2026-09-27)
**Scope:** The three effects the operator asked for, what each one costs, and the icon set the site was missing.
**Amends:** **ADR-0009 D5** (which recorded the morph as playing only on a document navigation). ADR-0009 D1–D4 and D6–D9 stand.
**Depends on:** ADR-0007 (the motion scale and the reduced-motion contract), ADR-0009 (the runtime's scope, the measured payload split, the character placements), ADR-0001 D2 (the locked token language), ADR-0002 D6 (the stack), ADR-0005 D1 (the origin).

## Context

One request, three effects: **morph, parallax, and particles, where relevant** — plus a favicon set, because the site had a tab icon and nothing else.

Each landed against a different constraint:

- **Morph.** ADR-0009 D5 shipped the tile-to-page pairing as a native cross-document transition and then recorded the honest limit: an in-app navigation keeps the same document, `document.startViewTransition` is called zero times, `pagereveal` never fires, and Next 16.3.6 exposes no config key to wrap a router navigation in a transition. The morph therefore existed and did not play on the click path, which is the path readers take.
- **Parallax.** ADR-0007's whole vocabulary is compositor work at zero bytes. A depth effect that costs a runtime would contradict the one number this site has defended from the start.
- **Particles.** This is the first thing on the site that wants a frame loop, and a frame loop is the first thing that can burn a phone's battery in the background of a page nobody is looking at.
- **Icons.** `app/favicon.ico` held four entries from an older mark, `public/favicon.svg` still carried the pre-indigo violet, there was no apple touch icon, no PNG icons, and no manifest. The social card carried the same stale palette.

## Decision

### D1 — Depth is CSS, and it costs nothing

Four scroll- and view-timeline animations, in `@supports` blocks so a browser without them gets a still page rather than a broken one:

| element                    | timeline                     | what it does                            |
| -------------------------- | ---------------------------- | --------------------------------------- |
| `.toron-bg__field` (glow)  | `scroll(root block)`         | `translateY(-2%) scale(1)` → `8% / 1.06` |
| `.toron-bg__grid` (floor)  | `scroll(root block)`         | `translateY(0)` → `-5%`                 |
| `.toron-home__figure::before` | `view()`, `cover 0% cover 100%` | `toron-depth-bloom`                |
| `.toron-cta::before`       | `view()`, `cover 0% cover 100%` | `toron-depth-bloom`                 |

The field and the grid move in opposite directions on purpose: that opposition is what makes the page read as a surface being moved over rather than an image being scaled. Both are on elements that already existed and are `pointer-events: none` and `aria-hidden`, so nothing about the page's structure or accessibility changes.

Measured cost: **0 bytes of JavaScript**, and the two background layers are the two animations `document.getAnimations()` reports on every marketing page at rest.

### D2 — Reduced motion is a switch, and the switch has to be written where it holds

ADR-0009 D6 established the rule and the reason: a reduced-motion block sitting before the rules it names carries the same specificity as those rules and loses to them. It happened again here, in a new way.

The neutralisation was written as one `:is()` list containing the two background classes and the two `::before` selectors. `:is()` takes a *forgiving* list of complex selectors, and a pseudo-element is not one of those: `.toron-cta::before` and `.toron-home__figure::before` inside `:is()` are **dropped as invalid arguments while the rule stays valid for the rest of the list**. The backgrounds stopped and both blooms kept running for exactly the readers the block exists for.

The check that caught it reads computed styles in a `reduce` browser and prints all three names, which is why the failure was legible: `none / none / toron-depth-bloom`. The fix writes the pseudo-element selectors flat beside the `:is()`.

A scroll-driven animation is not governed by `animation-duration`, so the older `animation: none` sets that ADR-0007 wrote do not reach any of these — they are named explicitly, and the harness asserts it.

### D3 — One canvas, with a budget and five ways to stop

`components/particle-field.tsx` is the only canvas and the only frame loop on the site. It is written to stop as much as to run:

- **Count follows the box**: 1 particle per 24,000 css px of band area, minimum 12, **cap 46**.
- **DPR capped at 2**, transformed rather than resized, so the field is the same field on every screen.
- **Colour read at runtime** from `--toron-accent-bright`, so it cannot drift from the token palette.
- **Gated on `IntersectionObserver`** with a 140px root margin, so the field is already drifting when the band arrives instead of starting under the reader's eye.
- **Stops on `document.hidden`**, resumes on `visibilitychange`.
- **Delta clamped at 0.05s**, so a tab that was hidden for minutes resumes instead of teleporting its specks.
- **Never starts under `prefers-reduced-motion: reduce`** — not hidden with CSS, not started: `resize()` is not even called, so the element keeps its untouched 300×150 default and 0 painted pixels.

It is decoration in the strict sense: `aria-hidden`, no pointer events, and the band reads identically with the canvas blank. Its rule sits *after* `.toron-cta > *` because that rule sets `position: relative` on every child of the band; computed `absolute` is the proof the cascade held, and the harness asserts it.

Measured cost: **+0.7 KB gzipped** on the routes that draw it (D9).

### D4 — The morph plays on the click, and the reason it did not at first is a trap

`components/morph-nav.tsx` is a small client island imported by the docs index alone. It upgrades a tile click from a document navigation to `document.startViewTransition(() => router.push(href))`, which is exactly the case ADR-0009 D5 recorded as not morphing. **D5's limit is therefore closed, not deleted**: the measurement it published still describes the site before this ADR, and the soft navigation now morphs.

Three details are load-bearing:

**The tiles are plain anchors, not `next/link`.** With a `Link`, the router intercepts the click and the two handlers race for it. As anchors, the no-JavaScript path is not degraded at all: the browser performs a real document navigation and the cross-document transition plays the same morph with no script. The island only makes that path faster, and it stands aside for a modified click, for a browser without `startViewTransition`, and for a reader who asked for less motion. Because the anchors no longer preload, a capture-phase `pointerenter` listener calls `router.prefetch` to put the router's own prefetch back.

**The callback must stay pending until React has committed the destination route.** Resolve too early and the browser snapshots the page it is leaving and morphs it into itself.

**And a frame wait cannot be used to get that timing, because it deadlocks.** While a transition's callback is pending, Chrome holds the rendering update — which is the very thing that runs `requestAnimationFrame` callbacks. Measured in isolation: a callback awaiting two frames reached `callback-ran` and never reached `callback-done`; the same callback awaiting a 16ms timer finished normally (and the frame counter went from 0 to 71). Written the frame way, the transition sat pending forever, `ready` never settled, the morph never played, **and every rAF animation on the page stayed frozen behind it** — the particle field, the character drift, all of it. The first version of this component shipped that bug for one build.

The signal is the router's own state: the promise resolves from an effect that runs after the commit which changes the pathname, with a 1500ms bail-out for the one case that would otherwise hang — clicking the tile of the page you are already on. The harness now asserts all three facts, because the failure was invisible to the obvious check: it counts the call, waits for `ready` **and** `finished` to settle, samples the transition's own animations on a timer (frames are paused), and then counts frames for half a second after the click. A stuck transition passes "was it called" and fails the other three.

Required support: Chrome/Edge 111+, Safari 18+, Firefox 133+ for view transitions; everything else falls through to the anchor.

**The cost is 0.3 KB gzipped on every `/docs/*` page**, not only the index: a client reference is registered per route, and the docs index shares the `/docs/[[...slug]]` catch-all with roughly a hundred pages. Options considered below.

### D5 — The manifest names the icon set

`app/manifest.ts` returns the web app manifest: the site name, `start_url: /`, `display: standalone`, both colours `#08090a`, and the two PNG icons. Without one, Android and Chrome fall back to a heuristic over whatever favicon they can find and draw the mark inside a white circle of their own choosing; with one, the two PNGs are the icon, the mask is the platform's to apply, and the splash background is the page's own background. The colours are literals because a manifest is JSON and cannot read `--toron-*`; `theme_color` matches the `theme-color` the root layout already declares, and `scripts/render-icons.mjs` checks them against the tokens.

### D6 — The icon set is generated from one SVG, checked against the tokens, and declared in the layout

`scripts/render-icons.mjs` writes the whole set from `public/favicon.svg` and checks it:

| file                     | what it is                                                        |
| ------------------------ | ----------------------------------------------------------------- |
| `app/favicon.ico`        | hand-rolled container, 5 PNG entries (16/32/48/64/256), 11.5 KB    |
| `app/apple-icon.png`     | 180px, full bleed, so iOS applies its own mask                     |
| `public/icon-192.png`    | 192px, for the manifest and Android                                |
| `public/icon-512.png`    | 512px, for the manifest's splash                                   |

The checks are the point: the palette in the SVG is compared to `packages/tokens/theme.css`, the social card's literals are compared to the same tokens, the 16px raster is measured for legibility (28 accent pixels and 10 ink pixels of 256, accent covering 10.9% so the envelope is still an outline at tab size), the apple icon is checked for zero transparency, the corners are checked against the rounded tile, and the written ICO is **read back** and its directory compared to the dimensions each payload PNG actually has.

**The layout declares the whole set, and that is a fix rather than a preference.** Next merges a route segment's convention icons into the metadata only when the metadata's `icons` field is absent — so the layout's `icons: { icon: [...] }` had been silently dropping the apple touch icon that `app/apple-icon.png` was building and serving correctly all along. `favicon.ico` survived only because it is unshifted into whatever `icons` exists. The head now emits the ico, the SVG, the apple touch icon, and the manifest link, and the harness asserts each link and the file behind it.

### D7 — The harness is where every claim here is checked, and it says when it cannot check one

`scripts/render-strip.mjs` grew two families beyond its placements and its build-output checks:

- **depth** — the five timeline rules read as computed styles off the real stylesheet, the canvas rule's cascade position, and all of it read again in a `reduce` browser where every name has to be `none`;
- **live** — needs a running `next start` (port 3111, `TORON_STRIP_ORIGIN` to override): the four icon links and the files behind them (the apple icon and both manifest PNGs are loaded and measured), the morph on a real click (call count, `ready`/`finished`, the transition's own animations sampled on a timer, frames still ticking afterwards), and the particle canvas drawing while on screen, stopping when it is scrolled away, and never starting under reduce.

Both families print `skipped` and the command that would fix it when there is no build or no server, in the same voice the build-output checks already used, so a run without them is visibly incomplete rather than quietly green. The canvas's stopped state is checked exactly — a cancelled frame loop leaves the last frame behind, so two readings 400ms apart have to agree — and its running state is checked by the alpha total, which sub-pixel motion moves through anti-aliasing alone.

## Options considered

**React's `<ViewTransition>`.** React 19.3.0 exports it, and it is the right answer eventually: it times the snapshot off React's own commit instead of guessing. Rejected **for now** because Next 16.3.6 exposes no config key that wires React's transitions into a router navigation (checked in the installed package: no `viewTransition` in the config schema), so the router's commit is still outside React's control. This is the decision to revisit when that lands, and it is why the component is 60 lines with no other dependency.

**Awaiting a frame inside the transition callback.** Measured deadlock. Rejected.

**A separate route for the docs index** (`app/docs/page.tsx` beside the catch-all) so the island's client reference is not registered for the other hundred docs pages. Rejected: 0.3 KB does not justify moving the docs index out of MDX, splitting the components map, or the route-conflict risk with `[[...slug]]`.

**Hide the particle canvas with CSS under reduce.** Rejected: the field should not exist for those readers, not be invisible while it runs.

**A dependency for the ICO container.** Rejected: the format is a 6-byte header, a directory of entries, and PNG payloads that are already written. Reading the file back is a better guard than a package, and it is 40 lines.

**Ship the depth effects with a scroll listener.** Rejected: that is the same effect at the cost of a listener, a throttle, and main-thread work on every scroll — everything ADR-0007 avoided.

## Consequences

- **Marketing routes +0.7 KB gzipped** (`/` 271.0 → 271.7, `/architecture` and the other three 270.7 → 271.4). The particle field is all of it.
- **The docs pay +0.3 KB** (256.9 → 257.2 KB) for the morph island, on every page of the catch-all rather than only the index. They still reference **no part of the animation library chunk**, which the harness re-asserts on every run.
- **The build goes from 213 to 215 static routes**: `/apple-icon.png` and `/manifest.webmanifest` are routes.
- New files: `components/particle-field.tsx`, `components/morph-nav.tsx`, `app/manifest.ts`, `scripts/render-icons.mjs`, and the four icon files. No new dependency.
- `public/favicon.svg` and `app/opengraph-image.tsx` were carrying the pre-indigo violet (`#8b5cf6` on `#0a0a0f`); both now carry token values, and `render-icons.mjs` fails if either drifts again.
- The morph is an enhancement on one surface: the docs index tiles to the four plane pages. It is unavailable in browsers without view transitions and to readers who asked for less motion, and in both cases the click still navigates.
- **A pre-existing production hydration error was found while verifying this work** — React #418 on `/docs` and `/docs/toron` in the built app, reproduced on the live site at the commit before this work. It is filed as `torondev-4sb` and not fixed here: it is not caused by anything in this ADR, and the honest fix is to find the tree rather than to bury it in an effects change.
- The harness's live half needs a server. A bare `node scripts/render-strip.mjs` is a green run with a `skipped` line in it, and that is deliberate.

## Verification

Every number below came off a command against this tree.

**Build.** `bun run --filter toron-dev build`: `Compiled successfully`, **215/215 static pages**, zero TypeScript errors. The route table gains `/apple-icon.png` and `/manifest.webmanifest`.

**Gzipped JavaScript per route**, read from each route's own HTML in the build output (same instrument as ADR-0009, so the pair is comparable and the absolute numbers are not):

| route                         | before  | after       |
| ----------------------------- | ------- | ----------- |
| `/`                           | 271.0   | **271.7**   |
| `/architecture`               | 270.7   | **271.4**   |
| `/compare`                    | 270.7   | **271.4**   |
| `/blog`                       | 270.7   | **271.4**   |
| `/blog/crash-is-a-transition` | 270.7   | **271.4**   |
| `/docs`                       | 256.9   | **257.2**   |
| `/docs/toron`                 | 256.9   | **257.2**   |

The docs routes reference no part of the 38.1 KB animation chunk (`docs runtime-free ×5` in the harness).

**The icon set.** `node scripts/render-icons.mjs`: all checks passed — palette matches the tokens (`#08090a`, `#5e6ad2`, `#f7f8f8`), no extra colours, the card's four literals are token values, 16px readable (28 accent + 10 ink pixels of 256), 16px not a blob (10.9% accent), corners (rounded tile transparent at (1,1), apple icon opaque), ICO read back as 5 entries (16/32/48/64/256) with every payload a PNG of the size it claims, sizes sane (ico 11.5 KB, apple 3.7 KB, 192 5.2 KB, 512 17.4 KB).

**The harness.** `node scripts/render-strip.mjs` with `next start -p 3111` up: **all checks passed on 4 characters across 10 placements**, exit 0. The lines this ADR added, as they printed:

- `scroll depth — the field runs toron-depth-field and the grid toron-depth-grid on scroll(root)`
- `view depth — the band's bloom runs toron-depth-bloom on view()`
- `canvas behind copy — the particle canvas computes absolute z-0 with pointer-events none`
- `reduced motion — arrival none, strip hover transition 1e-05s, depth none/none/none`
- `favicon links — the head links /favicon.svg and /favicon.ico`
- `favicon files — the svg loads square at 150x150 … and the ico at its largest entry, 256x256`
- `apple touch icon — the head links /apple-icon.png, served at 180x180`
- `manifest — toron.dev: the autonomous agent stack · theme #08090a · icons 192x192 and 512x512`
- `morph on click — one startViewTransition on /docs, landed on /docs/toron`
- `morph plays — ready and finished both settled, with 9 transition animation(s) sampled, ::view-transition-group(toron-character-toron), ::view-transition-new(toron-character-toron), ::view-transition-old(toron-character-toron), ::view-transition-old(toron-character-flywheel), ::view-transition-old(toron-character-beads), ::view-transition-old(toron-character-chiebukuro)`
- `page still ticks — 31 frame(s) over 500ms after the transition`
- `canvas draws — 118 painted pixel(s) in a 1118x184 canvas on screen at dpr 1`
- `canvas animates — the frame changed between two readings 400ms apart while on screen (alpha total 1996 → 2022)`
- `canvas stops — scrolled away it held still: two readings 400ms apart are byte-identical (alpha total 2096)`
- `canvas honours reduce — under reduce the canvas is never sized or drawn: 0 painted pixel(s) in a 300x150 canvas`

**The deadlock, measured in isolation** (a page with a frame counter and a transition whose callback waits): frame wait — `frames 1 → 2`, state stuck at `callback-ran`, `ready` never settled; timer wait — `frames 0 → 71`, state `finished`. That is the experiment D4's timing rule comes from.

**The `:is()` trap, measured on this sheet**: before the fix, the reduce page computed `none / none / toron-depth-bloom`; after it, `none / none / none`.

**The hydration error**, found here and filed: a Playwright `pageerror` listener reports React #418 on `/docs` and `/docs/toron` against `next start` on this build **and** on `https://toronmail.vercel.app`, which is the site at the commit before this work. Dev mode is clean, which is why it had gone unnoticed.
