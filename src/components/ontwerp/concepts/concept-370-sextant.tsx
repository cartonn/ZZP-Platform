"use client";

// Concept 370 — "Sextant" · Nautisch navigatie-instrument / cartografie.
// Precisie-instrument-esthetiek: messing-gegraveerde lijnen op zeekaart-crème, een terugkerend
// kompasroos-/sextant-boog-motief, coördinaat-uitlezingen op metadata en fijne gegraveerde
// schaalverdelingen langs randen. Zeekaart-crème (#efe7d5) met diep-zee-inkt (#1c2a33), messing
// (#a9803f) en kompas-rood (#b23a2e). Fonts: Fraunces (koppen), Spline Mono (coördinaten/cijfers).

import { useMemo, useState } from "react";
import {
  ArrowRight,
  Check,
  Clock,
  AlertTriangle,
  Search,
  Plus,
  Minus,
  Compass,
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

// — Palet: zeekaart-crème met diep-zee-inkt, messing + kompas-rood —
const C = {
  chart: "#efe7d5",
  paper: "#f6f0e2",
  card: "#f9f4e8",
  ink: "#1c2a33",
  inkSoft: "#39454d",
  muted: "#5f6a70",
  faint: "#8f9790",
  line: "rgba(28,42,51,0.18)",
  lineSoft: "rgba(28,42,51,0.09)",
  brass: "#a9803f",
  brassSoft: "#e4d3ac",
  red: "#b23a2e",
};

const head = { fontFamily: "var(--font-lab-fraunces), Georgia, serif" };
const body = { fontFamily: "var(--font-lab-geist), system-ui, sans-serif" };
const mono = { fontFamily: "var(--font-lab-spline-mono), ui-monospace, monospace" };

function statusMeta(s: CredStatus): { label: string; Icon: LucideIcon; alarm: boolean } {
  switch (s) {
    case "VERIFIED":
      return { label: "Gepeild & vast", Icon: Check, alarm: false };
    case "SUBMITTED":
      return { label: "Loding lopende", Icon: Clock, alarm: false };
    case "EXPIRING":
      return { label: "Koers verloopt", Icon: AlertTriangle, alarm: true };
    case "REJECTED":
      return { label: "Uit koers", Icon: AlertTriangle, alarm: true };
  }
}

// Pseudo-coördinaat afgeleid van een string — puur decoratief cartografisch label.
function coord(seed: string): string {
  let n = 0;
  for (let i = 0; i < seed.length; i++) n = (n * 31 + seed.charCodeAt(i)) % 100000;
  const lat = 51 + (n % 300) / 100;
  const lon = 4 + ((n >> 3) % 500) / 100;
  return `${lat.toFixed(2)}°N · ${lon.toFixed(2)}°E`;
}

// — Kompasroos-motief —
function CompassRose({ size = 120, stroke = C.ink }: { size?: number; stroke?: string }) {
  const c = size / 2;
  const r = c - 4;
  const ticks = Array.from({ length: 32 }, (_, i) => {
    const a = (i / 32) * Math.PI * 2;
    const major = i % 8 === 0;
    const inner = r - (major ? 12 : i % 4 === 0 ? 8 : 4);
    return (
      <line
        key={i}
        x1={c + Math.cos(a) * r}
        y1={c + Math.sin(a) * r}
        x2={c + Math.cos(a) * inner}
        y2={c + Math.sin(a) * inner}
        stroke={stroke}
        strokeWidth={major ? 1.2 : 0.7}
      />
    );
  });
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} aria-hidden="true">
      <circle cx={c} cy={c} r={r} fill="none" stroke={stroke} strokeWidth="0.8" opacity="0.6" />
      <circle
        cx={c}
        cy={c}
        r={r - 16}
        fill="none"
        stroke={stroke}
        strokeWidth="0.6"
        opacity="0.35"
      />
      {ticks}
      <path
        d={`M${c} ${c - r + 6} L${c + 7} ${c} L${c} ${c + r - 6} L${c - 7} ${c} Z`}
        fill={C.brass}
        opacity="0.9"
      />
      <path
        d={`M${c - r + 6} ${c} L${c} ${c - 7} L${c + r - 6} ${c} L${c} ${c + 7} Z`}
        fill="none"
        stroke={stroke}
        strokeWidth="0.8"
      />
      <circle cx={c} cy={c} r="2.4" fill={C.red} />
    </svg>
  );
}

