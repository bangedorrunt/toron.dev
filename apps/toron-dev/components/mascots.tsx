// The four plane mascots.
//
// One per plane, each built from its plane's own noun and given the one feature
// that plane alone owns, a face, a single saturated accessory, and an attitude.
// The reference is the Zero to Shipped boat: a literal object for the thing being
// shipped, and a face that takes it completely seriously.
//
// PAINT, NOT CLIPART.
//
// The boat is painted, and the difference between painted and clipart is not the
// subject, it is the light. Four things do it, and all four are here:
//
//   1. Every body is a five-stop radial gradient with the focus thrown off
//      centre toward the light. A two-stop gradient is a flat fill. The fifth
//      stop is the one that matters: it is lighter than the fourth, because it
//      is light bouncing back off the ground, and a form with no bounce light
//      reads as a sticker.
//   2. The silhouette is displaced by fractal noise, so the edge wobbles the way
//      a painted edge does. Two units of displacement: enough to kill the
//      vector perfection, not enough to melt the shape.
//   3. A grain overlay sits on top at low opacity, which is what stops a
//      gradient from looking like a gradient.
//   4. The body is soft and the eyes are not. Filtering the eyes too would blur
//      the one thing the character is for, so they are drawn after the filter
//      and stay crisp. That contrast is most of why the reference's face reads.
//
// EXPRESSION
//
// Each mascot carries two moods in one SVG: `rest` and `work`. They are not the
// same face with parts moved, they are different brows, different lids, and in
// the working mood a different environment (the wheel's motion arcs, the book's
// spark, the envelope's seal glint). The stack strip cross-fades between them on
// a slow cycle and holds `work` while a visitor is pointing at the cell, so the
// set reads as awake without animating at someone who is trying to read it.
//
// Every colour is a --toron-* token (ADR-0001 D2 locks the palette, so a mascot
// may not introduce a hue the design system does not already carry). Each sits
// on its own dark tile for the same reason favicon.svg does, which also makes
// them theme-independent, as an illustration should be.

import type { ReactNode } from "react";

type MascotProps = { className?: string };

const INK = "#0a0a0f"; // the outline, and the tile. ADR-0001 D2 dark default.
const PAPER = "#f7f8f8"; // --toron-ink, dark
const MUTED = "#8a8f98"; // --toron-muted, dark
const VIOLET = "#828fff"; // --toron-accent-bright
const VIOLET_DEEP = "#5e6ad2"; // --toron-accent
const GREEN = "#4cb782"; // --toron-green
const AMBER = "#f2c94c"; // --toron-amber
const BORDER = "#23252a"; // --toron-border

/** One light direction for the whole set, so it reads as one photoshoot. */
const LIGHT = { cx: "0.36", cy: "0.3", r: "0.78" };

/**
 * A painted ramp: highlight, body, core shadow, then the bounce light that
 * makes it read as a form rather than a fill. The bounce stop is deliberately
 * lighter than the core; that inversion is the whole trick.
 */
type Ramp = { hi: string; body: string; core: string; bounce: string; ink: string };

const RAMPS = {
  violet: { hi: "#b3bbff", body: VIOLET, core: "#39409b", bounce: "#7b84e6", ink: VIOLET_DEEP },
  green: { hi: "#9fe3c4", body: GREEN, core: "#1d6b48", bounce: "#63b189", ink: "#2f8f60" },
  amber: { hi: "#fceaa4", body: AMBER, core: "#a1730d", bounce: "#eec25c", ink: "#d9a520" },
} as const satisfies Record<string, Ramp>;

