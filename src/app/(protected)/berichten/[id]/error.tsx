"use client";

import { ErrorState } from "@/components/ui/error-state";

// Lokale foutgrens: een gefaald gesprek houdt de rest van de berichtenomgeving overeind.
export default function GesprekError(props: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <ErrorState
      {...props}
      title="Dit gesprek kon niet worden geladen"
      back={{ label: "Naar berichten", href: "/berichten" }}
    />
  );
}
