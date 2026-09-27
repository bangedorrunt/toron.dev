import type { MetadataRoute } from "next";

/*
 * governed-by: ADR-0010 D5
 *
 * The web app manifest, which is how a phone gets the icon right.
 *
 * Without one, Android and Chrome fall back to a heuristic over whatever favicon
 * they can find and draw the site's mark inside a white circle they choose
 * themselves. With one, the two PNGs `scripts/render-icons.mjs` writes are the
 * icon, the mask is the platform's to apply, and the splash background is the
 * page background rather than white.
 *
 * Both colours are the dark-theme token values, which is also what the manifest
 * cannot reach: a manifest is JSON, so it carries literals, and `theme_color`
 * here matches the `theme-color` the root layout already declares.
 */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "toron.dev: the autonomous agent stack",
    short_name: "toron.dev",
    description:
      "Signed mail, orchestration, work evidence, and memory for autonomous multi-agent workflows.",
    start_url: "/",
    display: "standalone",
    background_color: "#08090a",
    theme_color: "#08090a",
    icons: [
      { src: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
  };
}
