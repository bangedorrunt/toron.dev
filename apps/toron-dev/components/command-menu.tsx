"use client";

import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type KeyboardEvent as ReactKeyboardEvent,
} from "react";
import { useRouter } from "next/navigation";
import { COMMAND_GROUPS, type CommandItem } from "@/lib/commands";
import {
  IconArrowRight,
  IconBook,
  IconCheck,
  IconCommand,
  IconLayers,
  IconSearch,
  IconTerminal,
} from "./ui/icons";

/*
 * The command surface is first-class, not a search box in the corner.
 *
 * A trigger only dispatches an intent; the dialog is mounted once per layout and
 * listens for it. That matters in the docs shell, where Fumadocs renders its nav
 * children twice (desktop and mobile): two triggers are fine, two dialogs are not.
 *
 * ⌘K opens it; `/` opens it when the reader is not already typing; arrows move,
 * Enter runs, Escape closes. Documentation entries are fetched from the static
 * index on first open so the shell does not ship every page title to every route.
 */

const GROUP_ORDER = new Map<string, number>(COMMAND_GROUPS.map((group, index) => [group, index]));

function groupIcon(group: string) {
  if (group === "Documentation") return IconBook;
  if (group === "Planes") return IconLayers;
  if (group === "Actions") return IconTerminal;
  return IconCommand;
}

export function CommandTrigger() {
  return (
    <button
      type="button"
      className="toron-cmd-trigger"
      onClick={() => window.dispatchEvent(new Event("toron:command"))}
      aria-label="Open command menu"
      aria-haspopup="dialog"
      aria-keyshortcuts="Meta+K Control+K"
    >
      <IconSearch />
      <span className="toron-cmd-trigger__label">Search</span>
      <kbd>⌘K</kbd>
    </button>
  );
}

