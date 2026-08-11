// Aanmaning-sjabloon generator (§4 zijpad "Betaling te laat").
// Pure: geen DB-toegang, volledig testbaar.

import { formatIban } from "@/lib/fiscal";
import { summarizeOverdueCharges } from "@/lib/collection-costs";

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
  /** True zodra er wettelijke rente/incassokosten te claimen zijn (factuur is verlopen). */
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

  const charges = summarizeOverdueCharges({
    principalCents: input.totalCents,
    dueAt: input.dueAt,
    now,
    annualRateBps: input.interestRateBps,
  });

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
    hasCharges: charges.hasCharges,
    interestFormatted: fmtEuro(charges.interestCents),
    collectionCostsFormatted: fmtEuro(charges.collectionCostsCents),
    totalWithChargesFormatted: fmtEuro(charges.totalWithChargesCents),
    interestRatePctFormatted: (charges.interestRateBps / 100)
      .toLocaleString("nl-NL", { maximumFractionDigits: 2 })
      .replace(/,00$/, ""),
  };
}

export function buildAanmaningLetter(d: AanmaningData): string {
  // Verzuim-alinea (alleen bij een verlopen factuur): de wettelijke handelsrente (art. 6:119a BW)
  // en de buitengerechtelijke incassokosten (WIK) die een crediteur bij een B2B-transactie mag
  // claimen. Bewust indicatief — de rente wijzigt per halfjaar; de ZZP'er controleert het bedrag.
  const chargesParagraph = d.hasCharges
    ? `\n\nBij uitblijvende betaling zijn wij op grond van de wet gerechtigd de wettelijke handelsrente \
(indicatief ${d.interestRatePctFormatted}% per jaar — controleer de actuele rente) en de \
buitengerechtelijke incassokosten in rekening te brengen. Ter indicatie bedraagt de tot heden \
opgebouwde rente ${d.interestFormatted} en de incassokosten ${d.collectionCostsFormatted}, waarmee \
het totaal verschuldigde oploopt tot ${d.totalWithChargesFormatted}.`
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

Betreft: Betalingsherinnering – Factuur ${d.invoiceNumber} d.d. ${d.issuedAtFormatted}

Geachte heer/mevrouw,

Hierbij herinneren wij u aan de betaling van bovengenoemde factuur ten bedrage van ${d.totalFormatted}, \
uitgeschreven op ${d.issuedAtFormatted} voor werkzaamheden betreffende "${d.jobTitle}".

De betalingstermijn van deze factuur is op ${d.dueAtFormatted} verstreken \
(${d.daysPastDue} dag${d.daysPastDue === 1 ? "" : "en"} geleden). \
Tot op heden ontvingen wij geen betaling van het verschuldigde bedrag.

Wij verzoeken u vriendelijk doch dringend het openstaande bedrag van ${d.totalFormatted} \
uiterlijk ${d.newDeadlineFormatted} over te maken op het volgende rekeningnummer:

IBAN: ${d.ibanFormatted}
T.n.v.: ${d.freelancerName}
Onder vermelding van: Factuur ${d.invoiceNumber}${chargesParagraph}

Betaling verloopt rechtstreeks tussen ons. Indien u al betaling heeft verricht, beschouw dan \
deze aanmaning als niet verzonden.

Heeft u vragen of wilt u contact opnemen, neem dan gerust contact met ons op via bovenstaande \
gegevens.

Met vriendelijke groet,

${d.freelancerName}
[Handtekening]`;
}
