"use client";

// Concept 397 — "Metrokaart" · Transit-schema & wayfinding.
// De informatie-architectuur is een OV-/metrokaart: gekleurde lijnen verbinden schermen en stappen,
// ronde "stations"-knopen markeren mijlpalen, verbindingen lopen schematisch (45°/90°). Een duidelijke
// lijn-legenda vertaalt kleur naar betekenis. De verificatie- en next-action-flow wordt een reisroute
// met stations: waar sta je, waar moet je heen, welke lijn brengt je daar. Helder wit veld met
// verzadigde, leesbare OV-lijnkleuren (rood/blauw/groen/geel) en stevige labels.
// Fonts: strakke grotesk (Space Grotesk / system-sans) + mono voor cijfers/codes.

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
  MapPin,
  Navigation,
  CircleDot,
  Milestone,
  Ticket,
  Bell,
  X,
  TrendingUp,
  TrendingDown,
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

// — Palet: helder wit veld + verzadigde OV-lijnkleuren —
const C = {
  paper: "#ffffff",
  field: "#f6f7f9",
  fieldAlt: "#eef0f4",
  ink: "#16181d",
  inkSoft: "#33373f",
  muted: "#5c626d",
  faint: "#8a909c",
  line: "#e0e3e9",
  lineSoft: "#eaecf1",
  rail: "#c7ccd6",
  // OV-lijnkleuren
  red: "#e2231a",
  redWash: "rgba(226,35,26,0.10)",
  blue: "#0057b8",
  blueWash: "rgba(0,87,184,0.10)",
  green: "#009b48",
  greenWash: "rgba(0,155,72,0.11)",
  yellow: "#ffb500",
  yellowInk: "#8a5b00",
  yellowWash: "rgba(255,181,0,0.16)",
};

const sans = { fontFamily: "var(--font-lab-space), system-ui, sans-serif" };
const mono = { fontFamily: "var(--font-lab-mono), ui-monospace, monospace" };

// Elke lijn = een betekenislaag in het schema.
const LINES: { key: string; label: string; color: string; wash: string }[] = [
  { key: "route", label: "Route (jouw reis)", color: C.blue, wash: C.blueWash },
  { key: "verified", label: "Geverifieerd", color: C.green, wash: C.greenWash },
  { key: "attention", label: "Aandacht nodig", color: C.yellow, wash: C.yellowWash },
  { key: "blocked", label: "Geblokkeerd", color: C.red, wash: C.redWash },
];

function statusMeta(s: CredStatus): {
  label: string;
  Icon: LucideIcon;
  color: string;
  wash: string;
  ink: string;
  alarm: boolean;
} {
  switch (s) {
    case "VERIFIED":
      return {
        label: "Geverifieerd",
        Icon: ShieldCheck,
        color: C.green,
        wash: C.greenWash,
        ink: C.green,
        alarm: false,
      };
    case "SUBMITTED":
      return {
        label: "In beoordeling",
        Icon: Clock,
        color: C.blue,
        wash: C.blueWash,
        ink: C.blue,
        alarm: false,
      };
    case "EXPIRING":
      return {
        label: "Verloopt binnenkort",
        Icon: AlertTriangle,
        color: C.yellow,
        wash: C.yellowWash,
        ink: C.yellowInk,
        alarm: true,
      };
    case "REJECTED":
      return {
        label: "Afgewezen",
        Icon: X,
        color: C.red,
        wash: C.redWash,
        ink: C.red,
        alarm: true,
      };
  }
}

// — Station: ronde knoop op een lijn (dubbele ring, mono-glyph) —
function Station({
  size = 26,
  color = C.blue,
  filled = false,
  interchange = false,
}: {
  size?: number;
  color?: string;
  filled?: boolean;
  interchange?: boolean;
}) {
  return (
    <span
      className="relative inline-flex shrink-0 items-center justify-center rounded-full"
      style={{
        width: size,
        height: size,
        background: filled ? color : C.paper,
        border: `${interchange ? 4 : 3}px solid ${color}`,
        boxShadow: interchange ? `0 0 0 3px ${C.paper}, 0 1px 2px rgba(0,0,0,0.12)` : "none",
      }}
      aria-hidden="true"
    >
      {filled && <Check size={size * 0.5} color={C.paper} strokeWidth={3} />}
    </span>
  );
}

// — Lijn-tegel / kaartblad met dunne rail-rand —
function Panel({
  children,
  className = "",
  as: Tag = "div",
}: {
  children: React.ReactNode;
  className?: string;
  as?: "div" | "section" | "li";
}) {
  return (
    <Tag
      className={`rounded-2xl ${className}`}
      style={{ background: C.paper, border: `1px solid ${C.line}` }}
    >
      {children}
    </Tag>
  );
}

function Overline({ children, color = C.blue }: { children: React.ReactNode; color?: string }) {
  return (
    <div className="flex items-center gap-2">
      <span
        className="inline-block h-2.5 w-2.5 rounded-full"
        style={{ background: color }}
        aria-hidden="true"
      />
      <p className="text-[10.5px] font-bold uppercase tracking-[0.22em]" style={{ color, ...mono }}>
        {children}
      </p>
    </div>
  );
}

function Chip({
  children,
  color = C.muted,
  wash,
  strong = false,
}: {
  children: React.ReactNode;
  color?: string;
  wash?: string;
  strong?: boolean;
}) {
  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-bold"
      style={{
        color: strong ? C.paper : color,
        background: strong ? color : (wash ?? C.field),
        border: strong ? "none" : `1px solid ${wash ? "transparent" : C.line}`,
        ...sans,
      }}
    >
      {children}
    </span>
  );
}

