"use client";

// Concept 462 — "Wisselspoor" · spoorwegemplacement.
// Navigatie en flow als rails en wissels; industriële perron-/seinbord-signage (mono, hoofdletters).
// Verbindingslijnen (sporen) koppelen items, statusovergangen tonen als wissels. Donkere staal-grond
// met sein-accenten (groen/geel/rood). Strak, functioneel, machinaal. Beweging respecteert
// prefers-reduced-motion.

import { useMemo, useState } from "react";
import {
  AlertTriangle,
  ArrowRight,
  Bell,
  Check,
  ChevronRight,
  Circle,
  Clock,
  FileText,
  GitBranch,
  Minus,
  Plus,
  Search,
  ShieldCheck,
  TrainFront,
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

// — Palet: staal-emplacement + seinkleuren —
const C = {
  bg: "#0e1418",
  bgDeep: "#090d10",
  panel: "#161f26",
  panelSoft: "#1d2830",
  raise: "#22303a",
  rail: "#3a4a55",
  railBright: "#5c7180",
  ink: "#e8eef2",
  inkSoft: "#b7c4cd",
  inkMute: "#7d8f9b",
  inkFaint: "#586873",
  line: "rgba(92,113,128,0.28)",
  lineSoft: "rgba(92,113,128,0.14)",
  // seinen
  signalGreen: "#3fb56f",
  greenInk: "#7fe0a4",
  greenWash: "rgba(63,181,111,0.16)",
  signalYellow: "#e0b13a",
  yellowInk: "#f2ce74",
  yellowWash: "rgba(224,177,58,0.16)",
  signalRed: "#e05a52",
  redInk: "#f28a82",
  redWash: "rgba(224,90,82,0.16)",
  steel: "#7d97a6",
  steelInk: "#a9c0cd",
  steelWash: "rgba(125,151,166,0.14)",
};

const mono = {
  fontFamily: "'IBM Plex Mono', 'Roboto Mono', ui-monospace, SFMono-Regular, Menlo, monospace",
  fontVariantNumeric: "tabular-nums" as const,
};
const body = { fontFamily: "'Inter', 'Segoe UI', system-ui, -apple-system, sans-serif" };

function statusMeta(s: CredStatus): {
  label: string;
  Icon: LucideIcon;
  alarm: boolean;
  tone: string;
  ink: string;
  wash: string;
  sein: string;
} {
  switch (s) {
    case "VERIFIED":
      return {
        label: "Geverifieerd",
        Icon: ShieldCheck,
        alarm: false,
        tone: C.signalGreen,
        ink: C.greenInk,
        wash: C.greenWash,
        sein: "VRIJ BAAN",
      };
    case "SUBMITTED":
      return {
        label: "In beoordeling",
        Icon: Clock,
        alarm: false,
        tone: C.steel,
        ink: C.steelInk,
        wash: C.steelWash,
        sein: "NADEREN",
      };
    case "EXPIRING":
      return {
        label: "Verloopt binnenkort",
        Icon: AlertTriangle,
        alarm: true,
        tone: C.signalYellow,
        ink: C.yellowInk,
        wash: C.yellowWash,
        sein: "OPLETTEN",
      };
    case "REJECTED":
      return {
        label: "Afgewezen",
        Icon: AlertTriangle,
        alarm: true,
        tone: C.signalRed,
        ink: C.redInk,
        wash: C.redWash,
        sein: "STOP",
      };
  }
}

// — Paneel: staalplaat met rail-hairline en klinknagel-hoeken —
function Panel({
  children,
  className = "",
  as: Tag = "div",
  accent,
}: {
  children: React.ReactNode;
  className?: string;
  as?: "div" | "section" | "li";
  accent?: string;
}) {
  return (
    <Tag
      className={`relative overflow-hidden rounded-[6px] ${className}`}
      style={{
        background: C.panel,
        border: `1px solid ${C.line}`,
        boxShadow: "0 1px 0 rgba(255,255,255,0.03) inset, 0 6px 18px rgba(0,0,0,0.35)",
        color: C.ink,
      }}
    >
      {accent && (
        <span
          className="pointer-events-none absolute inset-y-0 left-0 w-[3px]"
          style={{ background: accent }}
          aria-hidden="true"
        />
      )}
      {children}
    </Tag>
  );
}

// Seinbord-label: geel/mono op donkere plaat.
function Sein({ children, tone = C.signalGreen }: { children: React.ReactNode; tone?: string }) {
  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-[3px] px-2 py-0.5 text-[9.5px] font-bold uppercase tracking-[0.18em]"
      style={{ color: tone, background: C.bgDeep, border: `1px solid ${tone}`, ...mono }}
    >
      {children}
    </span>
  );
}

