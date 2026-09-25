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
import { mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const APP_ROOT = resolve(HERE, '..');
const REPO_ROOT = resolve(APP_ROOT, '../..');
const CATALOG_PATH = join(REPO_ROOT, 'catalog', 'toron-mcp.json');
const CONTENT_DIR = join(APP_ROOT, 'content', 'docs');

const ROOT_PAGE = 'index';
const HOW_IT_WORKS_PAGE = 'how-it-works';
const TOOLS_PAGE = 'tools';
const REFERENCE_PAGE = 'reference';

function slugify(name) {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}


// Escape a markdown table cell: pipes break MDX tables.
function esc(s) {
  return String(s).replaceAll('|', '\\|');
}
// Flatten a JSON Schema object into table rows: name (dot path),
// type string, required flag, description. Recurses into nested objects
// and array items. Generic over the schema shape.
function schemaRows(schema, prefix = '', required = []) {
  const rows = [];
  for (const [name, prop] of Object.entries(schema?.properties ?? {})) {
    const path = prefix ? `${prefix}.${name}` : name;
    const req = Array.isArray(required) && required.includes(name);
    rows.push({
      name: path,
      type: typeString(prop),
      required: req,
      description: prop?.description ?? '',
    });
    if (prop?.type === 'object' && prop.properties) {
      rows.push(...schemaRows(prop, path, prop.required ?? []));
    }
    if (prop?.type === 'array' && prop.items?.type === 'object' && prop.items.properties) {
      rows.push(...schemaRows(prop.items, `${path}[]`, prop.items.required ?? []));
    }
  }
  return rows;
}

function typeString(prop) {
  if (!prop) return 'any';
  if (prop.type === 'array') return `array<${typeString(prop.items ?? {})}>`;
  if (Array.isArray(prop.enum)) return `${prop.type ?? 'enum'} (${prop.enum.join(' | ')})`;
  return prop.type ?? 'any';
}

function schemaTable(schema, heading) {
  const rows = schemaRows(schema, '', schema?.required ?? []);
  if (rows.length === 0) {
    return `## ${heading}\n\nNo fields.`;
  }
  const lines = [
    `## ${heading}`,
    '',
    '| Field | Type | Required | Description |',
    '|---|---|---|---|',
    ...rows.map(
      (r) =>
        `| \`${r.name}\` | \`${r.type}\` | ${r.required ? '✓' : ''} | ${r.description.replaceAll('|', '\\|')} |`,
    ),
  ];
  return lines.join('\n');
}

function exampleBlock(example) {
  const json = JSON.stringify(example ?? {}, null, 2);
  return ['## Example', '', '```json', json, '```'].join('\n');
}

function parityNote(parity) {
  const note = typeof parity === 'string' ? parity : JSON.stringify(parity);
  return ['## Parity', '', note].join('\n');
}

function toolPageMarkdown(tool) {
  const { name, description = '', input_schema, output_schema, example, parity } = tool;
  const parts = [
    '---',
    `title: ${JSON.stringify(name)}`,
    `description: ${JSON.stringify(String(description))}`,
    '---',
    '',
    description,
    '',
    schemaTable(input_schema, 'Input'),
    '',
    schemaTable(output_schema, 'Output'),
    '',
    exampleBlock(example),
    '',
    parityNote(parity),
    '',
  ];
  return parts.join('\n');
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
  if (typeof sample === 'string') {
    return {
      headers: ['Parity'],
      cell: (tool) => String(tool.parity ?? ''),
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
            return entry ? `${entry.status ?? entry.note ?? '✓'}` : '—';
          })
          .join(' · '),
    };
  }
  return {
    headers: ['Parity'],
    cell: (tool) => JSON.stringify(tool.parity ?? ''),
  };
}