function PrimaryButton({
  children,
  onClick,
  className = "",
  color = C.blue,
}: {
  children: React.ReactNode;
  onClick?: () => void;
  className?: string;
  color?: string;
}) {
  return (
    <button
      onClick={onClick}
      className={`group inline-flex items-center justify-center gap-2 rounded-full px-5 py-2.5 text-[13px] font-bold text-white transition-transform duration-150 hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#16181d] focus-visible:ring-offset-2 focus-visible:ring-offset-white active:translate-y-0 motion-reduce:transition-none motion-reduce:hover:translate-y-0 ${className}`}
      style={{ background: color, ...sans }}
    >
      {children}
    </button>
  );
}

function GhostButton({
  children,
  onClick,
  active = false,
  ariaPressed,
  className = "",
}: {
  children: React.ReactNode;
  onClick?: () => void;
  active?: boolean;
  ariaPressed?: boolean;
  className?: string;
}) {
  return (
    <button
      onClick={onClick}
      aria-pressed={ariaPressed}
      className={`inline-flex items-center justify-center gap-2 rounded-full px-4 py-2.5 text-[12.5px] font-bold transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0057b8] focus-visible:ring-offset-2 focus-visible:ring-offset-white motion-reduce:transition-none ${className}`}
      style={{
        color: active ? C.blue : C.inkSoft,
        background: active ? C.blueWash : C.paper,
        border: `1px solid ${active ? C.blue : C.line}`,
        ...sans,
      }}
    >
      {children}
    </button>
  );
}

// — Sparkline die als "lijn-diagram" leest (rechte segmenten, stations op knikpunten) —
function RouteSpark({ data, color }: { data: number[]; color: string }) {
  const max = Math.max(...data);
  const min = Math.min(...data);
  const span = max - min || 1;
  const w = 116;
  const h = 32;
  const pts = data.map((d, i) => {
    const x = (i / (data.length - 1)) * w;
    const y = h - ((d - min) / span) * (h - 8) - 4;
    return [x, y] as const;
  });
  const line = pts.map(([x, y]) => `${x.toFixed(1)},${y.toFixed(1)}`).join(" ");
  const last = pts[pts.length - 1];
  const first = pts[0];
  return (
    <svg
      width="100%"
      height={h}
      viewBox={`0 0 ${w} ${h}`}
      preserveAspectRatio="none"
      aria-hidden="true"
      className="overflow-visible"
    >
      <polyline
        points={line}
        fill="none"
        stroke={color}
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {first && (
        <circle cx={first[0]} cy={first[1]} r="2.6" fill={C.paper} stroke={color} strokeWidth="2" />
      )}
      {last && <circle cx={last[0]} cy={last[1]} r="3.4" fill={color} />}
    </svg>
  );
}

// — Match-balk als perron-schaal —
function MatchBar({ value }: { value: number }) {
  const color = value >= 90 ? C.green : value >= 84 ? C.blue : C.yellow;
  return (
    <div className="flex items-center gap-2">
      <span
        className="relative h-2 w-20 overflow-hidden rounded-full"
        style={{ background: C.fieldAlt }}
        aria-hidden="true"
      >
        <span
          className="absolute inset-y-0 left-0 rounded-full"
          style={{ width: `${value}%`, background: color }}
        />
      </span>
      <span className="text-[12.5px] font-bold tabular-nums" style={{ color, ...mono }}>
        {value}%
      </span>
    </div>
  );
}

