import type { Metadata } from "next";
import Link from "next/link";
import { DocsBody } from "fumadocs-ui/layouts/docs/page";
import { createRelativeLink } from "fumadocs-ui/mdx";
import { getMDXComponents } from "@/components/mdx";
import { CTABand, PageFooter, SitePage } from "@/components/site-content";
import { source } from "@/lib/source";

export const metadata: Metadata = {
  title: "How it works",
  description:
    "One verified run through the four planes, with the receipt, bead, run/effect, dispatch, coalition, close, and memory state machines as eight build-time diagrams.",
};

export default function HowItWorksPage() {
  const page = source.getPage(["how-it-works"]);
  if (!page) {
    throw new Error("how-it-works content is missing from the docs source");
  }
  const MDX = page.data.body;

  return (
    <SitePage
      eyebrow="How it works"
      title="A goal becomes a system that keeps going."
      description="The stack works because each plane hands a durable artifact to the next. These eight diagrams trace one run from arrival to recall, naming the state that survives the pane and the refusal that keeps it honest."
    >
      <DocsBody>
        <MDX components={getMDXComponents({ a: createRelativeLink(source, page) })} />
      </DocsBody>

      <CTABand
        title="Run one of these diagrams yourself."
        body="The crash-recovery walkthrough kills the daemon mid-workflow and shows the run resuming from the journal, with the output at every step."
      >
        <Link
          href="/docs/guides/crash-recovery"
          className="toron-btn toron-btn--primary toron-btn--lg"
        >
          Survive a crash
        </Link>
        <Link href="/architecture" className="toron-btn toron-btn--lg">
          Map the planes
        </Link>
      </CTABand>

      <PageFooter />
    </SitePage>
  );
}
