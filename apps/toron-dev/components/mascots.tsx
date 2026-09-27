// The four plane mascots.
//
// One per plane, each built from its plane's own noun and given the one feature
// that plane alone owns, a face, a single warm accent, and an attitude. The
// reference is the Zero to Shipped boat: a literal object for the thing being
// shipped, and a face that takes it completely seriously.
//
// PAINTED, NOT OUTLINED.
//
// The thing that separates a painted mascot from clipart is not the subject and
// not the palette. It is the absence of a contour. Clipart draws a dark line
// around every shape because a line is how vector art declares a boundary;
// paint declares a boundary with a change in value and nothing else. So there is
// not one `stroke` on any body in this file. Form is built from four things
// instead:
//
//   1. A value ramp across the whole form, light on the lit side falling to a
//      deep core, and then a bounce stop at the very bottom that is LIGHTER
//      than the core. That inversion is light coming back off the ground, and
//      without it a form reads as a flat sticker no matter how good the colour
//      is.
//   2. A soft edge. The reference is sprayed, so the silhouette is blurred by
//      well under a unit and the tooth of the paint shows through. An earlier
//      version displaced the silhouette with fractal noise instead, which read
//      as a melted sticker, because ragged is not the same as soft.
//   3. A rim light along the bottom edge, in the plane's own bounce colour, so
//      the form separates from a dark tile without a line being drawn.
//   4. Huge eyes. In the reference the eyes are most of the character, and a
//      mascot with small eyes is a mascot with no face. The sclera, the hard
//      upper lid and the wet catchlight carry the whole mood.
//
// EXPRESSION
//
// Each mascot carries two moods in one SVG: `rest` and `work`. They are not the
// same face with parts moved. They are different lids, different brows, and in
// the working mood a different environment: the wheel's full arc set, the
// envelope's lit seal, the book's synthesis spark, the bead's closed gate. The
// stack strip cross-fades between them on a slow cycle and holds `work` while a
// visitor is pointing at the cell, so the set reads as awake without animating
// at someone who is trying to read it.
//
// Every colour is a --toron-* token or a tonal step along one of those tokens
// (ADR-0001 D2 locks the palette, so a mascot may not introduce a hue). Each
// sits on its own dark tile for the same reason favicon.svg does, which also
// makes them theme-independent, as an illustration should be.

import type { ReactNode } from "react";

type MascotProps = { className?: string };

const INK = "#0a0a0f"; // the tile, and the deepest core. ADR-0001 D2 dark default.
const PAPER = "#f7f8f8"; // --toron-ink, dark
const MUTED = "#8a8f98"; // --toron-muted, dark
const VIOLET = "#828fff"; // --toron-accent-bright
const VIOLET_DEEP = "#5e6ad2"; // --toron-accent
const GREEN = "#4cb782"; // --toron-green
const AMBER = "#f2c94c"; // --toron-amber
const BORDER = "#23252a"; // --toron-border

/**
 * One light for the whole set, so the four read as one photoshoot rather than
 * four separate illustrations. Every gradient in this file is thrown from it.
 */
const LIGHT = { x: "0.3", y: "0.2" };

/**
 * A value ramp: highlight, body, deep core, bounce. Every stop is a tonal step
 * of the same token, which is what keeps the palette locked while still giving
 * paint somewhere to go. The bounce stop being lighter than the core is the
 * whole trick, and it is the stop that is easiest to leave out.
 */
type Ramp = { hi: string; body: string; deep: string; bounce: string; ink: string };

const RAMPS = {
  violet: {
    hi: "#c3c9ff",
    body: VIOLET,
    deep: "#3a4090",
    bounce: "#8b93f0",
    ink: VIOLET_DEEP,
  },
  green: {
    hi: "#b3ecd3",
    body: GREEN,
    deep: "#175c3e",
    bounce: "#6fc79c",
    ink: "#26885b",
  },
  amber: {
    hi: "#fdf0bd",
    body: AMBER,
    deep: "#8f6209",
    bounce: "#f7d479",
    ink: "#b07d13",
  },
} as const satisfies Record<string, Ramp>;

