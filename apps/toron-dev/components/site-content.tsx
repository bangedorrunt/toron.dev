import type { ReactNode } from "react";
import Link from "next/link";

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
  eyebrow,
  title,
  description,
  children,
}: {
  id?: string;
  eyebrow?: string;
  title: string;
  description?: string;
  children: ReactNode;
}) {
  return (
    <section id={id} className="toron-page__section" aria-labelledby={`${id ?? title.toLowerCase().replaceAll(" ", "-")}-title`}>
      {eyebrow ? <p className="toron-page__eyebrow">{eyebrow}</p> : null}
      <h2 id={`${id ?? title.toLowerCase().replaceAll(" ", "-")}-title`}>{title}</h2>
      {description ? <p className="toron-page__section-description">{description}</p> : null}
      {children}
    </section>
  );
}

export function StackStrip() {
  const planes = [
    { name: "toron", role: "transport · trust · record", href: "https://github.com/bangedorrunt/toron" },
    { name: "flywheel", role: "orchestration · dispatch · loops", href: "https://github.com/bangedorrunt/flywheel" },
    { name: "beads", role: "work ledger · gates · evidence", href: "https://github.com/bangedorrunt/br" },
    { name: "chiebukuro", role: "knowledge · memory · synthesis", href: "https://github.com/bangedorrunt/chiebukuro" },
  ];

  return (
    <div className="toron-stack-strip" aria-label="The four planes of the autonomous agent stack">
      {planes.map((plane) => (
        <a key={plane.name} href={plane.href} target="_blank" rel="noreferrer" className="toron-stack-strip__item">
          <span className="toron-stack-strip__name">{plane.name}</span>
          <span className="toron-stack-strip__role">{plane.role}</span>
        </a>
      ))}
    </div>
  );
}

export function SurfaceCard({
  title,
  eyebrow,
  children,
  href,
}: {
  title: string;
  eyebrow?: string;
  children: ReactNode;
  href?: string;
}) {
  const content = (
    <>
      {eyebrow ? <p className="toron-card__eyebrow">{eyebrow}</p> : null}
      <h3>{title}</h3>
      <div className="toron-card__body">{children}</div>
    </>
  );

  return href ? (
    <Link href={href} className="toron-card toron-card--link">
      {content}
      <span className="toron-card__arrow" aria-hidden="true">↗</span>
    </Link>
  ) : (
    <article className="toron-card">{content}</article>
  );
}

export function CodeBlock({ children, label }: { children: string; label?: string }) {
  return (
    <figure className="toron-code-block">
      {label ? <figcaption>{label}</figcaption> : null}
      <pre><code>{children}</code></pre>
    </figure>
  );
}

export function PageFooter() {
  return (
    <footer className="toron-page__footer">
      <p>toron.dev · one stack for autonomous multi-agent work</p>
      <p>MIT + Apache-2.0 · the license is the pricing</p>
    </footer>
  );
}
