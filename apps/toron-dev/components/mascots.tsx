// governed-by: ADR-0004 D1/D2
//
// The four plane characters.
//
// WHAT THESE ARE
//
// Four enamel toys: a plush body, a glossy surface, one small warm signal, and
// a face that takes itself completely seriously. Each body is the plane's own
// noun, because the noun is the fastest way to say what the plane does, and the
// face is what makes it a character instead of an icon.
//
// THE RENDER MODEL
//
// The target is a soft-goods product render, not flat vector art. The reference
// this is drawn against was measured, and it is almost entirely smooth shading:
// 1.7% of its pixels sit on a hard edge and 57% sit on a gentle ramp, over 3199
// distinct tones. Nothing in it is a line.
//
// So form comes from light, and every surface gets the same five passes in the
// same order:
//
//   1. A base ramp, thrown from one light for the whole set. It runs from a
//      near-white tint on the lit shoulder through the hue's body and down to a
//      deep core, then LIFTS again at the very bottom. That last stop is bounce
//      light coming back off the ground, and leaving it out is what makes a form
//      read as a sticker.
//   2. A broad specular: a soft white wash over the lit quadrant. This is the
//      single strongest 3D cue, because it is the reflection of a room.
//   3. A tight gloss dot on top of it. Two tiers of highlight is what separates
//      glossy from matte, and it is the first thing to drop when the drawing is
//      small, so it is tagged `data-detail`.
//   4. Ambient occlusion, where two forms meet. Contact darkening is what makes
//      one shape sit ON another instead of beside it.
//   5. A bounce crescent along the lower-back edge, in a desaturated lift.
//
// THE PALETTE IS ONE HUE.
//
// All four characters are the locked accent plus paper, with a single amber
// signal each. The reference holds three hue families and no more, and a set
// that spends four different hues on four characters reads as a sticker sheet
// rather than as a family. Form distinguishes the characters here; colour is the
// brand, and the brand does not change four times in one row.
//
// WHAT IS DELIBERATELY ABSENT
//
// No outline anywhere. No tile behind the character: an opaque dark square
// around a lit object turns an illustration into a favicon and drags the mean
// luminance of the whole picture into the floor. No grain and no noise pass,
// which on a dark tile is dirt rather than texture. And nothing near black: the
// deepest tone in the set measures 39/255, against a reference floor of 40, so
// the shadows stay coloured and the whole picture stays high-key.
//
// EXPRESSION
//
// Each character carries a resting and a working face in one SVG, and the stack
// strip cross-fades between them on a slow stagger. They are two different
// faces, not one face with parts moved: different lids, different brows, and in
// the working mood a different state of the plane's own signal.

import type { ReactNode } from "react";

type MascotProps = { className?: string };

const PAPER = "#f7f8f8"; // --toron-ink; the specular and the sclera
const AMBER = "#f2c94c"; // --toron-amber; the one warm note
const AMBER_HI = "#fdf0bd";

/**
 * One light for the whole set, so the four read as one photoshoot. Every
 * gradient in this file is thrown from it.
 */
const LIGHT = { x: "0.32", y: "0.22" };

/**
 * A value ramp: every stop is a tonal step of the locked accent, plus paper. The
 * bounce stop being lighter than the core is the whole trick, and the ink stop
 * is the deepest tone the set is allowed to reach, which is a dark indigo and
 * never black.
 */
type Ramp = {
  hi: string;
  body: string;
  mid: string;
  deep: string;
  deeper: string;
  bounce: string;
  ink: string;
};

const ENAMEL: Ramp = {
  hi: "#ccd2ff",
  body: "#828fff",
  mid: "#5e6ad2",
  deep: "#454fa6",
  deeper: "#333a80",
  bounce: "#6d76d6",
  ink: "#20254f",
};

/**
 * The five passes, as gradients and blurs, namespaced per character so four of
 * these can share a page.
 */
