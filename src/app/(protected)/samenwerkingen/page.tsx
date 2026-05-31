import { type Metadata } from "next";
import Link from "next/link";
import { AlertTriangle, Handshake } from "lucide-react";
import { requireActor } from "@/lib/authz";
import { prisma } from "@/lib/db";
import { COLLABORATION_TRANSITIONS } from "@/lib/collaborations";
import { assessCollaborationCredentials, type CredentialAlert } from "@/lib/collaboration-alerts";
import { CREDENTIAL_TYPE_LABEL } from "@/lib/credentials";
import { type FreelancerCredential } from "@/lib/matching";
import { type CollaborationStatus, type CredentialType } from "@/lib/enums";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { changeCollaborationStatus } from "./actions";

export const metadata: Metadata = { title: "Samenwerkingen · ZZP Platform" };

const STATUS: Record<
  CollaborationStatus,
  { label: string; variant: "default" | "success" | "muted" | "danger" }
> = {
  PROPOSED: { label: "Voorgesteld", variant: "default" },
  ACTIVE: { label: "Actief", variant: "success" },
  COMPLETED: { label: "Afgerond", variant: "muted" },
  CANCELLED: { label: "Geannuleerd", variant: "danger" },
};

const ACTION_LABEL: Record<CollaborationStatus, string> = {
  PROPOSED: "Terug naar voorstel",
  ACTIVE: "Markeer als actief",
  COMPLETED: "Markeer als afgerond",
  CANCELLED: "Annuleren",
};

function fmt(d: Date | null) {
  return d ? d.toISOString().slice(0, 10) : null;
}

/** Compliance-melding voor op de kaart, zonder opdrachttitel (die staat er al boven). */
function alertPhrase(a: CredentialAlert, name: string, isClient: boolean): string {
  const t = (list: CredentialType[]) => list.map((x) => CREDENTIAL_TYPE_LABEL[x]).join(", ");
  if (a.missing.length > 0)
    return isClient
      ? `${name} mist een vereist certificaat: ${t(a.missing)}.`
      : `Je mist een vereist certificaat: ${t(a.missing)}.`;
  if (a.expired.length > 0)
    return isClient
      ? `Certificaat van ${name} is verlopen: ${t(a.expired)}.`
      : `Je ${t(a.expired)} is verlopen.`;
  if (a.expiringSoon.length > 0)
    return isClient
      ? `Certificaat van ${name} verloopt binnenkort: ${t(a.expiringSoon)}.`
      : `Je ${t(a.expiringSoon)} verloopt binnenkort.`;
  return isClient
    ? `Certificaat van ${name} is in beoordeling: ${t(a.inReview)}.`
    : `Je ${t(a.inReview)} is in beoordeling.`;
}

export default async function SamenwerkingenPage() {
  const actor = await requireActor();

  const collaborations = await prisma.collaboration.findMany({
    where: { OR: [{ company: { userId: actor.id } }, { freelancer: { userId: actor.id } }] },
    orderBy: { updatedAt: "desc" },
    include: {
      job: {
        select: {
          id: true,
          title: true,
          credentialRequirements: { where: { required: true }, select: { credentialType: true } },
        },
      },
      company: { select: { name: true, userId: true } },
      freelancer: {
        select: {
          userId: true,
          user: { select: { name: true } },
          credentials: { select: { type: true, status: true, expiresAt: true } },
        },
      },
    },
  });

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <header>
        <h1 className="text-xl font-semibold tracking-tight">Samenwerkingen</h1>
        <p className="text-sm text-muted-foreground">Voorgestelde en lopende samenwerkingen.</p>
      </header>

      {collaborations.length === 0 ? (
        <Card>
          <EmptyState
            icon={Handshake}
            title="Nog geen samenwerkingen"
            description="Een opdrachtgever stelt een samenwerking voor vanuit een geaccepteerde reactie."
          />
        </Card>
      ) : (
        <div className="space-y-4">
          {collaborations.map((c) => {
            const status = c.status as CollaborationStatus;
            const isClient = c.company.userId === actor.id;
            const counterparty = isClient ? c.freelancer.user.name : c.company.name;

            const requiredTypes = c.job.credentialRequirements.map(
              (r) => r.credentialType as CredentialType,
            );
            const credentials: FreelancerCredential[] = c.freelancer.credentials.map((cr) => ({
              type: cr.type as CredentialType,
              status: cr.status as FreelancerCredential["status"],
              expiresAt: cr.expiresAt,
            }));
            const alert =
              requiredTypes.length > 0 && (status === "ACTIVE" || status === "PROPOSED")
                ? assessCollaborationCredentials(requiredTypes, credentials)
                : null;
            const showAlert = alert && alert.status !== "COMPLIANT";
            const urgent = alert?.status === "NON_COMPLIANT";
            return (
              <Card key={c.id}>
                <CardContent className="space-y-3">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <Link
                          href={`/opdrachten/${c.job.id}`}
                          className="font-medium underline-offset-4 hover:underline"
                        >
                          {c.job.title}
                        </Link>
                        <Badge variant={STATUS[status].variant}>{STATUS[status].label}</Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">Met {counterparty}</p>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                    {c.rate != null && <span>Tarief: € {c.rate}/uur</span>}
                    {fmt(c.startDate) && <span>Start: {fmt(c.startDate)}</span>}
                    {fmt(c.endDate) && <span>Eind: {fmt(c.endDate)}</span>}
                  </div>

                  {showAlert && alert && (
                    <div
                      className={`flex items-start gap-2 rounded-md border px-3 py-2 text-xs ${
                        urgent
                          ? "border-danger/30 bg-danger/10 text-danger"
                          : "border-warning/30 bg-warning/10 text-warning"
                      }`}
                    >
                      <AlertTriangle className="size-4 shrink-0" aria-hidden />
                      <span>
                        {alertPhrase(alert, counterparty, isClient)}
                        {!isClient && (
                          <>
                            {" "}
                            <Link
                              href="/certificaten"
                              className="font-medium underline underline-offset-2"
                            >
                              Bijwerken
                            </Link>
                          </>
                        )}
                      </span>
                    </div>
                  )}

                  {(COLLABORATION_TRANSITIONS[status].length > 0 ||
                    (!isClient && (status === "ACTIVE" || status === "COMPLETED"))) && (
                    <div className="flex flex-wrap items-center gap-2 border-t border-border pt-3">
                      {COLLABORATION_TRANSITIONS[status].map((to) => (
                        <form key={to} action={changeCollaborationStatus.bind(null, c.id, to)}>
                          <Button
                            type="submit"
                            size="sm"
                            variant={
                              to === "CANCELLED"
                                ? "danger"
                                : to === "ACTIVE"
                                  ? "primary"
                                  : "secondary"
                            }
                          >
                            {ACTION_LABEL[to]}
                          </Button>
                        </form>
                      ))}
                      {!isClient && (status === "ACTIVE" || status === "COMPLETED") && (
                        <Button asChild variant="secondary" size="sm">
                          <Link href="/facturen/nieuw">Factuur opstellen</Link>
                        </Button>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
