"use client";

// Concept 419 — "Volt" · High-voltage electric / neon-industrieel.
// Een donker antraciet schakelbord (#111318) met acid-lime accent (#c6f24e) en koud staalgrijs.
// Industriële energie-taal: dunne circuit-verbindingslijnen tussen componenten, energie-/laadmeters
// als voortgang, een subtiele spannings-glow op actieve elementen (box-shadow, met motion-reduce
// respect) en technische mono-labels. Denk aan een energiemonitor / schakelpaneel. Scherp, technisch,
// high-contrast. Lime is nooit de enige status-drager; label + icoon dragen de betekenis.

import { useMemo, useState } from "react";
import {
  Activity,
  AlertTriangle,
  ArrowRight,
  BatteryCharging,
  Bell,
  Check,
  ChevronRight,
  CircuitBoard,
  Clock,
  Command,
  Cpu,
  FileText,
  Gauge,
  Minus,
  Plus,
  Search,
  ShieldCheck,
  Signal,
  Zap,
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
  BERICHTEN,
  DOCUMENTEN,
  type ScreenKey,
  type CredStatus,
  type Opdracht,
} from "./mock";

// — Palet: antraciet schakelbord, acid-lime spanning, koud staal —
const C = {
  bg: "#111318",
  bgDeep: "#0b0d11",
  panel: "#171a21",
  panelHi: "#1d212a",
  raise: "#222732",
  steel: "#2b3140",
  line: "rgba(198,242,78,0.14)",
  lineSteel: "rgba(148,163,184,0.16)",
  lineFaint: "rgba(148,163,184,0.09)",
  ink: "#eef2f6",
  inkSoft: "#c2ccd8",
  inkMute: "#8b97a6",
  inkFaint: "#5d6775",
  lime: "#c6f24e",
  limeHi: "#dbff6e",
  limeDeep: "#8fb62f",
  limeWash: "rgba(198,242,78,0.12)",
  limeGlow: "rgba(198,242,78,0.35)",
  cyan: "#5cc9d6",
  cyanInk: "#8fe0ea",
  cyanWash: "rgba(92,201,214,0.14)",
  ok: "#7ed957",
  okInk: "#a8ea86",
  okWash: "rgba(126,217,87,0.14)",
  warn: "#f0b429",
  warnInk: "#f7cf63",
  warnWash: "rgba(240,180,41,0.14)",
  bad: "#f2617a",
  badInk: "#f78ea0",
  badWash: "rgba(242,97,122,0.16)",
};

const mono = {
  fontFamily:
    "'Geist Mono', 'JetBrains Mono', ui-monospace, SFMono-Regular, Menlo, Consolas, monospace",
};
const body = {
  fontFamily: "'Geist', 'Inter', 'Segoe UI', system-ui, -apple-system, sans-serif",
};
const num = {
  fontFamily: "'Geist Mono', 'JetBrains Mono', ui-monospace, SFMono-Regular, Menlo, monospace",
  fontVariantNumeric: "tabular-nums" as const,
};

function statusMeta(s: CredStatus): {
  label: string;
  Icon: LucideIcon;
  alarm: boolean;
  tone: string;
  ink: string;
  wash: string;
} {
  switch (s) {
    case "VERIFIED":
      return {
        label: "Geverifieerd",
        Icon: ShieldCheck,
        alarm: false,
        tone: C.ok,
        ink: C.okInk,
        wash: C.okWash,
      };
    case "SUBMITTED":
      return {
        label: "In beoordeling",
        Icon: Clock,
        alarm: false,
        tone: C.cyan,
        ink: C.cyanInk,
        wash: C.cyanWash,
      };
    case "EXPIRING":
      return {
        label: "Verloopt binnenkort",
        Icon: AlertTriangle,
        alarm: true,
        tone: C.warn,
        ink: C.warnInk,
        wash: C.warnWash,
      };
    case "REJECTED":
      return {
        label: "Afgewezen",
        Icon: AlertTriangle,
        alarm: true,
        tone: C.bad,
        ink: C.badInk,
        wash: C.badWash,
      };
  }
}

// — Paneel: donker schakelbord-segment met dunne circuit-rand en optionele spannings-glow —
function Panel({
  children,
  className = "",
  as: Tag = "div",
  live = false,
}: {
  children: React.ReactNode;
  className?: string;
  as?: "div" | "section" | "li";
  live?: boolean;
}) {
  return (
    <Tag
      className={`relative overflow-hidden rounded-lg ${className}`}
      style={{
        background: live ? `linear-gradient(180deg, ${C.panelHi} 0%, ${C.panel} 100%)` : C.panel,
        border: `1px solid ${live ? C.line : C.lineSteel}`,
        boxShadow: live
          ? `inset 0 1px 0 rgba(255,255,255,0.03), 0 0 0 1px rgba(198,242,78,0.05), 0 18px 40px rgba(0,0,0,0.5)`
          : "inset 0 1px 0 rgba(255,255,255,0.02), 0 12px 28px rgba(0,0,0,0.42)",
        color: C.ink,
      }}
    >
      {children}
    </Tag>
  );
}

// — Circuit-hoekmarkeringen: technische "solder pads" in de hoeken van een live paneel —
function CircuitCorners() {
  return (
    <div className="pointer-events-none absolute inset-0" aria-hidden="true">
      <span
        className="absolute left-2 top-2 h-2 w-2 rounded-[2px]"
        style={{ border: `1px solid ${C.limeGlow}` }}
      />
      <span
        className="absolute right-2 top-2 h-2 w-2 rounded-[2px]"
        style={{ border: `1px solid ${C.limeGlow}` }}
      />
      <span
        className="absolute bottom-2 left-2 h-2 w-2 rounded-[2px]"
        style={{ border: `1px solid ${C.limeGlow}` }}
      />
      <span
        className="absolute bottom-2 right-2 h-2 w-2 rounded-[2px]"
        style={{ border: `1px solid ${C.limeGlow}` }}
      />
    </div>
  );
}

function Eyebrow({ children, tone = C.lime }: { children: React.ReactNode; tone?: string }) {
  return (
    <p
      className="flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.24em]"
      style={{ color: tone, ...mono }}
    >
      <span
        aria-hidden="true"
        className="volt-pulse inline-block h-1.5 w-1.5 rounded-full"
        style={{ background: tone, boxShadow: `0 0 8px ${tone}` }}
      />
      {children}
    </p>
  );
}

function Chip({
  children,
  tone,
  ink,
  wash,
  alarm = false,
}: {
  children: React.ReactNode;
  tone: string;
  ink: string;
  wash: string;
  alarm?: boolean;
}) {
  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-md px-2.5 py-1 text-[11px] font-semibold"
      style={{ color: ink, background: wash, border: `1px solid ${tone}`, ...body }}
    >
      {children}
      {alarm && <span className="sr-only"> (let op)</span>}
    </span>
  );
}

