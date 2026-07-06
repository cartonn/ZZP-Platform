"use client";

// Concept 132 — "Sluis" · Deltawerken / waterpeil-infographic als datataal.
// Op een staalblauw ingenieurs-canvas (#0d2438) leest het platform als een Rijkswaterstaat-doorsnede:
// NAP-peillijnen, sluis/stuw-secties, waterstand-curves, peilschalen en stroomdiagram-pijlen.
// Voortgang & verificatie tonen als "het waterpeil stijgt naar geverifieerd". Data-dicht en
// technisch-ingenieurs. Onderscheidend van meteo (isobaren) en portolaan (zeekaart): dit is
// HYDRAULISCHE INFRASTRUCTUUR met peilen en debieten. Fonts: Geist + Geist Mono.

import { useMemo, useState } from "react";
import {
  ArrowRight,
  Check,
  Clock,
  AlertTriangle,
  XCircle,
  Search,
  Waves,
  ShieldCheck,
  Plus,
  MapPin,
  Coins,
  CalendarDays,
  Gauge,
  TrendingUp,
  Droplets,
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

// Sluis-palet — diep staalblauw canvas, cyaan waterlijn, amber als waarschuwing/hoogwater.
const C = {
  bg: "#0d2438", // diep staalblauw (nachtelijk water)
  panel: "#12304a", // paneel-water
  panelSoft: "#0f2942", // gedempt paneel-water
  fg: "#eaf3fb", // helder schrift
  fgSoft: "#9fb8ce", // gedempt schrift
  fgFaint: "#6a869e", // fijn schrift
  cyan: "#3fc6e0", // cyaan waterlijn (accent)
  cyanDeep: "#2a97b8",
  steel: "#4f83bd", // staalblauw (secundair, sluisdeur)
  amber: "#e0a13f", // amber waarschuwing (hoogwater)
  green: "#4bbd82", // geverifieerd (veilig peil)
  red: "#e0655a", // afgekeurd / kritiek
  line: "#204866", // rasterlijn
  lineStrong: "#2d5c80",
  grid: "rgba(63,198,224,0.10)",
};

const display = { fontFamily: "var(--font-lab-geist)" };
const mono = { fontFamily: "var(--font-lab-geist-mono)" };
const ui = { fontFamily: "var(--font-lab-geist)" };

// ── Water-motieven ───────────────────────────────────────────────────────────
// Ingenieurs-raster met een lichte peillijn-gloed onderin (het "wateroppervlak").
const engineeringGrid =
  "repeating-linear-gradient(0deg, rgba(63,198,224,0.06) 0 1px, transparent 1px 26px)," +
  "repeating-linear-gradient(90deg, rgba(63,198,224,0.06) 0 1px, transparent 1px 26px)," +
  "linear-gradient(180deg, rgba(13,36,56,0) 40%, rgba(42,151,184,0.10) 100%)," +
  "radial-gradient(120% 80% at 50% -10%, rgba(79,131,189,0.18), transparent 60%)";

// Peilschaal — verticale NAP-schaal met streepjes, gebruikt als "logo"/meter.
function PeilSchaal({ level, size = 46 }: { level: number; size?: number }) {
  const y = 92 - (level / 100) * 84; // 0..100 → onder..boven
  return (
    <span
      className="relative inline-flex shrink-0 overflow-hidden rounded-[3px]"
      style={{
        width: size,
        height: size,
        background: "#0a1e30",
        border: `1px solid ${C.lineStrong}`,
      }}
    >
      <svg viewBox="0 0 100 100" className="h-full w-full" aria-hidden="true">
        {/* water */}
        <rect x="0" y={y} width="100" height={100 - y} fill={C.cyanDeep} opacity="0.55" />
        <line x1="0" y1={y} x2="100" y2={y} stroke={C.cyan} strokeWidth="2.5" />
        {/* peilstrepen */}
        {Array.from({ length: 9 }).map((_, i) => {
          const yy = 8 + i * 10;
          const long = i % 2 === 0;
          return (
            <line
              key={i}
              x1={long ? 62 : 70}
              y1={yy}
              x2="88"
              y2={yy}
              stroke={C.steel}
              strokeWidth="1.4"
              opacity="0.8"
            />
          );
        })}
      </svg>
    </span>
  );
}

// Waterstand-curve (sparkline als vloedcurve, met vlak eronder).
function WaterCurve({ data, tone }: { data: number[]; tone: string }) {
  const max = Math.max(...data);
  const min = Math.min(...data);
  const span = max - min || 1;
  const pts = data.map((v, i) => {
    const x = (i / (data.length - 1)) * 100;
    const y = 100 - ((v - min) / span) * 82 - 9;
    return `${x},${y}`;
  });
  return (
    <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="h-9 w-full" aria-hidden="true">
      <polyline
        points={`0,100 ${pts.join(" ")} 100,100`}
        fill={tone}
        opacity={0.16}
        stroke="none"
      />
      <polyline
        points={pts.join(" ")}
        fill="none"
        stroke={tone}
        strokeWidth={2.4}
        strokeLinecap="round"
        strokeLinejoin="round"
        vectorEffect="non-scaling-stroke"
      />
    </svg>
  );
}

// Sluis-doorsnede voor de detailkop: twee sluisdeuren met een waterpeil ertussen.
function SluisDoorsnede({ level }: { level: number }) {
  const waterTop = 78 - (level / 100) * 48;
  return (
    <svg viewBox="0 0 200 100" className="h-full w-full" aria-hidden="true">
      {/* kolk-bodem + wanden */}
      <rect
        x="24"
        y="20"
        width="152"
        height="62"
        fill="#0a1e30"
        stroke={C.lineStrong}
        strokeWidth="1.4"
      />
      {/* water */}
      <rect
        x="26"
        y={waterTop}
        width="148"
        height={80 - waterTop}
        fill={C.cyanDeep}
        opacity="0.5"
      />
      <line x1="26" y1={waterTop} x2="174" y2={waterTop} stroke={C.cyan} strokeWidth="1.8" />
      {/* golfjes */}
      <path
        d={`M26 ${waterTop} q 12 -3 24 0 t 24 0 t 24 0 t 24 0 t 24 0`}
        fill="none"
        stroke={C.cyan}
        strokeWidth="1"
        opacity="0.5"
      />
      {/* sluisdeuren */}
      <rect x="20" y="14" width="8" height="72" fill={C.steel} />
      <rect x="172" y="14" width="8" height="72" fill={C.steel} />
      {/* debiet-pijl */}
      <line x1="90" y1="90" x2="122" y2="90" stroke={C.cyan} strokeWidth="1.6" />
      <path d="M122 90 L116 87 L116 93 Z" fill={C.cyan} />
    </svg>
  );
}

// ── Status-codering ──────────────────────────────────────────────────────────
function statusMeta(s: CredStatus): {
  label: string;
  Icon: LucideIcon;
  tone: string;
  peil: number;
} {
  switch (s) {
    case "VERIFIED":
      return { label: "Op veilig peil", Icon: Check, tone: C.green, peil: 100 };
    case "SUBMITTED":
      return { label: "Peil stijgt", Icon: Clock, tone: C.cyan, peil: 55 };
    case "EXPIRING":
      return { label: "Peil daalt", Icon: AlertTriangle, tone: C.amber, peil: 34 };
    case "REJECTED":
      return { label: "Onder kritiek", Icon: XCircle, tone: C.red, peil: 12 };
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
      className={`relative rounded-xl ${
        interactive
          ? "transition-transform duration-200 hover:-translate-y-0.5 motion-reduce:hover:translate-y-0"
          : ""
      } ${className}`}
      style={{
        background: C.panel,
        border: `1px solid ${C.line}`,
        boxShadow: "inset 0 1px 0 rgba(255,255,255,0.03)",
        ...(accent ? { borderTop: `2px solid ${accent}` } : null),
      }}
    >
      {children}
    </div>
  );
}

function Chip({
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
      className="inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-[11px] font-medium leading-none"
      style={
        solid
          ? { ...mono, background: tone, color: C.bg }
          : { ...mono, background: `${tone}1f`, color: tone, border: `1px solid ${tone}55` }
      }
    >
      {children}
    </span>
  );
}

// Peilbalk — horizontale waterstand-meter met NAP-referentiestreep.
function PeilBalk({ value, tone }: { value: number; tone: string }) {
  return (
    <div className="flex items-center gap-2.5">
      <div
        className="relative h-2.5 w-28 overflow-hidden rounded-full"
        style={{ background: "#0a1e30", border: `1px solid ${C.line}` }}
        aria-hidden="true"
      >
        <div
          className="absolute inset-y-0 left-0 rounded-full"
          style={{ width: `${value}%`, background: tone }}
        />
        <div
          className="absolute inset-y-0"
          style={{ left: "90%", width: 1.5, background: C.fgFaint }}
        />
      </div>
      <span className="text-[13px] font-semibold tabular-nums" style={{ ...mono, color: tone }}>
        {value}%
      </span>
    </div>
  );
}

function Kop({
  children,
  sub,
  level = 70,
}: {
  children: React.ReactNode;
  sub?: string;
  level?: number;
}) {
  return (
    <div className="flex items-center gap-3">
      <PeilSchaal level={level} size={36} />
      <div>
        {sub && (
          <div
            className="mb-1 text-[10px] font-semibold uppercase tracking-[0.22em]"
            style={{ ...mono, color: C.cyan }}
          >
            {sub}
          </div>
        )}
        <h2
          className="text-[24px] font-semibold leading-none tracking-[-0.02em] sm:text-[29px]"
          style={{ ...display, color: C.fg }}
        >
          {children}
        </h2>
      </div>
    </div>
  );
}

export function Concept132() {
  const [screen, setScreen] = useState<ScreenKey>("dashboard");
  const active = OPDRACHTEN[0] as Opdracht;

  return (
    <div
      className="min-h-[680px] w-full antialiased"
      style={{ ...ui, background: C.bg, backgroundImage: engineeringGrid, color: C.fg }}
    >
      {/* Kop — sluis-merk */}
      <header className="mx-auto flex max-w-5xl items-center justify-between px-5 pt-8 md:px-10">
        <div className="flex items-center gap-3.5">
          <PeilSchaal level={82} size={46} />
          <div className="leading-none">
            <div
              className="text-[21px] font-semibold tracking-[-0.02em]"
              style={{ ...display, color: C.fg }}
            >
              Sluis
            </div>
            <div
              className="mt-1.5 flex items-center gap-1.5 text-[9.5px] font-semibold uppercase tracking-[0.2em]"
              style={{ ...mono, color: C.fgFaint }}
            >
              <Waves size={11} strokeWidth={2.2} aria-hidden="true" /> NAP · ZZP-platform
            </div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="hidden text-right leading-tight sm:block">
            <div className="text-[13px] font-semibold" style={{ color: C.fg }}>
              {PROFIEL.naam}
            </div>
            <div className="text-[10.5px]" style={{ ...mono, color: C.fgSoft }}>
              {PROFIEL.rol}
            </div>
          </div>
          <span
            className="flex h-11 w-11 items-center justify-center rounded-lg text-[12px] font-semibold"
            style={{ ...mono, background: C.steel, color: C.bg }}
            aria-hidden="true"
          >
            {PROFIEL.initialen}
          </span>
        </div>
      </header>

      {/* Navigatie — peilstations-strip */}
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
              className="relative shrink-0 px-3.5 py-2.5 text-[12.5px] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
              style={{ ...mono, color: on ? C.fg : C.fgSoft, fontWeight: on ? 600 : 500 }}
            >
              {s.label}
              {on && (
                <span
                  className="absolute -bottom-px left-2 right-2 h-[3px] rounded-t-full"
                  style={{ background: C.cyan }}
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
  const tones = [C.cyan, C.green, C.steel, C.amber];
  return (
    <div className="space-y-10">
      <section>
        <div
          className="flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.22em]"
          style={{ ...mono, color: C.cyan }}
        >
          <Gauge size={12} strokeWidth={2.4} aria-hidden="true" /> Peilstation · {PROFIEL.plaats}
        </div>
        <h1
          className="mt-2.5 text-[34px] font-semibold leading-[1.04] tracking-[-0.03em] sm:text-[45px]"
          style={{ ...display, color: C.fg }}
        >
          Goedemorgen, {PROFIEL.naam.split(" ")[0]}
        </h1>
        <p className="mt-2.5 max-w-md text-[14px] leading-relaxed" style={{ color: C.fgSoft }}>
          Het peil staat gunstig. Eén sluis vraagt vandaag om bediening — de rest stroomt op schema.
        </p>
      </section>

      {/* Primaire actie — als sluisbediening */}
      <Panel accent={C.amber} className="p-0">
        <div className="flex flex-col gap-5 p-6 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex min-w-0 items-start gap-4">
            <span
              className="mt-0.5 flex h-12 w-12 shrink-0 items-center justify-center rounded-lg"
              style={{ background: `${C.amber}1c`, border: `1px solid ${C.amber}55` }}
              aria-hidden="true"
            >
              <AlertTriangle size={20} strokeWidth={2.2} style={{ color: C.amber }} />
            </span>
            <div className="min-w-0">
              <span
                className="inline-flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.16em]"
                style={{ ...mono, color: C.amber }}
              >
                Hoogwater · vraagt bediening
              </span>
              <h2
                className="mt-1.5 text-[23px] font-semibold leading-tight sm:text-[27px]"
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
            className="group inline-flex shrink-0 items-center gap-2.5 rounded-lg px-6 py-3 text-[13px] font-semibold transition-all hover:gap-3.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 motion-reduce:hover:gap-2.5"
            style={{ background: C.amber, color: C.bg }}
          >
            {primair.cta}
            <ArrowRight size={16} aria-hidden="true" />
          </button>
        </div>
      </Panel>

      {/* KPI-tegels — als peilmeters */}
      <section>
        <Kop sub="Meetwaarden" level={64}>
          Prestatie
        </Kop>
        <div className="mt-5 grid grid-cols-2 gap-4 lg:grid-cols-4">
          {KPIS.map((k, i) => {
            const tone = tones[i % tones.length] as string;
            return (
              <Panel key={k.label} interactive className="p-4">
                <div className="flex items-start justify-between">
                  <Droplets size={16} style={{ color: tone }} aria-hidden="true" />
                  <span
                    className="inline-flex items-center gap-1 text-[10.5px] font-semibold tabular-nums"
                    style={{ ...mono, color: k.up ? C.green : C.amber }}
                  >
                    <TrendingUp
                      size={11}
                      strokeWidth={2.6}
                      style={k.up ? undefined : { transform: "scaleY(-1)" }}
                      aria-hidden="true"
                    />
                    {k.trend}
                  </span>
                </div>
                <div
                  className="mt-3 text-[27px] font-semibold tabular-nums leading-none tracking-[-0.02em]"
                  style={{ ...display, color: C.fg }}
                >
                  {k.value}
                </div>
                <div className="mt-1 text-[11px]" style={{ ...mono, color: C.fgSoft }}>
                  {k.label}
                </div>
                <div className="mt-3">
                  <WaterCurve data={k.spark} tone={tone} />
                </div>
              </Panel>
            );
          })}
        </div>
      </section>

      {/* Top-match */}
      <section>
        <Kop sub="Beste stroming" level={88}>
          Voor jou
        </Kop>
        <button
          onClick={onOpen}
          className="group mt-5 block w-full text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
        >
          <Panel interactive className="flex flex-col gap-5 p-5 sm:flex-row sm:items-center">
            <span
              className="relative flex h-20 w-28 shrink-0 items-center justify-center overflow-hidden rounded-lg"
              style={{ background: "#0a1e30", border: `1px solid ${C.line}` }}
              aria-hidden="true"
            >
              <SluisDoorsnede level={top.match} />
              <span
                className="absolute bottom-1 right-1.5 rounded px-1.5 py-0.5 text-[13px] font-semibold tabular-nums"
                style={{ ...mono, background: "rgba(10,30,48,0.75)", color: C.cyan }}
              >
                {top.match}%
              </span>
            </span>
            <div className="min-w-0 flex-1">
              <h3
                className="text-[20px] font-semibold leading-tight"
                style={{ ...display, color: C.fg }}
              >
                {top.titel}
              </h3>
              <div className="mt-1 text-[12px]" style={{ ...mono, color: C.fgSoft }}>
                {top.opdrachtgever} · {top.plaats} · {top.tarief}
              </div>
              <div className="mt-3 flex flex-wrap gap-1.5">
                {top.tags.map((t) => (
                  <Chip key={t} tone={C.cyan}>
                    {t}
                  </Chip>
                ))}
              </div>
            </div>
            <ArrowRight
              size={22}
              className="hidden shrink-0 transition-transform group-hover:translate-x-1 motion-reduce:group-hover:translate-x-0 md:block"
              style={{ color: C.cyan }}
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
      <Kop sub="Vaargeulen" level={72}>
        Marktplaats
      </Kop>

      <Panel className="flex items-center gap-3 px-4">
        <Search size={17} style={{ color: C.fgFaint }} aria-hidden="true" />
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Zoek op titel, plaats of opdrachtgever…"
          aria-label="Opdrachten zoeken"
          className="w-full bg-transparent py-3 text-[13px] outline-none placeholder:opacity-50"
          style={{ ...mono, color: C.fg }}
        />
        <span
          className="shrink-0 text-[12px] font-semibold tabular-nums"
          style={{ ...mono, color: C.fgFaint }}
        >
          {filtered.length}
        </span>
      </Panel>

      {filtered.length === 0 ? (
        <Panel className="flex flex-col items-center justify-center gap-3 p-14 text-center">
          <PeilSchaal level={8} size={54} />
          <p className="text-[20px] font-semibold" style={{ ...display, color: C.fg }}>
            Droogval — geen geulen
          </p>
          <p className="max-w-xs text-[13px]" style={{ color: C.fgSoft }}>
            Niets past bij “{q}”. Verruim je zoekopdracht of je beschikbaarheid.
          </p>
          <button
            onClick={() => setQ("")}
            className="mt-2 inline-flex items-center gap-2 rounded-lg px-4 py-2 text-[12px] font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
            style={{ background: C.cyan, color: C.bg }}
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
                  <PeilSchaal level={o.match} size={46} />
                  <div className="min-w-0 flex-1">
                    <h3
                      className="text-[18px] font-semibold leading-tight"
                      style={{ ...display, color: C.fg }}
                    >
                      {o.titel}
                    </h3>
                    <div className="mt-0.5 text-[11.5px]" style={{ ...mono, color: C.fgSoft }}>
                      {o.opdrachtgever} · {o.plaats} · {o.tarief}
                    </div>
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {o.tags.map((t) => (
                        <Chip key={t} tone={C.fgSoft}>
                          {t}
                        </Chip>
                      ))}
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <PeilBalk value={o.match} tone={o.match >= 90 ? C.green : C.cyan} />
                    <ArrowRight
                      size={19}
                      className="shrink-0 transition-transform group-hover:translate-x-1 motion-reduce:group-hover:translate-x-0"
                      style={{ color: C.cyan }}
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
        className="inline-flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.08em] transition-opacity hover:opacity-60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
        style={{ ...mono, color: C.fgSoft }}
      >
        <ArrowRight size={14} className="rotate-180" aria-hidden="true" /> Terug naar marktplaats
      </button>

      <section className="flex items-start gap-4">
        <span
          className="hidden h-16 w-24 shrink-0 overflow-hidden rounded-lg sm:block"
          style={{ background: "#0a1e30", border: `1px solid ${C.line}` }}
          aria-hidden="true"
        >
          <SluisDoorsnede level={opdracht.match} />
        </span>
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span
              className="text-[10.5px] font-semibold uppercase tracking-[0.14em]"
              style={{ ...mono, color: C.fgFaint }}
            >
              {opdracht.id}
            </span>
            <Chip tone={C.cyan} solid>
              {opdracht.match}% stroming
            </Chip>
          </div>
          <h1
            className="mt-2 text-[30px] font-semibold leading-[1.06] tracking-[-0.03em] sm:text-[39px]"
            style={{ ...display, color: C.fg }}
          >
            {opdracht.titel}
          </h1>
          <p className="mt-1.5 text-[12.5px]" style={{ ...mono, color: C.fgSoft }}>
            {opdracht.opdrachtgever} · {opdracht.plaats}
          </p>
        </div>
      </section>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {feiten.map((m) => (
          <Panel key={m.l} className="p-4">
            <m.Icon size={16} style={{ color: C.cyan }} aria-hidden="true" />
            <div
              className="mt-2 text-[18px] font-semibold tabular-nums leading-none"
              style={{ ...display, color: C.fg }}
            >
              {m.v}
            </div>
            <div
              className="mt-1.5 text-[9.5px] font-semibold uppercase tracking-[0.12em]"
              style={{ ...mono, color: C.fgFaint }}
            >
              {m.l}
            </div>
          </Panel>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <Panel className="p-5" accent={C.green}>
          <div
            className="inline-flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.12em]"
            style={{ ...mono, color: C.green }}
          >
            <Check size={14} strokeWidth={2.8} aria-hidden="true" /> Op peil
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
        <Panel className="p-5" accent={C.amber}>
          <div
            className="inline-flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.12em]"
            style={{ ...mono, color: C.amber }}
          >
            <AlertTriangle size={14} strokeWidth={2.8} aria-hidden="true" /> Bewaking
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
                  style={{ background: C.amber }}
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
          className="group inline-flex flex-1 items-center justify-center gap-2.5 rounded-lg px-7 py-3.5 text-[14px] font-semibold transition-all hover:gap-3.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 motion-reduce:hover:gap-2.5"
          style={{ background: C.cyan, color: C.bg }}
        >
          Reageer op opdracht <ArrowRight size={16} aria-hidden="true" />
        </button>
        <button
          className="inline-flex items-center justify-center gap-2 rounded-lg px-6 py-3.5 text-[14px] font-semibold transition-colors hover:bg-white/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
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
      <Kop sub="Waterpeil" level={pct}>
        Verificatie
      </Kop>

      <Panel accent={C.cyan} className="flex flex-col items-center gap-6 p-6 sm:flex-row">
        <div className="relative h-28 w-28 shrink-0">
          <PeilSchaal level={pct} size={112} />
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span
              className="rounded-md px-2 py-1 text-center leading-none"
              style={{ background: "rgba(10,30,48,0.7)" }}
            >
              <span
                className="block text-[23px] font-semibold tabular-nums"
                style={{ ...display, color: C.fg }}
              >
                {pct}%
              </span>
              <span
                className="block text-[8.5px] font-semibold uppercase tracking-[0.16em]"
                style={{ ...mono, color: C.cyan }}
              >
                op peil
              </span>
            </span>
          </div>
        </div>
        <div className="text-center sm:text-left">
          <span
            className="inline-flex items-center gap-2 rounded-md px-3 py-1 text-[12px] font-semibold"
            style={{
              ...mono,
              background: `${C.green}1f`,
              color: C.green,
              border: `1px solid ${C.green}55`,
            }}
          >
            <ShieldCheck size={15} strokeWidth={2.4} aria-hidden="true" /> {PROFIEL.trust}
          </span>
          <p className="mt-3 max-w-md text-[14px] leading-relaxed" style={{ color: C.fgSoft }}>
            {verified} van {CREDENTIALS.length} dossiers staan op veilig peil. Elke geverifieerde
            sluis laat het waterpeil stijgen — één dossier zakt binnenkort onder de streep.
          </p>
        </div>
      </Panel>

      <ul className="space-y-3">
        {CREDENTIALS.map((c) => {
          const st = statusMeta(c.status);
          return (
            <li key={c.naam}>
              <Panel className="flex items-center gap-4 p-4">
                <PeilSchaal level={st.peil} size={44} />
                <div className="min-w-0 flex-1">
                  <div
                    className="text-[15px] font-semibold leading-tight"
                    style={{ ...display, color: C.fg }}
                  >
                    {c.naam}
                  </div>
                  <div className="mt-0.5 text-[11.5px]" style={{ ...mono, color: C.fgSoft }}>
                    {c.detail}
                  </div>
                </div>
                <Chip tone={st.tone}>
                  <st.Icon size={12} strokeWidth={2.8} aria-hidden="true" />
                  <span className="hidden sm:inline">{st.label}</span>
                </Chip>
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
      <Kop sub="Sluisbediening" level={60}>
        Volgende acties
      </Kop>
      <ol className="space-y-3">
        {sorted.map((a, i) => {
          const warn = a.urgentie === "warning";
          const tone = warn ? C.amber : C.cyan;
          return (
            <li key={a.titel}>
              <Panel
                className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center"
                accent={warn ? C.amber : undefined}
              >
                <span
                  className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg text-[15px] font-semibold tabular-nums"
                  style={{
                    ...mono,
                    background: `${tone}1c`,
                    color: tone,
                    border: `1px solid ${tone}55`,
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
                        strokeWidth={2.6}
                        style={{ color: tone }}
                        aria-hidden="true"
                      />
                    ) : (
                      <Waves
                        size={14}
                        strokeWidth={2.6}
                        style={{ color: tone }}
                        aria-hidden="true"
                      />
                    )}
                    <h3
                      className="text-[17px] font-semibold leading-tight"
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
                  className="shrink-0 self-start rounded-lg px-5 py-2.5 text-[12.5px] font-semibold transition-transform hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 motion-reduce:hover:translate-y-0 sm:self-center"
                  style={{ background: tone, color: C.bg }}
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
    if (status === "Openstaand") return C.amber;
    if (status === "Concept") return C.fgFaint;
    return C.cyan;
  };
  return (
    <div className="space-y-7">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <Kop sub="Debiet" level={76}>
          Facturen
        </Kop>
        <button
          className="inline-flex items-center gap-2 rounded-lg px-4 py-2.5 text-[12.5px] font-semibold transition-all hover:gap-3 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 motion-reduce:hover:gap-2"
          style={{ background: C.cyan, color: C.bg }}
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
                  className={`px-4 py-3 text-[9.5px] font-semibold uppercase tracking-[0.12em] ${i === 4 ? "text-right" : ""}`}
                  style={{ ...mono, color: C.fgFaint }}
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
                  className="transition-colors hover:bg-white/[0.03]"
                  style={{ borderBottom: `1px solid ${C.line}` }}
                >
                  <td
                    className="px-4 py-3.5 text-[12px] tabular-nums"
                    style={{ ...mono, color: C.fgSoft }}
                  >
                    {f.nr}
                  </td>
                  <td className="px-4 py-3.5 text-[14px]" style={{ color: C.fg }}>
                    {f.klant}
                  </td>
                  <td
                    className="px-4 py-3.5 text-[12px] tabular-nums"
                    style={{ ...mono, color: C.fgSoft }}
                  >
                    {f.datum}
                  </td>
                  <td className="px-4 py-3.5">
                    <Chip tone={tone}>
                      <span
                        className="h-1.5 w-1.5 rounded-full"
                        style={{ background: tone }}
                        aria-hidden="true"
                      />
                      {f.status}
                    </Chip>
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
                className="px-4 py-4 text-[9.5px] font-semibold uppercase tracking-[0.14em]"
                style={{ ...mono, color: C.fgFaint }}
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
