"use client";

// Concept 414 — "Veerpont" · Nederlandse bewegwijzering / transit-signage (NS/ANWB).
// Wayfinding als designtaal: hoog contrast, dikke richtingspijlen, route-lijnen die statussen
// verbinden (een metro-/veerlijn tussen de haltes), signaalgeel #f2c200 + diep signaalblauw
// #1a3a6b op wit. Zeer leesbare brede sans (Frutiger/Inter-gevoel), tabulaire cijfers.
// Statusovergangen als "haltes" op een lijn; voortgang = een route van A naar B. Functioneel,
// helder, zelfverzekerd — bewegwijzering die toevallig software is.

import { useEffect, useMemo, useState } from "react";
import {
  ArrowRight,
  ArrowLeft,
  Check,
  Clock,
  AlertTriangle,
  Search,
  Plus,
  Minus,
  ShieldCheck,
  ChevronRight,
  ChevronsRight,
  Bell,
  FileText,
  Award,
  Navigation,
  MapPin,
  Route,
  Signpost,
  Milestone,
  Ship,
  Anchor,
  CornerDownRight,
  Compass,
  TrendingUp,
  TrendingDown,
  Circle,
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
  NAV,
  BERICHTEN,
  type ScreenKey,
  type CredStatus,
  type Opdracht,
} from "./mock";

// — Palet: signaalblauw, signaalgeel en helder wit, zoals Nederlandse bewegwijzering —
const C = {
  paper: "#eef2f7",
  paperAlt: "#e4eaf2",
  panel: "#ffffff",
  panelSoft: "#f6f8fb",
  panelRaise: "#fbfcfe",
  ink: "#12294d",
  inkStrong: "#0c1d38",
  blue: "#1a3a6b",
  blueHi: "#24508f",
  blueDeep: "#12294d",
  blueLine: "#2f4f82",
  blueWash: "rgba(26,58,107,0.08)",
  blueWashHi: "rgba(26,58,107,0.14)",
  slate: "#4a628a",
  slateMute: "#6b7f9e",
  slateFaint: "#96a5bd",
  yellow: "#f2c200",
  yellowHi: "#ffd633",
  yellowDeep: "#c99e00",
  yellowInk: "#7a5f00",
  yellowWash: "rgba(242,194,0,0.16)",
  line: "#d7dfea",
  lineSoft: "#e7edf4",
  ok: "#157a4a",
  okInk: "#0f5c37",
  okWash: "rgba(21,122,74,0.12)",
  warn: "#b26a00",
  warnInk: "#8a5200",
  warnWash: "rgba(242,160,0,0.16)",
  info: "#1a3a6b",
  infoInk: "#1a3a6b",
  infoWash: "rgba(26,58,107,0.10)",
  bad: "#c02a2a",
  badInk: "#9c1f1f",
  badWash: "rgba(192,42,42,0.10)",
  white: "#ffffff",
};

const signage = {
  fontFamily:
    "'Inter', 'Frutiger', 'Helvetica Neue', 'Segoe UI', system-ui, -apple-system, sans-serif",
};
const bodyF = {
  fontFamily: "'Inter', 'Segoe UI', system-ui, -apple-system, Roboto, sans-serif",
};
const num = {
  fontFamily: "'Inter', ui-monospace, SFMono-Regular, Menlo, monospace",
  fontVariantNumeric: "tabular-nums" as const,
};

// — De reis van A naar B: elke ZZP'er volgt dezelfde route langs vaste haltes —
const REIS: { key: string; label: string }[] = [
  { key: "profiel", label: "Profiel" },
  { key: "verificatie", label: "Verificatie" },
  { key: "matches", label: "Matches" },
  { key: "opdracht", label: "Opdracht" },
  { key: "betaald", label: "Betaald" },
];
const REIS_HUIDIG = 2; // halte "Matches"

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

// — Paneel: wit bord met dunne lijst en zachte schaduw, als een signaalpaneel —
function Panel({
  children,
  className = "",
  as: Tag = "div",
  accent = false,
}: {
  children: React.ReactNode;
  className?: string;
  as?: "div" | "section" | "li";
  accent?: boolean;
}) {
  return (
    <Tag
      className={`relative rounded-xl ${className}`}
      style={{
        background: C.panel,
        border: `1px solid ${C.line}`,
        boxShadow: accent
          ? "0 1px 0 rgba(18,41,77,0.03), 0 18px 40px rgba(18,41,77,0.10)"
          : "0 1px 0 rgba(18,41,77,0.02), 0 10px 26px rgba(18,41,77,0.06)",
        color: C.ink,
      }}
    >
      {children}
    </Tag>
  );
}

// — Signaal-label: kleine bewegwijzeringskop met richtingsmarker —
function Eyebrow({ children, tone = C.blue }: { children: React.ReactNode; tone?: string }) {
  return (
    <p
      className="flex items-center gap-2 text-[10.5px] font-bold uppercase tracking-[0.22em]"
      style={{ color: tone, ...bodyF }}
    >
      <ChevronsRight size={13} aria-hidden="true" style={{ color: C.yellowDeep }} />
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
      className="inline-flex items-center gap-1.5 rounded-md px-2.5 py-1 text-[11px] font-bold"
      style={{ color: ink, background: wash, border: `1.5px solid ${tone}`, ...bodyF }}
    >
      {children}
      {alarm && <span className="sr-only"> (let op)</span>}
    </span>
  );
}

// — Primaire richtingsknop: geel signaalbord met dikke pijl —
function PrimaryButton({
  children,
  onClick,
  className = "",
  type = "button",
}: {
  children: React.ReactNode;
  onClick?: () => void;
  className?: string;
  type?: "button" | "submit";
}) {
  return (
    <button
      type={type}
      onClick={onClick}
      className={`group inline-flex items-center justify-center gap-2 rounded-lg px-5 py-2.5 text-[13.5px] font-bold transition-all duration-200 hover:brightness-[1.04] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1a3a6b] focus-visible:ring-offset-2 focus-visible:ring-offset-white active:translate-y-px motion-reduce:transition-none ${className}`}
      style={{
        color: C.blueDeep,
        background: `linear-gradient(180deg, ${C.yellowHi}, ${C.yellow})`,
        boxShadow: `0 2px 0 ${C.yellowDeep}, 0 8px 18px rgba(242,194,0,0.32)`,
        ...bodyF,
      }}
    >
      {children}
    </button>
  );
}

