"use client";

import { ErrorState } from "@/components/ui/error-state";

// Lokale foutgrens: een gefaalde render van één factuur houdt de rest van de app overeind.
export default function FactuurDetailError(props: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <ErrorState
      {...props}
      title="Deze factuur kon niet worden geladen"
      back={{ label: "Naar facturen", href: "/facturen" }}
    />
  );
}
