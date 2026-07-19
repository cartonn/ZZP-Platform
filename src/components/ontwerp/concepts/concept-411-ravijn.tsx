"use client";

// Concept 411 — "Ravijn" · Cinematisch donker-editorial "canyon".
// Bijna-zwart canvas met één dramatische verticale lichtschacht langs de linker content-kolom.
// Content ligt in horizontale gelaagde "sediment"-stroken (elke sectie een aardlaag met eigen
// subtiele toon). Ultra-grote, smalle condensed display-type; één koel-wit + één warm amber accent
// dat als licht op de kern-content valt. Diepe schaduwen, hairline-scheidingen. Rustig-dramatisch.
// Palet: bijna-zwart #0b0c0e, koel-wit #eef1f5, amber #e8a33d.
// Fonts: condensed display (Archivo Narrow / Oswald-gevoel) + humanist grotesk body, tabulaire cijfers.

import { useMemo, useState } from "react";
import {
  ArrowRight,
  ArrowLeft,
  Check,
  Clock,
  AlertTriangle,
  Search,
  Plus,
  Minus,
  ShieldCheck,
  ChevronRight,
  Bell,
  FileText,
  Mountain,
  Sun,
  Layers,
  Compass,
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
  type ScreenKey,
  type CredStatus,
  type Opdracht,
} from "./mock";

// — Palet: bijna-zwart canvas, gelaagde sediment-tonen, koel-wit + warm amber —
const C = {
  abyss: "#08090b",
  bg: "#0b0c0e",
  strata0: "#0d0e11",
  strata1: "#101216",
  strata2: "#0e1013",
  rise: "#15181d",
  riseHi: "#1b1f26",
  white: "#eef1f5",
  mist: "#c3c9d2",
  mute: "#8b929d",
  faint: "#5c626d",
  amber: "#e8a33d",
  amberHi: "#f4c069",
  amberDeep: "#b87d26",
  amberWash: "rgba(232,163,61,0.12)",
  amberLine: "rgba(232,163,61,0.28)",
  line: "rgba(238,241,245,0.08)",
  lineSoft: "rgba(238,241,245,0.05)",
  ok: "#5f9e7a",
  okInk: "#8fce9f",
  okWash: "rgba(95,158,122,0.16)",
  warn: "#d99a3f",
  warnInk: "#eec178",
  warnWash: "rgba(217,154,63,0.16)",
  info: "#6d8bb0",
  infoInk: "#a3bcd9",
  infoWash: "rgba(109,139,176,0.16)",
  bad: "#c0705c",
  badInk: "#dd9a86",
  badWash: "rgba(192,112,92,0.18)",
};

const display = {
  fontFamily:
    "'Archivo Narrow', 'Oswald', 'Roboto Condensed', 'Helvetica Neue', system-ui, sans-serif",
};
const bodyF = {
  fontFamily: "'Inter', 'Segoe UI', system-ui, -apple-system, sans-serif",
};
const num = {
  fontFamily: "'Inter', ui-monospace, SFMono-Regular, Menlo, monospace",
  fontVariantNumeric: "tabular-nums" as const,
};

function statusMeta(s: CredStatus): {
  label: string;
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
        Icon: ShieldCheck,
        alarm: false,
        tone: C.ok,
        ink: C.okInk,
        wash: C.okWash,
      };
    case "SUBMITTED":
      return {
        label: "In beoordeling",
        Icon: Clock,
        alarm: false,
        tone: C.info,
        ink: C.infoInk,
        wash: C.infoWash,
      };
    case "EXPIRING":
      return {
        label: "Verloopt binnenkort",
        Icon: AlertTriangle,
        alarm: true,
        tone: C.warn,
        ink: C.warnInk,
        wash: C.warnWash,
      };
    case "REJECTED":
      return {
        label: "Afgewezen",
        Icon: AlertTriangle,
        alarm: true,
        tone: C.bad,
        ink: C.badInk,
        wash: C.badWash,
      };
  }
}

// — Kaart: donker paneel met hairline-rand, diepe schaduw —
function Slab({
  children,
  className = "",
  lit = false,
  as: Tag = "div",
}: {
  children: React.ReactNode;
  className?: string;
  lit?: boolean;
  as?: "div" | "section" | "li";
}) {
  return (
    <Tag
      className={`relative overflow-hidden rounded-lg ${className}`}
      style={{
        background: lit
          ? `linear-gradient(150deg, ${C.riseHi} 0%, ${C.rise} 55%, ${C.strata0} 100%)`
          : C.rise,
        border: `1px solid ${lit ? C.amberLine : C.line}`,
        boxShadow: lit
          ? "0 26px 60px rgba(0,0,0,0.6), inset 0 1px 0 rgba(238,241,245,0.05)"
          : "0 16px 40px rgba(0,0,0,0.5), inset 0 1px 0 rgba(238,241,245,0.03)",
        color: C.white,
      }}
    >
      {children}
    </Tag>
  );
}

function Eyebrow({
  children,
  tone = C.amber,
  Icon,
}: {
  children: React.ReactNode;
  tone?: string;
  Icon?: LucideIcon;
}) {
  return (
    <p
      className="flex items-center gap-2 text-[10.5px] font-bold uppercase leading-none tracking-[0.34em]"
      style={{ color: tone, ...bodyF }}
    >
      {Icon ? (
        <Icon size={12} aria-hidden="true" />
      ) : (
        <span
          aria-hidden="true"
          className="inline-block h-[1px] w-6"
          style={{ background: tone }}
        />
      )}
      {children}
    </p>
  );
}

