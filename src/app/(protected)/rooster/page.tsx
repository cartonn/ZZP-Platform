import { type Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import {
  BriefcaseBusiness,
  CalendarDays,
  Check,
  ChevronRight,
  CircleAlert,
  MapPin,
  Minus,
} from "lucide-react";
import { requireActor } from "@/lib/authz";
import { visibleJobsWhere } from "@/lib/tenancy";
import { prisma } from "@/lib/db";
import { scoreJobForFreelancer, topGapReason, topPositiveReason } from "@/lib/matching";
import { type Weekday, type WorkMode } from "@/lib/enums";
import { parseWeekdays } from "@/lib/weekdays";
import {
  buildAgenda,
  buildRosterCalendar,
  filterRosterByMinMatch,
  ROSTER_STRONG_MATCH_MIN,
  type BookedCollaborationInput,
} from "@/lib/roster-market";
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

export default async function RoosterPage({
  searchParams,
}: {
  searchParams: Promise<{ match?: string }>;
}) {
  const [actor, { match }] = await Promise.all([requireActor(), searchParams]);

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

  // Eigen geboekte/geplande samenwerkingen van de ZZP'er (PROPOSED/ACTIVE), voor de agenda.
  const collabRows =
    actor.role === "FREELANCER"
      ? await prisma.collaboration.findMany({
          where: { freelancer: { userId: actor.id }, status: { in: ["PROPOSED", "ACTIVE"] } },
          take: 100,
          select: {
            id: true,
            rate: true,
            startDate: true,
            endDate: true,
            weekdays: true,
            job: { select: { title: true } },
            company: { select: { name: true } },
          },
        })
      : [];

  const bookedInputs: BookedCollaborationInput[] = collabRows.map((c) => ({
    collaborationId: c.id,
    jobTitle: c.job.title,
    clientName: c.company.name,
    rate: c.rate,
    startDate: c.startDate,
    endDate: c.endDate,
    weekdays: parseWeekdays(c.weekdays),
  }));

  // Bouw de shift-inputs
  const shifts = jobs.map((job) => {
    const result = profile !== null ? scoreJobForFreelancer(job, profile) : null;
    return {
      jobId: job.id,
      title: job.title,
      companyName: job.company.name,
      startDate: job.startDate!,
      rateMin: job.rateMin,
      rateMax: job.rateMax,
      location: job.location,
      workMode: job.workMode,
      matchScore: result?.score ?? null,
      alreadyApplied: appliedJobIds.has(job.id),
      topReason: result ? topPositiveReason(result.reasons) : null,
      topGap: result ? topGapReason(result.reasons) : null,
    };
  });

  const fullCalendar = buildRosterCalendar(shifts, now);
  // Sterke-match-filter is alleen betekenisvol voor een ZZP'er met een profiel.
  const strongCalendar = filterRosterByMinMatch(fullCalendar, ROSTER_STRONG_MATCH_MIN);
  const showStrongFilter = profile !== null && strongCalendar.total > 0;
  const strongActive = showStrongFilter && match === "sterk";
  const calendar = strongActive ? strongCalendar : fullCalendar;
  // Iemand kan handmatig naar ?match=sterk navigeren terwijl er geen sterke matches zijn; dan
  // valt het filter stil terug op alle diensten. Maak dat expliciet i.p.v. stilzwijgend.
  const requestedStrongButNone =
    match === "sterk" && profile !== null && strongCalendar.total === 0;

  // Agenda over de getoonde open-kalender: het sterke-matchfilter blijft op open diensten van
  // toepassing; geboekte diensten worden altijd getoond.
  const agenda = buildAgenda(calendar, bookedInputs, now);

  return (
    <div className="space-y-6">
      <PageHeader title="Rooster" description="Jouw geplande diensten en open kansen — per dag." />

      {showStrongFilter && (
        <div className="flex flex-wrap gap-1.5">
          {[
            {
              label: "Alle diensten",
              href: "/rooster",
              active: !strongActive,
              count: fullCalendar.total,
            },
            {
              label: "Sterke matches",
              href: "/rooster?match=sterk",
              active: strongActive,
              count: strongCalendar.total,
            },
          ].map((tab) => (
            <Link
              key={tab.label}
              href={tab.href}
              aria-current={tab.active ? "page" : undefined}
              className={[
                "focus-ring inline-flex items-center rounded-md border px-3 py-1 text-sm transition-colors",
                tab.active
                  ? "border-accent-foreground/20 bg-accent text-accent-foreground"
                  : "border-border bg-background text-muted-foreground hover:bg-muted",
              ].join(" ")}
            >
              {tab.label} ({tab.count})
            </Link>
          ))}
        </div>
      )}

      {requestedStrongButNone && (
        <p className="flex items-start gap-1.5 rounded-md border border-border bg-muted/40 px-3 py-2 text-sm text-muted-foreground">
          <CircleAlert className="mt-0.5 size-4 shrink-0" aria-hidden />
          <span>Geen sterke matches op dit moment — hieronder staan alle open diensten.</span>
        </p>
      )}

      {agenda.openTotal === 0 && agenda.bookedTotal === 0 ? (
        <Card>
          <EmptyState
            icon={CalendarDays}
            title="Niets in je rooster"
            description="Je hebt geen geplande diensten en er staan nu geen open diensten met een startdatum. Kijk bij Opdrachten voor al het werk."
            action={{ label: "Naar opdrachten", href: "/opdrachten" }}
          />
        </Card>
      ) : (
        <div className="space-y-8">
          {agenda.days.map((day) => (
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

              <div className="space-y-4">
                {/* Jouw geplande diensten */}
                {day.booked.length > 0 && (
                  <div>
                    <p className="mb-1.5 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                      Jouw diensten
                    </p>
                    <div className="divide-y divide-border overflow-hidden rounded-lg border border-success/30 bg-card shadow-sm">
                      {day.booked.map((entry) => (
                        <Link
                          key={`${entry.collaborationId}-${entry.scheduled}`}
                          href={`/samenwerkingen/${entry.collaborationId}`}
                          className="card-interactive flex items-center justify-between gap-4 px-5 py-3.5"
                        >
                          <div className="flex min-w-0 items-start gap-3">
                            <span className="mt-0.5 inline-flex size-8 shrink-0 items-center justify-center rounded-md bg-success/10 text-success">
                              <BriefcaseBusiness className="size-4" aria-hidden />
                            </span>
                            <div className="min-w-0">
                              <p className="truncate font-medium">{entry.jobTitle}</p>
                              <p className="metadata-row mt-0.5">
                                <span className="font-medium text-foreground/70">
                                  {entry.clientName}
                                </span>
                                {entry.rate != null && (
                                  <span className="tabular-nums">€ {entry.rate}/uur</span>
                                )}
                              </p>
                              {!entry.scheduled && (
                                <p className="mt-1 text-xs text-muted-foreground">
                                  volgens looptijd
                                </p>
                              )}
                            </div>
                          </div>

                          <div className="flex shrink-0 items-center gap-3">
                            <Badge variant="success">Geboekt</Badge>
                            <ChevronRight className="size-4 text-muted-foreground" aria-hidden />
                          </div>
                        </Link>
                      ))}
                    </div>
                  </div>
                )}

                {/* Open diensten */}
                {day.open.length > 0 && (
                  <div>
                    <p className="mb-1.5 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                      Open diensten
                    </p>
                    <div className="divide-y divide-border overflow-hidden rounded-lg border border-border bg-card shadow-sm">
                      {day.open.map((shift) => (
                        <Link
                          key={shift.jobId}
                          href={`/opdrachten/${shift.jobId}`}
                          className="card-interactive flex items-center justify-between gap-4 px-5 py-3.5"
                        >
                          <div className="min-w-0">
                            <p className="truncate font-medium">{shift.title}</p>
                            <p className="metadata-row mt-0.5">
                              <span className="font-medium text-foreground/70">
                                {shift.companyName}
                              </span>
                              {shift.location && (
                                <span className="inline-flex items-center gap-1">
                                  <MapPin className="size-3" aria-hidden />
                                  {shift.location}
                                </span>
                              )}
                              <span>{WORK_MODE_LABEL[shift.workMode as WorkMode]}</span>
                            </p>
                            {(shift.topReason || shift.topGap) && (
                              <p className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs">
                                {shift.topReason && (
                                  <span className="inline-flex items-center gap-1 text-success">
                                    <Check className="size-3 shrink-0" aria-hidden />
                                    {shift.topReason}
                                  </span>
                                )}
                                {shift.topGap && (
                                  <span className="inline-flex items-center gap-1 text-muted-foreground">
                                    <Minus className="size-3 shrink-0" aria-hidden />
                                    {shift.topGap}
                                  </span>
                                )}
                              </p>
                            )}
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
                  </div>
                )}
              </div>
            </section>
          ))}
        </div>
      )}

      {agenda.beyondHorizon > 0 && (
        <p className="text-xs text-muted-foreground">
          Nog {plural(agenda.beyondHorizon, "dienst", "diensten")} verder in de toekomst —{" "}
          <Link href="/opdrachten" className="underline underline-offset-2 hover:text-foreground">
            bekijk Opdrachten
          </Link>
          .
        </p>
      )}
    </div>
  );
}
