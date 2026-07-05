"use client";

// Concept 89 — "Lumen" · bioluminescente diepzee.
// Bijna-zwart teal scherm (#04110f) waar licht alleen oplicht waar het telt: matches en urgentie.
// Organische "caustics" (deterministische sinus-lagen, geen random) drijven traag over de diepte;
// bioluminescente knopen ademen zacht op als plankton. Kalm & premium in het donker — expressief
// zonder harde neon. Zachte fg #d7f5ec, elektrisch-teal accent #2ff5c8.
// Fonts: --font-lab-sora (display) + --font-lab-spline-mono (meta/cijfers).
// Onderscheidend: het licht stuurt de aandacht; alles daarbuiten valt weg in de diepte.

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
  Waves,
  Droplets,
  Anchor,
  Compass,
  Sparkles,
  RotateCw,
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

void NAV;
void DOCUMENTEN;

/* ---------- Palet & typografie ---------- */

const C = {
  abyss: "#04110f",
  abyssAlt: "#061c18",
  panel: "rgba(8,30,25,0.72)",
  panelSolid: "#08211b",
  fg: "#d7f5ec",
  accent: "#2ff5c8",
  aqua: "#5fd7ff",
  muted: "#6fae9d",
  faint: "#487d6e",
  warn: "#ffce6b",
  alert: "#ff8a7a",
  line: "rgba(47,245,200,0.14)",
  lineSoft: "rgba(47,245,200,0.07)",
  grid: "rgba(47,245,200,0.09)",
};

const display = { fontFamily: "var(--font-lab-sora)" };
const meta = { fontFamily: "var(--font-lab-spline-mono)" };

const GLOW = "inset 0 0 0 1px rgba(47,245,200,0.08), 0 22px 60px -34px rgba(0,0,0,0.9)";
const RING = "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2ff5c8]";

/* ---------- Diepzee-geometrie (deterministisch) ---------- */

// Vaste knoop-posities per opdracht: fractie van het veld. Dieper (hogere y) = verder weg.
const NODES: { x: number; y: number; diepte: string }[] = [
  { x: 0.26, y: 0.28, diepte: "12 min" },
  { x: 0.68, y: 0.6, diepte: "38 min" },
  { x: 0.46, y: 0.78, diepte: "21 min" },
];

// Deterministische caustic-golflijn: gelaagde sinus, geen willekeur.
function causticPath(seed: number, yBase: number, amp: number, w = 200, steps = 10): string {
  const pts: [number, number][] = [];
  for (let i = 0; i <= steps; i++) {
    const x = (i / steps) * w;
    const y =
      yBase + Math.sin(i * 0.72 + seed * 1.6) * amp + Math.cos(i * 0.41 + seed * 0.9) * amp * 0.45;
    pts.push([x, y]);
  }
  return pts.map((p, i) => `${i === 0 ? "M" : "L"}${p[0].toFixed(1)} ${p[1].toFixed(1)}`).join(" ");
}

/* ---------- Status → betekenis (label + icoon + kleur, nooit kleur-alleen) ---------- */

type CredMeta = { label: string; color: string; Icon: typeof ShieldCheck };

function credMeta(s: CredStatus): CredMeta {
  switch (s) {
    case "VERIFIED":
      return { label: "Verankerd", color: C.accent, Icon: ShieldCheck };
    case "SUBMITTED":
      return { label: "In stroming", color: C.aqua, Icon: Clock };
    case "EXPIRING":
      return { label: "Licht dooft", color: C.warn, Icon: AlertTriangle };
    case "REJECTED":
      return { label: "Afgewezen", color: C.alert, Icon: XCircle };
  }
}

function digits(v: string): number {
  const only = v.replace(/[^\d]/g, "");
  return only ? parseInt(only, 10) : 0;
}

/* ---------- Kleine bouwstenen ---------- */

function Kicker({ children }: { children: React.ReactNode }) {
  return (
    <span
      className="inline-flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.3em]"
      style={{ ...meta, color: C.accent }}
    >
      <span
        className="h-1.5 w-1.5 rounded-full"
        style={{ background: C.accent, boxShadow: `0 0 8px ${C.accent}` }}
        aria-hidden="true"
      />
      {children}
    </span>
  );
}

