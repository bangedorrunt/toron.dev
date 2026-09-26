// governed-by: ADR-0003 D4, ADR-0002 D3/D4
//
// The docs freshness gate. One question per artifact: is what this site still
// renders what the product exposes, and is every canonical guide the
// walkthroughs project still where it was?
//
// Two halves, because they run in different places.
//
// 1. In-repo, fail-closed, runs in every build including Vercel's: a committed
//    catalog must match its pin in `catalog/pins.json` by count and by a
//    canonical content hash, a catalog file with no pin fails, a hand-written
//    page may not claim a count that is not pinned, the generated tool pages
//    must match the pinned tool count, and every entry in
//    `content/docs/guides/canonical.json` must name a site page that exists.
//
// 2. Upstream, best effort with a loud skip: where the product binary or a
//    product repo clone is reachable, the committed catalog is compared against
//    that live surface and each pinned guide source is checked for existence and
//    frontmatter title. Where it is not reachable (Vercel has neither), it says
//    so out loud instead of passing quietly.
//
// Why a pin is a hash and not a count: a count misses a renamed flag, an edited
// description, and a schema that gained a field. Between the 1.1.0 catalog this
// site carried and the 1.5.0 product, 30 of 38 tool bodies changed while the
// tool count sat still at 38 and 10 CLI commands were missing outright.
//
// A pin is never auto-rewritten. The failure prints the new hash so the diff can
// be reviewed first; bumping a pin is the operator saying yes, on purpose.
//
// ADR-0005 adds three more, all in-repo and fail-closed: the site origin is one
// constant and no other file may hardcode a hostname, the sitemap must list every
// route that renders and must not list a docs URL twice, and the Markdown URL
// the docs pages advertise must have a route behind it.
//
// Run via `prebuild` / `predev` and by the Vercel buildCommand.
import { spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import {
  existsSync,
  mkdirSync,
  mkdtempSync,
  readdirSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, relative, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";

const HERE = dirname(fileURLToPath(import.meta.url));
const APP_ROOT = resolve(HERE, "..");
const REPO_ROOT = resolve(APP_ROOT, "../..");
const CATALOG_DIR = join(REPO_ROOT, "catalog");
const DOCS_DIR = join(APP_ROOT, "content", "docs");
const GUIDES_DIR = join(DOCS_DIR, "guides");
const PINS_PATH = join(CATALOG_DIR, "pins.json");
const CANONICAL_PATH = join(GUIDES_DIR, "canonical.json");
const PLANES_PATH = join(DOCS_DIR, "planes.json");
const DOCS_META_PATH = join(DOCS_DIR, "meta.json");
const GUIDE_LOCK_PATH = join(CATALOG_DIR, "guides.lock.json");
const APP_DIR = join(APP_ROOT, "app");
const LIB_DIR = join(APP_ROOT, "lib");
const SHARED_PATH = join(LIB_DIR, "shared.ts");
const NEXT_CONFIG_PATH = join(APP_ROOT, "next.config.mjs");

const GROUPS = ["tools", "resources", "cli_commands"];
// Generated from the catalogs on every build, so their counts are checked
// against the pin instead of the prose rule (the generator writes them).
const GENERATED = ["tools", "reference.mdx"];
const TOOLS_DIR = join(DOCS_DIR, "tools");
// "38 tools", "25 resources", "19 CLI commands": a count a page asserts in prose.
const COUNT_CLAIM = /\b(\d+)[\s-]+(?:MCP\s+)?(tools|resources|CLI commands|commands)\b/gi;
const TITLE_LINE = /^title:\s*(.+?)\s*$/m;
// A guide row on a plane section: | [Title](/docs/guides/<plane>/<slug>) | Read when | `<repo>/docs/guides/x.mdx` |
// The title is a link because ADR-0006 projects the guide body into the site,
// so the row is a way in, not a way out. Four captures: title text, href, and
// the canonical source path. The href is checked too, so a row cannot point at
// a page that does not exist while still naming a real guide.
const GUIDE_ROW =
  /^\|\s*\[([^\]]+)\]\(([^)]+)\)\s*\|\s*([^|]+?)\s*\|\s*`[^`]*?(docs\/guides\/[a-z0-9-]+\.mdx)`\s*\|\s*$/;

// What this gate does NOT check, declared in the checker rather than left for a
// reader to infer. herdr's config_reference_check.py keeps the same discipline
// with its SKIPPED_SUBTREES list, so an open-ended surface is an explicit skip
// instead of a silent gap. Keep this list short and true: an item that moves
// into the checked set above must leave this list in the same change.
const NOT_CHECKED = [
  "product-repo prose: only files named in canonical.json are checked for existence and frontmatter title, never their content",
  "projected guide freshness where no product checkout is reachable: on Vercel the committed copies are hash-checked against the lock, but comparing them against the real repositories is skipped, not passed",
  "translation parity: the site is English only (ADR-0001 D3), so there is no second locale to compare",
  "toron config keys: no config reference page is published yet, so the config model is not compared against anything",
  "rendered page text: tool names, counts, and the catalog surface are pinned, the prose a generator emits around them is not diffed",
  "upstream surface where no product binary or checkout is reachable: on Vercel the live comparison is skipped, not passed",
  "machine-readable output: the llms, markdown, and MCP routes are checked for existing behind the URLs the site advertises, their rendered text is not diffed",
];

const rel = (p) => relative(REPO_ROOT, p);
const name = (entry) => String(entry?.name ?? "");

// Key-sorted JSON, so a re-ordering upstream is not reported as drift.
function stable(value) {
  if (Array.isArray(value)) return value.map(stable);
  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.keys(value)
        .sort()
        .map((k) => [k, stable(value[k])]),
    );
  }
  return value;
}

function surfaceHash(catalog) {
  const surface = {};
  for (const g of GROUPS)
    surface[g] = [...(catalog?.[g] ?? [])].sort((a, b) => name(a).localeCompare(name(b)));
  surface.schema_version = catalog?.schema_version ?? null;
  return createHash("sha256")
    .update(JSON.stringify(stable(surface)))
    .digest("hex");
}

function countsOf(catalog) {
  return Object.fromEntries(GROUPS.map((g) => [g, (catalog?.[g] ?? []).length]));
}

// Human-readable drift, used for both pin-vs-file and file-vs-live.
function diffSurfaces(pinned, actual) {
  const out = [];
  for (const g of GROUPS) {
    const before = pinned?.[g] ?? [];
    const after = actual?.[g] ?? [];
    if (before.length !== after.length) {
      out.push(`${g}: ${before.length} before, ${after.length} now`);
    }
    const beforeNames = new Set(before.map(name));
    const afterNames = new Set(after.map(name));
    for (const n of [...afterNames].filter((n) => !beforeNames.has(n)).sort())
      out.push(`${g} added ${n}`);
    for (const n of [...beforeNames].filter((n) => !afterNames.has(n)).sort())
      out.push(`${g} removed ${n}`);
    const beforeByName = new Map(before.map((e) => [name(e), e]));
    const changed = [...beforeByName.keys()]
      .filter((n) => {
        const mine = beforeByName.get(n);
        const theirs = after.find((e) => name(e) === n);
        return theirs && JSON.stringify(stable(mine)) !== JSON.stringify(stable(theirs));
      })
      .sort();
    if (changed.length > 0) {
      const shown = changed.slice(0, 3).join(", ");
      out.push(
        `${g}: ${changed.length} changed in place (${shown}${changed.length > 3 ? ", …" : ""})`,
      );
    }
  }
  if ((pinned?.schema_version ?? null) !== (actual?.schema_version ?? null)) {
    out.push(
      `schema_version: ${pinned?.schema_version ?? null} before, ${actual?.schema_version ?? null} now`,
    );
  }
  return out;
}

function readJson(path, what) {
  if (!existsSync(path)) {
    console.error(`FAIL ${what} is missing: ${rel(path)}`);
    process.exit(1);
  }
  try {
    return JSON.parse(readFileSync(path, "utf8"));
  } catch (e) {
    console.error(`FAIL ${what} is not valid JSON: ${rel(path)} (${e.message})`);
    process.exit(1);
  }
}

// sync-catalogs.sh is the only thing that clones over the network. The gate
// reads what is already on disk, so the same env convention names a local clone.
function resolveRepo(plane) {
  const overrideVar = `TORON_SYNC_${String(plane).toUpperCase()}_REPO`;
  const override = process.env[overrideVar];
  if (override) {
    if (override.startsWith("http"))
      return { path: null, why: `${overrideVar} is a URL, and the gate does not clone` };
    if (existsSync(override)) return { path: override, how: `${overrideVar}` };
    return { path: null, why: `${overrideVar}=${override} does not exist` };
  }
  const sibling = join(REPO_ROOT, "..", plane);
  if (existsSync(join(sibling, "docs"))) return { path: sibling, how: "sibling clone" };
  return { path: null, why: `no ${plane} checkout at ../${plane}` };
}

// The running product is authoritative for its own surface; a repo file is the
// fallback, since that is what sync-catalogs.sh copies.
function liveSurface(pin) {
  const cmd = pin.catalog_command;
  if (Array.isArray(cmd) && cmd.length > 0) {
    const r = spawnSync(cmd[0], cmd.slice(1), { encoding: "utf8", timeout: 60000 });
    if (r.error) return { why: `${cmd[0]} is not runnable here` };
    if (r.status !== 0) return { why: `${cmd.join(" ")} exited ${r.status}` };
    try {
      return { catalog: JSON.parse(r.stdout), how: `${cmd.join(" ")} (live product)` };
    } catch {
      return { why: `${cmd.join(" ")} did not emit JSON` };
    }
  }
  const repo = resolveRepo(pin.repo);
  if (!repo.path) return { why: repo.why };
  const file = join(repo.path, pin.upstream_path ?? "");
  if (!existsSync(file)) return { why: `${pin.repo}/${pin.upstream_path} is absent` };
  try {
    return {
      catalog: JSON.parse(readFileSync(file, "utf8")),
      how: `${pin.repo}/${pin.upstream_path} (${repo.how})`,
    };
  } catch {
    return { why: `${pin.repo}/${pin.upstream_path} is not valid JSON` };
  }
}

function frontmatterTitle(file) {
  const src = readFileSync(file, "utf8");
  if (!src.startsWith("---\n")) return null;
  const close = src.indexOf("\n---\n", 4);
  if (close === -1) return null;
  const m = src.slice(4, close).match(TITLE_LINE);
  return m ? m[1].replace(/^['"]|['"]$/g, "").trim() : null;
}

function walk(dir, out = []) {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const p = join(dir, entry.name);
    if (entry.isDirectory()) walk(p, out);
    else if (entry.name.endsWith(".mdx")) out.push(p);
  }
  return out;
}

// ------------------------------------------------------- origin, sitemap, llms
//
// Three checks added by ADR-0005, each written as a pure function over plain
// data so the self-test can mutate its inputs and prove the check still bites.

// `walk` above collects MDX only, so it returns nothing for app/ and lib/. The
// first version of the origin check used it and reported "0 sources scanned",
// green, having checked nothing: a gate that cannot fail is theater, which is
// the same lesson the diff self-test above records. This walker exists so that
// mistake is not available, and the check below refuses to pass on an empty
// scan.
const SOURCE_EXT = /\.(ts|tsx|mjs|js)$/;
const SOURCE_SKIP = new Set(["node_modules", ".next", ".source", ".git"]);

function walkSources(dir, out = []) {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    if (entry.name.startsWith(".") && entry.isDirectory()) continue;
    const p = join(dir, entry.name);
    if (entry.isDirectory()) {
      if (!SOURCE_SKIP.has(entry.name)) walkSources(p, out);
    } else if (SOURCE_EXT.test(entry.name)) {
      out.push(p);
    }
  }
  return out;
}

// A hostname literal. `toron.dev` as a BRAND is fine and appears in titles,
// alt text, and JSON-LD names; `toron.dev` as a HOST is the defect, because
// that domain serves an unrelated product rather than this site.
const ORIGIN_LITERAL = /https?:\/\/(?:www\.)?toron\.dev\b/;

function originLiterals(text) {
  return [...text.matchAll(new RegExp(ORIGIN_LITERAL.source, "g"))].map((m) => m[0]);
}

// The sitemap is a merge of a hand-written marketing list and the docs pages
// the source exposes. Two things can go wrong that reading neither list alone
// would show: a route that exists but was never listed, and a URL that both
// halves produce, which renders as a duplicate entry for a crawler.
function sitemapProblems({ marketing, staticRoutes }) {
  const out = [];
  // The root is written `''` in the hand list and derived as `/` from the
  // filesystem. They are one URL, so compare them as one; otherwise the check
  // would report a phantom failure and train everyone to ignore it.
  const norm = (route) => (route === "" || route === "/" ? "/" : route.replace(/\/$/, ""));
  const listed = new Set(marketing.map(norm));

  for (const route of staticRoutes) {
    if (!listed.has(norm(route)))
      out.push(`${route} renders a page but is absent from the sitemap`);
  }
  for (const route of marketing) {
    if (norm(route).startsWith("/docs")) {
      out.push(
        `${route} is listed by hand, but docs URLs are derived from the source tree and this will duplicate`,
      );
    }
  }
  return out;
}

// The docs pages advertise a Markdown URL. That URL is a promise, and a
// promise with no route behind it is a dead button on every page. This is the
// check that would have caught the missing llms.mdx route.
function markdownRouteProblems({ docsContentRoute, appDir, nextConfig }) {
  const out = [];
  const routeFile = join(
    appDir,
    ...docsContentRoute.split("/").filter(Boolean),
    "[[...slug]]",
    "route.ts",
  );
  if (!existsSync(routeFile)) {
    out.push(
      `${docsContentRoute} is advertised by getPageMarkdownUrl but no route serves it (expected ${rel(routeFile)})`,
    );
  }
  if (!/source:\s*(['"])\/docs\/:slug\*\.md\1/.test(nextConfig)) {
    out.push(
      "next.config.mjs has no /docs/:slug*.md rewrite, so the pretty Markdown URL 404s even though the route exists",
    );
  }
  return out;
}

let failed = 0;
let skipped = 0;
const fail = (msg) => {
  console.error(`FAIL ${msg}`);
  failed = 1;
};
const ok = (msg) => console.log(`ok   ${msg}`);
const skip = (msg) => {
  console.warn(`skip ${msg}`);
  skipped += 1;
};

// ------------------------------------------------------------------- self-test

// A gate nobody proved bites is a gate that reports whatever the code happens
// to do. Two mutations, both of which must be caught before anything is trusted.
function selfTest() {
  const base = {
    schema_version: 1,
    tools: [{ name: "a" }, { name: "b" }],
    resources: [],
    cli_commands: [],
  };
  const dropped = { ...base, tools: [{ name: "a" }] };
  if (!diffSurfaces(base, dropped).some((d) => d.includes("removed b"))) {
    console.error(
      "FAIL the surface diff does not catch a removed entry, refusing to trust this run",
    );
    process.exit(1);
  }
  const edited = { ...base, tools: [{ name: "a", parity: "x" }, { name: "b" }] };
  if (!diffSurfaces(base, edited).some((d) => d.includes("changed in place"))) {
    console.error(
      "FAIL the surface diff does not catch an in-place edit, refusing to trust this run",
    );
    process.exit(1);
  }
  if (surfaceHash(base) === surfaceHash(dropped)) {
    console.error("FAIL the surface hash ignores a removed entry, refusing to trust this run");
    process.exit(1);
  }

  // ADR-0005 self-tests. A brand mention must NOT trip the origin check, or
  // the rule gets weakened into uselessness by the first title that says
  // "toron.dev"; a hostname literal must trip it.
  if (originLiterals("siteName: 'toron.dev'").length !== 0) {
    console.error("FAIL the origin check flags the brand name, refusing to trust this run");
    process.exit(1);
  }
  if (originLiterals("url: 'https://toron.dev'").length !== 1) {
    console.error("FAIL the origin check misses a hostname literal, refusing to trust this run");
    process.exit(1);
  }

  const healthy = { marketing: ["/", "/architecture"], staticRoutes: ["/", "/architecture"] };
  if (sitemapProblems(healthy).length !== 0) {
    console.error("FAIL the sitemap check fires on a consistent pair, refusing to trust this run");
    process.exit(1);
  }
  if (
    !sitemapProblems({ marketing: ["/"], staticRoutes: ["/", "/architecture"] }).some((p) =>
      p.includes("/architecture"),
    )
  ) {
    console.error("FAIL the sitemap check misses an unlisted route, refusing to trust this run");
    process.exit(1);
  }
  if (
    !sitemapProblems({ marketing: ["/", "/docs/guides"], staticRoutes: ["/"] }).some((p) =>
      p.includes("duplicate"),
    )
  ) {
    console.error(
      "FAIL the sitemap check misses a hand-listed docs route, refusing to trust this run",
    );
    process.exit(1);
  }

  // The fixture is built here rather than pointed at the real app/, so that
  // deleting a route in the repo fails the CHECK with a message about the
  // route, instead of failing this self-test with a message about the
  // self-test. Both are red, but only one of them tells anyone what to fix.
  const fixture = mkdtempSync(join(tmpdir(), "freshness-selftest-"));
  try {
    mkdirSync(join(fixture, "llms.mdx", "docs", "[[...slug]]"), { recursive: true });
    writeFileSync(join(fixture, "llms.mdx", "docs", "[[...slug]]", "route.ts"), "");
    const wired = {
      docsContentRoute: "/llms.mdx/docs",
      appDir: fixture,
      nextConfig: "{ source: '/docs/:slug*.md' }",
    };
    if (markdownRouteProblems(wired).length !== 0) {
      console.error(
        "FAIL the markdown-route check fires on a wired site, refusing to trust this run",
      );
      process.exit(1);
    }
    if (
      !markdownRouteProblems({ ...wired, appDir: join(fixture, "no-such-dir") }).some((p) =>
        p.includes("no route serves it"),
      )
    ) {
      console.error(
        "FAIL the markdown-route check misses an absent route, refusing to trust this run",
      );
      process.exit(1);
    }
    if (!markdownRouteProblems({ ...wired, nextConfig: "{}" }).some((p) => p.includes("rewrite"))) {
      console.error(
        "FAIL the markdown-route check misses a missing rewrite, refusing to trust this run",
      );
      process.exit(1);
    }
  } finally {
    rmSync(fixture, { recursive: true, force: true });
  }

  console.log(
    "ok   self-test: a removed entry, an in-place edit, a hash change, a hostname literal, an unlisted route, a duplicate sitemap URL, an absent markdown route, and a missing rewrite are all caught",
  );
}

// ----------------------------------------------------------------- the checks

selfTest();

const pins = readJson(PINS_PATH, "the catalog pin manifest");
const catalogs = pins.catalogs ?? {};
const pinNames = Object.keys(catalogs);
if (pinNames.length === 0) fail(`${rel(PINS_PATH)} pins no catalogs, so nothing is checked`);

// Pinned counts are the only numbers a hand-written page may claim.
const allowedCounts = new Set();
for (const pin of Object.values(catalogs)) {
  for (const n of Object.values(pin.counts ?? {})) allowedCounts.add(n);
}

const committed = new Map();
for (const [file, pin] of Object.entries(catalogs)) {
  const path = join(CATALOG_DIR, file);
  if (!existsSync(path)) {
    fail(`${rel(path)} is pinned but absent`);
    continue;
  }
  const catalog = readJson(path, "a catalog");
  committed.set(file, catalog);

  const actual = countsOf(catalog);
  const expected = pin.counts ?? {};
  const countDrift = GROUPS.filter(
    (g) => expected[g] !== undefined && expected[g] !== actual[g],
  ).map((g) => `${g}: pinned ${expected[g]}, file has ${actual[g]}`);
  if (countDrift.length > 0) fail(`${rel(path)} ${countDrift.join("; ")}`);
  else ok(`${rel(path)} counts ${GROUPS.map((g) => `${g}=${actual[g]}`).join(" ")} match the pin`);

  const hash = surfaceHash(catalog);
  if (pin.surface_sha256 && pin.surface_sha256 !== hash) {
    fail(
      `${rel(path)} surface changed since it was pinned (pin ${pin.surface_sha256.slice(0, 12)}…, file ${hash.slice(0, 12)}…). ` +
        `Read the diff above, then set surface_sha256 to ${hash} in ${rel(PINS_PATH)} on purpose`,
    );
  } else if (pin.surface_sha256) {
    ok(`${rel(path)} surface hash ${hash.slice(0, 12)}… matches the pin`);
  } else {
    fail(`${rel(path)} has no surface_sha256 pin, so a changed tool body would pass silently`);
  }
}

// A catalog that nothing pins renders pages with no freshness contract at all.
// Two files are exempt, and both are manifests rather than surfaces: pins.json
// is the pin manifest itself, and guides.lock.json is a per-file hash manifest
// whose whole job is to pin the projected guides. Neither renders a page, and
// the lock is checked entry by entry against the files it names.
const NOT_A_SURFACE = new Set(["pins.json", "guides.lock.json"]);
for (const entry of readdirSync(CATALOG_DIR)) {
  if (NOT_A_SURFACE.has(entry)) continue;
  if (entry.endsWith(".json") && !pinNames.includes(entry)) {
    fail(`catalog/${entry} is not pinned in ${rel(PINS_PATH)}, so its drift would go unnoticed`);
  }
}

// The plane manifest is read here rather than beside the plane-coverage checks
// because the count-claim rule below needs to know which folders under
// content/docs/guides hold projected pages.
const planeManifest = readJson(PLANES_PATH, "the plane manifest");
const planes = planeManifest.planes ?? [];
if (planes.length === 0)
  fail(`${rel(PLANES_PATH)} declares no planes, so plane coverage is unchecked`);

// The generated pages are the catalog rendered, so their number is the pin.
// They are gitignored build artifacts, so a clean checkout has none yet. That is
// a skip rather than a failure: the Vercel buildCommand generates them before
// this gate runs, which is where the check has to bite.
const toolPages = existsSync(TOOLS_DIR) ? walk(TOOLS_DIR).length : null;
const pinnedTools = Object.values(catalogs).reduce((n, pin) => n + (pin.counts?.tools ?? 0), 0);
if (toolPages === null) {
  skip(
    "content/docs/tools is absent, so the generated page count is unchecked (run generate-tool-docs)",
  );
} else if (toolPages !== pinnedTools) {
  fail(
    `content/docs/tools holds ${toolPages} pages for ${pinnedTools} pinned tools, run generate-tool-docs`,
  );
} else {
  ok(`content/docs/tools holds ${toolPages} pages for ${pinnedTools} pinned tools`);
}

// A hand-written page may not quote a count the pin does not carry. A PROJECTED
// page is exempt: it is the product's own claim about its own surface, written
// in that product's repository and checked by that product's gate. Holding this
// site's pin against another project's numbers would fail the build on prose
// this repo does not own and cannot fix.
//
// QUOTED TEXT IS EXEMPT, and that exclusion was not theoretical. toron's
// daemon-ops guide explains the catalog contract and, doing so, quotes the stale
// figure it is warning about: "the guide index's older \"40 tools\" is exactly
// the drift the gate is for". The first version of this check failed the build
// on that sentence, because the number inside a quotation is indistinguishable
// from an assertion to a regex. The guide was right and the gate was wrong.
//
// The rule is therefore: a count that appears inside a code span, a straight
// or curly double-quoted run, or a single-quoted run is being talked about, not
// asserted, and is not this check's business. Everything else is asserted and
// must match the pin.
const NOT_AN_ASSERTION = [
  /`[^`]*`/g, // code spans
  /"[^"\n]*"/g, // straight double quotes
  /“[^”\n]*”/g, // curly double quotes
  /'[^'\n]*'/g, // single quotes
];

