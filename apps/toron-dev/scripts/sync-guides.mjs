// governed-by: ADR-0006
//
// Project the product repositories' guides into the site.
//
// The product repository stays the single source of truth for a guide. This
// script copies each `docs/guides/*.mdx` (never `index.mdx`, which is that
// repo's own navigation) into `content/docs/guides/<plane>/<name>.mdx` BYTE FOR
// BYTE, and records a sha256 per file in `catalog/guides.lock.json`.
//
// The product repository stays the single source of truth for a guide. This
// script copies each `docs/guides/*.mdx` (never `index.mdx`, which is that
// repo's own navigation) into `content/docs/guides/<plane>/<name>.mdx` and
// records TWO hashes per file in `catalog/guides.lock.json`: the sha256 of the
// upstream bytes, and the sha256 of what this script wrote.
//
// Two hashes because the copy is not byte-identical, and pretending otherwise
// would be the whole problem. The product guides are written as plain Markdown
// and as plain-YAML-frontmatter files, and this site compiles MDX with a strict
// YAML reader. Two things follow, and both are handled by one transform:
//
//   1. `<` and `{` are ordinary punctuation in those guides — `P<=2`,
//      `not child <pid>`, a table cell reading `<1s`. MDX reads both as the
//      start of a JSX element or an expression, so a byte-for-byte copy does
//      not compile. They are escaped outside code.
//   2. A frontmatter description containing ": " is invalid YAML, because the
//      parser reads the colon as a nested mapping. Such values are quoted.
//
// The transform touches nothing inside a fenced block, an inline code span, or
// an indented code block, so every command, flag, and shown output reaches the
// reader exactly as the product repository wrote it.
//
// The transformation is pure and versioned. That is what keeps this honest: the
// gate can re-derive what the file should be, and a projection that cannot be
// reproduced is not a projection, it is a fork.
//
// The copies are COMMITTED, unlike the generated tool pages. The reason is the
// build host: Vercel has no product clone, and chiebukuro has no public
// repository to fetch one from, so a build-time pull cannot work there. A
// committed copy is what makes the guides exist on the deployed site, and
// render_sha256 is what lets the build catch a page edited here rather than in
// its repository, even on a host that has never heard of toron. Comparing
// against the real repositories needs a clone, and is skipped out loud without
// one — that comparison is the only thing that catches a guide edited upstream
// and never re-synced.
//
// Run: node scripts/sync-guides.mjs
// Repos resolve from TORON_SYNC_<PLANE>_REPO, else ../<repo> beside toron.dev.
import { createHash } from "node:crypto";
import { existsSync, mkdirSync, readdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { dirname, join, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const HERE = dirname(fileURLToPath(import.meta.url));
const APP_ROOT = resolve(HERE, "..");
const REPO_ROOT = resolve(APP_ROOT, "../..");
const DOCS_DIR = join(APP_ROOT, "content", "docs");
const GUIDES_DIR = join(DOCS_DIR, "guides");
const PLANES_PATH = join(DOCS_DIR, "planes.json");
const LOCK_PATH = join(REPO_ROOT, "catalog", "guides.lock.json");

const rel = (p) => relative(REPO_ROOT, p);
const sha256 = (text) => createHash("sha256").update(text).digest("hex");

// The one transform, exported so the gate can state the same contract.
export const TRANSFORM = "mdx-safe-v1";

// A plain YAML scalar cannot contain ": " — the parser reads it as a nested
// mapping and the build dies on the description line. One beads guide says
// "the native analysis surfaces: triage, next, plan, insights", which is a
// perfectly good sentence and invalid YAML. Quoting the value is mechanical
// and changes nothing the reader sees.
function yamlSafeFrontmatter(frontmatter) {
  return frontmatter
    .split("\n")
    .map((line) => {
      const match = line.match(/^([A-Za-z_][\w-]*):[ \t]*(.*)$/);
      if (!match) return line;
      const [, key, raw] = match;
      const value = raw.trim();
      if (value === "" || /^["'].*["']$/.test(value)) return line;
      const ambiguous =
        value.includes(": ") ||
        value.endsWith(":") ||
        value.includes(" #") ||
        /^[[{&*!%@`>|'"]/.test(value);
      if (!ambiguous) return line;
      return `${key}: "${value.replace(/\\/g, "\\\\").replace(/"/g, '\\"')}"`;
    })
    .join("\n");
}

// Escape MDX's two prose metacharacters, and nothing else. `<` becomes an
// entity so a reader still sees `<`, `{` likewise. Skipped inside fences, code
// spans, and indented blocks, because a flag like `--since <ts>` inside a
// command example must arrive exactly as written.
export function mdxSafe(text) {
  const frontmatter = text.match(/^(---\n[\s\S]*?\n---\n)/);
  const head = frontmatter ? yamlSafeFrontmatter(frontmatter[1]) : "";
  const lines = (frontmatter ? text.slice(frontmatter[1].length) : text).split("\n");

  let fence = null;
  return (
    head +
    lines
      .map((line) => {
        const fenceMatch = line.match(/^\s*(```+|~~~+)/);
        if (fenceMatch) {
          const marker = fenceMatch[1];
          fence = fence === null ? marker[0] : fence === marker[0] ? null : fence;
          return line;
        }
        if (fence !== null) return line;
        // An indented code block is code, not prose.
        if (/^( {4}|\t)/.test(line)) return line;
        // Split on inline code spans and escape only what is left. The odd
        // indices are the spans themselves.
        return line
          .split(/(`+[^`]*`+)/)
          .map((part, i) =>
            i % 2 === 1 ? part : part.replace(/</g, "&lt;").replace(/\{/g, "&#123;"),
          )
          .join("");
      })
      .join("\n")
  );
}

// A guide with no frontmatter title would render as an untitled page in the
// tree and break the plane page's title comparison, so it is refused here
// rather than discovered in the nav.
function frontmatterTitle(text) {
  const match = text.match(/^---\n([\s\S]*?)\n---\n/);
  if (!match) return null;
  return match[1].match(/^title:\s*(.+?)\s*$/m)?.[1] ?? null;
}

const planes = JSON.parse(readFileSync(PLANES_PATH, "utf8")).planes ?? [];
if (planes.length === 0) {
  console.error(`FAIL ${rel(PLANES_PATH)} declares no planes, so no guide is projected`);
  process.exit(1);
}

const lock = { schema_version: 1, guides: [] };
let copied = 0;
let unchanged = 0;
let deleted = 0;
const problems = [];

for (const plane of planes) {
  const repo =
    process.env[`TORON_SYNC_${plane.plane.toUpperCase()}_REPO`] ??
    (process.env[`TORON_SYNC_${plane.repo.toUpperCase()}_REPO`] || `../${plane.repo}`);
  const guidesDir = join(resolve(REPO_ROOT, repo), "docs", "guides");
  if (!existsSync(guidesDir)) {
    problems.push(
      `plane ${plane.plane}: no guide directory at ${repo}/docs/guides — set TORON_SYNC_${plane.plane.toUpperCase()}_REPO`,
    );
    continue;
  }

  const outDir = join(GUIDES_DIR, plane.plane);
  const wanted = new Set();

  for (const name of readdirSync(guidesDir).sort()) {
    // index.mdx is the repo's own navigation, not a guide. The site has its own
    // plane section page, so projecting it would put two indexes in the tree.
    if (!name.endsWith(".mdx") || name === "index.mdx") continue;

    const source = join(guidesDir, name);
    const text = readFileSync(source, "utf8");
    const title = frontmatterTitle(text);
    if (title === null) {
      problems.push(
        `plane ${plane.plane}: ${name} has no frontmatter title, so it cannot be projected`,
      );
      continue;
    }

    const slug = name.replace(/\.mdx$/, "");
    const target = join(outDir, name);
    wanted.add(name);

    mkdirSync(outDir, { recursive: true });
    const rendered = mdxSafe(text);
    if (existsSync(target) && readFileSync(target, "utf8") === rendered) {
      unchanged += 1;
    } else {
      writeFileSync(target, rendered);
      copied += 1;
      console.log(`write ${rel(target)}  <- ${plane.repo}/docs/guides/${name}`);
    }

    lock.guides.push({
      plane: plane.plane,
      page: `guides/${plane.plane}/${slug}`,
      repo: plane.repo,
      path: `docs/guides/${name}`,
      title,
      transform: TRANSFORM,
      source_sha256: sha256(text),
      render_sha256: sha256(rendered),
    });
  }

  // A guide deleted upstream must not survive on the site. Leaving it would
  // keep a page published for a document that no longer exists.
  if (existsSync(outDir)) {
    for (const name of readdirSync(outDir)) {
      if (name.endsWith(".mdx") && !wanted.has(name)) {
        rmSync(join(outDir, name));
        deleted += 1;
        console.log(`rm    ${rel(join(outDir, name))}  (gone from ${plane.repo}/docs/guides)`);
      }
    }
  }

  // The plane slug is lowercase because it is a path segment, but it is a
  // product name in a nav label, so it is capitalised on the way out.
  const planeLabel = plane.plane.charAt(0).toUpperCase() + plane.plane.slice(1);
  writeFileSync(
    join(outDir, "meta.json"),
    `${JSON.stringify({ title: `${planeLabel} guides`, description: `Every canonical ${planeLabel} guide, projected from the ${plane.repo} repository.` }, null, 2)}\n`,
  );
}

if (problems.length > 0) {
  for (const problem of problems) console.error(`FAIL ${problem}`);
  process.exit(1);
}

lock.guides.sort((a, b) => a.page.localeCompare(b.page));
mkdirSync(dirname(LOCK_PATH), { recursive: true });
writeFileSync(LOCK_PATH, `${JSON.stringify(lock, null, 2)}\n`);

console.log(
  `\nsummary: ${lock.guides.length} guide(s) projected across ${planes.length} plane(s), ${copied} written, ${unchanged} already current, ${deleted} removed, lock at ${rel(LOCK_PATH)}`,
);
