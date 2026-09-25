import type { Metadata } from "next";
import Link from "next/link";
import { CodeBlock, PageFooter, Section, SitePage, StackStrip, SurfaceCard } from "@/components/site-content";

export const metadata: Metadata = {
  title: "Architecture — the four planes",
  description: "How toron, flywheel, beads, and chiebukuro compose into one autonomous multi-agent workflow.",
};

const ownership = [
  ["toron", "Mail, identity, receipts, reservations, archive", "The transport and system of record"],
  ["flywheel", "Spawn, dispatch, loops, workflows, cron, coalitions", "The control loop"],
  ["beads", "Work items, dependencies, gates, close evidence", "The accountable ledger"],
  ["chiebukuro", "Curated knowledge, episodic memory, synthesis", "The learning plane"],
];

export default function ArchitecturePage() {
  return (
    <SitePage
      eyebrow="Architecture"
      title="Four planes. One autonomous workflow."
      description="toron.dev is the public map of a stack where every agent has a way to talk, a way to act, a way to prove what happened, and a way to remember what came before."
    >
      <Section id="stack" eyebrow="The stack" title="Each plane owns one hard problem." description="The planes compose. They do not blur into one another.">
        <StackStrip />
        <div className="toron-ownership-table" role="table" aria-label="Autonomous stack plane ownership">
          <div className="toron-ownership-table__row toron-ownership-table__row--head" role="row">
            <span role="columnheader">Plane</span><span role="columnheader">Owns</span><span role="columnheader">Role</span>
          </div>
          {ownership.map(([plane, owns, role]) => (
            <div className="toron-ownership-table__row" role="row" key={plane}>
              <strong role="cell">{plane}</strong><span role="cell">{owns}</span><span role="cell">{role}</span>
            </div>
          ))}
        </div>
      </Section>

      <Section id="loop" eyebrow="The control loop" title="From intent to evidence, without losing the thread." description="The stack turns a goal into work that can be claimed, dispatched, recovered, verified, and remembered.">
        <CodeBlock label="autonomous execution loop">{`goal
  ↓
flywheel plans and dispatches
  ↓
beads claims the smallest verifiable unit
  ↓
toron carries signed messages, receipts, and reservations
  ↓
agents execute · crash · recover · acknowledge
  ↓
verification evidence returns to the ledger
  ↓
chiebukuro compounds the useful memory
  ↺ next cycle`}</CodeBlock>
        <div className="toron-flow-cards">
          <SurfaceCard eyebrow="01 · intent" title="Plan the work" href="/how-it-works">Break the goal into lanes, dependencies, and proof targets. flywheel owns dispatch policy.</SurfaceCard>
          <SurfaceCard eyebrow="02 · coordination" title="Carry the work" href="/security">toron turns handoffs into signed, resumable messages with receipts and reservations.</SurfaceCard>
          <SurfaceCard eyebrow="03 · proof" title="Close the loop" href="/features">beads records the gate. chiebukuro remembers the learning. The next run starts smarter.</SurfaceCard>
        </div>
      </Section>

      <Section id="boundaries" eyebrow="Boundaries" title="A stack is useful because the boundaries are clear." description="The site keeps the product claims honest. If a capability belongs to another plane, we say so.">
        <div className="toron-boundary-grid">
          <SurfaceCard eyebrow="Not a window" title="toron is the mailbox">A terminal runtime can keep a process alive. toron keeps the work relationship alive across agents, machines, and restarts.</SurfaceCard>
          <SurfaceCard eyebrow="Not the ledger" title="flywheel is not the queue">flywheel decides how work moves. beads records what is claimed, blocked, verified, and closed.</SurfaceCard>
          <SurfaceCard eyebrow="Not the memory" title="chiebukuro is not the bus">chiebukuro turns retrieved knowledge and observed events into memory. toron carries the signed handoff.</SurfaceCard>
        </div>
      </Section>

      <div className="toron-page__cta">
        <p>Start with the loop, then inspect the planes.</p>
        <Link href="/how-it-works" className="toron-install__cta">See how it works →</Link>
      </div>
      <PageFooter />
    </SitePage>
  );
}
