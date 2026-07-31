"use client";

// Concept 531 — "Expressief" · Material-3-Expressive-idioom. Veerkrachtige, springerige motion,
// morphende grote hoekvormen (asymmetrische, ruime radii), bold TONALE kleurrollen — één violet-
// familie in meerdere tonen als oppervlak-rollen — grote tactiele knoppen en expressieve maar
// leesbare typografie. Speels-premium, nooit kinderachtig. Status altijd label + icoon.

import { useMemo, useState, type CSSProperties, type ReactNode } from "react";
import {
  ArrowLeft,
  ArrowRight,
  ArrowUpRight,
  BadgeCheck,
  Bell,
  Bookmark,
  Check,
  ChevronRight,
  Clock,
  FileText,
  Hourglass,
  LayoutGrid,
  ListChecks,
  MapPin,
  Plus,
  Receipt,
  RefreshCw,
  Search,
  ShieldCheck,
  Sparkles,
  Store,
  ThumbsUp,
  TriangleAlert,
  Wallet,
  X,
  XCircle,
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

// ————————————————————————— Tonale kleurrollen — één violet-familie in tonen —————————————————————————
// Material-3-gevoel: surface-rollen afgeleid van dominante paars/violet, met warme secundaire tonen.
const C = {
  // neutrale oppervlakken met paarse ondertoon
  bg: "#f6f2fb",
  surface: "#fbf8ff",
  surfaceHi: "#ffffff",
  surfaceLo: "#f0e9fb",
  surfaceSink: "#e8def5",
  // primair (violet) tonaal palet
  p10: "#20083f",
  p20: "#371459",
  p30: "#4f2678",
  p40: "#6a3aa0",
  p50: "#8250c9",
  p70: "#b490e6",
  p90: "#e9ddfa",
  p95: "#f4ecfc",
  // secundair (roze-magenta accent)
  s40: "#a5266b",
  s90: "#fbdcec",
  // tertiair (amber, voor waarschuwing/warmte)
  t30: "#7a4b12",
  t40: "#9a5f18",
  t90: "#f8e4c4",
  // succes (groen-tonaal)
  g30: "#1f5a3f",
  g40: "#2c7853",
  g90: "#c9ecd8",
  // fout
  e40: "#b3261e",
  e90: "#f9dedc",
  // tekst
  ink: "#1c1523",
  inkSoft: "#443a4f",
  inkMute: "#6d6379",
  inkFaint: "#9a90a6",
  line: "#e2d6f0",
  lineSoft: "#eee6f8",
};

const sans: CSSProperties = {
  fontFamily: "'Inter', 'Segoe UI', -apple-system, BlinkMacSystemFont, system-ui, sans-serif",
};
const display: CSSProperties = {
  fontFamily: "'Inter', 'Segoe UI', -apple-system, BlinkMacSystemFont, system-ui, sans-serif",
  letterSpacing: "-0.03em",
};
const mono: CSSProperties = {
  fontFamily: "'SF Mono', 'JetBrains Mono', ui-monospace, 'Menlo', 'Consolas', monospace",
  fontVariantNumeric: "tabular-nums",
  fontFeatureSettings: "'tnum' 1",
};

const RING =
  "focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#b490e6]/60 focus-visible:ring-offset-2 focus-visible:ring-offset-[#f6f2fb]";

// Asymmetrische, morphende hoekvormen — de kern van het Expressive-gevoel.
const SHAPE = {
  blob: "28px 28px 28px 10px",
  blobHi: "34px 12px 34px 34px",
  pill: "999px",
  soft: "22px",
  chip: "12px 12px 12px 4px",
};

// ————————————————————————————— Status-taal (label + icoon) —————————————————————————————
type Tone = { fg: string; bg: string; label: string; Icon: LucideIcon; alarm: boolean };

function credTone(s: CredStatus): Tone {
  switch (s) {
    case "VERIFIED":
      return { fg: C.g30, bg: C.g90, label: "Geverifieerd", Icon: BadgeCheck, alarm: false };
    case "SUBMITTED":
      return { fg: C.p30, bg: C.p90, label: "In beoordeling", Icon: Hourglass, alarm: false };
    case "EXPIRING":
      return { fg: C.t30, bg: C.t90, label: "Verloopt bijna", Icon: TriangleAlert, alarm: true };
    case "REJECTED":
      return { fg: C.e40, bg: C.e90, label: "Afgekeurd", Icon: XCircle, alarm: true };
  }
}

function factuurTone(status: string): Tone {
  if (status === "Betaald")
    return { fg: C.g30, bg: C.g90, label: "Betaald", Icon: Check, alarm: false };
  if (status === "Openstaand")
    return { fg: C.t30, bg: C.t90, label: "Openstaand", Icon: Clock, alarm: false };
  return { fg: C.p30, bg: C.p90, label: "Concept", Icon: FileText, alarm: false };
}

function parseEUR(s: string): number {
  const d = s.replace(/[^\d]/g, "");
  return d ? parseInt(d, 10) : 0;
}
const eur0 = new Intl.NumberFormat("nl-NL", {
  style: "currency",
  currency: "EUR",
  maximumFractionDigits: 0,
});

// —————————————————————————————————————— Primitives ——————————————————————————————————————
function Card({
  children,
  className = "",
  as: Tag = "div",
  shape = SHAPE.soft,
  tint,
  raised = false,
}: {
  children: ReactNode;
  className?: string;
  as?: "div" | "section" | "article" | "aside" | "li";
  shape?: string;
  tint?: string;
  raised?: boolean;
}) {
  return (
    <Tag
      className={`relative ${className}`}
      style={{
        background: tint ?? C.surface,
        borderRadius: shape,
        border: `1px solid ${C.line}`,
        boxShadow: raised
          ? "0 18px 40px -24px rgba(80,38,120,0.45), 0 2px 0 rgba(255,255,255,0.6) inset"
          : "0 2px 0 rgba(255,255,255,0.55) inset",
      }}
    >
      {children}
    </Tag>
  );
}

function Btn({
  children,
  onClick,
  variant = "filled",
  size = "md",
  className = "",
  tone = C.p40,
  ariaLabel,
  ariaExpanded,
  full = false,
  type = "button",
}: {
  children: ReactNode;
  onClick?: () => void;
  variant?: "filled" | "tonal" | "outline" | "text";
  size?: "sm" | "md" | "lg";
  className?: string;
  tone?: string;
  ariaLabel?: string;
  ariaExpanded?: boolean;
  full?: boolean;
  type?: "button" | "submit";
}) {
  const pad =
    size === "sm"
      ? "px-4 py-2 text-[13px]"
      : size === "lg"
        ? "px-7 py-4 text-[15px]"
        : "px-5 py-3 text-[14px]";
  const base = `ex-btn inline-flex items-center justify-center gap-2 font-semibold transition-all duration-200 active:scale-[0.96] ${RING} ${full ? "w-full" : ""}`;
  const style: CSSProperties =
    variant === "filled"
      ? {
          background: tone,
          color: "#fff",
          borderRadius: SHAPE.pill,
          border: "1px solid transparent",
        }
      : variant === "tonal"
        ? {
            background: C.p90,
            color: C.p20,
            borderRadius: SHAPE.pill,
            border: "1px solid transparent",
          }
        : variant === "outline"
          ? {
              background: "transparent",
              color: tone,
              borderRadius: SHAPE.pill,
              border: `1.5px solid ${tone}55`,
            }
          : {
              background: "transparent",
              color: tone,
              borderRadius: SHAPE.pill,
              border: "1px solid transparent",
            };
  const hover =
    variant === "filled"
      ? "hover:brightness-110 hover:shadow-lg"
      : variant === "tonal"
        ? "hover:brightness-[0.97]"
        : "hover:bg-[#f0e9fb]";
  return (
    <button
      type={type}
      onClick={onClick}
      aria-label={ariaLabel}
      aria-expanded={ariaExpanded}
      className={`${base} ${pad} ${hover} ${className}`}
      style={{ ...sans, ...style }}
    >
      {children}
    </button>
  );
}

function StatusChip({ fg, bg, label, Icon, alarm, size = "md" }: Tone & { size?: "sm" | "md" }) {
  const pad = size === "sm" ? "px-2.5 py-1 text-[11px]" : "px-3 py-1.5 text-[12px]";
  return (
    <span
      className={`inline-flex items-center gap-1.5 font-bold ${pad}`}
      style={{ color: fg, background: bg, borderRadius: SHAPE.pill, ...sans }}
    >
      <Icon size={size === "sm" ? 12 : 14} aria-hidden="true" />
      {label}
      {alarm && <span className="sr-only"> (actie vereist)</span>}
    </span>
  );
}

// Match-percentage als grote, tactiele ring
function MatchRing({
  value,
  tone = C.p40,
  size = 60,
}: {
  value: number;
  tone?: string;
  size?: number;
}) {
  const r = size / 2 - 5;
  const circ = 2 * Math.PI * r;
  const off = circ - (value / 100) * circ;
  return (
    <span
      className="relative inline-flex shrink-0 items-center justify-center"
      style={{ width: size, height: size }}
      aria-label={`Match ${value} procent`}
    >
      <svg width={size} height={size} className="ex-ring -rotate-90" aria-hidden="true">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={C.surfaceSink}
          strokeWidth={5}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={tone}
          strokeWidth={5}
          strokeLinecap="round"
          strokeDasharray={circ}
          strokeDashoffset={off}
        />
      </svg>
      <span className="absolute text-[14px] font-extrabold" style={{ color: tone, ...mono }}>
        {value}
      </span>
    </span>
  );
}

function Kicker({ children, tone = C.p40 }: { children: ReactNode; tone?: string }) {
  return (
    <span
      className="inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-[0.14em]"
      style={{ color: tone, ...sans }}
    >
      {children}
    </span>
  );
}

function Spark({ data, tone = C.p50 }: { data: number[]; tone?: string }) {
  const max = Math.max(...data);
  const min = Math.min(...data);
  return (
    <span className="inline-flex h-7 items-end gap-[3px]" aria-hidden="true">
      {data.map((d, j) => {
        const h = 4 + ((d - min) / (max - min || 1)) * 22;
        const last = j === data.length - 1;
        return (
          <span
            key={j}
            className="w-[4px] rounded-full transition-all"
            style={{ height: h, background: last ? tone : `${tone}44` }}
          />
        );
      })}
    </span>
  );
}

function ScreenHead({
  eyebrow,
  title,
  sub,
  right,
  tone = C.p40,
}: {
  eyebrow: string;
  title: string;
  sub?: string;
  right?: ReactNode;
  tone?: string;
}) {
  return (
    <div className="mb-7 flex flex-wrap items-end justify-between gap-4">
      <div className="min-w-0">
        <Kicker tone={tone}>
          <Sparkles size={14} aria-hidden="true" /> {eyebrow}
        </Kicker>
        <h1
          className="mt-2 text-[30px] font-extrabold leading-[1.04] md:text-[38px]"
          style={{ color: C.ink, ...display }}
        >
          {title}
        </h1>
        {sub && (
          <p className="mt-2 max-w-xl text-[14px] leading-relaxed" style={{ color: C.inkMute }}>
            {sub}
          </p>
        )}
      </div>
      {right}
    </div>
  );
}

const NAV_META: Record<ScreenKey, { Icon: LucideIcon }> = {
  dashboard: { Icon: LayoutGrid },
  marktplaats: { Icon: Store },
  opdracht: { Icon: MapPin },
  verificatie: { Icon: ShieldCheck },
  acties: { Icon: ListChecks },
  facturen: { Icon: Receipt },
  documenten: { Icon: FileText },
  berichten: { Icon: Bell },
};

// —————————————————————————————————————— Root ——————————————————————————————————————
export function Concept531() {
  const [screen, setScreen] = useState<ScreenKey>("dashboard");
  const active = OPDRACHTEN[0] as Opdracht;

  return (
    <div
      className="min-h-[760px] w-full antialiased"
      style={{ ...sans, color: C.ink, background: C.bg }}
    >
      <div className="mx-auto flex max-w-6xl">
        <Sidebar screen={screen} setScreen={setScreen} />
        <div className="min-w-0 flex-1">
          <TopBar />
          <MobileNav screen={screen} setScreen={setScreen} />
          <main key={screen} className="ex-enter px-4 pb-24 pt-6 sm:px-6 md:px-8">
            {screen === "dashboard" && (
              <Dashboard
                onOpen={() => setScreen("opdracht")}
                onMarkt={() => setScreen("marktplaats")}
                onActies={() => setScreen("acties")}
                onVerif={() => setScreen("verificatie")}
              />
            )}
            {screen === "marktplaats" && <Marktplaats onOpen={() => setScreen("opdracht")} />}
            {screen === "opdracht" && (
              <OpdrachtDetail opdracht={active} onBack={() => setScreen("marktplaats")} />
            )}
            {screen === "verificatie" && <Verificatie />}
            {screen === "acties" && (
              <Acties
                onMarkt={() => setScreen("marktplaats")}
                onFacturen={() => setScreen("facturen")}
              />
            )}
            {screen === "facturen" && <Facturen />}
          </main>
        </div>
      </div>

      <style>{`
        @keyframes exEnter { from { opacity: 0; transform: translateY(14px) scale(0.985); } to { opacity: 1; transform: none; } }
        .ex-enter { animation: exEnter 0.4s cubic-bezier(0.34,1.56,0.64,1) both; }
        .ex-btn:active { transition-timing-function: cubic-bezier(0.34,1.56,0.64,1); }
        .ex-pop { transition: transform 0.28s cubic-bezier(0.34,1.56,0.64,1), box-shadow 0.28s ease; }
        .ex-pop:hover { transform: translateY(-4px); }
        .ex-ring circle { transition: stroke-dashoffset 0.6s cubic-bezier(0.34,1.4,0.64,1); }
        .ex-row { transition: background 0.18s ease, transform 0.18s cubic-bezier(0.34,1.56,0.64,1); }
        .ex-row:hover { background: ${C.surfaceLo}; }
        .ex-navitem { transition: transform 0.24s cubic-bezier(0.34,1.56,0.64,1); }
        .ex-navitem:hover { transform: translateX(3px); }
        @media (prefers-reduced-motion: reduce) {
          .ex-enter, .ex-pop, .ex-ring circle, .ex-row, .ex-navitem { animation: none !important; transition: none !important; transform: none !important; }
        }
      `}</style>
    </div>
  );
}

// —————————————————————————————————————— Sidebar ——————————————————————————————————————
function Sidebar({ screen, setScreen }: { screen: ScreenKey; setScreen: (s: ScreenKey) => void }) {
  const verified = CREDENTIALS.filter((c) => c.status === "VERIFIED").length;
  const ratio = Math.round((verified / CREDENTIALS.length) * 100);
  return (
    <aside
      className="sticky top-0 hidden h-screen w-[248px] shrink-0 flex-col md:flex"
      style={{ background: C.surface, borderRight: `1px solid ${C.line}` }}
    >
      <div className="flex items-center gap-3 px-5 py-6">
        <span
          className="flex h-11 w-11 items-center justify-center"
          style={{ background: C.p40, color: "#fff", borderRadius: SHAPE.blob }}
          aria-hidden="true"
        >
          <Sparkles size={20} />
        </span>
        <span>
          <span className="block text-[16px] font-extrabold" style={{ color: C.ink, ...display }}>
            Expressief
          </span>
          <span
            className="text-[10px] font-bold uppercase tracking-[0.18em]"
            style={{ color: C.p50 }}
          >
            ZZP · werkruimte
          </span>
        </span>
      </div>

      <nav aria-label="Hoofdmenu" className="flex-1 overflow-y-auto px-3 py-2">
        <ul className="space-y-1.5">
          {SCREENS.map((s) => {
            const on = s.key === screen;
            const { Icon } = NAV_META[s.key];
            return (
              <li key={s.key}>
                <button
                  type="button"
                  onClick={() => setScreen(s.key)}
                  aria-current={on ? "page" : undefined}
                  className={`ex-navitem flex w-full items-center gap-3 px-3 py-2.5 text-left text-[14px] font-semibold ${RING}`}
                  style={{
                    background: on ? C.p90 : "transparent",
                    color: on ? C.p20 : C.inkSoft,
                    borderRadius: on ? SHAPE.chip : SHAPE.pill,
                  }}
                >
                  <span
                    className="flex h-8 w-8 items-center justify-center"
                    style={{
                      background: on ? C.p40 : C.surfaceLo,
                      color: on ? "#fff" : C.inkMute,
                      borderRadius: on ? "12px 12px 12px 5px" : "999px",
                    }}
                    aria-hidden="true"
                  >
                    <Icon size={16} />
                  </span>
                  <span className="flex-1">{s.label}</span>
                  {on && <ChevronRight size={16} aria-hidden="true" />}
                </button>
              </li>
            );
          })}
        </ul>
      </nav>

      <div className="px-4 py-4">
        <div
          className="p-4"
          style={{ background: C.p95, borderRadius: SHAPE.blobHi, border: `1px solid ${C.line}` }}
        >
          <p className="text-[11px] font-bold uppercase tracking-[0.12em]" style={{ color: C.p50 }}>
            Profiel compleet
          </p>
          <div className="mt-2 flex items-end gap-2">
            <span
              className="text-[32px] font-extrabold leading-none"
              style={{ color: C.p30, ...mono }}
            >
              {ratio}%
            </span>
          </div>
          <div
            className="mt-2.5 h-2 w-full overflow-hidden"
            style={{ background: C.surfaceSink, borderRadius: 99 }}
          >
            <span
              className="block h-full"
              style={{ width: `${ratio}%`, background: C.p50, borderRadius: 99 }}
            />
          </div>
          <p className="mt-2 text-[11px]" style={{ color: C.inkMute }}>
            {verified}/{CREDENTIALS.length} certificaten geverifieerd
          </p>
        </div>
        <div className="mt-3 flex items-center gap-3 px-1">
          <span
            className="flex h-10 w-10 items-center justify-center text-[13px] font-extrabold"
            style={{ background: C.s90, color: C.s40, borderRadius: SHAPE.blob, ...mono }}
            aria-hidden="true"
          >
            {PROFIEL.initialen}
          </span>
          <span className="min-w-0 flex-1">
            <span className="block truncate text-[13px] font-bold" style={{ color: C.ink }}>
              {PROFIEL.naam}
            </span>
            <span
              className="flex items-center gap-1 text-[11px] font-semibold"
              style={{ color: C.g40 }}
            >
              <ShieldCheck size={11} aria-hidden="true" /> {PROFIEL.trust}
            </span>
          </span>
        </div>
      </div>
    </aside>
  );
}

function TopBar() {
  const open = FACTUREN.filter((f) => f.status === "Openstaand").reduce(
    (a, f) => a + parseEUR(f.bedrag),
    0,
  );
  const ongelezen = BERICHTEN.filter((b) => b.ongelezen).length;
  return (
    <header
      className="sticky top-0 z-20 flex items-center gap-3 px-4 py-3.5 sm:px-6 md:px-8"
      style={{
        background: `${C.bg}e8`,
        borderBottom: `1px solid ${C.line}`,
        backdropFilter: "blur(10px)",
      }}
    >
      <div
        className="flex flex-1 items-center gap-2.5 px-4 py-2.5"
        style={{ background: C.surface, borderRadius: SHAPE.pill, border: `1px solid ${C.line}` }}
      >
        <Search size={16} aria-hidden="true" style={{ color: C.inkFaint }} />
        <span className="text-[13px]" style={{ color: C.inkFaint }}>
          Zoek opdrachten, certificaten of facturen…
        </span>
        <span
          className="ml-auto hidden px-2 py-0.5 text-[11px] font-bold sm:inline"
          style={{ background: C.surfaceLo, color: C.inkMute, borderRadius: 99, ...mono }}
        >
          ⌘K
        </span>
      </div>
      <span
        className="hidden items-center gap-2 px-3.5 py-2.5 text-[13px] font-bold sm:inline-flex"
        style={{ background: C.t90, color: C.t30, borderRadius: SHAPE.pill }}
      >
        <Wallet size={15} aria-hidden="true" />
        <span style={{ ...mono }}>{eur0.format(open)}</span> open
      </span>
      <button
        type="button"
        aria-label={`Meldingen, ${ongelezen} ongelezen`}
        className={`relative flex h-11 w-11 items-center justify-center ${RING}`}
        style={{ background: C.surface, borderRadius: SHAPE.blob, border: `1px solid ${C.line}` }}
      >
        <Bell size={18} aria-hidden="true" style={{ color: C.inkSoft }} />
        {ongelezen > 0 && (
          <span
            className="absolute -right-0.5 -top-0.5 flex h-5 w-5 items-center justify-center text-[10px] font-extrabold text-white"
            style={{ background: C.s40, borderRadius: 99 }}
          >
            {ongelezen}
          </span>
        )}
      </button>
    </header>
  );
}

function MobileNav({
  screen,
  setScreen,
}: {
  screen: ScreenKey;
  setScreen: (s: ScreenKey) => void;
}) {
  return (
    <nav
      aria-label="Schermen"
      className="flex gap-2 overflow-x-auto px-4 py-3 md:hidden"
      style={{ borderBottom: `1px solid ${C.line}`, background: C.surface }}
    >
      {SCREENS.map((s) => {
        const on = s.key === screen;
        return (
          <button
            key={s.key}
            type="button"
            onClick={() => setScreen(s.key)}
            aria-current={on ? "page" : undefined}
            className={`shrink-0 px-4 py-2 text-[13px] font-bold ${RING}`}
            style={{
              background: on ? C.p40 : C.surfaceLo,
              color: on ? "#fff" : C.inkSoft,
              borderRadius: SHAPE.pill,
            }}
          >
            {s.label}
          </button>
        );
      })}
    </nav>
  );
}

// —————————————————————————————————————— Dashboard ——————————————————————————————————————
function Dashboard({
  onOpen,
  onMarkt,
  onActies,
  onVerif,
}: {
  onOpen: () => void;
  onMarkt: () => void;
  onActies: () => void;
  onVerif: () => void;
}) {
  const primair = ACTIES[0] as (typeof ACTIES)[number];
  const verified = CREDENTIALS.filter((c) => c.status === "VERIFIED").length;
  const ratio = Math.round((verified / CREDENTIALS.length) * 100);
  return (
    <div className="space-y-8">
      <ScreenHead
        eyebrow={`Welkom terug, ${PROFIEL.naam.split(" ")[0]}`}
        title="Vandaag in het kort"
        sub="Alles wat telt op één plek — jouw matches, je certificaten en de acties die aandacht vragen."
        right={
          <div className="flex flex-wrap gap-2">
            <Btn variant="tonal" size="sm" onClick={onVerif}>
              <ShieldCheck size={16} aria-hidden="true" /> Certificaten
            </Btn>
            <Btn variant="filled" size="sm" onClick={onActies}>
              Volgende actie <ArrowRight size={16} aria-hidden="true" />
            </Btn>
          </div>
        }
      />

      {/* KPI-tegels */}
      <section className="grid grid-cols-2 gap-4 xl:grid-cols-4">
        {KPIS.map((k, i) => {
          const tint = i === 0 ? C.p95 : C.surface;
          return (
            <Card
              key={k.label}
              className="ex-pop p-5"
              shape={i % 2 === 0 ? SHAPE.blob : SHAPE.blobHi}
              tint={tint}
            >
              <p className="text-[12px] font-bold" style={{ color: C.inkMute }}>
                {k.label}
              </p>
              <p
                className="mt-2 text-[30px] font-extrabold leading-none"
                style={{ color: C.ink, ...mono }}
              >
                {k.value}
              </p>
              <div className="mt-3 flex items-center justify-between">
                <span
                  className="inline-flex items-center gap-1 px-2 py-0.5 text-[12px] font-bold"
                  style={{
                    color: k.up ? C.g30 : C.t30,
                    background: k.up ? C.g90 : C.t90,
                    borderRadius: 99,
                  }}
                >
                  {k.up ? (
                    <ArrowUpRight size={12} aria-hidden="true" />
                  ) : (
                    <ArrowRight size={12} aria-hidden="true" />
                  )}
                  {k.trend}
                </span>
                <Spark data={k.spark} tone={C.p50} />
              </div>
            </Card>
          );
        })}
      </section>

      <section className="grid grid-cols-1 gap-6 lg:grid-cols-[1.6fr_1fr]">
        {/* Matches */}
        <Card className="overflow-hidden" shape={SHAPE.soft}>
          <div className="flex items-center justify-between px-6 py-4">
            <Kicker>
              <Store size={15} aria-hidden="true" /> Beste matches
            </Kicker>
            <button
              type="button"
              onClick={onMarkt}
              className={`inline-flex items-center gap-1 px-2 py-1 text-[13px] font-bold ${RING}`}
              style={{ color: C.p40, borderRadius: 99 }}
            >
              Alles <ArrowRight size={14} aria-hidden="true" />
            </button>
          </div>
          <ul>
            {OPDRACHTEN.map((o, i) => {
              const tone = o.match >= 90 ? C.g40 : C.p40;
              return (
                <li key={o.id}>
                  <button
                    type="button"
                    onClick={onOpen}
                    className={`ex-row flex w-full items-center gap-4 px-6 py-4 text-left ${RING}`}
                    style={{ borderTop: i === 0 ? "none" : `1px solid ${C.lineSoft}` }}
                  >
                    <MatchRing value={o.match} tone={tone} />
                    <span className="min-w-0 flex-1">
                      <span
                        className="block truncate text-[15px] font-bold"
                        style={{ color: C.ink }}
                      >
                        {o.titel}
                      </span>
                      <span
                        className="mt-0.5 flex items-center gap-1 truncate text-[12.5px]"
                        style={{ color: C.inkMute }}
                      >
                        <MapPin size={12} aria-hidden="true" /> {o.opdrachtgever} · {o.plaats}
                      </span>
                    </span>
                    <span className="hidden shrink-0 text-right sm:block">
                      <span
                        className="block text-[14px] font-extrabold"
                        style={{ color: C.ink, ...mono }}
                      >
                        {o.tarief.replace(" / uur", "")}
                      </span>
                      <span
                        className="text-[10px] font-bold uppercase tracking-[0.08em]"
                        style={{ color: C.inkFaint }}
                      >
                        p/uur
                      </span>
                    </span>
                    <ChevronRight size={18} aria-hidden="true" style={{ color: C.inkFaint }} />
                  </button>
                </li>
              );
            })}
          </ul>
        </Card>

        <div className="space-y-6">
          {/* Verificatie-samenvatting */}
          <Card className="ex-pop p-6" shape={SHAPE.blobHi} tint={C.p95}>
            <Kicker>
              <ShieldCheck size={15} aria-hidden="true" /> Vertrouwen
            </Kicker>
            <div className="mt-2 flex items-baseline gap-2">
              <span
                className="text-[42px] font-extrabold leading-none"
                style={{ color: C.p30, ...mono }}
              >
                {ratio}%
              </span>
              <span className="text-[13px]" style={{ color: C.inkMute }}>
                geverifieerd
              </span>
            </div>
            <div className="mt-4 space-y-2">
              {CREDENTIALS.map((c) => {
                const t = credTone(c.status);
                return (
                  <div key={c.naam} className="flex items-center gap-2">
                    <t.Icon size={14} aria-hidden="true" style={{ color: t.fg }} />
                    <span
                      className="min-w-0 flex-1 truncate text-[12.5px] font-semibold"
                      style={{ color: C.inkSoft }}
                    >
                      {c.naam}
                    </span>
                  </div>
                );
              })}
            </div>
            <Btn variant="text" size="sm" full className="mt-4 justify-start" onClick={onVerif}>
              Naar certificaten <ArrowRight size={14} aria-hidden="true" />
            </Btn>
          </Card>

          {/* Primaire actie */}
          <Card className="p-6" shape={SHAPE.blob} tint={C.t90}>
            <Kicker tone={C.t30}>
              <TriangleAlert size={15} aria-hidden="true" /> Vraagt aandacht
            </Kicker>
            <h3 className="mt-2 text-[17px] font-extrabold leading-snug" style={{ color: C.ink }}>
              {primair.titel}
            </h3>
            <p className="mt-1.5 text-[13px] leading-relaxed" style={{ color: C.inkSoft }}>
              {primair.detail}
            </p>
            <Btn variant="filled" size="md" full tone={C.t40} className="mt-4" onClick={onActies}>
              {primair.cta} <ArrowRight size={16} aria-hidden="true" />
            </Btn>
          </Card>
        </div>
      </section>

      {/* Berichten strip */}
      <section>
        <Kicker>
          <Bell size={15} aria-hidden="true" /> Recente berichten
        </Kicker>
        <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-3">
          {BERICHTEN.map((b) => (
            <Card key={b.van} className="ex-pop p-4" shape={SHAPE.chip}>
              <div className="flex items-center gap-2.5">
                <span
                  className="flex h-9 w-9 items-center justify-center text-[12px] font-extrabold"
                  style={{ background: C.p90, color: C.p30, borderRadius: SHAPE.blob, ...mono }}
                  aria-hidden="true"
                >
                  {b.initialen}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-[13px] font-bold" style={{ color: C.ink }}>
                    {b.van}
                  </span>
                  <span className="text-[11px]" style={{ color: C.inkFaint }}>
                    {b.tijd}
                  </span>
                </span>
                {b.ongelezen && (
                  <span
                    className="h-2.5 w-2.5 rounded-full"
                    style={{ background: C.s40 }}
                    aria-label="ongelezen"
                  />
                )}
              </div>
              <p
                className="mt-2 line-clamp-2 text-[12.5px] leading-snug"
                style={{ color: C.inkMute }}
              >
                {b.preview}
              </p>
            </Card>
          ))}
        </div>
      </section>
    </div>
  );
}

// —————————————————————————————————————— Marktplaats ——————————————————————————————————————
type Mode = "ok" | "loading" | "error";

function Marktplaats({ onOpen }: { onOpen: () => void }) {
  const [q, setQ] = useState("");
  const [sort, setSort] = useState<"match" | "tarief">("match");
  const [mode, setMode] = useState<Mode>("ok");

  const rows = useMemo(() => {
    const n = q.toLowerCase().trim();
    const list = OPDRACHTEN.filter(
      (o) =>
        o.titel.toLowerCase().includes(n) ||
        o.plaats.toLowerCase().includes(n) ||
        o.opdrachtgever.toLowerCase().includes(n),
    );
    return [...list].sort((a, b) =>
      sort === "match" ? b.match - a.match : parseEUR(b.tarief) - parseEUR(a.tarief),
    );
  }, [q, sort]);

  return (
    <div className="space-y-6">
      <ScreenHead
        eyebrow="Marktplaats"
        title="Opdrachten voor jou"
        sub={`${rows.length} van ${OPDRACHTEN.length} opdrachten sluiten aan op je profiel.`}
      />

      <Card className="flex flex-col gap-3 p-3 sm:flex-row sm:items-center" shape={SHAPE.soft}>
        <div
          className="flex flex-1 items-center gap-2.5 px-4 py-2.5"
          style={{ background: C.surfaceLo, borderRadius: SHAPE.pill }}
        >
          <Search size={16} aria-hidden="true" style={{ color: C.inkFaint }} />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Filter op titel, plaats of opdrachtgever…"
            aria-label="Opdrachten filteren"
            className="w-full bg-transparent text-[13.5px] outline-none placeholder:text-[#9a90a6]"
            style={{ color: C.ink }}
          />
          {q && (
            <button
              type="button"
              onClick={() => setQ("")}
              aria-label="Filter wissen"
              className={`flex h-6 w-6 items-center justify-center ${RING}`}
              style={{ color: C.inkMute, borderRadius: 99 }}
            >
              <X size={14} aria-hidden="true" />
            </button>
          )}
        </div>
        <div className="flex items-center gap-2" role="group" aria-label="Sorteren">
          {(["match", "tarief"] as const).map((s) => (
            <Btn
              key={s}
              size="sm"
              variant={sort === s ? "filled" : "outline"}
              onClick={() => setSort(s)}
            >
              {s === "match" ? "Match" : "Tarief"}
            </Btn>
          ))}
        </div>
      </Card>

      {mode === "loading" ? (
        <ul className="space-y-4" aria-hidden="true">
          {[0, 1, 2].map((i) => (
            <li key={i}>
              <Card className="space-y-3 p-6" shape={SHAPE.soft}>
                <div
                  className="h-5 w-2/3 animate-pulse motion-reduce:animate-none"
                  style={{ background: C.surfaceSink, borderRadius: 99 }}
                />
                <div
                  className="h-4 w-1/2 animate-pulse motion-reduce:animate-none"
                  style={{ background: C.surfaceLo, borderRadius: 99 }}
                />
              </Card>
            </li>
          ))}
        </ul>
      ) : mode === "error" ? (
        <StateBlock
          Icon={TriangleAlert}
          tone={C.e40}
          titel="Er ging iets mis"
          tekst="De opdrachten konden niet worden geladen. Probeer het opnieuw."
          cta="Opnieuw proberen"
          onCta={() => setMode("ok")}
        />
      ) : rows.length === 0 ? (
        <StateBlock
          Icon={Search}
          tone={C.p40}
          titel="Geen opdrachten gevonden"
          tekst={`Niets voor ${q ? `“${q}”` : "je filter"}. Verruim je zoekopdracht.`}
          cta="Filter wissen"
          onCta={() => setQ("")}
        />
      ) : (
        <ul className="space-y-4">
          {rows.map((o) => (
            <li key={o.id}>
              <MarktKaart opdracht={o} onOpen={onOpen} />
            </li>
          ))}
        </ul>
      )}

      <div className="flex items-center justify-center gap-4 pt-1">
        {(["loading", "error"] as const).map((m) => (
          <button
            key={m}
            type="button"
            onClick={() => setMode(mode === m ? "ok" : m)}
            className={`px-2 py-1 text-[11px] font-bold uppercase tracking-[0.12em] underline-offset-4 hover:underline ${RING}`}
            style={{ color: C.inkFaint, borderRadius: 8 }}
          >
            {m === "loading" ? "laadstaat" : "foutstaat"}
          </button>
        ))}
      </div>
    </div>
  );
}

function StateBlock({
  Icon,
  titel,
  tekst,
  cta,
  onCta,
  tone,
}: {
  Icon: LucideIcon;
  titel: string;
  tekst: string;
  cta: string;
  onCta: () => void;
  tone: string;
}) {
  return (
    <Card className="flex flex-col items-center px-6 py-16 text-center" shape={SHAPE.blobHi}>
      <span
        className="flex h-20 w-20 items-center justify-center"
        style={{ color: tone, background: `${tone}1a`, borderRadius: SHAPE.blob }}
        aria-hidden="true"
      >
        <Icon size={32} />
      </span>
      <p className="mt-5 text-[22px] font-extrabold" style={{ color: C.ink, ...display }}>
        {titel}
      </p>
      <p className="mt-2 max-w-sm text-[14px] leading-relaxed" style={{ color: C.inkMute }}>
        {tekst}
      </p>
      <Btn variant="filled" tone={tone} className="mt-6" onClick={onCta}>
        <RefreshCw size={16} aria-hidden="true" /> {cta}
      </Btn>
    </Card>
  );
}

function MarktKaart({ opdracht, onOpen }: { opdracht: Opdracht; onOpen: () => void }) {
  const [open, setOpen] = useState(false);
  const strong = opdracht.match >= 90;
  const tone = strong ? C.g40 : C.p40;
  return (
    <Card as="article" className="ex-pop overflow-hidden" shape={SHAPE.soft}>
      <div className="flex items-start gap-4 p-5 sm:p-6">
        <span className="shrink-0 text-center">
          <MatchRing value={opdracht.match} tone={tone} size={64} />
          <span
            className="mt-2 block px-2.5 py-0.5 text-[10px] font-extrabold uppercase tracking-[0.06em]"
            style={{ color: tone, background: strong ? C.g90 : C.p90, borderRadius: 99 }}
          >
            {strong ? "top match" : "goede match"}
          </span>
        </span>
        <div className="min-w-0 flex-1">
          <span className="text-[11px] font-bold" style={{ color: C.inkFaint, ...mono }}>
            {opdracht.id}
          </span>
          <h3
            className="mt-1 text-[18px] font-extrabold leading-snug"
            style={{ color: C.ink, ...display }}
          >
            {opdracht.titel}
          </h3>
          <p className="mt-1 text-[13px]" style={{ color: C.inkMute }}>
            {opdracht.opdrachtgever} · {opdracht.plaats} · {opdracht.uren} · {opdracht.start}
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            {opdracht.tags.map((t) => (
              <span
                key={t}
                className="px-3 py-1 text-[12px] font-semibold"
                style={{ background: C.surfaceLo, color: C.inkSoft, borderRadius: 99 }}
              >
                {t}
              </span>
            ))}
          </div>
        </div>
        <span className="hidden shrink-0 text-right sm:block">
          <span className="block text-[18px] font-extrabold" style={{ color: C.ink, ...mono }}>
            {opdracht.tarief.replace(" / uur", "")}
          </span>
          <span
            className="text-[10px] font-bold uppercase tracking-[0.08em]"
            style={{ color: C.inkFaint }}
          >
            per uur
          </span>
        </span>
      </div>

      <div
        className="flex flex-wrap items-center gap-2 px-5 py-3 sm:px-6"
        style={{ borderTop: `1px solid ${C.lineSoft}`, background: C.surfaceLo }}
      >
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-[13px] font-bold ${RING}`}
          style={{ color: tone, borderRadius: 99 }}
        >
          {open ? <X size={15} aria-hidden="true" /> : <ListChecks size={15} aria-hidden="true" />}
          Waarom deze match
        </button>
        <div className="ml-auto">
          <Btn variant="filled" size="sm" tone={tone} onClick={onOpen}>
            Reageer <ArrowRight size={14} aria-hidden="true" />
          </Btn>
        </div>
      </div>

      <div
        className="grid transition-all duration-300 motion-reduce:transition-none"
        style={{ gridTemplateRows: open ? "1fr" : "0fr" }}
      >
        <div className="overflow-hidden">
          <div
            className="grid grid-cols-1 gap-6 p-5 sm:grid-cols-2 sm:p-6"
            style={{ borderTop: `1px solid ${C.lineSoft}` }}
          >
            <RedenKolom
              titel="In je voordeel"
              tone={C.g40}
              Icon={ThumbsUp}
              items={opdracht.redenen.plus}
            />
            <RedenKolom
              titel="Goed om te weten"
              tone={C.t40}
              Icon={TriangleAlert}
              items={opdracht.redenen.min}
            />
          </div>
        </div>
      </div>
    </Card>
  );
}

function RedenKolom({
  titel,
  tone,
  Icon,
  items,
}: {
  titel: string;
  tone: string;
  Icon: LucideIcon;
  items: string[];
}) {
  return (
    <div>
      <p
        className="flex items-center gap-2 text-[12px] font-bold uppercase tracking-[0.1em]"
        style={{ color: tone }}
      >
        <Icon size={14} aria-hidden="true" /> {titel}
      </p>
      <ul className="mt-3 space-y-2.5">
        {items.map((r) => (
          <li
            key={r}
            className="flex items-start gap-2.5 text-[13.5px] leading-snug"
            style={{ color: C.inkSoft }}
          >
            <span
              className="mt-1.5 h-2 w-2 shrink-0 rounded-full"
              style={{ background: tone }}
              aria-hidden="true"
            />
            <span>{r}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

// —————————————————————————————————————— Opdracht-detail ——————————————————————————————————————
function OpdrachtDetail({ opdracht, onBack }: { opdracht: Opdracht; onBack: () => void }) {
  const strong = opdracht.match >= 90;
  const tone = strong ? C.g40 : C.p40;
  const feiten = [
    { l: "Tarief", v: opdracht.tarief.replace(" / uur", ""), s: "per uur" },
    { l: "Omvang", v: opdracht.uren, s: "per week" },
    { l: "Start", v: opdracht.start, s: "aanvang" },
    { l: "Match", v: `${opdracht.match}%`, s: "op profiel" },
  ];
  return (
    <div className="space-y-6">
      <Btn variant="text" size="sm" onClick={onBack}>
        <ArrowLeft size={15} aria-hidden="true" /> Terug naar marktplaats
      </Btn>

      <Card className="overflow-hidden" shape={SHAPE.soft}>
        <div className="p-6 sm:p-8" style={{ background: strong ? C.g90 : C.p95 }}>
          <div className="flex items-center gap-3">
            <MatchRing value={opdracht.match} tone={tone} size={68} />
            <div>
              <StatusChip
                fg={tone}
                bg={C.surfaceHi}
                label={strong ? "Top match" : "Goede match"}
                Icon={Sparkles}
                alarm={false}
                size="sm"
              />
              <span
                className="mt-1.5 block text-[11px] font-bold"
                style={{ color: C.inkMute, ...mono }}
              >
                {opdracht.id}
              </span>
            </div>
          </div>
          <h1
            className="mt-4 max-w-2xl text-[28px] font-extrabold leading-[1.08] md:text-[34px]"
            style={{ color: C.ink, ...display }}
          >
            {opdracht.titel}
          </h1>
          <p className="mt-2 flex items-center gap-1.5 text-[14px]" style={{ color: C.inkSoft }}>
            <MapPin size={15} aria-hidden="true" /> {opdracht.opdrachtgever} · {opdracht.plaats}
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            {opdracht.tags.map((t) => (
              <span
                key={t}
                className="px-3 py-1 text-[12px] font-semibold"
                style={{ background: C.surfaceHi, color: C.inkSoft, borderRadius: 99 }}
              >
                {t}
              </span>
            ))}
          </div>
          <div className="mt-6 flex flex-wrap gap-3">
            <Btn variant="filled" size="lg" tone={tone}>
              Reageer op opdracht <ArrowRight size={18} aria-hidden="true" />
            </Btn>
            <Btn variant="tonal" size="lg">
              <Bookmark size={17} aria-hidden="true" /> Bewaar
            </Btn>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4">
          {feiten.map((m, i) => (
            <div
              key={m.l}
              className="p-5"
              style={{
                borderRight: i < 3 ? `1px solid ${C.lineSoft}` : "none",
                borderTop: i >= 2 ? `1px solid ${C.lineSoft}` : `1px solid ${C.lineSoft}`,
              }}
            >
              <p
                className="text-[11px] font-bold uppercase tracking-[0.1em]"
                style={{ color: C.inkMute }}
              >
                {m.l}
              </p>
              <p
                className="mt-1.5 text-[20px] font-extrabold leading-none"
                style={{ color: C.ink, ...mono }}
              >
                {m.v}
              </p>
              <p className="mt-1 text-[11px]" style={{ color: C.inkFaint }}>
                {m.s}
              </p>
            </div>
          ))}
        </div>
      </Card>

      <Card className="p-6 sm:p-8" shape={SHAPE.soft}>
        <Kicker>
          <ListChecks size={15} aria-hidden="true" /> Waarom deze match — volledig navolgbaar
        </Kicker>
        <p className="mt-2 max-w-xl text-[14px] leading-relaxed" style={{ color: C.inkMute }}>
          Afgezet tegen je geverifieerde profiel. Geen verborgen score — je ziet precies wat
          meetelt.
        </p>
        <div className="mt-6 grid grid-cols-1 gap-8 md:grid-cols-2">
          <RedenDetail
            titel="In je voordeel"
            tone={C.g40}
            Icon={Check}
            items={opdracht.redenen.plus}
          />
          <RedenDetail
            titel="Goed om te weten"
            tone={C.t40}
            Icon={TriangleAlert}
            items={opdracht.redenen.min}
          />
        </div>
      </Card>

      <Card className="p-6" shape={SHAPE.blob} tint={C.p95}>
        <Kicker>
          <ShieldCheck size={15} aria-hidden="true" /> Vereiste certificaten
        </Kicker>
        <div className="mt-3 flex flex-wrap gap-2.5">
          {CREDENTIALS.map((c) => {
            const t = credTone(c.status);
            return (
              <StatusChip key={c.naam} {...t} label={`${c.naam.split(" ")[0]} · ${t.label}`} />
            );
          })}
        </div>
      </Card>
    </div>
  );
}

function RedenDetail({
  titel,
  tone,
  Icon,
  items,
}: {
  titel: string;
  tone: string;
  Icon: LucideIcon;
  items: string[];
}) {
  return (
    <div>
      <p
        className="flex items-center gap-2 text-[13px] font-bold uppercase tracking-[0.1em]"
        style={{ color: tone }}
      >
        <Icon size={15} aria-hidden="true" /> {titel}
      </p>
      <ul className="mt-4 space-y-3.5">
        {items.map((r) => (
          <li
            key={r}
            className="flex items-start gap-3 text-[14px] leading-snug"
            style={{ color: C.inkSoft }}
          >
            <span
              className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center"
              style={{ background: `${tone}1f`, color: tone, borderRadius: SHAPE.chip }}
              aria-hidden="true"
            >
              <Icon size={13} />
            </span>
            {r}
          </li>
        ))}
      </ul>
    </div>
  );
}

// —————————————————————————————————————— Verificatie ——————————————————————————————————————
function Verificatie() {
  const [open, setOpen] = useState<string | null>(CREDENTIALS[0]?.naam ?? null);
  const verified = CREDENTIALS.filter((c) => c.status === "VERIFIED").length;
  const ratio = Math.round((verified / CREDENTIALS.length) * 100);
  return (
    <div className="space-y-6">
      <ScreenHead
        eyebrow="Verificatie"
        title="Jouw certificaten"
        sub={`${verified} van ${CREDENTIALS.length} geverifieerd · ${PROFIEL.trust}.`}
        tone={C.g40}
        right={
          <Card className="px-5 py-3 text-right" shape={SHAPE.blob} tint={C.g90}>
            <p
              className="text-[30px] font-extrabold leading-none"
              style={{ color: C.g30, ...mono }}
            >
              {ratio}%
            </p>
            <p
              className="text-[11px] font-bold uppercase tracking-[0.12em]"
              style={{ color: C.g40 }}
            >
              geverifieerd
            </p>
          </Card>
        }
      />

      <Card className="flex flex-wrap items-center gap-x-6 gap-y-3 p-5" shape={SHAPE.soft}>
        {(["VERIFIED", "SUBMITTED", "EXPIRING", "REJECTED"] as CredStatus[]).map((st) => {
          const t = credTone(st);
          const count = CREDENTIALS.filter((c) => c.status === st).length;
          return (
            <span key={st} className="inline-flex items-center gap-2">
              <span className="text-[18px] font-extrabold" style={{ color: t.fg, ...mono }}>
                {count}
              </span>
              <StatusChip {...t} size="sm" />
            </span>
          );
        })}
      </Card>

      <ul className="space-y-3">
        {CREDENTIALS.map((c) => {
          const t = credTone(c.status);
          const isOpen = open === c.naam;
          return (
            <li key={c.naam}>
              <Card as="article" className="overflow-hidden" shape={SHAPE.soft}>
                <button
                  type="button"
                  onClick={() => setOpen(isOpen ? null : c.naam)}
                  aria-expanded={isOpen}
                  className={`flex w-full items-center gap-4 px-5 py-4 text-left ${RING}`}
                >
                  <span
                    className="flex h-12 w-12 shrink-0 items-center justify-center"
                    style={{ background: t.bg, color: t.fg, borderRadius: SHAPE.blob }}
                    aria-hidden="true"
                  >
                    <t.Icon size={20} />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-[15px] font-bold" style={{ color: C.ink }}>
                      {c.naam}
                    </span>
                    <span
                      className="block truncate text-[12.5px]"
                      style={{ color: t.alarm ? t.fg : C.inkMute }}
                    >
                      {c.detail}
                    </span>
                  </span>
                  <span className="hidden sm:inline-flex">
                    <StatusChip {...t} />
                  </span>
                  <ChevronRight
                    size={18}
                    aria-hidden="true"
                    style={{
                      color: C.inkFaint,
                      transform: isOpen ? "rotate(90deg)" : "none",
                      transition: "transform 0.24s cubic-bezier(0.34,1.56,0.64,1)",
                    }}
                  />
                </button>
                <div
                  className="grid transition-all duration-300 motion-reduce:transition-none"
                  style={{ gridTemplateRows: isOpen ? "1fr" : "0fr" }}
                >
                  <div className="overflow-hidden">
                    <div
                      className="px-5 pb-5 sm:pl-[76px]"
                      style={{ borderTop: `1px solid ${C.lineSoft}`, paddingTop: 14 }}
                    >
                      <span className="mb-3 inline-flex sm:hidden">
                        <StatusChip {...t} size="sm" />
                      </span>
                      <p
                        className="max-w-xl text-[13px] leading-relaxed"
                        style={{ color: C.inkSoft }}
                      >
                        {c.detail}. Je bewijsstuk wordt versleuteld bewaard en alleen na jouw
                        toestemming door een opdrachtgever ingezien.
                      </p>
                      <div className="mt-4 flex flex-wrap gap-2.5">
                        <Btn size="sm" variant="filled" tone={t.fg}>
                          {c.status === "EXPIRING"
                            ? "Vernieuwen"
                            : c.status === "REJECTED"
                              ? "Opnieuw indienen"
                              : "Bekijken"}
                        </Btn>
                        <Btn size="sm" variant="outline">
                          Details
                        </Btn>
                      </div>
                    </div>
                  </div>
                </div>
              </Card>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

// —————————————————————————————————————— Acties ——————————————————————————————————————
function Acties({ onMarkt, onFacturen }: { onMarkt: () => void; onFacturen: () => void }) {
  return (
    <div className="space-y-6">
      <ScreenHead
        eyebrow="Acties"
        title="Wat vraagt jouw aandacht"
        sub="Op volgorde van urgentie. Elke actie brengt je een stap verder."
        tone={C.t40}
      />
      <ol className="space-y-4">
        {ACTIES.map((a, i) => {
          const warn = a.urgentie === "warning";
          const tone = warn ? C.t40 : C.p40;
          const goMarkt = a.cta.toLowerCase().includes("match");
          const goFacturen = a.cta.toLowerCase().includes("herinner");
          return (
            <li key={a.titel}>
              <Card
                className="ex-pop flex items-start gap-4 p-5 sm:p-6"
                shape={i % 2 === 0 ? SHAPE.blob : SHAPE.blobHi}
                tint={warn ? C.t90 : C.surface}
              >
                <span
                  className="flex h-12 w-12 shrink-0 items-center justify-center text-[16px] font-extrabold"
                  style={{
                    background: warn ? C.surfaceHi : C.p90,
                    color: tone,
                    borderRadius: SHAPE.blob,
                    ...mono,
                  }}
                  aria-hidden="true"
                >
                  {String(i + 1).padStart(2, "0")}
                </span>
                <div className="min-w-0 flex-1">
                  <Kicker tone={tone}>
                    {warn ? (
                      <TriangleAlert size={14} aria-hidden="true" />
                    ) : (
                      <Sparkles size={14} aria-hidden="true" />
                    )}
                    {warn ? "Urgent" : "Aanbevolen"}
                  </Kicker>
                  <h2
                    className="mt-1.5 text-[17px] font-extrabold leading-snug"
                    style={{ color: C.ink }}
                  >
                    {a.titel}
                  </h2>
                  <p
                    className="mt-1 max-w-lg text-[13.5px] leading-relaxed"
                    style={{ color: C.inkSoft }}
                  >
                    {a.detail}
                  </p>
                  <div className="mt-4">
                    <Btn
                      variant={warn ? "filled" : "tonal"}
                      size="sm"
                      tone={tone}
                      onClick={goMarkt ? onMarkt : goFacturen ? onFacturen : undefined}
                    >
                      {a.cta} <ArrowRight size={14} aria-hidden="true" />
                    </Btn>
                  </div>
                </div>
              </Card>
            </li>
          );
        })}
      </ol>
    </div>
  );
}

// —————————————————————————————————————— Facturen ——————————————————————————————————————
function Facturen() {
  const [sort, setSort] = useState<"datum" | "bedrag">("datum");
  const [sel, setSel] = useState<string>(FACTUREN[0]?.nr ?? "");

  const rows = useMemo(() => {
    if (sort === "datum") return FACTUREN;
    return [...FACTUREN].sort((a, b) => parseEUR(b.bedrag) - parseEUR(a.bedrag));
  }, [sort]);

  const totals = useMemo(() => {
    const sum = (status: string) =>
      FACTUREN.filter((f) => f.status === status).reduce((a, f) => a + parseEUR(f.bedrag), 0);
    return { betaald: sum("Betaald"), open: sum("Openstaand"), concept: sum("Concept") };
  }, []);

  const selected = FACTUREN.find((f) => f.nr === sel) ?? FACTUREN[0];

  return (
    <div className="space-y-6">
      <ScreenHead
        eyebrow="Facturen"
        title="Je facturatie"
        sub="Klik een regel voor de opbouw van het bedrag."
        right={
          <Btn variant="filled" size="sm">
            <Plus size={16} aria-hidden="true" /> Nieuwe factuur
          </Btn>
        }
      />

      <section className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {[
          { l: "Betaald", v: totals.betaald, sub: "2 facturen", fg: C.g30, bg: C.g90, Icon: Check },
          {
            l: "Openstaand",
            v: totals.open,
            sub: "1 factuur · 9 dagen",
            fg: C.t30,
            bg: C.t90,
            Icon: Clock,
          },
          {
            l: "Concept",
            v: totals.concept,
            sub: "klaar om te versturen",
            fg: C.p30,
            bg: C.p90,
            Icon: FileText,
          },
        ].map((s, i) => (
          <Card
            key={s.l}
            className="ex-pop p-5"
            shape={i % 2 === 0 ? SHAPE.blob : SHAPE.blobHi}
            tint={s.bg}
          >
            <div className="flex items-center justify-between">
              <p
                className="text-[11px] font-bold uppercase tracking-[0.12em]"
                style={{ color: s.fg }}
              >
                {s.l}
              </p>
              <s.Icon size={16} aria-hidden="true" style={{ color: s.fg }} />
            </div>
            <p
              className="mt-2 text-[24px] font-extrabold leading-none"
              style={{ color: C.ink, ...mono }}
            >
              {eur0.format(s.v)}
            </p>
            <p className="mt-1 text-[12px]" style={{ color: C.inkMute }}>
              {s.sub}
            </p>
          </Card>
        ))}
      </section>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1.5fr_1fr]">
        <Card className="overflow-hidden" shape={SHAPE.soft}>
          <div className="flex items-center justify-between px-5 py-4">
            <Kicker>
              <Receipt size={15} aria-hidden="true" /> Facturen
            </Kicker>
            <div className="flex items-center gap-2" role="group" aria-label="Facturen sorteren">
              {(["datum", "bedrag"] as const).map((s) => (
                <Btn
                  key={s}
                  size="sm"
                  variant={sort === s ? "filled" : "outline"}
                  onClick={() => setSort(s)}
                >
                  {s === "datum" ? "Datum" : "Bedrag"}
                </Btn>
              ))}
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left" style={{ minWidth: 480 }}>
              <caption className="sr-only">Overzicht van facturen</caption>
              <thead>
                <tr style={{ borderBottom: `1px solid ${C.line}` }}>
                  {["Nummer", "Klant", "Datum", "Bedrag", "Status"].map((h, i) => (
                    <th
                      key={h}
                      scope="col"
                      className={`px-4 py-2.5 text-[11px] font-bold uppercase tracking-[0.1em] ${i === 3 ? "text-right" : ""}`}
                      style={{ color: C.inkMute }}
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.map((f) => {
                  const t = factuurTone(f.status);
                  const on = f.nr === sel;
                  return (
                    <tr
                      key={f.nr}
                      className={`ex-row cursor-pointer ${RING}`}
                      tabIndex={0}
                      role="button"
                      aria-pressed={on}
                      onClick={() => setSel(f.nr)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") {
                          e.preventDefault();
                          setSel(f.nr);
                        }
                      }}
                      style={{
                        borderTop: `1px solid ${C.lineSoft}`,
                        background: on ? C.p95 : undefined,
                      }}
                    >
                      <td
                        className="px-4 py-3.5 text-[12px] font-bold"
                        style={{ color: on ? C.p30 : C.inkSoft, ...mono }}
                      >
                        {f.nr}
                      </td>
                      <td className="px-4 py-3.5 text-[13px] font-bold" style={{ color: C.ink }}>
                        {f.klant}
                      </td>
                      <td className="px-4 py-3.5 text-[12px]" style={{ color: C.inkMute, ...mono }}>
                        {f.datum}
                      </td>
                      <td
                        className="px-4 py-3.5 text-right text-[13px] font-extrabold"
                        style={{ color: C.ink, ...mono }}
                      >
                        {f.bedrag}
                      </td>
                      <td className="px-4 py-3.5">
                        <span
                          className="inline-flex items-center gap-1.5 text-[12px] font-bold"
                          style={{ color: t.fg }}
                        >
                          <t.Icon size={13} aria-hidden="true" /> {t.label}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>

        {selected && <Opbouw factuur={selected} />}
      </div>
    </div>
  );
}

function Opbouw({ factuur }: { factuur: (typeof FACTUREN)[number] }) {
  const total = parseEUR(factuur.bedrag);
  const subtotal = Math.round(total / 1.21);
  const btw = total - subtotal;
  const t = factuurTone(factuur.status);
  return (
    <Card as="article" className="overflow-hidden" shape={SHAPE.blobHi}>
      <div className="p-6" style={{ background: t.bg }}>
        <p className="text-[11px] font-bold uppercase tracking-[0.14em]" style={{ color: t.fg }}>
          Factuur
        </p>
        <p className="text-[20px] font-extrabold" style={{ color: C.ink, ...mono }}>
          {factuur.nr}
        </p>
      </div>
      <div className="space-y-3.5 p-6 text-[13px]">
        <Row label="Klant" value={factuur.klant} />
        <Row label="Datum" value={factuur.datum} isMono />
        <div className="flex items-baseline justify-between">
          <span className="text-[13px]" style={{ color: C.inkMute }}>
            Status
          </span>
          <StatusChip {...t} size="sm" />
        </div>
        <div className="my-3 h-px" style={{ background: C.line }} />
        <Row label="Subtotaal" value={eur0.format(subtotal)} isMono />
        <Row label="Btw 21%" value={eur0.format(btw)} isMono />
        <div className="my-3 h-px" style={{ background: t.fg, opacity: 0.3 }} />
        <div className="flex items-baseline justify-between">
          <span
            className="text-[13px] font-extrabold uppercase tracking-[0.1em]"
            style={{ color: C.ink }}
          >
            Totaal
          </span>
          <span className="text-[22px] font-extrabold" style={{ color: t.fg, ...mono }}>
            {factuur.bedrag}
          </span>
        </div>
        <div className="mt-5 flex gap-2.5">
          <Btn variant="filled" size="sm" full tone={t.fg}>
            {factuur.status === "Concept"
              ? "Versturen"
              : factuur.status === "Openstaand"
                ? "Herinnering"
                : "Download"}
            <ArrowRight size={14} aria-hidden="true" />
          </Btn>
          <Btn variant="outline" size="sm">
            PDF
          </Btn>
        </div>
      </div>
    </Card>
  );
}

function Row({ label, value, isMono = false }: { label: string; value: string; isMono?: boolean }) {
  return (
    <div className="flex items-baseline justify-between gap-2">
      <span className="shrink-0 text-[13px]" style={{ color: C.inkMute }}>
        {label}
      </span>
      <span
        className="shrink-0 text-right text-[13px] font-bold"
        style={{ color: C.ink, ...(isMono ? mono : sans) }}
      >
        {value}
      </span>
    </div>
  );
}