/**
 * Everything one mascot needs to be painted: two value gradients (a vertical
 * one for flat forms, a radial one for round ones), a rim light, an ambient
 * bloom, and the three blurs. All ids are namespaced per mascot so four of
 * these can share a page.
 */
function Painted({ id, ramp, extra }: { id: string; ramp: Ramp; extra?: ReactNode }) {
  return (
    <defs>
      {/* value across a flat form: lit shoulder falling to a core, bounce at the
          very bottom edge */}
      <linearGradient id={`${id}-flat`} x1={LIGHT.x} y1="0" x2="0.6" y2="1">
        <stop offset="0" stopColor={ramp.hi} />
        <stop offset="0.3" stopColor={ramp.body} />
        <stop offset="0.78" stopColor={ramp.deep} />
        <stop offset="1" stopColor={ramp.bounce} />
      </linearGradient>
      {/* the same ramp for a round form, thrown from the light so the lit side
          carries the volume and the far side falls away */}
      <radialGradient id={`${id}-round`} cx={LIGHT.x} cy={LIGHT.y} r="0.92">
        <stop offset="0" stopColor={ramp.hi} />
        <stop offset="0.26" stopColor={ramp.body} />
        <stop offset="0.74" stopColor={ramp.deep} />
        <stop offset="1" stopColor={ramp.bounce} />
      </radialGradient>
      {/* the rim: transparent at the top, bounce colour at the bottom, so the
          form separates from a dark tile without a line being drawn */}
      <linearGradient id={`${id}-rim`} x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor={ramp.bounce} stopOpacity="0" />
        <stop offset="0.72" stopColor={ramp.bounce} stopOpacity="0" />
        <stop offset="1" stopColor={ramp.bounce} stopOpacity="0.85" />
      </linearGradient>
      {/* ambient bloom: the plane's colour in the air around the character */}
      <radialGradient id={`${id}-bloom`} cx="0.5" cy="0.5" r="0.5">
        <stop offset="0" stopColor={ramp.body} stopOpacity="0.3" />
        <stop offset="1" stopColor={ramp.body} stopOpacity="0" />
      </radialGradient>
      {/* the sprayed edge. Under a unit, on a 96 tile: enough to lose the vector
          perfection, not enough to make the character blurry */}
      <filter id={`${id}-edge`} x="-12%" y="-12%" width="124%" height="124%">
        <feGaussianBlur stdDeviation="0.65" />
      </filter>
      <filter id={`${id}-soft`} x="-40%" y="-40%" width="180%" height="180%">
        <feGaussianBlur stdDeviation="2.4" />
      </filter>
      <filter id={`${id}-wide`} x="-60%" y="-60%" width="220%" height="220%">
        <feGaussianBlur stdDeviation="4.5" />
      </filter>
      {/* tooth, so the value ramp stops reading as a gradient */}
      <filter id={`${id}-tooth`} x="0" y="0" width="100%" height="100%">
        <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" seed="3" result="g" />
        <feColorMatrix in="g" type="saturate" values="0" />
      </filter>
      {extra}
    </defs>
  );
}

/**
 * The dark tile, the tooth, and the group the render check measures.
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
      viewBox="0 0 96 96"
      className={className}
      role="img"
      aria-label={label}
      xmlns="http://www.w3.org/2000/svg"
    >
      <rect width="96" height="96" rx="20" fill={INK} />
      {/* the tile frame, which is the one contour in the file that earns its
          keep: it is what separates a dark tile from a dark page, and it is UI,
          not art */}
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
      {/* the plane's colour hanging in the air behind the character, which is
          what makes it sit in a room rather than on a swatch */}
      <ellipse cx="48" cy="48" rx="44" ry="42" fill={`url(#${id}-bloom)`} />
      <g
        data-mascot-art
        transform={scale === 1 ? undefined : `translate(48 48) scale(${scale}) translate(-48 -48)`}
      >
        {children}
      </g>
      {/* tooth last, over everything, at an opacity low enough to be felt
          rather than seen */}
      <rect
        className="toron-mascot__grain"
        width="96"
        height="96"
        rx="20"
        filter={`url(#${id}-tooth)`}
        opacity="0.06"
        pointerEvents="none"
      />
    </svg>
  );
}

