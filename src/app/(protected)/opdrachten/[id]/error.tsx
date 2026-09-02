"use client";

import { ErrorState } from "@/components/ui/error-state";

// Lokale foutgrens: een gefaalde render van één opdracht houdt de rest van de app overeind.
export default function OpdrachtDetailError(props: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <ErrorState
      {...props}
      title="Deze opdracht kon niet worden geladen"
      back={{ label: "Naar opdrachten", href: "/opdrachten" }}
    />
  );
}
