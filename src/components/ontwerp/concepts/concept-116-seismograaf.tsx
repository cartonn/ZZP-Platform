"use client";

// Concept 116 — "Seismograaf" · Analoge meettrommel / seismische registratie.
// Off-white millimeter-registratiepapier met een heel fijn licht raster
// (repeating-linear-gradient), waarover een doorlopende SEISMISCHE INKTLIJN loopt (donkere SVG-
// polyline met scherpe uitslagen) als de centrale datataal. KPI-trends worden getekend als
// seismogram-tracks; activiteit/match wordt een uitslag-amplitude. Rode meetnaald-accent,
// inkt-antraciet lijnen, technisch-mono (Spline Sans Mono) + Manrope voor UI. Elke track heeft
// een nullijn en getande tijdmarkeringen. Verificatie-status als amplitude-band (rustig=
// geverifieerd, piek=actie nodig) met altijd label + icoon. Onderscheidend van Meter (wijzer-
// platen), Radar (sonar), Therma (heatmap) en Redactie (datajournalistiek): dit is de DOORLOPENDE
// SEISMOGRAM-INKTLIJN op registratiepapier. Light concept.

import { useMemo, useState } from "react";
import {
  ArrowRight,
  Check,
  Clock,
  AlertTriangle,
  XCircle,
  Search,
  Plus,
  ShieldCheck,
  Activity,
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

const C = {
  paper: "#f4f2ea", // registratiepapier off-white
  paperDeep: "#eeece2",
  ink: "#1c2530", // inkt-antraciet
  inkSoft: "#454f5b",
  muted: "#7c8590",
  needle: "#c0392b", // rode meetnaald
  needleSoft: "rgba(192,57,43,0.5)",
  calm: "#2c7a5b", // rustige uitslag (geverifieerd)
  amber: "#b8801f", // amber (actie/verloopt)
  grid: "rgba(28,37,48,0.06)",
  gridStrong: "rgba(28,37,48,0.11)",
  line: "rgba(28,37,48,0.14)",
  lineStrong: "rgba(28,37,48,0.24)",
};

const monoF = { fontFamily: "var(--font-lab-spline-mono)" };
const ui = { fontFamily: "var(--font-lab-manrope)" };

// Millimeterpapier: fijn raster (1mm) + iets sterkere lijnen (5mm).
const graphPaper =
  "repeating-linear-gradient(0deg, transparent 0 7px, rgba(28,37,48,0.05) 7px 8px)," +
  "repeating-linear-gradient(90deg, transparent 0 7px, rgba(28,37,48,0.05) 7px 8px)," +
  "repeating-linear-gradient(0deg, transparent 0 39px, rgba(28,37,48,0.09) 39px 40px)," +
  "repeating-linear-gradient(90deg, transparent 0 39px, rgba(28,37,48,0.09) 39px 40px)";

function statusMeta(s: CredStatus): {
  label: string;
  Icon: LucideIcon;
  tone: string;
  amp: number; // uitslag-amplitude: rustig -> laag, actie -> hoog
} {
  switch (s) {
    case "VERIFIED":
      return { label: "Geverifieerd", Icon: Check, tone: C.calm, amp: 0.16 };
    case "SUBMITTED":
      return { label: "In beoordeling", Icon: Clock, tone: C.muted, amp: 0.45 };
    case "EXPIRING":
      return { label: "Verloopt binnenkort", Icon: AlertTriangle, tone: C.amber, amp: 0.78 };
    case "REJECTED":
      return { label: "Afgewezen", Icon: XCircle, tone: C.needle, amp: 0.95 };
  }
}

// Deterministische pseudo-ruis (geen randomness — stabiel over renders).
function noise(i: number): number {
  const x = Math.sin(i * 12.9898) * 43758.5453;
  return x - Math.floor(x); // 0..1
}

// Genereer een seismische golfvorm: baseline met periodieke pieken, amplitude schaalbaar.
function seismicPoints(
  width: number,
  height: number,
  amplitude: number,
  steps = 120,
  seed = 1,
): string {
  const mid = height / 2;
  const pts: string[] = [];
  for (let i = 0; i <= steps; i++) {
    const x = (i / steps) * width;
    // basis-trilling
    let y = Math.sin((i / steps) * Math.PI * 8 + seed) * 0.25;
    y += (noise(i * seed + seed) - 0.5) * 0.5;
    // sporadische scherpe uitslagen
    const spikePhase = (i + seed * 7) % 23;
    if (spikePhase < 3) {
      const dir = noise(i * 3 + seed) > 0.5 ? 1 : -1;
      y += dir * (0.6 + noise(i + seed) * 0.4);
    }
    const val = mid - y * mid * amplitude * 1.6;
    pts.push(`${x.toFixed(1)},${Math.max(1, Math.min(height - 1, val)).toFixed(1)}`);
  }
  return pts.join(" ");
}

// Seismogram-track: registratiepapier-strook met nullijn, tijdmarkeringen en doorlopende inktlijn.
function Track({
  amplitude,
  tone = C.ink,
  height = 56,
  seed = 1,
  label,
}: {
  amplitude: number;
  tone?: string;
  height?: number;
  seed?: number;
  label?: string;
}) {
  const W = 320;
  const points = useMemo(
    () => seismicPoints(W, height, amplitude, 120, seed),
    [amplitude, height, seed],
  );
  const ticks = Array.from({ length: 9 });
  return (
    <div className="relative w-full">
      <svg
        viewBox={`0 0 ${W} ${height}`}
        preserveAspectRatio="none"
        className="h-full w-full"
        style={{ height }}
        aria-hidden="true"
      >
        {/* nullijn */}
        <line
          x1={0}
          y1={height / 2}
          x2={W}
          y2={height / 2}
          stroke={C.line}
          strokeWidth={1}
          strokeDasharray="2 3"
          vectorEffect="non-scaling-stroke"
        />
        {/* getande tijdmarkeringen onderaan */}
        {ticks.map((_, i) => {
          const x = ((i + 1) / 10) * W;
          return (
            <line
              key={i}
              x1={x}
              y1={height - 5}
              x2={x}
              y2={height}
              stroke={C.gridStrong}
              strokeWidth={1}
              vectorEffect="non-scaling-stroke"
            />
          );
        })}
        {/* de seismische inktlijn */}
        <polyline
          points={points}
          fill="none"
          stroke={tone}
          strokeWidth={1.5}
          strokeLinecap="round"
          strokeLinejoin="round"
          vectorEffect="non-scaling-stroke"
        />
      </svg>
      {label && (
        <span
          className="absolute right-1.5 top-1 text-[8.5px] uppercase tracking-[0.16em]"
          style={{ ...monoF, color: C.muted }}
        >
          {label}
        </span>
      )}
    </div>
  );
}

// Kleine sparkline-track (compacte inktlijn uit data).
function Spark({ data, tone }: { data: number[]; tone: string }) {
  const max = Math.max(...data);
  const min = Math.min(...data);
  const span = max - min || 1;
  const pts = data
    .map((v, i) => {
      const x = (i / (data.length - 1)) * 100;
      const y = 100 - ((v - min) / span) * 100;
      return `${x},${y}`;
    })
    .join(" ");
  return (
    <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="h-8 w-full" aria-hidden="true">
      <line
        x1={0}
        y1={50}
        x2={100}
        y2={50}
        stroke={C.line}
        strokeWidth={1}
        strokeDasharray="2 3"
        vectorEffect="non-scaling-stroke"
      />
      <polyline
        points={pts}
        fill="none"
        stroke={tone}
        strokeWidth={1.75}
        strokeLinecap="round"
        strokeLinejoin="round"
        vectorEffect="non-scaling-stroke"
      />
    </svg>
  );
}

// Match% als uitslag-amplitude met meetnaald-markering.
function AmplitudeBar({ value, tone = C.ink }: { value: number; tone?: string }) {
  return (
    <div className="flex items-center gap-3">
      <div
        className="relative h-11 w-28 overflow-hidden rounded-sm"
        style={{ background: C.paper, border: `1px solid ${C.line}` }}
      >
        <Track amplitude={value / 100} tone={tone} height={44} seed={value} />
      </div>
      <span className="text-[13px] font-semibold tabular-nums" style={{ ...monoF, color: tone }}>
        {value}%
      </span>
    </div>
  );
}

// Paneel op registratiepapier.
function Panel({
  children,
  className = "",
  tone = "plain",
}: {
  children: React.ReactNode;
  className?: string;
  tone?: "plain" | "needle" | "calm";
}) {
  const edge = tone === "needle" ? C.needle : tone === "calm" ? C.calm : C.lineStrong;
  return (
    <div
      className={`rounded-sm ${className}`}
      style={{
        background: C.paper,
        border: `1px solid ${edge}`,
        boxShadow: "0 1px 0 rgba(255,255,255,0.6) inset, 0 1px 6px rgba(28,37,48,0.05)",
      }}
    >
      {children}
    </div>
  );
}

// Sectiekop met meetstation-code en rode naaldlijn.
function Kop({ nr, children, sub }: { nr: string; children: React.ReactNode; sub?: string }) {
  return (
    <div>
      <div className="flex items-baseline gap-3">
        <span
          className="text-[10px] tabular-nums"
          style={{ ...monoF, color: C.needle, letterSpacing: "0.1em" }}
        >
          {nr}
        </span>
        {sub && (
          <span
            className="text-[10px] uppercase tracking-[0.28em]"
            style={{ ...ui, color: C.muted }}
          >
            {sub}
          </span>
        )}
      </div>
      <h2
        className="mt-1.5 text-[24px] font-bold leading-none tracking-[-0.01em] sm:text-[28px]"
        style={{ ...ui, color: C.ink }}
      >
        {children}
      </h2>
      <div className="mt-3 flex items-center gap-1.5" aria-hidden="true">
        <span className="h-[2px] w-8" style={{ background: C.needle }} />
        <span className="h-[2px] flex-1" style={{ background: C.line }} />
      </div>
    </div>
  );
}

export function Concept116() {
  const [screen, setScreen] = useState<ScreenKey>("dashboard");
  const active = OPDRACHTEN[0] as Opdracht;

  return (
    <div
      className="min-h-[680px] w-full antialiased"
      style={{ ...ui, background: C.paper, backgroundImage: graphPaper, color: C.ink }}
    >
      {/* Kop — meetstation-header */}
      <header className="mx-auto flex max-w-5xl items-center justify-between px-5 pt-9 md:px-10">
        <div className="flex items-center gap-3.5">
          <span
            className="flex h-11 w-11 items-center justify-center rounded-sm"
            style={{ background: C.ink, color: C.paper }}
            aria-hidden="true"
          >
            <Activity size={19} strokeWidth={2} />
          </span>
          <div className="leading-none">
            <div
              className="text-[20px] font-bold tracking-[-0.01em]"
              style={{ ...ui, color: C.ink }}
            >
              Seismograaf
            </div>
            <div
              className="mt-1 text-[9px] uppercase tracking-[0.32em]"
              style={{ ...monoF, color: C.muted }}
            >
              ZZP · Meetstation
            </div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="hidden text-right leading-tight sm:block">
            <div className="text-[13px] font-semibold" style={{ color: C.ink }}>
              {PROFIEL.naam}
            </div>
            <div className="text-[11px]" style={{ color: C.muted }}>
              {PROFIEL.plaats}
            </div>
          </div>
          <span
            className="flex h-11 w-11 items-center justify-center rounded-sm text-[12px] font-semibold"
            style={{
              ...monoF,
              background: C.paperDeep,
              color: C.needle,
              border: `1px solid ${C.needle}`,
            }}
            aria-hidden="true"
          >
            {PROFIEL.initialen}
          </span>
        </div>
      </header>

      {/* Navigatie — actief = rode naaldlijn eronder */}
      <nav
        className="mx-auto mt-7 flex max-w-5xl items-center gap-1 overflow-x-auto px-5 pb-4 md:px-10"
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
              className="relative shrink-0 px-3.5 py-2 text-[12.5px] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
              style={{ ...ui, color: on ? C.ink : C.muted, fontWeight: on ? 700 : 500 }}
            >
              {s.label}
              {on && (
                <span
                  className="absolute -bottom-[5px] left-2 right-2 h-[2px] rounded-full"
                  style={{ background: C.needle }}
                  aria-hidden="true"
                />
              )}
            </button>
          );
        })}
      </nav>

      <main className="mx-auto max-w-5xl px-5 py-9 md:px-10 md:py-12">
        {screen === "dashboard" && <Dashboard onOpen={() => setScreen("opdracht")} />}
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

