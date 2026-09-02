"use client";

import { ErrorState } from "@/components/ui/error-state";

// Lokale foutgrens: de kandidatenlijst leunt op matching en filters; een fout daarin mag de
// opdrachtgever niet uit de app werken.
export default function KandidatenError(props: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <ErrorState
      {...props}
      title="De kandidaten konden niet worden geladen"
      back={{ label: "Naar dashboard", href: "/dashboard" }}
    />
  );
}
