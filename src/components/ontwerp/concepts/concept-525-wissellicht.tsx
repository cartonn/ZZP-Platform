"use client";

// Concept 525 — "Wissellicht" · Sein- en spoorsysteem (semafoor). Een operationele controlekamer:
// statussen verschijnen als seinlichten (veilig-groen, waarschuwing-amber, onveilig-rood) met ALTIJD
// een label én icoon — nooit kleur alleen. Strakke sein-huis-esthetiek, hoog contrast op een donker
// dashboard, monospace cijfers en een rustige, foutloze bedieningsgevoel als op een verkeersleidingspost.

import { useMemo, useState, type CSSProperties, type ReactNode } from "react";
import {
  Activity,
  ArrowLeft,
  ArrowRight,
  Check,
  ChevronRight,
  CircleDashed,
  CircleDot,
  Clock,
  FileText,
  Gauge,
  LayoutGrid,
  ListChecks,
  MapPin,
  Plus,
  Radio,
  RadioTower,
  Receipt,
  RefreshCw,
  Search,
  ShieldCheck,
  Store,
  TriangleAlert,
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

// ————————————————————————————— Palet — operationeel donker, seinkleuren —————————————————————————————
const C = {
  bg: "#101512",
  panel: "#161d19",
  raised: "#1b241f",
  sink: "#0c110e",
  line: "#28322c",
  lineSoft: "#202a24",
  ink: "#e9f2ec",
  inkSoft: "#b1c1b7",
  inkMute: "#7d8f84",
  inkFaint: "#54615a",
  green: "#2fbf71",
  greenSoft: "#132a1d",
  amber: "#f2b01e",
  amberSoft: "#2c2510",
  red: "#e5484d",
  redSoft: "#2c1517",
  lunar: "#79c7d6",
  lunarSoft: "#132427",
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
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2fbf71] focus-visible:ring-offset-2 focus-visible:ring-offset-[#101512]";

// ————————————————————————————— Sein-aspecten (label + icoon + lamp) —————————————————————————————
type Aspect = "green" | "amber" | "red" | "lunar";
type Tone = {
  base: string;
  soft: string;
  label: string;
  Icon: LucideIcon;
  aspect: Aspect;
  alarm: boolean;
};

function credTone(s: CredStatus): Tone {
  switch (s) {
    case "VERIFIED":
      return {
        base: C.green,
        soft: C.greenSoft,
        label: "Sein veilig",
        Icon: Check,
        aspect: "green",
        alarm: false,
      };
    case "SUBMITTED":
      return {
        base: C.lunar,
        soft: C.lunarSoft,
        label: "Oprijden",
        Icon: CircleDashed,
        aspect: "lunar",
        alarm: false,
      };
    case "EXPIRING":
      return {
        base: C.amber,
        soft: C.amberSoft,
        label: "Waarschuwing",
        Icon: TriangleAlert,
        aspect: "amber",
        alarm: true,
      };
    case "REJECTED":
      return {
        base: C.red,
        soft: C.redSoft,
        label: "Sein onveilig",
        Icon: X,
        aspect: "red",
        alarm: true,
      };
  }
}

function factuurTone(status: string): Tone {
  if (status === "Betaald")
    return {
      base: C.green,
      soft: C.greenSoft,
      label: "Gepasseerd",
      Icon: Check,
      aspect: "green",
      alarm: false,
    };
  if (status === "Openstaand")
    return {
      base: C.amber,
      soft: C.amberSoft,
      label: "Wacht op sein",
      Icon: Clock,
      aspect: "amber",
      alarm: true,
    };
  return {
    base: C.lunar,
    soft: C.lunarSoft,
    label: "Rangeren",
    Icon: FileText,
    aspect: "lunar",
    alarm: false,
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

// ————————————————————————————— Sein-huis (3-aspect + lunar) —————————————————————————————
function SignalHead({ aspect, size = "md" }: { aspect: Aspect; size?: "sm" | "md" }) {
  const lampSize = size === "sm" ? 9 : 13;
  const lamps: { key: Aspect; c: string }[] = [
    { key: "red", c: C.red },
    { key: "amber", c: C.amber },
    { key: "green", c: C.green },
  ];
  return (
    <span
      className="inline-flex flex-col items-center gap-1 rounded-[6px] px-1.5 py-1.5"
      style={{ background: C.sink, border: `1px solid ${C.line}` }}
      aria-hidden="true"
    >
      {lamps.map((l) => {
        const on = l.key === aspect;
        return (
          <span
            key={l.key}
            className="rounded-full"
            style={{
              width: lampSize,
              height: lampSize,
              background: on ? l.c : `${l.c}22`,
              border: `1px solid ${on ? l.c : C.line}`,
              boxShadow: on ? `0 0 8px 1px ${l.c}aa` : "none",
            }}
          />
        );
      })}
      <span
        className="mt-0.5 rounded-full"
        style={{
          width: lampSize - 3,
          height: lampSize - 3,
          background: aspect === "lunar" ? C.lunar : `${C.lunar}22`,
          border: `1px solid ${aspect === "lunar" ? C.lunar : C.line}`,
          boxShadow: aspect === "lunar" ? `0 0 8px 1px ${C.lunar}aa` : "none",
        }}
      />
    </span>
  );
}

// ————————————————————————————— Primitives —————————————————————————————
function Panel({
  children,
  className = "",
  as: Tag = "div",
  tone,
}: {
  children: ReactNode;
  className?: string;
  as?: "div" | "section" | "article" | "aside" | "li";
  tone?: string;
}) {
  return (
    <Tag
      className={`relative rounded-[8px] ${className}`}
      style={{
        background: C.panel,
        border: `1px solid ${tone ? `${tone}55` : C.line}`,
        boxShadow: "0 1px 0 rgba(255,255,255,0.03) inset, 0 12px 30px -24px rgba(0,0,0,0.9)",
      }}
    >
      {children}
    </Tag>
  );
}

function Btn({
  children,
  onClick,
  variant = "solid",
  size = "md",
  className = "",
  tone = C.green,
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
  ariaLabel?: string;
  ariaExpanded?: boolean;
  full?: boolean;
}) {
  const pad = size === "sm" ? "px-3 py-1.5 text-[12px]" : "px-4 py-2.5 text-[13px]";
  const base = `inline-flex items-center justify-center gap-2 rounded-[6px] font-semibold tracking-[-0.01em] transition-all duration-150 active:translate-y-px ${RING} ${full ? "w-full" : ""}`;
  const style: CSSProperties =
    variant === "solid"
      ? {
          background: tone,
          color: C.sink,
          border: `1px solid ${tone}`,
          boxShadow: `0 0 16px -6px ${tone}`,
          ...sans,
        }
      : variant === "outline"
        ? { background: C.raised, color: tone, border: `1px solid ${tone}66`, ...sans }
        : { background: "transparent", color: C.inkSoft, border: "1px solid transparent", ...sans };
  const hover = variant === "solid" ? "hover:brightness-110" : "hover:bg-[#1b241f]";
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
      className="inline-flex items-center gap-1.5 rounded-[5px] px-2 py-0.5 text-[11px] font-bold uppercase tracking-[0.04em]"
      style={{ color: base, background: soft, border: `1px solid ${base}55`, ...sans }}
    >
      <Icon size={12} aria-hidden="true" />
      {label}
      {alarm && <span className="sr-only"> (actie vereist)</span>}
    </span>
  );
}

// Match als snelheidssein (seinbeeld met cijfer)
function SpeedPlate({ value, tone }: { value: number; tone: string }) {
  return (
    <span
      className="relative inline-flex h-14 w-14 flex-col items-center justify-center rounded-[7px]"
      style={{
        background: C.sink,
        border: `1.5px solid ${tone}`,
        boxShadow: `0 0 14px -6px ${tone}`,
      }}
      aria-label={`Match ${value} procent`}
    >
      <span className="text-[16px] font-bold leading-none" style={{ color: tone, ...mono }}>
        {value}
      </span>
      <span
        className="mt-0.5 text-[7px] font-bold uppercase tracking-[0.16em]"
        style={{ color: C.inkMute }}
      >
        match
      </span>
    </span>
  );
}

function Kicker({ children, tone = C.inkMute }: { children: ReactNode; tone?: string }) {
  return (
    <span
      className="inline-flex items-center gap-1.5 text-[10.5px] font-bold uppercase tracking-[0.18em]"
      style={{ color: tone, ...sans }}
    >
      {children}
    </span>
  );
}

function ScreenHead({
  code,
  title,
  sub,
  right,
  tone = C.green,
}: {
  code: string;
  title: string;
  sub?: string;
  right?: ReactNode;
  tone?: string;
}) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
      <div className="min-w-0">
        <span
          className="inline-flex items-center gap-1.5 rounded-[5px] px-2 py-0.5 text-[10.5px] font-bold uppercase tracking-[0.16em]"
          style={{ color: tone, background: `${tone}18`, border: `1px solid ${tone}44` }}
        >
          <Radio size={12} aria-hidden="true" />
          Post {code}
        </span>
        <h1
          className="mt-2.5 text-[25px] font-bold leading-tight tracking-[-0.02em] md:text-[30px]"
          style={{ color: C.ink }}
        >
          {title}
        </h1>
        {sub && (
          <p className="mt-1.5 max-w-xl text-[13px]" style={{ color: C.inkMute }}>
            {sub}
          </p>
        )}
      </div>
      {right}
    </div>
  );
}

const NAV: Record<ScreenKey, { Icon: LucideIcon; spoor: string }> = {
  dashboard: { Icon: LayoutGrid, spoor: "Sp 1" },
  marktplaats: { Icon: Store, spoor: "Sp 2" },
  opdracht: { Icon: MapPin, spoor: "Sp 3" },
  verificatie: { Icon: ShieldCheck, spoor: "Sp 4" },
  acties: { Icon: ListChecks, spoor: "Sp 5" },
  facturen: { Icon: Receipt, spoor: "Sp 6" },
  documenten: { Icon: FileText, spoor: "Sp 7" },
  berichten: { Icon: FileText, spoor: "Sp 8" },
};

// —————————————————————————————————————— Root ——————————————————————————————————————
export function Concept525() {
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
          <main key={screen} className="ws-fade px-4 pb-20 pt-6 sm:px-6 md:px-8">
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
        @keyframes wsFade { from { opacity: 0; transform: translateY(6px); } to { opacity: 1; transform: none; } }
        .ws-fade { animation: wsFade 0.3s cubic-bezier(0.22,1,0.36,1) both; }
        @keyframes wsPulse { 0%,100% { opacity: 1; } 50% { opacity: 0.4; } }
        .ws-pulse { animation: wsPulse 1.6s ease-in-out infinite; }
        .ws-row { transition: background 0.15s ease; }
        .ws-row:hover { background: ${C.raised}; }
        @media (prefers-reduced-motion: reduce) { .ws-fade, .ws-pulse { animation: none !important; } .ws-row { transition: none !important; } }
      `}</style>
    </div>
  );
}

// —————————————————————————————————————— Sidebar ——————————————————————————————————————
function Sidebar({ screen, setScreen }: { screen: ScreenKey; setScreen: (s: ScreenKey) => void }) {
  const verified = CREDENTIALS.filter((c) => c.status === "VERIFIED").length;
  return (
    <aside
      className="sticky top-0 hidden h-screen w-[236px] shrink-0 flex-col md:flex"
      style={{ background: C.panel, borderRight: `1px solid ${C.line}` }}
    >
      <div
        className="flex items-center gap-2.5 px-5 py-5"
        style={{ borderBottom: `1px solid ${C.line}` }}
      >
        <span
          className="flex h-9 w-9 items-center justify-center rounded-[7px]"
          style={{
            background: C.sink,
            color: C.green,
            border: `1px solid ${C.green}66`,
            boxShadow: `0 0 14px -6px ${C.green}`,
          }}
          aria-hidden="true"
        >
          <RadioTower size={17} />
        </span>
        <span>
          <span className="block text-[14px] font-bold tracking-[-0.01em]" style={{ color: C.ink }}>
            Wissellicht
          </span>
          <span
            className="mt-0.5 block text-[9px] font-bold uppercase tracking-[0.2em]"
            style={{ color: C.green }}
          >
            verkeersleiding · post A
          </span>
        </span>
      </div>

      <nav aria-label="Sporen" className="flex-1 overflow-y-auto px-3 py-4">
        <p
          className="px-2 pb-2 text-[9px] font-bold uppercase tracking-[0.2em]"
          style={{ color: C.inkFaint }}
        >
          Sporenplan
        </p>
        <ul className="space-y-0.5">
          {SCREENS.map((s) => {
            const on = s.key === screen;
            const { Icon, spoor } = NAV[s.key];
            return (
              <li key={s.key}>
                <button
                  type="button"
                  onClick={() => setScreen(s.key)}
                  aria-current={on ? "page" : undefined}
                  className={`group flex w-full items-center gap-2.5 rounded-[6px] px-2.5 py-2 text-left text-[13px] font-semibold transition-colors ${RING}`}
                  style={on ? { background: C.greenSoft, color: C.green } : { color: C.inkSoft }}
                >
                  <span
                    className="flex h-7 w-7 items-center justify-center rounded-[5px]"
                    style={{
                      background: on ? C.green : C.raised,
                      color: on ? C.sink : C.inkMute,
                      border: `1px solid ${on ? C.green : C.line}`,
                    }}
                    aria-hidden="true"
                  >
                    <Icon size={14} />
                  </span>
                  <span className="flex-1">{s.label}</span>
                  <span className="text-[9px] font-bold" style={{ color: C.inkFaint, ...mono }}>
                    {spoor}
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      </nav>

      <div className="px-4 py-4" style={{ borderTop: `1px solid ${C.line}` }}>
        <div
          className="mb-3 rounded-[7px] p-3"
          style={{ background: C.greenSoft, border: `1px solid ${C.green}44` }}
        >
          <p
            className="flex items-center gap-1.5 text-[9px] font-bold uppercase tracking-[0.16em]"
            style={{ color: C.green }}
          >
            <span
              className="ws-pulse h-2 w-2 rounded-full"
              style={{ background: C.green }}
              aria-hidden="true"
            />
            Baanvak vrij
          </p>
          <p className="mt-1 text-[19px] font-bold leading-none" style={{ color: C.ink, ...mono }}>
            {verified}/{CREDENTIALS.length}
          </p>
          <p className="mt-1 text-[10px]" style={{ color: C.inkMute }}>
            seinen op veilig
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span
            className="flex h-8 w-8 items-center justify-center rounded-[6px] text-[11px] font-bold"
            style={{ background: C.raised, color: C.green, border: `1px solid ${C.line}`, ...mono }}
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
              style={{ color: C.green }}
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
        className="flex flex-1 items-center gap-2 rounded-[6px] px-3 py-2"
        style={{ background: C.panel, border: `1px solid ${C.line}` }}
      >
        <Search size={14} aria-hidden="true" style={{ color: C.inkFaint }} />
        <span className="text-[12.5px]" style={{ color: C.inkFaint }}>
          Zoek in sporen, seinen, facturen…
        </span>
        <span
          className="ml-auto hidden rounded-[4px] px-1.5 py-0.5 text-[10px] font-bold sm:inline"
          style={{ background: C.raised, color: C.inkMute, ...mono }}
        >
          ⌘K
        </span>
      </div>
      <span
        className="hidden items-center gap-2 rounded-[6px] px-3 py-2 text-[12px] font-semibold sm:inline-flex"
        style={{ background: C.amberSoft, color: C.amber, border: `1px solid ${C.amber}44` }}
      >
        <Clock size={13} aria-hidden="true" />
        <span style={{ ...mono }}>{eur0.format(open)}</span> wacht op sein
      </span>
      <span
        className="hidden items-center gap-1.5 rounded-[6px] px-2.5 py-2 text-[10px] font-bold uppercase tracking-[0.14em] lg:inline-flex"
        style={{ background: C.panel, color: C.inkMute, border: `1px solid ${C.line}` }}
      >
        <Zap size={12} aria-hidden="true" /> {NAV[screen].spoor}
      </span>
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
      aria-label="Sporen"
      className="flex gap-1.5 overflow-x-auto px-4 py-2.5 md:hidden"
      style={{ borderBottom: `1px solid ${C.line}`, background: C.panel }}
    >
      {SCREENS.map((s) => {
        const on = s.key === screen;
        return (
          <button
            key={s.key}
            type="button"
            onClick={() => setScreen(s.key)}
            aria-current={on ? "page" : undefined}
            className={`shrink-0 rounded-[5px] px-3 py-1.5 text-[12.5px] font-semibold transition-colors ${RING}`}
            style={
              on
                ? { background: C.green, color: C.sink }
                : { color: C.inkSoft, background: C.raised }
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
  return (
    <div className="space-y-7">
      <ScreenHead
        code="1 · Overzicht"
        title={`Bedieningspost — ${PROFIEL.naam.split(" ")[0]}`}
        sub="Al het treinverkeer op één post. Drie seinen staan niet op veilig en vragen om ingrijpen."
        right={
          <div className="flex gap-2">
            <Btn variant="outline" size="sm" tone={C.lunar} onClick={onVerif}>
              <ShieldCheck size={13} aria-hidden="true" /> Seinen
            </Btn>
            <Btn variant="solid" size="sm" onClick={onActies}>
              Volgende sein <ArrowRight size={13} aria-hidden="true" />
            </Btn>
          </div>
        }
      />

      <section className="grid grid-cols-2 gap-3.5 xl:grid-cols-4">
        {KPIS.map((k) => (
          <Panel key={k.label} className="p-4">
            <div className="flex items-center justify-between">
              <p className="text-[11px] font-semibold" style={{ color: C.inkMute }}>
                {k.label}
              </p>
              <Gauge size={13} aria-hidden="true" style={{ color: C.green }} />
            </div>
            <p
              className="mt-2 text-[25px] font-bold leading-none tracking-[-0.02em]"
              style={{ color: C.ink, ...mono }}
            >
              {k.value}
            </p>
            <div className="mt-3 flex items-center justify-between">
              <span
                className="inline-flex items-center gap-1 rounded-[4px] px-1.5 py-0.5 text-[11px] font-bold"
                style={{
                  color: k.up ? C.green : C.amber,
                  background: k.up ? C.greenSoft : C.amberSoft,
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
                      className="w-[3px] rounded-sm"
                      style={{ height: h, background: last ? C.green : `${C.green}40` }}
                    />
                  );
                })}
              </span>
            </div>
          </Panel>
        ))}
      </section>

      <section className="grid grid-cols-1 gap-5 lg:grid-cols-[1.55fr_1fr]">
        <Panel className="overflow-hidden" tone={C.green}>
          <div
            className="flex items-center justify-between px-5 py-3"
            style={{ borderBottom: `1px solid ${C.line}` }}
          >
            <Kicker tone={C.green}>
              <Store size={13} aria-hidden="true" /> Ingemelde ritten
            </Kicker>
            <button
              type="button"
              onClick={onMarkt}
              className={`rounded-[5px] px-1 text-[11.5px] font-semibold ${RING}`}
              style={{ color: C.green }}
            >
              Volledig sporenplan →
            </button>
          </div>
          <ul>
            {OPDRACHTEN.map((o, i) => {
              const tone = o.match >= 90 ? C.green : C.lunar;
              return (
                <li key={o.id}>
                  <button
                    type="button"
                    onClick={onOpen}
                    className={`ws-row flex w-full items-center gap-3.5 px-5 py-4 text-left ${RING}`}
                    style={{ borderTop: i === 0 ? "none" : `1px solid ${C.lineSoft}` }}
                  >
                    <SpeedPlate value={o.match} tone={tone} />
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
        </Panel>

        <div className="space-y-5">
          <Panel className="p-5" tone={C.green}>
            <Kicker tone={C.green}>
              <ShieldCheck size={13} aria-hidden="true" /> Seinbeeld dossier
            </Kicker>
            <div className="mt-2 flex items-baseline gap-2">
              <span
                className="text-[36px] font-bold leading-none tracking-[-0.03em]"
                style={{ color: C.green, ...mono }}
              >
                {ratio}%
              </span>
              <span className="text-[12px]" style={{ color: C.inkMute }}>
                op veilig
              </span>
            </div>
            <div className="mt-3 flex gap-1.5">
              {CREDENTIALS.map((c) => {
                const t = credTone(c.status);
                return (
                  <span
                    key={c.naam}
                    className="flex flex-1 items-center justify-center rounded-[4px] py-1"
                    style={{ background: t.soft, border: `1px solid ${t.base}44` }}
                  >
                    <t.Icon size={12} aria-hidden="true" style={{ color: t.base }} />
                  </span>
                );
              })}
            </div>
            <p className="mt-2.5 text-[11.5px]" style={{ color: C.inkMute }}>
              {verified} van {CREDENTIALS.length} seinen op veilig · {PROFIEL.trust}.
            </p>
          </Panel>

          <Panel className="p-5" tone={C.amber} as="article">
            <Kicker tone={C.amber}>
              <TriangleAlert size={13} aria-hidden="true" /> Sein op waarschuwing
            </Kicker>
            <h3 className="mt-2 text-[15px] font-bold leading-snug" style={{ color: C.ink }}>
              {primair.titel}
            </h3>
            <p className="mt-1.5 text-[12.5px] leading-relaxed" style={{ color: C.inkSoft }}>
              {primair.detail}
            </p>
            <Btn variant="solid" size="sm" full tone={C.amber} className="mt-4" onClick={onActies}>
              {primair.cta} <ArrowRight size={13} aria-hidden="true" />
            </Btn>
          </Panel>
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
        code="2 · Marktplaats"
        title="Aangeboden ritten"
        sub={`${rows.length} van ${OPDRACHTEN.length} ritten sluiten aan op je geseinde profiel.`}
      />

      <Panel className="flex flex-col gap-2.5 p-3 sm:flex-row sm:items-center" tone={C.green}>
        <div
          className="flex flex-1 items-center gap-2 rounded-[6px] px-3 py-2"
          style={{ background: C.sink, border: `1px solid ${C.line}` }}
        >
          <Search size={15} aria-hidden="true" style={{ color: C.inkFaint }} />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Filter op titel, plaats of opdrachtgever…"
            aria-label="Ritten filteren"
            className="w-full bg-transparent text-[13px] outline-none placeholder:text-[#54615a]"
            style={{ color: C.ink }}
          />
          {q && (
            <button
              type="button"
              onClick={() => setQ("")}
              aria-label="Filter wissen"
              className={`flex h-5 w-5 items-center justify-center rounded-[4px] ${RING}`}
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
      </Panel>

      {mode === "loading" ? (
        <ul className="space-y-4" aria-hidden="true">
          {[0, 1, 2].map((i) => (
            <li key={i}>
              <Panel className="space-y-3 p-5">
                <div
                  className="h-4 w-2/3 animate-pulse rounded-[3px] motion-reduce:animate-none"
                  style={{ background: C.lineSoft }}
                />
                <div
                  className="h-3 w-1/2 animate-pulse rounded-[3px] motion-reduce:animate-none"
                  style={{ background: C.lineSoft }}
                />
              </Panel>
            </li>
          ))}
        </ul>
      ) : mode === "error" ? (
        <StateBlock
          Icon={TriangleAlert}
          tone={C.red}
          titel="Verbinding met de post verbroken"
          tekst="De ritten konden zojuist niet worden opgehaald. Herstel de seinverbinding en probeer opnieuw."
          cta="Opnieuw verbinden"
          onCta={() => setMode("ok")}
        />
      ) : rows.length === 0 ? (
        <StateBlock
          Icon={Search}
          tone={C.lunar}
          titel="Geen rit op dit spoor"
          tekst={`Niets voor ${q ? `“${q}”` : "je filter"}. Verruim de zoekopdracht en probeer opnieuw.`}
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
            className={`rounded text-[10px] font-bold uppercase tracking-[0.14em] underline-offset-2 hover:underline ${RING}`}
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
}: {
  Icon: LucideIcon;
  titel: string;
  tekst: string;
  cta: string;
  onCta: () => void;
  tone: string;
}) {
  return (
    <Panel className="flex flex-col items-center px-6 py-16 text-center" tone={tone}>
      <span
        className="flex h-16 w-16 items-center justify-center rounded-[10px]"
        style={{ color: tone, background: `${tone}1f`, border: `1px solid ${tone}55` }}
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
      <Btn variant="solid" tone={tone} className="mt-5" onClick={onCta}>
        <RefreshCw size={13} aria-hidden="true" /> {cta}
      </Btn>
    </Panel>
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
  const tone = strong ? C.green : C.lunar;
  return (
    <Panel as="article" className="overflow-hidden" tone={tone}>
      <div className="flex items-start gap-4 p-5">
        <span className="shrink-0 pt-0.5 text-center">
          <SpeedPlate value={opdracht.match} tone={tone} />
          <span
            className="mt-2 block rounded-[4px] px-2 py-0.5 text-[9.5px] font-bold uppercase tracking-[0.06em]"
            style={{ color: tone, background: `${tone}1f`, border: `1px solid ${tone}55` }}
          >
            {strong ? "vrije baan" : "oprijden"}
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
                className="rounded-[4px] px-2 py-0.5 text-[11px] font-semibold"
                style={{ background: C.raised, color: C.inkSoft, border: `1px solid ${C.line}` }}
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
        style={{ borderTop: `1px solid ${C.lineSoft}`, background: C.sink }}
      >
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          className={`inline-flex items-center gap-1.5 rounded-[5px] px-1 text-[12px] font-semibold ${RING}`}
          style={{ color: tone }}
        >
          {open ? <X size={13} aria-hidden="true" /> : <Activity size={13} aria-hidden="true" />}
          Seinredenen
        </button>
        <div className="ml-auto">
          <Btn variant="solid" size="sm" tone={tone} onClick={onOpen}>
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
              titel="Sein op veilig"
              tone={C.green}
              Icon={Check}
              items={opdracht.redenen.plus}
            />
            <RedenKolom
              titel="Let op sein"
              tone={C.amber}
              Icon={TriangleAlert}
              items={opdracht.redenen.min}
            />
          </div>
        </div>
      </div>
    </Panel>
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
        className="flex items-center gap-1.5 text-[10.5px] font-bold uppercase tracking-[0.12em]"
        style={{ color: tone }}
      >
        <Icon size={12} aria-hidden="true" /> {titel}
      </p>
      <ul className="mt-2.5 space-y-2">
        {items.map((r) => (
          <li
            key={r}
            className="flex items-start gap-2 text-[13px] leading-snug"
            style={{ color: C.inkSoft }}
          >
            <CircleDot
              size={12}
              aria-hidden="true"
              className="mt-1 shrink-0"
              style={{ color: tone }}
            />
            {r}
          </li>
        ))}
      </ul>
    </div>
  );
}

// —————————————————————————————————————— Opdracht-detail ——————————————————————————————————————
function OpdrachtDetail({ opdracht, onBack }: { opdracht: Opdracht; onBack: () => void }) {
  const strong = opdracht.match >= 90;
  const tone = strong ? C.green : C.lunar;
  const feiten = [
    { l: "Tarief", v: opdracht.tarief.replace(" / uur", ""), s: "per uur" },
    { l: "Omvang", v: opdracht.uren, s: "per week" },
    { l: "Aanvang", v: opdracht.start, s: "startdatum" },
    { l: "Match", v: `${opdracht.match}%`, s: "op profiel" },
  ];
  return (
    <div className="space-y-6">
      <Btn variant="ghost" size="sm" onClick={onBack}>
        <ArrowLeft size={13} aria-hidden="true" /> Terug naar sporenplan
      </Btn>

      <Panel className="overflow-hidden" tone={tone}>
        <div className="p-6">
          <div
            className="flex items-center gap-2 text-[11px] font-bold"
            style={{ color: C.inkFaint, ...mono }}
          >
            <span>{opdracht.id}</span>
            <span aria-hidden="true">·</span>
            <span
              className="rounded-[4px] px-2 py-0.5 uppercase tracking-[0.08em]"
              style={{ color: tone, background: `${tone}18` }}
            >
              {strong ? "vrije baan" : "oprijden"} · match {opdracht.match}%
            </span>
          </div>
          <h1
            className="mt-2.5 max-w-2xl text-[25px] font-bold leading-[1.12] tracking-[-0.02em] md:text-[29px]"
            style={{ color: C.ink }}
          >
            {opdracht.titel}
          </h1>
          <p className="mt-2 flex items-center gap-1.5 text-[13.5px]" style={{ color: C.inkMute }}>
            <MapPin size={14} aria-hidden="true" /> {opdracht.opdrachtgever} · {opdracht.plaats}
          </p>
          <div className="mt-4 flex flex-wrap gap-1.5">
            {opdracht.tags.map((t) => (
              <span
                key={t}
                className="rounded-[4px] px-2 py-0.5 text-[11px] font-semibold"
                style={{ background: C.raised, color: C.inkSoft, border: `1px solid ${C.line}` }}
              >
                {t}
              </span>
            ))}
          </div>
          <div className="mt-5 flex flex-wrap gap-2">
            <Btn variant="solid" tone={tone}>
              Reageren op rit <ArrowRight size={14} aria-hidden="true" />
            </Btn>
            <Btn variant="outline">Bewaren</Btn>
          </div>
        </div>

        <div
          className="grid grid-cols-2 sm:grid-cols-4"
          style={{ borderTop: `1px solid ${C.line}` }}
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
      </Panel>

      <Panel className="p-6" tone={C.green}>
        <Kicker tone={C.green}>
          <ListChecks size={13} aria-hidden="true" /> Navolgbaar — geen verborgen score
        </Kicker>
        <p className="mt-2 max-w-xl text-[13.5px] leading-relaxed" style={{ color: C.inkSoft }}>
          Afgezet tegen je geseinde profiel. Wat op veilig staat spreekt in je voordeel; wat op
          waarschuwing staat is goed om vooraf te weten.
        </p>
        <div className="mt-5 grid grid-cols-1 gap-6 md:grid-cols-2">
          <RedenDetail
            titel="Sein op veilig"
            tone={C.green}
            Icon={Check}
            items={opdracht.redenen.plus}
          />
          <RedenDetail
            titel="Let op sein"
            tone={C.amber}
            Icon={TriangleAlert}
            items={opdracht.redenen.min}
          />
        </div>
      </Panel>
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
        className="flex items-center gap-2 text-[10.5px] font-bold uppercase tracking-[0.12em]"
        style={{ color: tone }}
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
            <Icon
              size={15}
              aria-hidden="true"
              className="mt-0.5 shrink-0"
              style={{ color: tone }}
            />
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
        code="4 · Verificatie"
        tone={C.green}
        title="Seinhuis — vertrouwensregister"
        sub={`${verified} van ${CREDENTIALS.length} seinen op veilig · ${PROFIEL.trust}.`}
        right={
          <div
            className="rounded-[8px] px-4 py-2 text-right"
            style={{ background: C.greenSoft, border: `1px solid ${C.green}44` }}
          >
            <p
              className="text-[27px] font-bold leading-none tracking-[-0.02em]"
              style={{ color: C.green, ...mono }}
            >
              {ratio}%
            </p>
            <p
              className="text-[9px] font-bold uppercase tracking-[0.16em]"
              style={{ color: C.green }}
            >
              op veilig
            </p>
          </div>
        }
      />

      <Panel className="p-4">
        <div className="flex flex-wrap items-center gap-x-6 gap-y-3">
          {(["VERIFIED", "SUBMITTED", "EXPIRING", "REJECTED"] as CredStatus[]).map((st) => {
            const t = credTone(st);
            const count = CREDENTIALS.filter((c) => c.status === st).length;
            return (
              <span key={st} className="inline-flex items-center gap-2">
                <span className="text-[16px] font-bold" style={{ color: t.base, ...mono }}>
                  {count}
                </span>
                <StatusTag {...t} />
              </span>
            );
          })}
        </div>
      </Panel>

      <ul className="space-y-3">
        {CREDENTIALS.map((c) => {
          const t = credTone(c.status);
          const isOpen = open === c.naam;
          return (
            <li key={c.naam}>
              <Panel as="article" className="overflow-hidden" tone={t.base}>
                <button
                  type="button"
                  onClick={() => setOpen(isOpen ? null : c.naam)}
                  aria-expanded={isOpen}
                  className={`flex w-full items-center gap-3 px-5 py-4 text-left ${RING}`}
                >
                  <SignalHead aspect={t.aspect} size="sm" />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-[14px] font-bold" style={{ color: C.ink }}>
                      {c.naam}
                    </span>
                    <span
                      className="block truncate text-[11.5px]"
                      style={{ color: t.alarm ? t.base : C.inkMute }}
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
                        {c.detail}. Het bewijsstuk wordt versleuteld bewaard en uitsluitend na jouw
                        toestemming ingezien door een opdrachtgever.
                      </p>
                      <div className="mt-3 flex flex-wrap gap-2">
                        <Btn size="sm" variant="solid" tone={t.base}>
                          {c.status === "EXPIRING"
                            ? "Vernieuwen"
                            : c.status === "REJECTED"
                              ? "Opnieuw indienen"
                              : "Bekijken"}
                        </Btn>
                        <Btn size="sm" variant="outline">
                          Logboek
                        </Btn>
                      </div>
                    </div>
                  </div>
                </div>
              </Panel>
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
        code="5 · Acties"
        tone={C.amber}
        title="Bedieningslijst"
        sub="Op volgorde van sein. Zet de seinen op veilig voordat een rit tot stilstand komt."
      />
      <ol className="space-y-4">
        {ACTIES.map((a, i) => {
          const warn = a.urgentie === "warning";
          const tone = warn ? C.amber : C.lunar;
          const goMarkt = a.cta.toLowerCase().includes("match");
          const goFacturen = a.cta.toLowerCase().includes("herinner");
          return (
            <li key={a.titel}>
              <Panel className="flex items-start gap-4 p-5" tone={tone}>
                <span className="shrink-0">
                  <SignalHead aspect={warn ? "amber" : "lunar"} />
                </span>
                <div className="min-w-0 flex-1">
                  <Kicker tone={tone}>
                    {warn ? (
                      <TriangleAlert size={13} aria-hidden="true" />
                    ) : (
                      <Clock size={13} aria-hidden="true" />
                    )}
                    {warn ? "Waarschuwing" : "Oprijden"} · sein {String(i + 1).padStart(2, "0")}
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
                      onClick={goMarkt ? onMarkt : goFacturen ? onFacturen : undefined}
                    >
                      {a.cta} <ArrowRight size={13} aria-hidden="true" />
                    </Btn>
                  </div>
                </div>
              </Panel>
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
        code="6 · Facturen"
        title="Rittenstaat — facturatie"
        sub="Klik een regel om het seinbeeld van de factuur te openen."
        right={
          <Btn variant="solid" size="sm">
            <Plus size={13} aria-hidden="true" /> Nieuwe factuur
          </Btn>
        }
      />

      <section className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {[
          { l: "Gepasseerd", v: totals.betaald, sub: "2 facturen", tone: C.green, Icon: Check },
          {
            l: "Wacht op sein",
            v: totals.open,
            sub: "1 factuur · 9 dagen",
            tone: C.amber,
            Icon: Clock,
          },
          {
            l: "Rangeren",
            v: totals.concept,
            sub: "klaar om te versturen",
            tone: C.lunar,
            Icon: FileText,
          },
        ].map((s) => (
          <Panel key={s.l} className="p-4" tone={s.tone}>
            <div className="flex items-center justify-between">
              <p
                className="text-[9.5px] font-bold uppercase tracking-[0.14em]"
                style={{ color: s.tone }}
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
          </Panel>
        ))}
      </section>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-[1.5fr_1fr]">
        <Panel className="overflow-hidden" tone={C.green}>
          <div
            className="flex items-center justify-between px-5 py-3"
            style={{ borderBottom: `1px solid ${C.line}` }}
          >
            <Kicker tone={C.green}>
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
                <tr style={{ borderBottom: `1px solid ${C.line}` }}>
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
                      className={`ws-row cursor-pointer ${RING}`}
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
                        background: on ? C.greenSoft : undefined,
                      }}
                    >
                      <td
                        className="px-4 py-3 text-[12px] font-bold"
                        style={{ color: on ? C.green : C.inkSoft, ...mono }}
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
        </Panel>

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
    <Panel as="article" className="overflow-hidden" tone={t.base}>
      <div
        className="flex items-center justify-between p-5"
        style={{ borderBottom: `1px solid ${C.line}` }}
      >
        <div>
          <p
            className="text-[9.5px] font-bold uppercase tracking-[0.18em]"
            style={{ color: t.base }}
          >
            Seinbeeld factuur
          </p>
          <p className="text-[17px] font-bold" style={{ color: C.ink, ...mono }}>
            {factuur.nr}
          </p>
        </div>
        <SignalHead aspect={t.aspect} />
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
        <div className="my-3 h-px" style={{ background: C.line }} />
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
          <span className="text-[20px] font-bold" style={{ color: t.base, ...mono }}>
            {factuur.bedrag}
          </span>
        </div>
        <div className="mt-4 flex gap-2">
          <Btn variant="solid" size="sm" full tone={t.base}>
            {factuur.status === "Concept"
              ? "Versturen"
              : factuur.status === "Openstaand"
                ? "Herinnering"
                : "Download"}
            <ArrowRight size={13} aria-hidden="true" />
          </Btn>
          <Btn variant="outline" size="sm">
            PDF
          </Btn>
        </div>
      </div>
    </Panel>
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
