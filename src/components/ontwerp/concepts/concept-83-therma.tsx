"use client";

// Concept 83 — "Therma" · thermografie / infrarood-instrumentatie (donker).
// Data als warmte: een vaste infrarood-colormap (diep indigo → paars → magenta → oranje → amber)
// codeert match%, urgentie en omzet als gloed. Nachtzicht-esthetiek, bijna-zwarte achtergrond,
// warme off-white tekst. Rijen, badges en sparklines "gloeien" naar hun hitte. Geen neon-cliché —
// echte instrument-uitlezing met vaste stops en deterministische index-formules (geen random).
// Palet: bg #0a0912, fg #f3e9dd, accent #ff7a1a, magenta #ff2d95, indigo #1a1140.
// Fonts: --font-lab-space (display) + --font-lab-plex-mono (uitlezing/cijfers).

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
  Flame,
  Thermometer,
  Activity,
  RotateCw,
  Gauge,
  Radio,
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
  NAV,
  type ScreenKey,
  type CredStatus,
  type Opdracht,
} from "./mock";

/* ---------- Palet & typografie ---------- */

const C = {
  bg: "#0a0912",
  bgAlt: "#120d1f",
  panel: "rgba(20,14,34,0.72)",
  panelSolid: "#140e22",
  fg: "#f3e9dd",
  muted: "#a394ac",
  faint: "#6f6182",
  accent: "#ff7a1a",
  magenta: "#ff2d95",
  indigo: "#1a1140",
  warn: "#ffb43c",
  alert: "#ff4d5e",
  line: "rgba(255,122,26,0.14)",
  lineSoft: "rgba(163,148,172,0.12)",
  grid: "rgba(255,122,26,0.08)",
};

const disp = { fontFamily: "var(--font-lab-space)" };
const mono = { fontFamily: "var(--font-lab-plex-mono)" };

const GLOW = "inset 0 0 0 1px rgba(255,122,26,0.08), 0 18px 48px -30px rgba(0,0,0,0.9)";

/* ---------- Infrarood-colormap (vaste stops, deterministisch) ---------- */

const HEAT_STOPS: [number, [number, number, number]][] = [
  [0.0, [26, 17, 64]], // #1a1140 diep indigo (koud)
  [0.18, [58, 21, 96]], // #3a1560 paars
  [0.38, [122, 26, 125]], // #7a1a7d magenta-paars
  [0.55, [255, 45, 149]], // #ff2d95 magenta
  [0.72, [255, 85, 51]], // #ff5533 oranje-rood
  [0.88, [255, 122, 26]], // #ff7a1a amber (heet)
  [1.0, [255, 180, 60]], // #ffb43c gloeiend amber
];

// Waarde 0..1 → kleur uit de colormap via lineaire interpolatie tussen vaste stops.
function heat(v: number): string {
  const t = v < 0 ? 0 : v > 1 ? 1 : v;
  for (let i = 1; i < HEAT_STOPS.length; i++) {
    const hi = HEAT_STOPS[i]!;
    const lo = HEAT_STOPS[i - 1]!;
    if (t <= hi[0]) {
      const f = (t - lo[0]) / (hi[0] - lo[0] || 1);
      const r = Math.round(lo[1][0] + (hi[1][0] - lo[1][0]) * f);
      const g = Math.round(lo[1][1] + (hi[1][1] - lo[1][1]) * f);
      const b = Math.round(lo[1][2] + (hi[1][2] - lo[1][2]) * f);
      return `rgb(${r}, ${g}, ${b})`;
    }
  }
  return "rgb(255, 180, 60)";
}

// Match% (0..100) → hitte 0..1, ingekaderd zodat zelfs 80% al warm oplicht.
function matchHeat(pct: number): number {
  return 0.35 + (Math.max(0, Math.min(100, pct)) / 100) * 0.65;
}

function digits(v: string): number {
  const only = v.replace(/[^\d]/g, "");
  return only ? parseInt(only, 10) : 0;
}

/* ---------- Status → betekenis (label + icoon + hitte, nooit kleur-alleen) ---------- */

type CredMeta = { label: string; color: string; Icon: typeof ShieldCheck; heat: number };

function credMeta(s: CredStatus): CredMeta {
  switch (s) {
    case "VERIFIED":
      return { label: "Geverifieerd", color: C.accent, Icon: ShieldCheck, heat: 0.92 };
    case "SUBMITTED":
      return { label: "In beoordeling", color: C.magenta, Icon: Clock, heat: 0.58 };
    case "EXPIRING":
      return { label: "Verloopt binnenkort", color: C.warn, Icon: AlertTriangle, heat: 0.74 };
    case "REJECTED":
      return { label: "Afgewezen", color: C.alert, Icon: XCircle, heat: 0.14 };
  }
}

/* ---------- Kleine bouwstenen ---------- */

function Kicker({ children }: { children: React.ReactNode }) {
  return (
    <span
      className="inline-flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.3em]"
      style={{ ...mono, color: C.accent }}
    >
      <Thermometer size={12} strokeWidth={2.4} aria-hidden="true" />
      {children}
    </span>
  );
}

