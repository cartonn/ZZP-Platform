"use client";

// Concept 179 — "Damast" · tone-on-tone geweven jacquard. Luxe textiel: een fijn, subtiel
// herhalend ornament (damast/brokaat) in exact dezelfde kleurfamilie als de ondergrond — laag
// contrast, kleur-op-kleur — geweven onder strakke, clean content. Verfijnd, rijk, rustig: het
// patroon fluistert, de content spreekt. Onderscheidt zich van textiel (grof weefsel), batik
// (was-resist vlekken) en zellige (harde tegelgeometrie): dit is een GEWEVEN ORNAMENT tone-on-tone,
// ingetogen luxe zoals damasten tafellinnen of jacquard-behang. Micro-interactie: een zachte
// jacquard-glans die bij hover over kaarten strijkt (als licht over geweven zijde). Status nooit
// kleur-alleen: label + icoon + tint. Deterministisch — geen random/Date, patroon via statische SVG.
// UI-taal Nederlands. Fonts: Bricolage Grotesque (display) + Spline Sans (tekst) + mono (data).

import { useState } from "react";
import {
  ArrowRight,
  ArrowLeft,
  Check,
  Clock,
  XCircle,
  Search,
  ShieldCheck,
  Plus,
  MapPin,
  Coins,
  CalendarDays,
  Star,
  FileText,
  TriangleAlert,
  ChevronRight,
  Sparkles,
  RefreshCw,
  Crown,
  Feather,
  Scroll,
  Award,
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
  BERICHTEN,
  type ScreenKey,
  type CredStatus,
  type Opdracht,
} from "./mock";

// ── Palet — tone-on-tone: warme ivoor/parel-basis, damast-draden in taupe-goud (kleur-op-kleur),
//    diepe espresso-bordeaux inkt als enige donkere accent. Alles ademt hetzelfde weefsel. ──
const C = {
  bg: "#f6f1e7", // warme ivoor (weefsel-basis)
  bgDeep: "#efe7d5", // secundair vlak (iets dieper ivoor)
  card: "#fffdf8", // content-kaart (schone parel)
  ink: "#3b2a2b", // diepe espresso-bordeaux inkt
  inkSoft: "#6b5a52", // secundaire tekst (taupe)
  inkFaint: "#9a8a7c", // labels (zacht taupe)
  line: "#e7dcc4", // fijne rand (goud-taupe)
  lineSoft: "#efe6d3",
  // Damast-draden (tone-on-tone — dicht bij de basis, laag contrast)
  gold: "#b28a3e", // geweven goud-accent
  goldSoft: "#f1e6cd",
  goldDeep: "#8f6d2c",
  wine: "#7c3340", // brokaat-bordeaux accent
  wineSoft: "#f2e2e2",
  // Semantisch (status) — gedempt, in dezelfde warme wereld
  ok: "#4f7d52",
  okSoft: "#e4eddf",
  warn: "#b0762a",
  warnSoft: "#f6e9d2",
  info: "#4a6a8f",
  infoSoft: "#e4ebf2",
  danger: "#a5474f",
  dangerSoft: "#f4e2e2",
  white: "#ffffff",
};

const display = { fontFamily: "var(--font-lab-bricolage)" };
const bodyF = { fontFamily: "var(--font-lab-spline)" };
const mono = { fontFamily: "var(--font-lab-mono)" };

// ── Damast-motief — één symmetrische jacquard-ornament-tegel (palmet + spiegelscrolls), tone-on-tone.
//    Wordt getegeld via <pattern>. Kleur en opacity zorgen voor het kleur-op-kleur, laag-contrast effect.
function DamastWeave({
  id,
  color = C.gold,
  opacity = 0.14,
  tile = 84,
  className = "",
  style,
}: {
  id: string;
  color?: string;
  opacity?: number;
  tile?: number;
  className?: string;
  style?: React.CSSProperties;
}) {
  const half = tile / 2;
  return (
    <svg
      className={className}
      style={style}
      width="100%"
      height="100%"
      aria-hidden="true"
      preserveAspectRatio="xMidYMid slice"
    >
      <defs>
        <pattern id={id} x="0" y="0" width={tile} height={tile} patternUnits="userSpaceOnUse">
          <g fill="none" stroke={color} strokeWidth="1.1" opacity={opacity}>
            {/* Centrale palmet-ruit — het hart van de damast-tegel */}
            <path
              d={`M${half},${half - 20} C ${half + 12},${half - 8} ${half + 12},${half + 8} ${half},${half + 20} C ${half - 12},${half + 8} ${half - 12},${half - 8} ${half},${half - 20} Z`}
            />
            {/* Kern-bloemhart */}
            <circle cx={half} cy={half} r="3.2" fill={color} stroke="none" />
            {/* Vier spiegel-scrolls (jacquard-ranken) rond het hart */}
            <path
              d={`M${half},${half - 20} C ${half + 16},${half - 30} ${half + 30},${half - 20} ${half + 26},${half - 6}`}
            />
            <path
              d={`M${half},${half - 20} C ${half - 16},${half - 30} ${half - 30},${half - 20} ${half - 26},${half - 6}`}
            />
            <path
              d={`M${half},${half + 20} C ${half + 16},${half + 30} ${half + 30},${half + 20} ${half + 26},${half + 6}`}
            />
            <path
              d={`M${half},${half + 20} C ${half - 16},${half + 30} ${half - 30},${half + 20} ${half - 26},${half + 6}`}
            />
            {/* Hoek-knoppen (verbinden de tegels tot doorlopend brokaat) */}
            <circle cx="0" cy="0" r="2.4" fill={color} stroke="none" />
            <circle cx={tile} cy="0" r="2.4" fill={color} stroke="none" />
            <circle cx="0" cy={tile} r="2.4" fill={color} stroke="none" />
            <circle cx={tile} cy={tile} r="2.4" fill={color} stroke="none" />
            {/* Diagonale ranken naar de hoeken — laten het patroon ademen als geweven draad */}
            <path
              d={`M${half - 26},${half - 6} C ${half - 40},${half - 20} ${half - 30},${half - 34} 0,0`}
            />
            <path
              d={`M${half + 26},${half - 6} C ${half + 40},${half - 20} ${half + 30},${half - 34} ${tile},0`}
            />
            <path
              d={`M${half - 26},${half + 6} C ${half - 40},${half + 20} ${half - 30},${half + 34} 0,${tile}`}
            />
            <path
              d={`M${half + 26},${half + 6} C ${half + 40},${half + 20} ${half + 30},${half + 34} ${tile},${tile}`}
            />
          </g>
        </pattern>
      </defs>
      <rect x="0" y="0" width="100%" height="100%" fill={`url(#${id})`} />
    </svg>
  );
}

