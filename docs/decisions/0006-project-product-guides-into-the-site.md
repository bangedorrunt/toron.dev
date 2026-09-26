# ADR-0006: Project the product guides into the site

**Status:** Accepted (2026-09-26)
**Scope:** How the four product repositories' guides appear on toron.dev.

**Supersedes:** ADR-0003 D4, in one respect only. That decision made the catalog the source of truth for tool names, schemas, and counts and kept product behaviour canonical in the product repositories. Both halves stand. What is withdrawn is the clause it used to justify: that guide bodies are *never projected into the site*, so a plane section may only list a guide and link away to the repository.

**Depends on:** ADR-0002 D3/D4 (catalog contract, the pattern this copies), ADR-0003 D2 (the four planes), ADR-0005 D2 (one renderer for every machine-readable form), ADR-0004 D6 (walkthrough form).

## Context

The plane section pages shipped on 2026-09-26 and were immediately wrong in a way that was easy to miss, because they were internally consistent. Each listed every canonical guide, each row carried a read-when, and the freshness gate verified that no guide was missing from the list. And every row pointed **out**. `/docs/toron` named thirteen guides and the text of all thirteen lived somewhere else, on a GitHub clone of a Rust project.

That is a bad shape for a documentation site, for three reasons that compound.

**A reader has to leave to read.** The site's entire argument is that this stack is legible. The most concrete part of that argument, forty-four documents written by the people who wrote the software, was one click away and formatted as source code.

**The site cannot be read by a machine.** Everything else on the site is now readable by an agent — `llms.txt`, `llms-full.txt`, `/docs/<slug>.md`, an MCP endpoint. The forty-four guides, the largest body of technical writing in the project, were in none of them. An agent asking "how do toron reservations work?" got a link to a repository, not an answer.

**A projection is a normal thing to do.** ADR-0002 already established the pattern for the catalog: sync from the product repository, commit the result, pin it by hash, and fail the build when the copy and the pin disagree. The guides were held back from a mechanism that was already built, tested, and running in the same build. There was no second manual to avoid, because there was no second manual — the repositories are the manual.

There is also a reason the guides were not projected earlier, which turned out to be the only real obstacle. **They are written as plain Markdown, and this site compiles MDX.** Six of the forty-four use `<` or `{` as ordinary punctuation (`P<=2`, `not child <pid>`, a table cell reading `<1s`), and one carries a `description` containing `": "`, which is invalid YAML because the parser reads the colon as a nested mapping. Both are fine Markdown and both kill an MDX build. The answer is not to go edit four repositories into a dialect their authors did not choose.

## Decision

### D1 — The product repository stays the only place a guide is written

Every guide on this site is a projection of `docs/guides/<name>.mdx` in the repository that owns the plane. Nobody edits a guide here. A guide page on this site that has been edited here is a bug, and the build treats it as one.

The section page row now links **in**, to `/docs/<plane>/<name>`, and keeps the canonical repository path in its own column so the provenance of every page is visible on the page that lists it.

### D2 — Two hashes per guide, because the copy is not byte-identical

`catalog/guides.lock.json` records, for each of the forty-four guides: the sha256 of the **upstream bytes** and the sha256 of the **rendered page**, plus the name of the transform that produced the second from the first.

The rendered-hash check runs everywhere, including the Vercel build host, which has no product clone at all. That is what makes a hand-edit of a projected page fail on a machine that has never heard of toron. The source-hash check runs only where a clone is reachable, and where it is not, the gate says so out loud rather than passing quietly. That second check is the only one that catches a guide edited upstream and never re-synced, and it is a local and pre-push check, not a deployment check. This limit is declared in the gate's own `NOT_CHECKED` list.

### D3 — One declared, pure transform, and nothing else

The projection applies exactly one transformation, named in every lock entry:

- `<` and `{` outside a fenced block, an inline code span, or an indented code block become entities, because MDX reads them as a JSX element and an expression.
- A frontmatter value that is ambiguous as a plain YAML scalar is quoted.

Nothing else is touched. Frontmatter is not reformatted, links are not rewritten, headings are not renumbered, and no banner is injected. Every command, flag, and shown output in every guide reaches the reader exactly as its author wrote it, which is also what the product repositories' own gates verify.

