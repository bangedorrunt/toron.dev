# A frame wait inside a view transition never returns

**What happened.** The docs index tiles were upgraded to a soft navigation wrapped in
a view transition. The callback waited for React to commit the destination route the
way everyone writes it: two animation frames.

```js
document.startViewTransition(async () => {
  router.push(href);
  await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)));
});
```

The transition sat pending forever. `ready` never settled, the morph never played, and
because rendering is held for as long as the callback is pending, **every rAF animation
on the page stayed frozen behind it** — the particle field, the character drift, all of
it. A frame counter on the page read 4 frames and then nothing for the next second.

Isolated in a page with a frame counter:

| callback waits for | frames        | transition state |
| ------------------ | ------------- | ---------------- |
| two animation frames | 1 → 2       | stuck at `callback-ran`, `ready` never settles |
| a 16ms timer        | 0 → 71       | `finished` |

So the wait was the bug, not the router. While a view transition's callback is pending,
Chrome holds the rendering update, and the rendering update is what runs the frame
callbacks. A frame wait inside the callback is a deadlock by construction.**What to do instead.** Do not call `document.startViewTransition` yourself. React's
`<ViewTransition>` does this dance for you, and it times the snapshot off its own commit
instead of guessing: `<ViewTransition name="toron-character-toron">` around the tile art
and the plane page's mark is the entire implementation, and the App Router's own
navigation is the `startTransition` it needs. That is what ships (ADR-0010 D4).

The hand-rolled version was fixable, and was fixed before it was replaced: resolve the
callback from an effect that runs after the commit which changes `usePathname()`, with a
timeout as the way out when the router decides not to navigate (clicking a link to the
page you are already on). Correct, and unnecessary once React offers the same thing for
free.

**Why it is worth remembering.** The obvious check, "was `startViewTransition` called",
passes on this bug: it was called, once, and the route did change. Only two other
observations separate a playing transition from a stuck one — `ready`/`finished` settling,
and whether the page still runs frames afterwards. Both are now asserted in the harness,
and the sampling in it had to move off animation frames too, for the same reason: a
frame-polled wait cannot observe the thing that pauses frames.