// — Blauwe secundaire knop: signaalblauw bord —
function BlueButton({
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
      className={`group inline-flex items-center justify-center gap-2 rounded-lg px-5 py-2.5 text-[13.5px] font-bold text-white transition-all duration-200 hover:brightness-[1.08] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1a3a6b] focus-visible:ring-offset-2 focus-visible:ring-offset-white active:translate-y-px motion-reduce:transition-none ${className}`}
      style={{
        background: `linear-gradient(180deg, ${C.blueHi}, ${C.blue})`,
        boxShadow: `0 2px 0 ${C.blueDeep}, 0 8px 18px rgba(26,58,107,0.24)`,
        ...bodyF,
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
      className={`inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-[13px] font-bold transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1a3a6b] focus-visible:ring-offset-2 focus-visible:ring-offset-white motion-reduce:transition-none ${className}`}
      style={{
        color: active ? C.white : C.blue,
        background: active ? C.blue : C.white,
        border: `1.5px solid ${active ? C.blue : C.line}`,
        ...bodyF,
      }}
    >
      {children}
    </button>
  );
}

// — Route-sparkline: strakke lijn met eindhalte, in signaalkleur —
function RouteSpark({ data, tone, id }: { data: number[]; tone: string; id: string }) {
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
      <defs>
        <linearGradient id={`spark-${id}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={tone} stopOpacity="0.22" />
          <stop offset="100%" stopColor={tone} stopOpacity="0" />
        </linearGradient>
      </defs>
      <polygon points={`0,${h} ${line} ${w},${h}`} fill={`url(#spark-${id})`} />
      <polyline
        points={line}
        fill="none"
        stroke={tone}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx={last[0]} cy={last[1]} r="2.6" fill={C.white} stroke={tone} strokeWidth="2" />
    </svg>
  );
}

// — De signatuur: horizontale route van A naar B met haltes (metro/veerlijn) —
function ReisRoute({ huidig }: { huidig: number }) {
  return (
    <div className="overflow-x-auto">
      <div className="min-w-[540px] px-1 pb-1 pt-2">
        <div className="relative">
          {/* de lijn zelf */}
          <div
            className="absolute left-0 right-0 top-[15px] h-[4px] rounded-full"
            aria-hidden="true"
            style={{ background: C.line }}
          />
          <div
            className="absolute left-0 top-[15px] h-[4px] rounded-full transition-all duration-500 motion-reduce:transition-none"
            aria-hidden="true"
            style={{
              width: `${(huidig / (REIS.length - 1)) * 100}%`,
              background: `linear-gradient(90deg, ${C.blue}, ${C.blueHi})`,
            }}
          />
          <ol className="relative flex items-start justify-between">
            {REIS.map((halte, i) => {
              const done = i < huidig;
              const now = i === huidig;
              const stopColor = now ? C.yellow : done ? C.blue : C.white;
              const ringColor = now ? C.yellowDeep : done ? C.blue : C.line;
              return (
                <li key={halte.key} className="flex flex-col items-center" style={{ width: 90 }}>
                  <span
                    className="relative z-10 flex h-[34px] w-[34px] items-center justify-center rounded-full"
                    style={{
                      background: stopColor,
                      border: `3px solid ${ringColor}`,
                      boxShadow: now ? "0 0 0 4px rgba(242,194,0,0.22)" : "none",
                    }}
                    aria-hidden="true"
                  >
                    {done ? (
                      <Check size={15} className="text-white" strokeWidth={3} />
                    ) : now ? (
                      <MapPin size={15} style={{ color: C.blueDeep }} strokeWidth={2.6} />
                    ) : (
                      <Circle size={9} style={{ color: C.slateFaint }} />
                    )}
                  </span>
                  <span
                    className="mt-2 text-center text-[11px] font-bold leading-tight"
                    style={{ color: now ? C.blue : done ? C.slate : C.slateFaint, ...bodyF }}
                  >
                    {halte.label}
                    {now && <span className="sr-only"> (huidige halte)</span>}
                    {done && <span className="sr-only"> (afgerond)</span>}
                  </span>
                </li>
              );
            })}
          </ol>
        </div>
      </div>
    </div>
  );
}

// — Verticale rail-halte voor de verificatie-route: SVG-lijn verbindt de stops —
function RouteRail({
  isFirst,
  isLast,
  tone,
  Icon,
}: {
  isFirst: boolean;
  isLast: boolean;
  tone: string;
  Icon: LucideIcon;
}) {
  return (
    <span className="relative flex w-12 shrink-0 justify-center self-stretch" aria-hidden="true">
      {/* de verbindende route-lijn (SVG) */}
      <svg
        className="absolute inset-0 h-full w-full"
        preserveAspectRatio="none"
        viewBox="0 0 24 100"
      >
        {!isFirst && (
          <line
            x1="12"
            y1="0"
            x2="12"
            y2="34"
            stroke={C.line}
            strokeWidth="3"
            vectorEffect="non-scaling-stroke"
          />
        )}
        {!isLast && (
          <line
            x1="12"
            y1="34"
            x2="12"
            y2="100"
            stroke={C.line}
            strokeWidth="3"
            vectorEffect="non-scaling-stroke"
          />
        )}
      </svg>
      {/* de halte-stop */}
      <span
        className="relative z-10 mt-[18px] flex h-9 w-9 items-center justify-center rounded-full"
        style={{ background: C.white, border: `3px solid ${tone}` }}
      >
        <Icon size={16} style={{ color: tone }} strokeWidth={2.4} />
      </span>
    </span>
  );
}

function MatchMeter({ value }: { value: number }) {
  const tone = value >= 90 ? C.ok : value >= 85 ? C.blue : C.slateMute;
  return (
    <span className="hidden items-center gap-2 sm:flex" aria-hidden="true">
      <span
        className="relative h-2 w-20 overflow-hidden rounded-full"
        style={{ background: C.lineSoft }}
      >
        <span
          className="block h-full rounded-full"
          style={{ width: `${value}%`, background: tone }}
        />
      </span>
      <span className="text-[12.5px] font-bold" style={{ color: tone, ...num }}>
        {value}%
      </span>
    </span>
  );
}

export function Concept414() {
  const [screen, setScreen] = useState<ScreenKey>("dashboard");
  const active = OPDRACHTEN[0] as Opdracht;

  return (
    <div
      className="min-h-[720px] w-full antialiased"
      style={{
        ...bodyF,
        color: C.ink,
        background: `linear-gradient(180deg, ${C.paper} 0%, ${C.paperAlt} 100%)`,
      }}
    >
      <div className="mx-auto max-w-6xl px-4 pb-24 sm:px-6 md:px-8">
        <TopBar />
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
        <FootBar />
      </div>
    </div>
  );
}

function TopBar() {
  const ongelezen = BERICHTEN.filter((b) => b.ongelezen).length;
  return (
    <header className="flex items-center justify-between gap-4 pt-7">
      <div className="flex items-center gap-3.5">
        <span
          className="inline-flex h-11 w-11 items-center justify-center rounded-xl"
          style={{ background: C.blue, color: C.yellow }}
          aria-hidden="true"
        >
          <Ship size={20} strokeWidth={2.2} />
        </span>
        <div>
          <p
            className="text-[20px] font-extrabold leading-none tracking-[-0.01em]"
            style={{ color: C.blueDeep, ...signage }}
          >
            Veerpont
          </p>
          <p
            className="mt-1.5 flex items-center gap-1.5 text-[11px] font-semibold leading-none"
            style={{ color: C.slateMute, ...bodyF }}
          >
            <MapPin size={11} aria-hidden="true" />
            {PROFIEL.plaats} · vaste route
          </p>
        </div>
      </div>
      <div className="flex items-center gap-3">
        <span
          className="hidden items-center gap-1.5 rounded-md px-3 py-1.5 text-[11px] font-bold sm:inline-flex"
          style={{ color: C.okInk, border: `1.5px solid ${C.ok}`, background: C.okWash, ...bodyF }}
        >
          <ShieldCheck size={12} aria-hidden="true" />
          {PROFIEL.trust}
        </span>
        <span
          className="relative inline-flex h-10 w-10 items-center justify-center rounded-full"
          style={{ background: C.white, border: `1.5px solid ${C.line}`, color: C.slate }}
          aria-label={`${ongelezen} ongelezen berichten`}
        >
          <Bell size={16} aria-hidden="true" />
          {ongelezen > 0 && (
            <span
              className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full text-[9px] font-extrabold"
              style={{ background: C.yellow, color: C.blueDeep, ...num }}
              aria-hidden="true"
            >
              {ongelezen}
            </span>
          )}
        </span>
        <span className="hidden text-right sm:block">
          <span className="block text-[14px] font-bold" style={{ color: C.blueDeep, ...signage }}>
            {PROFIEL.naam}
          </span>
          <span className="block text-[11px] font-semibold" style={{ color: C.slateMute }}>
            {PROFIEL.rol}
          </span>
        </span>
        <span
          className="inline-flex h-11 w-11 items-center justify-center rounded-xl text-[13px] font-extrabold"
          style={{ background: C.blue, color: C.white, ...bodyF }}
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
        className="flex items-center gap-1 overflow-x-auto rounded-xl p-1.5"
        style={{ background: C.white, border: `1px solid ${C.line}` }}
      >
        {SCREENS.map((s) => {
          const on = s.key === screen;
          return (
            <button
              key={s.key}
              type="button"
              onClick={() => setScreen(s.key)}
              aria-current={on ? "page" : undefined}
              className="flex shrink-0 items-center gap-2 rounded-lg px-4 py-2 text-[13px] font-bold transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1a3a6b] focus-visible:ring-offset-2 focus-visible:ring-offset-white motion-reduce:transition-none"
              style={{
                color: on ? C.white : C.slate,
                background: on ? C.blue : "transparent",
                ...bodyF,
              }}
            >
              {on && <ChevronRight size={13} aria-hidden="true" style={{ color: C.yellow }} />}
              {s.label}
            </button>
          );
        })}
      </div>
    </nav>
  );
}

function FootBar() {
  return (
    <footer
      className="mt-10 flex flex-wrap items-center gap-x-4 gap-y-2 border-t pt-5 text-[11px] font-semibold"
      style={{ borderColor: C.line, color: C.slateFaint, ...bodyF }}
    >
      <span className="inline-flex items-center gap-1.5">
        <Compass size={12} aria-hidden="true" /> Bewegwijzering
      </span>
      {NAV.map((n) => (
        <span key={n} className="inline-flex items-center gap-1.5">
          <span aria-hidden="true">·</span>
          {n}
        </span>
      ))}
    </footer>
  );
}

function Dashboard({ onOpen, onActies }: { onOpen: () => void; onActies: () => void }) {
  const primair = ACTIES[0] as (typeof ACTIES)[number];
  const verified = CREDENTIALS.filter((c) => c.status === "VERIFIED").length;
  return (
    <div className="space-y-6">
      <section className="grid grid-cols-1 gap-5 lg:grid-cols-[1.35fr_1fr]">
        <Panel className="overflow-hidden p-6 md:p-8" accent>
          <div
            className="pointer-events-none absolute right-0 top-0 h-full w-1.5"
            aria-hidden="true"
            style={{ background: C.yellow }}
          />
          <Eyebrow>Vertrekhal · vandaag</Eyebrow>
          <div className="mt-4 flex items-start justify-between gap-4">
            <h1
              className="text-[30px] font-extrabold leading-[1.03] tracking-[-0.02em] md:text-[40px]"
              style={{ color: C.blueDeep, ...signage }}
            >
              Goedemorgen,
              <br />
              {PROFIEL.naam.split(" ")[0]}.
            </h1>
            <Navigation
              size={30}
              aria-hidden="true"
              style={{ color: C.yellowDeep }}
              className="hidden sm:block"
            />
          </div>
          <p
            className="mt-3 max-w-md text-[13.5px] font-medium leading-relaxed"
            style={{ color: C.slate }}
          >
            Je volgt een vaste route: profiel, verificatie, matches, opdracht, betaald. De borden
            wijzen de weg — volg de lijn en ga naar de volgende halte.
          </p>
          <div
            className="mt-5 rounded-lg p-4"
            style={{ background: C.panelSoft, border: `1px solid ${C.lineSoft}` }}
          >
            <div className="mb-1 flex items-center gap-2">
              <Route size={14} aria-hidden="true" style={{ color: C.blue }} />
              <span
                className="text-[10.5px] font-bold uppercase tracking-[0.16em]"
                style={{ color: C.slateMute, ...bodyF }}
              >
                Jouw route van A naar B
              </span>
            </div>
            <ReisRoute huidig={REIS_HUIDIG} />
          </div>
          <div className="mt-5 flex flex-wrap items-center gap-2.5">
            <PrimaryButton onClick={onActies}>
              Volgende halte
              <ArrowRight
                size={15}
                aria-hidden="true"
                strokeWidth={2.6}
                className="transition-transform group-hover:translate-x-0.5 motion-reduce:transition-none"
              />
            </PrimaryButton>
            <BlueButton onClick={onOpen}>
              Naar de marktplaats
              <ChevronsRight size={15} aria-hidden="true" strokeWidth={2.6} />
            </BlueButton>
          </div>
        </Panel>

        <Panel className="overflow-hidden p-6">
          <div
            className="pointer-events-none absolute left-0 top-0 h-full w-1.5"
            aria-hidden="true"
            style={{ background: C.warn }}
          />
          <div className="flex items-center justify-between">
            <Eyebrow tone={C.warnInk}>Vraagt aandacht</Eyebrow>
            <Signpost size={20} aria-hidden="true" style={{ color: C.warn }} />
          </div>
          <h2
            className="mt-4 text-[20px] font-extrabold leading-snug tracking-[-0.01em]"
            style={{ color: C.blueDeep, ...signage }}
          >
            {primair.titel}
          </h2>
          <p className="mt-2 text-[13px] font-medium leading-relaxed" style={{ color: C.slate }}>
            {primair.detail}
          </p>
          <div className="mt-5">
            <PrimaryButton onClick={onActies} className="w-full">
              {primair.cta}
              <ArrowRight size={15} aria-hidden="true" strokeWidth={2.6} />
            </PrimaryButton>
          </div>
          <div className="mt-4 border-t pt-3" style={{ borderColor: C.lineSoft }}>
            <p className="text-[11.5px] font-semibold" style={{ color: C.slateMute, ...num }}>
              {verified}/{CREDENTIALS.length} certificaten geverifieerd · 7 open reacties
            </p>
          </div>
        </Panel>
      </section>

      <section>
        <div className="mb-3">
          <Eyebrow>Dienstregeling · deze maand</Eyebrow>
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {KPIS.map((k, i) => (
            <Panel key={k.label} className="p-4">
              <div className="flex items-start justify-between gap-2">
                <p
                  className="text-[10.5px] font-bold uppercase tracking-[0.1em]"
                  style={{ color: C.slateMute, ...bodyF }}
                >
                  {k.label}
                </p>
                <span
                  className="inline-flex items-center gap-0.5 rounded-md px-1.5 py-0.5 text-[9.5px] font-extrabold"
                  style={{
                    color: k.up ? C.okInk : C.warnInk,
                    background: k.up ? C.okWash : C.warnWash,
                    ...num,
                  }}
                >
                  {k.up ? (
                    <TrendingUp size={10} aria-hidden="true" />
                  ) : (
                    <TrendingDown size={10} aria-hidden="true" />
                  )}
                  {k.trend.replace(/^[+-]/, "")}
                </span>
              </div>
              <p
                className="mt-2.5 text-[26px] font-extrabold leading-none tracking-[-0.02em]"
                style={{ color: C.blueDeep, ...num }}
              >
                {k.value}
              </p>
              <div className="mt-3">
                <RouteSpark data={k.spark} tone={k.up ? C.blue : C.warn} id={`kpi-${i}`} />
              </div>
            </Panel>
          ))}
        </div>
      </section>

      <section className="grid grid-cols-1 gap-5 lg:grid-cols-[1.4fr_1fr]">
        <div>
          <div className="mb-3 flex items-baseline justify-between">
            <Eyebrow>Vertrekstaat · open opdrachten</Eyebrow>
            <button
              type="button"
              onClick={onOpen}
              className="inline-flex items-center gap-1 rounded text-[11px] font-bold uppercase tracking-[0.12em] transition-colors hover:brightness-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1a3a6b] focus-visible:ring-offset-2 focus-visible:ring-offset-white"
              style={{ color: C.blue, ...bodyF }}
            >
              Alle borden <ArrowRight size={12} aria-hidden="true" strokeWidth={2.6} />
            </button>
          </div>
          <Panel>
            <ul>
              {OPDRACHTEN.map((o, i) => (
                <li key={o.id} style={{ borderTop: i === 0 ? "none" : `1px solid ${C.lineSoft}` }}>
                  <button
                    type="button"
                    onClick={onOpen}
                    className="group grid w-full grid-cols-[auto_1fr_auto] items-center gap-3.5 px-4 py-3.5 text-left transition-colors hover:bg-[#f6f8fb] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#1a3a6b] motion-reduce:transition-none"
                  >
                    <span
                      className="inline-flex h-10 w-12 flex-col items-center justify-center rounded-lg"
                      style={{
                        background: i === 0 ? C.blue : C.panelSoft,
                        border: `1.5px solid ${i === 0 ? C.blue : C.line}`,
                      }}
                    >
                      <span
                        className="text-[13px] font-extrabold leading-none"
                        style={{ color: i === 0 ? C.yellow : C.slate, ...num }}
                      >
                        {o.match}
                      </span>
                    </span>
                    <span className="min-w-0">
                      <span
                        className="block truncate text-[14.5px] font-bold"
                        style={{ color: C.blueDeep, ...signage }}
                      >
                        {o.titel}
                      </span>
                      <span
                        className="mt-0.5 block truncate text-[11.5px] font-medium"
                        style={{ color: C.slateMute }}
                      >
                        {o.opdrachtgever} · {o.plaats} · {o.tarief}
                      </span>
                    </span>
                    <span className="flex items-center gap-3">
                      <MatchMeter value={o.match} />
                      <ChevronRight
                        size={18}
                        aria-hidden="true"
                        strokeWidth={2.6}
                        className="transition-transform group-hover:translate-x-0.5 motion-reduce:transition-none"
                        style={{ color: C.slateFaint }}
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
            <Eyebrow>Haltes · certificaten</Eyebrow>
          </div>
          <Panel className="p-4">
            <ul className="space-y-1">
              {CREDENTIALS.map((c, i) => {
                const st = statusMeta(c.status);
                return (
                  <li
                    key={c.naam}
                    className="flex items-center gap-3 py-2"
                    style={{ borderTop: i === 0 ? "none" : `1px solid ${C.lineSoft}` }}
                  >
                    <span
                      className="inline-flex h-8 w-8 items-center justify-center rounded-full"
                      style={{
                        color: st.tone,
                        background: st.wash,
                        border: `2px solid ${st.tone}`,
                      }}
                      aria-hidden="true"
                    >
                      <st.Icon size={14} strokeWidth={2.4} />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span
                        className="block truncate text-[12.5px] font-bold"
                        style={{ color: C.blueDeep }}
                      >
                        {c.naam}
                      </span>
                      <span
                        className="block truncate text-[10.5px] font-medium"
                        style={{ color: C.slateMute }}
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

function MarktSkeleton() {
  return (
    <ul className="space-y-4" aria-hidden="true">
      {[0, 1, 2].map((i) => (
        <li key={i}>
          <Panel className="p-5">
            <div className="animate-pulse motion-reduce:animate-none">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 space-y-3">
                  <div className="h-3 w-24 rounded" style={{ background: C.lineSoft }} />
                  <div className="h-5 w-2/3 rounded" style={{ background: C.line }} />
                  <div className="h-3 w-1/2 rounded" style={{ background: C.lineSoft }} />
                  <div className="flex gap-2">
                    <div className="h-5 w-16 rounded-full" style={{ background: C.lineSoft }} />
                    <div className="h-5 w-20 rounded-full" style={{ background: C.lineSoft }} />
                  </div>
                </div>
                <div className="h-14 w-14 rounded-lg" style={{ background: C.line }} />
              </div>
            </div>
          </Panel>
        </li>
      ))}
    </ul>
  );
}

function Marktplaats({ onOpen }: { onOpen: () => void }) {
  const [q, setQ] = useState("");
  const [sort, setSort] = useState<"match" | "tarief">("match");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const t = setTimeout(() => setLoading(false), 620);
    return () => clearTimeout(t);
  }, []);

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
        <Eyebrow>Vertrekstaat · open opdrachten</Eyebrow>
        <h1
          className="mt-3 text-[30px] font-extrabold leading-none tracking-[-0.02em]"
          style={{ color: C.blueDeep, ...signage }}
        >
          Open opdrachten
        </h1>
        <p className="mt-2 text-[12.5px] font-semibold" style={{ color: C.slateMute, ...num }}>
          {String(filtered.length).padStart(2, "0")} van{" "}
          {String(OPDRACHTEN.length).padStart(2, "0")} bestemmingen op de borden
        </p>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div
          className="flex flex-1 items-center gap-2.5 rounded-lg px-4 py-3"
          style={{ background: C.white, border: `1.5px solid ${C.line}` }}
        >
          <Search size={16} aria-hidden="true" style={{ color: C.slateMute }} />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Zoek op titel, plaats of opdrachtgever…"
            aria-label="Opdrachten zoeken"
            className="w-full bg-transparent text-[13px] font-medium outline-none placeholder:text-[#96a5bd]"
            style={{ color: C.ink, ...bodyF }}
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
        </div>
      </div>

      {loading ? (
        <MarktSkeleton />
      ) : filtered.length === 0 ? (
        <Panel accent>
          <div className="flex flex-col items-center px-6 py-16 text-center">
            <span
              className="inline-flex h-16 w-16 items-center justify-center rounded-full"
              style={{
                background: C.yellowWash,
                border: `2px solid ${C.yellow}`,
                color: C.yellowInk,
              }}
              aria-hidden="true"
            >
              <Anchor size={26} strokeWidth={2.2} />
            </span>
            <p
              className="mt-5 text-[20px] font-extrabold tracking-[-0.01em]"
              style={{ color: C.blueDeep, ...signage }}
            >
              Geen bestemming gevonden
            </p>
            <p className="mx-auto mt-2 max-w-xs text-[13px] font-medium" style={{ color: C.slate }}>
              Geen opdracht past bij {q ? `“${q}”` : "je zoekterm"}. Verruim de zoekterm om meer
              bestemmingen op de borden te zien.
            </p>
            <div className="mt-6">
              <PrimaryButton onClick={() => setQ("")}>
                Zoekterm wissen <ArrowRight size={14} aria-hidden="true" strokeWidth={2.6} />
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
  const tone = strong ? C.blue : C.slate;
  const chipInk = strong ? C.white : C.blue;
  const chipBg = strong ? C.blue : C.white;
  return (
    <Panel
      className="overflow-hidden p-5 transition-transform duration-200 hover:-translate-y-0.5 motion-reduce:transition-none motion-reduce:hover:translate-y-0"
      accent={strong}
    >
      {strong && (
        <div
          className="pointer-events-none absolute left-0 top-0 h-full w-1.5"
          aria-hidden="true"
          style={{ background: C.yellow }}
        />
      )}
      <div className="grid grid-cols-[1fr_auto] items-start gap-4">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span
              className="inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[10px] font-extrabold uppercase tracking-[0.08em]"
              style={{ color: C.slate, border: `1.5px solid ${C.line}`, ...num }}
            >
              <Milestone size={10} aria-hidden="true" /> № {String(index + 1).padStart(2, "0")}
            </span>
            <span className="text-[11px] font-bold" style={{ color: C.slateMute, ...num }}>
              {opdracht.id}
            </span>
          </div>
          <h3
            className="mt-2 text-[18px] font-extrabold leading-snug tracking-[-0.01em]"
            style={{ color: C.blueDeep, ...signage }}
          >
            {opdracht.titel}
          </h3>
          <p
            className="mt-1 flex items-center gap-1.5 text-[12px] font-medium"
            style={{ color: C.slate }}
          >
            <MapPin size={12} aria-hidden="true" style={{ color: C.slateMute }} />
            {opdracht.opdrachtgever} · {opdracht.plaats} · {opdracht.uren}
          </p>
          <div className="mt-3 flex flex-wrap gap-1.5">
            {opdracht.tags.map((t) => (
              <span
                key={t}
                className="inline-flex items-center rounded-md px-2.5 py-0.5 text-[10.5px] font-bold"
                style={{
                  color: C.blue,
                  background: C.blueWash,
                  border: `1px solid ${C.lineSoft}`,
                  ...bodyF,
                }}
              >
                {t}
              </span>
            ))}
          </div>
        </div>
        <div className="flex flex-col items-center gap-1.5">
          <span
            className="inline-flex h-14 w-14 flex-col items-center justify-center rounded-lg"
            style={{ background: chipBg, border: `2px solid ${tone}` }}
          >
            <span
              className="text-[17px] font-extrabold leading-none"
              style={{ color: chipInk, ...num }}
            >
              {opdracht.match}
            </span>
            <span
              className="mt-0.5 text-[7.5px] font-bold uppercase tracking-[0.1em]"
              style={{ color: strong ? C.yellow : C.slateMute, ...bodyF }}
            >
              match
            </span>
          </span>
          <span className="text-[13px] font-extrabold" style={{ color: C.blueDeep, ...num }}>
            {opdracht.tarief}
          </span>
        </div>
      </div>
      <div className="mt-4 flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-[11.5px] font-bold transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1a3a6b] focus-visible:ring-offset-2 focus-visible:ring-offset-white"
          style={{ color: C.blue, border: `1.5px solid ${C.line}`, ...bodyF }}
        >
          {open ? <Minus size={12} aria-hidden="true" /> : <Plus size={12} aria-hidden="true" />}
          Waarom deze match
        </button>
        <div className="ml-auto">
          <PrimaryButton onClick={onOpen}>
            Reageren <ArrowRight size={13} aria-hidden="true" strokeWidth={2.6} />
          </PrimaryButton>
        </div>
      </div>
      <div
        className="grid transition-all duration-300 motion-reduce:transition-none"
        style={{ gridTemplateRows: open ? "1fr" : "0fr" }}
      >
        <div className="overflow-hidden">
          <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
            <RedenBlok
              titel="In je voordeel"
              tone={C.okInk}
              border={C.ok}
              wash={C.okWash}
              Icon={Check}
              items={opdracht.redenen.plus}
            />
            <RedenBlok
              titel="Let op"
              tone={C.warnInk}
              border={C.warn}
              wash={C.warnWash}
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
  border,
  wash,
  Icon,
  items,
}: {
  titel: string;
  tone: string;
  border: string;
  wash: string;
  Icon: LucideIcon;
  items: string[];
}) {
  return (
    <div className="rounded-lg p-4" style={{ background: wash, border: `1px solid ${border}` }}>
      <p
        className="flex items-center gap-1.5 text-[10px] font-extrabold uppercase tracking-[0.14em]"
        style={{ color: tone, ...bodyF }}
      >
        <Icon size={12} aria-hidden="true" />
        {titel}
      </p>
      <ul className="mt-2.5 space-y-2">
        {items.map((r) => (
          <li
            key={r}
            className="flex items-start gap-2 text-[12.5px] font-medium"
            style={{ color: C.ink }}
          >
            <CornerDownRight
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
  return (
    <div className="space-y-6">
      <button
        type="button"
        onClick={onBack}
        className="inline-flex items-center gap-2 rounded-lg px-4 py-2 text-[12.5px] font-bold transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1a3a6b] focus-visible:ring-offset-2 focus-visible:ring-offset-white"
        style={{ color: C.blue, border: `1.5px solid ${C.line}`, background: C.white, ...bodyF }}
      >
        <ArrowLeft size={14} aria-hidden="true" strokeWidth={2.6} /> Terug naar de marktplaats
      </button>

      <Panel className="overflow-hidden p-6 md:p-8" accent>
        <div
          className="pointer-events-none absolute right-0 top-0 h-full w-1.5"
          aria-hidden="true"
          style={{ background: C.yellow }}
        />
        <div className="flex flex-wrap items-center gap-2">
          <span
            className="inline-flex items-center rounded-md px-2.5 py-0.5 text-[10.5px] font-bold"
            style={{ color: C.slate, border: `1.5px solid ${C.line}`, ...num }}
          >
            {opdracht.id}
          </span>
          <span
            className="inline-flex items-center gap-1 rounded-md px-2.5 py-0.5 text-[11px] font-extrabold"
            style={{ color: C.blueDeep, background: C.yellow, ...bodyF }}
          >
            <Award size={11} aria-hidden="true" /> {strong ? "Sterke match" : "Uitgelicht"} ·{" "}
            {opdracht.match}%
          </span>
        </div>
        <h1
          className="mt-4 max-w-2xl text-[28px] font-extrabold leading-[1.05] tracking-[-0.02em] md:text-[40px]"
          style={{ color: C.blueDeep, ...signage }}
        >
          {opdracht.titel}
        </h1>
        <p
          className="mt-2 flex items-center gap-1.5 text-[14px] font-semibold"
          style={{ color: C.slate }}
        >
          <MapPin size={14} aria-hidden="true" />
          {opdracht.opdrachtgever} · {opdracht.plaats}
        </p>
        <div className="mt-5 flex flex-wrap gap-2.5">
          <PrimaryButton>
            Reageren <ArrowRight size={14} aria-hidden="true" strokeWidth={2.6} />
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
                borderLeft: i % 4 === 0 ? "none" : `1px solid ${C.lineSoft}`,
                borderTop: i >= 2 ? `1px solid ${C.lineSoft}` : "none",
              }}
            >
              <p
                className="text-[9.5px] font-extrabold uppercase tracking-[0.14em]"
                style={{ color: C.slateMute, ...bodyF }}
              >
                {m.l}
              </p>
              <p
                className="mt-1.5 text-[18px] font-extrabold tracking-[-0.01em]"
                style={{ color: C.blueDeep, ...num }}
              >
                {m.v}
              </p>
            </div>
          ))}
        </div>
      </Panel>

      <section>
        <Eyebrow>Waarom deze match</Eyebrow>
        <p
          className="mt-3 max-w-xl text-[13.5px] font-medium leading-relaxed"
          style={{ color: C.slate }}
        >
          Transparant afgelezen van je geverifieerde profiel — wat in je voordeel telt én waar je op
          moet letten, zonder verborgen score.
        </p>
        <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-2">
          <Panel className="p-5">
            <div className="flex items-center gap-2">
              <span
                className="inline-flex h-9 w-9 items-center justify-center rounded-full"
                style={{ color: C.ok, background: C.okWash, border: `2px solid ${C.ok}` }}
                aria-hidden="true"
              >
                <Check size={16} strokeWidth={2.6} />
              </span>
              <p
                className="text-[11px] font-extrabold uppercase tracking-[0.12em]"
                style={{ color: C.okInk, ...bodyF }}
              >
                In je voordeel
              </p>
            </div>
            <ul className="mt-4 space-y-3">
              {opdracht.redenen.plus.map((r) => (
                <li
                  key={r}
                  className="flex items-start gap-3 text-[13.5px] font-medium"
                  style={{ color: C.ink }}
                >
                  <Check
                    size={16}
                    aria-hidden="true"
                    className="mt-0.5 shrink-0"
                    strokeWidth={2.6}
                    style={{ color: C.ok }}
                  />
                  {r}
                </li>
              ))}
            </ul>
          </Panel>
          <Panel className="p-5">
            <div className="flex items-center gap-2">
              <span
                className="inline-flex h-9 w-9 items-center justify-center rounded-full"
                style={{ color: C.warn, background: C.warnWash, border: `2px solid ${C.warn}` }}
                aria-hidden="true"
              >
                <AlertTriangle size={15} strokeWidth={2.4} />
              </span>
              <p
                className="text-[11px] font-extrabold uppercase tracking-[0.12em]"
                style={{ color: C.warnInk, ...bodyF }}
              >
                Let op
              </p>
            </div>
            <ul className="mt-4 space-y-3">
              {opdracht.redenen.min.map((r) => (
                <li
                  key={r}
                  className="flex items-start gap-3 text-[13.5px] font-medium"
                  style={{ color: C.ink }}
                >
                  <AlertTriangle
                    size={15}
                    aria-hidden="true"
                    className="mt-0.5 shrink-0"
                    strokeWidth={2.4}
                    style={{ color: C.warn }}
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
      <Panel className="overflow-hidden p-6 md:p-8" accent>
        <div
          className="pointer-events-none absolute left-0 top-0 h-full w-1.5"
          aria-hidden="true"
          style={{ background: C.yellow }}
        />
        <div className="flex flex-wrap items-center justify-between gap-6">
          <div className="max-w-md">
            <Eyebrow>Verificatie · haltes op de lijn</Eyebrow>
            <h1
              className="mt-3 text-[27px] font-extrabold leading-tight tracking-[-0.02em]"
              style={{ color: C.blueDeep, ...signage }}
            >
              Jouw certificaten
            </h1>
            <p
              className="mt-3 text-[13.5px] font-medium leading-relaxed"
              style={{ color: C.slate }}
            >
              <span className="font-extrabold" style={{ color: C.blueDeep }}>
                {PROFIEL.trust}.
              </span>{" "}
              {verified} van {CREDENTIALS.length} haltes zijn geverifieerd. Eén verloopt binnenkort
              en vraagt om vernieuwing voor je de route vervolgt.
            </p>
          </div>
          <span
            className="inline-flex h-24 w-24 flex-col items-center justify-center rounded-full"
            style={{ background: C.white, border: `3px solid ${C.blue}` }}
          >
            <span
              className="text-[26px] font-extrabold leading-none"
              style={{ color: C.blue, ...num }}
            >
              {ratio}
            </span>
            <span
              className="mt-1 text-[8px] font-extrabold uppercase tracking-[0.14em]"
              style={{ color: C.slateMute, ...bodyF }}
            >
              % op route
            </span>
          </span>
        </div>
      </Panel>

      <div className="mb-1">
        <Eyebrow>De route langs je haltes</Eyebrow>
      </div>

      <Panel>
        <ul>
          {CREDENTIALS.map((c, idx) => {
            const st = statusMeta(c.status);
            const isOpen = open === c.naam;
            const isFirst = idx === 0;
            const isLast = idx === CREDENTIALS.length - 1;
            return (
              <li key={c.naam}>
                <div className="flex items-stretch">
                  <RouteRail isFirst={isFirst} isLast={isLast} tone={st.tone} Icon={st.Icon} />
                  <div className="min-w-0 flex-1 pr-3">
                    <button
                      type="button"
                      onClick={() => setOpen(isOpen ? null : c.naam)}
                      aria-expanded={isOpen}
                      className="grid w-full grid-cols-[1fr_auto] items-center gap-3 py-4 pr-1 text-left transition-colors hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#1a3a6b] motion-reduce:transition-none sm:grid-cols-[1fr_11rem_auto]"
                    >
                      <span className="min-w-0">
                        <span
                          className="block truncate text-[15px] font-extrabold tracking-[-0.01em]"
                          style={{ color: C.blueDeep, ...signage }}
                        >
                          {c.naam}
                        </span>
                        <span
                          className="mt-0.5 block truncate text-[11.5px] font-medium"
                          style={{ color: C.slateMute }}
                        >
                          {c.detail}
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
                          color: C.slateFaint,
                          transform: isOpen ? "rotate(45deg)" : "rotate(0deg)",
                        }}
                        aria-hidden="true"
                      >
                        <Plus size={16} strokeWidth={2.6} />
                      </span>
                    </button>
                    <div className="sm:hidden">
                      {!isOpen && (
                        <div className="pb-3">
                          <Chip tone={st.tone} ink={st.ink} wash={st.wash} alarm={st.alarm}>
                            <st.Icon size={11} aria-hidden="true" />
                            {st.label}
                          </Chip>
                        </div>
                      )}
                    </div>
                    <div
                      className="grid transition-all duration-300 motion-reduce:transition-none"
                      style={{ gridTemplateRows: isOpen ? "1fr" : "0fr" }}
                    >
                      <div className="overflow-hidden">
                        <div className="pb-5">
                          <div
                            className="rounded-lg p-4"
                            style={{ background: C.panelSoft, border: `1px solid ${C.lineSoft}` }}
                          >
                            {st.alarm && (
                              <div
                                className="mb-3 flex items-start gap-2 rounded-md p-2.5 text-[12px] font-semibold"
                                style={{
                                  background: st.wash,
                                  border: `1px solid ${st.tone}`,
                                  color: st.ink,
                                }}
                              >
                                <AlertTriangle
                                  size={14}
                                  aria-hidden="true"
                                  className="mt-0.5 shrink-0"
                                />
                                {c.status === "EXPIRING"
                                  ? "Deze halte verloopt binnenkort — vernieuw op tijd om verifieerbaar te blijven."
                                  : "Deze halte is afgewezen — herstel de gegevens en dien opnieuw in."}
                              </div>
                            )}
                            <p
                              className="max-w-xl text-[13px] font-medium leading-relaxed"
                              style={{ color: C.slate }}
                            >
                              {c.detail}. Documenten worden versleuteld bewaard en alleen na je
                              expliciete toestemming gedeeld met een opdrachtgever.
                            </p>
                            <div className="mt-3 flex flex-wrap gap-2">
                              <PrimaryButton>
                                {c.status === "EXPIRING" ? "Vernieuwen" : "Bekijken"}
                                <ArrowRight size={13} aria-hidden="true" strokeWidth={2.6} />
                              </PrimaryButton>
                              <GhostButton>Historie</GhostButton>
                            </div>
                          </div>
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
    </div>
  );
}

function Acties() {
  return (
    <div className="space-y-6">
      <div>
        <Eyebrow>Acties · de volgende halte</Eyebrow>
        <h1
          className="mt-3 text-[30px] font-extrabold leading-none tracking-[-0.02em]"
          style={{ color: C.blueDeep, ...signage }}
        >
          Wat nu aandacht vraagt
        </h1>
        <p className="mt-2 max-w-md text-[13px] font-medium" style={{ color: C.slate }}>
          Op volgorde van urgentie — volg de borden van boven naar beneden om verifieerbaar en
          betaald te blijven.
        </p>
      </div>

      <ol className="space-y-3">
        {ACTIES.map((a, i) => {
          const warn = a.urgentie === "warning";
          const tone = warn ? C.warn : C.blue;
          const ink = warn ? C.warnInk : C.blue;
          const wash = warn ? C.warnWash : C.blueWash;
          const isLast = i === ACTIES.length - 1;
          return (
            <li key={a.titel}>
              <div className="flex items-stretch">
                <span
                  className="relative flex w-12 shrink-0 justify-center self-stretch"
                  aria-hidden="true"
                >
                  <svg
                    className="absolute inset-0 h-full w-full"
                    preserveAspectRatio="none"
                    viewBox="0 0 24 100"
                  >
                    {i > 0 && (
                      <line
                        x1="12"
                        y1="0"
                        x2="12"
                        y2="30"
                        stroke={C.line}
                        strokeWidth="3"
                        vectorEffect="non-scaling-stroke"
                      />
                    )}
                    {!isLast && (
                      <line
                        x1="12"
                        y1="30"
                        x2="12"
                        y2="100"
                        stroke={C.line}
                        strokeWidth="3"
                        vectorEffect="non-scaling-stroke"
                      />
                    )}
                  </svg>
                  <span
                    className="relative z-10 mt-[14px] flex h-11 w-11 items-center justify-center rounded-full text-[15px] font-extrabold"
                    style={{
                      background: warn ? C.yellow : C.blue,
                      color: warn ? C.blueDeep : C.white,
                      ...num,
                    }}
                  >
                    {String(i + 1).padStart(2, "0")}
                  </span>
                </span>
                <Panel className="min-w-0 flex-1 p-5">
                  <div className="grid grid-cols-1 items-start gap-4 sm:grid-cols-[1fr_auto]">
                    <div className="min-w-0">
                      <span
                        className="inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[9.5px] font-extrabold uppercase tracking-[0.1em]"
                        style={{
                          color: ink,
                          background: wash,
                          border: `1px solid ${tone}`,
                          ...bodyF,
                        }}
                      >
                        {warn ? (
                          <AlertTriangle size={10} aria-hidden="true" />
                        ) : (
                          <Signpost size={10} aria-hidden="true" />
                        )}
                        {warn ? "Urgent" : "Aanbevolen"}
                      </span>
                      <h2
                        className="mt-2 text-[18px] font-extrabold leading-snug tracking-[-0.01em]"
                        style={{ color: C.blueDeep, ...signage }}
                      >
                        {a.titel}
                      </h2>
                      <p
                        className="mt-1.5 max-w-lg text-[13px] font-medium leading-relaxed"
                        style={{ color: C.slate }}
                      >
                        {a.detail}
                      </p>
                    </div>
                    <div className="sm:self-center">
                      <PrimaryButton>
                        {a.cta}
                        <ArrowRight size={13} aria-hidden="true" strokeWidth={2.6} />
                      </PrimaryButton>
                    </div>
                  </div>
                </Panel>
              </div>
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
  return { ink: C.slateMute, wash: C.panelSoft, tone: C.line, Icon: FileText };
}

function Facturen() {
  const totaalBetaald = "€ 8.622";
  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <Eyebrow>Facturen · het grootboek</Eyebrow>
          <h1
            className="mt-3 text-[30px] font-extrabold leading-none tracking-[-0.02em]"
            style={{ color: C.blueDeep, ...signage }}
          >
            Facturen
          </h1>
        </div>
        <PrimaryButton>
          <Plus size={14} aria-hidden="true" strokeWidth={2.6} /> Nieuwe factuur
        </PrimaryButton>
      </div>

      <section className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {[
          { l: "Betaald (mnd)", v: totaalBetaald, sub: "3 voldaan", alarm: false },
          { l: "Openstaand", v: "€ 1.350", sub: "1 factuur · 9 dagen", alarm: true },
          { l: "Concept", v: "€ 880", sub: "klaar om te versturen", alarm: false },
        ].map((s) => (
          <Panel key={s.l} className="p-5">
            <div className="flex items-center justify-between">
              <p
                className="text-[10.5px] font-bold uppercase tracking-[0.1em]"
                style={{ color: C.slateMute, ...bodyF }}
              >
                {s.l}
              </p>
              {s.alarm && (
                <span
                  className="inline-flex h-6 w-6 items-center justify-center rounded-full"
                  style={{ background: C.warnWash, color: C.warn }}
                  aria-hidden="true"
                >
                  <AlertTriangle size={13} />
                </span>
              )}
            </div>
            <p
              className="mt-2 text-[26px] font-extrabold tracking-[-0.02em]"
              style={{ color: s.alarm ? C.warnInk : C.blueDeep, ...num }}
            >
              {s.v}
            </p>
            <p className="mt-1 text-[11.5px] font-medium" style={{ color: C.slateMute }}>
              {s.sub}
            </p>
          </Panel>
        ))}
      </section>

      <Panel>
        <div
          className="hidden grid-cols-[8rem_1fr_5rem_9rem_6rem] gap-4 px-5 pb-3 pt-4 sm:grid"
          style={{ borderBottom: `1px solid ${C.lineSoft}` }}
        >
          {["Nummer", "Klant", "Datum", "Status", "Bedrag"].map((h, i) => (
            <span
              key={h}
              className={`text-[9.5px] font-extrabold uppercase tracking-[0.14em] ${i === 4 ? "text-right" : ""}`}
              style={{ color: C.slateMute, ...bodyF }}
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
                className="grid grid-cols-[1fr_auto] items-center gap-3 px-5 py-3.5 transition-colors hover:bg-[#f6f8fb] sm:grid-cols-[8rem_1fr_5rem_9rem_6rem] sm:gap-4"
                style={{ borderTop: i === 0 ? "none" : `1px solid ${C.lineSoft}` }}
              >
                <span
                  className="order-1 text-[11.5px] font-bold"
                  style={{ color: C.slateMute, ...num }}
                >
                  {f.nr}
                </span>
                <span
                  className="order-3 min-w-0 truncate text-[14px] font-bold sm:order-2"
                  style={{ color: C.blueDeep, ...signage }}
                >
                  {f.klant}
                </span>
                <span
                  className="order-4 hidden text-[11.5px] font-medium sm:order-3 sm:inline"
                  style={{ color: C.slateMute, ...num }}
                >
                  {f.datum}
                </span>
                <span className="order-5 sm:order-4">
                  <span
                    className="inline-flex items-center gap-1.5 rounded-md px-2.5 py-1 text-[10.5px] font-bold"
                    style={{
                      color: ft.ink,
                      background: ft.wash,
                      border: `1.5px solid ${ft.tone}`,
                      ...bodyF,
                    }}
                  >
                    {ft.Icon && <ft.Icon size={11} aria-hidden="true" />}
                    {f.status}
                  </span>
                </span>
                <span
                  className="order-2 text-right text-[14px] font-extrabold sm:order-5"
                  style={{ color: acc ? C.warnInk : C.blueDeep, ...num }}
                >
                  {f.bedrag}
                </span>
              </li>
            );
          })}
        </ul>
        <div
          className="flex items-baseline justify-between px-5 py-4"
          style={{ borderTop: `1px solid ${C.lineSoft}`, background: C.panelSoft }}
        >
          <span
            className="flex items-center gap-2 text-[10px] font-extrabold uppercase tracking-[0.16em]"
            style={{ color: C.slateMute, ...bodyF }}
          >
            <Award size={12} aria-hidden="true" style={{ color: C.yellowDeep }} /> Totaal betaald
          </span>
          <span className="text-[20px] font-extrabold" style={{ color: C.blueDeep, ...num }}>
            {totaalBetaald}
          </span>
        </div>
      </Panel>
    </div>
  );
}