/**
 * A cast shadow. Wide, soft and low contrast: a shadow is the absence of light
 * on a surface, so it is a faint smudge, never a dark ellipse with an edge.
 */
function Ground({
  id,
  cy = 84,
  rx = 30,
  ry = 5,
}: {
  id: string;
  cy?: number;
  rx?: number;
  ry?: number;
}) {
  return (
    <ellipse cx="48" cy={cy} rx={rx} ry={ry} fill={INK} opacity="0.7" filter={`url(#${id}-wide)`} />
  );
}

/**
 * One eye, and the reference's whole trick in miniature.
 *
 * The sclera is warm paper rather than pure white, the iris is large enough to
 * carry the plane's colour, and the lid is a filled mass rather than a stroke,
 * because a heavy-lidded look cannot be drawn with a line. The catchlight is
 * big and sits on the lit side, and there is a second small one, because a wet
 * eye has two lights in it and one looks like glass.
 *
 * Drawn unfiltered, on purpose. Everything else in the picture is soft; the
 * face is the one thing that stays sharp, and that contrast is most of why the
 * reference reads as painted rather than filtered.
 */
function Eye({
  cx,
  cy,
  r = 10,
  iris,
  brow = "flat",
  lid = 0,
}: {
  cx: number;
  cy: number;
  r?: number;
  iris: string;
  brow?: "flat" | "angry" | "raised" | "half" | "hard";
  /** 0 is wide open, 1 is shut. */
  lid?: number;
}) {
  // How far the lid mass drops over the top of the eye. Half a unit of rest
  // even when open, because a lid that sits exactly on the rim looks like no
  // lid at all.
  const drop = r * 0.16 + r * lid * 0.92;
  // The brow rides above the lid, and its angle is the mood.
  const browY = cy - r - r * (0.42 + lid * 0.3);
  const browPath = {
    flat: `M${cx - r * 0.9} ${browY} q${r * 0.9} -${r * 0.2} ${r * 1.8} 0`,
    angry: `M${cx - r * 1.05} ${browY + r * 0.34} q${r * 0.95} -${r * 0.42} ${r * 1.9} -${r * 0.3}`,
    raised: `M${cx - r * 0.9} ${browY - r * 0.3} q${r * 0.9} ${r * 0.28} ${r * 1.8} 0`,
    half: `M${cx - r * 0.95} ${browY + r * 0.06} q${r * 0.95} -${r * 0.12} ${r * 1.9} 0`,
    hard: `M${cx - r * 1.02} ${browY + r * 0.2} q${r * 0.95} -${r * 0.3} ${r * 1.88} -${r * 0.16}`,
  }[brow];
  return (
    <g>
      <ellipse cx={cx} cy={cy} rx={r} ry={r * 1.02} fill={PAPER} />
      {/* the iris, pushed toward the light so the eye has a direction */}
      <circle cx={cx - r * 0.1} cy={cy - r * 0.06} r={r * 0.6} fill={iris} />
      <circle cx={cx - r * 0.1} cy={cy - r * 0.06} r={r * 0.29} fill={INK} />
      <circle cx={cx - r * 0.36} cy={cy - r * 0.38} r={r * 0.21} fill={PAPER} />
      <circle cx={cx + r * 0.24} cy={cy + r * 0.3} r={r * 0.09} fill={PAPER} opacity="0.75" />
      {/* the lid: a filled mass bowed across the top of the sclera */}
      <path
        d={`M${cx - r} ${cy} a${r} ${r} 0 0 1 ${r * 2} 0 q${-r} ${drop} ${-r * 2} 0 z`}
        fill={INK}
      />
      {/* the brow, above it, and the only line weight that carries a mood */}
      <path d={browPath} stroke={INK} strokeWidth={r * 0.42} strokeLinecap="round" fill="none" />
    </g>
  );
}

