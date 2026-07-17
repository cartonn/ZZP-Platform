"use client";

// Concept 376 — "Warmtekaart" · Thermografie.
// Thermische beeldvorming: magma/inferno-verloop (zwart→paars→rood→oranje→geel-wit) waar warmte =
// intensiteit/activiteit, data-dicht, meetinstrument-uitlezingen. Donkere basis (#0a0a0f). Fonts:
// Plex Mono (uitlezingen), Geist (body). Motief: KPI's/match-scores als warmte-intensiteit (hete
// cellen = hoge match), thermische heatmap-grid, sparkline als thermogram. Modern, analytisch.

import { useMemo, useState } from "react";
import {
  ArrowRight,
  Check,
  Clock,
  AlertTriangle,
  Search,
  Plus,
  Minus,
  Thermometer,
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

// — Palet: donkere basis met magma/inferno-accenten —
const C = {
  base: "#0a0a0f",
  panel: "#111119",
  panelHi: "#171722",
  ink: "#f4f1ea",
  inkSoft: "#c8c3ba",
  muted: "#8b8578",
  faint: "#5c584f",
  line: "rgba(244,241,234,0.10)",
  lineSoft: "rgba(244,241,234,0.05)",
  cool: "#3a2a6d",
  warm: "#e0512f",
  hot: "#f4b942",
  peak: "#fbe8a6",
};

const mono = { fontFamily: "var(--font-lab-plex-mono), ui-monospace, monospace" };
const body = { fontFamily: "var(--font-lab-geist), system-ui, sans-serif" };

// Magma-verloop: map 0..1 → inferno-kleur (zwart→paars→rood→oranje→geel-wit).
function magma(t: number): string {
  const x = Math.max(0, Math.min(1, t));
  const stops: [number, [number, number, number]][] = [
    [0.0, [10, 8, 24]],
    [0.25, [70, 22, 92]],
    [0.5, [183, 55, 71]],
    [0.72, [224, 90, 47]],
    [0.88, [244, 185, 66]],
    [1.0, [251, 232, 166]],
  ];
  for (let i = 0; i < stops.length - 1; i++) {
    const a = stops[i];
    const b = stops[i + 1];
    if (!a || !b) continue;
    const [t0, c0] = a;
    const [t1, c1] = b;
    if (x >= t0 && x <= t1) {
      const f = (x - t0) / (t1 - t0 || 1);
      const r = Math.round(c0[0] + (c1[0] - c0[0]) * f);
      const g = Math.round(c0[1] + (c1[1] - c0[1]) * f);
      const b = Math.round(c0[2] + (c1[2] - c0[2]) * f);
      return `rgb(${r}, ${g}, ${b})`;
    }
  }
  return `rgb(251, 232, 166)`;
}

// Pseudo-temperatuur uit een score, decoratieve meetuitlezing.
function temp(value: number): string {
  return `${(20 + (value / 100) * 22).toFixed(1)}°`;
}

function statusMeta(s: CredStatus): {
  label: string;
  Icon: LucideIcon;
  heat: number;
  alarm: boolean;
} {
  switch (s) {
    case "VERIFIED":
      return { label: "Geverifieerd", Icon: Check, heat: 0.92, alarm: false };
    case "SUBMITTED":
      return { label: "In beoordeling", Icon: Clock, heat: 0.55, alarm: false };
    case "EXPIRING":
      return { label: "Verloopt binnenkort", Icon: AlertTriangle, heat: 0.75, alarm: true };
    case "REJECTED":
      return { label: "Afgewezen", Icon: AlertTriangle, heat: 0.3, alarm: true };
  }
}

// — Thermogram-sparkline: lijn ingekleurd naar hoogte (warmte) —
function Thermogram({ data }: { data: number[] }) {
  const w = 80;
  const h = 28;
  const min = Math.min(...data);
  const max = Math.max(...data);
  const span = max - min || 1;
  const pts = data.map((d, i) => {
    const x = (i / (data.length - 1)) * w;
    const norm = (d - min) / span;
    const y = h - norm * (h - 5) - 2.5;
    return { x, y, norm };
  });
  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} aria-hidden="true">
      {pts.slice(0, -1).map((p, i) => {
        const n = pts[i + 1];
        if (!n) return null;
        return (
          <line
            key={i}
            x1={p.x}
            y1={p.y}
            x2={n.x}
            y2={n.y}
            stroke={magma(0.4 + p.norm * 0.6)}
            strokeWidth="2"
            strokeLinecap="round"
          />
        );
      })}
      {pts.map((p, i) => (
        <circle
          key={i}
          cx={p.x}
          cy={p.y}
          r={i === pts.length - 1 ? 2.6 : 1.3}
          fill={magma(0.4 + p.norm * 0.6)}
        />
      ))}
    </svg>
  );
}

