"use client";

// Concept 178 — "Sediment" · geologische strata-lagen. Horizontale, afgezette aardlagen (zand,
// oker, terracotta, leisteen) als informatie-hiërarchie: elke sectie is een "aardlaag" met een
// eigen band-kleur en fijne depositie-lijnen; diepte staat voor tijd/rang — bovenaan het jongst en
// meest urgent, dieper het bezonken/afgehandelde. Onderscheidend van jaarringen (concentrisch) en
// terrazzo/marmer (steen-speckle): dit is HORIZONTALE, gelaagde stratigrafie. Rustig, natuurlijk,
// gelaagd. Deterministisch: alle lagen/lijnen zijn statische CSS-gradients (geen random/Date).
// Status nooit kleur-alleen: altijd label + icoon. UI-taal Nederlands.
// Fonts: Bricolage Grotesque (display) + Spline Sans (tekst) + mono (data).

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
  Layers,
  Mountain,
  RotateCw,
  Inbox,
  TrendingUp,
  Gem,
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

// ── Palet — aardtinten in stratigrafische volgorde (jong/bovenaan → oud/diep) ──────────
const C = {
  bg: "#f6f1e9", // licht zand (oppervlak)
  bgDeep: "#ece3d5", // ingezonken zand
  card: "#fbf7f0", // afzettingskaart
  cardDeep: "#f2ebdd",
  ink: "#33291f", // donkere humus-inkt
  inkSoft: "#645541", // secundaire tekst
  inkFaint: "#96876f", // labels
  line: "#e4d8c4", // fijne depositie-rand
  lineSoft: "#eee5d5",
  // Strata-banden (van jong/licht naar oud/diep)
  zand: "#dcc79a", // zand
  oker: "#c79a4e", // oker
  terracotta: "#b5623a", // terracotta
  klei: "#9a6b4b", // klei/bruin
  leisteen: "#4a5a63", // leisteen (diepste, koelste laag)
  gesteente: "#2b3237", // bedrock (donker paneel)
  // Semantisch (status)
  ok: "#4f7a3f",
  okSoft: "#e6eddb",
  warn: "#b0731f",
  warnSoft: "#f3e6cd",
  info: "#3d6274",
  infoSoft: "#dde7ec",
  danger: "#a8452c",
  dangerSoft: "#f1ddd4",
  white: "#fbf7f0",
};

const display = { fontFamily: "var(--font-lab-bricolage)" };
const bodyF = { fontFamily: "var(--font-lab-spline)" };
const mono = { fontFamily: "var(--font-lab-mono)" };

// Fijne horizontale depositie-lijnen (sediment-korrellagen) als achtergrond.
function depositie(base: string, lineColor = "rgba(51,41,31,0.06)", gap = 5): string {
  return `repeating-linear-gradient(0deg, ${lineColor} 0px, ${lineColor} 1px, transparent 1px, transparent ${gap}px), linear-gradient(${base}, ${base})`;
}

// ── Strata-band — een horizontale aardlaag met bandkleur + depositie-lijnen ────────────
function Strata({
  color,
  height = 6,
  lines = true,
}: {
  color: string;
  height?: number;
  lines?: boolean;
}) {
  return (
    <div
      className="relative w-full overflow-hidden"
      style={{
        height,
        background: lines ? depositie(color, "rgba(255,255,255,0.22)", 3) : color,
      }}
      aria-hidden="true"
    >
      <div
        className="absolute inset-x-0 top-0 h-px"
        style={{ background: "rgba(255,255,255,0.35)" }}
      />
      <div
        className="absolute inset-x-0 bottom-0 h-px"
        style={{ background: "rgba(0,0,0,0.12)" }}
      />
    </div>
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
      className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold"
      style={{ ...bodyF, background: m.bg, color: m.fg, boxShadow: `inset 0 0 0 1px ${m.fg}22` }}
    >
      <m.Icon size={12} strokeWidth={2.4} aria-hidden="true" />
      {m.label}
    </span>
  );
}

// Content-kaart — afzetting met fijne bovenband en depositie-textuur.
function Card({
  children,
  className = "",
  style,
  interactive = false,
  band,
}: {
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
  interactive?: boolean;
  band?: string;
}) {
  return (
    <div
      className={`relative overflow-hidden rounded-2xl ${
        interactive
          ? "transition-transform duration-200 hover:-translate-y-0.5 hover:shadow-[0_12px_30px_-16px_rgba(51,41,31,0.4)]"
          : ""
      } ${className}`}
      style={{ background: C.card, boxShadow: `0 0 0 1px ${C.line}`, ...style }}
    >
      {band && <Strata color={band} height={5} />}
      <div className="relative">{children}</div>
    </div>
  );
}

