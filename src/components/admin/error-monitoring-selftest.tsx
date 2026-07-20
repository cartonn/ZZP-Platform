"use client";

import { useState, useTransition } from "react";
import { CheckCircle2, Loader2, MinusCircle, XCircle } from "lucide-react";
import { runErrorMonitoringSelfTestAction } from "@/app/(protected)/admin/systeemstatus/actions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { ErrorMonitoringSelfTestReport } from "@/lib/services/error-monitoring-selftest";

// Admin-only connectiviteitszelftest voor de externe error-monitoring (Sentry). Draait op verzoek
// één synthetische testgebeurtenis door de reporter en wacht op flush — dat bewijst dat het transport
// de gebeurtenis accepteerde. Server-side waarheid: de knop triggert alleen de server-actie, die de
// authz-keten + rate-limit + audit afhandelt. Is er geen DSN gezet, dan wordt dat eerlijk als "niets
// getest" gemeld (geen vals groen vinkje).

export function ErrorMonitoringSelfTest({ configured }: { configured: boolean }) {
  const [pending, startTransition] = useTransition();
  const [report, setReport] = useState<ErrorMonitoringSelfTestReport | null>(null);
  const [error, setError] = useState<string | null>(null);

  const run = () => {
    setError(null);
    startTransition(async () => {
      const result = await runErrorMonitoringSelfTestAction();
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
          <CardTitle>Error-monitoring-zelftest</CardTitle>
          <p className="mt-1 text-sm text-muted-foreground">
            Stuurt één testgebeurtenis naar de geconfigureerde externe monitoring (Sentry) en wacht
            op afleverbevestiging. Maakt de stille faalmodus zichtbaar waarbij{" "}
            <span className="font-mono text-xs">SENTRY_DSN</span> wel gezet is maar{" "}
            <span className="font-mono text-xs">@sentry/nextjs</span> niet geïnstalleerd — fouten
            worden dan alleen gelogd. Voer dit uit na het instellen van de DSN.
          </p>
        </div>
        <Button variant="secondary" size="sm" onClick={run} disabled={pending || !configured}>
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
        {!configured ? (
          <p className="flex items-start gap-2 text-sm text-muted-foreground">
            <MinusCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
            Geen externe monitoring geconfigureerd (SENTRY_DSN ontbreekt) — server-fouten worden
            alleen gestructureerd gelogd. Er is niets te testen.
          </p>
        ) : error ? (
          <p className="flex items-center gap-2 text-sm text-danger">
            <XCircle className="h-4 w-4 shrink-0" aria-hidden />
            {error}
          </p>
        ) : report ? (
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant={!report.active ? "muted" : report.ok ? "success" : "danger"}>
                {!report.active ? "Geen monitoring actief" : report.ok ? "Bereikbaar" : "Aandacht"}
              </Badge>
              <span className="text-sm text-muted-foreground">
                {report.active ? (
                  <>
                    pakket{" "}
                    <span className="font-mono text-xs">
                      {report.packageInstalled ? "geïnstalleerd" : "ontbreekt"}
                    </span>
                  </>
                ) : (
                  <span className="font-mono text-xs">niet geconfigureerd</span>
                )}
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
                {report.detail ?? (report.ok ? "Bereikbaar." : "Aandacht vereist.")}
              </span>
            </p>
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">
            Nog niet uitgevoerd. Start de zelftest om de error-monitoring-koppeling te controleren.
          </p>
        )}
      </CardContent>
    </Card>
  );
}
