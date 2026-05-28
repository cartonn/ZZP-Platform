"use client";

import Link from "next/link";
import { useEffect } from "react";
import { TriangleAlert } from "lucide-react";
import { Button } from "@/components/ui/button";

// Foutgrens voor de hele protected-omgeving. Vangt onverwachte fouten in pagina's op en
// toont een rustige, herstelbare staat binnen de app-shell (CLAUDE.md: elke view heeft
// loading/error/empty-states).
export default function ProtectedError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="mx-auto flex max-w-md flex-col items-center gap-4 py-16 text-center">
      <div className="flex size-12 items-center justify-center rounded-full bg-danger/10 text-danger">
        <TriangleAlert className="size-6" aria-hidden />
      </div>
      <div className="space-y-1">
        <h1 className="text-lg font-semibold tracking-tight">Er ging iets mis</h1>
        <p className="text-sm text-muted-foreground">
          Er trad een onverwachte fout op. Probeer het opnieuw; blijft het misgaan, ga dan terug naar je dashboard.
        </p>
      </div>
      <div className="flex flex-wrap items-center justify-center gap-2">
        <Button onClick={reset}>Probeer opnieuw</Button>
        <Button asChild variant="secondary">
          <Link href="/dashboard">Naar dashboard</Link>
        </Button>
      </div>
    </div>
  );
}
