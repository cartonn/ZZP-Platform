"use client";

// Concept 146 — "Noir" · film-noir hoog-contrast monochroom drama. Diep zwart, hard wit,
// één warme amber spot. "Venetian blind"-schaduwstrepen (repeating-linear-gradient) vallen
// over de panelen, harde spotverlichting (radiale gloed), fijne filmgrain. Dramatische
// grotesk-typografie. Mysterieus maar zakelijk-strak. Status wordt NOOIT met kleur gecodeerd
// (noir is monochroom) — altijd via label + VORM (gevulde ruit / cirkel / ring / kruis) plus
// icoon. Onderscheidend van andere donkere thema's (schemer/nachtdienst): dit is fotografische
// film-noir drama met blind-schaduwen en grain, niet een generiek dark-theme. Deterministisch —
// geen random, geen Date. Fonts: Space Grotesk (display) + JetBrains Mono (data/labels).

import { useState } from "react";
import {
  ArrowRight,
  ArrowLeft,
  Check,
  Clock,
  AlertTriangle,
  XCircle,
  Search,
  ShieldCheck,
  MapPin,
  Coins,
  CalendarDays,
  Plus,
  ThumbsUp,
  ThumbsDown,
  Aperture,
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

// ── Palet — monochroom noir + één amber spot ────────────────────────────────────
const C = {
  bg: "#0b0b0d",
  panel: "#121215",
  panelHi: "#17171b",
  panelSoft: "#0e0e11",
  fg: "#f4f2ec",
  fgSoft: "#a7a49c",
  fgFaint: "#6b6862",
  line: "#232228",
  lineStrong: "#33313a",
  amber: "#e8b04b",
  amberDim: "#8a6a2c",
};

const display = { fontFamily: "var(--font-lab-space)" };
const mono = { fontFamily: "var(--font-lab-mono)" };

// Venetian-blind schaduwstrepen — subtiele diagonale banden over een paneel.
const blinds =
  "repeating-linear-gradient(115deg, rgba(0,0,0,0.36) 0px, rgba(0,0,0,0.36) 2px, transparent 2px, transparent 13px)";
// Harde spot: warme radiale gloed vanuit linksboven.
const spot =
  "radial-gradient(120% 90% at 12% -8%, rgba(232,176,75,0.16) 0%, rgba(232,176,75,0.04) 26%, transparent 55%)";
// Fijne filmgrain via een herhalend micro-patroon (deterministisch, geen afbeelding).
const grain =
  "repeating-radial-gradient(circle at 0 0, rgba(255,255,255,0.018) 0px, rgba(255,255,255,0.018) 0.5px, transparent 0.5px, transparent 3px)";

// ── Status-model — VORM + label, nooit kleur ─────────────────────────────────────
// Noir codeert status niet met kleur. Elke status krijgt een eigen vorm-glyph.
type Shape = "diamond" | "ring" | "dot" | "cross";
function ShapeGlyph({ shape, size = 12 }: { shape: Shape; size?: number }) {
  const common = { color: C.fg } as const;
  if (shape === "diamond")
    return (
      <span
        aria-hidden="true"
        style={{
          ...common,
          width: size,
          height: size,
          background: C.fg,
          display: "inline-block",
          transform: "rotate(45deg)",
        }}
      />
    );
  if (shape === "ring")
    return (
      <span
        aria-hidden="true"
        style={{
          width: size,
          height: size,
          border: `2px solid ${C.fg}`,
          borderRadius: "9999px",
          display: "inline-block",
        }}
      />
    );
  if (shape === "dot")
    return (
      <span
        aria-hidden="true"
        style={{
          width: size,
          height: size,
          background: C.amber,
          borderRadius: "9999px",
          display: "inline-block",
          boxShadow: `0 0 8px ${C.amber}88`,
        }}
      />
    );
  return <XCircle aria-hidden="true" size={size + 2} strokeWidth={2.6} style={{ color: C.fg }} />;
}

function credMeta(s: CredStatus): { label: string; Icon: LucideIcon; shape: Shape } {
  switch (s) {
    case "VERIFIED":
      return { label: "Geverifieerd", Icon: Check, shape: "diamond" };
    case "SUBMITTED":
      return { label: "In beoordeling", Icon: Clock, shape: "ring" };
    case "EXPIRING":
      return { label: "Verloopt binnenkort", Icon: AlertTriangle, shape: "dot" };
    case "REJECTED":
      return { label: "Afgewezen", Icon: XCircle, shape: "cross" };
  }
}

// Status-chip: rand + vorm + label. Amber alleen als "aandacht"-accent bij EXPIRING/REJECTED.
function StatusChip({ status }: { status: CredStatus }) {
  const m = credMeta(status);
  const accent = status === "EXPIRING" || status === "REJECTED";
  return (
    <span
      className="inline-flex items-center gap-2 rounded-sm px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.16em]"
      style={{
        ...mono,
        border: `1px solid ${accent ? C.amberDim : C.lineStrong}`,
        background: accent ? "rgba(232,176,75,0.08)" : C.panelSoft,
        color: accent ? C.amber : C.fgSoft,
      }}
    >
      <ShapeGlyph shape={m.shape} size={9} />
      {m.label}
    </span>
  );
}

// ── Panelen met noir-chrome: blinds + spot + rand ────────────────────────────────
function Panel({
  children,
  className = "",
  lit = false,
}: {
  children: React.ReactNode;
  className?: string;
  lit?: boolean;
}) {
  return (
    <div
      className={`relative overflow-hidden rounded-md ${className}`}
      style={{
        background: C.panel,
        border: `1px solid ${lit ? C.amberDim : C.line}`,
        boxShadow: lit
          ? `0 0 0 1px ${C.amber}22, 0 22px 60px -30px ${C.amber}55, inset 0 1px 0 rgba(255,255,255,0.03)`
          : "0 20px 50px -34px rgba(0,0,0,0.9), inset 0 1px 0 rgba(255,255,255,0.02)",
      }}
    >
      <span
        aria-hidden="true"
        className="pointer-events-none absolute inset-0"
        style={{ backgroundImage: blinds, opacity: 0.5, mixBlendMode: "multiply" }}
      />
      <span
        aria-hidden="true"
        className="pointer-events-none absolute inset-0"
        style={{ backgroundImage: grain }}
      />
      <div className="relative">{children}</div>
    </div>
  );
}

function PanelHead({ children, right }: { children: React.ReactNode; right?: React.ReactNode }) {
  return (
    <div
      className="flex items-center justify-between gap-3 border-b px-4 py-3"
      style={{ borderColor: C.line }}
    >
      <span
        className="text-[10.5px] font-bold uppercase tracking-[0.28em]"
        style={{ ...mono, color: C.fgSoft }}
      >
        {children}
      </span>
      {right}
    </div>
  );
}

// Mono sparkline — hard wit met amber eindpunt.
function Spark({ data }: { data: number[] }) {
  const max = Math.max(...data);
  const min = Math.min(...data);
  const span = max - min || 1;
  const pts = data.map((v, i) => {
    const x = (i / (data.length - 1)) * 100;
    const y = 100 - ((v - min) / span) * 100;
    return `${x},${y}`;
  });
  const last = pts[pts.length - 1]?.split(",") ?? ["100", "0"];
  return (
    <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="h-9 w-full" aria-hidden="true">
      <polyline
        points={pts.join(" ")}
        fill="none"
        stroke={C.fgFaint}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
        vectorEffect="non-scaling-stroke"
      />
      <circle cx={last[0]} cy={last[1]} r={2.6} fill={C.amber} vectorEffect="non-scaling-stroke" />
    </svg>
  );
}

// Match-score als hoek van een "spotlight"-boog (monochroom, amber wijzer).
function MatchDial({ value, size = 76 }: { value: number; size?: number }) {
  const r = 30;
  const circ = Math.PI * r;
  const off = circ * (1 - value / 100);
  return (
    <div className="flex flex-col items-center">
      <svg viewBox="0 0 72 46" style={{ width: size }} aria-hidden="true">
        <path
          d="M6 40 A30 30 0 0 1 66 40"
          fill="none"
          stroke={C.line}
          strokeWidth="6"
          strokeLinecap="round"
        />
        <path
          d="M6 40 A30 30 0 0 1 66 40"
          fill="none"
          stroke={C.amber}
          strokeWidth="6"
          strokeLinecap="round"
          strokeDasharray={circ}
          strokeDashoffset={off}
        />
        <text
          x="36"
          y="36"
          textAnchor="middle"
          style={mono}
          fontSize="16"
          fontWeight={700}
          fill={C.fg}
        >
          {value}
        </text>
      </svg>
      <span
        className="mt-1 text-[8.5px] font-bold uppercase tracking-[0.22em]"
        style={{ ...mono, color: C.fgFaint }}
      >
        Match
      </span>
    </div>
  );
}

// ── Root ─────────────────────────────────────────────────────────────────────────
export function Concept146() {
  const [screen, setScreen] = useState<ScreenKey>("dashboard");
  const active = OPDRACHTEN[0] as Opdracht;

  return (
    <div
      className="min-h-screen w-full antialiased"
      style={{ ...display, background: C.bg, color: C.fg, backgroundImage: `${spot}, ${grain}` }}
    >
      {/* Titelbalk — filmische kop */}
      <header
        className="sticky top-0 z-20 flex items-center justify-between gap-3 px-4 py-3 md:px-8"
        style={{
          background: "rgba(11,11,13,0.86)",
          borderBottom: `1px solid ${C.line}`,
          backdropFilter: "blur(8px)",
        }}
      >
        <div className="flex min-w-0 items-center gap-3">
          <span
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-sm"
            style={{ border: `1px solid ${C.amberDim}`, background: "rgba(232,176,75,0.08)" }}
            aria-hidden="true"
          >
            <Aperture size={18} strokeWidth={2} style={{ color: C.amber }} />
          </span>
          <div className="leading-none">
            <div
              className="text-[17px] font-bold uppercase tracking-[0.24em]"
              style={{ ...display, color: C.fg }}
            >
              Noir
            </div>
            <div
              className="mt-1.5 text-[9px] font-semibold uppercase tracking-[0.3em]"
              style={{ ...mono, color: C.fgFaint }}
            >
              Dossier · {PROFIEL.naam}
            </div>
          </div>
        </div>
        <span
          className="flex h-10 w-10 items-center justify-center rounded-full text-[12px] font-bold"
          style={{
            ...mono,
            border: `1px solid ${C.lineStrong}`,
            background: C.panel,
            color: C.amber,
          }}
          aria-hidden="true"
        >
          {PROFIEL.initialen}
        </span>
      </header>

      {/* Scherm-selector */}
      <nav
        className="flex items-center gap-1.5 overflow-x-auto px-4 py-3 md:px-8"
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
              className="shrink-0 rounded-sm px-3.5 py-1.5 text-[11px] font-bold uppercase tracking-[0.18em] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
              style={{
                ...mono,
                color: on ? C.bg : C.fgSoft,
                background: on ? C.amber : "transparent",
                border: `1px solid ${on ? C.amber : C.line}`,
                boxShadow: on ? `0 0 22px -6px ${C.amber}aa` : "none",
              }}
            >
              {s.label}
            </button>
          );
        })}
      </nav>

      <main className="px-4 py-6 md:px-8 md:py-8">
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

