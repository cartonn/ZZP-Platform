"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ORT_SECTORS, ORT_SECTOR_LABEL, ORT_CATEGORIES, ORT_CATEGORY_LABEL } from "@/lib/config";
import { parseOrtCustomRates } from "@/lib/ort";
import { setOrtProfileAction } from "./actions";

/**
 * ORT-profiel instellen: kies een CAO-sector of "Maatwerk" met eigen percentages per categorie.
 * Maatwerk overschrijft het sectorprofiel. Alleen opdrachtgever/admin (server dwingt dit af).
 */
export function OrtProfileForm({
  collaborationId,
  ortProfile,
  ortCustomRates,
}: {
  collaborationId: string;
  ortProfile: string | null;
  ortCustomRates: string | null;
}) {
  const custom = parseOrtCustomRates(ortCustomRates);
  const [selected, setSelected] = useState<string>(custom ? "MAATWERK" : ortProfile ?? "DEFAULT");

  return (
    <form action={setOrtProfileAction.bind(null, collaborationId)} className="space-y-2">
      <div className="flex flex-wrap items-center gap-2">
        <select
          name="ortProfile"
          value={selected}
          onChange={(e) => setSelected(e.target.value)}
          className="rounded-md border border-input bg-background px-2 py-1.5 text-sm"
        >
          {ORT_SECTORS.map((s) => (
            <option key={s} value={s}>{ORT_SECTOR_LABEL[s]}</option>
          ))}
          <option value="MAATWERK">Maatwerk — eigen percentages per klant</option>
        </select>
        <Button type="submit" size="sm" variant="secondary">Opslaan</Button>
      </div>

      {selected === "MAATWERK" && (
        <div className="grid gap-2 rounded-md border border-border bg-muted/30 p-3 sm:grid-cols-3">
          {ORT_CATEGORIES.map((cat) => (
            <label key={cat} className="text-xs">
              <span className="mb-1 block text-muted-foreground">{ORT_CATEGORY_LABEL[cat]} (%)</span>
              <input
                name={`custom_${cat}`}
                type="number"
                step="1"
                min="0"
                defaultValue={custom ? Math.round(custom[cat] / 100) : ""}
                placeholder="bv. 22"
                className="w-full rounded-md border border-input bg-background px-2 py-1.5 text-sm"
              />
            </label>
          ))}
        </div>
      )}
    </form>
  );
}
