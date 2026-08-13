"use client";

// Concept 554 — "Opstelling" · het tactiekbord als ordenend principe. Mensen en rollen staan als
// posities op een veld in plaats van als rijen in een tabel: de samenwerking wordt een formatie,
// verbindingslijnen tonen wie met wie werkt, en openstaande diensten staan als "wissels" op de bank.
// Krijt-op-groen, maar modern en clean — de sportmetafoor ordent, ze speelt niet.
// Inspiratie/bronnen: tactiekborden en formatie-editors (lineup-builder.co.uk/tactics-board,
// buildlineup.com, athletepath.com/soccer-tactics-board) — drag-and-drop posities, lijnen tussen
// spelers, bank/wissels naast het veld; plus scoutingrapporten met attribuutbalken en de
// speelgerechtigdheids-/keuringskaart uit het amateurvoetbal.
// Deterministisch: geen random, geen datum-afhankelijkheid. Alle grafiek is eigen SVG/CSS.
// Fonts: Bricolage Grotesque (koppen) + Spline Sans Mono (cijfers, labels, codes).

import { useCallback, useMemo, useState } from "react";
import {
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  ArrowRightLeft,
  Ban,
  Check,
  ChevronDown,
  Clock,
  Coins,
  FileText,
  Flag,
  Inbox,
  MapPin,
  RefreshCw,
  Search,
  Send,
  ShieldCheck,
  Users,
  WifiOff,
  XCircle,
  type LucideIcon,
} from "lucide-react";
import {
  ACTIES,
  BERICHTEN,
  CREDENTIALS,
  FACTUREN,
  KPIS,
  OPDRACHTEN,
  PROFIEL,
  type CredStatus,
  type Opdracht,
  type ScreenKey,
} from "./mock";

// ── Palet — diep veldgroen, krijtwit lijnwerk, signaaloranje voor wat nu actie vraagt ────────
const C = {
  veld: "#0f3d2e",
  veldDiep: "#0a2c21",
  veldLicht: "#164a38",
  krijt: "#f2f5ef",
  krijtZacht: "#b8c9bf",
  krijtFaint: "#9ab3a4",
  lijn: "rgba(242,245,239,0.20)",
  lijnZacht: "rgba(242,245,239,0.10)",
  oranje: "#ff6b35",
  oranjeLicht: "#ff8a5c",
  ok: "#67d9a8",
  warn: "#ffc247",
  bad: "#ff8f80",
} as const;

const kop = { fontFamily: "var(--font-lab-bricolage)" };
const mono = { fontFamily: "var(--font-lab-spline-mono)" };

type Scherm = ScreenKey | "competitie";

const SCHERMEN: { key: Scherm; label: string; onder: string }[] = [
  { key: "dashboard", label: "Opstelling", onder: "Dashboard" },
  { key: "marktplaats", label: "Transfermarkt", onder: "Marktplaats" },
  { key: "opdracht", label: "Wedstrijdplan", onder: "Opdracht" },
  { key: "verificatie", label: "Keuring", onder: "Verificatie" },
  { key: "acties", label: "Coachbord", onder: "Acties" },
  { key: "facturen", label: "Uitbetaling", onder: "Facturen" },
  { key: "berichten", label: "Kleedkamer", onder: "Berichten" },
  { key: "competitie", label: "Competitie", onder: "Bemiddelaar" },
];

// ── Lokale, presentationele mock — de formatie ─────────────────────────────────────────────
type Lijn = "keeper" | "achter" | "midden" | "voor";

type Speler = {
  naam: string;
  initialen: string;
  rol: string;
  lijn: Lijn;
  nr: number;
  speelgerechtigd: boolean;
  note: string;
};

const TEAM: Speler[] = [
  {
    naam: "Ruben Aalders",
    initialen: "RA",
    rol: "Planner backoffice",
    lijn: "keeper",
    nr: 1,
    speelgerechtigd: true,
    note: "Bewaakt roosters en meldingen",
  },
  {
    naam: "Fatima El Amrani",
    initialen: "FE",
    rol: "Verzorgende IG",
    lijn: "achter",
    nr: 2,
    speelgerechtigd: true,
    note: "Vaste route Overvecht",
  },
  {
    naam: "Joost Bakker",
    initialen: "JB",
    rol: "Verzorgende IG",
    lijn: "achter",
    nr: 3,
    speelgerechtigd: true,
    note: "Ochtend + avond",
  },
  {
    naam: "Nienke Prins",
    initialen: "NP",
    rol: "Helpende plus",
    lijn: "achter",
    nr: 4,
    speelgerechtigd: false,
    note: "VOG verloopt — keuring nodig",
  },
  {
    naam: "Ali Yildiz",
    initialen: "AY",
    rol: "Verzorgende IG",
    lijn: "achter",
    nr: 5,
    speelgerechtigd: true,
    note: "Rijdt eigen vervoer",
  },
  {
    naam: "Marit Douma",
    initialen: "MD",
    rol: "Coördinator wijkteam",
    lijn: "midden",
    nr: 6,
    speelgerechtigd: true,
    note: "Schakelt tussen zorg en kantoor",
  },
  {
    naam: "Sanne de Vries",
    initialen: "SdV",
    rol: "Wijkverpleegkundige",
    lijn: "midden",
    nr: 8,
    speelgerechtigd: true,
    note: "Jij — indicatie en regie",
  },
  {
    naam: "Timo Kortekaas",
    initialen: "TK",
    rol: "Begeleider GGZ",
    lijn: "midden",
    nr: 10,
    speelgerechtigd: true,
    note: "Ambulant, flexibel inzetbaar",
  },
  {
    naam: "Iris Vermeulen",
    initialen: "IV",
    rol: "Wijkverpleegkundige",
    lijn: "voor",
    nr: 7,
    speelgerechtigd: true,
    note: "Wondzorg specialisatie",
  },
  {
    naam: "Peter Sanders",
    initialen: "PS",
    rol: "Verpleegkundige nacht",
    lijn: "voor",
    nr: 9,
    speelgerechtigd: false,
    note: "BIG-check in beoordeling",
  },
  {
    naam: "Lotte Meijer",
    initialen: "LM",
    rol: "Verzorgende IG",
    lijn: "voor",
    nr: 11,
    speelgerechtigd: true,
    note: "Weekenddiensten",
  },
];

// Verbindingen tussen posities: wie werkt structureel met wie samen (indexen in TEAM).
const VERBINDINGEN: [number, number][] = [
  [0, 2],
  [0, 3],
  [1, 5],
  [2, 5],
  [3, 6],
  [4, 6],
  [5, 6],
  [5, 7],
  [6, 7],
  [6, 8],
  [7, 10],
  [8, 9],
  [9, 10],
];

// Twee formaties over hetzelfde team — coördinaten in het veld-coördinatenstelsel (100 × 140).
type Punt = { x: number; y: number };

const FORMATIES: { id: string; label: string; onder: string; punten: Punt[] }[] = [
  {
    id: "4-3-3",
    label: "4-3-3",
    onder: "Volledige wijkdekking",
    punten: [
      { x: 50, y: 128 },
      { x: 17, y: 104 },
      { x: 39, y: 106 },
      { x: 61, y: 106 },
      { x: 83, y: 104 },
      { x: 27, y: 76 },
      { x: 50, y: 70 },
      { x: 73, y: 76 },
      { x: 21, y: 40 },
      { x: 50, y: 32 },
      { x: 79, y: 40 },
    ],
  },
  {
    id: "3-5-2",
    label: "3-5-2",
    onder: "Krappe bezetting, breed midden",
    punten: [
      { x: 50, y: 128 },
      { x: 27, y: 106 },
      { x: 50, y: 110 },
      { x: 73, y: 106 },
      { x: 11, y: 78 },
      { x: 31, y: 72 },
      { x: 50, y: 80 },
      { x: 69, y: 72 },
      { x: 89, y: 78 },
      { x: 37, y: 36 },
      { x: 63, y: 36 },
    ],
  },
];

// Attribuutwaarden — deterministisch afgeleid van de index, geen random.
const ATTRIBUUT_LABELS = ["Beschikbaarheid", "Reisafstand", "Ervaring", "Beoordeling"] as const;

function attribuut(spelerIndex: number, attrIndex: number): number {
  return 58 + ((spelerIndex * 11 + attrIndex * 17) % 41);
}

