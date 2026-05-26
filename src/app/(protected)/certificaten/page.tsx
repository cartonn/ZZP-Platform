import { type Metadata } from "next";
import Link from "next/link";
import { Download, Eye, EyeOff, Pencil, Plus, Trash2 } from "lucide-react";
import { requireRole } from "@/lib/authz";
import { prisma } from "@/lib/db";
import { canTransition, daysUntilExpiry, isExpiringSoon } from "@/lib/credentials";
import { type CredentialStatus, type CredentialType, type Visibility } from "@/lib/enums";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { CredentialStatusBadge } from "@/components/credentials/credential-status-badge";
import { deleteCredential, requestVerification, toggleCredentialVisibility } from "./actions";

export const metadata: Metadata = { title: "Certificaten · ZZP Platform" };

const TYPE_LABEL: Record<CredentialType, string> = {
  VOG: "VOG", DIPLOMA: "Diploma", CERTIFICATE: "Certificaat", INSURANCE: "Verzekering", LICENSE: "Licentie", OTHER: "Overig",
};

function fmt(d: Date | null) {
  return d ? d.toISOString().slice(0, 10) : null;
}

export default async function CertificatenPage() {
  const actor = await requireRole("FREELANCER");
  const profile = await prisma.freelancerProfile.findUnique({ where: { userId: actor.id }, select: { id: true } });

  const credentials = profile
    ? await prisma.credential.findMany({
        where: { freelancerProfileId: profile.id },
        orderBy: { createdAt: "desc" },
        include: {
          document: { select: { id: true, filename: true } },
          verifications: { orderBy: { createdAt: "desc" }, include: { verifier: { select: { name: true } } } },
        },
      })
    : [];

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <header className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold tracking-tight">Certificaten</h1>
          <p className="text-sm text-muted-foreground">Beheer je bewijsstukken en vraag verificatie aan.</p>
        </div>
        <Button asChild>
          <Link href="/certificaten/nieuw"><Plus className="size-4" aria-hidden /> Nieuw certificaat</Link>
        </Button>
      </header>

      {credentials.length === 0 ? (
        <Card>
          <CardContent className="text-center text-sm text-muted-foreground">
            Nog geen certificaten. Voeg je eerste bewijsstuk toe (bijv. VOG of diploma).
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {credentials.map((c) => {
            const status = c.status as CredentialStatus;
            const days = daysUntilExpiry(c.expiresAt);
            const expiringSoon = isExpiringSoon({ status, expiresAt: c.expiresAt });
            const canSubmit = !!c.documentId && canTransition(status, "SUBMITTED");
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
                        {TYPE_LABEL[c.type as CredentialType]}
                        {c.issuer ? ` · ${c.issuer}` : ""}
                        {fmt(c.issuedAt) ? ` · uitgegeven ${fmt(c.issuedAt)}` : ""}
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                    {fmt(c.expiresAt) && (
                      <span className={expiringSoon ? "text-warning" : status === "EXPIRED" ? "text-danger" : ""}>
                        Vervalt {fmt(c.expiresAt)}
                        {days != null && days >= 0 ? ` (over ${days} dagen)` : days != null ? " (verlopen)" : ""}
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
                      <summary className="cursor-pointer text-muted-foreground">Verificatiehistorie ({c.verifications.length})</summary>
                      <ul className="mt-2 space-y-1">
                        {c.verifications.map((v) => (
                          <li key={v.id} className="text-xs text-muted-foreground">
                            {v.createdAt.toISOString().slice(0, 10)} — {v.decision === "VERIFIED" ? "Goedgekeurd" : "Afgewezen"}
                            {v.verifier?.name ? ` door ${v.verifier.name}` : ""}
                            {v.reason ? `: ${v.reason}` : ""}
                          </li>
                        ))}
                      </ul>
                    </details>
                  )}

                  <div className="flex flex-wrap items-center gap-2 border-t border-border pt-3">
                    {canSubmit && (
                      <form action={requestVerification.bind(null, c.id)}>
                        <Button type="submit" size="sm">Verificatie aanvragen</Button>
                      </form>
                    )}
                    {c.document && (
                      <Button asChild variant="secondary" size="sm">
                        <a href={`/api/documents/${c.document.id}`} target="_blank" rel="noreferrer">
                          <Download className="size-3.5" aria-hidden /> Bewijsstuk
                        </a>
                      </Button>
                    )}
                    <Button asChild variant="secondary" size="sm">
                      <Link href={`/certificaten/${c.id}/bewerken`}><Pencil className="size-3.5" aria-hidden /> Bewerken</Link>
                    </Button>
                    <form action={toggleCredentialVisibility.bind(null, c.id)}>
                      <Button type="submit" variant="secondary" size="sm">
                        {isPublic ? <EyeOff className="size-3.5" aria-hidden /> : <Eye className="size-3.5" aria-hidden />}
                        {isPublic ? "Maak privé" : "Maak openbaar"}
                      </Button>
                    </form>
                    <form action={deleteCredential.bind(null, c.id)}>
                      <Button type="submit" variant="danger" size="sm"><Trash2 className="size-3.5" aria-hidden /> Verwijderen</Button>
                    </form>
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
