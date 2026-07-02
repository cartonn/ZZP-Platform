"use client";

import { useState } from "react";
import Link from "next/link";
import { ClipboardList } from "lucide-react";
import { Button } from "@/components/ui/button";

export interface ActiveCollaborationOption {
  id: string;
  jobTitle: string;
  companyName: string;
}

/**
 * Primaire ingang "Urenstaat indienen". Het indienformulier zelf leeft op het samenwerkingsdetail
 * (uren-sectie); deze knop routeert er alleen heen. Geen indien-logica hier.
 * - 0 actieve samenwerkingen → uitleg (geen dode knop).
 * - 1 → directe deep-link naar de uren-sectie.
 * - meerdere → klein keuzemenu "Voor welke samenwerking?".
 */
export function SubmitHoursMenu({
  collaborations,
}: {
  collaborations: ActiveCollaborationOption[];
}) {
  const [open, setOpen] = useState(false);

  if (collaborations.length === 0) {
    return (
      <span className="text-xs text-muted-foreground">
        Geen actieve samenwerking om uren voor in te dienen.
      </span>
    );
  }

  if (collaborations.length === 1) {
    return (
      <Button asChild size="sm" variant="primary">
        <Link href={`/samenwerkingen/${collaborations[0]!.id}#uren`}>
          <ClipboardList className="mr-1.5 size-4" aria-hidden />
          Urenstaat indienen
        </Link>
      </Button>
    );
  }

  return (
    <div className="relative">
      <Button
        type="button"
        size="sm"
        variant="primary"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-haspopup="menu"
      >
        <ClipboardList className="mr-1.5 size-4" aria-hidden />
        Urenstaat indienen
      </Button>
      {open && (
        <div
          role="menu"
          className="absolute right-0 z-10 mt-1 w-72 rounded-md border border-border bg-card p-1 shadow-md"
        >
          <p className="px-2 py-1.5 text-xs font-medium text-muted-foreground">
            Voor welke samenwerking?
          </p>
          {collaborations.map((c) => (
            <Link
              key={c.id}
              href={`/samenwerkingen/${c.id}#uren`}
              role="menuitem"
              className="focus-ring block rounded-sm px-2 py-1.5 text-sm hover:bg-muted"
            >
              <span className="block truncate font-medium">{c.jobTitle}</span>
              <span className="block truncate text-xs text-muted-foreground">{c.companyName}</span>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
