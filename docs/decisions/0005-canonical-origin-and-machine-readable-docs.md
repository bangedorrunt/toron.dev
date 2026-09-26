# ADR-0005: One origin constant, and docs served to agents as Markdown

**Status:** Accepted (2026-09-26)
**Scope:** The site's canonical origin, its sitemap and robots output, and the machine-readable representations of the docs surface.

**Amends:** nothing. **Depends on:** ADR-0002 D6 (stack, analytics), ADR-0003 D4 (docs projection from the catalog), ADR-0004 D6 (walkthrough form), ADR-0004 D7 (nav and site map).

## Context

Two things were true on 2026-09-26 that should never both be true.

The first is that the site advertised an origin it does not serve. `app/layout.tsx` set `metadataBase` to `https://toron.dev`, the JSON-LD `WebSite` block carried the same URL, `openGraph.url` carried it, and both `app/sitemap.ts` and `app/robots.ts` built every URL on it. The Vercel project `toron-dev` has **no domain attached at all** and serves at `https://toronmail.vercel.app`. Separately, `toron.dev` resolves and redirects to `sel.toron.dev`, a paid Mac screen-sharing application called Sel. So the sitemap was instructing crawlers to index an unrelated commercial product, and every canonical link on every page pointed off-site. The repository name and the brand name are the same string as that domain, which is almost certainly how the wrong URL got into five files and survived review: it read as correct.

The second is that the docs already *promised* a machine-readable surface and did not deliver it. `app/docs/[[...slug]]/page.tsx` renders `MarkdownCopyButton` and `ViewOptionsPopover` on every page, and both take their target from `getPageMarkdownUrl(page).url`, which builds `/llms.mdx/docs/<slug>/content.md`. That route does not exist. `includeProcessedMarkdown` is already on in `lib/source.ts` and `getLLMText` is already written, so the plumbing was half-built and the last mile was never wired. The result is a dead control on every docs page: a reader who clicks "Copy page" or "View as Markdown" gets a 404. Fumadocs also generates `llms.txt` and `llms-full.txt` from the same renderer, and neither exists.

A third, smaller problem: `app/sitemap.ts` hand-lists its URLs. It is missing `/docs/toron`, `/docs/flywheel`, `/docs/beads`, and `/docs/chiebukuro`, which were added after it was last edited, and it will miss every generated tool page and every guide added next. A hand-maintained URL list in a site whose whole premise is that the catalog is the source of truth is the same class of bug as a hand-typed schema.

## Decision

### D1 — The origin is one exported constant, and it names the host that serves

`lib/shared.ts` exports `siteUrl`. Every origin reference reads it: `metadataBase`, the JSON-LD `WebSite.url`, `openGraph.url`, the sitemap base, and the robots sitemap line. There is no second literal.

**A URL that does not serve this site may never appear in metadata.** That is the rule, and it is what the freshness gate checks. The constant is the only place an origin is written, so the failure mode "someone typed the brand name where a hostname goes" has exactly one place to happen, and the gate reads it back.

`siteUrl` currently resolves to `https://toronmail.vercel.app` because that is where the project is deployed. When a domain is attached to the Vercel project, this constant changes and nothing else does. Note for whoever does it: the domain must not be `toron.dev`, which belongs to another product.

### D2 — Docs are served to agents in Markdown, and no control may point at a route that does not exist

The site serves three machine-readable representations of the docs:

| Route | Content |
|---|---|
| `/llms.txt` | the page tree as an index, with titles and descriptions |
| `/llms-full.txt` | every page rendered, joined |
| `/docs/<slug>.md` | one page as Markdown, `Content-Type: text/markdown` |

`/docs/<slug>.md` is a rewrite onto `/llms.mdx/docs/<slug>/content.md`, which is the route `getPageMarkdownUrl` already builds. **The rewrite and `getPageMarkdownUrl` are the same contract**, so the button and the route cannot drift apart: the URL the page advertises is the URL the rewrite serves.

Markdown is rendered from the *processed* document, not the raw file, so MDX components and the build-time mermaid pass are already resolved when an agent reads a page. A `docsLlms` renderer is exported from `lib/source.ts` and is the single implementation behind all three routes and the MCP tools.

**Forbidden:** a docs page control whose target has no route behind it. A dead affordance is worse than an absent one, because it advertises a capability the site does not have.

### D3 — The sitemap derives docs URLs from the source tree

`app/sitemap.ts` keeps a hand-written list for the marketing routes, because their change frequency and priority are editorial judgements. Every docs URL is generated from `source.getPages()` instead. Adding a guide, a plane section, or a generated tool page now puts it in the sitemap without anyone remembering.

### D4 — An MCP endpoint exposes the same surface

`/api/mcp` serves the Fumadocs MCP handler over streamable HTTP, with `list_pages`, `get_page`, and `search`. The page tools read through `docsLlms`, so an agent connected over MCP sees byte-identical Markdown to an agent fetching `/docs/<slug>.md`. There is no second renderer and no MCP-only formatting.

### D5 — The gate checks the origin and the sitemap

`scripts/check-freshness.mjs` gains two checks, both of which can fail the build:

1. **Origin.** No file under `apps/toron-dev/app` or `apps/toron-dev/lib` may contain a bare `https://toron.dev` literal. The origin lives in `lib/shared.ts` or nowhere.
2. **Sitemap coverage.** Every page the docs source exposes must appear in the sitemap output. A page that renders but is not listed is drift the same way a missing pin is.

Both carry the usual self-test: the gate refuses to run if its own check has stopped biting.

## Options considered

**Attach a real domain first, then write the constant.** Rejected for now, not on principle. It is the better end state, but it needs a DNS change and a name, and the wrong-origin defect is live now. The constant is written so that attaching a domain later is a one-line change.

**Leave the origin alone and only add the llms routes.** Rejected. The sitemap actively misdirects crawlers to a different company's product; that is a defect, not a style question, and it is the kind that gets a site de-indexed or mistaken for the other product.

**Generate the llms routes at build time as static files instead of route handlers.** Rejected. Route handlers with `revalidate = false` and `generateStaticParams` are pre-rendered by the same build, so the output is static either way, and route handlers let the same renderer serve the MCP tools without a second build step.

**Hand-write the `llms.txt` index.** Rejected. It would be a sixth hand-maintained list on this site.

## Consequences

- `lib/shared.ts` gains `siteUrl`, and five files stop hardcoding an origin.
- Two new route trees (`app/llms.txt`, `app/llms-full.txt`, `app/llms.mdx`) and one new API route (`app/api/mcp`).
- `@modelcontextprotocol/server` and `zod` enter `apps/toron-dev/package.json` as exact pins. They are optional peer dependencies of `fumadocs-core` and are needed only because `/api/mcp` imports `fumadocs-core/mcp`. Nothing else in the site pulls them in, so a site that drops D4 can drop both.
- The sitemap grows by four plane pages plus every generated tool page.
- The MCP endpoint is public and unauthenticated, like the rest of the site. It exposes only content that is already public and already in `llms-full.txt`, so it adds no new disclosure surface. It does add an unauthenticated endpoint to the project's attack surface, which is a reason to keep it on the same deployment rather than adding infrastructure.

## Verification

- `pnpm build` in `apps/toron-dev` is green.
- `/llms.txt`, `/llms-full.txt`, `/docs/<slug>.md`, and `/api/mcp` answer on the deployed URL; `/docs/<slug>.md` returns `Content-Type: text/markdown`.
- `robots.txt` and `sitemap.xml` on the deployed URL contain no `toron.dev` string.
- The two new gate checks each fail the build when violated, proven by running them against a deliberate violation.
