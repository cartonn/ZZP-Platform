"use client";

// Concept 126 — "Histologie" · H&E-kleuring & weefselcoupe (klinisch, past bij zorg).
// Objectglas/microscoop-esthetiek op licht glas (#f6f1f4): hematoxyline-eosine gekleurde
// weefsel-textuur — roze/magenta eosine (#a83b7a) + paarse hematoxyline (#5b3a86) vlekken via
// zachte radiale gradients, met celkern-stippen. Panelen liggen als coupe-preparaten met
// objectglas-rand, etiket, en een meetschaal-lijntje. Data als preparaten onder de microscoop.
// ONDERSCHEIDEND van mint klinisch dossier (Kliniek) en lijn-art scan (Röntgen): dit is
// HISTOLOGISCHE H&E-KLEURING op objectglas. Fonts: Inter (UI) + Spline Sans Mono (labels/schaal).

import { useState } from "react";
import {
  ArrowRight,
  Check,
  Clock,
  AlertTriangle,
  XCircle,
  Search,
  Microscope,
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

// Objectglas / H&E-kleuring palet.
const C = {
  glass: "#f6f1f4", // objectglas-licht
  glassDeep: "#efe7ec", // ietsje dieper vlak
  panel: "#fbf8fa", // opgelicht preparaat-vlak
  ink: "#241820", // weefsel-donker (tekst)
  inkSoft: "#6a5b64", // gedempt
  inkFaint: "#9a8c94", // heel licht
  eosine: "#a83b7a", // eosine-magenta accent
  eosineSoft: "#c976a6", // lichte eosine
  hema: "#5b3a86", // hematoxyline-paars secundair
  hemaSoft: "#8467ac", // lichte hematoxyline
  green: "#2f7d6f", // klinisch teal (geverifieerd)
  amber: "#a9762c", // gedempt oker (waarschuwing)
  red: "#b0324a", // crimson (afgewezen)
  line: "rgba(36,24,32,0.10)",
  lineStrong: "rgba(168,59,122,0.26)",
};

const ui = { fontFamily: "var(--font-lab-inter)" };
const scaleF = { fontFamily: "var(--font-lab-spline-mono)" };

// H&E-weefseltextuur: zachte eosine/hematoxyline-vlekken met celkern-stippen.
const tissue =
  "radial-gradient(38% 30% at 18% 22%, rgba(168,59,122,0.10), transparent 70%)," +
  "radial-gradient(34% 40% at 82% 30%, rgba(91,58,134,0.10), transparent 70%)," +
  "radial-gradient(40% 36% at 60% 82%, rgba(168,59,122,0.08), transparent 70%)," +
  "radial-gradient(28% 30% at 30% 78%, rgba(91,58,134,0.07), transparent 70%)";

// Celkern-stippen: fijn raster van hematoxyline-kernen.
const nuclei =
  "radial-gradient(circle at 5px 8px, rgba(91,58,134,0.14) 1px, transparent 1.6px)," +
  "radial-gradient(circle at 16px 3px, rgba(168,59,122,0.12) 1px, transparent 1.6px)," +
  "radial-gradient(circle at 11px 15px, rgba(91,58,134,0.1) 0.8px, transparent 1.4px)";

const slideSurface = tissue;

function statusMeta(s: CredStatus): { label: string; Icon: LucideIcon; tone: string } {
  switch (s) {
    case "VERIFIED":
      return { label: "Geverifieerd", Icon: Check, tone: C.green };
    case "SUBMITTED":
      return { label: "In beoordeling", Icon: Clock, tone: C.hema };
    case "EXPIRING":
      return { label: "Verloopt binnenkort", Icon: AlertTriangle, tone: C.amber };
    case "REJECTED":
      return { label: "Afgewezen", Icon: XCircle, tone: C.red };
  }
}

// Meetschaal-lijntje (schaalbalk onder de microscoop).
function ScaleBar({ label = "50 µm" }: { label?: string }) {
  return (
    <div className="flex items-center gap-2" aria-hidden="true">
      <div className="flex items-end gap-[3px]">
        {Array.from({ length: 6 }).map((_, i) => (
          <span
            key={i}
            className="w-[3px]"
            style={{ height: i % 2 === 0 ? 9 : 5, background: C.inkFaint }}
          />
        ))}
      </div>
      <span
        className="text-[9px] uppercase tracking-[0.18em]"
        style={{ ...scaleF, color: C.inkFaint }}
      >
        {label}
      </span>
    </div>
  );
}

// Objectglas-preparaat: paneel met glas-rand, H&E-vlekken en celkern-stippen.
function Slide({
  children,
  className = "",
  stained = false,
  accent = C.line,
  interactive = false,
}: {
  children: React.ReactNode;
  className?: string;
  stained?: boolean;
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
        boxShadow: "0 1px 0 rgba(255,255,255,0.7) inset, 0 12px 26px -20px rgba(91,58,134,0.4)",
      }}
    >
      {stained && (
        <>
          <span
            aria-hidden="true"
            className="pointer-events-none absolute inset-0"
            style={{ backgroundImage: tissue }}
          />
          <span
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 opacity-70"
            style={{ backgroundImage: nuclei, backgroundSize: "22px 20px" }}
          />
        </>
      )}
      <div className="relative">{children}</div>
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
          ? { background: tone, color: C.glass }
          : { background: "rgba(168,59,122,0.05)", color: tone, border: `1px solid ${tone}` }
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
        strokeWidth={2.5}
        strokeLinecap="round"
        strokeLinejoin="round"
        vectorEffect="non-scaling-stroke"
      />
    </svg>
  );
}

