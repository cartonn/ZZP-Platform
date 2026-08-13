"use client";

// Concept 560 — "Anatomie" · de anatomische atlas / botanische plaat als layout-mechaniek.
// Elk scherm heeft een centraal "preparaat" (het profiel, de opdracht, het dossier) met dunne
// haarlijnen naar genummerde bijschriften in de kantlijn, precies zoals een 19e-eeuwse plaat.
// Zweven of focussen op een bijschrift licht het bijbehorende onderdeel op — en andersom. Daarmee
// is dit meteen de meest verklaarbare matchweergave denkbaar: elk match-argument is een genummerd
// label dat naar het exacte profielonderdeel wijst.
// Inspiratie/referentie: "La Médecine Pittoresque" (Bayle, Parijs, midden 19e eeuw) met minutieus
// genummerde anatomische elementen als lesmateriaal; Duitse botanische schoolplaten (Atlas der
// Flora, Stuttgart 1885) met plaatnummer, marge-bijschrift en fijne verwijslijnen; de conventie om
// plaatnummer en graveursignatuur in de ondermarge te zetten.
// Fonts: Cormorant Garamond (bijschriften, koppen) + Inter (functionele UI).
// Alle grafiek is met de hand geschreven SVG; de verwijslijnen hebben een deterministische
// coördinatenlayout — geen random, geen datum-afhankelijkheid.

import {
  useMemo,
  useState,
  type CSSProperties,
  type KeyboardEvent as ReactKeyboardEvent,
  type ReactNode,
} from "react";
import {
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  Check,
  ChevronDown,
  Clock,
  FileText,
  Layers,
  MapPin,
  Minus,
  Plus,
  RefreshCw,
  Search,
  ShieldCheck,
  Stamp,
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

// ── Palet — platenpapier, sepia inkt, haarlijn, één karmijn ────────────────────────────
const C = {
  papier: "#f7f3ea",
  papierDiep: "#efe8d9",
  papierLicht: "#fdfbf6",
  inkt: "#3a3128",
  inktZacht: "#6b6153",
  inktFlets: "#928878",
  haar: "#c4b9a5",
  haarZacht: "#ded5c3",
  karmijn: "#a3352e",
  karmijnZacht: "#f2e2df",
};

const plaat = { fontFamily: "var(--font-lab-cormorant)" };
const ui = { fontFamily: "var(--font-lab-inter)" };
const ring = { "--tw-ring-color": C.karmijn } as CSSProperties;

// ── Schermen ───────────────────────────────────────────────────────────────────────────
type Scherm =
  | "situs"
  | "collectie"
  | "match"
  | "verificatie"
  | "ingrepen"
  | "facturen"
  | "atlas"
  | "profiel";

const SCHERMEN: { key: Scherm; label: string; plaat: string }[] = [
  { key: "situs", label: "Dashboard", plaat: "I" },
  { key: "collectie", label: "Marktplaats", plaat: "II" },
  { key: "match", label: "Opdracht", plaat: "III" },
  { key: "verificatie", label: "Verificatie", plaat: "IV" },
  { key: "ingrepen", label: "Acties", plaat: "V" },
  { key: "facturen", label: "Facturen", plaat: "VI" },
  { key: "atlas", label: "Documenten", plaat: "VII" },
  { key: "profiel", label: "Profiel", plaat: "VIII" },
];

// ── Plaatmechaniek ─────────────────────────────────────────────────────────────────────
type Anker = { x: number; y: number };

type Bijschrift = {
  nr: number;
  deel: string;
  zijde: "links" | "rechts";
  y: number;
  kop: string;
  tekst: string;
  nadruk?: boolean;
};

type DeelAttrs = {
  tabIndex?: number;
  role?: "button";
  "aria-label"?: string;
  className?: string;
  onMouseEnter?: () => void;
  onMouseLeave?: () => void;
  onFocus?: () => void;
  onBlur?: () => void;
  onClick?: () => void;
  onKeyDown?: (e: ReactKeyboardEvent<SVGGElement>) => void;
};

type DeelBinding = (deel: string, label: string) => DeelAttrs;

// Binding voor decoratieve miniaturen: geen focus, geen interactie.
const STIL_BINDING: DeelBinding = () => ({});

type Tekening = (actief: string | null, binding: DeelBinding) => ReactNode;

function Plaat({
  nummer,
  titel,
  onderschrift,
  bijschriften,
  ankers,
  tekening,
}: {
  nummer: string;
  titel: string;
  onderschrift: string;
  bijschriften: Bijschrift[];
  ankers: Record<string, Anker>;
  tekening: Tekening;
}) {
  const [vast, setVast] = useState<string | null>(null);
  const [zweef, setZweef] = useState<string | null>(null);
  const actief = zweef ?? vast;

  const binding: DeelBinding = (deel, label) => ({
    tabIndex: 0,
    role: "button",
    "aria-label": `Onderdeel: ${label}. Toont het bijbehorende genummerde bijschrift.`,
    className: "anat-deel",
    onMouseEnter: () => setZweef(deel),
    onMouseLeave: () => setZweef(null),
    onFocus: () => setZweef(deel),
    onBlur: () => setZweef(null),
    onClick: () => setVast((v) => (v === deel ? null : deel)),
    onKeyDown: (e: ReactKeyboardEvent<SVGGElement>) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        setVast((v) => (v === deel ? null : deel));
      }
    },
  });

  const kiesBijschrift = (b: Bijschrift) => setVast((v) => (v === b.deel ? null : b.deel));

  return (
    <figure className="m-0">
      <div
        className="relative rounded-[2px] px-3 py-4 sm:px-5"
        style={{ background: C.papierLicht, border: `1px solid ${C.haar}` }}
      >
        {/* Dubbele kaderlijn, zoals bij een gedrukte plaat */}
        <div
          className="pointer-events-none absolute inset-[6px] rounded-[1px]"
          style={{ border: `1px solid ${C.haarZacht}` }}
          aria-hidden="true"
        />

        <div className="relative">
          <p
            className="mb-1 text-center text-[11px] uppercase tracking-[0.28em]"
            style={{ ...ui, color: C.inktFlets }}
          >
            Plaat {nummer}
          </p>
          <h2
            className="mb-3 text-center text-[20px] leading-tight sm:text-[24px]"
            style={{ ...plaat, color: C.inkt }}
          >
            {titel}
          </h2>

          {/* Brede weergave: preparaat met verwijslijnen naar de kantlijn */}
          <svg
            viewBox="0 0 240 164"
            className="mx-auto hidden w-full max-w-[1000px] lg:block"
            role="group"
            aria-label={`${titel}. Genummerde onderdelen met bijschriften in de kantlijn.`}
          >
            <g>{tekening(actief, binding)}</g>

            {bijschriften.map((b) => {
              const a = ankers[b.deel];
              if (!a) return null;
              const aan = actief === b.deel;
              const links = b.zijde === "links";
              const knikX = links ? 74 : 166;
              const eindX = links ? 70 : 170;
              const lijnKleur = aan ? C.karmijn : b.nadruk ? `${C.karmijn}88` : C.haar;
              return (
                <g key={b.nr}>
                  <polyline
                    points={`${a.x},${a.y} ${knikX},${b.y} ${eindX},${b.y}`}
                    fill="none"
                    stroke={lijnKleur}
                    strokeWidth={aan ? 0.9 : 0.4}
                    aria-hidden="true"
                  />
                  <circle cx={a.x} cy={a.y} r={aan ? 1.6 : 1} fill={lijnKleur} aria-hidden="true" />
                  <circle
                    cx={links ? 66 : 174}
                    cy={b.y}
                    r={4}
                    fill={aan ? C.karmijn : C.papierLicht}
                    stroke={aan ? C.karmijn : C.inktZacht}
                    strokeWidth={0.4}
                    aria-hidden="true"
                  />
                  <text
                    x={links ? 66 : 174}
                    y={b.y + 1.5}
                    textAnchor="middle"
                    fontSize={4.2}
                    fill={aan ? C.papierLicht : C.inkt}
                    style={plaat}
                    aria-hidden="true"
                  >
                    {b.nr}
                  </text>

                  <foreignObject
                    x={links ? 0 : 180}
                    y={b.y - 11}
                    width={links ? 60 : 58}
                    height={22}
                    style={{ overflow: "visible" }}
                  >
                    <button
                      type="button"
                      onMouseEnter={() => setZweef(b.deel)}
                      onMouseLeave={() => setZweef(null)}
                      onFocus={() => setZweef(b.deel)}
                      onBlur={() => setZweef(null)}
                      onClick={() => kiesBijschrift(b)}
                      aria-pressed={vast === b.deel}
                      className="anat-marge flex h-full w-full flex-col justify-center rounded-[1px] focus-visible:outline-none"
                      style={{
                        alignItems: links ? "flex-end" : "flex-start",
                        textAlign: links ? "right" : "left",
                        padding: 1,
                      }}
                    >
                      <span
                        style={{
                          ...plaat,
                          fontSize: 4,
                          lineHeight: 1.1,
                          color: b.nadruk || aan ? C.karmijn : C.inkt,
                          fontWeight: 600,
                        }}
                      >
                        {b.nr}. {b.kop}
                      </span>
                      <span
                        style={{
                          ...ui,
                          fontSize: 3.1,
                          lineHeight: 1.25,
                          color: aan ? C.inkt : C.inktZacht,
                        }}
                      >
                        {b.tekst}
                      </span>
                    </button>
                  </foreignObject>
                </g>
              );
            })}
          </svg>

          {/* Smalle weergave: preparaat met genummerde merktekens, bijschriften eronder */}
          <svg
            viewBox="70 4 100 158"
            className="mx-auto block w-full max-w-[320px] lg:hidden"
            role="group"
            aria-label={`${titel}. Genummerde onderdelen; de bijschriften staan in de lijst onder de plaat.`}
          >
            <g>{tekening(actief, binding)}</g>
            {bijschriften.map((b) => {
              const a = ankers[b.deel];
              if (!a) return null;
              const aan = actief === b.deel;
              return (
                <g key={b.nr} aria-hidden="true">
                  <circle
                    cx={a.x + (b.zijde === "links" ? -7 : 7)}
                    cy={a.y - 4}
                    r={4.2}
                    fill={aan ? C.karmijn : C.papierLicht}
                    stroke={aan ? C.karmijn : C.inktZacht}
                    strokeWidth={0.4}
                  />
                  <text
                    x={a.x + (b.zijde === "links" ? -7 : 7)}
                    y={a.y - 2.5}
                    textAnchor="middle"
                    fontSize={4.4}
                    fill={aan ? C.papierLicht : C.inkt}
                    style={plaat}
                  >
                    {b.nr}
                  </text>
                  <line
                    x1={a.x + (b.zijde === "links" ? -3.4 : 3.4)}
                    y1={a.y - 4}
                    x2={a.x}
                    y2={a.y}
                    stroke={aan ? C.karmijn : C.haar}
                    strokeWidth={0.5}
                  />
                </g>
              );
            })}
          </svg>
        </div>
      </div>

      {/* Genummerde bijschriftenlijst — de nette degradatie op smalle schermen */}
      <ol className="mt-3 space-y-1.5 lg:hidden">
        {bijschriften.map((b) => {
          const aan = actief === b.deel;
          return (
            <li key={b.nr}>
              <button
                type="button"
                onMouseEnter={() => setZweef(b.deel)}
                onMouseLeave={() => setZweef(null)}
                onFocus={() => setZweef(b.deel)}
                onBlur={() => setZweef(null)}
                onClick={() => kiesBijschrift(b)}
                aria-pressed={vast === b.deel}
                className="flex w-full items-start gap-2.5 rounded-[2px] px-2.5 py-2 text-left transition-colors focus-visible:outline-none focus-visible:ring-2"
                style={{
                  background: aan ? C.karmijnZacht : C.papierLicht,
                  border: `1px solid ${aan ? `${C.karmijn}55` : C.haarZacht}`,
                  ...ring,
                }}
              >
                <span
                  className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[11px]"
                  style={{
                    ...plaat,
                    background: aan ? C.karmijn : "transparent",
                    color: aan ? C.papierLicht : C.inkt,
                    border: `1px solid ${aan ? C.karmijn : C.inktZacht}`,
                  }}
                  aria-hidden="true"
                >
                  {b.nr}
                </span>
                <span className="min-w-0">
                  <span
                    className="block text-[14px] leading-tight"
                    style={{ ...plaat, color: b.nadruk ? C.karmijn : C.inkt, fontWeight: 600 }}
                  >
                    {b.kop}
                  </span>
                  <span className="block text-[12px] leading-snug" style={{ color: C.inktZacht }}>
                    {b.tekst}
                  </span>
                </span>
              </button>
            </li>
          );
        })}
      </ol>

      <figcaption
        className="mt-3 text-center text-[12px] leading-relaxed"
        style={{ ...plaat, color: C.inktZacht }}
      >
        {onderschrift}
      </figcaption>
    </figure>
  );
}

