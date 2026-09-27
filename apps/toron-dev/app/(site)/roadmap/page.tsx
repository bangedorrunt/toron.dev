import type { Metadata } from "next";
import Link from "next/link";
import { ApiSurface } from "@/components/product-surfaces";
import { CTABand, PageFooter, Section, SitePage, SurfaceCard } from "@/components/site-content";

export const metadata: Metadata = {
  title: "Roadmap: what ships next",
  description:
    "The next layer of the autonomous agent stack: legible loops, legible recovery, and guides that track the products.",
};

const PHASES: [string, string, string, string][] = [
  [
    "Now",
    "1.0",
    "One public view of a goal",
    "A single read-only page showing where a goal currently stands: dispatched, claimed, blocked, awaiting a gate, or closed with evidence.",
  ],
  [
    "Next",
    "2.0",
    "Recovery reports a human can read",
    "An operator-facing report explaining which durable boundary was recovered, which work resumed, and which work was deliberately not retried.",
  ],
  [
    "Next",
    "3.0",
    "Guides that track the products",
    "A freshness-checked public projection of the canonical guides in each product repository, so the site cannot quietly drift from the code.",
  ],
  [
    "Later",
    "4.0",
    "Portability between operators",
    "Relay presets and federation profiles that keep local-first operation available to more people without making egress the default.",
  ],
];

const NOT_DOING: string[] = [
  "A hosted control plane. Local-first is the product, not a starting position.",
  "A pricing page. The license is the pricing, and MIT + Apache-2.0 does not have tiers.",
  "A hosted agent runner. The runner is yours, on your host, under your keys.",
  "Anonymous agent traffic. A relay routes; it does not hide sender, recipient, or timing.",
];

export default function RoadmapPage() {
  return (
    <SitePage
      eyebrow="Roadmap"
      title="Autonomy is only useful when the evidence is easy to check."
      description="A sequence of ways to make the four-plane loop more legible, more recoverable, and easier to hand to someone else."
    >
      <Section
        index="1.0"
        label="The path"
        title="From a working loop to a loop you can hand over."
        lede="Each phase removes a place where the operator currently has to guess."
      >
        <div className="toron-grid toron-grid--2">
          {PHASES.map(([phase, index, title, body]) => (
            <SurfaceCard key={title} eyebrow={`${index} · ${phase}`} title={title}>
              {body}
            </SurfaceCard>
          ))}
        </div>
      </Section>

      <Section
        index="2.0"
        label="Guardrails"
        title="What stays true as the stack grows."
        lede="These are constraints, not aspirations. A proposal that breaks one of them is rejected rather than scheduled."
      >
        <ul className="toron-check-list">
          <li>Local-first means local by default, not local-only by dogma.</li>
          <li>
            Every autonomous effect has a receipt, a claim, or a verifiable boundary behind it.
          </li>
          <li>Every ledger close has evidence, not confidence.</li>
          <li>Every memory write can be traced back to something that was observed.</li>
          <li>A number on this site comes from a generated catalog, not from copy.</li>
        </ul>
      </Section>

      <Section
        index="3.0"
        label="Not planned"
        title="The things this stack will not become."
        lede="An exclusion is a decision someone can argue with, which makes it more useful than a promise."
      >
        <ApiSurface rows={NOT_DOING.map((item, index) => [`0${index + 1}`, item])} />
      </Section>

      <CTABand
        title="The current state is already useful."
        body="The reference is generated from the live catalog on every build, so what you read here is what the tools expose today."
      >
        <Link href="/docs/reference" className="toron-btn toron-btn--primary toron-btn--lg">
          Open the reference
        </Link>
      </CTABand>

      <PageFooter />
    </SitePage>
  );
}
