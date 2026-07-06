"use client";

// Concept 128 — "Spectraal" · audio-golfvorm & equalizer (digitale audio-workstation).
// Donkere DAW-esthetiek op bijna-zwart (#0b0d10): golfvormen (waveform-balken),
// spectraal-analyzer-kolommen, EQ-banden, scrubber/tijdlijn-details en VU-meter-gloed.
// Cijfers en status verschijnen als niveau-meters. Magenta-piek (#ff4d94) is het primaire
// accent; cyaan-groen (#40c9a2) draagt het spectrum. Wit-grijs (#e6e9ee) is de leestekst.
// ONDERSCHEIDEND van Montage (video-editor tracks), Groef (vinyl/album-warmte) en
// Seismograaf (trillings-meettrommel): dit is DIGITALE AUDIO — waveform + spectrum + EQ.
// Fonts: Geist (display) + Geist Mono (tabular cijfers/labels).

import { useState } from "react";
import {
  ArrowRight,
  Check,
  Clock,
  AlertTriangle,
  XCircle,
  Search,
  AudioWaveform,
  ShieldCheck,
  Plus,
  MapPin,
  Coins,
  CalendarDays,
  SlidersHorizontal,
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

// Donker DAW-palet: bijna-zwart paneel, magenta-piek, cyaan-groen spectrum.
const C = {
  bg: "#0b0d10", // console-zwart
  bgDeep: "#07080a", // diepste rail
  panel: "#12151b", // module-oppervlak
  panelSoft: "#171b23", // opgelicht module-vlak
  fg: "#e6e9ee", // leestekst
  fgSoft: "#8b93a3", // secundaire tekst
  fgDim: "#5b626f", // rasterlabels
  magenta: "#ff4d94", // piek-accent
  magentaGlow: "rgba(255,77,148,0.4)",
  cyan: "#40c9a2", // spectrum secundair
  cyanGlow: "rgba(64,201,162,0.35)",
  amber: "#f4b860", // aandacht / clip-waarschuwing
  redUse: "#f0655a", // afwijzing
  line: "rgba(230,233,238,0.08)",
  lineStrong: "rgba(230,233,238,0.16)",
};

const display = { fontFamily: "var(--font-lab-geist)" };
const mono = { fontFamily: "var(--font-lab-geist-mono)" };

// Deterministische pseudo-waardes voor waveform/spectrum (geen random — SSR-stabiel).
function seededBars(count: number, seed: number, min = 0.18): number[] {
  const out: number[] = [];
  for (let i = 0; i < count; i++) {
    const s = Math.sin((i + 1) * 12.9898 + seed * 78.233) * 43758.5453;
    const frac = s - Math.floor(s);
    // Symmetrisch envelope zodat het op een golfvorm lijkt.
    const env = 0.55 + 0.45 * Math.sin((i / count) * Math.PI);
    out.push(min + frac * env * (1 - min));
  }
  return out;
}

// Golfvorm-strip: gespiegelde verticale balken rond een middellijn.
function Waveform({
  seed = 3,
  bars = 64,
  tone = C.cyan,
  peakTone = C.magenta,
  height = 48,
  progress = 0.42,
}: {
  seed?: number;
  bars?: number;
  tone?: string;
  peakTone?: string;
  height?: number;
  progress?: number;
}) {
  const data = seededBars(bars, seed);
  return (
    <div
      className="flex w-full items-center gap-[2px]"
      style={{ height }}
      role="img"
      aria-label="Golfvorm"
    >
      {data.map((v, i) => {
        const played = i / bars <= progress;
        const isPeak = v > 0.82;
        return (
          <span
            key={i}
            className="min-w-[2px] flex-1 rounded-full"
            style={{
              height: `${Math.round(v * 100)}%`,
              background: played ? (isPeak ? peakTone : tone) : C.fgDim,
              opacity: played ? 1 : 0.35,
              boxShadow: played && isPeak ? `0 0 6px ${peakTone}` : "none",
            }}
          />
        );
      })}
    </div>
  );
}

// Spectraal-analyzer: staande kolommen met piek-cap.
function Spectrum({ seed, tone, height = 44 }: { seed: number; tone: string; height?: number }) {
  const data = seededBars(22, seed, 0.12);
  return (
    <div className="flex w-full items-end gap-[2px]" style={{ height }} aria-hidden="true">
      {data.map((v, i) => (
        <span
          key={i}
          className="min-w-[2px] flex-1 rounded-[1px]"
          style={{
            height: `${Math.round(v * 100)}%`,
            background: `linear-gradient(to top, ${tone}22, ${tone})`,
          }}
        />
      ))}
    </div>
  );
}

function statusMeta(s: CredStatus): {
  label: string;
  Icon: LucideIcon;
  tone: string;
} {
  switch (s) {
    case "VERIFIED":
      return { label: "Geverifieerd", Icon: Check, tone: C.cyan };
    case "SUBMITTED":
      return { label: "In beoordeling", Icon: Clock, tone: C.amber };
    case "EXPIRING":
      return { label: "Verloopt binnenkort", Icon: AlertTriangle, tone: C.magenta };
    case "REJECTED":
      return { label: "Afgewezen", Icon: XCircle, tone: C.redUse };
  }
}

// DAW-module: donker paneel met dunne rail-rand en inzet-schaduw.
function Module({
  children,
  className = "",
  accent = C.line,
  interactive = false,
}: {
  children: React.ReactNode;
  className?: string;
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
        boxShadow: "inset 0 1px 0 rgba(230,233,238,0.05), 0 10px 26px -18px rgba(0,0,0,0.9)",
      }}
    >
      {children}
    </div>
  );
}

