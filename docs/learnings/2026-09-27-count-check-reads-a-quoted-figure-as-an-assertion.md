---
track: bug
module: apps/toron-dev/scripts/check-freshness.mjs
problem_type: false_positive
tags: [count-check, catalog-pin, projection, docs, gates]
bead: torondev-56u
created: 2026-09-27
---
# A count gate failed the build on a guide quoting a stale figure on purpose

## Symptoms

The count check failed the build on `toron` `docs/guides/daemon-ops` line 73. The
sentence is the guide explaining what catalog drift looks like, and it quotes the
old number to do it:

> the guide index's older "40 tools" is exactly the drift the gate is for

The gate read `40 tools` as an assertion that the surface publishes 40 tools. The
real surface is 38. So the guide was correct and the check was wrong, and the fix
had to be in the check.

The same rule then fired on the real error hiding underneath it. `chiebukuro`
`cli-reference.mdx` and `docs/guides/index.mdx` both claimed 23 MCP tools, split
16 knowledge and 7 memory. The crate declares 24, split 17 and 7. That was a live
false count in published documentation, and this site projected it faithfully. A
gate that cries wolf is a gate people learn to skip, so the second finding is the
more valuable one.

## What didn't work

The first instinct was to fix the guide. Rewriting `daemon-ops` to stop quoting
"40 tools" would have made the build green and deleted the sentence that explains
the drift contract. The documentation existed to make a failure mode legible, and
the check existed to make that failure mode impossible. One of the two had to
change, and it was not the one that was right.

The second instinct was to add an exemption list, a filename here and a phrase
there. That teaches the gate about specific pages, so the next guide that quotes a
figure fails again, and the list is only ever extended.

## Solution

Decide whether a number is an assertion before comparing it to the pin, and treat
quoted text as not-an-assertion.

A count inside a code span, a straight or curly double-quoted run, or a
single-quoted run is being talked about, not claimed. Strip those spans, then
match. Everything left over is asserted and must match the pin:

```js
const NOT_AN_ASSERTION = [
  /`[^`]*`/g, // code spans
  /"[^"\n]*"/g, // straight double quotes
  /“[^”\n]*”/g, // curly double quotes
  /'[^'\n]*'/g, // single quotes
];

function assertedText(line) {
  return NOT_AN_ASSERTION.reduce((text, pattern) => text.replace(pattern, " "), line);
}
```

`chiebukuro`'s `docs/guides/check.mjs` carries the same rule against its own
source-read surface, so the projection and the origin cannot drift apart on what
counts as a claim.

The gate keeps a self-test that refuses to trust its own run. It fails if the
strip lets a quoted figure through as an assertion, and it fails if the strip eats
a genuine one:

```js
if (assertedText('the older "40 tools" is drift').match(COUNT_CLAIM) !== null) { /* fail */ }
if (assertedText("the surface publishes 40 tools").match(COUNT_CLAIM) === null) { /* fail */ }
```

## Why this works

The distinction the regex was missing is between a page *claiming* a number and a
page *mentioning* one. Those are different speech acts, and prose signals the
difference with quotation. Stripping quotations first turns the problem back into
the one the rule was written for: every number that survives is a claim the
repository stands behind, so every number that survives must match the pin.

The alternative, exempting pages, keeps the false positive and loses the rule. This
keeps both halves: `chiebukuro`'s 23 was a real assertion in a real guide, and it
is still caught. A hand-written page that asserts a wrong count exits 1, proven by
injecting "The knowledge plane publishes 99 tools in total" and watching the gate
fail on it before the file was restored.

Note what did not need changing. `toron` needed no code change at all: its index
already said 38, matching the pin and the emitted catalog. The drift the guide
describes was fixed earlier, and the guide was left describing it. Only the
`chiebukuro` figures were wrong, and they were wrong in the repository that owns
them (`bd-a8p`). This site never edits another project's numbers; it reports them.

## Prevention

When a gate fires on prose, read the sentence before changing anything. A
hand-written page that is confidently specific is usually telling the truth about
something the gate cannot see.

Before loosening any check, write the negative test that proves the loosened
version still catches the real defect. A gate with no failing case is a gate that
cannot tell the difference between fixed and broken, and that is the state it was
in before this change.
