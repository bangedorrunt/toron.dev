import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PLANE_SLUGS, type PlaneSlug } from "@/lib/planes";
import { PageFooter, SitePage } from "@/components/site-content";
import { absoluteUrl } from "@/lib/shared";

/*
 * Each post carries the characters of the planes its argument actually needs,
 * which is why the counts differ: the case for a receipt is a toron argument with
 * a beads gate behind it, a crash is a flywheel argument, and the piece about the
 * loop is about all four. A post with one mark gets a drifting character; a post
 * with four gets a set that holds still (see SitePage).
 */
const POST_MARKS: Record<string, readonly PlaneSlug[]> = {
  "receipt-is-the-proof": ["toron", "beads"],
  "four-planes-one-loop": PLANE_SLUGS,
  "crash-is-a-transition": ["flywheel"],
};

const posts = {
  "receipt-is-the-proof": {
    date: "2026-09-25",
    title: "Why the receipt is the proof",
    intro: "A self-report is useful. It is not evidence.",
    body: [
      "When an agent says it sent a message, the interesting question is whether the system has a signed handoff and a receipt for the state that followed, rather than whether the agent believes it sent one.",
      "toron keeps that boundary honest. A message can be owed, acknowledged, or resulted. A close can point to a commit and a verification gate. beads can refuse a false close. The proof is a relationship between an effect and an artifact, not a sentence in a log.",
      "That distinction is what lets flywheel dispatch autonomously without turning every worker into a source of unverifiable optimism.",
    ],
  },
  "four-planes-one-loop": {
    date: "2026-09-25",
    title: "Four planes, one autonomous loop",
    intro: "The stack works because the boundaries meet at a loop.",
    body: [
      "toron carries the signed handoff. flywheel decides how work moves. beads records the claim and the gate. chiebukuro turns the result into memory. No plane needs to impersonate another one.",
      "The public site now shows that composition explicitly. You can start reading at any one project and still follow the next move: from mailbox to dispatch, from dispatch to evidence, from evidence to memory.",
    ],
  },
  "crash-is-a-transition": {
    date: "2026-09-25",
    title: "A crash is a transition, not a failure of memory",
    intro: "The durable boundary is the product.",
    body: [
      "A process can die. The work does not have to become unknowable. A durable workflow records the boundary, toron keeps the signed event history, and the recovery path can reconstruct the next state from those facts.",
      "That is the difference between restarting a command and resuming an execution. It is also why the archive and the receipts matter as much as the happy path.",
    ],
  },
} as const;

type PostSlug = keyof typeof posts;

export function generateStaticParams() {
  return Object.keys(posts).map((slug) => ({ slug }));
}

export async function generateMetadata(props: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await props.params;
  const post = posts[slug as PostSlug];
  if (!post) return {};
  return {
    title: post.title,
    description: post.intro,
    // Same rule as every other page: a preview hostname must not become the original.
    alternates: { canonical: absoluteUrl(`/blog/${slug}`) },
  };
}

export default async function BlogPostPage(props: { params: Promise<{ slug: string }> }) {
  const { slug } = await props.params;
  const post = posts[slug as PostSlug];
  if (!post) notFound();

  return (
    <SitePage
      eyebrow={post.date}
      title={post.title}
      description={post.intro}
      marks={POST_MARKS[slug] ?? []}
    >
      <article className="toron-article">
        {post.body.map((paragraph) => (
          <p key={paragraph}>{paragraph}</p>
        ))}
      </article>
      <PageFooter />
    </SitePage>
  );
}