/* ------------------------------------------------------------- toron: mail */
// The feature only toron has is that a message is signed by a key and sealed so
// a relay cannot read it, so the accessory is not a generic wax blob: the seal
// is stamped with a keyhole, which is identity and secrecy in one mark. Resting
// it is half-lidded, because a transport that has already signed the mail has no
// reason to look excited. Working, the lids come up and the seal catches the
// light, because signing is the job.

export function ToronMascot({ className }: MascotProps) {
  const id = "toron";
  const r = RAMPS.violet;
  const body = (
    <g>
      <Ground id={id} cy={82} rx={30} />
      <g filter={`url(#${id}-edge)`}>
        {/* the envelope: one form, no outline, the flap cut in value */}
        <path
          d="M19 30h58a6 6 0 0 1 6 6v26a6 6 0 0 1-6 6H19a6 6 0 0 1-6-6V36a6 6 0 0 1 6-6z"
          fill={`url(#${id}-flat)`}
        />
        {/* the flap, a shade deeper so the fold reads without a line */}
        <path d="M13 34 48 57 83 34v3.5L48 60.5 13 37.5z" fill={r.deep} opacity="0.55" />
      </g>
      {/* the rim, along the bottom edge, so the form lifts off the dark tile */}
      <path
        d="M19 68h58a6 6 0 0 0 6-6v1.5a6 6 0 0 1-6 6H19a6 6 0 0 1-6-6V62a6 6 0 0 0 6 6z"
        fill={`url(#${id}-rim)`}
      />
      <g data-mood="rest">
        <Eye cx={35} cy={45} iris={r.ink} brow="half" r={9.5} lid={0.34} />
        <Eye cx={61} cy={45} iris={r.ink} brow="half" r={9.5} lid={0.34} />
        <circle cx="48" cy="64" r="10" fill={RAMPS.amber.body} opacity="0.92" />
        <circle cx="44.5" cy="62" r="2.4" fill={INK} />
        <path
          d="M44.5 65v5l-1.4 1.4"
          stroke={INK}
          strokeWidth="2.4"
          strokeLinecap="round"
          fill="none"
          opacity="0.75"
        />
      </g>
      <g data-mood="work">
        {/* the seal is lit while it is working, and the eyes are up */}
        <circle
          cx="48"
          cy="64"
          r="15"
          fill={RAMPS.amber.hi}
          opacity="0.34"
          filter={`url(#${id}-soft)`}
        />
        <Eye cx={35} cy={45} iris={r.ink} brow="hard" r={9.5} />
        <Eye cx={61} cy={45} iris={r.ink} brow="hard" r={9.5} />
        <circle cx="48" cy="64" r="10" fill={RAMPS.amber.hi} />
        <circle cx="44.5" cy="62" r="2.4" fill={INK} />
        <path
          d="M44.5 65v5l-1.4 1.4"
          stroke={INK}
          strokeWidth="2.4"
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
      scale={1.14}
    >
      {body}
    </Tile>
  );
}

/* ---------------------------------------------------------- flywheel: spin */
// The feature only flywheel has is that it never stops, so the wheel is caught
// mid-turn with its rim smeared and one spoke thrown clear as the dispatch arm.
// Resting it is still turning, because resting is not a thing this plane does;
// working adds the full set of arcs and the brows come down.

