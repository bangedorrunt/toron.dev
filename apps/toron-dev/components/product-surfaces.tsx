import type { ReactNode } from "react";

/*
 * governed-by: ADR-0004 D3
 *
 * Server-rendered product surfaces. These are the landing-page and guide
 * figures: real DOM, real type, zero client JavaScript. They are illustrative
 * mockups, not a live daemon (ADR-0001 D4) — every one renders a caption that
 * says so, because a figure that looks live and is not is a credibility bug.
 */

export function AppWindow({
  title,
  meta,
  children,
  flush = false,
}: {
  title: string;
  meta?: ReactNode;
  children: ReactNode;
  flush?: boolean;
}) {
  return (
    <div className="toron-window">
      <div className="toron-window__bar">
        <span className="toron-window__dots" aria-hidden="true">
          <span className="toron-terminal-dot toron-terminal-dot--red" />
          <span className="toron-terminal-dot toron-terminal-dot--amber" />
          <span className="toron-terminal-dot toron-terminal-dot--green" />
        </span>
        <span className="toron-window__title">{title}</span>
        {meta ? <span className="toron-window__meta">{meta}</span> : null}
      </div>
      <div className={`toron-window__body${flush ? " toron-window__body--flush" : ""}`}>
        {children}
      </div>
    </div>
  );
}

export function FigureCaption({ children }: { children: ReactNode }) {
  return <p className="toron-figure-caption">{children}</p>;
}

/* ---------------------------------------------------------------- mailbox */

type MailRow = {
  state: "sealed" | "acked" | "blocked" | "pending";
  subject: string;
  from: string;
  note: string;
};

const INBOX: MailRow[] = [
  {
    state: "sealed",
    subject: "[bead-xo2] landing redesign brief",
    from: "captain → QuietHarbor",
    note: "sealed · relay holds no plaintext",
  },
  {
    state: "acked",
    subject: "[bead-xo2] claimed, reserving paths",
    from: "QuietHarbor → captain",
    note: "✓✓ acked 0.4s",
  },
  {
    state: "blocked",
    subject: "[bead-qf4] cannot fetch catalog",
    from: "DustySparrow → captain",
    note: "◉ blocked · ack overdue 31m",
  },
  {
    state: "pending",
    subject: "[bead-xo2] gate report: pass",
    from: "QuietHarbor → captain",
    note: "○ owed · not yet read",
  },
];

const MAIL_GLYPH: Record<MailRow["state"], { glyph: string; tone: string }> = {
  sealed: { glyph: "✉", tone: "toron-glyph--accent" },
  acked: { glyph: "✓✓", tone: "toron-glyph--green" },
  blocked: { glyph: "◉", tone: "toron-glyph--amber" },
  pending: { glyph: "○", tone: "toron-glyph--body" },
};

export function MailboxSurface() {
  return (
    <ul className="toron-mail">
      {INBOX.map((row) => {
        const meta = MAIL_GLYPH[row.state];
        return (
          <li className="toron-mail__row" key={row.subject}>
            <span className={`toron-mail__glyph toron-glyph ${meta.tone}`} aria-hidden="true">
              {meta.glyph}
            </span>
            <span className="toron-mail__main">
              <span className="toron-mail__subject">{row.subject}</span>
              <span className="toron-mail__from">{row.from}</span>
            </span>
            <span className="toron-mail__state">{row.note}</span>
          </li>
        );
      })}
    </ul>
  );
}

/* ------------------------------------------------------------------ board */

type Issue = {
  id: string;
  title: string;
  label?: string;
  tone?: "accent" | "green" | "amber" | "red";
  who: string;
};

const BOARD: { column: string; count: number; issues: Issue[] }[] = [
  {
    column: "Ready",
    count: 4,
    issues: [
      { id: "br-xo2", title: "Landing page grammar", label: "site", tone: "accent", who: "QH" },
      {
        id: "br-k71",
        title: "Walkthrough: first sealed mail",
        label: "docs",
        tone: "accent",
        who: "QH",
      },
      { id: "br-m08", title: "Catalog freshness gate", label: "gate", who: "DO" },
    ],
  },
  {
    column: "In progress",
    count: 2,
    issues: [
      {
        id: "br-p43",
        title: "Tool-page descriptions from catalog",
        label: "docs",
        tone: "accent",
        who: "SI",
      },
      { id: "br-r12", title: "Compare matrix refresh", label: "site", who: "MV" },
    ],
  },
  {
    column: "Blocked",
    count: 1,
    issues: [
      {
        id: "br-qf4",
        title: "Sync catalog from product repo",
        label: "blocked",
        tone: "amber",
        who: "DS",
      },
    ],
  },
  {
    column: "Closed",
    count: 13,
    issues: [
      {
        id: "br-t77",
        title: "Reservation lifecycle diagram",
        label: "pass",
        tone: "green",
        who: "QH",
      },
      {
        id: "br-v21",
        title: "Verify fence in bead template",
        label: "pass",
        tone: "green",
        who: "DO",
      },
    ],
  },
];

