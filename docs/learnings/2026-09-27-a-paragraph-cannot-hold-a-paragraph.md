# A paragraph cannot hold a paragraph

**What happened.** The docs `Callout` wrapped its children in a `<p>`:

```tsx
<div>
  <h3>{title}</h3>
  <p>{children}</p>
</div>
```

MDX wraps the body of a JSX block in a paragraph of its own, so the served markup for
every callout was:

```html
<p><p>Start with the failure you actually have. …</p></p>
```

That is not nesting the parser keeps. A `<p>` start tag closes any open `<p>` first, so
the browser built two siblings — an empty `<p>` and the text `<p>` — where React renders
a parent and a child. React answered with error #418 ("Hydration failed because the server
rendered HTML didn't match the client"), threw the tree away and re-rendered the whole
page on the client, on every docs page carrying a callout: the docs index, all four plane
pages, the guides index, and the walkthroughs. It had been doing that for as long as the
component existed.

**Why it was hard to see.** Three things hid it at once:

- The page still worked. Nothing 404ed, no layout moved, and the re-render produced the
  same markup, so the only trace was one console error.
- The production error carries no component stack, and the error text lists six possible
  causes with no hint which one it was.
- Diffing the served HTML against the DOM *after* hydration finds nothing: React's
  recovery render is the client's version of the tree, and the DOM it leaves behind is
  what the client wanted. Comparing final states cannot see a mismatch that was already
  repaired.

What found it was the route list. Only the pages with a callout failed, and `/docs` and
`/docs/guides` share exactly one component. Reading the served markup at that component
showed `<p><p>` immediately.

**What to do instead.** Never wrap MDX children in a `<p>`. Use a container element with
a class of its own and style the paragraph MDX made:

```tsx
<div className="toron-callout__body">{children}</div>
```

Then guard both halves, because the failure is invisible in a normal build:

- the built HTML for block-level elements inside a `<p>` (`<p><p>`, `<p><div>`, `<p><ul>`
  and the rest), scanned across every page in `.next/server/app`;
- a listener on a real page load of the pages that carry the component, since a React
  error is the only symptom this bug has.

**Why it is worth remembering.** The invalid nesting is the one hydration cause that is
cheap to write by accident, invisible in review, and expensive in the browser: the page
pays a full client re-render of the whole tree, and every stateful thing on it hydrates
twice. The other lesson is about the instrument: an after-the-fact DOM comparison is the
wrong tool for a mismatch, because React's recovery has already made the two sides agree.
