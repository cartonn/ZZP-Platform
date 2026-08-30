"use client";

import { useState, useTransition } from "react";
import { CheckCircle2, Loader2, MinusCircle, XCircle } from "lucide-react";
import { runPushSelfTestAction } from "@/app/(protected)/admin/systeemstatus/actions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { PushSelfTestReport } from "@/lib/services/push-selftest";

// Admin-only config-zelftest voor het web-push-kanaal (VAPID). Valideert op verzoek PUUR-lokaal dat
// het geconfigureerde VAPID-sleutelpaar klopt (sleutelparing via ECDH-afleiding, sleutel-formaat,
// subject) — zonder een abonnee, zonder een push te versturen, zonder mutatie. Server-side waarheid:
// de knop triggert alleen de server-actie, die de authz-keten + rate-limit + audit afhandelt. Staan
// de VAPID-sleutels niet gezet (push uit), dan wordt dat eerlijk als "niets getest" gemeld (geen vals
// groen vinkje).

export function PushSelfTest({ configured }: { configured: boolean }) {
  const [pending, startTransition] = useTransition();
  const [report, setReport] = useState<PushSelfTestReport | null>(null);
  const [error, setError] = useState<string | null>(null);

  const run = () => {
    setError(null);
    startTransition(async () => {
      const result = await runPushSelfTestAction();
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
          <CardTitle>Web-push-zelftest</CardTitle>
          <p className="mt-1 text-sm text-muted-foreground">
            Controleert of het geconfigureerde VAPID-sleutelpaar klopt (
            <span className="font-mono text-xs">{configured ? "aan" : "uit"}</span>): de publieke
            sleutel moet aantoonbaar afleiden uit de private sleutel. Puur lokaal — geen push
            verstuurd. Voer dit uit na het plakken van de sleutels; een verkeerd gecombineerd paar
            overleeft de boot maar laat elke pushmelding stil met 403 mislukken.
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
                  ? "Push uit"
                  : report.ok
                    ? "Sleutelpaar geldig"
                    : "Sleutelpaar faalt"}
              </Badge>
              <span className="text-sm text-muted-foreground">
                status <span className="font-mono text-xs">{report.configState}</span>
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
                {report.detail ?? (report.ok ? "Sleutelpaar geldig." : "Sleutelpaar faalt.")}
              </span>
            </p>
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">
            Nog niet uitgevoerd. Start de zelftest om het VAPID-sleutelpaar te controleren.
          </p>
        )}
      </CardContent>
    </Card>
  );
}
