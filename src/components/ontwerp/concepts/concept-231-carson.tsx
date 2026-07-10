"use client";

// Concept 231 — "Carson" · anti-design, deconstructed grid.
// David-Carson-revival (2026): a deliberately broken grid — headings that overlap, rotate
// a few degrees, jump wildly in scale (huge Anton display numerals next to tiny mono labels),
// loose elements that break just outside their frame. BUT the core truth (jobs, statuses,
// amounts) stays in tidy, legible blocks: expressive chaos at the edges, glass-clear data in
// the middle. Warm off-white paper, hard black, one signal red. Anton = display, Space Grotesk
// = mono accents. Signature: diagonal red slash annotations, struck-through words, numbers as
// graphic marks, tape-style labels. Anti-design as mood, never as sabotage of readability.

import { useState } from "react";
import {
  ArrowRight,
  ArrowLeft,
  Search,
  BadgeCheck,
  Clock,
  TriangleAlert,
  XCircle,
  MapPin,
  Coins,
  CalendarDays,
  Bookmark,
  Check,
  Inbox,
  RefreshCw,
  ShieldCheck,
  Bell,
  FileText,
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
  BERICHTEN,
  DOCUMENTEN,
  type ScreenKey,
  type CredStatus,
  type Opdracht,
} from "./mock";

// ── Palet — warm gebroken-wit, hard zwart, één fel signaalrood ─────────────────
const C = {
  paper: "#f2f0e9", // warm off-white
  paperDeep: "#e9e6dc", // ietsje dieper vlak
  panel: "#faf9f4", // opgelicht papier
  ink: "#111111", // hard zwart
  inkSoft: "#4a4844", // gedempte inkt
  inkFaint: "#8b887f", // lichte inkt
  red: "#ff3b1d", // fel signaalrood
  redDeep: "#d42a10",
  green: "#1f7a4d", // gedempt groen (geverifieerd)
  amber: "#a56a12", // gedempt oker (waarschuwing)
  line: "rgba(17,17,17,0.12)",
  lineStrong: "rgba(17,17,17,0.26)",
};

const display = { fontFamily: "var(--font-lab-anton)" };
const mono = { fontFamily: "var(--font-lab-space)" };
const body = { fontFamily: "var(--font-lab-inter)" };

// Vage papier-korrel + zachte lichtval (deterministisch, CSS-only).
const paperGrain =
  "radial-gradient(120% 90% at 0% 0%, rgba(255,255,255,0.55), transparent 55%)," +
  "radial-gradient(110% 90% at 100% 100%, rgba(17,17,17,0.04), transparent 55%)";

// ── Status → label + icoon + kleur ────────────────────────────────────────────
function statusMeta(s: CredStatus): { label: string; Icon: LucideIcon; tone: string } {
  switch (s) {
    case "VERIFIED":
      return { label: "Geverifieerd", Icon: BadgeCheck, tone: C.green };
    case "SUBMITTED":
      return { label: "In beoordeling", Icon: Clock, tone: C.inkSoft };
    case "EXPIRING":
      return { label: "Verloopt binnenkort", Icon: TriangleAlert, tone: C.amber };
    case "REJECTED":
      return { label: "Afgewezen", Icon: XCircle, tone: C.red };
  }
}

// ── Kleine helper-componenten ──────────────────────────────────────────────────

// Tape-achtig label — halftransparante strip met lichte rotatie.
function Tape({
  children,
  rotate = -2,
  tone = C.red,
}: {
  children: React.ReactNode;
  rotate?: number;
  tone?: string;
}) {
  return (
    <span
      className="inline-flex items-center gap-1.5 px-2.5 py-1 text-[10px] font-semibold uppercase leading-none tracking-[0.14em]"
      style={{
        ...mono,
        background: tone,
        color: tone === C.red ? "#fff" : C.paper,
        transform: `rotate(${rotate}deg)`,
        boxShadow: "0 2px 5px -2px rgba(17,17,17,0.4)",
      }}
    >
      {children}
    </span>
  );
}

