import { type Metadata } from "next";
import { Download } from "lucide-react";
import { requireRole } from "@/lib/authz";
import { prisma } from "@/lib/db";
import { type CredentialType } from "@/lib/enums";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { ExpiryButton } from "./expiry-button";
import { rejectCredential, verifyCredential } from "./actions";

export const metadata: Metadata = { title: "Verificaties · ZZP Platform" };

const TYPE_LABEL: Record<CredentialType, string> = {
  VOG: "VOG", DIPLOMA: "Diploma", CERTIFICATE: "Certificaat", INSURANCE: "Verzekering", LICENSE: "Licentie", OTHER: "Overig",
};

function fmt(d: Date | null) {
  return d ? d.toISOString().slice(0, 10) : null;
}

export default async function VerificatiesPage() {
  await requireRole("ADMIN");

  const queue = await prisma.credential.findMany({
    where: { status: "SUBMITTED" },
    orderBy: { updatedAt: "asc" }, // oudste aanvraag eerst
    include: {
      document: { select: { id: true } },
      freelancerProfile: { select: { user: { select: { name: true, email: true } } } },
    },
  });

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold tracking-tight">Verificaties</h1>
          <p className="text-sm text-muted-foreground">
            Beoordeel ingediende certificaten. {queue.length} in de wachtrij.
          </p>
        </div>
        <ExpiryButton />
      </header>

      {queue.length === 0 ? (
        <Card>
          <CardContent className="text-center text-sm text-muted-foreground">
            Geen openstaande verificatieaanvragen.
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {queue.map((c) => (
            <Card key={c.id}>
              <CardContent className="space-y-3">
                <div>
                  <p className="font-medium">{c.title}</p>
                  <p className="text-sm text-muted-foreground">
                    {TYPE_LABEL[c.type as CredentialType]}
                    {c.issuer ? ` · ${c.issuer}` : ""}
                    {fmt(c.issuedAt) ? ` · uitgegeven ${fmt(c.issuedAt)}` : ""}
                    {fmt(c.expiresAt) ? ` · vervalt ${fmt(c.expiresAt)}` : ""}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Ingediend door {c.freelancerProfile.user.name} ({c.freelancerProfile.user.email})
                  </p>
                </div>

                {c.document && (
                  <Button asChild variant="secondary" size="sm">
                    <a href={`/api/documents/${c.document.id}`} target="_blank" rel="noreferrer">
                      <Download className="size-3.5" aria-hidden /> Bewijsstuk bekijken
                    </a>
                  </Button>
                )}

                <div className="flex flex-col gap-3 border-t border-border pt-3 sm:flex-row sm:items-end">
                  <form action={verifyCredential.bind(null, c.id)}>
                    <Button type="submit" size="sm">Goedkeuren</Button>
                  </form>
                  <form action={rejectCredential.bind(null, c.id)} className="flex flex-1 flex-col gap-2 sm:flex-row sm:items-end">
                    <div className="flex-1">
                      <label htmlFor={`reason-${c.id}`} className="mb-1 block text-xs font-medium">Reden van afwijzing</label>
                      <Textarea id={`reason-${c.id}`} name="reason" rows={2} required minLength={3} maxLength={500} placeholder="Verplicht bij afwijzen…" />
                    </div>
                    <Button type="submit" variant="danger" size="sm">Afwijzen</Button>
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
