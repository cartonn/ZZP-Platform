"use client";

import { useState, useTransition } from "react";
import { CheckCircle2, Loader2, XCircle } from "lucide-react";
import { runStorageSelfTestAction } from "@/app/(protected)/admin/systeemstatus/actions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { StorageSelfTestReport } from "@/lib/services/storage-selftest";

// Admin-only connectiviteitszelftest voor de documentopslag. Draait op verzoek (geen
// per-request-I/O op de pagina) een echte round-trip tegen de geconfigureerde driver en toont het
// resultaat per stap. Server-side waarheid: de knop triggert alleen de server-actie, die de
// authz-keten + rate-limit + audit afhandelt.

export function StorageSelfTest({ driverMode }: { driverMode: string }) {
  const [pending, startTransition] = useTransition();
  const [report, setReport] = useState<StorageSelfTestReport | null>(null);
  const [error, setError] = useState<string | null>(null);

  const run = () => {
    setError(null);
    startTransition(async () => {
      const result = await runStorageSelfTestAction();
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
          <CardTitle>Opslag-zelftest</CardTitle>
          <p className="mt-1 text-sm text-muted-foreground">
            Schrijft, leest en verwijdert een testobject om te bevestigen dat de documentopslag
            (driver <span className="font-mono text-xs">{driverMode}</span>) echt bereikbaar en
            beschrijfbaar is, en bevestigt bij S3 dat het object versleuteld op schijf staat
            (encryptie-at-rest). Voer dit uit na het instellen van de bucket/sleutels.
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
                {report.ok ? "Opslag werkt" : "Opslag faalt"}
              </Badge>
              <span className="text-sm text-muted-foreground">
                driver <span className="font-mono text-xs">{report.driverMode}</span>
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
        ) : (
          <p className="text-sm text-muted-foreground">
            Nog niet uitgevoerd. Start de zelftest om de opslagverbinding te controleren.
          </p>
        )}
      </CardContent>
    </Card>
  );
}
