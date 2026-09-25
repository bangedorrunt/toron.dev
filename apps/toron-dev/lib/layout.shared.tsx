import type { BaseLayoutProps, LinkItemType, MainItemType } from 'fumadocs-ui/layouts/shared';
import type { ReactNode } from 'react';
import { appName, gitConfig } from './shared';

function siteLinks(): MainItemType[] {
  return [
    { type: 'main', text: 'Docs', url: '/docs' },
    { type: 'main', text: 'How it works', url: '/how-it-works' },
    { type: 'main', text: 'Architecture', url: '/architecture' },
    { type: 'main', text: 'Features', url: '/features' },
    { type: 'main', text: 'Compare', url: '/compare' },
    { type: 'main', text: 'Blog', url: '/blog' },
  ];
}

function rightCluster(): LinkItemType[] {
  return [
    {
      type: 'icon',
      label: 'GitHub repository',
      icon: <span aria-hidden="true">⌘</span>,
      text: 'GitHub',
      secondary: true,
      url: `https://github.com/${gitConfig.user}/${gitConfig.repo}`,
      external: true,
    },
    { type: 'button', text: 'Install', url: '/#install' },
  ];
}

export interface SiteNavOptions {
  themeToggle?: ReactNode;
}

export function baseOptions(options?: SiteNavOptions): BaseLayoutProps {
  const items: LinkItemType[] = [...siteLinks(), ...rightCluster()];

  if (options?.themeToggle) {
    items.push({ type: 'custom', secondary: true, children: options.themeToggle });
  }

  return {
    nav: { title: appName },
    links: items,
    githubUrl: `https://github.com/${gitConfig.user}/${gitConfig.repo}`,
  };
}
