"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { PanelLeftClose, PanelLeftOpen } from "lucide-react";
import {
  SIDEBAR_COOKIE,
  SIDEBAR_COOKIE_MAX_AGE,
  SIDEBAR_STATE_EVENT,
  type SidebarState,
} from "@/lib/sidebar";

/**
 * Klapt de zijbalk in/uit en onthoudt de keuze (server-action → cookie). Toont het label alleen
 * wanneer de rail uitgeklapt is (`group-data-[expanded=true]`); ingeklapt blijft het een icoon-knop
 * met een `aria-label`, zodat de bediening toegankelijk blijft zonder zichtbare tekst.
 */
export function SidebarToggle({ state }: { state: SidebarState }) {
  const [isPending, startTransition] = useTransition();
  const [current, setCurrent] = useState(state);
  const router = useRouter();
  useEffect(() => setCurrent(state), [state]);
  const collapsed = current === "collapsed";
  const next: SidebarState = collapsed ? "expanded" : "collapsed";
  const label = collapsed ? "Zijbalk uitklappen" : "Zijbalk inklappen";
  const Icon = collapsed ? PanelLeftOpen : PanelLeftClose;

  return (
    <button
      type="button"
      disabled={isPending}
      aria-label={label}
      onClick={() => {
        setCurrent(next);
        document.cookie = `${SIDEBAR_COOKIE}=${next}; Path=/; Max-Age=${SIDEBAR_COOKIE_MAX_AGE}; SameSite=Lax`;
        window.dispatchEvent(new CustomEvent(SIDEBAR_STATE_EVENT, { detail: next }));
        startTransition(() => router.refresh());
      }}
      className="focus-ring flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground disabled:opacity-60"
    >
      <Icon className="size-4 shrink-0" aria-hidden />
      <span className="truncate opacity-0 transition-opacity duration-150 group-data-[expanded=true]:opacity-100">
        {label}
      </span>
    </button>
  );
}