// Sectiekop met preparaat-etiket-stijl (mono-label + magenta lijn).
function Kop({ children, sub }: { children: React.ReactNode; sub?: string }) {
  return (
    <div>
      {sub && (
        <div
          className="mb-1.5 text-[10.5px] font-semibold uppercase tracking-[0.26em]"
          style={{ ...scaleF, color: C.eosine }}
        >
          {sub}
        </div>
      )}
      <div className="flex items-center gap-3">
        <h2
          className="text-[26px] font-semibold leading-none tracking-[-0.02em] sm:text-[32px]"
          style={{ ...ui, color: C.ink }}
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

export function Concept126() {
  const [screen, setScreen] = useState<ScreenKey>("dashboard");
  const active = OPDRACHTEN[0] as Opdracht;

  return (
    <div
      className="min-h-[680px] w-full antialiased"
      style={{ ...ui, background: C.glass, backgroundImage: slideSurface, color: C.ink }}
    >
      {/* Kop — microscoop-mark op objectglas */}
      <header className="mx-auto flex max-w-5xl items-center justify-between px-5 pt-8 md:px-10">
        <div className="flex items-center gap-3.5">
          <span
            className="relative flex h-11 w-11 items-center justify-center overflow-hidden rounded-md"
            style={{ background: C.glass, border: `1px solid ${C.lineStrong}`, color: C.eosine }}
            aria-hidden="true"
          >
            <span
              className="pointer-events-none absolute inset-0"
              style={{ backgroundImage: tissue }}
            />
            <Microscope size={20} strokeWidth={2} className="relative" />
          </span>
          <div className="leading-none">
            <div
              className="text-[20px] font-semibold tracking-[-0.01em]"
              style={{ ...ui, color: C.ink }}
            >
              Histologie
            </div>
            <div
              className="mt-1 text-[9.5px] uppercase tracking-[0.3em]"
              style={{ ...scaleF, color: C.inkSoft }}
            >
              ZZP · Platform
            </div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="hidden text-right leading-tight sm:block">
            <div className="text-[13px] font-semibold" style={{ color: C.ink }}>
              {PROFIEL.naam}
            </div>
            <div className="text-[11px]" style={{ color: C.inkSoft }}>
              {PROFIEL.rol}
            </div>
          </div>
          <span
            className="flex h-11 w-11 items-center justify-center rounded-md text-[13px] font-semibold"
            style={{
              background: "rgba(168,59,122,0.1)",
              color: C.eosine,
              border: `1px solid ${C.lineStrong}`,
            }}
            aria-hidden="true"
          >
            {PROFIEL.initialen}
          </span>
        </div>
      </header>

      {/* Navigatie — tab-strip met eosine-onderstreping */}
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
              className="relative shrink-0 px-3.5 py-2 text-[13px] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
              style={{ color: on ? C.eosine : C.inkSoft, fontWeight: on ? 700 : 500 }}
            >
              {s.label}
              {on && (
                <span
                  className="absolute -bottom-[17px] left-2 right-2 h-[2.5px] rounded-full"
                  style={{ background: C.eosine }}
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
        {screen === "acties" && <Acties onOpen={() => setScreen("opdracht")} />}
        {screen === "facturen" && <Facturen />}
      </main>
    </div>
  );
}

function Dashboard({ onOpen }: { onOpen: () => void }) {
  const primair = ACTIES[0] as (typeof ACTIES)[number];
  const top = OPDRACHTEN[0] as Opdracht;
  const tones = [C.eosine, C.green, C.hema, C.amber];
  return (
    <div className="space-y-10">
      <section>
        <div
          className="text-[10.5px] font-semibold uppercase tracking-[0.26em]"
          style={{ ...scaleF, color: C.eosine }}
        >
          Vandaag · {PROFIEL.plaats}
        </div>
        <h1
          className="mt-2 text-[32px] font-semibold leading-[1.08] tracking-[-0.03em] sm:text-[42px]"
          style={{ ...ui, color: C.ink }}
        >
          Goedemorgen, {PROFIEL.naam.split(" ")[0]}
        </h1>
        <p className="mt-2 max-w-md text-[14px] leading-relaxed" style={{ color: C.inkSoft }}>
          Het preparaat ligt scherp onder de lens. Eén coupe vraagt vandaag om aandacht — de rest
          kleurt helder.
        </p>
      </section>

      {/* Primaire actie — gekleurd preparaat */}
      <Slide stained accent={C.lineStrong} className="p-0">
        <div className="flex flex-col gap-5 p-6 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0">
            <span
              className="inline-flex items-center gap-2 text-[10.5px] font-semibold uppercase tracking-[0.2em]"
              style={{ ...scaleF, color: C.amber }}
            >
              <AlertTriangle size={13} strokeWidth={2.4} aria-hidden="true" /> Vraagt aandacht
            </span>
            <h2
              className="mt-2 text-[23px] font-semibold leading-tight sm:text-[27px]"
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
            className="group inline-flex shrink-0 items-center gap-2.5 rounded-full px-6 py-3 text-[13px] font-semibold transition-all hover:gap-3.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 motion-reduce:hover:gap-2.5"
            style={{ background: C.eosine, color: C.glass }}
          >
            {primair.cta}
            <ArrowRight size={16} aria-hidden="true" />
          </button>
        </div>
      </Slide>

      {/* KPI-preparaten */}
      <section>
        <Kop sub="In cijfers">Prestatie</Kop>
        <div className="mt-5 grid grid-cols-2 gap-4 lg:grid-cols-4">
          {KPIS.map((k, i) => {
            const tone = tones[i % tones.length] as string;
            return (
              <Slide key={k.label} stained interactive className="p-4">
                <div className="flex items-start justify-between">
                  <span
                    className="h-2.5 w-2.5 rounded-full"
                    style={{ background: tone, boxShadow: `0 0 0 3px ${tone}22` }}
                    aria-hidden="true"
                  />
                  <span
                    className="text-[11px] font-semibold tabular-nums"
                    style={{ ...scaleF, color: k.up ? C.green : C.amber }}
                  >
                    {k.up ? "▲" : "▼"} {k.trend}
                  </span>
                </div>
                <div
                  className="mt-3 text-[26px] font-semibold tabular-nums leading-none tracking-[-0.02em]"
                  style={{ ...ui, color: C.ink }}
                >
                  {k.value}
                </div>
                <div className="mt-1 text-[11.5px]" style={{ color: C.inkSoft }}>
                  {k.label}
                </div>
                <div className="mt-3">
                  <Spark data={k.spark} tone={tone} />
                </div>
              </Slide>
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
          <Slide
            interactive
            stained
            accent={C.lineStrong}
            className="flex flex-col gap-5 p-5 sm:flex-row sm:items-center"
          >
            <span
              className="relative flex h-20 w-20 shrink-0 flex-col items-center justify-center rounded-full"
              style={{
                background: "rgba(168,59,122,0.1)",
                color: C.eosine,
                border: `1px solid ${C.lineStrong}`,
              }}
              aria-hidden="true"
            >
              <span className="text-[24px] font-semibold tabular-nums leading-none" style={ui}>
                {top.match}
              </span>
              <span className="text-[9px] font-semibold uppercase tracking-[0.16em]" style={scaleF}>
                match
              </span>
            </span>
            <div className="min-w-0 flex-1">
              <h3
                className="text-[20px] font-semibold leading-tight"
                style={{ ...ui, color: C.ink }}
              >
                {top.titel}
              </h3>
              <div className="mt-1 text-[12.5px]" style={{ color: C.inkSoft }}>
                {top.opdrachtgever} · {top.plaats} · {top.tarief}
              </div>
              <div className="mt-3 flex flex-wrap gap-1.5">
                {top.tags.map((t) => (
                  <Pill key={t} tone={C.inkSoft}>
                    {t}
                  </Pill>
                ))}
              </div>
            </div>
            <ArrowRight
              size={22}
              className="hidden shrink-0 transition-transform group-hover:translate-x-1 motion-reduce:group-hover:translate-x-0 md:block"
              style={{ color: C.eosine }}
              aria-hidden="true"
            />
          </Slide>
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
        style={{ background: "rgba(168,59,122,0.14)" }}
        aria-hidden="true"
      >
        <div
          className="absolute inset-y-0 left-0 rounded-full"
          style={{
            width: `${value}%`,
            background: `linear-gradient(90deg, ${C.hema}, ${C.eosine})`,
          }}
        />
      </div>
      <span
        className="text-[13px] font-semibold tabular-nums"
        style={{ ...scaleF, color: C.eosine }}
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
      <div className="flex flex-wrap items-end justify-between gap-3">
        <Kop sub="Open opdrachten">Marktplaats</Kop>
        <ScaleBar />
      </div>

      <Slide className="flex items-center gap-3 px-4 py-1">
        <Search size={17} style={{ color: C.inkSoft }} aria-hidden="true" />
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Zoek op titel, plaats of opdrachtgever…"
          aria-label="Opdrachten zoeken"
          className="w-full bg-transparent py-2.5 text-[14px] outline-none placeholder:opacity-50"
          style={{ color: C.ink }}
        />
        <span
          className="shrink-0 text-[12px] font-semibold tabular-nums"
          style={{ ...scaleF, color: C.inkSoft }}
        >
          {filtered.length}
        </span>
      </Slide>

      {filtered.length === 0 ? (
        <Slide stained className="flex flex-col items-center justify-center gap-3 p-14 text-center">
          <Microscope size={28} style={{ color: C.eosine }} aria-hidden="true" />
          <p className="text-[20px] font-semibold" style={{ ...ui, color: C.ink }}>
            Geen opdrachten gevonden
          </p>
          <p className="max-w-xs text-[13px]" style={{ color: C.inkSoft }}>
            Geen coupe komt overeen met “{q}”. Verruim je zoekopdracht of beschikbaarheid.
          </p>
          <button
            onClick={() => setQ("")}
            className="mt-2 inline-flex items-center gap-2 rounded-full px-4 py-2 text-[12px] font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
            style={{ background: C.eosine, color: C.glass }}
          >
            Zoekopdracht wissen
          </button>
        </Slide>
      ) : (
        <ul className="space-y-3">
          {filtered.map((o) => (
            <li key={o.id}>
              <button
                onClick={onOpen}
                className="group block w-full text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
              >
                <Slide
                  interactive
                  stained
                  className="flex flex-col gap-4 p-4 sm:flex-row sm:items-center"
                >
                  <div className="min-w-0 flex-1">
                    <h3
                      className="text-[18px] font-semibold leading-tight"
                      style={{ ...ui, color: C.ink }}
                    >
                      {o.titel}
                    </h3>
                    <div className="mt-0.5 text-[12.5px]" style={{ color: C.inkSoft }}>
                      {o.opdrachtgever} · {o.plaats} · {o.tarief}
                    </div>
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {o.tags.map((t) => (
                        <Pill key={t} tone={C.inkSoft}>
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
                      style={{ color: C.eosine }}
                      aria-hidden="true"
                    />
                  </div>
                </Slide>
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
        className="inline-flex items-center gap-2 text-[12.5px] font-medium transition-opacity hover:opacity-60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
        style={{ color: C.inkSoft }}
      >
        <ArrowRight size={14} className="rotate-180" aria-hidden="true" /> Terug naar marktplaats
      </button>

      <section>
        <div className="flex flex-wrap items-center gap-2">
          <span
            className="text-[10.5px] font-semibold uppercase tracking-[0.18em]"
            style={{ ...scaleF, color: C.inkSoft }}
          >
            {opdracht.id}
          </span>
          <Pill tone={C.eosine} solid>
            {opdracht.match}% match
          </Pill>
        </div>
        <h1
          className="mt-3 text-[30px] font-semibold leading-[1.1] tracking-[-0.03em] sm:text-[40px]"
          style={{ ...ui, color: C.ink }}
        >
          {opdracht.titel}
        </h1>
        <p className="mt-2 text-[13.5px]" style={{ color: C.inkSoft }}>
          {opdracht.opdrachtgever} · {opdracht.plaats}
        </p>
      </section>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {feiten.map((m) => (
          <Slide key={m.l} className="p-4">
            <m.Icon size={16} style={{ color: C.eosine }} aria-hidden="true" />
            <div
              className="mt-2 text-[18px] font-semibold tabular-nums leading-none"
              style={{ ...ui, color: C.ink }}
            >
              {m.v}
            </div>
            <div
              className="mt-1.5 text-[10.5px] uppercase tracking-[0.12em]"
              style={{ ...scaleF, color: C.inkSoft }}
            >
              {m.l}
            </div>
          </Slide>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <Slide className="p-5" accent={C.green}>
          <div
            className="inline-flex items-center gap-2 text-[12px] font-semibold uppercase tracking-[0.14em]"
            style={{ ...scaleF, color: C.green }}
          >
            <Check size={14} strokeWidth={2.6} aria-hidden="true" /> Wat past
          </div>
          <ul className="mt-4 space-y-3">
            {opdracht.redenen.plus.map((r) => (
              <li
                key={r}
                className="flex items-start gap-3 text-[14px] leading-snug"
                style={{ color: C.ink }}
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
        </Slide>
        <Slide className="p-5" accent={C.amber}>
          <div
            className="inline-flex items-center gap-2 text-[12px] font-semibold uppercase tracking-[0.14em]"
            style={{ ...scaleF, color: C.amber }}
          >
            <AlertTriangle size={14} strokeWidth={2.6} aria-hidden="true" /> Aandacht
          </div>
          <ul className="mt-4 space-y-3">
            {opdracht.redenen.min.map((r) => (
              <li
                key={r}
                className="flex items-start gap-3 text-[14px] leading-snug"
                style={{ color: C.ink }}
              >
                <span
                  className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full"
                  style={{ background: C.amber }}
                  aria-hidden="true"
                />
                {r}
              </li>
            ))}
          </ul>
        </Slide>
      </div>

      <div className="flex flex-col items-stretch gap-3 pt-1 sm:flex-row">
        <button
          className="group inline-flex flex-1 items-center justify-center gap-2.5 rounded-full px-7 py-3.5 text-[14px] font-semibold transition-all hover:gap-3.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 motion-reduce:hover:gap-2.5"
          style={{ background: C.eosine, color: C.glass }}
        >
          Reageer op opdracht <ArrowRight size={16} aria-hidden="true" />
        </button>
        <button
          className="inline-flex items-center justify-center gap-2 rounded-full px-6 py-3.5 text-[14px] font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
          style={{ border: `1px solid ${C.lineStrong}`, color: C.ink, background: C.panel }}
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
      <Kop sub="Vertrouwen">Verificatie</Kop>

      {/* Preparaat-keurmerk: gekleurde coupe met dekking-percentage */}
      <Slide
        stained
        accent={C.lineStrong}
        className="flex flex-col items-center gap-6 p-6 sm:flex-row"
      >
        <div className="relative h-24 w-24 shrink-0" aria-hidden="true">
          <svg viewBox="0 0 36 36" className="h-full w-full -rotate-90">
            <defs>
              <linearGradient id="he-grad-126" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor={C.hema} />
                <stop offset="100%" stopColor={C.eosine} />
              </linearGradient>
            </defs>
            <circle
              cx="18"
              cy="18"
              r="15.5"
              fill="none"
              stroke="rgba(168,59,122,0.16)"
              strokeWidth="3"
            />
            <circle
              cx="18"
              cy="18"
              r="15.5"
              fill="none"
              stroke="url(#he-grad-126)"
              strokeWidth="3"
              strokeLinecap="round"
              strokeDasharray={`${(pct / 100) * 97.4} 97.4`}
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span
              className="text-[24px] font-semibold tabular-nums leading-none"
              style={{ ...ui, color: C.ink }}
            >
              {pct}%
            </span>
            <span
              className="text-[9px] font-semibold uppercase tracking-[0.18em]"
              style={{ ...scaleF, color: C.inkSoft }}
            >
              gedekt
            </span>
          </div>
        </div>
        <div className="text-center sm:text-left">
          <span
            className="inline-flex items-center gap-2 rounded-full px-3 py-1 text-[12px] font-semibold"
            style={{ background: "rgba(47,125,111,0.12)", color: C.green }}
          >
            <ShieldCheck size={15} strokeWidth={2.2} aria-hidden="true" /> {PROFIEL.trust}
          </span>
          <p className="mt-3 max-w-md text-[14px] leading-relaxed" style={{ color: C.inkSoft }}>
            {verified} van {CREDENTIALS.length} credentials volledig geverifieerd. Eén dossier
            vraagt binnenkort actie — vernieuw op tijd om verifieerbaar te blijven.
          </p>
        </div>
      </Slide>

      <ul className="space-y-3">
        {CREDENTIALS.map((c) => {
          const st = statusMeta(c.status);
          return (
            <li key={c.naam}>
              <Slide className="flex items-center gap-4 p-4">
                <span
                  className="flex h-11 w-11 shrink-0 items-center justify-center rounded-md"
                  style={{
                    background: "rgba(168,59,122,0.05)",
                    border: `1px solid ${st.tone}`,
                    color: st.tone,
                  }}
                  aria-hidden="true"
                >
                  <st.Icon size={18} strokeWidth={2.4} />
                </span>
                <div className="min-w-0 flex-1">
                  <div
                    className="text-[15px] font-semibold leading-tight"
                    style={{ ...ui, color: C.ink }}
                  >
                    {c.naam}
                  </div>
                  <div className="mt-0.5 text-[12px]" style={{ color: C.inkSoft }}>
                    {c.detail}
                  </div>
                </div>
                <Pill tone={st.tone}>
                  <st.Icon size={12} strokeWidth={2.6} aria-hidden="true" />
                  <span className="hidden sm:inline">{st.label}</span>
                </Pill>
              </Slide>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

function Acties({ onOpen }: { onOpen: () => void }) {
  const sorted = [...ACTIES].sort((a, b) =>
    a.urgentie === b.urgentie ? 0 : a.urgentie === "warning" ? -1 : 1,
  );
  return (
    <div className="space-y-7">
      <Kop sub="De volgende beste stap">Volgende acties</Kop>
      <ol className="space-y-3">
        {sorted.map((a, i) => {
          const warn = a.urgentie === "warning";
          const tone = warn ? C.amber : C.eosine;
          return (
            <li key={a.titel}>
              <Slide
                className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center"
                accent={warn ? C.amber : C.line}
              >
                <span
                  className="flex h-11 w-11 shrink-0 items-center justify-center rounded-md text-[16px] font-semibold tabular-nums"
                  style={{
                    background: "rgba(168,59,122,0.05)",
                    color: tone,
                    border: `1px solid ${tone}`,
                  }}
                  aria-hidden="true"
                >
                  <span style={ui}>{i + 1}</span>
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    {warn ? (
                      <AlertTriangle
                        size={14}
                        strokeWidth={2.4}
                        style={{ color: tone }}
                        aria-hidden="true"
                      />
                    ) : (
                      <Microscope
                        size={14}
                        strokeWidth={2.4}
                        style={{ color: tone }}
                        aria-hidden="true"
                      />
                    )}
                    <h3
                      className="text-[17px] font-semibold leading-tight"
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
                  onClick={onOpen}
                  className="shrink-0 self-start rounded-full px-5 py-2.5 text-[12.5px] font-semibold transition-transform hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 motion-reduce:hover:translate-y-0 sm:self-center"
                  style={{ background: tone, color: C.glass }}
                >
                  {a.cta}
                </button>
              </Slide>
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
    if (status === "Concept") return C.inkFaint;
    return C.eosine;
  };
  return (
    <div className="space-y-7">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <Kop sub="Omzet">Facturen</Kop>
        <button
          className="inline-flex items-center gap-2 rounded-full px-4 py-2.5 text-[12.5px] font-semibold transition-all hover:gap-3 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 motion-reduce:hover:gap-2"
          style={{ background: C.eosine, color: C.glass }}
        >
          <Plus size={15} aria-hidden="true" /> Nieuwe factuur
        </button>
      </div>

      <Slide className="overflow-x-auto">
        <table className="w-full min-w-[560px] border-collapse text-left">
          <thead>
            <tr style={{ borderBottom: `1px solid ${C.lineStrong}` }}>
              {["Nummer", "Klant", "Datum", "Status", "Bedrag"].map((h, i) => (
                <th
                  key={h}
                  className={`px-4 py-3 text-[10.5px] font-semibold uppercase tracking-[0.12em] ${i === 4 ? "text-right" : ""}`}
                  style={{ ...scaleF, color: C.inkSoft }}
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
                    style={{ ...scaleF, color: C.inkSoft }}
                  >
                    {f.nr}
                  </td>
                  <td className="px-4 py-3.5 text-[14px]" style={{ color: C.ink }}>
                    {f.klant}
                  </td>
                  <td
                    className="px-4 py-3.5 text-[12.5px] tabular-nums"
                    style={{ ...scaleF, color: C.inkSoft }}
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
                    style={{ ...ui, color: C.ink }}
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
                className="px-4 py-4 text-[10.5px] font-semibold uppercase tracking-[0.14em]"
                style={{ ...scaleF, color: C.inkSoft }}
              >
                Totaal betaald
              </td>
              <td
                className="px-4 py-4 text-right text-[19px] font-semibold tabular-nums"
                style={{ ...ui, color: C.green }}
              >
                {total}
              </td>
            </tr>
          </tfoot>
        </table>
      </Slide>
    </div>
  );
}
