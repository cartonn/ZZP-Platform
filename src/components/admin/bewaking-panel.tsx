import { ShieldCheck, Route } from "lucide-react";
import { prisma } from "@/lib/db";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { type IncidentSeverity, type IncidentStatus, type IncidentSource } from "@/lib/enums";
import { routingDiagnostics } from "@/lib/services/routing";
import { formatDateTimeNl } from "@/lib/format-date";
import { acknowledgeIncident, resolveIncident } from "@/app/(protected)/admin/bewaking/actions";

const SEVERITY_LABEL: Record<IncidentSeverity, string> = {
  INFO: "Info",
  WARN: "Waarschuwing",
  CRITICAL: "Kritiek",
};
const SEVERITY_VARIANT: Record<IncidentSeverity, "default" | "warning" | "danger"> = {
  INFO: "default",
  WARN: "warning",
  CRITICAL: "danger",
};
const STATUS_LABEL: Record<IncidentStatus, string> = {
  OPEN: "Open",
  ACKNOWLEDGED: "In behandeling",
  RESOLVED: "Opgelost",
};
const SOURCE_LABEL: Record<IncidentSource, string> = {
  UPTIME: "Beschikbaarheid",
  ERROR: "Fouten",
  CVE: "Kwetsbaarheid",
  AUTH: "Beveiliging",
};

/** Aantal openstaande (niet-opgeloste) signalen — voor de subtitel van route/hub. */
export async function countOpenIncidents(): Promise<number> {
  return prisma.healthIncident.count({ where: { status: { not: "RESOLVED" } } });
}

/**
 * Platform-bewaking-paneel: beveiligings- en gezondheidssignalen (uit de audit-log) plus de
 * reistijd-routing-diagnostiek. Server-side waarheid — haalt zijn eigen begrensde set op. Rendert
 * geen eigen paginakop; de route en de hub leveren de titel.
 */
export async function BewakingPanel() {
  const [incidents, routing] = await Promise.all([
    prisma.healthIncident.findMany({
      orderBy: [{ status: "asc" }, { createdAt: "desc" }],
      take: 100,
    }),
    routingDiagnostics(),
  ]);

  return (
    <div className="space-y-6">
      <Card>
        <CardContent className="space-y-3 py-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="flex items-center gap-2 text-sm font-medium">
              <Route className="size-4 text-muted-foreground" />
              Reistijd-routing
            </span>
            {routing.active ? (
              <Badge variant="success">Actief</Badge>
            ) : routing.provider === "geoapify" ? (
              <Badge variant="danger">Provider zonder sleutel</Badge>
            ) : (
              <Badge variant="default">Offline (schatting)</Badge>
            )}
          </div>
          <dl className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm sm:grid-cols-4">
            <div>
              <dt className="text-xs text-muted-foreground">Provider</dt>
              <dd className="font-medium">
                {routing.provider === "geoapify" ? "Geoapify" : "Offline"}
              </dd>
            </div>
            <div>
              <dt className="text-xs text-muted-foreground">Sleutel</dt>
              <dd className="font-medium">{routing.keyConfigured ? "Geconfigureerd" : "Geen"}</dd>
            </div>
            <div>
              <dt className="text-xs text-muted-foreground">Adressen gecachet</dt>
              <dd className="font-medium tabular-nums">{routing.geocodeCacheCount}</dd>
            </div>
            <div>
              <dt className="text-xs text-muted-foreground">Routes gecachet</dt>
              <dd className="font-medium tabular-nums">{routing.routeCacheCount}</dd>
            </div>
          </dl>
          <p className="text-xs text-muted-foreground">
            {routing.provider === "geoapify"
              ? "Echte reistijden via de externe provider, met lokale cache. De API-sleutel staat alleen in de serveromgeving en wordt hier nooit getoond."
              : "Geen externe provider geconfigureerd; reistijd valt terug op de deterministische plaatsnaam-schatting."}
            {routing.lastRouteAt
              ? ` Laatste route opgehaald op ${formatDateTimeNl(routing.lastRouteAt)}.`
              : ""}
          </p>
        </CardContent>
      </Card>

      {incidents.length === 0 ? (
        <Card>
          <EmptyState
            icon={ShieldCheck}
            title="Geen signalen"
            description="De bewaking draait op een schema en scant op anomalieën zoals brute-force-pogingen en ongebruikelijke rolwijzigingen. Verschijnt er iets, dan staat het hier."
          />
        </Card>
      ) : (
        <div className="space-y-3">
          {incidents.map((i) => {
            const severity = i.severity as IncidentSeverity;
            const status = i.status as IncidentStatus;
            const resolved = status === "RESOLVED";
            return (
              <Card key={i.id} className={resolved ? "opacity-70" : ""}>
                <CardContent className="space-y-2 py-4">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="flex items-center gap-2 text-sm font-medium">
                      <Badge variant={SEVERITY_VARIANT[severity]}>{SEVERITY_LABEL[severity]}</Badge>
                      <span className="text-xs text-muted-foreground">
                        {SOURCE_LABEL[i.source as IncidentSource]}
                      </span>
                    </span>
                    <Badge variant={resolved ? "success" : "default"}>{STATUS_LABEL[status]}</Badge>
                  </div>
                  <p className="text-sm">{i.summary}</p>
                  <p className="text-xs text-muted-foreground">
                    {formatDateTimeNl(i.createdAt)} · {i.code}
                  </p>
                  {!resolved && (
                    <div className="flex flex-wrap gap-2 pt-1">
                      {status === "OPEN" && (
                        <form action={acknowledgeIncident.bind(null, i.id)}>
                          <Button type="submit" variant="secondary" size="sm">
                            In behandeling nemen
                          </Button>
                        </form>
                      )}
                      <form action={resolveIncident.bind(null, i.id)}>
                        <Button type="submit" size="sm">
                          Markeer als opgelost
                        </Button>
                      </form>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
