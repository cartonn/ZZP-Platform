"use client";

// Concept 538 — "Mijlpaal" · Gamified voortgang, maar B2B-gedisciplineerd. Het platform als een
// reis met betekenisvolle mijlpalen: voortgangsringen, streaks en een tijdlijn die echte
// platformdata weerspiegelt (geverifieerde bewijzen, matches, betaalde facturen). Subtiele
// celebratie-momenten, nooit kinderachtig — elke ring en elke streak staat voor iets dat er toe doet.
// Motiverend, strak en zakelijk. Status krijgt altijd label + icoon (nooit alleen kleur).

import { useMemo, useState, type CSSProperties, type ReactNode } from "react";
import {
  Activity,
  ArrowLeft,
  ArrowRight,
  Award,
  BadgeCheck,
  Check,
  ChevronRight,
  Clock,
  Compass,
  FileText,
  Flag,
  Flame,
  Gauge,
  MapPin,
  Medal,
  Plus,
  Receipt,
  RotateCcw,
  Search,
  Send,
  ShieldCheck,
  Sparkles,
  Store,
  Target,
  TrendingUp,
  Trophy,
  X,
  Zap,
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
  type ScreenKey,
  type CredStatus,
  type Opdracht,
} from "./mock";

// ————————————————————————————— Palet — gedisciplineerd, met celebratie-accenten —————————————————————————————
const C = {
  bg: "#f5f6fa",
  paper: "#ffffff",
  panel: "#ffffff",
  sink: "#eef1f7",
  wash: "#f8f9fc",
  line: "#e2e6ef",
  lineSoft: "#edeff5",
  ink: "#111726",
  inkSoft: "#3c4658",
  inkMute: "#6c7688",
  inkFaint: "#9aa3b3",
  indigo: "#4f46e5",
  indigoSoft: "#e9e8fd",
  indigoDeep: "#3730a3",
  emerald: "#12996b",
  emeraldSoft: "#d6f2e6",
  emeraldDeep: "#0a6b4a",
  amber: "#d18606",
  amberSoft: "#fbedcf",
  amberDeep: "#a15c00",
  rose: "#d6395b",
  roseSoft: "#fadbe2",
  roseDeep: "#a11f40",
  gold: "#e0a94a",
};

const sans: CSSProperties = {
  fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif",
};
const mono: CSSProperties = {
  fontFamily: "'SF Mono', 'JetBrains Mono', ui-monospace, 'Menlo', 'Consolas', monospace",
  fontVariantNumeric: "tabular-nums",
  fontFeatureSettings: "'tnum' 1",
};
const RING =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4f46e5] focus-visible:ring-offset-2 focus-visible:ring-offset-[#f5f6fa]";

// ————————————————————————————— Status-taal (label + icoon) —————————————————————————————
type Tone = {
  base: string;
  soft: string;
  deep: string;
  label: string;
  Icon: LucideIcon;
  alarm: boolean;
};

function credTone(s: CredStatus): Tone {
  switch (s) {
    case "VERIFIED":
      return {
        base: C.emerald,
        soft: C.emeraldSoft,
        deep: C.emeraldDeep,
        label: "Behaald",
        Icon: BadgeCheck,
        alarm: false,
      };
    case "SUBMITTED":
      return {
        base: C.indigo,
        soft: C.indigoSoft,
        deep: C.indigoDeep,
        label: "In beoordeling",
        Icon: Clock,
        alarm: false,
      };
    case "EXPIRING":
      return {
        base: C.amber,
        soft: C.amberSoft,
        deep: C.amberDeep,
        label: "Verloopt bijna",
        Icon: Clock,
        alarm: true,
      };
    case "REJECTED":
      return {
        base: C.rose,
        soft: C.roseSoft,
        deep: C.roseDeep,
        label: "Opnieuw nodig",
        Icon: RotateCcw,
        alarm: true,
      };
  }
}

function factuurTone(status: string): {
  base: string;
  soft: string;
  deep: string;
  label: string;
  Icon: LucideIcon;
} {
  if (status === "Betaald")
    return {
      base: C.emerald,
      soft: C.emeraldSoft,
      deep: C.emeraldDeep,
      label: "Betaald",
      Icon: Check,
    };
  if (status === "Openstaand")
    return {
      base: C.amber,
      soft: C.amberSoft,
      deep: C.amberDeep,
      label: "Openstaand",
      Icon: Clock,
    };
  return {
    base: C.indigo,
    soft: C.indigoSoft,
    deep: C.indigoDeep,
    label: "Concept",
    Icon: FileText,
  };
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

// ————————————————————————————— Voortgangsring (SVG) —————————————————————————————
function Ring({
  value,
  size = 64,
  stroke = 6,
  tone = C.indigo,
  track = C.sink,
  children,
  label,
}: {
  value: number;
  size?: number;
  stroke?: number;
  tone?: string;
  track?: string;
  children?: ReactNode;
  label?: string;
}) {
  const r = (size - stroke) / 2;
  const circ = 2 * Math.PI * r;
  const off = circ - (Math.min(100, Math.max(0, value)) / 100) * circ;
  return (
    <span
      className="relative inline-flex items-center justify-center"
      style={{ width: size, height: size }}
      role="img"
      aria-label={label ?? `Voortgang ${value} procent`}
    >
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={track} strokeWidth={stroke} />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={tone}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={circ}
          strokeDashoffset={off}
          style={{ transition: "stroke-dashoffset 0.6s cubic-bezier(0.22,1,0.36,1)" }}
        />
      </svg>
      <span className="absolute inset-0 flex items-center justify-center">{children}</span>
    </span>
  );
}

function Bar({
  value,
  tone = C.indigo,
  track = C.sink,
  height = 8,
}: {
  value: number;
  tone?: string;
  track?: string;
  height?: number;
}) {
  return (
    <span
      className="block w-full overflow-hidden rounded-full"
      style={{ background: track, height }}
      role="img"
      aria-label={`Voortgang ${Math.round(value)} procent`}
    >
      <span
        className="block h-full rounded-full"
        style={{
          width: `${Math.min(100, Math.max(0, value))}%`,
          background: tone,
          transition: "width 0.6s cubic-bezier(0.22,1,0.36,1)",
        }}
      />
    </span>
  );
}

// ————————————————————————————— Primitives —————————————————————————————
function Card({
  children,
  className = "",
  as: Tag = "div",
  tone,
  accent = false,
}: {
  children: ReactNode;
  className?: string;
  as?: "div" | "section" | "article" | "aside" | "li";
  tone?: string;
  accent?: boolean;
}) {
  return (
    <Tag
      className={`relative overflow-hidden rounded-[14px] ${className}`}
      style={{
        background: C.panel,
        border: `1px solid ${tone && accent ? `${tone}55` : C.line}`,
        boxShadow: "0 1px 2px rgba(17,23,38,0.04), 0 8px 24px -20px rgba(17,23,38,0.35)",
      }}
    >
      {accent && tone && (
        <span
          className="absolute inset-x-0 top-0 h-[3px]"
          style={{ background: tone }}
          aria-hidden="true"
        />
      )}
      <span className="relative block">{children}</span>
    </Tag>
  );
}

function Btn({
  children,
  onClick,
  variant = "solid",
  size = "md",
  className = "",
  tone = C.indigo,
  deep = C.indigoDeep,
  ariaLabel,
  ariaExpanded,
  full = false,
}: {
  children: ReactNode;
  onClick?: () => void;
  variant?: "solid" | "outline" | "ghost";
  size?: "sm" | "md";
  className?: string;
  tone?: string;
  deep?: string;
  ariaLabel?: string;
  ariaExpanded?: boolean;
  full?: boolean;
}) {
  const pad = size === "sm" ? "px-3.5 py-2 text-[12.5px]" : "px-4.5 py-2.5 text-[13.5px]";
  const base = `inline-flex items-center justify-center gap-2 rounded-[9px] font-semibold tracking-[-0.01em] transition-all duration-150 active:translate-y-px ${RING} ${full ? "w-full" : ""}`;
  const style: CSSProperties =
    variant === "solid"
      ? {
          background: tone,
          color: "#ffffff",
          border: `1px solid ${deep}`,
          boxShadow: `0 6px 16px -10px ${tone}cc`,
          ...sans,
        }
      : variant === "outline"
        ? { background: C.panel, color: deep, border: `1px solid ${tone}66`, ...sans }
        : { background: "transparent", color: C.inkSoft, border: "1px solid transparent", ...sans };
  const hover = variant === "solid" ? "hover:brightness-108" : "hover:bg-[#eef1f7]";
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={ariaLabel}
      aria-expanded={ariaExpanded}
      className={`${base} ${pad} ${hover} ${className}`}
      style={style}
    >
      {children}
    </button>
  );
}

function StatusTag({ base, soft, label, Icon, alarm }: Tone) {
  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[11px] font-semibold"
      style={{ color: base, background: soft, border: `1px solid ${base}44`, ...sans }}
    >
      <Icon size={12} aria-hidden="true" />
      {label}
      {alarm && <span className="sr-only"> (actie nodig)</span>}
    </span>
  );
}

