import { readFileSync } from "node:fs";
import { join } from "node:path";
import { ImageResponse } from "next/og";
import { PLANES } from "@/lib/planes";

/*
 * governed-by: ADR-0009 D8
 *
 * The card carries the same four characters the site does, so a link to toron.dev
 * looks like the page it opens.
 *
 * Satori draws an `<img>` only from a src it can decode, and the card has to be
 * one self-contained PNG, so the four files are read off disk and base64'd into
 * the card rather than fetched over the network. That read happens at module
 * scope, during `next build`: this route has no dynamic input, so it is
 * statically generated, and a missing file fails the build loudly instead of
 * shipping a card with three characters on it. The colours are literals for the same
 * reason: `--toron-*` tokens are not reachable from a renderer that runs before any
 * stylesheet exists, so the four values are carried here and checked against the
 * tokens by `scripts/render-icons.mjs`.
 */

const art = (file: string) =>
  `data:image/png;base64,${readFileSync(
    join(process.cwd(), "assets", "mascots", `${file}.png`),
  ).toString("base64")}`;

const ART = PLANES.map((plane) => ({ slug: plane.slug, name: plane.name, src: art(plane.slug) }));

/*
 * Every style object lives at module scope, and every colour in them is a
 * dark-theme token value: background, ink, body, accent.
 *
 * They are literals because Satori renders this card before any stylesheet exists,
 * which is also why they drifted: the card carried the previous palette (a violet
 * accent on a slightly different near-black) for as long as the palette has been
 * indigo, and nothing compared them. `scripts/render-icons.mjs` now reads the tokens
 * and fails when the four values below stop being the four values there.
 */
const S = {
  card: {
    background: "#08090a",
    color: "#f7f8f8",
    display: "flex",
    flexDirection: "column",
    height: "100%",
    justifyContent: "center",
    padding: "72px 80px",
    fontFamily: "sans-serif",
  },
  eyebrow: {
    color: "#5e6ad2",
    fontSize: 24,
    letterSpacing: 4,
    textTransform: "uppercase",
    marginBottom: 24,
  },
  title: { fontSize: 74, fontWeight: 700, lineHeight: 1.05, maxWidth: 920 },
  subtitle: { color: "#8a8f98", fontSize: 30, marginTop: 26 },
  row: { display: "flex", gap: 26, marginTop: 46 },
  cell: { display: "flex", flexDirection: "column", alignItems: "center", gap: 8 },
  art: { objectFit: "contain" },
  name: { color: "#5e6ad2", fontSize: 18, letterSpacing: 1 },
} as const;

export const alt = "toron.dev: the autonomous agent stack";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpenGraphImage() {
  return new ImageResponse(
    <div style={S.card}>
      <div style={S.eyebrow}>toron.dev</div>
      <div style={S.title}>Mail for machines.</div>
      <div style={S.subtitle}>The autonomous agent stack.</div>
      <div style={S.row}>
        {ART.map((plane) => (
          <div key={plane.slug} style={S.cell}>
            {/* A plain `img`, not `next/image`: this renders inside Satori, which
                has no Next image runtime to route a `/_next/image` url through.
                The data url is already the exact bytes Satori needs. */}
            {/* eslint-disable-next-line next/no-img-element */}
            <img src={plane.src} alt="" width={84} height={84} style={S.art} />
            <div style={S.name}>{plane.name}</div>
          </div>
        ))}
      </div>
    </div>,
    size,
  );
}
