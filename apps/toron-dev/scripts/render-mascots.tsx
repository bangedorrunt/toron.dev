/*
 * Render the four mascots and report what actually painted.
 *
 * The point is verification, not decoration. A mascot that throws, renders an
 * empty box, or paints outside its viewBox looks fine in the source and broken
 * on the page, and neither `tsc` nor the freshness gate can tell the difference.
 * So this renders the real components through a real DOM, asks the browser what
 * it drew, and fails when the answer is not four non-empty pictures inside their
 * tiles.
 *
 * It is a .tsx run by bun, not a .mjs run by node, because it imports a
 * component. bun resolves the TSX and the JSX here directly (ADR-0008 made it the
 * toolchain); node would need a loader for both.
 *
 * Run: bun scripts/render-mascots.tsx [--out path.png]
 */

import { mkdirSync, rmSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { renderToStaticMarkup } from "react-dom/server";
import { chromium } from "playwright";
import { MASCOTS } from "../components/mascots";

const HERE = dirname(fileURLToPath(import.meta.url));
const APP_ROOT = resolve(HERE, "..");
const outFlag = process.argv.indexOf("--out");
const OUT = outFlag === -1 ? join(APP_ROOT, "mascots.png") : process.argv[outFlag + 1];

// The two sizes the site actually uses them at, so a stroke weight that reads
// at 320px but disappears at 56px is caught here rather than in review.
const SIZES = [320, 56];
const TILE = 96; // the mascots' own viewBox

const figures = Object.entries(MASCOTS)
  .map(([name, Mascot]) => {
    const cells = SIZES.map(
      (s) =>
        `<div class="cell" style="width:${s}px;height:${s}px">${renderToStaticMarkup(<Mascot className="m" />)}</div>`,
    ).join("");
    return `<figure>${cells}<figcaption>${name}</figcaption></figure>`;
  })
  .join("");

const html = `<!doctype html><html><head><meta charset="utf-8"><style>
  body { margin:0; background:#08090a; font:13px/1.4 ui-monospace,monospace; color:#f7f8f8; padding:24px; }
  .row { display:flex; flex-wrap:wrap; gap:28px; align-items:flex-start; }
  figure { margin:0; display:flex; flex-direction:column; gap:10px; align-items:flex-start; }
  figcaption { color:#8a8f98; }
  .cell { display:flex; align-items:center; justify-content:center; }
  svg { width:100%; height:100%; display:block; }
</style></head><body><div class="row">${figures}</div></body></html>`;

const scratch = join(APP_ROOT, ".mascot-preview.html");
writeFileSync(scratch, html);

mkdirSync(dirname(OUT), { recursive: true });

const browser = await chromium.launch();
const page = await browser.newPage({
  deviceScaleFactor: 2,
  viewport: { width: 1500, height: 560 },
});
await page.goto(`file://${scratch}`);

// Ask the browser what it painted. An SVG that failed to draw, and a mascot
// whose paint escaped its tile, both surface here and nowhere else.
type MascotReport = {
  name: string;
  shapes: number;
  x: number;
  y: number;
  w: number;
  h: number;
  escaped: boolean;
};

const report = (await page.evaluate((tile) => {
  // These run inside the page, so the DOM types available here are the ones the
  // browser has. Querying by tag returns Element, which has neither getBBox nor
  // getScreenCTM, so the two nodes that need SVG geometry are narrowed to
  // SVGSVGElement and SVGGElement rather than cast past the check.
  const svgOf = (fig: Element) => fig.querySelector("svg") as SVGSVGElement | null;
  const artOf = (fig: Element) => fig.querySelector("[data-mascot-art]") as SVGGElement | null;

  return [...document.querySelectorAll("figure")].map((fig): MascotReport => {
    const svg = svgOf(fig);
    const art = artOf(fig);
    const name = fig.querySelector("figcaption")?.textContent ?? "";
    const shapes = art?.querySelectorAll("path,circle,ellipse,rect").length ?? 0;
    if (!svg || !art) {
      return { name, shapes, x: 0, y: 0, w: 0, h: 0, escaped: false };
    }
    // Measure the character group, not the svg: the tile rect fills the whole
    // viewBox, so measuring the root would report every mascot as a clean
    // full-bleed fit and hide any character that actually overflows.
    const box = art.getBBox();
    // getBBox is in the group's OWN space, so it silently ignores the scale
    // that sets the optical size. Map the four corners through the group's
    // transform relative to the svg root, or the size check measures nothing.
    const root = svg.getScreenCTM();
    const artM = art.getScreenCTM();
    if (!root || !artM) {
      return { name, shapes, x: 0, y: 0, w: 0, h: 0, escaped: false };
    }
    const toRoot = root.inverse().multiply(artM);
    const corners = [
      [box.x, box.y],
      [box.x + box.width, box.y],
      [box.x, box.y + box.height],
      [box.x + box.width, box.y + box.height],
    ].map(([x, y]) => {
      const p = svg.createSVGPoint();
      p.x = x;
      p.y = y;
      return p.matrixTransform(toRoot);
    });
    const xs = corners.map((p) => p.x);
    const ys = corners.map((p) => p.y);
    const x = Math.min(...xs);
    const y = Math.min(...ys);
    const w = Math.max(...xs) - x;
    const h = Math.max(...ys) - y;
    return {
      name,
      shapes,
      x: +x.toFixed(1),
      y: +y.toFixed(1),
      w: +w.toFixed(1),
      h: +h.toFixed(1),
      escaped: x < 0 || y < 0 || x + w > tile || y + h > tile,
    };
  });
}, TILE)) as MascotReport[];

await page.screenshot({ path: OUT });
await browser.close();

// The scratch file must not survive: it sits in the app root, where a stale copy
// would be picked up by the freshness gate's source scans.
rmSync(scratch, { force: true });

let bad = 0;
console.log(`mascot render report (viewBox ${TILE}, rendered at ${SIZES.join(" and ")}px)`);
for (const r of report) {
  const empty = r.shapes < 5;
  const flag = r.escaped ? "ESCAPES ITS TILE" : empty ? "DREW NOTHING" : "ok";
  if (r.escaped || empty) bad++;
  console.log(
    `  ${flag.padEnd(17)} ${r.name.padEnd(12)} shapes=${String(r.shapes).padStart(3)}  art=${r.w}x${r.h} at ${r.x},${r.y}`,
  );
}

// A set reads as a set only if the characters carry comparable weight. Judged on
// enclosed area rather than width, because a wheel and an envelope are
// different shapes and comparing their widths measures the noun, not the art.
const areas = report
  .map((r) => ({ name: r.name, area: r.w * r.h }))
  .sort((a, b) => a.area - b.area);
const median = areas[Math.floor(areas.length / 2)]?.area ?? 0;
if (median > 0) {
  const smallest = areas[0];
  const ratio = smallest.area / median;
  // 55% is where a character stops reading as the same weight as its neighbours.
  if (ratio < 0.55) {
    console.log(
      `  ${"TOO SMALL FOR THE SET".padEnd(17)} ${smallest.name.padEnd(12)} area is ${(ratio * 100).toFixed(0)}% of the median (${median.toFixed(0)}), needs 55%`,
    );
    bad++;
  } else {
    console.log(
      `  ${"ok".padEnd(17)} set weight       smallest is ${smallest.name} at ${(ratio * 100).toFixed(0)}% of the median area`,
    );
  }
}

console.log(`\n${bad === 0 ? "ok" : `FAIL ${bad} problem(s)`} — sheet at ${OUT}`);

process.exitCode = bad === 0 ? 0 : 1;
