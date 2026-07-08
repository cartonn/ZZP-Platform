"use client";

// Concept 183 — "Halftoon" · CMYK-halftoon drukwerk. Grote halftoon-puntenrasters (dot-gradient) als
// beeldvlakken/verlopen, offset-registratie-kruisjes in de hoeken, spot-kleur overdruk. Onderscheidt zich
// van riso (platte duotoon-vlekken) en ponskaart: dit is de FIJNE HALFTOON-PUNT als grafisch systeem
// (analoog print-revival 2026). Crème papier + één levendige spot-kleur (magenta) + zwart. Puntdichtheid
// codeert waarde: match% = dichter/groter raster. Speels-editorieel, tactiel, maar strak en leesbaar.
// Deterministisch — rasters via vaste formules/CSS, geen random/Date. Status nooit kleur-alleen (icoon +
// label + tint). Fonts: Fraunces (display) + Libre Franklin (tekst) + Spline Mono (registratie-labels).

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
  Bookmark,
  FileText,
  TriangleAlert,
  ChevronRight,
  RefreshCw,
  Printer,
  CircleDot,
  Newspaper,
  Crosshair,
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

// ── Palet — crème papier, spot-magenta, drukzwart. Drie inkten, meer niet. ───────────────────────
const C = {
  paper: "#f4efe1", // crème drukpapier
  paperDeep: "#ebe4d1", // dieper papiervlak
  card: "#fbf8ef", // schoon vel
  ink: "#1a1712", // drukzwart
  inkSoft: "#5a5348", // secundaire tekst
  inkFaint: "#928a79", // labels
  line: "#ddd4bd", // fijne rand
  lineSoft: "#e8e0cc",
  spot: "#e5007e", // spot-magenta (proceskleur M)
  spotSoft: "#fbdcec",
  spotDeep: "#b80065",
  cyan: "#00a6c4", // subtiele tweede proceskleur (registratie-accent)
  // Semantisch — drukbaar
  ok: "#2f7d4f",
  okSoft: "#d9eddf",
  warn: "#b56a12",
  warnSoft: "#f6e6cd",
  info: "#1f6f86",
  infoSoft: "#d7edf2",
  danger: "#c02a3e",
  dangerSoft: "#f6dde1",
  white: "#ffffff",
};

const display = { fontFamily: "var(--font-lab-fraunces)" };
const bodyF = { fontFamily: "var(--font-lab-franklin)" };
const mono = { fontFamily: "var(--font-lab-spline-mono)" };

// ── Halftoon-textuur via CSS — uniform puntenraster. dot bepaalt de puntgrootte (inktdichtheid). ──
function halftoneBg(color: string, cell = 7, dot = 1.4): React.CSSProperties {
  return {
    backgroundImage: `radial-gradient(${color} ${dot}px, transparent ${dot + 0.6}px)`,
    backgroundSize: `${cell}px ${cell}px`,
    backgroundPosition: "0 0",
  };
}

// Halftoon-verloop (dot-gradient) als beeldvlak — SVG-grid waar de puntstraal oploopt: tonale wig. ─
function HalftoneRamp({
  color = C.spot,
  cols = 40,
  rows = 14,
  cell = 16,
  reverse = false,
}: {
  color?: string;
  cols?: number;
  rows?: number;
  cell?: number;
  reverse?: boolean;
}) {
  const w = cols * cell;
  const h = rows * cell;
  const dots: { x: number; y: number; r: number }[] = [];
  for (let cx = 0; cx < cols; cx++) {
    for (let cy = 0; cy < rows; cy++) {
      const t = reverse ? 1 - cx / (cols - 1) : cx / (cols - 1);
      const r = 0.6 + t * (cell * 0.46);
      dots.push({ x: cx * cell + cell / 2, y: cy * cell + cell / 2, r });
    }
  }
  return (
    <svg
      className="h-full w-full"
      viewBox={`0 0 ${w} ${h}`}
      preserveAspectRatio="xMidYMid slice"
      aria-hidden="true"
    >
      {dots.map((d, i) => (
        <circle key={i} cx={d.x} cy={d.y} r={d.r} fill={color} />
      ))}
    </svg>
  );
}

// Offset-registratie-kruis — klassiek CMYK-target voor de hoeken.
function RegMark({ className = "", color = C.ink }: { className?: string; color?: string }) {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 20 20"
      className={className}
      aria-hidden="true"
      fill="none"
      stroke={color}
      strokeWidth="1"
    >
      <circle cx="10" cy="10" r="5.5" />
      <line x1="10" y1="0" x2="10" y2="6" />
      <line x1="10" y1="14" x2="10" y2="20" />
      <line x1="0" y1="10" x2="6" y2="10" />
      <line x1="14" y1="10" x2="20" y2="10" />
    </svg>
  );
}

