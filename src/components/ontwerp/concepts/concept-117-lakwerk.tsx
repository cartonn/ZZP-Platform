"use client";

// Concept 117 — "Lakwerk" · Japans urushi-lakwerk met maki-e goud.
// Diep gepolijst zwart-lak oppervlak (#0b0a09) dat licht vangt via warm-zwarte
// diepte-gradients, met maki-e goudpoeder-motieven: fijne gouden hairlines, gestrooide
// goud-flecks en gepolijste lineaire glans. Eén dieprood cinnaber-accent (rood urushi).
// Quiet luxury van de hoogste orde — ingetogen, ambachtelijk, extreem premium.
// Koppen in verfijnde serif (Instrument Serif) met veel lucht; UI in Inter.
// Onderscheidend van Marmer (klassiek steen), Nachtdienst (amber comfort-dark) en
// Karbon (OLED expressief): dit is GEPOLIJSTE ZWARTE LAK met MAKI-E GOUDPOEDER.

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
  MapPin,
  Calendar,
  Wallet,
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

// Urushi-lak & maki-e palet.
const C = {
  lacquer: "#0b0a09", // diep gepolijst zwart-lak
  lacquerRaise: "#141210", // iets opgelicht paneel-lak
  lacquerHi: "#1b1815", // hover / verhoogd
  gold: "#c9a24a", // maki-e goud
  goldBright: "#e0c477", // gepolijste goud-highlight
  goldSoft: "rgba(201,162,74,0.55)",
  cinnaber: "#9c2f28", // rood urushi (cinnaber)
  cinnaberBright: "#c24a40",
  ivory: "#efe7d3", // warm ivoor tekst op lak
  ivorySoft: "#c9bfa8",
  muted: "#8a7f6b", // gedempt goudgrijs
  hair: "rgba(201,162,74,0.22)", // gouden hairline
  hairSoft: "rgba(201,162,74,0.12)",
};

const serif = { fontFamily: "var(--font-lab-instrument-serif)" };
const ui = { fontFamily: "var(--font-lab-inter)" };

// Lak-oppervlak: warm-zwarte diepte-gradients (gepolijste lak vangt licht) +
// zeer subtiele gestrooide goud-flecks als radiale speldenpunten.
const lacquerSurface =
  "radial-gradient(130% 100% at 16% 0%, rgba(201,162,74,0.10), transparent 46%)," +
  "radial-gradient(120% 90% at 88% 8%, rgba(156,47,40,0.10), transparent 42%)," +
  "radial-gradient(100% 120% at 50% 120%, rgba(201,162,74,0.06), transparent 55%)," +
  "radial-gradient(1px 1px at 22% 30%, rgba(224,196,119,0.5), transparent 60%)," +
  "radial-gradient(1px 1px at 74% 22%, rgba(224,196,119,0.4), transparent 60%)," +
  "radial-gradient(1px 1px at 40% 66%, rgba(224,196,119,0.35), transparent 60%)," +
  "radial-gradient(1px 1px at 86% 70%, rgba(224,196,119,0.4), transparent 60%)," +
  "radial-gradient(1px 1px at 12% 82%, rgba(224,196,119,0.3), transparent 60%)";

// Gepolijste glans-highlight voor lak-panelen (subtiele lineaire lichtstreep).
const polish = "linear-gradient(135deg, rgba(255,251,240,0.05) 0%, rgba(255,251,240,0) 32%)";

function statusMeta(s: CredStatus): { label: string; Icon: LucideIcon; tone: string } {
  switch (s) {
    case "VERIFIED":
      return { label: "Verzegeld", Icon: Check, tone: C.gold };
    case "SUBMITTED":
      return { label: "Onder de kwast", Icon: Clock, tone: C.goldBright };
    case "EXPIRING":
      return { label: "Vraagt herlaklaag", Icon: AlertTriangle, tone: C.cinnaberBright };
    case "REJECTED":
      return { label: "Afgekeurd", Icon: XCircle, tone: C.cinnaber };
  }
}

