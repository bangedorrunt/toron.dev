/*
 * Render the mascots for a human to judge, and for the probe to measure.
 *
 * Two audiences, two outputs, one run:
 *
 *   mascots.png        the contact sheet, on the real page background, with the
 *                      external reference beside it. This is what a person
 *                      looks at.
 *   <name>-probe.png   one character per file, on transparency, rendered so its
 *                      silhouette is the same size as the reference's. This is
 *                      what probe-art.mjs measures, and the size match is the
 *                      whole point: crisp/soft is a per-pixel gradient
 *                      statistic, so two drawings measured at different scales
 *                      cannot be compared.
 *
 * The probe page is deliberately bare: no stylesheet, and transparent on both
 * html and body. `omitBackground` only removes the default canvas, so a page
 * that paints its own background comes back as a picture of the background with
 * a character on it, every gradient statistic swamped by the field. The first
 * version of this script shipped that mistake and reported all four characters
 * as 100% coverage at a median luminance of 14.
 *
 * Both moods are pinned rather than animated. The live cross-fade is a slow
 * cycle with per-plane offsets, so a screenshot of the running page catches
 * every cell at a different point in it and the sheet stops answering "does the
 * resting face read".
 *
 * Run: bun scripts/render-mascots.tsx [--ref path.png]
 */

import { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { renderToStaticMarkup } from "react-dom/server";
import { chromium } from "playwright";
import { MASCOTS } from "../components/mascots";

const HERE = dirname(fileURLToPath(import.meta.url));
const APP_ROOT = resolve(HERE, "..");
const REPO_ROOT = resolve(APP_ROOT, "..", "..");
const OUT_DIR = join(APP_ROOT, ".mascot-out");

const refFlag = process.argv.indexOf("--ref");
const REF =
  refFlag === -1 ? join(REPO_ROOT, ".scratch", "ship.png") : resolve(process.argv[refFlag + 1]);

// The reference's silhouette long side, measured once by probe-art.mjs. Ours is
// rendered to the same one so the two land on a single scale.
const PROBE_LONG_SIDE = 1345;
// The reference is third-party art and is not committed, so its absence is
// expected on a fresh clone. The sheet is then just our own characters, which is
// still the artifact a reviewer reads; the probe is unaffected because it never
// touched the reference at all.
const hasRef = existsSync(REF);
const JUDGE = 320; // the size the artwork is worth looking at
const REAL = 56; // the size the stack strip actually draws it at
const MOODS = ["rest", "work"] as const;

// `Object.keys` widens to string[] while the record is keyed by the four plane
// slugs. Narrowed with a predicate rather than a cast, so a rename that misses
// one of them fails here instead of at the first property access.
const names = Object.keys(MASCOTS).filter((n): n is keyof typeof MASCOTS => n in MASCOTS);
const markup = Object.fromEntries(
  names.map((n) => [n, renderToStaticMarkup(MASCOTS[n]({ className: "m" }))]),
);

// Both mood groups are in every sheet, so both sheets have to say which one is
// up. Without this they stack and the "resting face" is really both faces.
const PIN = `
  svg [data-mood] { animation: none !important; }
  .pin-rest [data-mood="rest"] { opacity: 1 !important; }
  .pin-rest [data-mood="work"] { opacity: 0 !important; }
  .pin-work [data-mood="work"] { opacity: 1 !important; }
  .pin-work [data-mood="rest"] { opacity: 0 !important; }
`;

const cell = (name: string, mood: (typeof MOODS)[number], size: number) =>
  `<div class="cell pin-${mood}" style="width:${size}px;height:${size}px">${markup[name]}</div>`;

/*
 * `app/global.css` opens with four bare `@import`s (tailwind, fumadocs, the
 * token package) and a bare specifier cannot resolve over `file://`. So the
 * token stylesheet is linked directly as well, ahead of it: without the
 * `--toron-*` variables every rule that reads one is dropped as invalid at
 * computed-value time, which is silent. The cross-fade was the casualty, and
 * the render skipped the tokens for three runs before anything noticed.
 */
const TOKENS = `<link rel="stylesheet" href="../../packages/tokens/theme.css">`;

const sheet = `<!doctype html><html><head><meta charset="utf-8">
${TOKENS}
<link rel="stylesheet" href="./app/global.css"><style>
  html, body { background:#08090a; }
  body { margin:0; font:12px/1.5 ui-monospace,monospace; color:#f7f8f8; padding:28px 32px 40px; }
  h1 { font:600 12px/1.4 ui-monospace,monospace; color:#8a8f98; margin:0 0 20px; letter-spacing:.06em; text-transform:uppercase; }
  h1 b { color:#f7f8f8; }
  .row { display:flex; align-items:flex-end; gap:26px; }
  .col { display:flex; flex-direction:column; gap:9px; align-items:center; }
  .pair { display:flex; gap:14px; align-items:flex-end; }
  .cell { display:flex; align-items:center; justify-content:center; }
  .cell svg { width:100%; height:100%; display:block; }
  .lab { color:#8a8f98; font-size:11px; }
  .ref { border:1px solid #23252a; border-radius:10px; overflow:hidden; }
  .ref img { display:block; height:400px; }
  .ref--missing { width:320px; height:400px; display:flex; align-items:center; justify-content:center; text-align:center; color:#4b5058; line-height:1.6; }
  .gap { height:30px; }
  ${PIN}
</style></head><body>
<h1>characters · <b>left = rest, right = work</b> · top row at ${JUDGE}px, bottom row at the ${REAL}px the strip draws</h1>
<div class="row">
  ${
    hasRef
      ? `<div class="col"><div class="ref"><img src="file://${REF}" alt="reference"></div><span class="lab">reference · ${REF.split("/").pop()}</span></div>`
      : `<div class="col"><div class="ref ref--missing">no reference at<br>${REF}</div><span class="lab">run with --ref to compare</span></div>`
  }
  ${names
    .map(
      (n) => `<div class="col">
    <div class="pair">${cell(n, "rest", JUDGE)}${cell(n, "work", JUDGE)}</div>
    <span class="lab">${n}</span>
  </div>`,
    )
    .join("")}
</div>
<div class="gap"></div>
<div class="row">
  ${names.map((n) => `<div class="col">${cell(n, "rest", REAL)}</div>`).join("")}
</div>
</body></html>`;

/*
 * A strip cell, built from the site's real markup and stylesheet, because the
 * cross-fade selectors are scoped to these class names.
 *
 * This page deliberately does NOT carry the pinning CSS the other two use. It
 * exists to test the cycle and the reduced-motion fallback, and a pin would
 * disable the very animation under test while making the reduced-motion case
 * pass for the wrong reason.
 */
const strip = `<!doctype html><html><head><meta charset="utf-8">
${TOKENS}
<link rel="stylesheet" href="./app/global.css"></head><body>
<div class="toron-stack-strip">${names
  .map(
    (n) =>
      `<a class="toron-stack-strip__item" href="#">${markup[n].replace("<svg ", '<svg class="toron-mascot toron-stack-strip__mascot" ')}</a>`,
  )
  .join("")}</div>
</body></html>`;

const probe = `<!doctype html><html><head><meta charset="utf-8"><style>
  html, body { background:transparent; margin:0; padding:0; }
  .probe { width:${PROBE_LONG_SIDE}px; height:${PROBE_LONG_SIDE}px; }
  .probe svg { width:100%; height:100%; display:block; }
  ${PIN}
</style></head><body>
${names.map((n) => `<div class="probe pin-rest" data-name="${n}">${markup[n]}</div>`).join("")}
</body></html>`;

/*
 * The scratch pages live in the app root, not in the output directory, because
 * they link `./app/global.css`: a relative path resolves against the page, so
 * the one directory that works is the app root. Writing them into the output
 * directory instead renders four pictures with no stylesheet behind them, and
 * the first version of this script did exactly that while its "did the
 * stylesheet load" check passed off an inline rule of its own.
 */
mkdirSync(OUT_DIR, { recursive: true });
const sheetFile = join(APP_ROOT, ".mascot-sheet.html");
const probeFile = join(APP_ROOT, ".mascot-probe.html");
const stripFile = join(APP_ROOT, ".mascot-strip.html");
writeFileSync(sheetFile, sheet);
writeFileSync(probeFile, probe);
writeFileSync(stripFile, strip);

const browser = await chromium.launch();

// The sheet links the site's real stylesheet, so a scratch page that failed to
// load it would render four pictures that are not the pictures that ship. Read
// the load back off a real element rather than assuming it.
const sheetPage = await browser.newPage({
  deviceScaleFactor: 2,
  viewport: { width: 1920, height: 1200 },
});
await sheetPage.goto(`file://${sheetFile}`);
// Read a token back off the document rather than testing for a rule of our own.
// The two failure modes here are both silent: a stylesheet that did not load at
// all, and one that loaded with its token import unresolved, in which case every
// declaration reading a variable is dropped and the page still looks plausible.
const sheetOk = await sheetPage.evaluate(() => {
  const svg = document.querySelector(".toron-mascot");
  const ease = getComputedStyle(document.documentElement).getPropertyValue("--toron-ease-standard");
  return !!svg && getComputedStyle(svg).containerType !== "normal" && ease.trim().length > 0;
});
if (!sheetOk) {
  console.error(
    "the sheet is not styled like the site: no container-type on the mascot or no --toron-ease-standard, so the detail tier and the cross-fade would both be silently absent",
  );
  await browser.close();
  process.exitCode = 1;
  process.exit();
}
await sheetPage.screenshot({ path: join(APP_ROOT, "mascots.png"), fullPage: true });

/*
 * The detail tier.
 *
 * Two sub-unit marks, the tight gloss and the second catchlight, are tagged
 * `data-detail` and hidden below 8rem by a container query on the svg itself. A
 * container query that fails to match is silent: the characters still render,
 * they just render the large drawing at 56px with every sub-pixel mark turned
 * to dirt. So the tag is read back off the live elements at both sizes.
 */
const tiers = await sheetPage.evaluate(() => {
  const DETAIL = "[data-detail]";
  const visible = (box: Element) =>
    [...box.querySelectorAll(DETAIL)].filter((n) => getComputedStyle(n).display !== "none").length;
  const cells = [...document.querySelectorAll(".cell")];
  const big = cells.find((c) => c.getBoundingClientRect().width > 200);
  const small = cells.find((c) => c.getBoundingClientRect().width < 100);
  return {
    big: big ? visible(big) : -1,
    small: small ? visible(small) : -1,
    shapes: cells.reduce(
      (n, c) =>
        Math.min(
          n,
          c.querySelectorAll(
            "[data-mascot-art] path, [data-mascot-art] circle, [data-mascot-art] ellipse, [data-mascot-art] rect",
          ).length,
        ),
      Number.MAX_SAFE_INTEGER,
    ),
  };
});
await sheetPage.close();

/*
 * Exactly one face.
 *
 * Both moods live in one svg and the cross-fade is scoped to the stack strip. A
 * blanket `animation-duration: 0.01ms` under reduced motion ends each animation
 * at its 100% keyframe, and with no fill mode both groups then revert to their
 * base opacity of 1, which stacks the resting face on the working face: two
 * expressions at once, which is worse than either. Nothing in the markup shows
 * it. It is a cascade interaction between two rules, so it has to be read off a
 * live element in a real browser.
 */
const peace = async (reduced: boolean) => {
  const p = await browser.newPage({
    reducedMotion: reduced ? "reduce" : "no-preference",
    viewport: { width: 400, height: 200 },
  });
  await p.goto(`file://${stripFile}`);
  const seen = await p.evaluate(() =>
    [...document.querySelectorAll(".toron-mascot")].map((svg) => {
      const op = (mood: string) => {
        const n = svg.querySelector(`[data-mood="${mood}"]`);
        return n ? getComputedStyle(n).opacity : null;
      };
      const anim = svg.querySelector('[data-mood="rest"]');
      return {
        rest: op("rest"),
        work: op("work"),
        animating: anim ? getComputedStyle(anim).animationName !== "none" : false,
      };
    }),
  );
  await p.close();
  return seen;
};
const still = await peace(true);
const moving = await peace(false);

// Scale 1, because the target is a pixel count that matches the reference, not a
// retina capture of it.
const probePage = await browser.newPage({
  deviceScaleFactor: 1,
  viewport: { width: 1400, height: 1400 },
});
await probePage.goto(`file://${probeFile}`);
await probePage.evaluate(() => window.scrollTo(0, 0));
// Shoot and measure each character, then report the silhouette actually drawn.
// "I set the width" and "the silhouette came out at the reference's scale" are
// different claims, and the second one is what makes the numbers comparable.
const measured = await Promise.all(
  names.map(async (name) => {
    const el = probePage.locator(`.probe[data-name="${name}"] svg`);
    await el.screenshot({ path: join(OUT_DIR, `${name}-probe.png`), omitBackground: true });
    const size = await probePage.evaluate(
      async (b64: string) => {
        const img = new Image();
        img.src = `data:image/png;base64,${b64}`;
        await img.decode();
        const c = document.createElement("canvas");
        c.width = img.naturalWidth;
        c.height = img.naturalHeight;
        const ctx = c.getContext("2d", { willReadFrequently: true })!;
        ctx.drawImage(img, 0, 0);
        const d = ctx.getImageData(0, 0, c.width, c.height).data;
        let minX = c.width;
        let minY = c.height;
        let maxX = -1;
        let maxY = -1;
        let drawn = 0;
        for (let y = 0; y < c.height; y++) {
          for (let x = 0; x < c.width; x++) {
            if (d[(y * c.width + x) * 4 + 3] > 8) {
              drawn++;
              if (x < minX) minX = x;
              if (y < minY) minY = y;
              if (x > maxX) maxX = x;
              if (y > maxY) maxY = y;
            }
          }
        }
        return {
          long: Math.max(maxX - minX + 1, maxY - minY + 1),
          area: (maxX - minX + 1) * (maxY - minY + 1),
          coverage: +((drawn / (c.width * c.height)) * 100).toFixed(1),
        };
      },
      readFileSync(join(OUT_DIR, `${name}-probe.png`)).toString("base64"),
    );
    return { name, ...size };
  }),
);
const sizes = Object.fromEntries(measured.map((m) => [m.name, m]));

await probePage.close();
await browser.close();
rmSync(sheetFile, { force: true });
rmSync(probeFile, { force: true });
rmSync(stripFile, { force: true });

let bad = 0;
const line = (ok: boolean, label: string, detail: string) => {
  if (!ok) bad++;
  console.log(`  ${(ok ? "ok" : "FAIL").padEnd(5)} ${label.padEnd(15)} ${detail}`);
};

console.log(`sheet    ${join(APP_ROOT, "mascots.png")}`);
if (!hasRef) console.log(`note     no reference at ${REF}; the sheet is our four characters alone`);
console.log(`probes   ${OUT_DIR}, target long side ${PROBE_LONG_SIDE}`);
for (const name of names) {
  const s = sizes[name];
  console.log(
    `  ${name.padEnd(11)} silhouette ${String(s.long).padStart(4)}px   ${s.coverage}% of its box drawn`,
  );
}
console.log("");

// A character whose art group lost its shapes still renders a valid, empty svg.
line(
  tiers.shapes >= 8,
  "drew something",
  `every character carries at least ${tiers.shapes} shapes`,
);

// A set reads as a set only when the characters carry comparable weight. Judged
// on the art's area rather than its width, because a wheel and an envelope are
// different shapes and comparing widths measures the noun, not the drawing.
const areas = names.map((n) => ({ n, a: sizes[n].area })).toSorted((x, y) => x.a - y.a);
const median = areas[Math.floor(areas.length / 2)].a;
const ratio = areas[0].a / median;
line(
  ratio >= 0.55,
  "set weight",
  `smallest is ${areas[0].n} at ${(ratio * 100).toFixed(0)}% of the median area, needs 55%`,
);

line(
  tiers.big > 0 && tiers.small < tiers.big,
  "detail tier",
  `${tiers.big} sub-pixel marks at 320px, ${tiers.small} at 56px`,
);

const stillOk =
  still.length === names.length && still.every((s) => s.rest === "1" && s.work === "0");
const oneFace = still.map((s) => `${s.rest}/${s.work}`).join(" ");
line(stillOk, "one face", `reduced motion reads rest/work as ${oneFace}, needs 1/0`);

const animated = moving.filter((s) => s.animating).length;
line(
  animated === names.length,
  "cycle drawn",
  `${animated} of ${names.length} characters cross-fade when motion is allowed`,
);

console.log(`\n${bad === 0 ? "ok" : `FAIL ${bad} problem(s)`}`);
process.exitCode = bad === 0 ? 0 : 1;