function Title({ children }: { children: React.ReactNode }) {
  return (
    <h1
      className="mt-2 text-[26px] font-semibold leading-[1.05] tracking-[-0.01em] sm:text-[32px]"
      style={{ ...display, color: C.fg, textShadow: "0 0 32px rgba(47,245,200,0.2)" }}
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
        ...meta,
        color: m.color,
        background: "rgba(0,0,0,0.34)",
        border: `1px solid ${m.color}55`,
      }}
    >
      <Icon size={13} strokeWidth={2.4} aria-hidden="true" />
      {m.label}
    </span>
  );
}

// Bioluminescente sparkline — dunne lichtlijn met zachte gloed.
function Spark({ data, color = C.accent }: { data: number[]; color?: string }) {
  const w = 96;
  const h = 30;
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
  const area = `${line} L${w} ${h} L0 ${h} Z`;
  const last = pts[pts.length - 1];
  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} aria-hidden="true">
      <defs>
        <linearGradient id={`lum-area-${color}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.28" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={area} fill={`url(#lum-area-${color})`} />
      <path
        d={line}
        fill="none"
        stroke={color}
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
        style={{ filter: `drop-shadow(0 0 3px ${color}aa)` }}
      />
      {last && <circle cx={last[0]} cy={last[1]} r="2.1" fill={color} />}
    </svg>
  );
}

// Match-uitlezing: gloeiende ring die de score aftekent.
function ScoreOrb({ value, size = 48 }: { value: number; size?: number }) {
  const r = size / 2 - 3;
  const circ = 2 * Math.PI * r;
  const strong = value >= 90;
  const color = strong ? C.accent : C.aqua;
  return (
    <span
      className="relative flex shrink-0 items-center justify-center"
      style={{ width: size, height: size }}
      aria-hidden="true"
    >
      <svg width={size} height={size} className="absolute inset-0 -rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={C.lineSoft}
          strokeWidth="2.4"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={color}
          strokeWidth="2.4"
          strokeLinecap="round"
          strokeDasharray={circ}
          strokeDashoffset={circ * (1 - value / 100)}
          style={{ filter: `drop-shadow(0 0 5px ${color}bb)` }}
        />
      </svg>
      <span
        className="text-[13px] font-semibold tabular-nums"
        style={{ ...meta, color: strong ? C.accent : C.fg }}
      >
        {value}
      </span>
    </span>
  );
}

/* ---------- Diepzee-veld (het handtekening-element) ---------- */

