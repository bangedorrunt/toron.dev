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
 *   placements  every surface the characters now appear on — the docs index row, a
 *            plane page's mark, a marketing page's header marks, a card's chip —
 *            drawn at the size the stylesheet gives it, because a placement that
 *            lands at the wrong size is a bug that only shows up in a screenshot
 *            three releases later
 *
 * What this is NOT: a test of the app wiring. `next build` proves the component's
 * imports resolve and a page load proves the bytes are served. This sheet reads the
 * four files from disk and renders them through the real CSS, which is what keeps the
 * art checks runnable with no server.
 *
 * Three checks at the bottom read the **build output** rather than the browser: the
 * runtime split (the docs must not reference the animation chunk), the morph names
 * (one per slug per page, declared once in the stylesheet), and the social card. Each
 * prints `skipped` and says why when there is no build to read, so a run without one
 * is visibly incomplete instead of quietly green.
 *
 * The markup below is the strip's shape copied from components/site-content.tsx,
 * because the checks read real class names out of the real stylesheet. If the
 * component's shape changes, this sheet drifts, so it prints what it drew rather
 * than trusting the reader to notice.
 *
 * Run: node scripts/render-strip.mjs
 * Writes .mascot-out/strip.png and strip@2x.png, exits non-zero on a failed check.
 */

import { existsSync, mkdirSync, readFileSync, readdirSync, rmSync, writeFileSync } from "node:fs";
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
  {
    slug: "toron",
    name: "Toron",
    role: "signed mail · identity · receipts · reservations",
    owns: "signed mail, identity, receipts, reservations, archive",
  },
  {
    slug: "flywheel",
    name: "Flywheel",
    role: "spawn · dispatch · loops · workflows · cron",
    owns: "dispatch, loops, workflows, cron, coalitions",
  },
  {
    slug: "beads",
    name: "Beads",
    role: "work items · dependencies · gates · close evidence",
    owns: "claims, dependencies, verification gates, close evidence",
  },
  {
    slug: "chiebukuro",
    name: "Chiebukuro",
    role: "curated knowledge · episodic memory · synthesis",
    owns: "curated knowledge, episodic memory, synthesis",
  },
];

/*
 * The four placements, in the markup the components render.
 *
 * Including the `toron-character__drift` / `__tilt` layers matters: those are the
 * elements the motion island animates, so measuring the art through them is
 * measuring the box the site actually draws, not the box a simpler sheet would.
 */
// A function, not a string: it inlines the art as data URLs, and `art` is declared
// below the plane list. Called while the page is built, by which time it exists.
const placements = () => `
<h1>docs index row · <b>the four, as the door into the four pages</b></h1>
<div class="toron-plane-row" id="plane-row">
${PLANES.map(
  (p) =>
    `  <a class="toron-plane-row__item" href="#"><img class="toron-plane-row__art" data-slug="${p.slug}" src="${art(p.slug)}" alt=""><span class="toron-plane-row__name">${p.name}</span><span class="toron-plane-row__owns">${p.owns}</span></a>`,
).join("\n")}
</div>
<div class="gap"></div>
<h1>plane page mark · <b>one character, at its own size</b></h1>
<div class="toron-plane-mark" id="plane-mark">
  <img class="toron-plane-mark__art" data-slug="toron" src="${art("toron")}" alt="">
  <div class="toron-plane-mark__copy"><p class="toron-plane-mark__name">Toron</p><p class="toron-plane-mark__role">${PLANES[0].role}</p></div>
</div>
<div class="gap"></div>
<h1>page header marks · <b>against the title they sit beside</b></h1>
<div class="anchor">
  <header class="toron-page__header">
    <div class="toron-page__marks" id="marks">
${PLANES.map(
  (p) =>
    `    <span class="toron-character toron-character--mark"><span class="toron-character__drift"><span class="toron-character__tilt"><img class="toron-character__art" data-slug="${p.slug}" src="${art(p.slug)}" alt=""></span></span></span>`,
).join("\n")}
    </div>
    <p class="toron-page__eyebrow">Architecture</p>
    <h1 class="toron-display">Four planes. One execution loop.</h1>
  </header>
</div>
<div class="gap"></div>
<h1>card chip · <b>the smallest placement, in a card corner</b></h1>
<article class="toron-card" id="card-mark">
  <div class="toron-card__top"><p class="toron-card__eyebrow">2026-09-25</p><span class="toron-character toron-character--chip"><span class="toron-character__drift"><span class="toron-character__tilt"><img class="toron-character__art" data-slug="toron" src="${art("toron")}" alt=""></span></span></span></div>
  <span class="toron-tile__head"><h3>A card that names its plane</h3></span>
  <p class="toron-card__body">The chip is the plane the card is about.</p>
</article>
`;

