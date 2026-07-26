"use client";

// Concept 472 — "Meterkast" · Radiale gauges/wijzerplaten als data-viz. Elk cijfer is een afleesbare
// meter met SVG-boog, fijne schaalstreepjes en een wijzer — industrieel-strakke "meterkast"-esthetiek in
// donkergroen/olijf met witte cijfers. Belang wordt afgelezen als op een instrumentpaneel: match-percentages
// als ronde dials, omzet als gevulde boog. Strak, kalm, meetbaar — niet druk.

import { useMemo, useState } from "react";
import {
  Activity,
  AlertTriangle,
  ArrowRight,
  ArrowUpDown,
  Bell,
  Check,
  ChevronRight,
  Clock,
  FileText,
  Gauge as GaugeIcon,
  Minus,
  Plus,
  Search,
  ShieldCheck,
  TrendingDown,
  TrendingUp,
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

// — Palet: donkergroen/olijf instrumentpaneel met witte afleescijfers —
const C = {
  base: "#0a120d", // diepste achtergrond
  panel: "#0f1a14", // paneel
  panelHi: "#14241b", // opgelicht paneel
  well: "#0b1510", // ingesleten meter-put
  line: "#22362b", // hairline
  lineHi: "#2f4a3b", // fellere hairline
  tick: "#3a5747", // schaalstreepjes
  fg: "#e7efe9", // primaire tekst (afleescijfers)
  fgSoft: "#a7bcb0", // zachte tekst
  fgMute: "#71887b", // gedempte tekst
  fgFaint: "#516357", // faint
  green: "#34d17a", // primair accent (goed / hoog)
  greenDim: "#123322",
  olive: "#a3b565", // olijf-secundair
  amber: "#e0a13c", // let op / verloopt
  amberDim: "#3a2c10",
  red: "#ef6a5f", // afgewezen / urgent
  redDim: "#3a1815",
};

const bodyFont = { fontFamily: "'Inter', 'Segoe UI', system-ui, -apple-system, sans-serif" };
const num = {
  fontFamily: "ui-monospace, 'SFMono-Regular', 'Menlo', 'Consolas', monospace",
  fontVariantNumeric: "tabular-nums" as const,
};

function meterkastBg(): React.CSSProperties {
  return {
    backgroundColor: C.base,
    backgroundImage: [
      "radial-gradient(80% 50% at 50% -8%, rgba(52,209,122,0.06) 0%, rgba(52,209,122,0) 60%)",
      "linear-gradient(180deg, #0c1611 0%, #0a120d 100%)",
    ].join(","),
  };
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
      return { label: "In behandeling", Icon: Clock, alarm: false, ink: C.olive, dim: "#2a3318" };
    case "EXPIRING":
      return {
        label: "Verloopt binnenkort",
        Icon: AlertTriangle,
        alarm: true,
        ink: C.amber,
        dim: C.amberDim,
      };
    case "REJECTED":
      return { label: "Afgewezen", Icon: AlertTriangle, alarm: true, ink: C.red, dim: C.redDim };
  }
}

// polair → cartesisch; hoek in graden, met de klok mee vanaf 3 uur (y omlaag).
function polar(cx: number, cy: number, r: number, deg: number): { x: number; y: number } {
  const a = (deg * Math.PI) / 180;
  return { x: cx + r * Math.cos(a), y: cy + r * Math.sin(a) };
}

