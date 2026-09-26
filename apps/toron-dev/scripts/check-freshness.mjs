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
// Run via `prebuild` / `predev` and by the Vercel buildCommand.
import { spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { dirname, join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const APP_ROOT = resolve(HERE, '..');
const REPO_ROOT = resolve(APP_ROOT, '../..');
const CATALOG_DIR = join(REPO_ROOT, 'catalog');
const DOCS_DIR = join(APP_ROOT, 'content', 'docs');
const GUIDES_DIR = join(DOCS_DIR, 'guides');
const PINS_PATH = join(CATALOG_DIR, 'pins.json');
const CANONICAL_PATH = join(GUIDES_DIR, 'canonical.json');

const GROUPS = ['tools', 'resources', 'cli_commands'];
// Generated from the catalogs on every build, so their counts are checked
// against the pin instead of the prose rule (the generator writes them).
const GENERATED = ['tools', 'reference.mdx'];
const TOOLS_DIR = join(DOCS_DIR, 'tools');
// "38 tools", "25 resources", "19 CLI commands": a count a page asserts in prose.
const COUNT_CLAIM = /\b(\d+)[\s-]+(?:MCP\s+)?(tools|resources|CLI commands|commands)\b/gi;
const TITLE_LINE = /^title:\s*(.+?)\s*$/m;

const rel = (p) => relative(REPO_ROOT, p);
const name = (entry) => String(entry?.name ?? '');

// Key-sorted JSON, so a re-ordering upstream is not reported as drift.
function stable(value) {
  if (Array.isArray(value)) return value.map(stable);
  if (value && typeof value === 'object') {
    return Object.fromEntries(Object.keys(value).sort().map((k) => [k, stable(value[k])]));
  }
  return value;
}

function surfaceHash(catalog) {
  const surface = {};
  for (const g of GROUPS) surface[g] = [...(catalog?.[g] ?? [])].sort((a, b) => name(a).localeCompare(name(b)));
  surface.schema_version = catalog?.schema_version ?? null;
  return createHash('sha256').update(JSON.stringify(stable(surface))).digest('hex');
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
    for (const n of [...afterNames].filter((n) => !beforeNames.has(n)).sort()) out.push(`${g} added ${n}`);
    for (const n of [...beforeNames].filter((n) => !afterNames.has(n)).sort()) out.push(`${g} removed ${n}`);
    const beforeByName = new Map(before.map((e) => [name(e), e]));
    const changed = [...beforeByName.keys()]
      .filter((n) => {
        const mine = beforeByName.get(n);
        const theirs = after.find((e) => name(e) === n);
        return theirs && JSON.stringify(stable(mine)) !== JSON.stringify(stable(theirs));
      })
      .sort();
    if (changed.length > 0) {
      const shown = changed.slice(0, 3).join(', ');
      out.push(`${g}: ${changed.length} changed in place (${shown}${changed.length > 3 ? ', …' : ''})`);
    }
  }
  if ((pinned?.schema_version ?? null) !== (actual?.schema_version ?? null)) {
    out.push(`schema_version: ${pinned?.schema_version ?? null} before, ${actual?.schema_version ?? null} now`);
  }
  return out;
}

function readJson(path, what) {
  if (!existsSync(path)) {
    console.error(`FAIL ${what} is missing: ${rel(path)}`);
    process.exit(1);
  }
  try {
    return JSON.parse(readFileSync(path, 'utf8'));
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
    if (override.startsWith('http')) return { path: null, why: `${overrideVar} is a URL, and the gate does not clone` };
    if (existsSync(override)) return { path: override, how: `${overrideVar}` };
    return { path: null, why: `${overrideVar}=${override} does not exist` };
  }
  const sibling = join(REPO_ROOT, '..', plane);
  if (existsSync(join(sibling, 'docs'))) return { path: sibling, how: 'sibling clone' };
  return { path: null, why: `no ${plane} checkout at ../${plane}` };
}

// The running product is authoritative for its own surface; a repo file is the
// fallback, since that is what sync-catalogs.sh copies.
function liveSurface(pin) {
  const cmd = pin.catalog_command;
  if (Array.isArray(cmd) && cmd.length > 0) {
    const r = spawnSync(cmd[0], cmd.slice(1), { encoding: 'utf8', timeout: 60000 });
    if (r.error) return { why: `${cmd[0]} is not runnable here` };
    if (r.status !== 0) return { why: `${cmd.join(' ')} exited ${r.status}` };
    try {
      return { catalog: JSON.parse(r.stdout), how: `${cmd.join(' ')} (live product)` };
    } catch {
      return { why: `${cmd.join(' ')} did not emit JSON` };
    }
  }
  const repo = resolveRepo(pin.repo);
  if (!repo.path) return { why: repo.why };
  const file = join(repo.path, pin.upstream_path ?? '');
  if (!existsSync(file)) return { why: `${pin.repo}/${pin.upstream_path} is absent` };
  try {
    return { catalog: JSON.parse(readFileSync(file, 'utf8')), how: `${pin.repo}/${pin.upstream_path} (${repo.how})` };
  } catch {
    return { why: `${pin.repo}/${pin.upstream_path} is not valid JSON` };
  }
}

function frontmatterTitle(file) {
  const src = readFileSync(file, 'utf8');
  if (!src.startsWith('---\n')) return null;
  const close = src.indexOf('\n---\n', 4);
  if (close === -1) return null;
  const m = src.slice(4, close).match(TITLE_LINE);
  return m ? m[1].replace(/^['"]|['"]$/g, '').trim() : null;
}

function walk(dir, out = []) {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const p = join(dir, entry.name);
    if (entry.isDirectory()) walk(p, out);
    else if (entry.name.endsWith('.mdx')) out.push(p);
  }
  return out;
}

let failed = 0;
const fail = (msg) => {
  console.error(`FAIL ${msg}`);
  failed = 1;
};
const ok = (msg) => console.log(`ok   ${msg}`);
const skip = (msg) => console.warn(`skip ${msg}`);

// ------------------------------------------------------------------- self-test

// A gate nobody proved bites is a gate that reports whatever the code happens
// to do. Two mutations, both of which must be caught before anything is trusted.
function selfTest() {
  const base = { schema_version: 1, tools: [{ name: 'a' }, { name: 'b' }], resources: [], cli_commands: [] };
  const dropped = { ...base, tools: [{ name: 'a' }] };
  if (!diffSurfaces(base, dropped).some((d) => d.includes('removed b'))) {
    console.error('FAIL the surface diff does not catch a removed entry, refusing to trust this run');
    process.exit(1);
  }
  const edited = { ...base, tools: [{ name: 'a', parity: 'x' }, { name: 'b' }] };
  if (!diffSurfaces(base, edited).some((d) => d.includes('changed in place'))) {
    console.error('FAIL the surface diff does not catch an in-place edit, refusing to trust this run');
    process.exit(1);
  }
  if (surfaceHash(base) === surfaceHash(dropped)) {
    console.error('FAIL the surface hash ignores a removed entry, refusing to trust this run');
    process.exit(1);
  }
  console.log('ok   self-test: a removed entry, an in-place edit, and a hash change are all caught');
}

// ----------------------------------------------------------------- the checks

selfTest();

const pins = readJson(PINS_PATH, 'the catalog pin manifest');
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
  const catalog = readJson(path, 'a catalog');
  committed.set(file, catalog);

  const actual = countsOf(catalog);
  const expected = pin.counts ?? {};
  const countDrift = GROUPS.filter((g) => expected[g] !== undefined && expected[g] !== actual[g]).map(
    (g) => `${g}: pinned ${expected[g]}, file has ${actual[g]}`,
  );
  if (countDrift.length > 0) fail(`${rel(path)} ${countDrift.join('; ')}`);
  else ok(`${rel(path)} counts ${GROUPS.map((g) => `${g}=${actual[g]}`).join(' ')} match the pin`);

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
// pins.json is the manifest, not a surface, so it is not one of them.
for (const entry of readdirSync(CATALOG_DIR)) {
  if (entry === 'pins.json') continue;
  if (entry.endsWith('.json') && !pinNames.includes(entry)) {
    fail(`catalog/${entry} is not pinned in ${rel(PINS_PATH)}, so its drift would go unnoticed`);
  }
}

// The generated pages are the catalog rendered, so their number is the pin.
// They are gitignored build artifacts, so a clean checkout has none yet. That is
// a skip rather than a failure: the Vercel buildCommand generates them before
// this gate runs, which is where the check has to bite.
const toolPages = existsSync(TOOLS_DIR) ? walk(TOOLS_DIR).length : null;
const pinnedTools = Object.values(catalogs).reduce((n, pin) => n + (pin.counts?.tools ?? 0), 0);
if (toolPages === null) {
  skip('content/docs/tools is absent, so the generated page count is unchecked (run generate-tool-docs)');
} else if (toolPages !== pinnedTools) {
  fail(`content/docs/tools holds ${toolPages} pages for ${pinnedTools} pinned tools, run generate-tool-docs`);
} else {
  ok(`content/docs/tools holds ${toolPages} pages for ${pinnedTools} pinned tools`);
}

// A hand-written page may not quote a count the pin does not carry.
for (const file of walk(DOCS_DIR)) {
  const underDocs = relative(DOCS_DIR, file);
  if (GENERATED.some((g) => underDocs === g || underDocs.startsWith(`${g}/`))) continue;
  readFileSync(file, 'utf8')
    .split('\n')
    .forEach((line, i) => {
      for (const m of line.matchAll(COUNT_CLAIM)) {
        const n = Number(m[1]);
        if (!allowedCounts.has(n)) {
          fail(`${rel(file)}:${i + 1} claims "${m[0].trim()}", and ${n} is not a pinned count (${[...allowedCounts].sort((a, b) => a - b).join(', ')})`);
        }
      }
    });
}
ok(`hand-written pages quote no count outside the pin (${[...allowedCounts].sort((a, b) => a - b).join(', ')} pinned)`);

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
      `${rel(join(CATALOG_DIR, file))} has drifted from ${live.how}: ${drift.join('; ')}.\n` +
        `     fix: TORON_SYNC_${String(pin.repo).toUpperCase()}_REPO=../${pin.repo} scripts/sync-catalogs.sh, then review the regenerated pages and re-pin`,
    );
  }
}

// Canonical guide sources: the walkthroughs are projections, not a second manual.
const manifest = readJson(CANONICAL_PATH, 'the canonical guide manifest');
const entries = manifest.entries ?? [];
if (entries.length === 0) skip(`${rel(CANONICAL_PATH)} lists no sources, so no guide source is checked`);

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
      fail(`${rel(CANONICAL_PATH)}: ${plane}/${entry.path} is gone, and ${entry.site_page}.mdx projects it`);
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

process.exit(failed);
