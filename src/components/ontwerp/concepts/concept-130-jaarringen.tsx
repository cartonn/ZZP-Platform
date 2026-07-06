"use client";

// Concept 130 — "Jaarringen" · dendrochronologie: boom-jaarringen als tijd- en data-taal.
// Op een warm, bleek hout-canvas (#f4ece0) coderen concentrische GROEIRINGEN geschiedenis en
// voortgang: elke ring is een periode/mijlpaal, de ringdikte de intensiteit. Kernhout (donker,
// #6b4a2b) in het hart, spinthout (licht) naar de rand, met radiale scheuren en amber-bruine
// accenten (#a5642f). Een organische visualisatie van tijd en opgebouwd vertrouwen. Onderscheidend
// van voortgangsringen (Ringen, dark) en vinyl-groeven (Groef): dit is DENDROCHRONOLOGIE — echte
// boom-jaarringen, warm hout, natuurlijk. Fonts: Newsreader (display) + Manrope (UI).

import { useState } from "react";
import {
  ArrowRight,
  Check,
  Clock,
  AlertTriangle,
  XCircle,
  Search,
  TreePine,
  ShieldCheck,
  Plus,
  MapPin,
  Coins,
  CalendarDays,
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
  type ScreenKey,
  type CredStatus,
  type Opdracht,
} from "./mock";

// Hout-palet — bleek spinthout tot donker kernhout, amber-bruin als accent.
const C = {
  bg: "#f4ece0", // bleek hout-canvas
  panel: "#fbf6ec", // licht paneel-hout
  panelSoft: "#efe3d1", // gedempt paneel
  fg: "#2a2015", // donker schrift (schors)
  fgSoft: "#6f5d47", // gedempt schrift
  fgFaint: "#9c8a72",
  amber: "#a5642f", // kernhout amber-bruin (accent)
  amberDeep: "#834d22",
  kern: "#6b4a2b", // donker kernhout (secundair)
  spint: "#d8bd97", // spinthout-tint (licht)
  spintSoft: "#e7d6ba",
  green: "#4f7a3a", // levend groen (geverifieerd)
  rust: "#b4472e", // roest-rood (afgewezen/urgent)
  line: "#e0cfb2",
  lineStrong: "#cbb491",
};

const display = { fontFamily: "var(--font-lab-newsreader)" };
const ui = { fontFamily: "var(--font-lab-manrope)" };

// ── Jaarringen-motief ────────────────────────────────────────────────────────
// RingsArt tekent een dwarsdoorsnede: concentrische groeiringen van kernhout (hart) naar spinthout
// (rand), met wisselende ringdikte, radiale scheuren en een optioneel gemarkeerde voortgangsring.

function RingsArt({
  rings = 7,
  filled,
  cracks = true,
}: {
  rings?: number;
  filled?: number;
  cracks?: boolean;
}) {
  // Ringdiktes variëren als echte jaarringen (dikke groeiseizoenen, dunne droge jaren).
  const widths = [1.6, 2.4, 1.1, 2.0, 1.4, 2.6, 1.2, 1.9, 1.5, 2.2];
  const maxR = 46;
  let r = maxR;
  const circles: { r: number; w: number; idx: number }[] = [];
  for (let i = 0; i < rings; i++) {
    const w = (widths[i % widths.length] as number) + 0.4;
    circles.push({ r, w, idx: i });
    r -= w + 2.6;
    if (r < 4) break;
  }
  return (
    <svg viewBox="0 0 100 100" className="h-full w-full" aria-hidden="true">
      {/* Hout-vlak */}
      <circle cx="50" cy="50" r="48" fill={C.spintSoft} />
      <circle cx="50" cy="50" r="48" fill="none" stroke={C.lineStrong} strokeWidth="1.2" />
      {/* Ringen van buiten naar binnen */}
      {circles.map(({ r: rr, w, idx }) => {
        const isFilled = filled !== undefined && rings - idx <= filled;
        const stroke = isFilled
          ? idx % 2 === 0
            ? C.amber
            : C.amberDeep
          : idx % 2 === 0
            ? C.kern
            : "#8a6a44";
        return (
          <circle
            key={idx}
            cx="50"
            cy="50"
            r={rr}
            fill="none"
            stroke={stroke}
            strokeWidth={w}
            opacity={isFilled ? 0.95 : 0.55}
          />
        );
      })}
      {/* Kernhout-hart */}
      <circle cx="50" cy="50" r="4" fill={C.kern} />
      {/* Radiale scheuren */}
      {cracks && (
        <>
          <path d="M50 6 L50 30" stroke={C.kern} strokeWidth="0.8" opacity="0.45" />
          <path d="M50 50 L82 74" stroke={C.kern} strokeWidth="0.8" opacity="0.4" />
          <path d="M50 50 L22 70" stroke={C.kern} strokeWidth="0.7" opacity="0.35" />
        </>
      )}
    </svg>
  );
}

