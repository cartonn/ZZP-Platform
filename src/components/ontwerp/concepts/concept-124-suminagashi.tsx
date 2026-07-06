"use client";

// Concept 124 — "Suminagashi" · Japanse drijvende-inkt marmering.
// Kalme rijstpapier-achtergrond (#f3f1ec) met diep indigo-inkt (#2b3a67): zachte,
// concentrische, DRIJVENDE inkt-ringen en aderpatronen (repeating-radial-gradients +
// SVG-contourlijnen), zoals inkt die op stil water uitwaaiert. Laag-prikkelend, sereen,
// meditatief — vertrouwen via rust. Panelen liggen als rijstpapier-vlakken met een fijne
// inkt-ader eromheen; verificatie-status met label+icoon. ONDERSCHEIDEND van natte wassing
// (Aquarel) en wabi-sabi meubel-rust (Japandi): dit zijn specifiek drijvende inkt-marmering-
// RINGEN (suminagashi). Fonts: Sora (display) + Inter (UI).

import { useState } from "react";
import {
  ArrowRight,
  Check,
  Clock,
  AlertTriangle,
  XCircle,
  Search,
  Waves,
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

// Rijstpapier / indigo-inkt palet.
const C = {
  paper: "#f3f1ec", // rijstpapier
  paperDeep: "#eae6dd", // ietsje dieper vlak
  panel: "#faf9f5", // opgelicht papiervlak
  ink: "#1c1c22", // inkt-zwart (tekst)
  inkSoft: "#5c5b63", // gedempte inkt
  inkFaint: "#8a8992", // heel licht
  indigo: "#2b3a67", // indigo-inkt accent
  indigoSoft: "#4a5a8c", // opgelicht indigo
  indigoWash: "#e6e8f0", // indigo-wassing (heel licht vlak)
  green: "#3f7d6b", // kalme jade (geverifieerd)
  amber: "#a9762c", // gedempt oker (waarschuwing)
  red: "#b0463a", // gedempt terracotta (afgewezen)
  line: "rgba(28,28,34,0.10)",
  lineStrong: "rgba(43,58,103,0.24)",
};

const display = { fontFamily: "var(--font-lab-sora)" };
const ui = { fontFamily: "var(--font-lab-inter)" };

// Drijvende inkt-ringen: concentrische banden die uitwaaieren als suminagashi op water.
const inkRings =
  "repeating-radial-gradient(circle at 22% 18%, rgba(43,58,103,0.055) 0 1.5px, transparent 1.5px 26px)," +
  "repeating-radial-gradient(circle at 82% 78%, rgba(43,58,103,0.045) 0 1.5px, transparent 1.5px 34px)," +
  "repeating-radial-gradient(circle at 60% 30%, rgba(74,90,140,0.03) 0 1px, transparent 1px 44px)";

// Zachte inkt-aderen die tussen de ringen door slingeren.
const inkVeins =
  "radial-gradient(120% 80% at 12% 0%, rgba(43,58,103,0.06), transparent 55%)," +
  "radial-gradient(120% 90% at 95% 100%, rgba(74,90,140,0.05), transparent 55%)";

// Volledige rijstpapier-achtergrond met drijvende inkt.
const paperSurface = inkRings + "," + inkVeins;

// Fijne ring-textuur voor een enkel paneel.
const panelRings =
  "repeating-radial-gradient(circle at 85% 15%, rgba(43,58,103,0.05) 0 1px, transparent 1px 15px)";

function statusMeta(s: CredStatus): { label: string; Icon: LucideIcon; tone: string } {
  switch (s) {
    case "VERIFIED":
      return { label: "Geverifieerd", Icon: Check, tone: C.green };
    case "SUBMITTED":
      return { label: "In beoordeling", Icon: Clock, tone: C.indigoSoft };
    case "EXPIRING":
      return { label: "Verloopt binnenkort", Icon: AlertTriangle, tone: C.amber };
    case "REJECTED":
      return { label: "Afgewezen", Icon: XCircle, tone: C.red };
  }
}

// Concentrische inkt-ring als SVG-contour (suminagashi-mark).
function InkMark({ size = 22, color = C.indigo }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true" fill="none">
      {[10, 7, 4.2, 1.8].map((r, i) => (
        <circle
          key={r}
          cx="12"
          cy="12"
          r={r}
          stroke={color}
          strokeWidth={i === 0 ? 1.4 : 1}
          opacity={0.55 + i * 0.12}
        />
      ))}
    </svg>
  );
}

