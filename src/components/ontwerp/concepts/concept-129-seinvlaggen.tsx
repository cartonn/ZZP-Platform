"use client";

// Concept 129 — "Seinvlaggen" · internationale maritieme seinvlaggen als codetaal.
// Elke rol, status en sectie krijgt een seinvlag-motief: kwart-vlakken, diagonalen, cirkels en
// balken in seinrood (#e23b2e), signaalgeel (#f4c22b), marineblauw (#1857a6), wit en zwart.
// De vlaggen vormen een status-alfabet — een codesysteem dat je op afstand leest, net als op zee.
// Strak geordend op een licht doek (#f2f4f7) met donker marineblauw-zwart schrift (#0f1a2b).
// Onderscheidend van hi-vis workwear (Signaal) en geometrische primitieven (Bauhaus): dit is
// specifiek de MARITIEME SEINVLAG-codetaal. Fonts: Space Grotesk (display) + Inter (UI).

import { useState } from "react";
import {
  ArrowRight,
  Check,
  Clock,
  AlertTriangle,
  XCircle,
  Search,
  Flag,
  ShieldCheck,
  Plus,
  MapPin,
  Coins,
  CalendarDays,
  Anchor,
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

// Seinvlag-palet — de vijf klassieke vlagkleuren op een licht doek.
const C = {
  bg: "#f2f4f7", // licht doek
  bgPanel: "#ffffff", // wit vlagveld / paneel
  bgSoft: "#e7ebf1", // gedempt paneel
  fg: "#0f1a2b", // marineblauw-zwart schrift
  fgSoft: "#5a6577", // gedempt schrift
  fgFaint: "#8a94a3",
  red: "#e23b2e", // seinrood (accent)
  redDeep: "#c22a20",
  yellow: "#f4c22b", // signaalgeel
  blue: "#1857a6", // marineblauw
  blueDeep: "#123f78",
  green: "#1f8a5b", // geverifieerd
  white: "#ffffff",
  black: "#0f1a2b",
  line: "#d3dae3",
  lineStrong: "#b7c1cd",
};

const display = { fontFamily: "var(--font-lab-space)" };
const ui = { fontFamily: "var(--font-lab-inter)" };

// ── Seinvlag-motieven ────────────────────────────────────────────────────────
// Een SignalFlag rendert een rechthoekige seinvlag via een variant + kleuren. De varianten volgen
// echte vlagpatronen: kwart-vlakken (N), diagonaal (E), cirkel (I), balken, saltire (M) en frame (W).

type FlagVariant =
  | "quarters"
  | "chequer"
  | "diagonal"
  | "circle"
  | "verticalBars"
  | "horizontalBars"
  | "saltire"
  | "cross"
  | "border";

type FlagSpec = { variant: FlagVariant; colors: [string, string, string?] };

// Naamgeving in de geest van het internationale seinvlag-alfabet.
const FLAGS: Record<string, FlagSpec> = {
  // "A" — verticale splitsing wit/blauw.
  dashboard: { variant: "verticalBars", colors: [C.white, C.blue] },
  // "N" — dambord blauw/wit.
  marktplaats: { variant: "chequer", colors: [C.blue, C.white] },
  // "E" — horizontale splitsing blauw/rood.
  opdracht: { variant: "horizontalBars", colors: [C.blue, C.red] },
  // "I" — geel veld met zwarte cirkel.
  verificatie: { variant: "circle", colors: [C.yellow, C.black] },
  // "V" — wit met rode saltire (urgentie).
  acties: { variant: "saltire", colors: [C.white, C.red] },
  // "R" — rood met geel kruis.
  facturen: { variant: "cross", colors: [C.red, C.yellow] },
  // Merk-vlag — kwart-vlakken in het volle palet.
  brand: { variant: "quarters", colors: [C.red, C.yellow, C.blue] },
};

function FlagArt({ variant, colors, r = 2 }: FlagSpec & { r?: number }) {
  const [a, b, c] = colors;
  const w = 24;
  const h = 24;
  const clip = "flagClip";
  return (
    <svg viewBox="0 0 24 24" className="h-full w-full" aria-hidden="true">
      <defs>
        <clipPath id={clip}>
          <rect x="0" y="0" width={w} height={h} rx={r} />
        </clipPath>
      </defs>
      <g clipPath={`url(#${clip})`}>
        <rect x="0" y="0" width={w} height={h} fill={a} />
        {variant === "quarters" && (
          <>
            <rect x="0" y="0" width={12} height={12} fill={a} />
            <rect x="12" y="0" width={12} height={12} fill={b} />
            <rect x="0" y="12" width={12} height={12} fill={c ?? b} />
            <rect x="12" y="12" width={12} height={12} fill={a} />
          </>
        )}
        {variant === "chequer" && (
          <>
            {[0, 1, 2, 3].map((row) =>
              [0, 1, 2, 3].map((col) => (
                <rect
                  key={`${row}-${col}`}
                  x={col * 6}
                  y={row * 6}
                  width={6}
                  height={6}
                  fill={(row + col) % 2 === 0 ? a : b}
                />
              )),
            )}
          </>
        )}
        {variant === "diagonal" && <polygon points="0,0 24,0 0,24" fill={a} />}
        {variant === "circle" && (
          <>
            <rect x="0" y="0" width={w} height={h} fill={a} />
            <circle cx="12" cy="12" r="6.4" fill={b} />
          </>
        )}
        {variant === "verticalBars" && (
          <>
            <rect x="0" y="0" width={12} height={h} fill={a} />
            <rect x="12" y="0" width={12} height={h} fill={b} />
          </>
        )}
        {variant === "horizontalBars" && (
          <>
            <rect x="0" y="0" width={w} height={12} fill={a} />
            <rect x="0" y="12" width={w} height={12} fill={b} />
          </>
        )}
        {variant === "saltire" && (
          <>
            <rect x="0" y="0" width={w} height={h} fill={a} />
            <path d="M0 0 L24 24 M24 0 L0 24" stroke={b} strokeWidth="5" />
          </>
        )}
        {variant === "cross" && (
          <>
            <rect x="0" y="0" width={w} height={h} fill={a} />
            <rect x="9" y="0" width={6} height={h} fill={b} />
            <rect x="0" y="9" width={w} height={6} fill={b} />
          </>
        )}
        {variant === "border" && (
          <>
            <rect x="0" y="0" width={w} height={h} fill={b} />
            <rect x="5" y="5" width={14} height={14} fill={a} />
          </>
        )}
        <rect
          x="0.5"
          y="0.5"
          width={w - 1}
          height={h - 1}
          rx={r}
          fill="none"
          stroke="rgba(15,26,43,0.16)"
          strokeWidth="1"
        />
      </g>
    </svg>
  );
}

// Compacte seinvlag in een vaste maat — gebruikt als coderende badge.
function Flaglet({
  spec,
  size = 26,
  className = "",
}: {
  spec: FlagSpec;
  size?: number;
  className?: string;
}) {
  return (
    <span
      className={`relative inline-flex shrink-0 overflow-hidden ${className}`}
      style={{
        width: size,
        height: size,
        borderRadius: 4,
        boxShadow: "0 1px 3px rgba(15,26,43,0.18)",
      }}
    >
      <FlagArt {...spec} />
    </span>
  );
}

// ── Status-codering ──────────────────────────────────────────────────────────
function statusMeta(s: CredStatus): {
  label: string;
  Icon: LucideIcon;
  tone: string;
  flag: FlagSpec;
} {
  switch (s) {
    case "VERIFIED":
      return {
        label: "Geverifieerd",
        Icon: Check,
        tone: C.green,
        flag: { variant: "border", colors: [C.green, C.white] },
      };
    case "SUBMITTED":
      return {
        label: "In beoordeling",
        Icon: Clock,
        tone: C.blue,
        flag: { variant: "verticalBars", colors: [C.white, C.blue] },
      };
    case "EXPIRING":
      return {
        label: "Verloopt binnenkort",
        Icon: AlertTriangle,
        tone: C.redDeep,
        flag: { variant: "circle", colors: [C.yellow, C.black] },
      };
    case "REJECTED":
      return {
        label: "Afgewezen",
        Icon: XCircle,
        tone: C.red,
        flag: { variant: "saltire", colors: [C.white, C.red] },
      };
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
      className={`relative rounded-lg ${
        interactive
          ? "transition-transform duration-200 hover:-translate-y-0.5 motion-reduce:hover:translate-y-0"
          : ""
      } ${className}`}
      style={{
        background: C.bgPanel,
        border: `1px solid ${C.line}`,
        boxShadow: "0 1px 2px rgba(15,26,43,0.04)",
        ...(accent ? { borderTop: `3px solid ${accent}` } : null),
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
          ? { background: tone, color: C.white }
          : { background: `${tone}14`, color: tone, border: `1px solid ${tone}44` }
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
      <polyline points={`0,100 ${pts.join(" ")} 100,100`} fill={tone} opacity={0.1} stroke="none" />
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

function SectionKop({
  children,
  sub,
  spec,
}: {
  children: React.ReactNode;
  sub?: string;
  spec?: FlagSpec;
}) {
  return (
    <div className="flex items-center gap-3">
      {spec && <Flaglet spec={spec} size={30} />}
      <div>
        {sub && (
          <div
            className="mb-0.5 text-[10.5px] font-bold uppercase tracking-[0.24em]"
            style={{ color: C.red }}
          >
            {sub}
          </div>
        )}
        <h2
          className="text-[24px] font-semibold leading-none tracking-[-0.02em] sm:text-[28px]"
          style={{ ...display, color: C.fg }}
        >
          {children}
        </h2>
      </div>
    </div>
  );
}

// Vlaggenlijn — decoratieve rij mini-seinvlaggen (halyard).
function Bunting() {
  const specs: FlagSpec[] = [
    { variant: "quarters", colors: [C.red, C.yellow, C.blue] },
    { variant: "diagonal", colors: [C.blue, C.white] },
    { variant: "circle", colors: [C.yellow, C.black] },
    { variant: "chequer", colors: [C.blue, C.white] },
    { variant: "cross", colors: [C.red, C.yellow] },
    { variant: "saltire", colors: [C.white, C.red] },
    { variant: "verticalBars", colors: [C.white, C.blue] },
    { variant: "horizontalBars", colors: [C.blue, C.red] },
  ];
  return (
    <div className="flex items-center gap-1.5 overflow-hidden" aria-hidden="true">
      {specs.concat(specs).map((s, i) => (
        <Flaglet key={i} spec={s} size={18} />
      ))}
    </div>
  );
}

export function Concept129() {
  const [screen, setScreen] = useState<ScreenKey>("dashboard");
  const active = OPDRACHTEN[0] as Opdracht;

  return (
    <div
      className="min-h-[680px] w-full antialiased"
      style={{
        ...ui,
        background: C.bg,
        backgroundImage: "linear-gradient(180deg, #eef2f7 0%, #f2f4f7 22%, #f2f4f7 100%)",
        color: C.fg,
      }}
    >
      {/* Kop — merk-seinvlag */}
      <header className="mx-auto flex max-w-5xl items-center justify-between px-5 pt-8 md:px-10">
        <div className="flex items-center gap-3.5">
          <Flaglet spec={FLAGS.brand as FlagSpec} size={44} />
          <div className="leading-none">
            <div
              className="text-[20px] font-semibold tracking-[-0.02em]"
              style={{ ...display, color: C.fg }}
            >
              Seinvlaggen
            </div>
            <div
              className="mt-1 flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.22em]"
              style={{ color: C.fgFaint }}
            >
              <Anchor size={11} strokeWidth={2.4} aria-hidden="true" /> ZZP · Platform
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
            className="flex h-11 w-11 items-center justify-center rounded-lg text-[13px] font-bold"
            style={{ background: C.blue, color: C.white }}
            aria-hidden="true"
          >
            {PROFIEL.initialen}
          </span>
        </div>
      </header>

      {/* Vlaggenlijn onder de kop */}
      <div className="mx-auto mt-5 max-w-5xl px-5 md:px-10">
        <div
          className="rounded-lg px-3 py-2"
          style={{ background: C.bgSoft, border: `1px solid ${C.line}` }}
        >
          <Bunting />
        </div>
      </div>

      {/* Navigatie — elk scherm met eigen seinvlag-code */}
      <nav
        className="mx-auto mt-4 flex max-w-5xl items-center gap-1 overflow-x-auto px-5 md:px-10"
        aria-label="Hoofdnavigatie"
        style={{ borderBottom: `1px solid ${C.line}` }}
      >
        {SCREENS.map((s) => {
          const on = s.key === screen;
          const spec = (FLAGS[s.key] as FlagSpec | undefined) ?? (FLAGS.brand as FlagSpec);
          return (
            <button
              key={s.key}
              onClick={() => setScreen(s.key)}
              aria-current={on ? "page" : undefined}
              className="relative flex shrink-0 items-center gap-2 px-3 py-2.5 text-[13px] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
              style={{ color: on ? C.fg : C.fgSoft, fontWeight: on ? 700 : 500 }}
            >
              <Flaglet spec={spec} size={on ? 20 : 17} />
              {s.label}
              {on && (
                <span
                  className="absolute -bottom-px left-2 right-2 h-[3px] rounded-t-full"
                  style={{ background: C.red }}
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
  const tones = [C.blue, C.green, C.red, C.yellow];
  return (
    <div className="space-y-10">
      <section>
        <div
          className="flex items-center gap-2 text-[10.5px] font-bold uppercase tracking-[0.24em]"
          style={{ color: C.red }}
        >
          <Flag size={12} strokeWidth={2.6} aria-hidden="true" /> Vandaag · {PROFIEL.plaats}
        </div>
        <h1
          className="mt-2 text-[32px] font-semibold leading-[1.05] tracking-[-0.03em] sm:text-[42px]"
          style={{ ...display, color: C.fg }}
        >
          Goedemorgen, {PROFIEL.naam.split(" ")[0]}
        </h1>
        <p className="mt-2 max-w-md text-[14px] leading-relaxed" style={{ color: C.fgSoft }}>
          Eén vlag staat gehesen: één dossier vraagt vandaag om actie. De rest van je lijn is
          duidelijk.
        </p>
      </section>

      {/* Primaire actie — seinvlag-alarm */}
      <Panel accent={C.red} className="p-0">
        <div className="flex flex-col gap-5 p-6 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex min-w-0 items-start gap-4">
            <Flaglet spec={{ variant: "saltire", colors: [C.white, C.red] }} size={44} />
            <div className="min-w-0">
              <span
                className="inline-flex items-center gap-1.5 text-[10.5px] font-bold uppercase tracking-[0.2em]"
                style={{ color: C.red }}
              >
                <AlertTriangle size={13} strokeWidth={2.6} aria-hidden="true" /> Vraagt aandacht
              </span>
              <h2
                className="mt-1.5 text-[22px] font-semibold leading-tight tracking-[-0.02em] sm:text-[25px]"
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
            className="group inline-flex shrink-0 items-center gap-2.5 rounded-md px-6 py-3 text-[13px] font-semibold text-white transition-all hover:gap-3.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 motion-reduce:hover:gap-2.5"
            style={{ background: C.red }}
          >
            {primair.cta}
            <ArrowRight size={16} aria-hidden="true" />
          </button>
        </div>
      </Panel>

      {/* KPI-tegels */}
      <section>
        <SectionKop sub="In cijfers" spec={{ variant: "circle", colors: [C.yellow, C.black] }}>
          Prestatie
        </SectionKop>
        <div className="mt-5 grid grid-cols-2 gap-4 lg:grid-cols-4">
          {KPIS.map((k, i) => {
            const tone = tones[i % tones.length] as string;
            return (
              <Panel key={k.label} interactive className="p-4">
                <div className="flex items-start justify-between">
                  <span
                    className="h-2.5 w-4 rounded-[1px]"
                    style={{ background: tone }}
                    aria-hidden="true"
                  />
                  <span
                    className="text-[11px] font-semibold tabular-nums"
                    style={{ color: k.up ? C.green : C.redDeep }}
                  >
                    {k.up ? "▲" : "▼"} {k.trend}
                  </span>
                </div>
                <div
                  className="mt-3 text-[26px] font-semibold tabular-nums leading-none tracking-[-0.02em]"
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
        <SectionKop sub="Beste match" spec={{ variant: "chequer", colors: [C.blue, C.white] }}>
          Voor jou
        </SectionKop>
        <button
          onClick={onOpen}
          className="group mt-5 block w-full text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
        >
          <Panel interactive className="flex flex-col gap-5 p-5 sm:flex-row sm:items-center">
            <span
              className="flex h-20 w-20 shrink-0 flex-col items-center justify-center rounded-lg text-white"
              style={{ background: C.blue }}
              aria-hidden="true"
            >
              <span className="text-[26px] font-semibold tabular-nums leading-none" style={display}>
                {top.match}
              </span>
              <span className="text-[9px] font-bold uppercase tracking-[0.16em]">match</span>
            </span>
            <div className="min-w-0 flex-1">
              <h3
                className="text-[19px] font-semibold leading-tight tracking-[-0.01em]"
                style={{ ...display, color: C.fg }}
              >
                {top.titel}
              </h3>
              <div className="mt-1 text-[12.5px]" style={{ color: C.fgSoft }}>
                {top.opdrachtgever} · {top.plaats} · {top.tarief}
              </div>
              <div className="mt-3 flex flex-wrap gap-1.5">
                {top.tags.map((t) => (
                  <Pill key={t} tone={C.blue}>
                    {t}
                  </Pill>
                ))}
              </div>
            </div>
            <ArrowRight
              size={22}
              className="hidden shrink-0 transition-transform group-hover:translate-x-1 motion-reduce:group-hover:translate-x-0 md:block"
              style={{ color: C.red }}
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
        style={{ background: C.bgSoft }}
        aria-hidden="true"
      >
        <div
          className="absolute inset-y-0 left-0 rounded-full"
          style={{ width: `${value}%`, background: value >= 90 ? C.green : C.blue }}
        />
      </div>
      <span
        className="text-[13px] font-semibold tabular-nums"
        style={{ color: value >= 90 ? C.green : C.blue }}
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
      <SectionKop sub="Open opdrachten" spec={{ variant: "chequer", colors: [C.blue, C.white] }}>
        Marktplaats
      </SectionKop>

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
          <Flaglet spec={{ variant: "diagonal", colors: [C.blue, C.white] }} size={40} />
          <p className="text-[19px] font-semibold" style={{ ...display, color: C.fg }}>
            Geen opdrachten in zicht
          </p>
          <p className="max-w-xs text-[13px]" style={{ color: C.fgSoft }}>
            Niets past bij “{q}”. Verruim je zoekopdracht of je beschikbaarheid.
          </p>
          <button
            onClick={() => setQ("")}
            className="mt-2 inline-flex items-center gap-2 rounded-md px-4 py-2 text-[12px] font-semibold text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
            style={{ background: C.blue }}
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
                  <Flaglet
                    spec={{ variant: "horizontalBars", colors: [C.blue, C.red] }}
                    size={40}
                    className="hidden sm:inline-flex"
                  />
                  <div className="min-w-0 flex-1">
                    <h3
                      className="text-[17px] font-semibold leading-tight tracking-[-0.01em]"
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
                      style={{ color: C.red }}
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
        <Flaglet
          spec={{ variant: "horizontalBars", colors: [C.blue, C.red] }}
          size={48}
          className="mt-1"
        />
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span
              className="text-[11px] font-bold uppercase tracking-[0.18em]"
              style={{ color: C.fgFaint }}
            >
              {opdracht.id}
            </span>
            <Pill tone={C.red} solid>
              {opdracht.match}% match
            </Pill>
          </div>
          <h1
            className="mt-2 text-[28px] font-semibold leading-[1.08] tracking-[-0.03em] sm:text-[36px]"
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
            <m.Icon size={16} style={{ color: C.blue }} aria-hidden="true" />
            <div
              className="mt-2 text-[17px] font-semibold tabular-nums leading-none tracking-[-0.01em]"
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
        <Panel className="p-5" accent={C.yellow}>
          <div
            className="inline-flex items-center gap-2 text-[11.5px] font-bold uppercase tracking-[0.14em]"
            style={{ color: C.redDeep }}
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
                  style={{ background: C.redDeep }}
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
          className="group inline-flex flex-1 items-center justify-center gap-2.5 rounded-md px-7 py-3.5 text-[14px] font-semibold text-white transition-all hover:gap-3.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 motion-reduce:hover:gap-2.5"
          style={{ background: C.red }}
        >
          Reageer op opdracht <ArrowRight size={16} aria-hidden="true" />
        </button>
        <button
          className="inline-flex items-center justify-center gap-2 rounded-md px-6 py-3.5 text-[14px] font-semibold transition-colors hover:bg-black/[0.03] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
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
      <SectionKop sub="Vertrouwen" spec={{ variant: "circle", colors: [C.yellow, C.black] }}>
        Verificatie
      </SectionKop>

      {/* Vertrouwens-overzicht */}
      <Panel accent={C.blue} className="flex flex-col items-center gap-6 p-6 sm:flex-row">
        <div className="relative h-24 w-24 shrink-0" aria-hidden="true">
          <svg viewBox="0 0 36 36" className="h-full w-full -rotate-90">
            <circle cx="18" cy="18" r="15.5" fill="none" stroke={C.bgSoft} strokeWidth="3" />
            <circle
              cx="18"
              cy="18"
              r="15.5"
              fill="none"
              stroke={C.blue}
              strokeWidth="3"
              strokeLinecap="round"
              strokeDasharray={`${(pct / 100) * 97.4} 97.4`}
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span
              className="text-[24px] font-semibold tabular-nums leading-none"
              style={{ ...display, color: C.fg }}
            >
              {pct}%
            </span>
            <span
              className="text-[9px] font-bold uppercase tracking-[0.18em]"
              style={{ color: C.fgFaint }}
            >
              gedekt
            </span>
          </div>
        </div>
        <div className="text-center sm:text-left">
          <span
            className="inline-flex items-center gap-2 rounded-full px-3 py-1 text-[12px] font-semibold"
            style={{ background: `${C.green}14`, color: C.green }}
          >
            <ShieldCheck size={15} strokeWidth={2.4} aria-hidden="true" /> {PROFIEL.trust}
          </span>
          <p className="mt-3 max-w-md text-[14px] leading-relaxed" style={{ color: C.fgSoft }}>
            {verified} van {CREDENTIALS.length} credentials volledig geverifieerd. Eén vlag hangt
            halfstok — vernieuw op tijd om verifieerbaar te blijven.
          </p>
        </div>
      </Panel>

      <ul className="space-y-3">
        {CREDENTIALS.map((c) => {
          const st = statusMeta(c.status);
          return (
            <li key={c.naam}>
              <Panel className="flex items-center gap-4 p-4">
                <Flaglet spec={st.flag} size={40} />
                <div className="min-w-0 flex-1">
                  <div
                    className="text-[15px] font-semibold leading-tight tracking-[-0.01em]"
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
      <SectionKop
        sub="De volgende beste stap"
        spec={{ variant: "saltire", colors: [C.white, C.red] }}
      >
        Volgende acties
      </SectionKop>
      <ol className="space-y-3">
        {sorted.map((a, i) => {
          const warn = a.urgentie === "warning";
          const tone = warn ? C.red : C.blue;
          return (
            <li key={a.titel}>
              <Panel
                className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center"
                accent={warn ? C.red : undefined}
              >
                <span
                  className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg text-[16px] font-bold tabular-nums text-white"
                  style={{ background: tone }}
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
                      <Flag
                        size={14}
                        strokeWidth={2.6}
                        style={{ color: tone }}
                        aria-hidden="true"
                      />
                    )}
                    <h3
                      className="text-[16px] font-semibold leading-tight tracking-[-0.01em]"
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
                  className="shrink-0 self-start rounded-md px-5 py-2.5 text-[12.5px] font-semibold text-white transition-transform hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 motion-reduce:hover:translate-y-0 sm:self-center"
                  style={{ background: tone }}
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
    if (status === "Openstaand") return C.red;
    if (status === "Concept") return C.fgFaint;
    return C.blue;
  };
  return (
    <div className="space-y-7">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <SectionKop sub="Omzet" spec={{ variant: "cross", colors: [C.red, C.yellow] }}>
          Facturen
        </SectionKop>
        <button
          className="inline-flex items-center gap-2 rounded-md px-4 py-2.5 text-[12.5px] font-semibold text-white transition-all hover:gap-3 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 motion-reduce:hover:gap-2"
          style={{ background: C.blue }}
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
                    className="px-4 py-3.5 text-right text-[15px] font-semibold tabular-nums"
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
                className="px-4 py-4 text-right text-[19px] font-semibold tabular-nums"
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