// Kleine jaarring-schijf in een vaste maat.
function RingDisc({
  size = 40,
  rings = 6,
  filled,
  className = "",
}: {
  size?: number;
  rings?: number;
  filled?: number;
  className?: string;
}) {
  return (
    <span
      className={`relative inline-flex shrink-0 overflow-hidden rounded-full ${className}`}
      style={{ width: size, height: size, boxShadow: "0 1px 3px rgba(42,32,21,0.2)" }}
    >
      <RingsArt rings={rings} filled={filled} />
    </span>
  );
}

// Houtnerf-textuur voor het canvas.
const woodGrain =
  "repeating-linear-gradient(92deg, rgba(107,74,43,0.035) 0 1px, transparent 1px 7px)," +
  "repeating-linear-gradient(88deg, rgba(165,100,47,0.025) 0 1px, transparent 1px 19px)," +
  "radial-gradient(140% 120% at 12% 0%, rgba(216,189,151,0.35), transparent 55%)," +
  "radial-gradient(120% 100% at 92% 100%, rgba(165,100,47,0.08), transparent 60%)";

// ── Status-codering ──────────────────────────────────────────────────────────
function statusMeta(s: CredStatus): { label: string; Icon: LucideIcon; tone: string } {
  switch (s) {
    case "VERIFIED":
      return { label: "Geverifieerd", Icon: Check, tone: C.green };
    case "SUBMITTED":
      return { label: "In beoordeling", Icon: Clock, tone: C.amber };
    case "EXPIRING":
      return { label: "Verloopt binnenkort", Icon: AlertTriangle, tone: C.amberDeep };
    case "REJECTED":
      return { label: "Afgewezen", Icon: XCircle, tone: C.rust };
  }
}

// ── Herbruikbare bouwstenen ──────────────────────────────────────────────────
function Panel({
  children,
  className = "",
  interactive = false,
  accent,
}: {
  children: React.ReactNode;
  className?: string;
  interactive?: boolean;
  accent?: string;
}) {
  return (
    <div
      className={`relative rounded-2xl ${
        interactive
          ? "transition-transform duration-200 hover:-translate-y-0.5 motion-reduce:hover:translate-y-0"
          : ""
      } ${className}`}
      style={{
        background: C.panel,
        border: `1px solid ${C.line}`,
        boxShadow: "0 1px 2px rgba(42,32,21,0.05), inset 0 1px 0 rgba(255,255,255,0.4)",
        ...(accent ? { borderLeft: `3px solid ${accent}` } : null),
      }}
    >
      {children}
    </div>
  );
}

function Pill({
  children,
  tone,
  solid = false,
}: {
  children: React.ReactNode;
  tone: string;
  solid?: boolean;
}) {
  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold leading-none"
      style={
        solid
          ? { background: tone, color: C.panel }
          : { background: `${tone}18`, color: tone, border: `1px solid ${tone}40` }
      }
    >
      {children}
    </span>
  );
}

function Spark({ data, tone }: { data: number[]; tone: string }) {
  const max = Math.max(...data);
  const min = Math.min(...data);
  const span = max - min || 1;
  const pts = data.map((v, i) => {
    const x = (i / (data.length - 1)) * 100;
    const y = 100 - ((v - min) / span) * 100;
    return `${x},${y}`;
  });
  return (
    <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="h-8 w-full" aria-hidden="true">
      <polyline
        points={`0,100 ${pts.join(" ")} 100,100`}
        fill={tone}
        opacity={0.12}
        stroke="none"
      />
      <polyline
        points={pts.join(" ")}
        fill="none"
        stroke={tone}
        strokeWidth={3}
        strokeLinecap="round"
        strokeLinejoin="round"
        vectorEffect="non-scaling-stroke"
      />
    </svg>
  );
}

