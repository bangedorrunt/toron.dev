"use client";

import { LazyMotion, domMin } from "motion/react";
import type { ReactNode } from "react";

/*
 * governed-by: ADR-0009 D3/D4
 *
 * The one place the Motion runtime's features are pulled in.
 *
 * Two decisions are encoded here, and both are about bytes.
 *
 * **LazyMotion, not `motion.div`.** The full component factory loads every feature
 * the library ships — drag, layout projection, gestures, the whole animation engine
 * — whether or not a page uses them. `LazyMotion` loads one feature set, and the
 * `m` component (the one `motion/react` exposes for exactly this) is a thin proxy
 * that reads the loaded features out of context.
 *
 * **`domMin`, not `domAnimation`.** The library's middle set adds gesture
 * recognition: hover, tap, focus, drag. This app uses none of it — the tilt is
 * driven by raw `pointermove` writing into motion values, and the float by the
 * `animate` prop — so the only features that are actually read are the animation
 * and render ones, which is the whole of `domMin`. Measured on the built output, the
 * smaller set takes the library chunk from 38.9 KB to 37.4 KB gzipped (272.3 KB to
 * 270.7 KB on the marketing routes), and the saving is kept only because the effects
 * still work: the check is behavioural, in `scripts/render-strip.mjs`, which loads
 * the built pages in a browser and fails if a character does not drift on screen or
 * does not answer a pointer.
 *
 * **The scope lives with the character, not in the root layout.** Mounting this
 * in `app/layout.tsx` would put the feature set on every page in the site,
 * including the docs. The docs are server-rendered images with a CSS hover and a
 * native view transition (ADR-0009 D5), so they render this component never, and
 * the docs therefore ship zero animation bytes. A reader who arrives at a guide
 * from a search result gets the same page speed they had before the four
 * characters existed.
 *
 * `strict` is on deliberately: it makes `motion.div` throw inside this tree, so
 * a later edit cannot quietly reintroduce the full factory by using the wrong
 * component name. Every animated element in this app is an `m.*`.
 */

const FEATURES = domMin;

export function MotionScope({ children }: { children: ReactNode }) {
  return (
    <LazyMotion features={FEATURES} strict>
      {children}
    </LazyMotion>
  );
}
