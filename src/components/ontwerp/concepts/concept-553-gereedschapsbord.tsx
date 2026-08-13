"use client";

// Concept 553 — "Gereedschapsbord" · het shadow board uit een werkplaats (5S / visueel management).
// Op een echt schaduwbord heeft ieder gereedschap een geschilderde omtrek; ontbreekt het stuk, dan
// zie je een lege silhouet die om invulling schreeuwt. Dat is precies de verificatiemetafoor:
// elk vereist bewijsstuk heeft zijn eigen omtrek — gezien en geverifieerd = het gereedschap hangt
// er vol en met textuur, ontbrekend of verlopen = een gestippelde lege omtrek. Opdrachten worden
// werkorders op klemborden, facturen worden urenbriefjes. Pegboard-raster in CSS, industrieel
// staalgrijs bord, signaalgeel voor markering, geel-zwarte veiligheidsstrepen alléén bij echte
// urgentie. Strak en functioneel, geen skeuomorfe kitsch.
// Bronnen (research): tulip.co "5S Tools and Visual Management"; trdsf.com "Shadow Board For Tools";
// peakvm.co.uk "How do Tool Shadow Boards support 5S"; flexpipeinc.com "How to Build a Shadow Board"
// — kern: omtrek per stuk, één vaste plek, ontbrekend stuk direct zichtbaar, groeperen per familie.
// Fonts: Space Grotesk + Spline Sans Mono. Deterministisch — geen random, geen datum.

import { useMemo, useState, type CSSProperties, type ReactNode } from "react";
import {
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  Check,
  ChevronDown,
  Clipboard,
  Clock,
  Filter,
  Hammer,
  MapPin,
  PlugZap,
  RefreshCw,
  Search,
  ShieldCheck,
  Users,
  Wrench,
  X,
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
  type ScreenKey,
} from "./mock";

// ── Palet — werkplaats: staalgrijs bord, signaalgeel, veiligheidskleuren ──────────────
const W = {
  bord: "#2b3138",
  bordDiep: "#20252a",
  paneel: "#343c45",
  paneelHoog: "#3d4650",
  lijn: "#4a545e",
  geel: "#f5c518",
  geelDiep: "#c79c0a",
  tekst: "#eef2f5",
  tekstZacht: "#aab6c0",
  staal: "#8493a0",
  ok: "#79d18c",
  waarschuwing: "#f5c518",
  fout: "#ff7a6b",
  donker: "#171a1e",
};

const grotesk = { fontFamily: "var(--font-lab-space)" };
const monospace = { fontFamily: "var(--font-lab-spline-mono)" };

const FOCUS =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#f5c518] focus-visible:ring-offset-2 focus-visible:ring-offset-[#2b3138]";

const PEGBOARD: CSSProperties = {
  backgroundColor: W.bord,
  backgroundImage: `radial-gradient(circle at center, ${W.bordDiep} 1.6px, transparent 1.7px)`,
  backgroundSize: "20px 20px",
};

const HAZARD = `repeating-linear-gradient(45deg, ${W.geel} 0 10px, ${W.donker} 10px 20px)`;

// ── Schermen ──────────────────────────────────────────────────────────────────────────
type Scherm = ScreenKey | "bemiddelaar";

const SCHERMEN: { key: Scherm; label: string; code: string }[] = [
  { key: "dashboard", label: "Bord", code: "B-00" },
  { key: "marktplaats", label: "Werkorders", code: "W-01" },
  { key: "opdracht", label: "Werkorder", code: "W-02" },
  { key: "verificatie", label: "Schaduwbord", code: "S-03" },
  { key: "acties", label: "Taken", code: "T-04" },
  { key: "facturen", label: "Urenbriefjes", code: "U-05" },
  { key: "documenten", label: "Kist", code: "K-06" },
  { key: "berichten", label: "Werkbriefjes", code: "M-07" },
  { key: "bemiddelaar", label: "Bemiddelaar", code: "R-08" },
];

// Lokale, puur presentationele demo-content voor het bemiddelaarsoverzicht.
const TEAMBORDEN: {
  team: string;
  regio: string;
  leden: number;
  compleet: number;
  ontbrekend: string;
  stilstand: boolean;
}[] = [
  {
    team: "Wijkzorg Noord",
    regio: "Utrecht",
    leden: 14,
    compleet: 92,
    ontbrekend: "1 VOG verloopt",
    stilstand: false,
  },
  {
    team: "Somatiek Flevoland",
    regio: "Almere",
    leden: 9,
    compleet: 67,
    ontbrekend: "3 diploma's ontbreken",
    stilstand: true,
  },
  {
    team: "Ambulant GGZ",
    regio: "Zeist",
    leden: 6,
    compleet: 100,
    ontbrekend: "geen",
    stilstand: false,
  },
  {
    team: "Nachtdienst Midden",
    regio: "Amersfoort",
    leden: 11,
    compleet: 81,
    ontbrekend: "2 reanimatiepassen",
    stilstand: false,
  },
];

// ── Statustaal — label + icoon, nooit kleur alleen ────────────────────────────────────
function statusMeta(s: CredStatus): {
  label: string;
  Icon: LucideIcon;
  kleur: string;
  hangt: boolean;
  toelichting: string;
} {
  switch (s) {
    case "VERIFIED":
      return {
        label: "Op zijn plek",
        Icon: Check,
        kleur: W.ok,
        hangt: true,
        toelichting: "Geverifieerd — het stuk hangt aan het bord",
      };
    case "SUBMITTED":
      return {
        label: "Onderweg",
        Icon: Clock,
        kleur: W.staal,
        hangt: false,
        toelichting: "In beoordeling — omtrek nog leeg",
      };
    case "EXPIRING":
      return {
        label: "Sleets",
        Icon: AlertTriangle,
        kleur: W.waarschuwing,
        hangt: true,
        toelichting: "Verloopt binnenkort — vervanging bestellen",
      };
    case "REJECTED":
      return {
        label: "Afgekeurd",
        Icon: X,
        kleur: W.fout,
        hangt: false,
        toelichting: "Afgewezen met reden — omtrek blijft leeg",
      };
  }
}

// ── Gereedschap-silhouetten — eigen SVG, geen externe assets ──────────────────────────
type Vorm = "sleutel" | "schroevendraaier" | "tang" | "waterpas";

const VORMEN: Vorm[] = ["sleutel", "schroevendraaier", "tang", "waterpas"];

function VormPaden({ vorm }: { vorm: Vorm }) {
  switch (vorm) {
    case "sleutel":
      return (
        <>
          <path d="M24 6c-9 0-16 6.5-16 14.5 0 5.5 3.3 10.2 8.2 12.6V104c0 5.5 3.5 8 7.8 8s7.8-2.5 7.8-8V33.1C36.7 30.7 40 26 40 20.5 40 12.5 33 6 24 6zm0 8.5 6.5 6-6.5 6-6.5-6 6.5-6z" />
        </>
      );
    case "schroevendraaier":
      return (
        <>
          <rect x="15" y="8" width="18" height="40" rx="8" />
          <rect x="20" y="48" width="8" height="8" />
          <rect x="21.5" y="56" width="5" height="42" />
          <path d="M20.5 98h7l-1.5 14h-4z" />
        </>
      );
    case "tang":
      return (
        <>
          <path d="M18 8c-3 0-5 2.5-5 6l3 34 6 12v26c0 8-3 10-3 18 0 5 3 8 5 8s5-3 5-8c0-8-3-10-3-18V60l6-12 3-34c0-3.5-2-6-5-6-3 0-5 2.5-5 6l-1 30-1-30c0-3.5-2-6-5-6z" />
        </>
      );
    case "waterpas":
      return (
        <>
          <rect x="6" y="44" width="36" height="32" rx="4" />
          <circle cx="24" cy="60" r="8" />
        </>
      );
  }
}

