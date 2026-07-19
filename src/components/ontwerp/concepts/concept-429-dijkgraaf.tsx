"use client";

// Concept 429 — "Dijkgraaf" · Waterschap / polder-infographic.
// Een Nederlands-civiele interface in de taal van waterbeheer: waterpeil-meters (peilschalen),
// een dijkdoorsnede-diagram en een polderraster (rechte sloten en kavels) als layout-grid.
// Water-blauw (#1f6f8b) tegen land-groen op een lichte klei-achtergrond (#eef2f1), tekst #1b2a2e.
// Data wordt "peil": match-% is een waterhoogte in een meetlat, factuur-status is een sluis open/dicht.
// Dunne meetlijnen, mono-cijfers voor peilen, strak infographic-gevoel. Serieus en geruststellend —
// past bij compliance en gevoelige documenten. Micro-interacties respecteren reduced-motion.

import { useMemo, useState } from "react";
import {
  AlertTriangle,
  ArrowRight,
  Bell,
  Check,
  ChevronRight,
  Clock,
  FileText,
  Gauge,
  Landmark,
  Minus,
  Plus,
  Ruler,
  Search,
  ShieldCheck,
  Waves,
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

// — Palet: water-blauw, land-groen, klei-licht, diep teal-ink —
const C = {
  clay: "#eef2f1",
  clayDeep: "#e3e9e8",
  paper: "#f7faf9",
  paperSoft: "#eef3f2",
  raise: "#e7edec",
  ink: "#1b2a2e",
  inkSoft: "#3c4c50",
  inkMute: "#6a7a7d",
  inkFaint: "#9aa8aa",
  line: "rgba(27,42,46,0.11)",
  lineSoft: "rgba(27,42,46,0.06)",
  water: "#1f6f8b",
  waterHi: "#2d88a6",
  waterDeep: "#154f63",
  waterWash: "rgba(31,111,139,0.11)",
  waterMist: "rgba(31,111,139,0.06)",
  land: "#6f8f5c",
  landDeep: "#54713f",
  landWash: "rgba(111,143,92,0.15)",
  ok: "#5f8a6a",
  okInk: "#3f6b4c",
  okWash: "rgba(95,138,106,0.15)",
  warn: "#c58a3d",
  warnInk: "#956320",
  warnWash: "rgba(197,138,61,0.16)",
  info: "#1f6f8b",
  infoInk: "#154f63",
  infoWash: "rgba(31,111,139,0.11)",
  bad: "#bb6b5f",
  badInk: "#96473c",
  badWash: "rgba(187,107,95,0.16)",
};

const display = {
  fontFamily: "'Inter', 'Segoe UI', system-ui, -apple-system, sans-serif",
};
const body = {
  fontFamily: "'Inter', 'Segoe UI', system-ui, -apple-system, sans-serif",
};
const num = {
  fontFamily: "'IBM Plex Mono', ui-monospace, SFMono-Regular, Menlo, monospace",
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

// — Polderraster: rechte sloten en kavels als subtiele, technische achtergrond —
function PolderGrid({ className = "" }: { className?: string }) {
  return (
    <svg
      className={`pointer-events-none absolute inset-0 h-full w-full ${className}`}
      aria-hidden="true"
      preserveAspectRatio="none"
    >
      <defs>
        <pattern id="polder-kavel" width="64" height="64" patternUnits="userSpaceOnUse">
          <path d="M64 0H0V64" fill="none" stroke={C.water} strokeOpacity="0.06" strokeWidth="1" />
          <path
            d="M32 0V64M0 32H64"
            fill="none"
            stroke={C.water}
            strokeOpacity="0.03"
            strokeWidth="1"
          />
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill="url(#polder-kavel)" />
    </svg>
  );
}

// — Dijkdoorsnede: civiel dwarsprofiel met waterzijde (blauw) en landzijde (groen) —
function DijkDoorsnede({ peil = 62 }: { peil?: number }) {
  const waterTop = 78 - (peil / 100) * 40;
  return (
    <svg
      viewBox="0 0 320 120"
      className="h-full w-full"
      preserveAspectRatio="none"
      role="img"
      aria-label={`Dijkdoorsnede met waterpeil op ${peil} procent`}
    >
      <defs>
        <linearGradient id="dijk-water" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={C.waterHi} stopOpacity="0.5" />
          <stop offset="100%" stopColor={C.waterDeep} stopOpacity="0.28" />
        </linearGradient>
        <linearGradient id="dijk-body" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={C.land} stopOpacity="0.34" />
          <stop offset="100%" stopColor={C.landDeep} stopOpacity="0.18" />
        </linearGradient>
      </defs>
      {/* waterzijde */}
      <rect x="0" y={waterTop} width="118" height={120 - waterTop} fill="url(#dijk-water)" />
      {[0, 1, 2].map((i) => (
        <path
          key={i}
          d={`M0 ${waterTop + 6 + i * 9} q 30 -5 60 0 t 60 0`}
          fill="none"
          stroke={C.water}
          strokeOpacity={0.22 - i * 0.05}
          strokeWidth="1"
        />
      ))}
      {/* dijklichaam (trapezium) */}
      <path d="M100 118 L140 30 L188 30 L232 118 Z" fill="url(#dijk-body)" />
      <path
        d="M100 118 L140 30 L188 30 L232 118"
        fill="none"
        stroke={C.landDeep}
        strokeOpacity="0.5"
        strokeWidth="1.4"
      />
      {/* kruinlijn */}
      <line
        x1="140"
        y1="30"
        x2="188"
        y2="30"
        stroke={C.ink}
        strokeOpacity="0.4"
        strokeWidth="1.4"
        strokeDasharray="2 3"
      />
      {/* maaiveld / landzijde */}
      <line x1="232" y1="118" x2="320" y2="118" stroke={C.landDeep} strokeOpacity="0.4" />
      {/* peil-referentielijn */}
      <line
        x1="0"
        y1={waterTop}
        x2="120"
        y2={waterTop}
        stroke={C.water}
        strokeOpacity="0.65"
        strokeWidth="1.2"
      />
    </svg>
  );
}

// — Peilschaal: horizontale meetlat met ijk-streepjes; het "peil" vult als water —
function Peilschaal({
  value,
  tone = C.water,
  compact = false,
}: {
  value: number;
  tone?: string;
  compact?: boolean;
}) {
  const ticks = compact ? 5 : 10;
  return (
    <span className="flex w-full items-center gap-2.5" aria-hidden="true">
      <span
        className="relative block h-2.5 flex-1 overflow-hidden rounded-[3px]"
        style={{ background: C.raise, border: `1px solid ${C.line}` }}
      >
        <span
          className="absolute inset-y-0 left-0 block rounded-[2px]"
          style={{
            width: `${value}%`,
            background: `linear-gradient(90deg, ${tone}bb, ${tone})`,
            transition: "width 0.6s cubic-bezier(0.22,1,0.36,1)",
          }}
        />
        <span className="absolute inset-0 flex justify-between px-[2px]">
          {Array.from({ length: ticks + 1 }).map((_, i) => (
            <span
              key={i}
              className="block w-px"
              style={{
                height: i % 5 === 0 ? "100%" : "55%",
                alignSelf: "flex-end",
                background: C.ink,
                opacity: 0.16,
              }}
            />
          ))}
        </span>
      </span>
      <span
        className="min-w-[38px] text-right text-[12.5px] font-semibold leading-none"
        style={{ color: tone, ...num }}
      >
        {value}
        <span className="text-[9px]"> NAP</span>
      </span>
    </span>
  );
}

function Panel({
  children,
  className = "",
  as: Tag = "div",
  tone = "paper",
}: {
  children: React.ReactNode;
  className?: string;
  as?: "div" | "section" | "li";
  tone?: "paper" | "water" | "clay";
}) {
  const bg = tone === "water" ? C.waterMist : tone === "clay" ? C.clayDeep : C.paper;
  return (
    <Tag
      className={`relative overflow-hidden rounded-lg ${className}`}
      style={{
        background: bg,
        border: `1px solid ${C.line}`,
        boxShadow: "0 1px 2px rgba(27,42,46,0.03), 0 8px 24px rgba(27,42,46,0.04)",
        color: C.ink,
      }}
    >
      {children}
    </Tag>
  );
}

function Eyebrow({ children, tone = C.waterDeep }: { children: React.ReactNode; tone?: string }) {
  return (
    <p
      className="flex items-center gap-2 text-[10.5px] font-semibold uppercase tracking-[0.2em]"
      style={{ color: tone, ...body }}
    >
      <Ruler size={11} aria-hidden="true" />
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
      className="inline-flex items-center gap-1.5 rounded-[5px] px-2.5 py-1 text-[11px] font-semibold"
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
      className={`group inline-flex items-center justify-center gap-2 rounded-[7px] px-5 py-2.5 text-[13px] font-semibold transition-all duration-300 hover:brightness-[1.06] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1f6f8b] focus-visible:ring-offset-2 focus-visible:ring-offset-[#eef2f1] active:translate-y-px motion-reduce:transition-none ${className}`}
      style={{
        color: C.paper,
        background: C.water,
        boxShadow: "0 6px 16px rgba(21,79,99,0.22)",
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
      className={`inline-flex items-center justify-center gap-2 rounded-[7px] px-4 py-2.5 text-[12.5px] font-semibold transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1f6f8b] focus-visible:ring-offset-2 focus-visible:ring-offset-[#eef2f1] motion-reduce:transition-none ${className}`}
      style={{
        color: active ? C.paper : C.inkSoft,
        background: active ? C.water : C.paper,
        border: `1px solid ${active ? C.water : C.line}`,
        ...body,
      }}
    >
      {children}
    </button>
  );
}

// — Peil-sparkline: waterstand-curve met ijk-vlak en meetpunt —
function PeilLine({ data, tone, id }: { data: number[]; tone: string; id: string }) {
  const max = Math.max(...data);
  const min = Math.min(...data);
  const span = max - min || 1;
  const w = 120;
  const h = 32;
  const pts = data.map((d, i) => {
    const x = (i / (data.length - 1)) * w;
    const y = h - ((d - min) / span) * (h - 9) - 4;
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
        <linearGradient id={`peil-${id}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={tone} stopOpacity="0.24" />
          <stop offset="100%" stopColor={tone} stopOpacity="0" />
        </linearGradient>
      </defs>
      {[0.5, 1].map((f, i) => (
        <line
          key={i}
          x1="0"
          y1={h * f - 2}
          x2={w}
          y2={h * f - 2}
          stroke={C.ink}
          strokeOpacity="0.05"
          strokeWidth="1"
        />
      ))}
      <polygon points={`0,${h} ${line} ${w},${h}`} fill={`url(#peil-${id})`} />
      <polyline points={line} fill="none" stroke={tone} strokeWidth="1.6" strokeLinejoin="round" />
      <rect
        x={last[0] - 2}
        y={last[1] - 2}
        width="4"
        height="4"
        fill={C.paper}
        stroke={tone}
        strokeWidth="1.3"
      />
    </svg>
  );
}

export function Concept429() {
  const [screen, setScreen] = useState<ScreenKey>("dashboard");
  const active = OPDRACHTEN[0] as Opdracht;

  return (
    <div
      className="relative min-h-[720px] w-full antialiased"
      style={{
        ...body,
        color: C.ink,
        background: `linear-gradient(180deg, ${C.clayDeep} 0%, ${C.clay} 46%, ${C.paperSoft} 100%)`,
      }}
    >
      <style>{`
        @keyframes dijkRise { from { opacity: 0; transform: translateY(7px); } to { opacity: 1; transform: translateY(0); } }
        .dijk-rise { animation: dijkRise 0.42s cubic-bezier(0.22, 1, 0.36, 1) both; }
        @media (prefers-reduced-motion: reduce) { .dijk-rise { animation: none !important; } }
      `}</style>

      <PolderGrid className="opacity-70" />

      <div className="relative mx-auto max-w-6xl px-4 pb-24 sm:px-6 md:px-8">
        <TopBar />
        <NavBar screen={screen} setScreen={setScreen} />
        <main key={screen} className="dijk-rise pt-7">
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
          className="inline-flex h-11 w-11 items-center justify-center rounded-lg"
          style={{ background: C.waterWash, border: `1px solid ${C.water}`, color: C.waterDeep }}
          aria-hidden="true"
        >
          <Landmark size={19} />
        </span>
        <div>
          <p
            className="text-[19px] font-semibold leading-none tracking-[-0.01em]"
            style={{ color: C.ink, ...display }}
          >
            Dijkgraaf
          </p>
          <p
            className="mt-1.5 flex items-center gap-1.5 text-[11px] leading-none"
            style={{ color: C.inkMute, ...num }}
          >
            <Waves size={11} aria-hidden="true" style={{ color: C.water }} />
            Peilgebied {PROFIEL.plaats} · streefpeil bereikt
          </p>
        </div>
      </div>
      <div className="flex items-center gap-3">
        <span
          className="hidden items-center gap-1.5 rounded-[6px] px-3 py-1.5 text-[11px] font-semibold sm:inline-flex"
          style={{ color: C.okInk, border: `1px solid ${C.ok}`, background: C.okWash, ...body }}
        >
          <ShieldCheck size={12} aria-hidden="true" />
          {PROFIEL.trust}
        </span>
        <span
          className="relative inline-flex h-10 w-10 items-center justify-center rounded-[8px]"
          style={{ background: C.paper, border: `1px solid ${C.line}`, color: C.inkMute }}
          aria-label={`${ongelezen} ongelezen berichten`}
        >
          <Bell size={16} aria-hidden="true" />
          {ongelezen > 0 && (
            <span
              className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full text-[9px] font-bold"
              style={{ background: C.water, color: C.paper, ...num }}
              aria-hidden="true"
            >
              {ongelezen}
            </span>
          )}
        </span>
        <span className="hidden text-right sm:block">
          <span className="block text-[14px] font-semibold" style={{ color: C.ink, ...body }}>
            {PROFIEL.naam}
          </span>
          <span className="block text-[11px]" style={{ color: C.inkMute, ...body }}>
            {PROFIEL.rol}
          </span>
        </span>
        <span
          className="inline-flex h-11 w-11 items-center justify-center rounded-lg text-[13px] font-semibold"
          style={{
            background: C.landWash,
            border: `1px solid ${C.line}`,
            color: C.landDeep,
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
    <nav aria-label="Hoofdnavigatie" className="mt-7">
      <div
        className="flex items-center gap-1 overflow-x-auto rounded-lg p-1.5"
        style={{ background: C.paper, border: `1px solid ${C.line}` }}
      >
        {SCREENS.map((s) => {
          const on = s.key === screen;
          return (
            <button
              key={s.key}
              type="button"
              onClick={() => setScreen(s.key)}
              aria-current={on ? "page" : undefined}
              className="flex shrink-0 items-center gap-2 rounded-[6px] px-4 py-2 text-[12.5px] font-semibold transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1f6f8b] focus-visible:ring-offset-2 focus-visible:ring-offset-[#f7faf9] motion-reduce:transition-none"
              style={{
                color: on ? C.paper : C.inkMute,
                background: on ? C.water : "transparent",
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
    <div className="space-y-7">
      <section className="grid grid-cols-1 gap-5 lg:grid-cols-[1.4fr_1fr]">
        <Panel className="p-7 md:p-9" tone="water">
          <div className="relative">
            <Eyebrow>Peilbeheer · vandaag</Eyebrow>
            <div className="mt-4 flex items-start justify-between gap-4">
              <h1
                className="text-[30px] font-semibold leading-[1.08] tracking-[-0.02em] md:text-[40px]"
                style={{ color: C.ink, ...display }}
              >
                Goedemorgen,
                <br />
                {PROFIEL.naam.split(" ")[0]}.
              </h1>
              <Gauge
                size={26}
                aria-hidden="true"
                style={{ color: C.water }}
                className="hidden sm:block"
              />
            </div>
            <p className="mt-3 max-w-md text-[14px] leading-relaxed" style={{ color: C.inkSoft }}>
              Het streefpeil is bereikt en de sluizen staan goed. Loop je acties langs, houd je
              praktijk verifieerbaar en betaald — beheerst en op peil.
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
            <div
              className="mt-6 h-20 overflow-hidden rounded-[6px]"
              style={{ border: `1px solid ${C.lineSoft}`, background: C.paper }}
            >
              <DijkDoorsnede peil={72} />
            </div>
          </div>
        </Panel>

        <Panel className="p-7">
          <div className="flex items-center justify-between">
            <Eyebrow tone={C.warnInk}>Vraagt aandacht</Eyebrow>
            <AlertTriangle size={18} aria-hidden="true" style={{ color: C.warn }} />
          </div>
          <h2
            className="mt-4 text-[20px] font-semibold leading-snug"
            style={{ color: C.ink, ...display }}
          >
            {primair.titel}
          </h2>
          <p className="mt-2 text-[13.5px] leading-relaxed" style={{ color: C.inkSoft }}>
            {primair.detail}
          </p>
          <div className="mt-6">
            <PrimaryButton onClick={onActies} className="w-full">
              {primair.cta}
              <ArrowRight size={14} aria-hidden="true" />
            </PrimaryButton>
          </div>
          <div className="mt-5 pt-4" style={{ borderTop: `1px solid ${C.lineSoft}` }}>
            <p className="flex items-center gap-2 text-[12px]" style={{ color: C.inkMute, ...num }}>
              <Waves size={13} aria-hidden="true" style={{ color: C.water }} />
              {verified}/{CREDENTIALS.length} certificaten op peil · 7 open reacties
            </p>
          </div>
        </Panel>
      </section>

      <section>
        <div className="mb-4">
          <Eyebrow>Peilregister · deze maand</Eyebrow>
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {KPIS.map((k, i) => (
            <Panel key={k.label} className="p-5">
              <div className="flex items-start justify-between gap-2">
                <p
                  className="text-[10.5px] font-semibold uppercase tracking-[0.1em]"
                  style={{ color: C.inkMute, ...body }}
                >
                  {k.label}
                </p>
                <span
                  className="inline-flex items-center gap-0.5 rounded-[4px] px-1.5 py-0.5 text-[9.5px] font-bold"
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
                className="mt-3 text-[27px] font-semibold leading-none tracking-[-0.01em]"
                style={{ color: C.ink, ...num }}
              >
                {k.value}
              </p>
              <div className="mt-3">
                <PeilLine data={k.spark} tone={k.up ? C.water : C.warn} id={`kpi-${i}`} />
              </div>
            </Panel>
          ))}
        </div>
      </section>

      <section className="grid grid-cols-1 gap-5 lg:grid-cols-[1.45fr_1fr]">
        <div>
          <div className="mb-4 flex items-baseline justify-between">
            <Eyebrow>Instroom · open opdrachten</Eyebrow>
            <button
              type="button"
              onClick={onOpen}
              className="rounded text-[11px] font-semibold uppercase tracking-[0.14em] transition-colors hover:brightness-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1f6f8b] focus-visible:ring-offset-2 focus-visible:ring-offset-[#eef2f1]"
              style={{ color: C.waterDeep, ...body }}
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
                    className="group grid w-full grid-cols-[auto_1fr_auto] items-center gap-4 px-5 py-4 text-left transition-colors hover:bg-[#eef3f2] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#1f6f8b] motion-reduce:transition-none"
                  >
                    <span
                      className="inline-flex h-10 w-10 items-center justify-center rounded-[7px]"
                      style={{
                        background: i === 0 ? C.waterWash : C.raise,
                        border: `1px solid ${i === 0 ? C.water : C.line}`,
                      }}
                    >
                      <span
                        className="text-[12px] font-bold leading-none"
                        style={{ color: i === 0 ? C.waterDeep : C.inkMute, ...num }}
                      >
                        {o.match}
                      </span>
                    </span>
                    <span className="min-w-0">
                      <span
                        className="block truncate text-[15px] font-semibold"
                        style={{ color: C.ink, ...body }}
                      >
                        {o.titel}
                      </span>
                      <span
                        className="mt-0.5 block truncate text-[12px]"
                        style={{ color: C.inkMute }}
                      >
                        {o.opdrachtgever} · {o.plaats} · {o.tarief}
                      </span>
                    </span>
                    <span className="flex items-center gap-3">
                      <span className="hidden w-28 sm:block">
                        <Peilschaal
                          value={o.match}
                          tone={o.match >= 90 ? C.water : C.warn}
                          compact
                        />
                      </span>
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
            <Eyebrow>Certificaten · peilstatus</Eyebrow>
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
                      className="inline-flex h-8 w-8 items-center justify-center rounded-[6px]"
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
    <div className="space-y-7">
      <div>
        <Eyebrow>Marktplaats · instroom</Eyebrow>
        <h1
          className="mt-3 text-[30px] font-semibold leading-none tracking-[-0.02em]"
          style={{ color: C.ink, ...display }}
        >
          Open opdrachten
        </h1>
        <p className="mt-2 text-[13px]" style={{ color: C.inkMute, ...num }}>
          {String(filtered.length).padStart(2, "0")} van{" "}
          {String(OPDRACHTEN.length).padStart(2, "0")} opdrachten in het peilgebied
        </p>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div
          className="flex flex-1 items-center gap-2.5 rounded-[8px] px-5 py-3"
          style={{ background: C.paper, border: `1px solid ${C.line}` }}
        >
          <Search size={16} aria-hidden="true" style={{ color: C.inkFaint }} />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Zoek op titel, plaats of opdrachtgever…"
            aria-label="Opdrachten zoeken"
            className="w-full bg-transparent text-[13px] outline-none placeholder:text-[#9aa8aa]"
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
              {s === "match" ? "Beste match" : "Tarief"}
            </GhostButton>
          ))}
          <GhostButton onClick={() => setLoading((v) => !v)} active={loading} ariaPressed={loading}>
            {loading ? "Stop" : "Peilen…"}
          </GhostButton>
        </div>
      </div>

      {loading ? (
        <ul className="space-y-4" aria-hidden="true">
          {[0, 1, 2].map((i) => (
            <li key={i}>
              <Panel className="p-6">
                <div className="animate-pulse space-y-3 motion-reduce:animate-none">
                  <div className="h-3 w-24 rounded-[4px]" style={{ background: C.raise }} />
                  <div className="h-5 w-2/3 rounded-[4px]" style={{ background: C.clayDeep }} />
                  <div className="h-3 w-1/2 rounded-[4px]" style={{ background: C.raise }} />
                  <div className="h-2 w-full rounded-[4px]" style={{ background: C.raise }} />
                </div>
              </Panel>
            </li>
          ))}
        </ul>
      ) : filtered.length === 0 ? (
        <Panel className="p-6" tone="water">
          <div className="relative flex flex-col items-center py-14 text-center">
            <span
              className="inline-flex h-16 w-16 items-center justify-center rounded-[10px]"
              style={{
                background: C.waterWash,
                border: `1px solid ${C.water}`,
                color: C.waterDeep,
              }}
              aria-hidden="true"
            >
              <Waves size={26} />
            </span>
            <p className="mt-5 text-[22px] font-semibold" style={{ color: C.ink, ...display }}>
              Droog peilgebied
            </p>
            <p className="mx-auto mt-2 max-w-xs text-[13.5px]" style={{ color: C.inkSoft }}>
              Geen instroom bij {q ? `“${q}”` : "je zoekterm"}. Verruim de zoekterm en peil opnieuw.
            </p>
            <div className="mt-6">
              <PrimaryButton onClick={() => setQ("")}>
                Zoekterm wissen <ArrowRight size={14} aria-hidden="true" />
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
  const tone = strong ? C.water : C.warn;
  const toneInk = strong ? C.waterDeep : C.warnInk;
  return (
    <Panel className="p-6">
      <div className="grid grid-cols-[1fr_auto] items-start gap-4">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span
              className="inline-flex items-center gap-1 rounded-[4px] px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.1em]"
              style={{ color: C.inkMute, border: `1px solid ${C.line}`, ...num }}
            >
              kavel {String(index + 1).padStart(2, "0")}
            </span>
            <span className="text-[11px] font-semibold" style={{ color: C.inkFaint, ...num }}>
              {opdracht.id}
            </span>
          </div>
          <h3
            className="mt-2 text-[19px] font-semibold leading-snug"
            style={{ color: C.ink, ...display }}
          >
            {opdracht.titel}
          </h3>
          <p className="mt-1 text-[12.5px]" style={{ color: C.inkMute }}>
            {opdracht.opdrachtgever} · {opdracht.plaats} · {opdracht.uren}
          </p>
          <div className="mt-3 flex flex-wrap gap-1.5">
            {opdracht.tags.map((t) => (
              <span
                key={t}
                className="inline-flex items-center rounded-[4px] px-2.5 py-0.5 text-[10.5px] font-semibold"
                style={{
                  color: C.inkSoft,
                  background: C.raise,
                  border: `1px solid ${C.lineSoft}`,
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
            className="inline-flex h-14 w-14 flex-col items-center justify-center rounded-[9px]"
            style={{ background: strong ? C.waterWash : C.warnWash, border: `1.5px solid ${tone}` }}
          >
            <span className="text-[16px] font-bold leading-none" style={{ color: toneInk, ...num }}>
              {opdracht.match}
            </span>
            <span
              className="mt-0.5 text-[7.5px] uppercase tracking-[0.12em]"
              style={{ color: C.inkFaint, ...body }}
            >
              peil
            </span>
          </span>
          <span className="text-[13px] font-bold" style={{ color: toneInk, ...num }}>
            {opdracht.tarief}
          </span>
        </div>
      </div>
      <div className="mt-4">
        <Peilschaal value={opdracht.match} tone={tone} />
      </div>
      <div className="mt-4 flex items-center gap-3">
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          className="inline-flex items-center gap-1.5 rounded-[6px] px-3.5 py-1.5 text-[11.5px] font-semibold transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1f6f8b] focus-visible:ring-offset-2 focus-visible:ring-offset-[#f7faf9]"
          style={{ color: C.waterDeep, border: `1px solid ${C.line}`, ...body }}
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
            <RedenBlok
              titel="Bovenpeil"
              tone={C.okInk}
              Icon={Check}
              items={opdracht.redenen.plus}
            />
            <RedenBlok
              titel="Onderpeil"
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
      className="rounded-[7px] p-4"
      style={{ background: C.raise, border: `1px solid ${C.lineSoft}` }}
    >
      <p
        className="text-[10px] font-semibold uppercase tracking-[0.16em]"
        style={{ color: tone, ...body }}
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
  const tone = strong ? C.water : C.warn;
  const toneInk = strong ? C.waterDeep : C.warnInk;
  return (
    <div className="space-y-6">
      <button
        type="button"
        onClick={onBack}
        className="inline-flex items-center gap-2 rounded-[7px] px-4 py-2 text-[12.5px] font-semibold transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1f6f8b] focus-visible:ring-offset-2 focus-visible:ring-offset-[#eef2f1]"
        style={{ color: C.inkSoft, border: `1px solid ${C.line}`, background: C.paper, ...body }}
      >
        <ArrowRight size={13} aria-hidden="true" className="rotate-180" /> Terug naar marktplaats
      </button>

      <Panel className="p-7 md:p-9" tone="water">
        <div className="relative flex flex-wrap items-center gap-2">
          <span
            className="inline-flex items-center rounded-[4px] px-2.5 py-0.5 text-[10.5px] font-semibold"
            style={{ color: C.inkMute, border: `1px solid ${C.line}`, ...num }}
          >
            {opdracht.id}
          </span>
          <span
            className="inline-flex items-center gap-1 rounded-[4px] px-2.5 py-0.5 text-[11px] font-bold"
            style={{ color: C.paper, background: tone, ...body }}
          >
            <Gauge size={11} aria-hidden="true" /> Peil {opdracht.match}%
          </span>
        </div>
        <h1
          className="relative mt-4 max-w-2xl text-[28px] font-semibold leading-[1.1] tracking-[-0.02em] md:text-[38px]"
          style={{ color: C.ink, ...display }}
        >
          {opdracht.titel}
        </h1>
        <p className="relative mt-2 text-[14px]" style={{ color: C.inkSoft }}>
          {opdracht.opdrachtgever} · {opdracht.plaats}
        </p>
        <div className="relative mt-5 max-w-md">
          <Peilschaal value={opdracht.match} tone={tone} />
        </div>
        <div className="relative mt-6 flex flex-wrap gap-2.5">
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
            { l: "Peil", v: `${opdracht.match}%` },
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
                className="text-[9.5px] font-semibold uppercase tracking-[0.16em]"
                style={{ color: C.inkMute, ...body }}
              >
                {m.l}
              </p>
              <p
                className="mt-1.5 text-[18px] font-semibold tracking-[-0.01em]"
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
        <p className="mt-3 max-w-xl text-[13.5px] leading-relaxed" style={{ color: C.inkSoft }}>
          Afgelezen van je geverifieerde profiel — wat boven peil staat én waar het water zakt,
          zonder verborgen score.
        </p>
        <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-2">
          <Panel className="p-6">
            <div className="flex items-center gap-2">
              <span
                className="inline-flex h-8 w-8 items-center justify-center rounded-[6px]"
                style={{ color: C.okInk, background: C.okWash, border: `1px solid ${C.ok}` }}
                aria-hidden="true"
              >
                <Check size={15} />
              </span>
              <p
                className="text-[11px] font-semibold uppercase tracking-[0.14em]"
                style={{ color: C.okInk, ...body }}
              >
                Bovenpeil
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
          <Panel className="p-6">
            <div className="flex items-center gap-2">
              <span
                className="inline-flex h-8 w-8 items-center justify-center rounded-[6px]"
                style={{ color: C.warnInk, background: C.warnWash, border: `1px solid ${C.warn}` }}
                aria-hidden="true"
              >
                <AlertTriangle size={14} />
              </span>
              <p
                className="text-[11px] font-semibold uppercase tracking-[0.14em]"
                style={{ color: C.warnInk, ...body }}
              >
                Onderpeil
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
        <div className="mt-4">
          <span className="text-[12px]" style={{ color: toneInk, ...body }}>
            Matchpeil {opdracht.match}% —{" "}
            {strong
              ? "ruim boven streefpeil, sterke aansluiting."
              : "op streefpeil, redelijke aansluiting."}
          </span>
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
      <Panel className="p-7 md:p-9" tone="water">
        <div className="relative flex flex-wrap items-center justify-between gap-6">
          <div className="max-w-md">
            <Eyebrow>Verificatie · vertrouwenspeil</Eyebrow>
            <h1
              className="mt-3 text-[26px] font-semibold leading-tight tracking-[-0.02em]"
              style={{ color: C.ink, ...display }}
            >
              Jouw certificaten
            </h1>
            <p className="mt-3 text-[13.5px] leading-relaxed" style={{ color: C.inkSoft }}>
              <span className="font-semibold" style={{ color: C.waterDeep }}>
                {PROFIEL.trust}.
              </span>{" "}
              {verified} van {CREDENTIALS.length} certificaten staan op peil en geverifieerd. Eén
              verloopt binnenkort en vraagt om vernieuwing. Documenten blijven versleuteld en privé.
            </p>
            <div className="mt-4 max-w-xs">
              <Peilschaal value={ratio} tone={C.water} />
            </div>
          </div>
          <span
            className="inline-flex h-24 w-24 flex-col items-center justify-center rounded-full"
            style={{ background: C.waterWash, border: `1.5px solid ${C.water}` }}
          >
            <span
              className="text-[26px] font-semibold leading-none"
              style={{ color: C.waterDeep, ...num }}
            >
              {ratio}
            </span>
            <span
              className="mt-1 text-[8px] font-semibold uppercase tracking-[0.16em]"
              style={{ color: C.inkMute, ...body }}
            >
              % op peil
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
              className="text-[9.5px] font-semibold uppercase tracking-[0.18em]"
              style={{ color: C.inkMute, ...body }}
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
                  className="grid w-full grid-cols-[1fr_auto] items-center gap-4 px-6 py-4 text-left transition-colors hover:bg-[#eef3f2] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#1f6f8b] motion-reduce:transition-none sm:grid-cols-[1fr_11rem_2.5rem]"
                >
                  <span className="flex min-w-0 items-center gap-3">
                    <span
                      className="inline-flex h-9 w-9 items-center justify-center rounded-[7px]"
                      style={{ color: st.ink, background: st.wash, border: `1px solid ${st.tone}` }}
                      aria-hidden="true"
                    >
                      <st.Icon size={16} />
                    </span>
                    <span className="min-w-0">
                      <span
                        className="block truncate text-[15px] font-semibold"
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
                  className="grid transition-all duration-500 motion-reduce:transition-none"
                  style={{ gridTemplateRows: isOpen ? "1fr" : "0fr" }}
                >
                  <div className="overflow-hidden">
                    <div className="px-6 pb-5 sm:pl-[76px]">
                      <div
                        className="rounded-[8px] p-4"
                        style={{ background: C.raise, border: `1px solid ${C.lineSoft}` }}
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
        <div className="mb-4">
          <Eyebrow tone={C.landDeep}>Documentenkast</Eyebrow>
        </div>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {DOCUMENTEN.map((d) => {
            const st = statusMeta(d.status);
            return (
              <Panel key={d.naam} className="flex items-center gap-3 p-4">
                <span
                  className="inline-flex h-10 w-10 items-center justify-center rounded-[7px]"
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
                  <span className="block text-[10.5px]" style={{ color: C.inkMute, ...num }}>
                    {d.type} · {d.grootte} · {d.bijgewerkt}
                  </span>
                </span>
                <span
                  className="inline-flex items-center gap-1 rounded-[5px] px-2 py-1 text-[10px] font-semibold"
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
        <Eyebrow>Acties · op volgorde van urgentie</Eyebrow>
        <h1
          className="mt-3 text-[30px] font-semibold leading-none tracking-[-0.02em]"
          style={{ color: C.ink, ...display }}
        >
          Wat nu aandacht vraagt
        </h1>
        <p className="mt-2 max-w-md text-[13.5px]" style={{ color: C.inkSoft }}>
          Beheerst van boven naar beneden — zo houd je alles op peil, verifieerbaar en betaald.
        </p>
      </div>

      <ol className="space-y-3">
        {ACTIES.map((a, i) => {
          const warn = a.urgentie === "warning";
          const tone = warn ? C.warn : C.water;
          const ink = warn ? C.warnInk : C.waterDeep;
          const wash = warn ? C.warnWash : C.waterWash;
          return (
            <li key={a.titel}>
              <Panel className="p-6">
                <div className="grid grid-cols-[auto_1fr] items-start gap-4 sm:grid-cols-[auto_1fr_auto]">
                  <span
                    className="flex h-11 w-11 items-center justify-center rounded-[8px] text-[15px] font-bold"
                    style={{ background: wash, border: `1.5px solid ${tone}`, color: ink, ...num }}
                    aria-hidden="true"
                  >
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <div className="min-w-0">
                    <span
                      className="inline-flex items-center gap-1 rounded-[5px] px-2 py-0.5 text-[9.5px] font-semibold uppercase tracking-[0.12em]"
                      style={{ color: ink, background: wash, border: `1px solid ${tone}`, ...body }}
                    >
                      {warn ? (
                        <AlertTriangle size={10} aria-hidden="true" />
                      ) : (
                        <Waves size={10} aria-hidden="true" />
                      )}
                      {warn ? "Urgent" : "Aanbevolen"}
                    </span>
                    <h2
                      className="mt-2 text-[19px] font-semibold leading-snug"
                      style={{ color: C.ink, ...display }}
                    >
                      {a.titel}
                    </h2>
                    <p
                      className="mt-1.5 max-w-lg text-[13.5px] leading-relaxed"
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

// — Sluis: open (betaald, water stroomt door) of dicht (openstaand/concept) —
function Sluis({ open }: { open: boolean }) {
  return (
    <svg viewBox="0 0 28 20" width="28" height="20" aria-hidden="true" className="shrink-0">
      <rect x="1" y="1" width="26" height="18" rx="2" fill="none" stroke={C.line} strokeWidth="1" />
      {open ? (
        <>
          <path d="M2 14h24" stroke={C.water} strokeWidth="2.4" strokeLinecap="round" />
          <path d="M4 10h20" stroke={C.water} strokeOpacity="0.4" strokeWidth="1.4" />
          <rect x="6" y="3" width="3.5" height="9" rx="1" fill={C.okInk} />
          <rect x="18.5" y="3" width="3.5" height="9" rx="1" fill={C.okInk} />
        </>
      ) : (
        <>
          <rect x="11.5" y="3" width="5" height="14" rx="1.2" fill={C.warnInk} />
          <path d="M4 6h6M18 6h6" stroke={C.inkFaint} strokeWidth="1.4" strokeLinecap="round" />
        </>
      )}
    </svg>
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
          <Eyebrow>Facturen · sluisbeheer</Eyebrow>
          <h1
            className="mt-3 text-[30px] font-semibold leading-none tracking-[-0.02em]"
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
          { l: "Betaald (mnd)", v: totaalBetaald, sub: "3 sluizen open", alarm: false },
          { l: "Openstaand", v: "€ 1.350", sub: "1 sluis dicht · 9 dagen", alarm: true },
          { l: "Concept", v: "€ 880", sub: "klaar om te openen", alarm: false },
        ].map((s) => (
          <Panel key={s.l} className="p-6">
            <div className="flex items-center justify-between">
              <p
                className="text-[10.5px] font-semibold uppercase tracking-[0.1em]"
                style={{ color: C.inkMute, ...body }}
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
              className="mt-2 text-[27px] font-semibold tracking-[-0.01em]"
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
          className="hidden grid-cols-[8rem_1fr_5rem_9rem_6rem] gap-4 px-6 pb-3 pt-5 sm:grid"
          style={{ borderBottom: `1px solid ${C.lineSoft}` }}
        >
          {["Nummer", "Klant", "Datum", "Sluis", "Bedrag"].map((h, i) => (
            <span
              key={h}
              className={`text-[9.5px] font-semibold uppercase tracking-[0.16em] ${i === 4 ? "text-right" : ""}`}
              style={{ color: C.inkMute, ...body }}
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
                className="grid grid-cols-[1fr_auto] items-center gap-3 px-6 py-4 transition-colors hover:bg-[#eef3f2] sm:grid-cols-[8rem_1fr_5rem_9rem_6rem] sm:gap-4"
                style={{ borderTop: i === 0 ? "none" : `1px solid ${C.lineSoft}` }}
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
                <span className="order-5 flex items-center gap-2 sm:order-4">
                  <Sluis open={f.status === "Betaald"} />
                  <span
                    className="inline-flex items-center gap-1.5 rounded-[5px] px-2.5 py-1 text-[10.5px] font-semibold"
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
          className="flex items-baseline justify-between px-6 py-4"
          style={{ borderTop: `1px solid ${C.lineSoft}` }}
        >
          <span
            className="flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.18em]"
            style={{ color: C.inkMute, ...body }}
          >
            <Waves size={12} aria-hidden="true" style={{ color: C.water }} /> Totaal doorgestroomd
          </span>
          <span className="text-[20px] font-semibold" style={{ color: C.ink, ...num }}>
            {totaalBetaald}
          </span>
        </div>
      </Panel>
    </div>
  );
}
