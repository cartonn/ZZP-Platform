import { type Metadata } from "next";
import { CheckCircle2 } from "lucide-react";
import { requireRole } from "@/lib/authz";
import { prisma } from "@/lib/db";
import { CREDENTIAL_TYPE_LABEL } from "@/lib/credentials";
import { type CredentialType } from "@/lib/enums";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Input } from "@/components/ui/input";
import { PageHeader } from "@/components/ui/page-header";
import { Select } from "@/components/ui/select";
import { ExpiryButton } from "./expiry-button";
import { RejectForm, VerifyForm } from "./reject-form";
import { DocumentPreview } from "./document-preview";
import { rejectCredentialState, verifyCredentialState } from "./actions";
import { formatDateShortNl } from "@/lib/format-date";
import { plural } from "@/lib/plural";
import { CREDENTIAL_TYPES } from "@/lib/enums";
import {
  VERIFICATION_STALE_DAYS,
  daysWaiting,
  waitingLabel,
  waitingSince,
  summarizeVerificationQueue,
} from "@/lib/verification-queue";
import {
  countByType,
  filterVerificationQueue,
  isVerificationFilterActive,
  parseVerificationFilter,
  type FilterableCredential,
} from "@/lib/verification-filter";
import { credentialTypeDemand, demandLevel } from "@/lib/verification-impact";
import { getOpenJobCredentialRequirements } from "@/lib/data/verification-impact";

export const metadata: Metadata = { title: "Verificaties · ZZP Platform" };

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

function fmt(d: Date | null) {
  return d ? formatDateShortNl(d) : null;
}

export default async function VerificatiesPage({ searchParams }: { searchParams: SearchParams }) {
  await requireRole("ADMIN");
  const sp = await searchParams;

  // unbounded-allow: verificatiewachtrij is structureel klein (dagelijks verwerkt)
  const queue = await prisma.credential.findMany({
    where: { status: "SUBMITTED" },
    // Oudste aanvraag eerst op het indientijdstip; legacy-records zonder submittedAt achteraan.
    orderBy: [{ submittedAt: { sort: "asc", nulls: "last" } }, { updatedAt: "asc" }],
    include: {
      document: { select: { id: true, mimeType: true } },
      freelancerProfile: { select: { user: { select: { name: true, email: true } } } },
    },
  });

  const now = Date.now();
  // De wachtrij-gezondheid telt altijd de volledige backlog (niet de gefilterde weergave).
  const health = summarizeVerificationQueue(queue, now);

  // Impact-signaal: hoeveel open opdrachten vragen (verplicht) elk certificaattype? Zo kan de admin,
  // binnen de FIFO-volgorde, zien welke beoordeling de meeste downstream-inzetbaarheid ontsluit.
  const demand =
    queue.length > 0 ? credentialTypeDemand(await getOpenJobCredentialRequirements()) : {};

  const filter = parseVerificationFilter(sp);
  const typeCounts = countByType(
    queue.map<FilterableCredential>((c) => ({
      type: c.type as CredentialType,
      title: c.title,
      issuer: c.issuer,
      freelancerName: c.freelancerProfile.user.name ?? "",
    })),
  );
  const visible = filterVerificationQueue(
    queue.map((c) => ({
      ...c,
      type: c.type as CredentialType,
      freelancerName: c.freelancerProfile.user.name ?? "",
    })),
    filter,
  );
  const filterActive = isVerificationFilterActive(filter);

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Het zegel · de wachtrij"
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
          <form
            method="get"
            className="grid gap-3 rounded-lg border border-border bg-card p-4 sm:grid-cols-[1fr_auto_auto]"
          >
            <Input
              name="q"
              defaultValue={filter.q}
              placeholder="Zoek op naam, titel of uitgever…"
              aria-label="Zoeken"
            />
            <Select name="type" defaultValue={filter.type ?? ""} aria-label="Certificaattype">
              <option value="">Alle typen ({queue.length})</option>
              {CREDENTIAL_TYPES.map((t) => (
                <option key={t} value={t} disabled={typeCounts[t] === 0}>
                  {CREDENTIAL_TYPE_LABEL[t]} ({typeCounts[t]})
                </option>
              ))}
            </Select>
            <Button type="submit" variant="secondary">
              Filteren
            </Button>
          </form>

          <p className="text-sm text-muted-foreground">
            {filterActive
              ? `${visible.length} van ${plural(queue.length, "aanvraag", "aanvragen")}`
              : plural(queue.length, "aanvraag", "aanvragen")}
          </p>

          {visible.length === 0 ? (
            <Card>
              <CardContent className="py-6 text-center text-sm text-muted-foreground">
                Geen aanvragen die overeenkomen met de huidige filters.
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {visible.map((c) => (
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
                        {(() => {
                          const count = demand[c.type as CredentialType] ?? 0;
                          if (count === 0) return null;
                          return (
                            <Badge
                              variant={demandLevel(count) === "high" ? "accent" : "muted"}
                              title="Aantal open opdrachten dat dit certificaattype (verplicht) vereist"
                            >
                              Gevraagd · {plural(count, "open opdracht", "open opdrachten")}
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
                        Ingediend door {c.freelancerProfile.user.name} (
                        {c.freelancerProfile.user.email})
                      </p>
                    </div>

                    {c.document && (
                      <DocumentPreview documentId={c.document.id} mimeType={c.document.mimeType} />
                    )}

                    <div className="space-y-3 border-t border-border pt-3">
                      <div className="flex flex-wrap items-center gap-2">
                        <VerifyForm action={verifyCredentialState.bind(null, c.id)} />
                        <RejectForm action={rejectCredentialState.bind(null, c.id)} />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
