"use client";

import { ErrorState } from "@/components/ui/error-state";

// Lokale foutgrens: een gefaalde render van één samenwerking houdt de rest van de app overeind.
export default function SamenwerkingDetailError(props: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <ErrorState
      {...props}
      title="Deze samenwerking kon niet worden geladen"
      back={{ label: "Naar samenwerkingen", href: "/samenwerkingen" }}
    />
  );
}
