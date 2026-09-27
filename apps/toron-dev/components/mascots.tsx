// The four plane mascots.
//
// One per plane, each built from its plane's own noun and given the one feature
// that plane alone owns, a face, a single saturated accessory, and an attitude.
// The reference is the Zero to Shipped boat: a literal object for the thing
// being shipped, a chunky dark outline, big expressive eyes under a heavy lid,
// and exactly one bright accessory carrying the personality (its moustache).
// The joke is that the noun is taken completely literally and the face takes it
// seriously.
//
// The boat is painted rather than drawn. These are drawn, on purpose: at 96px
// in a sidebar a crisp silhouette with one accent reads faster than a soft
// gradient, and the site renders them at four-up where legibility wins. The
// craft budget goes into the three things that carry across the set: one
// consistent light from the upper left, real volume on every body, and a rim
// light along the lower edge, without which a dark outline vanishes into a dark
// tile.
//
// Every colour is a --toron-* token (ADR-0001 D2 locks the palette, so a mascot
// may not introduce a hue the design system does not already carry). Each sits
// on its own dark tile for the same reason favicon.svg does, which also makes
// them theme-independent, as an illustration should be.

type MascotProps = { className?: string };

const INK = "#0a0a0f"; // the outline, and the tile. ADR-0001 D2 dark default.
const PAPER = "#f7f8f8"; // --toron-ink, dark
const MUTED = "#8a8f98"; // --toron-muted, dark
const VIOLET = "#828fff"; // --toron-accent-bright
const VIOLET_DEEP = "#5e6ad2"; // --toron-accent
const GREEN = "#4cb782"; // --toron-green
const AMBER = "#f2c94c"; // --toron-amber
const AMBER_LIT = "#f7d774";
const GREEN_LIT = "#6fd3a2";
const BORDER = "#23252a"; // --toron-border

// One light direction for all four, so the set reads as one photoshoot.
const LIGHT = { x1: "0.25", y1: "0", x2: "0.7", y2: "1" };

/**
 * The dark tile every character sits on, matching favicon.svg.
 *
 * `scale` exists because a set drawn at whatever size each shape happened to
 * land at does not read as a set. An envelope is naturally wider than it is
 * tall, so its bounding box will always be smaller than a wheel's, and the fix
 * is to state the intended optical size here rather than let geometry decide it
 * by accident. render-mascots.tsx measures the result and fails if any one
 * character falls well below the others.
 */
