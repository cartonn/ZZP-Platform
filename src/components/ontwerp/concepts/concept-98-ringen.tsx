"use client";

// Concept 98 — "Ringen" · voortgangsringen in fitness-activity-stijl (Apple-Fitness-graad).
// Levendig donker canvas (#0a0b10) waar gesloten concentrische ringen de kern-metafoor zijn:
// verificatie-compleetheid, match-doel en omzet-doel als kleurrijke arcs (SVG stroke-dasharray).
// Felle verzadigde ringkleuren — limoen (#b6ff3a), magenta (#ff3d8b), cyaan (#34e6ff) — op diep
// grafiet. Elk kernscherm gebruikt een ring/arc waar een verhouding of voortgang telt. Motion via
// transition (geen animatie-loop). Toegankelijk: elke ring heeft óók een numeriek label + tekst;
// status wordt nooit alleen met kleur getoond. Fonts: Geist (display) + Geist Mono (cijfers/meta).

import { useEffect, useState } from "react";
import {
  ShieldCheck,
  Clock,
  AlertTriangle,
  XCircle,
  Search,
  ArrowRight,
  ArrowUpRight,
  ArrowDownRight,
  Check,
  Plus,
  MapPin,
  Activity,
  Target,
  Flame,
  Zap,
  TrendingUp,
  RotateCw,
  ChevronRight,
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
  NAV,
  type ScreenKey,
  type CredStatus,
  type Opdracht,
} from "./mock";

void NAV;

/* ---------- Palet & typografie ---------- */

const C = {
  bg: "#0a0b10",
  bgAlt: "#101219",
  panel: "rgba(20,23,32,0.72)",
  panelSolid: "#141822",
  fg: "#f2f4fa",
  lime: "#b6ff3a",
  magenta: "#ff3d8b",
  cyan: "#34e6ff",
  amber: "#ffb020",
  red: "#ff5b6a",
  muted: "#8b93a7",
  faint: "#565e72",
  line: "rgba(255,255,255,0.09)",
  lineSoft: "rgba(255,255,255,0.05)",
  track: "rgba(255,255,255,0.08)",
};

const display = { fontFamily: "var(--font-lab-geist)" };
const meta = { fontFamily: "var(--font-lab-geist-mono)" };

const SHADOW = "0 24px 60px -34px rgba(0,0,0,0.9), inset 0 0 0 1px rgba(255,255,255,0.03)";
const RING = "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2";
const ringStyle = {
  "--tw-ring-color": C.cyan,
  "--tw-ring-offset-color": C.bg,
} as React.CSSProperties;

/* ---------- Status → betekenis (label + icoon + kleur, nooit kleur-alleen) ---------- */

type CredMeta = { label: string; color: string; Icon: typeof ShieldCheck };

function credMeta(s: CredStatus): CredMeta {
  switch (s) {
    case "VERIFIED":
      return { label: "Gesloten", color: C.lime, Icon: ShieldCheck };
    case "SUBMITTED":
      return { label: "In beoordeling", color: C.cyan, Icon: Clock };
    case "EXPIRING":
      return { label: "Verloopt bijna", color: C.amber, Icon: AlertTriangle };
    case "REJECTED":
      return { label: "Afgewezen", color: C.red, Icon: XCircle };
  }
}

function digits(v: string): number {
  const only = v.replace(/[^\d]/g, "");
  return only ? parseInt(only, 10) : 0;
}

/* ---------- Ring-primitieven (het handtekening-element) ---------- */

// Eén arc-ring. Deterministische stroke-dasharray; percentage sluit de ring.
function ArcRing({
  size,
  stroke,
  value,
  color,
  track = C.track,
  rounded = true,
}: {
  size: number;
  stroke: number;
  value: number;
  color: string;
  track?: string;
  rounded?: boolean;
}) {
  const r = (size - stroke) / 2;
  const circ = 2 * Math.PI * r;
  const dash = circ * (Math.max(0, Math.min(100, value)) / 100);
  return (
    <>
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={track} strokeWidth={stroke} />
      <circle
        cx={size / 2}
        cy={size / 2}
        r={r}
        fill="none"
        stroke={color}
        strokeWidth={stroke}
        strokeLinecap={rounded ? "round" : "butt"}
        strokeDasharray={`${dash.toFixed(2)} ${(circ - dash).toFixed(2)}`}
        style={{
          transition: "stroke-dasharray 700ms cubic-bezier(0.22,1,0.36,1)",
          filter: `drop-shadow(0 0 6px ${color}88)`,
        }}
      />
    </>
  );
}

// Drie gestapelde ringen: verificatie (buiten), match (midden), omzet (binnen).
function ActivityRings({
  size = 168,
  verificatie,
  match,
  omzet,
}: {
  size?: number;
  verificatie: number;
  match: number;
  omzet: number;
}) {
  const s = 14;
  const gap = 4;
  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      className="-rotate-90"
      role="img"
      aria-label={`Ringen: verificatie ${verificatie}%, match ${match}%, omzetdoel ${omzet}%`}
    >
      <g transform={`translate(0,0)`}>
        <ArcRing size={size} stroke={s} value={verificatie} color={C.lime} />
      </g>
      <g transform={`translate(${s + gap},${s + gap})`}>
        <ArcRing size={size - 2 * (s + gap)} stroke={s} value={match} color={C.cyan} />
      </g>
      <g transform={`translate(${2 * (s + gap)},${2 * (s + gap)})`}>
        <ArcRing size={size - 4 * (s + gap)} stroke={s} value={omzet} color={C.magenta} />
      </g>
    </svg>
  );
}

// Compacte enkel-ring met waarde in het midden.
function StatRing({
  value,
  color,
  label,
  size = 62,
}: {
  value: number;
  color: string;
  label?: string;
  size?: number;
}) {
  return (
    <span
      className="relative inline-flex shrink-0 items-center justify-center"
      style={{ width: size, height: size }}
    >
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        className="-rotate-90"
        aria-hidden="true"
      >
        <ArcRing size={size} stroke={6} value={value} color={color} />
      </svg>
      <span className="absolute flex flex-col items-center leading-none">
        <span className="text-[14px] font-semibold tabular-nums" style={{ ...meta, color: C.fg }}>
          {value}
        </span>
        {label && (
          <span
            className="mt-0.5 text-[8px] uppercase tracking-[0.1em]"
            style={{ ...meta, color: C.faint }}
          >
            {label}
          </span>
        )}
      </span>
    </span>
  );
}

/* ---------- Kleine bouwstenen ---------- */

