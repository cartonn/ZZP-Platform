import { type Metadata } from "next";
import Link from "next/link";
import { AlertTriangle, CalendarDays } from "lucide-react";
import { requireRole } from "@/lib/authz";
import { prisma } from "@/lib/db";
import { summarizeAvailability, upcomingWindows } from "@/lib/availability";
import { type AvailabilityWindowType } from "@/lib/enums";
import { detectAvailabilityConflicts } from "@/lib/availability-conflicts";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { PageHeader } from "@/components/ui/page-header";
import { formatDateShortNl } from "@/lib/format-date";
import { selectedAvailability } from "@/lib/availability-status";
import { AvailabilityStatusToggle } from "@/components/beschikbaarheid/availability-status-toggle";
import { AvailabilityForm } from "./availability-form";
import { AvailabilityRows } from "./availability-rows";

export const metadata: Metadata = { title: "Beschikbaarheid · ZZP Platform" };

const fmt = (d: Date) => formatDateShortNl(d);
const toIso = (d: Date) => d.toISOString().slice(0, 10);

export default async function BeschikbaarheidPage() {
  const actor = await requireRole("FREELANCER");
  const profile = await prisma.freelancerProfile.findUnique({
    where: { userId: actor.id },
    select: { id: true, availability: true },
  });
  const [rows, collabRows] = await Promise.all([
    profile
      ? // unbounded-allow: kalenderaggregatie vereist alle vensters van eigenaar
        prisma.availabilityWindow.findMany({
          where: { freelancerProfileId: profile.id },
          orderBy: { startDate: "asc" },
        })
      : Promise.resolve([]),
    profile
      ? // unbounded-allow: eigenaar-scoped lopende samenwerkingen voor conflictdetectie; inherent klein
        prisma.collaboration.findMany({
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
    <div className="space-y-6">
      <PageHeader
        eyebrow="Het weefsel · beschikbaar"
        title="Beschikbaarheid"
        description={
          <>
            Leg je beschikbaarheid vast in periodes.{" "}
            {summary ? `Status: ${summary}.` : "Nog geen inzetbare periode."}
          </>
        }
      />

      {profile && (
        <Card className="space-y-3">
          <div>
            <h2 className="text-sm font-medium text-foreground">Je status voor opdrachtgevers</h2>
            <p className="text-xs text-muted-foreground">
              Zet in één klik of je open staat voor nieuwe opdrachten. Dit is los van je periodes
              hieronder.
            </p>
          </div>
          <AvailabilityStatusToggle current={selectedAvailability(profile.availability)} />
        </Card>
      )}

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
        <AvailabilityRows
          rows={upcoming.map((w) => ({
            id: w.id,
            startLabel: fmt(w.startDate),
            endLabel: fmt(w.endDate),
            startIso: toIso(w.startDate),
            endIso: toIso(w.endDate),
            type: w.type,
            hoursPerWeek: w.hoursPerWeek,
            note: w.note,
          }))}
        />
      )}
    </div>
  );
}
