"use client";

// Concept 222 — "Grafiet" · monochroom, tactiel-mat. Potlood-op-papier: warme grijsschaal (#1a1a1a → #f4f2ee),
// subtiele korrel en diagonale arcering via inline-SVG-patterns, en exact één warme accentkleur (oker/roest).
// Ingetogen, ambachtelijk, premium-rustig — het ambacht zit in de details: dunne lijnen, gearceerde vlakken,
// een geruite kantlijn als van een schetsboek. Serif-koppen (Newsreader) tegen een mono voor labels/annotaties.
// Statussen dragen altijd een woord én een icoon (nooit alleen kleur). UI Nederlands, code Engels.
// Deterministisch: geen random-runtime, geen Date, geen netwerk/afbeeldingen (SVG-turbulentie heeft vaste seed).

import { useState } from "react";
import {
  ArrowRight,
  ArrowLeft,
  Check,
  Clock,
  XCircle,
  Search,
  ShieldCheck,
  Plus,
  MapPin,
  Coins,
  CalendarDays,
  FileText,
  TriangleAlert,
  RefreshCw,
  BadgeCheck,
  PenLine,
  Minus,
  ChevronRight,
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
  DOCUMENTEN,
  type ScreenKey,
  type CredStatus,
  type Opdracht,
} from "./mock";

// ── Palet — warme grijsschaal + één roest-accent. ──
const C = {
  ink: "#1a1a1a", // grafiet-zwart
  ink2: "#2f2b28", // donker
  soft: "#5c554d", // secundaire tekst
  faint: "#8c847a", // labels
  paper: "#f4f2ee", // warm papier
  paper2: "#ebe7df", // vlak
  paper3: "#e2ddd2", // dieper vlak
  line: "#d7d0c2", // hairline
  lineSoft: "#e4ded2", // zachte lijn
  accent: "#b5682b", // roest/oker
  accentDeep: "#8a4e1e", // dieper (tekst op papier)
  accentSoft: "#efe0cf", // zacht accentvlak
};

const serifF = { fontFamily: "var(--font-lab-newsreader)" };
const monoF = { fontFamily: "var(--font-lab-spline-mono)" };

// ── Herbruikbare SVG-patterns (arcering) — één set defs, uniek voor dit concept. ──
function HatchDefs() {
  return (
    <svg width="0" height="0" className="absolute" aria-hidden="true">
      <defs>
        <pattern
          id="c222-hatch"
          width="6"
          height="6"
          patternUnits="userSpaceOnUse"
          patternTransform="rotate(45)"
        >
          <line x1="0" y1="0" x2="0" y2="6" stroke={C.ink} strokeWidth="1.1" />
        </pattern>
        <pattern
          id="c222-hatch-accent"
          width="6"
          height="6"
          patternUnits="userSpaceOnUse"
          patternTransform="rotate(45)"
        >
          <line x1="0" y1="0" x2="0" y2="6" stroke={C.accent} strokeWidth="1.3" />
        </pattern>
        <filter id="c222-grain">
          <feTurbulence
            type="fractalNoise"
            baseFrequency="0.9"
            numOctaves="2"
            seed="7"
            stitchTiles="stitch"
          />
          <feColorMatrix type="saturate" values="0" />
        </filter>
      </defs>
    </svg>
  );
}

// ── Status-model — potlood-outline; accent voor negatief; altijd label + icoon. ──
type StatusStyle = { label: string; Icon: LucideIcon; kind: "solid" | "line" | "alarm" };
function credMeta(s: CredStatus): StatusStyle {
  switch (s) {
    case "VERIFIED":
      return { label: "Geverifieerd", Icon: BadgeCheck, kind: "solid" };
    case "SUBMITTED":
      return { label: "In beoordeling", Icon: Clock, kind: "line" };
    case "EXPIRING":
      return { label: "Verloopt binnenkort", Icon: TriangleAlert, kind: "alarm" };
    case "REJECTED":
      return { label: "Afgewezen", Icon: XCircle, kind: "alarm" };
  }
}

function StatusChip({ status }: { status: CredStatus }) {
  const m = credMeta(status);
  const style: React.CSSProperties =
    m.kind === "solid"
      ? { background: C.ink, color: C.paper, border: `1px solid ${C.ink}` }
      : m.kind === "alarm"
        ? { background: C.accentSoft, color: C.accentDeep, border: `1px solid ${C.accent}` }
        : { background: C.paper, color: C.soft, border: `1px solid ${C.line}` };
  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-[3px] px-2.5 py-1 text-[11px] font-medium tracking-[0.02em]"
      style={{ ...monoF, ...style }}
    >
      <m.Icon size={12} strokeWidth={2} aria-hidden="true" />
      {m.label}
    </span>
  );
}

// Ambachtelijke kaart — dunne lijn, zacht papiervlak, minimale radius.
function Card({
  children,
  className = "",
  style,
}: {
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
}) {
  return (
    <div
      className={`rounded-[4px] ${className}`}
      style={{ background: C.paper, border: `1px solid ${C.line}`, ...style }}
    >
      {children}
    </div>
  );
}

// Sectie-kop — mono-kicker + serif-titel + gearceerde regel.
function SectionHead({ kicker, title }: { kicker: string; title: string }) {
  return (
    <div>
      <div className="flex items-center gap-2">
        <PenLine size={13} strokeWidth={2} style={{ color: C.accent }} aria-hidden="true" />
        <span
          className="text-[11px] uppercase tracking-[0.2em]"
          style={{ ...monoF, color: C.faint }}
        >
          {kicker}
        </span>
      </div>
      <h2 className="mt-1.5 text-[27px] leading-tight" style={{ ...serifF, color: C.ink }}>
        {title}
      </h2>
      <div className="mt-2.5 h-[7px] w-full" aria-hidden="true">
        <svg viewBox="0 0 100 7" preserveAspectRatio="none" className="h-[7px] w-full">
          <rect x="0" y="2.5" width="100" height="2" fill="url(#c222-hatch)" opacity="0.55" />
        </svg>
      </div>
    </div>
  );
}