function assertedText(line) {
  return NOT_AN_ASSERTION.reduce((text, pattern) => text.replace(pattern, " "), line);
}

if (assertedText('the older "40 tools" is drift').match(COUNT_CLAIM) !== null) {
  console.error(
    "FAIL the count check reads a quoted figure as an assertion, refusing to trust this run",
  );
  process.exit(1);
}
if (assertedText("the surface publishes 40 tools").match(COUNT_CLAIM) === null) {
  console.error("FAIL the count check misses an asserted figure, refusing to trust this run");
  process.exit(1);
}

for (const file of walk(DOCS_DIR)) {
  const underDocs = relative(DOCS_DIR, file);
  if (GENERATED.some((g) => underDocs === g || underDocs.startsWith(`${g}/`))) continue;
  const [, planeSegment] = underDocs.split("/");
  if (underDocs.startsWith("guides/") && planes.some((p) => p.plane === planeSegment)) continue;
  readFileSync(file, "utf8")
    .split("\n")
    .forEach((line, i) => {
      for (const m of assertedText(line).matchAll(COUNT_CLAIM)) {
        const n = Number(m[1]);
        if (!allowedCounts.has(n)) {
          fail(
            `${rel(file)}:${i + 1} claims "${m[0].trim()}", and ${n} is not a pinned count (${[...allowedCounts].sort((a, b) => a - b).join(", ")})`,
          );
        }
      }
    });
}
ok(
  `hand-written pages quote no count outside the pin (${[...allowedCounts].sort((a, b) => a - b).join(", ")} pinned)`,
);

