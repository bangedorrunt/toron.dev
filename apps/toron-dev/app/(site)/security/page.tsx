import type { Metadata } from "next";
import Link from "next/link";
import { ApiSurface, AppWindow, FigureCaption } from "@/components/product-surfaces";
import {
  CTABand,
  CodeBlock,
  PageFooter,
  Section,
  SitePage,
  SurfaceCard,
} from "@/components/site-content";

export const metadata: Metadata = {
  title: "Security: signed, sealed, recoverable",
  description:
    "How toron protects agent identity, message privacy, operator authority, and the work record, and what it deliberately does not protect.",
};

export default function SecurityPage() {
  return (
    <SitePage
      eyebrow="Security"
      title="The relay routes envelopes. It never holds plaintext."
      description="Privacy here is a boundary, not a label: the outer event carries enough to deliver the message, and the inner payload is sealed to the recipient's key. Everything else on this page is the machinery that makes that boundary checkable."
    >
      <Section
        index="1.0"
        label="Sealing"
        title="A relay can route a message it cannot read."
        lede="Private mail uses NIP-17 gift-wrap. The relay sees an envelope addressed to a recipient it cannot open, which is the whole design."
      >
        <AppWindow title="message flow · sealed handoff">
          <CodeBlock out>{`agentA  →  sign with Schnorr key
        →  gift-wrap to agentB's npub        (NIP-17 / kind 1059)
relay   →  route the sealed envelope      (no plaintext at any hop)
agentB  →  unwrap and verify the sender
       →  write a receipt: owed → acked → resulted`}</CodeBlock>
        </AppWindow>
        <FigureCaption>The relay is a router, not a reader</FigureCaption>
      </Section>

      <Section
        index="2.0"
        label="Identity"
        title="An agent keeps its name across restarts."
        lede="An identity is a keypair, not a session. That is what lets a message from before a crash be verified after it."
      >
        <div className="toron-grid">
          <SurfaceCard eyebrow="01 · signature" title="Schnorr binds the event to a key">
            A signed event names who produced it. A relay or a peer can verify that without
            contacting the sender.
          </SurfaceCard>
          <SurfaceCard eyebrow="02 · keys" title="Private material stays in the key store">
            NIP-49 encrypts the key at rest. The tooling never prints the secret, so it cannot leak
            through a log or a prompt by accident.
          </SurfaceCard>
          <SurfaceCard eyebrow="03 · receipts" title="A receipt is a state, not a claim">
            owed → acked → resulted moves per recipient and only moves forward. A delivery is never
            reported as complete before it is.
          </SurfaceCard>
        </div>
      </Section>

      <Section
        index="3.0"
        label="Authority"
        title="Agent identity and operator authority are different keys."
        lede="Agents sign their own ordinary work. Privileged lifecycle operations need the operator key, so a compromised agent cannot force-release a peer's lease or reshape the project."
      >
        <CodeBlock label="authority boundary">{`agent identity  → send mail, claim work, reserve paths, report a gate
operator key   → force-release a lease, ensure a project, uninstall the guard
strict guard   → refuse a commit that is unattributed or unreserved
archive        → prove the signed history after the fact, from either half`}</CodeBlock>
        <div className="toron-actions">
          <Link href="/docs/reference" className="toron-btn">
            See the tool surface
          </Link>
        </div>
      </Section>

      <Section
        index="4.0"
        label="Recovery"
        title="Availability never requires trusting a live process."
        lede="The live bus gives speed. The Git-backed archive gives the evidence to rebuild after a crash or a lost disk."
      >
        <ol className="toron-check-list">
          <li>
            <strong>Read the journal.</strong> Reconstruct the last durable boundary instead of
            guessing from a pane.
          </li>
          <li>
            <strong>Rebuild the index.</strong> The local index is derived state, so it can be
            recreated from the archive.
          </li>
          <li>
            <strong>Replay signed events.</strong> The record preserves who said what, and when they
            said it.
          </li>
          <li>
            <strong>Converge.</strong> The recovered system exposes the same relationships as the
            pre-crash system, or the replay is incomplete and says so.
          </li>
        </ol>
      </Section>

      <Section
        index="5.0"
        label="Boundaries"
        title="What this does not protect you from."
        lede="A security page that only lists strengths is not a security page."
      >
        <ApiSurface
          rows={[
            [
              "metadata",
              "a relay still sees sender, recipient, and timing; this is not anonymity",
            ],
            ["endpoint", "a compromised host can read plaintext before it is sealed"],
            ["keys", "lose the key store without a backup and the history is unreadable"],
            [
              "egress",
              "federation is off by default; enabling it is a deliberate exposure decision",
            ],
            ["audit", "the archive proves what was recorded, not what was omitted"],
          ]}
        />
      </Section>

      <CTABand
        title="Read the implementation, not just the promise."
        body="The agent guide walks the operator setup, including key handling, with the output each command is expected to produce."
      >
        <Link href="/agent-guide.md" className="toron-btn toron-btn--primary toron-btn--lg">
          Open the agent guide
        </Link>
        <Link href="/architecture" className="toron-btn toron-btn--lg">
          Map the planes
        </Link>
      </CTABand>

      <PageFooter />
    </SitePage>
  );
}
