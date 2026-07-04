"use client";

// Concept 73 — "Printplaat" · PCB / circuit board.
// Een echt donkergroen solder-mask met lichtgroene silkscreen-tekst en koper/goud-accenten.
// Koperbanen (SVG-paden met rechte hoeken en 45°) verbinden "componenten": kaarten zijn chips met
// silkscreen-referenties (U1, IC2…), met soldeer-eilandjes op de hoeken en via-gaatjes. De
// matching-score verschijnt als een IC-pin-diagram. Technisch en precies — onderscheidend van
// neon-cyber doordat dit een écht groen bord is. Hover geeft een subtiele koper-glow.
// Palet: solder-mask #0a1f16 / #0c2419, silkscreen-groen #d4e8dc, koper/goud #e0b64d.
// Fonts: --font-lab-spline-mono (silkscreen/labels) + --font-lab-geist (body). Deterministisch.

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
  Cpu,
  CircuitBoard,
  Inbox,
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
  type ScreenKey,
  type CredStatus,
  type Opdracht,
} from "./mock";

/* ---------- Palet & typografie ---------- */

const C = {
  board: "#0a1f16",
  boardAlt: "#0c2419",
  chip: "#0e2a1c",
  chipAlt: "#123322",
  text: "#d4e8dc",
  muted: "#7fa892",
  faint: "#547a64",
  copper: "#e0b64d",
  copperDim: "#9a7f37",
  signal: "#5fd39a",
  amber: "#e0913d",
  red: "#e0705e",
  line: "rgba(212,232,220,0.14)",
  lineSoft: "rgba(212,232,220,0.08)",
};

const silk = { fontFamily: "var(--font-lab-spline-mono)" };
const body = { fontFamily: "var(--font-lab-geist)" };

const GLOW = "0 0 0 1px rgba(224,182,77,0.14), 0 18px 40px -30px rgba(0,0,0,0.9)";

/* ---------- Koperbanen-achtergrond (deterministisch, geen random) ---------- */

function TraceLayer() {
  const vias = [
    [120, 90],
    [340, 60],
    [620, 140],
    [210, 300],
    [500, 380],
    [720, 300],
    [90, 480],
    [400, 560],
  ] as const;
  const pads = [
    [180, 40],
    [280, 200],
    [560, 40],
    [660, 240],
    [140, 360],
    [460, 480],
    [780, 120],
  ] as const;
  return (
    <svg
      className="pointer-events-none absolute inset-0 h-full w-full"
      viewBox="0 0 800 600"
      preserveAspectRatio="xMidYMid slice"
      aria-hidden="true"
    >
      <g
        fill="none"
        stroke={C.copper}
        strokeWidth="1.4"
        opacity="0.22"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M0 90 H90 L120 120 V210 H210 L240 240" />
        <path d="M340 0 V40 L370 70 H520 L560 110 V180" />
        <path d="M800 140 H660 L620 180 V260 H500 L470 290" />
        <path d="M0 480 H60 L90 450 H240 L280 490 V560" />
        <path d="M720 600 V360 L690 330 H540 L500 370" />
        <path d="M400 600 V560 L430 530 H600 L640 570" />
        <path d="M120 90 L160 130 H300 L340 90" />
      </g>
      <g fill="none" stroke={C.signal} strokeWidth="1.1" opacity="0.14" strokeLinecap="round">
        <path d="M0 260 H200 L240 300 H420" />
        <path d="M800 440 H620 L580 480 H360" />
      </g>
      {vias.map(([x, y], i) => (
        <g key={`v${i}`}>
          <circle
            cx={x}
            cy={y}
            r="4.5"
            fill="none"
            stroke={C.copperDim}
            strokeWidth="2"
            opacity="0.5"
          />
          <circle cx={x} cy={y} r="1.6" fill={C.board} />
        </g>
      ))}
      {pads.map(([x, y], i) => (
        <circle key={`p${i}`} cx={x} cy={y} r="3" fill={C.copper} opacity="0.3" />
      ))}
    </svg>
  );
}

// Klein soldeer-eilandje voor op de chip-hoeken.
function Pad({ className = "" }: { className?: string }) {
  return (
    <span
      className={`pointer-events-none absolute h-2 w-2 rounded-full ${className}`}
      style={{ background: C.copper, boxShadow: `0 0 0 1.5px ${C.board}`, opacity: 0.6 }}
      aria-hidden="true"
    />
  );
}

/* ---------- Status → betekenis (label + icoon + kleur, nooit kleur-alleen) ---------- */

type CredMeta = { label: string; color: string; Icon: typeof ShieldCheck };

