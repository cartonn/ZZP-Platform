"use client";

// Concept 353 — "Atelier" · Architecten-blauwdruk op warm perkament.
// Technische tekening-esthetiek: warm perkament (#f4efe4) als papier, blauwdruk-blauw (#1f4e79) als
// inkt-accent. Leader-lines en maatlijnen met schaalstreepjes (inline SVG), kader-koppen als
// tekening-titelblok, potlood-annotaties in mono. Ingenieurs-precisie, maar warm en menselijk.
// Fraunces als display-serif, Space Mono voor annotaties/maatvoering, Jakarta voor lopende tekst.

import { useState } from "react";
import {
  ArrowUpRight,
  Search,
  Check,
  Clock,
  AlertTriangle,
  ChevronRight,
  Ruler,
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
  paper: "#f4efe4",
  paperDeep: "#ece5d6",
  card: "#faf7f0",
  ink: "#1f4e79",
  inkDeep: "#173a5c",
  graphite: "#3a3733",
  muted: "#7a736a",
  faint: "#a89f92",
  hair: "rgba(31,78,121,0.2)",
  hairSoft: "rgba(58,55,51,0.12)",
  grid: "rgba(31,78,121,0.06)",
  ok: "#3f7d5c",
  warn: "#b06a2e",
  bad: "#a2472e",
};

const serif = { fontFamily: "var(--font-lab-fraunces)" };
const mono = { fontFamily: "var(--font-lab-space-mono)" };
const ui = { fontFamily: "var(--font-lab-jakarta)" };

function statusMeta(s: CredStatus): { label: string; Icon: LucideIcon; color: string } {
  switch (s) {
    case "VERIFIED":
      return { label: "Geverifieerd", Icon: Check, color: C.ok };
    case "SUBMITTED":
      return { label: "In beoordeling", Icon: Clock, color: C.ink };
    case "EXPIRING":
      return { label: "Verloopt binnenkort", Icon: AlertTriangle, color: C.warn };
    case "REJECTED":
      return { label: "Afgewezen", Icon: AlertTriangle, color: C.bad };
  }
}

// Maatlijn met schaalstreepjes — als potlood-maatvoering op een bouwtekening.
function DimLine({ label }: { label: string }) {
  return (
    <div className="flex items-center gap-2" aria-hidden="true">
      <svg
        width="100%"
        height="10"
        viewBox="0 0 200 10"
        preserveAspectRatio="none"
        className="flex-1"
      >
        <line x1="1" y1="5" x2="199" y2="5" stroke={C.hair} strokeWidth="1" />
        <line x1="1" y1="1" x2="1" y2="9" stroke={C.hair} strokeWidth="1" />
        <line x1="199" y1="1" x2="199" y2="9" stroke={C.hair} strokeWidth="1" />
      </svg>
      <span
        className="shrink-0 text-[9.5px] uppercase"
        style={{ ...mono, color: C.faint, letterSpacing: "0.18em" }}
      >
        {label}
      </span>
    </div>
  );
}

// Titelblok-kop, zoals rechtsonder op een technische tekening.
function TitleBlock({
  code,
  title,
  right,
}: {
  code: string;
  title: string;
  right?: React.ReactNode;
}) {
  return (
    <div className="flex items-stretch justify-between border-b" style={{ borderColor: C.hair }}>
      <div className="flex items-stretch">
        <div
          className="flex items-center px-3 py-2"
          style={{ borderRight: `1px solid ${C.hair}`, background: "rgba(31,78,121,0.05)" }}
        >
          <span
            className="text-[10px] uppercase tabular-nums"
            style={{ ...mono, color: C.ink, letterSpacing: "0.14em" }}
          >
            {code}
          </span>
        </div>
        <div className="flex items-center px-3 py-2">
          <span
            className="text-[11px] uppercase"
            style={{ ...mono, color: C.muted, letterSpacing: "0.2em" }}
          >
            {title}
          </span>
        </div>
      </div>
      {right && <div className="flex items-center px-3 py-2">{right}</div>}
    </div>
  );
}

