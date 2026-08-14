import type { ReactNode } from "react";

export function TerminalPane({
  title,
  status,
  children,
  className,
  id,
}: {
  title: string;
  status?: ReactNode;
  children: ReactNode;
  className?: string;
  id?: string;
}) {
  return (
    <div id={id} className={`toron-terminal ${className ?? ""}`}>
      <div className="toron-terminal-bar">
        <span className="toron-terminal-dot toron-terminal-dot--red" aria-hidden="true" />
        <span className="toron-terminal-dot toron-terminal-dot--amber" aria-hidden="true" />
        <span className="toron-terminal-dot toron-terminal-dot--green" aria-hidden="true" />
        <span className="toron-terminal-title">{title}</span>
        {status ? <span className="toron-terminal-status">{status}</span> : null}
      </div>
      <div className="toron-terminal-body">{children}</div>
    </div>
  );
}
