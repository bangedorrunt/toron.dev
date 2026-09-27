import type { ReactNode } from "react";
import Image from "next/image";
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
 * ADR-0010 D4 adds one client island back onto the docs **index** — `MorphNav`, which
 * wraps the tile click in a view transition — and that is placed by the page, next to
 * `<PlaneRow />`, rather than imported from here. The index pays about a kilobyte for
 * it and the four plane pages it opens pay nothing, which is the split that matters.
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
        <p>{children}</p>
      </div>
    </div>
  );
}

/* ------------------------------------------------------ plane marks (docs) */

/*
 * The two placements the documentation gets, drawn on the server.
 *
 * No client component, no feature bundle, no added JavaScript: the guides are the
 * pages a reader arrives at from a search result, and a character that costs them
 * 39KB before they can read a command is a bad trade. What the docs get instead is
 * the native view transition (ADR-0009 D5) — the same character, at two sizes,
 * morphing between the index and the plane page, driven by the browser's own
 * snapshot machinery at zero bytes.
 */

export function PlaneMark({ slug, morph = false }: { slug: PlaneSlug; morph?: boolean }) {
  const plane = PLANE_BY_SLUG[slug];

  return (
    <div className="toron-plane-mark">
      <Image
        src={plane.art}
        alt=""
        sizes="136px"
        className="toron-plane-mark__art"
        // `data-morph` is what carries the view transition name, and it is only
        // ever set here and on the index row below. Two elements sharing a name on
        // one page aborts every transition on that page, silently, so the name is
        // not a class any caller can add by accident.
        data-morph={morph ? slug : undefined}
      />
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
 * The tiles are **plain anchors**, not `next/link`. Two reasons, and they agree: the
 * router would intercept the click and race `MorphNav`, which is what wraps the click
 * in a view transition (ADR-0010 D4); and with no JavaScript at all, a plain anchor
 * performs a real document navigation, which is the path the cross-document view
 * transition already morphs. The enhancement is faster, and its absence is not a
 * broken state.
 */
export function PlaneRow({ morph = false }: { morph?: boolean }) {
  return (
    <div className="toron-plane-row">
      {PLANES.map((plane) => (
        <a key={plane.slug} href={plane.docs} className="toron-plane-row__item">
          <Image
            src={plane.art}
            alt=""
            sizes="64px"
            className="toron-plane-row__art"
            data-morph={morph ? plane.slug : undefined}
          />
          <span className="toron-plane-row__name">{plane.name}</span>
          <span className="toron-plane-row__owns">{plane.owns}</span>
        </a>
      ))}
    </div>
  );
}
