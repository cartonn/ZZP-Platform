"use client";

// Concept 233 — "Knipsel" · ransom-note & zine-collage.
// Raw DIY punk-zine aesthetic: headings as cut-out letters in shifting fonts and backgrounds,
// each on its own paper snippet with a slight rotation and drop-shadow (the cut effect). Torn
// paper edges (SVG), a fixed-seed photocopy grain (deterministic feTurbulence), and semi-
// transparent yellow tape strips with shadow. Newspaper-grey paper, black ink, one bright
// magenta stamp accent. BUT tightly organised on a grid: the data (jobs, amounts, statuses)
// sits in legible "cut-out" cards. Body text = Inter. Energy without losing readability.

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
  FileText,
  Scissors,
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

// ── Palet — krant-grijs papier, zwart inkt, fel magenta stempel ────────────────
const C = {
  paper: "#e9e6df", // krant-grijs
  paperDeep: "#ddd9d0",
  panel: "#f4f2ec", // opgelicht snippertje
  ink: "#141414", // zwart
  inkSoft: "#43413c",
  inkFaint: "#847f76",
  stamp: "#e11d48", // fel magenta/rood stempel
  stampDeep: "#b3153a",
  green: "#256b45", // gedempt groen
  amber: "#8a5a10", // gedempt oker
  tape: "rgba(240,208,58,0.55)", // plakband-geel
  line: "rgba(20,20,20,0.16)",
  lineStrong: "rgba(20,20,20,0.32)",
};

const anton = { fontFamily: "var(--font-lab-anton)" };
const elite = { fontFamily: "var(--font-lab-special-elite)" };
const mono = { fontFamily: "var(--font-lab-space-mono)" };
const body = { fontFamily: "var(--font-lab-inter)" };

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
      return { label: "Afgewezen", Icon: XCircle, tone: C.stamp };
  }
}

// ── Ransom-note kop: elk woord een uitgeknipt snippertje, wisselende fonts ──────
type Snip = { bg: string; fg: string; font: React.CSSProperties; rot: number };
const SNIP_STYLES: Snip[] = [
  { bg: C.ink, fg: C.paper, font: anton, rot: -3 },
  { bg: C.panel, fg: C.ink, font: elite, rot: 2 },
  { bg: C.stamp, fg: "#fff", font: anton, rot: -1.5 },
  { bg: C.paper, fg: C.ink, font: mono, rot: 3 },
  { bg: C.ink, fg: C.stamp, font: anton, rot: 1.5 },
];

function Ransom({ text, size = "md" }: { text: string; size?: "sm" | "md" | "lg" }) {
  const words = text.split(" ");
  const sz = {
    sm: "text-[18px] px-2 py-0.5",
    md: "text-[26px] px-2.5 py-1",
    lg: "text-[40px] px-3 py-1.5",
  }[size];
  return (
    <span
      className="inline-flex flex-wrap items-center gap-1.5"
      role="heading"
      aria-level={2}
      aria-label={text}
    >
      {words.map((w, i) => {
        const s = SNIP_STYLES[i % SNIP_STYLES.length] as Snip;
        return (
          <span
            key={`${w}-${i}`}
            aria-hidden="true"
            className={`inline-block rounded-[2px] uppercase leading-none tracking-[0.01em] ${sz}`}
            style={{
              ...s.font,
              background: s.bg,
              color: s.fg,
              transform: `rotate(${s.rot}deg)`,
              boxShadow: "0 3px 8px -3px rgba(20,20,20,0.5)",
              border: s.bg === C.panel || s.bg === C.paper ? `1px solid ${C.line}` : "none",
            }}
          >
            {w}
          </span>
        );
      })}
    </span>
  );
}

// ── Helper-componenten ─────────────────────────────────────────────────────────

// Plakband-strip.
function Tape({ className = "", rot = -4 }: { className?: string; rot?: number }) {
  return (
    <span
      aria-hidden="true"
      className={`pointer-events-none absolute h-6 w-16 ${className}`}
      style={{
        background: C.tape,
        transform: `rotate(${rot}deg)`,
        boxShadow: "0 1px 3px rgba(20,20,20,0.25)",
        borderLeft: "1px dashed rgba(20,20,20,0.15)",
        borderRight: "1px dashed rgba(20,20,20,0.15)",
      }}
    />
  );
}