// ── Preparaat 1 — het profiel als botanische plaat ────────────────────────────────────
const PLANT_ANKERS: Record<string, Anker> = {
  vrucht: { x: 101, y: 68 },
  bladLinks: { x: 98, y: 98 },
  stengel: { x: 120, y: 106 },
  wortel: { x: 118, y: 140 },
  bloem: { x: 120, y: 32 },
  knop: { x: 140, y: 54 },
  bladRechts: { x: 142, y: 82 },
  bodem: { x: 146, y: 123 },
};

const PETALEN = [0, 60, 120, 180, 240, 300];

function PreparaatPlant({ actief, binding }: { actief: string | null; binding: DeelBinding }) {
  const lijn = (deel: string) => ({
    stroke: actief === deel ? C.karmijn : C.inkt,
    strokeWidth: actief === deel ? 1.1 : 0.6,
    fill: "none" as const,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
  });
  const vlak = (deel: string) => (actief === deel ? `${C.karmijn}1f` : `${C.inkt}0a`);

  return (
    <>
      {/* Grondlijn met arcering */}
      <g {...binding("bodem", "Grondlijn — werkgebied en standplaats")}>
        <path d="M86,124 C100,120 140,120 156,124" {...lijn("bodem")} />
        {[90, 98, 106, 114, 122, 130, 138, 146, 152].map((x) => (
          <line
            key={x}
            x1={x}
            y1={124}
            x2={x - 3}
            y2={129}
            stroke={actief === "bodem" ? C.karmijn : C.haar}
            strokeWidth={0.4}
          />
        ))}
        <rect x={84} y={116} width={76} height={16} fill="transparent" />
      </g>

      {/* Wortelstelsel */}
      <g {...binding("wortel", "Wortelstelsel — opleiding en registratie")}>
        <path d="M120,124 C112,132 106,138 98,150" {...lijn("wortel")} />
        <path d="M120,124 C128,133 136,139 146,149" {...lijn("wortel")} />
        <path d="M120,124 C120,134 119,142 119,152" {...lijn("wortel")} />
        <path d="M112,133 C108,136 105,137 100,138" {...lijn("wortel")} strokeWidth={0.35} />
        <path d="M130,135 C134,138 137,139 141,140" {...lijn("wortel")} strokeWidth={0.35} />
        <path d="M119,140 C116,143 114,145 111,147" {...lijn("wortel")} strokeWidth={0.35} />
        <rect x={96} y={124} width={52} height={30} fill="transparent" />
      </g>

      {/* Stengel */}
      <g {...binding("stengel", "Stengel — werkervaring")}>
        <path d="M120,124 C118,110 122,96 120,84 C118,70 121,58 120,44" {...lijn("stengel")} />
        {[100, 106, 112].map((y) => (
          <line
            key={y}
            x1={117}
            y1={y}
            x2={123}
            y2={y - 1}
            stroke={actief === "stengel" ? C.karmijn : C.haar}
            strokeWidth={0.35}
          />
        ))}
        <rect x={114} y={84} width={12} height={40} fill="transparent" />
      </g>

      {/* Blad links */}
      <g {...binding("bladLinks", "Linkerblad — werkgebied en reistijd")}>
        <path
          d="M119,96 C106,88 92,89 84,98 C93,107 110,107 119,96 Z"
          {...lijn("bladLinks")}
          fill={vlak("bladLinks")}
        />
        <path d="M119,96 C108,97 96,99 86,99" {...lijn("bladLinks")} strokeWidth={0.35} />
        <path
          d="M110,93 L108,99 M102,92 L101,99 M95,93 L94,99"
          {...lijn("bladLinks")}
          strokeWidth={0.3}
        />
      </g>

      {/* Blad rechts */}
      <g {...binding("bladRechts", "Rechterblad — beschikbaarheid")}>
        <path
          d="M121,82 C134,73 148,74 156,83 C147,92 130,92 121,82 Z"
          {...lijn("bladRechts")}
          fill={vlak("bladRechts")}
        />
        <path d="M121,82 C132,83 144,84 154,84" {...lijn("bladRechts")} strokeWidth={0.35} />
        <path
          d="M130,78 L131,84 M138,77 L139,84 M146,78 L147,85"
          {...lijn("bladRechts")}
          strokeWidth={0.3}
        />
      </g>

      {/* Vruchtjes */}
      <g {...binding("vrucht", "Vruchten — omzet en tarief")}>
        <path d="M120,72 C113,70 106,68 102,67" {...lijn("vrucht")} strokeWidth={0.4} />
        <circle cx={100} cy={66} r={4.2} {...lijn("vrucht")} fill={vlak("vrucht")} />
        <circle cx={106} cy={72} r={3.1} {...lijn("vrucht")} fill={vlak("vrucht")} />
        <circle cx={96} cy={73} r={2.5} {...lijn("vrucht")} fill={vlak("vrucht")} />
      </g>

      {/* Knop */}
      <g {...binding("knop", "Knop — nog niet geopende kans")}>
        <path d="M121,66 C128,64 135,61 139,58" {...lijn("knop")} strokeWidth={0.4} />
        <path
          d="M140,64 C134,60 134,50 140,46 C146,50 146,60 140,64 Z"
          {...lijn("knop")}
          fill={vlak("knop")}
        />
        <path d="M140,62 L140,49" {...lijn("knop")} strokeWidth={0.3} />
      </g>

      {/* Bloem */}
      <g {...binding("bloem", "Bloem — match met de markt")}>
        {PETALEN.map((hoek) => (
          <ellipse
            key={hoek}
            cx={120}
            cy={26}
            rx={4.4}
            ry={9}
            transform={`rotate(${hoek} 120 36)`}
            {...lijn("bloem")}
            fill={vlak("bloem")}
          />
        ))}
        <circle
          cx={120}
          cy={36}
          r={4.6}
          {...lijn("bloem")}
          fill={actief === "bloem" ? `${C.karmijn}33` : C.papierDiep}
        />
        {[
          [118, 34],
          [122, 34],
          [120, 38],
          [117.5, 37.5],
          [122.5, 37.5],
        ].map(([x, y]) => (
          <circle
            key={`${x}-${y}`}
            cx={x}
            cy={y}
            r={0.6}
            fill={actief === "bloem" ? C.karmijn : C.inkt}
          />
        ))}
      </g>
    </>
  );
}

