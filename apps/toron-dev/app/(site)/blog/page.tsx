import type { Metadata } from "next";
import Link from "next/link";
import { PLANE_SLUGS } from "@/lib/planes";
import { CTABand, PageFooter, Section, SitePage, SurfaceCard } from "@/components/site-content";

export const metadata: Metadata = {
  title: "Blog: the receipt is the proof",
  description:
    "Notes on autonomous agents, durable workflows, and the records that make them trustworthy.",
};

const POSTS = [
  {
    slug: "receipt-is-the-proof",
    title: "Why the receipt is the proof",
    date: "2026-09-25",
    summary:
      "A self-report says what an agent believes happened. A receipt says what the system can show happened. The gap between those two is where every unreliable agent system lives.",
  },
  {
    slug: "four-planes-one-loop",
    title: "Four planes, one loop",
    date: "2026-09-25",
    summary:
      "Mail, orchestration, work evidence, and memory only become a system when each one refuses to do the other three jobs.",
  },
  {
    slug: "crash-is-a-transition",
    title: "A crash is a transition, not a failure of memory",
    date: "2026-09-25",
    summary:
      "The durable boundary is the difference between restarting a process and resuming the work that process was carrying.",
  },
];

export default function BlogPage() {
  return (
    <SitePage
      eyebrow="Blog"
      title="Notes from the stack."
      description="Short essays about what survives, what proves, and what an agent system should be honest about. No thought leadership, no predictions."
      marks={PLANE_SLUGS}
    >
      <Section
        index="1.0"
        label="Writing"
        title="The useful details are usually operational."
        lede="Each post is about a decision we had to make and what it cost."
      >
        <div className="toron-grid">
          {POSTS.map((post) => (
            <SurfaceCard
              key={post.slug}
              eyebrow={post.date}
              href={`/blog/${post.slug}`}
              title={post.title}
            >
              {post.summary}
            </SurfaceCard>
          ))}
        </div>
      </Section>

      <CTABand
        title="The docs make the same arguments, with commands."
        body="The walkthroughs show the receipts and gate rows these posts describe, produced on a real host with the output shown at every step."
      >
        <Link href="/docs/guides" className="toron-btn toron-btn--primary toron-btn--lg">
          Read the walkthroughs
        </Link>
      </CTABand>

      <PageFooter />
    </SitePage>
  );
}