// Upstream: compare the committed catalog with the live product surface.
for (const [file, pin] of Object.entries(catalogs)) {
  const catalog = committed.get(file);
  if (!catalog) continue;
  const live = liveSurface(pin);
  if (!live.catalog) {
    skip(`upstream surface for ${file} not checked: ${live.why}`);
    continue;
  }
  const drift = diffSurfaces(catalog, live.catalog);
  if (drift.length === 0) {
    ok(`${rel(file)} matches the live surface from ${live.how}`);
  } else {
    fail(
      `${rel(join(CATALOG_DIR, file))} has drifted from ${live.how}: ${drift.join("; ")}.\n` +
        `     fix: TORON_SYNC_${String(pin.repo).toUpperCase()}_REPO=../${pin.repo} scripts/sync-catalogs.sh, then review the regenerated pages and re-pin`,
    );
  }
}

// Canonical guide sources: the walkthroughs are projections, not a second manual.
const manifest = readJson(CANONICAL_PATH, "the canonical guide manifest");
const entries = manifest.entries ?? [];
if (entries.length === 0)
  skip(`${rel(CANONICAL_PATH)} lists no sources, so no guide source is checked`);

const byRepo = new Map();
for (const entry of entries) {
  if (!entry.site_page || !entry.repo || !entry.path || !entry.title) {
    fail(`${rel(CANONICAL_PATH)}: an entry is missing site_page, repo, path, or title`);
    continue;
  }
  if (!existsSync(join(GUIDES_DIR, `${entry.site_page}.mdx`))) {
    fail(`${rel(CANONICAL_PATH)}: site page ${entry.site_page}.mdx does not exist`);
    continue;
  }
  if (!byRepo.has(entry.repo)) byRepo.set(entry.repo, []);
  byRepo.get(entry.repo).push(entry);
}

