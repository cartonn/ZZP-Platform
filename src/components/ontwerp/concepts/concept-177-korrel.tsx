"use client";

// Concept 177 — "Korrel" · filmkorrel & scanline-textuur. 2026-trend: mathematisch gegenereerde
// CSS/SVG-textuur (film grain via feTurbulence-ruis, CRT-scanlines via repeating-linear-gradient)
// die analoge, rauwe warmte legt over een verder strak, rustig grid. Onderscheidend van riso
// (halftoon-druk-registratie) en noir (film-noir-licht/schaduw): dit gaat puur om KORREL/GRAIN als
// materiaal + fijne horizontale scanlines. Basis blijft digitaal-clean en leesbaar — de grain-laag
// is pointer-events-none met lage opacity en schaadt contrast nooit. Deterministisch: feTurbulence
// met vaste seed, geen random/Date. Status nooit kleur-alleen: altijd label + icoon.
// UI-taal Nederlands. Fonts: Bricolage Grotesque (display) + Spline Sans (tekst) + mono (data).

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
  TriangleAlert,
  ChevronRight,
  Zap,
  Film,
  RadioTower,
  RotateCw,
  Inbox,
  TrendingUp,
  Signal,
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

// ── Palet — warme analoge basis (celluloid-crème), donkere sepia-inkt, rossige accenten ──
const C = {
  bg: "#f4efe6", // warm crème (filmpapier)
  bgDeep: "#eae2d4", // secundair warm vlak
  card: "#fbf8f1", // content-kaart (licht, warm)
  cardDeep: "#f2ecdf", // ingezonken kaart
  ink: "#2a231c", // diepe sepia-inkt
  inkSoft: "#5e5347", // secundaire tekst
  inkFaint: "#8f8371", // labels
  line: "#e0d6c4", // fijne warme rand
  lineSoft: "#ece3d4",
  // Analoge accenten (gebrande filmtinten)
  amber: "#c9791e", // amber / oker
  rust: "#b0461f", // roest / terracotta
  olive: "#7c7a2e", // gedempt olijf
  teal: "#2f7d72", // gedempt petrol
  night: "#1c1712", // scanline-nacht (donkere panelen)
  // Semantisch (status)
  ok: "#3f7d3a",
  okSoft: "#e5eddd",
  warn: "#b3711a",
  warnSoft: "#f4e7cf",
  info: "#356a8f",
  infoSoft: "#dde8ee",
  danger: "#a83a2c",
  dangerSoft: "#f2ddd6",
  white: "#fbf8f1",
};

const display = { fontFamily: "var(--font-lab-bricolage)" };
const bodyF = { fontFamily: "var(--font-lab-spline)" };
const mono = { fontFamily: "var(--font-lab-mono)" };

// ── Grain-overlay — statische feTurbulence-ruis (vaste seed → deterministisch) ─────────
// Bewust pointer-events-none + lage opacity: rauwe warmte zonder leesbaarheid te schaden.
function Grain({ opacity = 0.5, scale = 0.9 }: { opacity?: number; scale?: number }) {
  return (
    <svg
      className="pointer-events-none absolute inset-0 h-full w-full mix-blend-multiply"
      aria-hidden="true"
      style={{ opacity }}
      preserveAspectRatio="none"
    >
      <filter id={`grain-${Math.round(scale * 100)}`}>
        <feTurbulence
          type="fractalNoise"
          baseFrequency={scale}
          numOctaves={2}
          stitchTiles="stitch"
          seed={7}
        />
        <feColorMatrix type="saturate" values="0" />
      </filter>
      <rect width="100%" height="100%" filter={`url(#grain-${Math.round(scale * 100)})`} />
    </svg>
  );
}

// ── Scanline-laag — fijne horizontale CRT-lijnen (statische repeating-gradient) ──────────
function Scanlines({
  opacity = 0.14,
  color = "rgba(0,0,0,0.55)",
  gap = 3,
}: {
  opacity?: number;
  color?: string;
  gap?: number;
}) {
  return (
    <div
      className="pointer-events-none absolute inset-0"
      aria-hidden="true"
      style={{
        opacity,
        backgroundImage: `repeating-linear-gradient(0deg, ${color} 0px, ${color} 1px, transparent 1px, transparent ${gap}px)`,
      }}
    />
  );
}

// ── Status-model — nooit kleur-alleen (icoon + label + tint) ─────────────────────
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
      className="inline-flex items-center gap-1.5 rounded-[3px] px-2.5 py-1 text-[11px] font-semibold"
      style={{ ...bodyF, background: m.bg, color: m.fg, boxShadow: `inset 0 0 0 1px ${m.fg}22` }}
    >
      <m.Icon size={12} strokeWidth={2.4} aria-hidden="true" />
      {m.label}
    </span>
  );
}