function referenceMarkdown(catalog) {
  const tools = catalog.tools ?? [];
  const parity = parityColumns(tools);
  const headers = ['Tool', 'Group', ...(parity?.headers ?? [])];
  const lines = [
    '---',
    'title: Reference',
    `description: ${JSON.stringify('Full tool surface, parity grid, resources, and CLI commands, generated from the catalog.')}`,
    '---',
    '',
    `## Tools (${tools.length})`,
    '',
    `| ${headers.join(' | ')} |`,
    `|${headers.map(() => '---').join('|')}|`,
  ];
  for (const tool of tools) {
    const cell = parity ? parity.cell(tool) : '';
    const href = `./tools/${slugify(tool.group)}/${tool.name}`;
    lines.push(`| [\`${tool.name}\`](${href}) | ${esc(tool.group)} | ${esc(cell)} |`);
  }

  const resources = catalog.resources ?? [];
  if (resources.length > 0) {
    lines.push('', `## Resources (${resources.length})`, '', '| Name | URI | Description |', '|---|---|---|');
    for (const r of resources) {
      lines.push(`| \`${r.name}\` | \`${r.uri}\` | ${esc(r.description ?? '')} |`);
    }
  }

  const cli = catalog.cli_commands ?? [];
  if (cli.length > 0) {
    lines.push('', `## CLI commands (${cli.length})`, '', '| Command | Args | Description |', '|---|---|---|');
    for (const c of cli) {
      lines.push(`| \`${c.name}\` | \`${esc(c.args ?? '')}\` | ${esc(c.description ?? '')} |`);
    }
  }
  lines.push('');
  return lines.join('\n');
}

// Merge root meta.json: preserve existing hand-written pages (e.g.
// sections added by later phases), pin index first, tools + reference.
function mergeRootMeta(existing) {
  const known = new Set([ROOT_PAGE, HOW_IT_WORKS_PAGE, TOOLS_PAGE, REFERENCE_PAGE]);
  const kept = (existing?.pages ?? []).filter((p) => !known.has(p));
  const pages = [ROOT_PAGE, HOW_IT_WORKS_PAGE, TOOLS_PAGE, REFERENCE_PAGE, ...kept];
  return JSON.stringify({ ...existing, pages }, null, 2);
}

function main() {
  let catalog;
  try {
    catalog = JSON.parse(readFileSync(CATALOG_PATH, 'utf8'));
  } catch (err) {
    throw new Error(`cannot read catalog ${CATALOG_PATH}: ${err.message}`);
  }
  const tools = catalog.tools ?? [];
  const resources = catalog.resources ?? [];
  if (tools.length !== 38) throw new Error(`catalog ${CATALOG_PATH} must contain 38 tools, found ${tools.length}`);
  if (resources.length !== 25) throw new Error(`catalog ${CATALOG_PATH} must contain 25 resources, found ${resources.length}`);

  // Group tools by their `group` field, preserving catalog order.
  const groups = new Map();
  for (const tool of tools) {
    const group = tool.group ?? 'Ungrouped';
    if (!groups.has(group)) groups.set(group, []);
    groups.get(group).push(tool);
  }
  if (groups.size !== 9) throw new Error(`catalog ${CATALOG_PATH} must contain 9 tool groups, found ${groups.size}`);

  // Clean generated output: the tools/ subtree + reference page.
  const toolsDir = join(CONTENT_DIR, TOOLS_PAGE);
  rmSync(toolsDir, { recursive: true, force: true });
  rmSync(join(CONTENT_DIR, `${REFERENCE_PAGE}.mdx`), { recursive: true, force: true });
  mkdirSync(toolsDir, { recursive: true });
  writeFileSync(join(toolsDir, 'meta.json'), JSON.stringify({ title: 'Tools' }, null, 2));

  for (const [group, groupTools] of groups) {
    const dir = join(toolsDir, slugify(group));
    mkdirSync(dir, { recursive: true });
    writeFileSync(join(dir, 'meta.json'), groupMetaJson(group, groupTools));
    for (const tool of groupTools) {
      writeFileSync(join(dir, `${tool.name}.mdx`), toolPageMarkdown(tool));
    }
  }

  writeFileSync(join(CONTENT_DIR, `${REFERENCE_PAGE}.mdx`), referenceMarkdown(catalog));

  let existingMeta = null;
  try {
    existingMeta = JSON.parse(readFileSync(join(CONTENT_DIR, 'meta.json'), 'utf8'));
  } catch {
    // no existing root meta — first run
  }
  writeFileSync(join(CONTENT_DIR, 'meta.json'), mergeRootMeta(existingMeta));

  console.log(
    `[generate-tool-docs] ${tools.length} tools / ${groups.size} groups → ${CONTENT_DIR}`,
  );
}

main();
