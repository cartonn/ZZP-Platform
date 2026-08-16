"use client";

import { useState, useTransition } from "react";
import { CheckCircle2, Loader2, MinusCircle, XCircle } from "lucide-react";
import { runSemanticMatcherSelfTestAction } from "@/app/(protected)/admin/systeemstatus/actions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { SemanticMatcherSelfTestReport } from "@/lib/services/semantic-matcher-selftest";

// Admin-only operationele zelftest voor de semantische-matching-driver. Draait op verzoek een READ-ONLY
// operationele probe tegen de geconfigureerde pgvector-driver: is die écht operationeel en levert een
// gelijkenis-round-trip een plausibele uitkomst? Server-side waarheid: de knop triggert alleen de
// server-actie, die de authz-keten + rate-limit + audit afhandelt. Draait matching op de lokale matcher
// (local), dan wordt dat eerlijk als "niets getest" gemeld (geen vals groen vinkje — de lokale matcher
// werkt altijd). Is pgvector geselecteerd maar niet operationeel, dan surfacet dit de stand i.p.v. de
// stille terugval op de lokale fallback.

export function SemanticMatcherSelfTest({ driverMode }: { driverMode: string }) {
  const [pending, startTransition] = useTransition();
  const [report, setReport] = useState<SemanticMatcherSelfTestReport | null>(null);
  const [error, setError] = useState<string | null>(null);

  const run = () => {
    setError(null);
    startTransition(async () => {
      const result = await runSemanticMatcherSelfTestAction();
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
          <CardTitle>Semantische-matching-zelftest</CardTitle>
          <p className="mt-1 text-sm text-muted-foreground">
            Doet een read-only operationele controle tegen de geconfigureerde matcher-driver (driver{" "}
            <span className="font-mono text-xs">{driverMode}</span>) om te bevestigen dat pgvector
            écht operationeel is en een plausibele gelijkenis oplevert. Zolang de
            pgvector-provisioning ontbreekt valt matching terug op de lokale matcher; deze zelftest
            maakt die stand zichtbaar.
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
                  ? "Lokale matcher actief"
                  : report.ok
                    ? "Operationeel"
                    : "Niet operationeel"}
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
                {report.detail ?? (report.ok ? "Operationeel." : "Niet operationeel.")}
              </span>
            </p>
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">
            Nog niet uitgevoerd. Start de zelftest om de semantische-matching-driver te controleren.
          </p>
        )}
      </CardContent>
    </Card>
  );
}
