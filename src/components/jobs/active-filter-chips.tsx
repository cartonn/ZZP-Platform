"use client";

// Toont de actieve opdracht-filters als afzonderlijk wisbare pills, plus een
// "Wis alles"-knop. Elke pill verwijdert zijn eigen filter uit de URL-searchParams
// (zodat de server-page opnieuw filtert); "Wis alles" haalt alle filter-params weg
// maar behoudt bewust de gekozen sortering (sort).

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { X } from "lucide-react";
import { type ActiveJobFilterChip } from "@/lib/jobs/active-filters";
import { useT } from "@/components/i18n/locale-provider";
import { cn } from "@/lib/utils";

export function ActiveFilterChips({ chips }: { chips: ActiveJobFilterChip[] }) {
  const translate = useT();
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();

  if (chips.length === 0) return null;

  const removeChip = (chip: ActiveJobFilterChip) => {
    const next = new URLSearchParams(Array.from(params.entries()));
    if (chip.value !== undefined) {
      // Multi-value param (bv. skillIds): laat alleen de betreffende waarde vallen.
      const remaining = next.getAll(chip.param).filter((v) => v !== chip.value);
      next.delete(chip.param);
      for (const v of remaining) next.append(chip.param, v);
    } else if (chip.offValue !== undefined) {
      // Standaard-aan-filter: expliciet uitzetten, anders zet de standaardstand 'm meteen terug.
      next.set(chip.param, chip.offValue);
    } else {
      next.delete(chip.param);
    }
    next.delete("page"); // filterwijziging -> terug naar pagina 1
    router.push(`${pathname}?${next.toString()}`);
  };

  const clearAll = () => {
    // Verse params: behoud alleen de sortering, alle filters + page verdwijnen. Filters die
    // standaard AAN staan worden expliciet uitgezet — anders blijft hun chip na "Wis alles" staan.
    const next = new URLSearchParams();
    const sort = params.get("sort");
    if (sort) next.set("sort", sort);
    for (const chip of chips) {
      if (chip.offValue !== undefined) next.set(chip.param, chip.offValue);
    }
    router.push(`${pathname}?${next.toString()}`);
  };

  return (
    <div className="flex flex-wrap items-center gap-2">
      {chips.map((chip) => (
        <button
          key={chip.id}
          type="button"
          onClick={() => removeChip(chip)}
          aria-label={`${translate("Filter verwijderen")}: ${chip.label}`}
          className={cn(
            "inline-flex items-center gap-1.5 rounded-full border border-border bg-muted/40 px-3 py-1 text-xs transition-colors hover:bg-muted",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
          )}
        >
          <span>{chip.label}</span>
          <X className="size-3" aria-hidden />
        </button>
      ))}
      <button
        type="button"
        onClick={clearAll}
        className={cn(
          "text-xs text-muted-foreground underline-offset-2 transition-colors hover:underline",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
        )}
      >
        {translate("Wis alles")}
      </button>
    </div>
  );
}
