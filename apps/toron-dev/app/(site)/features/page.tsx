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
    "The current capabilities of toron, flywheel, beads, and chiebukuro, grouped by the plane that owns them and the state each one makes durable.",
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
    name: "Toron",
    index: "1.0",
    claim: "The transport and record layer.",
    lede: "Mail, identity, receipts, reservations, and the durable engine. A handoff stays signed and queryable after the sender is gone.",
    href: "/docs/toron",
    items: [
      ["Sealed mail", "NIP-17 gift-wrap keeps the body off every relay it passes through."],
      [
        "Addressable inbox",
        "Threads, correlation ids, and read cursors. The work-unit read is inbox --since last.",
      ],
      [
        "Receipts",
        "owed → acked → resulted per recipient. degraded is visible and never silently green.",
      ],
      [
        "Reservations and slots",
        "Intent, hold, renew, release. A hard conflict blocks; the pre-commit guard enforces it.",
      ],
      [
        "Durable workflows",
        "YAML runs as signed events. Approval, park, and a daemon crash keep the run resumable.",
      ],
      ["MCP surface", "38 parity tools plus 3 additive tools, with 25 resources over toron://."],
      [
        "Archive and federation",
        "Signed events replay from Git. Federation is off by default and never required for local work.",
      ],
    ],
  },
  {
    name: "Flywheel",
    index: "2.0",
    claim: "The control loop that keeps work moving.",
    lede: "Arrival, dispatch, wake, and recovery. flywheel decides what runs next, then proves a phase passed without pretending work closed itself.",
    href: "/docs/flywheel",
    items: [
      [
        "Session door",
        "arrive and briefing observe the fleet and propose exactly one vehicle before code moves.",
      ],
      [
        "Durable loop",
        "Polls ready beads, claims and dispatches, watches the claim, and resumes from its journal.",
      ],
      [
        "Workflow compose",
        "Stages, compose tokens, YAML, wave gates, and host-derived evaluation evidence.",
      ],
      [
        "Effect kernel",
        "Pure reducers, interpreted effects, and an Unknown outcome that stays visible.",
      ],
      [
        "Coalitions",
        "A captain-formed intent board, soft and hard conflicts, and a sealed negotiation ladder.",
      ],
      [
        "Judgment packs",
        "Calibrated judgments return as evidence; code keeps authority over dispatch and close.",
      ],
      [
        "Fleet operations",
        "Interrupt, exit, relaunch, recover, drain. Reservations survive a teardown.",
      ],
      [
        "Cron and compound",
        "Scheduled work and ce-compound capture one learning from a verified run.",
      ],
    ],
  },
  {
    name: "Beads",
    index: "3.0",
    claim: "The ledger that decides what is done.",
    lede: "A work item is not a status update. It carries its verification fence, its claim clock, and the evidence that makes a close legal.",
    href: "/docs/beads",
    items: [
      ["Dispatchability", "One VERIFY command and the required PRINCIPLES make a bead claimable."],
      [
        "Claims and staleness",
        "A claim is a lease with a clock; reclaiming starts with an audit comment.",
      ],
      [
        "Dependencies and waves",
        "Blockers and wave labels order the work instead of a chat thread.",
      ],
      ["Gate rows", "Pass rows are written after the work and bound to the full commit sha."],
      [
        "Close ceremony",
        "A cited commit and a legal verdict; --force waives dependencies, never evidence.",
      ],
      [
        "Graph analysis",
        "Dependencies, triage, plans, and insights over the accountable work graph.",
      ],
    ],
  },
  {
    name: "Chiebukuro",
    index: "4.0",
    claim: "The learning plane, with authority kept distinct.",
    lede: "Curated knowledge and episodic memory are different claims. Consolidation can make memory stronger without making a guess into policy.",
    href: "/docs/chiebukuro",
    items: [
      ["Knowledge plane", "Compiled wiki, review queue, and explicit promotion."],
      ["Memory plane", "Events become conclusions with premises, confidence, and supersession."],
      [
        "Dreamer",
        "Journaled NREM consolidation and REM cross-scope synthesis, previewable with --dry-run.",
      ],
      [
        "Recall and provenance",
        "Class-labelled hits; explain the premises and zoom back to the source message.",
      ],
      [
        "Session tree",
        "A summary tree that preserves the prompt cache and opens to the raw message.",
      ],
      ["Synthesis", "A finished run becomes context for the next plan instead of scrollback."],
    ],
  },
];

const STATES: [string, string, string][] = [
  ["Receipt", "owed → acked → resulted", "degraded is visible; never a green delivery"],
  ["Bead", "open → in_progress → closed", "ready and blocked are views over open"],
  ["Run", "queued → running → suspended", "effect Unknown stays visible until reconciled"],
  ["Conclusion", "event → conclusion → review", "promotion into the wiki is explicit"],
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
        id="state"
        index="5.0"
        label="State"
        title="Every claim has a state you can read."
        lede="The stack does not infer completion from a message. Each of these transitions has a command that moves it and a reader that can prove it later."
      >
        <div className="toron-grid toron-grid--2">
          {STATES.map(([name, transition, note]) => (
            <SurfaceCard key={name} eyebrow="State model" title={name}>
              <code>{transition}</code>
              <br />
              {note}
            </SurfaceCard>
          ))}
        </div>
        <div className="toron-actions">
          <Link href="/architecture#states" className="toron-btn">
            Read every state model
          </Link>
          <Link href="/how-it-works" className="toron-btn">
            Trace the diagrams
          </Link>
        </div>
      </Section>

      <Section
        id="memory"
        index="6.0"
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
