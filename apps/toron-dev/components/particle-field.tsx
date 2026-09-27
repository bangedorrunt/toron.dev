"use client";

import { useEffect, useRef } from "react";

/*
 * governed-by: ADR-0010 D3
 *
 * A slow dust field behind the closing call to action.
 *
 * This is the only canvas on the site and the only animation driven by a frame
 * loop, so it is written to stop as much as to run:
 *
 *   - it does not start until the band is on screen, and it stops when it leaves,
 *   - it stops while the tab is hidden,
 *   - it draws at the device pixel ratio capped at 2, so a phone is not shading
 *     four times the pixels it can show,
 *   - under `prefers-reduced-motion: reduce` it never starts: the reader gets the
 *     band, the glow, and no drifting specks,
 *   - the count follows the box area up to a cap, so a wide band is not paying for
 *     a phone-sized field,
 *   - and it takes its colour from the tokens at runtime, so it cannot drift from
 *     the palette the rest of the site is painted in.
 *
 * It is decoration in the strictest sense: `aria-hidden`, no pointer events, and
 * the band reads identically with the canvas blank.
 */

const MAX_PARTICLES = 46;
/** Particles per css pixel of band area, before the cap. */
const DENSITY = 1 / 24000;
const MAX_DPR = 2;

type Speck = {
  x: number;
  y: number;
  r: number;
  /** Upward drift, in css pixels per second. */
  rise: number;
  /** Horizontal sway amplitude, in css pixels. */
  sway: number;
  phase: number;
  alpha: number;
};

export function ParticleField({ className }: { className: string }) {
  const host = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = host.current;
    const context = canvas?.getContext("2d");
    if (!canvas || !context) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const styles = getComputedStyle(canvas);
    const colour = styles.getPropertyValue("--toron-accent-bright").trim() || "#828fff";
    context.fillStyle = colour;

    let specks: Speck[] = [];
    let width = 0;
    let height = 0;
    let frame = 0;
    let previous = 0;
    let onScreen = false;

    const seed = () => {
      const count = Math.min(MAX_PARTICLES, Math.max(12, Math.round(width * height * DENSITY)));
      specks = Array.from({ length: count }, () => ({
        x: Math.random() * width,
        y: Math.random() * height,
        r: 0.6 + Math.random() * 1.5,
        rise: 3 + Math.random() * 12,
        sway: 2 + Math.random() * 7,
        phase: Math.random() * Math.PI * 2,
        alpha: 0.1 + Math.random() * 0.3,
      }));
    };

    const resize = () => {
      const box = canvas.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, MAX_DPR);
      width = box.width;
      height = box.height;
      canvas.width = Math.max(1, Math.round(width * dpr));
      canvas.height = Math.max(1, Math.round(height * dpr));
      // Draw in css pixels and let the transform carry the density, so the field
      // is the same field on every screen.
      context.setTransform(dpr, 0, 0, dpr, 0, 0);
      seed();
    };

    const draw = (now: number) => {
      frame = requestAnimationFrame(draw);
      // A tab that was hidden can hand back a delta of minutes. Clamp it, so the
      // field resumes instead of teleporting.
      const delta = previous ? Math.min((now - previous) / 1000, 0.05) : 0;
      previous = now;

      context.clearRect(0, 0, width, height);
      for (const speck of specks) {
        speck.y -= speck.rise * delta;
        speck.phase += delta * 0.55;
        if (speck.y < -4) {
          speck.y = height + 4;
          speck.x = Math.random() * width;
        }
        // Fade in and out across the box rather than popping at the edges.
        const edge = Math.min(1, speck.y / 24, (height - speck.y) / 24);
        context.globalAlpha =
          speck.alpha * Math.max(0, edge) * (0.65 + 0.35 * Math.sin(speck.phase));
        context.beginPath();
        context.arc(speck.x + Math.sin(speck.phase) * speck.sway, speck.y, speck.r, 0, Math.PI * 2);
        context.fill();
      }
      context.globalAlpha = 1;
    };

    const start = () => {
      if (frame) return;
      previous = 0;
      frame = requestAnimationFrame(draw);
    };

    const stop = () => {
      if (frame) cancelAnimationFrame(frame);
      frame = 0;
    };

    const gate = () => {
      if (onScreen && !document.hidden) start();
      else stop();
    };

    resize();
    const resizeObserver = new ResizeObserver(resize);
    resizeObserver.observe(canvas);
    const visibilityObserver = new IntersectionObserver(
      ([entry]) => {
        onScreen = entry.isIntersecting;
        gate();
      },
      // Start slightly before the band is on screen, so the field is already
      // drifting when the reader arrives rather than beginning under their eye.
      { rootMargin: "140px 0px" },
    );
    visibilityObserver.observe(canvas);
    document.addEventListener("visibilitychange", gate);

    return () => {
      stop();
      resizeObserver.disconnect();
      visibilityObserver.disconnect();
      document.removeEventListener("visibilitychange", gate);
    };
  }, []);

  return <canvas ref={host} className={className} aria-hidden="true" />;
}
