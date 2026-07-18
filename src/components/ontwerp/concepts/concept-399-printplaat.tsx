"use client";

// Concept 399 — "Printplaat" · Technisch-schematisch PCB-ontwerp.
// De matching- en verificatieflow als een printplaat: een donkergroen soldeermasker-veld waarop
// koperen/gouden traces componenten verbinden, ronde "vias" (doorverbindingen) als knooppunten en
// siebdruk-witte labels in mono-typografie. Signalen worden gerouteerd door het circuit — strak,
// leesbaar, geen rommel. Palet: soldeermasker #0b2e22/#103a2c, koper/goud #c8a24a, siebdruk #e6efe9.
// Fonts: systeem-mono voor labels/codes + sans voor bodytekst.

import { useMemo, useState } from "react";
import {
  ArrowRight,
  Check,
  Clock,
  AlertTriangle,
  Search,
  Plus,
  Minus,
  ShieldCheck,
  ChevronRight,
  CircuitBoard,
  Cpu,
  Zap,
  Bell,
  Radio,
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

// — Palet: donkergroen soldeermasker, koperen traces, siebdruk-wit —
const C = {
  mask: "#0b2e22",
  maskAlt: "#0e3527",
  board: "#103a2c",
  boardHi: "#134432",
  sink: "#0a2820",
  copper: "#c8a24a",
  copperHi: "#e0c072",
  copperDim: "#8f7233",
  silk: "#e6efe9",
  silkDim: "#9fb8ac",
  faint: "#6d8a7c",
  line: "rgba(200,162,74,0.22)",
  lineSoft: "rgba(200,162,74,0.12)",
  trace: "rgba(200,162,74,0.45)",
  ok: "#5fd39a",
  okWash: "rgba(95,211,154,0.14)",
  warn: "#e0a13a",
  warnWash: "rgba(224,161,58,0.16)",
  info: "#6fb4d8",
  infoWash: "rgba(111,180,216,0.14)",
  bad: "#e57373",
  badWash: "rgba(229,115,115,0.16)",
};

const mono = {
  fontFamily: "ui-monospace, SFMono-Regular, Menlo, Consolas, monospace",
};
const body = {
  fontFamily: "system-ui, -apple-system, Segoe UI, Roboto, sans-serif",
};

function statusMeta(s: CredStatus): {
  label: string;
  code: string;
  Icon: LucideIcon;
  alarm: boolean;
  tone: string;
  wash: string;
} {
  switch (s) {
    case "VERIFIED":
      return {
        label: "Geverifieerd",
        code: "SIG-OK",
        Icon: ShieldCheck,
        alarm: false,
        tone: C.ok,
        wash: C.okWash,
      };
    case "SUBMITTED":
      return {
        label: "In beoordeling",
        code: "SIG-WAIT",
        Icon: Clock,
        alarm: false,
        tone: C.info,
        wash: C.infoWash,
      };
    case "EXPIRING":
      return {
        label: "Verloopt binnenkort",
        code: "SIG-WARN",
        Icon: AlertTriangle,
        alarm: true,
        tone: C.warn,
        wash: C.warnWash,
      };
    case "REJECTED":
      return {
        label: "Afgewezen",
        code: "SIG-FAIL",
        Icon: AlertTriangle,
        alarm: true,
        tone: C.bad,
        wash: C.badWash,
      };
  }
}

// — Decoratief PCB-traceveld als achtergrond van een paneel —
function TraceField({ seed = 0 }: { seed?: number }) {
  const rows = [18, 42, 66, 90];
  return (
    <svg
      className="pointer-events-none absolute inset-0 h-full w-full"
      aria-hidden="true"
      preserveAspectRatio="none"
      viewBox="0 0 320 120"
    >
      {rows.map((y, i) => {
        const off = ((seed + i) % 3) * 16;
        return (
          <g key={y} stroke={C.trace} strokeWidth="1" fill="none" opacity={0.5}>
            <path d={`M0 ${y} H${60 + off} L${84 + off} ${y - 18} H${320}`} />
            <circle cx={60 + off} cy={y} r="2.4" fill={C.copperDim} stroke="none" />
            <circle cx={84 + off} cy={y - 18} r="2.4" fill={C.copperDim} stroke="none" />
          </g>
        );
      })}
    </svg>
  );
}

// — Via: doorverbinding als gouden ring met donkere kern —
function Via({ size = 40, tone = C.copper }: { size?: number; tone?: string }) {
  return (
    <span
      className="inline-flex shrink-0 items-center justify-center rounded-full"
      style={{
        width: size,
        height: size,
        background: C.sink,
        border: `2px solid ${tone}`,
        boxShadow: `0 0 0 3px ${C.mask}, inset 0 0 8px rgba(0,0,0,0.5)`,
      }}
      aria-hidden="true"
    />
  );
}

// — Paneel: een deel van de print met koperrand en hoek-vias —
function Panel({
  children,
  className = "",
  as: Tag = "div",
  glow = false,
  traces = false,
  seed = 0,
}: {
  children: React.ReactNode;
  className?: string;
  as?: "div" | "section" | "li";
  glow?: boolean;
  traces?: boolean;
  seed?: number;
}) {
  return (
    <Tag
      className={`relative overflow-hidden rounded-lg ${className}`}
      style={{
        background: `linear-gradient(180deg, ${C.boardHi}, ${C.board})`,
        border: `1px solid ${C.line}`,
        boxShadow: glow
          ? `0 0 0 1px ${C.lineSoft}, 0 12px 28px rgba(0,0,0,0.35)`
          : "0 6px 18px rgba(0,0,0,0.28)",
      }}
    >
      {traces && <TraceField seed={seed} />}
      {["left-1.5 top-1.5", "right-1.5 top-1.5", "left-1.5 bottom-1.5", "right-1.5 bottom-1.5"].map(
        (pos) => (
          <span
            key={pos}
            className={`pointer-events-none absolute ${pos} h-1.5 w-1.5 rounded-full`}
            style={{ border: `1px solid ${C.copperDim}`, background: C.sink }}
            aria-hidden="true"
          />
        ),
      )}
      <div className="relative">{children}</div>
    </Tag>
  );
}

// — Siebdruk-label: mono, uppercase, spatiëring —
function Silk({ children, tone = C.copper }: { children: React.ReactNode; tone?: string }) {
  return (
    <p
      className="text-[10px] font-semibold uppercase tracking-[0.28em]"
      style={{ color: tone, ...mono }}
    >
      {children}
    </p>
  );
}

// — Component-chip: label als op een IC, gemonteerd op een pad —
function Chip({
  code,
  tone = C.copper,
  children,
}: {
  code: string;
  tone?: string;
  children: React.ReactNode;
}) {
  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-[5px] px-2 py-1 text-[10.5px] font-semibold"
      style={{
        color: tone,
        background: C.sink,
        border: `1px solid ${C.lineSoft}`,
        ...mono,
      }}
    >
      <span className="text-[8.5px] opacity-70">{code}</span>
      <span style={{ color: C.silk }}>{children}</span>
    </span>
  );
}

