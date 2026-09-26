import Link from 'next/link';
import type { Metadata } from 'next';
import { HeroDaemon } from '@/components/hero-daemon';
import { ApiSurface, AppWindow, BoardSurface, FigureCaption, LedgerSurface, LoopSurface, MailboxSurface, MemorySurface } from '@/components/product-surfaces';
import { CTABand, Callout, CodeBlock, Section, StackStrip, StatRow, SurfaceCard } from '@/components/site-content';

export const metadata: Metadata = {
  title: 'The autonomous agent stack',
  description:
    'toron signs the mail, flywheel keeps the loop moving, beads closes the work on evidence, and chiebukuro remembers it. Four planes, one execution loop.',
};

const EVERYTHING: { label: string; count: string; items: [string, string][] }[] = [
  {
    label: 'Coordinate',
    count: '09',
    items: [
      ['Sealed mail', 'NIP-17 gift-wrap. The relay routes the envelope and never holds the plaintext.'],
      ['Rooms and jobs', 'Kind 9 for crew-visible work, 43001 for first-claimer job assignment.'],
      ['File reservations', 'Intent, hold, renew, release. A hard conflict blocks the edit, not the commit.'],
      ['Build slots', 'One serialized lane, so two agents never bench the same expensive build.'],
    ],
  },
  {
    label: 'Orchestrate',
    count: '08',
    items: [
      ['Durable loops', 'The loop polls, dispatches, watches, and resumes from its journal after a crash.'],
      ['Workflows', 'YAML steps with approval gates that suspend and survive a restart.'],
      ['Debate and review', 'Adversarial rounds with a judge before the work is committed.'],
      ['Cron', 'Recurring work that fires whether or not anyone is watching the pane.'],
    ],
  },
  {
    label: 'Prove',
    count: '11',
    items: [
      ['Verification gates', 'An item closes on a recorded pass row, never on a status update.'],
      ['Receipts', 'owed → acked → resulted, stored per message and per recipient.'],
      ['Signed commit ceremony', 'Every commit rides a live reservation under a named pin.'],
      ['Git archive', 'Signed events replay into a rebuilt index, from either half.'],
    ],
  },
  {
    label: 'Remember',
    count: '06',
    items: [
      ['Curated knowledge', 'A searchable wiki the swarm reads before it plans.'],
      ['Episodic memory', 'What was decided, by whom, and what changed as a result.'],
      ['Synthesis', 'Finished runs become the next run\'s context instead of scrollback.'],
      ['Literature', 'Full-text search across the papers a design decision cites.'],
    ],
  },
];

const INSTALL_STEPS: [string, string, string][] = [
  ['01', 'Install the binary', '$ cargo install toron'],
  ['02', 'Start the daemon', '$ toron daemon install && toron daemon start'],
  ['03', 'Register the agent', '$ toron agent bootstrap --project <project> --as <Pin>'],
  ['04', 'Send a sealed handoff', '$ toron mail send --to <pin> --subject "<bead> start" --thread <bead>'],
];