// Klein damast-medaillon — geweven ornament in een rond kader (merk-accent, geen random).
function Medallion({ size = 46 }: { size?: number }) {
  const c = size / 2;
  return (
    <span
      className="relative inline-flex shrink-0 items-center justify-center overflow-hidden rounded-full"
      style={{
        width: size,
        height: size,
        background: C.goldSoft,
        boxShadow: `0 0 0 1px ${C.gold}55`,
      }}
      aria-hidden="true"
    >
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <g fill="none" stroke={C.goldDeep} strokeWidth="1" opacity="0.7">
          <path
            d={`M${c},${c - c * 0.62} C ${c + c * 0.34},${c - c * 0.24} ${c + c * 0.34},${c + c * 0.24} ${c},${c + c * 0.62} C ${c - c * 0.34},${c + c * 0.24} ${c - c * 0.34},${c - c * 0.24} ${c},${c - c * 0.62} Z`}
          />
          <path
            d={`M${c - c * 0.62},${c} C ${c - c * 0.24},${c - c * 0.34} ${c + c * 0.24},${c - c * 0.34} ${c + c * 0.62},${c} C ${c + c * 0.24},${c + c * 0.34} ${c - c * 0.24},${c + c * 0.34} ${c - c * 0.62},${c} Z`}
          />
        </g>
        <circle cx={c} cy={c} r={size * 0.11} fill={C.gold} />
      </svg>
    </span>
  );
}

// ── Status-model — nooit kleur-alleen (icoon + label + tint) ──────────────────────
type StatusStyle = { label: string; Icon: LucideIcon; fg: string; bg: string };
function credMeta(s: CredStatus): StatusStyle {
  switch (s) {
    case "VERIFIED":
      return { label: "Geverifieerd", Icon: Check, fg: C.ok, bg: C.okSoft };
    case "SUBMITTED":
      return { label: "In beoordeling", Icon: Clock, fg: C.info, bg: C.infoSoft };
    case "EXPIRING":
      return { label: "Verloopt binnenkort", Icon: TriangleAlert, fg: C.warn, bg: C.warnSoft };
    case "REJECTED":
      return { label: "Afgewezen", Icon: XCircle, fg: C.danger, bg: C.dangerSoft };
  }
}

function StatusTag({ status }: { status: CredStatus }) {
  const m = credMeta(status);
  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold"
      style={{ ...bodyF, background: m.bg, color: m.fg }}
    >
      <m.Icon size={12} strokeWidth={2.4} aria-hidden="true" />
      {m.label}
    </span>
  );
}

// ── Kaart — clean parel-vlak met fijne goud-taupe rand en een jacquard-glans bij hover ──
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
      className={`group/card relative overflow-hidden rounded-2xl ${
        interactive
          ? "transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_14px_34px_-16px_rgba(59,42,43,0.28)]"
          : ""
      } ${className}`}
      style={{ background: C.card, boxShadow: `0 0 0 1px ${C.line}`, ...style }}
    >
      {/* Jacquard-glans — strijkt bij hover over de kaart als licht over geweven zijde */}
      {interactive && (
        <span
          className="pointer-events-none absolute inset-0 -translate-x-full opacity-0 transition-all duration-700 ease-out group-hover/card:translate-x-full group-hover/card:opacity-100"
          style={{
            background: `linear-gradient(105deg, transparent 30%, ${C.gold}22 48%, ${C.white}66 52%, transparent 70%)`,
          }}
          aria-hidden="true"
        />
      )}
      {children}
    </div>
  );
}

