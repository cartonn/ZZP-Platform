"use client";

// Concept 400 — "Almanak" · Astronomische efemeride & sterrenkaart.
// Een curatorieel, data-dicht editorial: diep nacht-inkt met perkament-panelen, gravure-hairlines
// en tabulaire cijfers. De facturen en verificatie verschijnen als efemeride-TABELLEN, de acties als
// "voorspellingen". Subtiele constellatie-motieven (puntjes + lijntjes via SVG) accentueren de
// koppen. Palet: nacht-inkt #0f1830, perkament #ece6d3, messing/goud #caa24a, hemelblauw #6f8fc0.
// Fonts: serif display + mono voor cijfers.

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
  Star,
  Moon,
  Compass,
  Bell,
  Telescope,
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

// — Palet: nacht-inkt met perkament-panelen, messing/goud en hemelblauw —
const C = {
  night: "#0f1830",
  nightAlt: "#131f3d",
  nightHi: "#182549",
  sink: "#0b1226",
  parch: "#ece6d3",
  parchAlt: "#e3dcc4",
  parchHi: "#f3eede",
  ink: "#26314a",
  inkSoft: "#3c4257",
  inkMute: "#6b6450",
  parchLine: "rgba(38,49,74,0.18)",
  parchLineSoft: "rgba(38,49,74,0.1)",
  brass: "#caa24a",
  brassHi: "#e0bd6b",
  brassDim: "#9a7c38",
  sky: "#6f8fc0",
  skyDim: "#54709e",
  cream: "#ece6d3",
  creamMute: "#9aa6c4",
  creamFaint: "#6c7794",
  line: "rgba(202,162,74,0.24)",
  lineSoft: "rgba(236,230,211,0.12)",
  ok: "#7bb890",
  okInk: "#2f6b45",
  okWash: "rgba(123,184,144,0.18)",
  warn: "#c9903c",
  warnInk: "#8a5e18",
  warnWash: "rgba(201,144,60,0.2)",
  info: "#6f8fc0",
  infoWash: "rgba(111,143,192,0.18)",
  bad: "#c06a63",
  badInk: "#8a3e37",
  badWash: "rgba(192,106,99,0.2)",
};

const serif = {
  fontFamily: "Georgia, 'Iowan Old Style', 'Times New Roman', serif",
};
const num = {
  fontFamily: "ui-monospace, SFMono-Regular, Menlo, Consolas, monospace",
};
const body = {
  fontFamily: "system-ui, -apple-system, Segoe UI, Roboto, sans-serif",
};

function statusMeta(s: CredStatus): {
  label: string;
  glyph: string;
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
        glyph: "✦",
        Icon: ShieldCheck,
        alarm: false,
        tone: C.ok,
        ink: C.okInk,
        wash: C.okWash,
      };
    case "SUBMITTED":
      return {
        label: "In beoordeling",
        glyph: "☾",
        Icon: Clock,
        alarm: false,
        tone: C.info,
        ink: C.skyDim,
        wash: C.infoWash,
      };
    case "EXPIRING":
      return {
        label: "Verloopt binnenkort",
        glyph: "△",
        Icon: AlertTriangle,
        alarm: true,
        tone: C.warn,
        ink: C.warnInk,
        wash: C.warnWash,
      };
    case "REJECTED":
      return {
        label: "Afgewezen",
        glyph: "✕",
        Icon: AlertTriangle,
        alarm: true,
        tone: C.bad,
        ink: C.badInk,
        wash: C.badWash,
      };
  }
}

// — Constellatie-accent: sterren + verbindingslijnen, decoratief —
function Constellation({
  points,
  tone = C.brass,
  className = "",
}: {
  points: [number, number][];
  tone?: string;
  className?: string;
}) {
  const line = points.map(([x, y]) => `${x},${y}`).join(" ");
  return (
    <svg
      viewBox="0 0 100 60"
      className={className}
      aria-hidden="true"
      preserveAspectRatio="xMidYMid meet"
    >
      <polyline points={line} fill="none" stroke={tone} strokeWidth="0.5" opacity="0.5" />
      {points.map(([x, y], i) => (
        <circle key={`${x}-${y}`} cx={x} cy={y} r={i === 0 ? 1.6 : 1} fill={tone} opacity="0.9" />
      ))}
    </svg>
  );
}

// — Sterrenveld: fijne puntjes als achtergrond op nacht-panelen —
function Starfield() {
  const stars: [number, number, number][] = [
    [12, 20, 0.7],
    [28, 48, 0.5],
    [44, 14, 0.9],
    [61, 40, 0.6],
    [76, 22, 0.8],
    [88, 52, 0.5],
    [18, 68, 0.6],
    [52, 74, 0.7],
    [70, 66, 0.5],
    [94, 30, 0.7],
    [34, 30, 0.5],
    [82, 78, 0.6],
  ];
  return (
    <svg
      className="pointer-events-none absolute inset-0 h-full w-full"
      viewBox="0 0 100 90"
      preserveAspectRatio="none"
      aria-hidden="true"
    >
      {stars.map(([x, y, r]) => (
        <circle key={`${x}-${y}`} cx={x} cy={y} r={r} fill={C.brass} opacity="0.4" />
      ))}
    </svg>
  );
}

