import type { ReactNode } from "react";
import { ViewTransition } from "react";
import Image from "next/image";
import Link from "next/link";
import { PLANES, PLANE_BY_SLUG, type PlaneSlug } from "@/lib/planes";

/*
 * governed-by: ADR-0009 D7
 *
 * The MDX-facing components: everything a guide or a plane page can use, in a
 * module that imports no client component.
 *
 * This file exists for one measured reason. The first cut of the character work
 * put `PlaneMark` and `PlaneRow` in `site-content.tsx`, beside the components that
 * render the interactive character, and `components/mdx.tsx` imported its whole set
 * from there. A module import is not a render, but Next registers the client
 * reference either way, so every docs page fetched the animation library whether or
 * not it drew an interactive character: measured at **38.9 KB gzipped on
 * `/docs/toron`**, a page whose four characters are server-rendered images with a
 * native view transition and no JavaScript at all.
 *
 * So the rule this module carries: nothing here imports a client component, and
 * nothing here should start to. The interactive set stays in `site-content.tsx`,
 * which the marketing pages import and the docs never touch. `scripts/render-strip.mjs`
 * checks the result — it reads the built HTML for `/docs/toron` and fails if the
 * motion chunk is in it.
 *
 * ADR-0010 D4 is why the click path morphs, and it does so **without a client island
 * of this repo's own**: the tile and the plane page's mark are wrapped in React's
 * `<ViewTransition>`, which assigns the `view-transition-name`, calls
 * `document.startViewTransition` itself and times it off React's own commit. The
 * component is part of the React runtime the docs already load, so nothing new is
 * fetched, and the hand-rolled enhancer that used to live on the index is gone —
 * along with the frame wait inside its callback that deadlocked the first build.
 */

/* -------------------------------------------------------------- walkthrough */

export function Walkthrough({ outcome, children }: { outcome: ReactNode; children: ReactNode }) {
  return (
    <div>
      <p className="toron-walk__outcome">{outcome}</p>
      <div className="toron-walk">{children}</div>
    </div>
  );
}

export function WalkStep({
  n,
  title,
  body,
  children,
  fail,
  diagnose,
}: {
  n: number;
  title: string;
  body: ReactNode;
  children?: ReactNode;
  fail?: string;
  diagnose?: string;
}) {
  return (
    <article className="toron-walk__step">
      <span className="toron-walk__num" aria-hidden="true">
        {String(n).padStart(2, "0")}
      </span>
      <div>
        <h3 className="toron-walk__title">{title}</h3>
        <p className="toron-walk__body">{body}</p>
        {children}
        {fail ? (
          <p className="toron-walk__fail">
            <strong>If it fails</strong>
            <span>
              {fail}
              {diagnose ? (
                <>
                  {" "}
                  Run <code>{diagnose}</code>.
                </>
              ) : null}
            </span>
          </p>
        ) : null}
      </div>
    </article>
  );
}

/*
 * MDX-facing aliases. Guides in content/docs/guides/ use these, so the
 * walkthrough shape is enforced by the component rather than by author
 * discipline: a step always renders a number, and a fail block is always
 * visible rather than buried in a paragraph.
 */
export function Walk({ outcome, children }: { outcome: ReactNode; children: ReactNode }) {
  return <Walkthrough outcome={outcome}>{children}</Walkthrough>;
}

// `Step` is deliberately loose about its children: a guide step interleaves
// prose, fenced commands, and fenced output, all of which arrive as MDX nodes.
export function Step({ n, title, children }: { n: number; title: string; children: ReactNode }) {
  return (
    <article className="toron-walk__step">
      <span className="toron-walk__num" aria-hidden="true">
        {String(n).padStart(2, "0")}
      </span>
      <div className="toron-md-step">
        <h3 className="toron-walk__title">{title}</h3>
        {children}
      </div>
    </article>
  );
}

// The failure mode is not optional in a walkthrough, so it gets its own
// component and its own visual treatment instead of a trailing sentence.
export function Fail({ diagnose, children }: { diagnose?: string; children: ReactNode }) {
  return (
    <p className="toron-walk__fail">
      <strong>If it fails</strong>
      <span>
        {children}
        {diagnose ? (
          <>
            {" "}
            Run <code>{diagnose}</code>.
          </>
        ) : null}
      </span>
    </p>
  );
}

/* ------------------------------------------------------------------ code */

export function CodeBlock({
  children,
  label,
  out = false,
}: {
  children: string;
  label?: string;
  out?: boolean;
}) {
  return (
    <figure className={`toron-code-block${out ? " toron-code-block--out" : ""}`}>
      {label ? <figcaption>{label}</figcaption> : null}
      <pre>
        <code>{children}</code>
      </pre>
    </figure>
  );
}

/* ---------------------------------------------------- stat row and callout */

