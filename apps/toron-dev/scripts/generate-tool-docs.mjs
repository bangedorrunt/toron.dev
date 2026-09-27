// governed-by: toron.dev ADR-0002 D3/D4
//
// Tool-page generator (lane 3).
//
// Reads `catalog/toron-mcp.json` (repo root) and emits, under
// `content/docs/`:
//
//   meta.json              root page tree ordering (merged, preserves
//                          hand-written entries)
//   tools/<group-slug>/    one folder per catalog `group`, under the
//                          "Tools" docs section (ADR-0001 D11 phase 2)
//     meta.json            folder title + page order
//     <tool-name>.mdx      one page per tool: input/output schema
//                          tables, example, parity note
//   reference.mdx          parity grid + resources + cli_commands
//
// The generator is generic over the catalog JSON: it never hand-types a
// tool name, group name, or schema. Adding a tool to the catalog produces
// its page on the next build. If the catalog lacks a field, fix the
// extractor in the product repo, not here.
//
// Run via `predev` / `prebuild` (and Vercel buildCommand).
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { atomicReplaceDirSync, atomicWriteSync } from "./atomic-write.mjs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const HERE = dirname(fileURLToPath(import.meta.url));
const APP_ROOT = resolve(HERE, "..");
const REPO_ROOT = resolve(APP_ROOT, "../..");
const CATALOG_PATH = join(REPO_ROOT, "catalog", "toron-mcp.json");
const CONTENT_DIR = join(APP_ROOT, "content", "docs");

const ROOT_PAGE = "index";
const HOW_IT_WORKS_PAGE = "how-it-works";
const GUIDES_PAGE = "guides";
// The four plane sections, so the docs nav reads stack-first (ADR-0003 D2). The
// list mirrors the `planes` in content/docs/planes.json, and check-freshness
// fails if the two disagree.
const PLANE_PAGES = ["toron", "flywheel", "beads", "chiebukuro"];
const TOOLS_PAGE = "tools";
const REFERENCE_PAGE = "reference";

function slugify(name) {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

// Escape a markdown table cell: pipes break MDX tables.
function esc(s) {
  return String(s).replaceAll("|", "\\|");
}

// MDX is JSX, so catalog prose carrying a shell placeholder (`--to <names>`) is
// parsed as an unclosed tag and the build dies on it. Escape the characters MDX
// treats as syntax and the text renders literally. Only prose needs this:
// text inside a backtick code span is already literal to the parser.
function mdx(s) {
  return String(s ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll("{", "&#123;")
    .replaceAll("}", "&#125;");
}

// A table cell needs both: a pipe breaks the column, an angle breaks the parse.
function cellText(s) {
  return mdx(esc(s ?? ""));
}
// Flatten a JSON Schema object into table rows: name (dot path),
// type string, required flag, description. Recurses into nested objects
// and array items. Generic over the schema shape.
function schemaRows(schema, prefix = "", required = []) {
  const rows = [];
  for (const [name, prop] of Object.entries(schema?.properties ?? {})) {
    const path = prefix ? `${prefix}.${name}` : name;
    const req = Array.isArray(required) && required.includes(name);
    rows.push({
      name: path,
      type: typeString(prop),
      required: req,
      description: prop?.description ?? "",
    });
    if (prop?.type === "object" && prop.properties) {
      rows.push(...schemaRows(prop, path, prop.required ?? []));
    }
    if (prop?.type === "array" && prop.items?.type === "object" && prop.items.properties) {
      rows.push(...schemaRows(prop.items, `${path}[]`, prop.items.required ?? []));
    }
  }
  return rows;
}

function typeString(prop) {
  if (!prop) return "any";
  if (prop.type === "array") return `array<${typeString(prop.items ?? {})}>`;
  if (Array.isArray(prop.enum)) return `${prop.type ?? "enum"} (${prop.enum.join(" | ")})`;
  return prop.type ?? "any";
}

function schemaTable(schema, heading) {
  const rows = schemaRows(schema, "", schema?.required ?? []);
  if (rows.length === 0) {
    return `## ${heading}\n\nNo fields.`;
  }
  // The catalog carries no per-field descriptions. Rendering a 16-row column
  // of empty cells looks like missing data and reads as a broken page, so the
  // column is dropped entirely when nothing in the schema has one. It comes
  // back automatically if the extractor starts emitting descriptions, because
  // ADR-0002 D4 forbids inventing the text here.
  const hasDescriptions = rows.some((r) => r.description.trim() !== "");
  const header = hasDescriptions
    ? "| Field | Type | Required | Description |"
    : "| Field | Type | Required |";
  const divider = hasDescriptions ? "|---|---|---|---|" : "|---|---|---|";
  const body = rows.map((r) =>
    hasDescriptions
      ? `| \`${r.name}\` | \`${r.type}\` | ${r.required ? "✓" : ""} | ${cellText(r.description)} |`
      : `| \`${r.name}\` | \`${r.type}\` | ${r.required ? "✓" : ""} |`,
  );
  return [`## ${heading}`, "", header, divider, ...body].join("\n");
}

// The catalog's `example` is a null-filled skeleton of every field. Dropping
// the nulls turns it into a minimal shape a reader can actually adapt, and
// the caption says which it is so nobody mistakes it for a run.
function exampleBlock(example) {
  const defined = Object.fromEntries(
    Object.entries(example ?? {}).filter(([, value]) => value !== null && value !== undefined),
  );
  const json = JSON.stringify(defined, null, 2);
  return [
    "## Example",
    "",
    "The minimal shape. Optional fields are omitted rather than set to `null`:",
    "",
    "```json",
    json,
    "```",
  ].join("\n");
}

function parityNote(parity) {
  const note = typeof parity === "string" ? parity : JSON.stringify(parity);
  return ["## Parity", "", mdx(note)].join("\n");
}

function requiredSummary(schema) {
  const required = schema?.required ?? [];
  if (required.length === 0) {
    return "No fields are required.";
  }
  return `Required: ${required.map((name) => `\`${name}\``).join(", ")}`;
}

// Same-group siblings, so a reader who lands on one tool page can find the
// rest of its cluster without going back to the index.
function relatedTools(tool, groupTools) {
  const siblings = groupTools.filter((t) => t.name !== tool.name);
  if (siblings.length === 0) return "";
  return [
    "## Related tools",
    "",
    ...siblings.map((t) => `- [\`${t.name}\`](./${t.name}) — ${mdx(t.description ?? "")}`),
  ].join("\n");
}

