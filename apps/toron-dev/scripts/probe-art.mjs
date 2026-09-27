/*
 * Probe an illustration and report the handful of numbers that actually
 * separate one visual language from another.
 *
 * Why this exists: render-mascots.tsx asserts thresholds that were invented
 * from theory ("paint has modulation", "a tile more than a third flat is
 * cheap"). None of them were ever calibrated against the reference the mascots
 * are supposed to resemble, so a run can be fully green while the art looks
 * nothing like the target. This probe reports the same facts about any image, so
 * the reference and our own art can be put in one table and compared.
 *
 * The two numbers that do the discriminating work:
 *
 *   crisp  share of pixels whose luminance gradient exceeds 40/255. Confident
 *          flat illustration puts real edges down: shape boundaries, folds,
 *          cast shadows. Airbrushed art has almost none, because every
 *          transition is a ramp.
 *   soft   share of pixels in the 1..8 band: present but barely. This is the
 *          airbrush signature. Gradients across every surface, plus any blur or
 *          grain filter, push this number up.
 *
 * A crisp drawing has crisp > soft. A sprayed one has soft > crisp, usually by
 * a lot. That single comparison is the style question, answered from pixels.
 *
 * Run: node scripts/probe-art.mjs <image> [more images...]
 */

import { readFileSync } from "node:fs";
import { extname, resolve } from "node:path";
import { chromium } from "playwright";

const files = process.argv.slice(2);
if (files.length === 0) {
  console.error("usage: node scripts/probe-art.mjs <image> [more images...]");
  process.exit(2);
}

const payload = files.map((f) => {
  const abs = resolve(f);
  const ext = extname(abs).toLowerCase();
  const mime =
    ext === ".svg"
      ? "image/svg+xml"
      : ext === ".jpg" || ext === ".jpeg"
        ? "image/jpeg"
        : "image/png";
  return {
    label: f,
    url: `data:${mime};base64,${readFileSync(abs).toString("base64")}`,
  };
});

