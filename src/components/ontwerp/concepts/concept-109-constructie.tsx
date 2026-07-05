"use client";

// Concept 109 — "Constructie" · Russisch constructivisme / agitprop-affiche.
// Dynamische DIAGONALEN, vette grotesk-typografie op assen (soms geroteerd), streng
// rood/zwart/off-white palet, dikke geometrische balken en cirkels, blok-nummering.
// Energiek en activistisch — "dashboard-als-affiche" — maar streng functioneel: alle
// data blijft rechtop leesbaar. Onderscheidend van Bauhaus/Memphis/Deco door de
// constructivistische diagonale dynamiek en agitprop-compositie (asymmetrisch, niet
// decoratief). Fonts: Bricolage Grotesque (display) + JetBrains Mono (data/labels).

import { useState } from "react";
import {
  ArrowUpRight,
  ArrowRight,
  Check,
  Clock,
  AlertTriangle,
  XCircle,
  Zap,
  Radio,
  Square,
  Circle,
  Triangle,
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
  paper: "#eae4d5", // off-white kalkpapier
  paperDeep: "#e0d8c4",
  ink: "#161311", // bijna-zwart
  inkSoft: "#3a332d",
  red: "#c8241d", // agitprop-rood
  redDeep: "#9c1712",
  muted: "#6f6656",
  line: "rgba(22,19,17,0.16)",
  lineStrong: "rgba(22,19,17,0.32)",
};

const display = { fontFamily: "var(--font-lab-bricolage)" };
const mono = { fontFamily: "var(--font-lab-mono)" };

function statusMeta(s: CredStatus): { label: string; Icon: LucideIcon; red: boolean } {
  switch (s) {
    case "VERIFIED":
      return { label: "Geverifieerd", Icon: Check, red: false };
    case "SUBMITTED":
      return { label: "In beoordeling", Icon: Clock, red: false };
    case "EXPIRING":
      return { label: "Verloopt binnenkort", Icon: AlertTriangle, red: true };
    case "REJECTED":
      return { label: "Afgewezen", Icon: XCircle, red: true };
  }
}

// Vette geroteerde as-tekst; blijft door skew ompgekeerd toch leesbaar op de diagonaal.
function AxisLabel({
  children,
  tone = "ink",
}: {
  children: React.ReactNode;
  tone?: "ink" | "red";
}) {
  return (
    <span
      className="inline-block whitespace-nowrap text-[10px] font-bold uppercase leading-none tracking-[0.42em]"
      style={{ ...mono, color: tone === "red" ? C.red : C.inkSoft }}
    >
      {children}
    </span>
  );
}

function BlockNo({ n }: { n: number }) {
  return (
    <span
      className="inline-flex h-9 w-9 items-center justify-center text-[15px] font-extrabold tabular-nums"
      style={{ ...mono, background: C.ink, color: C.paper }}
      aria-hidden="true"
    >
      {String(n).padStart(2, "0")}
    </span>
  );
}

function Sparkbars({ data, tone = "ink" }: { data: number[]; tone?: "ink" | "red" }) {
  const max = Math.max(...data);
  const min = Math.min(...data);
  const span = max - min || 1;
  return (
    <div className="flex h-8 items-end gap-[3px]" aria-hidden="true">
      {data.map((v, i) => {
        const h = 20 + ((v - min) / span) * 80;
        const last = i === data.length - 1;
        return (
          <span
            key={i}
            className="w-[5px] transition-all duration-500"
            style={{
              height: `${h}%`,
              background: last ? (tone === "red" ? C.red : C.ink) : C.lineStrong,
            }}
          />
        );
      })}
    </div>
  );
}