function credMeta(s: CredStatus): CredMeta {
  switch (s) {
    case "VERIFIED":
      return { label: "Geverifieerd", color: C.signal, Icon: ShieldCheck };
    case "SUBMITTED":
      return { label: "In beoordeling", color: C.copper, Icon: Clock };
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

/* ---------- Kleine bouwstenen ---------- */

function Kicker({ children }: { children: React.ReactNode }) {
  return (
    <span
      className="text-[10px] font-semibold uppercase tracking-[0.3em]"
      style={{ ...silk, color: C.copper }}
    >
      {children}
    </span>
  );
}

function StatusBadge({ status }: { status: CredStatus }) {
  const m = credMeta(status);
  const Icon = m.Icon;
  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-[3px] px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.08em]"
      style={{
        ...silk,
        color: m.color,
        background: "rgba(0,0,0,0.28)",
        border: `1px solid ${m.color}55`,
      }}
    >
      <Icon size={12} strokeWidth={2.4} aria-hidden="true" />
      {m.label}
    </span>
  );
}

function Spark({ data, color = C.copper }: { data: number[]; color?: string }) {
  const w = 90;
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
  const last = pts[pts.length - 1] ?? ([0, 0] as const);
  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} aria-hidden="true">
      <path
        d={line}
        fill="none"
        stroke={color}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {pts.map((p, i) => (
        <circle key={i} cx={p[0]} cy={p[1]} r="1.3" fill={color} opacity="0.5" />
      ))}
      <circle cx={last[0]} cy={last[1]} r="2.2" fill={color} />
    </svg>
  );
}

// Chip-kaart: solder-mask paneel met silkscreen-rand en soldeer-eilandjes op de hoeken.
function Chip({
  children,
  className = "",
  refDes,
}: {
  children: React.ReactNode;
  className?: string;
  refDes?: string;
}) {
  return (
    <div
      className={`group relative rounded-[6px] transition-all duration-200 hover:shadow-[0_0_22px_-6px_rgba(224,182,77,0.4)] ${className}`}
      style={{ background: C.chip, border: `1px solid ${C.line}`, boxShadow: GLOW }}
    >
      <Pad className="left-1.5 top-1.5" />
      <Pad className="right-1.5 top-1.5" />
      <Pad className="bottom-1.5 left-1.5" />
      <Pad className="bottom-1.5 right-1.5" />
      {refDes && (
        <span
          className="pointer-events-none absolute right-2.5 top-1.5 text-[8.5px] font-semibold uppercase tracking-[0.16em]"
          style={{ ...silk, color: C.faint }}
        >
          {refDes}
        </span>
      )}
      {children}
    </div>
  );
}

// Match-score als IC-pin-diagram: van de 10 pinnen wordt round(match/10) verlicht.
function PinScore({ value, size = "md" }: { value: number; size?: "sm" | "md" | "lg" }) {
  const lit = Math.round(value / 10);
  const dims =
    size === "lg"
      ? { w: 108, pin: 8, gap: 3, fs: 22 }
      : size === "sm"
        ? { w: 64, pin: 5, gap: 2, fs: 13 }
        : { w: 84, pin: 6, gap: 2.5, fs: 17 };
  const color = value >= 90 ? C.copper : C.signal;
  return (
    <div
      className="inline-flex flex-col items-center gap-1"
      aria-label={`Match ${value} procent`}
      role="img"
    >
      <PinRow count={10} lit={lit} pin={dims.pin} gap={dims.gap} color={color} />
      <div
        className="flex items-center justify-center rounded-[4px]"
        style={{
          width: dims.w,
          background: C.chipAlt,
          border: `1px solid ${C.line}`,
          padding: "6px 4px",
        }}
      >
        <span
          className="tabular-nums"
          style={{ ...silk, color, fontSize: dims.fs, fontWeight: 600, lineHeight: 1 }}
        >
          {value}
        </span>
        <span className="ml-0.5 text-[9px] font-semibold" style={{ ...silk, color: C.faint }}>
          %
        </span>
      </div>
      <PinRow count={10} lit={lit} pin={dims.pin} gap={dims.gap} color={color} />
    </div>
  );
}

function PinRow({
  count,
  lit,
  pin,
  gap,
  color,
}: {
  count: number;
  lit: number;
  pin: number;
  gap: number;
  color: string;
}) {
  return (
    <div className="flex" style={{ gap }} aria-hidden="true">
      {Array.from({ length: count }).map((_, i) => (
        <span
          key={i}
          style={{
            width: pin,
            height: pin * 1.4,
            borderRadius: 1,
            background: i < lit ? color : C.faint,
            opacity: i < lit ? 1 : 0.35,
            boxShadow: i < lit ? `0 0 5px -1px ${color}` : "none",
          }}
        />
      ))}
    </div>
  );
}

/* ---------- Hoofdcomponent ---------- */

