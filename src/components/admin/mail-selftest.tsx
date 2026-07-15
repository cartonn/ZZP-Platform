"use client";

import { useState, useTransition } from "react";
import { CheckCircle2, Loader2, XCircle } from "lucide-react";
import { runMailSelfTestAction } from "@/app/(protected)/admin/systeemstatus/actions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import type { MailSelfTestReport } from "@/lib/services/mail-selftest";

// Admin-only connectiviteitszelftest voor het e-mailkanaal. Stuurt op verzoek één echte testmail
// naar het ingevulde adres via de geconfigureerde driver en toont de uitkomst. Server-side waarheid:
// de knop triggert alleen de server-actie, die de authz-keten + rate-limit + audit + validatie doet.

export function MailSelfTest({ driverMode }: { driverMode: string }) {
  const [pending, startTransition] = useTransition();
  const [recipient, setRecipient] = useState("");
  const [report, setReport] = useState<MailSelfTestReport | null>(null);
  const [error, setError] = useState<string | null>(null);

  const run = () => {
    setError(null);
    startTransition(async () => {
      const result = await runMailSelfTestAction(recipient);
      if (result.ok) {
        setReport(result.report);
      } else {
        setReport(null);
        setError(result.error);
      }
    });
  };

  const canSend = recipient.trim().length > 0 && !pending;

  return (
    <Card>
      <CardHeader>
        <CardTitle>E-mail-zelftest</CardTitle>
        <p className="mt-1 text-sm text-muted-foreground">
          Stuurt één testmail via het geconfigureerde kanaal (driver{" "}
          <span className="font-mono text-xs">{driverMode}</span>) om te bevestigen dat de provider
          echt aflevert. Voer dit uit na het instellen van de sleutels en het verifiëren van het
          domein (SPF/DKIM).
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-wrap items-end gap-3">
          <label className="flex-1 space-y-1.5">
            <span className="text-sm font-medium">Ontvanger</span>
            <Input
              type="email"
              inputMode="email"
              autoComplete="off"
              placeholder="jij@voorbeeld.nl"
              value={recipient}
              onChange={(e) => setRecipient(e.target.value)}
              disabled={pending}
            />
          </label>
          <Button variant="secondary" size="sm" onClick={run} disabled={!canSend}>
            {pending ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
                Bezig…
              </>
            ) : (
              "Testmail versturen"
            )}
          </Button>
        </div>

        {error ? (
          <p className="flex items-center gap-2 text-sm text-danger">
            <XCircle className="h-4 w-4 shrink-0" aria-hidden />
            {error}
          </p>
        ) : report ? (
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant={report.delivered ? "success" : report.ok ? "warning" : "danger"}>
                {report.delivered
                  ? "Verzonden"
                  : report.ok
                    ? "Geen kanaal actief"
                    : "Verzending mislukt"}
              </Badge>
              <span className="text-sm text-muted-foreground">
                driver <span className="font-mono text-xs">{report.driverMode}</span>
              </span>
            </div>
            <p className="flex items-start gap-2 text-sm">
              {report.delivered ? (
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-success" aria-hidden />
              ) : (
                <XCircle
                  className={`mt-0.5 h-4 w-4 shrink-0 ${report.ok ? "text-warning" : "text-danger"}`}
                  aria-hidden
                />
              )}
              <span className="min-w-0 flex-1 text-muted-foreground">
                {report.delivered ? (
                  <>
                    Testmail verstuurd naar{" "}
                    <span className="font-medium text-foreground">{report.recipient}</span>.
                    Controleer de inbox (en de spam-map) om de aflevering te bevestigen.
                  </>
                ) : (
                  (report.detail ?? "Er is niets verzonden.")
                )}
              </span>
            </p>
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">
            Nog niet uitgevoerd. Vul een ontvanger in en verstuur een testmail om de
            e-mailverbinding te controleren.
          </p>
        )}
      </CardContent>
    </Card>
  );
}
