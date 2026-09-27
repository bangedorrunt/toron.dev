---
track: decision
module: apps/toron-dev/components/mascots.tsx
problem_type: design
tags: [svg, illustration, design-tokens, metrics, verification]
created: 2026-09-27
---
# A style profile measured off a detailed scene is not a target for a 56px icon

## Symptoms

The four mascots were rebuilt from scratch against an external reference the
brief named directly. The reference was not viewable in the session, so it was
measured instead, with `scripts/probe-art.mjs`, and our own art was put through
the same instrument at a silhouette size matched to the reference's 1345px.

The first pass moved the numbers a long way in the right direction:

| measure | before | after | reference |
|---|---|---|---|
| mean luminance (p50) | 14–22 | 102–122 | 130 |
| darkest 2% (p2) | 9 | 39 | 40 |
| contrast | 12.6–14.8:1 | 4.6–5.4:1 | 5.3:1 |
| hue families | 3–4 | 1–2 | 3 |
| hard edges | 0.8–1.2% | 0.4–1.3% | 1.7% |

Two measures stayed stubbornly wrong. Ours sat at 79–92% flat where the
reference sits at 45%, and 5–16% soft where the reference sits at 57%. Distinct
tones: ours 393–663, the reference 3078.

## What didn't work

Treating those three numbers as a target.

The instrument defines `flat` as a per-pixel luminance gradient under 1.5/255,
`soft` as 1–8/255 and `crisp` as over 40/255, all at native resolution. A smooth
form 1100px across carrying a full value ramp of 150 luminance spreads that over
roughly 500px, which is 0.3/255 per pixel: it reads as *flat*. To land in the
`soft` band a surface has to change 1.5 to 8 per pixel, which is a hundred-value
move inside 12 to 50 pixels.

The reference reaches 57% soft because it is not a character, it is a scene.
1345x838 of boat, water, rigging and surface detail, every fold and ripple a
local transition a few tens of pixels wide. A four-shape character cannot reach
that profile by being shaded better, only by acquiring texture it does not want.
At 56px, the size the stack strip actually draws, any texture added to move the
number is sub-pixel dirt.

The check that exposed this was trimming pixels under 160/255 alpha out of the
statistics, to stop antialiasing skirt from counting as paint. Ours went to
95% flat with 5% soft. Nearly every "soft" pixel in the drawing was the blur
skirt on a shape edge, not shading. The drawing was flatter than the number had
been claiming.

## Solution

Keep the measures that are properties of the drawing, and drop the ones that are
properties of the subject's detail density.

Kept, because they held across both a detailed scene and a small icon, and each
one could have come out the other way:

- p2 above 30: nothing in the art is near black. The reference floors at 40.
- mean luminance in 95..145: the picture is high-key.
- contrast between 4:1 and 7:1: shadows carry colour instead of crushing.
- hue families at 3 or fewer: the palette is restrained.
- hard edges under 5% of pixels: form is shaded, not outlined.

Dropped: the flat/soft split and the raw tone count, both recorded in the probe
output as observations rather than as pass/fail.

What went into the drawing instead, because it is right for any rendered form
regardless of what it does to the statistics: a terminator across each surface so
the value change lands in the middle of a form rather than being spread evenly
over it, tighter speculars with the falloff spent in the first third, contact
darkening wherever one mass rests on another, and a lit bevel along the outer top
of the wheel's rim.

## Why this works

A metric transfers between two artifacts only when the thing it measures is a
property of the *style* rather than of the *scene*. "Is anything near black" and
"how many hue families" describe a visual language, and they hold for a boat and
for an envelope alike. "What share of pixels sit on a gentle ramp" describes how
much foliage there is, and it will always be higher in a scene.

The test is the same one that decided the earlier mascot work: could this have
come out the other way? Ours could not have reached 57% soft without becoming a
different kind of picture, which is the definition of a target that is not about
the drawing.

## Prevention

Before adopting a number from a reference, check that the reference and the
artifact are the same *kind* of thing at the same scale. A scene illustration and
a 56px character icon differ in detail density, and every statistic normalised by
pixel area will report that difference as a quality gap.

When a metric is adopted, record why it could have come out the other way, and
record what the honest limit of the check is. The checks here say the art is
high-key, restrained and un-outlined. They do not say it is good, and the
receipt should not pretend otherwise.