// Openstaande diensten = de wissels op de bank.
const BANK: { rol: string; dienst: string; plaats: string; tarief: string; urgent: boolean }[] = [
  {
    rol: "Wijkverpleegkundige",
    dienst: "Avond · ma/wo/vr",
    plaats: "Utrecht Noord",
    tarief: "€ 62",
    urgent: true,
  },
  {
    rol: "Verzorgende IG",
    dienst: "Ochtend · di/do",
    plaats: "Utrecht Oost",
    tarief: "€ 48",
    urgent: false,
  },
  {
    rol: "Verpleegkundige nacht",
    dienst: "Nacht · za",
    plaats: "Zeist",
    tarief: "€ 71",
    urgent: true,
  },
  {
    rol: "Begeleider GGZ",
    dienst: "Ambulant · flexibel",
    plaats: "Zeist",
    tarief: "€ 55",
    urgent: false,
  },
];

const CLUBS = [
  { club: "Thuiszorg De Linde", regio: "Utrecht", bezet: 18, totaal: 20, openstaand: 2 },
  { club: "Zorggroep Almere", regio: "Almere", bezet: 11, totaal: 16, openstaand: 5 },
  { club: "Kwintes", regio: "Zeist", bezet: 7, totaal: 8, openstaand: 1 },
  { club: "Buurtzorg Leidsche Rijn", regio: "Utrecht West", bezet: 9, totaal: 14, openstaand: 5 },
];

const THREAD: { van: "wij" | "zij"; tekst: string; tijd: string }[] = [
  { van: "zij", tekst: "Hoi Sanne, we zoeken nog dekking voor de avonddienst.", tijd: "08:41" },
  { van: "wij", tekst: "Ik kan maandag en woensdag. Vrijdag lukt niet.", tijd: "09:02" },
  {
    van: "zij",
    tekst: "Top, we plannen je graag in voor de avonddienst per 1 juli.",
    tijd: "09:24",
  },
];

// ── Kleine, gedeelde bouwstenen ────────────────────────────────────────────────────────────
function credMeta(s: CredStatus): { label: string; Icon: LucideIcon; tone: string } {
  switch (s) {
    case "VERIFIED":
      return { label: "Geverifieerd", Icon: Check, tone: C.ok };
    case "SUBMITTED":
      return { label: "In beoordeling", Icon: Clock, tone: C.krijtZacht };
    case "EXPIRING":
      return { label: "Verloopt binnenkort", Icon: AlertTriangle, tone: C.warn };
    case "REJECTED":
      return { label: "Afgewezen", Icon: XCircle, tone: C.bad };
  }
}

function Chip({ status }: { status: CredStatus }) {
  const m = credMeta(status);
  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-sm px-2 py-1 text-[11px] font-semibold uppercase tracking-[0.08em]"
      style={{ ...mono, color: m.tone, border: `1px solid ${m.tone}`, background: "transparent" }}
    >
      <m.Icon size={12} strokeWidth={2.4} aria-hidden="true" />
      {m.label}
    </span>
  );
}

function Kaart({
  children,
  className = "",
  titel,
}: {
  children: React.ReactNode;
  className?: string;
  titel?: string;
}) {
  return (
    <section
      className={`rounded-lg p-4 sm:p-5 ${className}`}
      style={{ background: C.veldLicht, border: `1px solid ${C.lijn}` }}
      aria-label={titel}
    >
      {children}
    </section>
  );
}

function SectieKop({ children, sub }: { children: React.ReactNode; sub?: string }) {
  return (
    <div className="mb-4">
      <h2
        className="text-[17px] font-semibold leading-tight tracking-[-0.01em] sm:text-[20px]"
        style={{ ...kop, color: C.krijt }}
      >
        {children}
      </h2>
      {sub ? (
        <p
          className="mt-1 text-[11px] uppercase tracking-[0.14em]"
          style={{ ...mono, color: C.krijtFaint }}
        >
          {sub}
        </p>
      ) : null}
    </div>
  );
}

function Balk({ waarde, label, vergelijk }: { waarde: number; label: string; vergelijk?: number }) {
  return (
    <div>
      <div className="flex items-baseline justify-between gap-2">
        <span className="text-[12px]" style={{ color: C.krijtZacht }}>
          {label}
        </span>
        <span className="text-[12px] tabular-nums" style={{ ...mono, color: C.krijt }}>
          {waarde}
          {vergelijk !== undefined ? (
            <span style={{ color: C.oranjeLicht }}> / {vergelijk}</span>
          ) : null}
        </span>
      </div>
      <div
        className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full"
        style={{ background: "rgba(242,245,239,0.14)" }}
        aria-hidden="true"
      >
        <div className="h-full rounded-full" style={{ width: `${waarde}%`, background: C.krijt }} />
      </div>
      {vergelijk !== undefined ? (
        <div
          className="mt-1 h-1.5 w-full overflow-hidden rounded-full"
          style={{ background: "rgba(242,245,239,0.14)" }}
          aria-hidden="true"
        >
          <div
            className="h-full rounded-full"
            style={{ width: `${vergelijk}%`, background: C.oranje }}
          />
        </div>
      ) : null}
    </div>
  );
}

// ── Het veld — pure SVG krijtlijnen + toetsenbord-bedienbare posities ───────────────────────
function Veld({
  formatieIndex,
  actief,
  vergelijk,
  onKies,
}: {
  formatieIndex: number;
  actief: number;
  vergelijk: number | null;
  onKies: (i: number) => void;
}) {
  const formatie = FORMATIES[formatieIndex] ?? FORMATIES[0]!;
  const punten = formatie.punten;

  return (
    <div
      className="relative mx-auto w-full max-w-[460px]"
      style={{ aspectRatio: "100 / 140" }}
      role="group"
      aria-label={`Veldopstelling ${formatie.label}`}
    >
      <svg
        viewBox="0 0 100 140"
        className="absolute inset-0 h-full w-full"
        aria-hidden="true"
        focusable="false"
      >
        <rect x="0" y="0" width="100" height="140" rx="2" fill={C.veldDiep} />
        {/* maaibanen */}
        {[0, 1, 2, 3, 4, 5, 6].map((n) => (
          <rect
            key={n}
            x="0"
            y={n * 20}
            width="100"
            height="20"
            fill={n % 2 === 0 ? "rgba(242,245,239,0.028)" : "transparent"}
          />
        ))}
        <g stroke={C.krijt} strokeOpacity="0.5" strokeWidth="0.5" fill="none">
          <rect x="3" y="3" width="94" height="134" />
          <line x1="3" y1="70" x2="97" y2="70" />
          <circle cx="50" cy="70" r="12" />
          <circle cx="50" cy="70" r="0.9" fill={C.krijt} stroke="none" fillOpacity="0.5" />
          {/* strafschopgebieden */}
          <rect x="21" y="3" width="58" height="20" />
          <rect x="35" y="3" width="30" height="9" />
          <rect x="21" y="117" width="58" height="20" />
          <rect x="35" y="128" width="30" height="9" />
          {/* doelen */}
          <rect x="41" y="0.6" width="18" height="2.4" />
          <rect x="41" y="137" width="18" height="2.4" />
        </g>
        {/* verbindingslijnen tussen posities */}
        <g>
          {VERBINDINGEN.map(([a, b]) => {
            const pa = punten[a];
            const pb = punten[b];
            if (!pa || !pb) return null;
            const raakt = a === actief || b === actief;
            return (
              <line
                key={`${a}-${b}`}
                x1={pa.x}
                y1={pa.y}
                x2={pb.x}
                y2={pb.y}
                stroke={raakt ? C.oranje : C.krijt}
                strokeOpacity={raakt ? 0.9 : 0.16}
                strokeWidth={raakt ? 0.7 : 0.4}
                strokeDasharray={raakt ? "none" : "2 2"}
              />
            );
          })}
        </g>
      </svg>

      {TEAM.map((s, i) => {
        const p = punten[i];
        if (!p) return null;
        const isActief = i === actief;
        const isVergelijk = i === vergelijk;
        const rand = isActief ? C.oranje : isVergelijk ? C.krijt : "rgba(242,245,239,0.45)";
        return (
          <button
            key={s.naam}
            type="button"
            onClick={() => onKies(i)}
            aria-pressed={isActief}
            className="absolute flex flex-col items-center gap-1 rounded-md p-1 transition-transform hover:scale-[1.08] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#ff6b35]"
            style={{
              left: `${p.x}%`,
              top: `${(p.y / 140) * 100}%`,
              transform: "translate(-50%, -50%)",
            }}
          >
            <span
              className="flex items-center justify-center rounded-full text-[10px] font-semibold leading-none sm:text-[11px]"
              style={{
                ...mono,
                width: 30,
                height: 30,
                background: isActief ? C.oranje : C.veld,
                color: isActief ? C.veldDiep : C.krijt,
                border: `1.5px solid ${rand}`,
              }}
            >
              {s.nr}
            </span>
            <span
              className="max-w-[64px] truncate text-[9.5px] font-medium leading-none sm:text-[10.5px]"
              style={{ ...mono, color: isActief ? C.krijt : C.krijtZacht }}
            >
              {s.initialen}
            </span>
            {!s.speelgerechtigd ? (
              <span
                className="absolute -right-0.5 -top-0.5 flex h-3.5 w-3.5 items-center justify-center rounded-full"
                style={{ background: C.warn, color: C.veldDiep }}
                title="Niet speelgerechtigd"
              >
                <AlertTriangle size={9} strokeWidth={3} aria-hidden="true" />
                <span className="sr-only">Niet speelgerechtigd</span>
              </span>
            ) : null}
          </button>
        );
      })}
    </div>
  );
}

