"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { type SidebarState } from "@/lib/sidebar";
import { cn } from "@/lib/utils";

/**
 * Zijbalk met een onthouden voorkeur (uitgeklapt/ingeklapt). Standaard **uitgeklapt** (16rem):
 * iconen én labels + sectiekoppen staan meteen zichtbaar — geen naamloze icoon-rail. De gebruiker
 * kan inklappen naar een smalle icoon-rail (4rem); die klapt bij hover/toetsenbordfocus tijdelijk
 * uit voor de labels en weer in zodra de muis weg is of de route wijzigt.
 *
 * De breedte wordt door state gestuurd (niet door CSS `hover:`/`focus-within:`) zodat een
 * routewijziging de ingeklapte rail deterministisch kan sluiten. `data-expanded` op de `group`
 * stuurt de vervaag-animatie van labels/badges in de kinderen
 * (`group-data-[expanded=true]:opacity-100`). In de uitgeklapte voorkeur staat `data-expanded`
 * permanent aan.
 */
export function SidebarRail({
  initialState = "expanded",
  children,
}: {
  /** Onthouden voorkeur uit de cookie (server-side gelezen). Standaard uitgeklapt. */
  initialState?: SidebarState;
  children: React.ReactNode;
}) {
  const pinned = initialState === "expanded";
  // Bij de ingeklapte voorkeur klapt de rail alleen tijdelijk uit bij hover/focus (`hovering`).
  const [hovering, setHovering] = useState(false);
  const ref = useRef<HTMLElement>(null);
  const pathname = usePathname();

  const expanded = pinned || hovering;

  // Na navigatie (bv. een klik op een menu-item) de tijdelijke hover-uitklap sluiten én de focus uit
  // de rail halen, zodat een nog-gefocust item 'm niet opnieuw openhoudt. Bij de uitgeklapte voorkeur
  // is dit een no-op (de rail blijft open).
  useEffect(() => {
    if (pinned) return;
    setHovering(false);
    const active = document.activeElement;
    if (active instanceof HTMLElement && ref.current?.contains(active)) {
      active.blur();
    }
  }, [pathname, pinned]);

  return (
    <aside
      ref={ref}
      data-expanded={expanded ? "true" : undefined}
      onMouseEnter={() => !pinned && setHovering(true)}
      onMouseLeave={() => !pinned && setHovering(false)}
      onFocus={() => !pinned && setHovering(true)}
      onBlur={(e) => {
        // Alleen sluiten als de focus de rail echt verlaat (niet bij focus tussen kinderen).
        if (!pinned && !e.currentTarget.contains(e.relatedTarget as Node | null))
          setHovering(false);
      }}
      className={cn(
        "group fixed inset-y-0 left-0 z-30 hidden overflow-hidden border-r border-border bg-card transition-[width] duration-200 md:flex",
        expanded ? "w-64" : "w-16",
      )}
    >
      {children}
    </aside>
  );
}