function Gereedschap({
  vorm,
  aanwezig,
  kleur,
  hoogte = 118,
}: {
  vorm: Vorm;
  aanwezig: boolean;
  kleur: string;
  hoogte?: number;
}) {
  return (
    <svg
      viewBox="0 0 48 120"
      height={hoogte}
      width={(hoogte / 120) * 48}
      aria-hidden="true"
      focusable="false"
      className="shrink-0"
    >
      {aanwezig ? (
        <>
          <g fill={kleur}>
            <VormPaden vorm={vorm} />
          </g>
          {/* Textuur: fijne arcering die alleen op een gevuld stuk zichtbaar is */}
          <g fill={W.donker} opacity={0.22}>
            <VormPaden vorm={vorm} />
          </g>
          <g fill="none" stroke={W.donker} strokeWidth={1.4}>
            <VormPaden vorm={vorm} />
          </g>
        </>
      ) : (
        <g
          fill="none"
          stroke={kleur}
          strokeWidth={2}
          strokeDasharray="6 5"
          strokeLinejoin="round"
          opacity={0.85}
        >
          <VormPaden vorm={vorm} />
        </g>
      )}
    </svg>
  );
}

// ── Bordlabel — gegraveerd plaatje ────────────────────────────────────────────────────
function Bordlabel({ children, geel = false }: { children: ReactNode; geel?: boolean }) {
  return (
    <span
      className="inline-block px-2 py-0.5 text-[10px] uppercase"
      style={{
        ...monospace,
        letterSpacing: "0.16em",
        background: geel ? W.geel : W.paneelHoog,
        color: geel ? W.donker : W.tekstZacht,
      }}
    >
      {children}
    </span>
  );
}

// ── Hazardband — alleen bij echte urgentie ────────────────────────────────────────────
function Hazardband({ tekst }: { tekst: string }) {
  return (
    <div className="overflow-hidden" role="alert">
      <div className="h-2.5 w-full" style={{ background: HAZARD }} aria-hidden="true" />
      <div
        className="flex flex-wrap items-center gap-2 px-4 py-3"
        style={{ background: W.paneel, borderLeft: `4px solid ${W.geel}` }}
      >
        <AlertTriangle size={16} strokeWidth={2.4} style={{ color: W.geel }} aria-hidden="true" />
        <p className="text-[13px] leading-snug" style={{ ...grotesk, color: W.tekst }}>
          {tekst}
        </p>
      </div>
      <div className="h-2.5 w-full" style={{ background: HAZARD }} aria-hidden="true" />
    </div>
  );
}

// ── Paneel — een gereedschapsvak op het bord ──────────────────────────────────────────
function Vak({
  titel,
  code,
  children,
  actie,
}: {
  titel: string;
  code: string;
  children: ReactNode;
  actie?: ReactNode;
}) {
  return (
    <section
      className="relative"
      style={{ background: W.paneel, border: `1px solid ${W.lijn}` }}
      aria-label={titel}
    >
      <header
        className="flex flex-wrap items-center justify-between gap-3 px-4 py-3"
        style={{ borderBottom: `1px solid ${W.lijn}` }}
      >
        <div className="flex items-center gap-2.5">
          <Bordlabel>{code}</Bordlabel>
          <h2 className="text-[14px] font-semibold" style={{ ...grotesk, color: W.tekst }}>
            {titel}
          </h2>
        </div>
        {actie}
      </header>
      <div className="px-4 py-4">{children}</div>
    </section>
  );
}

// ── Staten ────────────────────────────────────────────────────────────────────────────
type Toestand = "bord" | "laden" | "fout";

function Skelet() {
  return (
    <div className="space-y-4" aria-busy="true" aria-live="polite">
      <p
        className="flex items-center gap-2 text-[11px] uppercase"
        style={{ ...monospace, color: W.staal, letterSpacing: "0.16em" }}
      >
        <RefreshCw size={13} className="gb-draai" aria-hidden="true" /> Bord wordt ingericht
      </p>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {VORMEN.map((v, i) => (
          <div
            key={v}
            className="flex flex-col items-center gap-3 px-4 py-6"
            style={{ background: W.paneel, border: `1px dashed ${W.lijn}` }}
          >
            <span className="gb-puls">
              <Gereedschap vorm={v} aanwezig={false} kleur={W.lijn} hoogte={92} />
            </span>
            <span
              className="gb-puls block h-3 w-full"
              style={{ background: W.paneelHoog, maxWidth: 120 - i * 10 }}
            />
            <span className="gb-puls block h-2.5 w-16" style={{ background: W.paneelHoog }} />
          </div>
        ))}
      </div>
    </div>
  );
}

function FoutPaneel({ onHerstel }: { onHerstel: () => void }) {
  return (
    <section
      className="px-5 py-10 text-center"
      style={{ background: W.paneel, border: `1px solid ${W.fout}` }}
      role="alert"
    >
      <PlugZap size={28} strokeWidth={2} style={{ color: W.fout }} className="mx-auto" />
      <h2 className="mt-4 text-[22px] font-semibold" style={{ ...grotesk, color: W.tekst }}>
        Bord staat spanningloos
      </h2>
      <p
        className="mx-auto mt-2 max-w-md text-[13.5px] leading-relaxed"
        style={{ ...grotesk, color: W.tekstZacht }}
      >
        De werkplaats kan de gegevens nu niet lezen. Er wordt niets getoond dat we niet kunnen
        controleren — een half bord is gevaarlijker dan een leeg bord.
      </p>
      <button
        type="button"
        onClick={onHerstel}
        className={`mt-6 inline-flex items-center gap-2 px-5 py-2.5 text-[11px] font-semibold uppercase ${FOCUS}`}
        style={{ ...monospace, background: W.geel, color: W.donker, letterSpacing: "0.14em" }}
      >
        <RefreshCw size={14} aria-hidden="true" /> Opnieuw inschakelen
      </button>
    </section>
  );
}

function LeegPaneel({
  titel,
  tekst,
  knop,
  onKnop,
}: {
  titel: string;
  tekst: string;
  knop: string;
  onKnop: () => void;
}) {
  return (
    <section
      className="flex flex-col items-center px-5 py-10 text-center"
      style={{ background: W.paneel, border: `2px dashed ${W.lijn}` }}
    >
      <Gereedschap vorm="sleutel" aanwezig={false} kleur={W.staal} hoogte={86} />
      <h2 className="mt-4 text-[20px] font-semibold" style={{ ...grotesk, color: W.tekst }}>
        {titel}
      </h2>
      <p
        className="mx-auto mt-2 max-w-sm text-[13.5px] leading-relaxed"
        style={{ ...grotesk, color: W.tekstZacht }}
      >
        {tekst}
      </p>
      <button
        type="button"
        onClick={onKnop}
        className={`mt-5 px-5 py-2.5 text-[11px] font-semibold uppercase ${FOCUS}`}
        style={{
          ...monospace,
          border: `1px solid ${W.geel}`,
          color: W.geel,
          letterSpacing: "0.14em",
        }}
      >
        {knop}
      </button>
    </section>
  );
}

