"use client";

// Concept 175 — "Parallax" · bewegende dieptelagen. 2026-trend: spatial / parallax depth.
// Meerdere lagen zweven op verschillende diepte: bij muisbeweging verschuiven achtergrond-accenten
// en voorgrond met verschillende snelheid (transform o.b.v. genormaliseerde muispositie via
// onMouseMove-state — GEEN scroll-hacks, GEEN random/Date). Zachte cast-shadows scheiden de lagen;
// content op de voorste laag blijft scherp en leesbaar, decoratieve accent-orbs zweven erachter.
// Onderscheidt zich puur door de bewegende gelaagdheid — diepte zonder rommel. Beweging blijft
// subtiel. Status nooit kleur-alleen: label + icoon. UI-taal Nederlands.
// Fonts: Space Grotesk (display) + Manrope (tekst) + Geist Mono (data).

import { createContext, useContext, useEffect, useRef, useState } from "react";
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
  Layers,
  TriangleAlert,
  ChevronRight,
  Zap,
  RefreshCw,
  Inbox,
  TrendingUp,
  TrendingDown,
  BadgeCheck,
  Sparkles,
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

// ── Palet — spatiaal, koel-diep met zachte cast-shadows tussen zwevende lagen ──────
const C = {
  bg: "#0e1226", // diepe ruimte-achtergrond (achterste laag)
  bgMid: "#161c3a", // middenlaag
  panel: "#1b2246", // zwevend paneel
  panelHi: "#222a55", // opgetild paneel
  card: "#f6f8ff", // voorste content-kaart (licht, scherp)
  cardSoft: "#e9edfb", // secundair licht vlak
  ink: "#0d1330", // donkere tekst op licht
  inkSoft: "#4a5478", // secundaire tekst op licht
  inkFaint: "#7d87a8", // labels op licht
  line: "#dde3f5", // fijne rand op licht
  onDark: "#eef1ff", // tekst op donker
  onDarkSoft: "rgba(238,241,255,0.66)",
  onDarkFaint: "rgba(238,241,255,0.42)",
  // Zwevende accent-orbs (diepte-kleuren)
  violet: "#7b5cff",
  cyan: "#2fd4d0",
  magenta: "#ff5c9d",
  amber: "#ffb648",
  sky: "#3d8bff",
  // Semantisch (status)
  ok: "#12a074",
  okSoft: "#dcf4ec",
  warn: "#c07817",
  warnSoft: "#fbeed7",
  info: "#3161d6",
  infoSoft: "#e0e8fb",
  danger: "#d63d63",
  dangerSoft: "#fbe0e7",
  white: "#ffffff",
};

const display = { fontFamily: "var(--font-lab-space)" };
const bodyF = { fontFamily: "var(--font-lab-manrope)" };
const mono = { fontFamily: "var(--font-lab-geist-mono)" };

// ── Parallax-context — genormaliseerde muispositie (-1..1), gedeeld over het scherm ──
type Pos = { x: number; y: number };
const ParallaxCtx = createContext<Pos>({ x: 0, y: 0 });

// Een zwevende laag die met de muis meebeweegt; `depth` bepaalt de snelheid (px verschuiving).
function Layer({
  depth,
  children,
  className = "",
  style,
  rotate = 0,
}: {
  depth: number;
  children?: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
  rotate?: number;
}) {
  const p = useContext(ParallaxCtx);
  return (
    <div
      className={className}
      style={{
        ...style,
        transform: `translate3d(${(p.x * depth).toFixed(2)}px, ${(p.y * depth).toFixed(2)}px, 0) rotate(${(rotate + p.x * (depth > 0 ? 0.4 : -0.4)).toFixed(2)}deg)`,
        transition: "transform 220ms cubic-bezier(0.22,1,0.36,1)",
        willChange: "transform",
      }}
      aria-hidden="true"
    >
      {children}
    </div>
  );
}