function Enamel({ id, extra }: { id: string; extra?: ReactNode }) {
  return (
    <defs>
      {/* 1. the base ramp, across a form the light is standing off to the left of */}
      <radialGradient id={`${id}-body`} cx={LIGHT.x} cy={LIGHT.y} r="0.95">
        <stop offset="0" stopColor={ENAMEL.hi} />
        <stop offset="0.18" stopColor="#a3acff" />
        <stop offset="0.38" stopColor={ENAMEL.body} />
        <stop offset="0.58" stopColor={ENAMEL.mid} />
        <stop offset="0.76" stopColor={ENAMEL.deep} />
        <stop offset="0.9" stopColor={ENAMEL.deeper} />
        <stop offset="1" stopColor={ENAMEL.bounce} />
      </radialGradient>
      {/* the same ramp for a form turned away from the light, so a face that
          should recede does not read as the lit one */}
      <radialGradient id={`${id}-far`} cx="0.62" cy="0.34" r="0.95">
        <stop offset="0" stopColor={ENAMEL.body} />
        <stop offset="0.34" stopColor={ENAMEL.mid} />
        <stop offset="0.68" stopColor={ENAMEL.deep} />
        <stop offset="0.9" stopColor={ENAMEL.deeper} />
        <stop offset="1" stopColor={ENAMEL.bounce} />
      </radialGradient>
      {/* 2. the broad specular. Most of the falloff is spent in the first third:
          a reflection has a bright core and a fast shoulder, and a highlight
          that fades linearly to its rim reads as a painted-on blob */}
      <radialGradient id={`${id}-spec`} cx="0.5" cy="0.5" r="0.5">
        <stop offset="0" stopColor={PAPER} stopOpacity="0.72" />
        <stop offset="0.3" stopColor={PAPER} stopOpacity="0.3" />
        <stop offset="0.72" stopColor={PAPER} stopOpacity="0.07" />
        <stop offset="1" stopColor={PAPER} stopOpacity="0" />
      </radialGradient>
      {/* 3. the tight gloss, for the second tier of highlight */}
      <radialGradient id={`${id}-gloss`} cx="0.5" cy="0.5" r="0.5">
        <stop offset="0" stopColor={PAPER} stopOpacity="0.95" />
        <stop offset="0.55" stopColor={PAPER} stopOpacity="0.5" />
        <stop offset="1" stopColor={PAPER} stopOpacity="0" />
      </radialGradient>
      {/* 4. contact darkening */}
      <radialGradient id={`${id}-ao`} cx="0.5" cy="0.5" r="0.5">
        <stop offset="0" stopColor={ENAMEL.ink} stopOpacity="0.55" />
        <stop offset="0.6" stopColor={ENAMEL.ink} stopOpacity="0.24" />
        <stop offset="1" stopColor={ENAMEL.ink} stopOpacity="0" />
      </radialGradient>
      {/* the terminator: the band where the surface turns away from the light.
          A radial falloff alone spreads one slow value change over the whole
          form; a rendered object turns fast at the terminator and barely moves
          anywhere else, and that band is most of the difference between a shaded
          form and a tinted one. Peak alpha is kept well under the contact
          darkening's, because a terminator is a soft shoulder and not a crease. */}
      <radialGradient id={`${id}-term`} cx="0.5" cy="0.5" r="0.5">
        <stop offset="0" stopColor={ENAMEL.deeper} stopOpacity="0.42" />
        <stop offset="0.52" stopColor={ENAMEL.deeper} stopOpacity="0.2" />
        <stop offset="1" stopColor={ENAMEL.deeper} stopOpacity="0" />
      </radialGradient>
      {/* 5. the bounce crescent: transparent above, lift at the bottom edge */}
      <linearGradient id={`${id}-rim`} x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor={ENAMEL.bounce} stopOpacity="0" />
        <stop offset="0.7" stopColor={ENAMEL.bounce} stopOpacity="0" />
        <stop offset="1" stopColor={ENAMEL.bounce} stopOpacity="0.7" />
      </linearGradient>
      <filter id={`${id}-edge`} x="-14%" y="-14%" width="128%" height="128%">
        <feGaussianBlur stdDeviation="0.7" />
      </filter>
      <filter id={`${id}-soft`} x="-45%" y="-45%" width="190%" height="190%">
        <feGaussianBlur stdDeviation="2.6" />
      </filter>
      <filter id={`${id}-wide`} x="-70%" y="-70%" width="240%" height="240%">
        <feGaussianBlur stdDeviation="5" />
      </filter>
      {extra}
    </defs>
  );
}

