export const COMMAND_GROUPS = ["Navigate", "Planes", "Documentation", "Actions"] as const;

export type CommandGroup = (typeof COMMAND_GROUPS)[number];

export interface CommandItem {
  id: string;
  label: string;
  group: CommandGroup;
  href?: string;
  description?: string;
  keywords?: string;
  action?: "copy-install";
  hint?: string;
}

/*
 * The palette's static half. Documentation entries arrive from the generated
 * /search-index.json so the client bundle does not carry every page title.
 */
export const COMMANDS: CommandItem[] = [
  { id: "home", label: "Home", group: "Navigate", href: "/", keywords: "landing stack" },
  {
    id: "architecture",
    label: "Architecture",
    group: "Navigate",
    href: "/architecture",
    keywords: "ownership planes diagram",
  },
  {
    id: "how-it-works",
    label: "How it works",
    group: "Navigate",
    href: "/how-it-works",
    keywords: "flows diagrams protocol",
  },
  {
    id: "features",
    label: "Features",
    group: "Navigate",
    href: "/features",
    keywords: "capabilities index",
  },
  {
    id: "compare",
    label: "Compare",
    group: "Navigate",
    href: "/compare",
    keywords: "alternatives",
  },
  {
    id: "security",
    label: "Security",
    group: "Navigate",
    href: "/security",
    keywords: "gift wrap keys e2e",
  },
  { id: "roadmap", label: "Roadmap", group: "Navigate", href: "/roadmap", keywords: "future" },
  { id: "faq", label: "FAQ", group: "Navigate", href: "/faq", keywords: "questions" },
  { id: "blog", label: "Blog", group: "Navigate", href: "/blog", keywords: "posts" },

  { id: "docs", label: "Documentation", group: "Documentation", href: "/docs", keywords: "start" },
  {
    id: "guides",
    label: "Guides",
    group: "Documentation",
    href: "/docs/guides",
    keywords: "walkthroughs",
  },
  {
    id: "reference",
    label: "Reference",
    group: "Documentation",
    href: "/docs/reference",
    keywords: "tools schemas parity",
  },
  {
    id: "agent-guide",
    label: "Agent guide",
    group: "Documentation",
    href: "/agent-guide.md",
    keywords: "machine readable onboarding",
  },

  {
    id: "plane-toron",
    label: "Toron",
    group: "Planes",
    href: "/docs/toron",
    description: "signed mail, identity, receipts, reservations",
  },
  {
    id: "plane-flywheel",
    label: "Flywheel",
    group: "Planes",
    href: "/docs/flywheel",
    description: "dispatch, loops, workflows, cron",
  },
  {
    id: "plane-beads",
    label: "Beads",
    group: "Planes",
    href: "/docs/beads",
    description: "work items, gates, close evidence",
  },
  {
    id: "plane-chiebukuro",
    label: "Chiebukuro",
    group: "Planes",
    href: "/docs/chiebukuro",
    description: "curated knowledge, episodic memory",
  },

  {
    id: "copy-install",
    label: "Copy install command",
    group: "Actions",
    action: "copy-install",
    keywords: "cargo toron setup",
    hint: "cargo install toron",
  },
  {
    id: "github",
    label: "Open the repository on GitHub",
    group: "Actions",
    href: "https://github.com/bangedorrunt/toron.dev",
    keywords: "source code",
  },
];
