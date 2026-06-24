// Gedeelde, realistische Nederlandse demo-content voor het ontwerp-lab. Puur presentationeel —
// geen echte data, geen backend. Alle concepten (01..10) lezen hieruit, zodat de inhoud
// consistent blijft en elk concept zich op de designtaal richt, niet op het verzinnen van tekst.

export type ScreenKey =
  | "dashboard"
  | "marktplaats"
  | "opdracht"
  | "verificatie"
  | "documenten"
  | "facturen"
  | "berichten"
  | "acties";

export const SCREENS: { key: ScreenKey; label: string }[] = [
  { key: "dashboard", label: "Dashboard" },
  { key: "marktplaats", label: "Marktplaats" },
  { key: "opdracht", label: "Opdracht" },
  { key: "verificatie", label: "Verificatie" },
  { key: "acties", label: "Acties" },
  { key: "facturen", label: "Facturen" },
];

export type CredStatus = "VERIFIED" | "SUBMITTED" | "EXPIRING" | "REJECTED";

export const KPIS = [
  {
    label: "Match-percentage",
    value: "92%",
    trend: "+4",
    up: true,
    spark: [78, 80, 79, 84, 86, 88, 92],
  },
  { label: "Open reacties", value: "7", trend: "+2", up: true, spark: [3, 4, 4, 5, 6, 5, 7] },
  {
    label: "Omzet (mnd)",
    value: "€ 8.240",
    trend: "+12%",
    up: true,
    spark: [5.1, 5.8, 6.2, 6.0, 7.1, 7.6, 8.24],
  },
  {
    label: "Te factureren",
    value: "€ 1.350",
    trend: "2 open",
    up: false,
    spark: [2.4, 1.9, 2.2, 1.6, 1.35, 1.5, 1.35],
  },
];

export type Opdracht = {
  id: string;
  titel: string;
  opdrachtgever: string;
  plaats: string;
  tarief: string;
  match: number;
  uren: string;
  start: string;
  tags: string[];
  redenen: { plus: string[]; min: string[] };
};

export const OPDRACHTEN: Opdracht[] = [
  {
    id: "OPD-2041",
    titel: "Wijkverpleegkundige — avonddienst",
    opdrachtgever: "Thuiszorg De Linde",
    plaats: "Utrecht",
    tarief: "€ 62 / uur",
    match: 94,
    uren: "24 u/week",
    start: "Per 1 juli",
    tags: ["BIG-geregistreerd", "Eigen vervoer", "Avond"],
    redenen: {
      plus: ["BIG-registratie geverifieerd", "Reistijd 12 min", "Tarief boven je ondergrens"],
      min: ["Weekenddiensten gevraagd"],
    },
  },
  {
    id: "OPD-2038",
    titel: "Verzorgende IG — somatiek",
    opdrachtgever: "Zorggroep Almere",
    plaats: "Almere",
    tarief: "€ 48 / uur",
    match: 88,
    uren: "32 u/week",
    start: "Per 8 juli",
    tags: ["VIG", "Dagdienst"],
    redenen: {
      plus: ["Diploma VIG geverifieerd", "Past bij je beschikbaarheid"],
      min: ["Reistijd 38 min", "Tarief op je ondergrens"],
    },
  },
  {
    id: "OPD-2035",
    titel: "Begeleider GGZ — ambulant",
    opdrachtgever: "Kwintes",
    plaats: "Zeist",
    tarief: "€ 55 / uur",
    match: 81,
    uren: "16 u/week",
    start: "Flexibel",
    tags: ["SKJ", "GGZ-ervaring"],
    redenen: {
      plus: ["SKJ-registratie geverifieerd", "Korte reistijd"],
      min: ["Ervaring crisisdienst gevraagd", "Tijdelijk (3 mnd)"],
    },
  },
];

export const CREDENTIALS: { naam: string; status: CredStatus; detail: string }[] = [
  { naam: "BIG-registratie", status: "VERIFIED", detail: "Geverifieerd · geldig t/m 2028" },
  { naam: "Diploma Verpleegkunde (hbo-v)", status: "VERIFIED", detail: "Geverifieerd · 14 mei" },
  { naam: "VOG (zorg)", status: "EXPIRING", detail: "Verloopt over 23 dagen" },
  { naam: "Reanimatie / BLS", status: "SUBMITTED", detail: "In beoordeling · ingediend 21 juni" },
];

