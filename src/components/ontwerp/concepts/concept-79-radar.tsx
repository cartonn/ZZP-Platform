"use client";

// Concept 79 — "Radar" · sonar / radarscope.
// Diep radar-groen-zwart scherm met lichtgroene fosfor-tekst en een draaiende sweep-lijn over
// concentrische afstandsringen. "Blips" zijn matches: afstand tot het centrum = reistijd/afstand,
// hoek = richting. De sweep licht elke blip op zodra de arm hem passeert (deterministische CSS,
// geen random). Oscilloscoop-hairlines, mono-cijfers, subtiele phosphor-afterglow.
// Palet: scherm #06120c, fosfor #c8f0d4, accent #37e07a, gedempt #6f9c82, waarschuwing #ffcf5c / #ff7a6b.
// Fonts: --font-lab-geist-mono (scope/cijfers) + --font-lab-geist (body). Onderscheidend van kaart
// (Atlas) en handelsterminal (Beurs): dit is een sonar-scope.

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
  Radar,
  Radio,
  RotateCw,
  Navigation,
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
  screen: "#06120c",
  screenAlt: "#081b10",
  panel: "rgba(9,28,18,0.72)",
  panelSolid: "#0a2013",
  phos: "#c8f0d4",
  accent: "#37e07a",
  muted: "#6f9c82",
  faint: "#4a7460",
  warn: "#ffcf5c",
  alert: "#ff7a6b",
  line: "rgba(55,224,122,0.16)",
  lineSoft: "rgba(55,224,122,0.08)",
  grid: "rgba(55,224,122,0.10)",
};

const mono = { fontFamily: "var(--font-lab-geist-mono)" };
const body = { fontFamily: "var(--font-lab-geist)" };

const GLOW = "inset 0 0 0 1px rgba(55,224,122,0.10), 0 12px 40px -24px rgba(0,0,0,0.8)";
const SWEEP_PERIOD = 5; // seconden per volledige rotatie

/* ---------- Scope-geometrie (deterministisch) ---------- */

// Vaste blip-posities per opdracht: hoek = richting, radiusfractie = reistijd/afstand.
const BLIPS: { angle: number; r: number; reistijd: string }[] = [
  { angle: 52, r: 0.34, reistijd: "12 min" },
  { angle: 168, r: 0.62, reistijd: "38 min" },
  { angle: 286, r: 0.5, reistijd: "21 min" },
];

function blipPoint(angleDeg: number, rFrac: number, cx = 100, cy = 100, R = 90) {
  const rad = (angleDeg * Math.PI) / 180;
  return {
    x: cx + Math.cos(rad) * rFrac * R,
    y: cy + Math.sin(rad) * rFrac * R,
  };
}

/* ---------- Status → betekenis (label + icoon + kleur, nooit kleur-alleen) ---------- */

type CredMeta = { label: string; color: string; Icon: typeof ShieldCheck };

function credMeta(s: CredStatus): CredMeta {
  switch (s) {
    case "VERIFIED":
      return { label: "Vergrendeld", color: C.accent, Icon: ShieldCheck };
    case "SUBMITTED":
      return { label: "In scan", color: C.warn, Icon: Clock };
    case "EXPIRING":
      return { label: "Signaal zwak", color: C.warn, Icon: AlertTriangle };
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
      className="inline-flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.28em]"
      style={{ ...mono, color: C.accent }}
    >
      <span
        className="h-1.5 w-1.5 rounded-full"
        style={{ background: C.accent }}
        aria-hidden="true"
      />
      {children}
    </span>
  );
}

function Title({ children }: { children: React.ReactNode }) {
  return (
    <h1
      className="mt-2 text-[26px] leading-[1.05] tracking-[-0.01em] sm:text-[32px]"
      style={{ ...body, color: C.phos, textShadow: "0 0 24px rgba(55,224,122,0.25)" }}
    >
      {children}
    </h1>
  );
}

function Panel({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <div
      className={`rounded-xl backdrop-blur-sm ${className}`}
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
      className="inline-flex items-center gap-1.5 rounded-md px-2.5 py-1 text-[11px] font-semibold"
      style={{
        ...mono,
        color: m.color,
        background: "rgba(0,0,0,0.35)",
        border: `1px solid ${m.color}55`,
      }}
    >
      <Icon size={13} strokeWidth={2.4} aria-hidden="true" />
      {m.label}
    </span>
  );
}

