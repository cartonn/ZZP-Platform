"use client";

import { useTransition } from "react";
import { PanelLeftClose, PanelLeftOpen } from "lucide-react";
import { setSidebarState } from "@/lib/sidebar-actions";
import { type SidebarState } from "@/lib/sidebar";

/**
 * Klapt de zijbalk in/uit en onthoudt de keuze (server-action → cookie). Toont het label alleen
 * wanneer de rail uitgeklapt is (`group-data-[expanded=true]`); ingeklapt blijft het een icoon-knop
 * met een `aria-label`, zodat de bediening toegankelijk blijft zonder zichtbare tekst.
 */
export function SidebarToggle({ state }: { state: SidebarState }) {
  const [isPending, startTransition] = useTransition();
  const collapsed = state === "collapsed";
  const next: SidebarState = collapsed ? "expanded" : "collapsed";
  const label = collapsed ? "Zijbalk uitklappen" : "Zijbalk inklappen";
  const Icon = collapsed ? PanelLeftOpen : PanelLeftClose;

  return (
    <button
      type="button"
      disabled={isPending}
      aria-label={label}
      onClick={() => startTransition(() => setSidebarState(next))}
      className="focus-ring flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground disabled:opacity-60"
    >
      <Icon className="size-4 shrink-0" aria-hidden />
      <span className="truncate opacity-0 transition-opacity duration-150 group-data-[expanded=true]:opacity-100">
        {label}
      </span>
    </button>
  );
}