// ── Root ────────────────────────────────────────────────────────────────────────────────────
export function Concept554() {
  const [scherm, setScherm] = useState<Scherm>("dashboard");
  const [opdrachtId, setOpdrachtId] = useState<string>(OPDRACHTEN[0]!.id);
  const opdracht = useMemo(
    () => OPDRACHTEN.find((o) => o.id === opdrachtId) ?? OPDRACHTEN[0]!,
    [opdrachtId],
  );

  const open = useCallback((id: string) => {
    setOpdrachtId(id);
    setScherm("opdracht");
  }, []);

  return (
    <div
      className="min-h-screen w-full antialiased"
      style={{ fontFamily: "var(--font-lab-bricolage)", background: C.veld, color: C.krijt }}
    >
      <style>{`
        @keyframes opsPulse { 0%,100% { opacity: .35 } 50% { opacity: .85 } }
        .ops-pulse { animation: opsPulse 1.6s ease-in-out infinite; }
        @media (prefers-reduced-motion: reduce) { .ops-pulse { animation: none !important; } }
      `}</style>

      <header
        className="sticky top-0 z-20 border-b backdrop-blur"
        style={{ borderColor: C.lijn, background: "rgba(15,61,46,0.92)" }}
      >
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-3 sm:px-6">
          <div className="flex min-w-0 items-center gap-3">
            <span
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md"
              style={{ background: C.oranje, color: C.veldDiep }}
              aria-hidden="true"
            >
              <Flag size={17} strokeWidth={2.4} />
            </span>
            <div className="min-w-0 leading-tight">
              <div className="truncate text-[15px] font-semibold tracking-[-0.01em]">
                Opstelling
              </div>
              <div
                className="truncate text-[10.5px] uppercase tracking-[0.16em]"
                style={{ ...mono, color: C.krijtFaint }}
              >
                Wijkteam Utrecht · {PROFIEL.naam}
              </div>
            </div>
          </div>
          <span
            className="hidden shrink-0 items-center gap-2 rounded-sm px-2.5 py-1 text-[11px] uppercase tracking-[0.1em] sm:inline-flex"
            style={{ ...mono, border: `1px solid ${C.lijn}`, color: C.krijtZacht }}
          >
            <ShieldCheck size={13} aria-hidden="true" style={{ color: C.ok }} />
            {PROFIEL.trust}
          </span>
        </div>

        <nav className="mx-auto max-w-6xl px-4 sm:px-6" aria-label="Schermen">
          <div className="flex gap-1 overflow-x-auto pb-2" role="tablist">
            {SCHERMEN.map((s) => {
              const on = s.key === scherm;
              return (
                <button
                  key={s.key}
                  role="tab"
                  type="button"
                  id={`ops-tab-${s.key}`}
                  aria-selected={on}
                  aria-controls="ops-panel"
                  onClick={() => setScherm(s.key)}
                  className="shrink-0 rounded-sm px-3 py-1.5 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#ff6b35]"
                  style={{
                    background: on ? C.krijt : "transparent",
                    color: on ? C.veldDiep : C.krijtZacht,
                    border: `1px solid ${on ? C.krijt : C.lijn}`,
                  }}
                >
                  <span className="block text-[12.5px] font-semibold leading-tight">{s.label}</span>
                  <span
                    className="block text-[9.5px] uppercase leading-tight tracking-[0.14em]"
                    style={{ ...mono, color: on ? C.veld : C.krijtFaint }}
                  >
                    {s.onder}
                  </span>
                </button>
              );
            })}
          </div>
        </nav>
      </header>

      <main
        id="ops-panel"
        role="tabpanel"
        aria-labelledby={`ops-tab-${scherm}`}
        className="mx-auto max-w-6xl px-4 py-6 sm:px-6 sm:py-8"
      >
        {scherm === "dashboard" && <Dashboard onNaarMarkt={() => setScherm("marktplaats")} />}
        {scherm === "marktplaats" && <Transfermarkt onOpen={open} />}
        {scherm === "opdracht" && (
          <Wedstrijdplan opdracht={opdracht} onTerug={() => setScherm("marktplaats")} />
        )}
        {scherm === "verificatie" && <Keuring />}
        {scherm === "acties" && <Coachbord onNaarKeuring={() => setScherm("verificatie")} />}
        {scherm === "facturen" && <Uitbetaling />}
        {scherm === "berichten" && <Kleedkamer />}
        {scherm === "competitie" && <Competitie onOpen={() => setScherm("marktplaats")} />}
        {scherm === "documenten" && <Keuring />}
      </main>
    </div>
  );
}

