---
track: decision
module: apps/toron-dev/scripts/check-commit-convention.mjs
problem_type: process
tags: [git, conventional-commits, beads, audit-trail, force-push]
bead: torondev-copy
created: 2026-09-27
---
# Unifying a commit convention is not worth rewriting verified history

## Symptoms

The history carried two conventions. Twenty-nine commits had a Conventional
Commits subject and thirty-seven did not, which makes `git log` look
inconsistent. The obvious tidy-up is to reword the thirty-seven.

Measuring first showed the tidy-up is not a tidy-up. Twelve of those commits
are named by sha in the beads ledger, as a closed bead's `commit_sha` or inside
a gate row's `sha=` binding, and eight more are named in verification receipts.
Rewriting any of them does not just move a sha, it invalidates a verdict that a
closed bead is resting on. Each one needs `br reopen`, a fresh gate report, and
`br close` again, which is three ledger operations per bead and twelve beads'
worth of superseded rows. One of the twelve, `4d7678c Update all deps to
latest`, is a claim about its own date that cannot honestly be re-verified
today, so its re-gate would be asserting a pass nobody ran.

## What didn't work

The first six reworded commits were done in isolation and cost one bead
rebind. That worked, which is exactly why it is misleading: the sample size
suggested the whole rewrite was cheap. Scaling from six commits and one bead to
thirty-seven commits and twelve beads is not the same operation, and the
unit cost was the part that did not scale linearly. Each rebind appends to a
fail-closed ledger, so the ledger grows a trail of dead references rather than
getting cleaner.

The tempting alternative, exempting the referenced commits from the rewrite,
produces the worst outcome of the three: twenty-five commits reworded, twelve
left alone, and `git log` still visibly mixed.

## Solution

Enforce the convention forward and leave the history exactly as it is.

`scripts/check-commit-convention.mjs` validates a subject against the type
vocabulary this repo actually uses, not the full Conventional Commits list,
because a type that appears for the first time should be a decision. It runs in
two modes: an audit that reports the legacy drift and never fails, and
`--message-file`, which is the git `commit-msg` hook contract, so it gates a
real commit.

The audit mode is deliberately not wired into the freshness gate. A build does
not get to go red because of history it cannot change, and the 37 legacy
commits are exactly that.

The rule and its reasoning are written into `AGENTS.md`, which every agent reads
before it commits, so the convention is enforced where it is actually applied
rather than only where a hook happens to be installed.

## Why this works

The mixed history is a cosmetic defect and the ledger is a correctness
instrument. A prettier `git log` is worth nothing against a ledger whose entire
value is that a recorded pass means somebody ran the command, and rewriting
history converts twelve of those passes into references to commits that no
longer exist. The asymmetry is the whole argument.

Enforcement forward stops the drift from growing, which is the part that was
actually going to keep happening. The 37 old commits are inert: nothing reads
them, nothing gates on them, and nothing about the site depends on their subject
lines.

## Prevention

Before rewriting published history to fix a style, count what binds the commits
you would move. A cheap way is to treat every sha appearing in the ledger and
the receipts as load-bearing and see how many you are about to invalidate.

When the answer is a dozen closed beads, the rewrite is not a style change. It
is a ledger migration wearing a style change as a disguise, and it should be
proposed as one.
