import type { Metadata } from "next";
import Link from "next/link";
import { PLANE_SLUGS, type PlaneSlug } from "@/lib/planes";
import { CTABand, PageFooter, Section, SitePage, SurfaceCard } from "@/components/site-content";

export const metadata: Metadata = {
  title: "Compare: pick the smallest tool for each failure",
  description:
    "How the toron.dev stack sits next to swarmtools, herdr, plain MCP memory servers, and coordinating by hand.",
};

const COLUMNS = ["toron.dev stack", "swarmtools", "herdr", "plain MCP memory", "by hand"];

const ROWS: [string, string[]][] = [
  ["Encrypted mail between agents", ["yes · NIP-17 gift-wrap", "no", "no", "no", "a shared file"]],
  [
    "Agent has a signed identity",
    ["yes · Schnorr, NIP-49", "no", "pane identity", "session only", "a hostname"],
  ],
  [
    "Keeps a terminal run alive",
    ["composes with one", "yes", "yes · its whole job", "no", "a terminal you guess at"],
  ],
  ["Work item closes on evidence", ["yes · gate row + sha", "no", "no", "no", "a status message"]],
  [
    "Recovers work after a crash",
    ["yes · journal replay", "partial", "yes · for the pane", "no", "re-read the scrollback"],
  ],
  [
    "Serializes a shared file",
    ["yes · reservation guard", "no", "no", "no", "asking nicely in chat"],
  ],
  ["Reachable over MCP", ["yes · 38 tools, 25 resources", "yes", "varies", "yes", "n/a"]],
  [
    "Knowledge carries across runs",
    ["yes · wiki + episodic", "no", "no", "yes · vector recall", "no"],
  ],
  [
    "Runs local-first, no account",
    ["yes · federation off by default", "yes", "yes", "usually", "yes"],
  ],
];

/*
 * The fourth field is the character the entry is about, and it is deliberately
 * absent on the first row: the process-dies entry is about herdr, which is not one
 * of the four planes, and a card that claims a character it does not own is worse
 * than a card with no art at all. The three that do name a plane get it.
 */
const COMPOSE: [string, string, string, PlaneSlug?][] = [
  [
    "The process dies",
    "herdr keeps the runtime",
    "Panes stay alive and visible. toron keeps the signed relationship and the archive, so a crash does not erase the work record.",
  ],
  [
    "The work is ambiguous",
    "beads makes it accountable",
    "The smallest verifiable unit gets an owner, a dependency graph, a gate row, and a close reason.",
    "beads",
  ],
  [
    "Knowledge is missing",
    "chiebukuro makes it reusable",
    "Retrieved pages, episodic events, and synthesis become context for the next agent instead of a re-explanation.",
    "chiebukuro",
  ],
  [
    "Nothing is coordinated",
    "toron carries the handoff",
    "Signed mail, receipts, reservations, and durable workflows make each handoff observable after the fact.",
    "toron",
  ],
];

export default function ComparePage() {
  return (
    <SitePage
      eyebrow="Compare"
      title="Pick the smallest tool for each failure."
      description="A terminal, a mailbox, a ledger, and a memory system solve different problems. None of them is a worse version of the others."
      marks={PLANE_SLUGS}
    >
      <Section
        index="1.0"
        label="The matrix"
        title="Adjacent tools stay useful when their boundaries stay clear."
        lede="Every row is a job. The cell says which tool actually does it, and what it costs you when nothing does."
      >
        <div className="toron-compare-wrap">
          <table className="toron-compare-table">
            <caption className="sr-only">
              Capability comparison between the toron.dev stack and adjacent tools
            </caption>
            <thead>
              <tr>
                <th scope="col">Capability</th>
                {COLUMNS.map((column) => (
                  <th scope="col" key={column}>
                    {column}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {ROWS.map(([label, cells]) => (
                <tr key={label}>
                  <th scope="row">{label}</th>
                  {cells.map((cell, index) => (
                    <td key={`${label}-${index}`}>{cell}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Section>

      <Section
        index="2.0"
        label="The composition"
        title="Use each tool for the failure it was built for."
        lede="Most of the value comes from four tools refusing to impersonate each other."
      >
        <div className="toron-grid toron-grid--2">
          {COMPOSE.map(([eyebrow, title, body, mark]) => (
            <SurfaceCard key={title} eyebrow={eyebrow} title={title} mark={mark}>
              {body}
            </SurfaceCard>
          ))}
        </div>
      </Section>

      <Section
        index="3.0"
        label="What it costs"
        title="The honest costs, stated up front."
        lede="A comparison that only lists advantages is marketing. These are the real trade-offs of running the stack."
      >
        <ul className="toron-check-list">
          <li>Four projects is four things to install, version, and keep in sync.</li>
          <li>Local-first means you own the relay, the archive, and the backups.</li>
          <li>Reservation and gate ceremony is real overhead on a one-line change.</li>
          <li>
            MCP client support varies by harness, and the parity surface is not the whole product
            surface.
          </li>
        </ul>
      </Section>

      <CTABand
        title="See the loop instead of picking a side."
        body="The architecture page names the owner of every capability, and states what each plane refuses to do."
      >
        <Link href="/architecture" className="toron-btn toron-btn--primary toron-btn--lg">
          Map the four planes
        </Link>
      </CTABand>

      <PageFooter />
    </SitePage>
  );
}
