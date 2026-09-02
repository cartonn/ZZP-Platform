import { type Metadata } from "next";
import Link from "next/link";
import { Bookmark, Check, ChevronRight, Clock, MapPin } from "lucide-react";
import { requireRole } from "@/lib/authz";
import { prisma } from "@/lib/db";
import { partitionSavedJobs, type SavedJobItem } from "@/lib/saved-jobs";
import {
  countUnactedSavedJobs,
  summarizeSavedJobAction,
  type SavedJobAction,
} from "@/lib/saved-jobs-nudge";
import { type JobStatus } from "@/lib/enums";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { PageHeader } from "@/components/ui/page-header";
import { Badge } from "@/components/ui/badge";
import { JobStatusBadge } from "@/components/jobs/job-status-badge";
import { SaveJobButton } from "@/components/jobs/save-job-button";
import { ClearUnavailableButton } from "@/components/jobs/clear-unavailable-button";
import { formatDateShortNl } from "@/lib/format-date";
import { plural } from "@/lib/plural";
import { getTranslator, type Translator } from "@/lib/i18n/server";

export const metadata: Metadata = { title: "Opgeslagen · Handslag" };

/** Korte, urgente aftel-label voor een bewaarde opdracht waarvan de start nadert. */
function startSoonLabel(daysUntilStart: number | null, t: Translator): string {
  if (daysUntilStart === null || daysUntilStart <= 0) return t("Start vandaag");
  if (daysUntilStart === 1) return t("Start morgen");
  return `${t("Start over")} ${daysUntilStart} ${t("dagen")}`;
}

