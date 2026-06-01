"use client";

import { useEffect, useState } from "react";
import { type Palette, PALETTES, PALETTE_LABELS, isPalette, applyPalette } from "@/lib/theme";

// Voorbeeldkleur per palette (de signatuur-primary), zodat de swatch het schema laat
// zien ongeacht het actieve thema. HSL-triples komen overeen met globals.css.
const SWATCH: Record<Palette, string> = {
  standaard: "hsl(240 6% 10%)",
  bloei: "hsl(230 23% 35%)",
  "elektrisch-blauw": "hsl(215 100% 50%)",
};

/** Kleurschemakiezer (3 opties). Persisteert in localStorage als "palette"; de no-flash-script
 *  in de root-layout zet het schema al vóór de eerste paint. Staat naast de light/dark-toggle. */
export function PaletteSwitcher() {
  const [palette, setPalette] = useState<Palette>("standaard");

  useEffect(() => {
    const stored = localStorage.getItem("palette");
    setPalette(isPalette(stored) ? stored : "standaard");
  }, []);

  function choose(next: Palette) {
    setPalette(next);
    applyPalette(next, document.documentElement);
    try {
      localStorage.setItem("palette", next);
    } catch {
      /* localStorage kan geblokkeerd zijn — niet kritiek. */
    }
  }

  return (
    <div
      role="radiogroup"
      aria-label="Kleurschema"
      className="inline-flex items-center gap-1 rounded-md border border-border p-1"
    >
      {PALETTES.map((p) => {
        const active = palette === p;
        return (
          <button
            key={p}
            type="button"
            role="radio"
            aria-checked={active}
            aria-label={`Kleurschema ${PALETTE_LABELS[p]}`}
            title={PALETTE_LABELS[p]}
            onClick={() => choose(p)}
            className={`focus-ring flex size-6 items-center justify-center rounded-full border transition-transform hover:scale-110 ${
              active
                ? "border-foreground ring-2 ring-ring ring-offset-1 ring-offset-background"
                : "border-border"
            }`}
          >
            <span
              className="size-3.5 rounded-full"
              style={{ backgroundColor: SWATCH[p] }}
              aria-hidden
            />
          </button>
        );
      })}
    </div>
  );
}
