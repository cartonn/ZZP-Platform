"use client";

// Concept 454 — "Chroma" · Wide-gamut kleurveld (P3 / OKLCH-trend 2026).
// Kleur is het primaire informatiekanaal. Verzadigde, moderne verlopen in oklch() coderen
// betekenis: match-score, urgentie en status krijgen elk een eigen levendige tint-familie
// (chartreuse-teal voor sterke match, amber voor aandacht, magenta-rose voor urgent, iris voor
// info). Witte/lichte basis, grote kleurvlakken met scherpe leesbaarheid — kleur als data, nooit
// als decoratie. Modern, energiek, premium. Animaties respecteren prefers-reduced-motion. Status
// wordt nooit alleen op kleur gecommuniceerd: altijd label + icoon.

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
  Sparkles,
  TrendingUp,
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

// — Palet: lichte, koele basis met verzadigde wide-gamut accenten (oklch waar de betekenis telt) —
const C = {
  // basis
  bg: "#f7f8fc",
  bgDeep: "#eef0f8",
  panel: "#ffffff",
  panelSoft: "#fbfcff",
  raise: "#f3f5fb",
  hover: "#eef1fb",
  line: "#e6e8f2",
  lineSoft: "#eef0f7",
  // inkt
  ink: "#141726",
  inkSoft: "#3f4457",
  inkMute: "#6b7188",
  inkFaint: "#9aa0b4",
  // wide-gamut tint-families (fallback hex → oklch in gradients hieronder)
  // teal/chartreuse — sterke match / positief
  teal: "oklch(0.72 0.16 172)",
  tealInk: "oklch(0.46 0.13 172)",
  tealWash: "oklch(0.95 0.05 172)",
  tealLine: "oklch(0.86 0.09 172)",
  // iris/violet — info / neutrale nadruk
  iris: "oklch(0.62 0.2 285)",
  irisInk: "oklch(0.46 0.19 285)",
  irisWash: "oklch(0.95 0.045 285)",
  irisLine: "oklch(0.85 0.09 285)",
  // amber — aandacht / verloopt
  amber: "oklch(0.78 0.16 78)",
  amberInk: "oklch(0.52 0.14 66)",
  amberWash: "oklch(0.95 0.06 82)",
  amberLine: "oklch(0.86 0.1 80)",
  // rose/magenta — urgent / afgewezen
  rose: "oklch(0.64 0.22 12)",
  roseInk: "oklch(0.5 0.2 12)",
  roseWash: "oklch(0.95 0.045 12)",
  roseLine: "oklch(0.85 0.1 12)",
};

const display = {
  fontFamily: "'Inter', 'Segoe UI', system-ui, -apple-system, sans-serif",
  letterSpacing: "-0.02em",
};
const bodyFont = {
  fontFamily: "'Inter', 'Segoe UI', system-ui, -apple-system, sans-serif",
};
const num = {
  fontFamily: "'Inter', ui-monospace, SFMono-Regular, Menlo, monospace",
  fontVariantNumeric: "tabular-nums" as const,
};

// Lichte achtergrond met een subtiele, brede kleurgloed bovenaan — het wide-gamut veld waarin de
// data-tinten straks scherp aftekenen.
function fieldBg(): React.CSSProperties {
  return {
    backgroundColor: C.bg,
    backgroundImage:
      "radial-gradient(120% 70% at 12% -10%, oklch(0.93 0.07 285 / 0.6), transparent 55%)," +
      "radial-gradient(100% 60% at 92% -8%, oklch(0.93 0.07 172 / 0.5), transparent 55%)," +
      "radial-gradient(90% 60% at 60% 120%, oklch(0.95 0.05 78 / 0.4), transparent 60%)",
  };
}

// De centrale metafoor: score-waarde bepaalt de tint-familie. Kleur = data.
function matchFamily(match: number): {
  tone: string;
  ink: string;
  wash: string;
  line: string;
  grad: string;
  label: string;
} {
  if (match >= 90)
    return {
      tone: C.teal,
      ink: C.tealInk,
      wash: C.tealWash,
      line: C.tealLine,
      grad: "linear-gradient(135deg, oklch(0.78 0.15 168), oklch(0.7 0.17 195))",
      label: "Sterke match",
    };
  if (match >= 85)
    return {
      tone: C.iris,
      ink: C.irisInk,
      wash: C.irisWash,
      line: C.irisLine,
      grad: "linear-gradient(135deg, oklch(0.66 0.2 280), oklch(0.62 0.2 300))",
      label: "Goede match",
    };
  return {
    tone: C.amber,
    ink: C.amberInk,
    wash: C.amberWash,
    line: C.amberLine,
    grad: "linear-gradient(135deg, oklch(0.82 0.15 84), oklch(0.76 0.16 62))",
    label: "Redelijke match",
  };
}

function statusMeta(s: CredStatus): {
  label: string;
  Icon: LucideIcon;
  alarm: boolean;
  tone: string;
  ink: string;
  wash: string;
  line: string;
} {
  switch (s) {
    case "VERIFIED":
      return {
        label: "Geverifieerd",
        Icon: ShieldCheck,
        alarm: false,
        tone: C.teal,
        ink: C.tealInk,
        wash: C.tealWash,
        line: C.tealLine,
      };
    case "SUBMITTED":
      return {
        label: "In beoordeling",
        Icon: Clock,
        alarm: false,
        tone: C.iris,
        ink: C.irisInk,
        wash: C.irisWash,
        line: C.irisLine,
      };
    case "EXPIRING":
      return {
        label: "Verloopt binnenkort",
        Icon: AlertTriangle,
        alarm: true,
        tone: C.amber,
        ink: C.amberInk,
        wash: C.amberWash,
        line: C.amberLine,
      };
    case "REJECTED":
      return {
        label: "Afgewezen",
        Icon: X,
        alarm: true,
        tone: C.rose,
        ink: C.roseInk,
        wash: C.roseWash,
        line: C.roseLine,
      };
  }
}

