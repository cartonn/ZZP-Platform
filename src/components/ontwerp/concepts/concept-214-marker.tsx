"use client";

// Concept 214 — "Marker" · highlighter-annotatie, redactioneel. 2026-trend: annotation-UI, human/warm
// redactioneel, highlighter-as-emphasis. Off-white papier met fluor-markeerstift-accenten: belangrijke
// woorden/cijfers krijgen een schuine highlighter-veeg (skewed rounded marker-achtergrond achter de tekst),
// handgeschreven-aandoende onderstreping bij actieve tabs, marginale notities. Editorial en menselijk maar
// strak. Marker-veeg via een <mark>-achtige span met inline background + lichte rotatie/border-radius —
// NOOIT via images. Fonts: Newsreader (serif) + JetBrains Mono. UI Nederlands. Deterministisch (geen random/Date).

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
  Star,
  FileText,
  TriangleAlert,
  ChevronRight,
  RefreshCw,
  BadgeCheck,
  PenLine,
  Highlighter,
  Quote,
  MessageSquare,
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

// ── Palet — off-white papier, inkt-antraciet, twee fluor-markeerstiften + accent-inkt. ──
const C = {
  bg: "#fbfaf6", // off-white papier
  bgAlt: "#f4f2ea", // dieper papiervlak
  panel: "#ffffff", // schoon vel
  panelSoft: "#f7f5ee", // zacht vel
  ink: "#1c1a17", // hoofdinkt
  inkSoft: "#514c44", // secundair
  inkFaint: "#8c8579", // labels / marginalia
  line: "#e6e2d6", // fijne liniaal
  lineStrong: "#d3cdbd", // sterkere rand
  yellow: "#fff07a", // marker-geel
  yellowDeep: "#e9d64a",
  pink: "#ffc4de", // marker-roze
  pinkDeep: "#f2a6c9",
  accent: "#c2410c", // accent-inkt (roodbruin)
  accentSoft: "#e2673a",
  // status — leesbaar op papier, altijd label + icoon
  ok: "#2f7d45",
  okBg: "#e3efe4",
  wait: "#1f5c99",
  waitBg: "#e0eaf3",
  warn: "#9a6a00",
  warnBg: "#f7ecce",
  bad: "#b23325",
  badBg: "#f6e2dd",
};

const serifF = { fontFamily: "var(--font-lab-newsreader)" }; // redactionele serif
const monoF = { fontFamily: "var(--font-lab-mono)" }; // JetBrains Mono — cijfers/labels

// Highlighter-veeg — een <mark>-achtige span met fluor-achtergrond, lichte rotatie en ronde hoeken,
// alsof met de hand over de tekst gehaald. Puur inline background; geen images.
function Mark({
  children,
  color = "yellow",
  className = "",
  style,
}: {
  children: React.ReactNode;
  color?: "yellow" | "pink";
  className?: string;
  style?: React.CSSProperties;
}) {
  const c = color === "pink" ? C.pink : C.yellow;
  const edge = color === "pink" ? C.pinkDeep : C.yellowDeep;
  return (
    <mark
      className={`relative inline-block bg-transparent ${className}`}
      style={{ color: "inherit", ...style }}
    >
      {/* de veeg zelf — iets breder dan de tekst, licht scheef, onregelmatige radius */}
      <span
        className="pointer-events-none absolute z-0"
        style={{
          inset: "8% -0.28em 12% -0.28em",
          background: `linear-gradient(101deg, ${c} 0%, ${c} 70%, ${edge} 100%)`,
          borderRadius: "40% 55% 46% 52% / 62% 44% 58% 40%",
          transform: "rotate(-1.1deg)",
          opacity: 0.85,
        }}
        aria-hidden="true"
      />
      <span className="relative z-10">{children}</span>
    </mark>
  );
}

// Handgeschreven-aandoende onderstreping — een golvende accent-inkt-streep onder actieve labels.
function Underline({ color = C.accent }: { color?: string }) {
  return (
    <span
      className="pointer-events-none absolute -bottom-1 left-0 h-[6px] w-full"
      style={{
        background: `radial-gradient(ellipse 50% 120% at 50% 0%, ${color} 40%, transparent 42%)`,
        backgroundSize: "10px 6px",
        backgroundRepeat: "repeat-x",
        opacity: 0.9,
      }}
      aria-hidden="true"
    />
  );
}

// ── Status-model — vorm + icoon + label; nooit kleur alleen. ──
type StatusStyle = { label: string; Icon: LucideIcon; fg: string; bg: string };
function credMeta(s: CredStatus): StatusStyle {
  switch (s) {
    case "VERIFIED":
      return { label: "Geverifieerd", Icon: BadgeCheck, fg: C.ok, bg: C.okBg };
    case "SUBMITTED":
      return { label: "In beoordeling", Icon: Clock, fg: C.wait, bg: C.waitBg };
    case "EXPIRING":
      return { label: "Verloopt binnenkort", Icon: TriangleAlert, fg: C.warn, bg: C.warnBg };
    case "REJECTED":
      return { label: "Afgewezen", Icon: XCircle, fg: C.bad, bg: C.badBg };
  }
}

function StatusTag({ status }: { status: CredStatus }) {
  const m = credMeta(status);
  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-medium"
      style={{ ...monoF, background: m.bg, color: m.fg, boxShadow: `inset 0 0 0 1px ${m.fg}33` }}
    >
      <m.Icon size={12} strokeWidth={2.2} aria-hidden="true" />
      {m.label}
    </span>
  );
}

// Marginale notitie — schuin, in accent-inkt, met een klein pen-icoon. Editorial marginalia.
function Margin({ children }: { children: React.ReactNode }) {
  return (
    <p
      className="flex items-start gap-1.5 text-[12.5px] italic leading-snug"
      style={{ ...serifF, color: C.accent }}
    >
      <PenLine size={13} strokeWidth={1.8} className="mt-0.5 shrink-0" aria-hidden="true" />
      <span>{children}</span>
    </p>
  );
}

