import type { Metadata } from "next";
import { CodeBlock, PageFooter, Section, SitePage } from "@/components/site-content";

export const metadata: Metadata = {
  title: "Agent guide — set up the stack",
  description: "A practical operator path for installing toron, registering an agent, and sending the first signed message.",
};

export default function AgentGuidePage() {
  return (
    <SitePage
      eyebrow="Agent guide"
      title="Give an agent a mailbox, then make it accountable."
      description="This is the short operator path. The canonical product guides remain in the toron repository; this page is the public starting point."
    >
      <Section id="operator" eyebrow="Once per host" title="Prepare the operator plane." description="The operator key and daemon are host-level setup. Keep the private key path and passphrase outside prompts and logs.">
        <CodeBlock label="operator setup">{`export TORON_OPERATOR_KEY="$HOME/.config/toron/operator_nsec"
toron key generate --role operator
toron daemon install
toron daemon start
toron doctor --check`}</CodeBlock>
      </Section>

      <Section id="agent" eyebrow="Once per project" title="Register the acting identity." description="Use a stable adjective-noun pin. The pin is the public mail identity; it is not a pane name or a username fallback.">
        <CodeBlock label="agent identity">{`toron agent bootstrap \\
  --project <project> \\
  --as <Pin> \\
  --paths <glob> \\
  --reason <bead-id>

export AGENT_NAME=<Pin>`}</CodeBlock>
      </Section>

      <Section id="first-mail" eyebrow="First handoff" title="Send signed work, then verify the result." description="The first message is a small proof of the whole plane. Use a real project and a real thread, not a placeholder recipient.">
        <CodeBlock label="first mail">{`toron mail send \\
  --project <project> \\
  --as <Pin> \\
  --to captain \\
  --subject "[<bead-id>] starting" \\
  --body "claiming <bead-id>" \\
  --thread <bead-id>

toron mail inbox --since last
toron status --json`}</CodeBlock>
      </Section>

      <Section id="verify" eyebrow="Verification" title="Do not call it done until the artifact agrees." description="The stack is designed to make the proof visible. Read the receipt, run the gate, and close the bead with the evidence attached.">
        <ol className="toron-numbered-list">
          <li><strong>Check the handoff.</strong> The message has a receipt and the recipient acknowledged it.</li>
          <li><strong>Check the work.</strong> beads has an owner, a dependency state, and a gate.</li>
          <li><strong>Check the artifact.</strong> The verification command and its result are recorded.</li>
          <li><strong>Check the memory.</strong> chiebukuro has the useful conclusion, not just the raw event stream.</li>
        </ol>
      </Section>

      <p className="toron-guide-note">The canonical operational guides live in <a href="https://github.com/bangedorrunt/toron/tree/main/docs/guides" target="_blank" rel="noreferrer">toron/docs/guides</a>. This page is intentionally a public projection, not a second manual.</p>
      <PageFooter />
    </SitePage>
  );
}