// Sectie-kop — medaillon + titel + fijne damast-scheidingslijn.
function SectionHead({ title, sub, Icon }: { title: string; sub?: string; Icon: LucideIcon }) {
  return (
    <div className="flex items-center gap-3">
      <span
        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl"
        style={{ background: C.goldSoft, boxShadow: `inset 0 0 0 1px ${C.gold}44` }}
        aria-hidden="true"
      >
        <Icon size={17} strokeWidth={1.9} style={{ color: C.goldDeep }} />
      </span>
      <div className="min-w-0">
        <h2
          className="text-[19px] font-bold leading-none tracking-[-0.02em]"
          style={{ ...display, color: C.ink }}
        >
          {title}
        </h2>
        {sub && (
          <p className="mt-1 text-[12px]" style={{ ...bodyF, color: C.inkFaint }}>
            {sub}
          </p>
        )}
      </div>
      <span
        className="ml-2 hidden h-px flex-1 sm:block"
        style={{ background: `linear-gradient(90deg, ${C.gold}66, transparent)` }}
        aria-hidden="true"
      />
    </div>
  );
}

function Meta({ Icon, value }: { Icon: LucideIcon; value: string }) {
  return (
    <div className="flex items-center gap-1.5" style={{ color: C.inkSoft }}>
      <Icon size={13} strokeWidth={1.9} style={{ color: C.gold }} aria-hidden="true" />
      <span className="truncate" style={bodyF}>
        {value}
      </span>
    </div>
  );
}

// Match-ring — goud-brokaat voortgang met cijfer in het hart.
function MatchRing({ value, size = 54 }: { value: number; size?: number }) {
  const deg = (value / 100) * 360;
  return (
    <span
      className="relative flex shrink-0 items-center justify-center rounded-full"
      style={{
        width: size,
        height: size,
        background: `conic-gradient(${C.gold} 0deg, ${C.goldDeep} ${deg}deg, ${C.line} ${deg}deg 360deg)`,
      }}
      aria-hidden="true"
    >
      <span
        className="absolute inset-[4px] flex flex-col items-center justify-center rounded-full"
        style={{ background: C.card }}
      >
        <span
          className="text-[15px] font-bold tabular-nums leading-none"
          style={{ ...display, color: C.ink }}
        >
          {value}
        </span>
        <span
          className="text-[7px] font-semibold uppercase tracking-[0.1em]"
          style={{ ...mono, color: C.inkFaint }}
        >
          match
        </span>
      </span>
    </span>
  );
}

// Mini staaf-spark — gedempt goud, laatste staaf brokaat-vol.
function Spark({ data }: { data: number[] }) {
  const max = Math.max(...data);
  return (
    <div className="flex h-8 items-end gap-[3px]" aria-hidden="true">
      {data.map((v, i) => (
        <span
          key={i}
          className="flex-1 rounded-t-[2px]"
          style={{
            height: `${Math.max(14, (v / max) * 100)}%`,
            background: i === data.length - 1 ? C.gold : `${C.ink}1f`,
          }}
        />
      ))}
    </div>
  );
}

