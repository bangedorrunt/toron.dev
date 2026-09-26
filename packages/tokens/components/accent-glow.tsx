export function AccentGlow({
  className,
  id,
}: {
  className?: string;
  id?: string;
}) {
  return <div id={id} className={`toron-glow ${className ?? ""}`} aria-hidden="true" />;
}
