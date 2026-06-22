"use client";

import { Search } from "lucide-react";

/** Knop die de globale snelzoeker (⌘K) opent via een CustomEvent op window. */
export function SearchTrigger({
  label = "Zoeken…",
  ariaLabel = "Snelzoeker openen (Ctrl K)",
}: {
  label?: string;
  ariaLabel?: string;
} = {}) {
  function open() {
    window.dispatchEvent(new CustomEvent("open-command-palette"));
  }

  return (
    <button
      type="button"
      onClick={open}
      aria-label={ariaLabel}
      className="focus-ring flex h-9 items-center gap-2 rounded-lg text-muted-foreground transition-colors hover:text-foreground sm:border sm:border-border sm:bg-background sm:px-2.5 sm:hover:bg-muted"
    >
      <Search className="size-5 sm:size-4" aria-hidden />
      <span className="hidden text-sm sm:inline">{label}</span>
      <kbd className="ml-3 hidden rounded border border-border bg-muted px-1.5 font-sans text-[11px] font-medium leading-5 text-muted-foreground sm:inline">
        ⌘K
      </kbd>
    </button>
  );
}
