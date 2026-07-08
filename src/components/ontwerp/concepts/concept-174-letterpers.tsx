"use client";

// Concept 174 — "Letterpers" · diepdruk / deboss-impressie. 2026-trend: tactiele textuur & warmte.
// Dik, warm off-white papier waarin type en elementen FYSIEK geperst lijken (letterpress deboss):
// dubbele inset-schaduwen (licht bovenlangs, donker onderlangs) geven de indruk dat inkt en letter in
// het papier zijn gedrukt; geraised (emboss) elementen komen juist omhoog. Klassieke drukkerij-
// esthetiek, maar strak en modern. Onderscheidt zich van typemachine (nostalgisch lettertype), riso
// (kleur-misregistratie) en courant (krantopmaak): dit gaat puur om de fysieke IMPRESSIE in papier.
// Status nooit kleur-alleen: altijd label + icoon. Deterministisch — geen random/Date. UI-taal NL.
// Fonts: Fraunces (display serif) + Libre Franklin (grotesk tekst) + IBM Plex Mono (data).

import { useEffect, useState } from "react";
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
  Stamp,
  TriangleAlert,
  ChevronRight,
  Zap,
  RefreshCw,
  Inbox,
  TrendingUp,
  TrendingDown,
  BadgeCheck,
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

// ── Palet — dik warm papier + drukkersinkt. Deboss speelt met licht/donker inset-schaduw. ──
const C = {
  paper: "#efe7d6", // dik off-white drukwerkpapier (basis)
  paperDeep: "#e7dcc6", // secundair vlak / geperste holte
  paperRaise: "#f5eee0", // geëmbosseerd (omhoog) vlak
  card: "#f0e8d8", // content-kaart
  ink: "#2a2620", // drukkersinkt (donker warm bruin-zwart)
  inkSoft: "#5c5344", // secundaire tekst
  inkFaint: "#8a7f6b", // labels
  line: "#d8cbb0", // fijne perslijn
  lineDeep: "#c7b898",
  // Warm-donkere en accent-inkten
  crimson: "#8f2d2a", // klassieke rode drukinkt (accent/merk)
  crimsonSoft: "#e7d3c9",
  forest: "#2f5d3f", // groene inkt
  forestSoft: "#d3e0cf",
  ochre: "#9a6b1f", // oker inkt
  ochreSoft: "#ece0c3",
  navy: "#2b3f63", // blauwe inkt
  navySoft: "#d1d8e2",
  // Semantisch (status)
  ok: "#2f5d3f",
  okSoft: "#d3e0cf",
  warn: "#9a6b1f",
  warnSoft: "#ece0c3",
  info: "#2b3f63",
  infoSoft: "#d1d8e2",
  danger: "#8f2d2a",
  dangerSoft: "#e7d3c9",
  white: "#faf5ea",
};

const display = { fontFamily: "var(--font-lab-fraunces)" };
const bodyF = { fontFamily: "var(--font-lab-franklin)" };
const mono = { fontFamily: "var(--font-lab-plex-mono)" };

// ── Deboss / emboss schaduwrecepten — de kern van de tactiele impressie ──────────────
// Deboss: alsof in het papier geperst (donker linksboven, licht rechtsonder binnenin).
const deboss = (d = 1) =>
  `inset ${1.5 * d}px ${1.5 * d}px ${3 * d}px rgba(42,38,32,0.20), inset -${1.5 * d}px -${1.5 * d}px ${3 * d}px rgba(255,250,240,0.75)`;
// Emboss: alsof uit het papier omhoog geperst (licht linksboven, donker rechtsonder buiten).
const emboss = (d = 1) =>
  `${1.5 * d}px ${1.5 * d}px ${4 * d}px rgba(42,38,32,0.16), -${1.5 * d}px -${1.5 * d}px ${3 * d}px rgba(255,250,240,0.7)`;
// Diepe pers-impressie voor grote vlakken.
const pressWell = `inset 2px 3px 6px rgba(42,38,32,0.16), inset -2px -2px 5px rgba(255,250,240,0.6)`;

// Tekst die in het papier geperst lijkt (deboss-typografie).
const inkPress: React.CSSProperties = {
  textShadow: "0 1px 0 rgba(255,250,240,0.55), 0 -1px 1px rgba(42,38,32,0.28)",
};

// ── Status-model — nooit kleur-alleen (icoon + label + tint) ─────────────────────
type StatusStyle = { label: string; Icon: LucideIcon; fg: string; bg: string };
function credMeta(s: CredStatus): StatusStyle {
  switch (s) {
    case "VERIFIED":
      return { label: "Geverifieerd", Icon: BadgeCheck, fg: C.ok, bg: C.okSoft };
    case "SUBMITTED":
      return { label: "In beoordeling", Icon: Clock, fg: C.info, bg: C.infoSoft };
    case "EXPIRING":
      return { label: "Verloopt binnenkort", Icon: TriangleAlert, fg: C.warn, bg: C.warnSoft };
    case "REJECTED":
      return { label: "Afgewezen", Icon: XCircle, fg: C.danger, bg: C.dangerSoft };
  }
}

function StatusTag({ status }: { status: CredStatus }) {
  const m = credMeta(status);
  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-[6px] px-2.5 py-1 text-[11px] font-semibold"
      style={{ ...bodyF, background: m.bg, color: m.fg, boxShadow: deboss(0.7) }}
    >
      <m.Icon size={12} strokeWidth={2.4} aria-hidden="true" />
      {m.label}
    </span>
  );
}

