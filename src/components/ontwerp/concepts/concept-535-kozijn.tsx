"use client";

// Concept 535 — "Kozijn" · Refined tactile brutalism. Strakke 1px hairline-kaders overal, een
// zichtbaar raster als voorgrond-element, harde geometrie en engineered precisie. Tabulaire
// mono-cijfers, monochroom papier met één krachtig accent. Wireframe-logica in de eind-UI —
// coördinaat-labels, crop-marks en meetstreepjes — maar verfijnd en leesbaar, geen ruwe kitsch.

import { useMemo, useState, type CSSProperties, type ReactNode } from "react";
import {
  ArrowLeft,
  ArrowRight,
  BadgeCheck,
  Check,
  ChevronRight,
  Clock,
  FileText,
  Grid2x2,
  Hash,
  LayoutGrid,
  ListChecks,
  Plus,
  Receipt,
  Search,
  ShieldCheck,
  Square,
  Store,
  TriangleAlert,
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

// ————————————————————————————— Palet — papier + hard zwart + één krachtig accent —————————————————————————————
const C = {
  bg: "#f4f3ee",
  surface: "#ffffff",
  sink: "#eae8e0",
  sinkDeep: "#e2dfd5",
  ink: "#111110",
  inkSoft: "#3a3934",
  inkMute: "#6d6b62",
  inkFaint: "#9b998e",
  line: "#111110",
  lineSoft: "#d6d3c8",
  grid: "#e1ded3",
  accent: "#e5361f",
  accentSoft: "#fbe3de",
  accentDeep: "#b1220f",
  ok: "#1f7a3d",
  okSoft: "#e2efe6",
  warn: "#8a5906",
  warnSoft: "#f3e8cf",
  danger: "#b32414",
  dangerSoft: "#f6dfda",
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
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#e5361f] focus-visible:ring-offset-2 focus-visible:ring-offset-[#f4f3ee]";

// ————————————————————————————— Status-taal (label + icoon) —————————————————————————————
type Tone = { base: string; soft: string; label: string; Icon: LucideIcon; alarm: boolean };

function credTone(s: CredStatus): Tone {
  switch (s) {
    case "VERIFIED":
      return { base: C.ok, soft: C.okSoft, label: "GEVERIFIEERD", Icon: BadgeCheck, alarm: false };
    case "SUBMITTED":
      return { base: C.ink, soft: C.sink, label: "IN BEHANDELING", Icon: Clock, alarm: false };
    case "EXPIRING":
      return {
        base: C.warn,
        soft: C.warnSoft,
        label: "VERLOOPT",
        Icon: TriangleAlert,
        alarm: true,
      };
    case "REJECTED":
      return { base: C.danger, soft: C.dangerSoft, label: "AFGEWEZEN", Icon: X, alarm: true };
  }
}

function factuurTone(status: string): {
  base: string;
  soft: string;
  label: string;
  Icon: LucideIcon;
} {
  if (status === "Betaald") return { base: C.ok, soft: C.okSoft, label: "BETAALD", Icon: Check };
  if (status === "Openstaand")
    return { base: C.warn, soft: C.warnSoft, label: "OPENSTAAND", Icon: Clock };
  return { base: C.ink, soft: C.sink, label: "CONCEPT", Icon: FileText };
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

const NAV: Record<ScreenKey, { Icon: LucideIcon; coord: string }> = {
  dashboard: { Icon: LayoutGrid, coord: "A·00" },
  marktplaats: { Icon: Store, coord: "B·01" },
  opdracht: { Icon: Hash, coord: "B·02" },
  verificatie: { Icon: ShieldCheck, coord: "C·03" },
  acties: { Icon: ListChecks, coord: "D·04" },
  facturen: { Icon: Receipt, coord: "E·05" },
  documenten: { Icon: FileText, coord: "C·06" },
  berichten: { Icon: FileText, coord: "D·07" },
};

// ————————————————————————————— Raster & crop-marks (voorgrond-decor) —————————————————————————————
function GridField({ opacity = 1 }: { opacity?: number }) {
  return (
    <svg
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 h-full w-full"
      style={{ opacity }}
    >
      <defs>
        <pattern id="kz-grid" width="22" height="22" patternUnits="userSpaceOnUse">
          <path d="M22 0H0V22" fill="none" stroke={C.grid} strokeWidth="1" />
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill="url(#kz-grid)" />
    </svg>
  );
}

// Crop-marks in de vier hoeken — het "kozijn"-motief.
function Corners({ tone = C.line }: { tone?: string }) {
  const common = "absolute h-2.5 w-2.5";
  return (
    <span aria-hidden="true">
      <span
        className={`${common} left-[-1px] top-[-1px]`}
        style={{ borderTop: `2px solid ${tone}`, borderLeft: `2px solid ${tone}` }}
      />
      <span
        className={`${common} right-[-1px] top-[-1px]`}
        style={{ borderTop: `2px solid ${tone}`, borderRight: `2px solid ${tone}` }}
      />
      <span
        className={`${common} bottom-[-1px] left-[-1px]`}
        style={{ borderBottom: `2px solid ${tone}`, borderLeft: `2px solid ${tone}` }}
      />
      <span
        className={`${common} bottom-[-1px] right-[-1px]`}
        style={{ borderBottom: `2px solid ${tone}`, borderRight: `2px solid ${tone}` }}
      />
    </span>
  );
}

function Ruler({ n = 7 }: { n?: number }) {
  return (
    <span className="inline-flex items-end gap-[3px]" aria-hidden="true">
      {Array.from({ length: n }).map((_, i) => (
        <span
          key={i}
          className="w-px"
          style={{ height: i % 2 === 0 ? 9 : 5, background: C.inkFaint }}
        />
      ))}
    </span>
  );
}

// ————————————————————————————— Primitives —————————————————————————————
function Frame({
  children,
  className = "",
  as: Tag = "div",
  grid = false,
  corners = false,
  tone = C.line,
}: {
  children: ReactNode;
  className?: string;
  as?: "div" | "section" | "article" | "aside" | "li";
  grid?: boolean;
  corners?: boolean;
  tone?: string;
}) {
  return (
    <Tag
      className={`relative ${className}`}
      style={{ background: C.surface, border: `1px solid ${tone}` }}
    >
      {grid && <GridField />}
      {corners && <Corners tone={tone} />}
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
  tone = C.accent,
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
  const pad = size === "sm" ? "px-3 py-1.5 text-[11.5px]" : "px-4 py-2.5 text-[12.5px]";
  const base = `inline-flex items-center justify-center gap-2 font-semibold uppercase tracking-[0.04em] transition-all duration-100 active:translate-y-px ${RING} ${full ? "w-full" : ""}`;
  const style: CSSProperties =
    variant === "solid"
      ? { background: tone, color: "#fff", border: `1px solid ${C.line}`, ...sans }
      : variant === "outline"
        ? { background: C.surface, color: C.ink, border: `1px solid ${C.line}`, ...sans }
        : { background: "transparent", color: C.inkSoft, border: "1px solid transparent", ...sans };
  const hover =
    variant === "solid"
      ? "hover:brightness-110"
      : variant === "outline"
        ? "hover:bg-[#eae8e0]"
        : "hover:bg-[#eae8e0]";
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
      className="inline-flex items-center gap-1.5 px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.08em]"
      style={{ color: base, background: soft, border: `1px solid ${base}`, ...sans }}
    >
      <Icon size={11} aria-hidden="true" />
      {label}
      {alarm && <span className="sr-only"> (aandacht vereist)</span>}
    </span>
  );
}

function Label({ children, tone = C.inkMute }: { children: ReactNode; tone?: string }) {
  return (
    <span
      className="text-[10px] font-bold uppercase tracking-[0.16em]"
      style={{ color: tone, ...sans }}
    >
      {children}
    </span>
  );
}

function Coord({ children, tone = C.inkFaint }: { children: ReactNode; tone?: string }) {
  return (
    <span
      className="text-[10px] font-bold uppercase tracking-[0.1em]"
      style={{ color: tone, ...mono }}
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
}: {
  code: string;
  title: string;
  sub?: string;
  right?: ReactNode;
}) {
  return (
    <div className="mb-7 flex flex-wrap items-end justify-between gap-4">
      <div className="min-w-0">
        <span
          className="inline-flex items-center gap-2 px-2 py-1"
          style={{ border: `1px solid ${C.line}`, background: C.surface }}
        >
          <Square size={9} aria-hidden="true" style={{ color: C.accent }} fill={C.accent} />
          <Coord tone={C.ink}>{code}</Coord>
        </span>
        <h1
          className="mt-3 text-[26px] font-bold leading-[1.05] tracking-[-0.03em] md:text-[34px]"
          style={{ color: C.ink }}
        >
          {title}
        </h1>
        {sub && (
          <p className="mt-2 max-w-xl text-[13px] leading-relaxed" style={{ color: C.inkMute }}>
            {sub}
          </p>
        )}
      </div>
      {right}
    </div>
  );
}

// —————————————————————————————————————— Root ——————————————————————————————————————
export function Concept535() {
  const [screen, setScreen] = useState<ScreenKey>("dashboard");
  const active = OPDRACHTEN[0] as Opdracht;

  return (
    <div
      className="min-h-[760px] w-full antialiased"
      style={{ ...sans, color: C.ink, background: C.bg }}
    >
      <div
        className="mx-auto flex max-w-6xl"
        style={{ borderLeft: `1px solid ${C.lineSoft}`, borderRight: `1px solid ${C.lineSoft}` }}
      >
        <Sidebar screen={screen} setScreen={setScreen} />
        <div className="min-w-0 flex-1">
          <TopBar screen={screen} />
          <MobileNav screen={screen} setScreen={setScreen} />
          <main key={screen} className="kz-fade px-4 pb-20 pt-6 sm:px-6 md:px-8">
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
        @keyframes kzFade { from { opacity: 0; transform: translateY(5px); } to { opacity: 1; transform: none; } }
        .kz-fade { animation: kzFade 0.28s cubic-bezier(0.22,1,0.36,1) both; }
        .kz-row { transition: background 0.12s ease; }
        .kz-row:hover { background: ${C.sink}; }
        .kz-lift { transition: box-shadow 0.14s ease, transform 0.14s ease; }
        .kz-lift:hover { box-shadow: 5px 5px 0 ${C.line}; transform: translate(-1px,-1px); }
        @media (prefers-reduced-motion: reduce) {
          .kz-fade { animation: none !important; }
          .kz-row, .kz-lift { transition: none !important; }
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
      className="sticky top-0 hidden h-screen w-[232px] shrink-0 flex-col md:flex"
      style={{ background: C.bg, borderRight: `1px solid ${C.line}` }}
    >
      <div
        className="flex items-center gap-2.5 px-5 py-5"
        style={{ borderBottom: `1px solid ${C.line}` }}
      >
        <span
          className="relative flex h-9 w-9 items-center justify-center"
          style={{ background: C.ink, color: "#fff" }}
          aria-hidden="true"
        >
          <Grid2x2 size={17} />
        </span>
        <span>
          <span className="block text-[14px] font-bold tracking-[-0.02em]" style={{ color: C.ink }}>
            Kozijn
          </span>
          <span
            className="mt-0.5 block text-[9px] font-bold uppercase tracking-[0.2em]"
            style={{ color: C.accent }}
          >
            grid · 1px systeem
          </span>
        </span>
      </div>

      <nav aria-label="Hoofdnavigatie" className="flex-1 overflow-y-auto p-3">
        <p
          className="px-2 pb-2 text-[9px] font-bold uppercase tracking-[0.2em]"
          style={{ color: C.inkFaint }}
        >
          Schermen
        </p>
        <ul className="space-y-1">
          {SCREENS.map((s) => {
            const on = s.key === screen;
            const { Icon, coord } = NAV[s.key];
            return (
              <li key={s.key}>
                <button
                  type="button"
                  onClick={() => setScreen(s.key)}
                  aria-current={on ? "page" : undefined}
                  className={`group flex w-full items-center gap-2.5 px-2.5 py-2 text-left text-[13px] font-semibold transition-colors ${RING}`}
                  style={
                    on
                      ? { background: C.ink, color: "#fff", border: `1px solid ${C.line}` }
                      : { color: C.inkSoft, border: `1px solid transparent` }
                  }
                >
                  <span
                    className="flex h-6 w-6 items-center justify-center"
                    style={{
                      background: on ? C.accent : C.surface,
                      color: on ? "#fff" : C.inkMute,
                      border: `1px solid ${on ? C.line : C.lineSoft}`,
                    }}
                    aria-hidden="true"
                  >
                    <Icon size={13} />
                  </span>
                  <span className="flex-1">{s.label}</span>
                  <span
                    className="text-[9px] font-bold"
                    style={{ color: on ? "#fff" : C.inkFaint, ...mono }}
                  >
                    {coord}
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      </nav>

      <div className="p-4" style={{ borderTop: `1px solid ${C.line}` }}>
        <Frame className="mb-3 p-3" grid>
          <Label tone={C.ink}>Dossier</Label>
          <div className="mt-1.5 flex items-end gap-2">
            <p
              className="text-[26px] font-bold leading-none tracking-[-0.03em]"
              style={{ color: C.ink, ...mono }}
            >
              {ratio}
              <span className="text-[14px]">%</span>
            </p>
            <p className="pb-1 text-[10px]" style={{ color: C.inkMute }}>
              {verified}/{CREDENTIALS.length} geverifieerd
            </p>
          </div>
        </Frame>
        <div className="flex items-center gap-2.5">
          <span
            className="flex h-8 w-8 items-center justify-center text-[11px] font-bold"
            style={{ background: C.ink, color: "#fff", ...mono }}
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
              style={{ color: C.ok }}
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
        backdropFilter: "blur(6px)",
      }}
    >
      <div
        className="flex flex-1 items-center gap-2 px-3 py-2"
        style={{ background: C.surface, border: `1px solid ${C.line}` }}
      >
        <Search size={14} aria-hidden="true" style={{ color: C.inkFaint }} />
        <span className="text-[12.5px]" style={{ color: C.inkFaint }}>
          Zoek in schermen, certificaten, facturen…
        </span>
        <span
          className="ml-auto hidden px-1.5 py-0.5 text-[10px] font-bold sm:inline"
          style={{
            background: C.sink,
            color: C.inkMute,
            border: `1px solid ${C.lineSoft}`,
            ...mono,
          }}
        >
          ⌘K
        </span>
      </div>
      <span
        className="hidden items-center gap-2 px-3 py-2 text-[11.5px] font-bold sm:inline-flex"
        style={{ background: C.warnSoft, color: C.warn, border: `1px solid ${C.warn}` }}
      >
        <Clock size={13} aria-hidden="true" />
        <span style={{ ...mono }}>{eur0.format(open)}</span> OPEN
      </span>
      <span
        className="hidden items-center gap-1.5 px-2.5 py-2 lg:inline-flex"
        style={{ background: C.surface, border: `1px solid ${C.line}` }}
      >
        <Ruler />
        <Coord tone={C.ink}>{NAV[screen].coord}</Coord>
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
      aria-label="Schermen"
      className="flex gap-1.5 overflow-x-auto px-4 py-2.5 md:hidden"
      style={{ borderBottom: `1px solid ${C.line}`, background: C.bg }}
    >
      {SCREENS.map((s) => {
        const on = s.key === screen;
        return (
          <button
            key={s.key}
            type="button"
            onClick={() => setScreen(s.key)}
            aria-current={on ? "page" : undefined}
            className={`shrink-0 px-3 py-1.5 text-[12px] font-bold uppercase tracking-[0.04em] transition-colors ${RING}`}
            style={
              on
                ? { background: C.ink, color: "#fff", border: `1px solid ${C.line}` }
                : { color: C.inkSoft, background: C.surface, border: `1px solid ${C.lineSoft}` }
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
    <div className="space-y-6">
      <ScreenHead
        code="A·00 — OVERZICHT"
        title={`Werkblad — ${PROFIEL.naam.split(" ")[0]}`}
        sub="Het volledige systeem op één blad. Elk vlak heeft een vaste plaats in het raster."
        right={
          <div className="flex gap-2">
            <Btn variant="outline" size="sm" onClick={onVerif}>
              <ShieldCheck size={13} aria-hidden="true" /> Dossier
            </Btn>
            <Btn variant="solid" size="sm" onClick={onActies}>
              Acties <ArrowRight size={13} aria-hidden="true" />
            </Btn>
          </div>
        }
      />

      <section
        className="grid grid-cols-2 xl:grid-cols-4"
        style={{ border: `1px solid ${C.line}` }}
      >
        {KPIS.map((k, i) => (
          <div
            key={k.label}
            className="relative p-4"
            style={{
              borderRight: (i + 1) % 2 === 0 ? "none" : `1px solid ${C.lineSoft}`,
              borderTop: i >= 2 ? `1px solid ${C.lineSoft}` : "none",
              background: C.surface,
            }}
          >
            <div className="flex items-center justify-between">
              <Coord>{`0${i + 1}`}</Coord>
              <Ruler n={5} />
            </div>
            <p
              className="mt-2 text-[10.5px] font-bold uppercase tracking-[0.1em]"
              style={{ color: C.inkMute }}
            >
              {k.label}
            </p>
            <p
              className="mt-1.5 text-[26px] font-bold leading-none tracking-[-0.03em]"
              style={{ color: C.ink, ...mono }}
            >
              {k.value}
            </p>
            <div className="mt-3 flex items-center justify-between">
              <span
                className="inline-flex items-center px-1.5 py-0.5 text-[10.5px] font-bold"
                style={{ color: k.up ? C.ok : C.warn, border: `1px solid ${k.up ? C.ok : C.warn}` }}
              >
                {k.up ? "▲" : "▼"} {k.trend}
              </span>
              <span className="inline-flex h-6 items-end gap-[2px]" aria-hidden="true">
                {k.spark.map((d, j) => {
                  const max = Math.max(...k.spark);
                  const min = Math.min(...k.spark);
                  const h = 3 + ((d - min) / (max - min || 1)) * 18;
                  const last = j === k.spark.length - 1;
                  return (
                    <span
                      key={j}
                      className="w-[3px]"
                      style={{ height: h, background: last ? C.accent : C.sinkDeep }}
                    />
                  );
                })}
              </span>
            </div>
          </div>
        ))}
      </section>

      <section className="grid grid-cols-1 gap-5 lg:grid-cols-[1.55fr_1fr]">
        <Frame className="overflow-hidden">
          <div
            className="flex items-center justify-between px-5 py-3"
            style={{ borderBottom: `1px solid ${C.line}`, background: C.sink }}
          >
            <Label tone={C.ink}>Ingemeten opdrachten</Label>
            <button
              type="button"
              onClick={onMarkt}
              className={`inline-flex items-center gap-1 px-1 text-[11px] font-bold uppercase tracking-[0.06em] ${RING}`}
              style={{ color: C.accent }}
            >
              Alles <ArrowRight size={12} aria-hidden="true" />
            </button>
          </div>
          <ul>
            {OPDRACHTEN.map((o, i) => (
              <li key={o.id}>
                <button
                  type="button"
                  onClick={onOpen}
                  className={`kz-row flex w-full items-center gap-3.5 px-5 py-4 text-left ${RING}`}
                  style={{ borderTop: i === 0 ? "none" : `1px solid ${C.lineSoft}` }}
                >
                  <MatchBlock value={o.match} />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-[14px] font-bold" style={{ color: C.ink }}>
                      {o.titel}
                    </span>
                    <span
                      className="mt-0.5 block truncate text-[11.5px]"
                      style={{ color: C.inkMute }}
                    >
                      {o.opdrachtgever} · {o.plaats}
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
            ))}
          </ul>
        </Frame>

        <div className="space-y-5">
          <Frame className="p-5" grid corners>
            <Label tone={C.ok}>Dossier — vertrouwen</Label>
            <div className="mt-2 flex items-baseline gap-2">
              <span
                className="text-[38px] font-bold leading-none tracking-[-0.04em]"
                style={{ color: C.ink, ...mono }}
              >
                {ratio}%
              </span>
              <span className="text-[11.5px]" style={{ color: C.inkMute }}>
                geverifieerd
              </span>
            </div>
            <div className="mt-3 flex gap-1" aria-hidden="true">
              {CREDENTIALS.map((c) => {
                const t = credTone(c.status);
                return (
                  <span
                    key={c.naam}
                    className="h-2.5 flex-1"
                    style={{ background: t.base, border: `1px solid ${C.line}` }}
                  />
                );
              })}
            </div>
            <p className="mt-2.5 text-[11.5px]" style={{ color: C.inkMute }}>
              {verified} van {CREDENTIALS.length} lagen vastgesteld · {PROFIEL.trust}.
            </p>
          </Frame>

          <Frame className="p-5" tone={C.accent} as="article">
            <Label tone={C.accent}>Actie vereist</Label>
            <h3 className="mt-2 text-[15px] font-bold leading-snug" style={{ color: C.ink }}>
              {primair.titel}
            </h3>
            <p className="mt-1.5 text-[12.5px] leading-relaxed" style={{ color: C.inkSoft }}>
              {primair.detail}
            </p>
            <Btn variant="solid" size="sm" full className="mt-4" onClick={onActies}>
              {primair.cta} <ArrowRight size={13} aria-hidden="true" />
            </Btn>
          </Frame>
        </div>
      </section>
    </div>
  );
}

function MatchBlock({ value }: { value: number }) {
  const tone = value >= 90 ? C.ok : C.ink;
  return (
    <span
      className="relative flex h-12 w-12 shrink-0 flex-col items-center justify-center"
      style={{ border: `1px solid ${C.line}`, background: C.surface }}
      aria-label={`Match ${value} procent`}
    >
      <span className="text-[15px] font-bold leading-none" style={{ color: tone, ...mono }}>
        {value}
      </span>
      <span
        className="mt-0.5 text-[7px] font-bold uppercase tracking-[0.14em]"
        style={{ color: C.inkFaint }}
      >
        match
      </span>
      <span
        className="absolute bottom-0 left-0 h-[3px]"
        style={{ width: `${value}%`, background: tone }}
        aria-hidden="true"
      />
    </span>
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
        code="B·01 — MARKTPLAATS"
        title="Ingemeten opdrachten"
        sub={`${rows.length} van ${OPDRACHTEN.length} opdrachten sluiten aan op je geverifieerde profiel.`}
      />

      <Frame className="flex flex-col gap-2.5 p-3 sm:flex-row sm:items-center">
        <div
          className="flex flex-1 items-center gap-2 px-3 py-2"
          style={{ background: C.sink, border: `1px solid ${C.line}` }}
        >
          <Search size={15} aria-hidden="true" style={{ color: C.inkFaint }} />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Filter op titel, plaats of opdrachtgever…"
            aria-label="Opdrachten filteren"
            className="w-full bg-transparent text-[13px] outline-none placeholder:text-[#9b998e]"
            style={{ color: C.ink }}
          />
          {q && (
            <button
              type="button"
              onClick={() => setQ("")}
              aria-label="Filter wissen"
              className={`flex h-5 w-5 items-center justify-center ${RING}`}
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
              tone={C.ink}
              onClick={() => setSort(s)}
            >
              {s === "match" ? "Match" : "Tarief"}
            </Btn>
          ))}
        </div>
      </Frame>

      {mode === "loading" ? (
        <ul className="space-y-3.5" aria-hidden="true">
          {[0, 1, 2].map((i) => (
            <li key={i}>
              <Frame className="space-y-3 p-5">
                <div
                  className="h-4 w-2/3 animate-pulse motion-reduce:animate-none"
                  style={{ background: C.sinkDeep }}
                />
                <div
                  className="h-3 w-1/2 animate-pulse motion-reduce:animate-none"
                  style={{ background: C.sink }}
                />
              </Frame>
            </li>
          ))}
        </ul>
      ) : mode === "error" ? (
        <StateBlock
          Icon={TriangleAlert}
          tone={C.danger}
          titel="Meting onderbroken"
          tekst="De opdrachten konden zojuist niet worden geladen. Probeer het opnieuw."
          cta="Opnieuw meten"
          onCta={() => setMode("ok")}
        />
      ) : rows.length === 0 ? (
        <StateBlock
          Icon={Search}
          tone={C.ink}
          titel="Geen resultaat binnen raster"
          tekst={`Niets voor ${q ? `“${q}”` : "je filter"}. Verruim de selectie en probeer opnieuw.`}
          cta="Filter wissen"
          onCta={() => setQ("")}
        />
      ) : (
        <ul className="space-y-3.5">
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
            className={`text-[10px] font-bold uppercase tracking-[0.14em] underline-offset-2 hover:underline ${RING}`}
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
    <Frame className="flex flex-col items-center px-6 py-16 text-center" grid corners>
      <span
        className="flex h-16 w-16 items-center justify-center"
        style={{ color: tone, background: C.surface, border: `1px solid ${C.line}` }}
        aria-hidden="true"
      >
        <Icon size={26} />
      </span>
      <p className="mt-4 text-[18px] font-bold" style={{ color: C.ink }}>
        {titel}
      </p>
      <p className="mt-2 max-w-sm text-[13px] leading-relaxed" style={{ color: C.inkMute }}>
        {tekst}
      </p>
      <Btn variant="solid" tone={tone} className="mt-5" onClick={onCta}>
        {cta}
      </Btn>
    </Frame>
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
  return (
    <Frame as="article" className="kz-lift overflow-hidden">
      <div className="flex items-start gap-4 p-5">
        <div className="shrink-0 text-center">
          <MatchBlock value={opdracht.match} />
          <span
            className="mt-2 block px-1.5 py-0.5 text-[8.5px] font-bold uppercase tracking-[0.06em]"
            style={{ color: strong ? C.ok : C.ink, border: `1px solid ${strong ? C.ok : C.line}` }}
          >
            {strong ? "prio" : "match"}
          </span>
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <Coord>{`#${String(index + 1).padStart(2, "0")}`}</Coord>
            <span aria-hidden="true" style={{ color: C.inkFaint }}>
              ·
            </span>
            <Coord>{opdracht.id}</Coord>
          </div>
          <h3
            className="mt-1 text-[16px] font-bold leading-snug tracking-[-0.01em]"
            style={{ color: C.ink }}
          >
            {opdracht.titel}
          </h3>
          <p className="mt-0.5 text-[12px]" style={{ color: C.inkMute }}>
            {opdracht.opdrachtgever} · {opdracht.plaats} · {opdracht.uren} · {opdracht.start}
          </p>
          <div className="mt-2.5 flex flex-wrap gap-1.5">
            {opdracht.tags.map((t) => (
              <span
                key={t}
                className="px-2 py-0.5 text-[10.5px] font-semibold"
                style={{ background: C.sink, color: C.inkSoft, border: `1px solid ${C.lineSoft}` }}
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
          className={`inline-flex items-center gap-1.5 px-1 text-[11.5px] font-bold uppercase tracking-[0.04em] ${RING}`}
          style={{ color: C.ink }}
        >
          <ChevronRight
            size={13}
            aria-hidden="true"
            style={{
              transform: open ? "rotate(90deg)" : "none",
              transition: "transform 0.18s ease",
            }}
          />
          Match-analyse
        </button>
        <div className="ml-auto">
          <Btn variant="solid" size="sm" onClick={onOpen}>
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
            <RedenKolom titel="Positief" tone={C.ok} Icon={Check} items={opdracht.redenen.plus} />
            <RedenKolom
              titel="Let op"
              tone={C.warn}
              Icon={TriangleAlert}
              items={opdracht.redenen.min}
            />
          </div>
        </div>
      </div>
    </Frame>
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
        className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.1em]"
        style={{ color: tone }}
      >
        <Icon size={12} aria-hidden="true" /> {titel}
      </p>
      <ul className="mt-2.5 space-y-2">
        {items.map((r) => (
          <li
            key={r}
            className="flex items-start gap-2.5 text-[12.5px] leading-snug"
            style={{ color: C.inkSoft }}
          >
            <span
              className="mt-1.5 h-2 w-2 shrink-0"
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

      <Frame className="overflow-hidden" grid>
        <div className="p-6 md:p-8">
          <div className="flex items-center gap-2">
            <Coord tone={C.ink}>{opdracht.id}</Coord>
            <span aria-hidden="true" style={{ color: C.inkFaint }}>
              ·
            </span>
            <span
              className="px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.08em]"
              style={{ color: C.accent, border: `1px solid ${C.accent}` }}
            >
              MATCH {opdracht.match}%
            </span>
          </div>
          <h1
            className="mt-3 max-w-2xl text-[26px] font-bold leading-[1.08] tracking-[-0.03em] md:text-[32px]"
            style={{ color: C.ink }}
          >
            {opdracht.titel}
          </h1>
          <p className="mt-2 text-[13.5px]" style={{ color: C.inkMute }}>
            {opdracht.opdrachtgever} · {opdracht.plaats}
          </p>
          <div className="mt-4 flex flex-wrap gap-1.5">
            {opdracht.tags.map((t) => (
              <span
                key={t}
                className="px-2 py-0.5 text-[11px] font-semibold"
                style={{ background: C.surface, color: C.inkSoft, border: `1px solid ${C.line}` }}
              >
                {t}
              </span>
            ))}
          </div>
          <div className="mt-5 flex flex-wrap gap-2">
            <Btn variant="solid">
              Reageer op opdracht <ArrowRight size={14} aria-hidden="true" />
            </Btn>
            <Btn variant="outline" tone={C.ink}>
              Bewaren
            </Btn>
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
                background: C.surface,
              }}
            >
              <Label>{m.l}</Label>
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
      </Frame>

      <Frame className="p-6 md:p-8">
        <Label tone={C.ink}>Navolgbare match — geen verborgen score</Label>
        <p className="mt-2 max-w-xl text-[13px] leading-relaxed" style={{ color: C.inkMute }}>
          Afgezet tegen je geverifieerde profiel. Wat positief scoort en wat je vooraf wilt weten —
          volledig uitgelegd.
        </p>
        <div className="mt-6 grid grid-cols-1 gap-6 md:grid-cols-2">
          <RedenDetail titel="Positief" tone={C.ok} Icon={Check} items={opdracht.redenen.plus} />
          <RedenDetail
            titel="Let op"
            tone={C.warn}
            Icon={TriangleAlert}
            items={opdracht.redenen.min}
          />
        </div>
      </Frame>

      <Frame className="flex flex-col gap-4 p-6 sm:flex-row sm:items-center" tone={C.ok}>
        <ShieldCheck size={22} aria-hidden="true" style={{ color: C.ok }} />
        <div className="min-w-0 flex-1">
          <p className="text-[13.5px] font-bold" style={{ color: C.ink }}>
            Compliance sluitend
          </p>
          <p className="mt-0.5 text-[12.5px]" style={{ color: C.inkMute }}>
            Je BIG-registratie en diploma dekken de vereiste certificaten voor deze opdracht.
          </p>
        </div>
        <StatusTag {...credTone("VERIFIED")} />
      </Frame>
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
        className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.1em]"
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
        code="C·03 — VERIFICATIE"
        title="Certificatendossier"
        sub={`${verified} van ${CREDENTIALS.length} geverifieerd · ${PROFIEL.trust}.`}
        right={
          <Frame className="px-4 py-2 text-right" corners>
            <p
              className="text-[26px] font-bold leading-none tracking-[-0.03em]"
              style={{ color: C.ok, ...mono }}
            >
              {ratio}%
            </p>
            <Label tone={C.ok}>geverifieerd</Label>
          </Frame>
        }
      />

      <Frame className="p-4">
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
      </Frame>

      <ul className="space-y-3">
        {CREDENTIALS.map((c) => {
          const t = credTone(c.status);
          const isOpen = open === c.naam;
          return (
            <li key={c.naam}>
              <Frame as="article" className="overflow-hidden">
                <button
                  type="button"
                  onClick={() => setOpen(isOpen ? null : c.naam)}
                  aria-expanded={isOpen}
                  className={`flex w-full items-center gap-3.5 px-5 py-4 text-left ${RING}`}
                >
                  <span
                    className="flex h-10 w-10 shrink-0 items-center justify-center"
                    style={{ background: t.soft, color: t.base, border: `1px solid ${t.base}` }}
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
                      transition: "transform 0.18s ease",
                    }}
                  />
                </button>
                <div
                  className="grid transition-all duration-300 motion-reduce:transition-none"
                  style={{ gridTemplateRows: isOpen ? "1fr" : "0fr" }}
                >
                  <div className="overflow-hidden">
                    <div
                      className="px-5 pb-4 sm:pl-[74px]"
                      style={{ borderTop: `1px solid ${C.lineSoft}`, paddingTop: 12 }}
                    >
                      <span className="mb-2 inline-flex sm:hidden">
                        <StatusTag {...t} />
                      </span>
                      <p
                        className="max-w-xl text-[12.5px] leading-relaxed"
                        style={{ color: C.inkMute }}
                      >
                        {c.detail}. Het document wordt versleuteld bewaard en alleen na jouw
                        toestemming ingezien door een opdrachtgever.
                      </p>
                      <div className="mt-3 flex flex-wrap gap-2">
                        <Btn size="sm" variant="solid" tone={t.alarm ? t.base : C.ink}>
                          {c.status === "EXPIRING"
                            ? "Vernieuwen"
                            : c.status === "REJECTED"
                              ? "Opnieuw indienen"
                              : "Bekijken"}
                        </Btn>
                        <Btn size="sm" variant="outline" tone={C.ink}>
                          Details
                        </Btn>
                      </div>
                    </div>
                  </div>
                </div>
              </Frame>
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
        code="D·04 — ACTIES"
        title="Werklijst"
        sub="Op volgorde van urgentie. Elke regel heeft een vaste index en één actie."
      />
      <ol className="space-y-3.5">
        {ACTIES.map((a, i) => {
          const warn = a.urgentie === "warning";
          const tone = warn ? C.warn : C.ink;
          const goMarkt = a.cta.toLowerCase().includes("match");
          const goFacturen = a.cta.toLowerCase().includes("herinner");
          return (
            <li key={a.titel}>
              <Frame className="kz-lift flex items-start gap-4 p-5">
                <span
                  className="flex h-11 w-11 shrink-0 items-center justify-center text-[15px] font-bold"
                  style={{
                    background: warn ? C.warnSoft : C.sink,
                    color: tone,
                    border: `1px solid ${C.line}`,
                    ...mono,
                  }}
                  aria-hidden="true"
                >
                  {String(i + 1).padStart(2, "0")}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    {warn ? (
                      <TriangleAlert size={12} aria-hidden="true" style={{ color: tone }} />
                    ) : (
                      <Square size={9} aria-hidden="true" style={{ color: tone }} fill={tone} />
                    )}
                    <Label tone={tone}>{warn ? "Urgent" : "Aanbevolen"}</Label>
                  </div>
                  <h2
                    className="mt-1.5 text-[15.5px] font-bold leading-snug"
                    style={{ color: C.ink }}
                  >
                    {a.titel}
                  </h2>
                  <p
                    className="mt-1 max-w-lg text-[13px] leading-relaxed"
                    style={{ color: C.inkMute }}
                  >
                    {a.detail}
                  </p>
                  <div className="mt-3">
                    <Btn
                      variant={warn ? "solid" : "outline"}
                      size="sm"
                      tone={warn ? C.warn : C.ink}
                      onClick={goMarkt ? onMarkt : goFacturen ? onFacturen : undefined}
                    >
                      {a.cta} <ArrowRight size={13} aria-hidden="true" />
                    </Btn>
                  </div>
                </div>
              </Frame>
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
        code="E·05 — FACTUREN"
        title="Facturatie"
        sub="Selecteer een regel om de opbouw te openen."
        right={
          <Btn variant="solid" size="sm">
            <Plus size={13} aria-hidden="true" /> Nieuwe factuur
          </Btn>
        }
      />

      <section
        className="grid grid-cols-1 sm:grid-cols-3"
        style={{ border: `1px solid ${C.line}` }}
      >
        {[
          { l: "Betaald", v: totals.betaald, sub: "2 facturen", tone: C.ok, Icon: Check },
          {
            l: "Openstaand",
            v: totals.open,
            sub: "1 factuur · 9 dagen",
            tone: C.warn,
            Icon: Clock,
          },
          {
            l: "Concept",
            v: totals.concept,
            sub: "klaar om te versturen",
            tone: C.ink,
            Icon: FileText,
          },
        ].map((s, i) => (
          <div
            key={s.l}
            className="p-4"
            style={{
              borderRight: i < 2 ? `1px solid ${C.lineSoft}` : "none",
              background: C.surface,
            }}
          >
            <div className="flex items-center justify-between">
              <Label tone={s.tone}>{s.l}</Label>
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
          </div>
        ))}
      </section>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-[1.5fr_1fr]">
        <Frame className="overflow-hidden">
          <div
            className="flex items-center justify-between px-5 py-3"
            style={{ borderBottom: `1px solid ${C.line}`, background: C.sink }}
          >
            <Label tone={C.ink}>Facturen</Label>
            <div className="flex items-center gap-1.5" role="group" aria-label="Facturen sorteren">
              {(["datum", "bedrag"] as const).map((s) => (
                <Btn
                  key={s}
                  size="sm"
                  variant={sort === s ? "solid" : "outline"}
                  tone={C.ink}
                  onClick={() => setSort(s)}
                >
                  {s === "datum" ? "Datum" : "Bedrag"}
                </Btn>
              ))}
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left" style={{ minWidth: 460 }}>
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
                      className={`kz-row cursor-pointer ${RING}`}
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
                        background: on ? C.sink : undefined,
                      }}
                    >
                      <td
                        className="px-4 py-3 text-[12px] font-bold"
                        style={{ color: on ? C.accent : C.inkSoft, ...mono }}
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
                          className="inline-flex items-center gap-1.5 text-[10.5px] font-bold uppercase tracking-[0.06em]"
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
        </Frame>

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
    <Frame as="article" className="overflow-hidden" grid>
      <div className="p-5" style={{ borderBottom: `1px solid ${C.line}`, background: C.surface }}>
        <Label tone={t.base}>Opbouw factuur</Label>
        <p className="mt-1 text-[17px] font-bold" style={{ color: C.ink, ...mono }}>
          {factuur.nr}
        </p>
      </div>
      <div className="space-y-3 p-5 text-[12.5px]" style={{ background: C.surface }}>
        <Row label="Klant" value={factuur.klant} />
        <Row label="Datum" value={factuur.datum} isMono />
        <div className="flex items-baseline justify-between">
          <span style={{ color: C.inkMute }}>Status</span>
          <span
            className="inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-[0.06em]"
            style={{ color: t.base }}
          >
            <t.Icon size={12} aria-hidden="true" /> {t.label}
          </span>
        </div>
        <div className="my-3 h-px" style={{ background: C.lineSoft }} />
        <Row label="Subtotaal" value={eur0.format(subtotal)} isMono />
        <Row label="Btw 21%" value={eur0.format(btw)} isMono />
        <div className="my-3 h-px" style={{ background: C.line }} />
        <div className="flex items-baseline justify-between">
          <span
            className="text-[11px] font-bold uppercase tracking-[0.1em]"
            style={{ color: C.ink }}
          >
            Totaal
          </span>
          <span className="text-[20px] font-bold" style={{ color: C.ink, ...mono }}>
            {factuur.bedrag}
          </span>
        </div>
        <div className="mt-4 flex gap-2">
          <Btn variant="solid" size="sm" full tone={t.base === C.ink ? C.accent : t.base}>
            {factuur.status === "Concept"
              ? "Versturen"
              : factuur.status === "Openstaand"
                ? "Herinnering"
                : "Download"}
            <ArrowRight size={13} aria-hidden="true" />
          </Btn>
          <Btn variant="outline" size="sm" tone={C.ink}>
            PDF
          </Btn>
        </div>
      </div>
    </Frame>
  );
}

function Row({ label, value, isMono = false }: { label: string; value: string; isMono?: boolean }) {
  return (
    <div className="flex items-baseline gap-2">
      <span className="shrink-0" style={{ color: C.inkMute }}>
        {label}
      </span>
      <span
        className="min-w-0 flex-1 self-end border-b border-dotted"
        style={{ borderColor: C.lineSoft }}
        aria-hidden="true"
      />
      <span
        className="shrink-0 text-right font-bold"
        style={{ color: C.ink, ...(isMono ? mono : sans) }}
      >
        {value}
      </span>
    </div>
  );
}
