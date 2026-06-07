import { type Metadata } from "next";
import Link from "next/link";
import { AlertTriangle, CalendarDays, Trash2 } from "lucide-react";
import { requireRole } from "@/lib/authz";
import { prisma } from "@/lib/db";
import { summarizeAvailability, upcomingWindows } from "@/lib/availability";
import { type AvailabilityWindowType } from "@/lib/enums";
import { detectAvailabilityConflicts } from "@/lib/availability-conflicts";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { PageHeader } from "@/components/ui/page-header";
import { formatDateShortNl } from "@/lib/format-date";
import { AvailabilityForm } from "./availability-form";
import { deleteAvailabilityWindow } from "./actions";

export const metadata: Metadata = { title: "Beschikbaarheid · ZZP Platform" };

const TYPE: Record<
  AvailabilityWindowType,
  { label: string; variant: "success" | "warning" | "muted" }
> = {
  AVAILABLE: { label: "Beschikbaar", variant: "success" },
  LIMITED: { label: "Beperkt", variant: "warning" },
  UNAVAILABLE: { label: "Niet beschikbaar", variant: "muted" },
};
const fmt = (d: Date) => formatDateShortNl(d);

export default async function BeschikbaarheidPage() {
  const actor = await requireRole("FREELANCER");
  const profile = await prisma.freelancerProfile.findUnique({
    where: { userId: actor.id },
    select: { id: true },
  });
  const [rows, collabRows] = await Promise.all([
    profile
      ? prisma.availabilityWindow.findMany({
          where: { freelancerProfileId: profile.id },
          orderBy: { startDate: "asc" },
        })
      : Promise.resolve([]),
    profile
      ? prisma.collaboration.findMany({
          where: { freelancerId: profile.id, status: { in: ["PROPOSED", "ACTIVE"] } },
          select: {
            id: true,
            startDate: true,
            endDate: true,
            job: { select: { title: true } },
            company: { select: { name: true } },
          },
        })
      : Promise.resolve([]),
  ]);
  const windows = rows.map((w) => ({ ...w, type: w.type as AvailabilityWindowType }));
  const upcoming = upcomingWindows(windows);
  const summary = summarizeAvailability(windows);

  const conflicts = detectAvailabilityConflicts(
    windows,
    collabRows.map((c) => ({
      id: c.id,
      startDate: c.startDate,
      endDate: c.endDate,
      jobTitle: c.job.title,
      clientName: c.company.name,
    })),
  );

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <PageHeader
        title="Beschikbaarheid"
        description={
          <>
            Leg je beschikbaarheid vast in periodes.{" "}
            {summary ? `Status: ${summary}.` : "Nog geen inzetbare periode."}
          </>
        }
      />

      {conflicts.length > 0 && (
        <section className="rounded-lg border border-danger/30 bg-danger/5 p-4">
          <div className="flex items-center gap-2">
            <AlertTriangle className="size-4 shrink-0 text-danger" aria-hidden />
            <h2 className="text-sm font-medium text-foreground">
              {conflicts.length === 1
                ? "1 periode botst met een lopende samenwerking"
                : `${conflicts.length} periodes botsen met een lopende samenwerking`}
            </h2>
          </div>
          <ul className="mt-3 space-y-2">
            {conflicts.map((c) => (
              <li key={`${c.windowId}-${c.collaborationId}`}>
                <Link
                  href={`/samenwerkingen/${c.collaborationId}`}
                  className="focus-ring flex items-start justify-between gap-3 rounded-md border border-border bg-card px-3 py-2 text-sm transition-colors hover:bg-muted/40"
                >
                  <span className="min-w-0">
                    <span className="block font-medium">
                      Niet beschikbaar {fmt(c.overlapStart)} — {fmt(c.overlapEnd)}
                    </span>
                    <span className="block truncate text-xs text-muted-foreground">
                      Botst met {c.clientName} · {c.jobTitle}
                    </span>
                  </span>
                  <span className="shrink-0 text-xs text-muted-foreground">Bekijk →</span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      <AvailabilityForm />

      {upcoming.length === 0 ? (
        <Card>
          <EmptyState
            icon={CalendarDays}
            title="Nog geen periodes"
            description="Voeg een periode toe om je beschikbaarheid zichtbaar te maken voor opdrachtgevers."
          />
        </Card>
      ) : (
        <div className="divide-y divide-border overflow-hidden rounded-lg border border-border bg-card">
          {upcoming.map((w) => {
            const t = TYPE[w.type];
            return (
              <div key={w.id} className="flex items-center justify-between gap-4 px-4 py-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium tabular-nums">
                      {fmt(w.startDate)} — {fmt(w.endDate)}
                    </p>
                    <Badge variant={t.variant}>{t.label}</Badge>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {w.hoursPerWeek != null ? `${w.hoursPerWeek} u/week` : "uren n.v.t."}
                    {w.note ? ` · ${w.note}` : ""}
                  </p>
                </div>
                <form action={deleteAvailabilityWindow.bind(null, w.id)}>
                  <Button type="submit" variant="ghost" size="sm" aria-label="Periode verwijderen">
                    <Trash2 className="size-3.5" aria-hidden />
                  </Button>
                </form>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