// ── Dashboard ────────────────────────────────────────────────────────────────────
function Dashboard({ onOpen, onQueue }: { onOpen: () => void; onQueue: () => void }) {
  const lead = ACTIES.find((a) => a.urgentie === "warning") ?? ACTIES[0];
  return (
    <div className="space-y-6">
      {/* Kop-statement — noir tagline */}
      <div className="max-w-2xl">
        <p
          className="text-[10px] font-bold uppercase tracking-[0.34em]"
          style={{ ...mono, color: C.amber }}
        >
          Vanavond in beeld
        </p>
        <h1
          className="mt-2 text-[30px] font-bold leading-[1.05] tracking-[-0.01em] sm:text-[40px]"
          style={{ ...display, color: C.fg }}
        >
          Elke zaak vertelt een verhaal. Deze staan open.
        </h1>
      </div>

      {/* Lead-actie onder de spot */}
      <Panel lit className="p-5">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex min-w-0 items-start gap-3">
            <AlertTriangle
              size={20}
              strokeWidth={2.2}
              className="mt-0.5 shrink-0"
              style={{ color: C.amber }}
              aria-hidden="true"
            />
            <div className="min-w-0">
              <span
                className="text-[9px] font-bold uppercase tracking-[0.24em]"
                style={{ ...mono, color: C.amber }}
              >
                Zaak #1 · dringt
              </span>
              <h2 className="mt-1 text-[18px] font-bold" style={{ ...display, color: C.fg }}>
                {lead?.titel}
              </h2>
              <p className="mt-1 max-w-lg text-[13px] leading-relaxed" style={{ color: C.fgSoft }}>
                {lead?.detail}
              </p>
            </div>
          </div>
          <button
            onClick={onQueue}
            className="inline-flex shrink-0 items-center gap-2 rounded-sm px-5 py-2.5 text-[11px] font-bold uppercase tracking-[0.16em] transition-transform hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
            style={{ ...mono, background: C.amber, color: C.bg }}
          >
            {lead?.cta} <ArrowRight size={14} aria-hidden="true" />
          </button>
        </div>
      </Panel>

      {/* KPI-strook */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {KPIS.map((k) => (
          <Panel key={k.label} className="p-4">
            <div className="flex items-center justify-between">
              <span
                className="text-[9px] font-bold uppercase tracking-[0.2em]"
                style={{ ...mono, color: C.fgFaint }}
              >
                {k.label}
              </span>
              <span
                className="text-[10px] font-bold tabular-nums"
                style={{ ...mono, color: k.up ? C.amber : C.fgSoft }}
              >
                {k.up ? "▲" : "▼"} {k.trend}
              </span>
            </div>
            <div
              className="mt-3 text-[28px] font-bold tabular-nums leading-none tracking-[-0.02em]"
              style={{ ...display, color: C.fg }}
            >
              {k.value}
            </div>
            <div className="mt-3">
              <Spark data={k.spark} />
            </div>
          </Panel>
        ))}
      </div>

      {/* Twee kolommen: kansen + dossier */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Panel className="lg:col-span-2">
          <PanelHead
            right={
              <button
                onClick={onOpen}
                className="text-[9.5px] font-bold uppercase tracking-[0.18em] transition-colors hover:text-white focus-visible:outline-none"
                style={{ ...mono, color: C.amber }}
              >
                Alles openen →
              </button>
            }
          >
            Open kansen
          </PanelHead>
          <ul className="divide-y" style={{ borderColor: C.line }}>
            {OPDRACHTEN.map((o) => (
              <li key={o.id}>
                <button
                  onClick={onOpen}
                  className="flex w-full items-center gap-4 px-4 py-3.5 text-left transition-colors hover:bg-[#17171b] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#e8b04b]/50"
                >
                  <MatchDial value={o.match} size={62} />
                  <div className="min-w-0 flex-1">
                    <div
                      className="truncate text-[15px] font-bold"
                      style={{ ...display, color: C.fg }}
                    >
                      {o.titel}
                    </div>
                    <div
                      className="mt-0.5 truncate text-[12px]"
                      style={{ ...mono, color: C.fgFaint }}
                    >
                      {o.opdrachtgever} · {o.plaats} · {o.tarief}
                    </div>
                  </div>
                  <ArrowRight
                    size={16}
                    className="shrink-0"
                    style={{ color: C.fgFaint }}
                    aria-hidden="true"
                  />
                </button>
              </li>
            ))}
          </ul>
        </Panel>

        <Panel>
          <PanelHead>Dossier · bewijs</PanelHead>
          <ul className="space-y-2 p-4">
            {CREDENTIALS.map((c) => (
              <li
                key={c.naam}
                className="flex items-start justify-between gap-3 rounded-sm px-3 py-2.5"
                style={{ background: C.panelSoft, border: `1px solid ${C.line}` }}
              >
                <div className="min-w-0">
                  <div className="truncate text-[13px] font-semibold" style={{ color: C.fg }}>
                    {c.naam}
                  </div>
                  <div className="mt-1">
                    <StatusChip status={c.status} />
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </Panel>
      </div>
    </div>
  );
}

// ── Marktplaats ──────────────────────────────────────────────────────────────────
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
        <h2
          className="text-[22px] font-bold tracking-[-0.01em]"
          style={{ ...display, color: C.fg }}
        >
          Marktplaats
        </h2>
        <Panel className="flex items-center gap-2 px-3 py-1.5">
          <Search size={15} style={{ color: C.fgFaint }} aria-hidden="true" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Zoek zaak, plaats, opdrachtgever…"
            aria-label="Opdrachten zoeken"
            className="w-52 bg-transparent py-1 text-[12.5px] outline-none placeholder:opacity-50"
            style={{ ...mono, color: C.fg }}
          />
        </Panel>
      </div>

      {filtered.length === 0 ? (
        <Panel className="flex flex-col items-center justify-center gap-3 p-16 text-center">
          <Search size={26} style={{ color: C.fgFaint }} aria-hidden="true" />
          <p className="text-[15px] font-bold" style={{ ...display, color: C.fg }}>
            Geen spoor gevonden
          </p>
          <p className="max-w-xs text-[12.5px]" style={{ color: C.fgSoft }}>
            Niets komt overeen met “{q}”. Pas je zoekopdracht aan.
          </p>
          <button
            onClick={() => setQ("")}
            className="mt-1 rounded-sm px-4 py-2 text-[10.5px] font-bold uppercase tracking-[0.16em] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
            style={{ ...mono, background: C.amber, color: C.bg }}
          >
            Zoekopdracht wissen
          </button>
        </Panel>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {filtered.map((o) => (
            <Panel key={o.id} className="flex flex-col">
              <div className="flex items-start justify-between gap-3 p-4">
                <div className="min-w-0">
                  <span
                    className="text-[9px] font-bold uppercase tracking-[0.2em]"
                    style={{ ...mono, color: C.fgFaint }}
                  >
                    {o.id}
                  </span>
                  <h3
                    className="mt-1 text-[16px] font-bold leading-tight"
                    style={{ ...display, color: C.fg }}
                  >
                    {o.titel}
                  </h3>
                  <p className="mt-1 text-[12px]" style={{ ...mono, color: C.fgFaint }}>
                    {o.opdrachtgever} · {o.plaats}
                  </p>
                </div>
                <MatchDial value={o.match} size={64} />
              </div>
              <div className="flex flex-wrap gap-1.5 px-4">
                {o.tags.map((t) => (
                  <span
                    key={t}
                    className="rounded-sm px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.1em]"
                    style={{ ...mono, border: `1px solid ${C.line}`, color: C.fgSoft }}
                  >
                    {t}
                  </span>
                ))}
              </div>
              <div className="mt-auto flex items-center justify-between gap-3 p-4">
                <span
                  className="text-[13px] font-bold tabular-nums"
                  style={{ ...mono, color: C.amber }}
                >
                  {o.tarief}
                </span>
                <button
                  onClick={onOpen}
                  className="inline-flex items-center gap-1.5 rounded-sm px-3.5 py-2 text-[10.5px] font-bold uppercase tracking-[0.14em] transition-colors hover:bg-[#17171b] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
                  style={{ ...mono, border: `1px solid ${C.lineStrong}`, color: C.fg }}
                >
                  Dossier openen <ArrowRight size={13} aria-hidden="true" />
                </button>
              </div>
            </Panel>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Opdracht-detail ──────────────────────────────────────────────────────────────
function OpdrachtDetail({ opdracht, onBack }: { opdracht: Opdracht; onBack: () => void }) {
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
        className="inline-flex items-center gap-2 text-[10.5px] font-bold uppercase tracking-[0.16em] transition-opacity hover:opacity-70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
        style={{ ...mono, color: C.fgSoft }}
      >
        <ArrowLeft size={14} aria-hidden="true" /> Terug naar marktplaats
      </button>

      <Panel lit className="p-6">
        <div className="flex flex-wrap items-start justify-between gap-5">
          <div className="min-w-0">
            <span
              className="text-[9.5px] font-bold uppercase tracking-[0.24em]"
              style={{ ...mono, color: C.amber }}
            >
              {opdracht.id} · {opdracht.start}
            </span>
            <h1
              className="mt-2 text-[26px] font-bold leading-[1.05] tracking-[-0.01em] sm:text-[34px]"
              style={{ ...display, color: C.fg }}
            >
              {opdracht.titel}
            </h1>
            <p className="mt-2 text-[13px]" style={{ ...mono, color: C.fgSoft }}>
              {opdracht.opdrachtgever} · {opdracht.plaats}
            </p>
          </div>
          <MatchDial value={opdracht.match} size={94} />
        </div>
      </Panel>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {feiten.map((m) => (
          <Panel key={m.l} className="p-4">
            <m.Icon size={16} style={{ color: C.amber }} aria-hidden="true" />
            <div
              className="mt-3 text-[16px] font-bold tabular-nums leading-none"
              style={{ ...display, color: C.fg }}
            >
              {m.v}
            </div>
            <div
              className="mt-2 text-[9px] font-bold uppercase tracking-[0.16em]"
              style={{ ...mono, color: C.fgFaint }}
            >
              {m.l}
            </div>
          </Panel>
        ))}
      </div>

      {/* Verklaarbare matching — bewijs voor & tegen */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <Panel>
          <PanelHead right={<ThumbsUp size={14} style={{ color: C.fgSoft }} aria-hidden="true" />}>
            Pleit vóór
          </PanelHead>
          <ul className="space-y-3 p-4">
            {opdracht.redenen.plus.map((r) => (
              <li
                key={r}
                className="flex items-start gap-3 text-[13px] leading-snug"
                style={{ color: C.fgSoft }}
              >
                <ShapeGlyph shape="diamond" size={9} />
                <span>{r}</span>
              </li>
            ))}
          </ul>
        </Panel>
        <Panel>
          <PanelHead
            right={<ThumbsDown size={14} style={{ color: C.fgSoft }} aria-hidden="true" />}
          >
            Twijfel
          </PanelHead>
          <ul className="space-y-3 p-4">
            {opdracht.redenen.min.map((r) => (
              <li
                key={r}
                className="flex items-start gap-3 text-[13px] leading-snug"
                style={{ color: C.fgSoft }}
              >
                <ShapeGlyph shape="dot" size={9} />
                <span>{r}</span>
              </li>
            ))}
          </ul>
        </Panel>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row">
        <button
          className="inline-flex flex-1 items-center justify-center gap-2 rounded-sm px-6 py-3.5 text-[12px] font-bold uppercase tracking-[0.16em] transition-transform hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
          style={{ ...mono, background: C.amber, color: C.bg }}
        >
          Reageer op deze zaak <ArrowRight size={15} aria-hidden="true" />
        </button>
        <button
          className="inline-flex items-center justify-center gap-2 rounded-sm px-6 py-3.5 text-[12px] font-bold uppercase tracking-[0.16em] transition-colors hover:bg-[#17171b] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
          style={{ ...mono, border: `1px solid ${C.lineStrong}`, color: C.fg }}
        >
          Bewaar in dossier
        </button>
      </div>
    </div>
  );
}

// ── Verificatie ──────────────────────────────────────────────────────────────────
function Verificatie() {
  const verified = CREDENTIALS.filter((c) => c.status === "VERIFIED").length;
  const pct = Math.round((verified / CREDENTIALS.length) * 100);
  return (
    <div className="space-y-5">
      <div className="flex items-center gap-3">
        <ShieldCheck size={18} style={{ color: C.amber }} aria-hidden="true" />
        <h2
          className="text-[22px] font-bold tracking-[-0.01em]"
          style={{ ...display, color: C.fg }}
        >
          Bewijsstukken
        </h2>
      </div>

      {/* Vormlegenda — status wordt met vorm gecommuniceerd, niet met kleur */}
      <Panel className="p-4">
        <div className="flex flex-wrap items-center gap-x-6 gap-y-3">
          <span
            className="text-[9.5px] font-bold uppercase tracking-[0.2em]"
            style={{ ...mono, color: C.fgFaint }}
          >
            Legenda
          </span>
          {(["VERIFIED", "SUBMITTED", "EXPIRING", "REJECTED"] as CredStatus[]).map((s) => {
            const m = credMeta(s);
            return (
              <span
                key={s}
                className="inline-flex items-center gap-2 text-[11px]"
                style={{ color: C.fgSoft }}
              >
                <ShapeGlyph shape={m.shape} size={9} />
                {m.label}
              </span>
            );
          })}
        </div>
      </Panel>

      <Panel>
        <PanelHead
          right={
            <span
              className="text-[10px] font-bold uppercase tabular-nums tracking-[0.14em]"
              style={{ ...mono, color: C.amber }}
            >
              {pct}% compleet
            </span>
          }
        >
          Vertrouwensketen
        </PanelHead>
        <ul className="divide-y" style={{ borderColor: C.line }}>
          {CREDENTIALS.map((c, i) => {
            const m = credMeta(c.status);
            const actionable = c.status !== "VERIFIED";
            return (
              <li key={c.naam} className="flex flex-wrap items-center gap-4 px-4 py-4">
                <span
                  className="text-[12px] font-bold tabular-nums"
                  style={{ ...mono, color: C.fgFaint }}
                >
                  {String(i + 1).padStart(2, "0")}
                </span>
                <span
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-sm"
                  style={{ border: `1px solid ${C.lineStrong}`, background: C.panelSoft }}
                  aria-hidden="true"
                >
                  <m.Icon size={17} strokeWidth={2.2} style={{ color: C.fg }} />
                </span>
                <div className="min-w-0 flex-1">
                  <div className="text-[14px] font-bold" style={{ ...display, color: C.fg }}>
                    {c.naam}
                  </div>
                  <div className="text-[11.5px]" style={{ ...mono, color: C.fgFaint }}>
                    {c.detail}
                  </div>
                </div>
                <StatusChip status={c.status} />
                <button
                  disabled={!actionable}
                  className="rounded-sm px-3.5 py-2 text-[10px] font-bold uppercase tracking-[0.14em] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-40"
                  style={{
                    ...mono,
                    background: actionable ? C.amber : "transparent",
                    color: actionable ? C.bg : C.fgFaint,
                    border: `1px solid ${actionable ? C.amber : C.line}`,
                  }}
                >
                  {actionable ? "Herstel" : "Compleet"}
                </button>
              </li>
            );
          })}
        </ul>
      </Panel>
    </div>
  );
}

// ── Acties ───────────────────────────────────────────────────────────────────────
function Acties() {
  const sorted = [...ACTIES].sort((a, b) =>
    a.urgentie === b.urgentie ? 0 : a.urgentie === "warning" ? -1 : 1,
  );
  return (
    <div className="space-y-5">
      <h2 className="text-[22px] font-bold tracking-[-0.01em]" style={{ ...display, color: C.fg }}>
        Volgende zet
      </h2>
      <ol className="space-y-4">
        {sorted.map((a, i) => {
          const dringt = a.urgentie === "warning";
          return (
            <li key={a.titel}>
              <Panel lit={dringt} className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center">
                <span
                  className="flex h-11 w-11 shrink-0 items-center justify-center rounded-sm text-[16px] font-bold tabular-nums"
                  style={{
                    ...display,
                    border: `1px solid ${dringt ? C.amberDim : C.lineStrong}`,
                    background: C.panelSoft,
                    color: dringt ? C.amber : C.fg,
                  }}
                  aria-hidden="true"
                >
                  {i + 1}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    {dringt ? (
                      <AlertTriangle
                        size={15}
                        strokeWidth={2.4}
                        style={{ color: C.amber }}
                        aria-hidden="true"
                      />
                    ) : (
                      <ShapeGlyph shape="ring" size={10} />
                    )}
                    <h3 className="text-[15px] font-bold" style={{ ...display, color: C.fg }}>
                      {a.titel}
                    </h3>
                    <span
                      className="text-[9px] font-bold uppercase tracking-[0.18em]"
                      style={{ ...mono, color: dringt ? C.amber : C.fgFaint }}
                    >
                      {dringt ? "Dringt" : "Ter info"}
                    </span>
                  </div>
                  <p className="mt-1.5 text-[13px] leading-relaxed" style={{ color: C.fgSoft }}>
                    {a.detail}
                  </p>
                </div>
                <button
                  className="shrink-0 self-start rounded-sm px-5 py-2.5 text-[10.5px] font-bold uppercase tracking-[0.14em] transition-transform hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 sm:self-center"
                  style={{
                    ...mono,
                    background: dringt ? C.amber : "transparent",
                    color: dringt ? C.bg : C.fg,
                    border: `1px solid ${dringt ? C.amber : C.lineStrong}`,
                  }}
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

// ── Facturen ─────────────────────────────────────────────────────────────────────
function Facturen() {
  // Status via vorm/label, niet via kleur. Amber alleen als aandacht-accent bij "Openstaand".
  const meta = (status: string): { shape: Shape; accent: boolean } => {
    if (status === "Betaald") return { shape: "diamond", accent: false };
    if (status === "Openstaand") return { shape: "dot", accent: true };
    return { shape: "ring", accent: false };
  };
  const open = FACTUREN.filter((f) => f.status === "Openstaand").length;
  const total = "€ 8.622";
  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2
          className="text-[22px] font-bold tracking-[-0.01em]"
          style={{ ...display, color: C.fg }}
        >
          Rekeningen
        </h2>
        <button
          className="inline-flex items-center gap-2 rounded-sm px-4 py-2.5 text-[10.5px] font-bold uppercase tracking-[0.14em] transition-transform hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
          style={{ ...mono, background: C.amber, color: C.bg }}
        >
          <Plus size={14} aria-hidden="true" /> Nieuwe factuur
        </button>
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
        {[
          { l: "Betaald (mnd)", v: total },
          { l: "Openstaand", v: `${open}` },
          { l: "Concept", v: `${FACTUREN.filter((f) => f.status === "Concept").length}` },
        ].map((s) => (
          <Panel key={s.l} className="p-4">
            <span
              className="text-[9px] font-bold uppercase tracking-[0.18em]"
              style={{ ...mono, color: C.fgFaint }}
            >
              {s.l}
            </span>
            <div
              className="mt-2 text-[24px] font-bold tabular-nums leading-none"
              style={{ ...display, color: C.fg }}
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
                  className={`px-4 py-3 text-[9px] font-bold uppercase tracking-[0.18em] ${i === 4 ? "text-right" : ""}`}
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
                  className="transition-colors hover:bg-[#17171b]"
                  style={{ borderBottom: `1px solid ${C.line}` }}
                >
                  <td
                    className="px-4 py-3.5 text-[12px] tabular-nums"
                    style={{ ...mono, color: C.fgSoft }}
                  >
                    {f.nr}
                  </td>
                  <td className="px-4 py-3.5 text-[13px] font-semibold" style={{ color: C.fg }}>
                    {f.klant}
                  </td>
                  <td
                    className="px-4 py-3.5 text-[12px] tabular-nums"
                    style={{ ...mono, color: C.fgSoft }}
                  >
                    {f.datum}
                  </td>
                  <td className="px-4 py-3.5">
                    <span
                      className="inline-flex items-center gap-2 rounded-sm px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.14em]"
                      style={{
                        ...mono,
                        border: `1px solid ${m.accent ? C.amberDim : C.line}`,
                        color: m.accent ? C.amber : C.fgSoft,
                        background: m.accent ? "rgba(232,176,75,0.08)" : C.panelSoft,
                      }}
                    >
                      <ShapeGlyph shape={m.shape} size={8} />
                      {f.status}
                    </span>
                  </td>
                  <td
                    className="px-4 py-3.5 text-right text-[14px] font-bold tabular-nums"
                    style={{ ...display, color: C.fg }}
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
                className="px-4 py-4 text-[9px] font-bold uppercase tracking-[0.18em]"
                style={{ ...mono, color: C.fgFaint }}
              >
                Totaal betaald
              </td>
              <td
                className="px-4 py-4 text-right text-[18px] font-bold tabular-nums"
                style={{ ...display, color: C.amber }}
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