// Geëmbosseerde content-kaart (komt licht omhoog uit het papier).
function Card({
  children,
  className = "",
  style,
  interactive = false,
}: {
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
  interactive?: boolean;
}) {
  return (
    <div
      className={`rounded-[14px] ${interactive ? "transition-[transform,box-shadow] duration-200 hover:-translate-y-[2px]" : ""} ${className}`}
      style={{
        background: C.card,
        boxShadow: emboss(1),
        border: `1px solid ${C.line}`,
        ...style,
      }}
    >
      {children}
    </div>
  );
}

// Geperste holte (deboss-well) — voor invoervelden, tabellen, ingebedde vlakken.
function Well({
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
      className={`rounded-[12px] ${className}`}
      style={{ background: C.paperDeep, boxShadow: pressWell, ...style }}
    >
      {children}
    </div>
  );
}

// Drukmerk — een geperst zegel-icoon (emboss), het merk-accent van dit concept.
function PressMark({ size = 40, Icon = Stamp }: { size?: number; Icon?: LucideIcon }) {
  return (
    <span
      className="relative flex shrink-0 items-center justify-center rounded-[10px]"
      style={{ width: size, height: size, background: C.paperRaise, boxShadow: emboss(1) }}
      aria-hidden="true"
    >
      <Icon size={size * 0.5} strokeWidth={1.7} style={{ color: C.crimson }} />
    </span>
  );
}

// Sectiekop met geperst drukmerk en een dunne pers-scheidingslijn.
function SectionHead({
  title,
  sub,
  Icon = Stamp,
}: {
  title: string;
  sub?: string;
  Icon?: LucideIcon;
}) {
  return (
    <div className="flex items-center gap-3">
      <PressMark size={38} Icon={Icon} />
      <div className="min-w-0">
        <h2
          className="text-[20px] font-semibold leading-none tracking-[-0.01em]"
          style={{ ...display, color: C.ink, ...inkPress }}
        >
          {title}
        </h2>
        {sub && (
          <p className="mt-1.5 text-[12px]" style={{ ...bodyF, color: C.inkFaint }}>
            {sub}
          </p>
        )}
      </div>
      <span
        className="ml-2 hidden h-[3px] flex-1 rounded-full sm:block"
        style={{ background: C.line, boxShadow: deboss(0.6) }}
        aria-hidden="true"
      />
    </div>
  );
}

function Meta({ Icon, value }: { Icon: LucideIcon; value: string }) {
  return (
    <div className="flex items-center gap-1.5" style={{ color: C.inkSoft }}>
      <Icon size={13} strokeWidth={1.9} style={{ color: C.ochre }} aria-hidden="true" />
      <span className="truncate" style={bodyF}>
        {value}
      </span>
    </div>
  );
}

// Match-cijfer als geperste zegelschijf (deboss ring met omhoog geperst cijfer).
function MatchSeal({ value, size = 56 }: { value: number; size?: number }) {
  const deg = (value / 100) * 360;
  return (
    <span
      className="relative flex shrink-0 items-center justify-center rounded-full"
      style={{
        width: size,
        height: size,
        background: `conic-gradient(${C.crimson} 0deg ${deg}deg, ${C.lineDeep} ${deg}deg 360deg)`,
        boxShadow: emboss(0.9),
      }}
      aria-hidden="true"
    >
      <span
        className="absolute inset-[4px] flex flex-col items-center justify-center rounded-full"
        style={{ background: C.paperRaise, boxShadow: deboss(0.8) }}
      >
        <span
          className="text-[15px] font-semibold tabular-nums leading-none"
          style={{ ...display, color: C.ink, ...inkPress }}
        >
          {value}
        </span>
        <span
          className="text-[7px] font-semibold uppercase tracking-[0.14em]"
          style={{ ...mono, color: C.inkFaint }}
        >
          match
        </span>
      </span>
    </span>
  );
}

// Mini staaf-spark — geperste staafjes in een well.
function Spark({ data }: { data: number[] }) {
  const max = Math.max(...data);
  return (
    <div className="flex h-8 items-end gap-[3px]" aria-hidden="true">
      {data.map((v, i) => (
        <span
          key={i}
          className="flex-1 rounded-t-[2px]"
          style={{
            height: `${Math.max(14, (v / max) * 100)}%`,
            background: i === data.length - 1 ? C.crimson : C.lineDeep,
            boxShadow: i === data.length - 1 ? emboss(0.4) : "none",
          }}
        />
      ))}
    </div>
  );
}

// Geperste primaire knop (deboss-in bij druk voelt tactiel).
function PressButton({
  children,
  onClick,
  tone = "ink",
  className = "",
  ariaLabel,
}: {
  children: React.ReactNode;
  onClick?: () => void;
  tone?: "ink" | "crimson" | "paper";
  className?: string;
  ariaLabel?: string;
}) {
  const bg = tone === "ink" ? C.ink : tone === "crimson" ? C.crimson : C.paperRaise;
  const fg = tone === "paper" ? C.ink : C.white;
  return (
    <button
      onClick={onClick}
      aria-label={ariaLabel}
      className={`inline-flex items-center justify-center gap-2 rounded-[10px] px-5 py-2.5 text-[13px] font-semibold transition-[transform,box-shadow] duration-150 hover:-translate-y-[1px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 active:translate-y-[1px] ${className}`}
      style={{
        ...bodyF,
        background: bg,
        color: fg,
        boxShadow: emboss(0.9),
        border: tone === "paper" ? `1px solid ${C.line}` : "none",
        ["--tw-ring-color" as string]: C.crimson,
        ["--tw-ring-offset-color" as string]: C.paper,
      }}
    >
      {children}
    </button>
  );
}

