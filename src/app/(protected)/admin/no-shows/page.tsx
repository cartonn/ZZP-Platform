import { type Metadata } from "next";
import Link from "next/link";
import { UserX } from "lucide-react";
import { requireRole } from "@/lib/authz";
import { prisma } from "@/lib/db";
import { NO_SHOW_LIMIT, noShowStanding } from "@/lib/no-show";
import { type NoShowVerdict } from "@/lib/enums";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { PageHeader } from "@/components/ui/page-header";
import { formatDateShortNl } from "@/lib/format-date";
import { setUserStatus } from "@/app/(protected)/admin/gebruikers/actions";
import { judgeNoShowReport } from "./actions";

export const metadata: Metadata = { title: "No-shows · ZZP Platform" };

const VERDICT_BADGE: Record<
  NoShowVerdict,
  { label: string; variant: "warning" | "success" | "danger" }
> = {
  PENDING: { label: "Te beoordelen", variant: "warning" },
  JUSTIFIED: { label: "Gegrond", variant: "success" },
  UNJUSTIFIED: { label: "Ongegrond", variant: "danger" },
};

export default async function AdminNoShowsPage() {
  await requireRole("ADMIN");

  const [pending, recent, unjustifiedCounts] = await Promise.all([
    prisma.noShowReport.findMany({
      where: { verdict: "PENDING" },
      orderBy: { createdAt: "asc" },
      take: 100,
      include: {
        collaboration: {
          select: {
            id: true,
            job: { select: { title: true } },
            company: { select: { name: true } },
          },
        },
        freelancer: { select: { id: true, user: { select: { name: true } } } },
      },
    }),
    prisma.noShowReport.findMany({
      where: { verdict: { not: "PENDING" } },
      orderBy: { verdictAt: "desc" },
      take: 20,
      include: {
        collaboration: { select: { id: true, job: { select: { title: true } } } },
        freelancer: { select: { user: { select: { name: true } } } },
      },
    }),
    // ZZP'ers op of over de grens: kandidaten voor uitschrijving (handmatige adminbeslissing).
    prisma.noShowReport.groupBy({
      by: ["freelancerProfileId"],
      where: { verdict: "UNJUSTIFIED" },
      _count: { _all: true },
      having: { freelancerProfileId: { _count: { gte: NO_SHOW_LIMIT } } },
    }),
  ]);

  const atLimitProfiles =
    unjustifiedCounts.length > 0
      ? await prisma.freelancerProfile.findMany({
          where: { id: { in: unjustifiedCounts.map((r) => r.freelancerProfileId) } },
          select: { id: true, user: { select: { id: true, name: true, status: true } } },
          take: 100,
        })
      : [];
  const countByProfile = new Map(
    unjustifiedCounts.map((r) => [r.freelancerProfileId, r._count._all]),
  );

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <PageHeader
        title="No-shows"
        description={`Meldingen van niet-verschenen ZZP'ers. Beoordeel of de reden gegrond is — alleen ongegronde no-shows tellen mee; bij ${NO_SHOW_LIMIT} volgt uitschrijving.`}
      />

      {/* Grens bereikt: uitschrijven is een handmatige adminbeslissing (nooit automatisch). */}
      {atLimitProfiles.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Grens bereikt — uitschrijving beoordelen
          </h2>
          {atLimitProfiles.map((p) => {
            const standing = noShowStanding(countByProfile.get(p.id) ?? 0);
            const suspended = p.user.status === "SUSPENDED";
            return (
              <Card key={p.id}>
                <CardContent className="flex flex-wrap items-center justify-between gap-3 py-3">
                  <div className="min-w-0">
                    <p className="font-medium">{p.user.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {standing.unjustified} ongegronde no-shows (grens: {NO_SHOW_LIMIT})
                    </p>
                  </div>
                  {suspended ? (
                    <Badge variant="muted">Al geschorst</Badge>
                  ) : (
                    <form action={setUserStatus.bind(null, p.user.id, "SUSPENDED")}>
                      <Button type="submit" size="sm" variant="danger">
                        Schrijf uit (schors account)
                      </Button>
                    </form>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Te beoordelen meldingen */}
      {pending.length === 0 ? (
        <Card>
          <EmptyState
            icon={UserX}
            title="Geen openstaande no-show-meldingen"
            description="Nieuwe meldingen van opdrachtgevers en franchisers verschijnen hier ter beoordeling."
          />
        </Card>
      ) : (
        <div className="space-y-3">
          <h2 className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Te beoordelen ({pending.length})
          </h2>
          {pending.map((r) => (
            <Card key={r.id}>
              <CardContent className="space-y-2 py-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="font-medium">{r.freelancer.user.name}</p>
                  <Badge variant="warning">Te beoordelen</Badge>
                </div>
                <p className="text-sm text-muted-foreground">
                  {r.collaboration.job.title} · {r.collaboration.company.name} · dienst van{" "}
                  {formatDateShortNl(r.occurredOn)} · gemeld op {formatDateShortNl(r.createdAt)}
                </p>
                <p className="text-sm">Reden: {r.reason}</p>
                <div className="flex flex-wrap items-center gap-2 border-t border-border pt-2">
                  <form action={judgeNoShowReport.bind(null, r.id, "JUSTIFIED")}>
                    <Button type="submit" size="sm" variant="secondary">
                      Gegrond (telt niet mee)
                    </Button>
                  </form>
                  <form action={judgeNoShowReport.bind(null, r.id, "UNJUSTIFIED")}>
                    <Button type="submit" size="sm" variant="destructive">
                      Ongegrond (telt mee)
                    </Button>
                  </form>
                  <Link
                    href={`/samenwerkingen/${r.collaboration.id}`}
                    className="ml-auto text-sm text-muted-foreground underline-offset-4 hover:underline"
                  >
                    Werkproces →
                  </Link>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Recente oordelen */}
      {recent.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Recent beoordeeld
          </h2>
          <div className="divide-y divide-border overflow-hidden rounded-lg border border-border bg-card">
            {recent.map((r) => {
              const badge = VERDICT_BADGE[r.verdict as NoShowVerdict];
              return (
                <div key={r.id} className="flex items-start justify-between gap-3 p-3">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">
                      {r.freelancer.user.name} · {r.collaboration.job.title}
                    </p>
                    <p className="truncate text-xs text-muted-foreground">
                      {formatDateShortNl(r.occurredOn)} · {r.reason}
                    </p>
                  </div>
                  <div className="flex shrink-0 flex-col items-end gap-1 text-xs text-muted-foreground">
                    <Badge variant={badge.variant}>{badge.label}</Badge>
                    {r.verdictAt && <span>{formatDateShortNl(r.verdictAt)}</span>}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
