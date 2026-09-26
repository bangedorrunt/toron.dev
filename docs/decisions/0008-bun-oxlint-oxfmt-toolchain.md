# 0008 — bun, oxlint, and oxfmt as the site toolchain

- **Status**: Accepted
- **Date**: 2026-09-27
- **Amends**: ADR-0002 D6, for the three stack rows it does not cover: package
  manager, linter, formatter
- **Supersedes**: nothing. ADR-0002 D3 (generated catalogs) and D6's framework,
  docs, diagram, and analytics rows stay in force.

## Context

The site ran on pnpm 11.21.0 with ESLint 9.39.5 and `eslint-config-next`
16.3.6. There was no formatter at all, so formatting was whatever the last
editor happened to leave behind.

Two problems with that arrangement:

1. `eslint-config-next` carries 86 enabled rules, and replacing it means either
   finding equivalent coverage or accepting a silent regression. This repo
   leans on the React Compiler ruleset, so a gap there is not cosmetic.
2. There is no format check, so style drift is invisible until review.

## Decision

D1 — **bun is the package manager.** bun 1.4.2, pinned in `packageManager`,
`mise.toml`, and both `package.json` files. `pnpm-workspace.yaml` is deleted;
the workspace is declared as `workspaces` in the root `package.json`, which is
what bun reads. `bun.lock` replaces `pnpm-lock.yaml`, and `vercel.json`'s
`ignoreCommand` watches the new path.

bun migrated the pnpm lockfile rather than resolving from scratch, so the
dependency graph carried over rather than being re-derived.

D2 — **oxlint 1.85.0 replaces ESLint.** Config is
`apps/toron-dev/.oxlintrc.jsonc` (JSONC, so the disabled rules carry their
reason inline). Type-aware linting is on, which required adding
`oxlint-tsgolint` alongside the `@typescript/native` already in the tree.

D3 — **oxfmt 0.70.0 is the formatter**, with `format` and `format:check`
scripts, and `format:check` green from this commit.

## Coverage evidence

The migration was measured, not assumed. `--print-config` on the old eslint
setup reported 86 enabled rules, distributed as 22 `@next/*`, 16
`react-hooks`, 20 `@typescript-eslint`, 17 `react`, 6 `jsx-a11y`, 4 core, and
1 `import`.

oxlint 1.85.0 covers both of the load-bearing sets:

- All 16 `react-hooks` rules, including the React Compiler rules this repo
  depends on: `static-components`, `preserve-manual-memoization`,
  `set-state-in-effect`, `error-boundaries`, `incompatible-library`.
- 21 `nextjs` rules, mapping onto `eslint-config-next`'s 22 `@next/next` rules
  (`no-img-element`, `no-html-link-for-pages`, `google-font-display`, and the
  rest).

There is no dropped rule. The trade is coverage width for speed: 0 errors and
49 warnings in 173ms, where ESLint was the only thing running.

## Four rules are off, each for a recorded reason

These are configuration decisions, not suppressed findings, and the reason
sits next to the rule in `.oxlintrc.jsonc`.

- `react/react-in-jsx-scope` — obsolete under the React 19 automatic JSX
  runtime. It fired 462 times and buried every other diagnostic.
- `typescript/require-array-sort-compare` — the gate scripts in
  `check-freshness.mjs` and `check-guides.mjs` sort file-name and object-key
  arrays by code unit on purpose, because that ordering feeds the canonical
  content hash. Adding a locale-aware comparator would change the hash and
  break the catalog pin. Anyone "fixing" these four warnings reintroduces a
  silent freshness-gate failure.
- `typescript/unbound-method` — `proxy.ts` destructures `rewritePath()`
  results, which are plain closures over a returned literal. There is no `this`
  to lose.
- `jsx_a11y/prefer-tag-over-role` — the architecture ownership table is a div
  grid carrying valid ARIA `table`/`row`/`columnheader`/`cell` roles, with a
  responsive two-column collapse keyed off `.toron-ownership-table__row`.
  Converting it to real table tags needs its own CSS pass. It is a genuine
  follow-up, not a dismissed finding.

## Consequences

- `apps/toron-dev/eslint.config.mjs` is deleted. `eslint` and
  `eslint-config-next` are no longer installed.
- oxfmt reformatted 88 of 113 files. That lands as its own commit so the
  toolchain diff stays reviewable.
- oxfmt is pre-1.0 at 0.70.0, so its output can shift between releases. The
  exact-version pin required by `AGENTS.md` contains that, and the next pin
  bump should re-read the reformat commit rather than merge it silently.
- `lucide-react` and `zod` were removed as genuinely unreferenced.
  `mermaid-isomorphic` was audited and **kept**: it has no source import, but
  ADR-0002 D6 names it in the build-time-mermaid decision, so the explicit pin
  is deliberate and stays.
- Anything that type-checks or builds on Vercel now goes through bun. The
  `buildCommand` in `vercel.json` is unchanged and still invokes `node`
  directly, which bun's install does not affect.

## Verification

- `bun install` resolves 441 packages and writes `bun.lock`.
- `bun run --filter toron-dev lint` reports 0 errors, exit 0.
- `bun run --filter toron-dev format:check` reports 0 files needing changes.
- `bun run build` is green and the freshness gate reports `green`, still
  44 projected guides and 38 pinned tools.
