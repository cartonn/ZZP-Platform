"use client";

// Concept 559 — "Schaakbord" · schaaknotatie als besturingssysteem.
// Ordenende gedachte: een partij wordt volledig vastgelegd in een genummerde zettenlijst, met een
// bord ernaast en een klok erboven. Vertaald naar het platform: links het notatiepaneel (elke
// gebeurtenis is een "zet" — reactie verstuurd, VOG ingediend), midden het 8×8 raster als kaartveld
// voor opdrachten/status, rechts de klok met resterende tijd per beslissing. De metafoor structureert
// de tijd en de beurtwissel tussen ZZP'er en opdrachtgever — het is nadrukkelijk geen spelletje.
// Inspiratie/referentie: FIDE-scoresheet-indeling (zetnummer · wit · zwart), algebraïsche notatie en
// de commentaarsymbolen !, !?, ?! en ? (Wikipedia "Chess annotation symbols"; chess.com "Chess
// Notation — The Language of the Game"; chessworld.net scoresheet-drill), plus de verticale
// evaluatiebalk uit moderne partijviewers.
// Fonts: Newsreader (koppen) + IBM Plex Mono (notatie, klok, coördinaten). Deterministisch — geen
// random, geen datum-afhankelijkheid.

import { useMemo, useRef, useState } from "react";
import {
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  Check,
  CheckCircle2,
  ChevronDown,
  Clock,
  FileText,
  Flag,
  Hourglass,
  Info,
  MapPin,
  Pause,
  RefreshCw,
  Search,
  Send,
  ShieldCheck,
  Timer,
  Users,
  XCircle,
  type LucideIcon,
} from "lucide-react";
import {
  ACTIES,
  BERICHTEN,
  CREDENTIALS,
  DOCUMENTEN,
  FACTUREN,
  KPIS,
  OPDRACHTEN,
  PROFIEL,
  type CredStatus,
  type Opdracht,
} from "./mock";

// ── Palet — perkament, notenhout, inkt, smaragd ────────────────────────────────────────
const C = {
  perkament: "#f0ece2",
  perkamentLicht: "#f7f4ec",
  veldLicht: "#e6dfcd",
  veldDonker: "#5c4634",
  paneel: "#faf8f2",
  inkt: "#1c1a17",
  inktZacht: "#55503f",
  inktFlets: "#8c8571",
  lijn: "#d9d2c0",
  lijnZacht: "#e7e1d2",
  smaragd: "#1f7a5c",
  smaragdDiep: "#155a43",
  smaragdVeld: "#dff0e8",
  robijn: "#8c3a2c",
  oker: "#8a6420",
};

const kop = { fontFamily: "var(--font-lab-newsreader)" };
const mono = { fontFamily: "var(--font-lab-plex-mono)" };

// ── Schermen ───────────────────────────────────────────────────────────────────────────
type Scherm =
  | "partij"
  | "openingen"
  | "analyse"
  | "dossier"
  | "kandidaten"
  | "facturen"
  | "archief"
  | "arbiter";

const SCHERMEN: { key: Scherm; label: string; code: string }[] = [
  { key: "partij", label: "Dashboard", code: "§1" },
  { key: "openingen", label: "Marktplaats", code: "§2" },
  { key: "analyse", label: "Opdracht", code: "§3" },
  { key: "dossier", label: "Verificatie", code: "§4" },
  { key: "kandidaten", label: "Acties", code: "§5" },
  { key: "facturen", label: "Facturen", code: "§6" },
  { key: "archief", label: "Documenten", code: "§7" },
  { key: "arbiter", label: "Arbiter", code: "§8" },
];

// ── Lokale, presentationele notatie-mock ───────────────────────────────────────────────
type Evaluatie = "!" | "!?" | "?!" | "?" | "";

type Halfzet = {
  notatie: string;
  evaluatie: Evaluatie;
  omschrijving: string;
  veld: string;
  tijd: string;
};

type ZetPaar = { nr: number; zzp?: Halfzet; klant?: Halfzet };

const ZETTEN: ZetPaar[] = [
  {
    nr: 1,
    zzp: {
      notatie: "P e1",
      evaluatie: "",
      omschrijving: "Profiel compleet gemaakt — tarief, werkgebied en beschikbaarheid ingevuld.",
      veld: "e1",
      tijd: "09:04",
    },
    klant: {
      notatie: "O e5",
      evaluatie: "",
      omschrijving: "Thuiszorg De Linde plaatst de avonddienst-opdracht in Utrecht.",
      veld: "e5",
      tijd: "09:31",
    },
  },
  {
    nr: 2,
    zzp: {
      notatie: "V c1",
      evaluatie: "!",
      omschrijving: "BIG-registratie ingediend en dezelfde dag geverifieerd — sterk fundament.",
      veld: "c1",
      tijd: "10:12",
    },
    klant: {
      notatie: "O d5",
      evaluatie: "",
      omschrijving: "Zorggroep Almere plaatst een somatiek-opdracht voor 32 uur per week.",
      veld: "d5",
      tijd: "11:02",
    },
  },
  {
    nr: 3,
    zzp: {
      notatie: "D g1",
      evaluatie: "",
      omschrijving:
        "Diploma hbo-v toegevoegd aan het dossier; automatisch gekoppeld aan je profiel.",
      veld: "g1",
      tijd: "11:20",
    },
    klant: {
      notatie: "O f6",
      evaluatie: "",
      omschrijving: "Kwintes plaatst een ambulante GGZ-opdracht met flexibele start.",
      veld: "f6",
      tijd: "13:45",
    },
  },
  {
    nr: 4,
    zzp: {
      notatie: "R×e5",
      evaluatie: "!",
      omschrijving: "Reactie verstuurd op de avonddienst — binnen 27 minuten na plaatsing.",
      veld: "e5",
      tijd: "13:58",
    },
    klant: {
      notatie: "B e8",
      evaluatie: "",
      omschrijving: "Thuiszorg De Linde opent een gesprek en vraagt naar je avondbeschikbaarheid.",
      veld: "e8",
      tijd: "15:10",
    },
  },
  {
    nr: 5,
    zzp: {
      notatie: "R×d5",
      evaluatie: "?!",
      omschrijving: "Reactie op Almere — 38 minuten reistijd en een tarief op je ondergrens.",
      veld: "d5",
      tijd: "16:22",
    },
    klant: {
      notatie: "V+ b4",
      evaluatie: "",
      omschrijving: "Opdrachtgever vraagt een geldige VOG (zorg) vóór de startdatum.",
      veld: "b4",
      tijd: "16:40",
    },
  },
  {
    nr: 6,
    zzp: {
      notatie: "D a1",
      evaluatie: "",
      omschrijving: "Reanimatie/BLS-certificaat ingediend; staat in de beoordelingsrij.",
      veld: "a1",
      tijd: "09:15",
    },
    klant: {
      notatie: "B e8",
      evaluatie: "",
      omschrijving: "Voorstel ontvangen: avonddienst per 1 juli, 24 uur per week, € 62 per uur.",
      veld: "e8",
      tijd: "10:02",
    },
  },
  {
    nr: 7,
    zzp: {
      notatie: "F h4",
      evaluatie: "",
      omschrijving: "Factuur FAC-2025-118 verstuurd aan Thuiszorg De Linde — € 1.350.",
      veld: "h4",
      tijd: "11:33",
    },
    klant: {
      notatie: "= h4",
      evaluatie: "?",
      omschrijving: "Betaling blijft uit; de factuur staat inmiddels 9 dagen open.",
      veld: "h4",
      tijd: "—",
    },
  },
  {
    nr: 8,
    zzp: {
      notatie: "R×f6",
      evaluatie: "",
      omschrijving: "Reactie op Kwintes — 16 uur per week, flexibele startdatum.",
      veld: "f6",
      tijd: "14:07",
    },
    klant: {
      notatie: "B g8",
      evaluatie: "",
      omschrijving: "Kwintes laat weten dat de planning nog niet rond is.",
      veld: "g8",
      tijd: "15:20",
    },
  },
  {
    nr: 9,
    zzp: {
      notatie: "V+ b4",
      evaluatie: "!?",
      omschrijving:
        "VOG-vernieuwing aangevraagd bij de gemeente — nog niet ingediend op het platform.",
      veld: "b4",
      tijd: "08:41",
    },
    klant: {
      notatie: "B+ e8",
      evaluatie: "",
      omschrijving: "Thuiszorg De Linde wacht op je bevestiging van de avonddienst.",
      veld: "e8",
      tijd: "08:58",
    },
  },
];

// Gescript vervolg: de knop "Zet bevestigen" speelt deterministisch verder — geen random, geen tijd.
const VERVOLG: Halfzet[] = [
  {
    notatie: "R×e8",
    evaluatie: "!",
    omschrijving: "Avonddienst bevestigd bij Thuiszorg De Linde — start per 1 juli.",
    veld: "e8",
    tijd: "09:12",
  },
  {
    notatie: "O+ e5",
    evaluatie: "",
    omschrijving: "Opdrachtgever bevestigt de plaatsing en stuurt de conceptovereenkomst.",
    veld: "e5",
    tijd: "09:40",
  },
];

type Zijde = "jij" | "markt" | "klant";
type Toestand = "aanzet" | "sterk" | "wacht" | "risico";

type Stuk = {
  code: string;
  naam: string;
  detail: string;
  zijde: Zijde;
  toestand: Toestand;
  ga?: Scherm;
  gaLabel?: string;
};

const STUKKEN: Record<string, Stuk> = {
  e1: {
    code: "K",
    naam: PROFIEL.naam,
    detail: `${PROFIEL.rol} · ${PROFIEL.plaats} · ${PROFIEL.trust}`,
    zijde: "jij",
    toestand: "sterk",
    ga: "dossier",
    gaLabel: "Open je dossier",
  },
  c1: {
    code: "V",
    naam: "BIG-registratie",
    detail: "Geverifieerd · geldig t/m 2028",
    zijde: "jij",
    toestand: "sterk",
    ga: "dossier",
    gaLabel: "Bekijk verificatie",
  },
  g1: {
    code: "D",
    naam: "Diploma hbo-v",
    detail: "Geverifieerd op 14 mei · 1,2 MB",
    zijde: "jij",
    toestand: "sterk",
    ga: "archief",
    gaLabel: "Open in archief",
  },
  a1: {
    code: "D",
    naam: "Reanimatie / BLS",
    detail: "In beoordeling · ingediend 21 juni",
    zijde: "jij",
    toestand: "wacht",
    ga: "dossier",
    gaLabel: "Volg de beoordeling",
  },
  d2: {
    code: "p",
    naam: "Beschikbaarheid",
    detail: "24–32 uur per week · avond en nacht",
    zijde: "jij",
    toestand: "sterk",
  },
  f2: {
    code: "p",
    naam: "Tariefondergrens",
    detail: "€ 48 per uur · onder deze grens reageer je niet",
    zijde: "jij",
    toestand: "sterk",
  },
  b4: {
    code: "V",
    naam: "VOG (zorg)",
    detail: "Verloopt over 23 dagen — vernieuwing aangevraagd",
    zijde: "jij",
    toestand: "risico",
    ga: "kandidaten",
    gaLabel: "Naar de kandidaatzetten",
  },
  h4: {
    code: "F",
    naam: "FAC-2025-118",
    detail: "€ 1.350 openstaand · 9 dagen na verzending",
    zijde: "jij",
    toestand: "risico",
    ga: "facturen",
    gaLabel: "Open facturen",
  },
  e5: {
    code: "O",
    naam: OPDRACHTEN[0]!.titel,
    detail: `${OPDRACHTEN[0]!.opdrachtgever} · ${OPDRACHTEN[0]!.tarief} · ${OPDRACHTEN[0]!.match}% match`,
    zijde: "markt",
    toestand: "aanzet",
    ga: "analyse",
    gaLabel: "Analyseer deze opdracht",
  },
  d5: {
    code: "O",
    naam: OPDRACHTEN[1]!.titel,
    detail: `${OPDRACHTEN[1]!.opdrachtgever} · ${OPDRACHTEN[1]!.tarief} · ${OPDRACHTEN[1]!.match}% match`,
    zijde: "markt",
    toestand: "wacht",
    ga: "openingen",
    gaLabel: "Terug naar de marktplaats",
  },
  f6: {
    code: "O",
    naam: OPDRACHTEN[2]!.titel,
    detail: `${OPDRACHTEN[2]!.opdrachtgever} · ${OPDRACHTEN[2]!.tarief} · ${OPDRACHTEN[2]!.match}% match`,
    zijde: "markt",
    toestand: "wacht",
    ga: "openingen",
    gaLabel: "Terug naar de marktplaats",
  },
  e8: {
    code: "K",
    naam: "Thuiszorg De Linde",
    detail: "Aan zet: wacht op jouw bevestiging · reactietijd 6 uur",
    zijde: "klant",
    toestand: "aanzet",
    ga: "analyse",
    gaLabel: "Bekijk het voorstel",
  },
  c8: {
    code: "K",
    naam: "Zorggroep Almere",
    detail: "Reageert gemiddeld binnen 11 uur",
    zijde: "klant",
    toestand: "wacht",
  },
  g8: {
    code: "K",
    naam: "Kwintes — Team GGZ",
    detail: "Planning nog niet rond · laatste bericht maandag",
    zijde: "klant",
    toestand: "wacht",
  },
};

