"use client";

import { useEffect, useRef } from "react";

/**
 * Pauses the hero's crash cycle when it is not on screen.
 *
 * The cycle is a 12s infinite animation. Left alone it runs for the whole time
 * the tab is open, including while the reader is three sections down the page,
 * which is work with no reader in the loop. It also means a reader who stays on
 * the landing page sees the crash for the thirtieth time, and by then the most
 * interesting thing on the page is wallpaper.
 *
 * This is a gate, not an animation driver. It renders nothing, it never runs a
 * frame callback, and the only thing it ever does is flip one attribute. The
 * animation itself stays pure CSS, so the motion costs the same whether this
 * component exists or not, and `prefers-reduced-motion` still governs it
 * entirely.
 *
 * It is its own client component rather than a hook inside the hero because the
 * hero is a server component. Making the hero client to save a file would ship
 * its whole tree to the browser and hydrate it, which is a far larger cost than
 * the one this avoids.
 */
export function CycleGate() {
  const anchor = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const host = anchor.current?.closest("section");
    if (!host) return;

    // No IntersectionObserver means no gate. The animation running is the
    // correct degraded behaviour, so this is a capability check and not a
    // reason to hide anything.
    if (typeof IntersectionObserver === "undefined") {
      host.dataset.cycle = "running";
      return;
    }

    // Start paused. Before this effect runs the CSS default is running, so the
    // first paint of a cached page can show a frame of the loop before it is
    // gated. Marking the host optimistically avoids that flash.
    host.dataset.cycle = "idle";

    const observer = new IntersectionObserver(
      ([entry]) => {
        host.dataset.cycle = entry.isIntersecting ? "running" : "idle";
      },
      // Start a little before the hero is fully on screen, so the cycle is
      // already running by the time the reader looks at it rather than
      // beginning under their eye.
      { rootMargin: "120px 0px" },
    );

    observer.observe(host);
    return () => {
      observer.disconnect();
      delete host.dataset.cycle;
    };
  }, []);

  return <span ref={anchor} hidden />;
}
