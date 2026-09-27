# ADR-0009: The four characters travel, and the Motion runtime is adopted

**Status:** Accepted (2026-09-27)
**Scope:** Where the mascot renders appear, which runtime animates them, and what that costs.
**Supersedes:** **ADR-0007 D6** (which declined the Motion library on measured bytes). ADR-0007 D1, D2, D3, D4, D5, D7, D8, D9 all stand.

**Depends on:** ADR-0001 D2 (the locked token language), ADR-0007 (the motion scale, the veil hovers, the gated cycle, `@view-transition`, the reduced-motion contract), ADR-0006 (the docs tree), ADR-0002 D6 (the stack).

## Context

Two requests, one session: **the four characters should appear beyond the front page**, and **the site should move the way a modern premium site moves**.

The characters arrived first (torondev-814, torondev-rig, torondev-f7i): four Grok Imagine renders, cropped to their own silhouettes and re-centred at a common long side, wired into the homepage stack strip.

Then the request for motion ran into a decision rather than a design problem. **ADR-0007 D6 declined the Motion library** on measured bytes — 34 KB gzipped against a 232.6 KB first visit, 15% growth on the one axis the requirement named. D6 was explicit that this was a _conditional_ decision and named its own reversal condition, in its last paragraph:

> The library would still be the right answer if the requirement were richness rather than speed: spring physics, layout projection, gesture handling, and `AnimatePresence` exit coordination have no CSS equivalent. If that ever becomes the goal, this is the decision to supersede, and D1's token scale is what a runtime would be configured from anyway.

The operator then made richness the goal and chose the library. So D6 is superseded — not deleted, and not "wrong all along". Its measurement stands as the record of what was true in September; what changed is the requirement, which is exactly the condition D6 wrote down for itself.

## Decision

### D1 — One plane module owns the list, the art, and the order

`apps/toron-dev/lib/planes.ts` holds four planes: slug, display name, one-line role, ownership line, repository, docs path, and the art.

The strip used to carry its own array, which was fine while it was the only surface that drew a character. With characters on the docs pages, in the social card, and on the marketing pages, a second copy of the list is four chances for a name, a role, or a mapping to disagree between surfaces.

The record is the source and the array is derived from it (`PLANE_BY_SLUG`, then `PLANES` in display order). The obvious shorthand — an array plus `Object.fromEntries(...) as Record<PlaneSlug, Plane>` — is **not** used: that cast promises a key for every slug, so a plane dropped from the array would type-check and fail at the first render of the page that asked for it. Written as a record literal, a missing plane is a compile error on the literal itself.

### D2 — The placement grammar: four characters, seven surfaces, and places they deliberately do not go

| surface                                      | placement                                                             | drawn by            |
| -------------------------------------------- | --------------------------------------------------------------------- | ------------------- |
| homepage stack strip                         | 4, at 4.5rem, in the cells that name them                             | client, interactive |
| docs index (`/docs`)                         | a row of 4, and the row **is** the navigation to the four plane pages | server              |
| plane pages (`/docs/{toron,…}`)              | 1 mark at the top, with the plane's role line                         | server              |
| `/architecture`, `/compare`, `/blog` headers | 4 marks beside the title                                              | client, interactive |
| blog posts                                   | the characters the post's argument needs: 1, 2, or 4                  | client, interactive |
| cards that name a plane                      | 1 chip in the card's corner                                           | client, interactive |
| social card                                  | 4, with their names                                                   | build-time          |

Two rules are load-bearing and are written in the components rather than in a doc:

**A lone character drifts; a set of four does not.** Four independent floats read as noise. A set of four is meant to read as one object, so it holds still and answers the pointer instead.

**A card carries the character of the plane it is about, and no card carries one it is not.** The compare page's four composition entries name herdr in one and a plane in three, and only the three get a chip. A card that claims a character it does not own is worse than a card with no art.

The docs index row replaces the Markdown table it used to carry. The text is not lost — the row prints each plane's name and what it owns, from the same constants the table quoted — but a table cannot be walked into and a row of four can.

### D3 — The runtime is adopted, scoped, and told what it is for

`motion@13.4.4`, exact, from the D1 token scale for anything it needs a curve for.

**The scope lives with the character, not in the root layout.** `components/motion-provider.tsx` wraps the `m` component it animates in `LazyMotion`. Mounting one provider in `app/layout.tsx` would put the feature set on every page in the site including the docs; per-character scopes cost a context each and put it on nothing else. Measured: the docs reference **no part of the library chunk**, the marketing routes do (D7 and Verification).