// Decoratieve, zachte kleur-orb (achterste dieptelagen).
function Orb({
  size,
  color,
  depth,
  className = "",
  style,
}: {
  size: number;
  color: string;
  depth: number;
  className?: string;
  style?: React.CSSProperties;
}) {
  return (
    <Layer depth={depth} className={`pointer-events-none absolute ${className}`} style={style}>
      <span
        className="block rounded-full"
        style={{
          width: size,
          height: size,
          background: `radial-gradient(circle at 35% 30%, ${color}cc, ${color}00 70%)`,
          filter: "blur(6px)",
        }}
      />
    </Layer>
  );
}

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
      className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold"
      style={{ ...bodyF, background: m.bg, color: m.fg }}
    >
      <m.Icon size={12} strokeWidth={2.4} aria-hidden="true" />
      {m.label}
    </span>
  );
}

// Voorste content-kaart — scherp, met zachte cast-shadow die de laag van de achtergrond tilt.
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
      className={`rounded-2xl ${interactive ? "transition-[transform,box-shadow] duration-200 hover:-translate-y-1 hover:shadow-[0_28px_60px_-24px_rgba(9,13,34,0.55)]" : ""} ${className}`}
      style={{
        background: C.card,
        border: `1px solid ${C.line}`,
        boxShadow: "0 18px 44px -22px rgba(9,13,34,0.5)",
        ...style,
      }}
    >
      {children}
    </div>
  );
}

function SectionHead({
  title,
  sub,
  Icon = Layers,
}: {
  title: string;
  sub?: string;
  Icon?: LucideIcon;
}) {
  return (
    <div className="flex items-center gap-3">
      <span
        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl"
        style={{ background: C.cardSoft, boxShadow: "0 8px 18px -10px rgba(9,13,34,0.5)" }}
        aria-hidden="true"
      >
        <Icon size={18} strokeWidth={2} style={{ color: C.violet }} />
      </span>
      <div className="min-w-0">
        <h2
          className="text-[19px] font-bold leading-none tracking-[-0.02em]"
          style={{ ...display, color: C.onDark }}
        >
          {title}
        </h2>
        {sub && (
          <p className="mt-1.5 text-[12px]" style={{ ...bodyF, color: C.onDarkFaint }}>
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
      <Icon size={13} strokeWidth={1.9} style={{ color: C.sky }} aria-hidden="true" />
      <span className="truncate" style={bodyF}>
        {value}
      </span>
    </div>
  );
}

// Match-ring met diepte-glow.
function MatchRing({ value, size = 56 }: { value: number; size?: number }) {
  const deg = (value / 100) * 360;
  return (
    <span
      className="relative flex shrink-0 items-center justify-center rounded-full"
      style={{
        width: size,
        height: size,
        background: `conic-gradient(${C.violet} 0deg, ${C.sky} ${deg * 0.5}deg, ${C.cyan} ${deg}deg, ${C.line} ${deg}deg 360deg)`,
        boxShadow: "0 10px 22px -10px rgba(123,92,255,0.6)",
      }}
      aria-hidden="true"
    >
      <span
        className="absolute inset-[4px] flex flex-col items-center justify-center rounded-full"
        style={{ background: C.card }}
      >
        <span
          className="text-[15px] font-bold tabular-nums leading-none"
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
            background: i === data.length - 1 ? C.violet : `${C.ink}22`,
          }}
        />
      ))}
    </div>
  );
}

