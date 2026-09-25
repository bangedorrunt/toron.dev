import type { Metadata } from "next";
import { DocsBody } from "fumadocs-ui/layouts/docs/page";
import { createRelativeLink } from "fumadocs-ui/mdx";
import { getMDXComponents } from "@/components/mdx";
import { PageFooter, SitePage } from "@/components/site-content";
import { source } from "@/lib/source";

export const metadata: Metadata = {
  title: "How it works",
  description: "Eight diagrams explain the four-plane autonomous agent stack.",
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
      title="A goal becomes a system that can keep going."
      description="The stack works because the planes hand evidence to one another. Here is the loop, one mechanism at a time."
    >
      <DocsBody>
        <MDX components={getMDXComponents({ a: createRelativeLink(source, page) })} />
      </DocsBody>
      <PageFooter />
    </SitePage>
  );
}
