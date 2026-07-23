"use client";

// Concept 455 — "Sereen" · Quiet-luxury near-monochroom (calm-interfaces / low-stimulation-trend).
// Extreme rust en terughoudendheid. Een warm-grijs / greige monochroom palet met één enkel gedempt
// accent (zacht klei/terra). Enorme witruimte, ultradunne hairlines, ademende micro-motion die heel
// subtiel blijft. "Stille luxe" — alsof alle complexiteit is weggemasseerd. Grote, leesbare
// typografie, veel lucht, niets schreeuwt. Rustgevend rond gevoelige documenten. Animaties
// respecteren prefers-reduced-motion. Status altijd label + icoon — nooit alleen kleur.

import { useMemo, useState } from "react";
import {
  AlertTriangle,
  ArrowRight,
  ArrowUpRight,
  Bell,
  Check,
  ChevronRight,
  Clock,
  FileText,
  Minus,
  Plus,
  Search,
  ShieldCheck,
  X,
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

// — Palet: warm greige monochroom, één gedempt klei/terra-accent. Status leunt op zeer gedempte
//   tinten die de rust bewaren; het onderscheid komt altijd óók van label + icoon. —
const C = {
  // warm papier / greige basis
  bg: "#f4f2ee",
  bgSoft: "#efece7",
  panel: "#faf9f6",
  panelSoft: "#f6f4f0",
  raise: "#efece6",
  hover: "#eae7e0",
  // ultradunne hairlines
  line: "#e4e0d8",
  lineSoft: "#ece9e2",
  hair: "#dcd7cd",
  // inkt — warm antraciet, geen puur zwart
  ink: "#2c2a26",
  inkSoft: "#5b574f",
  inkMute: "#8a857a",
  inkFaint: "#b0aa9d",
  // enkel accent — zachte klei / terra
  clay: "#a8734f",
  clayDeep: "#8f5e3d",
  clayWash: "#f0e7de",
  clayLine: "#e4d3c3",
  // gedempte status-tinten (rust bewaard)
  sage: "#6f7d63",
  sageInk: "#556049",
  sageWash: "#e9ece3",
  amber: "#a98a4b",
  amberInk: "#836a37",
  amberWash: "#efe9db",
  rose: "#a26758",
  roseInk: "#824f42",
  roseWash: "#efe3df",
};

// Serif voor rustige, leesbare koppen; humanist sans voor tekst.
const display = {
  fontFamily: "'Fraunces', 'Spectral', 'Iowan Old Style', Georgia, 'Times New Roman', serif",
  letterSpacing: "-0.01em",
  fontWeight: 400,
};
const bodyFont = {
  fontFamily: "'Inter', 'Segoe UI', system-ui, -apple-system, sans-serif",
};
const num = {
  fontFamily: "'Inter', ui-monospace, SFMono-Regular, Menlo, monospace",
  fontVariantNumeric: "tabular-nums" as const,
};

function paperBg(): React.CSSProperties {
  return {
    backgroundColor: C.bg,
    backgroundImage:
      "radial-gradient(100% 60% at 50% -10%, rgba(168,115,79,0.05), transparent 60%)",
  };
}

function statusMeta(s: CredStatus): {
  label: string;
  Icon: LucideIcon;
  alarm: boolean;
  ink: string;
  wash: string;
} {
  switch (s) {
    case "VERIFIED":
      return {
        label: "Geverifieerd",
        Icon: ShieldCheck,
        alarm: false,
        ink: C.sageInk,
        wash: C.sageWash,
      };
    case "SUBMITTED":
      return { label: "In beoordeling", Icon: Clock, alarm: false, ink: C.inkSoft, wash: C.raise };
    case "EXPIRING":
      return {
        label: "Verloopt binnenkort",
        Icon: AlertTriangle,
        alarm: true,
        ink: C.amberInk,
        wash: C.amberWash,
      };
    case "REJECTED":
      return { label: "Afgewezen", Icon: X, alarm: true, ink: C.roseInk, wash: C.roseWash };
  }
}

// — Paneel: bijna onzichtbaar. Zacht papiervlak, één hairline, nauwelijks schaduw. —
function Panel({
  children,
  className = "",
  as: Tag = "div",
  soft = false,
}: {
  children: React.ReactNode;
  className?: string;
  as?: "div" | "section" | "li" | "article";
  soft?: boolean;
}) {
  return (
    <Tag
      className={`relative overflow-hidden rounded-[20px] ${className}`}
      style={{
        background: soft ? C.panelSoft : C.panel,
        border: `1px solid ${C.line}`,
        boxShadow: "0 1px 2px rgba(44,42,38,0.02)",
        color: C.ink,
      }}
    >
      {children}
    </Tag>
  );
}

function Eyebrow({ children }: { children: React.ReactNode }) {
  return (
    <p
      className="flex items-center gap-2.5 text-[10.5px] font-semibold uppercase tracking-[0.24em]"
      style={{ color: C.inkMute, ...bodyFont }}
    >
      <span className="inline-block h-px w-6" style={{ background: C.clay }} aria-hidden="true" />
      {children}
    </p>
  );
}

function Chip({
  children,
  ink,
  wash,
  alarm = false,
}: {
  children: React.ReactNode;
  ink: string;
  wash: string;
  alarm?: boolean;
}) {
  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-medium"
      style={{ color: ink, background: wash, border: `1px solid ${C.hair}`, ...bodyFont }}
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
      className={`group inline-flex items-center justify-center gap-2 rounded-full px-5 py-2.5 text-[13px] font-medium text-white transition-all duration-300 hover:brightness-[1.06] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 active:translate-y-px motion-reduce:transition-none ${className}`}
      style={{
        background: C.clay,
        boxShadow: "0 4px 14px -8px rgba(143,94,61,0.6)",
        ["--tw-ring-color" as string]: C.clay,
        ["--tw-ring-offset-color" as string]: C.bg,
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
      className={`inline-flex items-center justify-center gap-2 rounded-full px-4 py-2.5 text-[12.5px] font-medium transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 motion-reduce:transition-none ${className}`}
      style={{
        color: active ? C.ink : C.inkSoft,
        background: active ? C.panel : "transparent",
        border: `1px solid ${active ? C.clayLine : C.line}`,
        ["--tw-ring-color" as string]: C.clay,
        ["--tw-ring-offset-color" as string]: C.bg,
        ...bodyFont,
      }}
    >
      {children}
    </button>
  );
}

// — Zeer subtiele voortgangsboog: dunne klei-arc op greige spoor. Rustig, geen glans. —
function QuietRing({
  value,
  size = 128,
  stroke = 5,
  label = "match",
}: {
  value: number;
  size?: number;
  stroke?: number;
  label?: string;
}) {
  const r = (size - stroke) / 2;
  const circ = 2 * Math.PI * r;
  const dash = (value / 100) * circ;
  return (
    <span
      className="relative inline-flex shrink-0 items-center justify-center"
      style={{ width: size, height: size }}
      aria-hidden="true"
    >
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={C.hair}
          strokeWidth={stroke}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={C.clay}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={`${dash} ${circ}`}
          className="ser-arc"
        />
      </svg>
      <span className="absolute flex flex-col items-center">
        <span className="text-[26px] leading-none" style={{ color: C.ink, ...display }}>
          {value}
        </span>
        <span
          className="mt-1 text-[8.5px] font-semibold uppercase tracking-[0.18em]"
          style={{ color: C.inkMute, ...bodyFont }}
        >
          {label}
        </span>
      </span>
    </span>
  );
}

// — Ademende hairline-sparkline: dunne klei-lijn, geen vlak. —
function QuietLine({ data, id }: { data: number[]; id: string }) {
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
        <linearGradient id={`ser-${id}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={C.clay} stopOpacity="0.14" />
          <stop offset="100%" stopColor={C.clay} stopOpacity="0" />
        </linearGradient>
      </defs>
      <polygon points={`0,${h} ${line} ${w},${h}`} fill={`url(#ser-${id})`} />
      <polyline
        points={line}
        fill="none"
        stroke={C.clay}
        strokeWidth="1.4"
        strokeLinecap="round"
        strokeLinejoin="round"
        opacity="0.7"
      />
      <circle cx={last[0]} cy={last[1]} r="2.4" fill={C.panel} stroke={C.clay} strokeWidth="1.4" />
    </svg>
  );
}

// — Stille meter: dunne klei-balk op greige spoor. —
function QuietMeter({ value, className = "" }: { value: number; className?: string }) {
  return (
    <span className={`hidden items-center gap-2.5 sm:flex ${className}`} aria-hidden="true">
      <span
        className="relative h-1.5 w-24 overflow-hidden rounded-full"
        style={{ background: C.raise }}
      >
        <span
          className="block h-full rounded-full"
          style={{
            width: `${value}%`,
            background: C.clay,
            opacity: 0.85,
            transition: "width 0.8s cubic-bezier(0.22,1,0.36,1)",
          }}
        />
      </span>
      <span className="text-[12.5px] font-medium" style={{ color: C.inkSoft, ...num }}>
        {value}%
      </span>
    </span>
  );
}

export function Concept455() {
  const [screen, setScreen] = useState<ScreenKey>("dashboard");
  const [activeId, setActiveId] = useState<string>(OPDRACHTEN[0]!.id);
  const active = OPDRACHTEN.find((o) => o.id === activeId) ?? (OPDRACHTEN[0] as Opdracht);

  const openOpdracht = (id: string) => {
    setActiveId(id);
    setScreen("opdracht");
  };

  return (
    <div
      className="relative min-h-[720px] w-full antialiased"
      style={{ ...bodyFont, color: C.ink, ...paperBg() }}
    >
      <style>{`
        @keyframes serRise { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
        .ser-rise { animation: serRise 0.7s cubic-bezier(0.22, 1, 0.36, 1) both; }
        @keyframes serArc { from { stroke-dashoffset: 300; } to { stroke-dashoffset: 0; } }
        .ser-arc { animation: serArc 1.4s cubic-bezier(0.22, 1, 0.36, 1) both; }
        @keyframes serBreath { 0%,100% { opacity: 0.55; } 50% { opacity: 0.9; } }
        .ser-breath { animation: serBreath 6s ease-in-out infinite; }
        @keyframes serShimmer { 0% { background-position: -160% 0; } 100% { background-position: 160% 0; } }
        .ser-shimmer { background: linear-gradient(100deg, ${C.raise} 30%, ${C.hover} 50%, ${C.raise} 70%); background-size: 220% 100%; animation: serShimmer 1.8s ease-in-out infinite; }
        @media (prefers-reduced-motion: reduce) {
          .ser-rise, .ser-arc, .ser-breath, .ser-shimmer { animation: none !important; }
        }
      `}</style>

      <div className="relative mx-auto max-w-5xl px-4 pb-28 sm:px-6 md:px-8">
        <TopBar />
        <NavBar screen={screen} setScreen={setScreen} />
        <main key={screen} className="ser-rise pt-10">
          {screen === "dashboard" && (
            <Dashboard onOpen={openOpdracht} onActies={() => setScreen("acties")} />
          )}
          {screen === "marktplaats" && <Marktplaats onOpen={openOpdracht} />}
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
    <header className="flex items-center justify-between gap-4 pt-10">
      <div className="flex items-center gap-3.5">
        <span
          className="relative inline-flex h-11 w-11 items-center justify-center rounded-full"
          style={{ background: C.panel, border: `1px solid ${C.clayLine}` }}
          aria-hidden="true"
        >
          <span
            className="ser-breath inline-block h-2.5 w-2.5 rounded-full"
            style={{ background: C.clay }}
          />
        </span>
        <div>
          <p className="text-[21px] leading-none" style={{ color: C.ink, ...display }}>
            Sereen
          </p>
          <p className="mt-1.5 text-[11px] leading-none" style={{ color: C.inkMute, ...bodyFont }}>
            {PROFIEL.plaats} · rust boven ruis
          </p>
        </div>
      </div>
      <div className="flex items-center gap-3">
        <span
          className="hidden items-center gap-1.5 rounded-full px-3 py-1.5 text-[11px] font-medium sm:inline-flex"
          style={{
            color: C.sageInk,
            border: `1px solid ${C.hair}`,
            background: C.sageWash,
            ...bodyFont,
          }}
        >
          <ShieldCheck size={12} aria-hidden="true" />
          {PROFIEL.trust}
        </span>
        <span
          className="relative inline-flex h-10 w-10 items-center justify-center rounded-full"
          style={{ background: C.panel, border: `1px solid ${C.line}`, color: C.inkMute }}
          aria-label={`${ongelezen} ongelezen berichten`}
        >
          <Bell size={16} aria-hidden="true" />
          {ongelezen > 0 && (
            <span
              className="absolute -right-0.5 -top-0.5 flex h-4 w-4 items-center justify-center rounded-full text-[9px] font-semibold text-white"
              style={{ background: C.clay, ...num }}
              aria-hidden="true"
            >
              {ongelezen}
            </span>
          )}
        </span>
        <span className="hidden text-right sm:block">
          <span className="block text-[14px] font-medium" style={{ color: C.ink, ...bodyFont }}>
            {PROFIEL.naam}
          </span>
          <span className="block text-[11px]" style={{ color: C.inkMute, ...bodyFont }}>
            {PROFIEL.rol}
          </span>
        </span>
        <span
          className="inline-flex h-11 w-11 items-center justify-center rounded-full text-[13px] font-medium"
          style={{
            background: C.clayWash,
            border: `1px solid ${C.clayLine}`,
            color: C.clayDeep,
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
    <nav aria-label="Hoofdnavigatie" className="mt-8">
      <div
        className="flex items-center gap-1 overflow-x-auto pb-1"
        style={{ borderBottom: `1px solid ${C.line}` }}
      >
        {SCREENS.map((s) => {
          const on = s.key === screen;
          return (
            <button
              key={s.key}
              type="button"
              onClick={() => setScreen(s.key)}
              aria-current={on ? "page" : undefined}
              className="relative flex shrink-0 items-center gap-2 rounded-t-lg px-4 py-3 text-[13px] font-medium transition-colors duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 motion-reduce:transition-none"
              style={{
                color: on ? C.ink : C.inkMute,
                ["--tw-ring-color" as string]: C.clay,
                ["--tw-ring-offset-color" as string]: C.bg,
                ...bodyFont,
              }}
            >
              {s.label}
              <span
                className="absolute inset-x-3 -bottom-px h-0.5 rounded-full transition-all duration-300 motion-reduce:transition-none"
                style={{ background: on ? C.clay : "transparent" }}
                aria-hidden="true"
              />
            </button>
          );
        })}
      </div>
    </nav>
  );
}

function Dashboard({ onOpen, onActies }: { onOpen: (id: string) => void; onActies: () => void }) {
  const primair = ACTIES[0] as (typeof ACTIES)[number];
  const verified = CREDENTIALS.filter((c) => c.status === "VERIFIED").length;
  const ratio = Math.round((verified / CREDENTIALS.length) * 100);
  return (
    <div className="space-y-12">
      <section className="grid grid-cols-1 gap-8 lg:grid-cols-[1.5fr_1fr]">
        <div className="flex flex-col justify-center py-4">
          <Eyebrow>Vandaag · in alle rust</Eyebrow>
          <h1
            className="mt-6 text-[36px] leading-[1.08] md:text-[52px]"
            style={{ color: C.ink, ...display }}
          >
            Goedemorgen,
            <br />
            {PROFIEL.naam.split(" ")[0]}.
          </h1>
          <p className="mt-5 max-w-md text-[15px] leading-relaxed" style={{ color: C.inkSoft }}>
            Alles op orde, niets schreeuwt. Eén ding vraagt vandaag je aandacht — de rest kan
            wachten. Neem de tijd.
          </p>
          <div className="mt-8 flex flex-wrap items-center gap-3">
            <PrimaryButton onClick={onActies}>
              Volgende actie
              <ArrowRight
                size={14}
                aria-hidden="true"
                className="transition-transform group-hover:translate-x-0.5 motion-reduce:transition-none"
              />
            </PrimaryButton>
            <GhostButton onClick={() => onOpen(OPDRACHTEN[0]!.id)}>Beste match openen</GhostButton>
          </div>
        </div>
        <Panel className="flex flex-col items-center justify-center gap-4 p-8">
          <QuietRing value={ratio} size={148} label="op orde" />
          <p className="text-center text-[13px] leading-relaxed" style={{ color: C.inkMute }}>
            {verified} van {CREDENTIALS.length} certificaten geverifieerd
          </p>
        </Panel>
      </section>

      <section>
        <Panel className="p-7 md:p-9">
          <div className="grid grid-cols-1 items-center gap-6 sm:grid-cols-[1fr_auto]">
            <div>
              <span
                className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10.5px] font-semibold uppercase tracking-[0.14em]"
                style={{
                  color: C.amberInk,
                  background: C.amberWash,
                  border: `1px solid ${C.hair}`,
                  ...bodyFont,
                }}
              >
                <AlertTriangle size={11} aria-hidden="true" />
                Vraagt aandacht
              </span>
              <h2 className="mt-4 text-[24px] leading-snug" style={{ color: C.ink, ...display }}>
                {primair.titel}
              </h2>
              <p className="mt-2 max-w-lg text-[14px] leading-relaxed" style={{ color: C.inkSoft }}>
                {primair.detail}
              </p>
            </div>
            <PrimaryButton onClick={onActies}>
              {primair.cta}
              <ArrowRight size={14} aria-hidden="true" />
            </PrimaryButton>
          </div>
        </Panel>
      </section>

      <section>
        <div className="mb-5">
          <Eyebrow>Baan · deze maand</Eyebrow>
        </div>
        <div
          className="grid grid-cols-1 gap-px overflow-hidden rounded-[20px] sm:grid-cols-2 lg:grid-cols-4"
          style={{ background: C.line, border: `1px solid ${C.line}` }}
        >
          {KPIS.map((k, i) => (
            <div key={k.label} className="p-6" style={{ background: C.panel }}>
              <div className="flex items-start justify-between gap-2">
                <p
                  className="text-[10.5px] font-semibold uppercase tracking-[0.12em]"
                  style={{ color: C.inkMute, ...bodyFont }}
                >
                  {k.label}
                </p>
                <span
                  className="inline-flex items-center gap-0.5 text-[10px] font-medium"
                  style={{ color: k.up ? C.sageInk : C.amberInk, ...num }}
                >
                  <ArrowUpRight size={11} aria-hidden="true" className={k.up ? "" : "rotate-90"} />
                  {k.trend.replace(/^[+-]/, "")}
                </span>
              </div>
              <p className="mt-4 text-[28px] leading-none" style={{ color: C.ink, ...display }}>
                {k.value}
              </p>
              <div className="mt-4">
                <QuietLine data={k.spark} id={`k455-${i}`} />
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="grid grid-cols-1 gap-8 lg:grid-cols-[1.5fr_1fr]">
        <div>
          <div className="mb-5 flex items-baseline justify-between">
            <Eyebrow>Open opdrachten</Eyebrow>
            <button
              type="button"
              onClick={() => onOpen(OPDRACHTEN[0]!.id)}
              className="rounded text-[11px] font-semibold uppercase tracking-[0.14em] transition-colors hover:opacity-70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
              style={{
                color: C.clayDeep,
                ["--tw-ring-color" as string]: C.clay,
                ["--tw-ring-offset-color" as string]: C.bg,
                ...bodyFont,
              }}
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
                    onClick={() => onOpen(o.id)}
                    className="group grid w-full grid-cols-[auto_1fr_auto] items-center gap-4 px-6 py-5 text-left transition-colors hover:bg-[#f6f4f0] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset motion-reduce:transition-none"
                    style={{ ["--tw-ring-color" as string]: C.clay }}
                  >
                    <span
                      className="inline-flex h-11 w-11 items-center justify-center rounded-full text-[13px] font-medium"
                      style={{
                        background: C.clayWash,
                        color: C.clayDeep,
                        border: `1px solid ${C.clayLine}`,
                        ...num,
                      }}
                      aria-hidden="true"
                    >
                      {o.match}
                    </span>
                    <span className="min-w-0">
                      <span
                        className="block truncate text-[15px] font-medium"
                        style={{ color: C.ink, ...bodyFont }}
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
                      <QuietMeter value={o.match} />
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
          <div className="mb-5">
            <Eyebrow>Certificaten</Eyebrow>
          </div>
          <Panel className="p-6">
            <ul className="space-y-1">
              {CREDENTIALS.map((c, i) => {
                const st = statusMeta(c.status);
                return (
                  <li
                    key={c.naam}
                    className="flex items-center gap-3 py-3"
                    style={{ borderTop: i === 0 ? "none" : `1px solid ${C.lineSoft}` }}
                  >
                    <span
                      className="inline-flex h-9 w-9 items-center justify-center rounded-full"
                      style={{ background: st.wash, color: st.ink }}
                      aria-hidden="true"
                    >
                      <st.Icon size={15} />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span
                        className="block truncate text-[12.5px] font-medium"
                        style={{ color: C.ink }}
                      >
                        {c.naam}
                      </span>
                      <span
                        className="flex items-center gap-1 truncate text-[10.5px]"
                        style={{ color: st.ink }}
                      >
                        <st.Icon size={10} aria-hidden="true" />
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

function Marktplaats({ onOpen }: { onOpen: (id: string) => void }) {
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
    <div className="space-y-10">
      <div>
        <Eyebrow>Marktplaats</Eyebrow>
        <h1 className="mt-4 text-[36px] leading-none" style={{ color: C.ink, ...display }}>
          Open opdrachten
        </h1>
        <p className="mt-3 text-[13px]" style={{ color: C.inkMute, ...num }}>
          {String(filtered.length).padStart(2, "0")} van{" "}
          {String(OPDRACHTEN.length).padStart(2, "0")} opdrachten beschikbaar
        </p>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div
          className="flex flex-1 items-center gap-2.5 rounded-full px-5 py-3.5"
          style={{ background: C.panel, border: `1px solid ${C.line}` }}
        >
          <Search size={16} aria-hidden="true" style={{ color: C.inkFaint }} />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Zoek op titel, plaats of opdrachtgever…"
            aria-label="Opdrachten zoeken"
            className="w-full bg-transparent text-[13px] outline-none placeholder:text-[#b0aa9d]"
            style={{ color: C.ink, ...bodyFont }}
          />
        </div>
        <div className="flex items-center gap-2" role="group" aria-label="Sorteren en laden">
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
        <ul className="space-y-4" aria-hidden="true">
          {[0, 1, 2].map((i) => (
            <li key={i}>
              <Panel className="p-7">
                <div className="space-y-3.5">
                  <div className="ser-shimmer h-3 w-24 rounded-full" />
                  <div className="ser-shimmer h-5 w-2/3 rounded-full" />
                  <div className="ser-shimmer h-3 w-1/2 rounded-full" />
                  <div className="ser-shimmer h-2 w-full rounded-full" />
                </div>
              </Panel>
            </li>
          ))}
        </ul>
      ) : filtered.length === 0 ? (
        <Panel className="p-7">
          <div className="flex flex-col items-center py-16 text-center">
            <span
              className="inline-flex h-16 w-16 items-center justify-center rounded-full"
              style={{
                background: C.clayWash,
                color: C.clayDeep,
                border: `1px solid ${C.clayLine}`,
              }}
              aria-hidden="true"
            >
              <Search size={26} />
            </span>
            <p className="mt-6 text-[24px]" style={{ color: C.ink, ...display }}>
              Even helemaal stil
            </p>
            <p
              className="mx-auto mt-3 max-w-xs text-[13.5px] leading-relaxed"
              style={{ color: C.inkSoft }}
            >
              Geen opdracht bij {q ? `“${q}”` : "je zoekterm"}. Verruim je zoekterm — er komt vast
              iets moois voorbij.
            </p>
            <div className="mt-7">
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
  onOpen: (id: string) => void;
}) {
  const [open, setOpen] = useState(false);
  return (
    <Panel className="p-7">
      <div className="grid grid-cols-[1fr_auto] items-start gap-4">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-[11px] font-medium" style={{ color: C.inkFaint, ...num }}>
              № {String(index + 1).padStart(2, "0")} · {opdracht.id}
            </span>
          </div>
          <h3 className="mt-2.5 text-[22px] leading-snug" style={{ color: C.ink, ...display }}>
            {opdracht.titel}
          </h3>
          <p className="mt-1.5 text-[12.5px]" style={{ color: C.inkMute }}>
            {opdracht.opdrachtgever} · {opdracht.plaats} · {opdracht.uren}
          </p>
          <div className="mt-4 flex flex-wrap gap-1.5">
            {opdracht.tags.map((t) => (
              <span
                key={t}
                className="inline-flex items-center rounded-full px-2.5 py-0.5 text-[10.5px] font-medium"
                style={{ color: C.inkSoft, background: C.raise, ...bodyFont }}
              >
                {t}
              </span>
            ))}
          </div>
        </div>
        <div className="flex flex-col items-center gap-2">
          <QuietRing value={opdracht.match} size={68} stroke={4} />
          <span className="text-[13px] font-medium" style={{ color: C.clayDeep, ...num }}>
            {opdracht.tarief}
          </span>
        </div>
      </div>
      <div className="mt-5 flex items-center gap-3">
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          className="inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-[11.5px] font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
          style={{
            color: C.inkSoft,
            border: `1px solid ${C.line}`,
            ["--tw-ring-color" as string]: C.clay,
            ["--tw-ring-offset-color" as string]: C.panel,
            ...bodyFont,
          }}
        >
          {open ? <Minus size={12} aria-hidden="true" /> : <Plus size={12} aria-hidden="true" />}
          Waarom deze match
        </button>
        <div className="ml-auto">
          <PrimaryButton onClick={() => onOpen(opdracht.id)}>
            Reageer <ArrowRight size={13} aria-hidden="true" />
          </PrimaryButton>
        </div>
      </div>
      <div
        className="grid transition-all duration-500 motion-reduce:transition-none"
        style={{ gridTemplateRows: open ? "1fr" : "0fr" }}
      >
        <div className="overflow-hidden">
          <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2">
            <RedenBlok
              titel="Voor jou"
              ink={C.sageInk}
              Icon={Check}
              items={opdracht.redenen.plus}
            />
            <RedenBlok
              titel="Let op"
              ink={C.amberInk}
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
  ink,
  Icon,
  items,
}: {
  titel: string;
  ink: string;
  Icon: LucideIcon;
  items: string[];
}) {
  return (
    <div
      className="rounded-[16px] p-5"
      style={{ background: C.panelSoft, border: `1px solid ${C.lineSoft}` }}
    >
      <p
        className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.16em]"
        style={{ color: ink, ...bodyFont }}
      >
        <Icon size={12} aria-hidden="true" />
        {titel}
      </p>
      <ul className="mt-3 space-y-2.5">
        {items.map((r) => (
          <li key={r} className="flex items-start gap-2 text-[12.5px]" style={{ color: C.inkSoft }}>
            <Icon size={13} aria-hidden="true" className="mt-0.5 shrink-0" style={{ color: ink }} />
            {r}
          </li>
        ))}
      </ul>
    </div>
  );
}

function OpdrachtDetail({ opdracht, onBack }: { opdracht: Opdracht; onBack: () => void }) {
  return (
    <div className="space-y-8">
      <button
        type="button"
        onClick={onBack}
        className="inline-flex items-center gap-2 rounded-full px-4 py-2 text-[12.5px] font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
        style={{
          color: C.inkSoft,
          border: `1px solid ${C.line}`,
          background: C.panel,
          ["--tw-ring-color" as string]: C.clay,
          ["--tw-ring-offset-color" as string]: C.bg,
          ...bodyFont,
        }}
      >
        <ArrowRight size={13} aria-hidden="true" className="rotate-180" /> Terug naar marktplaats
      </button>

      <Panel className="p-8 md:p-10">
        <div className="grid grid-cols-1 items-center gap-8 sm:grid-cols-[1fr_auto]">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span
                className="inline-flex items-center rounded-full px-2.5 py-0.5 text-[10.5px] font-medium"
                style={{ color: C.inkMute, border: `1px solid ${C.line}`, ...num }}
              >
                {opdracht.id}
              </span>
              <Chip ink={C.clayDeep} wash={C.clayWash}>
                <span
                  className="inline-block h-1.5 w-1.5 rounded-full"
                  style={{ background: C.clay }}
                  aria-hidden="true"
                />
                {opdracht.match >= 90 ? "Sterke match" : "Goede match"} · {opdracht.match}%
              </Chip>
            </div>
            <h1
              className="mt-5 max-w-2xl text-[34px] leading-[1.1] md:text-[46px]"
              style={{ color: C.ink, ...display }}
            >
              {opdracht.titel}
            </h1>
            <p className="mt-3 text-[14px]" style={{ color: C.inkSoft }}>
              {opdracht.opdrachtgever} · {opdracht.plaats}
            </p>
            <div className="mt-7 flex flex-wrap gap-3">
              <PrimaryButton>
                Reageer op opdracht <ArrowRight size={14} aria-hidden="true" />
              </PrimaryButton>
              <GhostButton>Bewaren</GhostButton>
            </div>
          </div>
          <QuietRing value={opdracht.match} size={136} />
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
              className="p-6"
              style={{
                borderLeft: i % 4 === 0 ? "none" : `1px solid ${C.lineSoft}`,
                borderTop: i >= 2 ? `1px solid ${C.lineSoft}` : "none",
              }}
            >
              <p
                className="text-[9.5px] font-semibold uppercase tracking-[0.16em]"
                style={{ color: C.inkMute, ...bodyFont }}
              >
                {m.l}
              </p>
              <p className="mt-2 text-[20px]" style={{ color: C.ink, ...display }}>
                {m.v}
              </p>
            </div>
          ))}
        </div>
      </Panel>

      <section>
        <Eyebrow>Verklaarbare matching</Eyebrow>
        <p className="mt-4 max-w-xl text-[14px] leading-relaxed" style={{ color: C.inkSoft }}>
          Rustig afgelezen van je geverifieerde profiel — wat je meebrengt én waar de aandacht ligt.
          Transparant, zonder verborgen score.
        </p>
        <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2">
          <Panel className="p-7">
            <div className="flex items-center gap-2.5">
              <span
                className="inline-flex h-8 w-8 items-center justify-center rounded-full"
                style={{ color: C.sageInk, background: C.sageWash }}
                aria-hidden="true"
              >
                <Check size={15} />
              </span>
              <p
                className="text-[11px] font-semibold uppercase tracking-[0.14em]"
                style={{ color: C.sageInk, ...bodyFont }}
              >
                Voor jou
              </p>
            </div>
            <ul className="mt-5 space-y-3.5">
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
                    style={{ color: C.sageInk }}
                  />
                  {r}
                </li>
              ))}
            </ul>
          </Panel>
          <Panel className="p-7" soft>
            <div className="flex items-center gap-2.5">
              <span
                className="inline-flex h-8 w-8 items-center justify-center rounded-full"
                style={{ color: C.amberInk, background: C.amberWash }}
                aria-hidden="true"
              >
                <AlertTriangle size={14} />
              </span>
              <p
                className="text-[11px] font-semibold uppercase tracking-[0.14em]"
                style={{ color: C.amberInk, ...bodyFont }}
              >
                Let op
              </p>
            </div>
            <ul className="mt-5 space-y-3.5">
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
                    style={{ color: C.amberInk }}
                  />
                  {r}
                </li>
              ))}
            </ul>
          </Panel>
        </div>
        <div className="mt-5">
          <span className="text-[12px]" style={{ color: C.inkMute, ...bodyFont }}>
            Match {opdracht.match}% —{" "}
            {opdracht.match >= 90
              ? "sterk afgestemd op jouw profiel."
              : "goed afgestemd op jouw profiel."}
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
    <div className="space-y-8">
      <Panel className="p-8 md:p-10">
        <div className="flex flex-wrap items-center justify-between gap-8">
          <div className="max-w-md">
            <Eyebrow>Verificatie · veilig bewaard</Eyebrow>
            <h1 className="mt-4 text-[30px] leading-tight" style={{ color: C.ink, ...display }}>
              Jouw certificaten
            </h1>
            <p className="mt-4 text-[14px] leading-relaxed" style={{ color: C.inkSoft }}>
              <span className="font-medium" style={{ color: C.clayDeep }}>
                {PROFIEL.trust}.
              </span>{" "}
              {verified} van {CREDENTIALS.length} certificaten zijn geverifieerd. Eén verloopt
              binnenkort en vraagt om vernieuwing. Documenten blijven versleuteld en privé.
            </p>
            <div className="mt-5 max-w-xs">
              <QuietMeter value={ratio} />
            </div>
          </div>
          <QuietRing value={ratio} size={116} label="op orde" />
        </div>
      </Panel>

      <Panel>
        <div
          className="hidden grid-cols-[1fr_13rem_2.5rem] items-center gap-4 px-7 py-4 sm:grid"
          style={{ borderBottom: `1px solid ${C.lineSoft}` }}
        >
          {["Certificaat", "Status", ""].map((h, i) => (
            <span
              key={h || i}
              className="text-[9.5px] font-semibold uppercase tracking-[0.18em]"
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
                  className="grid w-full grid-cols-[1fr_auto] items-center gap-4 px-7 py-5 text-left transition-colors hover:bg-[#f6f4f0] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset motion-reduce:transition-none sm:grid-cols-[1fr_13rem_2.5rem]"
                  style={{ ["--tw-ring-color" as string]: C.clay }}
                >
                  <span className="flex min-w-0 items-center gap-3.5">
                    <span
                      className="inline-flex h-10 w-10 items-center justify-center rounded-full"
                      style={{ background: st.wash, color: st.ink }}
                      aria-hidden="true"
                    >
                      <st.Icon size={16} />
                    </span>
                    <span className="min-w-0">
                      <span
                        className="block truncate text-[15px] font-medium"
                        style={{ color: C.ink, ...bodyFont }}
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
                    <Chip ink={st.ink} wash={st.wash} alarm={st.alarm}>
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
                    <div className="px-7 pb-6 sm:pl-[84px]">
                      <div
                        className="rounded-[16px] p-5"
                        style={{ background: C.panelSoft, border: `1px solid ${C.lineSoft}` }}
                      >
                        <p
                          className="max-w-xl text-[13px] leading-relaxed"
                          style={{ color: C.inkSoft }}
                        >
                          {c.detail}. Documenten worden versleuteld bewaard en alleen na je
                          expliciete toestemming gedeeld met een opdrachtgever.
                        </p>
                        <div className="mt-4 flex flex-wrap gap-2">
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
        <div className="mb-5">
          <Eyebrow>Documentenkast</Eyebrow>
        </div>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {DOCUMENTEN.map((d) => {
            const st = statusMeta(d.status);
            return (
              <Panel key={d.naam} className="flex items-center gap-3.5 p-5">
                <span
                  className="inline-flex h-10 w-10 items-center justify-center rounded-full"
                  style={{ background: C.raise, color: C.inkSoft }}
                  aria-hidden="true"
                >
                  <FileText size={16} />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-[13px] font-medium" style={{ color: C.ink }}>
                    {d.naam}
                  </span>
                  <span className="block text-[10.5px]" style={{ color: C.inkMute, ...num }}>
                    {d.type} · {d.grootte} · {d.bijgewerkt}
                  </span>
                </span>
                <span
                  className="inline-flex items-center gap-1 rounded-full px-2 py-1 text-[10px] font-medium"
                  style={{ color: st.ink, background: st.wash }}
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
    <div className="space-y-8">
      <div>
        <Eyebrow>Acties · op volgorde van urgentie</Eyebrow>
        <h1 className="mt-4 text-[36px] leading-none" style={{ color: C.ink, ...display }}>
          Wat nu aandacht vraagt
        </h1>
        <p className="mt-3 max-w-md text-[14px] leading-relaxed" style={{ color: C.inkSoft }}>
          Eén ding tegelijk, rustig van boven naar beneden. Zo blijf je verifieerbaar en betaald,
          zonder haast.
        </p>
      </div>

      <ol className="space-y-4">
        {ACTIES.map((a, i) => {
          const warn = a.urgentie === "warning";
          const ink = warn ? C.amberInk : C.inkSoft;
          const wash = warn ? C.amberWash : C.raise;
          return (
            <li key={a.titel}>
              <Panel className="p-7">
                <div className="grid grid-cols-[auto_1fr] items-start gap-5 sm:grid-cols-[auto_1fr_auto]">
                  <span
                    className="flex h-12 w-12 items-center justify-center rounded-full text-[16px]"
                    style={{
                      background: C.panelSoft,
                      border: `1px solid ${C.line}`,
                      color: C.inkSoft,
                      ...display,
                    }}
                    aria-hidden="true"
                  >
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <div className="min-w-0">
                    <span
                      className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[9.5px] font-semibold uppercase tracking-[0.12em]"
                      style={{
                        color: ink,
                        background: wash,
                        border: `1px solid ${C.hair}`,
                        ...bodyFont,
                      }}
                    >
                      {warn ? (
                        <AlertTriangle size={10} aria-hidden="true" />
                      ) : (
                        <span
                          className="inline-block h-1.5 w-1.5 rounded-full"
                          style={{ background: C.clay }}
                        />
                      )}
                      {warn ? "Urgent" : "Aanbevolen"}
                    </span>
                    <h2
                      className="mt-2.5 text-[22px] leading-snug"
                      style={{ color: C.ink, ...display }}
                    >
                      {a.titel}
                    </h2>
                    <p
                      className="mt-2 max-w-lg text-[13.5px] leading-relaxed"
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

function factuurMeta(status: string): { ink: string; wash: string; Icon: LucideIcon | null } {
  if (status === "Openstaand") return { ink: C.amberInk, wash: C.amberWash, Icon: AlertTriangle };
  if (status === "Betaald") return { ink: C.sageInk, wash: C.sageWash, Icon: Check };
  return { ink: C.inkMute, wash: C.raise, Icon: FileText };
}

function Facturen() {
  const totaalBetaald = "€ 8.622";
  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <Eyebrow>Facturen</Eyebrow>
          <h1 className="mt-4 text-[36px] leading-none" style={{ color: C.ink, ...display }}>
            Facturen
          </h1>
        </div>
        <PrimaryButton>
          <Plus size={14} aria-hidden="true" /> Nieuwe factuur
        </PrimaryButton>
      </div>

      <section className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {[
          { l: "Betaald (mnd)", v: totaalBetaald, sub: "3 voldaan", accent: false },
          { l: "Openstaand", v: "€ 1.350", sub: "1 factuur · 9 dagen", accent: true },
          { l: "Concept", v: "€ 880", sub: "klaar om te versturen", accent: false },
        ].map((s) => (
          <Panel key={s.l} className="p-7">
            <div className="flex items-center justify-between">
              <p
                className="text-[10.5px] font-semibold uppercase tracking-[0.1em]"
                style={{ color: C.inkMute, ...bodyFont }}
              >
                {s.l}
              </p>
              {s.accent && (
                <span
                  className="inline-flex h-6 w-6 items-center justify-center rounded-full"
                  style={{ background: C.amberWash, color: C.amberInk }}
                  aria-hidden="true"
                >
                  <AlertTriangle size={13} />
                </span>
              )}
            </div>
            <p
              className="mt-3 text-[30px]"
              style={{ color: s.accent ? C.amberInk : C.ink, ...display }}
            >
              {s.v}
            </p>
            <p className="mt-1.5 text-[11.5px]" style={{ color: C.inkMute }}>
              {s.sub}
            </p>
          </Panel>
        ))}
      </section>

      <Panel>
        <div
          className="hidden grid-cols-[8rem_1fr_5rem_9rem_6rem] gap-4 px-7 pb-3.5 pt-6 sm:grid"
          style={{ borderBottom: `1px solid ${C.lineSoft}` }}
        >
          {["Nummer", "Klant", "Datum", "Status", "Bedrag"].map((h, i) => (
            <span
              key={h}
              className={`text-[9.5px] font-semibold uppercase tracking-[0.16em] ${i === 4 ? "text-right" : ""}`}
              style={{ color: C.inkMute, ...bodyFont }}
            >
              {h}
            </span>
          ))}
        </div>
        <ul>
          {FACTUREN.map((f, i) => {
            const ft = factuurMeta(f.status);
            const acc = f.status === "Openstaand";
            return (
              <li
                key={f.nr}
                className="grid grid-cols-[1fr_auto] items-center gap-3 px-7 py-5 transition-colors hover:bg-[#f6f4f0] sm:grid-cols-[8rem_1fr_5rem_9rem_6rem] sm:gap-4"
                style={{ borderTop: i === 0 ? "none" : `1px solid ${C.lineSoft}` }}
              >
                <span
                  className="order-1 text-[11.5px] font-medium"
                  style={{ color: C.inkMute, ...num }}
                >
                  {f.nr}
                </span>
                <span
                  className="order-3 min-w-0 truncate text-[14px] font-medium sm:order-2"
                  style={{ color: C.ink, ...bodyFont }}
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
                    className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10.5px] font-medium"
                    style={{
                      color: ft.ink,
                      background: ft.wash,
                      border: `1px solid ${C.hair}`,
                      ...bodyFont,
                    }}
                  >
                    {ft.Icon && <ft.Icon size={11} aria-hidden="true" />}
                    {f.status}
                  </span>
                </span>
                <span
                  className="order-2 text-right text-[14px] font-medium sm:order-5"
                  style={{ color: acc ? C.amberInk : C.ink, ...num }}
                >
                  {f.bedrag}
                </span>
              </li>
            );
          })}
        </ul>
        <div
          className="flex items-baseline justify-between px-7 py-5"
          style={{ borderTop: `1px solid ${C.lineSoft}` }}
        >
          <span
            className="flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.18em]"
            style={{ color: C.inkMute, ...bodyFont }}
          >
            <Check size={12} aria-hidden="true" style={{ color: C.sageInk }} /> Totaal betaald
          </span>
          <span className="text-[22px]" style={{ color: C.ink, ...display }}>
            {totaalBetaald}
          </span>
        </div>
      </Panel>
    </div>
  );
}
