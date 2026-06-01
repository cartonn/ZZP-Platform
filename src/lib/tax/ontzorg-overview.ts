// Ontzorg-overzicht: brengt BTW-stand, belastingreservering, urencriterium en IB-schatting
// samen tot één beeld voor de ZZP'er ("wat moet ik nu?"). Pure aggregator over grootboekregels
// + uren, zodat de pagina alleen hoeft te laden en te tonen. Indicatief (zie TAX_DISCLAIMER).

import {
  annualSummary,
  quarterOf,
  vatReturn,
  type LedgerEntry,
  type Quarter,
} from "@/lib/administration/overview";
import { estimateIncomeTax, type IncomeTaxEstimate } from "@/lib/tax/income-tax";
import {
  reservationAdvice,
  availableToWithdrawCents,
  type ReservationAdvice,
} from "@/lib/tax/reservation";
import { hoursCriterion, type HoursCriterion } from "@/lib/tax/hours-criterion";
import { VAT_DEADLINES_2026, KOR_THRESHOLD_CENTS } from "@/lib/tax/config";

export interface OntzorgInput {
  entries: readonly LedgerEntry[];
  directHours: number;
  indirectHours: number;
  now: Date;
  starter?: boolean;
}

export interface OntzorgAction {
  /** Stabiele code voor tests/telemetrie. */
  code: string;
  /** Nederlandse, concrete actie ("dien BTW Q2 in vóór 31 juli"). */
  label: string;
  urgency: "info" | "soon" | "now";
}

export interface OntzorgOverview {
  year: number;
  quarter: Quarter;
  vatBalanceCents: number; //        saldo lopende kwartaal-BTW
  vatDeadline: string | null; //     ISO-datum deadline lopend kwartaal
  profitCents: number; //            winst-tot-nu (omzet − kosten)
  revenueCents: number;
  costCents: number;
  reservation: ReservationAdvice;
  availableCents: number; //         beschikbaar om uit te keren
  hours: HoursCriterion;
  incomeTax: IncomeTaxEstimate;
  korApproaching: boolean; //        nadert de €20.000-grens (>80%)
  actions: OntzorgAction[]; //       volgende beste acties, gesorteerd op urgentie
}

const MS_PER_DAY = 1000 * 60 * 60 * 24;

export function buildOntzorgOverview(input: OntzorgInput): OntzorgOverview {
  const year = input.now.getUTCFullYear();
  const quarter = quarterOf(input.now);
  const summary = annualSummary(input.entries, "FREELANCER", year);
  const profitCents = Math.max(0, summary.revenueCents - summary.costCents);

  const vat = vatReturn(input.entries, "FREELANCER", year, quarter);
  const vatDeadline = VAT_DEADLINES_2026[quarter] ?? null;

  const hours = hoursCriterion({
    directHours: input.directHours,
    indirectHours: input.indirectHours,
    now: input.now,
  });

  const reservation = reservationAdvice({
    profitCents,
    urencriteriumMet: hours.met,
    starter: input.starter,
    currentVatBalanceCents: vat.balanceCents,
  });

  const incomeTax = estimateIncomeTax({
    profitCents,
    urencriteriumMet: hours.met,
    starter: input.starter,
  });

  const korApproaching =
    summary.revenueCents >= Math.round(KOR_THRESHOLD_CENTS * 0.8) &&
    summary.revenueCents < KOR_THRESHOLD_CENTS;

  const actions = buildActions({
    vatBalanceCents: vat.balanceCents,
    vatDeadline,
    reservation,
    hours,
    korApproaching,
    now: input.now,
  });

  return {
    year,
    quarter,
    vatBalanceCents: vat.balanceCents,
    vatDeadline,
    profitCents,
    revenueCents: summary.revenueCents,
    costCents: summary.costCents,
    reservation,
    availableCents: availableToWithdrawCents(profitCents, reservation),
    hours,
    incomeTax,
    korApproaching,
    actions,
  };
}

function buildActions(args: {
  vatBalanceCents: number;
  vatDeadline: string | null;
  reservation: ReservationAdvice;
  hours: HoursCriterion;
  korApproaching: boolean;
  now: Date;
}): OntzorgAction[] {
  const actions: OntzorgAction[] = [];

  if (args.vatBalanceCents > 0 && args.vatDeadline) {
    const due = new Date(args.vatDeadline + "T23:59:59Z");
    const daysLeft = Math.floor((due.getTime() - args.now.getTime()) / MS_PER_DAY);
    const urgency = daysLeft <= 5 ? "now" : daysLeft <= 14 ? "soon" : "info";
    actions.push({
      code: "VAT_SUBMIT",
      label: `Dien je BTW-aangifte in vóór ${formatDateNl(args.vatDeadline)}`,
      urgency,
    });
  }

  if (args.reservation.totalReserveCents > 0) {
    actions.push({
      code: "RESERVE",
      label: `Zet ${formatEuroShort(args.reservation.totalReserveCents)} opzij voor de belasting`,
      urgency: "info",
    });
  }

  if (!args.hours.met && args.hours.projectedMet) {
    actions.push({
      code: "HOURS_ON_TRACK",
      label: `Nog ${args.hours.remainingHours} uur tot de zelfstandigenaftrek — je ligt op koers`,
      urgency: "info",
    });
  } else if (!args.hours.met && !args.hours.projectedMet) {
    actions.push({
      code: "HOURS_AT_RISK",
      label: `Nog ${args.hours.remainingHours} uur tot de zelfstandigenaftrek — dreigt niet gehaald te worden`,
      urgency: "soon",
    });
  }

  if (args.korApproaching) {
    actions.push({
      code: "KOR_THRESHOLD",
      label: "Je nadert de KOR-grens van €20.000 — let op de BTW-gevolgen",
      urgency: "soon",
    });
  }

  const order = { now: 0, soon: 1, info: 2 } as const;
  return actions.sort((a, b) => order[a.urgency] - order[b.urgency]);
}

function formatDateNl(iso: string): string {
  const [y, m, d] = iso.split("-").map(Number);
  const months = [
    "januari",
    "februari",
    "maart",
    "april",
    "mei",
    "juni",
    "juli",
    "augustus",
    "september",
    "oktober",
    "november",
    "december",
  ];
  return `${d} ${months[(m ?? 1) - 1]} ${y}`;
}

function formatEuroShort(cents: number): string {
  return `€${(cents / 100).toLocaleString("nl-NL", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
}
