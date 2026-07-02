import Link from "next/link";
import { CircleAlert, Clock, Lock, PiggyBank, Receipt, Sparkles, TrendingUp } from "lucide-react";
import { type Actor } from "@/lib/authz";
import { userHasEntitlement } from "@/lib/entitlement-guard";
import { prisma } from "@/lib/db";
import { formatEuro } from "@/lib/invoices";
import { type LedgerEntry } from "@/lib/administration/overview";
import { type LedgerParty } from "@/lib/administration/ledger";
import { buildOntzorgOverview, type OntzorgAction } from "@/lib/tax/ontzorg-overview";
import { TAX_DISCLAIMER } from "@/lib/tax/config";
import { Card, CardContent } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";

const URGENCY_STYLE: Record<OntzorgAction["urgency"], string> = {
  now: "border-danger/40 bg-danger/5",
  soon: "border-warning/40 bg-warning/5",
  info: "border-border bg-muted/30",
};

const URGENCY_DOT: Record<OntzorgAction["urgency"], string> = {
  now: "bg-danger",
  soon: "bg-warning",
  info: "bg-success",
};

// Tekstequivalent van de kleur-dot — anders is urgentie alleen via kleur leesbaar (WCAG 1.4.1).
const URGENCY_LABEL: Record<OntzorgAction["urgency"], string> = {
  now: "Urgent",
  soon: "Binnenkort",
  info: "Ter info",
};

/**
 * Ontzorgd-paneel: administratie + belasting van de ZZP'er in één beeld (BTW-stand, opzij zetten,
 * urencriterium, IB-schatting). Alleen FREELANCER (de route/hub gate't rol); betaalde feature
 * (IB_VOORBEREIDING). Laadt zelf zijn data, rendert geen eigen paginakop.
 */