function Meta({ Icon, label, value }: { Icon: LucideIcon; label: string; value: string }) {
  return (
    <div>
      <div className="flex items-center gap-1.5" style={{ color: C.faint }}>
        <Icon size={13} strokeWidth={1.8} aria-hidden="true" />
        <span className="text-[10px] uppercase tracking-[0.14em]" style={monoF}>
          {label}
        </span>
      </div>
      <div className="mt-1 text-[15px] tabular-nums" style={{ ...serifF, color: C.ink }}>
        {value}
      </div>
    </div>
  );
}

// Potlood-sparkline — dunne lijn met gearceerde vulling eronder.
function Spark({ data }: { data: number[] }) {
  const max = Math.max(...data);
  const min = Math.min(...data);
  const span = max - min || 1;
  const coords = data.map((v, i) => {
    const x = (i / (data.length - 1)) * 100;
    const y = 26 - ((v - min) / span) * 20 - 3;
    return [x, y] as const;
  });
  const line = coords.map(([x, y]) => `${x.toFixed(1)},${y.toFixed(1)}`).join(" ");
  const area = `0,28 ${line} 100,28`;
  return (
    <svg
      viewBox="0 0 100 28"
      preserveAspectRatio="none"
      className="h-7 w-full"
      aria-hidden="true"
      role="presentation"
    >
      <polygon points={area} fill="url(#c222-hatch)" opacity="0.28" />
      <polyline
        points={line}
        fill="none"
        stroke={C.ink}
        strokeWidth="1.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

// Gearceerde match-meter — cijfer + potloodbalk.
function MatchBar({ value, size = "md" }: { value: number; size?: "sm" | "md" | "lg" }) {
  const num = size === "lg" ? "text-[64px]" : size === "sm" ? "text-[30px]" : "text-[44px]";
  const w = size === "lg" ? "w-40" : size === "sm" ? "w-20" : "w-28";
  return (
    <div className="flex flex-col items-start gap-1.5">
      <div className="flex items-baseline gap-1 leading-none" style={{ color: C.ink }}>
        <span className={`${num} tabular-nums`} style={serifF}>
          {value}
        </span>
        <span className="text-[13px]" style={{ ...monoF, color: C.accentDeep }}>
          % match
        </span>
      </div>
      <div
        className={`${w} h-2.5`}
        style={{ border: `1px solid ${C.line}`, background: C.paper2 }}
        aria-hidden="true"
      >
        <svg
          viewBox="0 0 100 10"
          preserveAspectRatio="none"
          className="h-full"
          style={{ width: `${value}%` }}
        >
          <rect x="0" y="0" width="100" height="10" fill="url(#c222-hatch-accent)" />
        </svg>
      </div>
    </div>
  );
}

// ── Root — schetsboek-vel met kantlijn en horizontale tab-navigatie. ───────────────
export function Concept222() {
  const [screen, setScreen] = useState<ScreenKey>("dashboard");
  const active = OPDRACHTEN[0] as Opdracht;

  return (
    <div
      className="relative min-h-screen w-full overflow-x-hidden antialiased"
      style={{ ...monoF, background: C.paper, color: C.ink }}
    >
      <HatchDefs />
      {/* Fijne korrel over het geheel — vaste seed, dus deterministisch. */}
      <svg
        className="pointer-events-none fixed inset-0 z-0 h-full w-full opacity-[0.05] mix-blend-multiply"
        aria-hidden="true"
      >
        <rect width="100%" height="100%" filter="url(#c222-grain)" />
      </svg>
      {/* Geruite achtergrond — flauwe horizontale liniatuur + kantlijn. */}
      <div
        className="pointer-events-none fixed inset-0 z-0"
        style={{
          backgroundImage: `repeating-linear-gradient(${C.lineSoft} 0 1px, transparent 1px 30px)`,
          opacity: 0.5,
        }}
        aria-hidden="true"
      />

      <div className="relative z-10">
        <header
          className="sticky top-0 z-30"
          style={{
            background: `${C.paper}f2`,
            backdropFilter: "blur(6px)",
            borderBottom: `1px solid ${C.line}`,
          }}
        >
          <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-4 py-4 md:px-8">
            <div className="flex items-center gap-3">
              <span
                className="relative flex h-11 w-11 items-center justify-center overflow-hidden rounded-[5px]"
                style={{ border: `1.5px solid ${C.ink}` }}
                aria-hidden="true"
              >
                <svg viewBox="0 0 44 44" className="absolute inset-0 h-full w-full">
                  <rect width="44" height="44" fill="url(#c222-hatch)" opacity="0.5" />
                </svg>
                <span className="relative text-[18px]" style={{ ...serifF, color: C.ink }}>
                  G
                </span>
              </span>
              <div className="leading-tight">
                <div className="text-[19px]" style={{ ...serifF, color: C.ink }}>
                  Grafiet
                </div>
                <div
                  className="mt-0.5 text-[10px] uppercase tracking-[0.2em]"
                  style={{ color: C.faint }}
                >
                  {PROFIEL.plaats} · schetsboek-editie
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <span
                className="hidden items-center gap-1.5 rounded-[3px] px-3 py-1.5 text-[11px] sm:inline-flex"
                style={{ border: `1px solid ${C.line}`, color: C.soft }}
              >
                <ShieldCheck
                  size={13}
                  strokeWidth={2}
                  style={{ color: C.accentDeep }}
                  aria-hidden="true"
                />{" "}
                {PROFIEL.trust}
              </span>
              <span
                className="flex h-10 w-10 items-center justify-center rounded-[5px] text-[13px]"
                style={{ ...serifF, background: C.ink, color: C.paper }}
                aria-hidden="true"
              >
                {PROFIEL.initialen}
              </span>
            </div>
          </div>

          <nav
            className="mx-auto flex max-w-6xl items-center gap-1 overflow-x-auto px-4 pb-2 md:px-8"
            aria-label="Schermen"
          >
            {SCREENS.map((s) => {
              const on = s.key === screen;
              return (
                <button
                  key={s.key}
                  onClick={() => setScreen(s.key)}
                  aria-current={on ? "page" : undefined}
                  className="relative shrink-0 px-3.5 py-2 text-[13px] transition-colors focus-visible:outline-none focus-visible:ring-2"
                  style={{
                    ...monoF,
                    color: on ? C.ink : C.faint,
                    borderBottom: on ? `2px solid ${C.accent}` : "2px solid transparent",
                    ["--tw-ring-color" as string]: C.accent,
                  }}
                >
                  {s.label}
                </button>
              );
            })}
          </nav>
        </header>

        <main className="mx-auto max-w-6xl px-4 py-8 md:px-8">
          {screen === "dashboard" && (
            <Dashboard onOpen={() => setScreen("opdracht")} onActies={() => setScreen("acties")} />
          )}
          {screen === "marktplaats" && <Marktplaats onOpen={() => setScreen("opdracht")} />}
          {screen === "opdracht" && (
            <OpdrachtDetail opdracht={active} onBack={() => setScreen("marktplaats")} />
          )}
          {screen === "verificatie" && <Verificatie />}
          {screen === "acties" && <Acties onMatches={() => setScreen("marktplaats")} />}
          {screen === "facturen" && <Facturen />}
        </main>

        <footer className="mx-auto max-w-6xl px-4 pb-12 md:px-8">
          <div
            className="flex flex-wrap items-center gap-2 border-t pt-6 text-[11px]"
            style={{ borderColor: C.line, color: C.faint }}
          >
            <PenLine size={13} strokeWidth={2} style={{ color: C.accent }} aria-hidden="true" />
            Monochroom en ambachtelijk — arcering doet het werk, kleur alleen als accent; elke
            status draagt woord én icoon.
          </div>
        </footer>
      </div>
    </div>
  );
}

// ── Dashboard ──────────────────────────────────────────────────────────────────
function Dashboard({ onOpen, onActies }: { onOpen: () => void; onActies: () => void }) {
  const verified = CREDENTIALS.filter((c) => c.status === "VERIFIED").length;
  const dek = Math.round((verified / CREDENTIALS.length) * 100);
  const warn = (ACTIES.find((a) => a.urgentie === "warning") ??
    ACTIES[0]) as (typeof ACTIES)[number];

  return (
    <div className="space-y-8">
      {/* Kop-vel */}
      <Card className="relative overflow-hidden p-6 sm:p-8">
        <svg
          viewBox="0 0 100 100"
          preserveAspectRatio="none"
          className="pointer-events-none absolute -right-10 -top-10 h-56 w-56 opacity-[0.14]"
          aria-hidden="true"
        >
          <circle cx="50" cy="50" r="48" fill="url(#c222-hatch-accent)" />
        </svg>
        <div className="relative">
          <span className="text-[11px] uppercase tracking-[0.22em]" style={{ color: C.accentDeep }}>
            Dagoverzicht
          </span>
          <h1
            className="mt-3 text-[34px] leading-[1.05] sm:text-[46px]"
            style={{ ...serifF, color: C.ink }}
          >
            Goedemorgen, {PROFIEL.naam.split(" ")[0]}. <br className="hidden sm:block" />
            Drie opdrachten wachten op je oordeel.
          </h1>
          <p
            className="mt-3 max-w-xl text-[14px] leading-relaxed"
            style={{ ...monoF, color: C.soft }}
          >
            Eén punt vraagt aandacht — je VOG verloopt binnenkort. De rest is netjes op orde.
          </p>
          <div className="mt-5 flex flex-wrap gap-3">
            <button
              onClick={onOpen}
              className="inline-flex items-center gap-2 rounded-[4px] px-5 py-2.5 text-[13px] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
              style={{
                ...monoF,
                background: C.ink,
                color: C.paper,
                ["--tw-ring-color" as string]: C.accent,
                ["--tw-ring-offset-color" as string]: C.paper,
              }}
            >
              Bekijk matches <ArrowRight size={15} aria-hidden="true" />
            </button>
            <button
              onClick={onActies}
              className="inline-flex items-center gap-2 rounded-[4px] px-5 py-2.5 text-[13px] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
              style={{
                ...monoF,
                background: C.accentSoft,
                color: C.accentDeep,
                border: `1px solid ${C.accent}`,
                ["--tw-ring-color" as string]: C.accent,
                ["--tw-ring-offset-color" as string]: C.paper,
              }}
            >
              <TriangleAlert size={14} strokeWidth={2.2} aria-hidden="true" /> Regel je VOG
            </button>
          </div>
        </div>
      </Card>

      {/* KPI's */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {KPIS.map((k) => (
          <Card key={k.label} className="p-5">
            <div className="flex items-start justify-between gap-2">
              <span className="text-[10px] uppercase tracking-[0.12em]" style={{ color: C.faint }}>
                {k.label}
              </span>
              <span
                className="rounded-[3px] px-1.5 py-0.5 text-[10px] tabular-nums"
                style={{ border: `1px solid ${C.line}`, color: k.up ? C.ink : C.accentDeep }}
              >
                {k.trend}
              </span>
            </div>
            <div
              className="mt-2.5 text-[28px] tabular-nums leading-none"
              style={{ ...serifF, color: C.ink }}
            >
              {k.value}
            </div>
            <div className="mt-3">
              <Spark data={k.spark} />
            </div>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-[1.6fr_1fr]">
        <section className="space-y-4">
          <SectionHead kicker="Voor jou geselecteerd" title="Best passende opdrachten" />
          <div className="space-y-3">
            {OPDRACHTEN.map((o) => (
              <Card key={o.id} className="overflow-hidden">
                <button
                  onClick={onOpen}
                  className="flex w-full items-center gap-5 p-5 text-left transition-colors hover:bg-[color:var(--hov)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset"
                  style={{ ["--hov" as string]: C.paper2, ["--tw-ring-color" as string]: C.accent }}
                >
                  <MatchBar value={o.match} size="sm" />
                  <div className="min-w-0 flex-1">
                    <div
                      className="text-[10px] uppercase tracking-[0.12em]"
                      style={{ color: C.accentDeep }}
                    >
                      {o.id}
                    </div>
                    <div
                      className="mt-0.5 truncate text-[18px]"
                      style={{ ...serifF, color: C.ink }}
                    >
                      {o.titel}
                    </div>
                    <div className="mt-1 truncate text-[12.5px]" style={{ color: C.soft }}>
                      {o.opdrachtgever} · {o.plaats} · {o.tarief}
                    </div>
                  </div>
                  <ChevronRight
                    size={18}
                    className="shrink-0"
                    style={{ color: C.faint }}
                    aria-hidden="true"
                  />
                </button>
              </Card>
            ))}
          </div>
        </section>

        <section className="space-y-6">
          <div className="space-y-4">
            <SectionHead kicker="Vraagt aandacht" title="Nu regelen" />
            <Card className="p-5" style={{ borderColor: C.accent }}>
              <span
                className="inline-flex items-center gap-1.5 rounded-[3px] px-2 py-0.5 text-[10px] uppercase tracking-[0.08em]"
                style={{ ...monoF, background: C.accent, color: C.paper }}
              >
                <TriangleAlert size={11} strokeWidth={2.4} aria-hidden="true" /> Prioriteit
              </span>
              <h3 className="mt-3 text-[19px] leading-tight" style={{ ...serifF, color: C.ink }}>
                {warn.titel}
              </h3>
              <p className="mt-1.5 text-[13px] leading-relaxed" style={{ ...monoF, color: C.soft }}>
                {warn.detail}
              </p>
              <button
                onClick={onActies}
                className="mt-4 inline-flex items-center gap-2 rounded-[4px] px-4 py-2 text-[12px] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
                style={{
                  ...monoF,
                  background: C.ink,
                  color: C.paper,
                  ["--tw-ring-color" as string]: C.accent,
                  ["--tw-ring-offset-color" as string]: C.paper,
                }}
              >
                {warn.cta} <ArrowRight size={13} aria-hidden="true" />
              </button>
            </Card>
          </div>

          <div className="space-y-4">
            <SectionHead kicker="Vertrouwen" title="Verificatiestand" />
            <Card className="p-5">
              <div className="flex items-end justify-between">
                <div className="flex items-baseline gap-1" style={{ color: C.ink }}>
                  <span className="text-[40px] tabular-nums leading-none" style={serifF}>
                    {dek}
                  </span>
                  <span className="text-[13px]" style={{ ...monoF, color: C.accentDeep }}>
                    %
                  </span>
                </div>
                <StatusChip status="VERIFIED" />
              </div>
              <div
                className="mt-4 h-2.5 w-full"
                style={{ border: `1px solid ${C.line}`, background: C.paper2 }}
                aria-hidden="true"
              >
                <svg
                  viewBox="0 0 100 10"
                  preserveAspectRatio="none"
                  className="h-full"
                  style={{ width: `${dek}%` }}
                >
                  <rect width="100" height="10" fill="url(#c222-hatch)" />
                </svg>
              </div>
              <p className="mt-3 text-[12.5px] leading-relaxed" style={{ ...monoF, color: C.soft }}>
                {verified} van {CREDENTIALS.length} certificaten gecontroleerd. Opdrachtgevers zien
                uitsluitend geverifieerde documenten.
              </p>
            </Card>
          </div>
        </section>
      </div>
    </div>
  );
}

// ── Marktplaats — zoek, skeleton, empty- én foutstate ─────────────────────────────
function Marktplaats({ onOpen }: { onOpen: () => void }) {
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(true);

  const filtered = OPDRACHTEN.filter(
    (o) =>
      o.titel.toLowerCase().includes(q.toLowerCase()) ||
      o.plaats.toLowerCase().includes(q.toLowerCase()) ||
      o.opdrachtgever.toLowerCase().includes(q.toLowerCase()),
  );

  const refresh = () => {
    setLoading(true);
    setTimeout(() => setLoading(false), 650);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <SectionHead kicker="Alle open opdrachten" title="Marktplaats" />
        <div className="flex items-center gap-2">
          <div
            className="flex items-center gap-2 rounded-[4px] px-3.5 py-2.5"
            style={{ border: `1px solid ${C.line}`, background: C.paper }}
          >
            <Search size={15} strokeWidth={2} style={{ color: C.accentDeep }} aria-hidden="true" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Zoek titel of plaats…"
              aria-label="Opdrachten zoeken"
              className="w-44 bg-transparent text-[13px] outline-none placeholder:opacity-60"
              style={{ ...monoF, color: C.ink }}
            />
          </div>
          <button
            onClick={refresh}
            aria-label="Opdrachten verversen"
            className="flex h-10 w-10 items-center justify-center rounded-[4px] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
            style={{
              border: `1px solid ${C.line}`,
              color: C.soft,
              ["--tw-ring-color" as string]: C.accent,
              ["--tw-ring-offset-color" as string]: C.paper,
            }}
          >
            <RefreshCw size={15} className={loading ? "animate-spin" : ""} aria-hidden="true" />
          </button>
        </div>
      </div>

      {error && (
        <div
          className="flex items-start gap-3 rounded-[4px] p-4"
          role="alert"
          style={{ border: `1px solid ${C.accent}`, background: C.accentSoft }}
        >
          <XCircle size={18} strokeWidth={2} style={{ color: C.accentDeep }} aria-hidden="true" />
          <div className="min-w-0 flex-1">
            <div className="text-[14px]" style={{ ...serifF, color: C.ink }}>
              Niet alles kon worden geladen
            </div>
            <p className="mt-0.5 text-[12.5px]" style={{ ...monoF, color: C.soft }}>
              Enkele opdrachten reageerden traag. Ververs om het opnieuw te proberen.
            </p>
          </div>
          <button
            onClick={() => setError(false)}
            className="shrink-0 text-[11px] uppercase tracking-[0.08em] focus-visible:outline-none focus-visible:ring-2"
            style={{ ...monoF, color: C.accentDeep, ["--tw-ring-color" as string]: C.accent }}
          >
            Sluiten
          </button>
        </div>
      )}

      {loading ? (
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
          {[0, 1, 2].map((i) => (
            <Card key={i} className="p-5">
              <span
                className="block h-8 w-24 animate-pulse rounded-[3px]"
                style={{ background: C.paper3 }}
              />
              <span
                className="mt-4 block h-5 w-3/4 animate-pulse rounded-[3px]"
                style={{ background: C.paper3 }}
              />
              <span
                className="mt-2 block h-4 w-1/2 animate-pulse rounded-[3px]"
                style={{ background: C.paper3 }}
              />
              <div className="mt-4 space-y-2">
                <span
                  className="block h-3 w-full animate-pulse rounded-[3px]"
                  style={{ background: C.paper2 }}
                />
                <span
                  className="block h-3 w-5/6 animate-pulse rounded-[3px]"
                  style={{ background: C.paper2 }}
                />
              </div>
            </Card>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <Card className="flex flex-col items-center justify-center gap-3 px-6 py-16 text-center">
          <span
            className="relative flex h-16 w-16 items-center justify-center overflow-hidden rounded-[6px]"
            style={{ border: `1.5px solid ${C.line}` }}
            aria-hidden="true"
          >
            <svg viewBox="0 0 64 64" className="absolute inset-0 h-full w-full opacity-40">
              <rect width="64" height="64" fill="url(#c222-hatch)" />
            </svg>
            <Search size={26} strokeWidth={1.6} style={{ color: C.soft }} className="relative" />
          </span>
          <p className="text-[24px]" style={{ ...serifF, color: C.ink }}>
            Geen opdracht gevonden
          </p>
          <p className="max-w-sm text-[13px] leading-relaxed" style={{ ...monoF, color: C.soft }}>
            Voor &ldquo;{q}&rdquo; staat nu niets open. Pas je zoekterm aan of wis het veld.
          </p>
          <button
            onClick={() => setQ("")}
            className="mt-1 rounded-[4px] px-5 py-2.5 text-[12px] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
            style={{
              ...monoF,
              background: C.ink,
              color: C.paper,
              ["--tw-ring-color" as string]: C.accent,
              ["--tw-ring-offset-color" as string]: C.paper,
            }}
          >
            Toon alles
          </button>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
          {filtered.map((o) => (
            <Card key={o.id} className="flex flex-col overflow-hidden">
              <div
                className="flex items-start justify-between gap-3 border-b p-5"
                style={{ borderColor: C.lineSoft }}
              >
                <div className="min-w-0">
                  <div
                    className="text-[10px] uppercase tracking-[0.12em]"
                    style={{ color: C.accentDeep }}
                  >
                    {o.id}
                  </div>
                  <h3
                    className="mt-1 text-[19px] leading-tight"
                    style={{ ...serifF, color: C.ink }}
                  >
                    {o.titel}
                  </h3>
                  <p className="mt-0.5 text-[12.5px]" style={{ color: C.soft }}>
                    {o.opdrachtgever}
                  </p>
                </div>
                <MatchBar value={o.match} size="sm" />
              </div>
              <div className="p-5">
                <dl className="grid grid-cols-2 gap-4">
                  <Meta Icon={MapPin} label="Plaats" value={o.plaats} />
                  <Meta Icon={Coins} label="Tarief" value={o.tarief} />
                  <Meta Icon={Clock} label="Omvang" value={o.uren} />
                  <Meta Icon={CalendarDays} label="Start" value={o.start} />
                </dl>
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {o.tags.map((t) => (
                    <span
                      key={t}
                      className="rounded-[3px] px-2 py-0.5 text-[11px]"
                      style={{ ...monoF, border: `1px solid ${C.line}`, color: C.soft }}
                    >
                      {t}
                    </span>
                  ))}
                </div>
              </div>
              <button
                onClick={onOpen}
                className="mt-auto flex items-center justify-center gap-2 border-t px-5 py-3.5 text-[12px] transition-colors hover:bg-[color:var(--hov)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset"
                style={{
                  ...monoF,
                  borderColor: C.lineSoft,
                  color: C.accentDeep,
                  ["--hov" as string]: C.paper2,
                  ["--tw-ring-color" as string]: C.accent,
                }}
              >
                Bekijk opdracht <ArrowRight size={14} aria-hidden="true" />
              </button>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Opdracht-detail ────────────────────────────────────────────────────────────────
function OpdrachtDetail({ opdracht, onBack }: { opdracht: Opdracht; onBack: () => void }) {
  const [saved, setSaved] = useState(false);
  const [applied, setApplied] = useState(false);

  return (
    <div className="space-y-6">
      <button
        onClick={onBack}
        className="inline-flex items-center gap-2 text-[12px] uppercase tracking-[0.1em] transition-colors focus-visible:outline-none focus-visible:ring-2"
        style={{ ...monoF, color: C.accentDeep, ["--tw-ring-color" as string]: C.accent }}
      >
        <ArrowLeft size={14} aria-hidden="true" /> Terug naar marktplaats
      </button>

      <Card className="relative overflow-hidden p-6 sm:p-8">
        <svg
          viewBox="0 0 100 100"
          preserveAspectRatio="none"
          className="pointer-events-none absolute -right-8 -top-8 h-48 w-48 opacity-[0.12]"
          aria-hidden="true"
        >
          <rect x="10" y="10" width="80" height="80" fill="url(#c222-hatch-accent)" />
        </svg>
        <div className="relative flex flex-wrap items-end justify-between gap-6">
          <div className="min-w-0">
            <div
              className="text-[11px] uppercase tracking-[0.14em]"
              style={{ color: C.accentDeep }}
            >
              {opdracht.id} · Start {opdracht.start}
            </div>
            <h1
              className="mt-2 max-w-2xl text-[30px] leading-[1.05] sm:text-[40px]"
              style={{ ...serifF, color: C.ink }}
            >
              {opdracht.titel}
            </h1>
            <p className="mt-2 text-[14px]" style={{ ...monoF, color: C.soft }}>
              {opdracht.opdrachtgever} · {opdracht.plaats}
            </p>
          </div>
          <MatchBar value={opdracht.match} size="lg" />
        </div>
      </Card>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {[
          { Icon: Coins, label: "Tarief", value: opdracht.tarief },
          { Icon: Clock, label: "Omvang", value: opdracht.uren },
          { Icon: CalendarDays, label: "Start", value: opdracht.start },
          { Icon: MapPin, label: "Plaats", value: opdracht.plaats },
        ].map((f) => (
          <Card key={f.label} className="p-5">
            <Meta Icon={f.Icon} label={f.label} value={f.value} />
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
        <section className="space-y-4">
          <SectionHead kicker="In het voordeel" title="Waarom dit past" />
          <Card className="p-5">
            <ul className="space-y-3">
              {opdracht.redenen.plus.map((r) => (
                <li
                  key={r}
                  className="flex items-start gap-3 text-[14px] leading-snug"
                  style={{ ...monoF, color: C.ink }}
                >
                  <Check
                    size={16}
                    strokeWidth={2.2}
                    className="mt-0.5 shrink-0"
                    style={{ color: C.ink }}
                    aria-hidden="true"
                  />
                  {r}
                </li>
              ))}
            </ul>
          </Card>
        </section>
        <section className="space-y-4">
          <SectionHead kicker="Om te wegen" title="Aandachtspunten" />
          <Card className="p-5">
            <ul className="space-y-3">
              {opdracht.redenen.min.map((r) => (
                <li
                  key={r}
                  className="flex items-start gap-3 text-[14px] leading-snug"
                  style={{ ...monoF, color: C.ink }}
                >
                  <Minus
                    size={16}
                    strokeWidth={2.2}
                    className="mt-0.5 shrink-0"
                    style={{ color: C.accentDeep }}
                    aria-hidden="true"
                  />
                  {r}
                </li>
              ))}
            </ul>
          </Card>
        </section>
      </div>

      <Card className="p-5">
        <SectionHead kicker="Gevraagd" title="Wat de opdrachtgever verwacht" />
        <div className="mt-4 flex flex-wrap gap-2">
          {opdracht.tags.map((t) => (
            <span
              key={t}
              className="inline-flex items-center gap-1.5 rounded-[3px] px-3 py-1.5 text-[12px]"
              style={{ ...monoF, border: `1px solid ${C.line}`, color: C.ink }}
            >
              <BadgeCheck
                size={13}
                strokeWidth={2}
                style={{ color: C.accentDeep }}
                aria-hidden="true"
              />{" "}
              {t}
            </span>
          ))}
        </div>
      </Card>

      <div className="flex flex-col gap-3 sm:flex-row">
        <button
          onClick={() => setApplied(true)}
          disabled={applied}
          className="flex flex-1 items-center justify-center gap-2 rounded-[4px] px-6 py-3.5 text-[13px] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
          style={{
            ...monoF,
            background: applied ? C.accentSoft : C.ink,
            color: applied ? C.accentDeep : C.paper,
            border: `1px solid ${applied ? C.accent : C.ink}`,
            ["--tw-ring-color" as string]: C.accent,
            ["--tw-ring-offset-color" as string]: C.paper,
          }}
        >
          {applied ? (
            <>
              <Check size={15} strokeWidth={2.4} aria-hidden="true" /> Reactie verstuurd
            </>
          ) : (
            <>
              Reageren op deze opdracht <ArrowRight size={15} aria-hidden="true" />
            </>
          )}
        </button>
        <button
          onClick={() => setSaved((s) => !s)}
          aria-pressed={saved}
          className="flex items-center justify-center gap-2 rounded-[4px] px-6 py-3.5 text-[13px] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
          style={{
            ...monoF,
            background: saved ? C.ink : C.paper,
            color: saved ? C.paper : C.ink,
            border: `1px solid ${C.ink}`,
            ["--tw-ring-color" as string]: C.accent,
            ["--tw-ring-offset-color" as string]: C.paper,
          }}
        >
          {saved ? "Bewaard" : "Bewaren"}
        </button>
      </div>
    </div>
  );
}

// ── Verificatie ──────────────────────────────────────────────────────────────────
function Verificatie() {
  const verified = CREDENTIALS.filter((c) => c.status === "VERIFIED").length;
  const dek = Math.round((verified / CREDENTIALS.length) * 100);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <SectionHead kicker="Documenten & vertrouwen" title="Jouw certificaten" />
        <button
          className="inline-flex items-center gap-2 rounded-[4px] px-4 py-2.5 text-[12px] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
          style={{
            ...monoF,
            background: C.ink,
            color: C.paper,
            ["--tw-ring-color" as string]: C.accent,
            ["--tw-ring-offset-color" as string]: C.paper,
          }}
        >
          <Plus size={14} aria-hidden="true" /> Document toevoegen
        </button>
      </div>

      <Card className="relative overflow-hidden p-6 sm:p-8">
        <div className="flex flex-wrap items-center gap-8">
          <div className="relative flex h-28 w-28 shrink-0 items-center justify-center">
            <svg viewBox="0 0 120 120" className="h-28 w-28 -rotate-90" aria-hidden="true">
              <circle cx="60" cy="60" r="52" fill="none" stroke={C.line} strokeWidth="10" />
              <circle
                cx="60"
                cy="60"
                r="52"
                fill="none"
                stroke={C.ink}
                strokeWidth="10"
                strokeLinecap="butt"
                strokeDasharray={`${(dek / 100) * 2 * Math.PI * 52} ${2 * Math.PI * 52}`}
              />
            </svg>
            <div className="absolute text-[26px] tabular-nums" style={{ ...serifF, color: C.ink }}>
              {dek}%
            </div>
          </div>
          <div className="max-w-md">
            <div className="text-[22px]" style={{ ...serifF, color: C.ink }}>
              {verified} van {CREDENTIALS.length} certificaten gecontroleerd
            </div>
            <p className="mt-2 text-[13px] leading-relaxed" style={{ ...monoF, color: C.soft }}>
              Elk geverifieerd document versterkt je profiel. Nog even en je staat volledig op
              groen.
            </p>
            <span
              className="mt-3 inline-flex items-center gap-1.5 rounded-[3px] px-3 py-1.5 text-[11px]"
              style={{ ...monoF, border: `1px solid ${C.ink}`, color: C.ink }}
            >
              <ShieldCheck size={12} strokeWidth={2.2} aria-hidden="true" /> {PROFIEL.trust}
            </span>
          </div>
        </div>
      </Card>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {CREDENTIALS.map((c) => {
          const actionable = c.status !== "VERIFIED";
          return (
            <Card key={c.naam} className="flex items-center gap-4 p-5">
              <span
                className="relative flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-[6px]"
                style={{ border: `1px solid ${C.line}` }}
                aria-hidden="true"
              >
                <svg viewBox="0 0 44 44" className="absolute inset-0 h-full w-full opacity-30">
                  <rect width="44" height="44" fill="url(#c222-hatch)" />
                </svg>
                <FileText
                  size={18}
                  strokeWidth={1.8}
                  style={{ color: C.soft }}
                  className="relative"
                />
              </span>
              <div className="min-w-0 flex-1">
                <div className="truncate text-[16px]" style={{ ...serifF, color: C.ink }}>
                  {c.naam}
                </div>
                <div className="mt-0.5 text-[12px]" style={{ ...monoF, color: C.soft }}>
                  {c.detail}
                </div>
                <div className="mt-2 flex flex-wrap items-center gap-2">
                  <StatusChip status={c.status} />
                  {actionable && (
                    <button
                      className="text-[11px] uppercase tracking-[0.06em] underline-offset-4 transition-colors hover:underline focus-visible:outline-none focus-visible:ring-2"
                      style={{
                        ...monoF,
                        color: C.accentDeep,
                        ["--tw-ring-color" as string]: C.accent,
                      }}
                    >
                      {c.status === "EXPIRING"
                        ? "Vernieuwen"
                        : c.status === "REJECTED"
                          ? "Opnieuw indienen"
                          : "Bekijken"}
                    </button>
                  )}
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      <section className="space-y-4">
        <SectionHead kicker="Veilig & privé bewaard" title="Je documenten" />
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[520px] text-left">
              <thead>
                <tr style={{ background: C.paper2, borderBottom: `1px solid ${C.line}` }}>
                  {["Document", "Type", "Grootte", "Status", "Bijgewerkt"].map((h) => (
                    <th
                      key={h}
                      className="px-5 py-3 text-[10px] uppercase tracking-[0.1em]"
                      style={{ ...monoF, color: C.faint }}
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {DOCUMENTEN.map((d, i) => (
                  <tr
                    key={d.naam}
                    style={{ borderTop: i === 0 ? undefined : `1px solid ${C.lineSoft}` }}
                  >
                    <td className="px-5 py-3.5 text-[13.5px]" style={{ ...serifF, color: C.ink }}>
                      {d.naam}
                    </td>
                    <td className="px-5 py-3.5 text-[12px]" style={{ ...monoF, color: C.soft }}>
                      {d.type}
                    </td>
                    <td
                      className="px-5 py-3.5 text-[12px] tabular-nums"
                      style={{ ...monoF, color: C.soft }}
                    >
                      {d.grootte}
                    </td>
                    <td className="px-5 py-3.5">
                      <StatusChip status={d.status} />
                    </td>
                    <td
                      className="px-5 py-3.5 text-[12px] tabular-nums"
                      style={{ ...monoF, color: C.faint }}
                    >
                      {d.bijgewerkt}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </section>
    </div>
  );
}

// ── Acties (next-action) ─────────────────────────────────────────────────────────
function Acties({ onMatches }: { onMatches: () => void }) {
  const [done, setDone] = useState<Record<string, boolean>>({});
  const sorted = [...ACTIES].sort((a, b) =>
    a.urgentie === b.urgentie ? 0 : a.urgentie === "warning" ? -1 : 1,
  );
  const openCount = sorted.filter((a) => !done[a.titel]).length;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <SectionHead kicker="Van belangrijk naar minder" title="Vandaag te doen" />
        <span
          className="inline-flex items-center gap-1.5 rounded-[3px] px-3 py-1.5 text-[11px]"
          style={
            openCount === 0
              ? { ...monoF, background: C.ink, color: C.paper }
              : {
                  ...monoF,
                  border: `1px solid ${C.accent}`,
                  background: C.accentSoft,
                  color: C.accentDeep,
                }
          }
        >
          {openCount === 0 ? (
            <>
              <Check size={12} strokeWidth={2.4} aria-hidden="true" /> Alles gedaan
            </>
          ) : (
            <>
              {openCount} open {openCount === 1 ? "punt" : "punten"}
            </>
          )}
        </span>
      </div>

      <ol className="space-y-3">
        {sorted.map((a, i) => {
          const warn = a.urgentie === "warning";
          const isDone = !!done[a.titel];
          return (
            <li key={a.titel}>
              <Card className="overflow-hidden" style={isDone ? { opacity: 0.6 } : undefined}>
                <div className="flex items-stretch">
                  <span
                    className="w-1.5 shrink-0"
                    style={{ background: warn ? C.accent : C.ink }}
                    aria-hidden="true"
                  />
                  <div className="flex min-w-0 flex-1 items-start gap-4 p-5">
                    <span
                      className="text-[28px] tabular-nums leading-none"
                      style={{ ...serifF, color: warn ? C.accentDeep : C.faint }}
                      aria-hidden="true"
                    >
                      {String(i + 1).padStart(2, "0")}
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span
                          className="inline-flex items-center gap-1 rounded-[3px] px-2 py-0.5 text-[10px] uppercase tracking-[0.08em]"
                          style={
                            warn
                              ? { ...monoF, background: C.accent, color: C.paper }
                              : { ...monoF, border: `1px solid ${C.line}`, color: C.soft }
                          }
                        >
                          {warn ? (
                            <TriangleAlert size={11} strokeWidth={2.4} aria-hidden="true" />
                          ) : (
                            <Check size={11} strokeWidth={2.4} aria-hidden="true" />
                          )}
                          {warn ? "Aandacht" : "Kans"}
                        </span>
                        <h3
                          className={`text-[18px] leading-tight ${isDone ? "line-through" : ""}`}
                          style={{ ...serifF, color: C.ink }}
                        >
                          {a.titel}
                        </h3>
                      </div>
                      <p
                        className="mt-1.5 text-[13px] leading-relaxed"
                        style={{ ...monoF, color: C.soft }}
                      >
                        {a.detail}
                      </p>
                      <div className="mt-3 flex flex-wrap items-center gap-3">
                        <button
                          onClick={a.cta === "Bekijk matches" ? onMatches : undefined}
                          className="inline-flex items-center gap-2 rounded-[4px] px-4 py-2 text-[12px] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
                          style={
                            warn
                              ? {
                                  ...monoF,
                                  background: C.ink,
                                  color: C.paper,
                                  ["--tw-ring-color" as string]: C.accent,
                                  ["--tw-ring-offset-color" as string]: C.paper,
                                }
                              : {
                                  ...monoF,
                                  border: `1px solid ${C.ink}`,
                                  color: C.ink,
                                  ["--tw-ring-color" as string]: C.accent,
                                  ["--tw-ring-offset-color" as string]: C.paper,
                                }
                          }
                        >
                          {a.cta} <ArrowRight size={13} aria-hidden="true" />
                        </button>
                        <button
                          onClick={() => setDone((d) => ({ ...d, [a.titel]: !d[a.titel] }))}
                          className="inline-flex items-center gap-1.5 text-[12px] uppercase tracking-[0.06em] underline-offset-4 transition-colors hover:underline focus-visible:outline-none focus-visible:ring-2"
                          style={{
                            ...monoF,
                            color: C.faint,
                            ["--tw-ring-color" as string]: C.accent,
                          }}
                        >
                          <Check size={13} strokeWidth={2.4} aria-hidden="true" />
                          {isDone ? "Ongedaan maken" : "Markeer klaar"}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </Card>
            </li>
          );
        })}
      </ol>

      {openCount === 0 && (
        <Card className="flex flex-col items-center gap-2 px-6 py-12 text-center">
          <Check size={28} strokeWidth={2} style={{ color: C.ink }} aria-hidden="true" />
          <p className="text-[22px]" style={{ ...serifF, color: C.ink }}>
            Alles afgerond
          </p>
          <p className="max-w-xs text-[13px] leading-relaxed" style={{ ...monoF, color: C.soft }}>
            Je hebt elk punt afgehandeld. We laten het weten zodra er iets nieuws binnenkomt.
          </p>
        </Card>
      )}
    </div>
  );
}

// ── Facturen ─────────────────────────────────────────────────────────────────────
function Facturen() {
  const factMeta = (
    status: string,
  ): { label: string; Icon: LucideIcon; kind: "solid" | "line" | "alarm" } => {
    if (status === "Betaald") return { label: "Betaald", Icon: Check, kind: "solid" };
    if (status === "Openstaand") return { label: "Openstaand", Icon: Clock, kind: "alarm" };
    return { label: "Concept", Icon: FileText, kind: "line" };
  };
  const betaald = "€ 8.622";
  const open = FACTUREN.filter((f) => f.status === "Openstaand").length;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <SectionHead kicker="Omzet & openstaand" title="Facturen" />
        <button
          className="inline-flex items-center gap-2 rounded-[4px] px-4 py-2.5 text-[12px] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
          style={{
            ...monoF,
            background: C.ink,
            color: C.paper,
            ["--tw-ring-color" as string]: C.accent,
            ["--tw-ring-offset-color" as string]: C.paper,
          }}
        >
          <Plus size={14} aria-hidden="true" /> Nieuwe factuur
        </button>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {[
          { l: "Betaald deze maand", v: betaald, accent: false },
          { l: "Openstaand", v: `${open}`, accent: true },
          { l: "Nog te factureren", v: "€ 1.350", accent: false },
        ].map((s) => (
          <Card key={s.l} className="p-5">
            <div className="text-[10px] uppercase tracking-[0.12em]" style={{ color: C.faint }}>
              {s.l}
            </div>
            <div
              className="mt-2 text-[30px] tabular-nums leading-none"
              style={{ ...serifF, color: s.accent ? C.accentDeep : C.ink }}
            >
              {s.v}
            </div>
          </Card>
        ))}
      </div>

      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[560px] text-left">
            <thead>
              <tr style={{ background: C.paper2, borderBottom: `1px solid ${C.line}` }}>
                {["Nummer", "Klant", "Datum", "Status", "Bedrag"].map((h, i) => (
                  <th
                    key={h}
                    className={`px-5 py-3 text-[10px] uppercase tracking-[0.1em] ${i === 4 ? "text-right" : ""}`}
                    style={{ ...monoF, color: C.faint }}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {FACTUREN.map((f, i) => {
                const m = factMeta(f.status);
                const style: React.CSSProperties =
                  m.kind === "solid"
                    ? { background: C.ink, color: C.paper, border: `1px solid ${C.ink}` }
                    : m.kind === "alarm"
                      ? {
                          background: C.accentSoft,
                          color: C.accentDeep,
                          border: `1px solid ${C.accent}`,
                        }
                      : { background: C.paper, color: C.soft, border: `1px solid ${C.line}` };
                return (
                  <tr
                    key={f.nr}
                    style={{ borderTop: i === 0 ? undefined : `1px solid ${C.lineSoft}` }}
                  >
                    <td
                      className="px-5 py-4 text-[14px] tabular-nums"
                      style={{ ...serifF, color: C.ink }}
                    >
                      {f.nr}
                    </td>
                    <td className="px-5 py-4 text-[13px]" style={{ ...monoF, color: C.soft }}>
                      {f.klant}
                    </td>
                    <td
                      className="px-5 py-4 text-[12px] tabular-nums"
                      style={{ ...monoF, color: C.faint }}
                    >
                      {f.datum}
                    </td>
                    <td className="px-5 py-4">
                      <span
                        className="inline-flex items-center gap-1.5 rounded-[3px] px-2.5 py-1 text-[11px]"
                        style={{ ...monoF, ...style }}
                      >
                        <m.Icon size={12} strokeWidth={2} aria-hidden="true" /> {m.label}
                      </span>
                    </td>
                    <td
                      className="px-5 py-4 text-right text-[16px] tabular-nums"
                      style={{ ...serifF, color: C.ink }}
                    >
                      {f.bedrag}
                    </td>
                  </tr>
                );
              })}
            </tbody>
            <tfoot>
              <tr style={{ borderTop: `1.5px solid ${C.ink}` }}>
                <td
                  colSpan={4}
                  className="px-5 py-4 text-[11px] uppercase tracking-[0.1em]"
                  style={{ ...monoF, color: C.soft }}
                >
                  Totaal betaald deze maand
                </td>
                <td
                  className="px-5 py-4 text-right text-[18px] tabular-nums"
                  style={{ ...serifF, color: C.ink }}
                >
                  {betaald}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </Card>
    </div>
  );
}
