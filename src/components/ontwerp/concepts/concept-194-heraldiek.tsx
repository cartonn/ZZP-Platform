"use client";

// Concept 194 — "Heraldiek" · wapenschild-vertrouwenstaal. Verificatie en vertrouwen worden
// uitgedrukt als heraldische wapenschilden: escutcheon-silhouetten (SVG), gedeelde velden
// (per pale / per fess), een chief-band, fijne GOUDEN haarlijntjes en een rustig diep palet —
// bordeaux/burgundy + goud + middernachtblauw op perkament-crème. Een geverifieerd certificaat is
// een BEZEGELD wapen. Status nooit op kleur alleen: altijd label + icoon + schildvorm/variant.
// Serif-display met small-caps-gevoel (uppercase tracking). Deterministisch — geen random/Date.
// UI Nederlands. Fonts: Fraunces (display/serif) + Libre Franklin (tekst) + IBM Plex Mono (cijfers).

import { useState } from "react";
import {
  ArrowRight,
  ArrowLeft,
  Search,
  MapPin,
  Coins,
  Clock,
  CalendarDays,
  Check,
  X,
  Plus,
  ChevronRight,
  RefreshCw,
  TriangleAlert,
  FileText,
  Star,
  Crown,
  Shield,
  ShieldCheck,
  ShieldAlert,
  ShieldX,
  BadgeCheck,
  Award,
  Scroll,
  Feather,
  type LucideIcon,
} from "lucide-react";
import {
  SCREENS,
  KPIS,
  OPDRACHTEN,
  CREDENTIALS,
  ACTIES,
  FACTUREN,
  PROFIEL,
  NAV,
  BERICHTEN,
  DOCUMENTEN,
  type ScreenKey,
  type CredStatus,
  type Opdracht,
} from "./mock";

// ── Palet — diep heraldisch: bordeaux + goud + middernachtblauw op perkament-crème.
//    Fijne goud-haarlijntjes dragen de structuur; kleuren zijn verzadigd maar rustig. ──
const C = {
  parchment: "#efe6d1", // perkament-crème basis
  parchmentHi: "#f6efdd", // opgelicht perkament (kaart)
  parchmentDim: "#e5d8ba", // gedempt perkament / hover
  ink: "#241a10", // diepe inkt (primaire tekst)
  inkSoft: "#5b4c37", // secundaire tekst
  inkFaint: "#8b785a", // labels
  bordeaux: "#6f121f", // wapen-bordeaux (accent)
  bordeauxDeep: "#4c0b15", // dieper bordeaux
  bordeauxSoft: "#8f2733", // lichter bordeaux
  gold: "#b3862c", // goud (haarlijnen, ordinaries)
  goldHi: "#d8b356", // helder goud (zegel, nadruk)
  goldDeep: "#856015", // diep goud
  midnight: "#1b2846", // middernachtblauw (tweede veld)
  midnightDeep: "#111c33", // dieper middernacht
  line: "#d3c19a", // fijne goud-getinte haarlijn op perkament
  onDark: "#f3ead4", // tekst op donker veld
};

const display = { fontFamily: "var(--font-lab-fraunces)" };
const bodyF = { fontFamily: "var(--font-lab-franklin)" };
const mono = { fontFamily: "var(--font-lab-plex-mono)" };

// Klassiek escutcheon (heater-schild) silhouet — één gedeelde padvorm door het hele concept.
const SHIELD_PATH = "M8 6 H92 V56 C92 90 60 109 50 115 C40 109 8 90 8 56 Z";

// ── Escutcheon — het wapenschild-primitief. Ondersteunt een chief-band, een pale-deling
//    (twee velden), goud-arcering (hatch) voor "verloopt" en een bezegeld goudrand-gevoel. ──
function Escutcheon({
  size = 60,
  field,
  field2,
  stroke,
  strokeWidth = 3.2,
  chief,
  hatch = false,
  hatchId,
  children,
  className = "",
}: {
  size?: number;
  field: string;
  field2?: string; // rechterhelft bij per-pale-deling
  stroke: string;
  strokeWidth?: number;
  chief?: string; // kleur van de chief-band (bovenrand)
  hatch?: boolean; // diagonale goud-arcering over het veld
  hatchId?: string; // uniek patroon-id (verplicht als hatch)
  children?: React.ReactNode;
  className?: string;
}) {
  const w = size;
  const h = size * 1.2;
  const clipId = `esc-clip-${hatchId ?? Math.round(size)}-${field.replace("#", "")}`;
  return (
    <span
      className={`relative inline-flex shrink-0 items-center justify-center ${className}`}
      style={{ width: w, height: h }}
      aria-hidden="true"
    >
      <svg
        viewBox="0 0 100 120"
        width={w}
        height={h}
        className="absolute inset-0"
        style={{ filter: "drop-shadow(0 4px 8px rgba(30,20,10,0.22))" }}
      >
        <defs>
          <clipPath id={clipId}>
            <path d={SHIELD_PATH} />
          </clipPath>
          {hatch && hatchId && (
            <pattern
              id={hatchId}
              width="9"
              height="9"
              patternUnits="userSpaceOnUse"
              patternTransform="rotate(45)"
            >
              <rect width="9" height="9" fill={field} />
              <line x1="0" y1="0" x2="0" y2="9" stroke={C.goldHi} strokeWidth="2.4" />
            </pattern>
          )}
        </defs>
        <g clipPath={`url(#${clipId})`}>
          {/* Basisveld (of linkerhelft bij deling) */}
          <rect x="0" y="0" width={field2 ? "50" : "100"} height="120" fill={field} />
          {field2 && <rect x="50" y="0" width="50" height="120" fill={field2} />}
          {/* Goud-arcering voor "verloopt binnenkort" */}
          {hatch && hatchId && (
            <rect x="0" y="0" width="100" height="120" fill={`url(#${hatchId})`} />
          )}
          {/* Chief — bovenband met dunne goudscheiding */}
          {chief && (
            <>
              <rect x="0" y="0" width="100" height="26" fill={chief} />
              <line x1="0" y1="26" x2="100" y2="26" stroke={C.gold} strokeWidth="2" />
            </>
          )}
        </g>
        {/* Buitenrand — de "bezegeling": fijne dubbele goudlijn */}
        <path d={SHIELD_PATH} fill="none" stroke={stroke} strokeWidth={strokeWidth} />
        <path
          d={SHIELD_PATH}
          fill="none"
          stroke={stroke}
          strokeWidth="1"
          transform="translate(50 61) scale(0.9) translate(-50 -61)"
          opacity="0.55"
        />
      </svg>
      {children && (
        <span className="relative z-10 flex items-center justify-center">{children}</span>
      )}
    </span>
  );
}

