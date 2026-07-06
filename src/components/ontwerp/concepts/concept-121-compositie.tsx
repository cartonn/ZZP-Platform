"use client";

// Concept 121 — "Compositie" · De Stijl / neoplasticisme (Mondriaan).
// Nederlands erfgoed: een orthogonaal raster van dikke ZWARTE hairlines dat het canvas in
// asymmetrische rechthoekige vlakken verdeelt. Enkele vlakken zijn gevuld met zuivere primaire
// kleuren (rood/geel/blauw), de rest gebroken-wit. Data leeft IN de vlakken. Strak,
// compositorisch, tijdloos. Onderscheidend van Bauhaus (cirkel/driehoek-geometrie) en Constructie
// (diagonaal rood/zwart): dit is puur ORTHOGONAAL, De-Stijl-vlakverdeling.
// Fonts: Space Grotesk (display) + Manrope (UI).

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
  Square,
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

// De Stijl-palet: gebroken-wit doek, zuiver zwart raster, drie primaire kleuren.
const C = {
  bg: "#f4f3ee", // gebroken-wit canvas
  panel: "#faf9f5", // iets lichter vlak
  fg: "#111111", // zwart — raster en tekst
  fgSoft: "#4a4a45", // gedempt grijs-zwart
  fgFaint: "#8a8a82", // faint label-grijs
  rood: "#d1352b", // primair rood-vlak
  geel: "#f7c948", // primair geel-vlak
  blauw: "#1e57b3", // primair blauw-vlak
  wit: "#ffffff",
};

const display = { fontFamily: "var(--font-lab-space)" };
const ui = { fontFamily: "var(--font-lab-manrope)" };

// Dikke zwarte De-Stijl-rasterlijn als standaard-rand.
const GRID = `3px solid ${C.fg}`;
const GRID_THIN = `2px solid ${C.fg}`;

function statusMeta(s: CredStatus): {
  label: string;
  Icon: LucideIcon;
  tone: string;
  fg: string;
} {
  switch (s) {
    case "VERIFIED":
      return { label: "Geverifieerd", Icon: Check, tone: C.blauw, fg: C.wit };
    case "SUBMITTED":
      return { label: "In beoordeling", Icon: Clock, tone: C.geel, fg: C.fg };
    case "EXPIRING":
      return { label: "Verloopt binnenkort", Icon: AlertTriangle, tone: C.geel, fg: C.fg };
    case "REJECTED":
      return { label: "Afgewezen", Icon: XCircle, tone: C.rood, fg: C.wit };
  }
}

// Een vlak in de compositie: rechthoek met dikke zwarte rand.
function Vlak({
  children,
  className = "",
  fill = C.panel,
  interactive = false,
}: {
  children: React.ReactNode;
  className?: string;
  fill?: string;
  interactive?: boolean;
}) {
  return (
    <div
      className={`relative ${
        interactive
          ? "transition-transform duration-150 hover:-translate-y-0.5 motion-reduce:hover:translate-y-0"
          : ""
      } ${className}`}
      style={{ background: fill, border: GRID }}
    >
      {children}
    </div>
  );
}

// Kleurblok-accent — een klein zuiver primair vlak, De-Stijl-signatuur.
function KleurBlok({ tone, className = "" }: { tone: string; className?: string }) {
  return (
    <span
      aria-hidden="true"
      className={`block ${className}`}
      style={{ background: tone, border: GRID_THIN }}
    />
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
        strokeWidth={3.5}
        strokeLinecap="square"
        strokeLinejoin="miter"
        vectorEffect="non-scaling-stroke"
      />
    </svg>
  );
}

// Compositorische kop: titel met een klein primair kleurblok ervoor.
function Kop({
  children,
  sub,
  tone = C.rood,
}: {
  children: React.ReactNode;
  sub?: string;
  tone?: string;
}) {
  return (
    <div className="flex items-center gap-4">
      <KleurBlok tone={tone} className="h-8 w-8 shrink-0" />
      <div>
        {sub && (
          <div
            className="mb-0.5 text-[10px] font-bold uppercase tracking-[0.3em]"
            style={{ color: C.fgFaint }}
          >
            {sub}
          </div>
        )}
        <h2
          className="text-[26px] font-bold uppercase leading-none tracking-[-0.01em] sm:text-[30px]"
          style={{ ...display, color: C.fg }}
        >
          {children}
        </h2>
      </div>
    </div>
  );
}

