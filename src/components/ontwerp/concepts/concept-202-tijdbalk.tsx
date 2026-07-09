"use client";

// Concept 202 — "Tijdbalk" · swimlane-timeline / Gantt als hoofdstructuur (temporele planning, Linear cycles 2026).
// Tijd is de primaire horizontale as: opdrachten en samenwerkingen zijn balken in swimlanes met start/duur,
// een "vandaag"-lijn, week-schaal, verificatie-vervaldata als markers en facturen als mijlpalen. Clean raster,
// tabulaire cijfers, hover toont detail. De timeline scrollt horizontaal in een eigen overflow-container.
// Deterministisch, UI Nederlands. Fonts: Space Grotesk (display) + Geist (tekst) + Geist Mono (cijfers/datums).

import { useState } from "react";
import {
  ArrowRight,
  ArrowLeft,
  Check,
  Clock,
  XCircle,
  ShieldCheck,
  CalendarDays,
  MapPin,
  Coins,
  TriangleAlert,
  BadgeCheck,
  CalendarRange,
  Milestone,
  Flag,
  ChevronRight,
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

// ── Palet — planbord: koel diep blauwgrijs, één indigo-accent voor "nu" en balken ──
const C = {
  bg: "#0d0f16",
  panel: "#151824",
  panelHi: "#1c2030",
  rail: "#11131d",
  line: "#252a3a",
  lineSoft: "#1c2030",
  grid: "#20263a",
  ink: "#eef1f8",
  inkSoft: "#98a1ba",
  inkFaint: "#5c6580",
  accent: "#7c8bff",
  accentDeep: "#4c5cf0",
  onAccent: "#0a0d24",
  now: "#ff8a5c",
  ok: "#3ddc84",
  okBg: "#10241c",
  wait: "#5aa9ff",
  waitBg: "#12233c",
  warn: "#f5b544",
  warnBg: "#2a2110",
  bad: "#ff6b6b",
  badBg: "#2a1417",
};

const display = { fontFamily: "var(--font-lab-space)" };
const bodyF = { fontFamily: "var(--font-lab-geist)" };
const mono = { fontFamily: "var(--font-lab-geist-mono)" };

// ── Tijd-model — deterministische weekas (juni–augustus), "vandaag" op vaste positie ──
const WEEKS = [
  { label: "23 jun", w: 25 },
  { label: "30 jun", w: 26 },
  { label: "7 jul", w: 27 },
  { label: "14 jul", w: 28 },
  { label: "21 jul", w: 29 },
  { label: "28 jul", w: 30 },
  { label: "4 aug", w: 31 },
];
const COL = 132; // px per week
const TODAY_COL = 1; // vandaag = week-index 1 (30 jun-kolom)
const TODAY_FRAC = 0.7; // fractie binnen de kolom
const TODAY_X = (TODAY_COL + TODAY_FRAC) * COL;
const TRACK_W = WEEKS.length * COL;

// Balk-model: start (week-index) + duur (weken), gekoppeld aan een opdracht.
type Bar = {
  op: Opdracht;
  start: number;
  duur: number;
  soort: "opdracht" | "samenwerking";
};
const BARS: Bar[] = [
  { op: OPDRACHTEN[0] as Opdracht, start: 1.6, duur: 3.2, soort: "opdracht" },
  { op: OPDRACHTEN[1] as Opdracht, start: 2.2, duur: 2.6, soort: "samenwerking" },
  { op: OPDRACHTEN[2] as Opdracht, start: 4.1, duur: 1.8, soort: "opdracht" },
];

// Verificatie-markers op de tijdlijn (vervaldata).
const CRED_MARKERS: { naam: string; x: number; status: CredStatus }[] = [
  { naam: "VOG (zorg)", x: 3.4, status: "EXPIRING" },
  { naam: "Reanimatie / BLS", x: 2.1, status: "SUBMITTED" },
];

// Factuur-mijlpalen op de tijdlijn.
const FAC_OPEN = FACTUREN[1]!;
const FAC_PAID = FACTUREN[0]!;
const INVOICE_MILESTONES = [
  { nr: FAC_OPEN.nr, x: 0.4, status: FAC_OPEN.status, bedrag: FAC_OPEN.bedrag },
  { nr: FAC_PAID.nr, x: 1.9, status: FAC_PAID.status, bedrag: FAC_PAID.bedrag },
];

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
      className="inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-[11px] font-semibold"
      style={{ ...bodyF, background: m.bg, color: m.fg, boxShadow: `inset 0 0 0 1px ${m.fg}44` }}
    >
      <m.Icon size={12} strokeWidth={2.4} aria-hidden="true" />
      {m.label}
    </span>
  );
}

