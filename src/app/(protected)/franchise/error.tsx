"use client";

import { ErrorState } from "@/components/ui/error-state";

// Lokale foutgrens voor de bemiddelaarswerkplek: een gefaald scherm houdt de overige
// bemiddelingsschermen bereikbaar.
export default function FranchiseError(props: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <ErrorState
      {...props}
      title="Dit scherm kon niet worden geladen"
      back={{ label: "Naar dashboard", href: "/dashboard" }}
    />
  );
}