function toolPageMarkdown(tool, groupTools) {
  const { name, description = "", group = "", input_schema, output_schema, example, parity } = tool;
  const parts = [
    "---",
    `title: ${JSON.stringify(name)}`,
    `description: ${JSON.stringify(String(description))}`,
    "---",
    "",
    mdx(description),
    "",
    `**Group:** ${mdx(group)} · ${requiredSummary(input_schema)}`,
    "",
    "Task-oriented help lives in the [walkthroughs](/docs/guides). This page is the generated schema reference.",
    "",
    schemaTable(input_schema, "Input"),
    "",
    schemaTable(output_schema, "Output"),
    "",
    exampleBlock(example),
    "",
    parityNote(parity),
    "",
  ];
  const related = relatedTools(tool, groupTools);
  if (related) parts.push(related, "");
  return parts.join("\n");
}

function groupMetaJson(group, tools) {
  return JSON.stringify(
    {
      title: group,
      pages: tools.map((t) => t.name),
    },
    null,
    2,
  );
}

// Normalize parity into rows: a string → single `parity` column; an
// array/object of {name, status-ish} → one column per entry. Generic.
function parityColumns(tools) {
  const sample = tools.find((t) => t.parity !== undefined)?.parity;
  if (sample === undefined) return null;
  if (typeof sample === "string") {
    return {
      headers: ["Parity"],
      cell: (tool) => String(tool.parity ?? ""),
    };
  }
  if (Array.isArray(sample)) {
    const names = [...new Set(sample.map((s) => s?.name ?? s?.harness).filter(Boolean))];
    return {
      headers: names,
      cell: (tool) =>
        names
          .map((n) => {
            const entry = (tool.parity ?? []).find((s) => (s?.name ?? s?.harness) === n);
            return entry ? `${entry.status ?? entry.note ?? "✓"}` : "—";
          })
          .join(" · "),
    };
  }
  return {
    headers: ["Parity"],
    cell: (tool) => JSON.stringify(tool.parity ?? ""),
  };
}

