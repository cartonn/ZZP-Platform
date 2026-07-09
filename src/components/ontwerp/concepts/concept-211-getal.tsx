"use client";

// Concept 211 — "Getal" · data als typografie. 2026-trend: data-as-typography / oversized numeric display /
// brutalist-Swiss revival. De kerncijfers (match-%, omzet, bedragen) worden enorm gezet — tabular numbers,
// tight tracking — en dragen de compositie als Zwitserse poster. Labels klein en mono eronder. Strak
// zwart-op-warmwit met één rood-oranje accent. Geen kaart-in-kaart: witruimte + gigantische numeralen
// vormen de hiërarchie. Fonts: Space Grotesk (display) + IBM Plex Mono. Status altijd label + icoon, nooit
// kleur alleen. UI Nederlands, code Engels. Volledig deterministisch (geen random/Date).

import { useState } from "react";
import {
  ArrowRight,
  ArrowLeft,
  ArrowUpRight,
  ArrowDownRight,
  Check,
  Clock,
  XCircle,
  Search,
  ShieldCheck,
  Plus,
  MapPin,
  CalendarDays,
  Star,
  FileText,
  TriangleAlert,
  RefreshCw,
  BadgeCheck,
  Hash,
  Minus,
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
  type ScreenKey,
  type CredStatus,
  type Opdracht,
} from "./mock";

// ── Palet — warmwit papier, zware inkt, één rood-oranje accent. Zeer beperkt: dat is de discipline. ──
const C = {
  bg: "#faf9f5", // warmwit
  ink: "#141414", // near-black inkt
  inkSoft: "#4a4a45", // secundair
  inkFaint: "#8f8e86", // labels / mono captions
  line: "#e2e0d7", // hairline
  lineStrong: "#151515", // zware Swiss-regel
  accent: "#e0330f", // rood-oranje — het enige accent
  accentSoft: "#fbe4dd", // zacht accentvlak
  // status: label + icoon dragen betekenis; kleur ondersteunt slechts.
  ok: "#1f6b3a",
  wait: "#1856a0",
  warn: "#9a5b00",
  bad: "#b3271a",
};

const displayF = { fontFamily: "var(--font-lab-space)" }; // Space Grotesk — display
const monoF = { fontFamily: "var(--font-lab-plex-mono)" }; // IBM Plex Mono — labels/captions

// ── Status-model — vorm + icoon + label, nooit kleur alleen. ──
type StatusStyle = { label: string; Icon: LucideIcon; fg: string };
function credMeta(s: CredStatus): StatusStyle {
  switch (s) {
    case "VERIFIED":
      return { label: "Geverifieerd", Icon: BadgeCheck, fg: C.ok };
    case "SUBMITTED":
      return { label: "In beoordeling", Icon: Clock, fg: C.wait };
    case "EXPIRING":
      return { label: "Verloopt binnenkort", Icon: TriangleAlert, fg: C.warn };
    case "REJECTED":
      return { label: "Afgewezen", Icon: XCircle, fg: C.bad };
  }
}

// Statuslabel — mono uppercase met icoon en een onderstreep in de statuskleur (niet enkel kleurvlak).
function StatusTag({ status }: { status: CredStatus }) {
  const m = credMeta(status);
  return (
    <span
      className="inline-flex items-center gap-1.5 text-[10.5px] font-medium uppercase tracking-[0.12em]"
      style={{ ...monoF, color: m.fg }}
    >
      <m.Icon size={12} strokeWidth={2.2} aria-hidden="true" />
      <span style={{ borderBottom: `1.5px solid ${m.fg}` }}>{m.label}</span>
    </span>
  );
}

// Mono-caption — het kleine label onder een groot getal.
function Cap({
  children,
  className = "",
  style,
}: {
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
}) {
  return (
    <span
      className={`block text-[10.5px] font-medium uppercase tracking-[0.16em] ${className}`}
      style={{ ...monoF, color: C.inkFaint, ...style }}
    >
      {children}
    </span>
  );
}

// Enorm numeriek held-cijfer — tabular, tight tracking, dat is de kern van dit concept.
function Numeral({
  value,
  className = "",
  accent = false,
  style,
}: {
  value: string;
  className?: string;
  accent?: boolean;
  style?: React.CSSProperties;
}) {
  return (
    <span
      className={`block tabular-nums leading-[0.86] ${className}`}
      style={{
        ...displayF,
        color: accent ? C.accent : C.ink,
        letterSpacing: "-0.03em",
        fontWeight: 500,
        ...style,
      }}
    >
      {value}
    </span>
  );
}

// Zware Zwitserse sectiekop — regelnummer (mono) + titel, met dikke bovenregel.
function Rule({ index, title, meta }: { index: string; title: string; meta?: string }) {
  return (
    <div className="border-t-2 pt-3" style={{ borderColor: C.lineStrong }}>
      <div className="flex items-baseline justify-between gap-3">
        <div className="flex items-baseline gap-3">
          <span className="text-[11px] tabular-nums" style={{ ...monoF, color: C.accent }}>
            {index}
          </span>
          <h2
            className="text-[15px] font-medium uppercase tracking-[0.02em]"
            style={{ ...displayF, color: C.ink }}
          >
            {title}
          </h2>
        </div>
        {meta && (
          <span
            className="text-[10.5px] uppercase tracking-[0.14em]"
            style={{ ...monoF, color: C.inkFaint }}
          >
            {meta}
          </span>
        )}
      </div>
    </div>
  );
}

