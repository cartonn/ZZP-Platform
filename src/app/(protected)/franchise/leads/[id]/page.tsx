import { type Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Mail, Phone, UserCheck } from "lucide-react";
import { requireRole } from "@/lib/authz";
import { getLeadDetail } from "@/lib/franchise/leads";
import { LEAD_STATUS_LABEL, LEAD_STATUS_VARIANT } from "@/lib/leads";
import { PageHeader } from "@/components/ui/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { formatDateTimeNl, formatDateShortNl } from "@/lib/format-date";
import { StatusControl } from "../status-control";
import { ContactForm } from "./contact-form";

export const metadata: Metadata = { title: "Lead · Bemiddeling" };

// Een opvolgdatum is "te laat" als die vóór vandaag valt (op dagniveau, UTC-datuminvoer).
function followUpState(date: Date | null, now: Date): "overdue" | "upcoming" | null {
  if (!date) return null;
  const day = (d: Date) => Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate());
  return day(date) < day(now) ? "overdue" : "upcoming";
}

export default async function LeadDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const actor = await requireRole("FRANCHISER");
  const lead = await getLeadDetail(actor, id);
  if (!lead) notFound();

  const now = new Date();
  const followUp = followUpState(lead.nextFollowUp, now);
  // Prefill alleen een TOEKOMSTIGE opvolgdatum. Een verlopen datum laten we leeg, zodat het loggen
  // van een contactmoment de "te laat"-datum niet stilzwijgend opnieuw wegschrijft (de lead bleef
  // anders rood "te laat" terwijl er net contact was). De franchiser zet desgewenst een nieuwe datum.
  const followUpDefault =
    lead.nextFollowUp && lead.nextFollowUp.getTime() > now.getTime()
      ? lead.nextFollowUp.toISOString().slice(0, 10)
      : "";

  // "Wordt klant" is alleen zinvol zolang de lead nog loopt (niet al klant, niet afgevallen).
  const canConvert = lead.status === "KOUD" || lead.status === "WARM";
  const onboardingHref =
    `/franchise/opdrachtgevers/nieuw?leadId=${lead.id}` +
    `&naam=${encodeURIComponent(lead.organizationName)}` +
    (lead.contactName ? `&contact=${encodeURIComponent(lead.contactName)}` : "") +
    (lead.email ? `&email=${encodeURIComponent(lead.email)}` : "");

  return (
    <div className="space-y-6">
      <div>
        <Button asChild variant="ghost" size="sm" className="-ml-2 mb-2">
          <Link href="/franchise/leads">
            <ArrowLeft className="size-4" aria-hidden /> Leads
          </Link>
        </Button>
        <PageHeader
          title={lead.organizationName}
          description={lead.contactName ? `Contact: ${lead.contactName}` : "Geen contactpersoon"}
          action={
            <Badge variant={LEAD_STATUS_VARIANT[lead.status]} className="text-sm">
              {LEAD_STATUS_LABEL[lead.status]}
            </Badge>
          }
        />
      </div>

      <Card>
        <CardContent className="space-y-4 p-5">
          <div className="grid gap-3 text-sm sm:grid-cols-2">
            {lead.email && (
              <a
                href={`mailto:${lead.email}`}
                className="flex items-center gap-2 text-foreground hover:underline"
              >
                <Mail className="size-4 text-muted-foreground" aria-hidden /> {lead.email}
              </a>
            )}
            {lead.phone && (
              <a
                href={`tel:${lead.phone}`}
                className="flex items-center gap-2 text-foreground hover:underline"
              >
                <Phone className="size-4 text-muted-foreground" aria-hidden /> {lead.phone}
              </a>
            )}
          </div>
          {lead.notes && <p className="text-sm text-muted-foreground">{lead.notes}</p>}

          {lead.nextFollowUp && (
            <p className="text-sm">
              <span className="text-muted-foreground">Volgende opvolging: </span>
              <span
                className={
                  followUp === "overdue" ? "font-medium text-danger" : "font-medium text-foreground"
                }
              >
                {formatDateShortNl(lead.nextFollowUp)}
                {followUp === "overdue" && " — te laat"}
              </span>
            </p>
          )}

          <div className="border-t border-border pt-4">
            <StatusControl
              leadId={lead.id}
              status={lead.status}
              organizationName={lead.organizationName}
            />
          </div>

          {canConvert && (
            <div className="border-t border-border pt-4">
              <Button asChild>
                <Link href={onboardingHref}>
                  <UserCheck className="size-4" aria-hidden /> Wordt klant — onboarden
                </Link>
              </Button>
              <p className="mt-1.5 text-xs text-muted-foreground">
                Start de onboarding-wizard met de gegevens van deze lead alvast ingevuld.
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      <section className="space-y-3">
        <h2 className="text-sm font-semibold tracking-tight">Contactlogboek</h2>
        <Card>
          <CardContent className="space-y-4 p-5">
            <ContactForm leadId={lead.id} defaultFollowUp={followUpDefault} />
            {lead.contacts.length === 0 ? (
              <EmptyState
                title="Nog geen contactmomenten"
                description="Leg vast wat je hebt besproken — zo bouw je de geschiedenis op."
              />
            ) : (
              <ol className="space-y-3 border-t border-border pt-4">
                {[...lead.contacts].reverse().map((c) => (
                  <li key={c.id} className="flex gap-3 text-sm">
                    <div className="mt-1.5 size-2 shrink-0 rounded-full bg-border" aria-hidden />
                    <div className="min-w-0">
                      <p className="whitespace-pre-wrap">{c.body}</p>
                      <p className="mt-0.5 text-xs text-muted-foreground">
                        {c.authorName ? `${c.authorName} · ` : ""}
                        {formatDateTimeNl(c.createdAt)}
                      </p>
                    </div>
                  </li>
                ))}
              </ol>
            )}
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
