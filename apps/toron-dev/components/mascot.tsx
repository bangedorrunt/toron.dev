"use client";

import Image from "next/image";
import { m, useInView, useReducedMotion, useSpring, type MotionStyle } from "motion/react";
import { useCallback, useMemo, useRef, type PointerEvent as ReactPointerEvent } from "react";
import { PLANE_BY_SLUG, type PlaneSlug } from "@/lib/planes";
import { MotionScope } from "./motion-provider";

/*
 * governed-by: ADR-0009 D3/D4/D6
 *
 * A character that reacts to the pointer.
 *
 * This is the only interactive motion on the site, and it is deliberately the
 * only one: everything else a page does — arriving, revealing, the crash cycle —
 * is CSS, on the compositor, for free. What a stylesheet cannot do is spring
 * physics, which is what makes a response feel physical rather than scheduled,
 * and that is what this component buys.
 *
 * Three effects, in the order they matter:
 *
 *   1. **tilt** — the art rotates on two axes toward the pointer, on springs, so
 *      it leans into the cursor and settles back with momentum. A tilt that is
 *      not sprung reads as a jump cut to a rotated image.
 *   2. **lift** — a small scale on the same springs while the pointer is inside.
 *   3. **drift** — an ambient float, for the one character per page that is the
 *      page's subject rather than decoration. It is gated on the element being
 *      in the viewport, so a reader who has scrolled away stops paying for it,
 *      and it is opt-in per call site, so a row of four does not float.
 *
 * Nothing here is required for the content to be readable. With JavaScript
 * disabled, with the feature bundle still in flight, or under
 * `prefers-reduced-motion`, the component renders the same picture in the same
 * place; only the physics are missing. That ordering is the point: the entrance
 * and scroll animations stay in CSS, so no reader ever waits on this file to see
 * a page.
 */

export type CharacterSize = "chip" | "mark" | "strip";

/*
 * `sizes` is not decoration. Without it the browser assumes the art spans the
 * full viewport and pulls a render orders of magnitude larger than the box it
 * lands in. Each of these mirrors the css box the matching modifier draws, and
 * they are in one table so a new size cannot ship without one.
 */
const SIZES: Record<CharacterSize, string> = {
  chip: "32px",
  mark: "56px",
  strip: "72px",
};

const TILT = { stiffness: 240, damping: 20, mass: 0.6 } as const;
const LIFT = { stiffness: 320, damping: 26, mass: 0.7 } as const;

/** The resting state the drift animates back to when it is switched off. */
const REST = { y: 0, rotate: 0 } as const;

export function Character({
  slug,
  size = "mark",
  drift = false,
  className,
  sizes,
  priority = false,
}: {
  slug: PlaneSlug;
  size?: CharacterSize;
  /** Wander slowly while on screen. One per page, at most. */
  drift?: boolean;
  /** Extra class for the drawn art, so an existing surface keeps its own rule. */
  className?: string;
  sizes?: string;
  priority?: boolean;
}) {
  const plane = PLANE_BY_SLUG[slug];
  const host = useRef<HTMLSpanElement>(null);
  const calm = useReducedMotion();

  // Gated on visibility: the float stops when the character leaves the viewport
  // and picks up where it left off when it returns, which is the same contract
  // the hero cycle got from its own gate.
  const inView = useInView(host, { margin: "0px 0px -12% 0px" });
  const drifting = drift && !calm && inView;

  const rotateX = useSpring(0, TILT);
  const rotateY = useSpring(0, TILT);
  const scale = useSpring(1, LIFT);

  const tilt = useMemo<MotionStyle | undefined>(
    () => (calm ? undefined : { rotateX, rotateY, scale, transformPerspective: 720 }),
    [calm, rotateX, rotateY, scale],
  );

  const track = useCallback(
    (event: ReactPointerEvent<HTMLSpanElement>) => {
      if (calm) return;
      const box = event.currentTarget.getBoundingClientRect();
      // Half-range either side of centre, so the character is at rest when the
      // pointer is at rest in the middle of the box rather than at a corner.
      const x = (event.clientX - box.left) / box.width - 0.5;
      const y = (event.clientY - box.top) / box.height - 0.5;
      rotateY.set(x * 15);
      rotateX.set(y * -12);
      scale.set(1.05);
    },
    [calm, rotateX, rotateY, scale],
  );

  const rest = useCallback(() => {
    if (calm) return;
    rotateY.set(0);
    rotateX.set(0);
    scale.set(1);
  }, [calm, rotateX, rotateY, scale]);

  const float = useMemo(() => ({ y: [0, -8, 0], rotate: [0, -1.4, 0] }), []);
  const floatTransition = useMemo(
    () => ({ duration: 7.5, repeat: Infinity, ease: "easeInOut" as const }),
    [],
  );
  const settleTransition = useMemo(() => ({ duration: 0.5, ease: "easeOut" as const }), []);

  return (
    <span ref={host} className={`toron-character toron-character--${size}`}>
      <MotionScope>
        <m.span
          className="toron-character__drift"
          animate={drifting ? float : REST}
          transition={drifting ? floatTransition : settleTransition}
        >
          <m.span
            className="toron-character__tilt"
            style={tilt}
            onPointerMove={track}
            onPointerLeave={rest}
          >
            <Image
              src={plane.art}
              alt=""
              sizes={sizes ?? SIZES[size]}
              priority={priority}
              className={className ? `toron-character__art ${className}` : "toron-character__art"}
            />
          </m.span>
        </m.span>
      </MotionScope>
    </span>
  );
}
