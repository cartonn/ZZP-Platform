"use client";

// Concept 218 — "Middernacht" · premium product-dark. 2026-trend: strak, modern donker product (Linear/Vercel-niveau):
// diep blauw-zwart, subtiele 1px hairline-borders met lichte glow, elektrisch-indigo accent, hoge informatiedichtheid
// maar rustig, verfijnde hover-states en focusringen. Een schoon, ON-thematisch premium-dark — geen neon-gimmick, geen
// textuur — puur product-craft, keyboard-first. Micro-interactie: een subtiel command-menu (⌘K) overlay. Status altijd
// label + icoon, nooit alleen kleur. UI Nederlands, code Engels. Volledig deterministisch (geen random/Date/network/images).

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
  RefreshCw,
  BadgeCheck,
  Command,
  Bell,
  TrendingUp,
  CornerDownLeft,
  Bookmark,
  SlidersHorizontal,
  LayoutDashboard,
  Send,
  Circle,
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
  DOCUMENTEN,
  type ScreenKey,
  type CredStatus,
  type Opdracht,
} from "./mock";

// ── Palet — diep blauw-zwart, hairlines, indigo accent. ──
const C = {
  bg: "#0b0e14", // achtergrond
  bgDeep: "#080a10", // dieper (rand van scherm)
  panel: "#12161f", // paneel
  panelHi: "#161b26", // hover / opgetild paneel
  panelSoft: "#0f131b", // subtiel afwijkend
  line: "#1e2530", // hairline
  lineHi: "#2a3342", // sterkere hairline / hover
  ink: "#e6e9ef", // primaire tekst
  inkSoft: "#b6bdca", // secundaire tekst
  muted: "#8b93a3", // gedempt / labels
  faint: "#5b6373", // zeer gedempt
  indigo: "#6d8cff", // accent
  indigoDeep: "#4f6fe0", // dieper accent
  indigoBg: "#161d33", // indigo vlak
  indigoGlow: "#6d8cff", // glow-kleur
  ok: "#4ade80", // succes
  okBg: "#10241a",
  warn: "#fbbf24", // waarschuwing
  warnBg: "#2a2110",
  bad: "#f87171", // afwijzing
  badBg: "#2a1414",
  wait: "#6d8cff", // in behandeling
  waitBg: "#161d33",
};

const uiF = { fontFamily: "var(--font-lab-geist)" }; // Geist — UI
const monoF = { fontFamily: "var(--font-lab-geist-mono)" }; // Geist Mono — cijfers/keys

// hairline met subtiele glow
const hairline = `1px solid ${C.line}`;
const glowRing = `0 0 0 1px ${C.line}, 0 1px 2px rgba(0,0,0,0.4)`;

// ── Status-model — vorm + icoon + label; nooit kleur alleen. ──
type StatusStyle = { label: string; Icon: LucideIcon; fg: string; bg: string };
function credMeta(s: CredStatus): StatusStyle {
  switch (s) {
    case "VERIFIED":
      return { label: "Geverifieerd", Icon: BadgeCheck, fg: C.ok, bg: C.okBg };
    case "SUBMITTED":
      return { label: "In beoordeling", Icon: Clock, fg: C.wait, bg: C.waitBg };
    case "EXPIRING":
      return { label: "Verloopt binnenkort", Icon: TriangleAlert, fg: C.warn, bg: C.warnBg };
    case "REJECTED":
      return { label: "Afgewezen", Icon: XCircle, fg: C.bad, bg: C.badBg };
  }
}

function StatusTag({ status }: { status: CredStatus }) {
  const m = credMeta(status);
  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-[6px] px-2 py-1 text-[11px] font-medium"
      style={{ ...uiF, background: m.bg, color: m.fg, boxShadow: `inset 0 0 0 1px ${m.fg}33` }}
    >
      <m.Icon size={12} strokeWidth={2.2} aria-hidden="true" />
      {m.label}
    </span>
  );
}

// ── Deterministische sparkline (geen random) ──
function Spark({ data, color = C.indigo }: { data: number[]; color?: string }) {
  const w = 76;
  const h = 24;
  const min = Math.min(...data);
  const max = Math.max(...data);
  const span = max - min || 1;
  const pts = data.map((v, i) => {
    const x = (i / (data.length - 1)) * w;
    const y = h - ((v - min) / span) * h;
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  });
  const last = data[data.length - 1] ?? min;
  const lastY = h - ((last - min) / span) * h;
  return (
    <svg
      width={w}
      height={h}
      viewBox={`0 0 ${w} ${h}`}
      aria-hidden="true"
      className="overflow-visible"
    >
      <polyline points={`0,${h} ${pts.join(" ")} ${w},${h}`} fill={`${color}14`} stroke="none" />
      <polyline
        points={pts.join(" ")}
        fill="none"
        stroke={color}
        strokeWidth={1.75}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx={w} cy={lastY} r={2} fill={color} />
    </svg>
  );
}

// ── Paneel — donker vlak met hairline. ──
function Panel({
  children,
  className = "",
  style,
  as: Tag = "div",
}: {
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
  as?: "div" | "section" | "li";
}) {
  return (
    <Tag
      className={`rounded-[12px] ${className}`}
      style={{ background: C.panel, border: hairline, boxShadow: glowRing, ...style }}
    >
      {children}
    </Tag>
  );
}

// ── Keycap — mono toets voor keyboard-hints. ──
function Key({ children }: { children: React.ReactNode }) {
  return (
    <kbd
      className="inline-flex h-5 min-w-[20px] items-center justify-center rounded-[5px] px-1.5 text-[10.5px] font-medium leading-none"
      style={{
        ...monoF,
        background: C.panelHi,
        color: C.muted,
        boxShadow: `inset 0 0 0 1px ${C.line}`,
      }}
    >
      {children}
    </kbd>
  );
}

// ── Sectie-kop ──
function SectionHead({ title, sub, Icon }: { title: string; sub?: string; Icon: LucideIcon }) {
  return (
    <div className="flex items-center gap-3">
      <span
        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[9px]"
        style={{ background: C.indigoBg, boxShadow: `inset 0 0 0 1px ${C.indigo}33` }}
        aria-hidden="true"
      >
        <Icon size={16} strokeWidth={2} style={{ color: C.indigo }} />
      </span>
      <div className="min-w-0">
        <h2
          className="text-[16px] font-semibold leading-none tracking-[-0.01em]"
          style={{ ...uiF, color: C.ink }}
        >
          {title}
        </h2>
        {sub && (
          <p className="mt-1 text-[12px]" style={{ ...uiF, color: C.muted }}>
            {sub}
          </p>
        )}
      </div>
    </div>
  );
}

function Meta({ Icon, value }: { Icon: LucideIcon; value: string }) {
  return (
    <div className="flex items-center gap-1.5" style={{ color: C.inkSoft }}>
      <Icon size={13} strokeWidth={2} style={{ color: C.muted }} aria-hidden="true" />
      <span className="truncate text-[12.5px]" style={uiF}>
        {value}
      </span>
    </div>
  );
}

