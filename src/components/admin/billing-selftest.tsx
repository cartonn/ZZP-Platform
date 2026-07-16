"use client";

import { useState, useTransition } from "react";
import { CheckCircle2, Loader2, MinusCircle, XCircle } from "lucide-react";
import { runBillingSelfTestAction } from "@/app/(protected)/admin/systeemstatus/actions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { BillingSelfTestReport } from "@/lib/services/billing-selftest";

// Admin-only connectiviteitszelftest voor de betaalprovider (Stripe/Mollie). Draait op verzoek een
// READ-ONLY round-trip (Stripe /balance, Mollie /methods) die bereikbaarheid + geldige sleutel
// bevestigt zonder een betaling aan te maken. Server-side waarheid: de knop triggert alleen de
// server-actie, die de authz-keten + rate-limit + audit afhandelt. Draait de flow op de demo (noop),
// dan wordt dat eerlijk als "niets getest" gemeld (geen vals groen vinkje).

export function BillingSelfTest({ providerMode }: { providerMode: string }) {
  const [pending, startTransition] = useTransition();
  const [report, setReport] = useState<BillingSelfTestReport | null>(null);
  const [error, setError] = useState<string | null>(null);

  const run = () => {
    setError(null);
    startTransition(async () => {
      const result = await runBillingSelfTestAction();
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
          <CardTitle>Betaalprovider-zelftest</CardTitle>
          <p className="mt-1 text-sm text-muted-foreground">
            Doet een read-only controle tegen de geconfigureerde betaalprovider (driver{" "}
            <span className="font-mono text-xs">{providerMode}</span>) om te bevestigen dat de
            koppeling bereikbaar is en de sleutel geldig — zonder een betaling aan te maken. Voer
            dit uit na het instellen van de API-sleutels.
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
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant={!report.active ? "muted" : report.ok ? "success" : "danger"}>
                {!report.active
                  ? "Geen provider actief"
                  : report.ok
                    ? "Bereikbaar"
                    : "Koppeling faalt"}
              </Badge>
              <span className="text-sm text-muted-foreground">
                driver <span className="font-mono text-xs">{report.driverMode}</span>
              </span>
            </div>
            <p className="flex items-start gap-2 text-sm">
              {!report.active ? (
                <MinusCircle
                  className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground"
                  aria-hidden
                />
              ) : report.ok ? (
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-success" aria-hidden />
              ) : (
                <XCircle className="mt-0.5 h-4 w-4 shrink-0 text-danger" aria-hidden />
              )}
              <span className="min-w-0 flex-1 text-muted-foreground">
                {report.detail ?? (report.ok ? "Bereikbaar." : "Koppeling faalt.")}
              </span>
            </p>
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">
            Nog niet uitgevoerd. Start de zelftest om de betaalkoppeling te controleren.
          </p>
        )}
      </CardContent>
    </Card>
  );
}