// Content-kaart — warme celluloid met fijne rand en subtiele grain in de hoek.
function Card({
  children,
  className = "",
  style,
  interactive = false,
  grain = false,
}: {
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
  interactive?: boolean;
  grain?: boolean;
}) {
  return (
    <div
      className={`relative overflow-hidden rounded-[6px] ${
        interactive
          ? "transition-transform duration-200 hover:-translate-y-0.5 hover:shadow-[0_10px_28px_-14px_rgba(42,35,28,0.4)]"
          : ""
      } ${className}`}
      style={{ background: C.card, boxShadow: `0 0 0 1px ${C.line}`, ...style }}
    >
      {grain && <Grain opacity={0.35} scale={0.85} />}
      <div className="relative">{children}</div>
    </div>
  );
}

// Sectie-kop — filmstrip-perforatie als accent + korrel-titelbalk.
function SectionHead({ title, sub, Icon }: { title: string; sub?: string; Icon: LucideIcon }) {
  return (
    <div className="flex items-center gap-3">
      <span
        className="relative flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-[5px]"
        style={{ background: C.night }}
        aria-hidden="true"
      >
        <Scanlines opacity={0.25} color="rgba(255,255,255,0.25)" gap={2} />
        <Icon size={17} strokeWidth={2} style={{ color: C.amber, position: "relative" }} />
      </span>
      <div className="min-w-0">
        <h2
          className="text-[18px] font-bold leading-none tracking-[-0.02em]"
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
      {/* Filmstrip-perforatie */}
      <span
        className="ml-2 hidden h-4 flex-1 rounded-[2px] sm:block"
        style={{
          background: `repeating-linear-gradient(90deg, ${C.line} 0 6px, transparent 6px 12px)`,
          opacity: 0.7,
        }}
        aria-hidden="true"
      />
    </div>
  );
}

function Meta({ Icon, value }: { Icon: LucideIcon; value: string }) {
  return (
    <div className="flex items-center gap-1.5" style={{ color: C.inkSoft }}>
      <Icon size={13} strokeWidth={1.9} style={{ color: C.amber }} aria-hidden="true" />
      <span className="truncate" style={bodyF}>
        {value}
      </span>
    </div>
  );
}

// Match-meter — horizontale korrel-balk met percentage (leesbaar, niet kleur-alleen).
function MatchBar({ value, size = "md" }: { value: number; size?: "sm" | "md" | "lg" }) {
  const h = size === "lg" ? "h-2.5" : size === "sm" ? "h-1.5" : "h-2";
  const t = size === "lg" ? "text-[22px]" : size === "sm" ? "text-[13px]" : "text-[16px]";
  return (
    <div className="w-full">
      <div className="flex items-baseline justify-between">
        <span
          className="text-[9px] font-semibold uppercase tracking-[0.18em]"
          style={{ ...mono, color: C.inkFaint }}
        >
          Match
        </span>
        <span
          className={`${t} font-bold tabular-nums leading-none`}
          style={{ ...display, color: C.ink }}
        >
          {value}
          <span className="text-[0.6em]" style={{ color: C.inkFaint }}>
            %
          </span>
        </span>
      </div>
      <div
        className={`relative mt-1.5 w-full overflow-hidden rounded-[2px] ${h}`}
        style={{ background: C.bgDeep }}
        role="progressbar"
        aria-valuenow={value}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={`Match ${value} procent`}
      >
        <div
          className="relative h-full rounded-[2px]"
          style={{
            width: `${value}%`,
            background: `linear-gradient(90deg, ${C.rust}, ${C.amber})`,
          }}
        >
          <Scanlines opacity={0.22} color="rgba(255,255,255,0.5)" gap={2} />
        </div>
      </div>
    </div>
  );
}

// Ronde match-badge voor compacte plekken.
function MatchDisc({ value, size = 54 }: { value: number; size?: number }) {
  const deg = (value / 100) * 360;
  return (
    <span
      className="relative flex shrink-0 items-center justify-center rounded-full"
      style={{
        width: size,
        height: size,
        background: `conic-gradient(${C.rust} 0deg, ${C.amber} ${deg}deg, ${C.bgDeep} ${deg}deg 360deg)`,
      }}
      aria-hidden="true"
    >
      <span
        className="absolute inset-[4px] flex flex-col items-center justify-center overflow-hidden rounded-full"
        style={{ background: C.card }}
      >
        <Grain opacity={0.3} scale={1.1} />
        <span
          className="relative text-[15px] font-bold tabular-nums leading-none"
          style={{ ...display, color: C.ink }}
        >
          {value}
        </span>
        <span
          className="relative text-[7px] font-semibold uppercase tracking-[0.12em]"
          style={{ ...mono, color: C.inkFaint }}
        >
          match
        </span>
      </span>
    </span>
  );
}

// Mini staaf-spark met korrel-vulling.
function Spark({ data }: { data: number[] }) {
  const max = Math.max(...data);
  return (
    <div className="flex h-8 items-end gap-[3px]" aria-hidden="true">
      {data.map((v, i) => (
        <span
          key={i}
          className="relative flex-1 overflow-hidden rounded-t-[1px]"
          style={{
            height: `${Math.max(14, (v / max) * 100)}%`,
            background: i === data.length - 1 ? C.rust : `${C.ink}22`,
          }}
        >
          {i === data.length - 1 && (
            <Scanlines opacity={0.3} color="rgba(255,255,255,0.4)" gap={2} />
          )}
        </span>
      ))}
    </div>
  );
}