function Pad({
  children,
  tone = C.copper,
  wash,
  alarm = false,
}: {
  children: React.ReactNode;
  tone?: string;
  wash?: string;
  alarm?: boolean;
}) {
  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-[5px] px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.08em]"
      style={{
        color: tone,
        background: wash ?? "transparent",
        border: `1px solid ${tone}`,
        ...mono,
      }}
    >
      {children}
      {alarm && <span className="sr-only"> (let op)</span>}
    </span>
  );
}

function CopperButton({
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
      className={`group inline-flex items-center justify-center gap-2 rounded-[6px] px-4 py-2.5 text-[12.5px] font-bold uppercase tracking-[0.06em] transition-all duration-200 hover:brightness-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#e0c072] focus-visible:ring-offset-2 focus-visible:ring-offset-[#0b2e22] active:translate-y-px motion-reduce:transition-none ${className}`}
      style={{
        color: C.mask,
        background: `linear-gradient(180deg, ${C.copperHi}, ${C.copper})`,
        boxShadow: `0 2px 0 ${C.copperDim}, 0 6px 14px rgba(0,0,0,0.3)`,
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
      className={`inline-flex items-center justify-center gap-2 rounded-[6px] px-3.5 py-2.5 text-[12px] font-semibold uppercase tracking-[0.06em] transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#e0c072] focus-visible:ring-offset-2 focus-visible:ring-offset-[#0b2e22] motion-reduce:transition-none ${className}`}
      style={{
        color: active ? C.mask : C.silk,
        background: active ? C.copper : "transparent",
        border: `1px solid ${active ? C.copper : C.line}`,
        ...mono,
      }}
    >
      {children}
    </button>
  );
}

// — Signaal-sparkline: koperen trace met via aan het eind —
function Signal({ data, tone, id }: { data: number[]; tone: string; id: string }) {
  const max = Math.max(...data);
  const min = Math.min(...data);
  const span = max - min || 1;
  const w = 112;
  const h = 30;
  const pts = data.map((d, i) => {
    const x = (i / (data.length - 1)) * w;
    const y = h - ((d - min) / span) * (h - 6) - 3;
    return [x, y] as const;
  });
  // Rechthoekige "digitale" traceroute tussen punten
  let path = `M ${pts[0]![0].toFixed(1)} ${pts[0]![1].toFixed(1)}`;
  for (let i = 1; i < pts.length; i++) {
    const [x, y] = pts[i]!;
    const [px] = pts[i - 1]!;
    const midX = (px + x) / 2;
    path += ` H ${midX.toFixed(1)} V ${y.toFixed(1)} H ${x.toFixed(1)}`;
  }
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
        <linearGradient id={`sig-${id}`} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor={tone} stopOpacity="0.25" />
          <stop offset="100%" stopColor={tone} stopOpacity="1" />
        </linearGradient>
      </defs>
      <path
        d={path}
        fill="none"
        stroke={`url(#sig-${id})`}
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx={last[0]} cy={last[1]} r="3" fill={C.sink} stroke={tone} strokeWidth="1.6" />
    </svg>
  );
}

function MatchGauge({ value }: { value: number }) {
  const strong = value >= 90;
  const tone = strong ? C.ok : value >= 85 ? C.copper : C.info;
  return (
    <span className="hidden items-center gap-2 sm:flex" aria-hidden="true">
      <span
        className="relative h-1.5 w-20 overflow-hidden rounded-full"
        style={{ background: C.sink, border: `1px solid ${C.lineSoft}` }}
      >
        <span
          className="block h-full rounded-full"
          style={{ width: `${value}%`, background: tone }}
        />
      </span>
      <span className="text-[12px] font-bold tabular-nums" style={{ color: tone, ...mono }}>
        {value}%
      </span>
    </span>
  );
}

export function Concept399() {
  const [screen, setScreen] = useState<ScreenKey>("dashboard");
  const active = OPDRACHTEN[0] as Opdracht;

  return (
    <div
      className="min-h-[720px] w-full antialiased"
      style={{
        ...body,
        color: C.silk,
        background: `radial-gradient(120% 80% at 20% 0%, ${C.maskAlt}, ${C.mask})`,
      }}
    >
      <div className="mx-auto max-w-6xl px-4 pb-24 sm:px-6 md:px-8">
        <TopBar />
        <NavRail screen={screen} setScreen={setScreen} />
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
          className="inline-flex h-11 w-11 items-center justify-center rounded-lg"
          style={{
            background: C.sink,
            border: `1px solid ${C.line}`,
            color: C.copper,
            boxShadow: "inset 0 0 12px rgba(0,0,0,0.5)",
          }}
          aria-hidden="true"
        >
          <CircuitBoard size={20} />
        </span>
        <div>
          <p
            className="text-[17px] font-bold uppercase leading-none tracking-[0.14em]"
            style={{ color: C.silk, ...mono }}
          >
            Printplaat
          </p>
          <p className="mt-1.5 text-[10.5px] leading-none" style={{ color: C.faint, ...mono }}>
            REV 3.9 · {PROFIEL.plaats} · 5V/GND
          </p>
        </div>
      </div>
      <div className="flex items-center gap-3">
        <span
          className="hidden items-center gap-1.5 rounded-[5px] px-2.5 py-1.5 text-[10.5px] font-semibold uppercase tracking-[0.1em] sm:inline-flex"
          style={{ color: C.ok, border: `1px solid ${C.ok}`, background: C.okWash, ...mono }}
        >
          <ShieldCheck size={12} aria-hidden="true" />
          {PROFIEL.trust}
        </span>
        <span
          className="relative inline-flex h-10 w-10 items-center justify-center rounded-lg"
          style={{ background: C.sink, border: `1px solid ${C.line}`, color: C.silkDim }}
          aria-label={`${ongelezen} ongelezen berichten`}
        >
          <Bell size={16} aria-hidden="true" />
          {ongelezen > 0 && (
            <span
              className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full text-[9px] font-bold"
              style={{ background: C.warn, color: C.mask, ...mono }}
              aria-hidden="true"
            >
              {ongelezen}
            </span>
          )}
        </span>
        <span className="hidden text-right sm:block">
          <span className="block text-[12.5px] font-bold" style={{ color: C.silk }}>
            {PROFIEL.naam}
          </span>
          <span className="block text-[10px]" style={{ color: C.faint, ...mono }}>
            {PROFIEL.rol}
          </span>
        </span>
        <span
          className="inline-flex h-11 w-11 items-center justify-center rounded-lg text-[12px] font-bold"
          style={{ background: C.sink, border: `1px solid ${C.copper}`, color: C.copper, ...mono }}
          aria-hidden="true"
        >
          {PROFIEL.initialen}
        </span>
      </div>
    </header>
  );
}

function NavRail({ screen, setScreen }: { screen: ScreenKey; setScreen: (s: ScreenKey) => void }) {
  return (
    <nav aria-label="Hoofdnavigatie" className="mt-6">
      <div
        className="flex items-center gap-1 overflow-x-auto rounded-lg p-1.5"
        style={{ background: C.sink, border: `1px solid ${C.line}` }}
      >
        {SCREENS.map((s, i) => {
          const on = s.key === screen;
          return (
            <button
              key={s.key}
              type="button"
              onClick={() => setScreen(s.key)}
              aria-current={on ? "page" : undefined}
              className="group flex shrink-0 items-center gap-2 rounded-[6px] px-3.5 py-2 text-[11.5px] font-semibold uppercase tracking-[0.08em] transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#e0c072] focus-visible:ring-offset-2 focus-visible:ring-offset-[#0a2820] motion-reduce:transition-none"
              style={{
                color: on ? C.mask : C.silkDim,
                background: on ? C.copper : "transparent",
                ...mono,
              }}
            >
              <span
                className="h-1.5 w-1.5 rounded-full"
                style={{ background: on ? C.mask : C.copperDim }}
                aria-hidden="true"
              />
              <span className="hidden sm:inline">{`J${i + 1}·`}</span>
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
    <div className="space-y-6">
      <section className="grid grid-cols-1 gap-5 lg:grid-cols-[1.3fr_1fr]">
        <Panel className="p-6" traces glow>
          <Silk>Systeem online · vandaag</Silk>
          <h1
            className="mt-4 text-[30px] font-bold leading-[1.05] tracking-[-0.01em] md:text-[36px]"
            style={{ color: C.silk }}
          >
            Goedemorgen, {PROFIEL.naam.split(" ")[0]}.
          </h1>
          <p className="mt-3 max-w-md text-[13.5px] leading-relaxed" style={{ color: C.silkDim }}>
            Elk signaal is gerouteerd naar de juiste component. Wat nu spanning vraagt staat
            hieronder — de rest loopt stil op de achtergrond door.
          </p>
          <div className="mt-5 flex flex-wrap items-center gap-2.5">
            <CopperButton onClick={onActies}>
              Volgende actie
              <ArrowRight
                size={14}
                aria-hidden="true"
                className="transition-transform group-hover:translate-x-0.5 motion-reduce:transition-none"
              />
            </CopperButton>
            <GhostButton onClick={onOpen}>Marktplaats</GhostButton>
          </div>
          <div className="mt-6 flex flex-wrap gap-2">
            <Chip code="U1">
              {verified}/{CREDENTIALS.length} verified
            </Chip>
            <Chip code="U2" tone={C.info}>
              7 open reacties
            </Chip>
            <Chip code="U3" tone={C.warn}>
              1 alarm
            </Chip>
          </div>
        </Panel>

        <Panel className="p-6" glow>
          <div className="flex items-center justify-between">
            <Silk tone={C.warn}>Kritiek pad</Silk>
            <Via size={34} tone={C.warn} />
          </div>
          <h2 className="mt-4 text-[19px] font-bold leading-snug" style={{ color: C.silk }}>
            {primair.titel}
          </h2>
          <p className="mt-2 text-[13px] leading-relaxed" style={{ color: C.silkDim }}>
            {primair.detail}
          </p>
          <div className="mt-5">
            <CopperButton onClick={onActies} className="w-full">
              {primair.cta}
              <ArrowRight size={14} aria-hidden="true" />
            </CopperButton>
          </div>
        </Panel>
      </section>

      <section>
        <div className="mb-3 flex items-baseline justify-between">
          <Silk>Meetpunten · deze maand</Silk>
          <span className="text-[10px]" style={{ color: C.faint, ...mono }}>
            TP1—TP4
          </span>
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {KPIS.map((k, i) => (
            <Panel key={k.label} className="p-4">
              <div className="flex items-start justify-between gap-2">
                <p
                  className="text-[10px] font-semibold uppercase tracking-[0.1em]"
                  style={{ color: C.silkDim, ...mono }}
                >
                  {k.label}
                </p>
                <span
                  className="inline-flex items-center gap-0.5 rounded-[4px] px-1.5 py-0.5 text-[9.5px] font-bold tabular-nums"
                  style={{
                    color: k.up ? C.ok : C.warn,
                    background: k.up ? C.okWash : C.warnWash,
                    ...mono,
                  }}
                >
                  {k.up ? "▲" : "▼"} {k.trend.replace(/^[+-]/, "")}
                </span>
              </div>
              <p
                className="mt-2.5 text-[26px] font-bold tabular-nums leading-none tracking-[-0.01em]"
                style={{ color: C.silk, ...mono }}
              >
                {k.value}
              </p>
              <div className="mt-3">
                <Signal data={k.spark} tone={k.up ? C.copper : C.warn} id={`kpi-${i}`} />
              </div>
            </Panel>
          ))}
        </div>
      </section>

      <section className="grid grid-cols-1 gap-5 lg:grid-cols-[1.4fr_1fr]">
        <div>
          <div className="mb-3 flex items-baseline justify-between">
            <Silk>Ingaande signalen · opdrachten</Silk>
            <button
              type="button"
              onClick={onOpen}
              className="rounded text-[10.5px] font-bold uppercase tracking-[0.1em] transition-colors hover:brightness-125 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#e0c072] focus-visible:ring-offset-2 focus-visible:ring-offset-[#0b2e22]"
              style={{ color: C.copper, ...mono }}
            >
              Alles →
            </button>
          </div>
          <ul className="space-y-3">
            {OPDRACHTEN.map((o, i) => (
              <li key={o.id}>
                <button
                  type="button"
                  onClick={onOpen}
                  className="group grid w-full grid-cols-[auto_1fr_auto] items-center gap-3.5 rounded-lg p-3.5 text-left transition-all duration-200 hover:brightness-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#e0c072] focus-visible:ring-offset-2 focus-visible:ring-offset-[#0b2e22] motion-reduce:transition-none"
                  style={{ background: C.boardHi, border: `1px solid ${C.line}` }}
                >
                  <span
                    className="relative inline-flex h-11 w-11 items-center justify-center rounded-full"
                    style={{
                      background: C.sink,
                      border: `2px solid ${i === 0 ? C.ok : C.copper}`,
                    }}
                  >
                    <span
                      className="text-[12px] font-bold tabular-nums"
                      style={{ color: i === 0 ? C.ok : C.copper, ...mono }}
                    >
                      {o.match}
                    </span>
                  </span>
                  <span className="min-w-0">
                    <span
                      className="block truncate text-[14.5px] font-bold"
                      style={{ color: C.silk }}
                    >
                      {o.titel}
                    </span>
                    <span
                      className="mt-0.5 block truncate text-[11.5px]"
                      style={{ color: C.silkDim, ...mono }}
                    >
                      {o.opdrachtgever} · {o.plaats} · {o.tarief}
                    </span>
                  </span>
                  <span className="flex items-center gap-3">
                    <MatchGauge value={o.match} />
                    <ChevronRight
                      size={17}
                      aria-hidden="true"
                      className="transition-transform group-hover:translate-x-0.5 motion-reduce:transition-none"
                      style={{ color: C.faint }}
                    />
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <div className="mb-3">
            <Silk>Verificatie-bus</Silk>
          </div>
          <Panel className="p-4">
            <ul className="space-y-2.5">
              {CREDENTIALS.map((c) => {
                const st = statusMeta(c.status);
                return (
                  <li key={c.naam} className="flex items-center gap-3">
                    <Via size={30} tone={st.tone} />
                    <span className="min-w-0 flex-1">
                      <span
                        className="block truncate text-[12.5px] font-semibold"
                        style={{ color: C.silk }}
                      >
                        {c.naam}
                      </span>
                      <span
                        className="block truncate text-[10px]"
                        style={{ color: C.faint, ...mono }}
                      >
                        {st.code}
                      </span>
                    </span>
                    <st.Icon size={15} aria-hidden="true" style={{ color: st.tone }} />
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
        <Silk>Signaalbron · marktplaats</Silk>
        <h1
          className="mt-3 text-[28px] font-bold leading-none tracking-[-0.01em]"
          style={{ color: C.silk }}
        >
          Open opdrachten
        </h1>
        <p className="mt-2 text-[12.5px]" style={{ color: C.silkDim, ...mono }}>
          {String(filtered.length).padStart(2, "0")}/{String(OPDRACHTEN.length).padStart(2, "0")}{" "}
          kanalen actief
        </p>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div
          className="flex flex-1 items-center gap-2.5 rounded-lg px-3.5 py-3"
          style={{ background: C.sink, border: `1px solid ${C.line}` }}
        >
          <Search size={16} aria-hidden="true" style={{ color: C.faint }} />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Filter op titel, plaats of opdrachtgever…"
            aria-label="Opdrachten filteren"
            className="w-full bg-transparent text-[13px] outline-none placeholder:text-[#6d8a7c]"
            style={{ color: C.silk, ...mono }}
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
        </div>
      </div>

      {filtered.length === 0 ? (
        <Panel className="p-0">
          <div className="flex flex-col items-center px-6 py-16 text-center">
            <Via size={62} tone={C.copper} />
            <p className="mt-5 text-[18px] font-bold" style={{ color: C.silk }}>
              Geen signaal
            </p>
            <p className="mx-auto mt-2 max-w-xs text-[13px]" style={{ color: C.silkDim }}>
              Geen kanaal past bij {q ? `“${q}”` : "je filter"}. Verruim de filter om meer
              resultaten te routeren.
            </p>
            <div className="mt-6">
              <CopperButton onClick={() => setQ("")}>
                Filter wissen <ArrowRight size={14} aria-hidden="true" />
              </CopperButton>
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
  const tone = strong ? C.ok : C.copper;
  return (
    <Panel className="p-5" traces={index === 0}>
      <div className="grid grid-cols-[1fr_auto] items-start gap-4">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <Chip code="CH">{String(index + 1).padStart(2, "0")}</Chip>
            <span className="text-[11px] font-semibold" style={{ color: C.faint, ...mono }}>
              {opdracht.id}
            </span>
          </div>
          <h3 className="mt-2 text-[17px] font-bold leading-snug" style={{ color: C.silk }}>
            {opdracht.titel}
          </h3>
          <p className="mt-1 text-[12px]" style={{ color: C.silkDim, ...mono }}>
            {opdracht.opdrachtgever} · {opdracht.plaats} · {opdracht.uren}
          </p>
          <div className="mt-3 flex flex-wrap gap-1.5">
            {opdracht.tags.map((t) => (
              <Pad key={t} tone={C.copperHi}>
                {t}
              </Pad>
            ))}
          </div>
        </div>
        <div className="flex flex-col items-center gap-2">
          <span
            className="relative inline-flex h-14 w-14 items-center justify-center rounded-full"
            style={{ background: C.sink, border: `2px solid ${tone}` }}
          >
            <span className="text-[16px] font-bold tabular-nums" style={{ color: tone, ...mono }}>
              {opdracht.match}
            </span>
          </span>
          <span className="text-[13px] font-bold tabular-nums" style={{ color: C.silk, ...mono }}>
            {opdracht.tarief}
          </span>
        </div>
      </div>
      <div className="mt-4 flex items-center gap-3">
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          className="inline-flex items-center gap-1.5 rounded-[5px] px-2.5 py-1.5 text-[11px] font-semibold uppercase tracking-[0.06em] transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#e0c072] focus-visible:ring-offset-2 focus-visible:ring-offset-[#0b2e22]"
          style={{ color: C.copper, border: `1px solid ${C.line}`, ...mono }}
        >
          {open ? <Minus size={12} aria-hidden="true" /> : <Plus size={12} aria-hidden="true" />}
          Routelogica
        </button>
        <div className="ml-auto">
          <CopperButton onClick={onOpen}>
            Reageer <ArrowRight size={13} aria-hidden="true" />
          </CopperButton>
        </div>
      </div>
      <div
        className="grid transition-all duration-300 motion-reduce:transition-none"
        style={{ gridTemplateRows: open ? "1fr" : "0fr" }}
      >
        <div className="overflow-hidden">
          <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
            <RedenBlok
              titel="Doorverbonden"
              tone={C.ok}
              Icon={Check}
              items={opdracht.redenen.plus}
            />
            <RedenBlok
              titel="Weerstand"
              tone={C.warn}
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
      style={{ background: C.sink, border: `1px solid ${C.lineSoft}` }}
    >
      <p
        className="text-[10px] font-semibold uppercase tracking-[0.14em]"
        style={{ color: tone, ...mono }}
      >
        {titel}
      </p>
      <ul className="mt-2.5 space-y-2">
        {items.map((r) => (
          <li key={r} className="flex items-start gap-2 text-[12.5px]" style={{ color: C.silkDim }}>
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
  const tone = strong ? C.ok : C.copper;
  return (
    <div className="space-y-6">
      <button
        type="button"
        onClick={onBack}
        className="inline-flex items-center gap-2 rounded-[6px] px-3.5 py-2 text-[11.5px] font-semibold uppercase tracking-[0.08em] transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#e0c072] focus-visible:ring-offset-2 focus-visible:ring-offset-[#0b2e22]"
        style={{ color: C.silk, border: `1px solid ${C.line}`, ...mono }}
      >
        <ArrowRight size={13} aria-hidden="true" className="rotate-180" /> Terug
      </button>

      <Panel className="p-6 md:p-8" traces glow>
        <div className="relative flex flex-wrap items-center gap-2">
          <Chip code="ID">{opdracht.id}</Chip>
          <Pad tone={tone} wash={strong ? C.okWash : C.warnWash}>
            <Zap size={11} aria-hidden="true" /> {opdracht.match}% match
          </Pad>
        </div>
        <h1
          className="relative mt-4 max-w-2xl text-[28px] font-bold leading-[1.08] tracking-[-0.01em] md:text-[36px]"
          style={{ color: C.silk }}
        >
          {opdracht.titel}
        </h1>
        <p className="relative mt-2 text-[13.5px]" style={{ color: C.silkDim, ...mono }}>
          {opdracht.opdrachtgever} · {opdracht.plaats}
        </p>
        <div className="relative mt-5 flex flex-wrap gap-2.5">
          <CopperButton>
            Reageer op opdracht <ArrowRight size={14} aria-hidden="true" />
          </CopperButton>
          <GhostButton>Bewaren</GhostButton>
        </div>
      </Panel>

      <section className="grid grid-cols-2 gap-4 md:grid-cols-4">
        {[
          { l: "Tarief", v: opdracht.tarief, c: "R1" },
          { l: "Omvang", v: opdracht.uren, c: "R2" },
          { l: "Start", v: opdracht.start, c: "R3" },
          { l: "Match", v: `${opdracht.match}%`, c: "R4" },
        ].map((m) => (
          <Panel key={m.l} className="p-4">
            <div className="flex items-center justify-between">
              <p
                className="text-[9.5px] font-semibold uppercase tracking-[0.14em]"
                style={{ color: C.faint, ...mono }}
              >
                {m.l}
              </p>
              <span className="text-[8.5px]" style={{ color: C.copperDim, ...mono }}>
                {m.c}
              </span>
            </div>
            <p
              className="mt-1.5 text-[18px] font-bold tabular-nums tracking-[-0.01em]"
              style={{ color: C.silk, ...mono }}
            >
              {m.v}
            </p>
          </Panel>
        ))}
      </section>

      <section>
        <Silk>Routelogica · waarom deze match</Silk>
        <p className="mt-3 max-w-xl text-[13.5px] leading-relaxed" style={{ color: C.silkDim }}>
          Transparant onderbouwd op je geverifieerde profiel — welke signalen doorkomen én waar
          weerstand zit, zonder verborgen score.
        </p>
        <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-2">
          <Panel className="p-5">
            <div className="flex items-center gap-2">
              <Via size={30} tone={C.ok} />
              <p
                className="text-[11px] font-semibold uppercase tracking-[0.12em]"
                style={{ color: C.ok, ...mono }}
              >
                Doorverbonden
              </p>
            </div>
            <ul className="mt-4 space-y-3">
              {opdracht.redenen.plus.map((r) => (
                <li
                  key={r}
                  className="flex items-start gap-3 text-[13.5px]"
                  style={{ color: C.silkDim }}
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
          </Panel>
          <Panel className="p-5">
            <div className="flex items-center gap-2">
              <Via size={30} tone={C.warn} />
              <p
                className="text-[11px] font-semibold uppercase tracking-[0.12em]"
                style={{ color: C.warn, ...mono }}
              >
                Weerstand
              </p>
            </div>
            <ul className="mt-4 space-y-3">
              {opdracht.redenen.min.map((r) => (
                <li
                  key={r}
                  className="flex items-start gap-3 text-[13.5px]"
                  style={{ color: C.silkDim }}
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
      <Panel className="p-6 md:p-7" glow traces>
        <div className="flex flex-wrap items-center justify-between gap-6">
          <div className="max-w-md">
            <Silk>Authenticatie · certificaten</Silk>
            <h1
              className="mt-3 text-[26px] font-bold leading-tight tracking-[-0.01em]"
              style={{ color: C.silk }}
            >
              Verificatie
            </h1>
            <p className="mt-3 text-[13.5px] leading-relaxed" style={{ color: C.silkDim }}>
              <span className="font-bold" style={{ color: C.silk }}>
                {PROFIEL.trust}.
              </span>{" "}
              {verified} van {CREDENTIALS.length} signalen geverifieerd. Eén nadert de
              EXPIRE-drempel en vraagt om vernieuwing.
            </p>
          </div>
          <div className="flex items-center gap-4">
            <span
              className="inline-flex h-24 w-24 flex-col items-center justify-center rounded-full"
              style={{
                background: C.sink,
                border: `2px solid ${C.copper}`,
                boxShadow: "inset 0 0 16px rgba(0,0,0,0.5)",
              }}
            >
              <span
                className="text-[26px] font-bold tabular-nums leading-none"
                style={{ color: C.copper, ...mono }}
              >
                {ratio}
              </span>
              <span
                className="mt-1 text-[8px] font-semibold uppercase tracking-[0.14em]"
                style={{ color: C.faint, ...mono }}
              >
                % OK
              </span>
            </span>
          </div>
        </div>
      </Panel>

      <ul className="space-y-3">
        {CREDENTIALS.map((c) => {
          const st = statusMeta(c.status);
          const isOpen = open === c.naam;
          return (
            <li key={c.naam}>
              <Panel className="p-5">
                <button
                  type="button"
                  onClick={() => setOpen(isOpen ? null : c.naam)}
                  aria-expanded={isOpen}
                  className="grid w-full grid-cols-[auto_1fr_auto] items-center gap-4 rounded text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#e0c072] focus-visible:ring-offset-2 focus-visible:ring-offset-[#103a2c]"
                >
                  <span
                    className="relative inline-flex h-11 w-11 items-center justify-center rounded-full"
                    style={{ background: C.sink, border: `2px solid ${st.tone}` }}
                  >
                    <st.Icon size={18} aria-hidden="true" style={{ color: st.tone }} />
                  </span>
                  <span className="min-w-0">
                    <span
                      className="block truncate text-[15px] font-bold"
                      style={{ color: C.silk }}
                    >
                      {c.naam}
                    </span>
                    <span
                      className="mt-0.5 block truncate text-[11.5px]"
                      style={{ color: C.silkDim, ...mono }}
                    >
                      {c.detail}
                    </span>
                  </span>
                  <span className="flex items-center gap-3">
                    <Pad tone={st.tone} wash={st.wash} alarm={st.alarm}>
                      <st.Icon size={11} aria-hidden="true" />
                      <span className="hidden sm:inline">{st.label}</span>
                      <span className="sm:hidden">{st.code}</span>
                    </Pad>
                    <span
                      className="transition-transform motion-reduce:transition-none"
                      style={{
                        color: C.faint,
                        transform: isOpen ? "rotate(45deg)" : "rotate(0deg)",
                      }}
                      aria-hidden="true"
                    >
                      <Plus size={15} />
                    </span>
                  </span>
                </button>
                <div
                  className="grid transition-all duration-300 motion-reduce:transition-none"
                  style={{ gridTemplateRows: isOpen ? "1fr" : "0fr" }}
                >
                  <div className="overflow-hidden">
                    <div className="mt-4 pl-[60px]">
                      <div
                        className="rounded-lg p-4"
                        style={{ background: C.sink, border: `1px solid ${C.lineSoft}` }}
                      >
                        <p
                          className="max-w-xl text-[13px] leading-relaxed"
                          style={{ color: C.silkDim }}
                        >
                          {c.detail}. Documenten worden versleuteld bewaard en alleen na je
                          expliciete toestemming doorgestuurd naar een opdrachtgever.
                        </p>
                        <div className="mt-3 flex flex-wrap gap-2">
                          <CopperButton>
                            {c.status === "EXPIRING" ? "Vernieuwen" : "Bekijken"}
                          </CopperButton>
                          <GhostButton>Historie</GhostButton>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </Panel>
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
        <Silk>Interrupt-wachtrij · volgende acties</Silk>
        <h1
          className="mt-3 text-[28px] font-bold leading-none tracking-[-0.01em]"
          style={{ color: C.silk }}
        >
          Acties
        </h1>
        <p className="mt-2 max-w-md text-[13px]" style={{ color: C.silkDim }}>
          Op prioriteit gerouteerd — werk van boven naar beneden om verifieerbaar en betaald te
          blijven.
        </p>
      </div>

      <ol className="space-y-3">
        {ACTIES.map((a, i) => {
          const warn = a.urgentie === "warning";
          const tone = warn ? C.warn : C.info;
          const wash = warn ? C.warnWash : C.infoWash;
          return (
            <li key={a.titel}>
              <Panel className="p-5">
                <div className="grid grid-cols-[auto_1fr] items-start gap-4 sm:grid-cols-[auto_1fr_auto]">
                  <span
                    className="flex h-11 w-11 items-center justify-center rounded-full text-[14px] font-bold tabular-nums"
                    style={{
                      background: C.sink,
                      border: `2px solid ${tone}`,
                      color: tone,
                      ...mono,
                    }}
                    aria-hidden="true"
                  >
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <div className="min-w-0">
                    <span
                      className="inline-flex items-center gap-1 rounded-[4px] px-2 py-0.5 text-[9.5px] font-semibold uppercase tracking-[0.1em]"
                      style={{ color: tone, background: wash, ...mono }}
                    >
                      {warn ? (
                        <AlertTriangle size={10} aria-hidden="true" />
                      ) : (
                        <Radio size={10} aria-hidden="true" />
                      )}
                      {warn ? "IRQ-hoog" : "Signaal"}
                    </span>
                    <h2
                      className="mt-2 text-[16px] font-bold leading-snug"
                      style={{ color: C.silk }}
                    >
                      {a.titel}
                    </h2>
                    <p
                      className="mt-1.5 max-w-lg text-[13px] leading-relaxed"
                      style={{ color: C.silkDim }}
                    >
                      {a.detail}
                    </p>
                  </div>
                  <div className="col-span-2 mt-1 sm:col-span-1 sm:mt-0 sm:self-center">
                    <CopperButton>
                      {a.cta}
                      <ArrowRight size={13} aria-hidden="true" />
                    </CopperButton>
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

function factuurTone(status: string): { tone: string; wash: string; Icon: LucideIcon | null } {
  if (status === "Openstaand") return { tone: C.warn, wash: C.warnWash, Icon: AlertTriangle };
  if (status === "Betaald") return { tone: C.ok, wash: C.okWash, Icon: Check };
  return { tone: C.silkDim, wash: "transparent", Icon: null };
}

function Facturen() {
  const totaalBetaald = "€ 8.622";
  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <Silk>Vermogensbeheer · grootboek</Silk>
          <h1
            className="mt-3 text-[28px] font-bold leading-none tracking-[-0.01em]"
            style={{ color: C.silk }}
          >
            Facturen
          </h1>
        </div>
        <CopperButton>
          <Plus size={14} aria-hidden="true" /> Nieuwe factuur
        </CopperButton>
      </div>

      <section className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {[
          { l: "Betaald (mnd)", v: totaalBetaald, sub: "3 voldaan", tone: C.ok, alarm: false },
          { l: "Openstaand", v: "€ 1.350", sub: "1 factuur · 9 dagen", tone: C.warn, alarm: true },
          { l: "Concept", v: "€ 880", sub: "klaar om te versturen", tone: C.info, alarm: false },
        ].map((s) => (
          <Panel key={s.l} className="p-5">
            <div className="flex items-center justify-between">
              <p
                className="text-[10px] font-semibold uppercase tracking-[0.1em]"
                style={{ color: C.silkDim, ...mono }}
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
              className="mt-2 text-[26px] font-bold tabular-nums tracking-[-0.01em]"
              style={{ color: s.alarm ? C.warn : C.silk, ...mono }}
            >
              {s.v}
            </p>
            <p className="mt-1 text-[11.5px]" style={{ color: C.faint, ...mono }}>
              {s.sub}
            </p>
          </Panel>
        ))}
      </section>

      <Panel className="overflow-hidden p-5">
        <div
          className="hidden grid-cols-[8rem_1fr_5rem_9rem_6rem] gap-4 px-1 pb-3 sm:grid"
          style={{ borderBottom: `1px solid ${C.line}` }}
        >
          {["Nummer", "Klant", "Datum", "Status", "Bedrag"].map((h, i) => (
            <span
              key={h}
              className={`text-[9.5px] font-semibold uppercase tracking-[0.14em] ${i === 4 ? "text-right" : ""}`}
              style={{ color: C.faint, ...mono }}
            >
              {h}
            </span>
          ))}
        </div>
        <ul>
          {FACTUREN.map((f) => {
            const ft = factuurTone(f.status);
            const acc = f.status === "Openstaand";
            return (
              <li
                key={f.nr}
                className="grid grid-cols-[1fr_auto] items-center gap-3 rounded px-1 py-3.5 transition-colors hover:bg-[#134432] sm:grid-cols-[8rem_1fr_5rem_9rem_6rem] sm:gap-4"
                style={{ borderBottom: `1px solid ${C.lineSoft}` }}
              >
                <span
                  className="order-1 text-[11.5px] font-semibold tabular-nums"
                  style={{ color: C.faint, ...mono }}
                >
                  {f.nr}
                </span>
                <span
                  className="order-3 min-w-0 truncate text-[13.5px] font-bold sm:order-2"
                  style={{ color: C.silk }}
                >
                  {f.klant}
                </span>
                <span
                  className="order-4 hidden text-[11.5px] tabular-nums sm:order-3 sm:inline"
                  style={{ color: C.silkDim, ...mono }}
                >
                  {f.datum}
                </span>
                <span className="order-5 sm:order-4">
                  <span
                    className="inline-flex items-center gap-1.5 rounded-[5px] px-2.5 py-1 text-[10.5px] font-semibold uppercase tracking-[0.06em]"
                    style={{
                      color: ft.tone,
                      background: ft.wash,
                      border: `1px solid ${ft.tone === C.silkDim ? C.lineSoft : ft.tone}`,
                      ...mono,
                    }}
                  >
                    {ft.Icon && <ft.Icon size={11} aria-hidden="true" />}
                    {f.status}
                  </span>
                </span>
                <span
                  className="order-2 text-right text-[14px] font-bold tabular-nums sm:order-5"
                  style={{ color: acc ? C.warn : C.silk, ...mono }}
                >
                  {f.bedrag}
                </span>
              </li>
            );
          })}
        </ul>
        <div className="mt-2 flex items-baseline justify-between px-1 pt-3">
          <span
            className="flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.16em]"
            style={{ color: C.faint, ...mono }}
          >
            <Cpu size={13} aria-hidden="true" style={{ color: C.copperDim }} /> Totaal betaald
          </span>
          <span className="text-[20px] font-bold tabular-nums" style={{ color: C.silk, ...mono }}>
            {totaalBetaald}
          </span>
        </div>
      </Panel>
    </div>
  );
}