function Dashboard({ onOpen }: { onOpen: () => void }) {
  const primair = ACTIES[0] as (typeof ACTIES)[number];
  const top = OPDRACHTEN[0] as Opdracht;
  const tones = [C.ink, C.calm, C.ink, C.amber];
  return (
    <div className="space-y-10">
      {/* Groet + brede registratiestrook */}
      <section>
        <div
          className="text-[10px] uppercase tracking-[0.3em]"
          style={{ ...monoF, color: C.muted }}
        >
          Registratie · {PROFIEL.plaats}
        </div>
        <h1
          className="mt-2 text-[32px] font-extrabold leading-[1.02] tracking-[-0.02em] sm:text-[44px]"
          style={{ ...ui, color: C.ink }}
        >
          Goedemorgen, {PROFIEL.naam.split(" ")[0]}
        </h1>
        <p className="mt-3 max-w-lg text-[13.5px] leading-relaxed" style={{ color: C.inkSoft }}>
          De trommel loopt rustig. Eén track vertoont een uitslag die vandaag aandacht vraagt — de
          rest blijft vlak.
        </p>
        <Panel className="mt-5 overflow-hidden">
          <Track
            amplitude={0.7}
            tone={C.ink}
            height={72}
            seed={3}
            label="Activiteit · laatste 24u"
          />
        </Panel>
      </section>

      {/* Primaire actie */}
      <Panel tone="needle" className="p-6">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0">
            <div
              className="inline-flex items-center gap-2 text-[10.5px] uppercase tracking-[0.22em]"
              style={{ ...monoF, color: C.needle }}
            >
              <AlertTriangle size={13} strokeWidth={2} aria-hidden="true" /> Uitslag · vraagt
              aandacht
            </div>
            <h2
              className="mt-2 text-[21px] font-bold leading-tight tracking-[-0.01em] sm:text-[24px]"
              style={{ ...ui, color: C.ink }}
            >
              {primair.titel}
            </h2>
            <p className="mt-2 max-w-md text-[13px] leading-relaxed" style={{ color: C.inkSoft }}>
              {primair.detail}
            </p>
          </div>
          <button
            onClick={onOpen}
            className="group inline-flex shrink-0 items-center gap-2.5 rounded-sm px-6 py-3 text-[12.5px] font-semibold transition-all hover:gap-3.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 motion-reduce:hover:gap-2.5"
            style={{ ...ui, background: C.needle, color: C.paper }}
          >
            {primair.cta}
            <ArrowRight size={15} aria-hidden="true" />
          </button>
        </div>
      </Panel>

      {/* KPI's als seismogram-tracks */}
      <section>
        <Kop nr="STA-01" sub="Metingen">
          Prestatie
        </Kop>
        <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {KPIS.map((k, i) => {
            const tone = tones[i % tones.length] as string;
            return (
              <Panel
                key={k.label}
                className="group overflow-hidden p-4 transition-transform hover:-translate-y-1 motion-reduce:hover:translate-y-0"
              >
                <div className="flex items-start justify-between">
                  <span
                    className="text-[10px] uppercase tracking-[0.12em]"
                    style={{ ...monoF, color: C.muted }}
                  >
                    {k.label}
                  </span>
                  <span
                    className="text-[11px] tabular-nums"
                    style={{ ...monoF, color: k.up ? C.calm : C.needle }}
                  >
                    {k.up ? "▲" : "▼"} {k.trend}
                  </span>
                </div>
                <div
                  className="mt-2 text-[26px] font-extrabold tabular-nums leading-none tracking-[-0.02em]"
                  style={{ ...ui, color: C.ink }}
                >
                  {k.value}
                </div>
                <div className="mt-3">
                  <Spark data={k.spark} tone={tone} />
                </div>
              </Panel>
            );
          })}
        </div>
      </section>

      {/* Top-match met amplitude-uitslag */}
      <section>
        <Kop nr="STA-05" sub="Sterkste uitslag">
          Voor jou
        </Kop>
        <button
          onClick={onOpen}
          className="group mt-6 block w-full text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
        >
          <Panel
            tone="calm"
            className="flex flex-col gap-5 p-5 transition-transform group-hover:-translate-y-0.5 motion-reduce:group-hover:translate-y-0 sm:flex-row sm:items-center"
          >
            <div
              className="flex shrink-0 flex-col items-center rounded-sm px-4 py-3"
              style={{ background: C.paperDeep, border: `1px solid ${C.calm}` }}
            >
              <span
                className="text-[30px] font-extrabold tabular-nums leading-none tracking-[-0.02em]"
                style={{ ...ui, color: C.calm }}
              >
                {top.match}
              </span>
              <span
                className="mt-1 text-[8.5px] uppercase tracking-[0.2em]"
                style={{ ...monoF, color: C.muted }}
              >
                match
              </span>
            </div>
            <div className="min-w-0 flex-1">
              <h3
                className="text-[19px] font-bold leading-tight tracking-[-0.01em]"
                style={{ ...ui, color: C.ink }}
              >
                {top.titel}
              </h3>
              <div className="mt-1 text-[12.5px]" style={{ color: C.muted }}>
                {top.opdrachtgever} · {top.plaats} · {top.tarief}
              </div>
              <div className="mt-3 flex flex-wrap gap-1.5">
                {top.tags.map((t) => (
                  <span
                    key={t}
                    className="rounded-sm px-2.5 py-0.5 text-[10.5px]"
                    style={{ background: C.paper, color: C.inkSoft, border: `1px solid ${C.line}` }}
                  >
                    {t}
                  </span>
                ))}
              </div>
            </div>
            <ArrowRight
              size={20}
              className="hidden shrink-0 transition-transform group-hover:translate-x-1 motion-reduce:group-hover:translate-x-0 md:block"
              style={{ color: C.calm }}
              aria-hidden="true"
            />
          </Panel>
        </button>
      </section>
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
    <div className="space-y-8">
      <Kop nr="STA-12" sub="Open opdrachten">
        Marktplaats
      </Kop>

      <Panel className="flex items-center gap-3 px-4 py-1">
        <Search size={17} style={{ color: C.muted }} aria-hidden="true" />
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Zoek op titel, plaats of opdrachtgever…"
          aria-label="Opdrachten zoeken"
          className="w-full bg-transparent py-2.5 text-[14px] outline-none placeholder:opacity-50"
          style={{ color: C.ink }}
        />
        <span className="shrink-0 text-[12px] tabular-nums" style={{ ...monoF, color: C.muted }}>
          {String(filtered.length).padStart(2, "0")}
        </span>
      </Panel>

      {filtered.length === 0 ? (
        <Panel className="flex flex-col items-center justify-center gap-3 p-14 text-center">
          <Search size={26} style={{ color: C.muted }} aria-hidden="true" />
          <p className="text-[18px] font-bold" style={{ ...ui, color: C.ink }}>
            Geen uitslagen gevonden
          </p>
          <p className="max-w-xs text-[13px]" style={{ color: C.muted }}>
            Niets past bij “{q}”. Verruim je zoekopdracht of beschikbaarheid.
          </p>
          <button
            onClick={() => setQ("")}
            className="mt-2 inline-flex items-center gap-2 rounded-sm px-4 py-2 text-[12px] font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
            style={{ ...ui, background: C.needle, color: C.paper }}
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
                <Panel className="flex flex-col gap-4 p-4 transition-transform group-hover:-translate-y-0.5 motion-reduce:group-hover:translate-y-0 sm:flex-row sm:items-center">
                  <div className="min-w-0 flex-1">
                    <span
                      className="text-[9px] tabular-nums"
                      style={{ ...monoF, color: C.needle, letterSpacing: "0.1em" }}
                    >
                      {o.id}
                    </span>
                    <h3
                      className="mt-0.5 text-[17px] font-bold leading-tight tracking-[-0.01em]"
                      style={{ ...ui, color: C.ink }}
                    >
                      {o.titel}
                    </h3>
                    <div className="mt-0.5 text-[12.5px]" style={{ color: C.muted }}>
                      {o.opdrachtgever} · {o.plaats} · {o.tarief}
                    </div>
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {o.tags.map((t) => (
                        <span
                          key={t}
                          className="rounded-sm px-2 py-0.5 text-[10.5px]"
                          style={{
                            background: C.paper,
                            color: C.inkSoft,
                            border: `1px solid ${C.line}`,
                          }}
                        >
                          {t}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div className="flex items-center gap-4 sm:flex-col sm:items-end">
                    <AmplitudeBar value={o.match} tone={o.match >= 85 ? C.calm : C.amber} />
                    <ArrowRight
                      size={18}
                      className="shrink-0 transition-transform group-hover:translate-x-1 motion-reduce:group-hover:translate-x-0"
                      style={{ color: C.needle }}
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
  return (
    <div className="space-y-8">
      <button
        onClick={onBack}
        className="inline-flex items-center gap-2 text-[12px] transition-opacity hover:opacity-60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
        style={{ ...ui, color: C.muted }}
      >
        <ArrowRight size={13} className="rotate-180" aria-hidden="true" /> Terug naar marktplaats
      </button>

      <section>
        <div className="flex flex-wrap items-center gap-3">
          <span className="text-[11px] tabular-nums" style={{ ...monoF, color: C.needle }}>
            {opdracht.id}
          </span>
          <span
            className="rounded-sm px-2.5 py-0.5 text-[11px] font-semibold"
            style={{ ...ui, background: C.calm, color: C.paper }}
          >
            {opdracht.match}% match
          </span>
        </div>
        <h1
          className="mt-3 max-w-2xl text-[28px] font-extrabold leading-[1.06] tracking-[-0.02em] sm:text-[36px]"
          style={{ ...ui, color: C.ink }}
        >
          {opdracht.titel}
        </h1>
        <p className="mt-2 text-[13.5px]" style={{ color: C.muted }}>
          {opdracht.opdrachtgever} · {opdracht.plaats}
        </p>
      </section>

      {/* Uitslag-registratie van deze match */}
      <Panel className="overflow-hidden">
        <div className="flex items-center justify-between px-4 pt-3">
          <span
            className="text-[10px] uppercase tracking-[0.2em]"
            style={{ ...monoF, color: C.muted }}
          >
            Match-uitslag
          </span>
          <span className="text-[10px] tabular-nums" style={{ ...monoF, color: C.needle }}>
            AMP {opdracht.match}%
          </span>
        </div>
        <Track amplitude={opdracht.match / 100} tone={C.ink} height={68} seed={opdracht.match} />
      </Panel>

      {/* Feiten */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {[
          { l: "Tarief", v: opdracht.tarief },
          { l: "Omvang", v: opdracht.uren },
          { l: "Start", v: opdracht.start },
          { l: "Match", v: `${opdracht.match}%` },
        ].map((m) => (
          <Panel key={m.l} className="p-4">
            <div
              className="text-[10px] uppercase tracking-[0.16em]"
              style={{ ...monoF, color: C.muted }}
            >
              {m.l}
            </div>
            <div
              className="mt-1.5 text-[18px] font-bold tabular-nums leading-tight tracking-[-0.01em]"
              style={{ ...ui, color: C.ink }}
            >
              {m.v}
            </div>
          </Panel>
        ))}
      </div>

      {/* Redenen plus/min */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <Panel tone="calm" className="p-5">
          <div
            className="inline-flex items-center gap-2 text-[11px] uppercase tracking-[0.2em]"
            style={{ ...monoF, color: C.calm }}
          >
            <Check size={14} strokeWidth={2.4} aria-hidden="true" /> Wat past
          </div>
          <ul className="mt-4 space-y-3">
            {opdracht.redenen.plus.map((r) => (
              <li
                key={r}
                className="flex items-start gap-3 text-[13.5px] leading-snug"
                style={{ color: C.inkSoft }}
              >
                <Check
                  size={16}
                  strokeWidth={2.2}
                  className="mt-0.5 shrink-0"
                  style={{ color: C.calm }}
                  aria-hidden="true"
                />
                {r}
              </li>
            ))}
          </ul>
        </Panel>
        <Panel tone="needle" className="p-5">
          <div
            className="inline-flex items-center gap-2 text-[11px] uppercase tracking-[0.2em]"
            style={{ ...monoF, color: C.needle }}
          >
            <AlertTriangle size={14} strokeWidth={2.4} aria-hidden="true" /> Aandacht
          </div>
          <ul className="mt-4 space-y-3">
            {opdracht.redenen.min.map((r) => (
              <li
                key={r}
                className="flex items-start gap-3 text-[13.5px] leading-snug"
                style={{ color: C.inkSoft }}
              >
                <span
                  className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full"
                  style={{ background: C.needle }}
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
          className="group inline-flex flex-1 items-center justify-center gap-2.5 rounded-sm px-7 py-3.5 text-[13px] font-semibold transition-all hover:gap-3.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 motion-reduce:hover:gap-2.5"
          style={{ ...ui, background: C.needle, color: C.paper }}
        >
          Reageer op opdracht <ArrowRight size={15} aria-hidden="true" />
        </button>
        <button
          className="inline-flex items-center justify-center gap-2 rounded-sm px-6 py-3.5 text-[13px] font-semibold transition-opacity hover:opacity-70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
          style={{ ...ui, border: `1px solid ${C.lineStrong}`, color: C.ink }}
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
    <div className="space-y-8">
      <Kop nr="STA-07" sub="Vertrouwen">
        Verificatie
      </Kop>

      {/* Dekking als rustige registratiestrook */}
      <Panel tone="calm" className="flex flex-col gap-6 p-6 sm:flex-row sm:items-center">
        <div className="shrink-0 text-center sm:text-left">
          <span
            className="text-[40px] font-extrabold tabular-nums leading-none tracking-[-0.02em]"
            style={{ ...ui, color: C.ink }}
          >
            {pct}%
          </span>
          <div
            className="text-[9px] uppercase tracking-[0.2em]"
            style={{ ...monoF, color: C.muted }}
          >
            gedekt
          </div>
        </div>
        <div className="min-w-0 flex-1 sm:border-l sm:pl-6" style={{ borderColor: C.line }}>
          <div
            className="inline-flex items-center gap-2 text-[11px] uppercase tracking-[0.2em]"
            style={{ ...monoF, color: C.calm }}
          >
            <ShieldCheck size={15} strokeWidth={2} aria-hidden="true" /> {PROFIEL.trust}
          </div>
          <p className="mt-2 max-w-md text-[13.5px] leading-relaxed" style={{ color: C.inkSoft }}>
            {verified} van {CREDENTIALS.length} credentials registreren rustig. Eén track piekt —
            vernieuw op tijd om verifieerbaar te blijven.
          </p>
        </div>
      </Panel>

      {/* Credentials als amplitude-tracks: rustig = geverifieerd, piek = actie nodig */}
      <ul className="space-y-3">
        {CREDENTIALS.map((c, idx) => {
          const st = statusMeta(c.status);
          return (
            <li key={c.naam}>
              <Panel className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center">
                <span
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-sm"
                  style={{
                    background: C.paperDeep,
                    border: `1px solid ${st.tone}`,
                    color: st.tone,
                  }}
                  aria-hidden="true"
                >
                  <st.Icon size={17} strokeWidth={2.2} />
                </span>
                <div className="min-w-0 flex-1">
                  <div
                    className="text-[15px] font-bold leading-tight tracking-[-0.01em]"
                    style={{ ...ui, color: C.ink }}
                  >
                    {c.naam}
                  </div>
                  <div className="mt-0.5 text-[12px]" style={{ color: C.muted }}>
                    {c.detail}
                  </div>
                </div>
                <div
                  className="h-9 w-full overflow-hidden rounded-sm sm:w-40"
                  style={{ background: C.paper, border: `1px solid ${C.line}` }}
                >
                  <Track amplitude={st.amp} tone={st.tone} height={36} seed={idx + 5} />
                </div>
                <span
                  className="inline-flex shrink-0 items-center gap-1.5 self-start rounded-sm px-3 py-1 text-[11px] font-semibold sm:self-center"
                  style={{ ...ui, color: st.tone, border: `1px solid ${st.tone}` }}
                >
                  <st.Icon size={12} strokeWidth={2.4} aria-hidden="true" />
                  <span className="hidden sm:inline">{st.label}</span>
                </span>
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
    <div className="space-y-8">
      <Kop nr="STA-03" sub="De volgende beste stap">
        Volgende acties
      </Kop>
      <ol className="space-y-3">
        {sorted.map((a, i) => {
          const warn = a.urgentie === "warning";
          const tone = warn ? C.needle : C.calm;
          return (
            <li key={a.titel}>
              <Panel
                tone={warn ? "needle" : "plain"}
                className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center"
              >
                <span
                  className="flex h-11 w-11 shrink-0 items-center justify-center rounded-sm text-[16px] font-bold tabular-nums"
                  style={{
                    ...monoF,
                    background: C.paperDeep,
                    color: tone,
                    border: `1px solid ${tone}`,
                  }}
                  aria-hidden="true"
                >
                  {String(i + 1).padStart(2, "0")}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    {warn ? (
                      <AlertTriangle
                        size={14}
                        strokeWidth={2.2}
                        style={{ color: tone }}
                        aria-hidden="true"
                      />
                    ) : (
                      <Check
                        size={14}
                        strokeWidth={2.4}
                        style={{ color: tone }}
                        aria-hidden="true"
                      />
                    )}
                    <h3
                      className="text-[16px] font-bold leading-tight tracking-[-0.01em]"
                      style={{ ...ui, color: C.ink }}
                    >
                      {a.titel}
                    </h3>
                    <span className="sr-only">{warn ? "Urgent" : "Informatief"}</span>
                  </div>
                  <p className="mt-1.5 text-[13px] leading-relaxed" style={{ color: C.inkSoft }}>
                    {a.detail}
                  </p>
                </div>
                <button
                  className="shrink-0 self-start rounded-sm px-5 py-2.5 text-[12px] font-semibold transition-opacity hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 sm:self-center"
                  style={{ ...ui, background: tone, color: C.paper }}
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
    if (status === "Betaald") return C.calm;
    if (status === "Openstaand") return C.needle;
    return C.muted;
  };
  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <Kop nr="STA-09" sub="Omzet">
          Facturen
        </Kop>
        <button
          className="inline-flex items-center gap-2 rounded-sm px-4 py-2.5 text-[12px] font-semibold transition-all hover:gap-3 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 motion-reduce:hover:gap-2"
          style={{ ...ui, background: C.needle, color: C.paper }}
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
                  className={`px-4 py-3 text-[10px] uppercase tracking-[0.16em] ${i === 4 ? "text-right" : ""}`}
                  style={{ ...monoF, color: C.muted, fontWeight: 600 }}
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
                  className="transition-opacity hover:opacity-80"
                  style={{ borderBottom: `1px solid ${C.line}` }}
                >
                  <td
                    className="px-4 py-3.5 text-[12.5px] tabular-nums"
                    style={{ ...monoF, color: C.inkSoft }}
                  >
                    {f.nr}
                  </td>
                  <td
                    className="px-4 py-3.5 text-[14px] font-semibold"
                    style={{ ...ui, color: C.ink }}
                  >
                    {f.klant}
                  </td>
                  <td
                    className="px-4 py-3.5 text-[12.5px] tabular-nums"
                    style={{ ...monoF, color: C.muted }}
                  >
                    {f.datum}
                  </td>
                  <td className="px-4 py-3.5">
                    <span
                      className="inline-flex items-center gap-1.5 rounded-sm px-2.5 py-0.5 text-[11px] font-semibold"
                      style={{ ...ui, color: tone, border: `1px solid ${tone}` }}
                    >
                      <span
                        className="h-1.5 w-1.5 rounded-full"
                        style={{ background: tone }}
                        aria-hidden="true"
                      />
                      {f.status}
                    </span>
                  </td>
                  <td
                    className="px-4 py-3.5 text-right text-[14px] font-semibold tabular-nums"
                    style={{ ...monoF, color: C.ink }}
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
                className="px-4 py-4 text-[10px] uppercase tracking-[0.2em]"
                style={{ ...monoF, color: C.muted }}
              >
                Totaal betaald
              </td>
              <td
                className="px-4 py-4 text-right text-[18px] font-extrabold tabular-nums"
                style={{ ...ui, color: C.calm }}
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
