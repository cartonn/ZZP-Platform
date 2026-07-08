"use client";

// Concept 181 — "Refractie" · Liquid Glass / spatiaal refractief glas (de bepalende 2026 OS-esthetiek,
// visionOS / iOS 26). GEEN platte glassmorphism: dit gaat om OPTISCHE LENSWERKING — translucente panelen
// die de content erachter licht breken/vervormen (een gebrekte coördinaatgrid schijnt door het glas), met
// specular edge-highlights (dunne lichtrand bovenlangs), gelaagde diepte en dynamische doorschijnendheid.
// Koel palet: helderwit/lichtblauw basis, iris/violet-blauw accent, veel backdrop-blur, subtiele binnen-glow.
// Micro-interactie: bij hover strijkt een specular sweep over de kaart. Deterministisch — SVG-refractie via
// een vaste feTurbulence-seed, geen random/Date. Status nooit kleur-alleen (icoon + label + tint).
// Fonts: Geist (display) + Inter (tekst) + Geist Mono (data). UI-taal Nederlands.

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
  Sparkles,
  RefreshCw,
  Gem,
  Layers,
  Zap,
  Droplet,
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

// ── Palet — koel liquid glass: helderwit/lichtblauw basis, iris/violet-blauw accent ──────────────
const C = {
  bg: "#eaf0fb", // helderblauw-wit (lucht achter het glas)
  bgDeep: "#dde6f7", // dieper lichtblauw
  ink: "#1b2440", // diepe nachtblauwe inkt
  inkSoft: "#4a5578", // secundaire tekst
  inkFaint: "#8892b0", // labels
  glassLine: "rgba(255,255,255,0.65)", // specular rand
  glassEdge: "rgba(120,140,200,0.28)", // koele glasrand
  iris: "#6366f1", // iris/violet-blauw accent
  irisDeep: "#4f46e5",
  irisSoft: "#e8eaff",
  sky: "#38bdf8", // helder hemelblauw (refractie-tint)
  // Semantisch — koel, in dezelfde wereld
  ok: "#0ea472",
  okSoft: "#d9f5ea",
  warn: "#d98324",
  warnSoft: "#fdeede",
  info: "#3b82f6",
  infoSoft: "#e3edff",
  danger: "#e05561",
  dangerSoft: "#fce4e6",
  white: "#ffffff",
};

const display = { fontFamily: "var(--font-lab-geist)" };
const bodyF = { fontFamily: "var(--font-lab-inter)" };
const mono = { fontFamily: "var(--font-lab-geist-mono)" };

// ── Refractie-filter — vaste seed feTurbulence + feDisplacementMap. Vervormt de coördinaatgrid die door
//    het glas schijnt, zodat het als een echte lens breekt. Volledig deterministisch. ─────────────
function RefractionDefs() {
  return (
    <svg width="0" height="0" aria-hidden="true" style={{ position: "absolute" }}>
      <defs>
        <filter id="refractie-lens" x="-20%" y="-20%" width="140%" height="140%">
          <feTurbulence
            type="fractalNoise"
            baseFrequency="0.012 0.02"
            numOctaves={2}
            seed={7}
            result="noise"
          />
          <feDisplacementMap
            in="SourceGraphic"
            in2="noise"
            scale={22}
            xChannelSelector="R"
            yChannelSelector="G"
          />
        </filter>
      </defs>
    </svg>
  );
}

// Gebrekte coördinaatgrid die achter het glas doorschijnt — door de lens vervormd.
function RefractedGrid() {
  const lines = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];
  return (
    <svg
      className="h-full w-full"
      viewBox="0 0 480 480"
      preserveAspectRatio="xMidYMid slice"
      aria-hidden="true"
      style={{ filter: "url(#refractie-lens)" }}
    >
      <g stroke={C.iris} strokeWidth="1" opacity="0.16" fill="none">
        {lines.map((i) => (
          <line key={`v${i}`} x1={i * 40} y1="0" x2={i * 40} y2="480" />
        ))}
        {lines.map((i) => (
          <line key={`h${i}`} x1="0" y1={i * 40} x2="480" y2={i * 40} />
        ))}
      </g>
      <circle cx="150" cy="130" r="120" fill={C.sky} opacity="0.18" />
      <circle cx="360" cy="330" r="150" fill={C.iris} opacity="0.16" />
    </svg>
  );
}

