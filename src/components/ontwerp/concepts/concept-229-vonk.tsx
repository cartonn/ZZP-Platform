"use client";

// Concept 229 — "Vonk" · energiek-elektrisch, motion-forward. Antraciet basis (#14161a) met één fel
// elektrisch accent (volt-lime) en een koele cyaan als tweede stem. Signatuur: gloed op focus/hover,
// dynamische energie-/progress-motieven (voltmeter-boog, energiebalk, bliksem-sparkline) en snelle
// micro-interacties via pure CSS-transitions/transform — geen JS-timers, geen random, geen Date.
// Krachtig en snel, maar leesbaar: hoog tekstcontrast, status = label + icoon (nooit alleen kleur).
// Fonts: Space Grotesk (display) + Spline Mono (cijfers/meta). UI Nederlands, code Engels.

import { useState } from "react";
import {
  ArrowRight,
  ArrowLeft,
  Check,
  Clock,
  XCircle,
  Search,
  ShieldCheck,
  Plus,
  MapPin,
  Coins,
  CalendarDays,
  FileText,
  TriangleAlert,
  ChevronRight,
  RefreshCw,
  BadgeCheck,
  Zap,
  Activity,
  Gauge,
  Bolt,
  Radio,
  Send,
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

// ── Palet — antraciet met volt-lime hoofdaccent + cyaan tweede stem. ──
const C = {
  bg: "#14161a", // diep antraciet
  bg2: "#181b21", // iets lichter
  panel: "#1c2027", // paneel
  panelHi: "#232833", // hover
  panelSunk: "#101216", // ingekaderd/gesunken
  line: "#2a303b", // rand
  lineHi: "#3a414f", // sterkere rand
  ink: "#eef2f7", // primaire tekst
  inkSoft: "#a6b1c0", // secundair
  inkFaint: "#6a7483", // labels
  volt: "#c9f742", // fel volt-lime (accent)
  voltDeep: "#a6d81f", // leesbaar op paneel
  voltInk: "#131a04", // tekst op volt
  voltGlow: "#c9f74266", // gloed
  cyan: "#2fe6d8", // koele cyaan
  cyanDeep: "#17b8ad",
  cyanInk: "#04201d",
  cyanGlow: "#2fe6d855",
  amber: "#ffb43b", // aandacht
  amberDeep: "#e0930f",
  amberBg: "#2a2110",
  bad: "#ff5f76", // afgewezen/fout
  badDeep: "#e23a54",
  badBg: "#2a1218",
  goodBg: "#1c2711", // volt-tint vlak
  cyanBg: "#0d2422", // cyaan-tint vlak
};

const headF = { fontFamily: "var(--font-lab-space)" };
const monoF = { fontFamily: "var(--font-lab-spline-mono)" };
const bodyF = { fontFamily: "var(--font-lab-manrope)" };

// ── Status-model — label + icoon + kleur (nooit kleur alleen). ──
type StatusStyle = { label: string; Icon: LucideIcon; fg: string; bg: string; ring: string };
function credMeta(s: CredStatus): StatusStyle {
  switch (s) {
    case "VERIFIED":
      return {
        label: "Geverifieerd",
        Icon: BadgeCheck,
        fg: C.volt,
        bg: C.goodBg,
        ring: C.voltDeep,
      };
    case "SUBMITTED":
      return { label: "In behandeling", Icon: Clock, fg: C.cyan, bg: C.cyanBg, ring: C.cyanDeep };
    case "EXPIRING":
      return {
        label: "Verloopt binnenkort",
        Icon: TriangleAlert,
        fg: C.amber,
        bg: C.amberBg,
        ring: C.amberDeep,
      };
    case "REJECTED":
      return { label: "Afgewezen", Icon: XCircle, fg: C.bad, bg: C.badBg, ring: C.badDeep };
  }
}

function StatusChip({ status }: { status: CredStatus }) {
  const m = credMeta(status);
  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-md px-2.5 py-1 text-[11.5px] font-bold uppercase tracking-[0.04em]"
      style={{ ...monoF, background: m.bg, color: m.fg, border: `1px solid ${m.ring}66` }}
    >
      <m.Icon size={12} strokeWidth={2.6} aria-hidden="true" />
      {m.label}
    </span>
  );
}

// Paneel met scherpe hoek-accent en optionele gloed bij hover.
function Panel({
  children,
  className = "",
  style,
  glow = false,
}: {
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
  glow?: boolean;
}) {
  return (
    <div
      className={`rounded-lg ${className}`}
      style={{
        background: C.panel,
        border: `1px solid ${C.line}`,
        boxShadow: glow ? `0 0 0 1px ${C.line}, 0 18px 40px -28px #000` : "0 18px 40px -30px #000",
        ...style,
      }}
    >
      {children}
    </div>
  );
}

// Sectie-kop met vierkant icoonvlak in de accentkleur.
function SectionHead({
  title,
  sub,
  Icon,
  tint = C.volt,
  tintBg = C.goodBg,
}: {
  title: string;
  sub?: string;
  Icon: LucideIcon;
  tint?: string;
  tintBg?: string;
}) {
  return (
    <div className="flex items-center gap-3">
      <span
        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md"
        style={{ background: tintBg, border: `1px solid ${tint}44` }}
        aria-hidden="true"
      >
        <Icon size={17} strokeWidth={2.4} style={{ color: tint }} />
      </span>
      <div className="min-w-0">
        <h2
          className="text-[17px] font-bold leading-tight tracking-[-0.01em]"
          style={{ ...headF, color: C.ink }}
        >
          {title}
        </h2>
        {sub && (
          <p className="mt-0.5 text-[12.5px]" style={{ ...bodyF, color: C.inkFaint }}>
            {sub}
          </p>
        )}
      </div>
    </div>
  );
}

function Meta({ Icon, value, tint }: { Icon: LucideIcon; value: string; tint: string }) {
  return (
    <div className="flex items-center gap-2" style={{ color: C.inkSoft }}>
      <Icon size={14} strokeWidth={2.2} style={{ color: tint }} aria-hidden="true" />
      <span className="truncate text-[12.5px]" style={monoF}>
        {value}
      </span>
    </div>
  );
}

