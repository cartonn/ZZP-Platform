"use client";

// Concept 122 — "Uurwerk" · Haute horlogerie / premium mechanisch uurwerk.
// Donker gunmetal canvas met guilloché-textuur (fijne concentrische en gedraaide radiale
// lijnpatronen via repeating-conic/radial-gradients), messing/rosé-goud accenten, een serif-
// displaymoment en subtiele wijzerplaat-motieven: index-streepjes en kleine complicatie-subdials
// voor KPI's. De verificatielaag = het chronometer-keurmerk (held). Onderscheidend van Meter
// (analoge instrument-gauges): dit is guilloché-gegraveerde horlogerie-luxe.
// Fonts: Fraunces (display serif) + JetBrains Mono (tabular).

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
  Gem,
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

// Gunmetal / brass-palet.
const C = {
  bg: "#10161c", // donker gunmetal
  bgDeep: "#0b1015",
  bgSoft: "#161f27", // opgelicht paneel
  panel: "#141c24",
  fg: "#e8e6df", // ivoor-wit wijzerplaat
  fgSoft: "#a7ab9f", // gedempt zilver
  fgFaint: "#6d7369",
  gold: "#c8a45a", // brass / rosé-goud accent
  goldSoft: "#9c7f45",
  green: "#7fae7a", // gedempt chronometer-groen
  red: "#c66a5a", // gedempt rood
  line: "rgba(232,230,223,0.10)",
  lineStrong: "rgba(200,164,90,0.34)",
};

const display = { fontFamily: "var(--font-lab-fraunces)" };
const mono = { fontFamily: "var(--font-lab-mono)" };
const ui = { fontFamily: "var(--font-lab-mono)" };

// Guilloché: gedraaide radiale + fijne concentrische gravure.
const guilloche =
  "repeating-conic-gradient(from 0deg at 50% 50%, rgba(200,164,90,0.05) 0deg, transparent 1.4deg, transparent 2.6deg)," +
  "repeating-radial-gradient(circle at 50% 50%, rgba(232,230,223,0.035) 0 1px, transparent 1px 6px)";

// Wijzerplaat-oppervlak voor het hele canvas.
const dialSurface =
  "radial-gradient(120% 100% at 50% -10%, rgba(200,164,90,0.08), transparent 55%)," +
  "radial-gradient(120% 120% at 50% 120%, rgba(0,0,0,0.5), transparent 60%)," +
  "repeating-radial-gradient(circle at 50% 40%, rgba(232,230,223,0.02) 0 1px, transparent 1px 9px)";

function statusMeta(s: CredStatus): {
  label: string;
  Icon: LucideIcon;
  tone: string;
} {
  switch (s) {
    case "VERIFIED":
      return { label: "Geverifieerd", Icon: Check, tone: C.green };
    case "SUBMITTED":
      return { label: "In beoordeling", Icon: Clock, tone: C.gold };
    case "EXPIRING":
      return { label: "Verloopt binnenkort", Icon: AlertTriangle, tone: C.gold };
    case "REJECTED":
      return { label: "Afgewezen", Icon: XCircle, tone: C.red };
  }
}

// Wijzerplaat-paneel met guilloché-gravure en brass-rand.
function Dial({
  children,
  className = "",
  engraved = false,
  accent = C.line,
  interactive = false,
}: {
  children: React.ReactNode;
  className?: string;
  engraved?: boolean;
  accent?: string;
  interactive?: boolean;
}) {
  return (
    <div
      className={`relative overflow-hidden rounded-lg ${
        interactive
          ? "transition-transform duration-200 hover:-translate-y-0.5 motion-reduce:hover:translate-y-0"
          : ""
      } ${className}`}
      style={{
        background: C.panel,
        border: `1px solid ${accent}`,
        boxShadow: "inset 0 1px 0 rgba(232,230,223,0.05), 0 12px 30px -18px rgba(0,0,0,0.8)",
      }}
    >
      {engraved && (
        <span
          aria-hidden="true"
          className="pointer-events-none absolute inset-0"
          style={{
            backgroundImage: guilloche,
            backgroundSize: "100% 100%, 12px 12px",
            opacity: 0.8,
          }}
        />
      )}
      <div className="relative">{children}</div>
    </div>
  );
}