// — Radiale gauge: 270°-boog open aan de onderkant, met track, waardeboog, schaalstreepjes en wijzer —
function Gauge({
  value,
  size = 150,
  tone = C.green,
  label,
  display,
  sub,
  ticks = 12,
}: {
  value: number; // 0..100 vulgraad
  size?: number;
  tone?: string;
  label?: string;
  display: string; // groot afleescijfer
  sub?: string;
  ticks?: number;
}) {
  const clamped = Math.max(0, Math.min(100, value));
  const cx = size / 2;
  const cy = size / 2;
  const stroke = Math.max(7, size * 0.075);
  const r = cx - stroke / 2 - size * 0.09;
  const circ = 2 * Math.PI * r;
  const arcFrac = 0.75; // 270°
  const trackDash = `${arcFrac * circ} ${circ - arcFrac * circ}`;
  const valueDash = `${(clamped / 100) * arcFrac * circ} ${circ}`;
  // Boog begint bij 135° (7:30) en loopt met de klok mee 270° tot 45° (4:30).
  const rot = `rotate(135 ${cx} ${cy})`;
  const tickR1 = r + stroke / 2 + size * 0.02;
  const tickR2 = r + stroke / 2 + size * 0.065;
  const needleDeg = 135 + (clamped / 100) * 270;
  const needleEnd = polar(cx, cy, r - stroke * 0.35, needleDeg);

  return (
    <div className="relative inline-flex flex-col items-center" style={{ width: size }}>
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        role="img"
        aria-label={`${label ? label + ": " : ""}${display}`}
      >
        {/* ingesleten put */}
        <circle
          cx={cx}
          cy={cy}
          r={r + stroke * 0.9}
          fill={C.well}
          stroke={C.line}
          strokeWidth={1}
        />
        {/* schaalstreepjes */}
        {Array.from({ length: ticks + 1 }).map((_, i) => {
          const f = i / ticks;
          const deg = 135 + f * 270;
          const p1 = polar(cx, cy, tickR1, deg);
          const p2 = polar(cx, cy, tickR2, deg);
          const major = i % 3 === 0;
          return (
            <line
              key={i}
              x1={p1.x}
              y1={p1.y}
              x2={p2.x}
              y2={p2.y}
              stroke={f <= clamped / 100 ? tone : C.tick}
              strokeWidth={major ? 2 : 1}
              strokeLinecap="round"
              opacity={f <= clamped / 100 ? 0.9 : 0.6}
            />
          );
        })}
        {/* track */}
        <circle
          cx={cx}
          cy={cy}
          r={r}
          fill="none"
          stroke={C.line}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={trackDash}
          transform={rot}
        />
        {/* waardeboog */}
        <circle
          cx={cx}
          cy={cy}
          r={r}
          fill="none"
          stroke={tone}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={valueDash}
          transform={rot}
          style={{
            transition: "stroke-dasharray 0.9s cubic-bezier(0.22,1,0.36,1)",
            filter: `drop-shadow(0 0 4px ${tone}66)`,
          }}
        />
        {/* wijzer */}
        <line
          x1={cx}
          y1={cy}
          x2={needleEnd.x}
          y2={needleEnd.y}
          stroke={C.fg}
          strokeWidth={2}
          strokeLinecap="round"
          opacity={0.85}
        />
        <circle cx={cx} cy={cy} r={size * 0.03} fill={C.fg} />
        <circle cx={cx} cy={cy} r={size * 0.055} fill="none" stroke={C.lineHi} strokeWidth={1} />
      </svg>
      <div
        className="pointer-events-none absolute inset-x-0 flex flex-col items-center"
        style={{ top: "38%" }}
      >
        <span
          className="text-[19px] font-bold leading-none tracking-tight"
          style={{ color: C.fg, ...num }}
        >
          {display}
        </span>
        {sub && (
          <span
            className="mt-1 text-[8.5px] font-bold uppercase tracking-[0.16em]"
            style={{ color: C.fgMute }}
          >
            {sub}
          </span>
        )}
      </div>
      {label && (
        <span
          className="mt-1 text-center text-[10px] font-bold uppercase tracking-[0.14em]"
          style={{ color: C.fgSoft, ...bodyFont }}
        >
          {label}
        </span>
      )}
    </div>
  );
}

// — Horizontale gevulde boog (mini) voor omzet-achtige waarden in tabellen —
function MiniArc({ value, tone = C.green }: { value: number; tone?: string }) {
  const clamped = Math.max(0, Math.min(100, value));
  const w = 120;
  const h = 44;
  const cx = w / 2;
  const cy = h - 4;
  const r = 40;
  const start = polar(cx, cy, r, 180);
  const end = polar(cx, cy, r, 360);
  const valEnd = polar(cx, cy, r, 180 + (clamped / 100) * 180);
  const large = clamped > 50 ? 1 : 0;
  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} aria-hidden="true">
      <path
        d={`M ${start.x} ${start.y} A ${r} ${r} 0 0 1 ${end.x} ${end.y}`}
        fill="none"
        stroke={C.line}
        strokeWidth={6}
        strokeLinecap="round"
      />
      <path
        d={`M ${start.x} ${start.y} A ${r} ${r} 0 ${large} 1 ${valEnd.x} ${valEnd.y}`}
        fill="none"
        stroke={tone}
        strokeWidth={6}
        strokeLinecap="round"
        style={{ transition: "all 0.8s cubic-bezier(0.22,1,0.36,1)" }}
      />
    </svg>
  );
}