function Kicker({ children, tone = C.inkMute }: { children: ReactNode; tone?: string }) {
  return (
    <span
      className="inline-flex items-center gap-1.5 text-[10.5px] font-bold uppercase tracking-[0.16em]"
      style={{ color: tone, ...sans }}
    >
      {children}
    </span>
  );
}

// Niveau-badge — afgeleid van echte compleetheid, geen loze badge
function levelFrom(pct: number): { naam: string; Icon: LucideIcon; tone: string; deep: string } {
  if (pct >= 90) return { naam: "Uitmuntend", Icon: Trophy, tone: C.gold, deep: C.amberDeep };
  if (pct >= 70) return { naam: "Gevorderd", Icon: Medal, tone: C.indigo, deep: C.indigoDeep };
  if (pct >= 40)
    return { naam: "Op dreef", Icon: TrendingUp, tone: C.emerald, deep: C.emeraldDeep };
  return { naam: "Startklaar", Icon: Flag, tone: C.inkMute, deep: C.inkSoft };
}

function ScreenHead({
  kicker,
  title,
  sub,
  right,
  KIcon = Compass,
  tone = C.indigoDeep,
}: {
  kicker: string;
  title: string;
  sub?: string;
  right?: ReactNode;
  KIcon?: LucideIcon;
  tone?: string;
}) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
      <div className="min-w-0">
        <Kicker tone={tone}>
          <KIcon size={13} aria-hidden="true" /> {kicker}
        </Kicker>
        <h1
          className="mt-2 text-[25px] font-bold leading-tight tracking-[-0.02em] md:text-[30px]"
          style={{ color: C.ink }}
        >
          {title}
        </h1>
        {sub && (
          <p className="mt-1.5 max-w-xl text-[13px] leading-relaxed" style={{ color: C.inkMute }}>
            {sub}
          </p>
        )}
      </div>
      {right}
    </div>
  );
}

const NAV: Record<ScreenKey, { Icon: LucideIcon; etappe: string }> = {
  dashboard: { Icon: Gauge, etappe: "Etappe 1" },
  marktplaats: { Icon: Store, etappe: "Etappe 2" },
  opdracht: { Icon: MapPin, etappe: "Etappe 3" },
  verificatie: { Icon: ShieldCheck, etappe: "Etappe 4" },
  acties: { Icon: Target, etappe: "Etappe 5" },
  facturen: { Icon: Receipt, etappe: "Etappe 6" },
  documenten: { Icon: FileText, etappe: "Kluis" },
  berichten: { Icon: Activity, etappe: "Contact" },
};

// —————————————————————————————————————— Root ——————————————————————————————————————
export function Concept538() {
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
          <TopBar screen={screen} />
          <MobileNav screen={screen} setScreen={setScreen} />
          <main key={screen} className="mp-fade px-4 pb-24 pt-6 sm:px-6 md:px-8">
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
                onVerif={() => setScreen("verificatie")}
              />
            )}
            {screen === "facturen" && <Facturen />}
          </main>
        </div>
      </div>

      <style>{`
        @keyframes mpFade { from { opacity: 0; transform: translateY(6px); } to { opacity: 1; transform: none; } }
        .mp-fade { animation: mpFade 0.32s cubic-bezier(0.22,1,0.36,1) both; }
        @keyframes mpPop { 0% { transform: scale(0.8); opacity: 0; } 60% { transform: scale(1.08); } 100% { transform: scale(1); opacity: 1; } }
        .mp-pop { animation: mpPop 0.5s cubic-bezier(0.22,1,0.36,1) both; }
        .mp-row { transition: background 0.16s ease; }
        .mp-row:hover { background: ${C.wash}; }
        @media (prefers-reduced-motion: reduce) {
          .mp-fade, .mp-pop { animation: none !important; }
          .mp-row { transition: none !important; }
        }
      `}</style>
    </div>
  );
}

// —————————————————————————————————————— Sidebar ——————————————————————————————————————
function Sidebar({ screen, setScreen }: { screen: ScreenKey; setScreen: (s: ScreenKey) => void }) {
  const verified = CREDENTIALS.filter((c) => c.status === "VERIFIED").length;
  const ratio = Math.round((verified / CREDENTIALS.length) * 100);
  const lvl = levelFrom(ratio);
  return (
    <aside
      className="sticky top-0 hidden h-screen w-[238px] shrink-0 flex-col md:flex"
      style={{ background: C.paper, borderRight: `1px solid ${C.line}` }}
    >
      <div
        className="flex items-center gap-2.5 px-5 py-5"
        style={{ borderBottom: `1px solid ${C.line}` }}
      >
        <span
          className="flex h-9 w-9 items-center justify-center rounded-[10px]"
          style={{ background: C.indigo, color: "#fff", border: `1px solid ${C.indigoDeep}` }}
          aria-hidden="true"
        >
          <Flag size={17} />
        </span>
        <span>
          <span className="block text-[14px] font-bold tracking-[-0.01em]" style={{ color: C.ink }}>
            Mijlpaal
          </span>
          <span
            className="mt-0.5 block text-[9px] font-bold uppercase tracking-[0.18em]"
            style={{ color: C.indigo }}
          >
            jouw voortgang
          </span>
        </span>
      </div>

      <nav aria-label="Etappes" className="flex-1 overflow-y-auto px-3 py-4">
        <p
          className="px-2 pb-2 text-[9px] font-bold uppercase tracking-[0.18em]"
          style={{ color: C.inkFaint }}
        >
          De route
        </p>
        <ul className="space-y-0.5">
          {SCREENS.map((s, i) => {
            const on = s.key === screen;
            const { Icon } = NAV[s.key];
            const done = i < 2;
            return (
              <li key={s.key}>
                <button
                  type="button"
                  onClick={() => setScreen(s.key)}
                  aria-current={on ? "page" : undefined}
                  className={`group flex w-full items-center gap-2.5 rounded-[10px] px-2.5 py-2 text-left text-[13px] font-semibold transition-colors ${RING}`}
                  style={
                    on ? { background: C.indigoSoft, color: C.indigoDeep } : { color: C.inkSoft }
                  }
                >
                  <span
                    className="flex h-7 w-7 items-center justify-center rounded-[8px]"
                    style={{
                      background: on ? C.indigo : done ? C.emeraldSoft : C.sink,
                      color: on ? "#fff" : done ? C.emeraldDeep : C.inkMute,
                      border: `1px solid ${on ? C.indigoDeep : done ? `${C.emerald}55` : C.line}`,
                    }}
                    aria-hidden="true"
                  >
                    {done && !on ? <Check size={14} /> : <Icon size={14} />}
                  </span>
                  <span className="flex-1">{s.label}</span>
                  {done && !on && (
                    <Check size={13} style={{ color: C.emerald }} aria-label="afgerond" />
                  )}
                </button>
              </li>
            );
          })}
        </ul>
      </nav>

      <div className="px-4 py-4" style={{ borderTop: `1px solid ${C.line}` }}>
        <div
          className="mb-3 flex items-center gap-3 rounded-[12px] p-3"
          style={{ background: C.wash, border: `1px solid ${C.line}` }}
        >
          <Ring
            value={ratio}
            size={52}
            stroke={5}
            tone={lvl.tone}
            label={`Profielsterkte ${ratio} procent`}
          >
            <span className="text-[12px] font-bold" style={{ color: C.ink, ...mono }}>
              {ratio}
            </span>
          </Ring>
          <span className="min-w-0">
            <span
              className="flex items-center gap-1 text-[11.5px] font-bold"
              style={{ color: lvl.deep }}
            >
              <lvl.Icon size={12} aria-hidden="true" /> {lvl.naam}
            </span>
            <span className="mt-0.5 block text-[10px]" style={{ color: C.inkMute }}>
              Profielsterkte
            </span>
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span
            className="flex h-8 w-8 items-center justify-center rounded-full text-[11px] font-bold"
            style={{ background: C.indigo, color: "#fff", ...mono }}
            aria-hidden="true"
          >
            {PROFIEL.initialen}
          </span>
          <span className="min-w-0 flex-1">
            <span className="block truncate text-[12px] font-bold" style={{ color: C.ink }}>
              {PROFIEL.naam}
            </span>
            <span
              className="flex items-center gap-1 text-[10px] font-semibold"
              style={{ color: C.emeraldDeep }}
            >
              <ShieldCheck size={10} aria-hidden="true" /> {PROFIEL.trust}
            </span>
          </span>
        </div>
      </div>
    </aside>
  );
}