// ── Root ─────────────────────────────────────────────────────────────────────────
export function Concept174() {
  const [screen, setScreen] = useState<ScreenKey>("dashboard");
  const [loading, setLoading] = useState(true);
  const active = OPDRACHTEN[0] as Opdracht;

  // Deterministische "pers"-laadtijd bij binnenkomst (geen random/Date).
  useEffect(() => {
    const t = setTimeout(() => setLoading(false), 720);
    return () => clearTimeout(t);
  }, []);

  const reload = () => {
    setLoading(true);
    const t = setTimeout(() => setLoading(false), 720);
    return () => clearTimeout(t);
  };

  return (
    <div
      className="min-h-screen w-full overflow-x-hidden antialiased"
      style={{
        ...bodyF,
        color: C.ink,
        background: C.paper,
        backgroundImage:
          "radial-gradient(rgba(42,38,32,0.035) 1px, transparent 1px), radial-gradient(rgba(255,250,240,0.5) 1px, transparent 1px)",
        backgroundSize: "5px 5px, 5px 5px",
        backgroundPosition: "0 0, 2.5px 2.5px",
      }}
    >
      {/* Kop — geperste drukkerstitel */}
      <header
        className="relative"
        style={{
          background: C.paperDeep,
          borderBottom: `1px solid ${C.line}`,
          boxShadow: pressWell,
        }}
      >
        <div className="relative mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-4 py-5 md:px-8">
          <div className="flex items-center gap-3.5">
            <PressMark size={46} Icon={Stamp} />
            <div className="leading-tight">
              <div
                className="text-[10px] font-semibold uppercase tracking-[0.32em]"
                style={{ ...mono, color: C.crimson }}
              >
                Letterpers
              </div>
              <div
                className="text-[24px] font-semibold leading-none tracking-[-0.01em]"
                style={{ ...display, color: C.ink, ...inkPress }}
              >
                Drukwerk
              </div>
              <div
                className="mt-1 text-[10px] uppercase tracking-[0.18em]"
                style={{ ...mono, color: C.inkFaint }}
              >
                Match · Verificatie · Omzet
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2.5">
            <span
              className="hidden items-center gap-1.5 rounded-[8px] px-3 py-1.5 text-[11px] font-semibold sm:inline-flex"
              style={{ ...bodyF, background: C.okSoft, color: C.ok, boxShadow: deboss(0.7) }}
            >
              <ShieldCheck size={12} strokeWidth={2} aria-hidden="true" /> {PROFIEL.trust}
            </span>
            <span
              className="relative flex h-11 w-11 items-center justify-center rounded-[10px] text-[12px] font-semibold"
              style={{ ...display, background: C.paperRaise, color: C.ink, boxShadow: emboss(0.9) }}
              aria-hidden="true"
            >
              {PROFIEL.initialen}
            </span>
          </div>
        </div>

        {/* Scherm-switcher — geperste pers-tabs */}
        <nav
          className="relative mx-auto flex max-w-6xl items-center gap-1.5 overflow-x-auto px-4 pb-4 md:px-8"
          aria-label="Schermen"
        >
          {SCREENS.map((s) => {
            const on = s.key === screen;
            return (
              <button
                key={s.key}
                onClick={() => setScreen(s.key)}
                aria-current={on ? "page" : undefined}
                className="shrink-0 rounded-[9px] px-3.5 py-1.5 text-[12.5px] font-semibold transition-[transform,box-shadow] duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
                style={{
                  ...bodyF,
                  background: on ? C.crimson : C.paperRaise,
                  color: on ? C.white : C.inkSoft,
                  boxShadow: on ? deboss(0.9) : emboss(0.6),
                  ["--tw-ring-color" as string]: C.crimson,
                  ["--tw-ring-offset-color" as string]: C.paperDeep,
                }}
              >
                {s.label}
              </button>
            );
          })}
        </nav>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-6 md:px-8 md:py-8">
        {screen === "dashboard" && (
          <Dashboard
            loading={loading}
            onReload={reload}
            onOpen={() => setScreen("opdracht")}
            onActies={() => setScreen("acties")}
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

// ── Skeleton (laadstaat) — geperste, lege placeholders ───────────────────────────
function SkeletonBlock({ className = "" }: { className?: string }) {
  return (
    <div
      className={`animate-pulse rounded-[10px] ${className}`}
      style={{ background: C.paperDeep, boxShadow: pressWell }}
      aria-hidden="true"
    />
  );
}

function DashboardSkeleton() {
  return (
    <div className="space-y-8" role="status" aria-label="Dashboard wordt geladen">
      <span className="sr-only">Bezig met laden…</span>
      <SkeletonBlock className="h-44 w-full" />
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {[0, 1, 2, 3].map((i) => (
          <SkeletonBlock key={i} className="h-28" />
        ))}
      </div>
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-[1.6fr_1fr]">
        <div className="space-y-3">
          {[0, 1, 2].map((i) => (
            <SkeletonBlock key={i} className="h-20" />
          ))}
        </div>
        <div className="space-y-4">
          <SkeletonBlock className="h-32" />
          <SkeletonBlock className="h-40" />
        </div>
      </div>
    </div>
  );
}

// ── Dashboard ──────────────────────────────────────────────────────────────────
function Dashboard({
  loading,
  onReload,
  onOpen,
  onActies,
}: {
  loading: boolean;
  onReload: () => void;
  onOpen: () => void;
  onActies: () => void;
}) {
  const verified = CREDENTIALS.filter((c) => c.status === "VERIFIED").length;
  const dek = Math.round((verified / CREDENTIALS.length) * 100);
  const warn = (ACTIES.find((a) => a.urgentie === "warning") ??
    ACTIES[0]) as (typeof ACTIES)[number];

  if (loading) return <DashboardSkeleton />;

  return (
    <div className="space-y-8">
      {/* Hero — geperste drukvorm */}
      <Card className="relative overflow-hidden">
        <div
          className="pointer-events-none absolute -right-10 -top-10 hidden h-48 w-48 rounded-full md:block"
          style={{ background: C.paperDeep, boxShadow: pressWell }}
          aria-hidden="true"
        />
        <div className="relative max-w-xl p-6 sm:p-8">
          <span
            className="inline-flex items-center gap-1.5 rounded-[7px] px-2.5 py-1 text-[11px] font-semibold"
            style={{
              ...bodyF,
              background: C.crimsonSoft,
              color: C.crimson,
              boxShadow: deboss(0.7),
            }}
          >
            <Stamp size={12} strokeWidth={2} aria-hidden="true" /> {PROFIEL.rol}
          </span>
          <h1
            className="mt-3 text-[30px] font-semibold leading-[1.06] tracking-[-0.02em] sm:text-[40px]"
            style={{ ...display, color: C.ink, ...inkPress }}
          >
            Drie matches boven 85%. Je omzet staat scherp in de pers.
          </h1>
          <p
            className="mt-3 max-w-lg text-[14px] leading-relaxed"
            style={{ ...bodyF, color: C.inkSoft }}
          >
            Eén ding vraagt aandacht: je VOG verloopt binnenkort. Regel het en houd je profiel
            geverifieerd — helder afgedrukt voor elke opdrachtgever.
          </p>
          <div className="mt-5 flex flex-wrap items-center gap-3">
            <PressButton onClick={onOpen} tone="crimson">
              Bekijk matches <ArrowRight size={15} aria-hidden="true" />
            </PressButton>
            <PressButton onClick={onActies} tone="paper">
              <TriangleAlert
                size={14}
                strokeWidth={2.2}
                style={{ color: C.warn }}
                aria-hidden="true"
              />
              Los actie op
            </PressButton>
            <button
              onClick={onReload}
              aria-label="Dashboard opnieuw laden"
              className="inline-flex h-10 w-10 items-center justify-center rounded-[10px] transition-transform hover:-translate-y-[1px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 active:translate-y-[1px]"
              style={{
                background: C.paperRaise,
                boxShadow: emboss(0.8),
                ["--tw-ring-color" as string]: C.crimson,
                ["--tw-ring-offset-color" as string]: C.paper,
              }}
            >
              <RefreshCw
                size={16}
                strokeWidth={2}
                style={{ color: C.inkSoft }}
                aria-hidden="true"
              />
            </button>
          </div>
        </div>
      </Card>

      {/* KPI-kaarten */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {KPIS.map((k) => (
          <Card key={k.label} interactive className="p-4">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-medium" style={{ ...bodyF, color: C.inkFaint }}>
                {k.label}
              </span>
              <span
                className="inline-flex items-center gap-0.5 rounded-[6px] px-1.5 py-0.5 text-[10px] font-semibold"
                style={{
                  ...mono,
                  background: k.up ? C.okSoft : C.warnSoft,
                  color: k.up ? C.ok : C.warn,
                  boxShadow: deboss(0.6),
                }}
              >
                {k.up ? (
                  <TrendingUp size={10} strokeWidth={2.4} aria-hidden="true" />
                ) : (
                  <TrendingDown size={10} strokeWidth={2.4} aria-hidden="true" />
                )}
                {k.trend}
              </span>
            </div>
            <div
              className="mt-2 text-[26px] font-semibold leading-none tracking-[-0.01em]"
              style={{ ...display, color: C.ink, ...inkPress }}
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
        {/* Matches */}
        <section className="space-y-4">
          <SectionHead
            title="Aanbevolen matches"
            sub="Op match-percentage gerangschikt"
            Icon={Zap}
          />
          <div className="space-y-3">
            {OPDRACHTEN.map((o) => (
              <Card key={o.id} interactive className="overflow-hidden">
                <button
                  onClick={onOpen}
                  className="flex w-full items-center gap-4 p-4 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset"
                  style={{ ["--tw-ring-color" as string]: C.crimson }}
                >
                  <MatchSeal value={o.match} />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <div
                          className="truncate text-[15.5px] font-semibold tracking-[-0.01em]"
                          style={{ ...display, color: C.ink, ...inkPress }}
                        >
                          {o.titel}
                        </div>
                        <div
                          className="mt-0.5 truncate text-[12.5px]"
                          style={{ ...bodyF, color: C.inkSoft }}
                        >
                          {o.opdrachtgever} · {o.plaats} · {o.tarief}
                        </div>
                      </div>
                      <ChevronRight
                        size={18}
                        className="mt-0.5 shrink-0"
                        style={{ color: C.inkFaint }}
                        aria-hidden="true"
                      />
                    </div>
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {o.redenen.plus.slice(0, 2).map((r) => (
                        <span
                          key={r}
                          className="inline-flex items-center gap-1 rounded-[6px] px-2 py-0.5 text-[11px] font-medium"
                          style={{
                            ...bodyF,
                            background: C.paperDeep,
                            color: C.inkSoft,
                            boxShadow: deboss(0.55),
                          }}
                        >
                          <Check
                            size={11}
                            strokeWidth={2.6}
                            style={{ color: C.ok }}
                            aria-hidden="true"
                          />
                          {r}
                        </span>
                      ))}
                    </div>
                  </div>
                </button>
              </Card>
            ))}
          </div>
        </section>

        {/* Rechterkolom */}
        <section className="space-y-4">
          <SectionHead title="Vertrouwen" sub="Certificaat-dekking" Icon={ShieldCheck} />
          <Card className="p-5">
            <div className="flex items-center gap-5">
              <span
                className="relative flex h-24 w-24 shrink-0 items-center justify-center rounded-full"
                style={{
                  background: `conic-gradient(${C.forest} 0deg ${dek * 3.6}deg, ${C.lineDeep} ${dek * 3.6}deg 360deg)`,
                  boxShadow: emboss(0.9),
                }}
                aria-hidden="true"
              >
                <span
                  className="absolute inset-[8px] flex flex-col items-center justify-center rounded-full"
                  style={{ background: C.paperRaise, boxShadow: deboss(0.8) }}
                >
                  <span
                    className="text-[26px] font-semibold leading-none"
                    style={{ ...display, color: C.ink, ...inkPress }}
                  >
                    {dek}
                    <span className="text-[13px]" style={{ color: C.inkFaint }}>
                      %
                    </span>
                  </span>
                </span>
              </span>
              <div>
                <StatusTag status="VERIFIED" />
                <p className="mt-2 text-[12.5px]" style={{ ...bodyF, color: C.inkSoft }}>
                  {verified}/{CREDENTIALS.length} certificaten geverifieerd. Opdrachtgevers zien
                  alleen geverifieerde documenten.
                </p>
              </div>
            </div>
          </Card>

          {/* Prioriteit — geperst rood zegel-kaartje */}
          <div
            className="relative overflow-hidden rounded-[14px] p-5"
            style={{ background: C.ink, boxShadow: emboss(1) }}
          >
            <span
              className="inline-flex items-center gap-1.5 rounded-[6px] px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.1em]"
              style={{ ...mono, background: C.warnSoft, color: C.warn }}
            >
              <TriangleAlert size={11} strokeWidth={2.4} aria-hidden="true" /> Prioriteit
            </span>
            <h3
              className="mt-2.5 text-[17px] font-semibold leading-tight tracking-[-0.01em]"
              style={{ ...display, color: C.white }}
            >
              {warn.titel}
            </h3>
            <p
              className="mt-1.5 text-[12.5px] leading-relaxed"
              style={{ ...bodyF, color: "rgba(250,245,234,0.72)" }}
            >
              {warn.detail}
            </p>
            <button
              onClick={onActies}
              className="mt-4 inline-flex items-center gap-2 rounded-[9px] px-4 py-2 text-[12px] font-semibold transition-transform hover:-translate-y-[1px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 active:translate-y-[1px]"
              style={{
                ...bodyF,
                background: C.crimson,
                color: C.white,
                boxShadow: emboss(0.7),
                ["--tw-ring-color" as string]: C.crimson,
                ["--tw-ring-offset-color" as string]: C.ink,
              }}
            >
              {warn.cta} <ArrowRight size={13} aria-hidden="true" />
            </button>
          </div>
        </section>
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
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <SectionHead title="Marktplaats" sub="Open opdrachten" Icon={Search} />
        <Well className="flex items-center gap-2 px-3.5 py-2">
          <Search size={15} style={{ color: C.ochre }} aria-hidden="true" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Zoek opdracht of plaats…"
            aria-label="Opdrachten zoeken"
            className="w-44 bg-transparent text-[12.5px] outline-none placeholder:opacity-50"
            style={{ ...bodyF, color: C.ink }}
          />
        </Well>
      </div>

      {filtered.length === 0 ? (
        <Card className="flex flex-col items-center justify-center gap-3 p-16 text-center">
          <PressMark size={64} Icon={Inbox} />
          <p
            className="text-[19px] font-semibold"
            style={{ ...display, color: C.ink, ...inkPress }}
          >
            Geen afdruk gevonden
          </p>
          <p className="max-w-xs text-[13px]" style={{ ...bodyF, color: C.inkSoft }}>
            Niets gevonden voor &ldquo;{q}&rdquo;. Pas je zoekterm aan en probeer opnieuw.
          </p>
          <PressButton onClick={() => setQ("")} tone="ink" className="mt-1">
            Zoekterm wissen
          </PressButton>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
          {filtered.map((o) => (
            <Card key={o.id} interactive className="flex flex-col overflow-hidden">
              <div className="flex items-center gap-3 p-4">
                <MatchSeal value={o.match} size={48} />
                <div className="min-w-0">
                  <h3
                    className="text-[15px] font-semibold leading-tight tracking-[-0.01em]"
                    style={{ ...display, color: C.ink, ...inkPress }}
                  >
                    {o.titel}
                  </h3>
                  <p className="mt-0.5 text-[12px]" style={{ ...bodyF, color: C.inkSoft }}>
                    {o.opdrachtgever}
                  </p>
                </div>
              </div>
              <div className="px-4 pb-4">
                <Well className="grid grid-cols-2 gap-y-2 p-3 text-[12px]">
                  <Meta Icon={MapPin} value={o.plaats} />
                  <Meta Icon={Coins} value={o.tarief} />
                  <Meta Icon={Clock} value={o.uren} />
                  <Meta Icon={CalendarDays} value={o.start} />
                </Well>
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {o.tags.map((t) => (
                    <span
                      key={t}
                      className="rounded-[6px] px-2 py-0.5 text-[10.5px] font-medium"
                      style={{
                        ...bodyF,
                        background: C.paperDeep,
                        color: C.inkSoft,
                        boxShadow: deboss(0.55),
                      }}
                    >
                      {t}
                    </span>
                  ))}
                </div>
              </div>
              <button
                onClick={onOpen}
                className="mt-auto flex items-center justify-center gap-2 py-3 text-[12.5px] font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset"
                style={{
                  ...bodyF,
                  borderTop: `1px solid ${C.line}`,
                  color: C.crimson,
                  ["--tw-ring-color" as string]: C.crimson,
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
      <PressButton onClick={onBack} tone="paper" className="!px-3.5 !py-1.5 !text-[12px]">
        <ArrowLeft size={14} aria-hidden="true" /> Terug naar marktplaats
      </PressButton>

      <Card className="relative overflow-hidden">
        <div className="relative flex flex-wrap items-center justify-between gap-5 p-6 sm:p-8">
          <div className="min-w-0">
            <span
              className="inline-block rounded-[6px] px-2.5 py-1 text-[11px] font-semibold"
              style={{ ...mono, background: C.paperDeep, color: C.crimson, boxShadow: deboss(0.6) }}
            >
              {opdracht.id}
            </span>
            <h1
              className="mt-3 max-w-2xl text-[26px] font-semibold leading-[1.08] tracking-[-0.02em] sm:text-[34px]"
              style={{ ...display, color: C.ink, ...inkPress }}
            >
              {opdracht.titel}
            </h1>
            <p className="mt-2 text-[13.5px]" style={{ ...bodyF, color: C.inkSoft }}>
              {opdracht.opdrachtgever} · {opdracht.plaats}
            </p>
          </div>
          <MatchSeal value={opdracht.match} size={82} />
        </div>
      </Card>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {feiten.map((f) => (
          <Card key={f.l} interactive className="p-4">
            <PressMark size={30} Icon={f.Icon} />
            <div
              className="mt-3 text-[16px] font-semibold leading-none"
              style={{ ...display, color: C.ink, ...inkPress }}
            >
              {f.v}
            </div>
            <div
              className="mt-1 text-[10.5px] font-medium uppercase tracking-[0.1em]"
              style={{ ...mono, color: C.inkFaint }}
            >
              {f.l}
            </div>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
        <section className="space-y-3">
          <SectionHead title="Waarom dit past" Icon={Check} />
          <Card className="p-5">
            <ul className="space-y-3">
              {opdracht.redenen.plus.map((r) => (
                <li
                  key={r}
                  className="flex items-start gap-2.5 text-[13.5px] leading-snug"
                  style={{ ...bodyF, color: C.ink }}
                >
                  <span
                    className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-[6px]"
                    style={{ background: C.okSoft, boxShadow: deboss(0.6) }}
                    aria-hidden="true"
                  >
                    <Check size={12} strokeWidth={2.6} style={{ color: C.ok }} />
                  </span>
                  {r}
                </li>
              ))}
            </ul>
          </Card>
        </section>
        <section className="space-y-3">
          <SectionHead title="Om te overwegen" Icon={TriangleAlert} />
          <Card className="p-5">
            <ul className="space-y-3">
              {opdracht.redenen.min.map((r) => (
                <li
                  key={r}
                  className="flex items-start gap-2.5 text-[13.5px] leading-snug"
                  style={{ ...bodyF, color: C.ink }}
                >
                  <span
                    className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-[6px]"
                    style={{ background: C.warnSoft, boxShadow: deboss(0.6) }}
                    aria-hidden="true"
                  >
                    <TriangleAlert size={11} strokeWidth={2.4} style={{ color: C.warn }} />
                  </span>
                  {r}
                </li>
              ))}
            </ul>
          </Card>
        </section>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row">
        <PressButton onClick={onBack} tone="crimson" className="flex-1 !py-3.5">
          Reageer op deze opdracht <ArrowRight size={16} aria-hidden="true" />
        </PressButton>
        <PressButton tone="paper" className="!py-3.5">
          <Star size={15} strokeWidth={2} style={{ color: C.ochre }} aria-hidden="true" /> Bewaar
        </PressButton>
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
        <SectionHead title="Verificatie" sub="Certificaten en documenten" Icon={ShieldCheck} />
        <PressButton tone="ink" className="!px-4 !py-2 !text-[12px]">
          <Plus size={14} aria-hidden="true" /> Toevoegen
        </PressButton>
      </div>

      <Card className="relative overflow-hidden">
        <div className="relative flex flex-wrap items-center gap-6 p-6">
          <span
            className="relative flex h-28 w-28 shrink-0 items-center justify-center rounded-full"
            style={{
              background: `conic-gradient(${C.crimson} 0deg ${dek * 1.2}deg, ${C.forest} ${dek * 1.2}deg ${dek * 2.4}deg, ${C.navy} ${dek * 2.4}deg ${dek * 3.6}deg, ${C.lineDeep} ${dek * 3.6}deg 360deg)`,
              boxShadow: emboss(1),
            }}
            aria-hidden="true"
          >
            <span
              className="absolute inset-[9px] flex flex-col items-center justify-center rounded-full"
              style={{ background: C.paperRaise, boxShadow: deboss(0.9) }}
            >
              <span
                className="text-[30px] font-semibold leading-none"
                style={{ ...display, color: C.ink, ...inkPress }}
              >
                {dek}
                <span className="text-[15px]" style={{ color: C.inkFaint }}>
                  %
                </span>
              </span>
            </span>
          </span>
          <div className="max-w-sm">
            <div
              className="text-[16px] font-semibold"
              style={{ ...display, color: C.ink, ...inkPress }}
            >
              {verified}/{CREDENTIALS.length} geverifieerd
            </div>
            <p className="mt-1 text-[13px] leading-relaxed" style={{ ...bodyF, color: C.inkSoft }}>
              Elk geverifieerd document is als een geperst zegel — het maakt je profiel aantoonbaar
              betrouwbaar. Houd je dekking zo hoog mogelijk.
            </p>
            <span
              className="mt-3 inline-flex items-center gap-1.5 rounded-[7px] px-3 py-1 text-[11px] font-semibold"
              style={{ ...bodyF, background: C.okSoft, color: C.ok, boxShadow: deboss(0.7) }}
            >
              <ShieldCheck size={12} strokeWidth={2} aria-hidden="true" /> {PROFIEL.trust}
            </span>
          </div>
        </div>
      </Card>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {CREDENTIALS.map((c) => {
          const m = credMeta(c.status);
          const actionable = c.status !== "VERIFIED";
          return (
            <Card key={c.naam} interactive className="flex items-center gap-3.5 p-4">
              <span
                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[10px]"
                style={{ background: m.bg, boxShadow: deboss(0.8) }}
                aria-hidden="true"
              >
                <m.Icon size={20} strokeWidth={2.2} style={{ color: m.fg }} />
              </span>
              <div className="min-w-0 flex-1">
                <div
                  className="truncate text-[14.5px] font-semibold tracking-[-0.01em]"
                  style={{ ...display, color: C.ink, ...inkPress }}
                >
                  {c.naam}
                </div>
                <div className="mt-0.5 text-[12px]" style={{ ...bodyF, color: C.inkSoft }}>
                  {c.detail}
                </div>
                <div className="mt-2 flex flex-wrap items-center gap-2">
                  <StatusTag status={c.status} />
                  {actionable && (
                    <button
                      className="rounded-[7px] px-2.5 py-1 text-[11px] font-semibold transition-transform hover:-translate-y-[1px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-1"
                      style={{
                        ...bodyF,
                        background: C.paperRaise,
                        color: C.ink,
                        boxShadow: emboss(0.6),
                        ["--tw-ring-color" as string]: C.crimson,
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
            </Card>
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
    <div className="space-y-6">
      <SectionHead
        title="Volgende beste acties"
        sub="Op urgentie gerangschikt — pak de bovenste eerst"
        Icon={Zap}
      />

      <ol className="space-y-4">
        {sorted.map((a, i) => {
          const warn = a.urgentie === "warning";
          return (
            <li key={a.titel}>
              <Card interactive className="flex items-stretch overflow-hidden">
                <span
                  className="w-1.5 shrink-0"
                  style={{ background: warn ? C.warn : C.navy }}
                  aria-hidden="true"
                />
                <div className="flex min-w-0 flex-1 items-center gap-4 p-5">
                  <span
                    className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[10px] text-[16px] font-semibold tabular-nums"
                    style={{
                      ...display,
                      background: warn ? C.warnSoft : C.paperDeep,
                      color: warn ? C.warn : C.ink,
                      boxShadow: deboss(0.8),
                    }}
                    aria-hidden="true"
                  >
                    {warn ? <TriangleAlert size={19} strokeWidth={2.2} /> : i + 1}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span
                        className="inline-flex items-center gap-1 rounded-[6px] px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.08em]"
                        style={{
                          ...mono,
                          background: warn ? C.warnSoft : C.infoSoft,
                          color: warn ? C.warn : C.info,
                          boxShadow: deboss(0.55),
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
                        className="text-[15.5px] font-semibold tracking-[-0.01em]"
                        style={{ ...display, color: C.ink, ...inkPress }}
                      >
                        {a.titel}
                      </h3>
                    </div>
                    <p
                      className="mt-1.5 text-[13px] leading-relaxed"
                      style={{ ...bodyF, color: C.inkSoft }}
                    >
                      {a.detail}
                    </p>
                    <button
                      className="mt-3 inline-flex items-center gap-2 rounded-[9px] px-4 py-2 text-[12px] font-semibold transition-transform hover:-translate-y-[1px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 active:translate-y-[1px]"
                      style={{
                        ...bodyF,
                        background: warn ? C.warn : C.ink,
                        color: C.white,
                        boxShadow: emboss(0.7),
                        ["--tw-ring-color" as string]: warn ? C.warn : C.crimson,
                        ["--tw-ring-offset-color" as string]: C.paper,
                      }}
                    >
                      {a.cta} <ArrowRight size={13} aria-hidden="true" />
                    </button>
                  </div>
                </div>
              </Card>
            </li>
          );
        })}
      </ol>

      {/* Berichten-strook — verrijking */}
      <section className="space-y-3">
        <SectionHead title="Berichten" sub="Recente gesprekken" Icon={FileText} />
        <Card className="overflow-hidden">
          {BERICHTEN.map((b, i) => (
            <div
              key={b.van}
              className="flex items-center gap-3 p-4"
              style={i === 0 ? undefined : { borderTop: `1px solid ${C.line}` }}
            >
              <span
                className="relative flex h-9 w-9 shrink-0 items-center justify-center rounded-[9px] text-[11px] font-semibold"
                style={{
                  ...display,
                  background: C.paperRaise,
                  color: C.ink,
                  boxShadow: emboss(0.7),
                }}
                aria-hidden="true"
              >
                {b.initialen}
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span
                    className="truncate text-[13px] font-semibold"
                    style={{ ...display, color: C.ink }}
                  >
                    {b.van}
                  </span>
                  {b.ongelezen && (
                    <span
                      className="h-1.5 w-1.5 rounded-full"
                      style={{ background: C.crimson }}
                      aria-label="Ongelezen"
                    />
                  )}
                </div>
                <p className="mt-0.5 truncate text-[12px]" style={{ ...bodyF, color: C.inkSoft }}>
                  {b.preview}
                </p>
              </div>
              <span
                className="shrink-0 text-[11px] tabular-nums"
                style={{ ...mono, color: C.inkFaint }}
              >
                {b.tijd}
              </span>
            </div>
          ))}
        </Card>
      </section>
    </div>
  );
}

// ── Facturen ─────────────────────────────────────────────────────────────────────
function Facturen() {
  const [dismissed, setDismissed] = useState(false);
  const factMeta = (
    status: string,
  ): { label: string; Icon: LucideIcon; fg: string; bg: string } => {
    if (status === "Betaald") return { label: "Betaald", Icon: Check, fg: C.ok, bg: C.okSoft };
    if (status === "Openstaand")
      return { label: "Openstaand", Icon: Clock, fg: C.warn, bg: C.warnSoft };
    return { label: "Concept", Icon: FileText, fg: C.info, bg: C.infoSoft };
  };
  const betaald = "€ 8.622";
  const open = FACTUREN.filter((f) => f.status === "Openstaand").length;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <SectionHead title="Facturen" sub="Omzet en openstaand" Icon={Coins} />
        <PressButton tone="ink" className="!px-4 !py-2 !text-[12px]">
          <Plus size={14} aria-hidden="true" /> Nieuwe factuur
        </PressButton>
      </div>

      {/* Foutstrook — synchronisatie mislukt, met opnieuw-proberen */}
      {!dismissed && (
        <div
          className="flex flex-wrap items-center gap-3 rounded-[12px] p-3.5"
          style={{
            background: C.dangerSoft,
            boxShadow: deboss(0.9),
            border: `1px solid ${C.lineDeep}`,
          }}
          role="alert"
        >
          <span
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-[8px]"
            style={{ background: C.white, boxShadow: emboss(0.5) }}
            aria-hidden="true"
          >
            <XCircle size={17} strokeWidth={2.2} style={{ color: C.danger }} />
          </span>
          <div className="min-w-0 flex-1">
            <div className="text-[13px] font-semibold" style={{ ...bodyF, color: C.danger }}>
              Synchronisatie met de boekhouding mislukt
            </div>
            <div className="text-[12px]" style={{ ...bodyF, color: C.inkSoft }}>
              De laatste factuurstatus kon niet worden opgehaald. Probeer het opnieuw.
            </div>
          </div>
          <button
            onClick={() => setDismissed(true)}
            className="inline-flex items-center gap-1.5 rounded-[8px] px-3 py-1.5 text-[12px] font-semibold transition-transform hover:-translate-y-[1px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
            style={{
              ...bodyF,
              background: C.danger,
              color: C.white,
              boxShadow: emboss(0.6),
              ["--tw-ring-color" as string]: C.danger,
              ["--tw-ring-offset-color" as string]: C.paper,
            }}
          >
            <RefreshCw size={13} strokeWidth={2.2} aria-hidden="true" /> Opnieuw proberen
          </button>
        </div>
      )}

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
        {[
          { l: "Betaald (mnd)", v: betaald },
          { l: "Openstaand", v: `${open}` },
          { l: "Te factureren", v: "€ 1.350" },
        ].map((s) => (
          <Card key={s.l} interactive className="p-4">
            <div
              className="h-[3px] w-10 rounded-full"
              style={{ background: C.crimson }}
              aria-hidden="true"
            />
            <div className="mt-3 text-[11px] font-medium" style={{ ...bodyF, color: C.inkFaint }}>
              {s.l}
            </div>
            <div
              className="mt-1 text-[26px] font-semibold leading-none tracking-[-0.01em]"
              style={{ ...display, color: C.ink, ...inkPress }}
            >
              {s.v}
            </div>
          </Card>
        ))}
      </div>

      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[520px] text-left">
            <thead>
              <tr style={{ background: C.paperDeep }}>
                {["Nummer", "Klant", "Datum", "Status", "Bedrag"].map((h, i) => (
                  <th
                    key={h}
                    className={`px-4 py-2.5 text-[10.5px] font-semibold uppercase tracking-[0.08em] ${i === 4 ? "text-right" : ""}`}
                    style={{ ...mono, color: C.inkFaint }}
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
                    className="transition-colors"
                    style={i === 0 ? undefined : { borderTop: `1px solid ${C.line}` }}
                  >
                    <td
                      className="px-4 py-3 text-[13px] font-semibold tabular-nums"
                      style={{ ...mono, color: C.ink }}
                    >
                      {f.nr}
                    </td>
                    <td className="px-4 py-3 text-[13px]" style={{ ...bodyF, color: C.inkSoft }}>
                      {f.klant}
                    </td>
                    <td
                      className="px-4 py-3 text-[12px] tabular-nums"
                      style={{ ...mono, color: C.inkFaint }}
                    >
                      {f.datum}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className="inline-flex items-center gap-1.5 rounded-[6px] px-2.5 py-1 text-[11px] font-semibold"
                        style={{ ...bodyF, background: m.bg, color: m.fg, boxShadow: deboss(0.6) }}
                      >
                        <m.Icon size={11} strokeWidth={2.4} aria-hidden="true" /> {m.label}
                      </span>
                    </td>
                    <td
                      className="px-4 py-3 text-right text-[15px] font-semibold tabular-nums"
                      style={{ ...display, color: C.ink }}
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
                  style={{ ...mono, color: "rgba(250,245,234,0.6)" }}
                >
                  Totaal betaald
                </td>
                <td
                  className="px-4 py-3 text-right text-[17px] font-semibold tabular-nums"
                  style={{ ...display, color: C.white }}
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
