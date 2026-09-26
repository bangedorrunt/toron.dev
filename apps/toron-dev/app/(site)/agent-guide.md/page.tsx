import type { Metadata } from "next";
import Link from "next/link";
import { AppWindow, FigureCaption, LoopSurface } from "@/components/product-surfaces";
import {
  CTABand,
  CodeBlock,
  PageFooter,
  Section,
  SitePage,
  WalkStep,
  Walkthrough,
} from "@/components/site-content";

export const metadata: Metadata = {
  title: "Agent guide — set up the stack",
  description:
    "Give an agent a mailbox and a signed identity, then send the first handoff, with the output each step should produce.",
};

export default function AgentGuidePage() {
  return (
    <SitePage
      eyebrow="Agent guide"
      title="Give an agent a mailbox and a name it can sign with."
      description="Four steps from nothing to a signed handoff you can verify. Every step shows the command, the output you should see, and what to do when you do not. The canonical product manuals stay in the toron repository; this is the public path into them."
    >
      <Section
        index="1.0"
        label="Walkthrough"
        title="Up and running in one host, one project, one pin."
        lede="Assumes a shell on the host that will run the daemon, and a project directory you already work in."
      >
        <Walkthrough
          outcome={
            <>
              <strong>When you finish:</strong> a daemon is running, one agent has a registered pin
              and a reserved path scope, and a sealed message with a receipt exists between two
              identities. Nothing here needs a network account.
            </>
          }
        >
          <WalkStep
            n={1}
            title="Install the daemon and a client"
            body={
              <>
                One binary provides the mailbox, the MCP server, the workflow engine, and the local
                index. Install it from crates.io, or build from the repository if you want a pinned
                revision.
              </>
            }
            fail="cargo cannot find the crate, or the version you asked for is yanked. Check the resolved version and the toolchain before anything else."
            diagnose="toron --version && cargo --version"
          >
            <CodeBlock label="run">{`cargo install toron`}</CodeBlock>
            <CodeBlock label="you should see" out>
              {`  Installing toron v0.x.y
    Updating crates.io index
   Compiling toron v0.x.y
    Finished \`release\` profile in 1m 12s
  Installed package \`toron v0.x.y\` (executable \`toron\`)`}
            </CodeBlock>
          </WalkStep>

          <WalkStep
            n={2}
            title="Generate the operator key, then start the daemon"
            body={
              <>
                The operator key is the authority for privileged lifecycle operations. It is
                separate from the identity an agent signs ordinary work with, and the tooling never
                prints the secret.
              </>
            }
            fail="the daemon says it is running but commands time out, usually because the recorded process is a stale pid rather than the daemon. status distinguishes a managed instance from an unmanaged holder of the port."
            diagnose="toron daemon status"
          >
            <CodeBlock label="run">{`export TORON_OPERATOR_KEY="$HOME/.config/toron/operator_nsec"
toron key generate --role operator
toron daemon install
toron daemon start
toron doctor --check`}</CodeBlock>
            <CodeBlock label="you should see" out>
              {`key generated · role=operator · npub=npub1…  (secret not printed)
daemon installed · com.toron.serve
daemon started · 127.0.0.1:18080
doctor: 4/4 checks passed  (herdr ok · git ok · keys ok · store ok)`}
            </CodeBlock>
          </WalkStep>

          <WalkStep
            n={3}
            title="Register a pin and reserve the path scope"
            body={
              <>
                The pin is the public mail identity: a stable adjective-noun name, not a pane name
                and not your login. Bootstrap registers it and takes the reservations the guard will
                later require at commit time. Reserve both levels of a tree, because a{" "}
                <code>**/</code> glob does not match the top level.
              </>
            }
            fail="a later commit is refused as unattributed. The guard reads the shell environment, not a registry default, so the committing shell has to export the same pin."
            diagnose="toron reserve list --project torondev --path 'src/*'"
          >
            <CodeBlock label="run">{`toron agent bootstrap \\
  --project torondev \\
  --as QuietHarbor \\
  --paths 'src/*' --paths 'src/**/*' \\
  --reason <bead-id>

export AGENT_NAME=QuietHarbor`}</CodeBlock>
            <CodeBlock label="you should see" out>
              {`{ "agent": "QuietHarbor",
  "next": "export AGENT_NAME=<pin>; reserve before edit",
  "registration": { "created": true, "npub": "76ad…7b2d" },
  "reservation": null }`}
            </CodeBlock>
          </WalkStep>

          <WalkStep
            n={4}
            title="Send the first signed handoff and read the receipt"
            body={
              <>
                A subject that carries the work item id, and a thread that is the same id, keeps
                mail and ledger reconcilable. Then read the inbox back rather than assuming
                delivery.
              </>
            }
            fail="the recipient resolves to nothing. Names do not silently hash, so an unregistered pin misses loudly; check the name before changing the recipient."
            diagnose="toron mail whois torondev <pin>"
          >
            <CodeBlock label="run">{`toron mail send \\
  --project torondev --as QuietHarbor \\
  --to captain \\
  --subject "[<bead-id>] starting" \\
  --body "claiming <bead-id>" \\
  --thread <bead-id>

toron mail inbox --since last
toron receipt get --corr <corr-id>`}</CodeBlock>
            <CodeBlock label="you should see" out>
              {`sent · sealed · corr=9f2c…  deliveries=1
inbox: 1 message · thread=<bead-id> · importance=normal
receipt: state=owed  → acked when the recipient reads it`}
            </CodeBlock>
          </WalkStep>
        </Walkthrough>

        <AppWindow title="the same run, as a log" meta="torondev">
          <LoopSurface />
        </AppWindow>
        <FigureCaption>Setup, ready work, reservation, and a resume after a restart</FigureCaption>
      </Section>

      <Section
        index="2.0"
        label="Verification"
        title="Do not call it done until the artifact agrees."
        lede="The stack is built to make the proof visible. Read the receipt, run the gate, and close the work item with the evidence attached."
      >
        <ol className="toron-check-list">
          <li>
            <strong>Check the handoff.</strong> The message has a receipt and the recipient
            acknowledged it.
          </li>
          <li>
            <strong>Check the claim.</strong> beads has an owner, a dependency state, and a verify
            command.
          </li>
          <li>
            <strong>Check the artifact.</strong> The verification command and its result are
            recorded as a gate row.
          </li>
          <li>
            <strong>Check the memory.</strong> chiebukuro has the conclusion, not just the raw event
            stream.
          </li>
        </ol>
        <div className="toron-actions">
          <Link href="/docs/guides" className="toron-btn toron-btn--primary">
            All walkthroughs
          </Link>
          <Link href="/docs/reference" className="toron-btn">
            Tool reference
          </Link>
        </div>
      </Section>

      <p className="toron-guide-note">
        The canonical operational guides live in{" "}
        <a
          href="https://github.com/bangedorrunt/toron/tree/main/docs/guides"
          target="_blank"
          rel="noreferrer"
        >
          toron/docs/guides
        </a>
        . This page is a public projection of that path, deliberately not a second manual.
      </p>

      <CTABand
        title="Hand this page to your agent."
        body="Every command here is copy-pasteable and every step names its failure mode, so an agent can run the setup and report what it actually saw."
      >
        <Link
          href="/docs/guides/first-signed-handoff"
          className="toron-btn toron-btn--primary toron-btn--lg"
        >
          Full quickstart walkthrough
        </Link>
      </CTABand>

      <PageFooter />
    </SitePage>
  );
}