// ── Status-model — nooit kleur-alleen ─────────────────────────────────────────────
type StatusStyle = { label: string; Icon: LucideIcon; fg: string; bg: string };
function credMeta(s: CredStatus): StatusStyle {
  switch (s) {
    case "VERIFIED":
      return { label: "Geverifieerd", Icon: Check, fg: C.ok, bg: C.okSoft };
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
      className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold"
      style={{ ...bodyF, background: m.bg, color: m.fg }}
    >
      <m.Icon size={12} strokeWidth={2.4} aria-hidden="true" />
      {m.label}
    </span>
  );
}

// Vel — schoon papiervlak met dubbele drukrand; optionele registratie-hoeken.
function Card({
  children,
  className = "",
  style,
  interactive = false,
  reg = false,
}: {
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
  interactive?: boolean;
  reg?: boolean;
}) {
  return (
    <div
      className={`group/card relative overflow-hidden rounded-lg ${
        interactive
          ? "transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_14px_30px_-18px_rgba(26,23,18,0.45)]"
          : ""
      } ${className}`}
      style={{
        background: C.card,
        boxShadow: `0 0 0 1px ${C.line}, inset 0 0 0 3px ${C.card}, inset 0 0 0 4px ${C.line}`,
        ...style,
      }}
    >
      {reg && (
        <>
          <RegMark
            className="pointer-events-none absolute left-1.5 top-1.5 opacity-30"
            color={C.cyan}
          />
          <RegMark
            className="pointer-events-none absolute right-1.5 top-1.5 opacity-30"
            color={C.spot}
          />
        </>
      )}
      {children}
    </div>
  );
}

function SectionHead({ title, sub, Icon }: { title: string; sub?: string; Icon: LucideIcon }) {
  return (
    <div className="flex items-center gap-3">
      <span
        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md"
        style={{ background: C.spotSoft, boxShadow: `inset 0 0 0 1px ${C.spot}44` }}
        aria-hidden="true"
      >
        <Icon size={17} strokeWidth={2} style={{ color: C.spotDeep }} />
      </span>
      <div className="min-w-0">
        <h2
          className="text-[20px] font-semibold leading-none tracking-[-0.01em]"
          style={{ ...display, color: C.ink }}
        >
          {title}
        </h2>
        {sub && (
          <p className="mt-1 text-[12px]" style={{ ...bodyF, color: C.inkFaint }}>
            {sub}
          </p>
        )}
      </div>
      <span
        className="ml-2 hidden h-2 flex-1 sm:block"
        style={{ ...halftoneBg(C.line, 6, 1.1) }}
        aria-hidden="true"
      />
    </div>
  );
}

function Meta({ Icon, value }: { Icon: LucideIcon; value: string }) {
  return (
    <div className="flex items-center gap-1.5" style={{ color: C.inkSoft }}>
      <Icon size={13} strokeWidth={2} style={{ color: C.spotDeep }} aria-hidden="true" />
      <span className="truncate" style={bodyF}>
        {value}
      </span>
    </div>
  );
}

// Match-swatch — puntdichtheid codeert de waarde: hoger = groter/dichter raster. Getal overdruk.
function DotSwatch({ value, size = 54 }: { value: number; size?: number }) {
  const dot = 0.9 + (value / 100) * 2.4; // hogere match → dikkere punt
  return (
    <span
      className="relative flex shrink-0 items-center justify-center overflow-hidden rounded-md"
      style={{
        width: size,
        height: size,
        background: C.spotSoft,
        boxShadow: `inset 0 0 0 1px ${C.spot}55`,
      }}
      aria-hidden="true"
    >
      <span className="absolute inset-0" style={halftoneBg(C.spot, 6, dot)} />
      <span
        className="relative flex flex-col items-center justify-center rounded px-1"
        style={{ background: "rgba(251,248,239,0.82)" }}
      >
        <span
          className="text-[15px] font-semibold tabular-nums leading-none"
          style={{ ...display, color: C.ink }}
        >
          {value}
        </span>
        <span
          className="text-[7px] font-semibold uppercase tracking-[0.14em]"
          style={{ ...mono, color: C.spotDeep }}
        >
          match
        </span>
      </span>
    </span>
  );
}

// Spark — staafjes met halftoon-vulling; laatste staaf vol spot-magenta.
function Spark({ data }: { data: number[] }) {
  const max = Math.max(...data);
  return (
    <div className="flex h-8 items-end gap-[3px]" aria-hidden="true">
      {data.map((v, i) => {
        const last = i === data.length - 1;
        return (
          <span
            key={i}
            className="relative flex-1 overflow-hidden rounded-t-[1px]"
            style={{
              height: `${Math.max(14, (v / max) * 100)}%`,
              background: last ? C.spot : "transparent",
            }}
          >
            {!last && <span className="absolute inset-0" style={halftoneBg(C.ink, 4, 0.9)} />}
          </span>
        );
      })}
    </div>
  );
}

