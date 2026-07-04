"use client";

// Concept 77 — "Arcade" · retro-game HUD / 16-bit.
// Donker (#12101f) met fel wit-violette tekst (#f2f0ff), neon-magenta accent (#ff3d7f) en
// neon-cyaan secundair (#3df0e0). Game-HUD-taal: XP/health-achtige voortgangsbalken (match% als
// "power bar"), score-teller met tabulaire cijfers, LEVEL/MISSIE-labels, subtiele scanline/CRT-gloed
// via CSS en pixel-achtige chunky borders (harde hoeken). Speels maar strak en leesbaar.
// Fonts: --font-lab-space (display/HUD) + --font-lab-geist-mono (scores/cijfers).

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
  Gamepad2,
  Zap,
  Trophy,
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

/* ---------- Palet & typografie ---------- */

const C = {
  bg: "#12101f",
  bgAlt: "#1a1730",
  panel: "#1e1a36",
  panelHi: "#26214a",
  text: "#f2f0ff",
  muted: "#a29dc8",
  faint: "#726d9c",
  magenta: "#ff3d7f",
  cyan: "#3df0e0",
  yellow: "#ffd34d",
  green: "#4dffb0",
  line: "rgba(242,240,255,0.14)",
  lineSoft: "rgba(242,240,255,0.08)",
};

const hud = { fontFamily: "var(--font-lab-space)" };
const score = { fontFamily: "var(--font-lab-geist-mono)" };

const PIXEL = "0 0 0 2px rgba(242,240,255,0.1), 4px 4px 0 rgba(0,0,0,0.5)";

function digits(v: string): number {
  const only = v.replace(/[^\d]/g, "");
  return only ? parseInt(only, 10) : 0;
}

/* ---------- Status → betekenis (label + icoon + kleur, nooit kleur-alleen) ---------- */

type CredMeta = { label: string; color: string; Icon: typeof ShieldCheck };

function credMeta(s: CredStatus): CredMeta {
  switch (s) {
    case "VERIFIED":
      return { label: "Unlocked", color: C.green, Icon: ShieldCheck };
    case "SUBMITTED":
      return { label: "Laden…", color: C.cyan, Icon: Clock };
    case "EXPIRING":
      return { label: "Low power", color: C.yellow, Icon: AlertTriangle };
    case "REJECTED":
      return { label: "Game over", color: C.magenta, Icon: XCircle };
  }
}

/* ---------- CRT / scanline-laag (pure CSS, deterministisch) ---------- */

function Scanlines() {
  return (
    <div
      className="pointer-events-none absolute inset-0"
      aria-hidden="true"
      style={{
        backgroundImage:
          "repeating-linear-gradient(0deg, rgba(0,0,0,0.18) 0px, rgba(0,0,0,0.18) 1px, transparent 1px, transparent 3px)",
        mixBlendMode: "multiply",
      }}
    />
  );
}

function Glow() {
  return (
    <div
      className="pointer-events-none absolute inset-0"
      aria-hidden="true"
      style={{
        background:
          "radial-gradient(90% 60% at 20% 0%, rgba(255,61,127,0.12), transparent 60%), radial-gradient(80% 60% at 100% 100%, rgba(61,240,224,0.1), transparent 55%)",
      }}
    />
  );
}

/* ---------- Kleine bouwstenen ---------- */

// Power bar — match% als vullende HUD-balk met neon-gloed en pixel-segmenten.
function PowerBar({
  value,
  color = C.magenta,
  animate = false,
}: {
  value: number;
  color?: string;
  animate?: boolean;
}) {
  const [w, setW] = useState(animate ? 0 : value);
  useEffect(() => {
    if (!animate) return;
    const t = window.setTimeout(() => setW(value), 120);
    return () => window.clearTimeout(t);
  }, [animate, value]);
  return (
    <div
      className="relative h-3.5 w-full overflow-hidden"
      style={{ background: "rgba(0,0,0,0.5)", border: `2px solid ${C.line}` }}
      role="progressbar"
      aria-valuenow={value}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label={`Power ${value} procent`}
    >
      <div
        className="h-full transition-[width] duration-700 ease-out"
        style={{
          width: `${w}%`,
          background: `repeating-linear-gradient(90deg, ${color}, ${color} 5px, rgba(0,0,0,0.25) 5px, rgba(0,0,0,0.25) 7px)`,
          boxShadow: `0 0 10px ${color}`,
        }}
      />
    </div>
  );
}

function Kicker({ children, color = C.cyan }: { children: React.ReactNode; color?: string }) {
  return (
    <span
      className="inline-block text-[10px] font-bold uppercase tracking-[0.32em]"
      style={{ ...hud, color, textShadow: `0 0 8px ${color}66` }}
    >
      {children}
    </span>
  );
}

