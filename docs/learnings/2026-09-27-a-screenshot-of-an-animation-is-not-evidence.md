---
track: bug
module: apps/toron-dev/scripts/render-mascots.tsx
problem_type: verification
tags: [svg, animation, reduced-motion, testing, playwright]
bead: torondev-s4v
created: 2026-09-27
---
# A screenshot of an animation is not evidence

## Symptoms

The mascot render harness drew each of the four characters once, screenshotted
the sheet, and reported shape counts, bounding boxes, and set weight. It passed.
Then the mascots were given two expressions that cross-fade on a 9s cycle with a
per-plane stagger, and the harness was still reporting green while proving
nothing about either of them.

Three separate ways the artifact could have lied, all of which the existing
checks were blind to:

- **The screenshot caught a blend, not a face.** Every cell was mid-cycle at a
  different point because the four delays differ, so a reviewer looking at
  `mascots.png` could not answer "does the resting face read" for any of them.
- **The scratch page never loaded `global.css`.** The grain pass blended with an
  inline `mix-blend-mode` style, so the sheet drew it flat grey while the site
  drew it as an overlay. Four good-looking pictures, from a stylesheet nobody
  loaded, that were not the pictures that ship.
- **Two identical faces passed everything.** A dropped or copy-pasted work
  group still draws, still stays inside its tile, and still carries the right
  weight. Every geometric check is satisfied by one face drawn twice.

## What didn't work

Treating "the render is green" as "the render checked the thing I changed."
The harness was built for static art, and the moment the art moved, its checks
silently stopped being about the change. Nothing failed loudly because nothing
was asserting the new claim.

The same blind spot has a real accessibility form. The reduced-motion block
resets `animation-duration` to `0.01ms` globally; with no fill mode both mood
groups then revert to their base opacity of 1, which stacks the resting face on
the working face. The blanket reset that is supposed to make the page calmer is
the thing that produces two expressions at once, and no static read of the
markup shows it.

## Solution

Pin the thing the artifact is supposed to show, then assert the difference.

- The sheet now renders each mascot twice, once with `[data-pin="rest"]` and
  once with `[data-pin="work"]`, with the cycle forced to `animation: none`.
  The artifact is deterministic, so it can be read.
- It links the real `app/global.css`, and reads `mix-blend-mode` back off the
  rendered element. A stylesheet that fails to load now fails the check instead
  of quietly producing a different picture.
- The two pinned rows are screenshotted separately and compared. Identical
  bytes means one face drawn twice, and that is a failure with a name.
- The reduced-motion path is asserted in a real browser under
  `reducedMotion: "reduce"`: rest at opacity 1, work at opacity 0, `none` on
  both. "Exactly one face" is the invariant, and it has to be checked in the
  browser, because the failure is a cascade interaction between two rules.

## Why this works

A verification step earns its keep by failing when the specific claim it
covers is false. Adding a second expression added a new claim, and the harness
kept answering an older question. The fix was not more checks, it was making the
artifact stop being ambiguous, so the check could have one right answer.

Reading a computed style back off the live element is the general move. It
converts "I wrote the rule" into "the rule is in effect", which is the only
version of the claim a reader of the artifact can check.

## Prevention

When a check is extended to cover new behaviour, ask what the old checks would
report if the new behaviour were simply absent. For a second mood, three
different things could each have been missing and every geometric check would
have passed: the group, the CSS, or the distinction between them.

Pin any animated artifact to a deterministic state before screenshotting it. An
image captured at an unknown point in a cycle is not a picture of the thing, it
is a picture of a moment, and moments are not reviewable.