function Panel({
  children,
  className = "",
  style,
}: {
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
}) {
  return (
    <div
      className={`rounded-xl ${className}`}
      style={{ background: C.panel, boxShadow: `inset 0 0 0 1px ${C.line}`, ...style }}
    >
      {children}
    </div>
  );
}

function SectionHead({ title, sub, Icon }: { title: string; sub?: string; Icon: LucideIcon }) {
  return (
    <div className="flex items-center gap-3">
      <span
        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg"
        style={{ background: C.panelHi, boxShadow: `inset 0 0 0 1px ${C.line}` }}
        aria-hidden="true"
      >
        <Icon size={17} strokeWidth={2} style={{ color: C.accent }} />
      </span>
      <div>
        <h2
          className="text-[18px] font-semibold tracking-tight"
          style={{ ...display, color: C.ink }}
        >
          {title}
        </h2>
        {sub && (
          <p className="mt-0.5 text-[12px]" style={{ ...bodyF, color: C.inkFaint }}>
            {sub}
          </p>
        )}
      </div>
    </div>
  );
}

// ── Root ──
export function Concept202() {
  const [screen, setScreen] = useState<ScreenKey>("dashboard");
  const active = OPDRACHTEN[0] as Opdracht;

  return (
    <div
      className="relative min-h-screen w-full overflow-x-hidden antialiased"
      style={{ ...bodyF, background: C.bg, color: C.ink }}
    >
      <header style={{ borderBottom: `1px solid ${C.line}`, background: C.rail }}>
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-4 md:px-8">
          <div className="flex items-center gap-3">
            <span
              className="flex h-10 w-10 items-center justify-center rounded-xl"
              style={{ background: C.accentDeep, color: "#fff" }}
              aria-hidden="true"
            >
              <CalendarRange size={20} strokeWidth={2} />
            </span>
            <div className="leading-tight">
              <div
                className="text-[10px] font-semibold uppercase tracking-[0.3em]"
                style={{ ...mono, color: C.accent }}
              >
                Tijdbalk
              </div>
              <div
                className="text-[20px] font-semibold tracking-tight"
                style={{ ...display, color: C.ink }}
              >
                Planbord
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2.5">
            <span
              className="hidden items-center gap-1.5 rounded-full px-3 py-1.5 text-[11px] font-semibold sm:inline-flex"
              style={{
                ...bodyF,
                background: C.okBg,
                color: C.ok,
                boxShadow: `inset 0 0 0 1px ${C.ok}44`,
              }}
            >
              <ShieldCheck size={12} strokeWidth={2.2} aria-hidden="true" /> {PROFIEL.trust}
            </span>
            <span
              className="flex h-9 w-9 items-center justify-center rounded-full text-[11px] font-bold"
              style={{ ...mono, background: C.accentDeep, color: "#fff" }}
              aria-hidden="true"
            >
              {PROFIEL.initialen}
            </span>
          </div>
        </div>
        <nav
          className="mx-auto flex max-w-6xl items-center gap-1.5 overflow-x-auto px-4 pb-3 md:px-8"
          aria-label="Schermen"
        >
          {SCREENS.map((s) => {
            const on = s.key === screen;
            return (
              <button
                key={s.key}
                onClick={() => setScreen(s.key)}
                aria-current={on ? "page" : undefined}
                className="shrink-0 rounded-lg px-3.5 py-1.5 text-[12.5px] font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
                style={{
                  ...bodyF,
                  background: on ? C.accentDeep : C.panel,
                  color: on ? "#fff" : C.inkSoft,
                  boxShadow: on ? "none" : `inset 0 0 0 1px ${C.line}`,
                  ["--tw-ring-color" as string]: C.accent,
                  ["--tw-ring-offset-color" as string]: C.rail,
                }}
              >
                {s.label}
              </button>
            );
          })}
        </nav>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-6 md:px-8 md:py-8">
        {screen === "dashboard" && <Dashboard onOpen={() => setScreen("opdracht")} />}
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

// ── Gedeelde timeline-schaal (kop met weken + vandaag-lijn) ──
function TimelineScale() {
  return (
    <div className="relative flex" style={{ width: TRACK_W, height: 30 }} aria-hidden="true">
      {WEEKS.map((w, i) => (
        <div
          key={w.label}
          className="flex items-center px-2 text-[11px] font-medium tabular-nums"
          style={{
            width: COL,
            color: C.inkFaint,
            ...mono,
            borderLeft: i === 0 ? "none" : `1px solid ${C.grid}`,
          }}
        >
          wk {w.w} · {w.label}
        </div>
      ))}
    </div>
  );
}

function NowLine({ height }: { height: number }) {
  return (
    <div
      className="pointer-events-none absolute top-0 z-20"
      style={{ left: TODAY_X, height }}
      aria-hidden="true"
    >
      <div className="h-full w-px" style={{ background: C.now }} />
      <span
        className="absolute -top-0.5 left-1/2 -translate-x-1/2 rounded px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide"
        style={{ ...mono, background: C.now, color: "#241005" }}
      >
        nu
      </span>
    </div>
  );
}

// ── Dashboard — de swimlane-timeline is de held ──
function Dashboard({ onOpen }: { onOpen: () => void }) {
  const [hover, setHover] = useState<string | null>(null);
  const laneH = 52;
  const lanes = BARS.length;
  const gridH = lanes * laneH + 78;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {KPIS.map((k) => (
          <Panel key={k.label} className="p-4">
            <span className="text-[11px] font-medium" style={{ ...bodyF, color: C.inkFaint }}>
              {k.label}
            </span>
            <div className="mt-1.5 flex items-end justify-between">
              <span
                className="text-[23px] font-semibold tabular-nums leading-none"
                style={{ ...mono, color: C.ink }}
              >
                {k.value}
              </span>
              <span
                className="rounded px-1.5 py-0.5 text-[10px] font-semibold"
                style={{
                  ...mono,
                  background: k.up ? C.okBg : C.panelHi,
                  color: k.up ? C.ok : C.inkSoft,
                }}
              >
                {k.trend}
              </span>
            </div>
          </Panel>
        ))}
      </div>

      <div>
        <div className="mb-4 flex items-center justify-between">
          <SectionHead
            title="Planning"
            sub="Opdrachten & samenwerkingen op de tijdas"
            Icon={CalendarRange}
          />
          <div
            className="hidden items-center gap-3 text-[11px] sm:flex"
            style={{ ...bodyF, color: C.inkFaint }}
          >
            <span className="flex items-center gap-1.5">
              <span className="h-2.5 w-4 rounded-sm" style={{ background: C.accentDeep }} />{" "}
              Opdracht
            </span>
            <span className="flex items-center gap-1.5">
              <span
                className="h-2.5 w-4 rounded-sm"
                style={{ background: C.wait, opacity: 0.85 }}
              />{" "}
              Samenwerking
            </span>
            <span className="flex items-center gap-1.5">
              <span className="h-3 w-px" style={{ background: C.now }} /> Nu
            </span>
          </div>
        </div>

        <Panel className="overflow-hidden">
          <div className="flex">
            {/* Vaste swimlane-labels links */}
            <div className="shrink-0" style={{ width: 160, borderRight: `1px solid ${C.line}` }}>
              <div
                className="flex items-center px-4 text-[10.5px] font-semibold uppercase tracking-[0.08em]"
                style={{
                  ...mono,
                  height: 30,
                  color: C.inkFaint,
                  borderBottom: `1px solid ${C.line}`,
                }}
              >
                Swimlane
              </div>
              {BARS.map((b) => (
                <div
                  key={b.op.id}
                  className="flex items-center px-4"
                  style={{ height: laneH, borderBottom: `1px solid ${C.lineSoft}` }}
                >
                  <div className="min-w-0">
                    <div
                      className="truncate text-[12px] font-semibold"
                      style={{ ...bodyF, color: C.ink }}
                    >
                      {b.op.opdrachtgever}
                    </div>
                    <div className="truncate text-[10.5px]" style={{ ...mono, color: C.inkFaint }}>
                      {b.op.id}
                    </div>
                  </div>
                </div>
              ))}
              <div
                className="flex items-center px-4 text-[10px] font-medium uppercase tracking-[0.06em]"
                style={{ ...mono, height: 44, color: C.inkFaint }}
              >
                Verificatie & facturen
              </div>
            </div>

            {/* Scrollbare tijd-track */}
            <div className="min-w-0 flex-1 overflow-x-auto">
              <div className="relative" style={{ width: TRACK_W }}>
                {/* Wekenkop */}
                <div style={{ borderBottom: `1px solid ${C.line}` }}>
                  <TimelineScale />
                </div>
                {/* Rasterlijnen */}
                <div className="pointer-events-none absolute inset-0 top-[30px]" aria-hidden="true">
                  {WEEKS.map((_, i) => (
                    <span
                      key={i}
                      className="absolute top-0 h-full w-px"
                      style={{ left: i * COL, background: C.grid }}
                    />
                  ))}
                </div>
                <NowLine height={gridH} />

                {/* Balken per swimlane */}
                <div className="relative">
                  {BARS.map((b) => {
                    const isOp = b.soort === "opdracht";
                    const on = hover === b.op.id;
                    return (
                      <div
                        key={b.op.id}
                        className="relative"
                        style={{ height: laneH, borderBottom: `1px solid ${C.lineSoft}` }}
                      >
                        <button
                          onMouseEnter={() => setHover(b.op.id)}
                          onMouseLeave={() => setHover(null)}
                          onFocus={() => setHover(b.op.id)}
                          onBlur={() => setHover(null)}
                          onClick={onOpen}
                          className="group absolute top-1/2 flex -translate-y-1/2 items-center gap-2 overflow-hidden rounded-lg px-3 text-left transition-all focus-visible:outline-none focus-visible:ring-2"
                          style={{
                            left: b.start * COL,
                            width: b.duur * COL,
                            height: 34,
                            background: isOp ? C.accentDeep : "rgba(90,169,255,0.22)",
                            boxShadow: on
                              ? `0 8px 20px -6px ${isOp ? C.accentDeep : C.wait}, inset 0 0 0 1px ${isOp ? C.accent : C.wait}`
                              : `inset 0 0 0 1px ${isOp ? "transparent" : C.wait + "66"}`,
                            ["--tw-ring-color" as string]: C.accent,
                          }}
                          aria-label={`${b.op.titel} — ${b.op.start}`}
                        >
                          <span
                            className="truncate text-[12px] font-semibold"
                            style={{ ...bodyF, color: isOp ? "#fff" : C.ink }}
                          >
                            {b.op.titel}
                          </span>
                          <span
                            className="shrink-0 rounded px-1 py-0.5 text-[10px] font-semibold tabular-nums"
                            style={{
                              ...mono,
                              background: "rgba(0,0,0,0.28)",
                              color: isOp ? "#dfe4ff" : C.wait,
                            }}
                          >
                            {b.op.match}%
                          </span>
                        </button>
                      </div>
                    );
                  })}

                  {/* Marker-rij: verificatie-vervaldata + factuur-mijlpalen */}
                  <div className="relative" style={{ height: 44 }}>
                    {CRED_MARKERS.map((m) => {
                      const meta = credMeta(m.status);
                      return (
                        <div
                          key={m.naam}
                          className="group absolute top-2 -translate-x-1/2"
                          style={{ left: m.x * COL }}
                        >
                          <span
                            className="flex h-7 w-7 items-center justify-center rounded-full"
                            style={{
                              background: meta.bg,
                              boxShadow: `inset 0 0 0 1.5px ${meta.fg}`,
                            }}
                            title={`${m.naam} — ${meta.label}`}
                          >
                            <meta.Icon
                              size={14}
                              strokeWidth={2.4}
                              style={{ color: meta.fg }}
                              aria-hidden="true"
                            />
                          </span>
                          <span
                            className="mt-0.5 block whitespace-nowrap text-[9.5px] font-medium tabular-nums"
                            style={{ ...mono, color: meta.fg }}
                          >
                            {m.naam}
                          </span>
                        </div>
                      );
                    })}
                    {INVOICE_MILESTONES.map((mi) => {
                      const paid = mi.status === "Betaald";
                      return (
                        <div
                          key={mi.nr}
                          className="absolute top-2 -translate-x-1/2"
                          style={{ left: mi.x * COL }}
                        >
                          <span
                            className="flex h-7 w-7 rotate-45 items-center justify-center rounded-[6px]"
                            style={{
                              background: paid ? C.okBg : C.warnBg,
                              boxShadow: `inset 0 0 0 1.5px ${paid ? C.ok : C.warn}`,
                            }}
                            title={`${mi.nr} — ${mi.status}`}
                          >
                            <Flag
                              size={12}
                              strokeWidth={2.4}
                              className="-rotate-45"
                              style={{ color: paid ? C.ok : C.warn }}
                              aria-hidden="true"
                            />
                          </span>
                          <span
                            className="mt-0.5 block whitespace-nowrap text-[9.5px] font-medium tabular-nums"
                            style={{ ...mono, color: paid ? C.ok : C.warn }}
                          >
                            {mi.bedrag}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </Panel>

        {/* Detail bij hover — anders hint */}
        <div className="mt-4">
          {hover ? (
            (() => {
              const b = BARS.find((x) => x.op.id === hover)!;
              return (
                <Panel className="p-4">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="min-w-0">
                      <h3
                        className="text-[15px] font-semibold tracking-tight"
                        style={{ ...display, color: C.ink }}
                      >
                        {b.op.titel}
                      </h3>
                      <p className="mt-0.5 text-[12px]" style={{ ...bodyF, color: C.inkSoft }}>
                        {b.op.opdrachtgever} · {b.op.plaats} · start {b.op.start} · {b.op.uren}
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {b.op.redenen.plus.slice(0, 2).map((r) => (
                        <span
                          key={r}
                          className="inline-flex items-center gap-1 rounded px-2 py-1 text-[11px]"
                          style={{ ...bodyF, background: C.panelHi, color: C.inkSoft }}
                        >
                          <Check
                            size={11}
                            strokeWidth={2.6}
                            style={{ color: C.ok }}
                            aria-hidden="true"
                          />{" "}
                          {r}
                        </span>
                      ))}
                    </div>
                  </div>
                </Panel>
              );
            })()
          ) : (
            <p className="text-center text-[12px]" style={{ ...bodyF, color: C.inkFaint }}>
              Beweeg over een balk voor detail · scroll horizontaal voor latere weken
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Marktplaats — lijst met mini-tijdbalk per opdracht ──
function Marktplaats({ onOpen }: { onOpen: () => void }) {
  const [q, setQ] = useState("");
  const filtered = OPDRACHTEN.filter(
    (o) =>
      o.titel.toLowerCase().includes(q.toLowerCase()) ||
      o.plaats.toLowerCase().includes(q.toLowerCase()) ||
      o.opdrachtgever.toLowerCase().includes(q.toLowerCase()),
  );
  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <SectionHead
          title="Marktplaats"
          sub="Open opdrachten met verwachte startweek"
          Icon={CalendarDays}
        />
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Filter…"
          aria-label="Opdrachten filteren"
          className="rounded-lg px-3 py-2 text-[12.5px] outline-none placeholder:opacity-50 focus-visible:ring-2"
          style={{
            ...bodyF,
            background: C.panel,
            color: C.ink,
            boxShadow: `inset 0 0 0 1px ${C.line}`,
            ["--tw-ring-color" as string]: C.accent,
          }}
        />
      </div>
      {filtered.length === 0 ? (
        <Panel className="flex flex-col items-center gap-2 p-12 text-center">
          <TriangleAlert size={26} style={{ color: C.inkFaint }} aria-hidden="true" />
          <p className="text-[16px] font-semibold" style={{ ...display, color: C.ink }}>
            Geen opdracht gevonden
          </p>
          <p className="text-[12.5px]" style={{ ...bodyF, color: C.inkSoft }}>
            Niets voor &ldquo;{q}&rdquo;.
          </p>
        </Panel>
      ) : (
        <div className="space-y-3">
          {filtered.map((o, i) => (
            <Panel key={o.id}>
              <button
                onClick={onOpen}
                className="flex w-full items-center gap-4 p-4 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset"
                style={{ ["--tw-ring-color" as string]: C.accent }}
              >
                <div className="min-w-0 flex-1">
                  <div
                    className="truncate text-[15px] font-semibold tracking-tight"
                    style={{ ...display, color: C.ink }}
                  >
                    {o.titel}
                  </div>
                  <div
                    className="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-[12px]"
                    style={{ ...bodyF, color: C.inkSoft }}
                  >
                    <span className="inline-flex items-center gap-1">
                      <MapPin size={12} style={{ color: C.accent }} aria-hidden="true" /> {o.plaats}
                    </span>
                    <span className="inline-flex items-center gap-1">
                      <Coins size={12} style={{ color: C.accent }} aria-hidden="true" /> {o.tarief}
                    </span>
                    <span className="inline-flex items-center gap-1">
                      <CalendarDays size={12} style={{ color: C.accent }} aria-hidden="true" />{" "}
                      {o.start}
                    </span>
                  </div>
                  {/* Mini-tijdbalk */}
                  <div
                    className="mt-2.5 h-2 w-full overflow-hidden rounded-full"
                    style={{ background: C.panelHi }}
                    aria-hidden="true"
                  >
                    <div
                      className="h-full rounded-full"
                      style={{
                        marginLeft: `${8 + i * 14}%`,
                        width: `${30 + o.match / 4}%`,
                        background: C.accentDeep,
                      }}
                    />
                  </div>
                </div>
                <span className="flex shrink-0 flex-col items-center">
                  <span
                    className="text-[16px] font-semibold tabular-nums leading-none"
                    style={{ ...mono, color: C.accent }}
                  >
                    {o.match}
                  </span>
                  <span
                    className="text-[8px] font-semibold uppercase tracking-[0.1em]"
                    style={{ ...mono, color: C.inkFaint }}
                  >
                    match
                  </span>
                </span>
                <ChevronRight size={17} style={{ color: C.inkFaint }} aria-hidden="true" />
              </button>
            </Panel>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Opdracht-detail — met tijdlijn van fasen ──
function OpdrachtDetail({ opdracht, onBack }: { opdracht: Opdracht; onBack: () => void }) {
  const fasen = [
    { l: "Reactie", d: "23 jun", done: true },
    { l: "Intake", d: "27 jun", done: true },
    { l: "Start", d: opdracht.start, done: false },
    { l: "Evaluatie", d: "4 aug", done: false },
  ];
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
        className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-[12px] font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
        style={{
          ...bodyF,
          background: C.panel,
          color: C.ink,
          boxShadow: `inset 0 0 0 1px ${C.line}`,
          ["--tw-ring-color" as string]: C.accent,
          ["--tw-ring-offset-color" as string]: C.bg,
        }}
      >
        <ArrowLeft size={14} aria-hidden="true" /> Terug
      </button>

      <Panel className="p-6">
        <span
          className="rounded px-2 py-1 text-[11px] font-semibold"
          style={{ ...mono, background: C.panelHi, color: C.accent }}
        >
          {opdracht.id}
        </span>
        <h1
          className="mt-3 text-[26px] font-semibold leading-tight tracking-tight"
          style={{ ...display, color: C.ink }}
        >
          {opdracht.titel}
        </h1>
        <p className="mt-1.5 text-[13px]" style={{ ...bodyF, color: C.inkSoft }}>
          {opdracht.opdrachtgever} · {opdracht.plaats}
        </p>
      </Panel>

      {/* Fasen-tijdlijn */}
      <Panel className="p-5">
        <h3
          className="mb-4 flex items-center gap-2 text-[13px] font-semibold"
          style={{ ...display, color: C.ink }}
        >
          <Milestone size={15} style={{ color: C.accent }} aria-hidden="true" /> Tijdlijn
        </h3>
        <ol className="relative flex flex-col gap-0 sm:flex-row sm:gap-0">
          {fasen.map((f, i) => (
            <li
              key={f.l}
              className="relative flex flex-1 items-center gap-3 pb-4 sm:flex-col sm:items-start sm:pb-0"
            >
              <span
                className="z-10 flex h-7 w-7 shrink-0 items-center justify-center rounded-full"
                style={{
                  background: f.done ? C.accentDeep : C.panelHi,
                  boxShadow: `inset 0 0 0 1.5px ${f.done ? C.accent : C.line}`,
                }}
                aria-hidden="true"
              >
                {f.done ? (
                  <Check size={13} strokeWidth={2.6} style={{ color: "#fff" }} />
                ) : (
                  <Clock size={13} style={{ color: C.inkFaint }} />
                )}
              </span>
              <div className="sm:mt-2">
                <div className="text-[13px] font-semibold" style={{ ...bodyF, color: C.ink }}>
                  {f.l}
                </div>
                <div className="text-[11px] tabular-nums" style={{ ...mono, color: C.inkFaint }}>
                  {f.d}
                </div>
              </div>
              {i < fasen.length - 1 && (
                <span
                  className="absolute left-3.5 top-7 h-full w-px sm:left-7 sm:top-3.5 sm:h-px sm:w-full"
                  style={{ background: f.done ? C.accentDeep : C.line }}
                  aria-hidden="true"
                />
              )}
            </li>
          ))}
        </ol>
      </Panel>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {feiten.map((f) => (
          <Panel key={f.l} className="p-4">
            <f.Icon size={15} strokeWidth={2} style={{ color: C.accent }} aria-hidden="true" />
            <div
              className="mt-2 text-[16px] font-semibold tabular-nums leading-none"
              style={{ ...mono, color: C.ink }}
            >
              {f.v}
            </div>
            <div
              className="mt-1 text-[10.5px] font-medium uppercase tracking-[0.08em]"
              style={{ ...mono, color: C.inkFaint }}
            >
              {f.l}
            </div>
          </Panel>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <Panel className="p-5">
          <h3
            className="mb-3 text-[14px] font-semibold tracking-tight"
            style={{ ...display, color: C.ink }}
          >
            Waarom dit past
          </h3>
          <ul className="space-y-2.5">
            {opdracht.redenen.plus.map((r) => (
              <li
                key={r}
                className="flex items-start gap-2.5 text-[13px] leading-snug"
                style={{ ...bodyF, color: C.ink }}
              >
                <Check
                  size={15}
                  strokeWidth={2.6}
                  style={{ color: C.ok }}
                  className="mt-0.5 shrink-0"
                  aria-hidden="true"
                />{" "}
                {r}
              </li>
            ))}
          </ul>
        </Panel>
        <Panel className="p-5">
          <h3
            className="mb-3 text-[14px] font-semibold tracking-tight"
            style={{ ...display, color: C.ink }}
          >
            Om te overwegen
          </h3>
          <ul className="space-y-2.5">
            {opdracht.redenen.min.map((r) => (
              <li
                key={r}
                className="flex items-start gap-2.5 text-[13px] leading-snug"
                style={{ ...bodyF, color: C.ink }}
              >
                <TriangleAlert
                  size={15}
                  strokeWidth={2.4}
                  style={{ color: C.warn }}
                  className="mt-0.5 shrink-0"
                  aria-hidden="true"
                />{" "}
                {r}
              </li>
            ))}
          </ul>
        </Panel>
      </div>

      <button
        className="flex w-full items-center justify-center gap-2 rounded-lg px-6 py-3.5 text-[13px] font-semibold transition-transform hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
        style={{
          ...bodyF,
          background: C.accentDeep,
          color: "#fff",
          ["--tw-ring-color" as string]: C.accent,
          ["--tw-ring-offset-color" as string]: C.bg,
        }}
      >
        Reageer op deze opdracht <ArrowRight size={16} aria-hidden="true" />
      </button>
    </div>
  );
}

// ── Verificatie — met vervaldatums als mini-tijdbalk ──
function Verificatie() {
  const verified = CREDENTIALS.filter((c) => c.status === "VERIFIED").length;
  const dek = Math.round((verified / CREDENTIALS.length) * 100);
  return (
    <div className="space-y-5">
      <SectionHead
        title="Verificatie"
        sub="Certificaten met geldigheid op de tijdas"
        Icon={ShieldCheck}
      />
      <Panel className="p-5">
        <div className="flex items-center justify-between">
          <div className="text-[13px] font-semibold" style={{ ...bodyF, color: C.ink }}>
            Dekking · {verified}/{CREDENTIALS.length} geverifieerd
          </div>
          <span
            className="text-[26px] font-semibold tabular-nums"
            style={{ ...mono, color: C.accent }}
          >
            {dek}%
          </span>
        </div>
        <div
          className="mt-3 h-2 w-full overflow-hidden rounded-full"
          style={{ background: C.panelHi }}
          aria-hidden="true"
        >
          <div className="h-full rounded-full" style={{ width: `${dek}%`, background: C.accent }} />
        </div>
      </Panel>
      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
        {CREDENTIALS.map((c) => {
          const m = credMeta(c.status);
          return (
            <Panel key={c.naam} className="flex items-center gap-3.5 p-4">
              <span
                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg"
                style={{ background: m.bg, boxShadow: `inset 0 0 0 1px ${m.fg}44` }}
                aria-hidden="true"
              >
                <m.Icon size={19} strokeWidth={2.2} style={{ color: m.fg }} />
              </span>
              <div className="min-w-0 flex-1">
                <div
                  className="truncate text-[14px] font-semibold tracking-tight"
                  style={{ ...display, color: C.ink }}
                >
                  {c.naam}
                </div>
                <div className="mt-0.5 text-[12px]" style={{ ...bodyF, color: C.inkSoft }}>
                  {c.detail}
                </div>
                <div className="mt-2">
                  <StatusTag status={c.status} />
                </div>
              </div>
            </Panel>
          );
        })}
      </div>
    </div>
  );
}

// ── Acties ──
function Acties() {
  const sorted = [...ACTIES].sort((a, b) =>
    a.urgentie === b.urgentie ? 0 : a.urgentie === "warning" ? -1 : 1,
  );
  return (
    <div className="space-y-5">
      <SectionHead
        title="Volgende beste acties"
        sub="Op urgentie gerangschikt"
        Icon={TriangleAlert}
      />
      <ol className="space-y-3">
        {sorted.map((a, i) => {
          const warn = a.urgentie === "warning";
          return (
            <li key={a.titel}>
              <Panel className="flex items-stretch overflow-hidden">
                <span
                  className="w-1 shrink-0"
                  style={{ background: warn ? C.warn : C.accent }}
                  aria-hidden="true"
                />
                <div className="flex min-w-0 flex-1 items-center gap-4 p-4">
                  <span
                    className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-[14px] font-semibold tabular-nums"
                    style={{
                      ...mono,
                      background: warn ? C.warnBg : C.panelHi,
                      color: warn ? C.warn : C.accent,
                    }}
                    aria-hidden="true"
                  >
                    {warn ? <TriangleAlert size={17} strokeWidth={2.2} /> : i + 1}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span
                        className="rounded px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-[0.06em]"
                        style={{
                          ...mono,
                          background: warn ? C.warnBg : C.waitBg,
                          color: warn ? C.warn : C.wait,
                        }}
                      >
                        {warn ? "Urgent" : "Kans"}
                      </span>
                      <h3
                        className="text-[15px] font-semibold tracking-tight"
                        style={{ ...display, color: C.ink }}
                      >
                        {a.titel}
                      </h3>
                    </div>
                    <p
                      className="mt-1 text-[12.5px] leading-relaxed"
                      style={{ ...bodyF, color: C.inkSoft }}
                    >
                      {a.detail}
                    </p>
                  </div>
                  <button
                    className="hidden shrink-0 items-center gap-2 rounded-lg px-3.5 py-2 text-[12px] font-semibold focus-visible:outline-none focus-visible:ring-2 sm:inline-flex"
                    style={{
                      ...bodyF,
                      background: warn ? C.warn : C.panelHi,
                      color: warn ? "#231803" : C.ink,
                      boxShadow: warn ? "none" : `inset 0 0 0 1px ${C.line}`,
                      ["--tw-ring-color" as string]: C.accent,
                    }}
                  >
                    {a.cta} <ArrowRight size={13} aria-hidden="true" />
                  </button>
                </div>
              </Panel>
            </li>
          );
        })}
      </ol>
    </div>
  );
}

// ── Facturen — als mijlpalen op een betaal-tijdlijn ──
function Facturen() {
  const factMeta = (s: string) => {
    if (s === "Betaald") return { label: "Betaald", Icon: Check, fg: C.ok, bg: C.okBg };
    if (s === "Openstaand") return { label: "Openstaand", Icon: Clock, fg: C.warn, bg: C.warnBg };
    return { label: "Concept", Icon: Milestone, fg: C.inkSoft, bg: C.panelHi };
  };
  const betaald = "€ 8.622";
  return (
    <div className="space-y-5">
      <SectionHead title="Facturen" sub="Mijlpalen op de betaal-tijdlijn" Icon={Coins} />
      <Panel className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[520px] text-left">
            <thead>
              <tr style={{ background: C.panelHi }}>
                {["Nummer", "Klant", "Datum", "Status", "Bedrag"].map((h, i) => (
                  <th
                    key={h}
                    className={`px-4 py-2.5 text-[10.5px] font-semibold uppercase tracking-[0.08em] ${i === 4 ? "text-right" : ""}`}
                    style={{ ...mono, color: C.inkFaint }}
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
                  <tr key={f.nr} style={i === 0 ? undefined : { borderTop: `1px solid ${C.line}` }}>
                    <td
                      className="px-4 py-3 text-[13px] font-bold tabular-nums"
                      style={{ ...mono, color: C.ink }}
                    >
                      {f.nr}
                    </td>
                    <td className="px-4 py-3 text-[13px]" style={{ ...bodyF, color: C.inkSoft }}>
                      {f.klant}
                    </td>
                    <td
                      className="px-4 py-3 text-[12px] tabular-nums"
                      style={{ ...mono, color: C.inkFaint }}
                    >
                      {f.datum}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className="inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-[11px] font-semibold"
                        style={{
                          ...bodyF,
                          background: m.bg,
                          color: m.fg,
                          boxShadow: `inset 0 0 0 1px ${m.fg}44`,
                        }}
                      >
                        <m.Icon size={11} strokeWidth={2.4} aria-hidden="true" /> {m.label}
                      </span>
                    </td>
                    <td
                      className="px-4 py-3 text-right text-[14px] font-semibold tabular-nums"
                      style={{ ...mono, color: C.ink }}
                    >
                      {f.bedrag}
                    </td>
                  </tr>
                );
              })}
            </tbody>
            <tfoot>
              <tr style={{ background: C.panelHi }}>
                <td
                  colSpan={4}
                  className="px-4 py-3 text-[11px] font-medium uppercase tracking-[0.1em]"
                  style={{ ...mono, color: C.inkFaint }}
                >
                  Totaal betaald
                </td>
                <td
                  className="px-4 py-3 text-right text-[15px] font-bold tabular-nums"
                  style={{ ...mono, color: C.accent }}
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