/**
 * The transparent stage.
 *
 * There is no tile, no frame and no ground shadow. A lit object on a dark page
 * separates by value, not by a rectangle drawn around it, and the reference
 * floats on transparency for the same reason. `scale` is the intended optical
 * size: an envelope and a wheel are different shapes, so left alone their boxes
 * drift apart and the row stops reading as one set.
 */
function Stage({
  id,
  children,
  label,
  className,
  scale = 1,
}: {
  id: string;
  children: ReactNode;
  label: string;
  className?: string;
  scale?: number;
}) {
  return (
    <svg
      viewBox="0 0 96 96"
      className={className ? `toron-mascot ${className}` : "toron-mascot"}
      role="img"
      aria-label={label}
      xmlns="http://www.w3.org/2000/svg"
    >
      <Enamel id={id} />
      <g
        data-mascot-art
        transform={scale === 1 ? undefined : `translate(48 48) scale(${scale}) translate(-48 -48)`}
      >
        {children}
      </g>
    </svg>
  );
}

/**
 * The broad specular and the tight gloss under it, for a form lying in the
 * light. Passed as a pair because one without the other is the difference
 * between a matte and a glossy surface, and it is a decision, not a detail.
 */
function Spec({
  id,
  cx,
  cy,
  rx,
  ry,
  rot = 0,
  gloss = 0.5,
}: {
  id: string;
  cx: number;
  cy: number;
  rx: number;
  ry: number;
  rot?: number;
  gloss?: number;
}) {
  // Tightened slightly at the call site rather than at every call site: a
  // highlight sized to its form reads as a wash, and every one of these wanted
  // to be smaller than the first draft drew it.
  rx *= 0.8;
  ry *= 0.8;
  return (
    <g transform={rot ? `rotate(${rot} ${cx} ${cy})` : undefined}>
      <ellipse cx={cx} cy={cy} rx={rx} ry={ry} fill={`url(#${id}-spec)`} />
      <ellipse
        data-detail
        cx={cx - rx * gloss * 0.35}
        cy={cy - ry * gloss * 0.45}
        rx={rx * 0.3 * gloss * 2}
        ry={ry * 0.34 * gloss * 2}
        fill={`url(#${id}-gloss)`}
      />
    </g>
  );
}

/**
 * A terminator: the soft shoulder where a form turns out of the light. Placed
 * off-centre on the shadow side, so the value change lands across the middle of
 * the form instead of being spread evenly over all of it.
 */
function Term({
  id,
  cx,
  cy,
  rx,
  ry,
  rot = 0,
  wide = false,
}: {
  id: string;
  cx: number;
  cy: number;
  rx: number;
  ry: number;
  rot?: number;
  wide?: boolean;
}) {
  return (
    <ellipse
      cx={cx}
      cy={cy}
      rx={rx}
      ry={ry}
      fill={`url(#${id}-term)`}
      filter={`url(#${id}-${wide ? "wide" : "soft"})`}
      transform={rot ? `rotate(${rot} ${cx} ${cy})` : undefined}
      pointerEvents="none"
    />
  );
}

/** Contact darkening, for where one mass sits on another. */
function Occlude({
  id,
  cx,
  cy,
  rx,
  ry,
}: {
  id: string;
  cx: number;
  cy: number;
  rx: number;
  ry: number;
}) {
  return (
    <ellipse
      cx={cx}
      cy={cy}
      rx={rx}
      ry={ry}
      fill={`url(#${id}-ao)`}
      filter={`url(#${id}-soft)`}
      pointerEvents="none"
    />
  );
}

/**
 * One eye.
 *
 * The sclera is warm paper, the iris is large enough to carry a colour, and the
 * lid is a filled mass rather than a stroke, because a heavy-lidded look cannot
 * be drawn with a line. There are two catchlights: one large on the lit side,
 * and a second, smaller one opposite it, because a wet eye has two lights in it
 * and one makes it look like glass.
 *
 * The face is the one part of the character drawn without blur. Everything else
 * is soft paint; the eyes stay sharp, and that contrast is most of why the set
 * reads as rendered rather than filtered.
 */