// ── Preparaat 2 — het dossier als wervelkolom ─────────────────────────────────────────
const KOLOM_ANKERS: Record<string, Anker> = {
  wervel0: { x: 142, y: 34 },
  wervel1: { x: 98, y: 64 },
  wervel2: { x: 142, y: 94 },
  wervel3: { x: 98, y: 124 },
};

function PreparaatKolom({
  actief,
  binding,
  statusPerWervel,
}: {
  actief: string | null;
  binding: DeelBinding;
  statusPerWervel: CredStatus[];
}) {
  const lijn = (deel: string) => ({
    stroke: actief === deel ? C.karmijn : C.inkt,
    strokeWidth: actief === deel ? 1.1 : 0.6,
    fill: "none" as const,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
  });

  return (
    <>
      {[0, 1, 2, 3].map((i) => {
        const deel = `wervel${i}`;
        const cy = 34 + i * 30;
        const status = statusPerWervel[i] ?? "SUBMITTED";
        const aandacht = status === "EXPIRING" || status === "REJECTED";
        const vulling =
          actief === deel
            ? `${C.karmijn}20`
            : status === "VERIFIED"
              ? `${C.inkt}14`
              : aandacht
                ? `${C.karmijn}10`
                : "transparent";
        return (
          <g key={deel} {...binding(deel, `Segment ${i + 1} van het dossier`)}>
            <rect
              x={100}
              y={cy - 11}
              width={40}
              height={22}
              rx={7}
              {...lijn(deel)}
              fill={vulling}
            />
            <path d={`M100,${cy} L86,${cy - 7}`} {...lijn(deel)} />
            <path d={`M100,${cy} L86,${cy + 7}`} {...lijn(deel)} />
            <path d={`M140,${cy} L154,${cy - 7}`} {...lijn(deel)} />
            <path d={`M140,${cy} L154,${cy + 7}`} {...lijn(deel)} />
            <circle cx={120} cy={cy} r={4.5} {...lijn(deel)} />
            {status === "VERIFIED" && (
              <path
                d={`M117.6,${cy} l1.8,1.9 l3.4,-3.8`}
                fill="none"
                stroke={actief === deel ? C.karmijn : C.inkt}
                strokeWidth={0.8}
                strokeLinecap="round"
              />
            )}
            {aandacht && (
              <>
                <line
                  x1={120}
                  y1={cy - 2.2}
                  x2={120}
                  y2={cy + 0.6}
                  stroke={C.karmijn}
                  strokeWidth={0.8}
                />
                <circle cx={120} cy={cy + 2.2} r={0.6} fill={C.karmijn} />
              </>
            )}
            {i < 3 && (
              <rect
                x={112}
                y={cy + 11}
                width={16}
                height={8}
                rx={3}
                fill="none"
                stroke={C.haar}
                strokeWidth={0.5}
              />
            )}
          </g>
        );
      })}
      <text
        x={120}
        y={152}
        textAnchor="middle"
        fontSize={4.4}
        fill={C.inktZacht}
        style={plaat}
        aria-hidden="true"
      >
        fig. IV — dossier in doorsnede
      </text>
    </>
  );
}

// ── Gedeelde UI-primitives ────────────────────────────────────────────────────────────
function credMeta(s: CredStatus): { label: string; Icon: LucideIcon; nadruk: boolean } {
  switch (s) {
    case "VERIFIED":
      return { label: "Geverifieerd", Icon: Check, nadruk: false };
    case "SUBMITTED":
      return { label: "In beoordeling", Icon: Clock, nadruk: false };
    case "EXPIRING":
      return { label: "Verloopt binnenkort", Icon: AlertTriangle, nadruk: true };
    case "REJECTED":
      return { label: "Afgewezen", Icon: XCircle, nadruk: true };
  }
}

function Merk({ label, Icon, nadruk }: { label: string; Icon: LucideIcon; nadruk?: boolean }) {
  return (
    <span
      className="inline-flex max-w-full items-center gap-1.5 rounded-[2px] px-2 py-0.5 text-[11px] leading-tight"
      style={{
        ...ui,
        background: nadruk ? C.karmijnZacht : C.papierDiep,
        color: nadruk ? C.karmijn : C.inktZacht,
        border: `1px solid ${nadruk ? `${C.karmijn}44` : C.haarZacht}`,
      }}
    >
      <Icon size={11} strokeWidth={2} aria-hidden="true" className="shrink-0" />
      <span className="truncate">{label}</span>
    </span>
  );
}