for (const [plane, list] of byRepo) {
  const repo = resolveRepo(plane);
  if (!repo.path) {
    skip(`${list.length} canonical source(s) in ${plane} not checked: ${repo.why}`);
    continue;
  }
  for (const entry of list) {
    const file = join(repo.path, entry.path);
    if (!existsSync(file)) {
      fail(
        `${rel(CANONICAL_PATH)}: ${plane}/${entry.path} is gone, and ${entry.site_page}.mdx projects it`,
      );
      continue;
    }
    const title = frontmatterTitle(file);
    if (title === null) {
      fail(`${rel(CANONICAL_PATH)}: ${plane}/${entry.path} has no frontmatter title to compare`);
    } else if (title !== entry.title) {
      fail(
        `${rel(CANONICAL_PATH)}: ${plane}/${entry.path} is titled "${title}" upstream, but ${entry.site_page}.mdx was written against "${entry.title}". Re-read the page, then update this manifest`,
      );
    }
  }
  ok(`${list.length} canonical source(s) in ${plane} verified against ${repo.path} (${repo.how})`);
}

// Plane sections: the claim is that each plane's section lists every guide its
// repository has, so "the docs cover the stack" is checkable instead of
// aspirational. A guide added upstream with no row on the section page fails.
const navPages = readJson(DOCS_META_PATH, "the docs page order").pages ?? [];
for (const plane of planes) {
  const pagePath = join(DOCS_DIR, `${plane.page}.mdx`);
  if (!existsSync(pagePath)) {
    fail(`${rel(PLANES_PATH)}: plane ${plane.plane} has no section page at ${rel(pagePath)}`);
    continue;
  }
  if (!navPages.includes(plane.page)) {
    fail(
      `${rel(PLANES_PATH)}: ${plane.page}.mdx is not in ${rel(DOCS_META_PATH)}, so the section is unreachable from the docs nav`,
    );
  }
  for (const walkthrough of plane.walkthroughs ?? []) {
    if (!existsSync(join(GUIDES_DIR, `${walkthrough}.mdx`))) {
      fail(
        `${rel(PLANES_PATH)}: walkthrough ${walkthrough}.mdx named for ${plane.plane} does not exist`,
      );
    }
  }
  const pageText = readFileSync(pagePath, "utf8");
  // Rows, not any mention: a guide path written into prose does not count as
  // listed, because only a row carries the read-when and the current title.
  const rows = new Map();
  pageText.split("\n").forEach((line, i) => {
    const m = line.match(GUIDE_ROW);
    if (m) rows.set(m[4], { title: m[1].trim(), href: m[2].trim(), line: i + 1 });
  });
  const listed = new Set(rows.keys());
  const repo = resolveRepo(plane.repo);
  if (!repo.path) {
    skip(`plane ${plane.plane}: ${listed.size} guide(s) listed, coverage not checked, ${repo.why}`);
    continue;
  }
  const guidesDir = join(repo.path, "docs", "guides");
  if (!existsSync(guidesDir)) {
    fail(
      `plane ${plane.plane}: ${plane.repo}/docs/guides is absent, so its section page lists nothing verifiable`,
    );
    continue;
  }
  const actual = readdirSync(guidesDir)
    .filter((n) => n.endsWith(".mdx") && n !== "index.mdx")
    .map((n) => `docs/guides/${n}`);
  for (const guide of actual) {
    if (!listed.has(guide))
      fail(`plane ${plane.plane}: ${plane.repo}/${guide} is not listed on ${plane.page}.mdx`);
  }
  // Every row must be a way IN to a page that exists, not a way out to the
  // repository. A row that still points at the repo while the body is
  // projected is a stale page, and a row pointing at a missing slug is a 404.
  for (const [guide, row] of rows) {
    const slug = guide
      .split("/")
      .pop()
      .replace(/\.mdx$/, "");
    const want = `/docs/guides/${plane.plane}/${slug}`;
    if (row.href !== want) {
      fail(
        `plane ${plane.plane}: ${plane.page}.mdx line ${row.line} links ${guide} to ${row.href}, expected ${want}`,
      );
    }
  }
  for (const guide of listed) {
    if (!actual.includes(guide)) {
      fail(
        `plane ${plane.plane}: ${guide} is listed on ${plane.page}.mdx but absent from ${plane.repo}/docs/guides`,
      );
      continue;
    }
    const title = frontmatterTitle(join(repo.path, guide));
    if (title === null) {
      fail(`plane ${plane.plane}: ${guide} has no frontmatter title to compare`);
    } else if (rows.get(guide)?.title !== title) {
      fail(
        `plane ${plane.plane}: ${plane.page}.mdx line ${rows.get(guide)?.line ?? "?"} lists ${guide} as "${rows.get(guide)?.title ?? "nothing"}", and the repo titles it "${title}"`,
      );
    }
  }
  ok(
    `plane ${plane.plane}: ${actual.length} canonical guide(s) listed on ${plane.page}.mdx (${repo.how})`,
  );
}