// ── Root ─────────────────────────────────────────────────────────────────────────
export function Concept179() {
  const [screen, setScreen] = useState<ScreenKey>("dashboard");
  const active = OPDRACHTEN[0] as Opdracht;

  return (
    <div
      className="relative min-h-screen w-full overflow-x-hidden antialiased"
      style={{ ...bodyF, background: C.bg, color: C.ink }}
    >
      {/* Doorlopend tone-on-tone damast-weefsel onder alles */}
      <div className="pointer-events-none fixed inset-0 z-0" aria-hidden="true">
        <DamastWeave id="damast-page" color={C.gold} opacity={0.1} tile={84} />
      </div>

      <div className="relative z-10">
        {/* Kop — brokaat-band met dieper damast-weefsel */}
        <header className="relative overflow-hidden" style={{ background: C.ink }}>
          <div className="pointer-events-none absolute inset-0" aria-hidden="true">
            <DamastWeave id="damast-head" color={C.gold} opacity={0.16} tile={72} />
          </div>
          <div
            className="pointer-events-none absolute inset-x-0 bottom-0 h-px"
            style={{ background: `linear-gradient(90deg, transparent, ${C.gold}88, transparent)` }}
            aria-hidden="true"
          />
          <div className="relative mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-4 py-5 md:px-8">
            <div className="flex items-center gap-3.5">
              <Medallion size={46} />
              <div className="leading-tight">
                <div
                  className="text-[10px] font-semibold uppercase tracking-[0.32em]"
                  style={{ ...mono, color: C.gold }}
                >
                  Damast
                </div>
                <div
                  className="text-[23px] font-bold leading-none tracking-[-0.02em]"
                  style={{ ...display, color: C.white }}
                >
                  Weefkamer
                </div>
                <div
                  className="mt-1 text-[10px] uppercase tracking-[0.16em]"
                  style={{ ...mono, color: "rgba(255,255,255,0.5)" }}
                >
                  Match · Verificatie · Omzet
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2.5">
              <span
                className="hidden items-center gap-1.5 rounded-full px-3 py-1.5 text-[11px] font-semibold sm:inline-flex"
                style={{ ...bodyF, background: "rgba(255,255,255,0.1)", color: C.white }}
              >
                <Crown size={12} strokeWidth={2} style={{ color: C.gold }} aria-hidden="true" />{" "}
                {PROFIEL.trust}
              </span>
              <span
                className="flex h-10 w-10 items-center justify-center rounded-full text-[12px] font-bold"
                style={{
                  ...mono,
                  background: C.goldSoft,
                  color: C.ink,
                  boxShadow: `0 0 0 1px ${C.gold}66`,
                }}
                aria-hidden="true"
              >
                {PROFIEL.initialen}
              </span>
            </div>
          </div>

          {/* Scherm-switcher — geweven pil-tabs */}
          <nav
            className="relative mx-auto flex max-w-6xl items-center gap-1.5 overflow-x-auto px-4 pb-4 md:px-8"
            aria-label="Schermen"
          >
            {SCREENS.map((s) => {
              const on = s.key === screen;
              return (
                <button
                  key={s.key}
                  onClick={() => setScreen(s.key)}
                  aria-current={on ? "page" : undefined}
                  className="relative shrink-0 rounded-full px-3.5 py-1.5 text-[12.5px] font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-[#3b2a2b]"
                  style={
                    on
                      ? {
                          ...bodyF,
                          background: C.gold,
                          color: C.ink,
                          ["--tw-ring-color" as string]: C.gold,
                        }
                      : {
                          ...bodyF,
                          background: "rgba(255,255,255,0.07)",
                          color: "rgba(255,255,255,0.72)",
                          ["--tw-ring-color" as string]: C.gold,
                        }
                  }
                >
                  {s.label}
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
            className="flex items-center justify-center gap-2 border-t pt-6 text-[11px]"
            style={{ ...mono, borderColor: C.line, color: C.inkFaint }}
          >
            <Feather size={12} aria-hidden="true" /> Geweven in tone-on-tone — het patroon
            fluistert, de content spreekt.
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
      {/* Hero — brokaat-vlak met geweven damast onder clean tekst */}
      <Card className="relative">
        <div className="pointer-events-none absolute inset-0" aria-hidden="true">
          <DamastWeave id="damast-hero" color={C.gold} opacity={0.13} tile={78} />
        </div>
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            background: `linear-gradient(100deg, ${C.card} 42%, ${C.card}cc 62%, transparent)`,
          }}
          aria-hidden="true"
        />
        <div className="relative max-w-xl p-6 sm:p-8">
          <span
            className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold"
            style={{ ...bodyF, background: C.goldSoft, color: C.goldDeep }}
          >
            <Sparkles size={12} strokeWidth={2.2} aria-hidden="true" /> {PROFIEL.rol}
          </span>
          <h1
            className="mt-3 text-[30px] font-bold leading-[1.05] tracking-[-0.03em] sm:text-[40px]"
            style={{ ...display, color: C.ink }}
          >
            Drie matches boven 85%. Je profiel weeft zich naar meer werk.
          </h1>
          <p
            className="mt-3 max-w-lg text-[14px] leading-relaxed"
            style={{ ...bodyF, color: C.inkSoft }}
          >
            Eén draad vraagt aandacht: je VOG verloopt binnenkort. Regel het en houd je profiel
            onberispelijk verifieerbaar.
          </p>
          <div className="mt-5 flex flex-wrap gap-3">
            <button
              onClick={onOpen}
              className="inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-[13px] font-semibold text-white transition-transform hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
              style={{ ...bodyF, background: C.ink, ["--tw-ring-color" as string]: C.gold }}
            >
              Bekijk matches <ArrowRight size={15} aria-hidden="true" />
            </button>
            <button
              onClick={onActies}
              className="inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-[13px] font-semibold transition-colors hover:bg-[#efe7d5] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
              style={{
                ...bodyF,
                background: C.bgDeep,
                color: C.ink,
                ["--tw-ring-color" as string]: C.gold,
              }}
            >
              <TriangleAlert
                size={14}
                strokeWidth={2.2}
                style={{ color: C.warn }}
                aria-hidden="true"
              />{" "}
              Los actie op
            </button>
          </div>
        </div>
      </Card>

      {/* KPI-kaarten */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {KPIS.map((k) => (
          <Card key={k.label} interactive className="p-4">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-medium" style={{ ...bodyF, color: C.inkFaint }}>
                {k.label}
              </span>
              <span
                className="inline-flex items-center gap-0.5 rounded-full px-1.5 py-0.5 text-[10px] font-semibold"
                style={{
                  ...mono,
                  background: k.up ? C.okSoft : C.warnSoft,
                  color: k.up ? C.ok : C.warn,
                }}
              >
                {k.trend}
              </span>
            </div>
            <div
              className="mt-2 text-[26px] font-bold leading-none tracking-[-0.02em]"
              style={{ ...display, color: C.ink }}
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
            Icon={Award}
          />
          <div className="space-y-3">
            {OPDRACHTEN.map((o) => (
              <Card key={o.id} interactive>
                <button
                  onClick={onOpen}
                  className="relative flex w-full items-center gap-4 p-4 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset"
                  style={{ ["--tw-ring-color" as string]: C.gold }}
                >
                  <MatchRing value={o.match} />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <div
                          className="truncate text-[15.5px] font-bold tracking-[-0.01em]"
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
                          className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium"
                          style={{ ...bodyF, background: C.bgDeep, color: C.inkSoft }}
                        >
                          <Check
                            size={11}
                            strokeWidth={2.6}
                            style={{ color: C.ok }}
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
          <SectionHead title="Vertrouwen" sub="Certificaat-dekking" Icon={ShieldCheck} />
          <Card className="p-5">
            <div className="flex items-center gap-5">
              <span
                className="relative flex h-24 w-24 shrink-0 items-center justify-center rounded-full"
                style={{
                  background: `conic-gradient(${C.gold} 0deg, ${C.goldDeep} ${dek * 3.6}deg, ${C.line} ${dek * 3.6}deg 360deg)`,
                }}
                aria-hidden="true"
              >
                <span
                  className="absolute inset-[8px] flex flex-col items-center justify-center rounded-full"
                  style={{ background: C.card }}
                >
                  <span
                    className="text-[26px] font-bold leading-none"
                    style={{ ...display, color: C.ink }}
                  >
                    {dek}
                    <span className="text-[13px]" style={{ color: C.inkFaint }}>
                      %
                    </span>
                  </span>
                </span>
              </span>
              <div>
                <StatusTag status="VERIFIED" />
                <p className="mt-2 text-[12.5px]" style={{ ...bodyF, color: C.inkSoft }}>
                  {verified}/{CREDENTIALS.length} certificaten geverifieerd. Opdrachtgevers zien
                  alleen geverifieerde documenten.
                </p>
              </div>
            </div>
          </Card>

          {/* Prioriteit — brokaat-vlak met damast-weefsel */}
          <Card
            className="relative"
            style={{ background: C.ink, boxShadow: `0 0 0 1px ${C.gold}44` }}
          >
            <div className="pointer-events-none absolute inset-0" aria-hidden="true">
              <DamastWeave id="damast-prio" color={C.gold} opacity={0.14} tile={68} />
            </div>
            <div className="relative p-5">
              <span
                className="inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.08em]"
                style={{ ...mono, background: C.warnSoft, color: C.warn }}
              >
                <TriangleAlert size={11} strokeWidth={2.4} aria-hidden="true" /> Prioriteit
              </span>
              <h3
                className="mt-2.5 text-[17px] font-bold leading-tight tracking-[-0.01em]"
                style={{ ...display, color: C.white }}
              >
                {warn.titel}
              </h3>
              <p
                className="mt-1.5 text-[12.5px] leading-relaxed"
                style={{ ...bodyF, color: "rgba(255,255,255,0.72)" }}
              >
                {warn.detail}
              </p>
              <button
                onClick={onActies}
                className="mt-4 inline-flex items-center gap-2 rounded-full px-4 py-2 text-[12px] font-semibold transition-transform hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-[#3b2a2b]"
                style={{
                  ...bodyF,
                  background: C.gold,
                  color: C.ink,
                  ["--tw-ring-color" as string]: C.gold,
                }}
              >
                {warn.cta} <ArrowRight size={13} aria-hidden="true" />
              </button>
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
    // Deterministische, vaste vertraging — geen random/Date.
    setTimeout(() => setLoading(false), 650);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <SectionHead title="Marktplaats" sub="Open opdrachten" Icon={Scroll} />
        <div className="flex items-center gap-2">
          <Card className="flex items-center gap-2 rounded-full px-3.5 py-2">
            <Search size={15} style={{ color: C.gold }} aria-hidden="true" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Zoek opdracht of plaats…"
              aria-label="Opdrachten zoeken"
              className="w-40 bg-transparent text-[12.5px] outline-none placeholder:opacity-50"
              style={{ ...bodyF, color: C.ink }}
            />
          </Card>
          <button
            onClick={refresh}
            aria-label="Opnieuw laden"
            className="flex h-10 w-10 items-center justify-center rounded-full transition-colors hover:bg-[#efe7d5] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
            style={{
              background: C.card,
              boxShadow: `0 0 0 1px ${C.line}`,
              ["--tw-ring-color" as string]: C.gold,
            }}
          >
            <RefreshCw
              size={15}
              className={loading ? "animate-spin" : ""}
              style={{ color: C.ink }}
              aria-hidden="true"
            />
          </button>
        </div>
      </div>

      {/* Foutstrook — dismissible, echte error-state */}
      {error && (
        <div
          className="flex items-start gap-3 rounded-2xl p-4"
          role="alert"
          style={{ background: C.dangerSoft, boxShadow: `0 0 0 1px ${C.danger}33` }}
        >
          <XCircle size={18} strokeWidth={2.2} style={{ color: C.danger }} aria-hidden="true" />
          <div className="min-w-0 flex-1">
            <div className="text-[13px] font-bold" style={{ ...display, color: C.danger }}>
              Sommige matches konden niet worden geladen
            </div>
            <p className="mt-0.5 text-[12px]" style={{ ...bodyF, color: C.inkSoft }}>
              Er ging iets mis bij het ophalen van de nieuwste opdrachten. Probeer opnieuw te laden.
            </p>
          </div>
          <button
            onClick={() => setError(false)}
            className="shrink-0 rounded-full px-2.5 py-1 text-[11px] font-semibold transition-colors hover:bg-white/50 focus-visible:outline-none focus-visible:ring-2"
            style={{ ...bodyF, color: C.danger, ["--tw-ring-color" as string]: C.danger }}
          >
            Sluiten
          </button>
        </div>
      )}

      {loading ? (
        // Skeleton-loading — geweven-grijze placeholders
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
          {[0, 1, 2].map((i) => (
            <Card key={i} className="p-4">
              <div className="flex items-center gap-3">
                <span
                  className="h-12 w-12 shrink-0 animate-pulse rounded-full"
                  style={{ background: C.bgDeep }}
                />
                <div className="flex-1 space-y-2">
                  <span
                    className="block h-3.5 w-3/4 animate-pulse rounded"
                    style={{ background: C.bgDeep }}
                  />
                  <span
                    className="block h-3 w-1/2 animate-pulse rounded"
                    style={{ background: C.lineSoft }}
                  />
                </div>
              </div>
              <div className="mt-4 space-y-2">
                <span
                  className="block h-3 w-full animate-pulse rounded"
                  style={{ background: C.lineSoft }}
                />
                <span
                  className="block h-3 w-5/6 animate-pulse rounded"
                  style={{ background: C.lineSoft }}
                />
              </div>
            </Card>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        // Empty-state — lege lijst
        <Card className="relative flex flex-col items-center justify-center gap-3 p-16 text-center">
          <div className="pointer-events-none absolute inset-0" aria-hidden="true">
            <DamastWeave id="damast-empty" color={C.gold} opacity={0.1} tile={72} />
          </div>
          <div className="relative flex flex-col items-center gap-3">
            <Medallion size={64} />
            <p className="text-[19px] font-bold" style={{ ...display, color: C.ink }}>
              Geen match gevonden
            </p>
            <p className="max-w-xs text-[13px]" style={{ ...bodyF, color: C.inkSoft }}>
              Niets gevonden voor &ldquo;{q}&rdquo;. Pas je zoekterm aan om het weefsel opnieuw te
              spannen.
            </p>
            <button
              onClick={() => setQ("")}
              className="mt-1 rounded-full px-4 py-2 text-[12px] font-semibold text-white transition-transform hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
              style={{ ...bodyF, background: C.ink, ["--tw-ring-color" as string]: C.gold }}
            >
              Zoekterm wissen
            </button>
          </div>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
          {filtered.map((o) => (
            <Card key={o.id} interactive className="flex flex-col">
              <div
                className="h-1 w-full"
                style={{ background: `linear-gradient(90deg, ${C.gold}, ${C.goldDeep})` }}
                aria-hidden="true"
              />
              <div className="relative flex items-center gap-3 p-4">
                <MatchRing value={o.match} size={48} />
                <div className="min-w-0">
                  <h3
                    className="text-[15px] font-bold leading-tight tracking-[-0.01em]"
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
                      className="rounded-full px-2 py-0.5 text-[10.5px] font-medium"
                      style={{ ...bodyF, background: C.bgDeep, color: C.inkSoft }}
                    >
                      {t}
                    </span>
                  ))}
                </div>
              </div>
              <button
                onClick={onOpen}
                className="relative mt-auto flex items-center justify-center gap-2 py-3 text-[12.5px] font-semibold transition-colors hover:bg-[#efe7d5] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset"
                style={{
                  ...bodyF,
                  borderTop: `1px solid ${C.line}`,
                  color: C.ink,
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

// ── Opdracht-detail ──────────────────────────────────────────────────────────────
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
        className="inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-[12px] font-semibold transition-colors hover:bg-[#efe7d5] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
        style={{
          ...bodyF,
          background: C.card,
          color: C.ink,
          boxShadow: `0 0 0 1px ${C.line}`,
          ["--tw-ring-color" as string]: C.gold,
        }}
      >
        <ArrowLeft size={14} aria-hidden="true" /> Terug naar marktplaats
      </button>

      <Card className="relative">
        <div className="pointer-events-none absolute inset-0" aria-hidden="true">
          <DamastWeave id="damast-opd" color={C.gold} opacity={0.12} tile={80} />
        </div>
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            background: `linear-gradient(100deg, ${C.card} 40%, ${C.card}bb 65%, transparent)`,
          }}
          aria-hidden="true"
        />
        <div className="relative flex flex-wrap items-center justify-between gap-5 p-6 sm:p-8">
          <div className="min-w-0">
            <span
              className="inline-block rounded-full px-2.5 py-1 text-[11px] font-semibold"
              style={{ ...mono, background: C.goldSoft, color: C.goldDeep }}
            >
              {opdracht.id}
            </span>
            <h1
              className="mt-3 max-w-2xl text-[26px] font-bold leading-[1.08] tracking-[-0.02em] sm:text-[34px]"
              style={{ ...display, color: C.ink }}
            >
              {opdracht.titel}
            </h1>
            <p className="mt-2 text-[13.5px]" style={{ ...bodyF, color: C.inkSoft }}>
              {opdracht.opdrachtgever} · {opdracht.plaats}
            </p>
          </div>
          <MatchRing value={opdracht.match} size={82} />
        </div>
      </Card>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {feiten.map((f) => (
          <Card key={f.l} interactive className="p-4">
            <span
              className="flex h-8 w-8 items-center justify-center rounded-lg"
              style={{ background: C.goldSoft }}
              aria-hidden="true"
            >
              <f.Icon size={15} strokeWidth={1.9} style={{ color: C.goldDeep }} />
            </span>
            <div
              className="mt-3 text-[16px] font-bold leading-none"
              style={{ ...display, color: C.ink }}
            >
              {f.v}
            </div>
            <div
              className="mt-1 text-[10.5px] font-medium uppercase tracking-[0.08em]"
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
                    className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full"
                    style={{ background: C.okSoft }}
                    aria-hidden="true"
                  >
                    <Check size={12} strokeWidth={2.6} style={{ color: C.ok }} />
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
                    className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full"
                    style={{ background: C.warnSoft }}
                    aria-hidden="true"
                  >
                    <TriangleAlert size={11} strokeWidth={2.4} style={{ color: C.warn }} />
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
          className="flex flex-1 items-center justify-center gap-2 rounded-full px-6 py-3.5 text-[13px] font-semibold text-white transition-transform hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
          style={{ ...bodyF, background: C.ink, ["--tw-ring-color" as string]: C.gold }}
        >
          Reageer op deze opdracht <ArrowRight size={16} aria-hidden="true" />
        </button>
        <button
          className="flex items-center justify-center gap-2 rounded-full px-6 py-3.5 text-[13px] font-semibold transition-colors hover:bg-[#efe7d5] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
          style={{
            ...bodyF,
            background: C.card,
            color: C.ink,
            boxShadow: `0 0 0 1px ${C.line}`,
            ["--tw-ring-color" as string]: C.gold,
          }}
        >
          <Star size={15} strokeWidth={2} style={{ color: C.gold }} aria-hidden="true" /> Bewaar
        </button>
      </div>
    </div>
  );
}

// ── Verificatie ──────────────────────────────────────────────────────────────────
function Verificatie() {
  const verified = CREDENTIALS.filter((c) => c.status === "VERIFIED").length;
  const dek = Math.round((verified / CREDENTIALS.length) * 100);
  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <SectionHead title="Verificatie" sub="Certificaten &amp; documenten" Icon={ShieldCheck} />
        <button
          className="inline-flex items-center gap-2 rounded-full px-4 py-2 text-[12px] font-semibold text-white transition-transform hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
          style={{ ...bodyF, background: C.ink, ["--tw-ring-color" as string]: C.gold }}
        >
          <Plus size={14} aria-hidden="true" /> Toevoegen
        </button>
      </div>

      <Card className="relative">
        <div className="pointer-events-none absolute inset-0" aria-hidden="true">
          <DamastWeave id="damast-ver" color={C.gold} opacity={0.11} tile={78} />
        </div>
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            background: `linear-gradient(100deg, ${C.card} 45%, ${C.card}cc 68%, transparent)`,
          }}
          aria-hidden="true"
        />
        <div className="relative flex flex-wrap items-center gap-6 p-6">
          <span
            className="relative flex h-28 w-28 shrink-0 items-center justify-center rounded-full"
            style={{
              background: `conic-gradient(${C.gold} 0deg, ${C.goldDeep} ${dek * 3.6}deg, ${C.line} ${dek * 3.6}deg 360deg)`,
            }}
            aria-hidden="true"
          >
            <span
              className="absolute inset-[9px] flex flex-col items-center justify-center rounded-full"
              style={{ background: C.card }}
            >
              <span
                className="text-[30px] font-bold leading-none"
                style={{ ...display, color: C.ink }}
              >
                {dek}
                <span className="text-[15px]" style={{ color: C.inkFaint }}>
                  %
                </span>
              </span>
            </span>
          </span>
          <div className="max-w-sm">
            <div className="text-[16px] font-bold" style={{ ...display, color: C.ink }}>
              {verified}/{CREDENTIALS.length} geverifieerd
            </div>
            <p className="mt-1 text-[13px] leading-relaxed" style={{ ...bodyF, color: C.inkSoft }}>
              Elke geverifieerde draad versterkt het geheel. Houd je dekking hoog, dan blijft je
              profiel onberispelijk voor opdrachtgevers.
            </p>
            <span
              className="mt-3 inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[11px] font-semibold"
              style={{ ...bodyF, background: C.okSoft, color: C.ok }}
            >
              <Crown size={12} strokeWidth={2} aria-hidden="true" /> {PROFIEL.trust}
            </span>
          </div>
        </div>
      </Card>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {CREDENTIALS.map((c) => {
          const m = credMeta(c.status);
          const actionable = c.status !== "VERIFIED";
          return (
            <Card key={c.naam} interactive className="flex items-center gap-3.5 p-4">
              <span
                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl"
                style={{ background: m.bg }}
                aria-hidden="true"
              >
                <m.Icon size={20} strokeWidth={2.2} style={{ color: m.fg }} />
              </span>
              <div className="min-w-0 flex-1">
                <div
                  className="truncate text-[14.5px] font-bold tracking-[-0.01em]"
                  style={{ ...display, color: C.ink }}
                >
                  {c.naam}
                </div>
                <div className="mt-0.5 text-[12px]" style={{ ...bodyF, color: C.inkSoft }}>
                  {c.detail}
                </div>
                <div className="mt-2 flex flex-wrap items-center gap-2">
                  <StatusTag status={c.status} />
                  {actionable && (
                    <button
                      className="rounded-full px-2.5 py-1 text-[11px] font-semibold transition-colors hover:bg-[#efe7d5] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-1"
                      style={{
                        ...bodyF,
                        background: C.bgDeep,
                        color: C.ink,
                        ["--tw-ring-color" as string]: C.gold,
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
              </div>
            </Card>
          );
        })}
      </div>
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
        Icon={Feather}
      />

      <ol className="space-y-4">
        {sorted.map((a, i) => {
          const warn = a.urgentie === "warning";
          return (
            <li key={a.titel}>
              <Card interactive className="flex items-stretch">
                <span
                  className="w-1.5 shrink-0"
                  style={{
                    background: warn
                      ? `linear-gradient(${C.warn}, ${C.wine})`
                      : `linear-gradient(${C.gold}, ${C.goldDeep})`,
                  }}
                  aria-hidden="true"
                />
                <div className="flex min-w-0 flex-1 items-center gap-4 p-5">
                  <span
                    className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-[16px] font-bold tabular-nums"
                    style={{
                      ...display,
                      background: warn ? C.warnSoft : C.goldSoft,
                      color: warn ? C.warn : C.goldDeep,
                    }}
                    aria-hidden="true"
                  >
                    {warn ? <TriangleAlert size={19} strokeWidth={2.2} /> : i + 1}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span
                        className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.06em]"
                        style={{
                          ...mono,
                          background: warn ? C.warnSoft : C.infoSoft,
                          color: warn ? C.warn : C.info,
                        }}
                      >
                        {warn ? (
                          <TriangleAlert size={10} strokeWidth={2.4} aria-hidden="true" />
                        ) : (
                          <Sparkles size={10} strokeWidth={2.4} aria-hidden="true" />
                        )}
                        {warn ? "Urgent" : "Kans"}
                      </span>
                      <h3
                        className="text-[15.5px] font-bold tracking-[-0.01em]"
                        style={{ ...display, color: C.ink }}
                      >
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
                      className="mt-3 inline-flex items-center gap-2 rounded-full px-4 py-2 text-[12px] font-semibold transition-transform hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
                      style={
                        warn
                          ? {
                              ...bodyF,
                              background: C.warn,
                              color: C.white,
                              ["--tw-ring-color" as string]: C.warn,
                            }
                          : {
                              ...bodyF,
                              background: C.ink,
                              color: C.white,
                              ["--tw-ring-color" as string]: C.gold,
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
        <SectionHead title="Berichten" sub="Recente gesprekken" Icon={FileText} />
        <Card>
          {BERICHTEN.map((b, i) => (
            <div
              key={b.van}
              className="flex items-center gap-3 p-4"
              style={i === 0 ? undefined : { borderTop: `1px solid ${C.line}` }}
            >
              <span
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-[11px] font-bold"
                style={{
                  ...mono,
                  background: C.goldSoft,
                  color: C.ink,
                  boxShadow: `0 0 0 1px ${C.gold}44`,
                }}
                aria-hidden="true"
              >
                {b.initialen}
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span
                    className="truncate text-[13px] font-bold"
                    style={{ ...display, color: C.ink }}
                  >
                    {b.van}
                  </span>
                  {b.ongelezen && (
                    <span
                      className="h-1.5 w-1.5 rounded-full"
                      style={{ background: C.wine }}
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
    </div>
  );
}

// ── Facturen ─────────────────────────────────────────────────────────────────────
function Facturen() {
  const factMeta = (
    status: string,
  ): { label: string; Icon: LucideIcon; fg: string; bg: string } => {
    if (status === "Betaald") return { label: "Betaald", Icon: Check, fg: C.ok, bg: C.okSoft };
    if (status === "Openstaand")
      return { label: "Openstaand", Icon: Clock, fg: C.warn, bg: C.warnSoft };
    return { label: "Concept", Icon: FileText, fg: C.info, bg: C.infoSoft };
  };
  const betaald = "€ 8.622";
  const open = FACTUREN.filter((f) => f.status === "Openstaand").length;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <SectionHead title="Facturen" sub="Omzet &amp; openstaand" Icon={Coins} />
        <button
          className="inline-flex items-center gap-2 rounded-full px-4 py-2 text-[12px] font-semibold text-white transition-transform hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
          style={{ ...bodyF, background: C.ink, ["--tw-ring-color" as string]: C.gold }}
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
              style={{ background: `linear-gradient(90deg, ${C.gold}, ${C.goldDeep})` }}
              aria-hidden="true"
            />
            <div className="mt-3 text-[11px] font-medium" style={{ ...bodyF, color: C.inkFaint }}>
              {s.l}
            </div>
            <div
              className="mt-1 text-[26px] font-bold leading-none tracking-[-0.02em]"
              style={{ ...display, color: C.ink }}
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
              <tr style={{ background: C.bgDeep }}>
                {["Nummer", "Klant", "Datum", "Status", "Bedrag"].map((h, i) => (
                  <th
                    key={h}
                    className={`px-4 py-2.5 text-[10.5px] font-semibold uppercase tracking-[0.08em] ${i === 4 ? "text-right" : ""}`}
                    style={{ ...mono, color: C.inkFaint }}
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
                    className="transition-colors hover:bg-[#efe7d5]"
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
                        className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold"
                        style={{ ...bodyF, background: m.bg, color: m.fg }}
                      >
                        <m.Icon size={11} strokeWidth={2.4} aria-hidden="true" /> {m.label}
                      </span>
                    </td>
                    <td
                      className="px-4 py-3 text-right text-[15px] font-bold tabular-nums"
                      style={{ ...display, color: C.ink }}
                    >
                      {f.bedrag}
                    </td>
                  </tr>
                );
              })}
            </tbody>
            <tfoot>
              <tr style={{ background: C.ink }}>
                <td
                  colSpan={4}
                  className="px-4 py-3 text-[11px] font-medium uppercase tracking-[0.1em]"
                  style={{ ...mono, color: "rgba(255,255,255,0.6)" }}
                >
                  Totaal betaald
                </td>
                <td
                  className="px-4 py-3 text-right text-[17px] font-bold tabular-nums"
                  style={{ ...display, color: C.gold }}
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