function DiepzeeVeld({
  onSelect,
  activeId,
}: {
  onSelect: (id: string) => void;
  activeId?: string;
}) {
  const causticSeeds = [0, 1.4, 2.8, 4.2];
  return (
    <div
      className="relative aspect-[4/3] w-full overflow-hidden rounded-xl"
      style={{ background: C.abyss }}
    >
      <svg
        viewBox="0 0 200 150"
        className="absolute inset-0 h-full w-full"
        preserveAspectRatio="xMidYMid slice"
        role="img"
        aria-label="Diepzee-veld met bioluminescente matches"
      >
        <defs>
          <radialGradient id="lum-depth" cx="50%" cy="18%" r="90%">
            <stop offset="0%" stopColor="rgba(47,245,200,0.12)" />
            <stop offset="55%" stopColor="rgba(8,33,27,0.4)" />
            <stop offset="100%" stopColor="rgba(4,17,15,1)" />
          </radialGradient>
          <radialGradient id="lum-node" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor={C.accent} stopOpacity="0.95" />
            <stop offset="40%" stopColor={C.accent} stopOpacity="0.35" />
            <stop offset="100%" stopColor={C.accent} stopOpacity="0" />
          </radialGradient>
        </defs>

        <rect x="0" y="0" width="200" height="150" fill="url(#lum-depth)" />

        {/* Drijvende caustic-lichtlagen */}
        {causticSeeds.map((seed, i) => (
          <path
            key={seed}
            d={causticPath(seed, 26 + i * 30, 5 + i * 1.6)}
            fill="none"
            stroke={C.grid}
            strokeWidth={0.7}
            style={{
              animation: `lum-drift ${16 + i * 3}s ease-in-out ${i * 0.8}s infinite alternate`,
            }}
          />
        ))}

        {/* Knopen = matches, opgloeiend als plankton */}
        {OPDRACHTEN.map((o, i) => {
          const n = NODES[i] ?? NODES[0]!;
          const cx = n.x * 200;
          const cy = n.y * 150;
          const on = activeId === o.id;
          return (
            <g
              key={o.id}
              style={{ animation: `lum-breathe ${5 + i * 0.9}s ease-in-out ${i * 0.5}s infinite` }}
            >
              <circle cx={cx} cy={cy} r={on ? 22 : 16} fill="url(#lum-node)" />
              <circle cx={cx} cy={cy} r={on ? 3.4 : 2.6} fill={C.fg} />
            </g>
          );
        })}
      </svg>

      {/* Klikbare, toegankelijke hotspots */}
      {OPDRACHTEN.map((o, i) => {
        const n = NODES[i] ?? NODES[0]!;
        const on = activeId === o.id;
        return (
          <button
            key={o.id}
            onClick={() => onSelect(o.id)}
            aria-label={`${o.titel} — match ${o.match}%, reistijd ${n.diepte}`}
            className={`group absolute -translate-x-1/2 -translate-y-1/2 rounded-full p-2 ${RING}`}
            style={{ left: `${n.x * 100}%`, top: `${n.y * 100}%` }}
          >
            <span
              className={`whitespace-nowrap rounded-full px-2 py-0.5 text-[9px] font-semibold tabular-nums transition-opacity ${
                on
                  ? "opacity-100"
                  : "opacity-0 group-hover:opacity-100 group-focus-visible:opacity-100"
              }`}
              style={{ ...meta, color: on ? C.accent : C.fg, background: "rgba(0,0,0,0.72)" }}
            >
              {o.match}% · {n.diepte}
            </span>
          </button>
        );
      })}
    </div>
  );
}

/* ---------- Hoofdcomponent ---------- */