function SectionKop({ children, sub }: { children: React.ReactNode; sub?: string }) {
  return (
    <div className="flex items-center gap-3">
      <RingDisc size={34} rings={5} />
      <div>
        {sub && (
          <div
            className="mb-0.5 text-[10.5px] font-bold uppercase tracking-[0.26em]"
            style={{ color: C.amber }}
          >
            {sub}
          </div>
        )}
        <h2
          className="text-[25px] font-medium leading-none tracking-[-0.01em] sm:text-[30px]"
          style={{ ...display, color: C.fg }}
        >
          {children}
        </h2>
      </div>
    </div>
  );
}

export function Concept130() {
  const [screen, setScreen] = useState<ScreenKey>("dashboard");
  const active = OPDRACHTEN[0] as Opdracht;

  return (
    <div
      className="min-h-[680px] w-full antialiased"
      style={{ ...ui, background: C.bg, backgroundImage: woodGrain, color: C.fg }}
    >
      {/* Kop — jaarring-merk */}
      <header className="mx-auto flex max-w-5xl items-center justify-between px-5 pt-8 md:px-10">
        <div className="flex items-center gap-3.5">
          <RingDisc size={46} rings={7} filled={4} />
          <div className="leading-none">
            <div
              className="text-[21px] font-medium tracking-[-0.01em]"
              style={{ ...display, color: C.fg }}
            >
              Jaarringen
            </div>
            <div
              className="mt-1 flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.22em]"
              style={{ color: C.fgFaint }}
            >
              <TreePine size={11} strokeWidth={2.4} aria-hidden="true" /> ZZP · Platform
            </div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="hidden text-right leading-tight sm:block">
            <div className="text-[13px] font-semibold" style={{ color: C.fg }}>
              {PROFIEL.naam}
            </div>
            <div className="text-[11px]" style={{ color: C.fgSoft }}>
              {PROFIEL.rol}
            </div>
          </div>
          <span
            className="flex h-11 w-11 items-center justify-center rounded-full text-[13px] font-semibold"
            style={{ background: C.kern, color: C.panel }}
            aria-hidden="true"
          >
            {PROFIEL.initialen}
          </span>
        </div>
      </header>

      {/* Navigatie — tab-strip met kernhout-onderstreping */}
      <nav
        className="mx-auto mt-6 flex max-w-5xl items-center gap-1 overflow-x-auto px-5 md:px-10"
        aria-label="Hoofdnavigatie"
        style={{ borderBottom: `1px solid ${C.line}` }}
      >
        {SCREENS.map((s) => {
          const on = s.key === screen;
          return (
            <button
              key={s.key}
              onClick={() => setScreen(s.key)}
              aria-current={on ? "page" : undefined}
              className="relative shrink-0 px-3.5 py-2.5 text-[13px] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
              style={{ color: on ? C.fg : C.fgSoft, fontWeight: on ? 700 : 500 }}
            >
              {s.label}
              {on && (
                <span
                  className="absolute -bottom-px left-2 right-2 h-[3px] rounded-t-full"
                  style={{ background: C.amber }}
                  aria-hidden="true"
                />
              )}
            </button>
          );
        })}
      </nav>

      <main className="mx-auto max-w-5xl px-5 py-9 md:px-10 md:py-12">
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
  );
}