// ── Match-ring — deterministische SVG-donut. ──
function MatchRing({ value, size = 52 }: { value: number; size?: number }) {
  const r = (size - 6) / 2;
  const circ = 2 * Math.PI * r;
  const dash = (value / 100) * circ;
  return (
    <span
      className="relative inline-flex shrink-0 items-center justify-center"
      style={{ width: size, height: size }}
      aria-hidden="true"
    >
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={C.line} strokeWidth={3} />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={C.indigo}
          strokeWidth={3}
          strokeLinecap="round"
          strokeDasharray={`${dash.toFixed(1)} ${circ.toFixed(1)}`}
        />
      </svg>
      <span className="absolute inset-0 flex flex-col items-center justify-center">
        <span
          className="font-semibold tabular-nums leading-none"
          style={{ ...monoF, color: C.ink, fontSize: size * 0.28 }}
        >
          {value}
        </span>
      </span>
    </span>
  );
}

// ── Command-menu overlay (⌘K) — puur presentationeel. ──
function CommandMenu({ onClose, onNaar }: { onClose: () => void; onNaar: (s: ScreenKey) => void }) {
  const items: { label: string; hint: string; key: ScreenKey; Icon: LucideIcon }[] = [
    { label: "Ga naar Dashboard", hint: "Overzicht", key: "dashboard", Icon: LayoutDashboard },
    { label: "Open Marktplaats", hint: "Zoek opdrachten", key: "marktplaats", Icon: Search },
    { label: "Bekijk Verificatie", hint: "Certificaten", key: "verificatie", Icon: ShieldCheck },
    { label: "Toon Acties", hint: "Wat nu?", key: "acties", Icon: TriangleAlert },
    { label: "Open Facturen", hint: "Omzet", key: "facturen", Icon: Coins },
  ];
  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center px-4 pt-[12vh]"
      style={{ background: "rgba(4,6,10,0.66)", backdropFilter: "blur(3px)" }}
      role="dialog"
      aria-modal="true"
      aria-label="Commandomenu"
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg overflow-hidden rounded-[14px]"
        style={{
          background: C.panel,
          border: `1px solid ${C.lineHi}`,
          boxShadow: `0 0 0 1px ${C.indigo}22, 0 24px 60px rgba(0,0,0,0.6)`,
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-2.5 px-4 py-3.5" style={{ borderBottom: hairline }}>
          <Search size={16} strokeWidth={2} style={{ color: C.muted }} aria-hidden="true" />
          <input
            autoFocus
            placeholder="Typ een commando of zoek…"
            aria-label="Commando zoeken"
            className="flex-1 bg-transparent text-[14px] outline-none placeholder:opacity-60"
            style={{ ...uiF, color: C.ink }}
          />
          <button
            onClick={onClose}
            aria-label="Sluiten"
            className="rounded-[6px] px-1.5 py-0.5 focus-visible:outline-none focus-visible:ring-2"
            style={{ ["--tw-ring-color" as string]: C.indigo }}
          >
            <span className="text-[10.5px]" style={{ ...monoF, color: C.muted }}>
              esc
            </span>
          </button>
        </div>
        <ul className="max-h-[46vh] overflow-y-auto p-2">
          {items.map((it, i) => (
            <li key={it.key}>
              <button
                onClick={() => {
                  onNaar(it.key);
                  onClose();
                }}
                className="group flex w-full items-center gap-3 rounded-[9px] px-3 py-2.5 text-left transition-colors focus-visible:outline-none focus-visible:ring-2"
                style={{
                  background: i === 0 ? C.panelHi : "transparent",
                  ["--tw-ring-color" as string]: C.indigo,
                }}
                onMouseEnter={(e) => (e.currentTarget.style.background = C.panelHi)}
                onMouseLeave={(e) =>
                  (e.currentTarget.style.background = i === 0 ? C.panelHi : "transparent")
                }
              >
                <span
                  className="flex h-8 w-8 shrink-0 items-center justify-center rounded-[7px]"
                  style={{ background: C.indigoBg }}
                  aria-hidden="true"
                >
                  <it.Icon size={15} strokeWidth={2} style={{ color: C.indigo }} />
                </span>
                <div className="min-w-0 flex-1">
                  <div
                    className="truncate text-[13.5px] font-medium"
                    style={{ ...uiF, color: C.ink }}
                  >
                    {it.label}
                  </div>
                  <div className="truncate text-[11.5px]" style={{ ...uiF, color: C.muted }}>
                    {it.hint}
                  </div>
                </div>
                <CornerDownLeft
                  size={14}
                  strokeWidth={2}
                  className="shrink-0 opacity-0 transition-opacity group-hover:opacity-100"
                  style={{ color: C.muted }}
                  aria-hidden="true"
                />
              </button>
            </li>
          ))}
        </ul>
        <div
          className="flex items-center justify-between px-4 py-2.5"
          style={{ borderTop: hairline }}
        >
          <div className="flex items-center gap-2 text-[11px]" style={{ ...uiF, color: C.faint }}>
            <Key>↑</Key>
            <Key>↓</Key>
            <span>navigeer</span>
          </div>
          <div className="flex items-center gap-2 text-[11px]" style={{ ...uiF, color: C.faint }}>
            <Key>↵</Key>
            <span>selecteer</span>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Root ─────────────────────────────────────────────────────────────────────────
export function Concept218() {
  const [screen, setScreen] = useState<ScreenKey>("dashboard");
  const [cmd, setCmd] = useState(false);
  const active = OPDRACHTEN[0] as Opdracht;

  return (
    <div
      className="relative min-h-screen w-full overflow-x-hidden antialiased"
      style={{ ...uiF, background: C.bg, color: C.ink }}
    >
      {/* zeer subtiele indigo-halo bovenaan — geen textuur, alleen diepte */}
      <div
        className="pointer-events-none fixed inset-x-0 top-0 z-0 h-64"
        style={{
          background: `radial-gradient(60% 100% at 50% 0%, ${C.indigo}12, transparent 70%)`,
        }}
        aria-hidden="true"
      />

      {cmd && <CommandMenu onClose={() => setCmd(false)} onNaar={setScreen} />}

      <div className="relative z-10">
        {/* Kop */}
        <header
          className="sticky top-0 z-30"
          style={{ background: `${C.bg}e6`, backdropFilter: "blur(8px)", borderBottom: hairline }}
        >
          <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-4 py-3.5 md:px-8">
            <div className="flex items-center gap-3">
              <span
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[9px]"
                style={{
                  background: C.indigoBg,
                  boxShadow: `inset 0 0 0 1px ${C.indigo}44, 0 0 12px ${C.indigo}22`,
                }}
                aria-hidden="true"
              >
                <Circle size={16} strokeWidth={2.6} style={{ color: C.indigo }} fill={C.indigo} />
              </span>
              <div className="leading-tight">
                <div
                  className="text-[15px] font-semibold tracking-[-0.01em]"
                  style={{ ...uiF, color: C.ink }}
                >
                  Middernacht
                </div>
                <div className="text-[10.5px]" style={{ ...uiF, color: C.muted }}>
                  ZZP · werkomgeving
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {/* ⌘K-trigger */}
              <button
                onClick={() => setCmd(true)}
                className="hidden items-center gap-2 rounded-[9px] px-3 py-1.5 text-[12.5px] transition-colors focus-visible:outline-none focus-visible:ring-2 sm:inline-flex"
                style={{
                  background: C.panel,
                  color: C.muted,
                  boxShadow: `inset 0 0 0 1px ${C.line}`,
                  ["--tw-ring-color" as string]: C.indigo,
                }}
                onMouseEnter={(e) =>
                  (e.currentTarget.style.boxShadow = `inset 0 0 0 1px ${C.lineHi}`)
                }
                onMouseLeave={(e) =>
                  (e.currentTarget.style.boxShadow = `inset 0 0 0 1px ${C.line}`)
                }
                aria-label="Open commandomenu"
              >
                <Search size={14} strokeWidth={2} aria-hidden="true" />
                Zoek of spring…
                <span className="flex items-center gap-0.5">
                  <Key>⌘</Key>
                  <Key>K</Key>
                </span>
              </button>
              <button
                onClick={() => setCmd(true)}
                aria-label="Commandomenu"
                className="flex h-9 w-9 items-center justify-center rounded-[9px] transition-colors focus-visible:outline-none focus-visible:ring-2 sm:hidden"
                style={{
                  background: C.panel,
                  boxShadow: `inset 0 0 0 1px ${C.line}`,
                  ["--tw-ring-color" as string]: C.indigo,
                }}
              >
                <Command size={16} strokeWidth={2} style={{ color: C.muted }} aria-hidden="true" />
              </button>
              <button
                aria-label="Meldingen"
                className="relative flex h-9 w-9 items-center justify-center rounded-[9px] transition-colors focus-visible:outline-none focus-visible:ring-2"
                style={{
                  background: C.panel,
                  boxShadow: `inset 0 0 0 1px ${C.line}`,
                  ["--tw-ring-color" as string]: C.indigo,
                }}
              >
                <Bell size={16} strokeWidth={2} style={{ color: C.inkSoft }} aria-hidden="true" />
                <span
                  className="absolute right-1.5 top-1.5 h-1.5 w-1.5 rounded-full"
                  style={{ background: C.indigo, boxShadow: `0 0 6px ${C.indigo}` }}
                  aria-hidden="true"
                />
              </button>
              <span
                className="flex h-9 w-9 items-center justify-center rounded-[9px] text-[11px] font-semibold"
                style={{
                  ...uiF,
                  background: C.indigoBg,
                  color: C.indigo,
                  boxShadow: `inset 0 0 0 1px ${C.indigo}33`,
                }}
                aria-hidden="true"
              >
                {PROFIEL.initialen}
              </span>
            </div>
          </div>

          {/* Scherm-switcher */}
          <nav
            className="mx-auto flex max-w-6xl items-center gap-1 overflow-x-auto px-4 md:px-8"
            aria-label="Schermen"
          >
            {SCREENS.map((s) => {
              const on = s.key === screen;
              return (
                <button
                  key={s.key}
                  onClick={() => setScreen(s.key)}
                  aria-current={on ? "page" : undefined}
                  className="relative shrink-0 px-3 py-2.5 text-[13px] font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset"
                  style={{
                    ...uiF,
                    color: on ? C.ink : C.muted,
                    ["--tw-ring-color" as string]: C.indigo,
                  }}
                >
                  {s.label}
                  {on && (
                    <span
                      className="absolute inset-x-2 -bottom-px h-0.5 rounded-full"
                      style={{ background: C.indigo, boxShadow: `0 0 8px ${C.indigo}` }}
                      aria-hidden="true"
                    />
                  )}
                </button>
              );
            })}
          </nav>
        </header>

        <main className="mx-auto max-w-6xl px-4 py-6 md:px-8 md:py-8">
          {screen === "dashboard" && (
            <Dashboard
              onOpen={() => setScreen("opdracht")}
              onActies={() => setScreen("acties")}
              onCmd={() => setCmd(true)}
            />
          )}
          {screen === "marktplaats" && <Marktplaats onOpen={() => setScreen("opdracht")} />}
          {screen === "opdracht" && (
            <OpdrachtDetail opdracht={active} onBack={() => setScreen("marktplaats")} />
          )}
          {screen === "verificatie" && <Verificatie />}
          {screen === "acties" && <Acties onNaar={setScreen} />}
          {screen === "facturen" && <Facturen />}
        </main>

        <footer className="mx-auto max-w-6xl px-4 pb-12 md:px-8">
          <div
            className="flex flex-wrap items-center justify-center gap-2 pt-6 text-[11.5px]"
            style={{ ...uiF, color: C.faint, borderTop: hairline }}
          >
            <span className="mt-6 flex items-center gap-2">
              Middernacht — premium product-dark · druk op
              <span className="flex items-center gap-0.5">
                <Key>⌘</Key>
                <Key>K</Key>
              </span>
              om te navigeren.
            </span>
          </div>
        </footer>
      </div>
    </div>
  );
}

// ── Dashboard ──────────────────────────────────────────────────────────────────
function Dashboard({
  onOpen,
  onActies,
  onCmd,
}: {
  onOpen: () => void;
  onActies: () => void;
  onCmd: () => void;
}) {
  const verified = CREDENTIALS.filter((c) => c.status === "VERIFIED").length;
  const dek = Math.round((verified / CREDENTIALS.length) * 100);
  const warn = (ACTIES.find((a) => a.urgentie === "warning") ??
    ACTIES[0]) as (typeof ACTIES)[number];

  return (
    <div className="space-y-7">
      {/* Hero */}
      <Panel className="relative overflow-hidden">
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            background: `radial-gradient(80% 120% at 100% 0%, ${C.indigo}18, transparent 60%)`,
          }}
          aria-hidden="true"
        />
        <div className="relative flex flex-col gap-6 p-6 sm:p-8 lg:flex-row lg:items-center lg:justify-between">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <span
                className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-medium"
                style={{
                  ...uiF,
                  background: C.indigoBg,
                  color: C.indigo,
                  boxShadow: `inset 0 0 0 1px ${C.indigo}33`,
                }}
              >
                <Star size={11} strokeWidth={2.2} aria-hidden="true" /> {PROFIEL.rol}
              </span>
              <span className="text-[11.5px]" style={{ ...uiF, color: C.muted }}>
                {PROFIEL.plaats}
              </span>
            </div>
            <h1
              className="mt-4 text-[30px] font-semibold leading-[1.08] tracking-[-0.02em] sm:text-[38px]"
              style={{ ...uiF, color: C.ink }}
            >
              Drie sterke matches,
              <br />
              <span style={{ color: C.indigo }}>één ding</span> vraagt aandacht.
            </h1>
            <p
              className="mt-3 max-w-lg text-[14px] leading-relaxed"
              style={{ ...uiF, color: C.inkSoft }}
            >
              Je VOG verloopt binnenkort. Los de markering op en houd je profiel volledig
              verifieerbaar voor opdrachtgevers.
            </p>
            <div className="mt-6 flex flex-wrap gap-2.5">
              <button
                onClick={onOpen}
                className="inline-flex items-center gap-2 rounded-[9px] px-4 py-2.5 text-[13px] font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
                style={{
                  ...uiF,
                  background: C.indigo,
                  color: C.bgDeep,
                  boxShadow: `0 0 16px ${C.indigo}44`,
                  ["--tw-ring-color" as string]: C.indigo,
                  ["--tw-ring-offset-color" as string]: C.panel,
                }}
                onMouseEnter={(e) => (e.currentTarget.style.background = C.indigoDeep)}
                onMouseLeave={(e) => (e.currentTarget.style.background = C.indigo)}
              >
                Bekijk matches <ArrowRight size={15} strokeWidth={2.2} aria-hidden="true" />
              </button>
              <button
                onClick={onActies}
                className="inline-flex items-center gap-2 rounded-[9px] px-4 py-2.5 text-[13px] font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
                style={{
                  ...uiF,
                  background: C.panelHi,
                  color: C.ink,
                  boxShadow: `inset 0 0 0 1px ${C.line}`,
                  ["--tw-ring-color" as string]: C.indigo,
                  ["--tw-ring-offset-color" as string]: C.panel,
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
              <button
                onClick={onCmd}
                className="inline-flex items-center gap-2 rounded-[9px] px-3 py-2.5 text-[12.5px] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
                style={{
                  ...uiF,
                  color: C.muted,
                  ["--tw-ring-color" as string]: C.indigo,
                  ["--tw-ring-offset-color" as string]: C.panel,
                }}
              >
                <Command size={13} strokeWidth={2} aria-hidden="true" />
                <span className="flex items-center gap-0.5">
                  <Key>⌘</Key>
                  <Key>K</Key>
                </span>
              </button>
            </div>
          </div>

          {/* Vertrouwens-ring */}
          <div className="shrink-0">
            <div
              className="flex items-center gap-4 rounded-[12px] p-4"
              style={{ background: C.panelSoft, boxShadow: `inset 0 0 0 1px ${C.line}` }}
            >
              <MatchRing value={dek} size={68} />
              <div className="min-w-0">
                <div className="text-[12px]" style={{ ...uiF, color: C.muted }}>
                  Certificaat-dekking
                </div>
                <div
                  className="mt-0.5 text-[20px] font-semibold tabular-nums"
                  style={{ ...uiF, color: C.ink }}
                >
                  {verified}/{CREDENTIALS.length}
                </div>
                <div className="mt-1.5">
                  <StatusTag status="VERIFIED" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </Panel>

      {/* KPI-rij */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {KPIS.map((k) => (
          <Panel key={k.label} className="p-4">
            <div className="flex items-start justify-between gap-2">
              <span className="text-[11.5px]" style={{ ...uiF, color: C.muted }}>
                {k.label}
              </span>
              <span
                className="inline-flex items-center gap-0.5 rounded-[5px] px-1.5 py-0.5 text-[10.5px] font-medium tabular-nums"
                style={{
                  ...uiF,
                  background: k.up ? C.okBg : C.panelHi,
                  color: k.up ? C.ok : C.muted,
                }}
              >
                {k.up ? (
                  <TrendingUp size={10} strokeWidth={2.4} aria-hidden="true" />
                ) : (
                  <Clock size={10} strokeWidth={2.4} aria-hidden="true" />
                )}
                {k.trend}
              </span>
            </div>
            <div className="mt-2 flex items-end justify-between gap-2">
              <div
                className="text-[24px] font-semibold tabular-nums leading-none tracking-[-0.02em]"
                style={{ ...uiF, color: C.ink }}
              >
                {k.value}
              </div>
              <Spark data={k.spark} />
            </div>
          </Panel>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-7 lg:grid-cols-[1.6fr_1fr]">
        {/* Aanbevolen matches */}
        <section className="space-y-3.5">
          <SectionHead
            title="Aanbevolen"
            sub="Opdrachten op match gerangschikt"
            Icon={TrendingUp}
          />
          <Panel className="overflow-hidden">
            {OPDRACHTEN.map((o, i) => (
              <button
                key={o.id}
                onClick={onOpen}
                className="flex w-full items-center gap-4 px-4 py-4 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset"
                style={{
                  borderTop: i === 0 ? undefined : hairline,
                  ["--tw-ring-color" as string]: C.indigo,
                }}
                onMouseEnter={(e) => (e.currentTarget.style.background = C.panelHi)}
                onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
              >
                <MatchRing value={o.match} />
                <div className="min-w-0 flex-1">
                  <div
                    className="truncate text-[14.5px] font-medium tracking-[-0.01em]"
                    style={{ ...uiF, color: C.ink }}
                  >
                    {o.titel}
                  </div>
                  <div className="mt-0.5 truncate text-[12.5px]" style={{ ...uiF, color: C.muted }}>
                    {o.opdrachtgever} · {o.plaats} · {o.tarief}
                  </div>
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {o.redenen.plus.slice(0, 2).map((r) => (
                      <span
                        key={r}
                        className="inline-flex items-center gap-1 rounded-[5px] px-1.5 py-0.5 text-[11px]"
                        style={{ ...uiF, background: C.okBg, color: C.ok }}
                      >
                        <Check size={10} strokeWidth={2.6} aria-hidden="true" /> {r}
                      </span>
                    ))}
                  </div>
                </div>
                <ChevronRight
                  size={17}
                  strokeWidth={2}
                  className="shrink-0"
                  style={{ color: C.faint }}
                  aria-hidden="true"
                />
              </button>
            ))}
          </Panel>
        </section>

        {/* Rechterkolom */}
        <section className="space-y-3.5">
          <SectionHead title="Prioriteit" sub="Wat nu?" Icon={TriangleAlert} />
          <Panel className="relative overflow-hidden p-5">
            <div
              className="pointer-events-none absolute inset-0"
              style={{
                background: `radial-gradient(80% 100% at 100% 0%, ${C.warn}10, transparent 60%)`,
              }}
              aria-hidden="true"
            />
            <div className="relative">
              <span
                className="inline-flex items-center gap-1.5 rounded-[6px] px-2 py-1 text-[11px] font-medium"
                style={{
                  ...uiF,
                  background: C.warnBg,
                  color: C.warn,
                  boxShadow: `inset 0 0 0 1px ${C.warn}33`,
                }}
              >
                <TriangleAlert size={11} strokeWidth={2.2} aria-hidden="true" /> Urgent
              </span>
              <h3
                className="mt-3 text-[16px] font-semibold leading-tight tracking-[-0.01em]"
                style={{ ...uiF, color: C.ink }}
              >
                {warn.titel}
              </h3>
              <p
                className="mt-1.5 text-[12.5px] leading-relaxed"
                style={{ ...uiF, color: C.inkSoft }}
              >
                {warn.detail}
              </p>
              <button
                onClick={onActies}
                className="mt-4 inline-flex items-center gap-2 rounded-[9px] px-3.5 py-2 text-[12.5px] font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
                style={{
                  ...uiF,
                  background: C.indigo,
                  color: C.bgDeep,
                  ["--tw-ring-color" as string]: C.indigo,
                  ["--tw-ring-offset-color" as string]: C.panel,
                }}
                onMouseEnter={(e) => (e.currentTarget.style.background = C.indigoDeep)}
                onMouseLeave={(e) => (e.currentTarget.style.background = C.indigo)}
              >
                {warn.cta} <ArrowRight size={14} strokeWidth={2.2} aria-hidden="true" />
              </button>
            </div>
          </Panel>

          {/* Berichten */}
          <Panel className="overflow-hidden">
            <div
              className="flex items-center justify-between px-4 py-3"
              style={{ borderBottom: hairline }}
            >
              <span className="text-[13px] font-medium" style={{ ...uiF, color: C.ink }}>
                Berichten
              </span>
              <span
                className="rounded-full px-1.5 py-0.5 text-[10.5px] font-medium"
                style={{ ...uiF, background: C.indigoBg, color: C.indigo }}
              >
                2 nieuw
              </span>
            </div>
            {BERICHTEN.slice(0, 2).map((b, i) => (
              <div
                key={b.van}
                className="flex items-center gap-3 px-4 py-3"
                style={{ borderTop: i === 0 ? undefined : hairline }}
              >
                <span
                  className="flex h-8 w-8 shrink-0 items-center justify-center rounded-[8px] text-[11px] font-semibold"
                  style={{
                    ...uiF,
                    background: C.panelHi,
                    color: C.inkSoft,
                    boxShadow: `inset 0 0 0 1px ${C.line}`,
                  }}
                  aria-hidden="true"
                >
                  {b.initialen}
                </span>
                <div className="min-w-0 flex-1">
                  <div
                    className="truncate text-[12.5px] font-medium"
                    style={{ ...uiF, color: C.ink }}
                  >
                    {b.van}
                  </div>
                  <p className="truncate text-[11.5px]" style={{ ...uiF, color: C.muted }}>
                    {b.preview}
                  </p>
                </div>
                {b.ongelezen && (
                  <span
                    className="h-1.5 w-1.5 shrink-0 rounded-full"
                    style={{ background: C.indigo, boxShadow: `0 0 6px ${C.indigo}` }}
                    aria-label="Ongelezen"
                  />
                )}
              </div>
            ))}
          </Panel>
        </section>
      </div>
    </div>
  );
}

// ── Marktplaats — zoek, filter, skeleton, empty- én foutstate ─────────────
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
        <SectionHead title="Marktplaats" sub="Open opdrachten in de zorg" Icon={Search} />
        <div className="flex items-center gap-2">
          <div
            className="flex items-center gap-2 rounded-[9px] px-3 py-2"
            style={{ background: C.panel, boxShadow: `inset 0 0 0 1px ${C.line}` }}
          >
            <Search size={15} strokeWidth={2} style={{ color: C.muted }} aria-hidden="true" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Zoek opdracht of plaats…"
              aria-label="Opdrachten zoeken"
              className="w-36 bg-transparent text-[12.5px] outline-none placeholder:opacity-60 sm:w-44"
              style={{ ...uiF, color: C.ink }}
            />
          </div>
          <button
            aria-label="Filteren"
            className="flex h-9 w-9 items-center justify-center rounded-[9px] transition-colors focus-visible:outline-none focus-visible:ring-2"
            style={{
              background: C.panel,
              boxShadow: `inset 0 0 0 1px ${C.line}`,
              ["--tw-ring-color" as string]: C.indigo,
            }}
          >
            <SlidersHorizontal
              size={15}
              strokeWidth={2}
              style={{ color: C.inkSoft }}
              aria-hidden="true"
            />
          </button>
          <button
            onClick={refresh}
            aria-label="Opnieuw laden"
            className="flex h-9 w-9 items-center justify-center rounded-[9px] transition-colors focus-visible:outline-none focus-visible:ring-2"
            style={{
              background: C.panel,
              boxShadow: `inset 0 0 0 1px ${C.line}`,
              ["--tw-ring-color" as string]: C.indigo,
            }}
          >
            <RefreshCw
              size={15}
              strokeWidth={2}
              className={loading ? "animate-spin" : ""}
              style={{ color: C.inkSoft }}
              aria-hidden="true"
            />
          </button>
        </div>
      </div>

      {/* Foutstrook */}
      {error && (
        <div
          className="flex items-start gap-3 rounded-[12px] p-4"
          role="alert"
          style={{ background: C.badBg, boxShadow: `inset 0 0 0 1px ${C.bad}44` }}
        >
          <XCircle size={18} strokeWidth={2.2} style={{ color: C.bad }} aria-hidden="true" />
          <div className="min-w-0 flex-1">
            <div className="text-[13.5px] font-semibold" style={{ ...uiF, color: C.ink }}>
              Niet alles geladen
            </div>
            <p className="mt-0.5 text-[12.5px]" style={{ ...uiF, color: C.inkSoft }}>
              Een deel van de opdrachten ontbreekt. Probeer het opnieuw te laden.
            </p>
          </div>
          <button
            onClick={() => setError(false)}
            className="shrink-0 rounded-[7px] px-2.5 py-1 text-[11.5px] font-medium transition-colors focus-visible:outline-none focus-visible:ring-2"
            style={{
              ...uiF,
              color: C.bad,
              boxShadow: `inset 0 0 0 1px ${C.bad}44`,
              ["--tw-ring-color" as string]: C.bad,
            }}
          >
            Sluiten
          </button>
        </div>
      )}

      {loading ? (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {[0, 1, 2].map((i) => (
            <Panel key={i} className="p-4">
              <div className="flex items-center gap-3">
                <span
                  className="h-12 w-12 shrink-0 animate-pulse rounded-full"
                  style={{ background: C.panelHi }}
                />
                <div className="flex-1 space-y-2">
                  <span
                    className="block h-3.5 w-3/4 animate-pulse rounded"
                    style={{ background: C.panelHi }}
                  />
                  <span
                    className="block h-3 w-1/2 animate-pulse rounded"
                    style={{ background: C.panelHi }}
                  />
                </div>
              </div>
              <div className="mt-4 space-y-2">
                <span
                  className="block h-3 w-full animate-pulse rounded"
                  style={{ background: C.panelHi }}
                />
                <span
                  className="block h-3 w-5/6 animate-pulse rounded"
                  style={{ background: C.panelHi }}
                />
              </div>
            </Panel>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <Panel className="flex flex-col items-center justify-center gap-3 p-16 text-center">
          <span
            className="flex h-14 w-14 items-center justify-center rounded-[12px]"
            style={{ background: C.indigoBg, boxShadow: `inset 0 0 0 1px ${C.indigo}33` }}
            aria-hidden="true"
          >
            <Search size={26} strokeWidth={1.8} style={{ color: C.indigo }} />
          </span>
          <p className="text-[17px] font-semibold" style={{ ...uiF, color: C.ink }}>
            Niets gevonden
          </p>
          <p className="max-w-xs text-[13px]" style={{ ...uiF, color: C.muted }}>
            Geen opdracht voor &ldquo;{q}&rdquo;. Pas je zoekterm aan om meer resultaten te zien.
          </p>
          <button
            onClick={() => setQ("")}
            className="mt-1 rounded-[9px] px-4 py-2 text-[12.5px] font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
            style={{
              ...uiF,
              background: C.indigo,
              color: C.bgDeep,
              ["--tw-ring-color" as string]: C.indigo,
              ["--tw-ring-offset-color" as string]: C.panel,
            }}
          >
            Zoekterm wissen
          </button>
        </Panel>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {filtered.map((o) => (
            <Panel
              key={o.id}
              className="group flex flex-col overflow-hidden transition-colors"
              style={{}}
            >
              <div
                className="flex items-center justify-between gap-3 px-4 py-3"
                style={{ borderBottom: hairline }}
              >
                <span className="text-[11px] tabular-nums" style={{ ...monoF, color: C.muted }}>
                  {o.id}
                </span>
                <span
                  className="inline-flex items-center gap-1 text-[11px]"
                  style={{ ...uiF, color: C.indigo }}
                >
                  <MatchRing value={o.match} size={26} />
                  match
                </span>
              </div>
              <div className="p-4">
                <h3
                  className="text-[15px] font-semibold leading-tight tracking-[-0.01em]"
                  style={{ ...uiF, color: C.ink }}
                >
                  {o.titel}
                </h3>
                <p className="mt-0.5 text-[12px]" style={{ ...uiF, color: C.muted }}>
                  {o.opdrachtgever}
                </p>
                <dl className="mt-3 grid grid-cols-2 gap-y-2">
                  <Meta Icon={MapPin} value={o.plaats} />
                  <Meta Icon={Coins} value={o.tarief} />
                  <Meta Icon={Clock} value={o.uren} />
                  <Meta Icon={CalendarDays} value={o.start} />
                </dl>
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {o.tags.map((t) => (
                    <span
                      key={t}
                      className="rounded-[5px] px-2 py-0.5 text-[10.5px]"
                      style={{
                        ...uiF,
                        background: C.panelHi,
                        color: C.inkSoft,
                        boxShadow: `inset 0 0 0 1px ${C.line}`,
                      }}
                    >
                      {t}
                    </span>
                  ))}
                </div>
              </div>
              <button
                onClick={onOpen}
                className="mt-auto flex items-center justify-center gap-2 py-3 text-[12.5px] font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset"
                style={{
                  ...uiF,
                  borderTop: hairline,
                  color: C.indigo,
                  ["--tw-ring-color" as string]: C.indigo,
                }}
                onMouseEnter={(e) => (e.currentTarget.style.background = C.panelHi)}
                onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
              >
                Bekijk opdracht <ArrowRight size={14} strokeWidth={2.2} aria-hidden="true" />
              </button>
            </Panel>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Opdracht-detail ──────────────────────────────────────────────────────────────
function OpdrachtDetail({ opdracht, onBack }: { opdracht: Opdracht; onBack: () => void }) {
  const [reageer, setReageer] = useState(false);
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
        className="inline-flex items-center gap-1.5 rounded-[9px] px-3 py-1.5 text-[12.5px] font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
        style={{
          ...uiF,
          background: C.panel,
          color: C.inkSoft,
          boxShadow: `inset 0 0 0 1px ${C.line}`,
          ["--tw-ring-color" as string]: C.indigo,
          ["--tw-ring-offset-color" as string]: C.bg,
        }}
      >
        <ArrowLeft size={14} strokeWidth={2.2} aria-hidden="true" /> Terug naar marktplaats
      </button>

      <Panel className="relative overflow-hidden">
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            background: `radial-gradient(70% 120% at 100% 0%, ${C.indigo}1c, transparent 60%)`,
          }}
          aria-hidden="true"
        />
        <div className="relative flex flex-wrap items-center justify-between gap-5 p-6 sm:p-8">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <span
                className="rounded-[6px] px-2 py-1 text-[11px] tabular-nums"
                style={{
                  ...monoF,
                  background: C.panelHi,
                  color: C.indigo,
                  boxShadow: `inset 0 0 0 1px ${C.indigo}33`,
                }}
              >
                {opdracht.id}
              </span>
              <span className="text-[11.5px]" style={{ ...uiF, color: C.muted }}>
                Start {opdracht.start}
              </span>
            </div>
            <h1
              className="mt-3 max-w-2xl text-[24px] font-semibold leading-[1.1] tracking-[-0.02em] sm:text-[30px]"
              style={{ ...uiF, color: C.ink }}
            >
              {opdracht.titel}
            </h1>
            <p className="mt-2 text-[13.5px]" style={{ ...uiF, color: C.inkSoft }}>
              {opdracht.opdrachtgever} · {opdracht.plaats}
            </p>
          </div>
          <div className="flex flex-col items-center gap-1">
            <MatchRing value={opdracht.match} size={84} />
            <span className="text-[11px]" style={{ ...uiF, color: C.muted }}>
              match
            </span>
          </div>
        </div>
      </Panel>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {feiten.map((f) => (
          <Panel key={f.l} className="p-4">
            <span
              className="flex h-8 w-8 items-center justify-center rounded-[8px]"
              style={{ background: C.indigoBg }}
              aria-hidden="true"
            >
              <f.Icon size={15} strokeWidth={2} style={{ color: C.indigo }} />
            </span>
            <div
              className="mt-3 text-[15px] font-semibold tabular-nums leading-none tracking-[-0.01em]"
              style={{ ...uiF, color: C.ink }}
            >
              {f.v}
            </div>
            <div className="mt-1.5 text-[11px]" style={{ ...uiF, color: C.muted }}>
              {f.l}
            </div>
          </Panel>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <section className="space-y-3">
          <SectionHead title="Waarom dit past" Icon={Check} />
          <Panel className="p-5">
            <ul className="space-y-3">
              {opdracht.redenen.plus.map((r) => (
                <li
                  key={r}
                  className="flex items-start gap-2.5 text-[13.5px] leading-snug"
                  style={{ ...uiF, color: C.inkSoft }}
                >
                  <span
                    className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-[6px]"
                    style={{ background: C.okBg }}
                    aria-hidden="true"
                  >
                    <Check size={12} strokeWidth={2.6} style={{ color: C.ok }} />
                  </span>
                  {r}
                </li>
              ))}
            </ul>
          </Panel>
        </section>
        <section className="space-y-3">
          <SectionHead title="Om te overwegen" Icon={TriangleAlert} />
          <Panel className="p-5">
            <ul className="space-y-3">
              {opdracht.redenen.min.map((r) => (
                <li
                  key={r}
                  className="flex items-start gap-2.5 text-[13.5px] leading-snug"
                  style={{ ...uiF, color: C.inkSoft }}
                >
                  <span
                    className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-[6px]"
                    style={{ background: C.warnBg }}
                    aria-hidden="true"
                  >
                    <TriangleAlert size={11} strokeWidth={2.4} style={{ color: C.warn }} />
                  </span>
                  {r}
                </li>
              ))}
            </ul>
          </Panel>
        </section>
      </div>

      {reageer && (
        <div
          className="flex items-center gap-3 rounded-[12px] p-4"
          style={{ background: C.okBg, boxShadow: `inset 0 0 0 1px ${C.ok}33` }}
        >
          <BadgeCheck size={18} strokeWidth={2.2} style={{ color: C.ok }} aria-hidden="true" />
          <div className="min-w-0 flex-1">
            <div className="text-[13.5px] font-semibold" style={{ ...uiF, color: C.ink }}>
              Reactie verstuurd
            </div>
            <p className="text-[12.5px]" style={{ ...uiF, color: C.inkSoft }}>
              {opdracht.opdrachtgever} ontvangt je profiel. Gemiddelde reactietijd: 6 uur.
            </p>
          </div>
        </div>
      )}

      <div className="flex flex-col gap-2.5 sm:flex-row">
        <button
          onClick={() => setReageer(true)}
          className="flex flex-1 items-center justify-center gap-2 rounded-[10px] px-6 py-3.5 text-[13px] font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
          style={{
            ...uiF,
            background: C.indigo,
            color: C.bgDeep,
            boxShadow: `0 0 18px ${C.indigo}44`,
            ["--tw-ring-color" as string]: C.indigo,
            ["--tw-ring-offset-color" as string]: C.bg,
          }}
          onMouseEnter={(e) => (e.currentTarget.style.background = C.indigoDeep)}
          onMouseLeave={(e) => (e.currentTarget.style.background = C.indigo)}
        >
          {reageer ? "Reactie verstuurd" : "Reageer op deze opdracht"}{" "}
          <ArrowRight size={16} strokeWidth={2.2} aria-hidden="true" />
        </button>
        <button
          className="flex items-center justify-center gap-2 rounded-[10px] px-6 py-3.5 text-[13px] font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
          style={{
            ...uiF,
            background: C.panelHi,
            color: C.ink,
            boxShadow: `inset 0 0 0 1px ${C.line}`,
            ["--tw-ring-color" as string]: C.indigo,
            ["--tw-ring-offset-color" as string]: C.bg,
          }}
        >
          <Bookmark size={15} strokeWidth={2} style={{ color: C.muted }} aria-hidden="true" />{" "}
          Bewaar
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
        <SectionHead title="Verificatie" sub="Certificaten & documenten" Icon={ShieldCheck} />
        <button
          className="inline-flex items-center gap-2 rounded-[9px] px-3.5 py-2 text-[12.5px] font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
          style={{
            ...uiF,
            background: C.indigo,
            color: C.bgDeep,
            ["--tw-ring-color" as string]: C.indigo,
            ["--tw-ring-offset-color" as string]: C.bg,
          }}
          onMouseEnter={(e) => (e.currentTarget.style.background = C.indigoDeep)}
          onMouseLeave={(e) => (e.currentTarget.style.background = C.indigo)}
        >
          <Plus size={14} strokeWidth={2.2} aria-hidden="true" /> Toevoegen
        </button>
      </div>

      <Panel className="relative overflow-hidden">
        <div
          className="pointer-events-none absolute inset-0"
          style={{ background: `radial-gradient(70% 120% at 0% 0%, ${C.ok}12, transparent 55%)` }}
          aria-hidden="true"
        />
        <div className="relative flex flex-wrap items-center gap-6 p-6">
          <MatchRing value={dek} size={84} />
          <div className="max-w-sm">
            <div
              className="text-[19px] font-semibold tracking-[-0.01em]"
              style={{ ...uiF, color: C.ink }}
            >
              {verified}/{CREDENTIALS.length} geverifieerd
            </div>
            <p className="mt-1 text-[13px] leading-relaxed" style={{ ...uiF, color: C.inkSoft }}>
              Elk geverifieerd certificaat maakt je profiel betrouwbaar. Houd je dekking hoog en
              blijf volledig zichtbaar voor opdrachtgevers.
            </p>
            <span
              className="mt-3 inline-flex items-center gap-1.5 rounded-[6px] px-2.5 py-1 text-[11.5px] font-medium"
              style={{
                ...uiF,
                background: C.okBg,
                color: C.ok,
                boxShadow: `inset 0 0 0 1px ${C.ok}33`,
              }}
            >
              <BadgeCheck size={13} strokeWidth={2.2} aria-hidden="true" /> {PROFIEL.trust}
            </span>
          </div>
        </div>
      </Panel>

      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
        {CREDENTIALS.map((c) => {
          const m = credMeta(c.status);
          const actionable = c.status !== "VERIFIED";
          return (
            <Panel key={c.naam} className="flex items-center gap-3.5 p-4">
              <span
                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[10px]"
                style={{ background: m.bg, boxShadow: `inset 0 0 0 1px ${m.fg}33` }}
                aria-hidden="true"
              >
                <m.Icon size={20} strokeWidth={2} style={{ color: m.fg }} />
              </span>
              <div className="min-w-0 flex-1">
                <div
                  className="truncate text-[14px] font-medium tracking-[-0.01em]"
                  style={{ ...uiF, color: C.ink }}
                >
                  {c.naam}
                </div>
                <div className="mt-0.5 text-[12px]" style={{ ...uiF, color: C.muted }}>
                  {c.detail}
                </div>
                <div className="mt-2 flex flex-wrap items-center gap-2">
                  <StatusTag status={c.status} />
                  {actionable && (
                    <button
                      className="rounded-[7px] px-2.5 py-1 text-[11px] font-medium transition-colors focus-visible:outline-none focus-visible:ring-2"
                      style={{
                        ...uiF,
                        background: C.panelHi,
                        color: C.inkSoft,
                        boxShadow: `inset 0 0 0 1px ${C.line}`,
                        ["--tw-ring-color" as string]: C.indigo,
                      }}
                    >
                      {c.status === "EXPIRING"
                        ? "Vernieuwen"
                        : c.status === "REJECTED"
                          ? "Opnieuw"
                          : "Bekijk"}
                    </button>
                  )}
                </div>
              </div>
            </Panel>
          );
        })}
      </div>

      {/* Documenten */}
      <section className="space-y-3">
        <SectionHead title="Documenten" sub="Veilig opgeslagen, standaard privé" Icon={FileText} />
        <Panel className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[520px] text-left">
              <thead>
                <tr style={{ borderBottom: hairline }}>
                  {["Document", "Type", "Grootte", "Status", "Bijgewerkt"].map((h) => (
                    <th
                      key={h}
                      className="px-4 py-2.5 text-[10.5px] font-medium uppercase tracking-[0.04em]"
                      style={{ ...uiF, color: C.faint }}
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {DOCUMENTEN.map((d, i) => (
                  <tr key={d.naam} style={{ borderTop: i === 0 ? undefined : hairline }}>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2.5">
                        <span
                          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-[7px]"
                          style={{ background: C.panelHi }}
                          aria-hidden="true"
                        >
                          <FileText size={14} strokeWidth={2} style={{ color: C.muted }} />
                        </span>
                        <span className="text-[13px] font-medium" style={{ ...uiF, color: C.ink }}>
                          {d.naam}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-[12px]" style={{ ...uiF, color: C.inkSoft }}>
                      {d.type}
                    </td>
                    <td
                      className="px-4 py-3 text-[12px] tabular-nums"
                      style={{ ...monoF, color: C.muted }}
                    >
                      {d.grootte}
                    </td>
                    <td className="px-4 py-3">
                      <StatusTag status={d.status} />
                    </td>
                    <td
                      className="px-4 py-3 text-[12px] tabular-nums"
                      style={{ ...monoF, color: C.muted }}
                    >
                      {d.bijgewerkt}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Panel>
      </section>
    </div>
  );
}

// ── Acties (next-action) ─────────────────────────────────────────────────────────
function Acties({ onNaar }: { onNaar: (s: ScreenKey) => void }) {
  const sorted = [...ACTIES].sort((a, b) =>
    a.urgentie === b.urgentie ? 0 : a.urgentie === "warning" ? -1 : 1,
  );
  const naar: Record<string, ScreenKey> = {
    "VOG vernieuwen": "verificatie",
    "Bekijk matches": "marktplaats",
    "Herinnering sturen": "facturen",
  };
  return (
    <div className="space-y-6">
      <SectionHead
        title="Acties"
        sub="Op urgentie gerangschikt — pak de bovenste eerst"
        Icon={TriangleAlert}
      />

      <ol className="space-y-3">
        {sorted.map((a, i) => {
          const warn = a.urgentie === "warning";
          return (
            <Panel key={a.titel} as="li" className="flex items-stretch overflow-hidden">
              <span
                className="w-1 shrink-0"
                style={{
                  background: warn ? C.warn : C.indigo,
                  boxShadow: warn ? `0 0 10px ${C.warn}66` : `0 0 10px ${C.indigo}66`,
                }}
                aria-hidden="true"
              />
              <div className="flex min-w-0 flex-1 items-center gap-4 p-5">
                <span
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[10px] text-[15px] font-semibold tabular-nums"
                  style={{
                    ...uiF,
                    background: warn ? C.warnBg : C.panelHi,
                    color: warn ? C.warn : C.inkSoft,
                    boxShadow: `inset 0 0 0 1px ${warn ? C.warn + "33" : C.line}`,
                  }}
                  aria-hidden="true"
                >
                  {warn ? <TriangleAlert size={18} strokeWidth={2.2} /> : i + 1}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span
                      className="inline-flex items-center gap-1 rounded-[5px] px-1.5 py-0.5 text-[10.5px] font-medium"
                      style={{
                        ...uiF,
                        background: warn ? C.warnBg : C.indigoBg,
                        color: warn ? C.warn : C.indigo,
                        boxShadow: `inset 0 0 0 1px ${warn ? C.warn + "33" : C.indigo + "33"}`,
                      }}
                    >
                      {warn ? (
                        <TriangleAlert size={10} strokeWidth={2.4} aria-hidden="true" />
                      ) : (
                        <Star size={10} strokeWidth={2.4} aria-hidden="true" />
                      )}
                      {warn ? "Urgent" : "Kans"}
                    </span>
                    <h3
                      className="text-[15px] font-semibold tracking-[-0.01em]"
                      style={{ ...uiF, color: C.ink }}
                    >
                      {a.titel}
                    </h3>
                  </div>
                  <p
                    className="mt-1.5 text-[13px] leading-relaxed"
                    style={{ ...uiF, color: C.inkSoft }}
                  >
                    {a.detail}
                  </p>
                  <button
                    onClick={() => onNaar(naar[a.cta] ?? "dashboard")}
                    className="mt-3 inline-flex items-center gap-2 rounded-[9px] px-3.5 py-2 text-[12.5px] font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
                    style={
                      warn
                        ? {
                            ...uiF,
                            background: C.indigo,
                            color: C.bgDeep,
                            ["--tw-ring-color" as string]: C.indigo,
                            ["--tw-ring-offset-color" as string]: C.panel,
                          }
                        : {
                            ...uiF,
                            background: C.panelHi,
                            color: C.ink,
                            boxShadow: `inset 0 0 0 1px ${C.line}`,
                            ["--tw-ring-color" as string]: C.indigo,
                            ["--tw-ring-offset-color" as string]: C.panel,
                          }
                    }
                  >
                    {a.cta} <ArrowRight size={13} strokeWidth={2.2} aria-hidden="true" />
                  </button>
                </div>
              </div>
            </Panel>
          );
        })}
      </ol>

      {/* Berichten */}
      <section className="space-y-3">
        <SectionHead title="Berichten" sub="Recente gesprekken" Icon={Send} />
        <Panel className="overflow-hidden">
          {BERICHTEN.map((b, i) => (
            <div
              key={b.van}
              className="flex items-center gap-3 px-4 py-3.5"
              style={{ borderTop: i === 0 ? undefined : hairline }}
            >
              <span
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[9px] text-[11px] font-semibold"
                style={{
                  ...uiF,
                  background: C.panelHi,
                  color: C.inkSoft,
                  boxShadow: `inset 0 0 0 1px ${C.line}`,
                }}
                aria-hidden="true"
              >
                {b.initialen}
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span
                    className="truncate text-[13.5px] font-medium"
                    style={{ ...uiF, color: C.ink }}
                  >
                    {b.van}
                  </span>
                  {b.ongelezen && (
                    <span
                      className="h-1.5 w-1.5 rounded-full"
                      style={{ background: C.indigo, boxShadow: `0 0 6px ${C.indigo}` }}
                      aria-label="Ongelezen"
                    />
                  )}
                </div>
                <p className="mt-0.5 truncate text-[12px]" style={{ ...uiF, color: C.muted }}>
                  {b.preview}
                </p>
              </div>
              <span
                className="shrink-0 text-[11px] tabular-nums"
                style={{ ...monoF, color: C.faint }}
              >
                {b.tijd}
              </span>
            </div>
          ))}
        </Panel>
      </section>
    </div>
  );
}

// ── Facturen ─────────────────────────────────────────────────────────────────────
function Facturen() {
  const factMeta = (
    status: string,
  ): { label: string; Icon: LucideIcon; fg: string; bg: string } => {
    if (status === "Betaald") return { label: "Betaald", Icon: Check, fg: C.ok, bg: C.okBg };
    if (status === "Openstaand")
      return { label: "Openstaand", Icon: Clock, fg: C.warn, bg: C.warnBg };
    return { label: "Concept", Icon: FileText, fg: C.muted, bg: C.panelHi };
  };
  const betaald = "€ 8.622";
  const open = FACTUREN.filter((f) => f.status === "Openstaand").length;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <SectionHead title="Facturen" sub="Omzet & openstaand" Icon={Coins} />
        <button
          className="inline-flex items-center gap-2 rounded-[9px] px-3.5 py-2 text-[12.5px] font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
          style={{
            ...uiF,
            background: C.indigo,
            color: C.bgDeep,
            ["--tw-ring-color" as string]: C.indigo,
            ["--tw-ring-offset-color" as string]: C.bg,
          }}
          onMouseEnter={(e) => (e.currentTarget.style.background = C.indigoDeep)}
          onMouseLeave={(e) => (e.currentTarget.style.background = C.indigo)}
        >
          <Plus size={14} strokeWidth={2.2} aria-hidden="true" /> Nieuwe factuur
        </button>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        {[
          { l: "Betaald (mnd)", v: betaald, accent: true },
          { l: "Openstaand", v: `${open}`, accent: false },
          { l: "Te factureren", v: "€ 1.350", accent: false },
        ].map((s) => (
          <Panel key={s.l} className="p-4">
            <div className="text-[11.5px]" style={{ ...uiF, color: C.muted }}>
              {s.l}
            </div>
            <div
              className="mt-2 text-[25px] font-semibold tabular-nums leading-none tracking-[-0.02em]"
              style={{ ...uiF, color: s.accent ? C.ok : C.ink }}
            >
              {s.v}
            </div>
          </Panel>
        ))}
      </div>

      <Panel className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[520px] text-left">
            <thead>
              <tr style={{ borderBottom: hairline }}>
                {["Nummer", "Klant", "Datum", "Status", "Bedrag"].map((h, i) => (
                  <th
                    key={h}
                    className={`px-4 py-2.5 text-[10.5px] font-medium uppercase tracking-[0.04em] ${i === 4 ? "text-right" : ""}`}
                    style={{ ...uiF, color: C.faint }}
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
                    style={{ borderTop: i === 0 ? undefined : hairline }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = C.panelHi)}
                    onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                  >
                    <td
                      className="px-4 py-3 text-[13px] tabular-nums"
                      style={{ ...monoF, color: C.ink }}
                    >
                      {f.nr}
                    </td>
                    <td className="px-4 py-3 text-[13px]" style={{ ...uiF, color: C.inkSoft }}>
                      {f.klant}
                    </td>
                    <td
                      className="px-4 py-3 text-[12px] tabular-nums"
                      style={{ ...monoF, color: C.muted }}
                    >
                      {f.datum}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className="inline-flex items-center gap-1.5 rounded-[6px] px-2 py-1 text-[11px] font-medium"
                        style={{
                          ...uiF,
                          background: m.bg,
                          color: m.fg,
                          boxShadow: `inset 0 0 0 1px ${m.fg}33`,
                        }}
                      >
                        <m.Icon size={11} strokeWidth={2.2} aria-hidden="true" /> {m.label}
                      </span>
                    </td>
                    <td
                      className="px-4 py-3 text-right text-[14px] font-semibold tabular-nums"
                      style={{ ...uiF, color: C.ink }}
                    >
                      {f.bedrag}
                    </td>
                  </tr>
                );
              })}
            </tbody>
            <tfoot>
              <tr style={{ borderTop: `1px solid ${C.lineHi}`, background: C.panelSoft }}>
                <td
                  colSpan={4}
                  className="px-4 py-3 text-[11.5px] font-medium"
                  style={{ ...uiF, color: C.muted }}
                >
                  Totaal betaald
                </td>
                <td
                  className="px-4 py-3 text-right text-[16px] font-semibold tabular-nums"
                  style={{ ...uiF, color: C.ok }}
                >
                  {betaald}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </Panel>
    </div>
  );
}