// ── Glas-kaart — translucent paneel met specular top-edge, binnen-glow en (optioneel) hover-sweep ──
function Glass({
  children,
  className = "",
  style,
  interactive = false,
  tint = "rgba(255,255,255,0.55)",
}: {
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
  interactive?: boolean;
  tint?: string;
}) {
  return (
    <div
      className={`group/glass relative overflow-hidden rounded-[22px] ${
        interactive
          ? "transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_22px_50px_-24px_rgba(79,70,229,0.5)]"
          : ""
      } ${className}`}
      style={{
        background: tint,
        backdropFilter: "blur(20px) saturate(160%)",
        WebkitBackdropFilter: "blur(20px) saturate(160%)",
        boxShadow: `inset 0 1px 0 ${C.glassLine}, inset 0 0 0 1px ${C.glassEdge}, 0 12px 34px -22px rgba(27,36,64,0.4)`,
        ...style,
      }}
    >
      {/* Specular edge-highlight — dunne lichtrand bovenlangs */}
      <span
        className="pointer-events-none absolute inset-x-4 top-0 h-px"
        style={{
          background: `linear-gradient(90deg, transparent, ${C.white}, transparent)`,
        }}
        aria-hidden="true"
      />
      {/* Specular sweep bij hover — glas dat oplicht */}
      {interactive && (
        <span
          className="pointer-events-none absolute inset-0 -translate-x-full opacity-0 transition-all duration-700 ease-out group-hover/glass:translate-x-full group-hover/glass:opacity-100"
          style={{
            background: `linear-gradient(105deg, transparent 34%, ${C.white}88 50%, transparent 66%)`,
          }}
          aria-hidden="true"
        />
      )}
      {children}
    </div>
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

function SectionHead({ title, sub, Icon }: { title: string; sub?: string; Icon: LucideIcon }) {
  return (
    <div className="flex items-center gap-3">
      <span
        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl"
        style={{
          background: "rgba(255,255,255,0.6)",
          backdropFilter: "blur(8px)",
          boxShadow: `inset 0 1px 0 ${C.glassLine}, inset 0 0 0 1px ${C.glassEdge}`,
        }}
        aria-hidden="true"
      >
        <Icon size={17} strokeWidth={2} style={{ color: C.iris }} />
      </span>
      <div className="min-w-0">
        <h2
          className="text-[19px] font-semibold leading-none tracking-[-0.02em]"
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
    </div>
  );
}

function Meta({ Icon, value }: { Icon: LucideIcon; value: string }) {
  return (
    <div className="flex items-center gap-1.5" style={{ color: C.inkSoft }}>
      <Icon size={13} strokeWidth={2} style={{ color: C.iris }} aria-hidden="true" />
      <span className="truncate" style={bodyF}>
        {value}
      </span>
    </div>
  );
}

// Match-lens — een refractieve glasbol met het percentage in het hart.
function MatchLens({ value, size = 54 }: { value: number; size?: number }) {
  const deg = (value / 100) * 360;
  return (
    <span
      className="relative flex shrink-0 items-center justify-center rounded-full"
      style={{
        width: size,
        height: size,
        background: `conic-gradient(${C.iris} 0deg, ${C.sky} ${deg}deg, rgba(255,255,255,0.35) ${deg}deg 360deg)`,
        boxShadow: `inset 0 1px 0 ${C.glassLine}`,
      }}
      aria-hidden="true"
    >
      <span
        className="absolute inset-[4px] flex flex-col items-center justify-center rounded-full"
        style={{
          background: "rgba(255,255,255,0.72)",
          backdropFilter: "blur(6px)",
          boxShadow: `inset 0 1px 0 ${C.glassLine}`,
        }}
      >
        <span
          className="text-[15px] font-semibold tabular-nums leading-none"
          style={{ ...display, color: C.ink }}
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

// Mini spark — iris-staafjes op glas.
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
            background: i === data.length - 1 ? C.iris : "rgba(99,102,241,0.22)",
          }}
        />
      ))}
    </div>
  );
}