// Brass-hairline: dunne goud-lijn met index-streepjes (chapter ring).
function ChapterRing() {
  return (
    <span
      aria-hidden="true"
      className="block h-[3px] w-full"
      style={{
        backgroundImage:
          `repeating-linear-gradient(90deg, ${C.gold} 0 1px, transparent 1px 9px), ` +
          `linear-gradient(90deg, ${C.goldSoft}, ${C.gold}, ${C.goldSoft})`,
        backgroundSize: "9px 3px, 100% 1px",
        backgroundPosition: "center bottom, center top",
        backgroundRepeat: "repeat-x, no-repeat",
      }}
    />
  );
}

// Kleine complicatie-subdial (rond gauge-meter voor een KPI).
function SubDial({ value, tone }: { value: number; tone: string }) {
  const r = 15.5;
  const circ = 2 * Math.PI * r;
  return (
    <div className="relative h-14 w-14 shrink-0" aria-hidden="true">
      <svg viewBox="0 0 36 36" className="h-full w-full -rotate-90">
        <circle
          cx="18"
          cy="18"
          r={r}
          fill="none"
          stroke="rgba(232,230,223,0.12)"
          strokeWidth="2.2"
        />
        <circle
          cx="18"
          cy="18"
          r={r}
          fill="none"
          stroke={tone}
          strokeWidth="2.2"
          strokeLinecap="round"
          strokeDasharray={`${(value / 100) * circ} ${circ}`}
        />
      </svg>
      <span
        className="absolute inset-0 flex items-center justify-center text-[11px] font-semibold tabular-nums"
        style={{ ...mono, color: C.fg }}
      >
        {value}
      </span>
    </div>
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
          className="mb-1.5 flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.34em]"
          style={{ ...mono, color: C.gold }}
        >
          <span
            className="h-1.5 w-1.5 rounded-full"
            style={{ background: C.gold }}
            aria-hidden="true"
          />
          {sub}
        </div>
      )}
      <div className="flex items-center gap-4">
        <h2
          className="text-[27px] font-normal leading-none tracking-[-0.01em] sm:text-[33px]"
          style={{ ...display, color: C.fg }}
        >
          {children}
        </h2>
        <span
          className="h-px flex-1"
          style={{ background: `linear-gradient(90deg, ${C.lineStrong}, transparent)` }}
          aria-hidden="true"
        />
      </div>
    </div>
  );
}

function Pill({ children, tone }: { children: React.ReactNode; tone: string }) {
  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold leading-none"
      style={{
        ...mono,
        background: "rgba(232,230,223,0.05)",
        color: tone,
        border: `1px solid ${tone}`,
      }}
    >
      {children}
    </span>
  );
}

