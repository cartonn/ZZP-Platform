"use client";

// Concept 511 — "Spatiaal" · Spatial-depth, visionOS-geïnspireerd. Gelaagde frosted-glass panelen
// die in de ruimte lijken te zweven boven een donkere ruimtelijke achtergrond met diffuse
// radial-glow. Diepte is informatie-hiërarchie: wat actie vraagt komt naar voren (grotere z-laag,
// sterkere rim-light, diepere slagschaduw). Eén koele accent (#6ea8ff). Rustig, premium, ruimtelijk.
// Status altijd met label + icoon — nooit enkel kleur.

import { useMemo, useState, type CSSProperties, type ReactNode } from "react";
import {
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  ArrowUpRight,
  Briefcase,
  Check,
  ChevronRight,
  Clock,
  Compass,
  FileText,
  Layers,
  ListChecks,
  MapPin,
  Plus,
  RotateCcw,
  Search,
  ShieldCheck,
  Sparkles,
  X,
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

// ————————————————————————————— Palet — ruimtelijk donker + koel accent —————————————————————————————
const C = {
  accent: "#6ea8ff",
  accentDeep: "#3d7ff0",
  accentGlow: "rgba(110,168,255,0.35)",
  accentSoft: "rgba(110,168,255,0.14)",

  text: "#eef2fb",
  textSoft: "rgba(238,242,251,0.74)",
  textMute: "rgba(238,242,251,0.5)",
  textFaint: "rgba(238,242,251,0.34)",

  glass: "rgba(255,255,255,0.055)",
  glassRaise: "rgba(255,255,255,0.085)",
  glassSink: "rgba(8,12,24,0.4)",
  border: "rgba(255,255,255,0.12)",
  borderSoft: "rgba(255,255,255,0.07)",
  rim: "rgba(255,255,255,0.28)",

  pos: "#5fd6a0",
  posSoft: "rgba(95,214,160,0.16)",
  info: "#78c6ff",
  infoSoft: "rgba(120,198,255,0.16)",
  warn: "#f5c26b",
  warnSoft: "rgba(245,194,107,0.16)",
  neg: "#ff8a9c",
  negSoft: "rgba(255,138,156,0.16)",
};

const sans: CSSProperties = {
  fontFamily:
    "'Inter', 'SF Pro Text', -apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif",
};
const RING =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#6ea8ff] focus-visible:ring-offset-2 focus-visible:ring-offset-[#070a14]";

// Rim-light + slagschaduw per diepte-laag. Hoe hoger, hoe meer het paneel "naar voren" komt.
function depth(level: 0 | 1 | 2): CSSProperties {
  const shadow =
    level === 2
      ? "0 32px 80px -24px rgba(0,0,0,0.72), 0 8px 24px -12px rgba(0,0,0,0.5)"
      : level === 1
        ? "0 20px 48px -20px rgba(0,0,0,0.6)"
        : "0 12px 32px -20px rgba(0,0,0,0.5)";
  return {
    background: level === 2 ? C.glassRaise : C.glass,
    backdropFilter: "blur(22px) saturate(1.4)",
    WebkitBackdropFilter: "blur(22px) saturate(1.4)",
    border: `1px solid ${level === 2 ? C.rim : C.border}`,
    boxShadow: `${shadow}, inset 0 1px 0 ${C.rim}`,
  };
}

// ————————————————————————————— Status-taal (label + icoon) —————————————————————————————
type Tone = { base: string; soft: string; label: string; Icon: LucideIcon; alarm: boolean };

function credTone(s: CredStatus): Tone {
  switch (s) {
    case "VERIFIED":
      return {
        base: C.pos,
        soft: C.posSoft,
        label: "Geverifieerd",
        Icon: ShieldCheck,
        alarm: false,
      };
    case "SUBMITTED":
      return { base: C.info, soft: C.infoSoft, label: "In beoordeling", Icon: Clock, alarm: false };
    case "EXPIRING":
      return {
        base: C.warn,
        soft: C.warnSoft,
        label: "Verloopt bijna",
        Icon: AlertTriangle,
        alarm: true,
      };
    case "REJECTED":
      return { base: C.neg, soft: C.negSoft, label: "Afgewezen", Icon: X, alarm: true };
  }
}

function factuurTone(status: string): {
  base: string;
  soft: string;
  label: string;
  Icon: LucideIcon;
} {
  if (status === "Betaald") return { base: C.pos, soft: C.posSoft, label: "Betaald", Icon: Check };
  if (status === "Openstaand")
    return { base: C.warn, soft: C.warnSoft, label: "Openstaand", Icon: Clock };
  if (status === "Concept")
    return { base: C.info, soft: C.infoSoft, label: "Concept", Icon: FileText };
  return { base: C.neg, soft: C.negSoft, label: status, Icon: AlertTriangle };
}

function parseEUR(s: string): number {
  const d = s.replace(/[^\d]/g, "");
  return d ? parseInt(d, 10) : 0;
}
const eur0 = new Intl.NumberFormat("nl-NL", {
  style: "currency",
  currency: "EUR",
  maximumFractionDigits: 0,
});

// ————————————————————————————— Primitives —————————————————————————————
function Glass({
  children,
  level = 0,
  className = "",
  as: Tag = "div",
}: {
  children: ReactNode;
  level?: 0 | 1 | 2;
  className?: string;
  as?: "div" | "section" | "article" | "aside" | "li";
}) {
  return (
    <Tag className={`rounded-[20px] ${className}`} style={depth(level)}>
      {children}
    </Tag>
  );
}

function Btn({
  children,
  onClick,
  variant = "solid",
  size = "md",
  className = "",
  ariaLabel,
  ariaExpanded,
  full = false,
}: {
  children: ReactNode;
  onClick?: () => void;
  variant?: "solid" | "glass" | "ghost";
  size?: "sm" | "md";
  className?: string;
  ariaLabel?: string;
  ariaExpanded?: boolean;
  full?: boolean;
}) {
  const pad = size === "sm" ? "px-3.5 py-2 text-[12.5px]" : "px-5 py-2.5 text-[13.5px]";
  const base = `inline-flex items-center justify-center gap-2 rounded-full font-semibold tracking-[-0.01em] transition-all duration-200 ${RING} ${
    full ? "w-full" : ""
  }`;
  const style: CSSProperties =
    variant === "solid"
      ? {
          background: `linear-gradient(180deg, ${C.accent}, ${C.accentDeep})`,
          color: "#07142e",
          border: `1px solid ${C.rim}`,
          boxShadow: `0 8px 24px -8px ${C.accentGlow}, inset 0 1px 0 rgba(255,255,255,0.4)`,
          ...sans,
        }
      : variant === "glass"
        ? { background: C.glassRaise, color: C.text, border: `1px solid ${C.border}`, ...sans }
        : {
            background: "transparent",
            color: C.textSoft,
            border: "1px solid transparent",
            ...sans,
          };
  const hover =
    variant === "solid"
      ? "hover:brightness-110"
      : variant === "glass"
        ? "hover:bg-white/15"
        : "hover:bg-white/8";
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={ariaLabel}
      aria-expanded={ariaExpanded}
      className={`${base} ${pad} ${hover} ${className}`}
      style={style}
    >
      {children}
    </button>
  );
}

