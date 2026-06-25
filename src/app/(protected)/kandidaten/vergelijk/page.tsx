import { type Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Trophy, Users } from "lucide-react";
import { requireRole } from "@/lib/authz";
import { getTranslator } from "@/lib/i18n/server";
import { prisma } from "@/lib/db";
import { computeCompliance } from "@/lib/matching";
import { computeTrustLevel } from "@/lib/trust";
import { summarizeAvailability } from "@/lib/availability";
import { mandatoryDocuments } from "@/lib/mandatory-documents";
import { getDeliveryQualityForProfiles } from "@/lib/data/freelancer-delivery-quality";
import { type CompareCandidate, buildCandidateComparison } from "@/lib/candidate-compare";
import {
  type AvailabilityWindowType,
  type CredentialType,
  type CredentialStatus,
} from "@/lib/enums";
import { Card, CardContent } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { PageHeader } from "@/components/ui/page-header";
import { ComplianceBadge } from "@/components/compliance-badge";

export const metadata: Metadata = { title: "Kandidaten vergelijken · ZZP Platform" };

const TRUST_LABEL = { BASIS: "Basis", DEELS: "Deels", VOLLEDIG: "Volledig" } as const;

// Alleen reacties die nog in de race zijn — afgewezen/ingetrokken kandidaten vergelijk je niet.
const ACTIVE_STATUSES = ["NEW", "VIEWED", "SHORTLIST", "ACCEPTED"] as const;
const MAX_COMPARE = 8;

export default async function VergelijkKandidatenPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string>>;
}) {
  const actor = await requireRole("CLIENT");
  const { t } = await getTranslator();
  const jobId = (await searchParams).job;
  if (!jobId) notFound();

  // Ownership-poort: alleen een eigen opdracht. Onbekend/vreemd id → notFound (geen lek).
  const job = await prisma.job.findFirst({
    where: { id: jobId, company: { userId: actor.id } },
    select: {
      id: true,
      title: true,
      rateMin: true,
      rateMax: true,
      workMode: true,
      location: true,
      skills: { select: { skillId: true, required: true } },
      credentialRequirements: { select: { credentialType: true, required: true } },
    },
  });
  if (!job) notFound();

  const applications = await prisma.application.findMany({
    where: { jobId: job.id, status: { in: [...ACTIVE_STATUSES] } },
    orderBy: { matchScore: "desc" },
    take: MAX_COMPARE,
    include: {
      freelancer: {
        select: {
          id: true,
          headline: true,
          visibility: true,
          user: { select: { name: true, identityVerifiedAt: true } },
          availabilityWindows: { select: { startDate: true, endDate: true, type: true } },
          credentials: { select: { type: true, status: true, expiresAt: true } },
        },
      },
    },
  });

  const deliveryByProfile = await getDeliveryQualityForProfiles(
    applications.map((a) => a.freelancer.id),
  );

  const requiredTypes = job.credentialRequirements
    .filter((r) => r.required)
    .map((r) => r.credentialType as CredentialType);
  const nowMs = Date.now();

  const candidates: CompareCandidate[] = applications.map((app) => {
    const creds = app.freelancer.credentials.map((c) => ({
      type: c.type as CredentialType,
      status: c.status as CredentialStatus,
      expiresAt: c.expiresAt,
    }));
    const compliance =
      requiredTypes.length > 0 ? computeCompliance(requiredTypes, creds).status : null;
    const trust = computeTrustLevel({
      identityVerified: !!app.freelancer.user.identityVerifiedAt,
      verifiedCredentialCount: creds.filter(
        (c) => c.status === "VERIFIED" && (!c.expiresAt || c.expiresAt.getTime() > nowMs),
      ).length,
      mandatoryDocsComplete: mandatoryDocuments(creds).allSatisfied,
    });
    const delivery = deliveryByProfile.get(app.freelancer.id);
    return {
      id: app.id,
      name: app.freelancer.user.name ?? "—",
      matchScore: app.matchScore,
      proposedRate: app.proposedRate,
      trustLevel: trust.level,
      complianceStatus: compliance,
      firstTimeRightRate:
        delivery && delivery.tone !== "INSUFFICIENT" ? delivery.firstTimeRightRate : null,
      available: !!summarizeAvailability(
        app.freelancer.availabilityWindows.map((w) => ({
          ...w,
          type: w.type as AvailabilityWindowType,
        })),
      ),
    };
  });

  const comparison = buildCandidateComparison(candidates);

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
          title={t("Kandidaten vergelijken")}
          description={`${t("Reacties op")} "${job.title}" ${t("naast elkaar, met de uitspringer per onderdeel.")}`}
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
        <Card>
          <CardContent className="overflow-x-auto p-0">
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr className="border-b border-border text-left text-xs uppercase tracking-wide text-muted-foreground">
                  <th scope="col" className="px-4 py-3 font-medium">
                    {t("Onderdeel")}
                  </th>
                  {candidates.map((c) => (
                    <th key={c.id} scope="col" className="px-4 py-3 font-semibold text-foreground">
                      {c.name}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                <CompareRow
                  label={t("Match")}
                  candidates={candidates}
                  winnerId={comparison.bestMatchId}
                  render={(c) => (c.matchScore != null ? `${c.matchScore}%` : "—")}
                />
                <CompareRow
                  label={t("Tariefvoorstel")}
                  hint={t("scherpste")}
                  candidates={candidates}
                  winnerId={comparison.bestRateId}
                  render={(c) => (c.proposedRate != null ? `€ ${c.proposedRate}${t("/uur")}` : "—")}
                />
                <CompareRow
                  label={t("Vertrouwen")}
                  candidates={candidates}
                  winnerId={comparison.bestTrustId}
                  render={(c) => t(TRUST_LABEL[c.trustLevel])}
                />
                <CompareRow
                  label={t("Compliance")}
                  candidates={candidates}
                  winnerId={comparison.bestComplianceId}
                  render={(c) =>
                    c.complianceStatus ? <ComplianceBadge status={c.complianceStatus} /> : "—"
                  }
                />
                <CompareRow
                  label={t("Leverbetrouwbaarheid")}
                  hint={t("in één keer akkoord")}
                  candidates={candidates}
                  winnerId={comparison.bestDeliveryId}
                  render={(c) => (c.firstTimeRightRate != null ? `${c.firstTimeRightRate}%` : "—")}
                />
                <CompareRow
                  label={t("Beschikbaarheid")}
                  candidates={candidates}
                  winnerId={null}
                  render={(c) => (c.available ? t("Agenda gedeeld") : "—")}
                />
              </tbody>
            </table>
          </CardContent>
        </Card>
      )}
    </div>
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