// ── Root ──────────────────────────────────────────────────────────────────────────────
export function Concept553() {
  const [scherm, setScherm] = useState<Scherm>("dashboard");
  const [toestand, setToestand] = useState<Toestand>("bord");
  const werkorder = OPDRACHTEN[0]!;
  const huidig = SCHERMEN.find((s) => s.key === scherm) ?? SCHERMEN[0]!;

  return (
    <div
      className="min-h-screen w-full overflow-x-hidden antialiased"
      style={{ ...grotesk, ...PEGBOARD, color: W.tekst }}
    >
      <style>{`
        @keyframes gbDraai { to { transform: rotate(360deg); } }
        .gb-draai { animation: gbDraai 1.1s linear infinite; }
        @keyframes gbPuls { 0%,100% { opacity: 1; } 50% { opacity: 0.4; } }
        .gb-puls { animation: gbPuls 1.3s ease-in-out infinite; }
        @keyframes gbIn { from { opacity: 0; transform: translateY(6px); } to { opacity: 1; transform: none; } }
        .gb-in { animation: gbIn 260ms ease-out both; }
        @media (prefers-reduced-motion: reduce) { .gb-draai, .gb-puls, .gb-in { animation: none !important; } }
      `}</style>

      {/* Kopbalk = de bovenrail van het bord */}
      <header style={{ background: W.bordDiep, borderBottom: `3px solid ${W.geel}` }}>
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-4 py-4 sm:px-6">
          <div className="flex items-center gap-3">
            <span
              className="flex h-10 w-10 shrink-0 items-center justify-center"
              style={{ background: W.geel }}
              aria-hidden="true"
            >
              <Wrench size={20} strokeWidth={2.4} style={{ color: W.donker }} />
            </span>
            <div className="leading-tight">
              <p className="text-[17px] font-semibold" style={{ ...grotesk, color: W.tekst }}>
                Gereedschapsbord
              </p>
              <p
                className="mt-0.5 text-[10.5px] uppercase"
                style={{ ...monospace, color: W.staal, letterSpacing: "0.16em" }}
              >
                Werkplaats · {PROFIEL.naam} · {PROFIEL.plaats}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2.5">
            <Bordlabel geel>{PROFIEL.trust}</Bordlabel>
            <span
              className="flex h-10 w-10 items-center justify-center text-[12px] font-semibold"
              style={{ ...monospace, background: W.paneelHoog, color: W.tekst }}
              aria-hidden="true"
            >
              {PROFIEL.initialen}
            </span>
          </div>
        </div>
      </header>

      {/* Navigatie = de haakrail */}
      <nav aria-label="Vakken op het bord" style={{ background: W.bordDiep }}>
        <div
          role="tablist"
          aria-label="Vakken op het bord"
          className="mx-auto flex max-w-6xl gap-1 overflow-x-auto px-4 pb-3 sm:px-6"
        >
          {SCHERMEN.map((s) => {
            const aan = s.key === scherm;
            return (
              <button
                key={s.key}
                type="button"
                role="tab"
                id={`gb-tab-${s.key}`}
                aria-selected={aan}
                aria-controls="gb-panel"
                onClick={() => setScherm(s.key)}
                className={`shrink-0 px-3 py-2 text-[12px] font-medium transition-colors ${FOCUS}`}
                style={{
                  ...grotesk,
                  background: aan ? W.geel : W.paneel,
                  color: aan ? W.donker : W.tekstZacht,
                  borderTop: `2px solid ${aan ? W.geelDiep : "transparent"}`,
                }}
              >
                <span className="mr-1.5 text-[10px]" style={{ ...monospace, opacity: 0.75 }}>
                  {s.code}
                </span>
                {s.label}
              </button>
            );
          })}
        </div>
      </nav>

      {/* Toestandschakelaar */}
      <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-2 px-4 pt-5 sm:px-6">
        <span
          className="text-[10px] uppercase"
          style={{ ...monospace, color: W.staal, letterSpacing: "0.16em" }}
        >
          Bordstatus
        </span>
        <div className="flex gap-1" role="group" aria-label="Bordstatus">
          {(["bord", "laden", "fout"] as Toestand[]).map((t) => {
            const aan = toestand === t;
            return (
              <button
                key={t}
                type="button"
                aria-pressed={aan}
                onClick={() => setToestand(t)}
                className={`px-3 py-1.5 text-[10px] font-semibold uppercase transition-colors ${FOCUS}`}
                style={{
                  ...monospace,
                  letterSpacing: "0.12em",
                  background: aan ? W.geel : "transparent",
                  color: aan ? W.donker : W.tekstZacht,
                  border: `1px solid ${aan ? W.geel : W.lijn}`,
                }}
              >
                {t === "bord" ? "In bedrijf" : t === "laden" ? "Inrichten" : "Storing"}
              </button>
            );
          })}
        </div>
      </div>

      <main
        id="gb-panel"
        role="tabpanel"
        aria-labelledby={`gb-tab-${huidig.key}`}
        className="mx-auto max-w-6xl px-4 pb-16 pt-5 sm:px-6"
      >
        <div key={scherm} className="gb-in">
          {toestand === "laden" ? (
            <Skelet />
          ) : toestand === "fout" ? (
            <FoutPaneel onHerstel={() => setToestand("bord")} />
          ) : scherm === "dashboard" ? (
            <Bord
              onWerkorder={() => setScherm("opdracht")}
              onSchaduwbord={() => setScherm("verificatie")}
            />
          ) : scherm === "marktplaats" ? (
            <Werkorders onOpen={() => setScherm("opdracht")} />
          ) : scherm === "opdracht" ? (
            <WerkorderDetail order={werkorder} onTerug={() => setScherm("marktplaats")} />
          ) : scherm === "verificatie" ? (
            <Schaduwbord />
          ) : scherm === "acties" ? (
            <Taken onSchaduwbord={() => setScherm("verificatie")} />
          ) : scherm === "facturen" ? (
            <Urenbriefjes />
          ) : scherm === "documenten" ? (
            <Kist />
          ) : scherm === "berichten" ? (
            <Werkbriefjes />
          ) : (
            <Bemiddelaar />
          )}
        </div>
      </main>

      <footer style={{ background: W.bordDiep, borderTop: `1px solid ${W.lijn}` }}>
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-2 px-4 py-5 sm:px-6">
          <p
            className="text-[10.5px] uppercase"
            style={{ ...monospace, color: W.staal, letterSpacing: "0.16em" }}
          >
            Vak {huidig.code} · alles op zijn plek
          </p>
          <p className="text-[12px]" style={{ ...grotesk, color: W.tekstZacht }}>
            Een lege omtrek is geen fout — het is een opdracht.
          </p>
        </div>
      </footer>
    </div>
  );
}