function StatusTag({ base, soft, label, Icon, alarm }: Tone) {
  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold"
      style={{ color: base, background: soft, border: `1px solid ${base}44`, ...sans }}
    >
      <Icon size={12} aria-hidden="true" />
      {label}
      {alarm && <span className="sr-only"> (let op)</span>}
    </span>
  );
}

// Match als zwevende ring — de kern-differentiatie visueel
function MatchRing({ value, tone, size = 52 }: { value: number; tone: string; size?: number }) {
  const r = (size - 6) / 2;
  const circ = 2 * Math.PI * r;
  return (
    <span
      className="relative inline-flex shrink-0 items-center justify-center"
      style={{ width: size, height: size }}
      aria-label={`Match ${value} procent`}
    >
      <svg width={size} height={size} className="-rotate-90" aria-hidden="true">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke="rgba(255,255,255,0.1)"
          strokeWidth={5}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={tone}
          strokeWidth={5}
          strokeLinecap="round"
          strokeDasharray={circ}
          strokeDashoffset={circ - (value / 100) * circ}
          style={{
            filter: `drop-shadow(0 0 6px ${tone}88)`,
            transition: "stroke-dashoffset 0.8s cubic-bezier(0.22,1,0.36,1)",
          }}
        />
      </svg>
      <span className="absolute text-[13px] font-bold" style={{ color: C.text }}>
        {value}
      </span>
    </span>
  );
}

function Kicker({
  children,
  tone = C.textMute,
  Icon,
}: {
  children: ReactNode;
  tone?: string;
  Icon?: LucideIcon;
}) {
  return (
    <span
      className="inline-flex items-center gap-1.5 text-[10.5px] font-semibold uppercase tracking-[0.2em]"
      style={{ color: tone }}
    >
      {Icon && <Icon size={12} aria-hidden="true" />}
      {children}
    </span>
  );
}

function ScreenHead({
  code,
  title,
  sub,
  right,
}: {
  code: string;
  title: string;
  sub?: string;
  right?: ReactNode;
}) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
      <div className="min-w-0">
        <Kicker tone={C.accent}>{code}</Kicker>
        <h1
          className="mt-2 text-[26px] font-semibold leading-tight tracking-[-0.025em] md:text-[30px]"
          style={{ color: C.text }}
        >
          {title}
        </h1>
        {sub && (
          <p
            className="mt-1.5 max-w-xl text-[13.5px] leading-relaxed"
            style={{ color: C.textMute }}
          >
            {sub}
          </p>
        )}
      </div>
      {right}
    </div>
  );
}

const NAV_ICON: Record<ScreenKey, LucideIcon> = {
  dashboard: Compass,
  marktplaats: Search,
  opdracht: Briefcase,
  verificatie: ShieldCheck,
  acties: ListChecks,
  facturen: FileText,
  documenten: FileText,
  berichten: FileText,
};

// —————————————————————————————————————— Root ——————————————————————————————————————
export function Concept511() {
  const [screen, setScreen] = useState<ScreenKey>("dashboard");
  const [selId, setSelId] = useState<string>(OPDRACHTEN[0]?.id ?? "");
  const active = OPDRACHTEN.find((o) => o.id === selId) ?? (OPDRACHTEN[0] as Opdracht);

  const openOpdracht = (id: string) => {
    setSelId(id);
    setScreen("opdracht");
  };

  return (
    <div
      className="relative min-h-[760px] w-full overflow-hidden antialiased"
      style={{ ...sans, color: C.text, background: "#070a14" }}
    >
      {/* Ruimtelijke achtergrond — diffuse radial-glows op de diepste laag */}
      <div className="pointer-events-none absolute inset-0" aria-hidden="true">
        <div
          className="absolute -left-40 -top-40 h-[520px] w-[520px] rounded-full"
          style={{
            background: "radial-gradient(circle, rgba(110,168,255,0.22), transparent 68%)",
            filter: "blur(20px)",
          }}
        />
        <div
          className="absolute -bottom-52 right-0 h-[560px] w-[560px] rounded-full"
          style={{
            background: "radial-gradient(circle, rgba(120,90,220,0.16), transparent 66%)",
            filter: "blur(20px)",
          }}
        />
        <div
          className="absolute right-1/3 top-1/4 h-[300px] w-[300px] rounded-full"
          style={{
            background: "radial-gradient(circle, rgba(95,214,160,0.08), transparent 70%)",
            filter: "blur(20px)",
          }}
        />
      </div>

      <div className="relative mx-auto flex max-w-6xl gap-4 p-3 sm:p-4 md:p-6">
        <SpatialRail screen={screen} setScreen={setScreen} />
        <div className="min-w-0 flex-1">
          <TopBar />
          <MobileNav screen={screen} setScreen={setScreen} />
          <main key={screen} className="sp-fade mt-4">
            {screen === "dashboard" && (
              <Dashboard
                onOpen={openOpdracht}
                onMarkt={() => setScreen("marktplaats")}
                onActies={() => setScreen("acties")}
              />
            )}
            {screen === "marktplaats" && <Marktplaats onOpen={openOpdracht} selId={selId} />}
            {screen === "opdracht" && (
              <OpdrachtDetail opdracht={active} onBack={() => setScreen("marktplaats")} />
            )}
            {screen === "verificatie" && <Verificatie />}
            {screen === "acties" && (
              <Acties
                onMarkt={() => setScreen("marktplaats")}
                onFacturen={() => setScreen("facturen")}
              />
            )}
            {screen === "facturen" && <Facturen />}
          </main>
        </div>
      </div>

      <style>{`
        @keyframes spFade { from { opacity: 0; transform: translateY(10px) scale(0.995); } to { opacity: 1; transform: none; } }
        .sp-fade { animation: spFade 0.4s cubic-bezier(0.22,1,0.36,1) both; }
        .sp-float { transition: transform 0.35s cubic-bezier(0.22,1,0.36,1), box-shadow 0.35s ease; }
        .sp-float:hover { transform: translateY(-3px); }
        @media (prefers-reduced-motion: reduce) {
          .sp-fade, .sp-float { animation: none !important; transition: none !important; transform: none !important; }
        }
      `}</style>
    </div>
  );
}

