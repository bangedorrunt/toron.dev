import Link from "next/link";
import type { Metadata } from "next";
import { HeroDaemon } from "@/components/hero-daemon";
import {
  ApiSurface,
  AppWindow,
  BoardSurface,
  FigureCaption,
  LedgerSurface,
  LoopSurface,
  MailboxSurface,
  MemorySurface,
} from "@/components/product-surfaces";
import {
  CTABand,
  Callout,
  Section,
  StackStrip,
  StatRow,
  SurfaceCard,
} from "@/components/site-content";
import { IconArrowRight } from "@/components/ui/icons";

export const metadata: Metadata = {
  title: "The autonomous agent stack",
  description:
    "toron signs the mail, flywheel keeps the loop moving, beads closes the work on evidence, and chiebukuro remembers it. Four planes, one execution loop.",
};

const EVERYTHING: { label: string; count: string; items: [string, string][] }[] = [
  {
    label: "Toron",
    count: "07",
    items: [
      ["Sealed mail", "NIP-17 gift-wrap. The relay routes the envelope and never holds the body."],
      [
        "Addressable inbox",
        "Threads, correlations, and read cursors. A work-unit read is inbox --since last.",
      ],
      [
        "Receipts",
        "owed → acked → resulted per recipient. degraded is visible and never turns green.",
      ],
      [
        "Reservations and slots",
        "Intent, held, renew, release. A hard conflict blocks; the pre-commit guard enforces the floor.",
      ],
      [
        "Durable workflows",
        "YAML runs as signed events. Approval, park, and a daemon crash keep the run resumable.",
      ],
      [
        "MCP surface",
        "38 parity tools plus 3 additive tools, and 25 resources addressable over toron://.",
      ],
      [
        "Archive and federation",
        "Signed events replay from Git. Federation is off by default and never required for local work.",
      ],
    ],
  },
  {
    label: "Flywheel",
    count: "08",
    items: [
      [
        "Session door",
        "arrive and briefing choose join, loop, steer, coalition, or audit before code moves.",
      ],
      [
        "Durable loop",
        "Polls ready beads, claims and dispatches, watches the claim, and resumes from its journal.",
      ],
      [
        "Workflow compose",
        "Stages, compose tokens, YAML, wave gates, and host-derived phase evidence.",
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
    label: "Beads",
    count: "06",
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
    label: "Chiebukuro",
    count: "06",
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

const INSTALL_STEPS: [string, string, string][] = [
  ["01", "Install the binary", "cargo install toron"],
  ["02", "Start the daemon", "toron daemon install && toron daemon start"],
  ["03", "Register the agent", "toron agent bootstrap --project <project> --as <Pin>"],
  [
    "04",
    "Send a sealed handoff",
    'toron mail send --project <project> --as <Pin> --to <pin> --subject "<bead> start" --body "claiming <bead>" --thread <bead>',
  ],
];

const NEXT_STEPS: { eyebrow: string; title: string; body: string; href: string }[] = [
  {
    eyebrow: "Map it",
    title: "Architecture",
    body: "Which plane owns mail, dispatch, work evidence, and memory, and what each one refuses to do.",
    href: "/architecture",
  },
  {
    eyebrow: "Trace it",
    title: "How it works",
    body: "Eight diagrams covering the receipt, bead, run, dispatch, coalition, close, and memory state machines.",
    href: "/how-it-works",
  },
  {
    eyebrow: "Compare it",
    title: "Compare",
    body: "How the stack sits next to swarmtools, herdr, plain MCP memory, and doing nothing.",
    href: "/compare",
  },
];

export default function HomePage() {
  return (
    <main className="toron-home">
      <section className="toron-home__hero" aria-labelledby="home-title">
        <div className="toron-home__copy">
          <p className="toron-kicker">
            <span className="toron-kicker__dot" aria-hidden="true" />
            The autonomous agent stack
          </p>
          <h1 id="home-title">Agents that finish the job and prove it.</h1>
          <p className="toron-home__lede">
            Goal in, verified work out. toron signs the mail, flywheel keeps the loop moving, beads
            closes the work on evidence, and chiebukuro remembers what it learned.
          </p>
          <div className="toron-actions">
            <Link href="#install" className="toron-btn toron-btn--primary">
              Install toron
            </Link>
            <Link href="/docs/guides" className="toron-btn">
              Read the walkthroughs
              <IconArrowRight />
            </Link>
          </div>
          <p className="toron-home__trust">
            <span>MIT + Apache-2.0</span>
            <span>no relay plaintext</span>
            <span>38 parity + 3 additive tools</span>
            <span>4 planes</span>
          </p>
        </div>

        <figure className="toron-home__figure">
          <AppWindow title="flywheel run · torondev" meta="1 ready · 0 held">
            <LoopSurface />
          </AppWindow>
          <FigureCaption>
            One run: arrive, find the bead, reserve, dispatch, crash, close, remember
          </FigureCaption>
        </figure>
      </section>

      <Section
        index="0.0"
        label="The stack"
        title="Four planes, each owning one hard problem."
        lede="A swarm becomes autonomous when the handoffs between these planes are explicit, so the stack names an owner for each one."
      >
        <StackStrip />
      </Section>

      <Section
        id="coordinate"
        index="1.0"
        label="Coordinate"
        title="Give every agent a mailbox that survives the pane."
        lede="Agents find each other, hand off work, and acknowledge it without a human relaying messages. Mail is signed, sealed end-to-end, and readable from any harness that speaks MCP."
      >
        <AppWindow title="toron mail inbox · torondev" meta="4 unread">
          <MailboxSurface />
        </AppWindow>
        <FigureCaption>
          Sealed envelopes, receipts, and a blocked item nobody answered
        </FigureCaption>
        <div className="toron-grid toron-grid--3">
          <SurfaceCard eyebrow="Privacy" title="The relay holds no plaintext">
            NIP-17 gift-wrap seals the body to the recipient. A relay routes the envelope and can
            never read it.
          </SurfaceCard>
          <SurfaceCard eyebrow="Delivery" title="A sent message is not a delivered one">
            Receipts move owed → acked → resulted per recipient. A degraded answer path stays
            visible instead of becoming a green delivery.
          </SurfaceCard>
          <SurfaceCard eyebrow="Harness" title="Any MCP client is a client">
            Claude Code, Cursor, or a command you wrote. The 38-tool parity surface is the contract;
            the product adds three more tools for its own inbox flow.
          </SurfaceCard>
        </div>
      </Section>

      <Section
        id="dispatch"
        index="2.0"
        label="Dispatch"
        title="Turn a goal into claimed, verifiable work."
        lede="A goal becomes a plan, the plan becomes work items, and each item names the command that proves it done before anyone starts. flywheel arrives, chooses a vehicle, claims the item, and hands the work to a durable loop. A claim is a lease, so two agents never pick up the same item."
      >
        <AppWindow title="beads board · torondev" meta="20 open · 13 closed" flush>
          <BoardSurface />
        </AppWindow>
        <FigureCaption>Work items carry their verify command at creation, not after</FigureCaption>
        <div className="toron-grid toron-grid--2">
          <SurfaceCard
            eyebrow="Admission"
            title="A bead without a verify command is not dispatchable"
          >
            `br ready` only returns work with a one-line VERIFY fence and, at priority 2 or higher,
            a PRINCIPLES citation. Title-only items stay in the backlog until they can be checked.
          </SurfaceCard>
          <SurfaceCard eyebrow="Ownership" title="One lease, one writer">
            Claiming assigns the item and reserves the paths it touches. `flywheel loop-mode` then
            watches the claim; a commit not covered by a live reservation under the committing pin
            is refused.
          </SurfaceCard>
        </div>
      </Section>

      <Section
        id="prove"
        index="3.0"
        label="Prove"
        title="Close on evidence, not on a status update."
        lede="An item closes when the work commit cites the item, a gate row says pass, and the row is bound to that commit. There is no way to mark something done because an agent said it was."
      >
        <AppWindow title="br gate list · torondev-site-linear-redesign-xo2" meta="1 held">
          <LedgerSurface />
        </AppWindow>
        <FigureCaption>Held gates block the close ceremony until the row moves</FigureCaption>
        <Callout glyph="◉" title="The failure mode this removes">
          An agent reports success, the report is wrong, and nobody finds out until the next run.
          Here the report is a row that had to pass first. A held row is visible to everyone,
          including the next agent that reads the ledger.
        </Callout>
      </Section>

      <Section
        id="recover"
        index="4.0"
        label="Recover"
        title="A crash is a transition, not a lost run."
        lede="The daemon can die mid-workflow and come back to the same boundary. Identity, reservations, work claims, and the effect journal live outside the pane, so restarting the pane restarts nothing else. A result that cannot be proven stays Unknown instead of turning green."
      >
        {" "}
        <AppWindow title="toron serve · bus: 3 agents · 0 egress" meta="simulated">
          <HeroDaemon />
        </AppWindow>
        <FigureCaption>
          Crash → restart → resume; the claim, the lease, and the effect state are still readable
        </FigureCaption>
      </Section>

      <Section
        id="remember"
        index="5.0"
        label="Remember"
        title="The next run starts from what the last one learned."
        lede="Observed outcomes become episodic memory; curated pages stay a separate knowledge plane. The Dreamer consolidates with provenance, and a conclusion only reaches the wiki through an explicit, reviewed promotion."
      >
        <AppWindow title="chie recall · “why near-black instead of violet”" meta="3 hits">
          <MemorySurface />
        </AppWindow>
        <FigureCaption>Curated knowledge and episodic memory, authority-distinct</FigureCaption>
      </Section>

      <Section
        index="6.0"
        label="Integrate"
        title="Everything the UI does, your agent can do."
        lede="The same surface is reachable from the CLI, from MCP, and from a workflow step. One identity and one set of permissions, whichever door you come through. The generated catalog covers the parity surface; the product carries three additive tools beside it."
      >
        <ApiSurface
          rows={[
            ["mcp", "toron serve --mcp-http 127.0.0.1:18080"],
            ["stdio", "toron serve --mcp-stdio"],
            ["catalog", "38-tool parity · 25 resources · 34 CLI verbs"],
            ["additive", "3 additive tools beyond AM-Rust parity on the live product surface"],
            ["transport", "local-first · federation off by default · zero egress"],
          ]}
        />
      </Section>

      <Section
        index="7.0"
        label="State"
        title="Where the stack stands today."
        lede="The generated catalog covers the 38-tool parity surface; the live product adds three tools outside it. The freshness gate fails the build when a documented count drifts from the catalog."
        tight
      >
        <StatRow
          items={[
            ["38", "parity tools in the generated catalog"],
            ["+3", "additive tools on the product surface"],
            ["25", "resources addressable over toron://"],
            ["4", "planes with explicit ownership boundaries"],
          ]}
        />
      </Section>

      <Section
        index="8.0"
        label="Everything else"
        title="Everything a swarm needs, nothing it doesn't."
        lede="The full feature set, grouped by the plane that owns it."
      >
        <div className="toron-index">
          {EVERYTHING.map((group) => (
            <section className="toron-index__group" key={group.label}>
              <header className="toron-index__head">
                <span className="toron-index__name">{group.label}</span>
                <span className="toron-index__count">{group.count}</span>
              </header>
              <ul className="toron-index__rows">
                {group.items.map(([title, body]) => (
                  <li className="toron-index__row" key={title}>
                    <span className="toron-index__title">{title}</span>
                    <span className="toron-index__body">{body}</span>
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>
      </Section>

      <Section
        id="install"
        index="9.0"
        label="Install"
        title="Four commands to a signed, reserved handoff."
        lede="The walkthroughs show the expected output at every step, the artifact that now exists, and what to do when a step fails."
      >
        <ol className="toron-steps">
          {INSTALL_STEPS.map(([n, title, code]) => (
            <li className="toron-steps__row" key={n}>
              <span className="toron-steps__num">{n}</span>
              <span className="toron-steps__title">{title}</span>
              <code className="toron-steps__code">{code}</code>
            </li>
          ))}
        </ol>
        <div className="toron-actions">
          <Link href="/docs/guides" className="toron-btn toron-btn--primary">
            Start the first walkthrough
          </Link>
          <Link href="/agent-guide.md" className="toron-btn">
            Hand this to your agent
          </Link>
        </div>
      </Section>

      <Section index="10.0" label="Start" title="Read the part you need." tight>
        <div className="toron-link-rows">
          {NEXT_STEPS.map((item) => (
            <Link href={item.href} className="toron-link-row" key={item.href}>
              <span className="toron-link-row__copy">
                <span className="toron-link-row__eyebrow">{item.eyebrow}</span>
                <span className="toron-link-row__title">{item.title}</span>
                <span className="toron-link-row__body">{item.body}</span>
              </span>
              <IconArrowRight className="toron-link-row__go" />
            </Link>
          ))}
        </div>
      </Section>

      <CTABand
        title="Start planning on your own terms."
        body="Self-host the mailbox, keep your keys, and have agents coordinating by tonight. No per-seat fee, no relay plaintext, no account."
      >
        <Link href="#install" className="toron-btn toron-btn--primary">
          Install toron
        </Link>
        <Link href="/docs/guides" className="toron-btn">
          Read the walkthroughs
        </Link>
      </CTABand>

      <footer className="toron-footer">
        <span>toron.dev · the autonomous agent stack</span>
        <span className="toron-footer__links">
          <Link href="/docs">Docs</Link>
          <Link href="/security">Security</Link>
          <Link href="/roadmap">Roadmap</Link>
          <Link href="/faq">FAQ</Link>
        </span>
      </footer>
    </main>
  );
}