// Oscilloscoop-sparkline: dunne fosforlijn met glow.
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
  const last = pts[pts.length - 1];
  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} aria-hidden="true">
      <path
        d={line}
        fill="none"
        stroke={color}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        style={{ filter: `drop-shadow(0 0 3px ${color}88)` }}
      />
      {last && <circle cx={last[0]} cy={last[1]} r="2.1" fill={color} />}
    </svg>
  );
}

// Score-uitlezing (mono-cijfer met ring-arc).
function ScoreReadout({ value, size = 48 }: { value: number; size?: number }) {
  const r = size / 2 - 3;
  const circ = 2 * Math.PI * r;
  const strong = value >= 90;
  const color = strong ? C.accent : C.phos;
  return (
    <span
      className="relative flex shrink-0 items-center justify-center"
      style={{ width: size, height: size }}
      aria-hidden="true"
    >
      <svg width={size} height={size} className="absolute inset-0 -rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={C.lineSoft} strokeWidth="2" />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={color}
          strokeWidth="2"
          strokeLinecap="round"
          strokeDasharray={circ}
          strokeDashoffset={circ * (1 - value / 100)}
          style={{ filter: `drop-shadow(0 0 4px ${color}88)` }}
        />
      </svg>
      <span className="text-[13px] font-semibold tabular-nums" style={{ ...mono, color }}>
        {value}
      </span>
    </span>
  );
}

/* ---------- Radarscope (het handtekening-element) ---------- */

function RadarScope({ onSelect, activeId }: { onSelect: (id: string) => void; activeId?: string }) {
  const rings = [0.25, 0.5, 0.75, 1];
  return (
    <div className="relative mx-auto aspect-square w-full max-w-[340px]">
      <svg
        viewBox="0 0 200 200"
        className="h-full w-full"
        role="img"
        aria-label="Radarscope met matches"
      >
        <defs>
          <radialGradient id="radar79-glow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="rgba(55,224,122,0.14)" />
            <stop offset="70%" stopColor="rgba(55,224,122,0.03)" />
            <stop offset="100%" stopColor="rgba(55,224,122,0)" />
          </radialGradient>
          <linearGradient id="radar79-arm" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="rgba(55,224,122,0)" />
            <stop offset="100%" stopColor="rgba(55,224,122,0.55)" />
          </linearGradient>
        </defs>

        <circle cx="100" cy="100" r="92" fill="url(#radar79-glow)" />

        {/* Afstandsringen */}
        {rings.map((rf) => (
          <circle
            key={rf}
            cx="100"
            cy="100"
            r={90 * rf}
            fill="none"
            stroke={C.grid}
            strokeWidth="0.7"
          />
        ))}
        {/* Hairlines */}
        <line x1="8" y1="100" x2="192" y2="100" stroke={C.grid} strokeWidth="0.6" />
        <line x1="100" y1="8" x2="100" y2="192" stroke={C.grid} strokeWidth="0.6" />
        <line x1="34" y1="34" x2="166" y2="166" stroke={C.lineSoft} strokeWidth="0.5" />
        <line x1="166" y1="34" x2="34" y2="166" stroke={C.lineSoft} strokeWidth="0.5" />

        {/* Draaiende sweep-arm */}
        <g
          style={{
            transformBox: "view-box",
            transformOrigin: "100px 100px",
            animation: `radar79-sweep ${SWEEP_PERIOD}s linear infinite`,
          }}
        >
          <path d="M100 100 L100 10 A90 90 0 0 1 168 42 Z" fill="url(#radar79-arm)" opacity="0.5" />
          <line
            x1="100"
            y1="100"
            x2="100"
            y2="10"
            stroke={C.accent}
            strokeWidth="1.2"
            style={{ filter: "drop-shadow(0 0 4px rgba(55,224,122,0.8))" }}
          />
        </g>

        {/* Blips = matches */}
        {OPDRACHTEN.map((o, i) => {
          const b = BLIPS[i] ?? BLIPS[0]!;
          const p = blipPoint(b.angle, b.r);
          const on = activeId === o.id;
          const delay = (b.angle / 360) * SWEEP_PERIOD;
          return (
            <g
              key={o.id}
              style={{ animation: `radar79-blip ${SWEEP_PERIOD}s linear ${delay}s infinite` }}
            >
              <circle
                cx={p.x}
                cy={p.y}
                r={on ? 7 : 5}
                fill="none"
                stroke={C.accent}
                strokeWidth="0.8"
                opacity="0.6"
              />
              <circle
                cx={p.x}
                cy={p.y}
                r={on ? 3.4 : 2.6}
                fill={C.accent}
                style={{ filter: "drop-shadow(0 0 5px rgba(55,224,122,0.9))" }}
              />
            </g>
          );
        })}
        <circle cx="100" cy="100" r="2.2" fill={C.phos} />
      </svg>

      {/* Klikbare blip-hotspots (toegankelijk) */}
      {OPDRACHTEN.map((o, i) => {
        const b = BLIPS[i] ?? BLIPS[0]!;
        const p = blipPoint(b.angle, b.r);
        const on = activeId === o.id;
        return (
          <button
            key={o.id}
            onClick={() => onSelect(o.id)}
            aria-label={`${o.titel} — match ${o.match}%, ${b.reistijd}`}
            className="group absolute -translate-x-1/2 -translate-y-1/2 rounded-full p-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#37e07a]"
            style={{ left: `${(p.x / 200) * 100}%`, top: `${(p.y / 200) * 100}%` }}
          >
            <span
              className="whitespace-nowrap rounded px-1.5 py-0.5 text-[9px] font-semibold tabular-nums opacity-0 transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100"
              style={{ ...mono, color: on ? C.accent : C.phos, background: "rgba(0,0,0,0.7)" }}
            >
              {o.match}% · {b.reistijd}
            </span>
          </button>
        );
      })}
    </div>
  );
}