export function FlywheelMascot({ className }: MascotProps) {
  const id = "flywheel";
  const r = RAMPS.violet;
  const hub = RAMPS.green;
  const wheel = (
    <g>
      {/* the smeared rim: the outer band is soft and the spokes are drawn under
          it, so the wheel reads as turning rather than as a gear icon */}
      <g filter={`url(#${id}-soft)`} opacity="0.5">
        <circle cx="48" cy="46" r="30" fill="none" stroke={r.body} strokeWidth="5" />
      </g>
      <g filter={`url(#${id}-edge)`}>
        <circle cx="48" cy="46" r="25" fill={`url(#${id}-round)`} />
        <circle cx="48" cy="46" r="17" fill={r.deep} opacity="0.85" />
      </g>
      <g stroke={r.bounce} strokeWidth="2.6" strokeLinecap="round" opacity="0.55" fill="none">
        <path d="M48 26v8M48 58v8M28 46h8M60 46h8" />
      </g>
      {/* the dispatch arm: one spoke thrown clear, with the job on its end */}
      <path
        d="M48 46 48 15"
        stroke={r.bounce}
        strokeWidth="4"
        strokeLinecap="round"
        opacity="0.9"
      />
      <path d="M43 20 48 12l5 8z" fill={hub.hi} />
      <g filter={`url(#${id}-edge)`}>
        <circle cx="48" cy="46" r="14" fill={`url(#${id}-hub)`} />
      </g>
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
        <radialGradient id={`${id}-hub`} cx={LIGHT.x} cy={LIGHT.y} r="0.9">
          <stop offset="0" stopColor={hub.hi} />
          <stop offset="0.3" stopColor={hub.body} />
          <stop offset="0.78" stopColor={hub.deep} />
          <stop offset="1" stopColor={hub.bounce} />
        </radialGradient>
      </defs>
      <Ground id={id} cy={84} rx={26} />
      <g data-mood="rest">
        <g stroke={r.bounce} strokeLinecap="round" fill="none" opacity="0.4">
          <path d="M22 27a30 30 0 0 1 13-12" strokeWidth="4.5" />
        </g>
        {wheel}
        <Eye cx={43} cy={46} iris={hub.ink} brow="angry" r={7.5} lid={0.12} />
        <Eye cx={55} cy={46} iris={hub.ink} brow="angry" r={7.5} lid={0.12} />
      </g>
      <g data-mood="work">
        {/* the full set of arcs: the difference between turning and dispatching */}
        <g stroke={r.bounce} strokeLinecap="round" fill="none">
          <path d="M22 27a30 30 0 0 1 13-12" strokeWidth="4.5" opacity="0.75" />
          <path d="M74 65a30 30 0 0 1-13 12" strokeWidth="4.5" opacity="0.75" />
          <path d="M13 58a32 32 0 0 0 4 13" stroke={MUTED} strokeWidth="3" opacity="0.5" />
          <path d="M83 34a32 32 0 0 0-4-13" stroke={MUTED} strokeWidth="3" opacity="0.5" />
        </g>
        {wheel}
        <Eye cx={43} cy={46} iris={hub.ink} brow="hard" r={7.5} />
        <Eye cx={55} cy={46} iris={hub.ink} brow="hard" r={7.5} />
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
      {/* the earlier links, falling away up and to the left, each one dimmer
          than the one in front because they are further from the light */}
      <g filter={`url(#${id}-soft)`}>
        <circle cx="26" cy="26" r="9" fill={r.deep} opacity="0.5" />
        <circle cx="36" cy="16" r="6.5" fill={r.deep} opacity="0.32" />
      </g>
      <path
        d="M26 26 36 16"
        stroke={r.deep}
        strokeWidth="3.4"
        strokeLinecap="round"
        opacity="0.5"
        fill="none"
      />
      <g filter={`url(#${id}-edge)`}>
        <circle cx="54" cy="56" r="27" fill={`url(#${id}-round)`} />
      </g>
      <path d="M27 56a27 27 0 0 0 27 27 27 27 0 0 0 27-27z" fill={`url(#${id}-rim)`} />
    </g>
  );
  return (
    <Tile
      id={id}
      ramp={r}
      label="Beads, the work-evidence plane: a chain of work items"
      className={className}
    >
      <Ground id={id} cy={88} rx={24} />
      {chain}
      <g data-mood="rest">
        <Eye cx={45} cy={54} iris={r.ink} brow="flat" r={10} />
        <Eye cx={63} cy={54} iris={r.ink} brow="flat" r={10} />
      </g>
      <g data-mood="work">
        {/* the bead stamped shut, and the gate latched: close needs evidence */}
        <Eye cx={45} cy={54} iris={r.ink} brow="hard" r={10} />
        <Eye cx={63} cy={54} iris={r.ink} brow="hard" r={10} />
        <path
          d="M40 74q8 7 16 0"
          fill="none"
          stroke={r.ink}
          strokeWidth="3.4"
          strokeLinecap="round"
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
      {/* two stores, two colours, one spine. This is the closest the set gets
          to the reference's teal, and the reason the green exists. */}
      <path d="M48 34c-9-6-20-7-28-5v34c8-2 19-1 28 5z" fill={`url(#${id}-know)`} />
      <path d="M48 34c9-6 20-7 28-5v34c-8-2-19-1-28 5z" fill={`url(#${id}-mem)`} />
      {/* the spine, a deep seam rather than a drawn line */}
      <path d="M46.6 33.2h2.8v35.6h-2.8z" fill={INK} opacity="0.55" />
    </g>
  );
  return (
    <Tile
      id={id}
      ramp={k}
      label="Chiebukuro, the knowledge and memory plane: an open book synthesising across its spine"
      className={className}
      scale={1.06}
    >
      <defs>
        <radialGradient id={`${id}-know`} cx={LIGHT.x} cy={LIGHT.y} r="0.95">
          <stop offset="0" stopColor={k.hi} />
          <stop offset="0.3" stopColor={k.body} />
          <stop offset="0.8" stopColor={k.deep} />
          <stop offset="1" stopColor={k.bounce} />
        </radialGradient>
        <radialGradient id={`${id}-mem`} cx={LIGHT.x} cy={LIGHT.y} r="0.95">
          <stop offset="0" stopColor={v.hi} />
          <stop offset="0.3" stopColor={v.body} />
          <stop offset="0.8" stopColor={v.deep} />
          <stop offset="1" stopColor={v.bounce} />
        </radialGradient>
      </defs>
      <Ground id={id} cy={78} rx={28} />
      {pages}
      {/* the rim along the bottom of each page */}
      <path d="M20 63c8-2 19-1 28 5v3.4c-9-6-20-7-28-5z" fill={k.bounce} opacity="0.5" />
      <path d="M76 63c-8-2-19-1-28 5v3.4c9-6 20-7 28-5z" fill={v.bounce} opacity="0.5" />
      <g data-mood="rest">
        <g stroke={AMBER} strokeWidth="2.6" strokeLinecap="round" opacity="0.35" fill="none">
          <path d="M48 22v-7" />
          <path d="M40 24 36 18" />
          <path d="M56 24 60 18" />
        </g>
        <Eye cx={34} cy={48} iris={k.ink} brow="half" r={9} lid={0.3} />
        <Eye cx={62} cy={48} iris={v.ink} brow="half" r={9} lid={0.3} />
      </g>
      <g data-mood="work">
        {/* synthesis, lit: the join between the two stores doing its job */}
        <circle cx="48" cy="15" r="9" fill={AMBER} opacity="0.4" filter={`url(#${id}-soft)`} />
        <g stroke={AMBER} strokeWidth="3" strokeLinecap="round" fill="none">
          <path d="M48 22v-8" />
          <path d="M39 24 34 17" />
          <path d="M57 24 62 17" />
        </g>
        <circle cx="48" cy="13" r="3.6" fill={AMBER} />
        <Eye cx={34} cy={48} iris={k.ink} brow="raised" r={9} />
        <Eye cx={62} cy={48} iris={v.ink} brow="raised" r={9} />
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
