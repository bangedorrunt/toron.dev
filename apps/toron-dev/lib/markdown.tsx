/*
 * governed-by: ADR-0005 D2
 *
 * Markdown forms for the MDX components. The page tools and the `.md` routes
 * read the processed document, and a processed document still contains JSX
 * until a component says what its Markdown form is. Without this map an agent
 * fetching `/docs/<slug>.md` or calling `get_page` over MCP receives the
 * component tags verbatim, which is the one thing a reader of that text cannot
 * use.
 *
 * Each component calls `asMarkdown()` to opt in. A component that does not opt
 * in is serialized as JSX by fumadocs, so the map is the fix, not a filter
 * applied afterwards.
 *
 * The forms favour what an agent needs: the heading, the command, the failure
 * mode. They drop the visual chrome (window bars, glyphs, figure frames)
 * because a terminal reader has no use for it. `scripts/check-freshness.mjs`
 * fails the build when a component used in content has no entry here, so a new
 * component cannot quietly start leaking.
 */

import { asMarkdown, md } from "fumadocs-core/server";
import { LOOP } from "@/components/product-surfaces";
import type { ReactNode } from "react";

/** A numbered step. The number is the point, so it leads. */
function Step({ n, title, children }: { n: number; title: string; children?: ReactNode }) {
  asMarkdown();
  return (
    <>
      <h3>{`Step ${n}. ${title}`}</h3>
      {children}
    </>
  );
}

/** A failure mode. Rendered as a blockquote so it reads as a warning, not a step. */
function Fail({ diagnose, children }: { diagnose?: string; children?: ReactNode }) {
  asMarkdown();
  return (
    <blockquote>
      <p>
        <strong>If it fails.</strong> {children}
        {diagnose ? (
          <>
            {" "}
            Run <code>{diagnose}</code>.
          </>
        ) : null}
      </p>
    </blockquote>
  );
}

/** The walkthrough frame. Its outcome is the promise the steps deliver on. */
function Walk({ outcome, children }: { outcome: ReactNode; children?: ReactNode }) {
  asMarkdown();
  return (
    <>
      <blockquote>
        <p>{outcome}</p>
      </blockquote>
      {children}
    </>
  );
}

/** An aside. Title first, then the argument. */
function Callout({ title, children }: { title: string; children?: ReactNode }) {
  asMarkdown();
  return (
    <blockquote>
      <p>
        <strong>{title}.</strong> {children}
      </p>
    </blockquote>
  );
}

/** A link card. The title is the link; the body is why it is worth the click. */
function Card({
  title,
  href,
  description,
  children,
}: {
  title: ReactNode;
  href?: string;
  description?: ReactNode;
  children?: ReactNode;
}) {
  asMarkdown();
  const body = description ?? children;
  return (
    <>
      <p>
        <strong>{href ? <a href={href}>{title}</a> : title}</strong>
      </p>
      {body}
    </>
  );
}

/** A grid of cards. The grid is a layout concern and does not survive. */
function Cards({ children }: { children?: ReactNode }) {
  asMarkdown();
  return <>{children}</>;
}

/** A terminal figure. The title bar is chrome; the body is the content. */
function AppWindow({
  title,
  children,
}: {
  title: string;
  meta?: ReactNode;
  flush?: boolean;
  children?: ReactNode;
}) {
  asMarkdown();
  return (
    <>
      <p>
        <strong>{title}</strong>
      </p>
      {children}
    </>
  );
}

/** A figure caption. Every figure here renders one saying the mockup is not live. */
function FigureCaption({ children }: { children?: ReactNode }) {
  asMarkdown();
  return (
    <p>
      <em>{children}</em>
    </p>
  );
}

/**
 * The loop figure is a transcript, so its Markdown form is the transcript. The
 * lines come from the figure's own constant, never a copy: a second copy would
 * drift, and a reader comparing page against text would be reading fiction in
 * one of the two.
 */
function LoopSurface() {
  asMarkdown();
  return (
    <pre>
      <code>{LOOP.map((line) => line.text).join("\n")}</code>
    </pre>
  );
}

/** Two-column rows as a Markdown table, which is how a key/value list reads. */
function ApiSurface({ rows }: { rows: [string, string][] }) {
  asMarkdown();
  return (
    <table>
      <tbody>
        {rows.map(([key, value]) => (
          <tr key={key}>
            <th>{key}</th>
            <td>{value}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

export const markdownComponents = {
  AppWindow,
  ApiSurface,
  Callout,
  Card,
  Cards,
  Fail,
  FigureCaption,
  LoopSurface,
  Step,
  Walk,
} as const;

/**
 * `md` is re-exported so a component that needs to stringify children before
 * wrapping them (an admonition around a fenced block, say) does not have to
 * reach past this module into fumadocs.
 */
export { md };
