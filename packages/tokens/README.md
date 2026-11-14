# @toron/tokens

Design tokens + base components for toron.dev (ADR-0011 D1/D2, amending
ADR-0004 D1/D2 and ADR-0001 D2).

## Files

- `theme.css` — verbatim `--toron-*` token set (neutral graphite dark ground
  truth), a 4px density scale, `.paper` light variant (WCAG AA tonal variants),
  Tailwind v4 `@theme` mapping, component classes, CSS-only motion (pulse,
  envelope arrival), reduced-motion guard.
- `tokens.ts` — TS export of the token set, paper variants, fonts, state-glyph
  metadata.
- `components/` — React components: `TerminalPane`, `AsciiStrip`,
  `SealedEnvelopeBadge`, `AccentGlow`, `StateGlyph`, `ThemeToggle`,
  `useTheme` hook + FOUC-free init script.

## Usage

```tsx
import "@toron/tokens/theme.css";

// theme init script (server-safe; prevents FOUC) + toggle (client)
import { themeInitScript } from "@toron/tokens/theme-init";
import { ThemeToggle } from "@toron/tokens/theme-toggle";

// tokens
import { toronTokens, stateGlyphs } from "@toron/tokens/tokens";

// base components
import { TerminalPane } from "@toron/tokens/terminal-pane";
import { StateGlyph } from "@toron/tokens/state-glyph";
```

In the app `globals.css`:

```css
@import "@toron/tokens/theme.css";
```

In the root layout (server component — `theme-init` is client-free):

```tsx
<script dangerouslySetInnerHTML={{ __html: themeInitScript() }} />
```

## Design rules

- Dark is the ground truth; `--toron-*` values in `:root` are verbatim from
  ADR-0011 D1 and must not change without a further ADR amendment.
- Density comes from the 4px scale and the 30px control / 34px row tokens; do
  not add spacing that is not on the scale.
- Radii are 4px (chips, keys), 6px (controls, panels), and 8px (dialogs only).
  Content surfaces are flat with hairline separators, not cards.
- The `--toron-*` namespace names the site, not the accent. The accent token is
  `--toron-accent`; there is no `--toron-violet`.
- Paper variant uses tonal variants of the same hues, verified WCAG AA
  (≥4.5:1) on the light surface.
- State glyphs: `✉ sealed · ✓ delivered · ✓✓ acked · ○ pending · ◉ blocked ·
  ↻ resumed · ✖ rejected`. Functional color always carries a text label or
  `aria-label`.
- Motion is CSS-only: transform/opacity, respects `prefers-reduced-motion`.