// Herbruikbare foutstrook.
function ErrorStrip({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <div
      role="alert"
      className="relative flex flex-wrap items-center gap-3 overflow-hidden rounded-[6px] px-4 py-3"
      style={{ background: C.dangerSoft, boxShadow: `inset 0 0 0 1px ${C.danger}44` }}
    >
      <Scanlines opacity={0.08} color={C.danger} gap={3} />
      <span
        className="relative flex h-8 w-8 shrink-0 items-center justify-center rounded-[4px]"
        style={{ background: C.danger }}
        aria-hidden="true"
      >
        <TriangleAlert size={16} strokeWidth={2.4} style={{ color: C.white }} />
      </span>
      <div className="relative min-w-0 flex-1">
        <div className="text-[13px] font-bold" style={{ ...display, color: C.danger }}>
          Synchronisatie mislukt
        </div>
        <div className="text-[12px]" style={{ ...bodyF, color: C.inkSoft }}>
          {message}
        </div>
      </div>
      <button
        onClick={onRetry}
        className="relative inline-flex items-center gap-1.5 rounded-[4px] px-3 py-1.5 text-[12px] font-semibold text-white transition-transform hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
        style={{ ...bodyF, background: C.danger, ["--tw-ring-color" as string]: C.danger }}
      >
        <RotateCw size={13} aria-hidden="true" /> Opnieuw
      </button>
    </div>
  );
}

// Skeleton-regel voor loading-state.
function SkelLine({ w = "100%", h = 12 }: { w?: string; h?: number }) {
  return (
    <span
      className="relative block overflow-hidden rounded-[3px]"
      style={{ width: w, height: h, background: C.bgDeep }}
      aria-hidden="true"
    >
      <Scanlines opacity={0.12} color={C.ink} gap={2} />
    </span>
  );
}