export function Concept73() {
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
        color: C.text,
        background: `radial-gradient(150% 120% at 50% -10%, ${C.boardAlt}, ${C.board} 72%)`,
      }}
    >
      <TraceLayer />
      <div className="relative flex min-h-[680px] flex-col md:flex-row">
        {/* Zijbalk — connector-strip */}
        <aside
          className="shrink-0 md:w-[236px]"
          style={{ borderRight: `1px solid ${C.line}`, background: "rgba(0,0,0,0.24)" }}
        >
          <div className="flex h-full flex-col">
            <div
              className="flex items-center gap-3 p-5"
              style={{ borderBottom: `1px solid ${C.lineSoft}` }}
            >
              <span
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[5px]"
                style={{ background: "rgba(0,0,0,0.36)", border: `1px solid ${C.copper}55` }}
                aria-hidden="true"
              >
                <CircuitBoard size={18} strokeWidth={2} color={C.copper} />
              </span>
              <div className="leading-tight">
                <div
                  className="text-[15px] font-semibold tracking-[0.02em]"
                  style={{ color: C.text }}
                >
                  Printplaat
                </div>
                <div
                  className="text-[9px] font-semibold uppercase tracking-[0.2em]"
                  style={{ ...silk, color: C.faint }}
                >
                  REV · zorg
                </div>
              </div>
            </div>

            <nav
              className="flex flex-row gap-1 overflow-x-auto p-2 md:flex-1 md:flex-col"
              aria-label="Hoofdnavigatie"
            >
              {SCREENS.map((s, i) => {
                const on = s.key === screen;
                return (
                  <button
                    key={s.key}
                    onClick={() => setScreen(s.key)}
                    aria-current={on ? "page" : undefined}
                    className="relative flex shrink-0 items-center gap-2.5 rounded-[5px] px-3.5 py-2.5 text-left text-[13px] font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#e0b64d] md:w-full"
                    style={{
                      color: on ? C.text : C.muted,
                      background: on ? "rgba(224,182,77,0.1)" : "transparent",
                      border: on ? `1px solid ${C.copper}55` : "1px solid transparent",
                    }}
                  >
                    <span
                      className="text-[8.5px] font-semibold tabular-nums"
                      style={{ ...silk, color: on ? C.copper : C.faint }}
                      aria-hidden="true"
                    >
                      J{i + 1}
                    </span>
                    <span>{s.label}</span>
                  </button>
                );
              })}
            </nav>

            <div
              className="hidden items-center gap-3 p-4 md:flex"
              style={{ borderTop: `1px solid ${C.lineSoft}`, background: "rgba(0,0,0,0.3)" }}
            >
              <span
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[5px] text-[12px] font-bold"
                style={{ ...silk, color: C.board, background: C.copper }}
                aria-hidden="true"
              >
                {PROFIEL.initialen}
              </span>
              <div className="min-w-0">
                <div className="truncate text-[13px] font-semibold" style={{ color: C.text }}>
                  {PROFIEL.naam}
                </div>
                <div
                  className="flex items-center gap-1 text-[10px] font-semibold"
                  style={{ ...silk, color: C.signal }}
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
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    const t = window.setTimeout(() => setLoading(false), 700);
    return () => window.clearTimeout(t);
  }, []);

  return (
    <div className="mx-auto max-w-5xl space-y-7">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <Kicker>Board · U0 main</Kicker>
          <h1
            className="mt-2 text-[27px] font-semibold leading-none tracking-[-0.01em] sm:text-[32px]"
            style={{ color: C.text }}
          >
            Goedemorgen, {PROFIEL.naam.split(" ")[0]}
          </h1>
          <p className="mt-2 text-[13px]" style={{ ...silk, color: C.muted }}>
            {PROFIEL.rol} · {PROFIEL.plaats}
          </p>
        </div>
        <div
          className="flex items-center gap-2 rounded-[5px] px-3.5 py-2 text-[11px] font-semibold uppercase tracking-[0.08em]"
          style={{
            ...silk,
            color: C.signal,
            background: "rgba(0,0,0,0.3)",
            border: `1px solid ${C.signal}44`,
          }}
        >
          <Cpu size={13} strokeWidth={2.2} aria-hidden="true" /> Systeem actief
        </div>
      </header>

      {warn && (
        <Chip refDes="ERR1" className="p-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <span
              className="flex h-10 w-10 shrink-0 items-center justify-center self-start rounded-[5px]"
              style={{ background: "rgba(0,0,0,0.34)", border: `1px solid ${C.amber}55` }}
            >
              <AlertTriangle size={18} strokeWidth={2.2} color={C.amber} aria-hidden="true" />
            </span>
            <p className="text-[13px] leading-snug" style={{ color: C.text }} role="alert">
              <span className="font-semibold">{warn.titel}.</span>{" "}
              <span style={{ color: C.muted }}>{warn.detail}</span>
            </p>
            <button
              onClick={() => onGo("verificatie")}
              className="ml-auto inline-flex shrink-0 items-center gap-1.5 rounded-[5px] px-3.5 py-2 text-[11.5px] font-semibold uppercase tracking-[0.06em] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#e0b64d]"
              style={{ ...silk, color: C.board, background: C.copper }}
            >
              {warn.cta} <ArrowRight size={13} strokeWidth={2.6} aria-hidden="true" />
            </button>
          </div>
        </Chip>
      )}

      <div className="grid grid-cols-2 gap-3.5 lg:grid-cols-4">
        {KPIS.map((k, i) => (
          <Chip key={k.label} refDes={`R${i + 1}`} className="flex flex-col justify-between p-4">
            <div className="flex items-start justify-between gap-2">
              <p
                className="text-[10px] font-semibold uppercase leading-tight tracking-[0.08em]"
                style={{ ...silk, color: C.muted }}
              >
                {k.label}
              </p>
              <span
                className="inline-flex items-center gap-0.5 text-[10.5px] font-semibold tabular-nums"
                style={{ ...silk, color: k.up ? C.signal : C.red }}
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
              className="mt-3 text-[24px] font-semibold tabular-nums leading-none"
              style={{ ...silk, color: C.text }}
            >
              {k.value}
            </p>
            <div className="mt-2">
              <Spark data={k.spark} color={k.up ? C.copper : C.red} />
            </div>
          </Chip>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
        <Chip refDes="U1 · matches" className="overflow-hidden lg:col-span-2">
          <div
            className="flex items-center justify-between p-4"
            style={{ borderBottom: `1px solid ${C.lineSoft}` }}
          >
            <h3
              className="flex items-center gap-2 text-[15px] font-semibold"
              style={{ color: C.text }}
            >
              <Cpu size={15} strokeWidth={2.2} color={C.copper} aria-hidden="true" /> Beste matches
            </h3>
            <button
              onClick={() => onGo("marktplaats")}
              className="inline-flex items-center gap-1 rounded px-2 py-1 text-[10.5px] font-semibold uppercase tracking-[0.08em] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#e0b64d]"
              style={{ ...silk, color: C.copper }}
            >
              Alle <ArrowRight size={12} strokeWidth={2.6} aria-hidden="true" />
            </button>
          </div>
          {loading ? (
            <div className="space-y-3 p-4" role="status" aria-live="polite">
              <span className="sr-only">Matches worden geladen…</span>
              {[0, 1, 2].map((i) => (
                <div
                  key={i}
                  className="flex items-center gap-3 rounded-[5px] p-3"
                  style={{ background: "rgba(0,0,0,0.22)" }}
                >
                  <span
                    className="h-11 w-14 animate-pulse rounded"
                    style={{ background: "rgba(212,232,220,0.08)" }}
                  />
                  <div className="flex-1 space-y-2">
                    <span
                      className="block h-3 w-2/3 animate-pulse rounded"
                      style={{ background: "rgba(212,232,220,0.08)" }}
                    />
                    <span
                      className="block h-2.5 w-1/2 animate-pulse rounded"
                      style={{ background: "rgba(212,232,220,0.08)" }}
                    />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <ul className="p-2">
              {OPDRACHTEN.map((o) => (
                <li key={o.id}>
                  <button
                    onClick={() => onOpen(o.id)}
                    className="flex w-full items-center gap-3.5 rounded-[5px] p-3 text-left transition-colors hover:bg-[rgba(224,182,77,0.06)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#e0b64d]"
                  >
                    <PinScore value={o.match} size="sm" />
                    <span className="min-w-0 flex-1">
                      <span
                        className="block truncate text-[14px] font-semibold"
                        style={{ color: C.text }}
                      >
                        {o.titel}
                      </span>
                      <span
                        className="block truncate text-[11.5px]"
                        style={{ ...silk, color: C.muted }}
                      >
                        {o.opdrachtgever} · {o.plaats} · {o.tarief}
                      </span>
                    </span>
                    <ArrowUpRight size={16} strokeWidth={2.2} color={C.faint} aria-hidden="true" />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </Chip>

        <div className="space-y-5">
          <Chip refDes="U2 · certs" className="overflow-hidden">
            <div className="p-4" style={{ borderBottom: `1px solid ${C.lineSoft}` }}>
              <h3 className="text-[15px] font-semibold" style={{ color: C.text }}>
                Certificaten
              </h3>
            </div>
            <div className="p-2">
              {CREDENTIALS.map((c) => {
                const m = credMeta(c.status);
                const Icon = m.Icon;
                return (
                  <div key={c.naam} className="flex items-center gap-2.5 rounded px-2 py-2.5">
                    <Icon size={15} strokeWidth={2.2} color={m.color} aria-hidden="true" />
                    <span
                      className="min-w-0 flex-1 truncate text-[12.5px] font-medium"
                      style={{ color: C.text }}
                    >
                      {c.naam}
                    </span>
                    <span
                      className="text-[9.5px] font-semibold uppercase tracking-[0.06em]"
                      style={{ ...silk, color: m.color }}
                    >
                      {m.label}
                    </span>
                  </div>
                );
              })}
            </div>
          </Chip>

          <Chip refDes="U3 · io" className="overflow-hidden">
            <div
              className="flex items-center justify-between p-4"
              style={{ borderBottom: `1px solid ${C.lineSoft}` }}
            >
              <h3
                className="flex items-center gap-2 text-[15px] font-semibold"
                style={{ color: C.text }}
              >
                <Inbox size={15} strokeWidth={2} color={C.copper} aria-hidden="true" /> Berichten
              </h3>
              <span
                className="rounded px-2 py-0.5 text-[9.5px] font-semibold uppercase tracking-[0.06em]"
                style={{ ...silk, color: C.copper, background: "rgba(224,182,77,0.14)" }}
              >
                {BERICHTEN.filter((b) => b.ongelezen).length} nieuw
              </span>
            </div>
            <div className="p-2">
              {BERICHTEN.slice(0, 2).map((b) => (
                <div key={b.van} className="flex items-center gap-3 rounded px-2 py-2.5">
                  <span
                    className="flex h-8 w-8 shrink-0 items-center justify-center rounded-[4px] text-[10px] font-bold"
                    style={{
                      ...silk,
                      color: C.text,
                      background: "rgba(0,0,0,0.3)",
                      border: `1px solid ${C.line}`,
                    }}
                    aria-hidden="true"
                  >
                    {b.initialen}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[12.5px] font-semibold" style={{ color: C.text }}>
                      {b.van}
                    </p>
                    <p className="truncate text-[11px]" style={{ color: C.muted }}>
                      {b.preview}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </Chip>
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
        <Kicker>Bus · marktplaats</Kicker>
        <h1 className="mt-2 text-[26px] font-semibold tracking-[-0.01em]" style={{ color: C.text }}>
          Open opdrachten
        </h1>
      </div>

      <div
        className="flex items-center gap-3 rounded-[6px] px-4 py-3"
        style={{ background: C.chip, border: `1px solid ${C.line}`, boxShadow: GLOW }}
      >
        <Search size={16} strokeWidth={2.2} color={C.copper} aria-hidden="true" />
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Zoek op titel, plaats of opdrachtgever…"
          aria-label="Opdrachten zoeken"
          className="w-full bg-transparent text-[13px] outline-none placeholder:text-[#547a64]"
          style={{ ...silk, color: C.text }}
        />
        <span
          className="shrink-0 text-[11px] font-semibold tabular-nums"
          style={{ ...silk, color: C.faint }}
        >
          {filtered.length}/{OPDRACHTEN.length}
        </span>
      </div>

      {filtered.length === 0 ? (
        <Chip className="p-12 text-center">
          <span
            className="mx-auto flex h-14 w-14 items-center justify-center rounded-[6px]"
            style={{ background: "rgba(0,0,0,0.3)", border: `1px solid ${C.copper}55` }}
            aria-hidden="true"
          >
            <Search size={22} strokeWidth={2} color={C.copper} />
          </span>
          <p className="mt-4 text-[18px] font-semibold" style={{ color: C.text }}>
            Geen match op de bus
          </p>
          <p className="mx-auto mt-2 max-w-xs text-[12px]" style={{ ...silk, color: C.muted }}>
            Geen opdracht past bij &quot;{q}&quot;. Verbreed je zoekopdracht.
          </p>
          <button
            onClick={() => setQ("")}
            className="mt-5 rounded-[5px] px-4 py-2 text-[12px] font-semibold uppercase tracking-[0.06em] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#e0b64d]"
            style={{ ...silk, color: C.board, background: C.copper }}
          >
            Zoekopdracht wissen
          </button>
        </Chip>
      ) : (
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-[1.3fr_1fr]">
          <div className="space-y-3.5">
            {filtered.map((o, i) => {
              const on = sel?.id === o.id;
              return (
                <button
                  key={o.id}
                  onClick={() => onSelect(o.id)}
                  aria-pressed={on}
                  className="group relative block w-full rounded-[6px] p-4 text-left transition-all hover:-translate-y-0.5 hover:shadow-[0_0_22px_-6px_rgba(224,182,77,0.4)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#e0b64d]"
                  style={{
                    background: C.chip,
                    border: `1px solid ${on ? `${C.copper}88` : C.line}`,
                    boxShadow: GLOW,
                  }}
                >
                  <Pad className="left-1.5 top-1.5" />
                  <Pad className="right-1.5 top-1.5" />
                  <span
                    className="pointer-events-none absolute right-2.5 top-1.5 text-[8.5px] font-semibold uppercase tracking-[0.16em]"
                    style={{ ...silk, color: C.faint }}
                  >
                    Q{i + 1}
                  </span>
                  <div className="flex items-start gap-3.5">
                    <PinScore value={o.match} size="sm" />
                    <div className="min-w-0 flex-1">
                      <div
                        className="flex items-center gap-2 text-[9.5px] font-semibold uppercase tracking-[0.1em]"
                        style={{ ...silk, color: C.faint }}
                      >
                        <span>{o.id}</span>
                        {on && <span style={{ color: C.copper }}>· geselecteerd</span>}
                      </div>
                      <p className="truncate text-[14.5px] font-semibold" style={{ color: C.text }}>
                        {o.titel}
                      </p>
                      <p
                        className="mt-0.5 flex items-center gap-1 truncate text-[11px]"
                        style={{ ...silk, color: C.muted }}
                      >
                        <MapPin size={12} strokeWidth={2.2} aria-hidden="true" /> {o.opdrachtgever}{" "}
                        · {o.plaats} · {o.uren}
                      </p>
                      <div className="mt-2 flex flex-wrap gap-1.5">
                        {o.redenen.plus.slice(0, 2).map((r) => (
                          <span
                            key={r}
                            className="inline-flex items-center gap-1 rounded px-2 py-0.5 text-[10px] font-medium"
                            style={{ color: C.signal, background: "rgba(95,211,154,0.1)" }}
                          >
                            <Check size={10} strokeWidth={3} aria-hidden="true" /> {r}
                          </span>
                        ))}
                      </div>
                      <div className="mt-1.5 flex flex-wrap gap-1.5">
                        {o.tags.map((t) => (
                          <span
                            key={t}
                            className="rounded px-2 py-0.5 text-[9.5px] font-semibold uppercase tracking-[0.06em]"
                            style={{
                              ...silk,
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
                  </div>
                </button>
              );
            })}
          </div>

          {sel && (
            <aside className="h-fit lg:sticky lg:top-4">
              <Chip refDes="DUT" className="p-4">
                <div
                  className="flex items-center justify-between pb-3"
                  style={{ borderBottom: `1px solid ${C.lineSoft}` }}
                >
                  <span
                    className="text-[10px] font-semibold uppercase tracking-[0.12em]"
                    style={{ ...silk, color: C.copper }}
                  >
                    {sel.id}
                  </span>
                </div>
                <div className="flex justify-center py-4">
                  <PinScore value={sel.match} size="lg" />
                </div>
                <p className="text-[16px] font-semibold leading-snug" style={{ color: C.text }}>
                  {sel.titel}
                </p>
                <p className="mt-1 text-[11.5px]" style={{ ...silk, color: C.muted }}>
                  {sel.opdrachtgever} · {sel.plaats}
                </p>
                <dl className="mt-4 grid grid-cols-2 gap-2.5 text-[12px]">
                  {[
                    { l: "Tarief", v: sel.tarief },
                    { l: "Omvang", v: sel.uren },
                    { l: "Start", v: sel.start },
                    { l: "Match", v: `${sel.match}%` },
                  ].map((m) => (
                    <div
                      key={m.l}
                      className="rounded-[5px] p-2.5"
                      style={{ background: "rgba(0,0,0,0.26)" }}
                    >
                      <dt
                        className="text-[9px] font-semibold uppercase tracking-[0.1em]"
                        style={{ ...silk, color: C.faint }}
                      >
                        {m.l}
                      </dt>
                      <dd
                        className="mt-0.5 font-semibold tabular-nums"
                        style={{ ...silk, color: C.text }}
                      >
                        {m.v}
                      </dd>
                    </div>
                  ))}
                </dl>
                <button
                  onClick={() => onOpen(sel.id)}
                  className="mt-4 flex w-full items-center justify-center gap-1.5 rounded-[5px] px-4 py-2.5 text-[12px] font-semibold uppercase tracking-[0.06em] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#e0b64d]"
                  style={{ ...silk, color: C.board, background: C.copper }}
                >
                  Open opdracht <ArrowRight size={13} strokeWidth={2.6} aria-hidden="true" />
                </button>
              </Chip>
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
      <Chip refDes="DUT · opdracht">
        <div className="flex flex-col gap-4 p-5 sm:flex-row sm:items-start sm:justify-between sm:p-6">
          <div>
            <Kicker>{opdracht.id}</Kicker>
            <h1
              className="mt-2 text-[24px] font-semibold leading-tight tracking-[-0.01em]"
              style={{ color: C.text }}
            >
              {opdracht.titel}
            </h1>
            <p className="mt-2 text-[12px]" style={{ ...silk, color: C.muted }}>
              {opdracht.opdrachtgever} · {opdracht.plaats}
            </p>
            <div className="mt-3 flex flex-wrap gap-1.5">
              {opdracht.tags.map((t) => (
                <span
                  key={t}
                  className="rounded px-2.5 py-0.5 text-[9.5px] font-semibold uppercase tracking-[0.06em]"
                  style={{
                    ...silk,
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
          <div className="shrink-0">
            <PinScore value={opdracht.match} size="md" />
          </div>
        </div>
        <div className="p-5 pt-0 sm:p-6 sm:pt-0">
          <button
            onClick={react}
            disabled={state !== "idle"}
            aria-live="polite"
            className="flex w-full items-center justify-center gap-2 rounded-[5px] px-5 py-3 text-[12.5px] font-semibold uppercase tracking-[0.06em] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#e0b64d] disabled:opacity-90"
            style={{ ...silk, color: C.board, background: state === "sent" ? C.signal : C.copper }}
          >
            {state === "idle" && (
              <>
                <ArrowRight size={15} strokeWidth={2.6} aria-hidden="true" /> Reageer op opdracht
              </>
            )}
            {state === "sending" && "Signaal versturen…"}
            {state === "sent" && (
              <>
                <Check size={15} strokeWidth={3} aria-hidden="true" /> Reactie verstuurd
              </>
            )}
          </button>
        </div>
      </Chip>

      <div className="grid grid-cols-2 gap-3.5 sm:grid-cols-4">
        {[
          { l: "Tarief", v: opdracht.tarief },
          { l: "Omvang", v: opdracht.uren },
          { l: "Start", v: opdracht.start },
          { l: "Match", v: `${opdracht.match}%` },
        ].map((m, i) => (
          <Chip key={m.l} refDes={`C${i + 1}`} className="p-4">
            <p
              className="text-[9px] font-semibold uppercase tracking-[0.1em]"
              style={{ ...silk, color: C.faint }}
            >
              {m.l}
            </p>
            <p
              className="mt-2 text-[16px] font-semibold tabular-nums"
              style={{ ...silk, color: C.text }}
            >
              {m.v}
            </p>
          </Chip>
        ))}
      </div>

      <Chip refDes="U1 · redenen">
        <div className="p-4" style={{ borderBottom: `1px solid ${C.lineSoft}` }}>
          <h3 className="text-[15px] font-semibold" style={{ color: C.text }}>
            Waarom deze match
          </h3>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2">
          <div className="p-5" style={{ borderBottom: `1px solid ${C.lineSoft}` }}>
            <p
              className="flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.1em]"
              style={{ ...silk, color: C.signal }}
            >
              <Check size={13} strokeWidth={3} aria-hidden="true" /> Pluspunten
            </p>
            <ul className="mt-3 space-y-2.5">
              {opdracht.redenen.plus.map((r) => (
                <li
                  key={r}
                  className="flex items-start gap-2.5 text-[13px]"
                  style={{ color: C.text }}
                >
                  <Check
                    size={15}
                    strokeWidth={2.6}
                    color={C.signal}
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
              className="flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.1em]"
              style={{ ...silk, color: C.amber }}
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
      </Chip>
    </div>
  );
}

/* ---------- Verificatie ---------- */

function Verificatie() {
  const verified = CREDENTIALS.filter((c) => c.status === "VERIFIED").length;
  const total = CREDENTIALS.length;
  const stats = [
    { l: "Geverifieerd", v: `${verified}/${total}`, color: C.signal, Icon: ShieldCheck },
    { l: "Verloopt bijna", v: "1", color: C.amber, Icon: AlertTriangle },
    { l: "In beoordeling", v: "1", color: C.copper, Icon: Clock },
  ];

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div>
        <Kicker>Verificatie · U2</Kicker>
        <h1 className="mt-2 text-[26px] font-semibold tracking-[-0.01em]" style={{ color: C.text }}>
          Certificaten
        </h1>
        <p className="mt-2 text-[12.5px]" style={{ ...silk, color: C.muted }}>
          Je bewijsstukken worden veilig en privé bewaard.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-3">
        {stats.map((s, i) => {
          const Icon = s.Icon;
          return (
            <Chip key={s.l} refDes={`D${i + 1}`} className="flex items-center justify-between p-4">
              <div>
                <p
                  className="text-[10px] font-semibold uppercase tracking-[0.08em]"
                  style={{ ...silk, color: C.faint }}
                >
                  {s.l}
                </p>
                <p
                  className="mt-1.5 text-[24px] font-semibold tabular-nums"
                  style={{ ...silk, color: s.color }}
                >
                  {s.v}
                </p>
              </div>
              <span
                className="flex h-11 w-11 items-center justify-center rounded-[6px]"
                style={{ background: `${s.color}1c`, border: `1px solid ${s.color}55` }}
              >
                <Icon size={20} strokeWidth={2} color={s.color} aria-hidden="true" />
              </span>
            </Chip>
          );
        })}
      </div>

      <Chip>
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
                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[6px]"
                style={{ background: `${m.color}18`, border: `1px solid ${m.color}55` }}
              >
                <Icon size={20} strokeWidth={2} color={m.color} aria-hidden="true" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-[14px] font-semibold" style={{ color: C.text }}>
                  {c.naam}
                </p>
                <p className="text-[11.5px]" style={{ ...silk, color: C.muted }}>
                  {c.detail}
                </p>
              </div>
              <StatusBadge status={c.status} />
            </div>
          );
        })}
      </Chip>
    </div>
  );
}

/* ---------- Acties ---------- */

function Acties({ onGo }: { onGo: (k: ScreenKey) => void }) {
  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <Kicker>Interrupts · IRQ</Kicker>
        <h1 className="mt-2 text-[26px] font-semibold tracking-[-0.01em]" style={{ color: C.text }}>
          Volgende acties
        </h1>
        <p className="mt-2 text-[12.5px]" style={{ ...silk, color: C.muted }}>
          Op volgorde van urgentie — begin bovenaan.
        </p>
      </div>

      <div className="space-y-3.5">
        {ACTIES.map((a, i) => {
          const warn = a.urgentie === "warning";
          const color = warn ? C.amber : C.copper;
          return (
            <Chip key={a.titel} className="flex items-stretch overflow-hidden">
              <div
                className="flex w-14 shrink-0 flex-col items-center justify-center gap-2"
                style={{ background: `${color}16`, borderRight: `1px solid ${color}44` }}
              >
                <span className="text-[16px] font-semibold tabular-nums" style={{ ...silk, color }}>
                  {String(i + 1).padStart(2, "0")}
                </span>
                {warn ? (
                  <AlertTriangle size={14} strokeWidth={2.4} color={color} aria-hidden="true" />
                ) : (
                  <ArrowUpRight size={14} strokeWidth={2.4} color={color} aria-hidden="true" />
                )}
              </div>
              <div className="min-w-0 flex-1 p-4">
                <span
                  className="text-[9.5px] font-semibold uppercase tracking-[0.1em]"
                  style={{ ...silk, color }}
                >
                  {warn ? "IRQ · waarschuwing" : "IRQ · melding"}
                </span>
                <p className="mt-1 text-[14px] font-semibold" style={{ color: C.text }}>
                  {a.titel}
                </p>
                <p className="mt-0.5 text-[12px]" style={{ color: C.muted }}>
                  {a.detail}
                </p>
              </div>
              <button
                onClick={() => onGo(warn ? "verificatie" : "marktplaats")}
                className="m-3 shrink-0 self-center rounded-[5px] px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.06em] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#e0b64d]"
                style={{
                  ...silk,
                  color: warn ? C.board : C.text,
                  background: warn ? C.copper : "rgba(0,0,0,0.3)",
                  border: warn ? "none" : `1px solid ${C.line}`,
                }}
              >
                {a.cta}
              </button>
            </Chip>
          );
        })}
      </div>

      <div
        className="flex items-center gap-3 rounded-[6px] p-4"
        style={{ background: "rgba(95,211,154,0.09)", border: `1px solid ${C.signal}44` }}
      >
        <Check size={18} strokeWidth={2.4} color={C.signal} aria-hidden="true" />
        <p className="text-[12px]" style={{ color: C.muted }}>
          Verder is alles bijgewerkt. Nieuwe interrupts verschijnen hier vanzelf.
        </p>
      </div>
    </div>
  );
}

/* ---------- Facturen ---------- */

function Facturen() {
  const statusMeta: Record<string, { color: string; Icon: typeof Check }> = {
    Betaald: { color: C.signal, Icon: Check },
    Openstaand: { color: C.amber, Icon: Clock },
    Concept: { color: C.faint, Icon: Cpu },
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
          <Kicker>Power · financiën</Kicker>
          <h1
            className="mt-2 text-[26px] font-semibold tracking-[-0.01em]"
            style={{ color: C.text }}
          >
            Facturen
          </h1>
        </div>
        <button
          className="inline-flex shrink-0 items-center gap-2 rounded-[5px] px-4 py-2.5 text-[11.5px] font-semibold uppercase tracking-[0.06em] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#e0b64d]"
          style={{ ...silk, color: C.board, background: C.copper }}
        >
          <Plus size={14} strokeWidth={2.6} aria-hidden="true" /> Nieuwe factuur
        </button>
      </div>

      <div className="grid grid-cols-2 gap-3.5">
        <Chip refDes="V+" className="p-5">
          <p
            className="text-[10px] font-semibold uppercase tracking-[0.1em]"
            style={{ ...silk, color: C.faint }}
          >
            Ontvangen
          </p>
          <p
            className="mt-2 text-[22px] font-semibold tabular-nums"
            style={{ ...silk, color: C.signal }}
          >
            € {betaald.toLocaleString("nl-NL")}
          </p>
        </Chip>
        <Chip refDes="V-" className="p-5">
          <p
            className="text-[10px] font-semibold uppercase tracking-[0.1em]"
            style={{ ...silk, color: C.faint }}
          >
            Openstaand
          </p>
          <p
            className="mt-2 text-[22px] font-semibold tabular-nums"
            style={{ ...silk, color: C.amber }}
          >
            € {open.toLocaleString("nl-NL")}
          </p>
        </Chip>
      </div>

      <Chip className="overflow-x-auto">
        <table className="w-full text-left">
          <thead>
            <tr
              className="text-[9.5px] font-semibold uppercase tracking-[0.08em]"
              style={{ ...silk, color: C.faint, borderBottom: `1px solid ${C.lineSoft}` }}
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
              const meta = statusMeta[f.status] ?? { color: C.faint, Icon: Check };
              const Icon = meta.Icon;
              return (
                <tr key={f.nr} style={{ borderTop: i === 0 ? "none" : `1px solid ${C.lineSoft}` }}>
                  <td
                    className="p-4 text-[11.5px] font-semibold tabular-nums"
                    style={{ ...silk, color: C.text }}
                  >
                    {f.nr}
                  </td>
                  <td className="p-4 text-[13px] font-medium" style={{ color: C.text }}>
                    {f.klant}
                  </td>
                  <td
                    className="hidden p-4 text-[11.5px] tabular-nums sm:table-cell"
                    style={{ ...silk, color: C.muted }}
                  >
                    {f.datum}
                  </td>
                  <td
                    className="p-4 text-right text-[13px] font-semibold tabular-nums"
                    style={{ ...silk, color: C.text }}
                  >
                    {f.bedrag}
                  </td>
                  <td className="p-4">
                    <div className="flex items-center justify-end gap-1.5">
                      <Icon size={13} strokeWidth={2.6} color={meta.color} aria-hidden="true" />
                      <span
                        className="text-[10.5px] font-semibold uppercase tracking-[0.06em]"
                        style={{ ...silk, color: meta.color }}
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
      </Chip>
    </div>
  );
}