function Sheet({
  code,
  title,
  right,
  children,
}: {
  code: string;
  title: string;
  right?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section
      className="rounded-[3px]"
      style={{
        background: C.card,
        border: `1px solid ${C.hair}`,
        boxShadow: "0 1px 0 rgba(31,78,121,0.06)",
      }}
    >
      <TitleBlock code={code} title={title} right={right} />
      <div className="p-5">{children}</div>
    </section>
  );
}

export function Concept353() {
  const [screen, setScreen] = useState<ScreenKey>("dashboard");
  const active = OPDRACHTEN[0] as Opdracht;

  return (
    <div
      className="min-h-[680px] w-full antialiased"
      style={{
        ...ui,
        color: C.graphite,
        background: C.paper,
        backgroundImage: `linear-gradient(${C.grid} 1px, transparent 1px), linear-gradient(90deg, ${C.grid} 1px, transparent 1px)`,
        backgroundSize: "26px 26px",
      }}
    >
      <header
        className="flex items-center justify-between gap-4 px-5 py-4 md:px-9"
        style={{ borderBottom: `1px solid ${C.hair}`, background: C.paperDeep }}
      >
        <div className="flex items-center gap-3">
          <span
            className="flex h-10 w-10 items-center justify-center rounded-[3px]"
            style={{ border: `1.5px solid ${C.ink}`, background: C.card }}
            aria-hidden="true"
          >
            <Ruler size={18} style={{ color: C.ink }} />
          </span>
          <div className="leading-tight">
            <p
              className="text-[18px] font-semibold tracking-[-0.01em]"
              style={{ ...serif, color: C.inkDeep }}
            >
              Atelier
            </p>
            <p
              className="text-[10px] uppercase"
              style={{ ...mono, color: C.muted, letterSpacing: "0.22em" }}
            >
              Blad · ZZP-tekening
            </p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <span
            className="hidden text-[10px] uppercase sm:inline"
            style={{ ...mono, color: C.faint, letterSpacing: "0.18em" }}
          >
            Schaal 1:1 · A-04
          </span>
          <span
            className="flex h-10 w-10 items-center justify-center rounded-[3px] text-[12px] font-semibold"
            style={{ ...mono, border: `1.5px solid ${C.ink}`, color: C.ink, background: C.card }}
            aria-hidden="true"
          >
            {PROFIEL.initialen}
          </span>
        </div>
      </header>

      <nav
        className="flex items-center gap-1 overflow-x-auto px-4 py-3 md:px-9"
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
              className="shrink-0 rounded-[3px] px-3 py-1.5 text-[11px] uppercase transition-colors focus-visible:outline-none focus-visible:ring-2"
              style={{
                ...mono,
                letterSpacing: "0.12em",
                color: on ? C.card : C.muted,
                background: on ? C.ink : "transparent",
                border: `1px solid ${on ? C.ink : "transparent"}`,
              }}
            >
              {s.label}
            </button>
          );
        })}
      </nav>

      <main className="px-4 py-6 md:px-9 md:py-8">
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
  return (
    <div className="space-y-5">
      <Sheet
        code="A-01"
        title="Aanzicht · vandaag"
        right={
          <span
            className="text-[10px] uppercase"
            style={{ ...mono, color: C.faint, letterSpacing: "0.16em" }}
          >
            get. {PROFIEL.initialen}
          </span>
        }
      >
        <div className="grid gap-6 md:grid-cols-[1.5fr,1fr] md:items-center">
          <div>
            <p
              className="text-[10.5px] uppercase"
              style={{ ...mono, color: C.ink, letterSpacing: "0.26em" }}
            >
              Ontwerp-opgave
            </p>
            <h1
              className="mt-3 text-[34px] font-semibold leading-[1.05] tracking-[-0.02em] sm:text-[42px]"
              style={{ ...serif, color: C.inkDeep }}
            >
              Goedemorgen, {PROFIEL.naam.split(" ")[0]}.
            </h1>
            <p className="mt-4 max-w-md text-[14px] leading-relaxed" style={{ color: C.muted }}>
              Drie posten op het blad vragen maatvoering. De eerste is ingemeten en klaar om af te
              tekenen.
            </p>
            <button
              onClick={onOpen}
              className="mt-5 inline-flex items-center gap-2 rounded-[3px] px-5 py-2.5 text-[13px] font-semibold transition-transform hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 motion-reduce:hover:translate-y-0"
              style={{ background: C.ink, color: C.card }}
            >
              {ACTIES[0]?.cta} <ArrowUpRight size={15} aria-hidden="true" />
            </button>
          </div>
          <AnnotatedFigure />
        </div>
      </Sheet>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {KPIS.map((k, i) => (
          <div
            key={k.label}
            className="rounded-[3px] p-4"
            style={{ background: C.card, border: `1px solid ${C.hair}` }}
          >
            <div className="flex items-center justify-between">
              <span
                className="text-[9px] uppercase tabular-nums"
                style={{ ...mono, color: C.faint, letterSpacing: "0.14em" }}
              >
                {`0${i + 1}`}
              </span>
              <span
                className="text-[9px] uppercase"
                style={{ ...mono, color: k.up ? C.ok : C.warn }}
              >
                {k.up ? "▲" : "▼"} {k.trend}
              </span>
            </div>
            <p
              className="mt-3 text-[26px] font-semibold tabular-nums leading-none"
              style={{ ...serif, color: C.inkDeep }}
            >
              {k.value}
            </p>
            <p className="mt-2 text-[11px]" style={{ color: C.muted }}>
              {k.label}
            </p>
            <div className="mt-3">
              <DimLine label={`${k.spark.length} mtg`} />
            </div>
          </div>
        ))}
      </div>

      <Sheet
        code="A-02"
        title="Plattegrond · opdrachten"
        right={
          <span className="text-[10px] tabular-nums" style={{ ...mono, color: C.faint }}>
            {OPDRACHTEN.length} posten
          </span>
        }
      >
        <ul className="space-y-3">
          {OPDRACHTEN.map((o, i) => (
            <OpdrachtRow key={o.id} o={o} index={i} onOpen={onOpen} />
          ))}
        </ul>
      </Sheet>
    </div>
  );
}

