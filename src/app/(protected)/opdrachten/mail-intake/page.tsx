import { type Metadata } from "next";
import Link from "next/link";
import { BadgeEuro, CalendarClock, Inbox, Laptop, Mail, MapPin } from "lucide-react";
import { requireRole } from "@/lib/authz";
import { prisma } from "@/lib/db";
import { type WorkMode } from "@/lib/enums";
import { formatDateShortNl, formatDateTimeNl } from "@/lib/format-date";
import { plural } from "@/lib/plural";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { PageHeader } from "@/components/ui/page-header";
import {
  acceptMailIntakeState,
  disableMailIntakeAliasState,
  dismissMailIntakeState,
  reopenMailIntakeState,
  rotateMailIntakeAliasState,
} from "./actions";
import { AcceptIntakeForm, DismissIntakeForm, ReopenIntakeForm } from "./intake-forms";
import { CreateAliasForm, DisableAliasForm, RotateAliasForm } from "./alias-forms";
import { formatMailIntakeAddress } from "@/lib/mail-intake";

export const metadata: Metadata = { title: "Mail-intake · Handslag" };

const WORK_MODE_LABEL: Record<WorkMode, string> = {
  REMOTE: "Remote",
  ONSITE: "Op locatie",
  HYBRID: "Hybride",
};

/** Compact chip-rijtje met wat de parser uit de mail haalde; niets herkend → geen ruis. */
function ParsedChips(intake: {
  parsedLocation: string | null;
  parsedRateMin: number | null;
  parsedRateMax: number | null;
  parsedStartDate: Date | null;
  parsedWorkMode: string | null;
}) {
  const rate =
    intake.parsedRateMin != null
      ? intake.parsedRateMax != null
        ? `€ ${intake.parsedRateMin}–${intake.parsedRateMax}/u`
        : `€ ${intake.parsedRateMin}/u`
      : null;
  const workMode = WORK_MODE_LABEL[intake.parsedWorkMode as WorkMode] ?? null;
  const chips = [
    intake.parsedLocation && { icon: MapPin, label: intake.parsedLocation },
    rate && { icon: BadgeEuro, label: rate },
    intake.parsedStartDate && {
      icon: CalendarClock,
      label: `Start ${formatDateShortNl(intake.parsedStartDate)}`,
    },
    workMode && { icon: Laptop, label: workMode },
  ].filter(Boolean) as { icon: typeof MapPin; label: string }[];
  if (chips.length === 0) return null;
  return (
    <div className="flex flex-wrap gap-1.5">
      {chips.map(({ icon: Icon, label }) => (
        <Badge key={label} variant="muted" className="gap-1">
          <Icon className="size-3" aria-hidden />
          {label}
        </Badge>
      ))}
    </div>
  );
}