// ── Root ─────────────────────────────────────────────────────────────────────────
export function Concept175() {
  const [screen, setScreen] = useState<ScreenKey>("dashboard");
  const [pos, setPos] = useState<Pos>({ x: 0, y: 0 });
  const [loading, setLoading] = useState(true);
  const frame = useRef<number | null>(null);
  const active = OPDRACHTEN[0] as Opdracht;

  useEffect(() => {
    const t = setTimeout(() => setLoading(false), 720);
    return () => clearTimeout(t);
  }, []);

  const reload = () => {
    setLoading(true);
    setTimeout(() => setLoading(false), 720);
  };

  // Genormaliseerde muispositie (-1..1) t.o.v. het midden van het scherm; gethrottled via rAF.
  const onMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const nx = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    const ny = ((e.clientY - rect.top) / rect.height) * 2 - 1;
    if (frame.current != null) return;
    frame.current = requestAnimationFrame(() => {
      frame.current = null;
      setPos({ x: Math.max(-1, Math.min(1, nx)), y: Math.max(-1, Math.min(1, ny)) });
    });
  };

  return (
    <ParallaxCtx.Provider value={pos}>
      <div
        onMouseMove={onMove}
        onMouseLeave={() => setPos({ x: 0, y: 0 })}
        className="relative min-h-screen w-full overflow-hidden antialiased"
        style={{ ...bodyF, color: C.onDark, background: C.bg }}
      >
        {/* Achterste dieptelagen — zwevende kleur-orbs (bewegen traag/snel per depth) */}
        <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
          <div
            className="absolute inset-0"
            style={{ background: `radial-gradient(120% 80% at 50% -10%, ${C.bgMid}, ${C.bg} 60%)` }}
          />
          <Orb
            size={420}
            color={C.violet}
            depth={40}
            style={{ top: "-6rem", left: "-6rem", opacity: 0.5 }}
          />
          <Orb
            size={340}
            color={C.sky}
            depth={26}
            style={{ top: "8rem", right: "-5rem", opacity: 0.45 }}
          />
          <Orb
            size={280}
            color={C.cyan}
            depth={54}
            style={{ bottom: "-4rem", left: "20%", opacity: 0.4 }}
          />
          <Orb
            size={220}
            color={C.magenta}
            depth={18}
            style={{ bottom: "6rem", right: "12%", opacity: 0.35 }}
          />
          {/* Fijne sterrenlaag (subtiel, diepste plan) */}
          <Layer depth={10} className="absolute inset-0">
            <div
              className="h-full w-full"
              style={{
                backgroundImage: "radial-gradient(rgba(238,241,255,0.35) 1px, transparent 1px)",
                backgroundSize: "46px 46px",
                opacity: 0.25,
              }}
            />
          </Layer>
        </div>

        {/* Kop — voorgrondlaag, licht meebewegend */}
        <header className="relative">
          <Layer depth={-8} className="pointer-events-none absolute inset-x-0 top-0 h-full">
            <div
              className="mx-auto h-24 max-w-6xl"
              style={{ background: `linear-gradient(180deg, ${C.violet}18, transparent)` }}
            />
          </Layer>
          <div className="relative mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-4 py-5 md:px-8">
            <div className="flex items-center gap-3.5">
              <span
                className="flex h-11 w-11 items-center justify-center rounded-2xl"
                style={{
                  background: `linear-gradient(135deg, ${C.violet}, ${C.sky})`,
                  boxShadow: "0 14px 30px -12px rgba(123,92,255,0.7)",
                }}
                aria-hidden="true"
              >
                <Layers size={22} strokeWidth={2} style={{ color: C.white }} />
              </span>
              <div className="leading-tight">
                <div
                  className="text-[10px] font-semibold uppercase tracking-[0.32em]"
                  style={{ ...mono, color: C.cyan }}
                >
                  Parallax
                </div>
                <div
                  className="text-[24px] font-bold leading-none tracking-[-0.02em]"
                  style={{ ...display, color: C.onDark }}
                >
                  Dieptewerk
                </div>
                <div
                  className="mt-1 text-[10px] uppercase tracking-[0.18em]"
                  style={{ ...mono, color: C.onDarkFaint }}
                >
                  Match · Verificatie · Omzet
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2.5">
              <span
                className="hidden items-center gap-1.5 rounded-full px-3 py-1.5 text-[11px] font-semibold sm:inline-flex"
                style={{ ...bodyF, background: "rgba(238,241,255,0.1)", color: C.onDark }}
              >
                <ShieldCheck
                  size={12}
                  strokeWidth={2}
                  style={{ color: C.cyan }}
                  aria-hidden="true"
                />{" "}
                {PROFIEL.trust}
              </span>
              <span
                className="flex h-11 w-11 items-center justify-center rounded-2xl text-[12px] font-bold"
                style={{
                  ...display,
                  background: `linear-gradient(135deg, ${C.magenta}, ${C.violet})`,
                  color: C.white,
                  boxShadow: "0 12px 26px -12px rgba(255,92,157,0.6)",
                }}
                aria-hidden="true"
              >
                {PROFIEL.initialen}
              </span>
            </div>
          </div>

          {/* Scherm-switcher */}
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
                  className="shrink-0 rounded-full px-3.5 py-1.5 text-[12.5px] font-semibold transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
                  style={{
                    ...bodyF,
                    background: on ? C.card : "rgba(238,241,255,0.08)",
                    color: on ? C.ink : C.onDarkSoft,
                    boxShadow: on ? "0 10px 22px -10px rgba(9,13,34,0.7)" : "none",
                    ["--tw-ring-color" as string]: C.violet,
                    ["--tw-ring-offset-color" as string]: C.bg,
                  }}
                >
                  {s.label}
                </button>
              );
            })}
          </nav>
        </header>

        <main className="relative mx-auto max-w-6xl px-4 py-6 md:px-8 md:py-8">
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
    </ParallaxCtx.Provider>
  );
}

