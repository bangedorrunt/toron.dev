/*
 * Render the stack strip's art for a human to judge.
 *
 * What this is: a contact sheet of the four shipped mascot renders, laid out
 * with the site's own stylesheet, on the site's own background. Three sections
 * and one question each.
 *
 *   strip    the home page's strip exactly as it draws (the css box), checked
 *   ladder   the same strip at four sizes, because the drawn size is a taste
 *            call that only an eye can make and the numbers below it are the
 *            cost of each rung (cell height, and how tall the character lands)
 *   zoom     the four files large, for inspecting the artwork itself
 *
 * What this is NOT: a test of the app wiring. `next build` proves the component's
 * imports resolve and a page load proves the bytes are served. This sheet reads
 * the four files from disk and renders them through the real CSS, which is what
 * keeps it runnable with no server and no build.
 *
 * The markup below is the strip's shape copied from components/site-content.tsx,
 * because the checks read real class names out of the real stylesheet. If the
 * component's shape changes, this sheet drifts, so it prints what it drew rather
 * than trusting the reader to notice.
 *
 * Run: node scripts/render-strip.mjs
 * Writes .mascot-out/strip.png and strip@2x.png, exits non-zero on a failed check.
 */

import { mkdirSync, readFileSync, readdirSync, rmSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright";

const HERE = dirname(fileURLToPath(import.meta.url));
const APP_ROOT = resolve(HERE, "..");
const ASSETS = join(APP_ROOT, "assets", "mascots");
const OUT_DIR = join(APP_ROOT, ".mascot-out");
const ZOOM = 160; // the review row, deliberately not a size the site draws

// The size the css draws the art at, kept here as the assertion target rather
// than read back out of the stylesheet: a check that reads its input from the
// thing it is checking passes after the stylesheet loses the rule.
const BOX = 72; // 4.5rem at the 16px root

// The rungs the operator chooses between. The shipped size has to appear among
// them, or the ladder starts comparing candidates the site does not draw.
const LADDER = [56, 72, 88, 104];

// Copied from the component's plane list. The sheet needs names and roles to draw
// the real cells; the set check below fails if the directory holds a slug this
// list does not know about.
const PLANES = [
  { slug: "toron", name: "Toron", role: "signed mail · identity · receipts · reservations" },
  { slug: "flywheel", name: "Flywheel", role: "spawn · dispatch · loops · workflows · cron" },
  { slug: "beads", name: "Beads", role: "work items · dependencies · gates · close evidence" },
  {
    slug: "chiebukuro",
    name: "Chiebukuro",
    role: "curated knowledge · episodic memory · synthesis",
  },
];

let bad = 0;
const line = (ok, label, detail) => {
  if (!ok) bad++;
  console.log(`  ${(ok ? "ok" : "FAIL").padEnd(5)} ${label.padEnd(18)} ${detail}`);
};

/*
 * The art goes in as data URLs, not as `./assets/...` paths.
 *
 * The sheet has to be a `file://` page, because that is what lets it link the
 * real stylesheet with no server. But a file-loaded image taints the canvas, and
 * `getImageData` then throws instead of returning pixels, which is how the first
 * version of this script died on its own framing check. A data URL is
 * same-origin, so the canvas stays readable.
 */
const art = (slug) =>
  `data:image/png;base64,${readFileSync(join(ASSETS, `${slug}.png`)).toString("base64")}`;

/*
 * The stylesheet, loaded as a file, needs the tokens too. `app/global.css` opens
 * with bare `@import`s (tailwind, fumadocs, the token package) and a bare
 * specifier cannot resolve over `file://`, so the token stylesheet is linked
 * directly as well, ahead of it. Skip it and every declaration that reads a
 * `--toron-*` variable is dropped as invalid at computed-value time, silently.
 */
const TOKENS = `<link rel="stylesheet" href="../../packages/tokens/theme.css">`;

const cell = (p) => `<a class="toron-stack-strip__item" href="#">
    <img class="toron-stack-strip__mascot" data-slug="${p.slug}" src="${art(p.slug)}" alt="">
    <span class="toron-stack-strip__name">${p.name}</span>
    <span class="toron-stack-strip__role">${p.role}</span>
  </a>`;

const strip = (id, size) =>
  `<div class="toron-stack-strip" ${id ? `id="${id}"` : `data-size="${size}"`} style="--mascot:${size}px">${PLANES.map(cell).join("")}</div>`;

const frame = (p) =>
  `<div class="col"><img class="toron-stack-strip__mascot" data-slug="${p.slug}" src="${art(p.slug)}" alt=""><span class="lab">${p.slug}</span></div>`;

const page = `<!doctype html><html><head><meta charset="utf-8">
${TOKENS}
<link rel="stylesheet" href="./app/global.css"><style>
  html, body { background: var(--toron-bg); }
  body { margin:0; padding:32px; color: var(--toron-ink); font:12px/1.5 ui-monospace,monospace; }
  h1 { font:600 12px/1.4 ui-monospace,monospace; color: var(--toron-body); margin:0 0 20px; letter-spacing:.06em; text-transform:uppercase; }
  h1 b { color: var(--toron-ink); }
  .toron-stack-strip { max-width: 900px; }
  .gap { height: 34px; }
  .zoom { display:flex; gap:26px; align-items:flex-end; }
  .col { display:flex; flex-direction:column; gap:9px; align-items:center; }
  .lab { color: var(--toron-body); font-size:11px; }
  /* the review sections only: the strip's own box rule stays untouched, and the
     ladder restates it per rung so one sheet can show all four sizes */
  .zoom .toron-stack-strip__mascot { width:${ZOOM}px; height:${ZOOM}px; }
  .ladder h2 { font:600 11px/1.4 ui-monospace,monospace; color: var(--toron-body); margin:0 0 8px; }
  .ladder .toron-stack-strip { margin-bottom: 22px; }
  .ladder .toron-stack-strip__mascot { width: var(--mascot); height: var(--mascot); }
</style></head><body>
<h1>stack strip · <b>the size the home page draws it</b> · ${BOX}px</h1>
${strip("strip", BOX)}
<div class="gap"></div>
<h1>size ladder · <b>the same strip at each candidate size</b></h1>
<div class="ladder">
${LADDER.map((s) => `  <h2>${s}px${s === BOX ? " · shipped" : ""}</h2>\n  ${strip(null, s)}`).join("\n")}
</div>
<div class="gap"></div>
<h1>review zoom · <b>not a size the site draws</b> · ${ZOOM}px</h1>
<div class="zoom">${PLANES.map(frame).join("")}</div>
</body></html>`;

mkdirSync(OUT_DIR, { recursive: true });
const pageFile = join(APP_ROOT, ".mascot-strip.html");
writeFileSync(pageFile, page);

const browser = await chromium.launch();
// Both captures open at once: two views of the same file, one read for the
// checks and two writes for the reviewer. The checks below run against the 1x
// page only, because every one of them is about css or natural pixels and none
// is about capture density.
const pages = await Promise.all(
  [1, 2].map(async (scale) => {
    const shot = await browser.newPage({
      deviceScaleFactor: scale,
      viewport: { width: 1000, height: 500 },
    });
    await shot.goto(`file://${pageFile}`);
    return { scale, shot };
  }),
);
const one = pages.find((p) => p.scale === 1).shot;

const seen = await one.evaluate(async () => {
  // The drawn silhouette at natural size. The assets are cropped to their own
  // silhouette, so a drawn long side far short of the canvas means the crop is
  // not doing its job and the character will read small inside its box. The box
  // is reported too, so the drawn height can be read at any render size.
  const measure = async (img) => {
    const c = document.createElement("canvas");
    c.width = img.naturalWidth;
    c.height = img.naturalHeight;
    const ctx = c.getContext("2d", { willReadFrequently: true });
    ctx.drawImage(img, 0, 0);
    const d = ctx.getImageData(0, 0, c.width, c.height).data;
    let minX = c.width;
    let minY = c.height;
    let maxX = -1;
    let maxY = -1;
    for (let y = 0; y < c.height; y++) {
      for (let x = 0; x < c.width; x++) {
        if (d[(y * c.width + x) * 4 + 3] > 8) {
          if (x < minX) minX = x;
          if (y < minY) minY = y;
          if (x > maxX) maxX = x;
          if (y > maxY) maxY = y;
        }
      }
    }
    return {
      natural: { w: img.naturalWidth, h: img.naturalHeight },
      drawn: { w: maxX - minX + 1, h: maxY - minY + 1 },
      drawnLong: Math.max(maxX - minX + 1, maxY - minY + 1),
      canvasLong: Math.max(c.width, c.height),
    };
  };

  const rows = await Promise.all(
    [...document.querySelectorAll("#strip .toron-stack-strip__item")].map(async (item) => {
      const img = item.querySelector("img.toron-stack-strip__mascot");
      const rect = img.getBoundingClientRect();
      return {
        slug: img.dataset.slug,
        loaded: img.complete && img.naturalWidth > 0,
        box: [Math.round(rect.width), Math.round(rect.height)],
        fit: getComputedStyle(img).objectFit,
        fill: getComputedStyle(item).backgroundColor,
        ...(img.naturalWidth > 0 ? await measure(img) : {}),
      };
    }),
  );

  // What each rung costs in layout: the cell is content sized, so a bigger
  // mascot makes the whole strip taller.
  const cells = Object.fromEntries(
    [...document.querySelectorAll(".ladder .toron-stack-strip")].map((s) => [
      s.dataset.size,
      Math.max(
        ...[...s.querySelectorAll(".toron-stack-strip__item")].map((i) =>
          Math.round(i.getBoundingClientRect().height),
        ),
      ),
    ]),
  );

  const root = getComputedStyle(document.documentElement);
  return {
    token: root.getPropertyValue("--toron-ease-standard").trim(),
    bg: root.getPropertyValue("--toron-bg").trim(),
    rows,
    cells,
    canvas: document.querySelector("#strip img").naturalWidth,
  };
});

console.log();
line(
  seen.token.length > 0,
  "tokens loaded",
  "--toron-ease-standard resolved, so the sheet is styled like the site",
);
line(
  seen.bg.length > 0,
  "background",
  `the page paints the site's own ${seen.bg || "missing"} --toron-bg`,
);
const painted = seen.rows[0]?.fill;
line(
  !!painted && painted !== "rgba(0, 0, 0, 0)",
  "cells painted",
  !painted || painted === "rgba(0, 0, 0, 0)"
    ? "a strip cell is transparent, so --toron-bg never reached the strip's own rules"
    : `a strip cell paints ${painted}`,
);

// The set on disk is the set the strip can draw. A slug present in one and not
// the other is a character that renders as a silent broken image.
const onDisk = readdirSync(ASSETS)
  .filter((f) => f.endsWith(".png"))
  .map((f) => f.replace(".png", ""))
  .toSorted();
const declared = PLANES.map((p) => p.slug).toSorted();
line(
  onDisk.length === declared.length && onDisk.every((s, i) => s === declared[i]),
  "set matches",
  `assets hold exactly ${onDisk.join(", ")}`,
);
line(
  LADDER.includes(BOX),
  "ladder honest",
  LADDER.includes(BOX)
    ? `the rungs include the shipped ${BOX}px, marked on the sheet`
    : `the ladder is ${LADDER.join("/")}px while the strip draws ${BOX}px`,
);

for (const row of seen.rows) {
  line(
    row.loaded,
    `${row.slug} loads`,
    row.loaded ? `natural ${row.natural.w}x${row.natural.h}` : "the image never decoded",
  );
  const boxed = row.box[0] === BOX && row.box[1] === BOX;
  line(
    boxed,
    `${row.slug} box`,
    boxed ? `${BOX}x${BOX} as the stylesheet says` : `drawn at ${row.box.join("x")}`,
  );
  line(
    row.fit === "contain",
    `${row.slug} fit`,
    `object-fit is ${row.fit}, so the crop's aspect survives the square box`,
  );
  line(
    row.drawnLong / row.canvasLong > 0.9,
    `${row.slug} framed`,
    `silhouette is ${row.drawnLong} of ${row.canvasLong}px (${Math.round((row.drawnLong / row.canvasLong) * 100)}%), so the art is cropped to itself`,
  );
}

// The two numbers the size decision needs, together: how tall the character
// lands at each rung, and what that rung does to the strip's height.
console.log(`\n  drawn height per character, and the cell it forces`);
console.log(`  ${"character".padEnd(12)}${LADDER.map((s) => `${s}px`.padEnd(8)).join("")}`);
for (const row of seen.rows) {
  // Row measurements are in master pixels, so the drawn height is a share of the
  // character that any render size can be read off.
  const scale = seen.canvas ? 1 / seen.canvas : 0;
  console.log(
    `  ${row.slug.padEnd(12)}${LADDER.map((s) => `${Math.round(row.drawn.h * scale * s)}`.padEnd(8)).join("")}`,
  );
}
console.log(
  `  ${"cell height".padEnd(12)}${LADDER.map((s) => `${seen.cells[s] ?? "?"}`.padEnd(8)).join("")}\n`,
);

const shots = await Promise.all(
  pages.map(async ({ scale, shot }) => {
    const file = join(OUT_DIR, scale === 1 ? "strip.png" : `strip@${scale}x.png`);
    await shot.screenshot({ path: file, fullPage: true });
    return file;
  }),
);
await Promise.all(pages.map(({ shot }) => shot.close()));
await browser.close();
rmSync(pageFile, { force: true });

console.log(`  sheets    ${shots.join("\n            ")}\n`);
console.log(
  bad === 0
    ? `  all checks passed on 4 characters; the artwork and the size are judged by eye at the sheets above\n`
    : `  ${bad} check(s) failed\n`,
);
process.exitCode = bad === 0 ? 0 : 1;
