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
 * Past the art, three families of checks that are not about the drawing at all:
 *
 *   depth    the five scroll- and view-timeline rules, read as computed styles off
 *            the real stylesheet, and read again in a reduced-motion browser where
 *            every one of them has to come back `none`
 *   build    read from `.next`: the runtime split (the docs must not reference the
 *            animation chunk), the morph names (one per slug per page, declared once
 *            in the stylesheet), and the social card
 *   live     read from a running `next start`: the icon links the head emits and the
 *            files behind them, the morph on a real click, and the particle canvas
 *            drawing while it is on screen and stopped once it is not
 *
 * The last two print `skipped` and say why when there is no build, or no server, to
 * read, so a run without them is visibly incomplete instead of quietly green.
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
<div class="gap"></div>
<h1>depth · <b>the field, the grid, and the band that answer the scroll</b></h1>
<div class="toron-bg" id="depth"><div class="toron-bg__field"></div><div class="toron-bg__grid"></div></div>
<div id="cta-depth">
  <div class="toron-cta">
    <canvas class="toron-cta__particles"></canvas>
    <div><h2>The band, with the canvas the app puts in it</h2><p>Depth is the one effect the sheet can hold still.</p></div>
  </div>
</div>
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

/* ------------------------------------------------------------------ depth */

/*
 * The depth effects are not a component: the two background layers ride a scroll
 * timeline and the two blooms ride their own visibility. All four are pure CSS, and
 * the failure they have is silent — a misspelled keyframe name leaves the rule in
 * place and the page still — so they are read as computed styles off the real
 * stylesheet rather than trusted to the source text.
 *
 * `@supports` is why the expectation is a pair of alternatives rather than a
 * constant: in a browser without scroll timelines the declarations are dropped and
 * the names read `none`, which is the intended behaviour and not a failure. The gap
 * between `none` and the name is what is being checked; which side of it this
 * browser lands on is reported.
 *
 * The canvas rule is checked here too, and the interesting half is its position in
 * the cascade: `.toron-cta > *` sets `position: relative` on every child of the band,
 * so the rule that puts the canvas behind the copy only wins because it is written
 * after it. Computed `absolute` is that order holding.
 */
