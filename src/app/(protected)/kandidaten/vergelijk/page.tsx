import { type Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  Award,
  CalendarCheck,
  Download,
  Gauge,
  ShieldCheck,
  Trophy,
  Users,
} from "lucide-react";
import { requireRole } from "@/lib/authz";
import { getTranslator } from "@/lib/i18n/server";
import { TRUST_LEVEL_EXPLANATION } from "@/lib/trust";
import { START_FIT_SHORT_LABEL, START_FIT_VARIANT } from "@/lib/candidate-availability";
import { PROXIMITY_VARIANT, proximityLabel } from "@/lib/candidate-proximity";
import { type CompareCandidate, isRateOverBudget } from "@/lib/candidate-compare";
import { type ApplicantFieldSummary } from "@/lib/applicant-field";
import { getCandidateComparisonForJob } from "@/lib/candidate-compare-data";
import { firstName } from "@/lib/kandidaten-triage";
import { formatDateShortNl } from "@/lib/format-date";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { PageHeader } from "@/components/ui/page-header";
import { ComplianceBadge } from "@/components/compliance-badge";
import { RatingStars } from "@/components/reviews/rating-stars";
import { CandidateHistoryBadge } from "@/components/freelancer/candidate-history-badge";
import { ChooseCandidateButton } from "./choose-candidate-button";

export const metadata: Metadata = { title: "Kandidaten vergelijken · Handslag" };

const TRUST_LABEL = { BASIS: "Basis", DEELS: "Deels", VOLLEDIG: "Volledig" } as const;