// ── B-00 Bord ─────────────────────────────────────────────────────────────────────────
function Bord({
  onWerkorder,
  onSchaduwbord,
}: {
  onWerkorder: () => void;
  onSchaduwbord: () => void;
}) {
  const top = OPDRACHTEN[0]!;
  const ontbreekt = CREDENTIALS.filter((c) => !statusMeta(c.status).hangt);
  const sleets = CREDENTIALS.filter((c) => c.status === "EXPIRING");

  return (
    <div className="space-y-5">
      {sleets.length > 0 && (
        <Hazardband
          tekst={`${sleets[0]!.naam} verliest binnenkort zijn geldigheid. Zolang dat stuk sleets is, blijft één omtrek op het bord onbetrouwbaar.`}
        />
      )}

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1.35fr)_minmax(0,1fr)]">
        <Vak
          titel="Beste werkorder"
          code="B-01"
          actie={<Bordlabel geel>{top.match}% passend</Bordlabel>}
        >
          <div className="flex flex-wrap items-start gap-5">
            <span
              className="flex items-center justify-center px-4 py-3"
              style={{ background: W.bordDiep, border: `1px dashed ${W.geel}` }}
            >
              <Gereedschap vorm="sleutel" aanwezig kleur={W.geel} hoogte={104} />
            </span>
            <div className="min-w-0 flex-1">
              <h3 className="text-[20px] font-semibold leading-tight" style={{ color: W.tekst }}>
                {top.titel}
              </h3>
              <p
                className="mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-[12px]"
                style={{ ...monospace, color: W.tekstZacht }}
              >
                <span>{top.opdrachtgever}</span>
                <span aria-hidden="true">·</span>
                <span className="inline-flex items-center gap-1">
                  <MapPin size={12} strokeWidth={2.2} aria-hidden="true" /> {top.plaats}
                </span>
                <span aria-hidden="true">·</span>
                <span>{top.tarief}</span>
              </p>
              <dl className="mt-4 grid grid-cols-2 gap-3">
                {[
                  { l: "Omvang", v: top.uren },
                  { l: "Start", v: top.start },
                ].map((f) => (
                  <div key={f.l} className="px-3 py-2" style={{ background: W.bordDiep }}>
                    <dt
                      className="text-[9.5px] uppercase"
                      style={{ ...monospace, color: W.staal, letterSpacing: "0.14em" }}
                    >
                      {f.l}
                    </dt>
                    <dd className="mt-0.5 text-[14px] font-medium" style={{ color: W.tekst }}>
                      {f.v}
                    </dd>
                  </div>
                ))}
              </dl>
              <button
                type="button"
                onClick={onWerkorder}
                className={`mt-4 inline-flex items-center gap-2 px-4 py-2.5 text-[11px] font-semibold uppercase ${FOCUS}`}
                style={{
                  ...monospace,
                  background: W.geel,
                  color: W.donker,
                  letterSpacing: "0.14em",
                }}
              >
                Werkorder openen <ArrowRight size={14} aria-hidden="true" />
              </button>
            </div>
          </div>
        </Vak>

        <Vak
          titel="Bordcontrole"
          code="B-02"
          actie={
            <Bordlabel>
              {CREDENTIALS.length - ontbreekt.length}/{CREDENTIALS.length} op hun plek
            </Bordlabel>
          }
        >
          <ul className="space-y-2.5">
            {CREDENTIALS.map((c, i) => {
              const m = statusMeta(c.status);
              return (
                <li
                  key={c.naam}
                  className="flex items-center gap-3 px-3 py-2.5"
                  style={{
                    background: W.bordDiep,
                    borderLeft: `3px solid ${m.kleur}`,
                  }}
                >
                  <Gereedschap
                    vorm={VORMEN[i % VORMEN.length]!}
                    aanwezig={m.hangt}
                    kleur={m.kleur}
                    hoogte={34}
                  />
                  <span className="min-w-0 flex-1">
                    <span
                      className="block truncate text-[13px] font-medium"
                      style={{ color: W.tekst }}
                    >
                      {c.naam}
                    </span>
                    <span
                      className="mt-0.5 flex items-center gap-1.5 text-[10.5px] uppercase"
                      style={{ ...monospace, color: m.kleur, letterSpacing: "0.1em" }}
                    >
                      <m.Icon size={11} strokeWidth={2.6} aria-hidden="true" />
                      {m.label}
                    </span>
                  </span>
                </li>
              );
            })}
          </ul>
          <button
            type="button"
            onClick={onSchaduwbord}
            className={`mt-4 inline-flex w-full items-center justify-center gap-2 px-4 py-2.5 text-[11px] font-semibold uppercase ${FOCUS}`}
            style={{
              ...monospace,
              border: `1px solid ${W.geel}`,
              color: W.geel,
              letterSpacing: "0.14em",
            }}
          >
            Naar het schaduwbord <ArrowRight size={14} aria-hidden="true" />
          </button>
        </Vak>
      </div>

      <Vak titel="Meters" code="B-03">
        <dl className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          {KPIS.map((k) => (
            <div key={k.label} className="px-3 py-3" style={{ background: W.bordDiep }}>
              <dt
                className="text-[9.5px] uppercase"
                style={{ ...monospace, color: W.staal, letterSpacing: "0.14em" }}
              >
                {k.label}
              </dt>
              <dd
                className="mt-1 break-words text-[22px] font-semibold leading-none"
                style={{ ...grotesk, color: W.tekst }}
              >
                {k.value}
              </dd>
              <dd
                className="mt-1.5 text-[10.5px] uppercase"
                style={{
                  ...monospace,
                  color: k.up ? W.ok : W.waarschuwing,
                  letterSpacing: "0.1em",
                }}
              >
                {k.up ? "oplopend" : "let op"} {k.trend}
              </dd>
              {/* Meterschaal: deterministisch uit de mock-reeks */}
              <dd className="mt-2 flex h-7 items-end gap-[3px]" aria-hidden="true">
                {k.spark.map((v, j) => {
                  const max = Math.max(...k.spark);
                  return (
                    <span
                      key={j}
                      className="flex-1"
                      style={{
                        height: `${Math.round((v / max) * 100)}%`,
                        background: j === k.spark.length - 1 ? W.geel : W.lijn,
                      }}
                    />
                  );
                })}
              </dd>
            </div>
          ))}
        </dl>
      </Vak>
    </div>
  );
}

// ── W-01 Werkorders — klemborden met filter ───────────────────────────────────────────
function Werkorders({ onOpen }: { onOpen: () => void }) {
  const [zoek, setZoek] = useState("");
  const [alleenTop, setAlleenTop] = useState(false);

  const lijst = useMemo(() => {
    const t = zoek.trim().toLowerCase();
    return OPDRACHTEN.filter((o) => {
      const past =
        !t ||
        o.titel.toLowerCase().includes(t) ||
        o.opdrachtgever.toLowerCase().includes(t) ||
        o.plaats.toLowerCase().includes(t);
      return past && (!alleenTop || o.match >= 90);
    });
  }, [zoek, alleenTop]);

  return (
    <div className="space-y-5">
      <Vak
        titel="Openstaande werkorders"
        code="W-01"
        actie={<Bordlabel>{lijst.length} op de rail</Bordlabel>}
      >
        <div className="flex flex-wrap items-stretch gap-3">
          <label
            className="flex min-w-0 flex-1 items-center gap-2.5 px-3 py-2.5"
            style={{ background: W.bordDiep, border: `1px solid ${W.lijn}` }}
          >
            <Search size={15} strokeWidth={2.2} style={{ color: W.staal }} aria-hidden="true" />
            <span className="sr-only">Zoek in werkorders</span>
            <input
              value={zoek}
              onChange={(e) => setZoek(e.target.value)}
              placeholder="Zoek op werk, opdrachtgever of plaats"
              className="w-full min-w-0 bg-transparent text-[13px] outline-none placeholder:opacity-60"
              style={{ ...grotesk, color: W.tekst }}
            />
            {zoek && (
              <button
                type="button"
                onClick={() => setZoek("")}
                aria-label="Zoekterm wissen"
                className={`shrink-0 p-1 ${FOCUS}`}
              >
                <X size={14} strokeWidth={2.6} style={{ color: W.staal }} aria-hidden="true" />
              </button>
            )}
          </label>
          <button
            type="button"
            onClick={() => setAlleenTop((v) => !v)}
            aria-pressed={alleenTop}
            className={`inline-flex items-center gap-2 px-4 py-2.5 text-[11px] font-semibold uppercase ${FOCUS}`}
            style={{
              ...monospace,
              letterSpacing: "0.12em",
              background: alleenTop ? W.geel : "transparent",
              color: alleenTop ? W.donker : W.tekstZacht,
              border: `1px solid ${alleenTop ? W.geel : W.lijn}`,
            }}
          >
            <Filter size={13} strokeWidth={2.4} aria-hidden="true" />
            Alleen 90%+
          </button>
        </div>

        {lijst.length === 0 ? (
          <div className="mt-5">
            <LeegPaneel
              titel="Lege rail"
              tekst="Geen enkele werkorder voldoet aan dit filter. Zet het filter uit of wis de zoekterm om de rail weer te vullen."
              knop="Filters wissen"
              onKnop={() => {
                setZoek("");
                setAlleenTop(false);
              }}
            />
          </div>
        ) : (
          <ul className="mt-5 space-y-4">
            {lijst.map((o) => (
              <li key={o.id}>
                <article
                  className="relative"
                  style={{ background: W.bordDiep, border: `1px solid ${W.lijn}` }}
                >
                  {/* Klem van het klembord */}
                  <div
                    className="mx-auto -mt-2 h-3 w-24"
                    style={{ background: W.staal }}
                    aria-hidden="true"
                  />
                  <div className="grid gap-4 px-4 py-4 sm:grid-cols-[minmax(0,1fr)_auto]">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <Bordlabel>{o.id}</Bordlabel>
                        <Clipboard
                          size={13}
                          strokeWidth={2.2}
                          style={{ color: W.staal }}
                          aria-hidden="true"
                        />
                        <span
                          className="text-[10.5px] uppercase"
                          style={{ ...monospace, color: W.staal, letterSpacing: "0.12em" }}
                        >
                          Werkorder
                        </span>
                      </div>
                      <h3
                        className="mt-2 text-[18px] font-semibold leading-tight"
                        style={{ color: W.tekst }}
                      >
                        {o.titel}
                      </h3>
                      <p className="mt-1 text-[12px]" style={{ ...monospace, color: W.tekstZacht }}>
                        {o.opdrachtgever} · {o.plaats} · {o.uren} · {o.start}
                      </p>
                      <ul className="mt-3 flex flex-wrap gap-1.5">
                        {o.tags.map((t) => (
                          <li key={t}>
                            <Bordlabel>{t}</Bordlabel>
                          </li>
                        ))}
                      </ul>
                    </div>
                    <div className="flex flex-row items-center gap-4 sm:flex-col sm:items-end">
                      <p className="text-right">
                        <span
                          className="block text-[30px] font-semibold leading-none"
                          style={{ ...grotesk, color: o.match >= 90 ? W.geel : W.tekst }}
                        >
                          {o.match}%
                        </span>
                        <span
                          className="mt-1 block text-[9.5px] uppercase"
                          style={{ ...monospace, color: W.staal, letterSpacing: "0.14em" }}
                        >
                          passend
                        </span>
                      </p>
                      <p className="text-[15px] font-semibold" style={{ color: W.tekst }}>
                        {o.tarief}
                      </p>
                      <button
                        type="button"
                        onClick={onOpen}
                        className={`inline-flex items-center gap-2 px-4 py-2 text-[10.5px] font-semibold uppercase ${FOCUS}`}
                        style={{
                          ...monospace,
                          border: `1px solid ${W.geel}`,
                          color: W.geel,
                          letterSpacing: "0.12em",
                        }}
                      >
                        Openen <ArrowRight size={13} aria-hidden="true" />
                      </button>
                    </div>
                  </div>
                </article>
              </li>
            ))}
          </ul>
        )}
      </Vak>
    </div>
  );
}