The transform is pure and named so that it can be re-derived. A projection that cannot be reproduced is not a projection, it is a fork.

### D4 — Projected pages are exempt from this site's count rule, explicitly

The gate forbids a hand-written page here from quoting a number the catalog pin does not carry. A projected page is exempt, because the numbers in it are the **product's** claims about **its own** surface, written in that product's repository and checked by that product's gate. Holding this site's pin against another project's numbers would fail the build on prose this repository does not own and cannot fix.

This exemption is one named condition in the check, not a general "skip generated files" branch, so a genuinely hand-written page placed under a plane folder by mistake would still be caught.

That exemption immediately paid for itself. It surfaced three claims in the product guides that this site's pin disagrees with: chiebukuro's CLI reference says "23 tools" and "2 resources", and toron's daemon-ops says "40 tools" against a pin of 38. Those are the owning repositories' to fix, and they are filed there. This site does not silently correct another project's documentation.

### D5 — Projected guides are in the nav, in the sitemap, and in every machine-readable form

Each plane gets a folder under `content/docs/guides/`, listed in the walkthroughs nav. Because they are ordinary docs pages, the sitemap derived in ADR-0005 D3 and the `llms` routes from ADR-0005 D2 pick them up with no extra work. The `/docs` tree grows from 52 pages to 96, and `llms-full.txt` grows correspondingly.

### D6 — The command gate now covers the product guides too

`check-guides.mjs` already walked all of `content/docs` and verified every bash command against the live `--help` of whichever of `toron`, `flywheel`, `br`, or `chie` owns it. Projecting the guides puts forty-four more documents through that check, written by four different authors against four different CLIs. It is the same fail-closed rule the site already applied to its own walkthroughs, now covering the manuals themselves.

## Options considered

**Fetch the guides at build time from GitHub.** Rejected. chiebukuro has no public repository, so it cannot work for all four planes, and it would put a network dependency in a build that currently has none.

**Leave the guides in the repositories and improve the linking.** Rejected. The section pages were already internally consistent and still wrong; the problem is not discoverability, it is that the content is not here.

**Rewrite the four repositories' guides to be MDX-safe.** Rejected. Plain Markdown is the right authoring format for a Rust project's `docs/guides/`, and their own gates enforce that shape. Making them conform to this site's renderer inverts the dependency: the documentation would be constrained by one consumer of it.

**Project them with no transformation and fix the escapes at the source.** Rejected, for the same reason as above, and because the frontmatter defect is a genuine bug in a description string rather than a dialect choice.

**Vendor the guides by hand, as a one-time copy.** Rejected outright. That is a second manual, which is the thing ADR-0002 D3 exists to prevent, and it would rot silently.

## Consequences

- `content/docs/guides/<plane>/` holds 44 generated pages plus a `meta.json` per plane. They are **committed**, unlike the generated tool pages, because the build host cannot fetch them. The generated tool pages are gitignored and rebuilt; these cannot be.
- `catalog/guides.lock.json` is a new committed manifest and is exempt from the "every catalog is pinned" rule for the same reason `pins.json` is: it is a manifest of hashes, not a surface, and it is checked entry by entry.
- `scripts/sync-guides.mjs` is the only writer of those pages. It refuses a guide with no frontmatter title, and it deletes a vendored page whose upstream file is gone, so a guide cannot outlive its removal.
- The freshness gate grows: the row href must point at the page that exists, the rendered hash must match, the source hash must match where a clone is reachable, and a projected page absent from the lock fails.
- Anyone editing a guide in a product repository must run `node scripts/sync-guides.mjs` and commit the result. Without that, a local gate run fails. This is the intended friction: it is one command.

## Verification

- `pnpm build` in `apps/toron-dev` is green with 96 `/docs` paths, and the freshness gate reports 44 projected guides and green.
- Running the sync twice writes nothing the second time.
- Each new gate check fails on a deliberate violation: a hand-edited projected page, a row whose href points at a page that does not exist, a lock entry with no file, a page with no lock entry, and an upstream change with no re-sync.
- A rendered page contains the escaped prose and the unescaped code span from the same source line, and the built HTML shows `<pid>` rather than `&lt;pid&gt;`.
- The site copy of a guide differs from its upstream by exactly the transform and nothing else, checked by diffing after undoing the escapes.