/** Emits the gradients, displacement and grain one mascot needs. All ids are namespaced. */
function Painted({ id, ramp, extra }: { id: string; ramp: Ramp; extra?: ReactNode }) {
  return (
    <defs>
      {/* the body: five stops, focus thrown toward the light */}
      <radialGradient id={`${id}-body`} cx={LIGHT.cx} cy={LIGHT.cy} r={LIGHT.r}>
        <stop offset="0" stopColor={ramp.hi} />
        <stop offset="0.16" stopColor={ramp.body} />
        <stop offset="0.58" stopColor={ramp.body} />
        <stop offset="0.86" stopColor={ramp.core} />
        <stop offset="1" stopColor={ramp.bounce} />
      </radialGradient>
      <radialGradient id={`${id}-glow`} cx="0.5" cy="0.5" r="0.5">
        <stop offset="0" stopColor={ramp.body} stopOpacity="0.55" />
        <stop offset="1" stopColor={ramp.body} stopOpacity="0" />
      </radialGradient>
      {/* fractal noise through a displacement map: the painted edge */}
      <filter id={`${id}-edge`} x="-18%" y="-18%" width="136%" height="136%">
        <feTurbulence type="fractalNoise" baseFrequency="0.05" numOctaves="3" seed="7" result="n" />
        <feDisplacementMap
          in="SourceGraphic"
          in2="n"
          scale="2.2"
          xChannelSelector="R"
          yChannelSelector="G"
        />
      </filter>
      {/* grain, so the gradient stops reading as a gradient */}
      <filter id={`${id}-grain`} x="0" y="0" width="100%" height="100%">
        <feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves="2" seed="3" result="g" />
        <feColorMatrix in="g" type="saturate" values="0" />
      </filter>
      <filter id={`${id}-soft`} x="-40%" y="-40%" width="180%" height="180%">
        <feGaussianBlur stdDeviation="2.6" />
      </filter>
      {extra}
    </defs>
  );
}

/**
 * The dark tile, the grain, and the group the render check measures.
 *
 * `scale` exists because a set drawn at whatever size each shape happened to
 * land at does not read as a set. An envelope is naturally wider than it is
 * tall, so its box will always be smaller than a wheel's; stating the intended
 * optical size here keeps the four comparable, and render-mascots.tsx fails if
 * they drift apart.
 */
function Tile({
  id,
  ramp,
  children,
  label,
  className,
  scale = 1,
}: {
  id: string;
  ramp: Ramp;
  children: ReactNode;
  label: string;
  className?: string;
  scale?: number;
}) {
  return (
    <svg
      className={className}
      viewBox="0 0 96 96"
      role="img"
      aria-label={label}
      xmlns="http://www.w3.org/2000/svg"
    >
      <rect width="96" height="96" rx="20" fill={INK} />
      <rect
        x="0.75"
        y="0.75"
        width="94.5"
        height="94.5"
        rx="19.25"
        fill="none"
        stroke={BORDER}
        strokeWidth="1.5"
      />
      <Painted id={id} ramp={ramp} />
      {/* ambient light behind the character, which is what makes it sit in a
          room rather than on a swatch */}
      <ellipse cx="48" cy="46" rx="40" ry="38" fill={`url(#${id}-glow)`} />
      <g
        data-mascot-art
        transform={scale === 1 ? undefined : `translate(48 48) scale(${scale}) translate(-48 -48)`}
      >
        {children}
      </g>
      {/* grain last, over everything, at an opacity low enough to be felt rather
          than seen */}
      <rect
        className="toron-mascot__grain"
        width="96"
        height="96"
        rx="20"
        filter={`url(#${id}-grain)`}
        opacity="0.07"
        pointerEvents="none"
      />
    </svg>
  );
}

/** A soft cast shadow. Painted things sit on a surface; clipart floats. */
function Ground({
  id,
  cx = 48,
  cy = 84,
  rx = 26,
}: {
  id: string;
  cx?: number;
  cy?: number;
  rx?: number;
}) {
  return (
    <ellipse
      cx={cx}
      cy={cy}
      rx={rx}
      ry="4.5"
      fill={INK}
      opacity="0.55"
      filter={`url(#${id}-soft)`}
    />
  );
}

/**
 * One eye. The reference's eyes are the whole character: white sclera, a
 * coloured iris, a hard dark upper lid, and a brow above it. The lid is what
 * turns a stare into a mood, so it is drawn on every eye. Drawn unfiltered on
 * purpose, so the face stays the sharpest thing in a soft picture.
 */