// — Paneel: helder wit vlak met dunne lijn; 'tint' geeft een gekleurde rand + zachte gloed —
function Panel({
  children,
  className = "",
  as: Tag = "div",
  tone,
  glow = false,
}: {
  children: React.ReactNode;
  className?: string;
  as?: "div" | "section" | "li" | "article";
  tone?: string;
  glow?: boolean;
}) {
  return (
    <Tag
      className={`relative overflow-hidden rounded-[18px] ${className}`}
      style={{
        background: C.panel,
        border: `1px solid ${tone ?? C.line}`,
        boxShadow: glow
          ? `0 1px 2px rgba(20,23,38,0.04), 0 12px 32px -16px ${tone ?? "rgba(20,23,38,0.2)"}`
          : "0 1px 2px rgba(20,23,38,0.04), 0 1px 3px rgba(20,23,38,0.03)",
        color: C.ink,
      }}
    >
      {children}
    </Tag>
  );
}

function Eyebrow({ children, tone = C.iris }: { children: React.ReactNode; tone?: string }) {
  return (
    <p
      className="flex items-center gap-2 text-[10.5px] font-bold uppercase tracking-[0.2em]"
      style={{ color: tone, ...bodyFont }}
    >
      <span
        className="inline-block h-2 w-2 rounded-full"
        style={{ background: tone }}
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
  line,
  alarm = false,
}: {
  children: React.ReactNode;
  tone: string;
  ink: string;
  wash: string;
  line: string;
  alarm?: boolean;
}) {
  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold"
      style={{ color: ink, background: wash, border: `1px solid ${line}`, ...bodyFont }}
    >
      <span className="inline-block h-1.5 w-1.5 rounded-full" style={{ background: tone }} />
      {children}
      {alarm && <span className="sr-only"> (let op)</span>}
    </span>
  );
}

