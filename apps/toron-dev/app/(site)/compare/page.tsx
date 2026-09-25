import type { Metadata } from "next";
import Link from "next/link";
import { PageFooter, Section, SitePage, SurfaceCard } from "@/components/site-content";

export const metadata: Metadata = {
  title: "Compare — compose the right runtime",
  description: "toron, flywheel, beads, chiebukuro, and adjacent tools each solve a different part of autonomous multi-agent work.",
};

const rows = [
  ["Encrypted agent mail", "yes", "—", "—", "—", "—"],
  ["Terminal runtime", "—", "yes", "—", "—", "—"],
  ["Autonomous dispatch", "transport", "yes", "—", "—", "—"],
  ["Work ledger + gates", "—", "coordinates", "yes", "—", "—"],
  ["Knowledge + memory", "—", "references", "—", "yes", "—"],
  ["Crash-survivable process", "archive", "yes", "claims", "—", "—"],
  ["Agent-first MCP surface", "yes", "yes", "CLI + JSONL", "yes", "varies"],
];

export default function ComparePage() {
  return (
    <SitePage
      eyebrow="Compare"
      title="The stack composes. The tools do not pretend to be the same thing."
      description="A terminal, a mailbox, a ledger, and a memory system solve different failures. The stack makes them one system instead of asking one tool to impersonate all four."
    >
      <Section id="matrix" eyebrow="The matrix" title="Adjacent tools stay useful when their boundaries stay clear." description="The honest comparison is not a winner column. It is a set of jobs that compose.">
        <div className="toron-compare-wrap">
          <table className="toron-compare-table">
            <caption className="sr-only">Comparison of the autonomous agent stack and adjacent tools</caption>
            <thead><tr><th scope="col">Capability</th><th scope="col">toron</th><th scope="col">herdr</th><th scope="col">beads</th><th scope="col">chiebukuro</th><th scope="col">plain MCP</th></tr></thead>
            <tbody>{rows.map(([label, ...cells]) => <tr key={label}><th scope="row">{label}</th>{cells.map((cell, index) => <td key={`${label}-${index}`}>{cell}</td>)}</tr>)}</tbody>
          </table>
        </div>
      </Section>

      <Section id="compose" eyebrow="The composition" title="Use the smallest tool for each failure mode." description="The stack is not a monolith. That is the point.">
        <div className="toron-compare-cards">
          <SurfaceCard eyebrow="Process dies" title="herdr keeps the runtime">Panes stay alive and visible. toron keeps the signed relationship and archive. A crash does not erase the work record.</SurfaceCard>
          <SurfaceCard eyebrow="Work is ambiguous" title="beads makes it accountable">The smallest verifiable unit gets an owner, a dependency graph, a gate, and a close reason.</SurfaceCard>
          <SurfaceCard eyebrow="Knowledge is missing" title="chiebukuro makes it reusable">Retrieved pages, episodic events, and synthesis become context for the next agent.</SurfaceCard>
          <SurfaceCard eyebrow="Nothing is coordinated" title="toron carries the handoff">Signed mail, receipts, reservations, and durable workflows make the handoff observable.</SurfaceCard>
        </div>
      </Section>

      <div className="toron-page__cta">
        <p>See the loop instead of picking a side.</p>
        <Link href="/architecture" className="toron-install__cta">Map the four planes →</Link>
      </div>
      <PageFooter />
    </SitePage>
  );
}
