"use client";

// Concept 337 — "Riso" · risograaf duotoon-fluor met halftone-korrel (bold, tactiel print).
// Twee fluor spot-inkten (fluor-roze + fel blauw) die overprinten met halftone-punten en een
// subtiele mis-registratie-offset (dubbel-gedrukte rand) op ongebleekt papier. De esthetiek is
// hedendaags-print: bold displaykoppen, korrelige vlakken, ge-offsette randen — maar de data
// blijft leesbaar en contrastvol. Statuschips altijd label + icoon; verklaarbare matching en
// verificatie als vertrouwenslaag. Halftone volledig via CSS radial-gradients (geen assets).
// Fonts: --font-lab-anton (bold display) + --font-lab-space-mono (labels/cijfers) + --font-lab-inter (tekst).

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
  ArrowRight,
  ArrowUpRight,
  ArrowDownRight,
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
  Zap,
  Layers,
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

/* ---------- Palet (ongebleekt papier, twee fluor spot-inkten) ---------- */

const C = {
  paper: "#f2ecdd", // ongebleekt papier
  paperDeep: "#e9e0cb",
  card: "#faf5e9",
  ink: "#171310", // donkere inkt voor tekst
  inkSoft: "#3b332a",
  sub: "#6a5f4e",
  faint: "#9c8f78",
  line: "#d8ccb1",
  lineSoft: "#e5dcc6",
  pink: "#ff2d7e", // fluor-roze spot-inkt
  pinkDeep: "#d40b5c", // leesbaar op papier
  pinkSoft: "#ffd9e8",
  blue: "#2b39ff", // fel blauw spot-inkt
  blueDeep: "#1a24c9", // leesbaar op papier
  blueSoft: "#d6d9ff",
  ok: "#0f7a3d",
  okSoft: "#cdeed6",
  warn: "#b4600a",
  warnSoft: "#f6e2c2",
  alert: "#c01843",
  alertSoft: "#ffd6e0",
  info: "#1a24c9",
  infoSoft: "#d6d9ff",
};

const head = { fontFamily: "var(--font-lab-anton), system-ui, sans-serif" };
const mono = { fontFamily: "var(--font-lab-space-mono), ui-monospace, monospace" };
const body = { fontFamily: "var(--font-lab-inter), system-ui, sans-serif" };