const browser = await chromium.launch();
const page = await browser.newPage();
const results = await page.evaluate(async (items) => {
  // Decode every image up front so the loop below is pure arithmetic over
  // pixels and carries no await inside it.
  const rasters = await Promise.all(
    items.map(async (item) => {
      const img = new Image();
      img.src = item.url;
      await img.decode();
      const c = document.createElement("canvas");
      c.width = img.naturalWidth;
      c.height = img.naturalHeight;
      const ctx = c.getContext("2d", { willReadFrequently: true });
      ctx.drawImage(img, 0, 0);
      return {
        w: c.width,
        h: c.height,
        data: ctx.getImageData(0, 0, c.width, c.height).data,
      };
    }),
  );

  const out = [];
  for (const [index, item] of items.entries()) {
    const { w, h, data } = rasters[index];
    const idx = (x, y) => (y * w + x) * 4;
    const lum = (i) => 0.2126 * data[i] + 0.7152 * data[i + 1] + 0.0722 * data[i + 2];

    // Silhouette: anything not fully transparent. Art with no alpha channel is
    // measured edge to edge, which is the honest reading of a flat-background
    // export.
    let minX = w;
    let minY = h;
    let maxX = -1;
    let maxY = -1;
    let opaque = 0;
    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        if (data[idx(x, y) + 3] > 8) {
          opaque++;
          if (x < minX) minX = x;
          if (y < minY) minY = y;
          if (x > maxX) maxX = x;
          if (y > maxY) maxY = y;
        }
      }
    }
    const box = { x: minX, y: minY, w: maxX - minX + 1, h: maxY - minY + 1 };

    // Palette and gradient statistics, inside the silhouette only. Counting the
    // transparent field would dilute everything by the share of empty canvas.
    const tones = new Map();
    const hueBins = Array.from({ length: 12 }, () => 0);
    let crisp = 0;
    let soft = 0;
    let flat = 0;
    let considered = 0;
    const lums = [];

    // Only near-opaque pixels count. A soft-edged drawing carries a skirt of
    // half-transparent pixels along every boundary, and those pixels are not
    // paint: their stored colour is whatever survived antialiasing. Including
    // them dragged the darkest percentile of one character down to 6/255 when
    // nothing in the artwork is below 39. `thin` reports the share dropped so
    // the trim cannot quietly become a way to hide a soft drawing.
    let thin = 0;
    for (let y = box.y + 1; y < box.y + box.h - 1; y++) {
      for (let x = box.x + 1; x < box.x + box.w - 1; x++) {
        const i = idx(x, y);
        if (data[i + 3] <= 8) continue;
        if (data[i + 3] < 160) {
          thin++;
          continue;
        }
        considered++;
        const L = lum(i);
        lums.push(L);

        const r = data[i];
        const g = data[i + 1];
        const b = data[i + 2];
        const key = ((r >> 3) << 10) | ((g >> 3) << 5) | (b >> 3);
        tones.set(key, (tones.get(key) ?? 0) + 1);

        const mx = Math.max(r, g, b);
        const mn = Math.min(r, g, b);
        const sat = mx === 0 ? 0 : (mx - mn) / mx;
        if (sat > 0.12) {
          let hue;
          if (mx === r) hue = ((g - b) / (mx - mn)) % 6;
          else if (mx === g) hue = (b - r) / (mx - mn) + 2;
          else hue = (r - g) / (mx - mn) + 4;
          hue = (((hue * 60) % 360) + 360) % 360;
          hueBins[Math.floor(hue / 30)]++;
        }

        // Central difference on luminance, skipping transparent neighbours so a
        // silhouette boundary does not get counted as a drawn edge.
        const l = idx(x - 1, y);
        const rr = idx(x + 1, y);
        const u = idx(x, y - 1);
        const d = idx(x, y + 1);
        if (data[l + 3] <= 8 || data[rr + 3] <= 8 || data[u + 3] <= 8 || data[d + 3] <= 8) continue;
        const gx = lum(rr) - lum(l);
        const gy = lum(d) - lum(u);
        const G = Math.hypot(gx, gy) * 0.5;
        if (G > 40) crisp++;
        else if (G > 1 && G < 8) soft++;
        if (G < 1.5) flat++;
      }
    }

    const pct = (n) => +((n / Math.max(considered, 1)) * 100).toFixed(1);
    lums.sort((a, b) => a - b);
    const at = (p) => +lums[Math.min(lums.length - 1, Math.floor(lums.length * p))].toFixed(1);

    const top = [...tones.entries()]
      .toSorted((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([k, n]) => ({
        hex:
          "#" +
          [((k >> 10) & 31) << 3, ((k >> 5) & 31) << 3, (k & 31) << 3]
            .map((v) => v.toString(16).padStart(2, "0"))
            .join(""),
        share: +((n / Math.max(considered, 1)) * 100).toFixed(1),
      }));

    const hueTotal = hueBins.reduce((a, b) => a + b, 0);

    out.push({
      label: item.label,
      w,
      h,
      silhouette: box,
      opaqueShare: +((opaque / (w * h)) * 100).toFixed(1),
      thinShare: +((thin / Math.max(thin + considered, 1)) * 100).toFixed(1),
      tones: tones.size,
      hueFamilies: hueBins.filter((n) => hueTotal > 0 && n / hueTotal > 0.02).length,
      crisp: pct(crisp),
      soft: pct(soft),
      flat: pct(flat),
      ratio: +(crisp / Math.max(soft, 0.001)).toFixed(2),
      lum: { p2: at(0.02), p50: at(0.5), p98: at(0.98) },
      top,
    });
  }
  return out;
}, payload);

await browser.close();

for (const r of results) {
  const contrast = (r.lum.p98 + 5) / (r.lum.p2 + 5);
  console.log(`\n${r.label}`);
  console.log(
    `  canvas        ${r.w}x${r.h}, silhouette ${r.silhouette.w}x${r.silhouette.h} at ${r.silhouette.x},${r.silhouette.y}`,
  );
  console.log(
    `  coverage      ${r.opaqueShare}% of canvas is drawn (${r.thinShare}% of it soft-edged)`,
  );
  console.log(`  tones         ${r.tones} quantized tones, ${r.hueFamilies} hue families`);
  console.log(
    `  edge profile  crisp ${r.crisp}%  soft ${r.soft}%  flat ${r.flat}%  crisp/soft ${r.ratio}`,
  );
  console.log(
    `  luminance     p2 ${r.lum.p2}  p50 ${r.lum.p50}  p98 ${r.lum.p98}  contrast ${contrast.toFixed(1)}:1`,
  );
  console.log(`  palette       ${r.top.map((t) => `${t.hex} ${t.share}%`).join("  ")}`);
  console.log(
    `  verdict       ${r.ratio >= 1 ? "hard-edged drawing, edges outnumber ramps" : "airbrushed drawing, ramps outnumber edges"}`,
  );
}