let bad = 0;
// Set by the checks that need a build. A run without one is incomplete, and says so.
let unchecked = false;
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
  /* the marks are absolutely positioned on a real page, so the sheet gives them
     the positioned ancestor the header provides, and keeps the review shot sane */
  .anchor { position: relative; padding-top: 70px; }
  #card-mark { max-width: 320px; }
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
<div class="gap"></div>
${placements()}
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

/* ---------------------------------------------------------------- placements */

/*
 * Every placement, measured in the browser through the real stylesheet.
 *
 * The expected boxes are written out here rather than read back out of the css, for
 * the same reason the strip's box is: a check that reads its expectation from the
 * thing it is checking passes after that thing loses the rule.
 *
 * The sheet draws at a 1000px viewport, which is what makes the plane mark's
 * `clamp(5.5rem, 16vw, 8.5rem)` land on its upper bound of 136px. Resize the
 * viewport and these numbers change with it, which is why they are named as sizes
 * and not as truths.
 */
// The arrival animation is still in flight at load, and it scales the element it
// runs on. Wait for it to settle: what a placement measures has to be the box the
// reader ends up with, not a frame of its entrance.
await one.waitForTimeout(700);

const placed = await one.evaluate(() => {
  const box = (el) => {
    const rect = el.getBoundingClientRect();
    return [Math.round(rect.width), Math.round(rect.height)];
  };
  const art = (img) => ({
    slug: img.dataset.slug,
    box: box(img),
    fit: getComputedStyle(img).objectFit,
  });

  const row = document.querySelector("#plane-row");
  return {
    row: [...row.querySelectorAll(".toron-plane-row__art")].map(art),
    rowHeights: [...row.querySelectorAll(".toron-plane-row__item")].map((item) =>
      Math.round(item.getBoundingClientRect().height),
    ),
    gridCols: getComputedStyle(row).gridTemplateColumns.split(" ").filter(Boolean).length,
    mark: art(document.querySelector("#plane-mark .toron-plane-mark__art")),
    marks: [...document.querySelectorAll("#marks .toron-character__art")].map(art),
    chip: art(document.querySelector("#card-mark .toron-character__art")),
    layer: box(document.querySelector("#marks .toron-character__drift")),
    layerDisplay: getComputedStyle(document.querySelector("#marks .toron-character__drift"))
      .display,
    cardTop: Boolean(document.querySelector("#card-mark .toron-card__top")),
  };
});

console.log(`\n  placements, drawn through the real stylesheet`);
const expect = (label, art, [w, h]) => {
  const ok = art.box[0] === w && art.box[1] === h;
  line(ok, label, ok ? `${w}x${h}` : `drawn at ${art.box.join("x")}`);
  line(art.fit === "contain", `${label} fit`, `object-fit is ${art.fit}`);
};

expect("row art", placed.row[0], [64, 64]);
line(placed.row.length === 4, "row art count", `${placed.row.length} character(s) in the row`);
line(placed.gridCols === 4, "row columns", `${placed.gridCols} column(s), so the row is one line`);
line(
  new Set(placed.rowHeights).size === 1,
  "row aligned",
  `every tile is ${placed.rowHeights[0]}px tall, so the four read as one row`,
);
expect("mark art", placed.mark, [136, 136]);
expect("header mark art", placed.marks[0], [56, 56]);
line(placed.marks.length === 4, "header marks", `${placed.marks.length} mark(s) in the header`);
expect("card chip art", placed.chip, [32, 32]);
line(placed.cardTop, "card top row", "an eyebrow and a chip share the card's top line");
/*
 * The two layers the motion island animates must not add a box of their own: the
 * drift layer wraps the art exactly, so what was measured above is what moves.
 *
 * The assertion is on the box, not on `display: inline-flex`, because a flex item's
 * display blockifies: the first version of this check failed on a computed `flex`
 * that was correct css, which is the good kind of failing test to have.
 */
