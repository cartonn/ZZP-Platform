"use client";

// Concept 407 — "Vectorveld" · Neon wireframe, vector line-art (donker).
// Technisch-elegant: bijna-zwart canvas met dunne gloeiende vectorlijnen, wireframe-kaders,
// SVG line-art (assen, plots, gloeiende nodes/connectoren voor matching), monospace labels.
// Data als lichtgevende lijntekening; leesbaarheid vóór glow (content op solide vlakken).
// Palet: bg #070b10, fg #d6f5e0, accent lime-glow #a3e635 met cyaan secundair. Geist Mono + Geist.

import { useMemo, useState } from "react";
import {
  ArrowRight,
  ArrowLeft,
  Check,
  Clock,
  AlertTriangle,
  Search,
  Plus,
  ShieldCheck,
  ChevronRight,
  Bell,
  Activity,
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
  type ScreenKey,
  type CredStatus,
  type Opdracht,
} from "./mock";

// — Palet: bijna-zwart canvas, lime-glow accent, cyaan secundair —
const C = {
  bg: "#070b10",
  bgAlt: "#0b1219",
  panel: "#0a1017",
  panelHi: "#0d141d",
  fg: "#d6f5e0",
  fgSoft: "#8fb6a0",
  fgMute: "#5c7d6c",
  fgFaint: "#3c5548",
  line: "rgba(163,230,53,0.22)",
  lineSoft: "rgba(163,230,53,0.1)",
  grid: "rgba(120,170,140,0.08)",
  lime: "#a3e635",
  limeDim: "#7cb518",
  cyan: "#4fd6e0",
  cyanDim: "#2b98a0",
  ok: "#a3e635",
  okDim: "#7cb518",
  warn: "#f2b53c",
  warnDim: "#c98a12",
  info: "#4fd6e0",
  infoDim: "#2b98a0",
  bad: "#f2665c",
  badDim: "#c53a30",
};

const mono = {
  fontFamily: "'Geist Mono', ui-monospace, 'SFMono-Regular', Menlo, Consolas, monospace",
};
const sans = {
  fontFamily: "'Geist', system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif",
};

function glow(tone: string, spread = 12): string {
  return `0 0 ${spread}px ${tone}55, 0 0 ${spread * 2}px ${tone}22`;
}

function statusMeta(s: CredStatus): {
  label: string;
  code: string;
  Icon: LucideIcon;
  alarm: boolean;
  tone: string;
  dim: string;
} {
  switch (s) {
    case "VERIFIED":
      return {
        label: "Geverifieerd",
        code: "OK",
        Icon: ShieldCheck,
        alarm: false,
        tone: C.ok,
        dim: C.okDim,
      };
    case "SUBMITTED":
      return {
        label: "In beoordeling",
        code: "WAIT",
        Icon: Clock,
        alarm: false,
        tone: C.info,
        dim: C.infoDim,
      };
    case "EXPIRING":
      return {
        label: "Verloopt binnenkort",
        code: "WARN",
        Icon: AlertTriangle,
        alarm: true,
        tone: C.warn,
        dim: C.warnDim,
      };
    case "REJECTED":
      return {
        label: "Afgewezen",
        code: "FAIL",
        Icon: AlertTriangle,
        alarm: true,
        tone: C.bad,
        dim: C.badDim,
      };
  }
}

// — Wireframe-paneel met hoek-tickmarks en optioneel rasterveld —
function Frame({
  children,
  className = "",
  tone = C.line,
  grid = false,
  as: Tag = "div",
}: {
  children: React.ReactNode;
  className?: string;
  tone?: string;
  grid?: boolean;
  as?: "div" | "section" | "li" | "article";
}) {
  return (
    <Tag
      className={`relative ${className}`}
      style={{
        background: grid
          ? `linear-gradient(${C.grid} 1px, transparent 1px) 0 0/22px 22px, linear-gradient(90deg, ${C.grid} 1px, transparent 1px) 0 0/22px 22px, ${C.panel}`
          : C.panel,
        border: `1px solid ${tone}`,
      }}
    >
      <Corner pos="tl" tone={tone} />
      <Corner pos="tr" tone={tone} />
      <Corner pos="bl" tone={tone} />
      <Corner pos="br" tone={tone} />
      {children}
    </Tag>
  );
}

function Corner({ pos, tone }: { pos: "tl" | "tr" | "bl" | "br"; tone: string }) {
  const base = "pointer-events-none absolute h-2 w-2";
  const map: Record<string, string> = {
    tl: "-left-px -top-px border-l border-t",
    tr: "-right-px -top-px border-r border-t",
    bl: "-left-px -bottom-px border-l border-b",
    br: "-right-px -bottom-px border-r border-b",
  };
  return (
    <span className={`${base} ${map[pos]}`} style={{ borderColor: tone }} aria-hidden="true" />
  );
}