// — Perkament-paneel: licht, editorial, met gravure-hairline —
function Parch({
  children,
  className = "",
  as: Tag = "div",
}: {
  children: React.ReactNode;
  className?: string;
  as?: "div" | "section" | "li";
}) {
  return (
    <Tag
      className={`relative rounded-[4px] ${className}`}
      style={{
        background: `linear-gradient(180deg, ${C.parchHi}, ${C.parch})`,
        border: `1px solid ${C.parchLine}`,
        boxShadow: `0 1px 0 ${C.parchLineSoft}, 0 10px 26px rgba(6,10,22,0.4)`,
        color: C.ink,
      }}
    >
      {children}
    </Tag>
  );
}

// — Nacht-paneel: donker, met sterrenveld —
function NightPanel({
  children,
  className = "",
  stars = false,
}: {
  children: React.ReactNode;
  className?: string;
  stars?: boolean;
}) {
  return (
    <div
      className={`relative overflow-hidden rounded-[4px] ${className}`}
      style={{
        background: `linear-gradient(180deg, ${C.nightHi}, ${C.nightAlt})`,
        border: `1px solid ${C.line}`,
        boxShadow: "0 10px 26px rgba(6,10,22,0.5)",
        color: C.cream,
      }}
    >
      {stars && <Starfield />}
      <div className="relative">{children}</div>
    </div>
  );
}

// — Bovenkop in kapitalen met messing-glyphs eromheen —
function Rubriek({ children, tone = C.brass }: { children: React.ReactNode; tone?: string }) {
  return (
    <p
      className="flex items-center gap-2 text-[10.5px] font-semibold uppercase tracking-[0.3em]"
      style={{ color: tone, ...body }}
    >
      <span aria-hidden="true" style={{ ...serif }}>
        ✦
      </span>
      {children}
    </p>
  );
}

function Zegel({
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
      className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold"
      style={{ color: ink, background: wash, border: `1px solid ${tone}`, ...body }}
    >
      {children}
      {alarm && <span className="sr-only"> (let op)</span>}
    </span>
  );
}

