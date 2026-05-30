"use client";

import { Printer } from "lucide-react";

export function PrintButton() {
  return (
    <button
      type="button"
      onClick={() => window.print()}
      className="inline-flex items-center gap-1.5 rounded-md border border-border px-3 py-1.5 text-sm text-muted-foreground transition-colors hover:border-foreground/30 hover:bg-muted hover:text-foreground focus-ring print-hide"
    >
      <Printer className="size-3.5" aria-hidden />
      Afdrukken / PDF
    </button>
  );
}
