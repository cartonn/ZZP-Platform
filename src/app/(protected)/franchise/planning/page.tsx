import { type Metadata } from "next";
import { Users, CalendarDays } from "lucide-react";
import { requireRole } from "@/lib/authz";
import { prisma } from "@/lib/db";
import { tenantScopeWhere } from "@/lib/tenancy";
import {
  buildRosterTimeline,
  CELL_META,
  type TimelineMemberInput,
} from "@/lib/franchise/roster-timeline";
import { PageHeader } from "@/components/ui/page-header";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import {
  RosterTimelineGrid,
  CELL_SWATCH,
  CELL_LEGEND_ORDER,
} from "@/components/franchise/roster-timeline-grid";

export const metadata: Metadata = { title: "Roosterbezetting" };

export default async function FranchisePlanningPage() {
  const actor = await requireRole("FRANCHISER");
  const now = new Date();

  // unbounded-allow: franchise-tenant-scoped freelancers; beheerbaar volume
  const freelancers = await prisma.freelancerProfile.findMany({
    where: tenantScopeWhere(actor),
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      user: { select: { name: true } },
      availabilityWindows: { select: { startDate: true, endDate: true, type: true } },
      // Einddata van de lopende (ACTIVE) plaatsingen — bezetten de horizon-dagen. Tenant-gescopet
      // via de freelancer zelf; per ZZP'er een klein aantal (geen N+1).
      collaborations: { where: { status: "ACTIVE" }, select: { endDate: true } },
    },
  });

  const members: TimelineMemberInput[] = freelancers.map((f) => ({
    id: f.id,
    name: f.user.name ?? "",
    windows: f.availabilityWindows,
    placementEnds: f.collaborations.map((c) => c.endDate),
  }));

  const timeline = buildRosterTimeline(members, now);

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="De cockpit · planning"
        title="Roosterbezetting"
        description="Wie is wanneer beschikbaar — de bezetting van je roster over de komende twee weken in één oogopslag."
        action={
          <Button asChild variant="secondary" size="sm">
            <a href="/franchise/agenda">
              <CalendarDays className="size-4" aria-hidden />
              Agenda (.ics)
            </a>
          </Button>
        }
      />

      {timeline.rows.length === 0 ? (
        <Card>
          <EmptyState
            icon={Users}
            title="Nog geen ZZP'ers in je roster"
            description="Zodra je ZZP'ers in je bemiddeling brengt, zie je hier hun beschikbaarheid dag voor dag."
            action={{ label: "Naar je ZZP'ers", href: "/franchise/zzpers" }}
          />
        </Card>
      ) : (
        <>
          {/* Legenda: de vier celtoestanden met hun kleur — zodat het raster direct leesbaar is. */}
          <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-muted-foreground">
            {CELL_LEGEND_ORDER.map((state) => (
              <span key={state} className="inline-flex items-center gap-1.5">
                <span className={`size-3 shrink-0 rounded-sm ${CELL_SWATCH[state]}`} aria-hidden />
                {CELL_META[state].label}
              </span>
            ))}
          </div>

          <RosterTimelineGrid timeline={timeline} />
        </>
      )}
    </div>
  );
}
