import { type Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { CalendarDays, ChevronRight, MapPin } from "lucide-react";
import { requireActor } from "@/lib/authz";
import { visibleJobsWhere } from "@/lib/tenancy";
import { prisma } from "@/lib/db";
import { scoreJobForFreelancer } from "@/lib/matching";
import { type Weekday, type WorkMode } from "@/lib/enums";
import { buildRosterCalendar } from "@/lib/roster-market";
import { formatDateShortNl } from "@/lib/format-date";
import { plural } from "@/lib/plural";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { PageHeader } from "@/components/ui/page-header";

export const metadata: Metadata = { title: "Rooster · ZZP Platform" };

const WORK_MODE_LABEL: Record<WorkMode, string> = {
  REMOTE: "Remote",
  ONSITE: "Op locatie",
  HYBRID: "Hybride",
};

const WEEKDAY_LABEL: Record<Weekday, string> = {
  MON: "Maandag",
  TUE: "Dinsdag",
  WED: "Woensdag",
  THU: "Donderdag",
  FRI: "Vrijdag",
  SAT: "Zaterdag",
  SUN: "Zondag",
};

export default async function RoosterPage() {
  const actor = await requireActor();

  // Opdrachtgevers hebben niets te zoeken in de diensten-kalender
  if (actor.role === "CLIENT") {
    redirect("/opdrachten");
  }

  // UTC-middernacht van vandaag als startpunt voor de query
  const now = new Date();
  const todayUtc = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));

  // Gepubliceerde opdrachten met startdatum (tenant-zichtbaar), begrensd op 200
  const jobs = await prisma.job.findMany({
    where: {
      status: "PUBLISHED",
      startDate: { gte: todayUtc },
      AND: [visibleJobsWhere(actor)],
    },
    orderBy: { startDate: "asc" },
    take: 200,
    include: {
      company: { select: { name: true } },
      industry: { select: { name: true } },
      skills: true,
      credentialRequirements: true,
    },
  });

  // Freelancer-profiel ophalen voor matchscore + already-applied check
  const profile =
    actor.role === "FREELANCER"
      ? await prisma.freelancerProfile.findUnique({
          where: { userId: actor.id },
          include: {
            skills: { select: { skillId: true } },
            credentials: { select: { type: true, status: true, expiresAt: true } },
          },
        })
      : null;

  // Already-applied set (alleen als er een profiel is)
  const appliedJobIds = new Set<string>();
  if (profile && jobs.length > 0) {
    const jobIds = jobs.map((j) => j.id);
    const applications = await prisma.application.findMany({
      where: { freelancerId: profile.id, jobId: { in: jobIds } },
      select: { jobId: true },
      take: 200,
    });
    for (const app of applications) {
      appliedJobIds.add(app.jobId);
    }
  }

  // Bouw de shift-inputs
  const shifts = jobs.map((job) => {
    const matchScore = profile !== null ? scoreJobForFreelancer(job, profile).score : null;
    return {
      jobId: job.id,
      title: job.title,
      companyName: job.company.name,
      startDate: job.startDate!,
      rateMin: job.rateMin,
      rateMax: job.rateMax,
      location: job.location,
      workMode: job.workMode,
      matchScore,
      alreadyApplied: appliedJobIds.has(job.id),
    };
  });

  const calendar = buildRosterCalendar(shifts, now);

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <PageHeader
        title="Rooster"
        description="Open diensten met een startdatum — gegroepeerd per dag."
      />

      {calendar.total === 0 ? (
        <Card>
          <EmptyState
            icon={CalendarDays}
            title="Geen open diensten"
            description="Er staan nu geen diensten met een startdatum open. Kijk bij Opdrachten voor al het werk."
            action={{ label: "Naar opdrachten", href: "/opdrachten" }}
          />
        </Card>
      ) : (
        <div className="space-y-8">
          {calendar.days.map((day) => (
            <section key={day.date.toISOString()} aria-label={WEEKDAY_LABEL[day.weekday]}>
              {/* Dag-kop */}
              <div className="mb-3 flex items-center gap-2">
                <h2 className="text-sm font-semibold tracking-tight">
                  {WEEKDAY_LABEL[day.weekday]}, {formatDateShortNl(day.date)}
                </h2>
                {day.isToday && (
                  <Badge variant="accent" className="text-xs">
                    Vandaag
                  </Badge>
                )}
              </div>

              {/* Diensten-lijst */}
              <div className="divide-y divide-border overflow-hidden rounded-lg border border-border bg-card shadow-sm">
                {day.shifts.map((shift) => (
                  <Link
                    key={shift.jobId}
                    href={`/opdrachten/${shift.jobId}`}
                    className="card-interactive flex items-center justify-between gap-4 px-5 py-3.5"
                  >
                    <div className="min-w-0">
                      <p className="truncate font-medium">{shift.title}</p>
                      <p className="metadata-row mt-0.5">
                        <span className="font-medium text-foreground/70">{shift.companyName}</span>
                        {shift.location && (
                          <span className="inline-flex items-center gap-1">
                            <MapPin className="size-3" aria-hidden />
                            {shift.location}
                          </span>
                        )}
                        <span>{WORK_MODE_LABEL[shift.workMode as WorkMode]}</span>
                      </p>
                    </div>

                    <div className="flex shrink-0 items-center gap-3">
                      {(shift.rateMin != null || shift.rateMax != null) && (
                        <span className="hidden text-sm tabular-nums text-muted-foreground sm:inline">
                          € {shift.rateMin ?? "?"}
                          {shift.rateMax != null ? `–${shift.rateMax}` : "+"}
                          /uur
                        </span>
                      )}
                      {shift.matchScore !== null && (
                        <Badge variant="accent">Match {shift.matchScore}%</Badge>
                      )}
                      {shift.alreadyApplied && <Badge variant="muted">Gereageerd</Badge>}
                      <ChevronRight className="size-4 text-muted-foreground" aria-hidden />
                    </div>
                  </Link>
                ))}
              </div>
            </section>
          ))}
        </div>
      )}

      {calendar.beyondHorizon > 0 && (
        <p className="text-xs text-muted-foreground">
          Nog {plural(calendar.beyondHorizon, "dienst", "diensten")} verder in de toekomst —{" "}
          <Link href="/opdrachten" className="underline underline-offset-2 hover:text-foreground">
            bekijk Opdrachten
          </Link>
          .
        </p>
      )}
    </div>
  );
}
