"use client";

// Concept 515 — "Draaitabel" · Spreadsheet/pivot data-dense pro-terminal. Maximale informatiedichtheid:
// compacte tabelrijen met celraster, sorteerbare kolomkoppen, een bevroren eerste kolom-gevoel, inline
// sparklines, tabular-nums overal, en een segment/pivot-schakelaar. Voor de bemiddelaar die veel
// opdrachten/ZZP'ers tegelijk overziet. Linear/Airtable-strak, één indigo-accent, licht thema.
// Status altijd label + icoon.

import { useMemo, useState, type CSSProperties, type ReactNode } from "react";
import {
  AlertTriangle,
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  ArrowUp,
  ArrowUpDown,
  Check,
  ChevronRight,
  Clock,
  Columns3,
  FileText,
  Filter,
  Grid3x3,
  LayoutGrid,
  ListChecks,
  Rows3,
  Search,
  ShieldCheck,
  Table2,
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

// ————————————————————————————— Palet — licht, één indigo-accent —————————————————————————————
const C = {
  bg: "#f6f7f9",
  panel: "#ffffff",
  head: "#f1f3f6",
  cell: "#fbfcfd",
  zebra: "#f8fafc",
  line: "#e4e7ec",
  lineSoft: "#eef0f4",
  lineStrong: "#d3d8e0",

  ink: "#141821",
  inkSoft: "#3a4150",
  inkMute: "#6b7280",
  inkFaint: "#9aa1ad",

  accent: "#4f46e5",
  accentDeep: "#3f38c4",
  accentSoft: "rgba(79,70,229,0.09)",

  pos: "#0e9f6e",
  posSoft: "rgba(14,159,110,0.11)",
  info: "#2563eb",
  infoSoft: "rgba(37,99,235,0.10)",
  warn: "#c2740a",
  warnSoft: "rgba(194,116,10,0.12)",
  neg: "#dc2626",
  negSoft: "rgba(220,38,38,0.10)",
};

const sans: CSSProperties = {
  fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif",
};
const mono: CSSProperties = {
  fontFamily:
    "'SF Mono', 'JetBrains Mono', 'Roboto Mono', ui-monospace, 'Menlo', 'Consolas', monospace",
  fontVariantNumeric: "tabular-nums",
  fontFeatureSettings: "'tnum' 1",
};
const RING =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4f46e5] focus-visible:ring-offset-1 focus-visible:ring-offset-[#f6f7f9]";

// ————————————————————————————— Status-taal —————————————————————————————
type Tone = { base: string; soft: string; label: string; Icon: LucideIcon; alarm: boolean };

function credTone(s: CredStatus): Tone {
  switch (s) {
    case "VERIFIED":
      return {
        base: C.pos,
        soft: C.posSoft,
        label: "Geverifieerd",
        Icon: ShieldCheck,
        alarm: false,
      };
    case "SUBMITTED":
      return { base: C.info, soft: C.infoSoft, label: "In beoordeling", Icon: Clock, alarm: false };
    case "EXPIRING":
      return {
        base: C.warn,
        soft: C.warnSoft,
        label: "Verloopt bijna",
        Icon: AlertTriangle,
        alarm: true,
      };
    case "REJECTED":
      return { base: C.neg, soft: C.negSoft, label: "Afgewezen", Icon: X, alarm: true };
  }
}

function factuurTone(status: string): {
  base: string;
  soft: string;
  label: string;
  Icon: LucideIcon;
} {
  if (status === "Betaald") return { base: C.pos, soft: C.posSoft, label: "Betaald", Icon: Check };
  if (status === "Openstaand")
    return { base: C.warn, soft: C.warnSoft, label: "Openstaand", Icon: Clock };
  if (status === "Concept")
    return { base: C.info, soft: C.infoSoft, label: "Concept", Icon: FileText };
  return { base: C.neg, soft: C.negSoft, label: status, Icon: AlertTriangle };
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

// ————————————————————————————— Primitives —————————————————————————————
function Panel({
  children,
  className = "",
  as: Tag = "div",
}: {
  children: ReactNode;
  className?: string;
  as?: "div" | "section" | "article" | "aside";
}) {
  return (
    <Tag
      className={`rounded-[8px] ${className}`}
      style={{ background: C.panel, border: `1px solid ${C.line}` }}
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
  ariaLabel,
  ariaPressed,
  full = false,
}: {
  children: ReactNode;
  onClick?: () => void;
  variant?: "solid" | "outline" | "ghost";
  size?: "sm" | "md";
  className?: string;
  ariaLabel?: string;
  ariaPressed?: boolean;
  full?: boolean;
}) {
  const pad = size === "sm" ? "px-2.5 py-1.5 text-[12px]" : "px-3.5 py-2 text-[12.5px]";
  const base = `inline-flex items-center justify-center gap-1.5 rounded-[6px] font-semibold tracking-[-0.01em] transition-all duration-150 ${RING} ${
    full ? "w-full" : ""
  }`;
  const style: CSSProperties =
    variant === "solid"
      ? { background: C.accent, color: "#fff", border: `1px solid ${C.accentDeep}`, ...sans }
      : variant === "outline"
        ? { background: C.panel, color: C.ink, border: `1px solid ${C.lineStrong}`, ...sans }
        : { background: "transparent", color: C.inkSoft, border: "1px solid transparent", ...sans };
  const hover =
    variant === "solid"
      ? "hover:brightness-110"
      : variant === "outline"
        ? "hover:bg-[#f8fafc]"
        : "hover:bg-[#f1f3f6]";
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={ariaLabel}
      aria-pressed={ariaPressed}
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
      className="inline-flex items-center gap-1 rounded-[5px] px-1.5 py-0.5 text-[10.5px] font-semibold"
      style={{ color: base, background: soft, border: `1px solid ${base}2e`, ...sans }}
    >
      <Icon size={11} aria-hidden="true" />
      {label}
      {alarm && <span className="sr-only"> (let op)</span>}
    </span>
  );
}

// Inline sparkline (dun lijntje) — cel-formaat
function Spark({ data, tone }: { data: number[]; tone: string }) {
  const max = Math.max(...data);
  const min = Math.min(...data);
  const span = max - min || 1;
  const w = 56;
  const h = 16;
  const pts = data
    .map((d, i) => `${(i / (data.length - 1)) * w},${h - ((d - min) / span) * (h - 2) - 1}`)
    .join(" ");
  return (
    <svg
      width={w}
      height={h}
      viewBox={`0 0 ${w} ${h}`}
      aria-hidden="true"
      className="overflow-visible"
    >
      <polyline
        points={pts}
        fill="none"
        stroke={tone}
        strokeWidth={1.4}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

// Match-cel: numeriek + micro-balk
function MatchCell({ value }: { value: number }) {
  const tone = value >= 90 ? C.pos : value >= 85 ? C.accent : C.warn;
  return (
    <span className="inline-flex items-center gap-2" aria-label={`Match ${value} procent`}>
      <span className="text-[12.5px] font-bold" style={{ color: tone, ...mono }}>
        {value}%
      </span>
      <span
        className="hidden h-1.5 w-10 overflow-hidden rounded-full sm:inline-block"
        style={{ background: C.lineSoft }}
        aria-hidden="true"
      >
        <span
          className="block h-full rounded-full"
          style={{ width: `${value}%`, background: tone }}
        />
      </span>
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
    <div
      className="mb-4 flex flex-wrap items-end justify-between gap-3 border-b pb-3.5"
      style={{ borderColor: C.line }}
    >
      <div className="min-w-0">
        <span
          className="inline-flex items-center gap-1.5 text-[10.5px] font-semibold uppercase tracking-[0.16em]"
          style={{ color: C.accent, ...mono }}
        >
          <Grid3x3 size={12} aria-hidden="true" /> {code}
        </span>
        <h1
          className="mt-1.5 text-[22px] font-bold leading-tight tracking-[-0.02em] md:text-[25px]"
          style={{ color: C.ink }}
        >
          {title}
        </h1>
        {sub && (
          <p className="mt-0.5 text-[13px]" style={{ color: C.inkMute }}>
            {sub}
          </p>
        )}
      </div>
      {right}
    </div>
  );
}

const NAV_ICON: Record<ScreenKey, LucideIcon> = {
  dashboard: LayoutGrid,
  marktplaats: Table2,
  opdracht: Columns3,
  verificatie: ShieldCheck,
  acties: ListChecks,
  facturen: FileText,
  documenten: FileText,
  berichten: FileText,
};

// —————————————————————————————————————— Root ——————————————————————————————————————
export function Concept515() {
  const [screen, setScreen] = useState<ScreenKey>("dashboard");
  const [selId, setSelId] = useState<string>(OPDRACHTEN[0]?.id ?? "");
  const active = OPDRACHTEN.find((o) => o.id === selId) ?? (OPDRACHTEN[0] as Opdracht);
  const open = (id: string) => {
    setSelId(id);
    setScreen("opdracht");
  };

  return (
    <div
      className="min-h-[760px] w-full antialiased"
      style={{ ...sans, color: C.ink, background: C.bg }}
    >
      <div className="mx-auto flex max-w-[1200px]">
        <Sidebar screen={screen} setScreen={setScreen} />
        <div className="min-w-0 flex-1">
          <TopBar />
          <MobileNav screen={screen} setScreen={setScreen} />
          <main key={screen} className="dt-fade px-3 pb-16 pt-4 sm:px-5 md:px-6">
            {screen === "dashboard" && (
              <Dashboard
                onOpen={open}
                onMarkt={() => setScreen("marktplaats")}
                onActies={() => setScreen("acties")}
                onFacturen={() => setScreen("facturen")}
              />
            )}
            {screen === "marktplaats" && <Marktplaats selId={selId} onOpen={open} />}
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
        @keyframes dtFade { from { opacity: 0; transform: translateY(5px); } to { opacity: 1; transform: none; } }
        .dt-fade { animation: dtFade 0.28s cubic-bezier(0.22,1,0.36,1) both; }
        .dt-row { transition: background 0.12s ease; }
        .dt-row:hover { background: ${C.accentSoft} !important; }
        @media (prefers-reduced-motion: reduce) { .dt-fade { animation: none !important; } .dt-row { transition: none !important; } }
      `}</style>
    </div>
  );
}

// —————————————————————————————————————— Sidebar ——————————————————————————————————————
function Sidebar({ screen, setScreen }: { screen: ScreenKey; setScreen: (s: ScreenKey) => void }) {
  return (
    <aside
      className="sticky top-0 hidden h-screen w-[210px] shrink-0 flex-col md:flex"
      style={{ background: C.panel, borderRight: `1px solid ${C.line}` }}
    >
      <div
        className="flex items-center gap-2.5 px-4 py-4"
        style={{ borderBottom: `1px solid ${C.line}` }}
      >
        <span
          className="flex h-8 w-8 items-center justify-center rounded-[8px]"
          style={{ background: C.accent, color: "#fff" }}
          aria-hidden="true"
        >
          <Table2 size={17} />
        </span>
        <span>
          <span
            className="block text-[14px] font-bold leading-none tracking-[-0.01em]"
            style={{ color: C.ink }}
          >
            Draaitabel
          </span>
          <span
            className="mt-0.5 block text-[10px] uppercase tracking-[0.12em]"
            style={{ color: C.inkFaint, ...mono }}
          >
            pivot · pro
          </span>
        </span>
      </div>

      <nav aria-label="Hoofdnavigatie" className="flex-1 overflow-y-auto px-2.5 py-3">
        <ul className="space-y-0.5">
          {SCREENS.map((s, idx) => {
            const on = s.key === screen;
            const Icon = NAV_ICON[s.key];
            return (
              <li key={s.key}>
                <button
                  type="button"
                  onClick={() => setScreen(s.key)}
                  aria-current={on ? "page" : undefined}
                  className={`flex w-full items-center gap-2.5 rounded-[6px] px-2.5 py-2 text-left text-[13px] font-medium transition-colors ${RING}`}
                  style={
                    on ? { background: C.accentSoft, color: C.accentDeep } : { color: C.inkSoft }
                  }
                >
                  <Icon
                    size={15}
                    aria-hidden="true"
                    style={{ color: on ? C.accent : C.inkFaint }}
                  />
                  <span className="flex-1">{s.label}</span>
                  <span
                    className="text-[10px]"
                    style={{ color: on ? C.accent : C.inkFaint, ...mono }}
                  >
                    R{idx + 1}
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      </nav>

      <div className="px-3 py-3.5" style={{ borderTop: `1px solid ${C.line}` }}>
        <div className="flex items-center gap-2.5">
          <span
            className="flex h-8 w-8 items-center justify-center rounded-[7px] text-[11px] font-bold"
            style={{ background: C.ink, color: "#fff", ...mono }}
            aria-hidden="true"
          >
            {PROFIEL.initialen}
          </span>
          <span className="min-w-0 flex-1">
            <span className="block truncate text-[12px] font-semibold" style={{ color: C.ink }}>
              {PROFIEL.naam}
            </span>
            <span className="flex items-center gap-1 text-[10px]" style={{ color: C.pos }}>
              <ShieldCheck size={10} aria-hidden="true" /> {PROFIEL.trust}
            </span>
          </span>
        </div>
      </div>
    </aside>
  );
}

function TopBar() {
  return (
    <header
      className="sticky top-0 z-10 flex items-center gap-2.5 px-3 py-2.5 sm:px-5 md:px-6"
      style={{
        background: `${C.bg}f2`,
        borderBottom: `1px solid ${C.line}`,
        backdropFilter: "blur(8px)",
      }}
    >
      <div
        className="flex flex-1 items-center gap-2 rounded-[6px] px-2.5 py-1.5"
        style={{ background: C.panel, border: `1px solid ${C.line}` }}
      >
        <Search size={13} aria-hidden="true" style={{ color: C.inkFaint }} />
        <span className="text-[12px]" style={{ color: C.inkFaint }}>
          Filter over alle kolommen…
        </span>
        <span
          className="ml-auto hidden rounded-[4px] px-1.5 py-0.5 text-[10px] font-semibold sm:inline"
          style={{ background: C.head, color: C.inkMute, border: `1px solid ${C.line}`, ...mono }}
        >
          /
        </span>
      </div>
      <span
        className="hidden items-center gap-1.5 rounded-[6px] px-2.5 py-1.5 text-[11.5px] font-semibold sm:inline-flex"
        style={{ background: C.head, color: C.inkSoft, border: `1px solid ${C.line}`, ...mono }}
      >
        <Rows3 size={13} aria-hidden="true" /> {OPDRACHTEN.length} rijen
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
      className="flex gap-1 overflow-x-auto px-3 py-2 md:hidden"
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
            className={`shrink-0 rounded-[6px] px-2.5 py-1.5 text-[12px] font-semibold transition-colors ${RING}`}
            style={
              on
                ? { background: C.accent, color: "#fff" }
                : { color: C.inkSoft, background: C.head }
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
  onFacturen,
}: {
  onOpen: (id: string) => void;
  onMarkt: () => void;
  onActies: () => void;
  onFacturen: () => void;
}) {
  const verified = CREDENTIALS.filter((c) => c.status === "VERIFIED").length;
  const ratio = Math.round((verified / CREDENTIALS.length) * 100);
  return (
    <div className="space-y-4">
      <ScreenHead
        code="SHEET · 00 DASHBOARD"
        title={`Overzicht — ${PROFIEL.naam.split(" ")[0]}`}
        sub="Alles op één blad. Klik een rij om te openen."
        right={
          <div className="flex gap-2">
            <Btn variant="outline" size="sm" onClick={onFacturen}>
              <FileText size={13} aria-hidden="true" /> Facturen
            </Btn>
            <Btn variant="solid" size="sm" onClick={onActies}>
              Acties <ArrowRight size={13} aria-hidden="true" />
            </Btn>
          </div>
        }
      />

      {/* KPI-cellenrij */}
      <Panel className="overflow-hidden">
        <div className="grid grid-cols-2 xl:grid-cols-4">
          {KPIS.map((k, i) => (
            <div
              key={k.label}
              className="p-4"
              style={{
                borderRight: i < 3 ? `1px solid ${C.lineSoft}` : "none",
                borderTop: i >= 2 ? `1px solid ${C.lineSoft}` : "none",
              }}
            >
              <p
                className="text-[10px] font-semibold uppercase tracking-[0.1em]"
                style={{ color: C.inkMute, ...mono }}
              >
                {k.label}
              </p>
              <p
                className="mt-1.5 text-[23px] font-bold leading-none tracking-[-0.02em]"
                style={{ color: C.ink, ...mono }}
              >
                {k.value}
              </p>
              <div className="mt-2.5 flex items-center justify-between">
                <span
                  className="inline-flex items-center gap-0.5 text-[11px] font-bold"
                  style={{ color: k.up ? C.pos : C.warn, ...mono }}
                >
                  {k.up ? (
                    <ArrowUp size={12} aria-hidden="true" />
                  ) : (
                    <ArrowDown size={12} aria-hidden="true" />
                  )}
                  {k.trend}
                </span>
                <Spark data={k.spark} tone={C.accent} />
              </div>
            </div>
          ))}
        </div>
      </Panel>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1.6fr_1fr]">
        <Panel className="overflow-hidden">
          <SheetHeadBar
            title="Aanbevolen opdrachten"
            right={
              <button
                type="button"
                onClick={onMarkt}
                className={`text-[11.5px] font-semibold ${RING}`}
                style={{ color: C.accent }}
              >
                Volledige tabel →
              </button>
            }
          />
          <div className="overflow-x-auto">
            <table className="w-full text-left" style={{ minWidth: 520 }}>
              <caption className="sr-only">Aanbevolen opdrachten</caption>
              <thead>
                <tr style={{ background: C.head, borderBottom: `1px solid ${C.line}` }}>
                  {["Opdracht", "Locatie", "Match", "Tarief"].map((h, i) => (
                    <th
                      key={h}
                      scope="col"
                      className={`px-3 py-2 text-[10px] font-semibold uppercase tracking-[0.08em] ${i >= 2 ? "text-right" : ""}`}
                      style={{ color: C.inkMute, ...mono }}
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {OPDRACHTEN.map((o, i) => (
                  <tr
                    key={o.id}
                    className={`dt-row cursor-pointer ${RING}`}
                    tabIndex={0}
                    role="button"
                    onClick={() => onOpen(o.id)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        onOpen(o.id);
                      }
                    }}
                    style={{
                      borderTop: i === 0 ? "none" : `1px solid ${C.lineSoft}`,
                      background: i % 2 ? C.zebra : undefined,
                    }}
                  >
                    <td className="px-3 py-2.5">
                      <span
                        className="block truncate text-[13px] font-semibold"
                        style={{ color: C.ink, maxWidth: 220 }}
                      >
                        {o.titel}
                      </span>
                      <span className="text-[10.5px]" style={{ color: C.inkFaint, ...mono }}>
                        {o.id}
                      </span>
                    </td>
                    <td className="px-3 py-2.5 text-[12px]" style={{ color: C.inkMute }}>
                      {o.plaats}
                    </td>
                    <td className="px-3 py-2.5 text-right">
                      <MatchCell value={o.match} />
                    </td>
                    <td
                      className="px-3 py-2.5 text-right text-[13px] font-bold"
                      style={{ color: C.ink, ...mono }}
                    >
                      {o.tarief.replace(" / uur", "")}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Panel>

        <div className="space-y-4">
          <Panel className="p-4">
            <span
              className="inline-flex items-center gap-1.5 text-[10.5px] font-semibold uppercase tracking-[0.12em]"
              style={{ color: C.pos, ...mono }}
            >
              <ShieldCheck size={12} aria-hidden="true" /> Dossier
            </span>
            <div className="mt-2 flex items-baseline gap-2">
              <span
                className="text-[30px] font-bold leading-none tracking-[-0.02em]"
                style={{ color: C.ink, ...mono }}
              >
                {ratio}%
              </span>
              <span className="text-[12px]" style={{ color: C.inkMute }}>
                op orde
              </span>
            </div>
            <div className="mt-3 space-y-1.5">
              {CREDENTIALS.map((c) => {
                const t = credTone(c.status);
                return (
                  <div key={c.naam} className="flex items-center gap-2">
                    <t.Icon size={12} aria-hidden="true" style={{ color: t.base }} />
                    <span className="flex-1 truncate text-[11.5px]" style={{ color: C.inkSoft }}>
                      {c.naam}
                    </span>
                    <span className="text-[10px] font-semibold" style={{ color: t.base, ...mono }}>
                      {t.label}
                    </span>
                  </div>
                );
              })}
            </div>
          </Panel>

          <Panel className="p-4" as="article">
            <span
              className="inline-flex items-center gap-1.5 text-[10.5px] font-semibold uppercase tracking-[0.12em]"
              style={{ color: C.warn, ...mono }}
            >
              <AlertTriangle size={12} aria-hidden="true" /> Actie vereist
            </span>
            <h3 className="mt-2 text-[14.5px] font-semibold leading-snug" style={{ color: C.ink }}>
              {(ACTIES[0] as (typeof ACTIES)[number]).titel}
            </h3>
            <p className="mt-1 text-[12.5px] leading-relaxed" style={{ color: C.inkSoft }}>
              {(ACTIES[0] as (typeof ACTIES)[number]).detail}
            </p>
            <Btn variant="solid" size="sm" full className="mt-3.5" onClick={onActies}>
              {(ACTIES[0] as (typeof ACTIES)[number]).cta}{" "}
              <ArrowRight size={13} aria-hidden="true" />
            </Btn>
          </Panel>
        </div>
      </div>
    </div>
  );
}

function SheetHeadBar({ title, right }: { title: string; right?: ReactNode }) {
  return (
    <div
      className="flex items-center justify-between px-3.5 py-2.5"
      style={{ borderBottom: `1px solid ${C.line}`, background: C.panel }}
    >
      <span
        className="inline-flex items-center gap-1.5 text-[10.5px] font-semibold uppercase tracking-[0.12em]"
        style={{ color: C.accent, ...mono }}
      >
        <Table2 size={12} aria-hidden="true" /> {title}
      </span>
      {right}
    </div>
  );
}

// —————————————————————————————————————— Marktplaats (de kern-tabel) ——————————————————————————————————————
type SortKey = "match" | "tarief" | "titel";
type Mode = "ok" | "loading" | "leeg";

function Marktplaats({ selId, onOpen }: { selId: string; onOpen: (id: string) => void }) {
  const [q, setQ] = useState("");
  const [sort, setSort] = useState<SortKey>("match");
  const [dir, setDir] = useState<"asc" | "desc">("desc");
  const [pivot, setPivot] = useState<"lijst" | "plaats">("lijst");
  const [mode, setMode] = useState<Mode>("ok");

  const rows = useMemo(() => {
    const n = q.toLowerCase().trim();
    const list = OPDRACHTEN.filter(
      (o) =>
        o.titel.toLowerCase().includes(n) ||
        o.plaats.toLowerCase().includes(n) ||
        o.opdrachtgever.toLowerCase().includes(n),
    );
    const sorted = [...list].sort((a, b) => {
      let d = 0;
      if (sort === "match") d = a.match - b.match;
      else if (sort === "tarief") d = parseEUR(a.tarief) - parseEUR(b.tarief);
      else d = a.titel.localeCompare(b.titel);
      return dir === "asc" ? d : -d;
    });
    return sorted;
  }, [q, sort, dir]);

  const byPlaats = useMemo(() => {
    const map = new Map<string, Opdracht[]>();
    for (const o of rows) {
      const arr = map.get(o.plaats) ?? [];
      arr.push(o);
      map.set(o.plaats, arr);
    }
    return [...map.entries()];
  }, [rows]);

  const toggle = (k: SortKey) => {
    if (sort === k) setDir((d) => (d === "asc" ? "desc" : "asc"));
    else {
      setSort(k);
      setDir("desc");
    }
  };

  const empty = mode === "leeg" || rows.length === 0;

  return (
    <div className="space-y-4">
      <ScreenHead
        code="SHEET · 01 MARKTPLAATS"
        title="Opdrachtentabel"
        sub={`${rows.length} van ${OPDRACHTEN.length} rijen · gefilterd op je geverifieerde profiel.`}
      />

      <Panel className="flex flex-col gap-2 p-2 sm:flex-row sm:items-center">
        <div
          className="flex flex-1 items-center gap-2 rounded-[6px] px-2.5 py-1.5"
          style={{ background: C.cell, border: `1px solid ${C.line}` }}
        >
          <Search size={14} aria-hidden="true" style={{ color: C.inkFaint }} />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Filter rijen…"
            aria-label="Opdrachten filteren"
            className="w-full bg-transparent text-[12.5px] outline-none placeholder:text-[#9aa1ad]"
            style={{ color: C.ink }}
          />
          {q && (
            <button
              type="button"
              onClick={() => setQ("")}
              aria-label="Filter wissen"
              className={`flex h-4 w-4 items-center justify-center rounded ${RING}`}
              style={{ color: C.inkMute }}
            >
              <X size={12} aria-hidden="true" />
            </button>
          )}
        </div>
        <div className="flex items-center gap-1.5" role="group" aria-label="Weergave">
          <Btn
            size="sm"
            variant={pivot === "lijst" ? "solid" : "outline"}
            ariaPressed={pivot === "lijst"}
            onClick={() => setPivot("lijst")}
          >
            <Rows3 size={12} aria-hidden="true" /> Lijst
          </Btn>
          <Btn
            size="sm"
            variant={pivot === "plaats" ? "solid" : "outline"}
            ariaPressed={pivot === "plaats"}
            onClick={() => setPivot("plaats")}
          >
            <Filter size={12} aria-hidden="true" /> Per plaats
          </Btn>
          <Btn
            size="sm"
            variant={mode === "loading" ? "solid" : "outline"}
            onClick={() => setMode(mode === "loading" ? "ok" : "loading")}
          >
            Laadstaat
          </Btn>
        </div>
      </Panel>

      {mode === "loading" ? (
        <Panel className="overflow-hidden" aria-hidden="true">
          {[0, 1, 2, 3].map((i) => (
            <div
              key={i}
              className="flex items-center gap-4 px-3.5 py-3"
              style={{ borderTop: i === 0 ? "none" : `1px solid ${C.lineSoft}` }}
            >
              <div
                className="h-3.5 w-1/3 animate-pulse rounded motion-reduce:animate-none"
                style={{ background: C.lineSoft }}
              />
              <div
                className="h-3.5 w-16 animate-pulse rounded motion-reduce:animate-none"
                style={{ background: C.lineSoft }}
              />
              <div
                className="ml-auto h-3.5 w-14 animate-pulse rounded motion-reduce:animate-none"
                style={{ background: C.lineSoft }}
              />
            </div>
          ))}
        </Panel>
      ) : empty ? (
        <Panel className="flex flex-col items-center px-6 py-14 text-center">
          <span
            className="flex h-12 w-12 items-center justify-center rounded-[10px]"
            style={{ color: C.accent, background: C.accentSoft, border: `1px solid ${C.accent}30` }}
            aria-hidden="true"
          >
            <Table2 size={22} />
          </span>
          <p className="mt-3.5 text-[16px] font-semibold" style={{ color: C.ink }}>
            Geen rijen
          </p>
          <p className="mt-1.5 max-w-sm text-[12.5px]" style={{ color: C.inkSoft }}>
            Geen opdracht komt overeen met {q ? `“${q}”` : "je filter"}. Wis het filter om alle
            rijen te tonen.
          </p>
          <Btn
            variant="outline"
            size="sm"
            className="mt-4"
            onClick={() => {
              setQ("");
              setMode("ok");
            }}
          >
            Filter wissen
          </Btn>
        </Panel>
      ) : pivot === "lijst" ? (
        <Panel className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left" style={{ minWidth: 720 }}>
              <caption className="sr-only">Opdrachten</caption>
              <thead>
                <tr style={{ background: C.head, borderBottom: `1px solid ${C.line}` }}>
                  <SortTh label="Opdracht" k="titel" sort={sort} dir={dir} onSort={toggle} sticky />
                  <th
                    scope="col"
                    className="px-3 py-2.5 text-[10px] font-semibold uppercase tracking-[0.08em]"
                    style={{ color: C.inkMute, ...mono }}
                  >
                    Opdrachtgever
                  </th>
                  <th
                    scope="col"
                    className="px-3 py-2.5 text-[10px] font-semibold uppercase tracking-[0.08em]"
                    style={{ color: C.inkMute, ...mono }}
                  >
                    Plaats
                  </th>
                  <th
                    scope="col"
                    className="px-3 py-2.5 text-[10px] font-semibold uppercase tracking-[0.08em]"
                    style={{ color: C.inkMute, ...mono }}
                  >
                    Uren
                  </th>
                  <SortTh label="Match" k="match" sort={sort} dir={dir} onSort={toggle} right />
                  <SortTh label="Tarief" k="tarief" sort={sort} dir={dir} onSort={toggle} right />
                  <th scope="col" className="px-3 py-2.5" aria-label="Openen" />
                </tr>
              </thead>
              <tbody>
                {rows.map((o, i) => {
                  const on = o.id === selId;
                  return (
                    <tr
                      key={o.id}
                      className={`dt-row cursor-pointer ${RING}`}
                      tabIndex={0}
                      role="button"
                      aria-pressed={on}
                      onClick={() => onOpen(o.id)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") {
                          e.preventDefault();
                          onOpen(o.id);
                        }
                      }}
                      style={{
                        borderTop: i === 0 ? "none" : `1px solid ${C.lineSoft}`,
                        background: on ? C.accentSoft : i % 2 ? C.zebra : undefined,
                      }}
                    >
                      <td
                        className="px-3 py-2.5"
                        style={on ? { boxShadow: `inset 2px 0 0 ${C.accent}` } : undefined}
                      >
                        <span
                          className="block truncate text-[13px] font-semibold"
                          style={{ color: C.ink, maxWidth: 240 }}
                        >
                          {o.titel}
                        </span>
                        <span className="text-[10px]" style={{ color: C.inkFaint, ...mono }}>
                          {o.id}
                        </span>
                      </td>
                      <td className="px-3 py-2.5 text-[12.5px]" style={{ color: C.inkSoft }}>
                        {o.opdrachtgever}
                      </td>
                      <td className="px-3 py-2.5 text-[12.5px]" style={{ color: C.inkMute }}>
                        {o.plaats}
                      </td>
                      <td className="px-3 py-2.5 text-[12px]" style={{ color: C.inkMute, ...mono }}>
                        {o.uren}
                      </td>
                      <td className="px-3 py-2.5 text-right">
                        <MatchCell value={o.match} />
                      </td>
                      <td
                        className="px-3 py-2.5 text-right text-[13px] font-bold"
                        style={{ color: C.ink, ...mono }}
                      >
                        {o.tarief.replace(" / uur", "")}
                      </td>
                      <td className="px-2 py-2.5 text-right">
                        <ChevronRight size={15} aria-hidden="true" style={{ color: C.inkFaint }} />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Panel>
      ) : (
        <div className="space-y-3">
          {byPlaats.map(([plaats, list]) => {
            const gem = Math.round(list.reduce((a, o) => a + o.match, 0) / list.length);
            return (
              <Panel key={plaats} className="overflow-hidden">
                <div
                  className="flex items-center justify-between px-3.5 py-2"
                  style={{ background: C.head, borderBottom: `1px solid ${C.line}` }}
                >
                  <span className="text-[12px] font-bold" style={{ color: C.ink }}>
                    {plaats}
                  </span>
                  <span
                    className="text-[10.5px] font-semibold"
                    style={{ color: C.inkMute, ...mono }}
                  >
                    {list.length} rij{list.length === 1 ? "" : "en"} · gem. match {gem}%
                  </span>
                </div>
                <ul>
                  {list.map((o, i) => (
                    <li key={o.id}>
                      <button
                        type="button"
                        onClick={() => onOpen(o.id)}
                        className={`dt-row flex w-full items-center gap-3 px-3.5 py-2.5 text-left ${RING}`}
                        style={{ borderTop: i === 0 ? "none" : `1px solid ${C.lineSoft}` }}
                      >
                        <span
                          className="min-w-0 flex-1 truncate text-[13px] font-semibold"
                          style={{ color: C.ink }}
                        >
                          {o.titel}
                        </span>
                        <MatchCell value={o.match} />
                        <span className="text-[12.5px] font-bold" style={{ color: C.ink, ...mono }}>
                          {o.tarief.replace(" / uur", "")}
                        </span>
                        <ChevronRight size={14} aria-hidden="true" style={{ color: C.inkFaint }} />
                      </button>
                    </li>
                  ))}
                </ul>
              </Panel>
            );
          })}
        </div>
      )}
    </div>
  );
}

function SortTh({
  label,
  k,
  sort,
  dir,
  onSort,
  right = false,
  sticky = false,
}: {
  label: string;
  k: SortKey;
  sort: SortKey;
  dir: "asc" | "desc";
  onSort: (k: SortKey) => void;
  right?: boolean;
  sticky?: boolean;
}) {
  const on = sort === k;
  return (
    <th
      scope="col"
      className="px-3 py-2.5"
      style={sticky ? { position: "sticky", left: 0, background: C.head } : undefined}
    >
      <button
        type="button"
        onClick={() => onSort(k)}
        className={`inline-flex items-center gap-1 text-[10px] font-semibold uppercase tracking-[0.08em] ${right ? "flex-row-reverse" : ""} ${RING}`}
        style={{ color: on ? C.accent : C.inkMute, ...mono }}
        aria-label={`Sorteer op ${label}${on ? (dir === "asc" ? ", oplopend" : ", aflopend") : ""}`}
      >
        {label}
        {on ? (
          dir === "asc" ? (
            <ArrowUp size={11} aria-hidden="true" />
          ) : (
            <ArrowDown size={11} aria-hidden="true" />
          )
        ) : (
          <ArrowUpDown size={11} aria-hidden="true" style={{ opacity: 0.5 }} />
        )}
      </button>
    </th>
  );
}

// —————————————————————————————————————— Opdracht-detail ——————————————————————————————————————
function OpdrachtDetail({ opdracht, onBack }: { opdracht: Opdracht; onBack: () => void }) {
  const feiten = [
    { l: "Tarief", v: opdracht.tarief.replace(" / uur", ""), s: "per uur" },
    { l: "Omvang", v: opdracht.uren, s: "per week" },
    { l: "Aanvang", v: opdracht.start, s: "start" },
    { l: "Match", v: `${opdracht.match}%`, s: "op profiel" },
  ];
  return (
    <div className="space-y-4">
      <Btn variant="ghost" size="sm" onClick={onBack}>
        <ArrowLeft size={13} aria-hidden="true" /> Terug naar tabel
      </Btn>

      <Panel className="overflow-hidden">
        <div className="p-5 md:p-6">
          <div
            className="flex items-center gap-2 text-[11px]"
            style={{ color: C.inkFaint, ...mono }}
          >
            <span>{opdracht.id}</span>
            <span aria-hidden="true">·</span>
            <span
              className="font-bold uppercase tracking-[0.08em]"
              style={{ color: opdracht.match >= 90 ? C.pos : C.accent }}
            >
              {opdracht.match >= 90 ? "sterke match" : "goede match"} {opdracht.match}%
            </span>
          </div>
          <h1
            className="mt-2 max-w-2xl text-[24px] font-bold leading-[1.15] tracking-[-0.02em] md:text-[28px]"
            style={{ color: C.ink }}
          >
            {opdracht.titel}
          </h1>
          <p className="mt-1.5 text-[13px]" style={{ color: C.inkMute }}>
            {opdracht.opdrachtgever} · {opdracht.plaats}
          </p>
          <div className="mt-3.5 flex flex-wrap gap-1.5">
            {opdracht.tags.map((t) => (
              <span
                key={t}
                className="rounded-[5px] px-2 py-0.5 text-[11px] font-medium"
                style={{ background: C.cell, color: C.inkSoft, border: `1px solid ${C.line}` }}
              >
                {t}
              </span>
            ))}
          </div>
          <div className="mt-4 flex flex-wrap gap-2">
            <Btn variant="solid">
              Reageren <ArrowRight size={13} aria-hidden="true" />
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
                background: C.cell,
              }}
            >
              <p
                className="text-[9.5px] font-semibold uppercase tracking-[0.1em]"
                style={{ color: C.inkMute, ...mono }}
              >
                {m.l}
              </p>
              <p
                className="mt-1 text-[17px] font-bold leading-none"
                style={{ color: C.ink, ...mono }}
              >
                {m.v}
              </p>
              <p className="mt-0.5 text-[10px]" style={{ color: C.inkFaint }}>
                {m.s}
              </p>
            </div>
          ))}
        </div>
      </Panel>

      <Panel className="p-5 md:p-6">
        <span
          className="inline-flex items-center gap-1.5 text-[10.5px] font-semibold uppercase tracking-[0.12em]"
          style={{ color: C.accent, ...mono }}
        >
          <ListChecks size={12} aria-hidden="true" /> Motivering — navolgbaar, zonder verborgen
          score
        </span>
        <div className="mt-4 grid grid-cols-1 gap-6 md:grid-cols-2">
          <RedenKolom
            titel="In je voordeel"
            tone={C.pos}
            Icon={Check}
            items={opdracht.redenen.plus}
          />
          <RedenKolom
            titel="Goed om te weten"
            tone={C.warn}
            Icon={AlertTriangle}
            items={opdracht.redenen.min}
          />
        </div>
      </Panel>
    </div>
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
        className="flex items-center gap-1.5 text-[10.5px] font-semibold uppercase tracking-[0.1em]"
        style={{ color: tone, ...mono }}
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
            <span
              className="mt-1.5 h-1 w-1 shrink-0 rounded-full"
              style={{ background: tone }}
              aria-hidden="true"
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
  const verified = CREDENTIALS.filter((c) => c.status === "VERIFIED").length;
  const ratio = Math.round((verified / CREDENTIALS.length) * 100);
  return (
    <div className="space-y-4">
      <ScreenHead
        code="SHEET · 03 VERIFICATIE"
        title="Certificatenregister"
        sub={`${verified} van ${CREDENTIALS.length} geverifieerd · ${PROFIEL.trust}.`}
        right={
          <div className="text-right">
            <p
              className="text-[26px] font-bold leading-none tracking-[-0.02em]"
              style={{ color: C.ink, ...mono }}
            >
              {ratio}%
            </p>
            <p
              className="text-[9.5px] uppercase tracking-[0.12em]"
              style={{ color: C.inkMute, ...mono }}
            >
              op orde
            </p>
          </div>
        }
      />

      <Panel className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left" style={{ minWidth: 560 }}>
            <caption className="sr-only">Certificaten</caption>
            <thead>
              <tr style={{ background: C.head, borderBottom: `1px solid ${C.line}` }}>
                {["Certificaat", "Detail", "Status", ""].map((h, i) => (
                  <th
                    key={i}
                    scope="col"
                    className="px-3.5 py-2.5 text-[10px] font-semibold uppercase tracking-[0.08em]"
                    style={{ color: C.inkMute, ...mono }}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {CREDENTIALS.map((c, i) => {
                const t = credTone(c.status);
                return (
                  <tr
                    key={c.naam}
                    className="dt-row"
                    style={{
                      borderTop: i === 0 ? "none" : `1px solid ${C.lineSoft}`,
                      background: i % 2 ? C.zebra : undefined,
                    }}
                  >
                    <td className="px-3.5 py-3">
                      <span className="flex items-center gap-2.5">
                        <span
                          className="flex h-8 w-8 items-center justify-center rounded-[7px]"
                          style={{ background: t.soft, color: t.base }}
                          aria-hidden="true"
                        >
                          <t.Icon size={15} />
                        </span>
                        <span className="text-[13px] font-semibold" style={{ color: C.ink }}>
                          {c.naam}
                        </span>
                      </span>
                    </td>
                    <td
                      className="px-3.5 py-3 text-[12px]"
                      style={{ color: t.alarm ? t.base : C.inkMute }}
                    >
                      {c.detail}
                    </td>
                    <td className="px-3.5 py-3">
                      <StatusTag {...t} />
                    </td>
                    <td className="px-3.5 py-3 text-right">
                      <Btn size="sm" variant="outline">
                        {c.status === "EXPIRING"
                          ? "Vernieuwen"
                          : c.status === "REJECTED"
                            ? "Opnieuw"
                            : "Bekijken"}
                      </Btn>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Panel>
    </div>
  );
}

// —————————————————————————————————————— Acties ——————————————————————————————————————
function Acties({ onMarkt, onFacturen }: { onMarkt: () => void; onFacturen: () => void }) {
  return (
    <div className="space-y-4">
      <ScreenHead
        code="SHEET · 04 ACTIES"
        title="Actielijst"
        sub="Gesorteerd op urgentie — werk van boven naar beneden."
      />
      <Panel className="overflow-hidden">
        <ol>
          {ACTIES.map((a, i) => {
            const warn = a.urgentie === "warning";
            const tone = warn ? C.warn : C.info;
            const goMarkt = a.cta.toLowerCase().includes("match");
            const goFacturen = a.cta.toLowerCase().includes("herinner");
            return (
              <li
                key={a.titel}
                className="flex items-start gap-3.5 p-4"
                style={{
                  borderTop: i === 0 ? "none" : `1px solid ${C.lineSoft}`,
                  background: i % 2 ? C.zebra : undefined,
                }}
              >
                <span
                  className="flex h-8 w-8 shrink-0 items-center justify-center rounded-[7px] text-[13px] font-bold"
                  style={{
                    background: `${tone}18`,
                    color: tone,
                    border: `1px solid ${tone}33`,
                    ...mono,
                  }}
                  aria-hidden="true"
                >
                  {String(i + 1).padStart(2, "0")}
                </span>
                <div className="min-w-0 flex-1">
                  <span
                    className="inline-flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.1em]"
                    style={{ color: tone, ...mono }}
                  >
                    {warn ? (
                      <AlertTriangle size={11} aria-hidden="true" />
                    ) : (
                      <Clock size={11} aria-hidden="true" />
                    )}
                    {warn ? "Urgent" : "Aanbevolen"}
                  </span>
                  <h2
                    className="mt-1 text-[14.5px] font-semibold leading-snug"
                    style={{ color: C.ink }}
                  >
                    {a.titel}
                  </h2>
                  <p
                    className="mt-0.5 max-w-lg text-[12.5px] leading-relaxed"
                    style={{ color: C.inkSoft }}
                  >
                    {a.detail}
                  </p>
                  <div className="mt-2.5">
                    <Btn
                      variant={warn ? "solid" : "outline"}
                      size="sm"
                      onClick={goMarkt ? onMarkt : goFacturen ? onFacturen : undefined}
                    >
                      {a.cta} <ArrowRight size={12} aria-hidden="true" />
                    </Btn>
                  </div>
                </div>
              </li>
            );
          })}
        </ol>
      </Panel>
    </div>
  );
}

// —————————————————————————————————————— Facturen ——————————————————————————————————————
function Facturen() {
  const [sort, setSort] = useState<"datum" | "bedrag">("datum");
  const rows = useMemo(
    () =>
      sort === "datum"
        ? FACTUREN
        : [...FACTUREN].sort((a, b) => parseEUR(b.bedrag) - parseEUR(a.bedrag)),
    [sort],
  );
  const totals = useMemo(() => {
    const sum = (status: string) =>
      FACTUREN.filter((f) => f.status === status).reduce((a, f) => a + parseEUR(f.bedrag), 0);
    return { betaald: sum("Betaald"), open: sum("Openstaand"), concept: sum("Concept") };
  }, []);
  return (
    <div className="space-y-4">
      <ScreenHead
        code="SHEET · 05 FACTUREN"
        title="Facturenblad"
        sub="Aggregaten boven, regels onder."
        right={
          <div className="flex items-center gap-1.5" role="group" aria-label="Sorteren">
            {(["datum", "bedrag"] as const).map((s) => (
              <Btn
                key={s}
                size="sm"
                variant={sort === s ? "solid" : "outline"}
                ariaPressed={sort === s}
                onClick={() => setSort(s)}
              >
                <ArrowUpDown size={11} aria-hidden="true" /> {s === "datum" ? "Datum" : "Bedrag"}
              </Btn>
            ))}
          </div>
        }
      />

      <Panel className="overflow-hidden">
        <div className="grid grid-cols-3">
          {[
            { l: "Betaald", v: totals.betaald, tone: C.pos, Icon: Check },
            { l: "Openstaand", v: totals.open, tone: C.warn, Icon: Clock },
            { l: "Concept", v: totals.concept, tone: C.info, Icon: FileText },
          ].map((s, i) => (
            <div
              key={s.l}
              className="p-4"
              style={{ borderRight: i < 2 ? `1px solid ${C.lineSoft}` : "none" }}
            >
              <div className="flex items-center justify-between">
                <p
                  className="text-[10px] font-semibold uppercase tracking-[0.1em]"
                  style={{ color: C.inkMute, ...mono }}
                >
                  {s.l}
                </p>
                <s.Icon size={13} aria-hidden="true" style={{ color: s.tone }} />
              </div>
              <p
                className="mt-1.5 text-[20px] font-bold leading-none"
                style={{ color: s.tone, ...mono }}
              >
                {eur0.format(s.v)}
              </p>
            </div>
          ))}
        </div>
      </Panel>

      <Panel className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left" style={{ minWidth: 560 }}>
            <caption className="sr-only">Facturen</caption>
            <thead>
              <tr style={{ background: C.head, borderBottom: `1px solid ${C.line}` }}>
                {["Nummer", "Klant", "Datum", "Bedrag", "Status"].map((h, i) => (
                  <th
                    key={h}
                    scope="col"
                    className={`px-3.5 py-2.5 text-[10px] font-semibold uppercase tracking-[0.08em] ${i === 3 ? "text-right" : ""}`}
                    style={{ color: C.inkMute, ...mono }}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((f, i) => {
                const t = factuurTone(f.status);
                return (
                  <tr
                    key={f.nr}
                    className="dt-row"
                    style={{
                      borderTop: i === 0 ? "none" : `1px solid ${C.lineSoft}`,
                      background: i % 2 ? C.zebra : undefined,
                    }}
                  >
                    <td className="px-3.5 py-3 text-[12px]" style={{ color: C.inkSoft, ...mono }}>
                      {f.nr}
                    </td>
                    <td className="px-3.5 py-3 text-[13px] font-semibold" style={{ color: C.ink }}>
                      {f.klant}
                    </td>
                    <td className="px-3.5 py-3 text-[12px]" style={{ color: C.inkMute, ...mono }}>
                      {f.datum}
                    </td>
                    <td
                      className="px-3.5 py-3 text-right text-[13px] font-bold"
                      style={{ color: C.ink, ...mono }}
                    >
                      {f.bedrag}
                    </td>
                    <td className="px-3.5 py-3">
                      <StatusTag {...t} alarm={false} />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Panel>
    </div>
  );
}
