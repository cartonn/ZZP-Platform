"use client";

// Concept 426 — "Broeikas" · botanische kas met glas, groen & gefilterd daglicht.
// Serre-metafoor: een fijn glas-raster van kas-sponningen (dunne lijnen), zacht gefilterd daglicht
// (subtiele warm-naar-koel verticale gradient), gedempt blad-groen en veel lucht. Profielen en
// credentials "groeien" — subtiele blad-motieven als accent, nooit kitsch. Laag-prikkelend en
// geruststellend rond gevoelige documenten: zacht, ademend, premium-kalm. Micro-interacties zijn
// traag en organisch, met respect voor reduced-motion.

import { useMemo, useState } from "react";
import {
  AlertTriangle,
  ArrowRight,
  Bell,
  Check,
  ChevronRight,
  Clock,
  Droplets,
  FileText,
  Leaf,
  Minus,
  Plus,
  Search,
  Shield,
  ShieldCheck,
  Sprout,
  Sun,
  X,
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

// — Palet: gefilterd kasgroen, warm glas-licht, blad-accent —
const C = {
  bg: "#eef3ec",
  bgWarm: "#f3f2e9",
  bgCool: "#e7f0ec",
  glass: "#f7faf5",
  card: "#fbfcf9",
  ink: "#1e2a22",
  inkSoft: "#3f4d43",
  inkMute: "#6c7a6e",
  inkFaint: "#9aa79c",
  line: "rgba(30,42,34,0.10)",
  lineSoft: "rgba(30,42,34,0.06)",
  frame: "rgba(30,42,34,0.16)",
  leaf: "#2f8f5b",
  leafInk: "#1f6a41",
  leafDeep: "#175334",
  leafWash: "rgba(47,143,91,0.12)",
  leafMist: "rgba(47,143,91,0.07)",
  moss: "#6f8f4f",
  mossInk: "#54702f",
  mossWash: "rgba(111,143,79,0.14)",
  sun: "#c99a3f",
  sunInk: "#9a7126",
  sunWash: "rgba(201,154,63,0.16)",
  clay: "#bb6b4f",
  clayInk: "#93472e",
  clayWash: "rgba(187,107,79,0.15)",
  sky: "#4f8598",
  skyInk: "#356374",
  skyWash: "rgba(79,133,152,0.13)",
};

const display = {
  fontFamily: "'Fraunces', 'Iowan Old Style', Georgia, 'Times New Roman', serif",
  letterSpacing: "-0.005em",
};
const body = {
  fontFamily: "'Inter', 'Segoe UI', system-ui, -apple-system, sans-serif",
};
const num = {
  fontFamily: "'Inter', ui-monospace, SFMono-Regular, Menlo, monospace",
  fontVariantNumeric: "tabular-nums" as const,
};

type Tone = { fill: string; ink: string; wash: string };
const LEAF: Tone = { fill: C.leaf, ink: C.leafInk, wash: C.leafWash };
const MOSS: Tone = { fill: C.moss, ink: C.mossInk, wash: C.mossWash };
const SUN: Tone = { fill: C.sun, ink: C.sunInk, wash: C.sunWash };
const CLAY: Tone = { fill: C.clay, ink: C.clayInk, wash: C.clayWash };
const SKY: Tone = { fill: C.sky, ink: C.skyInk, wash: C.skyWash };

function statusMeta(s: CredStatus): {
  label: string;
  Icon: LucideIcon;
  alarm: boolean;
  tone: Tone;
} {
  switch (s) {
    case "VERIFIED":
      return { label: "Geverifieerd", Icon: ShieldCheck, alarm: false, tone: LEAF };
    case "SUBMITTED":
      return { label: "In behandeling", Icon: Clock, alarm: false, tone: SKY };
    case "EXPIRING":
      return { label: "Verloopt bijna", Icon: AlertTriangle, alarm: true, tone: SUN };
    case "REJECTED":
      return { label: "Afgewezen", Icon: X, alarm: true, tone: CLAY };
  }
}

// — Kaspaneel: glas-oppervlak met dunne sponning-rand en zachte val van licht —
function Glass({
  children,
  className = "",
  as: Tag = "div",
  bg = C.card,
  glow = false,
  style,
}: {
  children: React.ReactNode;
  className?: string;
  as?: "div" | "section" | "li" | "article";
  bg?: string;
  glow?: boolean;
  style?: React.CSSProperties;
}) {
  return (
    <Tag
      className={`relative overflow-hidden rounded-[20px] ${className}`}
      style={{
        background: bg,
        border: `1px solid ${C.frame}`,
        boxShadow: glow
          ? "inset 0 1px 0 rgba(255,255,255,0.7), 0 1px 2px rgba(30,42,34,0.04), 0 16px 40px rgba(30,42,34,0.06)"
          : "inset 0 1px 0 rgba(255,255,255,0.6), 0 1px 2px rgba(30,42,34,0.03), 0 10px 26px rgba(30,42,34,0.05)",
        color: C.ink,
        ...style,
      }}
    >
      {children}
    </Tag>
  );
}

// — Glas-raster: fijne kas-sponningen als dun lijnenpatroon over een oppervlak —
function Muntins({ opacity = 0.5 }: { opacity?: number }) {
  return (
    <div
      className="pointer-events-none absolute inset-0"
      aria-hidden="true"
      style={{
        opacity,
        backgroundImage: `linear-gradient(${C.lineSoft} 1px, transparent 1px), linear-gradient(90deg, ${C.lineSoft} 1px, transparent 1px)`,
        backgroundSize: "40px 40px",
      }}
    />
  );
}

function Eyebrow({ children, tone = C.leafInk }: { children: React.ReactNode; tone?: string }) {
  return (
    <p
      className="flex items-center gap-2 text-[10.5px] font-semibold uppercase tracking-[0.2em]"
      style={{ color: tone, ...body }}
    >
      <Leaf size={12} aria-hidden="true" />
      {children}
    </p>
  );
}

function Chip({
  tone,
  children,
  alarm = false,
}: {
  tone: Tone;
  children: React.ReactNode;
  alarm?: boolean;
}) {
  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold"
      style={{ color: tone.ink, background: tone.wash, border: `1px solid ${tone.fill}`, ...body }}
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
}: {
  children: React.ReactNode;
  onClick?: () => void;
  className?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`group inline-flex items-center justify-center gap-2 rounded-full px-5 py-2.5 text-[13px] font-semibold transition-all duration-300 hover:brightness-[1.05] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2f8f5b] focus-visible:ring-offset-2 focus-visible:ring-offset-[#eef3ec] active:translate-y-px motion-reduce:transition-none ${className}`}
      style={{
        color: "#f7faf5",
        background: `linear-gradient(180deg, ${C.leaf}, ${C.leafInk})`,
        boxShadow: "0 6px 18px rgba(31,106,65,0.22)",
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
      className={`inline-flex items-center justify-center gap-2 rounded-full px-4 py-2.5 text-[12.5px] font-semibold transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2f8f5b] focus-visible:ring-offset-2 focus-visible:ring-offset-[#eef3ec] motion-reduce:transition-none ${className}`}
      style={{
        color: active ? "#f7faf5" : C.inkSoft,
        background: active ? C.leaf : C.card,
        border: `1px solid ${active ? C.leaf : C.frame}`,
        ...body,
      }}
    >
      {children}
    </button>
  );
}

// — Groei-sparkline: zachte curve met een klein blad aan het groeipunt —
function GrowthLine({ data, tone, id }: { data: number[]; tone: string; id: string }) {
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
        <linearGradient id={`grow-${id}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={tone} stopOpacity="0.22" />
          <stop offset="100%" stopColor={tone} stopOpacity="0" />
        </linearGradient>
      </defs>
      <polygon points={`0,${h} ${line} ${w},${h}`} fill={`url(#grow-${id})`} />
      <polyline
        points={line}
        fill="none"
        stroke={tone}
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx={last[0]} cy={last[1]} r="2.4" fill={C.card} stroke={tone} strokeWidth="1.4" />
    </svg>
  );
}

// — Groei-meter: een rankende balk met blaadje aan het groeipunt —
function GrowthMeter({ value, tone = C.leaf }: { value: number; tone?: string }) {
  return (
    <span className="hidden items-center gap-2.5 sm:flex" aria-hidden="true">
      <span
        className="relative h-1.5 w-24 overflow-hidden rounded-full"
        style={{ background: C.bgCool }}
      >
        <span
          className="block h-full rounded-full"
          style={{ width: `${value}%`, background: tone }}
        />
      </span>
      <span className="text-[12.5px] font-semibold" style={{ color: tone, ...num }}>
        {value}%
      </span>
    </span>
  );
}

// — Stengel-meter: verticale groei van een plantje, voor grote match-weergave —
function StemGrowth({ value, tone }: { value: number; tone: Tone }) {
  const leaves = Math.max(1, Math.round((value / 100) * 4));
  return (
    <span className="relative inline-flex h-20 w-12 items-end justify-center" aria-hidden="true">
      <span
        className="absolute bottom-0 h-full w-[3px] rounded-full"
        style={{ background: C.bgCool }}
      />
      <span
        className="absolute bottom-0 w-[3px] rounded-full transition-all duration-500 motion-reduce:transition-none"
        style={{ height: `${Math.max(18, value)}%`, background: tone.fill }}
      />
      {Array.from({ length: leaves }).map((_, i) => (
        <Leaf
          key={i}
          size={13}
          className="absolute"
          style={{
            color: tone.fill,
            bottom: `${20 + i * 18}%`,
            left: i % 2 === 0 ? "calc(50% + 2px)" : "auto",
            right: i % 2 === 1 ? "calc(50% + 2px)" : "auto",
            transform: i % 2 === 0 ? "rotate(35deg)" : "rotate(-35deg) scaleX(-1)",
            opacity: 0.9,
          }}
        />
      ))}
    </span>
  );
}

export function Concept426() {
  const [screen, setScreen] = useState<ScreenKey>("dashboard");
  const active = OPDRACHTEN[0] as Opdracht;

  return (
    <div
      className="relative min-h-[720px] w-full antialiased"
      style={{
        ...body,
        color: C.ink,
        background: `linear-gradient(180deg, ${C.bgWarm} 0%, ${C.bg} 46%, ${C.bgCool} 100%)`,
      }}
    >
      <style>{`
        @keyframes kasRise { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
        .kas-rise { animation: kasRise 0.5s cubic-bezier(0.22, 1, 0.36, 1) both; }
        @media (prefers-reduced-motion: reduce) { .kas-rise { animation: none !important; } }
      `}</style>

      {/* gefilterd daglicht dat van bovenaf de kas invalt */}
      <div
        className="pointer-events-none absolute inset-x-0 top-0 h-72"
        aria-hidden="true"
        style={{
          background: `linear-gradient(180deg, rgba(201,154,63,0.10) 0%, rgba(79,133,152,0.05) 40%, transparent 100%)`,
        }}
      />
      {/* fijn kas-raster over het hele scherm */}
      <Muntins opacity={0.35} />

      <div className="relative mx-auto max-w-6xl px-4 pb-24 sm:px-6 md:px-8">
        <TopBar />
        <NavBar screen={screen} setScreen={setScreen} />
        <main key={screen} className="kas-rise pt-6">
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
          className="inline-flex h-11 w-11 items-center justify-center rounded-2xl"
          style={{ background: C.leafWash, border: `1px solid ${C.frame}`, color: C.leafDeep }}
          aria-hidden="true"
        >
          <Sprout size={19} />
        </span>
        <div>
          <p
            className="text-[20px] font-semibold leading-none"
            style={{ color: C.ink, ...display }}
          >
            Broeikas
          </p>
          <p
            className="mt-1.5 flex items-center gap-1.5 text-[11px] leading-none"
            style={{ color: C.inkMute, ...body }}
          >
            <Sun size={11} aria-hidden="true" style={{ color: C.sunInk }} />
            {PROFIEL.plaats} · gefilterd daglicht
          </p>
        </div>
      </div>
      <div className="flex items-center gap-3">
        <span
          className="hidden items-center gap-1.5 rounded-full px-3 py-1.5 text-[11px] font-semibold sm:inline-flex"
          style={{
            color: C.leafInk,
            border: `1px solid ${C.leaf}`,
            background: C.leafWash,
            ...body,
          }}
        >
          <ShieldCheck size={12} aria-hidden="true" />
          {PROFIEL.trust}
        </span>
        <span
          className="relative inline-flex h-10 w-10 items-center justify-center rounded-full"
          style={{ background: C.card, border: `1px solid ${C.frame}`, color: C.inkMute }}
          aria-label={`${ongelezen} ongelezen berichten`}
        >
          <Bell size={16} aria-hidden="true" />
          {ongelezen > 0 && (
            <span
              className="absolute -right-0.5 -top-0.5 flex h-4 w-4 items-center justify-center rounded-full text-[9px] font-bold"
              style={{ background: C.leaf, color: "#f7faf5", ...num }}
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
          className="inline-flex h-11 w-11 items-center justify-center rounded-2xl text-[13px] font-semibold"
          style={{
            background: C.mossWash,
            border: `1px solid ${C.frame}`,
            color: C.mossInk,
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
    <nav aria-label="Hoofdnavigatie" className="mt-6">
      <div
        className="flex items-center gap-1 overflow-x-auto rounded-full p-1.5"
        style={{ background: C.glass, border: `1px solid ${C.frame}` }}
      >
        {SCREENS.map((s) => {
          const on = s.key === screen;
          return (
            <button
              key={s.key}
              type="button"
              onClick={() => setScreen(s.key)}
              aria-current={on ? "page" : undefined}
              className="flex shrink-0 items-center gap-2 rounded-full px-4 py-2 text-[12.5px] font-semibold transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2f8f5b] focus-visible:ring-offset-2 focus-visible:ring-offset-[#f7faf5] motion-reduce:transition-none"
              style={{
                color: on ? "#f7faf5" : C.inkMute,
                background: on ? C.leaf : "transparent",
                ...body,
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
    <div className="space-y-6">
      <section className="grid grid-cols-1 gap-5 lg:grid-cols-[1.5fr_1fr]">
        <Glass glow className="p-7 md:p-9" bg={C.glass}>
          <Muntins opacity={0.4} />
          <div className="relative">
            <Eyebrow>Vandaag · in de kas</Eyebrow>
            <div className="mt-4 flex items-start justify-between gap-4">
              <h1
                className="text-[32px] font-semibold leading-[1.05] md:text-[44px]"
                style={{ color: C.ink, ...display }}
              >
                Goedemorgen,
                <br />
                {PROFIEL.naam.split(" ")[0]}.
              </h1>
              <Leaf
                size={28}
                aria-hidden="true"
                style={{ color: C.leaf }}
                className="hidden sm:block"
              />
            </div>
            <p className="mt-3 max-w-md text-[14px] leading-relaxed" style={{ color: C.inkSoft }}>
              Je praktijk staat in het licht en groeit rustig door. Loop je acties langs, houd elk
              certificaat verzorgd en elke factuur betaald — kalm, in je eigen tempo.
            </p>
            <div className="mt-6 flex flex-wrap items-center gap-3">
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
          </div>
        </Glass>

        <Glass className="flex flex-col p-7">
          <div className="flex items-center justify-between">
            <Eyebrow tone={C.sunInk}>Vraagt aandacht</Eyebrow>
            <Sun size={18} aria-hidden="true" style={{ color: C.sun }} />
          </div>
          <h2
            className="mt-4 text-[20px] font-semibold leading-snug"
            style={{ color: C.ink, ...display }}
          >
            {primair.titel}
          </h2>
          <p className="mt-2 text-[13.5px] leading-relaxed" style={{ color: C.inkSoft }}>
            {primair.detail}
          </p>
          <div className="mt-auto pt-6">
            <PrimaryButton onClick={onActies} className="w-full">
              {primair.cta}
              <ArrowRight size={14} aria-hidden="true" />
            </PrimaryButton>
          </div>
          <div className="mt-5 pt-4" style={{ borderTop: `1px solid ${C.lineSoft}` }}>
            <p className="flex items-center gap-2 text-[12px]" style={{ color: C.inkMute, ...num }}>
              <Sprout size={13} aria-hidden="true" style={{ color: C.leaf }} />
              {verified}/{CREDENTIALS.length} certificaten geverifieerd · 7 open reacties
            </p>
          </div>
        </Glass>
      </section>

      <section>
        <div className="mb-3">
          <Eyebrow tone={C.skyInk}>Groei · deze maand</Eyebrow>
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {KPIS.map((k, i) => (
            <Glass key={k.label} className="p-5">
              <div className="flex items-start justify-between gap-2">
                <p
                  className="text-[10.5px] font-semibold uppercase tracking-[0.08em]"
                  style={{ color: C.inkMute, ...body }}
                >
                  {k.label}
                </p>
                <span
                  className="inline-flex items-center gap-0.5 rounded-full px-1.5 py-0.5 text-[9.5px] font-bold"
                  style={{
                    color: k.up ? C.leafInk : C.sunInk,
                    background: k.up ? C.leafWash : C.sunWash,
                    ...num,
                  }}
                >
                  {k.up ? "▲" : "▼"} {k.trend.replace(/^[+-]/, "")}
                </span>
              </div>
              <p
                className="mt-3 text-[27px] font-semibold leading-none"
                style={{ color: C.ink, ...num }}
              >
                {k.value}
              </p>
              <div className="mt-3">
                <GrowthLine data={k.spark} tone={k.up ? C.leaf : C.sun} id={`kpi-${i}`} />
              </div>
            </Glass>
          ))}
        </div>
      </section>

      <section className="grid grid-cols-1 gap-5 lg:grid-cols-[1.5fr_1fr]">
        <div>
          <div className="mb-3 flex items-baseline justify-between">
            <Eyebrow>Kwekerij · open opdrachten</Eyebrow>
            <button
              type="button"
              onClick={onOpen}
              className="rounded text-[11px] font-semibold uppercase tracking-[0.12em] transition-colors hover:brightness-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2f8f5b] focus-visible:ring-offset-2 focus-visible:ring-offset-[#eef3ec]"
              style={{ color: C.leafInk, ...body }}
            >
              Alle →
            </button>
          </div>
          <Glass>
            <ul>
              {OPDRACHTEN.map((o, i) => {
                const strong = o.match >= 90;
                const tone = strong ? C.leaf : C.moss;
                const toneInk = strong ? C.leafInk : C.mossInk;
                const wash = strong ? C.leafWash : C.mossWash;
                return (
                  <li
                    key={o.id}
                    style={{ borderTop: i === 0 ? "none" : `1px solid ${C.lineSoft}` }}
                  >
                    <button
                      type="button"
                      onClick={onOpen}
                      className="group grid w-full grid-cols-[auto_1fr_auto] items-center gap-4 px-5 py-4 text-left transition-colors hover:bg-[#e7f0ec] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#2f8f5b] motion-reduce:transition-none"
                    >
                      <span
                        className="inline-flex h-10 w-10 items-center justify-center rounded-xl"
                        style={{ background: wash, border: `1px solid ${tone}` }}
                      >
                        <span
                          className="text-[12px] font-bold leading-none"
                          style={{ color: toneInk, ...num }}
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
                        <GrowthMeter value={o.match} tone={tone} />
                        <ChevronRight
                          size={17}
                          aria-hidden="true"
                          className="transition-transform group-hover:translate-x-0.5 motion-reduce:transition-none"
                          style={{ color: C.inkFaint }}
                        />
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          </Glass>
        </div>

        <div>
          <div className="mb-3">
            <Eyebrow tone={C.leafInk}>Certificaten</Eyebrow>
          </div>
          <Glass className="p-5">
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
                      className="inline-flex h-8 w-8 items-center justify-center rounded-lg"
                      style={{
                        color: st.tone.ink,
                        background: st.tone.wash,
                        border: `1px solid ${st.tone.fill}`,
                      }}
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
                      <span className="block truncate text-[10.5px]" style={{ color: st.tone.ink }}>
                        {st.label}
                      </span>
                    </span>
                  </li>
                );
              })}
            </ul>
          </Glass>
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
    <div className="space-y-6">
      <div>
        <Eyebrow>Marktplaats · de kwekerij</Eyebrow>
        <h1
          className="mt-3 text-[32px] font-semibold leading-none"
          style={{ color: C.ink, ...display }}
        >
          Open opdrachten
        </h1>
        <p className="mt-2 text-[13px]" style={{ color: C.inkMute, ...num }}>
          {String(filtered.length).padStart(2, "0")} van{" "}
          {String(OPDRACHTEN.length).padStart(2, "0")} in bloei
        </p>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div
          className="flex flex-1 items-center gap-2.5 rounded-full px-5 py-3"
          style={{ background: C.card, border: `1px solid ${C.frame}` }}
        >
          <Search size={16} aria-hidden="true" style={{ color: C.inkFaint }} />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Zoek op titel, plaats of opdrachtgever…"
            aria-label="Opdrachten zoeken"
            className="w-full bg-transparent text-[13px] outline-none placeholder:text-[#9aa79c]"
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
              <Glass className="p-6">
                <div className="animate-pulse space-y-3 motion-reduce:animate-none">
                  <div className="h-3 w-24 rounded-full" style={{ background: C.bgCool }} />
                  <div className="h-5 w-2/3 rounded-full" style={{ background: C.bgCool }} />
                  <div className="h-3 w-1/2 rounded-full" style={{ background: C.bgCool }} />
                  <div className="h-2 w-full rounded-full" style={{ background: C.bgCool }} />
                </div>
              </Glass>
            </li>
          ))}
        </ul>
      ) : filtered.length === 0 ? (
        <Glass className="p-6" glow>
          <Muntins opacity={0.4} />
          <div className="relative flex flex-col items-center py-14 text-center">
            <span
              className="inline-flex h-16 w-16 items-center justify-center rounded-2xl"
              style={{ background: C.leafWash, border: `1px solid ${C.leaf}`, color: C.leafDeep }}
              aria-hidden="true"
            >
              <Sprout size={26} />
            </span>
            <p className="mt-5 text-[22px] font-semibold" style={{ color: C.ink, ...display }}>
              Nog niets ontkiemd
            </p>
            <p className="mx-auto mt-2 max-w-xs text-[13.5px]" style={{ color: C.inkSoft }}>
              Niets gevonden bij {q ? `“${q}”` : "je zoekterm"}. Verruim de zoekterm en geef het wat
              tijd om te groeien.
            </p>
            <div className="mt-6">
              <PrimaryButton onClick={() => setQ("")}>
                Zoekterm wissen <ArrowRight size={14} aria-hidden="true" />
              </PrimaryButton>
            </div>
          </div>
        </Glass>
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
  const tone = strong ? LEAF : MOSS;
  return (
    <Glass className="p-6">
      <div className="grid grid-cols-[1fr_auto] items-start gap-4">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span
              className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.08em]"
              style={{ color: C.inkMute, border: `1px solid ${C.line}`, ...num }}
            >
              № {String(index + 1).padStart(2, "0")}
            </span>
            <span className="text-[11px] font-semibold" style={{ color: C.inkFaint, ...num }}>
              {opdracht.id}
            </span>
          </div>
          <h3
            className="mt-2 text-[19px] font-semibold leading-snug"
            style={{ color: C.ink, ...display }}
          >
            {opdracht.titel}
          </h3>
          <p className="mt-1 text-[12.5px]" style={{ color: C.inkMute }}>
            {opdracht.opdrachtgever} · {opdracht.plaats} · {opdracht.uren}
          </p>
          <div className="mt-3 flex flex-wrap gap-1.5">
            {opdracht.tags.map((t) => (
              <span
                key={t}
                className="inline-flex items-center rounded-full px-2.5 py-0.5 text-[10.5px] font-semibold"
                style={{
                  color: C.inkSoft,
                  background: C.bgCool,
                  border: `1px solid ${C.lineSoft}`,
                  ...body,
                }}
              >
                {t}
              </span>
            ))}
          </div>
        </div>
        <div className="flex flex-col items-center gap-1">
          <StemGrowth value={opdracht.match} tone={tone} />
          <span className="text-[15px] font-bold leading-none" style={{ color: tone.ink, ...num }}>
            {opdracht.match}%
          </span>
          <span className="text-[13px] font-semibold" style={{ color: C.ink, ...num }}>
            {opdracht.tarief}
          </span>
        </div>
      </div>
      <div className="mt-4 flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          className="inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-[11.5px] font-semibold transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2f8f5b] focus-visible:ring-offset-2 focus-visible:ring-offset-[#fbfcf9]"
          style={{ color: C.leafInk, border: `1px solid ${C.line}`, ...body }}
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
            <RedenBlok titel="Groeit goed" tone={LEAF} Icon={Check} items={opdracht.redenen.plus} />
            <RedenBlok
              titel="Aandacht"
              tone={SUN}
              Icon={AlertTriangle}
              items={opdracht.redenen.min}
            />
          </div>
        </div>
      </div>
    </Glass>
  );
}

function RedenBlok({
  titel,
  tone,
  Icon,
  items,
}: {
  titel: string;
  tone: Tone;
  Icon: LucideIcon;
  items: string[];
}) {
  return (
    <div
      className="rounded-xl p-4"
      style={{ background: C.bgCool, border: `1px solid ${C.lineSoft}` }}
    >
      <p
        className="flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.14em]"
        style={{ color: tone.ink }}
      >
        <Leaf size={11} aria-hidden="true" />
        {titel}
      </p>
      <ul className="mt-2.5 space-y-2">
        {items.map((r) => (
          <li key={r} className="flex items-start gap-2 text-[12.5px]" style={{ color: C.inkSoft }}>
            <Icon
              size={13}
              aria-hidden="true"
              className="mt-0.5 shrink-0"
              style={{ color: tone.ink }}
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
  const tone = strong ? LEAF : MOSS;
  return (
    <div className="space-y-6">
      <button
        type="button"
        onClick={onBack}
        className="inline-flex items-center gap-2 rounded-full px-4 py-2 text-[12.5px] font-semibold transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2f8f5b] focus-visible:ring-offset-2 focus-visible:ring-offset-[#eef3ec]"
        style={{ color: C.inkSoft, border: `1px solid ${C.frame}`, background: C.card, ...body }}
      >
        <ArrowRight size={13} aria-hidden="true" className="rotate-180" /> Terug naar marktplaats
      </button>

      <Glass glow className="p-7 md:p-9" bg={C.glass}>
        <Muntins opacity={0.4} />
        <div className="relative flex flex-wrap items-start justify-between gap-6">
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <span
                className="inline-flex items-center rounded-full px-2.5 py-0.5 text-[10.5px] font-semibold"
                style={{ color: C.inkMute, border: `1px solid ${C.line}`, ...num }}
              >
                {opdracht.id}
              </span>
              <span
                className="inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-semibold"
                style={{
                  color: tone.ink,
                  background: tone.wash,
                  border: `1px solid ${tone.fill}`,
                  ...body,
                }}
              >
                <Leaf size={11} aria-hidden="true" /> {strong ? "In volle bloei" : "Groeiende"} ·{" "}
                {opdracht.match}%
              </span>
            </div>
            <h1
              className="mt-4 max-w-2xl text-[30px] font-semibold leading-[1.08] md:text-[42px]"
              style={{ color: C.ink, ...display }}
            >
              {opdracht.titel}
            </h1>
            <p className="mt-2 text-[14px]" style={{ color: C.inkSoft }}>
              {opdracht.opdrachtgever} · {opdracht.plaats}
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <PrimaryButton>
                Reageer op opdracht <ArrowRight size={14} aria-hidden="true" />
              </PrimaryButton>
              <GhostButton>Bewaren</GhostButton>
            </div>
          </div>
          <div className="flex flex-col items-center gap-1">
            <StemGrowth value={opdracht.match} tone={tone} />
            <span
              className="text-[18px] font-bold leading-none"
              style={{ color: tone.ink, ...num }}
            >
              {opdracht.match}%
            </span>
          </div>
        </div>
      </Glass>

      <Glass>
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
                className="text-[9.5px] font-semibold uppercase tracking-[0.14em]"
                style={{ color: C.inkMute, ...body }}
              >
                {m.l}
              </p>
              <p className="mt-1.5 text-[18px] font-semibold" style={{ color: C.ink, ...num }}>
                {m.v}
              </p>
            </div>
          ))}
        </div>
      </Glass>

      <section>
        <Eyebrow>Verklaarbare matching</Eyebrow>
        <p className="mt-3 max-w-xl text-[13.5px] leading-relaxed" style={{ color: C.inkSoft }}>
          Rustig afgelezen van je geverifieerde profiel — wat goed groeit én waar wat verzorging
          nodig is, zonder verborgen score.
        </p>
        <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-2">
          <Glass className="p-6">
            <div className="flex items-center gap-2">
              <span
                className="inline-flex h-8 w-8 items-center justify-center rounded-lg"
                style={{ color: LEAF.ink, background: LEAF.wash, border: `1px solid ${LEAF.fill}` }}
                aria-hidden="true"
              >
                <Check size={15} />
              </span>
              <p
                className="text-[11px] font-semibold uppercase tracking-[0.12em]"
                style={{ color: LEAF.ink }}
              >
                Groeit goed
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
                    style={{ color: LEAF.ink }}
                  />
                  {r}
                </li>
              ))}
            </ul>
          </Glass>
          <Glass className="p-6">
            <div className="flex items-center gap-2">
              <span
                className="inline-flex h-8 w-8 items-center justify-center rounded-lg"
                style={{ color: SUN.ink, background: SUN.wash, border: `1px solid ${SUN.fill}` }}
                aria-hidden="true"
              >
                <AlertTriangle size={14} />
              </span>
              <p
                className="text-[11px] font-semibold uppercase tracking-[0.12em]"
                style={{ color: SUN.ink }}
              >
                Aandacht
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
                    style={{ color: SUN.ink }}
                  />
                  {r}
                </li>
              ))}
            </ul>
          </Glass>
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
      <Glass glow className="p-7 md:p-9" bg={C.glass}>
        <Muntins opacity={0.4} />
        <div className="relative flex flex-wrap items-center justify-between gap-6">
          <div className="max-w-md">
            <Eyebrow>Verificatie · verzorgd & veilig</Eyebrow>
            <h1
              className="mt-3 text-[28px] font-semibold leading-tight"
              style={{ color: C.ink, ...display }}
            >
              Jouw certificaten
            </h1>
            <p className="mt-3 text-[13.5px] leading-relaxed" style={{ color: C.inkSoft }}>
              <span className="font-semibold" style={{ color: C.leafInk }}>
                {PROFIEL.trust}.
              </span>{" "}
              {verified} van {CREDENTIALS.length} certificaten staan verzorgd en geverifieerd. Eén
              verloopt binnenkort en vraagt om vernieuwing. Documenten blijven versleuteld en privé.
            </p>
            <div className="mt-4 max-w-xs">
              <GrowthMeter value={ratio} tone={C.leaf} />
            </div>
          </div>
          <span
            className="inline-flex h-24 w-24 flex-col items-center justify-center rounded-full"
            style={{ background: C.leafWash, border: `1.5px solid ${C.leaf}` }}
          >
            <Shield size={16} aria-hidden="true" style={{ color: C.leafInk }} />
            <span
              className="mt-1 text-[24px] font-semibold leading-none"
              style={{ color: C.leafInk, ...num }}
            >
              {ratio}
            </span>
            <span
              className="mt-0.5 text-[8px] font-semibold uppercase tracking-[0.14em]"
              style={{ color: C.inkMute, ...body }}
            >
              % verzorgd
            </span>
          </span>
        </div>
      </Glass>

      <Glass>
        <div
          className="hidden grid-cols-[1fr_11rem_2.5rem] items-center gap-4 px-6 py-3.5 sm:grid"
          style={{ borderBottom: `1px solid ${C.lineSoft}` }}
        >
          {["Certificaat", "Status", ""].map((h, i) => (
            <span
              key={h || i}
              className="text-[9.5px] font-semibold uppercase tracking-[0.16em]"
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
                style={{ borderTop: idx === 0 ? "none" : `1px solid ${C.lineSoft}` }}
              >
                <button
                  type="button"
                  onClick={() => setOpen(isOpen ? null : c.naam)}
                  aria-expanded={isOpen}
                  className="grid w-full grid-cols-[1fr_auto] items-center gap-4 px-6 py-4 text-left transition-colors hover:bg-[#e7f0ec] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#2f8f5b] motion-reduce:transition-none sm:grid-cols-[1fr_11rem_2.5rem]"
                >
                  <span className="flex min-w-0 items-center gap-3">
                    <span
                      className="inline-flex h-9 w-9 items-center justify-center rounded-lg"
                      style={{
                        color: st.tone.ink,
                        background: st.tone.wash,
                        border: `1px solid ${st.tone.fill}`,
                      }}
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
                    <Chip tone={st.tone} alarm={st.alarm}>
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
                        className="rounded-xl p-4"
                        style={{ background: C.bgCool, border: `1px solid ${C.lineSoft}` }}
                      >
                        <p
                          className="max-w-xl text-[13px] leading-relaxed"
                          style={{ color: C.inkSoft }}
                        >
                          {c.detail}. Documenten worden versleuteld bewaard en alleen na jouw
                          expliciete toestemming gedeeld met een opdrachtgever.
                        </p>
                        <div className="mt-3 flex flex-wrap gap-3">
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
      </Glass>

      <div>
        <div className="mb-3">
          <Eyebrow tone={C.skyInk}>Documentenkast</Eyebrow>
        </div>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {DOCUMENTEN.map((d) => {
            const st = statusMeta(d.status);
            return (
              <Glass key={d.naam} className="flex items-center gap-3 p-4">
                <span
                  className="inline-flex h-10 w-10 items-center justify-center rounded-xl"
                  style={{ background: C.bgCool, border: `1px solid ${C.frame}`, color: C.inkSoft }}
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
                  className="inline-flex items-center gap-1 rounded-full px-2 py-1 text-[10px] font-semibold"
                  style={{
                    color: st.tone.ink,
                    background: st.tone.wash,
                    border: `1px solid ${st.tone.fill}`,
                  }}
                >
                  <st.Icon size={10} aria-hidden="true" />
                  {st.label}
                </span>
              </Glass>
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
        <Eyebrow>Acties · verzorging op volgorde</Eyebrow>
        <h1
          className="mt-3 text-[32px] font-semibold leading-none"
          style={{ color: C.ink, ...display }}
        >
          Wat nu aandacht vraagt
        </h1>
        <p className="mt-2 max-w-md text-[13.5px]" style={{ color: C.inkSoft }}>
          Rustig van boven naar beneden — zo blijf je verifieerbaar en betaald, in je eigen tempo.
        </p>
      </div>

      <ol className="space-y-3">
        {ACTIES.map((a, i) => {
          const warn = a.urgentie === "warning";
          const tone = warn ? SUN : LEAF;
          return (
            <li key={a.titel}>
              <Glass className="p-6">
                <div className="grid grid-cols-[auto_1fr] items-start gap-4 sm:grid-cols-[auto_1fr_auto]">
                  <span
                    className="flex h-11 w-11 items-center justify-center rounded-2xl text-[15px] font-bold"
                    style={{
                      background: tone.wash,
                      border: `1.5px solid ${tone.fill}`,
                      color: tone.ink,
                      ...num,
                    }}
                    aria-hidden="true"
                  >
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <div className="min-w-0">
                    <span
                      className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[9.5px] font-semibold uppercase tracking-[0.1em]"
                      style={{
                        color: tone.ink,
                        background: tone.wash,
                        border: `1px solid ${tone.fill}`,
                        ...body,
                      }}
                    >
                      {warn ? (
                        <AlertTriangle size={10} aria-hidden="true" />
                      ) : (
                        <Droplets size={10} aria-hidden="true" />
                      )}
                      {warn ? "Urgent" : "Aanbevolen"}
                    </span>
                    <h2
                      className="mt-2 text-[19px] font-semibold leading-snug"
                      style={{ color: C.ink, ...display }}
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
              </Glass>
            </li>
          );
        })}
      </ol>
    </div>
  );
}

function factuurTone(status: string): { tone: Tone; Icon: LucideIcon | null } {
  if (status === "Openstaand") return { tone: SUN, Icon: AlertTriangle };
  if (status === "Betaald") return { tone: LEAF, Icon: Check };
  return { tone: SKY, Icon: FileText };
}

function Facturen() {
  const totaalBetaald = "€ 8.622";
  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <Eyebrow>Facturen · de oogst</Eyebrow>
          <h1
            className="mt-3 text-[32px] font-semibold leading-none"
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
          { l: "Betaald (mnd)", v: totaalBetaald, sub: "3 voldaan", tone: LEAF, alarm: false },
          { l: "Openstaand", v: "€ 1.350", sub: "1 factuur · 9 dagen", tone: SUN, alarm: true },
          { l: "Concept", v: "€ 880", sub: "klaar om te versturen", tone: SKY, alarm: false },
        ].map((s) => (
          <Glass key={s.l} className="p-6">
            <div className="flex items-center justify-between">
              <p
                className="text-[10.5px] font-semibold uppercase tracking-[0.08em]"
                style={{ color: C.inkMute, ...body }}
              >
                {s.l}
              </p>
              {s.alarm ? (
                <span
                  className="inline-flex h-6 w-6 items-center justify-center rounded-full"
                  style={{ background: C.sunWash, color: C.sunInk }}
                  aria-hidden="true"
                >
                  <AlertTriangle size={13} />
                </span>
              ) : (
                <Leaf size={14} aria-hidden="true" style={{ color: s.tone.fill }} />
              )}
            </div>
            <p
              className="mt-2 text-[27px] font-semibold"
              style={{ color: s.alarm ? C.sunInk : C.ink, ...num }}
            >
              {s.v}
            </p>
            <p className="mt-1 text-[11.5px]" style={{ color: C.inkMute }}>
              {s.sub}
            </p>
          </Glass>
        ))}
      </section>

      <Glass>
        <div
          className="hidden grid-cols-[8rem_1fr_5rem_9rem_6rem] gap-4 px-6 pb-3 pt-5 sm:grid"
          style={{ borderBottom: `1px solid ${C.lineSoft}` }}
        >
          {["Nummer", "Klant", "Datum", "Status", "Bedrag"].map((h, i) => (
            <span
              key={h}
              className={`text-[9.5px] font-semibold uppercase tracking-[0.14em] ${i === 4 ? "text-right" : ""}`}
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
                className="grid grid-cols-[1fr_auto] items-center gap-3 px-6 py-4 transition-colors hover:bg-[#e7f0ec] sm:grid-cols-[8rem_1fr_5rem_9rem_6rem] sm:gap-4"
                style={{ borderTop: i === 0 ? "none" : `1px solid ${C.lineSoft}` }}
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
                    className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10.5px] font-semibold"
                    style={{
                      color: ft.tone.ink,
                      background: ft.tone.wash,
                      border: `1px solid ${ft.tone.fill}`,
                      ...body,
                    }}
                  >
                    {ft.Icon && <ft.Icon size={11} aria-hidden="true" />}
                    {f.status}
                  </span>
                </span>
                <span
                  className="order-2 text-right text-[14px] font-bold sm:order-5"
                  style={{ color: acc ? C.sunInk : C.ink, ...num }}
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
            className="flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.16em]"
            style={{ color: C.inkMute, ...body }}
          >
            <Leaf size={12} aria-hidden="true" style={{ color: C.leaf }} /> Totaal betaald
          </span>
          <span className="text-[20px] font-semibold" style={{ color: C.ink, ...num }}>
            {totaalBetaald}
          </span>
        </div>
      </Glass>
    </div>
  );
}
