# A pseudo-element inside `:is()` is dropped, and the rule stays valid

**What happened.** The reduced-motion block that switches off the scroll- and
view-timeline effects listed them in one forgiving selector:

```css
:is(.toron-bg__field, .toron-bg__grid, .toron-home__figure::before, .toron-cta::before) {
  animation: none;
}
```

The two classes were neutralised. The two `::before` blooms kept running. `:is()` takes a
forgiving list of *complex selectors*, and a pseudo-element is not one of those: the
invalid arguments are dropped **individually**, the rule survives for the rest of the
list, and nothing in the stylesheet, the linter, or a glance at the source shows it.

The check that caught it reads computed `animation-name` in a browser started with
`reducedMotion: "reduce"` and prints all three names — `none / none / toron-depth-bloom`
is a sentence, where a boolean would have been a shrug.

**What to do instead.** Write pseudo-element selectors flat beside the `:is()`:

```css
:is(.toron-bg__field, .toron-bg__grid),
.toron-home__figure::before,
.toron-cta::before {
  animation: none;
}
```

Specificity is unchanged (a pseudo-element contributes none), so the rule still wins by
being later than the rule it neutralises.

**Why it is worth remembering.** This is the second time this block has been the thing
that silently did nothing — the first was its *position* in the stylesheet (equal
specificity, so the earlier declaration lost). Both were invisible in review and obvious
in a computed style. Any rule whose job is to switch something off is worth reading back
out of the browser rather than trusting in the file.