// Sectie-kop — laag-icoon met bandkleur + stratigrafische accentlijn.
function SectionHead({
  title,
  sub,
  Icon,
  band = C.oker,
}: {
  title: string;
  sub?: string;
  Icon: LucideIcon;
  band?: string;
}) {
  return (
    <div className="flex items-center gap-3">
      <span
        className="relative flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-lg"
        style={{ background: band }}
        aria-hidden="true"
      >
        <span
          className="absolute inset-0"
          style={{
            background:
              "repeating-linear-gradient(0deg, rgba(255,255,255,0.22) 0 1px, transparent 1px 3px)",
          }}
        />
        <Icon size={17} strokeWidth={2} style={{ color: C.white, position: "relative" }} />
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
      {/* Stratigrafische mini-kolom */}
      <span className="ml-2 hidden flex-1 flex-col gap-[2px] sm:flex" aria-hidden="true">
        {[C.zand, C.oker, C.terracotta, C.klei].map((cl, i) => (
          <span
            key={i}
            className="h-[3px] w-full rounded-full"
            style={{ background: cl, opacity: 0.55 }}
          />
        ))}
      </span>
    </div>
  );
}

function Meta({ Icon, value }: { Icon: LucideIcon; value: string }) {
  return (
    <div className="flex items-center gap-1.5" style={{ color: C.inkSoft }}>
      <Icon size={13} strokeWidth={1.9} style={{ color: C.terracotta }} aria-hidden="true" />
      <span className="truncate" style={bodyF}>
        {value}
      </span>
    </div>
  );
}

// Match-kolom — verticale afzetting die tot het percentage "opbouwt" (leesbaar, met label).
function MatchColumn({ value, size = 54 }: { value: number; size?: number }) {
  // Vertaal match% naar hoeveel van de kolom "afgezet" is.
  return (
    <span
      className="relative flex shrink-0 flex-col justify-end overflow-hidden rounded-md"
      style={{
        width: size,
        height: size,
        background: C.cardDeep,
        boxShadow: `inset 0 0 0 1px ${C.line}`,
      }}
      aria-hidden="true"
    >
      <span
        className="w-full"
        style={{
          height: `${value}%`,
          background: `linear-gradient(${C.oker}, ${C.terracotta})`,
        }}
      />
      <span
        className="absolute inset-0"
        style={{
          background:
            "repeating-linear-gradient(0deg, rgba(255,255,255,0.18) 0 1px, transparent 1px 4px)",
        }}
      />
      <span className="absolute inset-0 flex flex-col items-center justify-center">
        <span
          className="text-[14px] font-bold tabular-nums leading-none"
          style={{ ...display, color: C.ink }}
        >
          {value}
        </span>
        <span
          className="text-[7px] font-semibold uppercase tracking-[0.1em]"
          style={{ ...mono, color: C.inkSoft }}
        >
          match
        </span>
      </span>
    </span>
  );
}

// Horizontale match-strata-balk voor detailschermen.
function MatchStrataBar({ value }: { value: number }) {
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
          className="text-[22px] font-bold tabular-nums leading-none"
          style={{ ...display, color: C.ink }}
        >
          {value}
          <span className="text-[0.6em]" style={{ color: C.inkFaint }}>
            %
          </span>
        </span>
      </div>
      <div
        className="relative mt-1.5 h-2.5 w-full overflow-hidden rounded-full"
        style={{ background: C.bgDeep }}
        role="progressbar"
        aria-valuenow={value}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={`Match ${value} procent`}
      >
        <div
          className="relative h-full rounded-full"
          style={{ width: `${value}%`, background: `linear-gradient(90deg, ${C.klei}, ${C.oker})` }}
        />
      </div>
    </div>
  );
}

// Mini staaf-spark met sediment-vulling.
function Spark({ data }: { data: number[] }) {
  const max = Math.max(...data);
  return (
    <div className="flex h-8 items-end gap-[3px]" aria-hidden="true">
      {data.map((v, i) => (
        <span
          key={i}
          className="flex-1 rounded-t-[1px]"
          style={{
            height: `${Math.max(14, (v / max) * 100)}%`,
            background: i === data.length - 1 ? C.terracotta : `${C.ink}22`,
          }}
        />
      ))}
    </div>
  );
}

