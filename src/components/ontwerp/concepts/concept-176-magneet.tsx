"use client";

// Concept 176 — "Magneet" · magnetische micro-interacties / micro-delight. 2026-trend:
// micro-interactions & magnetic cursor. Knoppen en kaarten "trekken" naar de cursor toe (magnetic
// hover: transform-translate o.b.v. onMouseMove binnen het element) en snappen bevredigend terug bij
// vertrek (veerachtige easing). Focus voelt magnetisch, elke interactie voelt levendig — maar strak
// en beheerst. Onderscheidt zich van kinetiek (kinetische typografie): dit draait om magnetische
// aantrekkings-microinteracties op UI-elementen, niet om bewegend type. Deterministisch — de
// verschuiving volgt exact de cursor, geen random/Date. Status nooit kleur-alleen: label + icoon.
// UI-taal Nederlands. Fonts: Bricolage Grotesque (display) + Plus Jakarta Sans (tekst) + Spline Mono.

import { useEffect, useRef, useState } from "react";
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
  Magnet,
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

// ── Palet — strak licht met een levendig-beheerst elektrisch accent ────────────────
const C = {
  bg: "#f4f5f9", // koel licht (basis)
  bgDeep: "#eaecf4", // secundair vlak
  card: "#ffffff", // content-kaart
  ink: "#12131f", // bijna-zwart
  inkSoft: "#4c5064", // secundaire tekst
  inkFaint: "#868aa0", // labels
  line: "#e5e7f0", // fijne rand
  // Elektrisch-magnetisch accentpalet (levendig, beheerst)
  volt: "#4b3bff", // elektrisch indigo (merk-accent)
  voltSoft: "#e7e5ff",
  spring: "#00b894", // fris groen
  springSoft: "#d6f5ec",
  coral: "#ff5a6e", // koraal
  coralSoft: "#ffe1e5",
  amber: "#f5a623", // amber
  amberSoft: "#fdeecf",
  sky: "#1f8bff",
  skySoft: "#dcecff",
  // Semantisch (status)
  ok: "#0e9e78",
  okSoft: "#d6f5ec",
  warn: "#b9770f",
  warnSoft: "#fdeecf",
  info: "#2f61e0",
  infoSoft: "#e2e9fc",
  danger: "#d83852",
  dangerSoft: "#ffe1e5",
  white: "#ffffff",
};

const display = { fontFamily: "var(--font-lab-bricolage)" };
const bodyF = { fontFamily: "var(--font-lab-jakarta)" };
const mono = { fontFamily: "var(--font-lab-spline-mono)" };

// Veerachtige terugsnap-easing.
const SNAP = "transform 380ms cubic-bezier(0.34,1.56,0.64,1)";
const PULL = "transform 90ms linear";