// Geannoteerde figuur met leader-lines — een klein technisch tekeningetje van het profiel.
function AnnotatedFigure() {
  return (
    <div className="relative mx-auto w-full max-w-[240px]">
      <svg
        viewBox="0 0 240 200"
        className="w-full"
        role="img"
        aria-label="Schematische weergave van het profiel"
      >
        {/* kader */}
        <rect
          x="60"
          y="40"
          width="120"
          height="120"
          rx="4"
          fill="none"
          stroke={C.ink}
          strokeWidth="1.5"
        />
        <circle cx="120" cy="82" r="20" fill="none" stroke={C.ink} strokeWidth="1.5" />
        <text x="120" y="88" textAnchor="middle" style={{ ...mono }} fontSize="15" fill={C.ink}>
          {PROFIEL.initialen}
        </text>
        <line x1="80" y1="120" x2="160" y2="120" stroke={C.hair} strokeWidth="1" />
        <line x1="80" y1="134" x2="140" y2="134" stroke={C.hair} strokeWidth="1" />
        {/* leader lines */}
        <line
          x1="180"
          y1="82"
          x2="222"
          y2="60"
          stroke={C.faint}
          strokeWidth="1"
          strokeDasharray="3 3"
        />
        <circle cx="180" cy="82" r="2" fill={C.ink} />
        <text x="224" y="58" style={{ ...mono }} fontSize="8" fill={C.muted}>
          Hoog vertr.
        </text>
        <line
          x1="60"
          y1="150"
          x2="20"
          y2="172"
          stroke={C.faint}
          strokeWidth="1"
          strokeDasharray="3 3"
        />
        <circle cx="60" cy="150" r="2" fill={C.ink} />
        <text x="4" y="184" style={{ ...mono }} fontSize="8" fill={C.muted}>
          BIG · geverif.
        </text>
        {/* maatvoering onder */}
        <line x1="60" y1="176" x2="180" y2="176" stroke={C.hair} strokeWidth="1" />
        <line x1="60" y1="172" x2="60" y2="180" stroke={C.hair} strokeWidth="1" />
        <line x1="180" y1="172" x2="180" y2="180" stroke={C.hair} strokeWidth="1" />
        <text x="120" y="192" textAnchor="middle" style={{ ...mono }} fontSize="8" fill={C.faint}>
          {PROFIEL.rol}
        </text>
      </svg>
    </div>
  );
}

