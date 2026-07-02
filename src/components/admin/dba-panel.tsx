import Link from "next/link";
import { ShieldCheck } from "lucide-react";
import { loadDbaOverview, summarizeDbaOverview } from "@/lib/dba-overview";
import { DBA_LEVEL_LABEL, DBA_SIGNAL_LEVELS, type DbaSignalLevel } from "@/lib/dba-monitor";
import { DBA_DISCLAIMER } from "@/lib/config";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { withParams } from "@/components/admin/base-path";

const LEVEL_BADGE_VARIANT: Record<DbaSignalLevel, "danger" | "warning" | "muted"> = {
  HOOG: "danger",
  VERHOOGD: "warning",
  LAAG: "muted",
};

/**
 * DBA-monitor-paneel: signalering van mogelijke schijnzelfstandigheid over actieve samenwerkingen.
 * Het niveau-filter komt als prop binnen (de host leest searchParams); de filter-pills wijzen naar
 * `basePath` zodat het paneel zowel op /admin/dba als binnen de toezicht-hub werkt. Rendert geen
 * eigen paginakop.
 */
export async function DbaPanel({ niveau, basePath }: { niveau: string; basePath: string }) {
  const rows = await loadDbaOverview();
  const summary = summarizeDbaOverview(rows);

  const isValidLevel = (v: string): v is DbaSignalLevel =>
    (DBA_SIGNAL_LEVELS as readonly string[]).includes(v);

  const filteredRows =
    niveau && isValidLevel(niveau) ? rows.filter((r) => r.assessment.level === niveau) : rows;

  const disclaimer = rows[0]?.assessment.disclaimer ?? DBA_DISCLAIMER;
  const allActive = !niveau || !isValidLevel(niveau);

  if (rows.length === 0) {
    return (
      <div className="space-y-6">
        <Card>
          <EmptyState
            icon={ShieldCheck}
            title="Geen actieve samenwerkingen"
            description="Er zijn momenteel geen actieve samenwerkingen om te monitoren."
          />
        </Card>
        <p className="text-xs text-muted-foreground">{DBA_DISCLAIMER}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Samenvattingsstrip */}
      <div className="flex flex-wrap items-center gap-2">
        <Link
          href={basePath}
          className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-medium transition-colors ${
            allActive
              ? "border-border bg-foreground text-background"
              : "border-border bg-card text-foreground hover:bg-accent"
          }`}
        >
          Alle ({summary.total})
        </Link>
        {DBA_SIGNAL_LEVELS.map((lvl) => (
          <Link
            key={lvl}
            href={niveau === lvl ? basePath : withParams(basePath, { niveau: lvl })}
            className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-medium transition-colors ${
              niveau === lvl
                ? "border-border bg-foreground text-background"
                : "border-border bg-card text-foreground hover:bg-accent"
            }`}
          >
            {DBA_LEVEL_LABEL[lvl]} ({summary.byLevel[lvl]})
          </Link>
        ))}
      </div>

      {/* Disclaimer */}
      <p className="text-xs text-muted-foreground">{disclaimer}</p>

      {/* Lijst */}
      {filteredRows.length === 0 ? (
        <p className="text-sm text-muted-foreground">Geen samenwerkingen op dit niveau.</p>
      ) : (
        <div className="space-y-3">
          {filteredRows.map((row) => (
            <Card key={row.collaborationId}>
              <CardContent className="space-y-2 py-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="font-medium">{row.jobTitle}</p>
                  <Badge variant={LEVEL_BADGE_VARIANT[row.assessment.level]}>
                    {DBA_LEVEL_LABEL[row.assessment.level]}
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground">
                  {row.freelancerName} ↔ {row.companyName}
                  {row.assessment.durationMonths != null && (
                    <span> · {row.assessment.durationMonths} maanden</span>
                  )}
                </p>
                {row.assessment.signals.length > 0 ? (
                  <ul className="space-y-1">
                    {row.assessment.signals.map((signal) => (
                      <li key={signal.key} className="text-sm text-muted-foreground">
                        {signal.message}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-sm text-muted-foreground">Geen actieve risicosignalen.</p>
                )}
                <Link
                  href={`/samenwerkingen/${row.collaborationId}`}
                  className="inline-flex text-sm font-medium underline underline-offset-4"
                >
                  Open samenwerking →
                </Link>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
