"use client";

// Concept 423 — "Sonar" · radar-/sonar-scope ops (dark).
// Donker ops-monitoring-scherm met een radar/sonar-scope-metafoor: concentrische bereikringen, een
// zachte roterende sweep-gradient (CSS conic-gradient; motion-reduce stopt de rotatie) en matches/
// credentials als "blips" op de scope. Fosfor-groen #35f0a0 op bijna-zwart #0a1014, tekst #cfe8dd.
// Tabulaire mono-cijfers, hoge datadichtheid, technisch-strak; overige schermen zijn strakke donkere
// data-panelen met dunne groene hairlines. Aria/focus-states, geheel in het Nederlands.

import { useMemo, useState } from "react";
import {
  Activity,
  AlertTriangle,
  ArrowRight,
  Bell,
  Check,
  ChevronRight,
  Clock,
  FileText,
  Minus,
  Plus,
  Radar,
  Radio,
  Search,
  ShieldCheck,
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
  BERICHTEN,
  DOCUMENTEN,
  type ScreenKey,
  type CredStatus,
  type Opdracht,
} from "./mock";

// — Palet: bijna-zwart scope, fosfor-groen, cyaan tweede signaal, amber waarschuwing —
const C = {
  bg: "#0a1014",
  bgDeep: "#070c0f",
  panel: "#0e161b",
  panelSoft: "#111f26",
  raise: "#16252d",
  line: "rgba(53,240,160,0.16)",
  lineSoft: "rgba(53,240,160,0.08)",
  grid: "rgba(53,240,160,0.06)",
  ink: "#cfe8dd",
  inkSoft: "#9fc4b6",
  inkMute: "#6b8b80",
  inkFaint: "#4a655c",
  phos: "#35f0a0",
  phosDim: "#1fbf7e",
  phosDeep: "#0f8f5c",
  phosWash: "rgba(53,240,160,0.12)",
  phosGlow: "rgba(53,240,160,0.5)",
  cyan: "#38d6f0",
  cyanWash: "rgba(56,214,240,0.12)",
  ok: "#35f0a0",
  okInk: "#7ff3c4",
  okWash: "rgba(53,240,160,0.12)",
  warn: "#f0b038",
  warnInk: "#f5cb77",
  warnWash: "rgba(240,176,56,0.14)",
  info: "#38d6f0",
  infoInk: "#8ee6f5",
  infoWash: "rgba(56,214,240,0.12)",
  bad: "#f0576b",
  badInk: "#f58ea0",
  badWash: "rgba(240,87,107,0.14)",
};

