"use client";

// Concept 134 — "Cockpit" · avionics glass-cockpit HUD (donker).
// Een modern vliegtuig-glascockpit: donker antraciet/navy paneel (#0a0f14 / #0d141c),
// avionics-groen (#3ee08a) en amber-waarschuwing (#ffb454) op gedempte instrument-hairlines.
// Een primary-flight-display-achtige statuskern in het midden, checklist-blokken die alleen
// tonen wat NU actie vraagt (next-best-action = "checklist/alert"), subtiele glow op actieve
// waarden. Attentie-hiërarchie is de kern: het systeem toont alleen wat telt. Onderscheidend
// van "meter" (analoge wijzerplaten) en "console" (terminal-tekst): dit is een MODERN
// GLASS-COCKPIT met attention-managed panelen en checklists. Fonts: Geist Mono + Geist.

import { useMemo, useState } from "react";
import {
  ArrowRight,
  Check,
  Clock,
  AlertTriangle,
  XCircle,
  Search,
  ShieldCheck,
  Plus,
  Radar,
  Gauge,
  Plane,
  Activity,
  ChevronRight,
  CircleDot,
  Signal,
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

// Avionics glass-cockpit palet — donker navy/antraciet met groen/amber HUD-accenten.
const C = {
  bg: "#070b10", // buiten-cockpit, diepe nacht
  panel: "#0c131b", // instrumentpaneel
  panelSoft: "#111a24", // opgetild paneel
  panelHi: "#16212e", // hover/actief paneel
  fg: "#dce7ef", // primaire HUD-tekst
  fgSoft: "#8aa0b2", // gedempte tekst
  fgFaint: "#586c7d", // labels
  green: "#3ee08a", // avionics-groen (nominaal / actief)
  greenDim: "#2a9d63",
  amber: "#ffb454", // caution
  amberDim: "#c98a34",
  red: "#ff5d6c", // warning
  cyan: "#5fd0e6", // koers/data
  line: "#1c2a38", // instrument-hairline
  lineSoft: "#152029",
  glow: "rgba(62,224,138,0.35)",
};

const ui = { fontFamily: "var(--font-lab-geist)" };
const mono = { fontFamily: "var(--font-lab-geist-mono)" };

// ── Status-codering ──────────────────────────────────────────────────────────
function statusMeta(s: CredStatus): {
  label: string;
  Icon: LucideIcon;
  tone: string;
  code: string;
} {
  switch (s) {
    case "VERIFIED":
      return { label: "Nominaal", Icon: Check, tone: C.green, code: "OK" };
    case "SUBMITTED":
      return { label: "In beoordeling", Icon: Clock, tone: C.cyan, code: "PROC" };
    case "EXPIRING":
      return { label: "Caution", Icon: AlertTriangle, tone: C.amber, code: "CTN" };
    case "REJECTED":
      return { label: "Warning", Icon: XCircle, tone: C.red, code: "WARN" };
  }
}

// Instrument-hairline grid als achtergrondtextuur.
const gridTexture =
  "linear-gradient(rgba(62,224,138,0.028) 1px, transparent 1px)," +
  "linear-gradient(90deg, rgba(62,224,138,0.028) 1px, transparent 1px)," +
  "radial-gradient(120% 90% at 50% -10%, rgba(23,42,58,0.9), transparent 60%)," +
  "radial-gradient(90% 70% at 90% 110%, rgba(62,224,138,0.05), transparent 60%)";

// ── Bouwstenen ────────────────────────────────────────────────────────────────
function Panel({
  children,
  className = "",
  interactive = false,
  tone,
  active = false,
}: {
  children: React.ReactNode;
  className?: string;
  interactive?: boolean;
  tone?: string;
  active?: boolean;
}) {
  return (
    <div
      className={`relative rounded-lg ${
        interactive
          ? "transition-all duration-200 hover:-translate-y-px motion-reduce:hover:translate-y-0"
          : ""
      } ${className}`}
      style={{
        background: active ? C.panelHi : C.panel,
        border: `1px solid ${tone ? `${tone}55` : C.line}`,
        boxShadow: tone
          ? `inset 0 0 0 1px ${tone}12, 0 0 22px -14px ${tone}`
          : "inset 0 1px 0 rgba(255,255,255,0.02)",
      }}
    >
      {children}
    </div>
  );
}

// HUD-label: strak, mono, uppercase, wide tracking.
function HudLabel({ children, tone = C.fgFaint }: { children: React.ReactNode; tone?: string }) {
  return (
    <span
      className="text-[10px] font-medium uppercase tracking-[0.24em]"
      style={{ ...mono, color: tone }}
    >
      {children}
    </span>
  );
}

function Chip({
  children,
  tone,
  solid = false,
}: {
  children: React.ReactNode;
  tone: string;
  solid?: boolean;
}) {
  return (
    <span
      className="inline-flex items-center gap-1.5 rounded px-2 py-0.5 text-[10.5px] font-medium uppercase tracking-[0.1em]"
      style={
        solid
          ? { background: tone, color: C.bg, ...mono }
          : { background: `${tone}14`, color: tone, border: `1px solid ${tone}44`, ...mono }
      }
    >
      {children}
    </span>
  );
}

// Sparkline in HUD-stijl.
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
    <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="h-7 w-full" aria-hidden="true">
      <polyline points={`0,100 ${pts.join(" ")} 100,100`} fill={tone} opacity={0.1} stroke="none" />
      <polyline
        points={pts.join(" ")}
        fill="none"
        stroke={tone}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
        vectorEffect="non-scaling-stroke"
      />
    </svg>
  );
}

