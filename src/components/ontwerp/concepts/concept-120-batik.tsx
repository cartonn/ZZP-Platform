"use client";

// Concept 120 — "Batik" · Indonesische was-resist textielverven.
// Diep indigo-blauw (#1b2a4a) met warm soga-bruin (#6b4a2b) en gebroken-wit (#ece3d0):
// het klassieke indigo/soga/crème batik-palet. Karakteristieke batik-MOTIEVEN als decoratie
// (parang = diagonale rijstkorrel-strepen, kawung = ovaal-rozetten, ceplok = raster),
// opgebouwd uit fijne CSS/SVG repeating-patterns, met de typische was-craquelé haarscheurtjes.
// Data-panelen liggen als batik-doek-vlakken met een fijne motief-rand; verificatie-status met
// label+icoon in gebroken-wit op indigo (hoog contrast). Onderscheidend van geweven stof
// (Textiel), NL-tegel (Delft) en natte wassing (Aquarel): dit is WAS-RESIST BATIK met
// parang/kawung-motieven. Fonts: Newsreader (warm, cultureel display) + Manrope (UI).

import { useState } from "react";
import {
  ArrowRight,
  Check,
  Clock,
  AlertTriangle,
  XCircle,
  Search,
  Sparkles,
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

// Indigo / soga / crème batik-palet.
const C = {
  indigo: "#1b2a4a", // diep indigo-doek
  indigoDeep: "#152039",
  indigoSoft: "#243761", // opgelicht indigo-vlak
  panel: "#20315480", // half-transparant doek-vlak
  cream: "#ece3d0", // gebroken-wit was-resist
  creamSoft: "#c9c1ae",
  soga: "#6b4a2b", // warm soga-bruin
  sogaLight: "#a9793f", // opgelicht soga-accent
  gold: "#d8a24a", // warm accent (kawung-hart)
  green: "#7bb58a", // zacht jade voor geverifieerd (contrast op indigo)
  red: "#e0705f", // gedempt terracotta-rood
  line: "rgba(236,227,208,0.14)",
  lineStrong: "rgba(236,227,208,0.26)",
};

const display = { fontFamily: "var(--font-lab-newsreader)" };
const ui = { fontFamily: "var(--font-lab-manrope)" };

// Parang: diagonale rijstkorrel-strepen (was-resist banen).
const parang =
  "repeating-linear-gradient(135deg, rgba(236,227,208,0.05) 0px, rgba(236,227,208,0.05) 2px, transparent 2px, transparent 13px)," +
  "repeating-linear-gradient(135deg, rgba(169,121,63,0.06) 6px, rgba(169,121,63,0.06) 8px, transparent 8px, transparent 26px)";

// Kawung: ovaal-rozetten als fijn radiaal raster.
const kawung =
  "radial-gradient(circle at 0 0, rgba(216,162,74,0.10) 1.5px, transparent 2px)," +
  "radial-gradient(circle at 11px 11px, rgba(216,162,74,0.10) 1.5px, transparent 2px)," +
  "radial-gradient(circle at 11px 0, rgba(236,227,208,0.06) 1px, transparent 1.5px)," +
  "radial-gradient(circle at 0 11px, rgba(236,227,208,0.06) 1px, transparent 1.5px)";

// Was-craquelé: fijne lichte haarscheurtjes over het doek.
const craquele =
  "repeating-linear-gradient(58deg, rgba(236,227,208,0.035) 0 1px, transparent 1px 34px)," +
  "repeating-linear-gradient(-24deg, rgba(236,227,208,0.03) 0 1px, transparent 1px 47px)";

// Volledige doek-achtergrond: parang + craquelé + zachte indigo-diepte.
const clothSurface =
  parang +
  "," +
  craquele +
  ",radial-gradient(120% 90% at 15% 0%, rgba(36,55,97,0.9), transparent 60%)," +
  "radial-gradient(120% 90% at 90% 100%, rgba(107,74,43,0.18), transparent 60%)";

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
      return { label: "Verloopt binnenkort", Icon: AlertTriangle, tone: C.sogaLight };
    case "REJECTED":
      return { label: "Afgewezen", Icon: XCircle, tone: C.red };
  }
}

