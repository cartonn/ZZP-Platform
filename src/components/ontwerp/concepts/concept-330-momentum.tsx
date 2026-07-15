"use client";

// Concept 330 — "Momentum" · prestatie-/sportdata-energie voor je zelfstandige praktijk.
// Een prestatie-dashboard-gevoel: grote krachtige cijfers, voortgangsringen, streak-bars en een
// "je bent op koers"-energie. Matching-score, omzet-momentum en verificatie-voortgang worden getoond
// als prestaties die je vooruit stuwen — motiverend, geordend, zonder gimmick. Voor gevoelige
// documenten telt vertrouwen: verificatie voelt als een prestatie die je opbouwt, met heldere
// statuschips (label + icoon) en verklaarbare matching. Fris licht palet, één energiek limoen-accent.
// Fonts: --font-lab-space (koppen, sportief-geometrisch) + --font-lab-mono (cijfers) + --font-lab-inter (tekst).

import { useEffect, useState } from "react";
import {
  LayoutDashboard,
  Store,
  Briefcase,
  ShieldCheck,
  ListTodo,
  Receipt,
  Search,
  Bell,
  ChevronRight,
  ArrowUpRight,
  ArrowDownRight,
  ArrowRight,
  TrendingUp,
  Zap,
  Target,
  Flame,
  Check,
  Clock,
  AlertTriangle,
  XCircle,
  BadgeCheck,
  MapPin,
  Send,
  Plus,
  RotateCcw,
  CircleAlert,
  Trophy,
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

/* ---------- Palet (fris licht, energiek limoen) ---------- */

const C = {
  canvas: "#eef1ea",
  surface: "#ffffff",
  surfaceAlt: "#f6f8f2",
  ink: "#101613",
  inkSoft: "#2f3833",
  sub: "#586158",
  faint: "#98a196",
  line: "#e2e7dc",
  lineSoft: "#eef1e9",
  lime: "#4e9c0c", // limoen-tekst, WCAG-veilig op licht
  limeBright: "#9ee62b", // felle fill
  limeSoft: "#eef8dd",
  energy: "#f0530f", // energiek oranje-accent
  energySoft: "#feeadf",
  ok: "#128a3e",
  okSoft: "#e4f6ea",
  warn: "#b4600a",
  warnSoft: "#fbf0dd",
  alert: "#c62828",
  alertSoft: "#fbe7e6",
  info: "#1f6fd6",
  infoSoft: "#e6f0fc",
  ink900: "#0d1310",
};

const head = { fontFamily: "var(--font-lab-space), system-ui, sans-serif" };
const body = { fontFamily: "var(--font-lab-inter), system-ui, sans-serif" };
const mono = { fontFamily: "var(--font-lab-mono), ui-monospace, monospace" };

const RING =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4e9c0c] focus-visible:ring-offset-2 focus-visible:ring-offset-white";

/* ---------- Status → betekenis ---------- */

type Tone = { label: string; fg: string; soft: string; Icon: LucideIcon };

function credTone(s: CredStatus): Tone {
  switch (s) {
    case "VERIFIED":
      return { label: "Geverifieerd", fg: C.ok, soft: C.okSoft, Icon: BadgeCheck };
    case "SUBMITTED":
      return { label: "In beoordeling", fg: C.info, soft: C.infoSoft, Icon: Clock };
    case "EXPIRING":
      return { label: "Verloopt", fg: C.warn, soft: C.warnSoft, Icon: AlertTriangle };
    case "REJECTED":
      return { label: "Afgewezen", fg: C.alert, soft: C.alertSoft, Icon: XCircle };
  }
}

function factuurTone(status: string): { fg: string; soft: string } {
  if (status === "Betaald") return { fg: C.ok, soft: C.okSoft };
  if (status === "Openstaand") return { fg: C.warn, soft: C.warnSoft };
  return { fg: C.faint, soft: C.lineSoft };
}

function euros(v: string): number {
  const only = v.replace(/[^\d]/g, "");
  return only ? parseInt(only, 10) : 0;
}

const NAV_ICONS: Record<ScreenKey, LucideIcon> = {
  dashboard: LayoutDashboard,
  marktplaats: Store,
  opdracht: Briefcase,
  verificatie: ShieldCheck,
  acties: ListTodo,
  facturen: Receipt,
  documenten: Receipt,
  berichten: Bell,
};

/* ---------- Bouwstenen ---------- */

function StatusPill({ status }: { status: CredStatus }) {
  const t = credTone(status);
  const Icon = t.Icon;
  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold"
      style={{ ...body, color: t.fg, background: t.soft }}
    >
      <Icon size={12} strokeWidth={2.4} aria-hidden="true" />
      {t.label}
    </span>
  );
}

// Grote prestatie-sparkline met area-fill (performance-curve).
function PerfChart({
  data,
  color,
  height = 96,
}: {
  data: number[];
  color: string;
  height?: number;
}) {
  const w = 320;
  const h = height;
  const min = Math.min(...data);
  const max = Math.max(...data);
  const span = max - min || 1;
  const id = `mo-${color.replace("#", "")}-${height}`;
  const pts = data.map((v, i) => {
    const x = (i / (data.length - 1)) * w;
    const y = h - ((v - min) / span) * (h - 14) - 8;
    return [x, y] as const;
  });
  const line = pts
    .map((p, i) => `${i === 0 ? "M" : "L"}${p[0].toFixed(1)} ${p[1].toFixed(1)}`)
    .join(" ");
  const area = `${line} L${w} ${h} L0 ${h} Z`;
  const last = pts[pts.length - 1];
  return (
    <svg
      viewBox={`0 0 ${w} ${h}`}
      preserveAspectRatio="none"
      className="w-full"
      style={{ height }}
      aria-hidden="true"
    >
      <defs>
        <linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.30" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={area} fill={`url(#${id})`} />
      <path
        d={line}
        fill="none"
        stroke={color}
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {last && (
        <>
          <circle cx={last[0]} cy={last[1]} r="4.5" fill={color} />
          <circle cx={last[0]} cy={last[1]} r="8" fill={color} fillOpacity="0.2" />
        </>
      )}
    </svg>
  );
}

