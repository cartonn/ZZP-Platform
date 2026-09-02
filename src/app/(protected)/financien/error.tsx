"use client";

import { ErrorState } from "@/components/ui/error-state";

// Lokale foutgrens voor het financiële overzicht: de cijfers komen uit meerdere aggregaties, dus
// een fout in één daarvan mag de gebruiker niet uit de app werken.
export default function FinancienError(props: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <ErrorState
      {...props}
      title="Je financiële overzicht kon niet worden geladen"
      back={{ label: "Naar dashboard", href: "/dashboard" }}
    />
  );
}