function TopBar({ screen }: { screen: ScreenKey }) {
  const open = FACTUREN.filter((f) => f.status === "Openstaand").reduce(
    (a, f) => a + parseEUR(f.bedrag),
    0,
  );
  return (
    <header
      className="sticky top-0 z-20 flex items-center gap-3 px-4 py-3 sm:px-6 md:px-8"
      style={{
        background: `${C.bg}ee`,
        borderBottom: `1px solid ${C.line}`,
        backdropFilter: "blur(8px)",
      }}
    >
      <div
        className="flex flex-1 items-center gap-2 rounded-[9px] px-3 py-2"
        style={{ background: C.panel, border: `1px solid ${C.line}` }}
      >
        <Search size={14} aria-hidden="true" style={{ color: C.inkFaint }} />
        <span className="truncate text-[12.5px]" style={{ color: C.inkFaint }}>
          Zoek opdrachten, bewijzen, facturen…
        </span>
        <span
          className="ml-auto hidden rounded-[5px] px-1.5 py-0.5 text-[10px] font-bold sm:inline"
          style={{ background: C.sink, color: C.inkMute, ...mono }}
        >
          ⌘K
        </span>
      </div>
      <span
        className="hidden items-center gap-1.5 rounded-[9px] px-3 py-2 text-[12px] font-semibold sm:inline-flex"
        style={{ background: C.amberSoft, color: C.amberDeep, border: `1px solid ${C.amber}44` }}
      >
        <Flame size={13} aria-hidden="true" />
        <span style={{ ...mono }}>4</span> dagen streak
      </span>
      <span
        className="hidden items-center gap-1.5 rounded-[9px] px-3 py-2 text-[12px] font-semibold lg:inline-flex"
        style={{ background: C.panel, color: C.inkSoft, border: `1px solid ${C.line}` }}
      >
        <Clock size={13} aria-hidden="true" style={{ color: C.amber }} />
        <span style={{ ...mono }}>{eur0.format(open)}</span> openstaand
      </span>
      <span
        className="hidden items-center gap-1.5 rounded-[9px] px-2.5 py-2 text-[10px] font-bold uppercase tracking-[0.12em] xl:inline-flex"
        style={{ background: C.indigoSoft, color: C.indigoDeep, border: `1px solid ${C.indigo}33` }}
        aria-label={NAV[screen].etappe}
      >
        <NavIcon screen={screen} /> {NAV[screen].etappe}
      </span>
    </header>
  );
}

