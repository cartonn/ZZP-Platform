"use client";

import { useState, useTransition } from "react";
import { CheckCircle2, Loader2, MinusCircle, XCircle } from "lucide-react";
import { runUploadScannerSelfTestAction } from "@/app/(protected)/admin/systeemstatus/actions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { UploadScannerSelfTestReport } from "@/lib/services/upload-scanner-selftest";

// Admin-only connectiviteitszelftest voor de ClamAV upload-scanner. Draait op verzoek één round-trip
// tegen de clamd-daemon met de EICAR-testprobe, die bereikbaarheid + daadwerkelijke detectie bevestigt
// zonder een echt bestand op te slaan. Server-side waarheid: de knop triggert alleen de server-actie,
// die de authz-keten + rate-limit + audit afhandelt. Draait de scan op de default (noop), dan wordt
// dat eerlijk als "niets getest" gemeld (geen vals groen vinkje). Omdat de scanner fail-closed is,
// blokkeert een verkeerd geconfigureerde CLAMAV_HOST stil álle uploads — deze zelftest maakt dat
// vóór go-live zichtbaar.

export function UploadScannerSelfTest({ driverMode }: { driverMode: string }) {
  const [pending, startTransition] = useTransition();
  const [report, setReport] = useState<UploadScannerSelfTestReport | null>(null);
  const [error, setError] = useState<string | null>(null);

  const run = () => {
    setError(null);
    startTransition(async () => {
      const result = await runUploadScannerSelfTestAction();
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
          <CardTitle>Upload-scanner-zelftest</CardTitle>
          <p className="mt-1 text-sm text-muted-foreground">
            Stuurt de EICAR-testprobe naar de geconfigureerde malware-scanner (driver{" "}
            <span className="font-mono text-xs">{driverMode}</span>) om te bevestigen dat de
            clamd-daemon bereikbaar is én het testvirus daadwerkelijk herkent — zonder een echt
            bestand op te slaan. Voer dit uit na het instellen van{" "}
            <span className="font-mono text-xs">CLAMAV_HOST</span>.
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
                  ? "Geen scanner actief"
                  : report.ok
                    ? "Bereikbaar"
                    : "Scanner faalt"}
              </Badge>
              <span className="text-sm text-muted-foreground">
                driver <span className="font-mono text-xs">{report.driverMode}</span>
                {report.active && report.failOpen ? " · fail-open" : ""}
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
                {report.detail ?? (report.ok ? "Bereikbaar." : "Scanner faalt.")}
              </span>
            </p>
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">
            Nog niet uitgevoerd. Start de zelftest om de malware-scanner te controleren.
          </p>
        )}
      </CardContent>
    </Card>
  );
}