// ── Status-model — heraldisch. Elke credential-status is een eigen wapen met een eigen VELD,
//    charge (icoon) en label. variant bepaalt de schildvorm-taal, nooit kleur-alleen. ──
type Variant = "sealed" | "plain" | "hatched" | "voided";
type StatusStyle = {
  label: string;
  short: string;
  Icon: LucideIcon;
  field: string; // schildveld
  field2?: string; // tweede helft (per pale)
  chief?: string;
  hatch: boolean;
  charge: string; // kleur van de charge (icoon)
  border: string;
  chipBg: string;
  chipFg: string;
  variant: Variant;
};
function credMeta(s: CredStatus): StatusStyle {
  switch (s) {
    case "VERIFIED":
      // Bezegeld wapen — middernacht-veld, gouden chief, goudrand. Het hoogste vertrouwen.
      return {
        label: "Geverifieerd",
        short: "Bezegeld",
        Icon: ShieldCheck,
        field: C.midnight,
        chief: C.bordeaux,
        hatch: false,
        charge: C.goldHi,
        border: C.goldHi,
        chipBg: C.midnight,
        chipFg: C.goldHi,
        variant: "sealed",
      };
    case "SUBMITTED":
      // Effen perkament-veld, gouden rand — ingediend, in beoordeling. Rustig, nog niet bezegeld.
      return {
        label: "In beoordeling",
        short: "Ingediend",
        Icon: Clock,
        field: C.parchmentDim,
        hatch: false,
        charge: C.bordeaux,
        border: C.gold,
        chipBg: "transparent",
        chipFg: C.inkSoft,
        variant: "plain",
      };
    case "EXPIRING":
      // Goud-gearceerd bordeaux-veld — vraagt aandacht via arcering + waarschuwingsicoon.
      return {
        label: "Verloopt binnenkort",
        short: "Verloopt",
        Icon: ShieldAlert,
        field: C.bordeaux,
        hatch: true,
        charge: C.onDark,
        border: C.goldHi,
        chipBg: "rgba(111,18,31,0.10)",
        chipFg: C.bordeaux,
        variant: "hatched",
      };
    case "REJECTED":
      // Gedeeld veld (per pale) bordeaux/middernacht — afgewezen; zwaarste taal + kruis.
      return {
        label: "Afgewezen",
        short: "Afgewezen",
        Icon: ShieldX,
        field: C.bordeauxDeep,
        field2: C.midnightDeep,
        hatch: false,
        charge: C.onDark,
        border: C.bordeauxSoft,
        chipBg: C.bordeauxDeep,
        chipFg: C.onDark,
        variant: "voided",
      };
  }
}

function StatusTag({ status }: { status: CredStatus }) {
  const m = credMeta(status);
  const outlined = m.chipBg === "transparent" || m.variant === "hatched";
  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-sm px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.08em]"
      style={{
        ...bodyF,
        background: m.chipBg,
        color: m.chipFg,
        border: `1px solid ${outlined ? m.border : "transparent"}`,
      }}
    >
      <m.Icon size={12} strokeWidth={2.2} aria-hidden="true" />
      {m.label}
    </span>
  );
}

// ── Kaart — perkament-oppervlak met fijne goud-haarlijn; bij hover licht een goudrand op. ──
function Card({
  children,
  className = "",
  style,
  interactive = false,
}: {
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
  interactive?: boolean;
}) {
  return (
    <div
      className={`group/card relative overflow-hidden rounded-md ${
        interactive
          ? "transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_16px_38px_-22px_rgba(111,18,31,0.5)]"
          : ""
      } ${className}`}
      style={{ background: C.parchmentHi, boxShadow: `inset 0 0 0 1px ${C.line}`, ...style }}
    >
      {interactive && (
        <span
          className="pointer-events-none absolute inset-x-0 top-0 h-0.5 opacity-0 transition-opacity duration-300 group-hover/card:opacity-100"
          style={{ background: `linear-gradient(90deg, transparent, ${C.gold}, transparent)` }}
          aria-hidden="true"
        />
      )}
      {children}
    </div>
  );
}

// Sectie-kop — klein schild-glyph + serif-titel met small-caps-gevoel + goud-liniaal.
function SectionHead({ title, sub, Icon }: { title: string; sub?: string; Icon: LucideIcon }) {
  return (
    <div className="flex items-center gap-3">
      <span
        className="flex h-10 w-9 shrink-0 items-center justify-center"
        style={{
          background: C.midnight,
          clipPath: "polygon(0 0, 100% 0, 100% 62%, 50% 100%, 0 62%)",
          boxShadow: `inset 0 0 0 1.5px ${C.gold}`,
        }}
        aria-hidden="true"
      >
        <Icon size={16} strokeWidth={1.9} style={{ color: C.goldHi }} />
      </span>
      <div className="min-w-0">
        <h2
          className="text-[21px] font-medium leading-none tracking-[0.01em]"
          style={{ ...display, color: C.ink }}
        >
          {title}
        </h2>
        {sub && (
          <p
            className="mt-1 text-[11px] uppercase tracking-[0.12em]"
            style={{ ...mono, color: C.inkFaint }}
          >
            {sub}
          </p>
        )}
      </div>
      <span
        className="ml-2 hidden h-px flex-1 sm:block"
        style={{ background: `linear-gradient(90deg, ${C.gold}, transparent)` }}
        aria-hidden="true"
      />
    </div>
  );
}

function Meta({ Icon, value }: { Icon: LucideIcon; value: string }) {
  return (
    <div className="flex items-center gap-1.5" style={{ color: C.inkSoft }}>
      <Icon size={13} strokeWidth={1.9} style={{ color: C.bordeaux }} aria-hidden="true" />
      <span className="truncate" style={bodyF}>
        {value}
      </span>
    </div>
  );
}

// Match-wapen — het match-percentage als een gekroond schild met mono-cijfer.
function MatchCrest({ value, size = 58 }: { value: number; size?: number }) {
  return (
    <span
      className="relative inline-flex shrink-0 flex-col items-center"
      style={{ width: size }}
      aria-hidden="true"
    >
      <Escutcheon
        size={size}
        field={C.midnight}
        chief={C.bordeaux}
        stroke={C.goldHi}
        hatchId={`m${value}`}
      >
        <span className="mt-2 flex flex-col items-center leading-none">
          <span
            className="text-[15px] font-semibold tabular-nums"
            style={{ ...mono, color: C.goldHi }}
          >
            {value}
          </span>
          <span
            className="mt-0.5 text-[6.5px] font-semibold uppercase tracking-[0.16em]"
            style={{ ...mono, color: C.onDark }}
          >
            match
          </span>
        </span>
      </Escutcheon>
    </span>
  );
}

// Mini staaf-spark — goud-ladder op perkament, laatste staaf bordeaux.
function Spark({ data }: { data: number[] }) {
  const max = Math.max(...data);
  return (
    <div className="flex h-8 items-end gap-[3px]" aria-hidden="true">
      {data.map((v, i) => (
        <span
          key={i}
          className="flex-1 rounded-t-[1px]"
          style={{
            height: `${Math.max(14, (v / max) * 100)}%`,
            background: i === data.length - 1 ? C.bordeaux : "rgba(179,134,44,0.42)",
          }}
        />
      ))}
    </div>
  );
}