function Eye({
  cx,
  cy,
  iris,
  brow = "flat",
  r = 8.5,
  lid = 0,
}: {
  cx: number;
  cy: number;
  iris: string;
  brow?: "flat" | "angry" | "raised" | "half" | "hard";
  r?: number;
  lid?: number;
}) {
  const browPath = {
    flat: `M${cx - r - 2} ${cy - r - 5} q${r} -3 ${2 * r} 0`,
    angry: `M${cx - r - 3} ${cy - r - 7} q${r} 4 ${2 * r + 2} 3`,
    raised: `M${cx - r - 2} ${cy - r - 8} q${r} 2 ${2 * r} 0`,
    half: `M${cx - r - 2} ${cy - r - 4} q${r} 1 ${2 * r} 0`,
    hard: `M${cx - r - 3} ${cy - r - 6} q${r} 3 ${2 * r + 1} 1`,
  }[brow];
  return (
    <g>
      <ellipse cx={cx} cy={cy} rx={r} ry={r + 1} fill={PAPER} />
      <circle cx={cx + 1} cy={cy + 1} r={r * 0.55} fill={iris} />
      <circle cx={cx + 1} cy={cy + 1} r={r * 0.26} fill={INK} />
      <circle cx={cx + r * 0.3} cy={cy - r * 0.36} r={r * 0.16} fill={PAPER} opacity="0.95" />
      <path
        d={`M${cx - r * 0.8} ${cy + r * (0.62 - lid)} q${r * 0.8} ${r * 0.3} ${r * 1.6} 0`}
        stroke={INK}
        strokeWidth="1.8"
        strokeLinecap="round"
        fill="none"
        opacity="0.4"
      />
      <path
        d={`M${cx - r - 1} ${cy - r * 0.55} q${r + 1} -${r * 0.75} ${2 * r + 2} 0`}
        stroke={INK}
        strokeWidth="3.2"
        strokeLinecap="round"
        fill="none"
      />
      <path d={browPath} stroke={INK} strokeWidth="3.4" strokeLinecap="round" fill="none" />
    </g>
  );
}

/* ------------------------------------------------------------- toron: mail */
// The feature only toron has is that a message is signed by a key and sealed so
// a relay cannot read it, so the accessory is not a generic wax blob: the seal is
// stamped with a keyhole, which is identity and secrecy in one mark. Resting it
// is half-lidded, because a transport that has already signed the mail has no
// reason to look excited. Working, the lids come up and the seal catches the
// light, because signing is the job.

export function ToronMascot({ className }: MascotProps) {
  const id = "toron";
  const r = RAMPS.violet;
  const body = (
    <g>
      <Ground id={id} cy={82} rx={27} />
      <g filter={`url(#${id}-edge)`}>
        <path
          d="M20 32h56a5 5 0 0 1 5 5v27a5 5 0 0 1-5 5H20a5 5 0 0 1-5-5V37a5 5 0 0 1 5-5z"
          fill={`url(#${id}-body)`}
          stroke={INK}
          strokeWidth="3.5"
          strokeLinejoin="round"
        />
        <path
          d="M17 37 48 58 79 37"
          fill="none"
          stroke={INK}
          strokeWidth="3.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </g>
      {/* bounce light along the lower edge, without which the dark outline eats the form */}
      <path
        d="M20 66h56a5 5 0 0 0 5-5v-1a5 5 0 0 1-5 4H20a5 5 0 0 0-5-4v1a5 5 0 0 0 5 5z"
        fill={r.bounce}
        opacity="0.4"
      />
      <g data-mood="rest">
        <Eye cx={35} cy={45} iris={r.ink} brow="half" r={7} lid={0.18} />
        <Eye cx={61} cy={45} iris={r.ink} brow="half" r={7} lid={0.18} />
        <circle cx={48} cy={60} r={11} fill={RAMPS.amber.body} stroke={INK} strokeWidth="3.5" />
        <circle cx={45} cy={57.5} r={2.6} fill={INK} />
        <path
          d="M45 60.5v5.5l-1.5 1.5"
          stroke={INK}
          strokeWidth="2.6"
          strokeLinecap="round"
          fill="none"
        />
      </g>
      <g data-mood="work">
        {/* the seal is lit while it is working, and the eyes are up */}
        <circle
          cx={48}
          cy={60}
          r={13}
          fill={RAMPS.amber.hi}
          opacity="0.22"
          filter={`url(#${id}-soft)`}
        />
        <Eye cx={35} cy={45} iris={r.ink} brow="hard" r={7} lid={0} />
        <Eye cx={61} cy={45} iris={r.ink} brow="hard" r={7} lid={0} />
        <circle cx={48} cy={60} r={11} fill={RAMPS.amber.hi} stroke={INK} strokeWidth="3.5" />
        <circle cx={45} cy={57.5} r={2.6} fill={INK} />
        <path
          d="M45 60.5v5.5l-1.5 1.5"
          stroke={INK}
          strokeWidth="2.6"
          strokeLinecap="round"
          fill="none"
        />
      </g>
    </g>
  );
  return (
    <Tile
      id={id}
      ramp={r}
      label="Toron, the signed-mail plane: a sealed envelope stamped with a wax seal"
      className={className}
      scale={1.16}
    >
      {body}
    </Tile>
  );
}