function Panel({
  children,
  className = "",
  as: Tag = "div",
  interactive = false,
  tint = C.panel,
}: {
  children: React.ReactNode;
  className?: string;
  as?: "div" | "section" | "li" | "article";
  interactive?: boolean;
  tint?: string;
}) {
  return (
    <Tag
      className={`mk-panel relative overflow-hidden rounded-xl ${interactive ? "mk-panel--int" : ""} ${className}`}
      style={{
        background: tint,
        border: `1px solid ${C.line}`,
        boxShadow: "inset 0 1px 0 rgba(255,255,255,0.02), 0 10px 26px -20px rgba(0,0,0,0.9)",
        color: C.fg,
      }}
    >
      {children}
    </Tag>
  );
}

function Eyebrow({ children, tone = C.green }: { children: React.ReactNode; tone?: string }) {
  return (
    <p
      className="flex items-center gap-2 text-[10.5px] font-bold uppercase tracking-[0.2em]"
      style={{ color: tone, ...bodyFont }}
    >
      <GaugeIcon size={13} aria-hidden="true" />
      {children}
    </p>
  );
}

function SolidButton({
  children,
  onClick,
  tone = C.green,
  className = "",
}: {
  children: React.ReactNode;
  onClick?: () => void;
  tone?: string;
  className?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`group inline-flex items-center justify-center gap-2 rounded-lg px-5 py-2.5 text-[12.5px] font-bold transition-all duration-150 hover:brightness-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#34d17a] focus-visible:ring-offset-2 focus-visible:ring-offset-[#0a120d] active:translate-y-px motion-reduce:transition-none ${className}`}
      style={{
        color: C.base,
        background: tone,
        boxShadow: `0 3px 12px -4px ${tone}88`,
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
      className={`inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-[12px] font-bold transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#34d17a] focus-visible:ring-offset-2 focus-visible:ring-offset-[#0a120d] motion-reduce:transition-none ${className}`}
      style={{
        color: active ? C.base : C.fgSoft,
        background: active ? C.green : "transparent",
        border: `1px solid ${active ? C.green : C.line}`,
        ...bodyFont,
      }}
    >
      {children}
    </button>
  );
}

// Vertaal een KPI naar een gauge-vulgraad (mock-viz, deterministisch afgeleid uit de waarde).
function kpiPct(label: string, value: string): number {
  const n = parseInt(value.replace(/\D/g, ""), 10) || 0;
  if (label.includes("Match")) return n;
  if (label.toLowerCase().includes("reacties")) return Math.min(100, n * 10);
  if (label.includes("Omzet")) return Math.min(100, Math.round((n / 10000) * 100));
  return Math.min(100, Math.round((n / 3000) * 100));
}

export function Concept472() {
  const [screen, setScreen] = useState<ScreenKey>("dashboard");
  const active = OPDRACHTEN[0] as Opdracht;

  return (
    <div
      className="relative min-h-[720px] w-full antialiased"
      style={{ ...bodyFont, color: C.fg, ...meterkastBg() }}
    >
      <style>{`
        @keyframes mkRise { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
        .mk-rise { animation: mkRise 0.5s cubic-bezier(0.22, 1, 0.36, 1) both; }
        .mk-panel--int { transition: transform 0.25s cubic-bezier(0.22,1,0.36,1), border-color 0.25s, box-shadow 0.25s; }
        .mk-panel--int:hover { transform: translateY(-2px); border-color: ${C.lineHi}; box-shadow: inset 0 1px 0 rgba(255,255,255,0.03), 0 16px 30px -22px rgba(0,0,0,1); }
        @media (prefers-reduced-motion: reduce) { .mk-rise { animation: none !important; } .mk-panel--int { transition: none !important; } .mk-panel--int:hover { transform: none !important; } }
      `}</style>

      <div className="relative mx-auto max-w-6xl px-4 pb-24 sm:px-6 md:px-8">
        <TopBar />
        <NavBar screen={screen} setScreen={setScreen} />
        <main key={screen} className="mk-rise pt-6">
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
          className="inline-flex h-11 w-11 items-center justify-center rounded-xl"
          style={{
            background: C.well,
            border: `1px solid ${C.lineHi}`,
            color: C.green,
            boxShadow: `inset 0 0 12px -4px ${C.green}55`,
          }}
          aria-hidden="true"
        >
          <GaugeIcon size={20} strokeWidth={2.2} />
        </span>
        <div>
          <p className="text-[19px] font-bold leading-none tracking-tight" style={{ color: C.fg }}>
            Meterkast
          </p>
          <p className="mt-1.5 text-[11px] leading-none" style={{ color: C.fgMute }}>
            {PROFIEL.plaats} · alle meters
          </p>
        </div>
      </div>
      <div className="flex items-center gap-3">
        <span
          className="hidden items-center gap-1.5 rounded-md px-3 py-1.5 text-[11px] font-bold sm:inline-flex"
          style={{ color: C.green, background: C.greenDim, border: `1px solid ${C.green}55` }}
        >
          <ShieldCheck size={12} aria-hidden="true" />
          {PROFIEL.trust}
        </span>
        <span
          className="relative inline-flex h-9 w-9 items-center justify-center rounded-md"
          style={{ background: C.panel, border: `1px solid ${C.line}`, color: C.fgSoft }}
          aria-label={`${ongelezen} ongelezen berichten`}
        >
          <Bell size={15} aria-hidden="true" />
          {ongelezen > 0 && (
            <span
              className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full text-[9px] font-bold"
              style={{ background: C.red, color: C.base, ...num }}
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
          className="inline-flex h-10 w-10 items-center justify-center rounded-md text-[12.5px] font-bold"
          style={{ background: C.well, border: `1px solid ${C.lineHi}`, color: C.olive, ...num }}
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
        className="flex items-stretch gap-1 overflow-x-auto rounded-lg p-1.5"
        style={{ background: C.well, border: `1px solid ${C.line}` }}
      >
        {SCREENS.map((s) => {
          const on = s.key === screen;
          return (
            <button
              key={s.key}
              type="button"
              onClick={() => setScreen(s.key)}
              aria-current={on ? "page" : undefined}
              className="shrink-0 rounded-md px-4 py-2 text-[12.5px] font-bold transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#34d17a] focus-visible:ring-offset-1 focus-visible:ring-offset-[#0b1510] motion-reduce:transition-none"
              style={{
                color: on ? C.base : C.fgSoft,
                background: on ? C.green : "transparent",
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
  const ratio = Math.round((verified / CREDENTIALS.length) * 100);
  return (
    <div className="space-y-5 pt-6">
      <section className="grid grid-cols-1 gap-5 lg:grid-cols-[1.4fr_1fr]">
        <Panel className="p-7 md:p-8" interactive>
          <Eyebrow>Paneel · vandaag</Eyebrow>
          <h1
            className="mt-4 text-[30px] font-bold leading-[1.08] tracking-[-0.01em] md:text-[40px]"
            style={{ color: C.fg }}
          >
            Alles op de meters, {PROFIEL.naam.split(" ")[0]}.
          </h1>
          <p className="mt-3 max-w-md text-[13.5px] leading-relaxed" style={{ color: C.fgSoft }}>
            Je certificaten staan in het groen en de matches lopen hoog uit. Eén wijzer staat in het
            oranje — die lees je zo af en zet je recht.
          </p>
          <div className="mt-6 flex flex-wrap items-center gap-2.5">
            <SolidButton onClick={onActies}>
              Volgende actie
              <ArrowRight
                size={14}
                aria-hidden="true"
                className="transition-transform group-hover:translate-x-0.5 motion-reduce:transition-none"
              />
            </SolidButton>
            <GhostButton onClick={onOpen}>Naar de marktplaats</GhostButton>
          </div>
        </Panel>

        <Panel
          className="flex flex-col items-center justify-center p-6"
          interactive
          tint={C.panelHi}
        >
          <Eyebrow tone={C.green}>Verificatiemeter</Eyebrow>
          <div className="mt-3">
            <Gauge
              value={ratio}
              display={`${ratio}%`}
              sub="in orde"
              label="Certificaten"
              tone={C.green}
              size={168}
            />
          </div>
          <p className="mt-1 text-center text-[12px]" style={{ color: C.fgMute }}>
            {verified} van {CREDENTIALS.length} geverifieerd
          </p>
        </Panel>
      </section>

      <section>
        <div className="mb-3">
          <Eyebrow>Meters · deze maand</Eyebrow>
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {KPIS.map((k) => {
            const up = k.up;
            const tone = up ? C.green : C.amber;
            const Trend = up ? TrendingUp : TrendingDown;
            const pct = kpiPct(k.label, k.value);
            return (
              <Panel key={k.label} className="flex flex-col items-center p-5" interactive>
                <div className="flex w-full items-center justify-between">
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
                    <Trend size={11} aria-hidden="true" /> {k.trend.replace(/^[+-]/, "")}
                  </span>
                </div>
                <div className="mt-2">
                  <Gauge value={pct} display={k.value} tone={tone} size={132} ticks={9} />
                </div>
              </Panel>
            );
          })}
        </div>
      </section>

      <section className="grid grid-cols-1 gap-5 lg:grid-cols-[1.4fr_1fr]">
        <div>
          <div className="mb-3 flex items-baseline justify-between">
            <Eyebrow>Match-dials</Eyebrow>
            <button
              type="button"
              onClick={onOpen}
              className="text-[11px] font-bold uppercase tracking-[0.14em] transition-colors hover:opacity-70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#34d17a] focus-visible:ring-offset-2 focus-visible:ring-offset-[#0a120d]"
              style={{ color: C.green, ...bodyFont }}
            >
              Alle →
            </button>
          </div>
          <ul className="space-y-3">
            {OPDRACHTEN.map((o) => {
              const strong = o.match >= 90;
              const tone = strong ? C.green : C.olive;
              return (
                <li key={o.id}>
                  <Panel className="p-4" interactive as="article">
                    <button
                      type="button"
                      onClick={onOpen}
                      className="group flex w-full items-center gap-4 text-left focus-visible:outline-none"
                    >
                      <span className="shrink-0" aria-hidden="true">
                        <Gauge
                          value={o.match}
                          display={`${o.match}`}
                          sub="match"
                          tone={tone}
                          size={78}
                          ticks={9}
                        />
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
            <Eyebrow tone={C.amber}>Vraagt aandacht</Eyebrow>
          </div>
          <Panel className="p-6" tint={C.panelHi}>
            <div className="flex items-center justify-between">
              <span
                className="inline-flex items-center gap-1.5 rounded-md px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.12em]"
                style={{ color: C.amber, background: C.amberDim, border: `1px solid ${C.amber}55` }}
              >
                <AlertTriangle size={11} aria-hidden="true" /> Oranje
              </span>
              <Activity size={16} aria-hidden="true" style={{ color: C.amber }} />
            </div>
            <h2 className="mt-3 text-[18px] font-bold leading-snug" style={{ color: C.fg }}>
              {primair.titel}
            </h2>
            <p className="mt-2 text-[13px] leading-relaxed" style={{ color: C.fgSoft }}>
              {primair.detail}
            </p>
            <div className="mt-5">
              <SolidButton onClick={onActies} tone={C.amber} className="w-full">
                {primair.cta}
                <ArrowRight size={14} aria-hidden="true" />
              </SolidButton>
            </div>
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
          className="flex flex-1 items-center gap-2.5 rounded-lg px-5 py-3 focus-within:border-[#34d17a]"
          style={{ background: C.well, border: `1px solid ${C.line}` }}
        >
          <Search size={16} aria-hidden="true" style={{ color: C.fgFaint }} />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Zoek op titel, plaats of opdrachtgever…"
            aria-label="Opdrachten zoeken"
            className="w-full bg-transparent text-[13px] outline-none placeholder:text-[#71887b]"
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
                <div className="flex items-center gap-4">
                  <div className="h-16 w-16 shrink-0 rounded-full" style={{ background: C.well }} />
                  <div className="flex-1 animate-pulse space-y-3 motion-reduce:animate-none">
                    <div className="h-3 w-24 rounded" style={{ background: C.panelHi }} />
                    <div className="h-5 w-2/3 rounded" style={{ background: C.panelHi }} />
                    <div className="h-3 w-1/2 rounded" style={{ background: C.panelHi }} />
                  </div>
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
              style={{ background: C.well, border: `1px solid ${C.line}`, color: C.fgMute }}
              aria-hidden="true"
            >
              <Search size={24} />
            </span>
            <p className="mt-5 text-[21px] font-bold" style={{ color: C.fg }}>
              Meters op nul
            </p>
            <p className="mx-auto mt-2 max-w-xs text-[13px]" style={{ color: C.fgSoft }}>
              Geen opdracht bij {q ? `“${q}”` : "je zoekterm"}. Probeer een ander woord — dan slaan
              de wijzers vast weer uit.
            </p>
            <div className="mt-6">
              <SolidButton onClick={() => setQ("")}>
                Zoekterm wissen <ArrowRight size={14} aria-hidden="true" />
              </SolidButton>
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
  const tone = strong ? C.green : C.olive;
  return (
    <Panel className="p-5" interactive as="article">
      <div className="grid grid-cols-[auto_1fr] items-start gap-4 sm:grid-cols-[auto_1fr_auto]">
        <span className="shrink-0" aria-hidden="true">
          <Gauge
            value={opdracht.match}
            display={`${opdracht.match}`}
            sub="match"
            tone={tone}
            size={92}
            ticks={9}
          />
        </span>
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span
              className="inline-flex items-center rounded px-2 py-0.5 text-[9.5px] font-bold uppercase tracking-[0.1em]"
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
                className="inline-flex items-center rounded px-2.5 py-0.5 text-[10.5px] font-semibold"
                style={{
                  color: C.fgSoft,
                  background: C.well,
                  border: `1px solid ${C.line}`,
                  ...bodyFont,
                }}
              >
                {t}
              </span>
            ))}
          </div>
        </div>
        <div className="col-span-2 flex items-center justify-between sm:col-span-1 sm:flex-col sm:items-end sm:justify-start sm:gap-1.5">
          <span className="text-[15px] font-bold" style={{ color: C.fg, ...num }}>
            {opdracht.tarief}
          </span>
        </div>
      </div>
      <div className="mt-4 flex items-center gap-3">
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          className="inline-flex items-center gap-1.5 rounded-lg px-3.5 py-2 text-[11.5px] font-bold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#34d17a] focus-visible:ring-offset-2 focus-visible:ring-offset-[#0f1a14]"
          style={{ color: C.fg, border: `1px solid ${C.line}`, ...bodyFont }}
        >
          {open ? <Minus size={12} aria-hidden="true" /> : <Plus size={12} aria-hidden="true" />}
          Waarom deze match
        </button>
        <div className="ml-auto">
          <SolidButton onClick={onOpen} tone={tone}>
            Reageer <ArrowRight size={13} aria-hidden="true" />
          </SolidButton>
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
      className="rounded-lg p-4"
      style={{ background: C.well, border: `1px solid ${C.line}`, borderLeft: `3px solid ${tone}` }}
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
  const tone = strong ? C.green : C.olive;
  return (
    <div className="space-y-5 pt-6">
      <button
        type="button"
        onClick={onBack}
        className="inline-flex items-center gap-2 rounded-lg px-4 py-2 text-[12.5px] font-bold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#34d17a] focus-visible:ring-offset-2 focus-visible:ring-offset-[#0a120d]"
        style={{ color: C.fg, border: `1px solid ${C.line}`, background: C.panel, ...bodyFont }}
      >
        <ArrowRight size={13} aria-hidden="true" className="rotate-180" /> Terug naar marktplaats
      </button>

      <Panel className="p-7 md:p-8">
        <div className="grid grid-cols-1 items-center gap-6 sm:grid-cols-[auto_1fr]">
          <span className="mx-auto shrink-0 sm:mx-0" aria-hidden="true">
            <Gauge
              value={opdracht.match}
              display={`${opdracht.match}%`}
              sub="match"
              label="Afstemming"
              tone={tone}
              size={168}
            />
          </span>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span
                className="inline-flex items-center rounded px-2.5 py-0.5 text-[10.5px] font-bold"
                style={{ color: C.fgMute, border: `1px solid ${C.line}`, ...num }}
              >
                {opdracht.id}
              </span>
              <span
                className="inline-flex items-center gap-1 rounded px-2.5 py-0.5 text-[11px] font-bold"
                style={{ color: C.base, background: tone, ...bodyFont }}
              >
                <GaugeIcon size={11} aria-hidden="true" /> {strong ? "Sterke match" : "Goede match"}
              </span>
            </div>
            <h1
              className="mt-3 max-w-2xl text-[26px] font-bold leading-[1.1] tracking-[-0.01em] md:text-[34px]"
              style={{ color: C.fg }}
            >
              {opdracht.titel}
            </h1>
            <p className="mt-2 text-[13.5px]" style={{ color: C.fgSoft }}>
              {opdracht.opdrachtgever} · {opdracht.plaats}
            </p>
            <div className="mt-5 flex flex-wrap gap-2.5">
              <SolidButton tone={tone}>
                Reageer op opdracht <ArrowRight size={14} aria-hidden="true" />
              </SolidButton>
              <GhostButton>Bewaren</GhostButton>
            </div>
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
        <Eyebrow>Waarom deze match afleest zoals hij afleest</Eyebrow>
        <p className="mt-3 max-w-xl text-[13.5px] leading-relaxed" style={{ color: C.fgSoft }}>
          Afgezet tegen je geverifieerde profiel — wat de wijzer omhoog duwt én wat je moet weten.
          Open en zonder verborgen score.
        </p>
        <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
          <Panel className="p-6">
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
      <Panel className="p-7 md:p-8">
        <div className="grid grid-cols-1 items-center gap-6 sm:grid-cols-[auto_1fr]">
          <span className="mx-auto shrink-0 sm:mx-0" aria-hidden="true">
            <Gauge
              value={ratio}
              display={`${ratio}%`}
              sub="in orde"
              label="Verificatie"
              tone={C.green}
              size={168}
            />
          </span>
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
              {verified} van de {CREDENTIALS.length} certificaten zijn geverifieerd. Eén wijzer
              nadert oranje — dat pakken we op tijd op. Je documenten blijven versleuteld en privé.
            </p>
          </div>
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
                  className="grid w-full grid-cols-[auto_1fr_auto] items-center gap-4 px-5 py-4 text-left transition-colors hover:bg-[#14241b] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#34d17a] motion-reduce:transition-none"
                >
                  <span
                    className="inline-flex h-10 w-10 items-center justify-center rounded-md"
                    style={{ background: st.dim, border: `1px solid ${st.ink}55`, color: st.ink }}
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
                      className="hidden w-max items-center gap-1.5 rounded-md px-2.5 py-1 text-[11px] font-bold sm:inline-flex"
                      style={{
                        color: st.ink,
                        background: st.dim,
                        border: `1px solid ${st.ink}55`,
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
                        className="rounded-lg p-4"
                        style={{ background: C.well, border: `1px solid ${C.line}` }}
                      >
                        <p
                          className="max-w-xl text-[13px] leading-relaxed"
                          style={{ color: C.fgSoft }}
                        >
                          {c.detail}. Je document wordt versleuteld bewaard en alleen na jouw
                          expliciete toestemming gedeeld met een opdrachtgever.
                        </p>
                        <div className="mt-3 flex flex-wrap gap-2">
                          <SolidButton tone={c.status === "EXPIRING" ? C.amber : C.green}>
                            {c.status === "EXPIRING" ? "Vernieuwen" : "Bekijken"}
                          </SolidButton>
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
          <Eyebrow tone={C.olive}>Documentenkast</Eyebrow>
        </div>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {DOCUMENTEN.map((d) => {
            const st = statusMeta(d.status);
            return (
              <Panel key={d.naam} className="flex items-center gap-3 p-4">
                <span
                  className="inline-flex h-9 w-9 items-center justify-center rounded-md"
                  style={{ background: C.well, border: `1px solid ${C.line}`, color: C.fgSoft }}
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
                  className="inline-flex items-center gap-1 rounded-md px-2.5 py-1 text-[10px] font-bold"
                  style={{ color: st.ink, background: st.dim, border: `1px solid ${st.ink}55` }}
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
          Welke wijzers vragen actie
        </h1>
        <p className="mt-2 max-w-md text-[13.5px]" style={{ color: C.fgSoft }}>
          Oranje eerst, dan de rest. Zet de wijzers één voor één terug in het groen.
        </p>
      </div>

      <ol className="space-y-3">
        {ACTIES.map((a, i) => {
          const warn = a.urgentie === "warning";
          const tone = warn ? C.amber : C.olive;
          return (
            <li key={a.titel}>
              <Panel className="p-5" interactive>
                <div className="grid grid-cols-[auto_1fr] items-start gap-4 sm:grid-cols-[auto_1fr_auto]">
                  <span
                    className="flex h-10 w-10 items-center justify-center rounded-md text-[14px] font-bold"
                    style={{
                      background: warn ? C.amberDim : C.well,
                      border: `1px solid ${tone}55`,
                      color: tone,
                      ...num,
                    }}
                    aria-hidden="true"
                  >
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <div className="min-w-0">
                    <span
                      className="inline-flex items-center gap-1 rounded-md px-2.5 py-0.5 text-[9.5px] font-bold uppercase tracking-[0.12em]"
                      style={{
                        color: tone,
                        background: warn ? C.amberDim : C.well,
                        border: `1px solid ${tone}55`,
                        ...bodyFont,
                      }}
                    >
                      {warn ? (
                        <AlertTriangle size={10} aria-hidden="true" />
                      ) : (
                        <Activity size={10} aria-hidden="true" />
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
                    <SolidButton tone={warn ? C.amber : C.green}>
                      {a.cta}
                      <ArrowRight size={13} aria-hidden="true" />
                    </SolidButton>
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

function factuurTone(status: string): { ink: string; dim: string; Icon: LucideIcon | null } {
  if (status === "Openstaand") return { ink: C.red, dim: C.redDim, Icon: AlertTriangle };
  if (status === "Betaald") return { ink: C.green, dim: C.greenDim, Icon: Check };
  return { ink: C.fgMute, dim: C.well, Icon: FileText };
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
        <SolidButton>
          <Plus size={14} aria-hidden="true" /> Nieuwe factuur
        </SolidButton>
      </div>

      <section className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {[
          { l: "Betaald", v: "€ 8.622", sub: "3 facturen", pct: 86, tone: C.green },
          { l: "Openstaand", v: "€ 1.350", sub: "1 factuur · 9 dagen", pct: 45, tone: C.red },
          { l: "Concept", v: "€ 880", sub: "klaar om te versturen", pct: 29, tone: C.olive },
        ].map((s) => (
          <Panel key={s.l} className="flex items-center gap-4 p-5" interactive>
            <span className="shrink-0" aria-hidden="true">
              <MiniArc value={s.pct} tone={s.tone} />
            </span>
            <div className="min-w-0">
              <p
                className="text-[10px] font-bold uppercase tracking-[0.1em]"
                style={{ color: C.fgMute, ...bodyFont }}
              >
                {s.l}
              </p>
              <p
                className="mt-1 text-[22px] font-bold tracking-[-0.01em]"
                style={{ color: s.tone, ...num }}
              >
                {s.v}
              </p>
              <p className="mt-0.5 text-[11px]" style={{ color: C.fgMute }}>
                {s.sub}
              </p>
            </div>
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
                    className="transition-colors hover:bg-[#14241b]"
                    style={{
                      background: i % 2 === 1 ? C.well : "transparent",
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
                        className="inline-flex items-center gap-1.5 rounded-md px-2.5 py-1 text-[10.5px] font-bold"
                        style={{
                          color: ft.ink,
                          background: ft.dim,
                          border: `1px solid ${ft.ink}55`,
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