export function BoardSurface() {
  return (
    <div className="toron-board">
      {BOARD.map((col) => (
        <div className="toron-board__col" key={col.column}>
          <p className="toron-board__head">
            {col.column}
            <span className="toron-board__count">{col.count}</span>
          </p>
          <ul className="toron-board__rows">
            {col.issues.map((issue) => (
              <li className="toron-issue" key={issue.id}>
                <span className="toron-issue__id">{issue.id}</span>
                <span className="toron-issue__title">{issue.title}</span>
                <span className="toron-issue__meta">
                  <span className={`toron-chip${issue.tone ? ` toron-chip--${issue.tone}` : ""}`}>
                    {issue.label ?? "task"}
                  </span>
                  <span className="toron-avatar" aria-hidden="true">
                    {issue.who}
                  </span>
                </span>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
}

/* ------------------------------------------------------------------- loop */

type LogLine = { text: string; tone?: "key" | "ok" | "warn" | "bad" | "accent" | "dim" };

const LOOP: LogLine[] = [
  { text: '$ flywheel briefing "ship the change" --project torondev --json', tone: "key" },
  { text: "  vehicle: none (raw) — no catalog route, no live fleet", tone: "dim" },
  { text: "  ready_beads: 4 · held_paths: 0 · dispatcher: absent", tone: "dim" },
  { text: "$ br ready --json", tone: "key" },
  { text: "  br-xo2  Ready     landing page grammar        verify: bun run build", tone: "ok" },
  { text: "  br-k71  Ready     walkthrough: first mail    verify: sh -n install.sh", tone: "ok" },
  { text: '$ toron reserve acquire --paths "apps/toron-dev/app/*"', tone: "key" },
  { text: "  granted · conflicts: [] · reason: br-xo2", tone: "accent" },
  { text: "… daemon restart …", tone: "warn" },
  { text: "  ↻ resumed from journal — 0 work items re-dispatched", tone: "ok" },
];

export function LoopSurface() {
  return (
    <div className="toron-log">
      {LOOP.map((line, index) => (
        <span
          className={`toron-log__line${line.tone ? ` toron-log__line--${line.tone}` : ""}`}
          key={index}
        >
          {line.text}
        </span>
      ))}
    </div>
  );
}

/* ----------------------------------------------------------------- ledger */

type GateRow = {
  name: string;
  status: "pass" | "held" | "pending";
  tone: "green" | "amber" | "body";
  evidence: string;
};

const GATES: GateRow[] = [
  {
    name: "verify · bun run build",
    status: "pass",
    tone: "green",
    evidence: "61 routes · 0 type errors",
  },
  { name: "verify · bun run lint", status: "pass", tone: "green", evidence: "0 problems" },
  {
    name: "gate · catalog freshness",
    status: "pass",
    tone: "green",
    evidence: "38 tools · 25 resources",
  },
  { name: "gate · route smoke", status: "pass", tone: "green", evidence: "12/12 → 200" },
  {
    name: "gate · guide output shown",
    status: "held",
    tone: "amber",
    evidence: "3 walkthroughs missing output",
  },
  { name: "close · commit cites bead", status: "pending", tone: "body", evidence: "awaiting sha" },
];

export function LedgerSurface() {
  return (
    <ul className="toron-ledger">
      {GATES.map((gate) => (
        <li className="toron-ledger__row" key={gate.name}>
          <span className="toron-ledger__name">{gate.name}</span>
          <span className={`toron-chip toron-chip--${gate.tone}`}>{gate.status}</span>
          <span className="toron-ledger__evidence">{gate.evidence}</span>
        </li>
      ))}
    </ul>
  );
}

/* ----------------------------------------------------------------- memory */

const MEMORY = [
  {
    source: "memory://torondev/decided",
    claim:
      "the design tokens are locked by ADR; a palette change needs its own ADR before any CSS moves.",
  },
  {
    source: "docs/learnings/next-16-fonts.md",
    claim: "Next 16.2.x mis-resolves fonts under Turbopack — pin the version and check the build.",
  },
  {
    source: "wiki://toron/mail-plane",
    claim:
      "kind 9 is the room, 1059 is the sealed letter, 43001 is a job. Never gift-wrap a room post.",
  },
];

export function MemorySurface() {
  return (
    <ul className="toron-memory">
      {MEMORY.map((hit) => (
        <li className="toron-memory__hit" key={hit.source}>
          <span className="toron-memory__source">{hit.source}</span>
          <span className="toron-memory__claim">{hit.claim}</span>
        </li>
      ))}
    </ul>
  );
}

/* -------------------------------------------------------------------- api */

export function ApiSurface({ rows }: { rows: [string, string][] }) {
  return (
    <div className="toron-api">
      {rows.map(([key, value]) => (
        <div className="toron-api__row" key={key}>
          <span className="toron-api__key">{key}</span>
          <span className="toron-api__val">{value}</span>
        </div>
      ))}
    </div>
  );
}