export default async function VergelijkKandidatenPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string>>;
}) {
  const actor = await requireRole("CLIENT");
  const { t } = await getTranslator();
  const jobId = (await searchParams).job;
  if (!jobId) notFound();

  const data = await getCandidateComparisonForJob(actor.id, jobId);
  if (!data) notFound();
  const { job, candidates, comparison, ranking, field } = data;

  // Lege cel: geen kille "—" maar een leesbaar, gedempt signaal dat er (nog) geen gegeven is.
  const noData = <span className="text-muted-foreground">{t("Nog geen gegevens")}</span>;

  return (
    <div className="space-y-6 pb-16">
      <div>
        <Link
          href="/kandidaten?status=SHORTLIST"
          className="focus-ring mb-2 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="size-4" aria-hidden /> {t("Terug naar kandidaten")}
        </Link>
        <PageHeader
          eyebrow="De etalage · vergelijken"
          title={t("Kandidaten vergelijken")}
          description={`${t("Reacties op")} "${job.title}" ${t("naast elkaar, met de uitspringer per onderdeel.")}`}
          action={
            candidates.length >= 2 ? (
              <Button asChild size="sm" variant="secondary">
                <a href={`/kandidaten/vergelijk/export?job=${job.id}`}>
                  <Download className="mr-1.5 size-4" aria-hidden />
                  {t("Exporteren")}
                </a>
              </Button>
            ) : undefined
          }
        />
      </div>

      {candidates.length < 2 ? (
        <Card>
          <EmptyState
            icon={Users}
            title={t("Te weinig kandidaten om te vergelijken")}
            description={t(
              "Er zijn minder dan twee actieve reacties op deze opdracht. Vergelijken kan zodra er meerdere kandidaten zijn.",
            )}
          />
        </Card>
      ) : (
        <div className="space-y-4">
          {field && <ApplicantFieldSummaryCard field={field} startDate={job.startDate} t={t} />}
          {ranking.recommendedId && ranking.recommendedName && (
            <div className="flex items-start gap-3 rounded-lg border border-accent bg-accent/40 p-4">
              <Award className="mt-0.5 size-5 shrink-0 text-accent-foreground" aria-hidden />
              <div className="text-sm">
                <p className="font-medium text-foreground">
                  {t("Aanbevolen keuze")}: {ranking.recommendedName}
                  {ranking.reasons.length > 0 && (
                    <span className="font-normal text-muted-foreground">
                      {" — "}
                      {ranking.reasons.join(", ")}
                    </span>
                  )}
                </p>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  {t(
                    "Op basis van het totaalprofiel (match, compliance, vertrouwen en meer). Jij beslist.",
                  )}
                </p>
              </div>
            </div>
          )}
          <Card>
            <CardContent className="overflow-x-auto p-0">
              <table className="w-full border-collapse text-sm">
                <thead>
                  <tr className="border-b border-border text-left text-xs uppercase tracking-wide text-muted-foreground">
                    <th scope="col" className="px-4 py-3 font-medium">
                      {t("Onderdeel")}
                    </th>
                    {candidates.map((c) => (
                      <th
                        key={c.id}
                        scope="col"
                        className="px-4 py-3 font-semibold text-foreground"
                      >
                        {c.name}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  <CompareRow
                    label={t("Totaalprofiel")}
                    hint={t("gewogen totaal")}
                    candidates={candidates}
                    winnerId={ranking.recommendedId}
                    render={(c) => (
                      <span className="font-mono font-semibold">{ranking.scoreById[c.id]}</span>
                    )}
                  />
                  <CompareRow
                    label={t("Match")}
                    candidates={candidates}
                    winnerId={comparison.bestMatchId}
                    render={(c) => (c.matchScore != null ? `${c.matchScore}%` : noData)}
                  />
                  <CompareRow
                    label={t("Tariefvoorstel")}
                    hint={t("scherpste")}
                    candidates={candidates}
                    winnerId={comparison.bestRateId}
                    render={(c) =>
                      c.proposedRate != null ? (
                        <span className="inline-flex flex-col items-start gap-1">
                          <span>{`€ ${c.proposedRate}${t("/uur")}`}</span>
                          {isRateOverBudget(c.proposedRate, comparison.budgetMaxRate) && (
                            <Badge
                              variant="warning"
                              title={t("Boven het budget van deze opdracht")}
                            >
                              {t("Boven budget")}
                            </Badge>
                          )}
                        </span>
                      ) : (
                        noData
                      )
                    }
                  />
                  <CompareRow
                    label={t("Vertrouwen")}
                    candidates={candidates}
                    winnerId={comparison.bestTrustId}
                    render={(c) => (
                      <span
                        className="cursor-help underline decoration-dotted underline-offset-4"
                        title={t(TRUST_LEVEL_EXPLANATION[c.trustLevel])}
                      >
                        {t(TRUST_LABEL[c.trustLevel])}
                      </span>
                    )}
                  />
                  <CompareRow
                    label={t("Reputatie")}
                    hint={t("beoordeling opdrachtgevers")}
                    candidates={candidates}
                    winnerId={comparison.bestRatingId}
                    render={(c) =>
                      c.reviewRating ? (
                        <RatingStars
                          average={c.reviewRating.average}
                          count={c.reviewRating.count}
                          showValue
                        />
                      ) : (
                        noData
                      )
                    }
                  />
                  <CompareRow
                    label={t("Compliance")}
                    candidates={candidates}
                    winnerId={comparison.bestComplianceId}
                    render={(c) =>
                      c.complianceStatus ? <ComplianceBadge status={c.complianceStatus} /> : noData
                    }
                  />
                  <CompareRow
                    label={t("Leverbetrouwbaarheid")}
                    hint={t("in één keer akkoord")}
                    candidates={candidates}
                    winnerId={comparison.bestDeliveryId}
                    render={(c) =>
                      c.firstTimeRightRate != null ? `${c.firstTimeRightRate}%` : noData
                    }
                  />
                  <CompareRow
                    label={t("Beschikbaarheid")}
                    hint={
                      job.startDate ? `${t("op")} ${formatDateShortNl(job.startDate)}` : undefined
                    }
                    candidates={candidates}
                    winnerId={null}
                    render={(c) =>
                      c.startFit && c.startFit !== "unknown" ? (
                        <span className="inline-flex flex-col items-start gap-1">
                          <Badge variant={START_FIT_VARIANT[c.startFit]}>
                            {t(START_FIT_SHORT_LABEL[c.startFit])}
                          </Badge>
                          {c.nextFitLabel && (
                            <span className="text-xs text-muted-foreground">{c.nextFitLabel}</span>
                          )}
                        </span>
                      ) : (
                        // Geen "Agenda gedeeld" meer: dat is geen antwoord op de startdatum. Zonder
                        // oordeel (geen startdatum óf geen agenda) tonen we eerlijk "Onbekend".
                        <span className="text-muted-foreground">{t("Onbekend")}</span>
                      )
                    }
                  />
                  <CompareRow
                    label={t("Reistijd")}
                    candidates={candidates}
                    winnerId={null}
                    render={(c) =>
                      c.proximity ? (
                        <Badge variant={PROXIMITY_VARIANT[c.proximity.level]}>
                          {proximityLabel(c.proximity)}
                        </Badge>
                      ) : (
                        noData
                      )
                    }
                  />
                  <CompareRow
                    label={t("Samenwerking")}
                    hint={t("met jou")}
                    candidates={candidates}
                    winnerId={null}
                    render={(c) =>
                      c.sharedHistory ? <CandidateHistoryBadge history={c.sharedHistory} /> : noData
                    }
                  />
                  <tr>
                    <th scope="row" className="px-4 py-3 text-left align-top">
                      <span className="sr-only">{t("Keuze")}</span>
                    </th>
                    {candidates.map((c) => (
                      <td key={c.id} className="px-4 py-3 align-top">
                        <div className="flex flex-col items-start gap-1.5">
                          <ChooseCandidateButton
                            href={`/kandidaten?open=${c.id}#app-${c.id}`}
                            label={`${t("Kies")} ${firstName(c.name)}`}
                            nonCompliant={c.complianceStatus === "NON_COMPLIANT"}
                          />
                          <Link
                            href={`/kandidaten?open=${c.id}#app-${c.id}`}
                            className="focus-ring text-xs text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
                          >
                            {t("Bericht")}
                          </Link>
                        </div>
                      </td>
                    ))}
                  </tr>
                </tbody>
              </table>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}

/**
 * Compacte poolsamenvatting bovenaan de vergelijking: het reactieveld in één oogopslag. Toont alleen
 * de maten die zin hebben (matchspreiding, compliant-deel, beschikbaar op de startdatum) — een maat
 * zonder gegevens (bv. geen certificaateis) valt weg i.p.v. een misleidende "0 van 0".
 */
function ApplicantFieldSummaryCard({
  field,
  startDate,
  t,
}: {
  field: ApplicantFieldSummary;
  startDate: Date | null;
  t: (key: string) => string;
}) {
  const tiles: { icon: typeof Users; label: string; value: string; hint?: string }[] = [
    {
      icon: Users,
      label: t("Reacties"),
      value: String(field.total),
      hint: t("naast elkaar"),
    },
  ];
  if (field.match) {
    tiles.push({
      icon: Gauge,
      label: t("Mediane match"),
      value: `${field.match.median}%`,
      hint: `${t("spreiding")} ${field.match.min}–${field.match.max}%`,
    });
  }
  if (field.compliant) {
    tiles.push({
      icon: ShieldCheck,
      label: t("Volledig compliant"),
      value: `${field.compliant.count}/${field.compliant.known}`,
      hint: t("voldoen aan de eisen"),
    });
  }
  if (field.availableOnStart) {
    tiles.push({
      icon: CalendarCheck,
      label: t("Beschikbaar op start"),
      value: `${field.availableOnStart.count}/${field.availableOnStart.known}`,
      hint: startDate ? formatDateShortNl(startDate) : undefined,
    });
  }

  return (
    <Card>
      <CardContent className="p-4">
        <h2 className="mb-3 text-xs font-medium uppercase tracking-wide text-muted-foreground">
          {t("Reactieveld in één oogopslag")}
        </h2>
        <dl className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          {tiles.map((tile) => (
            <div key={tile.label} className="flex items-start gap-2.5">
              <tile.icon className="mt-0.5 size-4 shrink-0 text-muted-foreground" aria-hidden />
              <div className="min-w-0">
                <dd className="font-mono text-lg font-semibold tabular-nums text-foreground">
                  {tile.value}
                </dd>
                <dt className="text-xs text-muted-foreground">{tile.label}</dt>
                {tile.hint && <p className="text-[11px] text-muted-foreground/80">{tile.hint}</p>}
              </div>
            </div>
          ))}
        </dl>
      </CardContent>
    </Card>
  );
}

function CompareRow({
  label,
  hint,
  candidates,
  winnerId,
  render,
}: {
  label: string;
  hint?: string;
  candidates: CompareCandidate[];
  winnerId: string | null;
  render: (c: CompareCandidate) => React.ReactNode;
}) {
  return (
    <tr>
      <th scope="row" className="px-4 py-3 text-left align-top font-medium text-muted-foreground">
        {label}
        {hint && <span className="block text-[11px] font-normal normal-case">{hint}</span>}
      </th>
      {candidates.map((c) => {
        const isWinner = winnerId !== null && c.id === winnerId;
        return (
          <td
            key={c.id}
            className={
              isWinner
                ? "px-4 py-3 align-top font-medium text-foreground"
                : "px-4 py-3 align-top text-foreground"
            }
          >
            <span className="inline-flex items-center gap-1.5">
              {render(c)}
              {isWinner && <Trophy className="size-3.5 text-accent" aria-label="beste" />}
            </span>
          </td>
        );
      })}
    </tr>
  );
}