// Bliksem-sparkline — hoekige polyline met gloed, deterministisch uit de mock-reeks.
function Spark({ data, color, id }: { data: number[]; color: string; id: string }) {
  const max = Math.max(...data);
  const min = Math.min(...data);
  const span = max - min || 1;
  const coords = data.map((v, i) => {
    const x = (i / (data.length - 1)) * 100;
    const y = 26 - ((v - min) / span) * 22 - 2;
    return [x, y] as const;
  });
  const line = coords.map(([x, y]) => `${x.toFixed(1)},${y.toFixed(1)}`).join(" ");
  const last = coords[coords.length - 1] ?? [100, 12];
  return (
    <svg
      viewBox="0 0 100 28"
      preserveAspectRatio="none"
      className="h-7 w-full"
      aria-hidden="true"
      role="presentation"
    >
      <defs>
        <linearGradient id={`vonk-fill-${id}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={color} stopOpacity="0.28" />
          <stop offset="1" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <polygon points={`0,28 ${line} 100,28`} fill={`url(#vonk-fill-${id})`} />
      <polyline
        points={line}
        fill="none"
        stroke={color}
        strokeWidth="2.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx={last[0]} cy={last[1]} r="2.6" fill={color} />
    </svg>
  );
}

// Voltmeter — halfronde energieboog die het match-percentage als "lading" toont.
function VoltGauge({ value, size = 132 }: { value: number; size?: number }) {
  const r = 52;
  const circ = Math.PI * r; // halve cirkel
  const dash = (value / 100) * circ;
  return (
    <div className="relative shrink-0" style={{ width: size, height: size * 0.62 }}>
      <svg viewBox="0 0 120 74" className="h-full w-full" aria-hidden="true">
        <defs>
          <linearGradient id="vonk-gauge" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0" stopColor={C.cyan} />
            <stop offset="1" stopColor={C.volt} />
          </linearGradient>
        </defs>
        <path
          d="M8 66 A52 52 0 0 1 112 66"
          fill="none"
          stroke={C.panelSunk}
          strokeWidth="11"
          strokeLinecap="round"
        />
        <path
          d="M8 66 A52 52 0 0 1 112 66"
          fill="none"
          stroke="url(#vonk-gauge)"
          strokeWidth="11"
          strokeLinecap="round"
          strokeDasharray={`${dash.toFixed(1)} ${circ.toFixed(1)}`}
          style={{ filter: `drop-shadow(0 0 6px ${C.voltGlow})` }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-end pb-1">
        <span
          className="text-[26px] font-bold tabular-nums leading-none"
          style={{ ...headF, color: C.ink }}
        >
          {value}
          <span className="text-[13px]" style={{ color: C.voltDeep }}>
            %
          </span>
        </span>
        <span
          className="mt-1 text-[9px] font-bold uppercase tracking-[0.16em]"
          style={{ ...monoF, color: C.inkFaint }}
        >
          match
        </span>
      </div>
    </div>
  );
}

// Horizontale energiebalk met segment-glow.
function EnergyBar({ value, color = C.volt }: { value: number; color?: string }) {
  return (
    <div
      className="h-2 w-full overflow-hidden rounded-full"
      style={{ background: C.panelSunk }}
      role="progressbar"
      aria-valuenow={value}
      aria-valuemin={0}
      aria-valuemax={100}
    >
      <div
        className="h-full rounded-full transition-[width] duration-500"
        style={{
          width: `${value}%`,
          background: `linear-gradient(90deg, ${C.cyan}, ${color})`,
          boxShadow: `0 0 10px ${color}88`,
        }}
      />
    </div>
  );
}

// ── Root ─────────────────────────────────────────────────────────────────────────
export function Concept229() {
  const [screen, setScreen] = useState<ScreenKey>("dashboard");
  const active = OPDRACHTEN[0] as Opdracht;

  return (
    <div
      className="relative min-h-screen w-full overflow-x-hidden antialiased"
      style={{ ...bodyF, background: C.bg, color: C.ink }}
    >
      {/* elektrische sfeer: subtiele volt/cyaan-gloed in de hoeken, geen drukte */}
      <div
        className="pointer-events-none fixed inset-0 z-0"
        style={{
          background: `radial-gradient(720px 380px at 6% -8%, ${C.volt}14, transparent 60%), radial-gradient(680px 420px at 100% 4%, ${C.cyan}10, transparent 62%)`,
        }}
        aria-hidden="true"
      />

      <div className="relative z-10">
        {/* Kop */}
        <header
          className="sticky top-0 z-30 border-b"
          style={{ background: `${C.bg}e6`, backdropFilter: "blur(12px)", borderColor: C.line }}
        >
          <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-4 py-3.5 md:px-8">
            <div className="flex items-center gap-3">
              <span
                className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-md"
                style={{
                  background: `linear-gradient(140deg, ${C.volt}, ${C.cyan})`,
                  boxShadow: `0 0 18px -2px ${C.voltGlow}`,
                }}
                aria-hidden="true"
              >
                <Bolt size={20} strokeWidth={2.6} style={{ color: C.voltInk }} />
              </span>
              <div className="leading-tight">
                <div
                  className="text-[18px] font-bold uppercase leading-none tracking-[0.08em]"
                  style={{ ...headF, color: C.ink }}
                >
                  Vonk
                </div>
                <div
                  className="mt-1 flex items-center gap-1.5 text-[11px]"
                  style={{ ...monoF, color: C.inkFaint }}
                >
                  <Radio size={11} strokeWidth={2.4} style={{ color: C.volt }} aria-hidden="true" />
                  live · {PROFIEL.plaats}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2.5">
              <span
                className="hidden items-center gap-1.5 rounded-md px-3 py-1.5 text-[11.5px] font-bold uppercase tracking-[0.04em] sm:inline-flex"
                style={{
                  ...monoF,
                  background: C.goodBg,
                  color: C.volt,
                  border: `1px solid ${C.voltDeep}55`,
                }}
              >
                <ShieldCheck size={13} strokeWidth={2.4} aria-hidden="true" /> {PROFIEL.trust}
              </span>
              <span
                className="flex h-10 w-10 items-center justify-center rounded-md text-[12px] font-bold"
                style={{
                  ...headF,
                  background: C.panelHi,
                  color: C.volt,
                  border: `1px solid ${C.lineHi}`,
                }}
                aria-hidden="true"
              >
                {PROFIEL.initialen}
              </span>
            </div>
          </div>

          {/* Scherm-switcher — strakke, gloeiende pills */}
          <nav
            className="mx-auto flex max-w-6xl items-center gap-1 overflow-x-auto px-4 pb-2.5 md:px-8"
            aria-label="Schermen"
          >
            {SCREENS.map((s) => {
              const on = s.key === screen;
              return (
                <button
                  key={s.key}
                  onClick={() => setScreen(s.key)}
                  aria-current={on ? "page" : undefined}
                  className="group relative shrink-0 rounded-md px-3.5 py-2 text-[12.5px] font-bold uppercase tracking-[0.04em] transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
                  style={
                    on
                      ? {
                          ...headF,
                          background: C.volt,
                          color: C.voltInk,
                          boxShadow: `0 0 16px -2px ${C.voltGlow}`,
                          ["--tw-ring-color" as string]: C.volt,
                          ["--tw-ring-offset-color" as string]: C.bg,
                        }
                      : {
                          ...headF,
                          background: "transparent",
                          color: C.inkSoft,
                          border: `1px solid ${C.line}`,
                          ["--tw-ring-color" as string]: C.volt,
                          ["--tw-ring-offset-color" as string]: C.bg,
                        }
                  }
                >
                  {s.label}
                </button>
              );
            })}
          </nav>
        </header>

        <main className="mx-auto max-w-6xl px-4 py-6 md:px-8 md:py-8">
          {screen === "dashboard" && (
            <Dashboard onOpen={() => setScreen("opdracht")} onActies={() => setScreen("acties")} />
          )}
          {screen === "marktplaats" && <Marktplaats onOpen={() => setScreen("opdracht")} />}
          {screen === "opdracht" && (
            <OpdrachtDetail opdracht={active} onBack={() => setScreen("marktplaats")} />
          )}
          {screen === "verificatie" && <Verificatie />}
          {screen === "acties" && <Acties onMatches={() => setScreen("marktplaats")} />}
          {screen === "facturen" && <Facturen />}
        </main>

        <footer className="mx-auto max-w-6xl px-4 pb-12 md:px-8">
          <div
            className="flex flex-wrap items-center justify-center gap-2 border-t pt-6 text-center text-[11.5px]"
            style={{ ...monoF, borderColor: C.line, color: C.inkFaint }}
          >
            <Zap size={12} strokeWidth={2.4} style={{ color: C.volt }} aria-hidden="true" />
            Snel en helder — elke status draagt een woord én een icoon, dus niets hangt alleen aan
            kleur.
          </div>
        </footer>
      </div>
    </div>
  );
}

// ── Dashboard ──────────────────────────────────────────────────────────────────
function Dashboard({ onOpen, onActies }: { onOpen: () => void; onActies: () => void }) {
  const verified = CREDENTIALS.filter((c) => c.status === "VERIFIED").length;
  const dek = Math.round((verified / CREDENTIALS.length) * 100);
  const warn = (ACTIES.find((a) => a.urgentie === "warning") ??
    ACTIES[0]) as (typeof ACTIES)[number];
  const sparkColors = [C.volt, C.cyan, C.volt, C.amber];

  return (
    <div className="space-y-7">
      {/* Krachtig welkomstpaneel met voltmeter */}
      <Panel
        glow
        className="relative overflow-hidden"
        style={{ background: `linear-gradient(135deg, ${C.panel}, ${C.bg2})` }}
      >
        <span
          className="pointer-events-none absolute -right-16 -top-16 h-56 w-56 rounded-full"
          style={{ background: `radial-gradient(circle, ${C.volt}22, transparent 70%)` }}
          aria-hidden="true"
        />
        <div className="relative grid gap-6 p-6 sm:p-8 lg:grid-cols-[1.5fr_1fr]">
          <div>
            <span
              className="inline-flex items-center gap-2 rounded-md px-3 py-1.5 text-[11px] font-bold uppercase tracking-[0.08em]"
              style={{
                ...monoF,
                background: C.goodBg,
                color: C.volt,
                border: `1px solid ${C.voltDeep}44`,
              }}
            >
              <Zap size={12} strokeWidth={2.6} aria-hidden="true" /> {PROFIEL.rol}
            </span>
            <h1
              className="mt-5 text-[30px] font-bold leading-[1.05] tracking-[-0.02em] sm:text-[40px]"
              style={{ ...headF, color: C.ink }}
            >
              Dag {PROFIEL.naam.split(" ")[0]} —
              <br />
              <span style={{ color: C.volt }}>drie matches</span> staan onder spanning.
            </h1>
            <p
              className="mt-4 max-w-lg text-[14.5px] leading-relaxed"
              style={{ ...bodyF, color: C.inkSoft }}
            >
              Je profiel draait op volle kracht. Eén ding vraagt aandacht — je VOG verloopt
              binnenkort — de rest staat groen. Klaar om te schakelen?
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <button
                onClick={onOpen}
                className="inline-flex items-center gap-2 rounded-md px-5 py-3 text-[13.5px] font-bold uppercase tracking-[0.03em] transition-all hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
                style={{
                  ...headF,
                  background: C.volt,
                  color: C.voltInk,
                  boxShadow: `0 0 20px -2px ${C.voltGlow}`,
                  ["--tw-ring-color" as string]: C.volt,
                  ["--tw-ring-offset-color" as string]: C.panel,
                }}
              >
                Bekijk je matches <ArrowRight size={16} aria-hidden="true" />
              </button>
              <button
                onClick={onActies}
                className="inline-flex items-center gap-2 rounded-md px-5 py-3 text-[13.5px] font-bold uppercase tracking-[0.03em] transition-all hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
                style={{
                  ...headF,
                  background: "transparent",
                  color: C.ink,
                  border: `1px solid ${C.lineHi}`,
                  ["--tw-ring-color" as string]: C.amber,
                  ["--tw-ring-offset-color" as string]: C.panel,
                }}
              >
                <TriangleAlert
                  size={15}
                  strokeWidth={2.4}
                  style={{ color: C.amber }}
                  aria-hidden="true"
                />
                Regel dat ene ding
              </button>
            </div>
          </div>

          {/* Vertrouwens-voltmeter */}
          <div
            className="flex flex-col items-center justify-center gap-3 rounded-lg p-6 text-center"
            style={{ background: C.panelSunk, border: `1px solid ${C.line}` }}
          >
            <VoltGauge value={dek} size={156} />
            <StatusChip status="VERIFIED" />
            <p className="text-[12px] leading-relaxed" style={{ ...bodyF, color: C.inkSoft }}>
              {verified} van je {CREDENTIALS.length} certificaten zijn geverifieerd. Opdrachtgevers
              zien alleen gecontroleerde documenten.
            </p>
          </div>
        </div>
      </Panel>

      {/* KPI-cellen met bliksem-sparkline */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {KPIS.map((k, i) => (
          <Panel key={k.label} className="p-4">
            <div className="flex items-start justify-between gap-2">
              <span
                className="text-[10.5px] font-bold uppercase tracking-[0.06em]"
                style={{ ...monoF, color: C.inkFaint }}
              >
                {k.label}
              </span>
              <span
                className="inline-flex items-center rounded px-1.5 py-0.5 text-[10.5px] font-bold"
                style={{
                  ...monoF,
                  background: k.up ? C.goodBg : C.amberBg,
                  color: k.up ? C.volt : C.amber,
                }}
              >
                {k.trend}
              </span>
            </div>
            <div
              className="mt-2.5 text-[25px] font-bold tabular-nums leading-none"
              style={{ ...headF, color: C.ink }}
            >
              {k.value}
            </div>
            <div className="mt-3">
              <Spark
                data={k.spark}
                color={sparkColors[i % sparkColors.length] ?? C.volt}
                id={`kpi-${i}`}
              />
            </div>
          </Panel>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-7 lg:grid-cols-[1.6fr_1fr]">
        {/* Matches */}
        <section className="space-y-4">
          <SectionHead
            title="Onder spanning voor jou"
            sub="Opdrachten met de hoogste lading"
            Icon={Activity}
            tint={C.cyan}
            tintBg={C.cyanBg}
          />
          <div className="space-y-3">
            {OPDRACHTEN.map((o) => (
              <Panel key={o.id} className="overflow-hidden">
                <button
                  onClick={onOpen}
                  className="flex w-full items-center gap-4 p-4 text-left transition-colors hover:bg-[color:var(--hov)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset"
                  style={{ ["--hov" as string]: C.panelHi, ["--tw-ring-color" as string]: C.volt }}
                >
                  <div className="w-24 shrink-0">
                    <div
                      className="text-[22px] font-bold tabular-nums leading-none"
                      style={{ ...headF, color: C.volt }}
                    >
                      {o.match}
                      <span className="text-[12px]" style={{ color: C.voltDeep }}>
                        %
                      </span>
                    </div>
                    <div className="mt-2">
                      <EnergyBar value={o.match} />
                    </div>
                  </div>
                  <div className="min-w-0 flex-1">
                    <div
                      className="truncate text-[15px] font-bold tracking-[-0.01em]"
                      style={{ ...headF, color: C.ink }}
                    >
                      {o.titel}
                    </div>
                    <div
                      className="mt-0.5 truncate text-[12.5px]"
                      style={{ ...monoF, color: C.inkSoft }}
                    >
                      {o.opdrachtgever} · {o.plaats} · {o.tarief}
                    </div>
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {o.redenen.plus.slice(0, 2).map((r) => (
                        <span
                          key={r}
                          className="inline-flex items-center gap-1 rounded px-2 py-0.5 text-[11px] font-semibold"
                          style={{ ...bodyF, background: C.goodBg, color: C.volt }}
                        >
                          <Check size={11} strokeWidth={2.8} aria-hidden="true" /> {r}
                        </span>
                      ))}
                    </div>
                  </div>
                  <ChevronRight
                    size={18}
                    className="shrink-0"
                    style={{ color: C.inkFaint }}
                    aria-hidden="true"
                  />
                </button>
              </Panel>
            ))}
          </div>
        </section>

        {/* Rechterkolom */}
        <section className="space-y-4">
          <SectionHead
            title="Vraagt aandacht"
            sub="Direct te regelen"
            Icon={TriangleAlert}
            tint={C.amber}
            tintBg={C.amberBg}
          />
          <Panel className="relative overflow-hidden" style={{ borderColor: `${C.amberDeep}66` }}>
            <span
              className="absolute left-0 top-0 h-full w-1"
              style={{ background: C.amber, boxShadow: `0 0 12px ${C.amber}` }}
              aria-hidden="true"
            />
            <div className="p-5 pl-6">
              <span
                className="inline-flex items-center gap-1.5 rounded px-2.5 py-1 text-[10.5px] font-bold uppercase tracking-[0.06em]"
                style={{ ...monoF, background: C.amber, color: "#1c1405" }}
              >
                <TriangleAlert size={11} strokeWidth={2.6} aria-hidden="true" /> Aandacht
              </span>
              <h3
                className="mt-3 text-[16.5px] font-bold leading-tight"
                style={{ ...headF, color: C.ink }}
              >
                {warn.titel}
              </h3>
              <p
                className="mt-1.5 text-[12.5px] leading-relaxed"
                style={{ ...bodyF, color: C.inkSoft }}
              >
                {warn.detail}
              </p>
              <button
                onClick={onActies}
                className="mt-4 inline-flex items-center gap-2 rounded-md px-4 py-2.5 text-[12.5px] font-bold uppercase tracking-[0.03em] transition-all hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
                style={{
                  ...headF,
                  background: C.amber,
                  color: "#1c1405",
                  ["--tw-ring-color" as string]: C.amber,
                  ["--tw-ring-offset-color" as string]: C.panel,
                }}
              >
                {warn.cta} <ArrowRight size={14} aria-hidden="true" />
              </button>
            </div>
          </Panel>

          <Panel className="overflow-hidden">
            <div
              className="flex items-center gap-2 border-b px-5 py-3.5"
              style={{ borderColor: C.line }}
            >
              <Send size={15} strokeWidth={2.4} style={{ color: C.cyan }} aria-hidden="true" />
              <span
                className="text-[13px] font-bold uppercase tracking-[0.04em]"
                style={{ ...headF, color: C.ink }}
              >
                Berichten
              </span>
            </div>
            <div>
              {BERICHTEN.map((b, i) => (
                <div
                  key={b.van}
                  className="flex items-center gap-3 px-5 py-3"
                  style={{ borderTop: i === 0 ? undefined : `1px solid ${C.line}` }}
                >
                  <span
                    className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-[10.5px] font-bold"
                    style={{ ...headF, background: C.cyanBg, color: C.cyan }}
                    aria-hidden="true"
                  >
                    {b.initialen}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span
                        className="truncate text-[12.5px] font-bold"
                        style={{ ...headF, color: C.ink }}
                      >
                        {b.van}
                      </span>
                      {b.ongelezen && (
                        <span
                          className="h-1.5 w-1.5 shrink-0 rounded-full"
                          style={{ background: C.volt, boxShadow: `0 0 6px ${C.volt}` }}
                          aria-label="Ongelezen bericht"
                        />
                      )}
                    </div>
                    <p
                      className="mt-0.5 truncate text-[11.5px]"
                      style={{ ...bodyF, color: C.inkSoft }}
                    >
                      {b.preview}
                    </p>
                  </div>
                  <span
                    className="shrink-0 text-[10.5px] tabular-nums"
                    style={{ ...monoF, color: C.inkFaint }}
                  >
                    {b.tijd}
                  </span>
                </div>
              ))}
            </div>
          </Panel>
        </section>
      </div>
    </div>
  );
}

// ── Marktplaats — met zoek, skeleton, empty- én foutstate ─────────────
function Marktplaats({ onOpen }: { onOpen: () => void }) {
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(true);
  const metaTints = [C.volt, C.cyan, C.volt, C.amber] as const;

  const filtered = OPDRACHTEN.filter(
    (o) =>
      o.titel.toLowerCase().includes(q.toLowerCase()) ||
      o.plaats.toLowerCase().includes(q.toLowerCase()) ||
      o.opdrachtgever.toLowerCase().includes(q.toLowerCase()),
  );

  const refresh = () => {
    setLoading(true);
    setTimeout(() => setLoading(false), 650);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <SectionHead
          title="Marktplaats"
          sub="Alle open opdrachten, gesorteerd op lading"
          Icon={Search}
        />
        <div className="flex items-center gap-2">
          <div
            className="flex items-center gap-2 rounded-md px-3 py-2.5"
            style={{ background: C.panelSunk, border: `1px solid ${C.line}` }}
          >
            <Search size={15} style={{ color: C.volt }} aria-hidden="true" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Zoek opdracht of plaats…"
              aria-label="Opdrachten zoeken"
              className="w-44 bg-transparent text-[12.5px] outline-none placeholder:opacity-60"
              style={{ ...monoF, color: C.ink }}
            />
          </div>
          <button
            onClick={refresh}
            aria-label="Opdrachten verversen"
            className="flex h-10 w-10 items-center justify-center rounded-md transition-colors hover:bg-[color:var(--hov)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
            style={{
              background: C.panel,
              border: `1px solid ${C.line}`,
              ["--hov" as string]: C.panelHi,
              ["--tw-ring-color" as string]: C.volt,
              ["--tw-ring-offset-color" as string]: C.bg,
            }}
          >
            <RefreshCw
              size={15}
              className={loading ? "animate-spin" : ""}
              style={{ color: C.volt }}
              aria-hidden="true"
            />
          </button>
        </div>
      </div>

      {/* Foutstrook */}
      {error && (
        <div
          className="flex items-start gap-3 rounded-lg p-4"
          role="alert"
          style={{ background: C.badBg, border: `1px solid ${C.badDeep}66` }}
        >
          <XCircle size={19} strokeWidth={2.4} style={{ color: C.bad }} aria-hidden="true" />
          <div className="min-w-0 flex-1">
            <div className="text-[13.5px] font-bold" style={{ ...headF, color: C.ink }}>
              Niet alles geladen
            </div>
            <p className="mt-0.5 text-[12px]" style={{ ...bodyF, color: C.inkSoft }}>
              Een paar opdrachten vielen even weg. Ververs om de verbinding opnieuw te maken.
            </p>
          </div>
          <button
            onClick={() => setError(false)}
            className="shrink-0 rounded px-2.5 py-1 text-[11.5px] font-bold focus-visible:outline-none focus-visible:ring-2"
            style={{ ...monoF, color: C.bad, ["--tw-ring-color" as string]: C.bad }}
          >
            Sluiten
          </button>
        </div>
      )}

      {loading ? (
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
          {[0, 1, 2].map((i) => (
            <Panel key={i} className="p-5">
              <div className="flex items-center justify-between">
                <span
                  className="h-4 w-16 animate-pulse rounded"
                  style={{ background: C.panelHi }}
                />
                <span
                  className="h-8 w-12 animate-pulse rounded"
                  style={{ background: C.panelHi }}
                />
              </div>
              <div className="mt-4 space-y-2">
                <span
                  className="block h-4 w-3/4 animate-pulse rounded"
                  style={{ background: C.panelHi }}
                />
                <span
                  className="block h-3 w-1/2 animate-pulse rounded"
                  style={{ background: C.line }}
                />
              </div>
              <div className="mt-4">
                <span
                  className="block h-2 w-full animate-pulse rounded-full"
                  style={{ background: C.line }}
                />
              </div>
            </Panel>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <Panel className="flex flex-col items-center justify-center gap-3 p-16 text-center">
          <span
            className="flex h-16 w-16 items-center justify-center rounded-lg"
            style={{ background: C.panelSunk, border: `1px solid ${C.line}` }}
            aria-hidden="true"
          >
            <Bolt size={30} strokeWidth={1.8} style={{ color: C.inkFaint }} />
          </span>
          <p className="text-[19px] font-bold" style={{ ...headF, color: C.ink }}>
            Geen lading gevonden
          </p>
          <p
            className="max-w-sm text-[13px] leading-relaxed"
            style={{ ...bodyF, color: C.inkSoft }}
          >
            Geen opdracht voor &ldquo;{q}&rdquo;. Probeer een andere zoekterm — of wis het veld, dan
            komen alle opdrachten weer op.
          </p>
          <button
            onClick={() => setQ("")}
            className="mt-1 rounded-md px-5 py-2.5 text-[12.5px] font-bold uppercase tracking-[0.03em] transition-all hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
            style={{
              ...headF,
              background: C.volt,
              color: C.voltInk,
              ["--tw-ring-color" as string]: C.volt,
              ["--tw-ring-offset-color" as string]: C.panel,
            }}
          >
            Toon alles
          </button>
        </Panel>
      ) : (
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
          {filtered.map((o) => (
            <Panel
              key={o.id}
              className="group flex flex-col overflow-hidden transition-transform hover:-translate-y-0.5"
            >
              <div
                className="flex items-center justify-between gap-3 border-b px-5 py-4"
                style={{ borderColor: C.line }}
              >
                <span
                  className="text-[11px] font-bold tabular-nums"
                  style={{ ...monoF, color: C.inkFaint }}
                >
                  {o.id}
                </span>
                <div className="flex items-center gap-2">
                  <span
                    className="text-[18px] font-bold tabular-nums"
                    style={{ ...headF, color: C.volt }}
                  >
                    {o.match}
                    <span className="text-[11px]" style={{ color: C.voltDeep }}>
                      %
                    </span>
                  </span>
                  <Zap size={14} strokeWidth={2.6} style={{ color: C.volt }} aria-hidden="true" />
                </div>
              </div>
              <div className="px-5 pb-3 pt-4">
                <h3
                  className="text-[16px] font-bold leading-tight tracking-[-0.01em]"
                  style={{ ...headF, color: C.ink }}
                >
                  {o.titel}
                </h3>
                <p className="mt-0.5 text-[12.5px]" style={{ ...monoF, color: C.inkSoft }}>
                  {o.opdrachtgever}
                </p>
                <div className="mt-3">
                  <EnergyBar value={o.match} />
                </div>
                <dl className="mt-4 grid grid-cols-2 gap-y-2.5">
                  <Meta Icon={MapPin} value={o.plaats} tint={metaTints[0]} />
                  <Meta Icon={Coins} value={o.tarief} tint={metaTints[1]} />
                  <Meta Icon={Clock} value={o.uren} tint={metaTints[2]} />
                  <Meta Icon={CalendarDays} value={o.start} tint={metaTints[3]} />
                </dl>
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {o.tags.map((t) => (
                    <span
                      key={t}
                      className="rounded px-2 py-0.5 text-[11px] font-semibold"
                      style={{
                        ...monoF,
                        background: C.panelSunk,
                        color: C.inkSoft,
                        border: `1px solid ${C.line}`,
                      }}
                    >
                      {t}
                    </span>
                  ))}
                </div>
              </div>
              <button
                onClick={onOpen}
                className="mt-auto flex items-center justify-center gap-2 border-t px-5 py-3.5 text-[12.5px] font-bold uppercase tracking-[0.03em] transition-colors hover:bg-[color:var(--hov)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset"
                style={{
                  ...headF,
                  borderColor: C.line,
                  color: C.volt,
                  ["--hov" as string]: C.panelHi,
                  ["--tw-ring-color" as string]: C.volt,
                }}
              >
                Bekijk opdracht <ArrowRight size={14} aria-hidden="true" />
              </button>
            </Panel>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Opdracht-detail ──────────────────────────────────────────────────────────────
function OpdrachtDetail({ opdracht, onBack }: { opdracht: Opdracht; onBack: () => void }) {
  const [saved, setSaved] = useState(false);
  const [applied, setApplied] = useState(false);
  const feiten: { l: string; v: string; Icon: LucideIcon; tint: string }[] = [
    { l: "Tarief", v: opdracht.tarief, Icon: Coins, tint: C.volt },
    { l: "Omvang", v: opdracht.uren, Icon: Clock, tint: C.cyan },
    { l: "Start", v: opdracht.start, Icon: CalendarDays, tint: C.volt },
    { l: "Plaats", v: opdracht.plaats, Icon: MapPin, tint: C.amber },
  ];
  return (
    <div className="space-y-6">
      <button
        onClick={onBack}
        className="inline-flex items-center gap-2 rounded-md px-3.5 py-2 text-[12.5px] font-bold uppercase tracking-[0.03em] transition-colors hover:bg-[color:var(--hov)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
        style={{
          ...headF,
          background: C.panel,
          color: C.ink,
          border: `1px solid ${C.line}`,
          ["--hov" as string]: C.panelHi,
          ["--tw-ring-color" as string]: C.volt,
          ["--tw-ring-offset-color" as string]: C.bg,
        }}
      >
        <ArrowLeft size={15} aria-hidden="true" /> Terug naar marktplaats
      </button>

      <Panel
        glow
        className="relative overflow-hidden"
        style={{ background: `linear-gradient(135deg, ${C.panel}, ${C.bg2})` }}
      >
        <span
          className="pointer-events-none absolute -right-10 -top-14 h-52 w-52 rounded-full"
          style={{ background: `radial-gradient(circle, ${C.cyan}22, transparent 70%)` }}
          aria-hidden="true"
        />
        <div className="relative flex flex-wrap items-center justify-between gap-6 p-6 sm:p-8">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <span
                className="rounded px-2.5 py-1 text-[11px] font-bold tabular-nums"
                style={{
                  ...monoF,
                  background: C.panelSunk,
                  color: C.cyan,
                  border: `1px solid ${C.line}`,
                }}
              >
                {opdracht.id}
              </span>
              <span className="text-[12px]" style={{ ...monoF, color: C.inkFaint }}>
                Start {opdracht.start}
              </span>
            </div>
            <h1
              className="mt-3 max-w-2xl text-[25px] font-bold leading-[1.08] tracking-[-0.02em] sm:text-[32px]"
              style={{ ...headF, color: C.ink }}
            >
              {opdracht.titel}
            </h1>
            <p className="mt-2 text-[13.5px]" style={{ ...bodyF, color: C.inkSoft }}>
              {opdracht.opdrachtgever} · {opdracht.plaats}
            </p>
          </div>
          <VoltGauge value={opdracht.match} size={170} />
        </div>
      </Panel>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {feiten.map((f) => (
          <Panel key={f.l} className="p-4">
            <span
              className="flex h-8 w-8 items-center justify-center rounded-md"
              style={{ background: C.panelSunk, border: `1px solid ${f.tint}33` }}
              aria-hidden="true"
            >
              <f.Icon size={15} strokeWidth={2.2} style={{ color: f.tint }} />
            </span>
            <div
              className="mt-3 text-[16px] font-bold tabular-nums leading-none"
              style={{ ...headF, color: C.ink }}
            >
              {f.v}
            </div>
            <div
              className="mt-1 text-[10.5px] font-bold uppercase tracking-[0.06em]"
              style={{ ...monoF, color: C.inkFaint }}
            >
              {f.l}
            </div>
          </Panel>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
        <section className="space-y-3">
          <SectionHead title="Waarom dit past" Icon={Check} tint={C.volt} tintBg={C.goodBg} />
          <Panel className="p-5">
            <ul className="space-y-3">
              {opdracht.redenen.plus.map((r) => (
                <li
                  key={r}
                  className="flex items-start gap-3 text-[13.5px] leading-snug"
                  style={{ ...bodyF, color: C.ink }}
                >
                  <span
                    className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded"
                    style={{ background: C.goodBg, border: `1px solid ${C.voltDeep}44` }}
                    aria-hidden="true"
                  >
                    <Check size={12} strokeWidth={2.8} style={{ color: C.volt }} />
                  </span>
                  {r}
                </li>
              ))}
            </ul>
          </Panel>
        </section>
        <section className="space-y-3">
          <SectionHead
            title="Om te overwegen"
            Icon={TriangleAlert}
            tint={C.amber}
            tintBg={C.amberBg}
          />
          <Panel className="p-5">
            <ul className="space-y-3">
              {opdracht.redenen.min.map((r) => (
                <li
                  key={r}
                  className="flex items-start gap-3 text-[13.5px] leading-snug"
                  style={{ ...bodyF, color: C.ink }}
                >
                  <span
                    className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded"
                    style={{ background: C.amberBg, border: `1px solid ${C.amberDeep}44` }}
                    aria-hidden="true"
                  >
                    <TriangleAlert size={11} strokeWidth={2.6} style={{ color: C.amber }} />
                  </span>
                  {r}
                </li>
              ))}
            </ul>
          </Panel>
        </section>
      </div>

      <Panel className="p-5">
        <div className="flex items-center gap-2">
          <ShieldCheck size={16} strokeWidth={2.4} style={{ color: C.cyan }} aria-hidden="true" />
          <span
            className="text-[14px] font-bold uppercase tracking-[0.03em]"
            style={{ ...headF, color: C.ink }}
          >
            Wat de opdrachtgever vraagt
          </span>
        </div>
        <div className="mt-3 flex flex-wrap gap-2">
          {opdracht.tags.map((t) => (
            <span
              key={t}
              className="inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-[12px] font-semibold"
              style={{
                ...monoF,
                background: C.cyanBg,
                color: C.cyan,
                border: `1px solid ${C.cyanDeep}44`,
              }}
            >
              <BadgeCheck size={13} strokeWidth={2.4} aria-hidden="true" /> {t}
            </span>
          ))}
        </div>
      </Panel>

      <div className="flex flex-col gap-3 sm:flex-row">
        <button
          onClick={() => setApplied(true)}
          disabled={applied}
          className="flex flex-1 items-center justify-center gap-2 rounded-md px-6 py-4 text-[13.5px] font-bold uppercase tracking-[0.03em] transition-all hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:translate-y-0"
          style={{
            ...headF,
            background: applied ? C.goodBg : C.volt,
            color: applied ? C.volt : C.voltInk,
            border: applied ? `1px solid ${C.voltDeep}66` : "none",
            boxShadow: applied ? "none" : `0 0 22px -2px ${C.voltGlow}`,
            ["--tw-ring-color" as string]: C.volt,
            ["--tw-ring-offset-color" as string]: C.bg,
          }}
        >
          {applied ? (
            <>
              <Check size={16} strokeWidth={2.8} aria-hidden="true" /> Je reactie is verstuurd
            </>
          ) : (
            <>
              Reageer op deze opdracht <ArrowRight size={16} aria-hidden="true" />
            </>
          )}
        </button>
        <button
          onClick={() => setSaved((s) => !s)}
          aria-pressed={saved}
          className="flex items-center justify-center gap-2 rounded-md px-6 py-4 text-[13.5px] font-bold uppercase tracking-[0.03em] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
          style={{
            ...headF,
            background: saved ? C.cyanBg : C.panel,
            color: saved ? C.cyan : C.ink,
            border: `1px solid ${saved ? C.cyanDeep : C.line}`,
            ["--tw-ring-color" as string]: C.cyan,
            ["--tw-ring-offset-color" as string]: C.bg,
          }}
        >
          <Bolt size={16} strokeWidth={2.4} style={{ color: C.cyan }} aria-hidden="true" />
          {saved ? "Bewaard" : "Bewaar"}
        </button>
      </div>
    </div>
  );
}

// ── Verificatie ──────────────────────────────────────────────────────────────────
function Verificatie() {
  const verified = CREDENTIALS.filter((c) => c.status === "VERIFIED").length;
  const dek = Math.round((verified / CREDENTIALS.length) * 100);
  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <SectionHead
          title="Jouw certificaten"
          sub="Documenten die je vermogen aantonen"
          Icon={ShieldCheck}
          tint={C.volt}
          tintBg={C.goodBg}
        />
        <button
          className="inline-flex items-center gap-2 rounded-md px-4 py-2.5 text-[12.5px] font-bold uppercase tracking-[0.03em] transition-all hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
          style={{
            ...headF,
            background: C.volt,
            color: C.voltInk,
            boxShadow: `0 0 18px -4px ${C.voltGlow}`,
            ["--tw-ring-color" as string]: C.volt,
            ["--tw-ring-offset-color" as string]: C.bg,
          }}
        >
          <Plus size={15} aria-hidden="true" /> Document toevoegen
        </button>
      </div>

      <Panel
        glow
        className="relative overflow-hidden"
        style={{ background: `linear-gradient(135deg, ${C.panel}, ${C.bg2})` }}
      >
        <div className="relative flex flex-wrap items-center gap-6 p-6 sm:p-8">
          <div className="flex flex-1 items-center gap-6" style={{ minWidth: 260 }}>
            <span
              className="flex h-16 w-16 shrink-0 items-center justify-center rounded-lg"
              style={{
                background: C.goodBg,
                border: `1px solid ${C.voltDeep}44`,
                boxShadow: `0 0 20px -6px ${C.voltGlow}`,
              }}
              aria-hidden="true"
            >
              <Gauge size={28} strokeWidth={2.2} style={{ color: C.volt }} />
            </span>
            <div>
              <div
                className="text-[22px] font-bold tabular-nums"
                style={{ ...headF, color: C.ink }}
              >
                {verified} / {CREDENTIALS.length} geverifieerd
              </div>
              <p
                className="mt-1.5 max-w-sm text-[13px] leading-relaxed"
                style={{ ...bodyF, color: C.inkSoft }}
              >
                Elk gecontroleerd certificaat verhoogt je vermogen. Nog een paar volt en je profiel
                staat volledig onder spanning.
              </p>
            </div>
          </div>
          <div className="w-full max-w-xs">
            <div className="mb-2 flex items-center justify-between">
              <span
                className="text-[11px] font-bold uppercase tracking-[0.06em]"
                style={{ ...monoF, color: C.inkFaint }}
              >
                Dekking
              </span>
              <span
                className="text-[14px] font-bold tabular-nums"
                style={{ ...headF, color: C.volt }}
              >
                {dek}%
              </span>
            </div>
            <EnergyBar value={dek} />
            <span
              className="mt-3 inline-flex items-center gap-1.5 text-[12px] font-semibold"
              style={{ ...bodyF, color: C.volt }}
            >
              <BadgeCheck size={13} strokeWidth={2.4} aria-hidden="true" /> {PROFIEL.trust}
            </span>
          </div>
        </div>
      </Panel>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {CREDENTIALS.map((c) => {
          const m = credMeta(c.status);
          const actionable = c.status !== "VERIFIED";
          return (
            <Panel key={c.naam} className="flex items-center gap-4 p-5">
              <span
                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-md"
                style={{ background: m.bg, border: `1px solid ${m.ring}55` }}
                aria-hidden="true"
              >
                <m.Icon size={20} strokeWidth={2.4} style={{ color: m.fg }} />
              </span>
              <div className="min-w-0 flex-1">
                <div
                  className="truncate text-[14.5px] font-bold"
                  style={{ ...headF, color: C.ink }}
                >
                  {c.naam}
                </div>
                <div className="mt-0.5 text-[12px]" style={{ ...monoF, color: C.inkSoft }}>
                  {c.detail}
                </div>
                <div className="mt-2 flex flex-wrap items-center gap-2">
                  <StatusChip status={c.status} />
                  {actionable && (
                    <button
                      className="rounded px-2.5 py-1 text-[11.5px] font-bold transition-colors hover:bg-[color:var(--hov)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-1"
                      style={{
                        ...monoF,
                        background: C.panelSunk,
                        color: C.volt,
                        border: `1px solid ${C.line}`,
                        ["--hov" as string]: C.panelHi,
                        ["--tw-ring-color" as string]: C.volt,
                        ["--tw-ring-offset-color" as string]: C.panel,
                      }}
                    >
                      {c.status === "EXPIRING"
                        ? "Vernieuwen"
                        : c.status === "REJECTED"
                          ? "Opnieuw indienen"
                          : "Bekijken"}
                    </button>
                  )}
                </div>
              </div>
            </Panel>
          );
        })}
      </div>

      {/* Documenten */}
      <section className="space-y-3">
        <SectionHead
          title="Je documenten"
          sub="Versleuteld en privé bewaard"
          Icon={FileText}
          tint={C.cyan}
          tintBg={C.cyanBg}
        />
        <Panel className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[520px] text-left">
              <thead>
                <tr style={{ background: C.panelSunk }}>
                  {["Document", "Type", "Grootte", "Status", "Bijgewerkt"].map((h) => (
                    <th
                      key={h}
                      scope="col"
                      className="px-5 py-3 text-[10.5px] font-bold uppercase tracking-[0.06em]"
                      style={{ ...monoF, color: C.inkFaint }}
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {DOCUMENTEN.map((d, i) => (
                  <tr
                    key={d.naam}
                    style={{ borderTop: i === 0 ? undefined : `1px solid ${C.line}` }}
                  >
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-2.5">
                        <span
                          className="flex h-8 w-8 items-center justify-center rounded-md"
                          style={{ background: C.panelSunk, border: `1px solid ${C.line}` }}
                          aria-hidden="true"
                        >
                          <FileText size={14} strokeWidth={2.2} style={{ color: C.cyan }} />
                        </span>
                        <span className="text-[13px] font-bold" style={{ ...headF, color: C.ink }}>
                          {d.naam}
                        </span>
                      </div>
                    </td>
                    <td className="px-5 py-3.5 text-[12px]" style={{ ...monoF, color: C.inkSoft }}>
                      {d.type}
                    </td>
                    <td
                      className="px-5 py-3.5 text-[12px] tabular-nums"
                      style={{ ...monoF, color: C.inkSoft }}
                    >
                      {d.grootte}
                    </td>
                    <td className="px-5 py-3.5">
                      <StatusChip status={d.status} />
                    </td>
                    <td
                      className="px-5 py-3.5 text-[12px] tabular-nums"
                      style={{ ...monoF, color: C.inkFaint }}
                    >
                      {d.bijgewerkt}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Panel>
      </section>
    </div>
  );
}

// ── Acties (next-action) ─────────────────────────────────────────────────────────
function Acties({ onMatches }: { onMatches: () => void }) {
  const [done, setDone] = useState<Record<string, boolean>>({});
  const sorted = [...ACTIES].sort((a, b) =>
    a.urgentie === b.urgentie ? 0 : a.urgentie === "warning" ? -1 : 1,
  );
  const openCount = sorted.filter((a) => !done[a.titel]).length;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <SectionHead
          title="Vandaag onder spanning"
          sub="Van hoge urgentie naar lage"
          Icon={Zap}
          tint={C.volt}
          tintBg={C.goodBg}
        />
        <span
          className="inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-[11.5px] font-bold uppercase tracking-[0.04em]"
          style={{
            ...monoF,
            background: openCount === 0 ? C.goodBg : C.amberBg,
            color: openCount === 0 ? C.volt : C.amber,
            border: `1px solid ${openCount === 0 ? C.voltDeep : C.amberDeep}55`,
          }}
        >
          {openCount === 0 ? (
            <>
              <Check size={12} strokeWidth={2.8} aria-hidden="true" /> Alles gedaan
            </>
          ) : (
            <>
              {openCount} open {openCount === 1 ? "punt" : "punten"}
            </>
          )}
        </span>
      </div>

      <ol className="space-y-4">
        {sorted.map((a, i) => {
          const warn = a.urgentie === "warning";
          const isDone = !!done[a.titel];
          const tint = warn ? C.amber : C.cyan;
          const tintBg = warn ? C.amberBg : C.cyanBg;
          const bar = isDone ? C.volt : tint;
          return (
            <li key={a.titel}>
              <Panel className="overflow-hidden" style={isDone ? { opacity: 0.66 } : undefined}>
                <div className="flex items-stretch">
                  <span
                    className="w-1 shrink-0"
                    style={{ background: bar, boxShadow: `0 0 10px ${bar}` }}
                    aria-hidden="true"
                  />
                  <div className="flex min-w-0 flex-1 items-start gap-4 p-5">
                    <span
                      className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md text-[15px] font-bold tabular-nums"
                      style={{
                        ...headF,
                        background: isDone ? C.goodBg : tintBg,
                        color: isDone ? C.volt : tint,
                        border: `1px solid ${isDone ? C.voltDeep : tint}44`,
                      }}
                      aria-hidden="true"
                    >
                      {isDone ? (
                        <Check size={19} strokeWidth={2.8} />
                      ) : warn ? (
                        <TriangleAlert size={18} strokeWidth={2.4} />
                      ) : (
                        i + 1
                      )}
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span
                          className="inline-flex items-center gap-1 rounded px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.05em]"
                          style={{
                            ...monoF,
                            background: tintBg,
                            color: tint,
                            border: `1px solid ${tint}44`,
                          }}
                        >
                          {warn ? (
                            <TriangleAlert size={10} strokeWidth={2.6} aria-hidden="true" />
                          ) : (
                            <Zap size={10} strokeWidth={2.6} aria-hidden="true" />
                          )}
                          {warn ? "Aandacht" : "Kans"}
                        </span>
                        <h3
                          className={`text-[15px] font-bold ${isDone ? "line-through" : ""}`}
                          style={{ ...headF, color: C.ink }}
                        >
                          {a.titel}
                        </h3>
                      </div>
                      <p
                        className="mt-1.5 text-[13px] leading-relaxed"
                        style={{ ...bodyF, color: C.inkSoft }}
                      >
                        {a.detail}
                      </p>
                      <div className="mt-3 flex flex-wrap items-center gap-2">
                        <button
                          onClick={a.cta === "Bekijk matches" ? onMatches : undefined}
                          className="inline-flex items-center gap-2 rounded-md px-4 py-2 text-[12px] font-bold uppercase tracking-[0.03em] transition-all hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
                          style={
                            warn
                              ? {
                                  ...headF,
                                  background: C.amber,
                                  color: "#1c1405",
                                  ["--tw-ring-color" as string]: C.amber,
                                  ["--tw-ring-offset-color" as string]: C.panel,
                                }
                              : {
                                  ...headF,
                                  background: C.panelSunk,
                                  color: C.cyan,
                                  border: `1px solid ${C.cyanDeep}44`,
                                  ["--tw-ring-color" as string]: C.cyan,
                                  ["--tw-ring-offset-color" as string]: C.panel,
                                }
                          }
                        >
                          {a.cta} <ArrowRight size={13} aria-hidden="true" />
                        </button>
                        <button
                          onClick={() => setDone((d) => ({ ...d, [a.titel]: !d[a.titel] }))}
                          className="inline-flex items-center gap-1.5 rounded-md px-3 py-2 text-[12px] font-bold uppercase tracking-[0.03em] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
                          style={{
                            ...headF,
                            background: "transparent",
                            color: isDone ? C.inkFaint : C.volt,
                            ["--tw-ring-color" as string]: C.volt,
                            ["--tw-ring-offset-color" as string]: C.panel,
                          }}
                        >
                          <Check size={14} strokeWidth={2.8} aria-hidden="true" />{" "}
                          {isDone ? "Ongedaan" : "Klaar"}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </Panel>
            </li>
          );
        })}
      </ol>

      {openCount === 0 && (
        <Panel className="flex flex-col items-center gap-2 p-10 text-center">
          <span
            className="flex h-14 w-14 items-center justify-center rounded-lg"
            style={{ background: C.goodBg, border: `1px solid ${C.voltDeep}44` }}
            aria-hidden="true"
          >
            <Zap size={26} strokeWidth={2.2} style={{ color: C.volt }} />
          </span>
          <p className="text-[17px] font-bold" style={{ ...headF, color: C.ink }}>
            Alles onder spanning
          </p>
          <p className="max-w-xs text-[12.5px]" style={{ ...bodyF, color: C.inkSoft }}>
            Alles afgevinkt. We laten het weten zodra er een nieuwe match binnenkomt.
          </p>
        </Panel>
      )}
    </div>
  );
}

// ── Facturen ─────────────────────────────────────────────────────────────────────
function Facturen() {
  const factMeta = (
    status: string,
  ): { label: string; Icon: LucideIcon; fg: string; bg: string; ring: string } => {
    if (status === "Betaald")
      return { label: "Betaald", Icon: Check, fg: C.volt, bg: C.goodBg, ring: C.voltDeep };
    if (status === "Openstaand")
      return { label: "Openstaand", Icon: Clock, fg: C.amber, bg: C.amberBg, ring: C.amberDeep };
    return { label: "Concept", Icon: FileText, fg: C.inkSoft, bg: C.panelSunk, ring: C.line };
  };
  const betaald = "€ 8.622";
  const open = FACTUREN.filter((f) => f.status === "Openstaand").length;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <SectionHead
          title="Je facturen"
          sub="Overzicht van omzet en openstaand"
          Icon={Coins}
          tint={C.volt}
          tintBg={C.goodBg}
        />
        <button
          className="inline-flex items-center gap-2 rounded-md px-4 py-2.5 text-[12.5px] font-bold uppercase tracking-[0.03em] transition-all hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
          style={{
            ...headF,
            background: C.volt,
            color: C.voltInk,
            boxShadow: `0 0 18px -4px ${C.voltGlow}`,
            ["--tw-ring-color" as string]: C.volt,
            ["--tw-ring-offset-color" as string]: C.bg,
          }}
        >
          <Plus size={15} aria-hidden="true" /> Nieuwe factuur
        </button>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {[
          { l: "Betaald deze maand", v: betaald, Icon: Check, tint: C.volt, tintBg: C.goodBg },
          { l: "Openstaand", v: `${open}`, Icon: Clock, tint: C.amber, tintBg: C.amberBg },
          { l: "Nog te factureren", v: "€ 1.350", Icon: Send, tint: C.cyan, tintBg: C.cyanBg },
        ].map((s) => (
          <Panel key={s.l} className="p-5">
            <div className="flex items-center gap-2.5">
              <span
                className="flex h-8 w-8 items-center justify-center rounded-md"
                style={{ background: s.tintBg, border: `1px solid ${s.tint}33` }}
                aria-hidden="true"
              >
                <s.Icon size={15} strokeWidth={2.4} style={{ color: s.tint }} />
              </span>
              <div
                className="text-[11px] font-bold uppercase tracking-[0.05em]"
                style={{ ...monoF, color: C.inkFaint }}
              >
                {s.l}
              </div>
            </div>
            <div
              className="mt-3 text-[25px] font-bold tabular-nums leading-none"
              style={{ ...headF, color: C.ink }}
            >
              {s.v}
            </div>
          </Panel>
        ))}
      </div>

      <Panel className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[560px] text-left">
            <thead>
              <tr style={{ background: C.panelSunk }}>
                {["Nummer", "Klant", "Datum", "Status", "Bedrag"].map((h, i) => (
                  <th
                    key={h}
                    scope="col"
                    className={`px-5 py-3 text-[10.5px] font-bold uppercase tracking-[0.06em] ${i === 4 ? "text-right" : ""}`}
                    style={{ ...monoF, color: C.inkFaint }}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {FACTUREN.map((f, i) => {
                const m = factMeta(f.status);
                return (
                  <tr key={f.nr} style={{ borderTop: i === 0 ? undefined : `1px solid ${C.line}` }}>
                    <td
                      className="px-5 py-4 text-[13px] font-bold tabular-nums"
                      style={{ ...headF, color: C.ink }}
                    >
                      {f.nr}
                    </td>
                    <td className="px-5 py-4 text-[12.5px]" style={{ ...bodyF, color: C.inkSoft }}>
                      {f.klant}
                    </td>
                    <td
                      className="px-5 py-4 text-[12px] tabular-nums"
                      style={{ ...monoF, color: C.inkFaint }}
                    >
                      {f.datum}
                    </td>
                    <td className="px-5 py-4">
                      <span
                        className="inline-flex items-center gap-1.5 rounded px-2.5 py-1 text-[11px] font-bold uppercase tracking-[0.04em]"
                        style={{
                          ...monoF,
                          background: m.bg,
                          color: m.fg,
                          border: `1px solid ${m.ring}55`,
                        }}
                      >
                        <m.Icon size={11} strokeWidth={2.6} aria-hidden="true" /> {m.label}
                      </span>
                    </td>
                    <td
                      className="px-5 py-4 text-right text-[14.5px] font-bold tabular-nums"
                      style={{ ...headF, color: C.ink }}
                    >
                      {f.bedrag}
                    </td>
                  </tr>
                );
              })}
            </tbody>
            <tfoot>
              <tr style={{ background: C.panelSunk, borderTop: `1px solid ${C.lineHi}` }}>
                <td
                  colSpan={4}
                  className="px-5 py-4 text-[11px] font-bold uppercase tracking-[0.08em]"
                  style={{ ...monoF, color: C.inkSoft }}
                >
                  Totaal betaald deze maand
                </td>
                <td
                  className="px-5 py-4 text-right text-[16px] font-bold tabular-nums"
                  style={{ ...headF, color: C.volt }}
                >
                  {betaald}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </Panel>
    </div>
  );
}
