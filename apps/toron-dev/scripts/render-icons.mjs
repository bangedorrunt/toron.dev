/*
 * Draw the site's icon set from its one vector, then look at what came out.
 *
 * What this is: the generator and the check for every icon the site serves, in one
 * file, because the two are the same job. `public/favicon.svg` is the source and the
 * only place the mark is drawn. Everything else is raster.
 *
 *   app/favicon.ico       16, 32, 48   the tab, the bookmark bar, the old client
 *   app/apple-icon.png    180          full bleed, because iOS masks it itself
 *   public/icon-192.png   192          the manifest's icon
 *   public/icon-512.png   512          the manifest's icon, and the install prompt
 *
 * Three things are checked rather than assumed:
 *
 *   palette   the three colours in the svg are read back out of
 *             `packages/tokens/theme.css` and compared to it. The mark shipped for
 *             weeks in `#8b5cf6` on `#0a0a0f` after the palette moved to `#5e6ad2`
 *             on `#08090a`, and nothing noticed, because a colour in a file nobody
 *             reads is a colour nobody notices.
 *   legibility  each raster is drawn into a canvas and its pixels are counted. At
 *             16px the mark has to still be an envelope: a floor on how much violet
 *             survives, a floor on the light flap, and a ceiling so a filled blob
 *             fails instead of passing as "enough violet".
 *   container  the ICO is parsed back and every entry has to be a PNG of the size
 *             its directory entry claims. A container that lies about its payload is
 *             a broken tab icon in one browser and not another.
 *
 * Run: node scripts/render-icons.mjs
 * Writes the four files above, exits non-zero on a failed check.
 */

import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright";

const HERE = dirname(fileURLToPath(import.meta.url));
const APP_ROOT = resolve(HERE, "..");
const REPO_ROOT = resolve(APP_ROOT, "..", "..");
const SOURCE = join(APP_ROOT, "public", "favicon.svg");
const TOKENS = join(REPO_ROOT, "packages", "tokens", "theme.css");

let bad = 0;
const line = (ok, label, detail) => {
  if (!ok) bad++;
  console.log(`  ${(ok ? "ok" : "FAIL").padEnd(5)} ${label.padEnd(16)} ${detail}`);
};

const source = readFileSync(SOURCE, "utf8");

/* ------------------------------------------------------------------ palette */

/*
 * The dark theme is `:root`, so the three values are read from the top of the file
 * rather than from whichever block a later theme happens to be in.
 */
const rawTokens = readFileSync(TOKENS, "utf8");
const theme = rawTokens.slice(0, rawTokens.indexOf("[data-theme"));
const token = (name) => theme.match(new RegExp(`--toron-${name}:\\s*(#[0-9a-f]{6})`))?.[1];

/*
 * The colours a brand asset may use. The mark needs three of them by name; the
 * social card is checked against the whole set, because it is the other file that
 * carries literals and it is the other file that had drifted.
 */
const TOKEN_NAMES = ["bg", "surface", "ink", "body", "muted", "accent", "accent-bright"];
const palette = Object.fromEntries(TOKEN_NAMES.map((name) => [name, token(name)]));
const allowed = new Set(Object.values(palette));

/*
 * Comments are stripped, not just skipped in the report. A colour named in prose is
 * still a colour this file has to keep true, and the first version of this check
 * failed on the old values quoted in a comment that explained why the palette moved.
 */
