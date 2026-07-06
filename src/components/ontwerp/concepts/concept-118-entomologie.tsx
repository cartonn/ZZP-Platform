"use client";

// Concept 118 — "Entomologie" · entomologische verzamelaarslade.
// Zacht crème/ivoor cottonboard-oppervlak (#efe9dc) als de bodem van een houten
// museumlade, met een warme sepia lade-rand. Elk kern-item is een GESPELD SPECIMEN:
// een kaartje met een klassiek DETERMINATIE-LABEL (klein wit etiket, mono catalogus-
// nummer + latijnse-stijl naam), vastgezet met een SVG-insectenspeld (schaduw eronder).
// Fijne wetenschappelijke inkt-hairlines. Namen in Newsreader (specimen-serif),
// catalogusnummers/labels in JetBrains Mono. Kleuren: ivoor, inkt-sepia, en gedempte
// natuurlijke specimen-accenten (kever-groen, vleugel-oker, karmijn).
// Onderscheidend van Botanie (herbarium), Vitrine (museale wand) en Kliniek (dossier):
// dit is een ENTOMOLOGISCHE LADE met gespelde specimens & determinatielabels. Light.

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

// Entomologisch palet: ivoor cottonboard, inkt-sepia, gedempte specimen-accenten.
const C = {
  board: "#efe9dc", // ivoor cottonboard (bodem van de lade)
  boardDeep: "#e7dfcd", // iets dieper karton
  card: "#f6f2e8", // specimen-kaartje (lichter)
  ink: "#4a3d2c", // inkt-sepia
  inkSoft: "#6b5c46",
  wood: "#8a6a44", // houten lade-rand (sepia)
  woodDeep: "#6f5233",
  beetle: "#47624a", // kever-groen
  ochre: "#b5852f", // vleugel-oker
  carmine: "#8f3a34", // karmijn
  line: "rgba(74,61,44,0.16)", // inkt-hairline
  lineStrong: "rgba(74,61,44,0.3)",
  label: "#fbfaf4", // wit etiket
};
const MUTED = "#94866d"; // gedempt inkt-grijs voor secundaire tekst

const serif = { fontFamily: "var(--font-lab-newsreader)" };
const mono = { fontFamily: "var(--font-lab-mono)" };
const uiMono = { fontFamily: "var(--font-lab-mono)" };

// Cottonboard-oppervlak: zacht korrelig ivoor met vezel-achtige lichte gradients.
const boardSurface =
  "radial-gradient(120% 90% at 10% 6%, rgba(138,106,68,0.05), transparent 55%)," +
  "radial-gradient(120% 90% at 90% 12%, rgba(71,98,74,0.04), transparent 55%)," +
  "radial-gradient(100% 100% at 50% 100%, rgba(181,133,47,0.04), transparent 60%)";

function statusMeta(s: CredStatus): {
  label: string;
  Icon: LucideIcon;
  tone: string;
  latijn: string;
} {
  switch (s) {
    case "VERIFIED":
      return { label: "Gedetermineerd", Icon: Check, tone: C.beetle, latijn: "det. & rite" };
    case "SUBMITTED":
      return { label: "In determinatie", Icon: Clock, tone: C.ochre, latijn: "in exam." };
    case "EXPIRING":
      return { label: "Herbepaling nodig", Icon: AlertTriangle, tone: C.carmine, latijn: "revid." };
    case "REJECTED":
      return { label: "Afgekeurd", Icon: XCircle, tone: C.carmine, latijn: "rejecta" };
  }
}

// Insectenspeld: klein SVG-speldicoon (kop + naald) met zachte schaduw eronder.
function Speld({ tone = C.woodDeep }: { tone?: string }) {
  return (
    <svg width="14" height="30" viewBox="0 0 14 30" aria-hidden="true" className="shrink-0">
      <ellipse cx="7" cy="27" rx="3.6" ry="1.3" fill="rgba(74,61,44,0.22)" />
      <line x1="7" y1="5" x2="7" y2="26" stroke={tone} strokeWidth="1.2" strokeLinecap="round" />
      <circle cx="7" cy="4" r="3.4" fill={tone} />
      <circle cx="5.9" cy="2.9" r="1.1" fill="rgba(255,255,255,0.55)" />
    </svg>
  );
}