// ADR-0006: the guide bodies projected from the product repositories. Two
// checks that run everywhere, and one that runs only where a clone is
// reachable. The first is the one that matters on Vercel, where no product
// repository exists: the committed copies must still match the lock, so a page
// edited on this site instead of in its repository is caught even by a build
// that has never heard of toron.
const guideLock = readJson(GUIDE_LOCK_PATH, "the projected guide lock");
const lockedGuides = guideLock.guides ?? [];
if (lockedGuides.length === 0)
  fail(`${rel(GUIDE_LOCK_PATH)} locks no guides, so no projection is checked`);

const pageFile = (entry) => join(DOCS_DIR, `${entry.page}.mdx`);
// `walk` collects MDX and walkSources does not. The first version of this check
// used walkSources, found zero files, and reported green for a page that had
// been dropped from the lock entirely, which is the exact case the check exists
// to catch.
const vendored = new Map();
for (const file of walk(join(DOCS_DIR, "guides"))) {
  const under = relative(DOCS_DIR, file).replace(/\\/g, "/");
  // A plane folder holds projected guides only. The walkthroughs beside them
  // are ours and are checked elsewhere.
  const [, planeSegment] = under.split("/");
  if (!under.startsWith("guides/") || !planes.some((p) => p.plane === planeSegment)) continue;
  vendored.set(under.replace(/\.mdx$/, ""), file);
}
if (vendored.size === 0) {
  fail(
    `no projected guide page was found under ${rel(join(DOCS_DIR, "guides"))}, so the reverse check examined nothing`,
  );
}