function Eye({
  cx,
  cy,
  r = 9,
  brow = "flat",
  lid = 0,
}: {
  cx: number;
  cy: number;
  r?: number;
  brow?: "flat" | "angry" | "raised" | "half" | "hard";
  /** 0 is wide open, 1 is shut. */
  lid?: number;
}) {
  // How far the lid mass drops over the top of the eye. Half a unit of rest even
  // when open, because a lid sitting exactly on the rim looks like no lid.
  const drop = r * 0.18 + r * lid * 0.9;
  const browY = cy - r - r * (0.44 + lid * 0.28);
  const browPath = {
    flat: `M${cx - r * 0.9} ${browY} q${r * 0.9} -${r * 0.2} ${r * 1.8} 0`,
    angry: `M${cx - r * 1.05} ${browY + r * 0.34} q${r * 0.95} -${r * 0.42} ${r * 1.9} -${r * 0.3}`,
    raised: `M${cx - r * 0.9} ${browY - r * 0.32} q${r * 0.9} ${r * 0.3} ${r * 1.8} 0`,
    half: `M${cx - r * 0.95} ${browY + r * 0.06} q${r * 0.95} -${r * 0.12} ${r * 1.9} 0`,
    hard: `M${cx - r * 1.02} ${browY + r * 0.2} q${r * 0.95} -${r * 0.3} ${r * 1.88} -${r * 0.16}`,
  }[brow];
  return (
    <g>
      <ellipse cx={cx} cy={cy} rx={r} ry={r * 1.03} fill={PAPER} />
      {/* the eyeball's own shading: paper at the top, cooling toward the bottom,
          so the sclera is a sphere rather than a hole */}
      <ellipse
        cx={cx}
        cy={cy + r * 0.3}
        rx={r * 0.98}
        ry={r * 0.72}
        fill={ENAMEL.body}
        opacity="0.5"
      />
      <circle cx={cx - r * 0.1} cy={cy - r * 0.04} r={r * 0.62} fill={ENAMEL.mid} />
      <circle cx={cx - r * 0.08} cy={cy - r * 0.02} r={r * 0.3} fill={ENAMEL.ink} />
      <circle cx={cx - r * 0.38} cy={cy - r * 0.4} r={r * 0.22} fill={PAPER} />
      {/* the second light, which is what stops the eye looking like glass. Half
          a unit across on a 96 tile, so it is the first thing to go when the
          character is small. */}
      <circle
        data-detail
        cx={cx + r * 0.26}
        cy={cy + r * 0.32}
        r={r * 0.1}
        fill={PAPER}
        opacity="0.8"
      />
      <path
        d={`M${cx - r} ${cy} a${r} ${r} 0 0 1 ${r * 2} 0 q${-r} ${drop} ${-r * 2} 0 z`}
        fill={ENAMEL.deeper}
      />
      <path
        d={browPath}
        stroke={ENAMEL.ink}
        strokeWidth={r * 0.4}
        strokeLinecap="round"
        fill="none"
      />
    </g>
  );
}

/* ------------------------------------------------------------ toron · mail */
// An envelope with its flap closed, which is the one silhouette that says mail
// before any copy does. The fold is what sells it: the flap's two wings catch
// the light and the seam between them is a soft valley, so the paper reads as
// folded rather than printed. The seal below the point is wax, so it is the one
// warm note on the character and it is what the working mood lights up.