// ── Root ─────────────────────────────────────────────────────────────────────────
export function Concept181() {
  const [screen, setScreen] = useState<ScreenKey>("dashboard");
  const active = OPDRACHTEN[0] as Opdracht;

  return (
    <div
      className="relative min-h-screen w-full overflow-x-hidden antialiased"
      style={{
        ...bodyF,
        background: `radial-gradient(120% 80% at 15% 0%, #f4f7ff 0%, ${C.bg} 45%, ${C.bgDeep} 100%)`,
        color: C.ink,
      }}
    >
      <RefractionDefs />
      {/* Gebrekte grid + kleurblobs die door al het glas schijnen */}
      <div className="pointer-events-none fixed inset-0 z-0" aria-hidden="true">
        <RefractedGrid />
      </div>

      <div className="relative z-10">
        {/* Kop — zwevend glaspaneel */}
        <header className="px-4 pt-4 md:px-8">
          <Glass
            className="mx-auto max-w-6xl"
            tint="rgba(255,255,255,0.5)"
            style={{ borderRadius: 26 }}
          >
            <div className="flex flex-wrap items-center justify-between gap-4 px-4 py-4 md:px-7">
              <div className="flex items-center gap-3.5">
                <span
                  className="relative flex h-11 w-11 items-center justify-center rounded-2xl"
                  style={{
                    background: `linear-gradient(135deg, ${C.iris}, ${C.sky})`,
                    boxShadow: `inset 0 1px 0 ${C.glassLine}, 0 6px 16px -6px ${C.irisDeep}`,
                  }}
                  aria-hidden="true"
                >
                  <Gem size={20} strokeWidth={2} style={{ color: C.white }} />
                </span>
                <div className="leading-tight">
                  <div
                    className="text-[10px] font-semibold uppercase tracking-[0.32em]"
                    style={{ ...mono, color: C.iris }}
                  >
                    Refractie
                  </div>
                  <div
                    className="text-[22px] font-semibold leading-none tracking-[-0.02em]"
                    style={{ ...display, color: C.ink }}
                  >
                    Lenskamer
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2.5">
                <span
                  className="hidden items-center gap-1.5 rounded-full px-3 py-1.5 text-[11px] font-semibold sm:inline-flex"
                  style={{
                    ...bodyF,
                    background: "rgba(255,255,255,0.55)",
                    color: C.ink,
                    boxShadow: `inset 0 0 0 1px ${C.glassEdge}`,
                  }}
                >
                  <ShieldCheck size={12} strokeWidth={2.2} style={{ color: C.iris }} />{" "}
                  {PROFIEL.trust}
                </span>
                <span
                  className="flex h-10 w-10 items-center justify-center rounded-full text-[12px] font-semibold"
                  style={{
                    ...mono,
                    background: "rgba(255,255,255,0.6)",
                    color: C.ink,
                    boxShadow: `inset 0 1px 0 ${C.glassLine}, inset 0 0 0 1px ${C.glassEdge}`,
                  }}
                  aria-hidden="true"
                >
                  {PROFIEL.initialen}
                </span>
              </div>
            </div>
            {/* Scherm-switcher — glas-pillen */}
            <nav
              className="flex items-center gap-1.5 overflow-x-auto px-4 pb-3 md:px-7"
              aria-label="Schermen"
            >
              {SCREENS.map((s) => {
                const on = s.key === screen;
                return (
                  <button
                    key={s.key}
                    onClick={() => setScreen(s.key)}
                    aria-current={on ? "page" : undefined}
                    className="relative shrink-0 rounded-full px-3.5 py-1.5 text-[12.5px] font-semibold transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
                    style={
                      on
                        ? {
                            ...bodyF,
                            background: `linear-gradient(135deg, ${C.iris}, ${C.irisDeep})`,
                            color: C.white,
                            boxShadow: `inset 0 1px 0 rgba(255,255,255,0.4), 0 6px 16px -8px ${C.irisDeep}`,
                            ["--tw-ring-color" as string]: C.iris,
                            ["--tw-ring-offset-color" as string]: C.bg,
                          }
                        : {
                            ...bodyF,
                            background: "rgba(255,255,255,0.4)",
                            color: C.inkSoft,
                            boxShadow: `inset 0 0 0 1px ${C.glassEdge}`,
                            ["--tw-ring-color" as string]: C.iris,
                            ["--tw-ring-offset-color" as string]: C.bg,
                          }
                    }
                  >
                    {s.label}
                  </button>
                );
              })}
            </nav>
          </Glass>
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

        <footer className="mx-auto max-w-6xl px-4 pb-10 md:px-8">
          <div
            className="flex items-center justify-center gap-2 pt-6 text-[11px]"
            style={{ ...mono, color: C.inkFaint }}
          >
            <Droplet size={12} aria-hidden="true" /> Gebroken door glas — diepte zonder ruis.
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
      {/* Hero — groot glaspaneel, content zweeft boven de refractie */}
      <Glass className="relative" tint="rgba(255,255,255,0.42)">
        <div className="relative max-w-xl p-6 sm:p-9">
          <span
            className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold"
            style={{
              ...bodyF,
              background: C.irisSoft,
              color: C.irisDeep,
            }}
          >
            <Sparkles size={12} strokeWidth={2.2} aria-hidden="true" /> {PROFIEL.rol}
          </span>
          <h1
            className="mt-3 text-[30px] font-semibold leading-[1.05] tracking-[-0.03em] sm:text-[40px]"
            style={{ ...display, color: C.ink }}
          >
            Drie matches boven 85%. Alles staat helder in beeld.
          </h1>
          <p
            className="mt-3 max-w-lg text-[14px] leading-relaxed"
            style={{ ...bodyF, color: C.inkSoft }}
          >
            Eén laag vraagt aandacht: je VOG verloopt binnenkort. Regel het en houd je profiel
            kristalhelder verifieerbaar.
          </p>
          <div className="mt-5 flex flex-wrap gap-3">
            <button
              onClick={onOpen}
              className="inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-[13px] font-semibold text-white transition-transform hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
              style={{
                ...bodyF,
                background: `linear-gradient(135deg, ${C.iris}, ${C.irisDeep})`,
                boxShadow: `inset 0 1px 0 rgba(255,255,255,0.4), 0 10px 24px -12px ${C.irisDeep}`,
                ["--tw-ring-color" as string]: C.iris,
                ["--tw-ring-offset-color" as string]: C.bg,
              }}
            >
              Bekijk matches <ArrowRight size={15} aria-hidden="true" />
            </button>
            <button
              onClick={onActies}
              className="inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-[13px] font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
              style={{
                ...bodyF,
                background: "rgba(255,255,255,0.6)",
                color: C.ink,
                boxShadow: `inset 0 0 0 1px ${C.glassEdge}`,
                ["--tw-ring-color" as string]: C.iris,
                ["--tw-ring-offset-color" as string]: C.bg,
              }}
            >
              <TriangleAlert size={14} strokeWidth={2.2} style={{ color: C.warn }} /> Los actie op
            </button>
          </div>
        </div>
      </Glass>

      {/* KPI-glas */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {KPIS.map((k) => (
          <Glass key={k.label} interactive className="p-4">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-medium" style={{ ...bodyF, color: C.inkFaint }}>
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
              className="mt-2 text-[26px] font-semibold leading-none tracking-[-0.02em]"
              style={{ ...display, color: C.ink }}
            >
              {k.value}
            </div>
            <div className="mt-3">
              <Spark data={k.spark} />
            </div>
          </Glass>
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
              <Glass key={o.id} interactive>
                <button
                  onClick={onOpen}
                  className="relative flex w-full items-center gap-4 p-4 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset"
                  style={{ ["--tw-ring-color" as string]: C.iris }}
                >
                  <MatchLens value={o.match} />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <div
                          className="truncate text-[15.5px] font-semibold tracking-[-0.01em]"
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
                          style={{
                            ...bodyF,
                            background: "rgba(255,255,255,0.55)",
                            color: C.inkSoft,
                            boxShadow: `inset 0 0 0 1px ${C.glassEdge}`,
                          }}
                        >
                          <Check size={11} strokeWidth={2.6} style={{ color: C.ok }} /> {r}
                        </span>
                      ))}
                    </div>
                  </div>
                </button>
              </Glass>
            ))}
          </div>
        </section>

        {/* Rechterkolom */}
        <section className="space-y-4">
          <SectionHead title="Vertrouwen" sub="Certificaat-dekking" Icon={ShieldCheck} />
          <Glass className="p-5">
            <div className="flex items-center gap-5">
              <span
                className="relative flex h-24 w-24 shrink-0 items-center justify-center rounded-full"
                style={{
                  background: `conic-gradient(${C.iris} 0deg, ${C.sky} ${dek * 3.6}deg, rgba(255,255,255,0.35) ${dek * 3.6}deg 360deg)`,
                  boxShadow: `inset 0 1px 0 ${C.glassLine}`,
                }}
                aria-hidden="true"
              >
                <span
                  className="absolute inset-[8px] flex flex-col items-center justify-center rounded-full"
                  style={{ background: "rgba(255,255,255,0.8)", backdropFilter: "blur(6px)" }}
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
          </Glass>

          {/* Prioriteit — dieper getint glas met iris-glow */}
          <Glass
            className="relative"
            tint="rgba(79,70,229,0.14)"
            style={{ boxShadow: `inset 0 1px 0 ${C.glassLine}, inset 0 0 0 1px ${C.iris}44` }}
          >
            <div className="relative p-5">
              <span
                className="inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.08em]"
                style={{ ...mono, background: C.warnSoft, color: C.warn }}
              >
                <TriangleAlert size={11} strokeWidth={2.4} aria-hidden="true" /> Prioriteit
              </span>
              <h3
                className="mt-2.5 text-[17px] font-semibold leading-tight tracking-[-0.01em]"
                style={{ ...display, color: C.ink }}
              >
                {warn.titel}
              </h3>
              <p
                className="mt-1.5 text-[12.5px] leading-relaxed"
                style={{ ...bodyF, color: C.inkSoft }}
              >
                {warn.detail}
              </p>
              <button
                onClick={onActies}
                className="mt-4 inline-flex items-center gap-2 rounded-full px-4 py-2 text-[12px] font-semibold text-white transition-transform hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
                style={{
                  ...bodyF,
                  background: `linear-gradient(135deg, ${C.iris}, ${C.irisDeep})`,
                  ["--tw-ring-color" as string]: C.iris,
                  ["--tw-ring-offset-color" as string]: C.bg,
                }}
              >
                {warn.cta} <ArrowRight size={13} aria-hidden="true" />
              </button>
            </div>
          </Glass>
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
        <SectionHead title="Marktplaats" sub="Open opdrachten" Icon={Layers} />
        <div className="flex items-center gap-2">
          <Glass className="flex items-center gap-2 rounded-full px-3.5 py-2">
            <Search size={15} style={{ color: C.iris }} aria-hidden="true" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Zoek opdracht of plaats…"
              aria-label="Opdrachten zoeken"
              className="w-40 bg-transparent text-[12.5px] outline-none placeholder:opacity-50"
              style={{ ...bodyF, color: C.ink }}
            />
          </Glass>
          <button
            onClick={refresh}
            aria-label="Opnieuw laden"
            className="flex h-10 w-10 items-center justify-center rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
            style={{
              background: "rgba(255,255,255,0.6)",
              boxShadow: `inset 0 1px 0 ${C.glassLine}, inset 0 0 0 1px ${C.glassEdge}`,
              ["--tw-ring-color" as string]: C.iris,
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
          className="flex items-start gap-3 rounded-2xl p-4"
          role="alert"
          style={{ background: C.dangerSoft, boxShadow: `inset 0 0 0 1px ${C.danger}44` }}
        >
          <XCircle size={18} strokeWidth={2.2} style={{ color: C.danger }} aria-hidden="true" />
          <div className="min-w-0 flex-1">
            <div className="text-[13px] font-semibold" style={{ ...display, color: C.danger }}>
              Sommige matches konden niet worden geladen
            </div>
            <p className="mt-0.5 text-[12px]" style={{ ...bodyF, color: C.inkSoft }}>
              Er ging iets mis bij het ophalen van de nieuwste opdrachten. Probeer opnieuw te laden.
            </p>
          </div>
          <button
            onClick={() => setError(false)}
            className="shrink-0 rounded-full px-2.5 py-1 text-[11px] font-semibold transition-colors hover:bg-white/50 focus-visible:outline-none focus-visible:ring-2"
            style={{ ...bodyF, color: C.danger, ["--tw-ring-color" as string]: C.danger }}
          >
            Sluiten
          </button>
        </div>
      )}

      {loading ? (
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
          {[0, 1, 2].map((i) => (
            <Glass key={i} className="p-4">
              <div className="flex items-center gap-3">
                <span
                  className="h-12 w-12 shrink-0 animate-pulse rounded-full"
                  style={{ background: "rgba(99,102,241,0.14)" }}
                />
                <div className="flex-1 space-y-2">
                  <span
                    className="block h-3.5 w-3/4 animate-pulse rounded"
                    style={{ background: "rgba(99,102,241,0.14)" }}
                  />
                  <span
                    className="block h-3 w-1/2 animate-pulse rounded"
                    style={{ background: "rgba(120,140,200,0.14)" }}
                  />
                </div>
              </div>
              <div className="mt-4 space-y-2">
                <span
                  className="block h-3 w-full animate-pulse rounded"
                  style={{ background: "rgba(120,140,200,0.14)" }}
                />
                <span
                  className="block h-3 w-5/6 animate-pulse rounded"
                  style={{ background: "rgba(120,140,200,0.14)" }}
                />
              </div>
            </Glass>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <Glass className="flex flex-col items-center justify-center gap-3 p-16 text-center">
          <span
            className="flex h-16 w-16 items-center justify-center rounded-full"
            style={{
              background: `linear-gradient(135deg, ${C.iris}, ${C.sky})`,
              boxShadow: `inset 0 1px 0 ${C.glassLine}`,
            }}
            aria-hidden="true"
          >
            <Gem size={26} style={{ color: C.white }} />
          </span>
          <p className="text-[19px] font-semibold" style={{ ...display, color: C.ink }}>
            Geen match gevonden
          </p>
          <p className="max-w-xs text-[13px]" style={{ ...bodyF, color: C.inkSoft }}>
            Niets gevonden voor &ldquo;{q}&rdquo;. Pas je zoekterm aan om het beeld opnieuw te
            scherpstellen.
          </p>
          <button
            onClick={() => setQ("")}
            className="mt-1 rounded-full px-4 py-2 text-[12px] font-semibold text-white transition-transform hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
            style={{
              ...bodyF,
              background: `linear-gradient(135deg, ${C.iris}, ${C.irisDeep})`,
              ["--tw-ring-color" as string]: C.iris,
              ["--tw-ring-offset-color" as string]: C.bg,
            }}
          >
            Zoekterm wissen
          </button>
        </Glass>
      ) : (
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
          {filtered.map((o) => (
            <Glass key={o.id} interactive className="flex flex-col">
              <div
                className="h-1 w-full"
                style={{ background: `linear-gradient(90deg, ${C.iris}, ${C.sky})` }}
                aria-hidden="true"
              />
              <div className="relative flex items-center gap-3 p-4">
                <MatchLens value={o.match} size={48} />
                <div className="min-w-0">
                  <h3
                    className="text-[15px] font-semibold leading-tight tracking-[-0.01em]"
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
                      className="rounded-full px-2 py-0.5 text-[10.5px] font-medium"
                      style={{
                        ...bodyF,
                        background: "rgba(255,255,255,0.5)",
                        color: C.inkSoft,
                        boxShadow: `inset 0 0 0 1px ${C.glassEdge}`,
                      }}
                    >
                      {t}
                    </span>
                  ))}
                </div>
              </div>
              <button
                onClick={onOpen}
                className="relative mt-auto flex items-center justify-center gap-2 py-3 text-[12.5px] font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset"
                style={{
                  ...bodyF,
                  borderTop: `1px solid ${C.glassEdge}`,
                  color: C.iris,
                  ["--tw-ring-color" as string]: C.iris,
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
        className="inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-[12px] font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
        style={{
          ...bodyF,
          background: "rgba(255,255,255,0.6)",
          color: C.ink,
          boxShadow: `inset 0 0 0 1px ${C.glassEdge}`,
          ["--tw-ring-color" as string]: C.iris,
          ["--tw-ring-offset-color" as string]: C.bg,
        }}
      >
        <ArrowLeft size={14} aria-hidden="true" /> Terug naar marktplaats
      </button>

      <Glass className="relative" tint="rgba(255,255,255,0.42)">
        <div className="relative flex flex-wrap items-center justify-between gap-5 p-6 sm:p-8">
          <div className="min-w-0">
            <span
              className="inline-block rounded-full px-2.5 py-1 text-[11px] font-semibold"
              style={{ ...mono, background: C.irisSoft, color: C.irisDeep }}
            >
              {opdracht.id}
            </span>
            <h1
              className="mt-3 max-w-2xl text-[26px] font-semibold leading-[1.08] tracking-[-0.02em] sm:text-[34px]"
              style={{ ...display, color: C.ink }}
            >
              {opdracht.titel}
            </h1>
            <p className="mt-2 text-[13.5px]" style={{ ...bodyF, color: C.inkSoft }}>
              {opdracht.opdrachtgever} · {opdracht.plaats}
            </p>
          </div>
          <MatchLens value={opdracht.match} size={82} />
        </div>
      </Glass>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {feiten.map((f) => (
          <Glass key={f.l} interactive className="p-4">
            <span
              className="flex h-8 w-8 items-center justify-center rounded-lg"
              style={{ background: C.irisSoft }}
              aria-hidden="true"
            >
              <f.Icon size={15} strokeWidth={2} style={{ color: C.iris }} />
            </span>
            <div
              className="mt-3 text-[16px] font-semibold leading-none"
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
          </Glass>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
        <section className="space-y-3">
          <SectionHead title="Waarom dit past" Icon={Check} />
          <Glass className="p-5">
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
          </Glass>
        </section>
        <section className="space-y-3">
          <SectionHead title="Om te overwegen" Icon={TriangleAlert} />
          <Glass className="p-5">
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
          </Glass>
        </section>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row">
        <button
          className="flex flex-1 items-center justify-center gap-2 rounded-full px-6 py-3.5 text-[13px] font-semibold text-white transition-transform hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
          style={{
            ...bodyF,
            background: `linear-gradient(135deg, ${C.iris}, ${C.irisDeep})`,
            boxShadow: `inset 0 1px 0 rgba(255,255,255,0.4), 0 12px 28px -14px ${C.irisDeep}`,
            ["--tw-ring-color" as string]: C.iris,
            ["--tw-ring-offset-color" as string]: C.bg,
          }}
        >
          Reageer op deze opdracht <ArrowRight size={16} aria-hidden="true" />
        </button>
        <button
          className="flex items-center justify-center gap-2 rounded-full px-6 py-3.5 text-[13px] font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
          style={{
            ...bodyF,
            background: "rgba(255,255,255,0.6)",
            color: C.ink,
            boxShadow: `inset 0 0 0 1px ${C.glassEdge}`,
            ["--tw-ring-color" as string]: C.iris,
            ["--tw-ring-offset-color" as string]: C.bg,
          }}
        >
          <Bookmark size={15} strokeWidth={2} style={{ color: C.iris }} /> Bewaar
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
          className="inline-flex items-center gap-2 rounded-full px-4 py-2 text-[12px] font-semibold text-white transition-transform hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
          style={{
            ...bodyF,
            background: `linear-gradient(135deg, ${C.iris}, ${C.irisDeep})`,
            ["--tw-ring-color" as string]: C.iris,
            ["--tw-ring-offset-color" as string]: C.bg,
          }}
        >
          <Plus size={14} aria-hidden="true" /> Toevoegen
        </button>
      </div>

      <Glass className="relative" tint="rgba(255,255,255,0.42)">
        <div className="relative flex flex-wrap items-center gap-6 p-6">
          <span
            className="relative flex h-28 w-28 shrink-0 items-center justify-center rounded-full"
            style={{
              background: `conic-gradient(${C.iris} 0deg, ${C.sky} ${dek * 3.6}deg, rgba(255,255,255,0.35) ${dek * 3.6}deg 360deg)`,
              boxShadow: `inset 0 1px 0 ${C.glassLine}`,
            }}
            aria-hidden="true"
          >
            <span
              className="absolute inset-[9px] flex flex-col items-center justify-center rounded-full"
              style={{ background: "rgba(255,255,255,0.82)", backdropFilter: "blur(6px)" }}
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
            <div className="text-[16px] font-semibold" style={{ ...display, color: C.ink }}>
              {verified}/{CREDENTIALS.length} geverifieerd
            </div>
            <p className="mt-1 text-[13px] leading-relaxed" style={{ ...bodyF, color: C.inkSoft }}>
              Elke geverifieerde laag maakt je profiel helderder. Houd je dekking hoog, dan blijft
              je vertrouwen kristalhelder voor opdrachtgevers.
            </p>
            <span
              className="mt-3 inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[11px] font-semibold"
              style={{ ...bodyF, background: C.okSoft, color: C.ok }}
            >
              <ShieldCheck size={12} strokeWidth={2} aria-hidden="true" /> {PROFIEL.trust}
            </span>
          </div>
        </div>
      </Glass>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {CREDENTIALS.map((c) => {
          const m = credMeta(c.status);
          const actionable = c.status !== "VERIFIED";
          return (
            <Glass key={c.naam} interactive className="flex items-center gap-3.5 p-4">
              <span
                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl"
                style={{ background: m.bg }}
                aria-hidden="true"
              >
                <m.Icon size={20} strokeWidth={2.2} style={{ color: m.fg }} />
              </span>
              <div className="min-w-0 flex-1">
                <div
                  className="truncate text-[14.5px] font-semibold tracking-[-0.01em]"
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
                      className="rounded-full px-2.5 py-1 text-[11px] font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-1"
                      style={{
                        ...bodyF,
                        background: "rgba(255,255,255,0.6)",
                        color: C.ink,
                        boxShadow: `inset 0 0 0 1px ${C.glassEdge}`,
                        ["--tw-ring-color" as string]: C.iris,
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
            </Glass>
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
        Icon={Zap}
      />

      <ol className="space-y-4">
        {sorted.map((a, i) => {
          const warn = a.urgentie === "warning";
          return (
            <li key={a.titel}>
              <Glass interactive className="flex items-stretch">
                <span
                  className="w-1.5 shrink-0"
                  style={{
                    background: warn
                      ? `linear-gradient(${C.warn}, ${C.danger})`
                      : `linear-gradient(${C.iris}, ${C.sky})`,
                  }}
                  aria-hidden="true"
                />
                <div className="flex min-w-0 flex-1 items-center gap-4 p-5">
                  <span
                    className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-[16px] font-semibold tabular-nums"
                    style={{
                      ...display,
                      background: warn ? C.warnSoft : C.irisSoft,
                      color: warn ? C.warn : C.irisDeep,
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
                          <Sparkles size={10} strokeWidth={2.4} aria-hidden="true" />
                        )}
                        {warn ? "Urgent" : "Kans"}
                      </span>
                      <h3
                        className="text-[15.5px] font-semibold tracking-[-0.01em]"
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
                      className="mt-3 inline-flex items-center gap-2 rounded-full px-4 py-2 text-[12px] font-semibold text-white transition-transform hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
                      style={
                        warn
                          ? {
                              ...bodyF,
                              background: C.warn,
                              ["--tw-ring-color" as string]: C.warn,
                              ["--tw-ring-offset-color" as string]: C.bg,
                            }
                          : {
                              ...bodyF,
                              background: `linear-gradient(135deg, ${C.iris}, ${C.irisDeep})`,
                              ["--tw-ring-color" as string]: C.iris,
                              ["--tw-ring-offset-color" as string]: C.bg,
                            }
                      }
                    >
                      {a.cta} <ArrowRight size={13} aria-hidden="true" />
                    </button>
                  </div>
                </div>
              </Glass>
            </li>
          );
        })}
      </ol>

      <section className="space-y-3">
        <SectionHead title="Berichten" sub="Recente gesprekken" Icon={FileText} />
        <Glass>
          {BERICHTEN.map((b, i) => (
            <div
              key={b.van}
              className="flex items-center gap-3 p-4"
              style={i === 0 ? undefined : { borderTop: `1px solid ${C.glassEdge}` }}
            >
              <span
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-[11px] font-semibold"
                style={{
                  ...mono,
                  background: "rgba(255,255,255,0.6)",
                  color: C.ink,
                  boxShadow: `inset 0 0 0 1px ${C.glassEdge}`,
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
                      style={{ background: C.iris }}
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
        </Glass>
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
          className="inline-flex items-center gap-2 rounded-full px-4 py-2 text-[12px] font-semibold text-white transition-transform hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
          style={{
            ...bodyF,
            background: `linear-gradient(135deg, ${C.iris}, ${C.irisDeep})`,
            ["--tw-ring-color" as string]: C.iris,
            ["--tw-ring-offset-color" as string]: C.bg,
          }}
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
          <Glass key={s.l} interactive className="p-4">
            <div
              className="h-1 w-10 rounded-full"
              style={{ background: `linear-gradient(90deg, ${C.iris}, ${C.sky})` }}
              aria-hidden="true"
            />
            <div className="mt-3 text-[11px] font-medium" style={{ ...bodyF, color: C.inkFaint }}>
              {s.l}
            </div>
            <div
              className="mt-1 text-[26px] font-semibold leading-none tracking-[-0.02em]"
              style={{ ...display, color: C.ink }}
            >
              {s.v}
            </div>
          </Glass>
        ))}
      </div>

      <Glass>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[520px] text-left">
            <thead>
              <tr style={{ background: "rgba(255,255,255,0.4)" }}>
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
                    className="transition-colors hover:bg-white/40"
                    style={i === 0 ? undefined : { borderTop: `1px solid ${C.glassEdge}` }}
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
              <tr style={{ background: `linear-gradient(90deg, ${C.iris}22, ${C.sky}22)` }}>
                <td
                  colSpan={4}
                  className="px-4 py-3 text-[11px] font-medium uppercase tracking-[0.1em]"
                  style={{ ...mono, color: C.inkSoft }}
                >
                  Totaal betaald
                </td>
                <td
                  className="px-4 py-3 text-right text-[17px] font-semibold tabular-nums"
                  style={{ ...display, color: C.irisDeep }}
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
