"use client";

// Concept 123 — "Portolaan" · historische zeekaart & kompasroos.
// Verweerd perkament-zeekaart in warme sepia. Een KOMPASROOS-motief, rhumb-lijnen (loxodromen)
// die vanuit knooppunten radiaal uitwaaieren, kust-hairlines en dieptelood-cijfers. Matching wordt
// navigatie: koers en afstand. Onderscheidend van Atlas (topografisch land) en Radar (sonar-scope):
// dit is een PORTOLAAN-zeekaart met kompasroos + rhumb-lijnen.
// Fonts: Newsreader (display) + Spline Sans Mono (labels).

import { useState } from "react";
import {
  ArrowRight,
  Check,
  Clock,
  AlertTriangle,
  XCircle,
  Search,
  ShieldCheck,
  Plus,
  MapPin,
  Coins,
  CalendarDays,
  Compass,
  Anchor,
  Navigation,
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

// Sepia-perkament / zee-teal / roest-rood palet.
const C = {
  bg: "#efe6d2", // verweerd perkament
  paper: "#f5eeda", // lichter kaartblad
  paperDeep: "#e6d9bd", // dieper perkament-vlak
  fg: "#33291c", // donkere sepia-inkt
  fgSoft: "#6a5b45", // gedempte inkt
  fgFaint: "#9a8a6e", // faint kaart-grijs
  teal: "#1f5c66", // zee-teal accent
  tealSoft: "#3d7d86",
  rust: "#9a4a2b", // roest-rood rhumb-accent
  green: "#4f7a4a", // gedempt groen (geverifieerd)
  line: "rgba(51,41,28,0.16)",
  lineStrong: "rgba(51,41,28,0.32)",
};

const display = { fontFamily: "var(--font-lab-newsreader)" };
const mono = { fontFamily: "var(--font-lab-spline-mono)" };
const ui = { fontFamily: "var(--font-lab-spline-mono)" };

// Perkament-textuur: vezel-nerf + vlek-verkleuring + fijne rhumb-suggestie.
const parchment =
  "radial-gradient(120% 90% at 12% 8%, rgba(154,74,43,0.06), transparent 55%)," +
  "radial-gradient(120% 90% at 88% 92%, rgba(31,92,102,0.07), transparent 55%)," +
  "repeating-linear-gradient(94deg, rgba(51,41,28,0.022) 0 1px, transparent 1px 5px)," +
  "repeating-linear-gradient(3deg, rgba(51,41,28,0.02) 0 1px, transparent 1px 7px)";

// Kaartblad-textuur voor panelen.
const cardStock =
  "repeating-linear-gradient(90deg, rgba(51,41,28,0.02) 0 1px, transparent 1px 6px)," +
  "repeating-linear-gradient(0deg, rgba(51,41,28,0.015) 0 1px, transparent 1px 6px)";

function statusMeta(s: CredStatus): {
  label: string;
  Icon: LucideIcon;
  tone: string;
} {
  switch (s) {
    case "VERIFIED":
      return { label: "Geverifieerd", Icon: Check, tone: C.green };
    case "SUBMITTED":
      return { label: "In beoordeling", Icon: Clock, tone: C.teal };
    case "EXPIRING":
      return { label: "Verloopt binnenkort", Icon: AlertTriangle, tone: C.rust };
    case "REJECTED":
      return { label: "Afgewezen", Icon: XCircle, tone: C.rust };
  }
}

// Kompasroos-SVG met 32 windstreken + rhumb-lijnen.
function CompassRose({ size = 120, opacity = 1 }: { size?: number; opacity?: number }) {
  const c = 50;
  const rays = Array.from({ length: 16 }, (_, i) => i * 22.5);
  return (
    <svg viewBox="0 0 100 100" width={size} height={size} style={{ opacity }} aria-hidden="true">
      {rays.map((deg) => {
        const rad = (deg * Math.PI) / 180;
        const long = deg % 90 === 0;
        const len = long ? 46 : deg % 45 === 0 ? 40 : 34;
        const x2 = c + Math.sin(rad) * len;
        const y2 = c - Math.cos(rad) * len;
        return (
          <line
            key={deg}
            x1={c}
            y1={c}
            x2={x2}
            y2={y2}
            stroke={long ? C.rust : C.teal}
            strokeWidth={long ? 1 : 0.5}
            opacity={long ? 0.85 : 0.5}
          />
        );
      })}
      {/* Noord-punt kompasnaald */}
      <path d={`M${c} ${c} L${c - 4} ${c} L${c} 6 L${c + 4} ${c} Z`} fill={C.rust} opacity={0.9} />
      <path d={`M${c} ${c} L${c - 4} ${c} L${c} 94 L${c + 4} ${c} Z`} fill={C.fg} opacity={0.55} />
      <circle cx={c} cy={c} r={44} fill="none" stroke={C.lineStrong} strokeWidth={0.7} />
      <circle cx={c} cy={c} r={30} fill="none" stroke={C.line} strokeWidth={0.5} />
      <circle cx={c} cy={c} r={3} fill={C.paper} stroke={C.rust} strokeWidth={0.8} />
      <text
        x={c}
        y="4.5"
        textAnchor="middle"
        fontSize="6"
        fill={C.rust}
        style={{ fontFamily: "var(--font-lab-newsreader)" }}
      >
        N
      </text>
    </svg>
  );
}

// Rhumb-lijnen-achtergrond voor het hele canvas (uitwaaierende loxodromen).
function RhumbField() {
  const nodes = [
    { x: 18, y: 22 },
    { x: 82, y: 30 },
    { x: 50, y: 78 },
  ];
  const angles = Array.from({ length: 16 }, (_, i) => i * 22.5);
  return (
    <svg
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 h-full w-full"
      preserveAspectRatio="none"
      viewBox="0 0 100 100"
    >
      {nodes.map((n, ni) =>
        angles.map((deg) => {
          const rad = (deg * Math.PI) / 180;
          const x2 = n.x + Math.sin(rad) * 140;
          const y2 = n.y - Math.cos(rad) * 140;
          return (
            <line
              key={`${ni}-${deg}`}
              x1={n.x}
              y1={n.y}
              x2={x2}
              y2={y2}
              stroke={deg % 45 === 0 ? C.rust : C.teal}
              strokeWidth={0.12}
              opacity={deg % 45 === 0 ? 0.12 : 0.07}
            />
          );
        }),
      )}
      {nodes.map((n, ni) => (
        <circle key={ni} cx={n.x} cy={n.y} r={0.7} fill={C.rust} opacity={0.3} />
      ))}
    </svg>
  );
}

// Kaartblad-paneel met perkament-nerf en sepia-rand.
function Chart({
  children,
  className = "",
  accent = C.line,
  interactive = false,
  rose = false,
}: {
  children: React.ReactNode;
  className?: string;
  accent?: string;
  interactive?: boolean;
  rose?: boolean;
}) {
  return (
    <div
      className={`relative overflow-hidden rounded-sm ${
        interactive
          ? "transition-transform duration-200 hover:-translate-y-0.5 motion-reduce:hover:translate-y-0"
          : ""
      } ${className}`}
      style={{
        background: C.paper,
        backgroundImage: cardStock,
        border: `1px solid ${accent}`,
        boxShadow: "inset 0 1px 0 rgba(245,238,218,0.6), 0 8px 20px -14px rgba(51,41,28,0.5)",
      }}
    >
      {rose && (
        <span
          className="pointer-events-none absolute -right-6 -top-6 opacity-[0.12]"
          aria-hidden="true"
        >
          <CompassRose size={120} />
        </span>
      )}
      <div className="relative">{children}</div>
    </div>
  );
}

function Pill({ children, tone }: { children: React.ReactNode; tone: string }) {
  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-medium leading-none"
      style={{
        ...mono,
        background: "rgba(51,41,28,0.05)",
        color: tone,
        border: `1px solid ${tone}`,
      }}
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
    <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="h-7 w-full" aria-hidden="true">
      <polyline
        points={pts.join(" ")}
        fill="none"
        stroke={tone}
        strokeWidth={2.5}
        strokeLinecap="round"
        strokeLinejoin="round"
        vectorEffect="non-scaling-stroke"
      />
    </svg>
  );
}

