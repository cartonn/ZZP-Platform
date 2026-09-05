// Aanmaning-sjabloon generator (§4 zijpad "Betaling te laat").
// Pure: geen DB-toegang, volledig testbaar.
//
// De brief is STAGE-BEWUST: subject, toon en de verzuim-alinea (rente + incassokosten) volgen de
// bestaande aanmaningsladder (`DUNNING_STAGES` → `currentDunningStage`), dezelfde bron die de
// notificaties en het debiteurenoverzicht gebruiken. Zo spreekt de brief nooit het platform tegen
// (een factuur die elders "Laatste aanmaning" heet, is geen vriendelijke "Betalingsherinnering")
// en dreigt een eerste, vriendelijke herinnering niet meteen met rente/incassokosten — die horen
// pas bij de geëscaleerde aanmaningen (Eerste aanmaning en verder).

import { formatIban } from "@/lib/fiscal";
import { summarizeOverdueCharges } from "@/lib/collection-costs";
import { currentDunningStage } from "@/lib/payment-reminders";
import { type DunningLevel } from "@/lib/config";

export interface AanmaningInput {
  freelancerName: string;
  companyName: string;
  invoiceNumber: string;
  jobTitle: string;
  issuedAt: Date | null;
  dueAt: Date | null;
  totalCents: number;
  /** Genormaliseerd IBAN van de crediteur; leeg/afwezig → placeholder in de brief. */
  iban?: string | null;
  /** Jaarrente (basispunten) voor de indicatieve handelsrente; standaard de wettelijke richtwaarde. */
  interestRateBps?: number;
  now?: Date;
}

export interface AanmaningData {
  freelancerName: string;
  companyName: string;
  invoiceNumber: string;
  jobTitle: string;
  issuedAtFormatted: string;
  dueAtFormatted: string;
  totalFormatted: string;
  newDeadlineFormatted: string;
  daysPastDue: number;
  letterDateFormatted: string;
  ibanFormatted: string;
  /** Bereikt aanmaningsniveau (uit `DUNNING_STAGES`); REMINDER wanneer (nog) niet verlopen. */
  level: DunningLevel;
  /** Nederlands label van `level` ("Betalingsherinnering" … "Laatste aanmaning"). */
  stageLabel: string;
  /**
   * True zodra de brief wettelijke rente/incassokosten aankondigt. Gated op het aanmaningsniveau:
   * de vriendelijke eerste Betalingsherinnering (REMINDER) dreigt nog NIET met kosten — die
   * verschijnen pas vanaf de Eerste aanmaning (FIRST_NOTICE), en alleen als er iets te claimen valt.
   */
  hasCharges: boolean;
  /** Opgebouwde wettelijke handelsrente (geformatteerd). */
  interestFormatted: string;
  /** Buitengerechtelijke incassokosten volgens de WIK-staffel (geformatteerd). */
  collectionCostsFormatted: string;
  /** Hoofdsom + rente + incassokosten (geformatteerd). */
  totalWithChargesFormatted: string;
  /** Indicatieve jaarrente als percentage-tekst (bv. "8"). */
  interestRatePctFormatted: string;
}

function fmtDate(d: Date | null): string {
  if (!d) return "—";
  return d.toLocaleDateString("nl-NL", { day: "numeric", month: "long", year: "numeric" });
}

function fmtEuro(cents: number): string {
  return new Intl.NumberFormat("nl-NL", { style: "currency", currency: "EUR" }).format(cents / 100);
}

export function buildAanmaningData(input: AanmaningInput): AanmaningData {
  const now = input.now ?? new Date();
  const daysPastDue = input.dueAt
    ? Math.max(0, Math.floor((now.getTime() - input.dueAt.getTime()) / 86_400_000))
    : 0;
  const newDeadline = new Date(now.getTime() + 14 * 86_400_000);

  // Eén bron van waarheid voor het niveau: dezelfde ladder die notificaties/debiteurenoverzicht
  // gebruiken. `currentDunningStage` geeft null vóór de vervaldag → dan is er niets te manen.
  const stage = currentDunningStage(input.dueAt, now);
  const level: DunningLevel = stage?.level ?? "REMINDER";
  const stageLabel = stage?.label ?? "Betalingsherinnering";

  const charges = summarizeOverdueCharges({
    principalCents: input.totalCents,
    dueAt: input.dueAt,
    now,
    annualRateBps: input.interestRateBps,
  });

  // De verzuim-alinea (rente + incassokosten) verschijnt pas vanaf de Eerste aanmaning: een
  // vriendelijke eerste herinnering dreigt nog niet met kosten.
  const hasCharges = level !== "REMINDER" && charges.hasCharges;

  return {
    freelancerName: input.freelancerName,
    companyName: input.companyName,
    invoiceNumber: input.invoiceNumber,
    jobTitle: input.jobTitle,
    issuedAtFormatted: fmtDate(input.issuedAt),
    dueAtFormatted: fmtDate(input.dueAt),
    totalFormatted: fmtEuro(input.totalCents),
    newDeadlineFormatted: fmtDate(newDeadline),
    daysPastDue,
    letterDateFormatted: fmtDate(now),
    ibanFormatted: input.iban ? formatIban(input.iban) : "[uw IBAN]",
    level,
    stageLabel,
    hasCharges,
    interestFormatted: fmtEuro(charges.interestCents),
    collectionCostsFormatted: fmtEuro(charges.collectionCostsCents),
    totalWithChargesFormatted: fmtEuro(charges.totalWithChargesCents),
    interestRatePctFormatted: (charges.interestRateBps / 100)
      .toLocaleString("nl-NL", { maximumFractionDigits: 2 })
      .replace(/,00$/, ""),
  };
}