export function Concept109() {
  const [screen, setScreen] = useState<ScreenKey>("dashboard");
  const active = OPDRACHTEN[0] as Opdracht;

  return (
    <div
      className="relative min-h-[680px] w-full overflow-hidden antialiased"
      style={{ ...mono, background: C.paper, color: C.ink }}
    >
      {/* Diagonale agitprop-achtergrond: dikke rode balk + zwarte schuine as + cirkels */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
        <div
          className="absolute -left-[10%] -top-[30%] h-[70%] w-[140%] opacity-90"
          style={{ background: C.red, transform: "rotate(-9deg)", transformOrigin: "top left" }}
        />
        <div
          className="absolute -right-[20%] top-[8%] h-[3px] w-[160%]"
          style={{ background: C.ink, transform: "rotate(-24deg)" }}
        />
        <div
          className="absolute -left-[15%] bottom-[6%] h-[3px] w-[160%]"
          style={{ background: C.ink, transform: "rotate(-24deg)" }}
        />
        <div
          className="absolute right-[6%] top-[4%] h-40 w-40 rounded-full border-[10px]"
          style={{ borderColor: C.ink, opacity: 0.12 }}
        />
        <div
          className="absolute -bottom-16 -left-10 h-64 w-64 rounded-full"
          style={{ background: C.ink, opacity: 0.06 }}
        />
      </div>

      {/* Kop — merk als affiche-titel, diagonaal geplaatst blok */}
      <header className="relative mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-5 pt-8 md:px-8">
        <div className="flex items-center gap-3">
          <span
            className="flex h-11 w-11 items-center justify-center"
            style={{ background: C.ink }}
            aria-hidden="true"
          >
            <Zap size={22} strokeWidth={2.6} style={{ color: C.red }} />
          </span>
          <div className="leading-none">
            <div
              className="text-[26px] font-extrabold uppercase tracking-[-0.02em]"
              style={{ ...display, color: C.paper }}
            >
              Constructie
            </div>
            <div
              className="mt-1 text-[10px] font-bold uppercase tracking-[0.5em]"
              style={{ color: C.paper }}
            >
              ZZP · Platform
            </div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="hidden text-right leading-tight sm:block">
            <div
              className="text-[12px] font-bold uppercase tracking-[0.14em]"
              style={{ color: C.ink }}
            >
              {PROFIEL.naam}
            </div>
            <div className="text-[10px] uppercase tracking-[0.24em]" style={{ color: C.muted }}>
              {PROFIEL.rol}
            </div>
          </div>
          <span
            className="flex h-11 w-11 items-center justify-center text-[13px] font-extrabold"
            style={{ background: C.red, color: C.paper, transform: "rotate(-6deg)" }}
            aria-hidden="true"
          >
            {PROFIEL.initialen}
          </span>
        </div>
      </header>

      {/* Navigatie — diagonaal ritme, actief blok gevuld */}
      <nav
        className="relative mx-auto mt-6 flex max-w-6xl items-stretch gap-1 overflow-x-auto px-5 pb-4 md:px-8"
        aria-label="Hoofdnavigatie"
      >
        {SCREENS.map((s, i) => {
          const on = s.key === screen;
          return (
            <button
              key={s.key}
              onClick={() => setScreen(s.key)}
              aria-current={on ? "page" : undefined}
              className="group relative flex shrink-0 items-center gap-2 px-3.5 py-2 text-[11px] font-bold uppercase tracking-[0.16em] transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
              style={{
                background: on ? C.ink : "transparent",
                color: on ? C.paper : C.inkSoft,
                border: `2px solid ${on ? C.ink : C.lineStrong}`,
              }}
            >
              <span
                className="text-[10px] tabular-nums"
                style={{ color: on ? C.red : C.muted }}
                aria-hidden="true"
              >
                {String(i + 1).padStart(2, "0")}
              </span>
              {s.label}
            </button>
          );
        })}
      </nav>

      <div className="relative mx-auto max-w-6xl px-5 pb-16 pt-4 md:px-8">
        {screen === "dashboard" && <Dashboard onOpen={() => setScreen("opdracht")} />}
        {screen === "marktplaats" && <Marktplaats onOpen={() => setScreen("opdracht")} />}
        {screen === "opdracht" && (
          <OpdrachtDetail opdracht={active} onBack={() => setScreen("marktplaats")} />
        )}
        {screen === "verificatie" && <Verificatie />}
        {screen === "acties" && <Acties />}
        {screen === "facturen" && <Facturen />}
      </div>
    </div>
  );
}

function SectionHead({ n, kicker, title }: { n: number; kicker: string; title: string }) {
  return (
    <div className="flex items-center gap-4">
      <BlockNo n={n} />
      <div className="min-w-0">
        <AxisLabel tone="red">{kicker}</AxisLabel>
        <h2
          className="mt-1 truncate text-[22px] font-extrabold uppercase leading-none tracking-[-0.01em]"
          style={display}
        >
          {title}
        </h2>
      </div>
      <div
        className="ml-auto hidden h-[2px] flex-1 sm:block"
        style={{ background: C.lineStrong }}
      />
    </div>
  );
}

function Dashboard({ onOpen }: { onOpen: () => void }) {
  const primair = ACTIES[0] as (typeof ACTIES)[number];
  const top = OPDRACHTEN[0] as Opdracht;
  return (
    <div className="space-y-10">
      {/* Manifest-kop op de diagonaal */}
      <section
        className="relative flex flex-col justify-between gap-6 p-6 md:flex-row md:items-end"
        style={{ background: C.ink, color: C.paper }}
      >
        <div className="max-w-xl">
          <AxisLabel tone="red">Productie · vandaag</AxisLabel>
          <h1
            className="mt-3 text-[40px] font-extrabold uppercase leading-[0.92] tracking-[-0.02em] sm:text-[54px]"
            style={{ ...display, color: C.paper }}
          >
            Werk aan
            <br />
            <span style={{ color: C.red }}>de opbouw.</span>
          </h1>
          <p
            className="mt-4 max-w-md text-[12px] leading-relaxed"
            style={{ color: "rgba(234,228,213,0.7)" }}
          >
            Eén ding vraagt nu je hand. De machine draait — jij stuurt.
          </p>
        </div>
        <button
          onClick={onOpen}
          className="group inline-flex shrink-0 items-center gap-3 px-6 py-3.5 text-[13px] font-extrabold uppercase tracking-[0.14em] transition-transform hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 motion-reduce:hover:translate-y-0"
          style={{ background: C.red, color: C.paper }}
        >
          {primair.cta}
          <ArrowUpRight size={17} strokeWidth={2.6} aria-hidden="true" />
        </button>
        <Triangle
          size={26}
          strokeWidth={2.6}
          className="absolute right-5 top-5 hidden md:block"
          style={{ color: C.red, transform: "rotate(18deg)" }}
          aria-hidden="true"
        />
      </section>

      {/* KPI-brigade — vier blokken op één as */}
      <section>
        <SectionHead n={1} kicker="Cijfers · index" title="Prestatie" />
        <div className="mt-5 grid grid-cols-2 gap-3 lg:grid-cols-4">
          {KPIS.map((k, i) => {
            const alarm = !k.up;
            return (
              <div
                key={k.label}
                className="group relative flex flex-col justify-between p-4 transition-transform hover:-translate-y-1 motion-reduce:hover:translate-y-0"
                style={{
                  background: C.paperDeep,
                  border: `2px solid ${C.ink}`,
                  boxShadow: `5px 5px 0 0 ${alarm ? C.red : C.ink}`,
                }}
              >
                <div className="flex items-start justify-between">
                  <span
                    className="text-[10px] tabular-nums"
                    style={{ color: C.muted }}
                    aria-hidden="true"
                  >
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <span
                    className="inline-flex items-center gap-1 px-1.5 py-0.5 text-[10px] font-bold tabular-nums"
                    style={{ background: alarm ? C.red : C.ink, color: C.paper }}
                  >
                    {k.up ? "▲" : "●"} {k.trend}
                  </span>
                </div>
                <div
                  className="mt-4 text-[30px] font-extrabold tabular-nums leading-none tracking-[-0.02em]"
                  style={display}
                >
                  {k.value}
                </div>
                <div
                  className="mt-1.5 text-[10px] font-bold uppercase tracking-[0.14em]"
                  style={{ color: C.inkSoft }}
                >
                  {k.label}
                </div>
                <div className="mt-3">
                  <Sparkbars data={k.spark} tone={alarm ? "red" : "ink"} />
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Top-match als affiche-blok */}
      <section>
        <SectionHead n={2} kicker="Toewijzing · beste match" title="Voor jou" />
        <button
          onClick={onOpen}
          className="group mt-5 flex w-full flex-col gap-5 p-5 text-left transition-transform hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 motion-reduce:hover:translate-y-0 md:flex-row md:items-center"
          style={{ background: C.paperDeep, border: `2px solid ${C.ink}` }}
        >
          <div
            className="flex h-20 w-20 shrink-0 flex-col items-center justify-center"
            style={{ background: C.red, color: C.paper, transform: "rotate(-4deg)" }}
            aria-hidden="true"
          >
            <span className="text-[24px] font-extrabold tabular-nums leading-none" style={display}>
              {top.match}
            </span>
            <span className="text-[10px] font-bold uppercase tracking-[0.2em]">match</span>
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="text-[20px] font-extrabold uppercase leading-tight" style={display}>
              {top.titel}
            </h3>
            <div
              className="mt-1 text-[11px] uppercase tracking-[0.16em]"
              style={{ color: C.muted }}
            >
              {top.opdrachtgever} · {top.plaats} · {top.tarief}
            </div>
            <div className="mt-3 flex flex-wrap gap-1.5">
              {top.tags.map((t) => (
                <span
                  key={t}
                  className="px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.1em]"
                  style={{ border: `2px solid ${C.lineStrong}`, color: C.inkSoft }}
                >
                  {t}
                </span>
              ))}
            </div>
          </div>
          <ArrowRight
            size={26}
            strokeWidth={2.6}
            className="hidden shrink-0 transition-transform group-hover:translate-x-1 motion-reduce:group-hover:translate-x-0 md:block"
            aria-hidden="true"
          />
        </button>
      </section>
    </div>
  );
}

function MatchMeter({ value }: { value: number }) {
  return (
    <div className="flex items-center gap-2">
      <div
        className="relative h-2.5 w-24 overflow-hidden"
        style={{ background: C.line }}
        aria-hidden="true"
      >
        <div
          className="absolute inset-y-0 left-0"
          style={{ width: `${value}%`, background: C.red }}
        />
      </div>
      <span
        className="text-[12px] font-extrabold tabular-nums"
        style={{ ...display, color: C.red }}
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
    <div className="space-y-6">
      <SectionHead n={3} kicker="Distributie · open" title="Marktplaats" />

      <div className="flex items-center gap-3" style={{ borderBottom: `3px solid ${C.ink}` }}>
        <Radio size={18} strokeWidth={2.4} style={{ color: C.red }} aria-hidden="true" />
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="ZOEK OP TITEL, PLAATS, OPDRACHTGEVER…"
          aria-label="Opdrachten zoeken"
          className="w-full bg-transparent py-3 text-[14px] font-bold uppercase tracking-[0.08em] outline-none placeholder:opacity-40"
          style={{ ...mono, color: C.ink }}
        />
        <span className="shrink-0 text-[11px] font-bold tabular-nums" style={{ color: C.muted }}>
          {filtered.length}/{OPDRACHTEN.length}
        </span>
      </div>

      {filtered.length === 0 ? (
        <div
          className="flex flex-col items-center justify-center gap-4 p-14 text-center"
          style={{ border: `2px dashed ${C.lineStrong}` }}
        >
          <Square size={30} strokeWidth={2.4} style={{ color: C.muted }} aria-hidden="true" />
          <p className="text-[18px] font-extrabold uppercase" style={display}>
            Geen toewijzing
          </p>
          <p
            className="max-w-xs text-[11px] uppercase tracking-[0.12em]"
            style={{ color: C.muted }}
          >
            Niets past bij “{q}”. Verruim de zoekopdracht.
          </p>
          <button
            onClick={() => setQ("")}
            className="px-4 py-2 text-[11px] font-bold uppercase tracking-[0.14em] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
            style={{ background: C.ink, color: C.paper }}
          >
            Wis filter
          </button>
        </div>
      ) : (
        <ul className="space-y-3">
          {filtered.map((o, i) => (
            <li key={o.id}>
              <button
                onClick={onOpen}
                className="group flex w-full flex-col gap-4 p-4 text-left transition-transform hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 motion-reduce:hover:translate-y-0 sm:flex-row sm:items-center"
                style={{ background: C.paperDeep, border: `2px solid ${C.ink}` }}
              >
                <span
                  className="flex h-10 w-10 shrink-0 items-center justify-center text-[13px] font-extrabold tabular-nums"
                  style={{ ...mono, background: C.ink, color: C.paper }}
                  aria-hidden="true"
                >
                  {String(i + 1).padStart(2, "0")}
                </span>
                <div className="min-w-0 flex-1">
                  <h3
                    className="text-[16px] font-extrabold uppercase leading-tight"
                    style={display}
                  >
                    {o.titel}
                  </h3>
                  <div
                    className="mt-0.5 text-[11px] uppercase tracking-[0.14em]"
                    style={{ color: C.muted }}
                  >
                    {o.opdrachtgever} · {o.plaats} · {o.tarief}
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <MatchMeter value={o.match} />
                  <ArrowUpRight
                    size={20}
                    strokeWidth={2.6}
                    className="shrink-0 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5 motion-reduce:transform-none"
                    aria-hidden="true"
                  />
                </div>
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
    <div className="space-y-6">
      <button
        onClick={onBack}
        className="inline-flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.16em] transition-opacity hover:opacity-60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
        style={{ color: C.inkSoft }}
      >
        <ArrowRight size={14} strokeWidth={2.6} className="rotate-180" aria-hidden="true" />
        Terug naar marktplaats
      </button>

      {/* Affiche-kop */}
      <section
        className="relative overflow-hidden p-6"
        style={{ background: C.ink, color: C.paper }}
      >
        <div className="flex flex-wrap items-center gap-3">
          <span
            className="text-[11px] font-bold uppercase tracking-[0.3em]"
            style={{ color: C.red }}
          >
            {opdracht.id}
          </span>
          <span
            className="px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.14em]"
            style={{ background: C.red, color: C.paper }}
          >
            {opdracht.match}% match
          </span>
        </div>
        <h1
          className="mt-4 max-w-2xl text-[34px] font-extrabold uppercase leading-[0.94] tracking-[-0.02em] sm:text-[46px]"
          style={{ ...display, color: C.paper }}
        >
          {opdracht.titel}
        </h1>
        <p
          className="mt-3 text-[12px] uppercase tracking-[0.18em]"
          style={{ color: "rgba(234,228,213,0.7)" }}
        >
          {opdracht.opdrachtgever} · {opdracht.plaats}
        </p>
        <Circle
          size={120}
          strokeWidth={2}
          className="absolute -right-8 -top-8 hidden opacity-10 md:block"
          style={{ color: C.paper }}
          aria-hidden="true"
        />
      </section>

      {/* Feiten-brigade */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {[
          { l: "Tarief", v: opdracht.tarief },
          { l: "Omvang", v: opdracht.uren },
          { l: "Start", v: opdracht.start },
          { l: "Match", v: `${opdracht.match}%` },
        ].map((m) => (
          <div
            key={m.l}
            className="p-4"
            style={{ background: C.paperDeep, border: `2px solid ${C.ink}` }}
          >
            <div className="text-[20px] font-extrabold tabular-nums leading-none" style={display}>
              {m.v}
            </div>
            <div
              className="mt-2 text-[10px] font-bold uppercase tracking-[0.16em]"
              style={{ color: C.muted }}
            >
              {m.l}
            </div>
          </div>
        ))}
      </div>

      {/* Redenen — twee kolommen op één as */}
      <SectionHead n={4} kicker="Analyse · onderbouwing" title="Waarom deze match" />
      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
        <div className="p-5" style={{ background: C.paperDeep, border: `2px solid ${C.ink}` }}>
          <div
            className="mb-3 inline-flex items-center gap-2 px-2 py-1 text-[10px] font-bold uppercase tracking-[0.14em]"
            style={{ background: C.ink, color: C.paper }}
          >
            <Check size={13} strokeWidth={3} aria-hidden="true" /> Wat past
          </div>
          <ul className="space-y-2.5">
            {opdracht.redenen.plus.map((r) => (
              <li
                key={r}
                className="flex items-start gap-2.5 text-[13px] leading-snug"
                style={{ color: C.inkSoft }}
              >
                <span
                  className="mt-1.5 h-2 w-2 shrink-0"
                  style={{ background: C.ink }}
                  aria-hidden="true"
                />
                {r}
              </li>
            ))}
          </ul>
        </div>
        <div className="p-5" style={{ background: C.paperDeep, border: `2px solid ${C.red}` }}>
          <div
            className="mb-3 inline-flex items-center gap-2 px-2 py-1 text-[10px] font-bold uppercase tracking-[0.14em]"
            style={{ background: C.red, color: C.paper }}
          >
            <AlertTriangle size={13} strokeWidth={3} aria-hidden="true" /> Aandacht
          </div>
          <ul className="space-y-2.5">
            {opdracht.redenen.min.map((r) => (
              <li
                key={r}
                className="flex items-start gap-2.5 text-[13px] leading-snug"
                style={{ color: C.inkSoft }}
              >
                <span
                  className="mt-1.5 h-2 w-2 shrink-0"
                  style={{ background: C.red }}
                  aria-hidden="true"
                />
                {r}
              </li>
            ))}
          </ul>
        </div>
      </div>

      <button
        className="inline-flex w-full items-center justify-center gap-3 px-6 py-4 text-[14px] font-extrabold uppercase tracking-[0.16em] transition-transform hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 motion-reduce:hover:translate-y-0 sm:w-auto"
        style={{ background: C.red, color: C.paper }}
      >
        Reageer op opdracht
        <ArrowUpRight size={18} strokeWidth={2.6} aria-hidden="true" />
      </button>
    </div>
  );
}

function Verificatie() {
  const verified = CREDENTIALS.filter((c) => c.status === "VERIFIED").length;
  const pct = Math.round((verified / CREDENTIALS.length) * 100);
  return (
    <div className="space-y-6">
      <SectionHead n={5} kicker="Vertrouwen · dossier" title="Verificatie" />

      {/* Vertrouwensbalk als affiche-blok */}
      <section
        className="flex flex-col gap-5 p-6 sm:flex-row sm:items-center"
        style={{ background: C.ink, color: C.paper }}
      >
        <div
          className="flex h-24 w-24 shrink-0 flex-col items-center justify-center"
          style={{ border: `4px solid ${C.red}` }}
          aria-hidden="true"
        >
          <span
            className="text-[30px] font-extrabold tabular-nums leading-none"
            style={{ ...display, color: C.paper }}
          >
            {pct}%
          </span>
          <span
            className="text-[9px] font-bold uppercase tracking-[0.2em]"
            style={{ color: C.red }}
          >
            gedekt
          </span>
        </div>
        <div>
          <div
            className="text-[11px] font-bold uppercase tracking-[0.3em]"
            style={{ color: C.red }}
          >
            {PROFIEL.trust}
          </div>
          <p
            className="mt-2 max-w-md text-[13px] leading-relaxed"
            style={{ color: "rgba(234,228,213,0.78)" }}
          >
            {verified} van {CREDENTIALS.length} credentials volledig geverifieerd. Eén dossier
            vraagt binnenkort actie — handel op tijd om verifieerbaar te blijven.
          </p>
        </div>
      </section>

      <ul className="space-y-3">
        {CREDENTIALS.map((c, i) => {
          const st = statusMeta(c.status);
          return (
            <li
              key={c.naam}
              className="flex items-center gap-4 p-4"
              style={{
                background: C.paperDeep,
                border: `2px solid ${st.red ? C.red : C.ink}`,
              }}
            >
              <span
                className="flex h-10 w-10 shrink-0 items-center justify-center text-[12px] font-extrabold tabular-nums"
                style={{ ...mono, background: st.red ? C.red : C.ink, color: C.paper }}
                aria-hidden="true"
              >
                {String(i + 1).padStart(2, "0")}
              </span>
              <div className="min-w-0 flex-1">
                <div className="text-[15px] font-extrabold uppercase leading-tight" style={display}>
                  {c.naam}
                </div>
                <div
                  className="mt-0.5 text-[11px] uppercase tracking-[0.1em]"
                  style={{ color: C.muted }}
                >
                  {c.detail}
                </div>
              </div>
              <span
                className="inline-flex shrink-0 items-center gap-1.5 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.1em]"
                style={{
                  background: st.red ? C.red : "transparent",
                  color: st.red ? C.paper : C.inkSoft,
                  border: `2px solid ${st.red ? C.red : C.lineStrong}`,
                }}
              >
                <st.Icon size={13} strokeWidth={2.8} aria-hidden="true" />
                <span className="hidden sm:inline">{st.label}</span>
              </span>
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
    <div className="space-y-6">
      <SectionHead n={6} kicker="Directief · volgorde" title="Volgende acties" />
      <ol className="space-y-3">
        {sorted.map((a, i) => {
          const warn = a.urgentie === "warning";
          return (
            <li
              key={a.titel}
              className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center"
              style={{
                background: C.paperDeep,
                border: `2px solid ${warn ? C.red : C.ink}`,
                boxShadow: warn ? `5px 5px 0 0 ${C.red}` : "none",
              }}
            >
              <span
                className="flex h-12 w-12 shrink-0 items-center justify-center text-[18px] font-extrabold tabular-nums"
                style={{ ...display, background: warn ? C.red : C.ink, color: C.paper }}
                aria-hidden="true"
              >
                {String(i + 1).padStart(2, "0")}
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  {warn ? (
                    <AlertTriangle
                      size={15}
                      strokeWidth={2.8}
                      style={{ color: C.red }}
                      aria-hidden="true"
                    />
                  ) : (
                    <Radio
                      size={15}
                      strokeWidth={2.8}
                      style={{ color: C.inkSoft }}
                      aria-hidden="true"
                    />
                  )}
                  <h3
                    className="text-[16px] font-extrabold uppercase leading-tight"
                    style={display}
                  >
                    {a.titel}
                  </h3>
                  <span className="sr-only">{warn ? "Urgent" : "Informatief"}</span>
                </div>
                <p className="mt-1.5 text-[12px] leading-relaxed" style={{ color: C.muted }}>
                  {a.detail}
                </p>
              </div>
              <button
                className="shrink-0 self-start px-5 py-2.5 text-[11px] font-bold uppercase tracking-[0.14em] transition-transform hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 motion-reduce:hover:translate-y-0 sm:self-center"
                style={{ background: warn ? C.red : C.ink, color: C.paper }}
              >
                {a.cta}
              </button>
            </li>
          );
        })}
      </ol>
    </div>
  );
}

function Facturen() {
  const total = "€ 8.622";
  const badge = (status: string): { bg: string; fg: string } => {
    if (status === "Betaald") return { bg: C.ink, fg: C.paper };
    if (status === "Openstaand") return { bg: C.red, fg: C.paper };
    return { bg: "transparent", fg: C.inkSoft };
  };
  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <SectionHead n={7} kicker="Boekhouding · omzet" title="Facturen" />
        <button
          className="inline-flex items-center gap-2 px-4 py-2.5 text-[11px] font-bold uppercase tracking-[0.14em] transition-transform hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 motion-reduce:hover:translate-y-0"
          style={{ background: C.red, color: C.paper }}
        >
          <ArrowUpRight size={15} strokeWidth={2.6} aria-hidden="true" /> Nieuwe factuur
        </button>
      </div>

      <div className="overflow-x-auto" style={{ border: `2px solid ${C.ink}` }}>
        <table className="w-full min-w-[560px] border-collapse text-left">
          <thead>
            <tr style={{ background: C.ink, color: C.paper }}>
              {["Nummer", "Klant", "Datum", "Status", "Bedrag"].map((h, i) => (
                <th
                  key={h}
                  className={`px-4 py-3 text-[10px] font-bold uppercase tracking-[0.16em] ${i === 4 ? "text-right" : ""}`}
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
                  className="transition-opacity hover:opacity-80"
                  style={{ borderTop: `2px solid ${C.line}` }}
                >
                  <td className="px-4 py-3.5 text-[12px] font-bold tabular-nums" style={mono}>
                    {f.nr}
                  </td>
                  <td className="px-4 py-3.5 text-[13px] font-extrabold uppercase" style={display}>
                    {f.klant}
                  </td>
                  <td className="px-4 py-3.5 text-[12px] tabular-nums" style={{ color: C.muted }}>
                    {f.datum}
                  </td>
                  <td className="px-4 py-3.5">
                    <span
                      className="inline-block px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.1em]"
                      style={{
                        background: b.bg,
                        color: b.fg,
                        border: `2px solid ${b.bg === "transparent" ? C.lineStrong : b.bg}`,
                      }}
                    >
                      {f.status}
                    </span>
                  </td>
                  <td
                    className="px-4 py-3.5 text-right text-[14px] font-extrabold tabular-nums"
                    style={display}
                  >
                    {f.bedrag}
                  </td>
                </tr>
              );
            })}
          </tbody>
          <tfoot>
            <tr style={{ background: C.paperDeep, borderTop: `3px solid ${C.ink}` }}>
              <td
                colSpan={4}
                className="px-4 py-4 text-[10px] font-bold uppercase tracking-[0.2em]"
                style={{ color: C.inkSoft }}
              >
                Totaal betaald
              </td>
              <td
                className="px-4 py-4 text-right text-[18px] font-extrabold tabular-nums"
                style={{ ...display, color: C.red }}
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