function Kicker({ children, color = C.cyan }: { children: React.ReactNode; color?: string }) {
  return (
    <span
      className="inline-flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.28em]"
      style={{ ...meta, color }}
    >
      <span
        className="h-1.5 w-1.5 rounded-full"
        style={{ background: color, boxShadow: `0 0 8px ${color}` }}
        aria-hidden="true"
      />
      {children}
    </span>
  );
}

function Title({ children }: { children: React.ReactNode }) {
  return (
    <h1
      className="mt-2 text-[26px] font-semibold leading-[1.05] tracking-[-0.02em] sm:text-[32px]"
      style={{ ...display, color: C.fg }}
    >
      {children}
    </h1>
  );
}

function Panel({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <div
      className={`rounded-2xl backdrop-blur-sm ${className}`}
      style={{ background: C.panel, border: `1px solid ${C.line}`, boxShadow: SHADOW }}
    >
      {children}
    </div>
  );
}

function StatusBadge({ status }: { status: CredStatus }) {
  const m = credMeta(status);
  const Icon = m.Icon;
  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold"
      style={{
        ...meta,
        color: m.color,
        background: "rgba(0,0,0,0.3)",
        border: `1px solid ${m.color}55`,
      }}
    >
      <Icon size={13} strokeWidth={2.4} aria-hidden="true" />
      {m.label}
    </span>
  );
}

function Spark({ data, color = C.cyan }: { data: number[]; color?: string }) {
  const w = 96;
  const h = 28;
  const min = Math.min(...data);
  const max = Math.max(...data);
  const span = max - min || 1;
  const pts = data.map((v, i) => {
    const x = (i / (data.length - 1)) * w;
    const y = h - ((v - min) / span) * (h - 4) - 2;
    return [x, y] as const;
  });
  const line = pts
    .map((p, i) => `${i === 0 ? "M" : "L"}${p[0].toFixed(1)} ${p[1].toFixed(1)}`)
    .join(" ");
  const last = pts[pts.length - 1];
  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} aria-hidden="true">
      <path
        d={line}
        fill="none"
        stroke={color}
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
        style={{ filter: `drop-shadow(0 0 3px ${color}aa)` }}
      />
      {last && <circle cx={last[0]} cy={last[1]} r="2.2" fill={color} />}
    </svg>
  );
}

/* ---------- Afgeleide, deterministische doelwaarden ---------- */

// Verificatie-compleetheid = aandeel VERIFIED credentials.
const VERIF_PCT = Math.round(
  (CREDENTIALS.filter((c) => c.status === "VERIFIED").length / CREDENTIALS.length) * 100,
);
// Match-doel = gemiddelde match over open opdrachten, richting doel 100.
const MATCH_PCT = Math.round(OPDRACHTEN.reduce((s, o) => s + o.match, 0) / OPDRACHTEN.length);
// Omzet-doel = ontvangen t.o.v. maanddoel € 12.000.
const OMZET_DOEL = 12000;
const OMZET_ONTVANGEN = FACTUREN.filter((f) => f.status === "Betaald").reduce(
  (s, f) => s + digits(f.bedrag),
  0,
);
const OMZET_PCT = Math.min(100, Math.round((OMZET_ONTVANGEN / OMZET_DOEL) * 100));

const RING_LEGEND = [
  {
    label: "Verificatie",
    color: C.lime,
    value: VERIF_PCT,
    Icon: ShieldCheck,
    sub: `${CREDENTIALS.filter((c) => c.status === "VERIFIED").length}/${CREDENTIALS.length} gesloten`,
  },
  { label: "Match-doel", color: C.cyan, value: MATCH_PCT, Icon: Target, sub: "gem. over open" },
  {
    label: "Omzet-doel",
    color: C.magenta,
    value: OMZET_PCT,
    Icon: Flame,
    sub: `€ ${OMZET_ONTVANGEN.toLocaleString("nl-NL")} / € ${OMZET_DOEL.toLocaleString("nl-NL")}`,
  },
];

/* ---------- Hoofdcomponent ---------- */

export function Concept98() {
  const [screen, setScreen] = useState<ScreenKey>("dashboard");
  const [activeId, setActiveId] = useState<string>(OPDRACHTEN[0]?.id ?? "");
  const active = OPDRACHTEN.find((o) => o.id === activeId) ?? (OPDRACHTEN[0] as Opdracht);

  const open = (id?: string) => {
    if (id) setActiveId(id);
    setScreen("opdracht");
  };

  return (
    <div
      className="relative min-h-[680px] w-full overflow-hidden antialiased"
      style={{
        ...display,
        color: C.fg,
        background: `radial-gradient(120% 90% at 12% -10%, ${C.bgAlt}, ${C.bg} 60%)`,
      }}
    >
      {/* Subtiele ring-echo op de achtergrond, puur decoratief */}
      <div
        className="pointer-events-none absolute -right-24 -top-24 opacity-[0.14]"
        aria-hidden="true"
      >
        <svg width={420} height={420} viewBox="0 0 420 420" className="-rotate-90">
          <ArcRing size={420} stroke={26} value={72} color={C.magenta} track="transparent" />
          <g transform="translate(46,46)">
            <ArcRing size={328} stroke={26} value={54} color={C.cyan} track="transparent" />
          </g>
        </svg>
      </div>

      <div className="relative flex min-h-[680px] flex-col md:flex-row">
        {/* Zijbalk */}
        <aside
          className="shrink-0 md:w-[236px]"
          style={{ borderRight: `1px solid ${C.line}`, background: "rgba(0,0,0,0.28)" }}
        >
          <div className="flex h-full flex-col">
            <div
              className="flex items-center gap-3 p-5"
              style={{ borderBottom: `1px solid ${C.lineSoft}` }}
            >
              <span
                className="relative flex h-10 w-10 shrink-0 items-center justify-center"
                aria-hidden="true"
              >
                <svg width={40} height={40} viewBox="0 0 40 40" className="-rotate-90">
                  <ArcRing size={40} stroke={4.5} value={78} color={C.lime} />
                  <g transform="translate(6,6)">
                    <ArcRing size={28} stroke={4.5} value={60} color={C.cyan} />
                  </g>
                </svg>
              </span>
              <div className="leading-tight">
                <div className="text-[16px] font-semibold" style={{ ...display, color: C.fg }}>
                  Ringen
                </div>
                <div
                  className="text-[9px] font-semibold uppercase tracking-[0.24em]"
                  style={{ ...meta, color: C.faint }}
                >
                  ZZP · voortgang
                </div>
              </div>
            </div>

            <nav
              className="flex flex-row gap-1 overflow-x-auto p-2 md:flex-1 md:flex-col"
              aria-label="Hoofdnavigatie"
            >
              {SCREENS.map((s) => {
                const on = s.key === screen;
                return (
                  <button
                    key={s.key}
                    type="button"
                    onClick={() => setScreen(s.key)}
                    aria-current={on ? "page" : undefined}
                    style={ringStyle}
                    className={`relative flex shrink-0 items-center gap-2.5 rounded-xl px-3.5 py-2.5 text-left text-[13px] font-medium transition-colors md:w-full ${RING}`}
                  >
                    <span
                      className="h-1.5 w-1.5 shrink-0 rounded-full transition-all"
                      style={{
                        background: on ? C.cyan : C.faint,
                        boxShadow: on ? `0 0 8px ${C.cyan}` : "none",
                      }}
                      aria-hidden="true"
                    />
                    <span style={{ color: on ? C.fg : C.muted }}>{s.label}</span>
                  </button>
                );
              })}
            </nav>

            <div
              className="hidden items-center gap-3 p-4 md:flex"
              style={{ borderTop: `1px solid ${C.lineSoft}`, background: "rgba(0,0,0,0.24)" }}
            >
              <span
                className="relative flex h-11 w-11 shrink-0 items-center justify-center"
                aria-hidden="true"
              >
                <svg width={44} height={44} viewBox="0 0 44 44" className="-rotate-90">
                  <ArcRing size={44} stroke={4} value={VERIF_PCT} color={C.lime} />
                </svg>
                <span
                  className="absolute text-[11px] font-semibold"
                  style={{ ...meta, color: C.fg }}
                >
                  {PROFIEL.initialen}
                </span>
              </span>
              <div className="min-w-0">
                <div className="truncate text-[13px] font-semibold" style={{ color: C.fg }}>
                  {PROFIEL.naam}
                </div>
                <div
                  className="flex items-center gap-1 text-[10px] font-semibold"
                  style={{ color: C.lime }}
                >
                  <ShieldCheck size={11} strokeWidth={2.4} aria-hidden="true" /> {PROFIEL.trust}
                </div>
              </div>
            </div>
          </div>
        </aside>

        <main className="flex min-w-0 flex-1 flex-col">
          <div className="flex-1 overflow-y-auto p-5 sm:p-8">
            {screen === "dashboard" && <Dashboard onOpen={open} onGo={setScreen} />}
            {screen === "marktplaats" && (
              <Marktplaats activeId={activeId} onSelect={setActiveId} onOpen={open} />
            )}
            {screen === "opdracht" && <OpdrachtDetail opdracht={active} />}
            {screen === "verificatie" && <Verificatie />}
            {screen === "acties" && <Acties onGo={setScreen} />}
            {screen === "facturen" && <Facturen />}
          </div>
        </main>
      </div>
    </div>
  );
}