// Wit determinatie-etiket: dunne rand, mono catalogusnummer + latijnse-stijl regel.
function Etiket({ nr, naam }: { nr: string; naam?: string }) {
  return (
    <div
      className="inline-block rounded-[2px] px-2 py-1 leading-tight"
      style={{
        background: C.label,
        border: `1px solid ${C.lineStrong}`,
        boxShadow: "0 1px 2px rgba(74,61,44,0.1)",
      }}
    >
      <div className="text-[9.5px] uppercase tracking-[0.14em]" style={{ ...mono, color: MUTED }}>
        {nr}
      </div>
      {naam && (
        <div className="text-[11px] italic leading-tight" style={{ ...serif, color: C.ink }}>
          {naam}
        </div>
      )}
    </div>
  );
}

// Specimen-kaart: lichter kaartje op de cottonboard met inkt-hairline rand + hoek-speld.
function Specimen({
  children,
  className = "",
  pin = true,
  tone = C.woodDeep,
}: {
  children: React.ReactNode;
  className?: string;
  pin?: boolean;
  tone?: string;
}) {
  return (
    <div
      className={`relative rounded-[3px] ${className}`}
      style={{
        background: C.card,
        border: `1px solid ${C.line}`,
        boxShadow: "0 1px 0 rgba(255,255,255,0.6) inset, 0 2px 8px rgba(74,61,44,0.06)",
      }}
    >
      {pin && (
        <span className="absolute -top-2 left-1/2 -translate-x-1/2" aria-hidden="true">
          <Speld tone={tone} />
        </span>
      )}
      {children}
    </div>
  );
}

// Sectiekop in specimen-serif met catalogus-sublabel.
function Kop({ children, sub }: { children: React.ReactNode; sub?: string }) {
  return (
    <div>
      {sub && (
        <div
          className="mb-1.5 text-[10.5px] uppercase tracking-[0.24em]"
          style={{ ...uiMono, color: MUTED }}
        >
          {sub}
        </div>
      )}
      <h2
        className="text-[28px] font-normal leading-none sm:text-[34px]"
        style={{ ...serif, color: C.ink }}
      >
        {children}
      </h2>
      <div className="mt-3 flex items-center gap-2" aria-hidden="true">
        <span className="h-px w-10" style={{ background: C.beetle }} />
        <span className="h-1 w-1 rotate-45" style={{ background: C.ochre }} />
        <span className="h-px flex-1" style={{ background: C.line }} />
      </div>
    </div>
  );
}

// Sparkline in wetenschappelijke inkt.
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
        strokeWidth={2.2}
        strokeLinecap="round"
        strokeLinejoin="round"
        vectorEffect="non-scaling-stroke"
      />
    </svg>
  );
}