// ── Magnetisch wrapper-element — trekt naar de cursor, snapt terug bij vertrek ──────
function Magnetic({
  children,
  strength = 0.28,
  className = "",
  style,
  radius = 1.6,
}: {
  children: React.ReactNode;
  strength?: number;
  className?: string;
  style?: React.CSSProperties;
  radius?: number; // hoe ver de aantrekking mag reiken (× halve breedte)
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [t, setT] = useState<{ x: number; y: number; on: boolean }>({ x: 0, y: 0, on: false });

  const onMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const el = ref.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const cx = r.left + r.width / 2;
    const cy = r.top + r.height / 2;
    const dx = e.clientX - cx;
    const dy = e.clientY - cy;
    // Begrens de verschuiving zodat de aantrekking beheerst blijft.
    const maxX = (r.width / 2) * radius;
    const maxY = (r.height / 2) * radius;
    setT({
      x: Math.max(-maxX, Math.min(maxX, dx)) * strength,
      y: Math.max(-maxY, Math.min(maxY, dy)) * strength,
      on: true,
    });
  };
  const reset = () => setT({ x: 0, y: 0, on: false });

  return (
    <div
      ref={ref}
      onMouseMove={onMove}
      onMouseLeave={reset}
      className={className}
      style={{
        ...style,
        transform: `translate3d(${t.x.toFixed(2)}px, ${t.y.toFixed(2)}px, 0)`,
        transition: t.on ? PULL : SNAP,
        willChange: "transform",
      }}
    >
      {children}
    </div>
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

function Card({
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
      className={`rounded-2xl ${className}`}
      style={{
        background: C.card,
        border: `1px solid ${C.line}`,
        boxShadow: "0 1px 2px rgba(18,19,31,0.04)",
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
  Icon = Magnet,
}: {
  title: string;
  sub?: string;
  Icon?: LucideIcon;
}) {
  return (
    <div className="flex items-center gap-3">
      <Magnetic strength={0.5}>
        <span
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl"
          style={{ background: C.voltSoft }}
          aria-hidden="true"
        >
          <Icon size={18} strokeWidth={2} style={{ color: C.volt }} />
        </span>
      </Magnetic>
      <div className="min-w-0">
        <h2
          className="text-[19px] font-bold leading-none tracking-[-0.02em]"
          style={{ ...display, color: C.ink }}
        >
          {title}
        </h2>
        {sub && (
          <p className="mt-1.5 text-[12px]" style={{ ...bodyF, color: C.inkFaint }}>
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

function MatchRing({ value, size = 56 }: { value: number; size?: number }) {
  const deg = (value / 100) * 360;
  return (
    <span
      className="relative flex shrink-0 items-center justify-center rounded-full"
      style={{
        width: size,
        height: size,
        background: `conic-gradient(${C.volt} 0deg, ${C.sky} ${deg * 0.6}deg, ${C.spring} ${deg}deg, ${C.line} ${deg}deg 360deg)`,
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
            background: i === data.length - 1 ? C.volt : `${C.ink}1e`,
          }}
        />
      ))}
    </div>
  );
}

// Magnetische primaire knop.
function MagButton({
  children,
  onClick,
  tone = "volt",
  className = "",
  ariaLabel,
}: {
  children: React.ReactNode;
  onClick?: () => void;
  tone?: "volt" | "ink" | "soft" | "warn";
  className?: string;
  ariaLabel?: string;
}) {
  const map = {
    volt: { bg: C.volt, fg: C.white, ring: C.volt },
    ink: { bg: C.ink, fg: C.white, ring: C.volt },
    soft: { bg: C.bgDeep, fg: C.ink, ring: C.volt },
    warn: { bg: C.warn, fg: C.white, ring: C.warn },
  }[tone];
  return (
    <Magnetic strength={0.4}>
      <button
        onClick={onClick}
        aria-label={ariaLabel}
        className={`inline-flex items-center justify-center gap-2 rounded-full px-5 py-2.5 text-[13px] font-semibold transition-[filter] duration-150 hover:brightness-[1.06] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 active:brightness-95 ${className}`}
        style={{
          ...bodyF,
          background: map.bg,
          color: map.fg,
          ["--tw-ring-color" as string]: map.ring,
          ["--tw-ring-offset-color" as string]: C.bg,
        }}
      >
        {children}
      </button>
    </Magnetic>
  );
}

// ── Root ─────────────────────────────────────────────────────────────────────────
export function Concept176() {
  const [screen, setScreen] = useState<ScreenKey>("dashboard");
  const [loading, setLoading] = useState(true);
  const active = OPDRACHTEN[0] as Opdracht;

  useEffect(() => {
    const t = setTimeout(() => setLoading(false), 720);
    return () => clearTimeout(t);
  }, []);

  const reload = () => {
    setLoading(true);
    setTimeout(() => setLoading(false), 720);
  };

  return (
    <div
      className="min-h-screen w-full overflow-x-hidden antialiased"
      style={{ ...bodyF, color: C.ink, background: C.bg }}
    >
      <header
        className="relative"
        style={{ background: C.card, borderBottom: `1px solid ${C.line}` }}
      >
        <div className="relative mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-4 py-5 md:px-8">
          <div className="flex items-center gap-3.5">
            <Magnetic strength={0.55}>
              <span
                className="flex h-11 w-11 items-center justify-center rounded-2xl"
                style={{
                  background: `linear-gradient(135deg, ${C.volt}, ${C.sky})`,
                  boxShadow: "0 10px 24px -10px rgba(75,59,255,0.6)",
                }}
                aria-hidden="true"
              >
                <Magnet size={21} strokeWidth={2} style={{ color: C.white }} />
              </span>
            </Magnetic>
            <div className="leading-tight">
              <div
                className="text-[10px] font-semibold uppercase tracking-[0.32em]"
                style={{ ...mono, color: C.volt }}
              >
                Magneet
              </div>
              <div
                className="text-[24px] font-bold leading-none tracking-[-0.02em]"
                style={{ ...display, color: C.ink }}
              >
                Aantrek
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
              className="hidden items-center gap-1.5 rounded-full px-3 py-1.5 text-[11px] font-semibold sm:inline-flex"
              style={{ ...bodyF, background: C.springSoft, color: C.ok }}
            >
              <ShieldCheck size={12} strokeWidth={2} aria-hidden="true" /> {PROFIEL.trust}
            </span>
            <Magnetic strength={0.5}>
              <span
                className="flex h-11 w-11 items-center justify-center rounded-2xl text-[12px] font-bold"
                style={{
                  ...display,
                  background: `linear-gradient(135deg, ${C.coral}, ${C.volt})`,
                  color: C.white,
                }}
                aria-hidden="true"
              >
                {PROFIEL.initialen}
              </span>
            </Magnetic>
          </div>
        </div>

        <nav
          className="relative mx-auto flex max-w-6xl items-center gap-1.5 overflow-x-auto px-4 pb-4 md:px-8"
          aria-label="Schermen"
        >
          {SCREENS.map((s) => {
            const on = s.key === screen;
            return (
              <Magnetic key={s.key} strength={0.35}>
                <button
                  onClick={() => setScreen(s.key)}
                  aria-current={on ? "page" : undefined}
                  className="shrink-0 rounded-full px-3.5 py-1.5 text-[12.5px] font-semibold transition-[filter] hover:brightness-[1.03] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
                  style={{
                    ...bodyF,
                    background: on ? C.volt : C.bgDeep,
                    color: on ? C.white : C.inkSoft,
                    boxShadow: on ? "0 8px 18px -8px rgba(75,59,255,0.6)" : "none",
                    ["--tw-ring-color" as string]: C.volt,
                    ["--tw-ring-offset-color" as string]: C.card,
                  }}
                >
                  {s.label}
                </button>
              </Magnetic>
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

// ── Skeleton (laadstaat) ─────────────────────────────────────────────────────────
function SkeletonBlock({ className = "" }: { className?: string }) {
  return (
    <div
      className={`animate-pulse rounded-2xl ${className}`}
      style={{ background: C.bgDeep, border: `1px solid ${C.line}` }}
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
      <Card
        className="relative overflow-hidden"
        style={{ background: `linear-gradient(135deg, ${C.card}, ${C.voltSoft}66)` }}
      >
        <div className="relative max-w-xl p-6 sm:p-8">
          <span
            className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold"
            style={{ ...bodyF, background: C.voltSoft, color: C.volt }}
          >
            <Sparkles size={12} strokeWidth={2.2} aria-hidden="true" /> {PROFIEL.rol}
          </span>
          <h1
            className="mt-3 text-[30px] font-bold leading-[1.05] tracking-[-0.03em] sm:text-[40px]"
            style={{ ...display, color: C.ink }}
          >
            Drie matches boven 85%. Je omzet trekt mee omhoog.
          </h1>
          <p
            className="mt-3 max-w-lg text-[14px] leading-relaxed"
            style={{ ...bodyF, color: C.inkSoft }}
          >
            Eén ding vraagt aandacht: je VOG verloopt binnenkort. Regel het en houd je profiel
            magnetisch aantrekkelijk en geverifieerd.
          </p>
          <div className="mt-5 flex flex-wrap items-center gap-3">
            <MagButton onClick={onOpen} tone="volt">
              Bekijk matches <ArrowRight size={15} aria-hidden="true" />
            </MagButton>
            <MagButton onClick={onActies} tone="soft">
              <TriangleAlert
                size={14}
                strokeWidth={2.2}
                style={{ color: C.warn }}
                aria-hidden="true"
              />{" "}
              Los actie op
            </MagButton>
            <Magnetic strength={0.5}>
              <button
                onClick={onReload}
                aria-label="Dashboard opnieuw laden"
                className="inline-flex h-10 w-10 items-center justify-center rounded-full transition-[filter] hover:brightness-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
                style={{
                  background: C.bgDeep,
                  ["--tw-ring-color" as string]: C.volt,
                  ["--tw-ring-offset-color" as string]: C.bg,
                }}
              >
                <RefreshCw
                  size={16}
                  strokeWidth={2}
                  style={{ color: C.inkSoft }}
                  aria-hidden="true"
                />
              </button>
            </Magnetic>
          </div>
        </div>
      </Card>

      {/* KPI-kaarten — elk magnetisch */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {KPIS.map((k) => (
          <Magnetic key={k.label} strength={0.16} radius={1}>
            <Card className="p-4 transition-shadow duration-200 hover:shadow-[0_18px_40px_-20px_rgba(75,59,255,0.45)]">
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
          </Magnetic>
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
              <Magnetic key={o.id} strength={0.1} radius={0.8}>
                <Card className="overflow-hidden transition-shadow duration-200 hover:shadow-[0_18px_40px_-22px_rgba(18,19,31,0.4)]">
                  <button
                    onClick={onOpen}
                    className="flex w-full items-center gap-4 p-4 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset"
                    style={{ ["--tw-ring-color" as string]: C.volt }}
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
                            style={{ ...bodyF, background: C.bgDeep, color: C.inkSoft }}
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
              </Magnetic>
            ))}
          </div>
        </section>

        <section className="space-y-4">
          <SectionHead title="Vertrouwen" sub="Certificaat-dekking" Icon={ShieldCheck} />
          <Card className="p-5">
            <div className="flex items-center gap-5">
              <Magnetic strength={0.3}>
                <span
                  className="relative flex h-24 w-24 shrink-0 items-center justify-center rounded-full"
                  style={{
                    background: `conic-gradient(${C.spring} 0deg, ${C.sky} ${dek * 1.8}deg, ${C.volt} ${dek * 3.6}deg, ${C.line} ${dek * 3.6}deg 360deg)`,
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
              </Magnetic>
              <div>
                <StatusTag status="VERIFIED" />
                <p className="mt-2 text-[12.5px]" style={{ ...bodyF, color: C.inkSoft }}>
                  {verified}/{CREDENTIALS.length} certificaten geverifieerd. Opdrachtgevers zien
                  alleen geverifieerde documenten.
                </p>
              </div>
            </div>
          </Card>

          <Magnetic strength={0.12} radius={0.8}>
            <div className="relative overflow-hidden rounded-2xl p-5" style={{ background: C.ink }}>
              <span
                className="inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.1em]"
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
                style={{ ...bodyF, color: "rgba(255,255,255,0.72)" }}
              >
                {warn.detail}
              </p>
              <MagButton onClick={onActies} tone="volt" className="mt-4 !px-4 !py-2 !text-[12px]">
                {warn.cta} <ArrowRight size={13} aria-hidden="true" />
              </MagButton>
            </div>
          </Magnetic>
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
          style={{ background: C.card, border: `1px solid ${C.line}` }}
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
          <Magnetic strength={0.5}>
            <span
              className="flex h-16 w-16 items-center justify-center rounded-2xl"
              style={{ background: C.voltSoft }}
              aria-hidden="true"
            >
              <Inbox size={30} strokeWidth={1.7} style={{ color: C.volt }} />
            </span>
          </Magnetic>
          <p className="text-[19px] font-bold" style={{ ...display, color: C.ink }}>
            Geen match gevonden
          </p>
          <p className="max-w-xs text-[13px]" style={{ ...bodyF, color: C.inkSoft }}>
            Niets gevonden voor &ldquo;{q}&rdquo;. Pas je zoekterm aan en probeer opnieuw.
          </p>
          <MagButton onClick={() => setQ("")} tone="ink" className="mt-1">
            Zoekterm wissen
          </MagButton>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
          {filtered.map((o) => (
            <Magnetic key={o.id} strength={0.12} radius={0.9}>
              <Card className="flex h-full flex-col overflow-hidden transition-shadow duration-200 hover:shadow-[0_20px_44px_-22px_rgba(75,59,255,0.4)]">
                <div
                  className="h-1.5 w-full"
                  style={{ background: `linear-gradient(90deg, ${C.volt}, ${C.spring})` }}
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
                        style={{ ...bodyF, background: C.bgDeep, color: C.inkSoft }}
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
                    color: C.volt,
                    ["--tw-ring-color" as string]: C.volt,
                  }}
                >
                  Bekijk opdracht <ArrowRight size={14} aria-hidden="true" />
                </button>
              </Card>
            </Magnetic>
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
      <MagButton onClick={onBack} tone="soft" className="!px-3.5 !py-1.5 !text-[12px]">
        <ArrowLeft size={14} aria-hidden="true" /> Terug naar marktplaats
      </MagButton>

      <Card
        className="relative overflow-hidden"
        style={{ background: `linear-gradient(135deg, ${C.card}, ${C.voltSoft}55)` }}
      >
        <div className="relative flex flex-wrap items-center justify-between gap-5 p-6 sm:p-8">
          <div className="min-w-0">
            <span
              className="inline-block rounded-full px-2.5 py-1 text-[11px] font-semibold"
              style={{ ...mono, background: C.voltSoft, color: C.volt }}
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
          <Magnetic strength={0.35}>
            <MatchRing value={opdracht.match} size={82} />
          </Magnetic>
        </div>
      </Card>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {feiten.map((f) => (
          <Magnetic key={f.l} strength={0.18} radius={1}>
            <Card className="p-4 transition-shadow duration-200 hover:shadow-[0_16px_36px_-20px_rgba(75,59,255,0.4)]">
              <span
                className="flex h-8 w-8 items-center justify-center rounded-xl"
                style={{ background: C.voltSoft }}
                aria-hidden="true"
              >
                <f.Icon size={16} strokeWidth={2} style={{ color: C.volt }} />
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
          </Magnetic>
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
        <MagButton onClick={onBack} tone="volt" className="flex-1 !py-3.5">
          Reageer op deze opdracht <ArrowRight size={16} aria-hidden="true" />
        </MagButton>
        <MagButton tone="soft" className="!py-3.5">
          <Star size={15} strokeWidth={2} style={{ color: C.amber }} aria-hidden="true" /> Bewaar
        </MagButton>
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
        <MagButton tone="ink" className="!px-4 !py-2 !text-[12px]">
          <Plus size={14} aria-hidden="true" /> Toevoegen
        </MagButton>
      </div>

      <Card className="relative overflow-hidden">
        <div className="relative flex flex-wrap items-center gap-6 p-6">
          <Magnetic strength={0.28}>
            <span
              className="relative flex h-28 w-28 shrink-0 items-center justify-center rounded-full"
              style={{
                background: `conic-gradient(${C.volt} 0deg, ${C.sky} ${dek * 1.2}deg, ${C.spring} ${dek * 2.4}deg, ${C.coral} ${dek * 3.6}deg, ${C.line} ${dek * 3.6}deg 360deg)`,
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
          </Magnetic>
          <div className="max-w-sm">
            <div className="text-[16px] font-bold" style={{ ...display, color: C.ink }}>
              {verified}/{CREDENTIALS.length} geverifieerd
            </div>
            <p className="mt-1 text-[13px] leading-relaxed" style={{ ...bodyF, color: C.inkSoft }}>
              Elk geverifieerd document trekt meer vertrouwen aan bij opdrachtgevers. Houd je
              dekking zo hoog mogelijk.
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

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {CREDENTIALS.map((c) => {
          const m = credMeta(c.status);
          const actionable = c.status !== "VERIFIED";
          return (
            <Magnetic key={c.naam} strength={0.1} radius={0.8}>
              <Card className="flex items-center gap-3.5 p-4 transition-shadow duration-200 hover:shadow-[0_16px_36px_-22px_rgba(18,19,31,0.4)]">
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
                        className="rounded-full px-2.5 py-1 text-[11px] font-semibold transition-[filter] hover:brightness-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-1"
                        style={{
                          ...bodyF,
                          background: C.bgDeep,
                          color: C.ink,
                          ["--tw-ring-color" as string]: C.volt,
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
            </Magnetic>
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
              <Magnetic strength={0.08} radius={0.7}>
                <Card className="flex items-stretch overflow-hidden transition-shadow duration-200 hover:shadow-[0_18px_40px_-22px_rgba(18,19,31,0.4)]">
                  <span
                    className="w-1.5 shrink-0"
                    style={{
                      background: warn
                        ? `linear-gradient(${C.warn}, ${C.amber})`
                        : `linear-gradient(${C.volt}, ${C.spring})`,
                    }}
                    aria-hidden="true"
                  />
                  <div className="flex min-w-0 flex-1 items-center gap-4 p-5">
                    <span
                      className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-[16px] font-bold tabular-nums"
                      style={{
                        ...display,
                        background: warn ? C.warnSoft : C.bgDeep,
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
                      <MagButton
                        tone={warn ? "warn" : "ink"}
                        className="mt-3 !px-4 !py-2 !text-[12px]"
                      >
                        {a.cta} <ArrowRight size={13} aria-hidden="true" />
                      </MagButton>
                    </div>
                  </div>
                </Card>
              </Magnetic>
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
                  background: `linear-gradient(135deg, ${C.volt}, ${C.coral})`,
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
                      style={{ background: C.coral }}
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
        <MagButton tone="ink" className="!px-4 !py-2 !text-[12px]">
          <Plus size={14} aria-hidden="true" /> Nieuwe factuur
        </MagButton>
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
          <MagButton
            onClick={() => setDismissed(true)}
            tone="warn"
            className="!bg-[#d83852] !px-3 !py-1.5 !text-[12px]"
          >
            <RefreshCw size={13} strokeWidth={2.2} aria-hidden="true" /> Opnieuw proberen
          </MagButton>
        </div>
      )}

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
        {[
          { l: "Betaald (mnd)", v: betaald },
          { l: "Openstaand", v: `${open}` },
          { l: "Te factureren", v: "€ 1.350" },
        ].map((s) => (
          <Magnetic key={s.l} strength={0.18} radius={1}>
            <Card className="p-4 transition-shadow duration-200 hover:shadow-[0_16px_36px_-20px_rgba(75,59,255,0.4)]">
              <div
                className="h-1.5 w-10 rounded-full"
                style={{ background: `linear-gradient(90deg, ${C.volt}, ${C.spring})` }}
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
          </Magnetic>
        ))}
      </div>

      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[520px] text-left">
            <thead>
              <tr style={{ background: C.bgDeep }}>
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
                    className="transition-colors hover:bg-[#f4f5f9]"
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
              <tr style={{ background: C.ink }}>
                <td
                  colSpan={4}
                  className="px-4 py-3 text-[11px] font-medium uppercase tracking-[0.1em]"
                  style={{ ...mono, color: "rgba(255,255,255,0.6)" }}
                >
                  Totaal betaald
                </td>
                <td
                  className="px-4 py-3 text-right text-[17px] font-bold tabular-nums"
                  style={{ ...display, color: C.spring }}
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