const depth = await one.evaluate(() => {
  const anim = (el, pseudo) => {
    const style = getComputedStyle(el, pseudo);
    return { name: style.animationName, timeline: style.animationTimeline };
  };
  const particles = getComputedStyle(document.querySelector("#cta-depth .toron-cta__particles"));
  return {
    scrollTimeline: CSS.supports("animation-timeline: scroll()"),
    viewTimeline: CSS.supports("animation-timeline: view()"),
    field: anim(document.querySelector("#depth .toron-bg__field")),
    grid: anim(document.querySelector("#depth .toron-bg__grid")),
    bloom: anim(document.querySelector("#cta-depth .toron-cta"), "::before"),
    particles: {
      position: particles.position,
      zIndex: particles.zIndex,
      pointerEvents: particles.pointerEvents,
    },
  };
});
line(
  !depth.scrollTimeline ||
    (depth.field.name === "toron-depth-field" && depth.grid.name === "toron-depth-grid"),
  "scroll depth",
  depth.scrollTimeline
    ? `the field runs ${depth.field.name} and the grid ${depth.grid.name} on ${depth.field.timeline}`
    : "no scroll timeline in this browser, so the @supports block drops and the page is still",
);
line(
  !depth.viewTimeline || depth.bloom.name === "toron-depth-bloom",
  "view depth",
  depth.viewTimeline
    ? `the band's bloom runs ${depth.bloom.name} on ${depth.bloom.timeline}`
    : "no view timeline in this browser, so the blooms drop and the page is still",
);
line(
  depth.particles.position === "absolute" && depth.particles.zIndex === "0",
  "canvas behind copy",
  `the particle canvas computes ${depth.particles.position} z-${depth.particles.zIndex} with pointer-events ${depth.particles.pointerEvents}, so it sits under the band's copy and takes no clicks`,
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
  field: getComputedStyle(document.querySelector("#depth .toron-bg__field")).animationName,
  grid: getComputedStyle(document.querySelector("#depth .toron-bg__grid")).animationName,
  bloom: getComputedStyle(document.querySelector("#cta-depth .toron-cta"), "::before")
    .animationName,
}));
await calmPage.close();
line(
  arrival.name === "toron-mark-arrive",
  "mark arrival",
  `the plane mark runs ${arrival.name} over ${arrival.duration}`,
);
const quietDepth = [calm.field, calm.grid, calm.bloom].every((name) => name === "none");
line(
  calm.arrival === "none" && Number.parseFloat(calm.strip) < 0.05 && quietDepth,
  "reduced motion",
  `with reduce: arrival ${calm.arrival}, strip hover transition ${calm.strip}, depth ${[calm.field, calm.grid, calm.bloom].join("/")} (the pointer physics are gated in the component)`,
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

/* --------------------------------------------------------------- live site */

/*
 * The three things a `file://` sheet cannot show, because they need the app running:
 * the head's icon links and the files behind them, the morph on a real click, and the
 * particle canvas drawing in a real browser tab.
 *
 * They need the built app on a server. With nothing answering they print `skipped`,
 * in the same voice as the build-output checks, so a run without a server is visibly
 * incomplete rather than quietly green.
 */
const ORIGIN = process.env.TORON_STRIP_ORIGIN ?? "http://127.0.0.1:3111";
const serving = await fetch(ORIGIN, { signal: AbortSignal.timeout(2000) })
  .then((response) => response.ok)
  .catch(() => false);

if (!serving) {
  unchecked = true;
  console.log(
    `  skipped live site  nothing answered at ${ORIGIN}, so the icon links, the click-path morph, and the canvas gates were NOT checked (start one with \`bunx next start -p 3111\`)`,
  );
} else {
  /*
   * The icon set, as the browser sees it: what the head links, and what those links
   * actually load. Both halves matter and only one of them is visible in the source —
   * the apple touch icon was building and being served for as long as the layout
   * declared an `icons` field, because Next merges a segment's convention icons only
   * when that field is absent.
   */
  const iconPage = await browser.newPage();
  await iconPage.goto(`${ORIGIN}/`, { waitUntil: "domcontentloaded" });
  const icons = await iconPage.evaluate(async () => {
    const href = (rel, match) =>
      [...document.querySelectorAll(`link[rel="${rel}"]`)]
        .map((link) => link.getAttribute("href"))
        .find((value) => value && (!match || value.includes(match))) ?? null;
    const load = (src) =>
      new Promise((resolve) => {
        const image = new Image();
        image.addEventListener("load", () => resolve([image.naturalWidth, image.naturalHeight]), {
          once: true,
        });
        image.addEventListener("error", () => resolve(null), { once: true });
        image.src = src;
      });
    const manifestHref = document.querySelector('link[rel="manifest"]')?.getAttribute("href");
    const manifest = manifestHref ? await (await fetch(manifestHref)).json() : null;
    const svg = href("icon", ".svg");
    const ico = href("icon", ".ico");
    const apple = href("apple-touch-icon");
    return {
      svg,
      ico,
      apple,
      manifest,
      sizes: {
        svg: svg ? await load(svg) : null,
        ico: ico ? await load(ico) : null,
        apple: apple ? await load(apple) : null,
        png: manifest ? await Promise.all(manifest.icons.map((icon) => load(icon.src))) : [],
      },
    };
  });
  await iconPage.close();

  const sized = (box, [w, h]) => Boolean(box) && box[0] === w && box[1] === h;
  const frameNote = (count) =>
    count > 0
      ? `${count} frame(s) over 500ms after the transition, so the page is ticking again`
      : "no frames over 500ms after the transition: the page's rendering stayed held, which freezes every rAF animation on it";
  // An svg with a viewBox and no width/height has no intrinsic size: Chrome
  // decodes it at its 150x150 default, whatever the drawing scales to. So the
  // assertion is that it loads and is square, not that it is any particular size.
  const square = (box) => Boolean(box) && box[0] === box[1];
  line(
    Boolean(icons.svg) && Boolean(icons.ico),
    "favicon links",
    `the head links ${icons.svg ?? "no svg"} and ${icons.ico ?? "no ico"}`,
  );
  line(
    square(icons.sizes.svg) && sized(icons.sizes.ico, [256, 256]),
    "favicon files",
    `the svg loads square at ${icons.sizes.svg?.join("x")} (a viewBox and no width, so the decoded box is the browser's default) and the ico at its largest entry, ${icons.sizes.ico?.join("x")}`,
  );
  line(
    sized(icons.sizes.apple, [180, 180]),
    "apple touch icon",
    icons.apple
      ? `the head links ${icons.apple}, served at ${icons.sizes.apple?.join("x")}`
      : "no apple-touch-icon in the head: iOS falls back to a screenshot of the page",
  );
  line(
    icons.manifest?.theme_color === "#08090a" &&
      icons.manifest?.background_color === "#08090a" &&
      icons.sizes.png.length === 2 &&
      sized(icons.sizes.png[0], [192, 192]) &&
      sized(icons.sizes.png[1], [512, 512]),
    "manifest",
    icons.manifest
      ? `${icons.manifest.name} · theme ${icons.manifest.theme_color} · icons ${icons.sizes.png.map((box) => box?.join("x")).join(" and ")}`
      : "no manifest link in the head, so a phone installs the page as a shortcut with no icon",
  );

  /*
   * The morph on the click path, which is the claim ADR-0009 D5 recorded as
   * unproven for an in-app navigation. The page patches `document.startViewTransition`
   * before hydration, so what is counted is the app's own call and not a transition
   * the browser started for some other reason.
   *
   * Three things are read off it, and all three have been wrong at some point:
   *
   *   ready/finished settled  a transition whose callback never settles sits pending
   *                           forever, and while it does, rendering is held: the page
   *                           stops painting and every rAF animation on it freezes.
   *                           Counting the call alone would have called that a pass.
   *   group animations        the animations are transient, so they are sampled on a
   *                           timer for the duration. Frames will not do: rAF is
   *                           paused while a transition is pending.
   *   frames afterwards       the freeze is the failure mode that outlives the click,
   *                           so the page has to be ticking again once it is over.
   */
  const docs = await browser.newPage();
  await docs.addInitScript(() => {
    const original = document.startViewTransition?.bind(document);
    if (!original) return;
    window.morphProbe = { calls: [], ready: "none", finished: "none", groups: [] };
    document.startViewTransition = (callback) => {
      window.morphProbe.calls.push(location.pathname);
      const transition = original(callback);
      transition.ready.then(
        () => {
          window.morphProbe.ready = "settled";
        },
        (error) => {
          window.morphProbe.ready = `rejected: ${error.message}`;
        },
      );
      transition.finished.then(
        () => {
          window.morphProbe.finished = "settled";
        },
        (error) => {
          window.morphProbe.finished = `rejected: ${error.message}`;
        },
      );
      const sample = setInterval(() => {
        for (const animation of document.getAnimations()) {
          const pseudo = String(animation.effect?.pseudoElement ?? "");
          if (
            pseudo.startsWith("::view-transition") &&
            !window.morphProbe.groups.includes(pseudo)
          ) {
            window.morphProbe.groups.push(pseudo);
          }
        }
      }, 20);
      setTimeout(() => clearInterval(sample), 4000);
      return transition;
    };
  });
  await docs.goto(`${ORIGIN}/docs`, { waitUntil: "networkidle" });
  const tile = docs.locator(".toron-plane-row__item").first();
  const target = await tile.getAttribute("href");
  await tile.hover();
  await docs.waitForTimeout(150); // the enhancer's prefetch, as a reader's pause would give it
  await tile.click();
  await docs
    .waitForFunction(() => window.morphProbe?.finished !== "none", null, {
      timeout: 5000,
      // The same reason as the sampling above, one level up: a frame-polled wait
      // does not advance while the transition it is waiting for is pending.
      polling: 50,
    })
    .catch(() => {});
  await docs
    .waitForURL((url) => url.pathname !== "/docs", { timeout: 4000, polling: 50 })
    .catch(() => {});
  const landed = await docs.evaluate(async () => {
    // Frames over half a second, as the proof that the transition did not leave
    // the page frozen behind it.
    const frames = await new Promise((resolve) => {
      let ticks = 0;
      const tick = () => {
        ticks++;
        requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
      setTimeout(() => resolve(ticks), 500);
    });
    return {
      calls: window.morphProbe?.calls ?? [],
      ready: window.morphProbe?.ready ?? "none",
      finished: window.morphProbe?.finished ?? "none",
      groups: window.morphProbe?.groups ?? [],
      frames,
      path: location.pathname,
    };
  });
  await docs.close();
  const slug = target?.replace("/docs/", "") ?? "";
  const named = landed.groups.filter((pseudo) => pseudo.includes(`(${slug}`));
  line(
    landed.calls.length === 1 && landed.path === target,
    "morph on click",
    `one startViewTransition on ${landed.calls.join("/") || "nothing"}, landed on ${landed.path} (the tile points at ${target})`,
  );
  line(
    landed.ready === "settled" && landed.finished === "settled" && landed.groups.length > 0,
    "morph plays",
    landed.groups.length > 0
      ? `ready and finished both settled, with ${landed.groups.length} transition animation(s) sampled, ${named.length ? named.join(", ") : "none named for the character"}`
      : `ready ${landed.ready}, finished ${landed.finished}, and no view-transition animation was ever sampled: the click pushed the route without morphing anything`,
  );
  line(landed.frames > 0, "page still ticks", frameNote(landed.frames));

  /*
   * The canvas, in a real tab: it has to draw while the band is on screen, and it has
   * to have stopped once the band is not. The stopped half is the one an eager
   * implementation fails, and it is checkable exactly — a cancelled frame loop leaves
   * the last frame on the canvas, so two readings taken away from the band have to
   * agree exactly. The running half cannot be that strict (a frame is a moment, not a
   * value), so it asks for a changed reading and reports the totals it saw.
   */
  const homePage = await browser.newPage({ viewport: { width: 1280, height: 800 } });
  await homePage.goto(`${ORIGIN}/`, { waitUntil: "networkidle" });
  const field = await homePage.evaluate(async () => {
    const canvas = document.querySelector(".toron-cta__particles");
    if (!canvas) return null;
    const context = canvas.getContext("2d");
    const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
    // The painted count says the field is there; the alpha total says whether the
    // frame changed. Summing every alpha is the cheap reading of the whole buffer:
    // sub-pixel motion moves it through anti-aliasing alone, so a still frame and a
    // running one cannot look the same.
    const ink = () => {
      const { data } = context.getImageData(0, 0, canvas.width, canvas.height);
      let painted = 0;
      let sum = 0;
      for (let i = 3; i < data.length; i += 4) {
        sum += data[i];
        if (data[i] > 0) painted++;
      }
      return { painted, sum };
    };
    canvas.scrollIntoView({ block: "center" });
    await wait(700); // a beat for the observer to arrive and the field to fill
    const onScreen = ink();
    await wait(400);
    const later = ink();
    window.scrollTo(0, 0);
    await wait(800); // out of view, and past the 140px margin the observer starts on
    const away = ink();
    await wait(400);
    const awayLater = ink();
    return {
      box: [canvas.width, canvas.height],
      dpr: window.devicePixelRatio,
      onScreen,
      later,
      away,
      awayLater,
      base: canvas.width === 300 && canvas.height === 150,
    };
  });
  const still = await browser.newPage({
    reducedMotion: "reduce",
    viewport: { width: 1280, height: 800 },
  });
  await still.goto(`${ORIGIN}/`, { waitUntil: "networkidle" });
  const quiet = await still.evaluate(async () => {
    const canvas = document.querySelector(".toron-cta__particles");
    if (!canvas) return null;
    canvas.scrollIntoView({ block: "center" });
    await new Promise((resolve) => setTimeout(resolve, 700));
    const { data } = canvas.getContext("2d").getImageData(0, 0, canvas.width, canvas.height);
    let painted = 0;
    for (let i = 3; i < data.length; i += 4) if (data[i] > 0) painted++;
    return { painted, box: [canvas.width, canvas.height] };
  });
  await Promise.all([homePage.close(), still.close()]);

  const drew = field ? Math.max(field.onScreen.painted, field.later.painted) : 0;
  line(
    Boolean(field) && drew > 0 && !field.onScreen.base,
    "canvas draws",
    field
      ? `${drew} painted pixel(s) in a ${field.box.join("x")} canvas on screen at dpr ${field.dpr}, so it is the field and not an untouched 300x150 element`
      : "no .toron-cta__particles canvas on the home page",
  );
  line(
    Boolean(field) && field.onScreen.sum !== field.later.sum,
    "canvas animates",
    field
      ? `the frame changed between two readings 400ms apart while on screen (${field.onScreen.painted} painted pixels, alpha total ${field.onScreen.sum} → ${field.later.sum})`
      : "nothing to animate",
  );
  line(
    Boolean(field) && field.away.sum === field.awayLater.sum,
    "canvas stops",
    field
      ? `scrolled away it held still: two readings 400ms apart are byte-identical, alpha total ${field.away.sum}, with the last frame's ${field.away.painted} painted pixel(s) left on the canvas`
      : "nothing to stop",
  );
  line(
    Boolean(quiet) && quiet.painted === 0,
    "canvas honours reduce",
    quiet
      ? `under reduce the canvas is never sized or drawn: ${quiet.painted} painted pixel(s) in a ${quiet.box.join("x")} canvas`
      : "no canvas to check",
  );
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
    ? `  all checks passed on 4 characters across ${CENSUS.length} placement(s)${unchecked ? ", with the build-output and/or live-site checks SKIPPED (see the skipped lines above; `bun run build` and `bunx next start -p 3111` cover them)" : ""}; the artwork and the size are judged by eye at the sheets above\n`
    : `  ${bad} check(s) failed\n`,
);
process.exitCode = bad === 0 ? 0 : 1;