function Chip({
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
      className="inline-flex items-center gap-1.5 rounded-md px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.06em]"
      style={{ color: ink, background: wash, border: `1px solid ${tone}`, ...bodyF }}
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
      className={`group inline-flex items-center justify-center gap-2 rounded-md px-5 py-2.5 text-[12px] font-bold uppercase tracking-[0.12em] transition-all duration-200 hover:brightness-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#f4c069] focus-visible:ring-offset-2 focus-visible:ring-offset-[#0b0c0e] active:translate-y-px motion-reduce:transition-none ${className}`}
      style={{
        color: C.abyss,
        background: `linear-gradient(160deg, ${C.amberHi}, ${C.amber})`,
        boxShadow: `0 2px 0 ${C.amberDeep}, 0 12px 26px rgba(232,163,61,0.22)`,
        ...bodyF,
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
      className={`inline-flex items-center justify-center gap-2 rounded-md px-4 py-2.5 text-[12px] font-semibold uppercase tracking-[0.1em] transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#e8a33d] focus-visible:ring-offset-2 focus-visible:ring-offset-[#0b0c0e] motion-reduce:transition-none ${className}`}
      style={{
        color: active ? C.abyss : C.mist,
        background: active ? C.amber : "transparent",
        border: `1px solid ${active ? C.amber : C.line}`,
        ...bodyF,
      }}
    >
      {children}
    </button>
  );
}

// — Sparkline als canyon-profiel: hoekige lijn met amber-eindpunt —
function RidgeLine({ data, tone, id }: { data: number[]; tone: string; id: string }) {
  const max = Math.max(...data);
  const min = Math.min(...data);
  const span = max - min || 1;
  const w = 120;
  const h = 30;
  const pts = data.map((d, i) => {
    const x = (i / (data.length - 1)) * w;
    const y = h - ((d - min) / span) * (h - 7) - 3.5;
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
        <linearGradient id={`ridge-${id}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={tone} stopOpacity="0.28" />
          <stop offset="100%" stopColor={tone} stopOpacity="0" />
        </linearGradient>
      </defs>
      <polygon points={`0,${h} ${line} ${w},${h}`} fill={`url(#ridge-${id})`} />
      <polyline
        points={line}
        fill="none"
        stroke={tone}
        strokeWidth="1.5"
        strokeLinecap="square"
        strokeLinejoin="miter"
      />
      <rect x={last[0] - 1.6} y={last[1] - 1.6} width="3.2" height="3.2" fill={tone} />
    </svg>
  );
}

function MatchMeter({ value }: { value: number }) {
  const tone = value >= 90 ? C.amber : value >= 85 ? C.info : C.mute;
  return (
    <span className="hidden items-center gap-2 sm:flex" aria-hidden="true">
      <span
        className="relative h-1 w-20 overflow-hidden"
        style={{ background: "rgba(238,241,245,0.1)" }}
      >
        <span className="block h-full" style={{ width: `${value}%`, background: tone }} />
      </span>
      <span className="text-[12.5px] font-bold" style={{ color: tone, ...num }}>
        {value}%
      </span>
    </span>
  );
}

export function Concept411() {
  const [screen, setScreen] = useState<ScreenKey>("dashboard");
  const active = OPDRACHTEN[0] as Opdracht;

  return (
    <div
      className="relative min-h-[720px] w-full overflow-hidden antialiased"
      style={{
        ...bodyF,
        color: C.white,
        background: `linear-gradient(180deg, ${C.abyss} 0%, ${C.bg} 30%, ${C.strata0} 100%)`,
      }}
    >
      {/* Verticale lichtschacht langs de linker content-kolom */}
      <div
        className="pointer-events-none absolute inset-y-0 left-1/2 hidden w-[560px] -translate-x-[62%] lg:block"
        aria-hidden="true"
        style={{
          background:
            "radial-gradient(38% 60% at 20% 32%, rgba(232,163,61,0.16) 0%, rgba(232,163,61,0.05) 42%, transparent 74%)",
        }}
      />
      <div
        className="pointer-events-none absolute inset-y-0 left-0 hidden w-[3px] lg:block"
        aria-hidden="true"
        style={{
          background:
            "linear-gradient(180deg, transparent, rgba(232,163,61,0.5) 30%, rgba(232,163,61,0.5) 70%, transparent)",
        }}
      />

      <div className="relative mx-auto max-w-6xl px-4 pb-24 sm:px-6 md:px-8">
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
          className="inline-flex h-11 w-11 items-center justify-center rounded-md"
          style={{ background: C.strata1, border: `1px solid ${C.amberLine}`, color: C.amber }}
          aria-hidden="true"
        >
          <Mountain size={19} />
        </span>
        <div>
          <p
            className="text-[22px] font-bold uppercase leading-none tracking-[0.14em]"
            style={{ color: C.white, ...display }}
          >
            Ravijn
          </p>
          <p
            className="mt-1.5 text-[10px] uppercase leading-none tracking-[0.24em]"
            style={{ color: C.faint, ...bodyF }}
          >
            {PROFIEL.plaats} · in de lichtschacht
          </p>
        </div>
      </div>
      <div className="flex items-center gap-3">
        <span
          className="hidden items-center gap-1.5 rounded-md px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.1em] sm:inline-flex"
          style={{ color: C.okInk, border: `1px solid ${C.ok}`, background: C.okWash, ...bodyF }}
        >
          <ShieldCheck size={12} aria-hidden="true" />
          {PROFIEL.trust}
        </span>
        <span
          className="relative inline-flex h-10 w-10 items-center justify-center rounded-md"
          style={{ background: C.strata1, border: `1px solid ${C.line}`, color: C.mute }}
          aria-label={`${ongelezen} ongelezen berichten`}
        >
          <Bell size={16} aria-hidden="true" />
          {ongelezen > 0 && (
            <span
              className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-sm text-[9px] font-bold"
              style={{ background: C.amber, color: C.abyss, ...num }}
              aria-hidden="true"
            >
              {ongelezen}
            </span>
          )}
        </span>
        <span className="hidden text-right sm:block">
          <span
            className="block text-[13px] font-bold uppercase tracking-[0.08em]"
            style={{ color: C.white, ...display }}
          >
            {PROFIEL.naam}
          </span>
          <span
            className="block text-[10px] uppercase tracking-[0.12em]"
            style={{ color: C.faint, ...bodyF }}
          >
            {PROFIEL.rol}
          </span>
        </span>
        <span
          className="inline-flex h-11 w-11 items-center justify-center rounded-md text-[13px] font-bold"
          style={{
            background: C.strata1,
            border: `1px solid ${C.amberLine}`,
            color: C.amber,
            ...bodyF,
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
    <nav aria-label="Hoofdnavigatie" className="mt-6">
      <div
        className="flex items-center gap-1 overflow-x-auto rounded-md p-1"
        style={{ background: C.strata1, border: `1px solid ${C.line}` }}
      >
        {SCREENS.map((s) => {
          const on = s.key === screen;
          return (
            <button
              key={s.key}
              type="button"
              onClick={() => setScreen(s.key)}
              aria-current={on ? "page" : undefined}
              className="relative flex shrink-0 items-center gap-2 rounded px-4 py-2 text-[11px] font-bold uppercase tracking-[0.12em] transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#e8a33d] focus-visible:ring-offset-2 focus-visible:ring-offset-[#101216] motion-reduce:transition-none"
              style={{
                color: on ? C.abyss : C.mute,
                background: on ? C.amber : "transparent",
                ...bodyF,
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
    <div className="space-y-5">
      <section className="grid grid-cols-1 gap-5 lg:grid-cols-[1.4fr_1fr]">
        <Slab className="p-6 md:p-8" lit>
          <Eyebrow Icon={Sun}>Vandaag · in het licht</Eyebrow>
          <h1
            className="mt-5 text-[46px] font-bold uppercase leading-[0.92] tracking-[0.01em] md:text-[64px]"
            style={{ color: C.white, ...display }}
          >
            Goede-
            <br />
            morgen,
            <span style={{ color: C.amber }}> {PROFIEL.naam.split(" ")[0]}</span>
          </h1>
          <p className="mt-4 max-w-md text-[13.5px] leading-relaxed" style={{ color: C.mute }}>
            Wat telt ligt in de lichtschacht; de rest rust in de schaduw van het ravijn. Werk van
            boven naar beneden — laag voor laag — en houd je praktijk verifieerbaar en betaald.
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
            <GhostButton onClick={onOpen}>Naar de marktplaats</GhostButton>
          </div>
        </Slab>

        <Slab className="p-6">
          <div className="flex items-center justify-between">
            <Eyebrow tone={C.warnInk} Icon={AlertTriangle}>
              Vraagt aandacht
            </Eyebrow>
            <Compass size={20} aria-hidden="true" style={{ color: C.amberDeep }} />
          </div>
          <h2
            className="mt-5 text-[26px] font-bold uppercase leading-[0.98] tracking-[0.01em]"
            style={{ color: C.white, ...display }}
          >
            {primair.titel}
          </h2>
          <p className="mt-2.5 text-[13px] leading-relaxed" style={{ color: C.mute }}>
            {primair.detail}
          </p>
          <div className="mt-5">
            <PrimaryButton onClick={onActies} className="w-full">
              {primair.cta}
              <ArrowRight size={14} aria-hidden="true" />
            </PrimaryButton>
          </div>
          <div className="mt-4 pt-3" style={{ borderTop: `1px solid ${C.lineSoft}` }}>
            <p
              className="text-[11px] uppercase tracking-[0.1em]"
              style={{ color: C.faint, ...num }}
            >
              {verified}/{CREDENTIALS.length} certificaten geverifieerd · 7 open reacties
            </p>
          </div>
        </Slab>
      </section>

      <section>
        <div className="mb-3">
          <Eyebrow Icon={Layers}>Het profiel · deze maand</Eyebrow>
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {KPIS.map((k, i) => (
            <Slab key={k.label} className="p-4">
              <div className="flex items-start justify-between gap-2">
                <p
                  className="text-[9.5px] font-bold uppercase tracking-[0.16em]"
                  style={{ color: C.mute, ...bodyF }}
                >
                  {k.label}
                </p>
                <span
                  className="inline-flex items-center gap-0.5 rounded-sm px-1.5 py-0.5 text-[9.5px] font-bold"
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
                className="mt-2.5 text-[30px] font-bold leading-none tracking-[-0.01em]"
                style={{ color: C.white, ...num }}
              >
                {k.value}
              </p>
              <div className="mt-3">
                <RidgeLine data={k.spark} tone={k.up ? C.amber : C.warn} id={`kpi-${i}`} />
              </div>
            </Slab>
          ))}
        </div>
      </section>

      <section className="grid grid-cols-1 gap-5 lg:grid-cols-[1.4fr_1fr]">
        <div>
          <div className="mb-3 flex items-baseline justify-between">
            <Eyebrow Icon={Compass}>De vindplaats · open opdrachten</Eyebrow>
            <button
              type="button"
              onClick={onOpen}
              className="rounded text-[10px] font-bold uppercase tracking-[0.16em] transition-colors hover:brightness-125 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#e8a33d] focus-visible:ring-offset-2 focus-visible:ring-offset-[#0b0c0e]"
              style={{ color: C.amber, ...bodyF }}
            >
              Alle lagen →
            </button>
          </div>
          <Slab>
            <ul>
              {OPDRACHTEN.map((o, i) => (
                <li key={o.id} style={{ borderTop: i === 0 ? "none" : `1px solid ${C.lineSoft}` }}>
                  <button
                    type="button"
                    onClick={onOpen}
                    className="group grid w-full grid-cols-[auto_1fr_auto] items-center gap-3.5 px-4 py-3.5 text-left transition-colors hover:bg-[#1b1f26] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#e8a33d] motion-reduce:transition-none"
                  >
                    <span
                      className="inline-flex h-10 w-10 items-center justify-center rounded-md"
                      style={{
                        background: C.strata1,
                        border: `1px solid ${i === 0 ? C.amberLine : C.line}`,
                      }}
                    >
                      <span
                        className="text-[12px] font-bold leading-none"
                        style={{ color: i === 0 ? C.amberHi : C.mute, ...num }}
                      >
                        {o.match}
                      </span>
                    </span>
                    <span className="min-w-0">
                      <span
                        className="block truncate text-[15px] font-bold uppercase tracking-[0.02em]"
                        style={{ color: C.white, ...display }}
                      >
                        {o.titel}
                      </span>
                      <span
                        className="mt-0.5 block truncate text-[11.5px]"
                        style={{ color: C.mute }}
                      >
                        {o.opdrachtgever} · {o.plaats} · {o.tarief}
                      </span>
                    </span>
                    <span className="flex items-center gap-3">
                      <MatchMeter value={o.match} />
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
          </Slab>
        </div>

        <div>
          <div className="mb-3">
            <Eyebrow Icon={ShieldCheck}>Certificaten</Eyebrow>
          </div>
          <Slab className="p-4">
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
                      className="inline-flex h-8 w-8 items-center justify-center rounded-md"
                      style={{ color: st.ink, background: st.wash, border: `1px solid ${st.tone}` }}
                      aria-hidden="true"
                    >
                      <st.Icon size={14} />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span
                        className="block truncate text-[12.5px] font-semibold"
                        style={{ color: C.white }}
                      >
                        {c.naam}
                      </span>
                      <span className="block truncate text-[10.5px]" style={{ color: C.mute }}>
                        {st.label}
                      </span>
                    </span>
                  </li>
                );
              })}
            </ul>
          </Slab>
        </div>
      </section>
    </div>
  );
}

function Marktplaats({ onOpen }: { onOpen: () => void }) {
  const [q, setQ] = useState("");
  const [sort, setSort] = useState<"match" | "tarief">("match");
  const [laden, setLaden] = useState(false);

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
        <Eyebrow Icon={Compass}>De vindplaats · open opdrachten</Eyebrow>
        <h1
          className="mt-3 text-[40px] font-bold uppercase leading-[0.9] tracking-[0.01em] md:text-[52px]"
          style={{ color: C.white, ...display }}
        >
          Marktplaats
        </h1>
        <p
          className="mt-2 text-[12px] uppercase tracking-[0.1em]"
          style={{ color: C.mute, ...num }}
        >
          {String(filtered.length).padStart(2, "0")} van{" "}
          {String(OPDRACHTEN.length).padStart(2, "0")} lagen blootgelegd
        </p>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div
          className="flex flex-1 items-center gap-2.5 rounded-md px-4 py-3"
          style={{ background: C.strata1, border: `1px solid ${C.line}` }}
        >
          <Search size={16} aria-hidden="true" style={{ color: C.faint }} />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Zoek op titel, plaats of opdrachtgever…"
            aria-label="Opdrachten zoeken"
            className="w-full bg-transparent text-[13px] outline-none placeholder:text-[#5c626d]"
            style={{ color: C.white, ...bodyF }}
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
              {s === "match" ? "Beste match" : "Tarief"}
            </GhostButton>
          ))}
          <GhostButton onClick={() => setLaden((v) => !v)} ariaPressed={laden} active={laden}>
            {laden ? "Klaar" : "Laden…"}
          </GhostButton>
        </div>
      </div>

      {laden ? (
        <ul className="space-y-4" aria-hidden="true">
          {[0, 1, 2].map((i) => (
            <li key={i}>
              <Slab className="p-5">
                <div className="animate-pulse space-y-3 motion-reduce:animate-none">
                  <div className="h-3 w-24 rounded-sm" style={{ background: C.riseHi }} />
                  <div className="h-5 w-2/3 rounded-sm" style={{ background: C.riseHi }} />
                  <div className="h-3 w-1/2 rounded-sm" style={{ background: C.rise }} />
                  <div className="flex gap-2">
                    <div className="h-6 w-16 rounded-sm" style={{ background: C.rise }} />
                    <div className="h-6 w-16 rounded-sm" style={{ background: C.rise }} />
                  </div>
                </div>
              </Slab>
            </li>
          ))}
        </ul>
      ) : filtered.length === 0 ? (
        <Slab className="p-6" lit>
          <div className="flex flex-col items-center px-6 py-14 text-center">
            <span
              className="inline-flex h-16 w-16 items-center justify-center rounded-md"
              style={{
                background: C.amberWash,
                border: `1px solid ${C.amberLine}`,
                color: C.amber,
              }}
              aria-hidden="true"
            >
              <Layers size={26} />
            </span>
            <p
              className="mt-5 text-[26px] font-bold uppercase tracking-[0.02em]"
              style={{ color: C.white, ...display }}
            >
              Kale wand
            </p>
            <p className="mx-auto mt-2 max-w-xs text-[13px]" style={{ color: C.mute }}>
              Geen laag past bij {q ? `“${q}”` : "je zoekterm"}. Verruim de zoekterm om meer bloot
              te leggen.
            </p>
            <div className="mt-6">
              <PrimaryButton onClick={() => setQ("")}>
                Zoekterm wissen <ArrowRight size={14} aria-hidden="true" />
              </PrimaryButton>
            </div>
          </div>
        </Slab>
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
  const tone = strong ? C.amber : C.info;
  const toneInk = strong ? C.amberHi : C.infoInk;
  return (
    <Slab className="p-5" lit={strong}>
      <div className="grid grid-cols-[1fr_auto] items-start gap-4">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span
              className="inline-flex items-center rounded-sm px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.1em]"
              style={{ color: C.mute, border: `1px solid ${C.line}`, ...num }}
            >
              Laag {String(index + 1).padStart(2, "0")}
            </span>
            <span
              className="text-[11px] font-semibold uppercase tracking-[0.08em]"
              style={{ color: C.mute, ...num }}
            >
              {opdracht.id}
            </span>
          </div>
          <h3
            className="mt-2 text-[22px] font-bold uppercase leading-[0.98] tracking-[0.01em]"
            style={{ color: C.white, ...display }}
          >
            {opdracht.titel}
          </h3>
          <p className="mt-1 text-[12px]" style={{ color: C.mute }}>
            {opdracht.opdrachtgever} · {opdracht.plaats} · {opdracht.uren}
          </p>
          <div className="mt-3 flex flex-wrap gap-1.5">
            {opdracht.tags.map((t) => (
              <span
                key={t}
                className="inline-flex items-center rounded-sm px-2.5 py-0.5 text-[10.5px] font-semibold"
                style={{
                  color: C.mist,
                  background: C.riseHi,
                  border: `1px solid ${C.lineSoft}`,
                  ...bodyF,
                }}
              >
                {t}
              </span>
            ))}
          </div>
        </div>
        <div className="flex flex-col items-center gap-1.5">
          <span
            className="inline-flex h-14 w-14 flex-col items-center justify-center rounded-md"
            style={{ background: C.strata1, border: `1.5px solid ${tone}` }}
          >
            <span className="text-[16px] font-bold leading-none" style={{ color: toneInk, ...num }}>
              {opdracht.match}
            </span>
            <span
              className="mt-0.5 text-[7.5px] uppercase tracking-[0.14em]"
              style={{ color: C.faint, ...bodyF }}
            >
              match
            </span>
          </span>
          <span className="text-[13px] font-bold" style={{ color: toneInk, ...num }}>
            {opdracht.tarief}
          </span>
        </div>
      </div>
      <div className="mt-4 flex items-center gap-3">
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          className="inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-[10.5px] font-bold uppercase tracking-[0.1em] transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#e8a33d] focus-visible:ring-offset-2 focus-visible:ring-offset-[#15181d]"
          style={{ color: C.amberHi, border: `1px solid ${C.line}`, ...bodyF }}
        >
          {open ? <Minus size={12} aria-hidden="true" /> : <Plus size={12} aria-hidden="true" />}
          Waarom deze match
        </button>
        <div className="ml-auto">
          <PrimaryButton onClick={onOpen}>
            Reageer <ArrowRight size={13} aria-hidden="true" />
          </PrimaryButton>
        </div>
      </div>
      <div
        className="grid transition-all duration-300 motion-reduce:transition-none"
        style={{ gridTemplateRows: open ? "1fr" : "0fr" }}
      >
        <div className="overflow-hidden">
          <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
            <RedenBlok
              titel="In je voordeel"
              tone={C.okInk}
              Icon={Check}
              items={opdracht.redenen.plus}
            />
            <RedenBlok
              titel="Let op"
              tone={C.warnInk}
              Icon={AlertTriangle}
              items={opdracht.redenen.min}
            />
          </div>
        </div>
      </div>
    </Slab>
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
      className="rounded-md p-4"
      style={{ background: C.strata1, border: `1px solid ${C.lineSoft}` }}
    >
      <p
        className="text-[9.5px] font-bold uppercase tracking-[0.18em]"
        style={{ color: tone, ...bodyF }}
      >
        {titel}
      </p>
      <ul className="mt-2.5 space-y-2">
        {items.map((r) => (
          <li key={r} className="flex items-start gap-2 text-[12.5px]" style={{ color: C.mist }}>
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
  const tone = strong ? C.amber : C.info;
  return (
    <div className="space-y-6">
      <button
        type="button"
        onClick={onBack}
        className="inline-flex items-center gap-2 rounded-md px-4 py-2 text-[11px] font-bold uppercase tracking-[0.1em] transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#e8a33d] focus-visible:ring-offset-2 focus-visible:ring-offset-[#0b0c0e]"
        style={{ color: C.mist, border: `1px solid ${C.line}`, ...bodyF }}
      >
        <ArrowLeft size={13} aria-hidden="true" /> Terug naar de marktplaats
      </button>

      <Slab className="p-6 md:p-8" lit>
        <div className="flex flex-wrap items-center gap-2">
          <span
            className="inline-flex items-center rounded-sm px-2.5 py-0.5 text-[10.5px] font-semibold uppercase tracking-[0.08em]"
            style={{ color: C.mute, border: `1px solid ${C.line}`, ...num }}
          >
            {opdracht.id}
          </span>
          <span
            className="inline-flex items-center gap-1 rounded-sm px-2.5 py-0.5 text-[10.5px] font-bold uppercase tracking-[0.08em]"
            style={{ color: C.abyss, background: tone, ...bodyF }}
          >
            <Sun size={11} aria-hidden="true" /> {strong ? "Verlicht" : "Uitgelicht"} ·{" "}
            {opdracht.match}%
          </span>
        </div>
        <h1
          className="mt-4 max-w-2xl text-[40px] font-bold uppercase leading-[0.92] tracking-[0.01em] md:text-[58px]"
          style={{ color: C.white, ...display }}
        >
          {opdracht.titel}
        </h1>
        <p className="mt-2 text-[14px]" style={{ color: C.mute }}>
          {opdracht.opdrachtgever} · {opdracht.plaats}
        </p>
        <div className="mt-5 flex flex-wrap gap-2.5">
          <PrimaryButton>
            Reageer op opdracht <ArrowRight size={14} aria-hidden="true" />
          </PrimaryButton>
          <GhostButton>Bewaren</GhostButton>
        </div>
      </Slab>

      <Slab>
        <div className="grid grid-cols-2 md:grid-cols-4">
          {[
            { l: "Tarief", v: opdracht.tarief },
            { l: "Omvang", v: opdracht.uren },
            { l: "Start", v: opdracht.start },
            { l: "Match", v: `${opdracht.match}%` },
          ].map((m, i) => (
            <div
              key={m.l}
              className="p-4"
              style={{
                borderLeft: i % 4 === 0 ? "none" : `1px solid ${C.lineSoft}`,
                borderTop: i >= 2 ? `1px solid ${C.lineSoft}` : "none",
              }}
            >
              <p
                className="text-[9px] font-bold uppercase tracking-[0.18em]"
                style={{ color: C.mute, ...bodyF }}
              >
                {m.l}
              </p>
              <p
                className="mt-1.5 text-[19px] font-bold tracking-[-0.01em]"
                style={{ color: C.white, ...num }}
              >
                {m.v}
              </p>
            </div>
          ))}
        </div>
      </Slab>

      <section>
        <Eyebrow Icon={Compass}>Waarom deze match</Eyebrow>
        <p className="mt-3 max-w-xl text-[13.5px] leading-relaxed" style={{ color: C.mute }}>
          Transparant afgelezen van je geverifieerde profiel — wat in je voordeel telt én waar je op
          moet letten, laag voor laag, zonder verborgen score.
        </p>
        <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-2">
          <Slab className="p-5">
            <div className="flex items-center gap-2">
              <span
                className="inline-flex h-8 w-8 items-center justify-center rounded-md"
                style={{ color: C.okInk, background: C.okWash, border: `1px solid ${C.ok}` }}
                aria-hidden="true"
              >
                <Check size={15} />
              </span>
              <p
                className="text-[10.5px] font-bold uppercase tracking-[0.16em]"
                style={{ color: C.okInk, ...bodyF }}
              >
                In je voordeel
              </p>
            </div>
            <ul className="mt-4 space-y-3">
              {opdracht.redenen.plus.map((r) => (
                <li
                  key={r}
                  className="flex items-start gap-3 text-[13.5px]"
                  style={{ color: C.mist }}
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
          </Slab>
          <Slab className="p-5">
            <div className="flex items-center gap-2">
              <span
                className="inline-flex h-8 w-8 items-center justify-center rounded-md"
                style={{ color: C.warnInk, background: C.warnWash, border: `1px solid ${C.warn}` }}
                aria-hidden="true"
              >
                <AlertTriangle size={14} />
              </span>
              <p
                className="text-[10.5px] font-bold uppercase tracking-[0.16em]"
                style={{ color: C.warnInk, ...bodyF }}
              >
                Let op
              </p>
            </div>
            <ul className="mt-4 space-y-3">
              {opdracht.redenen.min.map((r) => (
                <li
                  key={r}
                  className="flex items-start gap-3 text-[13.5px]"
                  style={{ color: C.mist }}
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
          </Slab>
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
      <Slab className="p-6 md:p-8" lit>
        <div className="flex flex-wrap items-center justify-between gap-6">
          <div className="max-w-md">
            <Eyebrow Icon={ShieldCheck}>Verificatie · de kern belicht</Eyebrow>
            <h1
              className="mt-3 text-[34px] font-bold uppercase leading-[0.94] tracking-[0.01em] md:text-[44px]"
              style={{ color: C.white, ...display }}
            >
              Jouw certificaten
            </h1>
            <p className="mt-3 text-[13.5px] leading-relaxed" style={{ color: C.mute }}>
              <span className="font-semibold" style={{ color: C.white }}>
                {PROFIEL.trust}.
              </span>{" "}
              {verified} van {CREDENTIALS.length} certificaten staan in het licht, geverifieerd. Eén
              verloopt binnenkort en vraagt om vernieuwing.
            </p>
          </div>
          <span
            className="inline-flex h-24 w-24 flex-col items-center justify-center rounded-lg"
            style={{ background: C.strata1, border: `1.5px solid ${C.amberLine}` }}
          >
            <span
              className="text-[28px] font-bold leading-none"
              style={{ color: C.amberHi, ...num }}
            >
              {ratio}
            </span>
            <span
              className="mt-1 text-[8px] font-bold uppercase tracking-[0.16em]"
              style={{ color: C.faint, ...bodyF }}
            >
              % belicht
            </span>
          </span>
        </div>
      </Slab>

      <Slab>
        <div
          className="hidden grid-cols-[1fr_11rem_2.5rem] items-center gap-4 px-5 py-3 sm:grid"
          style={{ borderBottom: `1px solid ${C.lineSoft}` }}
        >
          {["Certificaat", "Status", ""].map((h, i) => (
            <span
              key={h || i}
              className="text-[9px] font-bold uppercase tracking-[0.2em]"
              style={{ color: C.mute, ...bodyF }}
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
                  className="grid w-full grid-cols-[1fr_auto] items-center gap-4 px-5 py-4 text-left transition-colors hover:bg-[#1b1f26] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#e8a33d] motion-reduce:transition-none sm:grid-cols-[1fr_11rem_2.5rem]"
                >
                  <span className="flex min-w-0 items-center gap-3">
                    <span
                      className="inline-flex h-9 w-9 items-center justify-center rounded-md"
                      style={{ color: st.ink, background: st.wash, border: `1px solid ${st.tone}` }}
                      aria-hidden="true"
                    >
                      <st.Icon size={16} />
                    </span>
                    <span className="min-w-0">
                      <span
                        className="block truncate text-[15px] font-bold uppercase tracking-[0.01em]"
                        style={{ color: C.white, ...display }}
                      >
                        {c.naam}
                      </span>
                      <span
                        className="mt-0.5 block truncate text-[11.5px]"
                        style={{ color: C.mute }}
                      >
                        {c.detail}
                      </span>
                    </span>
                  </span>
                  <span className="hidden sm:flex">
                    <Chip tone={st.tone} ink={st.ink} wash={st.wash} alarm={st.alarm}>
                      <st.Icon size={11} aria-hidden="true" />
                      {st.label}
                    </Chip>
                  </span>
                  <span
                    className="hidden justify-self-end transition-transform motion-reduce:transition-none sm:block"
                    style={{ color: C.faint, transform: isOpen ? "rotate(45deg)" : "rotate(0deg)" }}
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
                        className="rounded-md p-4"
                        style={{ background: C.strata1, border: `1px solid ${C.lineSoft}` }}
                      >
                        <p
                          className="max-w-xl text-[13px] leading-relaxed"
                          style={{ color: C.mist }}
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
      </Slab>
    </div>
  );
}

function Acties() {
  return (
    <div className="space-y-6">
      <div>
        <Eyebrow Icon={Compass}>Acties · de volgende laag</Eyebrow>
        <h1
          className="mt-3 text-[40px] font-bold uppercase leading-[0.9] tracking-[0.01em] md:text-[52px]"
          style={{ color: C.white, ...display }}
        >
          Wat nu telt
        </h1>
        <p className="mt-2 max-w-md text-[13px]" style={{ color: C.mute }}>
          Op volgorde van urgentie — werk van boven naar beneden om verifieerbaar en betaald te
          blijven.
        </p>
      </div>

      <ol className="space-y-3">
        {ACTIES.map((a, i) => {
          const warn = a.urgentie === "warning";
          const tone = warn ? C.warn : C.amber;
          const ink = warn ? C.warnInk : C.amberHi;
          const wash = warn ? C.warnWash : C.amberWash;
          return (
            <li key={a.titel}>
              <Slab className="p-5" lit={warn}>
                <div className="grid grid-cols-[auto_1fr] items-start gap-4 sm:grid-cols-[auto_1fr_auto]">
                  <span
                    className="flex h-12 w-12 items-center justify-center rounded-md text-[16px] font-bold"
                    style={{
                      background: C.strata1,
                      border: `1.5px solid ${tone}`,
                      color: ink,
                      ...num,
                    }}
                    aria-hidden="true"
                  >
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <div className="min-w-0">
                    <span
                      className="inline-flex items-center gap-1 rounded-sm px-2 py-0.5 text-[9px] font-bold uppercase tracking-[0.14em]"
                      style={{
                        color: ink,
                        background: wash,
                        border: `1px solid ${tone}`,
                        ...bodyF,
                      }}
                    >
                      {warn ? (
                        <AlertTriangle size={10} aria-hidden="true" />
                      ) : (
                        <Sun size={10} aria-hidden="true" />
                      )}
                      {warn ? "Urgent" : "Aanbevolen"}
                    </span>
                    <h2
                      className="mt-2 text-[21px] font-bold uppercase leading-[0.98] tracking-[0.01em]"
                      style={{ color: C.white, ...display }}
                    >
                      {a.titel}
                    </h2>
                    <p
                      className="mt-1.5 max-w-lg text-[13px] leading-relaxed"
                      style={{ color: C.mute }}
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
              </Slab>
            </li>
          );
        })}
      </ol>

      <Slab className="p-5">
        <Eyebrow Icon={Send}>Recente berichten</Eyebrow>
        <ul className="mt-3 space-y-1">
          {BERICHTEN.map((b, i) => (
            <li
              key={b.van}
              className="flex items-center gap-3 py-2.5"
              style={{ borderTop: i === 0 ? "none" : `1px solid ${C.lineSoft}` }}
            >
              <span
                className="inline-flex h-9 w-9 items-center justify-center rounded-md text-[11px] font-bold"
                style={{
                  background: C.strata1,
                  border: `1px solid ${C.line}`,
                  color: C.mist,
                  ...bodyF,
                }}
                aria-hidden="true"
              >
                {b.initialen}
              </span>
              <span className="min-w-0 flex-1">
                <span className="flex items-center gap-2">
                  <span className="truncate text-[13px] font-semibold" style={{ color: C.white }}>
                    {b.van}
                  </span>
                  {b.ongelezen && (
                    <span
                      className="inline-block h-1.5 w-1.5 rounded-full"
                      style={{ background: C.amber }}
                      aria-label="ongelezen"
                    />
                  )}
                </span>
                <span className="mt-0.5 block truncate text-[11.5px]" style={{ color: C.mute }}>
                  {b.preview}
                </span>
              </span>
              <span
                className="text-[10.5px] uppercase tracking-[0.08em]"
                style={{ color: C.faint, ...num }}
              >
                {b.tijd}
              </span>
            </li>
          ))}
        </ul>
      </Slab>
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
  return { ink: C.mute, wash: C.riseHi, tone: C.line, Icon: FileText };
}

function Facturen() {
  const totaalBetaald = "€ 8.622";
  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <Eyebrow Icon={FileText}>Facturen · de afzetting</Eyebrow>
          <h1
            className="mt-3 text-[40px] font-bold uppercase leading-[0.9] tracking-[0.01em] md:text-[52px]"
            style={{ color: C.white, ...display }}
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
          { l: "Betaald (mnd)", v: totaalBetaald, sub: "3 voldaan", alarm: false },
          { l: "Openstaand", v: "€ 1.350", sub: "1 factuur · 9 dagen", alarm: true },
          { l: "Concept", v: "€ 880", sub: "klaar om te versturen", alarm: false },
        ].map((s) => (
          <Slab key={s.l} className="p-5" lit={s.alarm}>
            <div className="flex items-center justify-between">
              <p
                className="text-[9.5px] font-bold uppercase tracking-[0.16em]"
                style={{ color: C.mute, ...bodyF }}
              >
                {s.l}
              </p>
              {s.alarm && (
                <span
                  className="inline-flex h-6 w-6 items-center justify-center rounded-md"
                  style={{ background: C.warnWash, color: C.warnInk }}
                  aria-hidden="true"
                >
                  <AlertTriangle size={13} />
                </span>
              )}
            </div>
            <p
              className="mt-2 text-[30px] font-bold tracking-[-0.01em]"
              style={{ color: s.alarm ? C.warnInk : C.white, ...num }}
            >
              {s.v}
            </p>
            <p className="mt-1 text-[11.5px]" style={{ color: C.mute }}>
              {s.sub}
            </p>
          </Slab>
        ))}
      </section>

      <Slab>
        <div
          className="hidden grid-cols-[8rem_1fr_5rem_9rem_6rem] gap-4 px-5 pb-3 pt-4 sm:grid"
          style={{ borderBottom: `1px solid ${C.lineSoft}` }}
        >
          {["Nummer", "Klant", "Datum", "Status", "Bedrag"].map((h, i) => (
            <span
              key={h}
              className={`text-[9px] font-bold uppercase tracking-[0.18em] ${i === 4 ? "text-right" : ""}`}
              style={{ color: C.mute, ...bodyF }}
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
                className="grid grid-cols-[1fr_auto] items-center gap-3 px-5 py-3.5 transition-colors hover:bg-[#1b1f26] sm:grid-cols-[8rem_1fr_5rem_9rem_6rem] sm:gap-4"
                style={{ borderTop: i === 0 ? "none" : `1px solid ${C.lineSoft}` }}
              >
                <span
                  className="order-1 text-[11.5px] font-semibold uppercase tracking-[0.06em]"
                  style={{ color: C.mute, ...num }}
                >
                  {f.nr}
                </span>
                <span
                  className="order-3 min-w-0 truncate text-[14px] font-bold uppercase tracking-[0.01em] sm:order-2"
                  style={{ color: C.white, ...display }}
                >
                  {f.klant}
                </span>
                <span
                  className="order-4 hidden text-[11.5px] sm:order-3 sm:inline"
                  style={{ color: C.mute, ...num }}
                >
                  {f.datum}
                </span>
                <span className="order-5 sm:order-4">
                  <span
                    className="inline-flex items-center gap-1.5 rounded-md px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.06em]"
                    style={{
                      color: ft.ink,
                      background: ft.wash,
                      border: `1px solid ${ft.tone}`,
                      ...bodyF,
                    }}
                  >
                    {ft.Icon && <ft.Icon size={11} aria-hidden="true" />}
                    {f.status}
                  </span>
                </span>
                <span
                  className="order-2 text-right text-[14px] font-bold sm:order-5"
                  style={{ color: acc ? C.warnInk : C.white, ...num }}
                >
                  {f.bedrag}
                </span>
              </li>
            );
          })}
        </ul>
        <div
          className="flex items-baseline justify-between px-5 py-4"
          style={{ borderTop: `1px solid ${C.lineSoft}` }}
        >
          <span
            className="flex items-center gap-2 text-[9.5px] font-bold uppercase tracking-[0.2em]"
            style={{ color: C.mute, ...bodyF }}
          >
            <Layers size={12} aria-hidden="true" style={{ color: C.amber }} /> Totaal betaald
          </span>
          <span className="text-[22px] font-bold" style={{ color: C.white, ...num }}>
            {totaalBetaald}
          </span>
        </div>
      </Slab>
    </div>
  );
}