// ── Dashboard — het bord ────────────────────────────────────────────────────────────────────
function Dashboard({ onNaarMarkt }: { onNaarMarkt: () => void }) {
  const [formatieIndex, setFormatieIndex] = useState(0);
  const [actief, setActief] = useState(6);
  const [vergelijkModus, setVergelijkModus] = useState(false);
  const [vergelijk, setVergelijk] = useState<number | null>(null);

  const speler = TEAM[actief]!;
  const ander = vergelijk !== null ? TEAM[vergelijk] : undefined;
  const formatie = FORMATIES[formatieIndex] ?? FORMATIES[0]!;

  const kies = useCallback(
    (i: number) => {
      if (vergelijkModus && i !== actief) {
        setVergelijk(i);
        return;
      }
      setActief(i);
      setVergelijk(null);
    },
    [vergelijkModus, actief],
  );

  const nietGerechtigd = TEAM.filter((s) => !s.speelgerechtigd).length;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1
            className="text-[24px] font-semibold leading-tight tracking-[-0.02em] sm:text-[30px]"
            style={kop}
          >
            De opstelling van vandaag
          </h1>
          <p
            className="mt-1.5 max-w-lg text-[13px] leading-relaxed"
            style={{ color: C.krijtZacht }}
          >
            Elke positie is een mens met een rol. De lijnen tonen wie structureel samenwerkt.
            Openstaande diensten staan op de bank.
          </p>
        </div>
        <div
          className="flex items-center gap-1 rounded-md p-1"
          role="group"
          aria-label="Formatie kiezen"
          style={{ border: `1px solid ${C.lijn}` }}
        >
          {FORMATIES.map((f, i) => (
            <button
              key={f.id}
              type="button"
              onClick={() => setFormatieIndex(i)}
              aria-pressed={i === formatieIndex}
              className="rounded-sm px-3 py-1.5 text-[12px] font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#ff6b35]"
              style={{
                ...mono,
                background: i === formatieIndex ? C.oranje : "transparent",
                color: i === formatieIndex ? C.veldDiep : C.krijtZacht,
              }}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Wedstrijdstatistiek */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {KPIS.map((k) => {
          const max = Math.max(...k.spark);
          return (
            <Kaart key={k.label} className="!p-4">
              <div
                className="text-[10.5px] uppercase tracking-[0.14em]"
                style={{ ...mono, color: C.krijtFaint }}
              >
                {k.label}
              </div>
              <div
                className="mt-2 text-[22px] font-semibold tabular-nums leading-none sm:text-[26px]"
                style={kop}
              >
                {k.value}
              </div>
              <div className="mt-3 flex items-end gap-[3px]" aria-hidden="true">
                {k.spark.map((v, i) => (
                  <span
                    key={i}
                    className="flex-1 rounded-[1px]"
                    style={{
                      height: `${Math.max(8, (v / max) * 34)}px`,
                      background: i === k.spark.length - 1 ? C.oranje : "rgba(242,245,239,0.28)",
                    }}
                  />
                ))}
              </div>
              <div className="mt-2 text-[11px]" style={{ ...mono, color: C.krijtZacht }}>
                {k.up ? "▲" : "■"} {k.trend}
              </div>
            </Kaart>
          );
        })}
      </div>

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_360px]">
        <Kaart titel="Veld" className="!p-3 sm:!p-4">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
            <span
              className="text-[11px] uppercase tracking-[0.14em]"
              style={{ ...mono, color: C.krijtFaint }}
            >
              {formatie.label} · {formatie.onder}
            </span>
            <button
              type="button"
              onClick={() => {
                setVergelijkModus((v) => !v);
                setVergelijk(null);
              }}
              aria-pressed={vergelijkModus}
              className="inline-flex items-center gap-1.5 rounded-sm px-2.5 py-1 text-[11.5px] font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#ff6b35]"
              style={{
                border: `1px solid ${vergelijkModus ? C.oranje : C.lijn}`,
                color: vergelijkModus ? C.oranjeLicht : C.krijtZacht,
              }}
            >
              <ArrowRightLeft size={13} aria-hidden="true" />
              {vergelijkModus ? "Kies tweede positie" : "Vergelijken"}
            </button>
          </div>
          <Veld formatieIndex={formatieIndex} actief={actief} vergelijk={vergelijk} onKies={kies} />
          <p className="mt-3 text-center text-[11.5px]" style={{ color: C.krijtFaint }}>
            Tab door de posities, Enter of spatie selecteert.
          </p>
        </Kaart>

        <div className="space-y-4">
          {/* Scoutingkaart van de gekozen positie */}
          <Kaart titel="Positiedetail">
            <div className="flex items-start gap-3">
              <span
                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-[13px] font-semibold"
                style={{ ...mono, background: C.oranje, color: C.veldDiep }}
                aria-hidden="true"
              >
                {speler.nr}
              </span>
              <div className="min-w-0">
                <h3 className="text-[16px] font-semibold leading-tight" style={kop}>
                  {speler.naam}
                </h3>
                <p className="mt-0.5 text-[12px]" style={{ color: C.krijtZacht }}>
                  {speler.rol}
                </p>
                <p className="mt-1 text-[11.5px]" style={{ color: C.krijtFaint }}>
                  {speler.note}
                </p>
              </div>
            </div>

            <div
              className="mt-3 flex items-center gap-2 rounded-sm px-2.5 py-2"
              style={{
                border: `1px solid ${speler.speelgerechtigd ? C.ok : C.warn}`,
                color: speler.speelgerechtigd ? C.ok : C.warn,
              }}
            >
              {speler.speelgerechtigd ? (
                <ShieldCheck size={15} aria-hidden="true" />
              ) : (
                <Ban size={15} aria-hidden="true" />
              )}
              <span className="text-[12px] font-semibold" style={mono}>
                {speler.speelgerechtigd ? "Speelgerechtigd" : "Niet speelgerechtigd"}
              </span>
            </div>

            <div className="mt-4 space-y-3">
              {ATTRIBUUT_LABELS.map((label, j) => (
                <Balk
                  key={label}
                  label={label}
                  waarde={attribuut(actief, j)}
                  vergelijk={vergelijk !== null && ander ? attribuut(vergelijk, j) : undefined}
                />
              ))}
            </div>
            {ander ? (
              <p className="mt-3 text-[11.5px]" style={{ color: C.oranjeLicht }}>
                Onderste balk: {ander.naam} (#{ander.nr}).
              </p>
            ) : null}
          </Kaart>

          {/* De bank — openstaande diensten */}
          <Kaart titel="Bank">
            <SectieKop sub={`${BANK.length} wissels beschikbaar`}>Op de bank</SectieKop>
            <ul className="space-y-2">
              {BANK.map((b) => (
                <li
                  key={b.rol + b.dienst}
                  className="flex items-center justify-between gap-3 rounded-sm px-3 py-2"
                  style={{ border: `1px solid ${b.urgent ? C.oranje : C.lijn}` }}
                >
                  <div className="min-w-0">
                    <div className="truncate text-[12.5px] font-semibold">{b.rol}</div>
                    <div className="truncate text-[11px]" style={{ ...mono, color: C.krijtFaint }}>
                      {b.dienst} · {b.plaats}
                    </div>
                  </div>
                  <div className="shrink-0 text-right">
                    <div className="text-[12.5px] tabular-nums" style={mono}>
                      {b.tarief}
                    </div>
                    {b.urgent ? (
                      <div
                        className="inline-flex items-center gap-1 text-[10px] uppercase tracking-[0.1em]"
                        style={{ ...mono, color: C.oranjeLicht }}
                      >
                        <AlertTriangle size={10} aria-hidden="true" /> Nu
                      </div>
                    ) : null}
                  </div>
                </li>
              ))}
            </ul>
            <button
              type="button"
              onClick={onNaarMarkt}
              className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-sm px-4 py-2.5 text-[13px] font-semibold transition-transform hover:scale-[1.01] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#f2f5ef]"
              style={{
                background: C.oranje,
                color: C.veldDiep,
              }}
            >
              Wissel zoeken op de transfermarkt <ArrowRight size={15} aria-hidden="true" />
            </button>
          </Kaart>

          {nietGerechtigd > 0 ? (
            <div
              className="flex items-start gap-2.5 rounded-lg px-4 py-3"
              style={{ border: `1px solid ${C.warn}`, background: "rgba(255,194,71,0.08)" }}
            >
              <AlertTriangle
                size={16}
                className="mt-0.5 shrink-0"
                style={{ color: C.warn }}
                aria-hidden="true"
              />
              <p className="text-[12.5px] leading-relaxed" style={{ color: C.krijt }}>
                <span className="font-semibold">{nietGerechtigd} posities</span> zijn nog niet
                speelgerechtigd. Regel de keuring voordat de dienst start.
              </p>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}

// ── Transfermarkt (marktplaats) — filter, sorteertoggle en alle states ──────────────────────
type Toestand = "gereed" | "laden" | "leeg" | "fout";

function Transfermarkt({ onOpen }: { onOpen: (id: string) => void }) {
  const [zoek, setZoek] = useState("");
  const [sorteer, setSorteer] = useState<"match" | "tarief">("match");
  const [toestand, setToestand] = useState<Toestand>("gereed");

  const tarief = (t: string): number => Number(t.replace(/[^0-9]/g, "")) || 0;

  const lijst = useMemo(() => {
    const t = zoek.trim().toLowerCase();
    const gefilterd = OPDRACHTEN.filter(
      (o) =>
        !t ||
        o.titel.toLowerCase().includes(t) ||
        o.plaats.toLowerCase().includes(t) ||
        o.opdrachtgever.toLowerCase().includes(t),
    );
    return [...gefilterd].sort((a, b) =>
      sorteer === "match" ? b.match - a.match : tarief(b.tarief) - tarief(a.tarief),
    );
  }, [zoek, sorteer]);

  const zichtbaar = toestand === "leeg" ? [] : lijst;

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-[24px] font-semibold tracking-[-0.02em] sm:text-[30px]" style={kop}>
            Transfermarkt
          </h1>
          <p className="mt-1.5 text-[13px]" style={{ color: C.krijtZacht }}>
            Opdrachten die bij jouw positie passen — met scoutingrapport.
          </p>
        </div>
        <div
          className="flex items-center gap-1 rounded-md p-1"
          role="group"
          aria-label="Sorteren"
          style={{ border: `1px solid ${C.lijn}` }}
        >
          {(["match", "tarief"] as const).map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => setSorteer(s)}
              aria-pressed={sorteer === s}
              className="rounded-sm px-3 py-1.5 text-[11.5px] font-semibold uppercase tracking-[0.08em] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#ff6b35]"
              style={{
                ...mono,
                background: sorteer === s ? C.krijt : "transparent",
                color: sorteer === s ? C.veldDiep : C.krijtZacht,
              }}
            >
              {s === "match" ? "Op match" : "Op tarief"}
            </button>
          ))}
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <label className="sr-only" htmlFor="ops-zoek">
          Opdrachten zoeken
        </label>
        <div
          className="flex min-w-[220px] flex-1 items-center gap-2 rounded-sm px-3 py-2"
          style={{ border: `1px solid ${C.lijn}`, background: C.veldLicht }}
        >
          <Search size={15} style={{ color: C.krijtFaint }} aria-hidden="true" />
          <input
            id="ops-zoek"
            value={zoek}
            onChange={(e) => setZoek(e.target.value)}
            placeholder="Zoek op rol, plaats of opdrachtgever"
            className="w-full bg-transparent text-[13px] outline-none placeholder:opacity-70"
            style={{ color: C.krijt }}
          />
        </div>
        <div
          className="flex items-center gap-1"
          role="group"
          aria-label="Toestand van dit scherm tonen"
        >
          {(["gereed", "laden", "leeg", "fout"] as Toestand[]).map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setToestand(t)}
              aria-pressed={toestand === t}
              className="rounded-sm px-2.5 py-1.5 text-[11px] uppercase tracking-[0.08em] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#ff6b35]"
              style={{
                ...mono,
                border: `1px solid ${toestand === t ? C.oranje : C.lijn}`,
                color: toestand === t ? C.oranjeLicht : C.krijtFaint,
              }}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      {toestand === "laden" ? (
        <div className="space-y-3" aria-busy="true" aria-live="polite">
          <p className="text-[12px]" style={{ ...mono, color: C.krijtFaint }}>
            Scoutingrapporten worden opgehaald…
          </p>
          {[0, 1, 2].map((n) => (
            <div
              key={n}
              className="rounded-lg p-5"
              style={{ background: C.veldLicht, border: `1px solid ${C.lijn}` }}
            >
              <div
                className="ops-pulse h-4 w-1/2 rounded-sm"
                style={{ background: "rgba(242,245,239,0.22)" }}
              />
              <div
                className="ops-pulse mt-3 h-3 w-1/3 rounded-sm"
                style={{ background: "rgba(242,245,239,0.14)" }}
              />
              <div
                className="ops-pulse mt-4 h-1.5 w-full rounded-full"
                style={{ background: "rgba(242,245,239,0.14)" }}
              />
            </div>
          ))}
        </div>
      ) : toestand === "fout" ? (
        <Kaart className="text-center">
          <span
            className="mx-auto flex h-12 w-12 items-center justify-center rounded-full"
            style={{ border: `1px solid ${C.bad}`, color: C.bad }}
            aria-hidden="true"
          >
            <WifiOff size={20} />
          </span>
          <h2 className="mt-3 text-[17px] font-semibold" style={kop}>
            Wedstrijd gestaakt
          </h2>
          <p className="mx-auto mt-2 max-w-sm text-[13px]" style={{ color: C.krijtZacht }}>
            De transfermarkt is niet bereikbaar. Je opstelling en gegevens blijven ongewijzigd.
          </p>
          <button
            type="button"
            onClick={() => setToestand("gereed")}
            className="mt-4 inline-flex items-center gap-2 rounded-sm px-4 py-2 text-[13px] font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#f2f5ef]"
            style={{
              background: C.oranje,
              color: C.veldDiep,
            }}
          >
            <RefreshCw size={14} aria-hidden="true" /> Opnieuw fluiten
          </button>
        </Kaart>
      ) : zichtbaar.length === 0 ? (
        <Kaart className="text-center">
          <span
            className="mx-auto flex h-12 w-12 items-center justify-center rounded-full"
            style={{ border: `1px solid ${C.lijn}`, color: C.krijtFaint }}
            aria-hidden="true"
          >
            <Inbox size={20} />
          </span>
          <h2 className="mt-3 text-[17px] font-semibold" style={kop}>
            Geen kandidaten op dit veld
          </h2>
          <p className="mx-auto mt-2 max-w-sm text-[13px]" style={{ color: C.krijtZacht }}>
            Er staan nu geen opdrachten open die bij je filters passen. Verbreed je zoekopdracht.
          </p>
          <button
            type="button"
            onClick={() => {
              setZoek("");
              setToestand("gereed");
            }}
            className="mt-4 rounded-sm px-4 py-2 text-[13px] font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#ff6b35]"
            style={{
              border: `1px solid ${C.krijt}`,
              color: C.krijt,
            }}
          >
            Filters wissen
          </button>
        </Kaart>
      ) : (
        <ul className="space-y-3">
          {zichtbaar.map((o) => (
            <li key={o.id}>
              <article
                className="rounded-lg p-4 sm:p-5"
                style={{ background: C.veldLicht, border: `1px solid ${C.lijn}` }}
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <h3
                      className="text-[16px] font-semibold leading-snug sm:text-[18px]"
                      style={kop}
                    >
                      {o.titel}
                    </h3>
                    <p
                      className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-[12px]"
                      style={{ color: C.krijtZacht }}
                    >
                      <span>{o.opdrachtgever}</span>
                      <span aria-hidden="true">·</span>
                      <span className="inline-flex items-center gap-1">
                        <MapPin size={12} aria-hidden="true" /> {o.plaats}
                      </span>
                      <span aria-hidden="true">·</span>
                      <span style={mono}>{o.uren}</span>
                    </p>
                  </div>
                  <div className="shrink-0 text-right">
                    <div className="text-[13px] font-semibold tabular-nums" style={mono}>
                      {o.tarief}
                    </div>
                    <div className="text-[11px]" style={{ ...mono, color: C.krijtFaint }}>
                      {o.start}
                    </div>
                  </div>
                </div>

                <div className="mt-3">
                  <div className="flex items-center justify-between text-[11px]" style={mono}>
                    <span style={{ color: C.krijtFaint }}>Matchscore</span>
                    <span className="tabular-nums">{o.match}</span>
                  </div>
                  <div
                    className="mt-1.5 h-2 w-full overflow-hidden rounded-full"
                    style={{ background: "rgba(242,245,239,0.14)" }}
                    aria-hidden="true"
                  >
                    <div
                      className="h-full rounded-full"
                      style={{ width: `${o.match}%`, background: C.oranje }}
                    />
                  </div>
                </div>

                <div className="mt-3 flex flex-wrap items-center gap-2">
                  {o.tags.map((t) => (
                    <span
                      key={t}
                      className="rounded-sm px-2 py-0.5 text-[11px]"
                      style={{ ...mono, border: `1px solid ${C.lijn}`, color: C.krijtZacht }}
                    >
                      {t}
                    </span>
                  ))}
                </div>

                <button
                  type="button"
                  onClick={() => onOpen(o.id)}
                  className="mt-4 inline-flex items-center gap-2 rounded-sm px-4 py-2 text-[12.5px] font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#ff6b35]"
                  style={{
                    border: `1px solid ${C.krijt}`,
                    color: C.krijt,
                  }}
                >
                  Wedstrijdplan openen <ArrowRight size={14} aria-hidden="true" />
                </button>
              </article>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

// ── Wedstrijdplan (opdracht-detail) — verklaarbare match ────────────────────────────────────
function Wedstrijdplan({ opdracht, onTerug }: { opdracht: Opdracht; onTerug: () => void }) {
  const [openReden, setOpenReden] = useState<string | null>(opdracht.redenen.plus[0] ?? null);

  const feiten: { label: string; waarde: string; Icon: LucideIcon }[] = [
    { label: "Tarief", waarde: opdracht.tarief, Icon: Coins },
    { label: "Omvang", waarde: opdracht.uren, Icon: Clock },
    { label: "Start", waarde: opdracht.start, Icon: Flag },
    { label: "Plaats", waarde: opdracht.plaats, Icon: MapPin },
  ];

  return (
    <div className="space-y-5">
      <button
        type="button"
        onClick={onTerug}
        className="inline-flex items-center gap-2 text-[12.5px] font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#ff6b35]"
        style={{
          color: C.krijtZacht,
        }}
      >
        <ArrowLeft size={14} aria-hidden="true" /> Terug naar de transfermarkt
      </button>

      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="min-w-0">
          <p
            className="text-[11px] uppercase tracking-[0.16em]"
            style={{ ...mono, color: C.krijtFaint }}
          >
            {opdracht.id} · {opdracht.opdrachtgever}
          </p>
          <h1
            className="mt-1.5 text-[24px] font-semibold leading-tight tracking-[-0.02em] sm:text-[32px]"
            style={kop}
          >
            {opdracht.titel}
          </h1>
        </div>
        <div
          className="flex items-center gap-3 rounded-md px-4 py-3"
          style={{ border: `1px solid ${C.oranje}` }}
        >
          <span
            className="text-[28px] font-semibold tabular-nums leading-none"
            style={{ ...kop, color: C.oranjeLicht }}
          >
            {opdracht.match}
          </span>
          <span
            className="text-[11px] uppercase leading-tight tracking-[0.1em]"
            style={{ ...mono, color: C.krijtZacht }}
          >
            match
            <br />
            score
          </span>
        </div>
      </div>

      <dl className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {feiten.map((f) => (
          <div
            key={f.label}
            className="rounded-lg p-4"
            style={{ background: C.veldLicht, border: `1px solid ${C.lijn}` }}
          >
            <f.Icon size={15} style={{ color: C.oranjeLicht }} aria-hidden="true" />
            <dd className="mt-2 text-[14px] font-semibold tabular-nums" style={mono}>
              {f.waarde}
            </dd>
            <dt
              className="mt-0.5 text-[11px] uppercase tracking-[0.1em]"
              style={{ ...mono, color: C.krijtFaint }}
            >
              {f.label}
            </dt>
          </div>
        ))}
      </dl>

      <div className="grid gap-4 lg:grid-cols-2">
        <Kaart titel="Sterke punten">
          <SectieKop sub="Waarom deze opstelling werkt">In het voordeel</SectieKop>
          <ul className="space-y-2">
            {opdracht.redenen.plus.map((r, i) => {
              const open = openReden === r;
              return (
                <li key={r}>
                  <button
                    type="button"
                    onClick={() => setOpenReden(open ? null : r)}
                    aria-expanded={open}
                    className="flex w-full items-start gap-2.5 rounded-sm px-3 py-2.5 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#ff6b35]"
                    style={{
                      border: `1px solid ${open ? C.ok : C.lijn}`,
                    }}
                  >
                    <Check
                      size={15}
                      strokeWidth={2.6}
                      className="mt-0.5 shrink-0"
                      style={{ color: C.ok }}
                      aria-hidden="true"
                    />
                    <span className="min-w-0 flex-1">
                      <span className="block text-[13px] font-medium">{r}</span>
                      {open ? (
                        <span className="mt-2 block">
                          <Balk label="Weging in de score" waarde={72 + i * 9} />
                        </span>
                      ) : null}
                    </span>
                    <ChevronDown
                      size={15}
                      className="mt-0.5 shrink-0 transition-transform"
                      style={{
                        color: C.krijtFaint,
                        transform: open ? "rotate(180deg)" : "none",
                      }}
                      aria-hidden="true"
                    />
                  </button>
                </li>
              );
            })}
          </ul>
        </Kaart>

        <Kaart titel="Aandachtspunten">
          <SectieKop sub="Wat je moet afdekken">In het nadeel</SectieKop>
          <ul className="space-y-2">
            {opdracht.redenen.min.map((r, i) => (
              <li
                key={r}
                className="flex items-start gap-2.5 rounded-sm px-3 py-2.5"
                style={{ border: `1px solid ${C.lijn}` }}
              >
                <AlertTriangle
                  size={15}
                  strokeWidth={2.4}
                  className="mt-0.5 shrink-0"
                  style={{ color: C.warn }}
                  aria-hidden="true"
                />
                <div className="min-w-0 flex-1">
                  <p className="text-[13px] font-medium">{r}</p>
                  <div className="mt-2">
                    <Balk label="Impact op de score" waarde={26 + i * 12} />
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </Kaart>
      </div>

      <Kaart titel="Vergelijking">
        <SectieKop sub="Jouw profiel tegenover de vraag van de opdrachtgever">
          Spelersvergelijking
        </SectieKop>
        <div className="grid gap-4 sm:grid-cols-2">
          {ATTRIBUUT_LABELS.map((label, j) => (
            <Balk
              key={label}
              label={label}
              waarde={attribuut(6, j)}
              vergelijk={Math.min(99, 55 + ((opdracht.match + j * 13) % 40))}
            />
          ))}
        </div>
        <p className="mt-3 text-[11.5px]" style={{ color: C.krijtFaint }}>
          Witte balk: jouw profiel. Oranje balk: wat de opdrachtgever vraagt.
        </p>
      </Kaart>

      <div className="flex flex-wrap gap-3">
        <button
          type="button"
          className="inline-flex items-center gap-2 rounded-sm px-5 py-2.5 text-[13px] font-semibold transition-transform hover:scale-[1.01] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#f2f5ef]"
          style={{
            background: C.oranje,
            color: C.veldDiep,
          }}
        >
          Jezelf opstellen <ArrowRight size={15} aria-hidden="true" />
        </button>
        <button
          type="button"
          className="rounded-sm px-5 py-2.5 text-[13px] font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#ff6b35]"
          style={{
            border: `1px solid ${C.krijt}`,
            color: C.krijt,
          }}
        >
          Op de shortlist zetten
        </button>
        <button
          type="button"
          disabled
          title="Beschikbaar zodra je BIG-registratie opnieuw is gekeurd"
          className="rounded-sm px-5 py-2.5 text-[13px] font-semibold"
          style={{ border: `1px solid ${C.lijn}`, color: C.krijtFaint, cursor: "not-allowed" }}
        >
          Direct contracteren (keuring nodig)
        </button>
      </div>
    </div>
  );
}

// ── Keuring (verificatie) ───────────────────────────────────────────────────────────────────
function Keuring() {
  const [filter, setFilter] = useState<"alles" | "actie">("alles");
  const zichtbaar = CREDENTIALS.filter((c) => filter === "alles" || c.status !== "VERIFIED");
  const gerechtigd = CREDENTIALS.every((c) => c.status === "VERIFIED");

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-[24px] font-semibold tracking-[-0.02em] sm:text-[30px]" style={kop}>
            Keuringskaart
          </h1>
          <p className="mt-1.5 max-w-lg text-[13px]" style={{ color: C.krijtZacht }}>
            Speelgerechtigd betekent: alle vereiste papieren zijn geverifieerd en geldig. De
            documenten zelf blijven privé.
          </p>
        </div>
        <div
          className="flex items-center gap-1 rounded-md p-1"
          role="group"
          aria-label="Filter certificaten"
          style={{ border: `1px solid ${C.lijn}` }}
        >
          {(["alles", "actie"] as const).map((f) => (
            <button
              key={f}
              type="button"
              onClick={() => setFilter(f)}
              aria-pressed={filter === f}
              className="rounded-sm px-3 py-1.5 text-[11.5px] font-semibold uppercase tracking-[0.08em] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#ff6b35]"
              style={{
                ...mono,
                background: filter === f ? C.krijt : "transparent",
                color: filter === f ? C.veldDiep : C.krijtZacht,
              }}
            >
              {f === "alles" ? "Alle papieren" : "Vraagt actie"}
            </button>
          ))}
        </div>
      </div>

      {/* De keuringskaart zelf */}
      <div
        className="rounded-lg p-5"
        style={{
          border: `2px solid ${gerechtigd ? C.ok : C.warn}`,
          background: C.veldLicht,
        }}
      >
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span
              className="flex h-12 w-12 items-center justify-center rounded-full text-[14px] font-semibold"
              style={{ ...mono, background: C.krijt, color: C.veldDiep }}
              aria-hidden="true"
            >
              {PROFIEL.initialen}
            </span>
            <div>
              <div className="text-[16px] font-semibold" style={kop}>
                {PROFIEL.naam}
              </div>
              <div className="text-[12px]" style={{ ...mono, color: C.krijtFaint }}>
                {PROFIEL.rol} · {PROFIEL.plaats}
              </div>
            </div>
          </div>
          <div
            className="inline-flex items-center gap-2 rounded-sm px-3 py-2"
            style={{ border: `1px solid ${gerechtigd ? C.ok : C.warn}` }}
          >
            {gerechtigd ? (
              <ShieldCheck size={16} style={{ color: C.ok }} aria-hidden="true" />
            ) : (
              <AlertTriangle size={16} style={{ color: C.warn }} aria-hidden="true" />
            )}
            <span
              className="text-[12px] font-semibold uppercase tracking-[0.08em]"
              style={{ ...mono, color: gerechtigd ? C.ok : C.warn }}
            >
              {gerechtigd ? "Speelgerechtigd" : "Voorwaardelijk speelgerechtigd"}
            </span>
          </div>
        </div>
      </div>

      {zichtbaar.length === 0 ? (
        <Kaart className="text-center">
          <span
            className="mx-auto flex h-12 w-12 items-center justify-center rounded-full"
            style={{ border: `1px solid ${C.ok}`, color: C.ok }}
            aria-hidden="true"
          >
            <Check size={20} strokeWidth={2.6} />
          </span>
          <h2 className="mt-3 text-[17px] font-semibold" style={kop}>
            Niets te keuren
          </h2>
          <p className="mx-auto mt-2 max-w-sm text-[13px]" style={{ color: C.krijtZacht }}>
            Alle papieren zijn geverifieerd. Zet het filter terug op “alle papieren” om je dossier
            te bekijken.
          </p>
        </Kaart>
      ) : (
        <ul className="grid gap-3 sm:grid-cols-2">
          {zichtbaar.map((c) => (
            <li key={c.naam}>
              <article
                className="flex h-full flex-col justify-between rounded-lg p-4"
                style={{ background: C.veldLicht, border: `1px solid ${C.lijn}` }}
              >
                <div>
                  <div className="flex items-start justify-between gap-3">
                    <h3 className="text-[14.5px] font-semibold leading-snug" style={kop}>
                      {c.naam}
                    </h3>
                    <FileText size={16} style={{ color: C.krijtFaint }} aria-hidden="true" />
                  </div>
                  <p className="mt-1 text-[12px]" style={{ ...mono, color: C.krijtFaint }}>
                    {c.detail}
                  </p>
                </div>
                <div className="mt-4 flex flex-wrap items-center justify-between gap-2">
                  <Chip status={c.status} />
                  {c.status === "VERIFIED" ? (
                    <button
                      type="button"
                      disabled
                      title="Dit certificaat is geverifieerd; er is nu geen actie nodig"
                      className="rounded-sm px-3 py-1.5 text-[11.5px] font-semibold"
                      style={{
                        border: `1px solid ${C.lijnZacht}`,
                        color: C.krijtFaint,
                        cursor: "not-allowed",
                      }}
                    >
                      Geen actie nodig
                    </button>
                  ) : (
                    <button
                      type="button"
                      className="rounded-sm px-3 py-1.5 text-[11.5px] font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#f2f5ef]"
                      style={{
                        background: C.oranje,
                        color: C.veldDiep,
                      }}
                    >
                      Keuring regelen
                    </button>
                  )}
                </div>
              </article>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

// ── Coachbord (acties) ──────────────────────────────────────────────────────────────────────
function Coachbord({ onNaarKeuring }: { onNaarKeuring: () => void }) {
  const [gedaan, setGedaan] = useState<string[]>([]);
  const gesorteerd = useMemo(
    () =>
      [...ACTIES].sort((a, b) =>
        a.urgentie === b.urgentie ? 0 : a.urgentie === "warning" ? -1 : 1,
      ),
    [],
  );
  const openstaand = gesorteerd.filter((a) => !gedaan.includes(a.titel));

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-[24px] font-semibold tracking-[-0.02em] sm:text-[30px]" style={kop}>
          Coachbord
        </h1>
        <p className="mt-1.5 max-w-lg text-[13px]" style={{ color: C.krijtZacht }}>
          De instructies voor deze week, op volgorde van belang. Vink af wat je hebt gedaan.
        </p>
      </div>

      {openstaand.length === 0 ? (
        <Kaart className="text-center">
          <span
            className="mx-auto flex h-12 w-12 items-center justify-center rounded-full"
            style={{ border: `1px solid ${C.ok}`, color: C.ok }}
            aria-hidden="true"
          >
            <Check size={20} strokeWidth={2.6} />
          </span>
          <h2 className="mt-3 text-[17px] font-semibold" style={kop}>
            Het bord is leeg
          </h2>
          <p className="mx-auto mt-2 max-w-sm text-[13px]" style={{ color: C.krijtZacht }}>
            Alle instructies zijn afgewerkt. Nieuwe instructies verschijnen zodra er iets verandert.
          </p>
          <button
            type="button"
            onClick={() => setGedaan([])}
            className="mt-4 rounded-sm px-4 py-2 text-[13px] font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#ff6b35]"
            style={{
              border: `1px solid ${C.krijt}`,
              color: C.krijt,
            }}
          >
            Instructies terugzetten
          </button>
        </Kaart>
      ) : (
        <ol className="space-y-3">
          {openstaand.map((a, i) => {
            const tone = a.urgentie === "warning" ? C.warn : C.krijtZacht;
            return (
              <li key={a.titel}>
                <article
                  className="flex flex-wrap items-start gap-4 rounded-lg p-4 sm:p-5"
                  style={{ background: C.veldLicht, border: `1px solid ${C.lijn}` }}
                >
                  <span
                    className="flex h-9 w-9 shrink-0 items-center justify-center rounded-sm text-[13px] font-semibold tabular-nums"
                    style={{ ...mono, border: `1px solid ${tone}`, color: tone }}
                    aria-hidden="true"
                  >
                    {i + 1}
                  </span>
                  <div className="min-w-[180px] flex-1">
                    <div className="flex items-center gap-2">
                      {a.urgentie === "warning" ? (
                        <AlertTriangle size={14} style={{ color: C.warn }} aria-hidden="true" />
                      ) : (
                        <Flag size={14} style={{ color: C.krijtZacht }} aria-hidden="true" />
                      )}
                      <h3 className="text-[14.5px] font-semibold" style={kop}>
                        {a.titel}
                      </h3>
                    </div>
                    <p
                      className="mt-1.5 text-[12.5px] leading-relaxed"
                      style={{ color: C.krijtZacht }}
                    >
                      {a.detail}
                    </p>
                  </div>
                  <div className="flex shrink-0 flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={onNaarKeuring}
                      className="rounded-sm px-3.5 py-2 text-[12px] font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#f2f5ef]"
                      style={{
                        background: C.oranje,
                        color: C.veldDiep,
                      }}
                    >
                      {a.cta}
                    </button>
                    <button
                      type="button"
                      onClick={() => setGedaan((g) => [...g, a.titel])}
                      className="rounded-sm px-3.5 py-2 text-[12px] font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#ff6b35]"
                      style={{
                        border: `1px solid ${C.lijn}`,
                        color: C.krijtZacht,
                      }}
                    >
                      Afvinken
                    </button>
                  </div>
                </article>
              </li>
            );
          })}
        </ol>
      )}
    </div>
  );
}

// ── Uitbetaling (facturen) — echte tabel in eigen scrollcontainer ───────────────────────────
function Uitbetaling() {
  const [oplopend, setOplopend] = useState(false);
  const rijen = useMemo(() => {
    const bedrag = (b: string): number => Number(b.replace(/[^0-9]/g, "")) || 0;
    return [...FACTUREN].sort((a, b) =>
      oplopend ? bedrag(a.bedrag) - bedrag(b.bedrag) : bedrag(b.bedrag) - bedrag(a.bedrag),
    );
  }, [oplopend]);

  const tone = (s: string): string =>
    s === "Betaald" ? C.ok : s === "Openstaand" ? C.warn : C.krijtFaint;

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-[24px] font-semibold tracking-[-0.02em] sm:text-[30px]" style={kop}>
            Uitbetaling
          </h1>
          <p className="mt-1.5 text-[13px]" style={{ color: C.krijtZacht }}>
            Wat er binnen is en wat nog onderweg is.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setOplopend((v) => !v)}
          aria-pressed={oplopend}
          className="inline-flex items-center gap-2 rounded-sm px-3.5 py-2 text-[12px] font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#ff6b35]"
          style={{
            ...mono,
            border: `1px solid ${C.lijn}`,
            color: C.krijtZacht,
          }}
        >
          <ArrowRightLeft size={13} aria-hidden="true" />
          Bedrag {oplopend ? "oplopend" : "aflopend"}
        </button>
      </div>

      <div className="overflow-x-auto rounded-lg" style={{ border: `1px solid ${C.lijn}` }}>
        <table className="w-full min-w-[560px] border-collapse text-left">
          <caption className="sr-only">Facturen met status en bedrag</caption>
          <thead>
            <tr style={{ background: C.veldLicht }}>
              {["Factuur", "Opdrachtgever", "Datum", "Status", "Bedrag"].map((h) => (
                <th
                  key={h}
                  scope="col"
                  className="px-4 py-3 text-[10.5px] uppercase tracking-[0.14em]"
                  style={{ ...mono, color: C.krijtFaint, borderBottom: `1px solid ${C.lijn}` }}
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rijen.map((f) => (
              <tr key={f.nr} style={{ borderBottom: `1px solid ${C.lijnZacht}` }}>
                <th
                  scope="row"
                  className="px-4 py-3 text-left text-[12.5px] font-medium"
                  style={mono}
                >
                  {f.nr}
                </th>
                <td className="px-4 py-3 text-[13px]">{f.klant}</td>
                <td className="px-4 py-3 text-[12.5px]" style={{ ...mono, color: C.krijtZacht }}>
                  {f.datum}
                </td>
                <td className="px-4 py-3">
                  <span
                    className="inline-flex items-center gap-1.5 rounded-sm px-2 py-1 text-[11px] font-semibold uppercase tracking-[0.08em]"
                    style={{
                      ...mono,
                      border: `1px solid ${tone(f.status)}`,
                      color: tone(f.status),
                    }}
                  >
                    {f.status === "Betaald" ? (
                      <Check size={11} strokeWidth={3} aria-hidden="true" />
                    ) : f.status === "Openstaand" ? (
                      <Clock size={11} strokeWidth={3} aria-hidden="true" />
                    ) : (
                      <FileText size={11} strokeWidth={3} aria-hidden="true" />
                    )}
                    {f.status}
                  </span>
                </td>
                <td
                  className="px-4 py-3 text-right text-[13px] font-semibold tabular-nums"
                  style={mono}
                >
                  {f.bedrag}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ── Kleedkamer (berichten) ──────────────────────────────────────────────────────────────────
function Kleedkamer() {
  const [gekozen, setGekozen] = useState(0);
  const gesprek = BERICHTEN[gekozen] ?? BERICHTEN[0]!;

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-[24px] font-semibold tracking-[-0.02em] sm:text-[30px]" style={kop}>
          Kleedkamer
        </h1>
        <p className="mt-1.5 text-[13px]" style={{ color: C.krijtZacht }}>
          Korte lijnen met je opdrachtgevers — zonder ruis.
        </p>
      </div>

      <div className="grid gap-4 lg:grid-cols-[300px_minmax(0,1fr)]">
        <Kaart titel="Gesprekken" className="!p-2">
          <ul>
            {BERICHTEN.map((b, i) => {
              const on = i === gekozen;
              return (
                <li key={b.van}>
                  <button
                    type="button"
                    onClick={() => setGekozen(i)}
                    aria-current={on ? "true" : undefined}
                    className="flex w-full items-start gap-3 rounded-sm px-3 py-3 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#ff6b35]"
                    style={{
                      background: on ? "rgba(242,245,239,0.08)" : "transparent",
                      border: `1px solid ${on ? C.lijn : "transparent"}`,
                    }}
                  >
                    <span
                      className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-[11px] font-semibold"
                      style={{ ...mono, border: `1px solid ${C.lijn}`, color: C.krijtZacht }}
                      aria-hidden="true"
                    >
                      {b.initialen}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="flex items-center justify-between gap-2">
                        <span className="truncate text-[13px] font-semibold">{b.van}</span>
                        <span
                          className="shrink-0 text-[10.5px]"
                          style={{ ...mono, color: C.krijtFaint }}
                        >
                          {b.tijd}
                        </span>
                      </span>
                      <span
                        className="mt-0.5 line-clamp-2 block text-[11.5px] leading-snug"
                        style={{ color: C.krijtFaint }}
                      >
                        {b.preview}
                      </span>
                      {b.ongelezen ? (
                        <span
                          className="mt-1.5 inline-flex items-center gap-1 text-[10px] uppercase tracking-[0.1em]"
                          style={{ ...mono, color: C.oranjeLicht }}
                        >
                          <span
                            className="h-1.5 w-1.5 rounded-full"
                            style={{ background: C.oranje }}
                            aria-hidden="true"
                          />
                          Ongelezen
                        </span>
                      ) : null}
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        </Kaart>

        <Kaart titel="Gesprek">
          <div className="flex items-center gap-3 border-b pb-3" style={{ borderColor: C.lijn }}>
            <span
              className="flex h-10 w-10 items-center justify-center rounded-full text-[12px] font-semibold"
              style={{ ...mono, background: C.krijt, color: C.veldDiep }}
              aria-hidden="true"
            >
              {gesprek.initialen}
            </span>
            <div>
              <div className="text-[15px] font-semibold" style={kop}>
                {gesprek.van}
              </div>
              <div className="text-[11px]" style={{ ...mono, color: C.krijtFaint }}>
                Laatste bericht {gesprek.tijd}
              </div>
            </div>
          </div>

          <ol className="mt-4 space-y-3">
            {THREAD.map((m, i) => (
              <li key={i} className={m.van === "wij" ? "flex justify-end" : "flex justify-start"}>
                <div
                  className="max-w-[85%] rounded-lg px-3.5 py-2.5"
                  style={{
                    background: m.van === "wij" ? C.krijt : "transparent",
                    color: m.van === "wij" ? C.veldDiep : C.krijt,
                    border: `1px solid ${m.van === "wij" ? C.krijt : C.lijn}`,
                  }}
                >
                  <p className="text-[13px] leading-relaxed">{m.tekst}</p>
                  <p
                    className="mt-1 text-[10.5px]"
                    style={{ ...mono, color: m.van === "wij" ? C.veld : C.krijtFaint }}
                  >
                    {m.tijd}
                  </p>
                </div>
              </li>
            ))}
          </ol>

          <form
            className="mt-4 flex items-center gap-2"
            onSubmit={(e) => e.preventDefault()}
            aria-label="Bericht sturen"
          >
            <label className="sr-only" htmlFor="ops-bericht">
              Bericht
            </label>
            <input
              id="ops-bericht"
              placeholder="Schrijf een bericht…"
              className="min-w-0 flex-1 rounded-sm px-3 py-2.5 text-[13px] outline-none placeholder:opacity-70"
              style={{ background: "transparent", border: `1px solid ${C.lijn}`, color: C.krijt }}
            />
            <button
              type="submit"
              className="inline-flex shrink-0 items-center gap-1.5 rounded-sm px-3.5 py-2.5 text-[12.5px] font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#f2f5ef]"
              style={{
                background: C.oranje,
                color: C.veldDiep,
              }}
            >
              <Send size={14} aria-hidden="true" /> Sturen
            </button>
          </form>
        </Kaart>
      </div>
    </div>
  );
}

// ── Competitie (bemiddelaar-overzicht) ──────────────────────────────────────────────────────
function Competitie({ onOpen }: { onOpen: () => void }) {
  const [alleenGaten, setAlleenGaten] = useState(false);
  const rijen = CLUBS.filter((c) => !alleenGaten || c.openstaand >= 2);

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-[24px] font-semibold tracking-[-0.02em] sm:text-[30px]" style={kop}>
            Competitiestand
          </h1>
          <p className="mt-1.5 max-w-lg text-[13px]" style={{ color: C.krijtZacht }}>
            Als bemiddelaar zie je per opdrachtgever hoe compleet de opstelling is en waar gaten
            vallen.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setAlleenGaten((v) => !v)}
          aria-pressed={alleenGaten}
          className="inline-flex items-center gap-2 rounded-sm px-3.5 py-2 text-[12px] font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#ff6b35]"
          style={{
            ...mono,
            border: `1px solid ${alleenGaten ? C.oranje : C.lijn}`,
            color: alleenGaten ? C.oranjeLicht : C.krijtZacht,
          }}
        >
          <Users size={13} aria-hidden="true" />
          {alleenGaten ? "Alleen gaten" : "Alle opdrachtgevers"}
        </button>
      </div>

      {rijen.length === 0 ? (
        <Kaart className="text-center">
          <h2 className="text-[17px] font-semibold" style={kop}>
            Geen gaten in de opstelling
          </h2>
          <p className="mx-auto mt-2 max-w-sm text-[13px]" style={{ color: C.krijtZacht }}>
            Elke opdrachtgever heeft de bezetting rond.
          </p>
        </Kaart>
      ) : (
        <div className="overflow-x-auto rounded-lg" style={{ border: `1px solid ${C.lijn}` }}>
          <table className="w-full min-w-[620px] border-collapse text-left">
            <caption className="sr-only">Bezetting per opdrachtgever</caption>
            <thead>
              <tr style={{ background: C.veldLicht }}>
                {["Opdrachtgever", "Regio", "Bezetting", "Vulgraad", "Open diensten"].map((h) => (
                  <th
                    key={h}
                    scope="col"
                    className="px-4 py-3 text-[10.5px] uppercase tracking-[0.14em]"
                    style={{ ...mono, color: C.krijtFaint, borderBottom: `1px solid ${C.lijn}` }}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rijen.map((c) => {
                const pct = Math.round((c.bezet / c.totaal) * 100);
                const kritiek = pct < 75;
                return (
                  <tr key={c.club} style={{ borderBottom: `1px solid ${C.lijnZacht}` }}>
                    <th scope="row" className="px-4 py-3 text-left text-[13px] font-semibold">
                      {c.club}
                    </th>
                    <td className="px-4 py-3 text-[12.5px]" style={{ color: C.krijtZacht }}>
                      {c.regio}
                    </td>
                    <td className="px-4 py-3 text-[12.5px] tabular-nums" style={mono}>
                      {c.bezet}/{c.totaal}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div
                          className="h-1.5 w-24 overflow-hidden rounded-full"
                          style={{ background: "rgba(242,245,239,0.14)" }}
                          aria-hidden="true"
                        >
                          <div
                            className="h-full rounded-full"
                            style={{ width: `${pct}%`, background: kritiek ? C.oranje : C.krijt }}
                          />
                        </div>
                        <span className="text-[12px] tabular-nums" style={mono}>
                          {pct}%
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className="inline-flex items-center gap-1.5 text-[12px] font-semibold"
                        style={{ ...mono, color: kritiek ? C.oranjeLicht : C.krijtZacht }}
                      >
                        {kritiek ? (
                          <AlertTriangle size={12} aria-hidden="true" />
                        ) : (
                          <Check size={12} strokeWidth={3} aria-hidden="true" />
                        )}
                        {c.openstaand}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      <button
        type="button"
        onClick={onOpen}
        className="inline-flex items-center gap-2 rounded-sm px-4 py-2.5 text-[13px] font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#ff6b35]"
        style={{
          border: `1px solid ${C.krijt}`,
          color: C.krijt,
        }}
      >
        Openstaande diensten vullen <ArrowRight size={15} aria-hidden="true" />
      </button>
    </div>
  );
}