export function ToronMascot({ className }: MascotProps) {
  const id = "toron";
  return (
    <Stage
      id={id}
      label="Toron, the signed-mail plane: an envelope sealed with a wax stamp"
      className={className}
    >
      <g transform="rotate(-4 48 52)">
        {/* the paper's own thickness, showing above the front panel: a lit edge
            is a cheaper way to say "this is a sheet" than drawing a side */}
        <rect x="13" y="27.5" width="70" height="50" rx="11" fill={ENAMEL.bounce} />
        <g filter={`url(#${id}-edge)`}>
          <rect x="13" y="30" width="70" height="50" rx="11" fill={`url(#${id}-body)`} />
        </g>
        {/* the flap: two wings meeting at the point, each turned a little from
            the front so the fold reads in value alone */}
        <g filter={`url(#${id}-edge)`}>
          <path d="M15.5 33 48 57.5 80.5 33v4.6L48 62.6 15.5 37.6z" fill={ENAMEL.mid} />
          <path
            d="M15.5 33 48 57.5 80.5 33v3.2L48 60.4 15.5 36.2z"
            fill={ENAMEL.body}
            opacity="0.75"
          />
        </g>
        {/* the fold along the top of each wing, lit rather than drawn */}
        <path
          d="M15.5 33 48 57.5 80.5 33v1.5L48 55.8 15.5 34.5z"
          fill={ENAMEL.hi}
          opacity="0.55"
          filter={`url(#${id}-edge)`}
        />
        {/* the seam, as a valley rather than a line */}
        <Occlude id={id} cx={48} cy={55} rx={17} ry={4.5} />
        <Spec id={id} cx={34} cy={42} rx={21} ry={13} rot={-30} />
        {/* the underside of each wing, and the panel turning away from the
            light toward the bottom corner */}
        <Term id={id} cx={30} cy={47} rx={12} ry={5} rot={-30} />
        <Term id={id} cx={66} cy={47} rx={12} ry={5} rot={30} />
        <Term id={id} cx={67} cy={67} rx={25} ry={16} rot={-22} />
        {/* the bounce crescent along the bottom edge of the panel */}
        <path
          d="M13 69a11 11 0 0 0 11 11h48a11 11 0 0 0 11-11 11 11 0 0 1-11 8H24a11 11 0 0 1-11-8z"
          fill={`url(#${id}-rim)`}
        />
        <g data-mood="rest">
          <Eye cx={35} cy={41} r={8.6} brow="half" lid={0.32} />
          <Eye cx={61} cy={41} r={8.6} brow="half" lid={0.32} />
          <Seal id={id} lit={false} />
        </g>
        <g data-mood="work">
          <Eye cx={35} cy={41} r={8.6} brow="hard" />
          <Eye cx={61} cy={41} r={8.6} brow="hard" />
          <Seal id={id} lit />
        </g>
      </g>
    </Stage>
  );
}

/** The wax seal. Dim at rest, catching the light while the plane is signing. */
function Seal({ id, lit }: { id: string; lit: boolean }) {
  return (
    <g>
      {lit ? (
        <circle cx="48" cy="71" r="15" fill={AMBER_HI} opacity="0.3" filter={`url(#${id}-soft)`} />
      ) : null}
      <Occlude id={id} cx={48} cy={72.5} rx={10.5} ry={4} />
      <circle cx="48" cy="71" r="9.4" fill={lit ? AMBER_HI : AMBER} />
      <Spec id={id} cx={44.5} cy={68} rx={6.5} ry={4.5} rot={-35} gloss={0.7} />
      {/* the keyhole: identity and secrecy in one mark */}
      <circle cx="47" cy="70" r="2.5" fill={ENAMEL.ink} opacity="0.85" />
      <path
        d="M47 71.2v4.4l-1.5 1.4"
        stroke={ENAMEL.ink}
        strokeWidth="2.4"
        strokeLinecap="round"
        fill="none"
        opacity="0.72"
        data-detail
      />
    </g>
  );
}

/* -------------------------------------------------------- flywheel · spin */
// A heavy wheel caught mid-turn: the rim is the mass, the spokes are cast, and
// the hub is the head. The whole assembly is leaned over, because a wheel drawn
// face-on is a ring and a wheel drawn at an angle is an object with a near edge
// and a far edge, which is the difference between a diagram and a render.
//
// A WHEEL, NOT A GEAR. The interior stays open and nothing is toothed. A gear is
// a thin disc with teeth cut into its edge; a flywheel is a rim with the middle
// open and the spokes crossing it.

