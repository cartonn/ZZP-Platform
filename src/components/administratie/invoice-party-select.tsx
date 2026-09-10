"use client";

import { useRouter } from "next/navigation";
import { Filter } from "lucide-react";

export type InvoicePartyOption = {
  /** Volledige navigatie-URL (server-gebouwd, behoudt het statusfilter). */
  href: string;
  /** Weergavelabel, bv. "Zorginstelling De Linde (3)" of "Alle opdrachtgevers (12)". */
  label: string;
};

/**
 * Domme navigator voor het filteren van de facturenlijst op partij (opdrachtgever/ZZP'er).
 * De server rekent per optie de volledige href uit — inclusief het huidige statusfilter — zodat
 * dit component niets hoeft te weten van de URL-structuur: het toont de opties en pusht bij een
 * keuze simpelweg de gekozen href. De URL blijft de bron van waarheid (controlled `<select>`),
 * er is geen lokale filterstaat.
 */
export function InvoicePartySelect({
  options,
  value,
  label,
}: {
  options: InvoicePartyOption[];
  /** De href van de nu-geselecteerde optie (of van de "alle"-optie). */
  value: string;
  /** Toegankelijk label, bv. "Filter op opdrachtgever". */
  label: string;
}): React.JSX.Element {
  const router = useRouter();

  return (
    <label className="inline-flex items-center gap-1.5 rounded-md border border-border bg-background px-2 py-1 text-sm text-muted-foreground">
      <Filter className="size-4" aria-hidden />
      <span className="sr-only">{label}</span>
      <select
        aria-label={label}
        value={value}
        onChange={(e) => {
          const next = e.target.value;
          // Geen no-op-navigatie: pushen naar de huidige href zou onnodig herladen.
          if (next !== value) router.push(next);
        }}
        className="focus-ring rounded-md bg-background text-sm text-foreground"
      >
        {options.map((opt) => (
          <option key={opt.href} value={opt.href}>
            {opt.label}
          </option>
        ))}
      </select>
    </label>
  );
}