// —————————————————————————————————————— Zwevende zij-rail ——————————————————————————————————————
function SpatialRail({
  screen,
  setScreen,
}: {
  screen: ScreenKey;
  setScreen: (s: ScreenKey) => void;
}) {
  return (
    <Glass
      level={1}
      as="aside"
      className="sticky top-6 hidden h-[calc(100vh-3rem)] max-h-[720px] w-[228px] shrink-0 flex-col p-3 md:flex"
    >
      <div className="flex items-center gap-2.5 px-2 py-3">
        <span
          className="flex h-9 w-9 items-center justify-center rounded-[12px]"
          style={{
            background: `linear-gradient(180deg, ${C.accent}, ${C.accentDeep})`,
            boxShadow: `0 6px 18px -6px ${C.accentGlow}`,
          }}
          aria-hidden="true"
        >
          <Layers size={17} style={{ color: "#07142e" }} />
        </span>
        <span>
          <span
            className="block text-[14px] font-bold leading-none tracking-[-0.01em]"
            style={{ color: C.text }}
          >
            Spatiaal
          </span>
          <span
            className="mt-1 block text-[10px] uppercase tracking-[0.18em]"
            style={{ color: C.textFaint }}
          >
            werkruimte
          </span>
        </span>
      </div>

      <nav aria-label="Hoofdnavigatie" className="mt-2 flex-1 space-y-1">
        {SCREENS.map((s) => {
          const on = s.key === screen;
          const Icon = NAV_ICON[s.key];
          return (
            <button
              key={s.key}
              type="button"
              onClick={() => setScreen(s.key)}
              aria-current={on ? "page" : undefined}
              className={`group flex w-full items-center gap-3 rounded-[13px] px-3 py-2.5 text-left text-[13.5px] font-medium transition-all ${RING}`}
              style={
                on
                  ? {
                      background: C.accentSoft,
                      color: C.text,
                      border: `1px solid ${C.accent}55`,
                      boxShadow: `inset 0 1px 0 ${C.rim}`,
                    }
                  : { color: C.textSoft, border: "1px solid transparent" }
              }
            >
              <Icon size={16} aria-hidden="true" style={{ color: on ? C.accent : C.textMute }} />
              <span className="flex-1">{s.label}</span>
              {on && (
                <span
                  className="h-1.5 w-1.5 rounded-full"
                  style={{ background: C.accent, boxShadow: `0 0 8px ${C.accent}` }}
                  aria-hidden="true"
                />
              )}
            </button>
          );
        })}
      </nav>

      <div
        className="mt-2 flex items-center gap-2.5 rounded-[13px] p-2.5"
        style={{ background: C.glassSink, border: `1px solid ${C.borderSoft}` }}
      >
        <span
          className="flex h-9 w-9 items-center justify-center rounded-full text-[12px] font-bold"
          style={{ background: C.accentSoft, color: C.accent, border: `1px solid ${C.accent}44` }}
          aria-hidden="true"
        >
          {PROFIEL.initialen}
        </span>
        <span className="min-w-0 flex-1">
          <span className="block truncate text-[12.5px] font-semibold" style={{ color: C.text }}>
            {PROFIEL.naam}
          </span>
          <span className="flex items-center gap-1 text-[10.5px]" style={{ color: C.pos }}>
            <ShieldCheck size={11} aria-hidden="true" /> {PROFIEL.trust}
          </span>
        </span>
      </div>
    </Glass>
  );
}

function TopBar() {
  return (
    <Glass level={0} className="flex items-center gap-3 px-3 py-2.5">
      <div
        className="flex flex-1 items-center gap-2 rounded-full px-3.5 py-2"
        style={{ background: C.glassSink, border: `1px solid ${C.borderSoft}` }}
      >
        <Search size={15} aria-hidden="true" style={{ color: C.textFaint }} />
        <span className="text-[12.5px]" style={{ color: C.textFaint }}>
          Zoek opdrachten, certificaten, facturen…
        </span>
        <span
          className="ml-auto hidden rounded-md px-1.5 py-0.5 text-[10px] font-semibold sm:inline"
          style={{ background: C.glass, color: C.textMute, border: `1px solid ${C.border}` }}
        >
          ⌘K
        </span>
      </div>
      <button
        type="button"
        aria-label="Meldingen"
        className={`relative flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${RING}`}
        style={{ background: C.glass, border: `1px solid ${C.border}`, color: C.textSoft }}
      >
        <Sparkles size={15} aria-hidden="true" />
        <span
          className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full"
          style={{ background: C.warn, boxShadow: `0 0 6px ${C.warn}` }}
          aria-hidden="true"
        />
      </button>
    </Glass>
  );
}

function MobileNav({
  screen,
  setScreen,
}: {
  screen: ScreenKey;
  setScreen: (s: ScreenKey) => void;
}) {
  return (
    <nav aria-label="Schermen" className="mt-3 flex gap-2 overflow-x-auto pb-1 md:hidden">
      {SCREENS.map((s) => {
        const on = s.key === screen;
        return (
          <button
            key={s.key}
            type="button"
            onClick={() => setScreen(s.key)}
            aria-current={on ? "page" : undefined}
            className={`shrink-0 rounded-full px-3.5 py-1.5 text-[12.5px] font-semibold transition-colors ${RING}`}
            style={
              on
                ? { background: C.accentSoft, color: C.text, border: `1px solid ${C.accent}55` }
                : { color: C.textSoft, background: C.glass, border: `1px solid ${C.border}` }
            }
          >
            {s.label}
          </button>
        );
      })}
    </nav>
  );
}