export default async function MailIntakePage() {
  const actor = await requireRole("CLIENT");

  const company = await prisma.company.findUnique({
    where: { userId: actor.id },
    select: { id: true, mailIntakeAlias: true },
  });

  if (!company) {
    return (
      <div className="space-y-6">
        <PageHeader
          eyebrow="Opdrachten · mail-intake"
          title="Mail-intake"
          description="Dienstaanvragen die per e-mail binnenkomen, klaar om te beoordelen."
        />
        <Card>
          <CardContent className="p-6 sm:p-8">
            <EmptyState
              icon={Inbox}
              title="Eerst een bedrijfsprofiel"
              description="Rond je bedrijfsprofiel af om aanvragen per e-mail te kunnen ontvangen."
              action={{ label: "Naar bedrijfsprofiel", href: "/bedrijf" }}
            />
          </CardContent>
        </Card>
      </div>
    );
  }

  const intakes = await prisma.mailIntake.findMany({
    where: { companyId: company.id },
    orderBy: { receivedAt: "desc" },
    take: 50, // bounded: reviewqueue toont de recentste 50; ouder werk is afgehandeld
  });
  const open = intakes.filter((i) => i.status === "NEW").reverse(); // oudste eerst beoordelen
  const handled = intakes.filter((i) => i.status !== "NEW").slice(0, 10);

  // Volledig plus-adres alleen tonen wanneer de beheerder het intake-basisadres heeft gezet
  // (MAIL_INTAKE_ADDRESS, zie MENSENWERK par. 2b); anders tonen we het kale alias-token.
  const baseAddress = process.env.MAIL_INTAKE_ADDRESS ?? "";
  const intakeAddress = company.mailIntakeAlias
    ? formatMailIntakeAddress(baseAddress, company.mailIntakeAlias)
    : null;

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Opdrachten · mail-intake"
        title="Mail-intake"
        description="Aanvragen die per e-mail binnenkomen staan hier klaar — beoordelen, overnemen als concept-opdracht en publiceren via de gewone flow. Geen overtypen meer."
      />

      <Card>
        <CardContent className="space-y-3 p-4 text-sm">
          <div className="flex items-start gap-3 text-muted-foreground">
            <Mail className="mt-0.5 size-4 shrink-0 text-foreground" aria-hidden />
            <p>
              Mail een aanvraag vanaf je <strong>account-e-mailadres</strong> naar het intake-adres
              van het platform, of geef je aanvragers je <strong>eigen intake-adres</strong>{" "}
              hieronder — dan hoeven zij geen account te hebben. Herkende velden zoals{" "}
              <em>Functie, Locatie, Tarief, Startdatum</em> en <em>Werkwijze</em> worden alvast
              ingevuld; jij houdt de controle en publiceert zelf.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3 border-t pt-3">
            {company.mailIntakeAlias ? (
              <>
                <div className="min-w-0 flex-1">
                  <p className="text-xs text-muted-foreground">Jouw intake-adres</p>
                  {intakeAddress ? (
                    <code className="break-all text-sm">{intakeAddress}</code>
                  ) : (
                    <p className="text-sm">
                      Alias <code className="break-all">{company.mailIntakeAlias}</code>{" "}
                      <span className="text-muted-foreground">
                        (het intake-domein is nog niet geconfigureerd — het volledige adres
                        verschijnt hier zodra dat is ingericht)
                      </span>
                    </p>
                  )}
                  <p className="mt-1 text-xs text-muted-foreground">
                    Deel dit adres alleen met partijen die aanvragen mogen indienen; vernieuwen
                    trekt het oude adres in.
                  </p>
                </div>
                <div className="flex gap-2">
                  <RotateAliasForm action={rotateMailIntakeAliasState} />
                  <DisableAliasForm action={disableMailIntakeAliasState} />
                </div>
              </>
            ) : (
              <>
                <p className="min-w-0 flex-1 text-xs text-muted-foreground">
                  Nog geen eigen intake-adres: alleen mail vanaf je account-e-mailadres wordt nu
                  aangenomen. Genereer een adres om ook externe aanvragers te laten mailen.
                </p>
                <CreateAliasForm action={rotateMailIntakeAliasState} />
              </>
            )}
          </div>
        </CardContent>
      </Card>

      <section className="space-y-3" aria-label="Te beoordelen aanvragen">
        <h2 className="text-sm font-semibold">
          Te beoordelen{" "}
          <span className="font-normal text-muted-foreground">
            ({plural(open.length, "aanvraag", "aanvragen")})
          </span>
        </h2>
        {open.length === 0 ? (
          <Card>
            <CardContent className="p-6 sm:p-8">
              <EmptyState
                icon={Inbox}
                title="Geen openstaande aanvragen"
                description="Nieuwe aanvragen per e-mail verschijnen hier automatisch, ook buiten kantoortijden."
              />
            </CardContent>
          </Card>
        ) : (
          open.map((intake) => (
            <Card key={intake.id}>
              <CardContent className="space-y-3 p-4 sm:p-5">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="truncate font-medium">
                      {intake.parsedTitle ?? (intake.subject || "Aanvraag per e-mail")}
                    </p>
                    <p className="truncate text-xs text-muted-foreground">
                      Van {intake.fromAddress} · {formatDateTimeNl(intake.receivedAt)}
                    </p>
                  </div>
                  <Badge variant="warning">Te beoordelen</Badge>
                </div>
                <ParsedChips {...intake} />
                {intake.textBody ? (
                  <p className="line-clamp-3 whitespace-pre-line text-sm text-muted-foreground">
                    {intake.textBody}
                  </p>
                ) : null}
                <div className="flex flex-wrap items-start gap-2 border-t pt-3">
                  <AcceptIntakeForm action={acceptMailIntakeState} intakeId={intake.id} />
                  <DismissIntakeForm action={dismissMailIntakeState} intakeId={intake.id} />
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </section>

      {handled.length > 0 ? (
        <section className="space-y-3" aria-label="Afgehandelde aanvragen">
          <h2 className="text-sm font-semibold">Afgehandeld</h2>
          {handled.map((intake) => (
            <Card key={intake.id}>
              <CardContent className="flex flex-wrap items-center justify-between gap-3 p-4">
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">
                    {intake.parsedTitle ?? (intake.subject || "Aanvraag per e-mail")}
                  </p>
                  <p className="truncate text-xs text-muted-foreground">
                    Van {intake.fromAddress} · {formatDateTimeNl(intake.receivedAt)}
                    {intake.status === "DISMISSED" && intake.dismissReason
                      ? ` · Reden: ${intake.dismissReason}`
                      : null}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  {intake.status === "ACCEPTED" ? (
                    intake.jobId ? (
                      <Link
                        href={`/opdrachten/${intake.jobId}`}
                        className="text-sm text-primary underline-offset-4 hover:underline"
                      >
                        Naar opdracht
                      </Link>
                    ) : (
                      <Badge variant="success">Overgenomen</Badge>
                    )
                  ) : (
                    <>
                      <Badge variant="muted">Afgewezen</Badge>
                      <ReopenIntakeForm action={reopenMailIntakeState} intakeId={intake.id} />
                    </>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </section>
      ) : null}
    </div>
  );
}