export function Concept397() {
  const [screen, setScreen] = useState<ScreenKey>("dashboard");
  const active = OPDRACHTEN[0] as Opdracht;

  return (
    <div
      className="min-h-[720px] w-full antialiased"
      style={{ ...sans, color: C.ink, background: C.field }}
    >
      <div className="mx-auto max-w-6xl px-4 pb-24 sm:px-6 md:px-8">
        <TopBar screen={screen} />
        <MetroNav screen={screen} setScreen={setScreen} />
        <LineLegend />
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

function TopBar({ screen }: { screen: ScreenKey }) {
  const ongelezen = BERICHTEN.filter((b) => b.ongelezen).length;
  const here = SCREENS.find((s) => s.key === screen)?.label ?? "Dashboard";
  return (
    <header className="flex items-center justify-between gap-4 pt-7">
      <div className="flex items-center gap-3">
        <span
          className="inline-flex h-11 w-11 items-center justify-center rounded-xl"
          style={{ background: C.blue }}
          aria-hidden="true"
        >
          <Navigation size={20} color={C.paper} />
        </span>
        <div>
          <p className="text-[19px] font-bold leading-none tracking-[-0.01em]" style={sans}>
            Metrokaart
          </p>
          <p
            className="mt-1 flex items-center gap-1.5 text-[11px] font-semibold leading-none"
            style={{ color: C.faint, ...mono }}
          >
            <MapPin size={11} aria-hidden="true" /> Je bent hier · {here}
          </p>
        </div>
      </div>
      <div className="flex items-center gap-2.5">
        <span
          className="hidden items-center gap-1.5 rounded-full px-3 py-1.5 text-[11px] font-bold sm:inline-flex"
          style={{ color: C.green, background: C.greenWash }}
        >
          <ShieldCheck size={13} aria-hidden="true" />
          {PROFIEL.trust}
        </span>
        <span
          className="relative inline-flex h-10 w-10 items-center justify-center rounded-full"
          style={{ background: C.paper, border: `1px solid ${C.line}`, color: C.muted }}
          aria-label={`${ongelezen} ongelezen berichten`}
        >
          <Bell size={16} aria-hidden="true" />
          {ongelezen > 0 && (
            <span
              className="absolute -right-0.5 -top-0.5 flex h-4 w-4 items-center justify-center rounded-full text-[9px] font-bold text-white"
              style={{ background: C.red }}
              aria-hidden="true"
            >
              {ongelezen}
            </span>
          )}
        </span>
        <span className="hidden text-right sm:block">
          <span className="block text-[13px] font-bold" style={{ color: C.inkSoft }}>
            {PROFIEL.naam}
          </span>
          <span className="block text-[10.5px] font-semibold" style={{ color: C.faint, ...mono }}>
            {PROFIEL.rol}
          </span>
        </span>
        <span
          className="inline-flex h-11 w-11 items-center justify-center rounded-full text-[13px] font-bold text-white"
          style={{ background: C.blue }}
          aria-hidden="true"
        >
          {PROFIEL.initialen}
        </span>
      </div>
    </header>
  );
}

// — Navigatie als metrolijn: stations verbonden door een horizontale rail —
function MetroNav({ screen, setScreen }: { screen: ScreenKey; setScreen: (s: ScreenKey) => void }) {
  const activeIndex = SCREENS.findIndex((s) => s.key === screen);
  return (
    <nav aria-label="Hoofdnavigatie" className="mt-7">
      <div
        className="relative overflow-x-auto rounded-2xl px-4 py-4"
        style={{ background: C.paper, border: `1px solid ${C.line}` }}
      >
        <div className="relative flex min-w-max items-center">
          {/* De rail achter de stations */}
          <span
            className="pointer-events-none absolute left-4 right-4 top-[13px] h-[3px] rounded-full"
            style={{ background: C.rail }}
            aria-hidden="true"
          />
          <span
            className="pointer-events-none absolute left-4 top-[13px] h-[3px] rounded-full transition-all duration-300 motion-reduce:transition-none"
            style={{
              background: C.blue,
              width: `calc(${(activeIndex / Math.max(SCREENS.length - 1, 1)) * 100}% )`,
              maxWidth: "calc(100% - 2rem)",
            }}
            aria-hidden="true"
          />
          <ul className="relative flex items-start gap-2 sm:gap-6">
            {SCREENS.map((s, i) => {
              const on = s.key === screen;
              const passed = i < activeIndex;
              const color = passed ? C.blue : on ? C.blue : C.rail;
              return (
                <li key={s.key} className="flex min-w-[74px] flex-col items-center">
                  <button
                    onClick={() => setScreen(s.key)}
                    aria-current={on ? "page" : undefined}
                    className="group flex flex-col items-center gap-2 rounded-lg px-1 py-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0057b8] focus-visible:ring-offset-2 focus-visible:ring-offset-white"
                  >
                    <Station size={on ? 24 : 18} color={color} filled={passed} interchange={on} />
                    <span
                      className="whitespace-nowrap text-[11.5px] font-bold transition-colors motion-reduce:transition-none"
                      style={{ color: on ? C.blue : passed ? C.inkSoft : C.faint, ...sans }}
                    >
                      {s.label}
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
      </div>
    </nav>
  );
}

function LineLegend() {
  return (
    <div className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-2 px-1">
      <span
        className="text-[10px] font-bold uppercase tracking-[0.18em]"
        style={{ color: C.faint, ...mono }}
      >
        Legenda
      </span>
      {LINES.map((l) => (
        <span key={l.key} className="inline-flex items-center gap-2">
          <span
            className="inline-block h-[3px] w-6 rounded-full"
            style={{ background: l.color }}
            aria-hidden="true"
          />
          <span className="text-[11px] font-semibold" style={{ color: C.muted }}>
            {l.label}
          </span>
        </span>
      ))}
    </div>
  );
}

function Dashboard({ onOpen, onActies }: { onOpen: () => void; onActies: () => void }) {
  const primair = ACTIES[0] as (typeof ACTIES)[number];
  const verified = CREDENTIALS.filter((c) => c.status === "VERIFIED").length;
  return (
    <div className="space-y-7">
      <section className="grid grid-cols-1 gap-5 lg:grid-cols-[1.3fr_1fr]">
        <Panel className="relative overflow-hidden p-6 md:p-7">
          <Overline>Vertrekstaat · {PROFIEL.plaats}</Overline>
          <h1
            className="mt-4 text-[32px] font-bold leading-[1.03] tracking-[-0.02em] md:text-[40px]"
            style={sans}
          >
            Goedemorgen, {PROFIEL.naam.split(" ")[0]}.
          </h1>
          <p className="mt-3 max-w-md text-[14px] leading-relaxed" style={{ color: C.muted }}>
            Je route van vandaag in één oogopslag: waar je staat, waar je heen moet en welke lijn je
            daar het snelst brengt.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <PrimaryButton onClick={onActies}>
              Volgende halte
              <ArrowRight
                size={15}
                aria-hidden="true"
                className="transition-transform group-hover:translate-x-0.5 motion-reduce:transition-none"
              />
            </PrimaryButton>
            <GhostButton onClick={onOpen}>Naar marktplaats</GhostButton>
          </div>
        </Panel>

        {/* Volgende halte — routekaart-kaartje */}
        <Panel className="flex flex-col p-6" as="section">
          <div className="flex items-center justify-between">
            <Overline color={C.yellow}>Eerstvolgende halte</Overline>
            <span
              className="inline-flex h-8 w-8 items-center justify-center rounded-full"
              style={{ background: C.yellowWash, color: C.yellowInk }}
              aria-hidden="true"
            >
              <AlertTriangle size={15} />
            </span>
          </div>
          <div className="mt-4 flex items-start gap-3">
            <div className="flex flex-col items-center pt-1">
              <Station size={18} color={C.yellow} />
              <span
                className="my-1 w-[3px] flex-1"
                style={{ background: C.rail, minHeight: 26 }}
                aria-hidden="true"
              />
              <Station size={14} color={C.rail} />
            </div>
            <div className="min-w-0 flex-1">
              <h2 className="text-[18px] font-bold leading-snug tracking-[-0.01em]" style={sans}>
                {primair.titel}
              </h2>
              <p className="mt-1.5 text-[13px] leading-relaxed" style={{ color: C.muted }}>
                {primair.detail}
              </p>
            </div>
          </div>
          <div className="mt-5">
            <PrimaryButton onClick={onActies} color={C.yellow} className="w-full !text-[#5c3d00]">
              {primair.cta}
              <ArrowRight size={15} aria-hidden="true" />
            </PrimaryButton>
          </div>
        </Panel>
      </section>

      <section>
        <div className="mb-3 flex items-baseline justify-between">
          <Overline>Reizigersstatistiek · deze maand</Overline>
          <span className="text-[11px] font-semibold" style={{ color: C.faint, ...mono }}>
            {verified}/{CREDENTIALS.length} geverifieerd
          </span>
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {KPIS.map((k) => (
            <Panel key={k.label} className="p-5">
              <div className="flex items-start justify-between gap-2">
                <p
                  className="text-[10.5px] font-bold uppercase tracking-[0.12em]"
                  style={{ color: C.muted, ...mono }}
                >
                  {k.label}
                </p>
                <span
                  className="inline-flex items-center gap-0.5 rounded-full px-2 py-0.5 text-[10px] font-bold tabular-nums"
                  style={{
                    color: k.up ? C.green : C.yellowInk,
                    background: k.up ? C.greenWash : C.yellowWash,
                    ...mono,
                  }}
                >
                  {k.up ? (
                    <TrendingUp size={11} aria-hidden="true" />
                  ) : (
                    <TrendingDown size={11} aria-hidden="true" />
                  )}
                  {k.trend.replace(/^[+-]/, "")}
                </span>
              </div>
              <p
                className="mt-3 text-[28px] font-bold tabular-nums leading-none tracking-[-0.02em]"
                style={sans}
              >
                {k.value}
              </p>
              <div className="mt-3">
                <RouteSpark data={k.spark} color={k.up ? C.blue : C.yellow} />
              </div>
            </Panel>
          ))}
        </div>
      </section>

      <section className="grid grid-cols-1 gap-5 lg:grid-cols-[1.4fr_1fr]">
        <div>
          <div className="mb-3 flex items-baseline justify-between">
            <Overline>Aansluitingen · open opdrachten</Overline>
            <button
              onClick={onOpen}
              className="rounded-md text-[12px] font-bold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0057b8] focus-visible:ring-offset-2"
              style={{ color: C.blue }}
            >
              Alle lijnen
            </button>
          </div>
          <ul className="space-y-3">
            {OPDRACHTEN.map((o, i) => (
              <li key={o.id}>
                <button
                  onClick={onOpen}
                  className="group grid w-full grid-cols-[auto_1fr_auto] items-center gap-3 rounded-2xl p-4 text-left transition-colors hover:bg-[#f6f7f9] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0057b8] focus-visible:ring-offset-2 focus-visible:ring-offset-white motion-reduce:transition-none"
                  style={{ background: C.paper, border: `1px solid ${C.line}` }}
                >
                  <Station size={30} color={i === 0 ? C.green : C.blue} interchange={i === 0} />
                  <span className="min-w-0">
                    <span className="block truncate text-[15px] font-bold" style={sans}>
                      {o.titel}
                    </span>
                    <span
                      className="mt-0.5 block truncate text-[12px]"
                      style={{ color: C.muted, ...mono }}
                    >
                      {o.opdrachtgever} · {o.plaats} · {o.tarief}
                    </span>
                  </span>
                  <span className="flex items-center gap-3">
                    <span className="hidden sm:block">
                      <MatchBar value={o.match} />
                    </span>
                    <ArrowRight
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
        </div>

        {/* Verificatie-mini als lijn met stations */}
        <Panel className="p-6">
          <Overline color={C.green}>Verificatielijn</Overline>
          <ul className="mt-4 space-y-0">
            {CREDENTIALS.map((c, i) => {
              const st = statusMeta(c.status);
              const last = i === CREDENTIALS.length - 1;
              return (
                <li key={c.naam} className="flex items-stretch gap-3">
                  <div className="flex flex-col items-center">
                    <Station size={18} color={st.color} filled={c.status === "VERIFIED"} />
                    {!last && (
                      <span
                        className="w-[3px] flex-1"
                        style={{ background: st.color, minHeight: 18 }}
                        aria-hidden="true"
                      />
                    )}
                  </div>
                  <div className={`min-w-0 flex-1 ${last ? "" : "pb-4"}`}>
                    <p className="truncate text-[13.5px] font-bold" style={sans}>
                      {c.naam}
                    </p>
                    <p
                      className="mt-0.5 inline-flex items-center gap-1 text-[11px] font-semibold"
                      style={{ color: st.ink }}
                    >
                      <st.Icon size={11} aria-hidden="true" /> {st.label}
                    </p>
                  </div>
                </li>
              );
            })}
          </ul>
        </Panel>
      </section>
    </div>
  );
}

function Marktplaats({ onOpen }: { onOpen: () => void }) {
  const [q, setQ] = useState("");
  const [sort, setSort] = useState<"match" | "tarief">("match");

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
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <Overline>Lijnennet · opdrachten</Overline>
          <h1 className="mt-3 text-[30px] font-bold leading-none tracking-[-0.02em]" style={sans}>
            Marktplaats
          </h1>
          <p className="mt-2 text-[13.5px]" style={{ color: C.muted, ...mono }}>
            {String(filtered.length).padStart(2, "0")} /{" "}
            {String(OPDRACHTEN.length).padStart(2, "0")} aansluitingen zichtbaar
          </p>
        </div>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div
          className="flex flex-1 items-center gap-2.5 rounded-full px-4 py-3"
          style={{ background: C.paper, border: `1px solid ${C.line}` }}
        >
          <Search size={17} aria-hidden="true" style={{ color: C.muted }} />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Zoek op halte, plaats of vervoerder…"
            aria-label="Opdrachten zoeken"
            className="w-full bg-transparent text-[14px] font-medium outline-none placeholder:text-[#8a909c]"
            style={{ color: C.ink, ...sans }}
          />
          {q && (
            <button
              onClick={() => setQ("")}
              aria-label="Zoekterm wissen"
              className="rounded-full p-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0057b8]"
              style={{ color: C.faint }}
            >
              <X size={15} aria-hidden="true" />
            </button>
          )}
        </div>
        <div className="flex items-center gap-2" role="group" aria-label="Sorteren">
          {(["match", "tarief"] as const).map((s) => (
            <GhostButton
              key={s}
              onClick={() => setSort(s)}
              active={sort === s}
              ariaPressed={sort === s}
            >
              {s === "match" ? "Beste match" : "Hoogste tarief"}
            </GhostButton>
          ))}
        </div>
      </div>

      {filtered.length === 0 ? (
        <Panel className="p-0">
          <div className="flex flex-col items-center px-6 py-16 text-center">
            <span
              className="inline-flex h-16 w-16 items-center justify-center rounded-full"
              style={{ background: C.field, border: `2px dashed ${C.rail}` }}
              aria-hidden="true"
            >
              <Search size={26} style={{ color: C.faint }} />
            </span>
            <p className="mt-5 text-[20px] font-bold" style={sans}>
              Geen halte gevonden
            </p>
            <p className="mx-auto mt-2 max-w-xs text-[13.5px]" style={{ color: C.muted }}>
              Geen opdracht op deze lijn past bij {q ? `“${q}”` : "je zoekterm"}. Verruim de
              zoekterm voor meer aansluitingen.
            </p>
            <div className="mt-6">
              <PrimaryButton onClick={() => setQ("")}>
                Zoekterm wissen <X size={14} aria-hidden="true" />
              </PrimaryButton>
            </div>
          </div>
        </Panel>
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
  const color = opdracht.match >= 90 ? C.green : opdracht.match >= 84 ? C.blue : C.yellow;
  return (
    <Panel className="overflow-hidden">
      {/* Lijn-kop met stationsnummer */}
      <div className="flex items-stretch">
        <span className="w-1.5 shrink-0" style={{ background: color }} aria-hidden="true" />
        <div className="min-w-0 flex-1 p-5">
          <div className="grid grid-cols-[1fr_auto] items-start gap-4">
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span
                  className="inline-flex h-6 items-center rounded-full px-2 text-[11px] font-bold tabular-nums text-white"
                  style={{ background: color, ...mono }}
                >
                  {String(index + 1).padStart(2, "0")}
                </span>
                <span className="text-[12px] font-semibold" style={{ color: C.faint, ...mono }}>
                  {opdracht.id}
                </span>
              </div>
              <h3
                className="mt-2 text-[18px] font-bold leading-snug tracking-[-0.01em]"
                style={sans}
              >
                {opdracht.titel}
              </h3>
              <p className="mt-1 text-[12.5px]" style={{ color: C.muted }}>
                {opdracht.opdrachtgever} · {opdracht.plaats} · {opdracht.uren}
              </p>
              <div className="mt-3 flex flex-wrap gap-1.5">
                {opdracht.tags.map((t) => (
                  <Chip key={t} color={C.blue} wash={C.blueWash}>
                    {t}
                  </Chip>
                ))}
              </div>
            </div>
            <div className="flex flex-col items-end gap-2">
              <Station size={44} color={color} interchange />
              <span
                className="text-[14px] font-bold tabular-nums"
                style={{ color: C.inkSoft, ...mono }}
              >
                {opdracht.tarief}
              </span>
            </div>
          </div>

          <div className="mt-4">
            <MatchBar value={opdracht.match} />
          </div>

          <div className="mt-4 flex items-center gap-3">
            <button
              onClick={() => setOpen((v) => !v)}
              aria-expanded={open}
              className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[12px] font-bold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0057b8] focus-visible:ring-offset-2"
              style={{ color: C.blue, background: C.blueWash }}
            >
              {open ? (
                <Minus size={13} aria-hidden="true" />
              ) : (
                <Plus size={13} aria-hidden="true" />
              )}
              Routetoelichting
            </button>
            <div className="ml-auto">
              <PrimaryButton
                onClick={onOpen}
                color={color}
                className={color === C.yellow ? "!text-[#5c3d00]" : ""}
              >
                Reageer <ArrowRight size={14} aria-hidden="true" />
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
                  titel="Meereist"
                  color={C.green}
                  Icon={Check}
                  items={opdracht.redenen.plus}
                />
                <RedenBlok
                  titel="Let op onderweg"
                  color={C.yellow}
                  ink={C.yellowInk}
                  Icon={AlertTriangle}
                  items={opdracht.redenen.min}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </Panel>
  );
}

function RedenBlok({
  titel,
  color,
  ink,
  Icon,
  items,
}: {
  titel: string;
  color: string;
  ink?: string;
  Icon: LucideIcon;
  items: string[];
}) {
  const textColor = ink ?? color;
  return (
    <div className="rounded-xl p-4" style={{ background: C.field, border: `1px solid ${C.line}` }}>
      <div className="flex items-center gap-2">
        <span
          className="inline-block h-[3px] w-5 rounded-full"
          style={{ background: color }}
          aria-hidden="true"
        />
        <p
          className="text-[10.5px] font-bold uppercase tracking-[0.14em]"
          style={{ color: textColor, ...mono }}
        >
          {titel}
        </p>
      </div>
      <ul className="mt-2.5 space-y-2">
        {items.map((r) => (
          <li key={r} className="flex items-start gap-2 text-[12.5px]" style={{ color: C.inkSoft }}>
            <Icon
              size={14}
              aria-hidden="true"
              className="mt-0.5 shrink-0"
              style={{ color: textColor }}
            />
            {r}
          </li>
        ))}
      </ul>
    </div>
  );
}

function OpdrachtDetail({ opdracht, onBack }: { opdracht: Opdracht; onBack: () => void }) {
  const color = opdracht.match >= 90 ? C.green : opdracht.match >= 84 ? C.blue : C.yellow;
  const yellowText = color === C.yellow;
  return (
    <div className="space-y-6">
      <button
        onClick={onBack}
        className="inline-flex items-center gap-2 rounded-full px-4 py-2 text-[12.5px] font-bold transition-colors hover:bg-[#f6f7f9] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0057b8] focus-visible:ring-offset-2 focus-visible:ring-offset-white motion-reduce:transition-none"
        style={{ color: C.inkSoft, background: C.paper, border: `1px solid ${C.line}` }}
      >
        <ArrowLeft size={14} aria-hidden="true" /> Terug naar marktplaats
      </button>

      <Panel className="overflow-hidden">
        <span className="block h-1.5 w-full" style={{ background: color }} aria-hidden="true" />
        <div className="p-6 md:p-8">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-[12px] font-semibold" style={{ color: C.faint, ...mono }}>
              {opdracht.id}
            </span>
            <Chip color={color} strong>
              <CircleDot size={12} aria-hidden="true" /> {opdracht.match}% match
            </Chip>
          </div>
          <h1
            className="mt-3 max-w-2xl text-[30px] font-bold leading-[1.06] tracking-[-0.02em] md:text-[38px]"
            style={sans}
          >
            {opdracht.titel}
          </h1>
          <p className="mt-2 text-[14.5px] font-semibold" style={{ color: C.muted }}>
            {opdracht.opdrachtgever} · {opdracht.plaats}
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <PrimaryButton color={color} className={yellowText ? "!text-[#5c3d00]" : ""}>
              Reageer op opdracht <ArrowRight size={15} aria-hidden="true" />
            </PrimaryButton>
            <GhostButton>
              <Ticket size={14} aria-hidden="true" /> Bewaren
            </GhostButton>
          </div>
        </div>
      </Panel>

      <section className="grid grid-cols-2 gap-4 md:grid-cols-4">
        {[
          { l: "Tarief", v: opdracht.tarief },
          { l: "Omvang", v: opdracht.uren },
          { l: "Start", v: opdracht.start },
          { l: "Match", v: `${opdracht.match}%` },
        ].map((m) => (
          <Panel key={m.l} className="p-4">
            <p
              className="text-[10px] font-bold uppercase tracking-[0.14em]"
              style={{ color: C.faint, ...mono }}
            >
              {m.l}
            </p>
            <p
              className="mt-1.5 text-[19px] font-bold tabular-nums tracking-[-0.01em]"
              style={sans}
            >
              {m.v}
            </p>
          </Panel>
        ))}
      </section>

      <section>
        <Overline>Routetoelichting · waarom deze match</Overline>
        <p className="mt-3 max-w-xl text-[14px] leading-relaxed" style={{ color: C.muted }}>
          Transparant onderbouwd op je geverifieerde profiel: wat er vóór pleit én de
          aandachtspunten onderweg, zonder verborgen score.
        </p>
        <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-2">
          <Panel className="p-5">
            <div className="flex items-center gap-2">
              <Station size={22} color={C.green} filled />
              <p
                className="text-[12px] font-bold uppercase tracking-[0.1em]"
                style={{ color: C.green, ...mono }}
              >
                Meereist
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
                    style={{ color: C.green }}
                  />
                  {r}
                </li>
              ))}
            </ul>
          </Panel>
          <Panel className="p-5">
            <div className="flex items-center gap-2">
              <Station size={22} color={C.yellow} />
              <p
                className="text-[12px] font-bold uppercase tracking-[0.1em]"
                style={{ color: C.yellowInk, ...mono }}
              >
                Let op onderweg
              </p>
            </div>
            <ul className="mt-4 space-y-3">
              {opdracht.redenen.min.map((r) => (
                <li
                  key={r}
                  className="flex items-start gap-3 text-[13.5px]"
                  style={{ color: C.muted }}
                >
                  <AlertTriangle
                    size={14}
                    aria-hidden="true"
                    className="mt-0.5 shrink-0"
                    style={{ color: C.yellowInk }}
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
    <div className="space-y-6">
      <Panel className="p-6 md:p-7">
        <div className="flex flex-wrap items-center justify-between gap-6">
          <div className="max-w-md">
            <Overline color={C.green}>Verificatielijn · authenticatie</Overline>
            <h1
              className="mt-3 text-[28px] font-bold leading-tight tracking-[-0.02em]"
              style={sans}
            >
              Verificatie
            </h1>
            <p className="mt-3 text-[13.5px] leading-relaxed" style={{ color: C.muted }}>
              <span className="font-bold" style={{ color: C.ink }}>
                {PROFIEL.trust}.
              </span>{" "}
              {verified} van {CREDENTIALS.length} stations geverifieerd. Eén halte verloopt
              binnenkort en vraagt om vernieuwing.
            </p>
          </div>
          <div className="flex items-center gap-4">
            <div className="relative" style={{ width: 88, height: 88 }}>
              <svg width={88} height={88} viewBox="0 0 88 88" aria-hidden="true">
                <circle cx="44" cy="44" r="34" fill="none" stroke={C.fieldAlt} strokeWidth="9" />
                <circle
                  cx="44"
                  cy="44"
                  r="34"
                  fill="none"
                  stroke={C.green}
                  strokeWidth="9"
                  strokeLinecap="round"
                  strokeDasharray={2 * Math.PI * 34}
                  strokeDashoffset={2 * Math.PI * 34 * (1 - ratio / 100)}
                  transform="rotate(-90 44 44)"
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span
                  className="text-[22px] font-bold tabular-nums leading-none"
                  style={{ ...sans }}
                >
                  {ratio}
                </span>
                <span
                  className="text-[8.5px] font-bold uppercase tracking-[0.1em]"
                  style={{ color: C.faint, ...mono }}
                >
                  compleet
                </span>
              </div>
            </div>
          </div>
        </div>
      </Panel>

      {/* Credentials als stations op één lijn */}
      <div className="relative">
        <ul className="space-y-3">
          {CREDENTIALS.map((c, i) => {
            const st = statusMeta(c.status);
            const isOpen = open === c.naam;
            const last = i === CREDENTIALS.length - 1;
            return (
              <li key={c.naam} className="relative flex gap-4">
                {/* Lijn-gutter met station */}
                <div className="flex flex-col items-center pt-5">
                  <Station
                    size={22}
                    color={st.color}
                    filled={c.status === "VERIFIED"}
                    interchange={isOpen}
                  />
                  {!last && (
                    <span
                      className="mt-1 w-[3px] flex-1"
                      style={{ background: C.rail, minHeight: 24 }}
                      aria-hidden="true"
                    />
                  )}
                </div>
                <Panel className="min-w-0 flex-1 overflow-hidden">
                  <button
                    onClick={() => setOpen(isOpen ? null : c.naam)}
                    aria-expanded={isOpen}
                    className="grid w-full grid-cols-[1fr_auto] items-center gap-4 p-5 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#0057b8]"
                  >
                    <span className="min-w-0">
                      <span className="block truncate text-[15px] font-bold" style={sans}>
                        {c.naam}
                      </span>
                      <span
                        className="mt-0.5 block text-[12px]"
                        style={{ color: C.muted, ...mono }}
                      >
                        {c.detail}
                      </span>
                    </span>
                    <span className="flex items-center gap-3">
                      <Chip color={st.ink} wash={st.wash}>
                        <st.Icon size={12} aria-hidden="true" />
                        {st.label}
                        {st.alarm && <span className="sr-only"> (let op)</span>}
                      </Chip>
                      <span
                        className="transition-transform motion-reduce:transition-none"
                        style={{ color: C.faint, transform: isOpen ? "rotate(45deg)" : "none" }}
                        aria-hidden="true"
                      >
                        <Plus size={16} />
                      </span>
                    </span>
                  </button>
                  <div
                    className="grid transition-all duration-300 motion-reduce:transition-none"
                    style={{ gridTemplateRows: isOpen ? "1fr" : "0fr" }}
                  >
                    <div className="overflow-hidden">
                      <div className="px-5 pb-5">
                        <div
                          className="rounded-xl p-4"
                          style={{ background: C.field, border: `1px solid ${C.line}` }}
                        >
                          <p
                            className="max-w-xl text-[13px] leading-relaxed"
                            style={{ color: C.inkSoft }}
                          >
                            {c.detail}. Documenten worden versleuteld bewaard en alleen na je
                            expliciete toestemming gedeeld met een opdrachtgever.
                          </p>
                          <div className="mt-3 flex flex-wrap gap-2">
                            <PrimaryButton
                              color={c.status === "EXPIRING" ? C.yellow : C.blue}
                              className={c.status === "EXPIRING" ? "!text-[#5c3d00]" : ""}
                            >
                              {c.status === "EXPIRING" ? "Vernieuwen" : "Bekijken"}
                            </PrimaryButton>
                            <GhostButton>Historie</GhostButton>
                          </div>
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
    </div>
  );
}

function Acties() {
  return (
    <div className="space-y-6">
      <div>
        <Overline color={C.yellow}>Reisplan · volgende haltes</Overline>
        <h1 className="mt-3 text-[30px] font-bold leading-none tracking-[-0.02em]" style={sans}>
          Acties
        </h1>
        <p className="mt-2 max-w-md text-[13.5px]" style={{ color: C.muted }}>
          Je route van boven naar beneden — elke halte brengt je dichter bij verifieerbaar en
          betaald blijven.
        </p>
      </div>

      <ol className="relative space-y-0">
        {ACTIES.map((a, i) => {
          const warn = a.urgentie === "warning";
          const color = warn ? C.yellow : C.blue;
          const ink = warn ? C.yellowInk : C.blue;
          const last = i === ACTIES.length - 1;
          return (
            <li key={a.titel} className="flex gap-4">
              <div className="flex flex-col items-center pt-5">
                <span
                  className="inline-flex h-9 w-9 items-center justify-center rounded-full text-[13px] font-bold tabular-nums text-white"
                  style={{ background: color, color: warn ? "#5c3d00" : "#fff", ...mono }}
                  aria-hidden="true"
                >
                  {i + 1}
                </span>
                {!last && (
                  <span
                    className="mt-1 w-[3px] flex-1"
                    style={{ background: C.rail, minHeight: 20 }}
                    aria-hidden="true"
                  />
                )}
              </div>
              <Panel className="mb-3 min-w-0 flex-1 p-5">
                <div className="grid grid-cols-1 items-start gap-4 sm:grid-cols-[1fr_auto]">
                  <div className="min-w-0">
                    <span
                      className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.1em]"
                      style={{ color: ink, background: warn ? C.yellowWash : C.blueWash, ...mono }}
                    >
                      {warn ? (
                        <AlertTriangle size={11} aria-hidden="true" />
                      ) : (
                        <Milestone size={11} aria-hidden="true" />
                      )}
                      {warn ? "Belangrijk" : "Kans"}
                    </span>
                    <h2 className="mt-2 text-[16px] font-bold leading-snug" style={sans}>
                      {a.titel}
                    </h2>
                    <p
                      className="mt-1.5 max-w-lg text-[13px] leading-relaxed"
                      style={{ color: C.muted }}
                    >
                      {a.detail}
                    </p>
                  </div>
                  <div className="sm:self-center">
                    <PrimaryButton color={color} className={warn ? "!text-[#5c3d00]" : ""}>
                      {a.cta}
                      <ArrowRight size={14} aria-hidden="true" />
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

function factuurStatusMeta(status: string): {
  color: string;
  wash: string;
  ink: string;
  Icon: LucideIcon;
} {
  if (status === "Betaald") return { color: C.green, wash: C.greenWash, ink: C.green, Icon: Check };
  if (status === "Openstaand")
    return { color: C.yellow, wash: C.yellowWash, ink: C.yellowInk, Icon: AlertTriangle };
  return { color: C.rail, wash: C.field, ink: C.muted, Icon: Clock };
}

function Facturen() {
  const totaalBetaald = "€ 8.622";
  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <Overline>Kaartverkoop · grootboek</Overline>
          <h1 className="mt-3 text-[30px] font-bold leading-none tracking-[-0.02em]" style={sans}>
            Facturen
          </h1>
        </div>
        <PrimaryButton>
          <Plus size={15} aria-hidden="true" /> Nieuwe factuur
        </PrimaryButton>
      </div>

      <section className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {[
          {
            l: "Betaald (mnd)",
            v: totaalBetaald,
            sub: "3 voldaan",
            color: C.green,
            wash: C.greenWash,
          },
          {
            l: "Openstaand",
            v: "€ 1.350",
            sub: "1 factuur · 9 dagen",
            color: C.yellow,
            wash: C.yellowWash,
          },
          {
            l: "Concept",
            v: "€ 880",
            sub: "klaar om te versturen",
            color: C.blue,
            wash: C.blueWash,
          },
        ].map((s) => (
          <Panel key={s.l} className="overflow-hidden">
            <span
              className="block h-1.5 w-full"
              style={{ background: s.color }}
              aria-hidden="true"
            />
            <div className="p-5">
              <p
                className="text-[10.5px] font-bold uppercase tracking-[0.08em]"
                style={{ color: C.muted, ...mono }}
              >
                {s.l}
              </p>
              <p
                className="mt-2 text-[26px] font-bold tabular-nums tracking-[-0.02em]"
                style={sans}
              >
                {s.v}
              </p>
              <p className="mt-1 text-[12px] font-semibold" style={{ color: C.faint }}>
                {s.sub}
              </p>
            </div>
          </Panel>
        ))}
      </section>

      <Panel className="overflow-hidden p-5">
        <div
          className="hidden grid-cols-[8rem_1fr_5rem_9rem_6rem] gap-4 px-1 pb-3 sm:grid"
          style={{ borderBottom: `1px solid ${C.line}` }}
        >
          {["Nummer", "Klant", "Datum", "Status", "Bedrag"].map((h, i) => (
            <span
              key={h}
              className={`text-[10px] font-bold uppercase tracking-[0.14em] ${i === 4 ? "text-right" : ""}`}
              style={{ color: C.faint, ...mono }}
            >
              {h}
            </span>
          ))}
        </div>
        <ul>
          {FACTUREN.map((f) => {
            const st = factuurStatusMeta(f.status);
            return (
              <li
                key={f.nr}
                className="grid grid-cols-[1fr_auto] items-center gap-3 px-1 py-3.5 transition-colors hover:bg-[#f6f7f9] motion-reduce:transition-none sm:grid-cols-[8rem_1fr_5rem_9rem_6rem] sm:gap-4"
                style={{ borderBottom: `1px solid ${C.lineSoft}` }}
              >
                <span
                  className="order-1 flex items-center gap-2 text-[12px] font-semibold tabular-nums"
                  style={{ color: C.faint, ...mono }}
                >
                  <span
                    className="inline-block h-2.5 w-2.5 shrink-0 rounded-full"
                    style={{ background: st.color }}
                    aria-hidden="true"
                  />
                  {f.nr}
                </span>
                <span
                  className="order-3 min-w-0 truncate text-[14px] font-bold sm:order-2"
                  style={sans}
                >
                  {f.klant}
                </span>
                <span
                  className="order-4 hidden text-[12px] font-medium tabular-nums sm:order-3 sm:inline"
                  style={{ color: C.muted, ...mono }}
                >
                  {f.datum}
                </span>
                <span className="order-5 sm:order-4">
                  <Chip color={st.ink} wash={st.wash}>
                    <st.Icon size={12} aria-hidden="true" />
                    {f.status}
                  </Chip>
                </span>
                <span
                  className="order-2 text-right text-[14.5px] font-bold tabular-nums sm:order-5"
                  style={{ color: f.status === "Openstaand" ? C.yellowInk : C.ink, ...mono }}
                >
                  {f.bedrag}
                </span>
              </li>
            );
          })}
        </ul>
        <div className="mt-2 flex items-baseline justify-between px-1 pt-3">
          <span
            className="text-[10.5px] font-bold uppercase tracking-[0.16em]"
            style={{ color: C.faint, ...mono }}
          >
            Totaal betaald
          </span>
          <span className="text-[22px] font-bold tabular-nums" style={{ ...sans }}>
            {totaalBetaald}
          </span>
        </div>
      </Panel>
    </div>
  );
}