export function FlywheelMascot({ className }: MascotProps) {
  const id = "flywheel";
  // Outer and inner circle in opposite winding, so the even-odd rule leaves the
  // interior open and the tile shows through.
  const rim = "M14 48a34 34 0 1 0 68 0a34 34 0 1 0-68 0zM26 48a22 22 0 1 1 44 0a22 22 0 1 1-44 0z";
  const spoke = "M46 34.4 46.9 24.5h2.2l.9 9.9z";
  return (
    <Stage
      id={id}
      label="Flywheel, the orchestration plane: a flywheel caught mid-turn, dispatching a job"
      className={className}
    >
      <g transform="rotate(-15 48 48)">
        {/* the trail: a soft arc outside the rim. This is the only thing in the
            picture that says the wheel is moving rather than parked. */}
        <g
          filter={`url(#${id}-wide)`}
          opacity="0.4"
          fill="none"
          stroke={ENAMEL.body}
          strokeLinecap="round"
        >
          <path d="M17 29a34 34 0 0 1 22-13" strokeWidth="7" />
          <path d="M79 67a34 34 0 0 1-22 13" strokeWidth="7" />
        </g>
        <g filter={`url(#${id}-edge)`}>
          <path d={rim} fill={`url(#${id}-body)`} fillRule="evenodd" />
        </g>
        {/* the far inner wall of the ring, which is the surface the spokes are
            cast into and the reason the rim has thickness */}
        <g filter={`url(#${id}-soft)`} opacity="0.9">
          <path d="M27 48a21 21 0 0 0 42 0 21 21 0 0 1-42 0z" fill={ENAMEL.ink} opacity="0.42" />
        </g>
        {/* the spokes, crossing the open middle */}
        <g fill={ENAMEL.deeper} opacity="0.85">
          {[0, 60, 120, 180, 240, 300].map((a) => (
            <path key={a} d={spoke} transform={`rotate(${a} 48 48)`} />
          ))}
        </g>
        <g fill={ENAMEL.bounce} opacity="0.5">
          {[0, 60, 120, 180, 240, 300].map((a) => (
            <path key={a} d={spoke} transform={`rotate(${a + 4} 48 48)`} />
          ))}
        </g>
        <Spec id={id} cx={31} cy={31} rx={19} ry={15} rot={-38} gloss={0.55} />
        {/* the rim is a tube, not a ring: a lit bevel along its outer top edge
            and the terminator running across its lower right */}
        <path
          d="M20 30a34 34 0 0 1 56 0"
          fill="none"
          stroke={ENAMEL.hi}
          strokeWidth="3.2"
          opacity="0.5"
          filter={`url(#${id}-edge)`}
        />
        <Term id={id} cx={69} cy={68} rx={25} ry={19} rot={-14} wide />
        <path
          d="M20 64a34 34 0 0 0 52 6 34 34 0 0 1-52-6z"
          fill={`url(#${id}-rim)`}
          opacity="0.9"
        />
        {/* the hub, and the head on it */}
        <g filter={`url(#${id}-edge)`}>
          <circle cx="48" cy="48" r="17.5" fill={`url(#${id}-body)`} />
        </g>
        <Occlude id={id} cx={48} cy={64} rx={13} ry={5} />
        <Spec id={id} cx={42} cy={40} rx={14} ry={10} rot={-36} gloss={0.6} />
        {/* the dispatch arm: one spoke thrown clear of the rim, with the job on
            its end. Amber, because it is the plane's own warm note. */}
        <path
          d="M48 31 48 9"
          stroke={ENAMEL.deeper}
          strokeWidth="4.4"
          strokeLinecap="round"
          opacity="0.9"
        />
        <path d="M42.4 12.5 48 3.6l5.6 8.9z" fill={AMBER} />
        <g data-mood="rest">
          <Eye cx={41} cy={48} r={7.8} brow="angry" lid={0.16} />
          <Eye cx={56} cy={48} r={7.8} brow="angry" lid={0.16} />
        </g>
        <g data-mood="work">
          <Eye cx={41} cy={48} r={7.8} brow="hard" />
          <Eye cx={56} cy={48} r={7.8} brow="hard" />
          {/* dispatching, not merely turning: a second, shorter trail set, and
              the tip catches the light */}
          <g stroke={ENAMEL.hi} strokeLinecap="round" fill="none" opacity="0.85">
            <path d="M14 58a36 36 0 0 0 5 13" strokeWidth="3.2" />
            <path d="M82 38a36 36 0 0 0-5-13" strokeWidth="3.2" />
          </g>
          <circle cx="48" cy="6" r="7" fill={AMBER_HI} opacity="0.45" filter={`url(#${id}-soft)`} />
        </g>
      </g>
    </Stage>
  );
}