// ── Root ─────────────────────────────────────────────────────────────────────────
export function Concept177() {
  const [screen, setScreen] = useState<ScreenKey>("dashboard");
  const active = OPDRACHTEN[0] as Opdracht;

  return (
    <div
      className="relative min-h-screen w-full overflow-x-hidden antialiased"
      style={{ ...bodyF, background: C.bg, color: C.ink }}
    >
      {/* Globale, zeer subtiele grain over de hele achtergrond */}
      <div className="pointer-events-none fixed inset-0 z-0" aria-hidden="true">
        <Grain opacity={0.4} scale={0.8} />
      </div>

      <div className="relative z-10">
        {/* Kop — donker scanline-paneel met filmkorrel */}
        <header className="relative overflow-hidden" style={{ background: C.night }}>
          <Grain opacity={0.6} scale={0.9} />
          <Scanlines opacity={0.16} color="rgba(255,255,255,0.4)" gap={3} />
          <div
            className="pointer-events-none absolute inset-x-0 top-0 h-px"
            style={{ background: `linear-gradient(90deg, transparent, ${C.amber}, transparent)` }}
            aria-hidden="true"
          />
          <div className="relative mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-4 py-5 md:px-8">
            <div className="flex items-center gap-3.5">
              <span
                className="relative flex h-11 w-11 items-center justify-center overflow-hidden rounded-[6px]"
                style={{ background: C.rust }}
                aria-hidden="true"
              >
                <Scanlines opacity={0.3} color="rgba(255,255,255,0.5)" gap={2} />
                <Film size={22} strokeWidth={2} style={{ color: C.white, position: "relative" }} />
              </span>
              <div className="leading-tight">
                <div
                  className="text-[10px] font-semibold uppercase tracking-[0.34em]"
                  style={{ ...mono, color: C.amber }}
                >
                  Korrel
                </div>
                <div
                  className="text-[23px] font-bold leading-none tracking-[-0.02em]"
                  style={{ ...display, color: C.white }}
                >
                  Werkbeeld
                </div>
                <div
                  className="mt-1 text-[10px] uppercase tracking-[0.16em]"
                  style={{ ...mono, color: "rgba(251,248,241,0.5)" }}
                >
                  Match · Verificatie · Omzet
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2.5">
              <span
                className="hidden items-center gap-1.5 rounded-[4px] px-3 py-1.5 text-[11px] font-semibold sm:inline-flex"
                style={{ ...bodyF, background: "rgba(251,248,241,0.1)", color: C.white }}
              >
                <ShieldCheck
                  size={12}
                  strokeWidth={2}
                  style={{ color: C.amber }}
                  aria-hidden="true"
                />{" "}
                {PROFIEL.trust}
              </span>
              <span
                className="relative flex h-10 w-10 items-center justify-center overflow-hidden rounded-[6px] text-[12px] font-bold"
                style={{ ...mono, background: C.amber, color: C.night }}
                aria-hidden="true"
              >
                <Scanlines opacity={0.2} color="rgba(0,0,0,0.5)" gap={2} />
                <span className="relative">{PROFIEL.initialen}</span>
              </span>
            </div>
          </div>

          {/* Scherm-switcher — filmstrip-tabs */}
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
                  className="relative shrink-0 overflow-hidden rounded-[4px] px-3.5 py-1.5 text-[12.5px] font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
                  style={
                    on
                      ? {
                          ...bodyF,
                          background: C.card,
                          color: C.ink,
                          ["--tw-ring-color" as string]: C.amber,
                          ["--tw-ring-offset-color" as string]: C.night,
                        }
                      : {
                          ...bodyF,
                          background: "rgba(251,248,241,0.08)",
                          color: "rgba(251,248,241,0.72)",
                          ["--tw-ring-color" as string]: C.amber,
                          ["--tw-ring-offset-color" as string]: C.night,
                        }
                  }
                >
                  {on && (
                    <span
                      className="absolute inset-x-0 bottom-0 h-0.5"
                      style={{ background: C.rust }}
                      aria-hidden="true"
                    />
                  )}
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

  // Micro-interactie + loading: KPI's laden en zijn te vernieuwen.
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    const t = setTimeout(() => setLoading(false), 640);
    return () => clearTimeout(t);
  }, []);
  const refresh = () => {
    setLoading(true);
    setTimeout(() => setLoading(false), 640);
  };

  return (
    <div className="space-y-8">
      {/* Hero — donker scanline-paneel */}
      <Card style={{ background: C.night, boxShadow: `0 0 0 1px ${C.night}` }}>
        <Grain opacity={0.55} scale={0.9} />
        <Scanlines opacity={0.13} color="rgba(255,255,255,0.4)" gap={4} />
        <div
          className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full"
          style={{ background: `radial-gradient(circle, ${C.rust}55, transparent 68%)` }}
          aria-hidden="true"
        />
        <div className="relative max-w-xl p-6 sm:p-8">
          <span
            className="inline-flex items-center gap-1.5 rounded-[4px] px-2.5 py-1 text-[11px] font-semibold"
            style={{ ...bodyF, background: "rgba(201,121,30,0.18)", color: C.amber }}
          >
            <RadioTower size={12} strokeWidth={2.2} aria-hidden="true" /> {PROFIEL.rol}
          </span>
          <h1
            className="mt-3 text-[30px] font-bold leading-[1.06] tracking-[-0.03em] sm:text-[40px]"
            style={{ ...display, color: C.white }}
          >
            Drie matches boven 85%. Scherp beeld, warme cijfers.
          </h1>
          <p
            className="mt-3 max-w-lg text-[14px] leading-relaxed"
            style={{ ...bodyF, color: "rgba(251,248,241,0.72)" }}
          >
            Eén ding vraagt aandacht: je VOG verloopt binnenkort. Regel het en houd je profiel
            scherp verifieerbaar.
          </p>
          <div className="mt-5 flex flex-wrap gap-3">
            <button
              onClick={onOpen}
              className="inline-flex items-center gap-2 rounded-[5px] px-5 py-2.5 text-[13px] font-semibold text-white transition-transform hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
              style={{
                ...bodyF,
                background: C.rust,
                ["--tw-ring-color" as string]: C.amber,
                ["--tw-ring-offset-color" as string]: C.night,
              }}
            >
              Bekijk matches <ArrowRight size={15} aria-hidden="true" />
            </button>
            <button
              onClick={onActies}
              className="inline-flex items-center gap-2 rounded-[5px] px-5 py-2.5 text-[13px] font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
              style={{
                ...bodyF,
                background: "rgba(251,248,241,0.1)",
                color: C.white,
                ["--tw-ring-color" as string]: C.amber,
                ["--tw-ring-offset-color" as string]: C.night,
              }}
            >
              <TriangleAlert
                size={14}
                strokeWidth={2.2}
                style={{ color: C.amber }}
                aria-hidden="true"
              />{" "}
              Los actie op
            </button>
          </div>
        </div>
      </Card>

      {/* KPI-kaarten met loading-skeleton */}
      <section>
        <div className="mb-3 flex items-center justify-between">
          <SectionHead title="Kerncijfers" sub="Deze maand" Icon={TrendingUp} />
          <button
            onClick={refresh}
            className="inline-flex items-center gap-1.5 rounded-[4px] px-3 py-1.5 text-[12px] font-semibold transition-colors hover:bg-[#eae2d4] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
            style={{
              ...bodyF,
              background: C.card,
              color: C.ink,
              boxShadow: `0 0 0 1px ${C.line}`,
              ["--tw-ring-color" as string]: C.amber,
            }}
            aria-label="Kerncijfers vernieuwen"
          >
            <RotateCw size={13} className={loading ? "animate-spin" : ""} aria-hidden="true" />{" "}
            Vernieuwen
          </button>
        </div>
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          {loading
            ? KPIS.map((k) => (
                <Card key={k.label} className="p-4">
                  <SkelLine w="60%" h={10} />
                  <div className="mt-3">
                    <SkelLine w="45%" h={22} />
                  </div>
                  <div className="mt-4">
                    <SkelLine w="100%" h={24} />
                  </div>
                </Card>
              ))
            : KPIS.map((k) => (
                <Card key={k.label} interactive grain className="p-4">
                  <div className="flex items-center justify-between">
                    <span
                      className="text-[11px] font-medium"
                      style={{ ...bodyF, color: C.inkFaint }}
                    >
                      {k.label}
                    </span>
                    <span
                      className="inline-flex items-center gap-0.5 rounded-[3px] px-1.5 py-0.5 text-[10px] font-semibold"
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
                    className="mt-2 text-[26px] font-bold leading-none tracking-[-0.02em]"
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
      </section>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-[1.6fr_1fr]">
        {/* Matches */}
        <section className="space-y-4">
          <SectionHead title="Aanbevolen matches" sub="Op match-percentage" Icon={Signal} />
          <div className="space-y-3">
            {OPDRACHTEN.map((o) => (
              <Card key={o.id} interactive className="overflow-hidden">
                <button
                  onClick={onOpen}
                  className="flex w-full items-center gap-4 p-4 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset"
                  style={{ ["--tw-ring-color" as string]: C.amber }}
                >
                  <MatchDisc value={o.match} />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <div
                          className="truncate text-[15.5px] font-bold tracking-[-0.01em]"
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
                          className="inline-flex items-center gap-1 rounded-[3px] px-2 py-0.5 text-[11px] font-medium"
                          style={{ ...bodyF, background: C.cardDeep, color: C.inkSoft }}
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
                </button>
              </Card>
            ))}
          </div>
        </section>

        {/* Rechterkolom */}
        <section className="space-y-4">
          <SectionHead title="Vertrouwen" sub="Certificaat-dekking" Icon={ShieldCheck} />
          <Card className="p-5" grain>
            <div className="flex items-center gap-5">
              <span
                className="relative flex h-24 w-24 shrink-0 items-center justify-center rounded-full"
                style={{
                  background: `conic-gradient(${C.teal} 0deg, ${C.olive} ${dek * 1.8}deg, ${C.amber} ${dek * 3.6}deg, ${C.bgDeep} ${dek * 3.6}deg 360deg)`,
                }}
                aria-hidden="true"
              >
                <span
                  className="absolute inset-[8px] flex flex-col items-center justify-center overflow-hidden rounded-full"
                  style={{ background: C.card }}
                >
                  <Grain opacity={0.3} scale={1.1} />
                  <span
                    className="relative text-[26px] font-bold leading-none"
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

          {/* Prioriteit — donker scanline-paneel */}
          <Card style={{ background: C.night, boxShadow: `0 0 0 1px ${C.night}` }}>
            <Grain opacity={0.5} scale={0.95} />
            <Scanlines opacity={0.12} color="rgba(255,255,255,0.4)" gap={3} />
            <div className="relative p-5">
              <span
                className="inline-flex items-center gap-1.5 rounded-[3px] px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.08em]"
                style={{ ...mono, background: C.warnSoft, color: C.warn }}
              >
                <TriangleAlert size={11} strokeWidth={2.4} aria-hidden="true" /> Prioriteit
              </span>
              <h3
                className="mt-2.5 text-[17px] font-bold leading-tight tracking-[-0.01em]"
                style={{ ...display, color: C.white }}
              >
                {warn.titel}
              </h3>
              <p
                className="mt-1.5 text-[12.5px] leading-relaxed"
                style={{ ...bodyF, color: "rgba(251,248,241,0.7)" }}
              >
                {warn.detail}
              </p>
              <button
                onClick={onActies}
                className="mt-4 inline-flex items-center gap-2 rounded-[5px] px-4 py-2 text-[12px] font-semibold text-white transition-transform hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
                style={{
                  ...bodyF,
                  background: C.amber,
                  color: C.night,
                  ["--tw-ring-color" as string]: C.amber,
                  ["--tw-ring-offset-color" as string]: C.night,
                }}
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

// ── Marktplaats ──────────────────────────────────────────────────────────────────
function Marktplaats({ onOpen }: { onOpen: () => void }) {
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(true);

  // Initiële laadsimulatie (deterministisch, geen random).
  useEffect(() => {
    const t = setTimeout(() => setLoading(false), 720);
    return () => clearTimeout(t);
  }, []);

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
        <Card className="flex items-center gap-2 rounded-[5px] px-3.5 py-2">
          <Search size={15} style={{ color: C.amber }} aria-hidden="true" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Zoek opdracht of plaats…"
            aria-label="Opdrachten zoeken"
            className="w-44 bg-transparent text-[12.5px] outline-none placeholder:opacity-50"
            style={{ ...bodyF, color: C.ink }}
          />
        </Card>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
          {[0, 1, 2].map((i) => (
            <Card key={i} className="p-4">
              <div className="flex items-center gap-3">
                <SkelLine w="48px" h={48} />
                <div className="flex-1 space-y-2">
                  <SkelLine w="80%" h={14} />
                  <SkelLine w="55%" h={10} />
                </div>
              </div>
              <div className="mt-4 space-y-2">
                <SkelLine w="100%" h={10} />
                <SkelLine w="90%" h={10} />
                <SkelLine w="70%" h={10} />
              </div>
            </Card>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <Card className="flex flex-col items-center justify-center gap-3 p-16 text-center" grain>
          <span
            className="flex h-16 w-16 items-center justify-center rounded-full"
            style={{ background: C.bgDeep }}
            aria-hidden="true"
          >
            <Inbox size={30} strokeWidth={1.6} style={{ color: C.inkFaint }} />
          </span>
          <p className="text-[19px] font-bold" style={{ ...display, color: C.ink }}>
            Geen match gevonden
          </p>
          <p className="max-w-xs text-[13px]" style={{ ...bodyF, color: C.inkSoft }}>
            Niets gevonden voor &ldquo;{q}&rdquo;. Pas de belichting aan — verander je zoekterm.
          </p>
          <button
            onClick={() => setQ("")}
            className="mt-1 rounded-[5px] px-4 py-2 text-[12px] font-semibold text-white transition-transform hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
            style={{ ...bodyF, background: C.rust, ["--tw-ring-color" as string]: C.amber }}
          >
            Zoekterm wissen
          </button>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
          {filtered.map((o) => (
            <Card key={o.id} interactive className="flex flex-col">
              <div
                className="relative h-1.5 w-full overflow-hidden"
                style={{ background: `linear-gradient(90deg, ${C.rust}, ${C.amber})` }}
                aria-hidden="true"
              >
                <Scanlines opacity={0.25} color="rgba(255,255,255,0.5)" gap={2} />
              </div>
              <div className="flex items-center gap-3 p-4">
                <MatchDisc value={o.match} size={48} />
                <div className="min-w-0">
                  <h3
                    className="text-[15px] font-bold leading-tight tracking-[-0.01em]"
                    style={{ ...display, color: C.ink }}
                  >
                    {o.titel}
                  </h3>
                  <p className="mt-0.5 text-[12px]" style={{ ...bodyF, color: C.inkSoft }}>
                    {o.opdrachtgever}
                  </p>
                </div>
              </div>
              <div className="px-4 pb-4">
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
                      className="rounded-[3px] px-2 py-0.5 text-[10.5px] font-medium"
                      style={{ ...bodyF, background: C.cardDeep, color: C.inkSoft }}
                    >
                      {t}
                    </span>
                  ))}
                </div>
              </div>
              <button
                onClick={onOpen}
                className="mt-auto flex items-center justify-center gap-2 py-3 text-[12.5px] font-semibold transition-colors hover:bg-[#f2ecdf] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset"
                style={{
                  ...bodyF,
                  borderTop: `1px solid ${C.line}`,
                  color: C.ink,
                  ["--tw-ring-color" as string]: C.amber,
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
  const [saved, setSaved] = useState(false); // micro-interactie: bewaren
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
        className="inline-flex items-center gap-1.5 rounded-[5px] px-3.5 py-1.5 text-[12px] font-semibold transition-colors hover:bg-[#eae2d4] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
        style={{
          ...bodyF,
          background: C.card,
          color: C.ink,
          boxShadow: `0 0 0 1px ${C.line}`,
          ["--tw-ring-color" as string]: C.amber,
        }}
      >
        <ArrowLeft size={14} aria-hidden="true" /> Terug naar marktplaats
      </button>

      <Card style={{ background: C.night, boxShadow: `0 0 0 1px ${C.night}` }}>
        <Grain opacity={0.5} scale={0.9} />
        <Scanlines opacity={0.12} color="rgba(255,255,255,0.4)" gap={4} />
        <div className="relative flex flex-wrap items-center justify-between gap-5 p-6 sm:p-8">
          <div className="min-w-0 max-w-2xl">
            <span
              className="inline-block rounded-[3px] px-2.5 py-1 text-[11px] font-semibold"
              style={{ ...mono, background: "rgba(251,248,241,0.12)", color: C.amber }}
            >
              {opdracht.id}
            </span>
            <h1
              className="mt-3 text-[26px] font-bold leading-[1.1] tracking-[-0.02em] sm:text-[34px]"
              style={{ ...display, color: C.white }}
            >
              {opdracht.titel}
            </h1>
            <p className="mt-2 text-[13.5px]" style={{ ...bodyF, color: "rgba(251,248,241,0.72)" }}>
              {opdracht.opdrachtgever} · {opdracht.plaats}
            </p>
          </div>
          <div className="w-full max-w-[220px]">
            <MatchBar value={opdracht.match} size="lg" />
          </div>
        </div>
      </Card>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {feiten.map((f) => (
          <Card key={f.l} interactive grain className="p-4">
            <span
              className="flex h-9 w-9 items-center justify-center rounded-[5px]"
              style={{ background: C.cardDeep }}
              aria-hidden="true"
            >
              <f.Icon size={17} strokeWidth={2} style={{ color: C.amber }} />
            </span>
            <div
              className="mt-3 text-[16px] font-bold leading-none"
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
                    className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-[4px]"
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
                    className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-[4px]"
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
          className="flex flex-1 items-center justify-center gap-2 rounded-[5px] px-6 py-3.5 text-[13px] font-semibold text-white transition-transform hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
          style={{ ...bodyF, background: C.rust, ["--tw-ring-color" as string]: C.amber }}
        >
          Reageer op deze opdracht <ArrowRight size={16} aria-hidden="true" />
        </button>
        <button
          onClick={() => setSaved((s) => !s)}
          aria-pressed={saved}
          className="flex items-center justify-center gap-2 rounded-[5px] px-6 py-3.5 text-[13px] font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
          style={{
            ...bodyF,
            background: saved ? C.warnSoft : C.card,
            color: C.ink,
            boxShadow: `0 0 0 1px ${saved ? C.amber : C.line}`,
            ["--tw-ring-color" as string]: C.amber,
          }}
        >
          <Star
            size={15}
            strokeWidth={2}
            style={{ color: C.amber, fill: saved ? C.amber : "transparent" }}
            aria-hidden="true"
          />{" "}
          {saved ? "Bewaard" : "Bewaar"}
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
          className="inline-flex items-center gap-2 rounded-[5px] px-4 py-2 text-[12px] font-semibold text-white transition-transform hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
          style={{ ...bodyF, background: C.rust, ["--tw-ring-color" as string]: C.amber }}
        >
          <Plus size={14} aria-hidden="true" /> Toevoegen
        </button>
      </div>

      <Card style={{ background: C.night, boxShadow: `0 0 0 1px ${C.night}` }}>
        <Grain opacity={0.5} scale={0.9} />
        <Scanlines opacity={0.12} color="rgba(255,255,255,0.4)" gap={4} />
        <div className="relative flex flex-wrap items-center gap-6 p-6">
          <span
            className="relative flex h-28 w-28 shrink-0 items-center justify-center rounded-full"
            style={{
              background: `conic-gradient(${C.rust} 0deg, ${C.amber} ${dek * 2.4}deg, ${C.olive} ${dek * 3.6}deg, rgba(251,248,241,0.15) ${dek * 3.6}deg 360deg)`,
            }}
            aria-hidden="true"
          >
            <span
              className="absolute inset-[9px] flex flex-col items-center justify-center overflow-hidden rounded-full"
              style={{ background: C.night }}
            >
              <Grain opacity={0.4} scale={1.1} />
              <span
                className="relative text-[30px] font-bold leading-none"
                style={{ ...display, color: C.white }}
              >
                {dek}
                <span className="text-[15px]" style={{ color: "rgba(251,248,241,0.6)" }}>
                  %
                </span>
              </span>
            </span>
          </span>
          <div className="max-w-sm">
            <div className="text-[16px] font-bold" style={{ ...display, color: C.white }}>
              {verified}/{CREDENTIALS.length} geverifieerd
            </div>
            <p
              className="mt-1 text-[13px] leading-relaxed"
              style={{ ...bodyF, color: "rgba(251,248,241,0.72)" }}
            >
              Elke geverifieerde bijdrage geeft opdrachtgevers een scherper beeld. Houd je dekking
              zo hoog mogelijk.
            </p>
            <span
              className="mt-3 inline-flex items-center gap-1.5 rounded-[4px] px-3 py-1 text-[11px] font-semibold"
              style={{ ...bodyF, background: "rgba(63,125,58,0.2)", color: "#9fd08f" }}
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
                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[6px]"
                style={{ background: m.bg }}
                aria-hidden="true"
              >
                <m.Icon size={20} strokeWidth={2.2} style={{ color: m.fg }} />
              </span>
              <div className="min-w-0 flex-1">
                <div
                  className="truncate text-[14.5px] font-bold tracking-[-0.01em]"
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
                      className="rounded-[4px] px-2.5 py-1 text-[11px] font-semibold transition-colors hover:bg-[#eae2d4] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-1"
                      style={{
                        ...bodyF,
                        background: C.cardDeep,
                        color: C.ink,
                        ["--tw-ring-color" as string]: C.amber,
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
                  className="relative w-1.5 shrink-0 overflow-hidden"
                  style={{
                    background: warn
                      ? `linear-gradient(${C.warn}, ${C.rust})`
                      : `linear-gradient(${C.amber}, ${C.olive})`,
                  }}
                  aria-hidden="true"
                >
                  <Scanlines opacity={0.25} color="rgba(255,255,255,0.4)" gap={2} />
                </span>
                <div className="flex min-w-0 flex-1 items-center gap-4 p-5">
                  <span
                    className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[6px] text-[16px] font-bold tabular-nums"
                    style={{
                      ...display,
                      background: warn ? C.warnSoft : C.cardDeep,
                      color: warn ? C.warn : C.ink,
                    }}
                    aria-hidden="true"
                  >
                    {warn ? <TriangleAlert size={19} strokeWidth={2.2} /> : i + 1}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span
                        className="inline-flex items-center gap-1 rounded-[3px] px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.06em]"
                        style={{
                          ...mono,
                          background: warn ? C.warnSoft : C.infoSoft,
                          color: warn ? C.warn : C.info,
                        }}
                      >
                        {warn ? (
                          <TriangleAlert size={10} strokeWidth={2.4} aria-hidden="true" />
                        ) : (
                          <Zap size={10} strokeWidth={2.4} aria-hidden="true" />
                        )}
                        {warn ? "Urgent" : "Kans"}
                      </span>
                      <h3
                        className="text-[15.5px] font-bold tracking-[-0.01em]"
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
                      className="mt-3 inline-flex items-center gap-2 rounded-[5px] px-4 py-2 text-[12px] font-semibold text-white transition-transform hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
                      style={
                        warn
                          ? { ...bodyF, background: C.warn, ["--tw-ring-color" as string]: C.warn }
                          : { ...bodyF, background: C.rust, ["--tw-ring-color" as string]: C.amber }
                      }
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
        <Card>
          {BERICHTEN.map((b, i) => (
            <div
              key={b.van}
              className="flex items-center gap-3 p-4"
              style={i === 0 ? undefined : { borderTop: `1px solid ${C.line}` }}
            >
              <span
                className="relative flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-[6px] text-[11px] font-bold"
                style={{ ...mono, background: C.night, color: C.amber }}
                aria-hidden="true"
              >
                <Scanlines opacity={0.25} color="rgba(255,255,255,0.3)" gap={2} />
                <span className="relative">{b.initialen}</span>
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span
                    className="truncate text-[13px] font-bold"
                    style={{ ...display, color: C.ink }}
                  >
                    {b.van}
                  </span>
                  {b.ongelezen && (
                    <span
                      className="h-1.5 w-1.5 rounded-full"
                      style={{ background: C.rust }}
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

  // Foutstrook-demo (echte error-state), te herstellen.
  const [error, setError] = useState(true);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <SectionHead title="Facturen" sub="Omzet &amp; openstaand" Icon={Coins} />
        <button
          className="inline-flex items-center gap-2 rounded-[5px] px-4 py-2 text-[12px] font-semibold text-white transition-transform hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
          style={{ ...bodyF, background: C.rust, ["--tw-ring-color" as string]: C.amber }}
        >
          <Plus size={14} aria-hidden="true" /> Nieuwe factuur
        </button>
      </div>

      {error && (
        <ErrorStrip
          message="De betaalstatus van 1 factuur kon niet worden opgehaald. Weergegeven cijfers kunnen verouderd zijn."
          onRetry={() => setError(false)}
        />
      )}

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
        {[
          { l: "Betaald (mnd)", v: betaald },
          { l: "Openstaand", v: `${open}` },
          { l: "Te factureren", v: "€ 1.350" },
        ].map((s) => (
          <Card key={s.l} interactive grain className="p-4">
            <div
              className="relative h-1.5 w-10 overflow-hidden rounded-[2px]"
              style={{ background: `linear-gradient(90deg, ${C.rust}, ${C.amber})` }}
              aria-hidden="true"
            >
              <Scanlines opacity={0.25} color="rgba(255,255,255,0.5)" gap={2} />
            </div>
            <div className="mt-3 text-[11px] font-medium" style={{ ...bodyF, color: C.inkFaint }}>
              {s.l}
            </div>
            <div
              className="mt-1 text-[26px] font-bold leading-none tracking-[-0.02em]"
              style={{ ...display, color: C.ink }}
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
              <tr style={{ background: C.cardDeep }}>
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
                    className="transition-colors hover:bg-[#f2ecdf]"
                    style={i === 0 ? undefined : { borderTop: `1px solid ${C.line}` }}
                  >
                    <td
                      className="px-4 py-3 text-[13px] font-bold tabular-nums"
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
                        className="inline-flex items-center gap-1.5 rounded-[3px] px-2.5 py-1 text-[11px] font-semibold"
                        style={{ ...bodyF, background: m.bg, color: m.fg }}
                      >
                        <m.Icon size={11} strokeWidth={2.4} aria-hidden="true" /> {m.label}
                      </span>
                    </td>
                    <td
                      className="px-4 py-3 text-right text-[15px] font-bold tabular-nums"
                      style={{ ...display, color: C.ink }}
                    >
                      {f.bedrag}
                    </td>
                  </tr>
                );
              })}
            </tbody>
            <tfoot>
              <tr style={{ background: C.night }}>
                <td
                  colSpan={4}
                  className="px-4 py-3 text-[11px] font-medium uppercase tracking-[0.1em]"
                  style={{ ...mono, color: "rgba(251,248,241,0.6)" }}
                >
                  Totaal betaald
                </td>
                <td
                  className="px-4 py-3 text-right text-[17px] font-bold tabular-nums"
                  style={{ ...display, color: C.amber }}
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