function PrimaryButton({
  children,
  onClick,
  className = "",
  grad = "linear-gradient(135deg, oklch(0.62 0.2 285), oklch(0.66 0.18 258))",
  ring = "#7c6bff",
}: {
  children: React.ReactNode;
  onClick?: () => void;
  className?: string;
  grad?: string;
  ring?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`group inline-flex items-center justify-center gap-2 rounded-full px-5 py-2.5 text-[13px] font-semibold text-white transition-all duration-200 hover:brightness-[1.06] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 active:translate-y-px motion-reduce:transition-none ${className}`}
      style={{
        background: grad,
        boxShadow: `0 6px 18px -8px ${ring}`,
        ["--tw-ring-color" as string]: ring,
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
      className={`inline-flex items-center justify-center gap-2 rounded-full px-4 py-2.5 text-[12.5px] font-semibold transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 motion-reduce:transition-none ${className}`}
      style={{
        color: active ? "#fff" : C.inkSoft,
        background: active ? "oklch(0.62 0.2 285)" : C.panel,
        border: `1px solid ${active ? "oklch(0.62 0.2 285)" : C.line}`,
        ["--tw-ring-color" as string]: "#7c6bff",
        ["--tw-ring-offset-color" as string]: C.bg,
        ...bodyFont,
      }}
    >
      {children}
    </button>
  );
}

// — Ring-gauge: score als kleur-arc. De tint spreekt de betekenis uit; het getal bevestigt hem. —
function ScoreRing({
  value,
  size = 128,
  stroke = 11,
  label = "match",
}: {
  value: number;
  size?: number;
  stroke?: number;
  label?: string;
}) {
  const fam = matchFamily(value);
  const r = (size - stroke) / 2;
  const circ = 2 * Math.PI * r;
  const dash = (value / 100) * circ;
  const gid = `chroma-ring-${label}-${value}`;
  return (
    <span
      className="relative inline-flex shrink-0 items-center justify-center"
      style={{ width: size, height: size }}
      aria-hidden="true"
    >
      <svg width={size} height={size} className="-rotate-90">
        <defs>
          <linearGradient id={gid} x1="0" y1="0" x2="1" y2="1">
            <stop
              offset="0%"
              stopColor={value >= 90 ? "#12c39a" : value >= 85 ? "#7c6bff" : "#f5a524"}
            />
            <stop
              offset="100%"
              stopColor={value >= 90 ? "#0ea5a5" : value >= 85 ? "#a855f7" : "#ef7d2e"}
            />
          </linearGradient>
        </defs>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={C.raise}
          strokeWidth={stroke}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={`url(#${gid})`}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={`${dash} ${circ}`}
          className="chroma-arc"
        />
      </svg>
      <span className="absolute flex flex-col items-center">
        <span className="text-[26px] font-bold leading-none" style={{ color: fam.ink, ...num }}>
          {value}
        </span>
        <span
          className="mt-1 text-[8.5px] font-bold uppercase tracking-[0.16em]"
          style={{ color: C.inkMute, ...bodyFont }}
        >
          {label}
        </span>
      </span>
    </span>
  );
}

// — Kleur-sparkline: verzadigd verloop dat de trendrichting codeert —
function ChromaLine({ data, up, id }: { data: number[]; up: boolean; id: string }) {
  const max = Math.max(...data);
  const min = Math.min(...data);
  const span = max - min || 1;
  const w = 120;
  const h = 34;
  const pts = data.map((d, i) => {
    const x = (i / (data.length - 1)) * w;
    const y = h - ((d - min) / span) * (h - 9) - 4;
    return [x, y] as const;
  });
  const line = pts.map(([x, y]) => `${x.toFixed(1)},${y.toFixed(1)}`).join(" ");
  const last = pts[pts.length - 1]!;
  const a = up ? "#12c39a" : "#f5a524";
  const b = up ? "#7c6bff" : "#ef7d2e";
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
        <linearGradient id={`chl-${id}`} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor={a} />
          <stop offset="100%" stopColor={b} />
        </linearGradient>
        <linearGradient id={`chf-${id}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={b} stopOpacity="0.22" />
          <stop offset="100%" stopColor={b} stopOpacity="0" />
        </linearGradient>
      </defs>
      <polygon points={`0,${h} ${line} ${w},${h}`} fill={`url(#chf-${id})`} />
      <polyline
        points={line}
        fill="none"
        stroke={`url(#chl-${id})`}
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx={last[0]} cy={last[1]} r="3" fill="#fff" stroke={b} strokeWidth="2" />
    </svg>
  );
}

// — Kleur-meter: gevulde balk met tint-verloop dat de score-familie draagt —
function ChromaMeter({ value, className = "" }: { value: number; className?: string }) {
  const fam = matchFamily(value);
  return (
    <span className={`hidden items-center gap-2.5 sm:flex ${className}`} aria-hidden="true">
      <span
        className="relative h-2.5 w-24 overflow-hidden rounded-full"
        style={{ background: C.raise }}
      >
        <span
          className="block h-full rounded-full"
          style={{
            width: `${value}%`,
            background: fam.grad,
            transition: "width 0.7s cubic-bezier(0.22,1,0.36,1)",
          }}
        />
      </span>
      <span className="text-[12.5px] font-bold" style={{ color: fam.ink, ...num }}>
        {value}%
      </span>
    </span>
  );
}

export function Concept454() {
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
      style={{ ...bodyFont, color: C.ink, ...fieldBg() }}
    >
      <style>{`
        @keyframes chRise { from { opacity: 0; transform: translateY(12px); } to { opacity: 1; transform: translateY(0); } }
        .ch-rise { animation: chRise 0.5s cubic-bezier(0.22, 1, 0.36, 1) both; }
        @keyframes chArc { from { stroke-dashoffset: 320; } to { stroke-dashoffset: 0; } }
        .chroma-arc { animation: chArc 1.1s cubic-bezier(0.22, 1, 0.36, 1) both; }
        @keyframes chShimmer { 0% { background-position: -160% 0; } 100% { background-position: 160% 0; } }
        .ch-shimmer { background: linear-gradient(100deg, ${C.raise} 30%, ${C.hover} 50%, ${C.raise} 70%); background-size: 220% 100%; animation: chShimmer 1.4s ease-in-out infinite; }
        @keyframes chFloat { 0%,100% { transform: translateY(0); } 50% { transform: translateY(-3px); } }
        .ch-float { animation: chFloat 5s ease-in-out infinite; }
        @media (prefers-reduced-motion: reduce) {
          .ch-rise, .chroma-arc, .ch-shimmer, .ch-float { animation: none !important; }
        }
      `}</style>

      <div className="relative mx-auto max-w-6xl px-4 pb-24 sm:px-6 md:px-8">
        <TopBar />
        <NavBar screen={screen} setScreen={setScreen} />
        <main key={screen} className="ch-rise pt-7">
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
    <header className="flex items-center justify-between gap-4 pt-8">
      <div className="flex items-center gap-3.5">
        <span
          className="ch-float relative inline-flex h-11 w-11 items-center justify-center rounded-2xl"
          style={{
            background: "linear-gradient(135deg, oklch(0.7 0.18 172), oklch(0.62 0.2 285))",
            boxShadow: "0 8px 20px -8px oklch(0.62 0.2 285)",
          }}
          aria-hidden="true"
        >
          <Sparkles size={18} color="#fff" />
        </span>
        <div>
          <p className="text-[20px] font-bold leading-none" style={{ color: C.ink, ...display }}>
            Chroma
          </p>
          <p className="mt-1.5 text-[11px] leading-none" style={{ color: C.inkMute, ...bodyFont }}>
            {PROFIEL.plaats} · kleur vertelt alles
          </p>
        </div>
      </div>
      <div className="flex items-center gap-3">
        <span
          className="hidden items-center gap-1.5 rounded-full px-3 py-1.5 text-[11px] font-semibold sm:inline-flex"
          style={{
            color: C.tealInk,
            border: `1px solid ${C.tealLine}`,
            background: C.tealWash,
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
              className="absolute -right-0.5 -top-0.5 flex h-4 w-4 items-center justify-center rounded-full text-[9px] font-bold text-white"
              style={{ background: "oklch(0.64 0.22 12)", ...num }}
              aria-hidden="true"
            >
              {ongelezen}
            </span>
          )}
        </span>
        <span className="hidden text-right sm:block">
          <span className="block text-[14px] font-semibold" style={{ color: C.ink, ...bodyFont }}>
            {PROFIEL.naam}
          </span>
          <span className="block text-[11px]" style={{ color: C.inkMute, ...bodyFont }}>
            {PROFIEL.rol}
          </span>
        </span>
        <span
          className="inline-flex h-11 w-11 items-center justify-center rounded-full text-[13px] font-bold text-white"
          style={{
            background: "linear-gradient(135deg, oklch(0.66 0.2 300), oklch(0.62 0.2 258))",
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
    <nav aria-label="Hoofdnavigatie" className="mt-7">
      <div
        className="flex items-center gap-1 overflow-x-auto rounded-full p-1.5"
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
              className="flex shrink-0 items-center gap-2 rounded-full px-4 py-2 text-[12.5px] font-semibold transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 motion-reduce:transition-none"
              style={{
                color: on ? "#fff" : C.inkMute,
                background: on
                  ? "linear-gradient(135deg, oklch(0.62 0.2 285), oklch(0.66 0.18 258))"
                  : "transparent",
                boxShadow: on ? "0 6px 16px -8px oklch(0.62 0.2 285)" : "none",
                ["--tw-ring-color" as string]: "#7c6bff",
                ["--tw-ring-offset-color" as string]: C.panel,
                ...bodyFont,
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

function Dashboard({ onOpen, onActies }: { onOpen: (id: string) => void; onActies: () => void }) {
  const primair = ACTIES[0] as (typeof ACTIES)[number];
  const verified = CREDENTIALS.filter((c) => c.status === "VERIFIED").length;
  const ratio = Math.round((verified / CREDENTIALS.length) * 100);
  return (
    <div className="space-y-7">
      <section className="grid grid-cols-1 gap-5 lg:grid-cols-[1.5fr_1fr]">
        <Panel className="p-7 md:p-9" tone={C.irisLine} glow>
          <div className="grid grid-cols-1 items-center gap-6 sm:grid-cols-[1fr_auto]">
            <div>
              <Eyebrow>Vandaag · in kleur</Eyebrow>
              <h1
                className="mt-4 text-[32px] font-bold leading-[1.05] md:text-[44px]"
                style={{ color: C.ink, ...display }}
              >
                Goedemorgen,
                <br />
                <span
                  style={{
                    background:
                      "linear-gradient(120deg, oklch(0.62 0.2 285), oklch(0.68 0.17 172))",
                    WebkitBackgroundClip: "text",
                    WebkitTextFillColor: "transparent",
                    backgroundClip: "text",
                  }}
                >
                  {PROFIEL.naam.split(" ")[0]}.
                </span>
              </h1>
              <p className="mt-3 max-w-md text-[14px] leading-relaxed" style={{ color: C.inkSoft }}>
                Elke tint is een signaal. Teal betekent geverifieerd en sterk; amber vraagt
                aandacht; magenta is urgent. Eén blik en je weet waar de dag om draait.
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
                <GhostButton onClick={() => onOpen(OPDRACHTEN[0]!.id)}>
                  Beste match openen
                </GhostButton>
              </div>
            </div>
            <ScoreRing value={ratio} size={140} label="op orde" />
          </div>
        </Panel>

        <Panel className="p-7" tone={C.amberLine} glow>
          <div className="flex items-center justify-between">
            <Eyebrow tone={C.amberInk}>Vraagt aandacht</Eyebrow>
            <span
              className="inline-flex h-8 w-8 items-center justify-center rounded-full"
              style={{ background: C.amberWash, color: C.amberInk }}
              aria-hidden="true"
            >
              <AlertTriangle size={16} />
            </span>
          </div>
          <h2
            className="mt-4 text-[20px] font-bold leading-snug"
            style={{ color: C.ink, ...display }}
          >
            {primair.titel}
          </h2>
          <p className="mt-2 text-[13.5px] leading-relaxed" style={{ color: C.inkSoft }}>
            {primair.detail}
          </p>
          <div className="mt-6">
            <PrimaryButton
              onClick={onActies}
              className="w-full"
              grad="linear-gradient(135deg, oklch(0.8 0.15 84), oklch(0.72 0.16 56))"
              ring="#f5a524"
            >
              {primair.cta}
              <ArrowRight size={14} aria-hidden="true" />
            </PrimaryButton>
          </div>
          <div className="mt-5 pt-4" style={{ borderTop: `1px solid ${C.lineSoft}` }}>
            <p className="flex items-center gap-2 text-[12px]" style={{ color: C.inkMute, ...num }}>
              <Check size={13} aria-hidden="true" style={{ color: C.tealInk }} />
              {verified}/{CREDENTIALS.length} certificaten geverifieerd · 7 open reacties
            </p>
          </div>
        </Panel>
      </section>

      <section>
        <div className="mb-4">
          <Eyebrow tone={C.tealInk}>Baan · deze maand</Eyebrow>
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {KPIS.map((k, i) => (
            <Panel key={k.label} className="p-5">
              <div className="flex items-start justify-between gap-2">
                <p
                  className="text-[10.5px] font-bold uppercase tracking-[0.1em]"
                  style={{ color: C.inkMute, ...bodyFont }}
                >
                  {k.label}
                </p>
                <span
                  className="inline-flex items-center gap-0.5 rounded-full px-1.5 py-0.5 text-[9.5px] font-bold"
                  style={{
                    color: k.up ? C.tealInk : C.amberInk,
                    background: k.up ? C.tealWash : C.amberWash,
                    ...num,
                  }}
                >
                  {k.up ? (
                    <TrendingUp size={10} aria-hidden="true" />
                  ) : (
                    <ArrowUpRight size={10} aria-hidden="true" className="rotate-90" />
                  )}
                  {k.trend.replace(/^[+-]/, "")}
                </span>
              </div>
              <p
                className="mt-3 text-[27px] font-bold leading-none"
                style={{ color: C.ink, ...num }}
              >
                {k.value}
              </p>
              <div className="mt-3">
                <ChromaLine data={k.spark} up={k.up} id={`k454-${i}`} />
              </div>
            </Panel>
          ))}
        </div>
      </section>

      <section className="grid grid-cols-1 gap-5 lg:grid-cols-[1.5fr_1fr]">
        <div>
          <div className="mb-4 flex items-baseline justify-between">
            <Eyebrow>Open opdrachten</Eyebrow>
            <button
              type="button"
              onClick={() => onOpen(OPDRACHTEN[0]!.id)}
              className="rounded text-[11px] font-bold uppercase tracking-[0.14em] transition-colors hover:brightness-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
              style={{
                color: C.irisInk,
                ["--tw-ring-color" as string]: "#7c6bff",
                ["--tw-ring-offset-color" as string]: C.bg,
                ...bodyFont,
              }}
            >
              Alle →
            </button>
          </div>
          <Panel>
            <ul>
              {OPDRACHTEN.map((o, i) => {
                const fam = matchFamily(o.match);
                return (
                  <li
                    key={o.id}
                    style={{ borderTop: i === 0 ? "none" : `1px solid ${C.lineSoft}` }}
                  >
                    <button
                      type="button"
                      onClick={() => onOpen(o.id)}
                      className="group grid w-full grid-cols-[auto_1fr_auto] items-center gap-4 px-5 py-4 text-left transition-colors hover:bg-[#f3f5fb] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset motion-reduce:transition-none"
                      style={{ ["--tw-ring-color" as string]: "#7c6bff" }}
                    >
                      <span
                        className="inline-flex h-11 w-11 items-center justify-center rounded-2xl text-[13px] font-bold text-white"
                        style={{ background: fam.grad }}
                        aria-hidden="true"
                      >
                        <span style={num}>{o.match}</span>
                      </span>
                      <span className="min-w-0">
                        <span
                          className="block truncate text-[15px] font-semibold"
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
                        <ChromaMeter value={o.match} />
                        <ChevronRight
                          size={17}
                          aria-hidden="true"
                          className="transition-transform group-hover:translate-x-0.5 motion-reduce:transition-none"
                          style={{ color: C.inkFaint }}
                        />
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          </Panel>
        </div>

        <div>
          <div className="mb-4">
            <Eyebrow tone={C.tealInk}>Certificaten</Eyebrow>
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
                      className="inline-flex h-9 w-9 items-center justify-center rounded-xl"
                      style={{ background: st.wash, color: st.ink }}
                      aria-hidden="true"
                    >
                      <st.Icon size={15} />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span
                        className="block truncate text-[12.5px] font-semibold"
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
    <div className="space-y-7">
      <div>
        <Eyebrow>Marktplaats</Eyebrow>
        <h1
          className="mt-3 text-[32px] font-bold leading-none"
          style={{ color: C.ink, ...display }}
        >
          Open opdrachten
        </h1>
        <p className="mt-2 text-[13px]" style={{ color: C.inkMute, ...num }}>
          {String(filtered.length).padStart(2, "0")} van{" "}
          {String(OPDRACHTEN.length).padStart(2, "0")} opdrachten beschikbaar
        </p>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div
          className="flex flex-1 items-center gap-2.5 rounded-full px-5 py-3"
          style={{ background: C.panel, border: `1px solid ${C.line}` }}
        >
          <Search size={16} aria-hidden="true" style={{ color: C.inkFaint }} />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Zoek op titel, plaats of opdrachtgever…"
            aria-label="Opdrachten zoeken"
            className="w-full bg-transparent text-[13px] outline-none placeholder:text-[#9aa0b4]"
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
              <Panel className="p-6">
                <div className="space-y-3">
                  <div className="ch-shimmer h-3 w-24 rounded-full" />
                  <div className="ch-shimmer h-5 w-2/3 rounded-full" />
                  <div className="ch-shimmer h-3 w-1/2 rounded-full" />
                  <div className="ch-shimmer h-2.5 w-full rounded-full" />
                </div>
              </Panel>
            </li>
          ))}
        </ul>
      ) : filtered.length === 0 ? (
        <Panel className="p-6">
          <div className="flex flex-col items-center py-14 text-center">
            <span
              className="inline-flex h-16 w-16 items-center justify-center rounded-2xl text-white"
              style={{
                background: "linear-gradient(135deg, oklch(0.62 0.2 285), oklch(0.68 0.17 172))",
              }}
              aria-hidden="true"
            >
              <Search size={26} />
            </span>
            <p className="mt-5 text-[22px] font-bold" style={{ color: C.ink, ...display }}>
              Geen kleur op het veld
            </p>
            <p className="mx-auto mt-2 max-w-xs text-[13.5px]" style={{ color: C.inkSoft }}>
              Geen opdracht bij {q ? `“${q}”` : "je zoekterm"}. Verruim je zoekterm en de tinten
              komen terug.
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
  onOpen: (id: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const fam = matchFamily(opdracht.match);
  return (
    <Panel className="p-6" tone={fam.line} glow={opdracht.match >= 90}>
      <span
        className="absolute left-0 top-0 h-full w-1.5"
        style={{ background: fam.grad }}
        aria-hidden="true"
      />
      <div className="grid grid-cols-[1fr_auto] items-start gap-4 pl-2">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span
              className="inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.1em]"
              style={{ color: C.inkMute, border: `1px solid ${C.line}`, ...num }}
            >
              № {String(index + 1).padStart(2, "0")}
            </span>
            <span className="text-[11px] font-semibold" style={{ color: C.inkFaint, ...num }}>
              {opdracht.id}
            </span>
            <Chip tone={fam.tone} ink={fam.ink} wash={fam.wash} line={fam.line}>
              {fam.label}
            </Chip>
          </div>
          <h3
            className="mt-2 text-[19px] font-bold leading-snug"
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
                className="inline-flex items-center rounded-full px-2.5 py-0.5 text-[10.5px] font-semibold"
                style={{ color: C.inkSoft, background: C.raise, ...bodyFont }}
              >
                {t}
              </span>
            ))}
          </div>
        </div>
        <div className="flex flex-col items-center gap-1.5">
          <ScoreRing value={opdracht.match} size={72} stroke={7} />
          <span className="text-[13px] font-bold" style={{ color: fam.ink, ...num }}>
            {opdracht.tarief}
          </span>
        </div>
      </div>
      <div className="mt-4 flex items-center gap-3 pl-2">
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          className="inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-[11.5px] font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
          style={{
            color: fam.ink,
            border: `1px solid ${fam.line}`,
            background: fam.wash,
            ["--tw-ring-color" as string]: "#7c6bff",
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
          <div className="ml-2 mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
            <RedenBlok
              titel="Voor jou"
              tone={C.tealInk}
              wash={C.tealWash}
              Icon={Check}
              items={opdracht.redenen.plus}
            />
            <RedenBlok
              titel="Let op"
              tone={C.amberInk}
              wash={C.amberWash}
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
  wash,
  Icon,
  items,
}: {
  titel: string;
  tone: string;
  wash: string;
  Icon: LucideIcon;
  items: string[];
}) {
  return (
    <div className="rounded-[14px] p-4" style={{ background: wash }}>
      <p
        className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.16em]"
        style={{ color: tone, ...bodyFont }}
      >
        <Icon size={12} aria-hidden="true" />
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
  const fam = matchFamily(opdracht.match);
  return (
    <div className="space-y-6">
      <button
        type="button"
        onClick={onBack}
        className="inline-flex items-center gap-2 rounded-full px-4 py-2 text-[12.5px] font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
        style={{
          color: C.inkSoft,
          border: `1px solid ${C.line}`,
          background: C.panel,
          ["--tw-ring-color" as string]: "#7c6bff",
          ["--tw-ring-offset-color" as string]: C.bg,
          ...bodyFont,
        }}
      >
        <ArrowRight size={13} aria-hidden="true" className="rotate-180" /> Terug naar marktplaats
      </button>

      <Panel className="p-7 md:p-9" tone={fam.line} glow>
        <span
          className="absolute inset-x-0 top-0 h-1.5"
          style={{ background: fam.grad }}
          aria-hidden="true"
        />
        <div className="grid grid-cols-1 items-center gap-6 sm:grid-cols-[1fr_auto]">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span
                className="inline-flex items-center rounded-full px-2.5 py-0.5 text-[10.5px] font-semibold"
                style={{ color: C.inkMute, border: `1px solid ${C.line}`, ...num }}
              >
                {opdracht.id}
              </span>
              <Chip tone={fam.tone} ink={fam.ink} wash={fam.wash} line={fam.line}>
                {fam.label} · {opdracht.match}%
              </Chip>
            </div>
            <h1
              className="mt-4 max-w-2xl text-[30px] font-bold leading-[1.08] md:text-[42px]"
              style={{ color: C.ink, ...display }}
            >
              {opdracht.titel}
            </h1>
            <p className="mt-2 text-[14px]" style={{ color: C.inkSoft }}>
              {opdracht.opdrachtgever} · {opdracht.plaats}
            </p>
            <div className="mt-6 flex flex-wrap gap-2.5">
              <PrimaryButton grad={fam.grad} ring="#0ea5a5">
                Reageer op opdracht <ArrowRight size={14} aria-hidden="true" />
              </PrimaryButton>
              <GhostButton>Bewaren</GhostButton>
            </div>
          </div>
          <ScoreRing value={opdracht.match} size={132} />
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
                className="text-[9.5px] font-bold uppercase tracking-[0.16em]"
                style={{ color: C.inkMute, ...bodyFont }}
              >
                {m.l}
              </p>
              <p className="mt-1.5 text-[18px] font-bold" style={{ color: C.ink, ...num }}>
                {m.v}
              </p>
            </div>
          ))}
        </div>
      </Panel>

      <section>
        <Eyebrow>Verklaarbare matching</Eyebrow>
        <p className="mt-3 max-w-xl text-[13.5px] leading-relaxed" style={{ color: C.inkSoft }}>
          Afgelezen van je geverifieerde profiel — de kleur codeert het gewicht: teal telt mee vóór
          je, amber vraagt aandacht. Transparant, zonder verborgen score.
        </p>
        <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-2">
          <Panel className="p-6" tone={C.tealLine}>
            <div className="flex items-center gap-2">
              <span
                className="inline-flex h-8 w-8 items-center justify-center rounded-xl"
                style={{ color: C.tealInk, background: C.tealWash }}
                aria-hidden="true"
              >
                <Check size={15} />
              </span>
              <p
                className="text-[11px] font-bold uppercase tracking-[0.14em]"
                style={{ color: C.tealInk, ...bodyFont }}
              >
                Voor jou
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
                    style={{ color: C.tealInk }}
                  />
                  {r}
                </li>
              ))}
            </ul>
          </Panel>
          <Panel className="p-6" tone={C.amberLine}>
            <div className="flex items-center gap-2">
              <span
                className="inline-flex h-8 w-8 items-center justify-center rounded-xl"
                style={{ color: C.amberInk, background: C.amberWash }}
                aria-hidden="true"
              >
                <AlertTriangle size={14} />
              </span>
              <p
                className="text-[11px] font-bold uppercase tracking-[0.14em]"
                style={{ color: C.amberInk, ...bodyFont }}
              >
                Let op
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
                    style={{ color: C.amberInk }}
                  />
                  {r}
                </li>
              ))}
            </ul>
          </Panel>
        </div>
        <div className="mt-4">
          <span className="text-[12px] font-semibold" style={{ color: fam.ink, ...bodyFont }}>
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
    <div className="space-y-6">
      <Panel className="p-7 md:p-9" tone={C.tealLine} glow>
        <div className="flex flex-wrap items-center justify-between gap-6">
          <div className="max-w-md">
            <Eyebrow tone={C.tealInk}>Verificatie · veilig bewaard</Eyebrow>
            <h1
              className="mt-3 text-[28px] font-bold leading-tight"
              style={{ color: C.ink, ...display }}
            >
              Jouw certificaten
            </h1>
            <p className="mt-3 text-[13.5px] leading-relaxed" style={{ color: C.inkSoft }}>
              <span className="font-semibold" style={{ color: C.tealInk }}>
                {PROFIEL.trust}.
              </span>{" "}
              {verified} van {CREDENTIALS.length} certificaten zijn geverifieerd. Eén verloopt
              binnenkort — amber — en vraagt om vernieuwing. Documenten blijven versleuteld en
              privé.
            </p>
            <div className="mt-4 max-w-xs">
              <ChromaMeter value={ratio} />
            </div>
          </div>
          <ScoreRing value={ratio} size={108} label="op orde" />
        </div>
      </Panel>

      <Panel>
        <div
          className="hidden grid-cols-[1fr_12rem_2.5rem] items-center gap-4 px-6 py-3.5 sm:grid"
          style={{ borderBottom: `1px solid ${C.lineSoft}` }}
        >
          {["Certificaat", "Status", ""].map((h, i) => (
            <span
              key={h || i}
              className="text-[9.5px] font-bold uppercase tracking-[0.18em]"
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
                  className="grid w-full grid-cols-[1fr_auto] items-center gap-4 px-6 py-4 text-left transition-colors hover:bg-[#f3f5fb] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset motion-reduce:transition-none sm:grid-cols-[1fr_12rem_2.5rem]"
                  style={{ ["--tw-ring-color" as string]: "#7c6bff" }}
                >
                  <span className="flex min-w-0 items-center gap-3">
                    <span
                      className="inline-flex h-10 w-10 items-center justify-center rounded-xl"
                      style={{ background: st.wash, color: st.ink }}
                      aria-hidden="true"
                    >
                      <st.Icon size={16} />
                    </span>
                    <span className="min-w-0">
                      <span
                        className="block truncate text-[15px] font-semibold"
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
                    <Chip
                      tone={st.tone}
                      ink={st.ink}
                      wash={st.wash}
                      line={st.line}
                      alarm={st.alarm}
                    >
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
                      <div className="rounded-[14px] p-4" style={{ background: st.wash }}>
                        <p
                          className="max-w-xl text-[13px] leading-relaxed"
                          style={{ color: C.inkSoft }}
                        >
                          {c.detail}. Documenten worden versleuteld bewaard en alleen na je
                          expliciete toestemming gedeeld met een opdrachtgever.
                        </p>
                        <div className="mt-3 flex flex-wrap gap-2">
                          <PrimaryButton
                            grad={
                              c.status === "EXPIRING"
                                ? "linear-gradient(135deg, oklch(0.8 0.15 84), oklch(0.72 0.16 56))"
                                : undefined
                            }
                            ring={c.status === "EXPIRING" ? "#f5a524" : "#7c6bff"}
                          >
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
          <Eyebrow>Documentenkast</Eyebrow>
        </div>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {DOCUMENTEN.map((d) => {
            const st = statusMeta(d.status);
            return (
              <Panel key={d.naam} className="flex items-center gap-3 p-4">
                <span
                  className="inline-flex h-10 w-10 items-center justify-center rounded-xl"
                  style={{ background: C.raise, color: C.inkSoft }}
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
                  className="inline-flex items-center gap-1 rounded-full px-2 py-1 text-[10px] font-semibold"
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
    <div className="space-y-6">
      <div>
        <Eyebrow tone={C.roseInk}>Acties · op volgorde van urgentie</Eyebrow>
        <h1
          className="mt-3 text-[32px] font-bold leading-none"
          style={{ color: C.ink, ...display }}
        >
          Wat nu aandacht vraagt
        </h1>
        <p className="mt-2 max-w-md text-[13.5px]" style={{ color: C.inkSoft }}>
          De tint codeert de urgentie: amber vraagt aandacht, iris is aanbevolen. Van boven naar
          beneden blijf je verifieerbaar en betaald.
        </p>
      </div>

      <ol className="space-y-3">
        {ACTIES.map((a, i) => {
          const warn = a.urgentie === "warning";
          const ink = warn ? C.amberInk : C.irisInk;
          const wash = warn ? C.amberWash : C.irisWash;
          const line = warn ? C.amberLine : C.irisLine;
          const grad = warn
            ? "linear-gradient(135deg, oklch(0.8 0.15 84), oklch(0.72 0.16 56))"
            : "linear-gradient(135deg, oklch(0.62 0.2 285), oklch(0.66 0.18 258))";
          return (
            <li key={a.titel}>
              <Panel className="p-6" tone={line} glow={i === 0}>
                <span
                  className="absolute left-0 top-0 h-full w-1.5"
                  style={{ background: grad }}
                  aria-hidden="true"
                />
                <div className="grid grid-cols-[auto_1fr] items-start gap-4 pl-2 sm:grid-cols-[auto_1fr_auto]">
                  <span
                    className="flex h-11 w-11 items-center justify-center rounded-2xl text-[15px] font-bold text-white"
                    style={{ background: grad, ...num }}
                    aria-hidden="true"
                  >
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <div className="min-w-0">
                    <span
                      className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[9.5px] font-bold uppercase tracking-[0.12em]"
                      style={{ color: ink, background: wash, ...bodyFont }}
                    >
                      {warn ? (
                        <AlertTriangle size={10} aria-hidden="true" />
                      ) : (
                        <Sparkles size={10} aria-hidden="true" />
                      )}
                      {warn ? "Urgent" : "Aanbevolen"}
                    </span>
                    <h2
                      className="mt-2 text-[19px] font-bold leading-snug"
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
                  <div className="col-span-2 mt-1 pl-2 sm:col-span-1 sm:mt-0 sm:self-center sm:pl-0">
                    <PrimaryButton grad={grad} ring={warn ? "#f5a524" : "#7c6bff"}>
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
  line: string;
  Icon: LucideIcon | null;
} {
  if (status === "Openstaand")
    return {
      ink: C.amberInk,
      wash: C.amberWash,
      tone: C.amber,
      line: C.amberLine,
      Icon: AlertTriangle,
    };
  if (status === "Betaald")
    return { ink: C.tealInk, wash: C.tealWash, tone: C.teal, line: C.tealLine, Icon: Check };
  return { ink: C.inkMute, wash: C.raise, tone: C.line, line: C.line, Icon: FileText };
}

function Facturen() {
  const totaalBetaald = "€ 8.622";
  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <Eyebrow tone={C.tealInk}>Facturen</Eyebrow>
          <h1
            className="mt-3 text-[32px] font-bold leading-none"
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
          {
            l: "Betaald (mnd)",
            v: totaalBetaald,
            sub: "3 voldaan",
            tone: C.tealLine,
            grad: false as const,
            ink: C.tealInk,
          },
          {
            l: "Openstaand",
            v: "€ 1.350",
            sub: "1 factuur · 9 dagen",
            tone: C.amberLine,
            grad: true as const,
            ink: C.amberInk,
          },
          {
            l: "Concept",
            v: "€ 880",
            sub: "klaar om te versturen",
            tone: C.line,
            grad: false as const,
            ink: C.ink,
          },
        ].map((s) => (
          <Panel key={s.l} className="p-6" tone={s.tone} glow={s.grad}>
            <div className="flex items-center justify-between">
              <p
                className="text-[10.5px] font-bold uppercase tracking-[0.1em]"
                style={{ color: C.inkMute, ...bodyFont }}
              >
                {s.l}
              </p>
              {s.grad && (
                <span
                  className="inline-flex h-6 w-6 items-center justify-center rounded-full"
                  style={{ background: C.amberWash, color: C.amberInk }}
                  aria-hidden="true"
                >
                  <AlertTriangle size={13} />
                </span>
              )}
            </div>
            <p className="mt-2 text-[27px] font-bold" style={{ color: s.ink, ...num }}>
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
          {["Nummer", "Klant", "Datum", "Status", "Bedrag"].map((h, i) => (
            <span
              key={h}
              className={`text-[9.5px] font-bold uppercase tracking-[0.16em] ${i === 4 ? "text-right" : ""}`}
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
                className="grid grid-cols-[1fr_auto] items-center gap-3 px-6 py-4 transition-colors hover:bg-[#f3f5fb] sm:grid-cols-[8rem_1fr_5rem_9rem_6rem] sm:gap-4"
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
                    className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10.5px] font-semibold"
                    style={{
                      color: ft.ink,
                      background: ft.wash,
                      border: `1px solid ${ft.line}`,
                      ...bodyFont,
                    }}
                  >
                    {ft.Icon && <ft.Icon size={11} aria-hidden="true" />}
                    {f.status}
                  </span>
                </span>
                <span
                  className="order-2 text-right text-[14px] font-bold sm:order-5"
                  style={{ color: acc ? C.amberInk : C.ink, ...num }}
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
            className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.18em]"
            style={{ color: C.inkMute, ...bodyFont }}
          >
            <Check size={12} aria-hidden="true" style={{ color: C.tealInk }} /> Totaal betaald
          </span>
          <span className="text-[20px] font-bold" style={{ color: C.tealInk, ...num }}>
            {totaalBetaald}
          </span>
        </div>
      </Panel>
    </div>
  );
}
