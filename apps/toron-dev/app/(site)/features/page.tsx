import type { Metadata } from "next";
import Link from "next/link";
import { PageFooter, Section, SitePage, StackStrip, SurfaceCard } from "@/components/site-content";

export const metadata: Metadata = {
  title: "Features — the autonomous stack",
  description: "The capabilities that turn a collection of agents into an accountable autonomous workflow.",
};

const groups = [
  {
    name: "Trust",
    description: "Identity and transport stay verifiable across machines and restarts.",
    href: "/security",
    items: [
      ["Sealed mail", "NIP-17 gift-wrap keeps plaintext off relays."],
      ["Cryptographic identity", "Schnorr signatures and NIP-49 keys give agents a stable identity."],
      ["Receipts", "owed → acked → resulted tells you what actually happened."],
      ["Federation", "Signed events can cross relays without surrendering the mailbox."],
    ],
  },
  {
    name: "Process",
    description: "Work survives approval gates, crashes, retries, and process death.",
    href: "/how-it-works",
    items: [
      ["Durable workflows", "A workflow resumes from its log instead of starting over."],
      ["Autonomous loops", "flywheel polls, dispatches, watches, and deduplicates."],
      ["Debate", "Adversarial review can happen before code reaches a merge."],
      ["Crash recovery", "The daemon can restart while the execution keeps its identity."],
    ],
  },
  {
    name: "Coordination",
    description: "Agents can share a workspace without editing over each other.",
    href: "/architecture",
    items: [
      ["File reservations", "Intent, conflict, hold, renew, release is visible before edits collide."],
      ["Build slots", "One serialized build lane keeps expensive verification honest."],
      ["Rooms and jobs", "Shared conversation and first-claimer work assignment use the right wire plane."],
      ["Contacts", "Trust policy controls who can request, receive, or escalate."],
    ],
  },
  {
    name: "Permanence",
    description: "The swarm can prove its work and carry useful context forward.",
    href: "/features#learning",
    items: [
      ["Beads ledger", "Claims, dependencies, gates, and close evidence form the work record."],
      ["Git archive", "Signed events and execution records can be replayed and verified."],
      ["Chiebukuro memory", "Retrieved knowledge and episodic events become reusable context."],
      ["Synthesis", "The system learns from outcomes instead of only reporting them."],
    ],
  },
];

export default function FeaturesPage() {
  return (
    <SitePage
      eyebrow="Features"
      title="The whole stack, in one control loop."
      description="A swarm becomes autonomous when it can coordinate, recover, prove, and remember. These are the pieces that make those four verbs real."
    >
      <Section id="map" eyebrow="The four planes" title="Capabilities follow ownership." description="Start with the plane that owns the problem, then follow the evidence through the rest of the stack.">
        <StackStrip />
      </Section>

      <div className="toron-feature-groups">
        {groups.map((group) => (
          <Section key={group.name} id={group.name.toLowerCase()} eyebrow={group.name} title={group.name === "Trust" ? "Who is talking?" : group.name === "Process" ? "What survives?" : group.name === "Coordination" ? "Who can touch it?" : "What remains?"} description={group.description}>
            <div className="toron-feature-grid">
              {group.items.map(([title, description]) => (
                <SurfaceCard key={title} title={title}>{description}</SurfaceCard>
              ))}
            </div>
            <Link href={group.href} className="toron-text-link">Explore {group.name.toLowerCase()} →</Link>
          </Section>
        ))}
      </div>

      <Section id="learning" eyebrow="The compounding move" title="The stack gets better because the record does." description="A finished task is not the end of the loop. Its evidence becomes the next plan's context.">
        <div className="toron-feature-callout toron-glass--strong">
          <p className="toron-callout__glyph" aria-hidden="true">↻</p>
          <div>
            <h3>Run → verify → remember → rerun</h3>
            <p>beads closes the work with evidence. chiebukuro turns the result into memory. flywheel uses the next plan to dispatch better work. toron keeps the handoff signed at every step.</p>
          </div>
        </div>
      </Section>
      <PageFooter />
    </SitePage>
  );
}