/**
 * Openingszin per niveau — dezelfde feiten (bedrag, uitgiftedatum, opdracht), oplopende toon:
 * vriendelijk (REMINDER) → feitelijk-dringend (FIRST) → sommatie (SECOND) → verzuim (FINAL).
 */
function openingSentence(d: AanmaningData): string {
  const invoice = `bovengenoemde factuur ten bedrage van ${d.totalFormatted}, uitgeschreven op \
${d.issuedAtFormatted} voor werkzaamheden betreffende "${d.jobTitle}"`;
  switch (d.level) {
    case "FIRST_NOTICE":
      return `Ondanks onze eerdere betalingsherinnering ontvingen wij nog geen betaling van ${invoice}.`;
    case "SECOND_NOTICE":
      return `Wij hebben u reeds meermaals verzocht ${invoice} te voldoen. Tot op heden bleef \
betaling uit.`;
    case "FINAL_NOTICE":
      return `Dit is onze laatste aanmaning met betrekking tot ${invoice}. U bent in verzuim.`;
    case "REMINDER":
    default:
      return `Hierbij herinneren wij u vriendelijk aan de betaling van ${invoice}.`;
  }
}

/** Betaalverzoek per niveau — oplopend van "vriendelijk doch dringend" tot formele ingebrekestelling. */
function paymentRequestSentence(d: AanmaningData): string {
  const target = `het openstaande bedrag van ${d.totalFormatted} uiterlijk ${d.newDeadlineFormatted}`;
  switch (d.level) {
    case "SECOND_NOTICE":
      return `Wij sommeren u ${target} te voldoen op het volgende rekeningnummer:`;
    case "FINAL_NOTICE":
      return `Wij stellen u hierbij formeel in gebreke en sommeren u ${target} te voldoen op het \
volgende rekeningnummer:`;
    case "FIRST_NOTICE":
    case "REMINDER":
    default:
      return `Wij verzoeken u vriendelijk doch dringend ${target} over te maken op het volgende \
rekeningnummer:`;
  }
}

export function buildAanmaningLetter(d: AanmaningData): string {
  // Verzuim-alinea (vanaf de Eerste aanmaning): de wettelijke handelsrente (art. 6:119a BW) en de
  // buitengerechtelijke incassokosten (WIK) die een crediteur bij een B2B-transactie mag claimen.
  // Bewust indicatief — de rente wijzigt per halfjaar; de ZZP'er controleert het bedrag.
  const chargesParagraph = d.hasCharges
    ? `\n\nBij uitblijvende betaling zijn wij op grond van de wet gerechtigd de wettelijke handelsrente \
(indicatief ${d.interestRatePctFormatted}% per jaar — controleer de actuele rente) en de \
buitengerechtelijke incassokosten in rekening te brengen. Ter indicatie bedraagt de tot heden \
opgebouwde rente ${d.interestFormatted} en de incassokosten ${d.collectionCostsFormatted}, waarmee \
het totaal verschuldigde oploopt tot ${d.totalWithChargesFormatted}.`
    : "";

  // Slotwaarschuwing alleen bij de laatste aanmaning: aankondiging van incasso-uithanden-geven.
  const finalWarning =
    d.level === "FINAL_NOTICE"
      ? `\n\nBlijft betaling na deze termijn uit, dan zien wij ons genoodzaakt de vordering ter \
incasso uit handen te geven; de daaruit voortvloeiende kosten komen voor uw rekening.`
      : "";

  return `${d.freelancerName}
[Straatnaam + huisnummer]
[Postcode + Stad]
[Telefoon]
[E-mail]
[KvK-nummer]

${d.letterDateFormatted}

${d.companyName}
[T.a.v. financiële administratie]
[Adres opdrachtgever]

Betreft: ${d.stageLabel} – Factuur ${d.invoiceNumber} d.d. ${d.issuedAtFormatted}

Geachte heer/mevrouw,

${openingSentence(d)}

De betalingstermijn van deze factuur is op ${d.dueAtFormatted} verstreken \
(${d.daysPastDue} dag${d.daysPastDue === 1 ? "" : "en"} geleden).

${paymentRequestSentence(d)}

IBAN: ${d.ibanFormatted}
T.n.v.: ${d.freelancerName}
Onder vermelding van: Factuur ${d.invoiceNumber}${chargesParagraph}${finalWarning}

Betaling verloopt rechtstreeks tussen ons. Indien u al betaling heeft verricht, beschouw dan \
deze aanmaning als niet verzonden.

Heeft u vragen of wilt u contact opnemen, neem dan gerust contact met ons op via bovenstaande \
gegevens.

Met vriendelijke groet,

${d.freelancerName}
[Handtekening]`;
}