function PrimaryButton({
  children,
  onClick,
  className = "",
}: {
  children: React.ReactNode;
  onClick?: () => void;
  className?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`group inline-flex items-center justify-center gap-2 rounded-md px-5 py-2.5 text-[13px] font-bold uppercase tracking-[0.06em] transition-all duration-200 hover:brightness-105 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#dbff6e] focus-visible:ring-offset-2 focus-visible:ring-offset-[#111318] active:translate-y-px motion-reduce:transition-none ${className}`}
      style={{
        color: C.bgDeep,
        background: `linear-gradient(160deg, ${C.limeHi}, ${C.lime})`,
        boxShadow: `0 0 0 1px ${C.limeDeep}, 0 0 22px ${C.limeGlow}, 0 8px 18px rgba(0,0,0,0.5)`,
        ...body,
      }}
    >
      {children}
    </button>
  );
}

function GhostButton({
  children,
  onClick,
  active = false,
  className = "",
  ariaPressed,
}: {
  children: React.ReactNode;
  onClick?: () => void;
  active?: boolean;
  className?: string;
  ariaPressed?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={ariaPressed}
      className={`inline-flex items-center justify-center gap-2 rounded-md px-4 py-2.5 text-[12.5px] font-semibold transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#c6f24e] focus-visible:ring-offset-2 focus-visible:ring-offset-[#111318] motion-reduce:transition-none ${className}`}
      style={{
        color: active ? C.bgDeep : C.inkSoft,
        background: active ? C.lime : "transparent",
        border: `1px solid ${active ? C.lime : C.lineSteel}`,
        ...body,
      }}
    >
      {children}
    </button>
  );
}

