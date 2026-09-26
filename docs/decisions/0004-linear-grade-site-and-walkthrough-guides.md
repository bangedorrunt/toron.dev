# ADR-0004: Linear-grade site language and high-fidelity walkthrough guides

**Status:** Accepted (2026-09-26)

**Scope:** The visual language, layout grammar, and marketing copy of every public route, plus the standard that docs and guides must meet.

**Amends:** ADR-0001 D2 (visual language), D4 (hero), D8 (compare tone), D9 (voice), D10 (feature visualization), D12 (site map, nav), D13 (what the site will not do). ADR-0003 D1 (headline), D4 (docs projection).

**Superseded by nothing.** ADR-0001's D1 abstraction ladder, D5 layer-ownership model, D6 crypto-depth split, D7 generated tool pages, D11 build order, and D3's stack table remain in force. ADR-0002 D3/D4 (catalog contract) and D6 (stack + analytics) remain in force.

## Context

ADR-0001 D2 locked the visual language on 2026-08-13: dark `#0a0a0f`, Nostr violet `#8b5cf6`, Space Grotesk / Inter / JetBrains Mono, and an abstraction-ladder model where each page explains one layer of the product. That decision was correct against its competition at the time. Its references were swarmtools.ai (ASCII diagrams on neutral-950) and herdr.dev (paper-light + electric blue), and toron's differentiator against both was "protocol-night": crypto-signed, violet, dark-first.

Two things changed the calculus.

First, the competition moved. The current reference set is `linear.app` and `itsaplan.dev`, and both sell the same category toron.dev now sells — planning, dispatch, and execution where agents are first-class participants. Neither uses metaphor as its primary surface. Both are near-black canvases with a desaturated indigo accent, Inter throughout, hairline borders, and tight negative tracking on display type. Toron.dev's violet is now the only thing visually separating it from a category it is trying to be legible inside.

Second, the content model does not survive contact with its own copy standards. ADR-0001 D2's abstraction ladder produces section headings like "Four planes. One autonomous workflow." and "Each plane owns one hard problem." Those are claims about internal structure. They require the reader to already know what a plane is, and they carry no number, no mechanism, and no outcome. The landing page opens with "Mail for machines." — a metaphor fragment that does not state what the site offers to the person reading it. Meanwhile the product's actual differentiators (a crash resumes rather than restarts, an item closes only on a passing gate row, a signature is the proof) are all concrete, all specific, and none of them are stated plainly on the homepage.

The docs have the same failure in a worse form. `apps/toron-dev/scripts/generate-tool-docs.mjs` emits one page per MCP tool from `catalog/toron-mcp.json`: a 16-row input-schema table whose Description column is empty because the catalog carries no `description` per property, a null-filled `example` object that is not runnable, and a one-line parity string. A reader who wants to send their first signed message cannot complete that task from the site. The pages are an accurate projection of the catalog and a useless guide to the product.

## Decision

### D1 — Palette: near-black canvas, indigo accent

The locked palette in ADR-0001 D2 is replaced. Values are Linear-derived; the `--toron-*` token namespace is retained because it names the site, not the accent.

```css
/* ink (dark, ground truth) */
--toron-bg:            #08090A   --toron-ink:            #F7F8F8
--toron-surface:       #0F1011   --toron-body:           #8A8F98
--toron-raised:        #16171A   --toron-muted:          #62666D
--toron-border:        #23252A   --toron-border-strong:  #34363C
--toron-accent:        #5E6AD2   --toron-accent-bright:  #828FFF
--toron-green:         #4CB782   --toron-amber: #F2C94C  --toron-red: #EB5757
--radius: 8px                    --max: 1120px
```

`--toron-violet` is renamed `--toron-accent`. There is no alias and no compatibility shim: the old name is deleted in the same change, because a token named "violet" holding `#5E6AD2` is a lie the next reader has to decode.

The `.paper` light variant is re-derived from the same hues, not from the old violet set. Dark remains the ground truth and paper remains an accessibility variant, per ADR-0001 D2.

State glyphs (ADR-0001 D2) are unchanged. They are semantic, not chromatic, and they survive a palette swap.

### D2 — Typography: Inter for display and body, JetBrains Mono for machine text

Space Grotesk is dropped. Display and body are both Inter (weights 400/500/600), machine text is JetBrains Mono. This matches both references, removes one font family from the load path, and eliminates the mixed-display-face look that reads as "template" next to Linear.

Display type is set at weight 600 with `letter-spacing: -0.038em`; section headings at `-0.028em`; eyebrows are JetBrains Mono uppercase at `0.08em`. Tight negative tracking on Inter is the single most recognizable element of the reference language.

### D3 — Layout grammar: numbered sections, each carrying a rendered product surface

The abstraction ladder (ADR-0001 D10) survives as information architecture — the reader can still stop at any layer with a complete model. What changes is how a layer is *rendered*.

Every landing-page and marketing section now has this shape:

```
1.0  COORDINATE                                  ← mono index + label
Give every agent a mailbox that survives the pane. ← concrete claim
One line of mechanism.                            ← supporting sentence
┌ AppWindow ─────────────────────────────────┐
│ rendered product surface (HTML/CSS, no JS) │     ← the figure
└────────────────────────────────────────────┘
```

The figure is a **rendered surface**, not a screenshot and not a diagram: real DOM, real type, real state glyphs, server-rendered, zero client JavaScript. `AppWindow` provides the chrome; `BoardSurface`, `MailboxSurface`, `LoopSurface`, `LedgerSurface`, and `MemorySurface` render the five products. This is the itsaplan.dev pattern (a real board, a real schedule table, a real MCP session) applied to toron's surfaces.

