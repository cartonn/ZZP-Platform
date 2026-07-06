"use client";

// Concept 115 — "Scorebord" · Groot stadion-LED-jumbotron / wedstrijdbord.
// Diepe zwart-groene stadion-achtergrond met fijne LED-dot-matrix textuur
// (repeating-radial-gradient dots). Grote cijfers en labels in fel LED-amber, LED-groen en
// LED-rood met lichte glow (text-shadow/box-shadow blur). Data leest als een LIVE wedstrijdbord:
// KPI's als grote scorebord-cijfers, match% als een "team-scoreboard"-duel, verificatie als een
// status-lightboard. Bricolage Grotesque (vette condensed labels) + Spline Sans Mono (LED-cijfers).
// Micro-interactie: hover laat een LED-segment feller gloeien. Onderscheidend van Arcade
// (16-bit HUD), Perron (split-flap) en Karbon (OLED-dark): dit is een STADION-LED-SCOREBORD met
// dot-matrix & scores. Dark concept.

import { useState } from "react";
import {
  ArrowRight,
  Check,
  Clock,
  AlertTriangle,
  XCircle,
  Search,
  Plus,
  ShieldCheck,
  Trophy,
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
  field: "#0a0f0c", // diep stadion-zwart-groen
  fieldDeep: "#070b09",
  panel: "#0f1712", // paneel iets lichter
  panelHi: "#14201a",
  amber: "#ffb000", // LED-amber
  green: "#38e08a", // LED-groen
  red: "#ff4d4d", // LED-rood
  text: "#dce7df", // zacht LED-wit-groen
  muted: "#6f8578",
  faint: "#465b50",
  line: "rgba(56,224,138,0.16)",
  lineSoft: "rgba(220,231,223,0.08)",
};

const display = { fontFamily: "var(--font-lab-bricolage)" };
const led = { fontFamily: "var(--font-lab-spline-mono)" };

// Dot-matrix LED-veld: fijne puntenraster + zachte veldverlichting.
const dotMatrix =
  "repeating-radial-gradient(circle at center, rgba(56,224,138,0.05) 0 1px, transparent 1px 6px)," +
  "radial-gradient(120% 80% at 50% -10%, rgba(56,224,138,0.06), transparent 55%)," +
  "radial-gradient(100% 70% at 50% 120%, rgba(255,176,0,0.04), transparent 60%)";

const glow = (color: string, blur = 12) => `0 0 ${blur}px ${color}55, 0 0 ${blur * 2}px ${color}22`;

function statusMeta(s: CredStatus): {
  label: string;
  Icon: LucideIcon;
  tone: string;
  lamp: "on" | "warn" | "off";
} {
  switch (s) {
    case "VERIFIED":
      return { label: "Geverifieerd", Icon: Check, tone: C.green, lamp: "on" };
    case "SUBMITTED":
      return { label: "In beoordeling", Icon: Clock, tone: C.amber, lamp: "warn" };
    case "EXPIRING":
      return { label: "Verloopt binnenkort", Icon: AlertTriangle, tone: C.amber, lamp: "warn" };
    case "REJECTED":
      return { label: "Afgewezen", Icon: XCircle, tone: C.red, lamp: "off" };
  }
}

// Scorebord-paneel met dot-matrix-binnenkant en gloeiende rand.
function Board({
  children,
  className = "",
  tone,
}: {
  children: React.ReactNode;
  className?: string;
  tone?: string;
}) {
  return (
    <div
      className={`rounded-xl ${className}`}
      style={{
        background: `linear-gradient(180deg, ${C.panelHi}, ${C.panel})`,
        border: `1px solid ${tone ? `${tone}44` : C.line}`,
        boxShadow: `inset 0 1px 0 rgba(255,255,255,0.04), inset 0 0 40px rgba(0,0,0,0.5)${tone ? `, ${glow(tone, 8)}` : ""}`,
      }}
    >
      {children}
    </div>
  );
}

// LED-cijfer met glow.
function Digit({
  children,
  tone,
  size = 34,
}: {
  children: React.ReactNode;
  tone: string;
  size?: number;
}) {
  return (
    <span
      className="tabular-nums leading-none"
      style={{
        ...led,
        fontSize: size,
        fontWeight: 600,
        color: tone,
        textShadow: glow(tone, 10),
        letterSpacing: "0.02em",
      }}
    >
      {children}
    </span>
  );
}

