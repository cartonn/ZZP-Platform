"use client";

import { useState, useTransition } from "react";
import { CheckCircle2, Loader2, MinusCircle, XCircle } from "lucide-react";
import { runWebPushSelfTestAction } from "@/app/(protected)/admin/systeemstatus/actions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { WebPushSelfTestReport } from "@/lib/services/push-selftest";

// Admin-only operationele zelftest voor het web-push (VAPID) afleverkanaal. Draait op verzoek een LOKALE
// crypto-probe tegen de geconfigureerde VAPID-sleutels: signeert een verzendheader (zoals élke echte
// verzending) en vergelijkt de public/private-keypair — zonder één pushbericht te versturen. Server-side
// waarheid: de knop triggert alleen de server-actie, die de authz-keten + rate-limit + audit afhandelt.
// Staat web-push uit (geen sleutels), dan wordt dat eerlijk als "niets getest" gemeld (geen vals groen —
// in-app meldingen blijven werken); een verkeerd geplakte of niet-bij-elkaar-horende keypair wordt zo
// zichtbaar vóór de eerste echte melding stil mislukt.

export function PushSelfTest({ driverMode }: { driverMode: string }) {
  const [pending, startTransition] = useTransition();
  const [report, setReport] = useState<WebPushSelfTestReport | null>(null);
  const [error, setError] = useState<string | null>(null);

  const run = () => {
    setError(null);
    startTransition(async () => {
      const result = await runWebPushSelfTestAction();
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
            Controleert lokaal (zonder een pushbericht te versturen) of de VAPID-sleutels correct
            gewired zijn (config <span className="font-mono text-xs">{driverMode}</span>): signeert
            een verzendheader en vergelijkt de public/private-keypair. Zo zie je een verkeerd
            geplakte of niet-bij-elkaar-horende keypair vóór de eerste echte melding.
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
                {!report.active ? "Web-push uit" : report.ok ? "Operationeel" : "Aandacht"}
              </Badge>
              <span className="text-sm text-muted-foreground">
                config <span className="font-mono text-xs">{report.driverMode}</span>
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
                {report.detail ?? (report.ok ? "Operationeel." : "Aandacht.")}
              </span>
            </p>
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">
            Nog niet uitgevoerd. Start de zelftest om de VAPID-configuratie te controleren.
          </p>
        )}
      </CardContent>
    </Card>
  );
}