// Uitgeknipt kaartje met gescheurde bovenrand + slagschaduw.
function Snippet({
  children,
  className = "",
  interactive = false,
  rot = 0,
  torn = false,
}: {
  children: React.ReactNode;
  className?: string;
  interactive?: boolean;
  rot?: number;
  torn?: boolean;
}) {
  return (
    <div
      className={`relative rounded-[2px] ${
        interactive
          ? "transition-transform duration-150 hover:-translate-y-0.5 motion-reduce:hover:translate-y-0"
          : ""
      } ${className}`}
      style={{
        background: C.panel,
        border: `1px solid ${C.line}`,
        transform: rot ? `rotate(${rot}deg)` : undefined,
        boxShadow: "0 1px 0 rgba(255,255,255,0.6) inset, 0 10px 22px -16px rgba(20,20,20,0.55)",
      }}
    >
      {torn && (
        <svg
          className="absolute -top-[6px] left-0 h-[7px] w-full"
          viewBox="0 0 200 7"
          preserveAspectRatio="none"
          aria-hidden="true"
        >
          <polygon
            points="0,7 8,1 16,6 24,1 32,6 40,1 48,6 56,1 64,6 72,1 80,6 88,1 96,6 104,1 112,6 120,1 128,6 136,1 144,6 152,1 160,6 168,1 176,6 184,1 192,6 200,1 200,7"
            fill={C.panel}
            stroke={C.line}
            strokeWidth="0.5"
          />
        </svg>
      )}
      {children}
    </div>
  );
}