export const ACTIES = [
  {
    titel: "VOG verloopt over 23 dagen",
    detail: "Vraag een nieuwe Verklaring Omtrent Gedrag aan om verifieerbaar te blijven.",
    urgentie: "warning" as const,
    cta: "VOG vernieuwen",
  },
  {
    titel: "3 nieuwe matches boven 85%",
    detail: "Reageer vandaag — gemiddelde reactietijd opdrachtgevers is 6 uur.",
    urgentie: "info" as const,
    cta: "Bekijk matches",
  },
  {
    titel: "Factuur FAC-2025-118 openstaand",
    detail: "Verstuurd 9 dagen geleden aan Thuiszorg De Linde · € 1.350.",
    urgentie: "info" as const,
    cta: "Herinnering sturen",
  },
];

export const FACTUREN = [
  {
    nr: "FAC-2025-121",
    klant: "Thuiszorg De Linde",
    bedrag: "€ 2.480",
    status: "Betaald",
    datum: "18 jun",
  },
  {
    nr: "FAC-2025-118",
    klant: "Thuiszorg De Linde",
    bedrag: "€ 1.350",
    status: "Openstaand",
    datum: "12 jun",
  },
  {
    nr: "FAC-2025-114",
    klant: "Zorggroep Almere",
    bedrag: "€ 3.072",
    status: "Betaald",
    datum: "31 mei",
  },
  { nr: "FAC-2025-109", klant: "Kwintes", bedrag: "€ 880", status: "Concept", datum: "—" },
];

export const PROFIEL = {
  naam: "Sanne de Vries",
  rol: "Wijkverpleegkundige · ZZP",
  plaats: "Utrecht",
  initialen: "SdV",
  trust: "Hoog vertrouwen",
};

export const NAV = [
  "Dashboard",
  "Marktplaats",
  "Reacties",
  "Verificatie",
  "Documenten",
  "Facturen",
  "Berichten",
] as const;

// Optionele, gedeelde extra demo-content — concepten mogen hier extra schermen/tabs (berichten,
// documenten) mee verrijken. Niet verplicht; de zes kernschermen blijven de basis.

export const BERICHTEN: {
  van: string;
  initialen: string;
  preview: string;
  tijd: string;
  ongelezen: boolean;
}[] = [
  {
    van: "Thuiszorg De Linde",
    initialen: "TL",
    preview: "Top, we plannen je graag in voor de avonddienst per 1 juli.",
    tijd: "09:24",
    ongelezen: true,
  },
  {
    van: "Zorggroep Almere",
    initialen: "ZA",
    preview: "Kun je je VIG-diploma nog even toevoegen aan je profiel?",
    tijd: "Gisteren",
    ongelezen: true,
  },
  {
    van: "Kwintes — Team GGZ",
    initialen: "KW",
    preview: "Bedankt voor je reactie, we nemen contact op zodra de planning rond is.",
    tijd: "Ma",
    ongelezen: false,
  },
];

export const DOCUMENTEN: {
  naam: string;
  type: string;
  grootte: string;
  status: CredStatus;
  bijgewerkt: string;
}[] = [
  {
    naam: "BIG-registratie.pdf",
    type: "PDF",
    grootte: "284 kB",
    status: "VERIFIED",
    bijgewerkt: "14 mei",
  },
  {
    naam: "Diploma hbo-v.pdf",
    type: "PDF",
    grootte: "1,2 MB",
    status: "VERIFIED",
    bijgewerkt: "14 mei",
  },
  {
    naam: "VOG-zorg-2024.pdf",
    type: "PDF",
    grootte: "196 kB",
    status: "EXPIRING",
    bijgewerkt: "2 jun",
  },
  {
    naam: "Reanimatie-BLS.jpg",
    type: "JPG",
    grootte: "612 kB",
    status: "SUBMITTED",
    bijgewerkt: "21 jun",
  },
];
