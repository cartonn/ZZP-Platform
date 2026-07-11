import Link from "next/link";
import { ArrowLeftRight } from "lucide-react";
import { type Actor } from "@/lib/authz";
import { tenantScopeWhere } from "@/lib/tenancy";
import { prisma } from "@/lib/db";
import { computeCompliance, type ComplianceStatus } from "@/lib/matching";
import { type CredentialStatus, type CredentialType } from "@/lib/enums";
import { CREDENTIAL_TYPE_LABEL } from "@/lib/credentials";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { PageHeader } from "@/components/ui/page-header";
import { formatDateShortNl } from "@/lib/format-date";
import { ShiftHandoffApproveForm } from "@/components/collaborations/shift-handoff-approve-form";
import { ShiftHandoffRejectForm } from "@/components/collaborations/shift-handoff-reject-form";

const COMPLIANCE_BADGE: Record<
  ComplianceStatus,
  { label: string; variant: "success" | "warning" | "danger" }
> = {
  COMPLIANT: { label: "Voldoet aan de eisen", variant: "success" },
  WARNING: { label: "Nog in beoordeling", variant: "warning" },
  NON_COMPLIANT: { label: "Voldoet niet aan de eisen", variant: "danger" },
};

/**
 * Gedeeld governance-scherm voor shift-overnames. Wordt gerenderd vanaf zowel
 * /admin/shift-overnames (ADMIN, platform-breed) als /franchise/shift-overnames (FRANCHISER,
 * eigen tenant). De tenant-scope filtert wat een franchiser ziet; de approve/reject-acties
 * zijn gedeeld en dwingen tenant-isolatie nogmaals server-side af.
 */
export async function ShiftHandoffGovernanceScreen({ actor }: { actor: Actor }) {
  const scope = tenantScopeWhere(actor); // {} voor admin, { tenantId } voor franchiser

  const open = await prisma.shiftHandoff.findMany({
    where: {
      status: "OPEN",
      collaboration: { job: { is: scope.tenantId ? { tenantId: scope.tenantId } : {} } },
    },
    orderBy: { createdAt: "asc" },
    take: 100,
    select: {
      id: true,
      reason: true,
      candidateFreelancerId: true,
      createdAt: true,
      collaboration: {
        select: {
          id: true,
          freelancer: { select: { user: { select: { name: true } } } },
          job: {
            select: {
              title: true,
              credentialRequirements: {
                where: { required: true },
                select: { credentialType: true },
              },
            },
          },
        },
      },
    },
  });

  // Compliance van de voorgestelde overnemer: certificaten van de kandidaat-profielen in één query,
  // daarna per handoff vergeleken met de vereiste certificaattypes van de opdracht.
  const candidateIds = open
    .map((h) => h.candidateFreelancerId)
    .filter((id): id is string => Boolean(id));
  const candidates =
    candidateIds.length > 0
      ? await prisma.freelancerProfile.findMany({
          // Defense-in-depth (CLAUDE.md regel 2, tenant-isolatie): scope de kandidaat-lookup expliciet
          // op de eigen tenant (`...scope` = {} voor admin, { tenantId } voor de franchiser — via het
          // geteste `tenantScopeWhere`) i.p.v. te leunen op de invariant die `requestShiftHandoff` bij
          // aanmaak afdwingt (candidate.tenantId == job.tenantId). Zonder deze filter zou een franchiser
          // de naam + certificaatstatus (PII, gezondheids-adjacent) van een ZZP'er uit een ándere tenant
          // zien zodra die invariant ooit breekt (bv. een herparentering van het profiel).
          where: { id: { in: candidateIds }, ...scope },
          take: 100,
          select: {
            id: true,
            user: { select: { name: true } },
            credentials: { select: { type: true, status: true, expiresAt: true } },
          },
        })
      : [];
  const candidateById = new Map(candidates.map((c) => [c.id, c]));

  return (
    <div className="space-y-6">
      <PageHeader
        title="Dienst-overnames"
        description={
          <span className="text-sm text-muted-foreground">
            Een ZZP&apos;er kan een actieve inzet niet voortzetten en biedt deze ter overname aan.
            <span className="mt-1 block">1. Keur de aanvraag · 2. Plaats de overnemer</span>
          </span>
        }
      />

      {open.length === 0 ? (
        <Card>
          <EmptyState
            icon={ArrowLeftRight}
            title="Geen openstaande overname-aanvragen"
            description="Nieuwe aanvragen van ZZP'ers verschijnen hier ter beoordeling."
          />
        </Card>
      ) : (
        <div className="space-y-3">
          <h2 className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Te beoordelen ({open.length})
          </h2>
          {open.map((h) => {
            const requiredTypes = h.collaboration.job.credentialRequirements.map(
              (r) => r.credentialType as CredentialType,
            );
            const candidate = h.candidateFreelancerId
              ? (candidateById.get(h.candidateFreelancerId) ?? null)
              : null;
            const compliance =
              candidate && requiredTypes.length > 0
                ? computeCompliance(
                    requiredTypes,
                    candidate.credentials.map((c) => ({
                      type: c.type as CredentialType,
                      status: c.status as CredentialStatus,
                      expiresAt: c.expiresAt,
                    })),
                  )
                : null;
            const missingLabels = compliance
              ? [...compliance.missing, ...compliance.expired]
                  .map((t) => CREDENTIAL_TYPE_LABEL[t])
                  .join(", ")
              : "";

            return (
              <Card key={h.id}>
                <CardContent className="space-y-2 py-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="font-medium">{h.collaboration.job.title}</p>
                    <Badge variant="warning">Te beoordelen</Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Huidige ZZP&apos;er: {h.collaboration.freelancer.user.name} · aangevraagd op{" "}
                    {formatDateShortNl(h.createdAt)}
                  </p>
                  <p className="text-sm">Reden: {h.reason}</p>

                  {/* Voorgestelde overnemer + compliance-gate (computeCompliance). */}
                  <div className="rounded-md border border-border bg-muted/30 p-2 text-sm">
                    {candidate ? (
                      <div className="space-y-1">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <span>
                            Voorgestelde overnemer: <strong>{candidate.user.name}</strong>
                          </span>
                          {compliance ? (
                            <Badge variant={COMPLIANCE_BADGE[compliance.status].variant}>
                              {COMPLIANCE_BADGE[compliance.status].label}
                            </Badge>
                          ) : (
                            <Badge variant="muted">Geen certificaateisen</Badge>
                          )}
                        </div>
                        {compliance && compliance.status !== "COMPLIANT" && missingLabels && (
                          <p className="text-xs text-muted-foreground">
                            Ontbrekend/verlopen: {missingLabels}
                          </p>
                        )}
                      </div>
                    ) : (
                      <span className="text-muted-foreground">
                        Geen overnemer voorgesteld — wijs zelf een passende ZZP&apos;er aan bij de
                        herplaatsing.
                      </span>
                    )}
                  </div>

                  <div className="flex flex-wrap items-center gap-2 border-t border-border pt-2">
                    <ShiftHandoffApproveForm handoffId={h.id} />
                    <ShiftHandoffRejectForm handoffId={h.id} />
                    <Link
                      href={`/samenwerkingen/${h.collaboration.id}`}
                      className="ml-auto text-sm text-muted-foreground underline-offset-4 hover:underline"
                    >
                      Samenwerking →
                    </Link>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