// Statuschip — altijd label + icoon.
function StatusChip({ status, big = false }: { status: CredStatus; big?: boolean }) {
  const { label, Icon, tone } = statusMeta(status);
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-[2px] font-semibold uppercase leading-none tracking-[0.08em] ${
        big ? "px-2.5 py-1.5 text-[11px]" : "px-2 py-1 text-[10px]"
      }`}
      style={{
        ...mono,
        color: tone,
        background: "rgba(17,17,17,0.05)",
        border: `1px solid ${tone}`,
      }}
    >
      <Icon size={big ? 14 : 12} strokeWidth={2.4} aria-hidden="true" />
      {label}
    </span>
  );
}

function Pill({ children, tone = C.inkSoft }: { children: React.ReactNode; tone?: string }) {
  return (
    <span
      className="inline-flex items-center rounded-[2px] px-2 py-1 text-[10px] font-semibold uppercase leading-none tracking-[0.08em]"
      style={{ ...mono, color: tone, border: `1px solid ${C.line}`, background: C.panel }}
    >
      {children}
    </span>
  );
}

// Kaart met breuk-rand — de kern-data blijft leesbaar in een net blok.
function Card({
  children,
  className = "",
  interactive = false,
  accent,
}: {
  children: React.ReactNode;
  className?: string;
  interactive?: boolean;
  accent?: string;
}) {
  return (
    <div
      className={`relative rounded-[3px] ${
        interactive
          ? "transition-transform duration-150 hover:-translate-y-0.5 motion-reduce:hover:translate-y-0"
          : ""
      } ${className}`}
      style={{
        background: C.panel,
        border: `1px solid ${accent ?? C.line}`,
        boxShadow: "0 1px 0 rgba(255,255,255,0.7) inset, 0 12px 26px -20px rgba(17,17,17,0.5)",
      }}
    >
      {children}
    </div>
  );
}

// Grote gedeconstrueerde sectiekop — geroteerd, met doorgestreepte "ruis".
function Kop({
  children,
  index,
  struck,
}: {
  children: React.ReactNode;
  index: string;
  struck?: string;
}) {
  return (
    <div className="relative flex items-end gap-3">
      <span
        className="select-none text-[52px] leading-[0.8] tracking-[-0.02em] sm:text-[64px]"
        style={{
          ...display,
          color: C.red,
          transform: "rotate(-3deg)",
          transformOrigin: "bottom left",
        }}
        aria-hidden="true"
      >
        {index}
      </span>
      <div className="pb-1">
        {struck && (
          <span
            className="mr-2 select-none text-[13px] uppercase tracking-[0.1em] line-through"
            style={{ ...mono, color: C.inkFaint }}
            aria-hidden="true"
          >
            {struck}
          </span>
        )}
        <h2
          className="inline text-[30px] uppercase leading-[0.9] tracking-[-0.01em] sm:text-[38px]"
          style={{ ...display, color: C.ink }}
        >
          {children}
        </h2>
      </div>
    </div>
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
      <polyline
        points={`0,100 ${pts.join(" ")} 100,100`}
        fill={tone}
        opacity={0.08}
        stroke="none"
      />
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

// Match-cijfer als grafisch element (enorm getal + mono-label).
function MatchMark({ value, size = "md" }: { value: number; size?: "sm" | "md" | "lg" }) {
  const map = { sm: "text-[26px]", md: "text-[40px]", lg: "text-[64px]" } as const;
  return (
    <div className="relative inline-flex items-end leading-none" style={{ color: C.ink }}>
      <span className={`${map[size]} tabular-nums`} style={{ ...display }}>
        {value}
      </span>
      <span className="mb-1 ml-1 text-[11px]" style={{ ...mono, color: C.red }}>
        %match
      </span>
    </div>
  );
}

// ── Hoofdcomponent ─────────────────────────────────────────────────────────────
export function Concept231() {
  const [screen, setScreen] = useState<ScreenKey>("dashboard");
  const active = OPDRACHTEN[0] as Opdracht;

  return (
    <div
      className="relative min-h-[680px] w-full overflow-hidden antialiased"
      style={{ ...body, background: C.paper, backgroundImage: paperGrain, color: C.ink }}
    >
      {/* Diagonale rode signaalstreep — signatuur, decoratief */}
      <span
        aria-hidden="true"
        className="pointer-events-none absolute -right-24 top-16 hidden h-[2px] w-[420px] rotate-[-24deg] md:block"
        style={{ background: C.red, opacity: 0.9 }}
      />
      <span
        aria-hidden="true"
        className="pointer-events-none absolute -left-16 bottom-24 hidden h-[2px] w-[280px] rotate-[18deg] md:block"
        style={{ background: C.ink, opacity: 0.5 }}
      />

      {/* Kop */}
      <header className="relative mx-auto flex max-w-5xl items-center justify-between px-5 pt-8 md:px-10">
        <div className="flex items-center gap-3">
          <span
            className="flex h-11 w-11 items-center justify-center rounded-[2px]"
            style={{ background: C.ink, color: C.red }}
            aria-hidden="true"
          >
            <span className="text-[22px] leading-none" style={display}>
              Z
            </span>
          </span>
          <div className="leading-none">
            <div
              className="text-[22px] uppercase leading-none tracking-[-0.01em]"
              style={{ ...display, color: C.ink, transform: "rotate(-1.5deg)" }}
            >
              Carson
            </div>
            <div
              className="mt-1 text-[9px] uppercase tracking-[0.34em]"
              style={{ ...mono, color: C.inkSoft }}
            >
              ZZP · Platform
            </div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="hidden text-right leading-tight sm:block">
            <div className="text-[13px] font-semibold" style={{ ...body, color: C.ink }}>
              {PROFIEL.naam}
            </div>
            <div className="text-[11px]" style={{ ...mono, color: C.inkSoft }}>
              {PROFIEL.rol}
            </div>
          </div>
          <span
            className="flex h-11 w-11 items-center justify-center rounded-[2px] text-[13px]"
            style={{ background: C.red, color: "#fff", ...display, transform: "rotate(3deg)" }}
            aria-hidden="true"
          >
            {PROFIEL.initialen}
          </span>
        </div>
      </header>

      {/* Navigatie */}
      <nav
        className="relative mx-auto mt-6 flex max-w-5xl items-center gap-1 overflow-x-auto px-5 pb-4 md:px-10"
        aria-label="Hoofdnavigatie"
        style={{ borderBottom: `1px solid ${C.line}` }}
      >
        {SCREENS.map((s, i) => {
          const on = s.key === screen;
          return (
            <button
              key={s.key}
              onClick={() => setScreen(s.key)}
              aria-current={on ? "page" : undefined}
              className="relative shrink-0 px-3.5 py-2 text-[12px] uppercase tracking-[0.06em] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
              style={{
                ...mono,
                color: on ? C.ink : C.inkSoft,
                fontWeight: on ? 700 : 500,
                transform: on ? `rotate(${(i % 2 === 0 ? -1 : 1) * 1.5}deg)` : "none",
              }}
            >
              {s.label}
              {on && (
                <span
                  className="absolute -bottom-[17px] left-1 right-1 h-[3px]"
                  style={{ background: C.red }}
                  aria-hidden="true"
                />
              )}
            </button>
          );
        })}
      </nav>

      <main className="relative mx-auto max-w-5xl px-5 py-9 md:px-10 md:py-12">
        {screen === "dashboard" && <Dashboard onOpen={() => setScreen("opdracht")} />}
        {screen === "marktplaats" && <Marktplaats onOpen={() => setScreen("opdracht")} />}
        {screen === "opdracht" && (
          <OpdrachtDetail opdracht={active} onBack={() => setScreen("marktplaats")} />
        )}
        {screen === "verificatie" && <Verificatie />}
        {screen === "acties" && <Acties onOpen={() => setScreen("marktplaats")} />}
        {screen === "facturen" && <Facturen />}
      </main>
    </div>
  );
}

// ── Dashboard ────────────────────────────────────────────────────────────────
function Dashboard({ onOpen }: { onOpen: () => void }) {
  const primair = ACTIES[0] as (typeof ACTIES)[number];
  const top = OPDRACHTEN[0] as Opdracht;
  const tones = [C.red, C.green, C.ink, C.amber];
  return (
    <div className="space-y-11">
      {/* Titelblok — enorme geroteerde begroeting, kleine mono-datum */}
      <section className="relative">
        <div className="text-[10px] uppercase tracking-[0.3em]" style={{ ...mono, color: C.red }}>
          Vandaag · {PROFIEL.plaats}
        </div>
        <h1
          className="mt-2 text-[46px] uppercase leading-[0.85] tracking-[-0.02em] sm:text-[68px]"
          style={{ ...display, color: C.ink }}
        >
          Goede
          <br />
          <span style={{ color: C.red, transform: "rotate(-2deg)", display: "inline-block" }}>
            morgen,
          </span>{" "}
          {PROFIEL.naam.split(" ")[0]}
        </h1>
        <p
          className="mt-3 max-w-md text-[13.5px] leading-relaxed"
          style={{ ...body, color: C.inkSoft }}
        >
          Eén regel schreeuwt om aandacht. De rest ligt netjes in het gareel — expressie aan de
          randen, waarheid in het midden.
        </p>
      </section>

      {/* Primaire actie — memo met tape-label en rode diagonaal */}
      <Card accent={C.lineStrong} className="overflow-hidden">
        <div className="flex flex-col gap-5 p-6 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0">
            <Tape rotate={-2} tone={C.amber}>
              Vraagt aandacht
            </Tape>
            <h2
              className="mt-3 text-[26px] uppercase leading-[0.95] tracking-[-0.01em] sm:text-[32px]"
              style={{ ...display, color: C.ink }}
            >
              {primair.titel}
            </h2>
            <p
              className="mt-2 max-w-md text-[13px] leading-relaxed"
              style={{ ...body, color: C.inkSoft }}
            >
              {primair.detail}
            </p>
          </div>
          <button
            onClick={onOpen}
            className="group inline-flex shrink-0 items-center gap-2.5 rounded-[2px] px-6 py-3.5 text-[12px] font-semibold uppercase tracking-[0.06em] transition-all hover:gap-3.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 motion-reduce:hover:gap-2.5"
            style={{ ...mono, background: C.red, color: "#fff" }}
          >
            {primair.cta}
            <ArrowRight size={16} aria-hidden="true" />
          </button>
        </div>
      </Card>

      {/* KPI's — reusachtige cijfers naast kleine mono-labels */}
      <section>
        <Kop index="01" struck="ruis">
          Cijfers
        </Kop>
        <div className="mt-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
          {KPIS.map((k, i) => {
            const tone = tones[i % tones.length] as string;
            return (
              <Card key={k.label} interactive className="p-4">
                <div className="flex items-start justify-between">
                  <span className="h-2.5 w-2.5" style={{ background: tone }} aria-hidden="true" />
                  <span
                    className="text-[11px] font-semibold tabular-nums"
                    style={{ ...mono, color: k.up ? C.green : C.amber }}
                  >
                    {k.up ? "▲" : "▼"} {k.trend}
                  </span>
                </div>
                <div
                  className="mt-3 text-[34px] tabular-nums leading-[0.85] tracking-[-0.01em]"
                  style={{ ...display, color: C.ink }}
                >
                  {k.value}
                </div>
                <div
                  className="mt-1 text-[10.5px] uppercase tracking-[0.06em]"
                  style={{ ...mono, color: C.inkSoft }}
                >
                  {k.label}
                </div>
                <div className="mt-3">
                  <Spark data={k.spark} tone={tone} />
                </div>
              </Card>
            );
          })}
        </div>
      </section>

      {/* Top-match — het match-cijfer als grafisch anker */}
      <section>
        <Kop index="02" struck="lawaai">
          Beste match
        </Kop>
        <button
          onClick={onOpen}
          className="group mt-6 block w-full text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
        >
          <Card
            interactive
            accent={C.lineStrong}
            className="flex flex-col gap-5 p-5 sm:flex-row sm:items-center"
          >
            <div className="shrink-0" style={{ transform: "rotate(-2deg)" }}>
              <MatchMark value={top.match} size="lg" />
            </div>
            <div className="min-w-0 flex-1">
              <h3
                className="text-[22px] uppercase leading-[0.95] tracking-[-0.01em]"
                style={{ ...display, color: C.ink }}
              >
                {top.titel}
              </h3>
              <div className="mt-1 text-[12.5px]" style={{ ...body, color: C.inkSoft }}>
                {top.opdrachtgever} · {top.plaats} · {top.tarief}
              </div>
              <div className="mt-3 flex flex-wrap gap-1.5">
                {top.tags.map((t) => (
                  <Pill key={t}>{t}</Pill>
                ))}
              </div>
            </div>
            <ArrowRight
              size={22}
              className="hidden shrink-0 transition-transform group-hover:translate-x-1 motion-reduce:group-hover:translate-x-0 md:block"
              style={{ color: C.red }}
              aria-hidden="true"
            />
          </Card>
        </button>
      </section>

      {/* Berichten — loading / empty / error demonstratie */}
      <section>
        <Kop index="03" struck="stilte">
          Postvak
        </Kop>
        <div className="mt-6">
          <BerichtenPaneel />
        </div>
      </section>
    </div>
  );
}

// ── Berichten-paneel met loading / empty / error / data-states ──────────────────
type Fase = "data" | "loading" | "empty" | "error";
const FASES: { key: Fase; label: string }[] = [
  { key: "data", label: "Geladen" },
  { key: "loading", label: "Laden" },
  { key: "empty", label: "Leeg" },
  { key: "error", label: "Fout" },
];

function BerichtenPaneel() {
  const [fase, setFase] = useState<Fase>("data");
  return (
    <Card className="overflow-hidden">
      <div
        className="flex flex-wrap items-center justify-between gap-3 border-b px-4 py-3"
        style={{ borderColor: C.line }}
      >
        <span
          className="inline-flex items-center gap-2 text-[12px] font-semibold uppercase tracking-[0.08em]"
          style={{ ...mono, color: C.ink }}
        >
          <Bell size={14} strokeWidth={2.2} style={{ color: C.red }} aria-hidden="true" /> Berichten
        </span>
        <div className="flex items-center gap-1" role="group" aria-label="Toestand tonen">
          {FASES.map((f) => {
            const on = f.key === fase;
            return (
              <button
                key={f.key}
                onClick={() => setFase(f.key)}
                aria-pressed={on}
                className="rounded-[2px] px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.06em] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-1"
                style={{
                  ...mono,
                  background: on ? C.ink : "transparent",
                  color: on ? C.paper : C.inkSoft,
                  border: `1px solid ${on ? C.ink : C.line}`,
                }}
              >
                {f.label}
              </button>
            );
          })}
        </div>
      </div>

      <div className="p-4">
        {fase === "loading" && (
          <ul className="space-y-3" aria-hidden="true">
            {[0, 1, 2].map((i) => (
              <li key={i} className="flex items-center gap-3">
                <span
                  className="h-10 w-10 shrink-0 animate-pulse rounded-[2px]"
                  style={{ background: C.paperDeep }}
                />
                <div className="flex-1 space-y-2">
                  <span
                    className="block h-3 w-2/5 animate-pulse rounded-[2px]"
                    style={{ background: C.paperDeep }}
                  />
                  <span
                    className="block h-3 w-4/5 animate-pulse rounded-[2px]"
                    style={{ background: C.paperDeep }}
                  />
                </div>
              </li>
            ))}
          </ul>
        )}

        {fase === "empty" && (
          <div className="flex flex-col items-center justify-center gap-3 py-10 text-center">
            <Inbox size={30} strokeWidth={1.6} style={{ color: C.inkFaint }} aria-hidden="true" />
            <p className="text-[18px] uppercase leading-none" style={{ ...display, color: C.ink }}>
              Postvak leeg
            </p>
            <p className="max-w-xs text-[12.5px]" style={{ ...body, color: C.inkSoft }}>
              Geen nieuwe berichten. Reageer op een opdracht om het gesprek te openen.
            </p>
          </div>
        )}

        {fase === "error" && (
          <div className="flex flex-col items-center justify-center gap-3 py-10 text-center">
            <TriangleAlert
              size={30}
              strokeWidth={1.8}
              style={{ color: C.red }}
              aria-hidden="true"
            />
            <p className="text-[18px] uppercase leading-none" style={{ ...display, color: C.ink }}>
              Laden mislukt
            </p>
            <p className="max-w-xs text-[12.5px]" style={{ ...body, color: C.inkSoft }}>
              De berichten konden niet worden opgehaald. Probeer het opnieuw.
            </p>
            <button
              onClick={() => setFase("data")}
              className="mt-1 inline-flex items-center gap-2 rounded-[2px] px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.06em] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
              style={{ ...mono, background: C.red, color: "#fff" }}
            >
              <RefreshCw size={13} aria-hidden="true" /> Opnieuw proberen
            </button>
          </div>
        )}

        {fase === "data" && (
          <ul className="space-y-2">
            {BERICHTEN.map((b) => (
              <li
                key={b.van}
                className="flex items-center gap-3 rounded-[2px] px-2 py-2 transition-colors hover:bg-[rgba(17,17,17,0.03)]"
              >
                <span
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[2px] text-[12px]"
                  style={{ background: C.ink, color: C.paper, ...mono }}
                  aria-hidden="true"
                >
                  {b.initialen}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span
                      className="truncate text-[13px] font-semibold"
                      style={{ ...body, color: C.ink }}
                    >
                      {b.van}
                    </span>
                    {b.ongelezen && (
                      <span
                        className="h-2 w-2 shrink-0 rounded-full"
                        style={{ background: C.red }}
                        aria-label="Ongelezen"
                      />
                    )}
                  </div>
                  <p className="truncate text-[12px]" style={{ ...body, color: C.inkSoft }}>
                    {b.preview}
                  </p>
                </div>
                <span
                  className="shrink-0 text-[11px] tabular-nums"
                  style={{ ...mono, color: C.inkFaint }}
                >
                  {b.tijd}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </Card>
  );
}

// ── Marktplaats ────────────────────────────────────────────────────────────────
function Marktplaats({ onOpen }: { onOpen: () => void }) {
  const [q, setQ] = useState("");
  const [saved, setSaved] = useState<Record<string, boolean>>({});
  const filtered = OPDRACHTEN.filter(
    (o) =>
      o.titel.toLowerCase().includes(q.toLowerCase()) ||
      o.plaats.toLowerCase().includes(q.toLowerCase()) ||
      o.opdrachtgever.toLowerCase().includes(q.toLowerCase()),
  );
  return (
    <div className="space-y-8">
      <Kop index="04" struck="chaos">
        Marktplaats
      </Kop>

      <Card className="flex items-center gap-3 px-4">
        <Search size={17} style={{ color: C.inkSoft }} aria-hidden="true" />
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Zoek op titel, plaats of opdrachtgever…"
          aria-label="Opdrachten zoeken"
          className="w-full bg-transparent py-3 text-[13.5px] outline-none placeholder:opacity-50"
          style={{ ...body, color: C.ink }}
        />
        <span
          className="shrink-0 text-[12px] font-semibold tabular-nums"
          style={{ ...mono, color: C.inkSoft }}
        >
          {filtered.length}
        </span>
      </Card>

      {filtered.length === 0 ? (
        <Card className="flex flex-col items-center justify-center gap-3 p-14 text-center">
          <Search size={30} strokeWidth={1.6} style={{ color: C.inkFaint }} aria-hidden="true" />
          <p className="text-[22px] uppercase leading-none" style={{ ...display, color: C.ink }}>
            Niets gevonden
          </p>
          <p className="max-w-xs text-[12.5px]" style={{ ...body, color: C.inkSoft }}>
            Geen opdrachten onder “{q}”. Verruim je zoekopdracht of beschikbaarheid.
          </p>
          <button
            onClick={() => setQ("")}
            className="mt-2 inline-flex items-center gap-2 rounded-[2px] px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.06em] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
            style={{ ...mono, background: C.red, color: "#fff" }}
          >
            Zoekopdracht wissen
          </button>
        </Card>
      ) : (
        <ul className="space-y-3">
          {filtered.map((o) => (
            <li key={o.id}>
              <Card interactive className="flex flex-col gap-4 p-4 sm:flex-row sm:items-center">
                <button
                  onClick={onOpen}
                  className="min-w-0 flex-1 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
                >
                  <h3
                    className="text-[20px] uppercase leading-[0.95] tracking-[-0.01em]"
                    style={{ ...display, color: C.ink }}
                  >
                    {o.titel}
                  </h3>
                  <div className="mt-0.5 text-[12px]" style={{ ...body, color: C.inkSoft }}>
                    {o.opdrachtgever} · {o.plaats} · {o.tarief}
                  </div>
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {o.tags.map((t) => (
                      <Pill key={t}>{t}</Pill>
                    ))}
                  </div>
                </button>
                <div className="flex items-center gap-4">
                  <div style={{ transform: "rotate(-2deg)" }}>
                    <MatchMark value={o.match} size="sm" />
                  </div>
                  <button
                    onClick={() => setSaved((s) => ({ ...s, [o.id]: !s[o.id] }))}
                    aria-pressed={!!saved[o.id]}
                    aria-label={saved[o.id] ? "Verwijder uit bewaard" : "Bewaar opdracht"}
                    className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[2px] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
                    style={{
                      border: `1px solid ${saved[o.id] ? C.red : C.line}`,
                      background: saved[o.id] ? C.red : "transparent",
                      color: saved[o.id] ? "#fff" : C.inkSoft,
                    }}
                  >
                    <Bookmark
                      size={16}
                      strokeWidth={2.2}
                      fill={saved[o.id] ? "#fff" : "none"}
                      aria-hidden="true"
                    />
                  </button>
                </div>
              </Card>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

// ── Opdracht-detail ──────────────────────────────────────────────────────────
function OpdrachtDetail({ opdracht, onBack }: { opdracht: Opdracht; onBack: () => void }) {
  const feiten: { l: string; v: string; Icon: LucideIcon }[] = [
    { l: "Tarief", v: opdracht.tarief, Icon: Coins },
    { l: "Omvang", v: opdracht.uren, Icon: Clock },
    { l: "Start", v: opdracht.start, Icon: CalendarDays },
    { l: "Plaats", v: opdracht.plaats, Icon: MapPin },
  ];
  return (
    <div className="space-y-8">
      <button
        onClick={onBack}
        className="inline-flex items-center gap-2 text-[12px] font-medium uppercase tracking-[0.06em] transition-opacity hover:opacity-60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
        style={{ ...mono, color: C.inkSoft }}
      >
        <ArrowLeft size={14} aria-hidden="true" /> Terug naar marktplaats
      </button>

      <section className="relative">
        <div className="flex flex-wrap items-center gap-2">
          <span
            className="text-[10.5px] uppercase tracking-[0.16em]"
            style={{ ...mono, color: C.inkSoft }}
          >
            {opdracht.id}
          </span>
          <Tape rotate={2}>{opdracht.match}% match</Tape>
        </div>
        <h1
          className="mt-3 text-[38px] uppercase leading-[0.88] tracking-[-0.02em] sm:text-[52px]"
          style={{ ...display, color: C.ink }}
        >
          {opdracht.titel}
        </h1>
        <p className="mt-2 text-[13px]" style={{ ...body, color: C.inkSoft }}>
          {opdracht.opdrachtgever} · {opdracht.plaats}
        </p>
      </section>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {feiten.map((m) => (
          <Card key={m.l} className="p-4">
            <m.Icon size={16} style={{ color: C.red }} aria-hidden="true" />
            <div
              className="mt-2 text-[22px] tabular-nums leading-none"
              style={{ ...display, color: C.ink }}
            >
              {m.v}
            </div>
            <div
              className="mt-1.5 text-[10.5px] uppercase tracking-[0.12em]"
              style={{ ...mono, color: C.inkSoft }}
            >
              {m.l}
            </div>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <Card className="p-5" accent={C.green}>
          <div
            className="inline-flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.14em]"
            style={{ ...mono, color: C.green }}
          >
            <Check size={14} strokeWidth={2.6} aria-hidden="true" /> Wat past
          </div>
          <ul className="mt-4 space-y-3">
            {opdracht.redenen.plus.map((r) => (
              <li
                key={r}
                className="flex items-start gap-3 text-[13px] leading-snug"
                style={{ ...body, color: C.ink }}
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
        </Card>
        <Card className="p-5" accent={C.amber}>
          <div
            className="inline-flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.14em]"
            style={{ ...mono, color: C.amber }}
          >
            <TriangleAlert size={14} strokeWidth={2.6} aria-hidden="true" /> Aandacht
          </div>
          <ul className="mt-4 space-y-3">
            {opdracht.redenen.min.map((r) => (
              <li
                key={r}
                className="flex items-start gap-3 text-[13px] leading-snug"
                style={{ ...body, color: C.ink }}
              >
                <span
                  className="mt-1.5 h-1.5 w-1.5 shrink-0"
                  style={{ background: C.amber }}
                  aria-hidden="true"
                />
                {r}
              </li>
            ))}
          </ul>
        </Card>
      </div>

      <div className="flex flex-col items-stretch gap-3 pt-1 sm:flex-row">
        <button
          className="group inline-flex flex-1 items-center justify-center gap-2.5 rounded-[2px] px-7 py-3.5 text-[12.5px] font-semibold uppercase tracking-[0.06em] transition-all hover:gap-3.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 motion-reduce:hover:gap-2.5"
          style={{ ...mono, background: C.red, color: "#fff" }}
        >
          Reageer op opdracht <ArrowRight size={16} aria-hidden="true" />
        </button>
        <button
          className="inline-flex items-center justify-center gap-2 rounded-[2px] px-6 py-3.5 text-[12.5px] font-semibold uppercase tracking-[0.06em] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
          style={{
            ...mono,
            border: `1px solid ${C.lineStrong}`,
            color: C.ink,
            background: C.panel,
          }}
        >
          Bewaar voor later
        </button>
      </div>
    </div>
  );
}

// ── Verificatie ────────────────────────────────────────────────────────────────
function Verificatie() {
  const verified = CREDENTIALS.filter((c) => c.status === "VERIFIED").length;
  const pct = Math.round((verified / CREDENTIALS.length) * 100);
  return (
    <div className="space-y-8">
      <Kop index="05" struck="twijfel">
        Verificatie
      </Kop>

      <Card accent={C.lineStrong} className="flex flex-col items-center gap-6 p-6 sm:flex-row">
        <div className="relative h-24 w-24 shrink-0" aria-hidden="true">
          <svg viewBox="0 0 36 36" className="h-full w-full -rotate-90">
            <circle
              cx="18"
              cy="18"
              r="15.5"
              fill="none"
              stroke="rgba(17,17,17,0.12)"
              strokeWidth="3"
            />
            <circle
              cx="18"
              cy="18"
              r="15.5"
              fill="none"
              stroke={C.red}
              strokeWidth="3"
              strokeLinecap="butt"
              strokeDasharray={`${(pct / 100) * 97.4} 97.4`}
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span
              className="text-[26px] tabular-nums leading-none"
              style={{ ...display, color: C.ink }}
            >
              {pct}%
            </span>
            <span
              className="text-[9px] uppercase tracking-[0.18em]"
              style={{ ...mono, color: C.inkSoft }}
            >
              gedekt
            </span>
          </div>
        </div>
        <div className="text-center sm:text-left">
          <div className="inline-flex items-center gap-2">
            <ShieldCheck size={16} style={{ color: C.green }} aria-hidden="true" />
            <span
              className="text-[13px] font-semibold uppercase tracking-[0.08em]"
              style={{ ...mono, color: C.ink }}
            >
              {PROFIEL.trust}
            </span>
          </div>
          <p
            className="mt-2 max-w-sm text-[13px] leading-relaxed"
            style={{ ...body, color: C.inkSoft }}
          >
            {verified} van de {CREDENTIALS.length} bewijsstukken zijn geverifieerd. Vernieuw wat
            binnenkort verloopt om zichtbaar te blijven voor opdrachtgevers.
          </p>
        </div>
      </Card>

      <ul className="space-y-3">
        {CREDENTIALS.map((c) => (
          <li key={c.naam}>
            <Card className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="min-w-0">
                <h3 className="text-[15px] font-semibold" style={{ ...body, color: C.ink }}>
                  {c.naam}
                </h3>
                <p className="mt-0.5 text-[12px]" style={{ ...body, color: C.inkSoft }}>
                  {c.detail}
                </p>
              </div>
              <StatusChip status={c.status} big />
            </Card>
          </li>
        ))}
      </ul>

      {/* Documenten-strook */}
      <section>
        <div
          className="mb-3 flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.14em]"
          style={{ ...mono, color: C.inkSoft }}
        >
          <FileText size={13} aria-hidden="true" /> Documenten
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[520px] border-collapse text-left">
            <thead>
              <tr style={{ borderBottom: `1px solid ${C.lineStrong}` }}>
                {["Bestand", "Type", "Grootte", "Status", "Bijgewerkt"].map((h) => (
                  <th
                    key={h}
                    className="px-3 py-2 text-[10px] uppercase tracking-[0.1em]"
                    style={{ ...mono, color: C.inkSoft }}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {DOCUMENTEN.map((d) => (
                <tr
                  key={d.naam}
                  className="transition-colors hover:bg-[rgba(17,17,17,0.03)]"
                  style={{ borderBottom: `1px solid ${C.line}` }}
                >
                  <td
                    className="px-3 py-3 text-[13px] font-semibold"
                    style={{ ...body, color: C.ink }}
                  >
                    {d.naam}
                  </td>
                  <td className="px-3 py-3 text-[12px]" style={{ ...mono, color: C.inkSoft }}>
                    {d.type}
                  </td>
                  <td
                    className="px-3 py-3 text-[12px] tabular-nums"
                    style={{ ...mono, color: C.inkSoft }}
                  >
                    {d.grootte}
                  </td>
                  <td className="px-3 py-3">
                    <StatusChip status={d.status} />
                  </td>
                  <td className="px-3 py-3 text-[12px]" style={{ ...body, color: C.inkSoft }}>
                    {d.bijgewerkt}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

// ── Acties (checklist-toggle) ───────────────────────────────────────────────────
function Acties({ onOpen }: { onOpen: () => void }) {
  const [done, setDone] = useState<Record<number, boolean>>({});
  const openCount = ACTIES.length - Object.values(done).filter(Boolean).length;
  return (
    <div className="space-y-8">
      <Kop index="06" struck="rust">
        Acties
      </Kop>

      <Card accent={C.lineStrong} className="flex items-center justify-between gap-4 p-5">
        <div>
          <div className="text-[10px] uppercase tracking-[0.2em]" style={{ ...mono, color: C.red }}>
            Openstaand
          </div>
          <div
            className="mt-1 text-[40px] tabular-nums leading-none"
            style={{ ...display, color: C.ink }}
          >
            {openCount}
          </div>
        </div>
        <p
          className="max-w-xs text-right text-[12.5px] leading-relaxed"
          style={{ ...body, color: C.inkSoft }}
        >
          Vink af wat je hebt gedaan. Wat overblijft schreeuwt het hardst.
        </p>
      </Card>

      <ul className="space-y-3">
        {ACTIES.map((a, i) => {
          const isDone = !!done[i];
          const tone = a.urgentie === "warning" ? C.amber : C.inkSoft;
          return (
            <li key={a.titel}>
              <Card
                className="flex flex-col gap-4 p-4 sm:flex-row sm:items-center"
                accent={isDone ? C.green : C.line}
              >
                <button
                  onClick={() => setDone((d) => ({ ...d, [i]: !d[i] }))}
                  aria-pressed={isDone}
                  aria-label={isDone ? "Markeer als open" : "Markeer als gedaan"}
                  className="flex h-7 w-7 shrink-0 items-center justify-center rounded-[2px] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
                  style={{
                    border: `1.5px solid ${isDone ? C.green : C.lineStrong}`,
                    background: isDone ? C.green : "transparent",
                    color: "#fff",
                  }}
                >
                  {isDone && <Check size={15} strokeWidth={3} aria-hidden="true" />}
                </button>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span
                      className="h-2 w-2 shrink-0 rounded-full"
                      style={{ background: a.urgentie === "warning" ? C.amber : C.red }}
                      aria-hidden="true"
                    />
                    <h3
                      className={`text-[15px] font-semibold ${isDone ? "line-through" : ""}`}
                      style={{ ...body, color: isDone ? C.inkFaint : C.ink }}
                    >
                      {a.titel}
                    </h3>
                  </div>
                  <p
                    className="mt-1 text-[12.5px] leading-snug"
                    style={{ ...body, color: C.inkSoft }}
                  >
                    {a.detail}
                  </p>
                </div>
                {!isDone && (
                  <button
                    onClick={onOpen}
                    className="group inline-flex shrink-0 items-center gap-2 rounded-[2px] px-4 py-2.5 text-[11.5px] font-semibold uppercase tracking-[0.06em] transition-all hover:gap-3 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 motion-reduce:hover:gap-2"
                    style={{
                      ...mono,
                      background: tone === C.amber ? C.amber : C.ink,
                      color: C.paper,
                    }}
                  >
                    {a.cta} <ArrowRight size={14} aria-hidden="true" />
                  </button>
                )}
              </Card>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

// ── Facturen ────────────────────────────────────────────────────────────────
function Facturen() {
  const statusTone = (s: string) =>
    s === "Betaald" ? C.green : s === "Openstaand" ? C.amber : C.inkFaint;
  return (
    <div className="space-y-8">
      <Kop index="07" struck="som">
        Facturen
      </Kop>

      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[560px] border-collapse text-left">
            <thead>
              <tr style={{ borderBottom: `1px solid ${C.lineStrong}` }}>
                {["Nummer", "Klant", "Datum", "Bedrag", "Status"].map((h) => (
                  <th
                    key={h}
                    className="px-4 py-3 text-[10px] uppercase tracking-[0.1em]"
                    style={{ ...mono, color: C.inkSoft }}
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
                  className="transition-colors hover:bg-[rgba(17,17,17,0.03)]"
                  style={{ borderBottom: `1px solid ${C.line}` }}
                >
                  <td
                    className="px-4 py-3.5 text-[13px] font-semibold"
                    style={{ ...mono, color: C.ink }}
                  >
                    {f.nr}
                  </td>
                  <td className="px-4 py-3.5 text-[13px]" style={{ ...body, color: C.ink }}>
                    {f.klant}
                  </td>
                  <td className="px-4 py-3.5 text-[12px]" style={{ ...body, color: C.inkSoft }}>
                    {f.datum}
                  </td>
                  <td
                    className="px-4 py-3.5 text-[15px] tabular-nums"
                    style={{ ...display, color: C.ink }}
                  >
                    {f.bedrag}
                  </td>
                  <td className="px-4 py-3.5">
                    <span
                      className="inline-flex items-center gap-1.5 rounded-[2px] px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.08em]"
                      style={{
                        ...mono,
                        color: statusTone(f.status),
                        border: `1px solid ${statusTone(f.status)}`,
                      }}
                    >
                      <span
                        className="h-1.5 w-1.5 rounded-full"
                        style={{ background: statusTone(f.status) }}
                        aria-hidden="true"
                      />
                      {f.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