function OpdrachtRow({ o, index, onOpen }: { o: Opdracht; index: number; onOpen: () => void }) {
  return (
    <li
      className="group flex flex-wrap items-center gap-3 rounded-[3px] p-3 transition-colors hover:bg-[#f0ebe0]"
      style={{ border: `1px solid ${C.hairSoft}` }}
    >
      <span
        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-[3px] text-[11px] tabular-nums"
        style={{ ...mono, border: `1px solid ${C.hair}`, color: C.ink }}
        aria-hidden="true"
      >
        {String(index + 1).padStart(2, "0")}
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-[14px] font-medium" style={{ color: C.graphite }}>
          {o.titel}
        </p>
        <p className="text-[11.5px]" style={{ color: C.muted }}>
          {o.opdrachtgever} · {o.plaats} · {o.tarief}
        </p>
      </div>
      <span
        className="inline-flex items-center rounded-[3px] px-2 py-1 text-[11px] tabular-nums"
        style={{ ...mono, border: `1px solid ${C.hair}`, color: C.ink }}
      >
        {o.match}%
      </span>
      <button
        onClick={onOpen}
        className="inline-flex items-center gap-1 rounded-[3px] px-3 py-1.5 text-[12px] font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 group-hover:text-[#1f4e79]"
        style={{ color: C.muted, border: `1px solid ${C.hairSoft}` }}
      >
        Openen <ChevronRight size={13} aria-hidden="true" />
      </button>
    </li>
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
    <div className="space-y-5">
      <Sheet code="M-01" title="Overzicht · marktplaats">
        <h1
          className="text-[28px] font-semibold tracking-[-0.01em]"
          style={{ ...serif, color: C.inkDeep }}
        >
          Open opdrachten
        </h1>
        <div
          className="mt-5 flex items-center gap-3 rounded-[3px] px-4 py-2.5"
          style={{ background: C.paper, border: `1px solid ${C.hair}` }}
        >
          <Search size={16} style={{ color: C.faint }} aria-hidden="true" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Zoek op titel, opdrachtgever of plaats…"
            aria-label="Opdrachten zoeken"
            className="w-full bg-transparent text-[14px] outline-none placeholder:text-[#a89f92]"
            style={{ color: C.graphite }}
          />
          {q && (
            <button
              onClick={() => setQ("")}
              className="text-[12px] font-medium focus-visible:outline-none focus-visible:ring-2"
              style={{ ...mono, color: C.ink }}
            >
              wis
            </button>
          )}
        </div>
      </Sheet>

      {filtered.length === 0 ? (
        <div
          className="rounded-[3px] px-6 py-16 text-center"
          style={{ background: C.card, border: `1px dashed ${C.hair}` }}
        >
          <span
            className="mx-auto flex h-14 w-14 items-center justify-center rounded-[3px]"
            style={{ border: `1.5px solid ${C.hair}` }}
            aria-hidden="true"
          >
            <Search size={22} style={{ color: C.faint }} />
          </span>
          <p className="mt-5 text-[22px] font-semibold" style={{ ...serif, color: C.inkDeep }}>
            Geen post op het blad
          </p>
          <p
            className="mx-auto mt-3 max-w-sm text-[13px] leading-relaxed"
            style={{ color: C.muted }}
          >
            Er staat niets ingetekend bij &ldquo;{q}&rdquo;. Verruim je zoekterm of wis het filter
            om alle posten te tonen.
          </p>
          <button
            onClick={() => setQ("")}
            className="mt-6 inline-flex items-center gap-2 rounded-[3px] px-5 py-2.5 text-[13px] font-semibold transition-transform hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 motion-reduce:hover:translate-y-0"
            style={{ background: C.ink, color: C.card }}
          >
            Zoekopdracht wissen
          </button>
        </div>
      ) : (
        <Sheet
          code="M-02"
          title="Posten"
          right={
            <span className="text-[10px] tabular-nums" style={{ ...mono, color: C.faint }}>
              {filtered.length} / {OPDRACHTEN.length}
            </span>
          }
        >
          <ul className="space-y-3">
            {filtered.map((o, i) => (
              <OpdrachtRow key={o.id} o={o} index={i} onOpen={onOpen} />
            ))}
          </ul>
        </Sheet>
      )}
    </div>
  );
}