function Kop({ boven, titel, onder }: { boven: string; titel: string; onder?: string }) {
  return (
    <div className="mb-5 border-b pb-3" style={{ borderColor: C.haarZacht }}>
      <p
        className="text-[10.5px] uppercase tracking-[0.28em]"
        style={{ ...ui, color: C.inktFlets }}
      >
        {boven}
      </p>
      <h1
        className="mt-1 text-[26px] leading-tight sm:text-[32px]"
        style={{ ...plaat, color: C.inkt }}
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

function Kader({
  titel,
  bijschrift,
  children,
}: {
  titel: string;
  bijschrift?: string;
  children: ReactNode;
}) {
  return (
    <section
      className="min-w-0 rounded-[2px] p-4"
      style={{ background: C.papierLicht, border: `1px solid ${C.haar}` }}
    >
      <header className="mb-3 border-b pb-2" style={{ borderColor: C.haarZacht }}>
        <h2 className="text-[16px] leading-tight" style={{ ...plaat, color: C.inkt }}>
          {titel}
        </h2>
        {bijschrift && (
          <p
            className="text-[11px] uppercase tracking-[0.16em]"
            style={{ ...ui, color: C.inktFlets }}
          >
            {bijschrift}
          </p>
        )}
      </header>
      {children}
    </section>
  );
}

function Knop({
  children,
  onClick,
  variant = "primair",
  disabled,
  title,
  pressed,
}: {
  children: ReactNode;
  onClick?: () => void;
  variant?: "primair" | "rand";
  disabled?: boolean;
  title?: string;
  pressed?: boolean;
}) {
  const primair = variant === "primair";
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      title={title}
      aria-pressed={pressed}
      className="inline-flex items-center justify-center gap-1.5 rounded-[2px] px-3.5 py-2 text-[12.5px] font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 disabled:cursor-not-allowed disabled:opacity-45"
      style={{
        ...ui,
        background: primair ? C.karmijn : pressed ? C.karmijnZacht : "transparent",
        color: primair ? C.papierLicht : pressed ? C.karmijn : C.inkt,
        border: `1px solid ${primair ? C.karmijn : pressed ? `${C.karmijn}55` : C.haar}`,
        ...ring,
      }}
    >
      {children}
    </button>
  );
}

// ── Scherm I — Situs (dashboard) ──────────────────────────────────────────────────────
const SITUS_BIJSCHRIFTEN: Bijschrift[] = [
  {
    nr: 1,
    deel: "vrucht",
    zijde: "links",
    y: 40,
    kop: "Omzet",
    tekst: "€ 8.240 deze maand, twaalf procent boven vorige maand.",
  },
  {
    nr: 2,
    deel: "bladLinks",
    zijde: "links",
    y: 74,
    kop: "Werkgebied",
    tekst: "Utrecht en omstreken, straal van 25 kilometer.",
  },
  {
    nr: 3,
    deel: "stengel",
    zijde: "links",
    y: 106,
    kop: "Ervaring",
    tekst: "Acht jaar wijkverpleging, waarvan drie als zelfstandige.",
  },
  {
    nr: 4,
    deel: "wortel",
    zijde: "links",
    y: 140,
    kop: "Registraties",
    tekst: "BIG en hbo-v geverifieerd; dit draagt je hele profiel.",
  },
  {
    nr: 5,
    deel: "bloem",
    zijde: "rechts",
    y: 34,
    kop: "Match",
    tekst: "92 procent gemiddeld — de hoogste stand van dit jaar.",
  },
  {
    nr: 6,
    deel: "knop",
    zijde: "rechts",
    y: 66,
    kop: "VOG (zorg)",
    tekst: "Verloopt over 23 dagen. Vernieuw op tijd, anders sluit deze knop.",
    nadruk: true,
  },
  {
    nr: 7,
    deel: "bladRechts",
    zijde: "rechts",
    y: 98,
    kop: "Beschikbaarheid",
    tekst: "24 tot 32 uur per week, avond- en nachtdiensten.",
  },
  {
    nr: 8,
    deel: "bodem",
    zijde: "rechts",
    y: 130,
    kop: "Te factureren",
    tekst: "€ 1.350 open op twee opdrachten.",
  },
];

function SitusScherm({ onGa }: { onGa: (s: Scherm) => void }) {
  return (
    <div className="space-y-6">
      <Kop
        boven="Plaat I · situs"
        titel={`Goedemorgen, ${PROFIEL.naam.split(" ")[0]}`}
        onder="Je praktijk in doorsnede. Elk genummerd onderdeel verwijst naar een deel van je profiel; wijs een nummer aan om te zien waar het over gaat."
      />

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(0,340px)]">
        <Plaat
          nummer="I"
          titel="Het profiel als preparaat"
          onderschrift="Naar de natuur getekend uit je eigen gegevens · alle onderdelen zijn server-zijdig vastgesteld."
          bijschriften={SITUS_BIJSCHRIFTEN}
          ankers={PLANT_ANKERS}
          tekening={(actief, binding) => <PreparaatPlant actief={actief} binding={binding} />}
        />

        <div className="space-y-4">
          <Kader titel="Metingen" bijschrift="deze maand">
            <dl className="grid grid-cols-2 gap-3">
              {KPIS.map((k) => (
                <div key={k.label} className="min-w-0">
                  <dt
                    className="text-[11px] uppercase tracking-[0.14em]"
                    style={{ ...ui, color: C.inktFlets }}
                  >
                    {k.label}
                  </dt>
                  <dd
                    className="mt-0.5 truncate text-[21px] leading-none"
                    style={{ ...plaat, color: C.inkt }}
                  >
                    {k.value}
                  </dd>
                  <dd
                    className="mt-1 flex items-center gap-1 text-[11px]"
                    style={{ ...ui, color: k.up ? C.inktZacht : C.karmijn }}
                  >
                    {k.up ? (
                      <Plus size={10} aria-hidden="true" />
                    ) : (
                      <Minus size={10} aria-hidden="true" />
                    )}
                    {k.trend}
                  </dd>
                </div>
              ))}
            </dl>
          </Kader>

          <Kader titel="Aantekeningen" bijschrift="ongelezen berichten">
            <ul className="space-y-2.5">
              {BERICHTEN.map((b) => (
                <li key={b.van} className="flex items-start gap-2.5">
                  <span
                    className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[10px]"
                    style={{ ...plaat, border: `1px solid ${C.haar}`, color: C.inktZacht }}
                    aria-hidden="true"
                  >
                    {b.initialen}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-baseline justify-between gap-2">
                      <span
                        className="truncate text-[13px]"
                        style={{ ...plaat, color: C.inkt, fontWeight: 600 }}
                      >
                        {b.van}
                      </span>
                      <span
                        className="shrink-0 text-[10.5px]"
                        style={{ ...ui, color: C.inktFlets }}
                      >
                        {b.tijd}
                      </span>
                    </div>
                    <p className="text-[12px] leading-snug" style={{ color: C.inktZacht }}>
                      {b.preview}
                    </p>
                    {b.ongelezen && (
                      <span className="mt-1 inline-block">
                        <Merk label="Ongelezen" Icon={Stamp} />
                      </span>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          </Kader>

          <Kader titel="Eerstvolgende ingreep" bijschrift="wat nu telt">
            <p className="text-[13px] leading-relaxed" style={{ color: C.inktZacht }}>
              {ACTIES[0]!.detail}
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              <Knop onClick={() => onGa("ingrepen")}>
                {ACTIES[0]!.cta} <ArrowRight size={13} aria-hidden="true" />
              </Knop>
              <Knop variant="rand" onClick={() => onGa("collectie")}>
                Naar de marktplaats
              </Knop>
            </div>
          </Kader>
        </div>
      </div>
    </div>
  );
}

// ── Scherm II — Collectie (marktplaats) ───────────────────────────────────────────────
type Weergave = "gereed" | "laden" | "leeg" | "fout";

function CollectieScherm({ onOpen }: { onOpen: (o: Opdracht) => void }) {
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
    <div className="space-y-5">
      <Kop
        boven="Plaat II · collectie"
        titel="Marktplaats"
        onder="De collectie van deze week. Elk exemplaar is opgemeten tegen jouw profiel; het percentage is server-zijdig vastgesteld."
      />

      <div className="flex flex-wrap items-center gap-2">
        <div
          className="flex min-w-0 flex-1 items-center gap-2 rounded-[2px] px-3 py-2"
          style={{ background: C.papierLicht, border: `1px solid ${C.haar}` }}
        >
          <Search size={15} style={{ color: C.inktFlets }} aria-hidden="true" />
          <input
            value={zoek}
            onChange={(e) => setZoek(e.target.value)}
            placeholder="Zoek in de collectie"
            aria-label="Opdrachten zoeken"
            className="w-full min-w-0 bg-transparent text-[13px] outline-none"
            style={{ ...ui, color: C.inkt }}
          />
        </div>
        <div
          className="flex flex-wrap gap-1"
          role="group"
          aria-label="Demo-weergave van dit scherm"
        >
          {(["gereed", "laden", "leeg", "fout"] as Weergave[]).map((w) => (
            <button
              key={w}
              type="button"
              onClick={() => setWeergave(w)}
              aria-pressed={weergave === w}
              className="rounded-[2px] px-2.5 py-1.5 text-[11px] focus-visible:outline-none focus-visible:ring-2"
              style={{
                ...ui,
                background: weergave === w ? C.karmijn : C.papierLicht,
                color: weergave === w ? C.papierLicht : C.inktZacht,
                border: `1px solid ${weergave === w ? C.karmijn : C.haar}`,
                ...ring,
              }}
            >
              {w}
            </button>
          ))}
        </div>
      </div>

      {weergave === "laden" && (
        <div className="space-y-3" aria-busy="true" aria-live="polite">
          <p className="flex items-center gap-2 text-[12px]" style={{ ...ui, color: C.inktFlets }}>
            <RefreshCw size={13} className="anat-draai" aria-hidden="true" /> De plaat wordt
            gedrukt…
          </p>
          {[0, 1, 2].map((n) => (
            <div
              key={n}
              className="rounded-[2px] p-4"
              style={{ background: C.papierLicht, border: `1px dashed ${C.haar}` }}
            >
              <div className="flex gap-4">
                <div
                  className="h-16 w-16 shrink-0 rounded-[2px]"
                  style={{ border: `1px dashed ${C.haarZacht}` }}
                />
                <div className="min-w-0 flex-1 space-y-2">
                  <div className="h-3 w-2/3 rounded-[1px]" style={{ background: C.papierDiep }} />
                  <div className="h-2.5 w-1/2 rounded-[1px]" style={{ background: C.papierDiep }} />
                  <div className="h-2.5 w-1/3 rounded-[1px]" style={{ background: C.papierDiep }} />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {weergave === "fout" && (
        <div
          className="rounded-[2px] p-6"
          style={{ background: C.papierLicht, border: `1px solid ${C.karmijn}55` }}
          role="alert"
        >
          <p
            className="flex items-center gap-2 text-[15px]"
            style={{ ...plaat, color: C.karmijn, fontWeight: 600 }}
          >
            <AlertTriangle size={16} aria-hidden="true" /> De plaat kon niet worden opgehaald
          </p>
          <p className="mt-1.5 max-w-lg text-[13px] leading-relaxed" style={{ color: C.inktZacht }}>
            De verbinding met de collectie is onderbroken. Je eigen gegevens zijn niet gewijzigd.
          </p>
          <div className="mt-3">
            <Knop onClick={() => setWeergave("gereed")}>
              <RefreshCw size={13} aria-hidden="true" /> Opnieuw ophalen
            </Knop>
          </div>
        </div>
      )}

      {weergave !== "laden" && weergave !== "fout" && resultaten.length === 0 && (
        <div
          className="rounded-[2px] p-6"
          style={{ background: C.papierLicht, border: `1px dashed ${C.haar}` }}
        >
          <p
            className="flex items-center gap-2 text-[15px]"
            style={{ ...plaat, color: C.inkt, fontWeight: 600 }}
          >
            <Layers size={16} aria-hidden="true" /> Lege vitrine
          </p>
          <p className="mt-1.5 max-w-lg text-[13px] leading-relaxed" style={{ color: C.inktZacht }}>
            {zoek
              ? `Geen exemplaar gevonden voor “${zoek}”. Verruim je zoekopdracht.`
              : "Er staan op dit moment geen opdrachten in je werkgebied. Zodra er één binnenkomt, wordt hij hier opgenomen."}
          </p>
          <div className="mt-3">
            <Knop
              variant="rand"
              onClick={() => {
                setZoek("");
                setWeergave("gereed");
              }}
            >
              Zoekopdracht wissen
            </Knop>
          </div>
        </div>
      )}

      {weergave !== "laden" && weergave !== "fout" && resultaten.length > 0 && (
        <ul className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
          {resultaten.map((o, i) => (
            <li key={o.id}>
              <article
                className="flex h-full flex-col rounded-[2px] p-4"
                style={{ background: C.papierLicht, border: `1px solid ${C.haar}` }}
              >
                <div className="flex items-start justify-between gap-3">
                  <span
                    className="text-[10.5px] uppercase tracking-[0.2em]"
                    style={{ ...ui, color: C.inktFlets }}
                  >
                    Exemplaar {i + 1} · {o.id}
                  </span>
                  <span
                    className="shrink-0 rounded-full px-2 py-0.5 text-[11px]"
                    style={{
                      ...ui,
                      color: o.match >= 90 ? C.karmijn : C.inktZacht,
                      border: `1px solid ${o.match >= 90 ? `${C.karmijn}55` : C.haar}`,
                    }}
                  >
                    {o.match}% match
                  </span>
                </div>

                {/* Miniatuur van het preparaat */}
                <svg viewBox="80 10 80 130" className="mx-auto my-2 h-24 w-auto" aria-hidden="true">
                  <PreparaatPlant actief={null} binding={STIL_BINDING} />
                </svg>

                <h3
                  className="text-[17px] leading-tight"
                  style={{ ...plaat, color: C.inkt, fontWeight: 600 }}
                >
                  {o.titel}
                </h3>
                <p className="mt-1 text-[12.5px] leading-snug" style={{ color: C.inktZacht }}>
                  {o.opdrachtgever}
                </p>
                <ul className="mt-2 space-y-1 text-[12px]" style={{ color: C.inktZacht }}>
                  <li className="flex items-center gap-1.5">
                    <MapPin size={12} aria-hidden="true" /> {o.plaats} · {o.uren}
                  </li>
                  <li className="flex items-center gap-1.5">
                    <Stamp size={12} aria-hidden="true" /> {o.tarief} · {o.start}
                  </li>
                </ul>
                <ul className="mt-2 flex flex-wrap gap-1">
                  {o.tags.map((t) => (
                    <li
                      key={t}
                      className="rounded-[2px] px-1.5 py-0.5 text-[10.5px]"
                      style={{ ...ui, color: C.inktZacht, border: `1px solid ${C.haarZacht}` }}
                    >
                      {t}
                    </li>
                  ))}
                </ul>
                <div className="mt-3 pt-1">
                  <Knop onClick={() => onOpen(o)}>
                    Plaat openen <ArrowRight size={13} aria-hidden="true" />
                  </Knop>
                </div>
              </article>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

// ── Scherm III — Match (opdracht-detail met de sterplaat) ─────────────────────────────
function matchBijschriften(o: Opdracht): Bijschrift[] {
  const delen = ["wortel", "bladLinks", "vrucht", "bladRechts"];
  const plus: Bijschrift[] = o.redenen.plus.slice(0, 3).map((r, i) => ({
    nr: i + 1,
    deel: delen[i] ?? "stengel",
    zijde: "links",
    y: [40, 74, 106][i] ?? 138,
    kop: "Pleit vóór",
    tekst: r,
  }));
  const min: Bijschrift[] = o.redenen.min.slice(0, 1).map((r) => ({
    nr: plus.length + 1,
    deel: "bladRechts",
    zijde: "links",
    y: 140,
    kop: "Pleit tegen",
    tekst: r,
    nadruk: true,
  }));
  const feiten: Bijschrift[] = [
    { deel: "bloem", y: 34, kop: "Match", tekst: `${o.match}% overeenkomst met je profiel.` },
    { deel: "knop", y: 66, kop: "Start", tekst: `${o.start} · ${o.uren}.` },
    { deel: "stengel", y: 98, kop: "Tarief", tekst: `${o.tarief} — boven je ondergrens van € 48.` },
    { deel: "bodem", y: 130, kop: "Plaats", tekst: `${o.plaats} · ${o.opdrachtgever}.` },
  ].map((f, i) => ({
    nr: plus.length + min.length + i + 1,
    deel: f.deel,
    zijde: "rechts" as const,
    y: f.y,
    kop: f.kop,
    tekst: f.tekst,
  }));
  return [...plus, ...min, ...feiten];
}

function MatchScherm({ opdracht, onTerug }: { opdracht: Opdracht; onTerug: () => void }) {
  const [gereageerd, setGereageerd] = useState(false);
  const [uitleg, setUitleg] = useState(false);
  const bijschriften = useMemo(() => matchBijschriften(opdracht), [opdracht]);

  return (
    <div className="space-y-5">
      <button
        type="button"
        onClick={onTerug}
        className="inline-flex items-center gap-1.5 rounded-[2px] px-2 py-1 text-[12.5px] focus-visible:outline-none focus-visible:ring-2"
        style={{ ...ui, color: C.inktZacht, ...ring }}
      >
        <ArrowLeft size={14} aria-hidden="true" /> Terug naar de collectie
      </button>

      <Kop
        boven={`Plaat III · ${opdracht.id}`}
        titel={opdracht.titel}
        onder={`${opdracht.opdrachtgever} · ${opdracht.plaats} · ${opdracht.tarief}`}
      />

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(0,320px)]">
        <Plaat
          nummer="III"
          titel="Anatomie van deze match"
          onderschrift="Elk genummerd bijschrift wijst naar het profielonderdeel waarop het oordeel rust. Niets is geraden."
          bijschriften={bijschriften}
          ankers={PLANT_ANKERS}
          tekening={(actief, binding) => <PreparaatPlant actief={actief} binding={binding} />}
        />

        <div className="space-y-4">
          <Kader titel="Weegschaal" bijschrift="vóór en tegen">
            <ul className="space-y-2">
              {opdracht.redenen.plus.map((r) => (
                <li
                  key={r}
                  className="flex items-start gap-2 text-[13px]"
                  style={{ color: C.inkt }}
                >
                  <Plus
                    size={13}
                    className="mt-0.5 shrink-0"
                    style={{ color: C.inktZacht }}
                    aria-hidden="true"
                  />
                  <span className="min-w-0">{r}</span>
                </li>
              ))}
              {opdracht.redenen.min.map((r) => (
                <li
                  key={r}
                  className="flex items-start gap-2 text-[13px]"
                  style={{ color: C.karmijn }}
                >
                  <Minus size={13} className="mt-0.5 shrink-0" aria-hidden="true" />
                  <span className="min-w-0">{r}</span>
                </li>
              ))}
            </ul>
          </Kader>

          <Kader titel="Bepaling" bijschrift="hoe dit percentage tot stand komt">
            <button
              type="button"
              onClick={() => setUitleg((v) => !v)}
              aria-expanded={uitleg}
              className="flex w-full items-center justify-between gap-2 rounded-[2px] px-2 py-1.5 text-[12.5px] focus-visible:outline-none focus-visible:ring-2"
              style={{ ...ui, color: C.inktZacht, border: `1px solid ${C.haarZacht}`, ...ring }}
            >
              {uitleg ? "Verberg de berekening" : "Toon de berekening"}
              <ChevronDown
                size={14}
                aria-hidden="true"
                style={{
                  transform: uitleg ? "rotate(180deg)" : "none",
                  transition: "transform 160ms",
                }}
              />
            </button>
            {uitleg && (
              <dl className="mt-2 space-y-1.5">
                {[
                  { l: "Geverifieerde certificaten", v: "40 van 40 punten" },
                  { l: "Reistijd tot standplaats", v: "22 van 25 punten" },
                  { l: "Tarief tegenover ondergrens", v: "20 van 20 punten" },
                  { l: "Beschikbaarheid en diensten", v: "12 van 15 punten" },
                ].map((r) => (
                  <div key={r.l} className="flex items-baseline justify-between gap-3">
                    <dt className="min-w-0 text-[12px]" style={{ color: C.inktZacht }}>
                      {r.l}
                    </dt>
                    <dd
                      className="shrink-0 text-[12px] tabular-nums"
                      style={{ ...ui, color: C.inkt }}
                    >
                      {r.v}
                    </dd>
                  </div>
                ))}
              </dl>
            )}
          </Kader>

          <Kader titel="Handeling" bijschrift="reactietijd gemiddeld 6 uur">
            <div className="flex flex-col gap-2">
              <Knop onClick={() => setGereageerd(true)} disabled={gereageerd}>
                {gereageerd ? "Reactie verstuurd" : "Reageren op deze opdracht"}
              </Knop>
              <Knop
                variant="rand"
                disabled
                title="Doorsturen kan pas als je een bemiddelaar hebt gekoppeld."
              >
                Doorsturen naar bemiddelaar
              </Knop>
              {gereageerd && (
                <p
                  className="rounded-[2px] p-2.5 text-[12px] leading-relaxed"
                  style={{ background: C.karmijnZacht, color: C.karmijn }}
                  aria-live="polite"
                >
                  Je reactie staat genoteerd bij {opdracht.opdrachtgever}. Je krijgt bericht zodra
                  er gelezen is.
                </p>
              )}
            </div>
          </Kader>
        </div>
      </div>
    </div>
  );
}

// ── Scherm IV — Verificatie ───────────────────────────────────────────────────────────
function VerificatieScherm({ onGa }: { onGa: (s: Scherm) => void }) {
  const [aangevraagd, setAangevraagd] = useState<string[]>([]);

  const bijschriften: Bijschrift[] = CREDENTIALS.map((c, i) => {
    const m = credMeta(c.status);
    return {
      nr: i + 1,
      deel: `wervel${i}`,
      zijde: (i % 2 === 0 ? "rechts" : "links") as "links" | "rechts",
      y: [34, 66, 98, 130][i] ?? 34,
      kop: c.naam.length > 26 ? `${c.naam.slice(0, 24)}…` : c.naam,
      tekst: `${m.label} · ${c.detail}`,
      nadruk: m.nadruk,
    };
  });

  const statussen = CREDENTIALS.map((c) => c.status);
  const geverifieerd = CREDENTIALS.filter((c) => c.status === "VERIFIED").length;

  return (
    <div className="space-y-5">
      <Kop
        boven="Plaat IV · dossier"
        titel="Verificatie van je certificaten"
        onder={`${geverifieerd} van ${CREDENTIALS.length} segmenten zijn geverifieerd. Een segment dat verloopt verzwakt het geheel — daarom staat het in karmijn.`}
      />

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(0,340px)]">
        <Plaat
          nummer="IV"
          titel="Het dossier in doorsnede"
          onderschrift="Vier segmenten dragen je vertrouwensniveau. Documenten zelf blijven privé; alleen de status is zichtbaar."
          bijschriften={bijschriften}
          ankers={KOLOM_ANKERS}
          tekening={(actief, binding) => (
            <PreparaatKolom actief={actief} binding={binding} statusPerWervel={statussen} />
          )}
        />

        <div className="space-y-4">
          <Kader titel="Segmenten" bijschrift="status en herstelactie">
            <ul className="space-y-2">
              {CREDENTIALS.map((c) => {
                const m = credMeta(c.status);
                const bezig = aangevraagd.includes(c.naam);
                return (
                  <li
                    key={c.naam}
                    className="rounded-[2px] p-3"
                    style={{ background: C.papier, border: `1px solid ${C.haarZacht}` }}
                  >
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <div className="min-w-0">
                        <h3
                          className="text-[14px] leading-tight"
                          style={{ ...plaat, color: C.inkt, fontWeight: 600 }}
                        >
                          {c.naam}
                        </h3>
                        <p className="text-[12px]" style={{ color: C.inktZacht }}>
                          {c.detail}
                        </p>
                      </div>
                      <Merk label={m.label} Icon={m.Icon} nadruk={m.nadruk} />
                    </div>
                    <div className="mt-2">
                      {c.status === "VERIFIED" ? (
                        <Knop
                          variant="rand"
                          disabled
                          title="Dit certificaat is geverifieerd; er is nu geen actie nodig."
                        >
                          Geen actie nodig
                        </Knop>
                      ) : (
                        <Knop
                          variant="rand"
                          pressed={bezig}
                          onClick={() =>
                            setAangevraagd((v) => (v.includes(c.naam) ? v : [...v, c.naam]))
                          }
                        >
                          {bezig ? "Aanvraag genoteerd" : "Herstel regelen"}
                        </Knop>
                      )}
                    </div>
                  </li>
                );
              })}
            </ul>
          </Kader>

          <Kader titel="Vertrouwensniveau">
            <div className="flex items-start gap-3">
              <ShieldCheck size={24} style={{ color: C.inkt }} aria-hidden="true" />
              <div className="min-w-0">
                <p className="text-[17px] leading-tight" style={{ ...plaat, color: C.inkt }}>
                  {PROFIEL.trust}
                </p>
                <p className="mt-1 text-[12.5px] leading-relaxed" style={{ color: C.inktZacht }}>
                  Opdrachtgevers zien uitsluitend de status van je certificaten, nooit het document.
                </p>
              </div>
            </div>
            <div className="mt-3">
              <Knop variant="rand" onClick={() => onGa("atlas")}>
                Naar je documenten <ArrowRight size={13} aria-hidden="true" />
              </Knop>
            </div>
          </Kader>
        </div>
      </div>
    </div>
  );
}

// ── Scherm V — Ingrepen (acties) ──────────────────────────────────────────────────────
function IngrepenScherm({ onGa }: { onGa: (s: Scherm) => void }) {
  const [gedaan, setGedaan] = useState<string[]>([]);
  const gesorteerd = useMemo(
    () =>
      [...ACTIES].sort((a, b) =>
        a.urgentie === b.urgentie ? 0 : a.urgentie === "warning" ? -1 : 1,
      ),
    [],
  );
  const doelen: Record<string, Scherm> = {
    "VOG vernieuwen": "verificatie",
    "Bekijk matches": "collectie",
    "Herinnering sturen": "facturen",
  };

  return (
    <div className="space-y-5">
      <Kop
        boven="Plaat V · ingrepen"
        titel="Wat er nu gedaan moet worden"
        onder="Genummerd naar dringendheid, zoals de handelingen bij een preparaat. Bovenaan wat niet kan wachten."
      />

      {gesorteerd.length === 0 ? (
        <div
          className="rounded-[2px] p-6"
          style={{ background: C.papierLicht, border: `1px dashed ${C.haar}` }}
        >
          <p className="text-[15px]" style={{ ...plaat, color: C.inkt }}>
            Niets te doen
          </p>
          <p className="mt-1 text-[13px]" style={{ color: C.inktZacht }}>
            Er staan geen openstaande handelingen. Dat is een goed teken.
          </p>
        </div>
      ) : (
        <ol className="space-y-3">
          {gesorteerd.map((a, i) => {
            const klaar = gedaan.includes(a.titel);
            const dringend = a.urgentie === "warning";
            const doel = doelen[a.cta];
            return (
              <li key={a.titel}>
                <article
                  className="flex flex-wrap items-start gap-4 rounded-[2px] p-4"
                  style={{
                    background: C.papierLicht,
                    border: `1px solid ${dringend ? `${C.karmijn}55` : C.haar}`,
                  }}
                >
                  <span
                    className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-[15px]"
                    style={{
                      ...plaat,
                      color: dringend ? C.karmijn : C.inkt,
                      border: `1px solid ${dringend ? C.karmijn : C.haar}`,
                    }}
                    aria-hidden="true"
                  >
                    {i + 1}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h2
                        className="text-[17px] leading-tight"
                        style={{ ...plaat, color: C.inkt, fontWeight: 600 }}
                      >
                        {a.titel}
                      </h2>
                      <Merk
                        label={dringend ? "Vraagt aandacht" : "Kans"}
                        Icon={dringend ? AlertTriangle : Layers}
                        nadruk={dringend}
                      />
                    </div>
                    <p className="mt-1 text-[13px] leading-relaxed" style={{ color: C.inktZacht }}>
                      {a.detail}
                    </p>
                    {klaar && (
                      <p
                        className="mt-2 text-[12.5px]"
                        style={{ color: C.karmijn }}
                        aria-live="polite"
                      >
                        Handeling genoteerd in je dossier.
                      </p>
                    )}
                  </div>
                  <div className="flex shrink-0 flex-col gap-1.5">
                    <Knop
                      onClick={() => setGedaan((v) => (v.includes(a.titel) ? v : [...v, a.titel]))}
                    >
                      {a.cta}
                    </Knop>
                    {doel && (
                      <Knop variant="rand" onClick={() => onGa(doel)}>
                        Open het scherm
                      </Knop>
                    )}
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

// ── Scherm VI — Facturen ──────────────────────────────────────────────────────────────
function FacturenScherm() {
  const [herinnerd, setHerinnerd] = useState<string[]>([]);
  const Icoon = (status: string): LucideIcon =>
    status === "Betaald" ? Check : status === "Openstaand" ? Clock : FileText;

  return (
    <div className="space-y-5">
      <Kop
        boven="Plaat VI · register"
        titel="Facturen"
        onder="Het register van uitgaande stukken. Wat openstaat, staat in karmijn — met de reden erbij."
      />

      <div
        className="overflow-x-auto rounded-[2px]"
        style={{ background: C.papierLicht, border: `1px solid ${C.haar}` }}
      >
        <table className="w-full min-w-[640px] border-collapse text-left">
          <caption className="sr-only">Register van facturen met status, bedrag en actie.</caption>
          <thead>
            <tr>
              {["Nr.", "Nummer", "Opdrachtgever", "Datum", "Status", "Bedrag", "Handeling"].map(
                (h) => (
                  <th
                    key={h}
                    scope="col"
                    className="border-b px-3 py-2 text-[10.5px] uppercase tracking-[0.16em]"
                    style={{ ...ui, color: C.inktFlets, borderColor: C.haar }}
                  >
                    {h}
                  </th>
                ),
              )}
            </tr>
          </thead>
          <tbody>
            {FACTUREN.map((f, i) => {
              const open = f.status === "Openstaand";
              const isHerinnerd = herinnerd.includes(f.nr);
              const Icon = Icoon(f.status);
              return (
                <tr key={f.nr} style={{ borderBottom: `1px solid ${C.haarZacht}` }}>
                  <td className="px-3 py-2.5 text-[13px]" style={{ ...plaat, color: C.inktFlets }}>
                    {i + 1}
                  </td>
                  <td className="px-3 py-2.5 text-[12.5px]" style={{ ...ui, color: C.inkt }}>
                    {f.nr}
                  </td>
                  <td className="px-3 py-2.5 text-[13px]" style={{ ...plaat, color: C.inkt }}>
                    {f.klant}
                  </td>
                  <td className="px-3 py-2.5 text-[12.5px]" style={{ ...ui, color: C.inktZacht }}>
                    {f.datum}
                  </td>
                  <td className="px-3 py-2.5">
                    <Merk label={f.status} Icon={Icon} nadruk={open} />
                  </td>
                  <td
                    className="px-3 py-2.5 text-right text-[14px] tabular-nums"
                    style={{ ...ui, color: C.inkt }}
                  >
                    {f.bedrag}
                  </td>
                  <td className="px-3 py-2.5">
                    {open ? (
                      <Knop
                        variant="rand"
                        pressed={isHerinnerd}
                        onClick={() => setHerinnerd((v) => (v.includes(f.nr) ? v : [...v, f.nr]))}
                      >
                        {isHerinnerd ? "Herinnerd" : "Herinneren"}
                      </Knop>
                    ) : (
                      <Knop
                        variant="rand"
                        disabled
                        title={
                          f.status === "Betaald"
                            ? "Deze factuur is voldaan; herinneren is niet nodig."
                            : "Een concept kun je pas versturen als alle regels zijn ingevuld."
                        }
                      >
                        Niet van toepassing
                      </Knop>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <p className="text-[12.5px]" style={{ color: C.inktFlets }}>
        Totaal openstaand € 1.350 · gemiddelde betaaltermijn twaalf dagen.
      </p>
    </div>
  );
}

// ── Scherm VII — Atlas (documenten) ───────────────────────────────────────────────────
function AtlasScherm() {
  const [gekozen, setGekozen] = useState<string>(DOCUMENTEN[0]!.naam);
  const doc = DOCUMENTEN.find((d) => d.naam === gekozen) ?? DOCUMENTEN[0]!;
  const m = credMeta(doc.status);

  return (
    <div className="space-y-5">
      <Kop
        boven="Plaat VII · atlas"
        titel="Documenten"
        onder="De volledige atlas van wat je hebt ingediend. Elk stuk heeft een plaatnummer; het bestand zelf staat versleuteld opgeslagen."
      />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,320px)]">
        <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {DOCUMENTEN.map((d, i) => {
            const dm = credMeta(d.status);
            const actief = d.naam === gekozen;
            return (
              <li key={d.naam}>
                <button
                  type="button"
                  onClick={() => setGekozen(d.naam)}
                  aria-pressed={actief}
                  className="flex h-full w-full flex-col rounded-[2px] p-3 text-left transition-colors focus-visible:outline-none focus-visible:ring-2"
                  style={{
                    background: C.papierLicht,
                    border: `1px solid ${actief ? C.karmijn : C.haar}`,
                    ...ring,
                  }}
                >
                  <span
                    className="mb-2 flex aspect-[3/4] w-full items-center justify-center rounded-[1px]"
                    style={{ border: `1px solid ${C.haarZacht}`, background: C.papier }}
                    aria-hidden="true"
                  >
                    <svg viewBox="0 0 40 52" className="h-full w-full p-2">
                      <rect
                        x={4}
                        y={3}
                        width={32}
                        height={46}
                        fill="none"
                        stroke={C.haar}
                        strokeWidth={0.6}
                      />
                      {[10, 15, 20, 25, 30, 35, 40].map((y) => (
                        <line
                          key={y}
                          x1={9}
                          y1={y}
                          x2={y % 10 === 0 ? 31 : 26}
                          y2={y}
                          stroke={C.haarZacht}
                          strokeWidth={0.8}
                        />
                      ))}
                      <circle
                        cx={28}
                        cy={44}
                        r={4}
                        fill="none"
                        stroke={actief ? C.karmijn : C.haar}
                        strokeWidth={0.8}
                      />
                    </svg>
                  </span>
                  <span
                    className="text-[10px] uppercase tracking-[0.2em]"
                    style={{ ...ui, color: C.inktFlets }}
                  >
                    Plaat {i + 1}
                  </span>
                  <span
                    className="mt-0.5 break-words text-[13px] leading-tight"
                    style={{ ...plaat, color: C.inkt, fontWeight: 600 }}
                  >
                    {d.naam}
                  </span>
                  <span className="mt-1.5">
                    <Merk label={dm.label} Icon={dm.Icon} nadruk={dm.nadruk} />
                  </span>
                </button>
              </li>
            );
          })}
        </ul>

        <Kader titel="Beschrijving" bijschrift={`${doc.type} · ${doc.grootte}`}>
          <dl className="space-y-2">
            {[
              { l: "Bestandsnaam", v: doc.naam },
              { l: "Type", v: doc.type },
              { l: "Grootte", v: doc.grootte },
              { l: "Bijgewerkt", v: doc.bijgewerkt },
              { l: "Status", v: m.label },
            ].map((r) => (
              <div key={r.l} className="flex items-baseline justify-between gap-3">
                <dt
                  className="shrink-0 text-[11px] uppercase tracking-[0.14em]"
                  style={{ ...ui, color: C.inktFlets }}
                >
                  {r.l}
                </dt>
                <dd
                  className="min-w-0 break-words text-right text-[13px]"
                  style={{ color: C.inkt }}
                >
                  {r.v}
                </dd>
              </div>
            ))}
          </dl>
          <p className="mt-3 text-[12.5px] leading-relaxed" style={{ color: C.inktZacht }}>
            Dit document is privé. Alleen jij en de verificateur kunnen het openen; opdrachtgevers
            zien uitsluitend de status.
          </p>
          <div className="mt-3">
            <Knop
              variant="rand"
              disabled
              title="In dit ontwerpconcept staan geen echte documenten achter de platen."
            >
              Voorbeeld openen
            </Knop>
          </div>
        </Kader>
      </div>
    </div>
  );
}

// ── Scherm VIII — Profiel ─────────────────────────────────────────────────────────────
const PROFIEL_BIJSCHRIFTEN: Bijschrift[] = [
  {
    nr: 1,
    deel: "vrucht",
    zijde: "links",
    y: 40,
    kop: "Tarief",
    tekst: "€ 62 per uur · ondergrens € 48.",
  },
  {
    nr: 2,
    deel: "bladLinks",
    zijde: "links",
    y: 74,
    kop: "Standplaats",
    tekst: `${PROFIEL.plaats} · reisbereidheid 25 km.`,
  },
  {
    nr: 3,
    deel: "stengel",
    zijde: "links",
    y: 106,
    kop: "Loopbaan",
    tekst: "Acht jaar wijkverpleging, drie jaar zelfstandig.",
  },
  {
    nr: 4,
    deel: "wortel",
    zijde: "links",
    y: 140,
    kop: "Opleiding",
    tekst: "Hbo-v, geverifieerd op 14 mei.",
  },
  {
    nr: 5,
    deel: "bloem",
    zijde: "rechts",
    y: 34,
    kop: "Vertrouwen",
    tekst: `${PROFIEL.trust} · drie geverifieerde stukken.`,
  },
  {
    nr: 6,
    deel: "knop",
    zijde: "rechts",
    y: 66,
    kop: "In behandeling",
    tekst: "Reanimatie/BLS ligt bij de verificateur.",
  },
  {
    nr: 7,
    deel: "bladRechts",
    zijde: "rechts",
    y: 98,
    kop: "Diensten",
    tekst: "Avond en nacht, geen weekenden.",
  },
  {
    nr: 8,
    deel: "bodem",
    zijde: "rechts",
    y: 130,
    kop: "Zichtbaarheid",
    tekst: "Zichtbaar voor opdrachtgevers binnen je werkgebied.",
  },
];

function ProfielScherm() {
  const [zichtbaar, setZichtbaar] = useState(true);

  return (
    <div className="space-y-5">
      <Kop
        boven="Plaat VIII · specimen"
        titel={PROFIEL.naam}
        onder={`${PROFIEL.rol} · ${PROFIEL.plaats}`}
      />

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(0,320px)]">
        <Plaat
          nummer="VIII"
          titel="Het volledige specimen"
          onderschrift="Zo zien opdrachtgevers je: acht onderdelen, elk terug te voeren op een geverifieerd gegeven."
          bijschriften={PROFIEL_BIJSCHRIFTEN}
          ankers={PLANT_ANKERS}
          tekening={(actief, binding) => <PreparaatPlant actief={actief} binding={binding} />}
        />

        <div className="space-y-4">
          <Kader titel="Zichtbaarheid" bijschrift="wie ziet dit specimen">
            <p className="text-[13px] leading-relaxed" style={{ color: C.inktZacht }}>
              {zichtbaar
                ? "Je profiel is zichtbaar voor opdrachtgevers binnen je werkgebied."
                : "Je profiel staat op onzichtbaar. Je ontvangt geen nieuwe uitnodigingen."}
            </p>
            <div className="mt-3">
              <Knop variant="rand" pressed={!zichtbaar} onClick={() => setZichtbaar((v) => !v)}>
                {zichtbaar ? "Op onzichtbaar zetten" : "Weer zichtbaar maken"}
              </Knop>
            </div>
          </Kader>

          <Kader titel="Samenvatting" bijschrift="in cijfers">
            <dl className="space-y-2">
              {[
                {
                  l: "Geverifieerde stukken",
                  v: `${CREDENTIALS.filter((c) => c.status === "VERIFIED").length} van ${CREDENTIALS.length}`,
                },
                { l: "Gemiddelde match", v: "92%" },
                { l: "Open reacties", v: "7" },
                { l: "Omzet deze maand", v: "€ 8.240" },
              ].map((r) => (
                <div key={r.l} className="flex items-baseline justify-between gap-3">
                  <dt className="min-w-0 text-[12.5px]" style={{ color: C.inktZacht }}>
                    {r.l}
                  </dt>
                  <dd className="shrink-0 text-[15px]" style={{ ...plaat, color: C.inkt }}>
                    {r.v}
                  </dd>
                </div>
              ))}
            </dl>
          </Kader>
        </div>
      </div>
    </div>
  );
}

// ── Root ───────────────────────────────────────────────────────────────────────────────
export function Concept560() {
  const [scherm, setScherm] = useState<Scherm>("situs");
  const [opdracht, setOpdracht] = useState<Opdracht>(OPDRACHTEN[0]!);

  return (
    <div
      className="min-h-screen w-full overflow-x-hidden antialiased"
      style={{ background: C.papier, color: C.inkt, ...ui }}
    >
      <style>{`
        .anat-deel { cursor: pointer; outline: none; }
        .anat-deel:focus-visible { outline: 1.5px dashed ${C.karmijn}; outline-offset: 2px; }
        .anat-marge:focus-visible { outline: 1px dashed ${C.karmijn}; outline-offset: 1px; }
        @keyframes anatDraai { to { transform: rotate(360deg); } }
        .anat-draai { animation: anatDraai 1.4s linear infinite; }
        @media (prefers-reduced-motion: reduce) { .anat-draai { animation: none !important; } }
      `}</style>

      <header className="border-b" style={{ background: C.papierLicht, borderColor: C.haar }}>
        <div className="mx-auto flex max-w-[1500px] flex-wrap items-center justify-between gap-3 px-4 py-3 sm:px-6">
          <div className="flex min-w-0 items-center gap-3">
            <svg viewBox="0 0 32 32" className="h-9 w-9 shrink-0" aria-hidden="true">
              <circle cx={16} cy={16} r={14} fill="none" stroke={C.haar} strokeWidth={0.8} />
              <path d="M16,27 C15,20 17,14 16,7" fill="none" stroke={C.inkt} strokeWidth={0.9} />
              <path
                d="M16,17 C11,13 7,13 5,16 C8,20 13,20 16,17 Z"
                fill="none"
                stroke={C.inkt}
                strokeWidth={0.8}
              />
              <path
                d="M16,13 C21,9 25,9 27,12 C24,16 19,16 16,13 Z"
                fill="none"
                stroke={C.karmijn}
                strokeWidth={0.8}
              />
            </svg>
            <div className="min-w-0">
              <h1 className="text-[19px] leading-tight" style={{ ...plaat, color: C.inkt }}>
                Anatomie
              </h1>
              <p className="truncate text-[11px]" style={{ color: C.inktFlets }}>
                Atlas van de zelfstandige praktijk · uitgave 2025
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span
              className="hidden rounded-[2px] px-2.5 py-1 text-[11.5px] sm:inline-flex"
              style={{ border: `1px solid ${C.haar}`, color: C.inktZacht }}
            >
              {PROFIEL.trust}
            </span>
            <span
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-[12px]"
              style={{ ...plaat, border: `1px solid ${C.inktZacht}`, color: C.inkt }}
              aria-hidden="true"
            >
              {PROFIEL.initialen}
            </span>
          </div>
        </div>

        <nav aria-label="Platen" className="mx-auto max-w-[1500px] px-4 sm:px-6">
          <div role="tablist" aria-label="Platen" className="flex gap-1 overflow-x-auto pb-2">
            {SCHERMEN.map((s) => {
              const actief = s.key === scherm;
              return (
                <button
                  key={s.key}
                  type="button"
                  role="tab"
                  id={`anat-tab-${s.key}`}
                  aria-selected={actief}
                  aria-controls={`anat-paneel-${s.key}`}
                  tabIndex={actief ? 0 : -1}
                  onClick={() => setScherm(s.key)}
                  className="shrink-0 px-3 py-1.5 text-left transition-colors focus-visible:outline-none focus-visible:ring-2"
                  style={{
                    borderBottom: `2px solid ${actief ? C.karmijn : "transparent"}`,
                    ...ring,
                  }}
                >
                  <span
                    className="block text-[9.5px] uppercase tracking-[0.2em]"
                    style={{ color: actief ? C.karmijn : C.inktFlets }}
                  >
                    Plaat {s.plaat}
                  </span>
                  <span
                    className="block text-[14px] leading-tight"
                    style={{
                      ...plaat,
                      color: actief ? C.inkt : C.inktZacht,
                      fontWeight: actief ? 600 : 400,
                    }}
                  >
                    {s.label}
                  </span>
                </button>
              );
            })}
          </div>
        </nav>
      </header>

      <main className="mx-auto max-w-[1500px] px-4 py-6 sm:px-6 sm:py-8">
        {SCHERMEN.map((s) => (
          <div
            key={s.key}
            role="tabpanel"
            id={`anat-paneel-${s.key}`}
            aria-labelledby={`anat-tab-${s.key}`}
            hidden={s.key !== scherm}
          >
            {s.key === scherm && (
              <>
                {s.key === "situs" && <SitusScherm onGa={setScherm} />}
                {s.key === "collectie" && (
                  <CollectieScherm
                    onOpen={(o) => {
                      setOpdracht(o);
                      setScherm("match");
                    }}
                  />
                )}
                {s.key === "match" && (
                  <MatchScherm opdracht={opdracht} onTerug={() => setScherm("collectie")} />
                )}
                {s.key === "verificatie" && <VerificatieScherm onGa={setScherm} />}
                {s.key === "ingrepen" && <IngrepenScherm onGa={setScherm} />}
                {s.key === "facturen" && <FacturenScherm />}
                {s.key === "atlas" && <AtlasScherm />}
                {s.key === "profiel" && <ProfielScherm />}
              </>
            )}
          </div>
        ))}
      </main>

      <footer
        className="mx-auto max-w-[1500px] border-t px-4 py-4 text-[11.5px] sm:px-6"
        style={{ borderColor: C.haarZacht, color: C.inktFlets }}
      >
        Getekend naar de gegevens van het platform · elk bijschrift verwijst naar het onderdeel
        waarop het oordeel rust.
      </footer>
    </div>
  );
}
