// Aanmaning-sjabloon generator (§4 zijpad "Betaling te laat").
// Pure: geen DB-toegang, volledig testbaar.

export interface AanmaningInput {
  freelancerName: string;
  companyName: string;
  invoiceNumber: string;
  jobTitle: string;
  issuedAt: Date | null;
  dueAt: Date | null;
  totalCents: number;
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
  };
}

export function buildAanmaningLetter(d: AanmaningData): string {
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

IBAN: [uw IBAN]
T.n.v.: ${d.freelancerName}
Onder vermelding van: Factuur ${d.invoiceNumber}

Betaling verloopt rechtstreeks tussen ons. Indien u al betaling heeft verricht, beschouw dan \
deze aanmaning als niet verzonden.

Heeft u vragen of wilt u contact opnemen, neem dan gerust contact met ons op via bovenstaande \
gegevens.

Met vriendelijke groet,

${d.freelancerName}
[Handtekening]`;
}