function Title({ children }: { children: React.ReactNode }) {
  return (
    <h1
      className="mt-2.5 text-[26px] font-semibold leading-[1.05] tracking-[-0.02em] sm:text-[33px]"
      style={{ ...disp, color: C.fg }}
    >
      {children}
    </h1>
  );
}

function Panel({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <div
      className={`rounded-2xl backdrop-blur-sm ${className}`}
      style={{ background: C.panel, border: `1px solid ${C.line}`, boxShadow: GLOW }}
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
        ...mono,
        color: m.color,
        background: "rgba(0,0,0,0.4)",
        border: `1px solid ${m.color}55`,
        boxShadow: `0 0 14px -4px ${m.color}`,
      }}
    >
      <Icon size={13} strokeWidth={2.4} aria-hidden="true" />
      {m.label}
    </span>
  );
}

// Thermische cel: gevuld met heat(v), gloeiend. Toont hitte als vierkant.
function HeatCell({ v, size = 14 }: { v: number; size?: number }) {
  const col = heat(v);
  return (
    <span
      className="inline-block shrink-0 rounded-[3px]"
      style={{
        width: size,
        height: size,
        background: col,
        boxShadow: `0 0 ${Math.round(4 + v * 10)}px -2px ${col}`,
      }}
      aria-hidden="true"
    />
  );
}

// Thermische sparkline: lijn met verlopende hitte-vulling eronder.
function Spark({ data, gradId }: { data: number[]; gradId: string }) {
  const w = 100;
  const h = 32;
  const min = Math.min(...data);
  const max = Math.max(...data);
  const span = max - min || 1;
  const pts = data.map((v, i) => {
    const x = (i / (data.length - 1)) * w;
    const y = h - ((v - min) / span) * (h - 5) - 2.5;
    return [x, y] as const;
  });
  const line = pts
    .map((p, i) => `${i === 0 ? "M" : "L"}${p[0].toFixed(1)} ${p[1].toFixed(1)}`)
    .join(" ");
  const area = `${line} L${w} ${h} L0 ${h} Z`;
  const last = pts[pts.length - 1]!;
  const lastHeat = (data[data.length - 1]! - min) / span;
  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} aria-hidden="true">
      <defs>
        <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={C.accent} stopOpacity="0.4" />
          <stop offset="100%" stopColor={C.magenta} stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={area} fill={`url(#${gradId})`} />
      <path
        d={line}
        fill="none"
        stroke={C.accent}
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
        style={{ filter: `drop-shadow(0 0 3px ${C.accent}aa)` }}
      />
      <circle cx={last[0]} cy={last[1]} r="2.3" fill={heat(matchHeat(lastHeat * 100))} />
    </svg>
  );
}

// Thermische score-uitlezing: ring gloeit met de hitte van de waarde.
function HeatScore({ value, size = 50 }: { value: number; size?: number }) {
  const r = size / 2 - 3;
  const circ = 2 * Math.PI * r;
  const col = heat(matchHeat(value));
  return (
    <span
      className="relative flex shrink-0 items-center justify-center"
      style={{ width: size, height: size }}
      aria-hidden="true"
    >
      <svg width={size} height={size} className="absolute inset-0 -rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={C.grid} strokeWidth="2.5" />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={col}
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeDasharray={circ}
          strokeDashoffset={circ * (1 - value / 100)}
          style={{ filter: `drop-shadow(0 0 5px ${col})` }}
        />
      </svg>
      <span
        className="text-[13px] font-semibold tabular-nums"
        style={{ ...mono, color: value >= 88 ? C.fg : C.muted }}
      >
        {value}
      </span>
    </span>
  );
}

