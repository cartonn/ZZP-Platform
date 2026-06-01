"use client";

import { Search } from "lucide-react";

/** Knop die de globale snelzoeker (⌘K) opent via een CustomEvent op window. */
export function SearchTrigger() {
  function open() {
    window.dispatchEvent(new CustomEvent("open-command-palette"));
  }

  return (
    <button
      type="button"
      onClick={open}
      aria-label="Snelzoeker openen (Ctrl K)"
      className="focus-ring rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
    >
      <Search className="size-5" aria-hidden />
    </button>
  );
}