const drawn = source.replaceAll(/<!--[\s\S]*?-->/g, "");
const declared = [
  ...new Set([...drawn.matchAll(/#[0-9a-fA-F]{6}/g)].map((m) => m[0].toLowerCase())),
];
/* The mark's three, by name: the tile, the outline, and the flap. */
const mark = [palette.bg, palette.accent, palette.ink];
line(
  mark.every((value) => value && declared.includes(value)),
  "palette",
  `the svg draws ${declared.join(", ")}, against tokens ${mark.join(", ")}`,
);
line(
  declared.every((value) => allowed.has(value)),
  "no extras",
  `${declared.length} colour(s) in the svg, every one a token value`,
);

const cardPath = join(APP_ROOT, "app", "opengraph-image.tsx");
const cardColours = [
  ...new Set(
    [...readFileSync(cardPath, "utf8").matchAll(/#[0-9a-fA-F]{6}/g)].map((m) => m[0].toLowerCase()),
  ),
];
line(
  cardColours.length > 0 && cardColours.every((value) => allowed.has(value)),
  "card palette",
  `the social card carries ${cardColours.join(", ")}, all of them token values`,
);

/* ----------------------------------------------------------------- variants */

const small = source.replaceAll('stroke-width="4"', 'stroke-width="6"');
if (small === source)
  throw new Error('the 16px variant could not be built: no stroke-width="4" to thicken');
const bleed = source.replace('rx="14"', 'rx="0"');
if (bleed === source)
  throw new Error('the apple variant could not be built: no rx="14" to square off');

/* ------------------------------------------------------------------ render */

const browser = await chromium.launch();
const page = await browser.newPage();

/*
 * Both the pixels and the file, out of one canvas, with no screenshot in between.
 * The svg goes in as a data url, which the canvas reads as same-origin: a file://
 * image would taint it and `getImageData` would throw, which is the same trap
 * `render-strip.mjs` documents.
 */
const raster = (mark, side) =>
  page.evaluate(
    async ({ svg, size }) => {
      const binary = [...new TextEncoder().encode(svg)]
        .map((byte) => String.fromCharCode(byte))
        .join("");
      const image = new Image();
      await new Promise((accept, reject) => {
        image.addEventListener("load", accept, { once: true });
        image.addEventListener("error", reject, { once: true });
        image.src = `data:image/svg+xml;base64,${btoa(binary)}`;
      });

      const canvas = document.createElement("canvas");
      canvas.width = size;
      canvas.height = size;
      const context = canvas.getContext("2d", { willReadFrequently: true });
      context.drawImage(image, 0, 0, size, size);
      const data = context.getImageData(0, 0, size, size).data;

      const counts = { accent: 0, ink: 0, bg: 0, clear: 0, other: 0 };
      for (let i = 0; i < data.length; i += 4) {
        const [r, g, b, a] = [data[i], data[i + 1], data[i + 2], data[i + 3]];
        if (a < 24) counts.clear++;
        else if (b > 150 && b - r > 40) counts.accent++;
        else if (r > 190 && g > 190 && b > 190) counts.ink++;
        else if (r < 40 && g < 40 && b < 40) counts.bg++;
        else counts.other++;
      }

      /* The fill of a named corner, so "full bleed" is measured, not trusted. */
      const pixel = (x, y) => [...context.getImageData(x, y, 1, 1).data];

      return {
        counts,
        png: canvas.toDataURL("image/png").split(",")[1],
        corner: pixel(1, 1),
        middle: pixel(Math.floor(size / 2), Math.floor(size / 2)),
      };
    },
    { svg: mark, size: side },
  );

const rasters = {};
for (const [name, size, svg] of [
  ["ico16", 16, small],
  ["ico32", 32, small],
  ["ico48", 48, source],
  // 64 and 256 are not for a tab. Windows picks 256 for a pinned taskbar tile and
  // Safari uses 64 in some chrome, and the ico this one replaced shipped a 256, so
  // dropping it would be a regression in the one place nobody looks.
  ["ico64", 64, source],
  ["ico256", 256, source],
  ["apple", 180, bleed],
  ["icon192", 192, source],
  ["icon512", 512, source],
]) {
  rasters[name] = { ...(await raster(svg, size)), size };
}

/* --------------------------------------------------------------- legibility */

const total = (size) => size * size;
line(
  rasters.ico16.counts.accent >= 10 && rasters.ico16.counts.ink >= 4,
  "16px readable",
  `${rasters.ico16.counts.accent} accent and ${rasters.ico16.counts.ink} ink pixel(s) of ${total(16)}`,
);
line(
  rasters.ico16.counts.accent / total(16) < 0.5,
  "16px not a blob",
  `accent covers ${((rasters.ico16.counts.accent / total(16)) * 100).toFixed(1)}% of the icon, so the envelope is still an outline`,
);
line(
  rasters.ico32.counts.accent >= 30 && rasters.ico48.counts.accent >= 60,
  "larger sizes",
  `${rasters.ico32.counts.accent} accent pixel(s) at 32, ${rasters.ico48.counts.accent} at 48`,
);
line(
  rasters.apple.counts.clear === 0 && rasters.apple.counts.bg / total(180) > 0.5,
  "apple full bleed",
  `${rasters.apple.counts.clear} transparent pixel(s), background covers ${((rasters.apple.counts.bg / total(180)) * 100).toFixed(1)}%`,
);
line(
  rasters.icon512.corner[3] < 24 && rasters.apple.corner[3] === 255,
  "corners",
  `the rounded tile leaves (1,1) at alpha ${rasters.icon512.corner[3]}, the full-bleed apple icon at ${rasters.apple.corner[3]}`,
);

/* --------------------------------------------------------------------- ico */

/*
 * A directory of PNGs is a valid ICO for every browser that matters, and it keeps
 * one rasteriser in this file instead of two. The container is written by hand
 * because the alternative is a dependency for fifty lines of arithmetic.
 */
const ico = (entries) => {
  const header = Buffer.alloc(6);
  header.writeUInt16LE(0, 0);
  header.writeUInt16LE(1, 2);
  header.writeUInt16LE(entries.length, 4);

  const directory = Buffer.alloc(entries.length * 16);
  let offset = 6 + entries.length * 16;
  entries.forEach((entry, index) => {
    const base = index * 16;
    directory.writeUInt8(entry.size >= 256 ? 0 : entry.size, base);
    directory.writeUInt8(entry.size >= 256 ? 0 : entry.size, base + 1);
    directory.writeUInt8(0, base + 2);
    directory.writeUInt8(0, base + 3);
    directory.writeUInt16LE(1, base + 4);
    directory.writeUInt16LE(32, base + 6);
    directory.writeUInt32LE(entry.png.length, base + 8);
    directory.writeUInt32LE(offset, base + 12);
    offset += entry.png.length;
  });

  return Buffer.concat([header, directory, ...entries.map((entry) => entry.png)]);
};

const png = (name) => Buffer.from(rasters[name].png, "base64");
const icoEntries = [16, 32, 48, 64, 256];
const icoBytes = ico(icoEntries.map((size) => ({ size, png: png(`ico${size}`) })));

const previousPath = join(APP_ROOT, "app", "favicon.ico");
if (existsSync(previousPath)) {
  const previous = readFileSync(previousPath);
  const count = previous.readUInt16LE(4);
  const sizes = [];
  for (let i = 0; i < count && 6 + i * 16 + 16 <= previous.length; i++) {
    const base = 6 + i * 16;
    sizes.push(`${previous.readUInt8(base) || 256}x${previous.readUInt8(base + 1) || 256}`);
  }
  line(true, "was", `${previous.length} bytes, ${count} entr(ies) ${sizes.join(" ")}, replaced`);
}

const readIco = (buffer) => {
  const count = buffer.readUInt16LE(4);
  const entries = [];
  for (let i = 0; i < count; i++) {
    const base = 6 + i * 16;
    entries.push({
      width: buffer.readUInt8(base) || 256,
      height: buffer.readUInt8(base + 1) || 256,
      bytes: buffer.readUInt32LE(base + 8),
      offset: buffer.readUInt32LE(base + 12),
    });
  }
  return entries;
};

const round = readIco(icoBytes);
line(
  round.length === icoEntries.length &&
    round.every((entry) => {
      const payload = icoBytes.subarray(entry.offset, entry.offset + entry.bytes);
      return (
        payload.subarray(0, 8).toString("hex") === "89504e470d0a1a0a" &&
        payload.readUInt32BE(16) === entry.width &&
        payload.readUInt32BE(20) === entry.height
      );
    }),
  "ico reads back",
  `${round.length} entr(ies), ${round.map((entry) => `${entry.width}x${entry.height}`).join(" ")}, every payload a PNG of the size it claims`,
);

/* ------------------------------------------------------------------- write */

const outputs = [
  [join(APP_ROOT, "app", "favicon.ico"), icoBytes],
  [join(APP_ROOT, "app", "apple-icon.png"), png("apple")],
  [join(APP_ROOT, "public", "icon-192.png"), png("icon192")],
  [join(APP_ROOT, "public", "icon-512.png"), png("icon512")],
];

for (const [path, bytes] of outputs) {
  writeFileSync(path, bytes);
}
line(
  outputs.every(([, bytes]) => bytes.length > 200 && bytes.length < 40 * 1024),
  "sizes sane",
  outputs
    .map(([path, bytes]) => `${path.split("/").pop()} ${(bytes.length / 1024).toFixed(1)}KB`)
    .join(", "),
);

await browser.close();

console.log(
  bad === 0
    ? `\n  all checks passed on the icon set; ${outputs.length} file(s) written from public/favicon.svg\n`
    : `\n  ${bad} check(s) failed\n`,
);
process.exitCode = bad === 0 ? 0 : 1;
