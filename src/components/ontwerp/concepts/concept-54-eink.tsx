"use client";

// Concept 54 — "E-ink" · Papierwit, inkt-grijs, ultra-rustig (e-paper / Kindle / reMarkable).
// Puur monochroom: papierwit vlak met inkt-zwart en grijstinten, geen enkele kleur. Status
// wordt nooit met kleur gecommuniceerd maar met label + icoon + halftoon-/dither-patroon.
// Fijne dither-textuur (radial-gradient stippen) als accent, harde 1px inkt-hairlines, geen
// schaduwen (e-ink kent geen diepte), serif/humanist type, hoge leesbaarheid, low-stimulation.
// Micro-interactie: subtiele "e-ink refresh"-flits bij het wisselen van scherm.
// Onderscheidend van Swiss (rood) en whitespace-maximalisme: expliciet monochroom e-paper.
// Palet: papier #f4f3ee, blad #faf9f4, inkt #16150f, grijs #56544c, hairline #d6d3c6.
// Fonts: --font-lab-newsreader (serif display) + --font-lab-manrope (humanist body).

import { useState } from "react";
import {
  LayoutGrid,
  Store,
  Briefcase,
  BadgeCheck,
  ListChecks,
  Receipt,
  FileText,
  MessageSquare,
  Search,
  MapPin,
  Check,
  Clock,
  AlertTriangle,
  X,
  ChevronRight,
  Minus,
  Plus,
  Send,
  Loader2,
  ArrowUpRight,
  ArrowDownRight,
  RefreshCw,
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

/* ---------- Palet & typografie ---------- */

const C = {
  paper: "#f4f3ee",
  panel: "#faf9f4",
  panelAlt: "#efeee7",
  wash: "#e9e7dd",
  ink: "#16150f",
  inkSoft: "#3a382f",
  muted: "#56544c",
  faint: "#8b887c",
  line: "#d6d3c6",
  lineSoft: "#e3e0d4",
  hard: "#16150f",
};

const serif = { fontFamily: "var(--font-lab-newsreader)" };
const body = { fontFamily: "var(--font-lab-manrope)" };

/* ---------- Status: nooit op kleur — patroon + icoon + label ---------- */

type Pattern = "solid" | "dots" | "hatch" | "cross";

function patternStyle(p: Pattern): React.CSSProperties {
  switch (p) {
    case "solid":
      return { background: C.ink };
    case "dots":
      return {
        background: C.panel,
        backgroundImage: `radial-gradient(${C.ink} 1.1px, transparent 1.2px)`,
        backgroundSize: "4px 4px",
      };
    case "hatch":
      return {
        background: C.panel,
        backgroundImage: `repeating-linear-gradient(45deg, ${C.ink} 0 1px, transparent 1px 4px)`,
      };
    case "cross":
      return {
        background: C.panel,
        backgroundImage: `repeating-linear-gradient(45deg, ${C.ink} 0 1px, transparent 1px 5px), repeating-linear-gradient(-45deg, ${C.ink} 0 1px, transparent 1px 5px)`,
      };
  }
}

function statusMeta(s: CredStatus): {
  label: string;
  Icon: LucideIcon;
  pattern: Pattern;
} {
  switch (s) {
    case "VERIFIED":
      return { label: "Geverifieerd", Icon: Check, pattern: "solid" };
    case "SUBMITTED":
      return { label: "In beoordeling", Icon: Clock, pattern: "dots" };
    case "EXPIRING":
      return { label: "Verloopt bijna", Icon: AlertTriangle, pattern: "hatch" };
    case "REJECTED":
      return { label: "Afgewezen", Icon: X, pattern: "cross" };
  }
}

const NAV_ICONS: Record<ScreenKey, LucideIcon> = {
  dashboard: LayoutGrid,
  marktplaats: Store,
  opdracht: Briefcase,
  verificatie: BadgeCheck,
  acties: ListChecks,
  facturen: Receipt,
  documenten: FileText,
  berichten: MessageSquare,
};

/* ---------- Primitieven ---------- */

// Fijn dither-vlak — halftoon-textuur als rustig accent (geen kleur, geen diepte).
function Dither({
  size = 3,
  className = "",
  strong = false,
}: {
  size?: number;
  className?: string;
  strong?: boolean;
}) {
  return (
    <span
      aria-hidden="true"
      className={`pointer-events-none ${className}`}
      style={{
        backgroundImage: `radial-gradient(${C.ink} ${strong ? 0.9 : 0.7}px, transparent ${strong ? 1 : 0.8}px)`,
        backgroundSize: `${size}px ${size}px`,
        opacity: strong ? 0.5 : 0.28,
      }}
    />
  );
}

function Card({
  children,
  className = "",
  as: Tag = "div",
}: {
  children: React.ReactNode;
  className?: string;
  as?: "div" | "section";
}) {
  return (
    <Tag
      className={`rounded-[3px] ${className}`}
      style={{ background: C.panel, border: `1px solid ${C.line}` }}
    >
      {children}
    </Tag>
  );
}

function Kicker({ children }: { children: React.ReactNode }) {
  return (
    <p
      className="text-[10.5px] font-semibold uppercase tracking-[0.34em]"
      style={{ color: C.muted, ...body }}
    >
      {children}
    </p>
  );
}

function SectionHead({ kicker, title, note }: { kicker: string; title: string; note?: string }) {
  return (
    <div>
      <Kicker>{kicker}</Kicker>
      <h1
        className="mt-2 text-[27px] font-medium leading-[1.08] tracking-[-0.01em] sm:text-[32px]"
        style={{ ...serif, color: C.ink }}
      >
        {title}
      </h1>
      {note && (
        <p
          className="mt-2.5 max-w-2xl text-[13.5px] leading-relaxed"
          style={{ color: C.muted, ...body }}
        >
          {note}
        </p>
      )}
    </div>
  );
}

// Statuslabel — patroon-swatch + icoon + tekst (drievoudig, nooit alleen kleur).
function StatusTag({ status, small = false }: { status: CredStatus; small?: boolean }) {
  const m = statusMeta(status);
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-[2px] ${
        small ? "px-1.5 py-0.5 text-[10px]" : "px-2 py-1 text-[11px]"
      } font-semibold`}
      style={{ color: C.ink, border: `1px solid ${C.line}`, background: C.panelAlt, ...body }}
    >
      <span
        aria-hidden="true"
        className="inline-block h-3 w-3 shrink-0 rounded-[1px]"
        style={{ ...patternStyle(m.pattern), border: `1px solid ${C.line}` }}
      />
      <m.Icon size={small ? 11 : 12} aria-hidden="true" style={{ color: C.ink }} />
      {m.label}
    </span>
  );
}

// Balk met dither-vulling — vervangt gekleurde voortgangsbalken.
function InkBar({ value, label }: { value: number; label?: string }) {
  const pct = Math.max(0, Math.min(100, value));
  return (
    <div className="flex items-center gap-2.5">
      <span
        className="relative h-2 flex-1 overflow-hidden rounded-[1px]"
        style={{ background: C.wash, border: `1px solid ${C.line}` }}
        role="img"
        aria-label={label ? `${label}: ${pct}%` : `${pct}%`}
      >
        <span
          className="absolute inset-y-0 left-0"
          style={{
            width: `${pct}%`,
            backgroundImage: `repeating-linear-gradient(90deg, ${C.ink} 0 1.4px, transparent 1.4px 3px)`,
          }}
        />
      </span>
      <span
        className="w-9 shrink-0 text-right text-[11px] font-semibold tabular-nums"
        style={{ color: C.ink, ...body }}
      >
        {pct}%
      </span>
    </div>
  );
}

function digits(v: string): number {
  const only = v.replace(/[^\d]/g, "");
  return only ? parseInt(only, 10) : 0;
}

/* ---------- Hoofdcomponent ---------- */

export function Concept54() {
  const [screen, setScreen] = useState<ScreenKey>("dashboard");
  const [flash, setFlash] = useState(0);
  const [activeId, setActiveId] = useState<string>(OPDRACHTEN[0]?.id ?? "");
  const active = OPDRACHTEN.find((o) => o.id === activeId) ?? (OPDRACHTEN[0] as Opdracht);

  const go = (k: ScreenKey) => {
    setScreen(k);
    setFlash((f) => f + 1);
  };
  const open = (id?: string) => {
    if (id) setActiveId(id);
    go("opdracht");
  };

  return (
    <div
      className="relative min-h-[680px] w-full overflow-hidden antialiased"
      style={{ color: C.ink, background: C.paper, ...body }}
    >
      <style>{`
        @keyframes einkRefresh54 { 0% { opacity: 1 } 45% { opacity: 1 } 100% { opacity: 0 } }
        .eink-flash-54 { background: ${C.ink}; animation: einkRefresh54 0.26s steps(2, end) forwards; }
        @media (prefers-reduced-motion: reduce) { .eink-flash-54 { animation: none; opacity: 0 } }
      `}</style>

      {/* Papier-dither over het geheel — ultra-subtiel */}
      <Dither size={4} className="absolute inset-0" />

      {/* E-ink refresh-flits bij scherm-wissel */}
      <div
        key={flash}
        aria-hidden="true"
        className="eink-flash-54 pointer-events-none absolute inset-0 z-40"
      />

      <div className="relative z-10 flex min-h-[680px]">
        {/* Zijbalk */}
        <aside
          className="hidden w-[236px] shrink-0 flex-col p-5 md:flex"
          style={{ borderRight: `1px solid ${C.line}` }}
        >
          <div className="flex items-center gap-3 pb-7">
            <div
              className="flex h-9 w-9 items-center justify-center rounded-[3px]"
              style={{ background: C.ink }}
            >
              <span className="text-[15px] font-semibold" style={{ color: C.paper, ...serif }}>
                E
              </span>
            </div>
            <div className="leading-tight">
              <div className="text-[15px] font-medium tracking-tight" style={serif}>
                E-ink
              </div>
              <div className="text-[10.5px]" style={{ color: C.faint }}>
                ZZP · e-paper
              </div>
            </div>
          </div>

          <nav className="flex flex-col gap-0.5" aria-label="Hoofdnavigatie">
            {SCREENS.map((s) => {
              const Icon = NAV_ICONS[s.key];
              const on = s.key === screen;
              return (
                <button
                  key={s.key}
                  onClick={() => go(s.key)}
                  aria-current={on ? "page" : undefined}
                  className="group relative flex items-center gap-3 rounded-[3px] px-3 py-2.5 text-[13.5px] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-1"
                  style={{
                    color: on ? C.paper : C.inkSoft,
                    background: on ? C.ink : "transparent",
                    ["--tw-ring-color" as string]: C.ink,
                    ["--tw-ring-offset-color" as string]: C.paper,
                  }}
                >
                  <Icon size={16} aria-hidden="true" />
                  <span className="flex-1 text-left font-medium">{s.label}</span>
                  {on && <ChevronRight size={14} aria-hidden="true" />}
                </button>
              );
            })}
          </nav>

          <div className="mt-auto pt-6">
            <div
              className="flex items-center gap-3 rounded-[3px] p-3"
              style={{ border: `1px solid ${C.line}`, background: C.panel }}
            >
              <div
                className="flex h-9 w-9 items-center justify-center rounded-full text-[11px] font-semibold"
                style={{ background: C.ink, color: C.paper, ...body }}
              >
                {PROFIEL.initialen}
              </div>
              <div className="min-w-0">
                <div className="truncate text-[12.5px] font-semibold" style={{ color: C.ink }}>
                  {PROFIEL.naam}
                </div>
                <div className="flex items-center gap-1 text-[10.5px]" style={{ color: C.muted }}>
                  <BadgeCheck size={11} aria-hidden="true" /> {PROFIEL.trust}
                </div>
              </div>
            </div>
          </div>
        </aside>

        {/* Main */}
        <main className="flex min-w-0 flex-1 flex-col">
          <header
            className="flex h-16 shrink-0 items-center gap-3 px-5 sm:px-8"
            style={{ borderBottom: `1px solid ${C.line}` }}
          >
            <h2 className="truncate text-[15px] font-medium tracking-tight" style={serif}>
              {SCREENS.find((s) => s.key === screen)?.label}
            </h2>
            <span
              className="hidden items-center gap-1.5 text-[10.5px] uppercase tracking-[0.2em] sm:flex"
              style={{ color: C.faint }}
            >
              <RefreshCw size={11} aria-hidden="true" /> e-paper
            </span>
            <div className="ml-auto flex items-center gap-2">
              <button
                className="hidden items-center gap-2 rounded-[3px] px-3 py-2 text-[12.5px] transition-colors hover:bg-[#efeee7] focus-visible:outline-none focus-visible:ring-2 sm:flex"
                style={{
                  border: `1px solid ${C.line}`,
                  color: C.muted,
                  ["--tw-ring-color" as string]: C.ink,
                }}
                aria-label="Zoeken"
              >
                <Search size={14} aria-hidden="true" />
                <span>Zoeken…</span>
              </button>
              <div
                className="flex h-9 w-9 items-center justify-center rounded-full text-[11px] font-semibold md:hidden"
                style={{ background: C.ink, color: C.paper }}
              >
                {PROFIEL.initialen}
              </div>
            </div>
          </header>

          {/* Mobiele tabs */}
          <div
            className="flex gap-1.5 overflow-x-auto px-4 py-2.5 md:hidden"
            style={{ borderBottom: `1px solid ${C.line}` }}
          >
            {SCREENS.map((s) => {
              const on = s.key === screen;
              return (
                <button
                  key={s.key}
                  onClick={() => go(s.key)}
                  aria-current={on ? "page" : undefined}
                  className="shrink-0 rounded-[3px] px-3 py-1.5 text-[12.5px] font-medium transition-colors focus-visible:outline-none focus-visible:ring-2"
                  style={{
                    color: on ? C.paper : C.muted,
                    background: on ? C.ink : "transparent",
                    border: `1px solid ${on ? C.ink : C.line}`,
                    ["--tw-ring-color" as string]: C.ink,
                  }}
                >
                  {s.label}
                </button>
              );
            })}
          </div>

          <div className="flex-1 overflow-y-auto px-5 py-7 sm:px-8">
            {screen === "dashboard" && <Dashboard onOpen={open} />}
            {screen === "marktplaats" && (
              <Marktplaats activeId={activeId} onSelect={setActiveId} onOpen={open} />
            )}
            {screen === "opdracht" && <OpdrachtDetail opdracht={active} />}
            {screen === "verificatie" && <Verificatie />}
            {screen === "acties" && <Acties onOpen={open} />}
            {screen === "facturen" && <Facturen />}
          </div>
        </main>
      </div>
    </div>
  );
}

/* ---------- Dashboard ---------- */

function Dashboard({ onOpen }: { onOpen: (id?: string) => void }) {
  const ongelezen = BERICHTEN.filter((b) => b.ongelezen).length;
  return (
    <div className="mx-auto max-w-6xl space-y-7">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <SectionHead
          kicker="Overzicht"
          title={`Goedemorgen, ${PROFIEL.naam.split(" ")[0]}`}
          note="Een rustig, contrastarm overzicht. Alles wat telt in inkt op papier — geen ruis, geen kleur, alleen wat aandacht vraagt."
        />
        <span
          className="inline-flex shrink-0 items-center gap-1.5 rounded-[2px] px-2.5 py-1 text-[11px] font-semibold"
          style={{ border: `1px solid ${C.line}`, background: C.panelAlt, color: C.ink, ...body }}
        >
          <BadgeCheck size={13} aria-hidden="true" /> {PROFIEL.trust}
        </span>
      </div>

      {/* KPI's als inkt-tegels met dither-sparkline */}
      <div className="grid grid-cols-2 gap-px lg:grid-cols-4" style={{ background: C.line }}>
        {KPIS.map((k) => (
          <div key={k.label} className="p-4 sm:p-5" style={{ background: C.panel }}>
            <p
              className="text-[11px] font-medium uppercase tracking-[0.14em]"
              style={{ color: C.muted }}
            >
              {k.label}
            </p>
            <p className="mt-2 text-[26px] font-medium leading-none tracking-tight" style={serif}>
              {k.value}
            </p>
            <div
              className="mt-2.5 flex items-center gap-1.5 text-[11.5px]"
              style={{ color: C.inkSoft }}
            >
              {k.up ? (
                <ArrowUpRight size={13} aria-hidden="true" />
              ) : (
                <ArrowDownRight size={13} aria-hidden="true" />
              )}
              <span className="font-semibold">{k.trend}</span>
              <SparkDither values={k.spark} />
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Beste matches */}
        <div className="space-y-6 lg:col-span-2">
          <Card className="overflow-hidden">
            <div
              className="flex items-center justify-between px-5 py-3.5"
              style={{ borderBottom: `1px solid ${C.line}` }}
            >
              <h3 className="text-[14px] font-medium tracking-tight" style={serif}>
                Aanbevolen opdrachten
              </h3>
              <span className="text-[11px]" style={{ color: C.faint }}>
                verklaarbaar gesorteerd
              </span>
            </div>
            <div>
              {OPDRACHTEN.map((o, i) => (
                <button
                  key={o.id}
                  onClick={() => onOpen(o.id)}
                  className="flex w-full items-center gap-4 px-5 py-4 text-left transition-colors hover:bg-[#efeee7] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset"
                  style={{
                    borderTop: i === 0 ? "none" : `1px solid ${C.lineSoft}`,
                    ["--tw-ring-color" as string]: C.ink,
                  }}
                >
                  <MatchDisc value={o.match} />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[14px] font-medium" style={{ color: C.ink }}>
                      {o.titel}
                    </p>
                    <p
                      className="mt-0.5 flex items-center gap-1.5 truncate text-[12px]"
                      style={{ color: C.muted }}
                    >
                      <MapPin size={12} aria-hidden="true" /> {o.opdrachtgever} · {o.plaats}
                    </p>
                  </div>
                  <div className="hidden text-right sm:block">
                    <p className="text-[13px] font-semibold" style={{ color: C.ink }}>
                      {o.tarief}
                    </p>
                    <p className="text-[11px]" style={{ color: C.faint }}>
                      {o.uren}
                    </p>
                  </div>
                  <ChevronRight size={16} aria-hidden="true" style={{ color: C.faint }} />
                </button>
              ))}
            </div>
          </Card>

          {/* Berichten */}
          <Card className="overflow-hidden">
            <div
              className="flex items-center justify-between px-5 py-3.5"
              style={{ borderBottom: `1px solid ${C.line}` }}
            >
              <h3 className="text-[14px] font-medium tracking-tight" style={serif}>
                Berichten
              </h3>
              <span className="text-[11px] font-semibold" style={{ color: C.ink }}>
                {ongelezen} ongelezen
              </span>
            </div>
            {BERICHTEN.map((b, i) => (
              <div
                key={b.van}
                className="flex items-center gap-3.5 px-5 py-3.5"
                style={{ borderTop: i === 0 ? "none" : `1px solid ${C.lineSoft}` }}
              >
                <div
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-[11px] font-semibold"
                  style={{
                    background: b.ongelezen ? C.ink : C.panelAlt,
                    color: b.ongelezen ? C.paper : C.muted,
                    border: `1px solid ${C.line}`,
                    ...body,
                  }}
                >
                  {b.initialen}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <p className="truncate text-[12.5px] font-semibold" style={{ color: C.ink }}>
                      {b.van}
                    </p>
                    {b.ongelezen && (
                      <span
                        className="inline-flex items-center gap-1 rounded-[2px] px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wide"
                        style={{ background: C.ink, color: C.paper }}
                      >
                        nieuw
                      </span>
                    )}
                  </div>
                  <p className="truncate text-[11.5px]" style={{ color: C.muted }}>
                    {b.preview}
                  </p>
                </div>
                <span className="shrink-0 text-[11px] tabular-nums" style={{ color: C.faint }}>
                  {b.tijd}
                </span>
              </div>
            ))}
          </Card>
        </div>

        {/* Zijkolom */}
        <div className="space-y-6">
          {/* Waarschuwing — VOG verloopt (dither-hatch als accent, geen kleur) */}
          <Card className="relative overflow-hidden p-5">
            <div
              aria-hidden="true"
              className="absolute right-0 top-0 h-14 w-14"
              style={patternStyle("hatch")}
            />
            <div className="relative flex items-center gap-2">
              <AlertTriangle size={14} aria-hidden="true" style={{ color: C.ink }} />
              <span
                className="text-[10.5px] font-semibold uppercase tracking-[0.24em]"
                style={{ color: C.ink }}
              >
                Actie vereist
              </span>
            </div>
            <p className="relative mt-2 text-[17px] font-medium leading-snug" style={serif}>
              {ACTIES[0]?.titel}
            </p>
            <p className="relative mt-1.5 text-[12.5px] leading-relaxed" style={{ color: C.muted }}>
              {ACTIES[0]?.detail}
            </p>
            <button
              onClick={() => onOpen()}
              className="relative mt-4 w-full rounded-[3px] py-2.5 text-[13px] font-semibold transition-colors hover:bg-[#000] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-1"
              style={{
                background: C.ink,
                color: C.paper,
                ["--tw-ring-color" as string]: C.ink,
                ["--tw-ring-offset-color" as string]: C.paper,
              }}
            >
              {ACTIES[0]?.cta}
            </button>
          </Card>

          {/* Certificaten */}
          <Card className="overflow-hidden">
            <div className="px-5 py-3.5" style={{ borderBottom: `1px solid ${C.line}` }}>
              <h3 className="text-[14px] font-medium tracking-tight" style={serif}>
                Certificaten
              </h3>
            </div>
            <div className="p-3">
              {CREDENTIALS.map((c) => (
                <div key={c.naam} className="flex items-center gap-3 px-2 py-2.5">
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[12.5px] font-medium" style={{ color: C.ink }}>
                      {c.naam}
                    </p>
                  </div>
                  <StatusTag status={c.status} small />
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}

// Sparkline in dither-staafjes (monochroom, geen kleur).
function SparkDither({ values }: { values: number[] }) {
  const max = Math.max(...values);
  const min = Math.min(...values);
  const span = max - min || 1;
  return (
    <span className="ml-1 inline-flex items-end gap-[2px]" aria-hidden="true">
      {values.map((v, i) => {
        const h = 4 + ((v - min) / span) * 12;
        return (
          <span
            key={i}
            className="w-[3px] rounded-[0.5px]"
            style={{ height: `${h}px`, background: i === values.length - 1 ? C.ink : C.faint }}
          />
        );
      })}
    </span>
  );
}

// Match-schijf in inkt: gevulde boog-benadering met dither-rand.
function MatchDisc({ value }: { value: number }) {
  return (
    <span
      className="relative flex h-11 w-11 shrink-0 items-center justify-center rounded-full"
      style={{ border: `1.5px solid ${C.ink}`, background: C.panel }}
      role="img"
      aria-label={`Match ${value} procent`}
    >
      <span
        aria-hidden="true"
        className="absolute inset-0 rounded-full"
        style={{
          backgroundImage: `radial-gradient(${C.ink} 0.7px, transparent 0.8px)`,
          backgroundSize: "3px 3px",
          opacity: value >= 90 ? 0.3 : 0.16,
        }}
      />
      <span
        className="relative text-[12px] font-semibold tabular-nums"
        style={{ color: C.ink, ...body }}
      >
        {value}
      </span>
    </span>
  );
}

/* ---------- Marktplaats ---------- */

function Marktplaats({
  activeId,
  onSelect,
  onOpen,
}: {
  activeId: string;
  onSelect: (id: string) => void;
  onOpen: (id?: string) => void;
}) {
  const [q, setQ] = useState("");
  const filtered = OPDRACHTEN.filter(
    (o) =>
      o.titel.toLowerCase().includes(q.toLowerCase()) ||
      o.plaats.toLowerCase().includes(q.toLowerCase()) ||
      o.opdrachtgever.toLowerCase().includes(q.toLowerCase()),
  );
  const sel = filtered.find((o) => o.id === activeId) ?? filtered[0];

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <SectionHead
        kicker="Marktplaats"
        title="Open opdrachten"
        note="Kalm doorbladeren zonder afleiding. Selecteer links; het detail leest rechts als een pagina."
      />

      <Card className="flex items-center gap-3 px-4 py-2.5">
        <Search size={16} aria-hidden="true" style={{ color: C.muted }} />
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Zoek op titel, plaats of opdrachtgever…"
          aria-label="Opdrachten zoeken"
          className="w-full bg-transparent text-[13.5px] outline-none placeholder:text-[#8b887c]"
          style={{ color: C.ink }}
        />
        <span className="shrink-0 text-[11.5px] tabular-nums" style={{ color: C.faint }}>
          {filtered.length}/{OPDRACHTEN.length}
        </span>
      </Card>

      {filtered.length === 0 ? (
        <Card className="px-6 py-16 text-center">
          <div
            className="mx-auto flex h-14 w-14 items-center justify-center rounded-[3px]"
            style={{ border: `1px solid ${C.line}`, ...patternStyle("dots") }}
            aria-hidden="true"
          >
            <Search size={22} style={{ color: C.ink }} />
          </div>
          <p className="mt-4 text-[17px] font-medium" style={serif}>
            Niets gevonden
          </p>
          <p className="mx-auto mt-1.5 max-w-xs text-[12.5px]" style={{ color: C.muted }}>
            Geen opdracht komt overeen met &quot;{q}&quot;. Verbreed je zoekopdracht.
          </p>
          <button
            onClick={() => setQ("")}
            className="mt-5 inline-flex items-center gap-2 rounded-[3px] px-4 py-2 text-[12.5px] font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2"
            style={{ background: C.ink, color: C.paper, ["--tw-ring-color" as string]: C.ink }}
          >
            Zoekopdracht wissen
          </button>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-[1.25fr_1fr]">
          <div className="space-y-3">
            {filtered.map((o) => {
              const on = sel?.id === o.id;
              return (
                <button
                  key={o.id}
                  onClick={() => onSelect(o.id)}
                  className="w-full text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-1"
                  style={{
                    ["--tw-ring-color" as string]: C.ink,
                    ["--tw-ring-offset-color" as string]: C.paper,
                  }}
                >
                  <div
                    className="relative flex items-center gap-4 rounded-[3px] p-4 transition-colors"
                    style={{
                      background: on ? C.panelAlt : C.panel,
                      border: `1px solid ${on ? C.ink : C.line}`,
                    }}
                  >
                    {on && (
                      <span
                        aria-hidden="true"
                        className="absolute inset-y-2 left-0 w-1"
                        style={{ background: C.ink }}
                      />
                    )}
                    <MatchDisc value={o.match} />
                    <div className="min-w-0 flex-1">
                      <span
                        className="text-[10.5px] uppercase tracking-[0.16em]"
                        style={{ color: C.faint }}
                      >
                        {o.id}
                      </span>
                      <p
                        className="truncate text-[14.5px] font-medium leading-snug"
                        style={{ color: C.ink }}
                      >
                        {o.titel}
                      </p>
                      <p
                        className="mt-0.5 flex items-center gap-1.5 truncate text-[12px]"
                        style={{ color: C.muted }}
                      >
                        <MapPin size={12} aria-hidden="true" /> {o.opdrachtgever} · {o.plaats}
                      </p>
                    </div>
                    <div className="hidden text-right sm:block">
                      <p className="text-[13px] font-semibold" style={{ color: C.ink }}>
                        {o.tarief}
                      </p>
                      <p className="text-[11px]" style={{ color: C.faint }}>
                        {o.uren}
                      </p>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>

          {sel && (
            <Card className="sticky top-4 h-fit p-5">
              <span className="text-[10.5px] uppercase tracking-[0.2em]" style={{ color: C.faint }}>
                {sel.id}
              </span>
              <h2 className="mt-1 text-[20px] font-medium leading-snug" style={serif}>
                {sel.titel}
              </h2>
              <p
                className="mt-1.5 flex items-center gap-1.5 text-[12.5px]"
                style={{ color: C.muted }}
              >
                <MapPin size={13} aria-hidden="true" /> {sel.opdrachtgever} · {sel.plaats}
              </p>
              <div className="mt-4">
                <div
                  className="mb-1.5 flex items-center justify-between text-[11px]"
                  style={{ color: C.muted }}
                >
                  <span>Match-index</span>
                  <span className="font-semibold" style={{ color: C.ink }}>
                    {sel.match}%
                  </span>
                </div>
                <InkBar value={sel.match} label="Match" />
              </div>
              <dl
                className="mt-4 grid grid-cols-3 gap-px overflow-hidden rounded-[3px]"
                style={{ background: C.line, border: `1px solid ${C.line}` }}
              >
                {[
                  { l: "Tarief", v: sel.tarief },
                  { l: "Omvang", v: sel.uren },
                  { l: "Start", v: sel.start },
                ].map((m) => (
                  <div key={m.l} className="p-2.5 text-center" style={{ background: C.panel }}>
                    <dt
                      className="text-[9.5px] uppercase tracking-[0.12em]"
                      style={{ color: C.faint }}
                    >
                      {m.l}
                    </dt>
                    <dd className="mt-0.5 text-[12px] font-semibold" style={{ color: C.ink }}>
                      {m.v}
                    </dd>
                  </div>
                ))}
              </dl>
              <div className="mt-4 flex flex-wrap gap-1.5">
                {sel.tags.map((t) => (
                  <span
                    key={t}
                    className="rounded-[2px] px-2 py-0.5 text-[10.5px]"
                    style={{
                      border: `1px solid ${C.line}`,
                      background: C.panelAlt,
                      color: C.inkSoft,
                    }}
                  >
                    {t}
                  </span>
                ))}
              </div>
              <button
                onClick={() => onOpen(sel.id)}
                className="mt-4 flex w-full items-center justify-center gap-2 rounded-[3px] py-2.5 text-[13px] font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2"
                style={{ background: C.ink, color: C.paper, ["--tw-ring-color" as string]: C.ink }}
              >
                Opdracht openen <ChevronRight size={14} aria-hidden="true" />
              </button>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}

/* ---------- Opdracht-detail ---------- */

function OpdrachtDetail({ opdracht }: { opdracht: Opdracht }) {
  const [state, setState] = useState<"idle" | "sending" | "sent">("idle");
  const react = () => {
    if (state !== "idle") return;
    setState("sending");
    window.setTimeout(() => setState("sent"), 900);
  };

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <Card className="p-6 sm:p-8">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0">
            <Kicker>{opdracht.id}</Kicker>
            <h1 className="mt-2 text-[26px] font-medium leading-tight tracking-tight" style={serif}>
              {opdracht.titel}
            </h1>
            <p className="mt-2 flex items-center gap-1.5 text-[13px]" style={{ color: C.muted }}>
              <MapPin size={14} aria-hidden="true" /> {opdracht.opdrachtgever} · {opdracht.plaats}
            </p>
            <div className="mt-3.5 flex flex-wrap gap-1.5">
              {opdracht.tags.map((t) => (
                <span
                  key={t}
                  className="rounded-[2px] px-2 py-0.5 text-[10.5px]"
                  style={{
                    border: `1px solid ${C.line}`,
                    background: C.panelAlt,
                    color: C.inkSoft,
                  }}
                >
                  {t}
                </span>
              ))}
            </div>
          </div>
          <button
            onClick={react}
            disabled={state !== "idle"}
            aria-live="polite"
            className="inline-flex shrink-0 items-center justify-center gap-2 rounded-[3px] px-5 py-2.5 text-[13px] font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 disabled:opacity-90"
            style={{ background: C.ink, color: C.paper, ["--tw-ring-color" as string]: C.ink }}
          >
            {state === "sending" && (
              <Loader2 size={15} aria-hidden="true" className="animate-spin" />
            )}
            {state === "sent" && <Check size={15} aria-hidden="true" />}
            {state === "idle" && <Send size={14} aria-hidden="true" />}
            {state === "idle"
              ? "Reageer op opdracht"
              : state === "sending"
                ? "Versturen…"
                : "Reactie verstuurd"}
          </button>
        </div>

        <div
          className="mt-6 grid grid-cols-2 gap-px overflow-hidden rounded-[3px] sm:grid-cols-4"
          style={{ background: C.line, border: `1px solid ${C.line}` }}
        >
          {[
            { l: "Tarief", v: opdracht.tarief },
            { l: "Omvang", v: opdracht.uren },
            { l: "Start", v: opdracht.start },
            { l: "Match", v: `${opdracht.match}%` },
          ].map((m) => (
            <div key={m.l} className="p-3.5" style={{ background: C.panel }}>
              <p
                className="text-[9.5px] font-medium uppercase tracking-[0.14em]"
                style={{ color: C.faint }}
              >
                {m.l}
              </p>
              <p className="mt-1 text-[16px] font-semibold" style={{ color: C.ink }}>
                {m.v}
              </p>
            </div>
          ))}
        </div>
      </Card>

      <Card className="p-6">
        <h3 className="text-[15px] font-medium tracking-tight" style={serif}>
          Waarom deze match
        </h3>
        <p className="mt-1 text-[12.5px]" style={{ color: C.muted }}>
          Transparant onderbouwd op basis van je geverifieerde profiel.
        </p>
        <div className="mt-5 grid grid-cols-1 gap-7 sm:grid-cols-2">
          <div>
            <p
              className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.16em]"
              style={{ color: C.ink }}
            >
              <Check size={13} aria-hidden="true" /> Pluspunten
            </p>
            <ul className="mt-3 space-y-2.5">
              {opdracht.redenen.plus.map((r) => (
                <li
                  key={r}
                  className="flex items-start gap-2.5 text-[13px]"
                  style={{ color: C.inkSoft }}
                >
                  <span
                    aria-hidden="true"
                    className="mt-1.5 h-2.5 w-2.5 shrink-0 rounded-[1px]"
                    style={patternStyle("solid")}
                  />
                  {r}
                </li>
              ))}
            </ul>
          </div>
          <div>
            <p
              className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.16em]"
              style={{ color: C.ink }}
            >
              <Minus size={13} aria-hidden="true" /> Aandachtspunten
            </p>
            <ul className="mt-3 space-y-2.5">
              {opdracht.redenen.min.map((r) => (
                <li
                  key={r}
                  className="flex items-start gap-2.5 text-[13px]"
                  style={{ color: C.inkSoft }}
                >
                  <span
                    aria-hidden="true"
                    className="mt-1.5 h-2.5 w-2.5 shrink-0 rounded-[1px]"
                    style={{ ...patternStyle("hatch"), border: `1px solid ${C.line}` }}
                  />
                  {r}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </Card>
    </div>
  );
}

/* ---------- Verificatie ---------- */

function Verificatie() {
  const verified = CREDENTIALS.filter((c) => c.status === "VERIFIED").length;
  const total = CREDENTIALS.length;
  const attention = CREDENTIALS.filter(
    (c) => c.status === "EXPIRING" || c.status === "REJECTED",
  ).length;

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <SectionHead
        kicker="Verificatie"
        title="Certificaten & documenten"
        note="Status zonder kleur: elk certificaat draagt een eigen patroon, icoon en label. Geverifieerd is vol inkt; aandacht is gearceerd."
      />

      {/* Legenda — leert het patroon-alfabet */}
      <Card className="flex flex-wrap items-center gap-x-5 gap-y-2 px-5 py-3.5">
        <span
          className="text-[10.5px] font-semibold uppercase tracking-[0.18em]"
          style={{ color: C.muted }}
        >
          Legenda
        </span>
        {(["VERIFIED", "SUBMITTED", "EXPIRING", "REJECTED"] as CredStatus[]).map((s) => (
          <StatusTag key={s} status={s} small />
        ))}
      </Card>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-[200px_1fr]">
        <Card className="p-5">
          <p
            className="text-[11px] font-medium uppercase tracking-[0.14em]"
            style={{ color: C.muted }}
          >
            Gereedheid
          </p>
          <p className="mt-2 text-[34px] font-medium leading-none tracking-tight" style={serif}>
            {verified}
            <span className="text-[18px]" style={{ color: C.faint }}>
              /{total}
            </span>
          </p>
          <div className="mt-3">
            <InkBar value={Math.round((verified / total) * 100)} label="Gereedheid" />
          </div>
          <p className="mt-3 flex items-center gap-1.5 text-[11.5px]" style={{ color: C.inkSoft }}>
            <AlertTriangle size={12} aria-hidden="true" /> {attention} vragen aandacht
          </p>
        </Card>

        <Card className="overflow-hidden">
          {CREDENTIALS.map((c, i) => {
            const m = statusMeta(c.status);
            return (
              <div
                key={c.naam}
                className="flex items-center gap-4 px-5 py-4 transition-colors hover:bg-[#efeee7]"
                style={{ borderTop: i === 0 ? "none" : `1px solid ${C.lineSoft}` }}
              >
                <div
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[3px]"
                  style={{ ...patternStyle(m.pattern), border: `1px solid ${C.line}` }}
                  aria-hidden="true"
                >
                  {c.status === "SUBMITTED" ? (
                    <Loader2
                      size={16}
                      className="motion-safe:animate-spin"
                      style={{ color: C.ink }}
                    />
                  ) : (
                    <m.Icon size={16} style={{ color: m.pattern === "solid" ? C.paper : C.ink }} />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-[13.5px] font-medium" style={{ color: C.ink }}>
                    {c.naam}
                  </p>
                  <p className="text-[11.5px]" style={{ color: C.muted }}>
                    {c.detail}
                  </p>
                </div>
                <StatusTag status={c.status} />
              </div>
            );
          })}
        </Card>
      </div>

      <Card className="overflow-hidden">
        <div className="px-5 py-3.5" style={{ borderBottom: `1px solid ${C.line}` }}>
          <h3 className="text-[14px] font-medium tracking-tight" style={serif}>
            Documentenarchief
          </h3>
        </div>
        {DOCUMENTEN.map((d, i) => (
          <div
            key={d.naam}
            className="flex items-center gap-3.5 px-5 py-3.5"
            style={{ borderTop: i === 0 ? "none" : `1px solid ${C.lineSoft}` }}
          >
            <span
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[3px]"
              style={{ border: `1px solid ${C.line}`, background: C.panelAlt }}
              aria-hidden="true"
            >
              <FileText size={15} style={{ color: C.ink }} />
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-[12.5px] font-semibold" style={{ color: C.ink }}>
                {d.naam}
              </p>
              <p className="truncate text-[11px]" style={{ color: C.faint }}>
                {d.type} · {d.grootte} · {d.bijgewerkt}
              </p>
            </div>
            <StatusTag status={d.status} small />
          </div>
        ))}
      </Card>
    </div>
  );
}

/* ---------- Acties ---------- */

function Acties({ onOpen }: { onOpen: (id?: string) => void }) {
  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <SectionHead
        kicker="Volgende acties"
        title="Wat vraagt nu je aandacht"
        note="Op volgorde van urgentie. Het meest dringende bovenaan, met een gearceerd waarschuwingspatroon."
      />
      <div className="space-y-3">
        {ACTIES.map((a, i) => {
          const warn = a.urgentie === "warning";
          return (
            <Card key={a.titel} className="relative flex items-start gap-4 overflow-hidden p-5">
              {warn && (
                <span
                  aria-hidden="true"
                  className="absolute left-0 top-0 h-full w-1"
                  style={patternStyle("hatch")}
                />
              )}
              <div className="flex flex-col items-center gap-2 pt-0.5">
                <span
                  className="text-[10.5px] font-semibold tabular-nums"
                  style={{ color: C.faint }}
                >
                  {String(i + 1).padStart(2, "0")}
                </span>
                <div
                  className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[3px]"
                  style={{ border: `1px solid ${C.line}`, background: warn ? C.ink : C.panelAlt }}
                >
                  {warn ? (
                    <AlertTriangle size={18} style={{ color: C.paper }} aria-hidden="true" />
                  ) : (
                    <ListChecks size={18} style={{ color: C.ink }} aria-hidden="true" />
                  )}
                </div>
              </div>
              <div className="min-w-0 flex-1">
                <span
                  className="inline-flex items-center gap-1.5 rounded-[2px] px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide"
                  style={{ border: `1px solid ${C.line}`, background: C.panelAlt, color: C.ink }}
                >
                  {warn ? "Waarschuwing" : "Melding"}
                </span>
                <p className="mt-2 text-[14px] font-semibold" style={{ color: C.ink }}>
                  {a.titel}
                </p>
                <p className="mt-0.5 text-[12.5px]" style={{ color: C.muted }}>
                  {a.detail}
                </p>
              </div>
              <button
                onClick={() => onOpen()}
                className="shrink-0 self-center rounded-[3px] px-4 py-1.5 text-[12.5px] font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2"
                style={{
                  color: warn ? C.paper : C.ink,
                  background: warn ? C.ink : C.panel,
                  border: `1px solid ${C.ink}`,
                  ["--tw-ring-color" as string]: C.ink,
                }}
              >
                {a.cta}
              </button>
            </Card>
          );
        })}
      </div>

      <Card className="flex items-center gap-4 p-5">
        <div
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full"
          style={{ border: `1px solid ${C.line}`, background: C.panelAlt }}
        >
          <Check size={18} style={{ color: C.ink }} aria-hidden="true" />
        </div>
        <p className="text-[12.5px] leading-relaxed" style={{ color: C.muted }}>
          Verder is alles op orde. Nieuwe acties verschijnen hier zodra ze relevant worden — rustig,
          zonder ruis.
        </p>
      </Card>
    </div>
  );
}

/* ---------- Facturen ---------- */

function Facturen() {
  const meta: Record<string, { Icon: LucideIcon; pattern: Pattern }> = {
    Betaald: { Icon: Check, pattern: "solid" },
    Openstaand: { Icon: Clock, pattern: "hatch" },
    Concept: { Icon: FileText, pattern: "dots" },
  };
  const betaald = FACTUREN.filter((f) => f.status === "Betaald").reduce(
    (s, f) => s + digits(f.bedrag),
    0,
  );
  const open = FACTUREN.filter((f) => f.status === "Openstaand").reduce(
    (s, f) => s + digits(f.bedrag),
    0,
  );

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <SectionHead
          kicker="Facturen"
          title="Kasstroom"
          note="Betaald en openstaand in inkt op papier."
        />
        <button
          className="inline-flex shrink-0 items-center gap-2 rounded-[3px] px-4 py-2 text-[12.5px] font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2"
          style={{ background: C.ink, color: C.paper, ["--tw-ring-color" as string]: C.ink }}
        >
          <Plus size={14} aria-hidden="true" /> Nieuwe factuur
        </button>
      </div>

      <div className="grid grid-cols-2 gap-px" style={{ background: C.line }}>
        <div className="p-5" style={{ background: C.panel }}>
          <p className="text-[10.5px] uppercase tracking-[0.18em]" style={{ color: C.muted }}>
            Ontvangen
          </p>
          <p className="mt-1.5 text-[24px] font-medium tracking-tight" style={serif}>
            € {betaald.toLocaleString("nl-NL")}
          </p>
        </div>
        <div className="relative overflow-hidden p-5" style={{ background: C.panel }}>
          <span
            aria-hidden="true"
            className="absolute right-0 top-0 h-10 w-10"
            style={patternStyle("hatch")}
          />
          <p className="text-[10.5px] uppercase tracking-[0.18em]" style={{ color: C.muted }}>
            Openstaand
          </p>
          <p className="mt-1.5 text-[24px] font-medium tracking-tight" style={serif}>
            € {open.toLocaleString("nl-NL")}
          </p>
        </div>
      </div>

      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr
                className="text-[10.5px] font-semibold uppercase tracking-[0.14em]"
                style={{ color: C.muted, borderBottom: `1px solid ${C.line}` }}
              >
                <th className="px-5 py-3.5 font-semibold">Nummer</th>
                <th className="px-5 py-3.5 font-semibold">Klant</th>
                <th className="hidden px-5 py-3.5 font-semibold sm:table-cell">Datum</th>
                <th className="px-5 py-3.5 text-right font-semibold">Bedrag</th>
                <th className="px-5 py-3.5 text-right font-semibold">Status</th>
              </tr>
            </thead>
            <tbody>
              {FACTUREN.map((f, i) => {
                const m = meta[f.status] ?? meta.Concept!;
                return (
                  <tr
                    key={f.nr}
                    className="transition-colors hover:bg-[#efeee7]"
                    style={{ borderTop: i === 0 ? "none" : `1px solid ${C.lineSoft}` }}
                  >
                    <td className="px-5 py-4 text-[12px] tabular-nums" style={{ color: C.inkSoft }}>
                      {f.nr}
                    </td>
                    <td className="px-5 py-4 text-[13px] font-medium" style={{ color: C.ink }}>
                      {f.klant}
                    </td>
                    <td
                      className="hidden px-5 py-4 text-[12px] tabular-nums sm:table-cell"
                      style={{ color: C.muted }}
                    >
                      {f.datum}
                    </td>
                    <td
                      className="px-5 py-4 text-right text-[13px] font-semibold tabular-nums"
                      style={{ color: C.ink }}
                    >
                      {f.bedrag}
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex items-center justify-end">
                        <span
                          className="inline-flex items-center gap-1.5 rounded-[2px] px-2 py-1 text-[11px] font-semibold"
                          style={{
                            border: `1px solid ${C.line}`,
                            background: C.panelAlt,
                            color: C.ink,
                          }}
                        >
                          <span
                            aria-hidden="true"
                            className="inline-block h-3 w-3 shrink-0 rounded-[1px]"
                            style={{ ...patternStyle(m.pattern), border: `1px solid ${C.line}` }}
                          />
                          <m.Icon size={12} aria-hidden="true" />
                          {f.status}
                        </span>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