function Tile({
  children,
  label,
  className,
  scale = 1,
}: {
  children: React.ReactNode;
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
      {/* The character is wrapped so a render check can measure the ART rather
          than the tile. The tile rect spans the whole viewBox, which would mask
          any character that painted outside its own box. Scaling about the
          middle of the tile keeps every character optically centred. */}
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
 * One eye. The reference's eyes are the whole character: white sclera, a
 * coloured iris, a hard dark upper lid, and a brow angled above it. The lid is
 * what turns a stare into a mood, so it is drawn on every eye here rather than
 * left to the iris. `lid` closes it further for the sly or tired readings.
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
  brow?: "flat" | "angry" | "raised" | "half";
  r?: number;
  lid?: number;
}) {
  const browPath = {
    flat: `M${cx - r - 2} ${cy - r - 5} q${r} -3 ${2 * r} 0`,
    angry: `M${cx - r - 3} ${cy - r - 7} q${r} 4 ${2 * r + 2} 3`,
    raised: `M${cx - r - 2} ${cy - r - 8} q${r} 2 ${2 * r} 0`,
    half: `M${cx - r - 2} ${cy - r - 4} q${r} 1 ${2 * r} 0`,
  }[brow];
  return (
    <g>
      <ellipse cx={cx} cy={cy} rx={r} ry={r + 1} fill={PAPER} />
      <circle cx={cx + 1} cy={cy + 1} r={r * 0.55} fill={iris} />
      <circle cx={cx + 1} cy={cy + 1} r={r * 0.26} fill={INK} />
      <circle cx={cx + r * 0.28} cy={cy - r * 0.34} r={r * 0.15} fill={PAPER} opacity="0.9" />
      {/* the lower lid, which the reference also has and which gives the eye depth */}
      <path
        d={`M${cx - r * 0.8} ${cy + r * (0.62 - lid)} q${r * 0.8} ${r * 0.3} ${r * 1.6} 0`}
        stroke={INK}
        strokeWidth="1.8"
        strokeLinecap="round"
        fill="none"
        opacity="0.45"
      />
      {/* the heavy upper lid: this is the mood */}
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

/** The specular blob that gives a flat fill volume, lit from the same side throughout. */
function Spec({
  cx,
  cy,
  rx,
  ry,
  rot = -24,
  o = 0.5,
}: {
  cx: number;
  cy: number;
  rx: number;
  ry: number;
  rot?: number;
  o?: number;
}) {
  return (
    <ellipse
      cx={cx}
      cy={cy}
      rx={rx}
      ry={ry}
      fill={PAPER}
      opacity={o}
      transform={`rotate(${rot} ${cx} ${cy})`}
    />
  );
}

/* ------------------------------------------------------------- toron: mail */
// The feature only toron has is that a message is signed by a key and sealed so
// a relay cannot read it. So the accessory is not a generic wax blob: it is a
// wax seal stamped with a keyhole, which is identity and secrecy in one mark.
// Half-lidded, because a transport that has already signed the mail has no
// reason to look excited about it.

export function ToronMascot({ className }: MascotProps) {
  return (
    <Tile
      label="Toron, the signed-mail plane: a sealed envelope stamped with a wax seal"
      className={className}
      scale={1.16}
    >
      <defs>
        <linearGradient id="m-toron" x1={LIGHT.x1} y1={LIGHT.y1} x2={LIGHT.x2} y2={LIGHT.y2}>
          <stop offset="0" stopColor={VIOLET} />
          <stop offset="1" stopColor={VIOLET_DEEP} />
        </linearGradient>
        <radialGradient id="m-wax" cx="0.35" cy="0.3" r="0.8">
          <stop offset="0" stopColor={AMBER_LIT} />
          <stop offset="1" stopColor={AMBER} />
        </radialGradient>
      </defs>
      <path
        d="M20 32h56a5 5 0 0 1 5 5v27a5 5 0 0 1-5 5H20a5 5 0 0 1-5-5V37a5 5 0 0 1 5-5z"
        fill="url(#m-toron)"
        stroke={INK}
        strokeWidth="3.5"
        strokeLinejoin="round"
      />
      {/* rim light along the lower edge, or the dark outline eats the silhouette */}
      <path
        d="M20 66h56a5 5 0 0 0 5-5v-2a5 5 0 0 1-5 4H20a5 5 0 0 0-5-4v2a5 5 0 0 0 5 5z"
        fill={VIOLET}
        opacity="0.35"
      />
      <Spec cx={30} cy={42} rx={7} ry={3.5} rot={-18} o={0.28} />
      {/* the flap, folded down and sealed at its point */}
      <path
        d="M17 37 48 58 79 37"
        fill="none"
        stroke={INK}
        strokeWidth="3.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* the seal: wax, stamped with a keyhole. identity + secrecy, one mark */}
      <circle cx="48" cy="60" r="11" fill="url(#m-wax)" stroke={INK} strokeWidth="3.5" />
      <circle cx="45" cy="57.5" r="2.6" fill={INK} />
      <path
        d="M45 60.5v5.5l-1.5 1.5"
        stroke={INK}
        strokeWidth="2.6"
        strokeLinecap="round"
        fill="none"
      />
      <Eye cx={35} cy={45} iris={VIOLET_DEEP} brow="half" r={7} lid={0.18} />
      <Eye cx={61} cy={45} iris={VIOLET_DEEP} brow="half" r={7} lid={0.18} />
    </Tile>
  );
}

/* ---------------------------------------------------------- flywheel: spin */
// The feature only flywheel has is that it never stops: the same loop, over and
// over, dispatching each turn. So the wheel is caught mid-turn with its own rim
// smeared by rotation, and one spoke is thrown out past the hub as the arm that
// dispatches. Angry brow, because it is the only plane in the set that is never
// at rest, and the hub is green because this is the part that is awake.

export function FlywheelMascot({ className }: MascotProps) {
  return (
    <Tile
      label="Flywheel, the orchestration plane: a flywheel caught mid-turn"
      className={className}
    >
      <defs>
        <linearGradient id="m-fly" x1={LIGHT.x1} y1={LIGHT.y1} x2={LIGHT.x2} y2={LIGHT.y2}>
          <stop offset="0" stopColor={VIOLET} />
          <stop offset="1" stopColor={VIOLET_DEEP} />
        </linearGradient>
      </defs>
      {/* rotation smear on the rim itself, which is what sells the speed */}
      <g stroke={VIOLET} strokeLinecap="round" fill="none">
        <path d="M20 30a26 26 0 0 1 12-11" strokeWidth="5" opacity="0.28" />
        <path d="M76 66a26 26 0 0 1-12 11" strokeWidth="5" opacity="0.28" />
        <path d="M12 62a26 26 0 0 0 4 12" stroke={MUTED} strokeWidth="3" opacity="0.5" />
        <path d="M84 34a26 26 0 0 0-4-12" stroke={MUTED} strokeWidth="3" opacity="0.5" />
      </g>
      <circle cx="48" cy="48" r="27" fill="url(#m-fly)" stroke={INK} strokeWidth="3.5" />
      <circle cx="48" cy="48" r="20.5" fill={INK} />
      <g stroke={VIOLET} strokeWidth="4" strokeLinecap="round">
        <path d="M48 28v9" />
        <path d="M48 59v9" />
        <path d="M28 48h9" />
        <path d="M59 48h9" />
        <path d="m34 34 6 6" />
        <path d="m56 56 6 6" />
        <path d="m62 34-6 6" />
        <path d="m40 56-6 6" />
      </g>
      {/* the dispatch arm: one spoke thrown clear of the hub */}
      <path d="M48 48 48 14" stroke={VIOLET} strokeWidth="4.5" strokeLinecap="round" />
      <path
        d="M43 20 48 13l5 7z"
        fill={GREEN}
        stroke={INK}
        strokeWidth="2"
        strokeLinejoin="round"
      />
      <circle cx="48" cy="48" r="9.5" fill={GREEN} stroke={INK} strokeWidth="3.5" />
      <Spec cx={44.5} cy={44.5} rx={3} ry={2} rot={-24} o={0.45} />
      <Eye cx={41} cy={47} iris={GREEN} brow="angry" r={6} />
      <Eye cx={55} cy={47} iris={GREEN} brow="angry" r={6} />
    </Tile>
  );
}

/* ------------------------------------------------------------ beads: proof */
// A single bead would be a bead counter. What beads actually is, and the only
// plane here that is, is a chain where each link depends on the last and cannot
// close without evidence. So it is drawn as three: two open, the front one
// stamped shut with a seal, and the gate still latched between them.

export function BeadsMascot({ className }: MascotProps) {
  return (
    <Tile
      label="Beads, the work-evidence plane: a chain of work items, the front one closed"
      className={className}
    >
      <defs>
        <radialGradient id="m-bead-a" cx="0.32" cy="0.28" r="0.85">
          <stop offset="0" stopColor={AMBER_LIT} />
          <stop offset="1" stopColor={AMBER} />
        </radialGradient>
        <linearGradient id="m-bead-b" x1={LIGHT.x1} y1={LIGHT.y1} x2={LIGHT.x2} y2={LIGHT.y2}>
          <stop offset="0" stopColor={VIOLET} />
          <stop offset="1" stopColor={VIOLET_DEEP} />
        </linearGradient>
      </defs>
      {/* the chain, running up out of frame: there is always more work above */}
      <g stroke={MUTED} strokeWidth="4" strokeLinecap="round" fill="none">
        <path d="M20 20q7 6 0 12" />
        <path d="M34 14q7 7 0 14" />
      </g>
      {/* two open beads behind, smaller: depth, and the dependency chain */}
      <circle
        cx="27"
        cy="46"
        r="10"
        fill="url(#m-bead-a)"
        stroke={INK}
        strokeWidth="3"
        opacity="0.55"
      />
      <circle
        cx="33"
        cy="33"
        r="8"
        fill="url(#m-bead-a)"
        stroke={INK}
        strokeWidth="3"
        opacity="0.4"
      />
      <path d="M27 46 33 33" stroke={MUTED} strokeWidth="3" strokeLinecap="round" />
      {/* the front bead: the work item, and the one that carries the face */}
      <circle cx="55" cy="60" r="24" fill="url(#m-bead-a)" stroke={INK} strokeWidth="3.5" />
      <path
        d="M34 70a24 24 0 0 0 42 0"
        fill="none"
        stroke={AMBER}
        strokeWidth="3"
        opacity="0.5"
        strokeLinecap="round"
      />
      <Spec cx={45} cy={48} rx={7} ry={4} rot={-26} o={0.5} />
      {/* the closed-work seal stamped on it: close evidence, not a mood */}
      <circle cx="70" cy="76" r="9" fill={VIOLET} stroke={INK} strokeWidth="3" />
      <path
        d="M66 76l3 3 5.5-6"
        stroke={INK}
        strokeWidth="2.8"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
      {/* the gate, still latched between the open bead and the closed one */}
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
      <Eye cx={47} cy={58} iris={AMBER} brow="flat" r={7.5} />
      <Eye cx={64} cy={58} iris={AMBER} brow="flat" r={7.5} />
    </Tile>
  );
}

/* ------------------------------------------------------ chiebukuro: recall */
// The feature only chiebukuro has is that it holds two different stores and
// answers from both: a curated wiki on one page, episodic memory on the other.
// So the book is split green and violet down the spine, and the spark rising
// off the join is the synthesis, which is the part no other plane does. Wise
// and slightly amused: it has the answer and you have not asked yet.

export function ChiebukuroMascot({ className }: MascotProps) {
  return (
    <Tile
      label="Chiebukuro, the knowledge and memory plane: an open book synthesising across its spine"
      className={className}
    >
      <defs>
        <linearGradient id="m-chie-l" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor={GREEN_LIT} />
          <stop offset="1" stopColor={GREEN} />
        </linearGradient>
        <linearGradient id="m-chie-r" x1="1" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={VIOLET} />
          <stop offset="1" stopColor={VIOLET_DEEP} />
        </linearGradient>
      </defs>
      <path
        d="M48 32c-8-6-19-8-27-6v36c8-2 19 0 27 6z"
        fill="url(#m-chie-l)"
        stroke={INK}
        strokeWidth="3.5"
        strokeLinejoin="round"
      />
      <path
        d="M48 32c8-6 19-8 27-6v36c-8-2-19 0-27 6z"
        fill="url(#m-chie-r)"
        stroke={INK}
        strokeWidth="3.5"
        strokeLinejoin="round"
      />
      {/* rim light along the foot of both pages */}
      <path d="M21 62c8-2 19 0 27 6v4c-8-6-19-8-27-6z" fill={GREEN_LIT} opacity="0.4" />
      <path d="M75 62c-8-2-19 0-27 6v4c8-6 19-8 27-6z" fill={VIOLET} opacity="0.4" />
      {/* the text on both pages, so it reads as a book and not a leaf */}
      <g stroke={INK} strokeWidth="2.4" strokeLinecap="round" opacity="0.5">
        <path d="M27 38h14M27 46h14M27 54h9" />
        <path d="M55 38h14M55 46h14M55 54h9" />
      </g>
      {/* the synthesis: the spark off the spine, which is this plane's whole job */}
      <g stroke={AMBER} strokeWidth="2.8" strokeLinecap="round">
        <path d="M48 20v-7" />
        <path d="M39.5 22 35 17" />
        <path d="M56.5 22 61 17" />
      </g>
      <circle cx="48" cy="12" r="3" fill={AMBER} stroke={INK} strokeWidth="2" />
      {/* spectacles: the accessory, and the knowing look behind them */}
      <g fill="none" stroke={INK} strokeWidth="3" strokeLinecap="round">
        <circle cx="36" cy="47" r="10" />
        <circle cx="60" cy="47" r="10" />
        <path d="M46 47h4" />
        <path d="M26 45 20 42M70 45l6-3" />
      </g>
      <Eye cx={36} cy={47} iris={INK} brow="raised" r={6.5} />
      <Eye cx={60} cy={47} iris={INK} brow="raised" r={6.5} />
      {/* glints on the lenses: it is already looking something up */}
      <path
        d="M30 43a9 9 0 0 1 5-3"
        stroke={PAPER}
        strokeWidth="2"
        strokeLinecap="round"
        fill="none"
        opacity="0.75"
      />
      <path
        d="M54 43a9 9 0 0 1 5-3"
        stroke={PAPER}
        strokeWidth="2"
        strokeLinecap="round"
        fill="none"
        opacity="0.75"
      />
    </Tile>
  );
}

export const MASCOTS = {
  toron: ToronMascot,
  flywheel: FlywheelMascot,
  beads: BeadsMascot,
  chiebukuro: ChiebukuroMascot,
} as const;