// Herbruikbare foutstrook.
function ErrorStrip({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <div
      role="alert"
      className="flex flex-wrap items-center gap-3 overflow-hidden rounded-2xl px-4 py-3"
      style={{ background: C.dangerSoft, boxShadow: `inset 0 0 0 1px ${C.danger}44` }}
    >
      <span
        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg"
        style={{ background: C.danger }}
        aria-hidden="true"
      >
        <TriangleAlert size={16} strokeWidth={2.4} style={{ color: C.white }} />
      </span>
      <div className="min-w-0 flex-1">
        <div className="text-[13px] font-bold" style={{ ...display, color: C.danger }}>
          Synchronisatie mislukt
        </div>
        <div className="text-[12px]" style={{ ...bodyF, color: C.inkSoft }}>
          {message}
        </div>
      </div>
      <button
        onClick={onRetry}
        className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-[12px] font-semibold text-white transition-transform hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
        style={{ ...bodyF, background: C.danger, ["--tw-ring-color" as string]: C.danger }}
      >
        <RotateCw size={13} aria-hidden="true" /> Opnieuw
      </button>
    </div>
  );
}

// Skeleton-regel voor loading-state (afzettingsband).
function SkelLine({ w = "100%", h = 12 }: { w?: string; h?: number }) {
  return (
    <span
      className="block overflow-hidden rounded-full"
      style={{
        width: w,
        height: h,
        background: "repeating-linear-gradient(0deg, #ece3d5 0 2px, #f2ebdd 2px 4px)",
      }}
      aria-hidden="true"
    />
  );
}

// ── Root ─────────────────────────────────────────────────────────────────────────
export function Concept178() {
  const [screen, setScreen] = useState<ScreenKey>("dashboard");
  const active = OPDRACHTEN[0] as Opdracht;

  return (
    <div
      className="relative min-h-screen w-full overflow-x-hidden antialiased"
      style={{ ...bodyF, background: C.bg, color: C.ink }}
    >
      {/* Kop — bedrock-paneel met zichtbare strata-banden onderaan */}
      <header className="relative overflow-hidden" style={{ background: C.gesteente }}>
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              "repeating-linear-gradient(0deg, rgba(255,255,255,0.03) 0 1px, transparent 1px 7px)",
          }}
          aria-hidden="true"
        />
        <div className="relative mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-4 py-5 md:px-8">
          <div className="flex items-center gap-3.5">
            <span
              className="relative flex h-11 w-11 flex-col overflow-hidden rounded-lg"
              aria-hidden="true"
            >
              <span className="h-1/4 w-full" style={{ background: C.zand }} />
              <span className="h-1/4 w-full" style={{ background: C.oker }} />
              <span className="h-1/4 w-full" style={{ background: C.terracotta }} />
              <span className="h-1/4 w-full" style={{ background: C.leisteen }} />
            </span>
            <div className="leading-tight">
              <div
                className="text-[10px] font-semibold uppercase tracking-[0.34em]"
                style={{ ...mono, color: C.oker }}
              >
                Sediment
              </div>
              <div
                className="text-[23px] font-bold leading-none tracking-[-0.02em]"
                style={{ ...display, color: C.white }}
              >
                Werklagen
              </div>
              <div
                className="mt-1 text-[10px] uppercase tracking-[0.16em]"
                style={{ ...mono, color: "rgba(251,247,240,0.5)" }}
              >
                Match · Verificatie · Omzet
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2.5">
            <span
              className="hidden items-center gap-1.5 rounded-full px-3 py-1.5 text-[11px] font-semibold sm:inline-flex"
              style={{ ...bodyF, background: "rgba(251,247,240,0.1)", color: C.white }}
            >
              <ShieldCheck size={12} strokeWidth={2} style={{ color: C.oker }} aria-hidden="true" />{" "}
              {PROFIEL.trust}
            </span>
            <span
              className="flex h-10 w-10 items-center justify-center rounded-lg text-[12px] font-bold"
              style={{ ...mono, background: C.oker, color: C.gesteente }}
              aria-hidden="true"
            >
              {PROFIEL.initialen}
            </span>
          </div>
        </div>

        {/* Scherm-switcher — laag-tabs */}
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
                className="relative shrink-0 overflow-hidden rounded-lg px-3.5 py-1.5 text-[12.5px] font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
                style={
                  on
                    ? {
                        ...bodyF,
                        background: C.card,
                        color: C.ink,
                        ["--tw-ring-color" as string]: C.oker,
                        ["--tw-ring-offset-color" as string]: C.gesteente,
                      }
                    : {
                        ...bodyF,
                        background: "rgba(251,247,240,0.08)",
                        color: "rgba(251,247,240,0.72)",
                        ["--tw-ring-color" as string]: C.oker,
                        ["--tw-ring-offset-color" as string]: C.gesteente,
                      }
                }
              >
                {on && (
                  <span
                    className="absolute inset-x-0 bottom-0 h-0.5"
                    style={{ background: C.terracotta }}
                    aria-hidden="true"
                  />
                )}
                {s.label}
              </button>
            );
          })}
        </nav>
        {/* Zichtbare strata-overgang naar content */}
        <div aria-hidden="true">
          <Strata color={C.zand} height={4} />
        </div>
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
  );
}

