"use client";

// Concept 459 — "Fond" · Matte fintech-trust, dark tooling.
// Diep mat-donker (bijna zwart, geen glans), ultra-clean precisie zoals Mercury/Ramp/Linear-dark:
// één ingetogen teal-accent, haarscherpe hairlines, compacte datadichtheid, tabulaire cijfers overal,
// rustige betrouwbaarheid. Geen decoratie — elke pixel functioneel. Vertrouwen via strakke, mat-donkere
// professionaliteit rond financiële en gevoelige data. Animaties respecteren prefers-reduced-motion.

import { useMemo, useState } from "react";
import {
  AlertTriangle,
  ArrowRight,
  ArrowUpRight,
  Bell,
  Check,
  ChevronRight,
  Clock,
  Command,
  FileText,
  Minus,
  Plus,
  Search,
  ShieldCheck,
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

// — Palet: mat bijna-zwart, koel teal-accent, haarlijnen —
const C = {
  bg: "#0a0c0d",
  bgDeep: "#070809",
  panel: "#101314",
  panelSoft: "#141819",
  raise: "#181c1e",
  hover: "#1b2022",
  sunken: "#0c0f10",
  // accent — koel teal
  teal: "#2fd4c4",
  tealDim: "#22a99c",
  tealInk: "#7fe9dd",
  tealWash: "rgba(47,212,196,0.10)",
  tealMist: "rgba(47,212,196,0.05)",
  tealLine: "rgba(47,212,196,0.28)",
  // inkt
  ink: "#e8eceb",
  inkSoft: "#a7b0af",
  inkMute: "#71797a",
  inkFaint: "#4d5455",
  line: "rgba(255,255,255,0.08)",
  lineSoft: "rgba(255,255,255,0.05)",
  lineStrong: "rgba(255,255,255,0.13)",
  // status
  ok: "#3fbf8f",
  okInk: "#7fe0b8",
  okWash: "rgba(63,191,143,0.11)",
  warn: "#d9a441",
  warnInk: "#f0c877",
  warnWash: "rgba(217,164,65,0.12)",
  info: "#5aa9e6",
  infoInk: "#9ecbf2",
  infoWash: "rgba(90,169,230,0.12)",
  bad: "#e0685c",
  badInk: "#f2988e",
  badWash: "rgba(224,104,92,0.12)",
};

const display = {
  fontFamily: "'Inter', 'Geist', 'Segoe UI', system-ui, -apple-system, sans-serif",
};
const bodyFont = {
  fontFamily: "'Inter', 'Geist', 'Segoe UI', system-ui, -apple-system, sans-serif",
};
const num = {
  fontFamily: "'Geist Mono', ui-monospace, SFMono-Regular, Menlo, monospace",
  fontVariantNumeric: "tabular-nums" as const,
};

// Matte donkere achtergrond — geen glans, alleen een uiterst subtiele diepte bovenin.
function matteBg(): React.CSSProperties {
  return {
    backgroundColor: C.bg,
    backgroundImage:
      "radial-gradient(120% 70% at 50% -30%, rgba(47,212,196,0.04), transparent 60%)," +
      "linear-gradient(180deg, rgba(255,255,255,0.012), transparent 30%)",
  };
}

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

// — Paneel: matte donkere kaart met haarscherpe 1px-rand, geen gloed —
function Panel({
  children,
  className = "",
  as: Tag = "div",
  fill = "panel",
  accent = false,
}: {
  children: React.ReactNode;
  className?: string;
  as?: "div" | "section" | "li" | "article";
  fill?: "panel" | "soft" | "raise" | "sunken";
  accent?: boolean;
}) {
  const base = { panel: C.panel, soft: C.panelSoft, raise: C.raise, sunken: C.sunken }[fill];
  return (
    <Tag
      className={`relative rounded-[10px] ${className}`}
      style={{
        background: base,
        border: `1px solid ${accent ? C.tealLine : C.line}`,
        boxShadow: "0 1px 0 rgba(255,255,255,0.02) inset",
      }}
    >
      {children}
    </Tag>
  );
}

function Eyebrow({ children, tone = C.inkMute }: { children: React.ReactNode; tone?: string }) {
  return (
    <p
      className="flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.2em]"
      style={{ color: tone, ...bodyFont }}
    >
      <span
        className="inline-block h-[6px] w-[6px] rounded-[1px]"
        style={{ background: C.teal }}
        aria-hidden="true"
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
      className="inline-flex items-center gap-1.5 rounded-[6px] px-2 py-0.5 text-[10.5px] font-semibold"
      style={{ color: ink, background: wash, border: `1px solid ${tone}44`, ...bodyFont }}
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
      className={`group inline-flex items-center justify-center gap-2 rounded-[8px] px-4 py-2 text-[12.5px] font-semibold transition-all duration-150 hover:brightness-[1.08] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2fd4c4] focus-visible:ring-offset-2 focus-visible:ring-offset-[#0a0c0d] active:translate-y-px motion-reduce:transition-none ${className}`}
      style={{
        color: "#04100e",
        background: C.teal,
        border: `1px solid ${C.tealDim}`,
        ...bodyFont,
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
      className={`inline-flex items-center justify-center gap-2 rounded-[8px] px-3.5 py-2 text-[12px] font-semibold transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2fd4c4] focus-visible:ring-offset-2 focus-visible:ring-offset-[#0a0c0d] motion-reduce:transition-none ${className}`}
      style={{
        color: active ? C.tealInk : C.inkSoft,
        background: active ? C.tealWash : C.raise,
        border: `1px solid ${active ? C.tealLine : C.line}`,
        ...bodyFont,
      }}
    >
      {children}
    </button>
  );
}

// — Compacte, matte sparkline (haarlijn, geen gloed) —
function FondLine({ data, tone, id }: { data: number[]; tone: string; id: string }) {
  const max = Math.max(...data);
  const min = Math.min(...data);
  const span = max - min || 1;
  const w = 120;
  const h = 28;
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
        <linearGradient id={`fond-${id}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={tone} stopOpacity="0.16" />
          <stop offset="100%" stopColor={tone} stopOpacity="0" />
        </linearGradient>
      </defs>
      <polygon points={`0,${h} ${line} ${w},${h}`} fill={`url(#fond-${id})`} />
      <polyline
        points={line}
        fill="none"
        stroke={tone}
        strokeWidth="1.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx={last[0]} cy={last[1]} r="2.1" fill={C.panel} stroke={tone} strokeWidth="1.4" />
    </svg>
  );
}

// — Voortgangsmeter: strakke matte balk —
function FondMeter({ value, tone = C.teal }: { value: number; tone?: string }) {
  return (
    <span className="hidden items-center gap-2.5 sm:flex" aria-hidden="true">
      <span
        className="relative h-1.5 w-24 overflow-hidden rounded-full"
        style={{ background: C.sunken }}
      >
        <span
          className="block h-full rounded-full"
          style={{
            width: `${value}%`,
            background: tone,
            transition: "width 0.6s cubic-bezier(0.22,1,0.36,1)",
          }}
        />
      </span>
      <span className="text-[12px] font-semibold" style={{ color: tone, ...num }}>
        {value}%
      </span>
    </span>
  );
}

// — Ring-gauge, compact, matte —
function Gauge({
  value,
  size = 132,
  label,
  sub,
}: {
  value: number;
  size?: number;
  label: string;
  sub: string;
}) {
  const r = size / 2 - 9;
  const circ = 2 * Math.PI * r;
  const dash = (value / 100) * circ;
  return (
    <span
      className="relative inline-flex shrink-0 items-center justify-center"
      style={{ width: size, height: size }}
      aria-hidden="true"
    >
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={C.sunken} strokeWidth="7" />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={C.teal}
          strokeWidth="7"
          strokeLinecap="round"
          strokeDasharray={`${dash} ${circ}`}
          style={{ transition: "stroke-dasharray 0.7s cubic-bezier(0.22,1,0.36,1)" }}
        />
      </svg>
      <span className="absolute flex flex-col items-center">
        <span className="text-[26px] font-semibold leading-none" style={{ color: C.ink, ...num }}>
          {label}
        </span>
        <span
          className="mt-1 text-[9px] font-semibold uppercase tracking-[0.16em]"
          style={{ color: C.inkMute, ...bodyFont }}
        >
          {sub}
        </span>
      </span>
    </span>
  );
}

export function Concept459() {
  const [screen, setScreen] = useState<ScreenKey>("dashboard");
  const active = OPDRACHTEN[0] as Opdracht;

  return (
    <div
      className="relative min-h-[720px] w-full antialiased"
      style={{ ...bodyFont, color: C.ink, ...matteBg() }}
    >
      <style>{`
        @keyframes fondRise { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
        .fond-rise { animation: fondRise 0.4s cubic-bezier(0.22, 1, 0.36, 1) both; }
        @keyframes fondBlink { 0%,100% { opacity: 1; } 50% { opacity: 0.35; } }
        .fond-blink { animation: fondBlink 2.2s ease-in-out infinite; }
        @media (prefers-reduced-motion: reduce) {
          .fond-rise { animation: none !important; }
          .fond-blink { animation: none !important; }
        }
      `}</style>

      <div className="relative mx-auto max-w-6xl px-4 pb-24 sm:px-6 md:px-8">
        <TopBar />
        <NavBar screen={screen} setScreen={setScreen} />
        <main key={screen} className="fond-rise pt-6">
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
      <div className="flex items-center gap-3">
        <span
          className="inline-flex h-9 w-9 items-center justify-center rounded-[8px]"
          style={{ background: C.tealWash, border: `1px solid ${C.tealLine}`, color: C.teal }}
          aria-hidden="true"
        >
          <Command size={16} />
        </span>
        <div>
          <p
            className="text-[15px] font-semibold leading-none tracking-[-0.01em]"
            style={{ color: C.ink, ...display }}
          >
            Fond
          </p>
          <p
            className="mt-1.5 text-[10.5px] leading-none"
            style={{ color: C.inkMute, ...bodyFont }}
          >
            {PROFIEL.plaats} · precisie-console
          </p>
        </div>
      </div>
      <div className="flex items-center gap-2.5">
        <span
          className="hidden items-center gap-1.5 rounded-[7px] px-2.5 py-1.5 text-[10.5px] font-semibold sm:inline-flex"
          style={{
            color: C.okInk,
            border: `1px solid ${C.ok}44`,
            background: C.okWash,
            ...bodyFont,
          }}
        >
          <ShieldCheck size={12} aria-hidden="true" />
          {PROFIEL.trust}
        </span>
        <span
          className="relative inline-flex h-9 w-9 items-center justify-center rounded-[8px]"
          style={{ background: C.raise, border: `1px solid ${C.line}`, color: C.inkMute }}
          aria-label={`${ongelezen} ongelezen berichten`}
        >
          <Bell size={15} aria-hidden="true" />
          {ongelezen > 0 && (
            <span
              className="fond-blink absolute -right-0.5 -top-0.5 flex h-4 w-4 items-center justify-center rounded-full text-[9px] font-bold"
              style={{ background: C.teal, color: "#04100e", ...num }}
              aria-hidden="true"
            >
              {ongelezen}
            </span>
          )}
        </span>
        <span className="hidden text-right sm:block">
          <span className="block text-[13px] font-semibold" style={{ color: C.ink, ...bodyFont }}>
            {PROFIEL.naam}
          </span>
          <span className="block text-[10.5px]" style={{ color: C.inkMute, ...bodyFont }}>
            {PROFIEL.rol}
          </span>
        </span>
        <span
          className="inline-flex h-9 w-9 items-center justify-center rounded-[8px] text-[12px] font-semibold"
          style={{
            background: C.tealWash,
            border: `1px solid ${C.tealLine}`,
            color: C.tealInk,
            ...bodyFont,
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
        className="flex items-center gap-0.5 overflow-x-auto rounded-[10px] p-1"
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
              className="flex shrink-0 items-center gap-2 rounded-[7px] px-3.5 py-1.5 text-[12px] font-semibold transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2fd4c4] focus-visible:ring-offset-2 focus-visible:ring-offset-[#101314] motion-reduce:transition-none"
              style={{
                color: on ? C.ink : C.inkMute,
                background: on ? C.raise : "transparent",
                border: `1px solid ${on ? C.lineStrong : "transparent"}`,
                ...bodyFont,
              }}
            >
              {on && (
                <span
                  className="h-[6px] w-[6px] rounded-full"
                  style={{ background: C.teal }}
                  aria-hidden="true"
                />
              )}
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
  const ratio = Math.round((verified / CREDENTIALS.length) * 100);
  return (
    <div className="space-y-5">
      <section className="grid grid-cols-1 gap-4 lg:grid-cols-[1.5fr_1fr]">
        <Panel className="p-6 md:p-7" fill="panel" accent>
          <div className="grid grid-cols-1 items-center gap-6 sm:grid-cols-[1fr_auto]">
            <div>
              <Eyebrow>Overzicht · vandaag</Eyebrow>
              <h1
                className="mt-3.5 text-[27px] font-semibold leading-[1.1] tracking-[-0.02em] md:text-[33px]"
                style={{ color: C.ink, ...display }}
              >
                Goedemorgen, {PROFIEL.naam.split(" ")[0]}.
              </h1>
              <p
                className="mt-2.5 max-w-md text-[13px] leading-relaxed"
                style={{ color: C.inkSoft }}
              >
                Alles op één console. Compact, controleerbaar en herleidbaar — je certificaten,
                reacties en omzet in exacte cijfers.
              </p>
              <div className="mt-5 flex flex-wrap items-center gap-2">
                <PrimaryButton onClick={onActies}>
                  Volgende actie
                  <ArrowRight
                    size={13}
                    aria-hidden="true"
                    className="transition-transform group-hover:translate-x-0.5 motion-reduce:transition-none"
                  />
                </PrimaryButton>
                <GhostButton onClick={onOpen}>Marktplaats</GhostButton>
              </div>
            </div>
            <Gauge value={ratio} label={`${ratio}%`} sub="op orde" />
          </div>
        </Panel>

        <Panel className="p-6" fill="panel">
          <div className="flex items-center justify-between">
            <Eyebrow tone={C.warnInk}>Vraagt aandacht</Eyebrow>
            <AlertTriangle size={16} aria-hidden="true" style={{ color: C.warn }} />
          </div>
          <h2
            className="mt-3.5 text-[16px] font-semibold leading-snug"
            style={{ color: C.ink, ...display }}
          >
            {primair.titel}
          </h2>
          <p className="mt-2 text-[12.5px] leading-relaxed" style={{ color: C.inkSoft }}>
            {primair.detail}
          </p>
          <div className="mt-5">
            <PrimaryButton onClick={onActies} className="w-full">
              {primair.cta}
              <ArrowRight size={13} aria-hidden="true" />
            </PrimaryButton>
          </div>
          <div className="mt-4 pt-3.5" style={{ borderTop: `1px solid ${C.lineSoft}` }}>
            <p
              className="flex items-center gap-2 text-[11.5px]"
              style={{ color: C.inkMute, ...num }}
            >
              <Check size={12} aria-hidden="true" style={{ color: C.ok }} />
              {verified}/{CREDENTIALS.length} certificaten geverifieerd · 7 open reacties
            </p>
          </div>
        </Panel>
      </section>

      <section>
        <div className="mb-3 flex items-center gap-3">
          <Eyebrow>Kerncijfers · deze maand</Eyebrow>
          <span className="h-px flex-1" style={{ background: C.lineSoft }} aria-hidden="true" />
        </div>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {KPIS.map((k, i) => (
            <Panel key={k.label} className="p-4" fill="panel">
              <div className="flex items-start justify-between gap-2">
                <p
                  className="text-[10px] font-semibold uppercase tracking-[0.09em]"
                  style={{ color: C.inkMute, ...bodyFont }}
                >
                  {k.label}
                </p>
                <span
                  className="inline-flex items-center gap-0.5 rounded-[5px] px-1.5 py-0.5 text-[9.5px] font-bold"
                  style={{
                    color: k.up ? C.okInk : C.warnInk,
                    background: k.up ? C.okWash : C.warnWash,
                    ...num,
                  }}
                >
                  {k.up ? (
                    <ArrowUpRight size={10} aria-hidden="true" />
                  ) : (
                    <Minus size={10} aria-hidden="true" />
                  )}
                  {k.trend.replace(/^[+-]/, "")}
                </span>
              </div>
              <p
                className="mt-2.5 text-[25px] font-semibold leading-none tracking-[-0.01em]"
                style={{ color: C.ink, ...num }}
              >
                {k.value}
              </p>
              <div className="mt-2.5">
                <FondLine data={k.spark} tone={k.up ? C.teal : C.warn} id={`k459-${i}`} />
              </div>
            </Panel>
          ))}
        </div>
      </section>

      <section className="grid grid-cols-1 gap-4 lg:grid-cols-[1.5fr_1fr]">
        <div>
          <div className="mb-3 flex items-baseline justify-between">
            <Eyebrow>Open opdrachten</Eyebrow>
            <button
              type="button"
              onClick={onOpen}
              className="rounded text-[10.5px] font-semibold uppercase tracking-[0.12em] transition-colors hover:brightness-125 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2fd4c4] focus-visible:ring-offset-2 focus-visible:ring-offset-[#0a0c0d]"
              style={{ color: C.teal, ...bodyFont }}
            >
              Alle →
            </button>
          </div>
          <Panel className="overflow-hidden" fill="panel">
            <ul>
              {OPDRACHTEN.map((o, i) => (
                <li key={o.id} style={{ borderTop: i === 0 ? "none" : `1px solid ${C.lineSoft}` }}>
                  <button
                    type="button"
                    onClick={onOpen}
                    className="group grid w-full grid-cols-[auto_1fr_auto] items-center gap-3.5 px-4 py-3.5 text-left transition-colors hover:bg-[#1b2022] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#2fd4c4] motion-reduce:transition-none"
                  >
                    <span
                      className="inline-flex h-9 w-9 items-center justify-center rounded-[8px]"
                      style={{
                        background: i === 0 ? C.tealWash : C.sunken,
                        border: `1px solid ${i === 0 ? C.tealLine : C.line}`,
                      }}
                    >
                      <span
                        className="text-[12px] font-semibold leading-none"
                        style={{ color: i === 0 ? C.tealInk : C.inkMute, ...num }}
                      >
                        {o.match}
                      </span>
                    </span>
                    <span className="min-w-0">
                      <span
                        className="block truncate text-[14px] font-semibold"
                        style={{ color: C.ink, ...bodyFont }}
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
                      <FondMeter value={o.match} tone={o.match >= 90 ? C.teal : C.warn} />
                      <ChevronRight
                        size={16}
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
            <Eyebrow>Certificaten</Eyebrow>
          </div>
          <Panel className="p-4" fill="panel">
            <ul className="space-y-0.5">
              {CREDENTIALS.map((c, i) => {
                const st = statusMeta(c.status);
                return (
                  <li
                    key={c.naam}
                    className="flex items-center gap-3 py-2.5"
                    style={{ borderTop: i === 0 ? "none" : `1px solid ${C.lineSoft}` }}
                  >
                    <span
                      className="inline-flex h-8 w-8 items-center justify-center rounded-[7px]"
                      style={{
                        background: st.wash,
                        border: `1px solid ${st.tone}33`,
                        color: st.ink,
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
    <div className="space-y-5">
      <div>
        <Eyebrow>Marktplaats</Eyebrow>
        <h1
          className="mt-2.5 text-[26px] font-semibold leading-none tracking-[-0.02em]"
          style={{ color: C.ink, ...display }}
        >
          Open opdrachten
        </h1>
        <p className="mt-2 text-[12px]" style={{ color: C.inkMute, ...num }}>
          {String(filtered.length).padStart(2, "0")} van{" "}
          {String(OPDRACHTEN.length).padStart(2, "0")} opdrachten beschikbaar
        </p>
      </div>

      <div className="flex flex-col gap-2.5 sm:flex-row sm:items-center">
        <div
          className="flex flex-1 items-center gap-2.5 rounded-[9px] px-4 py-2.5"
          style={{ background: C.panel, border: `1px solid ${C.line}` }}
        >
          <Search size={15} aria-hidden="true" style={{ color: C.inkFaint }} />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Zoek op titel, plaats of opdrachtgever…"
            aria-label="Opdrachten zoeken"
            className="w-full bg-transparent text-[12.5px] outline-none placeholder:text-[#4d5455]"
            style={{ color: C.ink, ...bodyFont }}
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
            {loading ? "Stop" : "Laden…"}
          </GhostButton>
        </div>
      </div>

      {loading ? (
        <ul className="space-y-3" aria-hidden="true">
          {[0, 1, 2].map((i) => (
            <li key={i}>
              <Panel className="p-5" fill="panel">
                <div className="animate-pulse space-y-3 motion-reduce:animate-none">
                  <div className="h-2.5 w-20 rounded" style={{ background: C.raise }} />
                  <div className="h-4 w-2/3 rounded" style={{ background: C.hover }} />
                  <div className="h-2.5 w-1/2 rounded" style={{ background: C.raise }} />
                  <div className="h-1.5 w-full rounded" style={{ background: C.raise }} />
                </div>
              </Panel>
            </li>
          ))}
        </ul>
      ) : filtered.length === 0 ? (
        <Panel className="p-6" fill="panel">
          <div className="flex flex-col items-center py-14 text-center">
            <span
              className="inline-flex h-14 w-14 items-center justify-center rounded-[12px]"
              style={{ background: C.sunken, border: `1px solid ${C.tealLine}`, color: C.teal }}
              aria-hidden="true"
            >
              <Search size={24} />
            </span>
            <p className="mt-5 text-[19px] font-semibold" style={{ color: C.ink, ...display }}>
              Geen resultaten
            </p>
            <p className="mx-auto mt-2 max-w-xs text-[13px]" style={{ color: C.inkSoft }}>
              Geen opdracht bij {q ? `“${q}”` : "je zoekterm"}. Verruim je zoekterm om meer te zien.
            </p>
            <div className="mt-5">
              <PrimaryButton onClick={() => setQ("")}>
                Zoekterm wissen <ArrowRight size={13} aria-hidden="true" />
              </PrimaryButton>
            </div>
          </div>
        </Panel>
      ) : (
        <ul className="space-y-3">
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
  const tone = strong ? C.teal : C.warn;
  const ink = strong ? C.tealInk : C.warnInk;
  return (
    <Panel className="p-5" fill="panel" accent={strong}>
      <div className="grid grid-cols-[1fr_auto] items-start gap-4">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span
              className="inline-flex items-center gap-1 rounded-[5px] px-1.5 py-0.5 text-[9.5px] font-semibold uppercase tracking-[0.08em]"
              style={{ color: C.inkMute, border: `1px solid ${C.line}`, ...num }}
            >
              № {String(index + 1).padStart(2, "0")}
            </span>
            <span className="text-[11px] font-semibold" style={{ color: C.inkFaint, ...num }}>
              {opdracht.id}
            </span>
          </div>
          <h3
            className="mt-2 text-[17px] font-semibold leading-snug tracking-[-0.01em]"
            style={{ color: C.ink, ...display }}
          >
            {opdracht.titel}
          </h3>
          <p className="mt-1 text-[12px]" style={{ color: C.inkMute }}>
            {opdracht.opdrachtgever} · {opdracht.plaats} · {opdracht.uren}
          </p>
          <div className="mt-3 flex flex-wrap gap-1.5">
            {opdracht.tags.map((t) => (
              <span
                key={t}
                className="inline-flex items-center rounded-[5px] px-2 py-0.5 text-[10px] font-semibold"
                style={{
                  color: C.inkSoft,
                  background: C.raise,
                  border: `1px solid ${C.lineSoft}`,
                  ...bodyFont,
                }}
              >
                {t}
              </span>
            ))}
          </div>
        </div>
        <div className="flex flex-col items-end gap-1.5">
          <span
            className="inline-flex items-center gap-1.5 rounded-[7px] px-2.5 py-1.5"
            style={{ background: strong ? C.tealWash : C.warnWash, border: `1px solid ${tone}44` }}
          >
            <span className="text-[16px] font-semibold leading-none" style={{ color: ink, ...num }}>
              {opdracht.match}
            </span>
            <span
              className="text-[9px] font-semibold uppercase tracking-[0.1em]"
              style={{ color: C.inkMute, ...bodyFont }}
            >
              match
            </span>
          </span>
          <span className="text-[13px] font-bold" style={{ color: ink, ...num }}>
            {opdracht.tarief}
          </span>
        </div>
      </div>
      <div className="mt-4 flex items-center gap-3">
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          className="inline-flex items-center gap-1.5 rounded-[7px] px-3 py-1.5 text-[11px] font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2fd4c4] focus-visible:ring-offset-2 focus-visible:ring-offset-[#101314]"
          style={{ color: C.tealInk, border: `1px solid ${C.line}`, ...bodyFont }}
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
        className="duration-400 grid transition-all motion-reduce:transition-none"
        style={{ gridTemplateRows: open ? "1fr" : "0fr" }}
      >
        <div className="overflow-hidden">
          <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
            <RedenBlok titel="Voor jou" tone={C.okInk} Icon={Check} items={opdracht.redenen.plus} />
            <RedenBlok
              titel="Let op"
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
      className="rounded-[8px] p-3.5"
      style={{ background: C.sunken, border: `1px solid ${C.lineSoft}` }}
    >
      <p
        className="text-[9.5px] font-semibold uppercase tracking-[0.14em]"
        style={{ color: tone, ...bodyFont }}
      >
        {titel}
      </p>
      <ul className="mt-2.5 space-y-2">
        {items.map((r) => (
          <li key={r} className="flex items-start gap-2 text-[12px]" style={{ color: C.inkSoft }}>
            <Icon
              size={12}
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
  const tone = strong ? C.teal : C.warn;
  const ink = strong ? C.tealInk : C.warnInk;
  return (
    <div className="space-y-5">
      <button
        type="button"
        onClick={onBack}
        className="inline-flex items-center gap-2 rounded-[8px] px-3.5 py-2 text-[12px] font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2fd4c4] focus-visible:ring-offset-2 focus-visible:ring-offset-[#0a0c0d]"
        style={{
          color: C.inkSoft,
          border: `1px solid ${C.line}`,
          background: C.panel,
          ...bodyFont,
        }}
      >
        <ArrowRight size={13} aria-hidden="true" className="rotate-180" /> Terug naar marktplaats
      </button>

      <Panel className="p-6 md:p-7" fill="panel" accent>
        <div className="grid grid-cols-1 items-center gap-6 sm:grid-cols-[1fr_auto]">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span
                className="inline-flex items-center rounded-[5px] px-2 py-0.5 text-[10px] font-semibold"
                style={{ color: C.inkMute, border: `1px solid ${C.line}`, ...num }}
              >
                {opdracht.id}
              </span>
              <span
                className="inline-flex items-center gap-1 rounded-[5px] px-2 py-0.5 text-[10.5px] font-bold"
                style={{
                  color: ink,
                  background: strong ? C.tealWash : C.warnWash,
                  border: `1px solid ${tone}44`,
                  ...num,
                }}
              >
                {strong ? "Sterke match" : "Goede match"} · {opdracht.match}%
              </span>
            </div>
            <h1
              className="mt-3.5 max-w-2xl text-[27px] font-semibold leading-[1.12] tracking-[-0.02em] md:text-[33px]"
              style={{ color: C.ink, ...display }}
            >
              {opdracht.titel}
            </h1>
            <p className="mt-2 text-[13px]" style={{ color: C.inkSoft }}>
              {opdracht.opdrachtgever} · {opdracht.plaats}
            </p>
            <div className="mt-5 flex flex-wrap gap-2">
              <PrimaryButton>
                Reageer op opdracht <ArrowRight size={13} aria-hidden="true" />
              </PrimaryButton>
              <GhostButton>Bewaren</GhostButton>
            </div>
          </div>
          <Gauge value={opdracht.match} label={`${opdracht.match}`} sub="match" />
        </div>
      </Panel>

      <Panel className="overflow-hidden" fill="panel">
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
                className="text-[9.5px] font-semibold uppercase tracking-[0.14em]"
                style={{ color: C.inkMute, ...bodyFont }}
              >
                {m.l}
              </p>
              <p
                className="mt-1.5 text-[17px] font-semibold tracking-[-0.01em]"
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
        <p className="mt-2.5 max-w-xl text-[13px] leading-relaxed" style={{ color: C.inkSoft }}>
          Afgelezen van je geverifieerde profiel — wat je meebrengt én waar de aandacht ligt,
          transparant en zonder verborgen score.
        </p>
        <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-2">
          <Panel className="p-5" fill="panel">
            <div className="flex items-center gap-2">
              <span
                className="inline-flex h-7 w-7 items-center justify-center rounded-[7px]"
                style={{ color: C.okInk, background: C.okWash, border: `1px solid ${C.ok}44` }}
                aria-hidden="true"
              >
                <Check size={14} />
              </span>
              <p
                className="text-[10.5px] font-semibold uppercase tracking-[0.12em]"
                style={{ color: C.okInk, ...bodyFont }}
              >
                Voor jou
              </p>
            </div>
            <ul className="mt-3.5 space-y-2.5">
              {opdracht.redenen.plus.map((r) => (
                <li
                  key={r}
                  className="flex items-start gap-3 text-[13px]"
                  style={{ color: C.inkSoft }}
                >
                  <Check
                    size={14}
                    aria-hidden="true"
                    className="mt-0.5 shrink-0"
                    style={{ color: C.okInk }}
                  />
                  {r}
                </li>
              ))}
            </ul>
          </Panel>
          <Panel className="p-5" fill="soft">
            <div className="flex items-center gap-2">
              <span
                className="inline-flex h-7 w-7 items-center justify-center rounded-[7px]"
                style={{
                  color: C.warnInk,
                  background: C.warnWash,
                  border: `1px solid ${C.warn}44`,
                }}
                aria-hidden="true"
              >
                <AlertTriangle size={13} />
              </span>
              <p
                className="text-[10.5px] font-semibold uppercase tracking-[0.12em]"
                style={{ color: C.warnInk, ...bodyFont }}
              >
                Let op
              </p>
            </div>
            <ul className="mt-3.5 space-y-2.5">
              {opdracht.redenen.min.map((r) => (
                <li
                  key={r}
                  className="flex items-start gap-3 text-[13px]"
                  style={{ color: C.inkSoft }}
                >
                  <AlertTriangle
                    size={13}
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
        <div className="mt-3.5">
          <span className="text-[12px]" style={{ color: ink, ...bodyFont }}>
            Match {opdracht.match}% —{" "}
            {strong ? "sterk afgestemd op jouw profiel." : "goed afgestemd op jouw profiel."}
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
    <div className="space-y-5">
      <Panel className="p-6 md:p-7" fill="panel" accent>
        <div className="flex flex-wrap items-center justify-between gap-6">
          <div className="max-w-md">
            <Eyebrow>Verificatie · versleuteld bewaard</Eyebrow>
            <h1
              className="mt-2.5 text-[24px] font-semibold leading-tight tracking-[-0.02em]"
              style={{ color: C.ink, ...display }}
            >
              Jouw certificaten
            </h1>
            <p className="mt-2.5 text-[13px] leading-relaxed" style={{ color: C.inkSoft }}>
              <span className="font-semibold" style={{ color: C.tealInk }}>
                {PROFIEL.trust}.
              </span>{" "}
              {verified} van {CREDENTIALS.length} certificaten zijn geverifieerd. Eén verloopt
              binnenkort en vraagt om vernieuwing. Documenten blijven versleuteld en privé.
            </p>
            <div className="mt-3.5 max-w-xs">
              <FondMeter value={ratio} tone={C.teal} />
            </div>
          </div>
          <Gauge value={ratio} size={112} label={`${ratio}%`} sub="op orde" />
        </div>
      </Panel>

      <Panel className="overflow-hidden" fill="panel">
        <div
          className="hidden grid-cols-[1fr_11rem_2.5rem] items-center gap-4 px-5 py-3 sm:grid"
          style={{ borderBottom: `1px solid ${C.lineSoft}` }}
        >
          {["Certificaat", "Status", ""].map((h, i) => (
            <span
              key={h || i}
              className="text-[9.5px] font-semibold uppercase tracking-[0.16em]"
              style={{ color: C.inkMute, ...bodyFont }}
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
                  className="grid w-full grid-cols-[1fr_auto] items-center gap-4 px-5 py-3.5 text-left transition-colors hover:bg-[#1b2022] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#2fd4c4] motion-reduce:transition-none sm:grid-cols-[1fr_11rem_2.5rem]"
                >
                  <span className="flex min-w-0 items-center gap-3">
                    <span
                      className="inline-flex h-9 w-9 items-center justify-center rounded-[8px]"
                      style={{
                        background: st.wash,
                        border: `1px solid ${st.tone}33`,
                        color: st.ink,
                      }}
                      aria-hidden="true"
                    >
                      <st.Icon size={15} />
                    </span>
                    <span className="min-w-0">
                      <span
                        className="block truncate text-[14px] font-semibold"
                        style={{ color: C.ink, ...bodyFont }}
                      >
                        {c.naam}
                      </span>
                      <span
                        className="mt-0.5 block truncate text-[11px]"
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
                  className="duration-400 grid transition-all motion-reduce:transition-none"
                  style={{ gridTemplateRows: isOpen ? "1fr" : "0fr" }}
                >
                  <div className="overflow-hidden">
                    <div className="px-5 pb-4 sm:pl-[68px]">
                      <div
                        className="rounded-[8px] p-3.5"
                        style={{ background: C.sunken, border: `1px solid ${C.lineSoft}` }}
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
        <div className="mb-3">
          <Eyebrow>Documentenkast</Eyebrow>
        </div>
        <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
          {DOCUMENTEN.map((d) => {
            const st = statusMeta(d.status);
            return (
              <Panel key={d.naam} className="flex items-center gap-3 p-3.5" fill="panel">
                <span
                  className="inline-flex h-9 w-9 items-center justify-center rounded-[8px]"
                  style={{ background: C.sunken, border: `1px solid ${C.line}`, color: C.inkSoft }}
                  aria-hidden="true"
                >
                  <FileText size={15} />
                </span>
                <span className="min-w-0 flex-1">
                  <span
                    className="block truncate text-[12.5px] font-semibold"
                    style={{ color: C.ink }}
                  >
                    {d.naam}
                  </span>
                  <span className="block text-[10.5px]" style={{ color: C.inkMute, ...num }}>
                    {d.type} · {d.grootte} · {d.bijgewerkt}
                  </span>
                </span>
                <span
                  className="inline-flex items-center gap-1 rounded-[6px] px-2 py-1 text-[10px] font-semibold"
                  style={{ color: st.ink, background: st.wash, border: `1px solid ${st.tone}33` }}
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
    <div className="space-y-5">
      <div>
        <Eyebrow>Acties · op volgorde van urgentie</Eyebrow>
        <h1
          className="mt-2.5 text-[26px] font-semibold leading-none tracking-[-0.02em]"
          style={{ color: C.ink, ...display }}
        >
          Wat nu aandacht vraagt
        </h1>
        <p className="mt-2 max-w-md text-[13px]" style={{ color: C.inkSoft }}>
          Van boven naar beneden afwerken — zo blijf je verifieerbaar en betaald, op orde.
        </p>
      </div>

      <ol className="space-y-2.5">
        {ACTIES.map((a, i) => {
          const warn = a.urgentie === "warning";
          const tone = warn ? C.warn : C.teal;
          const ink = warn ? C.warnInk : C.tealInk;
          const wash = warn ? C.warnWash : C.tealWash;
          const focus = i === 0;
          return (
            <li key={a.titel}>
              <Panel className="p-5" fill="panel" accent={focus}>
                <div className="grid grid-cols-[auto_1fr] items-start gap-4 sm:grid-cols-[auto_1fr_auto]">
                  <span
                    className="flex h-10 w-10 items-center justify-center rounded-[9px] text-[14px] font-bold"
                    style={{ background: wash, border: `1px solid ${tone}44`, color: ink, ...num }}
                    aria-hidden="true"
                  >
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <div className="min-w-0">
                    <span
                      className="inline-flex items-center gap-1 rounded-[5px] px-2 py-0.5 text-[9.5px] font-semibold uppercase tracking-[0.1em]"
                      style={{
                        color: ink,
                        background: wash,
                        border: `1px solid ${tone}44`,
                        ...bodyFont,
                      }}
                    >
                      {warn ? (
                        <AlertTriangle size={10} aria-hidden="true" />
                      ) : (
                        <span
                          className="h-[6px] w-[6px] rounded-full"
                          style={{ background: ink }}
                          aria-hidden="true"
                        />
                      )}
                      {warn ? "Urgent" : "Aanbevolen"}
                    </span>
                    <h2
                      className="mt-2 text-[16px] font-semibold leading-snug"
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
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <Eyebrow>Facturen</Eyebrow>
          <h1
            className="mt-2.5 text-[26px] font-semibold leading-none tracking-[-0.02em]"
            style={{ color: C.ink, ...display }}
          >
            Facturen
          </h1>
        </div>
        <PrimaryButton>
          <Plus size={14} aria-hidden="true" /> Nieuwe factuur
        </PrimaryButton>
      </div>

      <section className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        {[
          { l: "Betaald (mnd)", v: totaalBetaald, sub: "3 voldaan", alarm: false, accent: false },
          { l: "Openstaand", v: "€ 1.350", sub: "1 factuur · 9 dagen", alarm: true, accent: true },
          { l: "Concept", v: "€ 880", sub: "klaar om te versturen", alarm: false, accent: false },
        ].map((s) => (
          <Panel key={s.l} className="p-5" fill="panel" accent={s.accent}>
            <div className="flex items-center justify-between">
              <p
                className="text-[10px] font-semibold uppercase tracking-[0.09em]"
                style={{ color: C.inkMute, ...bodyFont }}
              >
                {s.l}
              </p>
              {s.alarm && (
                <span
                  className="inline-flex h-6 w-6 items-center justify-center rounded-[6px]"
                  style={{ background: C.warnWash, color: C.warnInk }}
                  aria-hidden="true"
                >
                  <AlertTriangle size={13} />
                </span>
              )}
            </div>
            <p
              className="mt-2 text-[25px] font-semibold tracking-[-0.01em]"
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

      <Panel className="overflow-hidden" fill="panel">
        <div
          className="hidden grid-cols-[8rem_1fr_5rem_9rem_6rem] gap-4 px-5 pb-3 pt-4 sm:grid"
          style={{ borderBottom: `1px solid ${C.lineSoft}` }}
        >
          {["Nummer", "Klant", "Datum", "Status", "Bedrag"].map((h, i) => (
            <span
              key={h}
              className={`text-[9.5px] font-semibold uppercase tracking-[0.14em] ${i === 4 ? "text-right" : ""}`}
              style={{ color: C.inkMute, ...bodyFont }}
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
                className="grid grid-cols-[1fr_auto] items-center gap-3 px-5 py-3.5 transition-colors hover:bg-[#1b2022] sm:grid-cols-[8rem_1fr_5rem_9rem_6rem] sm:gap-4"
                style={{ borderTop: i === 0 ? "none" : `1px solid ${C.lineSoft}` }}
              >
                <span
                  className="order-1 text-[11px] font-semibold"
                  style={{ color: C.inkMute, ...num }}
                >
                  {f.nr}
                </span>
                <span
                  className="order-3 min-w-0 truncate text-[13.5px] font-semibold sm:order-2"
                  style={{ color: C.ink, ...bodyFont }}
                >
                  {f.klant}
                </span>
                <span
                  className="order-4 hidden text-[11px] sm:order-3 sm:inline"
                  style={{ color: C.inkMute, ...num }}
                >
                  {f.datum}
                </span>
                <span className="order-5 sm:order-4">
                  <span
                    className="inline-flex items-center gap-1.5 rounded-[6px] px-2 py-1 text-[10px] font-semibold"
                    style={{
                      color: ft.ink,
                      background: ft.wash,
                      border: `1px solid ${ft.tone}33`,
                      ...bodyFont,
                    }}
                  >
                    {ft.Icon && <ft.Icon size={11} aria-hidden="true" />}
                    {f.status}
                  </span>
                </span>
                <span
                  className="order-2 text-right text-[13.5px] font-bold sm:order-5"
                  style={{ color: acc ? C.warnInk : C.ink, ...num }}
                >
                  {f.bedrag}
                </span>
              </li>
            );
          })}
        </ul>
        <div
          className="flex items-baseline justify-between px-5 py-3.5"
          style={{ borderTop: `1px solid ${C.lineSoft}` }}
        >
          <span
            className="flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.16em]"
            style={{ color: C.inkMute, ...bodyFont }}
          >
            <Check size={12} aria-hidden="true" style={{ color: C.ok }} /> Totaal betaald
          </span>
          <span className="text-[19px] font-semibold" style={{ color: C.ink, ...num }}>
            {totaalBetaald}
          </span>
        </div>
      </Panel>
    </div>
  );
}