function OpdrachtDetail({ opdracht, onBack }: { opdracht: Opdracht; onBack: () => void }) {
  const [tab, setTab] = useState<"match" | "detail">("match");
  return (
    <div className="space-y-5">
      <button
        onClick={onBack}
        className="inline-flex items-center gap-1.5 text-[12px] font-medium transition-colors hover:text-[#1f4e79] focus-visible:outline-none focus-visible:ring-2"
        style={{ ...mono, color: C.muted }}
      >
        <ChevronRight size={14} className="rotate-180" aria-hidden="true" /> Terug naar blad
      </button>

      <Sheet
        code={opdracht.id}
        title="Detail · opdracht"
        right={
          <span className="text-[10px] tabular-nums" style={{ ...mono, color: C.ink }}>
            match {opdracht.match}%
          </span>
        }
      >
        <h1
          className="max-w-2xl text-[28px] font-semibold leading-[1.1] tracking-[-0.01em]"
          style={{ ...serif, color: C.inkDeep }}
        >
          {opdracht.titel}
        </h1>
        <p className="mt-3 text-[14px]" style={{ color: C.muted }}>
          {opdracht.opdrachtgever} · {opdracht.plaats}
        </p>
        <div className="mt-4 max-w-sm">
          <DimLine label="ingemeten" />
        </div>
        <button
          className="mt-5 inline-flex items-center gap-2 rounded-[3px] px-5 py-2.5 text-[13px] font-semibold transition-transform hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 motion-reduce:hover:translate-y-0"
          style={{ background: C.ink, color: C.card }}
        >
          Reageer op opdracht <ArrowUpRight size={15} aria-hidden="true" />
        </button>
      </Sheet>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {[
          { l: "Tarief", v: opdracht.tarief },
          { l: "Omvang", v: opdracht.uren },
          { l: "Start", v: opdracht.start },
          { l: "Match", v: `${opdracht.match}%` },
        ].map((m) => (
          <div
            key={m.l}
            className="rounded-[3px] p-4"
            style={{ background: C.card, border: `1px solid ${C.hair}` }}
          >
            <p
              className="text-[9.5px] uppercase"
              style={{ ...mono, color: C.faint, letterSpacing: "0.16em" }}
            >
              {m.l}
            </p>
            <p
              className="mt-2 text-[17px] font-semibold tabular-nums"
              style={{ ...serif, color: C.inkDeep }}
            >
              {m.v}
            </p>
          </div>
        ))}
      </div>

      <Sheet
        code="D-01"
        title="Toelichting"
        right={
          <div className="flex gap-1">
            {(["match", "detail"] as const).map((t) => (
              <button
                key={t}
                onClick={() => setTab(t)}
                aria-current={tab === t ? "true" : undefined}
                className="rounded-[3px] px-2.5 py-1 text-[10px] uppercase focus-visible:outline-none focus-visible:ring-2"
                style={{
                  ...mono,
                  letterSpacing: "0.1em",
                  background: tab === t ? C.ink : "transparent",
                  color: tab === t ? C.card : C.muted,
                  border: `1px solid ${tab === t ? C.ink : C.hairSoft}`,
                }}
              >
                {t === "match" ? "Match" : "Kenmerk"}
              </button>
            ))}
          </div>
        }
      >
        {tab === "match" ? (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
            <div>
              <p
                className="text-[10px] uppercase"
                style={{ ...mono, color: C.ok, letterSpacing: "0.2em" }}
              >
                Wat past
              </p>
              <ul className="mt-3 space-y-2.5">
                {opdracht.redenen.plus.map((r) => (
                  <li
                    key={r}
                    className="flex items-start gap-2.5 text-[13.5px]"
                    style={{ color: C.graphite }}
                  >
                    <Check size={15} style={{ color: C.ok, marginTop: 2 }} aria-hidden="true" />
                    {r}
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <p
                className="text-[10px] uppercase"
                style={{ ...mono, color: C.warn, letterSpacing: "0.2em" }}
              >
                Aandacht
              </p>
              <ul className="mt-3 space-y-2.5">
                {opdracht.redenen.min.map((r) => (
                  <li
                    key={r}
                    className="flex items-start gap-2.5 text-[13.5px]"
                    style={{ color: C.muted }}
                  >
                    <AlertTriangle
                      size={15}
                      style={{ color: C.warn, marginTop: 2 }}
                      aria-hidden="true"
                    />
                    {r}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        ) : (
          <div className="flex flex-wrap gap-2">
            {opdracht.tags.map((t) => (
              <span
                key={t}
                className="rounded-[3px] px-3 py-1.5 text-[11px] uppercase"
                style={{
                  ...mono,
                  border: `1px solid ${C.hair}`,
                  color: C.ink,
                  letterSpacing: "0.06em",
                }}
              >
                {t}
              </span>
            ))}
          </div>
        )}
      </Sheet>
    </div>
  );
}

function Verificatie() {
  const verified = CREDENTIALS.filter((c) => c.status === "VERIFIED").length;
  return (
    <div className="space-y-5">
      <Sheet
        code="V-01"
        title="Keurblad · verificatie"
        right={
          <span
            className="text-[10px] uppercase"
            style={{ ...mono, color: C.ink, letterSpacing: "0.14em" }}
          >
            {PROFIEL.trust}
          </span>
        }
      >
        <div className="flex flex-wrap items-end gap-6">
          <p
            className="text-[46px] font-semibold tabular-nums leading-none"
            style={{ ...serif, color: C.inkDeep }}
          >
            {verified}
            <span className="text-[22px]" style={{ color: C.faint }}>
              /{CREDENTIALS.length}
            </span>
          </p>
          <p className="mb-1 max-w-xs text-[13px] leading-relaxed" style={{ color: C.muted }}>
            credentials afgetekend. Eén post nadert de vervaldatum en vraagt binnenkort een nieuwe
            meting.
          </p>
        </div>
        <div className="mt-4 max-w-md">
          <DimLine label="controle-blad" />
        </div>
      </Sheet>

      <Sheet code="V-02" title="Posten · credentials">
        <ul className="space-y-2.5">
          {CREDENTIALS.map((c) => {
            const m = statusMeta(c.status);
            return (
              <li
                key={c.naam}
                className="flex flex-wrap items-center gap-3 rounded-[3px] p-3 transition-colors hover:bg-[#f0ebe0]"
                style={{ border: `1px solid ${C.hairSoft}` }}
              >
                <span
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[3px]"
                  style={{ border: `1px solid ${C.hair}` }}
                  aria-hidden="true"
                >
                  <m.Icon size={16} style={{ color: m.color }} />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-[13.5px] font-medium" style={{ color: C.graphite }}>
                    {c.naam}
                  </p>
                  <p className="text-[11.5px]" style={{ color: C.muted }}>
                    {c.detail}
                  </p>
                </div>
                <span
                  className="rounded-[3px] px-2 py-1 text-[10px] uppercase"
                  style={{
                    ...mono,
                    border: `1px solid ${C.hair}`,
                    color: m.color,
                    letterSpacing: "0.08em",
                  }}
                >
                  {m.label}
                </span>
              </li>
            );
          })}
        </ul>
      </Sheet>
    </div>
  );
}

function Acties() {
  const tone: Record<string, string> = { warning: C.warn, info: C.ink };
  return (
    <div className="space-y-5">
      <Sheet code="AC-01" title="Werklijst · acties">
        <h1
          className="text-[26px] font-semibold tracking-[-0.01em]"
          style={{ ...serif, color: C.inkDeep }}
        >
          Volgende acties
        </h1>
        <p className="mt-2 max-w-md text-[13px] leading-relaxed" style={{ color: C.muted }}>
          Genummerd op volgorde van urgentie, zoals een revisielijst op een tekening.
        </p>
      </Sheet>

      <ol className="space-y-3">
        {ACTIES.map((a, i) => (
          <li
            key={a.titel}
            className="flex flex-col gap-4 rounded-[3px] p-4 sm:flex-row sm:items-center"
            style={{
              background: C.card,
              border: `1px solid ${C.hair}`,
              borderLeft: `3px solid ${tone[a.urgentie]}`,
            }}
          >
            <span
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[3px] text-[14px] tabular-nums"
              style={{ ...mono, border: `1px solid ${C.hair}`, color: tone[a.urgentie] }}
              aria-hidden="true"
            >
              {String(i + 1).padStart(2, "0")}
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-[14px] font-medium" style={{ color: C.graphite }}>
                {a.titel}
              </p>
              <p className="mt-1 text-[12.5px] leading-relaxed" style={{ color: C.muted }}>
                {a.detail}
              </p>
            </div>
            <button
              className="shrink-0 self-start rounded-[3px] px-4 py-2 text-[12px] font-medium transition-colors hover:bg-[#1f4e79] hover:text-[#faf7f0] focus-visible:outline-none focus-visible:ring-2 sm:self-center"
              style={{ border: `1px solid ${C.hair}`, color: C.ink }}
            >
              {a.cta}
            </button>
          </li>
        ))}
      </ol>
    </div>
  );
}

function Facturen() {
  const total = "€ 8.622";
  const toneFor = (s: string) => (s === "Betaald" ? C.ok : s === "Openstaand" ? C.warn : C.faint);
  return (
    <div className="space-y-5">
      <Sheet
        code="F-01"
        title="Staat · facturen"
        right={
          <button
            className="inline-flex items-center gap-2 rounded-[3px] px-3 py-1.5 text-[11px] font-semibold uppercase transition-colors hover:bg-[#1f4e79] hover:text-[#faf7f0] focus-visible:outline-none focus-visible:ring-2"
            style={{ ...mono, border: `1px solid ${C.ink}`, color: C.ink, letterSpacing: "0.08em" }}
          >
            Nieuwe
          </button>
        }
      >
        <p
          className="text-[40px] font-semibold tabular-nums leading-none"
          style={{ ...serif, color: C.inkDeep }}
        >
          {total}
        </p>
        <p
          className="mt-2 text-[11px] uppercase"
          style={{ ...mono, color: C.faint, letterSpacing: "0.16em" }}
        >
          Totaal betaald dit kwartaal
        </p>
      </Sheet>

      <Sheet code="F-02" title="Regels">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr>
                {["Nummer", "Klant", "Datum", "Status", "Bedrag"].map((h) => (
                  <th
                    key={h}
                    className="whitespace-nowrap px-2 py-2 text-left text-[9.5px] uppercase"
                    style={{
                      ...mono,
                      color: C.faint,
                      letterSpacing: "0.14em",
                      borderBottom: `1px solid ${C.hair}`,
                    }}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {FACTUREN.map((f) => (
                <tr
                  key={f.nr}
                  className="transition-colors hover:bg-[#f0ebe0]"
                  style={{ borderBottom: `1px solid ${C.hairSoft}` }}
                >
                  <td className="whitespace-nowrap px-2 py-3">
                    <span
                      className="text-[11.5px] tabular-nums"
                      style={{ ...mono, color: C.muted }}
                    >
                      {f.nr}
                    </span>
                  </td>
                  <td className="px-2 py-3 text-[13px]" style={{ color: C.graphite }}>
                    {f.klant}
                  </td>
                  <td className="whitespace-nowrap px-2 py-3">
                    <span
                      className="text-[11.5px] tabular-nums"
                      style={{ ...mono, color: C.muted }}
                    >
                      {f.datum}
                    </span>
                  </td>
                  <td className="px-2 py-3">
                    <span
                      className="text-[11px] uppercase"
                      style={{ ...mono, color: toneFor(f.status), letterSpacing: "0.06em" }}
                    >
                      {f.status}
                    </span>
                  </td>
                  <td
                    className="px-2 py-3 text-right text-[14px] font-semibold tabular-nums"
                    style={{ ...serif, color: C.inkDeep }}
                  >
                    {f.bedrag}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Sheet>
    </div>
  );
}