// — Sextant-boog: gegradeerde kwartcirkel-schaal —
function SextantArc({ value }: { value: number }) {
  const w = 132;
  const h = 74;
  const cx = 10;
  const cy = h - 8;
  const r = 108;
  const ticks = Array.from({ length: 19 }, (_, i) => {
    const t = i / 18;
    const a = (-Math.PI / 2) * t;
    const major = i % 3 === 0;
    const or = r;
    const ir = r - (major ? 9 : 5);
    return (
      <line
        key={i}
        x1={cx + Math.cos(a) * or}
        y1={cy + Math.sin(a) * or}
        x2={cx + Math.cos(a) * ir}
        y2={cy + Math.sin(a) * ir}
        stroke={C.line}
        strokeWidth={major ? 1 : 0.6}
      />
    );
  });
  const pa = (-Math.PI / 2) * (value / 100);
  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} aria-hidden="true">
      <path
        d={`M${cx + r} ${cy} A${r} ${r} 0 0 0 ${cx} ${cy - r}`}
        fill="none"
        stroke={C.line}
        strokeWidth="0.8"
      />
      {ticks}
      <line
        x1={cx}
        y1={cy}
        x2={cx + Math.cos(pa) * r}
        y2={cy + Math.sin(pa) * r}
        stroke={C.red}
        strokeWidth="1.4"
      />
      <circle cx={cx + Math.cos(pa) * r} cy={cy + Math.sin(pa) * r} r="3" fill={C.brass} />
    </svg>
  );
}

// — Gegraveerde schaal-liniaal langs een rand —
function ScaleRule() {
  return (
    <div className="flex items-end gap-[5px]" aria-hidden="true">
      {Array.from({ length: 40 }, (_, i) => {
        const major = i % 5 === 0;
        return (
          <span
            key={i}
            className="w-px"
            style={{ height: major ? 11 : 6, background: major ? C.line : C.lineSoft }}
          />
        );
      })}
    </div>
  );
}

// Subtiele contourlijn-textuur voor achtergronden.
const contour: React.CSSProperties = {
  backgroundImage:
    "repeating-radial-gradient(circle at 82% 12%, rgba(169,128,63,0.05) 0 1px, transparent 1px 26px), repeating-radial-gradient(circle at 82% 12%, rgba(28,42,51,0.04) 0 1px, transparent 1px 40px)",
};

function Overline({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-[10.5px] uppercase tracking-[0.3em]" style={{ color: C.brass, ...mono }}>
      {children}
    </p>
  );
}

function Coord({ children }: { children: React.ReactNode }) {
  return (
    <span
      className="inline-flex items-center gap-1 text-[10.5px] tabular-nums"
      style={{ color: C.faint, ...mono }}
    >
      <span style={{ color: C.brass }}>✳</span>
      {children}
    </span>
  );
}

function Tag({ children, alarm }: { children: React.ReactNode; alarm?: boolean }) {
  return (
    <span
      className="inline-flex items-center px-2 py-0.5 text-[10.5px] uppercase tracking-[0.1em]"
      style={{
        color: alarm ? C.red : C.inkSoft,
        border: `1px solid ${alarm ? C.red : C.line}`,
        ...mono,
      }}
    >
      {children}
    </span>
  );
}

function Panel({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={className} style={{ border: `1px solid ${C.line}`, background: C.card }}>
      {children}
    </div>
  );
}