// —————————————————————————————————————— Dashboard ——————————————————————————————————————
function Dashboard({
  onOpen,
  onMarkt,
  onActies,
}: {
  onOpen: (id: string) => void;
  onMarkt: () => void;
  onActies: () => void;
}) {
  const primair = ACTIES[0] as (typeof ACTIES)[number];
  const verified = CREDENTIALS.filter((c) => c.status === "VERIFIED").length;
  const ratio = Math.round((verified / CREDENTIALS.length) * 100);
  return (
    <div className="space-y-4">
      <ScreenHead
        code="Overzicht"
        title={`Goedemorgen, ${PROFIEL.naam.split(" ")[0]}.`}
        sub="Wat aandacht vraagt komt naar voren. De rest houdt afstand."
        right={
          <Btn variant="solid" size="sm" onClick={onActies}>
            Volgende actie <ArrowRight size={14} aria-hidden="true" />
          </Btn>
        }
      />

      {/* Urgente actie zweeft op de hoogste laag — diepte = prioriteit */}
      <Glass level={2} as="article" className="sp-float relative overflow-hidden p-5">
        <div
          className="absolute -right-16 -top-16 h-56 w-56 rounded-full"
          style={{ background: `radial-gradient(circle, ${C.warnSoft}, transparent 70%)` }}
          aria-hidden="true"
        />
        <div className="relative flex flex-wrap items-center gap-4">
          <span
            className="flex h-12 w-12 shrink-0 items-center justify-center rounded-[15px]"
            style={{ background: C.warnSoft, border: `1px solid ${C.warn}44`, color: C.warn }}
            aria-hidden="true"
          >
            <AlertTriangle size={22} />
          </span>
          <div className="min-w-0 flex-1">
            <Kicker tone={C.warn} Icon={Clock}>
              Vraagt nu je aandacht
            </Kicker>
            <h2 className="mt-1.5 text-[17px] font-semibold leading-snug" style={{ color: C.text }}>
              {primair.titel}
            </h2>
            <p className="mt-1 max-w-lg text-[13px] leading-relaxed" style={{ color: C.textSoft }}>
              {primair.detail}
            </p>
          </div>
          <Btn variant="solid" size="sm" onClick={onActies}>
            {primair.cta} <ArrowRight size={13} aria-hidden="true" />
          </Btn>
        </div>
      </Glass>

      {/* KPI-tegels — middenlaag */}
      <section className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {KPIS.map((k) => {
          const tone = k.up ? C.pos : C.warn;
          return (
            <Glass key={k.label} level={1} className="sp-float p-4">
              <p className="text-[11px] font-medium" style={{ color: C.textMute }}>
                {k.label}
              </p>
              <p
                className="mt-2 text-[27px] font-bold leading-none tracking-[-0.02em]"
                style={{ color: C.text }}
              >
                {k.value}
              </p>
              <div className="mt-3 flex items-center justify-between">
                <span
                  className="inline-flex items-center gap-1 text-[11.5px] font-semibold"
                  style={{ color: tone }}
                >
                  <ArrowUpRight
                    size={13}
                    aria-hidden="true"
                    style={{ transform: k.up ? "none" : "rotate(90deg)" }}
                  />
                  {k.trend}
                </span>
                <Spark data={k.spark} tone={C.accent} />
              </div>
            </Glass>
          );
        })}
      </section>

      <section className="grid grid-cols-1 gap-4 lg:grid-cols-[1.55fr_1fr]">
        {/* Aanbevolen opdrachten */}
        <Glass level={1} className="overflow-hidden">
          <div
            className="flex items-center justify-between px-5 py-4"
            style={{ borderBottom: `1px solid ${C.borderSoft}` }}
          >
            <Kicker tone={C.accent} Icon={Briefcase}>
              Aanbevolen matches
            </Kicker>
            <button
              type="button"
              onClick={onMarkt}
              className={`rounded-md text-[12px] font-semibold ${RING}`}
              style={{ color: C.accent }}
            >
              Volledige markt →
            </button>
          </div>
          <ul className="p-2">
            {OPDRACHTEN.map((o) => {
              const strong = o.match >= 90;
              const tone = strong ? C.pos : C.accent;
              return (
                <li key={o.id}>
                  <button
                    type="button"
                    onClick={() => onOpen(o.id)}
                    className={`hover:bg-white/6 flex w-full items-center gap-3.5 rounded-[15px] px-3 py-3 text-left transition-colors ${RING}`}
                  >
                    <MatchRing value={o.match} tone={tone} />
                    <span className="min-w-0 flex-1">
                      <span
                        className="block truncate text-[14px] font-semibold"
                        style={{ color: C.text }}
                      >
                        {o.titel}
                      </span>
                      <span
                        className="mt-0.5 flex items-center gap-1 truncate text-[12px]"
                        style={{ color: C.textMute }}
                      >
                        <MapPin size={11} aria-hidden="true" /> {o.opdrachtgever} · {o.plaats}
                      </span>
                    </span>
                    <span className="hidden shrink-0 text-right sm:block">
                      <span className="block text-[13.5px] font-bold" style={{ color: C.text }}>
                        {o.tarief.replace(" / uur", "")}
                      </span>
                      <span className="text-[10px]" style={{ color: C.textFaint }}>
                        per uur
                      </span>
                    </span>
                    <ChevronRight size={17} aria-hidden="true" style={{ color: C.textFaint }} />
                  </button>
                </li>
              );
            })}
          </ul>
        </Glass>

        {/* Vertrouwenssaldo */}
        <Glass level={1} className="p-5">
          <Kicker tone={C.pos} Icon={ShieldCheck}>
            Vertrouwenssaldo
          </Kicker>
          <div className="mt-3 flex items-baseline gap-2">
            <span
              className="text-[38px] font-bold leading-none tracking-[-0.02em]"
              style={{ color: C.text }}
            >
              {ratio}%
            </span>
            <span className="text-[12px]" style={{ color: C.textMute }}>
              dossier op orde
            </span>
          </div>
          <div className="mt-4 space-y-2.5">
            {CREDENTIALS.map((c) => {
              const t = credTone(c.status);
              return (
                <div key={c.naam} className="flex items-center gap-2.5">
                  <span
                    className="flex h-7 w-7 shrink-0 items-center justify-center rounded-[9px]"
                    style={{ background: t.soft, color: t.base }}
                    aria-hidden="true"
                  >
                    <t.Icon size={13} />
                  </span>
                  <span
                    className="min-w-0 flex-1 truncate text-[12.5px]"
                    style={{ color: C.textSoft }}
                  >
                    {c.naam}
                  </span>
                  <span className="shrink-0 text-[10.5px] font-semibold" style={{ color: t.base }}>
                    {t.label}
                  </span>
                </div>
              );
            })}
          </div>
        </Glass>
      </section>
    </div>
  );
}