/* ------------------------------------------------------------ beads · proof */
// A strand of work items falling into the light, the front one carrying the
// face. The nearest bead is the biggest and the brightest and the far ones are
// smaller and closer in value to the background, which is aerial perspective and
// is what puts them behind it rather than next to it.
//
// Each bead rests on the one in front of it, so every contact carries an
// occlusion and the strand reads as a chain rather than as four circles.

export function BeadsMascot({ className }: MascotProps) {
  const id = "beads";
  const beads = [
    { cx: 30, cy: 21, r: 7.5, far: 0.55 },
    { cx: 38.5, cy: 37, r: 10.5, far: 0.35 },
    { cx: 54, cy: 60, r: 19.5, far: 0 },
  ];
  const front = beads[beads.length - 1];
  return (
    <Stage
      id={id}
      label="Beads, the work-evidence plane: a strand of beads, the front one stamped shut"
      className={className}
      scale={1.04}
    >
      {/* the path the earlier links came along, behind them */}
      <path
        d="M30 21 38.5 37 54 60"
        stroke={ENAMEL.deeper}
        strokeWidth="4"
        strokeLinecap="round"
        fill="none"
        opacity="0.4"
        filter={`url(#${id}-soft)`}
      />
      {beads.map((b) => (
        <g key={b.cx}>
          <g filter={`url(#${id}-edge)`}>
            <circle cx={b.cx} cy={b.cy} r={b.r} fill={`url(#${id}-${b.far ? "far" : "body"})`} />
          </g>
          {/* a far bead hazes toward the light, which is what distance does */}
          {b.far ? (
            <circle cx={b.cx} cy={b.cy} r={b.r} fill={ENAMEL.bounce} opacity={b.far * 0.55} />
          ) : null}
          <Spec
            id={id}
            cx={b.cx - b.r * 0.3}
            cy={b.cy - b.r * 0.38}
            rx={b.r * 0.86}
            ry={b.r * 0.72}
            rot={-30}
          />
        </g>
      ))}
      {/* every contact darkens, nearest last so the front bead's own edge is not
          buried under the shadow it casts on the ones behind */}
      <Occlude id={id} cx={47} cy={50} rx={13} ry={8} />
      <Occlude id={id} cx={33} cy={29} rx={8} ry={5} />
      {/* the front bead turns out of the light on its lower right, and the one
          behind it sits further into the shadow of its own neighbour */}
      <Term id={id} cx={front.cx + 12} cy={front.cy + 10} rx={12} ry={9} rot={-28} />
      <Term id={id} cx={30} cy={25} rx={8} ry={6} rot={-30} />
      <path
        d={`M${front.cx - front.r} ${front.cy + front.r * 0.6}a${front.r} ${front.r} 0 0 0 ${front.r * 2} 0 ${front.r} ${front.r} 0 0 1 ${-front.r * 2} 0z`}
        fill={`url(#${id}-rim)`}
        opacity="0.85"
      />
      <g data-mood="rest">
        <Eye cx={47} cy={57} r={8.4} brow="half" lid={0.3} />
        <Eye cx={62} cy={57} r={8.4} brow="half" lid={0.3} />
        {/* the gate, standing open */}
        <path
          d="M40 73.5h5.5"
          stroke={AMBER}
          strokeWidth="3"
          strokeLinecap="round"
          fill="none"
          opacity="0.8"
        />
      </g>
      <g data-mood="work">
        <Eye cx={47} cy={57} r={8.4} brow="hard" />
        <Eye cx={62} cy={57} r={8.4} brow="hard" />
        {/* the front bead stamped shut: close needs evidence */}
        <circle cx="43" cy="73.5" r="6.4" fill={AMBER} />
        <Spec id={id} cx={41} cy={71.5} rx={4.4} ry={3} rot={-35} gloss={0.7} />
        <path
          d="M40.4 73.6l1.9 2 3.3-3.6"
          stroke={ENAMEL.ink}
          strokeWidth="1.9"
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
          opacity="0.85"
        />
      </g>
    </Stage>
  );
}