const RING =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2b39ff] focus-visible:ring-offset-2 focus-visible:ring-offset-[#f2ecdd]";

/* ---------- Halftone-korrel (radial-gradient dot-pattern) ---------- */

function halftone(color: string, size = 5, alpha = 0.5): React.CSSProperties {
  return {
    backgroundImage: `radial-gradient(${color} ${(size * 0.34).toFixed(1)}px, transparent ${(size * 0.36).toFixed(1)}px)`,
    backgroundSize: `${size}px ${size}px`,
    opacity: alpha,
  };
}

/* ---------- Status → betekenis ---------- */

type Tone = { label: string; fg: string; soft: string; Icon: LucideIcon };

function credTone(s: CredStatus): Tone {
  switch (s) {
    case "VERIFIED":
      return { label: "Geverifieerd", fg: C.ok, soft: C.okSoft, Icon: BadgeCheck };
    case "SUBMITTED":
      return { label: "In beoordeling", fg: C.blueDeep, soft: C.blueSoft, Icon: Clock };
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

// Mis-registratie-kop: dubbel-gedrukte rand (roze/blauw geoffset onder de zwarte inkt).
function RisoTitle({
  children,
  size = 34,
  className = "",
}: {
  children: React.ReactNode;
  size?: number;
  className?: string;
}) {
  return (
    <h1
      className={`relative leading-[0.92] tracking-tight ${className}`}
      style={{
        ...head,
        fontSize: size,
        color: C.ink,
        textShadow: `2px 0 0 ${C.pink}, -2px 1px 0 ${C.blue}`,
        letterSpacing: "0.01em",
        textTransform: "uppercase",
      }}
    >
      {children}
    </h1>
  );
}

function StatusPill({ status }: { status: CredStatus }) {
  const t = credTone(status);
  const Icon = t.Icon;
  return (
    <span
      className="inline-flex items-center gap-1.5 px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide"
      style={{
        ...mono,
        color: t.fg,
        background: t.soft,
        border: `1.5px solid ${t.fg}`,
        boxShadow: `2px 2px 0 ${t.fg}22`,
      }}
    >
      <Icon size={12} strokeWidth={2.6} aria-hidden="true" />
      {t.label}
    </span>
  );
}

// Duotoon halftone-blok — het print-visitekaartje van dit concept.
function DuoBlock({
  children,
  base = C.blue,
  className = "",
  style,
}: {
  children: React.ReactNode;
  base?: string;
  className?: string;
  style?: React.CSSProperties;
}) {
  return (
    <div
      className={`relative overflow-hidden ${className}`}
      style={{ background: base, border: `2px solid ${C.ink}`, ...style }}
    >
      <span
        aria-hidden="true"
        className="pointer-events-none absolute inset-0"
        style={{
          ...halftone("#ffffff", 6, 0.22),
          mixBlendMode: "screen",
        }}
      />
      <span
        aria-hidden="true"
        className="pointer-events-none absolute inset-0"
        style={{
          ...halftone(C.pink, 7, 0.28),
          backgroundPosition: "2px 3px",
          mixBlendMode: "multiply",
        }}
      />
      <div className="relative">{children}</div>
    </div>
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
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

// Match-badge in print-stijl: groot getal met halftone-ring.
function MatchStamp({ value, size = 60 }: { value: number; size?: number }) {
  return (
    <span
      className="relative flex shrink-0 items-center justify-center"
      style={{ width: size, height: size }}
      aria-hidden="true"
    >
      <span
        className="absolute inset-0 rounded-full"
        style={{ background: C.pink, border: `2px solid ${C.ink}` }}
      />
      <span
        className="absolute inset-0 rounded-full"
        style={{ ...halftone("#ffffff", 4, 0.32), mixBlendMode: "screen" }}
      />
      <span
        className="relative font-normal tabular-nums leading-none"
        style={{ ...head, color: C.ink, fontSize: size >= 60 ? 22 : 17 }}
      >
        {value}
      </span>
    </span>
  );
}

function PageHead({
  kicker,
  title,
  sub,
  right,
  size,
}: {
  kicker: string;
  title: string;
  sub?: string;
  right?: React.ReactNode;
  size?: number;
}) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-4 px-6 pb-2 pt-6">
      <div className="min-w-0">
        <p
          className="mb-2 inline-flex items-center gap-1.5 px-2 py-0.5 text-[11px] font-bold uppercase tracking-[0.24em]"
          style={{ ...mono, color: C.paper, background: C.ink }}
        >
          {kicker}
        </p>
        <RisoTitle size={size ?? 34}>{title}</RisoTitle>
        {sub && (
          <p className="mt-2 max-w-xl text-[13px]" style={{ ...body, color: C.sub }}>
            {sub}
          </p>
        )}
      </div>
      {right}
    </div>
  );
}

/* ---------- Hoofdcomponent ---------- */

export function Concept337() {
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
    const t = window.setTimeout(() => setReady(true), 320);
    return () => window.clearTimeout(t);
  }, [screen]);

  return (
    <div
      className="min-h-[680px] w-full antialiased"
      style={{ ...body, background: C.paper, color: C.ink }}
    >
      <style>{`@keyframes ri-fade{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:translateY(0)}}
      @keyframes ri-pulse{0%,100%{opacity:.5}50%{opacity:.85}}
      @keyframes ri-shift{0%,100%{transform:translate(0,0)}50%{transform:translate(1.5px,-1px)}}`}</style>

      {/* Papier-korrel over de hele achtergrond */}
      <span
        aria-hidden="true"
        className="pointer-events-none fixed inset-0"
        style={{ ...halftone(C.faint, 4, 0.14), zIndex: 0 }}
      />

      <div className="relative" style={{ zIndex: 1 }}>
        {/* Top-nav — print-header met dikke inktrand */}
        <header className="border-b-[3px]" style={{ borderColor: C.ink, background: C.card }}>
          <div className="flex h-16 items-center gap-3 px-5">
            <div
              className="relative flex h-9 w-9 items-center justify-center overflow-hidden"
              style={{ background: C.pink, border: `2px solid ${C.ink}` }}
              aria-hidden="true"
            >
              <span
                className="absolute inset-0"
                style={{ ...halftone(C.blue, 4, 0.4), mixBlendMode: "multiply" }}
              />
              <span className="relative text-[16px] leading-none" style={{ ...head, color: C.ink }}>
                Z
              </span>
            </div>
            <span
              className="text-[20px] leading-none"
              style={{ ...head, color: C.ink, textShadow: `1.5px 0 0 ${C.pink}` }}
            >
              RISO
            </span>
            <span
              className="ml-1 hidden px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.18em] sm:inline"
              style={{ ...mono, background: C.blue, color: "#fff", border: `1.5px solid ${C.ink}` }}
            >
              ZZP
            </span>

            <div className="ml-auto flex items-center gap-2">
              <button
                aria-label="Zoeken"
                className={`p-2 transition-transform hover:-translate-y-0.5 ${RING}`}
                style={{ border: `2px solid ${C.ink}`, background: C.card, color: C.ink }}
              >
                <Search size={15} aria-hidden="true" />
              </button>
              <button
                aria-label="Meldingen"
                className={`relative p-2 transition-transform hover:-translate-y-0.5 ${RING}`}
                style={{ border: `2px solid ${C.ink}`, background: C.card, color: C.ink }}
              >
                <Bell size={15} aria-hidden="true" />
                <span
                  className="absolute -right-1.5 -top-1.5 h-3 w-3 rounded-full"
                  style={{ background: C.pink, border: `1.5px solid ${C.ink}` }}
                  aria-hidden="true"
                />
              </button>
              <div className="ml-1 flex items-center gap-2.5">
                <div
                  className="flex h-9 w-9 items-center justify-center text-[12px]"
                  style={{ ...mono, background: C.ink, color: C.pink, fontWeight: 700 }}
                  aria-hidden="true"
                >
                  {PROFIEL.initialen}
                </div>
                <div className="hidden leading-tight sm:block">
                  <p className="text-[12.5px] font-bold" style={{ color: C.ink }}>
                    {PROFIEL.naam}
                  </p>
                  <p
                    className="flex items-center gap-1 text-[10.5px] font-bold uppercase tracking-wide"
                    style={{ ...mono, color: C.ok }}
                  >
                    <ShieldCheck size={11} strokeWidth={2.6} aria-hidden="true" /> {PROFIEL.trust}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Scherm-tabs */}
          <nav className="flex gap-1.5 overflow-x-auto px-4 pb-3" aria-label="Hoofdnavigatie">
            {SCREENS.map((s) => {
              const Icon = NAV_ICONS[s.key];
              const on = s.key === screen;
              return (
                <button
                  key={s.key}
                  onClick={() => setScreen(s.key)}
                  aria-current={on ? "page" : undefined}
                  className={`flex shrink-0 items-center gap-2 px-3 py-2 text-[12px] font-bold uppercase tracking-wide transition-transform hover:-translate-y-0.5 ${RING}`}
                  style={{
                    ...mono,
                    color: on ? "#fff" : C.ink,
                    background: on ? C.blue : C.card,
                    border: `2px solid ${C.ink}`,
                    boxShadow: on ? `2px 2px 0 ${C.pink}` : "none",
                  }}
                >
                  <Icon size={14} aria-hidden="true" />
                  {s.label}
                </button>
              );
            })}
          </nav>
        </header>

        {/* Content */}
        <div key={screen} className="mx-auto max-w-6xl" style={{ animation: "ri-fade 0.3s ease" }}>
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
    </div>
  );
}

