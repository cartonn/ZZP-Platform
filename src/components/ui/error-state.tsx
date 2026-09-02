"use client";

import { useEffect } from "react";
import Link from "next/link";
import { TriangleAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import { reportClientError } from "@/lib/observability/report-client";
import { cn } from "@/lib/utils";

// Gedeelde foutstaat voor React-error-boundaries (`error.tsx`). Eén rustige, consistente vorm voor
// "hier ging iets mis": icoon in een zachte cirkel, titel, korte uitleg, "Opnieuw proberen" (roept
// `reset()` aan) en een terugweg naar het overzicht. Zo blijft een gefaalde render van één
// detailpagina lokaal — de gebruiker houdt de app-shell en zijn navigatie — in plaats van op de
// globale crashpagina te belanden.
//
// De fout wordt bij het monteren één keer gerapporteerd via de bestaande client-fout-rapportage
// (/api/client-error). Bewust geen technische details in beeld: die horen in de logs, niet bij de
// gebruiker.
export interface ErrorStateBackLink {
  label: string;
  href: string;
}

export function ErrorState({
  error,
  reset,
  title = "Er ging iets mis",
  description = "Deze pagina kon niet worden geladen. Probeer het opnieuw; blijft het misgaan, ga dan terug naar het overzicht.",
  back = { label: "Naar dashboard", href: "/dashboard" },
  className,
}: {
  error: Error & { digest?: string };
  reset: () => void;
  title?: string;
  description?: string;
  /** Terugweg wanneer opnieuw proberen niet helpt. */
  back?: ErrorStateBackLink;
  className?: string;
}) {
  useEffect(() => {
    reportClientError(error, { digest: error.digest });
  }, [error]);

  return (
    <div
      role="alert"
      className={cn(
        "mx-auto flex max-w-md flex-col items-center gap-4 px-6 py-16 text-center",
        className,
      )}
    >
      <div className="flex size-12 items-center justify-center rounded-full bg-danger/10 text-danger">
        <TriangleAlert className="size-6" aria-hidden />
      </div>
      <div className="space-y-1">
        <h1 className="text-lg font-semibold tracking-tight text-foreground">{title}</h1>
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>
      <div className="flex flex-wrap items-center justify-center gap-2">
        <Button onClick={reset}>Opnieuw proberen</Button>
        <Button asChild variant="secondary">
          <Link href={back.href}>{back.label}</Link>
        </Button>
      </div>
      {/* Correlatie-ID: laat de gebruiker de exacte fout benoemen in een supportverzoek. */}
      {error.digest ? (
        <p className="font-mono text-xs text-muted-foreground">Foutcode {error.digest}</p>
      ) : null}
    </div>
  );
}
