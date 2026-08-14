export const toronTokens = {
  bg: "#0a0a0f",
  violet: "#8b5cf6",
  green: "#34d399",
  amber: "#f59e0b",
  red: "#f87171",
  ink: "#f5f3ff",
  body: "#a3a3b8",
  border: "#26262e",
  radius: "6px",
  max: "1160px",
  surface: "#12121a",
} as const;

export const toronPaperTokens = {
  bg: "#f5f3ff",
  surface: "#ffffff",
  ink: "#1a1a22",
  body: "#4b4b5c",
  border: "#d9d6e8",
  violet: "#6d3ff0",
  green: "#2e7d32",
  amber: "#92400e",
  red: "#b91c1c",
  radius: "6px",
  max: "1160px",
} as const;

export const toronFonts = {
  display: '"Space Grotesk", ui-sans-serif, system-ui, sans-serif',
  body: '"Inter", ui-sans-serif, system-ui, sans-serif',
  mono: '"JetBrains Mono", ui-monospace, SFMono-Regular, Menlo, monospace',
} as const;

export type ToronTheme = "dark" | "paper";

export type StateGlyphColor = "violet" | "green" | "amber" | "red" | "body";

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
  sealed: { glyph: "\u2709", label: "sealed", color: "violet", description: "E2E sealed" },
  delivered: { glyph: "\u2713", label: "delivered", color: "green", description: "delivered" },
  acked: { glyph: "\u2713\u2713", label: "acked", color: "green", description: "acked" },
  pending: { glyph: "\u25CB", label: "pending", color: "body", description: "pending" },
  blocked: { glyph: "\u25C9", label: "blocked", color: "amber", description: "blocked" },
  resumed: { glyph: "\u21BB", label: "resumed", color: "green", description: "resumed" },
  rejected: { glyph: "\u2716", label: "rejected", color: "red", description: "rejected" },
};