line(
  placed.layer[0] === placed.marks[0].box[0] && placed.layer[1] === placed.marks[0].box[1],
  "motion layers",
  `the drift layer is ${placed.layerDisplay} and ${placed.layer.join("x")}, exactly the art's box`,
);

/*
 * The sheet's copy of the plane list is checked against the module that owns it.
 * Every number and name below is otherwise read off a copy, and a copy that drifts
 * is a green check on the wrong set: this is the one check that keeps the sheet
 * honest about what it is measuring.
 */
const planeSource = readFileSync(join(APP_ROOT, "lib", "planes.ts"), "utf8");
const inSource = (field, value) => planeSource.includes(`${field}: "${value}"`);
line(
  PLANES.every(
    (p) =>
      inSource("slug", p.slug) &&
      inSource("name", p.name) &&
      inSource("role", p.role) &&
      inSource("owns", p.owns),
  ),
  "list in sync",
  "the sheet's four slugs, names, roles and ownership lines all appear in lib/planes.ts",
);

/*
 * The arrival animation, and what happens to it when a reader has asked for less
 * motion. Both are read off the real stylesheet in a real browser, because a
 * reduced-motion block that names the wrong selector is invisible in the source and
 * obvious here.
 */
const arrival = await one.evaluate(() => {
  const style = getComputedStyle(document.querySelector("#plane-mark .toron-plane-mark__art"));
  return { name: style.animationName, duration: style.animationDuration };
});
const calmPage = await browser.newPage({
  reducedMotion: "reduce",
  viewport: { width: 1000, height: 500 },
});
await calmPage.goto(`file://${pageFile}`);
const calm = await calmPage.evaluate(() => ({
  arrival: getComputedStyle(document.querySelector("#plane-mark .toron-plane-mark__art"))
    .animationName,
  strip: getComputedStyle(document.querySelector("#strip .toron-stack-strip__mascot"))
    .transitionDuration,
}));
await calmPage.close();
line(
  arrival.name === "toron-mark-arrive",
  "mark arrival",
  `the plane mark runs ${arrival.name} over ${arrival.duration}`,
);
line(
  calm.arrival === "none" && Number.parseFloat(calm.strip) < 0.05,
  "reduced motion",
  `with reduce: arrival ${calm.arrival}, strip hover transition ${calm.strip} (the pointer physics are gated in the component)`,
);

/*
 * The placements, in the app.
 *
 * This half is a census, not a render: it reads the surface that is supposed to
 * carry a character and fails if the reference is gone. It is the check that
 * catches "we put them on the docs and forgot the blog", which no amount of
 * measuring the strip can see.
 */
