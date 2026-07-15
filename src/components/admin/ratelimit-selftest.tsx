"use client";

import { useState, useTransition } from "react";
import { CheckCircle2, Loader2, MinusCircle, XCircle } from "lucide-react";
import { runRateLimitSelfTestAction } from "@/app/(protected)/admin/systeemstatus/actions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { RateLimitSelfTestReport } from "@/lib/services/ratelimit-selftest";

// Admin-only connectiviteitszelftest voor de gedeelde rate-limit-store (Upstash Redis). Draait op
// verzoek (geen per-request-I/O op de pagina) een echte round-trip tegen de geconfigureerde store en
// toont het resultaat per stap. Server-side waarheid: de knop triggert alleen de server-actie, die de
// authz-keten + rate-limit + audit afhandelt. Op RATE_LIMIT_STORE=memory is er niets gedeelds om te
// testen; dat wordt eerlijk gemeld (geen vals groen vinkje).

export function RateLimitSelfTest({ storeMode }: { storeMode: string }) {
  const [pending, startTransition] = useTransition();
  const [report, setReport] = useState<RateLimitSelfTestReport | null>(null);
  const [error, setError] = useState<string | null>(null);

  const run = () => {
    setError(null);
    startTransition(async () => {
      const result = await runRateLimitSelfTestAction();
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
          <CardTitle>Rate-limit-zelftest</CardTitle>
          <p className="mt-1 text-sm text-muted-foreground">
            Doet een round-trip (tellen, TTL zetten, opruimen) tegen de gedeelde rate-limit-store
            (store <span className="font-mono text-xs">{storeMode}</span>) om te bevestigen dat een
            geconfigureerde Upstash Redis echt bereikbaar is. De store is fail-open, dus een
            verkeerde sleutel faalt anders stil. Voer dit uit na het instellen van de secrets.
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
          !report.active ? (
            <p className="flex items-start gap-2 text-sm text-muted-foreground">
              <MinusCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
              Geen gedeelde store actief (store{" "}
              <span className="font-mono text-xs">{report.storeMode}</span>) — rate-limits gelden
              per proces, er is niets getest. Zet{" "}
              <span className="font-mono text-xs">RATE_LIMIT_STORE=upstash</span> met de
              Upstash-secrets vóór horizontale schaling.
            </p>
          ) : (
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Badge variant={report.ok ? "success" : "danger"}>
                  {report.ok ? "Store werkt" : "Store faalt"}
                </Badge>
                <span className="text-sm text-muted-foreground">
                  store <span className="font-mono text-xs">{report.storeMode}</span>
                </span>
              </div>
              <ul className="divide-y divide-border rounded-lg border border-border">
                {report.steps.map((step) => (
                  <li key={step.key} className="flex items-start gap-2 px-3 py-2 text-sm">
                    {step.ok ? (
                      <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-success" aria-hidden />
                    ) : (
                      <XCircle className="mt-0.5 h-4 w-4 shrink-0 text-danger" aria-hidden />
                    )}
                    <span className="min-w-0 flex-1">
                      <span className="font-medium">{step.label}</span>
                      {step.detail ? (
                        <span className="text-muted-foreground"> — {step.detail}</span>
                      ) : null}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )
        ) : (
          <p className="text-sm text-muted-foreground">
            Nog niet uitgevoerd. Start de zelftest om de rate-limit-store te controleren.
          </p>
        )}
      </CardContent>
    </Card>
  );
}