// ── Dashboard ──────────────────────────────────────────────────────────────────
function Dashboard({ onOpen, onActies }: { onOpen: () => void; onActies: () => void }) {
  const verified = CREDENTIALS.filter((c) => c.status === "VERIFIED").length;
  const dek = Math.round((verified / CREDENTIALS.length) * 100);
  const warn = (ACTIES.find((a) => a.urgentie === "warning") ??
    ACTIES[0]) as (typeof ACTIES)[number];

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
      {/* Hero — gestapelde aardlagen als achtergrond */}
      <Card style={{ background: C.gesteente, boxShadow: `0 0 0 1px ${C.gesteente}` }}>
        <div
          className="pointer-events-none absolute inset-x-0 bottom-0 flex flex-col"
          aria-hidden="true"
        >
          <span className="h-6 w-full" style={{ background: C.leisteen, opacity: 0.55 }} />
          <span className="h-5 w-full" style={{ background: C.klei, opacity: 0.5 }} />
          <span className="h-4 w-full" style={{ background: C.terracotta, opacity: 0.45 }} />
          <span className="h-3 w-full" style={{ background: C.oker, opacity: 0.4 }} />
        </div>
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              "repeating-linear-gradient(0deg, rgba(255,255,255,0.03) 0 1px, transparent 1px 8px)",
          }}
          aria-hidden="true"
        />
        <div className="relative max-w-xl p-6 sm:p-8">
          <span
            className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold"
            style={{ ...bodyF, background: "rgba(199,154,78,0.2)", color: C.oker }}
          >
            <Layers size={12} strokeWidth={2.2} aria-hidden="true" /> {PROFIEL.rol}
          </span>
          <h1
            className="mt-3 text-[30px] font-bold leading-[1.06] tracking-[-0.03em] sm:text-[40px]"
            style={{ ...display, color: C.white }}
          >
            Drie matches boven 85%. Je omzet zet zich gestaag af.
          </h1>
          <p
            className="mt-3 max-w-lg text-[14px] leading-relaxed"
            style={{ ...bodyF, color: "rgba(251,247,240,0.72)" }}
          >
            Eén laag vraagt aandacht: je VOG verloopt binnenkort. Herstel de bovenste laag en houd
            je profiel stevig verifieerbaar.
          </p>
          <div className="mt-5 flex flex-wrap gap-3">
            <button
              onClick={onOpen}
              className="inline-flex items-center gap-2 rounded-lg px-5 py-2.5 text-[13px] font-semibold text-white transition-transform hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
              style={{
                ...bodyF,
                background: C.terracotta,
                ["--tw-ring-color" as string]: C.oker,
                ["--tw-ring-offset-color" as string]: C.gesteente,
              }}
            >
              Bekijk matches <ArrowRight size={15} aria-hidden="true" />
            </button>
            <button
              onClick={onActies}
              className="inline-flex items-center gap-2 rounded-lg px-5 py-2.5 text-[13px] font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
              style={{
                ...bodyF,
                background: "rgba(251,247,240,0.1)",
                color: C.white,
                ["--tw-ring-color" as string]: C.oker,
                ["--tw-ring-offset-color" as string]: C.gesteente,
              }}
            >
              <TriangleAlert
                size={14}
                strokeWidth={2.2}
                style={{ color: C.oker }}
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
          <SectionHead title="Kerncijfers" sub="Deze maand" Icon={TrendingUp} band={C.oker} />
          <button
            onClick={refresh}
            className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-[12px] font-semibold transition-colors hover:bg-[#ece3d5] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
            style={{
              ...bodyF,
              background: C.card,
              color: C.ink,
              boxShadow: `0 0 0 1px ${C.line}`,
              ["--tw-ring-color" as string]: C.oker,
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
            : KPIS.map((k, i) => {
                const bands = [C.zand, C.oker, C.terracotta, C.klei];
                return (
                  <Card key={k.label} interactive band={bands[i % bands.length]} className="p-4">
                    <div className="flex items-center justify-between">
                      <span
                        className="text-[11px] font-medium"
                        style={{ ...bodyF, color: C.inkFaint }}
                      >
                        {k.label}
                      </span>
                      <span
                        className="inline-flex items-center gap-0.5 rounded-full px-1.5 py-0.5 text-[10px] font-semibold"
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
                );
              })}
        </div>
      </section>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-[1.6fr_1fr]">
        {/* Matches */}
        <section className="space-y-4">
          <SectionHead
            title="Aanbevolen matches"
            sub="Op match-percentage"
            Icon={Mountain}
            band={C.terracotta}
          />
          <div className="space-y-3">
            {OPDRACHTEN.map((o, i) => {
              const bands = [C.oker, C.terracotta, C.klei];
              return (
                <Card key={o.id} interactive band={bands[i % bands.length]}>
                  <button
                    onClick={onOpen}
                    className="flex w-full items-center gap-4 p-4 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset"
                    style={{ ["--tw-ring-color" as string]: C.oker }}
                  >
                    <MatchColumn value={o.match} />
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
                            className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium"
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
              );
            })}
          </div>
        </section>

        {/* Rechterkolom */}
        <section className="space-y-4">
          <SectionHead
            title="Vertrouwen"
            sub="Certificaat-dekking"
            Icon={ShieldCheck}
            band={C.leisteen}
          />
          <Card className="p-5" band={C.oker}>
            <div className="flex items-center gap-5">
              {/* Verticale strata-kolom als dekkingsmeter */}
              <span
                className="relative flex h-24 w-16 shrink-0 flex-col justify-end overflow-hidden rounded-lg"
                style={{ background: C.cardDeep, boxShadow: `inset 0 0 0 1px ${C.line}` }}
                aria-hidden="true"
              >
                <span
                  className="w-full"
                  style={{
                    height: `${dek}%`,
                    background: `linear-gradient(${C.oker}, ${C.terracotta})`,
                  }}
                />
                <span
                  className="absolute inset-0"
                  style={{
                    background:
                      "repeating-linear-gradient(0deg, rgba(255,255,255,0.18) 0 1px, transparent 1px 5px)",
                  }}
                />
                <span className="absolute inset-0 flex items-center justify-center">
                  <span
                    className="text-[22px] font-bold leading-none"
                    style={{ ...display, color: C.ink }}
                  >
                    {dek}
                    <span className="text-[11px]" style={{ color: C.inkSoft }}>
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

          {/* Prioriteit — bedrock-paneel */}
          <Card style={{ background: C.gesteente, boxShadow: `0 0 0 1px ${C.gesteente}` }}>
            <div
              className="pointer-events-none absolute inset-x-0 bottom-0 flex flex-col"
              aria-hidden="true"
            >
              <span className="h-3 w-full" style={{ background: C.leisteen, opacity: 0.5 }} />
              <span className="h-2 w-full" style={{ background: C.klei, opacity: 0.45 }} />
            </div>
            <div className="relative p-5">
              <span
                className="inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.08em]"
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
                style={{ ...bodyF, color: "rgba(251,247,240,0.7)" }}
              >
                {warn.detail}
              </p>
              <button
                onClick={onActies}
                className="mt-4 inline-flex items-center gap-2 rounded-lg px-4 py-2 text-[12px] font-semibold transition-transform hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
                style={{
                  ...bodyF,
                  background: C.oker,
                  color: C.gesteente,
                  ["--tw-ring-color" as string]: C.oker,
                  ["--tw-ring-offset-color" as string]: C.gesteente,
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

  const bands = [C.zand, C.oker, C.terracotta, C.klei];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <SectionHead title="Marktplaats" sub="Open opdrachten" Icon={Search} band={C.oker} />
        <Card className="flex items-center gap-2 rounded-full px-3.5 py-2">
          <Search size={15} style={{ color: C.terracotta }} aria-hidden="true" />
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
        <Card
          className="flex flex-col items-center justify-center gap-3 p-16 text-center"
          band={C.terracotta}
        >
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
            Niets gevonden voor &ldquo;{q}&rdquo;. Graaf een laag dieper — pas je zoekterm aan.
          </p>
          <button
            onClick={() => setQ("")}
            className="mt-1 rounded-lg px-4 py-2 text-[12px] font-semibold text-white transition-transform hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
            style={{ ...bodyF, background: C.terracotta, ["--tw-ring-color" as string]: C.oker }}
          >
            Zoekterm wissen
          </button>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
          {filtered.map((o, i) => (
            <Card key={o.id} interactive band={bands[i % bands.length]} className="flex flex-col">
              <div className="flex items-center gap-3 p-4">
                <MatchColumn value={o.match} size={48} />
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
                      className="rounded-full px-2 py-0.5 text-[10.5px] font-medium"
                      style={{ ...bodyF, background: C.cardDeep, color: C.inkSoft }}
                    >
                      {t}
                    </span>
                  ))}
                </div>
              </div>
              <button
                onClick={onOpen}
                className="mt-auto flex items-center justify-center gap-2 py-3 text-[12.5px] font-semibold transition-colors hover:bg-[#f2ebdd] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset"
                style={{
                  ...bodyF,
                  borderTop: `1px solid ${C.line}`,
                  color: C.ink,
                  ["--tw-ring-color" as string]: C.oker,
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
  const [saved, setSaved] = useState(false);
  const feiten: { l: string; v: string; Icon: LucideIcon; band: string }[] = [
    { l: "Tarief", v: opdracht.tarief, Icon: Coins, band: C.zand },
    { l: "Omvang", v: opdracht.uren, Icon: Clock, band: C.oker },
    { l: "Start", v: opdracht.start, Icon: CalendarDays, band: C.terracotta },
    { l: "Plaats", v: opdracht.plaats, Icon: MapPin, band: C.klei },
  ];
  return (
    <div className="space-y-6">
      <button
        onClick={onBack}
        className="inline-flex items-center gap-1.5 rounded-lg px-3.5 py-1.5 text-[12px] font-semibold transition-colors hover:bg-[#ece3d5] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
        style={{
          ...bodyF,
          background: C.card,
          color: C.ink,
          boxShadow: `0 0 0 1px ${C.line}`,
          ["--tw-ring-color" as string]: C.oker,
        }}
      >
        <ArrowLeft size={14} aria-hidden="true" /> Terug naar marktplaats
      </button>

      <Card style={{ background: C.gesteente, boxShadow: `0 0 0 1px ${C.gesteente}` }}>
        <div
          className="pointer-events-none absolute inset-x-0 bottom-0 flex flex-col"
          aria-hidden="true"
        >
          <span className="h-4 w-full" style={{ background: C.leisteen, opacity: 0.5 }} />
          <span className="h-3 w-full" style={{ background: C.klei, opacity: 0.45 }} />
          <span className="h-2 w-full" style={{ background: C.terracotta, opacity: 0.4 }} />
        </div>
        <div className="relative flex flex-wrap items-center justify-between gap-5 p-6 sm:p-8">
          <div className="min-w-0 max-w-2xl">
            <span
              className="inline-block rounded-full px-2.5 py-1 text-[11px] font-semibold"
              style={{ ...mono, background: "rgba(251,247,240,0.12)", color: C.oker }}
            >
              {opdracht.id}
            </span>
            <h1
              className="mt-3 text-[26px] font-bold leading-[1.1] tracking-[-0.02em] sm:text-[34px]"
              style={{ ...display, color: C.white }}
            >
              {opdracht.titel}
            </h1>
            <p className="mt-2 text-[13.5px]" style={{ ...bodyF, color: "rgba(251,247,240,0.72)" }}>
              {opdracht.opdrachtgever} · {opdracht.plaats}
            </p>
          </div>
          <div className="w-full max-w-[220px]">
            <MatchStrataBar value={opdracht.match} />
          </div>
        </div>
      </Card>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {feiten.map((f) => (
          <Card key={f.l} interactive band={f.band} className="p-4">
            <span
              className="flex h-9 w-9 items-center justify-center rounded-lg"
              style={{ background: C.cardDeep }}
              aria-hidden="true"
            >
              <f.Icon size={17} strokeWidth={2} style={{ color: C.terracotta }} />
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
          <SectionHead title="Waarom dit past" Icon={Check} band={C.ok} />
          <Card className="p-5" band={C.oker}>
            <ul className="space-y-3">
              {opdracht.redenen.plus.map((r) => (
                <li
                  key={r}
                  className="flex items-start gap-2.5 text-[13.5px] leading-snug"
                  style={{ ...bodyF, color: C.ink }}
                >
                  <span
                    className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-md"
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
          <SectionHead title="Om te overwegen" Icon={TriangleAlert} band={C.warn} />
          <Card className="p-5" band={C.klei}>
            <ul className="space-y-3">
              {opdracht.redenen.min.map((r) => (
                <li
                  key={r}
                  className="flex items-start gap-2.5 text-[13.5px] leading-snug"
                  style={{ ...bodyF, color: C.ink }}
                >
                  <span
                    className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-md"
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
          className="flex flex-1 items-center justify-center gap-2 rounded-lg px-6 py-3.5 text-[13px] font-semibold text-white transition-transform hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
          style={{ ...bodyF, background: C.terracotta, ["--tw-ring-color" as string]: C.oker }}
        >
          Reageer op deze opdracht <ArrowRight size={16} aria-hidden="true" />
        </button>
        <button
          onClick={() => setSaved((s) => !s)}
          aria-pressed={saved}
          className="flex items-center justify-center gap-2 rounded-lg px-6 py-3.5 text-[13px] font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
          style={{
            ...bodyF,
            background: saved ? C.warnSoft : C.card,
            color: C.ink,
            boxShadow: `0 0 0 1px ${saved ? C.oker : C.line}`,
            ["--tw-ring-color" as string]: C.oker,
          }}
        >
          <Star
            size={15}
            strokeWidth={2}
            style={{ color: C.oker, fill: saved ? C.oker : "transparent" }}
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
        <SectionHead
          title="Verificatie"
          sub="Certificaten &amp; documenten"
          Icon={ShieldCheck}
          band={C.leisteen}
        />
        <button
          className="inline-flex items-center gap-2 rounded-lg px-4 py-2 text-[12px] font-semibold text-white transition-transform hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
          style={{ ...bodyF, background: C.terracotta, ["--tw-ring-color" as string]: C.oker }}
        >
          <Plus size={14} aria-hidden="true" /> Toevoegen
        </button>
      </div>

      <Card style={{ background: C.gesteente, boxShadow: `0 0 0 1px ${C.gesteente}` }}>
        <div
          className="pointer-events-none absolute inset-x-0 bottom-0 flex flex-col"
          aria-hidden="true"
        >
          <span className="h-4 w-full" style={{ background: C.leisteen, opacity: 0.5 }} />
          <span className="h-3 w-full" style={{ background: C.klei, opacity: 0.45 }} />
        </div>
        <div className="relative flex flex-wrap items-center gap-6 p-6">
          <span
            className="relative flex h-28 w-20 shrink-0 flex-col justify-end overflow-hidden rounded-lg"
            style={{
              background: "rgba(251,247,240,0.1)",
              boxShadow: "inset 0 0 0 1px rgba(251,247,240,0.2)",
            }}
            aria-hidden="true"
          >
            <span
              className="w-full"
              style={{
                height: `${dek}%`,
                background: `linear-gradient(${C.oker}, ${C.terracotta})`,
              }}
            />
            <span
              className="absolute inset-0"
              style={{
                background:
                  "repeating-linear-gradient(0deg, rgba(255,255,255,0.14) 0 1px, transparent 1px 6px)",
              }}
            />
            <span className="absolute inset-0 flex items-center justify-center">
              <span
                className="text-[28px] font-bold leading-none"
                style={{ ...display, color: C.white }}
              >
                {dek}
                <span className="text-[14px]" style={{ color: "rgba(251,247,240,0.7)" }}>
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
              style={{ ...bodyF, color: "rgba(251,247,240,0.72)" }}
            >
              Elke geverifieerde laag zet zich vast als vertrouwen bij opdrachtgevers. Houd je
              dekking zo hoog mogelijk.
            </p>
            <span
              className="mt-3 inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[11px] font-semibold"
              style={{ ...bodyF, background: "rgba(79,122,63,0.22)", color: "#a8cf8f" }}
            >
              <Gem size={12} strokeWidth={2} aria-hidden="true" /> {PROFIEL.trust}
            </span>
          </div>
        </div>
      </Card>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {CREDENTIALS.map((c, i) => {
          const m = credMeta(c.status);
          const actionable = c.status !== "VERIFIED";
          const bands = [C.zand, C.oker, C.terracotta, C.klei];
          return (
            <Card
              key={c.naam}
              interactive
              band={bands[i % bands.length]}
              className="flex items-center gap-3.5 p-4"
            >
              <span
                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg"
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
                      className="rounded-full px-2.5 py-1 text-[11px] font-semibold transition-colors hover:bg-[#ece3d5] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-1"
                      style={{
                        ...bodyF,
                        background: C.cardDeep,
                        color: C.ink,
                        ["--tw-ring-color" as string]: C.oker,
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
        sub="Van bovenlaag (urgent) naar diepere lagen"
        Icon={Zap}
        band={C.terracotta}
      />

      <ol className="space-y-4">
        {sorted.map((a, i) => {
          const warn = a.urgentie === "warning";
          const band = warn ? C.terracotta : i === 1 ? C.oker : C.klei;
          return (
            <li key={a.titel}>
              <Card interactive className="flex items-stretch overflow-hidden">
                <span
                  className="relative w-2 shrink-0 overflow-hidden"
                  style={{ background: band }}
                  aria-hidden="true"
                >
                  <span
                    className="absolute inset-0"
                    style={{
                      background:
                        "repeating-linear-gradient(0deg, rgba(255,255,255,0.22) 0 1px, transparent 1px 4px)",
                    }}
                  />
                </span>
                <div className="flex min-w-0 flex-1 items-center gap-4 p-5">
                  <span
                    className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg text-[16px] font-bold tabular-nums"
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
                        className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.06em]"
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
                      className="mt-3 inline-flex items-center gap-2 rounded-lg px-4 py-2 text-[12px] font-semibold text-white transition-transform hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
                      style={
                        warn
                          ? { ...bodyF, background: C.warn, ["--tw-ring-color" as string]: C.warn }
                          : {
                              ...bodyF,
                              background: C.terracotta,
                              ["--tw-ring-color" as string]: C.oker,
                            }
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
        <SectionHead title="Berichten" sub="Recente gesprekken" Icon={FileText} band={C.leisteen} />
        <Card band={C.oker}>
          {BERICHTEN.map((b, i) => (
            <div
              key={b.van}
              className="flex items-center gap-3 p-4"
              style={i === 0 ? undefined : { borderTop: `1px solid ${C.line}` }}
            >
              <span
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-[11px] font-bold"
                style={{ ...mono, background: C.leisteen, color: C.white }}
                aria-hidden="true"
              >
                {b.initialen}
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
                      style={{ background: C.terracotta }}
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

  const [error, setError] = useState(true);
  const bands = [C.zand, C.oker, C.terracotta];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <SectionHead title="Facturen" sub="Omzet &amp; openstaand" Icon={Coins} band={C.oker} />
        <button
          className="inline-flex items-center gap-2 rounded-lg px-4 py-2 text-[12px] font-semibold text-white transition-transform hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
          style={{ ...bodyF, background: C.terracotta, ["--tw-ring-color" as string]: C.oker }}
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
        ].map((s, i) => (
          <Card key={s.l} interactive band={bands[i % bands.length]} className="p-4">
            <div className="text-[11px] font-medium" style={{ ...bodyF, color: C.inkFaint }}>
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

      <Card className="overflow-hidden" band={C.klei}>
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
                    className="transition-colors hover:bg-[#f2ebdd]"
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
                        className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold"
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
              <tr style={{ background: C.gesteente }}>
                <td
                  colSpan={4}
                  className="px-4 py-3 text-[11px] font-medium uppercase tracking-[0.1em]"
                  style={{ ...mono, color: "rgba(251,247,240,0.6)" }}
                >
                  Totaal betaald
                </td>
                <td
                  className="px-4 py-3 text-right text-[17px] font-bold tabular-nums"
                  style={{ ...display, color: C.oker }}
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
