"use client";

// Concept 524 — "Waterlinie" · Nederlandse polder-/waterlinie-cartografie. Het platform als
// topografische kaart: inundatie- en hoogtelijnen (contour), gelaagde kaartvlakken, technische
// annotaties met dunne leaderlijnen, een meetschaal en een sobere, technische toon zoals een
// stafkaart. Data wordt gepresenteerd als kaartlagen; status krijgt altijd label + icoon.

import { useMemo, useState, type CSSProperties, type ReactNode } from "react";
import {
  Anchor,
  ArrowLeft,
  ArrowRight,
  Check,
  ChevronRight,
  Clock,
  Compass,
  Droplets,
  FileText,
  Layers,
  ListChecks,
  MapPin,
  Mountain,
  Plus,
  Receipt,
  Ruler,
  Search,
  ShieldCheck,
  Store,
  TriangleAlert,
  Waves,
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
  type ScreenKey,
  type CredStatus,
  type Opdracht,
} from "./mock";

// ————————————————————————————— Palet — stafkaart op licht papier —————————————————————————————
const C = {
  bg: "#f3f1e9",
  paper: "#efece2",
  panel: "#f8f6ef",
  sink: "#eae6da",
  line: "#d7d0bf",
  lineSoft: "#e3ddce",
  ink: "#17202a",
  inkSoft: "#3b4550",
  inkMute: "#6b7078",
  inkFaint: "#9aa0a0",
  water: "#1f6f8b",
  waterSoft: "#dbe8ec",
  waterDeep: "#154e61",
  land: "#6f8a4f",
  landSoft: "#e4ecd6",
  dijk: "#b8863f",
  dijkSoft: "#f0e5cf",
  alarm: "#b0442d",
  alarmSoft: "#f0ddd5",
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
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1f6f8b] focus-visible:ring-offset-2 focus-visible:ring-offset-[#f3f1e9]";

// ————————————————————————————— Status-taal (label + icoon) —————————————————————————————
type Tone = { base: string; soft: string; label: string; Icon: LucideIcon; alarm: boolean };

function credTone(s: CredStatus): Tone {
  switch (s) {
    case "VERIFIED":
      return {
        base: C.land,
        soft: C.landSoft,
        label: "Vastgesteld",
        Icon: ShieldCheck,
        alarm: false,
      };
    case "SUBMITTED":
      return {
        base: C.water,
        soft: C.waterSoft,
        label: "In kartering",
        Icon: Compass,
        alarm: false,
      };
    case "EXPIRING":
      return {
        base: C.dijk,
        soft: C.dijkSoft,
        label: "Dijkbewaking",
        Icon: TriangleAlert,
        alarm: true,
      };
    case "REJECTED":
      return { base: C.alarm, soft: C.alarmSoft, label: "Afgekeurd", Icon: X, alarm: true };
  }
}

function factuurTone(status: string): {
  base: string;
  soft: string;
  label: string;
  Icon: LucideIcon;
} {
  if (status === "Betaald")
    return { base: C.land, soft: C.landSoft, label: "Vereffend", Icon: Check };
  if (status === "Openstaand")
    return { base: C.dijk, soft: C.dijkSoft, label: "Openstaand", Icon: Clock };
  return { base: C.water, soft: C.waterSoft, label: "Concept", Icon: FileText };
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

// ————————————————————————————— Cartografische decoratie —————————————————————————————
function ContourField({
  lines = 9,
  tone = C.water,
  opacity = 0.16,
}: {
  lines?: number;
  tone?: string;
  opacity?: number;
}) {
  return (
    <svg
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 h-full w-full"
      viewBox="0 0 120 100"
      preserveAspectRatio="none"
    >
      {Array.from({ length: lines }).map((_, i) => {
        const y = 6 + i * (92 / lines);
        const a = i % 2 === 0 ? -3.5 : 3.5;
        return (
          <path
            key={i}
            d={`M-4 ${y} C 20 ${y + a}, 40 ${y - a}, 62 ${y} S 100 ${y + a}, 124 ${y - a}`}
            fill="none"
            stroke={tone}
            strokeWidth={i % 3 === 0 ? 0.55 : 0.3}
            opacity={opacity}
            vectorEffect="non-scaling-stroke"
          />
        );
      })}
    </svg>
  );
}

function Scale({ tone = C.inkMute }: { tone?: string }) {
  return (
    <span className="inline-flex items-end gap-1" aria-hidden="true">
      {[10, 6, 10, 6, 10].map((h, i) => (
        <span key={i} className="w-[1.5px]" style={{ height: h, background: tone, opacity: 0.7 }} />
      ))}
    </span>
  );
}

// ————————————————————————————— Primitives —————————————————————————————
function Sheet({
  children,
  className = "",
  as: Tag = "div",
  tone,
  contour = false,
}: {
  children: ReactNode;
  className?: string;
  as?: "div" | "section" | "article" | "aside" | "li";
  tone?: string;
  contour?: boolean;
}) {
  return (
    <Tag
      className={`relative overflow-hidden rounded-[10px] ${className}`}
      style={{
        background: C.panel,
        border: `1px solid ${tone ? `${tone}55` : C.line}`,
        boxShadow: "0 1px 0 rgba(255,255,255,0.6) inset, 0 10px 26px -22px rgba(21,78,97,0.55)",
      }}
    >
      {contour && <ContourField tone={tone ?? C.water} opacity={0.08} />}
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
  tone = C.water,
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
  const base = `inline-flex items-center justify-center gap-2 rounded-[7px] font-semibold tracking-[-0.01em] transition-all duration-150 active:translate-y-px ${RING} ${full ? "w-full" : ""}`;
  const style: CSSProperties =
    variant === "solid"
      ? { background: tone, color: "#f8f6ef", border: `1px solid ${C.waterDeep}`, ...sans }
      : variant === "outline"
        ? { background: C.panel, color: tone, border: `1px solid ${tone}66`, ...sans }
        : { background: "transparent", color: C.inkSoft, border: "1px solid transparent", ...sans };
  const hover = variant === "solid" ? "hover:brightness-108" : "hover:bg-[#eae6da]";
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
      className="inline-flex items-center gap-1.5 rounded-[5px] px-2 py-0.5 text-[11px] font-semibold"
      style={{ color: base, background: soft, border: `1px solid ${base}55`, ...sans }}
    >
      <Icon size={12} aria-hidden="true" />
      {label}
      {alarm && <span className="sr-only"> (aandacht vereist)</span>}
    </span>
  );
}

// Match als hoogtelijn-diepteschaal
function DepthGauge({ value, tone }: { value: number; tone: string }) {
  const rings = 4;
  const filled = Math.round((value / 100) * rings);
  return (
    <span
      className="relative inline-flex h-14 w-14 items-center justify-center"
      aria-label={`Match ${value} procent`}
    >
      {Array.from({ length: rings }).map((_, i) => {
        const size = 54 - i * 11;
        const on = i < filled;
        return (
          <span
            key={i}
            className="absolute rounded-full"
            style={{
              width: size,
              height: size,
              border: `1.5px solid ${on ? tone : C.line}`,
              opacity: on ? 1 - i * 0.12 : 0.5,
            }}
            aria-hidden="true"
          />
        );
      })}
      <span className="relative text-[12px] font-bold" style={{ color: tone, ...mono }}>
        {value}
      </span>
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

function Annot({ label, value, tone = C.water }: { label: string; value: string; tone?: string }) {
  return (
    <span className="inline-flex items-center gap-2">
      <span className="h-px w-6" style={{ background: tone, opacity: 0.5 }} aria-hidden="true" />
      <span
        className="text-[10px] font-bold uppercase tracking-[0.14em]"
        style={{ color: C.inkFaint }}
      >
        {label}
      </span>
      <span className="text-[12px] font-bold" style={{ color: tone, ...mono }}>
        {value}
      </span>
    </span>
  );
}

function ScreenHead({
  code,
  title,
  sub,
  right,
  tone = C.water,
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
          <Compass size={12} aria-hidden="true" />
          Blad · {code}
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

const NAV: Record<ScreenKey, { Icon: LucideIcon; peil: string }> = {
  dashboard: { Icon: Layers, peil: "±0,00 NAP" },
  marktplaats: { Icon: Store, peil: "−1,20 m" },
  opdracht: { Icon: MapPin, peil: "−2,40 m" },
  verificatie: { Icon: ShieldCheck, peil: "+0,80 m" },
  acties: { Icon: ListChecks, peil: "−0,60 m" },
  facturen: { Icon: Receipt, peil: "+1,40 m" },
  documenten: { Icon: FileText, peil: "−0,30 m" },
  berichten: { Icon: FileText, peil: "−0,90 m" },
};

// —————————————————————————————————————— Root ——————————————————————————————————————
export function Concept524() {
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
          <main key={screen} className="wl-fade px-4 pb-20 pt-6 sm:px-6 md:px-8">
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
        @keyframes wlFade { from { opacity: 0; transform: translateY(6px); } to { opacity: 1; transform: none; } }
        .wl-fade { animation: wlFade 0.32s cubic-bezier(0.22,1,0.36,1) both; }
        .wl-row { transition: background 0.16s ease; }
        .wl-row:hover { background: ${C.sink}; }
        @media (prefers-reduced-motion: reduce) { .wl-fade { animation: none !important; } .wl-row { transition: none !important; } }
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
      className="sticky top-0 hidden h-screen w-[236px] shrink-0 flex-col md:flex"
      style={{ background: C.paper, borderRight: `1px solid ${C.line}` }}
    >
      <div
        className="flex items-center gap-2.5 px-5 py-5"
        style={{ borderBottom: `1px solid ${C.line}` }}
      >
        <span
          className="flex h-9 w-9 items-center justify-center rounded-[8px]"
          style={{ background: C.water, color: C.panel, border: `1px solid ${C.waterDeep}` }}
          aria-hidden="true"
        >
          <Waves size={17} />
        </span>
        <span>
          <span className="block text-[14px] font-bold tracking-[-0.01em]" style={{ color: C.ink }}>
            Waterlinie
          </span>
          <span
            className="mt-0.5 block text-[9px] font-bold uppercase tracking-[0.2em]"
            style={{ color: C.water }}
          >
            stafkaart · schaal 1:25k
          </span>
        </span>
      </div>

      <nav aria-label="Kaartbladen" className="flex-1 overflow-y-auto px-3 py-4">
        <p
          className="px-2 pb-2 text-[9px] font-bold uppercase tracking-[0.2em]"
          style={{ color: C.inkFaint }}
        >
          Bladindeling
        </p>
        <ul className="space-y-0.5">
          {SCREENS.map((s) => {
            const on = s.key === screen;
            const { Icon, peil } = NAV[s.key];
            return (
              <li key={s.key}>
                <button
                  type="button"
                  onClick={() => setScreen(s.key)}
                  aria-current={on ? "page" : undefined}
                  className={`group flex w-full items-center gap-2.5 rounded-[7px] px-2.5 py-2 text-left text-[13px] font-semibold transition-colors ${RING}`}
                  style={
                    on ? { background: C.waterSoft, color: C.waterDeep } : { color: C.inkSoft }
                  }
                >
                  <span
                    className="flex h-7 w-7 items-center justify-center rounded-[6px]"
                    style={{
                      background: on ? C.water : C.sink,
                      color: on ? C.panel : C.inkMute,
                      border: `1px solid ${on ? C.waterDeep : C.line}`,
                    }}
                    aria-hidden="true"
                  >
                    <Icon size={14} />
                  </span>
                  <span className="flex-1">{s.label}</span>
                  <span className="text-[9px] font-bold" style={{ color: C.inkFaint, ...mono }}>
                    {peil}
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      </nav>

      <div className="px-4 py-4" style={{ borderTop: `1px solid ${C.line}` }}>
        <div
          className="relative mb-3 overflow-hidden rounded-[8px] p-3"
          style={{ background: C.landSoft, border: `1px solid ${C.land}44` }}
        >
          <ContourField tone={C.land} opacity={0.1} />
          <p
            className="relative text-[9px] font-bold uppercase tracking-[0.16em]"
            style={{ color: C.land }}
          >
            Ingemeten dossier
          </p>
          <p
            className="relative mt-1 text-[19px] font-bold leading-none"
            style={{ color: C.ink, ...mono }}
          >
            {ratio}%
          </p>
          <p className="relative mt-1 text-[10px]" style={{ color: C.inkMute }}>
            {verified}/{CREDENTIALS.length} lagen vastgesteld
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span
            className="flex h-8 w-8 items-center justify-center rounded-[7px] text-[11px] font-bold"
            style={{ background: C.water, color: C.panel, ...mono }}
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
              style={{ color: C.land }}
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
        className="flex flex-1 items-center gap-2 rounded-[7px] px-3 py-2"
        style={{ background: C.panel, border: `1px solid ${C.line}` }}
      >
        <Search size={14} aria-hidden="true" style={{ color: C.inkFaint }} />
        <span className="text-[12.5px]" style={{ color: C.inkFaint }}>
          Zoek in kaartbladen, certificaten, facturen…
        </span>
        <span
          className="ml-auto hidden rounded-[4px] px-1.5 py-0.5 text-[10px] font-bold sm:inline"
          style={{ background: C.sink, color: C.inkMute, ...mono }}
        >
          ⌘K
        </span>
      </div>
      <span
        className="hidden items-center gap-2 rounded-[7px] px-3 py-2 text-[12px] font-semibold sm:inline-flex"
        style={{ background: C.dijkSoft, color: C.dijk, border: `1px solid ${C.dijk}44` }}
      >
        <Droplets size={13} aria-hidden="true" />
        <span style={{ ...mono }}>{eur0.format(open)}</span> openstaand
      </span>
      <span
        className="hidden items-center gap-1.5 rounded-[7px] px-2.5 py-2 text-[10px] font-bold uppercase tracking-[0.14em] lg:inline-flex"
        style={{ background: C.panel, color: C.inkMute, border: `1px solid ${C.line}` }}
      >
        <Ruler size={12} aria-hidden="true" /> Peil {NAV[screen].peil}
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
      aria-label="Kaartbladen"
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
            className={`shrink-0 rounded-[6px] px-3 py-1.5 text-[12.5px] font-semibold transition-colors ${RING}`}
            style={
              on
                ? { background: C.water, color: C.panel }
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
  return (
    <div className="space-y-7">
      <ScreenHead
        code="A-1 · Overzicht"
        title={`Kaartoverzicht — ${PROFIEL.naam.split(" ")[0]}`}
        sub="Het volledige werkgebied in één blad. Drie punten liggen onder peil en vragen om droeglegging."
        right={
          <div className="flex gap-2">
            <Btn variant="outline" size="sm" tone={C.land} onClick={onVerif}>
              <ShieldCheck size={13} aria-hidden="true" /> Dossier
            </Btn>
            <Btn variant="solid" size="sm" onClick={onActies}>
              Volgende peiling <ArrowRight size={13} aria-hidden="true" />
            </Btn>
          </div>
        }
      />

      <section className="grid grid-cols-2 gap-3.5 xl:grid-cols-4">
        {KPIS.map((k) => (
          <Sheet key={k.label} className="p-4" contour>
            <div className="flex items-center justify-between">
              <p className="text-[11px] font-semibold" style={{ color: C.inkMute }}>
                {k.label}
              </p>
              <Scale tone={C.water} />
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
                  color: k.up ? C.land : C.dijk,
                  background: k.up ? C.landSoft : C.dijkSoft,
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
                      className="w-[3px]"
                      style={{ height: h, background: last ? C.water : `${C.water}44` }}
                    />
                  );
                })}
              </span>
            </div>
          </Sheet>
        ))}
      </section>

      <section className="grid grid-cols-1 gap-5 lg:grid-cols-[1.55fr_1fr]">
        <Sheet className="overflow-hidden" tone={C.water}>
          <div
            className="flex items-center justify-between px-5 py-3"
            style={{ borderBottom: `1px solid ${C.line}` }}
          >
            <Kicker tone={C.water}>
              <Store size={13} aria-hidden="true" /> Ingemeten opdrachten
            </Kicker>
            <button
              type="button"
              onClick={onMarkt}
              className={`rounded-[5px] px-1 text-[11.5px] font-semibold ${RING}`}
              style={{ color: C.water }}
            >
              Volledig blad →
            </button>
          </div>
          <ul>
            {OPDRACHTEN.map((o, i) => {
              const tone = o.match >= 90 ? C.land : C.water;
              return (
                <li key={o.id}>
                  <button
                    type="button"
                    onClick={onOpen}
                    className={`wl-row flex w-full items-center gap-3.5 px-5 py-4 text-left ${RING}`}
                    style={{ borderTop: i === 0 ? "none" : `1px solid ${C.lineSoft}` }}
                  >
                    <DepthGauge value={o.match} tone={tone} />
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
        </Sheet>

        <div className="space-y-5">
          <Sheet className="p-5" tone={C.land} contour>
            <Kicker tone={C.land}>
              <Mountain size={13} aria-hidden="true" /> Hoogtepeil dossier
            </Kicker>
            <div className="mt-2 flex items-baseline gap-2">
              <span
                className="text-[36px] font-bold leading-none tracking-[-0.03em]"
                style={{ color: C.land, ...mono }}
              >
                {ratio}%
              </span>
              <span className="text-[12px]" style={{ color: C.inkMute }}>
                boven inundatiepeil
              </span>
            </div>
            <div className="mt-3 flex gap-1.5" aria-hidden="true">
              {CREDENTIALS.map((c) => {
                const t = credTone(c.status);
                return (
                  <span
                    key={c.naam}
                    className="h-2 flex-1 rounded-[2px]"
                    style={{ background: c.status === "VERIFIED" ? C.land : `${t.base}66` }}
                  />
                );
              })}
            </div>
            <p className="mt-2.5 text-[11.5px]" style={{ color: C.inkMute }}>
              {verified} van {CREDENTIALS.length} lagen vastgesteld · {PROFIEL.trust}.
            </p>
          </Sheet>

          <Sheet className="p-5" tone={C.dijk} as="article">
            <Kicker tone={C.dijk}>
              <TriangleAlert size={13} aria-hidden="true" /> Dijkbewaking
            </Kicker>
            <h3 className="mt-2 text-[15px] font-bold leading-snug" style={{ color: C.ink }}>
              {primair.titel}
            </h3>
            <p className="mt-1.5 text-[12.5px] leading-relaxed" style={{ color: C.inkSoft }}>
              {primair.detail}
            </p>
            <Btn variant="solid" size="sm" full tone={C.dijk} className="mt-4" onClick={onActies}>
              {primair.cta} <ArrowRight size={13} aria-hidden="true" />
            </Btn>
          </Sheet>
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
        code="B-2 · Marktplaats"
        title="Ingemeten werkgebied"
        sub={`${rows.length} van ${OPDRACHTEN.length} percelen sluiten aan op je vastgestelde profiel.`}
      />

      <Sheet className="flex flex-col gap-2.5 p-3 sm:flex-row sm:items-center" tone={C.water}>
        <div
          className="flex flex-1 items-center gap-2 rounded-[6px] px-3 py-2"
          style={{ background: C.sink, border: `1px solid ${C.line}` }}
        >
          <Search size={15} aria-hidden="true" style={{ color: C.inkFaint }} />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Filter op titel, plaats of opdrachtgever…"
            aria-label="Percelen filteren"
            className="w-full bg-transparent text-[13px] outline-none placeholder:text-[#9aa0a0]"
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
              {s === "match" ? "Peil" : "Tarief"}
            </Btn>
          ))}
        </div>
      </Sheet>

      {mode === "loading" ? (
        <ul className="space-y-4" aria-hidden="true">
          {[0, 1, 2].map((i) => (
            <li key={i}>
              <Sheet className="space-y-3 p-5">
                <div
                  className="h-4 w-2/3 animate-pulse rounded-[3px] motion-reduce:animate-none"
                  style={{ background: C.lineSoft }}
                />
                <div
                  className="h-3 w-1/2 animate-pulse rounded-[3px] motion-reduce:animate-none"
                  style={{ background: C.lineSoft }}
                />
              </Sheet>
            </li>
          ))}
        </ul>
      ) : mode === "error" ? (
        <StateBlock
          Icon={TriangleAlert}
          tone={C.alarm}
          titel="Kartering onderbroken"
          tekst="De percelen konden zojuist niet worden ingemeten. Herstel de meetlijn en probeer opnieuw."
          cta="Opnieuw inmeten"
          onCta={() => setMode("ok")}
        />
      ) : rows.length === 0 ? (
        <StateBlock
          Icon={Search}
          tone={C.water}
          titel="Geen perceel binnen bereik"
          tekst={`Niets voor ${q ? `“${q}”` : "je filter"}. Verruim het meetgebied en probeer opnieuw.`}
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
    <Sheet className="flex flex-col items-center px-6 py-16 text-center" tone={tone} contour>
      <span
        className="flex h-16 w-16 items-center justify-center rounded-[12px]"
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
        <Compass size={13} aria-hidden="true" /> {cta}
      </Btn>
    </Sheet>
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
  const tone = strong ? C.land : C.water;
  return (
    <Sheet as="article" className="overflow-hidden" tone={tone}>
      <div className="flex items-start gap-4 p-5">
        <span className="shrink-0 pt-0.5 text-center">
          <DepthGauge value={opdracht.match} tone={tone} />
          <span
            className="mt-2 block rounded-[4px] px-2 py-0.5 text-[9.5px] font-bold uppercase tracking-[0.06em]"
            style={{ color: tone, background: `${tone}1f`, border: `1px solid ${tone}55` }}
          >
            {strong ? "vast land" : "polder"}
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
                style={{ background: C.sink, color: C.inkSoft, border: `1px solid ${C.line}` }}
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
          {open ? <X size={13} aria-hidden="true" /> : <Layers size={13} aria-hidden="true" />}
          Kaartlagen
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
              titel="Hoger gelegen"
              tone={C.land}
              Icon={Check}
              items={opdracht.redenen.plus}
            />
            <RedenKolom
              titel="Onder peil"
              tone={C.dijk}
              Icon={TriangleAlert}
              items={opdracht.redenen.min}
            />
          </div>
        </div>
      </div>
    </Sheet>
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
            className="flex items-start gap-2.5 text-[13px] leading-snug"
            style={{ color: C.inkSoft }}
          >
            <span
              className="mt-2 h-px w-4 shrink-0"
              style={{ background: tone, opacity: 0.6 }}
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
  const tone = strong ? C.land : C.water;
  const feiten = [
    { l: "Tarief", v: opdracht.tarief.replace(" / uur", ""), s: "per uur" },
    { l: "Omvang", v: opdracht.uren, s: "per week" },
    { l: "Aanvang", v: opdracht.start, s: "startdatum" },
    { l: "Match", v: `${opdracht.match}%`, s: "op profiel" },
  ];
  return (
    <div className="space-y-6">
      <Btn variant="ghost" size="sm" onClick={onBack}>
        <ArrowLeft size={13} aria-hidden="true" /> Terug naar het blad
      </Btn>

      <Sheet className="overflow-hidden" tone={tone} contour>
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
              {strong ? "vast land" : "polder"} · match {opdracht.match}%
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
          <div className="mt-3 flex flex-wrap items-center gap-4">
            <Annot label="Blad" value={opdracht.id} tone={tone} />
            <Annot label="Peil" value={`${opdracht.match}%`} tone={tone} />
          </div>
          <div className="mt-4 flex flex-wrap gap-1.5">
            {opdracht.tags.map((t) => (
              <span
                key={t}
                className="rounded-[4px] px-2 py-0.5 text-[11px] font-semibold"
                style={{ background: C.panel, color: C.inkSoft, border: `1px solid ${C.line}` }}
              >
                {t}
              </span>
            ))}
          </div>
          <div className="mt-5 flex flex-wrap gap-2">
            <Btn variant="solid" tone={tone}>
              Reageren op perceel <ArrowRight size={14} aria-hidden="true" />
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
      </Sheet>

      <Sheet className="p-6" tone={C.water}>
        <Kicker tone={C.water}>
          <ListChecks size={13} aria-hidden="true" /> Navolgbaar — geen verborgen score
        </Kicker>
        <p className="mt-2 max-w-xl text-[13.5px] leading-relaxed" style={{ color: C.inkSoft }}>
          Afgezet tegen je vastgestelde profiel. Wat hoger gelegen is spreekt in je voordeel; wat
          onder peil ligt is goed om vooraf te weten.
        </p>
        <div className="mt-5 grid grid-cols-1 gap-6 md:grid-cols-2">
          <RedenDetail
            titel="Hoger gelegen"
            tone={C.land}
            Icon={Check}
            items={opdracht.redenen.plus}
          />
          <RedenDetail
            titel="Onder peil"
            tone={C.dijk}
            Icon={TriangleAlert}
            items={opdracht.redenen.min}
          />
        </div>
      </Sheet>
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
        code="C-3 · Verificatie"
        tone={C.land}
        title="Hoogtemeting dossier"
        sub={`${verified} van ${CREDENTIALS.length} lagen vastgesteld · ${PROFIEL.trust}.`}
        right={
          <div
            className="relative overflow-hidden rounded-[8px] px-4 py-2 text-right"
            style={{ background: C.landSoft, border: `1px solid ${C.land}44` }}
          >
            <ContourField tone={C.land} opacity={0.12} />
            <p
              className="relative text-[27px] font-bold leading-none tracking-[-0.02em]"
              style={{ color: C.land, ...mono }}
            >
              {ratio}%
            </p>
            <p
              className="relative text-[9px] font-bold uppercase tracking-[0.16em]"
              style={{ color: C.land }}
            >
              boven peil
            </p>
          </div>
        }
      />

      <Sheet className="p-4">
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
      </Sheet>

      <ul className="space-y-3">
        {CREDENTIALS.map((c) => {
          const t = credTone(c.status);
          const isOpen = open === c.naam;
          return (
            <li key={c.naam}>
              <Sheet as="article" className="overflow-hidden" tone={t.base}>
                <button
                  type="button"
                  onClick={() => setOpen(isOpen ? null : c.naam)}
                  aria-expanded={isOpen}
                  className={`relative flex w-full items-center gap-3 px-5 py-4 text-left ${RING}`}
                >
                  <span
                    className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[8px]"
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
                      className="px-5 pb-4 sm:pl-[72px]"
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
                          Meetstaat
                        </Btn>
                      </div>
                    </div>
                  </div>
                </div>
              </Sheet>
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
        code="D-4 · Acties"
        tone={C.dijk}
        title="Peilstaat — wat vraagt onderhoud"
        sub="Op volgorde van waterstand. Werk de dijk bij voordat het peil kritiek wordt."
      />
      <ol className="space-y-4">
        {ACTIES.map((a, i) => {
          const warn = a.urgentie === "warning";
          const tone = warn ? C.dijk : C.water;
          const goMarkt = a.cta.toLowerCase().includes("match");
          const goFacturen = a.cta.toLowerCase().includes("herinner");
          return (
            <li key={a.titel}>
              <Sheet className="flex items-start gap-4 p-5" tone={tone}>
                <span
                  className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[8px] text-[15px] font-bold"
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
                  <Kicker tone={tone}>
                    {warn ? (
                      <TriangleAlert size={13} aria-hidden="true" />
                    ) : (
                      <Anchor size={13} aria-hidden="true" />
                    )}
                    {warn ? "Kritiek peil" : "Aanbevolen"}
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
              </Sheet>
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
        code="E-5 · Facturen"
        title="Waterstaat — facturatie"
        sub="Klik een regel om de opbouw van het peil te openen."
        right={
          <Btn variant="solid" size="sm">
            <Plus size={13} aria-hidden="true" /> Nieuwe factuur
          </Btn>
        }
      />

      <section className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {[
          { l: "Vereffend", v: totals.betaald, sub: "2 facturen", tone: C.land, Icon: Check },
          {
            l: "Openstaand",
            v: totals.open,
            sub: "1 factuur · 9 dagen",
            tone: C.dijk,
            Icon: Clock,
          },
          {
            l: "Concept",
            v: totals.concept,
            sub: "klaar om te versturen",
            tone: C.water,
            Icon: FileText,
          },
        ].map((s) => (
          <Sheet key={s.l} className="p-4" tone={s.tone} contour>
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
          </Sheet>
        ))}
      </section>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-[1.5fr_1fr]">
        <Sheet className="overflow-hidden" tone={C.water}>
          <div
            className="flex items-center justify-between px-5 py-3"
            style={{ borderBottom: `1px solid ${C.line}` }}
          >
            <Kicker tone={C.water}>
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
                      className={`wl-row cursor-pointer ${RING}`}
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
                        background: on ? C.waterSoft : undefined,
                      }}
                    >
                      <td
                        className="px-4 py-3 text-[12px] font-bold"
                        style={{ color: on ? C.waterDeep : C.inkSoft, ...mono }}
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
        </Sheet>

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
    <Sheet as="article" className="overflow-hidden" tone={t.base} contour>
      <div className="p-5" style={{ borderBottom: `1px solid ${C.line}` }}>
        <p className="text-[9.5px] font-bold uppercase tracking-[0.18em]" style={{ color: t.base }}>
          Meetstaat factuur
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
    </Sheet>
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
