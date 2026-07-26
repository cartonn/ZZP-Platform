"use client";

// Concept 476 — "Zwerm" · Organische particle-flow / murmuration (zwermgedrag). Achtergrond en
// accenten suggereren een spreeuwenwolk: veel kleine, zacht bewegende knopen die matching als
// "aantrekking" verbeelden. Rustig maar levend; kaarten zweven licht. Nachtblauw/inkt met zachte
// witte/turquoise stippen. Motion via CSS-keyframes met staggered delays; respecteert reduced-motion.

import { useMemo, useState } from "react";
import {
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  ArrowUpDown,
  Bell,
  Check,
  ChevronRight,
  Clock,
  FileText,
  Sparkles,
  Search,
  ShieldCheck,
  TrendingDown,
  TrendingUp,
  Waypoints,
  Wind,
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

// — Palet: nachtblauw/inkt met zachte witte/turquoise stippen —
const C = {
  bg: "#0b1220", // diep nachtblauw
  bgAlt: "#0f1830",
  panel: "#111c34", // kaart-oppervlak
  panelAlt: "#16233f",
  panelHi: "#1c2b4a",
  fg: "#e2e8f0", // zacht wit
  fgSoft: "#b3c0d6",
  fgMute: "#7d8aa5",
  fgFaint: "#5b6883",
  line: "#22304d",
  lineSoft: "#1a2745",
  teal: "#2dd4bf", // primair accent (turquoise)
  tealDim: "#1d9c8c",
  sky: "#38bdf8",
  indigo: "#818cf8",
  green: "#34d399",
  amber: "#fbbf24",
  rose: "#fb7185",
};

const bodyFont = {
  fontFamily: "'Inter', 'Segoe UI', system-ui, -apple-system, sans-serif",
};
const num = {
  fontFamily: "ui-monospace, 'SFMono-Regular', 'Menlo', 'Consolas', monospace",
  fontVariantNumeric: "tabular-nums" as const,
};

function hexA(hex: string, a: number): string {
  const h = hex.replace("#", "");
  const r = parseInt(h.slice(0, 2), 16);
  const g = parseInt(h.slice(2, 4), 16);
  const b = parseInt(h.slice(4, 6), 16);
  return `rgba(${r},${g},${b},${a})`;
}

function canvasBg(): React.CSSProperties {
  return {
    backgroundColor: C.bg,
    backgroundImage: [
      "radial-gradient(70% 50% at 15% 0%, rgba(45,212,191,0.10) 0%, rgba(45,212,191,0) 55%)",
      "radial-gradient(60% 45% at 95% 10%, rgba(56,189,248,0.08) 0%, rgba(56,189,248,0) 55%)",
      "radial-gradient(80% 60% at 50% 110%, rgba(129,140,248,0.06) 0%, rgba(129,140,248,0) 50%)",
    ].join(","),
  };
}

function statusMeta(s: CredStatus): {
  label: string;
  Icon: LucideIcon;
  alarm: boolean;
  ink: string;
} {
  switch (s) {
    case "VERIFIED":
      return { label: "Geverifieerd", Icon: ShieldCheck, alarm: false, ink: C.teal };
    case "SUBMITTED":
      return { label: "In beoordeling", Icon: Clock, alarm: false, ink: C.sky };
    case "EXPIRING":
      return { label: "Verloopt binnenkort", Icon: AlertTriangle, alarm: true, ink: C.amber };
    case "REJECTED":
      return { label: "Afgewezen", Icon: AlertTriangle, alarm: true, ink: C.rose };
  }
}

// Deterministische zwerm-knopen (geen Math.random → stabiel bij SSR/hydration).
type Node = {
  x: number;
  y: number;
  r: number;
  dur: number;
  delay: number;
  tone: string;
  drift: number;
};
function makeNodes(count: number): Node[] {
  const tones = [C.teal, C.sky, "#ffffff", C.indigo];
  const nodes: Node[] = [];
  for (let i = 0; i < count; i++) {
    const a = i * 2.399963; // gulden hoek voor gelijkmatige spreiding
    const x = (Math.sin(a) * 0.5 + 0.5) * 100;
    const y = (Math.cos(a * 1.13) * 0.5 + 0.5) * 100;
    nodes.push({
      x,
      y,
      r: 1 + (i % 4) * 0.7,
      dur: 7 + (i % 6) * 1.6,
      delay: (i % 9) * 0.5,
      tone: tones[i % tones.length] ?? C.teal,
      drift: 6 + (i % 5) * 4,
    });
  }
  return nodes;
}

// — Zwerm-achtergrond: veel zacht driftende stippen (murmuration) —
function SwarmField({ count = 42, opacity = 0.5 }: { count?: number; opacity?: number }) {
  const nodes = useMemo(() => makeNodes(count), [count]);
  return (
    <div
      className="pointer-events-none absolute inset-0 overflow-hidden"
      aria-hidden="true"
      style={{ opacity }}
    >
      {nodes.map((n, i) => (
        <span
          key={i}
          className="zw-node absolute rounded-full motion-reduce:!animate-none"
          style={{
            left: `${n.x}%`,
            top: `${n.y}%`,
            width: `${n.r * 2}px`,
            height: `${n.r * 2}px`,
            background: n.tone,
            boxShadow: `0 0 ${n.r * 4}px ${hexA(n.tone === "#ffffff" ? C.teal : n.tone, 0.6)}`,
            animationDuration: `${n.dur}s`,
            animationDelay: `${n.delay}s`,
            ["--zw-drift" as string]: `${n.drift}px`,
          }}
        />
      ))}
    </div>
  );
}

// — Kleine "aantrekking"-viz: knopen die naar een centrale match-kern zweven —
function AttractionViz({ score, tone }: { score: number; tone: string }) {
  const dots = useMemo(() => {
    const arr: { x: number; y: number; d: number }[] = [];
    for (let i = 0; i < 14; i++) {
      const a = i * 2.399963;
      arr.push({ x: 50 + Math.cos(a) * 34, y: 50 + Math.sin(a) * 34, d: (i % 7) * 0.35 });
    }
    return arr;
  }, []);
  return (
    <div
      className="relative h-24 w-full overflow-hidden rounded-xl"
      style={{ background: C.bgAlt, border: `1px solid ${C.line}` }}
      aria-hidden="true"
    >
      {dots.map((d, i) => (
        <span
          key={i}
          className="zw-attract absolute h-1.5 w-1.5 rounded-full motion-reduce:!animate-none"
          style={{
            left: `${d.x}%`,
            top: `${d.y}%`,
            background: tone,
            boxShadow: `0 0 6px ${hexA(tone, 0.7)}`,
            animationDelay: `${d.d}s`,
          }}
        />
      ))}
      <span
        className="absolute left-1/2 top-1/2 flex -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full text-[13px] font-bold"
        style={{
          width: 40,
          height: 40,
          background: hexA(tone, 0.16),
          border: `1px solid ${hexA(tone, 0.6)}`,
          color: tone,
          ...num,
        }}
      >
        {score}
      </span>
    </div>
  );
}

// — Zwevend paneel —
function Panel({
  children,
  className = "",
  as: Tag = "div",
  interactive = false,
  glow,
}: {
  children: React.ReactNode;
  className?: string;
  as?: "div" | "section" | "article" | "li";
  interactive?: boolean;
  glow?: string;
}) {
  return (
    <Tag
      className={`zw-float relative overflow-hidden rounded-2xl motion-reduce:animate-none ${interactive ? "zw-int" : ""} ${className}`}
      style={{
        background: `linear-gradient(180deg, ${C.panelAlt} 0%, ${C.panel} 100%)`,
        border: `1px solid ${C.line}`,
        boxShadow: glow
          ? `0 0 0 1px ${hexA(glow, 0.14)}, 0 20px 44px -26px rgba(0,0,0,0.85)`
          : "0 20px 44px -28px rgba(0,0,0,0.85)",
        color: C.fg,
      }}
    >
      {children}
    </Tag>
  );
}

function Label({ children, tone = C.teal }: { children: React.ReactNode; tone?: string }) {
  return (
    <p
      className="flex items-center gap-2 text-[10.5px] font-bold uppercase tracking-[0.22em]"
      style={{ color: tone, ...bodyFont }}
    >
      <Waypoints size={12} aria-hidden="true" />
      {children}
    </p>
  );
}

function Btn({
  children,
  onClick,
  tone = C.teal,
  variant = "solid",
  className = "",
  ariaPressed,
}: {
  children: React.ReactNode;
  onClick?: () => void;
  tone?: string;
  variant?: "solid" | "ghost";
  className?: string;
  ariaPressed?: boolean;
}) {
  const solid = variant === "solid";
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={ariaPressed}
      className={`group inline-flex items-center justify-center gap-2 rounded-full px-4 py-2.5 text-[12.5px] font-bold transition-all duration-150 hover:brightness-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 active:translate-y-px motion-reduce:transition-none ${className}`}
      style={{
        color: solid ? C.bg : tone,
        background: solid ? tone : hexA(tone, 0.1),
        border: `1px solid ${solid ? tone : hexA(tone, 0.45)}`,
        boxShadow: solid ? `0 6px 18px -6px ${hexA(tone, 0.7)}` : "none",
        ...bodyFont,
        ["--tw-ring-color" as string]: tone,
        ["--tw-ring-offset-color" as string]: C.bg,
      }}
    >
      {children}
    </button>
  );
}