/* ---------- Dashboard ---------- */

function Dashboard({
  onOpen,
  onGo,
}: {
  onOpen: (id?: string) => void;
  onGo: (k: ScreenKey) => void;
}) {
  const warn = ACTIES[0];
  const [feed, setFeed] = useState<"loading" | "error" | "ok">("loading");
  useEffect(() => {
    const t = window.setTimeout(() => setFeed("error"), 700);
    return () => window.clearTimeout(t);
  }, []);

  return (
    <div className="mx-auto max-w-5xl space-y-7">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <Kicker>Vandaag</Kicker>
          <Title>Goedemorgen, {PROFIEL.naam.split(" ")[0]}</Title>
          <p className="mt-2 text-[13px]" style={{ color: C.muted }}>
            {PROFIEL.rol} · {PROFIEL.plaats}
          </p>
        </div>
        <div
          className="flex items-center gap-2 rounded-full px-3.5 py-2 text-[11px] font-semibold"
          style={{
            ...meta,
            color: C.cyan,
            background: "rgba(0,0,0,0.3)",
            border: `1px solid ${C.line}`,
          }}
        >
          <Activity size={13} strokeWidth={2.2} aria-hidden="true" /> {OPDRACHTEN.length} matches
          open
        </div>
      </header>

      {warn && (
        <div
          className="flex flex-col gap-3 rounded-2xl p-4 sm:flex-row sm:items-center"
          style={{
            border: `1px solid ${C.amber}55`,
            background: "rgba(255,176,32,0.08)",
            boxShadow: SHADOW,
          }}
          role="alert"
        >
          <span
            className="flex h-10 w-10 shrink-0 items-center justify-center self-start rounded-xl"
            style={{ background: "rgba(0,0,0,0.34)", border: `1px solid ${C.amber}55` }}
          >
            <AlertTriangle size={18} strokeWidth={2.2} color={C.amber} aria-hidden="true" />
          </span>
          <p className="text-[13px] leading-snug" style={{ color: C.fg }}>
            <span className="font-semibold">{warn.titel}.</span>{" "}
            <span style={{ color: C.muted }}>{warn.detail}</span>
          </p>
          <button
            type="button"
            onClick={() => onGo("verificatie")}
            style={ringStyle}
            className={`ml-auto inline-flex shrink-0 items-center gap-1.5 rounded-full px-3.5 py-2 text-[12px] font-semibold transition-transform hover:-translate-y-0.5 ${RING}`}
          >
            <span
              style={{ color: C.bg, background: C.amber }}
              className="-mx-3.5 -my-2 inline-flex items-center gap-1.5 rounded-full px-3.5 py-2"
            >
              {warn.cta} <ArrowRight size={13} strokeWidth={2.6} aria-hidden="true" />
            </span>
          </button>
        </div>
      )}

      {/* Ring-samenvatting — het handtekening-blok */}
      <Panel className="p-5 sm:p-6">
        <div className="flex flex-col items-center gap-6 sm:flex-row sm:gap-8">
          <div className="relative flex shrink-0 items-center justify-center">
            <ActivityRings verificatie={VERIF_PCT} match={MATCH_PCT} omzet={OMZET_PCT} />
            <div className="absolute flex flex-col items-center">
              <span
                className="text-[24px] font-semibold tabular-nums leading-none"
                style={{ ...display, color: C.fg }}
              >
                {Math.round((VERIF_PCT + MATCH_PCT + OMZET_PCT) / 3)}%
              </span>
              <span
                className="mt-1 text-[9px] uppercase tracking-[0.16em]"
                style={{ ...meta, color: C.faint }}
              >
                gemiddeld
              </span>
            </div>
          </div>
          <div className="w-full flex-1 space-y-3">
            <h2
              className="flex items-center gap-2 text-[15px] font-semibold"
              style={{ color: C.fg }}
            >
              <Zap size={16} strokeWidth={2.2} color={C.lime} aria-hidden="true" /> Je ringen
              vandaag
            </h2>
            <ul className="space-y-2.5">
              {RING_LEGEND.map((r) => {
                const Icon = r.Icon;
                return (
                  <li key={r.label} className="flex items-center gap-3">
                    <span
                      className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full"
                      style={{ background: `${r.color}1c`, border: `1px solid ${r.color}55` }}
                    >
                      <Icon size={16} strokeWidth={2.2} color={r.color} aria-hidden="true" />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="flex items-baseline justify-between gap-2">
                        <span className="text-[13px] font-semibold" style={{ color: C.fg }}>
                          {r.label}
                        </span>
                        <span
                          className="text-[13px] font-semibold tabular-nums"
                          style={{ ...meta, color: r.color }}
                        >
                          {r.value}%
                        </span>
                      </span>
                      <span
                        className="mt-1 block h-1.5 w-full overflow-hidden rounded-full"
                        style={{ background: C.track }}
                        aria-hidden="true"
                      >
                        <span
                          className="block h-full rounded-full transition-all duration-700"
                          style={{
                            width: `${r.value}%`,
                            background: r.color,
                            boxShadow: `0 0 8px ${r.color}`,
                          }}
                        />
                      </span>
                      <span className="mt-1 block text-[11px]" style={{ ...meta, color: C.muted }}>
                        {r.sub}
                      </span>
                    </span>
                  </li>
                );
              })}
            </ul>
          </div>
        </div>
      </Panel>

      {/* KPI-tegels met mini-ring waar zinvol */}
      <div className="grid grid-cols-2 gap-3.5 lg:grid-cols-4">
        {KPIS.map((k, i) => {
          const color = i === 0 ? C.cyan : i === 2 ? C.magenta : k.up ? C.lime : C.amber;
          return (
            <Panel key={k.label} className="flex flex-col justify-between p-4">
              <div className="flex items-start justify-between gap-2">
                <p
                  className="text-[10.5px] font-semibold uppercase leading-tight tracking-[0.06em]"
                  style={{ ...meta, color: C.muted }}
                >
                  {k.label}
                </p>
                <span
                  className="inline-flex items-center gap-0.5 text-[11px] font-semibold tabular-nums"
                  style={{ ...meta, color: k.up ? C.lime : C.amber }}
                >
                  {k.up ? (
                    <ArrowUpRight size={12} strokeWidth={2.6} aria-hidden="true" />
                  ) : (
                    <ArrowDownRight size={12} strokeWidth={2.6} aria-hidden="true" />
                  )}
                  {k.trend}
                </span>
              </div>
              <p
                className="mt-3 text-[24px] tabular-nums leading-none"
                style={{ ...display, color: C.fg }}
              >
                {k.value}
              </p>
              <div className="mt-2">
                <Spark data={k.spark} color={color} />
              </div>
            </Panel>
          );
        })}
      </div>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-[1.15fr_1fr]">
        {/* Beste matches met ring-score */}
        <Panel>
          <div
            className="flex items-center justify-between p-4"
            style={{ borderBottom: `1px solid ${C.lineSoft}` }}
          >
            <h3
              className="flex items-center gap-2 text-[14px] font-semibold"
              style={{ color: C.fg }}
            >
              <Target size={16} strokeWidth={2} color={C.cyan} aria-hidden="true" /> Beste matches
            </h3>
            <button
              type="button"
              onClick={() => onGo("marktplaats")}
              style={ringStyle}
              className={`inline-flex items-center gap-1 rounded-md px-2 py-1 text-[11px] font-semibold ${RING}`}
            >
              <span style={{ ...meta, color: C.cyan }} className="inline-flex items-center gap-1">
                Alles <ArrowRight size={12} strokeWidth={2.6} aria-hidden="true" />
              </span>
            </button>
          </div>
          <ul className="p-2">
            {OPDRACHTEN.map((o) => (
              <li key={o.id}>
                <button
                  type="button"
                  onClick={() => onOpen(o.id)}
                  style={ringStyle}
                  className={`flex w-full items-center gap-3 rounded-xl p-3 text-left transition-colors hover:bg-white/[0.04] ${RING}`}
                >
                  <StatRing value={o.match} color={o.match >= 90 ? C.lime : C.cyan} size={52} />
                  <span className="min-w-0 flex-1">
                    <span
                      className="block truncate text-[13.5px] font-semibold"
                      style={{ color: C.fg }}
                    >
                      {o.titel}
                    </span>
                    <span
                      className="block truncate text-[11px]"
                      style={{ ...meta, color: C.muted }}
                    >
                      {o.plaats} · {o.tarief}
                    </span>
                  </span>
                  <ChevronRight size={16} strokeWidth={2.2} color={C.faint} aria-hidden="true" />
                </button>
              </li>
            ))}
          </ul>
        </Panel>

        <div className="space-y-5">
          {/* Live feed met loading + error-state */}
          <Panel className="p-4">
            <h3
              className="flex items-center gap-2 text-[13px] font-semibold"
              style={{ color: C.fg }}
            >
              <Activity size={14} strokeWidth={2.2} color={C.cyan} aria-hidden="true" /> Activiteit
            </h3>
            {feed === "loading" && (
              <div className="mt-3 space-y-2" role="status" aria-live="polite">
                <span className="sr-only">Activiteit wordt geladen…</span>
                {[0, 1].map((i) => (
                  <span
                    key={i}
                    className="block h-3 animate-pulse rounded-full"
                    style={{ background: "rgba(255,255,255,0.08)", width: i === 0 ? "80%" : "60%" }}
                  />
                ))}
              </div>
            )}
            {feed === "error" && (
              <div
                className="mt-3 flex flex-col gap-2 rounded-xl p-3 sm:flex-row sm:items-center"
                style={{ background: "rgba(255,91,106,0.08)", border: `1px solid ${C.red}55` }}
                role="alert"
              >
                <XCircle size={16} strokeWidth={2.2} color={C.red} aria-hidden="true" />
                <p className="flex-1 text-[12px]" style={{ color: C.fg }}>
                  Kon de activiteit niet ophalen.
                </p>
                <button
                  type="button"
                  onClick={() => setFeed("ok")}
                  style={ringStyle}
                  className={`inline-flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1.5 text-[11.5px] font-semibold ${RING}`}
                >
                  <span
                    style={{ color: C.bg, background: C.cyan }}
                    className="-mx-3 -my-1.5 inline-flex items-center gap-1.5 rounded-full px-3 py-1.5"
                  >
                    <RotateCw size={12} strokeWidth={2.6} aria-hidden="true" /> Opnieuw
                  </span>
                </button>
              </div>
            )}
            {feed === "ok" && (
              <p className="mt-3 flex items-center gap-2 text-[12px]" style={{ color: C.muted }}>
                <Check size={14} strokeWidth={2.6} color={C.lime} aria-hidden="true" /> Bijgewerkt —
                alle ringen synchroon.
              </p>
            )}
          </Panel>

          {/* Berichten */}
          <Panel className="p-4">
            <h3
              className="flex items-center gap-2 text-[13px] font-semibold"
              style={{ color: C.fg }}
            >
              <TrendingUp size={14} strokeWidth={2.2} color={C.magenta} aria-hidden="true" />{" "}
              Berichten
            </h3>
            <ul className="mt-3 space-y-2.5">
              {BERICHTEN.slice(0, 2).map((b) => (
                <li key={b.van} className="flex items-center gap-3">
                  <span
                    className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-[10px] font-semibold"
                    style={{
                      ...meta,
                      color: C.cyan,
                      background: "rgba(52,230,255,0.1)",
                      border: `1px solid ${C.line}`,
                    }}
                    aria-hidden="true"
                  >
                    {b.initialen}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="flex items-center gap-1.5">
                      <span className="truncate text-[12px] font-semibold" style={{ color: C.fg }}>
                        {b.van}
                      </span>
                      {b.ongelezen && (
                        <span
                          className="h-1.5 w-1.5 shrink-0 rounded-full"
                          style={{ background: C.magenta, boxShadow: `0 0 6px ${C.magenta}` }}
                          aria-label="ongelezen"
                        />
                      )}
                    </span>
                    <span className="block truncate text-[11px]" style={{ color: C.muted }}>
                      {b.preview}
                    </span>
                  </span>
                  <span
                    className="shrink-0 text-[10px] tabular-nums"
                    style={{ ...meta, color: C.faint }}
                  >
                    {b.tijd}
                  </span>
                </li>
              ))}
            </ul>
          </Panel>
        </div>
      </div>
    </div>
  );
}