export function Concept118() {
  const [screen, setScreen] = useState<ScreenKey>("dashboard");
  const active = OPDRACHTEN[0] as Opdracht;

  return (
    <div
      className="min-h-[680px] w-full antialiased"
      style={{ ...uiMono, background: C.board, backgroundImage: boardSurface, color: C.ink }}
    >
      {/* Houten lade-rand rondom de collectie */}
      <div
        className="mx-auto my-6 max-w-5xl rounded-[6px] p-1.5"
        style={{
          background: `linear-gradient(135deg, ${C.wood}, ${C.woodDeep})`,
          boxShadow: "inset 0 1px 2px rgba(255,255,255,0.2), 0 8px 24px rgba(74,61,44,0.18)",
        }}
      >
        <div
          className="rounded-[4px]"
          style={{
            background: C.board,
            backgroundImage: boardSurface,
            border: `1px solid ${C.woodDeep}`,
          }}
        >
          {/* Kop — collectie-titel als lade-etiket */}
          <header className="flex items-center justify-between px-5 pt-7 md:px-9">
            <div className="flex items-center gap-3.5">
              <span
                className="flex h-11 w-11 items-center justify-center rounded-[3px]"
                style={{
                  background: C.card,
                  border: `1px solid ${C.lineStrong}`,
                  color: C.beetle,
                }}
                aria-hidden="true"
              >
                {/* Kleine kever-glyph in inkt-lijnwerk */}
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
                  <ellipse cx="12" cy="14" rx="4.2" ry="6" stroke={C.beetle} strokeWidth="1.3" />
                  <line x1="12" y1="8" x2="12" y2="20" stroke={C.beetle} strokeWidth="1" />
                  <circle cx="12" cy="6" r="2.2" stroke={C.beetle} strokeWidth="1.3" />
                  <path
                    d="M9 5 L5.5 2.5 M15 5 L18.5 2.5"
                    stroke={C.beetle}
                    strokeWidth="1"
                    strokeLinecap="round"
                  />
                  <path
                    d="M8 12 L4 11 M8 15 L4 16 M16 12 L20 11 M16 15 L20 16"
                    stroke={C.beetle}
                    strokeWidth="0.9"
                    strokeLinecap="round"
                  />
                </svg>
              </span>
              <div className="leading-none">
                <div
                  className="text-[24px] font-normal tracking-[0.01em]"
                  style={{ ...serif, color: C.ink }}
                >
                  Entomologie
                </div>
                <div
                  className="mt-1 text-[9.5px] uppercase tracking-[0.28em]"
                  style={{ ...uiMono, color: MUTED }}
                >
                  Collectie · ZZP
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="hidden text-right leading-tight sm:block">
                <div className="text-[13px] font-medium" style={{ ...serif, color: C.ink }}>
                  {PROFIEL.naam}
                </div>
                <div className="text-[10.5px]" style={{ ...uiMono, color: MUTED }}>
                  {PROFIEL.plaats}
                </div>
              </div>
              <span
                className="flex h-11 w-11 items-center justify-center rounded-[3px] text-[13px] font-medium"
                style={{
                  ...serif,
                  background: C.card,
                  color: C.beetle,
                  border: `1px solid ${C.lineStrong}`,
                }}
                aria-hidden="true"
              >
                {PROFIEL.initialen}
              </span>
            </div>
          </header>

          {/* Navigatie — tabs als lade-tabbladen */}
          <nav
            className="mt-6 flex items-center gap-1 overflow-x-auto px-5 pb-3 md:px-9"
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
                  className="relative shrink-0 rounded-t-[3px] px-3.5 py-2 text-[12.5px] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
                  style={{ ...uiMono, color: on ? C.ink : MUTED, fontWeight: on ? 600 : 400 }}
                >
                  {s.label}
                  {on && (
                    <span
                      className="absolute -bottom-[1px] left-2 right-2 h-[2px] rounded-full"
                      style={{ background: C.beetle }}
                      aria-hidden="true"
                    />
                  )}
                </button>
              );
            })}
          </nav>

          <main className="px-5 py-9 md:px-9 md:py-12">
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
      </div>
    </div>
  );
}

