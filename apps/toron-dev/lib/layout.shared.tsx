import type { BaseLayoutProps, LinkItemType, MainItemType } from "fumadocs-ui/layouts/shared";
import type { ReactNode } from "react";
import { IconGithub } from "@/components/ui/icons";
import { appName, gitConfig } from "./shared";

// ADR-0004 D7: the top nav surfaces the walkthroughs, because a reader who
// wants to do something should not have to dig through the reference to find
// the task-oriented path. Features moves to the landing page and footer.
function siteLinks(): MainItemType[] {
  return [
    { type: "main", text: "Docs", url: "/docs" },
    { type: "main", text: "Guides", url: "/docs/guides" },
    { type: "main", text: "Architecture", url: "/architecture" },
    { type: "main", text: "How it works", url: "/how-it-works" },
    { type: "main", text: "Compare", url: "/compare" },
    { type: "main", text: "Blog", url: "/blog" },
  ];
}

function rightCluster(): LinkItemType[] {
  return [
    {
      type: "icon",
      label: "GitHub repository",
      icon: <IconGithub />,
      text: "GitHub",
      secondary: true,
      url: `https://github.com/${gitConfig.user}/${gitConfig.repo}`,
      external: true,
    },
    { type: "button", text: "Install", url: "/#install" },
  ];
}

export interface SiteNavOptions {
  themeToggle?: ReactNode;
  commandMenu?: ReactNode;
}

export function baseOptions(options?: SiteNavOptions): BaseLayoutProps {
  const items: LinkItemType[] = [...siteLinks(), ...rightCluster()];

  if (options?.themeToggle) {
    items.push({ type: "custom", secondary: true, children: options.themeToggle });
  }

  return {
    nav: { title: appName, children: options?.commandMenu },
    links: items,
  };
}