// Rijstpapier-paneel met fijne inkt-ring-textuur.
function Paper({
  children,
  className = "",
  rings = false,
  accent = C.line,
  interactive = false,
}: {
  children: React.ReactNode;
  className?: string;
  rings?: boolean;
  accent?: string;
  interactive?: boolean;
}) {
  return (
    <div
      className={`relative overflow-hidden rounded-2xl ${
        interactive
          ? "transition-transform duration-300 hover:-translate-y-0.5 motion-reduce:hover:translate-y-0"
          : ""
      } ${className}`}
      style={{
        background: C.panel,
        border: `1px solid ${accent}`,
        boxShadow: "0 1px 0 rgba(255,255,255,0.6) inset, 0 12px 30px -22px rgba(43,58,103,0.5)",
      }}
    >
      {rings && (
        <span
          aria-hidden="true"
          className="pointer-events-none absolute inset-0"
          style={{ backgroundImage: panelRings, backgroundSize: "30px 30px" }}
        />
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
          ? { background: tone, color: C.paper }
          : { background: "rgba(43,58,103,0.05)", color: tone, border: `1px solid ${tone}` }
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

function Kop({ children, sub }: { children: React.ReactNode; sub?: string }) {
  return (
    <div>
      {sub && (
        <div
          className="mb-1.5 text-[11px] font-semibold uppercase tracking-[0.3em]"
          style={{ color: C.indigoSoft }}
        >
          {sub}
        </div>
      )}
      <div className="flex items-center gap-3">
        <h2
          className="text-[26px] font-semibold leading-none tracking-[-0.02em] sm:text-[32px]"
          style={{ ...display, color: C.ink }}
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

export function Concept124() {
  const [screen, setScreen] = useState<ScreenKey>("dashboard");
  const active = OPDRACHTEN[0] as Opdracht;

  return (
    <div
      className="min-h-[680px] w-full antialiased"
      style={{ ...ui, background: C.paper, backgroundImage: paperSurface, color: C.ink }}
    >
      {/* Kop — inkt-ring-mark op rijstpapier */}
      <header className="mx-auto flex max-w-5xl items-center justify-between px-5 pt-8 md:px-10">
        <div className="flex items-center gap-3.5">
          <span
            className="relative flex h-11 w-11 items-center justify-center rounded-full"
            style={{ background: C.paper, border: `1px solid ${C.lineStrong}` }}
            aria-hidden="true"
          >
            <InkMark size={22} />
          </span>
          <div className="leading-none">
            <div
              className="text-[20px] font-semibold tracking-[-0.01em]"
              style={{ ...display, color: C.ink }}
            >
              Suminagashi
            </div>
            <div
              className="mt-1 text-[10px] uppercase tracking-[0.3em]"
              style={{ color: C.inkSoft }}
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
            className="flex h-11 w-11 items-center justify-center rounded-full text-[13px] font-semibold"
            style={{
              background: C.indigoWash,
              color: C.indigo,
              border: `1px solid ${C.lineStrong}`,
            }}
            aria-hidden="true"
          >
            {PROFIEL.initialen}
          </span>
        </div>
      </header>

      {/* Navigatie — tab-strip met inkt-ring onder actief */}
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
              className="relative shrink-0 rounded-full px-3.5 py-2 text-[13px] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
              style={{ color: on ? C.indigo : C.inkSoft, fontWeight: on ? 700 : 500 }}
            >
              {s.label}
              {on && (
                <span
                  className="absolute -bottom-[17px] left-3 right-3 h-[2px] rounded-full"
                  style={{ background: C.indigo }}
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
  const tones = [C.indigo, C.green, C.indigoSoft, C.amber];
  return (
    <div className="space-y-10">
      <section>
        <div
          className="text-[11px] font-semibold uppercase tracking-[0.3em]"
          style={{ color: C.indigoSoft }}
        >
          Vandaag · {PROFIEL.plaats}
        </div>
        <h1
          className="mt-2 text-[32px] font-semibold leading-[1.08] tracking-[-0.03em] sm:text-[42px]"
          style={{ ...display, color: C.ink }}
        >
          Goedemorgen, {PROFIEL.naam.split(" ")[0]}
        </h1>
        <p className="mt-2 max-w-md text-[14px] leading-relaxed" style={{ color: C.inkSoft }}>
          Het water is stil. Eén inkt-druppel vraagt vandaag om aandacht — de rest waaiert rustig
          uit.
        </p>
      </section>

      {/* Primaire actie — indigo-wassing paneel */}
      <Paper rings accent={C.lineStrong} className="p-0">
        <div className="flex flex-col gap-5 p-6 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0">
            <span
              className="inline-flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.22em]"
              style={{ color: C.amber }}
            >
              <AlertTriangle size={13} strokeWidth={2.4} aria-hidden="true" /> Vraagt aandacht
            </span>
            <h2
              className="mt-2 text-[23px] font-semibold leading-tight sm:text-[27px]"
              style={{ ...display, color: C.ink }}
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
            style={{ background: C.indigo, color: C.paper }}
          >
            {primair.cta}
            <ArrowRight size={16} aria-hidden="true" />
          </button>
        </div>
      </Paper>

      {/* KPI-tegels */}
      <section>
        <Kop sub="In cijfers">Prestatie</Kop>
        <div className="mt-5 grid grid-cols-2 gap-4 lg:grid-cols-4">
          {KPIS.map((k, i) => {
            const tone = tones[i % tones.length] as string;
            return (
              <Paper key={k.label} rings interactive className="p-4">
                <div className="flex items-start justify-between">
                  <InkMark size={16} color={tone} />
                  <span
                    className="text-[11px] font-semibold tabular-nums"
                    style={{ color: k.up ? C.green : C.amber }}
                  >
                    {k.up ? "▲" : "▼"} {k.trend}
                  </span>
                </div>
                <div
                  className="mt-3 text-[26px] font-semibold tabular-nums leading-none tracking-[-0.02em]"
                  style={{ ...display, color: C.ink }}
                >
                  {k.value}
                </div>
                <div className="mt-1 text-[11.5px]" style={{ color: C.inkSoft }}>
                  {k.label}
                </div>
                <div className="mt-3">
                  <Spark data={k.spark} tone={tone} />
                </div>
              </Paper>
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
          <Paper
            interactive
            rings
            accent={C.lineStrong}
            className="flex flex-col gap-5 p-5 sm:flex-row sm:items-center"
          >
            <span
              className="relative flex h-20 w-20 shrink-0 flex-col items-center justify-center rounded-full"
              style={{
                background: C.indigoWash,
                color: C.indigo,
                border: `1px solid ${C.lineStrong}`,
              }}
              aria-hidden="true"
            >
              <span className="text-[24px] font-semibold tabular-nums leading-none" style={display}>
                {top.match}
              </span>
              <span className="text-[9px] font-semibold uppercase tracking-[0.16em]">match</span>
            </span>
            <div className="min-w-0 flex-1">
              <h3
                className="text-[20px] font-semibold leading-tight"
                style={{ ...display, color: C.ink }}
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
              style={{ color: C.indigo }}
              aria-hidden="true"
            />
          </Paper>
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
        style={{ background: "rgba(43,58,103,0.12)" }}
        aria-hidden="true"
      >
        <div
          className="absolute inset-y-0 left-0 rounded-full"
          style={{ width: `${value}%`, background: C.indigo }}
        />
      </div>
      <span className="text-[13px] font-semibold tabular-nums" style={{ color: C.indigo }}>
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

      <Paper className="flex items-center gap-3 px-4 py-1">
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
          style={{ color: C.inkSoft }}
        >
          {filtered.length}
        </span>
      </Paper>

      {filtered.length === 0 ? (
        <Paper rings className="flex flex-col items-center justify-center gap-3 p-14 text-center">
          <InkMark size={30} />
          <p className="text-[20px] font-semibold" style={{ ...display, color: C.ink }}>
            Geen opdrachten gevonden
          </p>
          <p className="max-w-xs text-[13px]" style={{ color: C.inkSoft }}>
            Niets waaiert uit bij “{q}”. Verruim je zoekopdracht of beschikbaarheid.
          </p>
          <button
            onClick={() => setQ("")}
            className="mt-2 inline-flex items-center gap-2 rounded-full px-4 py-2 text-[12px] font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
            style={{ background: C.indigo, color: C.paper }}
          >
            Zoekopdracht wissen
          </button>
        </Paper>
      ) : (
        <ul className="space-y-3">
          {filtered.map((o) => (
            <li key={o.id}>
              <button
                onClick={onOpen}
                className="group block w-full text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
              >
                <Paper
                  interactive
                  rings
                  className="flex flex-col gap-4 p-4 sm:flex-row sm:items-center"
                >
                  <div className="min-w-0 flex-1">
                    <h3
                      className="text-[18px] font-semibold leading-tight"
                      style={{ ...display, color: C.ink }}
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
                      style={{ color: C.indigo }}
                      aria-hidden="true"
                    />
                  </div>
                </Paper>
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
            className="text-[11px] font-semibold uppercase tracking-[0.2em]"
            style={{ color: C.inkSoft }}
          >
            {opdracht.id}
          </span>
          <Pill tone={C.indigo} solid>
            {opdracht.match}% match
          </Pill>
        </div>
        <h1
          className="mt-3 text-[30px] font-semibold leading-[1.1] tracking-[-0.03em] sm:text-[40px]"
          style={{ ...display, color: C.ink }}
        >
          {opdracht.titel}
        </h1>
        <p className="mt-2 text-[13.5px]" style={{ color: C.inkSoft }}>
          {opdracht.opdrachtgever} · {opdracht.plaats}
        </p>
      </section>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {feiten.map((m) => (
          <Paper key={m.l} className="p-4">
            <m.Icon size={16} style={{ color: C.indigo }} aria-hidden="true" />
            <div
              className="mt-2 text-[18px] font-semibold tabular-nums leading-none"
              style={{ ...display, color: C.ink }}
            >
              {m.v}
            </div>
            <div
              className="mt-1.5 text-[11px] uppercase tracking-[0.14em]"
              style={{ color: C.inkSoft }}
            >
              {m.l}
            </div>
          </Paper>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <Paper className="p-5" accent={C.green}>
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
        </Paper>
        <Paper className="p-5" accent={C.amber}>
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
        </Paper>
      </div>

      <div className="flex flex-col items-stretch gap-3 pt-1 sm:flex-row">
        <button
          className="group inline-flex flex-1 items-center justify-center gap-2.5 rounded-full px-7 py-3.5 text-[14px] font-semibold transition-all hover:gap-3.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 motion-reduce:hover:gap-2.5"
          style={{ background: C.indigo, color: C.paper }}
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

      {/* Suminagashi-keurmerk: concentrische inkt-ring als voortgang */}
      <Paper
        rings
        accent={C.lineStrong}
        className="flex flex-col items-center gap-6 p-6 sm:flex-row"
      >
        <div className="relative h-24 w-24 shrink-0" aria-hidden="true">
          <svg viewBox="0 0 36 36" className="h-full w-full -rotate-90">
            <circle
              cx="18"
              cy="18"
              r="15.5"
              fill="none"
              stroke="rgba(43,58,103,0.14)"
              strokeWidth="2.5"
            />
            <circle
              cx="18"
              cy="18"
              r="15.5"
              fill="none"
              stroke={C.indigo}
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeDasharray={`${(pct / 100) * 97.4} 97.4`}
            />
            <circle
              cx="18"
              cy="18"
              r="11"
              fill="none"
              stroke="rgba(43,58,103,0.12)"
              strokeWidth="1"
            />
            <circle
              cx="18"
              cy="18"
              r="7"
              fill="none"
              stroke="rgba(43,58,103,0.1)"
              strokeWidth="1"
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span
              className="text-[24px] font-semibold tabular-nums leading-none"
              style={{ ...display, color: C.ink }}
            >
              {pct}%
            </span>
            <span
              className="text-[9px] font-semibold uppercase tracking-[0.18em]"
              style={{ color: C.inkSoft }}
            >
              gedekt
            </span>
          </div>
        </div>
        <div className="text-center sm:text-left">
          <span
            className="inline-flex items-center gap-2 rounded-full px-3 py-1 text-[12px] font-semibold"
            style={{ background: "rgba(63,125,107,0.12)", color: C.green }}
          >
            <ShieldCheck size={15} strokeWidth={2.2} aria-hidden="true" /> {PROFIEL.trust}
          </span>
          <p className="mt-3 max-w-md text-[14px] leading-relaxed" style={{ color: C.inkSoft }}>
            {verified} van {CREDENTIALS.length} credentials volledig geverifieerd. Eén dossier
            vraagt binnenkort actie — vernieuw op tijd om verifieerbaar te blijven.
          </p>
        </div>
      </Paper>

      <ul className="space-y-3">
        {CREDENTIALS.map((c) => {
          const st = statusMeta(c.status);
          return (
            <li key={c.naam}>
              <Paper className="flex items-center gap-4 p-4">
                <span
                  className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full"
                  style={{
                    background: "rgba(43,58,103,0.04)",
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
                    style={{ ...display, color: C.ink }}
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
              </Paper>
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
          const tone = warn ? C.amber : C.indigo;
          return (
            <li key={a.titel}>
              <Paper
                className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center"
                accent={warn ? C.amber : C.line}
              >
                <span
                  className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-[16px] font-semibold tabular-nums"
                  style={{
                    background: "rgba(43,58,103,0.04)",
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
                      <Waves
                        size={14}
                        strokeWidth={2.4}
                        style={{ color: tone }}
                        aria-hidden="true"
                      />
                    )}
                    <h3
                      className="text-[17px] font-semibold leading-tight"
                      style={{ ...display, color: C.ink }}
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
                  style={{ background: tone, color: C.paper }}
                >
                  {a.cta}
                </button>
              </Paper>
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
    return C.indigo;
  };
  return (
    <div className="space-y-7">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <Kop sub="Omzet">Facturen</Kop>
        <button
          className="inline-flex items-center gap-2 rounded-full px-4 py-2.5 text-[12.5px] font-semibold transition-all hover:gap-3 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 motion-reduce:hover:gap-2"
          style={{ background: C.indigo, color: C.paper }}
        >
          <Plus size={15} aria-hidden="true" /> Nieuwe factuur
        </button>
      </div>

      <Paper className="overflow-x-auto">
        <table className="w-full min-w-[560px] border-collapse text-left">
          <thead>
            <tr style={{ borderBottom: `1px solid ${C.lineStrong}` }}>
              {["Nummer", "Klant", "Datum", "Status", "Bedrag"].map((h, i) => (
                <th
                  key={h}
                  className={`px-4 py-3 text-[11px] font-semibold uppercase tracking-[0.14em] ${i === 4 ? "text-right" : ""}`}
                  style={{ color: C.inkSoft }}
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
                    style={{ color: C.inkSoft }}
                  >
                    {f.nr}
                  </td>
                  <td className="px-4 py-3.5 text-[14px]" style={{ color: C.ink }}>
                    {f.klant}
                  </td>
                  <td
                    className="px-4 py-3.5 text-[12.5px] tabular-nums"
                    style={{ color: C.inkSoft }}
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
                    style={{ ...display, color: C.ink }}
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
                style={{ color: C.inkSoft }}
              >
                Totaal betaald
              </td>
              <td
                className="px-4 py-4 text-right text-[19px] font-semibold tabular-nums"
                style={{ ...display, color: C.green }}
              >
                {total}
              </td>
            </tr>
          </tfoot>
        </table>
      </Paper>
    </div>
  );
}