/* ---------- Hoofdcomponent ---------- */

export function Concept79() {
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
        ...body,
        color: C.phos,
        background: `radial-gradient(120% 90% at 50% -10%, ${C.screenAlt}, ${C.screen} 65%)`,
      }}
    >
      {/* Deterministische keyframes voor sweep + blip-afterglow */}
      <style>{`
        @keyframes radar79-sweep { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        @keyframes radar79-blip {
          0% { opacity: 1; }
          10% { opacity: 0.95; }
          55% { opacity: 0.4; }
          100% { opacity: 0.35; }
        }
      `}</style>

      {/* Scanline-overlay */}
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.5]"
        aria-hidden="true"
        style={{
          background:
            "repeating-linear-gradient(0deg, rgba(0,0,0,0) 0px, rgba(0,0,0,0) 2px, rgba(0,0,0,0.16) 3px)",
        }}
      />

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
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg"
                style={{ background: "rgba(0,0,0,0.4)", border: `1px solid ${C.line}` }}
                aria-hidden="true"
              >
                <Radar size={19} strokeWidth={2} color={C.accent} />
              </span>
              <div className="leading-tight">
                <div className="text-[16px] font-semibold" style={{ ...mono, color: C.phos }}>
                  RADAR
                </div>
                <div
                  className="text-[9px] font-semibold uppercase tracking-[0.24em]"
                  style={{ color: C.faint }}
                >
                  ZZP · scope
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
                    className="relative flex shrink-0 items-center gap-2.5 rounded-lg px-3.5 py-2.5 text-left text-[13px] font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#37e07a] md:w-full"
                    style={{
                      ...mono,
                      color: on ? C.phos : C.muted,
                      background: on ? "rgba(55,224,122,0.1)" : "transparent",
                      border: on ? `1px solid ${C.line}` : "1px solid transparent",
                    }}
                  >
                    {on && (
                      <span
                        className="h-1.5 w-1.5 shrink-0 rounded-full"
                        style={{ background: C.accent, boxShadow: `0 0 6px ${C.accent}` }}
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
                style={{ ...mono, color: C.screen, background: C.accent }}
                aria-hidden="true"
              >
                {PROFIEL.initialen}
              </span>
              <div className="min-w-0">
                <div className="truncate text-[13px] font-semibold" style={{ color: C.phos }}>
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
          <Kicker>Scope actief</Kicker>
          <Title>Goedemorgen, {PROFIEL.naam.split(" ")[0]}</Title>
          <p className="mt-2 text-[13px]" style={{ color: C.muted }}>
            {PROFIEL.rol} · {PROFIEL.plaats}
          </p>
        </div>
        <div
          className="flex items-center gap-2 rounded-lg px-3.5 py-2 text-[11px] font-semibold"
          style={{
            ...mono,
            color: C.accent,
            background: "rgba(0,0,0,0.3)",
            border: `1px solid ${C.line}`,
          }}
        >
          <Radio size={13} strokeWidth={2.2} aria-hidden="true" /> {OPDRACHTEN.length} contacten
        </div>
      </header>

      {warn && (
        <div
          className="flex flex-col gap-3 rounded-xl p-4 sm:flex-row sm:items-center"
          style={{
            border: `1px solid ${C.warn}55`,
            background: "rgba(255,207,92,0.08)",
            boxShadow: GLOW,
          }}
          role="alert"
        >
          <span
            className="flex h-10 w-10 shrink-0 items-center justify-center self-start rounded-lg"
            style={{ background: "rgba(0,0,0,0.35)", border: `1px solid ${C.warn}55` }}
          >
            <AlertTriangle size={18} strokeWidth={2.2} color={C.warn} aria-hidden="true" />
          </span>
          <p className="text-[13px] leading-snug" style={{ color: C.phos }}>
            <span className="font-semibold">{warn.titel}.</span>{" "}
            <span style={{ color: C.muted }}>{warn.detail}</span>
          </p>
          <button
            onClick={() => onGo("verificatie")}
            className="ml-auto inline-flex shrink-0 items-center gap-1.5 rounded-lg px-3.5 py-2 text-[12px] font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#37e07a]"
            style={{ color: C.screen, background: C.warn }}
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
            <p
              className="mt-3 text-[24px] tabular-nums leading-none"
              style={{ ...mono, color: C.phos }}
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
        {/* Scope */}
        <Panel className="p-5">
          <div className="mb-3 flex items-center justify-between">
            <h3
              className="flex items-center gap-2 text-[14px] font-semibold"
              style={{ color: C.phos }}
            >
              <Radar size={16} strokeWidth={2} color={C.accent} aria-hidden="true" /> Matches op de
              scope
            </h3>
            <span
              className="text-[10px] font-semibold uppercase tracking-[0.14em]"
              style={{ ...mono, color: C.faint }}
            >
              afstand = reistijd
            </span>
          </div>
          <RadarScope activeId={activeId} onSelect={onSelect} />
          <p className="mt-3 text-center text-[11px]" style={{ color: C.muted }}>
            Dichter bij het midden = korter reizen. Klik een blip om te openen.
          </p>
        </Panel>

        <div className="space-y-5">
          {/* Beste matches lijst */}
          <Panel>
            <div
              className="flex items-center justify-between p-4"
              style={{ borderBottom: `1px solid ${C.lineSoft}` }}
            >
              <h3 className="text-[14px] font-semibold" style={{ color: C.phos }}>
                Contacten
              </h3>
              <button
                onClick={() => onGo("marktplaats")}
                className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-[11px] font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#37e07a]"
                style={{ ...mono, color: C.accent }}
              >
                Alles <ArrowRight size={12} strokeWidth={2.6} aria-hidden="true" />
              </button>
            </div>
            <ul className="p-2">
              {OPDRACHTEN.map((o) => (
                <li key={o.id}>
                  <button
                    onClick={() => onOpen(o.id)}
                    className="flex w-full items-center gap-3 rounded-lg p-3 text-left transition-colors hover:bg-[rgba(55,224,122,0.06)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#37e07a]"
                  >
                    <ScoreReadout value={o.match} />
                    <span className="min-w-0 flex-1">
                      <span
                        className="block truncate text-[13.5px] font-semibold"
                        style={{ color: C.phos }}
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
                    <ArrowUpRight size={15} strokeWidth={2.2} color={C.faint} aria-hidden="true" />
                  </button>
                </li>
              ))}
            </ul>
          </Panel>

          {/* Live feed — toont loading + error-state */}
          <Panel className="p-4">
            <h3
              className="flex items-center gap-2 text-[13px] font-semibold"
              style={{ color: C.phos }}
            >
              <Radio size={14} strokeWidth={2.2} color={C.accent} aria-hidden="true" /> Live signaal
            </h3>
            {feed === "loading" && (
              <div className="mt-3 space-y-2" role="status" aria-live="polite">
                <span className="sr-only">Signaal wordt geladen…</span>
                {[0, 1].map((i) => (
                  <span
                    key={i}
                    className="block h-3 animate-pulse rounded"
                    style={{ background: "rgba(55,224,122,0.1)", width: i === 0 ? "80%" : "60%" }}
                  />
                ))}
              </div>
            )}
            {feed === "error" && (
              <div
                className="mt-3 flex flex-col gap-2 rounded-lg p-3 sm:flex-row sm:items-center"
                style={{ background: "rgba(255,122,107,0.08)", border: `1px solid ${C.alert}55` }}
                role="alert"
              >
                <XCircle size={16} strokeWidth={2.2} color={C.alert} aria-hidden="true" />
                <p className="flex-1 text-[12px]" style={{ color: C.phos }}>
                  Signaal verloren. Kon de live-feed niet ophalen.
                </p>
                <button
                  onClick={() => setFeed("ok")}
                  className="inline-flex shrink-0 items-center gap-1.5 rounded-md px-3 py-1.5 text-[11.5px] font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#37e07a]"
                  style={{ color: C.screen, background: C.accent }}
                >
                  <RotateCw size={12} strokeWidth={2.6} aria-hidden="true" /> Opnieuw
                </button>
              </div>
            )}
            {feed === "ok" && (
              <p className="mt-3 flex items-center gap-2 text-[12px]" style={{ color: C.muted }}>
                <Check size={14} strokeWidth={2.6} color={C.accent} aria-hidden="true" /> Verbinding
                hersteld — alle contacten in bereik.
              </p>
            )}
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
        className="flex items-center gap-3 rounded-lg px-4 py-3"
        style={{ background: C.panelSolid, border: `1px solid ${C.line}`, boxShadow: GLOW }}
      >
        <Search size={16} strokeWidth={2.2} color={C.accent} aria-hidden="true" />
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Zoek op titel, plaats of opdrachtgever…"
          aria-label="Opdrachten zoeken"
          className="w-full bg-transparent text-[13px] outline-none placeholder:text-[#4a7460]"
          style={{ ...mono, color: C.phos }}
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
            <Radar size={24} strokeWidth={2} color={C.accent} />
          </span>
          <p className="mt-4 text-[18px] font-semibold" style={{ color: C.phos }}>
            Niets in bereik
          </p>
          <p className="mx-auto mt-2 max-w-xs text-[12px]" style={{ color: C.muted }}>
            Geen contact past bij &quot;{q}&quot;. Verbreed je scan.
          </p>
          <button
            onClick={() => setQ("")}
            className="mt-5 rounded-lg px-4 py-2 text-[12.5px] font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#37e07a]"
            style={{ color: C.screen, background: C.accent }}
          >
            Scan wissen
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
                  className="w-full rounded-xl p-4 text-left transition-all hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#37e07a]"
                  style={{
                    background: C.panel,
                    border: `1px solid ${on ? `${C.accent}88` : C.line}`,
                    boxShadow: on ? `0 0 24px -8px ${C.accent}` : GLOW,
                  }}
                >
                  <div className="flex items-start gap-3.5">
                    <ScoreReadout value={o.match} size={52} />
                    <div className="min-w-0 flex-1">
                      <div
                        className="flex items-center gap-2 text-[10px] font-semibold"
                        style={{ ...mono, color: C.faint }}
                      >
                        <span className="uppercase tracking-[0.12em]">{o.id}</span>
                        {on && <span style={{ color: C.accent }}>· vergrendeld</span>}
                      </div>
                      <p className="truncate text-[15px] font-semibold" style={{ color: C.phos }}>
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
                              background: "rgba(55,224,122,0.08)",
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
                  <Navigation size={15} strokeWidth={2.2} color={C.accent} aria-hidden="true" />
                </div>
                <div className="p-4">
                  <p className="text-[16px] font-semibold leading-snug" style={{ color: C.phos }}>
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
                        className="rounded-lg p-2.5"
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
                          style={{ ...mono, color: C.phos }}
                        >
                          {m.v}
                        </dd>
                      </div>
                    ))}
                  </dl>
                  <button
                    onClick={() => onOpen(sel.id)}
                    className="mt-4 flex w-full items-center justify-center gap-1.5 rounded-lg px-4 py-2.5 text-[12.5px] font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#37e07a]"
                    style={{ color: C.screen, background: C.accent }}
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
          <ScoreReadout value={opdracht.match} size={76} />
        </div>
        <div className="p-5 pt-0 sm:p-6 sm:pt-0">
          <button
            onClick={react}
            disabled={state !== "idle"}
            aria-live="polite"
            className="flex w-full items-center justify-center gap-2 rounded-lg px-5 py-3 text-[13px] font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#37e07a] disabled:opacity-90"
            style={{ color: C.screen, background: state === "sent" ? C.phos : C.accent }}
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
              style={{ ...mono, color: C.faint }}
            >
              {m.l}
            </p>
            <p className="mt-1.5 text-[18px] tabular-nums" style={{ ...mono, color: C.phos }}>
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
          <Radar size={16} strokeWidth={2} color={C.accent} aria-hidden="true" />
          <h3 className="text-[16px] font-semibold" style={{ color: C.phos }}>
            Waarom deze match
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
                  style={{ color: C.phos }}
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
    { l: "Vergrendeld", v: `${verified}/${total}`, color: C.accent, Icon: ShieldCheck },
    { l: "Signaal zwak", v: "1", color: C.warn, Icon: AlertTriangle },
    { l: "In scan", v: "1", color: C.warn, Icon: Clock },
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
                <p className="mt-1.5 text-[24px] tabular-nums" style={{ ...mono, color: C.phos }}>
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
                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg"
                style={{ background: `${m.color}18`, border: `1px solid ${m.color}55` }}
              >
                <Icon size={20} strokeWidth={2} color={m.color} aria-hidden="true" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-[14px] font-semibold" style={{ color: C.phos }}>
                  {c.naam}
                </p>
                <p className="text-[11.5px]" style={{ ...mono, color: C.muted }}>
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
                <span className="text-[16px] tabular-nums" style={{ ...mono, color }}>
                  {String(i + 1).padStart(2, "0")}
                </span>
                {warn ? (
                  <AlertTriangle size={15} strokeWidth={2.4} color={color} aria-hidden="true" />
                ) : (
                  <Radio size={15} strokeWidth={2.2} color={color} aria-hidden="true" />
                )}
              </div>
              <div className="min-w-0 flex-1 p-4">
                <span
                  className="text-[10.5px] font-semibold uppercase tracking-[0.1em]"
                  style={{ ...mono, color }}
                >
                  {warn ? "Waarschuwing" : "Melding"}
                </span>
                <p className="mt-1 text-[14.5px] font-semibold" style={{ color: C.phos }}>
                  {a.titel}
                </p>
                <p className="mt-0.5 text-[12.5px]" style={{ color: C.muted }}>
                  {a.detail}
                </p>
              </div>
              <button
                onClick={() => onGo(warn ? "verificatie" : "marktplaats")}
                className="m-3 shrink-0 self-center rounded-lg px-4 py-2 text-[12px] font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#37e07a]"
                style={{
                  color: warn ? C.screen : C.phos,
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
        className="flex items-center gap-3 rounded-xl p-4"
        style={{ background: "rgba(55,224,122,0.07)", border: `1px solid ${C.line}` }}
      >
        <Check size={18} strokeWidth={2.4} color={C.accent} aria-hidden="true" />
        <p className="text-[12.5px]" style={{ color: C.muted }}>
          Verder is alles bijgewerkt. Nieuwe signalen verschijnen hier vanzelf.
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
          className="inline-flex shrink-0 items-center gap-2 rounded-lg px-4 py-2.5 text-[12.5px] font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#37e07a]"
          style={{ color: C.screen, background: C.accent }}
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
                <tr key={f.nr} style={{ borderTop: i === 0 ? "none" : `1px solid ${C.lineSoft}` }}>
                  <td
                    className="p-4 text-[12px] font-semibold tabular-nums"
                    style={{ ...mono, color: C.phos }}
                  >
                    {f.nr}
                  </td>
                  <td className="p-4 text-[13px] font-medium" style={{ color: C.phos }}>
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
                    style={{ ...mono, color: C.phos }}
                  >
                    {f.bedrag}
                  </td>
                  <td className="p-4">
                    <div className="flex items-center justify-end gap-1.5">
                      <span
                        className="h-2 w-2 rounded-full"
                        style={{ background: color, boxShadow: `0 0 5px ${color}` }}
                        aria-hidden="true"
                      />
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
    </div>
  );
}