// Fijne serif-kop met een gouden maki-e hairline eronder.
function Kop({ children, sub }: { children: React.ReactNode; sub?: string }) {
  return (
    <div>
      {sub && (
        <div
          className="mb-2 text-[11px] uppercase tracking-[0.34em]"
          style={{ ...ui, color: C.gold }}
        >
          {sub}
        </div>
      )}
      <h2
        className="text-[30px] font-normal leading-none tracking-[0.01em] sm:text-[38px]"
        style={{ ...serif, color: C.ivory }}
      >
        {children}
      </h2>
      <div className="mt-3.5 flex items-center gap-2" aria-hidden="true">
        <span
          className="h-px w-12"
          style={{ background: `linear-gradient(90deg, ${C.goldBright}, ${C.goldSoft})` }}
        />
        <span className="h-1 w-1 rotate-45" style={{ background: C.goldBright }} />
        <span className="h-px flex-1" style={{ background: C.hairSoft }} />
      </div>
    </div>
  );
}

// Maki-e lak-paneel: verhoogd lak-oppervlak met gouden hairline en gepolijste glans.
function Panel({
  children,
  className = "",
  tone = "plain",
}: {
  children: React.ReactNode;
  className?: string;
  tone?: "plain" | "gold" | "cinnaber";
}) {
  const border =
    tone === "gold" ? C.goldSoft : tone === "cinnaber" ? "rgba(156,47,40,0.5)" : C.hair;
  return (
    <div
      className={`relative overflow-hidden rounded-[6px] ${className}`}
      style={{
        background: C.lacquerRaise,
        backgroundImage: polish,
        border: `1px solid ${border}`,
        boxShadow:
          "inset 0 1px 0 rgba(255,251,240,0.05), inset 0 0 40px rgba(0,0,0,0.55), 0 10px 26px rgba(0,0,0,0.5)",
      }}
    >
      {children}
    </div>
  );
}

// Sparkline in maki-e goud.
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
        strokeWidth={2.5}
        strokeLinecap="round"
        strokeLinejoin="round"
        vectorEffect="non-scaling-stroke"
      />
    </svg>
  );
}

// Klein maki-e zegel — gouden ring met kern-icoon (voor verificatie-badges).
function Zegel({ Icon, tone }: { Icon: LucideIcon; tone: string }) {
  return (
    <span
      className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-full"
      style={{
        background: "radial-gradient(circle at 32% 28%, rgba(224,196,119,0.16), rgba(11,10,9,0.9))",
        border: `1px solid ${tone}`,
        boxShadow: `inset 0 0 8px rgba(0,0,0,0.6), 0 0 0 3px rgba(201,162,74,0.07)`,
        color: tone,
      }}
      aria-hidden="true"
    >
      <Icon size={16} strokeWidth={2.2} />
    </span>
  );
}