function Title({ children, glow = C.magenta }: { children: React.ReactNode; glow?: string }) {
  return (
    <h1
      className="mt-2 text-[26px] font-bold uppercase leading-[1] tracking-[0.02em] sm:text-[32px]"
      style={{ ...hud, color: C.text, textShadow: `0 0 12px ${glow}55, 2px 2px 0 rgba(0,0,0,0.6)` }}
    >
      {children}
    </h1>
  );
}

function Panel({
  children,
  className = "",
  glow,
}: {
  children: React.ReactNode;
  className?: string;
  glow?: string;
}) {
  return (
    <div
      className={className}
      style={{
        background: C.panel,
        border: `2px solid ${glow ?? C.line}`,
        boxShadow: glow ? `${PIXEL}, 0 0 16px ${glow}44` : PIXEL,
      }}
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
      className="inline-flex items-center gap-1.5 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.1em]"
      style={{
        ...hud,
        color: m.color,
        background: "rgba(0,0,0,0.4)",
        border: `2px solid ${m.color}`,
      }}
    >
      <Icon size={12} strokeWidth={2.6} aria-hidden="true" />
      {m.label}
    </span>
  );
}

// HUD-sparkline, hoekige (pixel) lijn.
function Spark({ data, color = C.cyan }: { data: number[]; color?: string }) {
  const w = 92;
  const h = 26;
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
  const last = pts[pts.length - 1]!;
  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} aria-hidden="true">
      <path
        d={line}
        fill="none"
        stroke={color}
        strokeWidth="2"
        strokeLinejoin="miter"
        style={{ filter: `drop-shadow(0 0 3px ${color})` }}
      />
      <rect x={last[0] - 2} y={last[1] - 2} width="4" height="4" fill={color} />
    </svg>
  );
}

// Score-teller met tabulaire cijfers, arcade-stijl.
function ScoreCoin({ value, size = 46 }: { value: number; size?: number }) {
  const strong = value >= 90;
  const color = strong ? C.magenta : C.cyan;
  return (
    <span
      className="relative flex shrink-0 flex-col items-center justify-center"
      style={{
        width: size,
        height: size,
        background: "rgba(0,0,0,0.4)",
        border: `2px solid ${color}`,
        boxShadow: `0 0 10px ${color}55`,
      }}
      aria-hidden="true"
    >
      <span className="text-[15px] tabular-nums leading-none" style={{ ...score, color }}>
        {value}
      </span>
      <span
        className="text-[7px] font-bold uppercase tracking-[0.14em]"
        style={{ ...hud, color: C.faint }}
      >
        pts
      </span>
    </span>
  );
}

/* ---------- Hoofdcomponent ---------- */

