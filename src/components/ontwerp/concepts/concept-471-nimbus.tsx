"use client";

// Concept 471 — "Nimbus" · Premium-dark met glow-hiërarchie. Inktzwarte basis, radiale spotlight-glow
// rond het element dat aandacht vraagt; belang wordt gestuurd door licht in plaats van door omvang of
// kleurvlakken. Het item dat telt "gloeit" (neon-cyaan / elektrisch-violet halo), de rest zakt weg in
// het donker. Glas-achtige panelen met fijne lichtranden — onderscheidend doordat glow = informatie.

import { useMemo, useState } from "react";
import {
  AlertTriangle,
  ArrowRight,
  ArrowUpDown,
  Bell,
  Check,
  ChevronRight,
  Clock,
  FileText,
  Minus,
  Plus,
  Search,
  Send,
  ShieldCheck,
  Sparkles,
  TrendingDown,
  TrendingUp,
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

// — Palet: inktzwart met neon-cyaan en elektrisch-violet als lichtbronnen —
const C = {
  void: "#0a0a0f", // inktzwarte basis
  base: "#0d0d14", // paneel-basis
  panel: "#12121b", // glas-paneel
  panelHi: "#181826", // opgelicht paneel
  line: "#232334", // hairline
  lineHi: "#33334a", // fellere hairline
  fg: "#e5e7eb", // primaire tekst
  fgSoft: "#a9adbd", // zachte tekst
  fgMute: "#6f7488", // gedempte tekst
  fgFaint: "#4a4e60", // faint
  cyan: "#22d3ee", // primair accent (glow)
  cyanDim: "#0e7490",
  violet: "#a78bfa", // secundair accent (glow)
  violetDim: "#6d5bd0",
  green: "#34d399", // geverifieerd
  greenDim: "#0f5132",
  amber: "#fbbf24", // let op / verloopt
  amberDim: "#7a5b0a",
  rose: "#fb7185", // afgewezen / urgent
  roseDim: "#7f1d3a",
};

const bodyFont = {
  fontFamily: "'Inter', 'Segoe UI', system-ui, -apple-system, sans-serif",
};
const num = {
  fontFamily: "ui-monospace, 'SFMono-Regular', 'Menlo', 'Consolas', monospace",
  fontVariantNumeric: "tabular-nums" as const,
};

// Achtergrond: diep inktzwart met twee zachte spotlights (cyaan linksboven, violet rechtsonder) en
// een vignet dat de randen laat wegvallen. Puur CSS, geen assets.
function nimbusBg(): React.CSSProperties {
  return {
    backgroundColor: C.void,
    backgroundImage: [
      "radial-gradient(90% 60% at 12% -5%, rgba(34,211,238,0.10) 0%, rgba(34,211,238,0) 55%)",
      "radial-gradient(80% 60% at 92% 108%, rgba(167,139,250,0.10) 0%, rgba(167,139,250,0) 55%)",
      "radial-gradient(120% 120% at 50% 50%, rgba(10,10,15,0) 55%, rgba(0,0,0,0.55) 100%)",
    ].join(","),
  };
}

// Glow rond een element: een zachte halo in de opgegeven kleur — de kern van de hiërarchie.
function glow(color: string, strength = 1): string {
  return [
    `0 0 0 1px ${color}${Math.round(38 * strength)
      .toString(16)
      .padStart(2, "0")}`,
    `0 0 22px -6px ${color}${Math.round(150 * strength)
      .toString(16)
      .padStart(2, "0")}`,
    `0 0 60px -20px ${color}${Math.round(120 * strength)
      .toString(16)
      .padStart(2, "0")}`,
  ].join(",");
}

function statusMeta(s: CredStatus): {
  label: string;
  Icon: LucideIcon;
  alarm: boolean;
  ink: string;
  dim: string;
} {
  switch (s) {
    case "VERIFIED":
      return {
        label: "Geverifieerd",
        Icon: ShieldCheck,
        alarm: false,
        ink: C.green,
        dim: C.greenDim,
      };
    case "SUBMITTED":
      return { label: "In behandeling", Icon: Clock, alarm: false, ink: C.cyan, dim: C.cyanDim };
    case "EXPIRING":
      return {
        label: "Verloopt binnenkort",
        Icon: AlertTriangle,
        alarm: true,
        ink: C.amber,
        dim: C.amberDim,
      };
    case "REJECTED":
      return { label: "Afgewezen", Icon: AlertTriangle, alarm: true, ink: C.rose, dim: C.roseDim };
  }
}

// — Glas-paneel; `lit` bepaalt of het paneel "aan" staat (glow) of wegzakt in het donker —
function Panel({
  children,
  className = "",
  as: Tag = "div",
  lit = false,
  litColor = C.cyan,
  interactive = false,
  style,
}: {
  children: React.ReactNode;
  className?: string;
  as?: "div" | "section" | "li" | "article";
  lit?: boolean;
  litColor?: string;
  interactive?: boolean;
  style?: React.CSSProperties;
}) {
  return (
    <Tag
      className={`nb-panel relative overflow-hidden rounded-2xl ${interactive ? "nb-panel--int" : ""} ${className}`}
      style={{
        background: lit
          ? `linear-gradient(160deg, ${C.panelHi} 0%, ${C.panel} 100%)`
          : `linear-gradient(160deg, ${C.panel} 0%, ${C.base} 100%)`,
        border: `1px solid ${lit ? "transparent" : C.line}`,
        boxShadow: lit
          ? glow(litColor, 1)
          : "0 1px 0 rgba(255,255,255,0.02) inset, 0 12px 30px -22px rgba(0,0,0,0.9)",
        color: C.fg,
        ...style,
      }}
    >
      {/* fijne lichtrand bovenaan — glas-reflectie */}
      <span
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 top-0 h-px"
        style={{
          background: `linear-gradient(90deg, transparent, ${lit ? litColor : C.lineHi}55, transparent)`,
        }}
      />
      {children}
    </Tag>
  );
}

function Eyebrow({ children, tone = C.cyan }: { children: React.ReactNode; tone?: string }) {
  return (
    <p
      className="flex items-center gap-2 text-[10.5px] font-bold uppercase tracking-[0.22em]"
      style={{ color: tone, ...bodyFont }}
    >
      <Sparkles size={12} aria-hidden="true" />
      {children}
    </p>
  );
}

function GlowButton({
  children,
  onClick,
  tone = C.cyan,
  className = "",
  type = "button",
}: {
  children: React.ReactNode;
  onClick?: () => void;
  tone?: string;
  className?: string;
  type?: "button" | "submit";
}) {
  return (
    <button
      type={type}
      onClick={onClick}
      className={`group inline-flex items-center justify-center gap-2 rounded-full px-5 py-2.5 text-[12.5px] font-bold transition-all duration-200 hover:brightness-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#22d3ee] focus-visible:ring-offset-2 focus-visible:ring-offset-[#0a0a0f] active:translate-y-px motion-reduce:transition-none ${className}`}
      style={{
        color: C.void,
        background: `linear-gradient(135deg, ${tone} 0%, ${tone}cc 100%)`,
        boxShadow: glow(tone, 0.7),
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
      className={`inline-flex items-center justify-center gap-2 rounded-full px-4 py-2.5 text-[12px] font-bold transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#22d3ee] focus-visible:ring-offset-2 focus-visible:ring-offset-[#0a0a0f] motion-reduce:transition-none ${className}`}
      style={{
        color: active ? C.void : C.fgSoft,
        background: active ? C.cyan : "transparent",
        border: `1px solid ${active ? C.cyan : C.line}`,
        boxShadow: active ? glow(C.cyan, 0.5) : "none",
        ...bodyFont,
      }}
    >
      {children}
    </button>
  );
}

// — Sparkline: gloeiende neon-lijn —
function SparkLine({ data, tone, id }: { data: number[]; tone: string; id: string }) {
  const max = Math.max(...data);
  const min = Math.min(...data);
  const span = max - min || 1;
  const w = 120;
  const h = 34;
  const step = w / (data.length - 1);
  const pts = data.map((d, i) => [i * step, h - 4 - ((d - min) / span) * (h - 8)] as const);
  const line = pts
    .map((p, i) => `${i === 0 ? "M" : "L"}${p[0].toFixed(1)},${p[1].toFixed(1)}`)
    .join(" ");
  const area = `${line} L${w},${h} L0,${h} Z`;
  const last = pts[pts.length - 1] ?? ([w, h] as const);
  const gid = `nb-grad-${id}`;
  return (
    <svg
      width="100%"
      height={h}
      viewBox={`0 0 ${w} ${h}`}
      preserveAspectRatio="none"
      aria-hidden="true"
    >
      <defs>
        <linearGradient id={gid} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={tone} stopOpacity="0.35" />
          <stop offset="100%" stopColor={tone} stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={area} fill={`url(#${gid})`} />
      <path
        d={line}
        fill="none"
        stroke={tone}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        style={{ filter: `drop-shadow(0 0 4px ${tone})` }}
      />
      <circle
        cx={last[0]}
        cy={last[1]}
        r="2.6"
        fill={tone}
        style={{ filter: `drop-shadow(0 0 5px ${tone})` }}
      />
    </svg>
  );
}

// — Glow-meter: balk die licht geeft in verhouding tot de waarde —
function GlowMeter({ value, tone = C.green }: { value: number; tone?: string }) {
  return (
    <span className="flex items-center gap-2.5" aria-hidden="true">
      <span
        className="relative h-2 w-28 overflow-hidden rounded-full"
        style={{ background: C.base }}
      >
        <span
          className="block h-full rounded-full"
          style={{
            width: `${value}%`,
            background: `linear-gradient(90deg, ${tone}88, ${tone})`,
            boxShadow: `0 0 10px -1px ${tone}`,
            transition: "width 0.8s cubic-bezier(0.22,1,0.36,1)",
          }}
        />
      </span>
      <span className="text-[12px] font-bold" style={{ color: tone, ...num }}>
        {value}%
      </span>
    </span>
  );
}

export function Concept471() {
  const [screen, setScreen] = useState<ScreenKey>("dashboard");
  const active = OPDRACHTEN[0] as Opdracht;

  return (
    <div
      className="relative min-h-[720px] w-full antialiased"
      style={{ ...bodyFont, color: C.fg, ...nimbusBg() }}
    >
      <style>{`
        @keyframes nbRise { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
        .nb-rise { animation: nbRise 0.5s cubic-bezier(0.22, 1, 0.36, 1) both; }
        @keyframes nbPulse { 0%,100% { opacity: 0.55; } 50% { opacity: 1; } }
        .nb-pulse { animation: nbPulse 2.4s ease-in-out infinite; }
        .nb-panel--int { transition: transform 0.3s cubic-bezier(0.22,1,0.36,1), box-shadow 0.3s cubic-bezier(0.22,1,0.36,1), border-color 0.3s; }
        .nb-panel--int:hover { transform: translateY(-3px); border-color: transparent; box-shadow: 0 0 0 1px var(--nb-hover, #33334a), 0 0 26px -8px var(--nb-hover, #33334a); }
        @media (prefers-reduced-motion: reduce) { .nb-rise, .nb-pulse { animation: none !important; } .nb-panel--int { transition: none !important; } .nb-panel--int:hover { transform: none !important; } }
      `}</style>

      <div className="relative mx-auto max-w-6xl px-4 pb-24 sm:px-6 md:px-8">
        <TopBar />
        <NavBar screen={screen} setScreen={setScreen} />
        <main key={screen} className="nb-rise pt-6">
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
            background: `linear-gradient(135deg, ${C.cyan} 0%, ${C.violet} 100%)`,
            color: C.void,
            boxShadow: glow(C.cyan, 0.8),
          }}
          aria-hidden="true"
        >
          <Zap size={20} strokeWidth={2.4} />
        </span>
        <div>
          <p className="text-[19px] font-bold leading-none tracking-tight" style={{ color: C.fg }}>
            Nimbus
          </p>
          <p className="mt-1.5 text-[11px] leading-none" style={{ color: C.fgMute }}>
            {PROFIEL.plaats} · vandaag
          </p>
        </div>
      </div>
      <div className="flex items-center gap-3">
        <span
          className="hidden items-center gap-1.5 rounded-full px-3 py-1.5 text-[11px] font-bold sm:inline-flex"
          style={{ color: C.green, background: `${C.green}14`, border: `1px solid ${C.green}55` }}
        >
          <ShieldCheck size={12} aria-hidden="true" />
          {PROFIEL.trust}
        </span>
        <span
          className="relative inline-flex h-9 w-9 items-center justify-center rounded-full"
          style={{ background: C.panel, border: `1px solid ${C.line}`, color: C.fgSoft }}
          aria-label={`${ongelezen} ongelezen berichten`}
        >
          <Bell size={15} aria-hidden="true" />
          {ongelezen > 0 && (
            <span
              className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full text-[9px] font-bold"
              style={{ background: C.rose, color: C.void, boxShadow: glow(C.rose, 0.6), ...num }}
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
            background: `linear-gradient(135deg, ${C.violet}33, ${C.cyan}22)`,
            border: `1px solid ${C.violet}66`,
            color: C.violet,
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
        style={{ background: C.base, border: `1px solid ${C.line}` }}
      >
        {SCREENS.map((s) => {
          const on = s.key === screen;
          return (
            <button
              key={s.key}
              type="button"
              onClick={() => setScreen(s.key)}
              aria-current={on ? "page" : undefined}
              className="shrink-0 rounded-full px-4 py-2 text-[12.5px] font-bold transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#22d3ee] focus-visible:ring-offset-1 focus-visible:ring-offset-[#0d0d14] motion-reduce:transition-none"
              style={{
                color: on ? C.void : C.fgSoft,
                background: on ? C.cyan : "transparent",
                boxShadow: on ? glow(C.cyan, 0.5) : "none",
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

function Dashboard({ onOpen, onActies }: { onOpen: () => void; onActies: () => void }) {
  const primair = ACTIES[0] as (typeof ACTIES)[number];
  const verified = CREDENTIALS.filter((c) => c.status === "VERIFIED").length;
  return (
    <div className="space-y-5 pt-6">
      <section className="grid grid-cols-1 gap-5 lg:grid-cols-[1.5fr_1fr]">
        {/* Het item dat aandacht vraagt: volledig belicht met violet-glow */}
        <Panel className="p-7 md:p-8" lit litColor={C.violet}>
          <span
            aria-hidden="true"
            className="nb-pulse pointer-events-none absolute -right-24 -top-24 h-64 w-64 rounded-full"
            style={{ background: `radial-gradient(circle, ${C.violet}33, transparent 70%)` }}
          />
          <Eyebrow tone={C.violet}>Vandaag in de schijnwerper</Eyebrow>
          <h1
            className="mt-4 text-[30px] font-bold leading-[1.08] tracking-[-0.01em] md:text-[40px]"
            style={{ color: C.fg }}
          >
            Goedemorgen, {PROFIEL.naam.split(" ")[0]}.
          </h1>
          <p className="mt-3 max-w-md text-[13.5px] leading-relaxed" style={{ color: C.fgSoft }}>
            Je certificaten staan op groen en er liggen verse matches klaar. Eén ding licht op — dat
            pak je zo op. Het systeem toont je alleen wat telt.
          </p>
          <div className="mt-6 flex flex-wrap items-center gap-2.5">
            <GlowButton onClick={onActies} tone={C.violet}>
              Volgende actie
              <ArrowRight
                size={14}
                aria-hidden="true"
                className="transition-transform group-hover:translate-x-0.5 motion-reduce:transition-none"
              />
            </GlowButton>
            <GhostButton onClick={onOpen}>Naar de marktplaats</GhostButton>
          </div>
        </Panel>

        {/* De urgente actie gloeit amber */}
        <Panel className="p-6" lit litColor={C.amber}>
          <div className="flex items-center justify-between">
            <Eyebrow tone={C.amber}>Vraagt aandacht</Eyebrow>
            <AlertTriangle
              size={17}
              aria-hidden="true"
              style={{ color: C.amber, filter: `drop-shadow(0 0 6px ${C.amber})` }}
            />
          </div>
          <h2 className="mt-3 text-[18px] font-bold leading-snug" style={{ color: C.fg }}>
            {primair.titel}
          </h2>
          <p className="mt-2 text-[13px] leading-relaxed" style={{ color: C.fgSoft }}>
            {primair.detail}
          </p>
          <div className="mt-5">
            <GlowButton onClick={onActies} tone={C.amber} className="w-full">
              {primair.cta}
              <ArrowRight size={14} aria-hidden="true" />
            </GlowButton>
          </div>
          <p
            className="mt-5 flex items-center gap-2 border-t pt-4 text-[12px]"
            style={{ color: C.fgMute, borderColor: C.line }}
          >
            <Check size={13} aria-hidden="true" style={{ color: C.green }} />
            {verified}/{CREDENTIALS.length} certificaten in orde · 7 open reacties
          </p>
        </Panel>
      </section>

      <section>
        <div className="mb-3">
          <Eyebrow>Kerncijfers · deze maand</Eyebrow>
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {KPIS.map((k, i) => {
            const tone = k.up ? C.cyan : C.amber;
            const Trend = k.up ? TrendingUp : TrendingDown;
            // De belangrijkste KPI (match) krijgt glow; de rest zakt weg.
            const spotlight = i === 0;
            return (
              <Panel
                key={k.label}
                className="p-5"
                interactive
                lit={spotlight}
                litColor={tone}
                style={{ "--nb-hover": tone } as React.CSSProperties}
              >
                <div className="flex items-start justify-between gap-2">
                  <p
                    className="text-[10px] font-bold uppercase tracking-[0.14em]"
                    style={{ color: C.fgMute, ...bodyFont }}
                  >
                    {k.label}
                  </p>
                  <span
                    className="inline-flex items-center gap-0.5 text-[10px] font-bold"
                    style={{ color: tone, ...num }}
                  >
                    <Trend size={11} aria-hidden="true" /> {k.trend.replace(/^[+-]/, "")}
                  </span>
                </div>
                <p
                  className="mt-3 text-[26px] font-bold leading-none tracking-[-0.01em]"
                  style={{ color: C.fg, ...num }}
                >
                  {k.value}
                </p>
                <div className="mt-3">
                  <SparkLine data={k.spark} tone={tone} id={`k471-${i}`} />
                </div>
              </Panel>
            );
          })}
        </div>
      </section>

      <section className="grid grid-cols-1 gap-5 lg:grid-cols-[1.5fr_1fr]">
        <div>
          <div className="mb-3 flex items-baseline justify-between">
            <Eyebrow>Matches die oplichten</Eyebrow>
            <button
              type="button"
              onClick={onOpen}
              className="text-[11px] font-bold uppercase tracking-[0.14em] transition-colors hover:opacity-70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#22d3ee] focus-visible:ring-offset-2 focus-visible:ring-offset-[#0a0a0f]"
              style={{ color: C.cyan, ...bodyFont }}
            >
              Alle →
            </button>
          </div>
          <ul className="space-y-3">
            {OPDRACHTEN.map((o) => {
              const strong = o.match >= 90;
              const tone = strong ? C.cyan : C.violet;
              return (
                <li key={o.id}>
                  <Panel
                    className="p-4"
                    interactive
                    as="article"
                    lit={strong}
                    litColor={tone}
                    style={{ "--nb-hover": tone } as React.CSSProperties}
                  >
                    <button
                      type="button"
                      onClick={onOpen}
                      className="group flex w-full items-center gap-4 text-left focus-visible:outline-none"
                    >
                      <span
                        className="inline-flex h-12 w-12 shrink-0 flex-col items-center justify-center rounded-xl"
                        style={{
                          background: `${tone}18`,
                          border: `1px solid ${tone}66`,
                          boxShadow: strong ? glow(tone, 0.4) : "none",
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
            <Eyebrow tone={C.green}>Certificaten</Eyebrow>
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
                        background: `${st.ink}18`,
                        border: `1px solid ${st.ink}66`,
                        color: st.ink,
                        boxShadow: st.alarm ? glow(st.ink, 0.35) : "none",
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
        <Eyebrow>Marktplaats</Eyebrow>
        <h1
          className="mt-3 text-[30px] font-bold leading-none tracking-[-0.01em]"
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
          className="flex flex-1 items-center gap-2.5 rounded-full px-5 py-3 focus-within:shadow-[0_0_0_1px_#22d3ee,0_0_22px_-6px_#22d3ee]"
          style={{ background: C.panel, border: `1px solid ${C.line}` }}
        >
          <Search size={16} aria-hidden="true" style={{ color: C.fgFaint }} />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Zoek op titel, plaats of opdrachtgever…"
            aria-label="Opdrachten zoeken"
            className="w-full bg-transparent text-[13px] outline-none placeholder:text-[#6f7488]"
            style={{ color: C.fg, ...bodyFont }}
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
              <ArrowUpDown size={12} aria-hidden="true" />
              {s === "match" ? "Beste match" : "Hoogste tarief"}
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
              style={{ background: C.base, border: `1px solid ${C.line}`, color: C.fgMute }}
              aria-hidden="true"
            >
              <Search size={24} />
            </span>
            <p className="mt-5 text-[21px] font-bold" style={{ color: C.fg }}>
              Niets gevonden in het donker
            </p>
            <p className="mx-auto mt-2 max-w-xs text-[13px]" style={{ color: C.fgSoft }}>
              Geen opdracht bij {q ? `“${q}”` : "je zoekterm"}. Probeer een ander woord — er
              verschijnt vast iets uit de mist.
            </p>
            <div className="mt-6">
              <GlowButton onClick={() => setQ("")} tone={C.cyan}>
                Zoekterm wissen <ArrowRight size={14} aria-hidden="true" />
              </GlowButton>
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
  const tone = strong ? C.cyan : C.violet;
  return (
    <Panel
      className="p-5"
      interactive
      as="article"
      lit={strong}
      litColor={tone}
      style={{ "--nb-hover": tone } as React.CSSProperties}
    >
      <div className="grid grid-cols-[1fr_auto] items-start gap-4">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span
              className="inline-flex items-center rounded-full px-2 py-0.5 text-[9.5px] font-bold uppercase tracking-[0.1em]"
              style={{ color: C.fgMute, border: `1px solid ${C.line}`, ...num }}
            >
              #{String(index + 1).padStart(2, "0")}
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
                  background: C.base,
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
            style={{
              background: `${tone}18`,
              border: `1px solid ${tone}66`,
              boxShadow: strong ? glow(tone, 0.4) : "none",
            }}
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
          className="inline-flex items-center gap-1.5 rounded-full px-3.5 py-2 text-[11.5px] font-bold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#22d3ee] focus-visible:ring-offset-2 focus-visible:ring-offset-[#12121b]"
          style={{ color: C.fg, border: `1px solid ${C.line}`, ...bodyFont }}
        >
          {open ? <Minus size={12} aria-hidden="true" /> : <Plus size={12} aria-hidden="true" />}
          Waarom deze match
        </button>
        <div className="ml-auto">
          <GlowButton onClick={onOpen} tone={tone}>
            Reageer <ArrowRight size={13} aria-hidden="true" />
          </GlowButton>
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
              tone={C.green}
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
      style={{ background: C.base, border: `1px solid ${C.line}`, borderLeft: `3px solid ${tone}` }}
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
  const tone = strong ? C.cyan : C.violet;
  return (
    <div className="space-y-5 pt-6">
      <button
        type="button"
        onClick={onBack}
        className="inline-flex items-center gap-2 rounded-full px-4 py-2 text-[12.5px] font-bold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#22d3ee] focus-visible:ring-offset-2 focus-visible:ring-offset-[#0a0a0f]"
        style={{ color: C.fg, border: `1px solid ${C.line}`, background: C.panel, ...bodyFont }}
      >
        <ArrowRight size={13} aria-hidden="true" className="rotate-180" /> Terug naar marktplaats
      </button>

      <Panel className="p-7 md:p-8" lit litColor={tone}>
        <span
          aria-hidden="true"
          className="pointer-events-none absolute -right-20 -top-20 h-56 w-56 rounded-full"
          style={{ background: `radial-gradient(circle, ${tone}33, transparent 70%)` }}
        />
        <div className="flex flex-wrap items-center gap-2">
          <span
            className="inline-flex items-center rounded-full px-2.5 py-0.5 text-[10.5px] font-bold"
            style={{ color: C.fgMute, border: `1px solid ${C.line}`, ...num }}
          >
            {opdracht.id}
          </span>
          <span
            className="inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-bold"
            style={{ color: C.void, background: tone, boxShadow: glow(tone, 0.5), ...bodyFont }}
          >
            <Zap size={11} aria-hidden="true" /> {strong ? "Sterke match" : "Goede match"} ·{" "}
            {opdracht.match}%
          </span>
        </div>
        <h1
          className="mt-4 max-w-2xl text-[28px] font-bold leading-[1.1] tracking-[-0.01em] md:text-[38px]"
          style={{ color: C.fg }}
        >
          {opdracht.titel}
        </h1>
        <p className="mt-2 text-[13.5px]" style={{ color: C.fgSoft }}>
          {opdracht.opdrachtgever} · {opdracht.plaats}
        </p>
        <div className="mt-6 flex flex-wrap gap-2.5">
          <GlowButton tone={tone}>
            Reageer op opdracht <ArrowRight size={14} aria-hidden="true" />
          </GlowButton>
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
        <Eyebrow>Waarom deze match oplicht</Eyebrow>
        <p className="mt-3 max-w-xl text-[13.5px] leading-relaxed" style={{ color: C.fgSoft }}>
          Afgezet tegen je geverifieerde profiel — wat in je voordeel spreekt licht groen op, wat je
          moet weten amber. Open en zonder verborgen score.
        </p>
        <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
          <Panel className="p-6" lit litColor={C.green}>
            <p
              className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-[0.14em]"
              style={{ color: C.green, ...bodyFont }}
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
                    style={{ color: C.green }}
                  />
                  {r}
                </li>
              ))}
            </ul>
          </Panel>
          <Panel className="p-6" lit litColor={C.amber}>
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
        </div>
        <p className="mt-4 text-[12px] font-bold" style={{ color: tone, ...bodyFont }}>
          Match {opdracht.match}% —{" "}
          {strong ? "sterk afgestemd op jouw profiel." : "goed afgestemd op jouw profiel."}
        </p>
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
      <Panel className="p-7 md:p-8" lit litColor={C.green}>
        <div className="flex flex-wrap items-center justify-between gap-6">
          <div className="max-w-md">
            <Eyebrow tone={C.green}>Verificatie</Eyebrow>
            <h1
              className="mt-3 text-[26px] font-bold leading-tight tracking-[-0.01em]"
              style={{ color: C.fg }}
            >
              Jouw certificaten
            </h1>
            <p className="mt-3 text-[13.5px] leading-relaxed" style={{ color: C.fgSoft }}>
              <span className="font-bold" style={{ color: C.green }}>
                {PROFIEL.trust}.
              </span>{" "}
              {verified} van de {CREDENTIALS.length} certificaten zijn geverifieerd. Eén verloopt
              binnenkort — die licht amber op. Je documenten blijven versleuteld en privé.
            </p>
            <div className="mt-4 max-w-xs">
              <GlowMeter value={ratio} tone={C.green} />
            </div>
          </div>
          <span
            className="inline-flex h-24 w-24 flex-col items-center justify-center rounded-full"
            style={{
              background: `${C.green}18`,
              border: `1px solid ${C.green}66`,
              boxShadow: glow(C.green, 0.5),
            }}
          >
            <span className="text-[28px] font-bold leading-none" style={{ color: C.green, ...num }}>
              {ratio}
            </span>
            <span
              className="mt-1 text-[8px] font-bold uppercase tracking-[0.16em]"
              style={{ color: C.green }}
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
                  className="grid w-full grid-cols-[auto_1fr_auto] items-center gap-4 px-5 py-4 text-left transition-colors hover:bg-[#181826] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#22d3ee] motion-reduce:transition-none"
                >
                  <span
                    className="inline-flex h-10 w-10 items-center justify-center rounded-full"
                    style={{
                      background: `${st.ink}18`,
                      border: `1px solid ${st.ink}66`,
                      color: st.ink,
                      boxShadow: st.alarm ? glow(st.ink, 0.4) : "none",
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
                    <span
                      className="hidden w-max items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-bold sm:inline-flex"
                      style={{
                        color: st.ink,
                        background: `${st.ink}18`,
                        border: `1px solid ${st.ink}66`,
                        ...bodyFont,
                      }}
                    >
                      <st.Icon size={11} aria-hidden="true" />
                      {st.label}
                      {st.alarm && <span className="sr-only"> (let op)</span>}
                    </span>
                    <span
                      className="transition-transform motion-reduce:transition-none"
                      style={{
                        color: C.fgFaint,
                        transform: isOpen ? "rotate(45deg)" : "rotate(0deg)",
                      }}
                      aria-hidden="true"
                    >
                      <Plus size={16} />
                    </span>
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
                        style={{ background: C.base, border: `1px solid ${C.line}` }}
                      >
                        <p
                          className="max-w-xl text-[13px] leading-relaxed"
                          style={{ color: C.fgSoft }}
                        >
                          {c.detail}. Je document wordt versleuteld bewaard en alleen na jouw
                          expliciete toestemming gedeeld met een opdrachtgever.
                        </p>
                        <div className="mt-3 flex flex-wrap gap-2">
                          <GlowButton tone={c.status === "EXPIRING" ? C.amber : C.cyan}>
                            {c.status === "EXPIRING" ? "Vernieuwen" : "Bekijken"}
                          </GlowButton>
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
          <Eyebrow tone={C.violet}>Documentenkast</Eyebrow>
        </div>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {DOCUMENTEN.map((d) => {
            const st = statusMeta(d.status);
            return (
              <Panel key={d.naam} className="flex items-center gap-3 p-4">
                <span
                  className="inline-flex h-9 w-9 items-center justify-center rounded-full"
                  style={{ background: C.base, border: `1px solid ${C.line}`, color: C.fgSoft }}
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
                <span
                  className="inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[10px] font-bold"
                  style={{
                    color: st.ink,
                    background: `${st.ink}18`,
                    border: `1px solid ${st.ink}66`,
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
    <div className="space-y-5 pt-6">
      <div>
        <Eyebrow>Acties · op volgorde van urgentie</Eyebrow>
        <h1
          className="mt-3 text-[30px] font-bold leading-none tracking-[-0.01em]"
          style={{ color: C.fg }}
        >
          Wat vandaag oplicht
        </h1>
        <p className="mt-2 max-w-md text-[13.5px]" style={{ color: C.fgSoft }}>
          De urgente actie gloeit fel; de rest zakt weg tot je eraan toe bent. Eén ding tegelijk.
        </p>
      </div>

      <ol className="space-y-3">
        {ACTIES.map((a, i) => {
          const warn = a.urgentie === "warning";
          const tone = warn ? C.amber : C.cyan;
          return (
            <li key={a.titel}>
              <Panel
                className="p-5"
                interactive
                lit={warn}
                litColor={tone}
                style={{ "--nb-hover": tone } as React.CSSProperties}
              >
                <div className="grid grid-cols-[auto_1fr] items-start gap-4 sm:grid-cols-[auto_1fr_auto]">
                  <span
                    className="flex h-10 w-10 items-center justify-center rounded-full text-[14px] font-bold"
                    style={{
                      background: `${tone}18`,
                      border: `1px solid ${tone}66`,
                      color: tone,
                      boxShadow: warn ? glow(tone, 0.4) : "none",
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
                        background: `${tone}18`,
                        border: `1px solid ${tone}66`,
                        ...bodyFont,
                      }}
                    >
                      {warn ? (
                        <AlertTriangle size={10} aria-hidden="true" />
                      ) : (
                        <Sparkles size={10} aria-hidden="true" />
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
                    <GlowButton tone={tone}>
                      {a.cta}
                      <ArrowRight size={13} aria-hidden="true" />
                    </GlowButton>
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
  if (status === "Betaald") return { ink: C.green, Icon: Check };
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
          <Eyebrow>Facturen</Eyebrow>
          <h1
            className="mt-3 text-[30px] font-bold leading-none tracking-[-0.01em]"
            style={{ color: C.fg }}
          >
            Jouw facturen
          </h1>
        </div>
        <GlowButton tone={C.cyan}>
          <Plus size={14} aria-hidden="true" /> Nieuwe factuur
        </GlowButton>
      </div>

      <section className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {[
          { l: "Betaald", v: "€ 8.622", sub: "3 facturen", alarm: false, tone: C.green },
          { l: "Openstaand", v: "€ 1.350", sub: "1 factuur · 9 dagen", alarm: true, tone: C.rose },
          { l: "Concept", v: "€ 880", sub: "klaar om te versturen", alarm: false, tone: C.fgMute },
        ].map((s) => (
          <Panel
            key={s.l}
            className="p-5"
            interactive
            lit={s.alarm}
            litColor={s.tone}
            style={{ "--nb-hover": s.tone } as React.CSSProperties}
          >
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
              className="mt-2 text-[26px] font-bold tracking-[-0.01em]"
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
          <GhostButton
            key={s}
            onClick={() => setSort(s)}
            active={sort === s}
            ariaPressed={sort === s}
          >
            <ArrowUpDown size={12} aria-hidden="true" />
            {s === "datum" ? "Op datum" : "Op bedrag"}
          </GhostButton>
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
                    className="transition-colors hover:bg-[#181826]"
                    style={{
                      background: i % 2 === 1 ? C.base : "transparent",
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
                          background: `${ft.ink}18`,
                          border: `1px solid ${ft.ink}66`,
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

      <Panel className="flex items-center gap-3 p-4" lit litColor={C.rose}>
        <span
          className="inline-flex h-9 w-9 items-center justify-center rounded-full"
          style={{ background: `${C.rose}18`, border: `1px solid ${C.rose}66`, color: C.rose }}
          aria-hidden="true"
        >
          <Send size={15} />
        </span>
        <p className="min-w-0 flex-1 text-[12.5px]" style={{ color: C.fgSoft }}>
          Eén factuur staat{" "}
          <span className="font-bold" style={{ color: C.rose }}>
            9 dagen open
          </span>{" "}
          — stuur een vriendelijke herinnering.
        </p>
        <GlowButton tone={C.rose}>Herinnering</GlowButton>
      </Panel>
    </div>
  );
}
