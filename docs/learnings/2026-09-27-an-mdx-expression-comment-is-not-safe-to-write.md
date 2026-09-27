# An MDX expression comment is not safe to write

**What happened.** A `{/* ... */}` comment was added to `content/docs/index.mdx` to
explain why the four-plane row renders where the Markdown table used to. `oxfmt`
then formatted the file, `format:check` passed, and `bun run build` died:

```
./apps/toron-dev/content/docs/index.mdx
Error: Error evaluating Node.js code
11:3: Could not parse expression with acorn
Caused by: SyntaxError: Unterminated regular expression
```

The formatter had rewritten the delimiters to `{/_ ... _/}`. In MDX a `{...}` block
is a JavaScript expression, so `/_ ... _/` is a division by a regex literal and the
parser stops there. The build is the only thing that noticed: `format:check` passes
on the mangled form, because the mangling is what it produced.

**What to do instead.** Do not write JSX comments in MDX files in this repo. Put the
reason in the component that renders the thing, in the ADR, or in prose outside the
expression. There is no lint that catches this, so the rule is the point.

**Why it is worth remembering.** The failure was loud but the cause was invisible in
the source diff: the comment read correctly in review, because the reviewer was not
reading `/_ ... _/`. It also arrived *after* every other gate had gone green, and the
thing that caught it was the harness printing `build-output checks SKIPPED because no
build was there to read` — a check that says it did not run is worth more than one
that stays quiet when there is nothing to check.
