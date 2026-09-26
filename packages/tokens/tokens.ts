// governed-by: ADR-0004 D1/D2 (amends ADR-0001 D2)
//
// Near-black canvas + indigo accent. Values mirror theme.css exactly; if
// they drift, theme.css is the one that renders and this file is the lie.
export const toronTokens = {
  bg: "#08090a",
  surface: "#0f1011",
  raised: "#16171a",
  ink: "#f7f8f8",
  body: "#8a8f98",
  muted: "#62666d",
  border: "#23252a",
  borderStrong: "#34363c",
  accent: "#5e6ad2",
  accentBright: "#828fff",
  green: "#4cb782",
  amber: "#f2c94c",
  red: "#eb5757",
  radius: "8px",
  radiusLg: "12px",
  max: "1120px",
} as const;

export const toronPaperTokens = {
  bg: "#ffffff",
  surface: "#f9f9fa",
  raised: "#f1f1f3",
  ink: "#16171a",
  body: "#62666d",
  muted: "#8a8f98",
  border: "#e4e5e8",
  borderStrong: "#d0d1d6",
  accent: "#5e6ad2",
  accentBright: "#4c57c4",
  green: "#1f7a4d",
  amber: "#8a6100",
  red: "#b4232a",
  radius: "8px",
  radiusLg: "12px",
  max: "1120px",
} as const;

// Inter carries both display and body (ADR-0004 D2). Space Grotesk is gone.
export const toronFonts = {
  display: '"Inter", ui-sans-serif, system-ui, sans-serif',
  body: '"Inter", ui-sans-serif, system-ui, sans-serif',
  mono: '"JetBrains Mono", ui-monospace, SFMono-Regular, Menlo, monospace',
} as const;

export type ToronTheme = "dark" | "paper";

export type StateGlyphColor = "accent" | "green" | "amber" | "red" | "body";

export type StateGlyphKey =
  | "sealed"
  | "delivered"
  | "acked"
  | "pending"
  | "blocked"
  | "resumed"
  | "rejected";

export interface StateGlyphMeta {
  glyph: string;
  label: string;
  color: StateGlyphColor;
  description: string;
}

export const stateGlyphs: Record<StateGlyphKey, StateGlyphMeta> = {
  sealed: { glyph: "\u2709", label: "sealed", color: "accent", description: "E2E sealed" },
  delivered: { glyph: "\u2713", label: "delivered", color: "green", description: "delivered" },
  acked: { glyph: "\u2713\u2713", label: "acked", color: "green", description: "acked" },
  pending: { glyph: "\u25CB", label: "pending", color: "body", description: "pending" },
  blocked: { glyph: "\u25C9", label: "blocked", color: "amber", description: "blocked" },
  resumed: { glyph: "\u21BB", label: "resumed", color: "green", description: "resumed" },
  rejected: { glyph: "\u2716", label: "rejected", color: "red", description: "rejected" },
};
