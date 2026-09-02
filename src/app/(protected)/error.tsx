"use client";

import { ErrorState } from "@/components/ui/error-state";

// Foutgrens voor de hele protected-omgeving: het vangnet onder de fijnmazigere grenzen per
// deelgebied. Toont een rustige, herstelbare staat binnen de app-shell (CLAUDE.md: elke view heeft
// loading/error/empty-states).
export default function ProtectedError(props: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <ErrorState
      {...props}
      description="Er trad een onverwachte fout op. Probeer het opnieuw; blijft het misgaan, ga dan terug naar je dashboard."
    />
  );
}