// Stempel-badge (status), altijd label + icoon.
function StampBadge({ status, big = false }: { status: CredStatus; big?: boolean }) {
  const { label, Icon, tone } = statusMeta(status);
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-[2px] font-bold uppercase leading-none tracking-[0.06em] ${
        big ? "px-2.5 py-1.5 text-[11px]" : "px-2 py-1 text-[10px]"
      }`}
      style={{
        ...mono,
        color: tone,
        border: `1.5px solid ${tone}`,
        background: "rgba(255,255,255,0.4)",
        transform: "rotate(-1.5deg)",
      }}
    >
      <Icon size={big ? 14 : 12} strokeWidth={2.4} aria-hidden="true" />
      {label}
    </span>
  );
}

function Chip({ children }: { children: React.ReactNode }) {
  return (
    <span
      className="inline-flex items-center rounded-[2px] px-2 py-0.5 text-[11px]"
      style={{
        ...mono,
        color: C.inkSoft,
        border: `1px solid ${C.line}`,
        background: "rgba(255,255,255,0.35)",
      }}
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
      <polyline
        points={`0,100 ${pts.join(" ")} 100,100`}
        fill={tone}
        opacity={0.09}
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

// Match-getal als grote uitgeknipte stempel.
function MatchStamp({ value }: { value: number }) {
  return (
    <span
      className="relative flex h-16 w-16 flex-col items-center justify-center rounded-full"
      style={{
        border: `2.5px solid ${C.stamp}`,
        color: C.stamp,
        transform: "rotate(-6deg)",
        background: "rgba(255,255,255,0.35)",
      }}
      aria-hidden="true"
    >
      <span className="text-[22px] tabular-nums leading-none" style={anton}>
        {value}
      </span>
      <span className="text-[8px] font-bold uppercase tracking-[0.14em]" style={mono}>
        match
      </span>
    </span>
  );
}

// ── Hoofdcomponent ─────────────────────────────────────────────────────────────
export function Concept233() {
  const [screen, setScreen] = useState<ScreenKey>("dashboard");
  const active = OPDRACHTEN[0] as Opdracht;

  return (
    <div
      className="relative min-h-[680px] w-full overflow-hidden antialiased"
      style={{ ...body, background: C.paper, color: C.ink }}
    >
      {/* Fotokopie-korrel — vaste seed, deterministisch, decoratief */}
      <svg
        className="pointer-events-none absolute inset-0 h-full w-full opacity-[0.05]"
        aria-hidden="true"
      >
        <filter id="knipsel-grain">
          <feTurbulence
            type="fractalNoise"
            baseFrequency="0.9"
            numOctaves={2}
            seed={7}
            stitchTiles="stitch"
          />
          <feColorMatrix type="saturate" values="0" />
        </filter>
        <rect width="100%" height="100%" filter="url(#knipsel-grain)" />
      </svg>

      {/* Kop */}
      <header className="relative mx-auto flex max-w-5xl items-center justify-between px-5 pt-8 md:px-10">
        <div className="flex items-center gap-3">
          <span
            className="relative flex h-11 w-11 items-center justify-center rounded-[2px]"
            style={{ background: C.ink, color: C.stamp, transform: "rotate(-4deg)" }}
            aria-hidden="true"
          >
            <Scissors size={20} strokeWidth={2.2} />
          </span>
          <div className="leading-none">
            <Ransom text="Knipsel" size="sm" />
            <div
              className="mt-1.5 text-[9px] uppercase tracking-[0.32em]"
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
            style={{ background: C.stamp, color: "#fff", ...anton, transform: "rotate(4deg)" }}
            aria-hidden="true"
          >
            {PROFIEL.initialen}
          </span>
        </div>
      </header>

      {/* Navigatie */}
      <nav
        className="relative mx-auto mt-6 flex max-w-5xl items-center gap-1.5 overflow-x-auto px-5 pb-4 md:px-10"
        aria-label="Hoofdnavigatie"
        style={{ borderBottom: `1px dashed ${C.lineStrong}` }}
      >
        {SCREENS.map((s, i) => {
          const on = s.key === screen;
          return (
            <button
              key={s.key}
              onClick={() => setScreen(s.key)}
              aria-current={on ? "page" : undefined}
              className="relative shrink-0 rounded-[2px] px-3 py-1.5 text-[11px] font-bold uppercase tracking-[0.06em] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
              style={{
                ...mono,
                color: on ? "#fff" : C.inkSoft,
                background: on ? C.ink : "transparent",
                transform: `rotate(${on ? (i % 2 === 0 ? -2 : 2) : 0}deg)`,
                boxShadow: on ? "0 3px 7px -3px rgba(20,20,20,0.5)" : "none",
              }}
            >
              {s.label}
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
  const tones = [C.stamp, C.green, C.ink, C.amber];
  return (
    <div className="space-y-11">
      <section>
        <div
          className="text-[10px] font-bold uppercase tracking-[0.28em]"
          style={{ ...mono, color: C.stamp }}
        >
          Vandaag · {PROFIEL.plaats}
        </div>
        <div className="mt-3">
          <Ransom text={`Goedemorgen ${PROFIEL.naam.split(" ")[0]}`} size="lg" />
        </div>
        <p
          className="mt-4 max-w-md text-[13.5px] leading-relaxed"
          style={{ ...body, color: C.inkSoft }}
        >
          Uitgeknipt en opgeplakt, maar strak op het grid. De koppen schreeuwen; de cijfers blijven
          glashelder.
        </p>
      </section>

      {/* Primaire actie — memo met plakband */}
      <Snippet torn className="overflow-visible p-6" rot={-0.5}>
        <Tape className="-top-3 left-8" rot={-6} />
        <Tape className="-top-3 right-10" rot={5} />
        <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0">
            <span
              className="inline-flex items-center gap-2 text-[10.5px] font-bold uppercase tracking-[0.12em]"
              style={{ ...mono, color: C.amber }}
            >
              <TriangleAlert size={13} strokeWidth={2.4} aria-hidden="true" /> Vraagt aandacht
            </span>
            <h2
              className="mt-2 text-[23px] font-bold leading-tight"
              style={{ ...elite, color: C.ink }}
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
            className="group inline-flex shrink-0 items-center gap-2.5 rounded-[2px] px-6 py-3.5 text-[12px] font-bold uppercase tracking-[0.06em] transition-all hover:gap-3.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 motion-reduce:hover:gap-2.5"
            style={{ ...mono, background: C.stamp, color: "#fff" }}
          >
            {primair.cta}
            <ArrowRight size={16} aria-hidden="true" />
          </button>
        </div>
      </Snippet>

      {/* KPI's */}
      <section>
        <Ransom text="De Cijfers" size="md" />
        <div className="mt-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
          {KPIS.map((k, i) => {
            const tone = tones[i % tones.length] as string;
            return (
              <Snippet key={k.label} interactive rot={i % 2 === 0 ? -1 : 1} className="p-4">
                <div className="flex items-start justify-between">
                  <span className="h-2.5 w-2.5" style={{ background: tone }} aria-hidden="true" />
                  <span
                    className="text-[11px] font-bold tabular-nums"
                    style={{ ...mono, color: k.up ? C.green : C.amber }}
                  >
                    {k.up ? "▲" : "▼"} {k.trend}
                  </span>
                </div>
                <div
                  className="mt-3 text-[30px] tabular-nums leading-none"
                  style={{ ...anton, color: C.ink }}
                >
                  {k.value}
                </div>
                <div className="mt-1 text-[10.5px]" style={{ ...body, color: C.inkSoft }}>
                  {k.label}
                </div>
                <div className="mt-3">
                  <Spark data={k.spark} tone={tone} />
                </div>
              </Snippet>
            );
          })}
        </div>
      </section>

      {/* Top-match */}
      <section>
        <Ransom text="Beste Match" size="md" />
        <button
          onClick={onOpen}
          className="group mt-6 block w-full text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
        >
          <Snippet
            interactive
            torn
            className="flex flex-col gap-5 p-5 sm:flex-row sm:items-center"
            rot={-0.5}
          >
            <div className="shrink-0">
              <MatchStamp value={top.match} />
            </div>
            <div className="min-w-0 flex-1">
              <h3
                className="text-[20px] font-bold leading-tight"
                style={{ ...elite, color: C.ink }}
              >
                {top.titel}
              </h3>
              <div className="mt-1 text-[12.5px]" style={{ ...body, color: C.inkSoft }}>
                {top.opdrachtgever} · {top.plaats} · {top.tarief}
              </div>
              <div className="mt-3 flex flex-wrap gap-1.5">
                {top.tags.map((t) => (
                  <Chip key={t}>{t}</Chip>
                ))}
              </div>
            </div>
            <ArrowRight
              size={22}
              className="hidden shrink-0 transition-transform group-hover:translate-x-1 motion-reduce:group-hover:translate-x-0 md:block"
              style={{ color: C.stamp }}
              aria-hidden="true"
            />
          </Snippet>
        </button>
      </section>

      {/* Berichten met loading/empty/error */}
      <section>
        <Ransom text="Het Postvak" size="md" />
        <div className="mt-6">
          <BerichtenPaneel />
        </div>
      </section>
    </div>
  );
}

// ── Berichten-paneel: loading / empty / error / data ────────────────────────────
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
    <Snippet className="overflow-hidden">
      <div
        className="flex flex-wrap items-center justify-between gap-3 border-b px-4 py-3"
        style={{ borderColor: C.line }}
      >
        <span
          className="inline-flex items-center gap-2 text-[12px] font-bold uppercase tracking-[0.06em]"
          style={{ ...mono, color: C.ink }}
        >
          <Inbox size={14} strokeWidth={2.2} style={{ color: C.stamp }} aria-hidden="true" />{" "}
          Berichten
        </span>
        <div className="flex items-center gap-1" role="group" aria-label="Toestand tonen">
          {FASES.map((f) => {
            const on = f.key === fase;
            return (
              <button
                key={f.key}
                onClick={() => setFase(f.key)}
                aria-pressed={on}
                className="rounded-[2px] px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.04em] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-1"
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
            <p className="text-[18px] font-bold uppercase" style={{ ...elite, color: C.ink }}>
              Postvak leeg
            </p>
            <p className="max-w-xs text-[13px]" style={{ ...body, color: C.inkSoft }}>
              Geen nieuwe berichten. Reageer op een opdracht om een gesprek te openen.
            </p>
          </div>
        )}

        {fase === "error" && (
          <div className="flex flex-col items-center justify-center gap-3 py-10 text-center">
            <TriangleAlert
              size={30}
              strokeWidth={1.8}
              style={{ color: C.stamp }}
              aria-hidden="true"
            />
            <p className="text-[18px] font-bold uppercase" style={{ ...elite, color: C.ink }}>
              Laden mislukt
            </p>
            <p className="max-w-xs text-[13px]" style={{ ...body, color: C.inkSoft }}>
              De berichten konden niet worden opgehaald. Probeer het opnieuw.
            </p>
            <button
              onClick={() => setFase("data")}
              className="mt-1 inline-flex items-center gap-2 rounded-[2px] px-4 py-2 text-[11px] font-bold uppercase tracking-[0.06em] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
              style={{ ...mono, background: C.stamp, color: "#fff" }}
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
                className="flex items-center gap-3 rounded-[2px] px-2 py-2 transition-colors hover:bg-[rgba(20,20,20,0.03)]"
              >
                <span
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[2px] text-[12px]"
                  style={{ background: C.ink, color: C.paper, ...mono, transform: "rotate(-3deg)" }}
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
                        style={{ background: C.stamp }}
                        aria-label="Ongelezen"
                      />
                    )}
                  </div>
                  <p className="truncate text-[12.5px]" style={{ ...body, color: C.inkSoft }}>
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
    </Snippet>
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
      <Ransom text="De Marktplaats" size="md" />

      <Snippet className="flex items-center gap-3 px-4">
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
          className="shrink-0 text-[12px] font-bold tabular-nums"
          style={{ ...mono, color: C.inkSoft }}
        >
          {filtered.length}
        </span>
      </Snippet>

      {filtered.length === 0 ? (
        <Snippet torn className="flex flex-col items-center justify-center gap-3 p-14 text-center">
          <Search size={30} strokeWidth={1.6} style={{ color: C.inkFaint }} aria-hidden="true" />
          <p className="text-[22px] font-bold uppercase" style={{ ...elite, color: C.ink }}>
            Niets gevonden
          </p>
          <p className="max-w-xs text-[13px]" style={{ ...body, color: C.inkSoft }}>
            Geen opdrachten onder “{q}”. Verruim je zoekopdracht of beschikbaarheid.
          </p>
          <button
            onClick={() => setQ("")}
            className="mt-2 inline-flex items-center gap-2 rounded-[2px] px-4 py-2 text-[11px] font-bold uppercase tracking-[0.06em] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
            style={{ ...mono, background: C.stamp, color: "#fff" }}
          >
            Zoekopdracht wissen
          </button>
        </Snippet>
      ) : (
        <ul className="space-y-3">
          {filtered.map((o, i) => (
            <li key={o.id}>
              <Snippet
                interactive
                rot={i % 2 === 0 ? -0.4 : 0.4}
                className="flex flex-col gap-4 p-4 sm:flex-row sm:items-center"
              >
                <button
                  onClick={onOpen}
                  className="min-w-0 flex-1 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
                >
                  <h3
                    className="text-[19px] font-bold leading-tight"
                    style={{ ...elite, color: C.ink }}
                  >
                    {o.titel}
                  </h3>
                  <div className="mt-0.5 text-[12px]" style={{ ...body, color: C.inkSoft }}>
                    {o.opdrachtgever} · {o.plaats} · {o.tarief}
                  </div>
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {o.tags.map((t) => (
                      <Chip key={t}>{t}</Chip>
                    ))}
                  </div>
                </button>
                <div className="flex items-center gap-4">
                  <MatchStamp value={o.match} />
                  <button
                    onClick={() => setSaved((s) => ({ ...s, [o.id]: !s[o.id] }))}
                    aria-pressed={!!saved[o.id]}
                    aria-label={saved[o.id] ? "Verwijder uit bewaard" : "Bewaar opdracht"}
                    className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[2px] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
                    style={{
                      border: `1.5px solid ${saved[o.id] ? C.stamp : C.line}`,
                      background: saved[o.id] ? C.stamp : "transparent",
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
              </Snippet>
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
        className="inline-flex items-center gap-2 text-[12px] font-bold uppercase tracking-[0.06em] transition-opacity hover:opacity-60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
        style={{ ...mono, color: C.inkSoft }}
      >
        <ArrowLeft size={14} aria-hidden="true" /> Terug naar marktplaats
      </button>

      <section>
        <div className="flex flex-wrap items-center gap-2">
          <span
            className="text-[10.5px] font-bold uppercase tracking-[0.14em]"
            style={{ ...mono, color: C.inkSoft }}
          >
            {opdracht.id}
          </span>
          <span
            className="inline-flex items-center rounded-[2px] px-2 py-1 text-[10px] font-bold uppercase tracking-[0.06em]"
            style={{ ...mono, background: C.stamp, color: "#fff", transform: "rotate(-2deg)" }}
          >
            {opdracht.match}% match
          </span>
        </div>
        <h1
          className="mt-3 text-[30px] font-bold leading-[1.08] sm:text-[38px]"
          style={{ ...elite, color: C.ink }}
        >
          {opdracht.titel}
        </h1>
        <p className="mt-2 text-[13px]" style={{ ...body, color: C.inkSoft }}>
          {opdracht.opdrachtgever} · {opdracht.plaats}
        </p>
      </section>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {feiten.map((m, i) => (
          <Snippet key={m.l} className="p-4" rot={i % 2 === 0 ? -0.6 : 0.6}>
            <m.Icon size={16} style={{ color: C.stamp }} aria-hidden="true" />
            <div
              className="mt-2 text-[20px] tabular-nums leading-none"
              style={{ ...anton, color: C.ink }}
            >
              {m.v}
            </div>
            <div
              className="mt-1.5 text-[10.5px] font-bold uppercase tracking-[0.1em]"
              style={{ ...mono, color: C.inkSoft }}
            >
              {m.l}
            </div>
          </Snippet>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <Snippet className="p-5">
          <div
            className="inline-flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.12em]"
            style={{ ...mono, color: C.green }}
          >
            <Check size={14} strokeWidth={2.6} aria-hidden="true" /> Wat past
          </div>
          <ul className="mt-4 space-y-3">
            {opdracht.redenen.plus.map((r) => (
              <li
                key={r}
                className="flex items-start gap-3 text-[13.5px] leading-snug"
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
        </Snippet>
        <Snippet className="p-5">
          <div
            className="inline-flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.12em]"
            style={{ ...mono, color: C.amber }}
          >
            <TriangleAlert size={14} strokeWidth={2.6} aria-hidden="true" /> Aandacht
          </div>
          <ul className="mt-4 space-y-3">
            {opdracht.redenen.min.map((r) => (
              <li
                key={r}
                className="flex items-start gap-3 text-[13.5px] leading-snug"
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
        </Snippet>
      </div>

      <div className="flex flex-col items-stretch gap-3 pt-1 sm:flex-row">
        <button
          className="group inline-flex flex-1 items-center justify-center gap-2.5 rounded-[2px] px-7 py-3.5 text-[12.5px] font-bold uppercase tracking-[0.06em] transition-all hover:gap-3.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 motion-reduce:hover:gap-2.5"
          style={{ ...mono, background: C.stamp, color: "#fff" }}
        >
          Reageer op opdracht <ArrowRight size={16} aria-hidden="true" />
        </button>
        <button
          className="inline-flex items-center justify-center gap-2 rounded-[2px] px-6 py-3.5 text-[12.5px] font-bold uppercase tracking-[0.06em] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
          style={{
            ...mono,
            border: `1.5px solid ${C.lineStrong}`,
            color: C.ink,
            background: "rgba(255,255,255,0.35)",
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
      <Ransom text="Verificatie" size="md" />

      <Snippet torn className="flex flex-col items-center gap-6 p-6 sm:flex-row">
        <div className="relative h-24 w-24 shrink-0" aria-hidden="true">
          <svg viewBox="0 0 36 36" className="h-full w-full -rotate-90">
            <circle
              cx="18"
              cy="18"
              r="15.5"
              fill="none"
              stroke="rgba(20,20,20,0.14)"
              strokeWidth="3"
            />
            <circle
              cx="18"
              cy="18"
              r="15.5"
              fill="none"
              stroke={C.stamp}
              strokeWidth="3"
              strokeLinecap="butt"
              strokeDasharray={`${(pct / 100) * 97.4} 97.4`}
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span
              className="text-[26px] tabular-nums leading-none"
              style={{ ...anton, color: C.ink }}
            >
              {pct}%
            </span>
            <span
              className="text-[9px] font-bold uppercase tracking-[0.16em]"
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
              className="text-[13px] font-bold uppercase tracking-[0.06em]"
              style={{ ...mono, color: C.ink }}
            >
              {PROFIEL.trust}
            </span>
          </div>
          <p
            className="mt-2 max-w-sm text-[13.5px] leading-relaxed"
            style={{ ...body, color: C.inkSoft }}
          >
            {verified} van de {CREDENTIALS.length} bewijsstukken zijn geverifieerd. Vernieuw wat
            binnenkort verloopt om zichtbaar te blijven voor opdrachtgevers.
          </p>
        </div>
      </Snippet>

      <ul className="space-y-3">
        {CREDENTIALS.map((c, i) => (
          <li key={c.naam}>
            <Snippet
              className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between"
              rot={i % 2 === 0 ? -0.4 : 0.4}
            >
              <div className="min-w-0">
                <h3 className="text-[15px] font-semibold" style={{ ...body, color: C.ink }}>
                  {c.naam}
                </h3>
                <p className="mt-0.5 text-[12.5px]" style={{ ...body, color: C.inkSoft }}>
                  {c.detail}
                </p>
              </div>
              <StampBadge status={c.status} big />
            </Snippet>
          </li>
        ))}
      </ul>

      <section>
        <div
          className="mb-3 flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.12em]"
          style={{ ...mono, color: C.inkSoft }}
        >
          <FileText size={13} aria-hidden="true" /> Documenten
        </div>
        <Snippet className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[520px] border-collapse text-left">
              <thead>
                <tr style={{ borderBottom: `1px solid ${C.lineStrong}` }}>
                  {["Bestand", "Type", "Grootte", "Status", "Bijgewerkt"].map((h) => (
                    <th
                      key={h}
                      className="px-3 py-2.5 text-[10px] font-bold uppercase tracking-[0.08em]"
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
                    className="transition-colors hover:bg-[rgba(20,20,20,0.03)]"
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
                      <StampBadge status={d.status} />
                    </td>
                    <td className="px-3 py-3 text-[12px]" style={{ ...body, color: C.inkSoft }}>
                      {d.bijgewerkt}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Snippet>
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
      <Ransom text="De Acties" size="md" />

      <Snippet torn className="flex items-center justify-between gap-4 p-5">
        <div>
          <div
            className="text-[10px] font-bold uppercase tracking-[0.18em]"
            style={{ ...mono, color: C.stamp }}
          >
            Openstaand
          </div>
          <div
            className="mt-1 text-[38px] tabular-nums leading-none"
            style={{ ...anton, color: C.ink }}
          >
            {openCount}
          </div>
        </div>
        <p
          className="max-w-xs text-right text-[13px] leading-relaxed"
          style={{ ...body, color: C.inkSoft }}
        >
          Vink af wat gedaan is. Wat overblijft is de volgende beste actie.
        </p>
      </Snippet>

      <ul className="space-y-3">
        {ACTIES.map((a, i) => {
          const isDone = !!done[i];
          const tone = a.urgentie === "warning" ? C.amber : C.stamp;
          return (
            <li key={a.titel}>
              <Snippet
                className="flex flex-col gap-4 p-4 sm:flex-row sm:items-center"
                rot={i % 2 === 0 ? -0.4 : 0.4}
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
                      style={{ background: tone }}
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
                    className="group inline-flex shrink-0 items-center gap-2 rounded-[2px] px-4 py-2.5 text-[11.5px] font-bold uppercase tracking-[0.06em] transition-all hover:gap-3 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 motion-reduce:hover:gap-2"
                    style={{
                      ...mono,
                      background: tone === C.amber ? C.amber : C.ink,
                      color: C.paper,
                    }}
                  >
                    {a.cta} <ArrowRight size={14} aria-hidden="true" />
                  </button>
                )}
              </Snippet>
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
      <Ransom text="De Facturen" size="md" />

      <Snippet className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[560px] border-collapse text-left">
            <thead>
              <tr style={{ borderBottom: `1px solid ${C.lineStrong}` }}>
                {["Nummer", "Klant", "Datum", "Bedrag", "Status"].map((h) => (
                  <th
                    key={h}
                    className="px-4 py-3 text-[10px] font-bold uppercase tracking-[0.08em]"
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
                  className="transition-colors hover:bg-[rgba(20,20,20,0.03)]"
                  style={{ borderBottom: `1px solid ${C.line}` }}
                >
                  <td
                    className="px-4 py-3.5 text-[13px] font-bold"
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
                    className="px-4 py-3.5 text-[16px] tabular-nums"
                    style={{ ...anton, color: C.ink }}
                  >
                    {f.bedrag}
                  </td>
                  <td className="px-4 py-3.5">
                    <span
                      className="inline-flex items-center gap-1.5 rounded-[2px] px-2 py-1 text-[10px] font-bold uppercase tracking-[0.06em]"
                      style={{
                        ...mono,
                        color: statusTone(f.status),
                        border: `1.5px solid ${statusTone(f.status)}`,
                        transform: "rotate(-1deg)",
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
      </Snippet>
    </div>
  );
}