// ── W-02 Werkorder-detail ─────────────────────────────────────────────────────────────
function WerkorderDetail({ order, onTerug }: { order: Opdracht; onTerug: () => void }) {
  const [aangenomen, setAangenomen] = useState(false);

  return (
    <div className="space-y-5">
      <button
        type="button"
        onClick={onTerug}
        className={`inline-flex items-center gap-2 text-[10.5px] font-semibold uppercase ${FOCUS}`}
        style={{ ...monospace, color: W.tekstZacht, letterSpacing: "0.14em" }}
      >
        <ArrowLeft size={13} strokeWidth={2.6} aria-hidden="true" /> Terug naar de rail
      </button>

      <Vak
        titel={order.titel}
        code={order.id}
        actie={<Bordlabel geel>{order.match}% passend</Bordlabel>}
      >
        <dl className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          {[
            { l: "Opdrachtgever", v: order.opdrachtgever },
            { l: "Tarief", v: order.tarief },
            { l: "Omvang", v: order.uren },
            { l: "Start", v: order.start },
          ].map((f) => (
            <div key={f.l} className="px-3 py-3" style={{ background: W.bordDiep }}>
              <dt
                className="text-[9.5px] uppercase"
                style={{ ...monospace, color: W.staal, letterSpacing: "0.14em" }}
              >
                {f.l}
              </dt>
              <dd className="mt-1 break-words text-[14px] font-medium" style={{ color: W.tekst }}>
                {f.v}
              </dd>
            </div>
          ))}
        </dl>

        <div className="mt-5 grid gap-4 lg:grid-cols-2">
          <section
            className="px-4 py-4"
            style={{ background: W.bordDiep, borderLeft: `3px solid ${W.ok}` }}
            aria-labelledby="gb-plus"
          >
            <h3
              id="gb-plus"
              className="flex items-center gap-2 text-[11px] uppercase"
              style={{ ...monospace, color: W.ok, letterSpacing: "0.16em" }}
            >
              <Check size={13} strokeWidth={3} aria-hidden="true" /> Gereedschap aanwezig
            </h3>
            <ul className="mt-3 space-y-2.5">
              {order.redenen.plus.map((r) => (
                <li key={r} className="flex items-start gap-2.5">
                  <span
                    className="mt-1 h-2 w-2 shrink-0"
                    style={{ background: W.ok }}
                    aria-hidden="true"
                  />
                  <span className="text-[13.5px] leading-snug" style={{ color: W.tekst }}>
                    {r}
                  </span>
                </li>
              ))}
            </ul>
          </section>
          <section
            className="px-4 py-4"
            style={{ background: W.bordDiep, borderLeft: `3px solid ${W.waarschuwing}` }}
            aria-labelledby="gb-min"
          >
            <h3
              id="gb-min"
              className="flex items-center gap-2 text-[11px] uppercase"
              style={{ ...monospace, color: W.waarschuwing, letterSpacing: "0.16em" }}
            >
              <AlertTriangle size={13} strokeWidth={2.6} aria-hidden="true" /> Omtrek nog leeg
            </h3>
            <ul className="mt-3 space-y-2.5">
              {order.redenen.min.map((r) => (
                <li key={r} className="flex items-start gap-2.5">
                  <span
                    className="mt-1 h-2 w-2 shrink-0"
                    style={{ border: `1px dashed ${W.waarschuwing}` }}
                    aria-hidden="true"
                  />
                  <span className="text-[13.5px] leading-snug" style={{ color: W.tekst }}>
                    {r}
                  </span>
                </li>
              ))}
            </ul>
          </section>
        </div>

        <div className="mt-5 flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={() => setAangenomen(true)}
            disabled={aangenomen}
            className={`inline-flex items-center gap-2 px-5 py-3 text-[11px] font-semibold uppercase disabled:cursor-not-allowed disabled:opacity-55 ${FOCUS}`}
            style={{
              ...monospace,
              background: aangenomen ? W.paneelHoog : W.geel,
              color: aangenomen ? W.tekstZacht : W.donker,
              letterSpacing: "0.14em",
            }}
          >
            {aangenomen ? "Werkorder aangenomen" : "Werkorder aannemen"}
            {aangenomen ? (
              <Check size={14} strokeWidth={3} aria-hidden="true" />
            ) : (
              <Hammer size={14} strokeWidth={2.4} aria-hidden="true" />
            )}
          </button>
          {aangenomen && (
            <p className="text-[12.5px]" style={{ color: W.tekstZacht }} role="status">
              De order staat op jouw naam bij {order.opdrachtgever}. Twee keer aannemen kan niet.
            </p>
          )}
        </div>
      </Vak>
    </div>
  );
}

