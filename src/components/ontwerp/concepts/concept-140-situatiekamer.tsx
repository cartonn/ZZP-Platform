"use client";

// Concept 140 — "Situatiekamer" · ops-wallboard / NOC-statusmuur (donker). Een operationele
// controlekamer voor de bemiddelaar/admin: high-density multi-paneel wallboard op antraciet met
// live-aanvoelende status-tegels, een centrale "alles-in-één-oogopslag"-statuskolom, tellers en
// mini-grafieken, een prioriteiten-wachtrij (verificatie-queue) en severity-triage. Alles wat
// aandacht vraagt staat bovenaan; rust waar het kan. Severity is groen/amber/rood — ALTIJD met
// label + icoon, nooit kleur-alleen. Onderscheidend van Kiosk (touch, 10-voet), Scorebord
// (stadion-LED) en Beurs/Kader (handelsterminal): dit is een NOC-situatiekamer met wachtrijen en
// triage. Deterministisch — geen random, geen Date. Fonts: Geist (display) + Geist Mono (data).

import { useState } from "react";
import {
  ArrowRight,
  Check,
  Clock,
  AlertTriangle,
  XCircle,
  Search,
  Activity,
  ShieldCheck,
  ShieldAlert,
  Plus,
  MapPin,
  Coins,
  CalendarDays,
  Radio,
  Gauge,
  Layers,
  Signal,
  CircleDot,
  ListChecks,
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

// ── Palet — antraciet muur, koel cyaan/groen accent, amber/rood severity ────────
const C = {
  bg: "#080b11",
  wall: "#0b0f16", // muur-achtergrond
  panel: "#111826", // tegel
  panelHi: "#161f30", // opgelicht paneel
  panelSoft: "#0d131d",
  fg: "#e8eef7",
  fgSoft: "#96a3b8",
  fgFaint: "#5b6a80",
  line: "#1d2735",
  lineStrong: "#2b394d",
  cyan: "#22d3ee", // primair accent
  cyanDim: "#0e7490",
  green: "#34d399", // OK / geverifieerd
  amber: "#fbbf24", // let op
  red: "#f87171", // kritiek
  blue: "#60a5fa",
  grid: "#141c28",
};

const display = { fontFamily: "var(--font-lab-geist)" };
const mono = { fontFamily: "var(--font-lab-geist-mono)" };

// ── Severity-model — nooit kleur-alleen ─────────────────────────────────────────
type Severity = "ok" | "warn" | "crit";
function sev(s: Severity): { tone: string; label: string; Icon: LucideIcon } {
  switch (s) {
    case "ok":
      return { tone: C.green, label: "OK", Icon: Check };
    case "warn":
      return { tone: C.amber, label: "LET OP", Icon: AlertTriangle };
    case "crit":
      return { tone: C.red, label: "KRITIEK", Icon: ShieldAlert };
  }
}

function credSev(s: CredStatus): Severity {
  switch (s) {
    case "VERIFIED":
      return "ok";
    case "SUBMITTED":
      return "warn";
    case "EXPIRING":
      return "warn";
    case "REJECTED":
      return "crit";
  }
}
function credMeta(s: CredStatus): { label: string; Icon: LucideIcon; tone: string } {
  switch (s) {
    case "VERIFIED":
      return { label: "GEVERIFIEERD", Icon: Check, tone: C.green };
    case "SUBMITTED":
      return { label: "IN BEOORDELING", Icon: Clock, tone: C.blue };
    case "EXPIRING":
      return { label: "VERLOOPT", Icon: AlertTriangle, tone: C.amber };
    case "REJECTED":
      return { label: "AFGEWEZEN", Icon: XCircle, tone: C.red };
  }
}

// ── Bouwstenen — tegels met NOC-chrome ──────────────────────────────────────────
function Tile({
  children,
  className = "",
  glow,
  interactive = false,
}: {
  children: React.ReactNode;
  className?: string;
  glow?: string;
  interactive?: boolean;
}) {
  return (
    <div
      className={`relative rounded-lg ${
        interactive ? "transition-colors duration-150 hover:bg-[#161f30]" : ""
      } ${className}`}
      style={{
        background: C.panel,
        border: `1px solid ${C.line}`,
        ...(glow ? { boxShadow: `inset 0 0 0 1px ${glow}22, 0 0 18px -8px ${glow}66` } : null),
      }}
    >
      {children}
    </div>
  );
}

// Kop-label voor een paneel (NOC-stijl: mono, uppercase, met status-dot).
function PanelHead({
  children,
  Icon,
  right,
  dot,
}: {
  children: React.ReactNode;
  Icon?: LucideIcon;
  right?: React.ReactNode;
  dot?: string;
}) {
  return (
    <div
      className="flex items-center justify-between gap-2 border-b px-3.5 py-2.5"
      style={{ borderColor: C.line }}
    >
      <div className="flex min-w-0 items-center gap-2">
        {dot && (
          <span
            className="h-1.5 w-1.5 rounded-full"
            style={{ background: dot }}
            aria-hidden="true"
          />
        )}
        {Icon && <Icon size={13} strokeWidth={2.2} style={{ color: C.cyan }} aria-hidden="true" />}
        <span
          className="truncate text-[10.5px] font-bold uppercase tracking-[0.18em]"
          style={{ ...mono, color: C.fgSoft }}
        >
          {children}
        </span>
      </div>
      {right}
    </div>
  );
}

// Pulserende "live"-indicator (deterministisch via CSS).
function LiveDot({ tone = C.green, label = "LIVE" }: { tone?: string; label?: string }) {
  return (
    <span className="inline-flex items-center gap-1.5" aria-label={label}>
      <span className="relative flex h-2 w-2" aria-hidden="true">
        <span
          className="absolute inline-flex h-full w-full animate-ping rounded-full opacity-60 motion-reduce:animate-none"
          style={{ background: tone }}
        />
        <span className="relative inline-flex h-2 w-2 rounded-full" style={{ background: tone }} />
      </span>
      <span
        className="text-[9.5px] font-bold uppercase tracking-[0.2em]"
        style={{ ...mono, color: tone }}
      >
        {label}
      </span>
    </span>
  );
}

function SevBadge({ s }: { s: Severity }) {
  const m = sev(s);
  return (
    <span
      className="inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-[9.5px] font-bold uppercase tracking-[0.1em]"
      style={{ ...mono, background: `${m.tone}1a`, color: m.tone, border: `1px solid ${m.tone}40` }}
    >
      <m.Icon size={10} strokeWidth={2.8} aria-hidden="true" />
      {m.label}
    </span>
  );
}

// Mini bar-chart (deterministisch uit spark-data).
function MiniBars({ data, tone }: { data: number[]; tone: string }) {
  const max = Math.max(...data);
  return (
    <div className="flex h-8 items-end gap-[3px]" aria-hidden="true">
      {data.map((v, i) => (
        <span
          key={i}
          className="flex-1 rounded-sm"
          style={{
            height: `${Math.max(12, (v / max) * 100)}%`,
            background: i === data.length - 1 ? tone : `${tone}55`,
          }}
        />
      ))}
    </div>
  );
}

// Mini line-sparkline op donker.
function Spark({ data, tone }: { data: number[]; tone: string }) {
  const max = Math.max(...data);
  const min = Math.min(...data);
  const span = max - min || 1;
  const pts = data.map((v, i) => {
    const x = (i / (data.length - 1)) * 100;
    const y = 100 - ((v - min) / span) * 100;
    return `${x},${y}`;
  });
  return (
    <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="h-8 w-full" aria-hidden="true">
      <polyline
        points={`0,100 ${pts.join(" ")} 100,100`}
        fill={tone}
        opacity={0.14}
        stroke="none"
      />
      <polyline
        points={pts.join(" ")}
        fill="none"
        stroke={tone}
        strokeWidth={2.4}
        strokeLinecap="round"
        strokeLinejoin="round"
        vectorEffect="non-scaling-stroke"
      />
    </svg>
  );
}

// Gauge (halve boog) voor match/dekking.
function Arc({ value, tone, label }: { value: number; tone: string; label: string }) {
  const r = 30;
  const circ = Math.PI * r;
  const off = circ * (1 - value / 100);
  return (
    <div className="flex flex-col items-center">
      <svg viewBox="0 0 72 42" className="w-[72px]" aria-hidden="true">
        <path
          d="M6 38 A30 30 0 0 1 66 38"
          fill="none"
          stroke={C.grid}
          strokeWidth="7"
          strokeLinecap="round"
        />
        <path
          d="M6 38 A30 30 0 0 1 66 38"
          fill="none"
          stroke={tone}
          strokeWidth="7"
          strokeLinecap="round"
          strokeDasharray={circ}
          strokeDashoffset={off}
        />
        <text
          x="36"
          y="34"
          textAnchor="middle"
          style={mono}
          fontSize="15"
          fontWeight={700}
          fill={C.fg}
        >
          {value}
        </text>
      </svg>
      <span
        className="mt-1 text-[9px] font-bold uppercase tracking-[0.14em]"
        style={{ ...mono, color: C.fgFaint }}
      >
        {label}
      </span>
    </div>
  );
}

// Match-severity uit percentage.
function matchSev(m: number): Severity {
  if (m >= 90) return "ok";
  if (m >= 80) return "warn";
  return "crit";
}
function matchTone(m: number): string {
  return sev(matchSev(m)).tone;
}

// Achtergrond-raster voor de wallboard.
const wallGrid =
  "linear-gradient(0deg, rgba(34,211,238,0.03) 1px, transparent 1px)," +
  "linear-gradient(90deg, rgba(34,211,238,0.03) 1px, transparent 1px)";

// ── Root ────────────────────────────────────────────────────────────────────────
export function Concept140() {
  const [screen, setScreen] = useState<ScreenKey>("dashboard");
  const active = OPDRACHTEN[0] as Opdracht;

  return (
    <div
      className="min-h-screen w-full antialiased"
      style={{
        ...display,
        background: C.bg,
        backgroundImage: wallGrid,
        backgroundSize: "34px 34px",
        color: C.fg,
      }}
    >
      {/* Commando-balk */}
      <header
        className="sticky top-0 z-20 flex items-center justify-between gap-3 px-4 py-2.5 md:px-6"
        style={{
          background: "rgba(8,11,17,0.92)",
          borderBottom: `1px solid ${C.line}`,
          backdropFilter: "blur(6px)",
        }}
      >
        <div className="flex min-w-0 items-center gap-3">
          <span
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md"
            style={{ background: `${C.cyan}18`, border: `1px solid ${C.cyan}40` }}
            aria-hidden="true"
          >
            <Radio size={17} strokeWidth={2.2} style={{ color: C.cyan }} />
          </span>
          <div className="leading-none">
            <div className="flex items-center gap-2">
              <span
                className="text-[15px] font-semibold tracking-[-0.01em]"
                style={{ color: C.fg }}
              >
                Situatiekamer
              </span>
              <LiveDot />
            </div>
            <div
              className="mt-1 text-[9.5px] font-bold uppercase tracking-[0.2em]"
              style={{ ...mono, color: C.fgFaint }}
            >
              Bemiddeling · Operations
            </div>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="hidden items-center gap-4 md:flex" style={mono}>
            <StatChip label="SLA" value="99,2%" tone={C.green} />
            <StatChip label="QUEUE" value="4" tone={C.amber} />
            <StatChip label="INCIDENTS" value="1" tone={C.red} />
          </div>
          <span
            className="flex h-9 w-9 items-center justify-center rounded-md text-[11px] font-bold"
            style={{ background: C.panelHi, border: `1px solid ${C.line}`, color: C.cyan }}
            aria-hidden="true"
          >
            {PROFIEL.initialen}
          </span>
        </div>
      </header>

      {/* Scherm-selector */}
      <nav
        className="flex items-center gap-1 overflow-x-auto px-4 py-2 md:px-6"
        aria-label="Panelen"
        style={{ borderBottom: `1px solid ${C.line}` }}
      >
        {SCREENS.map((s) => {
          const on = s.key === screen;
          return (
            <button
              key={s.key}
              onClick={() => setScreen(s.key)}
              aria-current={on ? "page" : undefined}
              className="shrink-0 rounded-md px-3 py-1.5 text-[12px] font-semibold uppercase tracking-[0.08em] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-1"
              style={{
                ...mono,
                color: on ? C.bg : C.fgSoft,
                background: on ? C.cyan : "transparent",
                border: `1px solid ${on ? C.cyan : C.line}`,
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
            onQueue={() => setScreen("verificatie")}
            onOpen={() => setScreen("opdracht")}
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

function StatChip({ label, value, tone }: { label: string; value: string; tone: string }) {
  return (
    <span className="inline-flex items-center gap-1.5 text-[11px]">
      <span className="font-bold uppercase tracking-[0.14em]" style={{ color: C.fgFaint }}>
        {label}
      </span>
      <span className="font-bold tabular-nums" style={{ color: tone }}>
        {value}
      </span>
    </span>
  );
}

// ── Dashboard — de wallboard ─────────────────────────────────────────────────────
function Dashboard({ onQueue, onOpen }: { onQueue: () => void; onOpen: () => void }) {
  const tones = [C.cyan, C.blue, C.green, C.amber];
  const critAction = ACTIES.find((a) => a.urgentie === "warning") ?? ACTIES[0];
  const verified = CREDENTIALS.filter((c) => c.status === "VERIFIED").length;
  const dekPct = Math.round((verified / CREDENTIALS.length) * 100);
  const queue = CREDENTIALS.filter((c) => c.status !== "VERIFIED");

  return (
    <div className="space-y-4">
      {/* Aandacht-strook bovenaan */}
      <Tile
        glow={C.amber}
        className="flex flex-col gap-3 p-3.5 sm:flex-row sm:items-center sm:justify-between"
      >
        <div className="flex min-w-0 items-center gap-3">
          <span
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md"
            style={{ background: `${C.amber}18`, border: `1px solid ${C.amber}44` }}
            aria-hidden="true"
          >
            <AlertTriangle size={17} strokeWidth={2.4} style={{ color: C.amber }} />
          </span>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <SevBadge s="warn" />
              <span
                className="text-[10px] font-bold uppercase tracking-[0.14em]"
                style={{ ...mono, color: C.fgFaint }}
              >
                Prioriteit #1
              </span>
            </div>
            <div className="mt-1 truncate text-[14px] font-semibold" style={{ color: C.fg }}>
              {critAction?.titel}
            </div>
          </div>
        </div>
        <button
          onClick={onQueue}
          className="inline-flex shrink-0 items-center gap-2 rounded-md px-4 py-2 text-[12px] font-bold uppercase tracking-[0.08em] transition-colors hover:brightness-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-1"
          style={{ ...mono, background: C.amber, color: C.bg }}
        >
          Behandelen <ArrowRight size={14} aria-hidden="true" />
        </button>
      </Tile>

      {/* KPI-teller-rij */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {KPIS.map((k, i) => {
          const tone = tones[i % tones.length] as string;
          return (
            <Tile key={k.label} interactive>
              <div className="flex items-center justify-between px-3.5 pt-3">
                <span
                  className="text-[9.5px] font-bold uppercase tracking-[0.16em]"
                  style={{ ...mono, color: C.fgFaint }}
                >
                  {k.label}
                </span>
                <span
                  className="inline-flex items-center gap-0.5 text-[10.5px] font-bold tabular-nums"
                  style={{ ...mono, color: k.up ? C.green : C.amber }}
                >
                  {k.up ? "▲" : "▼"} {k.trend}
                </span>
              </div>
              <div className="px-3.5">
                <div
                  className="mt-1.5 text-[26px] font-semibold tabular-nums leading-none tracking-[-0.02em]"
                  style={{ ...mono, color: C.fg }}
                >
                  {k.value}
                </div>
              </div>
              <div className="px-3.5 pb-3 pt-2">
                {i % 2 === 0 ? (
                  <MiniBars data={k.spark} tone={tone} />
                ) : (
                  <Spark data={k.spark} tone={tone} />
                )}
              </div>
            </Tile>
          );
        })}
      </div>

      {/* Hoofd-raster: status-kolom + wachtrij + demand */}
      <div className="grid grid-cols-1 gap-3 lg:grid-cols-3">
        {/* Alles-in-één-oogopslag status-kolom */}
        <Tile className="lg:col-span-1">
          <PanelHead Icon={Gauge} dot={C.cyan} right={<LiveDot label="LIVE" />}>
            Systeemstatus
          </PanelHead>
          <div className="grid grid-cols-3 gap-2 p-3.5">
            <Arc value={92} tone={C.green} label="Match" />
            <Arc value={dekPct} tone={dekPct >= 80 ? C.green : C.amber} label="Dekking" />
            <Arc value={99} tone={C.cyan} label="SLA" />
          </div>
          <div className="space-y-px px-3.5 pb-3.5">
            {[
              { l: "Matching-engine", s: "ok" as Severity, v: "operationeel" },
              { l: "Verificatie-queue", s: "warn" as Severity, v: `${queue.length} open` },
              { l: "Documentopslag", s: "ok" as Severity, v: "gezond" },
              { l: "Facturatie", s: "warn" as Severity, v: "2 openstaand" },
            ].map((row) => {
              const m = sev(row.s);
              return (
                <div
                  key={row.l}
                  className="flex items-center justify-between rounded-md px-2.5 py-2"
                  style={{ background: C.panelSoft }}
                >
                  <span className="flex items-center gap-2 text-[12px]" style={{ color: C.fgSoft }}>
                    <m.Icon
                      size={13}
                      strokeWidth={2.4}
                      style={{ color: m.tone }}
                      aria-hidden="true"
                    />
                    {row.l}
                  </span>
                  <span
                    className="text-[11px] font-semibold tabular-nums"
                    style={{ ...mono, color: m.tone }}
                  >
                    {row.v}
                  </span>
                </div>
              );
            })}
          </div>
        </Tile>

        {/* Prioriteiten-wachtrij (verificatie-queue) */}
        <Tile className="lg:col-span-1">
          <PanelHead
            Icon={ListChecks}
            dot={C.amber}
            right={
              <button
                onClick={onQueue}
                className="text-[10px] font-bold uppercase tracking-[0.12em] transition-colors hover:text-white focus-visible:outline-none"
                style={{ ...mono, color: C.cyan }}
              >
                Open →
              </button>
            }
          >
            Verificatie-wachtrij
          </PanelHead>
          <ul className="divide-y" style={{ borderColor: C.line }}>
            {CREDENTIALS.map((c, i) => {
              const s = credSev(c.status);
              return (
                <li key={c.naam} className="flex items-center gap-3 px-3.5 py-2.5">
                  <span
                    className="text-[11px] font-bold tabular-nums"
                    style={{ ...mono, color: C.fgFaint }}
                  >
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-[13px] font-semibold" style={{ color: C.fg }}>
                      {c.naam}
                    </div>
                    <div className="truncate text-[11px]" style={{ color: C.fgFaint }}>
                      {c.detail}
                    </div>
                  </div>
                  <SevBadge s={s} />
                </li>
              );
            })}
          </ul>
        </Tile>

        {/* Demand-feed */}
        <Tile className="lg:col-span-1">
          <PanelHead Icon={Signal} dot={C.green}>
            Vraag · open opdrachten
          </PanelHead>
          <ul className="divide-y" style={{ borderColor: C.line }}>
            {OPDRACHTEN.map((o) => (
              <li key={o.id}>
                <button
                  onClick={onOpen}
                  className="flex w-full items-center gap-3 px-3.5 py-2.5 text-left transition-colors hover:bg-[#161f30] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-cyan-400/50"
                >
                  <span
                    className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md text-[12px] font-bold tabular-nums"
                    style={{
                      ...mono,
                      background: `${matchTone(o.match)}1a`,
                      border: `1px solid ${matchTone(o.match)}44`,
                      color: matchTone(o.match),
                    }}
                    aria-hidden="true"
                  >
                    {o.match}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-[13px] font-semibold" style={{ color: C.fg }}>
                      {o.titel}
                    </div>
                    <div className="truncate text-[11px]" style={{ color: C.fgFaint }}>
                      {o.opdrachtgever} · {o.plaats}
                    </div>
                  </div>
                  <ArrowRight
                    size={14}
                    className="shrink-0"
                    style={{ color: C.fgFaint }}
                    aria-hidden="true"
                  />
                </button>
              </li>
            ))}
          </ul>
        </Tile>
      </div>
    </div>
  );
}

// ── Marktplaats — demand board ───────────────────────────────────────────────────
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
        <div className="flex items-center gap-2">
          <Layers size={16} style={{ color: C.cyan }} aria-hidden="true" />
          <h2
            className="text-[15px] font-bold uppercase tracking-[0.12em]"
            style={{ ...mono, color: C.fg }}
          >
            Demand-board
          </h2>
          <LiveDot label="LIVE" />
        </div>
        <Tile className="flex items-center gap-2 px-3 py-1">
          <Search size={15} style={{ color: C.fgFaint }} aria-hidden="true" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="filter…"
            aria-label="Opdrachten filteren"
            className="w-40 bg-transparent py-1.5 text-[12.5px] outline-none placeholder:opacity-50"
            style={{ ...mono, color: C.fg }}
          />
          <span
            className="text-[11px] font-bold tabular-nums"
            style={{ ...mono, color: C.fgFaint }}
          >
            {filtered.length}
          </span>
        </Tile>
      </div>

      {filtered.length === 0 ? (
        <Tile className="flex flex-col items-center justify-center gap-3 p-14 text-center">
          <span
            className="flex h-12 w-12 items-center justify-center rounded-md"
            style={{ background: C.panelSoft, color: C.fgFaint }}
            aria-hidden="true"
          >
            <Search size={22} />
          </span>
          <p className="text-[14px] font-semibold" style={{ color: C.fg }}>
            Geen opdrachten in beeld
          </p>
          <p className="max-w-xs text-[12px]" style={{ color: C.fgSoft }}>
            Geen resultaat voor “{q}”. Pas het filter aan.
          </p>
          <button
            onClick={() => setQ("")}
            className="mt-1 rounded-md px-4 py-2 text-[11px] font-bold uppercase tracking-[0.1em] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-1"
            style={{ ...mono, background: C.cyan, color: C.bg }}
          >
            Filter wissen
          </button>
        </Tile>
      ) : (
        <Tile className="overflow-x-auto">
          <table className="w-full min-w-[640px] border-collapse text-left">
            <thead>
              <tr style={{ borderBottom: `1px solid ${C.line}` }}>
                {["#", "Opdracht", "Opdrachtgever", "Plaats", "Tarief", "Match", ""].map((h, i) => (
                  <th
                    key={i}
                    className="px-3.5 py-2.5 text-[9.5px] font-bold uppercase tracking-[0.14em]"
                    style={{ ...mono, color: C.fgFaint }}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((o) => {
                const t = matchTone(o.match);
                return (
                  <tr
                    key={o.id}
                    className="transition-colors hover:bg-[#161f30]"
                    style={{ borderBottom: `1px solid ${C.line}` }}
                  >
                    <td
                      className="px-3.5 py-3 text-[11px] tabular-nums"
                      style={{ ...mono, color: C.fgFaint }}
                    >
                      {o.id}
                    </td>
                    <td className="px-3.5 py-3">
                      <div className="text-[13px] font-semibold" style={{ color: C.fg }}>
                        {o.titel}
                      </div>
                      <div className="mt-0.5 flex flex-wrap gap-1">
                        {o.tags.map((tg) => (
                          <span
                            key={tg}
                            className="rounded px-1.5 py-0.5 text-[9.5px] font-semibold"
                            style={{
                              ...mono,
                              background: C.panelSoft,
                              color: C.fgSoft,
                              border: `1px solid ${C.line}`,
                            }}
                          >
                            {tg}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="px-3.5 py-3 text-[12.5px]" style={{ color: C.fgSoft }}>
                      {o.opdrachtgever}
                    </td>
                    <td className="px-3.5 py-3 text-[12.5px]" style={{ color: C.fgSoft }}>
                      {o.plaats}
                    </td>
                    <td
                      className="px-3.5 py-3 text-[12.5px] tabular-nums"
                      style={{ ...mono, color: C.fg }}
                    >
                      {o.tarief}
                    </td>
                    <td className="px-3.5 py-3">
                      <span className="inline-flex items-center gap-1.5">
                        <span
                          className="h-1.5 w-1.5 rounded-full"
                          style={{ background: t }}
                          aria-hidden="true"
                        />
                        <span
                          className="text-[13px] font-bold tabular-nums"
                          style={{ ...mono, color: t }}
                        >
                          {o.match}%
                        </span>
                      </span>
                    </td>
                    <td className="px-3.5 py-3 text-right">
                      <button
                        onClick={onOpen}
                        className="inline-flex items-center gap-1 rounded-md px-2.5 py-1.5 text-[10.5px] font-bold uppercase tracking-[0.08em] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-1"
                        style={{
                          ...mono,
                          background: C.panelHi,
                          color: C.cyan,
                          border: `1px solid ${C.line}`,
                        }}
                      >
                        Open <ArrowRight size={12} aria-hidden="true" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </Tile>
      )}
    </div>
  );
}

// ── Opdracht-detail — incident/opdracht-paneel ──────────────────────────────────
function OpdrachtDetail({ opdracht, onBack }: { opdracht: Opdracht; onBack: () => void }) {
  const feiten: { l: string; v: string; Icon: LucideIcon }[] = [
    { l: "Tarief", v: opdracht.tarief, Icon: Coins },
    { l: "Omvang", v: opdracht.uren, Icon: Clock },
    { l: "Start", v: opdracht.start, Icon: CalendarDays },
    { l: "Plaats", v: opdracht.plaats, Icon: MapPin },
  ];
  const t = matchTone(opdracht.match);
  return (
    <div className="space-y-4">
      <button
        onClick={onBack}
        className="inline-flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.1em] transition-opacity hover:opacity-70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-1"
        style={{ ...mono, color: C.fgSoft }}
      >
        <ArrowRight size={13} className="rotate-180" aria-hidden="true" /> Terug naar board
      </button>

      <Tile glow={t}>
        <div className="flex flex-wrap items-center justify-between gap-3 p-4">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <span
                className="text-[10.5px] font-bold uppercase tracking-[0.16em]"
                style={{ ...mono, color: C.fgFaint }}
              >
                {opdracht.id}
              </span>
              <span
                className="inline-flex items-center gap-1.5 rounded px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.1em]"
                style={{ ...mono, background: `${t}1a`, color: t, border: `1px solid ${t}44` }}
              >
                <CircleDot size={11} strokeWidth={2.6} aria-hidden="true" /> Match {opdracht.match}%
              </span>
            </div>
            <h1
              className="mt-2 text-[24px] font-semibold leading-tight tracking-[-0.02em] sm:text-[28px]"
              style={{ ...display, color: C.fg }}
            >
              {opdracht.titel}
            </h1>
            <p className="mt-1 text-[12.5px]" style={{ color: C.fgSoft }}>
              {opdracht.opdrachtgever} · {opdracht.plaats}
            </p>
          </div>
          <Arc value={opdracht.match} tone={t} label="Match-score" />
        </div>
      </Tile>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {feiten.map((m) => (
          <Tile key={m.l} className="p-3.5">
            <m.Icon size={15} style={{ color: C.cyan }} aria-hidden="true" />
            <div
              className="mt-2 text-[16px] font-semibold tabular-nums leading-none"
              style={{ ...mono, color: C.fg }}
            >
              {m.v}
            </div>
            <div
              className="mt-1.5 text-[9.5px] font-bold uppercase tracking-[0.12em]"
              style={{ ...mono, color: C.fgFaint }}
            >
              {m.l}
            </div>
          </Tile>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
        <Tile>
          <PanelHead Icon={Check} dot={C.green}>
            Signalen · past
          </PanelHead>
          <ul className="space-y-2 p-3.5">
            {opdracht.redenen.plus.map((r) => (
              <li
                key={r}
                className="flex items-start gap-2.5 text-[13px] leading-snug"
                style={{ color: C.fgSoft }}
              >
                <Check
                  size={15}
                  strokeWidth={2.6}
                  className="mt-0.5 shrink-0"
                  style={{ color: C.green }}
                  aria-hidden="true"
                />
                {r}
              </li>
            ))}
          </ul>
        </Tile>
        <Tile>
          <PanelHead Icon={AlertTriangle} dot={C.amber}>
            Signalen · aandacht
          </PanelHead>
          <ul className="space-y-2 p-3.5">
            {opdracht.redenen.min.map((r) => (
              <li
                key={r}
                className="flex items-start gap-2.5 text-[13px] leading-snug"
                style={{ color: C.fgSoft }}
              >
                <AlertTriangle
                  size={14}
                  strokeWidth={2.6}
                  className="mt-0.5 shrink-0"
                  style={{ color: C.amber }}
                  aria-hidden="true"
                />
                {r}
              </li>
            ))}
          </ul>
        </Tile>
      </div>

      <div className="flex flex-col items-stretch gap-3 sm:flex-row">
        <button
          className="group inline-flex flex-1 items-center justify-center gap-2 rounded-md px-6 py-3 text-[12.5px] font-bold uppercase tracking-[0.1em] transition-all hover:brightness-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-1"
          style={{ ...mono, background: C.cyan, color: C.bg }}
        >
          Matchen &amp; toewijzen <ArrowRight size={15} aria-hidden="true" />
        </button>
        <button
          className="inline-flex items-center justify-center gap-2 rounded-md px-5 py-3 text-[12.5px] font-bold uppercase tracking-[0.1em] transition-colors hover:bg-[#161f30] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-1"
          style={{ ...mono, border: `1px solid ${C.lineStrong}`, color: C.fg }}
        >
          Parkeren
        </button>
      </div>
    </div>
  );
}

// ── Verificatie — prioriteiten-wachtrij / triage ────────────────────────────────
function Verificatie() {
  const verified = CREDENTIALS.filter((c) => c.status === "VERIFIED").length;
  const pct = Math.round((verified / CREDENTIALS.length) * 100);
  const open = CREDENTIALS.filter((c) => c.status !== "VERIFIED");
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <ShieldCheck size={16} style={{ color: C.cyan }} aria-hidden="true" />
        <h2
          className="text-[15px] font-bold uppercase tracking-[0.12em]"
          style={{ ...mono, color: C.fg }}
        >
          Verificatie-triage
        </h2>
      </div>

      {/* Samenvattings-tellers */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          { l: "Geverifieerd", v: `${verified}`, tone: C.green, Icon: Check },
          {
            l: "In beoordeling",
            v: `${CREDENTIALS.filter((c) => c.status === "SUBMITTED").length}`,
            tone: C.blue,
            Icon: Clock,
          },
          {
            l: "Verloopt",
            v: `${CREDENTIALS.filter((c) => c.status === "EXPIRING").length}`,
            tone: C.amber,
            Icon: AlertTriangle,
          },
          { l: "Dekking", v: `${pct}%`, tone: pct >= 80 ? C.green : C.amber, Icon: Gauge },
        ].map((s) => (
          <Tile key={s.l} className="p-3.5">
            <div className="flex items-center justify-between">
              <span
                className="text-[9.5px] font-bold uppercase tracking-[0.14em]"
                style={{ ...mono, color: C.fgFaint }}
              >
                {s.l}
              </span>
              <s.Icon size={14} strokeWidth={2.4} style={{ color: s.tone }} aria-hidden="true" />
            </div>
            <div
              className="mt-2 text-[24px] font-semibold tabular-nums leading-none"
              style={{ ...mono, color: s.tone }}
            >
              {s.v}
            </div>
          </Tile>
        ))}
      </div>

      {/* Triage-queue */}
      <Tile>
        <PanelHead
          Icon={ListChecks}
          dot={open.length ? C.amber : C.green}
          right={
            <span
              className="text-[10px] font-bold uppercase tabular-nums tracking-[0.12em]"
              style={{ ...mono, color: C.fgFaint }}
            >
              {open.length} in wachtrij
            </span>
          }
        >
          Prioriteiten-wachtrij
        </PanelHead>
        <ul className="divide-y" style={{ borderColor: C.line }}>
          {CREDENTIALS.map((c, i) => {
            const cm = credMeta(c.status);
            const s = credSev(c.status);
            const actionable = c.status !== "VERIFIED";
            return (
              <li key={c.naam} className="flex flex-wrap items-center gap-3 px-3.5 py-3">
                <span
                  className="text-[12px] font-bold tabular-nums"
                  style={{ ...mono, color: C.fgFaint }}
                >
                  {String(i + 1).padStart(2, "0")}
                </span>
                <span
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md"
                  style={{
                    background: `${cm.tone}18`,
                    border: `1px solid ${cm.tone}40`,
                    color: cm.tone,
                  }}
                  aria-hidden="true"
                >
                  <cm.Icon size={16} strokeWidth={2.4} />
                </span>
                <div className="min-w-0 flex-1">
                  <div className="text-[14px] font-semibold" style={{ color: C.fg }}>
                    {c.naam}
                  </div>
                  <div className="text-[11.5px]" style={{ color: C.fgFaint }}>
                    {c.detail}
                  </div>
                </div>
                <SevBadge s={s} />
                <span
                  className="inline-flex items-center gap-1 rounded px-2 py-1 text-[9.5px] font-bold uppercase tracking-[0.1em]"
                  style={{ ...mono, background: `${cm.tone}12`, color: cm.tone }}
                >
                  {cm.label}
                </span>
                <button
                  disabled={!actionable}
                  className="rounded-md px-3 py-1.5 text-[10.5px] font-bold uppercase tracking-[0.08em] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-1 disabled:cursor-not-allowed disabled:opacity-40"
                  style={{
                    ...mono,
                    background: actionable ? C.cyan : C.panelSoft,
                    color: actionable ? C.bg : C.fgFaint,
                    border: `1px solid ${actionable ? C.cyan : C.line}`,
                  }}
                >
                  {actionable ? "Beoordeel" : "Afgehandeld"}
                </button>
              </li>
            );
          })}
        </ul>
      </Tile>
    </div>
  );
}

// ── Acties — alert-triage ────────────────────────────────────────────────────────
function Acties() {
  const sorted = [...ACTIES].sort((a, b) =>
    a.urgentie === b.urgentie ? 0 : a.urgentie === "warning" ? -1 : 1,
  );
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Activity size={16} style={{ color: C.cyan }} aria-hidden="true" />
        <h2
          className="text-[15px] font-bold uppercase tracking-[0.12em]"
          style={{ ...mono, color: C.fg }}
        >
          Alert-triage
        </h2>
      </div>
      <ol className="space-y-3">
        {sorted.map((a, i) => {
          const s: Severity = a.urgentie === "warning" ? "warn" : "ok";
          const m = sev(s);
          return (
            <li key={a.titel}>
              <Tile
                glow={a.urgentie === "warning" ? C.amber : undefined}
                className="flex flex-col gap-3 p-3.5 sm:flex-row sm:items-center"
              >
                <span
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md text-[14px] font-bold tabular-nums"
                  style={{
                    ...mono,
                    background: `${m.tone}16`,
                    border: `1px solid ${m.tone}40`,
                    color: m.tone,
                  }}
                  aria-hidden="true"
                >
                  {i + 1}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <SevBadge s={s} />
                    <h3 className="text-[14.5px] font-semibold" style={{ color: C.fg }}>
                      {a.titel}
                    </h3>
                  </div>
                  <p className="mt-1 text-[12.5px] leading-relaxed" style={{ color: C.fgSoft }}>
                    {a.detail}
                  </p>
                </div>
                <button
                  className="shrink-0 self-start rounded-md px-4 py-2 text-[11px] font-bold uppercase tracking-[0.08em] transition-colors hover:brightness-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-1 sm:self-center"
                  style={{ ...mono, background: m.tone, color: C.bg }}
                >
                  {a.cta}
                </button>
              </Tile>
            </li>
          );
        })}
      </ol>
    </div>
  );
}

// ── Facturen — financieel paneel ─────────────────────────────────────────────────
function Facturen() {
  const total = "€ 8.622";
  const meta = (status: string): { tone: string; s: Severity } => {
    if (status === "Betaald") return { tone: C.green, s: "ok" };
    if (status === "Openstaand") return { tone: C.amber, s: "warn" };
    if (status === "Concept") return { tone: C.fgFaint, s: "ok" };
    return { tone: C.blue, s: "ok" };
  };
  const open = FACTUREN.filter((f) => f.status === "Openstaand").length;
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Coins size={16} style={{ color: C.cyan }} aria-hidden="true" />
          <h2
            className="text-[15px] font-bold uppercase tracking-[0.12em]"
            style={{ ...mono, color: C.fg }}
          >
            Financieel paneel
          </h2>
        </div>
        <button
          className="inline-flex items-center gap-2 rounded-md px-4 py-2 text-[11px] font-bold uppercase tracking-[0.1em] transition-colors hover:brightness-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-1"
          style={{ ...mono, background: C.cyan, color: C.bg }}
        >
          <Plus size={14} aria-hidden="true" /> Nieuwe factuur
        </button>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {[
          { l: "Betaald (mnd)", v: total, tone: C.green },
          { l: "Openstaand", v: `${open}`, tone: C.amber },
          {
            l: "Concept",
            v: `${FACTUREN.filter((f) => f.status === "Concept").length}`,
            tone: C.fgFaint,
          },
        ].map((s) => (
          <Tile key={s.l} className="p-3.5">
            <span
              className="text-[9.5px] font-bold uppercase tracking-[0.14em]"
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
          </Tile>
        ))}
      </div>

      <Tile className="overflow-x-auto">
        <table className="w-full min-w-[560px] border-collapse text-left">
          <thead>
            <tr style={{ borderBottom: `1px solid ${C.line}` }}>
              {["Nummer", "Klant", "Datum", "Status", "Bedrag"].map((h, i) => (
                <th
                  key={h}
                  className={`px-3.5 py-2.5 text-[9.5px] font-bold uppercase tracking-[0.14em] ${i === 4 ? "text-right" : ""}`}
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
                  className="transition-colors hover:bg-[#161f30]"
                  style={{ borderBottom: `1px solid ${C.line}` }}
                >
                  <td
                    className="px-3.5 py-3 text-[12px] tabular-nums"
                    style={{ ...mono, color: C.fgSoft }}
                  >
                    {f.nr}
                  </td>
                  <td className="px-3.5 py-3 text-[13px]" style={{ color: C.fg }}>
                    {f.klant}
                  </td>
                  <td
                    className="px-3.5 py-3 text-[12px] tabular-nums"
                    style={{ ...mono, color: C.fgSoft }}
                  >
                    {f.datum}
                  </td>
                  <td className="px-3.5 py-3">
                    <span
                      className="inline-flex items-center gap-1.5 rounded px-2 py-1 text-[10px] font-bold uppercase tracking-[0.08em]"
                      style={{
                        ...mono,
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
                    className="px-3.5 py-3 text-right text-[14px] font-semibold tabular-nums"
                    style={{ ...mono, color: C.fg }}
                  >
                    {f.bedrag}
                  </td>
                </tr>
              );
            })}
          </tbody>
          <tfoot>
            <tr style={{ borderTop: `2px solid ${C.lineStrong}` }}>
              <td
                colSpan={4}
                className="px-3.5 py-3.5 text-[9.5px] font-bold uppercase tracking-[0.14em]"
                style={{ ...mono, color: C.fgFaint }}
              >
                Totaal betaald
              </td>
              <td
                className="px-3.5 py-3.5 text-right text-[17px] font-bold tabular-nums"
                style={{ ...mono, color: C.green }}
              >
                {total}
              </td>
            </tr>
          </tfoot>
        </table>
      </Tile>
    </div>
  );
}
