"use client";

import { useState, useTransition } from "react";
import { CheckCircle2, Loader2, XCircle } from "lucide-react";
import { runDbSelfTestAction } from "@/app/(protected)/admin/systeemstatus/actions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { DbProvider, DbSelfTestReport } from "@/lib/services/db-selftest";

// Admin-only connectiviteits-/schema-zelftest voor de databank. Draait op verzoek (geen
// per-request-I/O op de pagina) een lichte read-only round-trip (SELECT 1 + bestaanscheck op
// kern-tabellen) tegen de live databank en toont het resultaat per stap, plus provider, latency en
// de pool-samenvatting. Server-side waarheid: de knop triggert alleen de server-actie, die de
// authz-keten + rate-limit + audit afhandelt. De uitvoer bevat nooit de DATABASE_URL of secrets.

const PROVIDER_LABELS: Record<DbProvider, string> = {
  postgresql: "PostgreSQL",
  sqlite: "SQLite",
  unknown: "onbekend",
};

function poolSummary(pool: DbSelfTestReport["pool"]): string {
  const parts: string[] = [];
  if (pool.connectionLimit !== undefined) parts.push(`limiet ${pool.connectionLimit}`);
  if (pool.poolTimeout !== undefined) parts.push(`timeout ${pool.poolTimeout}s`);
  if (pool.pgbouncer) parts.push("pgbouncer");
  return parts.length ? parts.join(" · ") : "Prisma-standaard";
}

export function DbSelfTest({ provider }: { provider: DbProvider }) {
  const [pending, startTransition] = useTransition();
  const [report, setReport] = useState<DbSelfTestReport | null>(null);
  const [error, setError] = useState<string | null>(null);

  const run = () => {
    setError(null);
    startTransition(async () => {
      const result = await runDbSelfTestAction();
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
          <CardTitle>Database-zelftest</CardTitle>
          <p className="mt-1 text-sm text-muted-foreground">
            Doet een lichte read-only round-trip tegen de databank (provider{" "}
            <span className="font-mono text-xs">{PROVIDER_LABELS[provider]}</span>) om te bevestigen
            dat de verbinding werkt en dat het schema/de migratie is toegepast. Voer dit uit na het
            omzetten naar productie-Postgres.
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
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant={report.ok ? "success" : "danger"}>
                {report.ok ? "Database werkt" : "Database faalt"}
              </Badge>
              <span className="text-sm text-muted-foreground">
                provider{" "}
                <span className="font-mono text-xs">{PROVIDER_LABELS[report.provider]}</span>
                {report.latencyMs !== undefined ? (
                  <>
                    {" · "}round-trip{" "}
                    <span className="font-mono text-xs">{report.latencyMs} ms</span>
                  </>
                ) : null}
                {" · "}pool <span className="font-mono text-xs">{poolSummary(report.pool)}</span>
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
            Nog niet uitgevoerd. Start de zelftest om de databankverbinding te controleren.
          </p>
        )}
      </CardContent>
    </Card>
  );
}
