"use client";

// Concept 537 — "Theelicht" · Warm, mensgericht en geruststellend. Het platform als een intieme,
// zacht verlichte ruimte: warme neutralen (amber, zand, terracotta-zweem), diffuse gloed rond wat
// telt, ronde vormen en een menselijke micro-copy-toon. Rond gevoelige documenten straalt het rust
// en vertrouwen uit — warmte als bewijs van zorg. Premium en kalm, nooit druk. Status krijgt altijd
// een label + icoon (nooit alleen kleur).

import { useMemo, useState, type CSSProperties, type ReactNode } from "react";
import {
  AlarmClock,
  ArrowLeft,
  ArrowRight,
  Bell,
  Check,
  ChevronRight,
  Clock,
  Coffee,
  FileText,
  Flame,
  Hand,
  Heart,
  HeartHandshake,
  Hourglass,
  Inbox,
  MapPin,
  MessageCircle,
  Plus,
  Receipt,
  RotateCcw,
  Search,
  Send,
  ShieldCheck,
  Sparkles,
  Sprout,
  Store,
  Sun,
  X,
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

// ————————————————————————————— Palet — kaarslicht op warm papier —————————————————————————————
const C = {
  bg: "#f7f0e6",
  paper: "#f3eadd",
  panel: "#fdfaf4",
  sink: "#f0e7d9",
  cream: "#faf4ea",
  line: "#e6d8c4",
  lineSoft: "#efe3d2",
  ink: "#33291f",
  inkSoft: "#5b4c3b",
  inkMute: "#8a7864",
  inkFaint: "#b3a48f",
  amber: "#c98a2b",
  amberSoft: "#f7e9cf",
  amberDeep: "#9a6714",
  terra: "#c05f3a",
  terraSoft: "#f6ddd0",
  terraDeep: "#96442a",
  sage: "#7f8a52",
  sageSoft: "#e9ecd4",
  sageDeep: "#5d6739",
  honey: "#e0a94a",
  glow: "#f2c877",
};

const serif: CSSProperties = {
  fontFamily:
    "'Iowan Old Style', 'Palatino Linotype', 'Palatino', 'Georgia', 'Times New Roman', serif",
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
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#c98a2b] focus-visible:ring-offset-2 focus-visible:ring-offset-[#f7f0e6]";

// ————————————————————————————— Status-taal (label + icoon, menselijk) —————————————————————————————
type Tone = {
  base: string;
  soft: string;
  deep: string;
  label: string;
  Icon: LucideIcon;
  warm: boolean;
};

function credTone(s: CredStatus): Tone {
  switch (s) {
    case "VERIFIED":
      return {
        base: C.sage,
        soft: C.sageSoft,
        deep: C.sageDeep,
        label: "In orde",
        Icon: ShieldCheck,
        warm: false,
      };
    case "SUBMITTED":
      return {
        base: C.amber,
        soft: C.amberSoft,
        deep: C.amberDeep,
        label: "We kijken ernaar",
        Icon: Hourglass,
        warm: false,
      };
    case "EXPIRING":
      return {
        base: C.terra,
        soft: C.terraSoft,
        deep: C.terraDeep,
        label: "Loopt bijna af",
        Icon: AlarmClock,
        warm: true,
      };
    case "REJECTED":
      return {
        base: C.terraDeep,
        soft: C.terraSoft,
        deep: C.terraDeep,
        label: "Even opnieuw",
        Icon: RotateCcw,
        warm: true,
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
    return { base: C.sage, soft: C.sageSoft, deep: C.sageDeep, label: "Voldaan", Icon: Check };
  if (status === "Openstaand")
    return { base: C.amber, soft: C.amberSoft, deep: C.amberDeep, label: "Nog open", Icon: Clock };
  return { base: C.terra, soft: C.terraSoft, deep: C.terraDeep, label: "Concept", Icon: FileText };
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

// ————————————————————————————— Warme decoratie — diffuse gloed —————————————————————————————
function Glow({ tone = C.glow, className = "" }: { tone?: string; className?: string }) {
  return (
    <span
      aria-hidden="true"
      className={`pointer-events-none absolute ${className}`}
      style={{
        background: `radial-gradient(circle, ${tone}66 0%, ${tone}22 45%, transparent 72%)`,
      }}
    />
  );
}

// Kaarsvlammetje — klein sfeer-accent
function Candle({ size = 16, tone = C.honey }: { size?: number; tone?: string }) {
  return (
    <span
      className="relative inline-flex items-center justify-center"
      style={{ width: size, height: size }}
      aria-hidden="true"
    >
      <span
        className="tl-flicker absolute inset-0 rounded-full"
        style={{
          background: `radial-gradient(circle, ${tone} 0%, ${tone}44 55%, transparent 75%)`,
        }}
      />
      <Flame size={size * 0.62} style={{ color: tone, position: "relative" }} />
    </span>
  );
}

// ————————————————————————————— Primitives —————————————————————————————
function Card({
  children,
  className = "",
  as: Tag = "div",
  tone,
  glow = false,
  soft = false,
}: {
  children: ReactNode;
  className?: string;
  as?: "div" | "section" | "article" | "aside" | "li";
  tone?: string;
  glow?: boolean;
  soft?: boolean;
}) {
  return (
    <Tag
      className={`relative overflow-hidden rounded-[20px] ${className}`}
      style={{
        background: soft ? C.cream : C.panel,
        border: `1px solid ${tone ? `${tone}44` : C.line}`,
        boxShadow:
          "0 1px 0 rgba(255,255,255,0.7) inset, 0 18px 40px -30px rgba(150,68,42,0.35), 0 2px 8px -6px rgba(51,41,31,0.18)",
      }}
    >
      {glow && <Glow tone={tone ?? C.glow} className="-right-10 -top-14 h-40 w-40" />}
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
  tone = C.amber,
  deep = C.amberDeep,
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
  const pad = size === "sm" ? "px-3.5 py-2 text-[12.5px]" : "px-5 py-3 text-[13.5px]";
  const base = `inline-flex items-center justify-center gap-2 rounded-full font-semibold tracking-[-0.01em] transition-all duration-200 active:translate-y-px ${RING} ${full ? "w-full" : ""}`;
  const style: CSSProperties =
    variant === "solid"
      ? {
          background: `linear-gradient(180deg, ${tone} 0%, ${deep} 130%)`,
          color: "#fdfaf4",
          border: `1px solid ${deep}`,
          boxShadow: `0 8px 20px -10px ${tone}aa`,
          ...sans,
        }
      : variant === "outline"
        ? { background: C.panel, color: deep, border: `1px solid ${tone}66`, ...sans }
        : { background: "transparent", color: C.inkSoft, border: "1px solid transparent", ...sans };
  const hover = variant === "solid" ? "hover:brightness-105" : "hover:bg-[#f0e7d9]";
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

function StatusTag({ base, soft, label, Icon, warm }: Tone) {
  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold"
      style={{ color: base, background: soft, border: `1px solid ${base}44`, ...sans }}
    >
      <Icon size={12} aria-hidden="true" />
      {label}
      {warm && <span className="sr-only"> (vraagt aandacht)</span>}
    </span>
  );
}

// Match als warme gloed-ring
function MatchGlow({ value, tone }: { value: number; tone: string }) {
  const r = 20;
  const circ = 2 * Math.PI * r;
  const off = circ - (value / 100) * circ;
  return (
    <span
      className="relative inline-flex h-14 w-14 items-center justify-center"
      aria-label={`Match ${value} procent`}
    >
      <Glow tone={tone} className="inset-0" />
      <svg width="56" height="56" viewBox="0 0 56 56" className="relative -rotate-90">
        <circle cx="28" cy="28" r={r} fill="none" stroke={`${tone}33`} strokeWidth="4" />
        <circle
          cx="28"
          cy="28"
          r={r}
          fill="none"
          stroke={tone}
          strokeWidth="4"
          strokeLinecap="round"
          strokeDasharray={circ}
          strokeDashoffset={off}
        />
      </svg>
      <span className="absolute text-[13px] font-bold" style={{ color: tone, ...mono }}>
        {value}
      </span>
    </span>
  );
}

function Kicker({ children, tone = C.amberDeep }: { children: ReactNode; tone?: string }) {
  return (
    <span
      className="inline-flex items-center gap-1.5 text-[10.5px] font-bold uppercase tracking-[0.16em]"
      style={{ color: tone, ...sans }}
    >
      {children}
    </span>
  );
}

function ScreenHead({
  kicker,
  title,
  sub,
  right,
  KIcon = Sun,
  tone = C.amberDeep,
}: {
  kicker: string;
  title: string;
  sub?: string;
  right?: ReactNode;
  KIcon?: LucideIcon;
  tone?: string;
}) {
  return (
    <div className="mb-7 flex flex-wrap items-end justify-between gap-4">
      <div className="min-w-0">
        <Kicker tone={tone}>
          <KIcon size={13} aria-hidden="true" /> {kicker}
        </Kicker>
        <h1
          className="mt-2 text-[27px] font-bold leading-[1.1] tracking-[-0.02em] md:text-[33px]"
          style={{ color: C.ink, ...serif }}
        >
          {title}
        </h1>
        {sub && (
          <p className="mt-2 max-w-xl text-[13.5px] leading-relaxed" style={{ color: C.inkMute }}>
            {sub}
          </p>
        )}
      </div>
      {right}
    </div>
  );
}

const NAV: Record<ScreenKey, { Icon: LucideIcon; woord: string }> = {
  dashboard: { Icon: Sun, woord: "Vandaag" },
  marktplaats: { Icon: Store, woord: "Kansen" },
  opdracht: { Icon: MapPin, woord: "Deze plek" },
  verificatie: { Icon: ShieldCheck, woord: "Je bewijs" },
  acties: { Icon: Sparkles, woord: "Zorg" },
  facturen: { Icon: Receipt, woord: "Geld" },
  documenten: { Icon: FileText, woord: "Kluis" },
  berichten: { Icon: MessageCircle, woord: "Contact" },
};

// —————————————————————————————————————— Root ——————————————————————————————————————
export function Concept537() {
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
          <main key={screen} className="tl-fade px-4 pb-24 pt-7 sm:px-6 md:px-8">
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
        @keyframes tlFade { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: none; } }
        .tl-fade { animation: tlFade 0.4s cubic-bezier(0.22,1,0.36,1) both; }
        @keyframes tlFlicker { 0%,100% { opacity: 0.85; transform: scale(1); } 50% { opacity: 1; transform: scale(1.08); } }
        .tl-flicker { animation: tlFlicker 2.6s ease-in-out infinite; }
        .tl-row { transition: background 0.2s ease; }
        .tl-row:hover { background: ${C.cream}; }
        @media (prefers-reduced-motion: reduce) {
          .tl-fade, .tl-flicker { animation: none !important; }
          .tl-row { transition: none !important; }
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
      className="sticky top-0 hidden h-screen w-[240px] shrink-0 flex-col md:flex"
      style={{ background: C.paper, borderRight: `1px solid ${C.line}` }}
    >
      <div
        className="flex items-center gap-3 px-5 py-5"
        style={{ borderBottom: `1px solid ${C.line}` }}
      >
        <span
          className="relative flex h-10 w-10 items-center justify-center rounded-[13px]"
          style={{
            background: `linear-gradient(160deg, ${C.honey} 0%, ${C.amberDeep} 130%)`,
            color: "#fdfaf4",
            border: `1px solid ${C.amberDeep}`,
          }}
          aria-hidden="true"
        >
          <Glow tone={C.glow} className="-inset-2" />
          <Flame size={18} className="relative" />
        </span>
        <span>
          <span
            className="block text-[15px] font-bold tracking-[-0.01em]"
            style={{ color: C.ink, ...serif }}
          >
            Theelicht
          </span>
          <span
            className="mt-0.5 block text-[9.5px] font-bold uppercase tracking-[0.18em]"
            style={{ color: C.amberDeep }}
          >
            fijn dat je er bent
          </span>
        </span>
      </div>

      <nav aria-label="Hoofdmenu" className="flex-1 overflow-y-auto px-3 py-4">
        <p
          className="px-3 pb-2 text-[9.5px] font-bold uppercase tracking-[0.18em]"
          style={{ color: C.inkFaint }}
        >
          Jouw plek
        </p>
        <ul className="space-y-1">
          {SCREENS.map((s) => {
            const on = s.key === screen;
            const { Icon, woord } = NAV[s.key];
            return (
              <li key={s.key}>
                <button
                  type="button"
                  onClick={() => setScreen(s.key)}
                  aria-current={on ? "page" : undefined}
                  className={`group flex w-full items-center gap-3 rounded-[14px] px-3 py-2.5 text-left text-[13.5px] font-semibold transition-colors ${RING}`}
                  style={
                    on ? { background: C.amberSoft, color: C.amberDeep } : { color: C.inkSoft }
                  }
                >
                  <span
                    className="flex h-8 w-8 items-center justify-center rounded-[11px]"
                    style={{
                      background: on ? C.amber : C.sink,
                      color: on ? "#fdfaf4" : C.inkMute,
                      border: `1px solid ${on ? C.amberDeep : C.line}`,
                    }}
                    aria-hidden="true"
                  >
                    <Icon size={15} />
                  </span>
                  <span className="flex-1">{s.label}</span>
                  <span
                    className="text-[9.5px] font-semibold"
                    style={{ color: on ? C.amber : C.inkFaint }}
                  >
                    {woord}
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      </nav>

      <div className="px-4 py-4" style={{ borderTop: `1px solid ${C.line}` }}>
        <div
          className="relative mb-3 overflow-hidden rounded-[16px] p-4"
          style={{ background: C.sageSoft, border: `1px solid ${C.sage}44` }}
        >
          <Glow tone={C.sage} className="-right-6 -top-8 h-24 w-24" />
          <p
            className="relative flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.14em]"
            style={{ color: C.sageDeep }}
          >
            <Sprout size={12} aria-hidden="true" /> Je dossier bloeit
          </p>
          <p
            className="relative mt-1.5 text-[22px] font-bold leading-none"
            style={{ color: C.ink, ...mono }}
          >
            {ratio}%
          </p>
          <p className="relative mt-1 text-[10.5px]" style={{ color: C.inkMute }}>
            {verified} van {CREDENTIALS.length} bewijzen in orde
          </p>
        </div>
        <div className="flex items-center gap-2.5">
          <span
            className="flex h-9 w-9 items-center justify-center rounded-full text-[11px] font-bold"
            style={{
              background: `linear-gradient(160deg, ${C.honey}, ${C.terra})`,
              color: "#fdfaf4",
              ...mono,
            }}
            aria-hidden="true"
          >
            {PROFIEL.initialen}
          </span>
          <span className="min-w-0 flex-1">
            <span className="block truncate text-[12.5px] font-bold" style={{ color: C.ink }}>
              {PROFIEL.naam}
            </span>
            <span
              className="flex items-center gap-1 text-[10px] font-semibold"
              style={{ color: C.sageDeep }}
            >
              <Heart size={10} aria-hidden="true" /> {PROFIEL.trust}
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
  const uur = new Date().getHours();
  const groet = uur < 12 ? "Goedemorgen" : uur < 18 ? "Goedemiddag" : "Goedenavond";
  return (
    <header
      className="sticky top-0 z-20 flex items-center gap-3 px-4 py-3.5 sm:px-6 md:px-8"
      style={{
        background: `${C.bg}ee`,
        borderBottom: `1px solid ${C.line}`,
        backdropFilter: "blur(10px)",
      }}
    >
      <span
        className="hidden items-center gap-1.5 text-[12.5px] font-semibold lg:inline-flex"
        style={{ color: C.inkSoft }}
      >
        <Coffee size={14} aria-hidden="true" style={{ color: C.amber }} /> {groet},{" "}
        {PROFIEL.naam.split(" ")[0]}
      </span>
      <div
        className="flex flex-1 items-center gap-2 rounded-full px-4 py-2.5"
        style={{ background: C.panel, border: `1px solid ${C.line}` }}
      >
        <Search size={14} aria-hidden="true" style={{ color: C.inkFaint }} />
        <span className="truncate text-[12.5px]" style={{ color: C.inkFaint }}>
          Waar kunnen we je mee helpen?
        </span>
        <span
          className="ml-auto hidden rounded-full px-2 py-0.5 text-[10px] font-bold sm:inline"
          style={{ background: C.sink, color: C.inkMute, ...mono }}
        >
          ⌘K
        </span>
      </div>
      <span
        className="hidden items-center gap-1.5 rounded-full px-3 py-2 text-[12px] font-semibold sm:inline-flex"
        style={{ background: C.amberSoft, color: C.amberDeep, border: `1px solid ${C.amber}44` }}
      >
        <Clock size={13} aria-hidden="true" />
        <span style={{ ...mono }}>{eur0.format(open)}</span> onderweg
      </span>
      <span
        className="flex items-center gap-1.5"
        style={{ color: C.inkMute }}
        aria-label={`Menu: ${NAV[screen].woord}`}
      >
        <Candle size={18} />
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
      aria-label="Hoofdmenu"
      className="flex gap-2 overflow-x-auto px-4 py-3 md:hidden"
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
            className={`shrink-0 rounded-full px-3.5 py-1.5 text-[12.5px] font-semibold transition-colors ${RING}`}
            style={
              on
                ? { background: C.amber, color: "#fdfaf4" }
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
  const ongelezen = BERICHTEN.filter((b) => b.ongelezen).length;
  return (
    <div className="space-y-8">
      <ScreenHead
        kicker="Even bijpraten"
        title={`Fijn dat je er bent, ${PROFIEL.naam.split(" ")[0]}`}
        sub="Rustig aan — we hebben alles voor je klaargezet. Eén ding vraagt vandaag om een beetje aandacht, de rest loopt goed."
        KIcon={Sun}
        right={
          <div className="flex gap-2">
            <Btn variant="outline" size="sm" tone={C.sage} deep={C.sageDeep} onClick={onVerif}>
              <ShieldCheck size={13} aria-hidden="true" /> Mijn bewijs
            </Btn>
            <Btn variant="solid" size="sm" onClick={onActies}>
              Wat vraagt zorg <ArrowRight size={13} aria-hidden="true" />
            </Btn>
          </div>
        }
      />

      <section className="grid grid-cols-2 gap-4 xl:grid-cols-4">
        {KPIS.map((k) => (
          <Card key={k.label} className="p-5" glow tone={C.honey}>
            <p className="text-[11.5px] font-semibold" style={{ color: C.inkMute }}>
              {k.label}
            </p>
            <p
              className="mt-2.5 text-[27px] font-bold leading-none tracking-[-0.02em]"
              style={{ color: C.ink, ...mono }}
            >
              {k.value}
            </p>
            <div className="mt-3.5 flex items-center justify-between">
              <span
                className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-bold"
                style={{
                  color: k.up ? C.sageDeep : C.terraDeep,
                  background: k.up ? C.sageSoft : C.terraSoft,
                }}
              >
                {k.up ? "▲" : "▼"} {k.trend}
              </span>
              <span className="inline-flex h-6 items-end gap-[3px]" aria-hidden="true">
                {k.spark.map((d, j) => {
                  const max = Math.max(...k.spark);
                  const min = Math.min(...k.spark);
                  const h = 4 + ((d - min) / (max - min || 1)) * 18;
                  const last = j === k.spark.length - 1;
                  return (
                    <span
                      key={j}
                      className="w-[3px] rounded-full"
                      style={{ height: h, background: last ? C.amber : `${C.amber}44` }}
                    />
                  );
                })}
              </span>
            </div>
          </Card>
        ))}
      </section>

      <section className="grid grid-cols-1 gap-6 lg:grid-cols-[1.5fr_1fr]">
        <Card className="overflow-hidden" tone={C.amber}>
          <div
            className="flex items-center justify-between px-6 py-4"
            style={{ borderBottom: `1px solid ${C.lineSoft}` }}
          >
            <Kicker tone={C.amberDeep}>
              <Store size={13} aria-hidden="true" /> Kansen die bij je passen
            </Kicker>
            <button
              type="button"
              onClick={onMarkt}
              className={`rounded-full px-2 text-[11.5px] font-semibold ${RING}`}
              style={{ color: C.amberDeep }}
            >
              Alles bekijken →
            </button>
          </div>
          <ul>
            {OPDRACHTEN.map((o, i) => {
              const tone = o.match >= 90 ? C.sage : C.amber;
              return (
                <li key={o.id}>
                  <button
                    type="button"
                    onClick={onOpen}
                    className={`tl-row flex w-full items-center gap-4 px-6 py-4 text-left ${RING}`}
                    style={{ borderTop: i === 0 ? "none" : `1px solid ${C.lineSoft}` }}
                  >
                    <MatchGlow value={o.match} tone={tone} />
                    <span className="min-w-0 flex-1">
                      <span
                        className="block truncate text-[14.5px] font-bold"
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
                    <ChevronRight size={17} aria-hidden="true" style={{ color: C.inkFaint }} />
                  </button>
                </li>
              );
            })}
          </ul>
        </Card>

        <div className="space-y-6">
          <Card className="p-6" tone={C.sage} glow soft>
            <Kicker tone={C.sageDeep}>
              <HeartHandshake size={13} aria-hidden="true" /> Je staat er goed voor
            </Kicker>
            <div className="mt-2.5 flex items-baseline gap-2">
              <span
                className="text-[38px] font-bold leading-none tracking-[-0.03em]"
                style={{ color: C.sageDeep, ...mono }}
              >
                {ratio}%
              </span>
              <span className="text-[12px]" style={{ color: C.inkMute }}>
                van je bewijs is in orde
              </span>
            </div>
            <div className="mt-3.5 flex gap-1.5" aria-hidden="true">
              {CREDENTIALS.map((c) => {
                const t = credTone(c.status);
                return (
                  <span
                    key={c.naam}
                    className="h-2.5 flex-1 rounded-full"
                    style={{ background: c.status === "VERIFIED" ? C.sage : `${t.base}55` }}
                  />
                );
              })}
            </div>
            <p className="mt-3 text-[11.5px] leading-relaxed" style={{ color: C.inkMute }}>
              Mooi bezig — {PROFIEL.trust.toLowerCase()}. Opdrachtgevers zien meteen dat ze op je
              kunnen bouwen.
            </p>
          </Card>

          <Card className="p-6" tone={C.terra} glow as="article">
            <Kicker tone={C.terraDeep}>
              <Hand size={13} aria-hidden="true" /> Eén kleine attentie
            </Kicker>
            <h3
              className="mt-2 text-[16px] font-bold leading-snug"
              style={{ color: C.ink, ...serif }}
            >
              {primair.titel}
            </h3>
            <p className="mt-1.5 text-[12.5px] leading-relaxed" style={{ color: C.inkSoft }}>
              {primair.detail}
            </p>
            <Btn
              variant="solid"
              size="sm"
              full
              tone={C.terra}
              deep={C.terraDeep}
              className="mt-4"
              onClick={onActies}
            >
              {primair.cta} <ArrowRight size={13} aria-hidden="true" />
            </Btn>
          </Card>

          <Card className="p-5" tone={C.amber} soft>
            <div className="flex items-center justify-between">
              <Kicker tone={C.amberDeep}>
                <Inbox size={13} aria-hidden="true" /> Berichten
              </Kicker>
              <span
                className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10.5px] font-bold"
                style={{ background: C.amberSoft, color: C.amberDeep }}
              >
                <Bell size={11} aria-hidden="true" /> {ongelezen} nieuw
              </span>
            </div>
            <ul className="mt-3 space-y-2.5">
              {BERICHTEN.slice(0, 2).map((b) => (
                <li key={b.van} className="flex items-start gap-2.5">
                  <span
                    className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[10px] font-bold"
                    style={{ background: C.sink, color: C.inkSoft, ...mono }}
                    aria-hidden="true"
                  >
                    {b.initialen}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="flex items-center gap-1.5">
                      <span className="truncate text-[12px] font-bold" style={{ color: C.ink }}>
                        {b.van}
                      </span>
                      {b.ongelezen && (
                        <span
                          className="h-1.5 w-1.5 shrink-0 rounded-full"
                          style={{ background: C.terra }}
                          aria-label="ongelezen"
                        />
                      )}
                    </span>
                    <span className="block truncate text-[11px]" style={{ color: C.inkMute }}>
                      {b.preview}
                    </span>
                  </span>
                  <span className="shrink-0 text-[10px]" style={{ color: C.inkFaint, ...mono }}>
                    {b.tijd}
                  </span>
                </li>
              ))}
            </ul>
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
        kicker="Zonder haast"
        title="Kansen die op je passen"
        sub={`We hebben ${rows.length} van de ${OPDRACHTEN.length} plekken uitgelicht die goed bij je profiel voelen. Kijk gerust rond.`}
        KIcon={Store}
      />

      <Card className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center" tone={C.amber}>
        <div
          className="flex flex-1 items-center gap-2 rounded-full px-4 py-2.5"
          style={{ background: C.sink, border: `1px solid ${C.line}` }}
        >
          <Search size={15} aria-hidden="true" style={{ color: C.inkFaint }} />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Zoek op titel, plaats of opdrachtgever…"
            aria-label="Kansen zoeken"
            className="w-full bg-transparent text-[13px] outline-none placeholder:text-[#b3a48f]"
            style={{ color: C.ink }}
          />
          {q && (
            <button
              type="button"
              onClick={() => setQ("")}
              aria-label="Zoekopdracht wissen"
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
              {s === "match" ? "Beste match" : "Tarief"}
            </Btn>
          ))}
        </div>
      </Card>

      {mode === "loading" ? (
        <ul className="space-y-4" aria-hidden="true">
          {[0, 1, 2].map((i) => (
            <li key={i}>
              <Card className="space-y-3 p-6">
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
          Icon={Coffee}
          tone={C.terra}
          deep={C.terraDeep}
          titel="Even een kort momentje"
          tekst="Het lukte net niet om de kansen op te halen. Geen zorgen — probeer het zo nog eens, we staan voor je klaar."
          cta="Opnieuw proberen"
          onCta={() => setMode("ok")}
        />
      ) : rows.length === 0 ? (
        <StateBlock
          Icon={Search}
          tone={C.amber}
          deep={C.amberDeep}
          titel="Nog niets gevonden"
          tekst={`We vonden niets voor ${q ? `“${q}”` : "je zoekopdracht"}. Verruim gerust je zoektocht — er komt vast iets moois voorbij.`}
          cta="Zoekopdracht wissen"
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
    <Card className="flex flex-col items-center px-6 py-16 text-center" tone={tone} glow soft>
      <span
        className="relative flex h-16 w-16 items-center justify-center rounded-[20px]"
        style={{ color: tone, background: `${tone}22`, border: `1px solid ${tone}55` }}
        aria-hidden="true"
      >
        <Glow tone={tone} className="-inset-3" />
        <Icon size={26} className="relative" />
      </span>
      <p className="mt-4 text-[20px] font-bold" style={{ color: C.ink, ...serif }}>
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
  const tone = strong ? C.sage : C.amber;
  const deep = strong ? C.sageDeep : C.amberDeep;
  return (
    <Card as="article" className="overflow-hidden" tone={tone} glow>
      <div className="flex items-start gap-4 p-6">
        <span className="shrink-0 pt-0.5 text-center">
          <MatchGlow value={opdracht.match} tone={tone} />
          <span
            className="mt-2 block rounded-full px-2.5 py-0.5 text-[9.5px] font-bold uppercase tracking-[0.06em]"
            style={{ color: deep, background: `${tone}22`, border: `1px solid ${tone}55` }}
          >
            {strong ? "warme klik" : "goede match"}
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
            className="mt-1 text-[16.5px] font-bold leading-snug tracking-[-0.01em]"
            style={{ color: C.ink, ...serif }}
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
                style={{ background: C.cream, color: C.inkSoft, border: `1px solid ${C.line}` }}
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
        className="flex flex-wrap items-center gap-2 px-6 py-3.5"
        style={{ borderTop: `1px solid ${C.lineSoft}`, background: C.cream }}
      >
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          className={`inline-flex items-center gap-1.5 rounded-full px-1 text-[12px] font-semibold ${RING}`}
          style={{ color: deep }}
        >
          {open ? <X size={13} aria-hidden="true" /> : <Sparkles size={13} aria-hidden="true" />}
          Waarom dit past
        </button>
        <div className="ml-auto">
          <Btn variant="solid" size="sm" tone={tone} deep={deep} onClick={onOpen}>
            Reageer <ArrowRight size={12} aria-hidden="true" />
          </Btn>
        </div>
      </div>

      <div
        className="grid transition-all duration-300 motion-reduce:transition-none"
        style={{ gridTemplateRows: open ? "1fr" : "0fr" }}
      >
        <div className="overflow-hidden">
          <div
            className="grid grid-cols-1 gap-6 p-6 sm:grid-cols-2"
            style={{ borderTop: `1px solid ${C.lineSoft}` }}
          >
            <RedenKolom
              titel="Spreekt voor je"
              tone={C.sage}
              deep={C.sageDeep}
              Icon={Check}
              items={opdracht.redenen.plus}
            />
            <RedenKolom
              titel="Goed om te weten"
              tone={C.terra}
              deep={C.terraDeep}
              Icon={Hand}
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
      <ul className="mt-3 space-y-2.5">
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
  const tone = strong ? C.sage : C.amber;
  const deep = strong ? C.sageDeep : C.amberDeep;
  const feiten = [
    { l: "Tarief", v: opdracht.tarief.replace(" / uur", ""), s: "per uur" },
    { l: "Omvang", v: opdracht.uren, s: "per week" },
    { l: "Start", v: opdracht.start, s: "wanneer" },
    { l: "Match", v: `${opdracht.match}%`, s: "op jou" },
  ];
  return (
    <div className="space-y-6">
      <Btn variant="ghost" size="sm" onClick={onBack}>
        <ArrowLeft size={13} aria-hidden="true" /> Terug naar de kansen
      </Btn>

      <Card className="overflow-hidden" tone={tone} glow>
        <div className="p-7">
          <div
            className="flex items-center gap-2 text-[11px] font-bold"
            style={{ color: C.inkFaint, ...mono }}
          >
            <span>{opdracht.id}</span>
            <span aria-hidden="true">·</span>
            <span
              className="rounded-full px-2.5 py-0.5 uppercase tracking-[0.08em]"
              style={{ color: deep, background: `${tone}22` }}
            >
              {strong ? "warme klik" : "goede match"} · {opdracht.match}%
            </span>
          </div>
          <h1
            className="mt-3 max-w-2xl text-[26px] font-bold leading-[1.14] tracking-[-0.02em] md:text-[31px]"
            style={{ color: C.ink, ...serif }}
          >
            {opdracht.titel}
          </h1>
          <p
            className="mt-2.5 flex items-center gap-1.5 text-[13.5px]"
            style={{ color: C.inkMute }}
          >
            <MapPin size={14} aria-hidden="true" /> {opdracht.opdrachtgever} · {opdracht.plaats}
          </p>
          <div className="mt-4 flex flex-wrap gap-1.5">
            {opdracht.tags.map((t) => (
              <span
                key={t}
                className="rounded-full px-2.5 py-0.5 text-[11px] font-semibold"
                style={{ background: C.panel, color: C.inkSoft, border: `1px solid ${C.line}` }}
              >
                {t}
              </span>
            ))}
          </div>
          <div className="mt-5 flex flex-wrap gap-2">
            <Btn variant="solid" tone={tone} deep={deep}>
              <Send size={14} aria-hidden="true" /> Reageer op deze plek
            </Btn>
            <Btn variant="outline" tone={tone} deep={deep}>
              <Heart size={14} aria-hidden="true" /> Bewaar voor later
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
              className="p-5"
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
                className="mt-1.5 text-[19px] font-bold leading-none"
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

      <Card className="p-7" tone={C.amber} soft>
        <Kicker tone={C.amberDeep}>
          <Sparkles size={13} aria-hidden="true" /> Open en eerlijk — geen verborgen score
        </Kicker>
        <p className="mt-2.5 max-w-xl text-[13.5px] leading-relaxed" style={{ color: C.inkSoft }}>
          We leggen graag uit waarom deze plek bij je past. Wat voor je spreekt zetten we voorop;
          wat goed is om te weten verzwijgen we niet — zo kies je met een gerust hart.
        </p>
        <div className="mt-6 grid grid-cols-1 gap-7 md:grid-cols-2">
          <RedenDetail
            titel="Spreekt voor je"
            tone={C.sage}
            deep={C.sageDeep}
            Icon={Check}
            items={opdracht.redenen.plus}
          />
          <RedenDetail
            titel="Goed om te weten"
            tone={C.terra}
            deep={C.terraDeep}
            Icon={Hand}
            items={opdracht.redenen.min}
          />
        </div>
      </Card>

      <Card className="p-7" tone={C.sage} soft>
        <Kicker tone={C.sageDeep}>
          <ShieldCheck size={13} aria-hidden="true" /> Wat deze plek van je vraagt
        </Kicker>
        <p className="mt-2.5 max-w-xl text-[13px] leading-relaxed" style={{ color: C.inkSoft }}>
          Je hebt hier alles al voor in huis. Zo staat je bewijs ervoor:
        </p>
        <ul className="mt-4 space-y-2.5">
          {CREDENTIALS.slice(0, 3).map((c) => {
            const t = credTone(c.status);
            return (
              <li
                key={c.naam}
                className="flex items-center gap-3 rounded-[14px] px-4 py-3"
                style={{ background: C.panel, border: `1px solid ${C.lineSoft}` }}
              >
                <span
                  className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full"
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
      <ul className="mt-3.5 space-y-3.5">
        {items.map((r) => (
          <li
            key={r}
            className="flex items-start gap-3 text-[13.5px] leading-snug"
            style={{ color: C.inkSoft }}
          >
            <span
              className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full"
              style={{ background: `${tone}22`, color: tone }}
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
  return (
    <div className="space-y-6">
      <ScreenHead
        kicker="Veilig bewaard"
        title="Je bewijs, met zorg bewaard"
        sub={`${verified} van de ${CREDENTIALS.length} bewijzen zijn in orde. Je documenten liggen versleuteld en veilig — alleen jij bepaalt wie meekijkt.`}
        KIcon={ShieldCheck}
        tone={C.sageDeep}
        right={
          <div
            className="relative overflow-hidden rounded-[18px] px-5 py-3 text-right"
            style={{ background: C.sageSoft, border: `1px solid ${C.sage}44` }}
          >
            <Glow tone={C.sage} className="-right-4 -top-6 h-20 w-20" />
            <p
              className="relative text-[28px] font-bold leading-none tracking-[-0.02em]"
              style={{ color: C.sageDeep, ...mono }}
            >
              {ratio}%
            </p>
            <p
              className="relative text-[9px] font-bold uppercase tracking-[0.16em]"
              style={{ color: C.sageDeep }}
            >
              in orde
            </p>
          </div>
        }
      />

      <Card className="p-5" tone={C.sage} soft>
        <div className="flex flex-wrap items-center gap-x-7 gap-y-3">
          {(["VERIFIED", "SUBMITTED", "EXPIRING", "REJECTED"] as CredStatus[]).map((st) => {
            const t = credTone(st);
            const count = CREDENTIALS.filter((c) => c.status === st).length;
            return (
              <span key={st} className="inline-flex items-center gap-2.5">
                <span className="text-[18px] font-bold" style={{ color: t.base, ...mono }}>
                  {count}
                </span>
                <StatusTag {...t} />
              </span>
            );
          })}
        </div>
      </Card>

      <ul className="space-y-3.5">
        {CREDENTIALS.map((c) => {
          const t = credTone(c.status);
          const isOpen = open === c.naam;
          return (
            <li key={c.naam}>
              <Card as="article" className="overflow-hidden" tone={t.base}>
                <button
                  type="button"
                  onClick={() => setOpen(isOpen ? null : c.naam)}
                  aria-expanded={isOpen}
                  className={`relative flex w-full items-center gap-3.5 px-6 py-4 text-left ${RING}`}
                >
                  <span
                    className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[14px]"
                    style={{ background: t.soft, color: t.base, border: `1px solid ${t.base}44` }}
                    aria-hidden="true"
                  >
                    <t.Icon size={18} />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span
                      className="block truncate text-[14.5px] font-bold"
                      style={{ color: C.ink }}
                    >
                      {c.naam}
                    </span>
                    <span
                      className="block truncate text-[11.5px]"
                      style={{ color: t.warm ? t.deep : C.inkMute }}
                    >
                      {c.detail}
                    </span>
                  </span>
                  <span className="hidden sm:inline-flex">
                    <StatusTag {...t} />
                  </span>
                  <ChevronRight
                    size={17}
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
                      className="px-6 pb-5 sm:pl-[80px]"
                      style={{ borderTop: `1px solid ${C.lineSoft}`, paddingTop: 14 }}
                    >
                      <span className="mb-2 inline-flex sm:hidden">
                        <StatusTag {...t} />
                      </span>
                      <p
                        className="max-w-xl text-[12.5px] leading-relaxed"
                        style={{ color: C.inkSoft }}
                      >
                        {c.detail}. Dit document ligt versleuteld in je persoonlijke kluis en wordt
                        pas ingezien nadat jíj daar toestemming voor geeft. Zo blijft het van jou.
                      </p>
                      <div className="mt-3.5 flex flex-wrap gap-2">
                        <Btn size="sm" variant="solid" tone={t.base} deep={t.deep}>
                          {c.status === "EXPIRING"
                            ? "Vernieuwen"
                            : c.status === "REJECTED"
                              ? "Opnieuw insturen"
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
      </ul>
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
        kicker="Rustig één voor één"
        title="Wat vandaag om zorg vraagt"
        sub="Klein en behapbaar. Pak op waar je zin in hebt — je hoeft niet alles tegelijk te doen."
        KIcon={Sparkles}
        tone={C.terraDeep}
      />
      <ol className="space-y-4">
        {ACTIES.map((a) => {
          const warn = a.urgentie === "warning";
          const tone = warn ? C.terra : C.amber;
          const deep = warn ? C.terraDeep : C.amberDeep;
          const goMarkt = a.cta.toLowerCase().includes("match");
          const goFacturen = a.cta.toLowerCase().includes("herinner");
          const goVerif =
            a.cta.toLowerCase().includes("vog") || a.cta.toLowerCase().includes("vernieuw");
          return (
            <li key={a.titel}>
              <Card className="flex items-start gap-4 p-6" tone={tone} glow>
                <span
                  className="relative flex h-12 w-12 shrink-0 items-center justify-center rounded-[16px]"
                  style={{ background: `${tone}22`, color: tone, border: `1px solid ${tone}44` }}
                  aria-hidden="true"
                >
                  {warn ? <Glow tone={tone} className="-inset-2" /> : null}
                  {warn ? (
                    <Hand size={20} className="relative" />
                  ) : (
                    <Sparkles size={20} className="relative" />
                  )}
                </span>
                <div className="min-w-0 flex-1">
                  <Kicker tone={deep}>{warn ? "Even attentie" : "Fijne kans"}</Kicker>
                  <h2
                    className="mt-1.5 text-[16.5px] font-bold leading-snug"
                    style={{ color: C.ink, ...serif }}
                  >
                    {a.titel}
                  </h2>
                  <p
                    className="mt-1 max-w-lg text-[13px] leading-relaxed"
                    style={{ color: C.inkSoft }}
                  >
                    {a.detail}
                  </p>
                  <div className="mt-3.5">
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

  const selected = FACTUREN.find((f) => f.nr === sel) ?? FACTUREN[0];

  return (
    <div className="space-y-6">
      <ScreenHead
        kicker="Overzichtelijk"
        title="Je geldzaken op orde"
        sub="Alles op een rustige rij. Tik op een regel om de opbouw te zien."
        KIcon={Receipt}
        right={
          <Btn variant="solid" size="sm">
            <Plus size={13} aria-hidden="true" /> Nieuwe factuur
          </Btn>
        }
      />

      <section className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {[
          {
            l: "Voldaan",
            v: totals.betaald,
            sub: "2 facturen · dankjewel",
            tone: C.sage,
            deep: C.sageDeep,
            Icon: Check,
          },
          {
            l: "Nog open",
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
            tone: C.terra,
            deep: C.terraDeep,
            Icon: FileText,
          },
        ].map((s) => (
          <Card key={s.l} className="p-5" tone={s.tone} glow soft>
            <div className="flex items-center justify-between">
              <p
                className="text-[9.5px] font-bold uppercase tracking-[0.14em]"
                style={{ color: s.deep }}
              >
                {s.l}
              </p>
              <s.Icon size={15} aria-hidden="true" style={{ color: s.tone }} />
            </div>
            <p
              className="mt-2 text-[23px] font-bold leading-none"
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

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1.5fr_1fr]">
        <Card className="overflow-hidden" tone={C.amber}>
          <div
            className="flex items-center justify-between px-6 py-4"
            style={{ borderBottom: `1px solid ${C.lineSoft}` }}
          >
            <Kicker tone={C.amberDeep}>
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
              <caption className="sr-only">Overzicht van je facturen</caption>
              <thead>
                <tr style={{ borderBottom: `1px solid ${C.lineSoft}` }}>
                  {["Nummer", "Klant", "Datum", "Bedrag", "Status"].map((h, i) => (
                    <th
                      key={h}
                      scope="col"
                      className={`px-4 py-3 text-[9px] font-bold uppercase tracking-[0.12em] ${i === 3 ? "text-right" : ""}`}
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
                      className={`tl-row cursor-pointer ${RING}`}
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
                        background: on ? C.amberSoft : undefined,
                      }}
                    >
                      <td
                        className="px-4 py-3.5 text-[12px] font-bold"
                        style={{ color: on ? C.amberDeep : C.inkSoft, ...mono }}
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
                        className="px-4 py-3.5 text-right text-[13px] font-bold"
                        style={{ color: C.ink, ...mono }}
                      >
                        {f.bedrag}
                      </td>
                      <td className="px-4 py-3.5">
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
    <Card as="article" className="overflow-hidden" tone={t.base} glow>
      <div className="p-6" style={{ borderBottom: `1px solid ${C.lineSoft}` }}>
        <p className="text-[9.5px] font-bold uppercase tracking-[0.18em]" style={{ color: t.deep }}>
          Opbouw factuur
        </p>
        <p className="text-[18px] font-bold" style={{ color: C.ink, ...mono }}>
          {factuur.nr}
        </p>
      </div>
      <div className="space-y-3 p-6 text-[12.5px]">
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
          <span className="text-[21px] font-bold" style={{ color: t.deep, ...mono }}>
            {factuur.bedrag}
          </span>
        </div>
        <div className="mt-4 flex gap-2">
          <Btn variant="solid" size="sm" full tone={t.base} deep={t.deep}>
            {factuur.status === "Concept"
              ? "Versturen"
              : factuur.status === "Openstaand"
                ? "Vriendelijke herinnering"
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
