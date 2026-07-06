"use client";

// Concept 111 — "Gebrandschilderd" · Kathedraalglas met loodlijnen & juweel-licht.
// Diepe donkere steen-achtergrond waar juweelkleurig glas doorheen gloeit: kobalt, robijn,
// smaragd, amber — gescheiden door dunne near-black LOODLIJNEN (came) met lichte bevel.
// Panelen als glas-in-lood segmenten met een subtiele radiale gloed erachter (alsof licht
// er doorheen valt). Koppen in klassiek serif-display. Verificatie-badges als kleine
// gebrandschilderde medaillons. Sacraal, tijdloos, vertrouwenwekkend. Onderscheidend van
// glasmorfisme (transparant/blur) en Delfts-blauw (figuratieve tegel): dit is JUWEELKLEURIG
// LICHT achter LOODOMLIJNDE vlakken op donker. Dark concept.
// Fonts: Newsreader (display serif) + Inter (UI).

import { useState } from "react";
import {
  ArrowRight,
  Check,
  Clock,
  AlertTriangle,
  XCircle,
  Search,
  Gem,
  ShieldCheck,
  Plus,
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

// Juweelkleurig glas + near-black lood op donkere steen.
const C = {
  stone: "#15130f", // donkere steen-achtergrond
  stoneDeep: "#100e0a",
  glass: "#1c1a15", // glasvlak-basis (donker)
  glassLit: "#231f18", // iets opgelicht glas
  came: "#050403", // loodlijn (near-black)
  cameHi: "rgba(255,246,224,0.14)", // bevel-highlight op lood
  cobalt: "#1e4b8f", // kobalt
  cobaltLit: "#3d78c9",
  ruby: "#9e2b3a", // robijn
  rubyLit: "#d8546a",
  emerald: "#1f6b4e", // smaragd
  emeraldLit: "#3fa878",
  amber: "#c98a1e", // amber
  amberLit: "#e8b551",
  ivory: "#efe4cf", // warm ivoor tekst
  ivorySoft: "#c9bda3",
  muted: "#8f8267",
};

const serif = { fontFamily: "var(--font-lab-newsreader)" };
const ui = { fontFamily: "var(--font-lab-inter)" };

// Steen-oppervlak met verre juweel-gloed alsof licht van buiten door het glas dringt.
const stoneSurface =
  "radial-gradient(90% 60% at 15% -5%, rgba(30,75,143,0.16), transparent 60%)," +
  "radial-gradient(80% 55% at 85% 0%, rgba(158,43,58,0.13), transparent 60%)," +
  "radial-gradient(90% 70% at 50% 108%, rgba(201,138,30,0.10), transparent 62%)";

// Loodomlijning: dikke near-black rand met fijne ivoor-bevel binnenin (glas-in-lood came).
function came(tone: string) {
  return {
    border: `2px solid ${C.came}`,
    boxShadow: `inset 0 0 0 1px ${C.cameHi}, inset 0 0 22px ${tone}22, 0 4px 18px rgba(0,0,0,0.5)`,
  };
}

// Radiale glas-gloed achter een paneel (licht dat door de kleur schijnt).
function glow(tone: string) {
  return `radial-gradient(120% 100% at 30% 0%, ${tone}30, transparent 62%), ${C.glass}`;
}

function statusMeta(s: CredStatus): { label: string; Icon: LucideIcon; tone: string } {
  switch (s) {
    case "VERIFIED":
      return { label: "Geverifieerd", Icon: Check, tone: C.emeraldLit };
    case "SUBMITTED":
      return { label: "In beoordeling", Icon: Clock, tone: C.amberLit };
    case "EXPIRING":
      return { label: "Verloopt binnenkort", Icon: AlertTriangle, tone: C.amberLit };
    case "REJECTED":
      return { label: "Afgewezen", Icon: XCircle, tone: C.rubyLit };
  }
}

// Serif-display sectiekop met dun loodlijn-ornament.
function Kop({ children, sub }: { children: React.ReactNode; sub?: string }) {
  return (
    <div>
      {sub && (
        <div
          className="mb-2 text-[11px] uppercase tracking-[0.32em]"
          style={{ ...ui, color: C.amberLit }}
        >
          {sub}
        </div>
      )}
      <h2
        className="text-[30px] font-medium leading-none tracking-[0.01em] sm:text-[38px]"
        style={{ ...serif, color: C.ivory }}
      >
        {children}
      </h2>
      <div className="mt-3 flex items-center gap-2" aria-hidden="true">
        <span className="h-[3px] w-10" style={{ background: C.came }} />
        <span
          className="h-2 w-2 rotate-45"
          style={{ background: C.amber, outline: `1px solid ${C.came}` }}
        />
        <span className="h-[3px] flex-1" style={{ background: C.came, opacity: 0.5 }} />
      </div>
    </div>
  );
}

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
      <polyline
        points={pts}
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

// Glas-in-lood segment: gloeiend glasvlak binnen loodrand.
function Segment({
  children,
  className = "",
  tone = C.cobalt,
}: {
  children: React.ReactNode;
  className?: string;
  tone?: string;
}) {
  return (
    <div className={`rounded-[3px] ${className}`} style={{ background: glow(tone), ...came(tone) }}>
      {children}
    </div>
  );
}

export function Concept111() {
  const [screen, setScreen] = useState<ScreenKey>("dashboard");
  const active = OPDRACHTEN[0] as Opdracht;

  return (
    <div
      className="min-h-[680px] w-full antialiased"
      style={{ ...ui, background: C.stone, backgroundImage: stoneSurface, color: C.ivory }}
    >
      {/* Kop — kathedraal-tympaan met juweel-embleem */}
      <header className="mx-auto flex max-w-5xl items-center justify-between px-5 pt-9 md:px-10">
        <div className="flex items-center gap-3.5">
          <span
            className="flex h-11 w-11 items-center justify-center rounded-[3px]"
            style={{ background: glow(C.ruby), ...came(C.ruby), color: C.rubyLit }}
            aria-hidden="true"
          >
            <Gem size={19} strokeWidth={1.7} />
          </span>
          <div className="leading-none">
            <div
              className="text-[25px] font-medium tracking-[0.02em]"
              style={{ ...serif, color: C.ivory }}
            >
              Gebrandschilderd
            </div>
            <div className="mt-1 text-[10px] uppercase tracking-[0.3em]" style={{ color: C.muted }}>
              ZZP · Platform
            </div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="hidden text-right leading-tight sm:block">
            <div className="text-[13px] font-medium" style={{ color: C.ivory }}>
              {PROFIEL.naam}
            </div>
            <div className="text-[11px]" style={{ color: C.muted }}>
              {PROFIEL.plaats}
            </div>
          </div>
          <span
            className="flex h-11 w-11 items-center justify-center rounded-[3px] text-[13px] font-medium"
            style={{ background: glow(C.cobalt), ...came(C.cobalt), color: C.cobaltLit, ...serif }}
            aria-hidden="true"
          >
            {PROFIEL.initialen}
          </span>
        </div>
      </header>

      {/* Navigatie — lancet-onderlijn bij actief */}
      <nav
        className="mx-auto mt-7 flex max-w-5xl items-center gap-1 overflow-x-auto px-5 pb-5 md:px-10"
        aria-label="Hoofdnavigatie"
        style={{ borderBottom: `2px solid ${C.came}` }}
      >
        {SCREENS.map((s) => {
          const on = s.key === screen;
          return (
            <button
              key={s.key}
              onClick={() => setScreen(s.key)}
              aria-current={on ? "page" : undefined}
              className="relative shrink-0 px-3.5 py-2 text-[13px] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
              style={{ color: on ? C.ivory : C.muted, fontWeight: on ? 600 : 400 }}
            >
              {s.label}
              {on && (
                <span
                  className="absolute -bottom-[2px] left-2 right-2 h-[3px] rounded-full"
                  style={{ background: C.amber, boxShadow: `0 0 10px ${C.amberLit}` }}
                  aria-hidden="true"
                />
              )}
            </button>
          );
        })}
      </nav>

      <main className="mx-auto max-w-5xl px-5 py-10 md:px-10 md:py-14">
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
  const jewels = [
    { base: C.cobalt, lit: C.cobaltLit },
    { base: C.ruby, lit: C.rubyLit },
    { base: C.emerald, lit: C.emeraldLit },
    { base: C.amber, lit: C.amberLit },
  ];
  return (
    <div className="space-y-12">
      {/* Roosvenster-groet */}
      <section className="text-center">
        <div className="text-[11px] uppercase tracking-[0.36em]" style={{ color: C.amberLit }}>
          Vandaag · {PROFIEL.plaats}
        </div>
        <h1
          className="mx-auto mt-4 max-w-2xl text-[42px] font-medium leading-[1.02] tracking-[0.005em] sm:text-[58px]"
          style={{ ...serif, color: C.ivory }}
        >
          Goedemorgen, {PROFIEL.naam.split(" ")[0]}
        </h1>
        <div className="mx-auto mt-5 flex items-center justify-center gap-3" aria-hidden="true">
          <span className="h-[2px] w-12" style={{ background: C.came }} />
          <span
            className="h-2 w-2 rotate-45"
            style={{ background: C.ruby, outline: `1px solid ${C.came}` }}
          />
          <span className="h-[2px] w-12" style={{ background: C.came }} />
        </div>
        <p
          className="mx-auto mt-5 max-w-md text-[14px] leading-relaxed"
          style={{ color: C.ivorySoft }}
        >
          Het licht valt gunstig vandaag. Eén paneel in je raam vraagt aandacht — de rest gloeit
          rustig door.
        </p>
      </section>

      {/* Primaire actie — robijn lancet */}
      <Segment tone={C.ruby} className="p-6">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0">
            <div
              className="inline-flex items-center gap-2 text-[11px] uppercase tracking-[0.26em]"
              style={{ color: C.rubyLit }}
            >
              <AlertTriangle size={13} strokeWidth={2} aria-hidden="true" /> Vraagt aandacht
            </div>
            <h2
              className="mt-2 text-[24px] font-medium leading-tight sm:text-[28px]"
              style={{ ...serif, color: C.ivory }}
            >
              {primair.titel}
            </h2>
            <p className="mt-2 max-w-md text-[13px] leading-relaxed" style={{ color: C.ivorySoft }}>
              {primair.detail}
            </p>
          </div>
          <button
            onClick={onOpen}
            className="group inline-flex shrink-0 items-center gap-2.5 rounded-[3px] px-6 py-3 text-[13px] font-medium transition-all hover:gap-3.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 motion-reduce:hover:gap-2.5"
            style={{ background: C.ruby, color: C.ivory, border: `2px solid ${C.came}` }}
          >
            {primair.cta}
            <ArrowRight size={16} aria-hidden="true" />
          </button>
        </div>
      </Segment>

      {/* KPI — vier juweel-glasvlakken */}
      <section>
        <Kop sub="In cijfers">Prestatie</Kop>
        <div className="mt-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
          {KPIS.map((k, i) => {
            const j = jewels[i % jewels.length] as { base: string; lit: string };
            return (
              <Segment
                key={k.label}
                tone={j.base}
                className="group p-4 transition-transform hover:-translate-y-1 motion-reduce:hover:translate-y-0"
              >
                <div className="flex items-start justify-between">
                  <span
                    className="h-3 w-3 rotate-45"
                    style={{ background: j.lit, outline: `1px solid ${C.came}` }}
                    aria-hidden="true"
                  />
                  <span
                    className="text-[11px] tabular-nums"
                    style={{ color: k.up ? j.lit : C.rubyLit }}
                  >
                    {k.up ? "▲" : "▼"} {k.trend}
                  </span>
                </div>
                <div
                  className="mt-3 text-[30px] font-medium tabular-nums leading-none"
                  style={{ ...serif, color: C.ivory }}
                >
                  {k.value}
                </div>
                <div className="mt-1 text-[11.5px]" style={{ color: C.ivorySoft }}>
                  {k.label}
                </div>
                <div className="mt-3">
                  <Spark data={k.spark} tone={j.lit} />
                </div>
              </Segment>
            );
          })}
        </div>
      </section>

      {/* Top-match als altaarpaneel */}
      <section>
        <Kop sub="Beste match">Voor jou</Kop>
        <button
          onClick={onOpen}
          className="group mt-6 block w-full text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
        >
          <Segment
            tone={C.cobalt}
            className="flex flex-col gap-5 p-5 transition-transform group-hover:-translate-y-0.5 motion-reduce:group-hover:translate-y-0 sm:flex-row sm:items-center"
          >
            <div
              className="flex h-20 w-20 shrink-0 flex-col items-center justify-center rounded-[3px]"
              style={{ background: C.cobalt, color: C.ivory, border: `2px solid ${C.came}` }}
              aria-hidden="true"
            >
              <span className="text-[26px] font-medium tabular-nums leading-none" style={serif}>
                {top.match}
              </span>
              <span className="text-[9px] uppercase tracking-[0.2em]">match</span>
            </div>
            <div className="min-w-0 flex-1">
              <h3
                className="text-[22px] font-medium leading-tight"
                style={{ ...serif, color: C.ivory }}
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
                    className="rounded-[2px] px-2.5 py-0.5 text-[11px]"
                    style={{
                      background: C.stoneDeep,
                      color: C.ivorySoft,
                      border: `1px solid ${C.came}`,
                    }}
                  >
                    {t}
                  </span>
                ))}
              </div>
            </div>
            <ArrowRight
              size={22}
              className="hidden shrink-0 transition-transform group-hover:translate-x-1 motion-reduce:group-hover:translate-x-0 md:block"
              style={{ color: C.cobaltLit }}
              aria-hidden="true"
            />
          </Segment>
        </button>
      </section>
    </div>
  );
}

