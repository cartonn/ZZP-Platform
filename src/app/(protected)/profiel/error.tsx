"use client";

import { ErrorState } from "@/components/ui/error-state";

// Lokale foutgrens voor het profiel (inclusief bewerken): een fout hier laat de ZZP'er niet op de
// globale crashpagina achter.
export default function ProfielError(props: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <ErrorState
      {...props}
      title="Je profiel kon niet worden geladen"
      back={{ label: "Naar dashboard", href: "/dashboard" }}
    />
  );
}
