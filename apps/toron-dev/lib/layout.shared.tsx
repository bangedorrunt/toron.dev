import Image from "next/image";
import type { BaseLayoutProps, LinkItemType, MainItemType } from "fumadocs-ui/layouts/shared";
import type { ReactNode } from "react";
import { IconGithub } from "@/components/ui/icons";
import { PLANE_BY_SLUG } from "./planes";
import { appName, gitConfig } from "./shared";

function SiteBrand() {
  return (
    <span className="toron-brand">
      <Image
        src={PLANE_BY_SLUG.toron.art}
        alt=""
        width={30}
        height={30}
        sizes="30px"
        priority
        className="toron-brand__mark"
      />
      <span className="toron-brand__copy">
        <span className="toron-brand__name">{appName}</span>
        <span className="toron-brand__descriptor">fully autonomous multi agent workflows</span>
      </span>
    </span>
  );
}

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
    nav: { title: <SiteBrand />, children: options?.commandMenu },
    links: items,
  };
}