function MiniSpark({ data, color }: { data: number[]; color: string }) {
  const w = 84;
  const h = 26;
  const min = Math.min(...data);
  const max = Math.max(...data);
  const span = max - min || 1;
  const pts = data
    .map((v, i) => {
      const x = (i / (data.length - 1)) * w;
      const y = h - ((v - min) / span) * (h - 4) - 2;
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(" ");
  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} aria-hidden="true">
      <polyline
        points={pts}
        fill="none"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

// Voortgangsring — de kern van de prestatie-taal.
function ProgressRing({
  value,
  size = 68,
  color = C.lime,
  label,
}: {
  value: number;
  size?: number;
  color?: string;
  label?: string;
}) {
  const stroke = size >= 90 ? 8 : 6;
  const r = size / 2 - stroke;
  const circ = 2 * Math.PI * r;
  return (
    <span
      className="relative flex shrink-0 items-center justify-center"
      style={{ width: size, height: size }}
      aria-hidden="true"
    >
      <svg width={size} height={size} className="absolute inset-0 -rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={C.line}
          strokeWidth={stroke}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={color}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={circ}
          strokeDashoffset={circ * (1 - value / 100)}
        />
      </svg>
      <span className="flex flex-col items-center leading-none">
        <span
          className="font-bold tabular-nums"
          style={{ ...mono, color: C.ink, fontSize: size >= 90 ? 22 : 15 }}
        >
          {value}
        </span>
        {label && (
          <span
            className="mt-0.5 text-[8px] font-semibold uppercase tracking-wide"
            style={{ color: C.faint }}
          >
            {label}
          </span>
        )}
      </span>
    </span>
  );
}

// Streak-bars: momentum-energie per periode.
function StreakBars({ data, color }: { data: number[]; color: string }) {
  const max = Math.max(...data) || 1;
  return (
    <div className="flex items-end gap-1" style={{ height: 40 }} aria-hidden="true">
      {data.map((v, i) => {
        const on = i === data.length - 1;
        return (
          <span
            key={i}
            className="w-2 rounded-full"
            style={{
              height: `${Math.max(10, (v / max) * 100)}%`,
              background: on ? color : `${color}55`,
            }}
          />
        );
      })}
    </div>
  );
}

function PageHead({
  kicker,
  title,
  sub,
  right,
}: {
  kicker: string;
  title: string;
  sub?: string;
  right?: React.ReactNode;
}) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-4 px-6 pb-2 pt-6">
      <div className="min-w-0">
        <p
          className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-[0.2em]"
          style={{ ...mono, color: C.lime }}
        >
          {kicker}
        </p>
        <h1
          className="mt-1 text-[27px] font-bold leading-none tracking-tight"
          style={{ ...head, color: C.ink }}
        >
          {title}
        </h1>
        {sub && (
          <p className="mt-1.5 text-[13px]" style={{ color: C.sub }}>
            {sub}
          </p>
        )}
      </div>
      {right}
    </div>
  );
}

/* ---------- Hoofdcomponent ---------- */

export function Concept330() {
  const [screen, setScreen] = useState<ScreenKey>("dashboard");
  const [activeId, setActiveId] = useState<string>(OPDRACHTEN[0]?.id ?? "");
  const active = OPDRACHTEN.find((o) => o.id === activeId) ?? (OPDRACHTEN[0] as Opdracht);

  const open = (id?: string) => {
    if (id) setActiveId(id);
    setScreen("opdracht");
  };

  const [ready, setReady] = useState(false);
  useEffect(() => {
    setReady(false);
    const t = window.setTimeout(() => setReady(true), 340);
    return () => window.clearTimeout(t);
  }, [screen]);

  return (
    <div
      className="min-h-[680px] w-full antialiased"
      style={{ ...body, background: C.canvas, color: C.ink }}
    >
      <style>{`@keyframes mo-fade{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}
      @keyframes mo-pulse{0%,100%{opacity:.5}50%{opacity:.85}}`}</style>

      {/* Top-nav (horizontaal, atletisch) */}
      <header className="border-b" style={{ borderColor: C.line, background: C.surface }}>
        <div className="flex h-14 items-center gap-3 px-5">
          <div
            className="flex h-8 w-8 items-center justify-center rounded-lg text-[14px] font-bold"
            style={{ ...head, color: C.ink900, background: C.limeBright }}
            aria-hidden="true"
          >
            Z
          </div>
          <span className="text-[15px] font-bold tracking-tight" style={head}>
            Momentum
          </span>
          <span
            className="ml-1 hidden rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide sm:inline"
            style={{ ...mono, background: C.limeSoft, color: C.lime }}
          >
            ZZP
          </span>

          <div className="ml-auto flex items-center gap-2">
            <button
              aria-label="Zoeken"
              className={`rounded-lg p-2 transition-colors hover:bg-[#f6f8f2] ${RING}`}
              style={{ border: `1px solid ${C.line}`, color: C.sub }}
            >
              <Search size={15} aria-hidden="true" />
            </button>
            <button
              aria-label="Meldingen"
              className={`relative rounded-lg p-2 transition-colors hover:bg-[#f6f8f2] ${RING}`}
              style={{ border: `1px solid ${C.line}`, color: C.sub }}
            >
              <Bell size={15} aria-hidden="true" />
              <span
                className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full"
                style={{ background: C.energy }}
                aria-hidden="true"
              />
            </button>
            <div className="ml-1 flex items-center gap-2.5">
              <div
                className="flex h-8 w-8 items-center justify-center rounded-full text-[11px] font-bold"
                style={{ ...mono, background: C.ink, color: C.limeBright }}
                aria-hidden="true"
              >
                {PROFIEL.initialen}
              </div>
              <div className="hidden leading-tight sm:block">
                <p className="text-[12.5px] font-semibold">{PROFIEL.naam}</p>
                <p
                  className="flex items-center gap-1 text-[10.5px] font-semibold"
                  style={{ color: C.ok }}
                >
                  <ShieldCheck size={11} strokeWidth={2.6} aria-hidden="true" /> {PROFIEL.trust}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Scherm-tabs */}
        <nav className="flex gap-1 overflow-x-auto px-3 pb-2" aria-label="Hoofdnavigatie">
          {SCREENS.map((s) => {
            const Icon = NAV_ICONS[s.key];
            const on = s.key === screen;
            return (
              <button
                key={s.key}
                onClick={() => setScreen(s.key)}
                aria-current={on ? "page" : undefined}
                className={`flex shrink-0 items-center gap-2 rounded-lg px-3 py-2 text-[12.5px] transition-colors ${RING}`}
                style={{
                  color: on ? C.ink : C.sub,
                  background: on ? C.limeSoft : "transparent",
                  border: `1px solid ${on ? `${C.lime}44` : "transparent"}`,
                  fontWeight: on ? 700 : 500,
                }}
              >
                <Icon size={15} aria-hidden="true" style={{ color: on ? C.lime : C.faint }} />
                {s.label}
              </button>
            );
          })}
        </nav>
      </header>

      {/* Content */}
      <div key={screen} className="mx-auto max-w-6xl" style={{ animation: "mo-fade 0.32s ease" }}>
        {!ready ? (
          <ScreenSkeleton />
        ) : (
          <>
            {screen === "dashboard" && <Dashboard onOpen={open} onGo={setScreen} />}
            {screen === "marktplaats" && <Marktplaats onOpen={open} />}
            {screen === "opdracht" && (
              <OpdrachtDetail opdracht={active} onBack={() => setScreen("marktplaats")} />
            )}
            {screen === "verificatie" && <Verificatie onGo={setScreen} />}
            {screen === "acties" && <Acties onGo={setScreen} />}
            {screen === "facturen" && <Facturen />}
          </>
        )}
      </div>
    </div>
  );
}