// Magenta-piek rail-strip (bovenrand van een geaccentueerde module).
function PeakRail() {
  return (
    <span
      aria-hidden="true"
      className="block h-[2px] w-full"
      style={{
        backgroundImage: `linear-gradient(90deg, ${C.magenta}, ${C.cyan})`,
        boxShadow: `0 0 8px ${C.magentaGlow}`,
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
          ? { ...mono, background: tone, color: C.bgDeep }
          : {
              ...mono,
              background: "rgba(230,233,238,0.05)",
              color: tone,
              border: `1px solid ${tone}`,
            }
      }
    >
      {children}
    </span>
  );
}

// VU-meter: horizontale niveau-balk met piek-gloed.
function VuMeter({ value, tone }: { value: number; tone: string }) {
  const segs = 20;
  const on = Math.round((value / 100) * segs);
  return (
    <div className="flex items-center gap-2">
      <div className="flex items-center gap-[2px]" aria-hidden="true">
        {Array.from({ length: segs }, (_, i) => {
          const lit = i < on;
          const clip = i >= segs - 3;
          const segTone = clip ? C.magenta : tone;
          return (
            <span
              key={i}
              className="h-3 w-[3px] rounded-[1px]"
              style={{
                background: lit ? segTone : C.fgDim,
                opacity: lit ? 1 : 0.3,
                boxShadow: lit && clip ? `0 0 5px ${C.magentaGlow}` : "none",
              }}
            />
          );
        })}
      </div>
      <span className="text-[13px] font-semibold tabular-nums" style={{ ...mono, color: tone }}>
        {value}%
      </span>
    </div>
  );
}

function Kop({ children, sub }: { children: React.ReactNode; sub?: string }) {
  return (
    <div>
      {sub && (
        <div
          className="mb-1.5 text-[11px] font-semibold uppercase tracking-[0.26em]"
          style={{ ...mono, color: C.magenta }}
        >
          {sub}
        </div>
      )}
      <div className="flex items-center gap-3">
        <h2
          className="text-[26px] font-semibold leading-none tracking-[-0.02em] sm:text-[32px]"
          style={{ ...display, color: C.fg }}
        >
          {children}
        </h2>
        <span
          className="h-[10px] flex-1 opacity-60"
          aria-hidden="true"
          style={{
            backgroundImage: `repeating-linear-gradient(90deg, ${C.fgDim} 0 1px, transparent 1px 6px)`,
          }}
        />
      </div>
    </div>
  );
}

export function Concept128() {
  const [screen, setScreen] = useState<ScreenKey>("dashboard");
  const active = OPDRACHTEN[0] as Opdracht;

  return (
    <div
      className="min-h-[680px] w-full antialiased"
      style={{
        ...display,
        background: C.bg,
        backgroundImage: `radial-gradient(120% 80% at 50% -10%, rgba(255,77,148,0.05), transparent 60%), radial-gradient(100% 60% at 100% 100%, rgba(64,201,162,0.04), transparent 60%)`,
        color: C.fg,
      }}
    >
      {/* Kop — transport-mark met golfvorm */}
      <header className="mx-auto flex max-w-5xl items-center justify-between px-5 pt-8 md:px-10">
        <div className="flex items-center gap-3.5">
          <span
            className="relative flex h-11 w-11 items-center justify-center overflow-hidden rounded-md"
            style={{
              background: C.panelSoft,
              color: C.magenta,
              border: `1px solid ${C.lineStrong}`,
            }}
            aria-hidden="true"
          >
            <AudioWaveform size={20} strokeWidth={2} />
          </span>
          <div className="leading-none">
            <div
              className="text-[20px] font-semibold tracking-[-0.02em]"
              style={{ ...display, color: C.fg }}
            >
              Spectraal
            </div>
            <div
              className="mt-1 text-[10px] uppercase tracking-[0.26em]"
              style={{ ...mono, color: C.fgSoft }}
            >
              ZZP · Platform
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
            className="flex h-11 w-11 items-center justify-center rounded-md text-[13px] font-semibold"
            style={{
              ...mono,
              background: C.panelSoft,
              color: C.cyan,
              border: `1px solid ${C.lineStrong}`,
            }}
            aria-hidden="true"
          >
            {PROFIEL.initialen}
          </span>
        </div>
      </header>

      {/* Navigatie — transport-tabs met magenta-piek onder actief */}
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
              style={{ ...mono, color: on ? C.fg : C.fgSoft, fontWeight: on ? 600 : 500 }}
            >
              {s.label}
              {on && (
                <span
                  className="absolute -bottom-[17px] left-2 right-2 h-[2px] rounded-full"
                  style={{ background: C.magenta, boxShadow: `0 0 8px ${C.magentaGlow}` }}
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
  const tones = [C.magenta, C.cyan, C.cyan, C.amber];
  return (
    <div className="space-y-10">
      <section>
        <div
          className="text-[11px] font-semibold uppercase tracking-[0.26em]"
          style={{ ...mono, color: C.magenta }}
        >
          Vandaag · {PROFIEL.plaats}
        </div>
        <h1
          className="mt-2 text-[32px] font-semibold leading-[1.06] tracking-[-0.03em] sm:text-[42px]"
          style={{ ...display, color: C.fg }}
        >
          Goedemorgen, {PROFIEL.naam.split(" ")[0]}
        </h1>
        <p className="mt-2 max-w-md text-[14px] leading-relaxed" style={{ color: C.fgSoft }}>
          Je mix zit strak in de meter. Eén band piekt in het rood — corrigeer die eerst.
        </p>
      </section>

      {/* Primaire actie — geaccentueerde module met golfvorm-achtergrond */}
      <Module accent={C.magenta} className="p-0">
        <PeakRail />
        <div className="relative">
          <div className="pointer-events-none absolute inset-0 flex items-end px-6 pb-3 opacity-30">
            <Waveform
              seed={7}
              bars={80}
              tone={C.magenta}
              peakTone={C.magenta}
              height={40}
              progress={0.6}
            />
          </div>
          <div className="relative flex flex-col gap-5 p-6 sm:flex-row sm:items-center sm:justify-between">
            <div className="min-w-0">
              <span
                className="inline-flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.2em]"
                style={{ ...mono, color: C.amber }}
              >
                <AlertTriangle size={13} strokeWidth={2.4} aria-hidden="true" /> Clip · vraagt
                aandacht
              </span>
              <h2
                className="mt-2 text-[23px] font-semibold leading-tight sm:text-[27px]"
                style={{ ...display, color: C.fg }}
              >
                {primair.titel}
              </h2>
              <p className="mt-2 max-w-md text-[13px] leading-relaxed" style={{ color: C.fgSoft }}>
                {primair.detail}
              </p>
            </div>
            <button
              onClick={onOpen}
              className="group inline-flex shrink-0 items-center gap-2.5 rounded-full px-6 py-3 text-[13px] font-semibold transition-all hover:gap-3.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 motion-reduce:hover:gap-2.5"
              style={{ ...mono, background: C.magenta, color: C.bgDeep }}
            >
              {primair.cta}
              <ArrowRight size={16} aria-hidden="true" />
            </button>
          </div>
        </div>
      </Module>

      {/* KPI-modules met spectraal-analyzer */}
      <section>
        <Kop sub="Niveaus">Prestatie</Kop>
        <div className="mt-5 grid grid-cols-2 gap-4 lg:grid-cols-4">
          {KPIS.map((k, i) => {
            const tone = tones[i % tones.length] as string;
            return (
              <Module key={k.label} interactive className="p-4">
                <div className="flex items-start justify-between">
                  <span
                    className="h-2 w-2 rounded-full"
                    style={{ background: tone, boxShadow: `0 0 8px ${tone}` }}
                    aria-hidden="true"
                  />
                  <span
                    className="text-[11px] font-semibold tabular-nums"
                    style={{ ...mono, color: k.up ? C.cyan : C.amber }}
                  >
                    {k.up ? "▲" : "▼"} {k.trend}
                  </span>
                </div>
                <div
                  className="mt-3 text-[27px] font-semibold tabular-nums leading-none tracking-[-0.02em]"
                  style={{ ...display, color: C.fg }}
                >
                  {k.value}
                </div>
                <div className="mt-1 text-[11.5px]" style={{ color: C.fgSoft }}>
                  {k.label}
                </div>
                <div className="mt-3">
                  <Spectrum seed={i + 1} tone={tone} />
                </div>
              </Module>
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
          <Module
            interactive
            accent={C.lineStrong}
            className="flex flex-col gap-5 p-5 sm:flex-row sm:items-center"
          >
            <span
              className="relative flex h-20 w-20 shrink-0 flex-col items-center justify-center overflow-hidden rounded-md"
              style={{
                background: C.panelSoft,
                color: C.magenta,
                border: `1px solid ${C.magenta}`,
              }}
              aria-hidden="true"
            >
              <span
                className="relative text-[26px] font-semibold tabular-nums leading-none"
                style={mono}
              >
                {top.match}
              </span>
              <span
                className="relative text-[9px] font-semibold uppercase tracking-[0.16em]"
                style={mono}
              >
                match
              </span>
            </span>
            <div className="min-w-0 flex-1">
              <h3
                className="text-[20px] font-semibold leading-tight"
                style={{ ...display, color: C.fg }}
              >
                {top.titel}
              </h3>
              <div className="mt-1 text-[12.5px]" style={{ color: C.fgSoft }}>
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
              style={{ color: C.magenta }}
              aria-hidden="true"
            />
          </Module>
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
    <div className="space-y-7">
      <Kop sub="Open opdrachten">Marktplaats</Kop>

      <Module className="flex items-center gap-3 px-4 py-1">
        <Search size={17} style={{ color: C.fgSoft }} aria-hidden="true" />
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Zoek op titel, plaats of opdrachtgever…"
          aria-label="Opdrachten zoeken"
          className="w-full bg-transparent py-2.5 text-[14px] outline-none placeholder:opacity-45"
          style={{ color: C.fg }}
        />
        <span
          className="shrink-0 text-[12px] font-semibold tabular-nums"
          style={{ ...mono, color: C.fgSoft }}
        >
          {filtered.length}
        </span>
      </Module>

      {filtered.length === 0 ? (
        <Module className="flex flex-col items-center justify-center gap-3 p-14 text-center">
          <div className="w-40 opacity-40">
            <Waveform
              seed={11}
              bars={40}
              tone={C.fgDim}
              peakTone={C.fgDim}
              height={36}
              progress={0}
            />
          </div>
          <p className="text-[20px] font-semibold" style={{ ...display, color: C.fg }}>
            Geen opdrachten gevonden
          </p>
          <p className="max-w-xs text-[13px]" style={{ color: C.fgSoft }}>
            Stilte op dit spoor. Niets past bij “{q}” — verruim je zoekopdracht of beschikbaarheid.
          </p>
          <button
            onClick={() => setQ("")}
            className="mt-2 inline-flex items-center gap-2 rounded-full px-4 py-2 text-[12px] font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
            style={{ ...mono, background: C.magenta, color: C.bgDeep }}
          >
            Zoekopdracht wissen
          </button>
        </Module>
      ) : (
        <ul className="space-y-3">
          {filtered.map((o, idx) => (
            <li key={o.id}>
              <button
                onClick={onOpen}
                className="group block w-full text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
              >
                <Module interactive className="p-4">
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
                    <div className="min-w-0 flex-1">
                      <h3
                        className="text-[18px] font-semibold leading-tight"
                        style={{ ...display, color: C.fg }}
                      >
                        {o.titel}
                      </h3>
                      <div className="mt-0.5 text-[12.5px]" style={{ color: C.fgSoft }}>
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
                      <VuMeter value={o.match} tone={C.magenta} />
                      <ArrowRight
                        size={19}
                        className="shrink-0 transition-transform group-hover:translate-x-1 motion-reduce:group-hover:translate-x-0"
                        style={{ color: C.magenta }}
                        aria-hidden="true"
                      />
                    </div>
                  </div>
                  {/* Golfvorm-tijdlijn per opdracht */}
                  <div className="mt-3 opacity-60">
                    <Waveform
                      seed={idx + 2}
                      bars={72}
                      tone={C.cyan}
                      peakTone={C.magenta}
                      height={24}
                      progress={o.match / 100}
                    />
                  </div>
                </Module>
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
        style={{ color: C.fgSoft }}
      >
        <ArrowRight size={14} className="rotate-180" aria-hidden="true" /> Terug naar marktplaats
      </button>

      <section>
        <div className="flex flex-wrap items-center gap-2">
          <span
            className="text-[11px] font-semibold uppercase tracking-[0.2em]"
            style={{ ...mono, color: C.fgSoft }}
          >
            {opdracht.id}
          </span>
          <Pill tone={C.magenta} solid>
            {opdracht.match}% match
          </Pill>
        </div>
        <h1
          className="mt-3 text-[30px] font-semibold leading-[1.08] tracking-[-0.03em] sm:text-[40px]"
          style={{ ...display, color: C.fg }}
        >
          {opdracht.titel}
        </h1>
        <p className="mt-2 text-[13.5px]" style={{ color: C.fgSoft }}>
          {opdracht.opdrachtgever} · {opdracht.plaats}
        </p>
      </section>

      {/* Scrubber / tijdlijn met golfvorm */}
      <Module className="p-4">
        <div className="mb-2 flex items-center justify-between text-[10px] uppercase tracking-[0.2em]">
          <span style={{ ...mono, color: C.fgSoft }}>00:00</span>
          <span style={{ ...mono, color: C.magenta }}>match {opdracht.match}%</span>
          <span style={{ ...mono, color: C.fgSoft }}>04:12</span>
        </div>
        <Waveform
          seed={5}
          bars={96}
          tone={C.cyan}
          peakTone={C.magenta}
          height={52}
          progress={opdracht.match / 100}
        />
      </Module>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {feiten.map((m) => (
          <Module key={m.l} className="p-4">
            <m.Icon size={16} style={{ color: C.cyan }} aria-hidden="true" />
            <div
              className="mt-2 text-[18px] font-semibold tabular-nums leading-none"
              style={{ ...display, color: C.fg }}
            >
              {m.v}
            </div>
            <div
              className="mt-1.5 text-[11px] uppercase tracking-[0.14em]"
              style={{ ...mono, color: C.fgSoft }}
            >
              {m.l}
            </div>
          </Module>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <Module className="p-5" accent={C.cyan}>
          <div
            className="inline-flex items-center gap-2 text-[12px] font-semibold uppercase tracking-[0.16em]"
            style={{ color: C.cyan }}
          >
            <Check size={14} strokeWidth={2.6} aria-hidden="true" /> Wat past
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
                  strokeWidth={2.4}
                  className="mt-0.5 shrink-0"
                  style={{ color: C.cyan }}
                  aria-hidden="true"
                />
                {r}
              </li>
            ))}
          </ul>
        </Module>
        <Module className="p-5" accent={C.amber}>
          <div
            className="inline-flex items-center gap-2 text-[12px] font-semibold uppercase tracking-[0.16em]"
            style={{ color: C.amber }}
          >
            <AlertTriangle size={14} strokeWidth={2.6} aria-hidden="true" /> Aandacht
          </div>
          <ul className="mt-4 space-y-3">
            {opdracht.redenen.min.map((r) => (
              <li
                key={r}
                className="flex items-start gap-3 text-[14px] leading-snug"
                style={{ color: C.fg }}
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
        </Module>
      </div>

      <div className="flex flex-col items-stretch gap-3 pt-1 sm:flex-row">
        <button
          className="group inline-flex flex-1 items-center justify-center gap-2.5 rounded-full px-7 py-3.5 text-[14px] font-semibold transition-all hover:gap-3.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 motion-reduce:hover:gap-2.5"
          style={{ ...mono, background: C.magenta, color: C.bgDeep }}
        >
          Reageer op opdracht <ArrowRight size={16} aria-hidden="true" />
        </button>
        <button
          className="inline-flex items-center justify-center gap-2 rounded-full px-6 py-3.5 text-[14px] font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
          style={{
            ...mono,
            border: `1px solid ${C.lineStrong}`,
            color: C.fg,
            background: "rgba(230,233,238,0.04)",
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

      {/* Master-meter: verticale EQ-fader + niveau */}
      <Module accent={C.magenta} className="flex flex-col items-center gap-6 p-6 sm:flex-row">
        <div className="flex shrink-0 items-end gap-2" aria-hidden="true">
          {[68, 82, pct, 74, 90].map((v, i) => (
            <div
              key={i}
              className="relative flex h-24 w-[6px] items-end overflow-hidden rounded-full"
              style={{ background: "rgba(230,233,238,0.1)" }}
            >
              <span
                className="w-full rounded-full"
                style={{
                  height: `${v}%`,
                  background:
                    i === 2
                      ? `linear-gradient(to top, ${C.magenta}, ${C.cyan})`
                      : `linear-gradient(to top, ${C.cyan}44, ${C.cyan})`,
                  boxShadow: i === 2 ? `0 0 8px ${C.magentaGlow}` : "none",
                }}
              />
            </div>
          ))}
        </div>
        <div className="text-center sm:text-left">
          <div className="flex items-baseline gap-2">
            <span
              className="text-[40px] font-semibold tabular-nums leading-none"
              style={{ ...display, color: C.fg }}
            >
              {pct}%
            </span>
            <span
              className="text-[11px] font-semibold uppercase tracking-[0.18em]"
              style={{ ...mono, color: C.fgSoft }}
            >
              in de meter
            </span>
          </div>
          <span
            className="mt-3 inline-flex items-center gap-2 rounded-full px-3 py-1 text-[12px] font-semibold"
            style={{ background: "rgba(230,233,238,0.06)", color: C.cyan }}
          >
            <ShieldCheck size={15} strokeWidth={2.2} aria-hidden="true" /> {PROFIEL.trust}
          </span>
          <p className="mt-3 max-w-md text-[14px] leading-relaxed" style={{ color: C.fgSoft }}>
            {verified} van {CREDENTIALS.length} credentials staan op niveau en zijn geverifieerd.
            Eén band zakt weg — vernieuw op tijd om verifieerbaar te blijven.
          </p>
        </div>
      </Module>

      <ul className="space-y-3">
        {CREDENTIALS.map((c) => {
          const st = statusMeta(c.status);
          return (
            <li key={c.naam}>
              <Module className="flex items-center gap-4 p-4">
                <span
                  className="flex h-11 w-11 shrink-0 items-center justify-center rounded-md"
                  style={{
                    background: "rgba(230,233,238,0.05)",
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
                    style={{ ...display, color: C.fg }}
                  >
                    {c.naam}
                  </div>
                  <div className="mt-0.5 text-[12px]" style={{ color: C.fgSoft }}>
                    {c.detail}
                  </div>
                </div>
                <Pill tone={st.tone}>
                  <st.Icon size={12} strokeWidth={2.6} aria-hidden="true" />
                  <span className="hidden sm:inline">{st.label}</span>
                </Pill>
              </Module>
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
          const tone = warn ? C.amber : C.magenta;
          return (
            <li key={a.titel}>
              <Module
                className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center"
                accent={warn ? C.amber : C.line}
              >
                <span
                  className="flex h-11 w-11 shrink-0 items-center justify-center rounded-md text-[16px] font-semibold tabular-nums"
                  style={{
                    ...mono,
                    background: "rgba(230,233,238,0.05)",
                    color: tone,
                    border: `1px solid ${tone}`,
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
                        strokeWidth={2.4}
                        style={{ color: tone }}
                        aria-hidden="true"
                      />
                    ) : (
                      <SlidersHorizontal
                        size={14}
                        strokeWidth={2.4}
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
                  className="shrink-0 self-start rounded-full px-5 py-2.5 text-[12.5px] font-semibold transition-transform hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 motion-reduce:hover:translate-y-0 sm:self-center"
                  style={{ ...mono, background: tone, color: C.bgDeep }}
                >
                  {a.cta}
                </button>
              </Module>
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
    if (status === "Betaald") return C.cyan;
    if (status === "Openstaand") return C.amber;
    if (status === "Concept") return C.fgSoft;
    return C.magenta;
  };
  return (
    <div className="space-y-7">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <Kop sub="Omzet">Facturen</Kop>
        <button
          className="inline-flex items-center gap-2 rounded-full px-4 py-2.5 text-[12.5px] font-semibold transition-all hover:gap-3 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 motion-reduce:hover:gap-2"
          style={{ ...mono, background: C.magenta, color: C.bgDeep }}
        >
          <Plus size={15} aria-hidden="true" /> Nieuwe factuur
        </button>
      </div>

      <Module className="overflow-x-auto">
        <table className="w-full min-w-[560px] border-collapse text-left">
          <thead>
            <tr style={{ borderBottom: `1px solid ${C.lineStrong}` }}>
              {["Nummer", "Klant", "Datum", "Status", "Bedrag"].map((h, i) => (
                <th
                  key={h}
                  className={`px-4 py-3 text-[11px] font-semibold uppercase tracking-[0.14em] ${i === 4 ? "text-right" : ""}`}
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
                  <td className="px-4 py-3.5 text-[14px]" style={{ color: C.fg }}>
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
                    className="px-4 py-3.5 text-right text-[15px] font-semibold tabular-nums"
                    style={{ ...mono, color: C.fg }}
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
                style={{ ...mono, color: C.fgSoft }}
              >
                Totaal betaald
              </td>
              <td
                className="px-4 py-4 text-right text-[19px] font-semibold tabular-nums"
                style={{ ...mono, color: C.cyan }}
              >
                {total}
              </td>
            </tr>
          </tfoot>
        </table>
      </Module>
    </div>
  );
}
