import type { ReactNode } from "react";
import Link from "next/link";
import { PLANES, type PlaneSlug } from "@/lib/planes";
import { Character } from "./mascot";
import { ParticleField } from "./particle-field";

/*
 * governed-by: ADR-0004 D3/D5/D6
 *
 * The marketing kit. A section is a numbered claim carrying a figure.
 *
 * This module imports the interactive character, which is the whole point of it:
 * every surface here is a marketing surface, where the physics are worth their
 * bytes. The components the docs also use live in `./docs-content`, which imports
 * no client component, and are re-exported at the bottom of this file.
 */

/* ------------------------------------------------------------------ shell */

export function SitePage({
  eyebrow,
  title,
  description,
  marks,
  children,
}: {
  eyebrow: string;
  title: string;
  description: string;
  /**
   * The characters this page is about, drawn small at the top right of the
   * header. A page that names all four carries all four; a page about one plane
   * carries one; most pages carry none, which is the point — a header that always
   * has art in it stops being a signal.
   */
  marks?: readonly PlaneSlug[];
  children: ReactNode;
}) {
  return (
    <main className="toron-page">
      <header className="toron-page__header">
        {marks?.length ? (
          <div className="toron-page__marks">
            {marks.map((slug) => (
              /* A lone character drifts, because it is the page's subject. A set
                 of four does not: four independent floats read as noise, and the
                 set is meant to read as one object. */
              <Character key={slug} slug={slug} size="mark" drift={marks.length === 1} />
            ))}
          </div>
        ) : null}
        <p className="toron-page__eyebrow">{eyebrow}</p>
        <h1>{title}</h1>
        <p className="toron-page__description">{description}</p>
      </header>
      {children}
    </main>
  );
}

export function Section({
  id,
  index,
  label,
  title,
  lede,
  children,
  tight = false,
}: {
  id?: string;
  index?: string;
  label?: string;
  title: string;
  lede?: string;
  children: ReactNode;
  tight?: boolean;
}) {
  const anchor = id ?? label?.toLowerCase().replaceAll(" ", "-") ?? undefined;
  const headingId = `${anchor ?? "section"}-title`;

  return (
    <section
      id={anchor}
      className={`toron-section${tight ? " toron-section--tight" : ""}`}
      aria-labelledby={headingId}
    >
      {index || label ? (
        <p className="toron-section__head">
          {index ? <span className="toron-section__index">{index}</span> : null}
          {label ? <span className="toron-section__label">{label}</span> : null}
        </p>
      ) : null}
      <div className="toron-section__copy">
        <h2 id={headingId} className="toron-section__claim">
          {title}
        </h2>
        {lede ? <p className="toron-section__lede">{lede}</p> : null}
      </div>
      <div className="toron-section__body">{children}</div>
    </section>
  );
}

export function StackStrip() {
  return (
    <div className="toron-stack-strip" aria-label="The four planes of the autonomous agent stack">
      {PLANES.map((plane) => (
        <a
          key={plane.slug}
          href={plane.repo}
          target="_blank"
          rel="noreferrer"
          className="toron-stack-strip__item"
        >
          {/* The art keeps its own class, because `.toron-stack-strip__mascot`
              is the rule that fixes the 4.5rem box the strip's measurement was
              taken at; the character component supplies the physics around it. */}
          <Character slug={plane.slug} size="strip" className="toron-stack-strip__mascot" />
          <span className="toron-stack-strip__name">{plane.name}</span>
          <span className="toron-stack-strip__role">{plane.role}</span>
        </a>
      ))}
    </div>
  );
}

/* ------------------------------------------------------------------- tiles */

export function SurfaceCard({
  title,
  eyebrow,
  badge,
  mark,
  children,
  href,
}: {
  title: string;
  eyebrow?: string;
  badge?: string;
  /** The character of the plane this card is about, drawn in its corner. */
  mark?: PlaneSlug;
  children: ReactNode;
  href?: string;
}) {
  const content = (
    <>
      {eyebrow || mark ? (
        <div className="toron-card__top">
          {eyebrow ? <p className="toron-card__eyebrow">{eyebrow}</p> : null}
          {mark ? <Character slug={mark} size="chip" /> : null}
        </div>
      ) : null}
      <span className="toron-tile__head">
        <h3>{title}</h3>
        {badge ? <span className="toron-badge">{badge}</span> : null}
      </span>
      <p className="toron-card__body">{children}</p>
      {href ? (
        <span className="toron-card__arrow" aria-hidden="true">
          Read more →
        </span>
      ) : null}
    </>
  );

  return href ? (
    <Link href={href} className="toron-card toron-card--link">
      {content}
    </Link>
  ) : (
    <article className="toron-card">{content}</article>
  );
}

export function CTABand({
  title,
  body,
  children,
}: {
  title: string;
  body: string;
  children: ReactNode;
}) {
  return (
    <div className="toron-cta">
      {/* First in the markup, so it paints under the copy, and behind the very
          last thing every marketing page asks the reader to do. Nothing about the
          band depends on it: the canvas is aria-hidden, takes no pointer events,
          and is simply absent for a reader who asked for less motion. */}
      <ParticleField className="toron-cta__particles" />
      <div>
        <h2>{title}</h2>
        <p>{body}</p>
      </div>
      <div className="toron-actions" style={{ marginTop: 0 }}>
        {children}
      </div>
    </div>
  );
}

/*
 * The walkthrough, code, callout, stat, and plane-mark vocabulary lives in
 * `./docs-content`, which imports no client component, and is re-exported here so
 * the marketing pages keep one import for the whole kit.
 *
 * The split is not tidiness. `components/mdx.tsx` used to import these from this
 * file, so every docs page registered this module's client import and fetched the
 * animation library for characters it never drew — 38.9 KB gzipped on
 * `/docs/toron`, measured. See ADR-0009 D7.
 */
export {
  Callout,
  CodeBlock,
  Fail,
  PlaneMark,
  PlaneRow,
  StatRow,
  Step,
  Walk,
  Walkthrough,
  WalkStep,
} from "./docs-content";

export function PageFooter() {
  return (
    <footer className="toron-page__footer">
      <p>toron.dev · the autonomous agent stack</p>
      <p>MIT + Apache-2.0 · the license is the pricing</p>
    </footer>
  );
}
