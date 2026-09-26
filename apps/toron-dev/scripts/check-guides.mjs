// governed-by: ADR-0004 D6
//
// The site's guide gate. It is the same check the product repos run, with one
// difference that matters here: the site documents toron, flywheel, br, and
// chie, so a command is verified against whichever of the four owns it rather
// than being skipped as foreign.
//
// This exists because the site shipped invented commands once. `br gate report
// --evidence` and `toron workflow status` were both written from memory and were
// both wrong; nothing in the build could tell. A guide on a product's public
// site is a claim about that product, so the claim gets checked against the
// binary.
//
// Fail-closed: a missing binary fails the run rather than silently skipping its
// commands. `GUIDES_SKIP_CLI=1` bypasses, and says so out loud.
//
// Run via `prebuild` / `predev`.
import { readdirSync, readFileSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { dirname, join, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const HERE = dirname(fileURLToPath(import.meta.url));
const APP_ROOT = resolve(HERE, "..");
const GUIDES_DIR = join(APP_ROOT, "content", "docs");

// Commands from other tools that legitimately appear in a fence but are not
// ours to verify (shell builtins, package runners, git, the host toolchain).
const NOT_OURS = new Set([
  "export",
  "git",
  "npx",
  "node",
  "bun",
  "cd",
  "sh",
  "echo",
  "git rev-parse",
]);

const BINARIES = ["toron", "flywheel", "br", "chie"];

const DIAGRAMS =
  /^(flowchart|graph|sequenceDiagram|stateDiagram-v2|stateDiagram|erDiagram|classDiagram|mindmap|timeline|gantt|pie|gitGraph|journey|quadrantChart|requirementDiagram|C4Context)\b/;

// The site can use components (components/mdx.tsx registers them), so a failure
// mode may be either the `<Fail>` component or the plain-text convention the
// product repos must use, since their structure check rejects JSX.
const FAILS = /^\s*(?:>\s*)?(?:\*\*)?if it fails|<Fail[\s/>]/im;

// ------------------------------------------------------------------ CLI surface

function help(bin, args) {
  const r = spawnSync(bin, [...args, "--help"], { encoding: "utf8" });
  return r.status === 0 ? r.stdout || "" : null;
}

function extractSurface(bin) {
  const commands = new Map();
  const queue = [[]];
  const seen = new Set();
  while (queue.length > 0) {
    const path = queue.shift();
    const key = path.join(" ");
    if (seen.has(key) || path.length > 3) continue;
    seen.add(key);
    const text = help(bin, path);
    if (text === null) continue;

    const flags = new Map();
    const shorts = new Map();
    const shortLong = new Map();
    for (const line of text.split("\n")) {
      const m = line.match(/^\s+(?:-(\w),\s+)?--([a-z0-9][a-z0-9-]*)(.*)$/);
      if (!m) continue;
      const takesValue = /<[^>]+>/.test(m[3]);
      flags.set(m[2], takesValue);
      if (m[1]) {
        shorts.set(m[1], takesValue);
        shortLong.set(m[1], m[2]);
      }
    }

    // What the usage line says a caller MUST supply: required flags and required
    // positionals. A guide that omits one is a command the reader cannot run
    // while every token in it still resolves, which is the class a chain check
    // cannot see. Bracketed (optional) regions come out first so `[--holder <PIN>]`
    // never reads as required.
    const usageLine = text.split("\n").find((l) => /^Usage:\s/.test(l));
    let positionals = 1;
    let requiredPositionals = 0;
    const requiredFlags = new Set();
    if (usageLine) {
      const required = usageLine.replace(/\[[^\]]*\]/g, " ");
      requiredPositionals = (
        required.replace(/--[a-z0-9-]+\s*[= ]\s*<[^>]+>/g, " ").match(/<[^>]+>/g) || []
      ).length;
      for (const m of required.matchAll(/--([a-z0-9][a-z0-9-]*)\s*[= ]\s*<[^>]+>/g)) {
        requiredFlags.add(m[1]);
      }
      const optionalPositionals = (usageLine.match(/\[[^\]]*\]/g) || []).filter(
        (seg) => !/^\[\s*-/.test(seg) && !/^\[(OPTIONS|COMMAND|FLAGS?)\]$/i.test(seg),
      ).length;
      positionals = requiredPositionals + optionalPositionals;
    }

    const children = new Set();
    const lines = text.split("\n");
    const start = lines.findIndex((l) => /^Commands:\s*$/.test(l));
    if (start !== -1) {
      for (let i = start + 1; i < lines.length; i++) {
        if (/^\S/.test(lines[i])) break;
        // Description is optional: `br comments` prints `  add   ` with nothing
        // after it, and requiring one silently dropped the child.
        const m = lines[i].match(/^\s{2}([a-z][a-z0-9-]*)(?:\s{2,}\S|\s*$)/);
        if (m && m[1] !== "help") children.add(m[1]);
      }
    }

    commands.set(key, {
      flags,
      shorts,
      shortLong,
      children,
      positionals,
      requiredFlags,
      requiredPositionals,
    });
    for (const child of children) queue.push([...path, child]);
  }
  return commands;
}

function tokenize(line) {
  const tokens = [];
  let cur = "";
  let quote = null;
  for (const ch of line) {
    if (quote) {
      if (ch === quote) quote = null;
      else cur += ch;
      continue;
    }
    if (ch === '"' || ch === "'") {
      quote = ch;
      continue;
    }
    if (ch === " " || ch === "\t") {
      if (cur) {
        tokens.push(cur);
        cur = "";
      }
      continue;
    }
    cur += ch;
  }
  if (cur) tokens.push(cur);
  return tokens;
}

function commandLines(block) {
  const joined = block.replace(/\\\n\s*/g, " ");
  const out = [];
  for (const raw of joined.split("\n")) {
    let line = raw.trim();
    if (!line || line.startsWith("#")) continue;
    line = line.replace(/^\$\s*/, "");
    // Split off pipes and redirections, but a `|` inside a placeholder is part of
    // the value: `--crews <squad|profile>` was cut at the pipe, which made the
    // required flag that followed look missing.
    line = line
      .replace(/<[^>]*>/g, (m) => m.replace(/\|/g, "/"))
      .split(/\|\||&&|\||;/)[0]
      .trim();
    let tokens = tokenize(line);
    while (tokens.length > 0 && /^[A-Z_][A-Z0-9_]*=/.test(tokens[0])) tokens.shift();
    const hash = tokens.findIndex((t) => t.startsWith("#"));
    if (hash !== -1) tokens = tokens.slice(0, hash);
    // Unwrap synopsis brackets instead of dropping the tokens: dropping `[--path`
    // left its value looking like a stray positional. Placeholders survive to
    // verifyCommand, which knows a placeholder from a literal.
    tokens = tokens
      .map((t) => t.replace(/^\[+/, "").replace(/\]+$/, ""))
      .filter((t) => t.length > 0);
    if (tokens.length === 0) continue;
    out.push({ text: line, tokens });
  }
  return out;
}

function verifyCommand(bin, tokens, surface) {
  const errors = [];
  const path = [];
  const seenFlags = new Set();
  let positionalsSeen = 0;
  let node = surface.get("");
  if (!node) return errors;

  for (let i = 1; i < tokens.length; i++) {
    const t = tokens[i];
    if (t === "--") break;

    if (t.startsWith("-")) {
      const long = t.match(/^--([a-z0-9][a-z0-9-]*)/);
      const short = !long && t.match(/^-([A-Za-z])\b/);
      let takesValue = false;
      const where = `${bin} ${path.join(" ")}`.trimEnd();
      if (long) {
        if (!node.flags.has(long[1])) errors.push(`unknown flag --${long[1]} on \`${where}\``);
        else {
          takesValue = node.flags.get(long[1]);
          seenFlags.add(long[1]);
        }
      } else if (short) {
        if (!node.shorts.has(short[1])) errors.push(`unknown flag -${short[1]} on \`${where}\``);
        else {
          takesValue = node.shorts.get(short[1]);
          seenFlags.add(short[1]);
          const aliased = node.shortLong.get(short[1]);
          if (aliased) seenFlags.add(aliased);
        }
      }
      if (takesValue && !t.includes("=")) i++;
      continue;
    }

    // A placeholder is the reader's to fill in: it cannot be judged as a
    // subcommand name, but it still needs a positional slot in the usage line.
    if (/^<[^>]+>$/.test(t)) {
      if (node.positionals === 0) {
        const where = `${bin} ${path.join(" ")}`.trimEnd();
        errors.push(`unexpected argument \`${t}\` on \`${where}\` (its usage takes none)`);
      }
      positionalsSeen++;
      continue;
    }

    if (node.children.size > 0) {
      if (node.children.has(t)) {
        path.push(t);
        node = surface.get(path.join(" "));
      } else {
        const where = `${bin} ${path.join(" ")}`.trimEnd();
        errors.push(
          `unknown subcommand \`${t}\` under \`${where}\` (known: ${[...node.children].sort().join(", ")})`,
        );
        // Stop here: the node is unresolved, so the rest of the line would be
        // judged against the wrong help text and pile cascade noise on one defect.
        break;
      }
      continue;
    }

    // Leaf: a literal positional is allowed only where the usage shows one. This
    // is the `slot acquire cargo` class — clap rejects it at runtime while every
    // subcommand and flag in the line resolves.
    if (node.positionals === 0) {
      const where = `${bin} ${path.join(" ")}`.trimEnd();
      errors.push(`unexpected positional \`${t}\` on \`${where}\` (its usage takes none)`);
    }
    positionalsSeen++;
  }

  // Missing required arguments are drift too, and are skipped when the walk
  // already failed so one defect reports one error.
  if (errors.length === 0 && node) {
    const where = `${bin} ${path.join(" ")}`.trimEnd();
    for (const f of node.requiredFlags || []) {
      if (!seenFlags.has(f)) errors.push(`missing required flag --${f} for \`${where}\``);
    }
    if ((node.requiredPositionals || 0) - positionalsSeen > 0) {
      errors.push(
        `missing required argument(s) for \`${where}\` — its usage takes ${node.requiredPositionals}`,
      );
    }
  }
  return errors;
}

// --------------------------------------------------------------- block walking

function blocks(body) {
  const out = [];
  let cur = null;
  for (const [i, line] of body.split("\n").entries()) {
    if (line.startsWith("```")) {
      if (cur) {
        out.push(cur);
        cur = null;
        continue;
      }
      cur = { lang: line.slice(3).trim().split(/\s+/)[0], startLine: i + 1, lines: [] };
      continue;
    }
    if (cur) cur.lines.push(line);
  }
  if (cur) out.push({ ...cur, unterminated: true });
  return out;
}

function check(file, surfaces) {
  const errors = [];
  const src = readFileSync(file, "utf8");
  if (!src.startsWith("---\n")) return ["missing frontmatter"];
  const close = src.indexOf("\n---\n", 4);
  if (close === -1) return ["unterminated frontmatter"];
  const body = src.slice(close + 5);

  let fence = 0;
  let inMermaid = false;
  let mermaidChecked = false;
  for (const [i, line] of body.split("\n").entries()) {
    const n = i + 1;
    if (line.startsWith("```")) {
      if (fence === 0) {
        inMermaid = line.slice(3).trim() === "mermaid";
        mermaidChecked = false;
        fence = 1;
      } else {
        if (inMermaid && !mermaidChecked)
          errors.push(`${n}: mermaid block without a diagram header`);
        fence = 0;
        inMermaid = false;
      }
      continue;
    }
    if (fence === 1) {
      const t = line.trim();
      if (inMermaid && !mermaidChecked && t && !t.startsWith("%%")) {
        if (!DIAGRAMS.test(t)) errors.push(`${n}: unknown mermaid header: ${t}`);
        mermaidChecked = true;
      }
      continue;
    }
    if (/^#\s/.test(line)) errors.push(`${n}: body h1; titles live in frontmatter`);
  }
  if (fence !== 0) errors.push("unbalanced code fence");

  const bs = blocks(body);
  const bashBlocks = bs.filter((b) => b.lang === "bash");
  for (const [idx, block] of bashBlocks.entries()) {
    const nextBash = bashBlocks[idx + 1];
    const between = bs.filter(
      (b) => b.startLine > block.startLine && (!nextBash || b.startLine < nextBash.startLine),
    );
    if (!between.some((b) => b.lang === "text")) {
      errors.push(
        `${block.startLine}: bash block with no \`\`\`text block after it — a command with no shown output is an unverified claim`,
      );
    }
  }
  if (bashBlocks.length > 0 && !FAILS.test(body)) {
    errors.push("no failure mode; add an `If it fails:` paragraph to each step that can fail");
  }

  if (surfaces) {
    for (const block of bashBlocks) {
      for (const cmd of commandLines(block.lines.join("\n"))) {
        const bin = cmd.tokens[0];
        if (NOT_OURS.has(bin) || !surfaces.has(bin)) continue;
        for (const e of verifyCommand(bin, cmd.tokens, surfaces.get(bin))) {
          errors.push(`${block.startLine}: ${e}`);
        }
      }
    }
  }

  return errors;
}

// ------------------------------------------------------------------------ main

function walk(dir) {
  const out = [];
  for (const e of readdirSync(dir, { withFileTypes: true })) {
    const p = join(dir, e.name);
    if (e.isDirectory()) out.push(...walk(p));
    else if (e.name.endsWith(".mdx")) out.push(p);
  }
  return out;
}

let failed = 0;
let surfaces = null;

if (process.env.GUIDES_SKIP_CLI === "1") {
  console.error("SKIP surface check (GUIDES_SKIP_CLI=1): guide commands are NOT verified");
} else {
  surfaces = new Map();
  for (const bin of BINARIES) {
    const probe = spawnSync(bin, ["--help"], { encoding: "utf8" });
    if (probe.error || probe.status !== 0) {
      console.error(
        `FAIL cannot run \`${bin} --help\`, so its commands cannot be verified.\n` +
          `     install ${bin}, or set GUIDES_SKIP_CLI=1 and say why in the report.`,
      );
      process.exit(1);
    }
    const surface = extractSurface(bin);
    const probeErrors = verifyCommand(bin, [bin, "__not-a-subcommand", "--__not-a-flag"], surface);
    if (probeErrors.length === 0) {
      console.error(`FAIL the surface check is not biting for ${bin}; refusing to trust this run.`);
      process.exit(1);
    }
    // Second probe: a leaf whose usage takes no positional must reject a literal
    // one, or the `slot acquire cargo` class stays invisible.
    const bareLeaf = [...surface.entries()].find(
      ([, n]) => n.children.size === 0 && n.positionals === 0,
    );
    if (!bareLeaf) {
      console.error(`skip self-test: ${bin} has no positional-free leaf to probe`);
    } else {
      const probePath = bareLeaf[0].split(" ").filter(Boolean);
      const positionalProbe = verifyCommand(bin, [bin, ...probePath, "bogus-positional"], surface);
      if (!positionalProbe.some((e) => e.includes("unexpected positional"))) {
        console.error(
          `FAIL the positional rule is not biting for ${bin}; refusing to trust this run.`,
        );
        process.exit(1);
      }
    }
    surfaces.set(bin, surface);
    console.log(`surface  ${bin}: ${surface.size} command paths (self-test ok)`);
  }
}

const guides = walk(GUIDES_DIR).sort();
if (guides.length === 0) {
  console.error("no .mdx guides found");
  failed = 1;
}
for (const f of guides) {
  const rel = relative(APP_ROOT, f);
  const errors = check(f, surfaces);
  if (errors.length === 0) console.log(`ok   ${rel}`);
  else {
    failed = 1;
    for (const e of errors) console.error(`FAIL ${rel}: ${e}`);
  }
}
process.exit(failed);
