import type { Metadata } from "next";
import { PageFooter, Section, SitePage, SurfaceCard } from "@/components/site-content";

export const metadata: Metadata = {
  title: "Roadmap — make autonomous work accountable",
  description: "The next layer of the autonomous agent stack: better evidence, recovery, and memory.",
};

const items = [
  ["Now", "Make the loop observable", "One public view of a goal across dispatch, claims, receipts, verification, and memory."],
  ["Next", "Make recovery legible", "Operator-facing recovery reports that explain which boundary was durable and which work resumed."],
  ["Next", "Make guides track the products", "A freshness-checked public projection of canonical product guides with a clear source link."],
  ["Later", "Make the stack portable", "Relay presets and federation profiles that keep local-first operation available to more operators."],
];

export default function RoadmapPage() {
  return (
    <SitePage
      eyebrow="Roadmap"
      title="Autonomy is only useful when the evidence is easy to trust."
      description="The roadmap is not a feature list. It is a sequence of ways to make the four-plane loop more legible, recoverable, and repeatable."
    >
      <Section id="path" eyebrow="The path" title="From control loop to shared operating system for agent work.">
        <div className="toron-roadmap-list">
          {items.map(([phase, title, description]) => <SurfaceCard key={title} eyebrow={phase} title={title}>{description}</SurfaceCard>)}
        </div>
      </Section>
      <Section id="principles" eyebrow="Guardrails" title="What stays true as the stack grows.">
        <ul className="toron-check-list">
          <li>Local-first means local by default, not local-only by dogma.</li>
          <li>Every autonomous effect has a receipt, a claim, or a verifiable boundary.</li>
          <li>Every ledger close has evidence, not confidence.</li>
          <li>Every memory write can be traced back to what was observed.</li>
        </ul>
      </Section>
      <PageFooter />
    </SitePage>
  );
}