// Vel — schoon papierpaneel met fijne liniaalrand en zachte schaduw.
function Sheet({
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
      className={`rounded-[10px] ${className}`}
      style={{
        background: C.panel,
        boxShadow: `inset 0 0 0 1px ${C.line}, 0 1px 2px ${C.ink}0d`,
        ...style,
      }}
    >
      {children}
    </div>
  );
}

// Sectie-kop — redactioneel: kicker in mono, titel in serif met highlighter-accent.
function SectionHead({
  kicker,
  title,
  Icon,
  markColor = "yellow",
}: {
  kicker: string;
  title: React.ReactNode;
  Icon: LucideIcon;
  markColor?: "yellow" | "pink";
}) {
  return (
    <div className="flex items-center gap-3">
      <span
        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[8px]"
        style={{ background: C.bgAlt, boxShadow: `inset 0 0 0 1px ${C.line}` }}
        aria-hidden="true"
      >
        <Icon size={17} strokeWidth={1.9} style={{ color: C.accent }} />
      </span>
      <div className="min-w-0">
        <div
          className="text-[10px] font-medium uppercase tracking-[0.22em]"
          style={{ ...monoF, color: C.inkFaint }}
        >
          {kicker}
        </div>
        <h2 className="text-[19px] font-semibold leading-tight" style={{ ...serifF, color: C.ink }}>
          <Mark color={markColor}>{title}</Mark>
        </h2>
      </div>
    </div>
  );
}

function Meta({ Icon, value }: { Icon: LucideIcon; value: string }) {
  return (
    <div className="flex items-center gap-1.5" style={{ color: C.inkSoft }}>
      <Icon size={13} strokeWidth={1.9} style={{ color: C.accentSoft }} aria-hidden="true" />
      <span className="truncate" style={serifF}>
        {value}
      </span>
    </div>
  );
}

