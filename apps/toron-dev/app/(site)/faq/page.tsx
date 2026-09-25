import type { Metadata } from "next";
import Link from "next/link";
import { PageFooter, Section, SitePage } from "@/components/site-content";

export const metadata: Metadata = {
  title: "FAQ — autonomous agent stack",
  description: "Answers about ownership, privacy, autonomous execution, and the relationship between toron, flywheel, beads, and chiebukuro.",
};

const questions = [
  ["Is toron the whole stack?", "No. toron is the transport, trust, and record plane. flywheel orchestrates, beads records work, and chiebukuro supplies knowledge and memory. The site presents the composition without pretending the ownership is shared."],
  ["Do I need all four projects?", "No. Use the plane that solves your current failure. The stack becomes valuable when the boundaries are explicit and the handoffs are real."],
  ["What makes a workflow autonomous?", "The loop can plan, dispatch, claim, recover, verify, and remember without a human having to reconstruct state from a pane after every failure."],
  ["What does a receipt prove?", "A receipt proves a handoff reached a named state: owed, acknowledged, or resulted. It does not replace the evidence required to close a bead."],
  ["Where should I start?", "Start with /agent-guide.md for the operator setup, then read /architecture for the ownership map and /how-it-works for the execution diagrams."],
];

export default function FaqPage() {
  return (
    <SitePage
      eyebrow="FAQ"
      title="The short answers, without the mythology."
      description="A stack is easier to trust when its boundaries and failure modes are explicit."
    >
      <Section id="questions" eyebrow="Questions" title="The things people ask before wiring an agent together.">
        <div className="toron-faq-list">
          {questions.map(([question, answer]) => <details key={question}><summary>{question}</summary><p>{answer}</p></details>)}
        </div>
      </Section>
      <div className="toron-page__cta">
        <p>Still evaluating? Read the operator path.</p>
        <Link href="/agent-guide.md" className="toron-install__cta">Read the agent guide →</Link>
      </div>
      <PageFooter />
    </SitePage>
  );
}