// Primary Flight Display — een attitude/koers-achtige statuskern voor de match.
function PFD({ value, label = "MATCH" }: { value: number; label?: string }) {
  // Boog van -120° tot 120° gemapt op 0..100.
  const angle = -120 + (value / 100) * 240;
  const r = 40;
  const cx = 50;
  const cy = 50;
  const rad = (angle * Math.PI) / 180;
  const nx = cx + Math.sin(rad) * r;
  const ny = cy - Math.cos(rad) * r;
  const tone = value >= 90 ? C.green : value >= 80 ? C.amber : C.cyan;
  // Ticks
  const ticks = [0, 20, 40, 60, 80, 100];
  return (
    <div className="relative aspect-square w-full" aria-hidden="true">
      <svg viewBox="0 0 100 100" className="h-full w-full">
        <circle cx={cx} cy={cy} r={46} fill="none" stroke={C.line} strokeWidth="0.6" />
        <circle cx={cx} cy={cy} r={r} fill="none" stroke={C.lineSoft} strokeWidth="6" />
        {/* Actieve boog */}
        <path
          d={describeArc(cx, cy, r, -120, angle)}
          fill="none"
          stroke={tone}
          strokeWidth="6"
          strokeLinecap="round"
          style={{ filter: `drop-shadow(0 0 4px ${tone})` }}
        />
        {ticks.map((t) => {
          const a = -120 + (t / 100) * 240;
          const ar = (a * Math.PI) / 180;
          const x1 = cx + Math.sin(ar) * 44;
          const y1 = cy - Math.cos(ar) * 44;
          const x2 = cx + Math.sin(ar) * 48;
          const y2 = cy - Math.cos(ar) * 48;
          return (
            <line key={t} x1={x1} y1={y1} x2={x2} y2={y2} stroke={C.fgFaint} strokeWidth="0.8" />
          );
        })}
        {/* Naald */}
        <line
          x1={cx}
          y1={cy}
          x2={nx}
          y2={ny}
          stroke={tone}
          strokeWidth="1.4"
          strokeLinecap="round"
        />
        <circle cx={cx} cy={cy} r={2.4} fill={tone} />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span
          className="text-[26px] font-semibold tabular-nums leading-none"
          style={{ ...mono, color: tone }}
        >
          {value}
        </span>
        <span
          className="mt-1 text-[8.5px] font-medium uppercase tracking-[0.28em]"
          style={{ ...mono, color: C.fgFaint }}
        >
          {label}
        </span>
      </div>
    </div>
  );
}

function polarToCartesian(cx: number, cy: number, r: number, angleDeg: number) {
  const a = (angleDeg * Math.PI) / 180;
  return { x: cx + Math.sin(a) * r, y: cy - Math.cos(a) * r };
}
function describeArc(cx: number, cy: number, r: number, startAngle: number, endAngle: number) {
  const start = polarToCartesian(cx, cy, r, endAngle);
  const end = polarToCartesian(cx, cy, r, startAngle);
  const largeArc = Math.abs(endAngle - startAngle) > 180 ? 1 : 0;
  return `M ${end.x} ${end.y} A ${r} ${r} 0 ${largeArc} 1 ${start.x} ${start.y}`;
}