const display = {
  fontFamily: "'Inter', 'Segoe UI', system-ui, -apple-system, sans-serif",
  letterSpacing: "-0.01em",
};
const body = {
  fontFamily: "'Inter', 'Segoe UI', system-ui, -apple-system, sans-serif",
};
const mono = {
  fontFamily: "ui-monospace, 'SFMono-Regular', 'Menlo', 'Consolas', monospace",
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
        tone: C.info,
        ink: C.infoInk,
        wash: C.infoWash,
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

// — Donker data-paneel met dunne groene hairline —
function Panel({
  children,
  className = "",
  as: Tag = "div",
  glow = false,
}: {
  children: React.ReactNode;
  className?: string;
  as?: "div" | "section" | "li";
  glow?: boolean;
}) {
  return (
    <Tag
      className={`relative overflow-hidden rounded-xl ${className}`}
      style={{
        background: C.panel,
        border: `1px solid ${C.line}`,
        boxShadow: glow
          ? "inset 0 1px 0 rgba(53,240,160,0.08), 0 0 0 1px rgba(53,240,160,0.05), 0 18px 40px -24px rgba(0,0,0,0.8)"
          : "0 12px 30px -22px rgba(0,0,0,0.8)",
        color: C.ink,
      }}
    >
      {children}
    </Tag>
  );
}

function Eyebrow({ children, tone = C.phos }: { children: React.ReactNode; tone?: string }) {
  return (
    <p
      className="flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.28em]"
      style={{ color: tone, ...mono }}
    >
      <span
        aria-hidden="true"
        className="inline-block h-1.5 w-1.5 rounded-full"
        style={{ background: tone, boxShadow: `0 0 6px ${tone}` }}
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
      className="inline-flex items-center gap-1.5 rounded px-2.5 py-1 text-[10.5px] font-semibold uppercase tracking-[0.06em]"
      style={{ color: ink, background: wash, border: `1px solid ${tone}44`, ...mono }}
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
      className={`group inline-flex items-center justify-center gap-2 rounded-lg px-5 py-2.5 text-[12.5px] font-semibold uppercase tracking-[0.08em] transition-all duration-200 hover:brightness-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#35f0a0] focus-visible:ring-offset-2 focus-visible:ring-offset-[#0a1014] active:translate-y-px motion-reduce:transition-none ${className}`}
      style={{
        color: C.bgDeep,
        background: `linear-gradient(180deg, ${C.phos}, ${C.phosDim})`,
        boxShadow: `0 0 18px -4px ${C.phosGlow}`,
        ...mono,
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
      className={`inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-[11.5px] font-semibold uppercase tracking-[0.06em] transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#35f0a0] focus-visible:ring-offset-2 focus-visible:ring-offset-[#0a1014] motion-reduce:transition-none ${className}`}
      style={{
        color: active ? C.phos : C.inkSoft,
        background: active ? C.phosWash : C.panelSoft,
        border: `1px solid ${active ? `${C.phos}66` : C.line}`,
        ...mono,
      }}
    >
      {children}
    </button>
  );
}

// — Radar-scope: concentrische bereikringen + roterende sweep + blips —
function Scope({ opdrachten }: { opdrachten: Opdracht[] }) {
  // Blip-posities: elke opdracht op een ring naar rato van match% (dichter bij center = betere match).
  const blips = opdrachten.map((o, i) => {
    const angle = (i / opdrachten.length) * Math.PI * 2 - Math.PI / 2 + 0.5;
    const radius = 8 + (100 - o.match) * 0.72; // 8..~30
    const cx = 50 + Math.cos(angle) * radius;
    const cy = 50 + Math.sin(angle) * radius;
    return { ...o, cx, cy };
  });
  return (
    <div className="relative mx-auto aspect-square w-full max-w-[300px]" aria-hidden="true">
      <style>{`
        @keyframes sonarSweep { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        .sonar-sweep { animation: sonarSweep 4s linear infinite; }
        @media (prefers-reduced-motion: reduce) { .sonar-sweep { animation: none !important; } }
      `}</style>
      {/* rings */}
      <svg viewBox="0 0 100 100" className="absolute inset-0 h-full w-full">
        <defs>
          <radialGradient id="scope-bg" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="rgba(53,240,160,0.10)" />
            <stop offset="70%" stopColor="rgba(53,240,160,0.02)" />
            <stop offset="100%" stopColor="rgba(10,16,20,0)" />
          </radialGradient>
        </defs>
        <circle cx="50" cy="50" r="48" fill="url(#scope-bg)" />
        {[12, 24, 36, 48].map((r) => (
          <circle key={r} cx="50" cy="50" r={r} fill="none" stroke={C.line} strokeWidth="0.4" />
        ))}
        <line x1="50" y1="2" x2="50" y2="98" stroke={C.lineSoft} strokeWidth="0.4" />
        <line x1="2" y1="50" x2="98" y2="50" stroke={C.lineSoft} strokeWidth="0.4" />
        <line x1="15" y1="15" x2="85" y2="85" stroke={C.grid} strokeWidth="0.3" />
        <line x1="85" y1="15" x2="15" y2="85" stroke={C.grid} strokeWidth="0.3" />
      </svg>
      {/* sweep */}
      <div className="absolute inset-0 overflow-hidden rounded-full">
        <div
          className="sonar-sweep absolute inset-0 rounded-full"
          style={{
            background: `conic-gradient(from 0deg, ${C.phosGlow} 0deg, rgba(53,240,160,0.08) 24deg, transparent 60deg, transparent 360deg)`,
            maskImage: "radial-gradient(circle at center, black 0%, black 96%, transparent 100%)",
            WebkitMaskImage:
              "radial-gradient(circle at center, black 0%, black 96%, transparent 100%)",
          }}
        />
      </div>
      {/* blips */}
      <svg viewBox="0 0 100 100" className="absolute inset-0 h-full w-full">
        {blips.map((b) => {
          const strong = b.match >= 90;
          const tone = strong ? C.phos : C.cyan;
          return (
            <g key={b.id}>
              <circle
                cx={b.cx}
                cy={b.cy}
                r="3.4"
                fill="none"
                stroke={tone}
                strokeOpacity="0.4"
                strokeWidth="0.5"
              />
              <circle
                cx={b.cx}
                cy={b.cy}
                r="1.6"
                fill={tone}
                style={{ filter: `drop-shadow(0 0 3px ${tone})` }}
              />
            </g>
          );
        })}
        <circle
          cx="50"
          cy="50"
          r="1.8"
          fill={C.phos}
          style={{ filter: `drop-shadow(0 0 4px ${C.phos})` }}
        />
      </svg>
    </div>
  );
}

// — Signaal-sparkline: strakke fosfor-lijn —
function SignalLine({ data, tone }: { data: number[]; tone: string }) {
  const max = Math.max(...data);
  const min = Math.min(...data);
  const span = max - min || 1;
  const w = 120;
  const h = 30;
  const pts = data.map((d, i) => {
    const x = (i / (data.length - 1)) * w;
    const y = h - ((d - min) / span) * (h - 8) - 4;
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
      <polyline
        points={line}
        fill="none"
        stroke={tone}
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
        style={{ filter: `drop-shadow(0 0 2px ${tone}88)` }}
      />
      <circle
        cx={last[0]}
        cy={last[1]}
        r="2.2"
        fill={tone}
        style={{ filter: `drop-shadow(0 0 3px ${tone})` }}
      />
    </svg>
  );
}

// — Bereik-meter: horizontale signaalbalk —
function RangeMeter({ value, tone = C.phos }: { value: number; tone?: string }) {
  return (
    <span className="hidden items-center gap-2.5 sm:flex" aria-hidden="true">
      <span
        className="relative h-1.5 w-24 overflow-hidden rounded-full"
        style={{ background: C.raise }}
      >
        <span
          className="block h-full rounded-full"
          style={{ width: `${value}%`, background: tone, boxShadow: `0 0 8px ${tone}88` }}
        />
      </span>
      <span className="text-[12px] font-semibold" style={{ color: tone, ...mono }}>
        {value}%
      </span>
    </span>
  );
}

function MatchNode({ value, size = 46 }: { value: number; size?: number }) {
  const strong = value >= 90;
  const tone = strong ? C.phos : C.cyan;
  return (
    <span
      className="relative inline-flex items-center justify-center rounded-full"
      style={{
        width: size,
        height: size,
        background: C.raise,
        border: `1px solid ${tone}55`,
        boxShadow: `0 0 12px -4px ${tone}`,
      }}
      aria-hidden="true"
    >
      <span className="text-[14px] font-bold leading-none" style={{ color: tone, ...mono }}>
        {value}
      </span>
    </span>
  );
}

export function Concept423() {
  const [screen, setScreen] = useState<ScreenKey>("dashboard");
  const active = OPDRACHTEN[0] as Opdracht;

  return (
    <div
      className="relative min-h-[720px] w-full antialiased"
      style={{
        ...body,
        color: C.ink,
        background: C.bg,
        backgroundImage: `linear-gradient(${C.grid} 1px, transparent 1px), linear-gradient(90deg, ${C.grid} 1px, transparent 1px)`,
        backgroundSize: "36px 36px",
      }}
    >
      <style>{`
        @keyframes scopeIn { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
        .scope-in { animation: scopeIn 0.42s cubic-bezier(0.22, 1, 0.36, 1) both; }
        @media (prefers-reduced-motion: reduce) { .scope-in { animation: none !important; } }
      `}</style>

      <div
        className="pointer-events-none absolute inset-x-0 top-0 h-64"
        aria-hidden="true"
        style={{
          background: `radial-gradient(120% 100% at 50% -20%, rgba(53,240,160,0.10), transparent 60%)`,
        }}
      />

      <div className="relative mx-auto max-w-6xl px-4 pb-24 sm:px-6 md:px-8">
        <TopBar />
        <NavBar screen={screen} setScreen={setScreen} />
        <main key={screen} className="scope-in pt-7">
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

function TopBar() {
  const ongelezen = BERICHTEN.filter((b) => b.ongelezen).length;
  return (
    <header className="flex items-center justify-between gap-4 pt-8">
      <div className="flex items-center gap-3.5">
        <span
          className="inline-flex h-11 w-11 items-center justify-center rounded-xl"
          style={{
            background: C.panelSoft,
            border: `1px solid ${C.phos}55`,
            color: C.phos,
            boxShadow: `0 0 16px -4px ${C.phosGlow}`,
          }}
          aria-hidden="true"
        >
          <Radar size={19} />
        </span>
        <div>
          <p className="text-[19px] font-semibold leading-none" style={{ color: C.ink, ...mono }}>
            SONAR
          </p>
          <p
            className="mt-1.5 flex items-center gap-1.5 text-[10.5px] uppercase leading-none tracking-[0.1em]"
            style={{ color: C.inkMute, ...mono }}
          >
            <Signal size={10} aria-hidden="true" style={{ color: C.phos }} />
            {PROFIEL.plaats} · scope actief
          </p>
        </div>
      </div>
      <div className="flex items-center gap-3">
        <span
          className="hidden items-center gap-1.5 rounded px-3 py-1.5 text-[10.5px] font-semibold uppercase tracking-[0.06em] sm:inline-flex"
          style={{ color: C.okInk, border: `1px solid ${C.ok}44`, background: C.okWash, ...mono }}
        >
          <ShieldCheck size={12} aria-hidden="true" />
          {PROFIEL.trust}
        </span>
        <span
          className="relative inline-flex h-10 w-10 items-center justify-center rounded-lg"
          style={{ background: C.panelSoft, border: `1px solid ${C.line}`, color: C.inkMute }}
          aria-label={`${ongelezen} ongelezen berichten`}
        >
          <Bell size={16} aria-hidden="true" />
          {ongelezen > 0 && (
            <span
              className="absolute -right-0.5 -top-0.5 flex h-4 w-4 items-center justify-center rounded-full text-[9px] font-bold"
              style={{ background: C.phos, color: C.bgDeep, ...mono }}
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
          <span
            className="block text-[10.5px] uppercase tracking-[0.06em]"
            style={{ color: C.inkMute, ...mono }}
          >
            {PROFIEL.rol}
          </span>
        </span>
        <span
          className="inline-flex h-11 w-11 items-center justify-center rounded-lg text-[12.5px] font-bold"
          style={{ background: C.raise, border: `1px solid ${C.phos}44`, color: C.phos, ...mono }}
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
    <nav aria-label="Hoofdnavigatie" className="mt-7">
      <div
        className="flex items-center gap-1 overflow-x-auto rounded-lg p-1.5"
        style={{ background: C.panel, border: `1px solid ${C.line}` }}
      >
        {SCREENS.map((s) => {
          const on = s.key === screen;
          return (
            <button
              key={s.key}
              type="button"
              onClick={() => setScreen(s.key)}
              aria-current={on ? "page" : undefined}
              className="flex shrink-0 items-center gap-2 rounded-md px-4 py-2 text-[11.5px] font-semibold uppercase tracking-[0.06em] transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#35f0a0] focus-visible:ring-offset-2 focus-visible:ring-offset-[#0e161b] motion-reduce:transition-none"
              style={{
                color: on ? C.bgDeep : C.inkMute,
                background: on ? C.phos : "transparent",
                boxShadow: on ? `0 0 14px -4px ${C.phosGlow}` : undefined,
                ...mono,
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
  const best = OPDRACHTEN[0] as Opdracht;
  return (
    <div className="space-y-7">
      <section className="grid grid-cols-1 gap-5 lg:grid-cols-[1fr_1.1fr]">
        <Panel className="p-7 md:p-8" glow>
          <div className="flex items-center justify-between">
            <Eyebrow>Scope · live overzicht</Eyebrow>
            <span
              className="inline-flex items-center gap-1.5 text-[10px] uppercase tracking-[0.1em]"
              style={{ color: C.phos, ...mono }}
            >
              <span
                className="inline-block h-1.5 w-1.5 rounded-full"
                style={{ background: C.phos, boxShadow: `0 0 6px ${C.phos}` }}
                aria-hidden="true"
              />
              online
            </span>
          </div>
          <Scope opdrachten={OPDRACHTEN} />
          <div className="mt-4 grid grid-cols-3 gap-2 text-center">
            {[
              { l: "Bereik", v: `${OPDRACHTEN.length}` },
              { l: "Beste", v: `${best.match}%` },
              { l: "Reacties", v: "7" },
            ].map((s) => (
              <div
                key={s.l}
                className="rounded-lg py-2.5"
                style={{ background: C.panelSoft, border: `1px solid ${C.lineSoft}` }}
              >
                <p
                  className="text-[18px] font-bold leading-none"
                  style={{ color: C.phos, ...mono }}
                >
                  {s.v}
                </p>
                <p
                  className="mt-1 text-[9px] uppercase tracking-[0.12em]"
                  style={{ color: C.inkMute, ...mono }}
                >
                  {s.l}
                </p>
              </div>
            ))}
          </div>
        </Panel>

        <div className="space-y-5">
          <Panel className="p-7">
            <Eyebrow>Geregistreerd · {PROFIEL.plaats}</Eyebrow>
            <h1
              className="mt-4 text-[30px] font-semibold leading-[1.05] md:text-[38px]"
              style={{ color: C.ink, ...display }}
            >
              Goedemorgen, {PROFIEL.naam.split(" ")[0]}.
            </h1>
            <p className="mt-3 max-w-md text-[13.5px] leading-relaxed" style={{ color: C.inkSoft }}>
              De scope draait. Alle opdrachten, certificaten en facturen in één technisch overzicht
              — scherp, actueel en zonder ruis.
            </p>
            <div className="mt-6 flex flex-wrap items-center gap-2.5">
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
          </Panel>

          <Panel className="p-6">
            <div className="flex items-center justify-between">
              <Eyebrow tone={C.warnInk}>Prioriteit</Eyebrow>
              <AlertTriangle size={16} aria-hidden="true" style={{ color: C.warn }} />
            </div>
            <h2
              className="mt-3 text-[17px] font-semibold leading-snug"
              style={{ color: C.ink, ...display }}
            >
              {primair.titel}
            </h2>
            <p className="mt-1.5 text-[13px] leading-relaxed" style={{ color: C.inkSoft }}>
              {primair.detail}
            </p>
            <div className="mt-4 flex flex-wrap items-center gap-3">
              <PrimaryButton onClick={onActies}>
                {primair.cta}
                <ArrowRight size={13} aria-hidden="true" />
              </PrimaryButton>
              <span
                className="text-[11px] uppercase tracking-[0.08em]"
                style={{ color: C.inkMute, ...mono }}
              >
                {verified}/{CREDENTIALS.length} geverifieerd
              </span>
            </div>
          </Panel>
        </div>
      </section>

      <section>
        <div className="mb-4">
          <Eyebrow>Telemetrie · deze maand</Eyebrow>
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {KPIS.map((k) => (
            <Panel key={k.label} className="p-5">
              <div className="flex items-start justify-between gap-2">
                <p
                  className="text-[9.5px] font-semibold uppercase tracking-[0.12em]"
                  style={{ color: C.inkMute, ...mono }}
                >
                  {k.label}
                </p>
                <span
                  className="inline-flex items-center gap-0.5 rounded px-1.5 py-0.5 text-[9.5px] font-bold"
                  style={{
                    color: k.up ? C.okInk : C.warnInk,
                    background: k.up ? C.okWash : C.warnWash,
                    ...mono,
                  }}
                >
                  {k.up ? "▲" : "▼"} {k.trend.replace(/^[+-]/, "")}
                </span>
              </div>
              <p
                className="mt-3 text-[26px] font-bold leading-none"
                style={{ color: C.ink, ...mono }}
              >
                {k.value}
              </p>
              <div className="mt-3">
                <SignalLine data={k.spark} tone={k.up ? C.phos : C.warn} />
              </div>
            </Panel>
          ))}
        </div>
      </section>

      <section className="grid grid-cols-1 gap-5 lg:grid-cols-[1.45fr_1fr]">
        <div>
          <div className="mb-4 flex items-baseline justify-between">
            <Eyebrow>Contacten · marktplaats</Eyebrow>
            <button
              type="button"
              onClick={onOpen}
              className="rounded text-[10px] font-semibold uppercase tracking-[0.14em] transition-colors hover:brightness-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#35f0a0] focus-visible:ring-offset-2 focus-visible:ring-offset-[#0a1014]"
              style={{ color: C.phos, ...mono }}
            >
              Alle →
            </button>
          </div>
          <Panel>
            <ul>
              {OPDRACHTEN.map((o, i) => (
                <li key={o.id} style={{ borderTop: i === 0 ? "none" : `1px solid ${C.lineSoft}` }}>
                  <button
                    type="button"
                    onClick={onOpen}
                    className="group grid w-full grid-cols-[auto_1fr_auto] items-center gap-4 px-5 py-4 text-left transition-colors hover:bg-[#111f26] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#35f0a0] motion-reduce:transition-none"
                  >
                    <MatchNode value={o.match} size={44} />
                    <span className="min-w-0">
                      <span
                        className="block truncate text-[14.5px] font-semibold"
                        style={{ color: C.ink, ...body }}
                      >
                        {o.titel}
                      </span>
                      <span
                        className="mt-0.5 block truncate text-[11.5px]"
                        style={{ color: C.inkMute, ...mono }}
                      >
                        {o.opdrachtgever} · {o.plaats} · {o.tarief}
                      </span>
                    </span>
                    <span className="flex items-center gap-3">
                      <RangeMeter value={o.match} tone={o.match >= 90 ? C.phos : C.cyan} />
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
          <div className="mb-4">
            <Eyebrow>Certificaten</Eyebrow>
          </div>
          <Panel className="p-5">
            <ul className="space-y-1">
              {CREDENTIALS.map((c, i) => {
                const st = statusMeta(c.status);
                return (
                  <li
                    key={c.naam}
                    className="flex items-center gap-3 py-2.5"
                    style={{ borderTop: i === 0 ? "none" : `1px solid ${C.lineSoft}` }}
                  >
                    <span
                      className="inline-flex h-8 w-8 items-center justify-center rounded-md"
                      style={{
                        color: st.ink,
                        background: st.wash,
                        border: `1px solid ${st.tone}44`,
                      }}
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
                      <span
                        className="block truncate text-[10.5px] uppercase tracking-[0.04em]"
                        style={{ color: C.inkMute, ...mono }}
                      >
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
    <div className="space-y-7">
      <div>
        <Eyebrow>Marktplaats · scope-contacten</Eyebrow>
        <h1
          className="mt-3 text-[30px] font-semibold leading-none"
          style={{ color: C.ink, ...display }}
        >
          Open opdrachten
        </h1>
        <p
          className="mt-2 text-[12px] uppercase tracking-[0.08em]"
          style={{ color: C.inkMute, ...mono }}
        >
          {String(filtered.length).padStart(2, "0")} / {String(OPDRACHTEN.length).padStart(2, "0")}{" "}
          contacten in bereik
        </p>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div
          className="flex flex-1 items-center gap-2.5 rounded-lg px-5 py-3"
          style={{ background: C.panel, border: `1px solid ${C.line}` }}
        >
          <Search size={16} aria-hidden="true" style={{ color: C.inkFaint }} />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Zoek op titel, plaats of opdrachtgever…"
            aria-label="Opdrachten zoeken"
            className="w-full bg-transparent text-[13px] outline-none placeholder:text-[#4a655c]"
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
            {loading ? "Stop" : "Scan…"}
          </GhostButton>
        </div>
      </div>

      {loading ? (
        <ul className="space-y-4" aria-hidden="true">
          {[0, 1, 2].map((i) => (
            <li key={i}>
              <Panel className="p-6">
                <div className="animate-pulse space-y-3 motion-reduce:animate-none">
                  <div className="h-3 w-24 rounded" style={{ background: C.raise }} />
                  <div className="h-5 w-2/3 rounded" style={{ background: C.panelSoft }} />
                  <div className="h-3 w-1/2 rounded" style={{ background: C.raise }} />
                  <div className="h-2 w-full rounded" style={{ background: C.raise }} />
                </div>
              </Panel>
            </li>
          ))}
        </ul>
      ) : filtered.length === 0 ? (
        <Panel className="p-6" glow>
          <div className="flex flex-col items-center py-14 text-center">
            <span
              className="inline-flex h-16 w-16 items-center justify-center rounded-full"
              style={{ background: C.panelSoft, border: `1px solid ${C.phos}44`, color: C.phos }}
              aria-hidden="true"
            >
              <Radio size={26} />
            </span>
            <p className="mt-5 text-[22px] font-semibold" style={{ color: C.ink, ...display }}>
              Geen contact
            </p>
            <p className="mx-auto mt-2 max-w-xs text-[13px]" style={{ color: C.inkSoft }}>
              Geen signaal bij {q ? `“${q}”` : "je zoekterm"}. Verruim het bereik en scan opnieuw.
            </p>
            <div className="mt-6">
              <PrimaryButton onClick={() => setQ("")}>
                Bereik wissen <ArrowRight size={14} aria-hidden="true" />
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
  const tone = strong ? C.phos : C.cyan;
  return (
    <Panel className="p-6">
      <div className="grid grid-cols-[1fr_auto] items-start gap-4">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span
              className="inline-flex items-center gap-1 rounded px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.1em]"
              style={{ color: C.inkMute, border: `1px solid ${C.line}`, ...mono }}
            >
              № {String(index + 1).padStart(2, "0")}
            </span>
            <span className="text-[11px] font-semibold" style={{ color: C.inkFaint, ...mono }}>
              {opdracht.id}
            </span>
          </div>
          <h3
            className="mt-2 text-[18px] font-semibold leading-snug"
            style={{ color: C.ink, ...display }}
          >
            {opdracht.titel}
          </h3>
          <p className="mt-1 text-[12px]" style={{ color: C.inkMute, ...mono }}>
            {opdracht.opdrachtgever} · {opdracht.plaats} · {opdracht.uren}
          </p>
          <div className="mt-3 flex flex-wrap gap-1.5">
            {opdracht.tags.map((t) => (
              <span
                key={t}
                className="inline-flex items-center rounded px-2.5 py-0.5 text-[10.5px] font-semibold"
                style={{
                  color: C.inkSoft,
                  background: C.panelSoft,
                  border: `1px solid ${C.lineSoft}`,
                  ...mono,
                }}
              >
                {t}
              </span>
            ))}
          </div>
        </div>
        <div className="flex flex-col items-center gap-1.5">
          <MatchNode value={opdracht.match} size={56} />
          <span className="text-[13px] font-bold" style={{ color: tone, ...mono }}>
            {opdracht.tarief}
          </span>
        </div>
      </div>
      <div className="mt-4 flex items-center gap-3">
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          className="inline-flex items-center gap-1.5 rounded-lg px-3.5 py-1.5 text-[11px] font-semibold uppercase tracking-[0.06em] transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#35f0a0] focus-visible:ring-offset-2 focus-visible:ring-offset-[#0e161b]"
          style={{ color: C.phos, border: `1px solid ${C.line}`, ...mono }}
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
        className="grid transition-all duration-500 motion-reduce:transition-none"
        style={{ gridTemplateRows: open ? "1fr" : "0fr" }}
      >
        <div className="overflow-hidden">
          <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
            <RedenBlok titel="Signaal+" tone={C.okInk} Icon={Check} items={opdracht.redenen.plus} />
            <RedenBlok
              titel="Ruis"
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
      className="rounded-lg p-4"
      style={{ background: C.panelSoft, border: `1px solid ${C.lineSoft}` }}
    >
      <p
        className="text-[9.5px] font-semibold uppercase tracking-[0.16em]"
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
  const tone = strong ? C.phos : C.cyan;
  return (
    <div className="space-y-6">
      <button
        type="button"
        onClick={onBack}
        className="inline-flex items-center gap-2 rounded-lg px-4 py-2 text-[11.5px] font-semibold uppercase tracking-[0.06em] transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#35f0a0] focus-visible:ring-offset-2 focus-visible:ring-offset-[#0a1014]"
        style={{
          color: C.inkSoft,
          border: `1px solid ${C.line}`,
          background: C.panelSoft,
          ...mono,
        }}
      >
        <ArrowRight size={13} aria-hidden="true" className="rotate-180" /> Terug naar marktplaats
      </button>

      <Panel className="p-7 md:p-9" glow>
        <div className="flex flex-wrap items-center gap-2">
          <span
            className="inline-flex items-center rounded px-2.5 py-0.5 text-[10.5px] font-semibold"
            style={{ color: C.inkMute, border: `1px solid ${C.line}`, ...mono }}
          >
            {opdracht.id}
          </span>
          <span
            className="inline-flex items-center gap-1 rounded px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-[0.06em]"
            style={{ color: C.bgDeep, background: tone, ...mono }}
          >
            <Activity size={11} aria-hidden="true" /> {strong ? "Sterk signaal" : "Contact"} ·{" "}
            {opdracht.match}%
          </span>
        </div>
        <h1
          className="mt-4 max-w-2xl text-[28px] font-semibold leading-[1.08] md:text-[40px]"
          style={{ color: C.ink, ...display }}
        >
          {opdracht.titel}
        </h1>
        <p className="mt-2 text-[13.5px]" style={{ color: C.inkSoft, ...mono }}>
          {opdracht.opdrachtgever} · {opdracht.plaats}
        </p>
        <div className="mt-6 flex flex-wrap gap-2.5">
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
              className="p-5"
              style={{
                borderLeft: i % 4 === 0 ? "none" : `1px solid ${C.lineSoft}`,
                borderTop: i >= 2 ? `1px solid ${C.lineSoft}` : "none",
              }}
            >
              <p
                className="text-[9px] font-semibold uppercase tracking-[0.16em]"
                style={{ color: C.inkMute, ...mono }}
              >
                {m.l}
              </p>
              <p className="mt-1.5 text-[18px] font-bold" style={{ color: C.ink, ...mono }}>
                {m.v}
              </p>
            </div>
          ))}
        </div>
      </Panel>

      <section>
        <Eyebrow>Verklaarbare matching</Eyebrow>
        <p className="mt-3 max-w-xl text-[13px] leading-relaxed" style={{ color: C.inkSoft }}>
          Rechtstreeks berekend uit je geverifieerde profiel — het signaal dat aansluit én de ruis
          die aandacht vraagt, zonder verborgen score.
        </p>
        <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-2">
          <Panel className="p-6">
            <div className="flex items-center gap-2">
              <span
                className="inline-flex h-8 w-8 items-center justify-center rounded-md"
                style={{ color: C.okInk, background: C.okWash, border: `1px solid ${C.ok}44` }}
                aria-hidden="true"
              >
                <Check size={15} />
              </span>
              <p
                className="text-[10.5px] font-semibold uppercase tracking-[0.14em]"
                style={{ color: C.okInk, ...mono }}
              >
                Signaal+
              </p>
            </div>
            <ul className="mt-4 space-y-3">
              {opdracht.redenen.plus.map((r) => (
                <li
                  key={r}
                  className="flex items-start gap-3 text-[13px]"
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
          <Panel className="p-6">
            <div className="flex items-center gap-2">
              <span
                className="inline-flex h-8 w-8 items-center justify-center rounded-md"
                style={{
                  color: C.warnInk,
                  background: C.warnWash,
                  border: `1px solid ${C.warn}44`,
                }}
                aria-hidden="true"
              >
                <AlertTriangle size={14} />
              </span>
              <p
                className="text-[10.5px] font-semibold uppercase tracking-[0.14em]"
                style={{ color: C.warnInk, ...mono }}
              >
                Ruis
              </p>
            </div>
            <ul className="mt-4 space-y-3">
              {opdracht.redenen.min.map((r) => (
                <li
                  key={r}
                  className="flex items-start gap-3 text-[13px]"
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
      <Panel className="p-7 md:p-9" glow>
        <div className="flex flex-wrap items-center justify-between gap-6">
          <div className="max-w-md">
            <Eyebrow>Verificatie · vertrouwensniveau</Eyebrow>
            <h1
              className="mt-3 text-[26px] font-semibold leading-tight"
              style={{ color: C.ink, ...display }}
            >
              Jouw certificaten
            </h1>
            <p className="mt-3 text-[13px] leading-relaxed" style={{ color: C.inkSoft }}>
              <span className="font-semibold" style={{ color: C.phos }}>
                {PROFIEL.trust}.
              </span>{" "}
              {verified} van {CREDENTIALS.length} certificaten zijn geverifieerd. Eén verloopt
              binnenkort en vraagt om vernieuwing. Documenten blijven versleuteld en privé.
            </p>
            <div className="mt-4 max-w-xs">
              <RangeMeter value={ratio} />
            </div>
          </div>
          <span
            className="relative inline-flex h-24 w-24 items-center justify-center rounded-full"
            style={{
              background: C.panelSoft,
              border: `1px solid ${C.phos}55`,
              boxShadow: `0 0 24px -8px ${C.phosGlow}`,
            }}
            aria-hidden="true"
          >
            <span
              className="absolute inset-0 rounded-full"
              style={{
                background: `conic-gradient(${C.phos} ${ratio * 3.6}deg, transparent 0deg)`,
                opacity: 0.2,
              }}
            />
            <span className="relative flex flex-col items-center">
              <span
                className="text-[26px] font-bold leading-none"
                style={{ color: C.phos, ...mono }}
              >
                {ratio}
              </span>
              <span
                className="mt-1 text-[8px] font-semibold uppercase tracking-[0.16em]"
                style={{ color: C.inkMute, ...mono }}
              >
                % verifieerd
              </span>
            </span>
          </span>
        </div>
      </Panel>

      <Panel>
        <div
          className="hidden grid-cols-[1fr_11rem_2.5rem] items-center gap-4 px-6 py-3.5 sm:grid"
          style={{ borderBottom: `1px solid ${C.lineSoft}` }}
        >
          {["Certificaat", "Status", ""].map((h, i) => (
            <span
              key={h || i}
              className="text-[9px] font-semibold uppercase tracking-[0.18em]"
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
                style={{ borderTop: idx === 0 ? "none" : `1px solid ${C.lineSoft}` }}
              >
                <button
                  type="button"
                  onClick={() => setOpen(isOpen ? null : c.naam)}
                  aria-expanded={isOpen}
                  className="grid w-full grid-cols-[1fr_auto] items-center gap-4 px-6 py-4 text-left transition-colors hover:bg-[#111f26] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#35f0a0] motion-reduce:transition-none sm:grid-cols-[1fr_11rem_2.5rem]"
                >
                  <span className="flex min-w-0 items-center gap-3">
                    <span
                      className="inline-flex h-9 w-9 items-center justify-center rounded-md"
                      style={{
                        color: st.ink,
                        background: st.wash,
                        border: `1px solid ${st.tone}44`,
                      }}
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
                        className="mt-0.5 block truncate text-[11px]"
                        style={{ color: C.inkMute, ...mono }}
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
                  className="grid transition-all duration-500 motion-reduce:transition-none"
                  style={{ gridTemplateRows: isOpen ? "1fr" : "0fr" }}
                >
                  <div className="overflow-hidden">
                    <div className="px-6 pb-5 sm:pl-[76px]">
                      <div
                        className="rounded-lg p-4"
                        style={{ background: C.panelSoft, border: `1px solid ${C.lineSoft}` }}
                      >
                        <p
                          className="max-w-xl text-[12.5px] leading-relaxed"
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
        <div className="mb-4">
          <Eyebrow tone={C.cyan}>Documentenkast</Eyebrow>
        </div>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {DOCUMENTEN.map((d) => {
            const st = statusMeta(d.status);
            return (
              <Panel key={d.naam} className="flex items-center gap-3 p-4">
                <span
                  className="inline-flex h-10 w-10 items-center justify-center rounded-lg"
                  style={{ background: C.raise, border: `1px solid ${C.line}`, color: C.inkSoft }}
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
                  <span className="block text-[10.5px]" style={{ color: C.inkMute, ...mono }}>
                    {d.type} · {d.grootte} · {d.bijgewerkt}
                  </span>
                </span>
                <span
                  className="inline-flex items-center gap-1 rounded px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.04em]"
                  style={{
                    color: st.ink,
                    background: st.wash,
                    border: `1px solid ${st.tone}44`,
                    ...mono,
                  }}
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
        <Eyebrow>Acties · prioriteit</Eyebrow>
        <h1
          className="mt-3 text-[30px] font-semibold leading-none"
          style={{ color: C.ink, ...display }}
        >
          Wat nu aandacht vraagt
        </h1>
        <p className="mt-2 max-w-md text-[13px]" style={{ color: C.inkSoft }}>
          Van hoog naar laag prioriteit — zo blijf je verifieerbaar en betaald, zonder
          signaalverlies.
        </p>
      </div>

      <ol className="space-y-3">
        {ACTIES.map((a, i) => {
          const warn = a.urgentie === "warning";
          const tone = warn ? C.warn : C.phos;
          const ink = warn ? C.warnInk : C.phos;
          const wash = warn ? C.warnWash : C.phosWash;
          return (
            <li key={a.titel}>
              <Panel className="p-6">
                <div className="grid grid-cols-[auto_1fr] items-start gap-4 sm:grid-cols-[auto_1fr_auto]">
                  <span
                    className="flex h-11 w-11 items-center justify-center rounded-lg text-[15px] font-bold"
                    style={{ background: wash, border: `1px solid ${tone}55`, color: ink, ...mono }}
                    aria-hidden="true"
                  >
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <div className="min-w-0">
                    <span
                      className="inline-flex items-center gap-1 rounded px-2 py-0.5 text-[9px] font-semibold uppercase tracking-[0.12em]"
                      style={{
                        color: ink,
                        background: wash,
                        border: `1px solid ${tone}44`,
                        ...mono,
                      }}
                    >
                      {warn ? (
                        <AlertTriangle size={10} aria-hidden="true" />
                      ) : (
                        <Signal size={10} aria-hidden="true" />
                      )}
                      {warn ? "Urgent" : "Aanbevolen"}
                    </span>
                    <h2
                      className="mt-2 text-[18px] font-semibold leading-snug"
                      style={{ color: C.ink, ...display }}
                    >
                      {a.titel}
                    </h2>
                    <p
                      className="mt-1.5 max-w-lg text-[13px] leading-relaxed"
                      style={{ color: C.inkSoft }}
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
  return { ink: C.inkMute, wash: C.raise, tone: C.line, Icon: FileText };
}

function Facturen() {
  const totaalBetaald = "€ 8.622";
  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <Eyebrow>Facturen</Eyebrow>
          <h1
            className="mt-3 text-[30px] font-semibold leading-none"
            style={{ color: C.ink, ...display }}
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
          { l: "Betaald (mnd)", v: totaalBetaald, sub: "3 voldaan", alarm: false },
          { l: "Openstaand", v: "€ 1.350", sub: "1 factuur · 9 dagen", alarm: true },
          { l: "Concept", v: "€ 880", sub: "klaar om te versturen", alarm: false },
        ].map((s) => (
          <Panel key={s.l} className="p-6">
            <div className="flex items-center justify-between">
              <p
                className="text-[9.5px] font-semibold uppercase tracking-[0.12em]"
                style={{ color: C.inkMute, ...mono }}
              >
                {s.l}
              </p>
              {s.alarm && (
                <span
                  className="inline-flex h-6 w-6 items-center justify-center rounded-full"
                  style={{ background: C.warnWash, color: C.warnInk }}
                  aria-hidden="true"
                >
                  <AlertTriangle size={13} />
                </span>
              )}
            </div>
            <p
              className="mt-2 text-[26px] font-bold"
              style={{ color: s.alarm ? C.warnInk : C.ink, ...mono }}
            >
              {s.v}
            </p>
            <p className="mt-1 text-[11px]" style={{ color: C.inkMute }}>
              {s.sub}
            </p>
          </Panel>
        ))}
      </section>

      <Panel>
        <div
          className="hidden grid-cols-[8rem_1fr_5rem_9rem_6rem] gap-4 px-6 pb-3 pt-5 sm:grid"
          style={{ borderBottom: `1px solid ${C.lineSoft}` }}
        >
          {["Nummer", "Klant", "Datum", "Status", "Bedrag"].map((h, i) => (
            <span
              key={h}
              className={`text-[9px] font-semibold uppercase tracking-[0.16em] ${i === 4 ? "text-right" : ""}`}
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
                className="grid grid-cols-[1fr_auto] items-center gap-3 px-6 py-4 transition-colors hover:bg-[#111f26] sm:grid-cols-[8rem_1fr_5rem_9rem_6rem] sm:gap-4"
                style={{ borderTop: i === 0 ? "none" : `1px solid ${C.lineSoft}` }}
              >
                <span
                  className="order-1 text-[11.5px] font-semibold"
                  style={{ color: C.inkMute, ...mono }}
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
                  style={{ color: C.inkMute, ...mono }}
                >
                  {f.datum}
                </span>
                <span className="order-5 sm:order-4">
                  <span
                    className="inline-flex items-center gap-1.5 rounded px-2.5 py-1 text-[10.5px] font-semibold uppercase tracking-[0.04em]"
                    style={{
                      color: ft.ink,
                      background: ft.wash,
                      border: `1px solid ${ft.tone}44`,
                      ...mono,
                    }}
                  >
                    {ft.Icon && <ft.Icon size={11} aria-hidden="true" />}
                    {f.status}
                  </span>
                </span>
                <span
                  className="order-2 text-right text-[14px] font-bold sm:order-5"
                  style={{ color: acc ? C.warnInk : C.ink, ...mono }}
                >
                  {f.bedrag}
                </span>
              </li>
            );
          })}
        </ul>
        <div
          className="flex items-baseline justify-between px-6 py-4"
          style={{ borderTop: `1px solid ${C.lineSoft}` }}
        >
          <span
            className="text-[9.5px] font-semibold uppercase tracking-[0.18em]"
            style={{ color: C.inkMute, ...mono }}
          >
            Totaal betaald
          </span>
          <span className="text-[20px] font-bold" style={{ color: C.phos, ...mono }}>
            {totaalBetaald}
          </span>
        </div>
      </Panel>
    </div>
  );
}
