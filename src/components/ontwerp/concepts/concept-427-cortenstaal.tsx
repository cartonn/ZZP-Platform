"use client";

// Concept 427 — "Cortenstaal & beton" · industrieel-warm, donker.
// Architectonisch-industriële interface: verweerd cortenstaal (roest-oranje/roodbruine verlopen met
// subtiele vlek-textuur) tegen ruw grijs beton. Zware, geankerde panelen met zichtbare "naden" en
// randen als staalplaten, klinknagels in de hoeken. Robuust en premium, geen glans. Accent roest
// #b5551d, donkere beton-basis #1a1613, warme lichte tekst #e7ddd2. Textuur spaarzaam (fijne grain
// via inline SVG), tekst hoog-contrast. Strak-industrieel, niet rommelig; motion-reduce gerespecteerd.

import { useId, useMemo, useState } from "react";
import {
  AlertTriangle,
  ArrowRight,
  Bell,
  Check,
  ChevronRight,
  Clock,
  Download,
  FileText,
  Flame,
  Hammer,
  History,
  Layers,
  Minus,
  Plus,
  RefreshCw,
  Ruler,
  Search,
  ShieldCheck,
  Wind,
  Wrench,
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

// — Palet: donker beton, verweerd cortenstaal, warme roest-accenten —
const C = {
  concrete: "#1a1613",
  concreteHi: "#221d19",
  concreteDeep: "#131010",
  plate: "#241e19",
  plateHi: "#2b2420",
  plateLow: "#1e1915",
  ink: "#e7ddd2",
  inkSoft: "#c3b6a8",
  inkMute: "#8f8377",
  inkFaint: "#6c6259",
  seam: "rgba(231,221,210,0.10)",
  seamSoft: "rgba(231,221,210,0.06)",
  seamHard: "rgba(0,0,0,0.45)",
  rust: "#b5551d",
  rustHi: "#d06a2c",
  rustDeep: "#8f3f12",
  rustWash: "rgba(181,85,29,0.16)",
  rustFilm: "rgba(181,85,29,0.09)",
  ember: "#c98a3a",
  emberInk: "#d9a054",
  ok: "#7f9e6a",
  okInk: "#a6c48c",
  okWash: "rgba(127,158,106,0.15)",
  warn: "#c98a3a",
  warnInk: "#e0a659",
  warnWash: "rgba(201,138,58,0.16)",
  info: "#6f93a0",
  infoInk: "#93b6c2",
  infoWash: "rgba(111,147,160,0.15)",
  bad: "#c26a5c",
  badInk: "#dc8879",
  badWash: "rgba(194,106,92,0.17)",
};

const display = {
  fontFamily: "'Oswald', 'Bebas Neue', 'Arial Narrow', 'Helvetica Neue', Arial, sans-serif",
};
const body = {
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

// — Fijne grain/vlek-textuur als filmlaag over staalplaten; spaarzaam ingezet —
function GrainFilter({ id }: { id: string }) {
  return (
    <svg width="0" height="0" className="absolute" aria-hidden="true">
      <filter id={id}>
        <feTurbulence
          type="fractalNoise"
          baseFrequency="0.9"
          numOctaves="2"
          stitchTiles="stitch"
          result="noise"
        />
        <feColorMatrix in="noise" type="saturate" values="0" />
      </filter>
    </svg>
  );
}

function Grain({ filter, opacity = 0.05 }: { filter: string; opacity?: number }) {
  return (
    <span
      className="pointer-events-none absolute inset-0"
      aria-hidden="true"
      style={{ filter: `url(#${filter})`, opacity, mixBlendMode: "overlay" }}
    />
  );
}

// — Roest-vlek-verloop: onregelmatige, verweerde roest die in het staal trekt —
function RustBloom({ corner = "tr" }: { corner?: "tr" | "bl" }) {
  const pos =
    corner === "tr"
      ? "radial-gradient(120% 100% at 100% 0%, rgba(181,85,29,0.26), rgba(143,63,18,0.10) 38%, transparent 66%)"
      : "radial-gradient(120% 100% at 0% 100%, rgba(181,85,29,0.20), rgba(143,63,18,0.08) 40%, transparent 68%)";
  return (
    <span
      className="pointer-events-none absolute inset-0"
      aria-hidden="true"
      style={{ background: pos }}
    />
  );
}

// — Klinknagels in de hoeken van een staalplaat —
function Rivets() {
  const spots = [
    { top: 9, left: 9 },
    { top: 9, right: 9 },
    { bottom: 9, left: 9 },
    { bottom: 9, right: 9 },
  ];
  return (
    <>
      {spots.map((s, i) => (
        <span
          key={i}
          className="pointer-events-none absolute h-1.5 w-1.5 rounded-full"
          aria-hidden="true"
          style={{
            ...s,
            background:
              "radial-gradient(circle at 35% 30%, rgba(231,221,210,0.55), rgba(20,16,13,0.9) 75%)",
            boxShadow: "inset 0 0 0 0.5px rgba(0,0,0,0.6)",
          }}
        />
      ))}
    </>
  );
}

// — Paneel: staalplaat met naad-rand, harde schaduw-diepte en optionele roest —
function Panel({
  children,
  className = "",
  as: Tag = "div",
  tone = "plate",
  rust = false,
  rivets = false,
  grainId,
}: {
  children: React.ReactNode;
  className?: string;
  as?: "div" | "section" | "li";
  tone?: "plate" | "concrete" | "steel";
  rust?: boolean;
  rivets?: boolean;
  grainId?: string;
}) {
  const bg =
    tone === "concrete"
      ? C.concreteHi
      : tone === "steel"
        ? `linear-gradient(160deg, ${C.plateHi} 0%, ${C.plate} 55%, ${C.plateLow} 100%)`
        : C.plate;
  return (
    <Tag
      className={`relative overflow-hidden ${className}`}
      style={{
        background: bg,
        border: `1px solid ${C.seam}`,
        borderTopColor: "rgba(231,221,210,0.16)",
        borderBottomColor: C.seamHard,
        boxShadow:
          "0 1px 0 rgba(231,221,210,0.05) inset, 0 18px 40px rgba(0,0,0,0.42), 0 2px 6px rgba(0,0,0,0.35)",
        color: C.ink,
      }}
    >
      {rust && <RustBloom />}
      {grainId && <Grain filter={grainId} opacity={0.045} />}
      {rivets && <Rivets />}
      <span className="relative block">{children}</span>
    </Tag>
  );
}

function Eyebrow({ children, tone = C.rustHi }: { children: React.ReactNode; tone?: string }) {
  return (
    <p
      className="flex items-center gap-2.5 text-[10.5px] font-bold uppercase tracking-[0.28em]"
      style={{ color: tone, ...body }}
    >
      <span aria-hidden="true" className="inline-block h-2.5 w-0.5" style={{ background: tone }} />
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
      className="inline-flex items-center gap-1.5 px-2.5 py-1 text-[11px] font-semibold"
      style={{ color: ink, background: wash, border: `1px solid ${tone}`, ...body }}
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
      className={`group inline-flex items-center justify-center gap-2 px-5 py-2.5 text-[12.5px] font-bold uppercase tracking-[0.06em] transition-all duration-200 hover:brightness-[1.08] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#d06a2c] focus-visible:ring-offset-2 focus-visible:ring-offset-[#1a1613] active:translate-y-px motion-reduce:transition-none ${className}`}
      style={{
        color: "#faf3ea",
        background: `linear-gradient(180deg, ${C.rustHi} 0%, ${C.rust} 52%, ${C.rustDeep} 100%)`,
        border: `1px solid ${C.rustDeep}`,
        boxShadow: "0 1px 0 rgba(255,220,180,0.25) inset, 0 8px 18px rgba(143,63,18,0.4)",
        ...body,
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
      className={`inline-flex items-center justify-center gap-2 px-4 py-2.5 text-[12px] font-bold uppercase tracking-[0.05em] transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#d06a2c] focus-visible:ring-offset-2 focus-visible:ring-offset-[#1a1613] motion-reduce:transition-none ${className}`}
      style={{
        color: active ? "#faf3ea" : C.inkSoft,
        background: active ? C.rustWash : C.plateHi,
        border: `1px solid ${active ? C.rust : C.seam}`,
        ...body,
      }}
    >
      {children}
    </button>
  );
}

// — Sparkline als hoekige "meetstrook" met roest-eindpunt —
function SparkBar({ data, tone, id }: { data: number[]; tone: string; id: string }) {
  const max = Math.max(...data);
  const min = Math.min(...data);
  const span = max - min || 1;
  const w = 120;
  const h = 30;
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
        <linearGradient id={`spark-${id}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={tone} stopOpacity="0.32" />
          <stop offset="100%" stopColor={tone} stopOpacity="0" />
        </linearGradient>
      </defs>
      <polygon points={`0,${h} ${line} ${w},${h}`} fill={`url(#spark-${id})`} />
      <polyline
        points={line}
        fill="none"
        stroke={tone}
        strokeWidth="1.8"
        strokeLinecap="square"
        strokeLinejoin="miter"
      />
      <rect x={last[0] - 2} y={last[1] - 2} width="4" height="4" fill={tone} />
    </svg>
  );
}

// — Peil-meter als beton-strook met roest-vulling —
function SteelMeter({ value, tone = C.rust }: { value: number; tone?: string }) {
  return (
    <span className="hidden items-center gap-2.5 sm:flex" aria-hidden="true">
      <span
        className="relative h-2 w-24 overflow-hidden"
        style={{ background: C.concreteDeep, border: `1px solid ${C.seamSoft}` }}
      >
        <span className="block h-full" style={{ width: `${value}%`, background: tone }} />
      </span>
      <span className="text-[12.5px] font-bold" style={{ color: tone, ...num }}>
        {value}%
      </span>
    </span>
  );
}

export function Concept427() {
  const [screen, setScreen] = useState<ScreenKey>("dashboard");
  const grainId = useId().replace(/:/g, "");
  const active = OPDRACHTEN[0] as Opdracht;

  return (
    <div
      className="relative min-h-[720px] w-full antialiased"
      style={{
        ...body,
        color: C.ink,
        background: `linear-gradient(180deg, ${C.concreteDeep} 0%, ${C.concrete} 30%, ${C.concreteHi} 100%)`,
      }}
    >
      <GrainFilter id={grainId} />
      <style>{`
        @keyframes steelRise { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
        .steel-rise { animation: steelRise 0.42s cubic-bezier(0.22, 1, 0.36, 1) both; }
        @media (prefers-reduced-motion: reduce) { .steel-rise { animation: none !important; } }
      `}</style>

      {/* beton-textuur bovenlaag + roest-gloed uit de hoek */}
      <Grain filter={grainId} opacity={0.06} />
      <div
        className="pointer-events-none absolute inset-x-0 top-0 h-64"
        aria-hidden="true"
        style={{
          background: "radial-gradient(90% 100% at 88% 0%, rgba(181,85,29,0.12), transparent 60%)",
        }}
      />

      <div className="relative mx-auto max-w-6xl px-4 pb-24 sm:px-6 md:px-8">
        <TopBar />
        <NavBar screen={screen} setScreen={setScreen} />
        <main key={screen} className="steel-rise pt-7">
          {screen === "dashboard" && (
            <Dashboard
              grainId={grainId}
              onOpen={() => setScreen("opdracht")}
              onActies={() => setScreen("acties")}
            />
          )}
          {screen === "marktplaats" && (
            <Marktplaats grainId={grainId} onOpen={() => setScreen("opdracht")} />
          )}
          {screen === "opdracht" && (
            <OpdrachtDetail
              opdracht={active}
              grainId={grainId}
              onBack={() => setScreen("marktplaats")}
            />
          )}
          {screen === "verificatie" && <Verificatie grainId={grainId} />}
          {screen === "acties" && <Acties grainId={grainId} />}
          {screen === "facturen" && <Facturen grainId={grainId} />}
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
          className="relative inline-flex h-11 w-11 items-center justify-center"
          style={{
            background: `linear-gradient(160deg, ${C.rustHi}, ${C.rustDeep})`,
            border: `1px solid ${C.rustDeep}`,
            color: "#faf3ea",
            boxShadow: "0 6px 16px rgba(143,63,18,0.4)",
          }}
          aria-hidden="true"
        >
          <Hammer size={18} />
        </span>
        <div>
          <p
            className="text-[22px] font-bold uppercase leading-none tracking-[0.14em]"
            style={{ color: C.ink, ...display }}
          >
            Corten
          </p>
          <p
            className="mt-1.5 flex items-center gap-1.5 text-[11px] leading-none"
            style={{ color: C.inkMute, ...body }}
          >
            <Flame size={11} aria-hidden="true" style={{ color: C.rustHi }} />
            {PROFIEL.plaats} · verweerd &amp; robuust
          </p>
        </div>
      </div>
      <div className="flex items-center gap-3">
        <span
          className="hidden items-center gap-1.5 px-3 py-1.5 text-[11px] font-bold uppercase tracking-[0.08em] sm:inline-flex"
          style={{ color: C.okInk, border: `1px solid ${C.ok}`, background: C.okWash, ...body }}
        >
          <ShieldCheck size={12} aria-hidden="true" />
          {PROFIEL.trust}
        </span>
        <span
          className="relative inline-flex h-10 w-10 items-center justify-center"
          style={{ background: C.plateHi, border: `1px solid ${C.seam}`, color: C.inkMute }}
          aria-label={`${ongelezen} ongelezen berichten`}
        >
          <Bell size={16} aria-hidden="true" />
          {ongelezen > 0 && (
            <span
              className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center text-[9px] font-bold"
              style={{ background: C.rust, color: "#faf3ea", ...num }}
              aria-hidden="true"
            >
              {ongelezen}
            </span>
          )}
        </span>
        <span className="hidden text-right sm:block">
          <span className="block text-[14px] font-semibold" style={{ color: C.ink, ...body }}>
            {PROFIEL.naam}
          </span>
          <span className="block text-[11px]" style={{ color: C.inkMute, ...body }}>
            {PROFIEL.rol}
          </span>
        </span>
        <span
          className="inline-flex h-11 w-11 items-center justify-center text-[13px] font-bold"
          style={{
            background: `linear-gradient(160deg, ${C.plateHi}, ${C.plateLow})`,
            border: `1px solid ${C.seam}`,
            color: C.emberInk,
            ...body,
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
        className="flex items-center gap-0 overflow-x-auto"
        style={{
          background: C.concreteDeep,
          border: `1px solid ${C.seam}`,
          boxShadow: "0 2px 8px rgba(0,0,0,0.4) inset",
        }}
      >
        {SCREENS.map((s) => {
          const on = s.key === screen;
          return (
            <button
              key={s.key}
              type="button"
              onClick={() => setScreen(s.key)}
              aria-current={on ? "page" : undefined}
              className="relative flex shrink-0 items-center gap-2 px-4 py-3 text-[12px] font-bold uppercase tracking-[0.09em] transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#d06a2c] motion-reduce:transition-none"
              style={{
                color: on ? "#faf3ea" : C.inkMute,
                background: on ? C.rustWash : "transparent",
                ...body,
              }}
            >
              {on && (
                <span
                  className="absolute inset-x-0 bottom-0 h-0.5"
                  aria-hidden="true"
                  style={{ background: C.rustHi }}
                />
              )}
              {s.label}
            </button>
          );
        })}
      </div>
    </nav>
  );
}

function Dashboard({
  grainId,
  onOpen,
  onActies,
}: {
  grainId: string;
  onOpen: () => void;
  onActies: () => void;
}) {
  const primair = ACTIES[0] as (typeof ACTIES)[number];
  const verified = CREDENTIALS.filter((c) => c.status === "VERIFIED").length;
  return (
    <div className="space-y-7">
      <section className="grid grid-cols-1 gap-5 lg:grid-cols-[1.4fr_1fr]">
        <Panel className="p-7 md:p-9" tone="steel" rust grainId={grainId} rivets>
          <Eyebrow>Werkplaats · vandaag</Eyebrow>
          <div className="mt-4 flex items-start justify-between gap-4">
            <h1
              className="text-[34px] font-bold uppercase leading-[0.98] tracking-[0.01em] md:text-[48px]"
              style={{ color: C.ink, ...display }}
            >
              Goedemorgen,
              <br />
              <span style={{ color: C.rustHi }}>{PROFIEL.naam.split(" ")[0]}.</span>
            </h1>
            <Layers
              size={28}
              aria-hidden="true"
              style={{ color: C.ember }}
              className="hidden sm:block"
            />
          </div>
          <p className="mt-3 max-w-md text-[14px] leading-relaxed" style={{ color: C.inkSoft }}>
            Alles staat gefundeerd en verankerd. Loop je acties langs, houd je certificaten
            geverifieerd en je facturen betaald — gebouwd om te blijven staan.
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
            <GhostButton onClick={onOpen}>Marktplaats</GhostButton>
          </div>
        </Panel>

        <Panel className="p-7" grainId={grainId}>
          <div className="flex items-center justify-between">
            <Eyebrow tone={C.warnInk}>Vraagt aandacht</Eyebrow>
            <Flame size={18} aria-hidden="true" style={{ color: C.rust }} />
          </div>
          <h2 className="mt-4 text-[21px] font-bold leading-snug" style={{ color: C.ink, ...body }}>
            {primair.titel}
          </h2>
          <p className="mt-2 text-[13.5px] leading-relaxed" style={{ color: C.inkSoft }}>
            {primair.detail}
          </p>
          <div className="mt-6">
            <PrimaryButton onClick={onActies} className="w-full">
              {primair.cta}
              <ArrowRight size={14} aria-hidden="true" />
            </PrimaryButton>
          </div>
          <div className="mt-5 pt-4" style={{ borderTop: `1px solid ${C.seamSoft}` }}>
            <p className="flex items-center gap-2 text-[12px]" style={{ color: C.inkMute, ...num }}>
              <ShieldCheck size={13} aria-hidden="true" style={{ color: C.ok }} />
              {verified}/{CREDENTIALS.length} certificaten geverifieerd · 7 open reacties
            </p>
          </div>
        </Panel>
      </section>

      <section>
        <div className="mb-4">
          <Eyebrow>Meetwaarden · deze maand</Eyebrow>
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {KPIS.map((k, i) => (
            <Panel key={k.label} className="p-5" grainId={grainId}>
              <div className="flex items-start justify-between gap-2">
                <p
                  className="text-[10px] font-bold uppercase tracking-[0.14em]"
                  style={{ color: C.inkMute, ...body }}
                >
                  {k.label}
                </p>
                <span
                  className="inline-flex items-center gap-0.5 px-1.5 py-0.5 text-[9.5px] font-bold"
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
                className="mt-3 text-[28px] font-bold leading-none tracking-[-0.01em]"
                style={{ color: C.ink, ...num }}
              >
                {k.value}
              </p>
              <div className="mt-3">
                <SparkBar data={k.spark} tone={k.up ? C.rustHi : C.ember} id={`kpi-${i}`} />
              </div>
            </Panel>
          ))}
        </div>
      </section>

      <section className="grid grid-cols-1 gap-5 lg:grid-cols-[1.45fr_1fr]">
        <div>
          <div className="mb-4 flex items-baseline justify-between">
            <Eyebrow>Open opdrachten</Eyebrow>
            <button
              type="button"
              onClick={onOpen}
              className="text-[11px] font-bold uppercase tracking-[0.14em] transition-colors hover:brightness-125 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#d06a2c] focus-visible:ring-offset-2 focus-visible:ring-offset-[#1a1613]"
              style={{ color: C.rustHi, ...body }}
            >
              Alle →
            </button>
          </div>
          <Panel grainId={grainId}>
            <ul>
              {OPDRACHTEN.map((o, i) => (
                <li key={o.id} style={{ borderTop: i === 0 ? "none" : `1px solid ${C.seamSoft}` }}>
                  <button
                    type="button"
                    onClick={onOpen}
                    className="group grid w-full grid-cols-[auto_1fr_auto] items-center gap-4 px-5 py-4 text-left transition-colors hover:bg-[#2b2420] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#d06a2c] motion-reduce:transition-none"
                  >
                    <span
                      className="inline-flex h-10 w-10 items-center justify-center"
                      style={{
                        background: i === 0 ? C.rustWash : C.concreteDeep,
                        border: `1px solid ${i === 0 ? C.rust : C.seam}`,
                      }}
                    >
                      <span
                        className="text-[12px] font-bold leading-none"
                        style={{ color: i === 0 ? C.rustHi : C.inkMute, ...num }}
                      >
                        {o.match}
                      </span>
                    </span>
                    <span className="min-w-0">
                      <span
                        className="block truncate text-[15px] font-semibold"
                        style={{ color: C.ink, ...body }}
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
                      <SteelMeter value={o.match} tone={o.match >= 90 ? C.rustHi : C.ember} />
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
            <Eyebrow>Certificaten</Eyebrow>
          </div>
          <Panel className="p-5" grainId={grainId}>
            <ul className="space-y-1">
              {CREDENTIALS.map((c, i) => {
                const st = statusMeta(c.status);
                return (
                  <li
                    key={c.naam}
                    className="flex items-center gap-3 py-2.5"
                    style={{ borderTop: i === 0 ? "none" : `1px solid ${C.seamSoft}` }}
                  >
                    <span
                      className="inline-flex h-8 w-8 items-center justify-center"
                      style={{ color: st.ink, background: st.wash, border: `1px solid ${st.tone}` }}
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
                      <span className="block truncate text-[10.5px]" style={{ color: C.inkMute }}>
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

function Marktplaats({ grainId, onOpen }: { grainId: string; onOpen: () => void }) {
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
        <Eyebrow>Marktplaats · aanvoer</Eyebrow>
        <h1
          className="mt-3 text-[34px] font-bold uppercase leading-none tracking-[0.02em]"
          style={{ color: C.ink, ...display }}
        >
          Open opdrachten
        </h1>
        <p className="mt-2 text-[13px]" style={{ color: C.inkMute, ...num }}>
          {String(filtered.length).padStart(2, "0")} van{" "}
          {String(OPDRACHTEN.length).padStart(2, "0")} opdrachten in de aanvoer
        </p>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div
          className="flex flex-1 items-center gap-2.5 px-5 py-3"
          style={{ background: C.concreteDeep, border: `1px solid ${C.seam}` }}
        >
          <Search size={16} aria-hidden="true" style={{ color: C.inkFaint }} />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Zoek op titel, plaats of opdrachtgever…"
            aria-label="Opdrachten zoeken"
            className="w-full bg-transparent text-[13px] outline-none placeholder:text-[#6c6259]"
            style={{ color: C.ink, ...body }}
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
          <GhostButton onClick={() => setLoading((v) => !v)} active={loading} ariaPressed={loading}>
            {loading ? "Stop" : "Laden…"}
          </GhostButton>
        </div>
      </div>

      {loading ? (
        <ul className="space-y-4" aria-hidden="true">
          {[0, 1, 2].map((i) => (
            <li key={i}>
              <Panel className="p-6" grainId={grainId}>
                <div className="animate-pulse space-y-3 motion-reduce:animate-none">
                  <div className="h-3 w-24" style={{ background: C.plateHi }} />
                  <div className="h-5 w-2/3" style={{ background: C.plateHi }} />
                  <div className="h-3 w-1/2" style={{ background: C.plateHi }} />
                  <div className="h-2 w-full" style={{ background: C.plateHi }} />
                </div>
              </Panel>
            </li>
          ))}
        </ul>
      ) : filtered.length === 0 ? (
        <Panel className="p-6" tone="steel" rust grainId={grainId}>
          <div className="flex flex-col items-center py-14 text-center">
            <span
              className="inline-flex h-16 w-16 items-center justify-center"
              style={{ background: C.rustWash, border: `1px solid ${C.rust}`, color: C.rustHi }}
              aria-hidden="true"
            >
              <Wind size={26} />
            </span>
            <p
              className="mt-5 text-[24px] font-bold uppercase tracking-[0.02em]"
              style={{ color: C.ink, ...display }}
            >
              Leeg terrein
            </p>
            <p className="mx-auto mt-2 max-w-xs text-[13.5px]" style={{ color: C.inkSoft }}>
              Niets in de aanvoer bij {q ? `“${q}”` : "je zoekterm"}. Verruim de zoekterm en probeer
              opnieuw.
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
              <MarktKaart opdracht={o} index={i} grainId={grainId} onOpen={onOpen} />
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
  grainId,
  onOpen,
}: {
  opdracht: Opdracht;
  index: number;
  grainId: string;
  onOpen: () => void;
}) {
  const [open, setOpen] = useState(false);
  const strong = opdracht.match >= 90;
  const tone = strong ? C.rustHi : C.ember;
  return (
    <Panel className="p-6" grainId={grainId} rust={strong}>
      <div className="grid grid-cols-[1fr_auto] items-start gap-4">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span
              className="inline-flex items-center px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.1em]"
              style={{ color: C.inkMute, border: `1px solid ${C.seam}`, ...num }}
            >
              № {String(index + 1).padStart(2, "0")}
            </span>
            <span className="text-[11px] font-semibold" style={{ color: C.inkFaint, ...num }}>
              {opdracht.id}
            </span>
          </div>
          <h3 className="mt-2 text-[19px] font-bold leading-snug" style={{ color: C.ink, ...body }}>
            {opdracht.titel}
          </h3>
          <p className="mt-1 text-[12.5px]" style={{ color: C.inkMute }}>
            {opdracht.opdrachtgever} · {opdracht.plaats} · {opdracht.uren}
          </p>
          <div className="mt-3 flex flex-wrap gap-1.5">
            {opdracht.tags.map((t) => (
              <span
                key={t}
                className="inline-flex items-center px-2.5 py-0.5 text-[10.5px] font-semibold"
                style={{
                  color: C.inkSoft,
                  background: C.concreteDeep,
                  border: `1px solid ${C.seamSoft}`,
                  ...body,
                }}
              >
                {t}
              </span>
            ))}
          </div>
        </div>
        <div className="flex flex-col items-center gap-1.5">
          <span
            className="inline-flex h-14 w-14 flex-col items-center justify-center"
            style={{ background: C.concreteDeep, border: `1.5px solid ${tone}` }}
          >
            <span className="text-[16px] font-bold leading-none" style={{ color: tone, ...num }}>
              {opdracht.match}
            </span>
            <span
              className="mt-0.5 text-[7.5px] font-bold uppercase tracking-[0.14em]"
              style={{ color: C.inkFaint, ...body }}
            >
              match
            </span>
          </span>
          <span className="text-[13px] font-bold" style={{ color: tone, ...num }}>
            {opdracht.tarief}
          </span>
        </div>
      </div>
      <div className="mt-4 flex items-center gap-3">
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-[11.5px] font-bold uppercase tracking-[0.04em] transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#d06a2c] focus-visible:ring-offset-2 focus-visible:ring-offset-[#241e19]"
          style={{ color: C.rustHi, border: `1px solid ${C.seam}`, ...body }}
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
        className="grid transition-all duration-500 motion-reduce:transition-none"
        style={{ gridTemplateRows: open ? "1fr" : "0fr" }}
      >
        <div className="overflow-hidden">
          <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
            <RedenBlok titel="Draagt" tone={C.okInk} Icon={Check} items={opdracht.redenen.plus} />
            <RedenBlok
              titel="Belast"
              tone={C.warnInk}
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
    <div className="p-4" style={{ background: C.concreteDeep, border: `1px solid ${C.seamSoft}` }}>
      <p
        className="text-[10px] font-bold uppercase tracking-[0.2em]"
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

function OpdrachtDetail({
  opdracht,
  grainId,
  onBack,
}: {
  opdracht: Opdracht;
  grainId: string;
  onBack: () => void;
}) {
  const strong = opdracht.match >= 90;
  const tone = strong ? C.rustHi : C.ember;
  return (
    <div className="space-y-6">
      <button
        type="button"
        onClick={onBack}
        className="inline-flex items-center gap-2 px-4 py-2 text-[12px] font-bold uppercase tracking-[0.05em] transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#d06a2c] focus-visible:ring-offset-2 focus-visible:ring-offset-[#1a1613]"
        style={{ color: C.inkSoft, border: `1px solid ${C.seam}`, background: C.plateHi, ...body }}
      >
        <ArrowRight size={13} aria-hidden="true" className="rotate-180" /> Terug naar marktplaats
      </button>

      <Panel className="p-7 md:p-9" tone="steel" rust grainId={grainId} rivets>
        <div className="flex flex-wrap items-center gap-2">
          <span
            className="inline-flex items-center px-2.5 py-0.5 text-[10.5px] font-semibold"
            style={{ color: C.inkMute, border: `1px solid ${C.seam}`, ...num }}
          >
            {opdracht.id}
          </span>
          <span
            className="inline-flex items-center gap-1 px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-[0.06em]"
            style={{ color: "#faf3ea", background: tone, ...body }}
          >
            <Flame size={11} aria-hidden="true" /> {strong ? "Sterke fundering" : "Aangeleverd"} ·{" "}
            {opdracht.match}%
          </span>
        </div>
        <h1
          className="mt-4 max-w-2xl text-[32px] font-bold uppercase leading-[1.02] tracking-[0.01em] md:text-[46px]"
          style={{ color: C.ink, ...display }}
        >
          {opdracht.titel}
        </h1>
        <p className="mt-2 text-[14px]" style={{ color: C.inkSoft }}>
          {opdracht.opdrachtgever} · {opdracht.plaats}
        </p>
        <div className="mt-6 flex flex-wrap gap-2.5">
          <PrimaryButton>
            Reageer op opdracht <ArrowRight size={14} aria-hidden="true" />
          </PrimaryButton>
          <GhostButton>Bewaren</GhostButton>
        </div>
      </Panel>

      <Panel grainId={grainId}>
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
                borderLeft: i % 4 === 0 ? "none" : `1px solid ${C.seamSoft}`,
                borderTop: i >= 2 ? `1px solid ${C.seamSoft}` : "none",
              }}
            >
              <p
                className="text-[9.5px] font-bold uppercase tracking-[0.18em]"
                style={{ color: C.inkMute, ...body }}
              >
                {m.l}
              </p>
              <p
                className="mt-1.5 text-[18px] font-bold tracking-[-0.01em]"
                style={{ color: C.ink, ...num }}
              >
                {m.v}
              </p>
            </div>
          ))}
        </div>
      </Panel>

      <section>
        <Eyebrow>Verklaarbare matching</Eyebrow>
        <p className="mt-3 max-w-xl text-[13.5px] leading-relaxed" style={{ color: C.inkSoft }}>
          Afgelezen van je geverifieerde profiel — wat de match draagt én waar hij wordt belast,
          zonder verborgen score.
        </p>
        <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-2">
          <Panel className="p-6" grainId={grainId}>
            <div className="flex items-center gap-2">
              <span
                className="inline-flex h-8 w-8 items-center justify-center"
                style={{ color: C.okInk, background: C.okWash, border: `1px solid ${C.ok}` }}
                aria-hidden="true"
              >
                <Check size={15} />
              </span>
              <p
                className="text-[11px] font-bold uppercase tracking-[0.16em]"
                style={{ color: C.okInk, ...body }}
              >
                Draagt
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
          </Panel>
          <Panel className="p-6" grainId={grainId}>
            <div className="flex items-center gap-2">
              <span
                className="inline-flex h-8 w-8 items-center justify-center"
                style={{ color: C.warnInk, background: C.warnWash, border: `1px solid ${C.warn}` }}
                aria-hidden="true"
              >
                <AlertTriangle size={14} />
              </span>
              <p
                className="text-[11px] font-bold uppercase tracking-[0.16em]"
                style={{ color: C.warnInk, ...body }}
              >
                Belast
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
          </Panel>
        </div>
        <div className="mt-4">
          <span className="text-[12px]" style={{ color: tone, ...body }}>
            Match {opdracht.match}% —{" "}
            {strong
              ? "sterke, geankerde aansluiting."
              : "redelijke aansluiting met aandachtspunten."}
          </span>
        </div>
      </section>
    </div>
  );
}

function Verificatie({ grainId }: { grainId: string }) {
  const [open, setOpen] = useState<string | null>(CREDENTIALS[0]?.naam ?? null);
  const verified = CREDENTIALS.filter((c) => c.status === "VERIFIED").length;
  const ratio = Math.round((verified / CREDENTIALS.length) * 100);

  return (
    <div className="space-y-6">
      <Panel className="p-7 md:p-9" tone="steel" rust grainId={grainId} rivets>
        <div className="flex flex-wrap items-center justify-between gap-6">
          <div className="max-w-md">
            <Eyebrow>Verificatie · vertrouwen</Eyebrow>
            <h1
              className="mt-3 text-[28px] font-bold uppercase leading-tight tracking-[0.01em]"
              style={{ color: C.ink, ...display }}
            >
              Jouw certificaten
            </h1>
            <p className="mt-3 text-[13.5px] leading-relaxed" style={{ color: C.inkSoft }}>
              <span className="font-bold" style={{ color: C.rustHi }}>
                {PROFIEL.trust}.
              </span>{" "}
              {verified} van {CREDENTIALS.length} certificaten staan verankerd en geverifieerd. Eén
              verloopt binnenkort en vraagt om vernieuwing. Documenten blijven versleuteld en privé.
            </p>
            <div className="mt-4 max-w-xs">
              <SteelMeter value={ratio} tone={C.rustHi} />
            </div>
          </div>
          <span
            className="inline-flex h-24 w-24 flex-col items-center justify-center"
            style={{ background: C.concreteDeep, border: `1.5px solid ${C.rust}` }}
          >
            <span
              className="text-[26px] font-bold leading-none"
              style={{ color: C.rustHi, ...num }}
            >
              {ratio}
            </span>
            <span
              className="mt-1 text-[8px] font-bold uppercase tracking-[0.16em]"
              style={{ color: C.inkMute, ...body }}
            >
              % verankerd
            </span>
          </span>
        </div>
      </Panel>

      <Panel grainId={grainId}>
        <div
          className="hidden grid-cols-[1fr_11rem_2.5rem] items-center gap-4 px-6 py-3.5 sm:grid"
          style={{ borderBottom: `1px solid ${C.seamSoft}` }}
        >
          {["Certificaat", "Status", ""].map((h, i) => (
            <span
              key={h || i}
              className="text-[9.5px] font-bold uppercase tracking-[0.18em]"
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
                style={{ borderTop: idx === 0 ? "none" : `1px solid ${C.seamSoft}` }}
              >
                <button
                  type="button"
                  onClick={() => setOpen(isOpen ? null : c.naam)}
                  aria-expanded={isOpen}
                  className="grid w-full grid-cols-[1fr_auto] items-center gap-4 px-6 py-4 text-left transition-colors hover:bg-[#2b2420] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#d06a2c] motion-reduce:transition-none sm:grid-cols-[1fr_11rem_2.5rem]"
                >
                  <span className="flex min-w-0 items-center gap-3">
                    <span
                      className="inline-flex h-9 w-9 items-center justify-center"
                      style={{ color: st.ink, background: st.wash, border: `1px solid ${st.tone}` }}
                      aria-hidden="true"
                    >
                      <st.Icon size={16} />
                    </span>
                    <span className="min-w-0">
                      <span
                        className="block truncate text-[15px] font-semibold"
                        style={{ color: C.ink, ...body }}
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
                    <Chip tone={st.tone} ink={st.ink} wash={st.wash} alarm={st.alarm}>
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
                      <div
                        className="p-4"
                        style={{ background: C.concreteDeep, border: `1px solid ${C.seamSoft}` }}
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
                            {c.status === "EXPIRING" ? (
                              <>
                                <RefreshCw size={13} aria-hidden="true" /> Vernieuwen
                              </>
                            ) : (
                              "Bekijken"
                            )}
                          </PrimaryButton>
                          <GhostButton>
                            <History size={13} aria-hidden="true" /> Historie
                          </GhostButton>
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
          <Eyebrow tone={C.emberInk}>Documentenkast</Eyebrow>
        </div>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {DOCUMENTEN.map((d) => {
            const st = statusMeta(d.status);
            return (
              <Panel key={d.naam} className="flex items-center gap-3 p-4" grainId={grainId}>
                <span
                  className="inline-flex h-10 w-10 items-center justify-center"
                  style={{
                    background: C.concreteDeep,
                    border: `1px solid ${C.seam}`,
                    color: C.inkSoft,
                  }}
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
                  className="inline-flex items-center gap-1 px-2 py-1 text-[10px] font-semibold"
                  style={{ color: st.ink, background: st.wash, border: `1px solid ${st.tone}` }}
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

function Acties({ grainId }: { grainId: string }) {
  return (
    <div className="space-y-6">
      <div>
        <Eyebrow>Acties · op prioriteit</Eyebrow>
        <h1
          className="mt-3 text-[34px] font-bold uppercase leading-none tracking-[0.02em]"
          style={{ color: C.ink, ...display }}
        >
          Wat nu aandacht vraagt
        </h1>
        <p className="mt-2 max-w-md text-[13.5px]" style={{ color: C.inkSoft }}>
          Van boven naar beneden afwerken — zo blijf je verifieerbaar en betaald, stevig gefundeerd.
        </p>
      </div>

      <ol className="space-y-3">
        {ACTIES.map((a, i) => {
          const warn = a.urgentie === "warning";
          const tone = warn ? C.warn : C.rust;
          const ink = warn ? C.warnInk : C.rustHi;
          const wash = warn ? C.warnWash : C.rustWash;
          return (
            <li key={a.titel}>
              <Panel className="p-6" grainId={grainId} rust={warn}>
                <div className="grid grid-cols-[auto_1fr] items-start gap-4 sm:grid-cols-[auto_1fr_auto]">
                  <span
                    className="flex h-11 w-11 items-center justify-center text-[15px] font-bold"
                    style={{ background: wash, border: `1.5px solid ${tone}`, color: ink, ...num }}
                    aria-hidden="true"
                  >
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <div className="min-w-0">
                    <span
                      className="inline-flex items-center gap-1 px-2 py-0.5 text-[9.5px] font-bold uppercase tracking-[0.12em]"
                      style={{ color: ink, background: wash, border: `1px solid ${tone}`, ...body }}
                    >
                      {warn ? (
                        <AlertTriangle size={10} aria-hidden="true" />
                      ) : (
                        <Wrench size={10} aria-hidden="true" />
                      )}
                      {warn ? "Urgent" : "Aanbevolen"}
                    </span>
                    <h2
                      className="mt-2 text-[19px] font-bold leading-snug"
                      style={{ color: C.ink, ...body }}
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
                    <PrimaryButton>
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
  Icon: LucideIcon | null;
} {
  if (status === "Openstaand")
    return { ink: C.warnInk, wash: C.warnWash, tone: C.warn, Icon: AlertTriangle };
  if (status === "Betaald") return { ink: C.okInk, wash: C.okWash, tone: C.ok, Icon: Check };
  return { ink: C.inkMute, wash: C.concreteDeep, tone: C.seam, Icon: FileText };
}

function Facturen({ grainId }: { grainId: string }) {
  const totaalBetaald = "€ 8.622";
  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <Eyebrow>Facturen · afrekening</Eyebrow>
          <h1
            className="mt-3 text-[34px] font-bold uppercase leading-none tracking-[0.02em]"
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
          { l: "Betaald (mnd)", v: totaalBetaald, sub: "3 voldaan", alarm: false, Icon: Ruler },
          {
            l: "Openstaand",
            v: "€ 1.350",
            sub: "1 factuur · 9 dagen",
            alarm: true,
            Icon: AlertTriangle,
          },
          { l: "Concept", v: "€ 880", sub: "klaar om te versturen", alarm: false, Icon: FileText },
        ].map((s) => (
          <Panel key={s.l} className="p-6" grainId={grainId}>
            <div className="flex items-center justify-between">
              <p
                className="text-[10px] font-bold uppercase tracking-[0.14em]"
                style={{ color: C.inkMute, ...body }}
              >
                {s.l}
              </p>
              <span
                className="inline-flex h-6 w-6 items-center justify-center"
                style={{
                  background: s.alarm ? C.warnWash : C.concreteDeep,
                  color: s.alarm ? C.warnInk : C.inkMute,
                }}
                aria-hidden="true"
              >
                <s.Icon size={13} />
              </span>
            </div>
            <p
              className="mt-2 text-[28px] font-bold tracking-[-0.01em]"
              style={{ color: s.alarm ? C.warnInk : C.ink, ...num }}
            >
              {s.v}
            </p>
            <p className="mt-1 text-[11.5px]" style={{ color: C.inkMute }}>
              {s.sub}
            </p>
          </Panel>
        ))}
      </section>

      <Panel grainId={grainId}>
        <div
          className="hidden grid-cols-[8rem_1fr_5rem_9rem_6rem] gap-4 px-6 pb-3 pt-5 sm:grid"
          style={{ borderBottom: `1px solid ${C.seamSoft}` }}
        >
          {["Nummer", "Klant", "Datum", "Status", "Bedrag"].map((h, i) => (
            <span
              key={h}
              className={`text-[9.5px] font-bold uppercase tracking-[0.16em] ${i === 4 ? "text-right" : ""}`}
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
                className="grid grid-cols-[1fr_auto] items-center gap-3 px-6 py-4 transition-colors hover:bg-[#2b2420] sm:grid-cols-[8rem_1fr_5rem_9rem_6rem] sm:gap-4"
                style={{ borderTop: i === 0 ? "none" : `1px solid ${C.seamSoft}` }}
              >
                <span
                  className="order-1 text-[11.5px] font-semibold"
                  style={{ color: C.inkMute, ...num }}
                >
                  {f.nr}
                </span>
                <span
                  className="order-3 min-w-0 truncate text-[14px] font-semibold sm:order-2"
                  style={{ color: C.ink, ...body }}
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
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 text-[10.5px] font-semibold"
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
                  className="order-2 text-right text-[14px] font-bold sm:order-5"
                  style={{ color: acc ? C.warnInk : C.ink, ...num }}
                >
                  {f.bedrag}
                </span>
              </li>
            );
          })}
        </ul>
        <div
          className="flex items-center justify-between px-6 py-4"
          style={{ borderTop: `1px solid ${C.seamSoft}` }}
        >
          <span
            className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.18em]"
            style={{ color: C.inkMute, ...body }}
          >
            <Download size={12} aria-hidden="true" style={{ color: C.rustHi }} /> Totaal betaald
          </span>
          <span className="text-[20px] font-bold" style={{ color: C.ink, ...num }}>
            {totaalBetaald}
          </span>
        </div>
      </Panel>
    </div>
  );
}
