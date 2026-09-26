import type { Metadata } from "next";
import Link from "next/link";
import { CTABand, PageFooter, Section, SitePage } from "@/components/site-content";

export const metadata: Metadata = {
  title: "FAQ — the autonomous agent stack",
  description:
    "Answers about ownership, privacy, autonomous execution, and how toron, flywheel, beads, and chiebukuro relate to each other.",
};

const QUESTIONS: [string, string][] = [
  [
    "Is toron the whole stack?",
    "No. toron is the transport, identity, and record plane. flywheel orchestrates, beads records work and holds the gates, and chiebukuro supplies knowledge and memory. The ownership table on the architecture page is canonical, and nothing on this site attributes one plane’s capability to another.",
  ],
  [
    "Do I need all four projects?",
    "No. Start with the plane that solves your current failure. One agent that cannot hand work to another needs toron. Four agents stepping on the same file needs reservations and beads. The stack pays off when the handoffs between planes become explicit, and that is a decision you can defer.",
  ],
  [
    "What makes a workflow autonomous rather than just automated?",
    "The loop can plan, dispatch, claim, recover, verify, and remember without a human reconstructing state after each failure. If a crash means a person has to re-read a terminal and re-issue the work, the workflow is automated, not autonomous.",
  ],
  [
    "What does a receipt actually prove?",
    "That a handoff reached a named state: owed, then acked, then resulted, tracked per message and per recipient. It does not prove the work was correct, and it is not the same thing as a gate row. Closing a bead needs the gate, not the receipt.",
  ],
  [
    "Can a relay read my agents’ mail?",
    "No. The body is sealed to the recipient with NIP-17 gift-wrap, so a relay routes an envelope it cannot open. It does still see the sender, the recipient, and the timing, which is why this is privacy and not anonymity.",
  ],
  [
    "What happens when an agent crashes mid-workflow?",
    "The daemon restarts and resumes from its journal. Identity, reservations, and work claims live outside the process, so restarting the process does not restart the work. The journal identifies the last durable boundary and continues from there.",
  ],
  [
    "Is there a hosted version?",
    "No, and that is deliberate. You run the relay, you hold the keys, you own the archive. Federation is off by default, so a default install makes no outbound connection at all.",
  ],
  [
    "What does it cost?",
    "Nothing. toron and flywheel are MIT, beads and chiebukuro are Apache-2.0. The license is the pricing, so there is no per-seat tier to compare against.",
  ],
  [
    "Where should I actually start?",
    "Read the first walkthrough, which takes you from nothing to a verified handoff and shows the expected output at every step. If you would rather hand the job to your own agent, point it at the agent guide instead.",
  ],
];

export default function FaqPage() {
  return (
    <SitePage
      eyebrow="FAQ"
      title="The short answers, without the mythology."
      description="A stack is easier to trust when its boundaries and failure modes are stated in the same breath as its capabilities."
    >
      <Section
        index="1.0"
        label="Questions"
        title="The things people ask before wiring agents together."
        lede="Each answer names the plane it applies to, so you can check it against that project's own documentation."
      >
        <div className="toron-faq-list">
          {QUESTIONS.map(([question, answer]) => (
            <details key={question}>
              <summary>{question}</summary>
              <p>{answer}</p>
            </details>
          ))}
        </div>
      </Section>

      <CTABand
        title="Still evaluating?"
        body="The quickstart walkthrough is the fastest way to decide: it takes one host and about ten minutes, and every step shows what you should see."
      >
        <Link
          href="/docs/guides/first-signed-handoff"
          className="toron-btn toron-btn--primary toron-btn--lg"
        >
          Start the quickstart
        </Link>
        <Link href="/compare" className="toron-btn toron-btn--lg">
          Compare the stack
        </Link>
      </CTABand>

      <PageFooter />
    </SitePage>
  );
}
