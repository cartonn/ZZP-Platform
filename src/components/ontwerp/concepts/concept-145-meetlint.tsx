"use client";

// Concept 145 — "Meetlint" · technische maatvoering / ingenieurstekening-esthetiek. Alles is
// opgemeten en geannoteerd met afmetingen: liniaal-schaalverdelingen, maatlijnen met pijltjes en
// maatgetallen, tolerantie-notatie (bv. 94 ±2), en hairline-constructielijnen die datapunten
// "opmeten". Een match van 94% wordt getoond als een gemeten segment met maatlijn. Technisch, precies,
// licht (tekenpapier/wit) met één technisch accent (#d64500). Onderscheidend van blauwdruk (cyaan
// raster) en meter (gauges): dit gaat over MATEN/dimensionering. Deterministisch — geen random/Date.
// Fonts: JetBrains Mono (maten/annotatie) + Geist (UI).

import { useState } from "react";
import {
  ArrowRight,
  Check,
  Clock,
  AlertTriangle,
  XCircle,
  Search,
  Ruler,
  MapPin,
  Coins,
  CalendarDays,
  ShieldCheck,
  Crosshair,
  Plus,
  Gauge,
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

// ── Palet — tekenpapier, grafiet-inkt, één technisch accent (#d64500) ─────────────
const C = {
  bg: "#f5f4f0",
  panel: "#ffffff",
  paper: "#faf9f5",
  ink: "#1b1b18",
  inkSoft: "#585850",
  inkFaint: "#9b9a8f",
  line: "#e6e4dc",
  lineStrong: "#c8c6bb",
  accent: "#d64500", // technisch oranje — het maat-accent
  accentSoft: "#fbe7dc",
  ok: "#2f7d5b",
  warn: "#b26a00",
  bad: "#b3402f",
  info: "#3f6ea8",
};

const ui = { fontFamily: "var(--font-lab-geist)" };
const mono = { fontFamily: "var(--font-lab-mono)" };

// Hairline drafting-grid als achtergrond.
const draftGrid =
  "linear-gradient(0deg, rgba(27,27,24,0.035) 1px, transparent 1px)," +
  "linear-gradient(90deg, rgba(27,27,24,0.035) 1px, transparent 1px)";

// ── Kernprimitief: een gemeten maatbalk met maatlijn, pijltjes & maatgetal ────────
// value = 0..100. De maatlijn loopt van 0 tot value; pijltjes wijzen naar de
// extensielijnen; het maatgetal (met tolerantie) staat boven de lijn.
function DimBar({
  value,
  tolerance = 2,
  unit = "%",
}: {
  value: number;
  tolerance?: number;
  unit?: string;
}) {
  const clamped = Math.max(0, Math.min(100, value));
  return (
    <div className="w-full select-none">
      {/* Maatlijn-laag */}
      <div className="relative h-6">
        {/* extensielijn bij 0 */}
        <span
          className="absolute bottom-0 left-0 h-6 w-px"
          style={{ background: C.lineStrong }}
          aria-hidden="true"
        />
        {/* extensielijn bij value */}
        <span
          className="absolute bottom-0 h-6 w-px"
          style={{ left: `${clamped}%`, background: C.accent }}
          aria-hidden="true"
        />
        {/* maatlijn 0 → value */}
        <span
          className="absolute bottom-1.5 left-0 h-px"
          style={{ width: `${clamped}%`, background: C.accent }}
          aria-hidden="true"
        />
        {/* pijlpunt links (wijst naar buiten/links) */}
        <span
          className="absolute bottom-1.5 left-0 -translate-y-1/2"
          style={{
            borderTop: "3px solid transparent",
            borderBottom: "3px solid transparent",
            borderRight: `5px solid ${C.accent}`,
          }}
          aria-hidden="true"
        />
        {/* pijlpunt rechts (wijst naar buiten/rechts) */}
        <span
          className="absolute bottom-1.5 -translate-y-1/2"
          style={{
            left: `calc(${clamped}% - 5px)`,
            borderTop: "3px solid transparent",
            borderBottom: "3px solid transparent",
            borderLeft: `5px solid ${C.accent}`,
          }}
          aria-hidden="true"
        />
        {/* maatgetal + tolerantie */}
        <span
          className="absolute bottom-2.5 whitespace-nowrap rounded-[2px] px-1 text-[11px] font-semibold tabular-nums"
          style={{
            ...mono,
            left: `${clamped / 2}%`,
            transform: "translateX(-50%)",
            background: C.panel,
            color: C.accent,
          }}
        >
          {clamped}
          <span style={{ color: C.inkFaint }}>
            {" "}
            ±{tolerance} {unit}
          </span>
        </span>
      </div>

      {/* Materiaal-balk (het opgemeten object) */}
      <div
        className="relative h-2.5 overflow-hidden rounded-[2px]"
        style={{ background: C.paper, border: `1px solid ${C.line}` }}
      >
        <div
          className="h-full"
          style={{
            width: `${clamped}%`,
            background: `repeating-linear-gradient(45deg, ${C.accent} 0, ${C.accent} 1px, ${C.accentSoft} 1px, ${C.accentSoft} 5px)`,
            borderRight: `1.5px solid ${C.accent}`,
          }}
          aria-hidden="true"
        />
      </div>

      {/* Liniaal-schaalverdeling */}
      <div className="relative mt-1 h-3.5" aria-hidden="true">
        {Array.from({ length: 11 }, (_, i) => i * 10).map((t) => (
          <span
            key={t}
            className="absolute top-0 w-px"
            style={{ left: `${t}%`, height: t % 50 === 0 ? 8 : 5, background: C.lineStrong }}
          />
        ))}
        <span
          className="absolute left-0 top-[9px] text-[8px] tabular-nums"
          style={{ ...mono, color: C.inkFaint }}
        >
          0
        </span>
        <span
          className="absolute left-1/2 top-[9px] -translate-x-1/2 text-[8px] tabular-nums"
          style={{ ...mono, color: C.inkFaint }}
        >
          50
        </span>
        <span
          className="absolute right-0 top-[9px] text-[8px] tabular-nums"
          style={{ ...mono, color: C.inkFaint }}
        >
          100
        </span>
      </div>
    </div>
  );
}

// Hoek-haakjes rond een paneel — tekening-registermarkeringen.
function Panel({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <section
      className={`relative rounded-[3px] ${className}`}
      style={{ background: C.panel, border: `1px solid ${C.lineStrong}` }}
    >
      {children}
    </section>
  );
}

function PanelHead({
  children,
  Icon,
  code,
  right,
}: {
  children: React.ReactNode;
  Icon?: LucideIcon;
  code?: string;
  right?: React.ReactNode;
}) {
  return (
    <div
      className="flex items-center justify-between gap-2 border-b px-4 py-2.5"
      style={{ borderColor: C.line }}
    >
      <div className="flex min-w-0 items-center gap-2">
        {Icon && <Icon size={14} strokeWidth={2} style={{ color: C.accent }} aria-hidden="true" />}
        {code && (
          <span
            className="rounded-[2px] px-1.5 py-0.5 text-[9px] font-bold tabular-nums tracking-[0.1em]"
            style={{
              ...mono,
              background: C.paper,
              color: C.inkFaint,
              border: `1px solid ${C.line}`,
            }}
          >
            {code}
          </span>
        )}
        <h2
          className="truncate text-[12.5px] font-semibold uppercase tracking-[0.06em]"
          style={{ color: C.ink }}
        >
          {children}
        </h2>
      </div>
      {right}
    </div>
  );
}

function credMeta(s: CredStatus): { label: string; Icon: LucideIcon; tone: string; maat: number } {
  switch (s) {
    case "VERIFIED":
      return { label: "Geverifieerd", Icon: Check, tone: C.ok, maat: 100 };
    case "SUBMITTED":
      return { label: "In beoordeling", Icon: Clock, tone: C.info, maat: 60 };
    case "EXPIRING":
      return { label: "Verloopt binnenkort", Icon: AlertTriangle, tone: C.warn, maat: 78 };
    case "REJECTED":
      return { label: "Afgewezen", Icon: XCircle, tone: C.bad, maat: 15 };
  }
}

// ── Root ──────────────────────────────────────────────────────────────────────────
export function Concept145() {
  const [screen, setScreen] = useState<ScreenKey>("dashboard");
  const active = OPDRACHTEN[0] as Opdracht;

  return (
    <div
      className="min-h-screen w-full antialiased"
      style={{
        ...ui,
        background: C.bg,
        backgroundImage: draftGrid,
        backgroundSize: "24px 24px",
        color: C.ink,
      }}
    >
      <header
        className="sticky top-0 z-20 flex items-center justify-between gap-3 px-4 py-3 md:px-6"
        style={{
          background: "rgba(245,244,240,0.92)",
          borderBottom: `1px solid ${C.lineStrong}`,
          backdropFilter: "blur(8px)",
        }}
      >
        <div className="flex min-w-0 items-center gap-3">
          <span
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[3px]"
            style={{ background: C.accentSoft, border: `1px solid ${C.accent}` }}
            aria-hidden="true"
          >
            <Ruler size={17} strokeWidth={2} style={{ color: C.accent }} />
          </span>
          <div className="leading-tight">
            <div className="text-[15px] font-semibold tracking-[-0.01em]">Meetlint</div>
            <div
              className="text-[9.5px] font-bold uppercase tracking-[0.2em]"
              style={{ ...mono, color: C.inkFaint }}
            >
              Maatvoering · schaal 1:1
            </div>
          </div>
        </div>
        {/* Mini titelblok, ingenieurstekening-stijl */}
        <div className="flex items-center gap-3">
          <div
            className="hidden overflow-hidden rounded-[2px] text-[9px] sm:flex"
            style={{ ...mono, border: `1px solid ${C.lineStrong}` }}
          >
            <TitleField label="Blad" value="01/06" />
            <TitleField label="Getekend" value={PROFIEL.initialen} border />
            <TitleField label="Rev" value="A" border />
          </div>
          <span
            className="flex h-9 w-9 items-center justify-center rounded-[3px] text-[11px] font-bold"
            style={{
              ...mono,
              background: C.paper,
              border: `1px solid ${C.lineStrong}`,
              color: C.accent,
            }}
            aria-hidden="true"
          >
            {PROFIEL.initialen}
          </span>
        </div>
      </header>

      <nav
        className="flex items-center gap-1 overflow-x-auto px-4 py-2 md:px-6"
        aria-label="Schermen"
        style={{ borderBottom: `1px solid ${C.line}` }}
      >
        {SCREENS.map((s, i) => {
          const on = s.key === screen;
          return (
            <button
              key={s.key}
              onClick={() => setScreen(s.key)}
              aria-current={on ? "page" : undefined}
              className="shrink-0 rounded-[3px] px-3 py-1.5 text-[12px] font-semibold uppercase tracking-[0.06em] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-1"
              style={{
                ...mono,
                color: on ? C.panel : C.inkSoft,
                background: on ? C.accent : "transparent",
                border: `1px solid ${on ? C.accent : C.line}`,
              }}
            >
              <span style={{ color: on ? "rgba(255,255,255,0.7)" : C.inkFaint }}>
                {String(i + 1).padStart(2, "0")}
              </span>{" "}
              {s.label}
            </button>
          );
        })}
      </nav>

      <main className="px-4 py-5 md:px-6 md:py-6">
        {screen === "dashboard" && (
          <Dashboard
            onOpen={() => setScreen("opdracht")}
            onQueue={() => setScreen("verificatie")}
          />
        )}
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

function TitleField({ label, value, border }: { label: string; value: string; border?: boolean }) {
  return (
    <div className="px-2 py-1" style={border ? { borderLeft: `1px solid ${C.line}` } : undefined}>
      <div
        className="text-[7.5px] font-bold uppercase tracking-[0.14em]"
        style={{ color: C.inkFaint }}
      >
        {label}
      </div>
      <div className="text-[10px] font-bold tabular-nums" style={{ color: C.ink }}>
        {value}
      </div>
    </div>
  );
}

// ── Dashboard ──────────────────────────────────────────────────────────────────────
function Dashboard({ onOpen, onQueue }: { onOpen: () => void; onQueue: () => void }) {
  // Normaliseer KPI-spark naar 0..100 voor een gemeten index-balk.
  const barVal = (spark: number[]): number => {
    const max = Math.max(...spark);
    const min = Math.min(...spark);
    if (max === min) return 60;
    const last = spark[spark.length - 1] ?? 0;
    return Math.round(((last - min) / (max - min)) * 100);
  };

  return (
    <div className="space-y-5">
      {/* KPI-rij met gemeten index-balken */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {KPIS.map((k) => (
          <Panel key={k.label} className="p-4">
            <div className="flex items-center justify-between">
              <span
                className="text-[10px] font-bold uppercase tracking-[0.1em]"
                style={{ ...mono, color: C.inkFaint }}
              >
                {k.label}
              </span>
              <span
                className="text-[10.5px] font-bold tabular-nums"
                style={{ ...mono, color: k.up ? C.ok : C.warn }}
              >
                {k.up ? "▲" : "▼"} {k.trend}
              </span>
            </div>
            <div
              className="mt-1.5 text-[24px] font-semibold tabular-nums leading-none tracking-[-0.02em]"
              style={mono}
            >
              {k.value}
            </div>
            <div className="mt-4">
              <DimBar value={barVal(k.spark)} tolerance={3} unit="idx" />
            </div>
          </Panel>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-5 xl:grid-cols-3">
        {/* Match-dimensionering per opdracht */}
        <Panel className="xl:col-span-2">
          <PanelHead Icon={Crosshair} code="M-01">
            Match-dimensionering
          </PanelHead>
          <ul className="divide-y" style={{ borderColor: C.line }}>
            {OPDRACHTEN.map((o) => (
              <li key={o.id}>
                <button
                  onClick={onOpen}
                  className="w-full px-4 py-3.5 text-left transition-colors hover:bg-[#faf9f5] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset"
                  style={{ outlineColor: C.accent }}
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <span
                        className="text-[9.5px] font-bold uppercase tracking-[0.12em]"
                        style={{ ...mono, color: C.inkFaint }}
                      >
                        {o.id}
                      </span>
                      <div className="truncate text-[14px] font-semibold" style={{ color: C.ink }}>
                        {o.titel}
                      </div>
                      <div className="truncate text-[11.5px]" style={{ color: C.inkFaint }}>
                        {o.opdrachtgever} · {o.plaats}
                      </div>
                    </div>
                    <ArrowRight
                      size={15}
                      className="shrink-0"
                      style={{ color: C.inkFaint }}
                      aria-hidden="true"
                    />
                  </div>
                  <div className="mt-3">
                    <DimBar value={o.match} tolerance={2} />
                  </div>
                </button>
              </li>
            ))}
          </ul>
        </Panel>

        {/* Aandacht-actie + dekking-maat */}
        <div className="space-y-5">
          <Panel className="flex flex-col justify-between p-4">
            <div>
              <div className="flex items-center gap-2">
                <AlertTriangle
                  size={15}
                  strokeWidth={2.2}
                  style={{ color: C.warn }}
                  aria-hidden="true"
                />
                <span
                  className="text-[10px] font-bold uppercase tracking-[0.12em]"
                  style={{ ...mono, color: C.warn }}
                >
                  Prioriteit 01
                </span>
              </div>
              <h3 className="mt-3 text-[15px] font-semibold leading-snug tracking-[-0.01em]">
                {ACTIES[0]?.titel}
              </h3>
              <p className="mt-1.5 text-[12.5px] leading-relaxed" style={{ color: C.inkSoft }}>
                {ACTIES[0]?.detail}
              </p>
            </div>
            <button
              onClick={onQueue}
              className="mt-4 inline-flex items-center justify-center gap-2 rounded-[3px] px-4 py-2.5 text-[13px] font-semibold text-white transition-transform hover:scale-[1.01] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-1"
              style={{ background: C.accent }}
            >
              {ACTIES[0]?.cta} <ArrowRight size={15} aria-hidden="true" />
            </button>
          </Panel>

          <Panel className="p-4">
            <div className="flex items-center gap-2">
              <Gauge size={15} strokeWidth={2} style={{ color: C.accent }} aria-hidden="true" />
              <span
                className="text-[10px] font-bold uppercase tracking-[0.1em]"
                style={{ ...mono, color: C.inkFaint }}
              >
                Verificatie-dekking
              </span>
            </div>
            <div className="mt-3">
              <DimBar
                value={Math.round(
                  (CREDENTIALS.filter((c) => c.status === "VERIFIED").length / CREDENTIALS.length) *
                    100,
                )}
                tolerance={0}
              />
            </div>
          </Panel>
        </div>
      </div>
    </div>
  );
}

// ── Marktplaats ─────────────────────────────────────────────────────────────────────
function Marktplaats({ onOpen }: { onOpen: () => void }) {
  const [q, setQ] = useState("");
  const filtered = OPDRACHTEN.filter(
    (o) =>
      o.titel.toLowerCase().includes(q.toLowerCase()) ||
      o.plaats.toLowerCase().includes(q.toLowerCase()) ||
      o.opdrachtgever.toLowerCase().includes(q.toLowerCase()),
  );

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-[16px] font-semibold uppercase tracking-[0.04em]">Marktplaats</h2>
        <div
          className="flex items-center gap-2 rounded-[3px] px-3 py-1.5"
          style={{ background: C.panel, border: `1px solid ${C.lineStrong}` }}
        >
          <Search size={15} style={{ color: C.inkFaint }} aria-hidden="true" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Filter op titel, plaats…"
            aria-label="Opdrachten filteren"
            className="w-44 bg-transparent text-[13px] outline-none placeholder:opacity-60"
            style={{ color: C.ink }}
          />
        </div>
      </div>

      {filtered.length === 0 ? (
        <Panel className="flex flex-col items-center justify-center gap-3 p-14 text-center">
          <span
            className="flex h-12 w-12 items-center justify-center rounded-[3px]"
            style={{ background: C.paper, color: C.inkFaint }}
            aria-hidden="true"
          >
            <Search size={22} />
          </span>
          <p className="text-[14px] font-semibold">Geen opdrachten gevonden</p>
          <p className="max-w-xs text-[12.5px]" style={{ color: C.inkSoft }}>
            Geen resultaat voor “{q}”. Pas je filter aan.
          </p>
          <button
            onClick={() => setQ("")}
            className="mt-1 rounded-[3px] px-4 py-2 text-[12.5px] font-semibold text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-1"
            style={{ background: C.accent }}
          >
            Filter wissen
          </button>
        </Panel>
      ) : (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          {filtered.map((o) => (
            <Panel key={o.id} className="flex flex-col p-4">
              <div className="flex items-start justify-between gap-2">
                <span
                  className="text-[9.5px] font-bold uppercase tracking-[0.12em]"
                  style={{ ...mono, color: C.inkFaint }}
                >
                  {o.id}
                </span>
                <span
                  className="rounded-[2px] px-1.5 py-0.5 text-[10px] font-bold tabular-nums"
                  style={{
                    ...mono,
                    background: C.accentSoft,
                    color: C.accent,
                    border: `1px solid ${C.accent}`,
                  }}
                >
                  {o.match} ±2 %
                </span>
              </div>
              <h3 className="mt-1.5 text-[14.5px] font-semibold leading-snug tracking-[-0.01em]">
                {o.titel}
              </h3>
              <p className="mt-0.5 text-[12px]" style={{ color: C.inkSoft }}>
                {o.opdrachtgever} · {o.plaats}
              </p>

              <div className="mt-3">
                <DimBar value={o.match} tolerance={2} />
              </div>

              <dl className="mt-3 grid grid-cols-2 gap-2 text-[12px]">
                <DimSpec label="Tarief" value={o.tarief} />
                <DimSpec label="Omvang" value={o.uren} />
                <DimSpec label="Start" value={o.start} />
                <DimSpec label="Plaats" value={o.plaats} />
              </dl>

              <div className="mt-3 flex flex-wrap gap-1">
                {o.tags.map((t) => (
                  <span
                    key={t}
                    className="rounded-[2px] px-2 py-0.5 text-[10.5px] font-medium"
                    style={{
                      ...mono,
                      background: C.paper,
                      color: C.inkSoft,
                      border: `1px solid ${C.line}`,
                    }}
                  >
                    {t}
                  </span>
                ))}
              </div>

              <button
                onClick={onOpen}
                className="mt-3 inline-flex items-center justify-center gap-1.5 rounded-[3px] px-3 py-2 text-[12px] font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-1"
                style={{
                  background: C.paper,
                  color: C.accent,
                  border: `1px solid ${C.lineStrong}`,
                }}
              >
                Opmeten &amp; bekijken <ArrowRight size={13} aria-hidden="true" />
              </button>
            </Panel>
          ))}
        </div>
      )}
    </div>
  );
}

function DimSpec({ label, value }: { label: string; value: string }) {
  return (
    <div
      className="rounded-[2px] px-2 py-1.5"
      style={{ background: C.paper, border: `1px solid ${C.line}` }}
    >
      <dt
        className="text-[8.5px] font-bold uppercase tracking-[0.1em]"
        style={{ ...mono, color: C.inkFaint }}
      >
        {label}
      </dt>
      <dd className="text-[12.5px] font-semibold tabular-nums" style={{ ...mono, color: C.ink }}>
        {value}
      </dd>
    </div>
  );
}

// ── Opdracht-detail ─────────────────────────────────────────────────────────────────
function OpdrachtDetail({ opdracht, onBack }: { opdracht: Opdracht; onBack: () => void }) {
  const feiten: { l: string; v: string; Icon: LucideIcon }[] = [
    { l: "Tarief", v: opdracht.tarief, Icon: Coins },
    { l: "Omvang", v: opdracht.uren, Icon: Clock },
    { l: "Start", v: opdracht.start, Icon: CalendarDays },
    { l: "Plaats", v: opdracht.plaats, Icon: MapPin },
  ];

  return (
    <div className="space-y-5">
      <button
        onClick={onBack}
        className="inline-flex items-center gap-2 text-[12.5px] font-semibold uppercase tracking-[0.06em] transition-opacity hover:opacity-70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-1"
        style={{ ...mono, color: C.inkSoft }}
      >
        <ArrowRight size={14} className="rotate-180" aria-hidden="true" /> Terug
      </button>

      <Panel className="p-5">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="min-w-0">
            <span
              className="text-[10px] font-bold uppercase tracking-[0.12em]"
              style={{ ...mono, color: C.inkFaint }}
            >
              {opdracht.id}
            </span>
            <h1 className="mt-1 text-[24px] font-semibold leading-tight tracking-[-0.02em] sm:text-[27px]">
              {opdracht.titel}
            </h1>
            <p className="mt-1 text-[13px]" style={{ color: C.inkSoft }}>
              {opdracht.opdrachtgever} · {opdracht.plaats}
            </p>
          </div>
          <div
            className="rounded-[3px] px-3 py-2 text-right"
            style={{ background: C.accentSoft, border: `1px solid ${C.accent}` }}
          >
            <div
              className="text-[9px] font-bold uppercase tracking-[0.14em]"
              style={{ ...mono, color: C.accent }}
            >
              Totaalmaat
            </div>
            <div
              className="text-[26px] font-bold tabular-nums leading-none"
              style={{ ...mono, color: C.accent }}
            >
              {opdracht.match}
              <span className="text-[13px]"> ±2 %</span>
            </div>
          </div>
        </div>

        <div className="mt-4">
          <span
            className="text-[10px] font-bold uppercase tracking-[0.1em]"
            style={{ ...mono, color: C.inkFaint }}
          >
            Gemeten totaalmatch
          </span>
          <div className="mt-2">
            <DimBar value={opdracht.match} tolerance={2} />
          </div>
        </div>

        <dl className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {feiten.map((f) => (
            <div
              key={f.l}
              className="rounded-[3px] p-3"
              style={{ background: C.paper, border: `1px solid ${C.line}` }}
            >
              <f.Icon size={14} style={{ color: C.accent }} aria-hidden="true" />
              <dd className="mt-2 text-[15px] font-semibold tabular-nums leading-none" style={mono}>
                {f.v}
              </dd>
              <dt
                className="mt-1.5 text-[9.5px] font-bold uppercase tracking-[0.1em]"
                style={{ ...mono, color: C.inkFaint }}
              >
                {f.l}
              </dt>
            </div>
          ))}
        </dl>
      </Panel>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <Panel>
          <PanelHead Icon={Check} code="+">
            Binnen tolerantie
          </PanelHead>
          <ul className="space-y-2.5 p-4">
            {opdracht.redenen.plus.map((r) => (
              <li
                key={r}
                className="flex items-start gap-2.5 text-[13px] leading-snug"
                style={{ color: C.inkSoft }}
              >
                <Check
                  size={15}
                  strokeWidth={2.6}
                  className="mt-0.5 shrink-0"
                  style={{ color: C.ok }}
                  aria-hidden="true"
                />
                {r}
              </li>
            ))}
          </ul>
        </Panel>
        <Panel>
          <PanelHead Icon={AlertTriangle} code="±">
            Buiten tolerantie
          </PanelHead>
          <ul className="space-y-2.5 p-4">
            {opdracht.redenen.min.map((r) => (
              <li
                key={r}
                className="flex items-start gap-2.5 text-[13px] leading-snug"
                style={{ color: C.inkSoft }}
              >
                <AlertTriangle
                  size={14}
                  strokeWidth={2.6}
                  className="mt-0.5 shrink-0"
                  style={{ color: C.warn }}
                  aria-hidden="true"
                />
                {r}
              </li>
            ))}
          </ul>
        </Panel>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row">
        <button
          className="inline-flex flex-1 items-center justify-center gap-2 rounded-[3px] px-6 py-3 text-[13.5px] font-semibold text-white transition-transform hover:scale-[1.01] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-1"
          style={{ background: C.accent }}
        >
          Reageren op opdracht <ArrowRight size={15} aria-hidden="true" />
        </button>
        <button
          className="inline-flex items-center justify-center gap-2 rounded-[3px] px-5 py-3 text-[13.5px] font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-1"
          style={{ background: C.panel, color: C.ink, border: `1px solid ${C.lineStrong}` }}
        >
          Bewaren
        </button>
      </div>
    </div>
  );
}

// ── Verificatie ─────────────────────────────────────────────────────────────────────
function Verificatie() {
  const verified = CREDENTIALS.filter((c) => c.status === "VERIFIED").length;
  const pct = Math.round((verified / CREDENTIALS.length) * 100);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <ShieldCheck size={17} style={{ color: C.accent }} aria-hidden="true" />
          <h2 className="text-[16px] font-semibold uppercase tracking-[0.04em]">
            Verificatie &amp; certificaten
          </h2>
        </div>
        <div
          className="rounded-[3px] px-3 py-1.5"
          style={{ background: C.panel, border: `1px solid ${C.lineStrong}` }}
        >
          <span
            className="text-[10px] font-bold uppercase tracking-[0.1em]"
            style={{ ...mono, color: C.inkFaint }}
          >
            Dekking{" "}
          </span>
          <span className="text-[13px] font-bold tabular-nums" style={{ ...mono, color: C.accent }}>
            {pct} %
          </span>
        </div>
      </div>

      <Panel>
        <PanelHead Icon={ShieldCheck} code="V-01">
          Certificaten · opgemeten vertrouwen
        </PanelHead>
        <ul className="divide-y" style={{ borderColor: C.line }}>
          {CREDENTIALS.map((c) => {
            const m = credMeta(c.status);
            const actionable = c.status !== "VERIFIED";
            return (
              <li key={c.naam} className="px-4 py-3.5">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="min-w-0">
                    <div className="text-[14px] font-semibold" style={{ color: C.ink }}>
                      {c.naam}
                    </div>
                    <div className="text-[11.5px]" style={{ color: C.inkFaint }}>
                      {c.detail}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span
                      className="inline-flex items-center gap-1.5 rounded-[2px] px-2 py-1 text-[11px] font-semibold"
                      style={{
                        background: `${m.tone}14`,
                        color: m.tone,
                        border: `1px solid ${m.tone}44`,
                      }}
                    >
                      <m.Icon size={13} strokeWidth={2.4} aria-hidden="true" />
                      {m.label}
                    </span>
                    <button
                      disabled={!actionable}
                      className="rounded-[3px] px-3 py-1.5 text-[12px] font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-1 disabled:cursor-not-allowed disabled:opacity-40"
                      style={{
                        background: actionable ? C.accent : C.paper,
                        color: actionable ? "#ffffff" : C.inkFaint,
                        border: `1px solid ${actionable ? C.accent : C.line}`,
                      }}
                    >
                      {actionable ? "Behandelen" : "Afgehandeld"}
                    </button>
                  </div>
                </div>
                <div className="mt-3">
                  <DimBar value={m.maat} tolerance={0} />
                </div>
              </li>
            );
          })}
        </ul>
      </Panel>
    </div>
  );
}

// ── Acties ──────────────────────────────────────────────────────────────────────────
function Acties() {
  const sorted = [...ACTIES].sort((a, b) =>
    a.urgentie === b.urgentie ? 0 : a.urgentie === "warning" ? -1 : 1,
  );
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Crosshair size={17} style={{ color: C.accent }} aria-hidden="true" />
        <h2 className="text-[16px] font-semibold uppercase tracking-[0.04em]">
          Volgende beste acties
        </h2>
      </div>
      <ol className="space-y-3">
        {sorted.map((a, i) => {
          const tone = a.urgentie === "warning" ? C.warn : C.info;
          const maat = a.urgentie === "warning" ? 88 : 60;
          return (
            <li key={a.titel}>
              <Panel className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center">
                <span
                  className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[3px] text-[15px] font-bold tabular-nums"
                  style={{
                    ...mono,
                    background: C.paper,
                    color: C.accent,
                    border: `1px solid ${C.lineStrong}`,
                  }}
                  aria-hidden="true"
                >
                  {String(i + 1).padStart(2, "0")}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span
                      className="inline-flex items-center gap-1 rounded-[2px] px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.08em]"
                      style={{
                        ...mono,
                        background: `${tone}16`,
                        color: tone,
                        border: `1px solid ${tone}44`,
                      }}
                    >
                      {a.urgentie === "warning" ? (
                        <AlertTriangle size={11} strokeWidth={2.6} aria-hidden="true" />
                      ) : (
                        <Crosshair size={11} strokeWidth={2.6} aria-hidden="true" />
                      )}
                      {a.urgentie === "warning" ? "Urgent" : "Kans"}
                    </span>
                    <h3 className="text-[14.5px] font-semibold">{a.titel}</h3>
                  </div>
                  <p className="mt-1 text-[12.5px] leading-relaxed" style={{ color: C.inkSoft }}>
                    {a.detail}
                  </p>
                  <div className="mt-3 max-w-xs">
                    <DimBar value={maat} tolerance={a.urgentie === "warning" ? 0 : 5} unit="prio" />
                  </div>
                </div>
                <button
                  className="shrink-0 self-start rounded-[3px] px-4 py-2 text-[12.5px] font-semibold text-white transition-transform hover:scale-[1.02] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-1 sm:self-center"
                  style={{ background: C.accent }}
                >
                  {a.cta}
                </button>
              </Panel>
            </li>
          );
        })}
      </ol>
    </div>
  );
}

// ── Facturen ────────────────────────────────────────────────────────────────────────
function Facturen() {
  const meta = (status: string): { tone: string } => {
    if (status === "Betaald") return { tone: C.ok };
    if (status === "Openstaand") return { tone: C.warn };
    if (status === "Concept") return { tone: C.inkFaint };
    return { tone: C.info };
  };
  // Bedragen genormaliseerd naar een gemeten balk (index t.o.v. grootste bedrag).
  const parse = (b: string): number => Number(b.replace(/[^\d]/g, "")) || 0;
  const maxBedrag = Math.max(...FACTUREN.map((f) => parse(f.bedrag)));
  const open = FACTUREN.filter((f) => f.status === "Openstaand").length;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Coins size={17} style={{ color: C.accent }} aria-hidden="true" />
          <h2 className="text-[16px] font-semibold uppercase tracking-[0.04em]">Facturen</h2>
        </div>
        <button
          className="inline-flex items-center gap-2 rounded-[3px] px-4 py-2 text-[12.5px] font-semibold text-white transition-transform hover:scale-[1.01] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-1"
          style={{ background: C.accent }}
        >
          <Plus size={14} aria-hidden="true" /> Nieuwe factuur
        </button>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {[
          { l: "Betaald (mnd)", v: "€ 8.622", tone: C.ok },
          { l: "Openstaand", v: `${open}`, tone: C.warn },
          {
            l: "Concept",
            v: `${FACTUREN.filter((f) => f.status === "Concept").length}`,
            tone: C.inkFaint,
          },
        ].map((s) => (
          <Panel key={s.l} className="p-4">
            <span
              className="text-[10px] font-bold uppercase tracking-[0.1em]"
              style={{ ...mono, color: C.inkFaint }}
            >
              {s.l}
            </span>
            <div
              className="mt-1.5 text-[22px] font-semibold tabular-nums leading-none"
              style={{ ...mono, color: s.tone }}
            >
              {s.v}
            </div>
          </Panel>
        ))}
      </div>

      <Panel>
        <PanelHead Icon={Coins} code="F-01">
          Facturen · opgemeten bedragen
        </PanelHead>
        <ul className="divide-y" style={{ borderColor: C.line }}>
          {FACTUREN.map((f) => {
            const m = meta(f.status);
            const idx = maxBedrag ? Math.round((parse(f.bedrag) / maxBedrag) * 100) : 0;
            return (
              <li key={f.nr} className="px-4 py-3.5">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="min-w-0">
                    <span
                      className="text-[11.5px] font-bold tabular-nums"
                      style={{ ...mono, color: C.inkSoft }}
                    >
                      {f.nr}
                    </span>
                    <span className="ml-2 text-[13px] font-medium" style={{ color: C.ink }}>
                      {f.klant}
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span
                      className="inline-flex items-center gap-1.5 rounded-[2px] px-2 py-0.5 text-[11px] font-semibold"
                      style={{
                        background: `${m.tone}14`,
                        color: m.tone,
                        border: `1px solid ${m.tone}44`,
                      }}
                    >
                      <span
                        className="h-1.5 w-1.5 rounded-full"
                        style={{ background: m.tone }}
                        aria-hidden="true"
                      />
                      {f.status}
                    </span>
                    <span
                      className="w-14 text-right text-[10px] tabular-nums"
                      style={{ ...mono, color: C.inkFaint }}
                    >
                      {f.datum}
                    </span>
                    <span
                      className="w-20 text-right text-[14px] font-semibold tabular-nums"
                      style={mono}
                    >
                      {f.bedrag}
                    </span>
                  </div>
                </div>
                <div className="mt-3">
                  <DimBar value={idx} tolerance={0} unit="idx" />
                </div>
              </li>
            );
          })}
        </ul>
        <div
          className="flex items-center justify-between border-t px-4 py-3"
          style={{ borderColor: C.lineStrong }}
        >
          <span
            className="text-[10px] font-bold uppercase tracking-[0.12em]"
            style={{ ...mono, color: C.inkFaint }}
          >
            Totaal betaald
          </span>
          <span className="text-[16px] font-bold tabular-nums" style={{ ...mono, color: C.ok }}>
            € 8.622
          </span>
        </div>
      </Panel>
    </div>
  );
}