// — Signaal-sparkline: hoekige "oscilloscoop"-curve met glow-eindpunt —
function SignalLine({ data, tone, id }: { data: number[]; tone: string; id: string }) {
  const max = Math.max(...data);
  const min = Math.min(...data);
  const span = max - min || 1;
  const w = 120;
  const h = 30;
  const pts = data.map((d, i) => {
    const x = (i / (data.length - 1)) * w;
    const y = h - ((d - min) / span) * (h - 7) - 3.5;
    return [x, y] as const;
  });
  const line = pts.map(([x, y]) => `${x.toFixed(1)},${y.toFixed(1)}`).join(" ");
  const last = pts[pts.length - 1]!;
  return (
    <svg
      width="100%"
      height={h}
      viewBox={`0 0 ${w} ${h}`}
      preserveAspectRatio="none"
      aria-hidden="true"
      className="overflow-visible"
    >
      <defs>
        <linearGradient id={`sig-${id}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={tone} stopOpacity="0.28" />
          <stop offset="100%" stopColor={tone} stopOpacity="0" />
        </linearGradient>
      </defs>
      <polygon points={`0,${h} ${line} ${w},${h}`} fill={`url(#sig-${id})`} />
      <polyline
        points={line}
        fill="none"
        stroke={tone}
        strokeWidth="1.6"
        strokeLinecap="square"
        strokeLinejoin="miter"
      />
      <circle cx={last[0]} cy={last[1]} r="2.6" fill={tone} />
      <circle cx={last[0]} cy={last[1]} r="5" fill="none" stroke={tone} strokeOpacity="0.4" />
    </svg>
  );
}

// — Laadmeter: horizontale energie-balk met segmenten, als een accu-/vermogensmeter —
function ChargeMeter({ value, tone = C.lime }: { value: number; tone?: string }) {
  return (
    <span className="hidden items-center gap-2.5 sm:flex" aria-hidden="true">
      <span
        className="relative h-2 w-24 overflow-hidden rounded-sm"
        style={{ background: C.steel }}
      >
        <span
          className="block h-full rounded-sm"
          style={{
            width: `${value}%`,
            background: `linear-gradient(90deg, ${C.limeDeep}, ${tone})`,
            boxShadow: `0 0 10px ${tone}`,
          }}
        />
      </span>
      <span className="text-[12.5px] font-bold" style={{ color: tone, ...num }}>
        {value}%
      </span>
    </span>
  );
}

// — Verticale circuit-connector tussen twee gestapelde blokken —
function Connector() {
  return (
    <div className="flex justify-center py-1" aria-hidden="true">
      <span
        className="block h-5 w-px"
        style={{
          background: `linear-gradient(180deg, transparent, ${C.limeGlow}, transparent)`,
        }}
      />
    </div>
  );
}

export function Concept419() {
  const [screen, setScreen] = useState<ScreenKey>("dashboard");
  const [cmd, setCmd] = useState(false);
  const active = OPDRACHTEN[0] as Opdracht;

  return (
    <div
      className="relative min-h-[720px] w-full antialiased"
      style={{
        ...body,
        color: C.ink,
        background: `radial-gradient(120% 90% at 82% -6%, ${C.bg} 0%, ${C.bgDeep} 62%, #070809 100%)`,
      }}
    >
      {/* keyframes — spannings-puls, gerespecteerd bij prefers-reduced-motion */}
      <style>{`
        @keyframes voltPulse { 0%,100% { opacity: 1; } 50% { opacity: 0.45; } }
        .volt-pulse { animation: voltPulse 2.4s ease-in-out infinite; }
        @media (prefers-reduced-motion: reduce) { .volt-pulse { animation: none !important; } }
      `}</style>

      {/* fijne blueprint-raster achtergrond */}
      <div
        className="pointer-events-none absolute inset-0"
        aria-hidden="true"
        style={{
          backgroundImage: `linear-gradient(${C.lineFaint} 1px, transparent 1px), linear-gradient(90deg, ${C.lineFaint} 1px, transparent 1px)`,
          backgroundSize: "40px 40px",
          maskImage: "radial-gradient(80% 60% at 50% 0%, black, transparent 85%)",
          WebkitMaskImage: "radial-gradient(80% 60% at 50% 0%, black, transparent 85%)",
        }}
      />

      <div className="relative mx-auto max-w-6xl px-4 pb-24 sm:px-6 md:px-8">
        <TopBar onCmd={() => setCmd(true)} />
        <NavBar screen={screen} setScreen={setScreen} />
        <main className="pt-6">
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

      {cmd && <CommandMenu onClose={() => setCmd(false)} setScreen={setScreen} />}
    </div>
  );
}

function TopBar({ onCmd }: { onCmd: () => void }) {
  const ongelezen = BERICHTEN.filter((b) => b.ongelezen).length;
  return (
    <header className="flex items-center justify-between gap-4 pt-7">
      <div className="flex items-center gap-3.5">
        <span
          className="relative inline-flex h-11 w-11 items-center justify-center rounded-lg"
          style={{
            background: C.bgDeep,
            border: `1px solid ${C.lime}`,
            color: C.lime,
            boxShadow: `0 0 18px ${C.limeGlow}`,
          }}
          aria-hidden="true"
        >
          <Zap size={19} />
        </span>
        <div>
          <p
            className="text-[19px] font-bold leading-none tracking-[0.02em]"
            style={{ color: C.ink, ...body }}
          >
            VOLT
          </p>
          <p
            className="mt-1.5 flex items-center gap-1.5 text-[10px] uppercase leading-none tracking-[0.18em]"
            style={{ color: C.inkFaint, ...mono }}
          >
            <Signal size={10} aria-hidden="true" style={{ color: C.lime }} />
            {PROFIEL.plaats} · net actief
          </p>
        </div>
      </div>
      <div className="flex items-center gap-2.5">
        <button
          type="button"
          onClick={onCmd}
          className="hidden items-center gap-2 rounded-md px-3 py-2 text-[12px] font-semibold transition-colors hover:brightness-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#c6f24e] focus-visible:ring-offset-2 focus-visible:ring-offset-[#111318] sm:inline-flex"
          style={{
            color: C.inkMute,
            background: C.panel,
            border: `1px solid ${C.lineSteel}`,
            ...mono,
          }}
        >
          <Command size={13} aria-hidden="true" />
          <span>K</span>
        </button>
        <span
          className="hidden items-center gap-1.5 rounded-md px-3 py-1.5 text-[11px] font-semibold sm:inline-flex"
          style={{ color: C.okInk, border: `1px solid ${C.ok}`, background: C.okWash, ...body }}
        >
          <ShieldCheck size={12} aria-hidden="true" />
          {PROFIEL.trust}
        </span>
        <span
          className="relative inline-flex h-10 w-10 items-center justify-center rounded-md"
          style={{ background: C.panel, border: `1px solid ${C.lineSteel}`, color: C.inkMute }}
          aria-label={`${ongelezen} ongelezen berichten`}
        >
          <Bell size={16} aria-hidden="true" />
          {ongelezen > 0 && (
            <span
              className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full text-[9px] font-bold"
              style={{ background: C.lime, color: C.bgDeep, ...num }}
              aria-hidden="true"
            >
              {ongelezen}
            </span>
          )}
        </span>
        <span className="hidden text-right sm:block">
          <span className="block text-[13.5px] font-semibold" style={{ color: C.ink, ...body }}>
            {PROFIEL.naam}
          </span>
          <span className="block text-[10.5px]" style={{ color: C.inkFaint, ...mono }}>
            {PROFIEL.rol}
          </span>
        </span>
        <span
          className="inline-flex h-11 w-11 items-center justify-center rounded-lg text-[13px] font-bold"
          style={{
            background: C.bgDeep,
            border: `1px solid ${C.lime}`,
            color: C.lime,
            ...num,
          }}
          aria-hidden="true"
        >
          {PROFIEL.initialen}
        </span>
      </div>
    </header>
  );
}

function NavBar({ screen, setScreen }: { screen: ScreenKey; setScreen: (s: ScreenKey) => void }) {
  return (
    <nav aria-label="Hoofdnavigatie" className="mt-6">
      <div
        className="flex items-center gap-1 overflow-x-auto rounded-lg p-1.5"
        style={{ background: C.bgDeep, border: `1px solid ${C.lineSteel}` }}
      >
        {SCREENS.map((s) => {
          const on = s.key === screen;
          return (
            <button
              key={s.key}
              type="button"
              onClick={() => setScreen(s.key)}
              aria-current={on ? "page" : undefined}
              className="flex shrink-0 items-center gap-2 rounded-md px-4 py-2 text-[12.5px] font-semibold uppercase tracking-[0.04em] transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#c6f24e] focus-visible:ring-offset-2 focus-visible:ring-offset-[#0b0d11] motion-reduce:transition-none"
              style={{
                color: on ? C.bgDeep : C.inkMute,
                background: on ? C.lime : "transparent",
                boxShadow: on ? `0 0 16px ${C.limeGlow}` : "none",
                ...body,
              }}
            >
              {s.label}
            </button>
          );
        })}
      </div>
    </nav>
  );
}

function Dashboard({ onOpen, onActies }: { onOpen: () => void; onActies: () => void }) {
  const primair = ACTIES[0] as (typeof ACTIES)[number];
  const verified = CREDENTIALS.filter((c) => c.status === "VERIFIED").length;
  return (
    <div className="space-y-6">
      <section className="grid grid-cols-1 gap-5 lg:grid-cols-[1.35fr_1fr]">
        <Panel className="p-6 md:p-8" live>
          <CircuitCorners />
          <div className="relative">
            <Eyebrow>Systeem · online</Eyebrow>
            <div className="mt-4 flex items-start justify-between gap-4">
              <h1
                className="text-[30px] font-bold leading-[1.05] tracking-[-0.01em] md:text-[40px]"
                style={{ color: C.ink, ...body }}
              >
                Goedemorgen,
                <br />
                <span style={{ color: C.lime }}>{PROFIEL.naam.split(" ")[0]}.</span>
              </h1>
              <Cpu
                size={30}
                aria-hidden="true"
                style={{ color: C.limeDeep }}
                className="hidden sm:block"
              />
            </div>
            <p className="mt-3 max-w-md text-[13.5px] leading-relaxed" style={{ color: C.inkMute }}>
              Je praktijk draait op volle spanning. Alle kritieke circuits staan onder stroom — werk
              de open acties af om het net stabiel en betaald te houden.
            </p>
            <div className="mt-5 flex flex-wrap items-center gap-2.5">
              <PrimaryButton onClick={onActies}>
                Volgende actie
                <ArrowRight
                  size={14}
                  aria-hidden="true"
                  className="transition-transform group-hover:translate-x-0.5 motion-reduce:transition-none"
                />
              </PrimaryButton>
              <GhostButton onClick={onOpen}>Marktplaats</GhostButton>
            </div>
          </div>
        </Panel>

        <Panel className="p-6" live>
          <div className="flex items-center justify-between">
            <Eyebrow tone={C.warnInk}>Prioriteit · hoog</Eyebrow>
            <AlertTriangle size={18} aria-hidden="true" style={{ color: C.warn }} />
          </div>
          <h2 className="mt-4 text-[19px] font-bold leading-snug" style={{ color: C.ink, ...body }}>
            {primair.titel}
          </h2>
          <p className="mt-2 text-[13px] leading-relaxed" style={{ color: C.inkMute }}>
            {primair.detail}
          </p>
          <div className="mt-5">
            <PrimaryButton onClick={onActies} className="w-full">
              {primair.cta}
              <ArrowRight size={14} aria-hidden="true" />
            </PrimaryButton>
          </div>
          <div className="mt-4 pt-3" style={{ borderTop: `1px solid ${C.lineFaint}` }}>
            <p
              className="flex items-center gap-2 text-[11px]"
              style={{ color: C.inkFaint, ...num }}
            >
              <BatteryCharging size={13} aria-hidden="true" style={{ color: C.ok }} />
              {verified}/{CREDENTIALS.length} certificaten geladen · 7 open reacties
            </p>
          </div>
        </Panel>
      </section>

      <section>
        <div className="mb-3">
          <Eyebrow>Vermogensmeters · deze maand</Eyebrow>
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {KPIS.map((k, i) => (
            <Panel key={k.label} className="p-4">
              <div className="flex items-start justify-between gap-2">
                <p
                  className="text-[10px] font-semibold uppercase tracking-[0.12em]"
                  style={{ color: C.inkMute, ...mono }}
                >
                  {k.label}
                </p>
                <span
                  className="inline-flex items-center gap-0.5 rounded px-1.5 py-0.5 text-[9.5px] font-bold"
                  style={{
                    color: k.up ? C.okInk : C.warnInk,
                    background: k.up ? C.okWash : C.warnWash,
                    ...num,
                  }}
                >
                  {k.up ? "▲" : "▼"} {k.trend.replace(/^[+-]/, "")}
                </span>
              </div>
              <p
                className="mt-2.5 text-[26px] font-bold leading-none tracking-[-0.02em]"
                style={{ color: C.ink, ...num }}
              >
                {k.value}
              </p>
              <div className="mt-3">
                <SignalLine data={k.spark} tone={k.up ? C.lime : C.warn} id={`kpi-${i}`} />
              </div>
            </Panel>
          ))}
        </div>
      </section>

      <section className="grid grid-cols-1 gap-5 lg:grid-cols-[1.4fr_1fr]">
        <div>
          <div className="mb-3 flex items-baseline justify-between">
            <Eyebrow>Live feed · open opdrachten</Eyebrow>
            <button
              type="button"
              onClick={onOpen}
              className="rounded text-[10.5px] font-semibold uppercase tracking-[0.14em] transition-colors hover:brightness-125 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#c6f24e] focus-visible:ring-offset-2 focus-visible:ring-offset-[#111318]"
              style={{ color: C.lime, ...mono }}
            >
              Alles →
            </button>
          </div>
          <Panel>
            <ul>
              {OPDRACHTEN.map((o, i) => (
                <li key={o.id} style={{ borderTop: i === 0 ? "none" : `1px solid ${C.lineFaint}` }}>
                  <button
                    type="button"
                    onClick={onOpen}
                    className="group grid w-full grid-cols-[auto_1fr_auto] items-center gap-3.5 px-4 py-3.5 text-left transition-colors hover:bg-[#1d212a] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#c6f24e] motion-reduce:transition-none"
                  >
                    <span
                      className="inline-flex h-10 w-10 items-center justify-center rounded-md"
                      style={{
                        background: C.bgDeep,
                        border: `1px solid ${i === 0 ? C.lime : C.lineSteel}`,
                        boxShadow: i === 0 ? `0 0 12px ${C.limeGlow}` : "none",
                      }}
                    >
                      <span
                        className="text-[12px] font-bold leading-none"
                        style={{ color: i === 0 ? C.limeHi : C.inkMute, ...num }}
                      >
                        {o.match}
                      </span>
                    </span>
                    <span className="min-w-0">
                      <span
                        className="block truncate text-[14.5px] font-semibold"
                        style={{ color: C.ink, ...body }}
                      >
                        {o.titel}
                      </span>
                      <span
                        className="mt-0.5 block truncate text-[11.5px]"
                        style={{ color: C.inkMute }}
                      >
                        {o.opdrachtgever} · {o.plaats} · {o.tarief}
                      </span>
                    </span>
                    <span className="flex items-center gap-3">
                      <ChargeMeter value={o.match} tone={o.match >= 90 ? C.lime : C.cyan} />
                      <ChevronRight
                        size={17}
                        aria-hidden="true"
                        className="transition-transform group-hover:translate-x-0.5 motion-reduce:transition-none"
                        style={{ color: C.inkFaint }}
                      />
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          </Panel>
        </div>

        <div>
          <div className="mb-3">
            <Eyebrow>Certificaat-circuits</Eyebrow>
          </div>
          <Panel className="p-4">
            <ul className="space-y-1">
              {CREDENTIALS.map((c, i) => {
                const st = statusMeta(c.status);
                return (
                  <li
                    key={c.naam}
                    className="flex items-center gap-3 py-2"
                    style={{ borderTop: i === 0 ? "none" : `1px solid ${C.lineFaint}` }}
                  >
                    <span
                      className="inline-flex h-8 w-8 items-center justify-center rounded-md"
                      style={{ color: st.ink, background: st.wash, border: `1px solid ${st.tone}` }}
                      aria-hidden="true"
                    >
                      <st.Icon size={14} />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span
                        className="block truncate text-[12.5px] font-semibold"
                        style={{ color: C.ink }}
                      >
                        {c.naam}
                      </span>
                      <span className="block truncate text-[10.5px]" style={{ color: C.inkMute }}>
                        {st.label}
                      </span>
                    </span>
                  </li>
                );
              })}
            </ul>
          </Panel>
        </div>
      </section>
    </div>
  );
}

function Marktplaats({ onOpen }: { onOpen: () => void }) {
  const [q, setQ] = useState("");
  const [sort, setSort] = useState<"match" | "tarief">("match");
  const [loading, setLoading] = useState(false);

  const filtered = useMemo(() => {
    const needle = q.toLowerCase().trim();
    const list = OPDRACHTEN.filter(
      (o) =>
        o.titel.toLowerCase().includes(needle) ||
        o.plaats.toLowerCase().includes(needle) ||
        o.opdrachtgever.toLowerCase().includes(needle),
    );
    return [...list].sort((a, b) =>
      sort === "match"
        ? b.match - a.match
        : parseInt(b.tarief.replace(/\D/g, ""), 10) - parseInt(a.tarief.replace(/\D/g, ""), 10),
    );
  }, [q, sort]);

  return (
    <div className="space-y-6">
      <div>
        <Eyebrow>Marktplaats · signaal binnen</Eyebrow>
        <h1
          className="mt-3 text-[30px] font-bold leading-none tracking-[-0.01em]"
          style={{ color: C.ink, ...body }}
        >
          Open opdrachten
        </h1>
        <p
          className="mt-2 text-[12px] uppercase tracking-[0.1em]"
          style={{ color: C.inkMute, ...mono }}
        >
          {String(filtered.length).padStart(2, "0")} / {String(OPDRACHTEN.length).padStart(2, "0")}{" "}
          kanalen actief
        </p>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div
          className="flex flex-1 items-center gap-2.5 rounded-md px-4 py-3"
          style={{ background: C.bgDeep, border: `1px solid ${C.lineSteel}` }}
        >
          <Search size={16} aria-hidden="true" style={{ color: C.inkFaint }} />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Filter op titel, plaats of opdrachtgever…"
            aria-label="Opdrachten zoeken"
            className="w-full bg-transparent text-[13px] outline-none placeholder:text-[#5d6775]"
            style={{ color: C.ink, ...body }}
          />
        </div>
        <div className="flex items-center gap-2" role="group" aria-label="Sorteren">
          {(["match", "tarief"] as const).map((s) => (
            <GhostButton
              key={s}
              onClick={() => setSort(s)}
              active={sort === s}
              ariaPressed={sort === s}
            >
              {s === "match" ? "Match" : "Tarief"}
            </GhostButton>
          ))}
          <GhostButton onClick={() => setLoading((v) => !v)} active={loading} ariaPressed={loading}>
            {loading ? "Stop" : "Laden…"}
          </GhostButton>
        </div>
      </div>

      {loading ? (
        <ul className="space-y-4" aria-hidden="true">
          {[0, 1, 2].map((i) => (
            <li key={i}>
              <Panel className="p-5">
                <div className="volt-pulse space-y-3">
                  <div className="h-3 w-24 rounded" style={{ background: C.steel }} />
                  <div className="h-5 w-2/3 rounded" style={{ background: C.raise }} />
                  <div className="h-3 w-1/2 rounded" style={{ background: C.steel }} />
                  <div className="h-2 w-full rounded" style={{ background: C.steel }} />
                </div>
              </Panel>
            </li>
          ))}
        </ul>
      ) : filtered.length === 0 ? (
        <Panel live>
          <CircuitCorners />
          <div className="relative flex flex-col items-center px-6 py-16 text-center">
            <span
              className="inline-flex h-16 w-16 items-center justify-center rounded-lg"
              style={{ background: C.limeWash, border: `1px solid ${C.lime}`, color: C.lime }}
              aria-hidden="true"
            >
              <Signal size={26} />
            </span>
            <p className="mt-5 text-[20px] font-bold" style={{ color: C.ink, ...body }}>
              Geen signaal
            </p>
            <p className="mx-auto mt-2 max-w-xs text-[13px]" style={{ color: C.inkMute }}>
              Geen kanaal past bij {q ? `“${q}”` : "je filter"}. Verruim de zoekterm om meer op te
              vangen.
            </p>
            <div className="mt-6">
              <PrimaryButton onClick={() => setQ("")}>
                Filter wissen <ArrowRight size={14} aria-hidden="true" />
              </PrimaryButton>
            </div>
          </div>
        </Panel>
      ) : (
        <ul className="space-y-4">
          {filtered.map((o, i) => (
            <li key={o.id}>
              <MarktKaart opdracht={o} index={i} onOpen={onOpen} />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function MarktKaart({
  opdracht,
  index,
  onOpen,
}: {
  opdracht: Opdracht;
  index: number;
  onOpen: () => void;
}) {
  const [open, setOpen] = useState(false);
  const strong = opdracht.match >= 90;
  const tone = strong ? C.lime : C.cyan;
  const toneInk = strong ? C.limeHi : C.cyanInk;
  return (
    <Panel className="p-5" live={strong}>
      {strong && <CircuitCorners />}
      <div className="relative grid grid-cols-[1fr_auto] items-start gap-4">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span
              className="inline-flex items-center gap-1 rounded px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.1em]"
              style={{ color: C.inkMute, border: `1px solid ${C.lineSteel}`, ...num }}
            >
              CH-{String(index + 1).padStart(2, "0")}
            </span>
            <span className="text-[11px] font-semibold" style={{ color: C.inkFaint, ...num }}>
              {opdracht.id}
            </span>
          </div>
          <h3 className="mt-2 text-[18px] font-bold leading-snug" style={{ color: C.ink, ...body }}>
            {opdracht.titel}
          </h3>
          <p className="mt-1 text-[12px]" style={{ color: C.inkMute }}>
            {opdracht.opdrachtgever} · {opdracht.plaats} · {opdracht.uren}
          </p>
          <div className="mt-3 flex flex-wrap gap-1.5">
            {opdracht.tags.map((t) => (
              <span
                key={t}
                className="inline-flex items-center rounded px-2.5 py-0.5 text-[10.5px] font-semibold"
                style={{
                  color: C.inkSoft,
                  background: C.raise,
                  border: `1px solid ${C.lineFaint}`,
                  ...body,
                }}
              >
                {t}
              </span>
            ))}
          </div>
        </div>
        <div className="flex flex-col items-center gap-1.5">
          <span
            className="inline-flex h-14 w-14 flex-col items-center justify-center rounded-md"
            style={{
              background: C.bgDeep,
              border: `1.5px solid ${tone}`,
              boxShadow: strong ? `0 0 16px ${C.limeGlow}` : "none",
            }}
          >
            <span className="text-[16px] font-bold leading-none" style={{ color: toneInk, ...num }}>
              {opdracht.match}
            </span>
            <span
              className="mt-0.5 text-[7.5px] uppercase tracking-[0.12em]"
              style={{ color: C.inkFaint, ...mono }}
            >
              match
            </span>
          </span>
          <span className="text-[13px] font-bold" style={{ color: toneInk, ...num }}>
            {opdracht.tarief}
          </span>
        </div>
      </div>
      <div className="relative mt-4 flex items-center gap-3">
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          className="inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-[11.5px] font-semibold transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#c6f24e] focus-visible:ring-offset-2 focus-visible:ring-offset-[#171a21]"
          style={{ color: toneInk, border: `1px solid ${C.lineSteel}`, ...body }}
        >
          {open ? <Minus size={12} aria-hidden="true" /> : <Plus size={12} aria-hidden="true" />}
          Waarom deze match
        </button>
        <div className="ml-auto">
          <PrimaryButton onClick={onOpen}>
            Reageer <ArrowRight size={13} aria-hidden="true" />
          </PrimaryButton>
        </div>
      </div>
      <div
        className="relative grid transition-all duration-300 motion-reduce:transition-none"
        style={{ gridTemplateRows: open ? "1fr" : "0fr" }}
      >
        <div className="overflow-hidden">
          <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
            <RedenBlok
              titel="Onder stroom"
              tone={C.okInk}
              Icon={Check}
              items={opdracht.redenen.plus}
            />
            <RedenBlok
              titel="Weerstand"
              tone={C.warnInk}
              Icon={AlertTriangle}
              items={opdracht.redenen.min}
            />
          </div>
        </div>
      </div>
    </Panel>
  );
}

function RedenBlok({
  titel,
  tone,
  Icon,
  items,
}: {
  titel: string;
  tone: string;
  Icon: LucideIcon;
  items: string[];
}) {
  return (
    <div
      className="rounded-md p-4"
      style={{ background: C.bgDeep, border: `1px solid ${C.lineFaint}` }}
    >
      <p
        className="text-[10px] font-semibold uppercase tracking-[0.16em]"
        style={{ color: tone, ...mono }}
      >
        {titel}
      </p>
      <ul className="mt-2.5 space-y-2">
        {items.map((r) => (
          <li key={r} className="flex items-start gap-2 text-[12.5px]" style={{ color: C.inkSoft }}>
            <Icon
              size={13}
              aria-hidden="true"
              className="mt-0.5 shrink-0"
              style={{ color: tone }}
            />
            {r}
          </li>
        ))}
      </ul>
    </div>
  );
}

function OpdrachtDetail({ opdracht, onBack }: { opdracht: Opdracht; onBack: () => void }) {
  const strong = opdracht.match >= 90;
  const tone = strong ? C.lime : C.cyan;
  return (
    <div className="space-y-6">
      <button
        type="button"
        onClick={onBack}
        className="inline-flex items-center gap-2 rounded-md px-4 py-2 text-[12.5px] font-semibold transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#c6f24e] focus-visible:ring-offset-2 focus-visible:ring-offset-[#111318]"
        style={{ color: C.inkSoft, border: `1px solid ${C.lineSteel}`, ...body }}
      >
        <ArrowRight size={13} aria-hidden="true" className="rotate-180" /> Terug naar marktplaats
      </button>

      <Panel className="p-6 md:p-8" live>
        <CircuitCorners />
        <div className="relative flex flex-wrap items-center gap-2">
          <span
            className="inline-flex items-center rounded px-2.5 py-0.5 text-[10.5px] font-semibold"
            style={{ color: C.inkMute, border: `1px solid ${C.lineSteel}`, ...num }}
          >
            {opdracht.id}
          </span>
          <span
            className="inline-flex items-center gap-1 rounded px-2.5 py-0.5 text-[11px] font-bold"
            style={{ color: C.bgDeep, background: tone, ...body }}
          >
            <Zap size={11} aria-hidden="true" /> {strong ? "Hoog vermogen" : "Actief"} ·{" "}
            {opdracht.match}%
          </span>
        </div>
        <h1
          className="relative mt-4 max-w-2xl text-[28px] font-bold leading-[1.06] tracking-[-0.01em] md:text-[40px]"
          style={{ color: C.ink, ...body }}
        >
          {opdracht.titel}
        </h1>
        <p className="relative mt-2 text-[14px]" style={{ color: C.inkMute }}>
          {opdracht.opdrachtgever} · {opdracht.plaats}
        </p>
        <div className="relative mt-5 flex flex-wrap gap-2.5">
          <PrimaryButton>
            Reageer op opdracht <ArrowRight size={14} aria-hidden="true" />
          </PrimaryButton>
          <GhostButton>Bewaren</GhostButton>
        </div>
      </Panel>

      <Panel>
        <div className="grid grid-cols-2 md:grid-cols-4">
          {[
            { l: "Tarief", v: opdracht.tarief },
            { l: "Omvang", v: opdracht.uren },
            { l: "Start", v: opdracht.start },
            { l: "Match", v: `${opdracht.match}%` },
          ].map((m, i) => (
            <div
              key={m.l}
              className="p-4"
              style={{
                borderLeft: i % 4 === 0 ? "none" : `1px solid ${C.lineFaint}`,
                borderTop: i >= 2 ? `1px solid ${C.lineFaint}` : "none",
              }}
            >
              <p
                className="text-[9.5px] font-semibold uppercase tracking-[0.16em]"
                style={{ color: C.inkMute, ...mono }}
              >
                {m.l}
              </p>
              <p
                className="mt-1.5 text-[18px] font-bold tracking-[-0.01em]"
                style={{ color: C.ink, ...num }}
              >
                {m.v}
              </p>
            </div>
          ))}
        </div>
      </Panel>

      <section>
        <Eyebrow>Verklaarbare matching</Eyebrow>
        <p className="mt-3 max-w-xl text-[13.5px] leading-relaxed" style={{ color: C.inkMute }}>
          Rechtstreeks afgelezen van je geverifieerde profiel — wat spanning geeft én waar weerstand
          zit, zonder verborgen score.
        </p>
        <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-2">
          <Panel className="p-5">
            <div className="flex items-center gap-2">
              <span
                className="inline-flex h-8 w-8 items-center justify-center rounded-md"
                style={{ color: C.okInk, background: C.okWash, border: `1px solid ${C.ok}` }}
                aria-hidden="true"
              >
                <Check size={15} />
              </span>
              <p
                className="text-[11px] font-semibold uppercase tracking-[0.14em]"
                style={{ color: C.okInk, ...mono }}
              >
                Onder stroom
              </p>
            </div>
            <ul className="mt-4 space-y-3">
              {opdracht.redenen.plus.map((r) => (
                <li
                  key={r}
                  className="flex items-start gap-3 text-[13.5px]"
                  style={{ color: C.inkSoft }}
                >
                  <Check
                    size={15}
                    aria-hidden="true"
                    className="mt-0.5 shrink-0"
                    style={{ color: C.okInk }}
                  />
                  {r}
                </li>
              ))}
            </ul>
          </Panel>
          <Panel className="p-5">
            <div className="flex items-center gap-2">
              <span
                className="inline-flex h-8 w-8 items-center justify-center rounded-md"
                style={{ color: C.warnInk, background: C.warnWash, border: `1px solid ${C.warn}` }}
                aria-hidden="true"
              >
                <AlertTriangle size={14} />
              </span>
              <p
                className="text-[11px] font-semibold uppercase tracking-[0.14em]"
                style={{ color: C.warnInk, ...mono }}
              >
                Weerstand
              </p>
            </div>
            <ul className="mt-4 space-y-3">
              {opdracht.redenen.min.map((r) => (
                <li
                  key={r}
                  className="flex items-start gap-3 text-[13.5px]"
                  style={{ color: C.inkSoft }}
                >
                  <AlertTriangle
                    size={14}
                    aria-hidden="true"
                    className="mt-0.5 shrink-0"
                    style={{ color: C.warnInk }}
                  />
                  {r}
                </li>
              ))}
            </ul>
          </Panel>
        </div>
      </section>
    </div>
  );
}

function Verificatie() {
  const [open, setOpen] = useState<string | null>(CREDENTIALS[0]?.naam ?? null);
  const verified = CREDENTIALS.filter((c) => c.status === "VERIFIED").length;
  const ratio = Math.round((verified / CREDENTIALS.length) * 100);

  return (
    <div className="space-y-6">
      <Panel className="p-6 md:p-8" live>
        <CircuitCorners />
        <div className="relative flex flex-wrap items-center justify-between gap-6">
          <div className="max-w-md">
            <Eyebrow>Verificatie · vermogensniveau</Eyebrow>
            <h1
              className="mt-3 text-[28px] font-bold leading-tight tracking-[-0.01em]"
              style={{ color: C.ink, ...body }}
            >
              Jouw certificaten
            </h1>
            <p className="mt-3 text-[13.5px] leading-relaxed" style={{ color: C.inkMute }}>
              <span className="font-semibold" style={{ color: C.lime }}>
                {PROFIEL.trust}.
              </span>{" "}
              {verified} van {CREDENTIALS.length} circuits geladen en geverifieerd. Eén certificaat
              verliest binnenkort spanning en vraagt om vernieuwing.
            </p>
            <div className="mt-4 max-w-xs">
              <ChargeMeter value={ratio} tone={C.lime} />
            </div>
          </div>
          <span
            className="inline-flex h-24 w-24 flex-col items-center justify-center rounded-full"
            style={{
              background: C.bgDeep,
              border: `1.5px solid ${C.lime}`,
              boxShadow: `0 0 26px ${C.limeGlow}`,
            }}
          >
            <span
              className="text-[26px] font-bold leading-none"
              style={{ color: C.limeHi, ...num }}
            >
              {ratio}
            </span>
            <span
              className="mt-1 text-[8px] font-semibold uppercase tracking-[0.16em]"
              style={{ color: C.inkFaint, ...mono }}
            >
              % geladen
            </span>
          </span>
        </div>
      </Panel>

      <Panel>
        <div
          className="hidden grid-cols-[1fr_11rem_2.5rem] items-center gap-4 px-5 py-3 sm:grid"
          style={{ borderBottom: `1px solid ${C.lineFaint}` }}
        >
          {["Certificaat", "Status", ""].map((h, i) => (
            <span
              key={h || i}
              className="text-[9.5px] font-semibold uppercase tracking-[0.18em]"
              style={{ color: C.inkMute, ...mono }}
            >
              {h}
            </span>
          ))}
        </div>
        <ul>
          {CREDENTIALS.map((c, idx) => {
            const st = statusMeta(c.status);
            const isOpen = open === c.naam;
            return (
              <li
                key={c.naam}
                style={{ borderTop: idx === 0 ? "none" : `1px solid ${C.lineFaint}` }}
              >
                <button
                  type="button"
                  onClick={() => setOpen(isOpen ? null : c.naam)}
                  aria-expanded={isOpen}
                  className="grid w-full grid-cols-[1fr_auto] items-center gap-4 px-5 py-4 text-left transition-colors hover:bg-[#1d212a] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#c6f24e] motion-reduce:transition-none sm:grid-cols-[1fr_11rem_2.5rem]"
                >
                  <span className="flex min-w-0 items-center gap-3">
                    <span
                      className="inline-flex h-9 w-9 items-center justify-center rounded-md"
                      style={{ color: st.ink, background: st.wash, border: `1px solid ${st.tone}` }}
                      aria-hidden="true"
                    >
                      <st.Icon size={16} />
                    </span>
                    <span className="min-w-0">
                      <span
                        className="block truncate text-[14.5px] font-semibold"
                        style={{ color: C.ink, ...body }}
                      >
                        {c.naam}
                      </span>
                      <span
                        className="mt-0.5 block truncate text-[11.5px]"
                        style={{ color: C.inkMute }}
                      >
                        {c.detail}
                      </span>
                    </span>
                  </span>
                  <span className="hidden sm:flex">
                    <Chip tone={st.tone} ink={st.ink} wash={st.wash} alarm={st.alarm}>
                      <st.Icon size={11} aria-hidden="true" />
                      {st.label}
                    </Chip>
                  </span>
                  <span
                    className="hidden justify-self-end transition-transform motion-reduce:transition-none sm:block"
                    style={{
                      color: C.inkFaint,
                      transform: isOpen ? "rotate(45deg)" : "rotate(0deg)",
                    }}
                    aria-hidden="true"
                  >
                    <Plus size={15} />
                  </span>
                </button>
                <div
                  className="grid transition-all duration-300 motion-reduce:transition-none"
                  style={{ gridTemplateRows: isOpen ? "1fr" : "0fr" }}
                >
                  <div className="overflow-hidden">
                    <div className="px-5 pb-5 sm:pl-[68px]">
                      <div
                        className="rounded-md p-4"
                        style={{ background: C.bgDeep, border: `1px solid ${C.lineFaint}` }}
                      >
                        <p
                          className="max-w-xl text-[13px] leading-relaxed"
                          style={{ color: C.inkSoft }}
                        >
                          {c.detail}. Documenten worden versleuteld bewaard en alleen na je
                          expliciete toestemming gedeeld met een opdrachtgever.
                        </p>
                        <div className="mt-3 flex flex-wrap gap-2">
                          <PrimaryButton>
                            {c.status === "EXPIRING" ? "Vernieuwen" : "Bekijken"}
                          </PrimaryButton>
                          <GhostButton>Historie</GhostButton>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      </Panel>

      <div>
        <div className="mb-3">
          <Eyebrow tone={C.cyanInk}>Documentenkast</Eyebrow>
        </div>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {DOCUMENTEN.map((d) => {
            const st = statusMeta(d.status);
            return (
              <Panel key={d.naam} className="flex items-center gap-3 p-4">
                <span
                  className="inline-flex h-10 w-10 items-center justify-center rounded-md"
                  style={{
                    background: C.raise,
                    border: `1px solid ${C.lineSteel}`,
                    color: C.inkSoft,
                  }}
                  aria-hidden="true"
                >
                  <FileText size={16} />
                </span>
                <span className="min-w-0 flex-1">
                  <span
                    className="block truncate text-[13px] font-semibold"
                    style={{ color: C.ink }}
                  >
                    {d.naam}
                  </span>
                  <span className="block text-[10.5px]" style={{ color: C.inkMute, ...num }}>
                    {d.type} · {d.grootte} · {d.bijgewerkt}
                  </span>
                </span>
                <span
                  className="inline-flex items-center gap-1 rounded px-2 py-1 text-[10px] font-semibold"
                  style={{ color: st.ink, background: st.wash, border: `1px solid ${st.tone}` }}
                >
                  <st.Icon size={10} aria-hidden="true" />
                  {st.label}
                </span>
              </Panel>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function Acties() {
  return (
    <div className="space-y-6">
      <div>
        <Eyebrow>Acties · schakelvolgorde</Eyebrow>
        <h1
          className="mt-3 text-[30px] font-bold leading-none tracking-[-0.01em]"
          style={{ color: C.ink, ...body }}
        >
          Wat nu spanning vraagt
        </h1>
        <p className="mt-2 max-w-md text-[13px]" style={{ color: C.inkMute }}>
          Op volgorde van urgentie — schakel van boven naar beneden om verifieerbaar en betaald te
          blijven.
        </p>
      </div>

      <ol>
        {ACTIES.map((a, i) => {
          const warn = a.urgentie === "warning";
          const tone = warn ? C.warn : C.lime;
          const ink = warn ? C.warnInk : C.limeHi;
          const wash = warn ? C.warnWash : C.limeWash;
          return (
            <li key={a.titel}>
              <Panel className="p-5" live={warn}>
                {warn && <CircuitCorners />}
                <div className="relative grid grid-cols-[auto_1fr] items-start gap-4 sm:grid-cols-[auto_1fr_auto]">
                  <span
                    className="flex h-11 w-11 items-center justify-center rounded-md text-[15px] font-bold"
                    style={{
                      background: C.bgDeep,
                      border: `1.5px solid ${tone}`,
                      color: ink,
                      boxShadow: warn ? `0 0 14px ${C.warnWash}` : "none",
                      ...num,
                    }}
                    aria-hidden="true"
                  >
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <div className="min-w-0">
                    <span
                      className="inline-flex items-center gap-1 rounded px-2 py-0.5 text-[9.5px] font-semibold uppercase tracking-[0.12em]"
                      style={{ color: ink, background: wash, border: `1px solid ${tone}`, ...mono }}
                    >
                      {warn ? (
                        <AlertTriangle size={10} aria-hidden="true" />
                      ) : (
                        <Activity size={10} aria-hidden="true" />
                      )}
                      {warn ? "Urgent" : "Aanbevolen"}
                    </span>
                    <h2
                      className="mt-2 text-[18px] font-bold leading-snug"
                      style={{ color: C.ink, ...body }}
                    >
                      {a.titel}
                    </h2>
                    <p
                      className="mt-1.5 max-w-lg text-[13px] leading-relaxed"
                      style={{ color: C.inkMute }}
                    >
                      {a.detail}
                    </p>
                  </div>
                  <div className="col-span-2 mt-1 sm:col-span-1 sm:mt-0 sm:self-center">
                    <PrimaryButton>
                      {a.cta}
                      <ArrowRight size={13} aria-hidden="true" />
                    </PrimaryButton>
                  </div>
                </div>
              </Panel>
              {i < ACTIES.length - 1 && <Connector />}
            </li>
          );
        })}
      </ol>
    </div>
  );
}

function factuurTone(status: string): {
  ink: string;
  wash: string;
  tone: string;
  Icon: LucideIcon | null;
} {
  if (status === "Openstaand")
    return { ink: C.warnInk, wash: C.warnWash, tone: C.warn, Icon: AlertTriangle };
  if (status === "Betaald") return { ink: C.okInk, wash: C.okWash, tone: C.ok, Icon: Check };
  return { ink: C.inkMute, wash: C.raise, tone: C.lineSteel, Icon: FileText };
}

function Facturen() {
  const totaalBetaald = "€ 8.622";
  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <Eyebrow>Facturen · energieboek</Eyebrow>
          <h1
            className="mt-3 text-[30px] font-bold leading-none tracking-[-0.01em]"
            style={{ color: C.ink, ...body }}
          >
            Facturen
          </h1>
        </div>
        <PrimaryButton>
          <Plus size={14} aria-hidden="true" /> Nieuwe factuur
        </PrimaryButton>
      </div>

      <section className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {[
          { l: "Betaald (mnd)", v: totaalBetaald, sub: "3 voldaan", alarm: false, Icon: Gauge },
          {
            l: "Openstaand",
            v: "€ 1.350",
            sub: "1 factuur · 9 dagen",
            alarm: true,
            Icon: AlertTriangle,
          },
          { l: "Concept", v: "€ 880", sub: "klaar om te versturen", alarm: false, Icon: FileText },
        ].map((s) => (
          <Panel key={s.l} className="p-5">
            <div className="flex items-center justify-between">
              <p
                className="text-[10.5px] font-semibold uppercase tracking-[0.12em]"
                style={{ color: C.inkMute, ...mono }}
              >
                {s.l}
              </p>
              <span
                className="inline-flex h-6 w-6 items-center justify-center rounded-md"
                style={{
                  background: s.alarm ? C.warnWash : C.raise,
                  color: s.alarm ? C.warnInk : C.inkMute,
                }}
                aria-hidden="true"
              >
                <s.Icon size={13} />
              </span>
            </div>
            <p
              className="mt-2 text-[26px] font-bold tracking-[-0.02em]"
              style={{ color: s.alarm ? C.warnInk : C.ink, ...num }}
            >
              {s.v}
            </p>
            <p className="mt-1 text-[11.5px]" style={{ color: C.inkMute }}>
              {s.sub}
            </p>
          </Panel>
        ))}
      </section>

      <Panel>
        <div
          className="hidden grid-cols-[8rem_1fr_5rem_9rem_6rem] gap-4 px-5 pb-3 pt-4 sm:grid"
          style={{ borderBottom: `1px solid ${C.lineFaint}` }}
        >
          {["Nummer", "Klant", "Datum", "Status", "Bedrag"].map((h, i) => (
            <span
              key={h}
              className={`text-[9.5px] font-semibold uppercase tracking-[0.16em] ${i === 4 ? "text-right" : ""}`}
              style={{ color: C.inkMute, ...mono }}
            >
              {h}
            </span>
          ))}
        </div>
        <ul>
          {FACTUREN.map((f, i) => {
            const ft = factuurTone(f.status);
            const acc = f.status === "Openstaand";
            return (
              <li
                key={f.nr}
                className="grid grid-cols-[1fr_auto] items-center gap-3 px-5 py-3.5 transition-colors hover:bg-[#1d212a] sm:grid-cols-[8rem_1fr_5rem_9rem_6rem] sm:gap-4"
                style={{ borderTop: i === 0 ? "none" : `1px solid ${C.lineFaint}` }}
              >
                <span
                  className="order-1 text-[11.5px] font-semibold"
                  style={{ color: C.inkMute, ...num }}
                >
                  {f.nr}
                </span>
                <span
                  className="order-3 min-w-0 truncate text-[14px] font-semibold sm:order-2"
                  style={{ color: C.ink, ...body }}
                >
                  {f.klant}
                </span>
                <span
                  className="order-4 hidden text-[11.5px] sm:order-3 sm:inline"
                  style={{ color: C.inkMute, ...num }}
                >
                  {f.datum}
                </span>
                <span className="order-5 sm:order-4">
                  <span
                    className="inline-flex items-center gap-1.5 rounded-md px-2.5 py-1 text-[10.5px] font-semibold"
                    style={{
                      color: ft.ink,
                      background: ft.wash,
                      border: `1px solid ${ft.tone}`,
                      ...body,
                    }}
                  >
                    {ft.Icon && <ft.Icon size={11} aria-hidden="true" />}
                    {f.status}
                  </span>
                </span>
                <span
                  className="order-2 text-right text-[14px] font-bold sm:order-5"
                  style={{ color: acc ? C.warnInk : C.ink, ...num }}
                >
                  {f.bedrag}
                </span>
              </li>
            );
          })}
        </ul>
        <div
          className="flex items-baseline justify-between px-5 py-4"
          style={{ borderTop: `1px solid ${C.lineFaint}` }}
        >
          <span
            className="flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.18em]"
            style={{ color: C.inkMute, ...mono }}
          >
            <BatteryCharging size={12} aria-hidden="true" style={{ color: C.lime }} /> Totaal
            betaald
          </span>
          <span className="text-[20px] font-bold" style={{ color: C.ink, ...num }}>
            {totaalBetaald}
          </span>
        </div>
      </Panel>
    </div>
  );
}

function CommandMenu({
  onClose,
  setScreen,
}: {
  onClose: () => void;
  setScreen: (s: ScreenKey) => void;
}) {
  const [q, setQ] = useState("");
  const results = SCREENS.filter((s) => s.label.toLowerCase().includes(q.toLowerCase().trim()));
  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center px-4 pt-24"
      style={{ background: "rgba(7,8,9,0.72)" }}
      role="dialog"
      aria-modal="true"
      aria-label="Commandomenu"
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg overflow-hidden rounded-lg"
        style={{
          background: C.panel,
          border: `1px solid ${C.line}`,
          boxShadow: `0 0 0 1px rgba(198,242,78,0.06), 0 30px 70px rgba(0,0,0,0.6)`,
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div
          className="flex items-center gap-2.5 px-4 py-3.5"
          style={{ borderBottom: `1px solid ${C.lineFaint}` }}
        >
          <Command size={15} aria-hidden="true" style={{ color: C.lime }} />
          <input
            autoFocus
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Ga naar…"
            aria-label="Zoek een scherm"
            className="w-full bg-transparent text-[13.5px] outline-none placeholder:text-[#5d6775]"
            style={{ color: C.ink, ...body }}
          />
          <kbd
            className="rounded px-1.5 py-0.5 text-[10px] font-semibold"
            style={{ color: C.inkMute, background: C.raise, ...mono }}
          >
            esc
          </kbd>
        </div>
        <ul className="max-h-72 overflow-y-auto p-2">
          {results.length === 0 ? (
            <li className="px-3 py-6 text-center text-[12.5px]" style={{ color: C.inkMute }}>
              Geen scherm gevonden.
            </li>
          ) : (
            results.map((s) => (
              <li key={s.key}>
                <button
                  type="button"
                  onClick={() => {
                    setScreen(s.key);
                    onClose();
                  }}
                  className="flex w-full items-center justify-between rounded-md px-3 py-2.5 text-left text-[13px] font-semibold transition-colors hover:bg-[#222732] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#c6f24e]"
                  style={{ color: C.inkSoft, ...body }}
                >
                  <span className="flex items-center gap-2.5">
                    <CircuitBoard size={14} aria-hidden="true" style={{ color: C.lime }} />
                    {s.label}
                  </span>
                  <ArrowRight size={13} aria-hidden="true" style={{ color: C.inkFaint }} />
                </button>
              </li>
            ))
          )}
        </ul>
      </div>
    </div>
  );
}