/* ---------------------------------------------------------- flywheel: spin */
// The feature only flywheel has is that it never stops, so the wheel is caught
// mid-turn with its rim smeared and one spoke thrown clear as the dispatch arm.
// Resting it is still turning, because resting is not a thing this plane does;
// working adds the full set of arcs and drops the brows.

export function FlywheelMascot({ className }: MascotProps) {
  const id = "flywheel";
  const r = RAMPS.violet;
  const hub = RAMPS.green;
  const spokes = (
    <g stroke={r.body} strokeWidth="4" strokeLinecap="round">
      <path d="M48 28v9" />
      <path d="M48 59v9" />
      <path d="M28 48h9" />
      <path d="M59 48h9" />
      <path d="m34 34 6 6" />
      <path d="m56 56 6 6" />
      <path d="m62 34-6 6" />
      <path d="m40 56-6 6" />
    </g>
  );
  const wheel = (
    <g filter={`url(#${id}-edge)`}>
      <circle cx="48" cy="48" r="27" fill={`url(#${id}-body)`} stroke={INK} strokeWidth="3.5" />
      <circle cx="48" cy="48" r="20.5" fill={INK} />
      {spokes}
      {/* the dispatch arm: one spoke thrown clear, with the job on its end */}
      <path d="M48 48 48 14" stroke={r.body} strokeWidth="4.5" strokeLinecap="round" />
      <path
        d="M43 20 48 13l5 7z"
        fill={hub.body}
        stroke={INK}
        strokeWidth="2"
        strokeLinejoin="round"
      />
      <circle cx="48" cy="48" r="9.5" fill={`url(#flywheel-hub)`} stroke={INK} strokeWidth="3.5" />
    </g>
  );
  return (
    <Tile
      id={id}
      ramp={r}
      label="Flywheel, the orchestration plane: a flywheel caught mid-turn"
      className={className}
    >
      <defs>
        <radialGradient id="flywheel-hub" cx={LIGHT.cx} cy={LIGHT.cy} r={LIGHT.r}>
          <stop offset="0" stopColor={hub.hi} />
          <stop offset="0.2" stopColor={hub.body} />
          <stop offset="0.8" stopColor={hub.core} />
          <stop offset="1" stopColor={hub.bounce} />
        </radialGradient>
      </defs>
      <Ground id={id} cy={86} rx={22} />
      <g data-mood="rest">
        <g stroke={r.body} strokeLinecap="round" fill="none" opacity="0.5">
          <path d="M20 30a26 26 0 0 1 12-11" strokeWidth="5" />
        </g>
        {wheel}
        <Eye cx={41} cy={47} iris={hub.ink} brow="angry" r={6} />
        <Eye cx={55} cy={47} iris={hub.ink} brow="angry" r={6} />
      </g>
      <g data-mood="work">
        {/* the full set of arcs: the difference between turning and dispatching */}
        <g stroke={r.body} strokeLinecap="round" fill="none">
          <path d="M20 30a26 26 0 0 1 12-11" strokeWidth="5" opacity="0.3" />
          <path d="M76 66a26 26 0 0 1-12 11" strokeWidth="5" opacity="0.3" />
          <path d="M12 62a26 26 0 0 0 4 12" stroke={MUTED} strokeWidth="3" opacity="0.6" />
          <path d="M84 34a26 26 0 0 0-4-12" stroke={MUTED} strokeWidth="3" opacity="0.6" />
        </g>
        {wheel}
        <Eye cx={41} cy={47} iris={hub.ink} brow="hard" r={6} lid={0.12} />
        <Eye cx={55} cy={47} iris={hub.ink} brow="hard" r={6} lid={0.12} />
      </g>
    </Tile>
  );
}

