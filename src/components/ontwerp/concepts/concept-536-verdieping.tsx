"use client";

// Concept 536 — "Verdieping" · Ruimtelijke diepte. Gelaagde z-vlakken met een subtiele
// schaduw-hiërarchie en lichte parallax (translate-op-hover). Panelen zweven "boven elkaar" om
// navigatie en begrip te tonen: voorgrond = actie, achtergrond = context. Diepte dient het begrip —
// heldere elevatielagen in een licht thema, geen wow-effect om het effect.

import { useMemo, useState, type CSSProperties, type ReactNode } from "react";
import {
  ArrowLeft,
  ArrowRight,
  ArrowUpRight,
  BadgeCheck,
  Check,
  ChevronRight,
  Clock,
  FileText,
  Layers,
  LayoutGrid,
  ListChecks,
  MapPin,
  Plus,
  Receipt,
  Search,
  ShieldCheck,
  Sparkles,
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

// ————————————————————————————— Palet — licht, met heldere elevatielagen —————————————————————————————
const C = {
  bg: "#eaeef5",
  base: "#e3e8f1",
  panel: "#ffffff",
  sink: "#f2f5fa",
  sinkDeep: "#e9edf4",
  hair: "#e0e5ee",
  hairSoft: "#edf0f6",
  ink: "#1a2233",
  inkSoft: "#414b5f",
  inkMute: "#727d92",
  inkFaint: "#a3acbe",
  accent: "#3b64f5",
  accentSoft: "#e8eeff",
  accentDeep: "#2547c7",
  ok: "#1f8a54",
  okSoft: "#e2f2e9",
  warn: "#b0741a",
  warnSoft: "#f6ecd7",
  danger: "#c23a2a",
  dangerSoft: "#f8e4e0",
};

// Elevatie-schaal — de kern van dit concept.
const E = {
  e0: "inset 0 0 0 1px rgba(26,34,51,0.05)",
  e1: "0 1px 2px rgba(26,34,51,0.06), 0 1px 3px -1px rgba(26,34,51,0.05)",
  e2: "0 4px 12px -4px rgba(26,34,51,0.12), 0 2px 6px -3px rgba(26,34,51,0.08)",
  e3: "0 16px 36px -14px rgba(26,34,51,0.22), 0 6px 14px -8px rgba(26,34,51,0.12)",
  e4: "0 30px 64px -22px rgba(26,34,51,0.30), 0 10px 22px -12px rgba(26,34,51,0.16)",
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
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#3b64f5] focus-visible:ring-offset-2 focus-visible:ring-offset-[#eaeef5]";

// ————————————————————————————— Status-taal (label + icoon) —————————————————————————————
type Tone = { base: string; soft: string; label: string; Icon: LucideIcon; alarm: boolean };

function credTone(s: CredStatus): Tone {
  switch (s) {
    case "VERIFIED":
      return { base: C.ok, soft: C.okSoft, label: "Geverifieerd", Icon: BadgeCheck, alarm: false };
    case "SUBMITTED":
      return {
        base: C.accent,
        soft: C.accentSoft,
        label: "In beoordeling",
        Icon: Clock,
        alarm: false,
      };
    case "EXPIRING":
      return {
        base: C.warn,
        soft: C.warnSoft,
        label: "Verloopt bijna",
        Icon: TriangleAlert,
        alarm: true,
      };
    case "REJECTED":
      return { base: C.danger, soft: C.dangerSoft, label: "Afgewezen", Icon: X, alarm: true };
  }
}

function factuurTone(status: string): {
  base: string;
  soft: string;
  label: string;
  Icon: LucideIcon;
} {
  if (status === "Betaald") return { base: C.ok, soft: C.okSoft, label: "Betaald", Icon: Check };
  if (status === "Openstaand")
    return { base: C.warn, soft: C.warnSoft, label: "Openstaand", Icon: Clock };
  return { base: C.accent, soft: C.accentSoft, label: "Concept", Icon: FileText };
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

const NAV_ICON: Record<ScreenKey, LucideIcon> = {
  dashboard: LayoutGrid,
  marktplaats: Store,
  opdracht: MapPin,
  verificatie: ShieldCheck,
  acties: ListChecks,
  facturen: Receipt,
  documenten: FileText,
  berichten: FileText,
};

// ————————————————————————————— Primitives —————————————————————————————
function Panel({
  children,
  className = "",
  as: Tag = "div",
  level = 2,
  hover = false,
}: {
  children: ReactNode;
  className?: string;
  as?: "div" | "section" | "article" | "aside" | "li";
  level?: 1 | 2 | 3 | 4;
  hover?: boolean;
}) {
  const shadow = level === 1 ? E.e1 : level === 2 ? E.e2 : level === 3 ? E.e3 : E.e4;
  return (
    <Tag
      className={`rounded-[16px] ${hover ? "vd-float" : ""} ${className}`}
      style={{ background: C.panel, boxShadow: shadow, border: `1px solid ${C.hairSoft}` }}
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
  const pad = size === "sm" ? "px-3 py-1.5 text-[12.5px]" : "px-4 py-2.5 text-[13px]";
  const base = `inline-flex items-center justify-center gap-2 rounded-[10px] font-semibold tracking-[-0.01em] transition-all duration-150 active:translate-y-px ${RING} ${full ? "w-full" : ""}`;
  const style: CSSProperties =
    variant === "solid"
      ? { background: tone, color: "#fff", boxShadow: `0 6px 16px -6px ${tone}88`, ...sans }
      : variant === "outline"
        ? {
            background: C.panel,
            color: C.inkSoft,
            border: `1px solid ${C.hair}`,
            boxShadow: E.e1,
            ...sans,
          }
        : { background: "transparent", color: C.inkMute, ...sans };
  const hover =
    variant === "solid"
      ? "hover:brightness-108"
      : variant === "outline"
        ? "hover:bg-[#f2f5fa]"
        : "hover:bg-[#eef0f6]";
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
      style={{ color: base, background: soft, ...sans }}
    >
      <Icon size={12} aria-hidden="true" />
      {label}
      {alarm && <span className="sr-only"> (aandacht vereist)</span>}
    </span>
  );
}

function Eyebrow({ children, tone = C.inkFaint }: { children: ReactNode; tone?: string }) {
  return (
    <span
      className="text-[10.5px] font-bold uppercase tracking-[0.16em]"
      style={{ color: tone, ...sans }}
    >
      {children}
    </span>
  );
}

function ScreenHead({
  eyebrow,
  title,
  sub,
  right,
}: {
  eyebrow: string;
  title: string;
  sub?: string;
  right?: ReactNode;
}) {
  return (
    <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
      <div className="min-w-0">
        <Eyebrow tone={C.accent}>{eyebrow}</Eyebrow>
        <h1
          className="mt-2 text-[26px] font-bold leading-tight tracking-[-0.025em] md:text-[32px]"
          style={{ color: C.ink }}
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

// —————————————————————————————————————— Root ——————————————————————————————————————
export function Concept536() {
  const [screen, setScreen] = useState<ScreenKey>("dashboard");
  const active = OPDRACHTEN[0] as Opdracht;

  return (
    <div
      className="min-h-[760px] w-full antialiased"
      style={{
        ...sans,
        color: C.ink,
        background: `radial-gradient(1200px 600px at 50% -10%, #f2f5fb 0%, ${C.bg} 60%)`,
      }}
    >
      <div className="mx-auto flex max-w-6xl gap-0 px-0 py-0 md:gap-6 md:px-6 md:py-6">
        <Sidebar screen={screen} setScreen={setScreen} />
        <div className="min-w-0 flex-1">
          <TopBar screen={screen} />
          <MobileNav screen={screen} setScreen={setScreen} />
          <main key={screen} className="vd-rise px-4 pb-20 pt-6 sm:px-2 md:pt-2">
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
        @keyframes vdRise { from { opacity: 0; transform: translateY(14px) scale(0.99); } to { opacity: 1; transform: none; } }
        .vd-rise { animation: vdRise 0.4s cubic-bezier(0.22,1,0.36,1) both; }
        .vd-float { transition: transform 0.24s cubic-bezier(0.22,1,0.36,1), box-shadow 0.24s ease; will-change: transform; }
        .vd-float:hover { transform: translateY(-4px); box-shadow: ${E.e4}; }
        .vd-row { transition: background 0.16s ease, transform 0.16s ease; }
        .vd-row:hover { background: ${C.sink}; transform: translateX(2px); }
        @media (prefers-reduced-motion: reduce) {
          .vd-rise { animation: none !important; }
          .vd-float, .vd-row { transition: none !important; }
          .vd-float:hover, .vd-row:hover { transform: none !important; }
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
      className="sticky top-6 hidden h-[calc(100vh-3rem)] w-[228px] shrink-0 flex-col rounded-[18px] md:flex"
      style={{ background: C.panel, boxShadow: E.e3, border: `1px solid ${C.hairSoft}` }}
    >
      <div className="flex items-center gap-2.5 px-5 py-5">
        <span
          className="flex h-9 w-9 items-center justify-center rounded-[11px]"
          style={{
            background: C.accent,
            color: "#fff",
            boxShadow: `0 6px 14px -4px ${C.accent}99`,
          }}
          aria-hidden="true"
        >
          <Layers size={17} />
        </span>
        <span>
          <span
            className="block text-[14.5px] font-bold tracking-[-0.02em]"
            style={{ color: C.ink }}
          >
            Verdieping
          </span>
          <span
            className="mt-0.5 block text-[9px] font-bold uppercase tracking-[0.18em]"
            style={{ color: C.accent }}
          >
            gelaagd overzicht
          </span>
        </span>
      </div>

      <nav aria-label="Hoofdnavigatie" className="flex-1 overflow-y-auto px-3">
        <ul className="space-y-1">
          {SCREENS.map((s) => {
            const on = s.key === screen;
            const Icon = NAV_ICON[s.key];
            return (
              <li key={s.key}>
                <button
                  type="button"
                  onClick={() => setScreen(s.key)}
                  aria-current={on ? "page" : undefined}
                  className={`group flex w-full items-center gap-3 rounded-[11px] px-3 py-2.5 text-left text-[13px] font-semibold transition-all ${RING}`}
                  style={
                    on
                      ? { background: C.accentSoft, color: C.accentDeep, boxShadow: E.e1 }
                      : { color: C.inkMute }
                  }
                >
                  <span
                    className="flex h-7 w-7 items-center justify-center rounded-[9px]"
                    style={
                      on
                        ? {
                            background: C.accent,
                            color: "#fff",
                            boxShadow: `0 4px 10px -3px ${C.accent}aa`,
                          }
                        : { background: C.sink, color: C.inkMute }
                    }
                    aria-hidden="true"
                  >
                    <Icon size={14} />
                  </span>
                  <span className="flex-1">{s.label}</span>
                  {on && <ChevronRight size={14} aria-hidden="true" style={{ color: C.accent }} />}
                </button>
              </li>
            );
          })}
        </ul>
      </nav>

      <div className="px-4 py-4">
        <div
          className="mb-3 rounded-[13px] p-3.5"
          style={{
            background: `linear-gradient(160deg, ${C.accentSoft}, ${C.sink})`,
            boxShadow: E.e1,
          }}
        >
          <Eyebrow tone={C.accentDeep}>Dossier</Eyebrow>
          <div className="mt-1 flex items-baseline gap-1.5">
            <span
              className="text-[24px] font-bold leading-none tracking-[-0.03em]"
              style={{ color: C.ink, ...mono }}
            >
              {ratio}%
            </span>
            <span className="text-[10px]" style={{ color: C.inkMute }}>
              geverifieerd
            </span>
          </div>
        </div>
        <div className="flex items-center gap-2.5">
          <span
            className="flex h-8 w-8 items-center justify-center rounded-full text-[11px] font-bold"
            style={{ background: C.sink, color: C.inkSoft, boxShadow: E.e1, ...mono }}
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
  const label = SCREENS.find((s) => s.key === screen)?.label ?? "Dashboard";
  return (
    <header className="mb-4 flex items-center gap-3 px-4 pt-4 sm:px-2 md:pt-0">
      <div
        className="flex flex-1 items-center gap-2 rounded-[12px] px-3.5 py-2.5"
        style={{ background: C.panel, boxShadow: E.e2, border: `1px solid ${C.hairSoft}` }}
      >
        <Search size={15} aria-hidden="true" style={{ color: C.inkFaint }} />
        <span className="text-[12.5px]" style={{ color: C.inkFaint }}>
          Zoek in {label.toLowerCase()}, certificaten, facturen…
        </span>
        <span
          className="ml-auto hidden rounded-[6px] px-1.5 py-0.5 text-[10px] font-bold sm:inline"
          style={{ background: C.sink, color: C.inkMute, ...mono }}
        >
          ⌘K
        </span>
      </div>
      <span
        className="hidden items-center gap-2 rounded-[12px] px-3.5 py-2.5 text-[12px] font-semibold sm:inline-flex"
        style={{ background: C.warnSoft, color: C.warn, boxShadow: E.e1 }}
      >
        <Clock size={13} aria-hidden="true" />
        <span style={{ ...mono }}>{eur0.format(open)}</span> openstaand
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
    <nav aria-label="Schermen" className="mb-4 flex gap-1.5 overflow-x-auto px-4 sm:px-2 md:hidden">
      {SCREENS.map((s) => {
        const on = s.key === screen;
        return (
          <button
            key={s.key}
            type="button"
            onClick={() => setScreen(s.key)}
            aria-current={on ? "page" : undefined}
            className={`shrink-0 rounded-full px-3.5 py-1.5 text-[12.5px] font-semibold transition-all ${RING}`}
            style={
              on
                ? {
                    background: C.accent,
                    color: "#fff",
                    boxShadow: `0 6px 14px -5px ${C.accent}aa`,
                  }
                : { color: C.inkMute, background: C.panel, boxShadow: E.e1 }
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
    <div className="space-y-8">
      <ScreenHead
        eyebrow="Overzicht"
        title={`Goedemorgen, ${PROFIEL.naam.split(" ")[0]}`}
        sub="De voorgrond toont wat nú telt; de context ligt er rustig achter. Beweeg over een laag om die naar voren te halen."
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

      <section className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {KPIS.map((k) => (
          <Panel key={k.label} className="p-5" level={1} hover>
            <p className="text-[11.5px] font-medium" style={{ color: C.inkMute }}>
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
                className="inline-flex items-center gap-1 text-[11.5px] font-semibold"
                style={{ color: k.up ? C.ok : C.warn }}
              >
                {k.up ? (
                  <ArrowUpRight size={12} aria-hidden="true" />
                ) : (
                  <TriangleAlert size={11} aria-hidden="true" />
                )}
                {k.trend}
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
                      style={{ height: h, background: last ? C.accent : C.hair }}
                    />
                  );
                })}
              </span>
            </div>
          </Panel>
        ))}
      </section>

      <section className="grid grid-cols-1 gap-6 lg:grid-cols-[1.6fr_1fr]">
        <Panel className="overflow-hidden" level={2}>
          <div
            className="flex items-center justify-between px-5 py-4"
            style={{ borderBottom: `1px solid ${C.hairSoft}` }}
          >
            <span className="flex items-center gap-2">
              <Store size={15} aria-hidden="true" style={{ color: C.accent }} />
              <h2 className="text-[14.5px] font-bold tracking-[-0.01em]" style={{ color: C.ink }}>
                Beste matches
              </h2>
            </span>
            <button
              type="button"
              onClick={onMarkt}
              className={`inline-flex items-center gap-1 rounded-[6px] px-1 text-[12px] font-semibold ${RING}`}
              style={{ color: C.accent }}
            >
              Alle opdrachten <ArrowRight size={13} aria-hidden="true" />
            </button>
          </div>
          <ul>
            {OPDRACHTEN.map((o, i) => (
              <li key={o.id}>
                <button
                  type="button"
                  onClick={onOpen}
                  className={`vd-row flex w-full items-center gap-4 px-5 py-4 text-left ${RING}`}
                  style={{ borderTop: i === 0 ? "none" : `1px solid ${C.hairSoft}` }}
                >
                  <MatchRing value={o.match} />
                  <span className="min-w-0 flex-1">
                    <span
                      className="block truncate text-[14.5px] font-semibold"
                      style={{ color: C.ink }}
                    >
                      {o.titel}
                    </span>
                    <span
                      className="mt-0.5 block truncate text-[12px]"
                      style={{ color: C.inkMute }}
                    >
                      {o.opdrachtgever} · {o.plaats}
                    </span>
                  </span>
                  <span className="hidden shrink-0 text-right sm:block">
                    <span
                      className="block text-[14px] font-semibold"
                      style={{ color: C.ink, ...mono }}
                    >
                      {o.tarief.replace(" / uur", "")}
                    </span>
                    <span className="text-[10px]" style={{ color: C.inkFaint }}>
                      per uur
                    </span>
                  </span>
                  <ChevronRight size={17} aria-hidden="true" style={{ color: C.inkFaint }} />
                </button>
              </li>
            ))}
          </ul>
        </Panel>

        <div className="space-y-6">
          {/* Gelaagde diepte-illustratie: voorgrond = actie, achtergrond = context */}
          <div className="relative">
            <div
              className="absolute inset-x-3 -top-2 h-14 rounded-[16px]"
              style={{
                background: C.panel,
                boxShadow: E.e1,
                border: `1px solid ${C.hairSoft}`,
                opacity: 0.7,
              }}
              aria-hidden="true"
            />
            <div
              className="absolute inset-x-1.5 -top-1 h-16 rounded-[16px]"
              style={{
                background: C.panel,
                boxShadow: E.e1,
                border: `1px solid ${C.hairSoft}`,
                opacity: 0.85,
              }}
              aria-hidden="true"
            />
            <Panel className="relative p-5" level={3}>
              <div className="flex items-center justify-between">
                <Eyebrow tone={C.accent}>Verificatie</Eyebrow>
                <button
                  type="button"
                  onClick={onVerif}
                  className={`rounded-[6px] px-1 text-[12px] font-semibold ${RING}`}
                  style={{ color: C.accent }}
                >
                  Beheer
                </button>
              </div>
              <div className="mt-3 flex items-baseline gap-2">
                <span
                  className="text-[34px] font-bold leading-none tracking-[-0.03em]"
                  style={{ color: C.ink, ...mono }}
                >
                  {ratio}%
                </span>
                <span className="text-[12px]" style={{ color: C.inkMute }}>
                  compleet
                </span>
              </div>
              <div className="mt-3.5 flex gap-1.5" aria-hidden="true">
                {CREDENTIALS.map((c) => {
                  const t = credTone(c.status);
                  return (
                    <span
                      key={c.naam}
                      className="h-1.5 flex-1 rounded-full"
                      style={{ background: t.base }}
                    />
                  );
                })}
              </div>
              <ul className="mt-4 space-y-2.5">
                {CREDENTIALS.filter((c) => c.status !== "VERIFIED").map((c) => {
                  const t = credTone(c.status);
                  return (
                    <li key={c.naam} className="flex items-center gap-2.5">
                      <t.Icon size={14} aria-hidden="true" style={{ color: t.base }} />
                      <span
                        className="min-w-0 flex-1 truncate text-[12.5px] font-medium"
                        style={{ color: C.inkSoft }}
                      >
                        {c.naam}
                      </span>
                      <StatusTag {...t} />
                    </li>
                  );
                })}
              </ul>
            </Panel>
          </div>

          <Panel className="p-5" level={2} hover>
            <Eyebrow tone={C.warn}>Vraagt actie</Eyebrow>
            <h3 className="mt-2.5 text-[15px] font-bold leading-snug" style={{ color: C.ink }}>
              {primair.titel}
            </h3>
            <p className="mt-1.5 text-[12.5px] leading-relaxed" style={{ color: C.inkMute }}>
              {primair.detail}
            </p>
            <Btn variant="solid" size="sm" full tone={C.warn} className="mt-4" onClick={onActies}>
              {primair.cta} <ArrowRight size={13} aria-hidden="true" />
            </Btn>
          </Panel>
        </div>
      </section>
    </div>
  );
}

function MatchRing({ value }: { value: number }) {
  const tone = value >= 90 ? C.ok : C.accent;
  return (
    <span
      className="relative flex h-11 w-11 shrink-0 items-center justify-center rounded-full"
      style={{ background: C.panel, boxShadow: E.e2 }}
      aria-label={`Match ${value} procent`}
    >
      <svg
        viewBox="0 0 40 40"
        className="absolute inset-0 h-full w-full -rotate-90"
        aria-hidden="true"
      >
        <circle cx="20" cy="20" r="16" fill="none" stroke={C.hair} strokeWidth="3" />
        <circle
          cx="20"
          cy="20"
          r="16"
          fill="none"
          stroke={tone}
          strokeWidth="3"
          strokeLinecap="round"
          strokeDasharray={`${(value / 100) * 100.5} 100.5`}
        />
      </svg>
      <span className="relative text-[11.5px] font-bold" style={{ color: tone, ...mono }}>
        {value}
      </span>
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
    <div className="space-y-7">
      <ScreenHead
        eyebrow="Marktplaats"
        title="Opdrachten voor jou"
        sub={`${rows.length} van ${OPDRACHTEN.length} opdrachten sluiten aan op je geverifieerde profiel.`}
      />

      <Panel className="flex flex-col gap-3 p-3 sm:flex-row sm:items-center" level={2}>
        <div
          className="flex flex-1 items-center gap-2.5 rounded-[11px] px-3.5 py-2.5"
          style={{ background: C.sink }}
        >
          <Search size={16} aria-hidden="true" style={{ color: C.inkFaint }} />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Zoek op titel, plaats of opdrachtgever…"
            aria-label="Opdrachten zoeken"
            className="w-full bg-transparent text-[13.5px] outline-none placeholder:text-[#a3acbe]"
            style={{ color: C.ink }}
          />
          {q && (
            <button
              type="button"
              onClick={() => setQ("")}
              aria-label="Zoekopdracht wissen"
              className={`flex h-5 w-5 items-center justify-center rounded-[5px] ${RING}`}
              style={{ color: C.inkMute }}
            >
              <X size={13} aria-hidden="true" />
            </button>
          )}
        </div>
        <div
          className="inline-flex items-center gap-1 rounded-[11px] p-1"
          role="group"
          aria-label="Sorteren"
          style={{ background: C.sink }}
        >
          {(["match", "tarief"] as const).map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => setSort(s)}
              aria-pressed={sort === s}
              className={`rounded-[8px] px-3.5 py-1.5 text-[12.5px] font-semibold transition-all ${RING}`}
              style={
                sort === s
                  ? { background: C.panel, color: C.ink, boxShadow: E.e1 }
                  : { color: C.inkMute }
              }
            >
              {s === "match" ? "Match" : "Tarief"}
            </button>
          ))}
        </div>
      </Panel>

      {mode === "loading" ? (
        <ul className="space-y-4" aria-hidden="true">
          {[0, 1, 2].map((i) => (
            <li key={i}>
              <Panel className="space-y-3 p-5" level={1}>
                <div
                  className="h-4 w-2/3 animate-pulse rounded-full motion-reduce:animate-none"
                  style={{ background: C.sinkDeep }}
                />
                <div
                  className="h-3 w-1/2 animate-pulse rounded-full motion-reduce:animate-none"
                  style={{ background: C.sink }}
                />
              </Panel>
            </li>
          ))}
        </ul>
      ) : mode === "error" ? (
        <StateBlock
          Icon={TriangleAlert}
          tone={C.danger}
          titel="Er ging iets mis"
          tekst="De opdrachten konden even niet geladen worden. Probeer het opnieuw."
          cta="Opnieuw proberen"
          onCta={() => setMode("ok")}
        />
      ) : rows.length === 0 ? (
        <StateBlock
          Icon={Search}
          tone={C.accent}
          titel="Geen resultaten"
          tekst={`Niets gevonden voor ${q ? `“${q}”` : "je filter"}. Verruim je zoekopdracht.`}
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
            className={`rounded text-[10.5px] font-bold uppercase tracking-[0.14em] underline-offset-2 hover:underline ${RING}`}
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
    <Panel className="flex flex-col items-center px-6 py-16 text-center" level={2}>
      <span
        className="flex h-16 w-16 items-center justify-center rounded-[16px]"
        style={{ color: tone, background: `${tone}14`, boxShadow: E.e1 }}
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
  return (
    <Panel as="article" className="overflow-hidden" level={2} hover>
      <div className="flex items-start gap-4 p-5">
        <MatchRing value={opdracht.match} />
        <div className="min-w-0 flex-1">
          <div
            className="flex items-center gap-2 text-[10.5px] font-semibold"
            style={{ color: C.inkFaint, ...mono }}
          >
            <span>{String(index + 1).padStart(2, "0")}</span>
            <span aria-hidden="true">·</span>
            <span>{opdracht.id}</span>
            {strong && (
              <span
                className="rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.06em]"
                style={{ background: C.okSoft, color: C.ok, ...sans }}
              >
                Sterke match
              </span>
            )}
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
                className="rounded-full px-2.5 py-0.5 text-[11px] font-medium"
                style={{ background: C.sink, color: C.inkSoft }}
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
          <span className="text-[10px]" style={{ color: C.inkFaint }}>
            per uur
          </span>
        </span>
      </div>

      <div
        className="flex flex-wrap items-center gap-2 px-5 py-3"
        style={{ borderTop: `1px solid ${C.hairSoft}`, background: C.sink }}
      >
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          className={`inline-flex items-center gap-1.5 rounded-[6px] px-1 text-[12px] font-semibold ${RING}`}
          style={{ color: C.inkSoft }}
        >
          <ChevronRight
            size={14}
            aria-hidden="true"
            style={{
              transform: open ? "rotate(90deg)" : "none",
              transition: "transform 0.2s ease",
            }}
          />
          Waarom deze match?
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
            style={{ borderTop: `1px solid ${C.hairSoft}` }}
          >
            <RedenKolom
              titel="Spreekt voor je"
              tone={C.ok}
              Icon={Check}
              items={opdracht.redenen.plus}
            />
            <RedenKolom
              titel="Goed om te weten"
              tone={C.warn}
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
        className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-[0.1em]"
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
  const feiten = [
    { l: "Tarief", v: opdracht.tarief.replace(" / uur", ""), s: "per uur" },
    { l: "Omvang", v: opdracht.uren, s: "per week" },
    { l: "Start", v: opdracht.start, s: "beschikbaar" },
    { l: "Match", v: `${opdracht.match}%`, s: "op profiel" },
  ];
  return (
    <div className="space-y-6">
      <Btn variant="ghost" size="sm" onClick={onBack}>
        <ArrowLeft size={14} aria-hidden="true" /> Terug naar marktplaats
      </Btn>

      <Panel className="overflow-hidden" level={3}>
        <div className="p-6 md:p-8">
          <div
            className="flex items-center gap-2 text-[11px] font-semibold"
            style={{ color: C.inkFaint, ...mono }}
          >
            <span>{opdracht.id}</span>
            <span aria-hidden="true">·</span>
            <span>match {opdracht.match}%</span>
          </div>
          <h1
            className="mt-2.5 max-w-2xl text-[26px] font-bold leading-[1.12] tracking-[-0.02em] md:text-[30px]"
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
                className="rounded-full px-2.5 py-0.5 text-[11px] font-medium"
                style={{ background: C.sink, color: C.inkSoft }}
              >
                {t}
              </span>
            ))}
          </div>
          <div className="mt-5 flex flex-wrap gap-2.5">
            <Btn variant="solid">
              Reageer op opdracht <ArrowRight size={14} aria-hidden="true" />
            </Btn>
            <Btn variant="outline">Bewaren</Btn>
          </div>
        </div>

        <div
          className="grid grid-cols-2 sm:grid-cols-4"
          style={{ borderTop: `1px solid ${C.hairSoft}`, background: C.sink }}
        >
          {feiten.map((m, i) => (
            <div
              key={m.l}
              className="p-5"
              style={{
                borderRight: i < 3 ? `1px solid ${C.hair}` : "none",
                borderTop: i >= 2 ? `1px solid ${C.hair}` : "none",
              }}
            >
              <Eyebrow>{m.l}</Eyebrow>
              <p
                className="mt-1.5 text-[18px] font-bold leading-none"
                style={{ color: C.ink, ...mono }}
              >
                {m.v}
              </p>
              <p className="mt-1 text-[10.5px]" style={{ color: C.inkFaint }}>
                {m.s}
              </p>
            </div>
          ))}
        </div>
      </Panel>

      <Panel className="p-6 md:p-8" level={2}>
        <Eyebrow tone={C.accent}>Navolgbare match — geen verborgen score</Eyebrow>
        <p className="mt-2 max-w-xl text-[13.5px] leading-relaxed" style={{ color: C.inkMute }}>
          Afgezet tegen je geverifieerde profiel. Wat voor je spreekt en wat je vooraf wilt weten —
          alles zichtbaar.
        </p>
        <div className="mt-6 grid grid-cols-1 gap-6 md:grid-cols-2">
          <RedenDetail
            titel="Spreekt voor je"
            tone={C.ok}
            Icon={Check}
            items={opdracht.redenen.plus}
          />
          <RedenDetail
            titel="Goed om te weten"
            tone={C.warn}
            Icon={TriangleAlert}
            items={opdracht.redenen.min}
          />
        </div>
      </Panel>

      <Panel className="flex flex-col gap-4 p-6 sm:flex-row sm:items-center" level={1}>
        <ShieldCheck size={22} aria-hidden="true" style={{ color: C.ok }} />
        <div className="min-w-0 flex-1">
          <p className="text-[13.5px] font-bold" style={{ color: C.ink }}>
            Compliance in orde
          </p>
          <p className="mt-0.5 text-[12.5px]" style={{ color: C.inkMute }}>
            Je BIG-registratie en diploma dekken de vereiste certificaten voor deze opdracht.
          </p>
        </div>
        <StatusTag {...credTone("VERIFIED")} />
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
        className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.1em]"
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
        eyebrow="Verificatie"
        title="Je certificaten"
        sub={`${verified} van ${CREDENTIALS.length} geverifieerd · ${PROFIEL.trust}.`}
        right={
          <Panel className="px-4 py-2.5 text-right" level={2}>
            <p
              className="text-[26px] font-bold leading-none tracking-[-0.03em]"
              style={{ color: C.ok, ...mono }}
            >
              {ratio}%
            </p>
            <Eyebrow tone={C.ok}>geverifieerd</Eyebrow>
          </Panel>
        }
      />

      <Panel className="flex flex-wrap items-center gap-x-6 gap-y-3 p-5" level={2}>
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
      </Panel>

      <ul className="space-y-3">
        {CREDENTIALS.map((c) => {
          const t = credTone(c.status);
          const isOpen = open === c.naam;
          return (
            <li key={c.naam}>
              <Panel as="article" className="overflow-hidden" level={isOpen ? 3 : 1}>
                <button
                  type="button"
                  onClick={() => setOpen(isOpen ? null : c.naam)}
                  aria-expanded={isOpen}
                  className={`flex w-full items-center gap-3.5 px-5 py-4 text-left ${RING}`}
                >
                  <span
                    className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[11px]"
                    style={{ background: t.soft, color: t.base, boxShadow: E.e1 }}
                    aria-hidden="true"
                  >
                    <t.Icon size={18} />
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
                      className="px-5 pb-4 sm:pl-[74px]"
                      style={{ borderTop: `1px solid ${C.hairSoft}`, paddingTop: 12 }}
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
                        <Btn size="sm" variant="solid" tone={t.alarm ? t.base : C.accent}>
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
        eyebrow="Acties"
        title="Wat vraagt je aandacht"
        sub="De meest urgente actie ligt vooraan en het hoogst; de rest wacht een laag dieper."
      />
      <ol className="space-y-4">
        {ACTIES.map((a, i) => {
          const warn = a.urgentie === "warning";
          const tone = warn ? C.warn : C.accent;
          const goMarkt = a.cta.toLowerCase().includes("match");
          const goFacturen = a.cta.toLowerCase().includes("herinner");
          return (
            <li key={a.titel}>
              <Panel className="flex items-start gap-4 p-5" level={warn ? 3 : 1} hover>
                <span
                  className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[12px]"
                  style={{ background: `${tone}14`, color: tone, boxShadow: E.e1 }}
                  aria-hidden="true"
                >
                  {warn ? <TriangleAlert size={18} /> : <Sparkles size={18} />}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <Eyebrow tone={tone}>{warn ? "Urgent" : "Aanbevolen"}</Eyebrow>
                    <span
                      className="text-[10px] font-semibold"
                      style={{ color: C.inkFaint, ...mono }}
                    >
                      {String(i + 1).padStart(2, "0")} / {String(ACTIES.length).padStart(2, "0")}
                    </span>
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
        eyebrow="Facturen"
        title="Je facturatie"
        sub="Selecteer een regel om de opbouw naar de voorgrond te halen."
        right={
          <Btn variant="solid" size="sm">
            <Plus size={13} aria-hidden="true" /> Nieuwe factuur
          </Btn>
        }
      />

      <section className="grid grid-cols-1 gap-4 sm:grid-cols-3">
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
            tone: C.accent,
            Icon: FileText,
          },
        ].map((s) => (
          <Panel key={s.l} className="p-5" level={1} hover>
            <div className="flex items-center justify-between">
              <Eyebrow tone={s.tone}>{s.l}</Eyebrow>
              <s.Icon size={15} aria-hidden="true" style={{ color: s.tone }} />
            </div>
            <p
              className="mt-2 text-[23px] font-bold leading-none"
              style={{ color: C.ink, ...mono }}
            >
              {eur0.format(s.v)}
            </p>
            <p className="mt-1 text-[11.5px]" style={{ color: C.inkMute }}>
              {s.sub}
            </p>
          </Panel>
        ))}
      </section>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1.5fr_1fr]">
        <Panel className="overflow-hidden" level={2}>
          <div
            className="flex items-center justify-between px-5 py-4"
            style={{ borderBottom: `1px solid ${C.hairSoft}` }}
          >
            <span className="flex items-center gap-2">
              <Receipt size={15} aria-hidden="true" style={{ color: C.accent }} />
              <h2 className="text-[14px] font-bold" style={{ color: C.ink }}>
                Facturen
              </h2>
            </span>
            <div
              className="inline-flex items-center gap-1 rounded-[10px] p-1"
              role="group"
              aria-label="Facturen sorteren"
              style={{ background: C.sink }}
            >
              {(["datum", "bedrag"] as const).map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setSort(s)}
                  aria-pressed={sort === s}
                  className={`rounded-[7px] px-3 py-1 text-[12px] font-semibold transition-all ${RING}`}
                  style={
                    sort === s
                      ? { background: C.panel, color: C.ink, boxShadow: E.e1 }
                      : { color: C.inkMute }
                  }
                >
                  {s === "datum" ? "Datum" : "Bedrag"}
                </button>
              ))}
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left" style={{ minWidth: 460 }}>
              <caption className="sr-only">Overzicht van facturen</caption>
              <thead>
                <tr style={{ borderBottom: `1px solid ${C.hairSoft}` }}>
                  {["Nummer", "Klant", "Datum", "Bedrag", "Status"].map((h, i) => (
                    <th
                      key={h}
                      scope="col"
                      className={`px-4 py-2.5 text-[10px] font-bold uppercase tracking-[0.12em] ${i === 3 ? "text-right" : ""}`}
                      style={{ color: C.inkFaint }}
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
                      className={`vd-row cursor-pointer ${RING}`}
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
                        borderTop: `1px solid ${C.hairSoft}`,
                        background: on ? C.accentSoft : undefined,
                      }}
                    >
                      <td
                        className="px-4 py-3 text-[12px] font-bold"
                        style={{ color: on ? C.accentDeep : C.inkSoft, ...mono }}
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
    <Panel as="article" className="h-max overflow-hidden lg:sticky lg:top-6" level={3}>
      <div className="p-5" style={{ borderBottom: `1px solid ${C.hairSoft}` }}>
        <Eyebrow tone={t.base}>Opbouw factuur</Eyebrow>
        <p className="mt-1 text-[17px] font-bold" style={{ color: C.ink, ...mono }}>
          {factuur.nr}
        </p>
      </div>
      <div className="space-y-3 p-5 text-[12.5px]">
        <Row label="Klant" value={factuur.klant} />
        <Row label="Datum" value={factuur.datum} isMono />
        <div className="flex items-baseline justify-between">
          <span style={{ color: C.inkMute }}>Status</span>
          <span
            className="inline-flex items-center gap-1.5 font-semibold"
            style={{ color: t.base }}
          >
            <t.Icon size={12} aria-hidden="true" /> {t.label}
          </span>
        </div>
        <div className="my-3 h-px" style={{ background: C.hairSoft }} />
        <Row label="Subtotaal" value={eur0.format(subtotal)} isMono />
        <Row label="Btw 21%" value={eur0.format(btw)} isMono />
        <div className="my-3 h-px" style={{ background: C.hair }} />
        <div className="flex items-baseline justify-between">
          <span
            className="text-[12px] font-bold uppercase tracking-[0.1em]"
            style={{ color: C.ink }}
          >
            Totaal
          </span>
          <span className="text-[20px] font-bold" style={{ color: C.ink, ...mono }}>
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
      <span className="shrink-0" style={{ color: C.inkMute }}>
        {label}
      </span>
      <span
        className="min-w-0 flex-1 self-end border-b border-dotted"
        style={{ borderColor: C.hair }}
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