const BESTANDEN = ["a", "b", "c", "d", "e", "f", "g", "h"] as const;
const RIJEN = [8, 7, 6, 5, 4, 3, 2, 1] as const;

const LEGENDA: { teken: string; uitleg: string }[] = [
  { teken: "K", uitleg: "persoon of organisatie" },
  { teken: "O", uitleg: "opdracht" },
  { teken: "V", uitleg: "verificatie" },
  { teken: "D", uitleg: "document" },
  { teken: "F", uitleg: "factuur" },
  { teken: "B", uitleg: "bericht" },
  { teken: "×", uitleg: "actie op een opdracht" },
  { teken: "+", uitleg: "vraagt jouw actie" },
  { teken: "!", uitleg: "sterke zet" },
  { teken: "?!", uitleg: "twijfelachtige zet" },
];

// ── Kleine helpers ─────────────────────────────────────────────────────────────────────
function veldId(kolom: number, rij: number): string {
  return `${BESTANDEN[kolom]!}${RIJEN[rij]!}`;
}

function isLichtVeld(kolom: number, rij: number): boolean {
  return (kolom + rij) % 2 === 0;
}

function toestandMeta(t: Toestand): { label: string; kleur: string; Icon: LucideIcon } {
  switch (t) {
    case "aanzet":
      return { label: "Aan zet", kleur: C.smaragd, Icon: Flag };
    case "sterk":
      return { label: "Op orde", kleur: C.smaragdDiep, Icon: CheckCircle2 };
    case "wacht":
      return { label: "Wacht", kleur: C.inktZacht, Icon: Hourglass };
    case "risico":
      return { label: "Vraagt actie", kleur: C.robijn, Icon: AlertTriangle };
  }
}

function credMeta(s: CredStatus): { label: string; kleur: string; Icon: LucideIcon } {
  switch (s) {
    case "VERIFIED":
      return { label: "Geverifieerd", kleur: C.smaragdDiep, Icon: Check };
    case "SUBMITTED":
      return { label: "In beoordeling", kleur: C.inktZacht, Icon: Clock };
    case "EXPIRING":
      return { label: "Verloopt binnenkort", kleur: C.oker, Icon: AlertTriangle };
    case "REJECTED":
      return { label: "Afgewezen", kleur: C.robijn, Icon: XCircle };
  }
}

// Match-percentage → evaluatiecijfer in schaakstijl (+2,4 = duidelijk voordeel).
function evaluatie(match: number): string {
  const waarde = (match - 70) / 10;
  const teken = waarde >= 0 ? "+" : "−";
  return `${teken}${Math.abs(waarde).toFixed(1).replace(".", ",")}`;
}

function evaluatieWoord(match: number): string {
  if (match >= 90) return "winnende stelling";
  if (match >= 85) return "duidelijk voordeel";
  if (match >= 78) return "licht voordeel";
  return "gelijkwaardig";
}

// ── Gedeelde primitives ────────────────────────────────────────────────────────────────
function Chip({ label, kleur, Icon }: { label: string; kleur: string; Icon: LucideIcon }) {
  return (
    <span
      className="inline-flex max-w-full items-center gap-1.5 rounded-[3px] px-2 py-0.5 text-[11px] font-medium leading-tight"
      style={{ background: `${kleur}14`, color: kleur, border: `1px solid ${kleur}33`, ...mono }}
    >
      <Icon size={11} strokeWidth={2.2} aria-hidden="true" className="shrink-0" />
      <span className="truncate">{label}</span>
    </span>
  );
}

function EvalBalk({ match, hoogte = 120 }: { match: number; hoogte?: number }) {
  const aandeel = Math.min(96, Math.max(4, match));
  return (
    <div className="flex items-center gap-2">
      <div
        className="w-3 shrink-0 overflow-hidden rounded-[2px]"
        style={{ height: hoogte, background: C.veldDonker, border: `1px solid ${C.inkt}` }}
        aria-hidden="true"
      >
        <div style={{ height: `${100 - aandeel}%` }} />
        <div style={{ height: `${aandeel}%`, background: C.perkamentLicht }} />
      </div>
      <div className="min-w-0">
        <div className="text-[15px] font-semibold tabular-nums" style={{ ...mono, color: C.inkt }}>
          {evaluatie(match)}
        </div>
        <div className="text-[11px] leading-tight" style={{ color: C.inktZacht }}>
          {match}% match · {evaluatieWoord(match)}
        </div>
      </div>
    </div>
  );
}

function SectieKop({ boven, titel, onder }: { boven: string; titel: string; onder?: string }) {
  return (
    <div className="mb-4">
      <p
        className="text-[10.5px] uppercase tracking-[0.22em]"
        style={{ ...mono, color: C.inktFlets }}
      >
        {boven}
      </p>
      <h1
        className="mt-1 text-[22px] leading-tight tracking-[-0.01em] sm:text-[26px]"
        style={{ ...kop, color: C.inkt }}
      >
        {titel}
      </h1>
      {onder && (
        <p className="mt-1.5 max-w-2xl text-[13px] leading-relaxed" style={{ color: C.inktZacht }}>
          {onder}
        </p>
      )}
    </div>
  );
}

function Paneel({
  titel,
  bijschrift,
  children,
  actie,
}: {
  titel: string;
  bijschrift?: string;
  children: React.ReactNode;
  actie?: React.ReactNode;
}) {
  return (
    <section
      className="min-w-0 rounded-[4px]"
      style={{ background: C.paneel, border: `1px solid ${C.lijn}` }}
    >
      <header
        className="flex flex-wrap items-center justify-between gap-2 border-b px-4 py-2.5"
        style={{ borderColor: C.lijnZacht }}
      >
        <div className="min-w-0">
          <h2 className="text-[14px] leading-tight" style={{ ...kop, color: C.inkt }}>
            {titel}
          </h2>
          {bijschrift && (
            <p className="text-[11px] leading-tight" style={{ ...mono, color: C.inktFlets }}>
              {bijschrift}
            </p>
          )}
        </div>
        {actie}
      </header>
      <div className="p-4">{children}</div>
    </section>
  );
}

// ── Het bord — pure CSS-grid met toetsenbordnavigatie ─────────────────────────────────
function Bord({
  gekozen,
  onKies,
  gemarkeerd,
}: {
  gekozen: string | null;
  onKies: (veld: string) => void;
  gemarkeerd: string | null;
}) {
  const [cursor, setCursor] = useState<{ k: number; r: number }>({ k: 4, r: 4 });
  const refs = useRef<Record<string, HTMLButtonElement | null>>({});

  const verplaats = (k: number, r: number) => {
    const nk = Math.min(7, Math.max(0, k));
    const nr = Math.min(7, Math.max(0, r));
    setCursor({ k: nk, r: nr });
    const el = refs.current[veldId(nk, nr)];
    if (el) el.focus();
  };

  const opToets = (e: React.KeyboardEvent<HTMLButtonElement>, k: number, r: number) => {
    const acties: Record<string, () => void> = {
      ArrowLeft: () => verplaats(k - 1, r),
      ArrowRight: () => verplaats(k + 1, r),
      ArrowUp: () => verplaats(k, r - 1),
      ArrowDown: () => verplaats(k, r + 1),
      Home: () => verplaats(0, r),
      End: () => verplaats(7, r),
      PageUp: () => verplaats(k, 0),
      PageDown: () => verplaats(k, 7),
    };
    const actie = acties[e.key];
    if (actie) {
      e.preventDefault();
      actie();
    }
  };

  return (
    <div className="min-w-0">
      <div className="flex gap-1.5">
        {/* Rijnummers */}
        <div className="flex w-4 shrink-0 flex-col" aria-hidden="true">
          {RIJEN.map((r) => (
            <div
              key={r}
              className="flex flex-1 items-center justify-center text-[10px]"
              style={{ ...mono, color: C.inktFlets }}
            >
              {r}
            </div>
          ))}
        </div>

        <div
          className="grid aspect-square min-w-0 flex-1 grid-cols-8 grid-rows-8 overflow-hidden rounded-[3px]"
          style={{ border: `2px solid ${C.veldDonker}` }}
          role="group"
          aria-label="Speelveld van 8 bij 8 velden. Navigeer met de pijltjestoetsen; Enter opent een veld."
        >
          {RIJEN.map((_, r) =>
            BESTANDEN.map((_b, k) => {
              const id = veldId(k, r);
              const stuk = STUKKEN[id];
              const licht = isLichtVeld(k, r);
              const isGekozen = gekozen === id;
              const isGemarkeerd = gemarkeerd === id;
              const meta = stuk ? toestandMeta(stuk.toestand) : null;
              const opCursor = cursor.k === k && cursor.r === r;
              return (
                <button
                  key={id}
                  type="button"
                  ref={(el) => {
                    refs.current[id] = el;
                  }}
                  tabIndex={opCursor ? 0 : -1}
                  onFocus={() => setCursor({ k, r })}
                  onKeyDown={(e) => opToets(e, k, r)}
                  onClick={() => onKies(id)}
                  aria-pressed={isGekozen}
                  aria-label={
                    stuk
                      ? `Veld ${id}: ${stuk.naam}. ${meta!.label}. ${stuk.detail}`
                      : `Veld ${id}: leeg`
                  }
                  className="relative flex min-w-0 items-center justify-center transition-[box-shadow,transform] focus-visible:z-20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset"
                  style={{
                    background: licht ? C.veldLicht : C.veldDonker,
                    color: licht ? C.inkt : C.perkamentLicht,
                    boxShadow: isGekozen
                      ? `inset 0 0 0 3px ${C.smaragd}`
                      : isGemarkeerd
                        ? `inset 0 0 0 2px ${C.oker}`
                        : "none",
                    ...({ "--tw-ring-color": C.smaragd } as React.CSSProperties),
                  }}
                >
                  {stuk ? (
                    <span className="flex flex-col items-center leading-none">
                      <span
                        className="text-[13px] font-semibold sm:text-[15px]"
                        style={{ ...mono, color: licht ? C.inkt : C.perkamentLicht }}
                      >
                        {stuk.code}
                      </span>
                      <span
                        className="mt-0.5 block h-1.5 w-1.5 rounded-full"
                        style={{
                          background: meta!.kleur,
                          outline: `1px solid ${C.perkamentLicht}55`,
                        }}
                        aria-hidden="true"
                      />
                    </span>
                  ) : (
                    <span
                      className="text-[8px] opacity-30"
                      style={{ ...mono, color: licht ? C.inkt : C.perkamentLicht }}
                      aria-hidden="true"
                    >
                      {id}
                    </span>
                  )}
                </button>
              );
            }),
          )}
        </div>
      </div>

      {/* Bestandsletters */}
      <div className="mt-1 flex gap-1.5" aria-hidden="true">
        <div className="w-4 shrink-0" />
        <div className="grid flex-1 grid-cols-8">
          {BESTANDEN.map((b) => (
            <div
              key={b}
              className="text-center text-[10px]"
              style={{ ...mono, color: C.inktFlets }}
            >
              {b}
            </div>
          ))}
        </div>
      </div>

      <p className="mt-2 text-[11px] leading-relaxed" style={{ color: C.inktFlets }}>
        Rij 8 is de kant van de opdrachtgever, rij 1 is jouw kant. Het middenveld is de markt.
      </p>
    </div>
  );
}