// — Heatmap-grid: kleine thermische cellen als achtergrond-motief —
function HeatGrid({
  seed = 1,
  cols = 12,
  rows = 4,
}: {
  seed?: number;
  cols?: number;
  rows?: number;
}) {
  const cells: React.ReactNode[] = [];
  let s = seed * 9973;
  const rnd = () => {
    s = (s * 1103515245 + 12345) & 0x7fffffff;
    return s / 0x7fffffff;
  };
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const v = Math.pow(rnd(), 1.4);
      cells.push(
        <rect
          key={`${r}-${c}`}
          x={c * (100 / cols)}
          y={r * (100 / rows)}
          width={100 / cols}
          height={100 / rows}
          fill={magma(v)}
        />,
      );
    }
  }
  return (
    <svg
      width="100%"
      height="100%"
      viewBox="0 0 100 100"
      preserveAspectRatio="none"
      aria-hidden="true"
    >
      {cells}
    </svg>
  );
}

// — Warmte-balk: gevulde thermische meter —
function HeatBar({ value }: { value: number }) {
  const t = value / 100;
  return (
    <span
      className="relative block h-2 w-full overflow-hidden rounded-full"
      style={{ background: "rgba(244,241,234,0.06)" }}
      aria-hidden="true"
    >
      <span
        className="absolute inset-y-0 left-0 rounded-full"
        style={{
          width: `${value}%`,
          background: `linear-gradient(90deg, ${magma(0.35)}, ${magma(0.55 + t * 0.4)})`,
        }}
      />
    </span>
  );
}

function Overline({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-[10px] uppercase tracking-[0.32em]" style={{ color: C.warm, ...mono }}>
      {children}
    </p>
  );
}

function Chip({ children, heat = 0.5 }: { children: React.ReactNode; heat?: number }) {
  const col = magma(0.45 + heat * 0.4);
  return (
    <span
      className="inline-flex items-center gap-1 rounded px-2 py-0.5 text-[10.5px] uppercase tracking-[0.06em]"
      style={{ color: col, border: `1px solid ${col}55`, background: `${col}12`, ...mono }}
    >
      {children}
    </span>
  );
}

function Panel({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <div
      className={`rounded-lg ${className}`}
      style={{ background: C.panel, border: `1px solid ${C.line}` }}
    >
      {children}
    </div>
  );
}

export function Concept376() {
  const [screen, setScreen] = useState<ScreenKey>("dashboard");
  const active = OPDRACHTEN[0] as Opdracht;

  return (
    <div
      className="min-h-[720px] w-full antialiased"
      style={{ ...body, background: C.base, color: C.ink }}
    >
      <div className="mx-auto max-w-6xl px-5 md:px-8">
        <TopBar />
        <NavBar screen={screen} setScreen={setScreen} />
        <main className="pb-20 pt-8">
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
    </div>
  );
}

// — Legenda-strook: magma-verloop van koud naar heet —
function HeatLegend() {
  return (
    <div className="flex items-center gap-2" aria-hidden="true">
      <span className="text-[9px] uppercase tracking-[0.14em]" style={{ color: C.faint, ...mono }}>
        koud
      </span>
      <span
        className="h-2 w-24 rounded-full"
        style={{
          background: `linear-gradient(90deg, ${magma(0)}, ${magma(0.3)}, ${magma(0.55)}, ${magma(0.8)}, ${magma(1)})`,
        }}
      />
      <span className="text-[9px] uppercase tracking-[0.14em]" style={{ color: C.faint, ...mono }}>
        heet
      </span>
    </div>
  );
}

function TopBar() {
  return (
    <header
      className="flex items-center justify-between border-b py-6"
      style={{ borderColor: C.line }}
    >
      <div className="flex items-center gap-3.5">
        <span
          className="flex h-11 w-11 items-center justify-center rounded-md"
          style={{ background: `linear-gradient(135deg, ${magma(0.5)}, ${magma(0.85)})` }}
          aria-hidden="true"
        >
          <Thermometer size={20} color={C.base} />
        </span>
        <div>
          <p
            className="text-[21px] font-semibold leading-none tracking-[-0.01em]"
            style={{ ...mono }}
          >
            WARMTEKAART
          </p>
          <p
            className="mt-1.5 text-[10px] uppercase leading-none tracking-[0.26em]"
            style={{ color: C.faint }}
          >
            Thermische matching · live meting
          </p>
        </div>
      </div>
      <div className="flex items-center gap-4">
        <span className="hidden sm:block">
          <HeatLegend />
        </span>
        <span
          className="hidden items-center gap-1.5 rounded px-2.5 py-1 text-[10px] uppercase tracking-[0.1em] sm:inline-flex"
          style={{ color: C.hot, border: `1px solid ${C.hot}55`, ...mono }}
        >
          <Activity size={12} aria-hidden="true" />
          {PROFIEL.trust}
        </span>
        <span
          className="relative flex h-10 w-10 items-center justify-center rounded-full text-[12px]"
          style={{ border: `1px solid ${C.line}`, background: C.panelHi, color: C.hot, ...mono }}
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
    <nav
      className="flex items-center gap-0 overflow-x-auto border-b"
      style={{ borderColor: C.line }}
      aria-label="Hoofdnavigatie"
    >
      {SCREENS.map((s, i) => {
        const on = s.key === screen;
        return (
          <button
            key={s.key}
            onClick={() => setScreen(s.key)}
            aria-current={on ? "page" : undefined}
            className="relative shrink-0 px-4 py-3.5 text-[12.5px] uppercase tracking-[0.05em] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
            style={{ color: on ? C.ink : C.muted, ...mono }}
          >
            <span
              className="mr-2 text-[10px] tabular-nums"
              style={{ color: on ? C.warm : C.faint }}
            >
              {String(i + 1).padStart(2, "0")}
            </span>
            {s.label}
            {on && (
              <span
                className="absolute inset-x-3 -bottom-px h-0.5"
                style={{ background: `linear-gradient(90deg, ${magma(0.55)}, ${magma(0.85)})` }}
                aria-hidden="true"
              />
            )}
          </button>
        );
      })}
    </nav>
  );
}

