import Link from 'next/link';
import type { Metadata } from 'next';
import { HeroDaemon } from '@/components/hero-daemon';
import { SealedEnvelopeBadge } from '@toron/tokens/sealed-envelope-badge';
import { CodeBlock, StackStrip, SurfaceCard } from '@/components/site-content';

export const metadata: Metadata = {
  title: 'Mail for machines — the autonomous agent stack',
  description: 'Signed mail, orchestration, work evidence, and memory for autonomous multi-agent workflows.',
};

const installSteps = [
  ['01', 'Install the daemon', 'One binary provides the mailbox, MCP server, workflow fabric, and local index.', '$ toron serve'],
  ['02', 'Register an identity', 'Give the agent a stable signed pin. Private material stays in the key store.', '$ toron agent bootstrap --project <project> --as <Pin>'],
  ['03', 'Connect the agents', 'Point each harness at the same MCP surface and the same project namespace.', '$ toron serve --mcp-stdio'],
  ['04', 'Send sealed work', 'A signed handoff carries the assignment through the mailbox and returns a receipt.', '$ toron mail send --to opencode --subject "review: landing"'],
  ['05', 'Dispatch and recover', 'flywheel dispatches, beads verifies, and the daemon resumes from its log after a crash.', '$ flywheel briefing "ship the change" --project <project> --json'],
  ['06', 'Verify and remember', 'Close only on evidence. chiebukuro carries the useful conclusion into the next run.', '$ br gate report <bead> --gate verify --status pass\n$ toron mail send --to captain --thread <bead>'],
];

export default function HomePage() {
  return (
    <main className="toron-home">
      <section className="toron-home__intro" aria-labelledby="home-title">
        <div className="toron-home__copy">
          <p className="toron-page__eyebrow">The autonomous agent stack</p>
          <h1 id="home-title">Mail for machines.</h1>
          <p className="toron-home__lede">The mailbox is the transport. The stack is what keeps the work moving.</p>
          <p className="toron-home__sublede">toron, flywheel, beads, and chiebukuro turn a goal into signed work that can run, crash, recover, prove, and remember.</p>
          <div className="toron-home__actions"><Link href="/architecture" className="toron-install__cta">Map the stack →</Link><Link href="/agent-guide.md" className="toron-text-link">Start with an agent</Link></div>
          <div className="toron-home__badges"><SealedEnvelopeBadge label="sealed · E2E" /><span className="toron-home__license">MIT + Apache-2.0 · the license is the pricing</span></div>
        </div>
        <HeroDaemon />
      </section>

      <section className="toron-home__planes" aria-labelledby="planes-title">
        <div className="toron-section__eyebrow">Four planes, one loop</div>
        <h2 id="planes-title">The agent stack has a job for every failure.</h2>
        <p>Different tools solve different problems. The stack makes the handoffs explicit.</p>
        <StackStrip />
      </section>

      <section className="toron-home__split" aria-labelledby="loop-title">
        <div className="toron-split__col toron-split__col--problem">
          <p className="toron-section__eyebrow">Without a stack</p>
          <h2 id="loop-title">Agents restart from nothing.</h2>
          <ul className="toron-split__list"><li>Each process keeps its own incomplete memory.</li><li>A message can be delivered without proof.</li><li>Work is claimed by convention, not a lease.</li><li>A successful report has no artifact behind it.</li></ul>
        </div>
        <div className="toron-split__col toron-split__col--solution">
          <p className="toron-section__eyebrow">With the stack</p>
          <h2>The next run starts from evidence.</h2>
          <ul className="toron-split__list"><li>toron carries the signed handoff and receipt.</li><li>flywheel keeps the durable loop moving.</li><li>beads makes claims, gates, and close evidence real.</li><li>chiebukuro turns the result into useful memory.</li></ul>
        </div>
      </section>

      <section className="toron-home__stats" aria-label="Autonomous stack facts">
        <div><strong>4</strong><span>planes with clear ownership</span></div><div><strong>8</strong><span>build-time diagrams</span></div><div><strong>0</strong><span>relay plaintext required</span></div><div><strong>1</strong><span>durable execution loop</span></div>
      </section>

      <div className="toron-home__counters" aria-label="Simulated daemon counters">
        <span><strong>128</strong> messages sent</span><span><strong>4</strong> workflows resumed after crash</span><span className="toron-home__counter-note">simulated · CSS-only motion</span>
      </div>

      <section className="toron-home__cards" aria-label="Explore the stack">
        <SurfaceCard eyebrow="Map it" title="Architecture" href="/architecture">See which plane owns mail, dispatch, work evidence, and memory.</SurfaceCard>
        <SurfaceCard eyebrow="Follow it" title="How it works" href="/how-it-works">Trace a goal through eight build-time diagrams.</SurfaceCard>
        <SurfaceCard eyebrow="Trust it" title="Security" href="/security">Understand sealed mail, identity, receipts, recovery, and operator authority.</SurfaceCard>
      </section>

      <section id="install" className="toron-home__install" aria-labelledby="install-title">
        <div className="toron-section__eyebrow">The shortest path</div>
        <h2 id="install-title">From zero to a verifiable handoff.</h2>
        <p>One identity, one mailbox, one durable loop.</p>
        <div className="toron-install">
          {installSteps.map(([number, title, copy, code]) => <article className="toron-install__step" key={number}><div className="toron-install__num">{number}</div><div className="toron-install__body"><h3>{title}</h3><p className="toron-install__copy">{copy}</p><CodeBlock>{code}</CodeBlock></div></article>)}
        </div>
        <div className="toron-home__install-link"><Link href="/agent-guide.md" className="toron-install__cta">Read the full agent guide →</Link></div>
      </section>

      <footer className="toron-footer toron-glass"><span>toron.dev · one stack for autonomous multi-agent work</span><SealedEnvelopeBadge label="signed and sealed" /></footer>
    </main>
  );
}