/* ------------------------------------------------------------ beads: proof */
// A single bead would be a bead counter. What beads is, and the only plane here
// that is, is a chain where each link depends on the last and cannot close
// without evidence. Resting, the front bead is open; working, it is stamped
// shut and the gate is latched, which is the whole argument of the plane.

export function BeadsMascot({ className }: MascotProps) {
  const id = "beads";
  const r = RAMPS.amber;
  const chain = (
    <g>
      <g stroke={MUTED} strokeWidth="4" strokeLinecap="round" fill="none" opacity="0.8">
        <path d="M20 20q7 6 0 12" />
        <path d="M34 14q7 7 0 14" />
      </g>
      <g filter={`url(#${id}-edge)`}>
        <circle cx="27" cy="46" r="10" fill={r.body} stroke={INK} strokeWidth="3" opacity="0.5" />
        <circle cx="33" cy="33" r="8" fill={r.body} stroke={INK} strokeWidth="3" opacity="0.35" />
        <circle cx="55" cy="60" r="24" fill={`url(#${id}-body)`} stroke={INK} strokeWidth="3.5" />
      </g>
      <path d="M27 46 33 33" stroke={MUTED} strokeWidth="3" strokeLinecap="round" />
    </g>
  );
  return (
    <Tile
      id={id}
      ramp={r}
      label="Beads, the work-evidence plane: a chain of work items"
      className={className}
    >
      <Ground id={id} cy={88} rx={20} />
      {chain}
      <g data-mood="rest">
        <path
          d="M34 70a24 24 0 0 0 42 0"
          fill="none"
          stroke={r.bounce}
          strokeWidth="3"
          opacity="0.55"
          strokeLinecap="round"
        />
        <Eye cx={47} cy={58} iris={r.ink} brow="flat" r={7.5} />
        <Eye cx={64} cy={58} iris={r.ink} brow="flat" r={7.5} />
      </g>
      <g data-mood="work">
        {/* the gate latched, and the bead stamped shut: close evidence */}
        <rect
          x="30"
          y="53"
          width="9"
          height="12"
          rx="2.5"
          fill={MUTED}
          stroke={INK}
          strokeWidth="2.5"
        />
        <path
          d="M34 70a24 24 0 0 0 42 0"
          fill="none"
          stroke={r.bounce}
          strokeWidth="3.4"
          opacity="0.7"
          strokeLinecap="round"
        />
        <Eye cx={47} cy={58} iris={r.ink} brow="hard" r={7.5} lid={0.1} />
        <Eye cx={64} cy={58} iris={r.ink} brow="hard" r={7.5} lid={0.1} />
        <circle cx="70" cy="76" r="9" fill={VIOLET} stroke={INK} strokeWidth="3" />
        <path
          d="M66 76l3 3 5.5-6"
          stroke={INK}
          strokeWidth="2.8"
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
        />
      </g>
    </Tile>
  );
}

/* ------------------------------------------------------ chiebukuro: recall */
// The feature only chiebukuro has is that it holds two different stores and
// answers from both, so the book is split green and violet down the spine and
// the synthesis rises off the join. The spark is dim at rest and lit while it
// is working, because knowing and answering are different acts.

