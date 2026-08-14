import type { CSSProperties } from "react";

export function SealedEnvelopeBadge({
  label = "sealed",
  showLabel = true,
  className,
  id,
  delayMs = 0,
}: {
  label?: string;
  showLabel?: boolean;
  className?: string;
  id?: string;
  delayMs?: number;
}) {
  const style = delayMs > 0
    ? ({ "--toron-env-delay": `${delayMs}ms` } as CSSProperties)
    : undefined;

  const glyph = (
    <span className="toron-envelope-glyph" style={style} aria-hidden="true">
      {"\u2709"}
    </span>
  );

  if (!showLabel) {
    return (
      <span id={id} className={`toron-envelope-badge ${className ?? ""}`} role="img" aria-label="sealed E2E">
        {glyph}
      </span>
    );
  }

  return (
    <span id={id} className={`toron-envelope-badge ${className ?? ""}`}>
      {glyph}
      <span>{label}</span>
    </span>
  );
}