// ── Skeleton (laadstaat) ─────────────────────────────────────────────────────────
function SkeletonBlock({ className = "" }: { className?: string }) {
  return (
    <div
      className={`animate-pulse rounded-2xl ${className}`}
      style={{ background: "rgba(238,241,255,0.08)", border: `1px solid rgba(238,241,255,0.06)` }}
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
      {/* Hero — voorste laag scherp, achter accent-orbs die meebewegen */}
      <div className="relative">
        <Orb
          size={220}
          color={C.violet}
          depth={30}
          style={{ top: "-3rem", right: "2rem", opacity: 0.6 }}
        />
        <Orb
          size={160}
          color={C.cyan}
          depth={48}
          style={{ bottom: "-2rem", left: "1rem", opacity: 0.5 }}
        />
        <Card className="relative overflow-hidden">
          <div className="relative max-w-xl p-6 sm:p-8">
            <span
              className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold"
              style={{ ...bodyF, background: C.cardSoft, color: C.violet }}
            >
              <Sparkles size={12} strokeWidth={2.2} aria-hidden="true" /> {PROFIEL.rol}
            </span>
            <h1
              className="mt-3 text-[30px] font-bold leading-[1.05] tracking-[-0.03em] sm:text-[40px]"
              style={{ ...display, color: C.ink }}
            >
              Drie matches boven 85%. Je omzet stijgt laag na laag.
            </h1>
            <p
              className="mt-3 max-w-lg text-[14px] leading-relaxed"
              style={{ ...bodyF, color: C.inkSoft }}
            >
              Eén ding vraagt aandacht: je VOG verloopt binnenkort. Regel het en houd je profiel
              scherp en geverifieerd op de voorgrond.
            </p>
            <div className="mt-5 flex flex-wrap items-center gap-3">
              <button
                onClick={onOpen}
                className="inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-[13px] font-semibold text-white transition-transform hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
                style={{
                  ...bodyF,
                  background: `linear-gradient(135deg, ${C.violet}, ${C.sky})`,
                  ["--tw-ring-color" as string]: C.violet,
                }}
              >
                Bekijk matches <ArrowRight size={15} aria-hidden="true" />
              </button>
              <button
                onClick={onActies}
                className="inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-[13px] font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
                style={{
                  ...bodyF,
                  background: C.cardSoft,
                  color: C.ink,
                  ["--tw-ring-color" as string]: C.violet,
                }}
              >
                <TriangleAlert
                  size={14}
                  strokeWidth={2.2}
                  style={{ color: C.warn }}
                  aria-hidden="true"
                />{" "}
                Los actie op
              </button>
              <button
                onClick={onReload}
                aria-label="Dashboard opnieuw laden"
                className="inline-flex h-10 w-10 items-center justify-center rounded-full transition-transform hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
                style={{ background: C.cardSoft, ["--tw-ring-color" as string]: C.violet }}
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
      </div>

      {/* KPI-kaarten — lichte parallax-tilt per kaart */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {KPIS.map((k, i) => (
          <Layer key={k.label} depth={(i - 1.5) * 4} className="[&_*]:pointer-events-auto">
            <Card interactive className="p-4">
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
                  {k.up ? (
                    <TrendingUp size={10} strokeWidth={2.4} aria-hidden="true" />
                  ) : (
                    <TrendingDown size={10} strokeWidth={2.4} aria-hidden="true" />
                  )}
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
          </Layer>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-[1.6fr_1fr]">
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
                  style={{ ["--tw-ring-color" as string]: C.violet }}
                >
                  <MatchRing value={o.match} />
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
                          style={{ ...bodyF, background: C.cardSoft, color: C.inkSoft }}
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

        <section className="space-y-4">
          <SectionHead title="Vertrouwen" sub="Certificaat-dekking" Icon={ShieldCheck} />
          <Card className="p-5">
            <div className="flex items-center gap-5">
              <span
                className="relative flex h-24 w-24 shrink-0 items-center justify-center rounded-full"
                style={{
                  background: `conic-gradient(${C.cyan} 0deg, ${C.sky} ${dek * 1.8}deg, ${C.violet} ${dek * 3.6}deg, ${C.line} ${dek * 3.6}deg 360deg)`,
                }}
                aria-hidden="true"
              >
                <span
                  className="absolute inset-[8px] flex flex-col items-center justify-center rounded-full"
                  style={{ background: C.card }}
                >
                  <span
                    className="text-[26px] font-bold leading-none"
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

          {/* Prioriteit — zwevend donker paneel met diepte-orb erachter */}
          <div className="relative">
            <Orb
              size={140}
              color={C.magenta}
              depth={36}
              style={{ top: "-1.5rem", right: "-1rem", opacity: 0.6 }}
            />
            <div
              className="relative overflow-hidden rounded-2xl p-5"
              style={{ background: C.panelHi, boxShadow: "0 22px 50px -22px rgba(9,13,34,0.8)" }}
            >
              <span
                className="inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.1em]"
                style={{ ...mono, background: C.warnSoft, color: C.warn }}
              >
                <TriangleAlert size={11} strokeWidth={2.4} aria-hidden="true" /> Prioriteit
              </span>
              <h3
                className="mt-2.5 text-[17px] font-bold leading-tight tracking-[-0.01em]"
                style={{ ...display, color: C.onDark }}
              >
                {warn.titel}
              </h3>
              <p
                className="mt-1.5 text-[12.5px] leading-relaxed"
                style={{ ...bodyF, color: C.onDarkSoft }}
              >
                {warn.detail}
              </p>
              <button
                onClick={onActies}
                className="mt-4 inline-flex items-center gap-2 rounded-full px-4 py-2 text-[12px] font-semibold text-white transition-transform hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
                style={{
                  ...bodyF,
                  background: `linear-gradient(135deg, ${C.violet}, ${C.magenta})`,
                  ["--tw-ring-color" as string]: C.violet,
                  ["--tw-ring-offset-color" as string]: C.panelHi,
                }}
              >
                {warn.cta} <ArrowRight size={13} aria-hidden="true" />
              </button>
            </div>
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
        <div
          className="flex items-center gap-2 rounded-full px-3.5 py-2"
          style={{
            background: C.card,
            border: `1px solid ${C.line}`,
            boxShadow: "0 10px 24px -14px rgba(9,13,34,0.5)",
          }}
        >
          <Search size={15} style={{ color: C.sky }} aria-hidden="true" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Zoek opdracht of plaats…"
            aria-label="Opdrachten zoeken"
            className="w-44 bg-transparent text-[12.5px] outline-none placeholder:opacity-50"
            style={{ ...bodyF, color: C.ink }}
          />
        </div>
      </div>

      {filtered.length === 0 ? (
        <Card className="flex flex-col items-center justify-center gap-3 p-16 text-center">
          <span
            className="flex h-16 w-16 items-center justify-center rounded-2xl"
            style={{ background: C.cardSoft }}
            aria-hidden="true"
          >
            <Inbox size={30} strokeWidth={1.7} style={{ color: C.violet }} />
          </span>
          <p className="text-[19px] font-bold" style={{ ...display, color: C.ink }}>
            Geen match gevonden
          </p>
          <p className="max-w-xs text-[13px]" style={{ ...bodyF, color: C.inkSoft }}>
            Niets gevonden voor &ldquo;{q}&rdquo;. Pas je zoekterm aan en probeer opnieuw.
          </p>
          <button
            onClick={() => setQ("")}
            className="mt-1 rounded-full px-4 py-2 text-[12px] font-semibold text-white transition-transform hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
            style={{
              ...bodyF,
              background: `linear-gradient(135deg, ${C.violet}, ${C.sky})`,
              ["--tw-ring-color" as string]: C.violet,
            }}
          >
            Zoekterm wissen
          </button>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
          {filtered.map((o, i) => (
            <Layer key={o.id} depth={(i - 1) * 5} className="[&_*]:pointer-events-auto">
              <Card interactive className="flex h-full flex-col overflow-hidden">
                <div
                  className="h-1.5 w-full"
                  style={{ background: `linear-gradient(90deg, ${C.violet}, ${C.cyan})` }}
                  aria-hidden="true"
                />
                <div className="flex items-center gap-3 p-4">
                  <MatchRing value={o.match} size={48} />
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
                        style={{ ...bodyF, background: C.cardSoft, color: C.inkSoft }}
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
                    color: C.violet,
                    ["--tw-ring-color" as string]: C.violet,
                  }}
                >
                  Bekijk opdracht <ArrowRight size={14} aria-hidden="true" />
                </button>
              </Card>
            </Layer>
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
          background: C.card,
          color: C.ink,
          border: `1px solid ${C.line}`,
          ["--tw-ring-color" as string]: C.violet,
          ["--tw-ring-offset-color" as string]: C.bg,
        }}
      >
        <ArrowLeft size={14} aria-hidden="true" /> Terug naar marktplaats
      </button>

      <div className="relative">
        <Orb
          size={220}
          color={C.violet}
          depth={28}
          style={{ top: "-3rem", right: "3rem", opacity: 0.55 }}
        />
        <Orb
          size={150}
          color={C.cyan}
          depth={44}
          style={{ bottom: "-2rem", left: "2rem", opacity: 0.5 }}
        />
        <Card className="relative overflow-hidden">
          <div className="relative flex flex-wrap items-center justify-between gap-5 p-6 sm:p-8">
            <div className="min-w-0">
              <span
                className="inline-block rounded-full px-2.5 py-1 text-[11px] font-semibold"
                style={{ ...mono, background: C.cardSoft, color: C.violet }}
              >
                {opdracht.id}
              </span>
              <h1
                className="mt-3 max-w-2xl text-[26px] font-bold leading-[1.08] tracking-[-0.02em] sm:text-[34px]"
                style={{ ...display, color: C.ink }}
              >
                {opdracht.titel}
              </h1>
              <p className="mt-2 text-[13.5px]" style={{ ...bodyF, color: C.inkSoft }}>
                {opdracht.opdrachtgever} · {opdracht.plaats}
              </p>
            </div>
            <MatchRing value={opdracht.match} size={82} />
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {feiten.map((f, i) => (
          <Layer key={f.l} depth={(i - 1.5) * 4} className="[&_*]:pointer-events-auto">
            <Card interactive className="p-4">
              <span
                className="flex h-8 w-8 items-center justify-center rounded-xl"
                style={{ background: C.cardSoft }}
                aria-hidden="true"
              >
                <f.Icon size={16} strokeWidth={2} style={{ color: C.sky }} />
              </span>
              <div
                className="mt-3 text-[16px] font-bold leading-none"
                style={{ ...display, color: C.ink }}
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
          </Layer>
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
          onClick={onBack}
          className="flex flex-1 items-center justify-center gap-2 rounded-full px-6 py-3.5 text-[13px] font-semibold text-white transition-transform hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
          style={{
            ...bodyF,
            background: `linear-gradient(135deg, ${C.violet}, ${C.sky})`,
            ["--tw-ring-color" as string]: C.violet,
            ["--tw-ring-offset-color" as string]: C.bg,
          }}
        >
          Reageer op deze opdracht <ArrowRight size={16} aria-hidden="true" />
        </button>
        <button
          className="flex items-center justify-center gap-2 rounded-full px-6 py-3.5 text-[13px] font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
          style={{
            ...bodyF,
            background: C.card,
            color: C.ink,
            border: `1px solid ${C.line}`,
            ["--tw-ring-color" as string]: C.violet,
            ["--tw-ring-offset-color" as string]: C.bg,
          }}
        >
          <Star size={15} strokeWidth={2} style={{ color: C.amber }} aria-hidden="true" /> Bewaar
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
        <SectionHead title="Verificatie" sub="Certificaten en documenten" Icon={ShieldCheck} />
        <button
          className="inline-flex items-center gap-2 rounded-full px-4 py-2 text-[12px] font-semibold text-white transition-transform hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
          style={{
            ...bodyF,
            background: `linear-gradient(135deg, ${C.violet}, ${C.sky})`,
            ["--tw-ring-color" as string]: C.violet,
            ["--tw-ring-offset-color" as string]: C.bg,
          }}
        >
          <Plus size={14} aria-hidden="true" /> Toevoegen
        </button>
      </div>

      <div className="relative">
        <Orb
          size={200}
          color={C.cyan}
          depth={30}
          style={{ bottom: "-2rem", right: "3rem", opacity: 0.5 }}
        />
        <Card className="relative overflow-hidden">
          <div className="relative flex flex-wrap items-center gap-6 p-6">
            <span
              className="relative flex h-28 w-28 shrink-0 items-center justify-center rounded-full"
              style={{
                background: `conic-gradient(${C.violet} 0deg, ${C.sky} ${dek * 1.8}deg, ${C.cyan} ${dek * 3.6}deg, ${C.line} ${dek * 3.6}deg 360deg)`,
              }}
              aria-hidden="true"
            >
              <span
                className="absolute inset-[9px] flex flex-col items-center justify-center rounded-full"
                style={{ background: C.card }}
              >
                <span
                  className="text-[30px] font-bold leading-none"
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
              <div className="text-[16px] font-bold" style={{ ...display, color: C.ink }}>
                {verified}/{CREDENTIALS.length} geverifieerd
              </div>
              <p
                className="mt-1 text-[13px] leading-relaxed"
                style={{ ...bodyF, color: C.inkSoft }}
              >
                Elk geverifieerd document tilt je profiel een laag naar voren — meer vertrouwen bij
                opdrachtgevers. Houd je dekking zo hoog mogelijk.
              </p>
              <span
                className="mt-3 inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[11px] font-semibold"
                style={{ ...bodyF, background: C.okSoft, color: C.ok }}
              >
                <ShieldCheck size={12} strokeWidth={2} aria-hidden="true" /> {PROFIEL.trust}
              </span>
            </div>
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {CREDENTIALS.map((c) => {
          const m = credMeta(c.status);
          const actionable = c.status !== "VERIFIED";
          return (
            <Card key={c.naam} interactive className="flex items-center gap-3.5 p-4">
              <span
                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl"
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
                      className="rounded-full px-2.5 py-1 text-[11px] font-semibold transition-transform hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-1"
                      style={{
                        ...bodyF,
                        background: C.cardSoft,
                        color: C.ink,
                        ["--tw-ring-color" as string]: C.violet,
                        ["--tw-ring-offset-color" as string]: C.card,
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
                  style={{
                    background: warn
                      ? `linear-gradient(${C.warn}, ${C.amber})`
                      : `linear-gradient(${C.violet}, ${C.sky})`,
                  }}
                  aria-hidden="true"
                />
                <div className="flex min-w-0 flex-1 items-center gap-4 p-5">
                  <span
                    className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-[16px] font-bold tabular-nums"
                    style={{
                      ...display,
                      background: warn ? C.warnSoft : C.cardSoft,
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
                          <Sparkles size={10} strokeWidth={2.4} aria-hidden="true" />
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
                      className="mt-3 inline-flex items-center gap-2 rounded-full px-4 py-2 text-[12px] font-semibold text-white transition-transform hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
                      style={{
                        ...bodyF,
                        background: warn
                          ? C.warn
                          : `linear-gradient(135deg, ${C.violet}, ${C.sky})`,
                        ["--tw-ring-color" as string]: warn ? C.warn : C.violet,
                        ["--tw-ring-offset-color" as string]: C.card,
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
        <Card className="overflow-hidden">
          {BERICHTEN.map((b, i) => (
            <div
              key={b.van}
              className="flex items-center gap-3 p-4"
              style={i === 0 ? undefined : { borderTop: `1px solid ${C.line}` }}
            >
              <span
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-[11px] font-bold"
                style={{
                  ...display,
                  background: `linear-gradient(135deg, ${C.violet}, ${C.magenta})`,
                  color: C.white,
                }}
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
                      style={{ background: C.magenta }}
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
        <button
          className="inline-flex items-center gap-2 rounded-full px-4 py-2 text-[12px] font-semibold text-white transition-transform hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
          style={{
            ...bodyF,
            background: `linear-gradient(135deg, ${C.violet}, ${C.sky})`,
            ["--tw-ring-color" as string]: C.violet,
            ["--tw-ring-offset-color" as string]: C.bg,
          }}
        >
          <Plus size={14} aria-hidden="true" /> Nieuwe factuur
        </button>
      </div>

      {!dismissed && (
        <div
          className="flex flex-wrap items-center gap-3 rounded-2xl p-3.5"
          style={{ background: C.dangerSoft, border: `1px solid ${C.danger}33` }}
          role="alert"
        >
          <span
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl"
            style={{ background: C.white }}
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
            className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[12px] font-semibold text-white transition-transform hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
            style={{
              ...bodyF,
              background: C.danger,
              ["--tw-ring-color" as string]: C.danger,
              ["--tw-ring-offset-color" as string]: C.bg,
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
        ].map((s, i) => (
          <Layer key={s.l} depth={(i - 1) * 5} className="[&_*]:pointer-events-auto">
            <Card interactive className="p-4">
              <div
                className="h-1.5 w-10 rounded-full"
                style={{ background: `linear-gradient(90deg, ${C.violet}, ${C.cyan})` }}
                aria-hidden="true"
              />
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
          </Layer>
        ))}
      </div>

      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[520px] text-left">
            <thead>
              <tr style={{ background: C.cardSoft }}>
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
                    className="transition-colors hover:bg-[#eef2ff]"
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
              <tr style={{ background: C.panelHi }}>
                <td
                  colSpan={4}
                  className="px-4 py-3 text-[11px] font-medium uppercase tracking-[0.1em]"
                  style={{ ...mono, color: C.onDarkFaint }}
                >
                  Totaal betaald
                </td>
                <td
                  className="px-4 py-3 text-right text-[17px] font-bold tabular-nums"
                  style={{ ...display, color: C.cyan }}
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
