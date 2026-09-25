import type { Metadata } from "next";
import { PageFooter, Section, SitePage, SurfaceCard } from "@/components/site-content";

export const metadata: Metadata = {
  title: "Blog — the receipt is the proof",
  description: "Notes on autonomous agents, durable workflows, and the records that make them trustworthy.",
};

const posts = [
  { slug: "receipt-is-the-proof", title: "Why the receipt is the proof", date: "2026-09-25", summary: "A self-report says what an agent believes happened. A receipt says what the system can prove happened." },
  { slug: "four-planes-one-loop", title: "Four planes, one autonomous loop", date: "2026-09-25", summary: "Mail, orchestration, work evidence, and memory become useful when their boundaries meet at one execution loop." },
  { slug: "crash-is-a-transition", title: "A crash is a transition, not a failure of memory", date: "2026-09-25", summary: "The durable boundary is the difference between restarting a process and resuming the work that process was carrying." },
];

export default function BlogPage() {
  return (
    <SitePage
      eyebrow="Blog"
      title="Notes from the stack."
      description="Short essays about what survives, what proves, and what an agent system should be honest about."
    >
      <Section id="posts" eyebrow="Writing" title="The useful details are usually operational.">
        <div className="toron-post-list">
          {posts.map((post) => <SurfaceCard key={post.slug} eyebrow={post.date} href={`/blog/${post.slug}`} title={post.title}>{post.summary}</SurfaceCard>)}
        </div>
      </Section>
      <PageFooter />
    </SitePage>
  );
}
