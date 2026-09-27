import defaultMdxComponents from "fumadocs-ui/mdx";
import type { MDXComponents } from "mdx/types";
// From `./docs-content`, never `./site-content`: that module imports the client
// character, and importing it here is what put 38.9 KB of animation library on
// every docs page. See ADR-0009 D7.
import { Callout, CodeBlock, Fail, PlaneMark, PlaneRow, StatRow, Step, Walk } from "./docs-content";
// A client component, and the exception that proves the rule above. `MorphNav` is
// ~1 KB of this repo's own code with no library behind it, it renders nothing, and
// the alternative was leaving the index's tiles without the morph on the click path
// (ADR-0010 D4). The rule it does not break is the measured one: no part of the
// animation library reaches a docs page, and the harness checks that on every run.
import { MorphNav } from "./morph-nav";
import {
  ApiSurface,
  AppWindow,
  BoardSurface,
  FigureCaption,
  LedgerSurface,
  LoopSurface,
  MailboxSurface,
  MemorySurface,
} from "./product-surfaces";

/*
 * governed-by: ADR-0004 D6
 *
 * Guides are MDX, but the walkthrough shape (number, command, output, failure
 * mode) is a component contract so a guide cannot quietly become a prose page.
 */
export function getMDXComponents(components?: MDXComponents) {
  return {
    ...defaultMdxComponents,
    // Walkthrough vocabulary
    Walk,
    Step,
    Fail,
    // Figures
    AppWindow,
    FigureCaption,
    BoardSurface,
    MailboxSurface,
    LoopSurface,
    LedgerSurface,
    MemorySurface,
    ApiSurface,
    // The four characters, where a guide set is about them
    PlaneMark,
    PlaneRow,
    // The tile click on the docs index, wrapped in a view transition
    MorphNav,
    // Primitives
    CodeBlock,
    Callout,
    StatRow,
    ...components,
  } satisfies MDXComponents;
}

export const useMDXComponents = getMDXComponents;

declare global {
  type MDXProvidedComponents = ReturnType<typeof getMDXComponents>;
}