// Mono-metaregel met icoon.
function Meta({ Icon, value }: { Icon: LucideIcon; value: string }) {
  return (
    <div className="flex items-center gap-2" style={{ color: C.inkSoft }}>
      <Icon size={13} strokeWidth={2} style={{ color: C.inkFaint }} aria-hidden="true" />
      <span className="truncate text-[12px]" style={monoF}>
        {value}
      </span>
    </div>
  );
}

// Trend-chip — pijl + waarde, mono; richting bepaalt icoon (niet enkel kleur).
function Trend({ up, value }: { up: boolean; value: string }) {
  const Icon = up ? ArrowUpRight : value.includes("open") ? Minus : ArrowDownRight;
  return (
    <span
      className="inline-flex items-center gap-1 text-[11px] tabular-nums"
      style={{ ...monoF, color: up ? C.ok : C.inkSoft }}
    >
      <Icon size={12} strokeWidth={2.4} aria-hidden="true" />
      {value}
    </span>
  );
}

// ── Root ───────────────────────────────────────────────────────────────────────────
export function Concept211() {
  const [screen, setScreen] = useState<ScreenKey>("dashboard");
  const active = OPDRACHTEN[0] as Opdracht;
  const idx = SCREENS.findIndex((s) => s.key === screen);

  return (
    <div
      className="relative min-h-screen w-full overflow-x-hidden antialiased"
      style={{ ...monoF, background: C.bg, color: C.ink }}
    >
      {/* Kop — Swiss masthead: reusachtig woordmerk + mono-index rechts */}
      <header className="border-b-2" style={{ borderColor: C.lineStrong }}>
        <div className="mx-auto flex max-w-6xl flex-wrap items-end justify-between gap-4 px-4 pb-4 pt-6 md:px-8">
          <div className="min-w-0">
            <div
              className="flex items-center gap-2 text-[10.5px] uppercase tracking-[0.22em]"
              style={{ color: C.inkFaint }}
            >
              <Hash size={12} style={{ color: C.accent }} aria-hidden="true" /> Data-as-typography
            </div>
            <div
              className="mt-1 text-[30px] font-medium uppercase leading-none tracking-[-0.03em] sm:text-[38px]"
              style={{ ...displayF, color: C.ink }}
            >
              Getal
              <span style={{ color: C.accent }}>.</span>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="hidden text-right sm:block">
              <span
                className="text-[12px] font-medium uppercase tracking-[0.04em]"
                style={{ ...displayF, color: C.ink }}
              >
                {PROFIEL.naam}
              </span>
              <Cap className="mt-0.5" style={{ letterSpacing: "0.1em" }}>
                {PROFIEL.rol}
              </Cap>
            </div>
            <span
              className="flex h-11 w-11 items-center justify-center text-[13px] font-medium"
              style={{ ...displayF, background: C.ink, color: C.bg }}
              aria-hidden="true"
            >
              {PROFIEL.initialen}
            </span>
          </div>
        </div>

        {/* Scherm-switcher — genummerde mono-tabs onder een fijne regel */}
        <nav
          className="mx-auto flex max-w-6xl items-stretch gap-0 overflow-x-auto px-4 md:px-8"
          aria-label="Schermen"
        >
          {SCREENS.map((s, i) => {
            const on = s.key === screen;
            return (
              <button
                key={s.key}
                onClick={() => setScreen(s.key)}
                aria-current={on ? "page" : undefined}
                className="group relative shrink-0 px-3.5 py-3 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
                style={{
                  ["--tw-ring-color" as string]: C.accent,
                  ["--tw-ring-offset-color" as string]: C.bg,
                }}
              >
                <span
                  className="block text-[9.5px] tabular-nums"
                  style={{ ...monoF, color: on ? C.accent : C.inkFaint }}
                >
                  {String(i + 1).padStart(2, "0")}
                </span>
                <span
                  className="mt-0.5 block text-[12.5px] font-medium uppercase tracking-[0.02em]"
                  style={{ ...displayF, color: on ? C.ink : C.inkSoft }}
                >
                  {s.label}
                </span>
                <span
                  className="absolute inset-x-0 bottom-0 h-[3px] transition-transform"
                  style={{
                    background: C.accent,
                    transform: on ? "scaleX(1)" : "scaleX(0)",
                    transformOrigin: "left",
                  }}
                  aria-hidden="true"
                />
              </button>
            );
          })}
        </nav>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-8 md:px-8 md:py-12">
        {screen === "dashboard" && (
          <Dashboard onOpen={() => setScreen("opdracht")} onActies={() => setScreen("acties")} />
        )}
        {screen === "marktplaats" && <Marktplaats onOpen={() => setScreen("opdracht")} />}
        {screen === "opdracht" && (
          <OpdrachtDetail opdracht={active} onBack={() => setScreen("marktplaats")} />
        )}
        {screen === "verificatie" && <Verificatie />}
        {screen === "acties" && <Acties onFacturen={() => setScreen("facturen")} />}
        {screen === "facturen" && <Facturen />}
      </main>

      <footer className="border-t-2" style={{ borderColor: C.lineStrong }}>
        <div
          className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-2 px-4 py-5 text-[10px] uppercase tracking-[0.16em] md:px-8"
          style={{ color: C.inkFaint }}
        >
          <span style={monoF}>Getal — cijfers dragen de compositie</span>
          <span className="tabular-nums" style={monoF}>
            Scherm {String(idx + 1).padStart(2, "0")} / {String(SCREENS.length).padStart(2, "0")}
          </span>
        </div>
      </footer>
    </div>
  );
}