// ── Root ────────────────────────────────────────────────────────────────────
export function Concept134() {
  const [screen, setScreen] = useState<ScreenKey>("dashboard");
  const active = OPDRACHTEN[0] as Opdracht;

  return (
    <div
      className="min-h-[680px] w-full antialiased"
      style={{
        ...ui,
        background: C.bg,
        backgroundImage: gridTexture,
        backgroundSize: "26px 26px, 26px 26px, cover, cover",
        color: C.fg,
      }}
    >
      {/* Bovenbalk — status/master-warning */}
      <header className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-5 pt-6 md:px-9">
        <div className="flex items-center gap-3">
          <span
            className="flex h-10 w-10 items-center justify-center rounded-md"
            style={{
              background: `${C.green}12`,
              border: `1px solid ${C.green}55`,
              boxShadow: `0 0 18px -8px ${C.glow}`,
            }}
          >
            <Plane size={18} strokeWidth={2.2} style={{ color: C.green }} aria-hidden="true" />
          </span>
          <div className="leading-none">
            <div className="text-[15px] font-semibold tracking-[0.02em]" style={{ color: C.fg }}>
              Cockpit
            </div>
            <div className="mt-1">
              <HudLabel>ZZP · Flight Deck</HudLabel>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div
            className="hidden items-center gap-2 rounded-md px-3 py-1.5 sm:flex"
            style={{ border: `1px solid ${C.line}`, background: C.panel }}
          >
            <Signal size={13} style={{ color: C.green }} aria-hidden="true" />
            <span
              className="text-[10.5px] font-medium uppercase tracking-[0.18em]"
              style={{ ...mono, color: C.green }}
            >
              Systemen nominaal
            </span>
          </div>
          <div className="hidden text-right leading-tight sm:block">
            <div className="text-[12.5px] font-semibold" style={{ color: C.fg }}>
              {PROFIEL.naam}
            </div>
            <div style={{ ...mono }} className="text-[10px] uppercase tracking-[0.14em]">
              <span style={{ color: C.fgFaint }}>{PROFIEL.rol}</span>
            </div>
          </div>
          <span
            className="flex h-10 w-10 items-center justify-center rounded-md text-[12px] font-semibold"
            style={{
              ...mono,
              background: C.panelHi,
              border: `1px solid ${C.line}`,
              color: C.green,
            }}
            aria-hidden="true"
          >
            {PROFIEL.initialen}
          </span>
        </div>
      </header>

      {/* Tab-nav — instrument-selector */}
      <nav
        className="mx-auto mt-5 flex max-w-6xl items-center gap-1 overflow-x-auto px-5 md:px-9"
        aria-label="Hoofdnavigatie"
      >
        {SCREENS.map((s) => {
          const on = s.key === screen;
          return (
            <button
              key={s.key}
              onClick={() => setScreen(s.key)}
              aria-current={on ? "page" : undefined}
              className="group relative shrink-0 rounded-t-md px-3.5 py-2.5 text-[12px] font-medium uppercase tracking-[0.14em] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-1"
              style={
                {
                  ...mono,
                  color: on ? C.green : C.fgSoft,
                  background: on ? C.panel : "transparent",
                  borderBottom: on ? `2px solid ${C.green}` : `2px solid transparent`,
                  "--tw-ring-color": C.green,
                  "--tw-ring-offset-color": C.bg,
                } as React.CSSProperties
              }
            >
              {s.label}
            </button>
          );
        })}
        <div className="ml-auto hidden items-center gap-1.5 self-center pr-1 md:flex">
          <CircleDot size={11} style={{ color: C.green }} aria-hidden="true" />
          <span
            style={{ ...mono, color: C.fgFaint }}
            className="text-[10px] uppercase tracking-[0.18em]"
          >
            Live feed
          </span>
        </div>
      </nav>

      <div style={{ borderTop: `1px solid ${C.line}` }}>
        <main className="mx-auto max-w-6xl px-5 py-8 md:px-9 md:py-10">
          {screen === "dashboard" && (
            <Dashboard onOpen={() => setScreen("opdracht")} onActies={() => setScreen("acties")} />
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
    </div>
  );
}

// ── Dashboard ─────────────────────────────────────────────────────────────────
function Dashboard({ onOpen, onActies }: { onOpen: () => void; onActies: () => void }) {
  const primair = ACTIES[0] as (typeof ACTIES)[number];
  const top = OPDRACHTEN[0] as Opdracht;
  const tones = [C.green, C.cyan, C.amber, C.green];
  return (
    <div className="space-y-6">
      {/* Master caution — enige alert die NU aandacht vraagt */}
      <Panel tone={C.amber} className="overflow-hidden">
        <div className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex min-w-0 items-start gap-4">
            <span
              className="mt-0.5 flex h-11 w-11 shrink-0 items-center justify-center rounded-md"
              style={{
                background: `${C.amber}16`,
                border: `1px solid ${C.amber}55`,
                boxShadow: `0 0 20px -10px ${C.amber}`,
              }}
            >
              <AlertTriangle
                size={20}
                strokeWidth={2.2}
                style={{ color: C.amber }}
                aria-hidden="true"
              />
            </span>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <HudLabel tone={C.amber}>Master caution</HudLabel>
                <span className="sr-only">Waarschuwing</span>
              </div>
              <h2 className="mt-1 text-[19px] font-semibold leading-tight" style={{ color: C.fg }}>
                {primair.titel}
              </h2>
              <p className="mt-1 max-w-md text-[13px] leading-relaxed" style={{ color: C.fgSoft }}>
                {primair.detail}
              </p>
            </div>
          </div>
          <button
            onClick={onActies}
            className="group inline-flex shrink-0 items-center gap-2 rounded-md px-5 py-2.5 text-[12px] font-semibold uppercase tracking-[0.12em] transition-all hover:gap-3 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 motion-reduce:hover:gap-2"
            style={
              {
                ...mono,
                background: C.amber,
                color: C.bg,
                "--tw-ring-color": C.amber,
                "--tw-ring-offset-color": C.bg,
              } as React.CSSProperties
            }
          >
            {primair.cta}
            <ArrowRight size={15} aria-hidden="true" />
          </button>
        </div>
      </Panel>

      {/* Bovenrij: PFD-kern + kerncijfers */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Panel tone={C.green} className="flex flex-col items-center justify-center gap-3 p-6">
          <div className="flex w-full items-center justify-between">
            <HudLabel tone={C.green}>Primary display</HudLabel>
            <Gauge size={14} style={{ color: C.green }} aria-hidden="true" />
          </div>
          <div className="w-40">
            <PFD value={top.match} />
          </div>
          <p className="text-center text-[12px] leading-relaxed" style={{ color: C.fgSoft }}>
            Beste match: <span style={{ color: C.fg }}>{top.titel}</span>
          </p>
          <button
            onClick={onOpen}
            className="inline-flex items-center gap-2 rounded-md px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.12em] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
            style={
              {
                ...mono,
                background: `${C.green}14`,
                border: `1px solid ${C.green}55`,
                color: C.green,
                "--tw-ring-color": C.green,
                "--tw-ring-offset-color": C.bg,
              } as React.CSSProperties
            }
          >
            Open opdracht <ArrowRight size={13} aria-hidden="true" />
          </button>
        </Panel>

        <div className="grid grid-cols-2 gap-4 lg:col-span-2">
          {KPIS.map((k, i) => {
            const tone = tones[i % tones.length] as string;
            return (
              <Panel key={k.label} interactive className="flex flex-col p-4">
                <div className="flex items-start justify-between">
                  <HudLabel>{k.label}</HudLabel>
                  <span
                    className="text-[10px] font-semibold tabular-nums"
                    style={{ ...mono, color: k.up ? C.green : C.amber }}
                  >
                    {k.up ? "▲" : "▼"} {k.trend}
                  </span>
                </div>
                <div
                  className="mt-2 text-[26px] font-semibold tabular-nums leading-none"
                  style={{ ...mono, color: C.fg }}
                >
                  {k.value}
                </div>
                <div className="mt-auto pt-3">
                  <Spark data={k.spark} tone={tone} />
                </div>
              </Panel>
            );
          })}
        </div>
      </div>

      {/* Checklist — traffic feed */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Panel className="p-5">
          <div className="mb-3 flex items-center gap-2">
            <Radar size={15} style={{ color: C.green }} aria-hidden="true" />
            <HudLabel tone={C.fgSoft}>Traffic — opdrachten in bereik</HudLabel>
          </div>
          <ul className="space-y-2">
            {OPDRACHTEN.map((o) => (
              <li key={o.id}>
                <button
                  onClick={onOpen}
                  className="group flex w-full items-center gap-3 rounded-md px-3 py-2.5 text-left transition-colors hover:bg-white/[0.03] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
                  style={
                    {
                      "--tw-ring-color": C.green,
                      "--tw-ring-offset-color": C.panel,
                    } as React.CSSProperties
                  }
                >
                  <span
                    className="flex h-8 w-8 shrink-0 items-center justify-center rounded"
                    style={{
                      background: `${matchTone(o.match)}14`,
                      border: `1px solid ${matchTone(o.match)}44`,
                    }}
                  >
                    <span
                      className="text-[11px] font-semibold tabular-nums"
                      style={{ ...mono, color: matchTone(o.match) }}
                    >
                      {o.match}
                    </span>
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-[13px] font-medium" style={{ color: C.fg }}>
                      {o.titel}
                    </div>
                    <div className="truncate text-[11px]" style={{ ...mono, color: C.fgFaint }}>
                      {o.opdrachtgever} · {o.plaats}
                    </div>
                  </div>
                  <ChevronRight
                    size={16}
                    className="shrink-0 transition-transform group-hover:translate-x-0.5"
                    style={{ color: C.fgFaint }}
                    aria-hidden="true"
                  />
                </button>
              </li>
            ))}
          </ul>
        </Panel>

        <Panel className="p-5">
          <div className="mb-3 flex items-center gap-2">
            <ShieldCheck size={15} style={{ color: C.green }} aria-hidden="true" />
            <HudLabel tone={C.fgSoft}>Systeemstatus — credentials</HudLabel>
          </div>
          <ul className="space-y-2">
            {CREDENTIALS.map((c) => {
              const st = statusMeta(c.status);
              return (
                <li
                  key={c.naam}
                  className="flex items-center gap-3 rounded-md px-3 py-2"
                  style={{ background: C.panelSoft }}
                >
                  <st.Icon
                    size={15}
                    strokeWidth={2.2}
                    style={{ color: st.tone }}
                    aria-hidden="true"
                  />
                  <span className="min-w-0 flex-1 truncate text-[12.5px]" style={{ color: C.fg }}>
                    {c.naam}
                  </span>
                  <Chip tone={st.tone}>{st.code}</Chip>
                </li>
              );
            })}
          </ul>
        </Panel>
      </div>
    </div>
  );
}

function matchTone(v: number): string {
  return v >= 90 ? C.green : v >= 80 ? C.amber : C.cyan;
}

// ── Marktplaats ─────────────────────────────────────────────────────────────
function Marktplaats({ onOpen }: { onOpen: () => void }) {
  const [q, setQ] = useState("");
  const filtered = useMemo(
    () =>
      OPDRACHTEN.filter(
        (o) =>
          o.titel.toLowerCase().includes(q.toLowerCase()) ||
          o.plaats.toLowerCase().includes(q.toLowerCase()) ||
          o.opdrachtgever.toLowerCase().includes(q.toLowerCase()),
      ),
    [q],
  );
  return (
    <div className="space-y-5">
      <div className="flex items-center gap-2">
        <Radar size={16} style={{ color: C.green }} aria-hidden="true" />
        <HudLabel tone={C.fgSoft}>Marktplaats — traffic scan</HudLabel>
      </div>

      <Panel className="flex items-center gap-3 px-4">
        <Search size={16} style={{ color: C.fgFaint }} aria-hidden="true" />
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Filter op titel, plaats of opdrachtgever…"
          aria-label="Opdrachten zoeken"
          className="w-full bg-transparent py-3 text-[13px] outline-none placeholder:opacity-40"
          style={{ ...mono, color: C.fg }}
        />
        <span
          className="shrink-0 text-[11px] font-semibold tabular-nums"
          style={{ ...mono, color: C.fgFaint }}
        >
          {filtered.length} DET
        </span>
      </Panel>

      {filtered.length === 0 ? (
        <Panel className="flex flex-col items-center justify-center gap-3 p-14 text-center">
          <Radar size={40} style={{ color: C.fgFaint }} aria-hidden="true" />
          <p className="text-[15px] font-semibold" style={{ color: C.fg }}>
            Geen contacten op de radar
          </p>
          <p className="max-w-xs text-[12.5px]" style={{ color: C.fgSoft }}>
            Niets past bij “{q}”. Verruim je scan of beschikbaarheid.
          </p>
          <button
            onClick={() => setQ("")}
            className="mt-1 inline-flex items-center gap-2 rounded-md px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.12em] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
            style={
              {
                ...mono,
                background: `${C.green}14`,
                border: `1px solid ${C.green}55`,
                color: C.green,
              } as React.CSSProperties
            }
          >
            Scan wissen
          </button>
        </Panel>
      ) : (
        <ul className="space-y-3">
          {filtered.map((o) => {
            const tone = matchTone(o.match);
            return (
              <li key={o.id}>
                <button
                  onClick={onOpen}
                  className="group block w-full text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
                  style={
                    {
                      "--tw-ring-color": tone,
                      "--tw-ring-offset-color": C.bg,
                    } as React.CSSProperties
                  }
                >
                  <Panel
                    interactive
                    tone={o.match >= 90 ? C.green : undefined}
                    className="flex flex-col gap-4 p-4 sm:flex-row sm:items-center"
                  >
                    <div className="w-16 shrink-0">
                      <PFD value={o.match} label="MTCH" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span
                          className="text-[10px] font-medium uppercase tracking-[0.16em]"
                          style={{ ...mono, color: C.fgFaint }}
                        >
                          {o.id}
                        </span>
                      </div>
                      <h3
                        className="mt-0.5 text-[16px] font-semibold leading-tight"
                        style={{ color: C.fg }}
                      >
                        {o.titel}
                      </h3>
                      <div className="mt-0.5 text-[12px]" style={{ ...mono, color: C.fgSoft }}>
                        {o.opdrachtgever} · {o.plaats} · {o.tarief}
                      </div>
                      <div className="mt-2.5 flex flex-wrap gap-1.5">
                        {o.tags.map((t) => (
                          <Chip key={t} tone={C.fgSoft}>
                            {t}
                          </Chip>
                        ))}
                      </div>
                    </div>
                    <div className="flex items-center gap-3 self-stretch sm:self-center">
                      <div className="text-right">
                        <div
                          className="text-[11px] uppercase tracking-[0.14em]"
                          style={{ ...mono, color: C.fgFaint }}
                        >
                          {o.uren}
                        </div>
                        <div
                          className="text-[11px] uppercase tracking-[0.14em]"
                          style={{ ...mono, color: tone }}
                        >
                          {o.start}
                        </div>
                      </div>
                      <ChevronRight
                        size={18}
                        className="shrink-0 transition-transform group-hover:translate-x-0.5"
                        style={{ color: tone }}
                        aria-hidden="true"
                      />
                    </div>
                  </Panel>
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

// ── Opdracht-detail ───────────────────────────────────────────────────────────
function OpdrachtDetail({ opdracht, onBack }: { opdracht: Opdracht; onBack: () => void }) {
  const feiten: { l: string; v: string }[] = [
    { l: "Tarief", v: opdracht.tarief },
    { l: "Omvang", v: opdracht.uren },
    { l: "Start", v: opdracht.start },
    { l: "Locatie", v: opdracht.plaats },
  ];
  return (
    <div className="space-y-6">
      <button
        onClick={onBack}
        className="inline-flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.14em] transition-opacity hover:opacity-70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
        style={{ ...mono, color: C.fgSoft }}
      >
        <ArrowRight size={13} className="rotate-180" aria-hidden="true" /> Terug naar radar
      </button>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Panel
          tone={matchTone(opdracht.match)}
          className="flex flex-col items-center justify-center gap-3 p-6 lg:row-span-2"
        >
          <HudLabel tone={matchTone(opdracht.match)}>Match display</HudLabel>
          <div className="w-40">
            <PFD value={opdracht.match} />
          </div>
          <div className="flex flex-col items-center gap-2">
            <span
              className="text-[10px] uppercase tracking-[0.16em]"
              style={{ ...mono, color: C.fgFaint }}
            >
              {opdracht.id}
            </span>
            <span
              className="inline-flex items-center gap-1.5 rounded px-2.5 py-1 text-[10.5px] font-semibold uppercase tracking-[0.12em]"
              style={{
                ...mono,
                background: `${C.green}14`,
                border: `1px solid ${C.green}44`,
                color: C.green,
              }}
            >
              <ShieldCheck size={12} aria-hidden="true" /> {PROFIEL.trust}
            </span>
          </div>
        </Panel>

        <div className="lg:col-span-2">
          <Panel className="p-5">
            <h1
              className="text-[24px] font-semibold leading-tight tracking-[-0.01em]"
              style={{ color: C.fg }}
            >
              {opdracht.titel}
            </h1>
            <p className="mt-1 text-[13px]" style={{ ...mono, color: C.fgSoft }}>
              {opdracht.opdrachtgever} · {opdracht.plaats}
            </p>
            <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
              {feiten.map((m) => (
                <div
                  key={m.l}
                  className="rounded-md px-3 py-2.5"
                  style={{ background: C.panelSoft, border: `1px solid ${C.line}` }}
                >
                  <div
                    className="text-[13.5px] font-semibold tabular-nums"
                    style={{ ...mono, color: C.fg }}
                  >
                    {m.v}
                  </div>
                  <div className="mt-1">
                    <HudLabel>{m.l}</HudLabel>
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-4 flex flex-wrap gap-1.5">
              {opdracht.tags.map((t) => (
                <Chip key={t} tone={C.cyan}>
                  {t}
                </Chip>
              ))}
            </div>
          </Panel>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:col-span-2">
          <Panel tone={C.green} className="p-5">
            <div className="mb-3 flex items-center gap-2">
              <Check size={14} strokeWidth={2.6} style={{ color: C.green }} aria-hidden="true" />
              <HudLabel tone={C.green}>Nominaal — wat past</HudLabel>
            </div>
            <ul className="space-y-2.5">
              {opdracht.redenen.plus.map((r) => (
                <li
                  key={r}
                  className="flex items-start gap-2.5 text-[13px] leading-snug"
                  style={{ color: C.fg }}
                >
                  <Check
                    size={15}
                    strokeWidth={2.4}
                    className="mt-0.5 shrink-0"
                    style={{ color: C.green }}
                    aria-hidden="true"
                  />
                  {r}
                </li>
              ))}
            </ul>
          </Panel>
          <Panel tone={C.amber} className="p-5">
            <div className="mb-3 flex items-center gap-2">
              <AlertTriangle
                size={14}
                strokeWidth={2.6}
                style={{ color: C.amber }}
                aria-hidden="true"
              />
              <HudLabel tone={C.amber}>Caution — aandacht</HudLabel>
            </div>
            <ul className="space-y-2.5">
              {opdracht.redenen.min.map((r) => (
                <li
                  key={r}
                  className="flex items-start gap-2.5 text-[13px] leading-snug"
                  style={{ color: C.fg }}
                >
                  <span
                    className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full"
                    style={{ background: C.amber }}
                    aria-hidden="true"
                  />
                  {r}
                </li>
              ))}
            </ul>
          </Panel>
        </div>
      </div>

      <div className="flex flex-col items-stretch gap-3 sm:flex-row">
        <button
          className="group inline-flex flex-1 items-center justify-center gap-2.5 rounded-md px-6 py-3.5 text-[13px] font-semibold uppercase tracking-[0.12em] transition-all hover:gap-3.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 motion-reduce:hover:gap-2.5"
          style={
            {
              ...mono,
              background: C.green,
              color: C.bg,
              boxShadow: `0 0 26px -12px ${C.glow}`,
              "--tw-ring-color": C.green,
              "--tw-ring-offset-color": C.bg,
            } as React.CSSProperties
          }
        >
          Reageer op opdracht <ArrowRight size={15} aria-hidden="true" />
        </button>
        <button
          className="inline-flex items-center justify-center gap-2 rounded-md px-6 py-3.5 text-[13px] font-semibold uppercase tracking-[0.12em] transition-colors hover:bg-white/[0.03] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
          style={{ ...mono, border: `1px solid ${C.line}`, color: C.fg } as React.CSSProperties}
        >
          Bewaar
        </button>
      </div>
    </div>
  );
}

// ── Verificatie ─────────────────────────────────────────────────────────────
function Verificatie() {
  const verified = CREDENTIALS.filter((c) => c.status === "VERIFIED").length;
  const pct = Math.round((verified / CREDENTIALS.length) * 100);
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <ShieldCheck size={16} style={{ color: C.green }} aria-hidden="true" />
        <HudLabel tone={C.fgSoft}>Verificatie — systeemcheck</HudLabel>
      </div>

      <Panel tone={C.green} className="flex flex-col items-center gap-6 p-6 sm:flex-row">
        <div className="w-28 shrink-0">
          <PFD value={pct} label="GEDEKT" />
        </div>
        <div className="text-center sm:text-left">
          <span
            className="inline-flex items-center gap-2 rounded px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.14em]"
            style={{
              ...mono,
              background: `${C.green}14`,
              border: `1px solid ${C.green}44`,
              color: C.green,
            }}
          >
            <ShieldCheck size={14} strokeWidth={2.2} aria-hidden="true" /> {PROFIEL.trust}
          </span>
          <p className="mt-3 max-w-md text-[13px] leading-relaxed" style={{ color: C.fgSoft }}>
            {verified} van {CREDENTIALS.length} credentials nominaal. Elk geverifieerd systeem
            verhoogt je vertrouwensniveau — één dossier vraagt binnenkort om onderhoud.
          </p>
        </div>
      </Panel>

      <ul className="space-y-3">
        {CREDENTIALS.map((c) => {
          const st = statusMeta(c.status);
          return (
            <li key={c.naam}>
              <Panel
                tone={c.status === "VERIFIED" ? undefined : st.tone}
                className="flex items-center gap-4 p-4"
              >
                <span
                  className="flex h-11 w-11 shrink-0 items-center justify-center rounded-md"
                  style={{
                    background: `${st.tone}12`,
                    border: `1px solid ${st.tone}44`,
                    color: st.tone,
                  }}
                  aria-hidden="true"
                >
                  <st.Icon size={18} strokeWidth={2.2} />
                </span>
                <div className="min-w-0 flex-1">
                  <div className="text-[14px] font-semibold leading-tight" style={{ color: C.fg }}>
                    {c.naam}
                  </div>
                  <div className="mt-0.5 text-[11.5px]" style={{ ...mono, color: C.fgSoft }}>
                    {c.detail}
                  </div>
                </div>
                <div className="flex flex-col items-end gap-1">
                  <Chip tone={st.tone}>
                    <st.Icon size={11} strokeWidth={2.6} aria-hidden="true" />
                    {st.code}
                  </Chip>
                  <span
                    className="hidden text-[10px] uppercase tracking-[0.14em] sm:block"
                    style={{ ...mono, color: C.fgFaint }}
                  >
                    {st.label}
                  </span>
                </div>
              </Panel>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

// ── Acties ───────────────────────────────────────────────────────────────────
function Acties() {
  const sorted = [...ACTIES].sort((a, b) =>
    a.urgentie === b.urgentie ? 0 : a.urgentie === "warning" ? -1 : 1,
  );
  return (
    <div className="space-y-5">
      <div className="flex items-center gap-2">
        <Activity size={16} style={{ color: C.green }} aria-hidden="true" />
        <HudLabel tone={C.fgSoft}>Checklist — volgende beste actie</HudLabel>
      </div>
      <ol className="space-y-3">
        {sorted.map((a, i) => {
          const warn = a.urgentie === "warning";
          const tone = warn ? C.amber : C.green;
          return (
            <li key={a.titel}>
              <Panel
                tone={warn ? C.amber : undefined}
                className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center"
              >
                <span
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md text-[14px] font-semibold tabular-nums"
                  style={{
                    ...mono,
                    background: `${tone}12`,
                    border: `1px solid ${tone}44`,
                    color: tone,
                  }}
                  aria-hidden="true"
                >
                  {String(i + 1).padStart(2, "0")}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    {warn ? (
                      <AlertTriangle
                        size={13}
                        strokeWidth={2.4}
                        style={{ color: tone }}
                        aria-hidden="true"
                      />
                    ) : (
                      <CircleDot
                        size={13}
                        strokeWidth={2.4}
                        style={{ color: tone }}
                        aria-hidden="true"
                      />
                    )}
                    <HudLabel tone={tone}>{warn ? "Caution" : "Advies"}</HudLabel>
                  </div>
                  <h3
                    className="mt-1 text-[15px] font-semibold leading-tight"
                    style={{ color: C.fg }}
                  >
                    {a.titel}
                  </h3>
                  <p className="mt-1 text-[12.5px] leading-relaxed" style={{ color: C.fgSoft }}>
                    {a.detail}
                  </p>
                </div>
                <button
                  className="shrink-0 self-start rounded-md px-5 py-2.5 text-[11.5px] font-semibold uppercase tracking-[0.12em] transition-transform hover:-translate-y-px focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 motion-reduce:hover:translate-y-0 sm:self-center"
                  style={
                    {
                      ...mono,
                      background: tone,
                      color: C.bg,
                      "--tw-ring-color": tone,
                      "--tw-ring-offset-color": C.bg,
                    } as React.CSSProperties
                  }
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

// ── Facturen ─────────────────────────────────────────────────────────────────
function Facturen() {
  const total = "€ 8.622";
  const badge = (status: string): string => {
    if (status === "Betaald") return C.green;
    if (status === "Openstaand") return C.amber;
    if (status === "Concept") return C.fgFaint;
    return C.cyan;
  };
  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Gauge size={16} style={{ color: C.green }} aria-hidden="true" />
          <HudLabel tone={C.fgSoft}>Facturen — fuel/omzet</HudLabel>
        </div>
        <button
          className="inline-flex items-center gap-2 rounded-md px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.12em] transition-colors hover:bg-white/[0.03] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
          style={
            {
              ...mono,
              background: `${C.green}14`,
              border: `1px solid ${C.green}55`,
              color: C.green,
            } as React.CSSProperties
          }
        >
          <Plus size={14} aria-hidden="true" /> Nieuwe factuur
        </button>
      </div>

      <Panel className="overflow-x-auto">
        <table className="w-full min-w-[600px] border-collapse text-left">
          <thead>
            <tr style={{ borderBottom: `1px solid ${C.line}` }}>
              {["Nummer", "Klant", "Datum", "Status", "Bedrag"].map((h, i) => (
                <th key={h} className={`px-4 py-3 ${i === 4 ? "text-right" : ""}`}>
                  <HudLabel>{h}</HudLabel>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {FACTUREN.map((f) => {
              const tone = badge(f.status);
              return (
                <tr
                  key={f.nr}
                  className="transition-colors hover:bg-white/[0.02]"
                  style={{ borderBottom: `1px solid ${C.lineSoft}` }}
                >
                  <td
                    className="px-4 py-3.5 text-[12px] tabular-nums"
                    style={{ ...mono, color: C.fgSoft }}
                  >
                    {f.nr}
                  </td>
                  <td className="px-4 py-3.5 text-[13px]" style={{ color: C.fg }}>
                    {f.klant}
                  </td>
                  <td
                    className="px-4 py-3.5 text-[12px] tabular-nums"
                    style={{ ...mono, color: C.fgSoft }}
                  >
                    {f.datum}
                  </td>
                  <td className="px-4 py-3.5">
                    <Chip tone={tone}>
                      <span
                        className="h-1.5 w-1.5 rounded-full"
                        style={{ background: tone }}
                        aria-hidden="true"
                      />
                      {f.status}
                    </Chip>
                  </td>
                  <td
                    className="px-4 py-3.5 text-right text-[14px] font-semibold tabular-nums"
                    style={{ ...mono, color: C.fg }}
                  >
                    {f.bedrag}
                  </td>
                </tr>
              );
            })}
          </tbody>
          <tfoot>
            <tr style={{ borderTop: `2px solid ${C.line}` }}>
              <td colSpan={4} className="px-4 py-4">
                <HudLabel>Totaal betaald</HudLabel>
              </td>
              <td
                className="px-4 py-4 text-right text-[17px] font-semibold tabular-nums"
                style={{ ...mono, color: C.green }}
              >
                {total}
              </td>
            </tr>
          </tfoot>
        </table>
      </Panel>
    </div>
  );
}