export function Concept122() {
  const [screen, setScreen] = useState<ScreenKey>("dashboard");
  const active = OPDRACHTEN[0] as Opdracht;

  return (
    <div
      className="min-h-[680px] w-full antialiased"
      style={{ ...ui, background: C.bg, backgroundImage: dialSurface, color: C.fg }}
    >
      {/* Header — brass-schild met index-motief */}
      <header className="mx-auto flex max-w-5xl items-center justify-between px-5 pt-8 md:px-10">
        <div className="flex items-center gap-3.5">
          <span
            className="relative flex h-11 w-11 items-center justify-center overflow-hidden rounded-full"
            style={{ background: C.bgSoft, color: C.gold, border: `1.5px solid ${C.gold}` }}
            aria-hidden="true"
          >
            <span
              className="pointer-events-none absolute inset-0"
              style={{
                backgroundImage: guilloche,
                backgroundSize: "100% 100%, 8px 8px",
                opacity: 0.9,
              }}
            />
            <Gem size={18} strokeWidth={1.8} className="relative" />
          </span>
          <div className="leading-none">
            <div
              className="text-[20px] font-normal tracking-[0.01em]"
              style={{ ...display, color: C.fg }}
            >
              Uurwerk
            </div>
            <div
              className="mt-1 text-[9px] uppercase tracking-[0.34em]"
              style={{ ...mono, color: C.fgFaint }}
            >
              ZZP · Maison
            </div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="hidden text-right leading-tight sm:block">
            <div className="text-[13px] font-semibold" style={{ ...mono, color: C.fg }}>
              {PROFIEL.naam}
            </div>
            <div className="text-[11px]" style={{ ...mono, color: C.fgSoft }}>
              {PROFIEL.rol}
            </div>
          </div>
          <span
            className="flex h-11 w-11 items-center justify-center rounded-full text-[13px] font-semibold"
            style={{
              ...mono,
              background: C.bgSoft,
              color: C.gold,
              border: `1px solid ${C.lineStrong}`,
            }}
            aria-hidden="true"
          >
            {PROFIEL.initialen}
          </span>
        </div>
      </header>

      {/* Nav — chapter-ring-tabstrip */}
      <nav
        className="mx-auto mt-6 flex max-w-5xl items-center gap-1 overflow-x-auto px-5 pb-4 md:px-10"
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
              style={{ ...mono, color: on ? C.fg : C.fgSoft, fontWeight: on ? 700 : 500 }}
            >
              {s.label}
              {on && (
                <span
                  className="absolute -bottom-[17px] left-2 right-2 h-[2px]"
                  style={{
                    background: `linear-gradient(90deg, transparent, ${C.gold}, transparent)`,
                  }}
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
  const tones = [C.gold, C.green, C.gold, C.red];
  const subdials = [92, 70, 82, 45];
  return (
    <div className="space-y-10">
      <section>
        <div
          className="text-[10px] font-semibold uppercase tracking-[0.34em]"
          style={{ ...mono, color: C.gold }}
        >
          Vandaag · {PROFIEL.plaats}
        </div>
        <h1
          className="mt-2 text-[34px] font-normal leading-[1.04] tracking-[-0.02em] sm:text-[44px]"
          style={{ ...display, color: C.fg }}
        >
          Goedemorgen, {PROFIEL.naam.split(" ")[0]}
        </h1>
        <p className="mt-2 max-w-md text-[14px] leading-relaxed" style={{ ...ui, color: C.fgSoft }}>
          Het uurwerk loopt gelijk. Eén complicatie vraagt vandaag om je hand — de rest tikt
          vanzelf.
        </p>
      </section>

      {/* Primaire actie — gegraveerde wijzerplaat met brass-rand */}
      <Dial engraved accent={C.lineStrong} className="p-0">
        <ChapterRing />
        <div className="flex flex-col gap-5 p-6 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0">
            <span
              className="inline-flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.24em]"
              style={{ ...mono, color: C.gold }}
            >
              <AlertTriangle size={13} strokeWidth={2.2} aria-hidden="true" /> Vraagt aandacht
            </span>
            <h2
              className="mt-2 text-[23px] font-normal leading-tight sm:text-[27px]"
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
            className="group inline-flex shrink-0 items-center gap-2.5 rounded-full px-6 py-3 text-[12px] font-semibold uppercase tracking-[0.08em] transition-all hover:gap-3.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 motion-reduce:hover:gap-2.5"
            style={{ ...mono, background: C.gold, color: C.bgDeep }}
          >
            {primair.cta}
            <ArrowRight size={16} aria-hidden="true" />
          </button>
        </div>
      </Dial>

      {/* KPI-subdials */}
      <section>
        <Kop sub="Complicaties">Prestatie</Kop>
        <div className="mt-5 grid grid-cols-2 gap-4 lg:grid-cols-4">
          {KPIS.map((k, i) => {
            const tone = tones[i % tones.length] as string;
            return (
              <Dial key={k.label} engraved interactive className="p-4">
                <div className="flex items-start justify-between gap-2">
                  <SubDial value={subdials[i] as number} tone={tone} />
                  <span
                    className="text-[11px] font-semibold tabular-nums"
                    style={{ ...mono, color: k.up ? C.green : C.red }}
                  >
                    {k.up ? "▲" : "▼"} {k.trend}
                  </span>
                </div>
                <div
                  className="mt-3 text-[25px] font-normal tabular-nums leading-none tracking-[-0.01em]"
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
              </Dial>
            );
          })}
        </div>
      </section>

      {/* Top-match */}
      <section>
        <Kop sub="Beste match">Voor jou</Kop>
        <button
          onClick={onOpen}
          className="group mt-5 block w-full text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
        >
          <Dial
            interactive
            engraved
            accent={C.lineStrong}
            className="flex flex-col gap-5 p-5 sm:flex-row sm:items-center"
          >
            <span
              className="relative flex h-20 w-20 shrink-0 flex-col items-center justify-center overflow-hidden rounded-full"
              style={{ background: C.bgSoft, color: C.gold, border: `1.5px solid ${C.gold}` }}
              aria-hidden="true"
            >
              <span
                className="pointer-events-none absolute inset-0"
                style={{
                  backgroundImage: guilloche,
                  backgroundSize: "100% 100%, 8px 8px",
                  opacity: 0.85,
                }}
              />
              <span
                className="relative text-[24px] font-normal tabular-nums leading-none"
                style={display}
              >
                {top.match}
              </span>
              <span
                className="relative text-[8px] font-semibold uppercase tracking-[0.18em]"
                style={mono}
              >
                match
              </span>
            </span>
            <div className="min-w-0 flex-1">
              <h3
                className="text-[20px] font-normal leading-tight"
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
              style={{ color: C.gold }}
              aria-hidden="true"
            />
          </Dial>
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
        style={{ background: "rgba(232,230,223,0.12)" }}
        aria-hidden="true"
      >
        <div
          className="absolute inset-y-0 left-0 rounded-full"
          style={{
            width: `${value}%`,
            background: `linear-gradient(90deg, ${C.goldSoft}, ${C.gold})`,
          }}
        />
      </div>
      <span className="text-[13px] font-semibold tabular-nums" style={{ ...mono, color: C.gold }}>
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
      <Kop sub="Open opdrachten">Marktplaats</Kop>

      <Dial className="flex items-center gap-3 px-4">
        <Search size={17} style={{ color: C.fgSoft }} aria-hidden="true" />
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Zoek op titel, plaats of opdrachtgever…"
          aria-label="Opdrachten zoeken"
          className="w-full bg-transparent py-2.5 text-[14px] outline-none placeholder:opacity-45"
          style={{ ...ui, color: C.fg }}
        />
        <span
          className="shrink-0 text-[12px] font-semibold tabular-nums"
          style={{ ...mono, color: C.gold }}
        >
          {filtered.length}
        </span>
      </Dial>

      {filtered.length === 0 ? (
        <Dial engraved className="flex flex-col items-center justify-center gap-3 p-14 text-center">
          <Search size={26} style={{ color: C.fgSoft }} aria-hidden="true" />
          <p className="text-[20px] font-normal" style={{ ...display, color: C.fg }}>
            Geen opdrachten gevonden
          </p>
          <p className="max-w-xs text-[13px]" style={{ ...ui, color: C.fgSoft }}>
            Niets past bij “{q}”. Verruim je zoekopdracht of beschikbaarheid.
          </p>
          <button
            onClick={() => setQ("")}
            className="mt-2 inline-flex items-center gap-2 rounded-full px-4 py-2 text-[12px] font-semibold uppercase tracking-[0.06em] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
            style={{ ...mono, background: C.gold, color: C.bgDeep }}
          >
            Zoekopdracht wissen
          </button>
        </Dial>
      ) : (
        <ul className="space-y-3">
          {filtered.map((o) => (
            <li key={o.id}>
              <button
                onClick={onOpen}
                className="group block w-full text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
              >
                <Dial interactive className="flex flex-col gap-4 p-4 sm:flex-row sm:items-center">
                  <div className="min-w-0 flex-1">
                    <h3
                      className="text-[18px] font-normal leading-tight"
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
                      style={{ color: C.gold }}
                      aria-hidden="true"
                    />
                  </div>
                </Dial>
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
            className="text-[11px] font-semibold uppercase tabular-nums tracking-[0.14em]"
            style={{ ...mono, color: C.fgSoft }}
          >
            {opdracht.id}
          </span>
          <Pill tone={C.gold}>{opdracht.match}% match</Pill>
        </div>
        <h1
          className="mt-3 text-[30px] font-normal leading-[1.08] tracking-[-0.02em] sm:text-[40px]"
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
          <Dial key={m.l} engraved className="p-4">
            <m.Icon size={16} style={{ color: C.gold }} aria-hidden="true" />
            <div
              className="mt-2 text-[18px] font-normal tabular-nums leading-none"
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
          </Dial>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <Dial className="p-5" accent={C.lineStrong}>
          <div
            className="inline-flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.16em]"
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
        </Dial>
        <Dial className="p-5" accent={C.lineStrong}>
          <div
            className="inline-flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.16em]"
            style={{ ...mono, color: C.gold }}
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
                  className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full"
                  style={{ background: C.gold }}
                  aria-hidden="true"
                />
                {r}
              </li>
            ))}
          </ul>
        </Dial>
      </div>

      <div className="flex flex-col items-stretch gap-3 pt-1 sm:flex-row">
        <button
          className="group inline-flex flex-1 items-center justify-center gap-2.5 rounded-full px-7 py-3.5 text-[13px] font-semibold uppercase tracking-[0.08em] transition-all hover:gap-3.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 motion-reduce:hover:gap-2.5"
          style={{ ...mono, background: C.gold, color: C.bgDeep }}
        >
          Reageer op opdracht <ArrowRight size={16} aria-hidden="true" />
        </button>
        <button
          className="inline-flex items-center justify-center gap-2 rounded-full px-6 py-3.5 text-[13px] font-semibold uppercase tracking-[0.08em] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
          style={{
            ...mono,
            border: `1px solid ${C.lineStrong}`,
            color: C.fg,
            background: "rgba(232,230,223,0.04)",
          }}
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
  const r = 15.5;
  const circ = 2 * Math.PI * r;
  return (
    <div className="space-y-7">
      <Kop sub="Chronometer-keurmerk">Verificatie</Kop>

      {/* Chronometer-keurmerk: guilloché-wijzerplaat met voortgangsring */}
      <Dial
        engraved
        accent={C.lineStrong}
        className="flex flex-col items-center gap-6 p-6 sm:flex-row"
      >
        <div className="relative h-28 w-28 shrink-0" aria-hidden="true">
          <svg viewBox="0 0 36 36" className="h-full w-full -rotate-90">
            <circle
              cx="18"
              cy="18"
              r={r}
              fill="none"
              stroke="rgba(232,230,223,0.15)"
              strokeWidth="2.6"
            />
            <circle
              cx="18"
              cy="18"
              r={r}
              fill="none"
              stroke={C.gold}
              strokeWidth="2.6"
              strokeLinecap="round"
              strokeDasharray={`${(pct / 100) * circ} ${circ}`}
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span
              className="text-[26px] font-normal tabular-nums leading-none"
              style={{ ...display, color: C.fg }}
            >
              {pct}%
            </span>
            <span
              className="text-[8px] font-semibold uppercase tracking-[0.2em]"
              style={{ ...mono, color: C.fgSoft }}
            >
              gecertificeerd
            </span>
          </div>
        </div>
        <div className="text-center sm:text-left">
          <span
            className="inline-flex items-center gap-2 rounded-full px-3 py-1 text-[12px] font-semibold"
            style={{
              ...mono,
              background: "rgba(232,230,223,0.06)",
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
            {verified} van {CREDENTIALS.length} credentials volledig geverifieerd. Eén dossier
            vraagt binnenkort actie — vernieuw op tijd om verifieerbaar te blijven.
          </p>
        </div>
      </Dial>

      <ul className="space-y-3">
        {CREDENTIALS.map((c) => {
          const st = statusMeta(c.status);
          return (
            <li key={c.naam}>
              <Dial className="flex items-center gap-4 p-4">
                <span
                  className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full"
                  style={{
                    background: "rgba(232,230,223,0.05)",
                    border: `1px solid ${st.tone}`,
                    color: st.tone,
                  }}
                  aria-hidden="true"
                >
                  <st.Icon size={18} strokeWidth={2.2} />
                </span>
                <div className="min-w-0 flex-1">
                  <div
                    className="text-[15px] font-normal leading-tight"
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
              </Dial>
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
      <Kop sub="De volgende beste stap">Volgende acties</Kop>
      <ol className="space-y-3">
        {sorted.map((a, i) => {
          const warn = a.urgentie === "warning";
          const tone = warn ? C.gold : C.green;
          return (
            <li key={a.titel}>
              <Dial
                className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center"
                accent={warn ? C.lineStrong : C.line}
              >
                <span
                  className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-[16px] font-normal tabular-nums"
                  style={{
                    background: "rgba(232,230,223,0.05)",
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
                      <Clock
                        size={14}
                        strokeWidth={2.2}
                        style={{ color: tone }}
                        aria-hidden="true"
                      />
                    )}
                    <h3
                      className="text-[17px] font-normal leading-tight"
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
                  className="shrink-0 self-start rounded-full px-5 py-2.5 text-[12px] font-semibold uppercase tracking-[0.06em] transition-transform hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 motion-reduce:hover:translate-y-0 sm:self-center"
                  style={{ ...mono, background: tone, color: C.bgDeep }}
                >
                  {a.cta}
                </button>
              </Dial>
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
    if (status === "Openstaand") return C.gold;
    if (status === "Concept") return C.fgSoft;
    return C.red;
  };
  return (
    <div className="space-y-7">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <Kop sub="Grootboek">Facturen</Kop>
        <button
          className="inline-flex items-center gap-2 rounded-full px-4 py-2.5 text-[12px] font-semibold uppercase tracking-[0.06em] transition-all hover:gap-3 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 motion-reduce:hover:gap-2"
          style={{ ...mono, background: C.gold, color: C.bgDeep }}
        >
          <Plus size={15} aria-hidden="true" /> Nieuwe factuur
        </button>
      </div>

      <Dial className="overflow-x-auto">
        <table className="w-full min-w-[560px] border-collapse text-left">
          <thead>
            <tr style={{ borderBottom: `1px solid ${C.lineStrong}` }}>
              {["Nummer", "Klant", "Datum", "Status", "Bedrag"].map((h, i) => (
                <th
                  key={h}
                  className={`px-4 py-3 text-[10px] font-semibold uppercase tracking-[0.16em] ${i === 4 ? "text-right" : ""}`}
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
                  className="transition-colors hover:bg-white/5"
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
                    className="px-4 py-3.5 text-right text-[15px] font-normal tabular-nums"
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
                className="px-4 py-4 text-[10px] font-semibold uppercase tracking-[0.18em]"
                style={{ ...mono, color: C.fgSoft }}
              >
                Totaal betaald
              </td>
              <td
                className="px-4 py-4 text-right text-[19px] font-normal tabular-nums"
                style={{ ...display, color: C.green }}
              >
                {total}
              </td>
            </tr>
          </tfoot>
        </table>
      </Dial>
    </div>
  );
}