**`domMin`, not `domAnimation`.** The middle set adds gesture recognition — hover, tap, focus, drag — and this app uses none of it: the tilt is driven by raw `pointermove` writing into motion values, and the float by the `animate` prop. Measured, the smaller set takes the library chunk from **38.9 KB to 37.4 KB** gzipped and the marketing routes from 272.3 KB to 270.7 KB. The saving is kept only because the effects still work, which is checked in a browser rather than assumed.

`strict` is on, so using `motion.div` inside the scope throws instead of quietly loading the full component factory back in.

### D4 — The division of labour: CSS owns what CSS can, the runtime owns only springs

Everything ADR-0007 built stays exactly as it was: the veil hovers, the scroll-linked reveals, the crash cycle's spatial vocabulary, the visibility gate, the route cross-fade. All of it is compositor work at zero bytes.

What the runtime adds is the part a stylesheet cannot express: **spring physics**.

- **tilt** — the art rotates on two axes toward the pointer (15° of yaw, 12° of pitch at the corners), on springs, through a 720px perspective.
- **lift** — a 1.05 scale on its own spring while the pointer is inside.
- **drift** — an ambient float for the one character per page that is the page's subject, gated on the element being in view so a reader who has scrolled away stops paying for it, and opt-in per call site so a row of four never floats.

Nothing here is required for the content to be readable. With JavaScript disabled, with the feature bundle still in flight, or under `prefers-reduced-motion`, the component renders the same picture in the same place; only the physics are missing. That ordering is why the entrance and scroll animations were left in CSS: no reader waits on this file to see a page.

### D5 — The character morphs by name, at zero bytes, and the honest limit of that

`view-transition-name` on the docs index tiles and on the plane page marks: the browser snapshots the element on the outgoing document and the element with the same name on the incoming one and interpolates the box between them. No layout projection, no library, no JavaScript. The four names are written as four literals in the stylesheet, because the failure mode is silent: **two elements sharing a name on one page aborts every view transition on that page**, so the attribute is set only by `PlaneMark` and `PlaneRow`, and the harness checks that each page carries each name exactly once.

Then the limit, measured rather than assumed. A view transition from `@view-transition { navigation: auto }` is a **cross-document** feature, and a Next.js router navigation is not a new document:

- clicking the docs index tile keeps the **same document** (a marker set on `window` before the click survives it), and `document.startViewTransition` is **called zero times**; the `pagereveal` count does not move.
- so the morph plays on a real document navigation, and an in-app click does not play it.

Because the click path is the common one, the arriving page does something else instead: the plane mark **settles in** with a 380ms `transform`/`opacity` arrival on `--toron-dur-slow` / `--toron-ease-settle`, which is the same "work coming to rest" the hero's resume state speaks in. It runs on both navigation kinds and cannot move the layout it arrives in.

Next 16.3.6 exposes no config key to wrap router navigations in a view transition (checked in the installed package: no `viewTransition` in the config schema). Making the soft navigation morph is a follow-up that belongs with router-level support, and is not claimed here.

### D6 — Reduced motion neutralises every effect, and the block's position is part of the rule

The tilt and the drift are gated in the component on `useReducedMotion()`, because a spring is not a stylesheet's to switch off. The arrival animation and the hover transitions are neutralised in a `@media (prefers-reduced-motion: reduce)` block that sits **after** the rules it overrides.

That position is the whole point, and it was a bug first. Written into the existing reduced-motion block near the top of the stylesheet, the neutralisations carried the same specificity as the rules they named and lost to them: the arrival still ran and the strip's hover still eased. The harness found it when it was pointed at the sheet in reduced-motion mode, and the check now reads computed styles in a `reduced: true` page.

### D7 — The MDX-facing components live where the docs can import them without the library

`components/docs-content.tsx` holds everything an MDX page can use — `Walk`, `Step`, `Fail`, `Callout`, `CodeBlock`, `StatRow`, `PlaneMark`, `PlaneRow` — and imports no client component. `components/site-content.tsx` keeps the marketing kit and re-exports the MDX set for the marketing pages that use it.