export async function OntzorgdPanel({ actor }: { actor: Actor }) {
  // Het Ontzorgd-dashboard (IB-jaaroverzicht) is een betaalde feature (IB_VOORBEREIDING).
  if (!(await userHasEntitlement(actor.id, "IB_VOORBEREIDING"))) {
    return (
      <Card>
        <EmptyState
          icon={Lock}
          title="Ontzorgd zit in een betaald plan"
          description="Upgrade naar Zelf-doen of hoger voor je IB-jaaroverzicht en het ontzorgd-dashboard."
          action={{ label: "Bekijk abonnementen", href: "/abonnement" }}
        />
      </Card>
    );
  }

  const now = new Date();
  const year = now.getUTCFullYear();

  const [rows, hoursAgg, indirectAgg] = await Promise.all([
    prisma.administrationEntry.findMany({ where: { ownerUserId: actor.id } }),
    prisma.performance.aggregate({
      _sum: { hours: true },
      where: {
        status: "APPROVED",
        type: "HOURS",
        collaboration: { freelancer: { userId: actor.id } },
        approvedAt: {
          gte: new Date(Date.UTC(year, 0, 1)),
          lte: new Date(Date.UTC(year, 11, 31, 23, 59, 59)),
        },
      },
    }),
    prisma.indirectHoursEntry.aggregate({
      _sum: { hours: true },
      where: {
        userId: actor.id,
        workedOn: {
          gte: new Date(Date.UTC(year, 0, 1)),
          lte: new Date(Date.UTC(year, 11, 31, 23, 59, 59)),
        },
      },
    }),
  ]);

  const entries: LedgerEntry[] = rows.map((r) => ({
    party: r.party as LedgerParty,
    account: r.account as LedgerEntry["account"],
    debitCents: r.debitCents,
    creditCents: r.creditCents,
    occurredAt: r.occurredAt,
  }));

  const directHours = Math.round(hoursAgg._sum.hours ?? 0);
  const indirectHoursTotal = Math.round(indirectAgg._sum.hours ?? 0);
  const o = buildOntzorgOverview({ entries, directHours, indirectHours: indirectHoursTotal, now });

  const hasData = entries.length > 0 || directHours > 0 || indirectHoursTotal > 0;

  if (!hasData) {
    return (
      <Card>
        <EmptyState
          icon={Sparkles}
          title="Nog niets te ontzorgen"
          description="Zodra je eerste opdracht via een samenwerking loopt, zie je hier je BTW-stand, wat je opzij moet zetten en je voortgang naar de zelfstandigenaftrek."
        />
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Volgende acties — het hart van het scherm */}
      {o.actions.length > 0 && (
        <section className="space-y-2">
          <h2 className="text-sm font-semibold">Wat nu te doen</h2>
          <div className="space-y-2">
            {o.actions.map((a) => (
              <div
                key={a.code}
                className={`flex items-center gap-3 rounded-lg border px-4 py-3 ${URGENCY_STYLE[a.urgency]}`}
              >
                <span
                  className={`size-2 shrink-0 rounded-full ${URGENCY_DOT[a.urgency]}`}
                  aria-hidden
                />
                <span className="sr-only">{URGENCY_LABEL[a.urgency]}: </span>
                <span className="text-sm">{a.label}</span>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Kerncijfers */}
      <section className="grid gap-3 sm:grid-cols-3">
        <Card>
          <CardContent className="space-y-1 py-4">
            <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <PiggyBank className="size-3.5" aria-hidden /> Opzij zetten
            </p>
            <p className="text-lg font-semibold tabular-nums">
              {formatEuro(o.reservation.totalReserveCents)}
            </p>
            <p className="text-xs text-muted-foreground">
              BTW {formatEuro(o.reservation.vatReserveCents)} + IB/Zvw{" "}
              {formatEuro(o.reservation.incomeReserveCents)}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="space-y-1 py-4">
            <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <TrendingUp className="size-3.5" aria-hidden /> Beschikbaar
            </p>
            <p className="text-lg font-semibold tabular-nums">{formatEuro(o.availableCents)}</p>
            <p className="text-xs text-muted-foreground">van {formatEuro(o.profitCents)} winst</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="space-y-1 py-4">
            <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Receipt className="size-3.5" aria-hidden /> BTW Q{o.quarter}
            </p>
            <p className="text-lg font-semibold tabular-nums">{formatEuro(o.vatBalanceCents)}</p>
            <p className="text-xs text-muted-foreground">
              {o.vatBalanceCents >= 0 ? "af te dragen" : "terug te ontvangen"}
            </p>
          </CardContent>
        </Card>
      </section>

      {/* Urencriterium */}
      <section className="space-y-2">
        <h2 className="flex items-center gap-1.5 text-sm font-semibold">
          <Clock className="size-4" aria-hidden /> Urencriterium
        </h2>
        <Card>
          <CardContent className="space-y-3 py-4">
            <div className="flex items-end justify-between">
              <div>
                <p className="text-2xl font-semibold tabular-nums">
                  {o.hours.totalHours}
                  <span className="text-sm font-normal text-muted-foreground">
                    {" "}
                    / {o.hours.targetHours} uur
                  </span>
                </p>
                <p className="text-xs text-muted-foreground">
                  {o.hours.met
                    ? "Gehaald — je hebt recht op de zelfstandigenaftrek"
                    : o.hours.projectedMet
                      ? `Op koers (prognose ${o.hours.projectedTotal} uur)`
                      : `Dreigt niet gehaald te worden (prognose ${o.hours.projectedTotal} uur)`}
                </p>
                <p className="mt-1 text-xs tabular-nums text-muted-foreground">
                  Direct {directHours} u · indirect {indirectHoursTotal} u
                </p>
              </div>
              {!o.hours.met && (
                <span className="text-sm text-muted-foreground">
                  nog {o.hours.remainingHours} uur
                </span>
              )}
            </div>
            <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
              <div
                className={`h-full rounded-full ${o.hours.met ? "bg-success" : o.hours.projectedMet ? "bg-primary" : "bg-warning"}`}
                style={{ width: `${Math.min(100, o.hours.progressBps / 100)}%` }}
              />
            </div>
            <div>
              <Link href="/ontzorgd/uren" className="text-xs text-primary hover:underline">
                Indirecte uren bijhouden →
              </Link>
            </div>
          </CardContent>
        </Card>
      </section>

      {/* IB-schatting */}
      <section className="space-y-2">
        <h2 className="text-sm font-semibold">Inkomstenbelasting {year} (schatting)</h2>
        <Card>
          <CardContent className="space-y-1 py-3 text-sm">
            <Row label="Winst vóór aftrek" value={formatEuro(o.incomeTax.profitCents)} />
            {o.incomeTax.zelfstandigenaftrekCents > 0 && (
              <Row
                label="Zelfstandigenaftrek"
                value={`− ${formatEuro(o.incomeTax.zelfstandigenaftrekCents)}`}
              />
            )}
            {o.incomeTax.startersaftrekCents > 0 && (
              <Row
                label="Startersaftrek"
                value={`− ${formatEuro(o.incomeTax.startersaftrekCents)}`}
              />
            )}
            <Row
              label="MKB-winstvrijstelling (12,7%)"
              value={`− ${formatEuro(o.incomeTax.mkbVrijstellingCents)}`}
            />
            <Row label="Belastbare winst" value={formatEuro(o.incomeTax.taxableProfitCents)} bold />
            <div className="my-1 border-t border-border" />
            <Row label="Inkomstenbelasting (box 1)" value={formatEuro(o.incomeTax.box1Cents)} />
            <Row label="Zvw-bijdrage" value={formatEuro(o.incomeTax.zvwCents)} />
            <Row
              label={`Totaal geschat (${(o.incomeTax.effectiveRateBps / 100).toFixed(1)}% effectief)`}
              value={formatEuro(o.incomeTax.totalCents)}
              bold
            />
          </CardContent>
        </Card>
      </section>

      <div className="flex flex-wrap gap-2">
        <a
          href="/ontzorgd/aangifte"
          className="rounded-md bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground hover:opacity-90"
        >
          Wij doen je aangifte
        </a>
        <Link
          href="/financien?tab=boekhouding"
          className="rounded-md border border-border px-3 py-1.5 text-sm font-medium hover:bg-muted"
        >
          Volledige administratie
        </Link>
        <a
          href="/api/administratie/btw"
          className="rounded-md border border-border px-3 py-1.5 text-sm font-medium hover:bg-muted"
        >
          BTW-overzicht CSV
        </a>
      </div>

      <p className="flex items-start gap-1.5 text-xs text-muted-foreground">
        <CircleAlert className="mt-0.5 size-3.5 shrink-0" aria-hidden />
        {TAX_DISCLAIMER}
      </p>
    </div>
  );
}

function Row({ label, value, bold }: { label: string; value: string; bold?: boolean }) {
  return (
    <div className={`flex justify-between ${bold ? "font-medium" : ""}`}>
      <span className={bold ? "" : "text-muted-foreground"}>{label}</span>
      <span className="tabular-nums">{value}</span>
    </div>
  );
}