// Sparkline als LED-track met glow.
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
        style={{ filter: `drop-shadow(0 0 3px ${tone})` }}
      />
    </svg>
  );
}

// Match% als LED-segmentbalk (18 segmenten die oplichten).
function ScoreBar({ value, tone = C.green }: { value: number; tone?: string }) {
  const cells = 18;
  const filled = Math.round((value / 100) * cells);
  return (
    <div className="flex items-center gap-2.5">
      <div className="flex gap-[3px]" aria-hidden="true">
        {Array.from({ length: cells }).map((_, i) => {
          const on = i < filled;
          return (
            <span
              key={i}
              className="h-4 w-[6px] rounded-[1px]"
              style={{
                background: on ? tone : "rgba(255,255,255,0.06)",
                boxShadow: on ? glow(tone, 5) : "none",
              }}
            />
          );
        })}
      </div>
      <Digit tone={tone} size={16}>
        {value}%
      </Digit>
    </div>
  );
}

// Sectiekop in condensed display + label-onderstreping.
function Kop({ nr, children, sub }: { nr: string; children: React.ReactNode; sub?: string }) {
  return (
    <div>
      <div className="flex items-baseline gap-3">
        <span className="text-[11px] tabular-nums" style={{ ...led, color: C.amber }}>
          {nr}
        </span>
        {sub && (
          <span
            className="text-[10px] uppercase tracking-[0.3em]"
            style={{ ...display, color: C.muted }}
          >
            {sub}
          </span>
        )}
      </div>
      <h2
        className="mt-1 text-[28px] font-extrabold uppercase leading-none tracking-[0.01em] sm:text-[34px]"
        style={{ ...display, color: C.text }}
      >
        {children}
      </h2>
    </div>
  );
}