// ── S-03 Schaduwbord — de kern van het concept ────────────────────────────────────────
function Schaduwbord() {
  const [gekozen, setGekozen] = useState<string | null>(CREDENTIALS[2]?.naam ?? null);
  const hangend = CREDENTIALS.filter((c) => statusMeta(c.status).hangt).length;
  const detail = CREDENTIALS.find((c) => c.naam === gekozen) ?? null;

  return (
    <div className="space-y-5">
      {CREDENTIALS.some((c) => c.status === "EXPIRING") && (
        <Hazardband tekst="Eén omtrek is bezet door een sleets stuk. Vervang het vóór de vervaldatum, anders valt de omtrek leeg." />
      )}

      <Vak
        titel="Schaduwbord bewijsstukken"
        code="S-03"
        actie={
          <Bordlabel geel>
            {hangend}/{CREDENTIALS.length} omtrekken gevuld
          </Bordlabel>
        }
      >
        <p className="mb-5 max-w-2xl text-[13px] leading-relaxed" style={{ color: W.tekstZacht }}>
          Elk vereist bewijsstuk heeft een vaste plek met een geschilderde omtrek. Hangt het stuk
          er, dan is het geverifieerd. Is de omtrek leeg, dan weet je meteen wat er ontbreekt — en
          wat je moet doen.
        </p>

        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {CREDENTIALS.map((c, i) => {
            const m = statusMeta(c.status);
            const aan = gekozen === c.naam;
            return (
              <li key={c.naam}>
                <button
                  type="button"
                  onClick={() => setGekozen(aan ? null : c.naam)}
                  aria-pressed={aan}
                  className={`flex w-full flex-col items-center gap-3 px-3 py-5 text-center transition-colors ${FOCUS}`}
                  style={{
                    background: W.bordDiep,
                    border: m.hangt ? `1px solid ${m.kleur}` : `2px dashed ${m.kleur}`,
                    outline: aan ? `2px solid ${W.geel}` : "none",
                    outlineOffset: 2,
                  }}
                >
                  <span
                    className="flex h-[132px] items-center justify-center"
                    style={{
                      // De geschilderde omtrek op het bord
                      background: m.hangt ? "transparent" : `${W.paneel}88`,
                      width: "100%",
                    }}
                  >
                    <Gereedschap
                      vorm={VORMEN[i % VORMEN.length]!}
                      aanwezig={m.hangt}
                      kleur={m.kleur}
                    />
                  </span>
                  <span className="w-full">
                    <span
                      className="block text-[13px] font-semibold leading-tight"
                      style={{ color: W.tekst }}
                    >
                      {c.naam}
                    </span>
                    <span
                      className="mt-1.5 inline-flex items-center gap-1.5 px-2 py-0.5 text-[10px] uppercase"
                      style={{
                        ...monospace,
                        letterSpacing: "0.1em",
                        background: m.hangt ? `${m.kleur}22` : "transparent",
                        border: `1px solid ${m.kleur}`,
                        color: m.kleur,
                      }}
                    >
                      <m.Icon size={11} strokeWidth={2.8} aria-hidden="true" />
                      {m.label}
                    </span>
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      </Vak>

      {detail ? (
        <Vak
          titel={`Inspectie — ${detail.naam}`}
          code="S-04"
          actie={
            <button
              type="button"
              onClick={() => setGekozen(null)}
              className={`px-3 py-1 text-[10px] font-semibold uppercase ${FOCUS}`}
              style={{
                ...monospace,
                letterSpacing: "0.12em",
                border: `1px solid ${W.lijn}`,
                color: W.tekstZacht,
              }}
            >
              Sluiten
            </button>
          }
        >
          <div className="grid gap-4 sm:grid-cols-[auto_minmax(0,1fr)]">
            <span
              className="flex items-center justify-center px-6 py-4"
              style={{ background: W.bordDiep }}
            >
              <Gereedschap
                vorm={VORMEN[CREDENTIALS.findIndex((c) => c.naam === detail.naam) % VORMEN.length]!}
                aanwezig={statusMeta(detail.status).hangt}
                kleur={statusMeta(detail.status).kleur}
                hoogte={104}
              />
            </span>
            <dl className="space-y-3">
              {[
                {
                  l: "Status",
                  v: `${statusMeta(detail.status).label} — ${statusMeta(detail.status).toelichting}`,
                },
                { l: "Toelichting", v: detail.detail },
                {
                  l: "Zichtbaarheid",
                  v: "Opdrachtgevers zien alleen de status, nooit het bestand zelf.",
                },
                {
                  l: "Gevolg",
                  v: statusMeta(detail.status).hangt
                    ? "Telt volledig mee bij het bepalen of je op een werkorder past."
                    : "Telt nog niet mee; de omtrek blijft leeg tot het stuk is goedgekeurd.",
                },
              ].map((r) => (
                <div key={r.l} className="px-3 py-2.5" style={{ background: W.bordDiep }}>
                  <dt
                    className="text-[9.5px] uppercase"
                    style={{ ...monospace, color: W.staal, letterSpacing: "0.14em" }}
                  >
                    {r.l}
                  </dt>
                  <dd className="mt-1 text-[13px] leading-snug" style={{ color: W.tekst }}>
                    {r.v}
                  </dd>
                </div>
              ))}
              {!statusMeta(detail.status).hangt || detail.status === "EXPIRING" ? (
                <button
                  type="button"
                  className={`inline-flex items-center gap-2 px-4 py-2.5 text-[11px] font-semibold uppercase ${FOCUS}`}
                  style={{
                    ...monospace,
                    background: W.geel,
                    color: W.donker,
                    letterSpacing: "0.14em",
                  }}
                >
                  Vervangend stuk aanleveren <ArrowRight size={14} aria-hidden="true" />
                </button>
              ) : (
                <p className="text-[12.5px]" style={{ color: W.tekstZacht }}>
                  Geen handeling nodig — dit stuk hangt op zijn plek.
                </p>
              )}
            </dl>
          </div>
        </Vak>
      ) : (
        <LeegPaneel
          titel="Geen stuk geselecteerd"
          tekst="Kies een omtrek op het bord om het bewijsstuk te inspecteren: status, gevolg voor je matches en de eerstvolgende handeling."
          knop="Selecteer het eerste stuk"
          onKnop={() => setGekozen(CREDENTIALS[0]?.naam ?? null)}
        />
      )}
    </div>
  );
}

// ── T-04 Taken ────────────────────────────────────────────────────────────────────────
function Taken({ onSchaduwbord }: { onSchaduwbord: () => void }) {
  const [gedaan, setGedaan] = useState<string[]>([]);
  const lijst = ACTIES.filter((a) => !gedaan.includes(a.titel));

  return (
    <div className="space-y-5">
      <Vak titel="Takenlijst" code="T-04" actie={<Bordlabel>{lijst.length} open</Bordlabel>}>
        {lijst.length === 0 ? (
          <LeegPaneel
            titel="Werkplaats opgeruimd"
            tekst="Alle taken zijn afgevinkt. Zet de lijst terug om het overzicht opnieuw te bekijken."
            knop="Lijst terugzetten"
            onKnop={() => setGedaan([])}
          />
        ) : (
          <ol className="space-y-3">
            {lijst.map((a, i) => {
              const spoed = a.urgentie === "warning";
              return (
                <li key={a.titel}>
                  <article
                    className="flex flex-wrap items-start gap-4 px-4 py-4"
                    style={{
                      background: W.bordDiep,
                      borderLeft: `4px solid ${spoed ? W.geel : W.lijn}`,
                    }}
                  >
                    <span
                      className="flex h-9 w-9 shrink-0 items-center justify-center text-[13px] font-semibold"
                      style={{
                        ...monospace,
                        background: spoed ? W.geel : W.paneelHoog,
                        color: spoed ? W.donker : W.tekstZacht,
                      }}
                      aria-hidden="true"
                    >
                      {i + 1}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p
                        className="flex items-center gap-1.5 text-[10px] uppercase"
                        style={{
                          ...monospace,
                          color: spoed ? W.geel : W.staal,
                          letterSpacing: "0.14em",
                        }}
                      >
                        {spoed ? (
                          <AlertTriangle size={11} strokeWidth={2.8} aria-hidden="true" />
                        ) : (
                          <Clock size={11} strokeWidth={2.6} aria-hidden="true" />
                        )}
                        {spoed ? "Direct oppakken" : "Wanneer het uitkomt"}
                      </p>
                      <h3
                        className="mt-1.5 text-[16px] font-semibold leading-tight"
                        style={{ color: W.tekst }}
                      >
                        {a.titel}
                      </h3>
                      <p
                        className="mt-1 max-w-xl text-[13px] leading-snug"
                        style={{ color: W.tekstZacht }}
                      >
                        {a.detail}
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={onSchaduwbord}
                        className={`px-4 py-2 text-[10.5px] font-semibold uppercase ${FOCUS}`}
                        style={{
                          ...monospace,
                          letterSpacing: "0.12em",
                          background: spoed ? W.geel : "transparent",
                          color: spoed ? W.donker : W.geel,
                          border: `1px solid ${W.geel}`,
                        }}
                      >
                        {a.cta}
                      </button>
                      <button
                        type="button"
                        onClick={() => setGedaan((v) => [...v, a.titel])}
                        className={`px-4 py-2 text-[10.5px] font-semibold uppercase ${FOCUS}`}
                        style={{
                          ...monospace,
                          letterSpacing: "0.12em",
                          border: `1px solid ${W.lijn}`,
                          color: W.tekstZacht,
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

        {gedaan.length > 0 && lijst.length > 0 && (
          <p
            className="mt-4 text-[11px] uppercase"
            style={{ ...monospace, color: W.staal, letterSpacing: "0.12em" }}
            role="status"
          >
            {gedaan.length} afgevinkt ·{" "}
            <button
              type="button"
              onClick={() => setGedaan([])}
              className={`underline underline-offset-4 ${FOCUS}`}
              style={{ color: W.geel }}
            >
              terugzetten
            </button>
          </p>
        )}
      </Vak>
    </div>
  );
}

// ── U-05 Urenbriefjes ─────────────────────────────────────────────────────────────────
type Sortering = "datum" | "bedrag";

function Urenbriefjes() {
  const [sortering, setSortering] = useState<Sortering>("datum");

  const rijen = useMemo(() => {
    const waarde = (b: string) => Number(b.replace(/[^0-9]/g, "")) || 0;
    return sortering === "bedrag"
      ? [...FACTUREN].sort((a, b) => waarde(b.bedrag) - waarde(a.bedrag))
      : FACTUREN;
  }, [sortering]);

  const kleur = (s: string) => (s === "Betaald" ? W.ok : s === "Openstaand" ? W.geel : W.staal);

  return (
    <div className="space-y-5">
      <Vak
        titel="Urenbriefjes"
        code="U-05"
        actie={
          <div className="flex gap-1" role="group" aria-label="Sorteren">
            {(["datum", "bedrag"] as Sortering[]).map((s) => {
              const aan = sortering === s;
              return (
                <button
                  key={s}
                  type="button"
                  aria-pressed={aan}
                  onClick={() => setSortering(s)}
                  className={`px-3 py-1 text-[10px] font-semibold uppercase ${FOCUS}`}
                  style={{
                    ...monospace,
                    letterSpacing: "0.12em",
                    background: aan ? W.geel : "transparent",
                    color: aan ? W.donker : W.tekstZacht,
                    border: `1px solid ${aan ? W.geel : W.lijn}`,
                  }}
                >
                  {s === "datum" ? "Op datum" : "Op bedrag"}
                </button>
              );
            })}
          </div>
        }
      >
        <div className="overflow-x-auto">
          <table className="w-full min-w-[580px] border-collapse text-left">
            <caption className="sr-only">Urenbriefjes met status en bedrag</caption>
            <thead>
              <tr style={{ background: W.bordDiep }}>
                {["Briefje", "Opdrachtgever", "Datum", "Status", "Bedrag"].map((h) => (
                  <th
                    key={h}
                    scope="col"
                    className="px-3 py-2.5 text-[9.5px] uppercase"
                    style={{ ...monospace, color: W.staal, letterSpacing: "0.14em" }}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rijen.map((f) => (
                <tr
                  key={f.nr}
                  style={{ borderBottom: `1px solid ${W.lijn}` }}
                  className="transition-colors hover:bg-[#3d4650]"
                >
                  <th
                    scope="row"
                    className="px-3 py-3 text-left text-[12px] font-medium"
                    style={{ ...monospace, color: W.tekst }}
                  >
                    {f.nr}
                  </th>
                  <td className="px-3 py-3 text-[13px]" style={{ color: W.tekst }}>
                    {f.klant}
                  </td>
                  <td
                    className="px-3 py-3 text-[12px]"
                    style={{ ...monospace, color: W.tekstZacht }}
                  >
                    {f.datum}
                  </td>
                  <td className="px-3 py-3">
                    <span
                      className="inline-flex items-center gap-1.5 px-2 py-0.5 text-[10px] uppercase"
                      style={{
                        ...monospace,
                        letterSpacing: "0.1em",
                        border: `1px solid ${kleur(f.status)}`,
                        color: kleur(f.status),
                      }}
                    >
                      {f.status === "Betaald" ? (
                        <Check size={11} strokeWidth={3} aria-hidden="true" />
                      ) : f.status === "Openstaand" ? (
                        <Clock size={11} strokeWidth={2.8} aria-hidden="true" />
                      ) : (
                        <Clipboard size={11} strokeWidth={2.4} aria-hidden="true" />
                      )}
                      {f.status}
                    </span>
                  </td>
                  <td
                    className="px-3 py-3 text-[15px] font-semibold tabular-nums"
                    style={{ ...grotesk, color: W.tekst }}
                  >
                    {f.bedrag}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
          <p className="text-[12.5px]" style={{ color: W.tekstZacht }}>
            € 1.350 staat open bij Thuiszorg De Linde, verstuurd op 12 juni.
          </p>
          <button
            type="button"
            className={`inline-flex items-center gap-2 px-4 py-2.5 text-[10.5px] font-semibold uppercase ${FOCUS}`}
            style={{ ...monospace, background: W.geel, color: W.donker, letterSpacing: "0.12em" }}
          >
            Herinnering sturen <ArrowRight size={13} aria-hidden="true" />
          </button>
        </div>
      </Vak>
    </div>
  );
}

// ── K-06 Kist — documentenlade ────────────────────────────────────────────────────────
function Kist() {
  const [open, setOpen] = useState<string | null>(null);

  return (
    <div className="space-y-5">
      <Vak
        titel="Gereedschapskist"
        code="K-06"
        actie={<Bordlabel>{DOCUMENTEN.length} lades</Bordlabel>}
      >
        <p className="mb-4 max-w-2xl text-[13px] leading-relaxed" style={{ color: W.tekstZacht }}>
          Alles ligt privé in de kist. Open een lade om te zien wat erin zit en wat de status van
          dat stuk betekent voor je bord.
        </p>
        <ul className="space-y-2.5">
          {DOCUMENTEN.map((d, i) => {
            const m = statusMeta(d.status);
            const uit = open === d.naam;
            return (
              <li key={d.naam} style={{ background: W.bordDiep, border: `1px solid ${W.lijn}` }}>
                <h3>
                  <button
                    type="button"
                    onClick={() => setOpen(uit ? null : d.naam)}
                    aria-expanded={uit}
                    aria-controls={`gb-lade-${i}`}
                    className={`flex w-full flex-wrap items-center justify-between gap-3 px-4 py-3.5 text-left transition-colors hover:bg-[#3d4650] ${FOCUS}`}
                  >
                    <span className="flex min-w-0 items-center gap-3">
                      <span
                        className="flex h-9 w-11 shrink-0 items-center justify-center text-[10px] font-semibold uppercase"
                        style={{ ...monospace, background: W.paneelHoog, color: W.tekstZacht }}
                        aria-hidden="true"
                      >
                        {d.type}
                      </span>
                      <span className="min-w-0">
                        <span
                          className="block break-words text-[14px] font-medium leading-tight"
                          style={{ color: W.tekst }}
                        >
                          {d.naam}
                        </span>
                        <span
                          className="mt-0.5 block text-[11px]"
                          style={{ ...monospace, color: W.staal }}
                        >
                          {d.grootte} · bijgewerkt {d.bijgewerkt}
                        </span>
                      </span>
                    </span>
                    <span className="flex shrink-0 items-center gap-2.5">
                      <span
                        className="inline-flex items-center gap-1.5 px-2 py-0.5 text-[10px] uppercase"
                        style={{
                          ...monospace,
                          letterSpacing: "0.1em",
                          border: `1px solid ${m.kleur}`,
                          color: m.kleur,
                        }}
                      >
                        <m.Icon size={11} strokeWidth={2.8} aria-hidden="true" />
                        {m.label}
                      </span>
                      <ChevronDown
                        size={17}
                        strokeWidth={2.4}
                        aria-hidden="true"
                        style={{
                          color: W.staal,
                          transform: uit ? "rotate(180deg)" : "none",
                          transition: "transform 180ms",
                        }}
                      />
                    </span>
                  </button>
                </h3>
                {uit && (
                  <div
                    id={`gb-lade-${i}`}
                    className="px-4 py-4"
                    style={{ borderTop: `1px solid ${W.lijn}`, background: W.paneel }}
                  >
                    <p className="text-[13px] leading-relaxed" style={{ color: W.tekstZacht }}>
                      {m.toelichting}. Dit bestand wordt versleuteld bewaard en is nooit via een
                      openbaar adres bereikbaar; elke inzage komt in het logboek.
                    </p>
                    <div className="mt-3 flex flex-wrap gap-2">
                      <button
                        type="button"
                        className={`px-4 py-2 text-[10.5px] font-semibold uppercase ${FOCUS}`}
                        style={{
                          ...monospace,
                          letterSpacing: "0.12em",
                          border: `1px solid ${W.geel}`,
                          color: W.geel,
                        }}
                      >
                        Delen met één opdrachtgever
                      </button>
                      <button
                        type="button"
                        className={`px-4 py-2 text-[10.5px] font-semibold uppercase ${FOCUS}`}
                        style={{
                          ...monospace,
                          letterSpacing: "0.12em",
                          border: `1px solid ${W.lijn}`,
                          color: W.tekstZacht,
                        }}
                      >
                        Vervangen
                      </button>
                    </div>
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      </Vak>
    </div>
  );
}

// ── M-07 Werkbriefjes — berichten ─────────────────────────────────────────────────────
function Werkbriefjes() {
  const [gelezen, setGelezen] = useState<string[]>([]);
  const ongelezen = BERICHTEN.filter((b) => b.ongelezen && !gelezen.includes(b.van)).length;

  return (
    <div className="space-y-5">
      <Vak
        titel="Werkbriefjes"
        code="M-07"
        actie={<Bordlabel geel={ongelezen > 0}>{ongelezen} ongelezen</Bordlabel>}
      >
        <ul className="space-y-3">
          {BERICHTEN.map((b) => {
            const nieuw = b.ongelezen && !gelezen.includes(b.van);
            return (
              <li key={b.van}>
                <article
                  className="flex flex-wrap items-start gap-3 px-4 py-4"
                  style={{
                    background: W.bordDiep,
                    borderLeft: `4px solid ${nieuw ? W.geel : W.lijn}`,
                  }}
                >
                  <span
                    className="flex h-10 w-10 shrink-0 items-center justify-center text-[12px] font-semibold"
                    style={{ ...monospace, background: W.paneelHoog, color: W.tekst }}
                    aria-hidden="true"
                  >
                    {b.initialen}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <h3 className="text-[14px] font-semibold" style={{ color: W.tekst }}>
                        {b.van}
                      </h3>
                      <span className="text-[11px]" style={{ ...monospace, color: W.staal }}>
                        {b.tijd}
                      </span>
                    </div>
                    <p className="mt-1 text-[13px] leading-snug" style={{ color: W.tekstZacht }}>
                      {b.preview}
                    </p>
                    {nieuw && (
                      <span
                        className="mt-2 inline-flex items-center gap-1.5 px-2 py-0.5 text-[10px] uppercase"
                        style={{
                          ...monospace,
                          letterSpacing: "0.12em",
                          border: `1px solid ${W.geel}`,
                          color: W.geel,
                        }}
                      >
                        <AlertTriangle size={10} strokeWidth={2.8} aria-hidden="true" /> Ongelezen
                      </span>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => setGelezen((v) => (v.includes(b.van) ? v : [...v, b.van]))}
                    disabled={!nieuw}
                    className={`shrink-0 px-3 py-2 text-[10px] font-semibold uppercase disabled:cursor-not-allowed disabled:opacity-45 ${FOCUS}`}
                    style={{
                      ...monospace,
                      letterSpacing: "0.12em",
                      border: `1px solid ${W.lijn}`,
                      color: W.tekstZacht,
                    }}
                    title={nieuw ? undefined : "Dit briefje is al gelezen"}
                  >
                    Gelezen
                  </button>
                </article>
              </li>
            );
          })}
        </ul>
      </Vak>
    </div>
  );
}

// ── R-08 Bemiddelaar — overzicht van meerdere borden ──────────────────────────────────
function Bemiddelaar() {
  const [alleenStilstand, setAlleenStilstand] = useState(false);
  const rijen = alleenStilstand ? TEAMBORDEN.filter((t) => t.stilstand) : TEAMBORDEN;

  return (
    <div className="space-y-5">
      {TEAMBORDEN.some((t) => t.stilstand) && (
        <Hazardband tekst="Eén team staat stil: te veel lege omtrekken om veilig in te plannen. Vul die borden eerst." />
      )}

      <Vak
        titel="Borden per team"
        code="R-08"
        actie={
          <button
            type="button"
            onClick={() => setAlleenStilstand((v) => !v)}
            aria-pressed={alleenStilstand}
            className={`inline-flex items-center gap-2 px-3 py-1.5 text-[10px] font-semibold uppercase ${FOCUS}`}
            style={{
              ...monospace,
              letterSpacing: "0.12em",
              background: alleenStilstand ? W.geel : "transparent",
              color: alleenStilstand ? W.donker : W.tekstZacht,
              border: `1px solid ${alleenStilstand ? W.geel : W.lijn}`,
            }}
          >
            <Filter size={12} strokeWidth={2.6} aria-hidden="true" /> Alleen stilstand
          </button>
        }
      >
        <p className="mb-4 flex items-center gap-2 text-[13px]" style={{ color: W.tekstZacht }}>
          <Users size={15} strokeWidth={2.2} style={{ color: W.geel }} aria-hidden="true" />
          {rijen.length} team(s) · vullingsgraad is het aandeel omtrekken dat bezet is met een
          geverifieerd stuk.
        </p>

        {rijen.length === 0 ? (
          <LeegPaneel
            titel="Geen team in stilstand"
            tekst="Met dit filter blijft er geen team over — dat is goed nieuws. Zet het filter uit voor het volledige overzicht."
            knop="Filter uitzetten"
            onKnop={() => setAlleenStilstand(false)}
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[660px] border-collapse text-left">
              <caption className="sr-only">Vullingsgraad van de teamborden</caption>
              <thead>
                <tr style={{ background: W.bordDiep }}>
                  {["Team", "Regio", "Leden", "Vullingsgraad", "Ontbreekt", "Handeling"].map(
                    (h) => (
                      <th
                        key={h}
                        scope="col"
                        className="px-3 py-2.5 text-[9.5px] uppercase"
                        style={{ ...monospace, color: W.staal, letterSpacing: "0.14em" }}
                      >
                        {h}
                      </th>
                    ),
                  )}
                </tr>
              </thead>
              <tbody>
                {rijen.map((t) => (
                  <tr key={t.team} style={{ borderBottom: `1px solid ${W.lijn}` }}>
                    <th
                      scope="row"
                      className="px-3 py-3.5 text-left text-[13px] font-semibold"
                      style={{ color: W.tekst }}
                    >
                      {t.team}
                    </th>
                    <td className="px-3 py-3.5 text-[12.5px]" style={{ color: W.tekstZacht }}>
                      {t.regio}
                    </td>
                    <td
                      className="px-3 py-3.5 text-[12.5px] tabular-nums"
                      style={{ ...monospace, color: W.tekstZacht }}
                    >
                      {t.leden}
                    </td>
                    <td className="px-3 py-3.5">
                      <span className="flex items-center gap-2">
                        <span
                          className="h-2.5 w-24 shrink-0 overflow-hidden"
                          style={{ background: W.bordDiep }}
                          aria-hidden="true"
                        >
                          <span
                            className="block h-full"
                            style={{
                              width: `${t.compleet}%`,
                              background:
                                t.compleet >= 90 ? W.ok : t.compleet >= 75 ? W.geel : W.fout,
                            }}
                          />
                        </span>
                        <span
                          className="text-[12px] tabular-nums"
                          style={{ ...monospace, color: W.tekst }}
                        >
                          {t.compleet}%
                        </span>
                      </span>
                    </td>
                    <td className="px-3 py-3.5">
                      <span
                        className="inline-flex items-center gap-1.5 text-[11px]"
                        style={{
                          ...monospace,
                          color: t.ontbrekend === "geen" ? W.ok : W.waarschuwing,
                        }}
                      >
                        {t.ontbrekend === "geen" ? (
                          <Check size={11} strokeWidth={3} aria-hidden="true" />
                        ) : (
                          <AlertTriangle size={11} strokeWidth={2.8} aria-hidden="true" />
                        )}
                        {t.ontbrekend}
                      </span>
                    </td>
                    <td className="px-3 py-3.5">
                      <button
                        type="button"
                        disabled={t.ontbrekend === "geen"}
                        title={
                          t.ontbrekend === "geen"
                            ? "Dit bord is compleet — er is niets te herinneren"
                            : undefined
                        }
                        className={`px-3 py-1.5 text-[10px] font-semibold uppercase disabled:cursor-not-allowed disabled:opacity-40 ${FOCUS}`}
                        style={{
                          ...monospace,
                          letterSpacing: "0.1em",
                          border: `1px solid ${W.geel}`,
                          color: W.geel,
                        }}
                      >
                        Herinnering
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <p
          className="mt-5 flex items-start gap-2 text-[12.5px] leading-relaxed"
          style={{ color: W.tekstZacht }}
        >
          <ShieldCheck
            size={15}
            strokeWidth={2.2}
            style={{ color: W.ok }}
            aria-hidden="true"
            className="mt-0.5 shrink-0"
          />
          Een bemiddelaar ziet uitsluitend de vullingsgraad en welke soort stukken ontbreken — nooit
          het document zelf.
        </p>
      </Vak>
    </div>
  );
}