/* ---------- Skeleton ---------- */

function ScreenSkeleton() {
  return (
    <div className="px-6 py-6" role="status" aria-live="polite">
      <span className="sr-only">Scherm wordt geladen…</span>
      <div
        className="h-7 w-52 rounded-lg"
        style={{ background: C.surface, animation: "mo-pulse 1.3s infinite" }}
      />
      <div
        className="mt-6 h-44 rounded-3xl"
        style={{
          background: C.surface,
          border: `1px solid ${C.line}`,
          animation: "mo-pulse 1.3s infinite",
        }}
      />
      <div className="mt-4 grid grid-cols-2 gap-3 lg:grid-cols-4">
        {[0, 1, 2, 3].map((i) => (
          <div
            key={i}
            className="h-24 rounded-2xl"
            style={{
              background: C.surface,
              border: `1px solid ${C.line}`,
              animation: "mo-pulse 1.3s infinite",
            }}
          />
        ))}
      </div>
    </div>
  );
}

/* ---------- Dashboard ---------- */

function Dashboard({
  onOpen,
  onGo,
}: {
  onOpen: (id?: string) => void;
  onGo: (k: ScreenKey) => void;
}) {
  const [focus, setFocus] = useState(0); // welke KPI staat groot in de hero
  const [feed, setFeed] = useState<"error" | "loading" | "ok">("error");
  const hero = (KPIS[focus] ?? KPIS[0]) as (typeof KPIS)[number];
  const warn = ACTIES[0];
  const matchAvg = Math.round(OPDRACHTEN.reduce((s, o) => s + o.match, 0) / OPDRACHTEN.length);

  const retry = () => {
    setFeed("loading");
    window.setTimeout(() => setFeed("ok"), 700);
  };

  return (
    <div>
      <PageHead
        kicker="Je momentum"
        title={`Sterke koers, ${PROFIEL.naam.split(" ")[0]}`}
        sub="Je prestaties deze maand — cijfers, voortgang en wat je vooruit stuwt."
      />

      <div className="space-y-5 px-6 py-5">
        {/* Prestatie-hero */}
        <div
          className="overflow-hidden rounded-3xl"
          style={{ background: C.ink900, border: `1px solid ${C.ink}` }}
        >
          <div className="flex flex-wrap items-start justify-between gap-4 p-6">
            <div className="min-w-0">
              <p
                className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-[0.16em]"
                style={{ ...mono, color: C.limeBright }}
              >
                <Zap size={13} aria-hidden="true" /> {hero.label}
              </p>
              <p
                className="mt-2 text-[46px] font-bold tabular-nums leading-none"
                style={{ ...mono, color: "#ffffff" }}
              >
                {hero.value}
              </p>
              <p
                className="mt-2 flex items-center gap-2 text-[12.5px]"
                style={{ color: "#c3ccc2" }}
              >
                <span
                  className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-bold tabular-nums"
                  style={{
                    background: hero.up ? "rgba(158,230,43,0.18)" : "rgba(240,83,15,0.2)",
                    color: hero.up ? C.limeBright : "#ff9f6b",
                  }}
                >
                  {hero.up ? (
                    <ArrowUpRight size={12} aria-hidden="true" />
                  ) : (
                    <ArrowDownRight size={12} aria-hidden="true" />
                  )}
                  {hero.trend}
                </span>
                t.o.v. vorige periode · je bent op koers
              </p>
            </div>
            <ProgressRing value={matchAvg} size={92} color={C.limeBright} label="match" />
          </div>
          <div className="px-3 pb-3">
            <PerfChart data={hero.spark} color={C.limeBright} height={90} />
          </div>
          {/* KPI-kiezer */}
          <div
            className="flex gap-1 overflow-x-auto border-t p-2"
            style={{ borderColor: "rgba(255,255,255,0.08)" }}
            role="tablist"
            aria-label="Kies prestatie"
          >
            {KPIS.map((k, i) => {
              const on = i === focus;
              return (
                <button
                  key={k.label}
                  role="tab"
                  aria-selected={on}
                  onClick={() => setFocus(i)}
                  className={`flex flex-1 shrink-0 flex-col items-start gap-1 rounded-xl px-3 py-2 text-left transition-colors ${RING}`}
                  style={{ background: on ? "rgba(158,230,43,0.12)" : "transparent" }}
                >
                  <span
                    className="text-[10.5px] font-semibold"
                    style={{ color: on ? C.limeBright : "#98a196" }}
                  >
                    {k.label}
                  </span>
                  <span
                    className="text-[15px] font-bold tabular-nums"
                    style={{ ...mono, color: on ? "#fff" : "#c3ccc2" }}
                  >
                    {k.value}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Momentum-tegels */}
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          {KPIS.map((k) => (
            <div
              key={k.label}
              className="rounded-2xl p-4"
              style={{ background: C.surface, border: `1px solid ${C.line}` }}
            >
              <div className="flex items-center justify-between">
                <p className="text-[11px] font-medium" style={{ color: C.sub }}>
                  {k.label}
                </p>
                <span
                  className="inline-flex items-center gap-0.5 text-[10.5px] font-bold tabular-nums"
                  style={{ ...mono, color: k.up ? C.ok : C.energy }}
                >
                  {k.up ? (
                    <ArrowUpRight size={11} aria-hidden="true" />
                  ) : (
                    <ArrowDownRight size={11} aria-hidden="true" />
                  )}
                  {k.trend}
                </span>
              </div>
              <p
                className="mt-1.5 text-[22px] font-bold tabular-nums leading-none"
                style={{ ...mono, color: C.ink }}
              >
                {k.value}
              </p>
              <div className="mt-2.5">
                <MiniSpark data={k.spark} color={k.up ? C.lime : C.energy} />
              </div>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          {/* Volgende actie */}
          {warn && (
            <div
              className="rounded-2xl p-5 lg:col-span-2"
              style={{
                background: `linear-gradient(120deg, ${C.limeSoft}, ${C.surface})`,
                border: `1px solid ${C.lime}33`,
              }}
              role="alert"
            >
              <p
                className="flex items-center gap-1.5 text-[10.5px] font-bold uppercase tracking-[0.14em]"
                style={{ ...mono, color: C.lime }}
              >
                <Target size={13} aria-hidden="true" /> Volgende doel
              </p>
              <h2
                className="mt-2 text-[19px] font-bold leading-snug"
                style={{ ...head, color: C.ink }}
              >
                {warn.titel}
              </h2>
              <p className="mt-1.5 max-w-md text-[13px]" style={{ color: C.sub }}>
                {warn.detail}
              </p>
              <button
                onClick={() => onGo("verificatie")}
                className={`mt-4 inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-[13px] font-bold transition-transform active:scale-[0.98] ${RING}`}
                style={{ background: C.ink, color: C.limeBright }}
              >
                {warn.cta} <ArrowRight size={15} strokeWidth={2.6} aria-hidden="true" />
              </button>
            </div>
          )}

          {/* Streak / berichten met error→loading→ok */}
          <div
            className="rounded-2xl p-5"
            style={{ background: C.surface, border: `1px solid ${C.line}` }}
          >
            <div className="flex items-center justify-between">
              <h3
                className="flex items-center gap-1.5 text-[13px] font-bold"
                style={{ ...head, color: C.ink }}
              >
                <Flame size={15} style={{ color: C.energy }} aria-hidden="true" /> Reactie-streak
              </h3>
              <span
                className="text-[11px] font-bold tabular-nums"
                style={{ ...mono, color: C.energy }}
              >
                7 dagen
              </span>
            </div>
            <div className="mt-3">
              <StreakBars data={KPIS[1]?.spark ?? [3, 4, 4, 5, 6, 5, 7]} color={C.energy} />
            </div>
            <div className="mt-4 border-t pt-3" style={{ borderColor: C.lineSoft }}>
              <p
                className="mb-2 text-[11px] font-semibold uppercase tracking-wide"
                style={{ color: C.faint }}
              >
                Nieuwste bericht
              </p>
              {feed === "error" && (
                <div className="text-center" role="alert">
                  <CircleAlert
                    size={20}
                    className="mx-auto"
                    style={{ color: C.alert }}
                    aria-hidden="true"
                  />
                  <p className="mt-1.5 text-[12px]" style={{ color: C.sub }}>
                    Kon niet laden.
                  </p>
                  <button
                    onClick={retry}
                    className={`mt-2 inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-[12px] font-semibold transition-colors hover:bg-[#f6f8f2] ${RING}`}
                    style={{ border: `1px solid ${C.line}`, color: C.ink }}
                  >
                    <RotateCcw size={12} aria-hidden="true" /> Opnieuw
                  </button>
                </div>
              )}
              {feed === "loading" && (
                <div className="space-y-2" role="status" aria-live="polite">
                  <span className="sr-only">Laden…</span>
                  <span
                    className="block h-3 rounded-full"
                    style={{
                      background: C.lineSoft,
                      width: "60%",
                      animation: "mo-pulse 1.3s infinite",
                    }}
                  />
                  <span
                    className="block h-3 rounded-full"
                    style={{
                      background: C.lineSoft,
                      width: "85%",
                      animation: "mo-pulse 1.3s infinite",
                    }}
                  />
                </div>
              )}
              {feed === "ok" && (
                <div>
                  <p className="text-[12.5px] font-semibold" style={{ color: C.ink }}>
                    Thuiszorg De Linde
                  </p>
                  <p className="mt-0.5 text-[11.5px]" style={{ color: C.sub }}>
                    Top, we plannen je graag in voor de avonddienst per 1 juli.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Beste matches */}
        <div>
          <div className="mb-3 flex items-center justify-between">
            <h2
              className="flex items-center gap-2 text-[16px] font-bold"
              style={{ ...head, color: C.ink }}
            >
              <TrendingUp size={17} style={{ color: C.lime }} aria-hidden="true" /> Top-matches
            </h2>
            <button
              onClick={() => onGo("marktplaats")}
              className={`inline-flex items-center gap-1 rounded-lg px-2 py-1 text-[12.5px] font-bold ${RING}`}
              style={{ color: C.lime }}
            >
              Alles <ChevronRight size={14} aria-hidden="true" />
            </button>
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {OPDRACHTEN.map((o) => (
              <button
                key={o.id}
                onClick={() => onOpen(o.id)}
                className={`rounded-2xl p-4 text-left transition-colors hover:border-[#4e9c0c55] ${RING}`}
                style={{ background: C.surface, border: `1px solid ${C.line}` }}
              >
                <div className="flex items-start justify-between">
                  <ProgressRing value={o.match} size={56} label="match" />
                  <span
                    className="text-[10px] font-semibold tabular-nums"
                    style={{ ...mono, color: C.faint }}
                  >
                    {o.id}
                  </span>
                </div>
                <p
                  className="mt-3 text-[14.5px] font-bold leading-snug"
                  style={{ ...head, color: C.ink }}
                >
                  {o.titel}
                </p>
                <p
                  className="mt-1 flex items-center gap-1 truncate text-[12px]"
                  style={{ color: C.sub }}
                >
                  <MapPin size={12} aria-hidden="true" /> {o.opdrachtgever} · {o.plaats}
                </p>
                <div className="mt-3 flex items-center justify-between">
                  <span
                    className="text-[13px] font-bold tabular-nums"
                    style={{ ...mono, color: C.lime }}
                  >
                    {o.tarief}
                  </span>
                  <span className="text-[11.5px]" style={{ color: C.faint }}>
                    {o.uren}
                  </span>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ---------- Marktplaats ---------- */

function Marktplaats({ onOpen }: { onOpen: (id?: string) => void }) {
  const [q, setQ] = useState("");
  const [sort, setSort] = useState<"match" | "tarief">("match");
  const filtered = OPDRACHTEN.filter(
    (o) =>
      o.titel.toLowerCase().includes(q.toLowerCase()) ||
      o.plaats.toLowerCase().includes(q.toLowerCase()) ||
      o.opdrachtgever.toLowerCase().includes(q.toLowerCase()),
  ).sort((a, b) => (sort === "match" ? b.match - a.match : euros(b.tarief) - euros(a.tarief)));

  return (
    <div>
      <PageHead
        kicker="De arena"
        title="Marktplaats"
        sub="Opdrachten gerangschikt op je prestatie-match — de sterkste kansen bovenaan."
        right={
          <div
            className="inline-flex items-center gap-0.5 rounded-xl p-0.5"
            style={{ background: C.surfaceAlt, border: `1px solid ${C.line}` }}
            role="tablist"
            aria-label="Sorteren"
          >
            {(["match", "tarief"] as const).map((s) => {
              const on = s === sort;
              return (
                <button
                  key={s}
                  role="tab"
                  aria-selected={on}
                  onClick={() => setSort(s)}
                  className={`rounded-lg px-3 py-1.5 text-[12px] font-bold transition-colors ${RING}`}
                  style={{
                    background: on ? C.surface : "transparent",
                    color: on ? C.ink : C.sub,
                    border: `1px solid ${on ? C.line : "transparent"}`,
                  }}
                >
                  {s === "match" ? "Match" : "Tarief"}
                </button>
              );
            })}
          </div>
        }
      />
      <div className="px-6 py-5">
        <div
          className="mb-4 flex items-center gap-2.5 rounded-xl px-3.5 py-2.5"
          style={{ background: C.surface, border: `1px solid ${C.line}` }}
        >
          <Search size={16} aria-hidden="true" style={{ color: C.faint }} />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Zoek op titel, plaats of opdrachtgever…"
            aria-label="Opdrachten zoeken"
            className="w-full bg-transparent text-[13.5px] outline-none"
            style={{ color: C.ink }}
          />
        </div>

        {filtered.length === 0 ? (
          <div
            className="flex flex-col items-center justify-center rounded-2xl px-6 py-16 text-center"
            style={{ border: `1px dashed ${C.line}`, background: C.surfaceAlt }}
          >
            <span
              className="flex h-12 w-12 items-center justify-center rounded-2xl"
              style={{ background: C.surface, border: `1px solid ${C.line}` }}
              aria-hidden="true"
            >
              <Search size={20} style={{ color: C.faint }} />
            </span>
            <p className="mt-4 text-[15px] font-bold" style={{ ...head, color: C.ink }}>
              Geen opdrachten gevonden
            </p>
            <p className="mt-1 max-w-xs text-[12.5px]" style={{ color: C.sub }}>
              Niets komt overeen met “{q}”. Verbreed je zoekopdracht en blijf in beweging.
            </p>
            <button
              onClick={() => setQ("")}
              className={`mt-4 rounded-xl px-4 py-2 text-[12.5px] font-bold transition-colors hover:bg-[#f6f8f2] ${RING}`}
              style={{ border: `1px solid ${C.line}`, color: C.ink }}
            >
              Zoekopdracht wissen
            </button>
          </div>
        ) : (
          <ul className="space-y-3">
            {filtered.map((o, i) => (
              <li
                key={o.id}
                className="rounded-2xl p-4"
                style={{ background: C.surface, border: `1px solid ${C.line}` }}
              >
                <div className="flex flex-wrap items-start gap-4">
                  <div className="flex items-center gap-3">
                    <span
                      className="flex h-7 w-7 items-center justify-center rounded-full text-[12px] font-bold tabular-nums"
                      style={{
                        ...mono,
                        background: i === 0 ? C.limeSoft : C.surfaceAlt,
                        color: i === 0 ? C.lime : C.faint,
                      }}
                    >
                      {i + 1}
                    </span>
                    <ProgressRing value={o.match} size={58} label="match" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span
                        className="text-[10px] font-semibold tabular-nums"
                        style={{ ...mono, color: C.faint }}
                      >
                        {o.id}
                      </span>
                      {o.tags.map((t) => (
                        <span
                          key={t}
                          className="rounded-full px-2 py-0.5 text-[10.5px] font-semibold"
                          style={{ background: C.surfaceAlt, color: C.sub }}
                        >
                          {t}
                        </span>
                      ))}
                    </div>
                    <p className="mt-1 text-[15px] font-bold" style={{ ...head, color: C.ink }}>
                      {o.titel}
                    </p>
                    <p
                      className="mt-0.5 flex items-center gap-1 text-[12.5px]"
                      style={{ color: C.sub }}
                    >
                      <MapPin size={12} aria-hidden="true" /> {o.opdrachtgever} · {o.plaats}
                    </p>
                    <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-[12.5px]">
                      <span className="font-bold tabular-nums" style={{ ...mono, color: C.lime }}>
                        {o.tarief}
                      </span>
                      <span style={{ color: C.sub }}>{o.uren}</span>
                      <span style={{ color: C.sub }}>{o.start}</span>
                    </div>
                  </div>
                  <button
                    onClick={() => onOpen(o.id)}
                    className={`inline-flex items-center gap-1.5 self-center rounded-xl px-3.5 py-2 text-[12.5px] font-bold transition-transform active:scale-[0.98] ${RING}`}
                    style={{ background: C.ink, color: C.limeBright }}
                  >
                    Bekijk <ArrowRight size={14} strokeWidth={2.6} aria-hidden="true" />
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

/* ---------- Opdracht-detail ---------- */

function OpdrachtDetail({ opdracht, onBack }: { opdracht: Opdracht; onBack: () => void }) {
  const [state, setState] = useState<"idle" | "sending" | "sent">("idle");
  const react = () => {
    if (state !== "idle") return;
    setState("sending");
    window.setTimeout(() => setState("sent"), 850);
  };

  return (
    <div>
      <PageHead
        kicker={opdracht.id}
        title={opdracht.titel}
        sub={`${opdracht.opdrachtgever} · ${opdracht.plaats}`}
        right={
          <div className="flex items-center gap-2">
            <button
              onClick={onBack}
              className={`rounded-xl px-3.5 py-2 text-[12.5px] font-bold transition-colors hover:bg-[#f6f8f2] ${RING}`}
              style={{ border: `1px solid ${C.line}`, color: C.sub }}
            >
              Terug
            </button>
            <button
              onClick={react}
              disabled={state !== "idle"}
              aria-live="polite"
              className={`inline-flex items-center gap-2 rounded-xl px-4 py-2 text-[13px] font-bold transition-transform active:scale-[0.98] disabled:opacity-90 ${RING}`}
              style={{
                background: state === "sent" ? C.ok : C.ink,
                color: state === "sent" ? "#fff" : C.limeBright,
              }}
            >
              {state === "idle" && (
                <>
                  <Send size={15} strokeWidth={2.4} aria-hidden="true" /> Reageer nu
                </>
              )}
              {state === "sending" && "Versturen…"}
              {state === "sent" && (
                <>
                  <Check size={15} strokeWidth={3} aria-hidden="true" /> Verstuurd
                </>
              )}
            </button>
          </div>
        }
      />

      <div className="grid grid-cols-1 gap-5 px-6 py-5 lg:grid-cols-3">
        <div className="space-y-5 lg:col-span-2">
          {/* Kerncijfers */}
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {[
              { l: "Tarief", v: opdracht.tarief },
              { l: "Omvang", v: opdracht.uren },
              { l: "Start", v: opdracht.start },
              { l: "Match", v: `${opdracht.match}%` },
            ].map((m) => (
              <div
                key={m.l}
                className="rounded-2xl p-4"
                style={{ background: C.surface, border: `1px solid ${C.line}` }}
              >
                <p
                  className="text-[10.5px] font-bold uppercase tracking-[0.1em]"
                  style={{ ...mono, color: C.faint }}
                >
                  {m.l}
                </p>
                <p
                  className="mt-1.5 text-[17px] font-bold tabular-nums"
                  style={{ ...mono, color: C.ink }}
                >
                  {m.v}
                </p>
              </div>
            ))}
          </div>

          {/* Verklaarbare match */}
          <div
            className="rounded-2xl p-5"
            style={{ background: C.surface, border: `1px solid ${C.line}` }}
          >
            <h3 className="text-[16px] font-bold" style={{ ...head, color: C.ink }}>
              Waarom deze match
            </h3>
            <p className="mt-0.5 text-[12.5px]" style={{ color: C.sub }}>
              Transparant onderbouwd op basis van je geverifieerde profiel.
            </p>
            <div className="mt-4 grid grid-cols-1 gap-5 sm:grid-cols-2">
              <div>
                <p
                  className="flex items-center gap-1.5 text-[10.5px] font-bold uppercase tracking-[0.12em]"
                  style={{ ...mono, color: C.ok }}
                >
                  <Check size={13} strokeWidth={3} aria-hidden="true" /> Pluspunten
                </p>
                <ul className="mt-2.5 space-y-2">
                  {opdracht.redenen.plus.map((r) => (
                    <li
                      key={r}
                      className="flex items-start gap-2 text-[13px]"
                      style={{ color: C.ink }}
                    >
                      <span
                        className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full"
                        style={{ background: C.okSoft }}
                      >
                        <Check
                          size={11}
                          strokeWidth={3}
                          style={{ color: C.ok }}
                          aria-hidden="true"
                        />
                      </span>
                      {r}
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <p
                  className="flex items-center gap-1.5 text-[10.5px] font-bold uppercase tracking-[0.12em]"
                  style={{ ...mono, color: C.warn }}
                >
                  <AlertTriangle size={13} strokeWidth={2.6} aria-hidden="true" /> Aandachtspunten
                </p>
                <ul className="mt-2.5 space-y-2">
                  {opdracht.redenen.min.map((r) => (
                    <li
                      key={r}
                      className="flex items-start gap-2 text-[13px]"
                      style={{ color: C.sub }}
                    >
                      <span
                        className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full"
                        style={{ background: C.warnSoft }}
                      >
                        <AlertTriangle
                          size={10}
                          strokeWidth={2.6}
                          style={{ color: C.warn }}
                          aria-hidden="true"
                        />
                      </span>
                      {r}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <div
            className="rounded-2xl p-5"
            style={{ background: C.ink900, border: `1px solid ${C.ink}` }}
          >
            <div className="flex items-center gap-4">
              <ProgressRing value={opdracht.match} size={72} color={C.limeBright} label="match" />
              <div>
                <p
                  className="text-[11px] font-bold uppercase tracking-[0.14em]"
                  style={{ ...mono, color: C.limeBright }}
                >
                  Match-score
                </p>
                <p className="mt-1 text-[13px]" style={{ color: "#c3ccc2" }}>
                  Sterke koppeling met je profiel — reageer nu voor het beste momentum.
                </p>
              </div>
            </div>
          </div>
          <div
            className="rounded-2xl p-5"
            style={{ background: C.surface, border: `1px solid ${C.line}` }}
          >
            <p
              className="flex items-center gap-1.5 text-[10.5px] font-bold uppercase tracking-[0.14em]"
              style={{ ...mono, color: C.lime }}
            >
              <ShieldCheck size={13} aria-hidden="true" /> Compliance-eis
            </p>
            <p className="mt-2 text-[12.5px]" style={{ color: C.sub }}>
              Vereiste credentials voor deze opdracht. Je voldoet aan de kern-eisen.
            </p>
            <ul className="mt-3 space-y-2.5">
              {CREDENTIALS.slice(0, 3).map((c) => {
                const t = credTone(c.status);
                const Icon = t.Icon;
                return (
                  <li key={c.naam} className="flex items-center gap-2.5">
                    <span
                      className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg"
                      style={{ background: t.soft }}
                    >
                      <Icon size={15} style={{ color: t.fg }} aria-hidden="true" />
                    </span>
                    <span
                      className="min-w-0 flex-1 truncate text-[12.5px]"
                      style={{ color: C.ink }}
                    >
                      {c.naam}
                    </span>
                    <StatusPill status={c.status} />
                  </li>
                );
              })}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ---------- Verificatie ---------- */

function Verificatie({ onGo }: { onGo: (k: ScreenKey) => void }) {
  const verified = CREDENTIALS.filter((c) => c.status === "VERIFIED").length;
  const total = CREDENTIALS.length;
  const expiring = CREDENTIALS.find((c) => c.status === "EXPIRING");
  const pct = Math.round((verified / total) * 100);

  return (
    <div>
      <PageHead
        kicker="Prestatie"
        title="Verificatie"
        sub="Je vertrouwens-score — elk geverifieerd bewijsstuk is een prestatie die je zichtbaarder maakt."
      />
      <div className="space-y-5 px-6 py-5">
        {/* Prestatie-meter */}
        <div
          className="flex flex-wrap items-center gap-5 rounded-3xl p-6"
          style={{ background: C.ink900, border: `1px solid ${C.ink}` }}
        >
          <ProgressRing value={pct} size={92} color={C.limeBright} label="verified" />
          <div className="min-w-[180px] flex-1">
            <p
              className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-[0.16em]"
              style={{ ...mono, color: C.limeBright }}
            >
              <Trophy size={13} aria-hidden="true" /> {PROFIEL.trust}
            </p>
            <p
              className="mt-2 text-[24px] font-bold tabular-nums"
              style={{ ...mono, color: "#fff" }}
            >
              {verified}/{total} geverifieerd
            </p>
            <p className="mt-1 text-[12.5px]" style={{ color: "#c3ccc2" }}>
              Nog {total - verified} bewijsstuk{total - verified === 1 ? "" : "ken"} te gaan voor
              een volledige score.
            </p>
          </div>
        </div>

        {/* Verloop-waarschuwing + herstelactie */}
        {expiring && (
          <div
            className="flex flex-wrap items-center gap-4 rounded-2xl p-4"
            style={{ background: C.warnSoft, border: `1px solid ${C.warn}33` }}
            role="alert"
          >
            <AlertTriangle
              size={20}
              style={{ color: C.warn }}
              className="shrink-0"
              aria-hidden="true"
            />
            <div className="min-w-[180px] flex-1">
              <p className="text-[13.5px] font-bold" style={{ color: C.ink }}>
                {expiring.naam} verloopt binnenkort
              </p>
              <p className="mt-0.5 text-[12.5px]" style={{ color: C.sub }}>
                {expiring.detail}. Vernieuw op tijd om je score te behouden.
              </p>
            </div>
            <button
              onClick={() => onGo("acties")}
              className={`inline-flex items-center gap-1.5 rounded-lg px-3.5 py-2 text-[12.5px] font-bold transition-transform active:scale-[0.98] ${RING}`}
              style={{ background: C.warn, color: "#fff" }}
            >
              Vernieuwen <ArrowRight size={13} strokeWidth={2.6} aria-hidden="true" />
            </button>
          </div>
        )}

        {/* Credential-lijst */}
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {CREDENTIALS.map((c) => {
            const t = credTone(c.status);
            const Icon = t.Icon;
            return (
              <div
                key={c.naam}
                className="flex items-center gap-3.5 rounded-2xl p-4"
                style={{ background: C.surface, border: `1px solid ${C.line}` }}
              >
                <span
                  className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl"
                  style={{ background: t.soft }}
                >
                  <Icon size={20} style={{ color: t.fg }} aria-hidden="true" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-[13.5px] font-bold" style={{ color: C.ink }}>
                    {c.naam}
                  </p>
                  <p className="text-[11.5px]" style={{ color: C.sub }}>
                    {c.detail}
                  </p>
                </div>
                <StatusPill status={c.status} />
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

/* ---------- Acties ---------- */

function Acties({ onGo }: { onGo: (k: ScreenKey) => void }) {
  return (
    <div>
      <PageHead
        kicker="Speelplan"
        title="Volgende acties"
        sub="Je actielijst op volgorde van urgentie — vink af en houd je momentum vast."
      />
      <div className="space-y-3 px-6 py-5">
        {ACTIES.map((a, i) => {
          const warn = a.urgentie === "warning";
          const fg = warn ? C.energy : C.info;
          const soft = warn ? C.energySoft : C.infoSoft;
          return (
            <div
              key={a.titel}
              className="flex flex-wrap items-start gap-4 rounded-2xl p-4"
              style={{
                background: C.surface,
                border: `1px solid ${warn ? `${C.energy}33` : C.line}`,
              }}
            >
              <span
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-[15px] font-bold tabular-nums"
                style={{ ...mono, background: soft, color: fg }}
              >
                {i + 1}
              </span>
              <div className="min-w-[180px] flex-1">
                <p
                  className="text-[10px] font-bold uppercase tracking-[0.14em]"
                  style={{ ...mono, color: fg }}
                >
                  {warn ? "Waarschuwing" : "Kans"}
                </p>
                <p className="mt-0.5 text-[14px] font-bold" style={{ ...head, color: C.ink }}>
                  {a.titel}
                </p>
                <p className="mt-0.5 text-[12.5px]" style={{ color: C.sub }}>
                  {a.detail}
                </p>
              </div>
              <button
                onClick={() => onGo(warn ? "verificatie" : "marktplaats")}
                className={`inline-flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-[12.5px] font-bold transition-transform active:scale-[0.98] ${RING}`}
                style={{ background: warn ? C.energy : C.ink, color: warn ? "#fff" : C.limeBright }}
              >
                {a.cta} <ChevronRight size={14} strokeWidth={2.6} aria-hidden="true" />
              </button>
            </div>
          );
        })}

        <div
          className="flex items-center gap-3 rounded-2xl p-4"
          style={{ background: C.limeSoft, border: `1px solid ${C.lime}33` }}
        >
          <Zap size={16} strokeWidth={2.6} style={{ color: C.lime }} aria-hidden="true" />
          <p className="text-[12.5px]" style={{ color: C.sub }}>
            Verder is alles op koers. Nieuwe kansen verschijnen hier vanzelf.
          </p>
        </div>
      </div>
    </div>
  );
}

/* ---------- Facturen ---------- */

function Facturen() {
  const betaald = FACTUREN.filter((f) => f.status === "Betaald").reduce(
    (s, f) => s + euros(f.bedrag),
    0,
  );
  const open = FACTUREN.filter((f) => f.status === "Openstaand").reduce(
    (s, f) => s + euros(f.bedrag),
    0,
  );
  const totaal = betaald + open;
  const pct = totaal ? Math.round((betaald / totaal) * 100) : 0;

  return (
    <div>
      <PageHead
        kicker="Omzet-momentum"
        title="Facturen"
        sub="Je omzet als prestatie — hoeveel er binnen is en wat nog onderweg is."
        right={
          <button
            className={`inline-flex items-center gap-2 rounded-xl px-3.5 py-2 text-[12.5px] font-bold transition-transform active:scale-[0.98] ${RING}`}
            style={{ background: C.ink, color: C.limeBright }}
          >
            <Plus size={14} strokeWidth={2.6} aria-hidden="true" /> Nieuwe factuur
          </button>
        }
      />
      <div className="space-y-5 px-6 py-5">
        <div
          className="flex flex-wrap items-center gap-5 rounded-3xl p-5"
          style={{ background: C.ink900, border: `1px solid ${C.ink}` }}
        >
          <ProgressRing value={pct} size={80} color={C.limeBright} label="betaald" />
          <div className="flex flex-1 flex-wrap gap-6">
            <div>
              <p
                className="text-[10.5px] font-bold uppercase tracking-[0.12em]"
                style={{ ...mono, color: C.limeBright }}
              >
                Ontvangen
              </p>
              <p
                className="mt-1 text-[24px] font-bold tabular-nums"
                style={{ ...mono, color: "#fff" }}
              >
                € {betaald.toLocaleString("nl-NL")}
              </p>
            </div>
            <div>
              <p
                className="text-[10.5px] font-bold uppercase tracking-[0.12em]"
                style={{ ...mono, color: "#ff9f6b" }}
              >
                Openstaand
              </p>
              <p
                className="mt-1 text-[24px] font-bold tabular-nums"
                style={{ ...mono, color: "#fff" }}
              >
                € {open.toLocaleString("nl-NL")}
              </p>
            </div>
          </div>
        </div>

        <div
          className="overflow-x-auto rounded-2xl"
          style={{ border: `1px solid ${C.line}`, background: C.surface }}
        >
          <table className="w-full text-left">
            <thead>
              <tr
                className="text-[10.5px] font-bold uppercase tracking-[0.08em]"
                style={{ background: C.surfaceAlt, color: C.faint }}
              >
                <th className="px-4 py-3">Nummer</th>
                <th className="px-4 py-3">Klant</th>
                <th className="hidden px-4 py-3 sm:table-cell">Datum</th>
                <th className="px-4 py-3 text-right">Bedrag</th>
                <th className="px-4 py-3 text-right">Status</th>
              </tr>
            </thead>
            <tbody>
              {FACTUREN.map((f, i) => {
                const t = factuurTone(f.status);
                return (
                  <tr
                    key={f.nr}
                    style={{ borderTop: i === 0 ? "none" : `1px solid ${C.lineSoft}` }}
                  >
                    <td
                      className="px-4 py-3.5 text-[12px] font-semibold tabular-nums"
                      style={{ ...mono, color: C.sub }}
                    >
                      {f.nr}
                    </td>
                    <td className="px-4 py-3.5 text-[13px]" style={{ color: C.ink }}>
                      {f.klant}
                    </td>
                    <td
                      className="hidden px-4 py-3.5 text-[12px] tabular-nums sm:table-cell"
                      style={{ ...mono, color: C.faint }}
                    >
                      {f.datum}
                    </td>
                    <td
                      className="px-4 py-3.5 text-right text-[13px] font-bold tabular-nums"
                      style={{ ...mono, color: C.ink }}
                    >
                      {f.bedrag}
                    </td>
                    <td className="px-4 py-3.5 text-right">
                      <span
                        className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold"
                        style={{ color: t.fg, background: t.soft }}
                      >
                        <span
                          className="h-1.5 w-1.5 rounded-full"
                          style={{ background: t.fg }}
                          aria-hidden="true"
                        />
                        {f.status}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