export function CommandMenu({ commands }: { commands: CommandItem[] }) {
  const router = useRouter();
  const dialogRef = useRef<HTMLDialogElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const docsLoaded = useRef(false);

  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [docs, setDocs] = useState<CommandItem[]>([]);
  const [active, setActive] = useState(0);
  const [copied, setCopied] = useState(false);

  function reveal() {
    setQuery("");
    setActive(0);
    setCopied(false);
    setOpen(true);
  }

  useEffect(() => {
    const onIntent = () => reveal();
    window.addEventListener("toron:command", onIntent);
    return () => window.removeEventListener("toron:command", onIntent);
  }, []);

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        event.stopPropagation();
        if (open) {
          setOpen(false);
        } else {
          reveal();
        }
        return;
      }

      if (event.key !== "/" || open) return;
      const target = event.target;
      if (
        target instanceof HTMLElement &&
        (target.isContentEditable || ["INPUT", "TEXTAREA", "SELECT"].includes(target.tagName))
      ) {
        return;
      }
      event.preventDefault();
      reveal();
    }

    window.addEventListener("keydown", onKey, { capture: true });
    return () => window.removeEventListener("keydown", onKey, { capture: true });
  }, [open]);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    if (open && !dialog.open) {
      dialog.showModal();
      inputRef.current?.focus();
    }
    if (!open && dialog.open) dialog.close();
  }, [open]);

  useEffect(() => {
    if (!open || docsLoaded.current) return;
    docsLoaded.current = true;

    fetch("/search-index.json")
      .then((response) => (response.ok ? response.json() : []))
      .then((entries: CommandItem[]) => setDocs(entries))
      .catch(() => setDocs([]));
  }, [open]);

  const all = useMemo(() => [...commands, ...docs], [commands, docs]);

  const ordered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    const matched = needle
      ? all.filter((item) =>
          [item.label, item.group, item.description, item.keywords]
            .filter(Boolean)
            .join(" ")
            .toLowerCase()
            .includes(needle),
        )
      : all;

    return [...matched].toSorted(
      (a, b) => (GROUP_ORDER.get(a.group) ?? 99) - (GROUP_ORDER.get(b.group) ?? 99),
    );
  }, [all, query]);

  const groups = useMemo(
    () =>
      COMMAND_GROUPS.map((group) => ({
        group,
        items: ordered.filter((item) => item.group === group),
      })).filter((entry) => entry.items.length > 0),
    [ordered],
  );

  const indexOf = (item: CommandItem) => ordered.findIndex((entry) => entry.id === item.id);

  async function copyInstall() {
    try {
      await navigator.clipboard.writeText("cargo install toron");
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1600);
    } catch {
      setCopied(false);
    }
  }

  function run(item: CommandItem) {
    if (item.action === "copy-install") {
      void copyInstall();
      return;
    }

    if (!item.href) return;
    setOpen(false);

    if (/^https?:\/\//.test(item.href)) {
      window.open(item.href, "_blank", "noreferrer");
      return;
    }
    router.push(item.href);
  }

  function onInputKeyDown(event: ReactKeyboardEvent<HTMLInputElement>) {
    if (event.key === "ArrowDown") {
      event.preventDefault();
      setActive((index) => Math.min(index + 1, ordered.length - 1));
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      setActive((index) => Math.max(index - 1, 0));
    } else if (event.key === "Enter") {
      event.preventDefault();
      const item = ordered[active];
      if (item) run(item);
    } else if (event.key === "Home") {
      event.preventDefault();
      setActive(0);
    } else if (event.key === "End") {
      event.preventDefault();
      setActive(Math.max(ordered.length - 1, 0));
    }
  }

  return (
    <dialog
      ref={dialogRef}
      className="toron-cmdk"
      aria-label="Command menu"
      onClose={() => setOpen(false)}
    >
      {open ? (
        <div className="toron-cmdk__panel">
          <div className="toron-cmdk__search">
            <IconSearch />
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(event) => {
                setQuery(event.target.value);
                setActive(0);
              }}
              onKeyDown={onInputKeyDown}
              placeholder="Search pages, docs, actions"
              autoComplete="off"
              spellCheck={false}
              role="combobox"
              aria-expanded="true"
              aria-controls="toron-cmdk-list"
              aria-activedescendant={
                ordered[active] ? `toron-cmd-${ordered[active].id}` : undefined
              }
            />
            {copied ? <span className="toron-cmdk__copied">copied</span> : <kbd>esc</kbd>}
          </div>

          <div className="toron-cmdk__list" id="toron-cmdk-list" role="listbox">
            {ordered.length === 0 ? (
              <p className="toron-cmdk__empty">No results for “{query}”</p>
            ) : (
              groups.map(({ group, items }) => {
                const Icon = groupIcon(group);
                return (
                  <div key={group} role="group" aria-label={group}>
                    <p className="toron-cmdk__group">{group}</p>
                    {items.map((item) => {
                      const selected = ordered[active]?.id === item.id;
                      return (
                        <button
                          key={item.id}
                          id={`toron-cmd-${item.id}`}
                          type="button"
                          role="option"
                          aria-selected={selected}
                          tabIndex={-1}
                          className={`toron-cmdk__row${selected ? " is-active" : ""}`}
                          onMouseMove={() => setActive(indexOf(item))}
                          onClick={() => run(item)}
                        >
                          <span className="toron-cmdk__icon">
                            <Icon />
                          </span>
                          <span className="toron-cmdk__label">{item.label}</span>
                          {item.description ? (
                            <span className="toron-cmdk__desc">{item.description}</span>
                          ) : null}
                          {item.hint ? (
                            <span className="toron-cmdk__hint">
                              {copied && item.action === "copy-install" ? <IconCheck /> : item.hint}
                            </span>
                          ) : null}
                          <IconArrowRight className="toron-cmdk__go" />
                        </button>
                      );
                    })}
                  </div>
                );
              })
            )}
          </div>

          <div className="toron-cmdk__foot">
            <span>
              <kbd>↑</kbd>
              <kbd>↓</kbd> navigate
            </span>
            <span>
              <kbd>↵</kbd> open
            </span>
            <span>
              <kbd>esc</kbd> close
            </span>
          </div>
        </div>
      ) : null}
    </dialog>
  );
}