// ── Root ─────────────────────────────────────────────────────────────────────────
export function Concept183() {
  const [screen, setScreen] = useState<ScreenKey>("dashboard");
  const active = OPDRACHTEN[0] as Opdracht;

  return (
    <div
      className="relative min-h-screen w-full overflow-x-hidden antialiased"
      style={{ ...bodyF, background: C.paper, color: C.ink }}
    >
      {/* Papier-halftoon onder alles */}
      <div
        className="pointer-events-none fixed inset-0 z-0"
        aria-hidden="true"
        style={{ ...halftoneBg(C.ink, 9, 0.8), opacity: 0.05 }}
      />

      <div className="relative z-10">
        {/* Kop — drukzwarte band met magenta halftoon-verloop */}
        <header className="relative overflow-hidden" style={{ background: C.ink }}>
          <div
            className="pointer-events-none absolute inset-y-0 right-0 w-1/2 opacity-70"
            aria-hidden="true"
          >
            <HalftoneRamp color={C.spot} cols={34} rows={12} cell={16} />
          </div>
          <div
            className="pointer-events-none absolute inset-x-0 bottom-0 h-[3px]"
            style={{
              background: `linear-gradient(90deg, ${C.cyan} 0 33%, ${C.spot} 33% 66%, #f5d800 66% 100%)`,
            }}
            aria-hidden="true"
          />
          <div className="relative mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-4 py-5 md:px-8">
            <div className="flex items-center gap-3.5">
              <span
                className="relative flex h-11 w-11 items-center justify-center overflow-hidden rounded-md"
                style={{ background: C.spot }}
                aria-hidden="true"
              >
                <span className="absolute inset-0 opacity-40" style={halftoneBg(C.ink, 5, 1)} />
                <Printer
                  size={20}
                  strokeWidth={2}
                  style={{ color: C.white, position: "relative" }}
                />
              </span>
              <div className="leading-tight">
                <div
                  className="text-[10px] font-semibold uppercase tracking-[0.32em]"
                  style={{ ...mono, color: C.spot }}
                >
                  Halftoon
                </div>
                <div
                  className="text-[24px] font-semibold leading-none tracking-[-0.01em]"
                  style={{ ...display, color: "#f7f2e6" }}
                >
                  Drukpers
                </div>
                <div
                  className="mt-1 text-[10px] uppercase tracking-[0.16em]"
                  style={{ ...mono, color: "rgba(247,242,230,0.5)" }}
                >
                  C · M · Y · K — vel 01
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2.5">
              <span
                className="hidden items-center gap-1.5 rounded-full px-3 py-1.5 text-[11px] font-semibold sm:inline-flex"
                style={{ ...bodyF, background: "rgba(247,242,230,0.12)", color: "#f7f2e6" }}
              >
                <ShieldCheck size={12} strokeWidth={2} style={{ color: C.spot }} /> {PROFIEL.trust}
              </span>
              <span
                className="flex h-10 w-10 items-center justify-center rounded-md text-[12px] font-semibold"
                style={{
                  ...mono,
                  background: C.spotSoft,
                  color: C.ink,
                  boxShadow: `0 0 0 1px ${C.spot}`,
                }}
                aria-hidden="true"
              >
                {PROFIEL.initialen}
              </span>
            </div>
          </div>

          {/* Scherm-switcher — vel-tabs */}
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
                  className="relative shrink-0 rounded-md px-3.5 py-1.5 text-[12.5px] font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-[#1a1712]"
                  style={
                    on
                      ? {
                          ...bodyF,
                          background: C.spot,
                          color: C.white,
                          ["--tw-ring-color" as string]: C.spot,
                        }
                      : {
                          ...bodyF,
                          background: "rgba(247,242,230,0.08)",
                          color: "rgba(247,242,230,0.72)",
                          ["--tw-ring-color" as string]: C.spot,
                        }
                  }
                >
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
        </main>

        <footer className="relative mx-auto max-w-6xl px-4 pb-10 md:px-8">
          <div
            className="flex items-center justify-center gap-2 border-t pt-6 text-[11px]"
            style={{ ...mono, borderColor: C.line, color: C.inkFaint }}
          >
            <CircleDot size={12} aria-hidden="true" /> Raster 60 l/cm — puntdichtheid vertelt de
            waarde.
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
      {/* Hero — vel met magenta halftoon-verloop rechts, registratie-hoeken */}
      <Card reg className="relative">
        <div
          className="pointer-events-none absolute inset-y-0 right-0 w-2/5 opacity-90"
          aria-hidden="true"
        >
          <HalftoneRamp color={C.spot} cols={30} rows={16} cell={16} />
        </div>
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            background: `linear-gradient(100deg, ${C.card} 52%, ${C.card}cc 68%, transparent)`,
          }}
          aria-hidden="true"
        />
        <div className="relative max-w-xl p-6 sm:p-8">
          <span
            className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold"
            style={{ ...bodyF, background: C.spotSoft, color: C.spotDeep }}
          >
            <Newspaper size={12} strokeWidth={2.2} aria-hidden="true" /> {PROFIEL.rol}
          </span>
          <h1
            className="mt-3 text-[32px] font-semibold leading-[1.02] tracking-[-0.02em] sm:text-[44px]"
            style={{ ...display, color: C.ink }}
          >
            Drie matches boven 85%. Vers van de pers.
          </h1>
          <p
            className="mt-3 max-w-lg text-[14px] leading-relaxed"
            style={{ ...bodyF, color: C.inkSoft }}
          >
            Eén regel vraagt aandacht: je VOG verloopt binnenkort. Druk de volgende oplage en houd
            je profiel scherp verifieerbaar.
          </p>
          <div className="mt-5 flex flex-wrap gap-3">
            <button
              onClick={onOpen}
              className="inline-flex items-center gap-2 rounded-md px-5 py-2.5 text-[13px] font-semibold text-white transition-transform hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
              style={{ ...bodyF, background: C.spot, ["--tw-ring-color" as string]: C.spot }}
            >
              Bekijk matches <ArrowRight size={15} aria-hidden="true" />
            </button>
            <button
              onClick={onActies}
              className="inline-flex items-center gap-2 rounded-md px-5 py-2.5 text-[13px] font-semibold transition-colors hover:bg-[#ebe4d1] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
              style={{
                ...bodyF,
                background: C.paperDeep,
                color: C.ink,
                ["--tw-ring-color" as string]: C.spot,
              }}
            >
              <TriangleAlert size={14} strokeWidth={2.2} style={{ color: C.warn }} /> Los actie op
            </button>
          </div>
        </div>
      </Card>

      {/* KPI */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {KPIS.map((k) => (
          <Card key={k.label} interactive className="p-4">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-medium" style={{ ...bodyF, color: C.inkFaint }}>
                {k.label}
              </span>
              <span
                className="inline-flex items-center gap-0.5 rounded px-1.5 py-0.5 text-[10px] font-semibold"
                style={{
                  ...mono,
                  background: k.up ? C.okSoft : C.warnSoft,
                  color: k.up ? C.ok : C.warn,
                }}
              >
                {k.trend}
              </span>
            </div>
            <div
              className="mt-2 text-[26px] font-semibold leading-none tracking-[-0.01em]"
              style={{ ...display, color: C.ink }}
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
          <SectionHead
            title="Aanbevolen matches"
            sub="Op puntdichtheid gerangschikt"
            Icon={CircleDot}
          />
          <div className="space-y-3">
            {OPDRACHTEN.map((o) => (
              <Card key={o.id} interactive>
                <button
                  onClick={onOpen}
                  className="relative flex w-full items-center gap-4 p-4 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset"
                  style={{ ["--tw-ring-color" as string]: C.spot }}
                >
                  <DotSwatch value={o.match} />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <div
                          className="truncate text-[16px] font-semibold tracking-[-0.005em]"
                          style={{ ...display, color: C.ink }}
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
                          className="inline-flex items-center gap-1 rounded px-2 py-0.5 text-[11px] font-medium"
                          style={{ ...bodyF, background: C.paperDeep, color: C.inkSoft }}
                        >
                          <Check size={11} strokeWidth={2.6} style={{ color: C.ok }} /> {r}
                        </span>
                      ))}
                    </div>
                  </div>
                </button>
              </Card>
            ))}
          </div>
        </section>

        <section className="space-y-4">
          <SectionHead title="Vertrouwen" sub="Certificaat-dekking" Icon={ShieldCheck} />
          <Card className="p-5">
            <div className="flex items-center gap-5">
              <span
                className="relative flex h-24 w-24 shrink-0 items-center justify-center overflow-hidden rounded-full"
                style={{
                  background: `conic-gradient(${C.spot} 0deg, ${C.spot} ${dek * 3.6}deg, ${C.line} ${dek * 3.6}deg 360deg)`,
                }}
                aria-hidden="true"
              >
                <span className="absolute inset-0 opacity-30" style={halftoneBg(C.ink, 5, 1)} />
                <span
                  className="absolute inset-[8px] flex flex-col items-center justify-center rounded-full"
                  style={{ background: C.card }}
                >
                  <span
                    className="text-[26px] font-semibold leading-none"
                    style={{ ...display, color: C.ink }}
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

          <Card className="relative" style={{ background: C.ink }}>
            <div
              className="pointer-events-none absolute inset-y-0 right-0 w-1/2 opacity-70"
              aria-hidden="true"
            >
              <HalftoneRamp color={C.spot} cols={22} rows={12} cell={14} />
            </div>
            <div className="relative p-5">
              <span
                className="inline-flex items-center gap-1.5 rounded px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.08em]"
                style={{ ...mono, background: C.warnSoft, color: C.warn }}
              >
                <TriangleAlert size={11} strokeWidth={2.4} aria-hidden="true" /> Prioriteit
              </span>
              <h3
                className="mt-2.5 text-[18px] font-semibold leading-tight tracking-[-0.01em]"
                style={{ ...display, color: "#f7f2e6" }}
              >
                {warn.titel}
              </h3>
              <p
                className="mt-1.5 text-[12.5px] leading-relaxed"
                style={{ ...bodyF, color: "rgba(247,242,230,0.72)" }}
              >
                {warn.detail}
              </p>
              <button
                onClick={onActies}
                className="mt-4 inline-flex items-center gap-2 rounded-md px-4 py-2 text-[12px] font-semibold text-white transition-transform hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-[#1a1712]"
                style={{ ...bodyF, background: C.spot, ["--tw-ring-color" as string]: C.spot }}
              >
                {warn.cta} <ArrowRight size={13} aria-hidden="true" />
              </button>
            </div>
          </Card>
        </section>
      </div>
    </div>
  );
}