function Kop({ children, sub }: { children: React.ReactNode; sub?: string }) {
  return (
    <div>
      {sub && (
        <div
          className="mb-1 flex items-center gap-2 text-[10px] font-medium uppercase tracking-[0.32em]"
          style={{ ...mono, color: C.rust }}
        >
          <Navigation size={11} strokeWidth={2} aria-hidden="true" />
          {sub}
        </div>
      )}
      <div className="flex items-center gap-4">
        <h2
          className="text-[27px] font-medium leading-none tracking-[-0.01em] sm:text-[33px]"
          style={{ ...display, color: C.fg }}
        >
          {children}
        </h2>
        <span
          className="h-px flex-1"
          style={{
            backgroundImage: `repeating-linear-gradient(90deg, ${C.lineStrong} 0 4px, transparent 4px 8px)`,
          }}
          aria-hidden="true"
        />
      </div>
    </div>
  );
}

export function Concept123() {
  const [screen, setScreen] = useState<ScreenKey>("dashboard");
  const active = OPDRACHTEN[0] as Opdracht;

  return (
    <div
      className="relative min-h-[680px] w-full overflow-hidden antialiased"
      style={{ ...ui, background: C.bg, backgroundImage: parchment, color: C.fg }}
    >
      <RhumbField />

      {/* Header — kompasroos-merkmark */}
      <header className="relative mx-auto flex max-w-5xl items-center justify-between px-5 pt-8 md:px-10">
        <div className="flex items-center gap-3.5">
          <span
            className="relative flex h-11 w-11 items-center justify-center overflow-hidden rounded-full"
            style={{ background: C.paperDeep, color: C.rust, border: `1.5px solid ${C.rust}` }}
            aria-hidden="true"
          >
            <Compass size={20} strokeWidth={1.8} />
          </span>
          <div className="leading-none">
            <div
              className="text-[20px] font-medium tracking-[0.01em]"
              style={{ ...display, color: C.fg }}
            >
              Portolaan
            </div>
            <div
              className="mt-1 text-[9px] uppercase tracking-[0.32em]"
              style={{ ...mono, color: C.fgFaint }}
            >
              ZZP · Zeekaart
            </div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="hidden text-right leading-tight sm:block">
            <div className="text-[13px] font-medium" style={{ ...mono, color: C.fg }}>
              {PROFIEL.naam}
            </div>
            <div className="text-[11px]" style={{ ...mono, color: C.fgSoft }}>
              {PROFIEL.rol}
            </div>
          </div>
          <span
            className="flex h-11 w-11 items-center justify-center rounded-full text-[13px] font-medium"
            style={{
              ...mono,
              background: C.paperDeep,
              color: C.teal,
              border: `1px solid ${C.lineStrong}`,
            }}
            aria-hidden="true"
          >
            {PROFIEL.initialen}
          </span>
        </div>
      </header>

      {/* Nav — koers-tabstrip */}
      <nav
        className="relative mx-auto mt-6 flex max-w-5xl items-center gap-1 overflow-x-auto px-5 pb-4 md:px-10"
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
              className="relative shrink-0 px-3.5 py-2 text-[12px] uppercase tracking-[0.1em] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
              style={{ ...mono, color: on ? C.fg : C.fgSoft, fontWeight: on ? 600 : 400 }}
            >
              {s.label}
              {on && (
                <span
                  className="absolute -bottom-[17px] left-2 right-2 h-[2px]"
                  style={{
                    backgroundImage: `repeating-linear-gradient(90deg, ${C.rust} 0 4px, transparent 4px 7px)`,
                  }}
                  aria-hidden="true"
                />
              )}
            </button>
          );
        })}
      </nav>

      <main className="relative mx-auto max-w-5xl px-5 py-9 md:px-10 md:py-12">
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
  const tones = [C.teal, C.rust, C.green, C.teal];
  return (
    <div className="space-y-10">
      <section>
        <div
          className="text-[10px] font-medium uppercase tracking-[0.32em]"
          style={{ ...mono, color: C.rust }}
        >
          Vandaag · {PROFIEL.plaats}
        </div>
        <h1
          className="mt-2 text-[34px] font-medium leading-[1.04] tracking-[-0.02em] sm:text-[44px]"
          style={{ ...display, color: C.fg }}
        >
          Goedemorgen, {PROFIEL.naam.split(" ")[0]}
        </h1>
        <p className="mt-2 max-w-md text-[14px] leading-relaxed" style={{ ...ui, color: C.fgSoft }}>
          De koers ligt vast. Eén baken vraagt vandaag om bijsturen — daarna vaar je met de wind
          mee.
        </p>
      </section>

      {/* Primaire actie — kaartblad met kompasroos-watermerk */}
      <Chart rose accent={C.lineStrong} className="p-0">
        <div className="flex flex-col gap-5 p-6 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0">
            <span
              className="inline-flex items-center gap-2 text-[10px] font-medium uppercase tracking-[0.22em]"
              style={{ ...mono, color: C.rust }}
            >
              <AlertTriangle size={13} strokeWidth={2.2} aria-hidden="true" /> Vraagt aandacht
            </span>
            <h2
              className="mt-2 text-[23px] font-medium leading-tight sm:text-[27px]"
              style={{ ...display, color: C.fg }}
            >
              {primair.titel}
            </h2>
            <p
              className="mt-2 max-w-md text-[13px] leading-relaxed"
              style={{ ...ui, color: C.fgSoft }}
            >
              {primair.detail}
            </p>
          </div>
          <button
            onClick={onOpen}
            className="group inline-flex shrink-0 items-center gap-2.5 rounded-full px-6 py-3 text-[12px] font-medium uppercase tracking-[0.08em] transition-all hover:gap-3.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 motion-reduce:hover:gap-2.5"
            style={{ ...mono, background: C.rust, color: C.paper }}
          >
            {primair.cta}
            <ArrowRight size={16} aria-hidden="true" />
          </button>
        </div>
      </Chart>

      {/* KPI-peilingen */}
      <section>
        <Kop sub="Peilingen">Prestatie</Kop>
        <div className="mt-5 grid grid-cols-2 gap-4 lg:grid-cols-4">
          {KPIS.map((k, i) => {
            const tone = tones[i % tones.length] as string;
            return (
              <Chart key={k.label} interactive className="p-4">
                <div className="flex items-start justify-between">
                  <span
                    className="flex h-6 w-6 items-center justify-center rounded-full"
                    style={{ border: `1px solid ${tone}`, color: tone }}
                    aria-hidden="true"
                  >
                    <span className="h-1.5 w-1.5 rounded-full" style={{ background: tone }} />
                  </span>
                  <span
                    className="text-[11px] font-medium tabular-nums"
                    style={{ ...mono, color: k.up ? C.green : C.rust }}
                  >
                    {k.up ? "▲" : "▼"} {k.trend}
                  </span>
                </div>
                <div
                  className="mt-3 text-[25px] font-medium tabular-nums leading-none tracking-[-0.01em]"
                  style={{ ...display, color: C.fg }}
                >
                  {k.value}
                </div>
                <div className="mt-1 text-[11px]" style={{ ...ui, color: C.fgSoft }}>
                  {k.label}
                </div>
                <div className="mt-2.5">
                  <Spark data={k.spark} tone={tone} />
                </div>
              </Chart>
            );
          })}
        </div>
      </section>

      {/* Top-match — koers naar beste haven */}
      <section>
        <Kop sub="Beste koers">Voor jou</Kop>
        <button
          onClick={onOpen}
          className="group mt-5 block w-full text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
        >
          <Chart
            interactive
            accent={C.lineStrong}
            className="flex flex-col gap-5 p-5 sm:flex-row sm:items-center"
          >
            <span
              className="relative flex h-20 w-20 shrink-0 flex-col items-center justify-center overflow-hidden rounded-full"
              style={{ background: C.paperDeep, color: C.teal, border: `1.5px solid ${C.teal}` }}
              aria-hidden="true"
            >
              <span className="pointer-events-none absolute inset-0 flex items-center justify-center opacity-25">
                <CompassRose size={80} />
              </span>
              <span
                className="relative text-[24px] font-medium tabular-nums leading-none"
                style={display}
              >
                {top.match}
              </span>
              <span
                className="relative text-[8px] font-medium uppercase tracking-[0.16em]"
                style={mono}
              >
                match
              </span>
            </span>
            <div className="min-w-0 flex-1">
              <h3
                className="text-[20px] font-medium leading-tight"
                style={{ ...display, color: C.fg }}
              >
                {top.titel}
              </h3>
              <div className="mt-1 text-[12.5px]" style={{ ...ui, color: C.fgSoft }}>
                {top.opdrachtgever} · {top.plaats} · {top.tarief}
              </div>
              <div className="mt-3 flex flex-wrap gap-1.5">
                {top.tags.map((t) => (
                  <Pill key={t} tone={C.fgSoft}>
                    {t}
                  </Pill>
                ))}
              </div>
            </div>
            <ArrowRight
              size={22}
              className="hidden shrink-0 transition-transform group-hover:translate-x-1 motion-reduce:group-hover:translate-x-0 md:block"
              style={{ color: C.rust }}
              aria-hidden="true"
            />
          </Chart>
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
        style={{ background: "rgba(51,41,28,0.14)" }}
        aria-hidden="true"
      >
        <div
          className="absolute inset-y-0 left-0 rounded-full"
          style={{ width: `${value}%`, background: C.teal }}
        />
      </div>
      <span className="text-[13px] font-medium tabular-nums" style={{ ...mono, color: C.teal }}>
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
      <Kop sub="Open vaargebieden">Marktplaats</Kop>

      <Chart className="flex items-center gap-3 px-4">
        <Search size={17} style={{ color: C.fgSoft }} aria-hidden="true" />
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Zoek op titel, plaats of opdrachtgever…"
          aria-label="Opdrachten zoeken"
          className="w-full bg-transparent py-2.5 text-[14px] outline-none placeholder:opacity-50"
          style={{ ...ui, color: C.fg }}
        />
        <span
          className="shrink-0 text-[12px] font-medium tabular-nums"
          style={{ ...mono, color: C.rust }}
        >
          {filtered.length}
        </span>
      </Chart>

      {filtered.length === 0 ? (
        <Chart rose className="flex flex-col items-center justify-center gap-3 p-14 text-center">
          <Anchor size={26} style={{ color: C.fgSoft }} aria-hidden="true" />
          <p className="text-[20px] font-medium" style={{ ...display, color: C.fg }}>
            Geen opdrachten in zicht
          </p>
          <p className="max-w-xs text-[13px]" style={{ ...ui, color: C.fgSoft }}>
            Niets past bij “{q}”. Verruim je zoekopdracht of vaargebied.
          </p>
          <button
            onClick={() => setQ("")}
            className="mt-2 inline-flex items-center gap-2 rounded-full px-4 py-2 text-[12px] font-medium uppercase tracking-[0.06em] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
            style={{ ...mono, background: C.rust, color: C.paper }}
          >
            Zoekopdracht wissen
          </button>
        </Chart>
      ) : (
        <ul className="space-y-3">
          {filtered.map((o) => (
            <li key={o.id}>
              <button
                onClick={onOpen}
                className="group block w-full text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
              >
                <Chart interactive className="flex flex-col gap-4 p-4 sm:flex-row sm:items-center">
                  <div className="min-w-0 flex-1">
                    <h3
                      className="text-[18px] font-medium leading-tight"
                      style={{ ...display, color: C.fg }}
                    >
                      {o.titel}
                    </h3>
                    <div className="mt-0.5 text-[12.5px]" style={{ ...ui, color: C.fgSoft }}>
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
                      style={{ color: C.rust }}
                      aria-hidden="true"
                    />
                  </div>
                </Chart>
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
        className="inline-flex items-center gap-2 text-[12px] font-medium uppercase tracking-[0.1em] transition-opacity hover:opacity-60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
        style={{ ...mono, color: C.fgSoft }}
      >
        <ArrowRight size={14} className="rotate-180" aria-hidden="true" /> Terug naar marktplaats
      </button>

      <section>
        <div className="flex flex-wrap items-center gap-2">
          <span
            className="text-[11px] font-medium uppercase tabular-nums tracking-[0.14em]"
            style={{ ...mono, color: C.fgSoft }}
          >
            {opdracht.id}
          </span>
          <Pill tone={C.teal}>{opdracht.match}% match</Pill>
        </div>
        <h1
          className="mt-3 text-[30px] font-medium leading-[1.08] tracking-[-0.02em] sm:text-[40px]"
          style={{ ...display, color: C.fg }}
        >
          {opdracht.titel}
        </h1>
        <p className="mt-2 text-[13.5px]" style={{ ...ui, color: C.fgSoft }}>
          {opdracht.opdrachtgever} · {opdracht.plaats}
        </p>
      </section>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {feiten.map((m) => (
          <Chart key={m.l} className="p-4">
            <m.Icon size={16} style={{ color: C.teal }} aria-hidden="true" />
            <div
              className="mt-2 text-[18px] font-medium tabular-nums leading-none"
              style={{ ...display, color: C.fg }}
            >
              {m.v}
            </div>
            <div
              className="mt-1.5 text-[10px] uppercase tracking-[0.14em]"
              style={{ ...mono, color: C.fgSoft }}
            >
              {m.l}
            </div>
          </Chart>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <Chart className="p-5" accent={C.lineStrong}>
          <div
            className="inline-flex items-center gap-2 text-[11px] font-medium uppercase tracking-[0.16em]"
            style={{ ...mono, color: C.green }}
          >
            <Check size={14} strokeWidth={2.6} aria-hidden="true" /> Wat past
          </div>
          <ul className="mt-4 space-y-3">
            {opdracht.redenen.plus.map((r) => (
              <li
                key={r}
                className="flex items-start gap-3 text-[14px] leading-snug"
                style={{ ...ui, color: C.fg }}
              >
                <Check
                  size={16}
                  strokeWidth={2.4}
                  className="mt-0.5 shrink-0"
                  style={{ color: C.green }}
                  aria-hidden="true"
                />
                {r}
              </li>
            ))}
          </ul>
        </Chart>
        <Chart className="p-5" accent={C.lineStrong}>
          <div
            className="inline-flex items-center gap-2 text-[11px] font-medium uppercase tracking-[0.16em]"
            style={{ ...mono, color: C.rust }}
          >
            <AlertTriangle size={14} strokeWidth={2.6} aria-hidden="true" /> Aandacht
          </div>
          <ul className="mt-4 space-y-3">
            {opdracht.redenen.min.map((r) => (
              <li
                key={r}
                className="flex items-start gap-3 text-[14px] leading-snug"
                style={{ ...ui, color: C.fg }}
              >
                <span
                  className="mt-1.5 h-1.5 w-1.5 shrink-0 rotate-45"
                  style={{ background: C.rust }}
                  aria-hidden="true"
                />
                {r}
              </li>
            ))}
          </ul>
        </Chart>
      </div>

      <div className="flex flex-col items-stretch gap-3 pt-1 sm:flex-row">
        <button
          className="group inline-flex flex-1 items-center justify-center gap-2.5 rounded-full px-7 py-3.5 text-[13px] font-medium uppercase tracking-[0.08em] transition-all hover:gap-3.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 motion-reduce:hover:gap-2.5"
          style={{ ...mono, background: C.rust, color: C.paper }}
        >
          Zet koers · reageer <ArrowRight size={16} aria-hidden="true" />
        </button>
        <button
          className="inline-flex items-center justify-center gap-2 rounded-full px-6 py-3.5 text-[13px] font-medium uppercase tracking-[0.08em] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
          style={{
            ...mono,
            border: `1px solid ${C.lineStrong}`,
            color: C.fg,
            background: "rgba(51,41,28,0.03)",
          }}
        >
          Markeer op kaart
        </button>
      </div>
    </div>
  );
}

function Verificatie() {
  const verified = CREDENTIALS.filter((c) => c.status === "VERIFIED").length;
  const pct = Math.round((verified / CREDENTIALS.length) * 100);
  const r = 15.5;
  const circ = 2 * Math.PI * r;
  return (
    <div className="space-y-7">
      <Kop sub="Vaarbewijs">Verificatie</Kop>

      {/* Kompasroos-keurmerk met voortgangsring */}
      <Chart
        rose
        accent={C.lineStrong}
        className="flex flex-col items-center gap-6 p-6 sm:flex-row"
      >
        <div className="relative h-28 w-28 shrink-0" aria-hidden="true">
          <span className="absolute inset-0 flex items-center justify-center opacity-30">
            <CompassRose size={92} />
          </span>
          <svg viewBox="0 0 36 36" className="h-full w-full -rotate-90">
            <circle
              cx="18"
              cy="18"
              r={r}
              fill="none"
              stroke="rgba(51,41,28,0.16)"
              strokeWidth="2.4"
            />
            <circle
              cx="18"
              cy="18"
              r={r}
              fill="none"
              stroke={C.teal}
              strokeWidth="2.4"
              strokeLinecap="round"
              strokeDasharray={`${(pct / 100) * circ} ${circ}`}
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span
              className="text-[26px] font-medium tabular-nums leading-none"
              style={{ ...display, color: C.fg }}
            >
              {pct}%
            </span>
            <span
              className="text-[8px] font-medium uppercase tracking-[0.2em]"
              style={{ ...mono, color: C.fgSoft }}
            >
              op koers
            </span>
          </div>
        </div>
        <div className="text-center sm:text-left">
          <span
            className="inline-flex items-center gap-2 rounded-full px-3 py-1 text-[12px] font-medium"
            style={{
              ...mono,
              background: "rgba(51,41,28,0.05)",
              color: C.green,
              border: `1px solid ${C.green}`,
            }}
          >
            <ShieldCheck size={15} strokeWidth={2.2} aria-hidden="true" /> {PROFIEL.trust}
          </span>
          <p
            className="mt-3 max-w-md text-[14px] leading-relaxed"
            style={{ ...ui, color: C.fgSoft }}
          >
            {verified} van {CREDENTIALS.length} bewijsstukken volledig geverifieerd. Eén dossier
            vraagt binnenkort actie — vernieuw op tijd om verifieerbaar te blijven.
          </p>
        </div>
      </Chart>

      <ul className="space-y-3">
        {CREDENTIALS.map((c) => {
          const st = statusMeta(c.status);
          return (
            <li key={c.naam}>
              <Chart className="flex items-center gap-4 p-4">
                <span
                  className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full"
                  style={{
                    background: "rgba(51,41,28,0.04)",
                    border: `1px solid ${st.tone}`,
                    color: st.tone,
                  }}
                  aria-hidden="true"
                >
                  <st.Icon size={18} strokeWidth={2.2} />
                </span>
                <div className="min-w-0 flex-1">
                  <div
                    className="text-[15px] font-medium leading-tight"
                    style={{ ...display, color: C.fg }}
                  >
                    {c.naam}
                  </div>
                  <div className="mt-0.5 text-[12px]" style={{ ...ui, color: C.fgSoft }}>
                    {c.detail}
                  </div>
                </div>
                <Pill tone={st.tone}>
                  <st.Icon size={12} strokeWidth={2.6} aria-hidden="true" />
                  <span className="hidden sm:inline">{st.label}</span>
                </Pill>
              </Chart>
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
      <Kop sub="De volgende koerswijziging">Volgende acties</Kop>
      <ol className="space-y-3">
        {sorted.map((a, i) => {
          const warn = a.urgentie === "warning";
          const tone = warn ? C.rust : C.teal;
          return (
            <li key={a.titel}>
              <Chart
                className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center"
                accent={warn ? C.lineStrong : C.line}
              >
                <span
                  className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-[16px] font-medium tabular-nums"
                  style={{
                    background: "rgba(51,41,28,0.04)",
                    color: tone,
                    border: `1px solid ${tone}`,
                  }}
                  aria-hidden="true"
                >
                  <span style={display}>{i + 1}</span>
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
                      <Navigation
                        size={14}
                        strokeWidth={2.2}
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
                  <p
                    className="mt-1.5 text-[13px] leading-relaxed"
                    style={{ ...ui, color: C.fgSoft }}
                  >
                    {a.detail}
                  </p>
                </div>
                <button
                  className="shrink-0 self-start rounded-full px-5 py-2.5 text-[12px] font-medium uppercase tracking-[0.06em] transition-transform hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 motion-reduce:hover:translate-y-0 sm:self-center"
                  style={{ ...mono, background: tone, color: C.paper }}
                >
                  {a.cta}
                </button>
              </Chart>
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
    if (status === "Concept") return C.fgSoft;
    return C.teal;
  };
  return (
    <div className="space-y-7">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <Kop sub="Scheepsjournaal">Facturen</Kop>
        <button
          className="inline-flex items-center gap-2 rounded-full px-4 py-2.5 text-[12px] font-medium uppercase tracking-[0.06em] transition-all hover:gap-3 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 motion-reduce:hover:gap-2"
          style={{ ...mono, background: C.rust, color: C.paper }}
        >
          <Plus size={15} aria-hidden="true" /> Nieuwe factuur
        </button>
      </div>

      <Chart className="overflow-x-auto">
        <table className="w-full min-w-[560px] border-collapse text-left">
          <thead>
            <tr style={{ borderBottom: `1px solid ${C.lineStrong}` }}>
              {["Nummer", "Klant", "Datum", "Status", "Bedrag"].map((h, i) => (
                <th
                  key={h}
                  className={`px-4 py-3 text-[10px] font-medium uppercase tracking-[0.16em] ${i === 4 ? "text-right" : ""}`}
                  style={{ ...mono, color: C.fgSoft }}
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
                  className="transition-colors hover:bg-black/5"
                  style={{ borderBottom: `1px solid ${C.line}` }}
                >
                  <td
                    className="px-4 py-3.5 text-[12.5px] tabular-nums"
                    style={{ ...mono, color: C.fgSoft }}
                  >
                    {f.nr}
                  </td>
                  <td className="px-4 py-3.5 text-[14px]" style={{ ...ui, color: C.fg }}>
                    {f.klant}
                  </td>
                  <td
                    className="px-4 py-3.5 text-[12.5px] tabular-nums"
                    style={{ ...mono, color: C.fgSoft }}
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
                className="px-4 py-4 text-[10px] font-medium uppercase tracking-[0.18em]"
                style={{ ...mono, color: C.fgSoft }}
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
      </Chart>
    </div>
  );
}
