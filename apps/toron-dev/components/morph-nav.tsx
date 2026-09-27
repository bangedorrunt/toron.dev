"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef } from "react";

/*
 * governed-by: ADR-0010 D4
 *
 * Upgrades the docs index tiles from a document navigation to a soft one wrapped
 * in a view transition, so the character morphs on the click path.
 *
 * ADR-0009 D5 shipped the morph as a native cross-document transition and
 * recorded the limit honestly: an in-app navigation keeps the same document, so
 * `document.startViewTransition` is never called and the morph does not play.
 * This component is the click path, and it is the smallest thing that closes
 * that gap.
 *
 * The tiles are **plain anchors**, and that is load-bearing. Rendered as
 * `next/link`, the router intercepts the click itself and the two handlers race
 * for it. Rendered as an anchor, the path without JavaScript is not a degraded
 * state: the browser performs a real document navigation and the cross-document
 * transition plays the same morph with no script at all. This component only
 * makes that path faster, and it stands aside whenever it cannot do better — no
 * view-transition support, or a reader who asked for less motion, or a
 * modified click, all fall through to the anchor's own behaviour.
 *
 * The one thing here that is not obvious and cost a build to find: the transition's
 * callback must not wait on an animation frame. Rendering is held while the
 * callback is pending, so a frame wait never returns — the transition hangs, the
 * morph never plays, and every frame-driven animation on the page freezes with it.
 * ADR-0010 D4 has the measurement.
 *
 * It renders nothing, and it is imported by the docs index alone.
 */

export function MorphNav({ selector }: { selector: string }) {
  const router = useRouter();
  const pathname = usePathname();
  // The view transition's callback has to stay pending until React has committed
  // the destination route, or the browser snapshots the page it is leaving and
  // morphs it into itself. This effect is that moment: it runs after the commit
  // that changed the pathname. The href is kept beside the resolver so the effect
  // settles the transition that was actually waiting for this route.
  const pending = useRef<{ href: string; arrive: () => void } | null>(null);

  useEffect(() => {
    const waiting = pending.current;
    if (!waiting || waiting.href !== pathname) return;
    pending.current = null;
    waiting.arrive();
  }, [pathname]);

  useEffect(() => {
    // Typed as `HTMLElement`, not `Element`: only the element event map knows
    // `pointerenter` carries a PointerEvent, and a listener typed for the wrong
    // event is a compile error rather than a runtime surprise.
    const root = document.querySelector<HTMLElement>(selector);
    if (!root) return;
    if (typeof document.startViewTransition !== "function") return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const linkFrom = (event: Event) => {
      const anchor = (event.target as Element | null)?.closest("a[href]");
      if (!anchor || !root.contains(anchor)) return null;
      if (anchor.getAttribute("target")) return null;
      const href = anchor.getAttribute("href");
      return href?.startsWith("/") ? href : null;
    };

    // Leaving the anchors plain gave up the router's own hover prefetch, so this
    // puts it back: by the time the click lands, the route is usually already
    // there and the transition is morphing a page that does not need to load.
    const prefetch = (event: PointerEvent) => {
      const href = linkFrom(event);
      if (href) router.prefetch(href);
    };

    const onClick = (event: MouseEvent) => {
      if (event.defaultPrevented || event.button !== 0) return;
      if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      const href = linkFrom(event);
      if (!href) return;

      event.preventDefault();
      document.startViewTransition(
        () =>
          new Promise<void>((resolve) => {
            // A transition whose callback never settles freezes the page: rendering
            // is held, and with it every frame callback, for as long as this promise
            // is pending. The pathname effect above is the normal way out; this timer
            // is the way out for the one click that never changes the route, because
            // a tile pointing at the page you are already on never lands.
            const bail = window.setTimeout(() => {
              pending.current = null;
              resolve();
            }, 1500);
            pending.current = {
              href,
              arrive: () => {
                window.clearTimeout(bail);
                resolve();
              },
            };
            router.push(href);
          }),
      );
    };

    root.addEventListener("pointerenter", prefetch, true);
    root.addEventListener("click", onClick);
    return () => {
      root.removeEventListener("pointerenter", prefetch, true);
      root.removeEventListener("click", onClick);
    };
  }, [router, selector]);

  return null;
}