export function StatRow({ items }: { items: [string, string][] }) {
  return (
    <div className="toron-stat-row">
      {items.map(([value, caption]) => (
        <div key={caption}>
          <strong>{value}</strong>
          <span>{caption}</span>
        </div>
      ))}
    </div>
  );
}

export function Callout({
  glyph = "↻",
  title,
  children,
}: {
  glyph?: string;
  title: string;
  children: ReactNode;
}) {
  return (
    <div className="toron-callout">
      <p className="toron-callout__glyph" aria-hidden="true">
        {glyph}
      </p>
      <div>
        <h3>{title}</h3>
        {/*
         * A div, not a p, and the reason is a hydration bug rather than taste: MDX
         * wraps this body in a paragraph of its own, so a <p> here emitted `<p><p>`
         * and the browser's parser closes the outer one before the inner one starts.
         * The parsed DOM then has two siblings where React renders a parent and a
         * child, and on every docs page carrying a callout React threw #418 and
         * regenerated the whole tree on the client. Caught by comparing the served
         * HTML against the hydrated DOM, and now asserted in the harness.
         */}
        <div className="toron-callout__body">{children}</div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------ plane marks (docs) */

/*
 * The two placements the documentation gets, drawn on the server.
 *
 * No client component of this repo's own, no feature bundle: the guides are the
 * pages a reader arrives at from a search result, and a character that costs them
 * 39KB before they can read a command is a bad trade. What the docs get instead is
 * the native view transition — the same character, at two sizes, morphing between
 * the index and the plane page, timed by React on the click path and by the browser
 * itself on a document navigation.
 */

/*
 * The shared-element pair, declared once.
 *
 * `name` is the whole mechanism on the React side: React sets
 * `view-transition-name` on the element for the duration of the transition, calls
 * the browser's API itself, and resolves the promise that times the snapshot off
 * its own commit — which is the part a hand-rolled wrapper gets wrong first, and
 * got wrong here (ADR-0010 D4). The same literal names are written in the
 * stylesheet beside `[data-morph]`, because that is the path with no JavaScript at
 * all: a plain document navigation snapshots both documents and morphs the pair
 * with no script involved.
 *
 * `default="none"` is deliberate. Every link click in the App Router is a React
 * transition, so a boundary left at the default would animate on unrelated
 * navigations too; this one speaks only when the pair actually forms, and stands
 * aside when it does not.
 *
 * The names are set here and nowhere else, and each page carries at most one. Two
 * elements sharing a name on one page aborts every transition on that page, which
 * is the failure worth designing against.
 */
function Morph({ name, children }: { name?: string; children: ReactNode }) {
  if (!name) return children;
  return (
    <ViewTransition name={name} default="none" share="auto">
      {children}
    </ViewTransition>
  );
}

export function PlaneMark({ slug, morph = false }: { slug: PlaneSlug; morph?: boolean }) {
  const plane = PLANE_BY_SLUG[slug];

  return (
    <div className="toron-plane-mark">
      <Morph name={morph ? `toron-character-${slug}` : undefined}>
        <Image
          src={plane.art}
          alt=""
          sizes="136px"
          className="toron-plane-mark__art"
          data-morph={morph ? slug : undefined}
        />
      </Morph>
      <div className="toron-plane-mark__copy">
        <p className="toron-plane-mark__name">{plane.name}</p>
        <p className="toron-plane-mark__role">{plane.role}</p>
      </div>
    </div>
  );
}

/**
 * The four characters as the index of the four planes.
 *
 * This replaces the markdown table the index used to carry. The table said the same
 * thing in text, and the text is still here — each tile prints the plane's name and
 * what it owns — but the row is also the door into the four pages, so the set is
 * navigable rather than described.
 *
 * The tiles are `next/link`, and that is what makes the morph work rather than a
 * detail: a `Link` click is a React transition, which is the only thing that arms a
 * `<ViewTransition>` (ADR-0010 D4). It is also the better default on its own terms —
 * the router prefetches the route on hover — and it still renders a plain anchor, so
 * a reader without JavaScript performs a real document navigation and the
 * cross-document transition morphs the same pair.
 *
 * The first cut used plain anchors and a hand-rolled click handler, because the
 * handler and the router would otherwise race for the click. Removing the handler
 * removed the race, and the reason to avoid `Link` went with it.
 */
export function PlaneRow({ morph = false }: { morph?: boolean }) {
  return (
    <div className="toron-plane-row">
      {PLANES.map((plane) => (
        <Link key={plane.slug} href={plane.docs} className="toron-plane-row__item">
          <Morph name={morph ? `toron-character-${plane.slug}` : undefined}>
            <Image
              src={plane.art}
              alt=""
              sizes="64px"
              className="toron-plane-row__art"
              data-morph={morph ? plane.slug : undefined}
            />
          </Morph>
          <span className="toron-plane-row__name">{plane.name}</span>
          <span className="toron-plane-row__owns">{plane.owns}</span>
        </Link>
      ))}
    </div>
  );
}