function Eyebrow({ children, tone = C.steelInk }: { children: React.ReactNode; tone?: string }) {
  return (
    <p
      className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.24em]"
      style={{ color: tone, ...mono }}
    >
      <GitBranch size={12} aria-hidden="true" />
      {children}
    </p>
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
      className={`group inline-flex items-center justify-center gap-2 rounded-[4px] px-5 py-2.5 text-[11.5px] font-bold uppercase tracking-[0.12em] transition-all duration-150 hover:brightness-[1.08] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#3fb56f] focus-visible:ring-offset-2 focus-visible:ring-offset-[#0e1418] active:translate-y-px motion-reduce:transition-none ${className}`}
      style={{
        color: "#08110c",
        background: C.signalGreen,
        border: `1px solid ${C.signalGreen}`,
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
      className={`inline-flex items-center justify-center gap-2 rounded-[4px] px-4 py-2.5 text-[11px] font-bold uppercase tracking-[0.1em] transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5c7180] focus-visible:ring-offset-2 focus-visible:ring-offset-[#0e1418] motion-reduce:transition-none ${className}`}
      style={{
        color: active ? C.bg : C.inkSoft,
        background: active ? C.steel : C.panelSoft,
        border: `1px solid ${active ? C.steel : C.line}`,
        ...mono,
      }}
    >
      {children}
    </button>
  );
}

// — Sparkline als seinlijn met bakennodes —
function RailSpark({ data, tone, id }: { data: number[]; tone: string; id: string }) {
  const max = Math.max(...data);
  const min = Math.min(...data);
  const span = max - min || 1;
  const w = 120;
  const h = 32;
  const pts = data.map((d, i) => {
    const x = (i / (data.length - 1)) * w;
    const y = h - ((d - min) / span) * (h - 9) - 4;
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
        <linearGradient id={`ws-${id}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={tone} stopOpacity="0.22" />
          <stop offset="100%" stopColor={tone} stopOpacity="0" />
        </linearGradient>
      </defs>
      <polygon points={`0,${h} ${line} ${w},${h}`} fill={`url(#ws-${id})`} />
      <polyline
        points={line}
        fill="none"
        stroke={tone}
        strokeWidth="1.6"
        strokeLinecap="square"
        strokeLinejoin="miter"
      />
      {pts.map(([x, y], i) => (
        <rect
          key={i}
          x={x - 1.2}
          y={y - 1.2}
          width="2.4"
          height="2.4"
          fill={tone}
          opacity={i === pts.length - 1 ? 1 : 0.55}
        />
      ))}
      <rect
        x={last[0] - 2}
        y={last[1] - 2}
        width="4"
        height="4"
        fill={C.bg}
        stroke={tone}
        strokeWidth="1.4"
      />
    </svg>
  );
}

function Gauge({ value, tone = C.signalGreen }: { value: number; tone?: string }) {
  return (
    <span className="hidden items-center gap-2.5 sm:flex" aria-hidden="true">
      <span
        className="relative h-1.5 w-24 overflow-hidden rounded-[2px]"
        style={{ background: C.bgDeep }}
      >
        <span
          className="block h-full rounded-[2px]"
          style={{ width: `${value}%`, background: tone, transition: "width 0.5s linear" }}
        />
      </span>
      <span className="text-[12px] font-bold" style={{ color: tone, ...mono }}>
        {value}%
      </span>
    </span>
  );
}

export function Concept462() {
  const [screen, setScreen] = useState<ScreenKey>("dashboard");
  const active = OPDRACHTEN[0] as Opdracht;

  return (
    <div
      className="relative min-h-[720px] w-full antialiased"
      style={{
        ...body,
        color: C.ink,
        background: C.bg,
        backgroundImage:
          "repeating-linear-gradient(90deg, rgba(92,113,128,0.05) 0px, rgba(92,113,128,0.05) 1px, transparent 1px, transparent 44px)",
      }}
    >
      <style>{`
        @keyframes wsSlide { from { opacity: 0; transform: translateX(-8px); } to { opacity: 1; transform: translateX(0); } }
        .ws-slide { animation: wsSlide 0.4s cubic-bezier(0.22, 1, 0.36, 1) both; }
        @keyframes wsBlink { 0%, 60% { opacity: 1; } 61%, 100% { opacity: 0.35; } }
        .ws-blink { animation: wsBlink 1.6s steps(1) infinite; }
        @media (prefers-reduced-motion: reduce) { .ws-slide, .ws-blink { animation: none !important; } }
      `}</style>

      <div className="relative mx-auto max-w-6xl px-4 pb-24 sm:px-6 md:px-8">
        <TopBar />
        <NavBar screen={screen} setScreen={setScreen} />
        <main key={screen} className="ws-slide pt-7">
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
      <div className="flex items-center gap-3.5">
        <span
          className="inline-flex h-12 w-12 items-center justify-center rounded-[6px]"
          style={{ background: C.panelSoft, border: `1px solid ${C.signalGreen}` }}
          aria-hidden="true"
        >
          <TrainFront size={22} style={{ color: C.signalGreen }} />
        </span>
        <div>
          <p
            className="text-[18px] font-bold uppercase tracking-[0.16em]"
            style={{ color: C.ink, ...mono }}
          >
            Wisselspoor
          </p>
          <p
            className="mt-1 text-[10.5px] uppercase tracking-[0.14em]"
            style={{ color: C.inkMute, ...mono }}
          >
            Emplacement {PROFIEL.plaats}
          </p>
        </div>
      </div>
      <div className="flex items-center gap-3">
        <span className="hidden sm:inline-flex">
          <Sein tone={C.signalGreen}>
            <ShieldCheck size={11} aria-hidden="true" /> {PROFIEL.trust}
          </Sein>
        </span>
        <span
          className="relative inline-flex h-10 w-10 items-center justify-center rounded-[6px]"
          style={{ background: C.panelSoft, border: `1px solid ${C.line}`, color: C.inkMute }}
          aria-label={`${ongelezen} ongelezen berichten`}
        >
          <Bell size={16} aria-hidden="true" />
          {ongelezen > 0 && (
            <span
              className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-[3px] text-[9px] font-bold"
              style={{ background: C.signalYellow, color: C.bgDeep, ...mono }}
              aria-hidden="true"
            >
              {ongelezen}
            </span>
          )}
        </span>
        <span className="hidden text-right sm:block">
          <span className="block text-[13.5px] font-semibold" style={{ color: C.ink }}>
            {PROFIEL.naam}
          </span>
          <span
            className="block text-[10.5px] uppercase tracking-[0.1em]"
            style={{ color: C.inkMute, ...mono }}
          >
            {PROFIEL.rol}
          </span>
        </span>
        <span
          className="inline-flex h-11 w-11 items-center justify-center rounded-[6px] text-[13px] font-bold"
          style={{
            background: C.bgDeep,
            border: `1px solid ${C.rail}`,
            color: C.steelInk,
            ...mono,
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
      <div className="relative">
        <span
          className="pointer-events-none absolute inset-x-0 bottom-0 h-px"
          style={{ background: C.rail }}
          aria-hidden="true"
        />
        <div className="flex items-center gap-1 overflow-x-auto pb-2">
          {SCREENS.map((s) => {
            const on = s.key === screen;
            return (
              <button
                key={s.key}
                type="button"
                onClick={() => setScreen(s.key)}
                aria-current={on ? "page" : undefined}
                className="relative flex shrink-0 items-center gap-2 rounded-t-[4px] px-4 py-2.5 text-[11px] font-bold uppercase tracking-[0.1em] transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#3fb56f] motion-reduce:transition-none"
                style={{ color: on ? C.signalGreen : C.inkMute, ...mono }}
              >
                <Circle
                  size={7}
                  fill={on ? C.signalGreen : "transparent"}
                  style={{ color: on ? C.signalGreen : C.rail }}
                  aria-hidden="true"
                />
                {s.label}
                {on && (
                  <span
                    className="absolute inset-x-0 -bottom-2 h-[3px]"
                    style={{ background: C.signalGreen }}
                    aria-hidden="true"
                  />
                )}
              </button>
            );
          })}
        </div>
      </div>
    </nav>
  );
}

function Dashboard({ onOpen, onActies }: { onOpen: () => void; onActies: () => void }) {
  const primair = ACTIES[0] as (typeof ACTIES)[number];
  const verified = CREDENTIALS.filter((c) => c.status === "VERIFIED").length;
  return (
    <div className="space-y-7">
      <section className="grid grid-cols-1 gap-5 lg:grid-cols-[1.4fr_1fr]">
        <Panel className="p-7 md:p-9" accent={C.signalGreen}>
          <Eyebrow tone={C.greenInk}>Dienstregeling · vandaag</Eyebrow>
          <h1
            className="mt-4 text-[28px] font-bold uppercase leading-[1.08] tracking-[0.02em] md:text-[38px]"
            style={{ color: C.ink, ...mono }}
          >
            Goedemorgen,
            <br />
            <span style={{ color: C.greenInk }}>{PROFIEL.naam.split(" ")[0]}</span>.
          </h1>
          <p className="mt-3 max-w-md text-[14px] leading-relaxed" style={{ color: C.inkSoft }}>
            Je praktijk als emplacement: elke opdracht een spoor, elk certificaat een sein. Alles op
            tijd, alle wissels goed gezet.
          </p>
          <div className="mt-6 flex flex-wrap items-center gap-2.5">
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
        </Panel>

        <Panel className="p-7" accent={C.signalYellow}>
          <div className="flex items-center justify-between">
            <Eyebrow tone={C.yellowInk}>Wissel om te zetten</Eyebrow>
            <span className="ws-blink" aria-hidden="true">
              <Circle size={12} fill={C.signalYellow} style={{ color: C.signalYellow }} />
            </span>
          </div>
          <h2
            className="mt-4 text-[17px] font-bold uppercase tracking-[0.01em]"
            style={{ color: C.ink, ...mono }}
          >
            {primair.titel}
          </h2>
          <p className="mt-2 text-[13.5px] leading-relaxed" style={{ color: C.inkSoft }}>
            {primair.detail}
          </p>
          <div className="mt-6">
            <button
              type="button"
              onClick={onActies}
              className="inline-flex w-full items-center justify-center gap-2 rounded-[4px] px-5 py-2.5 text-[11.5px] font-bold uppercase tracking-[0.12em] transition-all duration-150 hover:brightness-[1.08] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#e0b13a] focus-visible:ring-offset-2 focus-visible:ring-offset-[#161f26] motion-reduce:transition-none"
              style={{ color: C.bgDeep, background: C.signalYellow, ...mono }}
            >
              {primair.cta}
              <ArrowRight size={13} aria-hidden="true" />
            </button>
          </div>
          <p
            className="mt-5 flex items-center gap-2 text-[11.5px]"
            style={{ color: C.inkMute, ...mono }}
          >
            <Check size={13} aria-hidden="true" style={{ color: C.signalGreen }} />
            {verified}/{CREDENTIALS.length} SEINEN VRIJ · 7 OPEN REACTIES
          </p>
        </Panel>
      </section>

      <section>
        <div className="mb-4">
          <Eyebrow>Meetpunten · deze maand</Eyebrow>
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {KPIS.map((k, i) => (
            <Panel key={k.label} className="p-5">
              <div className="flex items-start justify-between gap-2">
                <p
                  className="text-[9.5px] font-bold uppercase tracking-[0.14em]"
                  style={{ color: C.inkMute, ...mono }}
                >
                  {k.label}
                </p>
                <span
                  className="inline-flex items-center gap-0.5 rounded-[3px] px-1.5 py-0.5 text-[9.5px] font-bold"
                  style={{
                    color: k.up ? C.greenInk : C.yellowInk,
                    background: k.up ? C.greenWash : C.yellowWash,
                    ...mono,
                  }}
                >
                  {k.up ? "▲" : "▼"} {k.trend.replace(/^[+-]/, "")}
                </span>
              </div>
              <p
                className="mt-3 text-[26px] font-bold leading-none tracking-[-0.01em]"
                style={{ color: C.ink, ...mono }}
              >
                {k.value}
              </p>
              <div className="mt-3">
                <RailSpark data={k.spark} tone={k.up ? C.signalGreen : C.steel} id={`k452-${i}`} />
              </div>
            </Panel>
          ))}
        </div>
      </section>

      <section className="grid grid-cols-1 gap-5 lg:grid-cols-[1.45fr_1fr]">
        <div>
          <div className="mb-4 flex items-baseline justify-between">
            <Eyebrow>Sporen · open opdrachten</Eyebrow>
            <button
              type="button"
              onClick={onOpen}
              className="rounded text-[10px] font-bold uppercase tracking-[0.14em] transition-colors hover:brightness-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#3fb56f] focus-visible:ring-offset-2 focus-visible:ring-offset-[#0e1418]"
              style={{ color: C.greenInk, ...mono }}
            >
              Alle →
            </button>
          </div>
          <Panel className="py-2">
            <ul className="relative">
              <span
                className="pointer-events-none absolute bottom-4 left-[34px] top-4 w-px"
                style={{ background: C.rail }}
                aria-hidden="true"
              />
              {OPDRACHTEN.map((o, i) => (
                <li key={o.id}>
                  <button
                    type="button"
                    onClick={onOpen}
                    className="group relative grid w-full grid-cols-[auto_1fr_auto] items-center gap-4 px-5 py-4 text-left transition-colors hover:bg-[#1d2830] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#3fb56f] motion-reduce:transition-none"
                  >
                    <span
                      className="relative z-10 inline-flex h-8 w-8 items-center justify-center rounded-full"
                      style={{
                        background: i === 0 ? C.signalGreen : C.bgDeep,
                        border: `2px solid ${i === 0 ? C.signalGreen : C.rail}`,
                      }}
                      aria-hidden="true"
                    >
                      <span
                        className="text-[10px] font-bold"
                        style={{ color: i === 0 ? C.bgDeep : C.inkMute, ...mono }}
                      >
                        {o.match}
                      </span>
                    </span>
                    <span className="min-w-0">
                      <span
                        className="block truncate text-[14.5px] font-semibold"
                        style={{ color: C.ink }}
                      >
                        {o.titel}
                      </span>
                      <span
                        className="mt-0.5 block truncate text-[11.5px]"
                        style={{ color: C.inkMute, ...mono }}
                      >
                        {o.opdrachtgever} · {o.plaats} · {o.tarief}
                      </span>
                    </span>
                    <span className="flex items-center gap-3">
                      <Gauge value={o.match} tone={o.match >= 90 ? C.signalGreen : C.steel} />
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
          <div className="mb-4">
            <Eyebrow>Seinen · certificaten</Eyebrow>
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
                      className="inline-flex h-8 w-8 items-center justify-center rounded-full"
                      style={{ background: st.wash, border: `1px solid ${st.tone}`, color: st.ink }}
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
                      <span
                        className="block truncate text-[10px] uppercase tracking-[0.08em]"
                        style={{ color: C.inkMute, ...mono }}
                      >
                        {st.sein}
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
    <div className="space-y-7">
      <div>
        <Eyebrow>Rangeerterrein</Eyebrow>
        <h1
          className="mt-3 text-[28px] font-bold uppercase tracking-[0.02em]"
          style={{ color: C.ink, ...mono }}
        >
          Open opdrachten
        </h1>
        <p
          className="mt-2 text-[12px] uppercase tracking-[0.1em]"
          style={{ color: C.inkMute, ...mono }}
        >
          Spoor {String(filtered.length).padStart(2, "0")} /{" "}
          {String(OPDRACHTEN.length).padStart(2, "0")} bezet
        </p>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div
          className="flex flex-1 items-center gap-2.5 rounded-[4px] px-4 py-3"
          style={{ background: C.panelSoft, border: `1px solid ${C.line}` }}
        >
          <Search size={16} aria-hidden="true" style={{ color: C.inkFaint }} />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Zoek op titel, plaats of opdrachtgever…"
            aria-label="Opdrachten zoeken"
            className="w-full bg-transparent text-[13px] outline-none placeholder:text-[#586873]"
            style={{ color: C.ink, ...mono }}
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
                <div className="animate-pulse space-y-3 motion-reduce:animate-none">
                  <div className="h-3 w-24 rounded-[2px]" style={{ background: C.raise }} />
                  <div className="h-5 w-2/3 rounded-[2px]" style={{ background: C.panelSoft }} />
                  <div className="h-3 w-1/2 rounded-[2px]" style={{ background: C.raise }} />
                  <div className="h-1.5 w-full rounded-[2px]" style={{ background: C.raise }} />
                </div>
              </Panel>
            </li>
          ))}
        </ul>
      ) : filtered.length === 0 ? (
        <Panel className="p-6" accent={C.steel}>
          <div className="flex flex-col items-center py-14 text-center">
            <span
              className="inline-flex h-16 w-16 items-center justify-center rounded-full"
              style={{ background: C.bgDeep, border: `1px solid ${C.rail}`, color: C.steelInk }}
              aria-hidden="true"
            >
              <Search size={26} />
            </span>
            <p
              className="mt-5 text-[18px] font-bold uppercase tracking-[0.04em]"
              style={{ color: C.ink, ...mono }}
            >
              Leeg spoor
            </p>
            <p className="mx-auto mt-2 max-w-xs text-[13.5px]" style={{ color: C.inkSoft }}>
              Geen opdracht bij {q ? `“${q}”` : "je zoekterm"}. Verruim je zoekterm en probeer
              opnieuw.
            </p>
            <div className="mt-6">
              <PrimaryButton onClick={() => setQ("")}>
                Zoekterm wissen <ArrowRight size={13} aria-hidden="true" />
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
  const tone = strong ? C.signalGreen : C.steel;
  const ink = strong ? C.greenInk : C.steelInk;
  return (
    <Panel className="p-6" accent={tone}>
      <div className="grid grid-cols-[1fr_auto] items-start gap-4">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <Sein tone={ink}>SPOOR {String(index + 1).padStart(2, "0")}</Sein>
            <span className="text-[10.5px] font-semibold" style={{ color: C.inkFaint, ...mono }}>
              {opdracht.id}
            </span>
          </div>
          <h3
            className="mt-2 text-[17px] font-bold uppercase tracking-[0.01em]"
            style={{ color: C.ink, ...mono }}
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
                className="inline-flex items-center rounded-[3px] px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.06em]"
                style={{
                  color: C.inkSoft,
                  background: C.raise,
                  border: `1px solid ${C.lineSoft}`,
                  ...mono,
                }}
              >
                {t}
              </span>
            ))}
          </div>
        </div>
        <div className="flex flex-col items-center gap-1.5">
          <span
            className="inline-flex h-16 w-16 flex-col items-center justify-center rounded-full"
            style={{ background: C.bgDeep, border: `2px solid ${tone}` }}
          >
            <span className="text-[16px] font-bold leading-none" style={{ color: ink, ...mono }}>
              {opdracht.match}
            </span>
            <span
              className="mt-0.5 text-[7px] font-bold uppercase tracking-[0.12em]"
              style={{ color: C.inkFaint, ...mono }}
            >
              match
            </span>
          </span>
          <span className="text-[13px] font-bold" style={{ color: ink, ...mono }}>
            {opdracht.tarief}
          </span>
        </div>
      </div>
      <div className="mt-4 flex items-center gap-3">
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          className="inline-flex items-center gap-1.5 rounded-[4px] px-3.5 py-1.5 text-[10.5px] font-bold uppercase tracking-[0.08em] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#3fb56f] focus-visible:ring-offset-2 focus-visible:ring-offset-[#161f26]"
          style={{ color: ink, border: `1px solid ${C.line}`, ...mono }}
        >
          {open ? <Minus size={12} aria-hidden="true" /> : <Plus size={12} aria-hidden="true" />}
          Wisselstand
        </button>
        <div className="ml-auto">
          <PrimaryButton onClick={onOpen}>
            Reageer <ArrowRight size={13} aria-hidden="true" />
          </PrimaryButton>
        </div>
      </div>
      <div
        className="grid transition-all duration-500 motion-reduce:transition-none"
        style={{ gridTemplateRows: open ? "1fr" : "0fr" }}
      >
        <div className="overflow-hidden">
          <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
            <RedenBlok
              titel="Vrij baan"
              tone={C.greenInk}
              Icon={Check}
              items={opdracht.redenen.plus}
            />
            <RedenBlok
              titel="Opletten"
              tone={C.yellowInk}
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
      className="rounded-[4px] p-4"
      style={{ background: C.raise, border: `1px solid ${C.lineSoft}` }}
    >
      <p
        className="text-[9.5px] font-bold uppercase tracking-[0.16em]"
        style={{ color: tone, ...mono }}
      >
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
  const strong = opdracht.match >= 90;
  const ink = strong ? C.greenInk : C.steelInk;
  return (
    <div className="space-y-6">
      <button
        type="button"
        onClick={onBack}
        className="inline-flex items-center gap-2 rounded-[4px] px-4 py-2 text-[11px] font-bold uppercase tracking-[0.1em] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5c7180] focus-visible:ring-offset-2 focus-visible:ring-offset-[#0e1418]"
        style={{
          color: C.inkSoft,
          border: `1px solid ${C.line}`,
          background: C.panelSoft,
          ...mono,
        }}
      >
        <ArrowRight size={13} aria-hidden="true" className="rotate-180" /> Terug
      </button>

      <Panel className="p-7 md:p-9" accent={strong ? C.signalGreen : C.steel}>
        <div className="flex flex-wrap items-center gap-2">
          <Sein tone={C.inkMute}>{opdracht.id}</Sein>
          <Sein tone={ink}>
            <TrainFront size={11} aria-hidden="true" /> {strong ? "STERKE MATCH" : "GOEDE MATCH"} ·{" "}
            {opdracht.match}%
          </Sein>
        </div>
        <h1
          className="mt-4 max-w-2xl text-[26px] font-bold uppercase leading-[1.1] tracking-[0.02em] md:text-[34px]"
          style={{ color: C.ink, ...mono }}
        >
          {opdracht.titel}
        </h1>
        <p className="mt-2 text-[14px]" style={{ color: C.inkSoft }}>
          {opdracht.opdrachtgever} · {opdracht.plaats}
        </p>
        <div className="mt-6 flex flex-wrap gap-2.5">
          <PrimaryButton>
            Reageer op opdracht <ArrowRight size={13} aria-hidden="true" />
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
              className="p-5"
              style={{
                borderLeft: i % 4 === 0 ? "none" : `1px solid ${C.lineSoft}`,
                borderTop: i >= 2 ? `1px solid ${C.lineSoft}` : "none",
              }}
            >
              <p
                className="text-[9px] font-bold uppercase tracking-[0.16em]"
                style={{ color: C.inkMute, ...mono }}
              >
                {m.l}
              </p>
              <p
                className="mt-1.5 text-[18px] font-bold tracking-[-0.01em]"
                style={{ color: C.ink, ...mono }}
              >
                {m.v}
              </p>
            </div>
          ))}
        </div>
      </Panel>

      <section>
        <Eyebrow>Wisselstand · verklaarbare matching</Eyebrow>
        <p className="mt-3 max-w-xl text-[13.5px] leading-relaxed" style={{ color: C.inkSoft }}>
          Afgelezen van je geverifieerde profiel — welke wissels vrij staan én welke om aandacht
          vragen, transparant en zonder verborgen score.
        </p>
        <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-2">
          <Panel className="p-6" accent={C.signalGreen}>
            <div className="flex items-center gap-2">
              <span
                className="inline-flex h-8 w-8 items-center justify-center rounded-full"
                style={{
                  color: C.greenInk,
                  background: C.greenWash,
                  border: `1px solid ${C.signalGreen}`,
                }}
                aria-hidden="true"
              >
                <Check size={15} />
              </span>
              <p
                className="text-[10.5px] font-bold uppercase tracking-[0.14em]"
                style={{ color: C.greenInk, ...mono }}
              >
                Vrij baan
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
                    style={{ color: C.greenInk }}
                  />
                  {r}
                </li>
              ))}
            </ul>
          </Panel>
          <Panel className="p-6" accent={C.signalYellow}>
            <div className="flex items-center gap-2">
              <span
                className="inline-flex h-8 w-8 items-center justify-center rounded-full"
                style={{
                  color: C.yellowInk,
                  background: C.yellowWash,
                  border: `1px solid ${C.signalYellow}`,
                }}
                aria-hidden="true"
              >
                <AlertTriangle size={14} />
              </span>
              <p
                className="text-[10.5px] font-bold uppercase tracking-[0.14em]"
                style={{ color: C.yellowInk, ...mono }}
              >
                Opletten
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
                    style={{ color: C.yellowInk }}
                  />
                  {r}
                </li>
              ))}
            </ul>
          </Panel>
        </div>
        <p
          className="mt-4 text-[11.5px] uppercase tracking-[0.08em]"
          style={{ color: ink, ...mono }}
        >
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
    <div className="space-y-6">
      <Panel className="p-7 md:p-9" accent={C.signalGreen}>
        <div className="flex flex-wrap items-center justify-between gap-6">
          <div className="max-w-md">
            <Eyebrow tone={C.greenInk}>Seinhuis · verificatie</Eyebrow>
            <h1
              className="mt-3 text-[24px] font-bold uppercase tracking-[0.02em]"
              style={{ color: C.ink, ...mono }}
            >
              Jouw certificaten
            </h1>
            <p className="mt-3 text-[13.5px] leading-relaxed" style={{ color: C.inkSoft }}>
              <span className="font-semibold" style={{ color: C.greenInk }}>
                {PROFIEL.trust}.
              </span>{" "}
              {verified} van {CREDENTIALS.length} seinen op vrij baan. Eén sein staat op geel en
              vraagt om vernieuwing. Documenten blijven versleuteld en privé.
            </p>
            <div className="mt-4 max-w-xs">
              <Gauge value={ratio} tone={C.signalGreen} />
            </div>
          </div>
          <span
            className="inline-flex h-24 w-24 flex-col items-center justify-center rounded-full"
            style={{ background: C.bgDeep, border: `2px solid ${C.signalGreen}` }}
            aria-hidden="true"
          >
            <span
              className="text-[26px] font-bold leading-none"
              style={{ color: C.greenInk, ...mono }}
            >
              {ratio}
            </span>
            <span
              className="mt-1 text-[8px] font-bold uppercase tracking-[0.14em]"
              style={{ color: C.inkMute, ...mono }}
            >
              % vrij
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
              <li
                key={c.naam}
                style={{ borderTop: idx === 0 ? "none" : `1px solid ${C.lineSoft}` }}
              >
                <button
                  type="button"
                  onClick={() => setOpen(isOpen ? null : c.naam)}
                  aria-expanded={isOpen}
                  className="grid w-full grid-cols-[1fr_auto] items-center gap-4 px-6 py-4 text-left transition-colors hover:bg-[#1d2830] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#3fb56f] motion-reduce:transition-none sm:grid-cols-[1fr_11rem_2.5rem]"
                >
                  <span className="flex min-w-0 items-center gap-3">
                    <span
                      className="inline-flex h-10 w-10 items-center justify-center rounded-full"
                      style={{ background: st.wash, border: `1px solid ${st.tone}`, color: st.ink }}
                      aria-hidden="true"
                    >
                      <st.Icon size={16} />
                    </span>
                    <span className="min-w-0">
                      <span
                        className="block truncate text-[14.5px] font-semibold"
                        style={{ color: C.ink }}
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
                    <Sein tone={st.ink}>
                      <st.Icon size={11} aria-hidden="true" /> {st.sein}
                      {st.alarm && <span className="sr-only"> (let op)</span>}
                    </Sein>
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
                      <div
                        className="rounded-[4px] p-4"
                        style={{ background: C.raise, border: `1px solid ${C.lineSoft}` }}
                      >
                        <p
                          className="max-w-xl text-[13px] leading-relaxed"
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
        <div className="mb-4">
          <Eyebrow>Documentendepot</Eyebrow>
        </div>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {DOCUMENTEN.map((d) => {
            const st = statusMeta(d.status);
            return (
              <Panel key={d.naam} className="flex items-center gap-3 p-4">
                <span
                  className="inline-flex h-10 w-10 items-center justify-center rounded-[4px]"
                  style={{ background: C.raise, border: `1px solid ${C.line}`, color: C.inkSoft }}
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
                  <span
                    className="block text-[10.5px] uppercase tracking-[0.06em]"
                    style={{ color: C.inkMute, ...mono }}
                  >
                    {d.type} · {d.grootte} · {d.bijgewerkt}
                  </span>
                </span>
                <Sein tone={st.ink}>
                  <st.Icon size={10} aria-hidden="true" /> {st.sein}
                </Sein>
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
        <Eyebrow>Werkorders · op volgorde van urgentie</Eyebrow>
        <h1
          className="mt-3 text-[28px] font-bold uppercase tracking-[0.02em]"
          style={{ color: C.ink, ...mono }}
        >
          Wat nu aandacht vraagt
        </h1>
        <p className="mt-2 max-w-md text-[13.5px]" style={{ color: C.inkSoft }}>
          Rijd het emplacement van boven naar beneden af — zo blijf je verifieerbaar en betaald, op
          tijd.
        </p>
      </div>

      <ol className="space-y-3">
        {ACTIES.map((a, i) => {
          const warn = a.urgentie === "warning";
          const tone = warn ? C.signalYellow : C.signalGreen;
          const ink = warn ? C.yellowInk : C.greenInk;
          const wash = warn ? C.yellowWash : C.greenWash;
          return (
            <li key={a.titel}>
              <Panel className="p-6" accent={tone}>
                <div className="grid grid-cols-[auto_1fr] items-start gap-4 sm:grid-cols-[auto_1fr_auto]">
                  <span
                    className="flex h-11 w-11 items-center justify-center rounded-[6px] text-[15px] font-bold"
                    style={{ background: wash, border: `1.5px solid ${tone}`, color: ink, ...mono }}
                    aria-hidden="true"
                  >
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <div className="min-w-0">
                    <Sein tone={ink}>
                      {warn ? (
                        <AlertTriangle size={10} aria-hidden="true" />
                      ) : (
                        <GitBranch size={10} aria-hidden="true" />
                      )}
                      {warn ? "Urgent" : "Aanbevolen"}
                    </Sein>
                    <h2
                      className="mt-2 text-[17px] font-bold uppercase tracking-[0.01em]"
                      style={{ color: C.ink, ...mono }}
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
                  <div className="col-span-2 mt-1 sm:col-span-1 sm:mt-0 sm:self-center">
                    <button
                      type="button"
                      className="inline-flex items-center justify-center gap-2 rounded-[4px] px-5 py-2.5 text-[11.5px] font-bold uppercase tracking-[0.12em] transition-all duration-150 hover:brightness-[1.08] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-[#161f26] motion-reduce:transition-none"
                      style={{ color: C.bgDeep, background: tone, ...mono }}
                    >
                      {a.cta}
                      <ArrowRight size={13} aria-hidden="true" />
                    </button>
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
  sein: string;
} {
  if (status === "Openstaand")
    return {
      ink: C.yellowInk,
      wash: C.yellowWash,
      tone: C.signalYellow,
      Icon: AlertTriangle,
      sein: "OPEN",
    };
  if (status === "Betaald")
    return {
      ink: C.greenInk,
      wash: C.greenWash,
      tone: C.signalGreen,
      Icon: Check,
      sein: "VOLDAAN",
    };
  return { ink: C.inkMute, wash: C.raise, tone: C.rail, Icon: FileText, sein: "CONCEPT" };
}

function Facturen() {
  const totaalBetaald = "€ 8.622";
  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <Eyebrow>Vrachtbrief · facturen</Eyebrow>
          <h1
            className="mt-3 text-[28px] font-bold uppercase tracking-[0.02em]"
            style={{ color: C.ink, ...mono }}
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
            alarm: false,
            accent: C.signalGreen,
          },
          {
            l: "Openstaand",
            v: "€ 1.350",
            sub: "1 factuur · 9 dagen",
            alarm: true,
            accent: C.signalYellow,
          },
          { l: "Concept", v: "€ 880", sub: "klaar om te versturen", alarm: false, accent: C.steel },
        ].map((s) => (
          <Panel key={s.l} className="p-6" accent={s.accent}>
            <div className="flex items-center justify-between">
              <p
                className="text-[10px] font-bold uppercase tracking-[0.12em]"
                style={{ color: C.inkMute, ...mono }}
              >
                {s.l}
              </p>
              {s.alarm && (
                <span
                  className="inline-flex h-6 w-6 items-center justify-center rounded-full"
                  style={{ background: C.yellowWash, color: C.yellowInk }}
                  aria-hidden="true"
                >
                  <AlertTriangle size={13} />
                </span>
              )}
            </div>
            <p
              className="mt-2 text-[26px] font-bold tracking-[-0.01em]"
              style={{ color: s.alarm ? C.yellowInk : C.ink, ...mono }}
            >
              {s.v}
            </p>
            <p className="mt-1 text-[11px]" style={{ color: C.inkMute }}>
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
              className={`text-[9px] font-bold uppercase tracking-[0.16em] ${i === 4 ? "text-right" : ""}`}
              style={{ color: C.inkMute, ...mono }}
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
                className="grid grid-cols-[1fr_auto] items-center gap-3 px-6 py-4 transition-colors hover:bg-[#1d2830] sm:grid-cols-[8rem_1fr_5rem_9rem_6rem] sm:gap-4"
                style={{ borderTop: i === 0 ? "none" : `1px solid ${C.lineSoft}` }}
              >
                <span
                  className="order-1 text-[11px] font-semibold"
                  style={{ color: C.inkMute, ...mono }}
                >
                  {f.nr}
                </span>
                <span
                  className="order-3 min-w-0 truncate text-[14px] font-semibold sm:order-2"
                  style={{ color: C.ink }}
                >
                  {f.klant}
                </span>
                <span
                  className="order-4 hidden text-[11px] sm:order-3 sm:inline"
                  style={{ color: C.inkMute, ...mono }}
                >
                  {f.datum}
                </span>
                <span className="order-5 sm:order-4">
                  <Sein tone={ft.ink}>
                    {ft.Icon && <ft.Icon size={11} aria-hidden="true" />} {ft.sein}
                  </Sein>
                </span>
                <span
                  className="order-2 text-right text-[14px] font-bold sm:order-5"
                  style={{ color: acc ? C.yellowInk : C.ink, ...mono }}
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
            className="flex items-center gap-2 text-[9.5px] font-bold uppercase tracking-[0.18em]"
            style={{ color: C.inkMute, ...mono }}
          >
            <Check size={12} aria-hidden="true" style={{ color: C.signalGreen }} /> Totaal betaald
          </span>
          <span className="text-[20px] font-bold" style={{ color: C.ink, ...mono }}>
            {totaalBetaald}
          </span>
        </div>
      </Panel>
    </div>
  );
}