for (const entry of lockedGuides) {
  const path = pageFile(entry);
  if (!existsSync(path)) {
    fail(
      `${rel(GUIDE_LOCK_PATH)} projects ${entry.page} but ${rel(path)} is absent. run: node scripts/sync-guides.mjs`,
    );
    continue;
  }
  const hash = createHash("sha256").update(readFileSync(path)).digest("hex");
  if (hash !== entry.render_sha256) {
    fail(
      `${rel(path)} does not match the rendered hash in ${rel(GUIDE_LOCK_PATH)}. it was edited on this site, or its repository copy changed without a re-sync.\n` +
        `     fix: edit ${entry.repo}/${entry.path}, then run node scripts/sync-guides.mjs`,
    );
  }
  vendored.delete(entry.page);
}
for (const page of vendored.keys()) {
  fail(
    `${rel(join(DOCS_DIR, `${page}.mdx`))} is projected but absent from ${rel(GUIDE_LOCK_PATH)}, so nothing vouches for it`,
  );
}
if (failed === 0) {
  ok(
    `${lockedGuides.length} projected guide(s) match the rendered hash in ${rel(GUIDE_LOCK_PATH)}`,
  );
}

// Where the repository is reachable, the lock can only prove the copy has not
// changed since the last sync. Comparing against the repository is the check
// that catches a guide edited upstream and never projected.
for (const plane of planes) {
  const repo = resolveRepo(plane.repo);
  if (!repo.path) {
    skip(`projected ${plane.plane} guides not compared against ${plane.repo}: ${repo.why}`);
    continue;
  }
  let compared = 0;
  for (const entry of lockedGuides.filter((g) => g.plane === plane.plane)) {
    const upstream = join(repo.path, entry.path);
    if (!existsSync(upstream)) {
      fail(`projected ${entry.page} but ${plane.repo}/${entry.path} is gone upstream`);
      continue;
    }
    const hash = createHash("sha256").update(readFileSync(upstream)).digest("hex");
    if (hash !== entry.source_sha256) {
      fail(
        `${plane.repo}/${entry.path} has changed since the last sync, so ${rel(pageFile(entry))} is stale.\n` +
          `     fix: node scripts/sync-guides.mjs, then review the diff`,
      );
      continue;
    }
    compared += 1;
  }
  ok(`projected ${plane.plane} guide(s) match ${plane.repo}/docs/guides (${repo.how})`);
}