export function Concept115() {
  const [screen, setScreen] = useState<ScreenKey>("dashboard");
  const active = OPDRACHTEN[0] as Opdracht;

  return (
    <div
      className="min-h-[680px] w-full antialiased"
      style={{ ...display, background: C.field, backgroundImage: dotMatrix, color: C.text }}
    >
      {/* Kop — jumbotron-header met LED-logo */}
      <header className="mx-auto flex max-w-5xl items-center justify-between px-5 pt-9 md:px-10">
        <div className="flex items-center gap-3.5">
          <span
            className="flex h-11 w-11 items-center justify-center rounded-lg"
            style={{
              background: C.panelHi,
              border: `1px solid ${C.green}55`,
              color: C.green,
              boxShadow: glow(C.green, 8),
            }}
            aria-hidden="true"
          >
            <Trophy size={19} strokeWidth={2} />
          </span>
          <div className="leading-none">
            <div
              className="text-[21px] font-extrabold uppercase tracking-[0.06em]"
              style={{ ...display, color: C.text }}
            >
              Scorebord
            </div>
            <div className="mt-1 text-[9px] uppercase tracking-[0.34em]" style={{ color: C.muted }}>
              ZZP · Live standen
            </div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="hidden text-right leading-tight sm:block">
            <div
              className="text-[13px] font-bold uppercase tracking-[0.02em]"
              style={{ color: C.text }}
            >
              {PROFIEL.naam}
            </div>
            <div className="text-[11px]" style={{ color: C.muted }}>
              {PROFIEL.plaats}
            </div>
          </div>
          <span
            className="flex h-11 w-11 items-center justify-center rounded-lg text-[13px] font-bold"
            style={{
              ...led,
              background: C.panel,
              color: C.amber,
              border: `1px solid ${C.amber}44`,
              boxShadow: glow(C.amber, 6),
            }}
            aria-hidden="true"
          >
            {PROFIEL.initialen}
          </span>
        </div>
      </header>

      {/* Navigatie — LED-tabs, actief gloeit groen */}
      <nav
        className="mx-auto mt-7 flex max-w-5xl items-center gap-1.5 overflow-x-auto px-5 pb-5 md:px-10"
        aria-label="Hoofdnavigatie"
      >
        {SCREENS.map((s) => {
          const on = s.key === screen;
          return (
            <button
              key={s.key}
              onClick={() => setScreen(s.key)}
              aria-current={on ? "page" : undefined}
              className="group relative shrink-0 rounded-md px-3.5 py-2 text-[12px] font-bold uppercase tracking-[0.08em] transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-transparent"
              style={{
                ...display,
                color: on ? C.field : C.muted,
                background: on ? C.green : "transparent",
                border: `1px solid ${on ? "transparent" : C.lineSoft}`,
                boxShadow: on ? glow(C.green, 8) : "none",
              }}
            >
              {s.label}
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
  const tones = [C.green, C.amber, C.green, C.amber];
  return (
    <div className="space-y-10">
      {/* Groet — wedstrijd-intro */}
      <section>
        <div className="text-[10px] uppercase tracking-[0.3em]" style={{ color: C.muted }}>
          Vandaag · {PROFIEL.plaats}
        </div>
        <h1
          className="mt-2 text-[34px] font-extrabold uppercase leading-[0.98] tracking-[0.005em] sm:text-[48px]"
          style={{ ...display, color: C.text }}
        >
          Goedemorgen,{" "}
          <span style={{ color: C.green, textShadow: glow(C.green, 12) }}>
            {PROFIEL.naam.split(" ")[0]}
          </span>
        </h1>
        <p
          className="mt-3 max-w-lg text-[13.5px] leading-relaxed"
          style={{ ...led, color: C.muted }}
        >
          Je staat voor. Eén stand vraagt vandaag actie — de rest van het bord kleurt groen.
        </p>
      </section>

      {/* Primaire actie als scorebord-alarm */}
      <Board tone={C.amber} className="p-6">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0">
            <div
              className="inline-flex items-center gap-2 text-[10.5px] font-bold uppercase tracking-[0.22em]"
              style={{ ...display, color: C.amber }}
            >
              <AlertTriangle size={13} strokeWidth={2.4} aria-hidden="true" /> Vraagt aandacht
            </div>
            <h2
              className="mt-2 text-[22px] font-extrabold uppercase leading-tight sm:text-[26px]"
              style={{ ...display, color: C.text }}
            >
              {primair.titel}
            </h2>
            <p
              className="mt-2 max-w-md text-[13px] leading-relaxed"
              style={{ ...led, color: C.muted }}
            >
              {primair.detail}
            </p>
          </div>
          <button
            onClick={onOpen}
            className="group inline-flex shrink-0 items-center gap-2.5 rounded-lg px-6 py-3 text-[12.5px] font-bold uppercase tracking-[0.06em] transition-all hover:gap-3.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-transparent motion-reduce:hover:gap-2.5"
            style={{
              ...display,
              background: C.amber,
              color: C.field,
              boxShadow: glow(C.amber, 10),
            }}
          >
            {primair.cta}
            <ArrowRight size={15} aria-hidden="true" />
          </button>
        </div>
      </Board>

      {/* KPI's als grote scorebord-cijfers */}
      <section>
        <Kop nr="Q1" sub="Standen">
          Prestatie
        </Kop>
        <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {KPIS.map((k, i) => {
            const tone = tones[i % tones.length] as string;
            return (
              <Board
                key={k.label}
                className="group p-4 transition-transform hover:-translate-y-1 motion-reduce:hover:translate-y-0"
              >
                <div className="flex items-start justify-between">
                  <span
                    className="text-[10px] font-bold uppercase tracking-[0.12em]"
                    style={{ ...display, color: C.muted }}
                  >
                    {k.label}
                  </span>
                  <span
                    className="text-[11px] tabular-nums"
                    style={{
                      ...led,
                      color: k.up ? C.green : C.red,
                      textShadow: glow(k.up ? C.green : C.red, 5),
                    }}
                  >
                    {k.up ? "▲" : "▼"} {k.trend}
                  </span>
                </div>
                <div className="mt-3 transition-all group-hover:scale-[1.03] motion-reduce:group-hover:scale-100">
                  <Digit tone={tone} size={32}>
                    {k.value}
                  </Digit>
                </div>
                <div className="mt-3">
                  <Spark data={k.spark} tone={tone} />
                </div>
              </Board>
            );
          })}
        </div>
      </section>

      {/* Top-match als team-duel op het bord */}
      <section>
        <Kop nr="MVP" sub="Beste match">
          Voor jou
        </Kop>
        <button
          onClick={onOpen}
          className="group mt-6 block w-full text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-transparent"
        >
          <Board
            tone={C.green}
            className="flex flex-col gap-5 p-5 transition-transform group-hover:-translate-y-0.5 motion-reduce:group-hover:translate-y-0 sm:flex-row sm:items-center"
          >
            <div
              className="flex shrink-0 flex-col items-center justify-center rounded-lg px-5 py-3"
              style={{
                background: C.field,
                border: `1px solid ${C.green}44`,
                boxShadow: `inset 0 0 20px rgba(0,0,0,0.6)`,
              }}
            >
              <Digit tone={C.green} size={40}>
                {top.match}
              </Digit>
              <span
                className="mt-1 text-[9px] font-bold uppercase tracking-[0.24em]"
                style={{ ...display, color: C.muted }}
              >
                match
              </span>
            </div>
            <div className="min-w-0 flex-1">
              <h3
                className="text-[20px] font-extrabold uppercase leading-tight"
                style={{ ...display, color: C.text }}
              >
                {top.titel}
              </h3>
              <div className="mt-1 text-[12.5px]" style={{ ...led, color: C.muted }}>
                {top.opdrachtgever} · {top.plaats} · {top.tarief}
              </div>
              <div className="mt-3 flex flex-wrap gap-1.5">
                {top.tags.map((t) => (
                  <span
                    key={t}
                    className="rounded-md px-2.5 py-0.5 text-[10.5px] font-semibold uppercase tracking-[0.04em]"
                    style={{
                      ...display,
                      background: C.panelHi,
                      color: C.text,
                      border: `1px solid ${C.lineSoft}`,
                    }}
                  >
                    {t}
                  </span>
                ))}
              </div>
            </div>
            <ArrowRight
              size={20}
              className="hidden shrink-0 transition-transform group-hover:translate-x-1 motion-reduce:group-hover:translate-x-0 md:block"
              style={{ color: C.green }}
              aria-hidden="true"
            />
          </Board>
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
    <div className="space-y-8">
      <Kop nr="LIVE" sub="Open opdrachten">
        Marktplaats
      </Kop>

      <Board className="flex items-center gap-3 px-4 py-1">
        <Search size={17} style={{ color: C.muted }} aria-hidden="true" />
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Zoek op titel, plaats of opdrachtgever…"
          aria-label="Opdrachten zoeken"
          className="w-full bg-transparent py-2.5 text-[14px] outline-none placeholder:opacity-50"
          style={{ ...led, color: C.text }}
        />
        <span className="shrink-0 text-[12px] tabular-nums" style={{ ...led, color: C.green }}>
          {String(filtered.length).padStart(2, "0")}
        </span>
      </Board>

      {filtered.length === 0 ? (
        <Board className="flex flex-col items-center justify-center gap-3 p-14 text-center">
          <Search size={26} style={{ color: C.muted }} aria-hidden="true" />
          <p className="text-[20px] font-extrabold uppercase" style={{ ...display, color: C.text }}>
            Geen standen gevonden
          </p>
          <p className="max-w-xs text-[13px]" style={{ ...led, color: C.muted }}>
            Niets past bij “{q}”. Verruim je zoekopdracht of beschikbaarheid.
          </p>
          <button
            onClick={() => setQ("")}
            className="mt-2 inline-flex items-center gap-2 rounded-lg px-4 py-2 text-[12px] font-bold uppercase tracking-[0.05em] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-transparent"
            style={{ ...display, background: C.green, color: C.field, boxShadow: glow(C.green, 8) }}
          >
            Zoekopdracht wissen
          </button>
        </Board>
      ) : (
        <ul className="space-y-3">
          {filtered.map((o) => (
            <li key={o.id}>
              <button
                onClick={onOpen}
                className="group block w-full text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-transparent"
              >
                <Board className="flex flex-col gap-4 p-4 transition-transform group-hover:-translate-y-0.5 motion-reduce:group-hover:translate-y-0 sm:flex-row sm:items-center">
                  <div className="min-w-0 flex-1">
                    <span className="text-[9px] tabular-nums" style={{ ...led, color: C.amber }}>
                      {o.id}
                    </span>
                    <h3
                      className="mt-0.5 text-[18px] font-extrabold uppercase leading-tight"
                      style={{ ...display, color: C.text }}
                    >
                      {o.titel}
                    </h3>
                    <div className="mt-0.5 text-[12.5px]" style={{ ...led, color: C.muted }}>
                      {o.opdrachtgever} · {o.plaats} · {o.tarief}
                    </div>
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {o.tags.map((t) => (
                        <span
                          key={t}
                          className="rounded-md px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.04em]"
                          style={{
                            ...display,
                            background: C.panelHi,
                            color: C.text,
                            border: `1px solid ${C.lineSoft}`,
                          }}
                        >
                          {t}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div className="flex items-center gap-4 sm:flex-col sm:items-end">
                    <ScoreBar value={o.match} tone={o.match >= 85 ? C.green : C.amber} />
                    <ArrowRight
                      size={18}
                      className="shrink-0 transition-transform group-hover:translate-x-1 motion-reduce:group-hover:translate-x-0"
                      style={{ color: C.green }}
                      aria-hidden="true"
                    />
                  </div>
                </Board>
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
        className="inline-flex items-center gap-2 text-[12px] font-bold uppercase tracking-[0.08em] transition-opacity hover:opacity-60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-transparent"
        style={{ ...display, color: C.muted }}
      >
        <ArrowRight size={13} className="rotate-180" aria-hidden="true" /> Terug naar marktplaats
      </button>

      {/* Duel-header: jouw match vs 100 */}
      <Board tone={C.green} className="p-6">
        <div className="flex flex-wrap items-center justify-between gap-6">
          <div className="min-w-0">
            <span className="text-[11px] tabular-nums" style={{ ...led, color: C.amber }}>
              {opdracht.id}
            </span>
            <h1
              className="mt-1 max-w-xl text-[26px] font-extrabold uppercase leading-[1.02] sm:text-[32px]"
              style={{ ...display, color: C.text }}
            >
              {opdracht.titel}
            </h1>
            <p className="mt-1.5 text-[13px]" style={{ ...led, color: C.muted }}>
              {opdracht.opdrachtgever} · {opdracht.plaats}
            </p>
          </div>
          <div
            className="flex items-center gap-4"
            aria-label={`Matchscore ${opdracht.match} van 100`}
          >
            <div className="text-center">
              <Digit tone={C.green} size={52}>
                {opdracht.match}
              </Digit>
              <div
                className="text-[9px] font-bold uppercase tracking-[0.24em]"
                style={{ ...display, color: C.muted }}
              >
                jij
              </div>
            </div>
            <span className="text-[24px] font-extrabold" style={{ ...display, color: C.faint }}>
              :
            </span>
            <div className="text-center">
              <Digit tone={C.faint} size={52}>
                100
              </Digit>
              <div
                className="text-[9px] font-bold uppercase tracking-[0.24em]"
                style={{ ...display, color: C.muted }}
              >
                max
              </div>
            </div>
          </div>
        </div>
      </Board>

      {/* Feiten als scorebord-tegels */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {[
          { l: "Tarief", v: opdracht.tarief, tone: C.green },
          { l: "Omvang", v: opdracht.uren, tone: C.amber },
          { l: "Start", v: opdracht.start, tone: C.green },
          { l: "Match", v: `${opdracht.match}%`, tone: C.green },
        ].map((m) => (
          <Board key={m.l} className="p-4">
            <div
              className="text-[10px] font-bold uppercase tracking-[0.16em]"
              style={{ ...display, color: C.muted }}
            >
              {m.l}
            </div>
            <div className="mt-2">
              <Digit tone={m.tone} size={20}>
                {m.v}
              </Digit>
            </div>
          </Board>
        ))}
      </div>

      {/* Redenen plus/min */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <Board tone={C.green} className="p-5">
          <div
            className="inline-flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.2em]"
            style={{ ...display, color: C.green }}
          >
            <Check size={14} strokeWidth={2.6} aria-hidden="true" /> Wat past
          </div>
          <ul className="mt-4 space-y-3">
            {opdracht.redenen.plus.map((r) => (
              <li
                key={r}
                className="flex items-start gap-3 text-[13.5px] leading-snug"
                style={{ ...led, color: C.text }}
              >
                <span
                  className="mt-1 h-2.5 w-2.5 shrink-0 rounded-full"
                  style={{ background: C.green, boxShadow: glow(C.green, 5) }}
                  aria-hidden="true"
                />
                {r}
              </li>
            ))}
          </ul>
        </Board>
        <Board tone={C.amber} className="p-5">
          <div
            className="inline-flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.2em]"
            style={{ ...display, color: C.amber }}
          >
            <AlertTriangle size={14} strokeWidth={2.6} aria-hidden="true" /> Aandacht
          </div>
          <ul className="mt-4 space-y-3">
            {opdracht.redenen.min.map((r) => (
              <li
                key={r}
                className="flex items-start gap-3 text-[13.5px] leading-snug"
                style={{ ...led, color: C.text }}
              >
                <span
                  className="mt-1 h-2.5 w-2.5 shrink-0 rounded-full"
                  style={{ background: C.amber, boxShadow: glow(C.amber, 5) }}
                  aria-hidden="true"
                />
                {r}
              </li>
            ))}
          </ul>
        </Board>
      </div>

      <div className="flex flex-col items-stretch gap-3 pt-1 sm:flex-row">
        <button
          className="group inline-flex flex-1 items-center justify-center gap-2.5 rounded-lg px-7 py-3.5 text-[13px] font-bold uppercase tracking-[0.06em] transition-all hover:gap-3.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-transparent motion-reduce:hover:gap-2.5"
          style={{ ...display, background: C.green, color: C.field, boxShadow: glow(C.green, 10) }}
        >
          Reageer op opdracht <ArrowRight size={15} aria-hidden="true" />
        </button>
        <button
          className="inline-flex items-center justify-center gap-2 rounded-lg px-6 py-3.5 text-[13px] font-bold uppercase tracking-[0.06em] transition-colors hover:bg-white/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-transparent"
          style={{ ...display, border: `1px solid ${C.line}`, color: C.text }}
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
      <Kop nr="REF" sub="Vertrouwen">
        Verificatie
      </Kop>

      {/* Dekking als groot scorebord-cijfer + band */}
      <Board tone={C.green} className="flex flex-col gap-6 p-6 sm:flex-row sm:items-center">
        <div className="shrink-0 text-center sm:text-left">
          <Digit tone={C.green} size={54}>
            {pct}%
          </Digit>
          <div
            className="text-[9px] font-bold uppercase tracking-[0.24em]"
            style={{ ...display, color: C.muted }}
          >
            gedekt
          </div>
        </div>
        <div className="sm:border-l sm:pl-6" style={{ borderColor: C.line }}>
          <div
            className="inline-flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.2em]"
            style={{ ...display, color: C.green }}
          >
            <ShieldCheck size={15} strokeWidth={2.2} aria-hidden="true" /> {PROFIEL.trust}
          </div>
          <p
            className="mt-2 max-w-md text-[13.5px] leading-relaxed"
            style={{ ...led, color: C.muted }}
          >
            {verified} van {CREDENTIALS.length} credentials staan op groen. Eén lampje kleurt amber
            — vernieuw op tijd om verifieerbaar te blijven.
          </p>
        </div>
      </Board>

      {/* Status-lightboard: lampjes met label + icoon */}
      <ul className="space-y-3">
        {CREDENTIALS.map((c) => {
          const st = statusMeta(c.status);
          return (
            <li key={c.naam}>
              <Board className="flex items-center gap-4 p-4">
                <span
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full"
                  style={{
                    background: C.field,
                    border: `1px solid ${st.tone}66`,
                    color: st.tone,
                    boxShadow: st.lamp !== "off" ? glow(st.tone, 7) : "none",
                  }}
                  aria-hidden="true"
                >
                  <st.Icon size={17} strokeWidth={2.4} />
                </span>
                <div className="min-w-0 flex-1">
                  <div
                    className="text-[15px] font-bold uppercase leading-tight tracking-[0.01em]"
                    style={{ ...display, color: C.text }}
                  >
                    {c.naam}
                  </div>
                  <div className="mt-0.5 text-[12px]" style={{ ...led, color: C.muted }}>
                    {c.detail}
                  </div>
                </div>
                <span
                  className="inline-flex shrink-0 items-center gap-1.5 rounded-md px-3 py-1 text-[11px] font-bold uppercase tracking-[0.04em]"
                  style={{ ...display, color: st.tone, border: `1px solid ${st.tone}55` }}
                >
                  <span
                    className="h-2 w-2 rounded-full"
                    style={{
                      background: st.tone,
                      boxShadow: st.lamp !== "off" ? glow(st.tone, 5) : "none",
                    }}
                    aria-hidden="true"
                  />
                  <span className="hidden sm:inline">{st.label}</span>
                </span>
              </Board>
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
      <Kop nr="NEXT" sub="De volgende beste stap">
        Volgende acties
      </Kop>
      <ol className="space-y-3">
        {sorted.map((a, i) => {
          const warn = a.urgentie === "warning";
          const tone = warn ? C.amber : C.green;
          return (
            <li key={a.titel}>
              <Board
                tone={warn ? C.amber : undefined}
                className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center"
              >
                <span
                  className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg"
                  style={{
                    background: C.field,
                    border: `1px solid ${tone}55`,
                    boxShadow: `inset 0 0 14px rgba(0,0,0,0.6)`,
                  }}
                  aria-hidden="true"
                >
                  <Digit tone={tone} size={22}>
                    {i + 1}
                  </Digit>
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
                      <Check
                        size={14}
                        strokeWidth={2.6}
                        style={{ color: tone }}
                        aria-hidden="true"
                      />
                    )}
                    <h3
                      className="text-[16px] font-extrabold uppercase leading-tight"
                      style={{ ...display, color: C.text }}
                    >
                      {a.titel}
                    </h3>
                    <span className="sr-only">{warn ? "Urgent" : "Informatief"}</span>
                  </div>
                  <p
                    className="mt-1.5 text-[13px] leading-relaxed"
                    style={{ ...led, color: C.muted }}
                  >
                    {a.detail}
                  </p>
                </div>
                <button
                  className="shrink-0 self-start rounded-lg px-5 py-2.5 text-[12px] font-bold uppercase tracking-[0.05em] transition-opacity hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-transparent sm:self-center"
                  style={{ ...display, background: tone, color: C.field, boxShadow: glow(tone, 8) }}
                >
                  {a.cta}
                </button>
              </Board>
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
    return C.muted;
  };
  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <Kop nr="TOTAL" sub="Omzet">
          Facturen
        </Kop>
        <button
          className="inline-flex items-center gap-2 rounded-lg px-4 py-2.5 text-[12px] font-bold uppercase tracking-[0.05em] transition-all hover:gap-3 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-transparent motion-reduce:hover:gap-2"
          style={{ ...display, background: C.green, color: C.field, boxShadow: glow(C.green, 8) }}
        >
          <Plus size={15} aria-hidden="true" /> Nieuwe factuur
        </button>
      </div>

      <Board className="overflow-x-auto">
        <table className="w-full min-w-[560px] border-collapse text-left">
          <thead>
            <tr style={{ borderBottom: `1px solid ${C.line}` }}>
              {["Nummer", "Klant", "Datum", "Status", "Bedrag"].map((h, i) => (
                <th
                  key={h}
                  className={`px-4 py-3 text-[10px] font-bold uppercase tracking-[0.16em] ${i === 4 ? "text-right" : ""}`}
                  style={{ ...display, color: C.muted }}
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
                  className="transition-colors hover:bg-white/[0.03]"
                  style={{ borderBottom: `1px solid ${C.lineSoft}` }}
                >
                  <td
                    className="px-4 py-3.5 text-[12.5px] tabular-nums"
                    style={{ ...led, color: C.muted }}
                  >
                    {f.nr}
                  </td>
                  <td
                    className="px-4 py-3.5 text-[14px] font-semibold uppercase tracking-[0.01em]"
                    style={{ ...display, color: C.text }}
                  >
                    {f.klant}
                  </td>
                  <td
                    className="px-4 py-3.5 text-[12.5px] tabular-nums"
                    style={{ ...led, color: C.muted }}
                  >
                    {f.datum}
                  </td>
                  <td className="px-4 py-3.5">
                    <span
                      className="inline-flex items-center gap-1.5 rounded-md px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-[0.04em]"
                      style={{ ...display, color: tone, border: `1px solid ${tone}55` }}
                    >
                      <span
                        className="h-1.5 w-1.5 rounded-full"
                        style={{ background: tone, boxShadow: glow(tone, 4) }}
                        aria-hidden="true"
                      />
                      {f.status}
                    </span>
                  </td>
                  <td className="px-4 py-3.5 text-right">
                    <span className="text-[14px] tabular-nums" style={{ ...led, color: C.text }}>
                      {f.bedrag}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
          <tfoot>
            <tr style={{ borderTop: `1px solid ${C.line}` }}>
              <td
                colSpan={4}
                className="px-4 py-4 text-[10px] font-bold uppercase tracking-[0.2em]"
                style={{ ...display, color: C.muted }}
              >
                Totaal betaald
              </td>
              <td className="px-4 py-4 text-right">
                <Digit tone={C.green} size={20}>
                  {total}
                </Digit>
              </td>
            </tr>
          </tfoot>
        </table>
      </Board>
    </div>
  );
}