function GlowButton({
  children,
  onClick,
  className = "",
  tone = C.lime,
  dim = C.limeDim,
}: {
  children: React.ReactNode;
  onClick?: () => void;
  className?: string;
  tone?: string;
  dim?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`group inline-flex items-center justify-center gap-2 px-4 py-2.5 text-[12.5px] font-semibold uppercase tracking-[0.1em] transition-all duration-200 hover:brightness-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#a3e635] focus-visible:ring-offset-2 focus-visible:ring-offset-[#070b10] motion-reduce:transition-none ${className}`}
      style={{
        color: C.bg,
        background: tone,
        border: `1px solid ${dim}`,
        boxShadow: glow(tone, 10),
        ...mono,
      }}
    >
      {children}
    </button>
  );
}

function WireButton({
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
      className={`inline-flex items-center justify-center gap-2 px-3.5 py-2.5 text-[12px] font-semibold uppercase tracking-[0.1em] transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#a3e635] focus-visible:ring-offset-2 focus-visible:ring-offset-[#070b10] motion-reduce:transition-none ${className}`}
      style={{
        color: active ? C.bg : C.fgSoft,
        background: active ? C.cyan : "transparent",
        border: `1px solid ${active ? C.cyan : C.line}`,
        boxShadow: active ? glow(C.cyan, 8) : "none",
        ...mono,
      }}
    >
      {children}
    </button>
  );
}

function Node({ children, tone, dim }: { children: React.ReactNode; tone: string; dim: string }) {
  return (
    <span
      className="inline-flex items-center gap-1.5 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.06em]"
      style={{ color: tone, background: `${dim}1a`, border: `1px solid ${tone}66`, ...mono }}
    >
      {children}
    </span>
  );
}

function Label({ children, tone = C.lime }: { children: React.ReactNode; tone?: string }) {
  return (
    <p
      className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.24em]"
      style={{ color: tone, ...mono }}
    >
      <span aria-hidden="true">{"//"}</span>
      {children}
    </p>
  );
}

// — Vector-plot: gloeiende lijn met assen, nodes en eind-marker —
function VectorPlot({
  data,
  tone,
  id,
  height = 40,
}: {
  data: number[];
  tone: string;
  id: string;
  height?: number;
}) {
  const max = Math.max(...data);
  const min = Math.min(...data);
  const span = max - min || 1;
  const w = 120;
  const h = height;
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
        <filter id={`f-${id}`} x="-20%" y="-40%" width="140%" height="180%">
          <feGaussianBlur stdDeviation="1.4" result="b" />
          <feMerge>
            <feMergeNode in="b" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>
      <line x1="0" y1={h - 1} x2={w} y2={h - 1} stroke={tone} strokeWidth="0.4" opacity="0.3" />
      <polyline
        points={line}
        fill="none"
        stroke={tone}
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
        filter={`url(#f-${id})`}
      />
      {pts.map(([x, y], i) => (
        <circle
          key={`${id}-${i}`}
          cx={x}
          cy={y}
          r={i === pts.length - 1 ? 2.6 : 1.3}
          fill={i === pts.length - 1 ? tone : C.bg}
          stroke={tone}
          strokeWidth="1"
        />
      ))}
      <line
        x1={last[0]}
        y1="0"
        x2={last[0]}
        y2={h}
        stroke={tone}
        strokeWidth="0.4"
        opacity="0.35"
        strokeDasharray="2 2"
      />
    </svg>
  );
}

// — Radiale match-meter als vector line-art —
function MatchGauge({ value, tone }: { value: number; tone: string }) {
  const r = 21;
  const circ = 2 * Math.PI * r;
  const dash = (value / 100) * circ;
  return (
    <span className="relative inline-flex h-14 w-14 items-center justify-center">
      <svg viewBox="0 0 56 56" className="h-14 w-14 -rotate-90" aria-hidden="true">
        <circle
          cx="28"
          cy="28"
          r={r}
          fill="none"
          stroke={C.lineSoft}
          strokeWidth="1.5"
          strokeDasharray="2 3"
        />
        <circle
          cx="28"
          cy="28"
          r={r}
          fill="none"
          stroke={tone}
          strokeWidth="2"
          strokeLinecap="round"
          strokeDasharray={`${dash} ${circ}`}
          style={{ filter: `drop-shadow(0 0 3px ${tone})` }}
        />
      </svg>
      <span
        className="absolute text-[13px] font-semibold tabular-nums"
        style={{ color: tone, ...mono }}
      >
        {value}
      </span>
    </span>
  );
}

