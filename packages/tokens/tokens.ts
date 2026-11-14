// governed-by: ADR-0011 D1/D2 (amends ADR-0004 D1/D2)
//
// Values mirror theme.css exactly; if they drift, theme.css is the one that
// renders and this file is the lie.
export const toronTokens = {
  bg: "#0b0c0e",
  surface: "#111214",
  raised: "#17181b",
  overlay: "#1c1e22",
  ink: "#f4f5f6",
  body: "#9a9ea6",
  muted: "#7b7f87",
  border: "#24262b",
  borderStrong: "#35383f",
  accent: "#6e79d6",
  accentBright: "#a0a8f5",
  green: "#63a98a",
  amber: "#c8a75f",
  red: "#c97c7c",
  radiusXs: "4px",
  radius: "6px",
  radiusLg: "8px",
  max: "1120px",
} as const;

export const toronPaperTokens = {
  bg: "#fcfcfd",
  surface: "#f6f7f8",
  raised: "#eef0f2",
  overlay: "#ffffff",
  ink: "#17181b",
  body: "#565b63",
  muted: "#70757d",
  border: "#e3e5e8",
  borderStrong: "#d2d5da",
  accent: "#5561c9",
  accentBright: "#414dbb",
  green: "#2c6e51",
  amber: "#7a5f1c",
  red: "#a33c3c",
  radiusXs: "4px",
  radius: "6px",
  radiusLg: "8px",
  max: "1120px",
} as const;

// Operator SSm Plus carries both display and body. Operator Mono SSm Plus is
// reserved for machine text.
export const toronFonts = {
  display: 'var(--font-operator), "Operator SSM Plus", ui-sans-serif, system-ui, sans-serif',
  body: 'var(--font-operator), "Operator SSM Plus", ui-sans-serif, system-ui, sans-serif',
  mono: 'var(--font-operator-mono), "Operator Mono SSM Plus", ui-monospace, SFMono-Regular, Menlo, monospace',
} as const;

/** The 4px density scale the site's spacing is built from. */
export const toronSpace = [4, 8, 12, 16, 20, 24, 32, 40] as const;

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