// ── Notatiepaneel — de scoresheet ──────────────────────────────────────────────────────
function Notatie({
  paren,
  actief,
  onKies,
  wachtOpJou,
}: {
  paren: ZetPaar[];
  actief: Halfzet | null;
  onKies: (z: Halfzet) => void;
  wachtOpJou: boolean;
}) {
  const cel = (z: Halfzet | undefined, leegLabel: string) => {
    if (!z) {
      return (
        <span
          className="inline-flex items-center gap-1 text-[11.5px]"
          style={{ ...mono, color: C.inktFlets }}
        >
          <Pause size={11} aria-hidden="true" /> {leegLabel}
        </span>
      );
    }
    const gekozen = actief?.notatie === z.notatie && actief?.tijd === z.tijd;
    const kleurEval =
      z.evaluatie === "!" ? C.smaragdDiep : z.evaluatie === "" ? C.inktFlets : C.robijn;
    return (
      <button
        type="button"
        onClick={() => onKies(z)}
        aria-pressed={gekozen}
        className="flex w-full items-baseline gap-1.5 rounded-[3px] px-1.5 py-1 text-left transition-colors hover:bg-[#efe9db] focus-visible:outline-none focus-visible:ring-2"
        style={{
          background: gekozen ? C.smaragdVeld : "transparent",
          ...({ "--tw-ring-color": C.smaragd } as React.CSSProperties),
        }}
      >
        <span className="text-[12.5px] font-medium" style={{ ...mono, color: C.inkt }}>
          {z.notatie}
        </span>
        {z.evaluatie && (
          <span className="text-[12px] font-semibold" style={{ ...mono, color: kleurEval }}>
            {z.evaluatie}
          </span>
        )}
        <span
          className="ml-auto text-[10.5px] tabular-nums"
          style={{ ...mono, color: C.inktFlets }}
        >
          {z.tijd}
        </span>
      </button>
    );
  };

  return (
    <div>
      <div className="max-h-[320px] overflow-x-auto overflow-y-auto">
        <table className="w-full min-w-[280px] border-collapse">
          <caption className="sr-only">
            Zettenlijst van deze samenwerking: per zetnummer jouw zet en die van de opdrachtgever.
          </caption>
          <thead>
            <tr>
              <th
                scope="col"
                className="w-8 border-b px-1 py-1.5 text-left text-[10px] uppercase tracking-[0.14em]"
                style={{ ...mono, color: C.inktFlets, borderColor: C.lijn }}
              >
                #
              </th>
              <th
                scope="col"
                className="border-b px-1 py-1.5 text-left text-[10px] uppercase tracking-[0.14em]"
                style={{ ...mono, color: C.inktFlets, borderColor: C.lijn }}
              >
                Jij
              </th>
              <th
                scope="col"
                className="border-b px-1 py-1.5 text-left text-[10px] uppercase tracking-[0.14em]"
                style={{ ...mono, color: C.inktFlets, borderColor: C.lijn }}
              >
                Opdrachtgever
              </th>
            </tr>
          </thead>
          <tbody>
            {paren.map((p) => (
              <tr key={p.nr} style={{ borderBottom: `1px solid ${C.lijnZacht}` }}>
                <th
                  scope="row"
                  className="px-1 py-0.5 text-left align-middle text-[11px] font-normal tabular-nums"
                  style={{ ...mono, color: C.inktFlets }}
                >
                  {p.nr}.
                </th>
                <td className="px-0.5 py-0.5 align-middle">{cel(p.zzp, "aan zet")}</td>
                <td className="px-0.5 py-0.5 align-middle">{cel(p.klant, "—")}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div
        className="mt-3 rounded-[3px] p-3"
        style={{ background: C.perkament, border: `1px solid ${C.lijnZacht}` }}
        aria-live="polite"
      >
        {actief ? (
          <>
            <p className="text-[11px]" style={{ ...mono, color: C.inktFlets }}>
              {actief.notatie} {actief.evaluatie} · veld {actief.veld} · {actief.tijd}
            </p>
            <p className="mt-1 text-[13px] leading-relaxed" style={{ color: C.inkt }}>
              {actief.omschrijving}
            </p>
          </>
        ) : (
          <p className="text-[12.5px] leading-relaxed" style={{ color: C.inktZacht }}>
            {wachtOpJou
              ? "Je bent aan zet. Kies een zet uit de lijst voor de toelichting, of bevestig hiernaast."
              : "Kies een zet uit de lijst voor de toelichting in gewone taal."}
          </p>
        )}
      </div>
    </div>
  );
}

// ── Klok — resterende tijd per beslissing ──────────────────────────────────────────────
type Klokstand = { jij: string; klant: string; beurt: "jij" | "klant" };

const KLOKSTANDEN: Klokstand[] = [
  { jij: "0:42:10", klant: "3:18:00", beurt: "jij" },
  { jij: "0:39:55", klant: "2:47:30", beurt: "klant" },
  { jij: "0:39:55", klant: "2:11:04", beurt: "jij" },
];

const TERMIJNEN: { wat: string; over: string; urgentie: "hoog" | "midden" | "laag" }[] = [
  { wat: "Bevestiging Thuiszorg De Linde", over: "nog 6 u 40", urgentie: "hoog" },
  { wat: "VOG (zorg) vernieuwen", over: "nog 23 dagen", urgentie: "midden" },
  { wat: "Betaling FAC-2025-118", over: "9 dagen over termijn", urgentie: "hoog" },
  { wat: "Reactie Kwintes", over: "geen termijn", urgentie: "laag" },
];

function Klok({
  stand,
  stap,
  onBevestig,
}: {
  stand: Klokstand;
  stap: number;
  onBevestig: () => void;
}) {
  const jijAanZet = stand.beurt === "jij";
  const opRij = (label: string, tijd: string, actief: boolean) => (
    <div
      className="flex items-center justify-between gap-3 rounded-[3px] px-3 py-2.5"
      style={{
        background: actief ? C.veldDonker : C.perkament,
        color: actief ? C.perkamentLicht : C.inktZacht,
        border: `1px solid ${actief ? C.veldDonker : C.lijnZacht}`,
      }}
    >
      <span className="flex items-center gap-1.5 text-[11.5px]" style={mono}>
        {actief ? <Timer size={12} aria-hidden="true" /> : <Pause size={12} aria-hidden="true" />}
        {label}
      </span>
      <span className="text-[19px] font-semibold tabular-nums leading-none" style={mono}>
        {tijd}
      </span>
    </div>
  );

  return (
    <div className="space-y-2">
      {opRij("Opdrachtgever", stand.klant, !jijAanZet)}
      {opRij("Jij", stand.jij, jijAanZet)}

      <div
        className="flex items-center gap-2 rounded-[3px] px-3 py-2"
        style={{
          background: jijAanZet ? C.smaragdVeld : C.perkament,
          border: `1px solid ${C.lijnZacht}`,
        }}
      >
        <Flag
          size={13}
          style={{ color: jijAanZet ? C.smaragdDiep : C.inktFlets }}
          aria-hidden="true"
        />
        <span
          className="text-[12px] font-medium"
          style={{ color: jijAanZet ? C.smaragdDiep : C.inktZacht }}
        >
          {jijAanZet ? "Jij bent aan zet" : "De opdrachtgever is aan zet"}
        </span>
      </div>

      <button
        type="button"
        onClick={onBevestig}
        disabled={!jijAanZet || stap >= KLOKSTANDEN.length - 1}
        className="flex w-full items-center justify-center gap-2 rounded-[3px] px-4 py-2.5 text-[13px] font-medium transition-opacity focus-visible:outline-none focus-visible:ring-2 disabled:cursor-not-allowed disabled:opacity-45"
        style={{
          background: C.smaragdDiep,
          color: "#fff",
          ...({ "--tw-ring-color": C.smaragd } as React.CSSProperties),
        }}
      >
        <Send size={14} aria-hidden="true" />
        {stap >= KLOKSTANDEN.length - 1 ? "Partij bijgewerkt" : "Zet bevestigen"}
      </button>
      <p className="text-[11px] leading-relaxed" style={{ color: C.inktFlets }}>
        {stap >= KLOKSTANDEN.length - 1
          ? "De demo-partij is uitgespeeld: er zijn geen vervolgzetten meer om te bevestigen."
          : jijAanZet
            ? "Bevestigt de bovenste kandidaatzet en geeft de beurt door."
            : "Uitgeschakeld zolang de opdrachtgever aan zet is — je kunt geen zet voor de ander doen."}
      </p>

      <div className="pt-1">
        <p
          className="mb-1.5 text-[10px] uppercase tracking-[0.18em]"
          style={{ ...mono, color: C.inktFlets }}
        >
          Beslistermijnen
        </p>
        <ul className="space-y-1.5">
          {TERMIJNEN.map((t) => {
            const kleur =
              t.urgentie === "hoog" ? C.robijn : t.urgentie === "midden" ? C.oker : C.inktFlets;
            return (
              <li key={t.wat} className="flex items-start justify-between gap-2">
                <span
                  className="flex min-w-0 items-start gap-1.5 text-[12px]"
                  style={{ color: C.inktZacht }}
                >
                  <span
                    className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full"
                    style={{ background: kleur }}
                    aria-hidden="true"
                  />
                  <span className="min-w-0 break-words">{t.wat}</span>
                </span>
                <span
                  className="shrink-0 text-[11px] tabular-nums"
                  style={{ ...mono, color: kleur }}
                >
                  {t.over}
                </span>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}

// ── Scherm 1 — Partij (dashboard) ──────────────────────────────────────────────────────
function PartijScherm({ onGa }: { onGa: (s: Scherm) => void }) {
  const [gekozenVeld, setGekozenVeld] = useState<string | null>("e5");
  const [actieveZet, setActieveZet] = useState<Halfzet | null>(null);
  const [stap, setStap] = useState(0);
  const [legendaOpen, setLegendaOpen] = useState(false);

  const stand = KLOKSTANDEN[stap]!;

  const paren = useMemo<ZetPaar[]>(() => {
    const basis = ZETTEN.map((p) => ({ ...p }));
    const extra: ZetPaar[] = [];
    if (stap >= 1) extra.push({ nr: 10, zzp: VERVOLG[0]! });
    if (stap >= 2) extra[0] = { nr: 10, zzp: VERVOLG[0]!, klant: VERVOLG[1]! };
    if (extra.length === 0) extra.push({ nr: 10 });
    return [...basis, ...extra];
  }, [stap]);

  const stuk = gekozenVeld ? STUKKEN[gekozenVeld] : undefined;
  const meta = stuk ? toestandMeta(stuk.toestand) : null;

  const bevestig = () => {
    setStap((s) => Math.min(KLOKSTANDEN.length - 1, s + 1));
    setActieveZet(VERVOLG[0]!);
    setGekozenVeld("e8");
  };

  return (
    <div className="space-y-4">
      <SectieKop
        boven="§1 · Partijstand"
        titel="De partij in één oogopslag"
        onder="Elke gebeurtenis is een zet. Links de notatie, in het midden het veld, rechts de klok met de tijd die je nog hebt per beslissing."
      />

      {/* Kerncijfers */}
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        {KPIS.map((k) => (
          <div
            key={k.label}
            className="min-w-0 rounded-[3px] px-3 py-2.5"
            style={{ background: C.paneel, border: `1px solid ${C.lijn}` }}
          >
            <div
              className="text-[10px] uppercase tracking-[0.14em]"
              style={{ ...mono, color: C.inktFlets }}
            >
              {k.label}
            </div>
            <div
              className="mt-1 truncate text-[19px] tabular-nums leading-none"
              style={{ ...kop, color: C.inkt }}
            >
              {k.value}
            </div>
            <div
              className="mt-1 text-[11px]"
              style={{ ...mono, color: k.up ? C.smaragdDiep : C.oker }}
            >
              {k.up ? "▲" : "▼"} {k.trend}
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,300px)_minmax(0,1fr)_minmax(0,280px)]">
        {/* Notatiepaneel */}
        <Paneel titel="Notatie" bijschrift="zet · symbool · tijd">
          <Notatie
            paren={paren}
            actief={actieveZet}
            onKies={(z) => {
              setActieveZet(z);
              setGekozenVeld(z.veld);
            }}
            wachtOpJou={stand.beurt === "jij"}
          />

          <button
            type="button"
            onClick={() => setLegendaOpen((v) => !v)}
            aria-expanded={legendaOpen}
            className="mt-3 flex w-full items-center justify-between gap-2 rounded-[3px] px-2 py-1.5 text-[12px] transition-colors hover:bg-[#efe9db] focus-visible:outline-none focus-visible:ring-2"
            style={{
              color: C.inktZacht,
              border: `1px solid ${C.lijnZacht}`,
              ...({ "--tw-ring-color": C.smaragd } as React.CSSProperties),
            }}
          >
            <span className="flex items-center gap-1.5">
              <Info size={13} aria-hidden="true" /> Legenda van de notatie
            </span>
            <ChevronDown
              size={14}
              aria-hidden="true"
              style={{
                transform: legendaOpen ? "rotate(180deg)" : "none",
                transition: "transform 160ms",
              }}
            />
          </button>
          {legendaOpen && (
            <dl className="mt-2 grid grid-cols-1 gap-x-4 gap-y-1 sm:grid-cols-2">
              {LEGENDA.map((l) => (
                <div key={l.teken} className="flex items-baseline gap-2">
                  <dt
                    className="w-6 shrink-0 text-[12px] font-semibold"
                    style={{ ...mono, color: C.inkt }}
                  >
                    {l.teken}
                  </dt>
                  <dd className="min-w-0 text-[11.5px]" style={{ color: C.inktZacht }}>
                    {l.uitleg}
                  </dd>
                </div>
              ))}
            </dl>
          )}
        </Paneel>

        {/* Bord */}
        <Paneel
          titel="Het veld"
          bijschrift="8 × 8 · pijltjestoetsen"
          actie={
            <span className="text-[11px]" style={{ ...mono, color: C.inktFlets }}>
              {gekozenVeld ?? "—"}
            </span>
          }
        >
          <div className="mx-auto max-w-[440px]">
            <Bord
              gekozen={gekozenVeld}
              gemarkeerd={actieveZet?.veld ?? null}
              onKies={(v) => {
                setGekozenVeld(v);
                setActieveZet(null);
              }}
            />
          </div>

          <div
            className="mt-4 rounded-[3px] p-3"
            style={{ background: C.perkament, border: `1px solid ${C.lijnZacht}` }}
            aria-live="polite"
          >
            {stuk && meta ? (
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-[11px]" style={{ ...mono, color: C.inktFlets }}>
                    Veld {gekozenVeld} ·{" "}
                    {stuk.zijde === "jij"
                      ? "jouw kant"
                      : stuk.zijde === "klant"
                        ? "kant opdrachtgever"
                        : "markt"}
                  </p>
                  <h3
                    className="mt-0.5 text-[16px] leading-tight"
                    style={{ ...kop, color: C.inkt }}
                  >
                    {stuk.naam}
                  </h3>
                  <p className="mt-1 text-[12.5px] leading-relaxed" style={{ color: C.inktZacht }}>
                    {stuk.detail}
                  </p>
                </div>
                <div className="flex shrink-0 flex-col items-end gap-2">
                  <Chip label={meta.label} kleur={meta.kleur} Icon={meta.Icon} />
                  {stuk.ga ? (
                    <button
                      type="button"
                      onClick={() => onGa(stuk.ga!)}
                      className="inline-flex items-center gap-1.5 rounded-[3px] px-3 py-1.5 text-[12px] font-medium transition-colors focus-visible:outline-none focus-visible:ring-2"
                      style={{
                        background: C.smaragdVeld,
                        color: C.smaragdDiep,
                        border: `1px solid ${C.smaragd}33`,
                        ...({ "--tw-ring-color": C.smaragd } as React.CSSProperties),
                      }}
                    >
                      {stuk.gaLabel} <ArrowRight size={13} aria-hidden="true" />
                    </button>
                  ) : (
                    <button
                      type="button"
                      disabled
                      className="inline-flex cursor-not-allowed items-center gap-1.5 rounded-[3px] px-3 py-1.5 text-[12px] opacity-50"
                      style={{ border: `1px solid ${C.lijn}`, color: C.inktZacht }}
                      title="Dit veld is een instelling van je profiel en heeft geen eigen scherm."
                    >
                      Geen vervolgscherm
                    </button>
                  )}
                </div>
              </div>
            ) : (
              <p className="text-[12.5px] leading-relaxed" style={{ color: C.inktZacht }}>
                Leeg veld. Kies een bezet veld — of loop met de pijltjestoetsen over het bord.
              </p>
            )}
          </div>
        </Paneel>

        {/* Klok */}
        <div className="space-y-4">
          <Paneel titel="Klok" bijschrift="resterende beslistijd">
            <Klok stand={stand} stap={stap} onBevestig={bevestig} />
          </Paneel>

          <Paneel titel="Berichten" bijschrift="laatste beurtwissels">
            <ul className="space-y-2">
              {BERICHTEN.map((b) => (
                <li key={b.van} className="flex items-start gap-2.5">
                  <span
                    className="flex h-7 w-7 shrink-0 items-center justify-center rounded-[3px] text-[10px] font-semibold"
                    style={{ ...mono, background: C.veldDonker, color: C.perkamentLicht }}
                    aria-hidden="true"
                  >
                    {b.initialen}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-baseline justify-between gap-2">
                      <span
                        className="truncate text-[12.5px] font-medium"
                        style={{ color: C.inkt }}
                      >
                        {b.van}
                      </span>
                      <span
                        className="shrink-0 text-[10.5px]"
                        style={{ ...mono, color: C.inktFlets }}
                      >
                        {b.tijd}
                      </span>
                    </div>
                    <p className="text-[11.5px] leading-snug" style={{ color: C.inktZacht }}>
                      {b.preview}
                    </p>
                    {b.ongelezen && (
                      <span className="mt-1 inline-block">
                        <Chip label="Ongelezen" kleur={C.smaragdDiep} Icon={Flag} />
                      </span>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          </Paneel>
        </div>
      </div>
    </div>
  );
}

// ── Scherm 2 — Openingen (marktplaats) ────────────────────────────────────────────────
type Weergave = "gereed" | "laden" | "leeg" | "fout";

function OpeningenScherm({ onOpen }: { onOpen: (o: Opdracht) => void }) {
  const [zoek, setZoek] = useState("");
  const [weergave, setWeergave] = useState<Weergave>("gereed");

  const resultaten = useMemo(() => {
    if (weergave === "leeg") return [];
    const t = zoek.trim().toLowerCase();
    return OPDRACHTEN.filter(
      (o) =>
        !t ||
        o.titel.toLowerCase().includes(t) ||
        o.plaats.toLowerCase().includes(t) ||
        o.opdrachtgever.toLowerCase().includes(t),
    );
  }, [zoek, weergave]);

  return (
    <div className="space-y-4">
      <SectieKop
        boven="§2 · Openingenboek"
        titel="Marktplaats"
        onder="Elke opdracht is een opening met een eigen evaluatie. Hoe hoger het cijfer, hoe sterker jouw stelling in die stelling."
      />

      <div className="flex flex-wrap items-center gap-2">
        <div
          className="flex min-w-0 flex-1 items-center gap-2 rounded-[3px] px-3 py-2"
          style={{ background: C.paneel, border: `1px solid ${C.lijn}` }}
        >
          <Search size={15} style={{ color: C.inktFlets }} aria-hidden="true" />
          <input
            value={zoek}
            onChange={(e) => setZoek(e.target.value)}
            placeholder="Zoek op titel, plaats of opdrachtgever"
            aria-label="Opdrachten zoeken"
            className="w-full min-w-0 bg-transparent text-[13px] outline-none"
            style={{ color: C.inkt }}
          />
        </div>
        <div
          className="flex flex-wrap items-center gap-1"
          role="group"
          aria-label="Demo-weergave van dit scherm"
        >
          {(["gereed", "laden", "leeg", "fout"] as Weergave[]).map((w) => (
            <button
              key={w}
              type="button"
              onClick={() => setWeergave(w)}
              aria-pressed={weergave === w}
              className="rounded-[3px] px-2.5 py-1.5 text-[11px] transition-colors focus-visible:outline-none focus-visible:ring-2"
              style={{
                ...mono,
                background: weergave === w ? C.veldDonker : C.paneel,
                color: weergave === w ? C.perkamentLicht : C.inktZacht,
                border: `1px solid ${weergave === w ? C.veldDonker : C.lijn}`,
                ...({ "--tw-ring-color": C.smaragd } as React.CSSProperties),
              }}
            >
              {w}
            </button>
          ))}
        </div>
      </div>

      {weergave === "laden" && (
        <div className="space-y-2" aria-busy="true" aria-live="polite">
          <p
            className="flex items-center gap-2 text-[12px]"
            style={{ ...mono, color: C.inktFlets }}
          >
            <RefreshCw size={13} className="sb-draai" aria-hidden="true" /> Stelling wordt
            opgebouwd…
          </p>
          {[0, 1, 2].map((n) => (
            <div
              key={n}
              className="rounded-[4px] p-4"
              style={{ background: C.paneel, border: `1px solid ${C.lijn}` }}
            >
              <div className="flex items-center gap-3">
                <div className="h-16 w-3 rounded-[2px]" style={{ background: C.lijnZacht }} />
                <div className="min-w-0 flex-1 space-y-2">
                  <div className="h-3.5 w-2/3 rounded-[2px]" style={{ background: C.lijnZacht }} />
                  <div className="h-2.5 w-1/3 rounded-[2px]" style={{ background: C.lijnZacht }} />
                  <div className="h-2.5 w-1/2 rounded-[2px]" style={{ background: C.lijnZacht }} />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {weergave === "fout" && (
        <div
          className="flex flex-col items-start gap-3 rounded-[4px] p-6"
          style={{ background: C.paneel, border: `1px solid ${C.robijn}44` }}
          role="alert"
        >
          <span
            className="inline-flex items-center gap-2 text-[13px] font-medium"
            style={{ color: C.robijn }}
          >
            <AlertTriangle size={16} aria-hidden="true" /> Partij afgebroken
          </span>
          <p className="max-w-lg text-[13px] leading-relaxed" style={{ color: C.inktZacht }}>
            We konden het openingenboek niet ophalen. Je zetten zijn bewaard; er is niets verloren
            gegaan.
          </p>
          <button
            type="button"
            onClick={() => setWeergave("gereed")}
            className="inline-flex items-center gap-2 rounded-[3px] px-3.5 py-2 text-[12.5px] font-medium focus-visible:outline-none focus-visible:ring-2"
            style={{
              background: C.smaragdDiep,
              color: "#fff",
              ...({ "--tw-ring-color": C.smaragd } as React.CSSProperties),
            }}
          >
            <RefreshCw size={14} aria-hidden="true" /> Opnieuw laden
          </button>
        </div>
      )}

      {weergave !== "laden" && weergave !== "fout" && resultaten.length === 0 && (
        <div
          className="flex flex-col items-start gap-3 rounded-[4px] p-6"
          style={{ background: C.paneel, border: `1px dashed ${C.lijn}` }}
        >
          <span
            className="inline-flex items-center gap-2 text-[13px] font-medium"
            style={{ color: C.inkt }}
          >
            <Search size={16} aria-hidden="true" /> Geen opening gevonden
          </span>
          <p className="max-w-lg text-[13px] leading-relaxed" style={{ color: C.inktZacht }}>
            {zoek
              ? `Geen resultaat voor “${zoek}”. Verruim je zoekopdracht of wis het filter.`
              : "Er staan op dit moment geen opdrachten in je werkgebied. Zodra er één binnenkomt, verschijnt hij hier als nieuwe zet."}
          </p>
          <button
            type="button"
            onClick={() => {
              setZoek("");
              setWeergave("gereed");
            }}
            className="inline-flex items-center gap-2 rounded-[3px] px-3.5 py-2 text-[12.5px] font-medium focus-visible:outline-none focus-visible:ring-2"
            style={{
              background: C.smaragdVeld,
              color: C.smaragdDiep,
              border: `1px solid ${C.smaragd}33`,
              ...({ "--tw-ring-color": C.smaragd } as React.CSSProperties),
            }}
          >
            Filters wissen
          </button>
        </div>
      )}

      {weergave !== "laden" && weergave !== "fout" && resultaten.length > 0 && (
        <ul className="space-y-2">
          {resultaten.map((o, i) => (
            <li key={o.id}>
              <article
                className="rounded-[4px] p-4 transition-shadow hover:shadow-[0_2px_10px_rgba(28,26,23,0.07)]"
                style={{ background: C.paneel, border: `1px solid ${C.lijn}` }}
              >
                <div className="flex flex-wrap items-start gap-4">
                  <EvalBalk match={o.match} hoogte={86} />
                  <div className="min-w-0 flex-1">
                    <p className="text-[11px]" style={{ ...mono, color: C.inktFlets }}>
                      opening {i + 1} · {o.id}
                    </p>
                    <h3
                      className="mt-0.5 text-[17px] leading-tight"
                      style={{ ...kop, color: C.inkt }}
                    >
                      {o.titel}
                    </h3>
                    <p
                      className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-[12.5px]"
                      style={{ color: C.inktZacht }}
                    >
                      <span>{o.opdrachtgever}</span>
                      <span aria-hidden="true">·</span>
                      <span className="inline-flex items-center gap-1">
                        <MapPin size={12} aria-hidden="true" /> {o.plaats}
                      </span>
                      <span aria-hidden="true">·</span>
                      <span style={mono}>{o.tarief}</span>
                      <span aria-hidden="true">·</span>
                      <span>{o.uren}</span>
                    </p>
                    <ul className="mt-2 flex flex-wrap gap-1.5">
                      {o.tags.map((t) => (
                        <li
                          key={t}
                          className="rounded-[3px] px-2 py-0.5 text-[11px]"
                          style={{
                            ...mono,
                            background: C.perkament,
                            color: C.inktZacht,
                            border: `1px solid ${C.lijnZacht}`,
                          }}
                        >
                          {t}
                        </li>
                      ))}
                    </ul>
                  </div>
                  <button
                    type="button"
                    onClick={() => onOpen(o)}
                    className="inline-flex shrink-0 items-center gap-1.5 self-center rounded-[3px] px-3.5 py-2 text-[12.5px] font-medium focus-visible:outline-none focus-visible:ring-2"
                    style={{
                      background: C.smaragdDiep,
                      color: "#fff",
                      ...({ "--tw-ring-color": C.smaragd } as React.CSSProperties),
                    }}
                  >
                    Analyseren <ArrowRight size={13} aria-hidden="true" />
                  </button>
                </div>
              </article>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

// ── Scherm 3 — Analyse (opdracht-detail) ──────────────────────────────────────────────
function AnalyseScherm({ opdracht, onTerug }: { opdracht: Opdracht; onTerug: () => void }) {
  const [gereageerd, setGereageerd] = useState(false);
  const [bewaard, setBewaard] = useState(false);

  const feiten: { label: string; waarde: string }[] = [
    { label: "Tarief", waarde: opdracht.tarief },
    { label: "Omvang", waarde: opdracht.uren },
    { label: "Start", waarde: opdracht.start },
    { label: "Plaats", waarde: opdracht.plaats },
  ];

  return (
    <div className="space-y-4">
      <button
        type="button"
        onClick={onTerug}
        className="inline-flex items-center gap-1.5 rounded-[3px] px-2 py-1 text-[12.5px] focus-visible:outline-none focus-visible:ring-2"
        style={{
          color: C.inktZacht,
          ...({ "--tw-ring-color": C.smaragd } as React.CSSProperties),
        }}
      >
        <ArrowLeft size={14} aria-hidden="true" /> Terug naar het openingenboek
      </button>

      <SectieKop
        boven={`§3 · Analyse · ${opdracht.id}`}
        titel={opdracht.titel}
        onder={`${opdracht.opdrachtgever} · ${opdracht.plaats} · ${opdracht.start}`}
      />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,300px)]">
        <div className="space-y-4">
          <Paneel titel="Evaluatie van de stelling" bijschrift="waarom dit cijfer">
            <div className="flex flex-wrap items-start gap-5">
              <EvalBalk match={opdracht.match} hoogte={130} />
              <div className="min-w-0 flex-1 space-y-3">
                <div>
                  <p
                    className="mb-1.5 text-[10.5px] uppercase tracking-[0.16em]"
                    style={{ ...mono, color: C.inktFlets }}
                  >
                    Sterke zetten in jouw voordeel
                  </p>
                  <ul className="space-y-1.5">
                    {opdracht.redenen.plus.map((r) => (
                      <li
                        key={r}
                        className="flex items-start gap-2 text-[13px]"
                        style={{ color: C.inkt }}
                      >
                        <span
                          className="mt-[1px] shrink-0 text-[13px] font-semibold"
                          style={{ ...mono, color: C.smaragdDiep }}
                        >
                          !
                        </span>
                        <Check
                          size={14}
                          className="mt-0.5 shrink-0"
                          style={{ color: C.smaragdDiep }}
                          aria-hidden="true"
                        />
                        <span className="min-w-0">{r}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                <div>
                  <p
                    className="mb-1.5 text-[10.5px] uppercase tracking-[0.16em]"
                    style={{ ...mono, color: C.inktFlets }}
                  >
                    Zwakke velden om te wegen
                  </p>
                  <ul className="space-y-1.5">
                    {opdracht.redenen.min.map((r) => (
                      <li
                        key={r}
                        className="flex items-start gap-2 text-[13px]"
                        style={{ color: C.inkt }}
                      >
                        <span
                          className="mt-[1px] shrink-0 text-[13px] font-semibold"
                          style={{ ...mono, color: C.robijn }}
                        >
                          ?!
                        </span>
                        <AlertTriangle
                          size={13}
                          className="mt-0.5 shrink-0"
                          style={{ color: C.robijn }}
                          aria-hidden="true"
                        />
                        <span className="min-w-0">{r}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          </Paneel>

          <Paneel titel="Variantenboom" bijschrift="wat er gebeurt na jouw zet">
            <ol className="space-y-2">
              {[
                {
                  zet: "R×" + opdracht.id.slice(-2),
                  kop: "Je reageert vandaag",
                  tekst:
                    "Gemiddelde reactietijd van deze opdrachtgever is 6 uur. Je staat dan in de eerste ronde.",
                  teken: "!" as const,
                },
                {
                  zet: "V+ b4",
                  kop: "Je vernieuwt eerst je VOG",
                  tekst: "Veiliger, maar kost 2 dagen. De opdracht kan intussen vergeven worden.",
                  teken: "!?" as const,
                },
                {
                  zet: "0–0",
                  kop: "Je wacht af",
                  tekst: "Geen risico, geen resultaat. Deze opdracht sluit over 4 dagen.",
                  teken: "?" as const,
                },
              ].map((v, i) => {
                const kleur =
                  v.teken === "!" ? C.smaragdDiep : v.teken === "!?" ? C.oker : C.robijn;
                return (
                  <li
                    key={v.zet}
                    className="flex items-start gap-3 rounded-[3px] p-3"
                    style={{ background: C.perkament, border: `1px solid ${C.lijnZacht}` }}
                  >
                    <span
                      className="shrink-0 text-[12px] tabular-nums"
                      style={{ ...mono, color: C.inktFlets }}
                    >
                      {10 + i}.
                    </span>
                    <span
                      className="shrink-0 text-[12.5px] font-medium"
                      style={{ ...mono, color: C.inkt }}
                    >
                      {v.zet}
                    </span>
                    <span
                      className="shrink-0 text-[13px] font-semibold"
                      style={{ ...mono, color: kleur }}
                    >
                      {v.teken}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block text-[13px] font-medium" style={{ color: C.inkt }}>
                        {v.kop}
                      </span>
                      <span
                        className="mt-0.5 block text-[12.5px] leading-relaxed"
                        style={{ color: C.inktZacht }}
                      >
                        {v.tekst}
                      </span>
                    </span>
                  </li>
                );
              })}
            </ol>
          </Paneel>
        </div>

        <div className="space-y-4">
          <Paneel titel="Stellingsgegevens">
            <dl className="space-y-2">
              {feiten.map((f) => (
                <div key={f.label} className="flex items-baseline justify-between gap-3">
                  <dt className="text-[11.5px]" style={{ ...mono, color: C.inktFlets }}>
                    {f.label}
                  </dt>
                  <dd
                    className="min-w-0 truncate text-[13px] font-medium"
                    style={{ color: C.inkt }}
                  >
                    {f.waarde}
                  </dd>
                </div>
              ))}
            </dl>
            <ul className="mt-3 flex flex-wrap gap-1.5">
              {opdracht.tags.map((t) => (
                <li
                  key={t}
                  className="rounded-[3px] px-2 py-0.5 text-[11px]"
                  style={{
                    ...mono,
                    background: C.perkament,
                    color: C.inktZacht,
                    border: `1px solid ${C.lijnZacht}`,
                  }}
                >
                  {t}
                </li>
              ))}
            </ul>
          </Paneel>

          <Paneel titel="Jouw zet" bijschrift="klok loopt: nog 6 u 40">
            <div className="space-y-2">
              <button
                type="button"
                onClick={() => setGereageerd(true)}
                disabled={gereageerd}
                className="flex w-full items-center justify-center gap-2 rounded-[3px] px-4 py-2.5 text-[13px] font-medium focus-visible:outline-none focus-visible:ring-2 disabled:cursor-not-allowed disabled:opacity-50"
                style={{
                  background: C.smaragdDiep,
                  color: "#fff",
                  ...({ "--tw-ring-color": C.smaragd } as React.CSSProperties),
                }}
              >
                <Send size={14} aria-hidden="true" />
                {gereageerd ? "Reactie verstuurd" : "Reageren op deze opdracht"}
              </button>
              <button
                type="button"
                onClick={() => setBewaard((v) => !v)}
                aria-pressed={bewaard}
                className="flex w-full items-center justify-center gap-2 rounded-[3px] px-4 py-2.5 text-[13px] font-medium focus-visible:outline-none focus-visible:ring-2"
                style={{
                  background: bewaard ? C.smaragdVeld : C.paneel,
                  color: bewaard ? C.smaragdDiep : C.inktZacht,
                  border: `1px solid ${bewaard ? `${C.smaragd}33` : C.lijn}`,
                  ...({ "--tw-ring-color": C.smaragd } as React.CSSProperties),
                }}
              >
                {bewaard ? "Bewaard in je repertoire" : "Bewaren voor later"}
              </button>
              {gereageerd && (
                <p
                  className="rounded-[3px] p-2.5 text-[12px] leading-relaxed"
                  style={{ background: C.smaragdVeld, color: C.smaragdDiep }}
                  aria-live="polite"
                >
                  Zet genoteerd als <span style={mono}>R×e5 !</span> — de opdrachtgever is nu aan
                  zet.
                </p>
              )}
            </div>
          </Paneel>
        </div>
      </div>
    </div>
  );
}

// ── Scherm 4 — Dossier (verificatie) ──────────────────────────────────────────────────
const MATERIAAL: Record<string, { punten: string; rol: string }> = {
  "BIG-registratie": { punten: "9", rol: "dame — bepaalt je bereik" },
  "Diploma Verpleegkunde (hbo-v)": { punten: "5", rol: "toren — vaste basis" },
  "VOG (zorg)": { punten: "3", rol: "loper — verliest waarde bij verval" },
  "Reanimatie / BLS": { punten: "3", rol: "paard — sterk in de spits" },
};

function DossierScherm({ onGa }: { onGa: (s: Scherm) => void }) {
  const [geregeld, setGeregeld] = useState<string[]>([]);
  const geverifieerd = CREDENTIALS.filter((c) => c.status === "VERIFIED").length;

  return (
    <div className="space-y-4">
      <SectieKop
        boven="§4 · Materiaal"
        titel="Verificatie van je certificaten"
        onder={`${geverifieerd} van ${CREDENTIALS.length} certificaten zijn geverifieerd. Materiaal dat verloopt telt niet mee in je stelling.`}
      />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,280px)]">
        <Paneel titel="Je materiaal" bijschrift="waarde · status · actie">
          <ul className="space-y-2">
            {CREDENTIALS.map((c) => {
              const m = credMeta(c.status);
              const mat = MATERIAAL[c.naam];
              const isGeregeld = geregeld.includes(c.naam);
              return (
                <li
                  key={c.naam}
                  className="flex flex-wrap items-center gap-3 rounded-[3px] p-3"
                  style={{ background: C.perkament, border: `1px solid ${C.lijnZacht}` }}
                >
                  <span
                    className="flex h-10 w-10 shrink-0 flex-col items-center justify-center rounded-[3px]"
                    style={{ background: C.veldDonker, color: C.perkamentLicht }}
                    aria-hidden="true"
                  >
                    <span className="text-[14px] font-semibold leading-none" style={mono}>
                      {mat?.punten ?? "1"}
                    </span>
                    <span className="mt-0.5 text-[8px] leading-none" style={mono}>
                      pt
                    </span>
                  </span>
                  <div className="min-w-0 flex-1">
                    <h3 className="text-[14px] leading-tight" style={{ ...kop, color: C.inkt }}>
                      {c.naam}
                    </h3>
                    <p className="text-[12px]" style={{ color: C.inktZacht }}>
                      {c.detail}
                    </p>
                    {mat && (
                      <p className="text-[11px]" style={{ ...mono, color: C.inktFlets }}>
                        {mat.rol}
                      </p>
                    )}
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    <Chip label={m.label} kleur={m.kleur} Icon={m.Icon} />
                    {c.status === "VERIFIED" ? (
                      <button
                        type="button"
                        disabled
                        className="cursor-not-allowed rounded-[3px] px-3 py-1.5 text-[12px] opacity-50"
                        style={{ border: `1px solid ${C.lijn}`, color: C.inktZacht }}
                        title="Dit certificaat is geverifieerd; er is nu geen actie nodig."
                      >
                        Geen actie nodig
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() =>
                          setGeregeld((v) => (v.includes(c.naam) ? v : [...v, c.naam]))
                        }
                        className="rounded-[3px] px-3 py-1.5 text-[12px] font-medium focus-visible:outline-none focus-visible:ring-2"
                        style={{
                          background: isGeregeld ? C.smaragdVeld : C.paneel,
                          color: isGeregeld ? C.smaragdDiep : C.inkt,
                          border: `1px solid ${isGeregeld ? `${C.smaragd}33` : C.lijn}`,
                          ...({ "--tw-ring-color": C.smaragd } as React.CSSProperties),
                        }}
                      >
                        {isGeregeld ? "Aangevraagd" : "Regelen"}
                      </button>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
          {geregeld.length > 0 && (
            <p
              className="mt-3 text-[12px] leading-relaxed"
              style={{ color: C.smaragdDiep }}
              aria-live="polite"
            >
              {geregeld.length} aanvraag genoteerd als zet. Je hoort binnen twee werkdagen of het
              materiaal is goedgekeurd.
            </p>
          )}
        </Paneel>

        <div className="space-y-4">
          <Paneel titel="Vertrouwensniveau">
            <div className="flex items-center gap-3">
              <ShieldCheck size={26} style={{ color: C.smaragdDiep }} aria-hidden="true" />
              <div className="min-w-0">
                <div className="text-[16px] leading-tight" style={{ ...kop, color: C.inkt }}>
                  {PROFIEL.trust}
                </div>
                <p className="text-[12px]" style={{ color: C.inktZacht }}>
                  Documenten blijven privé; opdrachtgevers zien alleen de status.
                </p>
              </div>
            </div>
            <div
              className="mt-3 h-2 w-full overflow-hidden rounded-full"
              style={{ background: C.lijnZacht }}
              role="img"
              aria-label={`${Math.round((geverifieerd / CREDENTIALS.length) * 100)} procent van je certificaten is geverifieerd`}
            >
              <div
                className="h-full"
                style={{
                  width: `${Math.round((geverifieerd / CREDENTIALS.length) * 100)}%`,
                  background: C.smaragd,
                }}
              />
            </div>
          </Paneel>

          <Paneel titel="Volgende zet">
            <p className="text-[13px] leading-relaxed" style={{ color: C.inktZacht }}>
              Je VOG verloopt over 23 dagen. Zonder geldige VOG vervalt je stelling bij drie van je
              vier opdrachtgevers.
            </p>
            <button
              type="button"
              onClick={() => onGa("kandidaten")}
              className="mt-3 inline-flex items-center gap-1.5 rounded-[3px] px-3.5 py-2 text-[12.5px] font-medium focus-visible:outline-none focus-visible:ring-2"
              style={{
                background: C.smaragdDiep,
                color: "#fff",
                ...({ "--tw-ring-color": C.smaragd } as React.CSSProperties),
              }}
            >
              Naar de kandidaatzetten <ArrowRight size={13} aria-hidden="true" />
            </button>
          </Paneel>
        </div>
      </div>
    </div>
  );
}

// ── Scherm 5 — Kandidaatzetten (acties) ───────────────────────────────────────────────
function KandidatenScherm({ onGa }: { onGa: (s: Scherm) => void }) {
  const [gespeeld, setGespeeld] = useState<string | null>(null);

  const gesorteerd = useMemo(
    () =>
      [...ACTIES].sort((a, b) =>
        a.urgentie === b.urgentie ? 0 : a.urgentie === "warning" ? -1 : 1,
      ),
    [],
  );

  const doelen: Record<string, Scherm> = {
    "VOG vernieuwen": "dossier",
    "Bekijk matches": "openingen",
    "Herinnering sturen": "facturen",
  };

  return (
    <div className="space-y-4">
      <SectieKop
        boven="§5 · Kandidaatzetten"
        titel="Wat je nu het beste kunt doen"
        onder="Op volgorde van evaluatie. De bovenste zet levert het meeste op; de rest kan wachten."
      />

      <ol className="space-y-2">
        {gesorteerd.map((a, i) => {
          const teken = a.urgentie === "warning" ? "!" : "!?";
          const kleur = a.urgentie === "warning" ? C.robijn : C.smaragdDiep;
          const doel = doelen[a.cta];
          return (
            <li key={a.titel}>
              <article
                className="flex flex-wrap items-start gap-3 rounded-[4px] p-4"
                style={{ background: C.paneel, border: `1px solid ${C.lijn}` }}
              >
                <span
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[3px] text-[13px] font-semibold"
                  style={{
                    ...mono,
                    background: C.perkament,
                    color: C.inkt,
                    border: `1px solid ${C.lijnZacht}`,
                  }}
                  aria-hidden="true"
                >
                  {i + 1}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-baseline gap-2">
                    <h3 className="text-[15px] leading-tight" style={{ ...kop, color: C.inkt }}>
                      {a.titel}
                    </h3>
                    <span className="text-[13px] font-semibold" style={{ ...mono, color: kleur }}>
                      {teken}
                    </span>
                    <Chip
                      label={a.urgentie === "warning" ? "Vraagt actie" : "Kans"}
                      kleur={kleur}
                      Icon={a.urgentie === "warning" ? AlertTriangle : Flag}
                    />
                  </div>
                  <p className="mt-1 text-[12.5px] leading-relaxed" style={{ color: C.inktZacht }}>
                    {a.detail}
                  </p>
                  {gespeeld === a.titel && (
                    <p
                      className="mt-2 text-[12px]"
                      style={{ color: C.smaragdDiep }}
                      aria-live="polite"
                    >
                      Zet gespeeld en genoteerd in je partijverslag.
                    </p>
                  )}
                </div>
                <div className="flex shrink-0 flex-col items-stretch gap-1.5">
                  <button
                    type="button"
                    onClick={() => setGespeeld(a.titel)}
                    className="rounded-[3px] px-3.5 py-2 text-[12.5px] font-medium focus-visible:outline-none focus-visible:ring-2"
                    style={{
                      background: C.smaragdDiep,
                      color: "#fff",
                      ...({ "--tw-ring-color": C.smaragd } as React.CSSProperties),
                    }}
                  >
                    {a.cta}
                  </button>
                  {doel && (
                    <button
                      type="button"
                      onClick={() => onGa(doel)}
                      className="rounded-[3px] px-3.5 py-2 text-[12px] focus-visible:outline-none focus-visible:ring-2"
                      style={{
                        color: C.inktZacht,
                        border: `1px solid ${C.lijn}`,
                        ...({ "--tw-ring-color": C.smaragd } as React.CSSProperties),
                      }}
                    >
                      Open scherm
                    </button>
                  )}
                </div>
              </article>
            </li>
          );
        })}
      </ol>
    </div>
  );
}

// ── Scherm 6 — Facturen ───────────────────────────────────────────────────────────────
function FacturenScherm() {
  const [herinnerd, setHerinnerd] = useState<string[]>([]);

  const kleurVoor = (status: string): string =>
    status === "Betaald" ? C.smaragdDiep : status === "Openstaand" ? C.oker : C.inktFlets;
  const iconVoor = (status: string): LucideIcon =>
    status === "Betaald" ? CheckCircle2 : status === "Openstaand" ? Clock : FileText;

  return (
    <div className="space-y-4">
      <SectieKop
        boven="§6 · Kasboek"
        titel="Facturen"
        onder="Een openstaande factuur is een zet die de tegenpartij nog moet doen. Na 14 dagen mag je aandringen."
      />

      <div
        className="overflow-x-auto rounded-[4px]"
        style={{ background: C.paneel, border: `1px solid ${C.lijn}` }}
      >
        <table className="w-full min-w-[620px] border-collapse text-left">
          <caption className="sr-only">Overzicht van je facturen met status en bedrag.</caption>
          <thead>
            <tr>
              {["Zet", "Nummer", "Opdrachtgever", "Datum", "Status", "Bedrag", "Actie"].map((h) => (
                <th
                  key={h}
                  scope="col"
                  className="border-b px-3 py-2 text-[10.5px] uppercase tracking-[0.14em]"
                  style={{ ...mono, color: C.inktFlets, borderColor: C.lijn }}
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {FACTUREN.map((f, i) => {
              const kleur = kleurVoor(f.status);
              const Icon = iconVoor(f.status);
              const isHerinnerd = herinnerd.includes(f.nr);
              return (
                <tr key={f.nr} style={{ borderBottom: `1px solid ${C.lijnZacht}` }}>
                  <td
                    className="px-3 py-2.5 text-[12px] tabular-nums"
                    style={{ ...mono, color: C.inktFlets }}
                  >
                    {7 + i}. F
                  </td>
                  <td className="px-3 py-2.5 text-[12.5px]" style={{ ...mono, color: C.inkt }}>
                    {f.nr}
                  </td>
                  <td className="px-3 py-2.5 text-[13px]" style={{ color: C.inkt }}>
                    {f.klant}
                  </td>
                  <td className="px-3 py-2.5 text-[12.5px]" style={{ ...mono, color: C.inktZacht }}>
                    {f.datum}
                  </td>
                  <td className="px-3 py-2.5">
                    <Chip label={f.status} kleur={kleur} Icon={Icon} />
                  </td>
                  <td
                    className="px-3 py-2.5 text-right text-[13px] font-medium tabular-nums"
                    style={{ ...mono, color: C.inkt }}
                  >
                    {f.bedrag}
                  </td>
                  <td className="px-3 py-2.5">
                    {f.status === "Openstaand" ? (
                      <button
                        type="button"
                        onClick={() => setHerinnerd((v) => (v.includes(f.nr) ? v : [...v, f.nr]))}
                        className="rounded-[3px] px-3 py-1.5 text-[12px] font-medium focus-visible:outline-none focus-visible:ring-2"
                        style={{
                          background: isHerinnerd ? C.smaragdVeld : C.paneel,
                          color: isHerinnerd ? C.smaragdDiep : C.inkt,
                          border: `1px solid ${isHerinnerd ? `${C.smaragd}33` : C.lijn}`,
                          ...({ "--tw-ring-color": C.smaragd } as React.CSSProperties),
                        }}
                      >
                        {isHerinnerd ? "Herinnerd" : "Herinneren"}
                      </button>
                    ) : (
                      <button
                        type="button"
                        disabled
                        className="cursor-not-allowed rounded-[3px] px-3 py-1.5 text-[12px] opacity-50"
                        style={{ border: `1px solid ${C.lijn}`, color: C.inktZacht }}
                        title={
                          f.status === "Betaald"
                            ? "Deze factuur is betaald; herinneren is niet nodig."
                            : "Een concept kun je pas versturen als alle regels zijn ingevuld."
                        }
                      >
                        Niet nodig
                      </button>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <p className="text-[12px] leading-relaxed" style={{ color: C.inktFlets }}>
        Totaal openstaand: <span style={mono}>€ 1.350</span> · gemiddelde betaaltermijn 12 dagen.
      </p>
    </div>
  );
}

// ── Scherm 7 — Archief (documenten) ───────────────────────────────────────────────────
function ArchiefScherm() {
  const [gekozen, setGekozen] = useState<string | null>(DOCUMENTEN[0]!.naam);
  const doc = DOCUMENTEN.find((d) => d.naam === gekozen) ?? null;

  return (
    <div className="space-y-4">
      <SectieKop
        boven="§7 · Archief"
        titel="Documenten"
        onder="Alles wat je hebt ingediend, in de volgorde waarin het is genoteerd. Documenten zijn privé; alleen de status is zichtbaar voor opdrachtgevers."
      />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,300px)]">
        <Paneel titel="Ingediende stukken" bijschrift={`${DOCUMENTEN.length} documenten`}>
          <ul className="space-y-1.5">
            {DOCUMENTEN.map((d, i) => {
              const m = credMeta(d.status);
              const actief = gekozen === d.naam;
              return (
                <li key={d.naam}>
                  <button
                    type="button"
                    onClick={() => setGekozen(d.naam)}
                    aria-pressed={actief}
                    className="flex w-full flex-wrap items-center gap-3 rounded-[3px] px-3 py-2.5 text-left transition-colors hover:bg-[#efe9db] focus-visible:outline-none focus-visible:ring-2"
                    style={{
                      background: actief ? C.smaragdVeld : C.perkament,
                      border: `1px solid ${actief ? `${C.smaragd}33` : C.lijnZacht}`,
                      ...({ "--tw-ring-color": C.smaragd } as React.CSSProperties),
                    }}
                  >
                    <span
                      className="text-[11px] tabular-nums"
                      style={{ ...mono, color: C.inktFlets }}
                    >
                      {i + 1}. D
                    </span>
                    <FileText size={15} style={{ color: C.inktZacht }} aria-hidden="true" />
                    <span className="min-w-0 flex-1">
                      <span
                        className="block truncate text-[13px] font-medium"
                        style={{ color: C.inkt }}
                      >
                        {d.naam}
                      </span>
                      <span className="block text-[11.5px]" style={{ ...mono, color: C.inktFlets }}>
                        {d.type} · {d.grootte} · bijgewerkt {d.bijgewerkt}
                      </span>
                    </span>
                    <Chip label={m.label} kleur={m.kleur} Icon={m.Icon} />
                  </button>
                </li>
              );
            })}
          </ul>
        </Paneel>

        <Paneel titel="Detail" bijschrift={doc ? doc.type : "—"}>
          {doc ? (
            <div className="space-y-3">
              <div
                className="flex aspect-[3/4] w-full items-center justify-center rounded-[3px]"
                style={{ background: C.perkament, border: `1px solid ${C.lijnZacht}` }}
                aria-hidden="true"
              >
                <FileText size={40} strokeWidth={1.2} style={{ color: C.lijn }} />
              </div>
              <div>
                <h3 className="text-[15px] leading-tight" style={{ ...kop, color: C.inkt }}>
                  {doc.naam}
                </h3>
                <p className="mt-1 text-[12px]" style={{ ...mono, color: C.inktFlets }}>
                  {doc.grootte} · bijgewerkt {doc.bijgewerkt}
                </p>
              </div>
              <button
                type="button"
                disabled
                className="w-full cursor-not-allowed rounded-[3px] px-3 py-2 text-[12.5px] opacity-50"
                style={{ border: `1px solid ${C.lijn}`, color: C.inktZacht }}
                title="Voorbeeldweergave is in dit ontwerpconcept uitgeschakeld — er staan geen echte documenten achter."
              >
                Voorbeeld openen
              </button>
            </div>
          ) : (
            <p className="text-[12.5px]" style={{ color: C.inktZacht }}>
              Kies een document uit de lijst.
            </p>
          )}
        </Paneel>
      </div>
    </div>
  );
}

// ── Scherm 8 — Arbiter (admin-verificatiequeue) ───────────────────────────────────────
type QueueRij = {
  id: string;
  zzper: string;
  stuk: string;
  ingediend: string;
  bemiddelaar: string;
};

const QUEUE: QueueRij[] = [
  {
    id: "VER-3312",
    zzper: "Sanne de Vries",
    stuk: "Reanimatie / BLS",
    ingediend: "21 juni",
    bemiddelaar: "Zorgbemiddeling Midden",
  },
  {
    id: "VER-3309",
    zzper: "Youssef Bakker",
    stuk: "VOG (zorg)",
    ingediend: "20 juni",
    bemiddelaar: "Zorgbemiddeling Midden",
  },
  {
    id: "VER-3305",
    zzper: "Marieke Blom",
    stuk: "Diploma VIG",
    ingediend: "19 juni",
    bemiddelaar: "Flexzorg Noord",
  },
  {
    id: "VER-3301",
    zzper: "Ali Demir",
    stuk: "BIG-registratie",
    ingediend: "18 juni",
    bemiddelaar: "Flexzorg Noord",
  },
];

function ArbiterScherm() {
  const [besluiten, setBesluiten] = useState<Record<string, "goed" | "afgewezen">>({});
  const [afwijzing, setAfwijzing] = useState<string | null>(null);
  const [reden, setReden] = useState("");

  const openstaand = QUEUE.filter((r) => !besluiten[r.id]).length;

  return (
    <div className="space-y-4">
      <SectieKop
        boven="§8 · Arbiter"
        titel="Verificatiequeue en bemiddelaars"
        onder="De arbiter beoordeelt ingediend materiaal. Afwijzen kan alleen met een reden — die reden gaat mee in het partijverslag."
      />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,280px)]">
        <Paneel titel="Te beoordelen" bijschrift={`${openstaand} openstaand`}>
          {openstaand === 0 ? (
            <div
              className="flex flex-col items-start gap-2 rounded-[3px] p-5"
              style={{ background: C.perkament, border: `1px dashed ${C.lijn}` }}
            >
              <span
                className="inline-flex items-center gap-2 text-[13px] font-medium"
                style={{ color: C.smaragdDiep }}
              >
                <CheckCircle2 size={16} aria-hidden="true" /> Queue leeg
              </span>
              <p className="text-[12.5px] leading-relaxed" style={{ color: C.inktZacht }}>
                Alle ingediende stukken zijn beoordeeld. Nieuwe indieningen verschijnen hier als
                nieuwe zet.
              </p>
            </div>
          ) : (
            <ul className="space-y-2">
              {QUEUE.map((r) => {
                const besluit = besluiten[r.id];
                if (besluit) return null;
                const bezigMetAfwijzen = afwijzing === r.id;
                return (
                  <li
                    key={r.id}
                    className="rounded-[3px] p-3"
                    style={{ background: C.perkament, border: `1px solid ${C.lijnZacht}` }}
                  >
                    <div className="flex flex-wrap items-start gap-3">
                      <div className="min-w-0 flex-1">
                        <p className="text-[11px]" style={{ ...mono, color: C.inktFlets }}>
                          {r.id} · ingediend {r.ingediend} · {r.bemiddelaar}
                        </p>
                        <h3
                          className="mt-0.5 text-[14px] leading-tight"
                          style={{ ...kop, color: C.inkt }}
                        >
                          {r.stuk}
                        </h3>
                        <p className="text-[12.5px]" style={{ color: C.inktZacht }}>
                          {r.zzper}
                        </p>
                      </div>
                      <div className="flex shrink-0 gap-1.5">
                        <button
                          type="button"
                          onClick={() => {
                            setBesluiten((v) => ({ ...v, [r.id]: "goed" }));
                            setAfwijzing(null);
                          }}
                          className="inline-flex items-center gap-1.5 rounded-[3px] px-3 py-1.5 text-[12px] font-medium focus-visible:outline-none focus-visible:ring-2"
                          style={{
                            background: C.smaragdDiep,
                            color: "#fff",
                            ...({ "--tw-ring-color": C.smaragd } as React.CSSProperties),
                          }}
                        >
                          <Check size={13} aria-hidden="true" /> Goedkeuren
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setAfwijzing(bezigMetAfwijzen ? null : r.id);
                            setReden("");
                          }}
                          aria-expanded={bezigMetAfwijzen}
                          className="inline-flex items-center gap-1.5 rounded-[3px] px-3 py-1.5 text-[12px] font-medium focus-visible:outline-none focus-visible:ring-2"
                          style={{
                            color: C.robijn,
                            border: `1px solid ${C.robijn}44`,
                            ...({ "--tw-ring-color": C.smaragd } as React.CSSProperties),
                          }}
                        >
                          <XCircle size={13} aria-hidden="true" /> Afwijzen
                        </button>
                      </div>
                    </div>

                    {bezigMetAfwijzen && (
                      <div className="mt-3 border-t pt-3" style={{ borderColor: C.lijnZacht }}>
                        <label
                          className="block text-[11.5px]"
                          style={{ ...mono, color: C.inktFlets }}
                          htmlFor={`reden-${r.id}`}
                        >
                          Reden van afwijzing (verplicht)
                        </label>
                        <textarea
                          id={`reden-${r.id}`}
                          value={reden}
                          onChange={(e) => setReden(e.target.value)}
                          rows={2}
                          className="mt-1 w-full resize-y rounded-[3px] p-2 text-[12.5px] outline-none focus-visible:ring-2"
                          style={{
                            background: C.paneel,
                            color: C.inkt,
                            border: `1px solid ${C.lijn}`,
                            ...({ "--tw-ring-color": C.smaragd } as React.CSSProperties),
                          }}
                          placeholder="Bijvoorbeeld: het certificaat is niet leesbaar."
                        />
                        <div className="mt-2 flex flex-wrap gap-2">
                          <button
                            type="button"
                            disabled={reden.trim().length < 4}
                            onClick={() => {
                              setBesluiten((v) => ({ ...v, [r.id]: "afgewezen" }));
                              setAfwijzing(null);
                            }}
                            className="rounded-[3px] px-3 py-1.5 text-[12px] font-medium focus-visible:outline-none focus-visible:ring-2 disabled:cursor-not-allowed disabled:opacity-45"
                            style={{
                              background: C.robijn,
                              color: "#fff",
                              ...({ "--tw-ring-color": C.smaragd } as React.CSSProperties),
                            }}
                          >
                            Afwijzing vastleggen
                          </button>
                          <button
                            type="button"
                            onClick={() => setAfwijzing(null)}
                            className="rounded-[3px] px-3 py-1.5 text-[12px] focus-visible:outline-none focus-visible:ring-2"
                            style={{
                              color: C.inktZacht,
                              border: `1px solid ${C.lijn}`,
                              ...({ "--tw-ring-color": C.smaragd } as React.CSSProperties),
                            }}
                          >
                            Annuleren
                          </button>
                        </div>
                        {reden.trim().length < 4 && (
                          <p className="mt-1.5 text-[11.5px]" style={{ color: C.inktFlets }}>
                            Vul eerst een reden in — zonder reden kan de afwijzing niet worden
                            vastgelegd.
                          </p>
                        )}
                      </div>
                    )}
                  </li>
                );
              })}
            </ul>
          )}
        </Paneel>

        <div className="space-y-4">
          <Paneel titel="Bemiddelaars" bijschrift="doorlooptijd per kantoor">
            <ul className="space-y-2">
              {[
                { naam: "Zorgbemiddeling Midden", zzpers: "48 ZZP'ers", doorloop: "1,4 dag" },
                { naam: "Flexzorg Noord", zzpers: "31 ZZP'ers", doorloop: "2,7 dag" },
                { naam: "Thuiszorgpool West", zzpers: "12 ZZP'ers", doorloop: "0,9 dag" },
              ].map((b) => (
                <li key={b.naam} className="flex items-start gap-2.5">
                  <Users
                    size={15}
                    className="mt-0.5 shrink-0"
                    style={{ color: C.inktFlets }}
                    aria-hidden="true"
                  />
                  <div className="min-w-0 flex-1">
                    <div className="text-[13px] font-medium" style={{ color: C.inkt }}>
                      {b.naam}
                    </div>
                    <div className="text-[11.5px]" style={{ ...mono, color: C.inktFlets }}>
                      {b.zzpers} · gemiddeld {b.doorloop}
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </Paneel>

          <Paneel titel="Besluiten deze sessie">
            {Object.keys(besluiten).length === 0 ? (
              <p className="text-[12.5px] leading-relaxed" style={{ color: C.inktZacht }}>
                Nog geen besluiten genomen. Elk besluit wordt vastgelegd in het partijverslag.
              </p>
            ) : (
              <ul className="space-y-1.5">
                {Object.entries(besluiten).map(([id, b]) => (
                  <li key={id} className="flex items-center justify-between gap-2">
                    <span className="text-[12px]" style={{ ...mono, color: C.inktZacht }}>
                      {id}
                    </span>
                    <Chip
                      label={b === "goed" ? "Goedgekeurd" : "Afgewezen"}
                      kleur={b === "goed" ? C.smaragdDiep : C.robijn}
                      Icon={b === "goed" ? Check : XCircle}
                    />
                  </li>
                ))}
              </ul>
            )}
          </Paneel>
        </div>
      </div>
    </div>
  );
}

// ── Root ───────────────────────────────────────────────────────────────────────────────
export function Concept559() {
  const [scherm, setScherm] = useState<Scherm>("partij");
  const [opdracht, setOpdracht] = useState<Opdracht>(OPDRACHTEN[0]!);

  return (
    <div
      className="min-h-screen w-full overflow-x-hidden antialiased"
      style={{ background: C.perkament, color: C.inkt, fontFamily: "var(--font-lab-plex-mono)" }}
    >
      <style>{`
        @keyframes sbDraai { to { transform: rotate(360deg); } }
        .sb-draai { animation: sbDraai 1.3s linear infinite; }
        @media (prefers-reduced-motion: reduce) { .sb-draai { animation: none !important; } }
      `}</style>

      <header className="border-b" style={{ background: C.perkamentLicht, borderColor: C.lijn }}>
        <div className="mx-auto flex max-w-[1400px] flex-wrap items-center justify-between gap-3 px-4 py-3 sm:px-6">
          <div className="flex min-w-0 items-center gap-3">
            <span
              className="grid h-9 w-9 shrink-0 grid-cols-2 grid-rows-2 overflow-hidden rounded-[3px]"
              style={{ border: `1px solid ${C.veldDonker}` }}
              aria-hidden="true"
            >
              <span style={{ background: C.veldLicht }} />
              <span style={{ background: C.veldDonker }} />
              <span style={{ background: C.veldDonker }} />
              <span style={{ background: C.veldLicht }} />
            </span>
            <div className="min-w-0">
              <h1
                className="text-[17px] leading-tight tracking-[-0.01em]"
                style={{ ...kop, color: C.inkt }}
              >
                Schaakbord
              </h1>
              <p className="truncate text-[11px]" style={{ color: C.inktFlets }}>
                Partij 2025-118 · {PROFIEL.naam} tegenover drie opdrachtgevers
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span
              className="hidden items-center gap-1.5 rounded-[3px] px-2.5 py-1 text-[11.5px] sm:inline-flex"
              style={{
                background: C.smaragdVeld,
                color: C.smaragdDiep,
                border: `1px solid ${C.smaragd}33`,
              }}
            >
              <Flag size={12} aria-hidden="true" /> Jij bent aan zet
            </span>
            <span
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[3px] text-[11px] font-semibold"
              style={{ background: C.veldDonker, color: C.perkamentLicht }}
              aria-hidden="true"
            >
              {PROFIEL.initialen}
            </span>
          </div>
        </div>

        <nav aria-label="Schermen" className="mx-auto max-w-[1400px] px-4 sm:px-6">
          <div role="tablist" aria-label="Schermen" className="flex gap-1 overflow-x-auto pb-2">
            {SCHERMEN.map((s) => {
              const actief = s.key === scherm;
              return (
                <button
                  key={s.key}
                  type="button"
                  role="tab"
                  id={`sb-tab-${s.key}`}
                  aria-selected={actief}
                  aria-controls={`sb-paneel-${s.key}`}
                  tabIndex={actief ? 0 : -1}
                  onClick={() => setScherm(s.key)}
                  className="shrink-0 rounded-t-[3px] px-3 py-1.5 text-left transition-colors focus-visible:outline-none focus-visible:ring-2"
                  style={{
                    background: actief ? C.paneel : "transparent",
                    borderTop: `1px solid ${actief ? C.lijn : "transparent"}`,
                    borderLeft: `1px solid ${actief ? C.lijn : "transparent"}`,
                    borderRight: `1px solid ${actief ? C.lijn : "transparent"}`,
                    borderBottom: `2px solid ${actief ? C.smaragd : "transparent"}`,
                    ...({ "--tw-ring-color": C.smaragd } as React.CSSProperties),
                  }}
                >
                  <span
                    className="block text-[9.5px] tracking-[0.14em]"
                    style={{ color: C.inktFlets }}
                  >
                    {s.code}
                  </span>
                  <span
                    className="block text-[13px] leading-tight"
                    style={{ ...kop, color: actief ? C.inkt : C.inktZacht }}
                  >
                    {s.label}
                  </span>
                </button>
              );
            })}
          </div>
        </nav>
      </header>

      <main className="mx-auto max-w-[1400px] px-4 py-5 sm:px-6 sm:py-7">
        {SCHERMEN.map((s) => (
          <div
            key={s.key}
            role="tabpanel"
            id={`sb-paneel-${s.key}`}
            aria-labelledby={`sb-tab-${s.key}`}
            hidden={s.key !== scherm}
          >
            {s.key === scherm && (
              <>
                {s.key === "partij" && <PartijScherm onGa={setScherm} />}
                {s.key === "openingen" && (
                  <OpeningenScherm
                    onOpen={(o) => {
                      setOpdracht(o);
                      setScherm("analyse");
                    }}
                  />
                )}
                {s.key === "analyse" && (
                  <AnalyseScherm opdracht={opdracht} onTerug={() => setScherm("openingen")} />
                )}
                {s.key === "dossier" && <DossierScherm onGa={setScherm} />}
                {s.key === "kandidaten" && <KandidatenScherm onGa={setScherm} />}
                {s.key === "facturen" && <FacturenScherm />}
                {s.key === "archief" && <ArchiefScherm />}
                {s.key === "arbiter" && <ArbiterScherm />}
              </>
            )}
          </div>
        ))}
      </main>

      <footer
        className="mx-auto max-w-[1400px] px-4 pb-8 pt-2 text-[11px] sm:px-6"
        style={{ color: C.inktFlets }}
      >
        Notatie: elke gebeurtenis krijgt een nummer, een symbool en een tijd. Zo is achteraf altijd
        te zien wie wanneer aan zet was.
      </footer>
    </div>
  );
}