function Dashboard({ onOpen, onActies }: { onOpen: () => void; onActies: () => void }) {
  const primair = ACTIES[0] as (typeof ACTIES)[number];
  const top = OPDRACHTEN[0] as Opdracht;
  const tones = [C.amber, C.green, C.kern, C.rust];
  return (
    <div className="space-y-10">
      <section>
        <div
          className="flex items-center gap-2 text-[10.5px] font-bold uppercase tracking-[0.26em]"
          style={{ color: C.amber }}
        >
          <TreePine size={12} strokeWidth={2.6} aria-hidden="true" /> Vandaag · {PROFIEL.plaats}
        </div>
        <h1
          className="mt-2 text-[34px] font-medium leading-[1.04] tracking-[-0.02em] sm:text-[44px]"
          style={{ ...display, color: C.fg }}
        >
          Goedemorgen, {PROFIEL.naam.split(" ")[0]}
        </h1>
        <p className="mt-2 max-w-md text-[14px] leading-relaxed" style={{ color: C.fgSoft }}>
          Je stam groeit gestaag. Eén verse ring vraagt vandaag om aandacht — de kern staat stevig.
        </p>
      </section>

      {/* Primaire actie */}
      <Panel accent={C.rust} className="p-0">
        <div className="flex flex-col gap-5 p-6 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex min-w-0 items-start gap-4">
            <RingDisc size={46} rings={6} className="mt-0.5" />
            <div className="min-w-0">
              <span
                className="inline-flex items-center gap-1.5 text-[10.5px] font-bold uppercase tracking-[0.2em]"
                style={{ color: C.rust }}
              >
                <AlertTriangle size={13} strokeWidth={2.6} aria-hidden="true" /> Vraagt aandacht
              </span>
              <h2
                className="mt-1.5 text-[23px] font-medium leading-tight sm:text-[26px]"
                style={{ ...display, color: C.fg }}
              >
                {primair.titel}
              </h2>
              <p
                className="mt-1.5 max-w-md text-[13px] leading-relaxed"
                style={{ color: C.fgSoft }}
              >
                {primair.detail}
              </p>
            </div>
          </div>
          <button
            onClick={onActies}
            className="group inline-flex shrink-0 items-center gap-2.5 rounded-full px-6 py-3 text-[13px] font-semibold transition-all hover:gap-3.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 motion-reduce:hover:gap-2.5"
            style={{ background: C.amber, color: C.panel }}
          >
            {primair.cta}
            <ArrowRight size={16} aria-hidden="true" />
          </button>
        </div>
      </Panel>

      {/* KPI-tegels */}
      <section>
        <SectionKop sub="In cijfers">Prestatie</SectionKop>
        <div className="mt-5 grid grid-cols-2 gap-4 lg:grid-cols-4">
          {KPIS.map((k, i) => {
            const tone = tones[i % tones.length] as string;
            return (
              <Panel key={k.label} interactive className="p-4">
                <div className="flex items-start justify-between">
                  <RingDisc size={22} rings={4} />
                  <span
                    className="text-[11px] font-semibold tabular-nums"
                    style={{ color: k.up ? C.green : C.rust }}
                  >
                    {k.up ? "▲" : "▼"} {k.trend}
                  </span>
                </div>
                <div
                  className="mt-3 text-[27px] font-medium tabular-nums leading-none tracking-[-0.01em]"
                  style={{ ...display, color: C.fg }}
                >
                  {k.value}
                </div>
                <div className="mt-1 text-[11.5px]" style={{ color: C.fgSoft }}>
                  {k.label}
                </div>
                <div className="mt-3">
                  <Spark data={k.spark} tone={tone} />
                </div>
              </Panel>
            );
          })}
        </div>
      </section>

      {/* Top-match */}
      <section>
        <SectionKop sub="Beste match">Voor jou</SectionKop>
        <button
          onClick={onOpen}
          className="group mt-5 block w-full text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
        >
          <Panel interactive className="flex flex-col gap-5 p-5 sm:flex-row sm:items-center">
            <span
              className="relative flex h-20 w-20 shrink-0 flex-col items-center justify-center overflow-hidden rounded-full"
              aria-hidden="true"
            >
              <span className="absolute inset-0">
                <RingsArt rings={7} filled={6} />
              </span>
              <span
                className="relative rounded-full px-2 py-1 text-center leading-none"
                style={{ background: "rgba(251,246,236,0.86)" }}
              >
                <span
                  className="block text-[22px] font-medium tabular-nums"
                  style={{ ...display, color: C.fg }}
                >
                  {top.match}
                </span>
                <span
                  className="block text-[8px] font-bold uppercase tracking-[0.14em]"
                  style={{ color: C.amber }}
                >
                  match
                </span>
              </span>
            </span>
            <div className="min-w-0 flex-1">
              <h3
                className="text-[20px] font-medium leading-tight"
                style={{ ...display, color: C.fg }}
              >
                {top.titel}
              </h3>
              <div className="mt-1 text-[12.5px]" style={{ color: C.fgSoft }}>
                {top.opdrachtgever} · {top.plaats} · {top.tarief}
              </div>
              <div className="mt-3 flex flex-wrap gap-1.5">
                {top.tags.map((t) => (
                  <Pill key={t} tone={C.amber}>
                    {t}
                  </Pill>
                ))}
              </div>
            </div>
            <ArrowRight
              size={22}
              className="hidden shrink-0 transition-transform group-hover:translate-x-1 motion-reduce:group-hover:translate-x-0 md:block"
              style={{ color: C.amber }}
              aria-hidden="true"
            />
          </Panel>
        </button>
      </section>
    </div>
  );
}