function referenceMarkdown(catalog) {
  const tools = catalog.tools ?? [];
  const parity = parityColumns(tools);
  const headers = ["Tool", "Group", ...(parity?.headers ?? [])];
  const lines = [
    "---",
    "title: Reference",
    `description: ${JSON.stringify("Full tool surface, parity grid, resources, and CLI commands, generated from the catalog.")}`,
    "---",
    "",
    "Every name, schema, and count on this page is generated from `catalog/toron-mcp.json` on each build. If a field\nlooks wrong, the extractor in the product repository is the thing to fix.",
    "",
    "Looking for a task instead of a tool? Start with the [walkthroughs](/docs/guides).",
    "",
    `## Tools (${tools.length})`,
    "",
    "One page per tool, grouped by the cluster the catalog assigns it.",
    "",
    `| ${headers.join(" | ")} |`,
    `|${headers.map(() => "---").join("|")}|`,
  ];
  for (const tool of tools) {
    const cell = parity ? parity.cell(tool) : "";
    const href = `./tools/${slugify(tool.group)}/${tool.name}`;
    lines.push(`| [\`${tool.name}\`](${href}) | ${cellText(tool.group)} | ${cellText(cell)} |`);
  }

  const resources = catalog.resources ?? [];
  if (resources.length > 0) {
    lines.push(
      "",
      `## Resources (${resources.length})`,
      "",
      "| Name | URI | Description |",
      "|---|---|---|",
    );
    for (const r of resources) {
      lines.push(`| \`${r.name}\` | \`${r.uri}\` | ${cellText(r.description ?? "")} |`);
    }
  }

  const cli = catalog.cli_commands ?? [];
  if (cli.length > 0) {
    lines.push(
      "",
      `## CLI commands (${cli.length})`,
      "",
      "| Command | Args | Description |",
      "|---|---|---|",
    );
    for (const c of cli) {
      lines.push(`| \`${c.name}\` | \`${esc(c.args ?? "")}\` | ${cellText(c.description ?? "")} |`);
    }
  }
  lines.push("");
  return lines.join("\n");
}

// Merge root meta.json: preserve existing hand-written pages (e.g.
// sections added by later phases), pin index first, tools + reference.
function mergeRootMeta(existing) {
  const pinned = [
    ROOT_PAGE,
    HOW_IT_WORKS_PAGE,
    GUIDES_PAGE,
    ...PLANE_PAGES,
    TOOLS_PAGE,
    REFERENCE_PAGE,
  ];
  const known = new Set(pinned);
  const kept = (existing?.pages ?? []).filter((p) => !known.has(p));
  // The trailing newline is load-bearing. Without it every build rewrites this
  // file with the newline missing, so the tree comes out dirty after a build
  // that changed nothing, and the next person has to notice and revert it.
  // Every other JSON this repo writes ends with one.
  return `${JSON.stringify({ ...existing, pages: [...pinned, ...kept] }, null, 2)}\n`;
}

function main() {
  let catalog;
  try {
    catalog = JSON.parse(readFileSync(CATALOG_PATH, "utf8"));
  } catch (err) {
    throw new Error(`cannot read catalog ${CATALOG_PATH}: ${err.message}`);
  }
  const tools = catalog.tools ?? [];
  const resources = catalog.resources ?? [];
  if (tools.length !== 38)
    throw new Error(`catalog ${CATALOG_PATH} must contain 38 tools, found ${tools.length}`);
  if (resources.length !== 25)
    throw new Error(`catalog ${CATALOG_PATH} must contain 25 resources, found ${resources.length}`);

  // Group tools by their `group` field, preserving catalog order.
  const groups = new Map();
  for (const tool of tools) {
    const group = tool.group ?? "Ungrouped";
    if (!groups.has(group)) groups.set(group, []);
    groups.get(group).push(tool);
  }
  if (groups.size !== 9)
    throw new Error(`catalog ${CATALOG_PATH} must contain 9 tool groups, found ${groups.size}`);

  // Rebuild the tools/ subtree in a staging directory and swap it in, rather
  // than removing the live one and writing into it. content/docs/tools/ is
  // gitignored, so an interrupted run that deleted it first would destroy files
  // git cannot restore, and the next build would be the only thing that puts
  // them back.
  const toolsDir = join(CONTENT_DIR, TOOLS_PAGE);
  atomicReplaceDirSync(toolsDir, (staging) => {
    mkdirSync(staging, { recursive: true });
    writeFileSync(join(staging, "meta.json"), JSON.stringify({ title: "Tools" }, null, 2));

    for (const [group, groupTools] of groups) {
      const dir = join(staging, slugify(group));
      mkdirSync(dir, { recursive: true });
      writeFileSync(join(dir, "meta.json"), groupMetaJson(group, groupTools));
      for (const tool of groupTools) {
        writeFileSync(join(dir, `${tool.name}.mdx`), toolPageMarkdown(tool, groupTools));
      }
    }
  });

  atomicWriteSync(join(CONTENT_DIR, `${REFERENCE_PAGE}.mdx`), referenceMarkdown(catalog));

  let existingMeta = null;
  try {
    existingMeta = JSON.parse(readFileSync(join(CONTENT_DIR, "meta.json"), "utf8"));
  } catch {
    // no existing root meta — first run
  }
  atomicWriteSync(join(CONTENT_DIR, "meta.json"), mergeRootMeta(existingMeta));

  console.log(
    `[generate-tool-docs] ${tools.length} tools / ${groups.size} groups → ${CONTENT_DIR}`,
  );
}

main();
