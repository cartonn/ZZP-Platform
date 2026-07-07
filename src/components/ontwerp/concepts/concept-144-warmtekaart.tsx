"use client";

// Concept 144 — "Warmtekaart" · data-viz-gedreven heatmap-designtaal. De hele UI is georganiseerd
// rond warmte-/dichtheidskaarten: een calendar-heatmap voor beschikbaarheid/diensten, matrix-cellen
// met kleurdichtheid (match-sterkte per opdracht × criterium), een choropleth-achtige regio-dichtheid
// en cel-rasters waarin intensiteit = kleurverzadiging. Discrete legenda's — nooit kleur-alleen: elke
// cel toont óók een cijfer/label. Strak, analytisch, licht met een sequentiële schaal (blauw→teal→
// amber). Onderscheidend: geen ander concept is heatmap-gedreven. Deterministisch — geen random/Date.
// Fonts: Geist (UI) + IBM Plex Mono (data/cijfers).

import { useState } from "react";
import {
  ArrowRight,
  Check,
  Clock,
  AlertTriangle,
  XCircle,
  Search,
  Grid3x3,
  CalendarDays,
  MapPin,
  Coins,
  ShieldCheck,
  Zap,
  LayoutGrid,
  Plus,
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

// ── Palet — licht/analytisch papier, sequentiële heat-schaal blauw→teal→amber ─────
const C = {
  bg: "#f7f9fc",
  panel: "#ffffff",
  panelSoft: "#f2f5fa",
  fg: "#0f1b2d",
  fgSoft: "#51607a",
  fgFaint: "#8493ab",
  line: "#e4e9f2",
  lineStrong: "#cdd6e6",
  accent: "#0d9488", // teal — primaire accent
  accentDeep: "#0f766e",
  warn: "#d97706",
  bad: "#dc2626",
  ok: "#0d9488",
  info: "#2563eb",
};

const ui = { fontFamily: "var(--font-lab-geist)" };
const mono = { fontFamily: "var(--font-lab-plex-mono)" };

// ── Sequentiële heat-schaal (6 discrete stappen, blauw→teal→amber) ────────────────
// Elke stap heeft een achtergrond én een tekstkleur met voldoende contrast, zodat de
// cel-inhoud (cijfer/label) altijd leesbaar is — status nooit op kleur alleen.
type HeatStep = { bg: string; fg: string; ring: string };
const H0: HeatStep = { bg: "#eef3fb", fg: "#3f5170", ring: "#dbe4f2" }; // koudst
const H1: HeatStep = { bg: "#d6e6fb", fg: "#1e4272", ring: "#b9d3f4" };
const H2: HeatStep = { bg: "#bfe6ec", fg: "#0f5560", ring: "#9fd6df" };
const H3: HeatStep = { bg: "#8fd8cf", fg: "#0a4a44", ring: "#69c7ba" };
const H4: HeatStep = { bg: "#f6d98a", fg: "#7a4d05", ring: "#eec463" };
const H5: HeatStep = { bg: "#f2ab54", fg: "#5c3103", ring: "#e79433" }; // heetst
const HEAT: HeatStep[] = [H0, H1, H2, H3, H4, H5];

// Bucket een 0..100-waarde naar een van de 6 heat-stappen (nooit undefined).
function heat(v: number): HeatStep {
  if (v >= 92) return H5;
  if (v >= 84) return H4;
  if (v >= 74) return H3;
  if (v >= 60) return H2;
  if (v >= 45) return H1;
  return H0;
}

const LEGEND_LABELS = ["0–44", "45–59", "60–73", "74–83", "84–91", "92+"];

// ── Kleine bouwstenen ─────────────────────────────────────────────────────────────
function Panel({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <section
      className={`rounded-xl ${className}`}
      style={{ background: C.panel, border: `1px solid ${C.line}` }}
    >
      {children}
    </section>
  );
}

function PanelHead({
  children,
  Icon,
  right,
}: {
  children: React.ReactNode;
  Icon?: LucideIcon;
  right?: React.ReactNode;
}) {
  return (
    <div
      className="flex items-center justify-between gap-2 border-b px-4 py-3"
      style={{ borderColor: C.line }}
    >
      <div className="flex min-w-0 items-center gap-2">
        {Icon && (
          <Icon size={15} strokeWidth={2.2} style={{ color: C.accent }} aria-hidden="true" />
        )}
        <h2
          className="truncate text-[13px] font-semibold tracking-[-0.01em]"
          style={{ color: C.fg }}
        >
          {children}
        </h2>
      </div>
      {right}
    </div>
  );
}

// De discrete legenda voor de sequentiële schaal (nooit kleur-alleen: cijferbereik erbij).
function HeatLegend({ label = "Intensiteit" }: { label?: string }) {
  return (
    <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5">
      <span
        className="text-[10px] font-semibold uppercase tracking-[0.14em]"
        style={{ ...mono, color: C.fgFaint }}
      >
        {label}
      </span>
      <div className="flex items-center gap-1">
        {HEAT.map((h, i) => (
          <span key={i} className="flex flex-col items-center gap-0.5">
            <span
              className="h-3.5 w-6 rounded-[3px]"
              style={{ background: h.bg, border: `1px solid ${h.ring}` }}
              aria-hidden="true"
            />
            <span className="text-[8.5px] tabular-nums" style={{ ...mono, color: C.fgFaint }}>
              {LEGEND_LABELS[i] ?? ""}
            </span>
          </span>
        ))}
      </div>
    </div>
  );
}

// Eén heat-cel met verplichte tekstinhoud.
function HeatCell({
  value,
  suffix = "",
  size = "md",
  title,
}: {
  value: number;
  suffix?: string;
  size?: "sm" | "md" | "lg";
  title?: string;
}) {
  const h = heat(value);
  const dims =
    size === "lg" ? "h-14 text-[17px]" : size === "sm" ? "h-8 text-[11px]" : "h-11 text-[14px]";
  return (
    <div
      className={`flex ${dims} items-center justify-center rounded-md font-semibold tabular-nums transition-transform duration-150 hover:scale-[1.04]`}
      style={{ ...mono, background: h.bg, color: h.fg, border: `1px solid ${h.ring}` }}
      title={title}
    >
      {value}
      {suffix}
    </div>
  );
}

function credMeta(s: CredStatus): { label: string; Icon: LucideIcon; tone: string; heat: number } {
  switch (s) {
    case "VERIFIED":
      return { label: "Geverifieerd", Icon: Check, tone: C.ok, heat: 95 };
    case "SUBMITTED":
      return { label: "In beoordeling", Icon: Clock, tone: C.info, heat: 62 };
    case "EXPIRING":
      return { label: "Verloopt binnenkort", Icon: AlertTriangle, tone: C.warn, heat: 80 };
    case "REJECTED":
      return { label: "Afgewezen", Icon: XCircle, tone: C.bad, heat: 20 };
  }
}

// ── Deterministische heat-datasets (geen random) ─────────────────────────────────
// Calendar-heatmap: 5 weken × 7 dagen; waarde = geplande dienst-intensiteit (0..5-stap ~ %).
const WEEK_DAYS = ["ma", "di", "wo", "do", "vr", "za", "zo"];
const CAL_WEEKS: number[][] = [
  [30, 55, 78, 40, 90, 0, 0],
  [62, 74, 88, 66, 94, 20, 0],
  [48, 80, 70, 92, 84, 0, 0],
  [70, 60, 96, 82, 78, 46, 0],
  [55, 88, 74, 90, 62, 0, 0],
];

// Match-matrix: rijen = opdrachten, kolommen = criteria; waarde = deelmatch (0..100).
const CRITERIA = ["Skills", "Locatie", "Tarief", "Beschikbaarheid", "Verificatie"];
const MATCH_MATRIX: Record<string, number[]> = {
  "OPD-2041": [96, 92, 90, 74, 100],
  "OPD-2038": [88, 66, 78, 90, 100],
  "OPD-2035": [82, 88, 84, 70, 92],
};

// Choropleth-achtige regio-dichtheid: vraag per regio (aantal open opdrachten → % van piek).
const REGIOS: { naam: string; dichtheid: number; open: number }[] = [
  { naam: "Utrecht", dichtheid: 96, open: 12 },
  { naam: "Almere", dichtheid: 78, open: 8 },
  { naam: "Amersfoort", dichtheid: 60, open: 5 },
  { naam: "Zeist", dichtheid: 48, open: 4 },
  { naam: "Hilversum", dichtheid: 30, open: 2 },
  { naam: "Nieuwegein", dichtheid: 18, open: 1 },
];

// ── Root ──────────────────────────────────────────────────────────────────────────
export function Concept144() {
  const [screen, setScreen] = useState<ScreenKey>("dashboard");
  const active = OPDRACHTEN[0] as Opdracht;

  return (
    <div
      className="min-h-screen w-full antialiased"
      style={{ ...ui, background: C.bg, color: C.fg }}
    >
      <header
        className="sticky top-0 z-20 flex items-center justify-between gap-3 px-4 py-3 md:px-6"
        style={{
          background: "rgba(247,249,252,0.9)",
          borderBottom: `1px solid ${C.line}`,
          backdropFilter: "blur(8px)",
        }}
      >
        <div className="flex min-w-0 items-center gap-3">
          <span
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg"
            style={{ background: H3.bg, border: `1px solid ${H3.ring}` }}
            aria-hidden="true"
          >
            <LayoutGrid size={17} strokeWidth={2.2} style={{ color: C.accentDeep }} />
          </span>
          <div className="leading-tight">
            <div className="text-[15px] font-semibold tracking-[-0.01em]">Warmtekaart</div>
            <div
              className="text-[10px] font-semibold uppercase tracking-[0.18em]"
              style={{ ...mono, color: C.fgFaint }}
            >
              Dichtheid &amp; match-intensiteit
            </div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="hidden sm:block">
            <HeatLegend />
          </div>
          <span
            className="flex h-9 w-9 items-center justify-center rounded-lg text-[11px] font-bold"
            style={{
              ...mono,
              background: C.panelSoft,
              border: `1px solid ${C.line}`,
              color: C.accentDeep,
            }}
            aria-hidden="true"
          >
            {PROFIEL.initialen}
          </span>
        </div>
      </header>

      <nav
        className="flex items-center gap-1 overflow-x-auto px-4 py-2 md:px-6"
        aria-label="Schermen"
        style={{ borderBottom: `1px solid ${C.line}` }}
      >
        {SCREENS.map((s) => {
          const on = s.key === screen;
          return (
            <button
              key={s.key}
              onClick={() => setScreen(s.key)}
              aria-current={on ? "page" : undefined}
              className="shrink-0 rounded-lg px-3 py-1.5 text-[12.5px] font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-1"
              style={{
                color: on ? "#ffffff" : C.fgSoft,
                background: on ? C.accentDeep : "transparent",
                boxShadow: on ? "none" : `inset 0 0 0 1px ${C.line}`,
              }}
            >
              {s.label}
            </button>
          );
        })}
      </nav>

      <main className="px-4 py-5 md:px-6 md:py-6">
        {screen === "dashboard" && (
          <Dashboard
            onOpen={() => setScreen("opdracht")}
            onQueue={() => setScreen("verificatie")}
          />
        )}
        {screen === "marktplaats" && <Marktplaats onOpen={() => setScreen("opdracht")} />}
        {screen === "opdracht" && (
          <OpdrachtDetail opdracht={active} onBack={() => setScreen("marktplaats")} />
        )}
        {screen === "verificatie" && <Verificatie />}
        {screen === "acties" && <Acties />}
        {screen === "facturen" && <Facturen />}
      </main>
    </div>
  );
}

// ── Dashboard ──────────────────────────────────────────────────────────────────────
function Dashboard({ onOpen, onQueue }: { onOpen: () => void; onQueue: () => void }) {
  return (
    <div className="space-y-5">
      {/* KPI-strook als heat-tegels met mini-heatstrip */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {KPIS.map((k) => {
          const max = Math.max(...k.spark);
          const min = Math.min(...k.spark);
          return (
            <Panel key={k.label} className="p-4">
              <div className="flex items-center justify-between">
                <span
                  className="text-[10.5px] font-semibold uppercase tracking-[0.1em]"
                  style={{ ...mono, color: C.fgFaint }}
                >
                  {k.label}
                </span>
                <span
                  className="text-[11px] font-bold tabular-nums"
                  style={{ ...mono, color: k.up ? C.ok : C.warn }}
                >
                  {k.up ? "▲" : "▼"} {k.trend}
                </span>
              </div>
              <div
                className="mt-1.5 text-[24px] font-semibold tabular-nums leading-none tracking-[-0.02em]"
                style={mono}
              >
                {k.value}
              </div>
              {/* Mini-heatstrip: elke maand-waarde als heat-cel */}
              <div className="mt-3 flex gap-1" aria-hidden="true">
                {k.spark.map((v, i) => {
                  const norm = max === min ? 60 : Math.round(((v - min) / (max - min)) * 100);
                  const h = heat(norm);
                  return (
                    <span
                      key={i}
                      className="h-6 flex-1 rounded-[3px]"
                      style={{ background: h.bg, border: `1px solid ${h.ring}` }}
                    />
                  );
                })}
              </div>
            </Panel>
          );
        })}
      </div>

      <div className="grid grid-cols-1 gap-5 xl:grid-cols-3">
        {/* Calendar-heatmap: beschikbaarheid/diensten */}
        <Panel className="xl:col-span-2">
          <PanelHead Icon={CalendarDays} right={<HeatLegend label="Bezetting" />}>
            Dienst-bezetting · komende 5 weken
          </PanelHead>
          <div className="overflow-x-auto p-4">
            <div className="min-w-[420px]">
              <div className="mb-1.5 grid grid-cols-[2.5rem_repeat(7,1fr)] gap-1.5">
                <span aria-hidden="true" />
                {WEEK_DAYS.map((d) => (
                  <span
                    key={d}
                    className="text-center text-[10px] font-semibold uppercase tracking-[0.08em]"
                    style={{ ...mono, color: C.fgFaint }}
                  >
                    {d}
                  </span>
                ))}
              </div>
              {CAL_WEEKS.map((week, wi) => (
                <div key={wi} className="mb-1.5 grid grid-cols-[2.5rem_repeat(7,1fr)] gap-1.5">
                  <span
                    className="flex items-center text-[10px] font-semibold uppercase tracking-[0.08em]"
                    style={{ ...mono, color: C.fgFaint }}
                  >
                    wk {28 + wi}
                  </span>
                  {week.map((v, di) => {
                    const empty = v === 0;
                    const h = heat(v);
                    return (
                      <div
                        key={di}
                        className="flex h-10 items-center justify-center rounded-md text-[12px] font-semibold tabular-nums"
                        style={{
                          ...mono,
                          background: empty ? C.panelSoft : h.bg,
                          color: empty ? C.fgFaint : h.fg,
                          border: `1px solid ${empty ? C.line : h.ring}`,
                        }}
                        title={empty ? "Geen dienst" : `Bezetting ${v}%`}
                      >
                        {empty ? "—" : `${v}`}
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>
          </div>
        </Panel>

        {/* Choropleth-achtige regio-dichtheid */}
        <Panel>
          <PanelHead Icon={MapPin}>Vraag-dichtheid per regio</PanelHead>
          <ul className="p-4">
            {REGIOS.map((r) => {
              const h = heat(r.dichtheid);
              return (
                <li key={r.naam} className="flex items-center gap-3 py-1.5">
                  <span className="w-24 shrink-0 text-[13px] font-medium" style={{ color: C.fg }}>
                    {r.naam}
                  </span>
                  <div
                    className="relative h-6 flex-1 overflow-hidden rounded-md"
                    style={{ background: C.panelSoft, border: `1px solid ${C.line}` }}
                  >
                    <div
                      className="absolute inset-y-0 left-0 rounded-md"
                      style={{
                        width: `${r.dichtheid}%`,
                        background: h.bg,
                        borderRight: `2px solid ${h.ring}`,
                      }}
                      aria-hidden="true"
                    />
                    <span
                      className="absolute inset-0 flex items-center px-2 text-[11px] font-semibold tabular-nums"
                      style={{ ...mono, color: h.fg }}
                    >
                      {r.open} open
                    </span>
                  </div>
                </li>
              );
            })}
          </ul>
        </Panel>
      </div>

      {/* Match-matrix + aandacht-actie */}
      <div className="grid grid-cols-1 gap-5 xl:grid-cols-3">
        <Panel className="xl:col-span-2">
          <PanelHead Icon={Grid3x3} right={<HeatLegend label="Match" />}>
            Match-matrix · opdracht × criterium
          </PanelHead>
          <div className="overflow-x-auto p-4">
            <table className="w-full min-w-[560px] border-separate border-spacing-1">
              <thead>
                <tr>
                  <th
                    className="pb-1 text-left text-[10px] font-semibold uppercase tracking-[0.1em]"
                    style={{ ...mono, color: C.fgFaint }}
                  >
                    Opdracht
                  </th>
                  {CRITERIA.map((c) => (
                    <th
                      key={c}
                      className="pb-1 text-center text-[10px] font-semibold uppercase tracking-[0.06em]"
                      style={{ ...mono, color: C.fgFaint }}
                    >
                      {c}
                    </th>
                  ))}
                  <th
                    className="pb-1 text-center text-[10px] font-semibold uppercase tracking-[0.1em]"
                    style={{ ...mono, color: C.fgFaint }}
                  >
                    Totaal
                  </th>
                </tr>
              </thead>
              <tbody>
                {OPDRACHTEN.map((o) => {
                  const row = MATCH_MATRIX[o.id] ?? [];
                  return (
                    <tr key={o.id}>
                      <td className="pr-2">
                        <button
                          onClick={onOpen}
                          className="max-w-[180px] truncate text-left text-[12.5px] font-medium transition-colors hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-1"
                          style={{ color: C.fg }}
                        >
                          {o.titel}
                        </button>
                      </td>
                      {row.map((v, i) => (
                        <td key={i}>
                          <HeatCell value={v} size="sm" title={`${CRITERIA[i]}: ${v}%`} />
                        </td>
                      ))}
                      <td>
                        <HeatCell
                          value={o.match}
                          suffix=""
                          size="sm"
                          title={`Totaal ${o.match}%`}
                        />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Panel>

        <Panel className="flex flex-col justify-between p-4">
          <div>
            <div className="flex items-center gap-2">
              <span
                className="flex h-8 w-8 items-center justify-center rounded-md"
                style={{ background: H4.bg, border: `1px solid ${H4.ring}` }}
                aria-hidden="true"
              >
                <AlertTriangle size={16} strokeWidth={2.4} style={{ color: C.warn }} />
              </span>
              <span
                className="text-[10px] font-semibold uppercase tracking-[0.12em]"
                style={{ ...mono, color: C.warn }}
              >
                Hoogste urgentie
              </span>
            </div>
            <h3 className="mt-3 text-[15px] font-semibold leading-snug tracking-[-0.01em]">
              {ACTIES[0]?.titel}
            </h3>
            <p className="mt-1.5 text-[12.5px] leading-relaxed" style={{ color: C.fgSoft }}>
              {ACTIES[0]?.detail}
            </p>
          </div>
          <button
            onClick={onQueue}
            className="mt-4 inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-[13px] font-semibold text-white transition-transform hover:scale-[1.01] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-1"
            style={{ background: C.accentDeep }}
          >
            {ACTIES[0]?.cta} <ArrowRight size={15} aria-hidden="true" />
          </button>
        </Panel>
      </div>
    </div>
  );
}

// ── Marktplaats ─────────────────────────────────────────────────────────────────────
function Marktplaats({ onOpen }: { onOpen: () => void }) {
  const [q, setQ] = useState("");
  const filtered = OPDRACHTEN.filter(
    (o) =>
      o.titel.toLowerCase().includes(q.toLowerCase()) ||
      o.plaats.toLowerCase().includes(q.toLowerCase()) ||
      o.opdrachtgever.toLowerCase().includes(q.toLowerCase()),
  );

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-[16px] font-semibold tracking-[-0.01em]">Marktplaats</h2>
        <div
          className="flex items-center gap-2 rounded-lg px-3 py-1.5"
          style={{ background: C.panel, border: `1px solid ${C.line}` }}
        >
          <Search size={15} style={{ color: C.fgFaint }} aria-hidden="true" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Filter op titel, plaats…"
            aria-label="Opdrachten filteren"
            className="w-44 bg-transparent text-[13px] outline-none placeholder:opacity-60"
            style={{ color: C.fg }}
          />
        </div>
      </div>

      {filtered.length === 0 ? (
        <Panel className="flex flex-col items-center justify-center gap-3 p-14 text-center">
          <span
            className="flex h-12 w-12 items-center justify-center rounded-lg"
            style={{ background: C.panelSoft, color: C.fgFaint }}
            aria-hidden="true"
          >
            <Search size={22} />
          </span>
          <p className="text-[14px] font-semibold">Geen opdrachten gevonden</p>
          <p className="max-w-xs text-[12.5px]" style={{ color: C.fgSoft }}>
            Geen resultaat voor “{q}”. Pas je filter aan.
          </p>
          <button
            onClick={() => setQ("")}
            className="mt-1 rounded-lg px-4 py-2 text-[12.5px] font-semibold text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-1"
            style={{ background: C.accentDeep }}
          >
            Filter wissen
          </button>
        </Panel>
      ) : (
        <div className="grid grid-cols-1 gap-3 lg:grid-cols-3">
          {filtered.map((o) => {
            const row = MATCH_MATRIX[o.id] ?? [];
            return (
              <Panel key={o.id} className="flex flex-col p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <span
                      className="text-[10px] font-semibold uppercase tracking-[0.1em]"
                      style={{ ...mono, color: C.fgFaint }}
                    >
                      {o.id}
                    </span>
                    <h3 className="mt-0.5 text-[14.5px] font-semibold leading-snug tracking-[-0.01em]">
                      {o.titel}
                    </h3>
                    <p className="mt-0.5 text-[12px]" style={{ color: C.fgSoft }}>
                      {o.opdrachtgever} · {o.plaats}
                    </p>
                  </div>
                  <HeatCell value={o.match} suffix="%" size="lg" title={`Match ${o.match}%`} />
                </div>

                {/* Deel-match als heat-rij */}
                <div className="mt-3 grid grid-cols-5 gap-1">
                  {row.map((v, i) => (
                    <div key={i} className="flex flex-col items-center gap-1">
                      <HeatCell value={v} size="sm" title={`${CRITERIA[i]}: ${v}%`} />
                      <span
                        className="text-[8.5px] uppercase tracking-[0.04em]"
                        style={{ ...mono, color: C.fgFaint }}
                      >
                        {(CRITERIA[i] ?? "").slice(0, 4)}
                      </span>
                    </div>
                  ))}
                </div>

                <div className="mt-3 flex flex-wrap gap-1">
                  {o.tags.map((t) => (
                    <span
                      key={t}
                      className="rounded-md px-2 py-0.5 text-[10.5px] font-medium"
                      style={{
                        background: C.panelSoft,
                        color: C.fgSoft,
                        border: `1px solid ${C.line}`,
                      }}
                    >
                      {t}
                    </span>
                  ))}
                </div>

                <div
                  className="mt-3 flex items-center justify-between border-t pt-3"
                  style={{ borderColor: C.line }}
                >
                  <span className="text-[13px] font-semibold tabular-nums" style={mono}>
                    {o.tarief}
                  </span>
                  <button
                    onClick={onOpen}
                    className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-[12px] font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-1"
                    style={{
                      background: C.panelSoft,
                      color: C.accentDeep,
                      border: `1px solid ${C.lineStrong}`,
                    }}
                  >
                    Bekijken <ArrowRight size={13} aria-hidden="true" />
                  </button>
                </div>
              </Panel>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ── Opdracht-detail ─────────────────────────────────────────────────────────────────
function OpdrachtDetail({ opdracht, onBack }: { opdracht: Opdracht; onBack: () => void }) {
  const row = MATCH_MATRIX[opdracht.id] ?? [];
  const feiten: { l: string; v: string; Icon: LucideIcon }[] = [
    { l: "Tarief", v: opdracht.tarief, Icon: Coins },
    { l: "Omvang", v: opdracht.uren, Icon: Clock },
    { l: "Start", v: opdracht.start, Icon: CalendarDays },
    { l: "Plaats", v: opdracht.plaats, Icon: MapPin },
  ];

  return (
    <div className="space-y-5">
      <button
        onClick={onBack}
        className="inline-flex items-center gap-2 text-[12.5px] font-medium transition-opacity hover:opacity-70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-1"
        style={{ color: C.fgSoft }}
      >
        <ArrowRight size={14} className="rotate-180" aria-hidden="true" /> Terug naar marktplaats
      </button>

      <Panel className="p-5">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="min-w-0">
            <span
              className="text-[10.5px] font-semibold uppercase tracking-[0.12em]"
              style={{ ...mono, color: C.fgFaint }}
            >
              {opdracht.id}
            </span>
            <h1 className="mt-1 text-[24px] font-semibold leading-tight tracking-[-0.02em] sm:text-[27px]">
              {opdracht.titel}
            </h1>
            <p className="mt-1 text-[13px]" style={{ color: C.fgSoft }}>
              {opdracht.opdrachtgever} · {opdracht.plaats}
            </p>
          </div>
          <div className="flex flex-col items-center gap-1">
            <HeatCell
              value={opdracht.match}
              suffix="%"
              size="lg"
              title={`Match ${opdracht.match}%`}
            />
            <span
              className="text-[10px] font-semibold uppercase tracking-[0.1em]"
              style={{ ...mono, color: C.fgFaint }}
            >
              Totaalmatch
            </span>
          </div>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {feiten.map((f) => (
            <div
              key={f.l}
              className="rounded-lg p-3"
              style={{ background: C.panelSoft, border: `1px solid ${C.line}` }}
            >
              <f.Icon size={15} style={{ color: C.accent }} aria-hidden="true" />
              <div
                className="mt-2 text-[15px] font-semibold tabular-nums leading-none"
                style={mono}
              >
                {f.v}
              </div>
              <div
                className="mt-1.5 text-[10px] font-semibold uppercase tracking-[0.1em]"
                style={{ ...mono, color: C.fgFaint }}
              >
                {f.l}
              </div>
            </div>
          ))}
        </div>
      </Panel>

      {/* Match-opbouw als heat-strook */}
      <Panel>
        <PanelHead Icon={Grid3x3} right={<HeatLegend label="Deelmatch" />}>
          Match-opbouw per criterium
        </PanelHead>
        <div className="grid grid-cols-2 gap-3 p-4 sm:grid-cols-5">
          {CRITERIA.map((c, i) => (
            <div key={c} className="flex flex-col items-center gap-2">
              <HeatCell value={row[i] ?? 0} suffix="%" size="lg" title={`${c}: ${row[i] ?? 0}%`} />
              <span className="text-center text-[11px] font-medium" style={{ color: C.fgSoft }}>
                {c}
              </span>
            </div>
          ))}
        </div>
      </Panel>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <Panel>
          <PanelHead Icon={Check}>Waarom dit past</PanelHead>
          <ul className="space-y-2.5 p-4">
            {opdracht.redenen.plus.map((r) => (
              <li
                key={r}
                className="flex items-start gap-2.5 text-[13px] leading-snug"
                style={{ color: C.fgSoft }}
              >
                <span
                  className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded"
                  style={{ background: H3.bg, border: `1px solid ${H3.ring}` }}
                  aria-hidden="true"
                >
                  <Check size={11} strokeWidth={3} style={{ color: H3.fg }} />
                </span>
                {r}
              </li>
            ))}
          </ul>
        </Panel>
        <Panel>
          <PanelHead Icon={AlertTriangle}>Aandachtspunten</PanelHead>
          <ul className="space-y-2.5 p-4">
            {opdracht.redenen.min.map((r) => (
              <li
                key={r}
                className="flex items-start gap-2.5 text-[13px] leading-snug"
                style={{ color: C.fgSoft }}
              >
                <span
                  className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded"
                  style={{ background: H4.bg, border: `1px solid ${H4.ring}` }}
                  aria-hidden="true"
                >
                  <AlertTriangle size={11} strokeWidth={2.6} style={{ color: H4.fg }} />
                </span>
                {r}
              </li>
            ))}
          </ul>
        </Panel>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row">
        <button
          className="inline-flex flex-1 items-center justify-center gap-2 rounded-lg px-6 py-3 text-[13.5px] font-semibold text-white transition-transform hover:scale-[1.01] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-1"
          style={{ background: C.accentDeep }}
        >
          Reageren op opdracht <ArrowRight size={15} aria-hidden="true" />
        </button>
        <button
          className="inline-flex items-center justify-center gap-2 rounded-lg px-5 py-3 text-[13.5px] font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-1"
          style={{ background: C.panel, color: C.fg, border: `1px solid ${C.lineStrong}` }}
        >
          Bewaren
        </button>
      </div>
    </div>
  );
}

// ── Verificatie ─────────────────────────────────────────────────────────────────────
function Verificatie() {
  const verified = CREDENTIALS.filter((c) => c.status === "VERIFIED").length;
  const pct = Math.round((verified / CREDENTIALS.length) * 100);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <ShieldCheck size={17} style={{ color: C.accent }} aria-hidden="true" />
          <h2 className="text-[16px] font-semibold tracking-[-0.01em]">
            Verificatie &amp; certificaten
          </h2>
        </div>
        <div
          className="flex items-center gap-2 rounded-lg px-3 py-1.5"
          style={{ background: C.panel, border: `1px solid ${C.line}` }}
        >
          <span
            className="text-[11px] font-semibold uppercase tracking-[0.1em]"
            style={{ ...mono, color: C.fgFaint }}
          >
            Dekking
          </span>
          <HeatCell value={pct} suffix="%" size="sm" title={`Dekking ${pct}%`} />
        </div>
      </div>

      <Panel>
        <PanelHead Icon={ShieldCheck} right={<HeatLegend label="Vertrouwen" />}>
          Certificaten · vertrouwens-intensiteit
        </PanelHead>
        <ul className="divide-y" style={{ borderColor: C.line }}>
          {CREDENTIALS.map((c) => {
            const m = credMeta(c.status);
            const actionable = c.status !== "VERIFIED";
            return (
              <li key={c.naam} className="flex flex-wrap items-center gap-3 px-4 py-3">
                <HeatCell value={m.heat} size="sm" title={`Vertrouwen ${m.heat}%`} />
                <div className="min-w-0 flex-1">
                  <div className="text-[14px] font-semibold" style={{ color: C.fg }}>
                    {c.naam}
                  </div>
                  <div className="text-[12px]" style={{ color: C.fgFaint }}>
                    {c.detail}
                  </div>
                </div>
                <span
                  className="inline-flex items-center gap-1.5 rounded-md px-2.5 py-1 text-[11px] font-semibold"
                  style={{
                    background: `${m.tone}14`,
                    color: m.tone,
                    border: `1px solid ${m.tone}33`,
                  }}
                >
                  <m.Icon size={13} strokeWidth={2.4} aria-hidden="true" />
                  {m.label}
                </span>
                <button
                  disabled={!actionable}
                  className="rounded-lg px-3 py-1.5 text-[12px] font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-1 disabled:cursor-not-allowed disabled:opacity-40"
                  style={{
                    background: actionable ? C.accentDeep : C.panelSoft,
                    color: actionable ? "#ffffff" : C.fgFaint,
                    border: `1px solid ${actionable ? C.accentDeep : C.line}`,
                  }}
                >
                  {actionable ? "Behandelen" : "Afgehandeld"}
                </button>
              </li>
            );
          })}
        </ul>
      </Panel>
    </div>
  );
}

// ── Acties ──────────────────────────────────────────────────────────────────────────
function Acties() {
  const sorted = [...ACTIES].sort((a, b) =>
    a.urgentie === b.urgentie ? 0 : a.urgentie === "warning" ? -1 : 1,
  );
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Zap size={17} style={{ color: C.accent }} aria-hidden="true" />
        <h2 className="text-[16px] font-semibold tracking-[-0.01em]">Volgende beste acties</h2>
      </div>
      <ol className="space-y-3">
        {sorted.map((a, i) => {
          const heatVal = a.urgentie === "warning" ? 88 : 62;
          const h = heat(heatVal);
          const tone = a.urgentie === "warning" ? C.warn : C.info;
          return (
            <li key={a.titel}>
              <Panel className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center">
                <span
                  className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg text-[15px] font-bold tabular-nums"
                  style={{ ...mono, background: h.bg, color: h.fg, border: `1px solid ${h.ring}` }}
                  aria-hidden="true"
                >
                  {i + 1}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span
                      className="inline-flex items-center gap-1 rounded px-2 py-0.5 text-[10.5px] font-semibold uppercase tracking-[0.08em]"
                      style={{
                        background: `${tone}16`,
                        color: tone,
                        border: `1px solid ${tone}33`,
                      }}
                    >
                      {a.urgentie === "warning" ? (
                        <AlertTriangle size={11} strokeWidth={2.6} aria-hidden="true" />
                      ) : (
                        <Zap size={11} strokeWidth={2.6} aria-hidden="true" />
                      )}
                      {a.urgentie === "warning" ? "Urgent" : "Kans"}
                    </span>
                    <h3 className="text-[14.5px] font-semibold">{a.titel}</h3>
                  </div>
                  <p className="mt-1 text-[12.5px] leading-relaxed" style={{ color: C.fgSoft }}>
                    {a.detail}
                  </p>
                </div>
                <button
                  className="shrink-0 self-start rounded-lg px-4 py-2 text-[12.5px] font-semibold text-white transition-transform hover:scale-[1.02] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-1 sm:self-center"
                  style={{ background: C.accentDeep }}
                >
                  {a.cta}
                </button>
              </Panel>
            </li>
          );
        })}
      </ol>
    </div>
  );
}

// ── Facturen ────────────────────────────────────────────────────────────────────────
function Facturen() {
  const meta = (status: string): { tone: string; heat: number } => {
    if (status === "Betaald") return { tone: C.ok, heat: 95 };
    if (status === "Openstaand") return { tone: C.warn, heat: 80 };
    if (status === "Concept") return { tone: C.fgFaint, heat: 30 };
    return { tone: C.info, heat: 62 };
  };
  const open = FACTUREN.filter((f) => f.status === "Openstaand").length;
  // Maandelijkse omzet-intensiteit (heat-kalender per maand).
  const OMZET: { m: string; v: number }[] = [
    { m: "jan", v: 40 },
    { m: "feb", v: 55 },
    { m: "mrt", v: 62 },
    { m: "apr", v: 58 },
    { m: "mei", v: 74 },
    { m: "jun", v: 88 },
    { m: "jul", v: 82 },
    { m: "aug", v: 46 },
  ];

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Coins size={17} style={{ color: C.accent }} aria-hidden="true" />
          <h2 className="text-[16px] font-semibold tracking-[-0.01em]">Facturen</h2>
        </div>
        <button
          className="inline-flex items-center gap-2 rounded-lg px-4 py-2 text-[12.5px] font-semibold text-white transition-transform hover:scale-[1.01] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-1"
          style={{ background: C.accentDeep }}
        >
          <Plus size={14} aria-hidden="true" /> Nieuwe factuur
        </button>
      </div>

      {/* Omzet-heatstrook per maand */}
      <Panel className="p-4">
        <div className="mb-3 flex items-center justify-between">
          <span className="text-[12px] font-semibold" style={{ color: C.fgSoft }}>
            Omzet-intensiteit per maand
          </span>
          <HeatLegend label="Omzet" />
        </div>
        <div className="flex gap-1.5 overflow-x-auto">
          {OMZET.map(({ m, v }) => {
            const h = heat(v);
            return (
              <div key={m} className="flex min-w-[52px] flex-1 flex-col items-center gap-1.5">
                <div
                  className="flex h-14 w-full items-end justify-center rounded-md pb-1 text-[11px] font-semibold tabular-nums"
                  style={{ ...mono, background: h.bg, color: h.fg, border: `1px solid ${h.ring}` }}
                  title={`${m}: index ${v}`}
                >
                  {v}
                </div>
                <span className="text-[10px] uppercase" style={{ ...mono, color: C.fgFaint }}>
                  {m}
                </span>
              </div>
            );
          })}
        </div>
      </Panel>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {[
          { l: "Betaald (mnd)", v: "€ 8.622", tone: C.ok },
          { l: "Openstaand", v: `${open}`, tone: C.warn },
          {
            l: "Concept",
            v: `${FACTUREN.filter((f) => f.status === "Concept").length}`,
            tone: C.fgFaint,
          },
        ].map((s) => (
          <Panel key={s.l} className="p-4">
            <span
              className="text-[10.5px] font-semibold uppercase tracking-[0.1em]"
              style={{ ...mono, color: C.fgFaint }}
            >
              {s.l}
            </span>
            <div
              className="mt-1.5 text-[22px] font-semibold tabular-nums leading-none"
              style={{ ...mono, color: s.tone }}
            >
              {s.v}
            </div>
          </Panel>
        ))}
      </div>

      <Panel className="overflow-x-auto">
        <table className="w-full min-w-[560px] border-collapse text-left">
          <thead>
            <tr style={{ borderBottom: `1px solid ${C.line}` }}>
              {["Nummer", "Klant", "Datum", "Status", "Bedrag"].map((h, i) => (
                <th
                  key={h}
                  className={`px-4 py-2.5 text-[10px] font-semibold uppercase tracking-[0.1em] ${i === 4 ? "text-right" : ""}`}
                  style={{ ...mono, color: C.fgFaint }}
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {FACTUREN.map((f) => {
              const m = meta(f.status);
              return (
                <tr
                  key={f.nr}
                  className="transition-colors hover:bg-[#f2f5fa]"
                  style={{ borderBottom: `1px solid ${C.line}` }}
                >
                  <td
                    className="px-4 py-3 text-[12px] tabular-nums"
                    style={{ ...mono, color: C.fgSoft }}
                  >
                    {f.nr}
                  </td>
                  <td className="px-4 py-3 text-[13px] font-medium">{f.klant}</td>
                  <td
                    className="px-4 py-3 text-[12px] tabular-nums"
                    style={{ ...mono, color: C.fgSoft }}
                  >
                    {f.datum}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className="inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-[11px] font-semibold"
                      style={{
                        background: `${m.tone}14`,
                        color: m.tone,
                        border: `1px solid ${m.tone}33`,
                      }}
                    >
                      <span
                        className="h-1.5 w-1.5 rounded-full"
                        style={{ background: m.tone }}
                        aria-hidden="true"
                      />
                      {f.status}
                    </span>
                  </td>
                  <td
                    className="px-4 py-3 text-right text-[14px] font-semibold tabular-nums"
                    style={mono}
                  >
                    {f.bedrag}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </Panel>
    </div>
  );
}
