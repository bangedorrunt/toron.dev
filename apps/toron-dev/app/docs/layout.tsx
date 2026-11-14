import { source } from "@/lib/source";
import { DocsLayout } from "fumadocs-ui/layouts/docs";
import { ThemeToggle } from "@toron/tokens/theme-toggle";
import { CommandMenu, CommandTrigger } from "@/components/command-menu";
import { COMMANDS } from "@/lib/commands";
import { baseOptions } from "@/lib/layout.shared";

export default function Layout({ children }: LayoutProps<"/docs">) {
  const options = baseOptions();
  return (
    <>
      <DocsLayout
        tree={source.getPageTree()}
        {...options}
        nav={{
          ...options.nav,
          children: (
            <div className="toron-nav-tools">
              <CommandTrigger />
              <ThemeToggle />
            </div>
          ),
        }}
      >
        {children}
      </DocsLayout>
      <CommandMenu commands={COMMANDS} />
    </>
  );
}