// ── Root ─────────────────────────────────────────────────────────────────────────
export function Concept194() {
  const [screen, setScreen] = useState<ScreenKey>("dashboard");
  const active = OPDRACHTEN[0] as Opdracht;

  return (
    <div
      className="relative min-h-screen w-full overflow-x-hidden antialiased"
      style={{ ...bodyF, background: C.parchment, color: C.ink }}
    >
      {/* Perkament-textuur — fijne, deterministische diagonale goudgloed */}
      <div
        className="pointer-events-none fixed inset-0 z-0"
        style={{
          background: `radial-gradient(120% 55% at 50% -8%, rgba(179,134,44,0.12), transparent 60%)`,
        }}
        aria-hidden="true"
      />

      <div className="relative z-10">
        {/* Kop — heraldische banner op middernacht-veld met gouden onderrand */}
        <header className="relative overflow-hidden" style={{ background: C.midnightDeep }}>
          <div
            className="pointer-events-none absolute inset-x-0 bottom-0 h-0.5"
            style={{
              background: `linear-gradient(90deg, ${C.bordeaux}, ${C.gold}, ${C.bordeaux})`,
            }}
            aria-hidden="true"
          />
          <div className="relative mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-4 py-5 md:px-8">
            <div className="flex items-center gap-3.5">
              <Escutcheon
                size={44}
                field={C.bordeaux}
                chief={C.midnight}
                stroke={C.goldHi}
                hatchId="logo"
              >
                <Crown size={17} strokeWidth={2} style={{ color: C.goldHi }} aria-hidden="true" />
              </Escutcheon>
              <div className="leading-tight">
                <div
                  className="text-[10px] font-semibold uppercase tracking-[0.36em]"
                  style={{ ...mono, color: C.goldHi }}
                >
                  Heraldiek
                </div>
                <div
                  className="text-[25px] font-medium leading-none"
                  style={{ ...display, color: C.onDark }}
                >
                  Wapenhof
                </div>
                <div
                  className="mt-1 text-[9.5px] uppercase tracking-[0.18em]"
                  style={{ ...mono, color: "rgba(243,234,212,0.6)" }}
                >
                  Match · Bezegeling · Omzet
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2.5">
              <span
                className="hidden items-center gap-1.5 rounded-sm px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.08em] sm:inline-flex"
                style={{
                  ...bodyF,
                  background: "rgba(216,179,86,0.14)",
                  color: C.goldHi,
                  border: `1px solid ${C.goldDeep}`,
                }}
              >
                <BadgeCheck size={12} strokeWidth={2} aria-hidden="true" /> {PROFIEL.trust}
              </span>
              <span
                className="flex h-10 w-10 items-center justify-center rounded-sm text-[12px] font-bold"
                style={{
                  ...mono,
                  background: C.bordeaux,
                  color: C.goldHi,
                  border: `1px solid ${C.gold}`,
                }}
                aria-hidden="true"
              >
                {PROFIEL.initialen}
              </span>
            </div>
          </div>

          {/* Scherm-switcher — wapen-tabs met gouden onderstreep */}
          <nav
            className="relative mx-auto flex max-w-6xl items-center gap-1 overflow-x-auto px-4 pb-0 md:px-8"
            aria-label="Schermen"
          >
            {SCREENS.map((s) => {
              const on = s.key === screen;
              return (
                <button
                  key={s.key}
                  onClick={() => setScreen(s.key)}
                  aria-current={on ? "page" : undefined}
                  className="relative shrink-0 px-3.5 py-2.5 text-[12.5px] font-semibold uppercase tracking-[0.06em] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset"
                  style={{
                    ...bodyF,
                    color: on ? C.goldHi : "rgba(243,234,212,0.62)",
                    ["--tw-ring-color" as string]: C.gold,
                  }}
                >
                  {s.label}
                  <span
                    className="absolute inset-x-2 bottom-0 h-0.5 rounded-full transition-opacity"
                    style={{ background: C.goldHi, opacity: on ? 1 : 0 }}
                    aria-hidden="true"
                  />
                </button>
              );
            })}
          </nav>
        </header>

        <main className="mx-auto max-w-6xl px-4 py-6 md:px-8 md:py-8">
          {screen === "dashboard" && (
            <Dashboard onOpen={() => setScreen("opdracht")} onActies={() => setScreen("acties")} />
          )}
          {screen === "marktplaats" && <Marktplaats onOpen={() => setScreen("opdracht")} />}
          {screen === "opdracht" && (
            <OpdrachtDetail opdracht={active} onBack={() => setScreen("marktplaats")} />
          )}
          {screen === "verificatie" && <Verificatie />}
          {screen === "acties" && <Acties />}
          {screen === "facturen" && <Facturen />}
        </main>

        <footer className="relative mx-auto max-w-6xl px-4 pb-10 md:px-8">
          <div
            className="flex items-center justify-center gap-2 border-t pt-6 text-[11px] uppercase tracking-[0.1em]"
            style={{ ...mono, borderColor: C.line, color: C.inkFaint }}
          >
            <Feather size={12} aria-hidden="true" /> Elk geverifieerd certificaat is een bezegeld
            wapen — vertrouwen als heraldiek.
          </div>
        </footer>
      </div>
    </div>
  );
}

