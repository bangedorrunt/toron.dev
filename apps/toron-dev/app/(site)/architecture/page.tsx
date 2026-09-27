import type { Metadata } from "next";
import Link from "next/link";
import { PLANE_SLUGS } from "@/lib/planes";
import { AppWindow, FigureCaption, LoopSurface } from "@/components/product-surfaces";
import {
  CTABand,
  CodeBlock,
  PageFooter,
  Section,
  SitePage,
  StackStrip,
  SurfaceCard,
} from "@/components/site-content";

export const metadata: Metadata = {
  title: "Architecture: the four planes",
  description:
    "Which plane owns mail, dispatch, work evidence, and memory, what each one refuses to do, and how they hand off to each other.",
};

const ownership: [string, string, string][] = [
  ["toron", "Mail, identity, receipts, reservations, archive", "Transport and system of record"],
  ["flywheel", "Spawn, dispatch, loops, workflows, cron, coalitions", "The control loop"],
  ["beads", "Work items, dependencies, gates, close evidence", "The accountable ledger"],
  ["chiebukuro", "Curated knowledge, episodic memory, synthesis", "The learning plane"],
];

export default function ArchitecturePage() {
  return (
    <SitePage
      eyebrow="Architecture"
      title="Four planes. One execution loop."
      description="Every agent gets a way to talk, a way to act, a way to prove what happened, and a way to remember. These four jobs are owned by four projects, and the boundaries between them are the reason the loop works."
      marks={PLANE_SLUGS}
    >
      <Section
        index="1.0"
        label="The loop"
        title="A goal becomes work that can survive a crash."
        lede="The stack is a small control loop. Each plane hands a durable artifact to the next, so nothing depends on a pane staying alive."
      >
        <AppWindow title="execution loop · torondev">
          <CodeBlock out>{`goal
  ↓ flywheel plans, dispatches, and keeps polling
  ↓ beads makes the smallest unit claimable and verifiable
  ↓ toron carries the signed handoff, the receipt, and the reservation
  ↓ agents execute · crash · resume · acknowledge
  ↓ verification evidence returns to the ledger
  ↓ chiebukuro compounds the useful memory
  ↺ next cycle starts from evidence, not scrollback`}</CodeBlock>
        </AppWindow>
        <FigureCaption>Each arrow is a durable artifact, not a function call</FigureCaption>

        <div className="toron-grid" style={{ marginTop: "1.5rem" }}>
          <SurfaceCard
            eyebrow="Plan"
            title="Break the goal into lanes"
            href="/how-it-works"
            mark="flywheel"
          >
            flywheel turns intent into work with dependencies and proof targets, then owns the
            dispatch policy.
          </SurfaceCard>
          <SurfaceCard
            eyebrow="Carry"
            title="Make the handoff signed"
            href="/security"
            mark="toron"
          >
            toron turns each handoff into a sealed message with a receipt and a path reservation.
          </SurfaceCard>
          <SurfaceCard eyebrow="Close" title="Record the evidence" href="/features" mark="beads">
            beads records the gate row. chiebukuro keeps the conclusion. The next run starts
            smarter.
          </SurfaceCard>
        </div>
      </Section>

      <Section
        index="2.0"
        label="Ownership"
        title="Every hard problem has exactly one owner."
        lede="This table is canonical. If a capability is not listed under a plane, that plane does not own it, and the site will not claim otherwise."
      >
        <StackStrip />
        <div
          className="toron-ownership-table"
          role="table"
          aria-label="Autonomous stack plane ownership"
          style={{ marginTop: "1.5rem" }}
        >
          <div className="toron-ownership-table__row toron-ownership-table__row--head" role="row">
            <span role="columnheader">Plane</span>
            <span role="columnheader">Owns</span>
            <span role="columnheader">Role</span>
          </div>
          {ownership.map(([plane, owns, role]) => (
            <div className="toron-ownership-table__row" role="row" key={plane}>
              <strong role="cell">{plane}</strong>
              <span role="cell">{owns}</span>
              <span role="cell">{role}</span>
            </div>
          ))}
        </div>
      </Section>

      <Section
        index="3.0"
        label="Handoff"
        title="The loop only moves if the handoffs are real."
        lede="A handoff is real when the receiving plane can act on it without asking a human what the sending plane meant. That is what each arrow below buys."
      >
        <AppWindow title="handoff surface · torondev" meta="dispatcher: absent">
          <LoopSurface />
        </AppWindow>
        <FigureCaption>The CLI path: briefing, ready work, reservation, resume</FigureCaption>
      </Section>

      <Section
        index="4.0"
        label="Boundaries"
        title="A plane is defined by what it refuses to do."
        lede="Each of these is a real limitation, stated so you can decide whether the stack fits before you install it."
      >
        <div className="toron-grid">
          <SurfaceCard eyebrow="Not a runtime" title="toron is not a terminal">
            A multiplexer keeps a pane alive. toron keeps the work relationship alive across
            processes, machines, and restarts. They compose rather than compete.
          </SurfaceCard>
          <SurfaceCard eyebrow="Not a ledger" title="flywheel is not the queue">
            flywheel decides how work moves. beads records what was claimed, blocked, verified, and
            closed, and holds the gate rows that authorise a close.
          </SurfaceCard>
          <SurfaceCard eyebrow="Not the bus" title="chiebukuro is not the mailbox">
            chiebukuro turns retrieved knowledge and observed events into queryable memory. toron
            carries the signed handoff between agents.
          </SurfaceCard>
        </div>
      </Section>

      <CTABand
        title="Trace a single goal through all four planes."
        body="The how-it-works page walks the message flow, the job race, the crash path, and dual recovery as eight build-time diagrams."
      >
        <Link href="/how-it-works" className="toron-btn toron-btn--primary toron-btn--lg">
          See how it works
        </Link>
      </CTABand>

      <PageFooter />
    </SitePage>
  );
}
