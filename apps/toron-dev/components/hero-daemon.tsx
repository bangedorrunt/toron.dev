import type { CSSProperties, ReactNode } from "react";
import { SealedEnvelopeBadge } from "@toron/tokens/sealed-envelope-badge";
import { StateGlyph } from "@toron/tokens/state-glyph";

const PI_LINES = [
  "$ toron mail send --to opencode --subject \"review: landing\"",
  "  → sealed ✉  43001  (NIP-17 gift-wrap)",
  "  → relay: wss://relay.toron.dev",
];

const OPEN_CODE_LINES = [
  "> inbox  (pi)",
  "  ✉ review: landing        0s ago   ✓✓ acked",
  "  ○ pending: ship build   —        (new)",
];

const WORKFLOW_LINES = {
  steady: [
    "wf  reconcile-build   ▸ running",
    "  → step: lint          ✓",
    "  → step: typecheck     ✓",
    "  → step: build         ▸",
    "  → approval gate       ◉ blocked",
  ],
  crash: [
    "wf  reconcile-build   ✖ crashed",
    "  → step: build         ✖ interrupted",
  ],
  restart: ["daemon: restarting from crash log…"],
  resume: [
    "wf  reconcile-build   ↻ resumed",
    "  → step: build         ✓ (recovered from log)",
    "  → completed           ✓✓",
  ],
} as const;

const envelopeDelays = [0, 1400, 2800, 4200, 5600] as const;

function Pane({
  title,
  status,
  statusClass = "",
  className = "",
  children,
}: {
  title: string;
  status: ReactNode;
  statusClass?: string;
  className?: string;
  children: ReactNode;
}) {
  return (
    <div className={`toron-hero-pane ${className}`}>
      <div className="toron-hero-pane__bar">
        <span className="toron-terminal-dot toron-terminal-dot--red" aria-hidden="true" />
        <span className="toron-terminal-dot toron-terminal-dot--amber" aria-hidden="true" />
        <span className="toron-terminal-dot toron-terminal-dot--green" aria-hidden="true" />
        <span className="toron-terminal-title">{title}</span>
        <span className={`toron-terminal-status ${statusClass}`}>{status}</span>
      </div>
      {children}
    </div>
  );
}

function CycleText({ lines }: { lines: readonly string[] }) {
  return <>{lines.join("\n")}</>;
}

export function HeroDaemon({ className }: { className?: string }) {
  return (
    <section
      className={`toron-hero ${className ?? ""}`}
      aria-label="Kill-the-daemon demo: a toron serve terminal that survives a crash"
    >
      <div className="toron-hero__panes">
        <Pane title="pi · agent" status="online">
          <pre className="toron-hero__log">{PI_LINES.join("\n")}</pre>
        </Pane>

        <div className="toron-hero__envelopes" aria-hidden="true">
          {envelopeDelays.map((delay) => (
            <div key={delay} className="toron-envelope-glyph" style={{ "--toron-env-delay": `${delay}ms` } as CSSProperties}>
              <SealedEnvelopeBadge label="sealed" showLabel={false} delayMs={delay} />
            </div>
          ))}
        </div>

        <Pane title="opencode · agent" status="listening">
          <pre className="toron-hero__log">{OPEN_CODE_LINES.join("\n")}</pre>
        </Pane>

        <div className="toron-crash-flash" aria-hidden="true" />
        <Pane title="toron serve · bus" status={<CycleStatus />} statusClass="toron-terminal-status--cycle" className="toron-hero-pane--daemon">
          <pre className="toron-hero__log toron-hero__log--cycle" aria-hidden="true">
            <span className="toron-cycle-line toron-cycle-line--steady"><CycleText lines={WORKFLOW_LINES.steady} /></span>
            <span className="toron-cycle-line toron-cycle-line--crash"><CycleText lines={WORKFLOW_LINES.crash} /></span>
            <span className="toron-cycle-line toron-cycle-line--restart"><CycleText lines={WORKFLOW_LINES.restart} /></span>
            <span className="toron-cycle-line toron-cycle-line--resume"><CycleText lines={WORKFLOW_LINES.resume} /></span>
          </pre>
        </Pane>
      </div>

      <p className="toron-sr-only">Simulated demo starts in a running state and cycles through crash, restart, and resume.</p>
    </section>
  );
}

function CycleStatus() {
  return (
    <>
      <span className="toron-cycle-status toron-cycle-status--steady"><StateGlyph state="delivered" showLabel={false} /> 3 agents · 0 egress</span>
      <span className="toron-cycle-status toron-cycle-status--crash"><StateGlyph state="rejected" showLabel={false} /> crashed</span>
      <span className="toron-cycle-status toron-cycle-status--restart">restarting…</span>
      <span className="toron-cycle-status toron-cycle-status--resume"><StateGlyph state="resumed" showLabel={false} /> resumed</span>
    </>
  );
}
