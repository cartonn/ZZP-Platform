"use client";

// Concept 113 — "Filatelie" · Postzegel-verzamelalbum met perforatie & frankeerstempel.
// Crème album-papier met lichte vezel-textuur; kern-datapunten als POSTZEGELS: rechthoekige
// kaartjes met een geperforeerde getande rand (CSS radial-gradient mask), een fijne kartelrand,
// en ronde FRANKEERSTEMPELS (concentrische cirkels met datum/plaats, licht scheef geroteerd)
// over geverifieerde items — "afgestempeld = geverifieerd". Klassiek postaal font (Libre
// Franklin) + JetBrains Mono voor waarde-cijfers. Zegel-inkten: postrood, groen, blauw, oker
// op crème. Verificatie = afgestempelde zegel; nieuwe match = ongebruikte zegel. Onderscheidend
// van Perforatie (instapkaart/ticket) en Zegel (lakzegel): dit is een PHILATELIE-ALBUM met
// getande postzegels & ronde poststempels. Light concept.

import { useState } from "react";
import {
  ArrowRight,
  Check,
  Clock,
  AlertTriangle,
  XCircle,
  Search,
  Stamp,
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

// Crème album-papier met klassieke zegel-inkten.
const C = {
  paper: "#f3ecdd", // crème album-papier
  paperDeep: "#eae0cb",
  stampFace: "#fbf6ea", // zegel-oppervlak (lichter dan papier)
  ink: "#2a2620", // donkere zetsel-inkt
  inkSoft: "#5a5040",
  muted: "#8c8069",
  postRed: "#a4342b", // postrood
  green: "#2e6b4f", // groen
  blue: "#29517d", // blauw
  ochre: "#b78a2e", // oker
  edge: "rgba(42,38,32,0.2)", // kartelrand/omlijning
  edgeSoft: "rgba(42,38,32,0.12)",
};

const franklin = { fontFamily: "var(--font-lab-franklin)" };
const mono = { fontFamily: "var(--font-lab-mono)" };
const ui = { fontFamily: "var(--font-lab-inter)" };

// Album-papier: fijne vezel-textuur via zachte diagonale strepen + warme vlek.
const paperField =
  "repeating-linear-gradient(0deg, rgba(42,38,32,0.015) 0 2px, transparent 2px 4px)," +
  "radial-gradient(70% 55% at 50% -10%, rgba(183,138,46,0.08), transparent 60%)," +
  "radial-gradient(60% 50% at 90% 110%, rgba(41,81,125,0.05), transparent 60%)";

// Postzegel-kaartje: wit "vel" met een gestippelde (dashed) binnenrand die de perforatie
// suggereert, plus een gekleurde inkt-omlijning en rijen perforatie-gaatjes langs boven/onder.
function Stamp1({
  children,
  className = "",
  border,
}: {
  children: React.ReactNode;
  className?: string;
  border: string;
}) {
  return (
    <div
      className={`relative rounded-[3px] ${className}`}
      style={{
        background: C.stampFace,
        // Witte "vel"-rand + gekleurde inkt-omlijning; getande suggestie via dubbele rand.
        boxShadow: `0 0 0 3px ${C.stampFace}, 0 0 0 4px ${border}55, 0 4px 14px rgba(42,38,32,0.12)`,
        border: `1px dashed ${border}66`,
      }}
    >
      {/* Perforatie-gaatjes: rij kleine cirkels langs boven- en onderrand */}
      <span
        className="pointer-events-none absolute inset-x-0 -top-[3px] h-[6px]"
        aria-hidden="true"
        style={{
          backgroundImage: `radial-gradient(circle 3px at 3px 3px, ${C.paper} 40%, transparent 45%)`,
          backgroundSize: "12px 6px",
          backgroundRepeat: "repeat-x",
        }}
      />
      <span
        className="pointer-events-none absolute inset-x-0 -bottom-[3px] h-[6px]"
        aria-hidden="true"
        style={{
          backgroundImage: `radial-gradient(circle 3px at 3px 3px, ${C.paper} 40%, transparent 45%)`,
          backgroundSize: "12px 6px",
          backgroundRepeat: "repeat-x",
        }}
      />
      {children}
    </div>
  );
}

// Ronde frankeerstempel: concentrische cirkels met datum/plaats, licht scheef geroteerd.
// Wordt over geverifieerde items geplaatst ("afgestempeld").
function Postmark({ label = "UTRECHT", date = "'26", tone = C.postRed, size = 74, rotate = -13 }) {
  const r1 = size * 0.46;
  const r2 = size * 0.34;
  const c = size / 2;
  return (
    <div
      className="pointer-events-none select-none"
      style={{ width: size, height: size, transform: `rotate(${rotate}deg)`, opacity: 0.72 }}
      aria-hidden="true"
    >
      <svg viewBox={`0 0 ${size} ${size}`} width={size} height={size}>
        <circle cx={c} cy={c} r={r1} fill="none" stroke={tone} strokeWidth={1.6} />
        <circle cx={c} cy={c} r={r2} fill="none" stroke={tone} strokeWidth={1.2} />
        {/* golfjes onder (postale wavy lines) */}
        <path
          d={`M ${c - r1} ${c} q ${r1 / 4} -5 ${r1 / 2} 0 q ${r1 / 4} 5 ${r1 / 2} 0`}
          fill="none"
          stroke={tone}
          strokeWidth={1}
          opacity={0.5}
        />
        <text
          x={c}
          y={c - r2 * 0.28}
          textAnchor="middle"
          fontSize={size * 0.13}
          fill={tone}
          style={franklin}
          fontWeight={700}
        >
          {label}
        </text>
        <line x1={c - r2 * 0.6} y1={c} x2={c + r2 * 0.6} y2={c} stroke={tone} strokeWidth={1} />
        <text
          x={c}
          y={c + r2 * 0.5}
          textAnchor="middle"
          fontSize={size * 0.15}
          fill={tone}
          style={mono}
          fontWeight={700}
        >
          {date}
        </text>
      </svg>
    </div>
  );
}

function statusMeta(s: CredStatus): { label: string; Icon: LucideIcon; tone: string } {
  switch (s) {
    case "VERIFIED":
      return { label: "Geverifieerd", Icon: Check, tone: C.green };
    case "SUBMITTED":
      return { label: "In beoordeling", Icon: Clock, tone: C.ochre };
    case "EXPIRING":
      return { label: "Verloopt binnenkort", Icon: AlertTriangle, tone: C.postRed };
    case "REJECTED":
      return { label: "Afgewezen", Icon: XCircle, tone: C.postRed };
  }
}

function Kop({ children, sub }: { children: React.ReactNode; sub?: string }) {
  return (
    <div>
      {sub && (
        <div
          className="mb-2 text-[11px] uppercase tracking-[0.28em]"
          style={{ ...mono, color: C.postRed }}
        >
          {sub}
        </div>
      )}
      <h2
        className="text-[26px] font-bold leading-none tracking-[-0.01em] sm:text-[32px]"
        style={{ ...franklin, color: C.ink }}
      >
        {children}
      </h2>
      <div className="mt-3 flex items-center gap-2" aria-hidden="true">
        <span className="h-px w-10" style={{ background: C.postRed }} />
        <span
          className="h-2 w-2"
          style={{
            backgroundImage: `radial-gradient(circle 1.5px at center, ${C.postRed} 60%, transparent 65%)`,
            backgroundSize: "4px 4px",
            width: 16,
          }}
        />
        <span className="h-px flex-1" style={{ background: C.edgeSoft }} />
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

export function Concept113() {
  const [screen, setScreen] = useState<ScreenKey>("dashboard");
  const active = OPDRACHTEN[0] as Opdracht;

  return (
    <div
      className="min-h-[680px] w-full antialiased"
      style={{ ...ui, background: C.paper, backgroundImage: paperField, color: C.ink }}
    >
      {/* Kop — album-titelblok met zegel-embleem */}
      <header className="mx-auto flex max-w-5xl items-center justify-between px-5 pt-9 md:px-10">
        <div className="flex items-center gap-3.5">
          <span
            className="flex h-11 w-11 items-center justify-center rounded-[3px]"
            style={{
              background: C.stampFace,
              border: `1px dashed ${C.postRed}88`,
              boxShadow: `0 0 0 3px ${C.paper}, 0 0 0 4px ${C.postRed}44`,
              color: C.postRed,
            }}
            aria-hidden="true"
          >
            <Stamp size={19} strokeWidth={1.8} />
          </span>
          <div className="leading-none">
            <div
              className="text-[24px] font-bold tracking-[-0.01em]"
              style={{ ...franklin, color: C.ink }}
            >
              Filatelie
            </div>
            <div
              className="mt-1 text-[10px] uppercase tracking-[0.3em]"
              style={{ ...mono, color: C.muted }}
            >
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
            className="flex h-11 w-11 items-center justify-center rounded-[3px] text-[13px] font-bold"
            style={{
              ...franklin,
              background: C.stampFace,
              color: C.blue,
              border: `1px dashed ${C.blue}88`,
              boxShadow: `0 0 0 3px ${C.paper}, 0 0 0 4px ${C.blue}44`,
            }}
            aria-hidden="true"
          >
            {PROFIEL.initialen}
          </span>
        </div>
      </header>

      {/* Navigatie — album-tabs met poststempel-onderlijn */}
      <nav
        className="mx-auto mt-7 flex max-w-5xl items-center gap-1 overflow-x-auto px-5 pb-5 md:px-10"
        aria-label="Hoofdnavigatie"
        style={{ borderBottom: `1px solid ${C.edgeSoft}` }}
      >
        {SCREENS.map((s) => {
          const on = s.key === screen;
          return (
            <button
              key={s.key}
              onClick={() => setScreen(s.key)}
              aria-current={on ? "page" : undefined}
              className="relative shrink-0 px-3.5 py-2 text-[13px] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
              style={{
                color: on ? C.ink : C.muted,
                fontWeight: on ? 700 : 400,
                fontFamily: "var(--font-lab-franklin)",
              }}
            >
              {s.label}
              {on && (
                <span
                  className="absolute -bottom-[1px] left-2 right-2 h-[2px]"
                  style={{
                    backgroundImage: `radial-gradient(circle 1.2px at center, ${C.postRed} 60%, transparent 65%)`,
                    backgroundSize: "5px 2px",
                  }}
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
  const inks = [C.blue, C.postRed, C.green, C.ochre];
  return (
    <div className="space-y-12">
      {/* Groet — album-openingsblad */}
      <section className="text-center">
        <div
          className="text-[11px] uppercase tracking-[0.3em]"
          style={{ ...mono, color: C.postRed }}
        >
          Vandaag · {PROFIEL.plaats}
        </div>
        <h1
          className="mx-auto mt-4 max-w-2xl text-[38px] font-bold leading-[1.03] tracking-[-0.02em] sm:text-[52px]"
          style={{ ...franklin, color: C.ink }}
        >
          Goedemorgen, {PROFIEL.naam.split(" ")[0]}
        </h1>
        <div className="mx-auto mt-5 flex items-center justify-center gap-3" aria-hidden="true">
          <span className="h-px w-12" style={{ background: C.edgeSoft }} />
          <Stamp size={16} strokeWidth={1.8} style={{ color: C.postRed }} />
          <span className="h-px w-12" style={{ background: C.edgeSoft }} />
        </div>
        <p
          className="mx-auto mt-5 max-w-md text-[14px] leading-relaxed"
          style={{ color: C.inkSoft }}
        >
          Je album is bijna compleet. Eén zegel wacht nog op een afstempeling — de rest zit netjes
          op zijn plek.
        </p>
      </section>

      {/* Primaire actie — postrode zegel */}
      <Stamp1 border={C.postRed} className="p-6">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0">
            <div
              className="inline-flex items-center gap-2 text-[11px] uppercase tracking-[0.24em]"
              style={{ ...mono, color: C.postRed }}
            >
              <AlertTriangle size={13} strokeWidth={2} aria-hidden="true" /> Vraagt aandacht
            </div>
            <h2
              className="mt-2 text-[22px] font-bold leading-tight tracking-[-0.01em] sm:text-[26px]"
              style={{ ...franklin, color: C.ink }}
            >
              {primair.titel}
            </h2>
            <p className="mt-2 max-w-md text-[13px] leading-relaxed" style={{ color: C.inkSoft }}>
              {primair.detail}
            </p>
          </div>
          <button
            onClick={onOpen}
            className="group inline-flex shrink-0 items-center gap-2.5 rounded-[3px] px-6 py-3 text-[13px] font-bold transition-all hover:gap-3.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 motion-reduce:hover:gap-2.5"
            style={{ ...franklin, background: C.postRed, color: C.stampFace }}
          >
            {primair.cta}
            <ArrowRight size={16} aria-hidden="true" />
          </button>
        </div>
      </Stamp1>

      {/* KPI — vier zegels met catalogus-nummer en waarde */}
      <section>
        <Kop sub="In cijfers">Prestatie</Kop>
        <div className="mt-6 grid grid-cols-2 gap-5 lg:grid-cols-4">
          {KPIS.map((k, i) => {
            const tone = inks[i % inks.length] as string;
            return (
              <Stamp1
                key={k.label}
                border={tone}
                className="group p-4 transition-transform hover:-translate-y-1 motion-reduce:hover:translate-y-0"
              >
                <div className="flex items-start justify-between">
                  <span
                    className="text-[9px] uppercase tracking-[0.14em]"
                    style={{ ...mono, color: C.muted }}
                  >
                    Nr. {String(i + 1).padStart(2, "0")}
                  </span>
                  <span
                    className="text-[11px] tabular-nums"
                    style={{ ...mono, color: k.up ? C.green : C.postRed }}
                  >
                    {k.up ? "▲" : "▼"} {k.trend}
                  </span>
                </div>
                <div
                  className="mt-3 text-[27px] font-bold tabular-nums leading-none tracking-[-0.02em]"
                  style={{ ...mono, color: tone }}
                >
                  {k.value}
                </div>
                <div className="mt-1 text-[11.5px]" style={{ color: C.muted }}>
                  {k.label}
                </div>
                <div className="mt-3">
                  <Spark data={k.spark} tone={tone} />
                </div>
              </Stamp1>
            );
          })}
        </div>
      </section>

      {/* Top-match als pronkzegel */}
      <section>
        <Kop sub="Beste match">Voor jou</Kop>
        <button
          onClick={onOpen}
          className="group mt-6 block w-full text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
        >
          <Stamp1
            border={C.blue}
            className="flex flex-col gap-5 p-5 transition-transform group-hover:-translate-y-0.5 motion-reduce:group-hover:translate-y-0 sm:flex-row sm:items-center"
          >
            <div
              className="flex h-20 w-20 shrink-0 flex-col items-center justify-center rounded-[3px]"
              style={{ background: C.blue, color: C.stampFace }}
              aria-hidden="true"
            >
              <span className="text-[26px] font-bold tabular-nums leading-none" style={mono}>
                {top.match}
              </span>
              <span className="text-[9px] uppercase tracking-[0.2em]">match</span>
            </div>
            <div className="min-w-0 flex-1">
              <h3
                className="text-[20px] font-bold leading-tight tracking-[-0.01em]"
                style={{ ...franklin, color: C.ink }}
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
                      background: C.paperDeep,
                      color: C.inkSoft,
                      border: `1px solid ${C.edgeSoft}`,
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
              style={{ color: C.blue }}
              aria-hidden="true"
            />
          </Stamp1>
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
        style={{ background: C.paperDeep, border: `1px solid ${C.edgeSoft}` }}
        aria-hidden="true"
      >
        <div
          className="absolute inset-y-0 left-0 rounded-[2px]"
          style={{ width: `${value}%`, background: C.ochre }}
        />
      </div>
      <span className="text-[13px] font-bold tabular-nums" style={{ ...mono, color: C.postRed }}>
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
  const inks = [C.blue, C.green, C.ochre];
  return (
    <div className="space-y-8">
      <Kop sub="Open opdrachten">Marktplaats</Kop>

      <div
        className="flex items-center gap-3 rounded-[3px] px-4 py-1"
        style={{ background: C.stampFace, border: `1px dashed ${C.edge}` }}
      >
        <Search size={17} style={{ color: C.muted }} aria-hidden="true" />
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Zoek op titel, plaats of opdrachtgever…"
          aria-label="Opdrachten zoeken"
          className="w-full bg-transparent py-2.5 text-[14px] outline-none placeholder:opacity-50"
          style={{ color: C.ink }}
        />
        <span className="shrink-0 text-[12px] tabular-nums" style={{ ...mono, color: C.muted }}>
          {filtered.length}
        </span>
      </div>

      {filtered.length === 0 ? (
        <Stamp1
          border={C.blue}
          className="flex flex-col items-center justify-center gap-3 p-14 text-center"
        >
          <Search size={26} style={{ color: C.muted }} aria-hidden="true" />
          <p className="text-[22px] font-bold" style={{ ...franklin, color: C.ink }}>
            Geen zegels gevonden
          </p>
          <p className="max-w-xs text-[13px]" style={{ color: C.muted }}>
            Niets past bij “{q}”. Verruim je zoekopdracht of beschikbaarheid.
          </p>
          <button
            onClick={() => setQ("")}
            className="mt-2 inline-flex items-center gap-2 rounded-[3px] px-4 py-2 text-[12px] font-bold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
            style={{ ...franklin, background: C.postRed, color: C.stampFace }}
          >
            Zoekopdracht wissen
          </button>
        </Stamp1>
      ) : (
        <ul className="space-y-4">
          {filtered.map((o, i) => {
            const tone = inks[i % inks.length] as string;
            return (
              <li key={o.id}>
                <button
                  onClick={onOpen}
                  className="group block w-full text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
                >
                  <Stamp1
                    border={tone}
                    className="flex flex-col gap-4 p-4 transition-transform group-hover:-translate-y-0.5 motion-reduce:group-hover:translate-y-0 sm:flex-row sm:items-center"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span
                          className="text-[9px] uppercase tracking-[0.14em]"
                          style={{ ...mono, color: C.muted }}
                        >
                          {o.id}
                        </span>
                      </div>
                      <h3
                        className="mt-0.5 text-[17px] font-bold leading-tight tracking-[-0.01em]"
                        style={{ ...franklin, color: C.ink }}
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
                              background: C.paperDeep,
                              color: C.inkSoft,
                              border: `1px solid ${C.edgeSoft}`,
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
                        style={{ color: tone }}
                        aria-hidden="true"
                      />
                    </div>
                  </Stamp1>
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
  const facts = [
    { l: "Tarief", v: opdracht.tarief, tone: C.green },
    { l: "Omvang", v: opdracht.uren, tone: C.blue },
    { l: "Start", v: opdracht.start, tone: C.ochre },
    { l: "Match", v: `${opdracht.match}%`, tone: C.postRed },
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

      <section className="text-center">
        <div className="flex items-center justify-center gap-3">
          <span
            className="text-[11px] uppercase tracking-[0.28em]"
            style={{ ...mono, color: C.muted }}
          >
            {opdracht.id}
          </span>
          <span
            className="rounded-[3px] px-2.5 py-0.5 text-[11px] font-bold"
            style={{ ...mono, background: C.postRed, color: C.stampFace }}
          >
            {opdracht.match}% match
          </span>
        </div>
        <h1
          className="mx-auto mt-4 max-w-2xl text-[30px] font-bold leading-[1.05] tracking-[-0.02em] sm:text-[42px]"
          style={{ ...franklin, color: C.ink }}
        >
          {opdracht.titel}
        </h1>
        <p className="mt-3 text-[13.5px]" style={{ color: C.muted }}>
          {opdracht.opdrachtgever} · {opdracht.plaats}
        </p>
      </section>

      <div className="grid grid-cols-2 gap-5 lg:grid-cols-4">
        {facts.map((m) => (
          <Stamp1 key={m.l} border={m.tone} className="p-4 text-center">
            <div
              className="text-[20px] font-bold tabular-nums leading-none tracking-[-0.02em]"
              style={{ ...mono, color: m.tone }}
            >
              {m.v}
            </div>
            <div
              className="mt-2 text-[11px] uppercase tracking-[0.18em]"
              style={{ ...mono, color: C.muted }}
            >
              {m.l}
            </div>
          </Stamp1>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
        <Stamp1 border={C.green} className="p-5">
          <div
            className="inline-flex items-center gap-2 text-[12px] uppercase tracking-[0.2em]"
            style={{ ...mono, color: C.green }}
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
                  style={{ color: C.green }}
                  aria-hidden="true"
                />
                {r}
              </li>
            ))}
          </ul>
        </Stamp1>
        <Stamp1 border={C.postRed} className="p-5">
          <div
            className="inline-flex items-center gap-2 text-[12px] uppercase tracking-[0.2em]"
            style={{ ...mono, color: C.postRed }}
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
                  style={{ background: C.postRed }}
                  aria-hidden="true"
                />
                {r}
              </li>
            ))}
          </ul>
        </Stamp1>
      </div>

      <div className="flex flex-col items-center gap-3 pt-2 sm:flex-row sm:justify-center">
        <button
          className="group inline-flex w-full items-center justify-center gap-2.5 rounded-[3px] px-7 py-3.5 text-[14px] font-bold transition-all hover:gap-3.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 motion-reduce:hover:gap-2.5 sm:w-auto"
          style={{ ...franklin, background: C.postRed, color: C.stampFace }}
        >
          Reageer op opdracht <ArrowRight size={16} aria-hidden="true" />
        </button>
        <button
          className="inline-flex w-full items-center justify-center gap-2 rounded-[3px] px-6 py-3.5 text-[14px] font-bold transition-opacity hover:opacity-70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 sm:w-auto"
          style={{
            ...franklin,
            border: `1px dashed ${C.edge}`,
            color: C.ink,
            background: C.stampFace,
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
  const marks = ["UTRECHT", "AMSTERDAM", "ROTTERDAM", "DEN HAAG"];
  return (
    <div className="space-y-8">
      <Kop sub="Vertrouwen">Verificatie</Kop>

      {/* Vertrouwens-vel: voortgang als afstempel-graad */}
      <div
        className="relative flex flex-col items-center gap-6 overflow-hidden rounded-[3px] p-6 sm:flex-row sm:items-center"
        style={{
          background: C.stampFace,
          border: `1px dashed ${C.green}66`,
          boxShadow: `0 0 0 3px ${C.stampFace}, 0 0 0 4px ${C.green}44`,
        }}
      >
        <div className="relative h-28 w-28 shrink-0" aria-hidden="true">
          <svg viewBox="0 0 36 36" className="h-full w-full -rotate-90">
            <circle cx="18" cy="18" r="15.5" fill="none" stroke={C.paperDeep} strokeWidth="3.5" />
            <circle
              cx="18"
              cy="18"
              r="15.5"
              fill="none"
              stroke={C.green}
              strokeWidth="3"
              strokeLinecap="round"
              strokeDasharray={`${(pct / 100) * 97.4} 97.4`}
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span
              className="text-[26px] font-bold tabular-nums leading-none"
              style={{ ...mono, color: C.ink }}
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
            style={{ ...mono, color: C.green }}
          >
            <ShieldCheck size={15} strokeWidth={2} aria-hidden="true" /> {PROFIEL.trust}
          </div>
          <p className="mt-2 max-w-md text-[14px] leading-relaxed" style={{ color: C.inkSoft }}>
            {verified} van {CREDENTIALS.length} zegels afgestempeld. Eén zegel wacht op zijn
            afstempeling — vernieuw op tijd om verifieerbaar te blijven.
          </p>
        </div>
        <div className="absolute right-3 top-3 hidden sm:block">
          <Postmark label="UTRECHT" date="'26" tone={C.green} size={64} rotate={-9} />
        </div>
      </div>

      <ul className="grid grid-cols-1 gap-5 sm:grid-cols-2">
        {CREDENTIALS.map((c, i) => {
          const st = statusMeta(c.status);
          const stamped = c.status === "VERIFIED";
          return (
            <li key={c.naam}>
              <Stamp1
                border={st.tone}
                className="relative flex items-start gap-4 overflow-hidden p-4"
              >
                <span
                  className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[3px]"
                  style={{
                    background: C.paperDeep,
                    border: `1px solid ${st.tone}`,
                    color: st.tone,
                  }}
                  aria-hidden="true"
                >
                  <st.Icon size={17} strokeWidth={2.2} />
                </span>
                <div className="min-w-0 flex-1">
                  <div
                    className="text-[15px] font-bold leading-tight tracking-[-0.01em]"
                    style={{ ...franklin, color: C.ink }}
                  >
                    {c.naam}
                  </div>
                  <div className="mt-0.5 text-[12px]" style={{ color: C.muted }}>
                    {c.detail}
                  </div>
                  <span
                    className="mt-2 inline-flex items-center gap-1.5 rounded-[3px] px-2.5 py-0.5 text-[11px] font-bold"
                    style={{
                      ...mono,
                      background: C.stampFace,
                      color: st.tone,
                      border: `1px solid ${st.tone}`,
                    }}
                  >
                    <st.Icon size={12} strokeWidth={2.4} aria-hidden="true" />
                    {st.label}
                  </span>
                </div>
                {/* Afstempeling over geverifieerde zegels */}
                {stamped && (
                  <div className="absolute -right-1 -top-1">
                    <Postmark
                      label={marks[i % marks.length]}
                      date="'26"
                      tone={st.tone}
                      size={68}
                      rotate={-14}
                    />
                  </div>
                )}
              </Stamp1>
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
      <ol className="space-y-4">
        {sorted.map((a, i) => {
          const warn = a.urgentie === "warning";
          const tone = warn ? C.postRed : C.blue;
          return (
            <li key={a.titel}>
              <Stamp1 border={tone} className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center">
                <span
                  className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[3px] text-[17px] font-bold tabular-nums"
                  style={{
                    ...mono,
                    background: C.paperDeep,
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
                      <Stamp
                        size={14}
                        strokeWidth={2.2}
                        style={{ color: tone }}
                        aria-hidden="true"
                      />
                    )}
                    <h3
                      className="text-[16px] font-bold leading-tight tracking-[-0.01em]"
                      style={{ ...franklin, color: C.ink }}
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
                  className="shrink-0 self-start rounded-[3px] px-5 py-2.5 text-[12.5px] font-bold transition-all hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 sm:self-center"
                  style={{ ...franklin, background: tone, color: C.stampFace }}
                >
                  {a.cta}
                </button>
              </Stamp1>
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
    if (status === "Openstaand") return C.postRed;
    return C.muted;
  };
  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <Kop sub="Omzet">Facturen</Kop>
        <button
          className="inline-flex items-center gap-2 rounded-[3px] px-4 py-2.5 text-[12.5px] font-bold transition-all hover:gap-3 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 motion-reduce:hover:gap-2"
          style={{ ...franklin, background: C.postRed, color: C.stampFace }}
        >
          <Plus size={15} aria-hidden="true" /> Nieuwe factuur
        </button>
      </div>

      <div
        className="overflow-x-auto rounded-[3px]"
        style={{ background: C.stampFace, border: `1px dashed ${C.edge}` }}
      >
        <table className="w-full min-w-[560px] border-collapse text-left">
          <thead>
            <tr style={{ borderBottom: `1px solid ${C.edge}` }}>
              {["Nummer", "Klant", "Datum", "Status", "Bedrag"].map((h, i) => (
                <th
                  key={h}
                  className={`px-4 py-3 text-[11px] uppercase tracking-[0.16em] ${i === 4 ? "text-right" : ""}`}
                  style={{ ...mono, color: C.muted, fontWeight: 600 }}
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
                  style={{ borderBottom: `1px solid ${C.edgeSoft}` }}
                >
                  <td
                    className="px-4 py-3.5 text-[12.5px] tabular-nums"
                    style={{ ...mono, color: C.inkSoft }}
                  >
                    {f.nr}
                  </td>
                  <td className="px-4 py-3.5 text-[14px]" style={{ color: C.ink }}>
                    {f.klant}
                  </td>
                  <td
                    className="px-4 py-3.5 text-[12.5px] tabular-nums"
                    style={{ ...mono, color: C.muted }}
                  >
                    {f.datum}
                  </td>
                  <td className="px-4 py-3.5">
                    <span
                      className="inline-flex items-center gap-1.5 rounded-[3px] px-2.5 py-0.5 text-[11px] font-bold"
                      style={{ ...mono, color: tone, border: `1px solid ${tone}` }}
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
                    className="px-4 py-3.5 text-right text-[15px] font-bold tabular-nums"
                    style={{ ...mono, color: C.ink }}
                  >
                    {f.bedrag}
                  </td>
                </tr>
              );
            })}
          </tbody>
          <tfoot>
            <tr style={{ borderTop: `2px solid ${C.edge}` }}>
              <td
                colSpan={4}
                className="px-4 py-4 text-[11px] uppercase tracking-[0.2em]"
                style={{ ...mono, color: C.muted }}
              >
                Totaal betaald
              </td>
              <td
                className="px-4 py-4 text-right text-[20px] font-bold tabular-nums"
                style={{ ...mono, color: C.green }}
              >
                {total}
              </td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
}
