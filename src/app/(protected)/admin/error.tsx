"use client";

import { ErrorState } from "@/components/ui/error-state";

// Lokale foutgrens voor het hele adminpaneel: een gefaalde wachtrij of hub-tab houdt de overige
// beheerschermen bereikbaar.
export default function AdminError(props: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <ErrorState
      {...props}
      title="Dit beheerscherm kon niet worden geladen"
      back={{ label: "Naar dashboard", href: "/dashboard" }}
    />
  );
}