function Dashboard({ onOpen }: { onOpen: () => void }) {
  const primair = ACTIES[0] as (typeof ACTIES)[number];
  const top = OPDRACHTEN[0] as Opdracht;
  const accents = [C.beetle, C.ochre, C.carmine, C.wood];
  return (
    <div className="space-y-12">
      {/* Groet als handgezette collectie-titel */}
      <section>
        <div
          className="text-[10.5px] uppercase tracking-[0.26em]"
          style={{ ...uiMono, color: MUTED }}
        >
          Lade · {PROFIEL.plaats} · vandaag
        </div>
        <h1
          className="mt-3 max-w-2xl text-[38px] font-normal leading-[1.04] sm:text-[50px]"
          style={{ ...serif, color: C.ink }}
        >
          Goedemorgen, {PROFIEL.naam.split(" ")[0]}
        </h1>
        <p
          className="mt-4 max-w-md text-[13.5px] leading-relaxed"
          style={{ ...serif, color: C.inkSoft }}
        >
          Je collectie is netjes gedetermineerd. Eén specimen vraagt vandaag herbepaling — de rest
          rust veilig gespeld.
        </p>
      </section>

      {/* Primaire actie — gespeld specimen met karmijn-accent */}
      <Specimen tone={C.carmine} className="p-6 pt-7">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0">
            <div className="mb-2">
              <Etiket nr="CAT · ACT-001" naam="Actio urgens" />
            </div>
            <h2
              className="text-[22px] font-normal leading-tight sm:text-[26px]"
              style={{ ...serif, color: C.ink }}
            >
              {primair.titel}
            </h2>
            <p
              className="mt-2 max-w-md text-[13px] leading-relaxed"
              style={{ ...serif, color: C.inkSoft }}
            >
              {primair.detail}
            </p>
          </div>
          <button
            onClick={onOpen}
            className="group inline-flex shrink-0 items-center gap-2.5 rounded-full px-6 py-3 text-[13px] font-medium transition-all hover:gap-3.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 motion-reduce:hover:gap-2.5"
            style={{ ...uiMono, background: C.carmine, color: C.board }}
          >
            {primair.cta}
            <ArrowRight size={16} aria-hidden="true" />
          </button>
        </div>
      </Specimen>

      {/* KPI-specimens: vier gespelde meetkaartjes */}
      <section>
        <Kop sub="Metingen">Prestatie</Kop>
        <div className="mt-8 grid grid-cols-2 gap-x-4 gap-y-8 lg:grid-cols-4">
          {KPIS.map((k, i) => {
            const tone = accents[i % accents.length] as string;
            return (
              <Specimen
                key={k.label}
                tone={tone}
                className="group p-4 pt-5 transition-transform hover:-translate-y-1 motion-reduce:hover:translate-y-0"
              >
                <div className="flex items-start justify-between">
                  <span
                    className="h-2.5 w-2.5 rounded-full"
                    style={{ background: tone }}
                    aria-hidden="true"
                  />
                  <span
                    className="text-[10.5px] tabular-nums"
                    style={{ ...uiMono, color: k.up ? C.beetle : C.carmine }}
                  >
                    {k.up ? "▲" : "▼"} {k.trend}
                  </span>
                </div>
                <div
                  className="mt-3 text-[28px] font-normal tabular-nums leading-none"
                  style={{ ...serif, color: C.ink }}
                >
                  {k.value}
                </div>
                <div className="mt-1 text-[11px]" style={{ ...uiMono, color: MUTED }}>
                  {k.label}
                </div>
                <div className="mt-3">
                  <Spark data={k.spark} tone={tone} />
                </div>
              </Specimen>
            );
          })}
        </div>
      </section>

      {/* Top-match als prominentst specimen (nieuw exemplaar) */}
      <section>
        <Kop sub="Nieuw specimen">Voor jou</Kop>
        <button
          onClick={onOpen}
          className="group mt-8 block w-full text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
        >
          <Specimen
            tone={C.beetle}
            className="flex flex-col gap-5 p-5 pt-6 transition-transform group-hover:-translate-y-0.5 motion-reduce:group-hover:translate-y-0 sm:flex-row sm:items-center"
          >
            <div
              className="flex h-20 w-20 shrink-0 flex-col items-center justify-center rounded-full"
              style={{ background: C.board, color: C.beetle, border: `1.5px solid ${C.beetle}` }}
              aria-hidden="true"
            >
              <span className="text-[26px] font-normal tabular-nums leading-none" style={serif}>
                {top.match}
              </span>
              <span
                className="text-[8.5px] uppercase tracking-[0.2em]"
                style={{ ...uiMono, color: MUTED }}
              >
                match
              </span>
            </div>
            <div className="min-w-0 flex-1">
              <div className="mb-1.5">
                <Etiket nr={`CAT · ${top.id}`} naam="Novum inventum" />
              </div>
              <h3
                className="text-[21px] font-normal leading-tight"
                style={{ ...serif, color: C.ink }}
              >
                {top.titel}
              </h3>
              <div className="mt-1 text-[12px]" style={{ ...uiMono, color: MUTED }}>
                {top.opdrachtgever} · {top.plaats} · {top.tarief}
              </div>
              <div className="mt-3 flex flex-wrap gap-1.5">
                {top.tags.map((t) => (
                  <span
                    key={t}
                    className="rounded-[2px] px-2 py-0.5 text-[10.5px]"
                    style={{
                      ...uiMono,
                      background: C.board,
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
              style={{ color: C.beetle }}
              aria-hidden="true"
            />
          </Specimen>
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
          style={{ width: `${value}%`, background: C.beetle }}
        />
      </div>
      <span className="text-[13px] font-medium tabular-nums" style={{ ...uiMono, color: C.beetle }}>
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

      <Specimen pin={false} className="flex items-center gap-3 px-4 py-1">
        <Search size={17} style={{ color: MUTED }} aria-hidden="true" />
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Zoek op titel, plaats of opdrachtgever…"
          aria-label="Opdrachten zoeken"
          className="w-full bg-transparent py-2.5 text-[14px] outline-none placeholder:opacity-50"
          style={{ ...serif, color: C.ink }}
        />
        <span className="shrink-0 text-[12px] tabular-nums" style={{ ...uiMono, color: MUTED }}>
          {filtered.length}
        </span>
      </Specimen>

      {filtered.length === 0 ? (
        <Specimen
          pin={false}
          className="flex flex-col items-center justify-center gap-3 p-14 text-center"
        >
          <Search size={26} style={{ color: MUTED }} aria-hidden="true" />
          <p className="text-[22px] font-normal" style={{ ...serif, color: C.ink }}>
            Geen specimens gevonden
          </p>
          <p className="max-w-xs text-[13px]" style={{ ...serif, color: MUTED }}>
            Niets past bij “{q}”. Verruim je zoekopdracht of beschikbaarheid.
          </p>
          <button
            onClick={() => setQ("")}
            className="mt-2 inline-flex items-center gap-2 rounded-full px-4 py-2 text-[12px] font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
            style={{ ...uiMono, background: C.beetle, color: C.board }}
          >
            Zoekopdracht wissen
          </button>
        </Specimen>
      ) : (
        <ul className="grid grid-cols-1 gap-x-4 gap-y-8">
          {filtered.map((o) => (
            <li key={o.id}>
              <button
                onClick={onOpen}
                className="group block w-full text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
              >
                <Specimen className="flex flex-col gap-4 p-4 pt-6 transition-transform group-hover:-translate-y-0.5 motion-reduce:group-hover:translate-y-0 sm:flex-row sm:items-center">
                  <div className="min-w-0 flex-1">
                    <div className="mb-1.5">
                      <Etiket nr={`CAT · ${o.id}`} />
                    </div>
                    <h3
                      className="text-[18px] font-normal leading-tight"
                      style={{ ...serif, color: C.ink }}
                    >
                      {o.titel}
                    </h3>
                    <div className="mt-0.5 text-[12px]" style={{ ...uiMono, color: MUTED }}>
                      {o.opdrachtgever} · {o.plaats} · {o.tarief}
                    </div>
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {o.tags.map((t) => (
                        <span
                          key={t}
                          className="rounded-[2px] px-2 py-0.5 text-[10px]"
                          style={{
                            ...uiMono,
                            background: C.board,
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
                      style={{ color: C.beetle }}
                      aria-hidden="true"
                    />
                  </div>
                </Specimen>
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
        style={{ ...uiMono, color: MUTED }}
      >
        <ArrowRight size={14} className="rotate-180" aria-hidden="true" /> Terug naar marktplaats
      </button>

      <section>
        <div className="flex items-center gap-3">
          <span
            className="text-[11px] uppercase tracking-[0.2em]"
            style={{ ...uiMono, color: MUTED }}
          >
            {opdracht.id}
          </span>
          <span
            className="rounded-full px-2.5 py-0.5 text-[11px] font-medium"
            style={{ ...uiMono, background: C.beetle, color: C.board }}
          >
            {opdracht.match}% match
          </span>
        </div>
        <h1
          className="mt-4 max-w-2xl text-[32px] font-normal leading-[1.05] sm:text-[44px]"
          style={{ ...serif, color: C.ink }}
        >
          {opdracht.titel}
        </h1>
        <p className="mt-3 text-[13px]" style={{ ...uiMono, color: MUTED }}>
          {opdracht.opdrachtgever} · {opdracht.plaats}
        </p>
      </section>

      {/* Feiten als vier meetkaartjes */}
      <div className="grid grid-cols-2 gap-x-4 gap-y-8 lg:grid-cols-4">
        {feiten.map((m) => (
          <Specimen key={m.l} className="p-4 pt-5">
            <m.Icon size={16} style={{ color: C.beetle }} aria-hidden="true" />
            <div
              className="mt-3 text-[19px] font-normal tabular-nums leading-none"
              style={{ ...serif, color: C.ink }}
            >
              {m.v}
            </div>
            <div
              className="mt-2 text-[10.5px] uppercase tracking-[0.16em]"
              style={{ ...uiMono, color: MUTED }}
            >
              {m.l}
            </div>
          </Specimen>
        ))}
      </div>

      {/* Redenen — kever-groen (past) vs karmijn (aandacht) */}
      <div className="grid grid-cols-1 gap-x-4 gap-y-8 md:grid-cols-2">
        <Specimen tone={C.beetle} className="p-5 pt-6">
          <div
            className="inline-flex items-center gap-2 text-[11.5px] uppercase tracking-[0.18em]"
            style={{ ...uiMono, color: C.beetle }}
          >
            <Check size={14} strokeWidth={2.4} aria-hidden="true" /> Wat past
          </div>
          <ul className="mt-4 space-y-3">
            {opdracht.redenen.plus.map((r) => (
              <li
                key={r}
                className="flex items-start gap-3 text-[14px] leading-snug"
                style={{ ...serif, color: C.inkSoft }}
              >
                <Check
                  size={16}
                  strokeWidth={2.2}
                  className="mt-0.5 shrink-0"
                  style={{ color: C.beetle }}
                  aria-hidden="true"
                />
                {r}
              </li>
            ))}
          </ul>
        </Specimen>
        <Specimen tone={C.carmine} className="p-5 pt-6">
          <div
            className="inline-flex items-center gap-2 text-[11.5px] uppercase tracking-[0.18em]"
            style={{ ...uiMono, color: C.carmine }}
          >
            <AlertTriangle size={14} strokeWidth={2.4} aria-hidden="true" /> Aandacht
          </div>
          <ul className="mt-4 space-y-3">
            {opdracht.redenen.min.map((r) => (
              <li
                key={r}
                className="flex items-start gap-3 text-[14px] leading-snug"
                style={{ ...serif, color: C.inkSoft }}
              >
                <span
                  className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full"
                  style={{ background: C.carmine }}
                  aria-hidden="true"
                />
                {r}
              </li>
            ))}
          </ul>
        </Specimen>
      </div>

      <div className="flex flex-col items-center gap-3 pt-2 sm:flex-row">
        <button
          className="group inline-flex w-full items-center justify-center gap-2.5 rounded-full px-7 py-3.5 text-[14px] font-medium transition-all hover:gap-3.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 motion-reduce:hover:gap-2.5 sm:w-auto"
          style={{ ...uiMono, background: C.beetle, color: C.board }}
        >
          Reageer op opdracht <ArrowRight size={16} aria-hidden="true" />
        </button>
        <button
          className="inline-flex w-full items-center justify-center gap-2 rounded-full px-6 py-3.5 text-[14px] font-medium transition-opacity hover:opacity-70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 sm:w-auto"
          style={{ ...uiMono, border: `1px solid ${C.lineStrong}`, color: C.ink }}
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
      <Kop sub="Determinatie">Verificatie</Kop>

      {/* Determinatie-voortgang als medaillon */}
      <Specimen className="flex flex-col items-center gap-6 p-6 pt-7 sm:flex-row sm:items-center">
        <div className="relative h-28 w-28 shrink-0" aria-hidden="true">
          <svg viewBox="0 0 36 36" className="h-full w-full -rotate-90">
            <circle cx="18" cy="18" r="15.5" fill="none" stroke={C.line} strokeWidth="3" />
            <circle
              cx="18"
              cy="18"
              r="15.5"
              fill="none"
              stroke={C.beetle}
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
            <span
              className="text-[8.5px] uppercase tracking-[0.2em]"
              style={{ ...uiMono, color: MUTED }}
            >
              bepaald
            </span>
          </div>
        </div>
        <div className="text-center sm:text-left">
          <div
            className="inline-flex items-center gap-2 text-[11.5px] uppercase tracking-[0.2em]"
            style={{ ...uiMono, color: C.beetle }}
          >
            <ShieldCheck size={15} strokeWidth={2} aria-hidden="true" /> {PROFIEL.trust}
          </div>
          <p
            className="mt-2 max-w-md text-[14px] leading-relaxed"
            style={{ ...serif, color: C.inkSoft }}
          >
            {verified} van {CREDENTIALS.length} specimens gedetermineerd en gelabeld. Eén exemplaar
            vraagt binnenkort een herbepaling — vernieuw op tijd om verifieerbaar te blijven.
          </p>
        </div>
      </Specimen>

      <ul className="grid grid-cols-1 gap-x-4 gap-y-9">
        {CREDENTIALS.map((c) => {
          const st = statusMeta(c.status);
          return (
            <li key={c.naam}>
              <Specimen tone={st.tone} className="flex items-center gap-4 p-4 pt-6">
                <span
                  className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[3px]"
                  style={{ background: C.board, border: `1px solid ${st.tone}`, color: st.tone }}
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
                  <div className="mt-0.5 text-[11.5px]" style={{ ...uiMono, color: MUTED }}>
                    {c.detail}
                  </div>
                </div>
                <span
                  className="inline-flex shrink-0 items-center gap-1.5 rounded-[3px] px-2.5 py-1 text-[10.5px] font-medium"
                  style={{
                    ...uiMono,
                    background: C.label,
                    color: st.tone,
                    border: `1px solid ${st.tone}`,
                  }}
                >
                  <st.Icon size={12} strokeWidth={2.4} aria-hidden="true" />
                  <span className="hidden sm:inline">{st.label}</span>
                  <span className="italic opacity-70">{st.latijn}</span>
                </span>
              </Specimen>
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
      <ol className="grid grid-cols-1 gap-x-4 gap-y-9">
        {sorted.map((a, i) => {
          const warn = a.urgentie === "warning";
          const tone = warn ? C.carmine : C.beetle;
          return (
            <li key={a.titel}>
              <Specimen
                tone={tone}
                className="flex flex-col gap-4 p-5 pt-6 sm:flex-row sm:items-center"
              >
                <span
                  className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[3px] text-[16px] font-normal tabular-nums"
                  style={{
                    ...serif,
                    background: C.board,
                    color: tone,
                    border: `1px solid ${tone}`,
                  }}
                  aria-hidden="true"
                >
                  {i + 1}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <AlertTriangle
                      size={14}
                      strokeWidth={2.2}
                      style={{ color: tone, opacity: warn ? 1 : 0 }}
                      aria-hidden="true"
                      className={warn ? "" : "hidden"}
                    />
                    <h3
                      className="text-[16.5px] font-normal leading-tight"
                      style={{ ...serif, color: C.ink }}
                    >
                      {a.titel}
                    </h3>
                    <span className="sr-only">{warn ? "Urgent" : "Informatief"}</span>
                  </div>
                  <p
                    className="mt-1.5 text-[13px] leading-relaxed"
                    style={{ ...serif, color: C.inkSoft }}
                  >
                    {a.detail}
                  </p>
                </div>
                <button
                  className="shrink-0 self-start rounded-full px-5 py-2.5 text-[12.5px] font-medium transition-all hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 sm:self-center"
                  style={{ ...uiMono, background: tone, color: C.board }}
                >
                  {a.cta}
                </button>
              </Specimen>
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
    if (status === "Betaald") return C.beetle;
    if (status === "Openstaand") return C.carmine;
    return MUTED;
  };
  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <Kop sub="Grootboek">Facturen</Kop>
        <button
          className="inline-flex items-center gap-2 rounded-full px-4 py-2.5 text-[12.5px] font-medium transition-all hover:gap-3 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 motion-reduce:hover:gap-2"
          style={{ ...uiMono, background: C.beetle, color: C.board }}
        >
          <Plus size={15} aria-hidden="true" /> Nieuwe factuur
        </button>
      </div>

      <Specimen pin={false} className="overflow-x-auto">
        <table className="w-full min-w-[560px] border-collapse text-left">
          <thead>
            <tr style={{ borderBottom: `1px solid ${C.lineStrong}` }}>
              {["Nummer", "Klant", "Datum", "Status", "Bedrag"].map((h, i) => (
                <th
                  key={h}
                  className={`px-4 py-3 text-[10.5px] uppercase tracking-[0.16em] ${i === 4 ? "text-right" : ""}`}
                  style={{ ...uiMono, color: MUTED, fontWeight: 500 }}
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
                    className="px-4 py-3.5 text-[12px] tabular-nums"
                    style={{ ...uiMono, color: C.inkSoft }}
                  >
                    {f.nr}
                  </td>
                  <td className="px-4 py-3.5 text-[14px]" style={{ ...serif, color: C.ink }}>
                    {f.klant}
                  </td>
                  <td
                    className="px-4 py-3.5 text-[12px] tabular-nums"
                    style={{ ...uiMono, color: MUTED }}
                  >
                    {f.datum}
                  </td>
                  <td className="px-4 py-3.5">
                    <span
                      className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[11px] font-medium"
                      style={{ ...uiMono, color: tone, border: `1px solid ${tone}` }}
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
                className="px-4 py-4 text-[10.5px] uppercase tracking-[0.2em]"
                style={{ ...uiMono, color: MUTED }}
              >
                Totaal betaald
              </td>
              <td
                className="px-4 py-4 text-right text-[20px] font-normal tabular-nums"
                style={{ ...serif, color: C.beetle }}
              >
                {total}
              </td>
            </tr>
          </tfoot>
        </table>
      </Specimen>
    </div>
  );
}