function BrassButton({
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
      className={`group inline-flex items-center justify-center gap-2 rounded-[4px] px-4 py-2.5 text-[13px] font-semibold transition-all duration-200 hover:brightness-105 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#e0bd6b] focus-visible:ring-offset-2 focus-visible:ring-offset-[#0f1830] active:translate-y-px motion-reduce:transition-none ${className}`}
      style={{
        color: C.night,
        background: `linear-gradient(180deg, ${C.brassHi}, ${C.brass})`,
        boxShadow: `0 2px 0 ${C.brassDim}, 0 6px 14px rgba(6,10,22,0.4)`,
        ...serif,
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
  onNight = true,
}: {
  children: React.ReactNode;
  onClick?: () => void;
  active?: boolean;
  className?: string;
  ariaPressed?: boolean;
  onNight?: boolean;
}) {
  const fg = onNight ? C.cream : C.ink;
  const offset = onNight
    ? "focus-visible:ring-offset-[#0f1830]"
    : "focus-visible:ring-offset-[#ece6d3]";
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={ariaPressed}
      className={`inline-flex items-center justify-center gap-2 rounded-[4px] px-3.5 py-2.5 text-[12.5px] font-semibold transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#caa24a] focus-visible:ring-offset-2 ${offset} motion-reduce:transition-none ${className}`}
      style={{
        color: active ? C.night : fg,
        background: active ? C.brass : "transparent",
        border: `1px solid ${active ? C.brass : onNight ? C.line : C.parchLine}`,
        ...serif,
      }}
    >
      {children}
    </button>
  );
}

// — Efemeride-sparkline: fijne curve met eind-ster —
function Efemeride({ data, tone, id }: { data: number[]; tone: string; id: string }) {
  const max = Math.max(...data);
  const min = Math.min(...data);
  const span = max - min || 1;
  const w = 110;
  const h = 28;
  const pts = data.map((d, i) => {
    const x = (i / (data.length - 1)) * w;
    const y = h - ((d - min) / span) * (h - 6) - 3;
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
        <linearGradient id={`ef-${id}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={tone} stopOpacity="0.3" />
          <stop offset="100%" stopColor={tone} stopOpacity="0" />
        </linearGradient>
      </defs>
      <polygon points={`0,${h} ${line} ${w},${h}`} fill={`url(#ef-${id})`} />
      <polyline
        points={line}
        fill="none"
        stroke={tone}
        strokeWidth="1.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx={last[0]} cy={last[1]} r="2.2" fill={tone} />
    </svg>
  );
}

function MagnitudeBar({ value, onNight = false }: { value: number; onNight?: boolean }) {
  const strong = value >= 90;
  const tone = strong ? C.brass : value >= 85 ? C.sky : onNight ? C.creamMute : C.inkMute;
  const track = onNight ? "rgba(236,230,211,0.16)" : C.parchLineSoft;
  return (
    <span className="hidden items-center gap-2 sm:flex" aria-hidden="true">
      <span
        className="relative h-1 w-20 overflow-hidden rounded-full"
        style={{ background: track }}
      >
        <span
          className="block h-full rounded-full"
          style={{ width: `${value}%`, background: tone }}
        />
      </span>
      <span className="text-[12px] font-bold tabular-nums" style={{ color: tone, ...num }}>
        {value}%
      </span>
    </span>
  );
}

export function Concept400() {
  const [screen, setScreen] = useState<ScreenKey>("dashboard");
  const active = OPDRACHTEN[0] as Opdracht;

  return (
    <div
      className="min-h-[720px] w-full antialiased"
      style={{
        ...body,
        color: C.cream,
        background: `radial-gradient(130% 90% at 80% -10%, ${C.nightAlt}, ${C.night} 60%, ${C.sink})`,
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
          className="inline-flex h-11 w-11 items-center justify-center rounded-full"
          style={{ background: C.sink, border: `1px solid ${C.brass}`, color: C.brass }}
          aria-hidden="true"
        >
          <Telescope size={19} />
        </span>
        <div>
          <p
            className="text-[19px] font-semibold leading-none tracking-[0.02em]"
            style={{ color: C.cream, ...serif }}
          >
            Almanak
          </p>
          <p className="mt-1.5 text-[10.5px] leading-none" style={{ color: C.creamFaint, ...num }}>
            MMXXVI · {PROFIEL.plaats} · 52°N 5°O
          </p>
        </div>
      </div>
      <div className="flex items-center gap-3">
        <span
          className="hidden items-center gap-1.5 rounded-full px-2.5 py-1.5 text-[10.5px] font-semibold sm:inline-flex"
          style={{ color: C.ok, border: `1px solid ${C.ok}`, background: C.okWash, ...body }}
        >
          <ShieldCheck size={12} aria-hidden="true" />
          {PROFIEL.trust}
        </span>
        <span
          className="relative inline-flex h-10 w-10 items-center justify-center rounded-full"
          style={{ background: C.sink, border: `1px solid ${C.line}`, color: C.creamMute }}
          aria-label={`${ongelezen} ongelezen berichten`}
        >
          <Bell size={16} aria-hidden="true" />
          {ongelezen > 0 && (
            <span
              className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full text-[9px] font-bold"
              style={{ background: C.brass, color: C.night, ...num }}
              aria-hidden="true"
            >
              {ongelezen}
            </span>
          )}
        </span>
        <span className="hidden text-right sm:block">
          <span className="block text-[13px] font-semibold" style={{ color: C.cream, ...serif }}>
            {PROFIEL.naam}
          </span>
          <span className="block text-[10.5px]" style={{ color: C.creamFaint, ...body }}>
            {PROFIEL.rol}
          </span>
        </span>
        <span
          className="inline-flex h-11 w-11 items-center justify-center rounded-full text-[12.5px] font-semibold"
          style={{ background: C.sink, border: `1px solid ${C.brass}`, color: C.brass, ...serif }}
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
        className="flex items-center gap-1 overflow-x-auto rounded-[4px] p-1.5"
        style={{ background: C.sink, border: `1px solid ${C.line}` }}
      >
        {SCREENS.map((s) => {
          const on = s.key === screen;
          return (
            <button
              key={s.key}
              type="button"
              onClick={() => setScreen(s.key)}
              aria-current={on ? "page" : undefined}
              className="flex shrink-0 items-center gap-2 rounded-[3px] px-3.5 py-2 text-[12.5px] font-semibold transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#caa24a] focus-visible:ring-offset-2 focus-visible:ring-offset-[#0b1226] motion-reduce:transition-none"
              style={{
                color: on ? C.night : C.creamMute,
                background: on ? C.brass : "transparent",
                ...serif,
              }}
            >
              <span aria-hidden="true" className="text-[9px]" style={{ opacity: on ? 1 : 0.5 }}>
                {on ? "★" : "☆"}
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
  return (
    <div className="space-y-6">
      <section className="grid grid-cols-1 gap-5 lg:grid-cols-[1.3fr_1fr]">
        <NightPanel className="p-6" stars>
          <Rubriek>Efemeride · heden</Rubriek>
          <div className="mt-4 flex items-start justify-between gap-4">
            <h1
              className="text-[30px] font-semibold leading-[1.08] tracking-[-0.01em] md:text-[38px]"
              style={{ color: C.cream, ...serif }}
            >
              Goedemorgen,
              <br />
              {PROFIEL.naam.split(" ")[0]}.
            </h1>
            <Constellation
              points={[
                [10, 12],
                [34, 30],
                [58, 18],
                [80, 42],
                [96, 22],
              ]}
              className="hidden h-16 w-28 shrink-0 sm:block"
            />
          </div>
          <p className="mt-3 max-w-md text-[13.5px] leading-relaxed" style={{ color: C.creamMute }}>
            De stand van je praktijk, uitgelezen als een almanak. Alles wat rijst boven de horizon
            vraagt nu je aandacht; de rest staat rustig laag aan de hemel.
          </p>
          <div className="mt-5 flex flex-wrap items-center gap-2.5">
            <BrassButton onClick={onActies}>
              Volgende voorspelling
              <ArrowRight
                size={14}
                aria-hidden="true"
                className="transition-transform group-hover:translate-x-0.5 motion-reduce:transition-none"
              />
            </BrassButton>
            <GhostButton onClick={onOpen}>Sterrenkaart</GhostButton>
          </div>
        </NightPanel>

        <Parch className="p-6">
          <div className="flex items-center justify-between">
            <Rubriek tone={C.warnInk}>Aan de horizon</Rubriek>
            <Moon size={20} aria-hidden="true" style={{ color: C.brassDim }} />
          </div>
          <h2
            className="mt-4 text-[19px] font-semibold leading-snug"
            style={{ color: C.ink, ...serif }}
          >
            {primair.titel}
          </h2>
          <p className="mt-2 text-[13px] leading-relaxed" style={{ color: C.inkSoft }}>
            {primair.detail}
          </p>
          <div className="mt-5">
            <BrassButton onClick={onActies} className="w-full">
              {primair.cta}
              <ArrowRight size={14} aria-hidden="true" />
            </BrassButton>
          </div>
          <div className="mt-4" style={{ borderTop: `1px solid ${C.parchLine}` }}>
            <p className="pt-3 text-[11.5px]" style={{ color: C.inkMute, ...num }}>
              {verified}/{CREDENTIALS.length} certificaten geverifieerd · 7 open reacties
            </p>
          </div>
        </Parch>
      </section>

      <section>
        <div className="mb-3 flex items-baseline justify-between">
          <Rubriek>Standen · deze maand</Rubriek>
          <span className="text-[10px]" style={{ color: C.creamFaint, ...num }}>
            OBS I—IV
          </span>
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {KPIS.map((k, i) => (
            <Parch key={k.label} className="p-4">
              <div className="flex items-start justify-between gap-2">
                <p
                  className="text-[10.5px] font-semibold uppercase tracking-[0.12em]"
                  style={{ color: C.inkMute, ...body }}
                >
                  {k.label}
                </p>
                <span
                  className="inline-flex items-center gap-0.5 rounded-full px-1.5 py-0.5 text-[9.5px] font-bold tabular-nums"
                  style={{
                    color: k.up ? C.okInk : C.warnInk,
                    background: k.up ? C.okWash : C.warnWash,
                    ...num,
                  }}
                >
                  {k.up ? "▲" : "▼"} {k.trend.replace(/^[+-]/, "")}
                </span>
              </div>
              <p
                className="mt-2.5 text-[27px] font-semibold tabular-nums leading-none tracking-[-0.01em]"
                style={{ color: C.ink, ...num }}
              >
                {k.value}
              </p>
              <div className="mt-3">
                <Efemeride data={k.spark} tone={k.up ? C.brass : C.warn} id={`kpi-${i}`} />
              </div>
            </Parch>
          ))}
        </div>
      </section>

      <section className="grid grid-cols-1 gap-5 lg:grid-cols-[1.4fr_1fr]">
        <div>
          <div className="mb-3 flex items-baseline justify-between">
            <Rubriek>Rijzende opdrachten</Rubriek>
            <button
              type="button"
              onClick={onOpen}
              className="rounded text-[10.5px] font-semibold uppercase tracking-[0.14em] transition-colors hover:brightness-125 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#caa24a] focus-visible:ring-offset-2 focus-visible:ring-offset-[#0f1830]"
              style={{ color: C.brass, ...body }}
            >
              Register →
            </button>
          </div>
          <Parch className="overflow-hidden">
            <ul>
              {OPDRACHTEN.map((o, i) => (
                <li key={o.id} style={{ borderTop: i === 0 ? "none" : `1px solid ${C.parchLine}` }}>
                  <button
                    type="button"
                    onClick={onOpen}
                    className="group grid w-full grid-cols-[auto_1fr_auto] items-center gap-3.5 px-4 py-3.5 text-left transition-colors hover:bg-[#e3dcc4] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#caa24a] motion-reduce:transition-none"
                  >
                    <span
                      className="inline-flex h-10 w-10 flex-col items-center justify-center rounded-full"
                      style={{
                        background: C.night,
                        border: `1px solid ${i === 0 ? C.brass : C.skyDim}`,
                      }}
                    >
                      <span
                        className="text-[12px] font-bold tabular-nums leading-none"
                        style={{ color: i === 0 ? C.brassHi : C.sky, ...num }}
                      >
                        {o.match}
                      </span>
                    </span>
                    <span className="min-w-0">
                      <span
                        className="block truncate text-[14.5px] font-semibold"
                        style={{ color: C.ink, ...serif }}
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
                      <MagnitudeBar value={o.match} />
                      <ChevronRight
                        size={17}
                        aria-hidden="true"
                        className="transition-transform group-hover:translate-x-0.5 motion-reduce:transition-none"
                        style={{ color: C.inkMute }}
                      />
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          </Parch>
        </div>

        <div>
          <div className="mb-3">
            <Rubriek>Getuigschriften</Rubriek>
          </div>
          <Parch className="p-4">
            <ul className="space-y-1">
              {CREDENTIALS.map((c, i) => {
                const st = statusMeta(c.status);
                return (
                  <li
                    key={c.naam}
                    className="flex items-center gap-3 py-2"
                    style={{ borderTop: i === 0 ? "none" : `1px solid ${C.parchLineSoft}` }}
                  >
                    <span
                      className="inline-flex h-7 w-7 items-center justify-center rounded-full text-[13px] leading-none"
                      style={{
                        color: st.ink,
                        background: st.wash,
                        border: `1px solid ${st.tone}`,
                        ...serif,
                      }}
                      aria-hidden="true"
                    >
                      {st.glyph}
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
                    <st.Icon size={14} aria-hidden="true" style={{ color: st.ink }} />
                  </li>
                );
              })}
            </ul>
          </Parch>
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
        <Rubriek>Sterrenkaart · marktplaats</Rubriek>
        <h1
          className="mt-3 text-[28px] font-semibold leading-none tracking-[-0.01em]"
          style={{ color: C.cream, ...serif }}
        >
          Open opdrachten
        </h1>
        <p className="mt-2 text-[12.5px]" style={{ color: C.creamMute, ...num }}>
          {String(filtered.length).padStart(2, "0")} van{" "}
          {String(OPDRACHTEN.length).padStart(2, "0")} hemellichamen zichtbaar
        </p>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div
          className="flex flex-1 items-center gap-2.5 rounded-[4px] px-3.5 py-3"
          style={{ background: C.sink, border: `1px solid ${C.line}` }}
        >
          <Search size={16} aria-hidden="true" style={{ color: C.creamFaint }} />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Zoek op titel, plaats of opdrachtgever…"
            aria-label="Opdrachten zoeken"
            className="w-full bg-transparent text-[13px] outline-none placeholder:text-[#6c7794]"
            style={{ color: C.cream, ...body }}
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
              {s === "match" ? "Magnitude" : "Tarief"}
            </GhostButton>
          ))}
        </div>
      </div>

      {filtered.length === 0 ? (
        <Parch className="p-0">
          <div className="flex flex-col items-center px-6 py-16 text-center">
            <span
              className="inline-flex h-16 w-16 items-center justify-center rounded-full"
              style={{ background: C.night, border: `1px solid ${C.brass}`, color: C.brass }}
              aria-hidden="true"
            >
              <Compass size={26} />
            </span>
            <p className="mt-5 text-[18px] font-semibold" style={{ color: C.ink, ...serif }}>
              Geen ster in beeld
            </p>
            <p className="mx-auto mt-2 max-w-xs text-[13px]" style={{ color: C.inkSoft }}>
              Geen hemellichaam past bij {q ? `“${q}”` : "je zoekterm"}. Verruim de zoekterm om meer
              te ontdekken.
            </p>
            <div className="mt-6">
              <BrassButton onClick={() => setQ("")}>
                Zoekterm wissen <ArrowRight size={14} aria-hidden="true" />
              </BrassButton>
            </div>
          </div>
        </Parch>
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
  const tone = strong ? C.brass : C.sky;
  const toneInk = strong ? C.brassDim : C.skyDim;
  return (
    <Parch className="p-5">
      <div className="grid grid-cols-[1fr_auto] items-start gap-4">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span
              className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.1em]"
              style={{ color: C.inkMute, border: `1px solid ${C.parchLine}`, ...num }}
            >
              № {String(index + 1).padStart(2, "0")}
            </span>
            <span className="text-[11px] font-semibold" style={{ color: C.inkMute, ...num }}>
              {opdracht.id}
            </span>
          </div>
          <h3
            className="mt-2 text-[17px] font-semibold leading-snug"
            style={{ color: C.ink, ...serif }}
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
                className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10.5px] font-semibold"
                style={{
                  color: C.inkSoft,
                  background: C.parchAlt,
                  border: `1px solid ${C.parchLine}`,
                  ...body,
                }}
              >
                <Star size={9} aria-hidden="true" style={{ color: C.brassDim }} />
                {t}
              </span>
            ))}
          </div>
        </div>
        <div className="flex flex-col items-center gap-1.5">
          <span
            className="inline-flex h-14 w-14 flex-col items-center justify-center rounded-full"
            style={{ background: C.night, border: `1.5px solid ${tone}` }}
          >
            <span
              className="text-[16px] font-bold tabular-nums leading-none"
              style={{ color: tone, ...num }}
            >
              {opdracht.match}
            </span>
            <span
              className="mt-0.5 text-[7.5px] uppercase tracking-[0.1em]"
              style={{ color: C.creamFaint, ...body }}
            >
              mag
            </span>
          </span>
          <span className="text-[13px] font-bold tabular-nums" style={{ color: toneInk, ...num }}>
            {opdracht.tarief}
          </span>
        </div>
      </div>
      <div className="mt-4 flex items-center gap-3">
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          className="inline-flex items-center gap-1.5 rounded-[4px] px-2.5 py-1.5 text-[11.5px] font-semibold transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#caa24a] focus-visible:ring-offset-2 focus-visible:ring-offset-[#ece6d3]"
          style={{ color: C.brassDim, border: `1px solid ${C.parchLine}`, ...serif }}
        >
          {open ? <Minus size={12} aria-hidden="true" /> : <Plus size={12} aria-hidden="true" />}
          Duiding
        </button>
        <div className="ml-auto">
          <BrassButton onClick={onOpen}>
            Reageer <ArrowRight size={13} aria-hidden="true" />
          </BrassButton>
        </div>
      </div>
      <div
        className="grid transition-all duration-300 motion-reduce:transition-none"
        style={{ gridTemplateRows: open ? "1fr" : "0fr" }}
      >
        <div className="overflow-hidden">
          <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
            <RedenBlok
              titel="Gunstige standen"
              tone={C.okInk}
              Icon={Check}
              items={opdracht.redenen.plus}
            />
            <RedenBlok
              titel="Ongunstige standen"
              tone={C.warnInk}
              Icon={AlertTriangle}
              items={opdracht.redenen.min}
            />
          </div>
        </div>
      </div>
    </Parch>
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
      style={{ background: C.parchAlt, border: `1px solid ${C.parchLineSoft}` }}
    >
      <p
        className="text-[10px] font-semibold uppercase tracking-[0.16em]"
        style={{ color: tone, ...body }}
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
  const tone = strong ? C.brass : C.sky;
  return (
    <div className="space-y-6">
      <button
        type="button"
        onClick={onBack}
        className="inline-flex items-center gap-2 rounded-[4px] px-3.5 py-2 text-[12px] font-semibold transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#caa24a] focus-visible:ring-offset-2 focus-visible:ring-offset-[#0f1830]"
        style={{ color: C.cream, border: `1px solid ${C.line}`, ...serif }}
      >
        <ArrowRight size={13} aria-hidden="true" className="rotate-180" /> Terug naar sterrenkaart
      </button>

      <NightPanel className="p-6 md:p-8" stars>
        <div className="relative flex flex-wrap items-center gap-2">
          <span
            className="inline-flex items-center rounded-full px-2 py-0.5 text-[10.5px] font-semibold"
            style={{ color: C.creamMute, border: `1px solid ${C.line}`, ...num }}
          >
            {opdracht.id}
          </span>
          <span
            className="inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-semibold"
            style={{ color: C.night, background: tone, ...serif }}
          >
            <Star size={11} aria-hidden="true" /> magnitude {opdracht.match}
          </span>
        </div>
        <h1
          className="relative mt-4 max-w-2xl text-[28px] font-semibold leading-[1.1] tracking-[-0.01em] md:text-[38px]"
          style={{ color: C.cream, ...serif }}
        >
          {opdracht.titel}
        </h1>
        <p className="relative mt-2 text-[14px]" style={{ color: C.creamMute }}>
          {opdracht.opdrachtgever} · {opdracht.plaats}
        </p>
        <div className="relative mt-5 flex flex-wrap gap-2.5">
          <BrassButton>
            Reageer op opdracht <ArrowRight size={14} aria-hidden="true" />
          </BrassButton>
          <GhostButton>Bewaren</GhostButton>
        </div>
      </NightPanel>

      <Parch className="overflow-hidden">
        <div className="grid grid-cols-2 md:grid-cols-4">
          {[
            { l: "Tarief", v: opdracht.tarief },
            { l: "Omvang", v: opdracht.uren },
            { l: "Start", v: opdracht.start },
            { l: "Magnitude", v: `${opdracht.match}%` },
          ].map((m, i) => (
            <div
              key={m.l}
              className="p-4"
              style={{
                borderLeft: i % 4 === 0 ? "none" : `1px solid ${C.parchLine}`,
                borderTop: i >= 2 ? `1px solid ${C.parchLine}` : "none",
              }}
            >
              <p
                className="text-[9.5px] font-semibold uppercase tracking-[0.16em]"
                style={{ color: C.inkMute, ...body }}
              >
                {m.l}
              </p>
              <p
                className="mt-1.5 text-[18px] font-semibold tabular-nums tracking-[-0.01em]"
                style={{ color: C.ink, ...num }}
              >
                {m.v}
              </p>
            </div>
          ))}
        </div>
      </Parch>

      <section>
        <Rubriek>Duiding · waarom deze stand</Rubriek>
        <p className="mt-3 max-w-xl text-[13.5px] leading-relaxed" style={{ color: C.creamMute }}>
          Transparant afgelezen van je geverifieerde profiel — welke standen gunstig staan én waar
          de hemel tegenwerkt, zonder verborgen score.
        </p>
        <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-2">
          <Parch className="p-5">
            <div className="flex items-center gap-2">
              <span
                className="inline-flex h-8 w-8 items-center justify-center rounded-full text-[15px] leading-none"
                style={{
                  color: C.okInk,
                  background: C.okWash,
                  border: `1px solid ${C.ok}`,
                  ...serif,
                }}
                aria-hidden="true"
              >
                ✦
              </span>
              <p
                className="text-[11px] font-semibold uppercase tracking-[0.14em]"
                style={{ color: C.okInk, ...body }}
              >
                Gunstige standen
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
                    style={{ color: C.okInk }}
                  />
                  {r}
                </li>
              ))}
            </ul>
          </Parch>
          <Parch className="p-5">
            <div className="flex items-center gap-2">
              <span
                className="inline-flex h-8 w-8 items-center justify-center rounded-full text-[15px] leading-none"
                style={{
                  color: C.warnInk,
                  background: C.warnWash,
                  border: `1px solid ${C.warn}`,
                  ...serif,
                }}
                aria-hidden="true"
              >
                △
              </span>
              <p
                className="text-[11px] font-semibold uppercase tracking-[0.14em]"
                style={{ color: C.warnInk, ...body }}
              >
                Ongunstige standen
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
                    style={{ color: C.warnInk }}
                  />
                  {r}
                </li>
              ))}
            </ul>
          </Parch>
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
      <NightPanel className="p-6 md:p-7" stars>
        <div className="flex flex-wrap items-center justify-between gap-6">
          <div className="max-w-md">
            <Rubriek>Authenticatie · getuigschriften</Rubriek>
            <h1
              className="mt-3 text-[26px] font-semibold leading-tight tracking-[-0.01em]"
              style={{ color: C.cream, ...serif }}
            >
              Verificatie
            </h1>
            <p className="mt-3 text-[13.5px] leading-relaxed" style={{ color: C.creamMute }}>
              <span className="font-semibold" style={{ color: C.cream }}>
                {PROFIEL.trust}.
              </span>{" "}
              {verified} van {CREDENTIALS.length} getuigschriften staan geverifieerd. Eén nadert de
              horizon en vraagt om vernieuwing.
            </p>
          </div>
          <span
            className="inline-flex h-24 w-24 flex-col items-center justify-center rounded-full"
            style={{ background: C.sink, border: `1.5px solid ${C.brass}` }}
          >
            <span
              className="text-[26px] font-bold tabular-nums leading-none"
              style={{ color: C.brassHi, ...num }}
            >
              {ratio}
            </span>
            <span
              className="mt-1 text-[8px] font-semibold uppercase tracking-[0.16em]"
              style={{ color: C.creamFaint, ...body }}
            >
              % zenit
            </span>
          </span>
        </div>
      </NightPanel>

      <Parch className="overflow-hidden">
        <div
          className="hidden grid-cols-[1fr_10rem_2.5rem] items-center gap-4 px-5 py-3 sm:grid"
          style={{ borderBottom: `1px solid ${C.parchLine}` }}
        >
          {["Getuigschrift", "Stand", ""].map((h, i) => (
            <span
              key={h || i}
              className="text-[9.5px] font-semibold uppercase tracking-[0.18em]"
              style={{ color: C.inkMute, ...body }}
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
                style={{ borderTop: idx === 0 ? "none" : `1px solid ${C.parchLine}` }}
              >
                <button
                  type="button"
                  onClick={() => setOpen(isOpen ? null : c.naam)}
                  aria-expanded={isOpen}
                  className="grid w-full grid-cols-[1fr_auto] items-center gap-4 px-5 py-4 text-left transition-colors hover:bg-[#e3dcc4] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#caa24a] motion-reduce:transition-none sm:grid-cols-[1fr_10rem_2.5rem]"
                >
                  <span className="flex min-w-0 items-center gap-3">
                    <span
                      className="inline-flex h-9 w-9 items-center justify-center rounded-full text-[15px] leading-none"
                      style={{
                        color: st.ink,
                        background: st.wash,
                        border: `1px solid ${st.tone}`,
                        ...serif,
                      }}
                      aria-hidden="true"
                    >
                      {st.glyph}
                    </span>
                    <span className="min-w-0">
                      <span
                        className="block truncate text-[14.5px] font-semibold"
                        style={{ color: C.ink, ...serif }}
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
                    <Zegel tone={st.tone} ink={st.ink} wash={st.wash} alarm={st.alarm}>
                      <st.Icon size={11} aria-hidden="true" />
                      {st.label}
                    </Zegel>
                  </span>
                  <span
                    className="hidden justify-self-end transition-transform motion-reduce:transition-none sm:block"
                    style={{
                      color: C.inkMute,
                      transform: isOpen ? "rotate(45deg)" : "rotate(0deg)",
                    }}
                    aria-hidden="true"
                  >
                    <Plus size={15} />
                  </span>
                </button>
                <div
                  className="grid transition-all duration-300 motion-reduce:transition-none"
                  style={{ gridTemplateRows: isOpen ? "1fr" : "0fr" }}
                >
                  <div className="overflow-hidden">
                    <div className="px-5 pb-5 sm:pl-[68px]">
                      <div
                        className="rounded-[4px] p-4"
                        style={{ background: C.parchAlt, border: `1px solid ${C.parchLineSoft}` }}
                      >
                        <p
                          className="max-w-xl text-[13px] leading-relaxed"
                          style={{ color: C.inkSoft }}
                        >
                          {c.detail}. Documenten worden versleuteld bewaard en alleen na je
                          expliciete toestemming gedeeld met een opdrachtgever.
                        </p>
                        <div className="mt-3 flex flex-wrap gap-2">
                          <BrassButton>
                            {c.status === "EXPIRING" ? "Vernieuwen" : "Bekijken"}
                          </BrassButton>
                          <GhostButton onNight={false}>Historie</GhostButton>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      </Parch>
    </div>
  );
}

function Acties() {
  return (
    <div className="space-y-6">
      <div>
        <Rubriek>Voorspellingen · volgende acties</Rubriek>
        <h1
          className="mt-3 text-[28px] font-semibold leading-none tracking-[-0.01em]"
          style={{ color: C.cream, ...serif }}
        >
          Acties
        </h1>
        <p className="mt-2 max-w-md text-[13px]" style={{ color: C.creamMute }}>
          Op volgorde van rijzing — werk van boven naar beneden om verifieerbaar en betaald te
          blijven.
        </p>
      </div>

      <ol className="space-y-3">
        {ACTIES.map((a, i) => {
          const warn = a.urgentie === "warning";
          const tone = warn ? C.warn : C.sky;
          const ink = warn ? C.warnInk : C.skyDim;
          const wash = warn ? C.warnWash : C.infoWash;
          return (
            <li key={a.titel}>
              <Parch className="p-5">
                <div className="grid grid-cols-[auto_1fr] items-start gap-4 sm:grid-cols-[auto_1fr_auto]">
                  <span
                    className="flex h-11 w-11 items-center justify-center rounded-full text-[15px] font-semibold tabular-nums"
                    style={{
                      background: C.night,
                      border: `1.5px solid ${tone}`,
                      color: tone,
                      ...num,
                    }}
                    aria-hidden="true"
                  >
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <div className="min-w-0">
                    <span
                      className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[9.5px] font-semibold uppercase tracking-[0.12em]"
                      style={{ color: ink, background: wash, border: `1px solid ${tone}`, ...body }}
                    >
                      {warn ? (
                        <AlertTriangle size={10} aria-hidden="true" />
                      ) : (
                        <Star size={10} aria-hidden="true" />
                      )}
                      {warn ? "Conjunctie" : "Voorteken"}
                    </span>
                    <h2
                      className="mt-2 text-[16px] font-semibold leading-snug"
                      style={{ color: C.ink, ...serif }}
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
                    <BrassButton>
                      {a.cta}
                      <ArrowRight size={13} aria-hidden="true" />
                    </BrassButton>
                  </div>
                </div>
              </Parch>
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
  return { ink: C.inkMute, wash: "transparent", tone: C.parchLine, Icon: null };
}

function Facturen() {
  const totaalBetaald = "€ 8.622";
  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <Rubriek>Efemeride · grootboek</Rubriek>
          <h1
            className="mt-3 text-[28px] font-semibold leading-none tracking-[-0.01em]"
            style={{ color: C.cream, ...serif }}
          >
            Facturen
          </h1>
        </div>
        <BrassButton>
          <Plus size={14} aria-hidden="true" /> Nieuwe factuur
        </BrassButton>
      </div>

      <section className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {[
          { l: "Betaald (mnd)", v: totaalBetaald, sub: "3 voldaan", ink: C.okInk, alarm: false },
          {
            l: "Openstaand",
            v: "€ 1.350",
            sub: "1 factuur · 9 dagen",
            ink: C.warnInk,
            alarm: true,
          },
          { l: "Concept", v: "€ 880", sub: "klaar om te versturen", ink: C.skyDim, alarm: false },
        ].map((s) => (
          <Parch key={s.l} className="p-5">
            <div className="flex items-center justify-between">
              <p
                className="text-[10.5px] font-semibold uppercase tracking-[0.12em]"
                style={{ color: C.inkMute, ...body }}
              >
                {s.l}
              </p>
              {s.alarm && (
                <span
                  className="inline-flex h-6 w-6 items-center justify-center rounded-full"
                  style={{ background: C.warnWash, color: C.warnInk }}
                  aria-hidden="true"
                >
                  <AlertTriangle size={13} />
                </span>
              )}
            </div>
            <p
              className="mt-2 text-[27px] font-semibold tabular-nums tracking-[-0.01em]"
              style={{ color: s.alarm ? C.warnInk : C.ink, ...num }}
            >
              {s.v}
            </p>
            <p className="mt-1 text-[11.5px]" style={{ color: C.inkMute }}>
              {s.sub}
            </p>
          </Parch>
        ))}
      </section>

      <Parch className="overflow-hidden">
        <div
          className="hidden grid-cols-[8rem_1fr_5rem_9rem_6rem] gap-4 px-5 pb-3 pt-4 sm:grid"
          style={{ borderBottom: `1px solid ${C.parchLine}` }}
        >
          {["Nummer", "Klant", "Datum", "Stand", "Bedrag"].map((h, i) => (
            <span
              key={h}
              className={`text-[9.5px] font-semibold uppercase tracking-[0.16em] ${i === 4 ? "text-right" : ""}`}
              style={{ color: C.inkMute, ...body }}
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
                className="grid grid-cols-[1fr_auto] items-center gap-3 px-5 py-3.5 transition-colors hover:bg-[#e3dcc4] sm:grid-cols-[8rem_1fr_5rem_9rem_6rem] sm:gap-4"
                style={{ borderTop: i === 0 ? "none" : `1px solid ${C.parchLine}` }}
              >
                <span
                  className="order-1 text-[11.5px] font-semibold tabular-nums"
                  style={{ color: C.inkMute, ...num }}
                >
                  {f.nr}
                </span>
                <span
                  className="order-3 min-w-0 truncate text-[13.5px] font-semibold sm:order-2"
                  style={{ color: C.ink, ...serif }}
                >
                  {f.klant}
                </span>
                <span
                  className="order-4 hidden text-[11.5px] tabular-nums sm:order-3 sm:inline"
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
                      border: `1px solid ${ft.tone}`,
                      ...body,
                    }}
                  >
                    {ft.Icon && <ft.Icon size={11} aria-hidden="true" />}
                    {f.status}
                  </span>
                </span>
                <span
                  className="order-2 text-right text-[14px] font-bold tabular-nums sm:order-5"
                  style={{ color: acc ? C.warnInk : C.ink, ...num }}
                >
                  {f.bedrag}
                </span>
              </li>
            );
          })}
        </ul>
        <div
          className="flex items-baseline justify-between px-5 py-4"
          style={{ borderTop: `1px solid ${C.parchLine}` }}
        >
          <span
            className="flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.18em]"
            style={{ color: C.inkMute, ...body }}
          >
            <Star size={12} aria-hidden="true" style={{ color: C.brassDim }} /> Totaal betaald
          </span>
          <span className="text-[20px] font-semibold tabular-nums" style={{ color: C.ink, ...num }}>
            {totaalBetaald}
          </span>
        </div>
      </Parch>
    </div>
  );
}
