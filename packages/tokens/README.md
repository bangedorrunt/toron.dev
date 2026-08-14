# @toron/tokens

Design tokens + base components for toron.dev (ADR-0001 D2).

## Files

- `theme.css` — verbatim `--toron-*` token set (dark ground truth), `.paper`
  light variant (WCAG AA tonal variants), Tailwind v4 `@theme` mapping,
  component classes, CSS-only motion (pulse, envelope arrival), reduced-motion
  guard.
- `tokens.ts` — TS export of the token set, paper variants, fonts, state-glyph
  metadata.
- `components/` — React components: `TerminalPane`, `AsciiStrip`,
  `SealedEnvelopeBadge`, `VioletGlow`, `StateGlyph`, `ThemeToggle`,
  `useTheme` hook + FOUC-free init script.

## Usage

```tsx
import "@toron/tokens/theme.css";

// theme toggle (client)
import { ThemeToggle, themeInitScript } from "@toron/tokens/theme-toggle";

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

In `<head>` (prevents theme FOUC):

```tsx
<script dangerouslySetInnerHTML={{ __html: themeInitScript() }} />
```

## Design rules

- Dark is the ground truth; `--toron-*` values in `:root` are verbatim from
  ADR-0001 D2 and must not change.
- Paper variant uses tonal variants of the same hues, verified WCAG AA
  (≥4.5:1) on the light surface.
- State glyphs: `✉ sealed · ✓ delivered · ✓✓ acked · ○ pending · ◉ blocked ·
  ↻ resumed · ✖ rejected`. Functional color always carries a text label or
  `aria-label`.
- Motion is CSS-only: transform/opacity, respects `prefers-reduced-motion`.
