---
track: bug
module: apps/toron-dev/scripts/render-mascots.tsx
problem_type: verification
tags: [css, playwright, file-url, design-tokens, rendering, testing]
created: 2026-09-27
---
# A scratch page can load the real stylesheet and still have none of its tokens

## Symptoms

`render-mascots.tsx` writes a scratch page next to the app, links
`./app/global.css`, and screenshots it. The claim being made is that the artifact
shows what ships. It did not.

`app/global.css` opens with four bare `@import`s:

```css
@import "tailwindcss";
@import "fumadocs-ui/css/neutral.css";
@import "fumadocs-ui/css/preset.css";
@import "@toron/tokens/theme.css";
```

A bare specifier cannot resolve over `file://`, so all four failed silently. The
rest of `global.css` still applied, which is what made it invisible: the page
looked styled, and every rule that did not read a variable worked.

Anything reading a `--toron-*` variable was dropped. Most of the damage is
cosmetic. The one that mattered was the mascots' cross-fade:

```css
.toron-stack-strip__mascot [data-mood="rest"] {
  animation: toron-mascot-rest 9s var(--toron-ease-standard) infinite;
}
```

An unresolvable `var()` in a shorthand makes the whole declaration invalid at
computed-value time, so `animation-name` fell back to `none`. The characters
rendered perfectly and never moved. Two runs of the harness reported the sheet
as good.

## What didn't work

The harness had a check for exactly this, and it passed:

```js
const grainOk = (await page.$eval(".toron-mascot__grain", (n) => getComputedStyle(n).mixBlendMode)) === "overlay";
```

`mix-blend-mode` was set by an inline `style` attribute in the JSX, so the check
was reading a value that arrived in the markup and could never have failed. It
was a stylesheet check that did not depend on the stylesheet. The check had been
replaced once already, and the replacement asserted the same way: the second
version read `getComputedStyle(document.body).margin`, which an inline `<style>`
in the same file also set.

Two failures stacked here. The scratch pages had also been written into
`.mascot-out/`, one directory below the app root, so the relative
`./app/global.css` href did not resolve either. The sheet had been rendering with
no stylesheet at all for three runs, and both load checks passed.

## Solution

Hoist the thing being depended on into the scratch page, and assert on something
only the real stylesheet can supply.

- The token stylesheet is linked directly, ahead of `global.css`, so the
  variables exist even though the bare imports inside `global.css` still fail.
- The scratch pages are written to the app root, which is the only directory the
  relative `./app/global.css` href resolves from.
- The load check now reads a token off the document:

```js
const ease = getComputedStyle(document.documentElement).getPropertyValue("--toron-ease-standard");
return !!svg && getComputedStyle(svg).containerType !== "normal" && ease.trim().length > 0;
```

No inline style in the scratch page sets `--toron-ease-standard` or
`container-type`, so nothing but the real stylesheet can satisfy it. With that in
place the cross-fade assertion reported `4 of 4` immediately, and it had been
reporting `0 of 4` against a check that said the page was fine.

## Why this works

A verification step is only as good as the independence of the thing it reads.
The old check read a computed style, which sounds like reading the system's own
answer rather than our claim. But the value being read was one we had written
into the markup ourselves, so the check was reading our intent back to us with an
extra step.

The question that separates the two is: could this have come out the other way?
If the stylesheet had failed to load, would the assertion have failed? For
`mix-blend-mode` and for `body` margin the answer was no, which is what made them
decoration.

## Prevention

When a scratch page is supposed to reproduce a real page, assert on a value only
the real page's stylesheet can produce, and prefer a variable that the stylesheet
imports from somewhere else. A local rule is the thing most likely to be
duplicated by an inline style or lost by a relative path, and both failure modes
are silent.

Also: a relative href resolves against the page, not the project. Writing scratch
files into a subdirectory to keep the tree clean silently breaks every relative
link in them.