export function Concept121() {
  const [screen, setScreen] = useState<ScreenKey>("dashboard");
  const active = OPDRACHTEN[0] as Opdracht;

  return (
    <div
      className="min-h-[680px] w-full antialiased"
      style={{ ...ui, background: C.bg, color: C.fg }}
    >
      {/* Header — merkmark als De-Stijl-compositie in het klein */}
      <header className="mx-auto flex max-w-5xl items-center justify-between px-5 pt-8 md:px-10">
        <div className="flex items-center gap-3.5">
          <span
            className="grid h-11 w-11 shrink-0 grid-cols-2 grid-rows-2 overflow-hidden"
            style={{ border: GRID }}
            aria-hidden="true"
          >
            <span style={{ background: C.rood, borderRight: GRID_THIN, borderBottom: GRID_THIN }} />
            <span style={{ background: C.panel, borderBottom: GRID_THIN }} />
            <span style={{ background: C.blauw, borderRight: GRID_THIN }} />
            <span style={{ background: C.geel }} />
          </span>
          <div className="leading-none">
            <div
              className="text-[19px] font-bold uppercase tracking-[0.02em]"
              style={{ ...display, color: C.fg }}
            >
              Compositie
            </div>
            <div
              className="mt-1 text-[10px] font-semibold uppercase tracking-[0.28em]"
              style={{ color: C.fgFaint }}
            >
              ZZP · Platform
            </div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="hidden text-right leading-tight sm:block">
            <div className="text-[13px] font-bold" style={{ color: C.fg }}>
              {PROFIEL.naam}
            </div>
            <div className="text-[11px]" style={{ color: C.fgSoft }}>
              {PROFIEL.rol}
            </div>
          </div>
          <span
            className="flex h-11 w-11 items-center justify-center text-[13px] font-bold"
            style={{ background: C.geel, color: C.fg, border: GRID }}
            aria-hidden="true"
          >
            {PROFIEL.initialen}
          </span>
        </div>
      </header>

      {/* Nav — tab-strip met zwart rasterblok onder actief */}
      <nav
        className="mx-auto mt-6 flex max-w-5xl items-stretch gap-0 overflow-x-auto px-5 md:px-10"
        aria-label="Hoofdnavigatie"
      >
        <div className="flex w-full items-stretch" style={{ borderBottom: GRID }}>
          {SCREENS.map((s, i) => {
            const on = s.key === screen;
            return (
              <button
                key={s.key}
                onClick={() => setScreen(s.key)}
                aria-current={on ? "page" : undefined}
                className="relative shrink-0 px-4 py-2.5 text-[12.5px] uppercase tracking-[0.08em] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-1"
                style={{
                  color: on ? C.wit : C.fgSoft,
                  background: on ? C.fg : "transparent",
                  fontWeight: on ? 700 : 600,
                  borderLeft: i === 0 ? "none" : GRID_THIN,
                }}
              >
                {s.label}
              </button>
            );
          })}
        </div>
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
  const tones = [C.rood, C.blauw, C.geel, C.fg];
  return (
    <div className="space-y-9">
      <section>
        <div
          className="text-[10px] font-bold uppercase tracking-[0.3em]"
          style={{ color: C.fgFaint }}
        >
          Vandaag · {PROFIEL.plaats}
        </div>
        <h1
          className="mt-2 text-[34px] font-bold uppercase leading-[0.98] tracking-[-0.02em] sm:text-[46px]"
          style={{ ...display, color: C.fg }}
        >
          Goedemorgen,
          <br />
          <span style={{ color: C.rood }}>{PROFIEL.naam.split(" ")[0]}</span>
        </h1>
        <p className="mt-3 max-w-md text-[14px] leading-relaxed" style={{ color: C.fgSoft }}>
          De compositie ligt in balans. Eén vlak vraagt vandaag om je aandacht — de rest staat vast.
        </p>
      </section>

      {/* Primaire actie — rood vlak, De-Stijl-signatuur */}
      <Vlak fill={C.rood} className="p-0">
        <div className="flex flex-col gap-5 p-6 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0">
            <span
              className="inline-flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.2em]"
              style={{ color: C.wit }}
            >
              <AlertTriangle size={13} strokeWidth={2.6} aria-hidden="true" /> Vraagt aandacht
            </span>
            <h2
              className="mt-2 text-[22px] font-bold uppercase leading-tight sm:text-[26px]"
              style={{ ...display, color: C.wit }}
            >
              {primair.titel}
            </h2>
            <p
              className="mt-2 max-w-md text-[13px] leading-relaxed"
              style={{ color: "rgba(255,255,255,0.85)" }}
            >
              {primair.detail}
            </p>
          </div>
          <button
            onClick={onOpen}
            className="group inline-flex shrink-0 items-center gap-2.5 px-6 py-3 text-[13px] font-bold uppercase tracking-[0.04em] transition-all hover:gap-3.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 motion-reduce:hover:gap-2.5"
            style={{ background: C.wit, color: C.fg, border: GRID }}
          >
            {primair.cta}
            <ArrowRight size={16} aria-hidden="true" />
          </button>
        </div>
      </Vlak>

      {/* KPI-vlakken */}
      <section>
        <Kop sub="In cijfers" tone={C.blauw}>
          Prestatie
        </Kop>
        <div className="mt-5 grid grid-cols-2 gap-4 lg:grid-cols-4">
          {KPIS.map((k, i) => {
            const tone = tones[i % tones.length] as string;
            return (
              <Vlak key={k.label} interactive className="p-4">
                <div className="flex items-start justify-between">
                  <KleurBlok tone={tone} className="h-4 w-4" />
                  <span
                    className="text-[11px] font-bold tabular-nums"
                    style={{ color: k.up ? C.blauw : C.rood }}
                  >
                    {k.up ? "▲" : "▼"} {k.trend}
                  </span>
                </div>
                <div
                  className="mt-3 text-[27px] font-bold tabular-nums leading-none tracking-[-0.01em]"
                  style={{ ...display, color: C.fg }}
                >
                  {k.value}
                </div>
                <div className="mt-1 text-[11.5px]" style={{ color: C.fgSoft }}>
                  {k.label}
                </div>
                <div className="mt-3">
                  <Spark data={k.spark} tone={tone} />
                </div>
              </Vlak>
            );
          })}
        </div>
      </section>

      {/* Top-match */}
      <section>
        <Kop sub="Beste match" tone={C.geel}>
          Voor jou
        </Kop>
        <button
          onClick={onOpen}
          className="group mt-5 block w-full text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
        >
          <Vlak interactive className="flex flex-col gap-0 p-0 sm:flex-row sm:items-stretch">
            <span
              className="flex shrink-0 flex-col items-center justify-center px-6 py-5 sm:w-28"
              style={{ background: C.blauw, color: C.wit, borderRight: GRID }}
              aria-hidden="true"
            >
              <span className="text-[30px] font-bold tabular-nums leading-none" style={display}>
                {top.match}
              </span>
              <span className="mt-1 text-[9px] font-bold uppercase tracking-[0.18em]">match</span>
            </span>
            <div className="min-w-0 flex-1 p-5">
              <h3
                className="text-[19px] font-bold uppercase leading-tight"
                style={{ ...display, color: C.fg }}
              >
                {top.titel}
              </h3>
              <div className="mt-1 text-[12.5px]" style={{ color: C.fgSoft }}>
                {top.opdrachtgever} · {top.plaats} · {top.tarief}
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                {top.tags.map((t) => (
                  <span
                    key={t}
                    className="inline-flex items-center px-2.5 py-1 text-[11px] font-semibold"
                    style={{ color: C.fg, border: GRID_THIN }}
                  >
                    {t}
                  </span>
                ))}
              </div>
            </div>
            <span
              className="hidden shrink-0 items-center justify-center px-5 md:flex"
              style={{ borderLeft: GRID }}
              aria-hidden="true"
            >
              <ArrowRight
                size={22}
                className="transition-transform group-hover:translate-x-1 motion-reduce:group-hover:translate-x-0"
                style={{ color: C.fg }}
              />
            </span>
          </Vlak>
        </button>
      </section>
    </div>
  );
}

function MatchMeter({ value }: { value: number }) {
  return (
    <div className="flex items-center gap-2.5">
      <div
        className="relative h-3.5 w-24 overflow-hidden"
        style={{ background: C.wit, border: GRID_THIN }}
        aria-hidden="true"
      >
        <div
          className="absolute inset-y-0 left-0"
          style={{ width: `${value}%`, background: C.blauw }}
        />
      </div>
      <span className="text-[13px] font-bold tabular-nums" style={{ color: C.blauw }}>
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
      <Kop sub="Open opdrachten" tone={C.rood}>
        Marktplaats
      </Kop>

      <Vlak className="flex items-center gap-3 px-4">
        <Search size={17} style={{ color: C.fgSoft }} aria-hidden="true" />
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Zoek op titel, plaats of opdrachtgever…"
          aria-label="Opdrachten zoeken"
          className="w-full bg-transparent py-3 text-[14px] outline-none placeholder:opacity-50"
          style={{ color: C.fg }}
        />
        <span
          className="flex h-6 min-w-6 items-center justify-center px-1.5 text-[12px] font-bold tabular-nums"
          style={{ background: C.geel, color: C.fg, border: GRID_THIN }}
        >
          {filtered.length}
        </span>
      </Vlak>

      {filtered.length === 0 ? (
        <Vlak className="flex flex-col items-center justify-center gap-3 p-14 text-center">
          <KleurBlok tone={C.rood} className="h-10 w-10" />
          <p className="text-[20px] font-bold uppercase" style={{ ...display, color: C.fg }}>
            Geen opdrachten gevonden
          </p>
          <p className="max-w-xs text-[13px]" style={{ color: C.fgSoft }}>
            Niets past bij “{q}”. Verruim je zoekopdracht of beschikbaarheid.
          </p>
          <button
            onClick={() => setQ("")}
            className="mt-2 inline-flex items-center gap-2 px-4 py-2 text-[12px] font-bold uppercase tracking-[0.04em] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
            style={{ background: C.fg, color: C.wit }}
          >
            Zoekopdracht wissen
          </button>
        </Vlak>
      ) : (
        <ul className="space-y-4">
          {filtered.map((o, idx) => {
            const stripe = [C.rood, C.blauw, C.geel][idx % 3] as string;
            return (
              <li key={o.id}>
                <button
                  onClick={onOpen}
                  className="group block w-full text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
                >
                  <Vlak interactive className="flex items-stretch p-0">
                    <span
                      className="w-3 shrink-0"
                      style={{ background: stripe, borderRight: GRID }}
                      aria-hidden="true"
                    />
                    <div className="flex min-w-0 flex-1 flex-col gap-4 p-4 sm:flex-row sm:items-center">
                      <div className="min-w-0 flex-1">
                        <h3
                          className="text-[17px] font-bold uppercase leading-tight"
                          style={{ ...display, color: C.fg }}
                        >
                          {o.titel}
                        </h3>
                        <div className="mt-0.5 text-[12.5px]" style={{ color: C.fgSoft }}>
                          {o.opdrachtgever} · {o.plaats} · {o.tarief}
                        </div>
                        <div className="mt-2 flex flex-wrap gap-2">
                          {o.tags.map((t) => (
                            <span
                              key={t}
                              className="inline-flex items-center px-2 py-0.5 text-[11px] font-semibold"
                              style={{ color: C.fgSoft, border: GRID_THIN }}
                            >
                              {t}
                            </span>
                          ))}
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <MatchMeter value={o.match} />
                        <ArrowRight
                          size={19}
                          className="shrink-0 transition-transform group-hover:translate-x-1 motion-reduce:group-hover:translate-x-0"
                          style={{ color: C.fg }}
                          aria-hidden="true"
                        />
                      </div>
                    </div>
                  </Vlak>
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
  const feiten: { l: string; v: string; Icon: LucideIcon; tone: string }[] = [
    { l: "Tarief", v: opdracht.tarief, Icon: Coins, tone: C.rood },
    { l: "Omvang", v: opdracht.uren, Icon: Clock, tone: C.blauw },
    { l: "Start", v: opdracht.start, Icon: CalendarDays, tone: C.geel },
    { l: "Plaats", v: opdracht.plaats, Icon: MapPin, tone: C.fg },
  ];
  return (
    <div className="space-y-7">
      <button
        onClick={onBack}
        className="inline-flex items-center gap-2 text-[12px] font-bold uppercase tracking-[0.08em] transition-opacity hover:opacity-60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
        style={{ color: C.fgSoft }}
      >
        <ArrowRight size={14} className="rotate-180" aria-hidden="true" /> Terug naar marktplaats
      </button>

      <section>
        <div className="flex flex-wrap items-center gap-2">
          <span
            className="px-2 py-1 text-[11px] font-bold uppercase tabular-nums tracking-[0.14em]"
            style={{ color: C.fg, border: GRID_THIN }}
          >
            {opdracht.id}
          </span>
          <span
            className="inline-flex items-center px-2.5 py-1 text-[12px] font-bold tabular-nums"
            style={{ background: C.blauw, color: C.wit, border: GRID_THIN }}
          >
            {opdracht.match}% match
          </span>
        </div>
        <h1
          className="mt-3 text-[30px] font-bold uppercase leading-[1.02] tracking-[-0.02em] sm:text-[40px]"
          style={{ ...display, color: C.fg }}
        >
          {opdracht.titel}
        </h1>
        <p className="mt-2 text-[13.5px]" style={{ color: C.fgSoft }}>
          {opdracht.opdrachtgever} · {opdracht.plaats}
        </p>
      </section>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {feiten.map((m) => (
          <Vlak key={m.l} className="p-4">
            <KleurBlok tone={m.tone} className="h-3.5 w-3.5" />
            <div
              className="mt-2.5 text-[18px] font-bold tabular-nums leading-none"
              style={{ ...display, color: C.fg }}
            >
              {m.v}
            </div>
            <div
              className="mt-1.5 text-[11px] font-semibold uppercase tracking-[0.14em]"
              style={{ color: C.fgSoft }}
            >
              {m.l}
            </div>
          </Vlak>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <Vlak className="p-0">
          <div
            className="flex items-center gap-2 px-5 py-3 text-[12px] font-bold uppercase tracking-[0.12em]"
            style={{ background: C.blauw, color: C.wit, borderBottom: GRID }}
          >
            <Check size={14} strokeWidth={2.8} aria-hidden="true" /> Wat past
          </div>
          <ul className="space-y-3 p-5">
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
                  style={{ color: C.blauw }}
                  aria-hidden="true"
                />
                {r}
              </li>
            ))}
          </ul>
        </Vlak>
        <Vlak className="p-0">
          <div
            className="flex items-center gap-2 px-5 py-3 text-[12px] font-bold uppercase tracking-[0.12em]"
            style={{ background: C.geel, color: C.fg, borderBottom: GRID }}
          >
            <AlertTriangle size={14} strokeWidth={2.8} aria-hidden="true" /> Aandacht
          </div>
          <ul className="space-y-3 p-5">
            {opdracht.redenen.min.map((r) => (
              <li
                key={r}
                className="flex items-start gap-3 text-[14px] leading-snug"
                style={{ color: C.fg }}
              >
                <Square
                  size={13}
                  strokeWidth={3}
                  className="mt-1 shrink-0"
                  style={{ color: C.rood }}
                  aria-hidden="true"
                />
                {r}
              </li>
            ))}
          </ul>
        </Vlak>
      </div>

      <div className="flex flex-col items-stretch gap-3 pt-1 sm:flex-row">
        <button
          className="group inline-flex flex-1 items-center justify-center gap-2.5 px-7 py-3.5 text-[14px] font-bold uppercase tracking-[0.04em] transition-all hover:gap-3.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 motion-reduce:hover:gap-2.5"
          style={{ background: C.rood, color: C.wit, border: GRID }}
        >
          Reageer op opdracht <ArrowRight size={16} aria-hidden="true" />
        </button>
        <button
          className="inline-flex items-center justify-center gap-2 px-6 py-3.5 text-[14px] font-bold uppercase tracking-[0.04em] transition-colors hover:bg-black/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
          style={{ background: C.panel, color: C.fg, border: GRID }}
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
  const total = CREDENTIALS.length;
  return (
    <div className="space-y-7">
      <Kop sub="Vertrouwen" tone={C.blauw}>
        Verificatie
      </Kop>

      {/* Keurmerk-compositie: blauw vlak met percentage-balk */}
      <Vlak className="flex flex-col items-stretch p-0 sm:flex-row">
        <div
          className="flex shrink-0 flex-col items-center justify-center gap-1 px-8 py-7 sm:w-44"
          style={{ background: C.blauw, color: C.wit, borderBottom: GRID }}
        >
          <span
            className="text-[46px] font-bold tabular-nums leading-none"
            style={display}
            aria-hidden="true"
          >
            {pct}%
          </span>
          <span className="text-[10px] font-bold uppercase tracking-[0.2em]">gedekt</span>
        </div>
        <div className="flex-1 p-6">
          <span
            className="inline-flex items-center gap-2 px-3 py-1 text-[12px] font-bold uppercase tracking-[0.08em]"
            style={{ background: C.geel, color: C.fg, border: GRID_THIN }}
          >
            <ShieldCheck size={15} strokeWidth={2.4} aria-hidden="true" /> {PROFIEL.trust}
          </span>
          <p className="mt-3 max-w-md text-[14px] leading-relaxed" style={{ color: C.fgSoft }}>
            {verified} van {total} credentials volledig geverifieerd. Eén dossier vraagt binnenkort
            actie — vernieuw op tijd om verifieerbaar te blijven.
          </p>
          {/* Vlakverdeling-balk: elk credential een vlak */}
          <div className="mt-4 flex h-6 w-full overflow-hidden" style={{ border: GRID_THIN }}>
            {CREDENTIALS.map((c, i) => {
              const st = statusMeta(c.status);
              return (
                <span
                  key={c.naam}
                  className="flex-1"
                  style={{
                    background: st.tone,
                    borderRight: i < total - 1 ? GRID_THIN : "none",
                  }}
                  aria-hidden="true"
                />
              );
            })}
          </div>
        </div>
      </Vlak>

      <ul className="space-y-3">
        {CREDENTIALS.map((c) => {
          const st = statusMeta(c.status);
          return (
            <li key={c.naam}>
              <Vlak className="flex items-center gap-0 p-0">
                <span
                  className="flex h-14 w-14 shrink-0 items-center justify-center"
                  style={{ background: st.tone, color: st.fg, borderRight: GRID }}
                  aria-hidden="true"
                >
                  <st.Icon size={20} strokeWidth={2.6} />
                </span>
                <div className="min-w-0 flex-1 px-4 py-3">
                  <div className="text-[15px] font-bold" style={{ ...display, color: C.fg }}>
                    {c.naam}
                  </div>
                  <div className="mt-0.5 text-[12px]" style={{ color: C.fgSoft }}>
                    {c.detail}
                  </div>
                </div>
                <span
                  className="mr-4 hidden items-center gap-1.5 px-2.5 py-1 text-[11px] font-bold uppercase tracking-[0.04em] sm:inline-flex"
                  style={{ background: st.tone, color: st.fg, border: GRID_THIN }}
                >
                  <st.Icon size={12} strokeWidth={2.8} aria-hidden="true" />
                  {st.label}
                </span>
              </Vlak>
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
      <Kop sub="De volgende beste stap" tone={C.rood}>
        Volgende acties
      </Kop>
      <ol className="space-y-4">
        {sorted.map((a, i) => {
          const warn = a.urgentie === "warning";
          const tone = warn ? C.rood : C.blauw;
          return (
            <li key={a.titel}>
              <Vlak className="flex items-stretch p-0">
                <span
                  className="flex w-16 shrink-0 items-center justify-center text-[22px] font-bold tabular-nums"
                  style={{ background: tone, color: C.wit, borderRight: GRID }}
                  aria-hidden="true"
                >
                  <span style={display}>{i + 1}</span>
                </span>
                <div className="flex min-w-0 flex-1 flex-col gap-4 p-5 sm:flex-row sm:items-center">
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
                        <Square
                          size={12}
                          strokeWidth={3}
                          style={{ color: tone }}
                          aria-hidden="true"
                        />
                      )}
                      <h3
                        className="text-[16px] font-bold uppercase leading-tight"
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
                    className="shrink-0 self-start px-5 py-2.5 text-[12px] font-bold uppercase tracking-[0.04em] transition-transform hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 motion-reduce:hover:translate-y-0 sm:self-center"
                    style={{ background: tone, color: C.wit, border: GRID }}
                  >
                    {a.cta}
                  </button>
                </div>
              </Vlak>
            </li>
          );
        })}
      </ol>
    </div>
  );
}

function Facturen() {
  const total = "€ 8.622";
  const badge = (status: string): { tone: string; fg: string } => {
    if (status === "Betaald") return { tone: C.blauw, fg: C.wit };
    if (status === "Openstaand") return { tone: C.geel, fg: C.fg };
    if (status === "Concept") return { tone: C.panel, fg: C.fg };
    return { tone: C.rood, fg: C.wit };
  };
  return (
    <div className="space-y-7">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <Kop sub="Omzet" tone={C.geel}>
          Facturen
        </Kop>
        <button
          className="inline-flex items-center gap-2 px-4 py-2.5 text-[12px] font-bold uppercase tracking-[0.04em] transition-all hover:gap-3 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 motion-reduce:hover:gap-2"
          style={{ background: C.fg, color: C.wit }}
        >
          <Plus size={15} aria-hidden="true" /> Nieuwe factuur
        </button>
      </div>

      <Vlak className="overflow-x-auto">
        <table className="w-full min-w-[560px] border-collapse text-left">
          <thead>
            <tr style={{ background: C.fg }}>
              {["Nummer", "Klant", "Datum", "Status", "Bedrag"].map((h, i) => (
                <th
                  key={h}
                  className={`px-4 py-3 text-[11px] font-bold uppercase tracking-[0.14em] ${i === 4 ? "text-right" : ""}`}
                  style={{ color: C.wit, borderLeft: i === 0 ? "none" : GRID_THIN }}
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {FACTUREN.map((f) => {
              const b = badge(f.status);
              return (
                <tr
                  key={f.nr}
                  className="transition-colors hover:bg-black/5"
                  style={{ borderBottom: GRID_THIN }}
                >
                  <td
                    className="px-4 py-3.5 text-[12.5px] tabular-nums"
                    style={{ color: C.fgSoft }}
                  >
                    {f.nr}
                  </td>
                  <td className="px-4 py-3.5 text-[14px] font-semibold" style={{ color: C.fg }}>
                    {f.klant}
                  </td>
                  <td
                    className="px-4 py-3.5 text-[12.5px] tabular-nums"
                    style={{ color: C.fgSoft }}
                  >
                    {f.datum}
                  </td>
                  <td className="px-4 py-3.5">
                    <span
                      className="inline-flex items-center gap-1.5 px-2.5 py-1 text-[11px] font-bold uppercase tracking-[0.04em]"
                      style={{ background: b.tone, color: b.fg, border: GRID_THIN }}
                    >
                      {f.status}
                    </span>
                  </td>
                  <td
                    className="px-4 py-3.5 text-right text-[15px] font-bold tabular-nums"
                    style={{ ...display, color: C.fg }}
                  >
                    {f.bedrag}
                  </td>
                </tr>
              );
            })}
          </tbody>
          <tfoot>
            <tr style={{ borderTop: GRID }}>
              <td
                colSpan={4}
                className="px-4 py-4 text-[11px] font-bold uppercase tracking-[0.16em]"
                style={{ color: C.fgSoft }}
              >
                Totaal betaald
              </td>
              <td
                className="px-4 py-4 text-right text-[19px] font-bold tabular-nums"
                style={{ ...display, color: C.blauw }}
              >
                {total}
              </td>
            </tr>
          </tfoot>
        </table>
      </Vlak>
    </div>
  );
}
