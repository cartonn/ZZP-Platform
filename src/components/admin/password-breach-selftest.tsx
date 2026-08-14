"use client";

import { useState, useTransition } from "react";
import { CheckCircle2, Loader2, MinusCircle, XCircle } from "lucide-react";
import { runPasswordBreachSelfTestAction } from "@/app/(protected)/admin/systeemstatus/actions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { PasswordBreachSelfTestReport } from "@/lib/services/password-breach-selftest";

// Admin-only connectiviteitszelftest voor de gelekt-wachtwoord-controle (HIBP "Pwned Passwords").
// Haalt op verzoek één bekend-gelekt test-wachtwoord door de geconfigureerde controle — k-anoniem,
// alleen een SHA-1-prefix verlaat de server. Dat bewijst zowel bereikbaarheid als dat detectie écht
// werkt. Server-side waarheid: de knop triggert alleen de server-actie, die de authz-keten +
// rate-limit + audit afhandelt. Staat de controle op de demo (noop), dan wordt dat eerlijk als
// "niets getest" gemeld (geen vals groen vinkje).

export function PasswordBreachSelfTest({ configured }: { configured: boolean }) {
  const [pending, startTransition] = useTransition();
  const [report, setReport] = useState<PasswordBreachSelfTestReport | null>(null);
  const [error, setError] = useState<string | null>(null);

  const run = () => {
    setError(null);
    startTransition(async () => {
      const result = await runPasswordBreachSelfTestAction();
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
          <CardTitle>Gelekt-wachtwoord-zelftest</CardTitle>
          <p className="mt-1 text-sm text-muted-foreground">
            Haalt één bekend-gelekt test-wachtwoord door de geconfigureerde controle (Have I Been
            Pwned, k-anoniem) en bevestigt dat de koppeling bereikbaar is én daadwerkelijk
            detecteert. Nodig omdat de controle <span className="font-mono text-xs">fail-open</span>{" "}
            is: valt HIBP stil weg, dan worden nieuwe wachtwoorden niet meer gecontroleerd. Voer dit
            uit na het zetten van{" "}
            <span className="font-mono text-xs">PASSWORD_BREACH_CHECK=hibp</span>.
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
            Geen gelekt-wachtwoord-controle geconfigureerd (PASSWORD_BREACH_CHECK ontbreekt) — er is
            niets te testen.
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
                {!report.active ? "Geen controle actief" : report.ok ? "Bereikbaar" : "Aandacht"}
              </Badge>
              <span className="font-mono text-xs text-muted-foreground">{report.driverMode}</span>
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
            Nog niet uitgevoerd. Start de zelftest om de gelekt-wachtwoord-controle te controleren.
          </p>
        )}
      </CardContent>
    </Card>
  );
}