export function ChiebukuroMascot({ className }: MascotProps) {
  const id = "chiebukuro";
  const k = RAMPS.green;
  const v = RAMPS.violet;
  const pages = (
    <g filter={`url(#${id}-edge)`}>
      <path
        d="M48 32c-8-6-19-8-27-6v36c8-2 19 0 27 6z"
        fill={`url(#${id}-know)`}
        stroke={INK}
        strokeWidth="3.5"
        strokeLinejoin="round"
      />
      <path
        d="M48 32c8-6 19-8 27-6v36c-8-2-19 0-27 6z"
        fill={`url(#${id}-mem)`}
        stroke={INK}
        strokeWidth="3.5"
        strokeLinejoin="round"
      />
    </g>
  );
  return (
    <Tile
      id={id}
      ramp={k}
      label="Chiebukuro, the knowledge and memory plane: an open book synthesising across its spine"
      className={className}
    >
      <defs>
        <radialGradient id={`${id}-know`} cx="0.3" cy="0.28" r="0.85">
          <stop offset="0" stopColor={k.hi} />
          <stop offset="0.22" stopColor={k.body} />
          <stop offset="0.78" stopColor={k.core} />
          <stop offset="1" stopColor={k.bounce} />
        </radialGradient>
        <radialGradient id={`${id}-mem`} cx="0.7" cy="0.28" r="0.85">
          <stop offset="0" stopColor={v.hi} />
          <stop offset="0.22" stopColor={v.body} />
          <stop offset="0.78" stopColor={v.core} />
          <stop offset="1" stopColor={v.bounce} />
        </radialGradient>
      </defs>
      <Ground id={id} cy={80} rx={24} />
      {pages}
      <path d="M21 62c8-2 19 0 27 6v3c-8-6-19-8-27-6z" fill={k.bounce} opacity="0.45" />
      <path d="M75 62c-8-2-19 0-27 6v3c8-6 19-8 27-6z" fill={v.bounce} opacity="0.45" />
      <g stroke={INK} strokeWidth="2.4" strokeLinecap="round" opacity="0.45">
        <path d="M27 38h14M27 46h14M27 54h9" />
        <path d="M55 38h14M55 46h14M55 54h9" />
      </g>
      <g data-mood="rest">
        <g stroke={AMBER} strokeWidth="2.4" strokeLinecap="round" opacity="0.4">
          <path d="M48 21v-6" />
          <path d="M40 23 36 18" />
          <path d="M56 23 60 18" />
        </g>
        <g fill="none" stroke={INK} strokeWidth="3" strokeLinecap="round">
          <circle cx="36" cy="47" r="10" />
          <circle cx="60" cy="47" r="10" />
          <path d="M46 47h4" />
          <path d="M26 45 20 42M70 45l6-3" />
        </g>
        <Eye cx={36} cy={47} iris={INK} brow="half" r={6.5} lid={0.12} />
        <Eye cx={60} cy={47} iris={INK} brow="half" r={6.5} lid={0.12} />
        <path
          d="M30 43a9 9 0 0 1 5-3"
          stroke={PAPER}
          strokeWidth="2"
          strokeLinecap="round"
          fill="none"
          opacity="0.6"
        />
        <path
          d="M54 43a9 9 0 0 1 5-3"
          stroke={PAPER}
          strokeWidth="2"
          strokeLinecap="round"
          fill="none"
          opacity="0.6"
        />
      </g>
      <g data-mood="work">
        {/* synthesis, lit: the join between the two stores doing its job */}
        <circle cx="48" cy="14" r="7" fill={AMBER} opacity="0.3" filter={`url(#${id}-soft)`} />
        <g stroke={AMBER} strokeWidth="3" strokeLinecap="round">
          <path d="M48 21v-7" />
          <path d="M39 23 34 17" />
          <path d="M57 23 62 17" />
        </g>
        <circle cx="48" cy="13" r="3.4" fill={AMBER} stroke={INK} strokeWidth="2" />
        <g fill="none" stroke={INK} strokeWidth="3" strokeLinecap="round">
          <circle cx="36" cy="47" r="10" />
          <circle cx="60" cy="47" r="10" />
          <path d="M46 47h4" />
          <path d="M26 45 20 42M70 45l6-3" />
        </g>
        <Eye cx={36} cy={47} iris={INK} brow="raised" r={6.5} />
        <Eye cx={60} cy={47} iris={INK} brow="raised" r={6.5} />
        <path
          d="M30 43a9 9 0 0 1 5-3"
          stroke={PAPER}
          strokeWidth="2"
          strokeLinecap="round"
          fill="none"
          opacity="0.85"
        />
        <path
          d="M54 43a9 9 0 0 1 5-3"
          stroke={PAPER}
          strokeWidth="2"
          strokeLinecap="round"
          fill="none"
          opacity="0.85"
        />
      </g>
    </Tile>
  );
}

export const MASCOTS = {
  toron: ToronMascot,
  flywheel: FlywheelMascot,
  beads: BeadsMascot,
  chiebukuro: ChiebukuroMascot,
} as const;
