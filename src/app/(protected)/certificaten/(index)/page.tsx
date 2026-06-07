import { type Metadata } from "next";
import Link from "next/link";
import { Award, Download, Eye, EyeOff, Pencil, Plus, RefreshCw, Trash2 } from "lucide-react";
import { requireRole } from "@/lib/authz";
import { prisma } from "@/lib/db";
import {
  CREDENTIAL_TYPE_LABEL,
  activeVerifiedCount,
  daysUntilExpiry,
  isExpiringSoon,
} from "@/lib/credentials";
import { computeTrustLevel } from "@/lib/trust";
import { TrustExplanation } from "@/components/trust/trust-explanation";
import { type CredentialStatus, type CredentialType, type Visibility } from "@/lib/enums";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { CredentialStatusBadge } from "@/components/credentials/credential-status-badge";
import { ConfirmButton } from "@/components/ui/confirm-button";
import { EmptyState } from "@/components/ui/empty-state";
import { PageHeader } from "@/components/ui/page-header";
import { deleteCredential, requestVerification, toggleCredentialVisibility } from "../actions";
import { DuoVerifyForm } from "../duo-verify-form";
import { BigVerifyForm } from "../big-verify-form";
import { formatDateShortNl } from "@/lib/format-date";

export const metadata: Metadata = { title: "Certificaten · ZZP Platform" };

function fmt(d: Date | null) {
  return d ? formatDateShortNl(d) : null;
}