function MatchBar({ value }: { value: number }) {
  return (
    <div className="flex items-center gap-2">
      <div
        className="relative h-2 w-24 overflow-hidden rounded-[2px]"
        style={{ background: C.stoneDeep, border: `1px solid ${C.came}` }}
        aria-hidden="true"
      >
        <div
          className="absolute inset-y-0 left-0"
          style={{ width: `${value}%`, background: C.amber, boxShadow: `0 0 8px ${C.amberLit}` }}
        />
      </div>
      <span className="text-[13px] font-medium tabular-nums" style={{ color: C.amberLit }}>
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
    <div className="space-y-8">
      <Kop sub="Open opdrachten">Marktplaats</Kop>

      <Segment tone={C.emerald} className="flex items-center gap-3 px-4 py-1">
        <Search size={17} style={{ color: C.muted }} aria-hidden="true" />
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Zoek op titel, plaats of opdrachtgever…"
          aria-label="Opdrachten zoeken"
          className="w-full bg-transparent py-2.5 text-[14px] outline-none placeholder:opacity-40"
          style={{ color: C.ivory }}
        />
        <span className="shrink-0 text-[12px] tabular-nums" style={{ color: C.muted }}>
          {filtered.length}
        </span>
      </Segment>

      {filtered.length === 0 ? (
        <Segment
          tone={C.cobalt}
          className="flex flex-col items-center justify-center gap-3 p-14 text-center"
        >
          <Search size={26} style={{ color: C.muted }} aria-hidden="true" />
          <p className="text-[22px] font-medium" style={{ ...serif, color: C.ivory }}>
            Geen panelen gevonden
          </p>
          <p className="max-w-xs text-[13px]" style={{ color: C.muted }}>
            Niets past bij “{q}”. Verruim je zoekopdracht of beschikbaarheid.
          </p>
          <button
            onClick={() => setQ("")}
            className="mt-2 inline-flex items-center gap-2 rounded-[3px] px-4 py-2 text-[12px] font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
            style={{ background: C.ruby, color: C.ivory, border: `2px solid ${C.came}` }}
          >
            Zoekopdracht wissen
          </button>
        </Segment>
      ) : (
        <ul className="space-y-3">
          {filtered.map((o, i) => {
            const tone = [C.cobalt, C.emerald, C.amber][i % 3] as string;
            return (
              <li key={o.id}>
                <button
                  onClick={onOpen}
                  className="group block w-full text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
                >
                  <Segment
                    tone={tone}
                    className="flex flex-col gap-4 p-4 transition-transform group-hover:-translate-y-0.5 motion-reduce:group-hover:translate-y-0 sm:flex-row sm:items-center"
                  >
                    <div className="min-w-0 flex-1">
                      <h3
                        className="text-[18px] font-medium leading-tight"
                        style={{ ...serif, color: C.ivory }}
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
                            className="rounded-[2px] px-2 py-0.5 text-[10.5px]"
                            style={{
                              background: C.stoneDeep,
                              color: C.ivorySoft,
                              border: `1px solid ${C.came}`,
                            }}
                          >
                            {t}
                          </span>
                        ))}
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <MatchBar value={o.match} />
                      <ArrowRight
                        size={19}
                        className="shrink-0 transition-transform group-hover:translate-x-1 motion-reduce:group-hover:translate-x-0"
                        style={{ color: C.amberLit }}
                        aria-hidden="true"
                      />
                    </div>
                  </Segment>
                </button>
              </li>
            );
          })}
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
        className="inline-flex items-center gap-2 text-[12.5px] transition-opacity hover:opacity-60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
        style={{ color: C.muted }}
      >
        <ArrowRight size={14} className="rotate-180" aria-hidden="true" /> Terug naar marktplaats
      </button>

      <section className="text-center">
        <div className="flex items-center justify-center gap-3">
          <span className="text-[11px] uppercase tracking-[0.3em]" style={{ color: C.muted }}>
            {opdracht.id}
          </span>
          <span
            className="rounded-[3px] px-2.5 py-0.5 text-[11px] font-medium"
            style={{ background: C.amber, color: C.stone, border: `1px solid ${C.came}` }}
          >
            {opdracht.match}% match
          </span>
        </div>
        <h1
          className="mx-auto mt-4 max-w-2xl text-[34px] font-medium leading-[1.04] sm:text-[48px]"
          style={{ ...serif, color: C.ivory }}
        >
          {opdracht.titel}
        </h1>
        <p className="mt-3 text-[13.5px]" style={{ color: C.muted }}>
          {opdracht.opdrachtgever} · {opdracht.plaats}
        </p>
      </section>

      {/* Feiten als vier glasruitjes */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {[
          { l: "Tarief", v: opdracht.tarief, tone: C.emerald },
          { l: "Omvang", v: opdracht.uren, tone: C.cobalt },
          { l: "Start", v: opdracht.start, tone: C.amber },
          { l: "Match", v: `${opdracht.match}%`, tone: C.ruby },
        ].map((m) => (
          <Segment key={m.l} tone={m.tone} className="p-4 text-center">
            <div
              className="text-[22px] font-medium tabular-nums leading-none"
              style={{ ...serif, color: C.ivory }}
            >
              {m.v}
            </div>
            <div
              className="mt-2 text-[11px] uppercase tracking-[0.18em]"
              style={{ color: C.muted }}
            >
              {m.l}
            </div>
          </Segment>
        ))}
      </div>

      {/* Redenen — smaragd (past) vs amber (aandacht) */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <Segment tone={C.emerald} className="p-5">
          <div
            className="inline-flex items-center gap-2 text-[12px] uppercase tracking-[0.2em]"
            style={{ color: C.emeraldLit }}
          >
            <Check size={14} strokeWidth={2.4} aria-hidden="true" /> Wat past
          </div>
          <ul className="mt-4 space-y-3">
            {opdracht.redenen.plus.map((r) => (
              <li
                key={r}
                className="flex items-start gap-3 text-[14px] leading-snug"
                style={{ color: C.ivorySoft }}
              >
                <Check
                  size={16}
                  strokeWidth={2.2}
                  className="mt-0.5 shrink-0"
                  style={{ color: C.emeraldLit }}
                  aria-hidden="true"
                />
                {r}
              </li>
            ))}
          </ul>
        </Segment>
        <Segment tone={C.amber} className="p-5">
          <div
            className="inline-flex items-center gap-2 text-[12px] uppercase tracking-[0.2em]"
            style={{ color: C.amberLit }}
          >
            <AlertTriangle size={14} strokeWidth={2.4} aria-hidden="true" /> Aandacht
          </div>
          <ul className="mt-4 space-y-3">
            {opdracht.redenen.min.map((r) => (
              <li
                key={r}
                className="flex items-start gap-3 text-[14px] leading-snug"
                style={{ color: C.ivorySoft }}
              >
                <span
                  className="mt-1.5 h-1.5 w-1.5 shrink-0 rotate-45"
                  style={{ background: C.amberLit }}
                  aria-hidden="true"
                />
                {r}
              </li>
            ))}
          </ul>
        </Segment>
      </div>

      <div className="flex flex-col items-center gap-3 pt-2 sm:flex-row sm:justify-center">
        <button
          className="group inline-flex w-full items-center justify-center gap-2.5 rounded-[3px] px-7 py-3.5 text-[14px] font-medium transition-all hover:gap-3.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 motion-reduce:hover:gap-2.5 sm:w-auto"
          style={{ background: C.ruby, color: C.ivory, border: `2px solid ${C.came}` }}
        >
          Reageer op opdracht <ArrowRight size={16} aria-hidden="true" />
        </button>
        <button
          className="inline-flex w-full items-center justify-center gap-2 rounded-[3px] px-6 py-3.5 text-[14px] font-medium transition-opacity hover:opacity-70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 sm:w-auto"
          style={{ border: `2px solid ${C.came}`, color: C.ivory, background: C.glassLit }}
        >
          Bewaar voor later
        </button>
      </div>
    </div>
  );
}

// Gebrandschilderd medaillon: klein rond glasvlak met loodrand voor een credential.
function Medaillon({ tone, Icon }: { tone: string; Icon: LucideIcon }) {
  return (
    <span
      className="relative flex h-11 w-11 shrink-0 items-center justify-center rounded-full"
      style={{
        background: `radial-gradient(circle at 35% 25%, ${tone}55, ${C.glass})`,
        border: `2px solid ${C.came}`,
        color: tone,
      }}
      aria-hidden="true"
    >
      <span className="absolute inset-1 rounded-full" style={{ border: `1px solid ${C.cameHi}` }} />
      <Icon size={17} strokeWidth={2.2} />
    </span>
  );
}

function Verificatie() {
  const verified = CREDENTIALS.filter((c) => c.status === "VERIFIED").length;
  const pct = Math.round((verified / CREDENTIALS.length) * 100);
  return (
    <div className="space-y-8">
      <Kop sub="Vertrouwen">Verificatie</Kop>

      {/* Vertrouwens-roosvenster */}
      <Segment
        tone={C.emerald}
        className="flex flex-col items-center gap-6 p-6 sm:flex-row sm:items-center"
      >
        <div className="relative h-28 w-28 shrink-0" aria-hidden="true">
          <svg viewBox="0 0 36 36" className="h-full w-full -rotate-90">
            <circle cx="18" cy="18" r="15.5" fill="none" stroke={C.came} strokeWidth="3.5" />
            <circle
              cx="18"
              cy="18"
              r="15.5"
              fill="none"
              stroke={C.emeraldLit}
              strokeWidth="3"
              strokeLinecap="round"
              strokeDasharray={`${(pct / 100) * 97.4} 97.4`}
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span
              className="text-[26px] font-medium tabular-nums leading-none"
              style={{ ...serif, color: C.ivory }}
            >
              {pct}%
            </span>
            <span className="text-[9px] uppercase tracking-[0.2em]" style={{ color: C.muted }}>
              gedekt
            </span>
          </div>
        </div>
        <div className="text-center sm:text-left">
          <div
            className="inline-flex items-center gap-2 text-[12px] uppercase tracking-[0.24em]"
            style={{ color: C.emeraldLit }}
          >
            <ShieldCheck size={15} strokeWidth={2} aria-hidden="true" /> {PROFIEL.trust}
          </div>
          <p className="mt-2 max-w-md text-[14px] leading-relaxed" style={{ color: C.ivorySoft }}>
            {verified} van {CREDENTIALS.length} credentials volledig geverifieerd. Eén medaillon
            vraagt binnenkort actie — vernieuw op tijd om verifieerbaar te blijven.
          </p>
        </div>
      </Segment>

      <ul className="space-y-3">
        {CREDENTIALS.map((c) => {
          const st = statusMeta(c.status);
          return (
            <li key={c.naam}>
              <Segment tone={st.tone} className="flex items-center gap-4 p-4">
                <Medaillon tone={st.tone} Icon={st.Icon} />
                <div className="min-w-0 flex-1">
                  <div
                    className="text-[15.5px] font-medium leading-tight"
                    style={{ ...serif, color: C.ivory }}
                  >
                    {c.naam}
                  </div>
                  <div className="mt-0.5 text-[12px]" style={{ color: C.muted }}>
                    {c.detail}
                  </div>
                </div>
                <span
                  className="inline-flex shrink-0 items-center gap-1.5 rounded-[3px] px-3 py-1 text-[11px] font-medium"
                  style={{ background: C.stoneDeep, color: st.tone, border: `1px solid ${C.came}` }}
                >
                  <st.Icon size={12} strokeWidth={2.4} aria-hidden="true" />
                  <span className="hidden sm:inline">{st.label}</span>
                </span>
              </Segment>
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
      <Kop sub="De volgende beste stap">Volgende acties</Kop>
      <ol className="space-y-3">
        {sorted.map((a, i) => {
          const warn = a.urgentie === "warning";
          const tone = warn ? C.amber : C.cobalt;
          const lit = warn ? C.amberLit : C.cobaltLit;
          return (
            <li key={a.titel}>
              <Segment tone={tone} className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center">
                <span
                  className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[3px] text-[17px] font-medium tabular-nums"
                  style={{
                    ...serif,
                    background: C.stoneDeep,
                    color: lit,
                    border: `2px solid ${C.came}`,
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
                        strokeWidth={2.2}
                        style={{ color: lit }}
                        aria-hidden="true"
                      />
                    ) : (
                      <Gem size={14} strokeWidth={2.2} style={{ color: lit }} aria-hidden="true" />
                    )}
                    <h3
                      className="text-[17px] font-medium leading-tight"
                      style={{ ...serif, color: C.ivory }}
                    >
                      {a.titel}
                    </h3>
                    <span className="sr-only">{warn ? "Urgent" : "Informatief"}</span>
                  </div>
                  <p className="mt-1.5 text-[13px] leading-relaxed" style={{ color: C.ivorySoft }}>
                    {a.detail}
                  </p>
                </div>
                <button
                  className="shrink-0 self-start rounded-[3px] px-5 py-2.5 text-[12.5px] font-medium transition-all hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 sm:self-center"
                  style={{ background: tone, color: C.stone, border: `2px solid ${C.came}` }}
                >
                  {a.cta}
                </button>
              </Segment>
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
    if (status === "Betaald") return C.emeraldLit;
    if (status === "Openstaand") return C.amberLit;
    return C.muted;
  };
  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <Kop sub="Omzet">Facturen</Kop>
        <button
          className="inline-flex items-center gap-2 rounded-[3px] px-4 py-2.5 text-[12.5px] font-medium transition-all hover:gap-3 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 motion-reduce:hover:gap-2"
          style={{ background: C.ruby, color: C.ivory, border: `2px solid ${C.came}` }}
        >
          <Plus size={15} aria-hidden="true" /> Nieuwe factuur
        </button>
      </div>

      <Segment tone={C.cobalt} className="overflow-x-auto">
        <table className="w-full min-w-[560px] border-collapse text-left">
          <thead>
            <tr style={{ borderBottom: `2px solid ${C.came}` }}>
              {["Nummer", "Klant", "Datum", "Status", "Bedrag"].map((h, i) => (
                <th
                  key={h}
                  className={`px-4 py-3 text-[11px] uppercase tracking-[0.16em] ${i === 4 ? "text-right" : ""}`}
                  style={{ color: C.amberLit, fontWeight: 500 }}
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
                  style={{ borderBottom: `1px solid ${C.came}` }}
                >
                  <td
                    className="px-4 py-3.5 text-[12.5px] tabular-nums"
                    style={{ color: C.ivorySoft }}
                  >
                    {f.nr}
                  </td>
                  <td className="px-4 py-3.5 text-[14px]" style={{ color: C.ivory }}>
                    {f.klant}
                  </td>
                  <td className="px-4 py-3.5 text-[12.5px] tabular-nums" style={{ color: C.muted }}>
                    {f.datum}
                  </td>
                  <td className="px-4 py-3.5">
                    <span
                      className="inline-flex items-center gap-1.5 rounded-[3px] px-2.5 py-0.5 text-[11px] font-medium"
                      style={{
                        color: tone,
                        border: `1px solid ${C.came}`,
                        background: C.stoneDeep,
                      }}
                    >
                      <span
                        className="h-1.5 w-1.5 rotate-45"
                        style={{ background: tone }}
                        aria-hidden="true"
                      />
                      {f.status}
                    </span>
                  </td>
                  <td
                    className="px-4 py-3.5 text-right text-[15px] font-medium tabular-nums"
                    style={{ ...serif, color: C.ivory }}
                  >
                    {f.bedrag}
                  </td>
                </tr>
              );
            })}
          </tbody>
          <tfoot>
            <tr style={{ borderTop: `2px solid ${C.came}` }}>
              <td
                colSpan={4}
                className="px-4 py-4 text-[11px] uppercase tracking-[0.2em]"
                style={{ color: C.muted }}
              >
                Totaal betaald
              </td>
              <td
                className="px-4 py-4 text-right text-[20px] font-medium tabular-nums"
                style={{ ...serif, color: C.emeraldLit }}
              >
                {total}
              </td>
            </tr>
          </tfoot>
        </table>
      </Segment>
    </div>
  );
}
