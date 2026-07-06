"use client";

// Concept 138 — "Kruissteek" · geteld kruissteek-borduursampler op naturel linnen.
// Een warm linnen-canvas (#efe7d6) met de logica van GETELDE KRUISSTEEK: een pixel-raster van
// X-steekjes vormt iconen, badges, cijfers en voortgang. Elk motief is opgebouwd uit kleine X'en
// (twee gekruiste diagonalen met een korte kern-highlight), zoals echte handborduur. Een
// sampler-rand omlijst het werk, de aida-stof-textuur schemert door, en DMC-garenkleur-chips
// benoemen elke draad. Warm-nostalgisch handwerk, maar strak georganiseerd — het raster ís de
// layout-grid. Status wordt een geborduurd symbool (kruisje = geverifieerd), voortgang een rij
// gevulde steken. Onderscheidend van textiel (geweven stof & stiksel) en memphis: dit is de
// pixel-X van geteld borduren. Fonts: Spline Mono (pixel-achtig) + Manrope (UI).

import { useMemo, useState } from "react";
import {
  ArrowRight,
  Check,
  Clock,
  AlertTriangle,
  XCircle,
  Search,
  Scissors,
  ShieldCheck,
  Plus,
  MapPin,
  Coins,
  CalendarDays,
  ChevronLeft,
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

// Kruissteek-palet — DMC-garen op naturel linnen.
const C = {
  bg: "#efe7d6", // naturel linnen
  aida: "#e7dcc4", // aida-stof (iets dieper)
  panel: "#f7f1e4", // licht linnen-paneel
  panelSoft: "#ede3d0",
  fg: "#3a3327", // donker garen-schrift
  fgSoft: "#7a6f5c", // gedempt schrift
  fgFaint: "#a89a80",
  red: "#c1435a", // DMC 321-achtig rood (primair accent)
  redDeep: "#9e2f45",
  pink: "#d98aa0", // DMC roze
  sage: "#7b9367", // salie-groen (geverifieerd)
  sageDeep: "#5f7850",
  gold: "#c99a3f", // goud-oker (verloopt/aandacht)
  goldDeep: "#a97e28",
  blue: "#5b7a94", // gedempt blauw (in beoordeling)
  line: "#dcccae", // draad-lijn
  lineStrong: "#c8b590",
  linen: "#e3d8c1",
};

const display = { fontFamily: "var(--font-lab-spline-mono)" };
const ui = { fontFamily: "var(--font-lab-manrope)" };

// ── Kruissteek-primitieven ────────────────────────────────────────────────────
// Eén X-steekje: twee gekruiste diagonalen met een subtiele kern-highlight, precies binnen één
// rastercel. Deterministisch — de "handgemaakte" onregelmatigheid komt uit vaste offsets.
function StitchX({ color, cell = 12, pad = 1.4 }: { color: string; cell?: number; pad?: number }) {
  const a = pad;
  const b = cell - pad;
  return (
    <svg
      width={cell}
      height={cell}
      viewBox={`0 0 ${cell} ${cell}`}
      aria-hidden="true"
      className="block"
    >
      <line x1={a} y1={a} x2={b} y2={b} stroke={color} strokeWidth={2} strokeLinecap="round" />
      <line x1={b} y1={a} x2={a} y2={b} stroke={color} strokeWidth={2} strokeLinecap="round" />
      {/* kern-highlight: dunne lichtere overhand-draad */}
      <line
        x1={a}
        y1={a}
        x2={b}
        y2={b}
        stroke="rgba(255,255,255,0.35)"
        strokeWidth={0.7}
        strokeLinecap="round"
      />
    </svg>
  );
}

// Een klein kruissteek-motief uit een bitmap-grid (1 = steek). Vormt iconen/cijfers uit X'en.
function StitchMotif({
  grid,
  color,
  cell = 11,
  className = "",
}: {
  grid: number[][];
  color: string;
  cell?: number;
  className?: string;
}) {
  const rows = grid.length;
  const cols = grid[0]?.length ?? 0;
  return (
    <svg
      width={cols * cell}
      height={rows * cell}
      viewBox={`0 0 ${cols * cell} ${rows * cell}`}
      aria-hidden="true"
      className={className}
    >
      {grid.map((row, r) =>
        row.map((v, c) =>
          v ? (
            <g key={`${r}-${c}`} transform={`translate(${c * cell} ${r * cell})`}>
              <line
                x1={1.5}
                y1={1.5}
                x2={cell - 1.5}
                y2={cell - 1.5}
                stroke={color}
                strokeWidth={1.9}
                strokeLinecap="round"
              />
              <line
                x1={cell - 1.5}
                y1={1.5}
                x2={1.5}
                y2={cell - 1.5}
                stroke={color}
                strokeWidth={1.9}
                strokeLinecap="round"
              />
              <line
                x1={1.5}
                y1={1.5}
                x2={cell - 1.5}
                y2={cell - 1.5}
                stroke="rgba(255,255,255,0.3)"
                strokeWidth={0.6}
                strokeLinecap="round"
              />
            </g>
          ) : null,
        ),
      )}
    </svg>
  );
}

// Bitmap-motieven (X = steek). Klein, leesbaar als geteld patroon.
const MOTIF = {
  check: [
    [0, 0, 0, 0, 1],
    [0, 0, 0, 1, 0],
    [1, 0, 1, 0, 0],
    [0, 1, 0, 0, 0],
  ],
  heart: [
    [0, 1, 0, 1, 0],
    [1, 1, 1, 1, 1],
    [0, 1, 1, 1, 0],
    [0, 0, 1, 0, 0],
  ],
  flower: [
    [0, 1, 0, 1, 0],
    [1, 1, 1, 1, 1],
    [0, 1, 1, 1, 0],
    [1, 1, 1, 1, 1],
    [0, 1, 0, 1, 0],
  ],
  clock: [
    [0, 1, 1, 1, 0],
    [1, 0, 1, 0, 1],
    [1, 0, 1, 1, 1],
    [0, 1, 1, 1, 0],
  ],
  bang: [
    [0, 1, 0],
    [0, 1, 0],
    [0, 1, 0],
    [0, 0, 0],
    [0, 1, 0],
  ],
  cross: [
    [1, 0, 0, 0, 1],
    [0, 1, 0, 1, 0],
    [0, 0, 1, 0, 0],
    [0, 1, 0, 1, 0],
    [1, 0, 0, 0, 1],
  ],
} as const;

// Aida-stof-textuur — regelmatig weefsel-raster dat door het canvas schemert.
const aidaWeave =
  "repeating-linear-gradient(0deg, rgba(58,51,39,0.05) 0 1px, transparent 1px 11px)," +
  "repeating-linear-gradient(90deg, rgba(58,51,39,0.05) 0 1px, transparent 1px 11px)," +
  "repeating-linear-gradient(0deg, rgba(255,255,255,0.35) 0 1px, transparent 1px 11px)," +
  "radial-gradient(120% 120% at 10% 0%, rgba(255,255,255,0.4), transparent 50%)," +
  "radial-gradient(120% 120% at 90% 100%, rgba(193,67,90,0.05), transparent 55%)";

// Sampler-rand: een geborduurd randmotief rondom het paneel (dubbele draad-lijn met steek-tandjes).
const samplerBorder = (color: string) =>
  `repeating-linear-gradient(90deg, ${color} 0 6px, transparent 6px 12px)`;

// ── Status-codering ──────────────────────────────────────────────────────────
function statusMeta(s: CredStatus): {
  label: string;
  Icon: LucideIcon;
  tone: string;
  motif: number[][];
} {
  switch (s) {
    case "VERIFIED":
      return {
        label: "Geverifieerd",
        Icon: Check,
        tone: C.sage,
        motif: MOTIF.check as unknown as number[][],
      };
    case "SUBMITTED":
      return {
        label: "In beoordeling",
        Icon: Clock,
        tone: C.blue,
        motif: MOTIF.clock as unknown as number[][],
      };
    case "EXPIRING":
      return {
        label: "Verloopt binnenkort",
        Icon: AlertTriangle,
        tone: C.gold,
        motif: MOTIF.bang as unknown as number[][],
      };
    case "REJECTED":
      return {
        label: "Afgewezen",
        Icon: XCircle,
        tone: C.red,
        motif: MOTIF.cross as unknown as number[][],
      };
  }
}

// ── Herbruikbare bouwstenen ──────────────────────────────────────────────────
function Panel({
  children,
  className = "",
  interactive = false,
  accent,
  sampler = false,
}: {
  children: React.ReactNode;
  className?: string;
  interactive?: boolean;
  accent?: string;
  sampler?: boolean;
}) {
  return (
    <div
      className={`relative rounded-lg ${
        interactive
          ? "transition-transform duration-200 hover:-translate-y-0.5 motion-reduce:hover:translate-y-0"
          : ""
      } ${className}`}
      style={{
        background: C.panel,
        border: `1.5px solid ${accent ?? C.lineStrong}`,
        boxShadow: "0 1px 0 rgba(255,255,255,0.6) inset, 0 2px 6px rgba(58,51,39,0.06)",
      }}
    >
      {sampler && (
        <span
          className="pointer-events-none absolute inset-[3px] rounded-[5px]"
          style={{ border: `1px dashed ${accent ? `${accent}66` : C.line}` }}
          aria-hidden="true"
        />
      )}
      {children}
    </div>
  );
}

// Geborduurde badge/chip: motief-kruisje + label (status nooit alléén op kleur).
function StitchChip({
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
      className="inline-flex items-center gap-1.5 rounded-[4px] px-2.5 py-1 text-[11px] font-semibold leading-none"
      style={
        solid
          ? { background: tone, color: C.panel }
          : { background: `${tone}1f`, color: tone, border: `1.5px solid ${tone}` }
      }
    >
      {children}
    </span>
  );
}

// Voortgang als rij van kruissteken (gevuld vs. leeg).
function StitchRow({ total, filled, tone }: { total: number; filled: number; tone: string }) {
  return (
    <span className="inline-flex items-center gap-[3px]" aria-hidden="true">
      {Array.from({ length: total }).map((_, i) => (
        <StitchX key={i} color={i < filled ? tone : C.line} cell={12} />
      ))}
    </span>
  );
}

function Spark({ data, tone }: { data: number[]; tone: string }) {
  // Kruissteek-staafjes: elke waarde als een verticale rij X-steken.
  const max = Math.max(...data);
  const min = Math.min(...data);
  const span = max - min || 1;
  return (
    <span className="flex items-end gap-[3px]" aria-hidden="true">
      {data.map((v, i) => {
        const n = 1 + Math.round(((v - min) / span) * 4); // 1..5 steken hoog
        return (
          <span key={i} className="flex flex-col-reverse gap-[2px]">
            {Array.from({ length: n }).map((_, j) => (
              <StitchX key={j} color={tone} cell={7} pad={1} />
            ))}
          </span>
        );
      })}
    </span>
  );
}

function SectionKop({
  children,
  sub,
  motif = MOTIF.flower as unknown as number[][],
  tone = C.red,
}: {
  children: React.ReactNode;
  sub?: string;
  motif?: number[][];
  tone?: string;
}) {
  return (
    <div className="flex items-center gap-3">
      <span
        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[6px]"
        style={{ background: C.aida, border: `1.5px solid ${C.lineStrong}` }}
        aria-hidden="true"
      >
        <StitchMotif grid={motif} color={tone} cell={6} />
      </span>
      <div>
        {sub && (
          <div
            className="mb-0.5 text-[10px] font-bold uppercase tracking-[0.24em]"
            style={{ color: tone }}
          >
            {sub}
          </div>
        )}
        <h2
          className="text-[22px] font-medium leading-none tracking-[0.02em] sm:text-[26px]"
          style={{ ...display, color: C.fg }}
        >
          {children}
        </h2>
      </div>
    </div>
  );
}

export function Concept138() {
  const [screen, setScreen] = useState<ScreenKey>("dashboard");
  const active = OPDRACHTEN[0] as Opdracht;

  return (
    <div
      className="min-h-[680px] w-full antialiased"
      style={{
        ...ui,
        background: C.bg,
        backgroundImage: aidaWeave,
        backgroundSize: "11px 11px, 11px 11px, 11px 11px, auto, auto",
        color: C.fg,
      }}
    >
      {/* Sampler-bovenrand */}
      <div
        className="h-2 w-full"
        style={{ backgroundImage: samplerBorder(C.red), opacity: 0.7 }}
        aria-hidden="true"
      />

      {/* Kop — de sampler-titel */}
      <header className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-4 px-5 pt-8 md:px-10">
        <div className="flex items-center gap-4">
          <span
            className="flex h-12 w-12 shrink-0 items-center justify-center rounded-[8px]"
            style={{ background: C.aida, border: `1.5px solid ${C.lineStrong}` }}
            aria-hidden="true"
          >
            <StitchMotif grid={MOTIF.heart as unknown as number[][]} color={C.red} cell={8} />
          </span>
          <div className="leading-none">
            <div
              className="text-[22px] font-medium tracking-[0.04em]"
              style={{ ...display, color: C.fg }}
            >
              Kruissteek
            </div>
            <div
              className="mt-1.5 flex items-center gap-1.5 text-[9.5px] font-bold uppercase tracking-[0.26em]"
              style={{ color: C.fgFaint }}
            >
              <Scissors size={11} strokeWidth={2.2} aria-hidden="true" /> ZZP · Sampler
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
            className="flex h-11 w-11 items-center justify-center rounded-[8px] text-[13px] font-semibold"
            style={{ background: C.red, color: C.panel, ...display }}
            aria-hidden="true"
          >
            {PROFIEL.initialen}
          </span>
        </div>
      </header>

      {/* Navigatie — geborduurde tab-strip */}
      <nav
        className="mx-auto mt-6 flex max-w-5xl items-center gap-1.5 overflow-x-auto px-5 pb-1 md:px-10"
        aria-label="Hoofdnavigatie"
      >
        {SCREENS.map((s) => {
          const on = s.key === screen;
          return (
            <button
              key={s.key}
              onClick={() => setScreen(s.key)}
              aria-current={on ? "page" : undefined}
              className="relative shrink-0 rounded-[6px] px-3.5 py-2 text-[12.5px] font-semibold transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
              style={
                on
                  ? { color: C.panel, background: C.red, border: `1.5px solid ${C.redDeep}` }
                  : { color: C.fgSoft, background: "transparent", border: `1.5px solid ${C.line}` }
              }
            >
              {s.label}
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

      <div
        className="h-2 w-full"
        style={{ backgroundImage: samplerBorder(C.sage), opacity: 0.6 }}
        aria-hidden="true"
      />
    </div>
  );
}

function Dashboard({ onOpen, onActies }: { onOpen: () => void; onActies: () => void }) {
  const primair = ACTIES[0] as (typeof ACTIES)[number];
  const top = OPDRACHTEN[0] as Opdracht;
  const tones = [C.red, C.sage, C.gold, C.blue];
  return (
    <div className="space-y-10">
      <section>
        <div
          className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.26em]"
          style={{ color: C.red }}
        >
          <span aria-hidden="true">
            <StitchMotif grid={MOTIF.flower as unknown as number[][]} color={C.red} cell={5} />
          </span>
          Vandaag · {PROFIEL.plaats}
        </div>
        <h1
          className="mt-3 text-[32px] font-medium leading-[1.08] tracking-[0.01em] sm:text-[42px]"
          style={{ ...display, color: C.fg }}
        >
          Goedemorgen, {PROFIEL.naam.split(" ")[0]}
        </h1>
        <p className="mt-3 max-w-md text-[13.5px] leading-relaxed" style={{ color: C.fgSoft }}>
          Rij voor rij groeit je sampler. Eén steek vraagt vandaag om aandacht — de rest ligt strak.
        </p>
      </section>

      {/* Primaire actie */}
      <Panel accent={C.red} sampler className="p-0">
        <div className="flex flex-col gap-5 p-6 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex min-w-0 items-start gap-4">
            <span
              className="mt-0.5 flex h-12 w-12 shrink-0 items-center justify-center rounded-[8px]"
              style={{ background: `${C.red}14`, border: `1.5px solid ${C.red}` }}
              aria-hidden="true"
            >
              <StitchMotif grid={MOTIF.bang as unknown as number[][]} color={C.red} cell={7} />
            </span>
            <div className="min-w-0">
              <span
                className="inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.2em]"
                style={{ color: C.red }}
              >
                <AlertTriangle size={13} strokeWidth={2.6} aria-hidden="true" /> Vraagt aandacht
              </span>
              <h2
                className="mt-1.5 text-[21px] font-medium leading-tight sm:text-[24px]"
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
            className="group inline-flex shrink-0 items-center gap-2.5 rounded-[8px] px-6 py-3 text-[13px] font-semibold transition-all hover:gap-3.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 motion-reduce:hover:gap-2.5"
            style={{ background: C.red, color: C.panel }}
          >
            {primair.cta}
            <ArrowRight size={16} aria-hidden="true" />
          </button>
        </div>
      </Panel>

      {/* KPI-tegels */}
      <section>
        <SectionKop sub="In cijfers" tone={C.sage} motif={MOTIF.flower as unknown as number[][]}>
          Prestatie
        </SectionKop>
        <div className="mt-5 grid grid-cols-2 gap-4 lg:grid-cols-4">
          {KPIS.map((k, i) => {
            const tone = tones[i % tones.length] as string;
            return (
              <Panel key={k.label} interactive accent={`${tone}66`} className="p-4">
                <div className="flex items-start justify-between">
                  <span
                    className="flex h-7 w-7 items-center justify-center rounded-[6px]"
                    style={{ background: `${tone}14`, border: `1px solid ${tone}55` }}
                    aria-hidden="true"
                  >
                    <StitchX color={tone} cell={12} />
                  </span>
                  <span
                    className="text-[11px] font-bold tabular-nums"
                    style={{ color: k.up ? C.sageDeep : C.gold }}
                  >
                    <span aria-hidden="true">{k.up ? "▲" : "▼"}</span>
                    <span className="sr-only">{k.up ? "stijgt" : "daalt"}</span> {k.trend}
                  </span>
                </div>
                <div
                  className="mt-3 text-[24px] font-medium tabular-nums leading-none tracking-[0.01em]"
                  style={{ ...display, color: C.fg }}
                >
                  {k.value}
                </div>
                <div className="mt-1.5 text-[11px]" style={{ color: C.fgSoft }}>
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
        <SectionKop sub="Beste match" tone={C.red} motif={MOTIF.heart as unknown as number[][]}>
          Voor jou
        </SectionKop>
        <button
          onClick={onOpen}
          className="group mt-5 block w-full text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
        >
          <Panel
            interactive
            accent={C.sage}
            sampler
            className="flex flex-col gap-5 p-5 sm:flex-row sm:items-center"
          >
            <span
              className="flex h-20 w-20 shrink-0 flex-col items-center justify-center rounded-[10px]"
              style={{ background: C.aida, border: `2px solid ${C.sage}` }}
              aria-hidden="true"
            >
              <span
                className="text-[22px] font-medium tabular-nums leading-none"
                style={{ ...display, color: C.sageDeep }}
              >
                {top.match}
              </span>
              <span
                className="mt-0.5 text-[8px] font-bold uppercase tracking-[0.14em]"
                style={{ color: C.sage }}
              >
                match
              </span>
            </span>
            <div className="min-w-0 flex-1">
              <h3
                className="text-[18px] font-medium leading-tight"
                style={{ ...display, color: C.fg }}
              >
                {top.titel}
              </h3>
              <div className="mt-1 text-[12px]" style={{ color: C.fgSoft }}>
                {top.opdrachtgever} · {top.plaats} · {top.tarief}
              </div>
              <div className="mt-3 flex flex-wrap gap-1.5">
                {top.tags.map((t) => (
                  <StitchChip key={t} tone={C.red}>
                    {t}
                  </StitchChip>
                ))}
              </div>
            </div>
            <ArrowRight
              size={22}
              className="hidden shrink-0 transition-transform group-hover:translate-x-1 motion-reduce:group-hover:translate-x-0 md:block"
              style={{ color: C.sage }}
              aria-hidden="true"
            />
          </Panel>
        </button>
      </section>
    </div>
  );
}

function MatchMeter({ value }: { value: number }) {
  const tone = value >= 90 ? C.sage : value >= 84 ? C.blue : C.gold;
  const filled = Math.round((value / 100) * 6);
  return (
    <div className="flex items-center gap-2">
      <StitchRow total={6} filled={filled} tone={tone} />
      <span className="text-[13px] font-semibold tabular-nums" style={{ ...display, color: tone }}>
        {value}%
      </span>
    </div>
  );
}

function Marktplaats({ onOpen }: { onOpen: () => void }) {
  const [q, setQ] = useState("");
  const filtered = useMemo(
    () =>
      OPDRACHTEN.filter(
        (o) =>
          o.titel.toLowerCase().includes(q.toLowerCase()) ||
          o.plaats.toLowerCase().includes(q.toLowerCase()) ||
          o.opdrachtgever.toLowerCase().includes(q.toLowerCase()),
      ),
    [q],
  );
  return (
    <div className="space-y-7">
      <SectionKop sub="Open opdrachten" tone={C.red} motif={MOTIF.flower as unknown as number[][]}>
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
          style={{ ...display, color: C.fgFaint }}
        >
          {filtered.length}
        </span>
      </Panel>

      {filtered.length === 0 ? (
        <Panel sampler className="flex flex-col items-center justify-center gap-3 p-14 text-center">
          <span
            className="flex h-14 w-14 items-center justify-center rounded-[10px]"
            style={{ background: C.aida, border: `1.5px solid ${C.lineStrong}` }}
            aria-hidden="true"
          >
            <StitchMotif grid={MOTIF.cross as unknown as number[][]} color={C.fgFaint} cell={8} />
          </span>
          <p className="text-[19px] font-medium" style={{ ...display, color: C.fg }}>
            Geen patroon gevonden
          </p>
          <p className="max-w-xs text-[13px]" style={{ color: C.fgSoft }}>
            Niets past bij “{q}”. Verruim je zoekopdracht of je beschikbaarheid.
          </p>
          <button
            onClick={() => setQ("")}
            className="mt-2 inline-flex items-center gap-2 rounded-[8px] px-4 py-2 text-[12px] font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
            style={{ background: C.red, color: C.panel }}
          >
            Zoekopdracht wissen
          </button>
        </Panel>
      ) : (
        <ul className="space-y-3">
          {filtered.map((o) => {
            const tone = o.match >= 90 ? C.sage : o.match >= 84 ? C.blue : C.gold;
            return (
              <li key={o.id}>
                <button
                  onClick={onOpen}
                  className="group block w-full text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
                >
                  <Panel
                    interactive
                    className="flex flex-col gap-4 p-4 sm:flex-row sm:items-center"
                  >
                    <span
                      className="hidden h-12 w-12 shrink-0 flex-col items-center justify-center rounded-[8px] sm:flex"
                      style={{ background: C.aida, border: `1.5px solid ${tone}` }}
                      aria-hidden="true"
                    >
                      <span
                        className="text-[15px] font-medium tabular-nums leading-none"
                        style={{ ...display, color: tone }}
                      >
                        {o.match}
                      </span>
                    </span>
                    <div className="min-w-0 flex-1">
                      <h3
                        className="text-[17px] font-medium leading-tight"
                        style={{ ...display, color: C.fg }}
                      >
                        {o.titel}
                      </h3>
                      <div className="mt-0.5 text-[12px]" style={{ color: C.fgSoft }}>
                        {o.opdrachtgever} · {o.plaats} · {o.tarief}
                      </div>
                      <div className="mt-2 flex flex-wrap gap-1.5">
                        {o.tags.map((t) => (
                          <StitchChip key={t} tone={C.fgSoft}>
                            {t}
                          </StitchChip>
                        ))}
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <MatchMeter value={o.match} />
                      <ArrowRight
                        size={19}
                        className="shrink-0 transition-transform group-hover:translate-x-1 motion-reduce:group-hover:translate-x-0"
                        style={{ color: tone }}
                        aria-hidden="true"
                      />
                    </div>
                  </Panel>
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

function OpdrachtDetail({ opdracht, onBack }: { opdracht: Opdracht; onBack: () => void }) {
  const feiten: { l: string; v: string; Icon: LucideIcon; tone: string }[] = [
    { l: "Tarief", v: opdracht.tarief, Icon: Coins, tone: C.sage },
    { l: "Omvang", v: opdracht.uren, Icon: Clock, tone: C.blue },
    { l: "Start", v: opdracht.start, Icon: CalendarDays, tone: C.gold },
    { l: "Plaats", v: opdracht.plaats, Icon: MapPin, tone: C.red },
  ];
  return (
    <div className="space-y-7">
      <button
        onClick={onBack}
        className="inline-flex items-center gap-2 text-[12.5px] font-semibold transition-opacity hover:opacity-60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
        style={{ color: C.fgSoft }}
      >
        <ChevronLeft size={15} aria-hidden="true" /> Terug naar marktplaats
      </button>

      <section className="flex items-start gap-4">
        <span
          className="mt-1 flex h-14 w-14 shrink-0 flex-col items-center justify-center rounded-[10px]"
          style={{ background: C.aida, border: `2px solid ${C.sage}` }}
          aria-hidden="true"
        >
          <span
            className="text-[17px] font-medium tabular-nums leading-none"
            style={{ ...display, color: C.sageDeep }}
          >
            {opdracht.match}
          </span>
        </span>
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span
              className="text-[10.5px] font-bold uppercase tracking-[0.16em]"
              style={{ ...display, color: C.fgFaint }}
            >
              {opdracht.id}
            </span>
            <StitchChip tone={C.sage} solid>
              {opdracht.match}% match
            </StitchChip>
          </div>
          <h1
            className="mt-2 text-[27px] font-medium leading-[1.12] tracking-[0.01em] sm:text-[34px]"
            style={{ ...display, color: C.fg }}
          >
            {opdracht.titel}
          </h1>
          <p className="mt-1.5 text-[13px]" style={{ color: C.fgSoft }}>
            {opdracht.opdrachtgever} · {opdracht.plaats}
          </p>
        </div>
      </section>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {feiten.map((m) => (
          <Panel key={m.l} accent={`${m.tone}66`} className="p-4">
            <m.Icon size={16} style={{ color: m.tone }} aria-hidden="true" />
            <div
              className="mt-2 text-[17px] font-medium tabular-nums leading-none"
              style={{ ...display, color: C.fg }}
            >
              {m.v}
            </div>
            <div
              className="mt-1.5 text-[9.5px] font-bold uppercase tracking-[0.14em]"
              style={{ color: C.fgFaint }}
            >
              {m.l}
            </div>
          </Panel>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <Panel accent={C.sage} className="p-5">
          <div
            className="inline-flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.14em]"
            style={{ color: C.sageDeep }}
          >
            <Check size={14} strokeWidth={2.8} aria-hidden="true" /> Wat past
          </div>
          <ul className="mt-4 space-y-3">
            {opdracht.redenen.plus.map((r) => (
              <li
                key={r}
                className="flex items-start gap-3 text-[13.5px] leading-snug"
                style={{ color: C.fg }}
              >
                <span className="mt-0.5 shrink-0" aria-hidden="true">
                  <StitchMotif
                    grid={MOTIF.check as unknown as number[][]}
                    color={C.sage}
                    cell={4}
                  />
                </span>
                {r}
              </li>
            ))}
          </ul>
        </Panel>
        <Panel accent={C.gold} className="p-5">
          <div
            className="inline-flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.14em]"
            style={{ color: C.goldDeep }}
          >
            <AlertTriangle size={14} strokeWidth={2.8} aria-hidden="true" /> Aandacht
          </div>
          <ul className="mt-4 space-y-3">
            {opdracht.redenen.min.map((r) => (
              <li
                key={r}
                className="flex items-start gap-3 text-[13.5px] leading-snug"
                style={{ color: C.fg }}
              >
                <span className="mt-1 shrink-0" aria-hidden="true">
                  <StitchX color={C.gold} cell={12} />
                </span>
                {r}
              </li>
            ))}
          </ul>
        </Panel>
      </div>

      <div className="flex flex-col items-stretch gap-3 pt-1 sm:flex-row">
        <button
          className="group inline-flex flex-1 items-center justify-center gap-2.5 rounded-[8px] px-7 py-3.5 text-[14px] font-semibold transition-all hover:gap-3.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 motion-reduce:hover:gap-2.5"
          style={{ background: C.red, color: C.panel }}
        >
          Reageer op opdracht <ArrowRight size={16} aria-hidden="true" />
        </button>
        <button
          className="inline-flex items-center justify-center gap-2 rounded-[8px] px-6 py-3.5 text-[14px] font-semibold transition-colors hover:bg-black/[0.03] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
          style={{ border: `1.5px solid ${C.lineStrong}`, color: C.fg }}
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
      <SectionKop sub="Vertrouwen" tone={C.sage} motif={MOTIF.check as unknown as number[][]}>
        Verificatie
      </SectionKop>

      {/* Vertrouwens-sampler */}
      <Panel accent={C.sage} sampler className="flex flex-col items-center gap-6 p-6 sm:flex-row">
        <div
          className="flex h-28 w-28 shrink-0 flex-col items-center justify-center rounded-[12px]"
          style={{ background: C.aida, border: `2px solid ${C.sage}` }}
          aria-hidden="true"
        >
          <span
            className="text-[28px] font-medium tabular-nums leading-none"
            style={{ ...display, color: C.sageDeep }}
          >
            {pct}%
          </span>
          <span
            className="mt-1 text-[8.5px] font-bold uppercase tracking-[0.16em]"
            style={{ color: C.sage }}
          >
            gedekt
          </span>
          <span className="mt-2">
            <StitchRow total={CREDENTIALS.length} filled={verified} tone={C.sage} />
          </span>
        </div>
        <div className="text-center sm:text-left">
          <span
            className="inline-flex items-center gap-2 rounded-[6px] px-3 py-1 text-[12px] font-semibold"
            style={{
              background: `${C.sage}1f`,
              color: C.sageDeep,
              border: `1.5px solid ${C.sage}`,
            }}
          >
            <ShieldCheck size={15} strokeWidth={2.4} aria-hidden="true" /> {PROFIEL.trust}
          </span>
          <p className="mt-3 max-w-md text-[13.5px] leading-relaxed" style={{ color: C.fgSoft }}>
            {verified} van {CREDENTIALS.length} credentials volledig geverifieerd. Elke geborduurde
            steek maakt je sampler sterker — één dossier vraagt binnenkort om vernieuwing.
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
                  className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[8px]"
                  style={{ background: `${st.tone}16`, border: `1.5px solid ${st.tone}` }}
                  aria-hidden="true"
                >
                  <StitchMotif grid={st.motif} color={st.tone} cell={6} />
                </span>
                <div className="min-w-0 flex-1">
                  <div
                    className="text-[14.5px] font-medium leading-tight"
                    style={{ ...display, color: C.fg }}
                  >
                    {c.naam}
                  </div>
                  <div className="mt-0.5 text-[12px]" style={{ color: C.fgSoft }}>
                    {c.detail}
                  </div>
                </div>
                <StitchChip tone={st.tone}>
                  <st.Icon size={12} strokeWidth={2.8} aria-hidden="true" />
                  <span className="hidden sm:inline">{st.label}</span>
                </StitchChip>
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
        tone={C.gold}
        motif={MOTIF.bang as unknown as number[][]}
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
                accent={warn ? C.red : undefined}
                className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center"
              >
                <span
                  className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[8px] text-[16px] font-medium tabular-nums"
                  style={{
                    background: `${tone}16`,
                    color: tone,
                    border: `1.5px solid ${tone}`,
                    ...display,
                  }}
                  aria-hidden="true"
                >
                  {i + 1}
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
                      <Scissors
                        size={14}
                        strokeWidth={2.6}
                        style={{ color: tone }}
                        aria-hidden="true"
                      />
                    )}
                    <h3
                      className="text-[16px] font-medium leading-tight"
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
                  className="shrink-0 self-start rounded-[8px] px-5 py-2.5 text-[12.5px] font-semibold transition-transform hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 motion-reduce:hover:translate-y-0 sm:self-center"
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
    if (status === "Betaald") return C.sage;
    if (status === "Openstaand") return C.red;
    if (status === "Concept") return C.fgFaint;
    return C.gold;
  };
  return (
    <div className="space-y-7">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <SectionKop sub="Omzet" tone={C.red} motif={MOTIF.flower as unknown as number[][]}>
          Facturen
        </SectionKop>
        <button
          className="inline-flex items-center gap-2 rounded-[8px] px-4 py-2.5 text-[12.5px] font-semibold transition-all hover:gap-3 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 motion-reduce:hover:gap-2"
          style={{ background: C.red, color: C.panel }}
        >
          <Plus size={15} aria-hidden="true" /> Nieuwe factuur
        </button>
      </div>

      <Panel className="overflow-x-auto">
        <table className="w-full min-w-[560px] border-collapse text-left">
          <thead>
            <tr style={{ borderBottom: `1.5px solid ${C.lineStrong}` }}>
              {["Nummer", "Klant", "Datum", "Status", "Bedrag"].map((h, i) => (
                <th
                  key={h}
                  className={`px-4 py-3 text-[10px] font-bold uppercase tracking-[0.14em] ${i === 4 ? "text-right" : ""}`}
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
                    className="px-4 py-3.5 text-[12px] tabular-nums"
                    style={{ ...display, color: C.fgSoft }}
                  >
                    {f.nr}
                  </td>
                  <td className="px-4 py-3.5 text-[13.5px]" style={{ color: C.fg }}>
                    {f.klant}
                  </td>
                  <td className="px-4 py-3.5 text-[12px] tabular-nums" style={{ color: C.fgSoft }}>
                    {f.datum}
                  </td>
                  <td className="px-4 py-3.5">
                    <StitchChip tone={tone}>
                      <StitchX color={tone} cell={11} />
                      {f.status}
                    </StitchChip>
                  </td>
                  <td
                    className="px-4 py-3.5 text-right text-[14px] font-medium tabular-nums"
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
                className="px-4 py-4 text-[10px] font-bold uppercase tracking-[0.16em]"
                style={{ color: C.fgFaint }}
              >
                Totaal betaald
              </td>
              <td
                className="px-4 py-4 text-right text-[18px] font-medium tabular-nums"
                style={{ ...display, color: C.sageDeep }}
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