// ── Dashboard ──────────────────────────────────────────────────────────────────
function Dashboard({ onOpen, onActies }: { onOpen: () => void; onActies: () => void }) {
  const verified = CREDENTIALS.filter((c) => c.status === "VERIFIED").length;
  const dek = Math.round((verified / CREDENTIALS.length) * 100);
  const warn = (ACTIES.find((a) => a.urgentie === "warning") ??
    ACTIES[0]) as (typeof ACTIES)[number];

  return (
    <div className="space-y-8">
      {/* Hero — wapen-masthead op middernacht met perkament-charge */}
      <Card className="relative" style={{ background: C.midnightDeep }}>
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            background: `radial-gradient(90% 130% at 100% 0%, rgba(111,18,31,0.55), transparent 55%)`,
          }}
          aria-hidden="true"
        />
        <div className="relative flex flex-wrap items-center gap-8 p-6 sm:p-9">
          <div className="min-w-0 max-w-xl flex-1">
            <span
              className="inline-flex items-center gap-1.5 rounded-sm px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.1em]"
              style={{
                ...bodyF,
                background: "rgba(216,179,86,0.14)",
                color: C.goldHi,
                border: `1px solid ${C.goldDeep}`,
              }}
            >
              <Crown size={12} strokeWidth={2.2} aria-hidden="true" /> {PROFIEL.rol}
            </span>
            <h1
              className="mt-4 text-[32px] font-medium leading-[1.08] sm:text-[44px]"
              style={{ ...display, color: C.onDark }}
            >
              Drie matches boven 85%. Je wapen staat fier.
            </h1>
            <p
              className="mt-3 max-w-lg text-[14px] leading-relaxed"
              style={{ ...bodyF, color: "rgba(243,234,212,0.78)" }}
            >
              Eén ding vraagt aandacht: je VOG verloopt binnenkort. Vernieuw het en houd je schild
              onberispelijk bezegeld.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <button
                onClick={onOpen}
                className="inline-flex items-center gap-2 rounded-sm px-5 py-2.5 text-[12.5px] font-semibold uppercase tracking-[0.06em] transition-transform hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
                style={{
                  ...bodyF,
                  background: C.goldHi,
                  color: C.midnightDeep,
                  ["--tw-ring-color" as string]: C.goldHi,
                  ["--tw-ring-offset-color" as string]: C.midnightDeep,
                }}
              >
                Bekijk matches <ArrowRight size={15} aria-hidden="true" />
              </button>
              <button
                onClick={onActies}
                className="inline-flex items-center gap-2 rounded-sm px-5 py-2.5 text-[12.5px] font-semibold uppercase tracking-[0.06em] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
                style={{
                  ...bodyF,
                  background: "transparent",
                  color: C.onDark,
                  border: `1px solid ${C.gold}`,
                  ["--tw-ring-color" as string]: C.gold,
                  ["--tw-ring-offset-color" as string]: C.midnightDeep,
                }}
              >
                <TriangleAlert
                  size={14}
                  strokeWidth={2.2}
                  style={{ color: C.goldHi }}
                  aria-hidden="true"
                />{" "}
                Los actie op
              </button>
            </div>
          </div>
          <Escutcheon
            size={116}
            field={C.midnight}
            field2={C.bordeaux}
            chief={C.bordeauxDeep}
            stroke={C.goldHi}
            hatchId="hero"
            className="hidden sm:inline-flex"
          >
            <span className="mt-2.5 flex flex-col items-center leading-none">
              <span
                className="text-[30px] font-semibold tabular-nums"
                style={{ ...mono, color: C.goldHi }}
              >
                {dek}
                <span className="text-[15px]">%</span>
              </span>
              <span
                className="mt-1 text-[8px] font-semibold uppercase tracking-[0.16em]"
                style={{ ...mono, color: C.onDark }}
              >
                bezegeld
              </span>
            </span>
          </Escutcheon>
        </div>
      </Card>

      {/* KPI-kaarten */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {KPIS.map((k) => (
          <Card key={k.label} interactive className="p-4">
            <div className="flex items-center justify-between">
              <span
                className="text-[10.5px] font-medium uppercase tracking-[0.08em]"
                style={{ ...bodyF, color: C.inkFaint }}
              >
                {k.label}
              </span>
              <span
                className="inline-flex items-center gap-0.5 rounded-sm px-1.5 py-0.5 text-[10px] font-semibold"
                style={{
                  ...mono,
                  background: k.up ? "rgba(111,18,31,0.10)" : C.parchmentDim,
                  color: k.up ? C.bordeaux : C.inkSoft,
                  border: `1px solid ${k.up ? C.bordeauxSoft + "66" : C.line}`,
                }}
              >
                {k.trend}
              </span>
            </div>
            <div
              className="mt-2 text-[27px] font-semibold tabular-nums leading-none"
              style={{ ...mono, color: C.ink }}
            >
              {k.value}
            </div>
            <div className="mt-3">
              <Spark data={k.spark} />
            </div>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-[1.6fr_1fr]">
        {/* Matches */}
        <section className="space-y-4">
          <SectionHead
            title="Aanbevolen matches"
            sub="Op match-percentage gerangschikt"
            Icon={Shield}
          />
          <div className="space-y-3">
            {OPDRACHTEN.map((o) => (
              <Card key={o.id} interactive>
                <button
                  onClick={onOpen}
                  className="relative flex w-full items-center gap-4 p-4 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset"
                  style={{ ["--tw-ring-color" as string]: C.gold }}
                >
                  <MatchCrest value={o.match} />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <div
                          className="truncate text-[16px] font-medium"
                          style={{ ...display, color: C.ink }}
                        >
                          {o.titel}
                        </div>
                        <div
                          className="mt-0.5 truncate text-[12.5px]"
                          style={{ ...bodyF, color: C.inkSoft }}
                        >
                          {o.opdrachtgever} · {o.plaats} · {o.tarief}
                        </div>
                      </div>
                      <ChevronRight
                        size={18}
                        className="mt-0.5 shrink-0"
                        style={{ color: C.inkFaint }}
                        aria-hidden="true"
                      />
                    </div>
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {o.redenen.plus.slice(0, 2).map((r) => (
                        <span
                          key={r}
                          className="inline-flex items-center gap-1 rounded-sm px-2 py-0.5 text-[11px] font-medium"
                          style={{ ...bodyF, background: C.parchmentDim, color: C.inkSoft }}
                        >
                          <Check
                            size={11}
                            strokeWidth={2.6}
                            style={{ color: C.bordeaux }}
                            aria-hidden="true"
                          />{" "}
                          {r}
                        </span>
                      ))}
                    </div>
                  </div>
                </button>
              </Card>
            ))}
          </div>
        </section>

        {/* Rechterkolom */}
        <section className="space-y-4">
          <SectionHead title="Vertrouwen" sub="Certificaat-bezegeling" Icon={ShieldCheck} />
          <Card className="p-5">
            <div className="flex items-center gap-5">
              <Escutcheon
                size={92}
                field={C.midnight}
                chief={C.bordeaux}
                stroke={C.goldHi}
                hatchId="trust"
              >
                <span className="mt-2 flex flex-col items-center leading-none">
                  <span
                    className="text-[24px] font-semibold tabular-nums"
                    style={{ ...mono, color: C.goldHi }}
                  >
                    {dek}
                    <span className="text-[12px]">%</span>
                  </span>
                </span>
              </Escutcheon>
              <div>
                <StatusTag status="VERIFIED" />
                <p
                  className="mt-2 text-[12.5px] leading-relaxed"
                  style={{ ...bodyF, color: C.inkSoft }}
                >
                  {verified}/{CREDENTIALS.length} certificaten bezegeld. Opdrachtgevers zien alleen
                  geverifieerde wapens.
                </p>
              </div>
            </div>
          </Card>

          {/* Prioriteit — bordeaux-vlak */}
          <Card className="relative" style={{ background: C.bordeaux, boxShadow: "none" }}>
            <div
              className="pointer-events-none absolute inset-0"
              style={{
                background: `radial-gradient(80% 120% at 100% 0%, rgba(216,179,86,0.22), transparent 55%)`,
              }}
              aria-hidden="true"
            />
            <div className="relative p-5">
              <span
                className="inline-flex items-center gap-1.5 rounded-sm px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.1em]"
                style={{ ...mono, background: "rgba(17,28,51,0.28)", color: C.goldHi }}
              >
                <TriangleAlert size={11} strokeWidth={2.4} aria-hidden="true" /> Prioriteit
              </span>
              <h3
                className="mt-2.5 text-[21px] font-medium leading-tight"
                style={{ ...display, color: C.onDark }}
              >
                {warn.titel}
              </h3>
              <p
                className="mt-1.5 text-[12.5px] leading-relaxed"
                style={{ ...bodyF, color: "rgba(243,234,212,0.82)" }}
              >
                {warn.detail}
              </p>
              <button
                onClick={onActies}
                className="mt-4 inline-flex items-center gap-2 rounded-sm px-4 py-2 text-[12px] font-semibold uppercase tracking-[0.06em] transition-transform hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
                style={{
                  ...bodyF,
                  background: C.goldHi,
                  color: C.bordeauxDeep,
                  ["--tw-ring-color" as string]: C.goldHi,
                  ["--tw-ring-offset-color" as string]: C.bordeaux,
                }}
              >
                {warn.cta} <ArrowRight size={13} aria-hidden="true" />
              </button>
            </div>
          </Card>

          {/* Berichten-preview */}
          <Card className="p-4">
            <div className="mb-2 flex items-center gap-2">
              <Feather size={14} style={{ color: C.bordeaux }} aria-hidden="true" />
              <span
                className="text-[11px] font-semibold uppercase tracking-[0.1em]"
                style={{ ...mono, color: C.inkFaint }}
              >
                Laatste bericht
              </span>
            </div>
            <div className="flex items-center gap-3">
              <span
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-sm text-[11px] font-bold"
                style={{ ...mono, background: C.midnight, color: C.goldHi }}
                aria-hidden="true"
              >
                {BERICHTEN[0]!.initialen}
              </span>
              <div className="min-w-0">
                <div
                  className="truncate text-[13px] font-medium"
                  style={{ ...bodyF, color: C.ink }}
                >
                  {BERICHTEN[0]!.van}
                </div>
                <p className="mt-0.5 truncate text-[12px]" style={{ ...bodyF, color: C.inkSoft }}>
                  {BERICHTEN[0]!.preview}
                </p>
              </div>
            </div>
          </Card>
        </section>
      </div>
    </div>
  );
}

// ── Marktplaats — met zoek-empty-state, skeleton-loading én foutstrook ─────────────
function Marktplaats({ onOpen }: { onOpen: () => void }) {
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(true);

  const filtered = OPDRACHTEN.filter(
    (o) =>
      o.titel.toLowerCase().includes(q.toLowerCase()) ||
      o.plaats.toLowerCase().includes(q.toLowerCase()) ||
      o.opdrachtgever.toLowerCase().includes(q.toLowerCase()),
  );

  const refresh = () => {
    setLoading(true);
    setTimeout(() => setLoading(false), 650);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <SectionHead title="Marktplaats" sub="Open opdrachten" Icon={Search} />
        <div className="flex items-center gap-2">
          <div
            className="flex items-center gap-2 rounded-sm px-3.5 py-2"
            style={{ background: C.parchmentHi, boxShadow: `inset 0 0 0 1px ${C.line}` }}
          >
            <Search size={15} style={{ color: C.bordeaux }} aria-hidden="true" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Zoek opdracht of plaats…"
              aria-label="Opdrachten zoeken"
              className="w-40 bg-transparent text-[12.5px] outline-none placeholder:opacity-50"
              style={{ ...bodyF, color: C.ink }}
            />
          </div>
          <button
            onClick={refresh}
            aria-label="Opnieuw laden"
            className="flex h-10 w-10 items-center justify-center rounded-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
            style={{
              background: C.parchmentHi,
              boxShadow: `inset 0 0 0 1px ${C.line}`,
              ["--tw-ring-color" as string]: C.gold,
              ["--tw-ring-offset-color" as string]: C.parchment,
            }}
          >
            <RefreshCw
              size={15}
              className={loading ? "animate-spin" : ""}
              style={{ color: C.bordeaux }}
              aria-hidden="true"
            />
          </button>
        </div>
      </div>

      {/* Foutstrook — dismissible error-state */}
      {error && (
        <div
          className="flex items-start gap-3 rounded-md p-4"
          role="alert"
          style={{ background: "rgba(111,18,31,0.08)", border: `1px solid ${C.bordeaux}` }}
        >
          <ShieldX size={18} strokeWidth={2.2} style={{ color: C.bordeaux }} aria-hidden="true" />
          <div className="min-w-0 flex-1">
            <div className="text-[15px] font-medium" style={{ ...display, color: C.ink }}>
              Sommige matches konden niet worden geladen
            </div>
            <p className="mt-0.5 text-[12px]" style={{ ...bodyF, color: C.inkSoft }}>
              Er ging iets mis bij het ophalen van de nieuwste opdrachten. Probeer opnieuw te laden.
            </p>
          </div>
          <button
            onClick={() => setError(false)}
            aria-label="Melding sluiten"
            className="shrink-0 rounded-sm p-1 transition-colors focus-visible:outline-none focus-visible:ring-2"
            style={{ color: C.bordeaux, ["--tw-ring-color" as string]: C.gold }}
          >
            <X size={16} aria-hidden="true" />
          </button>
        </div>
      )}

      {loading ? (
        // Skeleton-loading — perkament-placeholders
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
          {[0, 1, 2].map((i) => (
            <Card key={i} className="p-4">
              <div className="flex items-center gap-3">
                <span
                  className="h-14 w-12 shrink-0 animate-pulse"
                  style={{
                    background: C.parchmentDim,
                    clipPath: "polygon(0 0, 100% 0, 100% 55%, 50% 100%, 0 55%)",
                  }}
                />
                <div className="flex-1 space-y-2">
                  <span
                    className="block h-3.5 w-3/4 animate-pulse rounded-sm"
                    style={{ background: C.parchmentDim }}
                  />
                  <span
                    className="block h-3 w-1/2 animate-pulse rounded-sm"
                    style={{ background: C.line }}
                  />
                </div>
              </div>
              <div className="mt-4 space-y-2">
                <span
                  className="block h-3 w-full animate-pulse rounded-sm"
                  style={{ background: C.line }}
                />
                <span
                  className="block h-3 w-5/6 animate-pulse rounded-sm"
                  style={{ background: C.line }}
                />
              </div>
            </Card>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        // Empty-state — lege lijst
        <Card className="flex flex-col items-center justify-center gap-3 p-16 text-center">
          <Escutcheon size={68} field={C.parchmentDim} stroke={C.gold} hatchId="empty">
            <Search size={26} strokeWidth={1.6} style={{ color: C.bordeaux }} aria-hidden="true" />
          </Escutcheon>
          <p className="mt-1 text-[22px] font-medium" style={{ ...display, color: C.ink }}>
            Geen wapen gevonden
          </p>
          <p className="max-w-xs text-[13px]" style={{ ...bodyF, color: C.inkSoft }}>
            Niets gevonden voor &ldquo;{q}&rdquo;. Pas je zoekterm aan om de wapenhof opnieuw te
            vullen.
          </p>
          <button
            onClick={() => setQ("")}
            className="mt-1 rounded-sm px-4 py-2 text-[12px] font-semibold uppercase tracking-[0.06em] transition-transform hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
            style={{
              ...bodyF,
              background: C.bordeaux,
              color: C.onDark,
              ["--tw-ring-color" as string]: C.gold,
              ["--tw-ring-offset-color" as string]: C.parchmentHi,
            }}
          >
            Zoekterm wissen
          </button>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
          {filtered.map((o) => (
            <Card key={o.id} interactive className="flex flex-col">
              <div
                className="h-1 w-full"
                style={{ background: `linear-gradient(90deg, ${C.bordeaux}, ${C.gold})` }}
                aria-hidden="true"
              />
              <div className="relative flex items-center gap-3 p-4">
                <MatchCrest value={o.match} size={50} />
                <div className="min-w-0">
                  <h3
                    className="text-[16px] font-medium leading-tight"
                    style={{ ...display, color: C.ink }}
                  >
                    {o.titel}
                  </h3>
                  <p className="mt-0.5 text-[12px]" style={{ ...bodyF, color: C.inkSoft }}>
                    {o.opdrachtgever}
                  </p>
                </div>
              </div>
              <div className="relative px-4 pb-4">
                <dl className="grid grid-cols-2 gap-y-2 text-[12px]">
                  <Meta Icon={MapPin} value={o.plaats} />
                  <Meta Icon={Coins} value={o.tarief} />
                  <Meta Icon={Clock} value={o.uren} />
                  <Meta Icon={CalendarDays} value={o.start} />
                </dl>
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {o.tags.map((t) => (
                    <span
                      key={t}
                      className="rounded-sm px-2 py-0.5 text-[10.5px] font-medium uppercase tracking-[0.04em]"
                      style={{ ...bodyF, background: C.parchmentDim, color: C.inkSoft }}
                    >
                      {t}
                    </span>
                  ))}
                </div>
              </div>
              <button
                onClick={onOpen}
                className="relative mt-auto flex items-center justify-center gap-2 py-3 text-[12px] font-semibold uppercase tracking-[0.06em] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset"
                style={{
                  ...bodyF,
                  borderTop: `1px solid ${C.line}`,
                  color: C.bordeaux,
                  ["--tw-ring-color" as string]: C.gold,
                }}
              >
                Bekijk opdracht <ArrowRight size={14} aria-hidden="true" />
              </button>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Opdracht-detail — verklaarbare matching (redenen.plus / redenen.min) ───────────
function OpdrachtDetail({ opdracht, onBack }: { opdracht: Opdracht; onBack: () => void }) {
  const feiten: { l: string; v: string; Icon: LucideIcon }[] = [
    { l: "Tarief", v: opdracht.tarief, Icon: Coins },
    { l: "Omvang", v: opdracht.uren, Icon: Clock },
    { l: "Start", v: opdracht.start, Icon: CalendarDays },
    { l: "Plaats", v: opdracht.plaats, Icon: MapPin },
  ];
  return (
    <div className="space-y-6">
      <button
        onClick={onBack}
        className="inline-flex items-center gap-1.5 rounded-sm px-3.5 py-1.5 text-[12px] font-semibold uppercase tracking-[0.06em] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
        style={{
          ...bodyF,
          background: C.parchmentHi,
          color: C.ink,
          boxShadow: `inset 0 0 0 1px ${C.line}`,
          ["--tw-ring-color" as string]: C.gold,
          ["--tw-ring-offset-color" as string]: C.parchment,
        }}
      >
        <ArrowLeft size={14} aria-hidden="true" /> Terug naar marktplaats
      </button>

      <Card className="relative" style={{ background: C.midnightDeep }}>
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            background: `radial-gradient(80% 130% at 100% 0%, rgba(111,18,31,0.5), transparent 55%)`,
          }}
          aria-hidden="true"
        />
        <div className="relative flex flex-wrap items-center justify-between gap-5 p-6 sm:p-8">
          <div className="min-w-0">
            <span
              className="inline-block rounded-sm px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.08em]"
              style={{
                ...mono,
                background: "rgba(216,179,86,0.14)",
                color: C.goldHi,
                border: `1px solid ${C.goldDeep}`,
              }}
            >
              {opdracht.id}
            </span>
            <h1
              className="mt-3 max-w-2xl text-[28px] font-medium leading-[1.08] sm:text-[38px]"
              style={{ ...display, color: C.onDark }}
            >
              {opdracht.titel}
            </h1>
            <p className="mt-2 text-[13.5px]" style={{ ...bodyF, color: "rgba(243,234,212,0.75)" }}>
              {opdracht.opdrachtgever} · {opdracht.plaats}
            </p>
          </div>
          <MatchCrest value={opdracht.match} size={84} />
        </div>
      </Card>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {feiten.map((f) => (
          <Card key={f.l} interactive className="p-4">
            <span
              className="flex h-8 w-8 items-center justify-center rounded-sm"
              style={{ background: "rgba(111,18,31,0.10)" }}
              aria-hidden="true"
            >
              <f.Icon size={15} strokeWidth={1.9} style={{ color: C.bordeaux }} />
            </span>
            <div
              className="mt-3 text-[17px] font-semibold tabular-nums leading-none"
              style={{ ...mono, color: C.ink }}
            >
              {f.v}
            </div>
            <div
              className="mt-1 text-[10px] font-medium uppercase tracking-[0.1em]"
              style={{ ...mono, color: C.inkFaint }}
            >
              {f.l}
            </div>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
        <section className="space-y-3">
          <SectionHead title="Waarom dit past" Icon={Check} />
          <Card className="p-5">
            <ul className="space-y-3">
              {opdracht.redenen.plus.map((r) => (
                <li
                  key={r}
                  className="flex items-start gap-2.5 text-[13.5px] leading-snug"
                  style={{ ...bodyF, color: C.ink }}
                >
                  <span
                    className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-sm"
                    style={{ background: C.midnight }}
                    aria-hidden="true"
                  >
                    <Check size={12} strokeWidth={2.6} style={{ color: C.goldHi }} />
                  </span>
                  {r}
                </li>
              ))}
            </ul>
          </Card>
        </section>
        <section className="space-y-3">
          <SectionHead title="Om te overwegen" Icon={TriangleAlert} />
          <Card className="p-5">
            <ul className="space-y-3">
              {opdracht.redenen.min.map((r) => (
                <li
                  key={r}
                  className="flex items-start gap-2.5 text-[13.5px] leading-snug"
                  style={{ ...bodyF, color: C.ink }}
                >
                  <span
                    className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-sm"
                    style={{ background: C.parchmentDim, border: `1px solid ${C.bordeauxSoft}66` }}
                    aria-hidden="true"
                  >
                    <TriangleAlert size={11} strokeWidth={2.4} style={{ color: C.bordeaux }} />
                  </span>
                  {r}
                </li>
              ))}
            </ul>
          </Card>
        </section>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row">
        <button
          className="flex flex-1 items-center justify-center gap-2 rounded-sm px-6 py-3.5 text-[13px] font-semibold uppercase tracking-[0.06em] transition-transform hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
          style={{
            ...bodyF,
            background: C.bordeaux,
            color: C.onDark,
            ["--tw-ring-color" as string]: C.gold,
            ["--tw-ring-offset-color" as string]: C.parchment,
          }}
        >
          Reageer op deze opdracht <ArrowRight size={16} aria-hidden="true" />
        </button>
        <button
          className="flex items-center justify-center gap-2 rounded-sm px-6 py-3.5 text-[13px] font-semibold uppercase tracking-[0.06em] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
          style={{
            ...bodyF,
            background: C.parchmentHi,
            color: C.ink,
            boxShadow: `inset 0 0 0 1px ${C.line}`,
            ["--tw-ring-color" as string]: C.gold,
            ["--tw-ring-offset-color" as string]: C.parchment,
          }}
        >
          <Star size={15} strokeWidth={2} style={{ color: C.bordeaux }} aria-hidden="true" /> Bewaar
        </button>
      </div>
    </div>
  );
}

// ── Verificatie — credentials als wapenschilden, statuschips, vertrouwensniveau ────
function Verificatie() {
  const verified = CREDENTIALS.filter((c) => c.status === "VERIFIED").length;
  const dek = Math.round((verified / CREDENTIALS.length) * 100);
  const [open, setOpen] = useState<string | null>(CREDENTIALS[0]?.naam ?? null);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <SectionHead title="Verificatie" sub="Certificaten &amp; documenten" Icon={ShieldCheck} />
        <button
          className="inline-flex items-center gap-2 rounded-sm px-4 py-2 text-[12px] font-semibold uppercase tracking-[0.06em] transition-transform hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
          style={{
            ...bodyF,
            background: C.bordeaux,
            color: C.onDark,
            ["--tw-ring-color" as string]: C.gold,
            ["--tw-ring-offset-color" as string]: C.parchment,
          }}
        >
          <Plus size={14} aria-hidden="true" /> Toevoegen
        </button>
      </div>

      {/* Vertrouwens-wapen — het grote schild met bezegelings-percentage */}
      <Card className="relative" style={{ background: C.midnightDeep }}>
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            background: `radial-gradient(70% 130% at 0% 0%, rgba(111,18,31,0.5), transparent 55%)`,
          }}
          aria-hidden="true"
        />
        <div className="relative flex flex-wrap items-center gap-6 p-6">
          <Escutcheon
            size={120}
            field={C.midnight}
            field2={C.bordeaux}
            chief={C.bordeauxDeep}
            stroke={C.goldHi}
            hatchId="verifhero"
          >
            <span className="mt-2.5 flex flex-col items-center leading-none">
              <span
                className="text-[32px] font-semibold tabular-nums"
                style={{ ...mono, color: C.goldHi }}
              >
                {dek}
                <span className="text-[15px]">%</span>
              </span>
              <span
                className="mt-1 text-[8px] font-semibold uppercase tracking-[0.16em]"
                style={{ ...mono, color: C.onDark }}
              >
                bezegeld
              </span>
            </span>
          </Escutcheon>
          <div className="max-w-sm">
            <div className="text-[20px] font-medium" style={{ ...display, color: C.onDark }}>
              {verified}/{CREDENTIALS.length} geverifieerd
            </div>
            <p
              className="mt-1 text-[13px] leading-relaxed"
              style={{ ...bodyF, color: "rgba(243,234,212,0.78)" }}
            >
              Elk bezegeld certificaat versterkt het wapen. Houd je bezegeling hoog, dan blijft je
              schild onberispelijk voor opdrachtgevers.
            </p>
            <span
              className="mt-3 inline-flex items-center gap-1.5 rounded-sm px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.08em]"
              style={{ ...bodyF, background: C.goldHi, color: C.midnightDeep }}
            >
              <BadgeCheck size={12} strokeWidth={2} aria-hidden="true" /> {PROFIEL.trust}
            </span>
          </div>
        </div>
      </Card>

      {/* Credential-wapens — elk certificaat als een schild, expanderende rij */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {CREDENTIALS.map((c) => {
          const m = credMeta(c.status);
          const actionable = c.status !== "VERIFIED";
          const isOpen = open === c.naam;
          return (
            <Card key={c.naam} interactive className="flex flex-col p-4">
              <div className="flex items-center gap-3.5">
                <Escutcheon
                  size={52}
                  field={m.field}
                  field2={m.field2}
                  chief={m.chief}
                  stroke={m.border}
                  hatch={m.hatch}
                  hatchId={`cred-${c.status}`}
                >
                  <m.Icon
                    size={18}
                    strokeWidth={2.2}
                    style={{ color: m.charge }}
                    aria-hidden="true"
                  />
                </Escutcheon>
                <div className="min-w-0 flex-1">
                  <div
                    className="truncate text-[15px] font-medium"
                    style={{ ...display, color: C.ink }}
                  >
                    {c.naam}
                  </div>
                  <div className="mt-0.5 text-[12px]" style={{ ...bodyF, color: C.inkSoft }}>
                    {c.detail}
                  </div>
                </div>
                <button
                  onClick={() => setOpen(isOpen ? null : c.naam)}
                  aria-label={isOpen ? "Details verbergen" : "Details tonen"}
                  aria-expanded={isOpen}
                  className="flex h-8 w-8 shrink-0 items-center justify-center rounded-sm transition-transform focus-visible:outline-none focus-visible:ring-2"
                  style={{
                    color: C.inkFaint,
                    transform: isOpen ? "rotate(90deg)" : "none",
                    ["--tw-ring-color" as string]: C.gold,
                  }}
                >
                  <ChevronRight size={16} aria-hidden="true" />
                </button>
              </div>
              <div className="mt-3 flex flex-wrap items-center gap-2">
                <StatusTag status={c.status} />
                {actionable && (
                  <button
                    className="rounded-sm px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.05em] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-1"
                    style={{
                      ...bodyF,
                      background: C.parchmentDim,
                      color: C.ink,
                      boxShadow: `inset 0 0 0 1px ${C.line}`,
                      ["--tw-ring-color" as string]: C.gold,
                      ["--tw-ring-offset-color" as string]: C.parchmentHi,
                    }}
                  >
                    {c.status === "EXPIRING"
                      ? "Vernieuwen"
                      : c.status === "REJECTED"
                        ? "Opnieuw indienen"
                        : "Bekijk"}
                  </button>
                )}
              </div>
              {isOpen && (
                <div
                  className="mt-3 grid grid-cols-2 gap-2 border-t pt-3 text-[11.5px]"
                  style={{ borderColor: C.line }}
                >
                  <div>
                    <div
                      className="text-[9.5px] font-semibold uppercase tracking-[0.1em]"
                      style={{ ...mono, color: C.inkFaint }}
                    >
                      Wapen-veld
                    </div>
                    <div className="mt-0.5" style={{ ...bodyF, color: C.inkSoft }}>
                      {m.short}
                    </div>
                  </div>
                  <div>
                    <div
                      className="text-[9.5px] font-semibold uppercase tracking-[0.1em]"
                      style={{ ...mono, color: C.inkFaint }}
                    >
                      Zichtbaar voor
                    </div>
                    <div className="mt-0.5" style={{ ...bodyF, color: C.inkSoft }}>
                      {c.status === "VERIFIED" ? "Opdrachtgevers" : "Alleen jij"}
                    </div>
                  </div>
                </div>
              )}
            </Card>
          );
        })}
      </div>

      {/* Documenten-strook — gekoppelde bestanden per wapen */}
      <section className="space-y-3">
        <SectionHead title="Documenten" sub="Privé, versleuteld opgeslagen" Icon={Scroll} />
        <Card>
          {DOCUMENTEN.map((d, i) => {
            const m = credMeta(d.status);
            return (
              <div
                key={d.naam}
                className="flex items-center gap-3 p-4"
                style={i === 0 ? undefined : { borderTop: `1px solid ${C.line}` }}
              >
                <span
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-sm"
                  style={{ background: C.parchmentDim }}
                  aria-hidden="true"
                >
                  <FileText size={16} strokeWidth={1.9} style={{ color: C.bordeaux }} />
                </span>
                <div className="min-w-0 flex-1">
                  <div
                    className="truncate text-[13.5px] font-medium"
                    style={{ ...bodyF, color: C.ink }}
                  >
                    {d.naam}
                  </div>
                  <div className="text-[11px]" style={{ ...mono, color: C.inkFaint }}>
                    {d.type} · {d.grootte} · {d.bijgewerkt}
                  </div>
                </div>
                <span
                  className="hidden shrink-0 items-center gap-1.5 rounded-sm px-2 py-0.5 text-[10.5px] font-semibold uppercase tracking-[0.06em] sm:inline-flex"
                  style={{
                    ...bodyF,
                    background: m.chipBg === "transparent" ? C.parchmentDim : m.chipBg,
                    color: m.chipBg === "transparent" ? C.inkSoft : m.chipFg,
                    border: `1px solid ${m.border}`,
                  }}
                >
                  <m.Icon size={11} strokeWidth={2.2} aria-hidden="true" /> {m.short}
                </span>
              </div>
            );
          })}
        </Card>
      </section>
    </div>
  );
}

// ── Acties (next-action) ─────────────────────────────────────────────────────────
function Acties() {
  const sorted = [...ACTIES].sort((a, b) =>
    a.urgentie === b.urgentie ? 0 : a.urgentie === "warning" ? -1 : 1,
  );
  return (
    <div className="space-y-6">
      <SectionHead
        title="Volgende beste acties"
        sub="Op urgentie gerangschikt — pak de bovenste eerst"
        Icon={ShieldAlert}
      />

      <ol className="space-y-4">
        {sorted.map((a, i) => {
          const warn = a.urgentie === "warning";
          return (
            <li key={a.titel}>
              <Card interactive className="flex items-stretch">
                <span
                  className="w-1.5 shrink-0"
                  style={{ background: warn ? C.bordeaux : C.gold }}
                  aria-hidden="true"
                />
                <div className="flex min-w-0 flex-1 items-center gap-4 p-5">
                  <span
                    className="flex h-11 w-11 shrink-0 items-center justify-center text-[16px] font-semibold tabular-nums"
                    style={{
                      ...mono,
                      background: warn ? C.bordeaux : C.midnight,
                      color: C.goldHi,
                      clipPath: "polygon(0 0, 100% 0, 100% 60%, 50% 100%, 0 60%)",
                    }}
                    aria-hidden="true"
                  >
                    {warn ? <TriangleAlert size={18} strokeWidth={2.2} /> : i + 1}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span
                        className="inline-flex items-center gap-1 rounded-sm px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.08em]"
                        style={
                          warn
                            ? { ...mono, background: C.bordeaux, color: C.onDark }
                            : {
                                ...mono,
                                background: "rgba(27,40,70,0.1)",
                                color: C.midnight,
                                border: `1px solid ${C.midnight}44`,
                              }
                        }
                      >
                        {warn ? (
                          <TriangleAlert size={10} strokeWidth={2.4} aria-hidden="true" />
                        ) : (
                          <Star size={10} strokeWidth={2.4} aria-hidden="true" />
                        )}
                        {warn ? "Urgent" : "Kans"}
                      </span>
                      <h3 className="text-[18px] font-medium" style={{ ...display, color: C.ink }}>
                        {a.titel}
                      </h3>
                    </div>
                    <p
                      className="mt-1.5 text-[13px] leading-relaxed"
                      style={{ ...bodyF, color: C.inkSoft }}
                    >
                      {a.detail}
                    </p>
                    <button
                      className="mt-3 inline-flex items-center gap-2 rounded-sm px-4 py-2 text-[12px] font-semibold uppercase tracking-[0.06em] transition-transform hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
                      style={
                        warn
                          ? {
                              ...bodyF,
                              background: C.bordeaux,
                              color: C.onDark,
                              ["--tw-ring-color" as string]: C.gold,
                              ["--tw-ring-offset-color" as string]: C.parchmentHi,
                            }
                          : {
                              ...bodyF,
                              background: C.parchmentDim,
                              color: C.ink,
                              boxShadow: `inset 0 0 0 1px ${C.line}`,
                              ["--tw-ring-color" as string]: C.gold,
                              ["--tw-ring-offset-color" as string]: C.parchmentHi,
                            }
                      }
                    >
                      {a.cta} <ArrowRight size={13} aria-hidden="true" />
                    </button>
                  </div>
                </div>
              </Card>
            </li>
          );
        })}
      </ol>

      {/* Berichten-strook — verrijking */}
      <section className="space-y-3">
        <SectionHead title="Berichten" sub="Recente gesprekken" Icon={Feather} />
        <Card>
          {BERICHTEN.map((b, i) => (
            <div
              key={b.van}
              className="flex items-center gap-3 p-4"
              style={i === 0 ? undefined : { borderTop: `1px solid ${C.line}` }}
            >
              <span
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-sm text-[11px] font-bold"
                style={{ ...mono, background: C.midnight, color: C.goldHi }}
                aria-hidden="true"
              >
                {b.initialen}
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span
                    className="truncate text-[15px] font-medium"
                    style={{ ...display, color: C.ink }}
                  >
                    {b.van}
                  </span>
                  {b.ongelezen && (
                    <span
                      className="h-1.5 w-1.5 rounded-full"
                      style={{ background: C.bordeaux }}
                      aria-label="Ongelezen"
                    />
                  )}
                </div>
                <p className="mt-0.5 truncate text-[12px]" style={{ ...bodyF, color: C.inkSoft }}>
                  {b.preview}
                </p>
              </div>
              <span
                className="shrink-0 text-[11px] tabular-nums"
                style={{ ...mono, color: C.inkFaint }}
              >
                {b.tijd}
              </span>
            </div>
          ))}
        </Card>
      </section>

      {/* Wapenhof-navigatie — alle domeinen als kleine schild-tegels */}
      <section className="space-y-3">
        <SectionHead title="Wapenhof" sub="Alle domeinen" Icon={Shield} />
        <div className="flex flex-wrap gap-2">
          {NAV.map((n) => (
            <span
              key={n}
              className="inline-flex items-center gap-1.5 rounded-sm px-3 py-1.5 text-[11.5px] font-medium uppercase tracking-[0.05em]"
              style={{
                ...bodyF,
                background: C.parchmentHi,
                color: C.inkSoft,
                boxShadow: `inset 0 0 0 1px ${C.line}`,
              }}
            >
              <Shield size={11} strokeWidth={2} style={{ color: C.gold }} aria-hidden="true" />
              {n}
            </span>
          ))}
        </div>
      </section>
    </div>
  );
}

// ── Facturen — omzet & openstaand ─────────────────────────────────────────────────
function Facturen() {
  const factMeta = (
    status: string,
  ): { label: string; Icon: LucideIcon; field: string; fg: string; solid: boolean } => {
    if (status === "Betaald")
      return { label: "Betaald", Icon: Check, field: C.midnight, fg: C.goldHi, solid: true };
    if (status === "Openstaand")
      return { label: "Openstaand", Icon: Clock, field: C.bordeaux, fg: C.onDark, solid: false };
    return { label: "Concept", Icon: FileText, field: C.parchmentDim, fg: C.inkSoft, solid: false };
  };
  const betaald = "€ 8.622";
  const open = FACTUREN.filter((f) => f.status === "Openstaand").length;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <SectionHead title="Facturen" sub="Omzet &amp; openstaand" Icon={Award} />
        <button
          className="inline-flex items-center gap-2 rounded-sm px-4 py-2 text-[12px] font-semibold uppercase tracking-[0.06em] transition-transform hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
          style={{
            ...bodyF,
            background: C.bordeaux,
            color: C.onDark,
            ["--tw-ring-color" as string]: C.gold,
            ["--tw-ring-offset-color" as string]: C.parchment,
          }}
        >
          <Plus size={14} aria-hidden="true" /> Nieuwe factuur
        </button>
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
        {[
          { l: "Betaald (mnd)", v: betaald },
          { l: "Openstaand", v: `${open}` },
          { l: "Te factureren", v: "€ 1.350" },
        ].map((s) => (
          <Card key={s.l} interactive className="p-4">
            <div
              className="h-1 w-10 rounded-full"
              style={{ background: `linear-gradient(90deg, ${C.bordeaux}, ${C.gold})` }}
              aria-hidden="true"
            />
            <div
              className="mt-3 text-[10.5px] font-medium uppercase tracking-[0.08em]"
              style={{ ...bodyF, color: C.inkFaint }}
            >
              {s.l}
            </div>
            <div
              className="mt-1 text-[27px] font-semibold tabular-nums leading-none"
              style={{ ...mono, color: C.ink }}
            >
              {s.v}
            </div>
          </Card>
        ))}
      </div>

      <Card>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[520px] text-left">
            <thead>
              <tr style={{ background: C.midnightDeep }}>
                {["Nummer", "Klant", "Datum", "Status", "Bedrag"].map((h, i) => (
                  <th
                    key={h}
                    className={`px-4 py-2.5 text-[10px] font-semibold uppercase tracking-[0.1em] ${i === 4 ? "text-right" : ""}`}
                    style={{ ...mono, color: C.goldHi }}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {FACTUREN.map((f, i) => {
                const m = factMeta(f.status);
                return (
                  <tr
                    key={f.nr}
                    className="transition-colors"
                    style={i === 0 ? undefined : { borderTop: `1px solid ${C.line}` }}
                  >
                    <td
                      className="px-4 py-3 text-[13px] font-bold tabular-nums"
                      style={{ ...mono, color: C.ink }}
                    >
                      {f.nr}
                    </td>
                    <td className="px-4 py-3 text-[13px]" style={{ ...bodyF, color: C.inkSoft }}>
                      {f.klant}
                    </td>
                    <td
                      className="px-4 py-3 text-[12px] tabular-nums"
                      style={{ ...mono, color: C.inkFaint }}
                    >
                      {f.datum}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className="inline-flex items-center gap-1.5 rounded-sm px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.06em]"
                        style={{
                          ...bodyF,
                          background: m.solid ? m.field : "transparent",
                          color: m.solid ? m.fg : C.bordeaux,
                          border: `1px solid ${m.solid ? m.field : m.field === C.parchmentDim ? C.line : C.bordeaux}`,
                        }}
                      >
                        <m.Icon size={11} strokeWidth={2.4} aria-hidden="true" /> {m.label}
                      </span>
                    </td>
                    <td
                      className="px-4 py-3 text-right text-[15px] font-semibold tabular-nums"
                      style={{ ...mono, color: C.ink }}
                    >
                      {f.bedrag}
                    </td>
                  </tr>
                );
              })}
            </tbody>
            <tfoot>
              <tr style={{ background: C.bordeaux }}>
                <td
                  colSpan={4}
                  className="px-4 py-3 text-[10.5px] font-medium uppercase tracking-[0.1em]"
                  style={{ ...mono, color: "rgba(243,234,212,0.7)" }}
                >
                  Totaal betaald
                </td>
                <td
                  className="px-4 py-3 text-right text-[17px] font-bold tabular-nums"
                  style={{ ...mono, color: C.goldHi }}
                >
                  {betaald}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </Card>
    </div>
  );
}