const CENSUS = [
  ["content/docs/index.mdx", /<PlaneRow/, "the four, on the docs index"],
  ["content/docs/toron.mdx", /<PlaneMark slug="toron"/, "toron's own page"],
  ["content/docs/flywheel.mdx", /<PlaneMark slug="flywheel"/, "flywheel's own page"],
  ["content/docs/beads.mdx", /<PlaneMark slug="beads"/, "beads' own page"],
  ["content/docs/chiebukuro.mdx", /<PlaneMark slug="chiebukuro"/, "chiebukuro's own page"],
  ["app/(site)/architecture/page.tsx", /marks=\{PLANE_SLUGS\}/, "the architecture header"],
  ["app/(site)/compare/page.tsx", /marks=\{PLANE_SLUGS\}/, "the compare header"],
  ["app/(site)/blog/page.tsx", /marks=\{PLANE_SLUGS\}/, "the blog index header"],
  ["app/(site)/blog/[slug]/page.tsx", /marks=\{POST_MARKS/, "every post header"],
  ["app/opengraph-image.tsx", /PLANES\.map\(/, "the social card"],
];

for (const [file, pattern, what] of CENSUS) {
  const source = readFileSync(join(APP_ROOT, file), "utf8");
  const ok = pattern.test(source);
  line(ok, "placed", ok ? `${file} · ${what}` : `${file} no longer renders a character (${what})`);
}

/*
 * The three checks that need a build.
 *
 * The runtime split is the architecture, not a detail: the docs are server-rendered
 * images with a native view transition, and the moment a docs page references the
 * animation chunk this fails. It caught exactly that once, at 38.9 KB, when the MDX
 * components were imported from the module that also imports the client character.
 */
const BUILD = join(APP_ROOT, ".next");
const routeHtml = (route) => readFileSync(join(BUILD, "server", "app", route), "utf8");
const chunkDir = join(BUILD, "static", "chunks");
// `.js` only: the source maps carry the same identifiers and would be found first.
const motionChunk = existsSync(chunkDir)
  ? readdirSync(chunkDir).find(
      (file) =>
        file.endsWith(".js") &&
        readFileSync(join(chunkDir, file), "utf8").includes("visualElement"),
    )
  : undefined;

if (!existsSync(join(BUILD, "server", "app", "index.html")) || !motionChunk) {
  unchecked = true;
  console.log(
    `  skipped build output  no .next to read, so the runtime split, the morph names, and the social card were NOT checked`,
  );
} else {
  const home = routeHtml("index.html");
  const docsIndex = routeHtml("docs.html");
  line(
    !docsIndex.includes(motionChunk),
    "docs runtime-free",
    `the docs index references no part of the ${motionChunk} chunk`,
  );
  for (const plane of PLANES) {
    const html = routeHtml(join("docs", `${plane.slug}.html`));
    line(
      !html.includes(motionChunk),
      "plane runtime-free",
      `/docs/${plane.slug} draws its character with no animation chunk`,
    );
  }
  line(
    home.includes(motionChunk),
    "marketing pays",
    `the homepage does reference it, which is the trade: physics there, none in the docs`,
  );

  const globalCss = readFileSync(join(APP_ROOT, "app", "global.css"), "utf8");
  const names = new Map(
    [
      ...globalCss.matchAll(/\[data-morph="([a-z]+)"\]\s*\{\s*view-transition-name:\s*([a-z-]+);/g),
    ].map((match) => [match[1], match[2]]),
  );
  const occurrences = (html, slug) =>
    (html.match(new RegExp(`data-morph="${slug}"`, "g")) ?? []).length;
  line(
    names.size === PLANES.length,
    "morph names",
    `the stylesheet declares ${names.size} view-transition name(s), one per slug`,
  );
  line(
    PLANES.every((p) => occurrences(docsIndex, p.slug) === 1),
    "index pairing",
    "each slug appears exactly once on the index: two elements sharing a name aborts every transition",
  );
  line(
    PLANES.every((p) => occurrences(routeHtml(join("docs", `${p.slug}.html`)), p.slug) === 1),
    "plane pairing",
    "each plane page carries its own mark exactly once, so the tile and the page resolve to the same name",
  );
  line(
    globalCss.includes("@view-transition"),
    "route transitions",
    "@view-transition is present, so the morph needs no client component",
  );

  const cardPath = join(BUILD, "server", "app", "opengraph-image.body");
  if (existsSync(cardPath)) {
    const card = readFileSync(cardPath);
    const png = card.subarray(0, 8).toString("hex") === "89504e470d0a1a0a";
    const [width, height] = [card.readUInt32BE(16), card.readUInt32BE(20)];
    line(
      png && width === 1200 && height === 630,
      "social card",
      `${png ? "PNG" : "not a PNG"} ${width}x${height}, ${(card.length / 1024).toFixed(1)} KB built`,
    );
  } else {
    unchecked = true;
    console.log(`  skipped social card  the card was not rendered into the build output`);
  }
}

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
    ? `  all checks passed on 4 characters across ${CENSUS.length} placement(s)${unchecked ? ", with the build-output checks SKIPPED because no build was there to read (run `bun run build` first)" : ""}; the artwork and the size are judged by eye at the sheets above\n`
    : `  ${bad} check(s) failed\n`,
);
process.exitCode = bad === 0 ? 0 : 1;