export default async function CertificatenPage() {
  const actor = await requireRole("FREELANCER");
  const profile = await prisma.freelancerProfile.findUnique({
    where: { userId: actor.id },
    select: { id: true },
  });

  const [credentials, user] = await Promise.all([
    profile
      ? prisma.credential.findMany({
          where: { freelancerProfileId: profile.id },
          orderBy: { createdAt: "desc" },
          include: {
            document: { select: { id: true, filename: true } },
            verifications: {
              orderBy: { createdAt: "desc" },
              select: {
                id: true,
                decision: true,
                reason: true,
                source: true,
                createdAt: true,
                verifier: { select: { name: true } },
              },
            },
          },
        })
      : Promise.resolve([]),
    prisma.user.findUnique({ where: { id: actor.id }, select: { identityVerifiedAt: true } }),
  ]);

  // Verklaarbaar vertrouwensniveau: dezelfde server-side regels als de opdrachtgever ziet, maar hier
  // met de concrete verbeterstappen (zelf-weergave). Verlopen bewijsstukken tellen niet mee.
  const trust = computeTrustLevel({
    identityVerified: !!user?.identityVerifiedAt,
    verifiedCredentialCount: activeVerifiedCount(
      credentials.map((c) => ({ status: c.status as CredentialStatus, expiresAt: c.expiresAt })),
    ),
  });

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <PageHeader
        title="Certificaten"
        description="Beheer je bewijsstukken en vraag verificatie aan."
        action={
          <Button asChild>
            <Link href="/certificaten/nieuw">
              <Plus className="size-4" aria-hidden /> Nieuw certificaat
            </Link>
          </Button>
        }
      />

      <TrustExplanation trust={trust} self />

      {credentials.length === 0 ? (
        <Card>
          <EmptyState
            icon={Award}
            title="Nog geen certificaten"
            description="Voeg je eerste bewijsstuk toe, zoals een VOG of diploma."
            action={{ label: "Certificaat toevoegen", href: "/certificaten/nieuw" }}
          />
        </Card>
      ) : (
        <div className="space-y-4">
          {credentials.map((c) => {
            const status = c.status as CredentialStatus;
            const days = daysUntilExpiry(c.expiresAt);
            const expiringSoon = isExpiringSoon({ status, expiresAt: c.expiresAt });
            // Losse verificatie-aanvraag alleen vanuit concept/afgewezen/verlopen.
            // (VERIFIED->SUBMITTED bestaat wél in de map, maar uitsluitend bij document-vervangen.)
            const canSubmit =
              !!c.documentId &&
              (status === "DRAFT" || status === "REJECTED" || status === "EXPIRED");
            const isPublic = (c.visibility as Visibility) === "PUBLIC";
            return (
              <Card key={c.id}>
                <CardContent className="space-y-3">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{c.title}</span>
                        <CredentialStatusBadge status={status} />
                        <Badge variant="muted">{isPublic ? "Openbaar" : "Privé"}</Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {CREDENTIAL_TYPE_LABEL[c.type as CredentialType]}
                        {c.issuer ? ` · ${c.issuer}` : ""}
                        {fmt(c.issuedAt) ? ` · uitgegeven ${fmt(c.issuedAt)}` : ""}
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                    {fmt(c.expiresAt) && (
                      <span
                        className={
                          expiringSoon ? "text-warning" : status === "EXPIRED" ? "text-danger" : ""
                        }
                      >
                        Vervalt {fmt(c.expiresAt)}
                        {days != null && days >= 0
                          ? ` (over ${days} dagen)`
                          : days != null
                            ? " (verlopen)"
                            : ""}
                      </span>
                    )}
                  </div>

                  {status === "REJECTED" && c.rejectionReason && (
                    <p className="rounded-md bg-danger/10 px-3 py-2 text-sm text-danger">
                      Afgewezen: {c.rejectionReason}
                    </p>
                  )}

                  {c.verifications.length > 0 && (
                    <details className="text-sm">
                      <summary className="cursor-pointer text-muted-foreground">
                        Verificatiehistorie ({c.verifications.length})
                      </summary>
                      <ul className="mt-2 space-y-1">
                        {c.verifications.map((v) => (
                          <li key={v.id} className="text-xs text-muted-foreground">
                            {formatDateShortNl(v.createdAt)} —{" "}
                            {v.decision === "VERIFIED" ? "Goedgekeurd" : "Afgewezen"}
                            {v.source === "DUO"
                              ? " via DUO"
                              : v.source === "BIG"
                                ? " via BIG-register"
                                : v.verifier?.name
                                  ? ` door ${v.verifier.name}`
                                  : ""}
                            {v.reason ? `: ${v.reason}` : ""}
                          </li>
                        ))}
                      </ul>
                    </details>
                  )}

                  <div className="flex flex-wrap items-center gap-2 border-t border-border pt-3">
                    {canSubmit && (
                      <form action={requestVerification.bind(null, c.id)}>
                        <Button type="submit" size="sm">
                          Verificatie aanvragen
                        </Button>
                      </form>
                    )}
                    {/* Bijna-verlopen, nog geldig (VERIFIED): vernieuwen = nieuw bewijsstuk uploaden
                        op de bewerken-pagina, wat het certificaat opnieuw ter verificatie aanbiedt. */}
                    {expiringSoon && (
                      <Button asChild size="sm">
                        <Link
                          href={`/certificaten/${c.id}/bewerken`}
                          title="Upload een nieuw bewijsstuk om het certificaat te vernieuwen"
                        >
                          <RefreshCw className="size-3.5" aria-hidden /> Vernieuwen
                        </Link>
                      </Button>
                    )}
                    {c.document && (
                      <Button asChild variant="secondary" size="sm">
                        <a
                          href={`/api/documents/${c.document.id}`}
                          target="_blank"
                          rel="noreferrer"
                        >
                          <Download className="size-3.5" aria-hidden /> Bewijsstuk
                        </a>
                      </Button>
                    )}
                    <Button asChild variant="secondary" size="sm">
                      <Link href={`/certificaten/${c.id}/bewerken`}>
                        <Pencil className="size-3.5" aria-hidden /> Bewerken
                      </Link>
                    </Button>
                    <form action={toggleCredentialVisibility.bind(null, c.id)}>
                      <Button type="submit" variant="secondary" size="sm">
                        {isPublic ? (
                          <EyeOff className="size-3.5" aria-hidden />
                        ) : (
                          <Eye className="size-3.5" aria-hidden />
                        )}
                        {isPublic ? "Maak privé" : "Maak openbaar"}
                      </Button>
                    </form>
                    <ConfirmButton
                      action={deleteCredential.bind(null, c.id)}
                      title="Certificaat verwijderen?"
                      description="Het certificaat en het gekoppelde bewijsstuk worden permanent verwijderd. Dit kan niet ongedaan worden gemaakt."
                      confirmLabel="Verwijderen"
                    >
                      <Trash2 className="size-3.5" aria-hidden /> Verwijderen
                    </ConfirmButton>
                  </div>

                  {c.type === "DIPLOMA" && status !== "VERIFIED" && (
                    <div className="space-y-1 border-t border-border pt-3">
                      <p className="text-xs font-medium">Diploma verifiëren via DUO</p>
                      <p className="text-xs text-muted-foreground">
                        Vul de verificatiecode in van je gewaarmerkte uittreksel uit het
                        DUO-diplomaregister.
                      </p>
                      <DuoVerifyForm credentialId={c.id} />
                    </div>
                  )}
                  {c.type === "LICENSE" && status !== "VERIFIED" && (
                    <div className="space-y-1 border-t border-border pt-3">
                      <p className="text-xs font-medium">
                        Beroepsregistratie verifiëren via BIG-register
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Vul je BIG-nummer in (11 cijfers).
                      </p>
                      <BigVerifyForm credentialId={c.id} />
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