// Signatuur: thermische camera-band — een raster cellen met deterministische hitte.
function ThermalBand({ seed = 0 }: { seed?: number }) {
  const cols = 24;
  const rows = 4;
  return (
    <div
      className="grid gap-[3px] overflow-hidden rounded-xl p-2.5"
      style={{
        gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))`,
        background: "rgba(0,0,0,0.35)",
        border: `1px solid ${C.line}`,
      }}
      aria-hidden="true"
    >
      {Array.from({ length: cols * rows }).map((_, k) => {
        const cx = k % cols;
        const cy = Math.floor(k / cols);
        // Deterministische "warmtebron": vaste focus met afstandsafname.
        const fx = 6 + ((seed * 5) % 12);
        const fy = 1.5;
        const d = Math.sqrt((cx - fx) ** 2 + ((cy - fy) * 2.6) ** 2);
        const wave = (Math.sin((cx + seed) * 0.7) + Math.cos(cy * 1.3)) * 0.08;
        const v = Math.max(0, Math.min(1, 1 - d / 15 + wave));
        return (
          <span
            key={k}
            className="aspect-square rounded-[2px]"
            style={{ background: heat(v), opacity: 0.5 + v * 0.5 }}
          />
        );
      })}
    </div>
  );
}

/* ---------- Hoofdcomponent ---------- */

export function Concept83() {
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
        ...disp,
        color: C.fg,
        background: `radial-gradient(130% 100% at 78% -10%, ${C.bgAlt}, ${C.bg} 62%)`,
      }}
    >
      {/* Subtiele thermische ruis-overlay (deterministisch, puur decoratief) */}
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.5]"
        aria-hidden="true"
        style={{
          background:
            "repeating-linear-gradient(0deg, rgba(255,122,26,0) 0px, rgba(255,122,26,0) 3px, rgba(255,122,26,0.03) 4px)",
        }}
      />

      <div className="relative flex min-h-[680px] flex-col md:flex-row">
        {/* Zijbalk */}
        <aside
          className="shrink-0 md:w-[240px]"
          style={{ borderRight: `1px solid ${C.line}`, background: "rgba(0,0,0,0.32)" }}
        >
          <div className="flex h-full flex-col">
            <div
              className="flex items-center gap-3 p-5"
              style={{ borderBottom: `1px solid ${C.lineSoft}` }}
            >
              <span
                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl"
                style={{
                  background: `linear-gradient(140deg, ${C.magenta}, ${C.accent})`,
                  boxShadow: `0 0 18px -4px ${C.accent}`,
                }}
                aria-hidden="true"
              >
                <Flame size={20} strokeWidth={2.2} color="#0a0912" />
              </span>
              <div className="leading-tight">
                <div className="text-[17px] font-semibold tracking-tight" style={{ color: C.fg }}>
                  Therma
                </div>
                <div
                  className="text-[9px] font-semibold uppercase tracking-[0.24em]"
                  style={{ ...mono, color: C.faint }}
                >
                  Infrarood · ZZP
                </div>
              </div>
            </div>

            <nav
              className="flex flex-row gap-1 overflow-x-auto p-2.5 md:flex-1 md:flex-col"
              aria-label="Hoofdnavigatie"
            >
              {SCREENS.map((s, i) => {
                const on = s.key === screen;
                const h = 0.5 + (i / (SCREENS.length - 1)) * 0.45;
                return (
                  <button
                    key={s.key}
                    onClick={() => setScreen(s.key)}
                    aria-current={on ? "page" : undefined}
                    className="relative flex shrink-0 items-center gap-2.5 rounded-xl px-3.5 py-2.5 text-left text-[13px] font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#ff7a1a] md:w-full"
                    style={{
                      color: on ? C.fg : C.muted,
                      background: on ? "rgba(255,122,26,0.1)" : "transparent",
                      border: on ? `1px solid ${C.line}` : "1px solid transparent",
                    }}
                  >
                    <span
                      className="h-2 w-2 shrink-0 rounded-[2px]"
                      style={{
                        background: on ? heat(h) : "rgba(163,148,172,0.28)",
                        boxShadow: on ? `0 0 8px -1px ${heat(h)}` : "none",
                      }}
                      aria-hidden="true"
                    />
                    <span>{s.label}</span>
                  </button>
                );
              })}
            </nav>

            <div
              className="hidden items-center gap-3 p-4 md:flex"
              style={{ borderTop: `1px solid ${C.lineSoft}`, background: "rgba(0,0,0,0.24)" }}
            >
              <span
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-[12px] font-semibold"
                style={{
                  ...mono,
                  color: "#0a0912",
                  background: `linear-gradient(140deg, ${C.warn}, ${C.accent})`,
                }}
                aria-hidden="true"
              >
                {PROFIEL.initialen}
              </span>
              <div className="min-w-0">
                <div className="truncate text-[13px] font-semibold" style={{ color: C.fg }}>
                  {PROFIEL.naam}
                </div>
                <div
                  className="flex items-center gap-1 text-[10px] font-semibold"
                  style={{ color: C.accent }}
                >
                  <ShieldCheck size={11} strokeWidth={2.4} aria-hidden="true" /> {PROFIEL.trust}
                </div>
              </div>
            </div>
          </div>
        </aside>

        <main className="flex min-w-0 flex-1 flex-col">
          <div className="flex-1 overflow-y-auto p-5 sm:p-8">
            {screen === "dashboard" && (
              <Dashboard onOpen={open} onGo={setScreen} onSelect={setActiveId} />
            )}
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
  onSelect,
}: {
  onOpen: (id?: string) => void;
  onGo: (k: ScreenKey) => void;
  onSelect: (id: string) => void;
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
          <Kicker>Warmtebeeld actief</Kicker>
          <Title>Goedemorgen, {PROFIEL.naam.split(" ")[0]}</Title>
          <p className="mt-2 text-[13px]" style={{ color: C.muted }}>
            {PROFIEL.rol} · {PROFIEL.plaats}
          </p>
        </div>
        <div
          className="flex items-center gap-2 rounded-xl px-3.5 py-2 text-[11px] font-semibold"
          style={{
            ...mono,
            color: C.accent,
            background: "rgba(0,0,0,0.32)",
            border: `1px solid ${C.line}`,
          }}
        >
          <Activity size={13} strokeWidth={2.4} aria-hidden="true" /> {OPDRACHTEN.length} warme
          matches
        </div>
      </header>

      {warn && (
        <div
          className="flex flex-col gap-3 rounded-2xl p-4 sm:flex-row sm:items-center"
          style={{
            border: `1px solid ${C.warn}55`,
            background: "rgba(255,180,60,0.08)",
            boxShadow: `0 0 30px -18px ${C.warn}`,
          }}
          role="alert"
        >
          <span
            className="flex h-10 w-10 shrink-0 items-center justify-center self-start rounded-xl"
            style={{ background: "rgba(0,0,0,0.35)", border: `1px solid ${C.warn}55` }}
          >
            <AlertTriangle size={18} strokeWidth={2.2} color={C.warn} aria-hidden="true" />
          </span>
          <p className="text-[13px] leading-snug" style={{ color: C.fg }}>
            <span className="font-semibold">{warn.titel}.</span>{" "}
            <span style={{ color: C.muted }}>{warn.detail}</span>
          </p>
          <button
            onClick={() => onGo("verificatie")}
            className="ml-auto inline-flex shrink-0 items-center gap-1.5 rounded-xl px-3.5 py-2 text-[12px] font-semibold transition-transform hover:scale-[1.02] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#ff7a1a]"
            style={{ color: "#0a0912", background: C.warn }}
          >
            {warn.cta} <ArrowRight size={13} strokeWidth={2.6} aria-hidden="true" />
          </button>
        </div>
      )}

      <div className="grid grid-cols-2 gap-3.5 lg:grid-cols-4">
        {KPIS.map((k, i) => (
          <Panel key={k.label} className="flex flex-col justify-between p-4">
            <div className="flex items-start justify-between gap-2">
              <p
                className="text-[10.5px] font-semibold uppercase leading-tight tracking-[0.08em]"
                style={{ ...mono, color: C.muted }}
              >
                {k.label}
              </p>
              <span
                className="inline-flex items-center gap-0.5 text-[11px] font-semibold tabular-nums"
                style={{ ...mono, color: k.up ? C.accent : C.warn }}
              >
                {k.up ? (
                  <ArrowUpRight size={12} strokeWidth={2.6} aria-hidden="true" />
                ) : (
                  <ArrowDownRight size={12} strokeWidth={2.6} aria-hidden="true" />
                )}
                {k.trend}
              </span>
            </div>
            <p className="mt-3 text-[24px] tabular-nums leading-none" style={{ color: C.fg }}>
              {k.value}
            </p>
            <div className="mt-2">
              <Spark data={k.spark} gradId={`therma-spark-${i}`} />
            </div>
          </Panel>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-[1fr_1.05fr]">
        {/* Signatuur: warmtebeeld */}
        <Panel className="p-5">
          <div className="mb-3 flex items-center justify-between">
            <h3
              className="flex items-center gap-2 text-[14px] font-semibold"
              style={{ color: C.fg }}
            >
              <Thermometer size={16} strokeWidth={2.2} color={C.accent} aria-hidden="true" />{" "}
              Marktwarmte
            </h3>
            <span
              className="text-[10px] font-semibold uppercase tracking-[0.14em]"
              style={{ ...mono, color: C.faint }}
            >
              live infrarood
            </span>
          </div>
          <ThermalBand seed={0} />
          <div className="mt-3 space-y-2.5">
            {OPDRACHTEN.map((o) => (
              <div key={o.id} className="flex items-center gap-3">
                <HeatCell v={matchHeat(o.match)} size={16} />
                <span className="min-w-0 flex-1 truncate text-[12px]" style={{ color: C.muted }}>
                  {o.titel}
                </span>
                <span
                  className="shrink-0 text-[12px] font-semibold tabular-nums"
                  style={{ ...mono, color: heat(matchHeat(o.match)) }}
                >
                  {o.match}%
                </span>
              </div>
            ))}
          </div>
          <div className="mt-4 flex items-center justify-between">
            <span
              className="text-[10px] uppercase tracking-[0.14em]"
              style={{ ...mono, color: C.faint }}
            >
              koud
            </span>
            <div
              className="mx-3 h-2 flex-1 rounded-full"
              style={{
                background: `linear-gradient(90deg, ${heat(0)}, ${heat(0.4)}, ${heat(0.6)}, ${heat(0.85)}, ${heat(1)})`,
              }}
              aria-hidden="true"
            />
            <span
              className="text-[10px] uppercase tracking-[0.14em]"
              style={{ ...mono, color: C.accent }}
            >
              heet
            </span>
          </div>
        </Panel>

        <div className="space-y-5">
          {/* Beste matches */}
          <Panel>
            <div
              className="flex items-center justify-between p-4"
              style={{ borderBottom: `1px solid ${C.lineSoft}` }}
            >
              <h3 className="text-[14px] font-semibold" style={{ color: C.fg }}>
                Warmste matches
              </h3>
              <button
                onClick={() => onGo("marktplaats")}
                className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-[11px] font-semibold transition-colors hover:text-[#ffb43c] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#ff7a1a]"
                style={{ ...mono, color: C.accent }}
              >
                Alles <ArrowRight size={12} strokeWidth={2.6} aria-hidden="true" />
              </button>
            </div>
            <ul className="p-2">
              {OPDRACHTEN.map((o) => (
                <li key={o.id}>
                  <button
                    onClick={() => {
                      onSelect(o.id);
                      onOpen(o.id);
                    }}
                    className="group flex w-full items-center gap-3 rounded-xl p-3 text-left transition-colors hover:bg-[rgba(255,122,26,0.06)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#ff7a1a]"
                  >
                    <HeatScore value={o.match} />
                    <span className="min-w-0 flex-1">
                      <span
                        className="block truncate text-[13.5px] font-semibold"
                        style={{ color: C.fg }}
                      >
                        {o.titel}
                      </span>
                      <span
                        className="block truncate text-[11px]"
                        style={{ ...mono, color: C.muted }}
                      >
                        {o.plaats} · {o.tarief}
                      </span>
                    </span>
                    <ArrowUpRight
                      size={15}
                      strokeWidth={2.2}
                      color={C.faint}
                      className="transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5"
                      aria-hidden="true"
                    />
                  </button>
                </li>
              ))}
            </ul>
          </Panel>

          {/* Live sensor-feed — loading + error-state */}
          <Panel className="p-4">
            <h3
              className="flex items-center gap-2 text-[13px] font-semibold"
              style={{ color: C.fg }}
            >
              <Radio size={14} strokeWidth={2.2} color={C.accent} aria-hidden="true" /> Sensor-feed
            </h3>
            {feed === "loading" && (
              <div className="mt-3 space-y-2" role="status" aria-live="polite">
                <span className="sr-only">Sensor kalibreert…</span>
                {[0, 1].map((i) => (
                  <span
                    key={i}
                    className="block h-3 animate-pulse rounded"
                    style={{ background: "rgba(255,122,26,0.1)", width: i === 0 ? "80%" : "58%" }}
                  />
                ))}
              </div>
            )}
            {feed === "error" && (
              <div
                className="mt-3 flex flex-col gap-2 rounded-xl p-3 sm:flex-row sm:items-center"
                style={{ background: "rgba(255,77,94,0.08)", border: `1px solid ${C.alert}55` }}
                role="alert"
              >
                <XCircle size={16} strokeWidth={2.2} color={C.alert} aria-hidden="true" />
                <p className="flex-1 text-[12px]" style={{ color: C.fg }}>
                  Sensor onbereikbaar — warmtebeeld niet ververst.
                </p>
                <button
                  onClick={() => setFeed("ok")}
                  className="inline-flex shrink-0 items-center gap-1.5 rounded-md px-3 py-1.5 text-[11.5px] font-semibold transition-transform hover:scale-[1.03] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#ff7a1a]"
                  style={{ color: "#0a0912", background: C.accent }}
                >
                  <RotateCw size={12} strokeWidth={2.6} aria-hidden="true" /> Opnieuw
                </button>
              </div>
            )}
            {feed === "ok" && (
              <p className="mt-3 flex items-center gap-2 text-[12px]" style={{ color: C.muted }}>
                <Check size={14} strokeWidth={2.6} color={C.accent} aria-hidden="true" /> Sensor
                gekalibreerd — alle bronnen in beeld.
              </p>
            )}
          </Panel>
        </div>
      </div>

      {/* Berichten-strook */}
      <Panel className="p-4">
        <h3
          className="mb-3 flex items-center gap-2 text-[13px] font-semibold"
          style={{ color: C.fg }}
        >
          <Radio size={14} strokeWidth={2.2} color={C.accent} aria-hidden="true" /> Berichten
        </h3>
        <ul className="grid grid-cols-1 gap-2 sm:grid-cols-3">
          {BERICHTEN.map((b) => (
            <li
              key={b.van}
              className="rounded-xl p-3"
              style={{ background: "rgba(0,0,0,0.28)", border: `1px solid ${C.lineSoft}` }}
            >
              <div className="flex items-center gap-2">
                <span
                  className="flex h-7 w-7 items-center justify-center rounded-full text-[10px] font-semibold"
                  style={{ ...mono, color: "#0a0912", background: heat(b.ongelezen ? 0.85 : 0.35) }}
                  aria-hidden="true"
                >
                  {b.initialen}
                </span>
                <span
                  className="min-w-0 flex-1 truncate text-[12px] font-semibold"
                  style={{ color: C.fg }}
                >
                  {b.van}
                </span>
                {b.ongelezen && (
                  <span
                    className="h-2 w-2 shrink-0 rounded-full"
                    style={{ background: C.accent, boxShadow: `0 0 6px ${C.accent}` }}
                    aria-label="ongelezen"
                  />
                )}
              </div>
              <p className="mt-1.5 line-clamp-2 text-[11.5px]" style={{ color: C.muted }}>
                {b.preview}
              </p>
              <span className="mt-1 block text-[10px]" style={{ ...mono, color: C.faint }}>
                {b.tijd}
              </span>
            </li>
          ))}
        </ul>
      </Panel>
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
        <Kicker>Warmtekaart</Kicker>
        <Title>Open opdrachten</Title>
      </div>

      <div
        className="flex items-center gap-3 rounded-xl px-4 py-3"
        style={{ background: C.panelSolid, border: `1px solid ${C.line}`, boxShadow: GLOW }}
      >
        <Search size={16} strokeWidth={2.2} color={C.accent} aria-hidden="true" />
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Zoek op titel, plaats of opdrachtgever…"
          aria-label="Opdrachten zoeken"
          className="w-full bg-transparent text-[13px] outline-none placeholder:text-[#6f6182]"
          style={{ ...mono, color: C.fg }}
        />
        <span
          className="shrink-0 text-[11px] font-semibold tabular-nums"
          style={{ ...mono, color: C.faint }}
        >
          {filtered.length}/{OPDRACHTEN.length}
        </span>
      </div>

      {filtered.length === 0 ? (
        <Panel className="p-12 text-center">
          <span
            className="mx-auto flex h-14 w-14 items-center justify-center rounded-full"
            style={{ background: "rgba(0,0,0,0.35)", border: `1px solid ${C.line}` }}
            aria-hidden="true"
          >
            <Thermometer size={24} strokeWidth={2} color={C.accent} />
          </span>
          <p className="mt-4 text-[18px] font-semibold" style={{ color: C.fg }}>
            Geen warmte gevonden
          </p>
          <p className="mx-auto mt-2 max-w-xs text-[12px]" style={{ color: C.muted }}>
            Niets past bij &quot;{q}&quot;. Verruim je zoekopdracht.
          </p>
          <button
            onClick={() => setQ("")}
            className="mt-5 rounded-xl px-4 py-2 text-[12.5px] font-semibold transition-transform hover:scale-[1.02] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#ff7a1a]"
            style={{ color: "#0a0912", background: C.accent }}
          >
            Zoekopdracht wissen
          </button>
        </Panel>
      ) : (
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-[1.3fr_1fr]">
          <div className="space-y-3.5">
            {filtered.map((o) => {
              const on = sel?.id === o.id;
              const col = heat(matchHeat(o.match));
              return (
                <button
                  key={o.id}
                  onClick={() => onSelect(o.id)}
                  aria-pressed={on}
                  className="w-full rounded-2xl p-4 text-left transition-all hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#ff7a1a]"
                  style={{
                    background: C.panel,
                    border: `1px solid ${on ? `${col}99` : C.line}`,
                    boxShadow: on ? `0 0 32px -10px ${col}` : GLOW,
                  }}
                >
                  <div className="flex items-start gap-3.5">
                    <HeatScore value={o.match} size={54} />
                    <div className="min-w-0 flex-1">
                      <div
                        className="flex items-center gap-2 text-[10px] font-semibold"
                        style={{ ...mono, color: C.faint }}
                      >
                        <span className="uppercase tracking-[0.12em]">{o.id}</span>
                        {on && <span style={{ color: col }}>· in beeld</span>}
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
                            className="inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[10.5px] font-medium"
                            style={{
                              color: C.accent,
                              background: "rgba(255,122,26,0.08)",
                              border: `1px solid ${C.line}`,
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
                    style={{ ...mono, color: C.accent }}
                  >
                    {sel.id}
                  </span>
                  <Gauge size={15} strokeWidth={2.2} color={C.accent} aria-hidden="true" />
                </div>
                <div className="p-4">
                  <p className="text-[16px] font-semibold leading-snug" style={{ color: C.fg }}>
                    {sel.titel}
                  </p>
                  <p className="mt-1 text-[12px]" style={{ ...mono, color: C.muted }}>
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
                          style={{ ...mono, color: C.faint }}
                        >
                          {m.l}
                        </dt>
                        <dd
                          className="mt-0.5 font-semibold tabular-nums"
                          style={{ ...mono, color: C.fg }}
                        >
                          {m.v}
                        </dd>
                      </div>
                    ))}
                  </dl>
                  <button
                    onClick={() => onOpen(sel.id)}
                    className="mt-4 flex w-full items-center justify-center gap-1.5 rounded-xl px-4 py-2.5 text-[12.5px] font-semibold transition-transform hover:scale-[1.02] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#ff7a1a]"
                    style={{ color: "#0a0912", background: C.accent }}
                  >
                    Open opdracht <ArrowRight size={13} strokeWidth={2.6} aria-hidden="true" />
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
  const col = heat(matchHeat(opdracht.match));

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <Panel>
        <div className="flex flex-col gap-4 p-5 sm:flex-row sm:items-start sm:justify-between sm:p-6">
          <div>
            <Kicker>{opdracht.id}</Kicker>
            <Title>{opdracht.titel}</Title>
            <p className="mt-2 text-[12.5px]" style={{ ...mono, color: C.muted }}>
              {opdracht.opdrachtgever} · {opdracht.plaats}
            </p>
            <div className="mt-3 flex flex-wrap gap-1.5">
              {opdracht.tags.map((t) => (
                <span
                  key={t}
                  className="rounded-md px-2.5 py-0.5 text-[11px] font-medium"
                  style={{
                    ...mono,
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
          <HeatScore value={opdracht.match} size={80} />
        </div>
        <div className="p-5 pt-0 sm:p-6 sm:pt-0">
          <button
            onClick={react}
            disabled={state !== "idle"}
            aria-live="polite"
            className="flex w-full items-center justify-center gap-2 rounded-xl px-5 py-3 text-[13px] font-semibold transition-transform hover:scale-[1.01] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#ff7a1a] disabled:opacity-90"
            style={{ color: "#0a0912", background: state === "sent" ? C.warn : col }}
          >
            {state === "idle" && (
              <>
                <Flame size={15} strokeWidth={2.6} aria-hidden="true" /> Reageer op opdracht
              </>
            )}
            {state === "sending" && "Versturen…"}
            {state === "sent" && (
              <>
                <Check size={15} strokeWidth={3} aria-hidden="true" /> Reactie verstuurd
              </>
            )}
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
              style={{ ...mono, color: C.faint }}
            >
              {m.l}
            </p>
            <p className="mt-1.5 text-[18px] tabular-nums" style={{ ...mono, color: C.fg }}>
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
          <Thermometer size={16} strokeWidth={2.2} color={C.accent} aria-hidden="true" />
          <h3 className="text-[16px] font-semibold" style={{ color: C.fg }}>
            Waarom deze match warm is
          </h3>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2">
          <div className="p-5" style={{ borderBottom: `1px solid ${C.lineSoft}` }}>
            <p
              className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.1em]"
              style={{ ...mono, color: C.accent }}
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
                    color={C.accent}
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
              style={{ ...mono, color: C.warn }}
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
                    color={C.warn}
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
  const stats = [
    { l: "Geverifieerd", v: `${verified}/${total}`, color: C.accent, Icon: ShieldCheck },
    { l: "Verloopt", v: "1", color: C.warn, Icon: AlertTriangle },
    { l: "In beoordeling", v: "1", color: C.magenta, Icon: Clock },
  ];

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div>
        <Kicker>Verificatie</Kicker>
        <Title>Certificaten</Title>
        <p className="mt-2 text-[13px]" style={{ color: C.muted }}>
          Je bewijsstukken worden veilig en privé bewaard.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-3">
        {stats.map((s) => {
          const Icon = s.Icon;
          return (
            <Panel key={s.l} className="flex items-center justify-between p-4">
              <div>
                <p
                  className="text-[10.5px] font-semibold uppercase tracking-[0.08em]"
                  style={{ ...mono, color: C.faint }}
                >
                  {s.l}
                </p>
                <p className="mt-1.5 text-[24px] tabular-nums" style={{ ...mono, color: C.fg }}>
                  {s.v}
                </p>
              </div>
              <span
                className="flex h-11 w-11 items-center justify-center rounded-full"
                style={{
                  background: `${s.color}1c`,
                  border: `1px solid ${s.color}55`,
                  boxShadow: `0 0 16px -6px ${s.color}`,
                }}
              >
                <Icon size={20} strokeWidth={2} color={s.color} aria-hidden="true" />
              </span>
            </Panel>
          );
        })}
      </div>

      <Panel>
        {CREDENTIALS.map((c, i) => {
          const m = credMeta(c.status);
          const Icon = m.Icon;
          return (
            <div
              key={c.naam}
              className="flex flex-col gap-2 p-4 sm:flex-row sm:items-center sm:gap-4"
              style={{ borderTop: i === 0 ? "none" : `1px solid ${C.lineSoft}` }}
            >
              <span
                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl"
                style={{
                  background: `${m.color}18`,
                  border: `1px solid ${m.color}55`,
                  boxShadow: `0 0 16px -8px ${m.color}`,
                }}
              >
                <Icon size={20} strokeWidth={2} color={m.color} aria-hidden="true" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-[14px] font-semibold" style={{ color: C.fg }}>
                  {c.naam}
                </p>
                <p className="text-[11.5px]" style={{ ...mono, color: C.muted }}>
                  {c.detail}
                </p>
              </div>
              <div className="flex items-center gap-3">
                <HeatCell v={m.heat} size={16} />
                <StatusBadge status={c.status} />
              </div>
            </div>
          );
        })}
      </Panel>

      {/* Documenten — thermische lijst */}
      <Panel>
        <div
          className="flex items-center gap-2 p-4"
          style={{ borderBottom: `1px solid ${C.lineSoft}` }}
        >
          <Gauge size={15} strokeWidth={2.2} color={C.accent} aria-hidden="true" />
          <h3 className="text-[14px] font-semibold" style={{ color: C.fg }}>
            Documenten
          </h3>
        </div>
        {DOCUMENTEN.map((d, i) => {
          const m = credMeta(d.status);
          return (
            <div
              key={d.naam}
              className="flex items-center gap-3 p-4"
              style={{ borderTop: i === 0 ? "none" : `1px solid ${C.lineSoft}` }}
            >
              <span
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-[9px] font-semibold"
                style={{
                  ...mono,
                  color: C.fg,
                  background: "rgba(0,0,0,0.35)",
                  border: `1px solid ${C.lineSoft}`,
                }}
                aria-hidden="true"
              >
                {d.type}
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-[13px] font-semibold" style={{ color: C.fg }}>
                  {d.naam}
                </p>
                <p className="text-[11px]" style={{ ...mono, color: C.faint }}>
                  {d.grootte} · bijgewerkt {d.bijgewerkt}
                </p>
              </div>
              <span className="text-[11px] font-semibold" style={{ ...mono, color: m.color }}>
                {m.label}
              </span>
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
        <Kicker>Prioriteiten</Kicker>
        <Title>Volgende acties</Title>
        <p className="mt-2 text-[13px]" style={{ color: C.muted }}>
          Op volgorde van hitte — begin bij de warmste.
        </p>
      </div>

      <div className="space-y-3.5">
        {ACTIES.map((a, i) => {
          const warn = a.urgentie === "warning";
          const color = warn ? C.warn : C.accent;
          const h = warn ? 0.78 : 0.55 - i * 0.08;
          return (
            <Panel key={a.titel} className="flex items-stretch overflow-hidden">
              <div
                className="flex w-14 shrink-0 flex-col items-center justify-center gap-2"
                style={{ background: `${color}14`, borderRight: `1px solid ${color}44` }}
              >
                <span className="text-[16px] tabular-nums" style={{ ...mono, color }}>
                  {String(i + 1).padStart(2, "0")}
                </span>
                <HeatCell v={h} size={12} />
              </div>
              <div className="min-w-0 flex-1 p-4">
                <span
                  className="text-[10.5px] font-semibold uppercase tracking-[0.1em]"
                  style={{ ...mono, color }}
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
                onClick={() => onGo(warn ? "verificatie" : "marktplaats")}
                className="m-3 shrink-0 self-center rounded-xl px-4 py-2 text-[12px] font-semibold transition-transform hover:scale-[1.03] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#ff7a1a]"
                style={{
                  color: warn ? "#0a0912" : C.fg,
                  background: warn ? C.warn : "rgba(0,0,0,0.3)",
                  border: warn ? "none" : `1px solid ${C.line}`,
                }}
              >
                {a.cta}
              </button>
            </Panel>
          );
        })}
      </div>

      <div
        className="flex items-center gap-3 rounded-2xl p-4"
        style={{ background: "rgba(255,122,26,0.07)", border: `1px solid ${C.line}` }}
      >
        <Check size={18} strokeWidth={2.4} color={C.accent} aria-hidden="true" />
        <p className="text-[12.5px]" style={{ color: C.muted }}>
          Verder is alles afgekoeld en bijgewerkt. Nieuwe hitte verschijnt hier vanzelf.
        </p>
      </div>
    </div>
  );
}

/* ---------- Facturen ---------- */

function Facturen() {
  const statusHeat: Record<string, number> = { Betaald: 0.9, Openstaand: 0.62, Concept: 0.2 };
  const statusColor: Record<string, string> = {
    Betaald: C.accent,
    Openstaand: C.warn,
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
          <Kicker>Financiën</Kicker>
          <Title>Facturen</Title>
        </div>
        <button
          className="inline-flex shrink-0 items-center gap-2 rounded-xl px-4 py-2.5 text-[12.5px] font-semibold transition-transform hover:scale-[1.02] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#ff7a1a]"
          style={{ color: "#0a0912", background: C.accent }}
        >
          <Plus size={14} strokeWidth={2.6} aria-hidden="true" /> Nieuwe factuur
        </button>
      </div>

      <div className="grid grid-cols-2 gap-3.5">
        <Panel className="p-5">
          <p
            className="text-[10.5px] font-semibold uppercase tracking-[0.1em]"
            style={{ ...mono, color: C.faint }}
          >
            Ontvangen
          </p>
          <p className="mt-2 text-[22px] tabular-nums" style={{ ...mono, color: C.accent }}>
            € {betaald.toLocaleString("nl-NL")}
          </p>
        </Panel>
        <Panel className="p-5">
          <p
            className="text-[10.5px] font-semibold uppercase tracking-[0.1em]"
            style={{ ...mono, color: C.faint }}
          >
            Openstaand
          </p>
          <p className="mt-2 text-[22px] tabular-nums" style={{ ...mono, color: C.warn }}>
            € {open.toLocaleString("nl-NL")}
          </p>
        </Panel>
      </div>

      <Panel className="overflow-x-auto">
        <table className="w-full text-left">
          <thead>
            <tr
              className="text-[10.5px] font-semibold uppercase tracking-[0.08em]"
              style={{ ...mono, color: C.faint, borderBottom: `1px solid ${C.lineSoft}` }}
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
                <tr
                  key={f.nr}
                  className="transition-colors hover:bg-[rgba(255,122,26,0.05)]"
                  style={{ borderTop: i === 0 ? "none" : `1px solid ${C.lineSoft}` }}
                >
                  <td
                    className="p-4 text-[12px] font-semibold tabular-nums"
                    style={{ ...mono, color: C.fg }}
                  >
                    {f.nr}
                  </td>
                  <td className="p-4 text-[13px] font-medium" style={{ color: C.fg }}>
                    {f.klant}
                  </td>
                  <td
                    className="hidden p-4 text-[12px] tabular-nums sm:table-cell"
                    style={{ ...mono, color: C.muted }}
                  >
                    {f.datum}
                  </td>
                  <td
                    className="p-4 text-right text-[13px] tabular-nums"
                    style={{ ...mono, color: C.fg }}
                  >
                    {f.bedrag}
                  </td>
                  <td className="p-4">
                    <div className="flex items-center justify-end gap-1.5">
                      <HeatCell v={statusHeat[f.status] ?? 0.2} size={9} />
                      <span className="text-[11.5px] font-semibold" style={{ ...mono, color }}>
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

      <p
        className="text-center text-[10px] uppercase tracking-[0.2em]"
        style={{ ...mono, color: C.faint }}
      >
        {NAV.length} modules · Therma infrarood
      </p>
    </div>
  );
}