export function Concept77() {
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
        ...hud,
        color: C.text,
        background: `radial-gradient(120% 90% at 50% 0%, ${C.bgAlt}, ${C.bg} 72%)`,
      }}
    >
      <Glow />
      <Scanlines />
      <div className="relative flex min-h-[680px] flex-col md:flex-row">
        {/* Zijbalk — HUD-menu */}
        <aside
          className="shrink-0 md:w-[236px]"
          style={{ borderRight: `2px solid ${C.line}`, background: "rgba(0,0,0,0.3)" }}
        >
          <div className="flex h-full flex-col">
            <div className="p-4" style={{ borderBottom: `2px solid ${C.line}` }}>
              <div className="flex items-center gap-2.5">
                <span
                  className="flex h-10 w-10 shrink-0 items-center justify-center"
                  style={{ background: C.magenta, boxShadow: `0 0 14px ${C.magenta}` }}
                  aria-hidden="true"
                >
                  <Gamepad2 size={20} strokeWidth={2.2} color={C.bg} />
                </span>
                <div className="leading-tight">
                  <div
                    className="text-[15px] font-bold uppercase tracking-[0.08em]"
                    style={{ color: C.text, textShadow: `0 0 8px ${C.magenta}66` }}
                  >
                    Arcade
                  </div>
                  <div
                    className="text-[8px] font-bold uppercase tracking-[0.18em]"
                    style={{ color: C.cyan }}
                  >
                    ZZP · zorg-quest
                  </div>
                </div>
              </div>
              <div className="mt-3">
                <div className="flex items-center justify-between text-[8.5px] font-bold uppercase tracking-[0.1em]">
                  <span style={{ color: C.faint }}>Level 7 · XP</span>
                  <span style={{ ...score, color: C.cyan }}>2410</span>
                </div>
                <div className="mt-1">
                  <PowerBar value={72} color={C.cyan} />
                </div>
              </div>
            </div>

            <nav
              className="flex flex-row gap-1 overflow-x-auto p-2 md:flex-1 md:flex-col"
              aria-label="Hoofdnavigatie"
            >
              {SCREENS.map((s, idx) => {
                const on = s.key === screen;
                return (
                  <button
                    key={s.key}
                    onClick={() => setScreen(s.key)}
                    aria-current={on ? "page" : undefined}
                    className="flex shrink-0 items-center gap-2.5 px-3 py-2.5 text-left text-[12px] font-bold uppercase tracking-[0.08em] transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#3df0e0] md:w-full"
                    style={{
                      color: on ? C.bg : C.muted,
                      background: on ? C.cyan : "transparent",
                      boxShadow: on ? `0 0 12px ${C.cyan}66` : "none",
                    }}
                  >
                    <span
                      className="text-[9px] tabular-nums"
                      style={{ ...score, color: on ? C.bg : C.faint }}
                    >
                      {String(idx + 1).padStart(2, "0")}
                    </span>
                    {s.label}
                  </button>
                );
              })}
            </nav>

            <div
              className="hidden items-center gap-2.5 p-4 md:flex"
              style={{ borderTop: `2px solid ${C.line}` }}
            >
              <span
                className="flex h-9 w-9 shrink-0 items-center justify-center text-[11px] font-bold"
                style={{ ...score, color: C.bg, background: C.cyan }}
                aria-hidden="true"
              >
                {PROFIEL.initialen}
              </span>
              <div className="min-w-0">
                <div
                  className="truncate text-[12px] font-bold uppercase tracking-[0.04em]"
                  style={{ color: C.text }}
                >
                  {PROFIEL.naam}
                </div>
                <div
                  className="flex items-center gap-1 text-[9px] font-bold uppercase tracking-[0.1em]"
                  style={{ color: C.green }}
                >
                  <ShieldCheck size={11} strokeWidth={2.6} aria-hidden="true" /> {PROFIEL.trust}
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
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    const t = window.setTimeout(() => setLoading(false), 650);
    return () => window.clearTimeout(t);
  }, []);

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <Kicker>Player 1 · ready</Kicker>
          <Title>Hallo, {PROFIEL.naam.split(" ")[0]}</Title>
          <p className="mt-2 text-[12.5px]" style={{ color: C.muted }}>
            {PROFIEL.rol} · {PROFIEL.plaats}
          </p>
        </div>
        <div
          className="flex items-center gap-2 px-3.5 py-2 text-[10px] font-bold uppercase tracking-[0.1em]"
          style={{
            color: C.yellow,
            background: "rgba(0,0,0,0.4)",
            border: `2px solid ${C.yellow}`,
          }}
        >
          <Trophy size={14} strokeWidth={2.4} aria-hidden="true" /> Highscore · 92%
        </div>
      </header>

      {warn && (
        <Panel glow={C.magenta} className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center">
          <span
            className="flex h-10 w-10 shrink-0 items-center justify-center self-start"
            style={{ background: "rgba(0,0,0,0.4)", border: `2px solid ${C.magenta}` }}
          >
            <AlertTriangle size={18} strokeWidth={2.4} color={C.magenta} aria-hidden="true" />
          </span>
          <p className="text-[12.5px] leading-snug" role="alert">
            <span className="font-bold uppercase tracking-[0.04em]" style={{ color: C.magenta }}>
              Missie —{" "}
            </span>
            <span style={{ color: C.text }}>{warn.titel}. </span>
            <span style={{ color: C.muted }}>{warn.detail}</span>
          </p>
          <button
            onClick={() => onGo("verificatie")}
            className="ml-auto inline-flex shrink-0 items-center gap-1.5 px-3.5 py-2 text-[10.5px] font-bold uppercase tracking-[0.08em] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#ff3d7f]"
            style={{ color: C.bg, background: C.magenta, boxShadow: `0 0 12px ${C.magenta}66` }}
          >
            {warn.cta} <ArrowRight size={13} strokeWidth={2.8} aria-hidden="true" />
          </button>
        </Panel>
      )}

      <div className="grid grid-cols-2 gap-3.5 lg:grid-cols-4">
        {KPIS.map((k) => (
          <Panel key={k.label} className="p-3.5">
            <div className="flex items-start justify-between gap-2">
              <p
                className="text-[9px] font-bold uppercase leading-tight tracking-[0.1em]"
                style={{ color: C.faint }}
              >
                {k.label}
              </p>
              <span
                className="inline-flex items-center gap-0.5 text-[10px] font-bold tabular-nums"
                style={{ ...score, color: k.up ? C.green : C.magenta }}
              >
                {k.up ? (
                  <ArrowUpRight size={11} strokeWidth={2.8} aria-hidden="true" />
                ) : (
                  <ArrowDownRight size={11} strokeWidth={2.8} aria-hidden="true" />
                )}
                {k.trend}
              </span>
            </div>
            <p
              className="mt-2.5 text-[23px] tabular-nums leading-none"
              style={{ ...score, color: C.text }}
            >
              {k.value}
            </p>
            <div className="mt-2">
              <Spark data={k.spark} color={k.up ? C.cyan : C.magenta} />
            </div>
          </Panel>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
        <Panel className="lg:col-span-2">
          <div
            className="flex items-center justify-between p-4"
            style={{ borderBottom: `2px solid ${C.lineSoft}` }}
          >
            <h3
              className="flex items-center gap-2 text-[14px] font-bold uppercase tracking-[0.08em]"
              style={{ color: C.text }}
            >
              <Zap size={15} strokeWidth={2.4} color={C.cyan} aria-hidden="true" /> Beste matches
            </h3>
            <button
              onClick={() => onGo("marktplaats")}
              className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-[0.1em] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#3df0e0]"
              style={{ color: C.cyan }}
            >
              Alles <ArrowRight size={12} strokeWidth={2.8} aria-hidden="true" />
            </button>
          </div>
          {loading ? (
            <div className="space-y-2 p-3" role="status" aria-live="polite">
              <span className="sr-only">Matches worden geladen…</span>
              {[0, 1, 2].map((i) => (
                <div
                  key={i}
                  className="flex items-center gap-3 p-3"
                  style={{ background: "rgba(0,0,0,0.3)" }}
                >
                  <span
                    className="h-11 w-11 shrink-0 animate-pulse"
                    style={{ background: C.panelHi }}
                  />
                  <div className="flex-1 space-y-2">
                    <span
                      className="block h-3 w-2/3 animate-pulse"
                      style={{ background: C.panelHi }}
                    />
                    <span
                      className="block h-2.5 w-1/2 animate-pulse"
                      style={{ background: C.panelHi }}
                    />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <ul className="divide-y" style={{ borderColor: C.lineSoft }}>
              {OPDRACHTEN.map((o) => (
                <li key={o.id} style={{ borderTop: `1px solid ${C.lineSoft}` }}>
                  <button
                    onClick={() => onOpen(o.id)}
                    className="flex w-full items-center gap-3 p-3 text-left transition-colors hover:bg-[#26214a] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#3df0e0]"
                  >
                    <ScoreCoin value={o.match} />
                    <span className="min-w-0 flex-1">
                      <span
                        className="block truncate text-[13.5px] font-bold"
                        style={{ color: C.text }}
                      >
                        {o.titel}
                      </span>
                      <span className="mt-1 block">
                        <PowerBar value={o.match} color={o.match >= 90 ? C.magenta : C.cyan} />
                      </span>
                      <span className="mt-1 block truncate text-[11px]" style={{ color: C.muted }}>
                        {o.opdrachtgever} · {o.plaats} · {o.tarief}
                      </span>
                    </span>
                    <ArrowUpRight size={15} strokeWidth={2.4} color={C.faint} aria-hidden="true" />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </Panel>

        <Panel>
          <div className="p-4" style={{ borderBottom: `2px solid ${C.lineSoft}` }}>
            <h3
              className="text-[14px] font-bold uppercase tracking-[0.08em]"
              style={{ color: C.text }}
            >
              Achievements
            </h3>
          </div>
          <div className="divide-y" style={{ borderColor: C.lineSoft }}>
            {CREDENTIALS.map((c) => {
              const m = credMeta(c.status);
              const Icon = m.Icon;
              return (
                <div
                  key={c.naam}
                  className="flex items-center gap-2.5 px-3.5 py-2.5"
                  style={{ borderTop: `1px solid ${C.lineSoft}` }}
                >
                  <Icon size={15} strokeWidth={2.4} color={m.color} aria-hidden="true" />
                  <span
                    className="min-w-0 flex-1 truncate text-[12px] font-medium"
                    style={{ color: C.text }}
                  >
                    {c.naam}
                  </span>
                  <span
                    className="text-[8.5px] font-bold uppercase tracking-[0.08em]"
                    style={{ ...hud, color: m.color }}
                  >
                    {m.label}
                  </span>
                </div>
              );
            })}
          </div>
        </Panel>
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
    <div className="mx-auto max-w-5xl space-y-5">
      <div>
        <Kicker>Select stage</Kicker>
        <Title glow={C.cyan}>Open opdrachten</Title>
      </div>

      <div
        className="flex items-center gap-3 px-4 py-2.5"
        style={{ background: C.panel, border: `2px solid ${C.line}` }}
      >
        <Search size={16} strokeWidth={2.4} color={C.cyan} aria-hidden="true" />
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Zoek een stage…"
          aria-label="Opdrachten zoeken"
          className="w-full bg-transparent text-[13px] outline-none placeholder:text-[#726d9c]"
          style={{ color: C.text }}
        />
        <span className="shrink-0 text-[11px] tabular-nums" style={{ ...score, color: C.faint }}>
          {filtered.length}/{OPDRACHTEN.length}
        </span>
      </div>

      {filtered.length === 0 ? (
        <Panel className="p-12 text-center">
          <span
            className="mx-auto flex h-14 w-14 items-center justify-center"
            style={{ background: "rgba(0,0,0,0.4)", border: `2px solid ${C.cyan}` }}
            aria-hidden="true"
          >
            <Search size={24} strokeWidth={2.2} color={C.cyan} />
          </span>
          <p
            className="mt-4 text-[19px] font-bold uppercase tracking-[0.06em]"
            style={{ color: C.text }}
          >
            No stage found
          </p>
          <p className="mx-auto mt-2 max-w-xs text-[12px]" style={{ color: C.muted }}>
            Geen opdracht past bij &quot;{q}&quot;. Verbreed je zoekopdracht.
          </p>
          <button
            onClick={() => setQ("")}
            className="mt-5 px-4 py-2 text-[11px] font-bold uppercase tracking-[0.08em] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#3df0e0]"
            style={{ color: C.bg, background: C.cyan }}
          >
            Reset zoekopdracht
          </button>
        </Panel>
      ) : (
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-[1.3fr_1fr]">
          <div className="space-y-3.5">
            {filtered.map((o) => {
              const on = sel?.id === o.id;
              const col = o.match >= 90 ? C.magenta : C.cyan;
              return (
                <button
                  key={o.id}
                  onClick={() => onSelect(o.id)}
                  aria-pressed={on}
                  className="w-full text-left transition-all hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#3df0e0]"
                  style={{
                    background: C.panel,
                    border: `2px solid ${on ? col : C.line}`,
                    boxShadow: on ? `${PIXEL}, 0 0 16px ${col}55` : PIXEL,
                  }}
                >
                  <div
                    className="flex items-center justify-between px-3.5 py-1.5 text-[9px] font-bold uppercase tracking-[0.1em]"
                    style={{
                      borderBottom: `2px solid ${on ? col : C.lineSoft}`,
                      background: "rgba(0,0,0,0.3)",
                    }}
                  >
                    <span style={{ ...score, color: C.muted }}>{o.id}</span>
                    <span style={{ color: on ? col : C.faint }}>{on ? "Selected" : "Stage"}</span>
                  </div>
                  <div className="p-3.5">
                    <div className="flex items-start gap-3.5">
                      <ScoreCoin value={o.match} size={50} />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-[14.5px] font-bold" style={{ color: C.text }}>
                          {o.titel}
                        </p>
                        <p
                          className="mt-0.5 flex items-center gap-1 truncate text-[11px]"
                          style={{ color: C.muted }}
                        >
                          <MapPin size={12} strokeWidth={2.4} aria-hidden="true" />{" "}
                          {o.opdrachtgever} · {o.plaats}
                        </p>
                        <div className="mt-2">
                          <PowerBar value={o.match} color={col} />
                        </div>
                      </div>
                    </div>
                    <div className="mt-2.5 flex flex-wrap gap-1.5">
                      {o.tags.map((t) => (
                        <span
                          key={t}
                          className="px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-[0.06em]"
                          style={{
                            ...hud,
                            color: C.muted,
                            background: "rgba(0,0,0,0.35)",
                            border: `1px solid ${C.lineSoft}`,
                          }}
                        >
                          {t}
                        </span>
                      ))}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>

          {sel && (
            <aside className="h-fit lg:sticky lg:top-4">
              <Panel glow={sel.match >= 90 ? C.magenta : C.cyan}>
                <div
                  className="flex items-center justify-between px-4 py-2 text-[10px] font-bold uppercase tracking-[0.1em]"
                  style={{ borderBottom: `2px solid ${C.lineSoft}` }}
                >
                  <span style={{ ...score, color: C.cyan }}>{sel.id}</span>
                  <span style={{ color: C.faint }}>Boss stage</span>
                </div>
                <div className="p-4">
                  <p className="text-[16px] font-bold leading-snug" style={{ color: C.text }}>
                    {sel.titel}
                  </p>
                  <p className="mt-1 text-[11.5px]" style={{ color: C.muted }}>
                    {sel.opdrachtgever} · {sel.plaats}
                  </p>
                  <div className="mt-4 grid grid-cols-2 gap-2">
                    {[
                      { l: "Reward", v: sel.tarief },
                      { l: "Duur", v: sel.uren },
                      { l: "Start", v: sel.start },
                      { l: "Power", v: `${sel.match}%` },
                    ].map((m) => (
                      <div
                        key={m.l}
                        className="p-2.5"
                        style={{
                          background: "rgba(0,0,0,0.35)",
                          border: `1px solid ${C.lineSoft}`,
                        }}
                      >
                        <dt
                          className="text-[8.5px] font-bold uppercase tracking-[0.1em]"
                          style={{ color: C.faint }}
                        >
                          {m.l}
                        </dt>
                        <dd
                          className="mt-0.5 text-[13px] tabular-nums"
                          style={{ ...score, color: C.text }}
                        >
                          {m.v}
                        </dd>
                      </div>
                    ))}
                  </div>
                  <button
                    onClick={() => onOpen(sel.id)}
                    className="mt-4 flex w-full items-center justify-center gap-1.5 px-4 py-2.5 text-[11px] font-bold uppercase tracking-[0.08em] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#3df0e0]"
                    style={{ color: C.bg, background: C.cyan, boxShadow: `0 0 12px ${C.cyan}66` }}
                  >
                    Start opdracht <ArrowRight size={13} strokeWidth={2.8} aria-hidden="true" />
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
  const col = opdracht.match >= 90 ? C.magenta : C.cyan;

  return (
    <div className="mx-auto max-w-4xl space-y-5">
      <Panel glow={col}>
        <div
          className="flex items-center justify-between px-4 py-2 text-[10px] font-bold uppercase tracking-[0.12em]"
          style={{ borderBottom: `2px solid ${C.lineSoft}`, background: "rgba(0,0,0,0.3)" }}
        >
          <span style={{ ...score, color: C.cyan }}>{opdracht.id}</span>
          <span style={{ color: C.faint }}>Mission briefing</span>
        </div>
        <div className="flex flex-col gap-4 p-5 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0 flex-1">
            <Kicker color={col}>{opdracht.opdrachtgever}</Kicker>
            <Title glow={col}>{opdracht.titel}</Title>
            <p className="mt-2 text-[11.5px]" style={{ color: C.muted }}>
              {opdracht.plaats} · {opdracht.uren}
            </p>
            <div className="mt-3">
              <div className="mb-1 flex items-center justify-between text-[9px] font-bold uppercase tracking-[0.1em]">
                <span style={{ color: C.faint }}>Power</span>
                <span style={{ ...score, color: col }}>{opdracht.match}%</span>
              </div>
              <PowerBar value={opdracht.match} color={col} animate />
            </div>
            <div className="mt-3 flex flex-wrap gap-1.5">
              {opdracht.tags.map((t) => (
                <span
                  key={t}
                  className="px-2 py-0.5 text-[9px] font-bold uppercase tracking-[0.06em]"
                  style={{
                    ...hud,
                    color: C.muted,
                    background: "rgba(0,0,0,0.35)",
                    border: `1px solid ${C.lineSoft}`,
                  }}
                >
                  {t}
                </span>
              ))}
            </div>
          </div>
          <ScoreCoin value={opdracht.match} size={68} />
        </div>
        <div className="p-4" style={{ borderTop: `2px solid ${C.lineSoft}` }}>
          <button
            onClick={react}
            disabled={state !== "idle"}
            aria-live="polite"
            className="flex w-full items-center justify-center gap-2 px-5 py-3 text-[12px] font-bold uppercase tracking-[0.1em] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#3df0e0] disabled:opacity-90"
            style={{
              color: C.bg,
              background: state === "sent" ? C.green : C.magenta,
              boxShadow: `0 0 14px ${state === "sent" ? C.green : C.magenta}66`,
            }}
          >
            {state === "idle" && (
              <>
                <Zap size={15} strokeWidth={2.6} aria-hidden="true" /> Start missie
              </>
            )}
            {state === "sending" && "Loading…"}
            {state === "sent" && (
              <>
                <Check size={15} strokeWidth={3} aria-hidden="true" /> Missie geaccepteerd
              </>
            )}
          </button>
        </div>
      </Panel>

      <div className="grid grid-cols-2 gap-3.5 sm:grid-cols-4">
        {[
          { l: "Reward", v: opdracht.tarief },
          { l: "Duur", v: opdracht.uren },
          { l: "Start", v: opdracht.start },
          { l: "Power", v: `${opdracht.match}%` },
        ].map((m) => (
          <Panel key={m.l} className="p-4">
            <p
              className="text-[8.5px] font-bold uppercase tracking-[0.1em]"
              style={{ color: C.faint }}
            >
              {m.l}
            </p>
            <p className="mt-1.5 text-[18px] tabular-nums" style={{ ...score, color: C.text }}>
              {m.v}
            </p>
          </Panel>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
        <Panel>
          <div
            className="flex items-center gap-2 p-4"
            style={{ borderBottom: `2px solid ${C.lineSoft}` }}
          >
            <Check size={14} strokeWidth={3} color={C.green} aria-hidden="true" />
            <h3
              className="text-[12px] font-bold uppercase tracking-[0.1em]"
              style={{ color: C.green }}
            >
              Power-ups
            </h3>
          </div>
          <ul className="p-4">
            {opdracht.redenen.plus.map((r) => (
              <li
                key={r}
                className="flex items-start gap-2.5 py-1.5 text-[12.5px]"
                style={{ color: C.text }}
              >
                <Check
                  size={15}
                  strokeWidth={2.8}
                  color={C.green}
                  className="mt-0.5 shrink-0"
                  aria-hidden="true"
                />
                {r}
              </li>
            ))}
          </ul>
        </Panel>
        <Panel>
          <div
            className="flex items-center gap-2 p-4"
            style={{ borderBottom: `2px solid ${C.lineSoft}` }}
          >
            <AlertTriangle size={14} strokeWidth={2.6} color={C.yellow} aria-hidden="true" />
            <h3
              className="text-[12px] font-bold uppercase tracking-[0.1em]"
              style={{ color: C.yellow }}
            >
              Obstakels
            </h3>
          </div>
          <ul className="p-4">
            {opdracht.redenen.min.map((r) => (
              <li
                key={r}
                className="flex items-start gap-2.5 py-1.5 text-[12.5px]"
                style={{ color: C.muted }}
              >
                <AlertTriangle
                  size={15}
                  strokeWidth={2.6}
                  color={C.yellow}
                  className="mt-0.5 shrink-0"
                  aria-hidden="true"
                />
                {r}
              </li>
            ))}
          </ul>
        </Panel>
      </div>
    </div>
  );
}

/* ---------- Verificatie ---------- */

function Verificatie() {
  const verified = CREDENTIALS.filter((c) => c.status === "VERIFIED").length;
  const total = CREDENTIALS.length;
  const pct = Math.round((verified / total) * 100);
  const stats = [
    { l: "Unlocked", v: `${verified}/${total}`, color: C.green, Icon: ShieldCheck },
    { l: "Low power", v: "1", color: C.yellow, Icon: AlertTriangle },
    { l: "Laden", v: "1", color: C.cyan, Icon: Clock },
  ];

  return (
    <div className="mx-auto max-w-4xl space-y-5">
      <div>
        <Kicker color={C.green}>Skill tree</Kicker>
        <Title glow={C.green}>Certificaten</Title>
        <p className="mt-2 text-[12.5px]" style={{ color: C.muted }}>
          Je bewijsstukken worden veilig en privé bewaard.
        </p>
      </div>

      <Panel glow={C.green} className="p-4">
        <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-[0.1em]">
          <span style={{ color: C.muted }}>Verificatie-voortgang</span>
          <span style={{ ...score, color: C.green }}>{pct}%</span>
        </div>
        <div className="mt-2">
          <PowerBar value={pct} color={C.green} animate />
        </div>
      </Panel>

      <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-3">
        {stats.map((s) => {
          const Icon = s.Icon;
          return (
            <Panel key={s.l} className="flex items-center justify-between p-4">
              <div>
                <p
                  className="text-[9px] font-bold uppercase tracking-[0.1em]"
                  style={{ color: C.faint }}
                >
                  {s.l}
                </p>
                <p className="mt-1.5 text-[24px] tabular-nums" style={{ ...score, color: C.text }}>
                  {s.v}
                </p>
              </div>
              <span
                className="flex h-11 w-11 items-center justify-center"
                style={{ background: "rgba(0,0,0,0.4)", border: `2px solid ${s.color}` }}
              >
                <Icon size={20} strokeWidth={2.2} color={s.color} aria-hidden="true" />
              </span>
            </Panel>
          );
        })}
      </div>

      <Panel>
        <div className="divide-y" style={{ borderColor: C.lineSoft }}>
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
                  className="flex h-11 w-11 shrink-0 items-center justify-center"
                  style={{ background: "rgba(0,0,0,0.4)", border: `2px solid ${m.color}` }}
                >
                  <Icon size={20} strokeWidth={2.2} color={m.color} aria-hidden="true" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-[13.5px] font-bold" style={{ color: C.text }}>
                    {c.naam}
                  </p>
                  <p className="text-[11px]" style={{ color: C.muted }}>
                    {c.detail}
                  </p>
                </div>
                <StatusBadge status={c.status} />
              </div>
            );
          })}
        </div>
      </Panel>
    </div>
  );
}

/* ---------- Acties ---------- */

function Acties({ onGo }: { onGo: (k: ScreenKey) => void }) {
  return (
    <div className="mx-auto max-w-3xl space-y-5">
      <div>
        <Kicker color={C.yellow}>Quest log</Kicker>
        <Title glow={C.yellow}>Volgende acties</Title>
        <p className="mt-2 text-[12.5px]" style={{ color: C.muted }}>
          Op volgorde van urgentie — begin bovenaan.
        </p>
      </div>

      <div className="space-y-3.5">
        {ACTIES.map((a, i) => {
          const warn = a.urgentie === "warning";
          const color = warn ? C.magenta : C.cyan;
          return (
            <Panel key={a.titel} glow={warn ? C.magenta : undefined} className="flex items-stretch">
              <div
                className="flex w-14 shrink-0 flex-col items-center justify-center gap-1.5"
                style={{ background: "rgba(0,0,0,0.35)", borderRight: `2px solid ${color}` }}
              >
                <span className="text-[16px] tabular-nums" style={{ ...score, color }}>
                  {String(i + 1).padStart(2, "0")}
                </span>
                {warn ? (
                  <AlertTriangle size={15} strokeWidth={2.6} color={color} aria-hidden="true" />
                ) : (
                  <Zap size={15} strokeWidth={2.4} color={color} aria-hidden="true" />
                )}
              </div>
              <div className="min-w-0 flex-1 p-4">
                <span
                  className="text-[9px] font-bold uppercase tracking-[0.12em]"
                  style={{ color }}
                >
                  {warn ? "Missie · urgent" : "Quest"}
                </span>
                <p className="mt-1 text-[14px] font-bold" style={{ color: C.text }}>
                  {a.titel}
                </p>
                <p className="mt-0.5 text-[12px]" style={{ color: C.muted }}>
                  {a.detail}
                </p>
              </div>
              <button
                onClick={() => onGo(warn ? "verificatie" : "marktplaats")}
                className="m-3 shrink-0 self-center px-3.5 py-2 text-[10px] font-bold uppercase tracking-[0.08em] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#3df0e0]"
                style={{
                  color: warn ? C.bg : C.text,
                  background: warn ? C.magenta : "transparent",
                  border: `2px solid ${warn ? C.magenta : C.line}`,
                }}
              >
                {a.cta}
              </button>
            </Panel>
          );
        })}
      </div>

      <div
        className="flex items-center gap-3 p-4"
        style={{ background: "rgba(61,255,176,0.08)", border: `2px solid ${C.green}` }}
      >
        <Check size={18} strokeWidth={2.6} color={C.green} aria-hidden="true" />
        <p className="text-[12px]" style={{ color: C.muted }}>
          Quest cleared. Nieuwe acties verschijnen hier vanzelf.
        </p>
      </div>
    </div>
  );
}

/* ---------- Facturen ---------- */

function Facturen() {
  const statusColor: Record<string, string> = {
    Betaald: C.green,
    Openstaand: C.magenta,
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
    <div className="mx-auto max-w-4xl space-y-5">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <Kicker color={C.magenta}>Coin counter</Kicker>
          <Title>Facturen</Title>
        </div>
        <button
          className="inline-flex shrink-0 items-center gap-2 px-4 py-2.5 text-[11px] font-bold uppercase tracking-[0.08em] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#ff3d7f]"
          style={{ color: C.bg, background: C.magenta, boxShadow: `0 0 12px ${C.magenta}66` }}
        >
          <Plus size={14} strokeWidth={2.8} aria-hidden="true" /> Nieuwe factuur
        </button>
      </div>

      <div className="grid grid-cols-2 gap-3.5">
        <Panel className="p-4">
          <p className="text-[9px] font-bold uppercase tracking-[0.1em]" style={{ color: C.faint }}>
            Coins verdiend
          </p>
          <p className="mt-2 text-[22px] tabular-nums" style={{ ...score, color: C.green }}>
            € {betaald.toLocaleString("nl-NL")}
          </p>
        </Panel>
        <Panel className="p-4">
          <p className="text-[9px] font-bold uppercase tracking-[0.1em]" style={{ color: C.faint }}>
            Openstaand
          </p>
          <p className="mt-2 text-[22px] tabular-nums" style={{ ...score, color: C.magenta }}>
            € {open.toLocaleString("nl-NL")}
          </p>
        </Panel>
      </div>

      <Panel className="overflow-x-auto">
        <table className="w-full text-left">
          <thead>
            <tr
              className="text-[9px] font-bold uppercase tracking-[0.1em]"
              style={{
                color: C.faint,
                borderBottom: `2px solid ${C.line}`,
                background: "rgba(0,0,0,0.3)",
              }}
            >
              <th className="p-3.5">Nummer</th>
              <th className="p-3.5">Klant</th>
              <th className="hidden p-3.5 sm:table-cell">Datum</th>
              <th className="p-3.5 text-right">Coins</th>
              <th className="p-3.5 text-right">Status</th>
            </tr>
          </thead>
          <tbody>
            {FACTUREN.map((f, i) => {
              const color = statusColor[f.status] ?? C.faint;
              return (
                <tr key={f.nr} style={{ borderTop: i === 0 ? "none" : `1px solid ${C.lineSoft}` }}>
                  <td
                    className="p-3.5 text-[11.5px] tabular-nums"
                    style={{ ...score, color: C.text }}
                  >
                    {f.nr}
                  </td>
                  <td className="p-3.5 text-[12.5px] font-medium" style={{ color: C.text }}>
                    {f.klant}
                  </td>
                  <td
                    className="hidden p-3.5 text-[11.5px] tabular-nums sm:table-cell"
                    style={{ ...score, color: C.muted }}
                  >
                    {f.datum}
                  </td>
                  <td
                    className="p-3.5 text-right text-[13px] tabular-nums"
                    style={{ ...score, color: C.text }}
                  >
                    {f.bedrag}
                  </td>
                  <td className="p-3.5">
                    <div className="flex items-center justify-end">
                      <span
                        className="px-2 py-0.5 text-[9px] font-bold uppercase tracking-[0.08em]"
                        style={{
                          ...hud,
                          color,
                          background: "rgba(0,0,0,0.4)",
                          border: `2px solid ${color}`,
                        }}
                      >
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
