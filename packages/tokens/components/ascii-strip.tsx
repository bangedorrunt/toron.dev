export function AsciiStrip({
  children,
  title,
  className,
  id,
  "aria-label": ariaLabel,
}: {
  children: string;
  title?: string;
  className?: string;
  id?: string;
  "aria-label"?: string;
}) {
  return (
    <div id={id} className={className}>
      {title ? <div className="toron-ascii-title">{title}</div> : null}
      <pre className="toron-ascii" aria-label={ariaLabel}>
        {children}
      </pre>
    </div>
  );
}