/* ------------------------------------------------------- chiebukuro · recall */
// An open book, both pages catching the light, the face across the gutter. The
// gutter is a valley rather than a line, so the two pages are one object and not
// two shapes meeting.
//
// The plane's whole argument is that it answers from two stores, so the signal
// is synthesis rising off the join: dim while it is only holding knowledge, lit
// while it is answering.

export function ChiebukuroMascot({ className }: MascotProps) {
  const id = "chiebukuro";
  const left = "M45.5 45.5c-9-7.5-20-11.4-31.5-10 0 12 1 22.5 3 31 12-2.5 21.5 0 28.5 6.5z";
  const right = "M50.5 45.5c9-7.5 20-11.4 31.5-10 0 12-1 22.5-3 31-12-2.5-21.5 0-28.5 6.5z";
  return (
    <Stage
      id={id}
      label="Chiebukuro, the knowledge and memory plane: an open book synthesising across the gutter"
      className={className}
      scale={1.1}
    >
      {/* the page block under the spread: the book has thickness, and the cream
          edge of the paper is what says so */}
      <g filter={`url(#${id}-edge)`}>
        <path
          d="M45.5 52c-9-7-19.5-10.5-30.5-9.5l-.5 10c12-2.5 21.5 0 28.5 6.5z"
          fill={PAPER}
          opacity="0.95"
        />
        <path
          d="M50.5 52c9-7 19.5-10.5 30.5-9.5l.5 10c-12-2.5-21.5 0-28.5 6.5z"
          fill={PAPER}
          opacity="0.8"
        />
      </g>
      <g filter={`url(#${id}-edge)`}>
        <path d={left} fill={`url(#${id}-body)`} />
        <path d={right} fill={`url(#${id}-far)`} />
      </g>
      {/* the gutter, as a valley */}
      <Occlude id={id} cx={48} cy={50} rx={7} ry={20} />
      <Spec id={id} cx={30} cy={44} rx={14} ry={11} rot={-42} gloss={0.6} />
      <Spec id={id} cx={68} cy={46} rx={11} ry={8} rot={-42} gloss={0.5} />
      {/* the right page has turned further from the light, and the whole spread
          sits on the block underneath it rather than floating over it */}
      <Term id={id} cx={70} cy={54} rx={15} ry={11} rot={-40} />
      <Term id={id} cx={48} cy={64} rx={26} ry={6} wide />
      <path
        d="M14 66c11-2.5 21.5 0 28.5 6.5v2.6c-9-7.5-19.5-10.5-30.5-9.5z"
        fill={`url(#${id}-rim)`}
      />
      <path
        d="M82 66c-11-2.5-21.5 0-28.5 6.5v2.6c9-7.5 19.5-10.5 30.5-9.5z"
        fill={`url(#${id}-rim)`}
      />
      <g data-mood="rest">
        <Spark id={id} lit={false} />
        <Eye cx={33} cy={48} r={8.4} brow="half" lid={0.3} />
        <Eye cx={63} cy={48} r={8.4} brow="half" lid={0.3} />
      </g>
      <g data-mood="work">
        <Spark id={id} lit />
        <Eye cx={33} cy={48} r={8.4} brow="raised" />
        <Eye cx={63} cy={48} r={8.4} brow="raised" />
      </g>
    </Stage>
  );
}

/** Synthesis rising off the join between the two stores. */
function Spark({ id, lit }: { id: string; lit: boolean }) {
  return (
    <g>
      {lit ? (
        <circle cx="48" cy="20" r="11" fill={AMBER} opacity="0.35" filter={`url(#${id}-soft)`} />
      ) : null}
      <g
        stroke={lit ? AMBER : ENAMEL.body}
        strokeWidth={lit ? 3 : 2.6}
        strokeLinecap="round"
        fill="none"
        opacity={lit ? 1 : 0.4}
      >
        <path d="M48 30v-12" />
        <path d="M40.5 31.5 34.5 23" data-detail />
        <path d="M55.5 31.5 61.5 23" data-detail />
      </g>
      {lit ? <circle cx="48" cy="16" r="3.8" fill={AMBER_HI} /> : null}
    </g>
  );
}

export const MASCOTS = {
  toron: ToronMascot,
  flywheel: FlywheelMascot,
  beads: BeadsMascot,
  chiebukuro: ChiebukuroMascot,
} as const;