export function Concept370() {
  const [screen, setScreen] = useState<ScreenKey>("dashboard");
  const active = OPDRACHTEN[0] as Opdracht;

  return (
    <div
      className="min-h-[720px] w-full antialiased"
      style={{ ...body, background: C.chart, color: C.ink, ...contour }}
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

function TopBar() {
  return (
    <header
      className="flex items-center justify-between border-b py-6"
      style={{ borderColor: C.ink }}
    >
      <div className="flex items-center gap-3">
        <span
          className="flex h-11 w-11 items-center justify-center rounded-full"
          style={{ border: `1.5px solid ${C.ink}` }}
          aria-hidden="true"
        >
          <Compass size={20} color={C.brass} />
        </span>
        <div>
          <p className="text-[22px] font-semibold leading-none tracking-[-0.01em]" style={head}>
            Sextant
          </p>
          <p
            className="mt-1.5 text-[10px] uppercase leading-none tracking-[0.28em]"
            style={{ color: C.faint, ...mono }}
          >
            Koers &amp; peiling · {coord(PROFIEL.plaats)}
          </p>
        </div>
      </div>
      <div className="flex items-center gap-4">
        <span
          className="hidden items-center gap-1.5 px-2.5 py-1 text-[10.5px] uppercase tracking-[0.12em] sm:inline-flex"
          style={{ color: C.ink, border: `1px solid ${C.line}`, ...mono }}
        >
          <Anchor size={12} aria-hidden="true" style={{ color: C.brass }} />
          {PROFIEL.trust}
        </span>
        <span
          className="flex h-9 w-9 items-center justify-center rounded-full text-[12px]"
          style={{ border: `1px solid ${C.ink}`, color: C.ink, ...mono }}
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
            className="relative shrink-0 px-4 py-3.5 text-[13px] font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
            style={{ color: on ? C.ink : C.muted, ...head }}
          >
            <span
              className="mr-2 text-[10px] tabular-nums"
              style={{ color: on ? C.red : C.faint, ...mono }}
            >
              {String((i + 1) * 45).padStart(3, "0")}°
            </span>
            {s.label}
            {on && (
              <span
                className="absolute inset-x-3 -bottom-px h-0.5"
                style={{ background: C.brass }}
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
          <Overline>Positie 01 · Vandaag</Overline>
          <h1
            className="mt-5 text-[40px] font-semibold leading-[1.02] tracking-[-0.02em] md:text-[54px]"
            style={head}
          >
            Goedemorgen,
            <br />
            {PROFIEL.naam.split(" ")[0]}.
          </h1>
          <p className="mt-5 max-w-md text-[15px] leading-relaxed" style={{ color: C.muted }}>
            De koers ligt vast. Eén peiling zet de vaarrichting voor vandaag — daarna houdt u de
            lijn vanzelf.
          </p>
          <div className="mt-6">
            <ScaleRule />
          </div>
        </div>

        <Panel className="relative overflow-hidden">
          <div className="absolute -right-6 -top-6 opacity-[0.14]" aria-hidden="true">
            <CompassRose size={150} />
          </div>
          <div className="relative p-6">
            <Overline>Huidige peiling</Overline>
            <h2 className="mt-3 text-[21px] font-semibold leading-snug" style={head}>
              {primair.titel}
            </h2>
            <p className="mt-2 text-[13px] leading-relaxed" style={{ color: C.muted }}>
              {primair.detail}
            </p>
            <button
              onClick={onOpen}
              className="group mt-5 inline-flex items-center gap-2 px-5 py-2.5 text-[13.5px] font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
              style={{ background: C.ink, color: C.paper, ...head }}
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
          <Overline>Positie 02 · Instrumenten</Overline>
          <Coord>{coord("kpi-dek")}</Coord>
        </div>
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {KPIS.map((k) => (
            <Panel key={k.label} className="p-5">
              <div className="flex items-baseline justify-between">
                <p
                  className="text-[11px] uppercase tracking-[0.1em]"
                  style={{ color: C.muted, ...mono }}
                >
                  {k.label}
                </p>
                <span
                  className="text-[11px] tabular-nums"
                  style={{ color: k.up ? C.inkSoft : C.red, ...mono }}
                >
                  {k.up ? "▲" : "▼"} {k.trend.replace(/^[+-]/, "")}
                </span>
              </div>
              <p
                className="mt-2 text-[30px] font-semibold tabular-nums leading-none tracking-[-0.02em]"
                style={head}
              >
                {k.value}
              </p>
              <div className="mt-2 flex justify-end">
                <SextantArc
                  value={Math.min(100, (k.spark[k.spark.length - 1] ?? 0) * (k.up ? 10 : 12))}
                />
              </div>
            </Panel>
          ))}
        </div>
      </section>

      <section>
        <div
          className="mb-5 flex items-baseline justify-between border-b pb-2"
          style={{ borderColor: C.line }}
        >
          <Overline>Positie 03 · Vaarroutes</Overline>
          <button
            onClick={onOpen}
            className="text-[11px] uppercase tracking-[0.14em] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
            style={{ color: C.brass, ...mono }}
          >
            Volledige kaart
          </button>
        </div>
        <ul className="space-y-3">
          {OPDRACHTEN.map((o, i) => (
            <li key={o.id}>
              <button
                onClick={onOpen}
                className="group grid w-full grid-cols-[auto_1fr_auto] items-center gap-4 p-4 text-left transition-colors hover:bg-[#f9f4e8] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
                style={{ border: `1px solid ${C.line}` }}
              >
                <span className="text-[11px] tabular-nums" style={{ color: C.red, ...mono }}>
                  {String((i + 1) * 15).padStart(3, "0")}°
                </span>
                <span className="min-w-0">
                  <span className="block truncate text-[16px] font-semibold" style={head}>
                    {o.titel}
                  </span>
                  <span
                    className="mt-1 block truncate text-[12px]"
                    style={{ color: C.muted, ...mono }}
                  >
                    {o.opdrachtgever} · {coord(o.id)}
                  </span>
                </span>
                <span className="flex items-center gap-3">
                  <MatchDial value={o.match} />
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

function MatchDial({ value }: { value: number }) {
  const strong = value >= 90;
  return (
    <span className="inline-flex items-center gap-2" aria-hidden="true">
      <span
        className="text-[14px] font-semibold tabular-nums"
        style={{ color: strong ? C.red : C.ink, ...mono }}
      >
        {value}%
      </span>
      <span
        className="hidden h-1.5 w-14 overflow-hidden rounded-full sm:block"
        style={{ background: C.line }}
      >
        <span
          className="block h-full rounded-full"
          style={{ width: `${value}%`, background: strong ? C.red : C.brass }}
        />
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
        style={{ borderColor: C.ink }}
      >
        <div>
          <Overline>Zeekaart</Overline>
          <h1
            className="mt-3 text-[34px] font-semibold leading-none tracking-[-0.02em]"
            style={head}
          >
            Open vaarroutes
          </h1>
        </div>
        <Coord>
          {String(filtered.length).padStart(2, "0")} / {String(OPDRACHTEN.length).padStart(2, "0")}{" "}
          bakens
        </Coord>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div
          className="flex flex-1 items-center gap-2.5 px-3 py-2.5"
          style={{ border: `1px solid ${C.ink}` }}
        >
          <Search size={16} aria-hidden="true" style={{ color: C.muted }} />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Peil op titel, plaats of opdrachtgever…"
            aria-label="Opdrachten zoeken"
            className="w-full bg-transparent text-[14px] outline-none placeholder:text-[#8f9790]"
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
                className="px-3 py-2 text-[12px] font-medium uppercase tracking-[0.08em] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
                style={
                  on
                    ? { background: C.ink, color: C.paper, ...mono }
                    : { color: C.muted, border: `1px solid ${C.line}`, ...mono }
                }
              >
                {s === "match" ? "Peiling" : "Gage"}
              </button>
            );
          })}
        </div>
      </div>

      {filtered.length === 0 ? (
        <Panel className="p-0">
          <div className="flex flex-col items-center py-14 text-center">
            <CompassRose size={92} stroke={C.faint} />
            <p className="mt-5 text-[24px] font-semibold" style={head}>
              Geen baken in zicht
            </p>
            <p className="mx-auto mt-2 max-w-xs text-[13.5px]" style={{ color: C.muted }}>
              Geen route past bij {q ? `“${q}”` : "uw peiling"}. Verruim de zoekterm om de zeekaart
              opnieuw te vullen.
            </p>
            <button
              onClick={() => setQ("")}
              className="mt-6 inline-flex items-center gap-2 px-5 py-2.5 text-[13px] font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
              style={{ background: C.ink, color: C.paper, ...head }}
            >
              Peiling wissen <ArrowRight size={15} aria-hidden="true" />
            </button>
          </div>
        </Panel>
      ) : (
        <ul className="space-y-4">
          {filtered.map((o, i) => (
            <li key={o.id}>
              <OpdrachtRoute opdracht={o} index={i} onOpen={onOpen} />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function OpdrachtRoute({
  opdracht,
  index,
  onOpen,
}: {
  opdracht: Opdracht;
  index: number;
  onOpen: () => void;
}) {
  const [open, setOpen] = useState(false);
  return (
    <Panel className="p-5">
      <div className="grid grid-cols-[auto_1fr_auto] items-start gap-4">
        <span className="mt-1 text-[12px] tabular-nums" style={{ color: C.faint, ...mono }}>
          {String(index + 1).padStart(2, "0")}
        </span>
        <div className="min-w-0">
          <h3 className="text-[18px] font-semibold leading-snug" style={head}>
            {opdracht.titel}
          </h3>
          <p className="mt-1 text-[12.5px]" style={{ color: C.muted }}>
            {opdracht.opdrachtgever} · {opdracht.plaats} · {opdracht.uren}
          </p>
          <div className="mt-2">
            <Coord>{coord(opdracht.id)}</Coord>
          </div>
          <div className="mt-3 flex flex-wrap gap-1.5">
            {opdracht.tags.map((t) => (
              <Tag key={t}>{t}</Tag>
            ))}
          </div>
        </div>
        <div className="flex flex-col items-end gap-2">
          <span
            className="text-[20px] font-semibold tabular-nums"
            style={{ color: opdracht.match >= 90 ? C.red : C.ink, ...mono }}
          >
            {opdracht.match}%
          </span>
          <span className="text-[14px] font-medium" style={{ color: C.inkSoft, ...mono }}>
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
          className="inline-flex items-center gap-1.5 text-[12px] font-medium uppercase tracking-[0.08em] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
          style={{ color: C.muted, ...mono }}
        >
          {open ? <Minus size={13} aria-hidden="true" /> : <Plus size={13} aria-hidden="true" />}
          Waarom deze peiling
        </button>
        <button
          onClick={onOpen}
          className="ml-auto inline-flex items-center gap-1.5 text-[12.5px] font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
          style={{ color: C.red, ...head }}
        >
          Zet koers <ArrowRight size={14} aria-hidden="true" />
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
                className="text-[10px] uppercase tracking-[0.18em]"
                style={{ color: C.faint, ...mono }}
              >
                Gunstige stroom
              </p>
              <ul className="mt-2 space-y-1.5">
                {opdracht.redenen.plus.map((r) => (
                  <li
                    key={r}
                    className="flex items-start gap-2 text-[13px]"
                    style={{ color: C.inkSoft }}
                  >
                    <Check
                      size={13}
                      aria-hidden="true"
                      className="mt-0.5 shrink-0"
                      style={{ color: C.ink }}
                    />
                    {r}
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <p
                className="text-[10px] uppercase tracking-[0.18em]"
                style={{ color: C.red, ...mono }}
              >
                Ondiepte
              </p>
              <ul className="mt-2 space-y-1.5">
                {opdracht.redenen.min.map((r) => (
                  <li
                    key={r}
                    className="flex items-start gap-2 text-[13px]"
                    style={{ color: C.muted }}
                  >
                    <AlertTriangle
                      size={12}
                      aria-hidden="true"
                      className="mt-0.5 shrink-0"
                      style={{ color: C.red }}
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
        className="inline-flex items-center gap-2 text-[11px] uppercase tracking-[0.12em] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
        style={{ color: C.muted, ...mono }}
      >
        <ArrowRight size={14} aria-hidden="true" className="rotate-180" /> Terug naar de kaart
      </button>

      <Panel className="relative overflow-hidden">
        <div className="absolute -right-8 -top-8 opacity-[0.1]" aria-hidden="true">
          <CompassRose size={190} />
        </div>
        <div className="relative p-6 md:p-8">
          <div className="flex flex-wrap items-center gap-3">
            <span className="text-[11px] tracking-[0.1em]" style={{ color: C.brass, ...mono }}>
              {opdracht.id}
            </span>
            <Tag alarm>{opdracht.match}% peiling</Tag>
            <Coord>{coord(opdracht.id)}</Coord>
          </div>
          <h1
            className="mt-4 max-w-2xl text-[36px] font-semibold leading-[1.05] tracking-[-0.02em] md:text-[46px]"
            style={head}
          >
            {opdracht.titel}
          </h1>
          <p className="mt-3 text-[15px]" style={{ color: C.muted }}>
            {opdracht.opdrachtgever} · {opdracht.plaats}
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <button
              className="inline-flex items-center gap-2 px-5 py-3 text-[14px] font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
              style={{ background: C.red, color: C.paper, ...head }}
            >
              Reageer op route <ArrowRight size={15} aria-hidden="true" />
            </button>
            <button
              className="inline-flex items-center gap-2 px-5 py-3 text-[14px] font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
              style={{ color: C.ink, border: `1px solid ${C.ink}`, ...head }}
            >
              Markeer op kaart
            </button>
          </div>
        </div>
      </Panel>

      <section className="grid grid-cols-2 gap-4 md:grid-cols-4">
        {[
          { l: "Gage", v: opdracht.tarief },
          { l: "Omvang", v: opdracht.uren },
          { l: "Afvaart", v: opdracht.start },
          { l: "Peiling", v: `${opdracht.match}%` },
        ].map((m) => (
          <Panel key={m.l} className="p-4">
            <p
              className="text-[10px] uppercase tracking-[0.16em]"
              style={{ color: C.faint, ...mono }}
            >
              {m.l}
            </p>
            <p
              className="mt-1.5 text-[22px] font-semibold tabular-nums tracking-[-0.01em]"
              style={head}
            >
              {m.v}
            </p>
          </Panel>
        ))}
      </section>

      <section>
        <div className="border-b pb-3" style={{ borderColor: C.line }}>
          <Overline>Vaaradvies · waarom deze peiling</Overline>
        </div>
        <p className="mt-5 max-w-xl text-[15px] leading-relaxed" style={{ color: C.inkSoft }}>
          Transparant onderbouwd op uw geverifieerde profiel — de gunstige stromen én de ondiepten,
          zonder verborgen score.
        </p>
        <div className="mt-6 grid grid-cols-1 gap-6 md:grid-cols-2">
          <Panel className="p-5">
            <Overline>Gunstige stroom</Overline>
            <ul className="mt-4 space-y-3">
              {opdracht.redenen.plus.map((r) => (
                <li
                  key={r}
                  className="flex items-start gap-3 border-t pt-3 text-[14px]"
                  style={{ borderColor: C.lineSoft, color: C.inkSoft }}
                >
                  <Check
                    size={15}
                    aria-hidden="true"
                    className="mt-0.5 shrink-0"
                    style={{ color: C.ink }}
                  />
                  {r}
                </li>
              ))}
            </ul>
          </Panel>
          <Panel className="p-5">
            <p
              className="text-[10.5px] uppercase tracking-[0.3em]"
              style={{ color: C.red, ...mono }}
            >
              Ondiepte
            </p>
            <ul className="mt-4 space-y-3">
              {opdracht.redenen.min.map((r) => (
                <li
                  key={r}
                  className="flex items-start gap-3 border-t pt-3 text-[14px]"
                  style={{ borderColor: C.lineSoft, color: C.muted }}
                >
                  <AlertTriangle
                    size={14}
                    aria-hidden="true"
                    className="mt-0.5 shrink-0"
                    style={{ color: C.red }}
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
        style={{ borderColor: C.ink }}
      >
        <div className="max-w-md">
          <Overline>Authenticatie</Overline>
          <h1
            className="mt-3 text-[34px] font-semibold leading-none tracking-[-0.02em]"
            style={head}
          >
            Scheepspapieren
          </h1>
          <p className="mt-4 text-[15px] leading-relaxed" style={{ color: C.muted }}>
            <span className="font-medium" style={{ color: C.ink }}>
              {PROFIEL.trust}.
            </span>{" "}
            {verified} van {CREDENTIALS.length} certificaten gepeild en vastgelegd. Eén vraagt
            binnenkort om een nieuwe peiling.
          </p>
        </div>
        <div className="flex items-center gap-4">
          <SextantArc value={ratio} />
          <div>
            <p
              className="text-[44px] font-semibold tabular-nums leading-none tracking-[-0.02em]"
              style={head}
            >
              {ratio}
              <span className="text-[22px]" style={{ color: C.muted }}>
                %
              </span>
            </p>
            <p
              className="mt-1 text-[10.5px] uppercase tracking-[0.16em]"
              style={{ color: C.faint, ...mono }}
            >
              op koers
            </p>
          </div>
        </div>
      </div>

      <ul className="space-y-3">
        {CREDENTIALS.map((c, i) => {
          const st = statusMeta(c.status);
          const isOpen = open === c.naam;
          return (
            <li key={c.naam}>
              <Panel className="p-5">
                <button
                  onClick={() => setOpen(isOpen ? null : c.naam)}
                  aria-expanded={isOpen}
                  className="grid w-full grid-cols-[auto_1fr_auto] items-center gap-4 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
                >
                  <span className="text-[11px] tabular-nums" style={{ color: C.faint, ...mono }}>
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <span className="min-w-0">
                    <span className="flex items-center gap-2">
                      <st.Icon
                        size={15}
                        aria-hidden="true"
                        style={{ color: st.alarm ? C.red : C.ink }}
                      />
                      <span className="truncate text-[16px] font-semibold" style={head}>
                        {c.naam}
                      </span>
                    </span>
                    <span className="mt-1 block text-[12.5px]" style={{ color: C.muted }}>
                      {c.detail}
                    </span>
                  </span>
                  <span className="flex items-center gap-3">
                    <Tag alarm={st.alarm}>{st.label}</Tag>
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
                    <div className="mt-3 border-t pl-8 pt-3" style={{ borderColor: C.lineSoft }}>
                      <p
                        className="max-w-xl text-[13.5px] leading-relaxed"
                        style={{ color: C.inkSoft }}
                      >
                        {c.detail}. Documenten worden versleuteld bewaard en alleen na uw expliciete
                        toestemming gedeeld met een opdrachtgever.
                      </p>
                      <div className="mt-3 flex flex-wrap gap-2">
                        <button
                          className="px-3.5 py-2 text-[12.5px] font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
                          style={{ background: C.ink, color: C.paper, ...head }}
                        >
                          {c.status === "EXPIRING" ? "Koers vernieuwen" : "Bekijken"}
                        </button>
                        <button
                          className="px-3.5 py-2 text-[12.5px] font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
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
      <div className="border-b pb-6" style={{ borderColor: C.ink }}>
        <Overline>Logboek · volgende peilingen</Overline>
        <h1 className="mt-3 text-[34px] font-semibold leading-none tracking-[-0.02em]" style={head}>
          Koersacties
        </h1>
        <p className="mt-3 max-w-md text-[14.5px]" style={{ color: C.muted }}>
          Vaar deze peilingen op volgorde af — elke afgehandelde actie houdt uw koers zuiver.
        </p>
      </div>

      <ol className="space-y-3">
        {ACTIES.map((a, i) => {
          const warn = a.urgentie === "warning";
          return (
            <li key={a.titel}>
              <div
                className="grid grid-cols-1 items-center gap-4 border-l-[3px] p-5 sm:grid-cols-[auto_1fr_auto]"
                style={{
                  background: C.card,
                  borderColor: warn ? C.red : C.brass,
                  borderTop: `1px solid ${C.line}`,
                  borderRight: `1px solid ${C.line}`,
                  borderBottom: `1px solid ${C.line}`,
                }}
              >
                <span
                  className="flex h-12 w-12 items-center justify-center rounded-full text-[15px] font-semibold tabular-nums"
                  style={
                    warn
                      ? { background: C.red, color: C.paper, ...mono }
                      : { border: `1.5px solid ${C.ink}`, color: C.ink, ...mono }
                  }
                  aria-hidden="true"
                >
                  {String(i + 1).padStart(2, "0")}
                </span>
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    {warn ? (
                      <AlertTriangle size={15} aria-hidden="true" style={{ color: C.red }} />
                    ) : (
                      <Compass size={15} aria-hidden="true" style={{ color: C.brass }} />
                    )}
                    <h2 className="text-[17px] font-semibold leading-snug" style={head}>
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
                  className="justify-self-start px-5 py-2.5 text-[13px] font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 sm:justify-self-end"
                  style={
                    warn
                      ? { background: C.red, color: C.paper, ...head }
                      : { border: `1px solid ${C.ink}`, color: C.ink, ...head }
                  }
                >
                  {a.cta}
                </button>
              </div>
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

function Facturen() {
  const totaalBetaald = "€ 8.622";
  return (
    <div className="space-y-8">
      <div
        className="flex flex-wrap items-end justify-between gap-4 border-b pb-6"
        style={{ borderColor: C.ink }}
      >
        <div>
          <Overline>Vrachtbrief</Overline>
          <h1
            className="mt-3 text-[34px] font-semibold leading-none tracking-[-0.02em]"
            style={head}
          >
            Facturen
          </h1>
        </div>
        <button
          className="inline-flex items-center gap-2 px-5 py-3 text-[13.5px] font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
          style={{ background: C.ink, color: C.paper, ...head }}
        >
          <Plus size={15} aria-hidden="true" /> Nieuwe factuur
        </button>
      </div>

      <section className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {[
          { l: "Betaald (mnd)", v: totaalBetaald, sub: "3 voldaan", alarm: false },
          { l: "Openstaand", v: "€ 1.350", sub: "1 factuur · 9 dagen", alarm: true },
          { l: "Concept", v: "€ 880", sub: "klaar om te versturen", alarm: false },
        ].map((s) => (
          <Panel key={s.l} className="p-5">
            <p
              className="text-[11px] uppercase tracking-[0.16em]"
              style={{ color: C.muted, ...mono }}
            >
              {s.l}
            </p>
            <p
              className="mt-2 text-[28px] font-semibold tabular-nums tracking-[-0.02em]"
              style={{ color: s.alarm ? C.red : C.ink, ...head }}
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
          className="hidden grid-cols-[8rem_1fr_5rem_7rem_6rem] gap-4 border-b pb-2 sm:grid"
          style={{ borderColor: C.ink }}
        >
          {["Nummer", "Klant", "Datum", "Status", "Bedrag"].map((h, i) => (
            <span
              key={h}
              className={`text-[10px] uppercase tracking-[0.16em] ${i === 4 ? "text-right" : ""}`}
              style={{ color: C.faint, ...mono }}
            >
              {h}
            </span>
          ))}
        </div>
        <ul>
          {FACTUREN.map((f) => {
            const acc = factuurAlarm(f.status);
            return (
              <li
                key={f.nr}
                className="grid grid-cols-[1fr_auto] items-center gap-3 border-b py-4 transition-colors hover:bg-[#f9f4e8] sm:grid-cols-[8rem_1fr_5rem_7rem_6rem] sm:gap-4"
                style={{ borderColor: C.lineSoft }}
              >
                <span
                  className="order-1 text-[12px] tabular-nums"
                  style={{ color: C.faint, ...mono }}
                >
                  {f.nr}
                </span>
                <span
                  className="order-3 min-w-0 truncate text-[15px] font-semibold sm:order-2"
                  style={head}
                >
                  {f.klant}
                </span>
                <span
                  className="order-4 hidden text-[12.5px] tabular-nums sm:order-3 sm:inline"
                  style={{ color: C.muted, ...mono }}
                >
                  {f.datum}
                </span>
                <span className="order-5 sm:order-4">
                  <Tag alarm={acc}>{f.status}</Tag>
                </span>
                <span
                  className="order-2 text-right text-[15px] font-semibold tabular-nums sm:order-5"
                  style={{ color: acc ? C.red : C.ink, ...mono }}
                >
                  {f.bedrag}
                </span>
              </li>
            );
          })}
        </ul>
        <div className="flex items-baseline justify-between pt-5">
          <span
            className="text-[10.5px] uppercase tracking-[0.2em]"
            style={{ color: C.faint, ...mono }}
          >
            Totaal betaald
          </span>
          <span className="text-[24px] font-semibold tabular-nums" style={head}>
            {totaalBetaald}
          </span>
        </div>
      </Panel>
    </div>
  );
}
