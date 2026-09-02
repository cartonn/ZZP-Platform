"use client";

// "Meer"-menu in de bovenbalk: de secundaire navigatie-items (naslag, instellingen) die bewust
// niet in de zijbalk staan, zodat die op de dagelijkse werkstroom blijft. Sluit bij Escape, bij een
// klik buiten het paneel en bij een routewissel — dezelfde omgangsvormen als de mobiele lade.

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { MoreHorizontal } from "lucide-react";
import { type NavItem } from "@/lib/nav";
import { type NavBadges } from "@/lib/signals";
import { cn } from "@/lib/utils";

export function NavMoreMenu({
  items,
  badges,
  label,
}: {
  items: NavItem[];
  badges?: NavBadges;
  /** Toegankelijke naam van de knop (vertaald door de server-shell). */
  label: string;
}) {
  const [open, setOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const pathname = usePathname();

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    const onPointer = (e: PointerEvent) => {
      if (!wrapperRef.current?.contains(e.target as Node)) setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    window.addEventListener("pointerdown", onPointer);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("pointerdown", onPointer);
    };
  }, [open]);

  if (items.length === 0) return null;

  return (
    <div ref={wrapperRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label={label}
        title={label}
        aria-expanded={open}
        aria-haspopup="menu"
        className="focus-ring inline-flex size-9 items-center justify-center rounded-lg border border-border bg-background text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
      >
        <MoreHorizontal className="size-4" aria-hidden />
      </button>
      {open && (
        <div
          role="menu"
          aria-label={label}
          className="absolute right-0 z-50 mt-2 w-56 rounded-lg border border-border bg-card p-1 shadow-lg"
        >
          {items.map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
            const badge = badges?.[item.href];
            return (
              <Link
                key={item.href}
                href={item.href}
                role="menuitem"
                aria-current={isActive ? "page" : undefined}
                className={cn(
                  "focus-ring flex items-center gap-2 rounded-md px-3 py-2 text-sm transition-colors",
                  isActive
                    ? "bg-accent font-medium text-accent-foreground"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground",
                )}
              >
                <span className="truncate">{item.label}</span>
                {badge && (
                  <span className="ml-auto flex min-w-5 items-center justify-center rounded-full border border-border bg-background px-1.5 text-[11px] font-medium tabular-nums leading-5 text-muted-foreground">
                    {badge.count > 99 ? "99+" : badge.count}
                  </span>
                )}
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
