"use client";

// Concept 223 — "Kwarts" · kristallijn frosted glas, spatial translucency (2026). Koele translucente panelen met
// backdrop-blur, gefacetteerde randen (beveled clip-path als geslepen kristal), ijsblauw/lila licht en subtiele
// lichtbreking-gradients in de hoeken. Diepte ontstaat door gestapelde glaslagen. Koud, helder en mineraal —
// bewust anders dan doorsnee glasmorphism: geen zachte pasteltinten maar geslepen facetten en gericht licht.
// Sans-display (Sora) tegen een neutrale tekst-sans (Inter). Statussen: label + icoon, nooit alleen kleur.
// Deterministisch: geen random, geen Date, geen netwerk/afbeeldingen. UI Nederlands, code Engels.

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
  Gem,
  Minus,
  ChevronRight,
  LayoutGrid,
  Store,
  ListChecks,
  Receipt,
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

// ── Palet — koud, mineraal; ijsblauw + lila licht op diep glas. ──
const C = {
  bg: "#080b16", // diepe koude nacht
  bg2: "#0c1122", // paneelbasis
  ink: "#eef3ff", // helder ijswit
  soft: "#aab6d6", // secundair
  faint: "#727e9f", // labels
  glass: "rgba(255,255,255,0.055)",
  glassHi: "rgba(255,255,255,0.10)",
  glassLine: "rgba(255,255,255,0.14)",
  glassLineHi: "rgba(255,255,255,0.30)",
  ice: "#7dd3fc", // ijsblauw accent
  iceDeep: "#38bdf8",
  lila: "#c4b5fd", // lila accent
  lilaDeep: "#a78bfa",
  mint: "#7cf0c8", // koel mint (goed)
  amber: "#fcd34d", // citrien (aandacht)
  rose: "#fb7185", // roze (afgewezen)
};

const displayF = { fontFamily: "var(--font-lab-sora)" };
const bodyF = { fontFamily: "var(--font-lab-inter)" };

// Beveled facet-clip — geslepen kristalhoeken (linksboven + rechtsonder).
const FACET =
  "polygon(15px 0, 100% 0, 100% calc(100% - 15px), calc(100% - 15px) 100%, 0 100%, 0 15px)";

// ── Status-model — getinte glas-chips; altijd label + icoon. ──
type StatusStyle = { label: string; Icon: LucideIcon; tint: string };
function credMeta(s: CredStatus): StatusStyle {
  switch (s) {
    case "VERIFIED":
      return { label: "Geverifieerd", Icon: BadgeCheck, tint: C.mint };
    case "SUBMITTED":
      return { label: "In beoordeling", Icon: Clock, tint: C.lila };
    case "EXPIRING":
      return { label: "Verloopt binnenkort", Icon: TriangleAlert, tint: C.amber };
    case "REJECTED":
      return { label: "Afgewezen", Icon: XCircle, tint: C.rose };
  }
}

function hexToRgba(hex: string, a: number): string {
  const n = parseInt(hex.slice(1), 16);
  const r = (n >> 16) & 255;
  const g = (n >> 8) & 255;
  const b = n & 255;
  return `rgba(${r}, ${g}, ${b}, ${a})`;
}

function StatusChip({ status }: { status: CredStatus }) {
  const m = credMeta(status);
  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold"
      style={{
        ...bodyF,
        background: hexToRgba(m.tint, 0.14),
        color: m.tint,
        border: `1px solid ${hexToRgba(m.tint, 0.4)}`,
      }}
    >
      <m.Icon size={12} strokeWidth={2.2} aria-hidden="true" />
      {m.label}
    </span>
  );
}

// Glaspaneel — translucent, backdrop-blur, lichtvangende bovenrand, optioneel gefacetteerd.
function Glass({
  children,
  className = "",
  style,
  facet = false,
  tint,
  role,
}: {
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
  facet?: boolean;
  tint?: string;
  role?: string;
}) {
  return (
    <div
      role={role}
      className={`relative ${className}`}
      style={{
        background: tint ?? C.glass,
        backdropFilter: "blur(18px)",
        WebkitBackdropFilter: "blur(18px)",
        border: `1px solid ${C.glassLine}`,
        clipPath: facet ? FACET : undefined,
        boxShadow: "0 24px 60px -30px rgba(0,0,0,0.8), inset 0 1px 0 rgba(255,255,255,0.08)",
        ...style,
      }}
    >
      {!facet && (
        <span
          className="pointer-events-none absolute inset-x-4 top-0 h-px"
          style={{
            background: `linear-gradient(90deg, transparent, ${C.glassLineHi}, transparent)`,
          }}
          aria-hidden="true"
        />
      )}
      {children}
    </div>
  );
}

function SectionHead({ kicker, title }: { kicker: string; title: string }) {
  return (
    <div>
      <div className="flex items-center gap-2">
        <Gem size={13} strokeWidth={2} style={{ color: C.ice }} aria-hidden="true" />
        <span
          className="text-[11px] font-semibold uppercase tracking-[0.2em]"
          style={{ ...bodyF, color: C.faint }}
        >
          {kicker}
        </span>
      </div>
      <h2
        className="mt-1.5 text-[25px] font-semibold leading-tight"
        style={{ ...displayF, color: C.ink }}
      >
        {title}
      </h2>
    </div>
  );
}

function Meta({ Icon, label, value }: { Icon: LucideIcon; label: string; value: string }) {
  return (
    <div>
      <div className="flex items-center gap-1.5" style={{ color: C.faint }}>
        <Icon size={13} strokeWidth={2} aria-hidden="true" />
        <span className="text-[10px] font-semibold uppercase tracking-[0.12em]" style={bodyF}>
          {label}
        </span>
      </div>
      <div className="mt-1 text-[15px] font-medium tabular-nums" style={{ ...bodyF, color: C.ink }}>
        {value}
      </div>
    </div>
  );
}

