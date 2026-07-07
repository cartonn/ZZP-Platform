"use client";

// Concept 158 — "Raamwerk" · technisch-tekenwerk-UI. Elke module toont zijn constructielijnen:
// haarfijne rasters, hoek-registratie-ticks (crop marks), meetlijn-annotaties en sectie-labelnummers
// — alsof je naar het bouwtekening-raster van de interface kijkt. Neutraal licht palet (papierwit /
// inkt) met één technisch accent (#2563eb) voor de marks. Strak, precies, ingenieurs-esthetiek.
// Onderscheidend van blauwdruk (cyaan-op-blauw negatief): dit is LICHT/neutraal met zichtbare
// constructie-ticks. Status nooit kleur-alleen: label + icoon + patroon. Deterministisch — geen
// random/Date. Fonts: Geist (tekst) + JetBrains Mono (maat/labels/data).

import { useState } from "react";
import {
  ArrowRight,
  ArrowUpRight,
  Check,
  Clock,
  AlertTriangle,
  XCircle,
  Search,
  ShieldCheck,
  Plus,
  MapPin,
  Coins,
  CalendarDays,
  Star,
  FileText,
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
  DOCUMENTEN,
  type ScreenKey,
  type CredStatus,
  type Opdracht,
} from "./mock";

// ── Neutraal palet — papierwit / inkt + één technisch accent ─────────────────────
const C = {
  paper: "#ffffff",
  paper2: "#fafafa",
  paper3: "#f4f4f5",
  ink: "#171717", // primaire inkt
  ink2: "#3f3f46",
  ink3: "#71717a", // secundair
  ink4: "#a1a1aa", // labels
  line: "#e4e4e7", // haarlijn
  lineStrong: "#d4d4d8",
  accent: "#2563eb", // technisch accent (marks/ticks)
  accentSoft: "#dbe4fb",
  warn: "#e5484d", // uitsluitend voor afgewezen/verlopen-status
  warnSoft: "#fbe0e1",
  white: "#ffffff",
};

const sans = { fontFamily: "var(--font-lab-geist)" };
const mono = { fontFamily: "var(--font-lab-mono)" };

// Raster-achtergrond — haarfijn technisch grid (papierwit).
const gridBg = {
  backgroundColor: C.paper2,
  backgroundImage: `linear-gradient(${C.line} 1px, transparent 1px), linear-gradient(90deg, ${C.line} 1px, transparent 1px)`,
  backgroundSize: "26px 26px",
};

// ── Constructie-primitives ───────────────────────────────────────────────────────

// Hoek-registratie-ticks (crop marks) — vier L-vormige hoekmarkeringen in accentkleur.
function CropMarks({ color = C.accent, len = 9 }: { color?: string; len?: number }) {
  const base = "pointer-events-none absolute";
  const style = (extra: React.CSSProperties) => ({ width: len, height: len, ...extra });
  return (
    <>
      <span
        className={`${base} left-[-1px] top-[-1px]`}
        style={style({ borderTop: `1.5px solid ${color}`, borderLeft: `1.5px solid ${color}` })}
        aria-hidden="true"
      />
      <span
        className={`${base} right-[-1px] top-[-1px]`}
        style={style({ borderTop: `1.5px solid ${color}`, borderRight: `1.5px solid ${color}` })}
        aria-hidden="true"
      />
      <span
        className={`${base} bottom-[-1px] left-[-1px]`}
        style={style({ borderBottom: `1.5px solid ${color}`, borderLeft: `1.5px solid ${color}` })}
        aria-hidden="true"
      />
      <span
        className={`${base} bottom-[-1px] right-[-1px]`}
        style={style({ borderBottom: `1.5px solid ${color}`, borderRight: `1.5px solid ${color}` })}
        aria-hidden="true"
      />
    </>
  );
}

// Technisch paneel — hairline-omlijnd vlak met crop marks en optioneel sectie-label.
function Panel({
  children,
  className = "",
  label,
  bg = C.paper,
  marks = true,
  markColor = C.accent,
  interactive = false,
  as = "div",
}: {
  children: React.ReactNode;
  className?: string;
  label?: string;
  bg?: string;
  marks?: boolean;
  markColor?: string;
  interactive?: boolean;
  as?: "div" | "li";
}) {
  const Tag = as;
  return (
    <Tag
      className={`relative ${interactive ? "transition-colors duration-150 hover:bg-[#fafafa]" : ""} ${className}`}
      style={{ background: bg, border: `1px solid ${C.line}` }}
    >
      {marks && <CropMarks color={markColor} />}
      {label && (
        <span
          className="pointer-events-none absolute -top-2 left-3 px-1 text-[9.5px] font-medium uppercase tracking-[0.16em]"
          style={{ ...mono, background: bg, color: C.ink4 }}
          aria-hidden="true"
        >
          {label}
        </span>
      )}
      {children}
    </Tag>
  );
}

// Sectie-kop — labelnummer (§) + meetlijn-achtige onderstreping.
function SectionHead({
  index,
  title,
  action,
}: {
  index: string;
  title: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="mb-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div className="flex items-baseline gap-2.5">
          <span
            className="text-[11px] font-medium tabular-nums tracking-[0.1em]"
            style={{ ...mono, color: C.accent }}
            aria-hidden="true"
          >
            §{index}
          </span>
          <h2
            className="text-[16px] font-semibold tracking-[-0.01em]"
            style={{ ...sans, color: C.ink }}
          >
            {title}
          </h2>
        </div>
        {action}
      </div>
      {/* Meetlijn onder de kop */}
      <div className="mt-2 flex items-center gap-0" aria-hidden="true">
        <span className="h-2 w-px" style={{ background: C.lineStrong }} />
        <span className="h-px flex-1" style={{ background: C.line }} />
        <span className="h-2 w-px" style={{ background: C.lineStrong }} />
      </div>
    </div>
  );
}