function NavIcon({ screen }: { screen: ScreenKey }) {
  const { Icon } = NAV[screen];
  return <Icon size={12} aria-hidden="true" />;
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
      aria-label="Etappes"
      className="flex gap-1.5 overflow-x-auto px-4 py-2.5 md:hidden"
      style={{ borderBottom: `1px solid ${C.line}`, background: C.paper }}
    >
      {SCREENS.map((s) => {
        const on = s.key === screen;
        return (
          <button
            key={s.key}
            type="button"
            onClick={() => setScreen(s.key)}
            aria-current={on ? "page" : undefined}
            className={`shrink-0 rounded-[8px] px-3 py-1.5 text-[12.5px] font-semibold transition-colors ${RING}`}
            style={
              on
                ? { background: C.indigo, color: "#fff" }
                : { color: C.inkSoft, background: C.sink }
            }
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
  const betaald = FACTUREN.filter((f) => f.status === "Betaald").length;
  const lvl = levelFrom(ratio);

  // Betekenisvolle mijlpalen — allemaal afgeleid van echte data
  const mijlpalen = [
    {
      naam: "Profiel compleet",
      nu: verified,
      doel: CREDENTIALS.length,
      Icon: ShieldCheck,
      tone: C.emerald,
      deep: C.emeraldDeep,
      unit: "bewijzen",
    },
    {
      naam: "Matches boven 85%",
      nu: OPDRACHTEN.filter((o) => o.match >= 85).length,
      doel: OPDRACHTEN.length,
      Icon: Target,
      tone: C.indigo,
      deep: C.indigoDeep,
      unit: "opdrachten",
    },
    {
      naam: "Facturen voldaan",
      nu: betaald,
      doel: FACTUREN.length,
      Icon: Receipt,
      tone: C.amber,
      deep: C.amberDeep,
      unit: "facturen",
    },
  ];

  return (
    <div className="space-y-7">
      <ScreenHead
        kicker="Jouw reis"
        title={`Op koers, ${PROFIEL.naam.split(" ")[0]}`}
        sub="Elke stap telt. Je bent goed op weg — nog een paar mijlpalen tot het volgende niveau."
        KIcon={Gauge}
        right={
          <div className="flex gap-2">
            <Btn
              variant="outline"
              size="sm"
              tone={C.emerald}
              deep={C.emeraldDeep}
              onClick={onVerif}
            >
              <ShieldCheck size={13} aria-hidden="true" /> Bewijzen
            </Btn>
            <Btn variant="solid" size="sm" onClick={onActies}>
              Volgende stap <ArrowRight size={13} aria-hidden="true" />
            </Btn>
          </div>
        }
      />

      {/* Voortgangsbanner met niveau */}
      <Card tone={C.indigo} accent className="overflow-hidden">
        <div className="flex flex-col items-center gap-5 p-6 sm:flex-row sm:gap-7">
          <span className="mp-pop shrink-0">
            <Ring
              value={ratio}
              size={104}
              stroke={9}
              tone={lvl.tone}
              label={`Profielsterkte ${ratio} procent`}
            >
              <span className="flex flex-col items-center">
                <span
                  className="text-[26px] font-bold leading-none"
                  style={{ color: C.ink, ...mono }}
                >
                  {ratio}%
                </span>
                <span
                  className="mt-0.5 text-[9px] font-bold uppercase tracking-[0.14em]"
                  style={{ color: C.inkMute }}
                >
                  sterkte
                </span>
              </span>
            </Ring>
          </span>
          <div className="min-w-0 flex-1 text-center sm:text-left">
            <span
              className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[12px] font-bold"
              style={{
                background: `${lvl.tone}1f`,
                color: lvl.deep,
                border: `1px solid ${lvl.tone}55`,
              }}
            >
              <lvl.Icon size={14} aria-hidden="true" /> Niveau: {lvl.naam}
            </span>
            <p className="mt-2.5 text-[14.5px] leading-relaxed" style={{ color: C.inkSoft }}>
              Je profiel is <strong style={{ color: C.ink }}>{ratio}% compleet</strong>. Nog{" "}
              {CREDENTIALS.length - verified}{" "}
              {CREDENTIALS.length - verified === 1 ? "bewijs" : "bewijzen"} tot een volwaardig
              geverifieerd profiel — daarmee stijg je zichtbaar in de matchlijsten.
            </p>
            <div className="mt-3 max-w-md">
              <Bar value={ratio} tone={lvl.tone} />
            </div>
          </div>
        </div>
      </Card>

      {/* Mijlpalen */}
      <section>
        <Kicker tone={C.inkMute}>
          <Award size={13} aria-hidden="true" /> Mijlpalen deze maand
        </Kicker>
        <div className="mt-3 grid grid-cols-1 gap-4 sm:grid-cols-3">
          {mijlpalen.map((m) => {
            const pct = Math.round((m.nu / m.doel) * 100);
            const compleet = m.nu >= m.doel;
            return (
              <Card key={m.naam} tone={m.tone} accent={compleet} className="p-5">
                <div className="flex items-center justify-between">
                  <span
                    className="flex h-9 w-9 items-center justify-center rounded-[10px]"
                    style={{
                      background: `${m.tone}18`,
                      color: m.tone,
                      border: `1px solid ${m.tone}44`,
                    }}
                    aria-hidden="true"
                  >
                    <m.Icon size={17} />
                  </span>
                  {compleet ? (
                    <span
                      className="inline-flex items-center gap-1 text-[11px] font-bold"
                      style={{ color: m.deep }}
                    >
                      <BadgeCheck size={13} aria-hidden="true" /> Behaald
                    </span>
                  ) : (
                    <span
                      className="text-[11px] font-semibold"
                      style={{ color: C.inkMute, ...mono }}
                    >
                      {m.nu}/{m.doel}
                    </span>
                  )}
                </div>
                <p className="mt-3 text-[13.5px] font-bold" style={{ color: C.ink }}>
                  {m.naam}
                </p>
                <div className="mt-2.5">
                  <Bar value={pct} tone={m.tone} />
                </div>
                <p className="mt-2 text-[11px]" style={{ color: C.inkMute }}>
                  {m.nu} van {m.doel} {m.unit}
                </p>
              </Card>
            );
          })}
        </div>
      </section>

      {/* KPI's */}
      <section className="grid grid-cols-2 gap-4 xl:grid-cols-4">
        {KPIS.map((k) => (
          <Card key={k.label} className="p-4">
            <p className="text-[11px] font-semibold" style={{ color: C.inkMute }}>
              {k.label}
            </p>
            <p
              className="mt-1.5 text-[24px] font-bold leading-none tracking-[-0.02em]"
              style={{ color: C.ink, ...mono }}
            >
              {k.value}
            </p>
            <div className="mt-3 flex items-center justify-between">
              <span
                className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-bold"
                style={{
                  color: k.up ? C.emeraldDeep : C.amberDeep,
                  background: k.up ? C.emeraldSoft : C.amberSoft,
                }}
              >
                {k.up ? "▲" : "▼"} {k.trend}
              </span>
              <span className="inline-flex h-6 items-end gap-[3px]" aria-hidden="true">
                {k.spark.map((d, j) => {
                  const max = Math.max(...k.spark);
                  const min = Math.min(...k.spark);
                  const h = 3 + ((d - min) / (max - min || 1)) * 18;
                  const last = j === k.spark.length - 1;
                  return (
                    <span
                      key={j}
                      className="w-[3px] rounded-full"
                      style={{ height: h, background: last ? C.indigo : `${C.indigo}40` }}
                    />
                  );
                })}
              </span>
            </div>
          </Card>
        ))}
      </section>

      <section className="grid grid-cols-1 gap-5 lg:grid-cols-[1.5fr_1fr]">
        <Card className="overflow-hidden">
          <div
            className="flex items-center justify-between px-5 py-3.5"
            style={{ borderBottom: `1px solid ${C.lineSoft}` }}
          >
            <Kicker tone={C.indigoDeep}>
              <Store size={13} aria-hidden="true" /> Kanshebbers voor je volgende opdracht
            </Kicker>
            <button
              type="button"
              onClick={onMarkt}
              className={`rounded-[6px] px-1 text-[11.5px] font-semibold ${RING}`}
              style={{ color: C.indigo }}
            >
              Alle opdrachten →
            </button>
          </div>
          <ul>
            {OPDRACHTEN.map((o, i) => {
              const tone = o.match >= 90 ? C.emerald : C.indigo;
              return (
                <li key={o.id}>
                  <button
                    type="button"
                    onClick={onOpen}
                    className={`mp-row flex w-full items-center gap-3.5 px-5 py-3.5 text-left ${RING}`}
                    style={{ borderTop: i === 0 ? "none" : `1px solid ${C.lineSoft}` }}
                  >
                    <Ring
                      value={o.match}
                      size={46}
                      stroke={5}
                      tone={tone}
                      label={`Match ${o.match} procent`}
                    >
                      <span className="text-[11px] font-bold" style={{ color: tone, ...mono }}>
                        {o.match}
                      </span>
                    </Ring>
                    <span className="min-w-0 flex-1">
                      <span
                        className="block truncate text-[14px] font-bold"
                        style={{ color: C.ink }}
                      >
                        {o.titel}
                      </span>
                      <span
                        className="mt-0.5 flex items-center gap-1 truncate text-[11.5px]"
                        style={{ color: C.inkMute }}
                      >
                        <MapPin size={11} aria-hidden="true" /> {o.opdrachtgever} · {o.plaats}
                      </span>
                    </span>
                    <span className="hidden shrink-0 text-right sm:block">
                      <span
                        className="block text-[13.5px] font-bold"
                        style={{ color: C.ink, ...mono }}
                      >
                        {o.tarief.replace(" / uur", "")}
                      </span>
                      <span
                        className="text-[9px] font-bold uppercase tracking-[0.1em]"
                        style={{ color: C.inkFaint }}
                      >
                        p/uur
                      </span>
                    </span>
                    <ChevronRight size={16} aria-hidden="true" style={{ color: C.inkFaint }} />
                  </button>
                </li>
              );
            })}
          </ul>
        </Card>

        <div className="space-y-5">
          <Card className="p-5" tone={C.amber} accent>
            <Kicker tone={C.amberDeep}>
              <Zap size={13} aria-hidden="true" /> Volgende stap
            </Kicker>
            <h3 className="mt-2 text-[15px] font-bold leading-snug" style={{ color: C.ink }}>
              {primair.titel}
            </h3>
            <p className="mt-1.5 text-[12.5px] leading-relaxed" style={{ color: C.inkSoft }}>
              {primair.detail}
            </p>
            <Btn
              variant="solid"
              size="sm"
              full
              tone={C.amber}
              deep={C.amberDeep}
              className="mt-4"
              onClick={onActies}
            >
              {primair.cta} <ArrowRight size={13} aria-hidden="true" />
            </Btn>
          </Card>

          <Card className="p-5" tone={C.emerald} accent>
            <div className="flex items-center gap-3">
              <span
                className="flex h-11 w-11 items-center justify-center rounded-[12px]"
                style={{
                  background: C.emeraldSoft,
                  color: C.emeraldDeep,
                  border: `1px solid ${C.emerald}44`,
                }}
                aria-hidden="true"
              >
                <Flame size={20} />
              </span>
              <div className="min-w-0">
                <p className="text-[13.5px] font-bold" style={{ color: C.ink }}>
                  4 dagen op rij actief
                </p>
                <p className="text-[11.5px]" style={{ color: C.inkMute }}>
                  Reageer vandaag en houd je streak vast.
                </p>
              </div>
            </div>
            <div className="mt-3.5 flex items-center gap-1.5" aria-hidden="true">
              {[true, true, true, true, false, false, false].map((d, i) => (
                <span
                  key={i}
                  className="h-6 flex-1 rounded-[5px]"
                  style={{
                    background: d ? C.emerald : C.sink,
                    border: `1px solid ${d ? C.emeraldDeep : C.line}`,
                  }}
                />
              ))}
            </div>
            <p
              className="mt-2 text-[10.5px] font-semibold uppercase tracking-[0.1em]"
              style={{ color: C.inkFaint }}
            >
              ma · di · wo · do · vr · za · zo
            </p>
          </Card>
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
        kicker="Etappe 2 · Kansen"
        title="Marktplaats"
        sub={`${rows.length} van ${OPDRACHTEN.length} opdrachten passen bij je geverifieerde profiel. Elke reactie brengt je een mijlpaal dichterbij.`}
        KIcon={Store}
      />

      <Card className="flex flex-col gap-2.5 p-3 sm:flex-row sm:items-center">
        <div
          className="flex flex-1 items-center gap-2 rounded-[9px] px-3 py-2"
          style={{ background: C.sink, border: `1px solid ${C.line}` }}
        >
          <Search size={15} aria-hidden="true" style={{ color: C.inkFaint }} />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Filter op titel, plaats of opdrachtgever…"
            aria-label="Opdrachten filteren"
            className="w-full bg-transparent text-[13px] outline-none placeholder:text-[#9aa3b3]"
            style={{ color: C.ink }}
          />
          {q && (
            <button
              type="button"
              onClick={() => setQ("")}
              aria-label="Filter wissen"
              className={`flex h-5 w-5 items-center justify-center rounded-full ${RING}`}
              style={{ color: C.inkMute }}
            >
              <X size={13} aria-hidden="true" />
            </button>
          )}
        </div>
        <div className="flex items-center gap-1.5" role="group" aria-label="Sorteren">
          {(["match", "tarief"] as const).map((s) => (
            <Btn
              key={s}
              size="sm"
              variant={sort === s ? "solid" : "outline"}
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
              <Card className="space-y-3 p-5">
                <div
                  className="h-4 w-2/3 animate-pulse rounded-full motion-reduce:animate-none"
                  style={{ background: C.lineSoft }}
                />
                <div
                  className="h-3 w-1/2 animate-pulse rounded-full motion-reduce:animate-none"
                  style={{ background: C.lineSoft }}
                />
              </Card>
            </li>
          ))}
        </ul>
      ) : mode === "error" ? (
        <StateBlock
          Icon={RotateCcw}
          tone={C.rose}
          deep={C.roseDeep}
          titel="Even niet gelukt"
          tekst="De opdrachten konden niet worden geladen. Probeer het opnieuw — je voortgang blijft bewaard."
          cta="Opnieuw laden"
          onCta={() => setMode("ok")}
        />
      ) : rows.length === 0 ? (
        <StateBlock
          Icon={Search}
          tone={C.indigo}
          deep={C.indigoDeep}
          titel="Geen resultaten"
          tekst={`Niets gevonden voor ${q ? `“${q}”` : "je filter"}. Verruim je zoekopdracht en ontdek nieuwe kansen.`}
          cta="Filter wissen"
          onCta={() => setQ("")}
        />
      ) : (
        <ul className="space-y-4">
          {rows.map((o, i) => (
            <li key={o.id}>
              <MarktKaart opdracht={o} index={i} onOpen={onOpen} />
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
            className={`rounded-full text-[10px] font-bold uppercase tracking-[0.14em] underline-offset-2 hover:underline ${RING}`}
            style={{ color: C.inkFaint }}
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
  deep,
}: {
  Icon: LucideIcon;
  titel: string;
  tekst: string;
  cta: string;
  onCta: () => void;
  tone: string;
  deep: string;
}) {
  return (
    <Card className="flex flex-col items-center px-6 py-16 text-center" tone={tone} accent>
      <span
        className="flex h-16 w-16 items-center justify-center rounded-[16px]"
        style={{ color: tone, background: `${tone}18`, border: `1px solid ${tone}55` }}
        aria-hidden="true"
      >
        <Icon size={26} />
      </span>
      <p className="mt-4 text-[19px] font-bold" style={{ color: C.ink }}>
        {titel}
      </p>
      <p className="mt-2 max-w-sm text-[13px] leading-relaxed" style={{ color: C.inkSoft }}>
        {tekst}
      </p>
      <Btn variant="solid" tone={tone} deep={deep} className="mt-5" onClick={onCta}>
        {cta} <ArrowRight size={14} aria-hidden="true" />
      </Btn>
    </Card>
  );
}

function MarktKaart({
  opdracht,
  index,
  onOpen,
}: {
  opdracht: Opdracht;
  index: number;
  onOpen: () => void;
}) {
  const [open, setOpen] = useState(false);
  const strong = opdracht.match >= 90;
  const tone = strong ? C.emerald : C.indigo;
  const deep = strong ? C.emeraldDeep : C.indigoDeep;
  return (
    <Card as="article" className="overflow-hidden" tone={tone} accent={strong}>
      <div className="flex items-start gap-4 p-5">
        <span className="shrink-0 pt-0.5 text-center">
          <Ring
            value={opdracht.match}
            size={56}
            stroke={6}
            tone={tone}
            label={`Match ${opdracht.match} procent`}
          >
            <span className="text-[13px] font-bold" style={{ color: tone, ...mono }}>
              {opdracht.match}
            </span>
          </Ring>
          <span
            className="mt-2 block rounded-full px-2 py-0.5 text-[9.5px] font-bold uppercase tracking-[0.06em]"
            style={{ color: deep, background: `${tone}18`, border: `1px solid ${tone}55` }}
          >
            {strong ? "topmatch" : "match"}
          </span>
        </span>
        <div className="min-w-0 flex-1">
          <div
            className="flex items-center gap-2 text-[10px] font-bold"
            style={{ color: C.inkFaint, ...mono }}
          >
            <span>#{String(index + 1).padStart(2, "0")}</span>
            <span aria-hidden="true">·</span>
            <span>{opdracht.id}</span>
          </div>
          <h3
            className="mt-1 text-[16px] font-bold leading-snug tracking-[-0.01em]"
            style={{ color: C.ink }}
          >
            {opdracht.titel}
          </h3>
          <p className="mt-0.5 text-[12.5px]" style={{ color: C.inkMute }}>
            {opdracht.opdrachtgever} · {opdracht.plaats} · {opdracht.uren} · {opdracht.start}
          </p>
          <div className="mt-2.5 flex flex-wrap gap-1.5">
            {opdracht.tags.map((t) => (
              <span
                key={t}
                className="rounded-full px-2.5 py-0.5 text-[11px] font-semibold"
                style={{ background: C.wash, color: C.inkSoft, border: `1px solid ${C.line}` }}
              >
                {t}
              </span>
            ))}
          </div>
        </div>
        <span className="hidden shrink-0 text-right sm:block">
          <span className="block text-[16px] font-bold" style={{ color: C.ink, ...mono }}>
            {opdracht.tarief.replace(" / uur", "")}
          </span>
          <span
            className="text-[9px] font-bold uppercase tracking-[0.1em]"
            style={{ color: C.inkFaint }}
          >
            per uur
          </span>
        </span>
      </div>

      <div
        className="flex flex-wrap items-center gap-2 px-5 py-3"
        style={{ borderTop: `1px solid ${C.lineSoft}`, background: C.wash }}
      >
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          className={`inline-flex items-center gap-1.5 rounded-full px-1 text-[12px] font-semibold ${RING}`}
          style={{ color: deep }}
        >
          {open ? <X size={13} aria-hidden="true" /> : <Sparkles size={13} aria-hidden="true" />}
          Waarom deze match
        </button>
        <div className="ml-auto">
          <Btn variant="solid" size="sm" tone={tone} deep={deep} onClick={onOpen}>
            Reageren <ArrowRight size={12} aria-hidden="true" />
          </Btn>
        </div>
      </div>

      <div
        className="grid transition-all duration-300 motion-reduce:transition-none"
        style={{ gridTemplateRows: open ? "1fr" : "0fr" }}
      >
        <div className="overflow-hidden">
          <div
            className="grid grid-cols-1 gap-5 p-5 sm:grid-cols-2"
            style={{ borderTop: `1px solid ${C.lineSoft}` }}
          >
            <RedenKolom
              titel="In je voordeel"
              tone={C.emerald}
              deep={C.emeraldDeep}
              Icon={Check}
              items={opdracht.redenen.plus}
            />
            <RedenKolom
              titel="Om rekening mee te houden"
              tone={C.amber}
              deep={C.amberDeep}
              Icon={Clock}
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
  deep,
  Icon,
  items,
}: {
  titel: string;
  tone: string;
  deep: string;
  Icon: LucideIcon;
  items: string[];
}) {
  return (
    <div>
      <p
        className="flex items-center gap-1.5 text-[10.5px] font-bold uppercase tracking-[0.12em]"
        style={{ color: deep }}
      >
        <Icon size={12} aria-hidden="true" /> {titel}
      </p>
      <ul className="mt-2.5 space-y-2">
        {items.map((r) => (
          <li
            key={r}
            className="flex items-start gap-2.5 text-[13px] leading-snug"
            style={{ color: C.inkSoft }}
          >
            <span
              className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full"
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
  const tone = strong ? C.emerald : C.indigo;
  const deep = strong ? C.emeraldDeep : C.indigoDeep;
  const feiten = [
    { l: "Tarief", v: opdracht.tarief.replace(" / uur", ""), s: "per uur" },
    { l: "Omvang", v: opdracht.uren, s: "per week" },
    { l: "Start", v: opdracht.start, s: "aanvang" },
    { l: "Match", v: `${opdracht.match}%`, s: "op profiel" },
  ];
  return (
    <div className="space-y-6">
      <Btn variant="ghost" size="sm" onClick={onBack}>
        <ArrowLeft size={13} aria-hidden="true" /> Terug naar marktplaats
      </Btn>

      <Card className="overflow-hidden" tone={tone} accent>
        <div className="p-6">
          <div className="flex flex-wrap items-center gap-3">
            <Ring
              value={opdracht.match}
              size={60}
              stroke={6}
              tone={tone}
              label={`Match ${opdracht.match} procent`}
            >
              <span className="text-[14px] font-bold" style={{ color: tone, ...mono }}>
                {opdracht.match}
              </span>
            </Ring>
            <div className="min-w-0">
              <div
                className="flex items-center gap-2 text-[11px] font-bold"
                style={{ color: C.inkFaint, ...mono }}
              >
                <span>{opdracht.id}</span>
                <span aria-hidden="true">·</span>
                <span
                  className="rounded-full px-2.5 py-0.5 uppercase tracking-[0.08em]"
                  style={{ color: deep, background: `${tone}18` }}
                >
                  {strong ? "topmatch" : "goede match"}
                </span>
              </div>
              <h1
                className="mt-1.5 max-w-2xl text-[24px] font-bold leading-[1.14] tracking-[-0.02em] md:text-[28px]"
                style={{ color: C.ink }}
              >
                {opdracht.titel}
              </h1>
              <p
                className="mt-1.5 flex items-center gap-1.5 text-[13.5px]"
                style={{ color: C.inkMute }}
              >
                <MapPin size={14} aria-hidden="true" /> {opdracht.opdrachtgever} · {opdracht.plaats}
              </p>
            </div>
          </div>
          <div className="mt-4 flex flex-wrap gap-1.5">
            {opdracht.tags.map((t) => (
              <span
                key={t}
                className="rounded-full px-2.5 py-0.5 text-[11px] font-semibold"
                style={{ background: C.wash, color: C.inkSoft, border: `1px solid ${C.line}` }}
              >
                {t}
              </span>
            ))}
          </div>
          <div className="mt-5 flex flex-wrap gap-2">
            <Btn variant="solid" tone={tone} deep={deep}>
              <Send size={14} aria-hidden="true" /> Reageer op opdracht
            </Btn>
            <Btn variant="outline" tone={tone} deep={deep}>
              Bewaren
            </Btn>
          </div>
        </div>

        <div
          className="grid grid-cols-2 sm:grid-cols-4"
          style={{ borderTop: `1px solid ${C.lineSoft}` }}
        >
          {feiten.map((m, i) => (
            <div
              key={m.l}
              className="p-4"
              style={{
                borderRight: i < 3 ? `1px solid ${C.lineSoft}` : "none",
                borderTop: i >= 2 ? `1px solid ${C.lineSoft}` : "none",
              }}
            >
              <p
                className="text-[9px] font-bold uppercase tracking-[0.14em]"
                style={{ color: C.inkMute }}
              >
                {m.l}
              </p>
              <p
                className="mt-1.5 text-[18px] font-bold leading-none"
                style={{ color: C.ink, ...mono }}
              >
                {m.v}
              </p>
              <p className="mt-1 text-[10px]" style={{ color: C.inkFaint }}>
                {m.s}
              </p>
            </div>
          ))}
        </div>
      </Card>

      <Card className="p-6">
        <Kicker tone={C.indigoDeep}>
          <Sparkles size={13} aria-hidden="true" /> Navolgbaar — geen verborgen score
        </Kicker>
        <p className="mt-2 max-w-xl text-[13.5px] leading-relaxed" style={{ color: C.inkSoft }}>
          Deze match is opgebouwd uit je geverifieerde profiel. Wat in je voordeel spreekt en wat
          aandacht vraagt — beide zichtbaar, zodat je met vertrouwen kiest.
        </p>
        <div className="mt-5 grid grid-cols-1 gap-6 md:grid-cols-2">
          <RedenDetail
            titel="In je voordeel"
            tone={C.emerald}
            deep={C.emeraldDeep}
            Icon={Check}
            items={opdracht.redenen.plus}
          />
          <RedenDetail
            titel="Om rekening mee te houden"
            tone={C.amber}
            deep={C.amberDeep}
            Icon={Clock}
            items={opdracht.redenen.min}
          />
        </div>
      </Card>

      <Card className="p-6" tone={C.emerald} accent>
        <Kicker tone={C.emeraldDeep}>
          <ShieldCheck size={13} aria-hidden="true" /> Vereiste bewijzen — jouw voortgang
        </Kicker>
        <ul className="mt-4 space-y-2.5">
          {CREDENTIALS.slice(0, 3).map((c) => {
            const t = credTone(c.status);
            return (
              <li
                key={c.naam}
                className="flex items-center gap-3 rounded-[11px] px-4 py-3"
                style={{ background: C.wash, border: `1px solid ${C.lineSoft}` }}
              >
                <span
                  className="flex h-8 w-8 shrink-0 items-center justify-center rounded-[9px]"
                  style={{ background: t.soft, color: t.base, border: `1px solid ${t.base}44` }}
                  aria-hidden="true"
                >
                  <t.Icon size={15} />
                </span>
                <span
                  className="min-w-0 flex-1 truncate text-[13px] font-semibold"
                  style={{ color: C.ink }}
                >
                  {c.naam}
                </span>
                <StatusTag {...t} />
              </li>
            );
          })}
        </ul>
      </Card>
    </div>
  );
}

function RedenDetail({
  titel,
  tone,
  deep,
  Icon,
  items,
}: {
  titel: string;
  tone: string;
  deep: string;
  Icon: LucideIcon;
  items: string[];
}) {
  return (
    <div>
      <p
        className="flex items-center gap-2 text-[10.5px] font-bold uppercase tracking-[0.12em]"
        style={{ color: deep }}
      >
        <Icon size={13} aria-hidden="true" /> {titel}
      </p>
      <ul className="mt-3 space-y-3">
        {items.map((r) => (
          <li
            key={r}
            className="flex items-start gap-2.5 text-[13.5px] leading-snug"
            style={{ color: C.inkSoft }}
          >
            <span
              className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full"
              style={{ background: `${tone}1f`, color: tone }}
              aria-hidden="true"
            >
              <Icon size={12} />
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
  const lvl = levelFrom(ratio);
  return (
    <div className="space-y-6">
      <ScreenHead
        kicker="Etappe 4 · Bewijzen"
        title="Verificatie-voortgang"
        sub={`${verified} van ${CREDENTIALS.length} bewijzen behaald. Elk geverifieerd document verhoogt je profielsterkte en je positie in de matchlijsten.`}
        KIcon={ShieldCheck}
        tone={C.emeraldDeep}
        right={
          <div
            className="flex items-center gap-3 rounded-[12px] px-4 py-2.5"
            style={{ background: C.panel, border: `1px solid ${C.line}` }}
          >
            <Ring
              value={ratio}
              size={48}
              stroke={5}
              tone={lvl.tone}
              label={`${ratio} procent behaald`}
            >
              <span className="text-[11px] font-bold" style={{ color: C.ink, ...mono }}>
                {ratio}
              </span>
            </Ring>
            <span>
              <span
                className="flex items-center gap-1 text-[11.5px] font-bold"
                style={{ color: lvl.deep }}
              >
                <lvl.Icon size={12} aria-hidden="true" /> {lvl.naam}
              </span>
              <span className="text-[10px]" style={{ color: C.inkMute }}>
                behaald
              </span>
            </span>
          </div>
        }
      />

      {/* Voortgangsbalk als tijdlijn */}
      <Card className="p-5">
        <p
          className="mb-3 text-[11px] font-bold uppercase tracking-[0.14em]"
          style={{ color: C.inkMute }}
        >
          Compleetheid
        </p>
        <Bar value={ratio} tone={lvl.tone} height={10} />
        <div className="mt-3 flex flex-wrap items-center gap-x-6 gap-y-2">
          {(["VERIFIED", "SUBMITTED", "EXPIRING", "REJECTED"] as CredStatus[]).map((st) => {
            const t = credTone(st);
            const count = CREDENTIALS.filter((c) => c.status === st).length;
            return (
              <span key={st} className="inline-flex items-center gap-2">
                <span className="text-[15px] font-bold" style={{ color: t.base, ...mono }}>
                  {count}
                </span>
                <StatusTag {...t} />
              </span>
            );
          })}
        </div>
      </Card>

      <ol className="relative space-y-3.5 pl-6">
        <span
          className="absolute bottom-3 left-[9px] top-3 w-px"
          style={{ background: C.line }}
          aria-hidden="true"
        />
        {CREDENTIALS.map((c) => {
          const t = credTone(c.status);
          const isOpen = open === c.naam;
          const done = c.status === "VERIFIED";
          return (
            <li key={c.naam} className="relative">
              <span
                className="absolute -left-6 top-4 flex h-[18px] w-[18px] items-center justify-center rounded-full"
                style={{
                  background: done ? C.emerald : t.soft,
                  border: `2px solid ${done ? C.emeraldDeep : t.base}`,
                  color: "#fff",
                }}
                aria-hidden="true"
              >
                {done && <Check size={10} />}
              </span>
              <Card as="article" className="overflow-hidden" tone={t.base} accent={t.alarm}>
                <button
                  type="button"
                  onClick={() => setOpen(isOpen ? null : c.naam)}
                  aria-expanded={isOpen}
                  className={`relative flex w-full items-center gap-3.5 px-5 py-4 text-left ${RING}`}
                >
                  <span
                    className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[11px]"
                    style={{ background: t.soft, color: t.base, border: `1px solid ${t.base}44` }}
                    aria-hidden="true"
                  >
                    <t.Icon size={17} />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-[14px] font-bold" style={{ color: C.ink }}>
                      {c.naam}
                    </span>
                    <span
                      className="block truncate text-[11.5px]"
                      style={{ color: t.alarm ? t.deep : C.inkMute }}
                    >
                      {c.detail}
                    </span>
                  </span>
                  <span className="hidden sm:inline-flex">
                    <StatusTag {...t} />
                  </span>
                  <ChevronRight
                    size={16}
                    aria-hidden="true"
                    style={{
                      color: C.inkFaint,
                      transform: isOpen ? "rotate(90deg)" : "none",
                      transition: "transform 0.2s ease",
                    }}
                  />
                </button>
                <div
                  className="grid transition-all duration-300 motion-reduce:transition-none"
                  style={{ gridTemplateRows: isOpen ? "1fr" : "0fr" }}
                >
                  <div className="overflow-hidden">
                    <div
                      className="px-5 pb-4 sm:pl-[76px]"
                      style={{ borderTop: `1px solid ${C.lineSoft}`, paddingTop: 12 }}
                    >
                      <span className="mb-2 inline-flex sm:hidden">
                        <StatusTag {...t} />
                      </span>
                      <p
                        className="max-w-xl text-[12.5px] leading-relaxed"
                        style={{ color: C.inkSoft }}
                      >
                        {c.detail}. Het document wordt versleuteld bewaard en alleen na jouw
                        toestemming ingezien door een opdrachtgever.
                      </p>
                      <div className="mt-3 flex flex-wrap gap-2">
                        <Btn size="sm" variant="solid" tone={t.base} deep={t.deep}>
                          {c.status === "EXPIRING"
                            ? "Vernieuwen"
                            : c.status === "REJECTED"
                              ? "Opnieuw indienen"
                              : c.status === "SUBMITTED"
                                ? "Status volgen"
                                : "Bekijken"}
                        </Btn>
                        <Btn size="sm" variant="outline" tone={t.base} deep={t.deep}>
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
      </ol>
    </div>
  );
}

// —————————————————————————————————————— Acties ——————————————————————————————————————
function Acties({
  onMarkt,
  onFacturen,
  onVerif,
}: {
  onMarkt: () => void;
  onFacturen: () => void;
  onVerif: () => void;
}) {
  return (
    <div className="space-y-6">
      <ScreenHead
        kicker="Etappe 5 · Volgende stappen"
        title="Jouw stappenplan"
        sub="Op volgorde van urgentie. Elke afgeronde stap brengt je dichter bij de volgende mijlpaal."
        KIcon={Target}
        tone={C.amberDeep}
      />
      <ol className="space-y-4">
        {ACTIES.map((a, i) => {
          const warn = a.urgentie === "warning";
          const tone = warn ? C.amber : C.indigo;
          const deep = warn ? C.amberDeep : C.indigoDeep;
          const goMarkt = a.cta.toLowerCase().includes("match");
          const goFacturen = a.cta.toLowerCase().includes("herinner");
          const goVerif =
            a.cta.toLowerCase().includes("vog") || a.cta.toLowerCase().includes("vernieuw");
          return (
            <li key={a.titel}>
              <Card className="flex items-start gap-4 p-5" tone={tone} accent>
                <span
                  className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[12px] text-[15px] font-bold"
                  style={{
                    background: `${tone}18`,
                    color: tone,
                    border: `1px solid ${tone}44`,
                    ...mono,
                  }}
                  aria-hidden="true"
                >
                  {String(i + 1).padStart(2, "0")}
                </span>
                <div className="min-w-0 flex-1">
                  <Kicker tone={deep}>
                    {warn ? (
                      <Clock size={13} aria-hidden="true" />
                    ) : (
                      <Sparkles size={13} aria-hidden="true" />
                    )}
                    {warn ? "Urgent" : "Aanbevolen"}
                  </Kicker>
                  <h2
                    className="mt-1.5 text-[16px] font-bold leading-snug"
                    style={{ color: C.ink }}
                  >
                    {a.titel}
                  </h2>
                  <p
                    className="mt-1 max-w-lg text-[13px] leading-relaxed"
                    style={{ color: C.inkSoft }}
                  >
                    {a.detail}
                  </p>
                  <div className="mt-3">
                    <Btn
                      variant={warn ? "solid" : "outline"}
                      size="sm"
                      tone={tone}
                      deep={deep}
                      onClick={
                        goMarkt ? onMarkt : goFacturen ? onFacturen : goVerif ? onVerif : undefined
                      }
                    >
                      {a.cta} <ArrowRight size={13} aria-hidden="true" />
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

  const betaaldCount = FACTUREN.filter((f) => f.status === "Betaald").length;
  const inningPct = Math.round((betaaldCount / FACTUREN.length) * 100);
  const selected = FACTUREN.find((f) => f.nr === sel) ?? FACTUREN[0];

  return (
    <div className="space-y-6">
      <ScreenHead
        kicker="Etappe 6 · Geldzaken"
        title="Facturen"
        sub="Overzicht van je omzet. Elke betaalde factuur is een mijlpaal die telt."
        KIcon={Receipt}
        right={
          <Btn variant="solid" size="sm">
            <Plus size={13} aria-hidden="true" /> Nieuwe factuur
          </Btn>
        }
      />

      <Card
        className="flex flex-col items-center gap-4 p-5 sm:flex-row sm:gap-6"
        tone={C.emerald}
        accent
      >
        <Ring
          value={inningPct}
          size={72}
          stroke={7}
          tone={C.emerald}
          label={`${inningPct} procent geïnd`}
        >
          <span className="text-[16px] font-bold" style={{ color: C.emeraldDeep, ...mono }}>
            {inningPct}%
          </span>
        </Ring>
        <div className="min-w-0 flex-1 text-center sm:text-left">
          <p className="text-[13.5px] font-bold" style={{ color: C.ink }}>
            {betaaldCount} van {FACTUREN.length} facturen voldaan
          </p>
          <p className="mt-0.5 text-[12px]" style={{ color: C.inkMute }}>
            Nog {eur0.format(totals.open)} onderweg. Een vriendelijke herinnering helpt je richting
            100%.
          </p>
          <div className="mt-2.5 max-w-sm">
            <Bar value={inningPct} tone={C.emerald} />
          </div>
        </div>
      </Card>

      <section className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {[
          {
            l: "Betaald",
            v: totals.betaald,
            sub: "2 facturen",
            tone: C.emerald,
            deep: C.emeraldDeep,
            Icon: Check,
          },
          {
            l: "Openstaand",
            v: totals.open,
            sub: "1 factuur · 9 dagen",
            tone: C.amber,
            deep: C.amberDeep,
            Icon: Clock,
          },
          {
            l: "Concept",
            v: totals.concept,
            sub: "klaar om te versturen",
            tone: C.indigo,
            deep: C.indigoDeep,
            Icon: FileText,
          },
        ].map((s) => (
          <Card key={s.l} className="p-4" tone={s.tone} accent>
            <div className="flex items-center justify-between">
              <p
                className="text-[9.5px] font-bold uppercase tracking-[0.14em]"
                style={{ color: s.deep }}
              >
                {s.l}
              </p>
              <s.Icon size={14} aria-hidden="true" style={{ color: s.tone }} />
            </div>
            <p
              className="mt-1.5 text-[22px] font-bold leading-none"
              style={{ color: C.ink, ...mono }}
            >
              {eur0.format(s.v)}
            </p>
            <p className="mt-1 text-[11px]" style={{ color: C.inkMute }}>
              {s.sub}
            </p>
          </Card>
        ))}
      </section>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-[1.5fr_1fr]">
        <Card className="overflow-hidden">
          <div
            className="flex items-center justify-between px-5 py-3.5"
            style={{ borderBottom: `1px solid ${C.lineSoft}` }}
          >
            <Kicker tone={C.indigoDeep}>
              <Receipt size={13} aria-hidden="true" /> Facturen
            </Kicker>
            <div className="flex items-center gap-1.5" role="group" aria-label="Facturen sorteren">
              {(["datum", "bedrag"] as const).map((s) => (
                <Btn
                  key={s}
                  size="sm"
                  variant={sort === s ? "solid" : "outline"}
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
                <tr style={{ borderBottom: `1px solid ${C.lineSoft}` }}>
                  {["Nummer", "Klant", "Datum", "Bedrag", "Status"].map((h, i) => (
                    <th
                      key={h}
                      scope="col"
                      className={`px-4 py-2.5 text-[9px] font-bold uppercase tracking-[0.12em] ${i === 3 ? "text-right" : ""}`}
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
                      className={`mp-row cursor-pointer ${RING}`}
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
                        background: on ? C.indigoSoft : undefined,
                      }}
                    >
                      <td
                        className="px-4 py-3 text-[12px] font-bold"
                        style={{ color: on ? C.indigoDeep : C.inkSoft, ...mono }}
                      >
                        {f.nr}
                      </td>
                      <td className="px-4 py-3 text-[13px] font-bold" style={{ color: C.ink }}>
                        {f.klant}
                      </td>
                      <td className="px-4 py-3 text-[12px]" style={{ color: C.inkMute, ...mono }}>
                        {f.datum}
                      </td>
                      <td
                        className="px-4 py-3 text-right text-[13px] font-bold"
                        style={{ color: C.ink, ...mono }}
                      >
                        {f.bedrag}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className="inline-flex items-center gap-1.5 text-[11.5px] font-semibold"
                          style={{ color: t.base }}
                        >
                          <t.Icon size={12} aria-hidden="true" /> {t.label}
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
    <Card as="article" className="overflow-hidden" tone={t.base} accent>
      <div className="p-5" style={{ borderBottom: `1px solid ${C.lineSoft}` }}>
        <p className="text-[9.5px] font-bold uppercase tracking-[0.18em]" style={{ color: t.deep }}>
          Opbouw factuur
        </p>
        <p className="text-[17px] font-bold" style={{ color: C.ink, ...mono }}>
          {factuur.nr}
        </p>
      </div>
      <div className="space-y-3 p-5 text-[12.5px]">
        <Row label="Klant" value={factuur.klant} />
        <Row label="Datum" value={factuur.datum} isMono />
        <div className="flex items-baseline justify-between">
          <span className="text-[12px]" style={{ color: C.inkMute }}>
            Status
          </span>
          <span
            className="inline-flex items-center gap-1.5 font-semibold"
            style={{ color: t.base }}
          >
            <t.Icon size={12} aria-hidden="true" /> {t.label}
          </span>
        </div>
        <div className="my-3 h-px" style={{ background: C.lineSoft }} />
        <Row label="Subtotaal" value={eur0.format(subtotal)} isMono />
        <Row label="Btw 21%" value={eur0.format(btw)} isMono />
        <div className="my-3 h-px" style={{ background: `${t.base}44` }} />
        <div className="flex items-baseline justify-between">
          <span
            className="text-[12px] font-bold uppercase tracking-[0.12em]"
            style={{ color: C.ink }}
          >
            Totaal
          </span>
          <span className="text-[20px] font-bold" style={{ color: t.deep, ...mono }}>
            {factuur.bedrag}
          </span>
        </div>
        <div className="mt-4 flex gap-2">
          <Btn variant="solid" size="sm" full tone={t.base} deep={t.deep}>
            {factuur.status === "Concept"
              ? "Versturen"
              : factuur.status === "Openstaand"
                ? "Herinnering"
                : "Download"}
            <ArrowRight size={13} aria-hidden="true" />
          </Btn>
          <Btn variant="outline" size="sm" tone={t.base} deep={t.deep}>
            PDF
          </Btn>
        </div>
      </div>
    </Card>
  );
}

function Row({ label, value, isMono = false }: { label: string; value: string; isMono?: boolean }) {
  return (
    <div className="flex items-baseline gap-2">
      <span className="shrink-0 text-[12px]" style={{ color: C.inkMute }}>
        {label}
      </span>
      <span
        className="min-w-0 flex-1 self-end border-b border-dotted"
        style={{ borderColor: C.line }}
        aria-hidden="true"
      />
      <span
        className="shrink-0 text-right text-[12.5px] font-semibold"
        style={{ color: C.ink, ...(isMono ? mono : sans) }}
      >
        {value}
      </span>
    </div>
  );
}
