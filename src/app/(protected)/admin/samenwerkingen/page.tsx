import { type Metadata } from "next";
import Link from "next/link";
import { Handshake } from "lucide-react";
import { requireRole } from "@/lib/authz";
import { prisma } from "@/lib/db";
import { assessCollaborationDba, jobDbaIndicators, DBA_LEVEL_LABEL } from "@/lib/dba-monitor";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { PageHeader } from "@/components/ui/page-header";
import { formatDateShortNl } from "@/lib/format-date";
import { plural } from "@/lib/plural";

export const metadata: Metadata = { title: "Samenwerkingen overzicht · ZZP Platform" };

const STATUS_LABEL: Record<
  string,
  { label: string; variant: "muted" | "warning" | "success" | "danger" | "default" }
> = {
  PROPOSED: { label: "Voorgesteld", variant: "warning" },
  ACTIVE: { label: "Actief", variant: "success" },
  COMPLETED: { label: "Afgerond", variant: "muted" },
  CANCELLED: { label: "Geannuleerd", variant: "danger" },
};

const DBA_VARIANT: Record<string, "muted" | "warning" | "danger"> = {
  LAAG: "muted",
  VERHOOGD: "warning",
  HOOG: "danger",
};

function fmt(d: Date | null | undefined) {
  return d ? formatDateShortNl(d) : "—";
}

export default async function AdminSamenwerkingenPage() {
  await requireRole("ADMIN");

  const collaborations = await prisma.collaboration.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      job: {
        select: {
          id: true,
          title: true,
          dbaDirectSupervision: true,
          dbaEmbedded: true,
          dbaFixedSchedule: true,
        },
      },
      company: { select: { name: true } },
      freelancer: { select: { user: { select: { name: true } } } },
      performances: { select: { status: true } },
      invoices: { where: { lifecycleStatus: { not: null } }, select: { lifecycleStatus: true } },
    },
  });

  const now = new Date();

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <PageHeader
        title="Samenwerkingen"
        description="Overzicht van alle samenwerkingen — contract tot betaling. Klik om naar het werkproces te gaan."
      />

      {collaborations.length === 0 ? (
        <Card>
          <EmptyState
            icon={Handshake}
            title="Geen samenwerkingen"
            description="Er zijn nog geen samenwerkingen aangemaakt."
          />
        </Card>
      ) : (
        <div className="space-y-2">
          {collaborations.map((c) => {
            const st = STATUS_LABEL[c.status] ?? { label: c.status, variant: "muted" as const };
            const dba = assessCollaborationDba(
              { collaborationId: c.id, startDate: c.startDate, ...jobDbaIndicators(c.job) },
              now,
            );
            const hasDispute = !!c.disputedAt;
            const pendingPerf = c.performances.filter((p) => p.status === "SUBMITTED").length;
            const pendingInv = c.invoices.filter((i) => i.lifecycleStatus === "SUBMITTED").length;
            const paidInv = c.invoices.filter((i) =>
              ["PAID", "PROCESSED"].includes(i.lifecycleStatus ?? ""),
            ).length;

            return (
              <Card key={c.id} className="card-interactive">
                <CardContent className="py-3">
                  <Link
                    href={`/samenwerkingen/${c.id}`}
                    className="block space-y-2 hover:no-underline"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex min-w-0 flex-wrap items-center gap-2">
                        <span className="truncate font-medium">{c.job.title}</span>
                        <Badge variant={st.variant}>{st.label}</Badge>
                        {hasDispute && <Badge variant="danger">Dispuut</Badge>}
                      </div>
                      <span className="text-xs text-muted-foreground">{fmt(c.createdAt)}</span>
                    </div>

                    <p className="text-sm text-muted-foreground">
                      {c.freelancer.user.name} ↔ {c.company.name}
                    </p>

                    <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                      {pendingPerf > 0 && (
                        <span className="text-warning">
                          {plural(pendingPerf, "prestatie", "prestaties")}{" "}
                          {pendingPerf === 1 ? "wacht" : "wachten"} op goedkeuring
                        </span>
                      )}
                      {pendingInv > 0 && (
                        <span className="text-warning">
                          {pendingInv} factuur/facturen wachten op goedkeuring
                        </span>
                      )}
                      {paidInv > 0 && <span>{paidInv} betaalde factuur/facturen</span>}
                      {dba.level !== "LAAG" && (
                        <Badge variant={DBA_VARIANT[dba.level] ?? "muted"}>
                          DBA {DBA_LEVEL_LABEL[dba.level]}
                        </Badge>
                      )}
                      {c.startDate && <span>Gestart: {fmt(c.startDate)}</span>}
                    </div>
                  </Link>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
