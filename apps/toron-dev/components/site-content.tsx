import type { ReactNode } from "react";
import Link from "next/link";

/*
 * governed-by: ADR-0004 D3/D5/D6
 *
 * The marketing kit. A section is a numbered claim carrying a figure. A
 * walkthrough is a numbered action carrying its output and its failure mode.
 */

/* ------------------------------------------------------------------ shell */

export function SitePage({
  eyebrow,
  title,
  description,
  children,
}: {
  eyebrow: string;
  title: string;
  description: string;
  children: ReactNode;
}) {
  return (
    <main className="toron-page">
      <header className="toron-page__header">
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
  // `name` is the product name as it is displayed, `slug` is the path segment it
  // links into. The two differ only in the leading capital, and conflating them
  // is what kept the section titles lowercase in the first place.
  const planes = [
    {
      name: "Toron",
      slug: "toron",
      role: "signed mail · identity · receipts · reservations",
      href: "https://github.com/bangedorrunt/toron",
    },
    {
      name: "Flywheel",
      slug: "flywheel",
      role: "spawn · dispatch · loops · workflows · cron",
      href: "https://github.com/bangedorrunt/flywheel",
    },
    {
      name: "Beads",
      slug: "beads",
      role: "work items · dependencies · gates · close evidence",
      href: "https://github.com/bangedorrunt/br",
    },
    {
      name: "Chiebukuro",
      slug: "chiebukuro",
      role: "curated knowledge · episodic memory · synthesis",
      href: "https://github.com/bangedorrunt/chiebukuro",
    },
  ];

  return (
    <div className="toron-stack-strip" aria-label="The four planes of the autonomous agent stack">
      {planes.map((plane) => (
        <a
          key={plane.slug}
          href={plane.href}
          target="_blank"
          rel="noreferrer"
          className="toron-stack-strip__item"
        >
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
  children,
  href,
}: {
  title: string;
  eyebrow?: string;
  badge?: string;
  children: ReactNode;
  href?: string;
}) {
  const content = (
    <>
      {eyebrow ? <p className="toron-card__eyebrow">{eyebrow}</p> : null}
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

export function PageFooter() {
  return (
    <footer className="toron-page__footer">
      <p>toron.dev · the autonomous agent stack</p>
      <p>MIT + Apache-2.0 · the license is the pricing</p>
    </footer>
  );
}
