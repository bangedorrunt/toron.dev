import type { ReactNode } from "react";
import { HomeLayout } from "fumadocs-ui/layouts/home";
import { ThemeToggle } from "@toron/tokens/theme-toggle";
import { CommandMenu, CommandTrigger } from "@/components/command-menu";
import { COMMANDS } from "@/lib/commands";
import { baseOptions } from "@/lib/layout.shared";

export default function SiteLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <HomeLayout
        {...baseOptions({
          themeToggle: <ThemeToggle />,
          commandMenu: <CommandTrigger />,
        })}
      >
        {children}
      </HomeLayout>
      <CommandMenu commands={COMMANDS} />
    </>
  );
}