function MatchMeter({ value }: { value: number }) {
  return (
    <div className="flex items-center gap-2">
      <div
        className="relative h-2 w-24 overflow-hidden rounded-full"
        style={{ background: C.panelSoft }}
        aria-hidden="true"
      >
        <div
          className="absolute inset-y-0 left-0 rounded-full"
          style={{ width: `${value}%`, background: value >= 90 ? C.green : C.amber }}
        />
      </div>
      <span
        className="text-[13px] font-semibold tabular-nums"
        style={{ color: value >= 90 ? C.green : C.amber }}
      >
        {value}%
      </span>
    </div>
  );
}

function Marktplaats({ onOpen }: { onOpen: () => void }) {
  const [q, setQ] = useState("");
  const filtered = OPDRACHTEN.filter(
    (o) =>
      o.titel.toLowerCase().includes(q.toLowerCase()) ||
      o.plaats.toLowerCase().includes(q.toLowerCase()) ||
      o.opdrachtgever.toLowerCase().includes(q.toLowerCase()),
  );
  return (
    <div className="space-y-7">
      <SectionKop sub="Open opdrachten">Marktplaats</SectionKop>

      <Panel className="flex items-center gap-3 px-4">
        <Search size={17} style={{ color: C.fgFaint }} aria-hidden="true" />
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Zoek op titel, plaats of opdrachtgever…"
          aria-label="Opdrachten zoeken"
          className="w-full bg-transparent py-3 text-[14px] outline-none placeholder:opacity-50"
          style={{ color: C.fg }}
        />
        <span
          className="shrink-0 text-[12px] font-semibold tabular-nums"
          style={{ color: C.fgFaint }}
        >
          {filtered.length}
        </span>
      </Panel>

      {filtered.length === 0 ? (
        <Panel className="flex flex-col items-center justify-center gap-3 p-14 text-center">
          <RingDisc size={54} rings={7} />
          <p className="text-[20px] font-medium" style={{ ...display, color: C.fg }}>
            Geen opdrachten gevonden
          </p>
          <p className="max-w-xs text-[13px]" style={{ color: C.fgSoft }}>
            Niets past bij “{q}”. Verruim je zoekopdracht of je beschikbaarheid.
          </p>
          <button
            onClick={() => setQ("")}
            className="mt-2 inline-flex items-center gap-2 rounded-full px-4 py-2 text-[12px] font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
            style={{ background: C.amber, color: C.panel }}
          >
            Zoekopdracht wissen
          </button>
        </Panel>
      ) : (
        <ul className="space-y-3">
          {filtered.map((o) => (
            <li key={o.id}>
              <button
                onClick={onOpen}
                className="group block w-full text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
              >
                <Panel interactive className="flex flex-col gap-4 p-4 sm:flex-row sm:items-center">
                  <RingDisc
                    size={44}
                    rings={6}
                    filled={Math.round((o.match / 100) * 6)}
                    className="hidden sm:inline-flex"
                  />
                  <div className="min-w-0 flex-1">
                    <h3
                      className="text-[18px] font-medium leading-tight"
                      style={{ ...display, color: C.fg }}
                    >
                      {o.titel}
                    </h3>
                    <div className="mt-0.5 text-[12.5px]" style={{ color: C.fgSoft }}>
                      {o.opdrachtgever} · {o.plaats} · {o.tarief}
                    </div>
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {o.tags.map((t) => (
                        <Pill key={t} tone={C.fgSoft}>
                          {t}
                        </Pill>
                      ))}
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <MatchMeter value={o.match} />
                    <ArrowRight
                      size={19}
                      className="shrink-0 transition-transform group-hover:translate-x-1 motion-reduce:group-hover:translate-x-0"
                      style={{ color: C.amber }}
                      aria-hidden="true"
                    />
                  </div>
                </Panel>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function OpdrachtDetail({ opdracht, onBack }: { opdracht: Opdracht; onBack: () => void }) {
  const feiten: { l: string; v: string; Icon: LucideIcon }[] = [
    { l: "Tarief", v: opdracht.tarief, Icon: Coins },
    { l: "Omvang", v: opdracht.uren, Icon: Clock },
    { l: "Start", v: opdracht.start, Icon: CalendarDays },
    { l: "Plaats", v: opdracht.plaats, Icon: MapPin },
  ];
  return (
    <div className="space-y-7">
      <button
        onClick={onBack}
        className="inline-flex items-center gap-2 text-[12.5px] font-semibold transition-opacity hover:opacity-60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
        style={{ color: C.fgSoft }}
      >
        <ArrowRight size={14} className="rotate-180" aria-hidden="true" /> Terug naar marktplaats
      </button>

      <section className="flex items-start gap-4">
        <RingDisc size={50} rings={7} filled={6} className="mt-1" />
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span
              className="text-[11px] font-bold uppercase tracking-[0.18em]"
              style={{ color: C.fgFaint }}
            >
              {opdracht.id}
            </span>
            <Pill tone={C.amber} solid>
              {opdracht.match}% match
            </Pill>
          </div>
          <h1
            className="mt-2 text-[30px] font-medium leading-[1.08] tracking-[-0.02em] sm:text-[38px]"
            style={{ ...display, color: C.fg }}
          >
            {opdracht.titel}
          </h1>
          <p className="mt-1.5 text-[13.5px]" style={{ color: C.fgSoft }}>
            {opdracht.opdrachtgever} · {opdracht.plaats}
          </p>
        </div>
      </section>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {feiten.map((m) => (
          <Panel key={m.l} className="p-4">
            <m.Icon size={16} style={{ color: C.amber }} aria-hidden="true" />
            <div
              className="mt-2 text-[18px] font-medium tabular-nums leading-none"
              style={{ ...display, color: C.fg }}
            >
              {m.v}
            </div>
            <div
              className="mt-1.5 text-[10.5px] font-semibold uppercase tracking-[0.12em]"
              style={{ color: C.fgFaint }}
            >
              {m.l}
            </div>
          </Panel>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <Panel className="p-5" accent={C.green}>
          <div
            className="inline-flex items-center gap-2 text-[11.5px] font-bold uppercase tracking-[0.14em]"
            style={{ color: C.green }}
          >
            <Check size={14} strokeWidth={2.8} aria-hidden="true" /> Wat past
          </div>
          <ul className="mt-4 space-y-3">
            {opdracht.redenen.plus.map((r) => (
              <li
                key={r}
                className="flex items-start gap-3 text-[14px] leading-snug"
                style={{ color: C.fg }}
              >
                <Check
                  size={16}
                  strokeWidth={2.6}
                  className="mt-0.5 shrink-0"
                  style={{ color: C.green }}
                  aria-hidden="true"
                />
                {r}
              </li>
            ))}
          </ul>
        </Panel>
        <Panel className="p-5" accent={C.amberDeep}>
          <div
            className="inline-flex items-center gap-2 text-[11.5px] font-bold uppercase tracking-[0.14em]"
            style={{ color: C.amberDeep }}
          >
            <AlertTriangle size={14} strokeWidth={2.8} aria-hidden="true" /> Aandacht
          </div>
          <ul className="mt-4 space-y-3">
            {opdracht.redenen.min.map((r) => (
              <li
                key={r}
                className="flex items-start gap-3 text-[14px] leading-snug"
                style={{ color: C.fg }}
              >
                <span
                  className="mt-1.5 h-2 w-2 shrink-0 rounded-full"
                  style={{ background: C.amberDeep }}
                  aria-hidden="true"
                />
                {r}
              </li>
            ))}
          </ul>
        </Panel>
      </div>

      <div className="flex flex-col items-stretch gap-3 pt-1 sm:flex-row">
        <button
          className="group inline-flex flex-1 items-center justify-center gap-2.5 rounded-full px-7 py-3.5 text-[14px] font-semibold transition-all hover:gap-3.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 motion-reduce:hover:gap-2.5"
          style={{ background: C.amber, color: C.panel }}
        >
          Reageer op opdracht <ArrowRight size={16} aria-hidden="true" />
        </button>
        <button
          className="inline-flex items-center justify-center gap-2 rounded-full px-6 py-3.5 text-[14px] font-semibold transition-colors hover:bg-black/[0.03] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
          style={{ border: `1px solid ${C.lineStrong}`, color: C.fg }}
        >
          Bewaar voor later
        </button>
      </div>
    </div>
  );
}

function Verificatie() {
  const verified = CREDENTIALS.filter((c) => c.status === "VERIFIED").length;
  const pct = Math.round((verified / CREDENTIALS.length) * 100);
  return (
    <div className="space-y-7">
      <SectionKop sub="Vertrouwen">Verificatie</SectionKop>

      {/* Vertrouwens-overzicht als jaarring-doorsnede */}
      <Panel accent={C.amber} className="flex flex-col items-center gap-6 p-6 sm:flex-row">
        <div className="relative h-28 w-28 shrink-0" aria-hidden="true">
          <RingsArt rings={CREDENTIALS.length + 3} filled={verified} />
          <div className="absolute inset-0 flex items-center justify-center">
            <span
              className="rounded-full px-2.5 py-1.5 text-center leading-none"
              style={{ background: "rgba(251,246,236,0.86)" }}
            >
              <span
                className="block text-[24px] font-medium tabular-nums"
                style={{ ...display, color: C.fg }}
              >
                {pct}%
              </span>
              <span
                className="block text-[8.5px] font-bold uppercase tracking-[0.16em]"
                style={{ color: C.amber }}
              >
                gedekt
              </span>
            </span>
          </div>
        </div>
        <div className="text-center sm:text-left">
          <span
            className="inline-flex items-center gap-2 rounded-full px-3 py-1 text-[12px] font-semibold"
            style={{ background: `${C.green}18`, color: C.green }}
          >
            <ShieldCheck size={15} strokeWidth={2.4} aria-hidden="true" /> {PROFIEL.trust}
          </span>
          <p className="mt-3 max-w-md text-[14px] leading-relaxed" style={{ color: C.fgSoft }}>
            {verified} van {CREDENTIALS.length} credentials volledig geverifieerd. Elke
            geverifieerde ring maakt je stam sterker — één dossier vraagt binnenkort om vernieuwing.
          </p>
        </div>
      </Panel>

      <ul className="space-y-3">
        {CREDENTIALS.map((c) => {
          const st = statusMeta(c.status);
          return (
            <li key={c.naam}>
              <Panel className="flex items-center gap-4 p-4">
                <span
                  className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full"
                  style={{
                    background: `${st.tone}18`,
                    border: `1px solid ${st.tone}44`,
                    color: st.tone,
                  }}
                  aria-hidden="true"
                >
                  <st.Icon size={18} strokeWidth={2.4} />
                </span>
                <div className="min-w-0 flex-1">
                  <div
                    className="text-[15px] font-medium leading-tight"
                    style={{ ...display, color: C.fg }}
                  >
                    {c.naam}
                  </div>
                  <div className="mt-0.5 text-[12px]" style={{ color: C.fgSoft }}>
                    {c.detail}
                  </div>
                </div>
                <Pill tone={st.tone}>
                  <st.Icon size={12} strokeWidth={2.8} aria-hidden="true" />
                  <span className="hidden sm:inline">{st.label}</span>
                </Pill>
              </Panel>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

function Acties() {
  const sorted = [...ACTIES].sort((a, b) =>
    a.urgentie === b.urgentie ? 0 : a.urgentie === "warning" ? -1 : 1,
  );
  return (
    <div className="space-y-7">
      <SectionKop sub="De volgende beste stap">Volgende acties</SectionKop>
      <ol className="space-y-3">
        {sorted.map((a, i) => {
          const warn = a.urgentie === "warning";
          const tone = warn ? C.rust : C.amber;
          return (
            <li key={a.titel}>
              <Panel
                className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center"
                accent={warn ? C.rust : undefined}
              >
                <span
                  className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-[16px] font-medium tabular-nums"
                  style={{ background: `${tone}18`, color: tone, border: `1px solid ${tone}44` }}
                  aria-hidden="true"
                >
                  <span style={display}>{i + 1}</span>
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    {warn ? (
                      <AlertTriangle
                        size={14}
                        strokeWidth={2.6}
                        style={{ color: tone }}
                        aria-hidden="true"
                      />
                    ) : (
                      <TreePine
                        size={14}
                        strokeWidth={2.6}
                        style={{ color: tone }}
                        aria-hidden="true"
                      />
                    )}
                    <h3
                      className="text-[17px] font-medium leading-tight"
                      style={{ ...display, color: C.fg }}
                    >
                      {a.titel}
                    </h3>
                    <span className="sr-only">{warn ? "Urgent" : "Informatief"}</span>
                  </div>
                  <p className="mt-1.5 text-[13px] leading-relaxed" style={{ color: C.fgSoft }}>
                    {a.detail}
                  </p>
                </div>
                <button
                  className="shrink-0 self-start rounded-full px-5 py-2.5 text-[12.5px] font-semibold transition-transform hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 motion-reduce:hover:translate-y-0 sm:self-center"
                  style={{ background: tone, color: C.panel }}
                >
                  {a.cta}
                </button>
              </Panel>
            </li>
          );
        })}
      </ol>
    </div>
  );
}

function Facturen() {
  const total = "€ 8.622";
  const badge = (status: string): string => {
    if (status === "Betaald") return C.green;
    if (status === "Openstaand") return C.rust;
    if (status === "Concept") return C.fgFaint;
    return C.amber;
  };
  return (
    <div className="space-y-7">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <SectionKop sub="Omzet">Facturen</SectionKop>
        <button
          className="inline-flex items-center gap-2 rounded-full px-4 py-2.5 text-[12.5px] font-semibold transition-all hover:gap-3 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 motion-reduce:hover:gap-2"
          style={{ background: C.amber, color: C.panel }}
        >
          <Plus size={15} aria-hidden="true" /> Nieuwe factuur
        </button>
      </div>

      <Panel className="overflow-x-auto">
        <table className="w-full min-w-[560px] border-collapse text-left">
          <thead>
            <tr style={{ borderBottom: `1px solid ${C.lineStrong}` }}>
              {["Nummer", "Klant", "Datum", "Status", "Bedrag"].map((h, i) => (
                <th
                  key={h}
                  className={`px-4 py-3 text-[10.5px] font-bold uppercase tracking-[0.12em] ${i === 4 ? "text-right" : ""}`}
                  style={{ color: C.fgFaint }}
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {FACTUREN.map((f) => {
              const tone = badge(f.status);
              return (
                <tr
                  key={f.nr}
                  className="transition-colors hover:bg-black/[0.02]"
                  style={{ borderBottom: `1px solid ${C.line}` }}
                >
                  <td
                    className="px-4 py-3.5 text-[12.5px] tabular-nums"
                    style={{ color: C.fgSoft }}
                  >
                    {f.nr}
                  </td>
                  <td className="px-4 py-3.5 text-[14px]" style={{ color: C.fg }}>
                    {f.klant}
                  </td>
                  <td
                    className="px-4 py-3.5 text-[12.5px] tabular-nums"
                    style={{ color: C.fgSoft }}
                  >
                    {f.datum}
                  </td>
                  <td className="px-4 py-3.5">
                    <Pill tone={tone}>
                      <span
                        className="h-1.5 w-1.5 rounded-full"
                        style={{ background: tone }}
                        aria-hidden="true"
                      />
                      {f.status}
                    </Pill>
                  </td>
                  <td
                    className="px-4 py-3.5 text-right text-[15px] font-medium tabular-nums"
                    style={{ ...display, color: C.fg }}
                  >
                    {f.bedrag}
                  </td>
                </tr>
              );
            })}
          </tbody>
          <tfoot>
            <tr style={{ borderTop: `2px solid ${C.lineStrong}` }}>
              <td
                colSpan={4}
                className="px-4 py-4 text-[10.5px] font-bold uppercase tracking-[0.14em]"
                style={{ color: C.fgFaint }}
              >
                Totaal betaald
              </td>
              <td
                className="px-4 py-4 text-right text-[19px] font-medium tabular-nums"
                style={{ ...display, color: C.green }}
              >
                {total}
              </td>
            </tr>
          </tfoot>
        </table>
      </Panel>
    </div>
  );
}