/* ---------- Marktplaats ---------- */

function Marktplaats({
  activeId,
  onSelect,
  onOpen,
}: {
  activeId: string;
  onSelect: (id: string) => void;
  onOpen: (id?: string) => void;
}) {
  const [q, setQ] = useState("");
  const filtered = OPDRACHTEN.filter(
    (o) =>
      o.titel.toLowerCase().includes(q.toLowerCase()) ||
      o.plaats.toLowerCase().includes(q.toLowerCase()) ||
      o.opdrachtgever.toLowerCase().includes(q.toLowerCase()),
  );
  const sel = filtered.find((o) => o.id === activeId) ?? filtered[0];

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div>
        <Kicker>Bereik</Kicker>
        <Title>Open opdrachten</Title>
      </div>

      <div
        className="flex items-center gap-3 rounded-xl px-4 py-3"
        style={{ background: C.panelSolid, border: `1px solid ${C.line}`, boxShadow: SHADOW }}
      >
        <Search size={16} strokeWidth={2.2} color={C.cyan} aria-hidden="true" />
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Zoek op titel, plaats of opdrachtgever…"
          aria-label="Opdrachten zoeken"
          className="w-full bg-transparent text-[13px] outline-none placeholder:text-[#565e72]"
          style={{ ...meta, color: C.fg }}
        />
        <span
          className="shrink-0 text-[11px] font-semibold tabular-nums"
          style={{ ...meta, color: C.faint }}
        >
          {filtered.length}/{OPDRACHTEN.length}
        </span>
      </div>

      {filtered.length === 0 ? (
        <Panel className="p-12 text-center">
          <span className="mx-auto flex h-16 w-16 items-center justify-center" aria-hidden="true">
            <svg width={64} height={64} viewBox="0 0 64 64" className="-rotate-90">
              <ArcRing size={64} stroke={6} value={0} color={C.cyan} />
            </svg>
          </span>
          <p className="mt-4 text-[18px] font-semibold" style={{ color: C.fg }}>
            Geen match gevonden
          </p>
          <p className="mx-auto mt-2 max-w-xs text-[12px]" style={{ color: C.muted }}>
            Geen opdracht past bij &quot;{q}&quot;. Verruim je zoekopdracht.
          </p>
          <button
            type="button"
            onClick={() => setQ("")}
            style={ringStyle}
            className={`mt-5 rounded-full px-4 py-2 text-[12.5px] font-semibold ${RING}`}
          >
            <span
              style={{ color: C.bg, background: C.cyan }}
              className="-mx-4 -my-2 inline-block rounded-full px-4 py-2"
            >
              Zoekopdracht wissen
            </span>
          </button>
        </Panel>
      ) : (
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-[1.3fr_1fr]">
          <div className="space-y-3.5">
            {filtered.map((o) => {
              const on = sel?.id === o.id;
              const color = o.match >= 90 ? C.lime : C.cyan;
              return (
                <button
                  key={o.id}
                  type="button"
                  onClick={() => onSelect(o.id)}
                  aria-pressed={on}
                  style={{
                    ...ringStyle,
                    background: C.panel,
                    border: `1px solid ${on ? `${color}88` : C.line}`,
                    boxShadow: on ? `0 0 30px -8px ${color}` : SHADOW,
                  }}
                  className={`w-full rounded-2xl p-4 text-left transition-all hover:-translate-y-0.5 ${RING}`}
                >
                  <div className="flex items-start gap-3.5">
                    <StatRing value={o.match} color={color} label="match" size={64} />
                    <div className="min-w-0 flex-1">
                      <div
                        className="flex items-center gap-2 text-[10px] font-semibold"
                        style={{ ...meta, color: C.faint }}
                      >
                        <span className="uppercase tracking-[0.12em]">{o.id}</span>
                        {on && <span style={{ color }}>· geselecteerd</span>}
                      </div>
                      <p className="truncate text-[15px] font-semibold" style={{ color: C.fg }}>
                        {o.titel}
                      </p>
                      <p
                        className="mt-0.5 flex items-center gap-1 truncate text-[11.5px]"
                        style={{ color: C.muted }}
                      >
                        <MapPin size={12} strokeWidth={2.2} aria-hidden="true" /> {o.opdrachtgever}{" "}
                        · {o.plaats} · {o.tarief}
                      </p>
                      <div className="mt-2.5 flex flex-wrap gap-1.5">
                        {o.redenen.plus.slice(0, 2).map((t) => (
                          <span
                            key={t}
                            className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10.5px] font-medium"
                            style={{
                              color,
                              background: `${color}14`,
                              border: `1px solid ${color}44`,
                            }}
                          >
                            <Check size={10} strokeWidth={3} aria-hidden="true" /> {t}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>

          {sel && (
            <aside className="h-fit lg:sticky lg:top-4">
              <Panel>
                <div
                  className="flex items-center justify-between p-4"
                  style={{ borderBottom: `1px solid ${C.lineSoft}` }}
                >
                  <span
                    className="text-[11px] font-semibold uppercase tracking-[0.14em]"
                    style={{ ...meta, color: C.cyan }}
                  >
                    {sel.id}
                  </span>
                  <StatRing value={sel.match} color={sel.match >= 90 ? C.lime : C.cyan} size={46} />
                </div>
                <div className="p-4">
                  <p className="text-[16px] font-semibold leading-snug" style={{ color: C.fg }}>
                    {sel.titel}
                  </p>
                  <p className="mt-1 text-[12px]" style={{ ...meta, color: C.muted }}>
                    {sel.opdrachtgever} · {sel.plaats}
                  </p>
                  <dl className="mt-4 grid grid-cols-2 gap-2.5 text-[12.5px]">
                    {[
                      { l: "Tarief", v: sel.tarief },
                      { l: "Omvang", v: sel.uren },
                      { l: "Start", v: sel.start },
                      { l: "Match", v: `${sel.match}%` },
                    ].map((m) => (
                      <div
                        key={m.l}
                        className="rounded-xl p-2.5"
                        style={{ background: "rgba(0,0,0,0.3)" }}
                      >
                        <dt
                          className="text-[10px] font-semibold uppercase tracking-[0.08em]"
                          style={{ ...meta, color: C.faint }}
                        >
                          {m.l}
                        </dt>
                        <dd
                          className="mt-0.5 font-semibold tabular-nums"
                          style={{ ...meta, color: C.fg }}
                        >
                          {m.v}
                        </dd>
                      </div>
                    ))}
                  </dl>
                  <button
                    type="button"
                    onClick={() => onOpen(sel.id)}
                    style={ringStyle}
                    className={`mt-4 w-full rounded-full px-4 py-2.5 text-[12.5px] font-semibold transition-transform hover:-translate-y-0.5 ${RING}`}
                  >
                    <span
                      style={{ color: C.bg, background: C.cyan }}
                      className="-mx-4 -my-2.5 flex items-center justify-center gap-1.5 rounded-full px-4 py-2.5"
                    >
                      Open opdracht <ArrowRight size={13} strokeWidth={2.6} aria-hidden="true" />
                    </span>
                  </button>
                </div>
              </Panel>
            </aside>
          )}
        </div>
      )}
    </div>
  );
}

/* ---------- Opdracht-detail ---------- */

function OpdrachtDetail({ opdracht }: { opdracht: Opdracht }) {
  const [state, setState] = useState<"idle" | "sending" | "sent">("idle");
  const react = () => {
    if (state !== "idle") return;
    setState("sending");
    window.setTimeout(() => setState("sent"), 850);
  };
  const color = opdracht.match >= 90 ? C.lime : C.cyan;

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <Panel>
        <div className="flex flex-col gap-4 p-5 sm:flex-row sm:items-start sm:justify-between sm:p-6">
          <div>
            <Kicker>{opdracht.id}</Kicker>
            <Title>{opdracht.titel}</Title>
            <p className="mt-2 text-[12.5px]" style={{ ...meta, color: C.muted }}>
              {opdracht.opdrachtgever} · {opdracht.plaats}
            </p>
            <div className="mt-3 flex flex-wrap gap-1.5">
              {opdracht.tags.map((t) => (
                <span
                  key={t}
                  className="rounded-full px-2.5 py-0.5 text-[11px] font-medium"
                  style={{
                    ...meta,
                    color: C.muted,
                    background: "rgba(0,0,0,0.3)",
                    border: `1px solid ${C.lineSoft}`,
                  }}
                >
                  {t}
                </span>
              ))}
            </div>
          </div>
          <div className="relative flex shrink-0 items-center justify-center">
            <StatRing value={opdracht.match} color={color} label="match" size={92} />
          </div>
        </div>
        <div className="p-5 pt-0 sm:p-6 sm:pt-0">
          <button
            type="button"
            onClick={react}
            disabled={state !== "idle"}
            aria-live="polite"
            style={ringStyle}
            className={`flex w-full items-center justify-center gap-2 rounded-full px-5 py-3 text-[13px] font-semibold transition-colors disabled:opacity-90 ${RING}`}
          >
            <span
              style={{ color: C.bg, background: state === "sent" ? C.lime : C.cyan }}
              className="-mx-5 -my-3 flex w-[calc(100%+2.5rem)] items-center justify-center gap-2 rounded-full px-5 py-3"
            >
              {state === "idle" && (
                <>
                  <ArrowRight size={15} strokeWidth={2.6} aria-hidden="true" /> Reageer op opdracht
                </>
              )}
              {state === "sending" && "Versturen…"}
              {state === "sent" && (
                <>
                  <Check size={15} strokeWidth={3} aria-hidden="true" /> Reactie verstuurd
                </>
              )}
            </span>
          </button>
        </div>
      </Panel>

      <div className="grid grid-cols-2 gap-3.5 sm:grid-cols-4">
        {[
          { l: "Tarief", v: opdracht.tarief },
          { l: "Omvang", v: opdracht.uren },
          { l: "Start", v: opdracht.start },
          { l: "Match", v: `${opdracht.match}%` },
        ].map((m) => (
          <Panel key={m.l} className="p-4">
            <p
              className="text-[10px] font-semibold uppercase tracking-[0.08em]"
              style={{ ...meta, color: C.faint }}
            >
              {m.l}
            </p>
            <p className="mt-1.5 text-[18px] tabular-nums" style={{ ...display, color: C.fg }}>
              {m.v}
            </p>
          </Panel>
        ))}
      </div>

      <Panel>
        <div
          className="flex items-center gap-2 p-4"
          style={{ borderBottom: `1px solid ${C.lineSoft}` }}
        >
          <Target size={16} strokeWidth={2} color={C.cyan} aria-hidden="true" />
          <h3 className="text-[16px] font-semibold" style={{ color: C.fg }}>
            Waarom deze match
          </h3>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2">
          <div className="p-5" style={{ borderBottom: `1px solid ${C.lineSoft}` }}>
            <p
              className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.1em]"
              style={{ ...meta, color: C.lime }}
            >
              <Check size={13} strokeWidth={3} aria-hidden="true" /> Pluspunten
            </p>
            <ul className="mt-3 space-y-2.5">
              {opdracht.redenen.plus.map((r) => (
                <li
                  key={r}
                  className="flex items-start gap-2.5 text-[13px]"
                  style={{ color: C.fg }}
                >
                  <Check
                    size={15}
                    strokeWidth={2.6}
                    color={C.lime}
                    className="mt-0.5 shrink-0"
                    aria-hidden="true"
                  />
                  {r}
                </li>
              ))}
            </ul>
          </div>
          <div className="p-5" style={{ borderTop: `1px solid ${C.lineSoft}` }}>
            <p
              className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.1em]"
              style={{ ...meta, color: C.amber }}
            >
              <AlertTriangle size={13} strokeWidth={2.6} aria-hidden="true" /> Aandachtspunten
            </p>
            <ul className="mt-3 space-y-2.5">
              {opdracht.redenen.min.map((r) => (
                <li
                  key={r}
                  className="flex items-start gap-2.5 text-[13px]"
                  style={{ color: C.muted }}
                >
                  <AlertTriangle
                    size={15}
                    strokeWidth={2.4}
                    color={C.amber}
                    className="mt-0.5 shrink-0"
                    aria-hidden="true"
                  />
                  {r}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </Panel>
    </div>
  );
}

/* ---------- Verificatie ---------- */

function Verificatie() {
  const verified = CREDENTIALS.filter((c) => c.status === "VERIFIED").length;
  const total = CREDENTIALS.length;

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div>
        <Kicker color={C.lime}>Verificatie</Kicker>
        <Title>Certificaten</Title>
        <p className="mt-2 text-[13px]" style={{ color: C.muted }}>
          Je bewijsstukken worden veilig en privé bewaard.
        </p>
      </div>

      {/* Compleetheid-ring */}
      <Panel className="flex flex-col items-center gap-5 p-5 sm:flex-row sm:gap-7 sm:p-6">
        <div className="relative flex shrink-0 items-center justify-center">
          <svg
            width={132}
            height={132}
            viewBox="0 0 132 132"
            className="-rotate-90"
            role="img"
            aria-label={`Verificatie-compleetheid ${VERIF_PCT} procent`}
          >
            <ArcRing size={132} stroke={12} value={VERIF_PCT} color={C.lime} />
          </svg>
          <div className="absolute flex flex-col items-center">
            <span
              className="text-[26px] font-semibold tabular-nums leading-none"
              style={{ ...display, color: C.fg }}
            >
              {VERIF_PCT}%
            </span>
            <span
              className="mt-1 text-[9px] uppercase tracking-[0.16em]"
              style={{ ...meta, color: C.faint }}
            >
              compleet
            </span>
          </div>
        </div>
        <div className="grid w-full flex-1 grid-cols-1 gap-3 sm:grid-cols-3">
          {[
            { l: "Gesloten", v: `${verified}/${total}`, color: C.lime, Icon: ShieldCheck },
            { l: "Verloopt", v: "1", color: C.amber, Icon: AlertTriangle },
            { l: "In beoordeling", v: "1", color: C.cyan, Icon: Clock },
          ].map((s) => {
            const Icon = s.Icon;
            return (
              <div
                key={s.l}
                className="flex items-center justify-between rounded-xl p-3"
                style={{ background: "rgba(0,0,0,0.3)", border: `1px solid ${C.lineSoft}` }}
              >
                <div>
                  <p
                    className="text-[10px] font-semibold uppercase tracking-[0.08em]"
                    style={{ ...meta, color: C.faint }}
                  >
                    {s.l}
                  </p>
                  <p className="mt-1 text-[20px] tabular-nums" style={{ ...display, color: C.fg }}>
                    {s.v}
                  </p>
                </div>
                <span
                  className="flex h-9 w-9 items-center justify-center rounded-full"
                  style={{ background: `${s.color}1c`, border: `1px solid ${s.color}55` }}
                >
                  <Icon size={17} strokeWidth={2} color={s.color} aria-hidden="true" />
                </span>
              </div>
            );
          })}
        </div>
      </Panel>

      <Panel>
        {CREDENTIALS.map((c, i) => {
          const m = credMeta(c.status);
          const Icon = m.Icon;
          const pct =
            c.status === "VERIFIED"
              ? 100
              : c.status === "SUBMITTED"
                ? 55
                : c.status === "EXPIRING"
                  ? 80
                  : 20;
          return (
            <div
              key={c.naam}
              className="flex flex-col gap-2 p-4 sm:flex-row sm:items-center sm:gap-4"
              style={{ borderTop: i === 0 ? "none" : `1px solid ${C.lineSoft}` }}
            >
              <span
                className="relative flex h-12 w-12 shrink-0 items-center justify-center"
                aria-hidden="true"
              >
                <svg width={48} height={48} viewBox="0 0 48 48" className="-rotate-90">
                  <ArcRing size={48} stroke={4} value={pct} color={m.color} />
                </svg>
                <Icon size={17} strokeWidth={2} color={m.color} className="absolute" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-[14px] font-semibold" style={{ color: C.fg }}>
                  {c.naam}
                </p>
                <p className="text-[11.5px]" style={{ ...meta, color: C.muted }}>
                  {c.detail}
                </p>
              </div>
              <StatusBadge status={c.status} />
            </div>
          );
        })}
      </Panel>
    </div>
  );
}

/* ---------- Acties ---------- */

function Acties({ onGo }: { onGo: (k: ScreenKey) => void }) {
  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <Kicker color={C.magenta}>Prioriteiten</Kicker>
        <Title>Volgende acties</Title>
        <p className="mt-2 text-[13px]" style={{ color: C.muted }}>
          Op volgorde van urgentie — begin bovenaan.
        </p>
      </div>

      <div className="space-y-3.5">
        {ACTIES.map((a, i) => {
          const warn = a.urgentie === "warning";
          const color = warn ? C.amber : C.cyan;
          return (
            <Panel key={a.titel} className="flex items-stretch overflow-hidden">
              <div
                className="flex w-16 shrink-0 flex-col items-center justify-center gap-1.5"
                style={{ background: `${color}14`, borderRight: `1px solid ${color}44` }}
              >
                <span
                  className="relative flex h-9 w-9 items-center justify-center"
                  aria-hidden="true"
                >
                  <svg width={36} height={36} viewBox="0 0 36 36" className="-rotate-90">
                    <ArcRing size={36} stroke={3.5} value={warn ? 90 : 45} color={color} />
                  </svg>
                  <span className="absolute text-[12px] tabular-nums" style={{ ...meta, color }}>
                    {String(i + 1).padStart(2, "0")}
                  </span>
                </span>
              </div>
              <div className="min-w-0 flex-1 p-4">
                <span
                  className="text-[10.5px] font-semibold uppercase tracking-[0.1em]"
                  style={{ ...meta, color }}
                >
                  {warn ? "Waarschuwing" : "Melding"}
                </span>
                <p className="mt-1 text-[14.5px] font-semibold" style={{ color: C.fg }}>
                  {a.titel}
                </p>
                <p className="mt-0.5 text-[12.5px]" style={{ color: C.muted }}>
                  {a.detail}
                </p>
              </div>
              <button
                type="button"
                onClick={() => onGo(warn ? "verificatie" : "marktplaats")}
                style={ringStyle}
                className={`m-3 shrink-0 self-center rounded-full px-4 py-2 text-[12px] font-semibold ${RING}`}
              >
                <span
                  style={{
                    color: warn ? C.bg : C.fg,
                    background: warn ? C.amber : "rgba(0,0,0,0.32)",
                    border: warn ? "none" : `1px solid ${C.line}`,
                  }}
                  className="-mx-4 -my-2 inline-block rounded-full px-4 py-2"
                >
                  {a.cta}
                </span>
              </button>
            </Panel>
          );
        })}
      </div>

      <div
        className="flex items-center gap-3 rounded-2xl p-4"
        style={{ background: "rgba(182,255,58,0.07)", border: `1px solid ${C.line}` }}
      >
        <Check size={18} strokeWidth={2.4} color={C.lime} aria-hidden="true" />
        <p className="text-[12.5px]" style={{ color: C.muted }}>
          Verder is alles bijgewerkt. Nieuwe acties verschijnen hier vanzelf.
        </p>
      </div>
    </div>
  );
}

/* ---------- Facturen ---------- */

function Facturen() {
  const statusColor: Record<string, string> = {
    Betaald: C.lime,
    Openstaand: C.amber,
    Concept: C.faint,
  };
  const betaald = FACTUREN.filter((f) => f.status === "Betaald").reduce(
    (s, f) => s + digits(f.bedrag),
    0,
  );
  const open = FACTUREN.filter((f) => f.status === "Openstaand").reduce(
    (s, f) => s + digits(f.bedrag),
    0,
  );

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <Kicker color={C.magenta}>Financiën</Kicker>
          <Title>Facturen</Title>
        </div>
        <button
          type="button"
          style={ringStyle}
          className={`inline-flex shrink-0 items-center gap-2 rounded-full px-4 py-2.5 text-[12.5px] font-semibold transition-transform hover:-translate-y-0.5 ${RING}`}
        >
          <span
            style={{ color: C.bg, background: C.magenta }}
            className="-mx-4 -my-2.5 inline-flex items-center gap-2 rounded-full px-4 py-2.5"
          >
            <Plus size={14} strokeWidth={2.6} aria-hidden="true" /> Nieuwe factuur
          </span>
        </button>
      </div>

      {/* Omzet-doel ring */}
      <Panel className="flex items-center gap-5 p-5">
        <div className="relative flex shrink-0 items-center justify-center">
          <svg
            width={104}
            height={104}
            viewBox="0 0 104 104"
            className="-rotate-90"
            role="img"
            aria-label={`Omzetdoel ${OMZET_PCT} procent behaald`}
          >
            <ArcRing size={104} stroke={11} value={OMZET_PCT} color={C.magenta} />
          </svg>
          <span
            className="absolute text-[19px] font-semibold tabular-nums"
            style={{ ...display, color: C.fg }}
          >
            {OMZET_PCT}%
          </span>
        </div>
        <div className="min-w-0 flex-1">
          <p
            className="text-[10.5px] font-semibold uppercase tracking-[0.1em]"
            style={{ ...meta, color: C.faint }}
          >
            Maanddoel
          </p>
          <p className="mt-1 text-[15px] font-semibold" style={{ color: C.fg }}>
            € {betaald.toLocaleString("nl-NL")}{" "}
            <span style={{ color: C.muted }}>van € {OMZET_DOEL.toLocaleString("nl-NL")}</span>
          </p>
          <div className="mt-3 grid grid-cols-2 gap-3">
            <div className="rounded-xl p-2.5" style={{ background: "rgba(0,0,0,0.3)" }}>
              <p
                className="text-[10px] font-semibold uppercase tracking-[0.08em]"
                style={{ ...meta, color: C.faint }}
              >
                Ontvangen
              </p>
              <p className="mt-1 text-[18px] tabular-nums" style={{ ...display, color: C.lime }}>
                € {betaald.toLocaleString("nl-NL")}
              </p>
            </div>
            <div className="rounded-xl p-2.5" style={{ background: "rgba(0,0,0,0.3)" }}>
              <p
                className="text-[10px] font-semibold uppercase tracking-[0.08em]"
                style={{ ...meta, color: C.faint }}
              >
                Openstaand
              </p>
              <p className="mt-1 text-[18px] tabular-nums" style={{ ...display, color: C.amber }}>
                € {open.toLocaleString("nl-NL")}
              </p>
            </div>
          </div>
        </div>
      </Panel>

      <Panel className="overflow-x-auto">
        <table className="w-full text-left">
          <thead>
            <tr
              className="text-[10.5px] font-semibold uppercase tracking-[0.08em]"
              style={{ ...meta, color: C.faint, borderBottom: `1px solid ${C.lineSoft}` }}
            >
              <th className="p-4">Nummer</th>
              <th className="p-4">Klant</th>
              <th className="hidden p-4 sm:table-cell">Datum</th>
              <th className="p-4 text-right">Bedrag</th>
              <th className="p-4 text-right">Status</th>
            </tr>
          </thead>
          <tbody>
            {FACTUREN.map((f, i) => {
              const color = statusColor[f.status] ?? C.faint;
              return (
                <tr key={f.nr} style={{ borderTop: i === 0 ? "none" : `1px solid ${C.lineSoft}` }}>
                  <td
                    className="p-4 text-[12px] font-semibold tabular-nums"
                    style={{ ...meta, color: C.fg }}
                  >
                    {f.nr}
                  </td>
                  <td className="p-4 text-[13px] font-medium" style={{ color: C.fg }}>
                    {f.klant}
                  </td>
                  <td
                    className="hidden p-4 text-[12px] tabular-nums sm:table-cell"
                    style={{ ...meta, color: C.muted }}
                  >
                    {f.datum}
                  </td>
                  <td
                    className="p-4 text-right text-[13px] tabular-nums"
                    style={{ ...meta, color: C.fg }}
                  >
                    {f.bedrag}
                  </td>
                  <td className="p-4">
                    <div className="flex items-center justify-end gap-1.5">
                      <span
                        className="h-2 w-2 rounded-full"
                        style={{ background: color, boxShadow: `0 0 6px ${color}` }}
                        aria-hidden="true"
                      />
                      <span className="text-[11.5px] font-semibold" style={{ ...meta, color }}>
                        {f.status}
                      </span>
                    </div>
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
