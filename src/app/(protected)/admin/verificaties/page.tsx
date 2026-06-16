import { type Metadata } from "next";
import { CheckCircle2, Download } from "lucide-react";
import { requireRole } from "@/lib/authz";
import { prisma } from "@/lib/db";
import { CREDENTIAL_TYPE_LABEL } from "@/lib/credentials";
import { type CredentialType } from "@/lib/enums";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { PageHeader } from "@/components/ui/page-header";
import { Textarea } from "@/components/ui/textarea";
import { ExpiryButton } from "./expiry-button";
import { rejectCredential, verifyCredential } from "./actions";
import { formatDateShortNl } from "@/lib/format-date";
import {
  VERIFICATION_STALE_DAYS,
  daysWaiting,
  waitingLabel,
  waitingSince,
  summarizeVerificationQueue,
} from "@/lib/verification-queue";

export const metadata: Metadata = { title: "Verificaties · ZZP Platform" };

function fmt(d: Date | null) {
  return d ? formatDateShortNl(d) : null;
}

export default async function VerificatiesPage() {
  await requireRole("ADMIN");

  const queue = await prisma.credential.findMany({
    where: { status: "SUBMITTED" },
    // Oudste aanvraag eerst op het indientijdstip; legacy-records zonder submittedAt achteraan.
    orderBy: [{ submittedAt: { sort: "asc", nulls: "last" } }, { updatedAt: "asc" }],
    include: {
      document: { select: { id: true } },
      freelancerProfile: { select: { user: { select: { name: true, email: true } } } },
    },
  });

  const now = Date.now();
  const health = summarizeVerificationQueue(queue, now);

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <PageHeader
        title="Verificaties"
        description={
          <>
            Beoordeel ingediende certificaten. {health.pending} in de wachtrij
            {health.oldestDays >= VERIFICATION_STALE_DAYS
              ? `, langst wachtend ${health.oldestDays} dagen`
              : ""}
            {health.staleCount > 0
              ? ` · ${health.staleCount} langer dan ${VERIFICATION_STALE_DAYS} dagen`
              : ""}
            .
          </>
        }
        action={<ExpiryButton />}
      />

      {queue.length === 0 ? (
        <Card>
          <CardContent className="p-0">
            <EmptyState
              icon={CheckCircle2}
              title="Alles afgehandeld"
              description="Er zijn geen openstaande verificatieaanvragen. Goed bezig."
            />
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {queue.map((c) => (
            <Card key={c.id}>
              <CardContent className="space-y-3">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-medium">{c.title}</p>
                    {(() => {
                      const days = daysWaiting(waitingSince(c), now);
                      return (
                        <Badge variant={days >= VERIFICATION_STALE_DAYS ? "warning" : "muted"}>
                          {waitingLabel(days)}
                        </Badge>
                      );
                    })()}
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {CREDENTIAL_TYPE_LABEL[c.type as CredentialType]}
                    {c.issuer ? ` · ${c.issuer}` : ""}
                    {fmt(c.issuedAt) ? ` · uitgegeven ${fmt(c.issuedAt)}` : ""}
                    {fmt(c.expiresAt) ? ` · vervalt ${fmt(c.expiresAt)}` : ""}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Ingediend door {c.freelancerProfile.user.name} ({c.freelancerProfile.user.email}
                    )
                  </p>
                </div>

                {c.document && (
                  <Button asChild variant="secondary" size="sm">
                    <a href={`/api/documents/${c.document.id}`} target="_blank" rel="noreferrer">
                      <Download className="size-3.5" aria-hidden /> Bewijsstuk bekijken
                    </a>
                  </Button>
                )}

                <div className="space-y-3 border-t border-border pt-3">
                  <form action={verifyCredential.bind(null, c.id)}>
                    <Button type="submit" size="sm">
                      Goedkeuren
                    </Button>
                  </form>
                  <form
                    action={rejectCredential.bind(null, c.id)}
                    className="flex flex-col gap-2 sm:flex-row sm:items-end"
                  >
                    <div className="flex-1">
                      <label htmlFor={`reason-${c.id}`} className="mb-1 block text-xs font-medium">
                        Reden van afwijzing
                      </label>
                      <Textarea
                        id={`reason-${c.id}`}
                        name="reason"
                        rows={2}
                        required
                        minLength={3}
                        maxLength={500}
                        placeholder="Verplicht bij afwijzen…"
                      />
                    </div>
                    <Button type="submit" variant="destructive" size="sm">
                      Afwijzen
                    </Button>
                  </form>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