/* ---------- Skeleton ---------- */

function ScreenSkeleton() {
  return (
    <div className="px-6 py-6" role="status" aria-live="polite">
      <span className="sr-only">Scherm wordt geladen…</span>
      <div
        className="h-9 w-56"
        style={{
          background: C.card,
          border: `2px solid ${C.line}`,
          animation: "ri-pulse 1.3s infinite",
        }}
      />
      <div
        className="mt-6 h-44"
        style={{
          background: C.card,
          border: `2px solid ${C.line}`,
          animation: "ri-pulse 1.3s infinite",
        }}
      />
      <div className="mt-4 grid grid-cols-2 gap-3 lg:grid-cols-4">
        {[0, 1, 2, 3].map((i) => (
          <div
            key={i}
            className="h-24"
            style={{
              background: C.card,
              border: `2px solid ${C.line}`,
              animation: "ri-pulse 1.3s infinite",
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
  const [feed, setFeed] = useState<"error" | "loading" | "ok">("error");
  const warn = ACTIES[0];
  const matchAvg = Math.round(OPDRACHTEN.reduce((s, o) => s + o.match, 0) / OPDRACHTEN.length);

  const retry = () => {
    setFeed("loading");
    window.setTimeout(() => setFeed("ok"), 700);
  };

  return (
    <div>
      <PageHead
        kicker="Editie · Juli"
        title={`Hallo, ${PROFIEL.naam.split(" ")[0]}`}
        sub="Je praktijk in print — cijfers, matches en wat vandaag telt, in twee fluor inkten."
      />

      <div className="space-y-5 px-6 py-5">
        {/* Hero — duotoon halftone-poster */}
        <DuoBlock base={C.blue}>
          <div className="flex flex-wrap items-start justify-between gap-5 p-6">
            <div className="min-w-0">
              <p
                className="inline-flex items-center gap-1.5 px-2 py-0.5 text-[11px] font-bold uppercase tracking-[0.2em]"
                style={{
                  ...mono,
                  background: C.pink,
                  color: C.ink,
                  border: `1.5px solid ${C.ink}`,
                }}
              >
                <Zap size={12} aria-hidden="true" /> Gemiddelde match
              </p>
              <p
                className="mt-3 tabular-nums leading-none"
                style={{ ...head, color: "#fff", fontSize: 64, textShadow: `3px 0 0 ${C.pink}` }}
              >
                {matchAvg}%
              </p>
              <p
                className="mt-3 max-w-sm text-[13px] font-medium"
                style={{ ...body, color: "#e7e9ff" }}
              >
                Over je actieve opdrachten. Sterke koppeling met je geverifieerde profiel — reageer
                nu voor de beste kans.
              </p>
            </div>
            <div className="flex flex-col items-end gap-2">
              {KPIS.slice(0, 2).map((k) => (
                <div
                  key={k.label}
                  className="px-3 py-2 text-right"
                  style={{ background: C.card, border: `2px solid ${C.ink}` }}
                >
                  <p
                    className="text-[10px] font-bold uppercase tracking-wide"
                    style={{ ...mono, color: C.sub }}
                  >
                    {k.label}
                  </p>
                  <p
                    className="text-[20px] tabular-nums leading-none"
                    style={{ ...head, color: C.ink }}
                  >
                    {k.value}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </DuoBlock>

        {/* KPI-strook */}
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          {KPIS.map((k, idx) => (
            <div
              key={k.label}
              className="relative overflow-hidden p-4"
              style={{
                background: C.card,
                border: `2px solid ${C.ink}`,
                boxShadow: `3px 3px 0 ${idx % 2 ? C.blue : C.pink}`,
              }}
            >
              <div className="flex items-center justify-between">
                <p
                  className="text-[10.5px] font-bold uppercase tracking-wide"
                  style={{ ...mono, color: C.sub }}
                >
                  {k.label}
                </p>
                <span
                  className="inline-flex items-center gap-0.5 text-[10.5px] font-bold tabular-nums"
                  style={{ ...mono, color: k.up ? C.ok : C.pinkDeep }}
                >
                  {k.up ? (
                    <ArrowUpRight size={12} aria-hidden="true" />
                  ) : (
                    <ArrowDownRight size={12} aria-hidden="true" />
                  )}
                  {k.trend}
                </span>
              </div>
              <p
                className="mt-1.5 text-[24px] tabular-nums leading-none"
                style={{ ...head, color: C.ink }}
              >
                {k.value}
              </p>
              <div className="mt-2.5">
                <MiniSpark data={k.spark} color={k.up ? C.blueDeep : C.pinkDeep} />
              </div>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          {/* Volgende actie */}
          {warn && (
            <div
              className="relative overflow-hidden p-5 lg:col-span-2"
              style={{ background: C.pinkSoft, border: `2px solid ${C.ink}` }}
              role="alert"
            >
              <span
                aria-hidden="true"
                className="pointer-events-none absolute inset-0"
                style={{ ...halftone(C.pink, 6, 0.3) }}
              />
              <div className="relative">
                <p
                  className="inline-flex items-center gap-1.5 px-2 py-0.5 text-[10.5px] font-bold uppercase tracking-[0.16em]"
                  style={{ ...mono, background: C.ink, color: C.pink }}
                >
                  <AlertTriangle size={12} aria-hidden="true" /> Volgende actie
                </p>
                <h2
                  className="mt-3"
                  style={{ ...head, color: C.ink, fontSize: 22, textTransform: "uppercase" }}
                >
                  {warn.titel}
                </h2>
                <p
                  className="mt-1.5 max-w-md text-[13px] font-medium"
                  style={{ ...body, color: C.inkSoft }}
                >
                  {warn.detail}
                </p>
                <button
                  onClick={() => onGo("verificatie")}
                  className={`mt-4 inline-flex items-center gap-2 px-4 py-2.5 text-[12px] font-bold uppercase tracking-wide transition-transform hover:-translate-y-0.5 active:translate-y-0 ${RING}`}
                  style={{
                    ...mono,
                    background: C.ink,
                    color: "#fff",
                    boxShadow: `3px 3px 0 ${C.blue}`,
                  }}
                >
                  {warn.cta} <ArrowRight size={15} strokeWidth={2.6} aria-hidden="true" />
                </button>
              </div>
            </div>
          )}

          {/* Berichten met error→loading→ok */}
          <div className="p-5" style={{ background: C.card, border: `2px solid ${C.ink}` }}>
            <div className="flex items-center justify-between">
              <h3
                className="flex items-center gap-1.5 text-[13px] uppercase"
                style={{ ...head, color: C.ink }}
              >
                <Bell size={15} style={{ color: C.blueDeep }} aria-hidden="true" /> Inbox
              </h3>
              <span
                className="px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide"
                style={{ ...mono, background: C.pink, color: C.ink }}
              >
                {BERICHTEN.filter((b) => b.ongelezen).length} nieuw
              </span>
            </div>
            <div className="mt-4 border-t-2 pt-3" style={{ borderColor: C.line }}>
              {feed === "error" && (
                <div className="text-center" role="alert">
                  <CircleAlert
                    size={22}
                    className="mx-auto"
                    style={{ color: C.alert }}
                    aria-hidden="true"
                  />
                  <p className="mt-1.5 text-[12px]" style={{ color: C.sub }}>
                    Kon niet laden.
                  </p>
                  <button
                    onClick={retry}
                    className={`mt-2 inline-flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-bold uppercase tracking-wide transition-transform hover:-translate-y-0.5 ${RING}`}
                    style={{
                      ...mono,
                      border: `2px solid ${C.ink}`,
                      color: C.ink,
                      background: C.card,
                    }}
                  >
                    <RotateCcw size={12} aria-hidden="true" /> Opnieuw
                  </button>
                </div>
              )}
              {feed === "loading" && (
                <div className="space-y-2" role="status" aria-live="polite">
                  <span className="sr-only">Laden…</span>
                  {[60, 85].map((w) => (
                    <span
                      key={w}
                      className="block h-3"
                      style={{
                        background: C.lineSoft,
                        width: `${w}%`,
                        animation: "ri-pulse 1.3s infinite",
                      }}
                    />
                  ))}
                </div>
              )}
              {feed === "ok" && (
                <ul className="space-y-3">
                  {BERICHTEN.slice(0, 2).map((b) => (
                    <li key={b.van} className="flex items-start gap-2.5">
                      <span
                        className="flex h-8 w-8 shrink-0 items-center justify-center text-[10px] font-bold"
                        style={{
                          ...mono,
                          background: C.blue,
                          color: "#fff",
                          border: `1.5px solid ${C.ink}`,
                        }}
                        aria-hidden="true"
                      >
                        {b.initialen}
                      </span>
                      <div className="min-w-0">
                        <p className="truncate text-[12.5px] font-bold" style={{ color: C.ink }}>
                          {b.van}
                        </p>
                        <p className="mt-0.5 line-clamp-2 text-[11.5px]" style={{ color: C.sub }}>
                          {b.preview}
                        </p>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>

        {/* Beste matches */}
        <div>
          <div className="mb-3 flex items-center justify-between">
            <h2
              className="flex items-center gap-2 text-[18px] uppercase"
              style={{ ...head, color: C.ink }}
            >
              <Layers size={18} style={{ color: C.pinkDeep }} aria-hidden="true" /> Top-matches
            </h2>
            <button
              onClick={() => onGo("marktplaats")}
              className={`inline-flex items-center gap-1 px-2 py-1 text-[12px] font-bold uppercase tracking-wide ${RING}`}
              style={{ ...mono, color: C.blueDeep }}
            >
              Alles <ChevronRight size={14} aria-hidden="true" />
            </button>
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {OPDRACHTEN.map((o) => (
              <button
                key={o.id}
                onClick={() => onOpen(o.id)}
                className={`p-4 text-left transition-transform hover:-translate-y-1 ${RING}`}
                style={{
                  background: C.card,
                  border: `2px solid ${C.ink}`,
                  boxShadow: `3px 3px 0 ${C.blue}`,
                }}
              >
                <div className="flex items-start justify-between">
                  <MatchStamp value={o.match} size={56} />
                  <span
                    className="text-[10px] font-bold tabular-nums"
                    style={{ ...mono, color: C.faint }}
                  >
                    {o.id}
                  </span>
                </div>
                <p
                  className="mt-3 text-[15px] uppercase leading-tight"
                  style={{ ...head, color: C.ink }}
                >
                  {o.titel}
                </p>
                <p
                  className="mt-1 flex items-center gap-1 truncate text-[12px]"
                  style={{ ...body, color: C.sub }}
                >
                  <MapPin size={12} aria-hidden="true" /> {o.opdrachtgever} · {o.plaats}
                </p>
                <div
                  className="mt-3 flex items-center justify-between border-t-2 pt-2"
                  style={{ borderColor: C.lineSoft }}
                >
                  <span
                    className="text-[13px] font-bold tabular-nums"
                    style={{ ...mono, color: C.pinkDeep }}
                  >
                    {o.tarief}
                  </span>
                  <span className="text-[11.5px]" style={{ ...mono, color: C.faint }}>
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
        kicker="Oplage · Opdrachten"
        title="Marktplaats"
        sub="Opdrachten gerangschikt op match — de sterkste kansen bovenaan, in fluor gedrukt."
        right={
          <div
            className="inline-flex items-center gap-0.5 p-0.5"
            style={{ background: C.card, border: `2px solid ${C.ink}` }}
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
                  className={`px-3 py-1.5 text-[11px] font-bold uppercase tracking-wide transition-colors ${RING}`}
                  style={{
                    ...mono,
                    background: on ? C.blue : "transparent",
                    color: on ? "#fff" : C.ink,
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
          className="mb-4 flex items-center gap-2.5 px-3.5 py-2.5"
          style={{ background: C.card, border: `2px solid ${C.ink}` }}
        >
          <Search size={16} aria-hidden="true" style={{ color: C.pinkDeep }} />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Zoek op titel, plaats of opdrachtgever…"
            aria-label="Opdrachten zoeken"
            className="w-full bg-transparent text-[13.5px] outline-none"
            style={{ ...body, color: C.ink }}
          />
        </div>

        {filtered.length === 0 ? (
          <div
            className="flex flex-col items-center justify-center px-6 py-16 text-center"
            style={{ border: `2px dashed ${C.ink}`, background: C.card }}
          >
            <span
              className="flex h-12 w-12 items-center justify-center"
              style={{ background: C.pinkSoft, border: `2px solid ${C.ink}` }}
              aria-hidden="true"
            >
              <Search size={20} style={{ color: C.pinkDeep }} />
            </span>
            <p className="mt-4 text-[16px] uppercase" style={{ ...head, color: C.ink }}>
              Geen opdrachten
            </p>
            <p className="mt-1 max-w-xs text-[12.5px]" style={{ ...body, color: C.sub }}>
              Niets komt overeen met “{q}”. Verbreed je zoekopdracht.
            </p>
            <button
              onClick={() => setQ("")}
              className={`mt-4 px-4 py-2 text-[11px] font-bold uppercase tracking-wide transition-transform hover:-translate-y-0.5 ${RING}`}
              style={{ ...mono, border: `2px solid ${C.ink}`, color: C.ink, background: C.card }}
            >
              Zoekopdracht wissen
            </button>
          </div>
        ) : (
          <ul className="space-y-3">
            {filtered.map((o, i) => (
              <li
                key={o.id}
                className="p-4"
                style={{
                  background: C.card,
                  border: `2px solid ${C.ink}`,
                  boxShadow: `3px 3px 0 ${i === 0 ? C.pink : C.blue}`,
                }}
              >
                <div className="flex flex-wrap items-start gap-4">
                  <div className="flex items-center gap-3">
                    <span
                      className="flex h-7 w-7 items-center justify-center text-[12px] font-bold tabular-nums"
                      style={{
                        ...mono,
                        background: i === 0 ? C.pink : C.card,
                        color: C.ink,
                        border: `2px solid ${C.ink}`,
                      }}
                    >
                      {i + 1}
                    </span>
                    <MatchStamp value={o.match} size={56} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span
                        className="text-[10px] font-bold tabular-nums"
                        style={{ ...mono, color: C.faint }}
                      >
                        {o.id}
                      </span>
                      {o.tags.map((t) => (
                        <span
                          key={t}
                          className="px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide"
                          style={{
                            ...mono,
                            background: C.blueSoft,
                            color: C.blueDeep,
                            border: `1.5px solid ${C.blueDeep}`,
                          }}
                        >
                          {t}
                        </span>
                      ))}
                    </div>
                    <p
                      className="mt-1.5 text-[16px] uppercase leading-tight"
                      style={{ ...head, color: C.ink }}
                    >
                      {o.titel}
                    </p>
                    <p
                      className="mt-0.5 flex items-center gap-1 text-[12.5px]"
                      style={{ ...body, color: C.sub }}
                    >
                      <MapPin size={12} aria-hidden="true" /> {o.opdrachtgever} · {o.plaats}
                    </p>
                    <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-[12.5px]">
                      <span
                        className="font-bold tabular-nums"
                        style={{ ...mono, color: C.pinkDeep }}
                      >
                        {o.tarief}
                      </span>
                      <span style={{ ...mono, color: C.sub }}>{o.uren}</span>
                      <span style={{ ...mono, color: C.sub }}>{o.start}</span>
                    </div>
                  </div>
                  <button
                    onClick={() => onOpen(o.id)}
                    className={`inline-flex items-center gap-1.5 self-center px-3.5 py-2 text-[11px] font-bold uppercase tracking-wide transition-transform hover:-translate-y-0.5 ${RING}`}
                    style={{ ...mono, background: C.ink, color: "#fff" }}
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
        size={28}
        sub={`${opdracht.opdrachtgever} · ${opdracht.plaats}`}
        right={
          <div className="flex items-center gap-2">
            <button
              onClick={onBack}
              className={`px-3.5 py-2 text-[11px] font-bold uppercase tracking-wide transition-transform hover:-translate-y-0.5 ${RING}`}
              style={{ ...mono, border: `2px solid ${C.ink}`, color: C.ink, background: C.card }}
            >
              Terug
            </button>
            <button
              onClick={react}
              disabled={state !== "idle"}
              aria-live="polite"
              className={`inline-flex items-center gap-2 px-4 py-2 text-[11px] font-bold uppercase tracking-wide transition-transform hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-90 ${RING}`}
              style={{
                ...mono,
                background: state === "sent" ? C.ok : C.ink,
                color: "#fff",
                boxShadow: state === "idle" ? `3px 3px 0 ${C.pink}` : "none",
              }}
            >
              {state === "idle" && (
                <>
                  <Send size={14} strokeWidth={2.4} aria-hidden="true" /> Reageer nu
                </>
              )}
              {state === "sending" && "Versturen…"}
              {state === "sent" && (
                <>
                  <Check size={14} strokeWidth={3} aria-hidden="true" /> Verstuurd
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
            ].map((m, idx) => (
              <div
                key={m.l}
                className="p-4"
                style={{
                  background: C.card,
                  border: `2px solid ${C.ink}`,
                  boxShadow: `2px 2px 0 ${idx % 2 ? C.blue : C.pink}`,
                }}
              >
                <p
                  className="text-[10px] font-bold uppercase tracking-[0.12em]"
                  style={{ ...mono, color: C.sub }}
                >
                  {m.l}
                </p>
                <p className="mt-1.5 text-[17px] tabular-nums" style={{ ...head, color: C.ink }}>
                  {m.v}
                </p>
              </div>
            ))}
          </div>

          {/* Verklaarbare match */}
          <div className="p-5" style={{ background: C.card, border: `2px solid ${C.ink}` }}>
            <h3 className="text-[18px] uppercase" style={{ ...head, color: C.ink }}>
              Waarom deze match
            </h3>
            <p className="mt-0.5 text-[12.5px]" style={{ ...body, color: C.sub }}>
              Transparant onderbouwd op basis van je geverifieerde profiel.
            </p>
            <div className="mt-4 grid grid-cols-1 gap-5 sm:grid-cols-2">
              <div>
                <p
                  className="inline-flex items-center gap-1.5 px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.12em]"
                  style={{ ...mono, background: C.okSoft, color: C.ok }}
                >
                  <Check size={12} strokeWidth={3} aria-hidden="true" /> Pluspunten
                </p>
                <ul className="mt-2.5 space-y-2">
                  {opdracht.redenen.plus.map((r) => (
                    <li
                      key={r}
                      className="flex items-start gap-2 text-[13px]"
                      style={{ ...body, color: C.ink }}
                    >
                      <span
                        className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center"
                        style={{ background: C.ok }}
                      >
                        <Check
                          size={11}
                          strokeWidth={3}
                          style={{ color: "#fff" }}
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
                  className="inline-flex items-center gap-1.5 px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.12em]"
                  style={{ ...mono, background: C.warnSoft, color: C.warn }}
                >
                  <AlertTriangle size={12} strokeWidth={2.6} aria-hidden="true" /> Aandachtspunten
                </p>
                <ul className="mt-2.5 space-y-2">
                  {opdracht.redenen.min.map((r) => (
                    <li
                      key={r}
                      className="flex items-start gap-2 text-[13px]"
                      style={{ ...body, color: C.sub }}
                    >
                      <span
                        className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center"
                        style={{ background: C.warn }}
                      >
                        <AlertTriangle
                          size={10}
                          strokeWidth={2.6}
                          style={{ color: "#fff" }}
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
          <DuoBlock base={C.pink}>
            <div className="flex items-center gap-4 p-5">
              <span
                className="flex h-[72px] w-[72px] shrink-0 items-center justify-center"
                style={{ background: C.card, border: `2px solid ${C.ink}` }}
              >
                <span
                  className="tabular-nums leading-none"
                  style={{ ...head, color: C.ink, fontSize: 28 }}
                >
                  {opdracht.match}
                </span>
              </span>
              <div>
                <p
                  className="text-[11px] font-bold uppercase tracking-[0.14em]"
                  style={{ ...mono, color: C.ink }}
                >
                  Match-score
                </p>
                <p className="mt-1 text-[13px] font-medium" style={{ ...body, color: C.ink }}>
                  Sterke koppeling met je profiel — reageer nu voor het beste resultaat.
                </p>
              </div>
            </div>
          </DuoBlock>
          <div className="p-5" style={{ background: C.card, border: `2px solid ${C.ink}` }}>
            <p
              className="inline-flex items-center gap-1.5 px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.14em]"
              style={{ ...mono, background: C.ink, color: C.pink }}
            >
              <ShieldCheck size={12} aria-hidden="true" /> Compliance-eis
            </p>
            <p className="mt-2.5 text-[12.5px]" style={{ ...body, color: C.sub }}>
              Vereiste credentials. Je voldoet aan de kern-eisen.
            </p>
            <ul className="mt-3 space-y-2.5">
              {CREDENTIALS.slice(0, 3).map((c) => {
                const t = credTone(c.status);
                const Icon = t.Icon;
                return (
                  <li key={c.naam} className="flex items-center gap-2.5">
                    <span
                      className="flex h-8 w-8 shrink-0 items-center justify-center"
                      style={{ background: t.soft, border: `1.5px solid ${t.fg}` }}
                    >
                      <Icon size={15} style={{ color: t.fg }} aria-hidden="true" />
                    </span>
                    <span
                      className="min-w-0 flex-1 truncate text-[12.5px] font-medium"
                      style={{ ...body, color: C.ink }}
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
        kicker="Proefdruk · Vertrouwen"
        title="Verificatie"
        sub="Je vertrouwens-score — elk geverifieerd bewijsstuk maakt je zichtbaarder."
      />
      <div className="space-y-5 px-6 py-5">
        {/* Score-poster */}
        <DuoBlock base={C.blue}>
          <div className="flex flex-wrap items-center gap-6 p-6">
            <span
              className="flex h-[92px] w-[92px] shrink-0 items-center justify-center"
              style={{ background: C.card, border: `2px solid ${C.ink}` }}
            >
              <span
                className="tabular-nums leading-none"
                style={{ ...head, color: C.ink, fontSize: 34 }}
              >
                {pct}
              </span>
            </span>
            <div className="min-w-[180px] flex-1">
              <p
                className="inline-flex items-center gap-1.5 px-2 py-0.5 text-[11px] font-bold uppercase tracking-[0.16em]"
                style={{ ...mono, background: C.pink, color: C.ink }}
              >
                <BadgeCheck size={12} aria-hidden="true" /> {PROFIEL.trust}
              </p>
              <p className="mt-2 tabular-nums" style={{ ...head, color: "#fff", fontSize: 30 }}>
                {verified}/{total} geverifieerd
              </p>
              <p className="mt-1 text-[12.5px] font-medium" style={{ ...body, color: "#e7e9ff" }}>
                Nog {total - verified} bewijsstuk{total - verified === 1 ? "" : "ken"} te gaan voor
                een volledige score.
              </p>
            </div>
          </div>
        </DuoBlock>

        {/* Verloop-waarschuwing */}
        {expiring && (
          <div
            className="relative flex flex-wrap items-center gap-4 overflow-hidden p-4"
            style={{ background: C.warnSoft, border: `2px solid ${C.ink}` }}
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
              <p className="mt-0.5 text-[12.5px]" style={{ ...body, color: C.sub }}>
                {expiring.detail}. Vernieuw op tijd om je score te behouden.
              </p>
            </div>
            <button
              onClick={() => onGo("acties")}
              className={`inline-flex items-center gap-1.5 px-3.5 py-2 text-[11px] font-bold uppercase tracking-wide transition-transform hover:-translate-y-0.5 ${RING}`}
              style={{ ...mono, background: C.warn, color: "#fff" }}
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
                className="flex items-center gap-3.5 p-4"
                style={{ background: C.card, border: `2px solid ${C.ink}` }}
              >
                <span
                  className="flex h-11 w-11 shrink-0 items-center justify-center"
                  style={{ background: t.soft, border: `2px solid ${t.fg}` }}
                >
                  <Icon size={20} style={{ color: t.fg }} aria-hidden="true" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-[13.5px] font-bold" style={{ color: C.ink }}>
                    {c.naam}
                  </p>
                  <p className="text-[11.5px]" style={{ ...body, color: C.sub }}>
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
        kicker="Werklijst · Vandaag"
        title="Volgende acties"
        sub="Je actielijst op urgentie — vink af en hou je oplage op schema."
      />
      <div className="space-y-3 px-6 py-5">
        {ACTIES.map((a, i) => {
          const warn = a.urgentie === "warning";
          const fg = warn ? C.pinkDeep : C.blueDeep;
          const soft = warn ? C.pinkSoft : C.blueSoft;
          return (
            <div
              key={a.titel}
              className="flex flex-wrap items-start gap-4 p-4"
              style={{
                background: C.card,
                border: `2px solid ${C.ink}`,
                boxShadow: `3px 3px 0 ${warn ? C.pink : C.blue}`,
              }}
            >
              <span
                className="flex h-10 w-10 shrink-0 items-center justify-center text-[16px] tabular-nums"
                style={{ ...head, background: soft, color: fg, border: `2px solid ${fg}` }}
              >
                {i + 1}
              </span>
              <div className="min-w-[180px] flex-1">
                <p
                  className="inline-flex items-center px-1.5 py-0.5 text-[9.5px] font-bold uppercase tracking-[0.14em]"
                  style={{ ...mono, background: fg, color: "#fff" }}
                >
                  {warn ? "Waarschuwing" : "Kans"}
                </p>
                <p
                  className="mt-1 text-[15px] uppercase leading-tight"
                  style={{ ...head, color: C.ink }}
                >
                  {a.titel}
                </p>
                <p className="mt-0.5 text-[12.5px]" style={{ ...body, color: C.sub }}>
                  {a.detail}
                </p>
              </div>
              <button
                onClick={() => onGo(warn ? "verificatie" : "marktplaats")}
                className={`inline-flex items-center gap-1.5 px-3.5 py-2 text-[11px] font-bold uppercase tracking-wide transition-transform hover:-translate-y-0.5 ${RING}`}
                style={{ ...mono, background: warn ? C.pinkDeep : C.ink, color: "#fff" }}
              >
                {a.cta} <ChevronRight size={14} strokeWidth={2.6} aria-hidden="true" />
              </button>
            </div>
          );
        })}

        <div
          className="flex items-center gap-3 p-4"
          style={{ background: C.blueSoft, border: `2px solid ${C.ink}` }}
        >
          <Zap size={16} strokeWidth={2.6} style={{ color: C.blueDeep }} aria-hidden="true" />
          <p className="text-[12.5px]" style={{ ...body, color: C.inkSoft }}>
            Verder is alles op schema. Nieuwe kansen verschijnen hier vanzelf.
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
        kicker="Kasboek · Omzet"
        title="Facturen"
        sub="Je omzet in twee inkten — wat binnen is en wat nog onderweg is."
        right={
          <button
            className={`inline-flex items-center gap-2 px-3.5 py-2 text-[11px] font-bold uppercase tracking-wide transition-transform hover:-translate-y-0.5 ${RING}`}
            style={{ ...mono, background: C.ink, color: "#fff", boxShadow: `3px 3px 0 ${C.pink}` }}
          >
            <Plus size={14} strokeWidth={2.6} aria-hidden="true" /> Nieuwe factuur
          </button>
        }
      />
      <div className="space-y-5 px-6 py-5">
        <DuoBlock base={C.blue}>
          <div className="flex flex-wrap items-center gap-6 p-5">
            <div className="flex items-center gap-3">
              <span
                className="flex h-[70px] w-[70px] shrink-0 items-center justify-center"
                style={{ background: C.card, border: `2px solid ${C.ink}` }}
              >
                <span
                  className="tabular-nums leading-none"
                  style={{ ...head, color: C.ink, fontSize: 26 }}
                >
                  {pct}
                </span>
              </span>
              <span
                className="text-[10.5px] font-bold uppercase tracking-wide"
                style={{ ...mono, color: "#e7e9ff" }}
              >
                % betaald
              </span>
            </div>
            <div className="flex flex-1 flex-wrap gap-6">
              <div
                className="px-3 py-2"
                style={{ background: C.card, border: `2px solid ${C.ink}` }}
              >
                <p
                  className="text-[10px] font-bold uppercase tracking-[0.12em]"
                  style={{ ...mono, color: C.ok }}
                >
                  Ontvangen
                </p>
                <p className="mt-1 text-[24px] tabular-nums" style={{ ...head, color: C.ink }}>
                  € {betaald.toLocaleString("nl-NL")}
                </p>
              </div>
              <div
                className="px-3 py-2"
                style={{ background: C.card, border: `2px solid ${C.ink}` }}
              >
                <p
                  className="text-[10px] font-bold uppercase tracking-[0.12em]"
                  style={{ ...mono, color: C.pinkDeep }}
                >
                  Openstaand
                </p>
                <p className="mt-1 text-[24px] tabular-nums" style={{ ...head, color: C.ink }}>
                  € {open.toLocaleString("nl-NL")}
                </p>
              </div>
            </div>
          </div>
        </DuoBlock>

        <div
          className="overflow-x-auto"
          style={{ border: `2px solid ${C.ink}`, background: C.card }}
        >
          <table className="w-full text-left">
            <thead>
              <tr
                className="text-[10px] font-bold uppercase tracking-[0.08em]"
                style={{ ...mono, background: C.ink, color: C.paper }}
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
                    style={{ borderTop: i === 0 ? "none" : `1.5px solid ${C.lineSoft}` }}
                  >
                    <td
                      className="px-4 py-3.5 text-[12px] font-bold tabular-nums"
                      style={{ ...mono, color: C.sub }}
                    >
                      {f.nr}
                    </td>
                    <td
                      className="px-4 py-3.5 text-[13px] font-medium"
                      style={{ ...body, color: C.ink }}
                    >
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
                        className="inline-flex items-center gap-1.5 px-2.5 py-1 text-[10.5px] font-bold uppercase tracking-wide"
                        style={{
                          ...mono,
                          color: t.fg,
                          background: t.soft,
                          border: `1.5px solid ${t.fg}`,
                        }}
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