// Sparkline met koele gradient-lijn en glaslaag eronder.
function Spark({ data, id }: { data: number[]; id: string }) {
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
      <defs>
        <linearGradient id={`${id}-l`} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor={C.ice} />
          <stop offset="1" stopColor={C.lila} />
        </linearGradient>
        <linearGradient id={`${id}-a`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={C.ice} stopOpacity="0.28" />
          <stop offset="1" stopColor={C.ice} stopOpacity="0" />
        </linearGradient>
      </defs>
      <polygon points={area} fill={`url(#${id}-a)`} />
      <polyline
        points={line}
        fill="none"
        stroke={`url(#${id}-l)`}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

// Kristallijne match-ring — gefacetteerde glas-schijf met gradient-boog.
function MatchRing({
  value,
  size = "md",
  id,
}: {
  value: number;
  size?: "sm" | "md" | "lg";
  id: string;
}) {
  const dims =
    size === "lg"
      ? { box: "h-28 w-28", num: "text-[34px]" }
      : size === "sm"
        ? { box: "h-14 w-14", num: "text-[16px]" }
        : { box: "h-20 w-20", num: "text-[22px]" };
  const r = 52;
  const circ = 2 * Math.PI * r;
  return (
    <span
      className={`relative flex ${dims.box} shrink-0 items-center justify-center`}
      aria-hidden="true"
    >
      <svg viewBox="0 0 120 120" className="h-full w-full -rotate-90">
        <defs>
          <linearGradient id={`${id}-ring`} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor={C.ice} />
            <stop offset="1" stopColor={C.lila} />
          </linearGradient>
        </defs>
        <circle cx="60" cy="60" r={r} fill="none" stroke="rgba(255,255,255,0.10)" strokeWidth="9" />
        <circle
          cx="60"
          cy="60"
          r={r}
          fill="none"
          stroke={`url(#${id}-ring)`}
          strokeWidth="9"
          strokeLinecap="round"
          strokeDasharray={`${(value / 100) * circ} ${circ}`}
        />
      </svg>
      <span className="absolute flex flex-col items-center leading-none">
        <span
          className={`${dims.num} font-semibold tabular-nums`}
          style={{ ...displayF, color: C.ink }}
        >
          {value}
        </span>
        {size !== "sm" && (
          <span
            className="text-[9px] font-semibold uppercase tracking-[0.14em]"
            style={{ color: C.ice }}
          >
            match
          </span>
        )}
      </span>
    </span>
  );
}

const NAV_ICONS: Record<ScreenKey, LucideIcon> = {
  dashboard: LayoutGrid,
  marktplaats: Store,
  opdracht: FileText,
  verificatie: ShieldCheck,
  documenten: FileText,
  facturen: Receipt,
  berichten: FileText,
  acties: ListChecks,
};

// ── Root — glaslaag boven koud licht; hoek-refractie in de achtergrond. ────────────
export function Concept223() {
  const [screen, setScreen] = useState<ScreenKey>("dashboard");
  const active = OPDRACHTEN[0] as Opdracht;

  return (
    <div
      className="relative min-h-screen w-full overflow-x-hidden antialiased"
      style={{ ...bodyF, background: C.bg, color: C.ink }}
    >
      {/* Lichtbreking in de hoeken — ijsblauw + lila. */}
      <div
        className="pointer-events-none fixed inset-0 z-0"
        style={{
          background: `radial-gradient(760px 520px at 6% -8%, ${hexToRgba(C.ice, 0.22)}, transparent 60%), radial-gradient(680px 520px at 102% 4%, ${hexToRgba(C.lila, 0.2)}, transparent 62%), radial-gradient(720px 620px at 50% 116%, ${hexToRgba(C.iceDeep, 0.14)}, transparent 60%)`,
        }}
        aria-hidden="true"
      />
      {/* Fijn facet-raster — nauwelijks zichtbaar, geeft mineraal oppervlak. */}
      <div
        className="pointer-events-none fixed inset-0 z-0 opacity-[0.04]"
        style={{
          backgroundImage:
            "linear-gradient(rgba(255,255,255,0.6) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.6) 1px, transparent 1px)",
          backgroundSize: "56px 56px",
        }}
        aria-hidden="true"
      />

      <div className="relative z-10">
        <header
          className="sticky top-0 z-30"
          style={{
            background: hexToRgba(C.bg, 0.6),
            backdropFilter: "blur(16px)",
            WebkitBackdropFilter: "blur(16px)",
            borderBottom: `1px solid ${C.glassLine}`,
          }}
        >
          <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-4 py-4 md:px-8">
            <div className="flex items-center gap-3">
              <span
                className="flex h-11 w-11 items-center justify-center"
                style={{
                  background: `linear-gradient(140deg, ${hexToRgba(C.ice, 0.3)}, ${hexToRgba(C.lila, 0.3)})`,
                  border: `1px solid ${C.glassLineHi}`,
                  clipPath: FACET,
                }}
                aria-hidden="true"
              >
                <Gem size={20} strokeWidth={2} style={{ color: C.ink }} />
              </span>
              <div className="leading-tight">
                <div className="text-[19px] font-semibold" style={{ ...displayF, color: C.ink }}>
                  Kwarts
                </div>
                <div className="mt-0.5 text-[11px]" style={{ color: C.faint }}>
                  Hallo {PROFIEL.naam.split(" ")[0]} · {PROFIEL.plaats}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <span
                className="hidden items-center gap-1.5 rounded-full px-3 py-1.5 text-[11px] font-semibold sm:inline-flex"
                style={{
                  background: hexToRgba(C.mint, 0.12),
                  color: C.mint,
                  border: `1px solid ${hexToRgba(C.mint, 0.35)}`,
                }}
              >
                <ShieldCheck size={13} strokeWidth={2.2} aria-hidden="true" /> {PROFIEL.trust}
              </span>
              <span
                className="flex h-10 w-10 items-center justify-center rounded-full text-[13px] font-semibold"
                style={{
                  ...displayF,
                  background: `linear-gradient(140deg, ${hexToRgba(C.ice, 0.35)}, ${hexToRgba(C.lila, 0.35)})`,
                  color: C.ink,
                  border: `1px solid ${C.glassLineHi}`,
                }}
                aria-hidden="true"
              >
                {PROFIEL.initialen}
              </span>
            </div>
          </div>

          <nav
            className="mx-auto flex max-w-6xl items-center gap-1.5 overflow-x-auto px-4 pb-3 md:px-8"
            aria-label="Schermen"
          >
            {SCREENS.map((s) => {
              const on = s.key === screen;
              const Icon = NAV_ICONS[s.key];
              return (
                <button
                  key={s.key}
                  onClick={() => setScreen(s.key)}
                  aria-current={on ? "page" : undefined}
                  className="inline-flex shrink-0 items-center gap-2 rounded-full px-3.5 py-2 text-[13px] font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
                  style={
                    on
                      ? {
                          background: hexToRgba(C.ice, 0.16),
                          color: C.ice,
                          border: `1px solid ${hexToRgba(C.ice, 0.45)}`,
                          ["--tw-ring-color" as string]: C.ice,
                          ["--tw-ring-offset-color" as string]: C.bg,
                        }
                      : {
                          background: C.glass,
                          color: C.soft,
                          border: `1px solid ${C.glassLine}`,
                          ["--tw-ring-color" as string]: C.ice,
                          ["--tw-ring-offset-color" as string]: C.bg,
                        }
                  }
                >
                  <Icon size={14} strokeWidth={2} aria-hidden="true" />
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
            style={{ borderColor: C.glassLine, color: C.faint }}
          >
            <Gem size={13} strokeWidth={2} style={{ color: C.ice }} aria-hidden="true" />
            Kristallijn en koel — gestapelde glaslagen, gefacetteerde randen; elke status draagt
            woord én icoon.
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
      {/* Hero — gestapelde glaslagen voor diepte. */}
      <div className="relative">
        <div
          className="absolute -left-3 -top-3 hidden h-full w-full sm:block"
          style={{
            background: hexToRgba(C.lila, 0.06),
            border: `1px solid ${C.glassLine}`,
            clipPath: FACET,
          }}
          aria-hidden="true"
        />
        <Glass facet className="relative overflow-hidden">
          <div
            className="pointer-events-none absolute -right-16 -top-16 h-64 w-64 rounded-full"
            style={{
              background: `radial-gradient(circle, ${hexToRgba(C.ice, 0.35)}, transparent 65%)`,
            }}
            aria-hidden="true"
          />
          <div className="relative grid gap-6 p-6 sm:p-9 lg:grid-cols-[1.6fr_1fr]">
            <div>
              <span
                className="inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-[12px] font-semibold"
                style={{ background: C.glassHi, color: C.ice, border: `1px solid ${C.glassLine}` }}
              >
                <Gem size={13} strokeWidth={2.2} aria-hidden="true" /> {PROFIEL.rol}
              </span>
              <h1
                className="mt-5 text-[32px] font-semibold leading-[1.05] sm:text-[44px]"
                style={{ ...displayF, color: C.ink }}
              >
                Goedemorgen, {PROFIEL.naam.split(" ")[0]}.
                <br />
                <span style={{ color: C.ice }}>Drie heldere matches</span> voor je klaargezet.
              </h1>
              <p className="mt-4 max-w-lg text-[14.5px] leading-relaxed" style={{ color: C.soft }}>
                Eén punt vraagt aandacht — je VOG verloopt binnenkort. De rest van je week is helder
                en op orde.
              </p>
              <div className="mt-6 flex flex-wrap gap-3">
                <button
                  onClick={onOpen}
                  className="inline-flex items-center gap-2 rounded-full px-6 py-3 text-[14px] font-semibold transition-transform hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
                  style={{
                    background: `linear-gradient(135deg, ${C.ice}, ${C.lila})`,
                    color: "#08131f",
                    ["--tw-ring-color" as string]: C.ice,
                    ["--tw-ring-offset-color" as string]: C.bg,
                  }}
                >
                  Bekijk je matches <ArrowRight size={16} aria-hidden="true" />
                </button>
                <button
                  onClick={onActies}
                  className="inline-flex items-center gap-2 rounded-full px-6 py-3 text-[14px] font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
                  style={{
                    background: C.glass,
                    color: C.ink,
                    border: `1px solid ${C.glassLine}`,
                    ["--tw-ring-color" as string]: C.ice,
                    ["--tw-ring-offset-color" as string]: C.bg,
                  }}
                >
                  <TriangleAlert
                    size={14}
                    strokeWidth={2.2}
                    style={{ color: C.amber }}
                    aria-hidden="true"
                  />{" "}
                  Regel je VOG
                </button>
              </div>
            </div>

            <Glass className="flex flex-col items-center justify-center gap-3 rounded-2xl p-6 text-center">
              <MatchRing value={dek} size="lg" id="c223-dash-trust" />
              <StatusChip status="VERIFIED" />
              <p className="text-[12.5px] leading-relaxed" style={{ color: C.soft }}>
                {verified} van je {CREDENTIALS.length} certificaten zijn geverifieerd.
                Opdrachtgevers zien uitsluitend gecontroleerde documenten.
              </p>
            </Glass>
          </div>
        </Glass>
      </div>

      {/* KPI's */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {KPIS.map((k, i) => (
          <Glass key={k.label} className="rounded-2xl p-5">
            <div className="flex items-start justify-between gap-2">
              <span className="text-[11px] font-medium" style={{ color: C.faint }}>
                {k.label}
              </span>
              <span
                className="rounded-full px-2 py-0.5 text-[10px] font-semibold tabular-nums"
                style={{
                  background: hexToRgba(k.up ? C.mint : C.amber, 0.14),
                  color: k.up ? C.mint : C.amber,
                }}
              >
                {k.trend}
              </span>
            </div>
            <div
              className="mt-2.5 text-[26px] font-semibold tabular-nums leading-none"
              style={{ ...displayF, color: C.ink }}
            >
              {k.value}
            </div>
            <div className="mt-3">
              <Spark data={k.spark} id={`c223-kpi-${i}`} />
            </div>
          </Glass>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-[1.6fr_1fr]">
        <section className="space-y-4">
          <SectionHead kicker="Voor jou geselecteerd" title="Best passende opdrachten" />
          <div className="space-y-3">
            {OPDRACHTEN.map((o, i) => (
              <Glass key={o.id} className="overflow-hidden rounded-2xl">
                <button
                  onClick={onOpen}
                  className="flex w-full items-center gap-4 p-4 text-left transition-colors hover:bg-[color:var(--hov)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset"
                  style={{ ["--hov" as string]: C.glassHi, ["--tw-ring-color" as string]: C.ice }}
                >
                  <MatchRing value={o.match} size="sm" id={`c223-list-${i}`} />
                  <div className="min-w-0 flex-1">
                    <div
                      className="text-[10px] font-semibold uppercase tracking-[0.1em]"
                      style={{ color: C.ice }}
                    >
                      {o.id}
                    </div>
                    <div
                      className="mt-0.5 truncate text-[16px] font-semibold"
                      style={{ ...displayF, color: C.ink }}
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
              </Glass>
            ))}
          </div>
        </section>

        <section className="space-y-6">
          <div className="space-y-4">
            <SectionHead kicker="Vraagt aandacht" title="Nu regelen" />
            <Glass
              className="rounded-2xl p-5"
              tint={hexToRgba(C.amber, 0.08)}
              style={{ borderColor: hexToRgba(C.amber, 0.35) }}
            >
              <span
                className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.06em]"
                style={{ background: hexToRgba(C.amber, 0.18), color: C.amber }}
              >
                <TriangleAlert size={11} strokeWidth={2.4} aria-hidden="true" /> Prioriteit
              </span>
              <h3
                className="mt-3 text-[18px] font-semibold leading-tight"
                style={{ ...displayF, color: C.ink }}
              >
                {warn.titel}
              </h3>
              <p className="mt-1.5 text-[13px] leading-relaxed" style={{ color: C.soft }}>
                {warn.detail}
              </p>
              <button
                onClick={onActies}
                className="mt-4 inline-flex items-center gap-2 rounded-full px-4 py-2.5 text-[12.5px] font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
                style={{
                  background: C.amber,
                  color: "#231803",
                  ["--tw-ring-color" as string]: C.amber,
                  ["--tw-ring-offset-color" as string]: C.bg,
                }}
              >
                {warn.cta} <ArrowRight size={13} aria-hidden="true" />
              </button>
            </Glass>
          </div>

          <div className="space-y-4">
            <SectionHead kicker="Vertrouwen" title="Verificatiestand" />
            <Glass className="flex items-center gap-4 rounded-2xl p-5">
              <MatchRing value={dek} size="md" id="c223-trust2" />
              <div className="min-w-0">
                <div className="text-[15px] font-semibold" style={{ ...displayF, color: C.ink }}>
                  {verified} van {CREDENTIALS.length} geverifieerd
                </div>
                <p className="mt-1 text-[12.5px] leading-relaxed" style={{ color: C.soft }}>
                  Elk gecontroleerd document versterkt je profiel.
                </p>
              </div>
            </Glass>
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
            className="flex items-center gap-2 rounded-full px-4 py-2.5"
            style={{ background: C.glass, border: `1px solid ${C.glassLine}` }}
          >
            <Search size={15} strokeWidth={2} style={{ color: C.ice }} aria-hidden="true" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Zoek titel of plaats…"
              aria-label="Opdrachten zoeken"
              className="w-44 bg-transparent text-[13px] outline-none placeholder:opacity-50"
              style={{ color: C.ink }}
            />
          </div>
          <button
            onClick={refresh}
            aria-label="Opdrachten verversen"
            className="flex h-10 w-10 items-center justify-center rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
            style={{
              background: C.glass,
              border: `1px solid ${C.glassLine}`,
              color: C.ice,
              ["--tw-ring-color" as string]: C.ice,
              ["--tw-ring-offset-color" as string]: C.bg,
            }}
          >
            <RefreshCw size={15} className={loading ? "animate-spin" : ""} aria-hidden="true" />
          </button>
        </div>
      </div>

      {error && (
        <Glass
          className="flex items-start gap-3 rounded-2xl p-4"
          role="alert"
          tint={hexToRgba(C.rose, 0.08)}
          style={{ borderColor: hexToRgba(C.rose, 0.4) }}
        >
          <XCircle size={18} strokeWidth={2} style={{ color: C.rose }} aria-hidden="true" />
          <div className="min-w-0 flex-1">
            <div className="text-[14px] font-semibold" style={{ ...displayF, color: C.ink }}>
              Niet alles kon worden geladen
            </div>
            <p className="mt-0.5 text-[12.5px]" style={{ color: C.soft }}>
              Enkele opdrachten reageerden traag. Ververs om het opnieuw te proberen.
            </p>
          </div>
          <button
            onClick={() => setError(false)}
            className="shrink-0 text-[11px] font-semibold uppercase tracking-[0.06em] focus-visible:outline-none focus-visible:ring-2"
            style={{ color: C.rose, ["--tw-ring-color" as string]: C.rose }}
          >
            Sluiten
          </button>
        </Glass>
      )}

      {loading ? (
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
          {[0, 1, 2].map((i) => (
            <Glass key={i} className="rounded-2xl p-5">
              <div className="flex items-center gap-3">
                <span
                  className="h-14 w-14 shrink-0 animate-pulse rounded-full"
                  style={{ background: C.glassHi }}
                />
                <div className="flex-1 space-y-2">
                  <span
                    className="block h-4 w-3/4 animate-pulse rounded-full"
                    style={{ background: C.glassHi }}
                  />
                  <span
                    className="block h-3 w-1/2 animate-pulse rounded-full"
                    style={{ background: C.glass }}
                  />
                </div>
              </div>
              <div className="mt-4 space-y-2">
                <span
                  className="block h-3 w-full animate-pulse rounded-full"
                  style={{ background: C.glass }}
                />
                <span
                  className="block h-3 w-5/6 animate-pulse rounded-full"
                  style={{ background: C.glass }}
                />
              </div>
            </Glass>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <Glass
          facet
          className="flex flex-col items-center justify-center gap-3 px-6 py-16 text-center"
        >
          <span
            className="flex h-16 w-16 items-center justify-center"
            style={{ background: C.glassHi, border: `1px solid ${C.glassLine}`, clipPath: FACET }}
            aria-hidden="true"
          >
            <Search size={26} strokeWidth={1.6} style={{ color: C.soft }} />
          </span>
          <p className="text-[23px] font-semibold" style={{ ...displayF, color: C.ink }}>
            Geen opdracht gevonden
          </p>
          <p className="max-w-sm text-[13px] leading-relaxed" style={{ color: C.soft }}>
            Voor &ldquo;{q}&rdquo; staat nu niets open. Pas je zoekterm aan of wis het veld.
          </p>
          <button
            onClick={() => setQ("")}
            className="mt-1 rounded-full px-5 py-2.5 text-[13px] font-semibold transition-transform hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
            style={{
              background: `linear-gradient(135deg, ${C.ice}, ${C.lila})`,
              color: "#08131f",
              ["--tw-ring-color" as string]: C.ice,
              ["--tw-ring-offset-color" as string]: C.bg,
            }}
          >
            Toon alles
          </button>
        </Glass>
      ) : (
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
          {filtered.map((o, i) => (
            <Glass key={o.id} className="flex flex-col overflow-hidden rounded-2xl">
              <div className="flex items-start justify-between gap-3 p-5">
                <div className="min-w-0">
                  <div
                    className="text-[10px] font-semibold uppercase tracking-[0.1em]"
                    style={{ color: C.ice }}
                  >
                    {o.id}
                  </div>
                  <h3
                    className="mt-1 text-[17px] font-semibold leading-tight"
                    style={{ ...displayF, color: C.ink }}
                  >
                    {o.titel}
                  </h3>
                  <p className="mt-0.5 text-[12.5px]" style={{ color: C.soft }}>
                    {o.opdrachtgever}
                  </p>
                </div>
                <MatchRing value={o.match} size="sm" id={`c223-mkt-${i}`} />
              </div>
              <div className="px-5 pb-2">
                <dl className="grid grid-cols-2 gap-3.5">
                  <Meta Icon={MapPin} label="Plaats" value={o.plaats} />
                  <Meta Icon={Coins} label="Tarief" value={o.tarief} />
                  <Meta Icon={Clock} label="Omvang" value={o.uren} />
                  <Meta Icon={CalendarDays} label="Start" value={o.start} />
                </dl>
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {o.tags.map((t) => (
                    <span
                      key={t}
                      className="rounded-full px-2.5 py-0.5 text-[11px] font-medium"
                      style={{
                        background: C.glassHi,
                        color: C.soft,
                        border: `1px solid ${C.glassLine}`,
                      }}
                    >
                      {t}
                    </span>
                  ))}
                </div>
              </div>
              <button
                onClick={onOpen}
                className="mt-auto flex items-center justify-center gap-2 px-5 py-3.5 text-[12.5px] font-semibold transition-colors hover:bg-[color:var(--hov)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset"
                style={{
                  borderTop: `1px solid ${C.glassLine}`,
                  color: C.ice,
                  ["--hov" as string]: C.glassHi,
                  ["--tw-ring-color" as string]: C.ice,
                }}
              >
                Bekijk opdracht <ArrowRight size={14} aria-hidden="true" />
              </button>
            </Glass>
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
        className="inline-flex items-center gap-2 text-[12px] font-semibold uppercase tracking-[0.08em] transition-colors focus-visible:outline-none focus-visible:ring-2"
        style={{ color: C.ice, ["--tw-ring-color" as string]: C.ice }}
      >
        <ArrowLeft size={14} aria-hidden="true" /> Terug naar marktplaats
      </button>

      <Glass facet className="relative overflow-hidden">
        <div
          className="pointer-events-none absolute -right-14 -top-14 h-56 w-56 rounded-full"
          style={{
            background: `radial-gradient(circle, ${hexToRgba(C.lila, 0.32)}, transparent 65%)`,
          }}
          aria-hidden="true"
        />
        <div className="relative flex flex-wrap items-center justify-between gap-6 p-6 sm:p-8">
          <div className="min-w-0">
            <div
              className="text-[11px] font-semibold uppercase tracking-[0.12em]"
              style={{ color: C.ice }}
            >
              {opdracht.id} · Start {opdracht.start}
            </div>
            <h1
              className="mt-2 max-w-2xl text-[28px] font-semibold leading-[1.08] sm:text-[36px]"
              style={{ ...displayF, color: C.ink }}
            >
              {opdracht.titel}
            </h1>
            <p className="mt-2 text-[14px]" style={{ color: C.soft }}>
              {opdracht.opdrachtgever} · {opdracht.plaats}
            </p>
          </div>
          <MatchRing value={opdracht.match} size="lg" id="c223-detail" />
        </div>
      </Glass>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {[
          { Icon: Coins, label: "Tarief", value: opdracht.tarief },
          { Icon: Clock, label: "Omvang", value: opdracht.uren },
          { Icon: CalendarDays, label: "Start", value: opdracht.start },
          { Icon: MapPin, label: "Plaats", value: opdracht.plaats },
        ].map((f) => (
          <Glass key={f.label} className="rounded-2xl p-5">
            <Meta Icon={f.Icon} label={f.label} value={f.value} />
          </Glass>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
        <section className="space-y-4">
          <SectionHead kicker="In het voordeel" title="Waarom dit past" />
          <Glass className="rounded-2xl p-5">
            <ul className="space-y-3">
              {opdracht.redenen.plus.map((r) => (
                <li
                  key={r}
                  className="flex items-start gap-3 text-[14px] leading-snug"
                  style={{ color: C.ink }}
                >
                  <span
                    className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full"
                    style={{ background: hexToRgba(C.mint, 0.14) }}
                    aria-hidden="true"
                  >
                    <Check size={13} strokeWidth={2.6} style={{ color: C.mint }} />
                  </span>
                  {r}
                </li>
              ))}
            </ul>
          </Glass>
        </section>
        <section className="space-y-4">
          <SectionHead kicker="Om te wegen" title="Aandachtspunten" />
          <Glass className="rounded-2xl p-5">
            <ul className="space-y-3">
              {opdracht.redenen.min.map((r) => (
                <li
                  key={r}
                  className="flex items-start gap-3 text-[14px] leading-snug"
                  style={{ color: C.ink }}
                >
                  <span
                    className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full"
                    style={{ background: hexToRgba(C.amber, 0.16) }}
                    aria-hidden="true"
                  >
                    <Minus size={13} strokeWidth={2.6} style={{ color: C.amber }} />
                  </span>
                  {r}
                </li>
              ))}
            </ul>
          </Glass>
        </section>
      </div>

      <Glass className="rounded-2xl p-5">
        <div className="flex items-center gap-2">
          <ShieldCheck size={16} strokeWidth={2.2} style={{ color: C.ice }} aria-hidden="true" />
          <span className="text-[15px] font-semibold" style={{ ...displayF, color: C.ink }}>
            Wat de opdrachtgever vraagt
          </span>
        </div>
        <div className="mt-3 flex flex-wrap gap-2">
          {opdracht.tags.map((t) => (
            <span
              key={t}
              className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[12.5px] font-medium"
              style={{ background: C.glassHi, color: C.ink, border: `1px solid ${C.glassLine}` }}
            >
              <BadgeCheck size={13} strokeWidth={2} style={{ color: C.ice }} aria-hidden="true" />{" "}
              {t}
            </span>
          ))}
        </div>
      </Glass>

      <div className="flex flex-col gap-3 sm:flex-row">
        <button
          onClick={() => setApplied(true)}
          disabled={applied}
          className="flex flex-1 items-center justify-center gap-2 rounded-full px-6 py-4 text-[14px] font-semibold transition-transform hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:translate-y-0"
          style={{
            background: applied
              ? hexToRgba(C.mint, 0.14)
              : `linear-gradient(135deg, ${C.ice}, ${C.lila})`,
            color: applied ? C.mint : "#08131f",
            border: applied ? `1px solid ${hexToRgba(C.mint, 0.4)}` : "none",
            ["--tw-ring-color" as string]: C.ice,
            ["--tw-ring-offset-color" as string]: C.bg,
          }}
        >
          {applied ? (
            <>
              <Check size={16} strokeWidth={2.6} aria-hidden="true" /> Reactie verstuurd
            </>
          ) : (
            <>
              Reageren op deze opdracht <ArrowRight size={16} aria-hidden="true" />
            </>
          )}
        </button>
        <button
          onClick={() => setSaved((s) => !s)}
          aria-pressed={saved}
          className="flex items-center justify-center gap-2 rounded-full px-6 py-4 text-[14px] font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
          style={{
            background: saved ? hexToRgba(C.ice, 0.16) : C.glass,
            color: saved ? C.ice : C.ink,
            border: `1px solid ${saved ? hexToRgba(C.ice, 0.45) : C.glassLine}`,
            ["--tw-ring-color" as string]: C.ice,
            ["--tw-ring-offset-color" as string]: C.bg,
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
          className="inline-flex items-center gap-2 rounded-full px-4 py-2.5 text-[13px] font-semibold transition-transform hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
          style={{
            background: `linear-gradient(135deg, ${C.ice}, ${C.lila})`,
            color: "#08131f",
            ["--tw-ring-color" as string]: C.ice,
            ["--tw-ring-offset-color" as string]: C.bg,
          }}
        >
          <Plus size={14} aria-hidden="true" /> Document toevoegen
        </button>
      </div>

      <Glass facet className="relative overflow-hidden">
        <div
          className="pointer-events-none absolute -bottom-12 -left-12 h-52 w-52 rounded-full"
          style={{
            background: `radial-gradient(circle, ${hexToRgba(C.ice, 0.28)}, transparent 65%)`,
          }}
          aria-hidden="true"
        />
        <div className="relative flex flex-wrap items-center gap-8 p-6 sm:p-8">
          <MatchRing value={dek} size="lg" id="c223-verif" />
          <div className="max-w-md">
            <div className="text-[22px] font-semibold" style={{ ...displayF, color: C.ink }}>
              {verified} van {CREDENTIALS.length} certificaten gecontroleerd
            </div>
            <p className="mt-2 text-[13.5px] leading-relaxed" style={{ color: C.soft }}>
              Elk geverifieerd document versterkt je profiel. Nog even en je staat volledig helder.
            </p>
            <span
              className="mt-3 inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[12px] font-semibold"
              style={{
                background: hexToRgba(C.mint, 0.12),
                color: C.mint,
                border: `1px solid ${hexToRgba(C.mint, 0.35)}`,
              }}
            >
              <ShieldCheck size={13} strokeWidth={2.2} aria-hidden="true" /> {PROFIEL.trust}
            </span>
          </div>
        </div>
      </Glass>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {CREDENTIALS.map((c) => {
          const m = credMeta(c.status);
          const actionable = c.status !== "VERIFIED";
          return (
            <Glass key={c.naam} className="flex items-center gap-4 rounded-2xl p-5">
              <span
                className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl"
                style={{
                  background: hexToRgba(m.tint, 0.14),
                  border: `1px solid ${hexToRgba(m.tint, 0.3)}`,
                }}
                aria-hidden="true"
              >
                <m.Icon size={20} strokeWidth={2.2} style={{ color: m.tint }} />
              </span>
              <div className="min-w-0 flex-1">
                <div
                  className="truncate text-[15px] font-semibold"
                  style={{ ...displayF, color: C.ink }}
                >
                  {c.naam}
                </div>
                <div className="mt-0.5 text-[12.5px]" style={{ color: C.soft }}>
                  {c.detail}
                </div>
                <div className="mt-2 flex flex-wrap items-center gap-2">
                  <StatusChip status={c.status} />
                  {actionable && (
                    <button
                      className="text-[11px] font-semibold uppercase tracking-[0.06em] underline-offset-4 transition-colors hover:underline focus-visible:outline-none focus-visible:ring-2"
                      style={{ color: C.ice, ["--tw-ring-color" as string]: C.ice }}
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
            </Glass>
          );
        })}
      </div>

      <section className="space-y-4">
        <SectionHead kicker="Veilig & privé bewaard" title="Je documenten" />
        <Glass className="overflow-hidden rounded-2xl">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[520px] text-left">
              <thead>
                <tr style={{ background: C.glassHi, borderBottom: `1px solid ${C.glassLine}` }}>
                  {["Document", "Type", "Grootte", "Status", "Bijgewerkt"].map((h) => (
                    <th
                      key={h}
                      className="px-5 py-3 text-[10px] font-semibold uppercase tracking-[0.1em]"
                      style={{ color: C.faint }}
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
                    style={{ borderTop: i === 0 ? undefined : `1px solid ${C.glassLine}` }}
                  >
                    <td
                      className="px-5 py-3.5 text-[13.5px] font-semibold"
                      style={{ ...displayF, color: C.ink }}
                    >
                      {d.naam}
                    </td>
                    <td className="px-5 py-3.5 text-[12.5px]" style={{ color: C.soft }}>
                      {d.type}
                    </td>
                    <td
                      className="px-5 py-3.5 text-[12.5px] tabular-nums"
                      style={{ color: C.soft }}
                    >
                      {d.grootte}
                    </td>
                    <td className="px-5 py-3.5">
                      <StatusChip status={d.status} />
                    </td>
                    <td
                      className="px-5 py-3.5 text-[12.5px] tabular-nums"
                      style={{ color: C.faint }}
                    >
                      {d.bijgewerkt}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Glass>
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
          className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[11px] font-semibold"
          style={
            openCount === 0
              ? {
                  background: hexToRgba(C.mint, 0.14),
                  color: C.mint,
                  border: `1px solid ${hexToRgba(C.mint, 0.35)}`,
                }
              : {
                  background: hexToRgba(C.amber, 0.14),
                  color: C.amber,
                  border: `1px solid ${hexToRgba(C.amber, 0.35)}`,
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
          const tone = warn ? C.amber : C.lila;
          return (
            <li key={a.titel}>
              <Glass
                className="overflow-hidden rounded-2xl"
                style={isDone ? { opacity: 0.6 } : undefined}
              >
                <div className="flex items-stretch">
                  <span
                    className="w-1.5 shrink-0"
                    style={{ background: tone }}
                    aria-hidden="true"
                  />
                  <div className="flex min-w-0 flex-1 items-start gap-4 p-5">
                    <span
                      className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-[16px] font-semibold tabular-nums"
                      style={{ ...displayF, background: hexToRgba(tone, 0.14), color: tone }}
                      aria-hidden="true"
                    >
                      {isDone ? (
                        <Check size={19} strokeWidth={2.6} />
                      ) : warn ? (
                        <TriangleAlert size={18} strokeWidth={2.2} />
                      ) : (
                        i + 1
                      )}
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span
                          className="inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-[0.06em]"
                          style={{ background: hexToRgba(tone, 0.16), color: tone }}
                        >
                          {warn ? (
                            <TriangleAlert size={11} strokeWidth={2.4} aria-hidden="true" />
                          ) : (
                            <Gem size={11} strokeWidth={2.4} aria-hidden="true" />
                          )}
                          {warn ? "Aandacht" : "Kans"}
                        </span>
                        <h3
                          className={`text-[16px] font-semibold leading-tight ${isDone ? "line-through" : ""}`}
                          style={{ ...displayF, color: C.ink }}
                        >
                          {a.titel}
                        </h3>
                      </div>
                      <p className="mt-1.5 text-[13px] leading-relaxed" style={{ color: C.soft }}>
                        {a.detail}
                      </p>
                      <div className="mt-3 flex flex-wrap items-center gap-3">
                        <button
                          onClick={a.cta === "Bekijk matches" ? onMatches : undefined}
                          className="inline-flex items-center gap-2 rounded-full px-4 py-2 text-[12.5px] font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
                          style={
                            warn
                              ? {
                                  background: C.amber,
                                  color: "#231803",
                                  ["--tw-ring-color" as string]: C.amber,
                                  ["--tw-ring-offset-color" as string]: C.bg,
                                }
                              : {
                                  background: C.glassHi,
                                  color: C.ink,
                                  border: `1px solid ${C.glassLine}`,
                                  ["--tw-ring-color" as string]: C.ice,
                                  ["--tw-ring-offset-color" as string]: C.bg,
                                }
                          }
                        >
                          {a.cta} <ArrowRight size={13} aria-hidden="true" />
                        </button>
                        <button
                          onClick={() => setDone((d) => ({ ...d, [a.titel]: !d[a.titel] }))}
                          className="inline-flex items-center gap-1.5 text-[12.5px] font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2"
                          style={{
                            color: isDone ? C.faint : C.mint,
                            ["--tw-ring-color" as string]: C.mint,
                          }}
                        >
                          <Check size={14} strokeWidth={2.6} aria-hidden="true" />{" "}
                          {isDone ? "Ongedaan maken" : "Markeer klaar"}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </Glass>
            </li>
          );
        })}
      </ol>

      {openCount === 0 && (
        <Glass className="flex flex-col items-center gap-2 rounded-2xl px-6 py-12 text-center">
          <Gem size={28} strokeWidth={2} style={{ color: C.ice }} aria-hidden="true" />
          <p className="text-[20px] font-semibold" style={{ ...displayF, color: C.ink }}>
            Alles afgerond
          </p>
          <p className="max-w-xs text-[13px] leading-relaxed" style={{ color: C.soft }}>
            Je hebt elk punt afgehandeld. We laten het weten zodra er iets nieuws binnenkomt.
          </p>
        </Glass>
      )}
    </div>
  );
}

// ── Facturen ─────────────────────────────────────────────────────────────────────
function Facturen() {
  const factMeta = (status: string): { label: string; Icon: LucideIcon; tint: string } => {
    if (status === "Betaald") return { label: "Betaald", Icon: Check, tint: C.mint };
    if (status === "Openstaand") return { label: "Openstaand", Icon: Clock, tint: C.amber };
    return { label: "Concept", Icon: FileText, tint: C.soft };
  };
  const betaald = "€ 8.622";
  const open = FACTUREN.filter((f) => f.status === "Openstaand").length;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <SectionHead kicker="Omzet & openstaand" title="Facturen" />
        <button
          className="inline-flex items-center gap-2 rounded-full px-4 py-2.5 text-[13px] font-semibold transition-transform hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
          style={{
            background: `linear-gradient(135deg, ${C.ice}, ${C.lila})`,
            color: "#08131f",
            ["--tw-ring-color" as string]: C.ice,
            ["--tw-ring-offset-color" as string]: C.bg,
          }}
        >
          <Plus size={14} aria-hidden="true" /> Nieuwe factuur
        </button>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {[
          { l: "Betaald deze maand", v: betaald, tint: C.mint },
          { l: "Openstaand", v: `${open}`, tint: C.amber },
          { l: "Nog te factureren", v: "€ 1.350", tint: C.ice },
        ].map((s) => (
          <Glass key={s.l} className="rounded-2xl p-5">
            <div
              className="text-[10px] font-semibold uppercase tracking-[0.12em]"
              style={{ color: C.faint }}
            >
              {s.l}
            </div>
            <div
              className="mt-2 text-[28px] font-semibold tabular-nums leading-none"
              style={{ ...displayF, color: s.tint }}
            >
              {s.v}
            </div>
          </Glass>
        ))}
      </div>

      <Glass className="overflow-hidden rounded-2xl">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[560px] text-left">
            <thead>
              <tr style={{ background: C.glassHi, borderBottom: `1px solid ${C.glassLine}` }}>
                {["Nummer", "Klant", "Datum", "Status", "Bedrag"].map((h, i) => (
                  <th
                    key={h}
                    className={`px-5 py-3 text-[10px] font-semibold uppercase tracking-[0.1em] ${i === 4 ? "text-right" : ""}`}
                    style={{ color: C.faint }}
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
                    style={{ borderTop: i === 0 ? undefined : `1px solid ${C.glassLine}` }}
                  >
                    <td
                      className="px-5 py-4 text-[14px] font-semibold tabular-nums"
                      style={{ ...displayF, color: C.ink }}
                    >
                      {f.nr}
                    </td>
                    <td className="px-5 py-4 text-[13px]" style={{ color: C.soft }}>
                      {f.klant}
                    </td>
                    <td className="px-5 py-4 text-[12.5px] tabular-nums" style={{ color: C.faint }}>
                      {f.datum}
                    </td>
                    <td className="px-5 py-4">
                      <span
                        className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold"
                        style={{
                          background: hexToRgba(m.tint, 0.14),
                          color: m.tint,
                          border: `1px solid ${hexToRgba(m.tint, 0.35)}`,
                        }}
                      >
                        <m.Icon size={12} strokeWidth={2.2} aria-hidden="true" /> {m.label}
                      </span>
                    </td>
                    <td
                      className="px-5 py-4 text-right text-[16px] font-semibold tabular-nums"
                      style={{ ...displayF, color: C.ink }}
                    >
                      {f.bedrag}
                    </td>
                  </tr>
                );
              })}
            </tbody>
            <tfoot>
              <tr style={{ borderTop: `1px solid ${C.glassLineHi}` }}>
                <td
                  colSpan={4}
                  className="px-5 py-4 text-[11px] font-semibold uppercase tracking-[0.1em]"
                  style={{ color: C.soft }}
                >
                  Totaal betaald deze maand
                </td>
                <td
                  className="px-5 py-4 text-right text-[18px] font-semibold tabular-nums"
                  style={{ ...displayF, color: C.ink }}
                >
                  {betaald}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </Glass>
    </div>
  );
}