export default function HomePage() {
  return (
    <main className="toron-home">
      <section className="toron-home__hero" aria-labelledby="home-title">
        <div className="toron-home__copy">
          <Link href="/architecture" className="toron-home__pill">
            <span className="toron-home__pill-tag">New</span>
            <span>Four planes, one execution loop</span>
          </Link>
          <h1 id="home-title">Agents that finish the job and prove it.</h1>
          <p className="toron-home__lede">
            Goal in, verified work out. toron signs the mail, flywheel keeps the loop moving, beads closes the work on
            evidence, and chiebukuro remembers what it learned.
          </p>
          <div className="toron-actions">
            <Link href="#install" className="toron-btn toron-btn--primary toron-btn--lg">
              Install toron
            </Link>
            <Link href="/docs/guides" className="toron-btn toron-btn--lg">
              Read the walkthroughs
            </Link>
          </div>
          <p className="toron-home__trust">
            <span>MIT + Apache-2.0</span>
            <span>no relay plaintext</span>
            <span>38 MCP tools</span>
            <span>4 planes</span>
          </p>
        </div>

        <div className="toron-home__figure">
          <AppWindow title="flywheel briefing · torondev" meta="dispatcher: absent">
            <LoopSurface />
          </AppWindow>
          <FigureCaption>One run, end to end: briefing, ready work, reservation, crash, resume</FigureCaption>
        </div>
      </section>

      <Section index="0.0" label="The stack" title="Four planes, each owning one hard problem." lede="A swarm becomes autonomous when the handoffs between these planes are explicit. The stack is what makes them explicit.">
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
        <FigureCaption>Sealed envelopes, receipts, and a blocked item nobody answered</FigureCaption>
        <div className="toron-grid" style={{ marginTop: '1.5rem' }}>
          <SurfaceCard eyebrow="Privacy" title="The relay holds no plaintext">
            NIP-17 gift-wrap seals the body to the recipient. A relay routes the envelope and can never read it.
          </SurfaceCard>
          <SurfaceCard eyebrow="Delivery" title="A sent message is not a delivered one">
            Receipts move owed → acked → resulted per recipient. An unacked item escalates on its own schedule.
          </SurfaceCard>
          <SurfaceCard eyebrow="Harness" title="Any MCP client is a client">
            Claude Code, Cursor, or a command you wrote. The mailbox is the system of record, not an app you open.
          </SurfaceCard>
        </div>
      </Section>

      <Section
        id="dispatch"
        index="2.0"
        label="Dispatch"
        title="Turn a goal into claimed, verifiable work."
        lede="A goal becomes a plan, the plan becomes work items, and each item names the command that proves it done before anyone starts. Claiming is a lease, so two agents never pick up the same item."
      >
        <AppWindow title="beads board · torondev" meta="20 open · 13 closed" flush>
          <BoardSurface />
        </AppWindow>
        <FigureCaption>Work items carry their verify command at creation, not after</FigureCaption>
        <div className="toron-grid toron-grid--2" style={{ marginTop: '1.5rem' }}>
          <SurfaceCard eyebrow="Admission" title="A bead without a verify command is not dispatchable">
            The ledger refuses to hand out work it cannot check. Title-only items stay in the backlog until they carry a
            one-line command and, for priority work, the principles the change is expected to satisfy.
          </SurfaceCard>
          <SurfaceCard eyebrow="Ownership" title="One lease, one writer">
            Claiming assigns the item and reserves the paths it touches. The pre-commit guard then refuses any commit
            whose files are not covered by a live reservation under the committing pin.
          </SurfaceCard>
        </div>
      </Section>

      <Section
        id="prove"
        index="3.0"
        label="Prove"
        title="Close on evidence, not on a status update."
        lede="An item closes when a gate row says pass and a commit cites the item. Held rows refuse every close path, so there is no way to mark something done because an agent said it was."
      >
        <AppWindow title="br gate list · torondev-site-linear-redesign-xo2" meta="1 held">
          <LedgerSurface />
        </AppWindow>
        <FigureCaption>Held gates block the close ceremony until the row moves</FigureCaption>
        <Callout glyph="◉" title="The failure mode this removes">
          An agent reports success, the report is wrong, and nobody finds out until the next run. Here the report is a
          row that had to pass first. A held row is visible to everyone, including the next agent that reads the ledger.
        </Callout>
      </Section>

      <Section
        id="recover"
        index="4.0"
        label="Recover"
        title="A crash is a transition, not a lost run."
        lede="The daemon can die mid-workflow and come back to the same place. Identity, reservations, and work claims live outside the pane that happens to be running, so restarting the pane restarts nothing else."
      >
        <AppWindow title="toron serve · bus: 3 agents · 0 egress" meta="simulated">
          <HeroDaemon />
        </AppWindow>
        <FigureCaption>Crash → restart → resume, replayed from the journal</FigureCaption>
      </Section>

      <Section
        id="remember"
        index="5.0"
        label="Remember"
        title="The next run starts from what the last one learned."
        lede="Retrieved knowledge and observed outcomes become memory the swarm can query. A conclusion stays distinct from a wiki page until someone promotes it, so a guess never silently becomes policy."
      >
        <AppWindow title="chie recall · “why near-black instead of violet”" meta="3 hits">
          <MemorySurface />
        </AppWindow>
        <FigureCaption>Curated knowledge and episodic memory, authority-distinct</FigureCaption>
      </Section>

      <Section index="6.0" label="Integrate" title="Everything the UI does, your agent can do." lede="The same surface is reachable from the CLI, from MCP, and from a workflow step. One identity, one set of permissions, whichever door you come through.">
        <ApiSurface
          rows={[
            ['mcp', 'toron serve --mcp-http 127.0.0.1:18080'],
            ['stdio', 'toron serve --mcp-stdio'],
            ['catalog', 'toron catalog --json → 38 tools · 25 resources · 19 commands'],
            ['transport', 'local-first · federation off by default · zero egress'],
          ]}
        />
      </Section>

      <Section index="7.0" label="State" title="Where the stack stands today." lede="Numbers on this page come from the generated catalog, not from copy. When they drift, the build fails." tight>
        <StatRow
          items={[
            ['38', 'MCP tools on the AM-Rust parity surface'],
            ['25', 'resources addressable over toron://'],
            ['4', 'planes with explicit ownership boundaries'],
            ['0', 'plaintext bytes a relay can read'],
          ]}
        />
      </Section>

      <Section index="8.0" label="Everything else" title="Everything a swarm needs, nothing it doesn't." lede="The full feature set, grouped by the plane that owns it.">
        <div className="toron-grid toron-grid--2">
          {EVERYTHING.map((group) => (
            <div className="toron-tile" key={group.label}>
              <p className="toron-tile__label">
                {group.label} <span className="toron-badge">{group.count}</span>
              </p>
              <div className="toron-grid toron-grid--2" style={{ gap: '0.9rem' }}>
                {group.items.map(([title, body]) => (
                  <div key={title}>
                    <h3>{title}</h3>
                    <p className="toron-tile__body" style={{ marginTop: '0.3rem' }}>
                      {body}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </Section>

      <Section id="install" index="9.0" label="Install" title="Four commands to a verifiable handoff." lede="The walkthroughs show the expected output at every step and what to do when a step fails.">
        <div className="toron-grid toron-grid--2">
          {INSTALL_STEPS.map(([n, title, code]) => (
            <div className="toron-tile" key={n}>
              <p className="toron-tile__label">
                {n} <span className="toron-badge">step</span>
              </p>
              <h3>{title}</h3>
              <div style={{ marginTop: '0.75rem' }}>
                <CodeBlock>{code}</CodeBlock>
              </div>
            </div>
          ))}
        </div>
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
        <div className="toron-grid">
          <SurfaceCard eyebrow="Map it" title="Architecture" href="/architecture">
            Which plane owns mail, dispatch, work evidence, and memory, and what each one refuses to do.
          </SurfaceCard>
          <SurfaceCard eyebrow="Trace it" title="How it works" href="/how-it-works">
            Eight diagrams covering the message flow, the job race, the crash path, and dual recovery.
          </SurfaceCard>
          <SurfaceCard eyebrow="Compare it" title="Compare" href="/compare">
            How the stack sits next to swarmtools, herdr, plain MCP memory, and doing nothing.
          </SurfaceCard>
        </div>
      </Section>

      <CTABand title="Start planning on your own terms." body="Self-host the mailbox, keep your keys, and have agents coordinating by tonight. No per-seat fee, no relay plaintext, no account.">
        <Link href="#install" className="toron-btn toron-btn--primary toron-btn--lg">
          Install toron
        </Link>
        <Link href="/docs/guides" className="toron-btn toron-btn--lg">
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