// Meetlijn met eindticks en mono-maatlabel (technische dimensie-annotatie).
function DimLine({ label, tone = C.ink3 }: { label: string; tone?: string }) {
  return (
    <div className="flex items-center gap-1.5" aria-hidden="true">
      <span className="h-2.5 w-px" style={{ background: tone }} />
      <span className="relative h-px flex-1" style={{ background: tone }}>
        <span
          className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 whitespace-nowrap px-1 text-[9px] font-medium tracking-[0.08em]"
          style={{ ...mono, color: tone, background: C.paper }}
        >
          {label}
        </span>
      </span>
      <span className="h-2.5 w-px" style={{ background: tone }} />
    </div>
  );
}

// Mini staafgrafiek — technische balkjes met basislijn.
function Bars({ data }: { data: number[] }) {
  const max = Math.max(...data);
  return (
    <div
      className="flex h-8 items-end gap-[3px] border-b"
      style={{ borderColor: C.lineStrong }}
      aria-hidden="true"
    >
      {data.map((v, i) => (
        <span
          key={i}
          className="flex-1"
          style={{
            height: `${Math.max(10, (v / max) * 100)}%`,
            background: i === data.length - 1 ? C.accent : C.lineStrong,
          }}
        />
      ))}
    </div>
  );
}

// ── Status-model — nooit kleur-alleen: label + icoon + rand-patroon ──────────────
type StatusStyle = {
  label: string;
  Icon: LucideIcon;
  bg: string;
  fg: string;
  border: string;
  dashed: boolean;
};
function credMeta(s: CredStatus): StatusStyle {
  switch (s) {
    case "VERIFIED":
      return {
        label: "Geverifieerd",
        Icon: Check,
        bg: C.ink,
        fg: C.white,
        border: C.ink,
        dashed: false,
      };
    case "SUBMITTED":
      return {
        label: "In beoordeling",
        Icon: Clock,
        bg: C.paper,
        fg: C.ink2,
        border: C.lineStrong,
        dashed: false,
      };
    case "EXPIRING":
      return {
        label: "Verloopt binnenkort",
        Icon: AlertTriangle,
        bg: C.accentSoft,
        fg: "#1e40af",
        border: C.accent,
        dashed: false,
      };
    case "REJECTED":
      return {
        label: "Afgewezen",
        Icon: XCircle,
        bg: C.warnSoft,
        fg: "#b42318",
        border: C.warn,
        dashed: true,
      };
  }
}

function StatusTag({ status, size = "md" }: { status: CredStatus; size?: "sm" | "md" }) {
  const m = credMeta(status);
  const pad = size === "sm" ? "px-2 py-0.5 text-[10px]" : "px-2.5 py-1 text-[11px]";
  return (
    <span
      className={`inline-flex items-center gap-1.5 font-medium uppercase tracking-[0.05em] ${pad}`}
      style={{
        ...mono,
        background: m.bg,
        color: m.fg,
        border: `1px ${m.dashed ? "dashed" : "solid"} ${m.border}`,
      }}
    >
      <m.Icon size={12} strokeWidth={2.4} aria-hidden="true" />
      {m.label}
    </span>
  );
}

// Match-cijfer als coördinaat-badge.
function matchAccent(m: number): string {
  return m >= 90 ? C.ink : m >= 85 ? C.ink2 : C.ink3;
}

