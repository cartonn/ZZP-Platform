import { type Metadata } from "next";
import { ShieldCheck } from "lucide-react";
import { requireRole } from "@/lib/authz";
import { prisma } from "@/lib/db";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { type IncidentSeverity, type IncidentStatus, type IncidentSource } from "@/lib/enums";
import { acknowledgeIncident, resolveIncident } from "./actions";

export const metadata: Metadata = { title: "Platform-bewaking · ZZP Platform" };

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

export default async function BewakingPage() {
  await requireRole("ADMIN");
  const incidents = await prisma.healthIncident.findMany({
    orderBy: [{ status: "asc" }, { createdAt: "desc" }],
    take: 100,
  });
  const open = incidents.filter((i) => i.status !== "RESOLVED");

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <header className="space-y-1">
        <h1 className="text-xl font-semibold tracking-tight">Platform-bewaking</h1>
        <p className="text-sm text-muted-foreground">
          Beveiligings- en gezondheidssignalen, automatisch gedetecteerd uit de audit-log.
          {open.length > 0 ? ` ${open.length} open.` : " Alles rustig."}
        </p>
      </header>

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
                    {i.createdAt.toLocaleString("nl-NL")} · {i.code}
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