// ADR-0005 D1: the origin is one constant, and a hostname literal anywhere
// else is a defect. toron.dev is a live domain belonging to another product, so
// a stray literal here misdirects crawlers rather than merely being untidy.
const originFiles = [...walkSources(APP_DIR), ...walkSources(LIB_DIR)];
let originHits = 0;
for (const file of originFiles) {
  if (file === SHARED_PATH) continue;
  for (const literal of originLiterals(readFileSync(file, "utf8"))) {
    fail(
      `${rel(file)} hardcodes the origin ${literal}, which is not the host that serves this site. use siteUrl from ${rel(SHARED_PATH)}`,
    );
    originHits += 1;
  }
}
if (originFiles.length === 0) {
  fail(
    `no source file was found under ${rel(APP_DIR)} or ${rel(LIB_DIR)}, so the origin check examined nothing`,
  );
} else if (originHits === 0) {
  ok(
    `no file outside ${rel(SHARED_PATH)} hardcodes an origin (${originFiles.length} app/lib source(s) scanned)`,
  );
}

// ADR-0005 D3: the sitemap must list every route that renders, and must not
// list a docs URL twice. Static routes are read off the filesystem rather than
// a second hand-maintained list, which is the whole point of the check.
const staticRoutes = walkSources(APP_DIR)
  .filter((f) => f.endsWith(`${sep}page.tsx`))
  .map(
    (f) =>
      `/${relative(APP_DIR, f)
        .replace(/\\/g, "/")
        .replace(/\/?page\.tsx$/, "")}`,
  )
  // Route groups are organisational, and a catch-all stands for its whole
  // subtree, so neither names one URL this check can require by name.
  .map((route) => route.replace(/\/\([^/]+\)/g, ""))
  .filter((route) => !route.includes("[") && route !== "/docs")
  .map((route) => route.replace(/\/$/, "") || "/");

