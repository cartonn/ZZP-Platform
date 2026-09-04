import { type Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import {
  BriefcaseBusiness,
  Building2,
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
  agendaDayBookingConflict,
  buildAgenda,
  buildRosterCalendar,
  filterRosterByMinMatch,
  formatBookingConflictNotice,
  ROSTER_STRONG_MATCH_MIN,
  summarizeRosterWeek,
  type BookedCollaborationInput,
} from "@/lib/roster-market";
import { formatDateShortNl } from "@/lib/format-date";
import { plural, pluralWord } from "@/lib/plural";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { PageHeader } from "@/components/ui/page-header";
import { AgendaSubscribe } from "@/components/agenda/agenda-subscribe";
import { hasExportableSchedule } from "@/lib/calendar/exportable";
import { agendaFeedPath } from "@/lib/calendar/feed-token";
import { ClaimShift } from "./claim-shift";

export const metadata: Metadata = { title: "Rooster · Handslag" };

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
            industries: { select: { industryId: true } },
          },
        })
      : null;

  // Already-applied set (alleen als er een profiel is)
  const appliedJobIds = new Set<string>();
  if (profile && jobs.length > 0) {
    const jobIds = jobs.map((j) => j.id);
    // Een ingetrokken reactie telt niet als "gereageerd": de ZZP'er kan opnieuw reageren.
    const applications = await prisma.application.findMany({
      where: { freelancerId: profile.id, jobId: { in: jobIds }, status: { not: "WITHDRAWN" } },
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
            status: true,
            rate: true,
            startDate: true,
            endDate: true,
            weekdays: true,
            job: { select: { title: true } },
            company: { select: { name: true } },
          },
        })
      : [];

  // Agenda-export (.ics) tonen zodra er een actieve, geplande samenwerking is — geen dode knop.
  const canExportAgenda = hasExportableSchedule(collabRows);

  // De abonneerlink (feed) is zinvol zodra hij geconfigureerd is: een ZZP'er kan zijn agenda-app
  // vooraf koppelen, ook al staat er nu nog niets gepland. Zo blijft de feed-URL vindbaar i.p.v.
  // pas te verschijnen na de eerste boeking. Alleen voor de ZZP'er zelf.
  const feedPath = actor.role === "FREELANCER" ? agendaFeedPath(actor.id) : null;
  const showAgendaSubscribe = feedPath !== null || canExportAgenda;

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

  // Alleen een ZZP'er met een profiel kan rechtstreeks vanuit de kalender reageren (claimen).
  // ADMIN bekijkt de kalender zonder profiel en zonder reageer-knop.
  const canClaim = profile !== null;

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

  // Beknopte "deze week"-samenvatting: geplande diensten + opdrachtgevers + open kansen in de
  // huidige ISO-week, afgeleid uit de reeds-gebouwde agenda (kan niet driften van wat eronder staat).
  const weekSummary = summarizeRosterWeek(agenda.days, now);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Rooster"
        description="Jouw geplande diensten en open kansen — per dag."
        action={showAgendaSubscribe ? <AgendaSubscribe feedPath={feedPath} /> : undefined}
      />

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
          {(weekSummary.plannedCount > 0 || weekSummary.openCount > 0) && (
            <div className="flex flex-wrap items-center gap-x-6 gap-y-2 rounded-lg border border-border bg-card px-5 py-3 text-sm shadow-sm">
              <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Deze week
              </span>
              <span className="inline-flex items-center gap-1.5">
                <BriefcaseBusiness className="size-4 shrink-0 text-success" aria-hidden />
                <span className="font-medium tabular-nums">{weekSummary.plannedCount}</span>
                <span className="text-muted-foreground">
                  {pluralWord(weekSummary.plannedCount, "geplande dienst", "geplande diensten")}
                </span>
              </span>
              {weekSummary.clientCount > 0 && (
                <span className="inline-flex items-center gap-1.5">
                  <Building2 className="size-4 shrink-0 text-muted-foreground" aria-hidden />
                  <span className="font-medium tabular-nums">{weekSummary.clientCount}</span>
                  <span className="text-muted-foreground">
                    {pluralWord(weekSummary.clientCount, "opdrachtgever", "opdrachtgevers")}
                  </span>
                </span>
              )}
              <span className="inline-flex items-center gap-1.5">
                <CalendarDays className="size-4 shrink-0 text-muted-foreground" aria-hidden />
                <span className="font-medium tabular-nums">{weekSummary.openCount}</span>
                <span className="text-muted-foreground">
                  {pluralWord(weekSummary.openCount, "open kans", "open kansen")}
                </span>
              </span>
            </div>
          )}

          {agenda.days.map((day) => {
            // Dubbele-boeking-signaal: open kans op een dag waarop je al bent ingepland.
            const bookingConflict = agendaDayBookingConflict(day);
            const conflictNotice = bookingConflict
              ? formatBookingConflictNotice(bookingConflict)
              : null;
            return (
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
                      {conflictNotice && (
                        <p className="mb-2 flex items-start gap-1.5 rounded-md border border-warning/40 bg-warning/10 px-3 py-2 text-sm text-warning">
                          <CircleAlert className="mt-0.5 size-4 shrink-0" aria-hidden />
                          <span>{conflictNotice}</span>
                        </p>
                      )}
                      <div className="divide-y divide-border overflow-hidden rounded-lg border border-border bg-card shadow-sm">
                        {day.open.map((shift) => (
                          <div key={shift.jobId} className="px-5 py-3.5">
                            <div className="flex items-center justify-between gap-4">
                              <Link
                                href={`/opdrachten/${shift.jobId}`}
                                className="focus-ring group -m-1 min-w-0 flex-1 rounded-md p-1"
                              >
                                <p className="truncate font-medium group-hover:underline">
                                  {shift.title}
                                </p>
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
                              </Link>

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
                                <Link
                                  href={`/opdrachten/${shift.jobId}`}
                                  aria-label={`Bekijk ${shift.title}`}
                                  className="focus-ring rounded text-muted-foreground hover:text-foreground"
                                >
                                  <ChevronRight className="size-4" aria-hidden />
                                </Link>
                              </div>
                            </div>

                            {canClaim && !shift.alreadyApplied && (
                              <div className="mt-3">
                                <ClaimShift
                                  jobId={shift.jobId}
                                  title={shift.title}
                                  conflictNotice={conflictNotice ?? undefined}
                                />
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </section>
            );
          })}
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
