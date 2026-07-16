"use client";

import { useState, useTransition } from "react";
import { CheckCircle2, Loader2, MinusCircle, XCircle } from "lucide-react";
import { runVerifierSelfTestAction } from "@/app/(protected)/admin/systeemstatus/actions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { VerifierSelfTestReport } from "@/lib/services/verify-selftest";

// Admin-only connectiviteitszelftest voor de externe verificatie-adapters (DUO/BIG/iDIN). Draait op
// verzoek (geen per-request-I/O op de pagina) een echte round-trip met een synthetische probe tegen
// elke geconfigureerde echte adapter en toont het resultaat per bron. Server-side waarheid: de knop
// triggert alleen de server-actie, die de authz-keten + rate-limit + audit afhandelt. Adapters op de
// demo-verifier (mock) worden eerlijk als "niets getest" gemeld (geen vals groen vinkje).

export function VerifierSelfTest() {
  const [pending, startTransition] = useTransition();
  const [report, setReport] = useState<VerifierSelfTestReport | null>(null);
  const [error, setError] = useState<string | null>(null);

  const run = () => {
    setError(null);
    startTransition(async () => {
      const result = await runVerifierSelfTestAction();
      if (result.ok) {
        setReport(result.report);
      } else {
        setReport(null);
        setError(result.error);
      }
    });
  };

  return (
    <Card>
      <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-3">
        <div>
          <CardTitle>Verificatie-zelftest</CardTitle>
          <p className="mt-1 text-sm text-muted-foreground">
            Doet een round-trip met een synthetische probe tegen elke geconfigureerde echte
            verificatiekoppeling (DUO, BIG, iDIN) om te bevestigen dat het endpoint bereikbaar is en
            volgens contract antwoordt. Toetst alleen bereikbaarheid, niet of de probe geverifieerd
            is. Voer dit uit na het instellen van de endpoints + sleutels.
          </p>
        </div>
        <Button variant="secondary" size="sm" onClick={run} disabled={pending}>
          {pending ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
              Bezig…
            </>
          ) : (
            "Zelftest uitvoeren"
          )}
        </Button>
      </CardHeader>
      <CardContent>
        {error ? (
          <p className="flex items-center gap-2 text-sm text-danger">
            <XCircle className="h-4 w-4 shrink-0" aria-hidden />
            {error}
          </p>
        ) : report ? (
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Badge variant={report.ok ? "success" : "danger"}>
                {report.ok ? "Koppelingen bereikbaar" : "Koppeling faalt"}
              </Badge>
              {!report.anyActive ? (
                <span className="text-sm text-muted-foreground">
                  geen echte adapter actief — er is niets getest
                </span>
              ) : null}
            </div>
            <ul className="divide-y divide-border rounded-lg border border-border">
              {report.results.map((result) => (
                <li key={result.key} className="flex items-start gap-2 px-3 py-2 text-sm">
                  {!result.active ? (
                    <MinusCircle
                      className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground"
                      aria-hidden
                    />
                  ) : result.ok ? (
                    <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-success" aria-hidden />
                  ) : (
                    <XCircle className="mt-0.5 h-4 w-4 shrink-0 text-danger" aria-hidden />
                  )}
                  <span className="min-w-0 flex-1">
                    <span className="font-medium">{result.label}</span>{" "}
                    <span className="font-mono text-xs text-muted-foreground">
                      ({result.driverMode})
                    </span>
                    {result.detail ? (
                      <span className="text-muted-foreground"> — {result.detail}</span>
                    ) : null}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">
            Nog niet uitgevoerd. Start de zelftest om de verificatiekoppelingen te controleren.
          </p>
        )}
      </CardContent>
    </Card>
  );
}
