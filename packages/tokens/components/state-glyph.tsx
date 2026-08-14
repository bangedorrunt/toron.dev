import { stateGlyphs } from "../tokens";
import type { StateGlyphKey } from "../tokens";

export function StateGlyph({
  state,
  label,
  showLabel = true,
  className,
  id,
}: {
  state: StateGlyphKey;
  label?: string;
  showLabel?: boolean;
  className?: string;
  id?: string;
}) {
  const meta = stateGlyphs[state];
  const visibleLabel = label ?? meta.label;

  const glyph = (
    <span
      className={`toron-glyph toron-glyph--${meta.color} ${className ?? ""}`}
      aria-hidden="true"
    >
      {meta.glyph}
    </span>
  );

  if (!showLabel) {
    return (
      <span id={id} role="img" aria-label={meta.description}>
        {glyph}
      </span>
    );
  }

  return (
    <span id={id} className="toron-state-glyph">
      <span className="toron-state-glyph__glyph">{glyph}</span>
      <span>{visibleLabel}</span>
    </span>
  );
}