const sitemapSource = readFileSync(join(APP_DIR, "sitemap.ts"), "utf8");
const marketingRoutes = [...sitemapSource.matchAll(/^\s*\[\s*(['"])([^'"]*)\1/gm)].map((m) => m[2]);
if (marketingRoutes.length === 0) fail("app/sitemap.ts lists no routes, so the sitemap is empty");
const sitemapFaults = sitemapProblems({ marketing: marketingRoutes, staticRoutes });
for (const fault of sitemapFaults) fail(`app/sitemap.ts: ${fault}`);
if (sitemapFaults.length === 0) {
  ok(`the sitemap lists all ${staticRoutes.length} static route(s) and no hand-listed docs URL`);
}

// ADR-0005 D2: the Markdown URL the docs pages advertise must have a route
// behind it. This is the check that would have caught the dead Copy page and
// View as Markdown controls.
const sharedSource = readFileSync(SHARED_PATH, "utf8");
const contentRoute = sharedSource.match(/docsContentRoute\s*=\s*(['"])([^'"]+)\1/)?.[2];
if (!contentRoute) {
  fail(
    `${rel(SHARED_PATH)} declares no docsContentRoute, so getPageMarkdownUrl has no target to promise`,
  );
} else {
  const mdFaults = markdownRouteProblems({
    docsContentRoute: contentRoute,
    appDir: APP_DIR,
    nextConfig: readFileSync(NEXT_CONFIG_PATH, "utf8"),
  });
  for (const fault of mdFaults) fail(fault);
  if (mdFaults.length === 0) {
    ok(`the advertised Markdown route ${contentRoute} exists and /docs/:slug*.md rewrites onto it`);
  }
}

console.log(
  `\nsummary: ${pinNames.length} pinned catalog(s), ${entries.length} canonical source entries, ${planes.length} plane(s), ${lockedGuides.length} projected guide(s), 3 origin/sitemap/markdown check(s), ${skipped} skip(s), ${failed === 0 ? "green" : "RED"}`,
);
console.log("not checked by this gate:");
for (const line of NOT_CHECKED) console.log(`  - ${line}`);

process.exit(failed);
