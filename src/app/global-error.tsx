"use client";

// Root-error-boundary: het laatste vangnet. `error.tsx` vangt fouten BINNEN de app-layout, maar een
// fout in de root-layout zelf (providers, thema, fonts) valt daarbuiten — dan komt dít scherm.
// Het vervangt de hele document-boom, dus het rendert zijn eigen <html>/<body> en gebruikt
// uitsluitend inline-stijlen (de app-CSS/providers zijn hier mogelijk niet geladen). Rustige NL-
// fallback, geen stacktrace of technische details naar de gebruiker; alleen een korte foutreferentie.

import { useEffect } from "react";
import { reportClientError } from "@/lib/observability/report-client";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Server-fouten worden al door Next.js' onRequestError-grens gerapporteerd; hier loggen we de
    // client-kant én sturen 'm naar de reporter zodat een fout in de root-layout niet stil verdwijnt.
    console.error(error);
    reportClientError(error, { digest: error.digest });
  }, [error]);

  return (
    <html lang="nl">
      <body
        style={{
          margin: 0,
          minHeight: "100vh",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: "1rem",
          padding: "1.5rem",
          textAlign: "center",
          backgroundColor: "#0b0f19",
          color: "#e5e7eb",
          fontFamily:
            "ui-sans-serif, system-ui, -apple-system, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
        }}
      >
        <p style={{ fontSize: "1.5rem", fontWeight: 600, letterSpacing: "-0.01em", margin: 0 }}>
          Er ging iets mis
        </p>
        <p style={{ fontSize: "0.875rem", color: "#9ca3af", maxWidth: "28rem", margin: 0 }}>
          Er trad een onverwachte fout op. Probeer het opnieuw. Blijft het misgaan, kom dan later
          terug of neem contact op met support.
        </p>
        <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem", justifyContent: "center" }}>
          <button
            type="button"
            onClick={reset}
            style={{
              cursor: "pointer",
              borderRadius: "0.375rem",
              border: "none",
              backgroundColor: "#6366f1",
              color: "#ffffff",
              padding: "0.5rem 1rem",
              fontSize: "0.875rem",
              fontWeight: 500,
            }}
          >
            Opnieuw proberen
          </button>
          {/* Bewust een harde navigatie (geen next/link): global-error vervangt de hele
              document-boom; een volledige herlaad herstelt de app-context betrouwbaar. */}
          {/* eslint-disable-next-line @next/next/no-html-link-for-pages */}
          <a
            href="/"
            style={{
              borderRadius: "0.375rem",
              border: "1px solid #374151",
              color: "#e5e7eb",
              padding: "0.5rem 1rem",
              fontSize: "0.875rem",
              fontWeight: 500,
              textDecoration: "none",
            }}
          >
            Naar startpagina
          </a>
        </div>
        {error.digest ? (
          <p style={{ fontSize: "0.75rem", color: "#6b7280", margin: 0 }}>
            Foutreferentie: {error.digest}
          </p>
        ) : null}
      </body>
    </html>
  );
}