export function Concept407() {
  const [screen, setScreen] = useState<ScreenKey>("dashboard");
  const active = OPDRACHTEN[0] as Opdracht;

  return (
    <div
      className="min-h-[720px] w-full antialiased"
      style={{
        ...sans,
        color: C.fg,
        background: `radial-gradient(120% 90% at 85% -10%, ${C.bgAlt}, ${C.bg} 55%)`,
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
          className="inline-flex h-11 w-11 items-center justify-center"
          style={{ border: `1px solid ${C.lime}`, color: C.lime, boxShadow: glow(C.lime, 8) }}
          aria-hidden="true"
        >
          <Activity size={19} />
        </span>
        <div>
          <p
            className="text-[19px] font-semibold leading-none tracking-[0.02em]"
            style={{ color: C.fg, ...mono }}
          >
            VECTORVELD
          </p>
          <p className="mt-1.5 text-[10.5px] leading-none" style={{ color: C.fgMute, ...mono }}>
            node://{PROFIEL.plaats.toLowerCase()} · sync ok
          </p>
        </div>
      </div>
      <div className="flex items-center gap-3">
        <span
          className="hidden items-center gap-1.5 px-2.5 py-1.5 text-[10.5px] font-semibold uppercase tracking-[0.08em] sm:inline-flex"
          style={{
            color: C.ok,
            border: `1px solid ${C.ok}55`,
            background: `${C.okDim}14`,
            ...mono,
          }}
        >
          <ShieldCheck size={12} aria-hidden="true" />
          {PROFIEL.trust}
        </span>
        <span
          className="relative inline-flex h-10 w-10 items-center justify-center"
          style={{ border: `1px solid ${C.line}`, color: C.fgSoft }}
          aria-label={`${ongelezen} ongelezen berichten`}
        >
          <Bell size={16} aria-hidden="true" />
          {ongelezen > 0 && (
            <span
              className="absolute -right-1.5 -top-1.5 flex h-4 w-4 items-center justify-center text-[9px] font-bold"
              style={{ background: C.lime, color: C.bg, boxShadow: glow(C.lime, 6), ...mono }}
              aria-hidden="true"
            >
              {ongelezen}
            </span>
          )}
        </span>
        <span className="hidden text-right sm:block">
          <span className="block text-[13px] font-semibold" style={{ color: C.fg, ...sans }}>
            {PROFIEL.naam}
          </span>
          <span
            className="block text-[10px] uppercase tracking-[0.1em]"
            style={{ color: C.fgMute, ...mono }}
          >
            {PROFIEL.rol}
          </span>
        </span>
        <span
          className="inline-flex h-11 w-11 items-center justify-center text-[12.5px] font-semibold"
          style={{ border: `1px solid ${C.lime}`, color: C.lime, ...mono }}
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
        className="flex items-center gap-1 overflow-x-auto p-1.5"
        style={{ border: `1px solid ${C.line}`, background: C.panel }}
      >
        {SCREENS.map((s, i) => {
          const on = s.key === screen;
          return (
            <button
              key={s.key}
              type="button"
              onClick={() => setScreen(s.key)}
              aria-current={on ? "page" : undefined}
              className="flex shrink-0 items-center gap-2 px-3.5 py-2 text-[12px] font-semibold uppercase tracking-[0.08em] transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#a3e635] focus-visible:ring-offset-2 focus-visible:ring-offset-[#0a1017] motion-reduce:transition-none"
              style={{
                color: on ? C.bg : C.fgSoft,
                background: on ? C.lime : "transparent",
                boxShadow: on ? glow(C.lime, 8) : "none",
                ...mono,
              }}
            >
              <span className="text-[9px]" style={{ opacity: 0.6 }}>
                {String(i + 1).padStart(2, "0")}
              </span>
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
  const tones = [C.lime, C.cyan, C.lime, C.warn];
  return (
    <div className="space-y-6">
      <section className="grid grid-cols-1 gap-5 lg:grid-cols-[1.35fr_1fr]">
        <Frame className="p-6 md:p-8" grid tone={C.line}>
          <Label>sessie · {PROFIEL.plaats.toLowerCase()}</Label>
          <h1
            className="mt-4 text-[30px] font-semibold leading-[1.06] tracking-[-0.01em] md:text-[38px]"
            style={{ color: C.fg, ...sans }}
          >
            Goedemorgen,
            <br />
            <span style={{ color: C.lime, textShadow: glow(C.lime, 10) }}>
              {PROFIEL.naam.split(" ")[0]}.
            </span>
          </h1>
          <p className="mt-4 max-w-md text-[13.5px] leading-relaxed" style={{ color: C.fgSoft }}>
            Je praktijk als vectorveld — elk signaal een lijn, elke match een gloeiende node. Wat
            oplicht vraagt nu aandacht; de rest ligt rustig in het raster.
          </p>
          <div className="mt-6 flex flex-wrap items-center gap-3">
            <GlowButton onClick={onActies}>
              Volgende actie
              <ArrowRight
                size={14}
                aria-hidden="true"
                className="transition-transform group-hover:translate-x-0.5 motion-reduce:transition-none"
              />
            </GlowButton>
            <WireButton onClick={onOpen}>Open marktplaats</WireButton>
          </div>
        </Frame>

        <Frame className="flex flex-col p-6" tone={`${C.warn}55`}>
          <div className="flex items-center justify-between">
            <Label tone={C.warn}>alert · prioriteit</Label>
            <span
              className="h-2 w-2 rounded-full"
              style={{ background: C.warn, boxShadow: glow(C.warn, 6) }}
              aria-hidden="true"
            />
          </div>
          <h2
            className="mt-4 text-[18px] font-semibold leading-snug"
            style={{ color: C.fg, ...sans }}
          >
            {primair.titel}
          </h2>
          <p className="mt-2 text-[13px] leading-relaxed" style={{ color: C.fgSoft }}>
            {primair.detail}
          </p>
          <div className="mt-auto pt-5">
            <GlowButton onClick={onActies} className="w-full" tone={C.warn} dim={C.warnDim}>
              {primair.cta}
              <ArrowRight size={14} aria-hidden="true" />
            </GlowButton>
            <p className="mt-3 text-center text-[11px]" style={{ color: C.fgMute, ...mono }}>
              cred {verified}/{CREDENTIALS.length} · reacties 07
            </p>
          </div>
        </Frame>
      </section>

      <section>
        <div className="mb-3">
          <Label>telemetrie · deze maand</Label>
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {KPIS.map((k, i) => {
            const tone = tones[i % tones.length]!;
            return (
              <Frame key={k.label} className="p-4" tone={C.line}>
                <div className="flex items-start justify-between gap-2">
                  <p
                    className="text-[10.5px] font-semibold uppercase tracking-[0.1em]"
                    style={{ color: C.fgMute, ...mono }}
                  >
                    {k.label}
                  </p>
                  <span
                    className="text-[10px] font-semibold tabular-nums"
                    style={{ color: k.up ? C.ok : C.warn, ...mono }}
                  >
                    {k.up ? "▲" : "▼"}
                    {k.trend.replace(/^\+/, "")}
                  </span>
                </div>
                <p
                  className="mt-2.5 text-[27px] font-semibold tabular-nums leading-none tracking-[-0.01em]"
                  style={{ color: C.fg, ...mono }}
                >
                  {k.value}
                </p>
                <div className="mt-3">
                  <VectorPlot data={k.spark} tone={tone} id={`kpi-${i}`} />
                </div>
              </Frame>
            );
          })}
        </div>
      </section>

      <section className="grid grid-cols-1 gap-5 lg:grid-cols-[1.45fr_1fr]">
        <div>
          <div className="mb-3 flex items-baseline justify-between">
            <Label>matching · nodes</Label>
            <button
              type="button"
              onClick={onOpen}
              className="text-[10.5px] font-semibold uppercase tracking-[0.12em] transition-colors hover:brightness-125 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#a3e635] focus-visible:ring-offset-2 focus-visible:ring-offset-[#070b10]"
              style={{ color: C.lime, ...mono }}
            >
              alles →
            </button>
          </div>
          <Frame tone={C.line}>
            <ul>
              {OPDRACHTEN.map((o, i) => {
                const tone = o.match >= 90 ? C.lime : o.match >= 85 ? C.cyan : C.fgSoft;
                return (
                  <li
                    key={o.id}
                    style={{ borderTop: i === 0 ? "none" : `1px solid ${C.lineSoft}` }}
                  >
                    <button
                      type="button"
                      onClick={onOpen}
                      className="group grid w-full grid-cols-[auto_1fr_auto] items-center gap-4 px-4 py-3.5 text-left transition-colors hover:bg-[#0d141d] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#a3e635] motion-reduce:transition-none"
                    >
                      <MatchGauge value={o.match} tone={tone} />
                      <span className="min-w-0">
                        <span
                          className="block truncate text-[14.5px] font-semibold"
                          style={{ color: C.fg, ...sans }}
                        >
                          {o.titel}
                        </span>
                        <span
                          className="mt-0.5 block truncate text-[11.5px]"
                          style={{ color: C.fgMute, ...mono }}
                        >
                          {o.opdrachtgever} · {o.plaats} · {o.tarief}
                        </span>
                      </span>
                      <ChevronRight
                        size={18}
                        aria-hidden="true"
                        className="transition-transform group-hover:translate-x-0.5 motion-reduce:transition-none"
                        style={{ color: tone }}
                      />
                    </button>
                  </li>
                );
              })}
            </ul>
          </Frame>
        </div>

        <div>
          <div className="mb-3">
            <Label tone={C.cyan}>credentials</Label>
          </div>
          <Frame className="p-4" tone={`${C.cyan}44`}>
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
                      className="inline-flex h-8 w-8 shrink-0 items-center justify-center"
                      style={{
                        color: st.tone,
                        border: `1px solid ${st.tone}55`,
                        background: `${st.dim}14`,
                      }}
                      aria-hidden="true"
                    >
                      <st.Icon size={15} />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span
                        className="block truncate text-[12.5px] font-semibold"
                        style={{ color: C.fg }}
                      >
                        {c.naam}
                      </span>
                      <span
                        className="block truncate text-[10.5px]"
                        style={{ color: st.tone, ...mono }}
                      >
                        [{st.code}] {st.label}
                        {st.alarm && <span className="sr-only"> (let op)</span>}
                      </span>
                    </span>
                  </li>
                );
              })}
            </ul>
          </Frame>
        </div>
      </section>
    </div>
  );
}

function Marktplaats({ onOpen }: { onOpen: () => void }) {
  const [q, setQ] = useState("");
  const [sort, setSort] = useState<"match" | "tarief">("match");

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
        <Label>marktplaats · scan</Label>
        <h1
          className="mt-3 text-[28px] font-semibold leading-none tracking-[-0.01em]"
          style={{ color: C.fg, ...sans }}
        >
          Open opdrachten
        </h1>
        <p className="mt-2 text-[12px]" style={{ color: C.fgMute, ...mono }}>
          {String(filtered.length).padStart(2, "0")}/{String(OPDRACHTEN.length).padStart(2, "0")}{" "}
          nodes zichtbaar
        </p>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div
          className="flex flex-1 items-center gap-2.5 px-3.5 py-3"
          style={{ background: C.panel, border: `1px solid ${C.line}` }}
        >
          <Search size={16} aria-hidden="true" style={{ color: C.fgMute }} />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="grep opdracht / plaats / opdrachtgever…"
            aria-label="Opdrachten zoeken"
            className="w-full bg-transparent text-[13px] outline-none placeholder:text-[#5c7d6c]"
            style={{ color: C.fg, ...mono }}
          />
        </div>
        <div className="flex items-center gap-2" role="group" aria-label="Sorteren">
          {(["match", "tarief"] as const).map((s) => (
            <WireButton
              key={s}
              onClick={() => setSort(s)}
              active={sort === s}
              ariaPressed={sort === s}
            >
              {s === "match" ? "match" : "tarief"}
            </WireButton>
          ))}
        </div>
      </div>

      {filtered.length === 0 ? (
        <Frame className="px-6 py-16 text-center" tone={C.line}>
          <span
            className="mx-auto inline-flex h-16 w-16 items-center justify-center"
            style={{ border: `1px solid ${C.line}`, color: C.fgMute }}
            aria-hidden="true"
          >
            <Search size={24} />
          </span>
          <p className="mt-5 text-[18px] font-semibold" style={{ color: C.fg, ...sans }}>
            Geen node in bereik
          </p>
          <p className="mx-auto mt-2 max-w-xs text-[13px]" style={{ color: C.fgSoft }}>
            Geen opdracht matcht {q ? `“${q}”` : "de zoekterm"}. Verruim de query om meer nodes te
            vinden.
          </p>
          <div className="mt-6">
            <GlowButton onClick={() => setQ("")}>
              query wissen <ArrowRight size={13} aria-hidden="true" />
            </GlowButton>
          </div>
        </Frame>
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
  const tone = strong ? C.lime : opdracht.match >= 85 ? C.cyan : C.fgSoft;
  const dim = strong ? C.limeDim : opdracht.match >= 85 ? C.cyanDim : C.fgMute;
  return (
    <Frame className="p-5" tone={`${tone}55`}>
      <div className="grid grid-cols-[1fr_auto] items-start gap-4">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span
              className="text-[10px] font-semibold uppercase tracking-[0.1em]"
              style={{ color: C.fgMute, ...mono }}
            >
              node[{String(index).padStart(2, "0")}]
            </span>
            <span className="text-[11px] font-semibold" style={{ color: C.fgMute, ...mono }}>
              {opdracht.id}
            </span>
          </div>
          <h3
            className="mt-2 text-[17px] font-semibold leading-snug"
            style={{ color: C.fg, ...sans }}
          >
            {opdracht.titel}
          </h3>
          <p className="mt-1 text-[12px]" style={{ color: C.fgMute, ...mono }}>
            {opdracht.opdrachtgever} · {opdracht.plaats} · {opdracht.uren}
          </p>
          <div className="mt-3 flex flex-wrap gap-1.5">
            {opdracht.tags.map((t) => (
              <span
                key={t}
                className="inline-flex items-center px-2 py-0.5 text-[10.5px] font-semibold uppercase tracking-[0.04em]"
                style={{ color: C.fgSoft, border: `1px solid ${C.lineSoft}`, ...mono }}
              >
                {t}
              </span>
            ))}
          </div>
        </div>
        <div className="flex flex-col items-center gap-1.5">
          <MatchGauge value={opdracht.match} tone={tone} />
          <span className="text-[13px] font-semibold tabular-nums" style={{ color: dim, ...mono }}>
            {opdracht.tarief.replace(" / uur", "")}
          </span>
        </div>
      </div>
      <div className="mt-4 flex items-center gap-3">
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-[11px] font-semibold uppercase tracking-[0.08em] transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#a3e635] focus-visible:ring-offset-2 focus-visible:ring-offset-[#070b10]"
          style={{ color: C.fgSoft, border: `1px solid ${C.line}`, ...mono }}
        >
          <span aria-hidden="true">{open ? "−" : "+"}</span>
          waarom
        </button>
        <div className="ml-auto">
          <GlowButton onClick={onOpen}>
            reageer <ArrowRight size={13} aria-hidden="true" />
          </GlowButton>
        </div>
      </div>
      <div
        className="grid transition-all duration-300 motion-reduce:transition-none"
        style={{ gridTemplateRows: open ? "1fr" : "0fr" }}
      >
        <div className="overflow-hidden">
          <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
            <RedenBlok titel="signaal +" tone={C.ok} Icon={Check} items={opdracht.redenen.plus} />
            <RedenBlok
              titel="ruis −"
              tone={C.warn}
              Icon={AlertTriangle}
              items={opdracht.redenen.min}
            />
          </div>
        </div>
      </div>
    </Frame>
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
    <div className="p-4" style={{ background: C.bgAlt, border: `1px solid ${C.lineSoft}` }}>
      <p
        className="flex items-center gap-1.5 text-[10.5px] font-semibold uppercase tracking-[0.12em]"
        style={{ color: tone, ...mono }}
      >
        <Icon size={12} aria-hidden="true" />
        {titel}
      </p>
      <ul className="mt-2.5 space-y-2">
        {items.map((r) => (
          <li key={r} className="flex items-start gap-2 text-[12.5px]" style={{ color: C.fgSoft }}>
            <span
              className="mt-1.5 h-1 w-1 shrink-0"
              style={{ background: tone }}
              aria-hidden="true"
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
        className="inline-flex items-center gap-2 px-3.5 py-2 text-[12px] font-semibold uppercase tracking-[0.08em] transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#a3e635] focus-visible:ring-offset-2 focus-visible:ring-offset-[#070b10]"
        style={{ color: C.fgSoft, border: `1px solid ${C.line}`, ...mono }}
      >
        <ArrowLeft size={13} aria-hidden="true" /> terug
      </button>

      <Frame className="p-6 md:p-8" grid tone={`${tone}55`}>
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-[11px] font-semibold" style={{ color: C.fgMute, ...mono }}>
            {opdracht.id}
          </span>
          <Node tone={tone} dim={strong ? C.limeDim : C.cyanDim}>
            match {opdracht.match}%
          </Node>
        </div>
        <h1
          className="mt-4 max-w-2xl text-[28px] font-semibold leading-[1.1] tracking-[-0.01em] md:text-[38px]"
          style={{ color: C.fg, ...sans }}
        >
          {opdracht.titel}
        </h1>
        <p className="mt-2 text-[13.5px]" style={{ color: C.fgSoft, ...mono }}>
          {opdracht.opdrachtgever} · {opdracht.plaats}
        </p>
        <div className="mt-6 flex flex-wrap gap-3">
          <GlowButton tone={tone} dim={strong ? C.limeDim : C.cyanDim}>
            reageer op opdracht <ArrowRight size={14} aria-hidden="true" />
          </GlowButton>
          <WireButton>bewaren</WireButton>
        </div>
      </Frame>

      <div className="grid grid-cols-2 gap-px md:grid-cols-4" style={{ background: C.line }}>
        {[
          { l: "tarief", v: opdracht.tarief.replace(" / uur", "") },
          { l: "omvang", v: opdracht.uren },
          { l: "start", v: opdracht.start },
          { l: "match", v: `${opdracht.match}%` },
        ].map((m) => (
          <div key={m.l} className="p-4" style={{ background: C.panel }}>
            <p
              className="text-[9.5px] font-semibold uppercase tracking-[0.14em]"
              style={{ color: C.fgMute, ...mono }}
            >
              {m.l}
            </p>
            <p
              className="mt-1.5 text-[18px] font-semibold tabular-nums"
              style={{ color: C.fg, ...mono }}
            >
              {m.v}
            </p>
          </div>
        ))}
      </div>

      <section>
        <Label>waarom deze match</Label>
        <p className="mt-3 max-w-xl text-[13.5px] leading-relaxed" style={{ color: C.fgSoft }}>
          Transparant afgeleid uit je geverifieerde profiel — welke signalen meewegen én waar ruis
          zit, zonder verborgen score.
        </p>
        <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-2">
          <Frame className="p-5" tone={`${C.ok}44`}>
            <p
              className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.12em]"
              style={{ color: C.ok, ...mono }}
            >
              <Check size={14} aria-hidden="true" /> signaal +
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
                    style={{ color: C.ok }}
                  />
                  {r}
                </li>
              ))}
            </ul>
          </Frame>
          <Frame className="p-5" tone={`${C.warn}44`}>
            <p
              className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.12em]"
              style={{ color: C.warn, ...mono }}
            >
              <AlertTriangle size={14} aria-hidden="true" /> ruis −
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
                    style={{ color: C.warn }}
                  />
                  {r}
                </li>
              ))}
            </ul>
          </Frame>
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
      <Frame className="p-6 md:p-7" grid tone={C.line}>
        <div className="flex flex-wrap items-center justify-between gap-6">
          <div className="max-w-md">
            <Label>authenticatie · dossier</Label>
            <h1
              className="mt-3 text-[26px] font-semibold leading-tight tracking-[-0.01em]"
              style={{ color: C.fg, ...sans }}
            >
              Verificatie
            </h1>
            <p className="mt-3 text-[13.5px] leading-relaxed" style={{ color: C.fgSoft }}>
              <span className="font-semibold" style={{ color: C.fg }}>
                {PROFIEL.trust}.
              </span>{" "}
              {verified} van {CREDENTIALS.length} credentials geverifieerd. Eén nadert vervaldatum
              en vraagt vernieuwing.
            </p>
          </div>
          <span className="relative inline-flex h-24 w-24 items-center justify-center">
            <svg viewBox="0 0 96 96" className="h-24 w-24 -rotate-90" aria-hidden="true">
              <circle
                cx="48"
                cy="48"
                r="40"
                fill="none"
                stroke={C.lineSoft}
                strokeWidth="2"
                strokeDasharray="3 4"
              />
              <circle
                cx="48"
                cy="48"
                r="40"
                fill="none"
                stroke={C.lime}
                strokeWidth="3"
                strokeLinecap="round"
                strokeDasharray={`${(ratio / 100) * 2 * Math.PI * 40} ${2 * Math.PI * 40}`}
                style={{ filter: `drop-shadow(0 0 4px ${C.lime})` }}
              />
            </svg>
            <span className="absolute flex flex-col items-center">
              <span
                className="text-[24px] font-semibold tabular-nums leading-none"
                style={{ color: C.lime, ...mono }}
              >
                {ratio}
              </span>
              <span
                className="mt-0.5 text-[8px] uppercase tracking-[0.14em]"
                style={{ color: C.fgMute, ...mono }}
              >
                %ok
              </span>
            </span>
          </span>
        </div>
      </Frame>

      <ul className="space-y-3">
        {CREDENTIALS.map((c) => {
          const st = statusMeta(c.status);
          const isOpen = open === c.naam;
          return (
            <li key={c.naam}>
              <Frame tone={`${st.tone}44`}>
                <button
                  type="button"
                  onClick={() => setOpen(isOpen ? null : c.naam)}
                  aria-expanded={isOpen}
                  className="grid w-full grid-cols-[auto_1fr_auto] items-center gap-4 px-4 py-4 text-left transition-colors hover:bg-[#0d141d] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#a3e635] motion-reduce:transition-none"
                >
                  <span
                    className="inline-flex h-10 w-10 shrink-0 items-center justify-center"
                    style={{
                      color: st.tone,
                      border: `1px solid ${st.tone}66`,
                      background: `${st.dim}14`,
                    }}
                    aria-hidden="true"
                  >
                    <st.Icon size={17} />
                  </span>
                  <span className="min-w-0">
                    <span
                      className="block truncate text-[14.5px] font-semibold"
                      style={{ color: C.fg, ...sans }}
                    >
                      {c.naam}
                    </span>
                    <span
                      className="mt-0.5 block truncate text-[11.5px]"
                      style={{ color: C.fgMute, ...mono }}
                    >
                      {c.detail}
                    </span>
                  </span>
                  <span className="flex items-center gap-3">
                    <span className="hidden sm:inline">
                      <Node tone={st.tone} dim={st.dim}>
                        <st.Icon size={11} aria-hidden="true" />
                        {st.label}
                        {st.alarm && <span className="sr-only"> (let op)</span>}
                      </Node>
                    </span>
                    <ChevronRight
                      size={17}
                      aria-hidden="true"
                      className="transition-transform motion-reduce:transition-none"
                      style={{ color: C.fgMute, transform: isOpen ? "rotate(90deg)" : "none" }}
                    />
                  </span>
                </button>
                <div
                  className="grid transition-all duration-300 motion-reduce:transition-none"
                  style={{ gridTemplateRows: isOpen ? "1fr" : "0fr" }}
                >
                  <div className="overflow-hidden">
                    <div className="px-4 pb-4 sm:pl-14">
                      <div
                        className="p-4"
                        style={{ background: C.bgAlt, border: `1px solid ${C.lineSoft}` }}
                      >
                        <p
                          className="max-w-xl text-[13px] leading-relaxed"
                          style={{ color: C.fgSoft }}
                        >
                          {c.detail}. Documenten worden versleuteld bewaard en alleen na je
                          expliciete toestemming gedeeld met een opdrachtgever.
                        </p>
                        <div className="mt-3 flex flex-wrap gap-2">
                          <GlowButton
                            tone={st.tone === C.warn ? C.warn : C.lime}
                            dim={st.tone === C.warn ? C.warnDim : C.limeDim}
                          >
                            {c.status === "EXPIRING" ? "vernieuwen" : "bekijken"}
                          </GlowButton>
                          <WireButton>historie</WireButton>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </Frame>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

function Acties() {
  return (
    <div className="space-y-6">
      <div>
        <Label>queue · volgende acties</Label>
        <h1
          className="mt-3 text-[28px] font-semibold leading-none tracking-[-0.01em]"
          style={{ color: C.fg, ...sans }}
        >
          Acties
        </h1>
        <p className="mt-2 max-w-md text-[13px]" style={{ color: C.fgMute }}>
          Op prioriteit gesorteerd — werk van boven naar beneden om verifieerbaar en betaald te
          blijven.
        </p>
      </div>

      <ol className="space-y-3">
        {ACTIES.map((a, i) => {
          const warn = a.urgentie === "warning";
          const tone = warn ? C.warn : C.cyan;
          const dim = warn ? C.warnDim : C.cyanDim;
          return (
            <li key={a.titel}>
              <Frame className="p-5" tone={`${tone}44`}>
                <div className="grid grid-cols-[auto_1fr] items-start gap-4 sm:grid-cols-[auto_1fr_auto]">
                  <span
                    className="flex h-11 w-11 items-center justify-center text-[15px] font-semibold tabular-nums"
                    style={{
                      color: tone,
                      border: `1px solid ${tone}66`,
                      background: `${dim}14`,
                      ...mono,
                    }}
                    aria-hidden="true"
                  >
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <div className="min-w-0">
                    <Node tone={tone} dim={dim}>
                      {warn ? (
                        <AlertTriangle size={10} aria-hidden="true" />
                      ) : (
                        <Check size={10} aria-hidden="true" />
                      )}
                      {warn ? "urgent" : "kans"}
                    </Node>
                    <h2
                      className="mt-2 text-[16px] font-semibold leading-snug"
                      style={{ color: C.fg, ...sans }}
                    >
                      {a.titel}
                    </h2>
                    <p
                      className="mt-1.5 max-w-lg text-[13px] leading-relaxed"
                      style={{ color: C.fgSoft }}
                    >
                      {a.detail}
                    </p>
                  </div>
                  <div className="col-span-2 mt-1 sm:col-span-1 sm:mt-0 sm:self-center">
                    <GlowButton tone={tone} dim={dim}>
                      {a.cta}
                      <ArrowRight size={13} aria-hidden="true" />
                    </GlowButton>
                  </div>
                </div>
              </Frame>
            </li>
          );
        })}
      </ol>
    </div>
  );
}

function factuurMeta(status: string): { tone: string; dim: string; Icon: LucideIcon } {
  if (status === "Openstaand") return { tone: C.warn, dim: C.warnDim, Icon: Clock };
  if (status === "Betaald") return { tone: C.ok, dim: C.okDim, Icon: Check };
  return { tone: C.info, dim: C.infoDim, Icon: AlertTriangle };
}

function Facturen() {
  const totaalBetaald = "€ 8.622";
  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <Label>grootboek · stream</Label>
          <h1
            className="mt-3 text-[28px] font-semibold leading-none tracking-[-0.01em]"
            style={{ color: C.fg, ...sans }}
          >
            Facturen
          </h1>
        </div>
        <GlowButton>
          <Plus size={14} aria-hidden="true" /> nieuwe factuur
        </GlowButton>
      </div>

      <section className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {[
          { l: "betaald (mnd)", v: totaalBetaald, sub: "3 voldaan", tone: C.ok, alarm: false },
          { l: "openstaand", v: "€ 1.350", sub: "1 factuur · 9 dagen", tone: C.warn, alarm: true },
          { l: "concept", v: "€ 880", sub: "klaar om te versturen", tone: C.info, alarm: false },
        ].map((s) => (
          <Frame key={s.l} className="p-5" tone={`${s.tone}44`}>
            <div className="flex items-center justify-between">
              <p
                className="text-[10.5px] font-semibold uppercase tracking-[0.1em]"
                style={{ color: C.fgMute, ...mono }}
              >
                {s.l}
              </p>
              {s.alarm && <AlertTriangle size={14} aria-hidden="true" style={{ color: C.warn }} />}
            </div>
            <p
              className="mt-2 text-[27px] font-semibold tabular-nums tracking-[-0.01em]"
              style={{ color: s.alarm ? C.warn : C.fg, ...mono }}
            >
              {s.v}
            </p>
            <p className="mt-1 text-[11.5px]" style={{ color: C.fgMute, ...mono }}>
              {s.sub}
            </p>
          </Frame>
        ))}
      </section>

      <Frame tone={C.line}>
        <div
          className="hidden grid-cols-[8rem_1fr_5rem_9rem_6rem] gap-4 px-5 pb-3 pt-4 sm:grid"
          style={{ borderBottom: `1px solid ${C.lineSoft}` }}
        >
          {["nummer", "klant", "datum", "status", "bedrag"].map((h, i) => (
            <span
              key={h}
              className={`text-[9.5px] font-semibold uppercase tracking-[0.14em] ${i === 4 ? "text-right" : ""}`}
              style={{ color: C.fgMute, ...mono }}
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
                className="grid grid-cols-[1fr_auto] items-center gap-3 px-5 py-3.5 transition-colors hover:bg-[#0d141d] sm:grid-cols-[8rem_1fr_5rem_9rem_6rem] sm:gap-4"
                style={{ borderTop: i === 0 ? "none" : `1px solid ${C.lineSoft}` }}
              >
                <span
                  className="order-1 text-[11.5px] font-semibold tabular-nums"
                  style={{ color: C.fgMute, ...mono }}
                >
                  {f.nr}
                </span>
                <span
                  className="order-3 min-w-0 truncate text-[13.5px] font-semibold sm:order-2"
                  style={{ color: C.fg, ...sans }}
                >
                  {f.klant}
                </span>
                <span
                  className="order-4 hidden text-[11.5px] tabular-nums sm:order-3 sm:inline"
                  style={{ color: C.fgMute, ...mono }}
                >
                  {f.datum}
                </span>
                <span className="order-5 sm:order-4">
                  <span
                    className="inline-flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.06em]"
                    style={{ color: ft.tone, ...mono }}
                  >
                    <ft.Icon size={12} aria-hidden="true" />
                    {f.status}
                  </span>
                </span>
                <span
                  className="order-2 text-right text-[14px] font-semibold tabular-nums sm:order-5"
                  style={{ color: acc ? C.warn : C.fg, ...mono }}
                >
                  {f.bedrag}
                </span>
              </li>
            );
          })}
        </ul>
        <div
          className="flex items-baseline justify-between px-5 py-4"
          style={{ borderTop: `1px solid ${C.line}` }}
        >
          <span
            className="flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.16em]"
            style={{ color: C.fgMute, ...mono }}
          >
            <Activity size={12} aria-hidden="true" style={{ color: C.lime }} /> totaal betaald
          </span>
          <span
            className="text-[20px] font-semibold tabular-nums"
            style={{ color: C.lime, textShadow: glow(C.lime, 8), ...mono }}
          >
            {totaalBetaald}
          </span>
        </div>
      </Frame>
    </div>
  );
}
