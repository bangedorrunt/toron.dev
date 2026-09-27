import type { StaticImageData } from "next/image";
import beadsArt from "../assets/mascots/beads.png";
import chiebukuroArt from "../assets/mascots/chiebukuro.png";
import flywheelArt from "../assets/mascots/flywheel.png";
import toronArt from "../assets/mascots/toron.png";

/*
 * governed-by: ADR-0001 D2, ADR-0009 D2
 *
 * One list of the four planes, and one place the art is bound to them.
 *
 * The strip used to carry its own array, which was fine while the strip was the
 * only surface that drew a character. The moment the same set has to appear on
 * the docs pages, in the social card, and on the marketing pages, a second copy
 * of the list becomes four chances for a name, a role, or a mapping to disagree
 * between surfaces. The art is bound here, by slug, so a new surface cannot
 * reach for the wrong character by accident.
 *
 * `name` is the product name as it is displayed, `slug` is the path segment it
 * links into. The two differ only in the leading capital, and conflating them is
 * what kept the section titles lowercase once (ADR-0007 D9).
 */

export type PlaneSlug = "toron" | "flywheel" | "beads" | "chiebukuro";

export type Plane = {
  slug: PlaneSlug;
  /** Display name. Capitalised, because this is what a reader reads. */
  name: string;
  /** One line of what the plane does, as the strip has always worded it. */
  role: string;
  /** The longer ownership claim, used where there is room for it. */
  owns: string;
  /** The product repository. */
  repo: string;
  /** The site's own page for the plane. */
  docs: string;
  art: StaticImageData;
};

/*
 * The record is the source and the array is derived from it, rather than the
 * other way round with an `Object.fromEntries(...) as Record<...>`.
 *
 * That assertion is the shorter way to write this and it is a lie the compiler
 * agrees to: the cast promises a key for every slug, so a plane dropped from the
 * list would still type-check and fail at the first render of the page that asked
 * for it. Written as a record literal, a missing plane is a compile error on the
 * literal itself, and the array below is the one place the display order lives.
 */
export const PLANE_BY_SLUG: Record<PlaneSlug, Plane> = {
  toron: {
    slug: "toron",
    name: "Toron",
    role: "signed mail · identity · receipts · reservations",
    owns: "signed mail, identity, receipts, reservations, archive",
    repo: "https://github.com/bangedorrunt/toron",
    docs: "/docs/toron",
    art: toronArt,
  },
  flywheel: {
    slug: "flywheel",
    name: "Flywheel",
    role: "spawn · dispatch · loops · workflows · cron",
    owns: "dispatch, loops, workflows, cron, coalitions",
    repo: "https://github.com/bangedorrunt/flywheel",
    docs: "/docs/flywheel",
    art: flywheelArt,
  },
  beads: {
    slug: "beads",
    name: "Beads",
    role: "work items · dependencies · gates · close evidence",
    owns: "claims, dependencies, verification gates, close evidence",
    repo: "https://github.com/bangedorrunt/beads",
    docs: "/docs/beads",
    art: beadsArt,
  },
  chiebukuro: {
    slug: "chiebukuro",
    name: "Chiebukuro",
    role: "curated knowledge · episodic memory · synthesis",
    owns: "curated knowledge, episodic memory, synthesis",
    repo: "https://github.com/bangedorrunt/chiebukuro",
    docs: "/docs/chiebukuro",
    art: chiebukuroArt,
  },
};

/** The order the planes are always listed in: toron, flywheel, beads, chiebukuro. */
export const PLANES: readonly Plane[] = [
  PLANE_BY_SLUG.toron,
  PLANE_BY_SLUG.flywheel,
  PLANE_BY_SLUG.beads,
  PLANE_BY_SLUG.chiebukuro,
];

/** All four slugs, in the order the planes are always listed in. */
export const PLANE_SLUGS: readonly PlaneSlug[] = PLANES.map((plane) => plane.slug);

/*
 * The four characters were generated in Grok Imagine and shipped as PNGs, each
 * cropped to its own silhouette and re-centred at a common long side, because the
 * masters frame their subjects at four different offsets and sizes and a row of
 * four has to read as one set. The 1024px masters stay out of the repo; the posts
 * they came from are:
 *
 *   toron       d7bd3e78-b9d9-44e3-a270-4e4de7dd9020
 *   flywheel    a7f367e1-c875-4721-9131-594c04d7197e
 *   beads       609ff84e-9d80-4c86-bf72-0c0f072269fa
 *   chiebukuro  4910c028-64cd-4865-a886-6c750628d670
 *
 * (grok.com/imagine/post/<id>). The hand-drawn svg set that preceded them, and the
 * harness that rendered and measured it, are gone (torondev-rig): nothing
 * referenced either one, and keeping them would have left a second art system
 * that only ever read as current by mistake.
 */
