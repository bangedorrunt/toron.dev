import type { ReactNode } from 'react';
import { HomeLayout } from 'fumadocs-ui/layouts/home';
import { ThemeToggle } from '@toron/tokens/theme-toggle';
import { baseOptions } from '@/lib/layout.shared';

export default function Layout({ children }: { children: ReactNode }) {
  return <HomeLayout {...baseOptions({ themeToggle: <ThemeToggle /> })}>{children}</HomeLayout>;
}
