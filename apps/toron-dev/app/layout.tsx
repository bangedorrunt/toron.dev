import { Analytics } from "@vercel/analytics/next";
import { RootProvider } from "fumadocs-ui/provider/next";
import { Inter, JetBrains_Mono } from "next/font/google";
import type { Metadata } from "next";
import { themeInitScript } from "@toron/tokens/theme-init";
import { siteUrl } from "@/lib/shared";
import "./global.css";

// ADR-0004 D2: Inter carries display and body. Space Grotesk is gone, which
// also drops one family from the font load path.
const inter = Inter({ subsets: ["latin"], variable: "--font-inter", display: "swap" });
const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-jetbrains-mono",
  display: "swap",
});

const jsonLd = [
  {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: "toron.dev",
    description:
      "The autonomous agent stack: signed mail, orchestration, work evidence, and memory.",
    url: siteUrl,
  },
  {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: "toron",
    applicationCategory: "DeveloperApplication",
    operatingSystem: "Linux, macOS, Windows",
    description:
      "Signed, sealed, crash-survivable coordination for autonomous multi-agent workflows.",
    license: "https://spdx.org/licenses/Apache-2.0.html",
  },
  {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: [
      {
        "@type": "Question",
        name: "What is toron.dev?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "It is the public map of a four-plane autonomous agent stack: toron, flywheel, beads, and chiebukuro.",
        },
      },
      {
        "@type": "Question",
        name: "What does toron own?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "toron owns signed mail, identity, receipts, reservations, and the archive.",
        },
      },
      {
        "@type": "Question",
        name: "Do I need all four projects?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "No. Use the plane that solves your current failure; the stack becomes valuable when the handoffs are explicit.",
        },
      },
      {
        "@type": "Question",
        name: "What makes a workflow autonomous?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "The loop can plan, dispatch, claim, recover, verify, and remember without reconstructing state from a pane after every failure.",
        },
      },
      {
        "@type": "Question",
        name: "Where should I start?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Start with the agent guide, then read the architecture page for ownership and how-it-works for the execution diagrams.",
        },
      },
    ],
  },
] as const;

export const metadata: Metadata = {
  // governed-by: ADR-0005 D1 — the origin is the one constant in lib/shared.
  metadataBase: new URL(siteUrl),
  title: { default: "toron.dev — the autonomous agent stack", template: "%s | toron.dev" },
  description: "The mailbox is the transport. The stack is what keeps autonomous work moving.",
  keywords: [
    "autonomous agents",
    "multi-agent workflows",
    "Nostr",
    "MCP",
    "agent coordination",
    "durable workflows",
    "signed mail",
  ],
  openGraph: {
    type: "website",
    url: siteUrl,
    siteName: "toron.dev",
    title: "toron.dev — the autonomous agent stack",
    description:
      "Signed mail, orchestration, work evidence, and memory for autonomous multi-agent workflows.",
    images: ["/opengraph-image"],
  },
  twitter: {
    card: "summary_large_image",
    title: "toron.dev — the autonomous agent stack",
    description:
      "Signed mail, orchestration, work evidence, and memory for autonomous multi-agent workflows.",
    images: ["/opengraph-image"],
  },
  icons: { icon: [{ url: "/favicon.svg", type: "image/svg+xml" }] },
  other: { "theme-color": "#08090a" },
};

export default function Layout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${inter.variable} ${jetbrainsMono.variable}`}
      suppressHydrationWarning
    >
      <body className="flex min-h-screen flex-col">
        <div className="toron-bg" aria-hidden="true">
          <div className="toron-bg__field" />
          <div className="toron-bg__grid" />
        </div>
        <script dangerouslySetInnerHTML={{ __html: themeInitScript() }} suppressHydrationWarning />
        {jsonLd.map((block, index) => (
          <script
            key={index}
            type="application/ld+json"
            dangerouslySetInnerHTML={{ __html: JSON.stringify(block) }}
          />
        ))}
        <RootProvider search={{ options: { type: "static" } }}>{children}</RootProvider>
        <Analytics />
      </body>
    </html>
  );
}