// Sparkline als zwevende puntjes-baan.
function DotSpark({ data, tone }: { data: number[]; tone: string }) {
  const max = Math.max(...data);
  const min = Math.min(...data);
  const span = max - min || 1;
  return (
    <div className="relative flex h-10 items-end justify-between" aria-hidden="true">
      {data.map((d, i) => {
        const h = 14 + ((d - min) / span) * 72;
        const last = i === data.length - 1;
        return (
          <span key={i} className="relative flex h-full flex-1 items-end justify-center">
            <span
              className="absolute bottom-0 w-px"
              style={{ height: `${h}%`, background: hexA(tone, 0.22) }}
            />
            <span
              className="relative rounded-full"
              style={{
                width: last ? 7 : 5,
                height: last ? 7 : 5,
                marginBottom: `calc(${h}% - ${last ? 3.5 : 2.5}px)`,
                background: tone,
                boxShadow: last ? `0 0 8px ${hexA(tone, 0.9)}` : "none",
              }}
            />
          </span>
        );
      })}
    </div>
  );
}

function Meter({ value, tone = C.teal }: { value: number; tone?: string }) {
  return (
    <span className="flex items-center gap-2">
      <span
        className="relative h-2 w-28 overflow-hidden rounded-full"
        style={{ background: C.bgAlt }}
        aria-hidden="true"
      >
        <span
          className="block h-full rounded-full"
          style={{
            width: `${value}%`,
            background: tone,
            boxShadow: `0 0 8px ${hexA(tone, 0.7)}`,
            transition: "width 0.7s cubic-bezier(0.22,1,0.36,1)",
          }}
        />
      </span>
      <span className="text-[12px] font-bold" style={{ color: tone, ...num }}>
        {value}%
      </span>
    </span>
  );
}