function Dashboard({ onOpen }: { onOpen: () => void }) {
  const primair = ACTIES[0] as (typeof ACTIES)[number];
  return (
    <div className="space-y-12">
      <section className="grid grid-cols-1 gap-8 md:grid-cols-[1.5fr_1fr]">
        <div className="self-center">
          <Overline>Meting 01 · Vandaag</Overline>
          <h1
            className="mt-5 text-[40px] font-semibold leading-[1.02] tracking-[-0.02em] md:text-[52px]"
            style={body}
          >
            Goedemorgen,
            <br />
            <span style={{ color: magma(0.82) }}>{PROFIEL.naam.split(" ")[0]}.</span>
          </h1>
          <p className="mt-5 max-w-md text-[14.5px] leading-relaxed" style={{ color: C.muted }}>
            Je dag in beeld als warmtekaart — de heetste punten vragen als eerste om aandacht. Eén
            meting nu en de rest koelt vanzelf af.
          </p>
        </div>

        <Panel className="relative overflow-hidden">
          <div className="pointer-events-none absolute inset-0 opacity-[0.22]" aria-hidden="true">
            <HeatGrid seed={3} cols={14} rows={6} />
          </div>
          <div className="relative p-6">
            <Overline>Heetste punt</Overline>
            <h2 className="mt-3 text-[21px] font-semibold leading-snug" style={body}>
              {primair.titel}
            </h2>
            <p className="mt-2 text-[13.5px] leading-relaxed" style={{ color: C.inkSoft }}>
              {primair.detail}
            </p>
            <button
              onClick={onOpen}
              className="group mt-5 inline-flex items-center gap-2 rounded px-5 py-2.5 text-[12.5px] uppercase tracking-[0.06em] transition-transform hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
              style={{
                background: `linear-gradient(135deg, ${magma(0.6)}, ${magma(0.85)})`,
                color: C.base,
                ...mono,
              }}
            >
              {primair.cta}
              <ArrowRight
                size={15}
                aria-hidden="true"
                className="transition-transform group-hover:translate-x-0.5 motion-reduce:transition-none"
              />
            </button>
          </div>
        </Panel>
      </section>

      <section>
        <div
          className="mb-5 flex items-baseline justify-between border-b pb-2"
          style={{ borderColor: C.line }}
        >
          <Overline>Meting 02 · Kengetallen</Overline>
          <span
            className="text-[10px] uppercase tracking-[0.14em]"
            style={{ color: C.faint, ...mono }}
          >
            deze maand
          </span>
        </div>
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {KPIS.map((k, i) => {
            const heat = k.up ? 0.85 - i * 0.08 : 0.4;
            return (
              <Panel key={k.label} className="relative overflow-hidden p-5">
                <span
                  className="absolute right-0 top-0 h-full w-1.5"
                  style={{
                    background: `linear-gradient(180deg, ${magma(heat)}, ${magma(heat * 0.5)})`,
                  }}
                  aria-hidden="true"
                />
                <div className="flex items-baseline justify-between">
                  <p
                    className="text-[10.5px] uppercase tracking-[0.1em]"
                    style={{ color: C.muted, ...mono }}
                  >
                    {k.label}
                  </p>
                  <span
                    className="text-[11px] tabular-nums"
                    style={{ color: k.up ? C.hot : C.muted, ...mono }}
                  >
                    {k.up ? "▲" : "▼"} {k.trend.replace(/^[+-]/, "")}
                  </span>
                </div>
                <p
                  className="mt-2 text-[30px] font-semibold tabular-nums leading-none tracking-[-0.02em]"
                  style={{ ...mono, color: magma(0.5 + heat * 0.45) }}
                >
                  {k.value}
                </p>
                <div className="mt-3 flex items-end justify-between">
                  <span className="text-[10px] tabular-nums" style={{ color: C.faint, ...mono }}>
                    {temp(k.up ? 88 : 40)}
                  </span>
                  <Thermogram data={k.spark} />
                </div>
              </Panel>
            );
          })}
        </div>
      </section>

      <section>
        <div
          className="mb-5 flex items-baseline justify-between border-b pb-2"
          style={{ borderColor: C.line }}
        >
          <Overline>Meting 03 · Opdrachten</Overline>
          <button
            onClick={onOpen}
            className="text-[10px] uppercase tracking-[0.14em] transition-colors hover:opacity-80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
            style={{ color: C.hot, ...mono }}
          >
            Alle opdrachten
          </button>
        </div>
        <ul className="space-y-3">
          {OPDRACHTEN.map((o) => (
            <li key={o.id}>
              <button
                onClick={onOpen}
                className="group grid w-full grid-cols-[auto_1fr_auto] items-center gap-4 rounded-lg p-4 text-left transition-colors hover:bg-[#171722] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
                style={{ border: `1px solid ${C.line}` }}
              >
                <span
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded text-[10px] tabular-nums"
                  style={{ background: magma(o.match / 100), color: C.base, ...mono }}
                  aria-hidden="true"
                >
                  {o.match}
                </span>
                <span className="min-w-0">
                  <span className="block truncate text-[15px] font-medium" style={{ color: C.ink }}>
                    {o.titel}
                  </span>
                  <span
                    className="mt-0.5 block truncate text-[11.5px]"
                    style={{ color: C.muted, ...mono }}
                  >
                    {o.opdrachtgever} · {o.plaats} · {o.tarief}
                  </span>
                </span>
                <span className="flex items-center gap-3">
                  <MatchHeat value={o.match} />
                  <ArrowRight
                    size={15}
                    aria-hidden="true"
                    className="transition-transform group-hover:translate-x-0.5 motion-reduce:transition-none"
                    style={{ color: C.ink }}
                  />
                </span>
              </button>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}

function MatchHeat({ value }: { value: number }) {
  return (
    <span className="inline-flex items-center gap-2" aria-hidden="true">
      <span
        className="text-[15px] font-semibold tabular-nums"
        style={{ color: magma(value / 100), ...mono }}
      >
        {value}%
      </span>
      <span className="hidden w-16 sm:block">
        <HeatBar value={value} />
      </span>
    </span>
  );
}

function Marktplaats({ onOpen }: { onOpen: () => void }) {
  const [q, setQ] = useState("");
  const [sort, setSort] = useState<"match" | "tarief">("match");

  const filtered = useMemo(() => {
    const needle = q.toLowerCase();
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
    <div className="space-y-8">
      <div
        className="flex flex-wrap items-end justify-between gap-4 border-b pb-6"
        style={{ borderColor: C.line }}
      >
        <div>
          <Overline>Marktplaats</Overline>
          <h1
            className="mt-3 text-[34px] font-semibold leading-none tracking-[-0.02em]"
            style={mono}
          >
            OPDRACHTEN
          </h1>
        </div>
        <div className="flex flex-col items-end gap-1.5">
          <span
            className="text-[10px] uppercase tracking-[0.12em]"
            style={{ color: C.faint, ...mono }}
          >
            {String(filtered.length).padStart(2, "0")} /{" "}
            {String(OPDRACHTEN.length).padStart(2, "0")} gemeten
          </span>
          <HeatLegend />
        </div>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div
          className="flex flex-1 items-center gap-2.5 rounded px-3 py-2.5"
          style={{ border: `1px solid ${C.line}`, background: C.panel }}
        >
          <Search size={16} aria-hidden="true" style={{ color: C.muted }} />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Zoek op titel, plaats of opdrachtgever…"
            aria-label="Opdrachten zoeken"
            className="w-full bg-transparent text-[13.5px] outline-none placeholder:text-[#5c584f]"
            style={{ color: C.ink, ...body }}
          />
        </div>
        <div className="flex items-center gap-1" role="group" aria-label="Sorteren">
          {(["match", "tarief"] as const).map((s) => {
            const on = sort === s;
            return (
              <button
                key={s}
                onClick={() => setSort(s)}
                aria-pressed={on}
                className="rounded px-3 py-2 text-[11px] uppercase tracking-[0.08em] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
                style={
                  on
                    ? { background: magma(0.75), color: C.base, ...mono }
                    : { color: C.muted, border: `1px solid ${C.line}`, ...mono }
                }
              >
                {s === "match" ? "Match" : "Tarief"}
              </button>
            );
          })}
        </div>
      </div>

      {filtered.length === 0 ? (
        <Panel className="relative overflow-hidden">
          <div className="pointer-events-none absolute inset-0 opacity-[0.14]" aria-hidden="true">
            <HeatGrid seed={7} cols={16} rows={6} />
          </div>
          <div className="relative flex flex-col items-center py-16 text-center">
            <Thermometer size={30} style={{ color: C.warm }} aria-hidden="true" />
            <p className="mt-4 text-[24px] font-semibold tracking-[-0.01em]" style={mono}>
              GEEN SIGNAAL
            </p>
            <p className="mx-auto mt-2 max-w-xs text-[13px]" style={{ color: C.muted }}>
              Geen opdracht past bij {q ? `“${q}”` : "je zoekterm"}. Verruim de zoekterm om opnieuw
              te meten.
            </p>
            <button
              onClick={() => setQ("")}
              className="mt-6 inline-flex items-center gap-2 rounded px-5 py-2.5 text-[12.5px] uppercase tracking-[0.06em] transition-transform hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
              style={{ background: magma(0.75), color: C.base, ...mono }}
            >
              Zoekterm wissen <ArrowRight size={15} aria-hidden="true" />
            </button>
          </div>
        </Panel>
      ) : (
        <ul className="space-y-4">
          {filtered.map((o) => (
            <li key={o.id}>
              <OpdrachtKaart opdracht={o} onOpen={onOpen} />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function OpdrachtKaart({ opdracht, onOpen }: { opdracht: Opdracht; onOpen: () => void }) {
  const [open, setOpen] = useState(false);
  return (
    <Panel className="relative overflow-hidden p-5">
      <span
        className="absolute inset-y-0 left-0 w-1"
        style={{
          background: `linear-gradient(180deg, ${magma(opdracht.match / 100)}, ${magma((opdracht.match / 100) * 0.5)})`,
        }}
        aria-hidden="true"
      />
      <div className="grid grid-cols-[1fr_auto] items-start gap-4 pl-2">
        <div className="min-w-0">
          <span
            className="text-[10px] uppercase tracking-[0.12em]"
            style={{ color: C.faint, ...mono }}
          >
            {opdracht.id} · {temp(opdracht.match)}
          </span>
          <h3 className="mt-1 text-[18px] font-semibold leading-snug" style={body}>
            {opdracht.titel}
          </h3>
          <p className="mt-1 text-[12px]" style={{ color: C.muted, ...mono }}>
            {opdracht.opdrachtgever} · {opdracht.plaats} · {opdracht.uren}
          </p>
          <div className="mt-3 flex flex-wrap gap-1.5">
            {opdracht.tags.map((t, ti) => (
              <Chip key={t} heat={0.5 + ti * 0.15}>
                {t}
              </Chip>
            ))}
          </div>
        </div>
        <div className="flex flex-col items-end gap-1.5">
          <span
            className="text-[24px] font-semibold tabular-nums leading-none"
            style={{ color: magma(opdracht.match / 100), ...mono }}
          >
            {opdracht.match}%
          </span>
          <span className="text-[13px]" style={{ color: C.inkSoft, ...mono }}>
            {opdracht.tarief}
          </span>
        </div>
      </div>
      <div
        className="mt-4 flex items-center gap-4 border-t pt-3"
        style={{ borderColor: C.lineSoft }}
      >
        <button
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          className="inline-flex items-center gap-1.5 text-[11px] uppercase tracking-[0.06em] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
          style={{ color: C.muted, ...mono }}
        >
          {open ? <Minus size={13} aria-hidden="true" /> : <Plus size={13} aria-hidden="true" />}
          Waarom deze match
        </button>
        <button
          onClick={onOpen}
          className="ml-auto inline-flex items-center gap-1.5 text-[12px] uppercase tracking-[0.06em] transition-colors hover:opacity-80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
          style={{ color: C.hot, ...mono }}
        >
          Reageer <ArrowRight size={14} aria-hidden="true" />
        </button>
      </div>
      <div
        className="grid transition-all duration-300 motion-reduce:transition-none"
        style={{ gridTemplateRows: open ? "1fr" : "0fr" }}
      >
        <div className="overflow-hidden">
          <div className="mt-3 grid grid-cols-1 gap-5 sm:grid-cols-2">
            <div>
              <p
                className="text-[9.5px] uppercase tracking-[0.18em]"
                style={{ color: C.hot, ...mono }}
              >
                Warm (pro)
              </p>
              <ul className="mt-2 space-y-1.5">
                {opdracht.redenen.plus.map((r) => (
                  <li
                    key={r}
                    className="flex items-start gap-2 text-[12.5px]"
                    style={{ color: C.inkSoft }}
                  >
                    <Check
                      size={13}
                      aria-hidden="true"
                      className="mt-0.5 shrink-0"
                      style={{ color: C.hot }}
                    />
                    {r}
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <p
                className="text-[9.5px] uppercase tracking-[0.18em]"
                style={{ color: C.cool, ...mono }}
              >
                Koel (contra)
              </p>
              <ul className="mt-2 space-y-1.5">
                {opdracht.redenen.min.map((r) => (
                  <li
                    key={r}
                    className="flex items-start gap-2 text-[12.5px]"
                    style={{ color: C.muted }}
                  >
                    <AlertTriangle
                      size={12}
                      aria-hidden="true"
                      className="mt-0.5 shrink-0"
                      style={{ color: C.warm }}
                    />
                    {r}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </div>
    </Panel>
  );
}

function OpdrachtDetail({ opdracht, onBack }: { opdracht: Opdracht; onBack: () => void }) {
  return (
    <div className="space-y-8">
      <button
        onClick={onBack}
        className="inline-flex items-center gap-2 text-[10.5px] uppercase tracking-[0.12em] transition-colors hover:opacity-80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
        style={{ color: C.muted, ...mono }}
      >
        <ArrowRight size={14} aria-hidden="true" className="rotate-180" /> Terug naar marktplaats
      </button>

      <Panel className="relative overflow-hidden">
        <div className="pointer-events-none absolute inset-0 opacity-[0.18]" aria-hidden="true">
          <HeatGrid seed={5} cols={18} rows={7} />
        </div>
        <div className="relative p-6 md:p-8">
          <div className="flex flex-wrap items-center gap-3">
            <span className="text-[11px] tracking-[0.1em]" style={{ color: C.hot, ...mono }}>
              {opdracht.id}
            </span>
            <Chip heat={opdracht.match / 100}>{opdracht.match}% match</Chip>
            <span
              className="text-[11px] uppercase tracking-[0.1em]"
              style={{ color: C.faint, ...mono }}
            >
              {opdracht.plaats} · {temp(opdracht.match)}
            </span>
          </div>
          <h1
            className="mt-4 max-w-2xl text-[36px] font-semibold leading-[1.04] tracking-[-0.02em] md:text-[46px]"
            style={body}
          >
            {opdracht.titel}
          </h1>
          <p className="mt-3 text-[14.5px]" style={{ color: C.inkSoft }}>
            {opdracht.opdrachtgever} · {opdracht.plaats}
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <button
              className="inline-flex items-center gap-2 rounded px-5 py-3 text-[12.5px] uppercase tracking-[0.06em] transition-transform hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
              style={{
                background: `linear-gradient(135deg, ${magma(0.6)}, ${magma(0.88)})`,
                color: C.base,
                ...mono,
              }}
            >
              Reageer op opdracht <ArrowRight size={15} aria-hidden="true" />
            </button>
            <button
              className="inline-flex items-center gap-2 rounded px-5 py-3 text-[12.5px] uppercase tracking-[0.06em] transition-colors hover:bg-[#171722] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
              style={{ color: C.ink, border: `1px solid ${C.line}`, ...mono }}
            >
              Bewaar
            </button>
          </div>
        </div>
      </Panel>

      <section className="grid grid-cols-2 gap-4 md:grid-cols-4">
        {[
          { l: "Tarief", v: opdracht.tarief, heat: 0.7 },
          { l: "Omvang", v: opdracht.uren, heat: 0.55 },
          { l: "Start", v: opdracht.start, heat: 0.5 },
          { l: "Match", v: `${opdracht.match}%`, heat: opdracht.match / 100 },
        ].map((m) => (
          <Panel key={m.l} className="relative overflow-hidden p-4">
            <span
              className="absolute right-0 top-0 h-full w-1"
              style={{ background: magma(m.heat) }}
              aria-hidden="true"
            />
            <p
              className="text-[9.5px] uppercase tracking-[0.16em]"
              style={{ color: C.faint, ...mono }}
            >
              {m.l}
            </p>
            <p
              className="mt-1.5 text-[22px] font-semibold tabular-nums tracking-[-0.01em]"
              style={mono}
            >
              {m.v}
            </p>
          </Panel>
        ))}
      </section>

      <section>
        <div className="border-b pb-3" style={{ borderColor: C.line }}>
          <Overline>Thermische analyse · waarom deze match</Overline>
        </div>
        <p className="mt-5 max-w-xl text-[14.5px] leading-relaxed" style={{ color: C.inkSoft }}>
          Transparant onderbouwd op je geverifieerde profiel — de warme punten die passen én de
          koele punten die aandacht vragen, zonder verborgen score.
        </p>
        <div className="mt-6 grid grid-cols-1 gap-6 md:grid-cols-2">
          <Panel className="p-5">
            <Overline>Warm (pro)</Overline>
            <ul className="mt-4 space-y-3">
              {opdracht.redenen.plus.map((r) => (
                <li
                  key={r}
                  className="flex items-start gap-3 border-t pt-3 text-[13.5px]"
                  style={{ borderColor: C.lineSoft, color: C.inkSoft }}
                >
                  <Check
                    size={15}
                    aria-hidden="true"
                    className="mt-0.5 shrink-0"
                    style={{ color: C.hot }}
                  />
                  {r}
                </li>
              ))}
            </ul>
          </Panel>
          <Panel className="p-5">
            <p
              className="text-[10px] uppercase tracking-[0.28em]"
              style={{ color: C.cool, ...mono }}
            >
              Koel (contra)
            </p>
            <ul className="mt-4 space-y-3">
              {opdracht.redenen.min.map((r) => (
                <li
                  key={r}
                  className="flex items-start gap-3 border-t pt-3 text-[13.5px]"
                  style={{ borderColor: C.lineSoft, color: C.muted }}
                >
                  <AlertTriangle
                    size={14}
                    aria-hidden="true"
                    className="mt-0.5 shrink-0"
                    style={{ color: C.warm }}
                  />
                  {r}
                </li>
              ))}
            </ul>
          </Panel>
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
    <div className="space-y-8">
      <div
        className="flex flex-wrap items-end justify-between gap-6 border-b pb-8"
        style={{ borderColor: C.line }}
      >
        <div className="max-w-md">
          <Overline>Verificatie</Overline>
          <h1
            className="mt-3 text-[34px] font-semibold leading-none tracking-[-0.02em]"
            style={mono}
          >
            CERTIFICATEN
          </h1>
          <p className="mt-4 text-[14.5px] leading-relaxed" style={{ color: C.muted }}>
            <span className="font-medium" style={{ color: C.ink }}>
              {PROFIEL.trust}.
            </span>{" "}
            {verified} van {CREDENTIALS.length} certificaten op temperatuur. Eén vraagt binnenkort
            om vernieuwing.
          </p>
        </div>
        <div className="flex items-center gap-4">
          <div className="w-40">
            <HeatBar value={ratio} />
          </div>
          <p
            className="text-[44px] font-semibold tabular-nums leading-none tracking-[-0.02em]"
            style={{ ...mono, color: magma(ratio / 100) }}
          >
            {ratio}%
          </p>
        </div>
      </div>

      <ul className="space-y-3">
        {CREDENTIALS.map((c) => {
          const st = statusMeta(c.status);
          const isOpen = open === c.naam;
          return (
            <li key={c.naam}>
              <Panel className="relative overflow-hidden p-5">
                <span
                  className="absolute inset-y-0 left-0 w-1"
                  style={{ background: magma(st.heat) }}
                  aria-hidden="true"
                />
                <button
                  onClick={() => setOpen(isOpen ? null : c.naam)}
                  aria-expanded={isOpen}
                  className="grid w-full grid-cols-[1fr_auto] items-center gap-4 pl-2 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
                >
                  <span className="min-w-0">
                    <span className="flex items-center gap-2">
                      <st.Icon size={15} aria-hidden="true" style={{ color: magma(st.heat) }} />
                      <span className="truncate text-[16px] font-medium" style={{ color: C.ink }}>
                        {c.naam}
                      </span>
                    </span>
                    <span className="mt-1 block text-[12px]" style={{ color: C.muted, ...mono }}>
                      {c.detail} · {temp(st.heat * 100)}
                    </span>
                  </span>
                  <span className="flex items-center gap-3">
                    <Chip heat={st.heat}>{st.label}</Chip>
                    <span
                      className="transition-transform motion-reduce:transition-none"
                      style={{
                        color: C.muted,
                        transform: isOpen ? "rotate(45deg)" : "rotate(0deg)",
                      }}
                      aria-hidden="true"
                    >
                      <Plus size={15} />
                    </span>
                  </span>
                </button>
                <div
                  className="grid transition-all duration-300 motion-reduce:transition-none"
                  style={{ gridTemplateRows: isOpen ? "1fr" : "0fr" }}
                >
                  <div className="overflow-hidden">
                    <div className="mt-3 border-t pl-2 pt-3" style={{ borderColor: C.lineSoft }}>
                      <p
                        className="max-w-xl text-[13px] leading-relaxed"
                        style={{ color: C.inkSoft }}
                      >
                        {c.detail}. Documenten worden versleuteld bewaard en alleen na jouw
                        expliciete toestemming gedeeld met een opdrachtgever.
                      </p>
                      <div className="mt-3 flex flex-wrap gap-2">
                        <button
                          className="rounded px-3.5 py-2 text-[12px] uppercase tracking-[0.06em] transition-transform hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
                          style={{ background: magma(0.75), color: C.base, ...mono }}
                        >
                          {c.status === "EXPIRING" ? "Vernieuwen" : "Bekijken"}
                        </button>
                        <button
                          className="rounded px-3.5 py-2 text-[12px] uppercase tracking-[0.06em] transition-colors hover:bg-[#171722] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
                          style={{ color: C.inkSoft, border: `1px solid ${C.line}`, ...mono }}
                        >
                          Logboek
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </Panel>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

function Acties() {
  return (
    <div className="space-y-8">
      <div className="border-b pb-6" style={{ borderColor: C.line }}>
        <Overline>Volgende stappen</Overline>
        <h1 className="mt-3 text-[34px] font-semibold leading-none tracking-[-0.02em]" style={mono}>
          ACTIES
        </h1>
        <p className="mt-3 max-w-md text-[14.5px]" style={{ color: C.muted }}>
          Werk deze punten op volgorde af — het heetste punt vraagt het eerst om aandacht.
        </p>
      </div>

      <ol className="space-y-3">
        {ACTIES.map((a, i) => {
          const warn = a.urgentie === "warning";
          const heat = warn ? 0.9 : 0.6 - i * 0.1;
          return (
            <li key={a.titel}>
              <Panel className="relative overflow-hidden">
                <div
                  className="grid grid-cols-1 items-center gap-4 border-l-[3px] p-5 sm:grid-cols-[auto_1fr_auto]"
                  style={{ borderColor: magma(heat) }}
                >
                  <span
                    className="flex h-12 w-12 items-center justify-center rounded-full text-[15px] font-semibold tabular-nums"
                    style={
                      warn
                        ? { background: magma(0.85), color: C.base, ...mono }
                        : { border: `1.5px solid ${magma(heat)}`, color: magma(heat), ...mono }
                    }
                    aria-hidden="true"
                  >
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      {warn ? (
                        <AlertTriangle
                          size={15}
                          aria-hidden="true"
                          style={{ color: magma(0.85) }}
                        />
                      ) : (
                        <Activity size={15} aria-hidden="true" style={{ color: magma(heat) }} />
                      )}
                      <h2 className="text-[17px] font-semibold leading-snug" style={body}>
                        {a.titel}
                      </h2>
                    </div>
                    <p
                      className="mt-1.5 max-w-lg text-[13.5px] leading-relaxed"
                      style={{ color: C.muted }}
                    >
                      {a.detail}
                    </p>
                  </div>
                  <button
                    className="justify-self-start rounded px-5 py-2.5 text-[12px] uppercase tracking-[0.06em] transition-transform hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 sm:justify-self-end"
                    style={
                      warn
                        ? { background: magma(0.85), color: C.base, ...mono }
                        : { border: `1px solid ${C.line}`, color: C.ink, ...mono }
                    }
                  >
                    {a.cta}
                  </button>
                </div>
              </Panel>
            </li>
          );
        })}
      </ol>
    </div>
  );
}

function factuurAlarm(status: string): boolean {
  return status === "Openstaand";
}

function factuurHeat(status: string): number {
  if (status === "Betaald") return 0.85;
  if (status === "Openstaand") return 0.5;
  return 0.35;
}

function Facturen() {
  const totaalBetaald = "€ 8.622";
  return (
    <div className="space-y-8">
      <div
        className="flex flex-wrap items-end justify-between gap-4 border-b pb-6"
        style={{ borderColor: C.line }}
      >
        <div>
          <Overline>Register</Overline>
          <h1
            className="mt-3 text-[34px] font-semibold leading-none tracking-[-0.02em]"
            style={mono}
          >
            FACTUREN
          </h1>
        </div>
        <button
          className="inline-flex items-center gap-2 rounded px-5 py-3 text-[12.5px] uppercase tracking-[0.06em] transition-transform hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
          style={{ background: magma(0.75), color: C.base, ...mono }}
        >
          <Plus size={15} aria-hidden="true" /> Nieuwe factuur
        </button>
      </div>

      <section className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {[
          { l: "Betaald (mnd)", v: totaalBetaald, sub: "3 voldaan", heat: 0.85 },
          { l: "Openstaand", v: "€ 1.350", sub: "1 factuur · 9 dagen", heat: 0.5 },
          { l: "Concept", v: "€ 880", sub: "klaar om te versturen", heat: 0.35 },
        ].map((s) => (
          <Panel key={s.l} className="relative overflow-hidden p-5">
            <span
              className="absolute right-0 top-0 h-full w-1.5"
              style={{
                background: `linear-gradient(180deg, ${magma(s.heat)}, ${magma(s.heat * 0.5)})`,
              }}
              aria-hidden="true"
            />
            <p
              className="text-[10.5px] uppercase tracking-[0.16em]"
              style={{ color: C.muted, ...mono }}
            >
              {s.l}
            </p>
            <p
              className="mt-2 text-[28px] font-semibold tabular-nums tracking-[-0.02em]"
              style={{ color: magma(0.5 + s.heat * 0.4), ...mono }}
            >
              {s.v}
            </p>
            <p className="mt-1 text-[12px]" style={{ color: C.faint }}>
              {s.sub}
            </p>
          </Panel>
        ))}
      </section>

      <Panel className="p-5">
        <div
          className="hidden grid-cols-[8rem_1fr_5rem_8rem_6rem] gap-4 border-b pb-2 sm:grid"
          style={{ borderColor: C.line }}
        >
          {["Nummer", "Klant", "Datum", "Status", "Bedrag"].map((h, i) => (
            <span
              key={h}
              className={`text-[9.5px] uppercase tracking-[0.16em] ${i === 4 ? "text-right" : ""}`}
              style={{ color: C.faint, ...mono }}
            >
              {h}
            </span>
          ))}
        </div>
        <ul>
          {FACTUREN.map((f) => {
            const acc = factuurAlarm(f.status);
            const heat = factuurHeat(f.status);
            return (
              <li
                key={f.nr}
                className="grid grid-cols-[1fr_auto] items-center gap-3 border-b py-4 transition-colors hover:bg-[#171722] sm:grid-cols-[8rem_1fr_5rem_8rem_6rem] sm:gap-4"
                style={{ borderColor: C.lineSoft }}
              >
                <span
                  className="order-1 text-[12px] tabular-nums"
                  style={{ color: C.faint, ...mono }}
                >
                  {f.nr}
                </span>
                <span
                  className="order-3 min-w-0 truncate text-[14.5px] font-medium sm:order-2"
                  style={{ color: C.ink }}
                >
                  {f.klant}
                </span>
                <span
                  className="order-4 hidden text-[12px] tabular-nums sm:order-3 sm:inline"
                  style={{ color: C.muted, ...mono }}
                >
                  {f.datum}
                </span>
                <span className="order-5 sm:order-4">
                  <Chip heat={heat}>{f.status}</Chip>
                </span>
                <span
                  className="order-2 text-right text-[14.5px] font-semibold tabular-nums sm:order-5"
                  style={{ color: acc ? C.warm : magma(0.6 + heat * 0.3), ...mono }}
                >
                  {f.bedrag}
                </span>
              </li>
            );
          })}
        </ul>
        <div className="flex items-baseline justify-between pt-5">
          <span
            className="text-[10px] uppercase tracking-[0.2em]"
            style={{ color: C.faint, ...mono }}
          >
            Totaal betaald
          </span>
          <span
            className="text-[24px] font-semibold tabular-nums"
            style={{ ...mono, color: magma(0.85) }}
          >
            {totaalBetaald}
          </span>
        </div>
      </Panel>
    </div>
  );
}