// ── Root ─────────────────────────────────────────────────────────────────────────
export function Concept158() {
  const [screen, setScreen] = useState<ScreenKey>("dashboard");
  const active = OPDRACHTEN[0] as Opdracht;
  const tabs: { key: ScreenKey; label: string }[] = [
    ...SCREENS,
    { key: "documenten", label: "Documenten" },
  ];

  return (
    <div
      className="min-h-screen w-full overflow-x-hidden antialiased"
      style={{ ...sans, color: C.ink, ...gridBg }}
    >
      {/* Kop — titelblok als tekening-cartouche */}
      <header
        className="sticky top-0 z-20"
        style={{ background: C.paper, borderBottom: `1px solid ${C.lineStrong}` }}
      >
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3 md:px-8">
          <div className="flex items-center gap-3">
            <span
              className="relative flex h-10 w-10 items-center justify-center"
              style={{ border: `1px solid ${C.ink}` }}
              aria-hidden="true"
            >
              <CropMarks color={C.accent} len={6} />
              <Ruler size={17} strokeWidth={2} style={{ color: C.ink }} />
            </span>
            <div className="leading-none">
              <div
                className="text-[15px] font-semibold tracking-[-0.01em]"
                style={{ color: C.ink }}
              >
                Raamwerk
              </div>
              <div
                className="mt-1 text-[10px] font-medium uppercase tracking-[0.16em]"
                style={{ ...mono, color: C.ink4 }}
              >
                Blad 01 · Schaal 1:1 · Werk / Verificatie
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2.5">
            <span
              className="hidden items-center gap-1.5 px-2.5 py-1.5 text-[10.5px] font-medium uppercase tracking-[0.05em] sm:inline-flex"
              style={{ ...mono, color: C.ink2, border: `1px solid ${C.line}` }}
            >
              <ShieldCheck size={13} strokeWidth={2.2} aria-hidden="true" /> {PROFIEL.trust}
            </span>
            <span
              className="relative flex h-9 w-9 items-center justify-center text-[12px] font-semibold"
              style={{ ...sans, color: C.ink, border: `1px solid ${C.lineStrong}` }}
              aria-hidden="true"
            >
              <CropMarks color={C.accent} len={5} />
              {PROFIEL.initialen}
            </span>
          </div>
        </div>

        {/* Scherm-switcher — genummerde technische tabs */}
        <nav
          className="mx-auto flex max-w-6xl items-center gap-0 overflow-x-auto px-4 md:px-8"
          aria-label="Schermen"
          style={{ borderTop: `1px solid ${C.line}` }}
        >
          {tabs.map((s, i) => {
            const on = s.key === screen;
            return (
              <button
                key={s.key}
                onClick={() => setScreen(s.key)}
                aria-current={on ? "page" : undefined}
                className="relative shrink-0 px-3.5 py-2.5 text-[12px] font-medium tracking-[0.01em] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset"
                style={{
                  color: on ? C.ink : C.ink3,
                  background: on ? C.paper2 : "transparent",
                  borderRight: `1px solid ${C.line}`,
                  borderBottom: on ? `2px solid ${C.accent}` : "2px solid transparent",
                  ["--tw-ring-color" as string]: C.accent,
                }}
              >
                <span
                  className="mr-1.5 tabular-nums"
                  style={{ ...mono, color: C.ink4 }}
                  aria-hidden="true"
                >
                  {String(i + 1).padStart(2, "0")}
                </span>
                {s.label}
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
        {screen === "documenten" && <Documenten />}
      </main>
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
    <div className="space-y-7">
      {/* Hero-tekenblok */}
      <Panel label="Bulletin" className="overflow-hidden p-7 sm:p-9" bg={C.paper}>
        <div className="grid gap-6 lg:grid-cols-[1fr_auto] lg:items-center">
          <div className="max-w-2xl">
            <span
              className="inline-flex items-center gap-1.5 px-2 py-1 text-[10px] font-medium uppercase tracking-[0.12em]"
              style={{ ...mono, color: C.accent, border: `1px solid ${C.accentSoft}` }}
            >
              {PROFIEL.rol}
            </span>
            <h1
              className="mt-4 text-[27px] font-semibold leading-[1.08] tracking-[-0.02em] sm:text-[36px]"
              style={{ ...sans, color: C.ink }}
            >
              Drie matches boven 85%. De omzet stijgt.
            </h1>
            <p className="mt-3 max-w-lg text-[14px] leading-relaxed" style={{ color: C.ink3 }}>
              Eén taak vraagt actie: je VOG verloopt binnenkort. Handel het af en blijf
              verifieerbaar.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <button
                onClick={onOpen}
                className="inline-flex items-center gap-2 px-5 py-2.5 text-[13px] font-semibold transition-colors hover:bg-[#0f0f0f] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
                style={{
                  background: C.ink,
                  color: C.white,
                  ["--tw-ring-color" as string]: C.accent,
                  ["--tw-ring-offset-color" as string]: C.paper,
                }}
              >
                Bekijk matches <ArrowRight size={16} aria-hidden="true" />
              </button>
              <button
                onClick={onActies}
                className="inline-flex items-center gap-2 px-5 py-2.5 text-[13px] font-semibold transition-colors hover:bg-[#f4f4f5] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
                style={{
                  background: C.paper,
                  color: C.ink,
                  border: `1px solid ${C.lineStrong}`,
                  ["--tw-ring-color" as string]: C.accent,
                  ["--tw-ring-offset-color" as string]: C.paper,
                }}
              >
                <AlertTriangle size={15} strokeWidth={2.2} aria-hidden="true" /> Los actie op
              </button>
            </div>
          </div>
          {/* Constructie-detail: dekkingsmaat als tekening-annotatie */}
          <div
            className="relative hidden w-56 shrink-0 p-5 lg:block"
            style={{ border: `1px solid ${C.line}` }}
          >
            <CropMarks color={C.accent} />
            <div
              className="text-[10px] font-medium uppercase tracking-[0.14em]"
              style={{ ...mono, color: C.ink4 }}
            >
              Dekking
            </div>
            <div
              className="mt-1 text-[44px] font-semibold leading-none tracking-[-0.03em]"
              style={{ ...sans, color: C.ink }}
            >
              {dek}
              <span className="text-[20px]" style={{ color: C.ink3 }}>
                %
              </span>
            </div>
            <div className="mt-3">
              <DimLine label={`${verified}/${CREDENTIALS.length} geverifieerd`} tone={C.accent} />
            </div>
          </div>
        </div>
      </Panel>

      {/* KPI-panelen */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {KPIS.map((k, idx) => (
          <Panel key={k.label} interactive className="p-4" label={`M-${idx + 1}`}>
            <div className="flex items-center justify-between">
              <span
                className="text-[10px] font-medium uppercase tracking-[0.08em]"
                style={{ ...mono, color: C.ink4 }}
              >
                {k.label}
              </span>
              <span
                className="inline-flex items-center gap-0.5 px-1.5 py-0.5 text-[10px] font-medium"
                style={{
                  ...mono,
                  color: k.up ? C.accent : C.ink3,
                  border: `1px solid ${k.up ? C.accentSoft : C.line}`,
                }}
              >
                {k.up ? (
                  <ArrowUpRight size={11} aria-hidden="true" />
                ) : (
                  <ArrowRight size={11} className="rotate-90" aria-hidden="true" />
                )}
                {k.trend}
              </span>
            </div>
            <div
              className="mt-2 text-[26px] font-semibold leading-none tracking-[-0.02em]"
              style={{ ...sans, color: C.ink }}
            >
              {k.value}
            </div>
            <div className="mt-3">
              <Bars data={k.spark} />
            </div>
          </Panel>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Matches */}
        <div className="lg:col-span-2">
          <SectionHead index="A" title="Aanbevolen matches" />
          <div className="space-y-3">
            {OPDRACHTEN.map((o) => (
              <Panel key={o.id} interactive className="overflow-hidden" marks={false}>
                <button
                  onClick={onOpen}
                  className="flex w-full items-stretch text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset"
                  style={{ ["--tw-ring-color" as string]: C.accent }}
                >
                  <span
                    className="flex w-16 shrink-0 flex-col items-center justify-center"
                    style={{ borderRight: `1px solid ${C.line}`, color: matchAccent(o.match) }}
                    aria-hidden="true"
                  >
                    <span className="text-[20px] font-semibold leading-none" style={sans}>
                      {o.match}
                    </span>
                    <span
                      className="text-[9px] font-medium uppercase tracking-[0.1em]"
                      style={{ ...mono, color: C.ink4 }}
                    >
                      match
                    </span>
                  </span>
                  <div className="min-w-0 flex-1 p-4">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <div
                          className="truncate text-[15px] font-semibold tracking-[-0.01em]"
                          style={{ color: C.ink }}
                        >
                          {o.titel}
                        </div>
                        <div className="mt-0.5 truncate text-[12.5px]" style={{ color: C.ink3 }}>
                          {o.opdrachtgever} · {o.plaats} · {o.tarief}
                        </div>
                      </div>
                      <ArrowRight
                        size={17}
                        className="mt-0.5 shrink-0"
                        style={{ color: C.accent }}
                        aria-hidden="true"
                      />
                    </div>
                    <div className="mt-2.5 flex flex-wrap gap-1.5">
                      {o.redenen.plus.slice(0, 2).map((r) => (
                        <span
                          key={r}
                          className="inline-flex items-center gap-1 px-2 py-0.5 text-[11px] font-medium"
                          style={{ ...mono, color: C.ink2, border: `1px solid ${C.line}` }}
                        >
                          <Check
                            size={11}
                            strokeWidth={2.6}
                            style={{ color: C.accent }}
                            aria-hidden="true"
                          />{" "}
                          {r}
                        </span>
                      ))}
                    </div>
                  </div>
                </button>
              </Panel>
            ))}
          </div>
        </div>

        {/* Rechterkolom */}
        <div>
          <SectionHead index="B" title="Status & prioriteit" />
          <div className="space-y-4">
            <Panel className="p-5" label="V-1">
              <div className="flex items-end justify-between">
                <div
                  className="text-[46px] font-semibold leading-none tracking-[-0.03em]"
                  style={{ ...sans, color: C.ink }}
                >
                  {dek}
                  <span className="text-[20px]" style={{ color: C.ink3 }}>
                    %
                  </span>
                </div>
                <StatusTag status="VERIFIED" size="sm" />
              </div>
              <div className="mt-1.5 text-[12.5px]" style={{ color: C.ink3 }}>
                Dekking certificaten · {verified}/{CREDENTIALS.length} geverifieerd
              </div>
              <div className="mt-3">
                <DimLine label={`${dek}% geverifieerd`} tone={C.accent} />
              </div>
            </Panel>

            <Panel className="p-5" bg={C.ink} marks markColor={C.accent}>
              <span
                className="inline-flex items-center gap-1.5 px-2 py-1 text-[10px] font-medium uppercase tracking-[0.08em]"
                style={{ ...mono, background: C.accent, color: C.white }}
              >
                <AlertTriangle size={12} strokeWidth={2.4} aria-hidden="true" /> Prioriteit
              </span>
              <h3
                className="mt-3 text-[16px] font-semibold leading-tight"
                style={{ ...sans, color: C.white }}
              >
                {warn.titel}
              </h3>
              <p className="mt-1.5 text-[12.5px] leading-relaxed" style={{ color: "#d4d4d8" }}>
                {warn.detail}
              </p>
              <button
                onClick={onActies}
                className="mt-4 inline-flex items-center gap-2 px-4 py-2 text-[12px] font-semibold transition-colors hover:bg-[#1d4fd0] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
                style={{
                  background: C.accent,
                  color: C.white,
                  ["--tw-ring-color" as string]: C.accent,
                  ["--tw-ring-offset-color" as string]: C.ink,
                }}
              >
                {warn.cta} <ArrowRight size={14} aria-hidden="true" />
              </button>
            </Panel>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Marktplaats ──────────────────────────────────────────────────────────────────
function Marktplaats({ onOpen }: { onOpen: () => void }) {
  const [q, setQ] = useState("");
  const filtered = OPDRACHTEN.filter(
    (o) =>
      o.titel.toLowerCase().includes(q.toLowerCase()) ||
      o.plaats.toLowerCase().includes(q.toLowerCase()) ||
      o.opdrachtgever.toLowerCase().includes(q.toLowerCase()),
  );
  return (
    <div>
      <SectionHead
        index="01"
        title="Marktplaats · open opdrachten"
        action={
          <div
            className="flex items-center gap-2 px-3 py-1.5"
            style={{ background: C.paper, border: `1px solid ${C.line}` }}
          >
            <Search size={15} style={{ color: C.ink4 }} aria-hidden="true" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Zoek opdracht…"
              aria-label="Opdrachten zoeken"
              className="w-40 bg-transparent py-0.5 text-[12.5px] outline-none placeholder:opacity-50"
              style={{ color: C.ink }}
            />
          </div>
        }
      />

      {filtered.length === 0 ? (
        <Panel className="flex flex-col items-center justify-center gap-3 p-14 text-center">
          <span
            className="relative flex h-14 w-14 items-center justify-center"
            style={{ border: `1px solid ${C.lineStrong}` }}
            aria-hidden="true"
          >
            <CropMarks color={C.accent} />
            <Search size={24} style={{ color: C.ink3 }} />
          </span>
          <p className="text-[16px] font-semibold" style={{ ...sans, color: C.ink }}>
            Geen resultaat
          </p>
          <p className="max-w-xs text-[13px]" style={{ color: C.ink3 }}>
            Niets gevonden voor “{q}”. Pas je zoekterm aan.
          </p>
          <button
            onClick={() => setQ("")}
            className="mt-1 px-4 py-2 text-[12px] font-semibold transition-colors hover:bg-[#0f0f0f] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
            style={{
              background: C.ink,
              color: C.white,
              ["--tw-ring-color" as string]: C.accent,
              ["--tw-ring-offset-color" as string]: C.paper,
            }}
          >
            Zoekterm wissen
          </button>
        </Panel>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {filtered.map((o, idx) => (
            <Panel
              key={o.id}
              interactive
              className="flex flex-col"
              label={`OPD-${String(idx + 1).padStart(2, "0")}`}
            >
              <div className="flex items-start justify-between gap-3 p-4">
                <div className="min-w-0">
                  <h3
                    className="text-[15px] font-semibold leading-tight tracking-[-0.01em]"
                    style={{ color: C.ink }}
                  >
                    {o.titel}
                  </h3>
                  <p className="mt-1 text-[12px]" style={{ color: C.ink3 }}>
                    {o.opdrachtgever}
                  </p>
                </div>
                <span
                  className="flex h-12 w-12 shrink-0 flex-col items-center justify-center"
                  style={{ border: `1px solid ${C.line}`, color: matchAccent(o.match) }}
                  aria-hidden="true"
                >
                  <span className="text-[16px] font-semibold leading-none" style={sans}>
                    {o.match}
                  </span>
                  <span
                    className="text-[8px] font-medium uppercase"
                    style={{ ...mono, color: C.ink4 }}
                  >
                    match
                  </span>
                </span>
              </div>
              <div className="px-4 pb-3" style={{ borderTop: `1px solid ${C.line}` }}>
                <dl className="mt-3 grid grid-cols-2 gap-y-2 text-[12px]">
                  <Meta Icon={MapPin} value={o.plaats} />
                  <Meta Icon={Coins} value={o.tarief} />
                  <Meta Icon={Clock} value={o.uren} />
                  <Meta Icon={CalendarDays} value={o.start} />
                </dl>
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {o.tags.map((tag) => (
                    <span
                      key={tag}
                      className="px-2 py-0.5 text-[10px] font-medium uppercase tracking-[0.03em]"
                      style={{ ...mono, color: C.ink2, border: `1px solid ${C.line}` }}
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
              <button
                onClick={onOpen}
                className="mt-auto flex items-center justify-center gap-2 py-3 text-[12px] font-semibold transition-colors hover:bg-[#0f0f0f] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset"
                style={{
                  background: C.ink,
                  color: C.white,
                  ["--tw-ring-color" as string]: C.accent,
                }}
              >
                Bekijk opdracht <ArrowRight size={15} aria-hidden="true" />
              </button>
            </Panel>
          ))}
        </div>
      )}
    </div>
  );
}

function Meta({ Icon, value }: { Icon: LucideIcon; value: string }) {
  return (
    <div className="flex items-center gap-1.5" style={{ color: C.ink3 }}>
      <Icon size={13} strokeWidth={2} style={{ color: C.accent }} aria-hidden="true" />
      <span className="truncate">{value}</span>
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
        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-[12px] font-medium transition-colors hover:bg-[#f4f4f5] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
        style={{
          color: C.ink2,
          background: C.paper,
          border: `1px solid ${C.line}`,
          ["--tw-ring-color" as string]: C.accent,
          ["--tw-ring-offset-color" as string]: C.paper,
        }}
      >
        <ArrowRight size={14} className="rotate-180" aria-hidden="true" /> Terug
      </button>

      <Panel label={opdracht.id} className="p-7 sm:p-8">
        <div className="flex flex-wrap items-center justify-between gap-5">
          <div className="min-w-0">
            <span
              className="inline-block px-2 py-1 text-[11px] font-medium uppercase tracking-[0.08em]"
              style={{ ...mono, color: C.accent, border: `1px solid ${C.accentSoft}` }}
            >
              {opdracht.id}
            </span>
            <h1
              className="mt-3 max-w-2xl text-[26px] font-semibold leading-[1.08] tracking-[-0.02em] sm:text-[32px]"
              style={{ ...sans, color: C.ink }}
            >
              {opdracht.titel}
            </h1>
            <p className="mt-2 text-[14px]" style={{ color: C.ink3 }}>
              {opdracht.opdrachtgever} · {opdracht.plaats}
            </p>
          </div>
          <div
            className="relative flex flex-col items-center px-5 py-3"
            style={{ border: `1px solid ${C.lineStrong}` }}
          >
            <CropMarks color={C.accent} />
            <span
              className="text-[44px] font-semibold leading-none"
              style={{ ...sans, color: C.ink }}
            >
              {opdracht.match}
            </span>
            <span
              className="text-[10px] font-medium uppercase tracking-[0.1em]"
              style={{ ...mono, color: C.ink4 }}
            >
              % match
            </span>
          </div>
        </div>
      </Panel>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {feiten.map((f, idx) => (
          <Panel key={f.l} interactive className="p-4" label={`F-${idx + 1}`}>
            <f.Icon size={16} strokeWidth={2} style={{ color: C.accent }} aria-hidden="true" />
            <div
              className="mt-2.5 text-[16px] font-semibold leading-none"
              style={{ ...sans, color: C.ink }}
            >
              {f.v}
            </div>
            <div
              className="mt-1 text-[10px] font-medium uppercase tracking-[0.1em]"
              style={{ ...mono, color: C.ink4 }}
            >
              {f.l}
            </div>
          </Panel>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div>
          <SectionHead index="+" title="Waarom dit past" />
          <Panel className="p-5">
            <ul className="space-y-3">
              {opdracht.redenen.plus.map((r) => (
                <li
                  key={r}
                  className="flex items-start gap-2.5 text-[13.5px] leading-snug"
                  style={{ color: C.ink2 }}
                >
                  <span
                    className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center"
                    style={{ background: C.ink, color: C.white }}
                    aria-hidden="true"
                  >
                    <Check size={12} strokeWidth={3} />
                  </span>
                  {r}
                </li>
              ))}
            </ul>
          </Panel>
        </div>
        <div>
          <SectionHead index="!" title="Om te overwegen" />
          <Panel className="p-5">
            <ul className="space-y-3">
              {opdracht.redenen.min.map((r) => (
                <li
                  key={r}
                  className="flex items-start gap-2.5 text-[13.5px] leading-snug"
                  style={{ color: C.ink2 }}
                >
                  <span
                    className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center"
                    style={{ background: C.accent, color: C.white }}
                    aria-hidden="true"
                  >
                    <AlertTriangle size={11} strokeWidth={3} />
                  </span>
                  {r}
                </li>
              ))}
            </ul>
          </Panel>
        </div>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row">
        <button
          className="flex flex-1 items-center justify-center gap-2 px-6 py-3.5 text-[13px] font-semibold transition-colors hover:bg-[#0f0f0f] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
          style={{
            background: C.ink,
            color: C.white,
            ["--tw-ring-color" as string]: C.accent,
            ["--tw-ring-offset-color" as string]: C.paper,
          }}
        >
          Reageer op deze opdracht <ArrowRight size={16} aria-hidden="true" />
        </button>
        <button
          className="flex items-center justify-center gap-2 px-6 py-3.5 text-[13px] font-semibold transition-colors hover:bg-[#f4f4f5] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
          style={{
            background: C.paper,
            color: C.ink,
            border: `1px solid ${C.lineStrong}`,
            ["--tw-ring-color" as string]: C.accent,
            ["--tw-ring-offset-color" as string]: C.paper,
          }}
        >
          <Star size={15} strokeWidth={2} aria-hidden="true" /> Bewaar
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
    <div>
      <SectionHead
        index="04"
        title="Verificatie & certificaten"
        action={
          <button
            className="inline-flex items-center gap-2 px-4 py-2 text-[12px] font-semibold transition-colors hover:bg-[#0f0f0f] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
            style={{
              background: C.ink,
              color: C.white,
              ["--tw-ring-color" as string]: C.accent,
              ["--tw-ring-offset-color" as string]: C.paper,
            }}
          >
            <Plus size={14} aria-hidden="true" /> Toevoegen
          </button>
        }
      />

      <Panel label="Dekking" className="mb-4 flex flex-wrap items-center justify-between gap-4 p-6">
        <div className="flex items-center gap-5">
          <div
            className="text-[50px] font-semibold leading-none tracking-[-0.03em]"
            style={{ ...sans, color: C.ink }}
          >
            {dek}
            <span className="text-[22px]" style={{ color: C.ink3 }}>
              %
            </span>
          </div>
          <div className="max-w-xs">
            <div className="text-[15px] font-semibold" style={{ ...sans, color: C.ink }}>
              {verified}/{CREDENTIALS.length} geverifieerd
            </div>
            <p className="mt-1 text-[12.5px] leading-snug" style={{ color: C.ink3 }}>
              Opdrachtgevers zien alleen geverifieerde certificaten. Hogere dekking = meer
              vertrouwen.
            </p>
            <div className="mt-2 w-56 max-w-full">
              <DimLine label={`${dek}%`} tone={C.accent} />
            </div>
          </div>
        </div>
        <span
          className="inline-flex items-center gap-1.5 px-3 py-2 text-[12px] font-medium uppercase tracking-[0.05em]"
          style={{ ...mono, color: C.ink2, border: `1px solid ${C.line}` }}
        >
          <ShieldCheck size={14} strokeWidth={2.2} aria-hidden="true" /> {PROFIEL.trust}
        </span>
      </Panel>

      {/* Legenda — status via patroon + icoon, niet kleur */}
      <Panel className="mb-4 flex flex-wrap items-center gap-2 p-3" marks={false}>
        <span
          className="text-[10px] font-medium uppercase tracking-[0.1em]"
          style={{ ...mono, color: C.ink4 }}
        >
          Legenda
        </span>
        {(["VERIFIED", "SUBMITTED", "EXPIRING", "REJECTED"] as CredStatus[]).map((s) => (
          <StatusTag key={s} status={s} size="sm" />
        ))}
      </Panel>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {CREDENTIALS.map((c, idx) => {
          const m = credMeta(c.status);
          const actionable = c.status !== "VERIFIED";
          return (
            <Panel
              key={c.naam}
              interactive
              className="flex items-stretch"
              label={`C-${idx + 1}`}
              marks={false}
            >
              <span
                className="flex w-14 shrink-0 items-center justify-center"
                style={{
                  background: m.bg,
                  borderRight: `1px ${m.dashed ? "dashed" : "solid"} ${m.border}`,
                }}
                aria-hidden="true"
              >
                <m.Icon size={20} strokeWidth={2.2} style={{ color: m.fg }} />
              </span>
              <div className="min-w-0 flex-1 p-4">
                <div
                  className="truncate text-[14.5px] font-semibold tracking-[-0.01em]"
                  style={{ color: C.ink }}
                >
                  {c.naam}
                </div>
                <div className="mt-0.5 text-[12px]" style={{ color: C.ink3 }}>
                  {c.detail}
                </div>
                <div className="mt-2.5 flex flex-wrap items-center gap-2">
                  <StatusTag status={c.status} size="sm" />
                  {actionable && (
                    <button
                      className="px-2.5 py-1 text-[11px] font-semibold transition-colors hover:bg-[#1d4fd0] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-1"
                      style={{
                        background: C.accent,
                        color: C.white,
                        ["--tw-ring-color" as string]: C.accent,
                        ["--tw-ring-offset-color" as string]: C.paper,
                      }}
                    >
                      {c.status === "EXPIRING"
                        ? "Vernieuwen"
                        : c.status === "REJECTED"
                          ? "Opnieuw indienen"
                          : "Bekijk"}
                    </button>
                  )}
                </div>
              </div>
            </Panel>
          );
        })}
      </div>
    </div>
  );
}

// ── Acties (next-action) ─────────────────────────────────────────────────────────
function Acties() {
  const sorted = [...ACTIES].sort((a, b) =>
    a.urgentie === b.urgentie ? 0 : a.urgentie === "warning" ? -1 : 1,
  );
  return (
    <div>
      <SectionHead index="05" title="Volgende beste acties" />
      <p className="-mt-2 mb-4 text-[13px]" style={{ color: C.ink3 }}>
        Op volgorde van urgentie — pak de bovenste eerst.
      </p>
      <ol className="space-y-4">
        {sorted.map((a, i) => {
          const warn = a.urgentie === "warning";
          return (
            <li key={a.titel}>
              <Panel
                interactive
                className="flex items-stretch"
                marks={warn}
                markColor={C.accent}
                bg={warn ? C.paper : C.paper}
              >
                <span
                  className="flex w-14 shrink-0 items-center justify-center text-[24px] font-semibold"
                  style={{
                    ...sans,
                    background: warn ? C.ink : C.paper2,
                    color: warn ? C.white : C.ink3,
                    borderRight: `1px solid ${C.line}`,
                  }}
                  aria-hidden="true"
                >
                  {i + 1}
                </span>
                <div className="min-w-0 flex-1 p-5">
                  <div className="flex flex-wrap items-center gap-2">
                    <span
                      className="inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-medium uppercase tracking-[0.07em]"
                      style={{
                        ...mono,
                        color: warn ? C.white : C.ink3,
                        background: warn ? C.accent : "transparent",
                        border: `1px solid ${warn ? C.accent : C.line}`,
                      }}
                    >
                      {warn ? (
                        <AlertTriangle size={11} strokeWidth={3} aria-hidden="true" />
                      ) : (
                        <Star size={11} strokeWidth={2.6} aria-hidden="true" />
                      )}
                      {warn ? "Urgent" : "Kans"}
                    </span>
                    <h3
                      className="text-[15px] font-semibold tracking-[-0.01em]"
                      style={{ ...sans, color: C.ink }}
                    >
                      {a.titel}
                    </h3>
                  </div>
                  <p className="mt-1.5 text-[13px] leading-relaxed" style={{ color: C.ink3 }}>
                    {a.detail}
                  </p>
                  <button
                    className="mt-3.5 inline-flex items-center gap-2 px-4 py-2 text-[12px] font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
                    style={
                      warn
                        ? {
                            background: C.accent,
                            color: C.white,
                            ["--tw-ring-color" as string]: C.accent,
                            ["--tw-ring-offset-color" as string]: C.paper,
                          }
                        : {
                            background: C.ink,
                            color: C.white,
                            ["--tw-ring-color" as string]: C.accent,
                            ["--tw-ring-offset-color" as string]: C.paper,
                          }
                    }
                  >
                    {a.cta} <ArrowRight size={14} aria-hidden="true" />
                  </button>
                </div>
              </Panel>
            </li>
          );
        })}
      </ol>
    </div>
  );
}

// ── Facturen ─────────────────────────────────────────────────────────────────────
function Facturen() {
  const factMeta = (
    status: string,
  ): {
    label: string;
    Icon: LucideIcon;
    bg: string;
    fg: string;
    border: string;
    dashed: boolean;
  } => {
    if (status === "Betaald")
      return {
        label: "Betaald",
        Icon: Check,
        bg: C.ink,
        fg: C.white,
        border: C.ink,
        dashed: false,
      };
    if (status === "Openstaand")
      return {
        label: "Openstaand",
        Icon: Clock,
        bg: C.accentSoft,
        fg: "#1e40af",
        border: C.accent,
        dashed: false,
      };
    return {
      label: "Concept",
      Icon: FileText,
      bg: C.paper,
      fg: C.ink3,
      border: C.lineStrong,
      dashed: true,
    };
  };
  const betaald = "€ 8.622";
  const open = FACTUREN.filter((f) => f.status === "Openstaand").length;

  return (
    <div>
      <SectionHead
        index="06"
        title="Facturen"
        action={
          <button
            className="inline-flex items-center gap-2 px-4 py-2 text-[12px] font-semibold transition-colors hover:bg-[#0f0f0f] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
            style={{
              background: C.ink,
              color: C.white,
              ["--tw-ring-color" as string]: C.accent,
              ["--tw-ring-offset-color" as string]: C.paper,
            }}
          >
            <Plus size={14} aria-hidden="true" /> Nieuwe factuur
          </button>
        }
      />

      <div className="mb-4 grid grid-cols-2 gap-4 sm:grid-cols-3">
        {[
          { l: "Betaald (mnd)", v: betaald, dark: true },
          { l: "Openstaand", v: `${open}`, dark: false },
          { l: "Te factureren", v: "€ 1.350", dark: false },
        ].map((s, idx) => (
          <Panel
            key={s.l}
            interactive
            bg={s.dark ? C.ink : C.paper}
            className="p-4"
            label={`S-${idx + 1}`}
          >
            <div
              className="text-[10px] font-medium uppercase tracking-[0.1em]"
              style={{ ...mono, color: s.dark ? "#a1a1aa" : C.ink4 }}
            >
              {s.l}
            </div>
            <div
              className="mt-2 text-[25px] font-semibold leading-none tracking-[-0.02em]"
              style={{ ...sans, color: s.dark ? C.white : C.ink }}
            >
              {s.v}
            </div>
          </Panel>
        ))}
      </div>

      <Panel className="overflow-hidden" marks={false}>
        <ul>
          {FACTUREN.map((f, i) => {
            const m = factMeta(f.status);
            return (
              <li
                key={f.nr}
                className="flex flex-wrap items-center gap-3 p-4 transition-colors hover:bg-[#fafafa]"
                style={{ borderTop: i === 0 ? "none" : `1px solid ${C.line}` }}
              >
                <span
                  className="flex h-9 w-9 shrink-0 items-center justify-center"
                  style={{
                    background: m.bg,
                    border: `1px ${m.dashed ? "dashed" : "solid"} ${m.border}`,
                  }}
                  aria-hidden="true"
                >
                  <m.Icon size={15} strokeWidth={2.2} style={{ color: m.fg }} />
                </span>
                <div className="min-w-0 flex-1">
                  <div
                    className="text-[13.5px] font-semibold tracking-[-0.01em]"
                    style={{ color: C.ink }}
                  >
                    {f.nr}
                  </div>
                  <div className="text-[12px]" style={{ color: C.ink3 }}>
                    {f.klant} · {f.datum}
                  </div>
                </div>
                <span
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 text-[11px] font-medium uppercase tracking-[0.05em]"
                  style={{
                    ...mono,
                    background: m.bg,
                    color: m.fg,
                    border: `1px ${m.dashed ? "dashed" : "solid"} ${m.border}`,
                  }}
                >
                  <m.Icon size={12} strokeWidth={2.4} aria-hidden="true" /> {m.label}
                </span>
                <span
                  className="w-24 text-right text-[15px] font-semibold tabular-nums"
                  style={{ ...mono, color: C.ink }}
                >
                  {f.bedrag}
                </span>
              </li>
            );
          })}
        </ul>
        <div
          className="flex items-center justify-between p-4"
          style={{ background: C.ink, color: C.white }}
        >
          <span
            className="text-[11px] font-medium uppercase tracking-[0.12em]"
            style={{ ...mono, color: "#a1a1aa" }}
          >
            Totaal betaald
          </span>
          <span className="text-[17px] font-semibold tabular-nums" style={sans}>
            {betaald}
          </span>
        </div>
      </Panel>
    </div>
  );
}

// ── Documenten (extra scherm) ─────────────────────────────────────────────────────
function Documenten() {
  return (
    <div>
      <SectionHead
        index="07"
        title="Documenten"
        action={
          <span
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-medium uppercase tracking-[0.05em]"
            style={{ ...mono, color: C.ink2, border: `1px solid ${C.line}` }}
          >
            <ShieldCheck size={13} strokeWidth={2.2} aria-hidden="true" /> Privé opgeslagen
          </span>
        }
      />
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {DOCUMENTEN.map((d, idx) => {
          const m = credMeta(d.status);
          return (
            <Panel
              key={d.naam}
              interactive
              className="flex items-stretch"
              label={`DOC-${String(idx + 1).padStart(2, "0")}`}
            >
              <span
                className="relative flex w-14 shrink-0 items-center justify-center"
                style={{ borderRight: `1px solid ${C.line}` }}
                aria-hidden="true"
              >
                <FileText size={20} strokeWidth={2} style={{ color: C.ink3 }} />
              </span>
              <div className="min-w-0 flex-1 p-4">
                <div className="flex items-center justify-between gap-2">
                  <div
                    className="truncate text-[14px] font-semibold tracking-[-0.01em]"
                    style={{ color: C.ink }}
                  >
                    {d.naam}
                  </div>
                  <span
                    className="shrink-0 text-[11px] tabular-nums"
                    style={{ ...mono, color: C.ink4 }}
                  >
                    {d.grootte}
                  </span>
                </div>
                <div className="mt-0.5 text-[12px]" style={{ color: C.ink3 }}>
                  {d.type} · bijgewerkt {d.bijgewerkt}
                </div>
                <div className="mt-2.5 flex items-center gap-2">
                  <StatusTag status={d.status} size="sm" />
                  <span
                    className="inline-flex items-center gap-1 px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-[0.05em]"
                    style={{
                      ...mono,
                      color: m.fg === C.white ? C.ink3 : C.ink3,
                      border: `1px solid ${C.line}`,
                    }}
                  >
                    {d.type}
                  </span>
                </div>
              </div>
            </Panel>
          );
        })}
      </div>
    </div>
  );
}