// Batik-doek-paneel met motief-rand en kawung-textuur.
function Cloth({
  children,
  className = "",
  motief = false,
  accent = C.line,
  interactive = false,
}: {
  children: React.ReactNode;
  className?: string;
  motief?: boolean;
  accent?: string;
  interactive?: boolean;
}) {
  return (
    <div
      className={`relative overflow-hidden rounded-xl ${
        interactive
          ? "transition-transform duration-200 hover:-translate-y-0.5 motion-reduce:hover:translate-y-0"
          : ""
      } ${className}`}
      style={{
        background: C.panel,
        border: `1px solid ${accent}`,
        boxShadow: "inset 0 1px 0 rgba(236,227,208,0.06), 0 10px 24px -14px rgba(0,0,0,0.6)",
      }}
    >
      {motief && (
        <span
          aria-hidden="true"
          className="pointer-events-none absolute inset-0"
          style={{ backgroundImage: kawung, backgroundSize: "22px 22px", opacity: 0.7 }}
        />
      )}
      <div className="relative">{children}</div>
    </div>
  );
}

// Batik-motief-rand: dun soga-lijntje boven een vlak (tumpal-achtige zoomrand).
function Zoom() {
  return (
    <span
      aria-hidden="true"
      className="block h-[3px] w-full"
      style={{
        backgroundImage:
          "repeating-linear-gradient(90deg, " +
          C.sogaLight +
          " 0 6px, transparent 6px 12px), linear-gradient(90deg, " +
          C.soga +
          ", " +
          C.gold +
          ")",
        backgroundSize: "12px 3px, 100% 1px",
      }}
    />
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
          ? { background: tone, color: C.indigoDeep }
          : { background: "rgba(236,227,208,0.06)", color: tone, border: `1px solid ${tone}` }
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
      <polyline
        points={`0,100 ${pts.join(" ")} 100,100`}
        fill={tone}
        opacity={0.12}
        stroke="none"
      />
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

function Kop({ children, sub }: { children: React.ReactNode; sub?: string }) {
  return (
    <div>
      {sub && (
        <div
          className="mb-1.5 text-[11px] font-semibold uppercase tracking-[0.28em]"
          style={{ color: C.gold }}
        >
          {sub}
        </div>
      )}
      <div className="flex items-center gap-3">
        <h2
          className="text-[26px] font-medium leading-none tracking-[-0.01em] sm:text-[32px]"
          style={{ ...display, color: C.cream }}
        >
          {children}
        </h2>
        <span
          className="h-[3px] flex-1 rounded-full"
          style={{
            backgroundImage: `repeating-linear-gradient(90deg, ${C.soga} 0 5px, transparent 5px 10px)`,
          }}
          aria-hidden="true"
        />
      </div>
    </div>
  );
}

export function Concept120() {
  const [screen, setScreen] = useState<ScreenKey>("dashboard");
  const active = OPDRACHTEN[0] as Opdracht;

  return (
    <div
      className="min-h-[680px] w-full antialiased"
      style={{ ...ui, background: C.indigo, backgroundImage: clothSurface, color: C.cream }}
    >
      {/* Kop — soga-schildje met kawung-hart */}
      <header className="mx-auto flex max-w-5xl items-center justify-between px-5 pt-8 md:px-10">
        <div className="flex items-center gap-3.5">
          <span
            className="relative flex h-11 w-11 items-center justify-center overflow-hidden rounded-lg"
            style={{ background: C.soga, color: C.cream, border: `1px solid ${C.gold}` }}
            aria-hidden="true"
          >
            <span
              className="pointer-events-none absolute inset-0"
              style={{ backgroundImage: kawung, backgroundSize: "16px 16px", opacity: 0.8 }}
            />
            <Sparkles size={19} strokeWidth={2} className="relative" />
          </span>
          <div className="leading-none">
            <div
              className="text-[20px] font-medium tracking-[-0.01em]"
              style={{ ...display, color: C.cream }}
            >
              Batik
            </div>
            <div
              className="mt-1 text-[10px] uppercase tracking-[0.26em]"
              style={{ color: C.creamSoft }}
            >
              ZZP · Platform
            </div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="hidden text-right leading-tight sm:block">
            <div className="text-[13px] font-semibold" style={{ color: C.cream }}>
              {PROFIEL.naam}
            </div>
            <div className="text-[11px]" style={{ color: C.creamSoft }}>
              {PROFIEL.rol}
            </div>
          </div>
          <span
            className="flex h-11 w-11 items-center justify-center rounded-lg text-[13px] font-semibold"
            style={{ background: C.indigoSoft, color: C.gold, border: `1px solid ${C.lineStrong}` }}
            aria-hidden="true"
          >
            {PROFIEL.initialen}
          </span>
        </div>
      </header>

      {/* Navigatie — tab-strip met batik-zoomrand onder actief */}
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
              style={{ color: on ? C.cream : C.creamSoft, fontWeight: on ? 700 : 500 }}
            >
              {s.label}
              {on && (
                <span
                  className="absolute -bottom-[17px] left-2 right-2 h-[3px] rounded-full"
                  style={{
                    backgroundImage: `repeating-linear-gradient(90deg, ${C.gold} 0 5px, transparent 5px 9px)`,
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
  const tones = [C.gold, C.green, C.sogaLight, C.red];
  return (
    <div className="space-y-10">
      <section>
        <div
          className="text-[11px] font-semibold uppercase tracking-[0.28em]"
          style={{ color: C.gold }}
        >
          Vandaag · {PROFIEL.plaats}
        </div>
        <h1
          className="mt-2 text-[32px] font-medium leading-[1.06] tracking-[-0.02em] sm:text-[42px]"
          style={{ ...display, color: C.cream }}
        >
          Goedemorgen, {PROFIEL.naam.split(" ")[0]}
        </h1>
        <p className="mt-2 max-w-md text-[14px] leading-relaxed" style={{ color: C.creamSoft }}>
          Je doek ligt strak. Eén motief vraagt vandaag om was — de rest is al geverfd.
        </p>
      </section>

      {/* Primaire actie — soga-doek met kawung-motief */}
      <Cloth motief accent={C.gold} className="p-0">
        <Zoom />
        <div className="flex flex-col gap-5 p-6 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0">
            <span
              className="inline-flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.2em]"
              style={{ color: C.gold }}
            >
              <AlertTriangle size={13} strokeWidth={2.4} aria-hidden="true" /> Vraagt aandacht
            </span>
            <h2
              className="mt-2 text-[23px] font-medium leading-tight sm:text-[27px]"
              style={{ ...display, color: C.cream }}
            >
              {primair.titel}
            </h2>
            <p className="mt-2 max-w-md text-[13px] leading-relaxed" style={{ color: C.creamSoft }}>
              {primair.detail}
            </p>
          </div>
          <button
            onClick={onOpen}
            className="group inline-flex shrink-0 items-center gap-2.5 rounded-full px-6 py-3 text-[13px] font-semibold transition-all hover:gap-3.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 motion-reduce:hover:gap-2.5"
            style={{ background: C.gold, color: C.indigoDeep }}
          >
            {primair.cta}
            <ArrowRight size={16} aria-hidden="true" />
          </button>
        </div>
      </Cloth>

      {/* KPI-doekjes */}
      <section>
        <Kop sub="In cijfers">Prestatie</Kop>
        <div className="mt-5 grid grid-cols-2 gap-4 lg:grid-cols-4">
          {KPIS.map((k, i) => {
            const tone = tones[i % tones.length] as string;
            return (
              <Cloth key={k.label} motief interactive className="p-4">
                <div className="flex items-start justify-between">
                  <span
                    className="h-2.5 w-2.5 rotate-45"
                    style={{ background: tone }}
                    aria-hidden="true"
                  />
                  <span
                    className="text-[11px] font-semibold tabular-nums"
                    style={{ color: k.up ? C.green : C.red }}
                  >
                    {k.up ? "▲" : "▼"} {k.trend}
                  </span>
                </div>
                <div
                  className="mt-3 text-[27px] font-medium tabular-nums leading-none tracking-[-0.01em]"
                  style={{ ...display, color: C.cream }}
                >
                  {k.value}
                </div>
                <div className="mt-1 text-[11.5px]" style={{ color: C.creamSoft }}>
                  {k.label}
                </div>
                <div className="mt-3">
                  <Spark data={k.spark} tone={tone} />
                </div>
              </Cloth>
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
          <Cloth
            interactive
            accent={C.lineStrong}
            className="flex flex-col gap-5 p-5 sm:flex-row sm:items-center"
          >
            <span
              className="relative flex h-20 w-20 shrink-0 flex-col items-center justify-center overflow-hidden rounded-lg"
              style={{ background: C.indigoSoft, color: C.gold, border: `1px solid ${C.gold}` }}
              aria-hidden="true"
            >
              <span
                className="pointer-events-none absolute inset-0"
                style={{ backgroundImage: kawung, backgroundSize: "18px 18px", opacity: 0.7 }}
              />
              <span
                className="relative text-[26px] font-medium tabular-nums leading-none"
                style={display}
              >
                {top.match}
              </span>
              <span className="relative text-[9px] font-semibold uppercase tracking-[0.16em]">
                match
              </span>
            </span>
            <div className="min-w-0 flex-1">
              <h3
                className="text-[20px] font-medium leading-tight"
                style={{ ...display, color: C.cream }}
              >
                {top.titel}
              </h3>
              <div className="mt-1 text-[12.5px]" style={{ color: C.creamSoft }}>
                {top.opdrachtgever} · {top.plaats} · {top.tarief}
              </div>
              <div className="mt-3 flex flex-wrap gap-1.5">
                {top.tags.map((t) => (
                  <Pill key={t} tone={C.creamSoft}>
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
          </Cloth>
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
        style={{ background: "rgba(236,227,208,0.12)" }}
        aria-hidden="true"
      >
        <div
          className="absolute inset-y-0 left-0 rounded-full"
          style={{ width: `${value}%`, background: C.gold }}
        />
      </div>
      <span className="text-[13px] font-semibold tabular-nums" style={{ color: C.gold }}>
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

      <Cloth className="flex items-center gap-3 px-4 py-1">
        <Search size={17} style={{ color: C.creamSoft }} aria-hidden="true" />
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Zoek op titel, plaats of opdrachtgever…"
          aria-label="Opdrachten zoeken"
          className="w-full bg-transparent py-2.5 text-[14px] outline-none placeholder:opacity-45"
          style={{ color: C.cream }}
        />
        <span
          className="shrink-0 text-[12px] font-semibold tabular-nums"
          style={{ color: C.creamSoft }}
        >
          {filtered.length}
        </span>
      </Cloth>

      {filtered.length === 0 ? (
        <Cloth motief className="flex flex-col items-center justify-center gap-3 p-14 text-center">
          <Search size={26} style={{ color: C.creamSoft }} aria-hidden="true" />
          <p className="text-[20px] font-medium" style={{ ...display, color: C.cream }}>
            Geen opdrachten gevonden
          </p>
          <p className="max-w-xs text-[13px]" style={{ color: C.creamSoft }}>
            Niets past bij “{q}”. Verruim je zoekopdracht of beschikbaarheid.
          </p>
          <button
            onClick={() => setQ("")}
            className="mt-2 inline-flex items-center gap-2 rounded-full px-4 py-2 text-[12px] font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
            style={{ background: C.gold, color: C.indigoDeep }}
          >
            Zoekopdracht wissen
          </button>
        </Cloth>
      ) : (
        <ul className="space-y-3">
          {filtered.map((o) => (
            <li key={o.id}>
              <button
                onClick={onOpen}
                className="group block w-full text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
              >
                <Cloth interactive className="flex flex-col gap-4 p-4 sm:flex-row sm:items-center">
                  <div className="min-w-0 flex-1">
                    <h3
                      className="text-[18px] font-medium leading-tight"
                      style={{ ...display, color: C.cream }}
                    >
                      {o.titel}
                    </h3>
                    <div className="mt-0.5 text-[12.5px]" style={{ color: C.creamSoft }}>
                      {o.opdrachtgever} · {o.plaats} · {o.tarief}
                    </div>
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {o.tags.map((t) => (
                        <Pill key={t} tone={C.creamSoft}>
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
                </Cloth>
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
        style={{ color: C.creamSoft }}
      >
        <ArrowRight size={14} className="rotate-180" aria-hidden="true" /> Terug naar marktplaats
      </button>

      <section>
        <div className="flex flex-wrap items-center gap-2">
          <span
            className="text-[11px] font-semibold uppercase tracking-[0.2em]"
            style={{ color: C.creamSoft }}
          >
            {opdracht.id}
          </span>
          <Pill tone={C.gold} solid>
            {opdracht.match}% match
          </Pill>
        </div>
        <h1
          className="mt-3 text-[30px] font-medium leading-[1.08] tracking-[-0.02em] sm:text-[40px]"
          style={{ ...display, color: C.cream }}
        >
          {opdracht.titel}
        </h1>
        <p className="mt-2 text-[13.5px]" style={{ color: C.creamSoft }}>
          {opdracht.opdrachtgever} · {opdracht.plaats}
        </p>
      </section>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {feiten.map((m) => (
          <Cloth key={m.l} className="p-4">
            <m.Icon size={16} style={{ color: C.gold }} aria-hidden="true" />
            <div
              className="mt-2 text-[18px] font-medium tabular-nums leading-none"
              style={{ ...display, color: C.cream }}
            >
              {m.v}
            </div>
            <div
              className="mt-1.5 text-[11px] uppercase tracking-[0.14em]"
              style={{ color: C.creamSoft }}
            >
              {m.l}
            </div>
          </Cloth>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <Cloth className="p-5" accent={C.green}>
          <div
            className="inline-flex items-center gap-2 text-[12px] font-semibold uppercase tracking-[0.16em]"
            style={{ color: C.green }}
          >
            <Check size={14} strokeWidth={2.6} aria-hidden="true" /> Wat past
          </div>
          <ul className="mt-4 space-y-3">
            {opdracht.redenen.plus.map((r) => (
              <li
                key={r}
                className="flex items-start gap-3 text-[14px] leading-snug"
                style={{ color: C.cream }}
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
        </Cloth>
        <Cloth className="p-5" accent={C.sogaLight}>
          <div
            className="inline-flex items-center gap-2 text-[12px] font-semibold uppercase tracking-[0.16em]"
            style={{ color: C.sogaLight }}
          >
            <AlertTriangle size={14} strokeWidth={2.6} aria-hidden="true" /> Aandacht
          </div>
          <ul className="mt-4 space-y-3">
            {opdracht.redenen.min.map((r) => (
              <li
                key={r}
                className="flex items-start gap-3 text-[14px] leading-snug"
                style={{ color: C.cream }}
              >
                <span
                  className="mt-1.5 h-1.5 w-1.5 shrink-0 rotate-45"
                  style={{ background: C.sogaLight }}
                  aria-hidden="true"
                />
                {r}
              </li>
            ))}
          </ul>
        </Cloth>
      </div>

      <div className="flex flex-col items-stretch gap-3 pt-1 sm:flex-row">
        <button
          className="group inline-flex flex-1 items-center justify-center gap-2.5 rounded-full px-7 py-3.5 text-[14px] font-semibold transition-all hover:gap-3.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 motion-reduce:hover:gap-2.5"
          style={{ background: C.gold, color: C.indigoDeep }}
        >
          Reageer op opdracht <ArrowRight size={16} aria-hidden="true" />
        </button>
        <button
          className="inline-flex items-center justify-center gap-2 rounded-full px-6 py-3.5 text-[14px] font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
          style={{
            border: `1px solid ${C.lineStrong}`,
            color: C.cream,
            background: "rgba(236,227,208,0.05)",
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
  return (
    <div className="space-y-7">
      <Kop sub="Vertrouwen">Verificatie</Kop>

      {/* Batik-keurmerk: cirkelvormige voortgang met kawung-hart */}
      <Cloth motief accent={C.gold} className="flex flex-col items-center gap-6 p-6 sm:flex-row">
        <div className="relative h-24 w-24 shrink-0" aria-hidden="true">
          <svg viewBox="0 0 36 36" className="h-full w-full -rotate-90">
            <circle
              cx="18"
              cy="18"
              r="15.5"
              fill="none"
              stroke="rgba(236,227,208,0.18)"
              strokeWidth="3"
            />
            <circle
              cx="18"
              cy="18"
              r="15.5"
              fill="none"
              stroke={C.gold}
              strokeWidth="3"
              strokeLinecap="round"
              strokeDasharray={`${(pct / 100) * 97.4} 97.4`}
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span
              className="text-[24px] font-medium tabular-nums leading-none"
              style={{ ...display, color: C.cream }}
            >
              {pct}%
            </span>
            <span
              className="text-[9px] font-semibold uppercase tracking-[0.18em]"
              style={{ color: C.creamSoft }}
            >
              gedekt
            </span>
          </div>
        </div>
        <div className="text-center sm:text-left">
          <span
            className="inline-flex items-center gap-2 rounded-full px-3 py-1 text-[12px] font-semibold"
            style={{ background: "rgba(236,227,208,0.08)", color: C.green }}
          >
            <ShieldCheck size={15} strokeWidth={2.2} aria-hidden="true" /> {PROFIEL.trust}
          </span>
          <p className="mt-3 max-w-md text-[14px] leading-relaxed" style={{ color: C.creamSoft }}>
            {verified} van {CREDENTIALS.length} credentials volledig geverifieerd. Eén dossier
            vraagt binnenkort actie — vernieuw op tijd om verifieerbaar te blijven.
          </p>
        </div>
      </Cloth>

      <ul className="space-y-3">
        {CREDENTIALS.map((c) => {
          const st = statusMeta(c.status);
          return (
            <li key={c.naam}>
              <Cloth className="flex items-center gap-4 p-4">
                <span
                  className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg"
                  style={{
                    background: "rgba(236,227,208,0.06)",
                    border: `1px solid ${st.tone}`,
                    color: st.tone,
                  }}
                  aria-hidden="true"
                >
                  <st.Icon size={18} strokeWidth={2.4} />
                </span>
                <div className="min-w-0 flex-1">
                  <div
                    className="text-[15px] font-medium leading-tight"
                    style={{ ...display, color: C.cream }}
                  >
                    {c.naam}
                  </div>
                  <div className="mt-0.5 text-[12px]" style={{ color: C.creamSoft }}>
                    {c.detail}
                  </div>
                </div>
                <Pill tone={st.tone}>
                  <st.Icon size={12} strokeWidth={2.6} aria-hidden="true" />
                  <span className="hidden sm:inline">{st.label}</span>
                </Pill>
              </Cloth>
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
          const tone = warn ? C.sogaLight : C.gold;
          return (
            <li key={a.titel}>
              <Cloth
                className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center"
                accent={warn ? C.sogaLight : C.line}
              >
                <span
                  className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg text-[16px] font-medium tabular-nums"
                  style={{
                    background: "rgba(236,227,208,0.06)",
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
                        strokeWidth={2.4}
                        style={{ color: tone }}
                        aria-hidden="true"
                      />
                    ) : (
                      <Sparkles
                        size={14}
                        strokeWidth={2.4}
                        style={{ color: tone }}
                        aria-hidden="true"
                      />
                    )}
                    <h3
                      className="text-[17px] font-medium leading-tight"
                      style={{ ...display, color: C.cream }}
                    >
                      {a.titel}
                    </h3>
                    <span className="sr-only">{warn ? "Urgent" : "Informatief"}</span>
                  </div>
                  <p className="mt-1.5 text-[13px] leading-relaxed" style={{ color: C.creamSoft }}>
                    {a.detail}
                  </p>
                </div>
                <button
                  className="shrink-0 self-start rounded-full px-5 py-2.5 text-[12.5px] font-semibold transition-transform hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 motion-reduce:hover:translate-y-0 sm:self-center"
                  style={{ background: tone, color: C.indigoDeep }}
                >
                  {a.cta}
                </button>
              </Cloth>
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
    if (status === "Openstaand") return C.sogaLight;
    if (status === "Concept") return C.creamSoft;
    return C.gold;
  };
  return (
    <div className="space-y-7">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <Kop sub="Omzet">Facturen</Kop>
        <button
          className="inline-flex items-center gap-2 rounded-full px-4 py-2.5 text-[12.5px] font-semibold transition-all hover:gap-3 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 motion-reduce:hover:gap-2"
          style={{ background: C.gold, color: C.indigoDeep }}
        >
          <Plus size={15} aria-hidden="true" /> Nieuwe factuur
        </button>
      </div>

      <Cloth className="overflow-x-auto">
        <table className="w-full min-w-[560px] border-collapse text-left">
          <thead>
            <tr style={{ borderBottom: `1px solid ${C.lineStrong}` }}>
              {["Nummer", "Klant", "Datum", "Status", "Bedrag"].map((h, i) => (
                <th
                  key={h}
                  className={`px-4 py-3 text-[11px] font-semibold uppercase tracking-[0.14em] ${i === 4 ? "text-right" : ""}`}
                  style={{ color: C.creamSoft }}
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
                    style={{ color: C.creamSoft }}
                  >
                    {f.nr}
                  </td>
                  <td className="px-4 py-3.5 text-[14px]" style={{ color: C.cream }}>
                    {f.klant}
                  </td>
                  <td
                    className="px-4 py-3.5 text-[12.5px] tabular-nums"
                    style={{ color: C.creamSoft }}
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
                    style={{ ...display, color: C.cream }}
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
                className="px-4 py-4 text-[11px] font-semibold uppercase tracking-[0.16em]"
                style={{ color: C.creamSoft }}
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
      </Cloth>
    </div>
  );
}
