"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

/**
 * Inklapbare zijbalk-rail: een smalle icoon-rail (4rem) die uitklapt naar 16rem bij hover of
 * toetsenbordfocus en weer inklapt zodra de muis weg is of de focus de rail verlaat. Cruciaal:
 * de rail klapt ook in zodra de route wijzigt — anders zou een aangeklikt menu-item de focus
 * houden (`:focus-within`) en bleef de rail open staan nadat de pagina al was geopend.
 *
 * De breedte wordt door state gestuurd (niet door CSS `hover:`/`focus-within:`) zodat de
 * route-wijziging 'm deterministisch kan sluiten. `data-expanded` op de `group` stuurt de
 * vervaag-animatie van labels/badges in de kinderen (`group-data-[expanded=true]:opacity-100`).
 */
export function SidebarRail({ children }: { children: React.ReactNode }) {
  const [expanded, setExpanded] = useState(false);
  const ref = useRef<HTMLElement>(null);
  const pathname = usePathname();

  // Na navigatie (bv. een klik op een menu-item) de rail sluiten én de focus uit de rail halen,
  // zodat een nog-gefocust item 'm niet opnieuw openhoudt.
  useEffect(() => {
    setExpanded(false);
    const active = document.activeElement;
    if (active instanceof HTMLElement && ref.current?.contains(active)) {
      active.blur();
    }
  }, [pathname]);

  return (
    <aside
      ref={ref}
      data-expanded={expanded ? "true" : undefined}
      onMouseEnter={() => setExpanded(true)}
      onMouseLeave={() => setExpanded(false)}
      onFocus={() => setExpanded(true)}
      onBlur={(e) => {
        // Alleen sluiten als de focus de rail echt verlaat (niet bij focus tussen kinderen).
        if (!e.currentTarget.contains(e.relatedTarget as Node | null)) setExpanded(false);
      }}
      className={cn(
        "group fixed inset-y-0 left-0 z-30 hidden w-16 overflow-hidden border-r border-border bg-card transition-[width] duration-200 md:flex",
        expanded && "w-64",
      )}
    >
      {children}
    </aside>
  );
}