function StatusChip({ status, small = false }: { status: CredStatus; small?: boolean }) {
  const st = statusMeta(status);
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full font-bold ${small ? "px-2 py-0.5 text-[9.5px]" : "px-2.5 py-1 text-[10.5px]"}`}
      style={{
        color: st.ink,
        background: hexA(st.ink, 0.12),
        border: `1px solid ${hexA(st.ink, 0.5)}`,
        ...bodyFont,
      }}
    >
      <st.Icon size={small ? 10 : 11} aria-hidden="true" />
      {st.label}
      {st.alarm && <span className="sr-only"> (let op)</span>}
    </span>
  );
}

export function Concept476() {
  const [screen, setScreen] = useState<ScreenKey>("dashboard");
  const active = OPDRACHTEN[0] as Opdracht;

  return (
    <div
      className="relative min-h-[720px] w-full overflow-hidden antialiased"
      style={{ ...bodyFont, color: C.fg, ...canvasBg() }}
    >
      <style>{`
        @keyframes zwNode {
          0% { transform: translate(0, 0); opacity: 0.4; }
          33% { transform: translate(var(--zw-drift), calc(var(--zw-drift) * -0.6)); opacity: 0.9; }
          66% { transform: translate(calc(var(--zw-drift) * -0.5), calc(var(--zw-drift) * 0.5)); opacity: 0.6; }
          100% { transform: translate(0, 0); opacity: 0.4; }
        }
        .zw-node { animation-name: zwNode; animation-timing-function: ease-in-out; animation-iteration-count: infinite; will-change: transform, opacity; }
        @keyframes zwFloat { 0% { transform: translateY(0); } 50% { transform: translateY(-4px); } 100% { transform: translateY(0); } }
        .zw-float { animation: zwFloat 9s ease-in-out infinite; }
        @keyframes zwAttract { 0% { transform: scale(0.8); opacity: 0.3; } 50% { transform: scale(1.25); opacity: 1; } 100% { transform: scale(0.8); opacity: 0.3; } }
        .zw-attract { animation: zwAttract 4.5s ease-in-out infinite; will-change: transform, opacity; }
        @keyframes zwIn { from { opacity: 0; transform: translateY(12px); } to { opacity: 1; transform: translateY(0); } }
        .zw-in { animation: zwIn 0.44s cubic-bezier(0.22, 1, 0.36, 1) both; }
        .zw-int { transition: transform 0.3s cubic-bezier(0.22,1,0.36,1), box-shadow 0.3s, border-color 0.3s; }
        .zw-int:hover { transform: translateY(-4px); border-color: ${C.teal}; box-shadow: 0 0 0 1px ${hexA(C.teal, 0.25)}, 0 28px 52px -24px rgba(0,0,0,0.9); }
        @media (prefers-reduced-motion: reduce) {
          .zw-node, .zw-float, .zw-attract, .zw-in { animation: none !important; }
          .zw-int { transition: none !important; }
          .zw-int:hover { transform: none !important; }
        }
      `}</style>

      <SwarmField count={46} opacity={0.55} />

      <div className="relative z-10 mx-auto max-w-6xl px-4 pb-24 sm:px-6 md:px-8">
        <TopBar />
        <NavBar screen={screen} setScreen={setScreen} />
        <main key={screen} className="zw-in pt-6">
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
    <header className="flex items-center justify-between gap-4 py-5">
      <div className="flex items-center gap-3.5">
        <span
          className="inline-flex h-11 w-11 items-center justify-center rounded-2xl"
          style={{
            background: `linear-gradient(135deg, ${C.teal} 0%, ${C.sky} 60%, ${C.indigo} 100%)`,
            color: C.bg,
            boxShadow: `0 6px 18px -6px ${hexA(C.teal, 0.8)}`,
          }}
          aria-hidden="true"
        >
          <Waypoints size={20} strokeWidth={2.2} />
        </span>
        <div>
          <p className="text-[19px] font-bold leading-none tracking-tight" style={{ color: C.fg }}>
            Zwerm
          </p>
          <p className="mt-1.5 text-[11px] leading-none" style={{ color: C.fgMute }}>
            Samen in beweging · {PROFIEL.plaats}
          </p>
        </div>
      </div>
      <div className="flex items-center gap-3">
        <span
          className="hidden items-center gap-1.5 rounded-full px-3 py-1.5 text-[11px] font-bold sm:inline-flex"
          style={{
            color: C.teal,
            background: hexA(C.teal, 0.12),
            border: `1px solid ${hexA(C.teal, 0.5)}`,
            ...bodyFont,
          }}
        >
          <ShieldCheck size={12} aria-hidden="true" />
          {PROFIEL.trust}
        </span>
        <span
          className="relative inline-flex h-9 w-9 items-center justify-center rounded-full"
          style={{ background: C.panel, border: `1px solid ${C.line}`, color: C.fgMute }}
          aria-label={`${ongelezen} ongelezen berichten`}
        >
          <Bell size={15} aria-hidden="true" />
          {ongelezen > 0 && (
            <span
              className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full text-[9px] font-bold"
              style={{ background: C.rose, color: C.bg, ...num }}
              aria-hidden="true"
            >
              {ongelezen}
            </span>
          )}
        </span>
        <span className="hidden text-right sm:block">
          <span className="block text-[13.5px] font-bold" style={{ color: C.fg }}>
            {PROFIEL.naam}
          </span>
          <span className="block text-[11px]" style={{ color: C.fgMute }}>
            {PROFIEL.rol}
          </span>
        </span>
        <span
          className="inline-flex h-10 w-10 items-center justify-center rounded-full text-[12.5px] font-bold"
          style={{
            background: hexA(C.teal, 0.16),
            border: `1px solid ${hexA(C.teal, 0.5)}`,
            color: C.teal,
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
    <nav aria-label="Hoofdnavigatie" className="mt-1">
      <div
        className="flex items-stretch gap-1 overflow-x-auto rounded-full p-1.5"
        style={{ background: C.bgAlt, border: `1px solid ${C.line}` }}
      >
        {SCREENS.map((s) => {
          const on = s.key === screen;
          return (
            <button
              key={s.key}
              type="button"
              onClick={() => setScreen(s.key)}
              aria-current={on ? "page" : undefined}
              className="group relative shrink-0 rounded-full px-4 py-2 text-[12.5px] font-bold transition-all focus-visible:outline-none focus-visible:ring-2 motion-reduce:transition-none"
              style={{
                color: on ? C.bg : C.fgSoft,
                background: on ? C.teal : "transparent",
                boxShadow: on ? `0 4px 14px -4px ${hexA(C.teal, 0.8)}` : "none",
                ...bodyFont,
                ["--tw-ring-color" as string]: C.teal,
              }}
            >
              <span className="flex items-center gap-2">
                <span
                  className="inline-block h-2 w-2 rounded-full"
                  style={{ background: on ? C.bg : C.teal }}
                  aria-hidden="true"
                />
                {s.label}
              </span>
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
    <div className="space-y-5 pt-6">
      <section className="grid grid-cols-1 gap-5 lg:grid-cols-[1.5fr_1fr]">
        <Panel className="zw-int p-7 md:p-8" glow={C.teal}>
          <SwarmField count={20} opacity={0.35} />
          <div className="relative">
            <Label tone={C.teal}>De zwerm beweegt met je mee</Label>
            <h1
              className="mt-4 text-[30px] font-bold leading-[1.08] tracking-[-0.01em] md:text-[40px]"
              style={{ color: C.fg }}
            >
              Alles stroomt jouw kant op, {PROFIEL.naam.split(" ")[0]}.
            </h1>
            <p className="mt-3 max-w-md text-[13.5px] leading-relaxed" style={{ color: C.fgSoft }}>
              Verse matches trekken naar je toe, je certificaten zijn in orde en één ding vraagt
              vandaag even je aandacht. Beweeg rustig mee.
            </p>
            <div className="mt-6 flex flex-wrap items-center gap-2.5">
              <Btn onClick={onActies} tone={C.teal}>
                Volgende actie
                <ArrowRight
                  size={14}
                  aria-hidden="true"
                  className="transition-transform group-hover:translate-x-0.5 motion-reduce:transition-none"
                />
              </Btn>
              <Btn onClick={onOpen} tone={C.sky} variant="ghost">
                Naar de marktplaats
              </Btn>
            </div>
          </div>
        </Panel>

        <Panel className="zw-int p-6" glow={C.amber}>
          <div className="flex items-center justify-between">
            <Label tone={C.amber}>Vraagt aandacht</Label>
            <span
              className="inline-flex h-8 w-8 items-center justify-center rounded-full"
              style={{
                background: hexA(C.amber, 0.14),
                border: `1px solid ${hexA(C.amber, 0.5)}`,
                color: C.amber,
              }}
              aria-hidden="true"
            >
              <AlertTriangle size={15} />
            </span>
          </div>
          <h2 className="mt-3 text-[18px] font-bold leading-snug" style={{ color: C.fg }}>
            {primair.titel}
          </h2>
          <p className="mt-2 text-[13px] leading-relaxed" style={{ color: C.fgSoft }}>
            {primair.detail}
          </p>
          <div className="mt-5">
            <Btn onClick={onActies} tone={C.amber} className="w-full">
              {primair.cta}
              <ArrowRight size={14} aria-hidden="true" />
            </Btn>
          </div>
          <p
            className="mt-5 flex items-center gap-2 border-t pt-4 text-[12px]"
            style={{ color: C.fgMute, borderColor: C.line }}
          >
            <Check size={13} aria-hidden="true" style={{ color: C.teal }} />
            {verified}/{CREDENTIALS.length} certificaten in orde · 7 open reacties
          </p>
        </Panel>
      </section>

      <section>
        <div className="mb-3">
          <Label tone={C.sky}>Jouw cijfers · deze maand</Label>
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {KPIS.map((k) => {
            const tone = k.up ? C.teal : C.rose;
            const Trend = k.up ? TrendingUp : TrendingDown;
            return (
              <Panel key={k.label} className="zw-int p-5">
                <div className="flex items-start justify-between gap-2">
                  <p
                    className="text-[10px] font-bold uppercase tracking-[0.12em]"
                    style={{ color: C.fgMute, ...bodyFont }}
                  >
                    {k.label}
                  </p>
                  <span
                    className="inline-flex items-center gap-0.5 text-[10px] font-bold"
                    style={{ color: tone, ...num }}
                  >
                    <Trend size={11} aria-hidden="true" /> {k.trend.replace(/^\+/, "")}
                  </span>
                </div>
                <p
                  className="mt-3 text-[25px] font-bold leading-none tracking-[-0.01em]"
                  style={{ color: C.fg, ...num }}
                >
                  {k.value}
                </p>
                <div className="mt-3">
                  <DotSpark data={k.spark} tone={tone} />
                </div>
              </Panel>
            );
          })}
        </div>
      </section>

      <section className="grid grid-cols-1 gap-5 lg:grid-cols-[1.5fr_1fr]">
        <div>
          <div className="mb-3 flex items-baseline justify-between">
            <Label tone={C.indigo}>Matches trekken naar je toe</Label>
            <button
              type="button"
              onClick={onOpen}
              className="rounded px-1 text-[11px] font-bold uppercase tracking-[0.14em] transition-colors hover:opacity-70 focus-visible:outline-none focus-visible:ring-2"
              style={{ color: C.indigo, ...bodyFont, ["--tw-ring-color" as string]: C.indigo }}
            >
              Alle →
            </button>
          </div>
          <ul className="space-y-3">
            {OPDRACHTEN.map((o) => {
              const strong = o.match >= 90;
              const tone = strong ? C.teal : C.sky;
              return (
                <li key={o.id}>
                  <Panel className="zw-int p-4" as="article">
                    <button
                      type="button"
                      onClick={onOpen}
                      className="group flex w-full items-center gap-4 rounded-xl text-left focus-visible:outline-none focus-visible:ring-2"
                      style={{ ["--tw-ring-color" as string]: tone }}
                    >
                      <span
                        className="inline-flex h-12 w-12 shrink-0 flex-col items-center justify-center rounded-full"
                        style={{
                          background: hexA(tone, 0.14),
                          border: `1px solid ${hexA(tone, 0.5)}`,
                        }}
                        aria-hidden="true"
                      >
                        <span
                          className="text-[15px] font-bold leading-none"
                          style={{ color: tone, ...num }}
                        >
                          {o.match}
                        </span>
                        <span
                          className="text-[7.5px] font-bold uppercase tracking-[0.1em]"
                          style={{ color: tone }}
                        >
                          match
                        </span>
                      </span>
                      <span className="min-w-0 flex-1">
                        <span
                          className="block truncate text-[14px] font-bold"
                          style={{ color: C.fg }}
                        >
                          {o.titel}
                        </span>
                        <span className="block truncate text-[11.5px]" style={{ color: C.fgMute }}>
                          {o.opdrachtgever} · {o.plaats} · {o.tarief}
                        </span>
                      </span>
                      <ChevronRight
                        size={17}
                        aria-hidden="true"
                        className="shrink-0 transition-transform group-hover:translate-x-0.5 motion-reduce:transition-none"
                        style={{ color: C.fgFaint }}
                      />
                    </button>
                  </Panel>
                </li>
              );
            })}
          </ul>
        </div>

        <div>
          <div className="mb-3">
            <Label tone={C.teal}>Jouw certificaten</Label>
          </div>
          <Panel className="p-4">
            <ul>
              {CREDENTIALS.map((c, i) => {
                const st = statusMeta(c.status);
                return (
                  <li
                    key={c.naam}
                    className="flex items-center gap-3 px-1 py-2.5"
                    style={{ borderTop: i === 0 ? "none" : `1px solid ${C.line}` }}
                  >
                    <span
                      className="inline-flex h-8 w-8 items-center justify-center rounded-full"
                      style={{
                        background: hexA(st.ink, 0.14),
                        border: `1px solid ${hexA(st.ink, 0.5)}`,
                        color: st.ink,
                      }}
                      aria-hidden="true"
                    >
                      <st.Icon size={14} />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span
                        className="block truncate text-[12.5px] font-bold"
                        style={{ color: C.fg }}
                      >
                        {c.naam}
                      </span>
                      <span className="block truncate text-[10.5px]" style={{ color: C.fgMute }}>
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
  const [failed, setFailed] = useState(false);

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
    <div className="space-y-6 pt-6">
      <div>
        <Label tone={C.sky}>Marktplaats · de wolk</Label>
        <h1
          className="mt-3 text-[28px] font-bold leading-none tracking-[-0.01em] md:text-[34px]"
          style={{ color: C.fg }}
        >
          Opdrachten voor jou
        </h1>
        <p className="mt-2 text-[13px]" style={{ color: C.fgMute }}>
          {filtered.length} van {OPDRACHTEN.length} opdrachten passen bij jouw profiel
        </p>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div
          className="flex flex-1 items-center gap-2.5 rounded-full px-4 py-3"
          style={{ background: C.panel, border: `1px solid ${C.line}` }}
        >
          <Search size={16} aria-hidden="true" style={{ color: C.fgFaint }} />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Zoek op titel, plaats of opdrachtgever…"
            aria-label="Opdrachten zoeken"
            className="w-full bg-transparent text-[13px] outline-none placeholder:text-[#5b6883]"
            style={{ color: C.fg, ...bodyFont }}
          />
        </div>
        <div
          className="flex flex-wrap items-center gap-2"
          role="group"
          aria-label="Sorteren en laden"
        >
          {(["match", "tarief"] as const).map((s) => (
            <Btn
              key={s}
              onClick={() => setSort(s)}
              tone={C.teal}
              variant={sort === s ? "solid" : "ghost"}
              ariaPressed={sort === s}
            >
              <ArrowUpDown size={12} aria-hidden="true" />
              {s === "match" ? "Beste match" : "Hoogste tarief"}
            </Btn>
          ))}
          <Btn
            onClick={() => {
              setFailed(false);
              setLoading((v) => !v);
            }}
            tone={C.indigo}
            variant={loading ? "solid" : "ghost"}
            ariaPressed={loading}
          >
            {loading ? "Stop laden" : "Verversen"}
          </Btn>
          <Btn
            onClick={() => setFailed((v) => !v)}
            tone={C.rose}
            variant={failed ? "solid" : "ghost"}
            ariaPressed={failed}
          >
            Fout tonen
          </Btn>
        </div>
      </div>

      {failed ? (
        <Panel className="p-6">
          <div className="flex flex-col items-center py-12 text-center" role="alert">
            <span
              className="inline-flex h-14 w-14 items-center justify-center rounded-full"
              style={{
                background: hexA(C.rose, 0.14),
                border: `1px solid ${hexA(C.rose, 0.5)}`,
                color: C.rose,
              }}
              aria-hidden="true"
            >
              <AlertTriangle size={24} />
            </span>
            <p className="mt-5 text-[20px] font-bold" style={{ color: C.fg }}>
              De zwerm raakte verstrooid
            </p>
            <p className="mx-auto mt-2 max-w-xs text-[13px]" style={{ color: C.fgSoft }}>
              De opdrachten konden niet worden opgehaald. Probeer de wolk opnieuw te laden.
            </p>
            <div className="mt-6">
              <Btn onClick={() => setFailed(false)} tone={C.rose}>
                Opnieuw proberen <ArrowRight size={14} aria-hidden="true" />
              </Btn>
            </div>
          </div>
        </Panel>
      ) : loading ? (
        <ul className="space-y-3" aria-hidden="true">
          {[0, 1, 2].map((i) => (
            <li key={i}>
              <Panel className="p-5">
                <div className="animate-pulse space-y-3 motion-reduce:animate-none">
                  <div className="h-3 w-24 rounded-full" style={{ background: C.panelHi }} />
                  <div className="h-5 w-2/3 rounded-full" style={{ background: C.panelHi }} />
                  <div className="h-3 w-1/2 rounded-full" style={{ background: C.panelHi }} />
                </div>
              </Panel>
            </li>
          ))}
        </ul>
      ) : filtered.length === 0 ? (
        <Panel className="p-6">
          <div className="flex flex-col items-center py-14 text-center">
            <span
              className="inline-flex h-14 w-14 items-center justify-center rounded-full"
              style={{ background: C.panelHi, border: `1px solid ${C.line}`, color: C.fgMute }}
              aria-hidden="true"
            >
              <Wind size={24} />
            </span>
            <p className="mt-5 text-[20px] font-bold" style={{ color: C.fg }}>
              Niets in de wolk gevonden
            </p>
            <p className="mx-auto mt-2 max-w-xs text-[13px]" style={{ color: C.fgSoft }}>
              Geen opdracht bij {q ? `"${q}"` : "je zoekterm"}. Probeer een ander trefwoord.
            </p>
            <div className="mt-6">
              <Btn onClick={() => setQ("")} tone={C.teal}>
                Zoekterm wissen <ArrowRight size={14} aria-hidden="true" />
              </Btn>
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
  const tone = strong ? C.teal : C.sky;
  return (
    <Panel className="zw-int p-5" as="article">
      <div className="grid grid-cols-[1fr_auto] items-start gap-4">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span
              className="inline-flex items-center rounded-full px-2 py-0.5 text-[9.5px] font-bold uppercase tracking-[0.1em]"
              style={{ color: C.fgMute, border: `1px solid ${C.line}`, ...num }}
            >
              zwerm {String(index + 1).padStart(2, "0")}
            </span>
            <span className="text-[11px] font-bold" style={{ color: C.fgFaint, ...num }}>
              {opdracht.id}
            </span>
          </div>
          <h3 className="mt-2 text-[18px] font-bold leading-snug" style={{ color: C.fg }}>
            {opdracht.titel}
          </h3>
          <p className="mt-1 text-[12.5px]" style={{ color: C.fgMute }}>
            {opdracht.opdrachtgever} · {opdracht.plaats} · {opdracht.uren}
          </p>
          <div className="mt-3 flex flex-wrap gap-1.5">
            {opdracht.tags.map((t) => (
              <span
                key={t}
                className="inline-flex items-center rounded-full px-2.5 py-0.5 text-[10.5px] font-semibold"
                style={{
                  color: C.fgSoft,
                  background: C.bgAlt,
                  border: `1px solid ${C.line}`,
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
            className="inline-flex items-baseline gap-1 rounded-full px-3 py-1.5"
            style={{ background: hexA(tone, 0.14), border: `1px solid ${hexA(tone, 0.5)}` }}
          >
            <span className="text-[18px] font-bold leading-none" style={{ color: tone, ...num }}>
              {opdracht.match}
            </span>
            <span
              className="text-[9px] font-bold uppercase tracking-[0.1em]"
              style={{ color: tone }}
            >
              match
            </span>
          </span>
          <span className="text-[13px] font-bold" style={{ color: C.fg, ...num }}>
            {opdracht.tarief}
          </span>
        </div>
      </div>
      <div className="mt-4 flex items-center gap-3">
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          className="inline-flex items-center gap-1.5 rounded-full px-3.5 py-2 text-[11.5px] font-bold transition-colors focus-visible:outline-none focus-visible:ring-2"
          style={{
            color: C.fg,
            border: `1px solid ${C.line}`,
            background: C.bgAlt,
            ...bodyFont,
            ["--tw-ring-color" as string]: tone,
          }}
        >
          <Sparkles size={12} aria-hidden="true" />
          Waarom deze match
        </button>
        <div className="ml-auto">
          <Btn onClick={onOpen} tone={C.teal}>
            Reageer <ArrowRight size={13} aria-hidden="true" />
          </Btn>
        </div>
      </div>
      <div
        className="grid transition-all duration-500 motion-reduce:transition-none"
        style={{ gridTemplateRows: open ? "1fr" : "0fr" }}
      >
        <div className="overflow-hidden">
          <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
            <RedenBlok
              titel="In jouw voordeel"
              tone={C.teal}
              Icon={Check}
              items={opdracht.redenen.plus}
            />
            <RedenBlok
              titel="Goed om te weten"
              tone={C.amber}
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
      className="rounded-xl p-4"
      style={{
        background: C.bgAlt,
        border: `1px solid ${C.line}`,
        borderLeft: `3px solid ${tone}`,
      }}
    >
      <p
        className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.14em]"
        style={{ color: tone, ...bodyFont }}
      >
        <Icon size={12} aria-hidden="true" />
        {titel}
      </p>
      <ul className="mt-2.5 space-y-2">
        {items.map((r) => (
          <li key={r} className="flex items-start gap-2 text-[12.5px]" style={{ color: C.fgSoft }}>
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
  const tone = strong ? C.teal : C.sky;
  return (
    <div className="space-y-5 pt-6">
      <Btn onClick={onBack} tone={C.sky} variant="ghost">
        <ArrowLeft size={13} aria-hidden="true" /> Terug naar marktplaats
      </Btn>

      <Panel className="p-7 md:p-8" glow={tone}>
        <SwarmField count={16} opacity={0.3} />
        <div className="relative">
          <div className="flex flex-wrap items-center gap-2">
            <span
              className="inline-flex items-center rounded-full px-2.5 py-0.5 text-[10.5px] font-bold"
              style={{ color: C.fgMute, border: `1px solid ${C.line}`, ...num }}
            >
              {opdracht.id}
            </span>
            <span
              className="inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-bold"
              style={{ color: C.bg, background: tone, ...bodyFont }}
            >
              <ShieldCheck size={11} aria-hidden="true" /> {strong ? "Sterke match" : "Goede match"}{" "}
              · {opdracht.match}%
            </span>
          </div>
          <h1
            className="mt-4 max-w-2xl text-[28px] font-bold leading-[1.1] tracking-[-0.01em] md:text-[36px]"
            style={{ color: C.fg }}
          >
            {opdracht.titel}
          </h1>
          <p className="mt-2 text-[13.5px]" style={{ color: C.fgSoft }}>
            {opdracht.opdrachtgever} · {opdracht.plaats}
          </p>
          <div className="mt-6 flex flex-wrap gap-2.5">
            <Btn tone={C.teal}>
              Reageer op opdracht <ArrowRight size={14} aria-hidden="true" />
            </Btn>
            <Btn tone={C.sky} variant="ghost">
              Bewaren
            </Btn>
          </div>
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
                borderLeft: i % 4 === 0 ? "none" : `1px solid ${C.line}`,
                borderTop: i >= 2 ? `1px solid ${C.line}` : "none",
              }}
            >
              <p
                className="text-[9.5px] font-bold uppercase tracking-[0.16em]"
                style={{ color: C.fgMute, ...bodyFont }}
              >
                {m.l}
              </p>
              <p
                className="mt-1.5 text-[18px] font-bold tracking-[-0.01em]"
                style={{ color: C.fg, ...num }}
              >
                {m.v}
              </p>
            </div>
          ))}
        </div>
      </Panel>

      <section>
        <Label tone={C.indigo}>Waarom deze match naar je toe trekt</Label>
        <p className="mt-3 max-w-xl text-[13.5px] leading-relaxed" style={{ color: C.fgSoft }}>
          Afgezet tegen je geverifieerde profiel — wat je aantrekt én wat goed is om te weten, open
          en zonder verborgen score.
        </p>
        <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-[1fr_1fr_auto]">
          <Panel className="p-6">
            <p
              className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-[0.14em]"
              style={{ color: C.teal, ...bodyFont }}
            >
              <Check size={13} aria-hidden="true" /> In jouw voordeel
            </p>
            <ul className="mt-4 space-y-3">
              {opdracht.redenen.plus.map((r) => (
                <li
                  key={r}
                  className="flex items-start gap-3 text-[13.5px]"
                  style={{ color: C.fgSoft }}
                >
                  <Check
                    size={15}
                    aria-hidden="true"
                    className="mt-0.5 shrink-0"
                    style={{ color: C.teal }}
                  />
                  {r}
                </li>
              ))}
            </ul>
          </Panel>
          <Panel className="p-6">
            <p
              className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-[0.14em]"
              style={{ color: C.amber, ...bodyFont }}
            >
              <AlertTriangle size={13} aria-hidden="true" /> Goed om te weten
            </p>
            <ul className="mt-4 space-y-3">
              {opdracht.redenen.min.map((r) => (
                <li
                  key={r}
                  className="flex items-start gap-3 text-[13.5px]"
                  style={{ color: C.fgSoft }}
                >
                  <AlertTriangle
                    size={14}
                    aria-hidden="true"
                    className="mt-0.5 shrink-0"
                    style={{ color: C.amber }}
                  />
                  {r}
                </li>
              ))}
            </ul>
          </Panel>
          <Panel className="flex flex-col items-center justify-center gap-3 p-6 md:w-40">
            <p
              className="text-[10px] font-bold uppercase tracking-[0.14em]"
              style={{ color: C.fgMute, ...bodyFont }}
            >
              Aantrekking
            </p>
            <div className="w-full">
              <AttractionViz score={opdracht.match} tone={tone} />
            </div>
            <p className="text-center text-[11px] font-bold" style={{ color: tone, ...bodyFont }}>
              {strong ? "Sterk" : "Goed"} afgestemd
            </p>
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
    <div className="space-y-5 pt-6">
      <Panel className="p-7 md:p-8" glow={C.teal}>
        <div className="flex flex-wrap items-center justify-between gap-6">
          <div className="max-w-md">
            <Label tone={C.teal}>Verificatie · vertrouwen</Label>
            <h1
              className="mt-3 text-[26px] font-bold leading-tight tracking-[-0.01em]"
              style={{ color: C.fg }}
            >
              Jouw certificaten
            </h1>
            <p className="mt-3 text-[13.5px] leading-relaxed" style={{ color: C.fgSoft }}>
              <span className="font-bold" style={{ color: C.teal }}>
                {PROFIEL.trust}.
              </span>{" "}
              {verified} van de {CREDENTIALS.length} certificaten zijn geverifieerd. Eén verloopt
              binnenkort — dat pakken we op tijd op. Je documenten blijven versleuteld en privé.
            </p>
            <div className="mt-4 max-w-xs">
              <Meter value={ratio} tone={C.teal} />
            </div>
          </div>
          <span
            className="inline-flex h-24 w-24 flex-col items-center justify-center rounded-full"
            style={{ background: hexA(C.teal, 0.12), border: `2px solid ${hexA(C.teal, 0.6)}` }}
            aria-hidden="true"
          >
            <span className="text-[28px] font-bold leading-none" style={{ color: C.teal, ...num }}>
              {ratio}
            </span>
            <span
              className="mt-1 text-[8px] font-bold uppercase tracking-[0.16em]"
              style={{ color: C.teal }}
            >
              % in orde
            </span>
          </span>
        </div>
      </Panel>

      <Panel>
        <ul>
          {CREDENTIALS.map((c, idx) => {
            const st = statusMeta(c.status);
            const isOpen = open === c.naam;
            return (
              <li key={c.naam} style={{ borderTop: idx === 0 ? "none" : `1px solid ${C.line}` }}>
                <button
                  type="button"
                  onClick={() => setOpen(isOpen ? null : c.naam)}
                  aria-expanded={isOpen}
                  className="grid w-full grid-cols-[auto_1fr_auto] items-center gap-4 px-5 py-4 text-left transition-colors hover:bg-[#16233f] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset"
                  style={{ ["--tw-ring-color" as string]: st.ink }}
                >
                  <span
                    className="inline-flex h-10 w-10 items-center justify-center rounded-full"
                    style={{
                      background: hexA(st.ink, 0.14),
                      border: `1px solid ${hexA(st.ink, 0.5)}`,
                      color: st.ink,
                    }}
                    aria-hidden="true"
                  >
                    <st.Icon size={16} />
                  </span>
                  <span className="min-w-0">
                    <span className="block truncate text-[14px] font-bold" style={{ color: C.fg }}>
                      {c.naam}
                    </span>
                    <span
                      className="mt-0.5 block truncate text-[11.5px]"
                      style={{ color: C.fgMute }}
                    >
                      {c.detail}
                    </span>
                  </span>
                  <span className="flex items-center gap-3">
                    <span className="hidden sm:inline-flex">
                      <StatusChip status={c.status} />
                    </span>
                    <ChevronRight
                      size={16}
                      aria-hidden="true"
                      className="transition-transform motion-reduce:transition-none"
                      style={{
                        color: C.fgFaint,
                        transform: isOpen ? "rotate(90deg)" : "rotate(0deg)",
                      }}
                    />
                  </span>
                </button>
                <div
                  className="grid transition-all duration-500 motion-reduce:transition-none"
                  style={{ gridTemplateRows: isOpen ? "1fr" : "0fr" }}
                >
                  <div className="overflow-hidden">
                    <div className="px-5 pb-4 sm:pl-[76px]">
                      <div
                        className="rounded-xl p-4"
                        style={{ background: C.bgAlt, border: `1px solid ${C.line}` }}
                      >
                        <p
                          className="max-w-xl text-[13px] leading-relaxed"
                          style={{ color: C.fgSoft }}
                        >
                          {c.detail}. Je document wordt versleuteld bewaard en alleen na jouw
                          expliciete toestemming gedeeld met een opdrachtgever.
                        </p>
                        <div className="mt-3 flex flex-wrap gap-2">
                          <Btn tone={c.status === "EXPIRING" ? C.amber : C.teal}>
                            {c.status === "EXPIRING" ? "Vernieuwen" : "Bekijken"}
                          </Btn>
                          <Btn tone={C.sky} variant="ghost">
                            Historie
                          </Btn>
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
          <Label tone={C.indigo}>Documentenkast</Label>
        </div>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {DOCUMENTEN.map((d) => (
            <Panel key={d.naam} className="flex items-center gap-3 p-4">
              <span
                className="inline-flex h-9 w-9 items-center justify-center rounded-full"
                style={{ background: C.bgAlt, border: `1px solid ${C.line}`, color: C.fgSoft }}
                aria-hidden="true"
              >
                <FileText size={15} />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-[13px] font-bold" style={{ color: C.fg }}>
                  {d.naam}
                </span>
                <span className="block text-[10.5px]" style={{ color: C.fgMute, ...num }}>
                  {d.type} · {d.grootte} · {d.bijgewerkt}
                </span>
              </span>
              <StatusChip status={d.status} small />
            </Panel>
          ))}
        </div>
      </div>
    </div>
  );
}

function Acties() {
  return (
    <div className="space-y-5 pt-6">
      <div>
        <Label tone={C.amber}>Acties · op volgorde van urgentie</Label>
        <h1
          className="mt-3 text-[28px] font-bold leading-none tracking-[-0.01em] md:text-[34px]"
          style={{ color: C.fg }}
        >
          Wat vandaag je aandacht vraagt
        </h1>
        <p className="mt-2 max-w-md text-[13.5px]" style={{ color: C.fgSoft }}>
          De zwerm wijst de weg: van boven naar beneden, één ding tegelijk.
        </p>
      </div>

      <ol className="space-y-3">
        {ACTIES.map((a, i) => {
          const warn = a.urgentie === "warning";
          const tone = warn ? C.amber : C.sky;
          return (
            <li key={a.titel}>
              <Panel className="zw-int p-5">
                <div className="grid grid-cols-[auto_1fr] items-start gap-4 sm:grid-cols-[auto_1fr_auto]">
                  <span
                    className="flex h-10 w-10 items-center justify-center rounded-full text-[14px] font-bold"
                    style={{
                      background: hexA(tone, 0.14),
                      border: `1px solid ${hexA(tone, 0.5)}`,
                      color: tone,
                      ...num,
                    }}
                    aria-hidden="true"
                  >
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <div className="min-w-0">
                    <span
                      className="inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[9.5px] font-bold uppercase tracking-[0.12em]"
                      style={{
                        color: tone,
                        background: hexA(tone, 0.14),
                        border: `1px solid ${hexA(tone, 0.5)}`,
                        ...bodyFont,
                      }}
                    >
                      {warn ? (
                        <AlertTriangle size={10} aria-hidden="true" />
                      ) : (
                        <Clock size={10} aria-hidden="true" />
                      )}
                      {warn ? "Urgent" : "Aanbevolen"}
                    </span>
                    <h2 className="mt-2 text-[18px] font-bold leading-snug" style={{ color: C.fg }}>
                      {a.titel}
                    </h2>
                    <p
                      className="mt-1.5 max-w-lg text-[13.5px] leading-relaxed"
                      style={{ color: C.fgSoft }}
                    >
                      {a.detail}
                    </p>
                  </div>
                  <div className="col-span-2 mt-1 sm:col-span-1 sm:mt-0 sm:self-center">
                    <Btn tone={warn ? C.amber : C.teal}>
                      {a.cta}
                      <ArrowRight size={13} aria-hidden="true" />
                    </Btn>
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

function factuurTone(status: string): { ink: string; Icon: LucideIcon | null } {
  if (status === "Openstaand") return { ink: C.rose, Icon: AlertTriangle };
  if (status === "Betaald") return { ink: C.teal, Icon: Check };
  return { ink: C.fgMute, Icon: FileText };
}

function Facturen() {
  const [sort, setSort] = useState<"datum" | "bedrag">("datum");

  const rows = useMemo(() => {
    if (sort === "datum") return FACTUREN;
    return [...FACTUREN].sort(
      (a, b) =>
        parseInt(b.bedrag.replace(/\D/g, ""), 10) - parseInt(a.bedrag.replace(/\D/g, ""), 10),
    );
  }, [sort]);

  return (
    <div className="space-y-5 pt-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <Label tone={C.sky}>Facturen</Label>
          <h1
            className="mt-3 text-[28px] font-bold leading-none tracking-[-0.01em] md:text-[34px]"
            style={{ color: C.fg }}
          >
            Jouw facturen
          </h1>
        </div>
        <Btn tone={C.teal}>Nieuwe factuur</Btn>
      </div>

      <section className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {[
          { l: "Betaald", v: "€ 8.622", sub: "3 facturen", alarm: false, tone: C.teal },
          { l: "Openstaand", v: "€ 1.350", sub: "1 factuur · 9 dagen", alarm: true, tone: C.rose },
          { l: "Concept", v: "€ 880", sub: "klaar om te versturen", alarm: false, tone: C.fgMute },
        ].map((s) => (
          <Panel key={s.l} className="zw-int p-5">
            <div className="flex items-center justify-between">
              <p
                className="text-[10px] font-bold uppercase tracking-[0.1em]"
                style={{ color: C.fgMute, ...bodyFont }}
              >
                {s.l}
              </p>
              {s.alarm && <AlertTriangle size={14} aria-hidden="true" style={{ color: C.rose }} />}
            </div>
            <p
              className="mt-2 text-[25px] font-bold tracking-[-0.01em]"
              style={{ color: s.tone, ...num }}
            >
              {s.v}
            </p>
            <p className="mt-1 text-[11.5px]" style={{ color: C.fgMute }}>
              {s.sub}
            </p>
          </Panel>
        ))}
      </section>

      <div className="flex items-center gap-2" role="group" aria-label="Facturen sorteren">
        {(["datum", "bedrag"] as const).map((s) => (
          <Btn
            key={s}
            onClick={() => setSort(s)}
            tone={C.sky}
            variant={sort === s ? "solid" : "ghost"}
            ariaPressed={sort === s}
          >
            <ArrowUpDown size={12} aria-hidden="true" />
            {s === "datum" ? "Op datum" : "Op bedrag"}
          </Btn>
        ))}
      </div>

      <Panel>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[560px] border-collapse text-left">
            <caption className="sr-only">Facturen met status en bedrag</caption>
            <thead>
              <tr style={{ borderBottom: `1.5px solid ${C.line}` }}>
                {[
                  { h: "Nummer", a: "left" },
                  { h: "Klant", a: "left" },
                  { h: "Datum", a: "left" },
                  { h: "Status", a: "left" },
                  { h: "Bedrag", a: "right" },
                ].map((c) => (
                  <th
                    key={c.h}
                    scope="col"
                    className={`px-4 py-3 text-[9.5px] font-bold uppercase tracking-[0.14em] ${c.a === "right" ? "text-right" : ""}`}
                    style={{ color: C.fgMute, ...bodyFont }}
                  >
                    {c.h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((f, i) => {
                const ft = factuurTone(f.status);
                return (
                  <tr
                    key={f.nr}
                    className="transition-colors hover:bg-[#16233f]"
                    style={{
                      background: i % 2 === 1 ? C.bgAlt : "transparent",
                      borderBottom: `1px solid ${C.line}`,
                    }}
                  >
                    <td
                      className="px-4 py-3 text-[11.5px] font-bold"
                      style={{ color: C.fgMute, ...num }}
                    >
                      {f.nr}
                    </td>
                    <td className="px-4 py-3 text-[13.5px] font-bold" style={{ color: C.fg }}>
                      {f.klant}
                    </td>
                    <td className="px-4 py-3 text-[11.5px]" style={{ color: C.fgMute, ...num }}>
                      {f.datum}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10.5px] font-bold"
                        style={{
                          color: ft.ink,
                          background: hexA(ft.ink, 0.12),
                          border: `1px solid ${hexA(ft.ink, 0.5)}`,
                          ...bodyFont,
                        }}
                      >
                        {ft.Icon && <ft.Icon size={11} aria-hidden="true" />}
                        {f.status}
                      </span>
                    </td>
                    <td
                      className="px-4 py-3 text-right text-[13.5px] font-bold"
                      style={{ color: C.fg, ...num }}
                    >
                      {f.bedrag}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Panel>
    </div>
  );
}