Build-time Mermaid diagrams (ADR-0001 D3, D10) remain for protocol *behavior* that a static figure cannot express — sequence and state transitions. The division is now explicit: **rendered surface = what the operator sees, Mermaid = what the protocol does.** ASCII strips are retired as a primary visual; they remain acceptable inside terminal figures.

### D4 — Hero: one claim, four planes, a rendered mailbox

ADR-0001 D4's kill-the-daemon simulated daemon stays (it is still the strongest differentiator and it is still CSS-only motion). It is demoted from sole hero to the section-5 figure. The hero is now:

- eyebrow `The autonomous agent stack`
- headline `Agents that finish the job and prove it.`
- a lede that names the four planes and the four outcomes in one sentence each
- two actions (`Install toron`, `Map the stack`) and a trust line (`MIT + Apache-2.0 · no relay plaintext · the license is the pricing`)
- the `MailboxSurface` figure

ADR-0003 D1 pinned the headline `Mail for machines.` That pin is released. A metaphor fragment cannot carry a page whose job is to explain four planes to someone who has not heard of any of them; the mailbox remains the entry point by being the hero *figure* and the first numbered section, not by being the headline.

### D5 — Marketing copy: concrete, second person, mechanism-bearing

ADR-0001 D9 asked for solo-founder voice. That survives. What is added is a hard constraint:

- A headline states an outcome or a category, in a full sentence, in the reader's terms. A headline that is only a metaphor is rejected.
- Every capability claim carries a mechanism, a number, or a named artifact. "Signed mail" is not a claim; "the relay routes the envelope and never holds the plaintext" is.
- Second person, present tense, active voice. No "it's not X, it's Y" constructions.
- The compare page keeps ADR-0001 D8's honest one-liners and names each alternative's genuine strength before the difference.

### D6 — Docs: task-oriented walkthroughs are the primary form

ADR-0003 D4 keeps the catalog as the source of truth for tool names, schemas, and counts, and keeps product behavior canonical in the product repositories. That is unchanged and this ADR does not weaken it.

What changes is the *form*. A guide on this site is a walkthrough, and a walkthrough has a fixed shape:

1. **Outcome first.** One sentence stating what the reader will have when the guide ends, and what they need before starting.
2. **Numbered steps.** Each step is one action.
3. **A runnable command per step.** Copy-pasteable, no placeholder that the guide does not define.
4. **The expected output.** The literal text, table, or state the command produces. A step with no shown output is not verified and is not a walkthrough.
5. **The failure mode.** What goes wrong at this step and the one command that diagnoses it. This is the part that makes the guide high-fidelity, and it is not optional.
6. **The artifact.** What durable thing now exists (a receipt, a gate row, a memory record) and where the reader can see it.

The generated reference pages remain generated and remain one-per-tool. They gain a real CLI example and a description wherever the catalog provides one. Where the catalog does not provide a per-field description, the site shows an empty cell rather than inventing text — ADR-0002 D4's rule against hand-typed schemas still governs.

### D7 — Nav and site map

ADR-0001 D12's sitemap is unchanged. The nav adds nothing and removes nothing; `Docs` gains a `Guides` group alongside `Tools` and `Reference`, so the walkthroughs are reachable in one click from the top bar.

## Options considered

### Option A — Restyle only, keep the copy and the docs generator

Rejected. The palette was never the main gap. A Linear-colored page that still says "Each plane owns one hard problem." and still ships 38 schema dumps has moved the paint, not the problem.

### Option B — Adopt Linear's palette but keep Space Grotesk and the metaphor voice

Rejected. Half-adoption reads as an imitation with the wrong type, which is worse than either endpoint. The three parts (palette, type, language) are one system.

### Option C — Drop the abstraction ladder and go full feature-grid

Rejected. The ladder is ADR-0001's best structural idea and it survives; the failure was the rendering, not the model.

### Option D — Selected: new palette, new type, numbered sections with rendered surfaces, walkthrough doc standard

## Consequences

- **`--toron-violet` is gone.** Any file referencing it must be updated in this change. 28 references across `packages/tokens/theme.css` and `apps/toron-dev/app/global.css`.
- **Space Grotesk is removed** from `next/font/google`, reducing the font payload.
- **Rendered surfaces are server components**, so they cost no client JavaScript and no hydration. Every figure is indexable and works with JavaScript disabled.
- **Maintenance**: each surface is mock data colocated with the component. It is not wired to a live daemon (ADR-0001 D4's rationale for simulation still applies).
- **The docs claim gets stronger and narrower**: the site now promises a walkthrough the reader can complete. A guide that cannot show output for a step must say so rather than imply it.
- **Counts stay honest**: `catalog/` still governs, the 38-tool parity surface and the 40-tool product surface stay distinguished per ADR-0003.

## Verification

```bash
npx pnpm@11.21.0 --filter toron-dev build     # must be green
npx pnpm@11.21.0 --filter toron-dev lint      # must be green
git diff --check                              # no whitespace errors

# every public destination returns 200
for p in / /architecture /features /compare /security /roadmap /faq /blog \
         /how-it-works /agent-guide.md /docs /docs/reference; do
  curl -s -o /dev/null -w "%{http_code} $p\n" "http://localhost:3000$p"
done

# the retired token must not survive anywhere
! rg -q 'toron-violet' packages/tokens apps/toron-dev
```

Gates that must hold by inspection:

- No page imports `framer-motion` or ships client-side Mermaid (ADR-0003 D5).
- Every landing-page section carries a rendered figure or a build-time diagram.
- Every walkthrough step shows output; every walkthrough names at least one failure mode.
- No hand-typed schema on any generated page.
