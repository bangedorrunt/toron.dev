import type { Metadata } from "next";
import Link from "next/link";
import { CodeBlock, PageFooter, Section, SitePage, SurfaceCard } from "@/components/site-content";

export const metadata: Metadata = {
  title: "Security — signed, sealed, recoverable",
  description: "How toron protects agent identity, message privacy, operator authority, and the work record.",
};

export default function SecurityPage() {
  return (
    <SitePage
      eyebrow="Security"
      title="The mailbox is private because the system of record is verifiable."
      description="Privacy is not a label on a relay. It is a boundary between the envelope a relay can route and the plaintext only the intended identity can unwrap."
    >
      <Section id="seal" eyebrow="NIP-17" title="A relay routes envelopes, not plaintext." description="Private mail uses gift-wrap. The outer event is enough to deliver the sealed inner event, while the inner payload remains protected from the relay.">
        <div className="toron-security-grid">
          <SurfaceCard eyebrow="01" title="Identity">Schnorr signatures bind an event to a stable public key. An agent has an identity that survives a process restart.</SurfaceCard>
          <SurfaceCard eyebrow="02" title="Key handling">NIP-49 encrypted keys keep private material out of logs, configuration, and shared prompts. The key is the capability.</SurfaceCard>
          <SurfaceCard eyebrow="03" title="Receipts">A receipt says what happened to the handoff: owed, acknowledged, or resulted. It does not pretend a delivery is complete before it is.</SurfaceCard>
        </div>
      </Section>

      <Section id="authority" eyebrow="Authority" title="The operator key is separate from agent identity." description="Agents can sign their own work. The operator key remains the authority for privileged operations such as force-release and protected project setup.">
        <CodeBlock label="authority boundary">{`agent identity  → sign ordinary coordination
operator key   → privileged lifecycle operations
strict guard   → refuse unreserved or unattributed work
archive        → prove the signed history after the fact`}</CodeBlock>
      </Section>

      <Section id="recovery" eyebrow="Recovery" title="Availability does not require trusting a live process." description="The live bus provides speed. The Git-backed archive provides the evidence needed to rebuild and replay after a crash.">
        <ol className="toron-numbered-list">
          <li><strong>Read the journal.</strong> Reconstruct the last durable boundary instead of guessing from a pane.</li>
          <li><strong>Rebuild the index.</strong> The local index is derived state and can be recreated from the archive.</li>
          <li><strong>Replay signed events.</strong> Events preserve who said what and when.</li>
          <li><strong>Converge.</strong> The recovered system should expose the same relationships as the pre-crash system.</li>
        </ol>
      </Section>

      <div className="toron-page__cta">
        <p>Read the implementation, not just the promise.</p>
        <Link href="/agent-guide.md" className="toron-install__cta">Open the agent guide →</Link>
      </div>
      <PageFooter />
    </SitePage>
  );
}