// ── Root ─────────────────────────────────────────────────────────────────────────
export function Concept214() {
  const [screen, setScreen] = useState<ScreenKey>("dashboard");
  const active = OPDRACHTEN[0] as Opdracht;

  return (
    <div
      className="relative min-h-screen w-full overflow-x-hidden antialiased"
      style={{ ...serifF, background: C.bg, color: C.ink }}
    >
      {/* papiertextuur: zeer subtiele horizontale liniaallijnen */}
      <div
        className="pointer-events-none fixed inset-0 z-0"
        style={{
          backgroundImage: `repeating-linear-gradient(0deg, transparent 0 31px, ${C.lineStrong}1f 31px 32px)`,
          opacity: 0.5,
        }}
        aria-hidden="true"
      />

      <div className="relative z-10">
        {/* Kop — redactionele masthead */}
        <header
          className="relative"
          style={{ background: C.bg, borderBottom: `1px solid ${C.line}` }}
        >
          <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-4 py-5 md:px-8">
            <div className="flex items-center gap-3.5">
              <span
                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[10px]"
                style={{ background: C.ink }}
                aria-hidden="true"
              >
                <Highlighter size={20} strokeWidth={1.9} style={{ color: C.yellow }} />
              </span>
              <div className="leading-tight">
                <div
                  className="text-[10px] font-medium uppercase tracking-[0.34em]"
                  style={{ ...monoF, color: C.accent }}
                >
                  Redactie
                </div>
                <div className="text-[24px] font-semibold leading-none" style={serifF}>
                  <Mark>Marker</Mark>
                </div>
                <div
                  className="mt-1 text-[10px] uppercase tracking-[0.14em]"
                  style={{ ...monoF, color: C.inkFaint }}
                >
                  Opdrachten · Verificatie · Facturen
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2.5">
              <span
                className="hidden items-center gap-1.5 rounded-full px-3 py-1.5 text-[11px] font-medium sm:inline-flex"
                style={{
                  ...monoF,
                  background: C.okBg,
                  color: C.ok,
                  boxShadow: `inset 0 0 0 1px ${C.ok}33`,
                }}
              >
                <ShieldCheck size={12} strokeWidth={2} aria-hidden="true" /> {PROFIEL.trust}
              </span>
              <span
                className="flex h-10 w-10 items-center justify-center rounded-full text-[12px] font-semibold"
                style={{ ...monoF, background: C.ink, color: C.yellow }}
                aria-hidden="true"
              >
                {PROFIEL.initialen}
              </span>
            </div>
          </div>

          {/* Scherm-switcher — actief tab met handgeschreven onderstreping */}
          <nav
            className="relative mx-auto flex max-w-6xl items-center gap-1 overflow-x-auto px-4 pb-3 md:px-8"
            aria-label="Schermen"
          >
            {SCREENS.map((s) => {
              const on = s.key === screen;
              return (
                <button
                  key={s.key}
                  onClick={() => setScreen(s.key)}
                  aria-current={on ? "page" : undefined}
                  className="relative shrink-0 rounded-[8px] px-3.5 py-1.5 text-[13.5px] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
                  style={{
                    ...serifF,
                    color: on ? C.ink : C.inkSoft,
                    fontWeight: on ? 600 : 500,
                    ["--tw-ring-color" as string]: C.accent,
                    ["--tw-ring-offset-color" as string]: C.bg,
                  }}
                >
                  {s.label}
                  {on && <Underline />}
                </button>
              );
            })}
          </nav>
        </header>

        <main className="mx-auto max-w-6xl px-4 py-6 md:px-8 md:py-8">
          {screen === "dashboard" && (
            <Dashboard onOpen={() => setScreen("opdracht")} onActies={() => setScreen("acties")} />
          )}
          {screen === "marktplaats" && <Marktplaats onOpen={() => setScreen("opdracht")} />}
          {screen === "opdracht" && (
            <OpdrachtDetail opdracht={active} onBack={() => setScreen("marktplaats")} />
          )}
          {screen === "verificatie" && <Verificatie />}
          {screen === "acties" && <Acties />}
          {screen === "facturen" && <Facturen />}
        </main>

        <footer className="relative mx-auto max-w-6xl px-4 pb-12 md:px-8">
          <div
            className="flex items-center justify-center gap-2 border-t pt-6 text-[12.5px] italic"
            style={{ ...serifF, borderColor: C.line, color: C.inkFaint }}
          >
            <PenLine size={13} aria-hidden="true" /> Gemarkeerd met de hand — wat telt krijgt een
            veeg, elke status draagt een label en een icoon.
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
      {/* Hero — redactionele opening */}
      <Sheet className="relative overflow-hidden">
        <div className="relative grid gap-6 p-6 sm:p-9 md:grid-cols-[1.5fr_1fr] md:items-center">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span
                className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-medium"
                style={{
                  ...monoF,
                  background: C.bgAlt,
                  color: C.inkSoft,
                  boxShadow: `inset 0 0 0 1px ${C.line}`,
                }}
              >
                <Star size={12} strokeWidth={2} style={{ color: C.accent }} aria-hidden="true" />{" "}
                {PROFIEL.rol}
              </span>
              <span className="text-[12px] italic" style={{ ...serifF, color: C.inkFaint }}>
                {PROFIEL.plaats}
              </span>
            </div>
            <h1
              className="mt-5 text-[32px] font-semibold leading-[1.08] sm:text-[42px]"
              style={{ ...serifF, color: C.ink }}
            >
              Drie sterke <Mark>matches</Mark> liggen klaar om te lezen.
            </h1>
            <p className="mt-4 max-w-lg text-[15px] leading-relaxed" style={{ color: C.inkSoft }}>
              Eén regel is <Mark color="pink">roze gemarkeerd</Mark>: je VOG verloopt binnenkort.
              Verwerk de aantekening en houd je profiel onberispelijk.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <button
                onClick={onOpen}
                className="inline-flex items-center gap-2 rounded-[9px] px-5 py-2.5 text-[13.5px] font-semibold transition-transform hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
                style={{
                  ...serifF,
                  background: C.ink,
                  color: C.bg,
                  ["--tw-ring-color" as string]: C.accent,
                  ["--tw-ring-offset-color" as string]: C.panel,
                }}
              >
                Bekijk matches <ArrowRight size={15} aria-hidden="true" />
              </button>
              <button
                onClick={onActies}
                className="inline-flex items-center gap-2 rounded-[9px] px-5 py-2.5 text-[13.5px] font-semibold transition-colors hover:bg-black/[0.03] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
                style={{
                  ...serifF,
                  background: C.panel,
                  color: C.ink,
                  boxShadow: `inset 0 0 0 1px ${C.lineStrong}`,
                  ["--tw-ring-color" as string]: C.accent,
                  ["--tw-ring-offset-color" as string]: C.panel,
                }}
              >
                <TriangleAlert
                  size={14}
                  strokeWidth={2}
                  style={{ color: C.warn }}
                  aria-hidden="true"
                />{" "}
                Los aantekening op
              </button>
            </div>
          </div>
          {/* Marginale kolom met notitie + trust-cijfer */}
          <div
            className="rounded-[10px] p-5"
            style={{ background: C.panelSoft, boxShadow: `inset 0 0 0 1px ${C.line}` }}
          >
            <Quote size={20} strokeWidth={1.6} style={{ color: C.accentSoft }} aria-hidden="true" />
            <p className="mt-2 text-[15px] leading-relaxed" style={{ ...serifF, color: C.ink }}>
              &ldquo;Opdrachtgevers zien alleen <Mark>geverifieerde</Mark> documenten.&rdquo;
            </p>
            <div className="mt-4 flex items-end gap-3">
              <span
                className="text-[40px] font-semibold leading-none"
                style={{ ...monoF, color: C.accent }}
              >
                {dek}%
              </span>
              <div className="pb-1">
                <div className="text-[12px] font-medium" style={{ ...monoF, color: C.inkSoft }}>
                  dekking
                </div>
                <div className="text-[12px]" style={{ color: C.inkFaint }}>
                  {verified}/{CREDENTIALS.length} geverifieerd
                </div>
              </div>
            </div>
          </div>
        </div>
      </Sheet>

      {/* KPI-strook */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {KPIS.map((k, i) => (
          <Sheet key={k.label} className="p-4">
            <div className="flex items-center justify-between gap-2">
              <span
                className="text-[11px] font-medium uppercase tracking-[0.1em]"
                style={{ ...monoF, color: C.inkFaint }}
              >
                {k.label}
              </span>
              <span
                className="inline-flex items-center gap-0.5 rounded-full px-1.5 py-0.5 text-[10px] font-medium"
                style={{
                  ...monoF,
                  background: k.up ? C.okBg : C.bgAlt,
                  color: k.up ? C.ok : C.inkSoft,
                }}
              >
                {k.trend}
              </span>
            </div>
            <div
              className="mt-3 text-[26px] font-semibold leading-none"
              style={{ ...serifF, color: C.ink }}
            >
              {i === 0 ? <Mark>{k.value}</Mark> : k.value}
            </div>
            <Spark data={k.spark} accent={i === 0} />
          </Sheet>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-[1.6fr_1fr]">
        {/* Aanbevolen opdrachten */}
        <section className="space-y-4">
          <SectionHead kicker="Leeslijst" title="Aanbevolen opdrachten" Icon={FileText} />
          <div className="space-y-3">
            {OPDRACHTEN.map((o) => (
              <Sheet key={o.id}>
                <button
                  onClick={onOpen}
                  className="flex w-full items-center gap-4 rounded-[10px] p-4 text-left transition-colors hover:bg-black/[0.02] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset"
                  style={{ ["--tw-ring-color" as string]: C.accent }}
                >
                  <MatchSeal value={o.match} />
                  <div className="min-w-0 flex-1">
                    <div
                      className="truncate text-[16px] font-semibold"
                      style={{ ...serifF, color: C.ink }}
                    >
                      {o.titel}
                    </div>
                    <div className="mt-0.5 truncate text-[13px]" style={{ color: C.inkSoft }}>
                      {o.opdrachtgever} · {o.plaats} · {o.tarief}
                    </div>
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {o.redenen.plus.slice(0, 2).map((r) => (
                        <span
                          key={r}
                          className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11.5px]"
                          style={{ ...serifF, background: C.bgAlt, color: C.inkSoft }}
                        >
                          <Check
                            size={11}
                            strokeWidth={2.6}
                            style={{ color: C.ok }}
                            aria-hidden="true"
                          />{" "}
                          {r}
                        </span>
                      ))}
                    </div>
                  </div>
                  <ChevronRight
                    size={18}
                    className="shrink-0"
                    style={{ color: C.inkFaint }}
                    aria-hidden="true"
                  />
                </button>
              </Sheet>
            ))}
          </div>
        </section>

        {/* Rechterkolom — prioriteit + trust */}
        <section className="space-y-4">
          <SectionHead
            kicker="Aantekening"
            title="Wat vraagt actie?"
            Icon={PenLine}
            markColor="pink"
          />
          <Sheet className="relative overflow-hidden p-5">
            <span
              className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-medium"
              style={{
                ...monoF,
                background: C.warnBg,
                color: C.warn,
                boxShadow: `inset 0 0 0 1px ${C.warn}33`,
              }}
            >
              <TriangleAlert size={12} strokeWidth={2.2} aria-hidden="true" /> Urgent
            </span>
            <h3
              className="mt-3 text-[19px] font-semibold leading-tight"
              style={{ ...serifF, color: C.ink }}
            >
              <Mark color="pink">{warn.titel}</Mark>
            </h3>
            <p className="mt-2 text-[13.5px] leading-relaxed" style={{ color: C.inkSoft }}>
              {warn.detail}
            </p>
            <button
              onClick={onActies}
              className="mt-4 inline-flex items-center gap-2 rounded-[9px] px-4 py-2 text-[12.5px] font-semibold transition-transform hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
              style={{
                ...serifF,
                background: C.accent,
                color: "#fff",
                ["--tw-ring-color" as string]: C.accent,
                ["--tw-ring-offset-color" as string]: C.panel,
              }}
            >
              {warn.cta} <ArrowRight size={13} aria-hidden="true" />
            </button>
          </Sheet>

          <Sheet className="p-5">
            <div className="flex items-center gap-3">
              <span
                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full"
                style={{ background: C.okBg }}
                aria-hidden="true"
              >
                <BadgeCheck size={22} strokeWidth={1.9} style={{ color: C.ok }} />
              </span>
              <div>
                <StatusTag status="VERIFIED" />
                <p className="mt-2 text-[13px]" style={{ color: C.inkSoft }}>
                  {verified}/{CREDENTIALS.length} certificaten geverifieerd — je profiel staat als{" "}
                  <Mark>betrouwbaar</Mark> gemarkeerd.
                </p>
              </div>
            </div>
          </Sheet>

          <Margin>
            Tip: reageer binnen zes uur — dat is de gemiddelde reactietijd van opdrachtgevers.
          </Margin>
        </section>
      </div>
    </div>
  );
}

// Match-zegel — rond, redactioneel, cijfer in mono met highlighter-ring.
function MatchSeal({ value }: { value: number }) {
  return (
    <span
      className="flex h-14 w-14 shrink-0 flex-col items-center justify-center rounded-full"
      style={{ background: C.yellow, boxShadow: `inset 0 0 0 1.5px ${C.yellowDeep}` }}
      aria-hidden="true"
    >
      <span className="text-[18px] font-semibold leading-none" style={{ ...monoF, color: C.ink }}>
        {value}
      </span>
      <span
        className="text-[8px] font-medium uppercase tracking-[0.1em]"
        style={{ ...monoF, color: C.inkSoft }}
      >
        match
      </span>
    </span>
  );
}

// Deterministische sparkline — SVG-polyline afgeleid uit mock-spark, geen animatie/random.
function Spark({ data, accent = false }: { data: number[]; accent?: boolean }) {
  const min = Math.min(...data);
  const max = Math.max(...data);
  const span = max - min || 1;
  const w = 100;
  const h = 22;
  const pts = data
    .map((d, i) => {
      const x = (i / (data.length - 1)) * w;
      const y = h - ((d - min) / span) * h;
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(" ");
  return (
    <svg
      viewBox={`0 0 ${w} ${h}`}
      className="mt-3 h-6 w-full"
      preserveAspectRatio="none"
      aria-hidden="true"
    >
      <polyline
        points={pts}
        fill="none"
        stroke={accent ? C.accent : C.lineStrong}
        strokeWidth={accent ? 2 : 1.6}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

// ── Marktplaats — zoek, skeleton, empty + foutstate ─────────────
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
      <div className="flex flex-wrap items-center justify-between gap-3">
        <SectionHead kicker="Marktplaats" title="Open opdrachten" Icon={Search} />
        <div className="flex items-center gap-2">
          <div
            className="flex items-center gap-2 rounded-[9px] px-3.5 py-2"
            style={{ background: C.panel, boxShadow: `inset 0 0 0 1px ${C.lineStrong}` }}
          >
            <Search size={15} style={{ color: C.accentSoft }} aria-hidden="true" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Zoek opdracht of plaats…"
              aria-label="Opdrachten zoeken"
              className="w-40 bg-transparent text-[13px] outline-none placeholder:opacity-50"
              style={{ ...serifF, color: C.ink }}
            />
          </div>
          <button
            onClick={refresh}
            aria-label="Opnieuw laden"
            className="flex h-10 w-10 items-center justify-center rounded-[9px] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
            style={{
              background: C.panel,
              boxShadow: `inset 0 0 0 1px ${C.lineStrong}`,
              ["--tw-ring-color" as string]: C.accent,
              ["--tw-ring-offset-color" as string]: C.bg,
            }}
          >
            <RefreshCw
              size={15}
              className={loading ? "animate-spin" : ""}
              style={{ color: C.accentSoft }}
              aria-hidden="true"
            />
          </button>
        </div>
      </div>

      {error && (
        <div
          className="flex items-start gap-3 rounded-[10px] p-4"
          role="alert"
          style={{ background: C.badBg, boxShadow: `inset 0 0 0 1px ${C.bad}44` }}
        >
          <XCircle size={18} strokeWidth={2} style={{ color: C.bad }} aria-hidden="true" />
          <div className="min-w-0 flex-1">
            <div className="text-[14px] font-semibold" style={{ ...serifF, color: C.ink }}>
              Niet alle opdrachten geladen
            </div>
            <p className="mt-0.5 text-[12.5px]" style={{ color: C.inkSoft }}>
              Een deel van de lijst ontbreekt. Laad opnieuw om het volledige aanbod te zien.
            </p>
          </div>
          <button
            onClick={() => setError(false)}
            className="shrink-0 rounded-full px-2.5 py-1 text-[11px] font-medium focus-visible:outline-none focus-visible:ring-2"
            style={{ ...monoF, color: C.bad, ["--tw-ring-color" as string]: C.bad }}
          >
            Sluiten
          </button>
        </div>
      )}

      {loading ? (
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
          {[0, 1, 2].map((i) => (
            <Sheet key={i} className="p-4">
              <div className="flex items-center gap-3">
                <span
                  className="h-14 w-14 shrink-0 animate-pulse rounded-full"
                  style={{ background: C.bgAlt }}
                />
                <div className="flex-1 space-y-2">
                  <span
                    className="block h-4 w-3/4 animate-pulse rounded"
                    style={{ background: C.bgAlt }}
                  />
                  <span
                    className="block h-3 w-1/2 animate-pulse rounded"
                    style={{ background: C.line }}
                  />
                </div>
              </div>
              <div className="mt-4 space-y-2">
                <span
                  className="block h-3 w-full animate-pulse rounded"
                  style={{ background: C.line }}
                />
                <span
                  className="block h-3 w-5/6 animate-pulse rounded"
                  style={{ background: C.line }}
                />
              </div>
            </Sheet>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <Sheet className="flex flex-col items-center justify-center gap-3 p-16 text-center">
          <span
            className="flex h-16 w-16 items-center justify-center rounded-full"
            style={{ background: C.yellow, boxShadow: `inset 0 0 0 1.5px ${C.yellowDeep}` }}
            aria-hidden="true"
          >
            <Search size={28} strokeWidth={1.8} style={{ color: C.ink }} />
          </span>
          <p className="text-[20px] font-semibold" style={{ ...serifF, color: C.ink }}>
            Niets gemarkeerd
          </p>
          <p className="max-w-xs text-[13.5px]" style={{ color: C.inkSoft }}>
            Geen opdracht gevonden voor &ldquo;{q}&rdquo;. Pas je zoekterm aan.
          </p>
          <button
            onClick={() => setQ("")}
            className="mt-1 rounded-[9px] px-4 py-2 text-[12.5px] font-semibold transition-transform hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
            style={{
              ...serifF,
              background: C.ink,
              color: C.bg,
              ["--tw-ring-color" as string]: C.accent,
              ["--tw-ring-offset-color" as string]: C.bg,
            }}
          >
            Zoekterm wissen
          </button>
        </Sheet>
      ) : (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
          {filtered.map((o, idx) => (
            <Sheet key={o.id} className="flex flex-col overflow-hidden">
              <div
                className="flex items-center justify-between gap-3 px-4 py-3"
                style={{ borderBottom: `1px solid ${C.line}` }}
              >
                <span
                  className="text-[11px] font-medium tracking-[0.06em]"
                  style={{ ...monoF, color: C.inkFaint }}
                >
                  {o.id}
                </span>
                <span
                  className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold"
                  style={{ ...monoF, background: idx === 0 ? C.yellow : C.bgAlt, color: C.ink }}
                >
                  {o.match} match
                </span>
              </div>
              <div className="p-4">
                <h3
                  className="text-[17px] font-semibold leading-tight"
                  style={{ ...serifF, color: C.ink }}
                >
                  {idx === 0 ? <Mark>{o.titel}</Mark> : o.titel}
                </h3>
                <p className="mt-0.5 text-[13px]" style={{ color: C.inkSoft }}>
                  {o.opdrachtgever}
                </p>
                <dl className="mt-3 grid grid-cols-2 gap-y-2 text-[12.5px]">
                  <Meta Icon={MapPin} value={o.plaats} />
                  <Meta Icon={Coins} value={o.tarief} />
                  <Meta Icon={Clock} value={o.uren} />
                  <Meta Icon={CalendarDays} value={o.start} />
                </dl>
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {o.tags.map((t) => (
                    <span
                      key={t}
                      className="rounded-full px-2 py-0.5 text-[11px]"
                      style={{ ...serifF, background: C.bgAlt, color: C.inkSoft }}
                    >
                      {t}
                    </span>
                  ))}
                </div>
              </div>
              <button
                onClick={onOpen}
                className="mt-auto flex items-center justify-center gap-2 py-3 text-[12.5px] font-semibold transition-colors hover:bg-black/[0.02] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset"
                style={{
                  ...serifF,
                  borderTop: `1px solid ${C.line}`,
                  color: C.accent,
                  ["--tw-ring-color" as string]: C.accent,
                }}
              >
                Lees opdracht <ArrowRight size={14} aria-hidden="true" />
              </button>
            </Sheet>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Opdracht-detail ──────────────────────────────────────────────────────────────
function OpdrachtDetail({ opdracht, onBack }: { opdracht: Opdracht; onBack: () => void }) {
  const feiten: { l: string; v: string; Icon: LucideIcon }[] = [
    { l: "Tarief", v: opdracht.tarief, Icon: Coins },
    { l: "Omvang", v: opdracht.uren, Icon: Clock },
    { l: "Start", v: opdracht.start, Icon: CalendarDays },
    { l: "Plaats", v: opdracht.plaats, Icon: MapPin },
  ];
  return (
    <div className="space-y-6">
      <button
        onClick={onBack}
        className="inline-flex items-center gap-1.5 rounded-[9px] px-3.5 py-1.5 text-[12.5px] font-semibold transition-colors hover:bg-black/[0.03] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
        style={{
          ...serifF,
          background: C.panel,
          color: C.ink,
          boxShadow: `inset 0 0 0 1px ${C.lineStrong}`,
          ["--tw-ring-color" as string]: C.accent,
          ["--tw-ring-offset-color" as string]: C.bg,
        }}
      >
        <ArrowLeft size={14} aria-hidden="true" /> Terug naar marktplaats
      </button>

      <Sheet className="relative overflow-hidden">
        <div className="relative flex flex-wrap items-center justify-between gap-5 p-6 sm:p-8">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <span
                className="inline-block rounded-full px-2.5 py-1 text-[11px] font-medium tracking-[0.04em]"
                style={{ ...monoF, background: C.bgAlt, color: C.inkSoft }}
              >
                {opdracht.id}
              </span>
              <span className="text-[12px] italic" style={{ ...serifF, color: C.inkFaint }}>
                start {opdracht.start}
              </span>
            </div>
            <h1
              className="mt-3 max-w-2xl text-[26px] font-semibold leading-[1.12] sm:text-[34px]"
              style={{ ...serifF, color: C.ink }}
            >
              <Mark>{opdracht.titel}</Mark>
            </h1>
            <p className="mt-2 text-[14px]" style={{ color: C.inkSoft }}>
              {opdracht.opdrachtgever} · {opdracht.plaats}
            </p>
          </div>
          <span
            className="flex h-24 w-24 shrink-0 flex-col items-center justify-center rounded-full"
            style={{ background: C.yellow, boxShadow: `inset 0 0 0 2px ${C.yellowDeep}` }}
            aria-hidden="true"
          >
            <span
              className="text-[34px] font-semibold leading-none"
              style={{ ...monoF, color: C.ink }}
            >
              {opdracht.match}
            </span>
            <span
              className="text-[9px] font-medium uppercase tracking-[0.12em]"
              style={{ ...monoF, color: C.inkSoft }}
            >
              match %
            </span>
          </span>
        </div>
      </Sheet>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {feiten.map((f) => (
          <Sheet key={f.l} className="p-4">
            <span
              className="flex h-8 w-8 items-center justify-center rounded-[8px]"
              style={{ background: C.bgAlt }}
              aria-hidden="true"
            >
              <f.Icon size={15} strokeWidth={2} style={{ color: C.accent }} />
            </span>
            <div className="mt-3 text-[16px] font-semibold" style={{ ...serifF, color: C.ink }}>
              {f.v}
            </div>
            <div
              className="mt-0.5 text-[10px] font-medium uppercase tracking-[0.1em]"
              style={{ ...monoF, color: C.inkFaint }}
            >
              {f.l}
            </div>
          </Sheet>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
        <section className="space-y-3">
          <SectionHead kicker="Onderstreept" title="Waarom dit past" Icon={Check} />
          <Sheet className="p-5">
            <ul className="space-y-3">
              {opdracht.redenen.plus.map((r) => (
                <li
                  key={r}
                  className="flex items-start gap-2.5 text-[14px] leading-snug"
                  style={{ color: C.ink }}
                >
                  <span
                    className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full"
                    style={{ background: C.okBg }}
                    aria-hidden="true"
                  >
                    <Check size={12} strokeWidth={2.6} style={{ color: C.ok }} />
                  </span>
                  {r}
                </li>
              ))}
            </ul>
          </Sheet>
        </section>
        <section className="space-y-3">
          <SectionHead
            kicker="Kanttekening"
            title="Om te overwegen"
            Icon={TriangleAlert}
            markColor="pink"
          />
          <Sheet className="p-5">
            <ul className="space-y-3">
              {opdracht.redenen.min.map((r) => (
                <li
                  key={r}
                  className="flex items-start gap-2.5 text-[14px] leading-snug"
                  style={{ color: C.ink }}
                >
                  <span
                    className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full"
                    style={{ background: C.warnBg, boxShadow: `inset 0 0 0 1px ${C.warn}44` }}
                    aria-hidden="true"
                  >
                    <TriangleAlert size={11} strokeWidth={2.4} style={{ color: C.warn }} />
                  </span>
                  {r}
                </li>
              ))}
            </ul>
            <div className="mt-4 border-t pt-4" style={{ borderColor: C.line }}>
              <Margin>
                Bespreek de weekenddiensten vooraf — dan weet je zeker of het bij je past.
              </Margin>
            </div>
          </Sheet>
        </section>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row">
        <button
          className="flex flex-1 items-center justify-center gap-2 rounded-[10px] px-6 py-3.5 text-[13.5px] font-semibold transition-transform hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
          style={{
            ...serifF,
            background: C.ink,
            color: C.bg,
            ["--tw-ring-color" as string]: C.accent,
            ["--tw-ring-offset-color" as string]: C.bg,
          }}
        >
          Reageer op deze opdracht <ArrowRight size={16} aria-hidden="true" />
        </button>
        <button
          className="flex items-center justify-center gap-2 rounded-[10px] px-6 py-3.5 text-[13.5px] font-semibold transition-colors hover:bg-black/[0.03] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
          style={{
            ...serifF,
            background: C.panel,
            color: C.ink,
            boxShadow: `inset 0 0 0 1px ${C.lineStrong}`,
            ["--tw-ring-color" as string]: C.accent,
            ["--tw-ring-offset-color" as string]: C.bg,
          }}
        >
          <Star size={15} strokeWidth={2} style={{ color: C.accent }} aria-hidden="true" /> Bewaar
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
      <div className="flex flex-wrap items-center justify-between gap-3">
        <SectionHead kicker="Dossier" title="Verificatie & documenten" Icon={ShieldCheck} />
        <button
          className="inline-flex items-center gap-2 rounded-[9px] px-4 py-2 text-[12.5px] font-semibold transition-transform hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
          style={{
            ...serifF,
            background: C.ink,
            color: C.bg,
            ["--tw-ring-color" as string]: C.accent,
            ["--tw-ring-offset-color" as string]: C.bg,
          }}
        >
          <Plus size={14} aria-hidden="true" /> Toevoegen
        </button>
      </div>

      <Sheet className="relative overflow-hidden">
        <div className="relative flex flex-wrap items-center gap-6 p-6">
          <span
            className="flex h-24 w-24 shrink-0 flex-col items-center justify-center rounded-full"
            style={{ background: C.yellow, boxShadow: `inset 0 0 0 2px ${C.yellowDeep}` }}
            aria-hidden="true"
          >
            <span
              className="text-[34px] font-semibold leading-none"
              style={{ ...monoF, color: C.ink }}
            >
              {dek}
            </span>
            <span
              className="text-[9px] font-medium uppercase tracking-[0.12em]"
              style={{ ...monoF, color: C.inkSoft }}
            >
              procent
            </span>
          </span>
          <div className="max-w-sm">
            <div className="text-[19px] font-semibold" style={{ ...serifF, color: C.ink }}>
              <Mark>
                {verified}/{CREDENTIALS.length}
              </Mark>{" "}
              geverifieerd
            </div>
            <p className="mt-1 text-[13.5px] leading-relaxed" style={{ color: C.inkSoft }}>
              Elk geverifieerd certificaat markeert je profiel als betrouwbaar. Houd je dekking hoog
              en je blijft onberispelijk zichtbaar voor opdrachtgevers.
            </p>
            <span
              className="mt-3 inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[11px] font-medium"
              style={{
                ...monoF,
                background: C.okBg,
                color: C.ok,
                boxShadow: `inset 0 0 0 1px ${C.ok}33`,
              }}
            >
              <BadgeCheck size={12} strokeWidth={2.2} aria-hidden="true" /> {PROFIEL.trust}
            </span>
          </div>
        </div>
      </Sheet>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {CREDENTIALS.map((c) => {
          const m = credMeta(c.status);
          const actionable = c.status !== "VERIFIED";
          return (
            <Sheet key={c.naam} className="flex items-center gap-3.5 p-4">
              <span
                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full"
                style={{ background: m.bg }}
                aria-hidden="true"
              >
                <m.Icon size={20} strokeWidth={2} style={{ color: m.fg }} />
              </span>
              <div className="min-w-0 flex-1">
                <div
                  className="truncate text-[15.5px] font-semibold"
                  style={{ ...serifF, color: C.ink }}
                >
                  {c.naam}
                </div>
                <div className="mt-0.5 text-[12.5px]" style={{ color: C.inkSoft }}>
                  {c.detail}
                </div>
                <div className="mt-2 flex flex-wrap items-center gap-2">
                  <StatusTag status={c.status} />
                  {actionable && (
                    <button
                      className="rounded-full px-2.5 py-1 text-[11px] font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-1"
                      style={{
                        ...monoF,
                        background: C.bgAlt,
                        color: C.ink,
                        boxShadow: `inset 0 0 0 1px ${C.line}`,
                        ["--tw-ring-color" as string]: C.accent,
                        ["--tw-ring-offset-color" as string]: C.panel,
                      }}
                    >
                      {c.status === "EXPIRING"
                        ? "Vernieuwen"
                        : c.status === "REJECTED"
                          ? "Opnieuw"
                          : "Bekijk"}
                    </button>
                  )}
                </div>
              </div>
            </Sheet>
          );
        })}
      </div>

      {/* Documentenlijst */}
      <section className="space-y-3">
        <SectionHead kicker="Kluis" title="Documenten" Icon={FileText} markColor="pink" />
        <Sheet className="overflow-hidden">
          {DOCUMENTEN.map((d, i) => {
            return (
              <div
                key={d.naam}
                className="flex items-center gap-3 p-4"
                style={{ borderTop: i === 0 ? undefined : `1px solid ${C.line}` }}
              >
                <span
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[8px]"
                  style={{ background: C.bgAlt }}
                  aria-hidden="true"
                >
                  <FileText size={16} strokeWidth={1.9} style={{ color: C.inkSoft }} />
                </span>
                <div className="min-w-0 flex-1">
                  <div
                    className="truncate text-[14px] font-semibold"
                    style={{ ...serifF, color: C.ink }}
                  >
                    {d.naam}
                  </div>
                  <div className="text-[11.5px]" style={{ ...monoF, color: C.inkFaint }}>
                    {d.type} · {d.grootte} · {d.bijgewerkt}
                  </div>
                </div>
                <StatusTag status={d.status} />
              </div>
            );
          })}
        </Sheet>
      </section>
    </div>
  );
}

// ── Acties (next-action) ─────────────────────────────────────────────────────────
function Acties() {
  const sorted = [...ACTIES].sort((a, b) =>
    a.urgentie === b.urgentie ? 0 : a.urgentie === "warning" ? -1 : 1,
  );
  return (
    <div className="space-y-6">
      <SectionHead kicker="Werklijst" title="Wat nu te doen" Icon={PenLine} />

      <ol className="space-y-4">
        {sorted.map((a, i) => {
          const warn = a.urgentie === "warning";
          return (
            <li key={a.titel}>
              <Sheet className="flex items-stretch overflow-hidden">
                <span
                  className="w-1.5 shrink-0"
                  style={{ background: warn ? C.pink : C.yellow }}
                  aria-hidden="true"
                />
                <div className="flex min-w-0 flex-1 items-center gap-4 p-5">
                  <span
                    className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-[16px] font-semibold"
                    style={{
                      ...monoF,
                      background: warn ? C.warnBg : C.bgAlt,
                      color: warn ? C.warn : C.inkSoft,
                    }}
                    aria-hidden="true"
                  >
                    {warn ? <TriangleAlert size={19} strokeWidth={2.2} /> : i + 1}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span
                        className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium uppercase tracking-[0.06em]"
                        style={{
                          ...monoF,
                          background: warn ? C.warnBg : C.waitBg,
                          color: warn ? C.warn : C.wait,
                        }}
                      >
                        {warn ? (
                          <TriangleAlert size={10} strokeWidth={2.4} aria-hidden="true" />
                        ) : (
                          <Star size={10} strokeWidth={2.4} aria-hidden="true" />
                        )}
                        {warn ? "Urgent" : "Kans"}
                      </span>
                      <h3
                        className="text-[16.5px] font-semibold"
                        style={{ ...serifF, color: C.ink }}
                      >
                        {warn ? <Mark color="pink">{a.titel}</Mark> : a.titel}
                      </h3>
                    </div>
                    <p
                      className="mt-1.5 text-[13.5px] leading-relaxed"
                      style={{ color: C.inkSoft }}
                    >
                      {a.detail}
                    </p>
                    <button
                      className="mt-3 inline-flex items-center gap-2 rounded-[9px] px-4 py-2 text-[12.5px] font-semibold transition-transform hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
                      style={
                        warn
                          ? {
                              ...serifF,
                              background: C.accent,
                              color: "#fff",
                              ["--tw-ring-color" as string]: C.accent,
                              ["--tw-ring-offset-color" as string]: C.panel,
                            }
                          : {
                              ...serifF,
                              background: C.panel,
                              color: C.ink,
                              boxShadow: `inset 0 0 0 1px ${C.lineStrong}`,
                              ["--tw-ring-color" as string]: C.accent,
                              ["--tw-ring-offset-color" as string]: C.panel,
                            }
                      }
                    >
                      {a.cta} <ArrowRight size={13} aria-hidden="true" />
                    </button>
                  </div>
                </div>
              </Sheet>
            </li>
          );
        })}
      </ol>

      {/* Berichten */}
      <section className="space-y-3">
        <SectionHead
          kicker="Postbus"
          title="Recente gesprekken"
          Icon={MessageSquare}
          markColor="pink"
        />
        <Sheet className="overflow-hidden">
          {BERICHTEN.map((b, i) => (
            <div
              key={b.van}
              className="flex items-center gap-3 p-4"
              style={{ borderTop: i === 0 ? undefined : `1px solid ${C.line}` }}
            >
              <span
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-[11px] font-semibold"
                style={{ ...monoF, background: C.ink, color: C.yellow }}
                aria-hidden="true"
              >
                {b.initialen}
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span
                    className="truncate text-[15px] font-semibold"
                    style={{ ...serifF, color: C.ink }}
                  >
                    {b.van}
                  </span>
                  {b.ongelezen && (
                    <span
                      className="h-1.5 w-1.5 rounded-full"
                      style={{ background: C.accent }}
                      aria-label="Ongelezen"
                    />
                  )}
                </div>
                <p className="mt-0.5 truncate text-[12.5px]" style={{ color: C.inkSoft }}>
                  {b.preview}
                </p>
              </div>
              <span className="shrink-0 text-[11px]" style={{ ...monoF, color: C.inkFaint }}>
                {b.tijd}
              </span>
            </div>
          ))}
        </Sheet>
      </section>
    </div>
  );
}

// ── Facturen ─────────────────────────────────────────────────────────────────────
function Facturen() {
  const factMeta = (
    status: string,
  ): { label: string; Icon: LucideIcon; fg: string; bg: string } => {
    if (status === "Betaald") return { label: "Betaald", Icon: Check, fg: C.ok, bg: C.okBg };
    if (status === "Openstaand")
      return { label: "Openstaand", Icon: Clock, fg: C.warn, bg: C.warnBg };
    return { label: "Concept", Icon: FileText, fg: C.inkSoft, bg: C.bgAlt };
  };
  const betaald = "€ 8.622";
  const open = FACTUREN.filter((f) => f.status === "Openstaand").length;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <SectionHead kicker="Boekhouding" title="Omzet & openstaand" Icon={Coins} />
        <button
          className="inline-flex items-center gap-2 rounded-[9px] px-4 py-2 text-[12.5px] font-semibold transition-transform hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
          style={{
            ...serifF,
            background: C.ink,
            color: C.bg,
            ["--tw-ring-color" as string]: C.accent,
            ["--tw-ring-offset-color" as string]: C.bg,
          }}
        >
          <Plus size={14} aria-hidden="true" /> Nieuwe factuur
        </button>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {[
          { l: "Betaald (mnd)", v: betaald, mark: true },
          { l: "Openstaand", v: `${open}`, mark: false },
          { l: "Te factureren", v: "€ 1.350", mark: false },
        ].map((s) => (
          <Sheet key={s.l} className="p-4">
            <div
              className="text-[11px] font-medium uppercase tracking-[0.1em]"
              style={{ ...monoF, color: C.inkFaint }}
            >
              {s.l}
            </div>
            <div
              className="mt-3 text-[26px] font-semibold leading-none"
              style={{ ...serifF, color: C.ink }}
            >
              {s.mark ? <Mark>{s.v}</Mark> : s.v}
            </div>
          </Sheet>
        ))}
      </div>

      <Sheet className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[520px] text-left">
            <thead>
              <tr style={{ background: C.bgAlt }}>
                {["Nummer", "Klant", "Datum", "Status", "Bedrag"].map((h, i) => (
                  <th
                    key={h}
                    className={`px-4 py-2.5 text-[10px] font-medium uppercase tracking-[0.1em] ${i === 4 ? "text-right" : ""}`}
                    style={{ ...monoF, color: C.inkFaint }}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {FACTUREN.map((f, i) => {
                const m = factMeta(f.status);
                return (
                  <tr key={f.nr} style={{ borderTop: i === 0 ? undefined : `1px solid ${C.line}` }}>
                    <td
                      className="px-4 py-3 text-[13px] font-semibold"
                      style={{ ...monoF, color: C.ink }}
                    >
                      {f.nr}
                    </td>
                    <td className="px-4 py-3 text-[13.5px]" style={{ ...serifF, color: C.inkSoft }}>
                      {f.klant}
                    </td>
                    <td className="px-4 py-3 text-[12px]" style={{ ...monoF, color: C.inkFaint }}>
                      {f.datum}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-medium"
                        style={{
                          ...monoF,
                          background: m.bg,
                          color: m.fg,
                          boxShadow: `inset 0 0 0 1px ${m.fg}33`,
                        }}
                      >
                        <m.Icon size={11} strokeWidth={2.4} aria-hidden="true" /> {m.label}
                      </span>
                    </td>
                    <td
                      className="px-4 py-3 text-right text-[15px] font-semibold"
                      style={{ ...monoF, color: C.ink }}
                    >
                      {f.bedrag}
                    </td>
                  </tr>
                );
              })}
            </tbody>
            <tfoot>
              <tr style={{ background: C.ink }}>
                <td
                  colSpan={4}
                  className="px-4 py-3 text-[11px] font-medium uppercase tracking-[0.1em]"
                  style={{ ...monoF, color: C.yellow }}
                >
                  Totaal betaald
                </td>
                <td
                  className="px-4 py-3 text-right text-[17px] font-semibold"
                  style={{ ...monoF, color: C.yellow }}
                >
                  {betaald}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </Sheet>
    </div>
  );
}