export default async function OpgeslagenPage() {
  const actor = await requireRole("FREELANCER");
  const { t } = await getTranslator();

  const profile = await prisma.freelancerProfile.findUnique({
    where: { userId: actor.id },
    select: { id: true },
  });

  if (!profile) {
    return (
      <div className="space-y-6">
        <PageHeader
          eyebrow="Opdrachten"
          title={t("Opgeslagen")}
          description={t("Opdrachten die je hebt bewaard.")}
        />
        <Card>
          <EmptyState
            icon={Bookmark}
            title={t("Eerst een profiel")}
            description={t("Rond je ZZP'er-profiel af om opdrachten te kunnen bewaren.")}
            action={{ label: t("Naar profiel"), href: "/profiel/bewerken" }}
          />
        </Card>
      </div>
    );
  }

  const rows = await prisma.savedJob.findMany({
    where: { freelancerProfileId: profile.id },
    take: 200,
    orderBy: { createdAt: "desc" },
    include: {
      job: {
        select: {
          id: true,
          title: true,
          status: true,
          location: true,
          startDate: true,
          company: { select: { name: true } },
        },
      },
    },
  });

  const items: (SavedJobItem & { location: string | null; startDate: Date | null })[] = rows.map(
    (r) => ({
      jobId: r.job.id,
      title: r.job.title,
      companyName: r.job.company.name,
      status: r.job.status as JobStatus,
      savedAt: r.createdAt,
      location: r.job.location,
      startDate: r.job.startDate,
    }),
  );
  const { open, unavailable } = partitionSavedJobs(items);

  // Voor de nog-open bewaarde opdrachten: op welke heeft de ZZP'er al gereageerd? Eén begrensde
  // query op de eigen reacties (composite index [freelancerId, createdAt]); server is de waarheid.
  const now = new Date();
  const openJobIds = open.map((item) => item.jobId);
  const appliedJobIds = new Set<string>(
    openJobIds.length === 0
      ? []
      : // unbounded-allow: begrensd door jobId in openJobIds (afgeleid uit savedJob take:200)
        (
          await prisma.application.findMany({
            where: { freelancerId: profile.id, jobId: { in: openJobIds } },
            select: { jobId: true },
          })
        ).map((a) => a.jobId),
  );
  const actionByJobId = new Map<string, SavedJobAction>(
    open.map((item) => [
      item.jobId,
      summarizeSavedJobAction(
        { hasApplied: appliedJobIds.has(item.jobId), startDate: item.startDate },
        now,
      ),
    ]),
  );
  const unactedCount = countUnactedSavedJobs([...actionByJobId.values()]);

  return (
    <div className="space-y-6">
      <PageHeader
        title={t("Opgeslagen")}
        description={t("Opdrachten die je hebt bewaard om er later op terug te komen.")}
      />

      {items.length === 0 ? (
        <Card>
          <EmptyState
            icon={Bookmark}
            title={t("Nog niets bewaard")}
            description={t(
              "Bewaar een opdracht via de knop “Bewaren” op de opdracht om er hier op terug te komen.",
            )}
            action={{ label: t("Opdrachten bekijken"), href: "/opdrachten" }}
          />
        </Card>
      ) : (
        <>
          {open.length > 0 && (
            <section className="space-y-2">
              <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1">
                <h2 className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  {t("Nog open")} ({open.length})
                </h2>
                {unactedCount > 0 && (
                  <p className="text-xs text-muted-foreground">
                    {unactedCount === 1
                      ? t("1 opdracht wacht nog op je reactie")
                      : `${unactedCount} ${t("opdrachten wachten nog op je reactie")}`}
                  </p>
                )}
              </div>
              <div className="divide-y divide-border overflow-hidden rounded-lg border border-border bg-card shadow-sm">
                {open.map((item) => {
                  const action = actionByJobId.get(item.jobId);
                  return (
                    <div
                      key={item.jobId}
                      className="flex items-center justify-between gap-4 px-5 py-3.5"
                    >
                      <Link href={`/opdrachten/${item.jobId}`} className="min-w-0 flex-1">
                        <p className="truncate font-medium">{item.title}</p>
                        <p className="metadata-row mt-0.5">
                          <span className="font-medium text-foreground/70">{item.companyName}</span>
                          {item.location && (
                            <span className="inline-flex items-center gap-1">
                              <MapPin className="size-3" aria-hidden /> {item.location}
                            </span>
                          )}
                          <span>
                            {t("Bewaard")} {formatDateShortNl(item.savedAt)}
                          </span>
                        </p>
                      </Link>
                      <div className="flex shrink-0 items-center gap-2">
                        {action?.state === "start_soon" && (
                          <Badge variant="warning" className="gap-1">
                            <Clock className="size-3" aria-hidden />
                            {startSoonLabel(action.daysUntilStart, t)}
                          </Badge>
                        )}
                        {action?.state === "open" && (
                          <Badge variant="muted">{t("Nog niet gereageerd")}</Badge>
                        )}
                        {action?.state === "applied" && (
                          <Badge variant="muted" className="gap-1">
                            <Check className="size-3" aria-hidden />
                            {t("Gereageerd")}
                          </Badge>
                        )}
                        <SaveJobButton jobId={item.jobId} saved />
                        <ChevronRight className="size-4 text-muted-foreground" aria-hidden />
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>
          )}

          {unavailable.length > 0 && (
            <section className="space-y-2">
              <div className="flex items-center justify-between gap-3">
                <h2 className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  {t("Niet meer beschikbaar")} ({unavailable.length})
                </h2>
                <ClearUnavailableButton />
              </div>
              <p className="text-xs text-muted-foreground">
                {plural(unavailable.length, t("opdracht is"), t("opdrachten zijn"))}{" "}
                {t("gesloten of teruggetrokken. Je kunt er niet meer op reageren.")}
              </p>
              <div className="divide-y divide-border overflow-hidden rounded-lg border border-border bg-card shadow-sm">
                {unavailable.map((item) => (
                  <div
                    key={item.jobId}
                    className="flex items-center justify-between gap-4 px-5 py-3.5"
                  >
                    <div className="min-w-0">
                      <p className="truncate font-medium text-muted-foreground">{item.title}</p>
                      <p className="metadata-row mt-0.5">
                        <span>{item.companyName}</span>
                        <span>
                          {t("Bewaard")} {formatDateShortNl(item.savedAt)}
                        </span>
                      </p>
                    </div>
                    <div className="flex shrink-0 items-center gap-2">
                      <JobStatusBadge status={item.status} />
                      <SaveJobButton jobId={item.jobId} saved />
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}
        </>
      )}
    </div>
  );
}
