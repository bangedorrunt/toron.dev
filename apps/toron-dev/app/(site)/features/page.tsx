import type { Metadata } from "next";
import Link from "next/link";
import { AppWindow, BoardSurface, FigureCaption } from "@/components/product-surfaces";
import {
  Callout,
  CTABand,
  PageFooter,
  Section,
  SitePage,
  StackStrip,
  SurfaceCard,
} from "@/components/site-content";

export const metadata: Metadata = {
  title: "Features: the autonomous stack",
  description:
    "The capabilities that turn a collection of agent processes into an accountable autonomous workflow, grouped by the plane that owns them.",
};

const GROUPS: {
  name: string;
  index: string;
  claim: string;
  lede: string;
  href: string;
  items: [string, string][];
}[] = [
  {
    name: "Trust",
    index: "1.0",
    claim: "Who is actually talking?",
    lede: "Identity and transport stay verifiable across machines, restarts, and harnesses.",
    href: "/security",
    items: [
      ["Sealed mail", "NIP-17 gift-wrap keeps the body off every relay it passes through."],
      ["Signed identity", "Schnorr signatures and NIP-49 keys give an agent a stable public name."],
      ["Receipts", "owed → acked → resulted says what happened to a handoff, per recipient."],
      ["Contacts and policy", "Trust policy controls who may request, reply, or escalate to you."],
      ["Federation", "Relays carry signed events across sites without surrendering the mailbox."],
      [
        "Operator authority",
        "Privileged lifecycle operations need a separate key from agent identity.",
      ],
    ],
  },
  {
    name: "Process",
    index: "2.0",
    claim: "What survives a crash?",
    lede: "Work outlives approval gates, process death, retries, and the agent that started it.",
    href: "/how-it-works",
    items: [
      [
        "Durable workflows",
        "A suspended workflow resumes from its journal instead of restarting from step one.",
      ],
      [
        "Autonomous loops",
        "flywheel polls, dispatches, watches, and deduplicates without a human in the loop.",
      ],
      [
        "Approval gates",
        "A human decision suspends the run and releases it, surviving a restart in between.",
      ],
      ["Debate", "Adversarial rounds with a judge can run before code reaches a merge."],
      ["Cron", "Recurring work fires on schedule whether or not a pane is open."],
      ["Crash recovery", "The daemon restarts and resumes the run it was carrying."],
    ],
  },
  {
    name: "Coordination",
    index: "3.0",
    claim: "Who may touch this file?",
    lede: "Agents share a workspace without editing over each other, and the guard enforces it at commit time.",
    href: "/architecture",
    items: [
      [
        "File reservations",
        "Intent, hold, renew, release. A hard conflict blocks the edit, not the commit.",
      ],
      [
        "Build slots",
        "One serialized lane keeps an expensive verification from running twice at once.",
      ],
      [
        "Rooms and jobs",
        "Kind 9 for crew-visible work, 43001 for first-claimer assignment with a loser path.",
      ],
      ["Contacts", "A handshake decides who may send work before any work is sent."],
      [
        "Abandoned work",
        "Claims go stale on a clock, and reclaiming one requires an audited comment first.",
      ],
      [
        "Dependency gates",
        "A held item names its blockers instead of sitting silently in a column.",
      ],
    ],
  },
  {
    name: "Permanence",
    index: "4.0",
    claim: "What is left behind?",
    lede: "The swarm can prove what it did and carry the useful part forward.",
    href: "/features#memory",
    items: [
      [
        "Work ledger",
        "Claims, dependencies, gate rows, and close evidence form the accountable record.",
      ],
      ["Verification gates", "An item closes on a recorded pass row, never on a status update."],
      ["Git archive", "Signed events replay into a rebuilt index from either half of the record."],
      ["Curated knowledge", "A searchable wiki the swarm reads before it plans."],
      ["Episodic memory", "What was decided, by whom, and what changed as a result."],
      ["Synthesis", "A finished run becomes the next run’s context instead of scrollback."],
    ],
  },
];

export default function FeaturesPage() {
  return (
    <SitePage
      eyebrow="Features"
      title="The whole stack, in one control loop."
      description="Coordinate, recover, prove, remember. These are the pieces that make those four verbs real in a swarm, grouped by the plane that owns each one."
    >
      <Section
        index="0.0"
        label="The planes"
        title="Capabilities follow ownership."
        lede="Start with the plane that owns your problem, then follow the evidence through the rest of the stack."
      >
        <StackStrip />
      </Section>

      {GROUPS.map((group) => (
        <Section
          key={group.name}
          id={group.name.toLowerCase()}
          index={group.index}
          label={group.name}
          title={group.claim}
          lede={group.lede}
        >
          <div className="toron-grid">
            {group.items.map(([title, body]) => (
              <SurfaceCard key={title} title={title}>
                {body}
              </SurfaceCard>
            ))}
          </div>
          <div className="toron-actions">
            <Link href={group.href} className="toron-btn">
              Explore {group.name.toLowerCase()}
            </Link>
          </div>
        </Section>
      ))}

      <Section
        id="memory"
        index="5.0"
        label="The compounding move"
        title="The stack improves because the record does."
        lede="A finished task is not the end of the loop. Its evidence becomes the next plan's context, and its conclusion stays distinct from a wiki page until someone promotes it."
      >
        <AppWindow title="beads board · after a verified close" meta="13 closed" flush>
          <BoardSurface />
        </AppWindow>
        <FigureCaption>
          A closed item carries its pass row and its commit, not an assertion
        </FigureCaption>
        <Callout glyph="↻" title="Run → verify → remember → rerun">
          beads closes the work with evidence. chiebukuro turns the result into memory. flywheel
          dispatches the next plan better. toron keeps every handoff signed along the way. The loop
          is closed by the record, not by a human remembering to write it down.
        </Callout>
      </Section>

      <CTABand
        title="Check the claims against the code."
        body="Every capability listed here is reachable from the CLI and from MCP, and the generated reference names the exact tool or command."
      >
        <Link href="/docs/reference" className="toron-btn toron-btn--primary toron-btn--lg">
          Open the reference
        </Link>
        <Link href="/compare" className="toron-btn toron-btn--lg">
          Compare the stack
        </Link>
      </CTABand>

      <PageFooter />
    </SitePage>
  );
}