// ── Dashboard ────────────────────────────────────────────────────────────────────
function Dashboard({ onOpen, onActies }: { onOpen: () => void; onActies: () => void }) {
  const verified = CREDENTIALS.filter((c) => c.status === "VERIFIED").length;
  const dek = Math.round((verified / CREDENTIALS.length) * 100);
  const match = KPIS[0] as (typeof KPIS)[number];
  const omzet = KPIS[2] as (typeof KPIS)[number];
  const warn = (ACTIES.find((a) => a.urgentie === "warning") ??
    ACTIES[0]) as (typeof ACTIES)[number];

  return (
    <div className="space-y-14">
      {/* Held — het match-percentage als poster-numeraal */}
      <section>
        <div
          className="flex flex-wrap items-end justify-between gap-2 border-b-2 pb-3"
          style={{ borderColor: C.lineStrong }}
        >
          <Cap style={{ letterSpacing: "0.2em" }}>Match-percentage · deze week</Cap>
          <Trend up={match.up} value={match.trend} />
        </div>
        <div className="mt-6 grid grid-cols-1 gap-8 lg:grid-cols-[1.35fr_1fr] lg:items-end">
          <div>
            <Numeral
              value={match.value}
              className="text-[38vw] sm:text-[30vw] md:text-[220px] lg:text-[240px]"
              accent
            />
            <p
              className="mt-4 max-w-md text-[13.5px] leading-relaxed"
              style={{ ...monoF, color: C.inkSoft }}
            >
              Drie opdrachten passen boven 85%. Je BIG-registratie is geverifieerd en je reistijd is
              kort — daarom staat je bovenaan bij opdrachtgevers.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <button
                onClick={onOpen}
                className="inline-flex items-center gap-2 px-5 py-3 text-[12px] font-medium uppercase tracking-[0.06em] transition-transform hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
                style={{
                  ...displayF,
                  background: C.ink,
                  color: C.bg,
                  ["--tw-ring-color" as string]: C.accent,
                  ["--tw-ring-offset-color" as string]: C.bg,
                }}
              >
                Bekijk matches <ArrowRight size={15} aria-hidden="true" />
              </button>
              <button
                onClick={onActies}
                className="inline-flex items-center gap-2 px-5 py-3 text-[12px] font-medium uppercase tracking-[0.06em] transition-colors hover:bg-[#f1efe7] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
                style={{
                  ...displayF,
                  color: C.ink,
                  boxShadow: `inset 0 0 0 1.5px ${C.lineStrong}`,
                  ["--tw-ring-color" as string]: C.accent,
                  ["--tw-ring-offset-color" as string]: C.bg,
                }}
              >
                <TriangleAlert
                  size={14}
                  strokeWidth={2.2}
                  style={{ color: C.warn }}
                  aria-hidden="true"
                />{" "}
                Los actie op
              </button>
            </div>
          </div>

          {/* Nevengetallen — omzet & dekking, kleiner maar nog steeds numeriek dominant */}
          <div className="grid grid-cols-2 gap-6">
            <div className="border-t-2 pt-3" style={{ borderColor: C.lineStrong }}>
              <Numeral value={omzet.value} className="text-[40px] sm:text-[52px]" />
              <Cap className="mt-3">Omzet deze maand</Cap>
              <div className="mt-1">
                <Trend up={omzet.up} value={omzet.trend} />
              </div>
            </div>
            <div className="border-t-2 pt-3" style={{ borderColor: C.lineStrong }}>
              <Numeral value={`${dek}%`} className="text-[40px] sm:text-[52px]" />
              <Cap className="mt-3">Certificaat-dekking</Cap>
              <div className="mt-1">
                <StatusTag status="VERIFIED" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* KPI-strook — vier grote getallen op een rij, mono-labels eronder */}
      <section>
        <Rule index="01" title="Kerncijfers" meta="Live" />
        <div className="mt-6 grid grid-cols-2 gap-x-6 gap-y-8 lg:grid-cols-4">
          {KPIS.map((k) => (
            <div key={k.label}>
              <Numeral value={k.value} className="text-[38px] sm:text-[46px]" />
              <Cap className="mt-3">{k.label}</Cap>
              <div className="mt-1.5">
                <Trend up={k.up} value={k.trend} />
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Matches — genummerde lijst met dominant match-cijfer links */}
      <section>
        <Rule index="02" title="Aanbevolen opdrachten" meta={`${OPDRACHTEN.length} matches`} />
        <ul className="mt-2">
          {OPDRACHTEN.map((o, i) => (
            <li key={o.id}>
              <button
                onClick={onOpen}
                className="group flex w-full items-center gap-5 border-b py-5 text-left transition-colors hover:bg-[#f2f0e8] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset"
                style={{ borderColor: C.line, ["--tw-ring-color" as string]: C.accent }}
              >
                <span className="w-[92px] shrink-0 sm:w-[128px]">
                  <Numeral
                    value={String(o.match)}
                    className="text-[52px] sm:text-[68px]"
                    accent={i === 0}
                  />
                  <Cap className="mt-1">match %</Cap>
                </span>
                <span className="min-w-0 flex-1">
                  <span
                    className="block truncate text-[16px] font-medium uppercase tracking-[0.01em] sm:text-[18px]"
                    style={{ ...displayF, color: C.ink }}
                  >
                    {o.titel}
                  </span>
                  <span
                    className="mt-1 block truncate text-[12px]"
                    style={{ ...monoF, color: C.inkSoft }}
                  >
                    {o.opdrachtgever} · {o.plaats} · {o.tarief}
                  </span>
                  <span className="mt-2 flex flex-wrap gap-x-4 gap-y-1">
                    {o.redenen.plus.slice(0, 2).map((r) => (
                      <span
                        key={r}
                        className="inline-flex items-center gap-1.5 text-[11px]"
                        style={{ ...monoF, color: C.inkSoft }}
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
                  </span>
                </span>
                <ArrowRight
                  size={20}
                  className="shrink-0 transition-transform group-hover:translate-x-1"
                  style={{ color: C.inkFaint }}
                  aria-hidden="true"
                />
              </button>
            </li>
          ))}
        </ul>
      </section>

      {/* Gemarkeerde actie — accent-blok, groot getal 23 (dagen) */}
      <section>
        <Rule index="03" title="Vraagt aandacht" meta="1 item" />
        <div
          className="mt-6 flex flex-col gap-6 sm:flex-row sm:items-center"
          style={{ background: C.accentSoft }}
        >
          <div className="flex items-center gap-5 p-6 sm:p-8">
            <div>
              <Numeral value="23" className="text-[64px] sm:text-[80px]" accent />
              <Cap className="mt-1">dagen resterend</Cap>
            </div>
            <div className="min-w-0">
              <span
                className="inline-flex items-center gap-1.5 text-[10.5px] uppercase tracking-[0.14em]"
                style={{ ...monoF, color: C.accent }}
              >
                <TriangleAlert size={12} strokeWidth={2.4} aria-hidden="true" /> Actie vereist
              </span>
              <h3
                className="mt-2 text-[17px] font-medium uppercase leading-tight tracking-[0.01em]"
                style={{ ...displayF, color: C.ink }}
              >
                {warn.titel}
              </h3>
              <p
                className="mt-1.5 max-w-md text-[12.5px] leading-relaxed"
                style={{ ...monoF, color: C.inkSoft }}
              >
                {warn.detail}
              </p>
              <button
                onClick={onActies}
                className="mt-4 inline-flex items-center gap-2 px-4 py-2.5 text-[12px] font-medium uppercase tracking-[0.06em] transition-transform hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
                style={{
                  ...displayF,
                  background: C.accent,
                  color: "#fff",
                  ["--tw-ring-color" as string]: C.accent,
                  ["--tw-ring-offset-color" as string]: C.accentSoft,
                }}
              >
                {warn.cta} <ArrowRight size={14} aria-hidden="true" />
              </button>
            </div>
          </div>
        </div>
      </section>
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
    <div className="space-y-8">
      <div
        className="flex flex-wrap items-end justify-between gap-4 border-b-2 pb-4"
        style={{ borderColor: C.lineStrong }}
      >
        <div>
          <Cap style={{ letterSpacing: "0.2em" }}>Marktplaats</Cap>
          <div className="mt-2 flex items-baseline gap-3">
            <Numeral value={String(filtered.length)} className="text-[52px]" accent />
            <span
              className="text-[15px] uppercase tracking-[0.04em]"
              style={{ ...displayF, color: C.ink }}
            >
              open opdrachten
            </span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div
            className="flex items-center gap-2 px-3 py-2.5"
            style={{ boxShadow: `inset 0 0 0 1.5px ${C.lineStrong}` }}
          >
            <Search size={15} style={{ color: C.inkFaint }} aria-hidden="true" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Zoek opdracht of plaats…"
              aria-label="Opdrachten zoeken"
              className="w-40 bg-transparent text-[12px] outline-none placeholder:opacity-50"
              style={{ ...monoF, color: C.ink }}
            />
          </div>
          <button
            onClick={refresh}
            aria-label="Verversen"
            className="flex h-10 w-10 items-center justify-center transition-colors hover:bg-[#f1efe7] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
            style={{
              boxShadow: `inset 0 0 0 1.5px ${C.lineStrong}`,
              ["--tw-ring-color" as string]: C.accent,
              ["--tw-ring-offset-color" as string]: C.bg,
            }}
          >
            <RefreshCw
              size={15}
              className={loading ? "animate-spin" : ""}
              style={{ color: C.ink }}
              aria-hidden="true"
            />
          </button>
        </div>
      </div>

      {error && (
        <div
          className="flex items-start gap-3 p-4"
          role="alert"
          style={{ background: C.accentSoft }}
        >
          <XCircle size={18} strokeWidth={2.2} style={{ color: C.bad }} aria-hidden="true" />
          <div className="min-w-0 flex-1">
            <div
              className="text-[13px] font-medium uppercase tracking-[0.03em]"
              style={{ ...displayF, color: C.ink }}
            >
              Voorraad niet volledig geladen
            </div>
            <p className="mt-0.5 text-[12px]" style={{ ...monoF, color: C.inkSoft }}>
              Een deel van de opdrachten ontbreekt. Ververs om opnieuw te proberen.
            </p>
          </div>
          <button
            onClick={() => setError(false)}
            className="shrink-0 text-[11px] uppercase tracking-[0.1em] focus-visible:outline-none focus-visible:ring-2"
            style={{ ...monoF, color: C.bad, ["--tw-ring-color" as string]: C.bad }}
          >
            Sluiten
          </button>
        </div>
      )}

      {loading ? (
        <ul>
          {[0, 1, 2].map((i) => (
            <li
              key={i}
              className="flex items-center gap-5 border-b py-6"
              style={{ borderColor: C.line }}
            >
              <span
                className="h-14 w-24 shrink-0 animate-pulse"
                style={{ background: "#eeece4" }}
              />
              <div className="flex-1 space-y-2">
                <span className="block h-4 w-3/4 animate-pulse" style={{ background: "#eeece4" }} />
                <span className="block h-3 w-1/2 animate-pulse" style={{ background: C.line }} />
              </div>
            </li>
          ))}
        </ul>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-4 py-24 text-center">
          <Numeral value="0" className="text-[120px]" />
          <p
            className="text-[16px] font-medium uppercase tracking-[0.03em]"
            style={{ ...displayF, color: C.ink }}
          >
            Geen resultaten
          </p>
          <p className="max-w-xs text-[12.5px]" style={{ ...monoF, color: C.inkSoft }}>
            Geen opdracht gevonden voor &ldquo;{q}&rdquo;. Pas je zoekterm aan.
          </p>
          <button
            onClick={() => setQ("")}
            className="mt-1 px-4 py-2.5 text-[12px] font-medium uppercase tracking-[0.06em] transition-transform hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
            style={{
              ...displayF,
              background: C.ink,
              color: C.bg,
              ["--tw-ring-color" as string]: C.accent,
              ["--tw-ring-offset-color" as string]: C.bg,
            }}
          >
            Zoekterm wissen
          </button>
        </div>
      ) : (
        <ul>
          {filtered.map((o, i) => (
            <li key={o.id}>
              <button
                onClick={onOpen}
                className="group grid w-full grid-cols-1 gap-4 border-b py-6 text-left transition-colors hover:bg-[#f2f0e8] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset sm:grid-cols-[132px_1fr_auto] sm:items-center"
                style={{ borderColor: C.line, ["--tw-ring-color" as string]: C.accent }}
              >
                <span>
                  <Numeral value={String(o.match)} className="text-[64px]" accent={i === 0} />
                  <Cap className="mt-1">match %</Cap>
                </span>
                <span className="min-w-0">
                  <span
                    className="text-[10.5px] uppercase tracking-[0.14em]"
                    style={{ ...monoF, color: C.inkFaint }}
                  >
                    {o.id}
                  </span>
                  <span
                    className="mt-0.5 block truncate text-[17px] font-medium uppercase tracking-[0.01em]"
                    style={{ ...displayF, color: C.ink }}
                  >
                    {o.titel}
                  </span>
                  <span className="mt-2 flex flex-wrap gap-x-5 gap-y-1.5">
                    <Meta Icon={MapPin} value={o.plaats} />
                    <Meta Icon={CalendarDays} value={o.start} />
                    <Meta Icon={Clock} value={o.uren} />
                  </span>
                  <span className="mt-2.5 flex flex-wrap gap-x-3 gap-y-1">
                    {o.tags.map((t) => (
                      <span
                        key={t}
                        className="text-[10.5px] uppercase tracking-[0.08em]"
                        style={{ ...monoF, color: C.inkSoft }}
                      >
                        · {t}
                      </span>
                    ))}
                  </span>
                </span>
                <span className="flex items-center gap-3 sm:flex-col sm:items-end">
                  <span
                    className="text-[15px] font-medium tabular-nums"
                    style={{ ...displayF, color: C.ink }}
                  >
                    {o.tarief}
                  </span>
                  <ArrowRight
                    size={18}
                    className="transition-transform group-hover:translate-x-1"
                    style={{ color: C.inkFaint }}
                    aria-hidden="true"
                  />
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

// ── Opdracht-detail ────────────────────────────────────────────────────────────────
function OpdrachtDetail({ opdracht, onBack }: { opdracht: Opdracht; onBack: () => void }) {
  const feiten: { l: string; v: string }[] = [
    { l: "Tarief", v: opdracht.tarief },
    { l: "Omvang", v: opdracht.uren },
    { l: "Start", v: opdracht.start },
    { l: "Plaats", v: opdracht.plaats },
  ];
  return (
    <div className="space-y-12">
      <button
        onClick={onBack}
        className="inline-flex items-center gap-1.5 text-[11px] uppercase tracking-[0.12em] transition-colors hover:text-black focus-visible:outline-none focus-visible:ring-2"
        style={{ ...monoF, color: C.inkSoft, ["--tw-ring-color" as string]: C.accent }}
      >
        <ArrowLeft size={13} aria-hidden="true" /> Terug naar marktplaats
      </button>

      {/* Held — titel + reusachtig match-cijfer naast elkaar */}
      <section
        className="grid grid-cols-1 gap-8 border-b-2 pb-10 lg:grid-cols-[1fr_auto] lg:items-end"
        style={{ borderColor: C.lineStrong }}
      >
        <div className="min-w-0">
          <span
            className="text-[10.5px] uppercase tracking-[0.16em]"
            style={{ ...monoF, color: C.accent }}
          >
            {opdracht.id} · start {opdracht.start}
          </span>
          <h1
            className="mt-3 max-w-2xl text-[30px] font-medium uppercase leading-[1.02] tracking-[-0.01em] sm:text-[42px]"
            style={{ ...displayF, color: C.ink }}
          >
            {opdracht.titel}
          </h1>
          <p className="mt-3 text-[13px]" style={{ ...monoF, color: C.inkSoft }}>
            {opdracht.opdrachtgever} · {opdracht.plaats}
          </p>
        </div>
        <div className="shrink-0">
          <Numeral value={String(opdracht.match)} className="text-[96px] sm:text-[128px]" accent />
          <Cap className="mt-1 text-right">match %</Cap>
        </div>
      </section>

      {/* Feiten — vier grote getallen */}
      <section className="grid grid-cols-2 gap-x-6 gap-y-8 lg:grid-cols-4">
        {feiten.map((f) => (
          <div key={f.l} className="border-t-2 pt-3" style={{ borderColor: C.lineStrong }}>
            <Numeral value={f.v} className="text-[30px] sm:text-[36px]" />
            <Cap className="mt-3">{f.l}</Cap>
          </div>
        ))}
      </section>

      <div className="grid grid-cols-1 gap-10 md:grid-cols-2">
        <section>
          <Rule index="+" title="Waarom dit past" />
          <ul className="mt-4 space-y-3">
            {opdracht.redenen.plus.map((r) => (
              <li
                key={r}
                className="flex items-start gap-2.5 text-[13.5px] leading-snug"
                style={{ ...monoF, color: C.ink }}
              >
                <Check
                  size={15}
                  strokeWidth={2.4}
                  style={{ color: C.ok, marginTop: 1 }}
                  aria-hidden="true"
                />{" "}
                {r}
              </li>
            ))}
          </ul>
        </section>
        <section>
          <Rule index="–" title="Om te overwegen" />
          <ul className="mt-4 space-y-3">
            {opdracht.redenen.min.map((r) => (
              <li
                key={r}
                className="flex items-start gap-2.5 text-[13.5px] leading-snug"
                style={{ ...monoF, color: C.ink }}
              >
                <TriangleAlert
                  size={14}
                  strokeWidth={2.4}
                  style={{ color: C.warn, marginTop: 2 }}
                  aria-hidden="true"
                />{" "}
                {r}
              </li>
            ))}
          </ul>
        </section>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row">
        <button
          className="flex flex-1 items-center justify-center gap-2 px-6 py-4 text-[13px] font-medium uppercase tracking-[0.06em] transition-transform hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
          style={{
            ...displayF,
            background: C.accent,
            color: "#fff",
            ["--tw-ring-color" as string]: C.accent,
            ["--tw-ring-offset-color" as string]: C.bg,
          }}
        >
          Reageer op deze opdracht <ArrowRight size={16} aria-hidden="true" />
        </button>
        <button
          className="flex items-center justify-center gap-2 px-6 py-4 text-[13px] font-medium uppercase tracking-[0.06em] transition-colors hover:bg-[#f1efe7] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
          style={{
            ...displayF,
            color: C.ink,
            boxShadow: `inset 0 0 0 1.5px ${C.lineStrong}`,
            ["--tw-ring-color" as string]: C.accent,
            ["--tw-ring-offset-color" as string]: C.bg,
          }}
        >
          <Star size={15} strokeWidth={2} aria-hidden="true" /> Bewaar
        </button>
      </div>
    </div>
  );
}

// ── Verificatie ────────────────────────────────────────────────────────────────────
function Verificatie() {
  const verified = CREDENTIALS.filter((c) => c.status === "VERIFIED").length;
  const dek = Math.round((verified / CREDENTIALS.length) * 100);
  return (
    <div className="space-y-12">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <Cap style={{ letterSpacing: "0.2em" }}>Verificatie · certificaten</Cap>
          <div className="mt-3 flex items-baseline gap-4">
            <Numeral value={`${dek}%`} className="text-[80px] sm:text-[104px]" accent />
            <div>
              <div
                className="text-[16px] font-medium uppercase tracking-[0.02em]"
                style={{ ...displayF, color: C.ink }}
              >
                {verified} / {CREDENTIALS.length} geverifieerd
              </div>
              <span
                className="mt-1.5 inline-flex items-center gap-1.5 text-[11px] uppercase tracking-[0.1em]"
                style={{ ...monoF, color: C.ok }}
              >
                <ShieldCheck size={13} strokeWidth={2.2} aria-hidden="true" /> {PROFIEL.trust}
              </span>
            </div>
          </div>
        </div>
        <button
          className="inline-flex items-center gap-2 px-4 py-2.5 text-[12px] font-medium uppercase tracking-[0.06em] transition-transform hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
          style={{
            ...displayF,
            background: C.ink,
            color: C.bg,
            ["--tw-ring-color" as string]: C.accent,
            ["--tw-ring-offset-color" as string]: C.bg,
          }}
        >
          <Plus size={14} aria-hidden="true" /> Toevoegen
        </button>
      </div>

      <section>
        <Rule index="01" title="Certificaten & documenten" meta={`${CREDENTIALS.length} items`} />
        <ul className="mt-2">
          {CREDENTIALS.map((c, i) => {
            const m = credMeta(c.status);
            const actionable = c.status !== "VERIFIED";
            return (
              <li
                key={c.naam}
                className="flex flex-wrap items-center gap-4 border-b py-5"
                style={{ borderColor: C.line }}
              >
                <span
                  className="w-8 shrink-0 text-[11px] tabular-nums"
                  style={{ ...monoF, color: C.inkFaint }}
                >
                  {String(i + 1).padStart(2, "0")}
                </span>
                <m.Icon size={22} strokeWidth={2} style={{ color: m.fg }} aria-hidden="true" />
                <div className="min-w-0 flex-1">
                  <div
                    className="truncate text-[15px] font-medium uppercase tracking-[0.01em]"
                    style={{ ...displayF, color: C.ink }}
                  >
                    {c.naam}
                  </div>
                  <div className="mt-0.5 text-[12px]" style={{ ...monoF, color: C.inkSoft }}>
                    {c.detail}
                  </div>
                </div>
                <StatusTag status={c.status} />
                {actionable && (
                  <button
                    className="text-[11px] uppercase tracking-[0.1em] transition-colors hover:text-black focus-visible:outline-none focus-visible:ring-2"
                    style={{ ...monoF, color: C.accent, ["--tw-ring-color" as string]: C.accent }}
                  >
                    {c.status === "EXPIRING"
                      ? "Vernieuwen →"
                      : c.status === "REJECTED"
                        ? "Opnieuw →"
                        : "Bekijk →"}
                  </button>
                )}
              </li>
            );
          })}
        </ul>
      </section>
    </div>
  );
}

// ── Acties ──────────────────────────────────────────────────────────────────────────
function Acties({ onFacturen }: { onFacturen: () => void }) {
  const sorted = [...ACTIES].sort((a, b) =>
    a.urgentie === b.urgentie ? 0 : a.urgentie === "warning" ? -1 : 1,
  );
  return (
    <div className="space-y-12">
      <div>
        <Cap style={{ letterSpacing: "0.2em" }}>Acties · op urgentie</Cap>
        <div className="mt-3 flex items-baseline gap-3">
          <Numeral value={String(ACTIES.length)} className="text-[80px]" accent />
          <span
            className="text-[15px] uppercase tracking-[0.04em]"
            style={{ ...displayF, color: C.ink }}
          >
            openstaande acties
          </span>
        </div>
      </div>

      <ol className="space-y-0">
        {sorted.map((a, i) => {
          const warn = a.urgentie === "warning";
          return (
            <li key={a.titel} className="border-b py-6" style={{ borderColor: C.line }}>
              <div className="flex items-start gap-5">
                <span className="w-[64px] shrink-0">
                  <Numeral
                    value={String(i + 1).padStart(2, "0")}
                    className="text-[46px]"
                    accent={warn}
                  />
                </span>
                <div className="min-w-0 flex-1">
                  <span
                    className="inline-flex items-center gap-1.5 text-[10.5px] uppercase tracking-[0.14em]"
                    style={{ ...monoF, color: warn ? C.accent : C.wait }}
                  >
                    {warn ? (
                      <TriangleAlert size={12} strokeWidth={2.4} aria-hidden="true" />
                    ) : (
                      <Star size={12} strokeWidth={2.4} aria-hidden="true" />
                    )}
                    {warn ? "Urgent" : "Kans"}
                  </span>
                  <h3
                    className="mt-1.5 text-[17px] font-medium uppercase tracking-[0.01em]"
                    style={{ ...displayF, color: C.ink }}
                  >
                    {a.titel}
                  </h3>
                  <p
                    className="mt-1.5 max-w-xl text-[12.5px] leading-relaxed"
                    style={{ ...monoF, color: C.inkSoft }}
                  >
                    {a.detail}
                  </p>
                  <button
                    onClick={onFacturen}
                    className="mt-3 inline-flex items-center gap-2 px-4 py-2 text-[12px] font-medium uppercase tracking-[0.06em] transition-transform hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
                    style={
                      warn
                        ? {
                            ...displayF,
                            background: C.accent,
                            color: "#fff",
                            ["--tw-ring-color" as string]: C.accent,
                            ["--tw-ring-offset-color" as string]: C.bg,
                          }
                        : {
                            ...displayF,
                            color: C.ink,
                            boxShadow: `inset 0 0 0 1.5px ${C.lineStrong}`,
                            ["--tw-ring-color" as string]: C.accent,
                            ["--tw-ring-offset-color" as string]: C.bg,
                          }
                    }
                  >
                    {a.cta} <ArrowRight size={13} aria-hidden="true" />
                  </button>
                </div>
              </div>
            </li>
          );
        })}
      </ol>

      {/* Berichten */}
      <section>
        <Rule
          index="02"
          title="Recente berichten"
          meta={`${BERICHTEN.filter((b) => b.ongelezen).length} ongelezen`}
        />
        <ul className="mt-2">
          {BERICHTEN.map((b) => (
            <li
              key={b.van}
              className="flex items-center gap-4 border-b py-4"
              style={{ borderColor: C.line }}
            >
              <span
                className="flex h-9 w-9 shrink-0 items-center justify-center text-[11px] font-medium"
                style={{ ...displayF, background: C.ink, color: C.bg }}
                aria-hidden="true"
              >
                {b.initialen}
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span
                    className="truncate text-[14px] font-medium uppercase tracking-[0.01em]"
                    style={{ ...displayF, color: C.ink }}
                  >
                    {b.van}
                  </span>
                  {b.ongelezen && (
                    <span
                      className="h-1.5 w-1.5 shrink-0 rounded-full"
                      style={{ background: C.accent }}
                      aria-label="Ongelezen"
                    />
                  )}
                </div>
                <p className="mt-0.5 truncate text-[12px]" style={{ ...monoF, color: C.inkSoft }}>
                  {b.preview}
                </p>
              </div>
              <span
                className="shrink-0 text-[11px] tabular-nums"
                style={{ ...monoF, color: C.inkFaint }}
              >
                {b.tijd}
              </span>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}

// ── Facturen ────────────────────────────────────────────────────────────────────────
function Facturen() {
  const factMeta = (status: string): { label: string; Icon: LucideIcon; fg: string } => {
    if (status === "Betaald") return { label: "Betaald", Icon: Check, fg: C.ok };
    if (status === "Openstaand") return { label: "Openstaand", Icon: Clock, fg: C.warn };
    return { label: "Concept", Icon: FileText, fg: C.inkFaint };
  };
  const betaald = "€ 8.622";
  const open = FACTUREN.filter((f) => f.status === "Openstaand").length;

  return (
    <div className="space-y-12">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <Cap style={{ letterSpacing: "0.2em" }}>Facturen · deze maand</Cap>
          <div className="mt-2">
            <Numeral value={betaald} className="text-[64px] sm:text-[88px]" />
            <Cap className="mt-2">Ontvangen omzet</Cap>
          </div>
        </div>
        <button
          className="inline-flex items-center gap-2 px-4 py-2.5 text-[12px] font-medium uppercase tracking-[0.06em] transition-transform hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
          style={{
            ...displayF,
            background: C.ink,
            color: C.bg,
            ["--tw-ring-color" as string]: C.accent,
            ["--tw-ring-offset-color" as string]: C.bg,
          }}
        >
          <Plus size={14} aria-hidden="true" /> Nieuwe factuur
        </button>
      </div>

      <section className="grid grid-cols-1 gap-8 sm:grid-cols-3">
        {[
          { l: "Openstaand", v: `€ 1.350` },
          { l: "Aantal open", v: String(open) },
          { l: "Te factureren", v: "€ 1.350" },
        ].map((s) => (
          <div key={s.l} className="border-t-2 pt-3" style={{ borderColor: C.lineStrong }}>
            <Numeral value={s.v} className="text-[36px] sm:text-[44px]" />
            <Cap className="mt-3">{s.l}</Cap>
          </div>
        ))}
      </section>

      <section>
        <Rule index="01" title="Factuuroverzicht" meta={`${FACTUREN.length} facturen`} />
        <div className="mt-2 overflow-x-auto">
          <table className="w-full min-w-[560px] border-collapse text-left">
            <thead>
              <tr className="border-b-2" style={{ borderColor: C.lineStrong }}>
                {["Nr", "Nummer", "Klant", "Datum", "Status", "Bedrag"].map((h, i) => (
                  <th
                    key={h}
                    className={`py-2.5 pr-4 text-[10px] uppercase tracking-[0.12em] ${i === 5 ? "text-right" : ""}`}
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
                  <tr
                    key={f.nr}
                    className="border-b transition-colors hover:bg-[#f2f0e8]"
                    style={{ borderColor: C.line }}
                  >
                    <td
                      className="py-4 pr-4 text-[13px] tabular-nums"
                      style={{ ...monoF, color: C.inkFaint }}
                    >
                      {String(i + 1).padStart(2, "0")}
                    </td>
                    <td
                      className="py-4 pr-4 text-[13px] font-medium tabular-nums"
                      style={{ ...displayF, color: C.ink }}
                    >
                      {f.nr}
                    </td>
                    <td className="py-4 pr-4 text-[12.5px]" style={{ ...monoF, color: C.inkSoft }}>
                      {f.klant}
                    </td>
                    <td
                      className="py-4 pr-4 text-[12px] tabular-nums"
                      style={{ ...monoF, color: C.inkFaint }}
                    >
                      {f.datum}
                    </td>
                    <td className="py-4 pr-4">
                      <span
                        className="inline-flex items-center gap-1.5 text-[10.5px] uppercase tracking-[0.1em]"
                        style={{ ...monoF, color: m.fg }}
                      >
                        <m.Icon size={12} strokeWidth={2.2} aria-hidden="true" /> {m.label}
                      </span>
                    </td>
                    <td
                      className="py-4 text-right text-[16px] font-medium tabular-nums"
                      style={{ ...displayF, color: C.ink }}
                    >
                      {f.bedrag}
                    </td>
                  </tr>
                );
              })}
            </tbody>
            <tfoot>
              <tr className="border-t-2" style={{ borderColor: C.lineStrong }}>
                <td
                  colSpan={5}
                  className="py-4 text-[10.5px] uppercase tracking-[0.14em]"
                  style={{ ...monoF, color: C.inkFaint }}
                >
                  Totaal ontvangen
                </td>
                <td
                  className="py-4 text-right text-[22px] font-medium tabular-nums"
                  style={{ ...displayF, color: C.accent }}
                >
                  {betaald}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </section>
    </div>
  );
}