export function Concept89() {
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
        background: `radial-gradient(130% 100% at 50% -10%, ${C.abyssAlt}, ${C.abyss} 62%)`,
      }}
    >
      {/* Deterministische keyframes: caustic-drift + bioluminescente ademhaling */}
      <style>{`
        @keyframes lum-drift { from { transform: translateX(-8px); } to { transform: translateX(8px); } }
        @keyframes lum-breathe { 0%,100% { opacity: 0.55; } 50% { opacity: 1; } }
        @keyframes lum-pulse { 0%,100% { opacity: 0.5; } 50% { opacity: 1; } }
      `}</style>

      {/* Zachte diepte-vignettering */}
      <div
        className="pointer-events-none absolute inset-0"
        aria-hidden="true"
        style={{
          background:
            "radial-gradient(90% 60% at 50% 0%, rgba(47,245,200,0.06), rgba(0,0,0,0) 60%)",
        }}
      />

      <div className="relative flex min-h-[680px] flex-col md:flex-row">
        {/* Zijbalk */}
        <aside
          className="shrink-0 md:w-[240px]"
          style={{ borderRight: `1px solid ${C.line}`, background: "rgba(0,0,0,0.24)" }}
        >
          <div className="flex h-full flex-col">
            <div
              className="flex items-center gap-3 p-5"
              style={{ borderBottom: `1px solid ${C.lineSoft}` }}
            >
              <span
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl"
                style={{
                  background: "rgba(0,0,0,0.4)",
                  border: `1px solid ${C.line}`,
                  boxShadow: `0 0 18px -6px ${C.accent}`,
                }}
                aria-hidden="true"
              >
                <Droplets size={19} strokeWidth={2} color={C.accent} />
              </span>
              <div className="leading-tight">
                <div className="text-[16px] font-semibold" style={{ ...display, color: C.fg }}>
                  Lumen
                </div>
                <div
                  className="text-[9px] font-semibold uppercase tracking-[0.26em]"
                  style={{ ...meta, color: C.faint }}
                >
                  ZZP · diepte
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
                    onClick={() => setScreen(s.key)}
                    aria-current={on ? "page" : undefined}
                    className={`relative flex shrink-0 items-center gap-2.5 rounded-xl px-3.5 py-2.5 text-left text-[13px] font-medium transition-colors md:w-full ${RING}`}
                    style={{
                      color: on ? C.fg : C.muted,
                      background: on ? "rgba(47,245,200,0.09)" : "transparent",
                      border: on ? `1px solid ${C.line}` : "1px solid transparent",
                    }}
                  >
                    {on && (
                      <span
                        className="h-1.5 w-1.5 shrink-0 rounded-full"
                        style={{ background: C.accent, boxShadow: `0 0 8px ${C.accent}` }}
                        aria-hidden="true"
                      />
                    )}
                    <span>{s.label}</span>
                  </button>
                );
              })}
            </nav>

            <div
              className="hidden items-center gap-3 p-4 md:flex"
              style={{ borderTop: `1px solid ${C.lineSoft}`, background: "rgba(0,0,0,0.2)" }}
            >
              <span
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-[12px] font-semibold"
                style={{
                  ...meta,
                  color: C.abyss,
                  background: C.accent,
                  boxShadow: `0 0 16px -4px ${C.accent}`,
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
              <Dashboard
                onOpen={open}
                onGo={setScreen}
                activeId={activeId}
                onSelect={setActiveId}
              />
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
  activeId,
  onSelect,
}: {
  onOpen: (id?: string) => void;
  onGo: (k: ScreenKey) => void;
  activeId: string;
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
          <Kicker>Diepte actief</Kicker>
          <Title>Goedemorgen, {PROFIEL.naam.split(" ")[0]}</Title>
          <p className="mt-2 text-[13px]" style={{ color: C.muted }}>
            {PROFIEL.rol} · {PROFIEL.plaats}
          </p>
        </div>
        <div
          className="flex items-center gap-2 rounded-full px-3.5 py-2 text-[11px] font-semibold"
          style={{
            ...meta,
            color: C.accent,
            background: "rgba(0,0,0,0.3)",
            border: `1px solid ${C.line}`,
          }}
        >
          <Waves size={13} strokeWidth={2.2} aria-hidden="true" /> {OPDRACHTEN.length} lichten in
          bereik
        </div>
      </header>

      {warn && (
        <div
          className="flex flex-col gap-3 rounded-2xl p-4 sm:flex-row sm:items-center"
          style={{
            border: `1px solid ${C.warn}55`,
            background: "rgba(255,206,107,0.08)",
            boxShadow: GLOW,
          }}
          role="alert"
        >
          <span
            className="flex h-10 w-10 shrink-0 items-center justify-center self-start rounded-xl"
            style={{ background: "rgba(0,0,0,0.34)", border: `1px solid ${C.warn}55` }}
          >
            <AlertTriangle size={18} strokeWidth={2.2} color={C.warn} aria-hidden="true" />
          </span>
          <p className="text-[13px] leading-snug" style={{ color: C.fg }}>
            <span className="font-semibold">{warn.titel}.</span>{" "}
            <span style={{ color: C.muted }}>{warn.detail}</span>
          </p>
          <button
            onClick={() => onGo("verificatie")}
            className={`ml-auto inline-flex shrink-0 items-center gap-1.5 rounded-full px-3.5 py-2 text-[12px] font-semibold transition-transform hover:-translate-y-0.5 ${RING}`}
            style={{ color: C.abyss, background: C.warn }}
          >
            {warn.cta} <ArrowRight size={13} strokeWidth={2.6} aria-hidden="true" />
          </button>
        </div>
      )}

      <div className="grid grid-cols-2 gap-3.5 lg:grid-cols-4">
        {KPIS.map((k) => (
          <Panel key={k.label} className="flex flex-col justify-between p-4">
            <div className="flex items-start justify-between gap-2">
              <p
                className="text-[10.5px] font-semibold uppercase leading-tight tracking-[0.08em]"
                style={{ ...meta, color: C.muted }}
              >
                {k.label}
              </p>
              <span
                className="inline-flex items-center gap-0.5 text-[11px] font-semibold tabular-nums"
                style={{ ...meta, color: k.up ? C.accent : C.warn }}
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
              <Spark data={k.spark} color={k.up ? C.accent : C.warn} />
            </div>
          </Panel>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-[1fr_1.05fr]">
        {/* Diepzee-veld */}
        <Panel className="p-5">
          <div className="mb-3 flex items-center justify-between">
            <h3
              className="flex items-center gap-2 text-[14px] font-semibold"
              style={{ color: C.fg }}
            >
              <Sparkles size={16} strokeWidth={2} color={C.accent} aria-hidden="true" /> Lichten in
              de diepte
            </h3>
            <span
              className="text-[10px] font-semibold uppercase tracking-[0.14em]"
              style={{ ...meta, color: C.faint }}
            >
              dieper = verder reizen
            </span>
          </div>
          <DiepzeeVeld activeId={activeId} onSelect={onSelect} />
          <p className="mt-3 text-center text-[11px]" style={{ color: C.muted }}>
            Elk oplichtend punt is een match. Tik op een licht om te openen.
          </p>
        </Panel>

        <div className="space-y-5">
          {/* Beste matches lijst */}
          <Panel>
            <div
              className="flex items-center justify-between p-4"
              style={{ borderBottom: `1px solid ${C.lineSoft}` }}
            >
              <h3 className="text-[14px] font-semibold" style={{ color: C.fg }}>
                Matches
              </h3>
              <button
                onClick={() => onGo("marktplaats")}
                className={`inline-flex items-center gap-1 rounded-md px-2 py-1 text-[11px] font-semibold transition-colors ${RING}`}
                style={{ ...meta, color: C.accent }}
              >
                Alles <ArrowRight size={12} strokeWidth={2.6} aria-hidden="true" />
              </button>
            </div>
            <ul className="p-2">
              {OPDRACHTEN.map((o) => (
                <li key={o.id}>
                  <button
                    onClick={() => onOpen(o.id)}
                    className={`flex w-full items-center gap-3 rounded-xl p-3 text-left transition-colors hover:bg-[rgba(47,245,200,0.06)] focus-visible:ring-inset ${RING}`}
                  >
                    <ScoreOrb value={o.match} />
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
                    <ArrowUpRight size={15} strokeWidth={2.2} color={C.faint} aria-hidden="true" />
                  </button>
                </li>
              ))}
            </ul>
          </Panel>

          {/* Live feed — loading + error-state */}
          <Panel className="p-4">
            <h3
              className="flex items-center gap-2 text-[13px] font-semibold"
              style={{ color: C.fg }}
            >
              <Waves size={14} strokeWidth={2.2} color={C.accent} aria-hidden="true" /> Stroming
            </h3>
            {feed === "loading" && (
              <div className="mt-3 space-y-2" role="status" aria-live="polite">
                <span className="sr-only">Stroming wordt geladen…</span>
                {[0, 1].map((i) => (
                  <span
                    key={i}
                    className="block h-3 animate-pulse rounded-full"
                    style={{ background: "rgba(47,245,200,0.1)", width: i === 0 ? "80%" : "60%" }}
                  />
                ))}
              </div>
            )}
            {feed === "error" && (
              <div
                className="mt-3 flex flex-col gap-2 rounded-xl p-3 sm:flex-row sm:items-center"
                style={{ background: "rgba(255,138,122,0.08)", border: `1px solid ${C.alert}55` }}
                role="alert"
              >
                <XCircle size={16} strokeWidth={2.2} color={C.alert} aria-hidden="true" />
                <p className="flex-1 text-[12px]" style={{ color: C.fg }}>
                  Signaal verloren in de diepte. Kon de stroming niet ophalen.
                </p>
                <button
                  onClick={() => setFeed("ok")}
                  className={`inline-flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1.5 text-[11.5px] font-semibold transition-colors ${RING}`}
                  style={{ color: C.abyss, background: C.accent }}
                >
                  <RotateCw size={12} strokeWidth={2.6} aria-hidden="true" /> Opnieuw
                </button>
              </div>
            )}
            {feed === "ok" && (
              <p className="mt-3 flex items-center gap-2 text-[12px]" style={{ color: C.muted }}>
                <Check size={14} strokeWidth={2.6} color={C.accent} aria-hidden="true" /> Verbinding
                hersteld — alle lichten in bereik.
              </p>
            )}
          </Panel>

          {/* Berichten-preview */}
          <Panel className="p-4">
            <h3
              className="flex items-center gap-2 text-[13px] font-semibold"
              style={{ color: C.fg }}
            >
              <Compass size={14} strokeWidth={2.2} color={C.accent} aria-hidden="true" /> Berichten
            </h3>
            <ul className="mt-3 space-y-2.5">
              {BERICHTEN.slice(0, 2).map((b) => (
                <li key={b.van} className="flex items-center gap-3">
                  <span
                    className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-[10px] font-semibold"
                    style={{
                      ...meta,
                      color: C.accent,
                      background: "rgba(47,245,200,0.1)",
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
                          style={{ background: C.accent, boxShadow: `0 0 6px ${C.accent}` }}
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
        style={{ background: C.panelSolid, border: `1px solid ${C.line}`, boxShadow: GLOW }}
      >
        <Search size={16} strokeWidth={2.2} color={C.accent} aria-hidden="true" />
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Zoek op titel, plaats of opdrachtgever…"
          aria-label="Opdrachten zoeken"
          className="w-full bg-transparent text-[13px] outline-none placeholder:text-[#487d6e]"
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
          <span
            className="mx-auto flex h-14 w-14 items-center justify-center rounded-full"
            style={{ background: "rgba(0,0,0,0.34)", border: `1px solid ${C.line}` }}
            aria-hidden="true"
          >
            <Droplets size={24} strokeWidth={2} color={C.accent} />
          </span>
          <p className="mt-4 text-[18px] font-semibold" style={{ color: C.fg }}>
            Geen licht in bereik
          </p>
          <p className="mx-auto mt-2 max-w-xs text-[12px]" style={{ color: C.muted }}>
            Geen match past bij &quot;{q}&quot;. Verruim je zoekopdracht.
          </p>
          <button
            onClick={() => setQ("")}
            className={`mt-5 rounded-full px-4 py-2 text-[12.5px] font-semibold transition-colors ${RING}`}
            style={{ color: C.abyss, background: C.accent }}
          >
            Zoekopdracht wissen
          </button>
        </Panel>
      ) : (
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-[1.3fr_1fr]">
          <div className="space-y-3.5">
            {filtered.map((o) => {
              const on = sel?.id === o.id;
              return (
                <button
                  key={o.id}
                  onClick={() => onSelect(o.id)}
                  aria-pressed={on}
                  className={`w-full rounded-2xl p-4 text-left transition-all hover:-translate-y-0.5 ${RING}`}
                  style={{
                    background: C.panel,
                    border: `1px solid ${on ? `${C.accent}88` : C.line}`,
                    boxShadow: on ? `0 0 30px -8px ${C.accent}` : GLOW,
                  }}
                >
                  <div className="flex items-start gap-3.5">
                    <ScoreOrb value={o.match} size={52} />
                    <div className="min-w-0 flex-1">
                      <div
                        className="flex items-center gap-2 text-[10px] font-semibold"
                        style={{ ...meta, color: C.faint }}
                      >
                        <span className="uppercase tracking-[0.12em]">{o.id}</span>
                        {on && <span style={{ color: C.accent }}>· geselecteerd</span>}
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
                              color: C.accent,
                              background: "rgba(47,245,200,0.08)",
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
                    style={{ ...meta, color: C.accent }}
                  >
                    {sel.id}
                  </span>
                  <Anchor size={15} strokeWidth={2.2} color={C.accent} aria-hidden="true" />
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
                    onClick={() => onOpen(sel.id)}
                    className={`mt-4 flex w-full items-center justify-center gap-1.5 rounded-full px-4 py-2.5 text-[12.5px] font-semibold transition-transform hover:-translate-y-0.5 ${RING}`}
                    style={{ color: C.abyss, background: C.accent }}
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
          <ScoreOrb value={opdracht.match} size={76} />
        </div>
        <div className="p-5 pt-0 sm:p-6 sm:pt-0">
          <button
            onClick={react}
            disabled={state !== "idle"}
            aria-live="polite"
            className={`flex w-full items-center justify-center gap-2 rounded-full px-5 py-3 text-[13px] font-semibold transition-colors disabled:opacity-90 ${RING}`}
            style={{ color: C.abyss, background: state === "sent" ? C.fg : C.accent }}
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
          <Sparkles size={16} strokeWidth={2} color={C.accent} aria-hidden="true" />
          <h3 className="text-[16px] font-semibold" style={{ color: C.fg }}>
            Waarom deze match
          </h3>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2">
          <div className="p-5" style={{ borderBottom: `1px solid ${C.lineSoft}` }}>
            <p
              className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.1em]"
              style={{ ...meta, color: C.accent }}
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
              style={{ ...meta, color: C.warn }}
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
    { l: "Verankerd", v: `${verified}/${total}`, color: C.accent, Icon: ShieldCheck },
    { l: "Licht dooft", v: "1", color: C.warn, Icon: AlertTriangle },
    { l: "In stroming", v: "1", color: C.aqua, Icon: Clock },
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
                  style={{ ...meta, color: C.faint }}
                >
                  {s.l}
                </p>
                <p className="mt-1.5 text-[24px] tabular-nums" style={{ ...display, color: C.fg }}>
                  {s.v}
                </p>
              </div>
              <span
                className="flex h-11 w-11 items-center justify-center rounded-full"
                style={{ background: `${s.color}1c`, border: `1px solid ${s.color}55` }}
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
                style={{ background: `${m.color}18`, border: `1px solid ${m.color}55` }}
              >
                <Icon size={20} strokeWidth={2} color={m.color} aria-hidden="true" />
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
        <Kicker>Prioriteiten</Kicker>
        <Title>Volgende acties</Title>
        <p className="mt-2 text-[13px]" style={{ color: C.muted }}>
          Op volgorde van urgentie — begin bovenaan.
        </p>
      </div>

      <div className="space-y-3.5">
        {ACTIES.map((a, i) => {
          const warn = a.urgentie === "warning";
          const color = warn ? C.warn : C.accent;
          return (
            <Panel key={a.titel} className="flex items-stretch overflow-hidden">
              <div
                className="flex w-14 shrink-0 flex-col items-center justify-center gap-2"
                style={{ background: `${color}14`, borderRight: `1px solid ${color}44` }}
              >
                <span className="text-[16px] tabular-nums" style={{ ...meta, color }}>
                  {String(i + 1).padStart(2, "0")}
                </span>
                {warn ? (
                  <AlertTriangle size={15} strokeWidth={2.4} color={color} aria-hidden="true" />
                ) : (
                  <Waves size={15} strokeWidth={2.2} color={color} aria-hidden="true" />
                )}
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
                onClick={() => onGo(warn ? "verificatie" : "marktplaats")}
                className={`m-3 shrink-0 self-center rounded-full px-4 py-2 text-[12px] font-semibold transition-colors ${RING}`}
                style={{
                  color: warn ? C.abyss : C.fg,
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
        style={{ background: "rgba(47,245,200,0.07)", border: `1px solid ${C.line}` }}
      >
        <Check size={18} strokeWidth={2.4} color={C.accent} aria-hidden="true" />
        <p className="text-[12.5px]" style={{ color: C.muted }}>
          Verder is alles bijgewerkt. Nieuwe lichten verschijnen hier vanzelf.
        </p>
      </div>
    </div>
  );
}

/* ---------- Facturen ---------- */

function Facturen() {
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
          className={`inline-flex shrink-0 items-center gap-2 rounded-full px-4 py-2.5 text-[12.5px] font-semibold transition-transform hover:-translate-y-0.5 ${RING}`}
          style={{ color: C.abyss, background: C.accent }}
        >
          <Plus size={14} strokeWidth={2.6} aria-hidden="true" /> Nieuwe factuur
        </button>
      </div>

      <div className="grid grid-cols-2 gap-3.5">
        <Panel className="p-5">
          <p
            className="text-[10.5px] font-semibold uppercase tracking-[0.1em]"
            style={{ ...meta, color: C.faint }}
          >
            Ontvangen
          </p>
          <p className="mt-2 text-[22px] tabular-nums" style={{ ...display, color: C.accent }}>
            € {betaald.toLocaleString("nl-NL")}
          </p>
        </Panel>
        <Panel className="p-5">
          <p
            className="text-[10.5px] font-semibold uppercase tracking-[0.1em]"
            style={{ ...meta, color: C.faint }}
          >
            Openstaand
          </p>
          <p className="mt-2 text-[22px] tabular-nums" style={{ ...display, color: C.warn }}>
            € {open.toLocaleString("nl-NL")}
          </p>
        </Panel>
      </div>

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