This is a correction with a measurement behind it. The first cut put `PlaneMark` and `PlaneRow` in `site-content.tsx`, beside the interactive character, and `components/mdx.tsx` imported its whole set from there. A module import is not a render, but Next registers the client reference either way, so **every docs page fetched the animation library for characters it never drew: 38.9 KB gzipped on `/docs/toron`**, against a design whose entire claim was that the docs pay nothing. After the split, the docs reference no part of that chunk.

The rule this file carries is in its header, and the harness enforces it: the docs index and all four plane pages are checked against the chunk's source text on every run.

### D8 — The social card carries the same four

`app/opengraph-image.tsx` reads the four PNGs off disk and base64s them into the card, because Satori draws an `img` only from a src it can decode and the deployed card has to be one self-contained PNG. The read happens at module scope during `next build`: this route has no dynamic input, so it is statically generated, and a missing file fails the build loudly instead of shipping a card with three characters on it. Colours stay the two literals an OG card can use — the card is rendered before any stylesheet exists.

### D9 — The harness is the check, and it grew with the work

`scripts/render-strip.mjs` used to be a contact sheet for the art. It now also:

- **measures every placement through the real stylesheet** — row art 64×64 ×4 in a 4-column row with equal-height tiles (188px), plane mark 136×136, header marks 56×56 ×4, card chip 32×32, all `object-fit: contain`, and the drift layer wrapping the art exactly (asserted on the box, not on `display: inline-flex`, because a flex item's display blockifies and the first version of that check failed on correct CSS);
- **checks the arrival animation** runs and is neutralised under reduced motion, in a `reduce` browser;
- **runs a placement census** over the ten surfaces, which is the check that catches "we put them on the docs and forgot the blog";
- **checks the runtime split** against the built HTML: no part of the library chunk referenced by the docs index or any of the four plane pages, and referenced by the homepage;
- **checks the morph names**: four declared, exactly one element per slug per page on both sides of the pairing, `@view-transition` present;
- **checks the built card**: PNG, 1200×630;
- **checks the sheet's own copy of the plane list** against `lib/planes.ts`, because every other number on the sheet is read off that copy, and a copy that drifts is a green check on the wrong set.

The three build-output checks print `skipped` and say why when there is no `.next` to read, so a run without a build is visibly incomplete rather than quietly green.

## Options considered

**Keep declining the library and hand-roll springs.** Rejected by the operator's choice, and it was the weaker option anyway: a hand-rolled spring on pointer-move is 40 lines that behaves worse than the library's, and it would still need the same scope discipline to keep it off the docs.

**Mount `LazyMotion` once in `app/layout.tsx`.** Rejected on bytes: it puts the feature set on every docs page, which is the cost D7 exists to avoid.

**Use `motion.div` (the full component) instead of `m`.** Rejected: it loads every feature the library ships, including drag and layout projection, for effects that use neither.

**Use `domMax`.** Rejected for the same reason with a bigger number: layout projection and drag, unused.

**Adopt the runtime only on the homepage.** Rejected: the request was the site, and the marketing pages are where a reader decides whether the stack is real.

**Make the docs characters interactive too.** Rejected. The guides are the pages a reader arrives at from a search result. They get the characters, the row as navigation, and the native morph, at **zero added bytes**, and the interactive set stays on the marketing surfaces where the reader is browsing rather than working.

**Claim the morph covers soft navigations.** Rejected because it is not true (D5). The measurement is in the ADR and the arrival animation covers the click path instead.

## Consequences

- `motion@13.4.4` is a pinned dependency. `apps/toron-dev/package.json` gains it and nothing else.
- **Marketing routes that draw an interactive character pay +37.3 to +37.4 KB gzipped.** Measured against the same tree built with the runtime stubbed out: `/` 233.7 → 271.0 KB, `/architecture` / `/compare` / `/blog` / `/blog/crash-is-a-transition` 233.3 → 270.7 KB. The library chunk is 37.4 KB of that.
- **The docs pay nothing.** `/docs` and `/docs/toron` measure 256.9 KB with the runtime in the tree and 257.1 KB without it — the same number, within noise — and the harness asserts directly that neither references the chunk. The four characters on a plane page, the row on the docs index, and the morph cost zero bytes.
- The morph is a cross-document transition. It plays on real document navigations and not on in-app clicks; the arriving plane mark settles in with a CSS arrival either way. Making the soft navigation morph needs router-level support Next 16.3.6 does not expose.
- The homepage's four characters are now interactive and the strip's own CSS hover (a 2px lift and a 2° rotation on the art) still applies underneath the tilt. Two transform sources on two elements, deliberately: CSS lifts, the runtime leans.
- **Layout shift on the docs pages is 0** on both `/docs` and `/docs/toron`, measured with a `layout-shift` observer.
- `lib/planes.ts` is the only place a plane's name, role, ownership line, repository, docs path, or art is written. A new surface gets all six by slug.
- The docs index no longer carries a Markdown table; its text now comes from `PLANES`. The Markdown projection (`/docs/*.md`, `llms-full.txt`, the MCP page tools) gains forms for both new components in `lib/markdown.tsx`, so a text reader gets the plane's name and role rather than raw JSX.
- Seven older dates remain in the record: `ADR-0007 D6` is superseded, not amended, so the numbers it published still describe the site as it was.

## Verification

Every number below came off a command run against this tree, and the runtime numbers were taken with the same instrument before and after.

**Build and gates.** `bun run build`: prebuild green (freshness gate reports 44 projected guides, 0 skips, the four plane pages' guide rows intact), `Compiled successfully`, **213/213 static pages**, zero TypeScript errors, Oxlint 0 errors.

**Byte split** — the gzipped JavaScript each route's own HTML references, read from the build output:

| route                         | without runtime     | with runtime            |
| ----------------------------- | ------------------- | ----------------------- |
| `/`                           | 233.7 KB / 13 files | **271.0 KB / 14 files** |
| `/architecture`               | 233.3 KB / 12       | **270.7 KB / 14**       |
| `/compare`                    | 233.3 KB / 12       | **270.7 KB / 14**       |
| `/blog`                       | 233.3 KB / 12       | **270.7 KB / 14**       |
| `/blog/crash-is-a-transition` | 233.3 KB / 12       | **270.7 KB / 14**       |
| `/docs`                       | 257.1 KB / 15       | **256.9 KB / 15**       |
| `/docs/toron`                 | 257.1 KB / 15       | **256.9 KB / 15**       |

The instrument is not ADR-0007's (that one counted what a browser transferred on a first visit; this one reads the route's script set from disk and gzips it), so these absolute numbers are not comparable to that ADR's. The with/without pair is what carries the claim, and it was measured with one instrument on one tree. Library chunk: 37.4 KB gzipped with `domMin`; 38.9 KB with `domAnimation`, which is why `domMin` is the one that ships.

**The docs leak, caught and fixed.** Before the D7 split, `/docs` and `/docs/toron` both referenced the 38.9 KB chunk: 296.0 KB. After it, neither does. The harness now fails if that ever comes back.

**Behaviour, in Chrome against `next start` on the built output.**

- Drift: on `/blog/crash-is-a-transition` the lone mark's drift layer went `matrix(0.999967, -0.00812779, 0.00812779, 0.999967, 0, -2.66111)` → `matrix(0.99979, -0.0204734, 0.0204734, 0.99979, 0, -6.70354)` across 1.2s. It is running.
- Tilt: at the top-left of the box `matrix3d(1.0456, …, 0.091321, …)`; at the bottom-right `matrix3d(1.04607, …, -0.0862762, …)`. Scale 1.046 on both, yaw and pitch opposite in sign, so the character follows the pointer rather than rotating on a fixed axis.
- Reduced motion: the same page with `reducedMotion: "reduce"` — drift `none` → `none` after 1.2s, and the tilt transform byte-identical before and after a pointer move.
- Layout shift: 0 on `/docs` and 0 on `/docs/toron`.
- Morph: `view-transition-name` computes to `toron-character-toron` on the destination element, one element carries it; the docs index carries all four names, once each.
- Navigation: the tile click keeps the same document (a `window` marker survives it) and calls `document.startViewTransition` zero times.

**The harness.** `node scripts/render-strip.mjs` — **all checks passed on 4 characters across 10 placements**, exit 0. Placements measured: row art 64×64 ×4 across 4 columns with every tile 188px tall, plane mark 136×136, header marks 56×56 ×4, card chip 32×32, every one `object-fit: contain`, drift layer 56×56 (exactly the art's box); arrival `toron-mark-arrive` over 0.38s, `none` under reduce; sheet list in sync with `lib/planes.ts`; 10/10 census lines; docs runtime-free ×5 and marketing-pays; 4 morph names, both pairings unique; card PNG 1200×630, 90.7 KB built (served at 92,858 bytes).