export function Concept117() {
  const [screen, setScreen] = useState<ScreenKey>("dashboard");
  const active = OPDRACHTEN[0] as Opdracht;

  return (
    <div
      className="min-h-[680px] w-full antialiased"
      style={{ ...ui, background: C.lacquer, backgroundImage: lacquerSurface, color: C.ivory }}
    >
      {/* Kop — lak-fronton met maki-e merkteken */}
      <header className="mx-auto flex max-w-5xl items-center justify-between px-5 pt-9 md:px-10">
        <div className="flex items-center gap-3.5">
          <span
            className="flex h-11 w-11 items-center justify-center rounded-full"
            style={{
              background: "radial-gradient(circle at 34% 28%, #e0c477, #9a7a34)",
              color: C.lacquer,
              boxShadow: "inset 0 -3px 6px rgba(0,0,0,0.4), 0 0 0 3px rgba(201,162,74,0.08)",
            }}
            aria-hidden="true"
          >
            <Sparkle size={19} strokeWidth={1.8} />
          </span>
          <div className="leading-none">
            <div
              className="text-[26px] font-normal tracking-[0.06em]"
              style={{ ...serif, color: C.ivory }}
            >
              Lakwerk
            </div>
            <div
              className="mt-1 text-[10px] uppercase tracking-[0.32em]"
              style={{ color: C.muted }}
            >
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
            className="flex h-11 w-11 items-center justify-center rounded-full text-[13px] font-medium"
            style={{
              ...serif,
              background: C.lacquerRaise,
              color: C.goldBright,
              border: `1px solid ${C.goldSoft}`,
              boxShadow: "inset 0 0 12px rgba(0,0,0,0.6)",
            }}
            aria-hidden="true"
          >
            {PROFIEL.initialen}
          </span>
        </div>
      </header>

      {/* Navigatie — gouden hairline-onderstreping bij actief */}
      <nav
        className="mx-auto mt-7 flex max-w-5xl items-center gap-1 overflow-x-auto px-5 pb-4 md:px-10"
        aria-label="Hoofdnavigatie"
        style={{ borderBottom: `1px solid ${C.hairSoft}` }}
      >
        {SCREENS.map((s) => {
          const on = s.key === screen;
          return (
            <button
              key={s.key}
              onClick={() => setScreen(s.key)}
              aria-current={on ? "page" : undefined}
              className="relative shrink-0 rounded-md px-3.5 py-2 text-[13px] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
              style={{ color: on ? C.goldBright : C.muted, fontWeight: on ? 600 : 400 }}
            >
              {s.label}
              {on && (
                <span
                  className="absolute -bottom-[1px] left-2 right-2 h-[2px] rounded-full"
                  style={{ background: `linear-gradient(90deg, ${C.gold}, ${C.goldBright})` }}
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
  return (
    <div className="space-y-12">
      {/* Lak-fronton: groet in serif met veel lucht */}
      <section>
        <div className="text-[11px] uppercase tracking-[0.34em]" style={{ color: C.gold }}>
          Vandaag · {PROFIEL.plaats}
        </div>
        <h1
          className="mt-4 max-w-2xl text-[40px] font-normal leading-[1.03] tracking-[0.01em] sm:text-[54px]"
          style={{ ...serif, color: C.ivory }}
        >
          Goedemorgen, {PROFIEL.naam.split(" ")[0]}
        </h1>
        <p className="mt-4 max-w-md text-[14px] leading-relaxed" style={{ color: C.ivorySoft }}>
          Je lakwerk is gepolijst. Eén laag vraagt vandaag je hand — de rest kan rustig drogen.
        </p>
      </section>

      {/* Primaire actie — cinnaber-accent lak-paneel */}
      <Panel tone="cinnaber" className="p-6">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0">
            <div
              className="inline-flex items-center gap-2 text-[11px] uppercase tracking-[0.24em]"
              style={{ color: C.cinnaberBright }}
            >
              <AlertTriangle size={13} strokeWidth={2} aria-hidden="true" /> Vraagt aandacht
            </div>
            <h2
              className="mt-2 text-[24px] font-normal leading-tight sm:text-[28px]"
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
            className="group inline-flex shrink-0 items-center gap-2.5 rounded-full px-6 py-3 text-[13px] font-medium transition-all hover:gap-3.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 motion-reduce:hover:gap-2.5"
            style={{
              background: `linear-gradient(135deg, ${C.cinnaberBright}, ${C.cinnaber})`,
              color: C.ivory,
            }}
          >
            {primair.cta}
            <ArrowRight size={16} aria-hidden="true" />
          </button>
        </div>
      </Panel>

      {/* KPI-lakpanelen met gepolijste glans */}
      <section>
        <Kop sub="In cijfers">Prestatie</Kop>
        <div className="mt-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
          {KPIS.map((k) => (
            <Panel
              key={k.label}
              className="group p-4 transition-transform hover:-translate-y-1 motion-reduce:hover:translate-y-0"
            >
              <div className="flex items-start justify-between">
                <span
                  className="h-2.5 w-2.5 rounded-full"
                  style={{
                    background: `radial-gradient(circle at 30% 30%, ${C.goldBright}, ${C.gold})`,
                  }}
                  aria-hidden="true"
                />
                <span
                  className="text-[11px] tabular-nums"
                  style={{ color: k.up ? C.goldBright : C.cinnaberBright }}
                >
                  {k.up ? "▲" : "▼"} {k.trend}
                </span>
              </div>
              <div
                className="mt-3 text-[30px] font-normal tabular-nums leading-none tracking-[0.01em]"
                style={{ ...serif, color: C.ivory }}
              >
                {k.value}
              </div>
              <div className="mt-1 text-[11.5px]" style={{ color: C.muted }}>
                {k.label}
              </div>
              <div className="mt-3">
                <Spark data={k.spark} tone={C.gold} />
              </div>
            </Panel>
          ))}
        </div>
      </section>

      {/* Top-match als maki-e altaarstuk */}
      <section>
        <Kop sub="Beste match">Voor jou</Kop>
        <button
          onClick={onOpen}
          className="group mt-6 block w-full text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
        >
          <Panel
            tone="gold"
            className="flex flex-col gap-5 p-5 transition-transform group-hover:-translate-y-0.5 motion-reduce:group-hover:translate-y-0 sm:flex-row sm:items-center"
          >
            <div
              className="flex h-20 w-20 shrink-0 flex-col items-center justify-center rounded-full"
              style={{
                background: "radial-gradient(circle at 32% 26%, rgba(224,196,119,0.2), #0b0a09)",
                color: C.goldBright,
                border: `1px solid ${C.goldSoft}`,
                boxShadow: "inset 0 0 14px rgba(0,0,0,0.7)",
              }}
              aria-hidden="true"
            >
              <span className="text-[26px] font-normal tabular-nums leading-none" style={serif}>
                {top.match}
              </span>
              <span className="text-[9px] uppercase tracking-[0.2em]" style={{ color: C.muted }}>
                match
              </span>
            </div>
            <div className="min-w-0 flex-1">
              <h3
                className="text-[22px] font-normal leading-tight"
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
                    className="rounded-full px-2.5 py-0.5 text-[11px]"
                    style={{
                      background: C.lacquerHi,
                      color: C.ivorySoft,
                      border: `1px solid ${C.hairSoft}`,
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
              style={{ color: C.gold }}
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
        style={{ background: C.hairSoft }}
        aria-hidden="true"
      >
        <div
          className="absolute inset-y-0 left-0 rounded-full"
          style={{
            width: `${value}%`,
            background: `linear-gradient(90deg, ${C.gold}, ${C.goldBright})`,
          }}
        />
      </div>
      <span className="text-[13px] font-medium tabular-nums" style={{ color: C.goldBright }}>
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

      <Panel className="flex items-center gap-3 px-4 py-1">
        <Search size={17} style={{ color: C.gold }} aria-hidden="true" />
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
      </Panel>

      {filtered.length === 0 ? (
        <Panel className="flex flex-col items-center justify-center gap-3 p-14 text-center">
          <Search size={26} style={{ color: C.muted }} aria-hidden="true" />
          <p className="text-[22px] font-normal" style={{ ...serif, color: C.ivory }}>
            Geen lagen gevonden
          </p>
          <p className="max-w-xs text-[13px]" style={{ color: C.muted }}>
            Niets past bij “{q}”. Verruim je zoekopdracht of beschikbaarheid.
          </p>
          <button
            onClick={() => setQ("")}
            className="mt-2 inline-flex items-center gap-2 rounded-full px-4 py-2 text-[12px] font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
            style={{
              background: `linear-gradient(135deg, ${C.gold}, ${C.goldBright})`,
              color: C.lacquer,
            }}
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
                          className="rounded-full px-2 py-0.5 text-[10.5px]"
                          style={{
                            background: C.lacquerHi,
                            color: C.ivorySoft,
                            border: `1px solid ${C.hairSoft}`,
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
                      style={{ color: C.gold }}
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
  const feiten = [
    { l: "Tarief", v: opdracht.tarief, Icon: Wallet },
    { l: "Omvang", v: opdracht.uren, Icon: Clock },
    { l: "Start", v: opdracht.start, Icon: Calendar },
    { l: "Plaats", v: opdracht.plaats, Icon: MapPin },
  ];
  return (
    <div className="space-y-8">
      <button
        onClick={onBack}
        className="inline-flex items-center gap-2 text-[12.5px] transition-opacity hover:opacity-60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
        style={{ color: C.muted }}
      >
        <ArrowRight size={14} className="rotate-180" aria-hidden="true" /> Terug naar marktplaats
      </button>

      <section>
        <div className="flex items-center gap-3">
          <span className="text-[11px] uppercase tracking-[0.3em]" style={{ color: C.muted }}>
            {opdracht.id}
          </span>
          <span
            className="rounded-full px-2.5 py-0.5 text-[11px] font-medium"
            style={{
              background: `linear-gradient(135deg, ${C.gold}, ${C.goldBright})`,
              color: C.lacquer,
            }}
          >
            {opdracht.match}% match
          </span>
        </div>
        <h1
          className="mt-4 max-w-2xl text-[34px] font-normal leading-[1.05] sm:text-[46px]"
          style={{ ...serif, color: C.ivory }}
        >
          {opdracht.titel}
        </h1>
        <p className="mt-3 text-[13.5px]" style={{ color: C.muted }}>
          {opdracht.opdrachtgever} · {opdracht.plaats}
        </p>
      </section>

      {/* Feiten als vier lak-panelen */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {feiten.map((m) => (
          <Panel key={m.l} className="p-4">
            <m.Icon size={16} style={{ color: C.gold }} aria-hidden="true" />
            <div
              className="mt-3 text-[20px] font-normal tabular-nums leading-none"
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
          </Panel>
        ))}
      </div>

      {/* Redenen — goud (past) vs cinnaber (aandacht) */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <Panel tone="gold" className="p-5">
          <div
            className="inline-flex items-center gap-2 text-[12px] uppercase tracking-[0.2em]"
            style={{ color: C.gold }}
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
                  style={{ color: C.gold }}
                  aria-hidden="true"
                />
                {r}
              </li>
            ))}
          </ul>
        </Panel>
        <Panel tone="cinnaber" className="p-5">
          <div
            className="inline-flex items-center gap-2 text-[12px] uppercase tracking-[0.2em]"
            style={{ color: C.cinnaberBright }}
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
                  className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full"
                  style={{ background: C.cinnaberBright }}
                  aria-hidden="true"
                />
                {r}
              </li>
            ))}
          </ul>
        </Panel>
      </div>

      <div className="flex flex-col items-center gap-3 pt-2 sm:flex-row">
        <button
          className="group inline-flex w-full items-center justify-center gap-2.5 rounded-full px-7 py-3.5 text-[14px] font-medium transition-all hover:gap-3.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 motion-reduce:hover:gap-2.5 sm:w-auto"
          style={{
            background: `linear-gradient(135deg, ${C.gold}, ${C.goldBright})`,
            color: C.lacquer,
          }}
        >
          Reageer op opdracht <ArrowRight size={16} aria-hidden="true" />
        </button>
        <button
          className="inline-flex w-full items-center justify-center gap-2 rounded-full px-6 py-3.5 text-[14px] font-medium transition-opacity hover:opacity-70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 sm:w-auto"
          style={{ border: `1px solid ${C.goldSoft}`, color: C.ivory }}
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
      <Kop sub="Vertrouwen">Verificatie</Kop>

      {/* Vertrouwens-medaillon: gouden ring-voortgang */}
      <Panel className="flex flex-col items-center gap-6 p-6 sm:flex-row sm:items-center">
        <div className="relative h-28 w-28 shrink-0" aria-hidden="true">
          <svg viewBox="0 0 36 36" className="h-full w-full -rotate-90">
            <circle cx="18" cy="18" r="15.5" fill="none" stroke={C.hairSoft} strokeWidth="3" />
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
              className="text-[26px] font-normal tabular-nums leading-none"
              style={{ ...serif, color: C.ivory }}
            >
              {pct}%
            </span>
            <span className="text-[9px] uppercase tracking-[0.2em]" style={{ color: C.muted }}>
              verzegeld
            </span>
          </div>
        </div>
        <div className="text-center sm:text-left">
          <div
            className="inline-flex items-center gap-2 text-[12px] uppercase tracking-[0.24em]"
            style={{ color: C.gold }}
          >
            <ShieldCheck size={15} strokeWidth={2} aria-hidden="true" /> {PROFIEL.trust}
          </div>
          <p className="mt-2 max-w-md text-[14px] leading-relaxed" style={{ color: C.ivorySoft }}>
            {verified} van {CREDENTIALS.length} dossiers volledig verzegeld met een maki-e zegel.
            Eén laag vraagt binnenkort een verse herlaklaag — vernieuw op tijd om verzegeld te
            blijven.
          </p>
        </div>
      </Panel>

      <ul className="space-y-3">
        {CREDENTIALS.map((c) => {
          const st = statusMeta(c.status);
          return (
            <li key={c.naam}>
              <Panel className="flex items-center gap-4 p-4">
                <Zegel Icon={st.Icon} tone={st.tone} />
                <div className="min-w-0 flex-1">
                  <div
                    className="text-[15.5px] font-normal leading-tight"
                    style={{ ...serif, color: C.ivory }}
                  >
                    {c.naam}
                  </div>
                  <div className="mt-0.5 text-[12px]" style={{ color: C.muted }}>
                    {c.detail}
                  </div>
                </div>
                <span
                  className="inline-flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1 text-[11px] font-medium"
                  style={{
                    background: C.lacquerHi,
                    color: st.tone,
                    border: `1px solid ${st.tone}`,
                  }}
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
      <Kop sub="De volgende beste stap">Volgende acties</Kop>
      <ol className="space-y-3">
        {sorted.map((a, i) => {
          const warn = a.urgentie === "warning";
          const tone = warn ? C.cinnaberBright : C.gold;
          return (
            <li key={a.titel}>
              <Panel
                tone={warn ? "cinnaber" : "plain"}
                className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center"
              >
                <span
                  className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-[17px] font-normal tabular-nums"
                  style={{
                    ...serif,
                    background: C.lacquerHi,
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
                  className="shrink-0 self-start rounded-full px-5 py-2.5 text-[12.5px] font-medium transition-all hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 sm:self-center"
                  style={{
                    background: warn
                      ? `linear-gradient(135deg, ${C.cinnaberBright}, ${C.cinnaber})`
                      : `linear-gradient(135deg, ${C.gold}, ${C.goldBright})`,
                    color: warn ? C.ivory : C.lacquer,
                  }}
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
    if (status === "Betaald") return C.gold;
    if (status === "Openstaand") return C.cinnaberBright;
    return C.muted;
  };
  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <Kop sub="Omzet">Facturen</Kop>
        <button
          className="inline-flex items-center gap-2 rounded-full px-4 py-2.5 text-[12.5px] font-medium transition-all hover:gap-3 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 motion-reduce:hover:gap-2"
          style={{
            background: `linear-gradient(135deg, ${C.gold}, ${C.goldBright})`,
            color: C.lacquer,
          }}
        >
          <Plus size={15} aria-hidden="true" /> Nieuwe factuur
        </button>
      </div>

      <Panel className="overflow-x-auto">
        <table className="w-full min-w-[560px] border-collapse text-left">
          <thead>
            <tr style={{ borderBottom: `1px solid ${C.hair}` }}>
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
                  className="transition-colors hover:bg-white/[0.02]"
                  style={{ borderBottom: `1px solid ${C.hairSoft}` }}
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
                    style={{ ...serif, color: C.ivory }}
                  >
                    {f.bedrag}
                  </td>
                </tr>
              );
            })}
          </tbody>
          <tfoot>
            <tr style={{ borderTop: `1px solid ${C.hair}` }}>
              <td
                colSpan={4}
                className="px-4 py-4 text-[11px] uppercase tracking-[0.2em]"
                style={{ color: C.muted }}
              >
                Totaal betaald
              </td>
              <td
                className="px-4 py-4 text-right text-[20px] font-normal tabular-nums"
                style={{ ...serif, color: C.goldBright }}
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