function Spark({ data, tone }: { data: number[]; tone: string }) {
  const max = Math.max(...data);
  const min = Math.min(...data);
  const span = max - min || 1;
  const pts = data
    .map((d, i) => `${(i / (data.length - 1)) * 60},${22 - ((d - min) / span) * 18}`)
    .join(" ");
  return (
    <svg width={60} height={24} aria-hidden="true">
      <polyline
        points={pts}
        fill="none"
        stroke={tone}
        strokeWidth={1.6}
        strokeLinecap="round"
        strokeLinejoin="round"
        style={{ filter: `drop-shadow(0 0 3px ${tone}66)` }}
      />
    </svg>
  );
}

// —————————————————————————————————————— Marktplaats ——————————————————————————————————————
type Mode = "ok" | "loading";

function Marktplaats({ onOpen, selId }: { onOpen: (id: string) => void; selId: string }) {
  const [q, setQ] = useState("");
  const [mode, setMode] = useState<Mode>("ok");

  const rows = useMemo(() => {
    const n = q.toLowerCase().trim();
    return OPDRACHTEN.filter(
      (o) =>
        o.titel.toLowerCase().includes(n) ||
        o.plaats.toLowerCase().includes(n) ||
        o.opdrachtgever.toLowerCase().includes(n),
    ).sort((a, b) => b.match - a.match);
  }, [q]);

  return (
    <div className="space-y-4">
      <ScreenHead
        code="Marktplaats"
        title="Opdrachten die bij je passen"
        sub={`${rows.length} van ${OPDRACHTEN.length} opdrachten sluiten aan op je geverifieerde profiel.`}
      />

      <Glass level={0} className="flex flex-col gap-2.5 p-2.5 sm:flex-row sm:items-center">
        <div
          className="flex flex-1 items-center gap-2 rounded-full px-3.5 py-2"
          style={{ background: C.glassSink, border: `1px solid ${C.borderSoft}` }}
        >
          <Search size={15} aria-hidden="true" style={{ color: C.textFaint }} />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Zoek op titel, plaats of opdrachtgever…"
            aria-label="Opdrachten zoeken"
            className="w-full bg-transparent text-[13px] outline-none"
            style={{ color: C.text }}
          />
          {q && (
            <button
              type="button"
              onClick={() => setQ("")}
              aria-label="Zoekterm wissen"
              className={`flex h-5 w-5 items-center justify-center rounded-md ${RING}`}
              style={{ color: C.textMute }}
            >
              <X size={13} aria-hidden="true" />
            </button>
          )}
        </div>
        <Btn
          variant="glass"
          size="sm"
          onClick={() => setMode(mode === "loading" ? "ok" : "loading")}
        >
          {mode === "loading" ? "Toon lijst" : "Laadstaat tonen"}
        </Btn>
      </Glass>

      {mode === "loading" ? (
        <ul className="space-y-3" aria-hidden="true">
          {[0, 1, 2].map((i) => (
            <li key={i}>
              <Glass level={1} className="space-y-3 p-5">
                <div
                  className="h-4 w-2/3 animate-pulse rounded-full motion-reduce:animate-none"
                  style={{ background: "rgba(255,255,255,0.09)" }}
                />
                <div
                  className="h-3 w-1/2 animate-pulse rounded-full motion-reduce:animate-none"
                  style={{ background: "rgba(255,255,255,0.06)" }}
                />
              </Glass>
            </li>
          ))}
        </ul>
      ) : rows.length === 0 ? (
        <Glass level={1} className="flex flex-col items-center px-6 py-16 text-center">
          <span
            className="flex h-14 w-14 items-center justify-center rounded-[16px]"
            style={{ color: C.accent, background: C.accentSoft, border: `1px solid ${C.accent}44` }}
            aria-hidden="true"
          >
            <Search size={24} />
          </span>
          <p className="mt-4 text-[18px] font-semibold" style={{ color: C.text }}>
            Niets gevonden in de ruimte
          </p>
          <p className="mt-2 max-w-sm text-[13px] leading-relaxed" style={{ color: C.textSoft }}>
            Geen opdracht voor {q ? `“${q}”` : "je zoekterm"}. Verruim je zoekopdracht.
          </p>
          <Btn variant="glass" className="mt-5" onClick={() => setQ("")}>
            <RotateCcw size={13} aria-hidden="true" /> Zoekterm wissen
          </Btn>
        </Glass>
      ) : (
        <ul className="space-y-3">
          {rows.map((o) => (
            <li key={o.id}>
              <MarktKaart opdracht={o} onOpen={onOpen} sel={o.id === selId} />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function MarktKaart({
  opdracht,
  onOpen,
  sel,
}: {
  opdracht: Opdracht;
  onOpen: (id: string) => void;
  sel: boolean;
}) {
  const [open, setOpen] = useState(false);
  const strong = opdracht.match >= 90;
  const tone = strong ? C.pos : C.accent;
  return (
    <Glass level={sel ? 2 : 1} as="article" className="sp-float overflow-hidden">
      <div
        className="flex items-start gap-4 p-5"
        style={sel ? { boxShadow: `inset 0 0 0 1px ${C.accent}55` } : undefined}
      >
        <MatchRing value={opdracht.match} tone={tone} size={58} />
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 text-[10.5px]" style={{ color: C.textFaint }}>
            <span>{opdracht.id}</span>
            <span aria-hidden="true">·</span>
            <span className="font-semibold uppercase tracking-[0.1em]" style={{ color: tone }}>
              {strong ? "sterke match" : "goede match"}
            </span>
          </div>
          <h3
            className="mt-1 text-[16.5px] font-semibold leading-snug tracking-[-0.01em]"
            style={{ color: C.text }}
          >
            {opdracht.titel}
          </h3>
          <p className="mt-0.5 text-[12.5px]" style={{ color: C.textMute }}>
            {opdracht.opdrachtgever} · {opdracht.plaats} · {opdracht.uren} · {opdracht.start}
          </p>
          <div className="mt-2.5 flex flex-wrap gap-1.5">
            {opdracht.tags.map((t) => (
              <span
                key={t}
                className="rounded-full px-2.5 py-0.5 text-[11px] font-medium"
                style={{ background: C.glass, color: C.textSoft, border: `1px solid ${C.border}` }}
              >
                {t}
              </span>
            ))}
          </div>
        </div>
        <span className="hidden shrink-0 text-right sm:block">
          <span className="block text-[16px] font-bold" style={{ color: C.text }}>
            {opdracht.tarief.replace(" / uur", "")}
          </span>
          <span className="text-[10px]" style={{ color: C.textFaint }}>
            per uur
          </span>
        </span>
      </div>
      <div
        className="flex flex-wrap items-center gap-2 px-5 py-3"
        style={{ borderTop: `1px solid ${C.borderSoft}`, background: C.glassSink }}
      >
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          className={`inline-flex items-center gap-1.5 rounded-md text-[12px] font-semibold ${RING}`}
          style={{ color: C.accent }}
        >
          {open ? <X size={13} aria-hidden="true" /> : <Plus size={13} aria-hidden="true" />}
          Waarom deze match
        </button>
        <div className="ml-auto">
          <Btn variant="solid" size="sm" onClick={() => onOpen(opdracht.id)}>
            Bekijken <ArrowRight size={12} aria-hidden="true" />
          </Btn>
        </div>
      </div>
      <div
        className="grid transition-all duration-300 motion-reduce:transition-none"
        style={{ gridTemplateRows: open ? "1fr" : "0fr" }}
      >
        <div className="overflow-hidden">
          <div
            className="grid grid-cols-1 gap-5 p-5 sm:grid-cols-2"
            style={{ borderTop: `1px solid ${C.borderSoft}` }}
          >
            <RedenKolom
              titel="In je voordeel"
              tone={C.pos}
              Icon={Check}
              items={opdracht.redenen.plus}
            />
            <RedenKolom
              titel="Goed om te weten"
              tone={C.warn}
              Icon={AlertTriangle}
              items={opdracht.redenen.min}
            />
          </div>
        </div>
      </div>
    </Glass>
  );
}

function RedenKolom({
  titel,
  tone,
  Icon,
  items,
}: {
  titel: string;
  tone: string;
  Icon: LucideIcon;
  items: string[];
}) {
  return (
    <div>
      <p
        className="flex items-center gap-1.5 text-[10.5px] font-semibold uppercase tracking-[0.12em]"
        style={{ color: tone }}
      >
        <Icon size={12} aria-hidden="true" /> {titel}
      </p>
      <ul className="mt-2.5 space-y-2">
        {items.map((r) => (
          <li
            key={r}
            className="flex items-start gap-2 text-[13px] leading-snug"
            style={{ color: C.textSoft }}
          >
            <span
              className="mt-1.5 h-1 w-1 shrink-0 rounded-full"
              style={{ background: tone }}
              aria-hidden="true"
            />
            {r}
          </li>
        ))}
      </ul>
    </div>
  );
}

// —————————————————————————————————————— Opdracht-detail ——————————————————————————————————————
function OpdrachtDetail({ opdracht, onBack }: { opdracht: Opdracht; onBack: () => void }) {
  const strong = opdracht.match >= 90;
  const tone = strong ? C.pos : C.accent;
  const feiten = [
    { l: "Tarief", v: opdracht.tarief.replace(" / uur", ""), s: "per uur" },
    { l: "Omvang", v: opdracht.uren, s: "per week" },
    { l: "Aanvang", v: opdracht.start, s: "startdatum" },
    { l: "Match", v: `${opdracht.match}%`, s: "op profiel" },
  ];
  return (
    <div className="space-y-4">
      <Btn variant="ghost" size="sm" onClick={onBack}>
        <ArrowLeft size={14} aria-hidden="true" /> Terug naar marktplaats
      </Btn>

      <Glass level={2} className="sp-float relative overflow-hidden p-6">
        <div
          className="absolute -right-20 -top-20 h-64 w-64 rounded-full"
          style={{ background: `radial-gradient(circle, ${tone}22, transparent 70%)` }}
          aria-hidden="true"
        />
        <div className="relative flex flex-wrap items-start gap-5">
          <MatchRing value={opdracht.match} tone={tone} size={72} />
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 text-[11px]" style={{ color: C.textFaint }}>
              <span>{opdracht.id}</span>
              <span aria-hidden="true">·</span>
              <span className="font-semibold uppercase tracking-[0.1em]" style={{ color: tone }}>
                {strong ? "sterke match" : "goede match"}
              </span>
            </div>
            <h1
              className="mt-2 max-w-2xl text-[26px] font-semibold leading-[1.15] tracking-[-0.025em] md:text-[30px]"
              style={{ color: C.text }}
            >
              {opdracht.titel}
            </h1>
            <p
              className="mt-2 flex items-center gap-1.5 text-[13.5px]"
              style={{ color: C.textMute }}
            >
              <MapPin size={14} aria-hidden="true" /> {opdracht.opdrachtgever} · {opdracht.plaats}
            </p>
            <div className="mt-4 flex flex-wrap gap-1.5">
              {opdracht.tags.map((t) => (
                <span
                  key={t}
                  className="rounded-full px-2.5 py-0.5 text-[11px] font-medium"
                  style={{
                    background: C.glass,
                    color: C.textSoft,
                    border: `1px solid ${C.border}`,
                  }}
                >
                  {t}
                </span>
              ))}
            </div>
            <div className="mt-5 flex flex-wrap gap-2">
              <Btn variant="solid">
                Reageren op opdracht <ArrowRight size={14} aria-hidden="true" />
              </Btn>
              <Btn variant="glass">Bewaren</Btn>
            </div>
          </div>
        </div>

        <div className="relative mt-6 grid grid-cols-2 gap-2.5 sm:grid-cols-4">
          {feiten.map((m) => (
            <div
              key={m.l}
              className="rounded-[14px] p-3.5"
              style={{ background: C.glassSink, border: `1px solid ${C.borderSoft}` }}
            >
              <p
                className="text-[10px] font-semibold uppercase tracking-[0.12em]"
                style={{ color: C.textMute }}
              >
                {m.l}
              </p>
              <p className="mt-1.5 text-[18px] font-bold leading-none" style={{ color: C.text }}>
                {m.v}
              </p>
              <p className="mt-1 text-[10.5px]" style={{ color: C.textFaint }}>
                {m.s}
              </p>
            </div>
          ))}
        </div>
      </Glass>

      <Glass level={1} className="p-6">
        <Kicker tone={C.accent} Icon={ListChecks}>
          Motivering — navolgbaar, zonder verborgen score
        </Kicker>
        <div className="mt-5 grid grid-cols-1 gap-6 md:grid-cols-2">
          <RedenKolom
            titel="In je voordeel"
            tone={C.pos}
            Icon={Check}
            items={opdracht.redenen.plus}
          />
          <RedenKolom
            titel="Goed om te weten"
            tone={C.warn}
            Icon={AlertTriangle}
            items={opdracht.redenen.min}
          />
        </div>
      </Glass>
    </div>
  );
}

// —————————————————————————————————————— Verificatie ——————————————————————————————————————
function Verificatie() {
  const [open, setOpen] = useState<string | null>(CREDENTIALS[0]?.naam ?? null);
  const verified = CREDENTIALS.filter((c) => c.status === "VERIFIED").length;
  const ratio = Math.round((verified / CREDENTIALS.length) * 100);
  return (
    <div className="space-y-4">
      <ScreenHead
        code="Verificatie"
        title="Vertrouwensregister"
        sub={`${verified} van ${CREDENTIALS.length} certificaten geverifieerd · ${PROFIEL.trust}.`}
        right={
          <Glass level={1} className="px-5 py-3 text-right">
            <p
              className="text-[28px] font-bold leading-none tracking-[-0.02em]"
              style={{ color: C.text }}
            >
              {ratio}%
            </p>
            <p
              className="mt-0.5 text-[10px] uppercase tracking-[0.14em]"
              style={{ color: C.textMute }}
            >
              op orde
            </p>
          </Glass>
        }
      />

      <ul className="space-y-3">
        {CREDENTIALS.map((c) => {
          const t = credTone(c.status);
          const isOpen = open === c.naam;
          return (
            <li key={c.naam}>
              <Glass level={t.alarm ? 2 : 1} as="article" className="sp-float overflow-hidden">
                <button
                  type="button"
                  onClick={() => setOpen(isOpen ? null : c.naam)}
                  aria-expanded={isOpen}
                  className={`flex w-full items-center gap-3.5 p-4 text-left ${RING}`}
                >
                  <span
                    className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[13px]"
                    style={{ background: t.soft, color: t.base, border: `1px solid ${t.base}44` }}
                    aria-hidden="true"
                  >
                    <t.Icon size={18} />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span
                      className="block truncate text-[14.5px] font-semibold"
                      style={{ color: C.text }}
                    >
                      {c.naam}
                    </span>
                    <span
                      className="block truncate text-[12px]"
                      style={{ color: t.alarm ? t.base : C.textMute }}
                    >
                      {c.detail}
                    </span>
                  </span>
                  <span className="hidden sm:inline-flex">
                    <StatusTag {...t} />
                  </span>
                  <ChevronRight
                    size={17}
                    aria-hidden="true"
                    style={{
                      color: C.textFaint,
                      transform: isOpen ? "rotate(90deg)" : "none",
                      transition: "transform 0.2s ease",
                    }}
                  />
                </button>
                <div
                  className="grid transition-all duration-300 motion-reduce:transition-none"
                  style={{ gridTemplateRows: isOpen ? "1fr" : "0fr" }}
                >
                  <div className="overflow-hidden">
                    <div
                      className="px-4 pb-4 sm:pl-[4.7rem]"
                      style={{ borderTop: `1px solid ${C.borderSoft}`, paddingTop: 12 }}
                    >
                      <span className="mb-2 inline-flex sm:hidden">
                        <StatusTag {...t} />
                      </span>
                      <p
                        className="max-w-xl text-[12.5px] leading-relaxed"
                        style={{ color: C.textSoft }}
                      >
                        {c.detail}. Het document wordt versleuteld bewaard en uitsluitend na jouw
                        toestemming gedeeld met een opdrachtgever.
                      </p>
                      <div className="mt-3 flex flex-wrap gap-2">
                        <Btn size="sm" variant="solid">
                          {c.status === "EXPIRING"
                            ? "Vernieuwen"
                            : c.status === "REJECTED"
                              ? "Opnieuw indienen"
                              : "Bekijken"}
                        </Btn>
                        <Btn size="sm" variant="glass">
                          Historie
                        </Btn>
                      </div>
                    </div>
                  </div>
                </div>
              </Glass>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

// —————————————————————————————————————— Acties ——————————————————————————————————————
function Acties({ onMarkt, onFacturen }: { onMarkt: () => void; onFacturen: () => void }) {
  return (
    <div className="space-y-4">
      <ScreenHead
        code="Acties"
        title="Wat vandaag je aandacht vraagt"
        sub="Op volgorde van urgentie — het dringendste zweeft naar voren."
      />
      <ol className="space-y-3">
        {ACTIES.map((a, i) => {
          const warn = a.urgentie === "warning";
          const tone = warn ? C.warn : C.info;
          const goMarkt = a.cta.toLowerCase().includes("match");
          const goFacturen = a.cta.toLowerCase().includes("herinner");
          return (
            <li key={a.titel}>
              <Glass level={warn ? 2 : 1} className="sp-float flex items-start gap-4 p-5">
                <span
                  className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[13px] text-[15px] font-bold"
                  style={{ background: tone + "22", color: tone, border: `1px solid ${tone}44` }}
                  aria-hidden="true"
                >
                  {String(i + 1).padStart(2, "0")}
                </span>
                <div className="min-w-0 flex-1">
                  <Kicker tone={tone} Icon={warn ? AlertTriangle : Clock}>
                    {warn ? "Urgent" : "Aanbevolen"}
                  </Kicker>
                  <h2
                    className="mt-1.5 text-[16px] font-semibold leading-snug"
                    style={{ color: C.text }}
                  >
                    {a.titel}
                  </h2>
                  <p
                    className="mt-1 max-w-lg text-[13px] leading-relaxed"
                    style={{ color: C.textSoft }}
                  >
                    {a.detail}
                  </p>
                  <div className="mt-3">
                    <Btn
                      variant={warn ? "solid" : "glass"}
                      size="sm"
                      onClick={goMarkt ? onMarkt : goFacturen ? onFacturen : undefined}
                    >
                      {a.cta} <ArrowRight size={13} aria-hidden="true" />
                    </Btn>
                  </div>
                </div>
              </Glass>
            </li>
          );
        })}
      </ol>
    </div>
  );
}

// —————————————————————————————————————— Facturen ——————————————————————————————————————
function Facturen() {
  const [sel, setSel] = useState<string>(FACTUREN[0]?.nr ?? "");
  const totals = useMemo(() => {
    const sum = (status: string) =>
      FACTUREN.filter((f) => f.status === status).reduce((a, f) => a + parseEUR(f.bedrag), 0);
    return { betaald: sum("Betaald"), open: sum("Openstaand") };
  }, []);
  const selected = FACTUREN.find((f) => f.nr === sel) ?? FACTUREN[0];

  return (
    <div className="space-y-4">
      <ScreenHead
        code="Facturen"
        title="Je facturen"
        sub="Selecteer een factuur voor de details."
        right={
          <Btn variant="solid" size="sm">
            <Plus size={13} aria-hidden="true" /> Nieuwe factuur
          </Btn>
        }
      />

      <section className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <Glass level={1} className="p-4">
          <Kicker tone={C.pos} Icon={Check}>
            Betaald
          </Kicker>
          <p className="mt-2 text-[24px] font-bold leading-none" style={{ color: C.text }}>
            {eur0.format(totals.betaald)}
          </p>
        </Glass>
        <Glass level={1} className="p-4">
          <Kicker tone={C.warn} Icon={Clock}>
            Openstaand
          </Kicker>
          <p className="mt-2 text-[24px] font-bold leading-none" style={{ color: C.text }}>
            {eur0.format(totals.open)}
          </p>
        </Glass>
      </section>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1.5fr_1fr]">
        <Glass level={1} className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left" style={{ minWidth: 440 }}>
              <caption className="sr-only">Overzicht van facturen</caption>
              <thead>
                <tr style={{ borderBottom: `1px solid ${C.borderSoft}` }}>
                  {["Nummer", "Klant", "Bedrag", "Status"].map((h, i) => (
                    <th
                      key={h}
                      scope="col"
                      className={`px-4 py-3 text-[10px] font-semibold uppercase tracking-[0.12em] ${i === 2 ? "text-right" : ""}`}
                      style={{ color: C.textMute }}
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {FACTUREN.map((f) => {
                  const t = factuurTone(f.status);
                  const on = f.nr === sel;
                  return (
                    <tr
                      key={f.nr}
                      className={`hover:bg-white/6 cursor-pointer transition-colors ${RING}`}
                      tabIndex={0}
                      role="button"
                      aria-pressed={on}
                      onClick={() => setSel(f.nr)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") {
                          e.preventDefault();
                          setSel(f.nr);
                        }
                      }}
                      style={{
                        borderTop: `1px solid ${C.borderSoft}`,
                        background: on ? C.accentSoft : undefined,
                      }}
                    >
                      <td
                        className="px-4 py-3.5 text-[12px] font-medium"
                        style={{ color: on ? C.accent : C.textSoft }}
                      >
                        {f.nr}
                      </td>
                      <td
                        className="px-4 py-3.5 text-[13px] font-semibold"
                        style={{ color: C.text }}
                      >
                        {f.klant}
                      </td>
                      <td
                        className="px-4 py-3.5 text-right text-[13px] font-bold"
                        style={{ color: C.text }}
                      >
                        {f.bedrag}
                      </td>
                      <td className="px-4 py-3.5">
                        <span
                          className="inline-flex items-center gap-1.5 text-[11.5px] font-semibold"
                          style={{ color: t.base }}
                        >
                          <t.Icon size={12} aria-hidden="true" /> {t.label}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Glass>

        {selected && (
          <Glass level={2} as="article" className="sp-float overflow-hidden p-5">
            <Kicker tone={C.accent} Icon={FileText}>
              Factuur
            </Kicker>
            <p className="mt-2 text-[20px] font-bold" style={{ color: C.text }}>
              {selected.nr}
            </p>
            <div className="mt-4 space-y-2.5 text-[13px]">
              <Row label="Klant" value={selected.klant} />
              <Row label="Datum" value={selected.datum} />
              <Row label="Status">
                {(() => {
                  const t = factuurTone(selected.status);
                  return (
                    <span
                      className="inline-flex items-center gap-1.5 font-semibold"
                      style={{ color: t.base }}
                    >
                      <t.Icon size={12} aria-hidden="true" /> {t.label}
                    </span>
                  );
                })()}
              </Row>
            </div>
            <div className="my-4 h-px" style={{ background: C.borderSoft }} />
            <div className="flex items-baseline justify-between">
              <span
                className="text-[12px] font-bold uppercase tracking-[0.12em]"
                style={{ color: C.textMute }}
              >
                Totaal
              </span>
              <span className="text-[22px] font-bold" style={{ color: C.text }}>
                {selected.bedrag}
              </span>
            </div>
            <div className="mt-4 flex gap-2">
              <Btn variant="solid" size="sm" full>
                {selected.status === "Concept"
                  ? "Versturen"
                  : selected.status === "Openstaand"
                    ? "Herinnering"
                    : "Download"}
                <ArrowRight size={13} aria-hidden="true" />
              </Btn>
              <Btn variant="glass" size="sm">
                PDF
              </Btn>
            </div>
          </Glass>
        )}
      </div>
    </div>
  );
}

function Row({ label, value, children }: { label: string; value?: string; children?: ReactNode }) {
  return (
    <div className="flex items-baseline justify-between gap-2">
      <span className="shrink-0 text-[12.5px]" style={{ color: C.textMute }}>
        {label}
      </span>
      <span className="text-right text-[13px] font-semibold" style={{ color: C.text }}>
        {children ?? value}
      </span>
    </div>
  );
}
