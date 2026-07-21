"use client";

import { useState, useTransition } from "react";
import { CheckCircle2, Loader2, MinusCircle, XCircle } from "lucide-react";
import { runSelfTestSweepAction } from "@/app/(protected)/admin/systeemstatus/actions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { SweepEntry, SweepReport } from "@/lib/services/selftest-sweep";

// Admin-only go-live-sweep: draait op verzoek álle actieve, bijwerkingsveilige connectiviteitszelftests
// (opslag, database, rate-limit, verificatie, betaalprovider, upload-scanner, error-monitoring) in één
// klik en toont een geconsolideerd GO/NO-GO plus het resultaat per integratie. Server-side waarheid: de
// knop triggert alleen de server-actie, die de authz-keten + rate-limit + audit afhandelt. Integraties
// op een veilige fallback/demo worden eerlijk als "overgeslagen" gemeld (geen vals groen). Mail zit
// bewust niet in de sweep (vereist een ontvangeradres + verstuurt echte mail) — gebruik daar de losse
// E-mail-zelftest.

function EntryIcon({ status }: { status: SweepEntry["status"] }) {
  if (status === "pass")
    return <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-success" aria-hidden />;
  if (status === "fail")
    return <XCircle className="mt-0.5 h-4 w-4 shrink-0 text-danger" aria-hidden />;
  return <MinusCircle className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" aria-hidden />;
}

const STATUS_LABEL: Record<SweepEntry["status"], string> = {
  pass: "Bereikbaar",
  fail: "Faalt",
  skipped: "Overgeslagen",
};

export function SelfTestSweep() {
  const [pending, startTransition] = useTransition();
  const [report, setReport] = useState<SweepReport | null>(null);
  const [error, setError] = useState<string | null>(null);

  const run = () => {
    setError(null);
    startTransition(async () => {
      const result = await runSelfTestSweepAction();
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
          <CardTitle>Go-live-sweep — alle zelftests</CardTitle>
          <p className="mt-1 text-sm text-muted-foreground">
            Draait in één klik álle actieve connectiviteitszelftests (opslag, database, rate-limit,
            verificatie, betaalprovider, upload-scanner, error-monitoring) en geeft een
            geconsolideerd GO/NO-GO. Integraties op een veilige fallback worden overgeslagen (niets
            getest). De E-mail-zelftest staat apart (vereist een ontvangeradres).
          </p>
        </div>
        <Button variant="secondary" size="sm" onClick={run} disabled={pending}>
          {pending ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
              Bezig…
            </>
          ) : (
            "Alle zelftests draaien"
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
              <Badge variant={report.verdict === "go" ? "success" : "danger"}>
                {report.verdict === "go" ? "GO" : "NO-GO"}
              </Badge>
              <span className="text-sm text-muted-foreground">
                {report.counts.pass} bereikbaar · {report.counts.fail} faalt ·{" "}
                {report.counts.skipped} overgeslagen
                {report.testedCount === 0 ? " (geen enkele integratie geconfigureerd)" : ""}
              </span>
            </div>
            <ul className="space-y-2">
              {report.entries.map((entry) => (
                <li key={entry.key} className="flex items-start gap-2 text-sm">
                  <EntryIcon status={entry.status} />
                  <span className="min-w-0 flex-1">
                    <span className="font-medium">{entry.label}</span>{" "}
                    <span className="text-muted-foreground">
                      — {STATUS_LABEL[entry.status]}
                      {entry.detail ? `: ${entry.detail}` : ""}
                    </span>
                  </span>
                  <span className="shrink-0 font-mono text-xs text-muted-foreground">
                    {entry.mode}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">
            Nog niet uitgevoerd. Start de sweep om alle geconfigureerde integraties in één keer te
            controleren — handig als go-live-poort.
          </p>
        )}
      </CardContent>
    </Card>
  );
}