// ── Marktplaats — met loading, empty én error-state ────────────────────────────────
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
        <SectionHead title="Marktplaats" sub="Open opdrachten — de oplage" Icon={Newspaper} />
        <div className="flex items-center gap-2">
          <Card className="flex items-center gap-2 rounded-md px-3.5 py-2">
            <Search size={15} style={{ color: C.spotDeep }} aria-hidden="true" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Zoek opdracht of plaats…"
              aria-label="Opdrachten zoeken"
              className="w-40 bg-transparent text-[12.5px] outline-none placeholder:opacity-50"
              style={{ ...bodyF, color: C.ink }}
            />
          </Card>
          <button
            onClick={refresh}
            aria-label="Opnieuw laden"
            className="flex h-10 w-10 items-center justify-center rounded-md transition-colors hover:bg-[#ebe4d1] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
            style={{
              background: C.card,
              boxShadow: `0 0 0 1px ${C.line}`,
              ["--tw-ring-color" as string]: C.spot,
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
          className="flex items-start gap-3 rounded-lg p-4"
          role="alert"
          style={{ background: C.dangerSoft, boxShadow: `0 0 0 1px ${C.danger}33` }}
        >
          <XCircle size={18} strokeWidth={2.2} style={{ color: C.danger }} aria-hidden="true" />
          <div className="min-w-0 flex-1">
            <div className="text-[13px] font-semibold" style={{ ...display, color: C.danger }}>
              Sommige matches konden niet worden gedrukt
            </div>
            <p className="mt-0.5 text-[12px]" style={{ ...bodyF, color: C.inkSoft }}>
              Er ging iets mis op de pers bij het ophalen van de nieuwste opdrachten. Probeer
              opnieuw.
            </p>
          </div>
          <button
            onClick={() => setError(false)}
            className="shrink-0 rounded px-2.5 py-1 text-[11px] font-semibold transition-colors hover:bg-white/50 focus-visible:outline-none focus-visible:ring-2"
            style={{ ...bodyF, color: C.danger, ["--tw-ring-color" as string]: C.danger }}
          >
            Sluiten
          </button>
        </div>
      )}

      {loading ? (
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
          {[0, 1, 2].map((i) => (
            <Card key={i} className="p-4">
              <div className="flex items-center gap-3">
                <span
                  className="h-12 w-12 shrink-0 animate-pulse rounded-md"
                  style={{ background: C.paperDeep }}
                />
                <div className="flex-1 space-y-2">
                  <span
                    className="block h-3.5 w-3/4 animate-pulse rounded"
                    style={{ background: C.paperDeep }}
                  />
                  <span
                    className="block h-3 w-1/2 animate-pulse rounded"
                    style={{ background: C.lineSoft }}
                  />
                </div>
              </div>
              <div className="mt-4 space-y-2">
                <span
                  className="block h-3 w-full animate-pulse rounded"
                  style={{ background: C.lineSoft }}
                />
                <span
                  className="block h-3 w-5/6 animate-pulse rounded"
                  style={{ background: C.lineSoft }}
                />
              </div>
            </Card>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <Card
          reg
          className="relative flex flex-col items-center justify-center gap-3 p-16 text-center"
        >
          <span
            className="relative flex h-16 w-16 items-center justify-center overflow-hidden rounded-full"
            style={{ background: C.spotSoft, boxShadow: `inset 0 0 0 1px ${C.spot}55` }}
            aria-hidden="true"
          >
            <span className="absolute inset-0" style={halftoneBg(C.spot, 6, 1.6)} />
            <Crosshair size={26} style={{ color: C.spotDeep, position: "relative" }} />
          </span>
          <p className="text-[20px] font-semibold" style={{ ...display, color: C.ink }}>
            Niets op deze pagina
          </p>
          <p className="max-w-xs text-[13px]" style={{ ...bodyF, color: C.inkSoft }}>
            Niets gevonden voor &ldquo;{q}&rdquo;. Pas je zoekterm aan om een nieuwe oplage te
            drukken.
          </p>
          <button
            onClick={() => setQ("")}
            className="mt-1 rounded-md px-4 py-2 text-[12px] font-semibold text-white transition-transform hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
            style={{ ...bodyF, background: C.spot, ["--tw-ring-color" as string]: C.spot }}
          >
            Zoekterm wissen
          </button>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
          {filtered.map((o) => (
            <Card key={o.id} interactive reg className="flex flex-col">
              <div className="h-8 w-full overflow-hidden" aria-hidden="true">
                <HalftoneRamp color={C.spot} cols={26} rows={3} cell={11} reverse />
              </div>
              <div className="relative flex items-center gap-3 p-4">
                <DotSwatch value={o.match} size={48} />
                <div className="min-w-0">
                  <h3
                    className="text-[16px] font-semibold leading-tight tracking-[-0.005em]"
                    style={{ ...display, color: C.ink }}
                  >
                    {o.titel}
                  </h3>
                  <p className="mt-0.5 text-[12px]" style={{ ...bodyF, color: C.inkSoft }}>
                    {o.opdrachtgever}
                  </p>
                </div>
              </div>
              <div className="relative px-4 pb-4">
                <dl className="grid grid-cols-2 gap-y-2 text-[12px]">
                  <Meta Icon={MapPin} value={o.plaats} />
                  <Meta Icon={Coins} value={o.tarief} />
                  <Meta Icon={Clock} value={o.uren} />
                  <Meta Icon={CalendarDays} value={o.start} />
                </dl>
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {o.tags.map((t) => (
                    <span
                      key={t}
                      className="rounded px-2 py-0.5 text-[10.5px] font-medium"
                      style={{ ...bodyF, background: C.paperDeep, color: C.inkSoft }}
                    >
                      {t}
                    </span>
                  ))}
                </div>
              </div>
              <button
                onClick={onOpen}
                className="relative mt-auto flex items-center justify-center gap-2 py-3 text-[12.5px] font-semibold transition-colors hover:bg-[#ebe4d1] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset"
                style={{
                  ...bodyF,
                  borderTop: `1px solid ${C.line}`,
                  color: C.spotDeep,
                  ["--tw-ring-color" as string]: C.spot,
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
      <button
        onClick={onBack}
        className="inline-flex items-center gap-1.5 rounded-md px-3.5 py-1.5 text-[12px] font-semibold transition-colors hover:bg-[#ebe4d1] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
        style={{
          ...bodyF,
          background: C.card,
          color: C.ink,
          boxShadow: `0 0 0 1px ${C.line}`,
          ["--tw-ring-color" as string]: C.spot,
        }}
      >
        <ArrowLeft size={14} aria-hidden="true" /> Terug naar de oplage
      </button>

      <Card reg className="relative">
        <div
          className="pointer-events-none absolute inset-y-0 right-0 w-2/5 opacity-90"
          aria-hidden="true"
        >
          <HalftoneRamp color={C.spot} cols={28} rows={16} cell={16} />
        </div>
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            background: `linear-gradient(100deg, ${C.card} 50%, ${C.card}bb 68%, transparent)`,
          }}
          aria-hidden="true"
        />
        <div className="relative flex flex-wrap items-center justify-between gap-5 p-6 sm:p-8">
          <div className="min-w-0">
            <span
              className="inline-block rounded px-2.5 py-1 text-[11px] font-semibold"
              style={{ ...mono, background: C.spotSoft, color: C.spotDeep }}
            >
              {opdracht.id}
            </span>
            <h1
              className="mt-3 max-w-2xl text-[28px] font-semibold leading-[1.06] tracking-[-0.01em] sm:text-[38px]"
              style={{ ...display, color: C.ink }}
            >
              {opdracht.titel}
            </h1>
            <p className="mt-2 text-[13.5px]" style={{ ...bodyF, color: C.inkSoft }}>
              {opdracht.opdrachtgever} · {opdracht.plaats}
            </p>
          </div>
          <DotSwatch value={opdracht.match} size={78} />
        </div>
      </Card>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {feiten.map((f) => (
          <Card key={f.l} interactive className="p-4">
            <span
              className="flex h-8 w-8 items-center justify-center rounded-md"
              style={{ background: C.spotSoft }}
              aria-hidden="true"
            >
              <f.Icon size={15} strokeWidth={2} style={{ color: C.spotDeep }} />
            </span>
            <div
              className="mt-3 text-[17px] font-semibold leading-none"
              style={{ ...display, color: C.ink }}
            >
              {f.v}
            </div>
            <div
              className="mt-1 text-[10.5px] font-medium uppercase tracking-[0.08em]"
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
                    className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full"
                    style={{ background: C.okSoft }}
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
                    className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full"
                    style={{ background: C.warnSoft }}
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
        <button
          className="flex flex-1 items-center justify-center gap-2 rounded-md px-6 py-3.5 text-[13px] font-semibold text-white transition-transform hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
          style={{ ...bodyF, background: C.spot, ["--tw-ring-color" as string]: C.spot }}
        >
          Reageer op deze opdracht <ArrowRight size={16} aria-hidden="true" />
        </button>
        <button
          className="flex items-center justify-center gap-2 rounded-md px-6 py-3.5 text-[13px] font-semibold transition-colors hover:bg-[#ebe4d1] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
          style={{
            ...bodyF,
            background: C.card,
            color: C.ink,
            boxShadow: `0 0 0 1px ${C.line}`,
            ["--tw-ring-color" as string]: C.spot,
          }}
        >
          <Bookmark size={15} strokeWidth={2} style={{ color: C.spotDeep }} /> Bewaar
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
        <SectionHead title="Verificatie" sub="Certificaten &amp; documenten" Icon={ShieldCheck} />
        <button
          className="inline-flex items-center gap-2 rounded-md px-4 py-2 text-[12px] font-semibold text-white transition-transform hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
          style={{ ...bodyF, background: C.spot, ["--tw-ring-color" as string]: C.spot }}
        >
          <Plus size={14} aria-hidden="true" /> Toevoegen
        </button>
      </div>

      <Card reg className="relative">
        <div
          className="pointer-events-none absolute inset-y-0 right-0 w-2/5 opacity-80"
          aria-hidden="true"
        >
          <HalftoneRamp color={C.spot} cols={26} rows={12} cell={16} />
        </div>
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            background: `linear-gradient(100deg, ${C.card} 52%, ${C.card}cc 70%, transparent)`,
          }}
          aria-hidden="true"
        />
        <div className="relative flex flex-wrap items-center gap-6 p-6">
          <span
            className="relative flex h-28 w-28 shrink-0 items-center justify-center overflow-hidden rounded-full"
            style={{
              background: `conic-gradient(${C.spot} 0deg, ${C.spot} ${dek * 3.6}deg, ${C.line} ${dek * 3.6}deg 360deg)`,
            }}
            aria-hidden="true"
          >
            <span className="absolute inset-0 opacity-30" style={halftoneBg(C.ink, 5, 1)} />
            <span
              className="absolute inset-[9px] flex flex-col items-center justify-center rounded-full"
              style={{ background: C.card }}
            >
              <span
                className="text-[30px] font-semibold leading-none"
                style={{ ...display, color: C.ink }}
              >
                {dek}
                <span className="text-[15px]" style={{ color: C.inkFaint }}>
                  %
                </span>
              </span>
            </span>
          </span>
          <div className="max-w-sm">
            <div className="text-[17px] font-semibold" style={{ ...display, color: C.ink }}>
              {verified}/{CREDENTIALS.length} geverifieerd
            </div>
            <p className="mt-1 text-[13px] leading-relaxed" style={{ ...bodyF, color: C.inkSoft }}>
              Elke geverifieerde laag drukt je vertrouwen dieper in. Houd je dekking hoog, dan
              blijft je profiel scherp voor opdrachtgevers.
            </p>
            <span
              className="mt-3 inline-flex items-center gap-1.5 rounded px-3 py-1 text-[11px] font-semibold"
              style={{ ...bodyF, background: C.okSoft, color: C.ok }}
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
                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-md"
                style={{ background: m.bg }}
                aria-hidden="true"
              >
                <m.Icon size={20} strokeWidth={2.2} style={{ color: m.fg }} />
              </span>
              <div className="min-w-0 flex-1">
                <div
                  className="truncate text-[15px] font-semibold tracking-[-0.005em]"
                  style={{ ...display, color: C.ink }}
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
                      className="rounded px-2.5 py-1 text-[11px] font-semibold transition-colors hover:bg-[#ebe4d1] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-1"
                      style={{
                        ...bodyF,
                        background: C.paperDeep,
                        color: C.ink,
                        ["--tw-ring-color" as string]: C.spot,
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

// ── Acties ─────────────────────────────────────────────────────────────────────
function Acties() {
  const sorted = [...ACTIES].sort((a, b) =>
    a.urgentie === b.urgentie ? 0 : a.urgentie === "warning" ? -1 : 1,
  );
  return (
    <div className="space-y-6">
      <SectionHead
        title="Volgende beste acties"
        sub="Op urgentie gerangschikt — pak de bovenste eerst"
        Icon={CircleDot}
      />

      <ol className="space-y-4">
        {sorted.map((a, i) => {
          const warn = a.urgentie === "warning";
          return (
            <li key={a.titel}>
              <Card interactive className="flex items-stretch">
                <span
                  className="w-1.5 shrink-0"
                  style={{ background: warn ? C.warn : C.spot }}
                  aria-hidden="true"
                />
                <div className="flex min-w-0 flex-1 items-center gap-4 p-5">
                  <span
                    className="flex h-11 w-11 shrink-0 items-center justify-center rounded-md text-[16px] font-semibold tabular-nums"
                    style={{
                      ...display,
                      background: warn ? C.warnSoft : C.spotSoft,
                      color: warn ? C.warn : C.spotDeep,
                    }}
                    aria-hidden="true"
                  >
                    {warn ? <TriangleAlert size={19} strokeWidth={2.2} /> : i + 1}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span
                        className="inline-flex items-center gap-1 rounded px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.06em]"
                        style={{
                          ...mono,
                          background: warn ? C.warnSoft : C.infoSoft,
                          color: warn ? C.warn : C.info,
                        }}
                      >
                        {warn ? (
                          <TriangleAlert size={10} strokeWidth={2.4} aria-hidden="true" />
                        ) : (
                          <CircleDot size={10} strokeWidth={2.4} aria-hidden="true" />
                        )}
                        {warn ? "Urgent" : "Kans"}
                      </span>
                      <h3
                        className="text-[16px] font-semibold tracking-[-0.005em]"
                        style={{ ...display, color: C.ink }}
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
                      className="mt-3 inline-flex items-center gap-2 rounded-md px-4 py-2 text-[12px] font-semibold text-white transition-transform hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
                      style={{
                        ...bodyF,
                        background: warn ? C.warn : C.spot,
                        ["--tw-ring-color" as string]: warn ? C.warn : C.spot,
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

      <section className="space-y-3">
        <SectionHead title="Berichten" sub="Recente gesprekken" Icon={FileText} />
        <Card>
          {BERICHTEN.map((b, i) => (
            <div
              key={b.van}
              className="flex items-center gap-3 p-4"
              style={i === 0 ? undefined : { borderTop: `1px solid ${C.line}` }}
            >
              <span
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md text-[11px] font-semibold"
                style={{
                  ...mono,
                  background: C.spotSoft,
                  color: C.ink,
                  boxShadow: `0 0 0 1px ${C.spot}44`,
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
                      style={{ background: C.spot }}
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
        <SectionHead title="Facturen" sub="Omzet &amp; openstaand" Icon={Coins} />
        <button
          className="inline-flex items-center gap-2 rounded-md px-4 py-2 text-[12px] font-semibold text-white transition-transform hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
          style={{ ...bodyF, background: C.spot, ["--tw-ring-color" as string]: C.spot }}
        >
          <Plus size={14} aria-hidden="true" /> Nieuwe factuur
        </button>
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
        {[
          { l: "Betaald (mnd)", v: betaald },
          { l: "Openstaand", v: `${open}` },
          { l: "Te factureren", v: "€ 1.350" },
        ].map((s) => (
          <Card key={s.l} interactive className="p-4">
            <div className="h-2 w-10 overflow-hidden rounded" aria-hidden="true">
              <HalftoneRamp color={C.spot} cols={10} rows={2} cell={5} />
            </div>
            <div className="mt-3 text-[11px] font-medium" style={{ ...bodyF, color: C.inkFaint }}>
              {s.l}
            </div>
            <div
              className="mt-1 text-[26px] font-semibold leading-none tracking-[-0.01em]"
              style={{ ...display, color: C.ink }}
            >
              {s.v}
            </div>
          </Card>
        ))}
      </div>

      <Card>
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
                    className="transition-colors hover:bg-[#ebe4d1]"
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
                        className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold"
                        style={{ ...bodyF, background: m.bg, color: m.fg }}
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
                  style={{ ...mono, color: "rgba(247,242,230,0.6)" }}
                >
                  Totaal betaald
                </td>
                <td
                  className="px-4 py-3 text-right text-[17px] font-semibold tabular-nums"
                  style={{ ...display, color: C.spot }}
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
