---
track: decision
module: apps/toron-dev/scripts/render-mascots.tsx
problem_type: verification
tags: [svg, illustration, design-tokens, testing, metrics]
bead: torondev-baa
created: 2026-09-27
---
# A quality judgement needs a number that moves, and the first number I picked did not

## Symptoms

The four mascots were reported as reading cheap, nothing like the painted
reference. The code was already carrying five-stop value ramps, a fractal-noise
displacement pass and a grain overlay, so the obvious read was that the paint
model was not being applied strongly enough, and the fix was to push it harder.

Before changing anything, the thing to settle was what "cheap" actually means
here, because the two candidate causes pull in opposite directions and only one
of them is the real one.

The cause turned out to be structural, not intensity. Roughly thirty shapes
carried `stroke={INK} strokeWidth="3.5"`, a 3.6% contour on a 96-unit tile, and
the displacement filter was warping those contours rather than the forms. A
thick dark line is how vector art declares a boundary; paint declares one with a
change in value. Displacing a line makes it ripple, which reads as a melted
sticker, and no amount of extra gradient hides it.

Two smaller causes sat on top: eyes at `r=6` to `r=7.5` where the reference's
eyes are most of the character, and detail (page rules, spectacles, a gate
rectangle) that is sub-pixel at the 56px size the stack strip actually renders
at.

## What didn't work

The first metric I wrote measured unmodulated area: the share of pixels whose
neighbours are effectively identical. The theory was that cheap vector art is
flat fills, so a mascot with large flat regions scores badly.

It does not discriminate. Rendering the rejected version and the reworked one
through the same harness:

| mascot | unmodulated before | after | distinct tones before | after |
|---|---|---|---|---|
| toron | 14.2% | 14.1% | 391 | 524 |
| flywheel | 13.8% | 7.3% | 340 | 661 |
| beads | 13.6% | 11.7% | 466 | 511 |
| chiebukuro | 11.1% | 11.2% | 565 | 740 |

The before column was already comfortably modulated. Both versions passed. A
metric that both the broken and the fixed drawing pass is measuring something
true and irrelevant, and reporting it as evidence of quality would have been
worse than reporting nothing, because the number is unfalsifiable and looks
rigorous.

## Solution

Measure the thing the judgement is actually about. An outline is nothing but
extra dark mass laid along a contour, so dark mass is the quantity that has to
drop when contours come off, and it moves:

| mascot | dark mass before | after |
|---|---|---|
| toron | 52.3% | 43.8% |
| flywheel | 67.9% | 30.7% |
| beads | 47.7% | 47.0% |
| chiebukuro | 67.2% | 55.0% |

Flywheel is the clearest case, because it was the worst offender: a stroked
outer circle, a stroked inner circle and a stroked hub on a dark tile, which is
almost entirely contour. It lost more than half its dark mass. Distinct tones
rose on all four, which is the second half of the same change: with the line
gone, the value ramp is what the eye actually reads.

The fix itself was to delete rather than add. No stroke on any body. Form from
a value ramp whose bounce stop is lighter than the core, a sprayed edge of under
a unit of blur instead of displacement, a rim light along the bottom edge so the
form separates from a dark tile without a line being drawn, and eyes roughly
doubled with a filled lid mass and two catchlights.

## Why this works

A check earns its keep by failing when the specific claim it covers is false.
Unmodulated area failed that test on day one. Dark mass passes it: it separated
the drawing a person rejected from the drawing meant to replace it, on every
mascot, in the direction the fix predicts, and the size of the move tracked how
much contour each mascot actually had.

The general move is to pick the metric that could have come out the other way.
If a number would have come out the same either way, it is decoration.

## Prevention

Do not trust a metric because it is plausible. Render the known-bad artifact
through it before believing it. One `git show` of the previous version and a
second render is cheap, and it is the difference between a gate that guards the
work and a gate that flatters it.

Also keep the honest limit in mind: these numbers say the contours are gone and
the tonal range is wider. Whether the result is *good* is still a human call. The
metric catches a regression to flat or to outlined; it does not certify taste,
and the receipt for this work should not pretend otherwise.
