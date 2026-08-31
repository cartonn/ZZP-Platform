import { type Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { CircleAlert, FileText, Lock } from "lucide-react";
import { requireActor } from "@/lib/authz";
import { prisma } from "@/lib/db";
import { userHasEntitlement } from "@/lib/entitlement-guard";
import { formatEuro } from "@/lib/invoices";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { PageHeader } from "@/components/ui/page-header";
import { FILING_STATUS_LABEL, filingStatusVariant } from "@/lib/tax-filing/labels";
import { FILING_DISCLAIMER, LOGIUS_REVOKE_URL, PARTNER_NAME } from "@/lib/tax-filing/config";
import { type TaxFilingStatus, type TaxFilingKind } from "@/lib/enums";
import { buildFilingSchedule } from "@/lib/tax-filing/filing-schedule";
import { FilingScheduleCard } from "@/components/tax/filing-schedule-card";
import { StartFilingForm } from "./start-form";
import { approveAndSubmit, revokeFiling } from "./actions";

export const metadata: Metadata = { title: "Aangifte · Handslag" };

const KIND_LABEL: Record<TaxFilingKind, string> = { IB: "Inkomstenbelasting", BTW: "BTW" };

export default async function AangiftePage() {
  const actor = await requireActor();
  if (actor.role !== "FREELANCER") redirect("/administratie");

  const [entitled, requests] = await Promise.all([
    // Canonieke entitlement-poort (isSubscriptionActive): een verlopen betaalde periode telt als FREE,
    // óók vóór de dagelijkse verval-taak draait — zodat de UI het aangiftescherm niet toont voor een
    // niet-meer-gerechtigde ZZP'er. Spiegelt de server-side check in startFiling (één bron van waarheid).
    userHasEntitlement(actor.id, "VOLLEDIG_ONTZORGD"),
    // unbounded-allow: eigenaar-scoped aggregatie voor aangifte-pagina
    prisma.taxFilingRequest.findMany({
      where: { userId: actor.id },
      orderBy: { createdAt: "desc" },
    }),
  ]);

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Het grootboek · aangifte"
        title="Wij doen je aangifte"
        description={
          <>
            Geef akkoord; {PARTNER_NAME} controleert en dient namens jou in. Jij ziet eerst het
            concept en geeft het laatste akkoord.
          </>
        }
      />

      {!entitled ? (
        <Card>
          <CardContent className="space-y-3 py-6 text-center">
            <Lock className="mx-auto size-7 text-muted-foreground" aria-hidden />
            <p className="text-sm font-medium">Onderdeel van Volledig Ontzorgd</p>
            <p className="text-sm text-muted-foreground">
              Met Volledig Ontzorgd bereiden wij je aangifte voor en laten we deze door een
              aangesloten belastingkantoor indienen.
            </p>
            <Button asChild size="sm">
              <Link href="/abonnement">Bekijk Volledig Ontzorgd</Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <>
          <section className="space-y-2">
            <h2 className="text-sm font-semibold">Aangifte-agenda</h2>
            <FilingScheduleCard
              schedule={buildFilingSchedule(
                requests.map((r) => ({
                  kind: r.kind as TaxFilingKind,
                  taxYear: r.taxYear,
                  quarter: r.quarter,
                  status: r.status as TaxFilingStatus,
                })),
                new Date(),
              )}
            />
          </section>

          {requests.length > 0 && (
            <section className="space-y-2">
              <h2 className="text-sm font-semibold">Lopende aangiftes</h2>
              <div className="space-y-2">
                {requests.map((r) => {
                  const status = r.status as TaxFilingStatus;
                  const terminal = status === "INGETROKKEN" || status === "AANSLAG_ONTVANGEN";
                  return (
                    <Card key={r.id}>
                      <CardContent className="space-y-2 py-3">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <span className="text-sm font-medium">
                            {KIND_LABEL[r.kind as TaxFilingKind]} {r.taxYear}
                            {r.quarter ? ` · Q${r.quarter}` : ""}
                          </span>
                          <Badge variant={filingStatusVariant(status)}>
                            {FILING_STATUS_LABEL[status]}
                          </Badge>
                        </div>
                        {r.conceptAmountCents != null && (
                          <p className="text-sm text-muted-foreground">
                            Concept: {formatEuro(r.conceptAmountCents)}{" "}
                            {r.kind === "IB" ? "te betalen (schatting)" : "saldo"}
                          </p>
                        )}
                        {r.submissionRef && (
                          <p className="text-xs text-muted-foreground">
                            Ontvangstbevestiging: {r.submissionRef}
                          </p>
                        )}
                        {status === "CONCEPT_KLAAR" && (
                          <div className="rounded-md border border-warning/40 bg-warning/5 px-3 py-2">
                            <p className="mb-2 text-sm">
                              Controleer het concept hierboven. Akkoord = {PARTNER_NAME} dient
                              namens jou in.
                            </p>
                            <div className="flex flex-wrap gap-2">
                              <form action={approveAndSubmit.bind(null, r.id)}>
                                <Button type="submit" size="sm">
                                  Akkoord — dien in
                                </Button>
                              </form>
                              <form action={revokeFiling.bind(null, r.id)}>
                                <Button type="submit" variant="secondary" size="sm">
                                  Machtiging intrekken
                                </Button>
                              </form>
                            </div>
                          </div>
                        )}
                        {!terminal && status !== "CONCEPT_KLAAR" && (
                          <form action={revokeFiling.bind(null, r.id)}>
                            <Button type="submit" variant="secondary" size="sm">
                              Machtiging intrekken
                            </Button>
                          </form>
                        )}
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </section>
          )}

          <section className="space-y-2">
            <h2 className="flex items-center gap-1.5 text-sm font-semibold">
              <FileText className="size-4" aria-hidden /> Nieuwe aangifte starten
            </h2>
            <Card>
              <CardContent className="py-5">
                <StartFilingForm />
              </CardContent>
            </Card>
          </section>

          <section className="space-y-1 rounded-md border border-border bg-muted/30 px-3 py-2">
            <p className="text-sm font-medium">Mijn machtigingen</p>
            <p className="text-xs text-muted-foreground">
              Je kunt een machtiging op elk moment inzien en intrekken via het officiële kanaal van
              Logius (per belastingjaar).{" "}
              <a
                href={LOGIUS_REVOKE_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="underline"
              >
                Logius machtigingen
              </a>
            </p>
          </section>
        </>
      )}

      <p className="flex items-start gap-1.5 text-xs text-muted-foreground">
        <CircleAlert className="mt-0.5 size-3.5 shrink-0" aria-hidden />
        {FILING_DISCLAIMER}
      </p>
    </div>
  );
}
