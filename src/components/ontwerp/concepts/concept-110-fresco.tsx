"use client";

// Concept 110 — "Fresco" · Italiaanse renaissance-fresco.
// Kalkpleister-textuur (zachte korrelige off-white met subtiele vlekken via gradients),
// warme terracotta & azuriet-blauw pigmenten, klassieke proporties (royale marges,
// gulden-snede-gevoel), fijne serif-kapitalen als koppen. Warm-menselijk, tijdloos,
// vertrouwenwekkend. Onderscheidend van Aquarel/Marmer/Botanie door pigment-op-pleister
// met klassieke architectonische compositie (kolommen, kapitalen, boog-motieven).
// Fonts: Instrument Serif (display/kapitalen) + Inter (UI).

import { useState } from "react";
import {
  ArrowRight,
  Check,
  Clock,
  AlertTriangle,
  XCircle,
  Search,
  Sparkle,
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

const C = {
  plaster: "#efe7d6", // kalkpleister off-white
  plasterDeep: "#e7dcc6",
  ink: "#3a2f27", // warme sepia-inkt
  inkSoft: "#5c4d40",
  muted: "#8a7963",
  terracotta: "#b4532e", // terracotta-pigment
  terracottaDeep: "#8f3f22",
  azurite: "#2f5d78", // azuriet-blauw
  azuriteDeep: "#23485d",
  gold: "#a67c3d", // oker/goud accent
  line: "rgba(58,47,39,0.14)",
  lineStrong: "rgba(58,47,39,0.26)",
};

const serif = { fontFamily: "var(--font-lab-instrument-serif)" };
const ui = { fontFamily: "var(--font-lab-inter)" };

// Kalkpleister-oppervlak: gelaagde zachte gradients = pigmentvlekken op pleister.
const plasterSurface =
  "radial-gradient(120% 90% at 12% 8%, rgba(180,83,46,0.06), transparent 55%)," +
  "radial-gradient(120% 90% at 88% 18%, rgba(47,93,120,0.06), transparent 55%)," +
  "radial-gradient(100% 100% at 50% 100%, rgba(166,124,61,0.05), transparent 60%)";

function statusMeta(s: CredStatus): { label: string; Icon: LucideIcon; tone: string } {
  switch (s) {
    case "VERIFIED":
      return { label: "Geverifieerd", Icon: Check, tone: C.azurite };
    case "SUBMITTED":
      return { label: "In beoordeling", Icon: Clock, tone: C.gold };
    case "EXPIRING":
      return { label: "Verloopt binnenkort", Icon: AlertTriangle, tone: C.terracotta };
    case "REJECTED":
      return { label: "Afgewezen", Icon: XCircle, tone: C.terracottaDeep };
  }
}

// Fijne serif-kapitalen als sectiekop, met dun ornamenteel lijntje.
function Kapitaal({ children, sub }: { children: React.ReactNode; sub?: string }) {
  return (
    <div>
      {sub && (
        <div
          className="mb-2 text-[11px] uppercase tracking-[0.34em]"
          style={{ ...ui, color: C.muted }}
        >
          {sub}
        </div>
      )}
      <h2
        className="text-[30px] font-normal uppercase leading-none tracking-[0.02em] sm:text-[36px]"
        style={{ ...serif, color: C.ink }}
      >
        {children}
      </h2>
      <div className="mt-3 flex items-center gap-2" aria-hidden="true">
        <span className="h-px w-10" style={{ background: C.terracotta }} />
        <span className="h-1 w-1 rotate-45" style={{ background: C.gold }} />
        <span className="h-px flex-1" style={{ background: C.line }} />
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

export function Concept110() {
  const [screen, setScreen] = useState<ScreenKey>("dashboard");
  const active = OPDRACHTEN[0] as Opdracht;

  return (
    <div
      className="min-h-[680px] w-full antialiased"
      style={{ ...ui, background: C.plaster, backgroundImage: plasterSurface, color: C.ink }}
    >
      {/* Kop — architectonisch fronton met kapitaal-titel */}
      <header className="mx-auto flex max-w-5xl items-center justify-between px-5 pt-9 md:px-10">
        <div className="flex items-center gap-3.5">
          <span
            className="flex h-11 w-11 items-center justify-center rounded-full"
            style={{
              background: C.terracotta,
              color: C.plaster,
              boxShadow: `inset 0 -3px 6px rgba(0,0,0,0.18)`,
            }}
            aria-hidden="true"
          >
            <Sparkle size={20} strokeWidth={1.8} />
          </span>
          <div className="leading-none">
            <div
              className="text-[26px] font-normal uppercase tracking-[0.08em]"
              style={{ ...serif, color: C.ink }}
            >
              Fresco
            </div>
            <div className="mt-1 text-[10px] uppercase tracking-[0.3em]" style={{ color: C.muted }}>
              ZZP · Platform
            </div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="hidden text-right leading-tight sm:block">
            <div className="text-[13px] font-medium" style={{ color: C.ink }}>
              {PROFIEL.naam}
            </div>
            <div className="text-[11px]" style={{ color: C.muted }}>
              {PROFIEL.plaats}
            </div>
          </div>
          <span
            className="flex h-11 w-11 items-center justify-center rounded-full text-[13px] font-medium"
            style={{
              ...serif,
              background: C.plasterDeep,
              color: C.azurite,
              border: `1px solid ${C.lineStrong}`,
            }}
            aria-hidden="true"
          >
            {PROFIEL.initialen}
          </span>
        </div>
      </header>

      {/* Navigatie — boog-onderstreping bij actief, klassiek ritme */}
      <nav
        className="mx-auto mt-7 flex max-w-5xl items-center gap-1 overflow-x-auto px-5 pb-5 md:px-10"
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
              style={{ color: on ? C.ink : C.muted, fontWeight: on ? 600 : 400 }}
            >
              {s.label}
              {on && (
                <span
                  className="absolute -bottom-[1px] left-2 right-2 h-[2px] rounded-full"
                  style={{ background: C.terracotta }}
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

// Pleister-paneel: subtiel verhoogd oppervlak met warme rand.
function Panel({
  children,
  className = "",
  tone = "plain",
}: {
  children: React.ReactNode;
  className?: string;
  tone?: "plain" | "terracotta" | "azurite";
}) {
  const border =
    tone === "terracotta" ? C.terracotta : tone === "azurite" ? C.azurite : C.lineStrong;
  return (
    <div
      className={`rounded-[4px] ${className}`}
      style={{
        background: C.plasterDeep,
        border: `1px solid ${border}`,
        boxShadow: "0 1px 0 rgba(255,255,255,0.5) inset, 0 2px 10px rgba(58,47,39,0.05)",
      }}
    >
      {children}
    </div>
  );
}

function Dashboard({ onOpen }: { onOpen: () => void }) {
  const primair = ACTIES[0] as (typeof ACTIES)[number];
  const top = OPDRACHTEN[0] as Opdracht;
  const pigment = [C.terracotta, C.azurite, C.gold, C.terracottaDeep];
  return (
    <div className="space-y-12">
      {/* Fresco-fronton: groet in serif-kapitaal */}
      <section className="text-center">
        <div className="text-[11px] uppercase tracking-[0.36em]" style={{ color: C.muted }}>
          Vandaag · {PROFIEL.plaats}
        </div>
        <h1
          className="mx-auto mt-4 max-w-2xl text-[40px] font-normal leading-[1.02] tracking-[0.01em] sm:text-[56px]"
          style={{ ...serif, color: C.ink }}
        >
          Goedemorgen, {PROFIEL.naam.split(" ")[0]}
        </h1>
        <div className="mx-auto mt-5 flex items-center justify-center gap-3" aria-hidden="true">
          <span className="h-px w-12" style={{ background: C.line }} />
          <span className="h-1.5 w-1.5 rotate-45" style={{ background: C.terracotta }} />
          <span className="h-px w-12" style={{ background: C.line }} />
        </div>
        <p
          className="mx-auto mt-5 max-w-md text-[14px] leading-relaxed"
          style={{ color: C.inkSoft }}
        >
          Je fresco is in balans. Eén paneel vraagt vandaag je penseel — de rest kan drogen.
        </p>
      </section>

      {/* Primaire actie — een tempera-blok met warme rand */}
      <Panel tone="terracotta" className="p-6">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0">
            <div
              className="inline-flex items-center gap-2 text-[11px] uppercase tracking-[0.26em]"
              style={{ color: C.terracotta }}
            >
              <AlertTriangle size={13} strokeWidth={2} aria-hidden="true" /> Vraagt aandacht
            </div>
            <h2
              className="mt-2 text-[24px] font-normal leading-tight sm:text-[28px]"
              style={{ ...serif, color: C.ink }}
            >
              {primair.titel}
            </h2>
            <p className="mt-2 max-w-md text-[13px] leading-relaxed" style={{ color: C.inkSoft }}>
              {primair.detail}
            </p>
          </div>
          <button
            onClick={onOpen}
            className="group inline-flex shrink-0 items-center gap-2.5 rounded-full px-6 py-3 text-[13px] font-medium transition-all hover:gap-3.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 motion-reduce:hover:gap-2.5"
            style={{ background: C.terracotta, color: C.plaster }}
          >
            {primair.cta}
            <ArrowRight size={16} aria-hidden="true" />
          </button>
        </div>
      </Panel>

      {/* KPI-fresco: vier pigment-panelen */}
      <section>
        <Kapitaal sub="In cijfers">Prestatie</Kapitaal>
        <div className="mt-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
          {KPIS.map((k, i) => {
            const tone = pigment[i % pigment.length] as string;
            return (
              <Panel
                key={k.label}
                className="group p-4 transition-transform hover:-translate-y-1 motion-reduce:hover:translate-y-0"
              >
                <div className="flex items-start justify-between">
                  <span
                    className="h-2.5 w-2.5 rounded-full"
                    style={{ background: tone }}
                    aria-hidden="true"
                  />
                  <span
                    className="text-[11px] tabular-nums"
                    style={{ color: k.up ? C.azurite : C.terracotta }}
                  >
                    {k.up ? "▲" : "▼"} {k.trend}
                  </span>
                </div>
                <div
                  className="mt-3 text-[30px] font-normal tabular-nums leading-none tracking-[0.01em]"
                  style={{ ...serif, color: C.ink }}
                >
                  {k.value}
                </div>
                <div className="mt-1 text-[11.5px]" style={{ color: C.muted }}>
                  {k.label}
                </div>
                <div className="mt-3">
                  <Spark data={k.spark} tone={tone} />
                </div>
              </Panel>
            );
          })}
        </div>
      </section>

      {/* Top-match als altaarstuk */}
      <section>
        <Kapitaal sub="Beste match">Voor jou</Kapitaal>
        <button
          onClick={onOpen}
          className="group mt-6 block w-full text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
        >
          <Panel
            tone="azurite"
            className="flex flex-col gap-5 p-5 transition-transform group-hover:-translate-y-0.5 motion-reduce:group-hover:translate-y-0 sm:flex-row sm:items-center"
          >
            <div
              className="flex h-20 w-20 shrink-0 flex-col items-center justify-center rounded-full"
              style={{
                background: C.azurite,
                color: C.plaster,
                boxShadow: "inset 0 -4px 8px rgba(0,0,0,0.22)",
              }}
              aria-hidden="true"
            >
              <span className="text-[26px] font-normal tabular-nums leading-none" style={serif}>
                {top.match}
              </span>
              <span className="text-[9px] uppercase tracking-[0.2em]">match</span>
            </div>
            <div className="min-w-0 flex-1">
              <h3
                className="text-[22px] font-normal leading-tight"
                style={{ ...serif, color: C.ink }}
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
                    className="rounded-full px-2.5 py-0.5 text-[11px]"
                    style={{
                      background: C.plaster,
                      color: C.inkSoft,
                      border: `1px solid ${C.line}`,
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
              style={{ color: C.azurite }}
              aria-hidden="true"
            />
          </Panel>
        </button>
      </section>
    </div>
  );
}

function MatchArc({ value }: { value: number }) {
  return (
    <div className="flex items-center gap-2">
      <div
        className="relative h-1.5 w-24 overflow-hidden rounded-full"
        style={{ background: C.line }}
        aria-hidden="true"
      >
        <div
          className="absolute inset-y-0 left-0 rounded-full"
          style={{ width: `${value}%`, background: C.terracotta }}
        />
      </div>
      <span className="text-[13px] font-medium tabular-nums" style={{ color: C.terracotta }}>
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
      <Kapitaal sub="Open opdrachten">Marktplaats</Kapitaal>

      <Panel className="flex items-center gap-3 px-4 py-1">
        <Search size={17} style={{ color: C.muted }} aria-hidden="true" />
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Zoek op titel, plaats of opdrachtgever…"
          aria-label="Opdrachten zoeken"
          className="w-full bg-transparent py-2.5 text-[14px] outline-none placeholder:opacity-50"
          style={{ color: C.ink }}
        />
        <span className="shrink-0 text-[12px] tabular-nums" style={{ color: C.muted }}>
          {filtered.length}
        </span>
      </Panel>

      {filtered.length === 0 ? (
        <Panel className="flex flex-col items-center justify-center gap-3 p-14 text-center">
          <Search size={26} style={{ color: C.muted }} aria-hidden="true" />
          <p className="text-[22px] font-normal" style={{ ...serif, color: C.ink }}>
            Geen panelen gevonden
          </p>
          <p className="max-w-xs text-[13px]" style={{ color: C.muted }}>
            Niets past bij “{q}”. Verruim je zoekopdracht of beschikbaarheid.
          </p>
          <button
            onClick={() => setQ("")}
            className="mt-2 inline-flex items-center gap-2 rounded-full px-4 py-2 text-[12px] font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
            style={{ background: C.terracotta, color: C.plaster }}
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
                <Panel className="flex flex-col gap-4 p-4 transition-transform group-hover:-translate-y-0.5 motion-reduce:group-hover:translate-y-0 sm:flex-row sm:items-center">
                  <div className="min-w-0 flex-1">
                    <h3
                      className="text-[18px] font-normal leading-tight"
                      style={{ ...serif, color: C.ink }}
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
                          className="rounded-full px-2 py-0.5 text-[10.5px]"
                          style={{
                            background: C.plaster,
                            color: C.inkSoft,
                            border: `1px solid ${C.line}`,
                          }}
                        >
                          {t}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <MatchArc value={o.match} />
                    <ArrowRight
                      size={19}
                      className="shrink-0 transition-transform group-hover:translate-x-1 motion-reduce:group-hover:translate-x-0"
                      style={{ color: C.terracotta }}
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
            className="rounded-full px-2.5 py-0.5 text-[11px] font-medium"
            style={{ background: C.terracotta, color: C.plaster }}
          >
            {opdracht.match}% match
          </span>
        </div>
        <h1
          className="mx-auto mt-4 max-w-2xl text-[34px] font-normal leading-[1.04] sm:text-[46px]"
          style={{ ...serif, color: C.ink }}
        >
          {opdracht.titel}
        </h1>
        <p className="mt-3 text-[13.5px]" style={{ color: C.muted }}>
          {opdracht.opdrachtgever} · {opdracht.plaats}
        </p>
      </section>

      {/* Feiten als vier kolommen (klassieke gevel) */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {[
          { l: "Tarief", v: opdracht.tarief },
          { l: "Omvang", v: opdracht.uren },
          { l: "Start", v: opdracht.start },
          { l: "Match", v: `${opdracht.match}%` },
        ].map((m) => (
          <Panel key={m.l} className="p-4 text-center">
            <div
              className="text-[22px] font-normal tabular-nums leading-none"
              style={{ ...serif, color: C.ink }}
            >
              {m.v}
            </div>
            <div
              className="mt-2 text-[11px] uppercase tracking-[0.18em]"
              style={{ color: C.muted }}
            >
              {m.l}
            </div>
          </Panel>
        ))}
      </div>

      {/* Redenen — twee fresco-panelen, terracotta vs azuriet */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <Panel tone="azurite" className="p-5">
          <div
            className="inline-flex items-center gap-2 text-[12px] uppercase tracking-[0.2em]"
            style={{ color: C.azurite }}
          >
            <Check size={14} strokeWidth={2.4} aria-hidden="true" /> Wat past
          </div>
          <ul className="mt-4 space-y-3">
            {opdracht.redenen.plus.map((r) => (
              <li
                key={r}
                className="flex items-start gap-3 text-[14px] leading-snug"
                style={{ color: C.inkSoft }}
              >
                <Check
                  size={16}
                  strokeWidth={2.2}
                  className="mt-0.5 shrink-0"
                  style={{ color: C.azurite }}
                  aria-hidden="true"
                />
                {r}
              </li>
            ))}
          </ul>
        </Panel>
        <Panel tone="terracotta" className="p-5">
          <div
            className="inline-flex items-center gap-2 text-[12px] uppercase tracking-[0.2em]"
            style={{ color: C.terracotta }}
          >
            <AlertTriangle size={14} strokeWidth={2.4} aria-hidden="true" /> Aandacht
          </div>
          <ul className="mt-4 space-y-3">
            {opdracht.redenen.min.map((r) => (
              <li
                key={r}
                className="flex items-start gap-3 text-[14px] leading-snug"
                style={{ color: C.inkSoft }}
              >
                <span
                  className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full"
                  style={{ background: C.terracotta }}
                  aria-hidden="true"
                />
                {r}
              </li>
            ))}
          </ul>
        </Panel>
      </div>

      <div className="flex flex-col items-center gap-3 pt-2 sm:flex-row sm:justify-center">
        <button
          className="group inline-flex w-full items-center justify-center gap-2.5 rounded-full px-7 py-3.5 text-[14px] font-medium transition-all hover:gap-3.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 motion-reduce:hover:gap-2.5 sm:w-auto"
          style={{ background: C.terracotta, color: C.plaster }}
        >
          Reageer op opdracht <ArrowRight size={16} aria-hidden="true" />
        </button>
        <button
          className="inline-flex w-full items-center justify-center gap-2 rounded-full px-6 py-3.5 text-[14px] font-medium transition-opacity hover:opacity-70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 sm:w-auto"
          style={{ border: `1px solid ${C.lineStrong}`, color: C.ink }}
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
    <div className="space-y-8">
      <Kapitaal sub="Vertrouwen">Verificatie</Kapitaal>

      {/* Vertrouwens-tondo: cirkelvormige voortgang als fresco-medaillon */}
      <Panel className="flex flex-col items-center gap-6 p-6 sm:flex-row sm:items-center">
        <div className="relative h-28 w-28 shrink-0" aria-hidden="true">
          <svg viewBox="0 0 36 36" className="h-full w-full -rotate-90">
            <circle cx="18" cy="18" r="15.5" fill="none" stroke={C.line} strokeWidth="3" />
            <circle
              cx="18"
              cy="18"
              r="15.5"
              fill="none"
              stroke={C.azurite}
              strokeWidth="3"
              strokeLinecap="round"
              strokeDasharray={`${(pct / 100) * 97.4} 97.4`}
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span
              className="text-[26px] font-normal tabular-nums leading-none"
              style={{ ...serif, color: C.ink }}
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
            style={{ color: C.azurite }}
          >
            <ShieldCheck size={15} strokeWidth={2} aria-hidden="true" /> {PROFIEL.trust}
          </div>
          <p className="mt-2 max-w-md text-[14px] leading-relaxed" style={{ color: C.inkSoft }}>
            {verified} van {CREDENTIALS.length} credentials volledig geverifieerd. Eén dossier
            vraagt binnenkort actie — vernieuw op tijd om verifieerbaar te blijven.
          </p>
        </div>
      </Panel>

      <ul className="space-y-3">
        {CREDENTIALS.map((c) => {
          const st = statusMeta(c.status);
          return (
            <li key={c.naam}>
              <Panel className="flex items-center gap-4 p-4">
                <span
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full"
                  style={{ background: C.plaster, border: `1px solid ${st.tone}`, color: st.tone }}
                  aria-hidden="true"
                >
                  <st.Icon size={17} strokeWidth={2.2} />
                </span>
                <div className="min-w-0 flex-1">
                  <div
                    className="text-[15.5px] font-normal leading-tight"
                    style={{ ...serif, color: C.ink }}
                  >
                    {c.naam}
                  </div>
                  <div className="mt-0.5 text-[12px]" style={{ color: C.muted }}>
                    {c.detail}
                  </div>
                </div>
                <span
                  className="inline-flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1 text-[11px] font-medium"
                  style={{ background: C.plaster, color: st.tone, border: `1px solid ${st.tone}` }}
                >
                  <st.Icon size={12} strokeWidth={2.4} aria-hidden="true" />
                  <span className="hidden sm:inline">{st.label}</span>
                </span>
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
    <div className="space-y-8">
      <Kapitaal sub="De volgende beste stap">Volgende acties</Kapitaal>
      <ol className="space-y-3">
        {sorted.map((a, i) => {
          const warn = a.urgentie === "warning";
          const tone = warn ? C.terracotta : C.azurite;
          return (
            <li key={a.titel}>
              <Panel
                tone={warn ? "terracotta" : "plain"}
                className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center"
              >
                <span
                  className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-[17px] font-normal tabular-nums"
                  style={{
                    ...serif,
                    background: C.plaster,
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
                        strokeWidth={2.2}
                        style={{ color: tone }}
                        aria-hidden="true"
                      />
                    ) : (
                      <Sparkle
                        size={14}
                        strokeWidth={2.2}
                        style={{ color: tone }}
                        aria-hidden="true"
                      />
                    )}
                    <h3
                      className="text-[17px] font-normal leading-tight"
                      style={{ ...serif, color: C.ink }}
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
                  className="shrink-0 self-start rounded-full px-5 py-2.5 text-[12.5px] font-medium transition-all hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 sm:self-center"
                  style={{ background: tone, color: C.plaster }}
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
    if (status === "Betaald") return C.azurite;
    if (status === "Openstaand") return C.terracotta;
    return C.muted;
  };
  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <Kapitaal sub="Omzet">Facturen</Kapitaal>
        <button
          className="inline-flex items-center gap-2 rounded-full px-4 py-2.5 text-[12.5px] font-medium transition-all hover:gap-3 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 motion-reduce:hover:gap-2"
          style={{ background: C.terracotta, color: C.plaster }}
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
                  className={`px-4 py-3 text-[11px] uppercase tracking-[0.16em] ${i === 4 ? "text-right" : ""}`}
                  style={{ color: C.muted, fontWeight: 500 }}
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
                  style={{ borderBottom: `1px solid ${C.line}` }}
                >
                  <td
                    className="px-4 py-3.5 text-[12.5px] tabular-nums"
                    style={{ color: C.inkSoft }}
                  >
                    {f.nr}
                  </td>
                  <td className="px-4 py-3.5 text-[14px]" style={{ color: C.ink }}>
                    {f.klant}
                  </td>
                  <td className="px-4 py-3.5 text-[12.5px] tabular-nums" style={{ color: C.muted }}>
                    {f.datum}
                  </td>
                  <td className="px-4 py-3.5">
                    <span
                      className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[11px] font-medium"
                      style={{ color: tone, border: `1px solid ${tone}` }}
                    >
                      <span
                        className="h-1.5 w-1.5 rounded-full"
                        style={{ background: tone }}
                        aria-hidden="true"
                      />
                      {f.status}
                    </span>
                  </td>
                  <td
                    className="px-4 py-3.5 text-right text-[15px] font-normal tabular-nums"
                    style={{ ...serif, color: C.ink }}
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
                className="px-4 py-4 text-[11px] uppercase tracking-[0.2em]"
                style={{ color: C.muted }}
              >
                Totaal betaald
              </td>
              <td
                className="px-4 py-4 text-right text-[20px] font-normal tabular-nums"
                style={{ ...serif, color: C.azurite }}
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
