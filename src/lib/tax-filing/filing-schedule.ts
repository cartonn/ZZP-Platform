// Aangifte-agenda (administratie-ontzorging, ZZP'er): het aangiftescherm (`/ontzorgd/aangifte`) toont
// wél de lopende aangiftes, maar niet WANNEER de eerstvolgende BTW- én IB-aangifte moet — en, cruciaal,
// niet of er voor dát tijdvak al een aangifte loopt. Deze pure module verbindt de bestaande, canonieke
// deadline-logica (`vatFilingDeadline`/`previousQuarter` en `summarizeIncomeTaxDeadline`) met de
// TaxFilingRequest-historie, zodat het scherm rustig kan zeggen: "BTW Q3 · uiterlijk 31 okt · nog 61
// dagen · nog niet gestart". Geen fiscaal advies, geen geldstroom, geen nieuwe rekenlogica — puur een
// agenderingssignaal bovenop de al berekende deadlines.

import { type Quarter } from "@/lib/administration/overview";
import {
  previousQuarter,
  vatFilingDeadline,
  VAT_DEADLINE_SOON_DAYS,
} from "@/lib/administration/vat-deadline";
import { summarizeIncomeTaxDeadline } from "@/lib/administration/income-tax-deadline";
import { type TaxFilingKind, type TaxFilingStatus } from "@/lib/enums";

export type FilingScheduleUrgency = "upcoming" | "due-soon" | "overdue";

/** De velden van een TaxFilingRequest die de agenda nodig heeft om een tijdvak te matchen. */
export interface FilingRequestRef {
  kind: TaxFilingKind;
  taxYear: number;
  /** BTW: kwartaal 1-4; IB: `null`. */
  quarter: number | null;
  status: TaxFilingStatus;
}

export interface FilingScheduleItem {
  kind: TaxFilingKind;
  taxYear: number;
  /** BTW: het aan te geven kwartaal; IB: `null`. */
  quarter: Quarter | null;
  /** Uiterste indieningsdatum (inclusief), UTC-middernacht — spiegelt de canonieke deadline-libs. */
  deadline: Date;
  /** Hele kalenderdagen tot de deadline; 0 = vandaag nog op tijd, negatief = verstreken (alleen BTW). */
  daysUntil: number;
  urgency: FilingScheduleUrgency;
  /** Status van een reeds lopende aangifte voor dit tijdvak (nieuwste, niet-ingetrokken), anders null. */
  existingStatus: TaxFilingStatus | null;
  /** True zodra de deadline nabij/verstreken is én er nog geen aangifte voor dit tijdvak loopt. */
  needsStart: boolean;
}

export interface FilingSchedule {
  btw: FilingScheduleItem;
  ib: FilingScheduleItem;
}

/** Hele kalenderdagen van `now` tot `deadline` (beide genormaliseerd naar de kalenderdag, UTC).
 * Bewust identiek aan de private helper in `vat-deadline.ts`/`income-tax-deadline.ts` (kalenderdag-
 * gebaseerd, niet uur-gevoelig), zodat de aftelling hier niet drift t.o.v. die canonieke signalen. */
function wholeDaysUntil(now: Date, deadline: Date): number {
  const nowDay = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate());
  const deadlineDay = Date.UTC(
    deadline.getUTCFullYear(),
    deadline.getUTCMonth(),
    deadline.getUTCDate(),
  );
  return Math.round((deadlineDay - nowDay) / 86_400_000);
}

/**
 * De status van een lopende aangifte voor dit tijdvak (`kind`, `taxYear`, `quarter`), of `null` als er
 * geen loopt. Een INGETROKKEN aangifte telt niet als "loopt" — na intrekken is het tijdvak weer open,
 * dus dan mag de agenda opnieuw tot starten aansporen. `requests` wordt nieuwste-eerst aangeleverd
 * (de aangiftepagina sorteert al `createdAt desc`), dus de eerste niet-ingetrokken match is de meest
 * recente stand. Puur.
 */
function existingFilingStatus(
  requests: readonly FilingRequestRef[],
  kind: TaxFilingKind,
  taxYear: number,
  quarter: number | null,
): TaxFilingStatus | null {
  const match = requests.find(
    (r) =>
      r.kind === kind &&
      r.taxYear === taxYear &&
      r.quarter === quarter &&
      r.status !== "INGETROKKEN",
  );
  return match ? match.status : null;
}

function statusForVatDays(daysUntil: number): FilingScheduleUrgency {
  if (daysUntil < 0) return "overdue";
  if (daysUntil <= VAT_DEADLINE_SOON_DAYS) return "due-soon";
  return "upcoming";
}

/**
 * Bouwt de aangifte-agenda: de eerstvolgende BTW-aangifte (het meest recent afgesloten kwartaal) en de
 * eerstvolgende IB-aangifte (forward-looking, nooit verstreken), elk verrijkt met of er al een aangifte
 * voor dat tijdvak loopt. `needsStart` is de enige actie-flag: nabij/verstreken deadline zonder lopende
 * aangifte. Puur — `now` wordt geïnjecteerd; hergebruikt de canonieke deadline-libs, geen eigen regels.
 */
export function buildFilingSchedule(
  requests: readonly FilingRequestRef[],
  now: Date,
): FilingSchedule {
  // BTW — het net afgesloten kwartaal is nu aan de beurt (NL-regel via vatFilingDeadline).
  const { year: btwYear, quarter: btwQuarter } = previousQuarter(now);
  const btwDeadline = vatFilingDeadline(btwYear, btwQuarter);
  const btwDays = wholeDaysUntil(now, btwDeadline);
  const btwUrgency = statusForVatDays(btwDays);
  const btwExisting = existingFilingStatus(requests, "BTW", btwYear, btwQuarter);
  const btw: FilingScheduleItem = {
    kind: "BTW",
    taxYear: btwYear,
    quarter: btwQuarter,
    deadline: btwDeadline,
    daysUntil: btwDays,
    urgency: btwUrgency,
    existingStatus: btwExisting,
    needsStart: btwUrgency !== "upcoming" && btwExisting === null,
  };

  // IB — de eerstvolgende nog-niet-verstreken jaardeadline (canoniek forward-looking).
  const ibSummary = summarizeIncomeTaxDeadline(now);
  const ibExisting = existingFilingStatus(requests, "IB", ibSummary.taxYear, null);
  const ib: FilingScheduleItem = {
    kind: "IB",
    taxYear: ibSummary.taxYear,
    quarter: null,
    deadline: ibSummary.deadline,
    daysUntil: ibSummary.daysUntil,
    // summarizeIncomeTaxDeadline levert nooit "overdue" (forward-looking); map 1-op-1.
    urgency: ibSummary.status,
    existingStatus: ibExisting,
    needsStart: ibSummary.status === "due-soon" && ibExisting === null,
  };

  return { btw, ib };
}
