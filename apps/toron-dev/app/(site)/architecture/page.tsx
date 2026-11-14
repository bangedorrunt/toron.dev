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
    "Which plane owns mail, dispatch, work evidence, and memory, what each one refuses to do, and the durable state machines they hand to each other.",
};

const ownership: [string, string, string][] = [
  [
    "toron",
    "Signed mail, addressable inbox, receipts, identity, reservations and slots, durable workflows, archive",
    "Transport and record",
  ],
  [
    "flywheel",
    "Session door, dispatch, durable loop, workflows and compose, effect kernel, coalitions, judgment packs, cron, fleet ops",
    "The control loop",
  ],
  [
    "beads",
    "Work items, dispatchability, claims and staleness, dependencies, gate rows, close ceremony, graph analysis",
    "The accountable ledger",
  ],
  [
    "chiebukuro",
    "Knowledge plane, memory plane, Dreamer, recall with provenance, session tree, synthesis",
    "The learning plane",
  ],
];

const STATE_MODELS: [string, string, string, string][] = [
  [
    "toron",
    "Message receipt",
    "owed → acked → resulted; acked → degraded",
    "toron receipt get --corr <id>",
  ],
  [
    "beads",
    "Work item",
    "open → in_progress → closed; closed → open",
    "br show <id> --json · br gate list <id>",
  ],
  [
    "toron + flywheel",
    "Durable run and effect",
    "queued → running → suspended → completed or failed; Prepared → Claimed → Running → Delivered, Failed, or Unknown",
    "flywheel artifacts <run-id> · toron doctor",
  ],
  [
    "flywheel",
    "Project loop",
    "active → idle or blocked → resumed; one live loop per project",
    "flywheel loop-mode run <project> --robot-status",
  ],
  [
    "toron + flywheel",
    "Path reservation",
    "intent → held → released; hard conflict blocks",
    "toron reserve list --project <project>",
  ],
  [
    "chiebukuro",
    "Conclusion",
    "event → derivation → conclusion → review → promoted or rejected",
    "chie memory status --json · chie memory explain <id>",
  ],
];

export default function ArchitecturePage() {
  return (
    <SitePage
      eyebrow="Architecture"
      title="Four planes. One execution loop."
      description="Every agent gets a way to talk, a way to act, a way to prove what happened, and a way to remember. Four projects own those jobs, and the boundaries between them are the reason the loop works."
      marks={PLANE_SLUGS}
    >
      <Section
        index="1.0"
        label="The loop"
        title="A goal becomes work that can survive a crash."
        lede="The stack is a small control loop. Each plane hands a durable artifact to the next, so nothing depends on a pane staying alive."
      >
        <AppWindow title="one verified run · torondev" meta="claim + lease preserved">
          <CodeBlock out>{`goal
  → flywheel arrive + briefing       choose a vehicle and inspect the world
  → br create --verify               one claimable bead + acceptance fence
  → toron reserve acquire            path lease under the committing pin
  → flywheel loop-mode run --work    claim, dispatch, wake, watch
  → VERIFY + commit (bead id)        work becomes a revision
  → br gate report --to closed       pass row bound to the full sha
  → br close --commit-sha            legal close + ledger report
  → mail done + chie memory record   the next run starts from evidence`}</CodeBlock>
        </AppWindow>
        <FigureCaption>Each arrow is a durable artifact, not a function call</FigureCaption>

        <div className="toron-grid" style={{ marginTop: "1.5rem" }}>
          <SurfaceCard
            eyebrow="Plan"
            title="Choose the smallest vehicle"
            href="/how-it-works"
            mark="flywheel"
          >
            flywheel arrives, reads ready work and held paths, then proposes join, loop, steer,
            coalition, or audit. The proposal is a decision, not a spawn.
          </SurfaceCard>
          <SurfaceCard
            eyebrow="Carry"
            title="Make the handoff signed"
            href="/security"
            mark="toron"
          >
            toron seals the body, resolves the recipient, records the receipt, and holds the path
            lease. The relay never needs the plaintext.
          </SurfaceCard>
          <SurfaceCard eyebrow="Close" title="Record the evidence" href="/features" mark="beads">
            beads binds a verdict to the commit. chiebukuro keeps the conclusion. The next run
            starts smarter without treating a recollection as policy.
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
        id="states"
        index="3.0"
        label="States"
        title="A state is a durable artifact, not a badge."
        lede="The stack never infers completion from a message. Each row names the transition that is legal, the state that survives a crash, and the command that reads it back."
      >
        <div className="toron-compare-wrap">
          <table className="toron-compare-table toron-state-table">
            <caption className="sr-only">Durable state machines across the four planes</caption>
            <thead>
              <tr>
                <th scope="col">Plane</th>
                <th scope="col">Artifact</th>
                <th scope="col">Legal state</th>
                <th scope="col">Read it with</th>
              </tr>
            </thead>
            <tbody>
              {STATE_MODELS.map(([plane, artifact, state, command]) => (
                <tr key={`${plane}-${artifact}`}>
                  <th scope="row">{plane}</th>
                  <td data-label="Artifact">{artifact}</td>
                  <td data-label="Legal state">{state}</td>
                  <td data-label="Read it with">
                    <code>{command}</code>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <FigureCaption>
          A read is part of the model: if the command cannot show it, the state is not trustworthy
        </FigureCaption>
      </Section>

      <Section
        index="4.0"
        label="Handoff"
        title="The loop only moves if the handoffs are real."
        lede="A handoff is real when the receiving plane can act on it without asking a human what the sending plane meant. The CLI transcript is the shortest proof."
      >
        <AppWindow title="handoff surface · torondev" meta="1 ready · 0 held">
          <LoopSurface />
        </AppWindow>
        <FigureCaption>
          The run: arrive, reserve, dispatch, crash, resume, gate, close, remember
        </FigureCaption>
      </Section>

      <Section
        index="5.0"
        label="Boundaries"
        title="A plane is defined by what it refuses to do."
        lede="Each of these is a real limitation, stated so you can decide whether the stack fits before you install it."
      >
        <div className="toron-grid">
          <SurfaceCard eyebrow="Not a runtime" title="toron is not a terminal">
            A multiplexer keeps a pane alive. toron keeps the work relationship and the effect
            record alive across processes, machines, and restarts. They compose.
          </SurfaceCard>
          <SurfaceCard eyebrow="Not a ledger" title="flywheel is not the queue">
            flywheel decides how work moves. beads records what was claimed, blocked, verified, and
            closed, and holds the gate rows that authorise a close.
          </SurfaceCard>
          <SurfaceCard eyebrow="Not the scheduler" title="beads is not the dispatcher">
            beads makes a unit claimable and verifiable. flywheel chooses the vehicle, dispatches
            it, watches the claim, and recovers the pane.
          </SurfaceCard>
          <SurfaceCard eyebrow="Not the bus" title="chiebukuro is not the mailbox">
            chiebukuro turns retrieved pages and observed events into queryable memory. toron
            carries the signed handoff between agents.
          </SurfaceCard>
        </div>
      </Section>

      <CTABand
        title="Trace a single goal through all four planes."
        body="The how-it-works page walks the receipt, bead, run and effect, dispatch, coalition, close, and memory machines as eight build-time diagrams."
      >
        <Link href="/how-it-works" className="toron-btn toron-btn--primary toron-btn--lg">
          See how it works
        </Link>
        <Link href="/docs/guides" className="toron-btn toron-btn--lg">
          Run a walkthrough
        </Link>
      </CTABand>

      <PageFooter />
    </SitePage>
  );
}
