"use client";

// Concept 345 — "Schaduwspel" · high-contrast licht & schaduw, sculpturaal en gedurfd.
// Dramatische harde slagschaduwen (offset box-shadows zonder blur), spotlight-vlakken en scherpe
// randen bouwen diepte op — niet met kleur, maar met licht. Overwegend monochroom (wit, houtskool,
// zwart) met één warm amber-accent dat als een lichtstraal door het scherm valt. Grote typografische
// koppen zetten een sterke hiërarchie neer; alles staat vast en zelfverzekerd op zijn plek.
// Verificatie voelt hier solide en onwrikbaar: wat geverifieerd is, staat in het licht.
// Fonts: --font-lab-anton (koppen, massief) + --font-lab-space (sub-koppen) + --font-lab-inter (tekst).

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
  Sun,
  Sparkles,
  Zap,
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

/* ---------- Palet (monochroom + één warm amber-accent) ---------- */

const C = {
  canvas: "#e8e6e1",
  paper: "#ffffff",
  paperAlt: "#f4f2ed",
  ink: "#141210",
  charcoal: "#221f1b",
  inkSoft: "#3a352f",
  sub: "#5c554c",
  faint: "#9a9188",
  line: "#dcd8d0",
  lineSoft: "#ebe8e1",
  amber: "#b45309", // amber-tekst, WCAG-veilig op licht
  amberBright: "#f59e0b",
  amberSoft: "#fbecd4",
  onDark: "#f6f3ec",
  onDarkSub: "#b3ab9f",
  ok: "#3f6212", // olijf voor "betaald/verified" — blijft binnen aardse palet
  okSoft: "#e9f0dc",
  warn: "#b45309",
  warnSoft: "#fbecd4",
  alert: "#b91c1c",
  alertSoft: "#f8e1e0",
  info: "#3a352f",
  infoSoft: "#ebe8e1",
};

const display = { fontFamily: "var(--font-lab-anton), system-ui, sans-serif" };
const head = { fontFamily: "var(--font-lab-space), system-ui, sans-serif" };
const body = { fontFamily: "var(--font-lab-inter), system-ui, sans-serif" };

// Harde slagschaduw — dé signatuur van dit concept (offset, geen blur).
const HARD = `6px 6px 0 0 ${C.ink}`;
const HARD_SM = `4px 4px 0 0 ${C.ink}`;
const HARD_AMBER = `6px 6px 0 0 ${C.amberBright}`;

const RING =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#141210] focus-visible:ring-offset-2 focus-visible:ring-offset-[#e8e6e1]";

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
      className="inline-flex items-center gap-1.5 px-2 py-1 text-[10.5px] font-bold uppercase tracking-[0.05em]"
      style={{ ...body, color: t.fg, background: t.soft, border: `1.5px solid ${C.ink}` }}
    >
      <Icon size={11} strokeWidth={2.6} aria-hidden="true" />
      {t.label}
    </span>
  );
}

// Sculpturale KPI-balk: staafje dat als een schaduwvorm opstaat.
function ShadowBars({ data, on }: { data: number[]; on?: boolean }) {
  const max = Math.max(...data) || 1;
  return (
    <div className="flex items-end gap-1.5" style={{ height: 44 }} aria-hidden="true">
      {data.map((v, i) => {
        const last = i === data.length - 1;
        return (
          <span
            key={i}
            className="w-2.5"
            style={{
              height: `${Math.max(14, (v / max) * 100)}%`,
              background: last ? (on ? C.amberBright : C.ink) : C.line,
              boxShadow: last ? `2px 2px 0 0 ${C.ink}` : "none",
            }}
          />
        );
      })}
    </div>
  );
}

// Grote licht-curve op donker vlak.
function LightCurve({ data, height = 88 }: { data: number[]; height?: number }) {
  const w = 320;
  const h = height;
  const min = Math.min(...data);
  const max = Math.max(...data);
  const span = max - min || 1;
  const pts = data.map((v, i) => {
    const x = (i / (data.length - 1)) * w;
    const y = h - 8 - ((v - min) / span) * (h - 20);
    return [x, y] as const;
  });
  const line = pts
    .map((p, i) => `${i === 0 ? "M" : "L"}${p[0].toFixed(1)} ${p[1].toFixed(1)}`)
    .join(" ");
  const last = pts[pts.length - 1];
  return (
    <svg
      viewBox={`0 0 ${w} ${h}`}
      preserveAspectRatio="none"
      className="w-full"
      style={{ height }}
      aria-hidden="true"
    >
      <path d={`${line} L${w} ${h} L0 ${h} Z`} fill={C.amberBright} fillOpacity="0.12" />
      <path
        d={line}
        fill="none"
        stroke={C.amberBright}
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {last && (
        <circle
          cx={last[0]}
          cy={last[1]}
          r="5"
          fill={C.amberBright}
          stroke={C.charcoal}
          strokeWidth="2"
        />
      )}
    </svg>
  );
}

function MiniLine({ data, color = C.ink }: { data: number[]; color?: string }) {
  const w = 88;
  const h = 26;
  const min = Math.min(...data);
  const max = Math.max(...data);
  const span = max - min || 1;
  const pts = data
    .map((v, i) => {
      const x = (i / (data.length - 1)) * w;
      const y = h - 3 - ((v - min) / span) * (h - 6);
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(" ");
  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} aria-hidden="true">
      <polyline
        points={pts}
        fill="none"
        stroke={color}
        strokeWidth="2.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

// Groot schaduw-cijfer: het getal werpt zijn eigen schaduw.
function ShadowNumber({
  value,
  unit,
  tone = "ink",
}: {
  value: string;
  unit?: string;
  tone?: "ink" | "amber" | "light";
}) {
  const color = tone === "amber" ? C.amberBright : tone === "light" ? C.onDark : C.ink;
  const shadow =
    tone === "light" ? "rgba(0,0,0,0.55)" : tone === "amber" ? "rgba(20,18,16,0.25)" : C.line;
  return (
    <span
      className="text-[46px] font-normal tabular-nums leading-none"
      style={{ ...display, color, textShadow: `3px 3px 0 ${shadow}` }}
    >
      {value}
      {unit && (
        <span
          className="ml-1 text-[20px]"
          style={{ color: tone === "light" ? C.onDarkSub : C.faint }}
        >
          {unit}
        </span>
      )}
    </span>
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
          className="inline-flex items-center gap-1.5 px-2 py-0.5 text-[10.5px] font-bold uppercase tracking-[0.2em]"
          style={{ ...head, color: C.onDark, background: C.ink }}
        >
          {kicker}
        </p>
        <h1
          className="mt-2 text-[34px] font-normal uppercase leading-[0.95] tracking-tight"
          style={{ ...display, color: C.ink, textShadow: `2px 2px 0 ${C.line}` }}
        >
          {title}
        </h1>
        {sub && (
          <p className="mt-2 max-w-lg text-[13px]" style={{ color: C.sub }}>
            {sub}
          </p>
        )}
      </div>
      {right}
    </div>
  );
}

/* ---------- Hoofdcomponent ---------- */

export function Concept345() {
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
      <style>{`@keyframes sp-fade{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}
      @keyframes sp-pulse{0%,100%{opacity:.5}50%{opacity:.85}}`}</style>

      {/* Header — massief zwart blok, licht valt erop */}
      <header style={{ background: C.charcoal }}>
        <div className="flex h-16 items-center gap-3 px-5">
          <div
            className="flex h-9 w-9 items-center justify-center text-[16px] font-normal"
            style={{
              ...display,
              color: C.charcoal,
              background: C.amberBright,
              boxShadow: `3px 3px 0 0 rgba(0,0,0,0.4)`,
            }}
            aria-hidden="true"
          >
            Z
          </div>
          <span
            className="text-[18px] font-normal uppercase tracking-wide"
            style={{ ...display, color: C.onDark }}
          >
            Schaduwspel
          </span>
          <span
            className="ml-1 hidden px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.14em] sm:inline"
            style={{ ...head, background: C.amberBright, color: C.charcoal }}
          >
            ZZP
          </span>

          <div className="ml-auto flex items-center gap-2">
            <button
              aria-label="Zoeken"
              className={`p-2 transition-colors hover:bg-[#3a352f] ${RING}`}
              style={{ border: `1.5px solid ${C.inkSoft}`, color: C.onDarkSub }}
            >
              <Search size={15} aria-hidden="true" />
            </button>
            <button
              aria-label="Meldingen"
              className={`relative p-2 transition-colors hover:bg-[#3a352f] ${RING}`}
              style={{ border: `1.5px solid ${C.inkSoft}`, color: C.onDarkSub }}
            >
              <Bell size={15} aria-hidden="true" />
              <span
                className="absolute right-1.5 top-1.5 h-2 w-2"
                style={{ background: C.amberBright }}
                aria-hidden="true"
              />
            </button>
            <div className="ml-1 flex items-center gap-2.5">
              <div
                className="flex h-9 w-9 items-center justify-center text-[11px] font-bold"
                style={{ ...head, background: C.amberBright, color: C.charcoal }}
                aria-hidden="true"
              >
                {PROFIEL.initialen}
              </div>
              <div className="hidden leading-tight sm:block">
                <p className="text-[12.5px] font-semibold" style={{ color: C.onDark }}>
                  {PROFIEL.naam}
                </p>
                <p
                  className="flex items-center gap-1 text-[10.5px] font-bold uppercase tracking-wide"
                  style={{ color: C.amberBright }}
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
                className={`flex shrink-0 items-center gap-2 px-3 py-2 text-[12px] font-bold uppercase tracking-[0.06em] transition-all ${RING}`}
                style={{
                  color: on ? C.charcoal : C.onDarkSub,
                  background: on ? C.amberBright : "transparent",
                  border: `1.5px solid ${on ? C.amberBright : C.inkSoft}`,
                  boxShadow: on ? `3px 3px 0 0 rgba(0,0,0,0.4)` : "none",
                }}
              >
                <Icon size={14} aria-hidden="true" />
                {s.label}
              </button>
            );
          })}
        </nav>
      </header>

      <div key={screen} className="mx-auto max-w-6xl" style={{ animation: "sp-fade 0.32s ease" }}>
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
        className="h-8 w-56"
        style={{
          background: C.paper,
          border: `1.5px solid ${C.ink}`,
          boxShadow: HARD_SM,
          animation: "sp-pulse 1.3s infinite",
        }}
      />
      <div
        className="mt-8 h-44"
        style={{
          background: C.paper,
          border: `1.5px solid ${C.ink}`,
          boxShadow: HARD,
          animation: "sp-pulse 1.3s infinite",
        }}
      />
      <div className="mt-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
        {[0, 1, 2, 3].map((i) => (
          <div
            key={i}
            className="h-24"
            style={{
              background: C.paper,
              border: `1.5px solid ${C.ink}`,
              boxShadow: HARD_SM,
              animation: "sp-pulse 1.3s infinite",
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
  const [focus, setFocus] = useState(0);
  const [feed, setFeed] = useState<"error" | "loading" | "ok">("error");
  const hero = (KPIS[focus] ?? KPIS[0]) as (typeof KPIS)[number];
  const warn = ACTIES[0];

  const retry = () => {
    setFeed("loading");
    window.setTimeout(() => setFeed("ok"), 700);
  };

  return (
    <div>
      <PageHead
        kicker="In het licht"
        title={`Sterk staand, ${PROFIEL.naam.split(" ")[0]}`}
        sub="Je praktijk in scherp contrast — cijfers die opstaan uit de schaduw en wat om aandacht vraagt."
      />

      <div className="space-y-6 px-6 py-6">
        {/* Spotlight-hero op donker */}
        <div
          className="relative overflow-hidden"
          style={{
            background: `radial-gradient(120% 100% at 78% 0%, #34302a 0%, ${C.charcoal} 46%, ${C.ink} 100%)`,
            border: `2px solid ${C.ink}`,
            boxShadow: HARD_AMBER,
          }}
        >
          {/* spotlight-kegel */}
          <div
            className="pointer-events-none absolute -right-10 -top-24 h-72 w-72"
            style={{
              background:
                "radial-gradient(circle, rgba(245,158,11,0.28) 0%, rgba(245,158,11,0) 70%)",
            }}
            aria-hidden="true"
          />
          <div className="relative flex flex-wrap items-start justify-between gap-5 p-6">
            <div className="min-w-0">
              <p
                className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-[0.18em]"
                style={{ ...head, color: C.amberBright }}
              >
                <Sun size={13} aria-hidden="true" /> {hero.label}
              </p>
              <div className="mt-3">
                <ShadowNumber value={hero.value} tone="light" />
              </div>
              <p
                className="mt-3 flex items-center gap-2 text-[12.5px]"
                style={{ color: C.onDarkSub }}
              >
                <span
                  className="inline-flex items-center gap-1 px-2 py-0.5 text-[11px] font-bold tabular-nums"
                  style={{
                    background: hero.up ? C.amberBright : "#5c554c",
                    color: hero.up ? C.charcoal : C.onDark,
                  }}
                >
                  {hero.up ? (
                    <ArrowUpRight size={12} aria-hidden="true" />
                  ) : (
                    <ArrowDownRight size={12} aria-hidden="true" />
                  )}
                  {hero.trend}
                </span>
                t.o.v. vorige periode
              </p>
            </div>
            <div className="text-right">
              <ShadowBars data={hero.spark} on />
              <p
                className="mt-2 text-[10px] font-bold uppercase tracking-[0.16em]"
                style={{ color: C.onDarkSub }}
              >
                laatste 7
              </p>
            </div>
          </div>
          <div className="relative px-3 pb-3">
            <LightCurve data={hero.spark} />
          </div>
          {/* KPI-kiezer */}
          <div
            className="relative flex gap-1.5 overflow-x-auto border-t p-2.5"
            style={{ borderColor: "rgba(255,255,255,0.1)" }}
            role="tablist"
            aria-label="Kies cijfer"
          >
            {KPIS.map((k, i) => {
              const on = i === focus;
              return (
                <button
                  key={k.label}
                  role="tab"
                  aria-selected={on}
                  onClick={() => setFocus(i)}
                  className={`flex flex-1 shrink-0 flex-col items-start gap-1 px-3 py-2 text-left transition-all ${RING}`}
                  style={{
                    background: on ? "rgba(245,158,11,0.14)" : "transparent",
                    border: `1.5px solid ${on ? C.amberBright : "transparent"}`,
                  }}
                >
                  <span
                    className="text-[10px] font-bold uppercase tracking-wide"
                    style={{ color: on ? C.amberBright : C.onDarkSub }}
                  >
                    {k.label}
                  </span>
                  <span
                    className="text-[15px] font-bold tabular-nums"
                    style={{ ...head, color: on ? C.onDark : C.onDarkSub }}
                  >
                    {k.value}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Sculpturale KPI-tegels */}
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          {KPIS.map((k) => (
            <div
              key={k.label}
              className="p-4"
              style={{ background: C.paper, border: `1.5px solid ${C.ink}`, boxShadow: HARD_SM }}
            >
              <div className="flex items-center justify-between">
                <p
                  className="text-[10.5px] font-bold uppercase tracking-wide"
                  style={{ color: C.sub }}
                >
                  {k.label}
                </p>
                <span
                  className="inline-flex items-center gap-0.5 text-[10.5px] font-bold tabular-nums"
                  style={{ color: k.up ? C.ok : C.amber }}
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
                className="mt-1.5 text-[24px] font-bold tabular-nums leading-none"
                style={{ ...head, color: C.ink }}
              >
                {k.value}
              </p>
              <div className="mt-2.5">
                <MiniLine data={k.spark} color={k.up ? C.ink : C.amber} />
              </div>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
          {/* Volgende actie */}
          {warn && (
            <div
              className="p-5 lg:col-span-2"
              style={{ background: C.amberSoft, border: `2px solid ${C.ink}`, boxShadow: HARD }}
              role="alert"
            >
              <p
                className="inline-flex items-center gap-1.5 px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.16em]"
                style={{ ...head, background: C.ink, color: C.amberBright }}
              >
                <Zap size={12} aria-hidden="true" /> Vraagt aandacht
              </p>
              <h2
                className="mt-3 text-[22px] font-normal uppercase leading-[0.98]"
                style={{ ...display, color: C.ink }}
              >
                {warn.titel}
              </h2>
              <p className="mt-2 max-w-md text-[13px]" style={{ color: C.inkSoft }}>
                {warn.detail}
              </p>
              <button
                onClick={() => onGo("verificatie")}
                className={`mt-4 inline-flex items-center gap-2 px-4 py-2.5 text-[13px] font-bold uppercase tracking-wide transition-transform active:translate-x-[2px] active:translate-y-[2px] ${RING}`}
                style={{ background: C.ink, color: C.amberBright, boxShadow: HARD_SM }}
              >
                {warn.cta} <ArrowRight size={15} strokeWidth={2.6} aria-hidden="true" />
              </button>
            </div>
          )}

          {/* Bericht met error→loading→ok */}
          <div
            className="p-5"
            style={{ background: C.paper, border: `1.5px solid ${C.ink}`, boxShadow: HARD_SM }}
          >
            <h3
              className="flex items-center gap-1.5 text-[13px] font-bold uppercase tracking-wide"
              style={{ ...head, color: C.ink }}
            >
              <Sparkles size={14} style={{ color: C.amber }} aria-hidden="true" /> Nieuwste bericht
            </h3>
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
                    className={`mt-2 inline-flex items-center gap-1.5 px-3 py-1.5 text-[12px] font-bold uppercase tracking-wide transition-colors ${RING}`}
                    style={{ border: `1.5px solid ${C.ink}`, color: C.ink }}
                  >
                    <RotateCcw size={12} aria-hidden="true" /> Opnieuw
                  </button>
                </div>
              )}
              {feed === "loading" && (
                <div className="space-y-2" role="status" aria-live="polite">
                  <span className="sr-only">Laden…</span>
                  <span
                    className="block h-3"
                    style={{
                      background: C.line,
                      width: "60%",
                      animation: "sp-pulse 1.3s infinite",
                    }}
                  />
                  <span
                    className="block h-3"
                    style={{
                      background: C.line,
                      width: "85%",
                      animation: "sp-pulse 1.3s infinite",
                    }}
                  />
                </div>
              )}
              {feed === "ok" && (
                <div>
                  <p className="text-[12.5px] font-bold" style={{ color: C.ink }}>
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
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-[20px] font-normal uppercase" style={{ ...display, color: C.ink }}>
              Beste matches
            </h2>
            <button
              onClick={() => onGo("marktplaats")}
              className={`inline-flex items-center gap-1 px-2 py-1 text-[12px] font-bold uppercase tracking-wide ${RING}`}
              style={{ color: C.amber }}
            >
              Alles <ChevronRight size={14} aria-hidden="true" />
            </button>
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {OPDRACHTEN.map((o) => (
              <button
                key={o.id}
                onClick={() => onOpen(o.id)}
                className={`p-4 text-left transition-transform hover:-translate-x-[1px] hover:-translate-y-[1px] ${RING}`}
                style={{ background: C.paper, border: `1.5px solid ${C.ink}`, boxShadow: HARD_SM }}
              >
                <div className="flex items-start justify-between">
                  <span
                    className="flex h-12 w-12 items-center justify-center text-[16px] font-bold tabular-nums"
                    style={{ ...head, background: C.ink, color: C.amberBright }}
                  >
                    {o.match}
                  </span>
                  <span
                    className="text-[10px] font-bold uppercase tracking-wide"
                    style={{ color: C.faint }}
                  >
                    {o.id}
                  </span>
                </div>
                <p
                  className="mt-3 text-[15px] font-bold leading-snug"
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
                <div
                  className="mt-3 flex items-center justify-between border-t-2 pt-2.5"
                  style={{ borderColor: C.line }}
                >
                  <span
                    className="text-[14px] font-bold tabular-nums"
                    style={{ ...head, color: C.ink }}
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
        kicker="De etalage"
        title="Marktplaats"
        sub="Opdrachten in scherp contrast — de sterkste matches vangen het licht."
        right={
          <div
            className="inline-flex items-center"
            style={{ border: `1.5px solid ${C.ink}`, boxShadow: HARD_SM, background: C.paper }}
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
                  className={`px-3 py-1.5 text-[12px] font-bold uppercase tracking-wide transition-colors ${RING}`}
                  style={{
                    background: on ? C.ink : "transparent",
                    color: on ? C.amberBright : C.sub,
                  }}
                >
                  {s === "match" ? "Match" : "Tarief"}
                </button>
              );
            })}
          </div>
        }
      />
      <div className="px-6 py-6">
        <div
          className="mb-5 flex items-center gap-2.5 px-3.5 py-2.5"
          style={{ background: C.paper, border: `1.5px solid ${C.ink}`, boxShadow: HARD_SM }}
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
            className="flex flex-col items-center justify-center px-6 py-16 text-center"
            style={{ border: `2px dashed ${C.ink}`, background: C.paperAlt }}
          >
            <span
              className="flex h-14 w-14 items-center justify-center"
              style={{ background: C.paper, border: `1.5px solid ${C.ink}`, boxShadow: HARD_SM }}
              aria-hidden="true"
            >
              <Search size={22} style={{ color: C.faint }} />
            </span>
            <p
              className="mt-5 text-[18px] font-normal uppercase"
              style={{ ...display, color: C.ink }}
            >
              Niets in het licht
            </p>
            <p className="mt-1 max-w-xs text-[12.5px]" style={{ color: C.sub }}>
              Geen resultaat voor “{q}”. Verbreed je zoekopdracht.
            </p>
            <button
              onClick={() => setQ("")}
              className={`mt-4 px-4 py-2 text-[12.5px] font-bold uppercase tracking-wide transition-colors ${RING}`}
              style={{ border: `1.5px solid ${C.ink}`, color: C.ink }}
            >
              Zoekopdracht wissen
            </button>
          </div>
        ) : (
          <ul className="space-y-4">
            {filtered.map((o, i) => (
              <li
                key={o.id}
                className="p-4"
                style={{ background: C.paper, border: `1.5px solid ${C.ink}`, boxShadow: HARD_SM }}
              >
                <div className="flex flex-wrap items-start gap-4">
                  <div className="flex items-center gap-3">
                    <span
                      className="flex h-7 w-7 items-center justify-center text-[12px] font-bold tabular-nums"
                      style={{
                        ...head,
                        background: i === 0 ? C.amberBright : C.paperAlt,
                        color: i === 0 ? C.charcoal : C.faint,
                        border: `1.5px solid ${C.ink}`,
                      }}
                    >
                      {i + 1}
                    </span>
                    <span
                      className="flex h-14 w-14 items-center justify-center text-[18px] font-bold tabular-nums"
                      style={{ ...head, background: C.ink, color: C.amberBright }}
                    >
                      {o.match}
                    </span>
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span
                        className="text-[10px] font-bold uppercase tracking-wide"
                        style={{ color: C.faint }}
                      >
                        {o.id}
                      </span>
                      {o.tags.map((t) => (
                        <span
                          key={t}
                          className="px-2 py-0.5 text-[10.5px] font-bold uppercase tracking-wide"
                          style={{
                            background: C.paperAlt,
                            color: C.sub,
                            border: `1px solid ${C.line}`,
                          }}
                        >
                          {t}
                        </span>
                      ))}
                    </div>
                    <p className="mt-1.5 text-[16px] font-bold" style={{ ...head, color: C.ink }}>
                      {o.titel}
                    </p>
                    <p
                      className="mt-0.5 flex items-center gap-1 text-[12.5px]"
                      style={{ color: C.sub }}
                    >
                      <MapPin size={12} aria-hidden="true" /> {o.opdrachtgever} · {o.plaats}
                    </p>
                    <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-[12.5px]">
                      <span className="font-bold tabular-nums" style={{ ...head, color: C.ink }}>
                        {o.tarief}
                      </span>
                      <span style={{ color: C.sub }}>{o.uren}</span>
                      <span style={{ color: C.sub }}>{o.start}</span>
                    </div>
                  </div>
                  <button
                    onClick={() => onOpen(o.id)}
                    className={`inline-flex items-center gap-1.5 self-center px-3.5 py-2 text-[12.5px] font-bold uppercase tracking-wide transition-transform active:translate-x-[2px] active:translate-y-[2px] ${RING}`}
                    style={{ background: C.ink, color: C.amberBright, boxShadow: HARD_SM }}
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
              className={`px-3.5 py-2 text-[12.5px] font-bold uppercase tracking-wide transition-colors ${RING}`}
              style={{ border: `1.5px solid ${C.ink}`, color: C.sub, background: C.paper }}
            >
              Terug
            </button>
            <button
              onClick={react}
              disabled={state !== "idle"}
              aria-live="polite"
              className={`inline-flex items-center gap-2 px-4 py-2 text-[12.5px] font-bold uppercase tracking-wide transition-transform active:translate-x-[2px] active:translate-y-[2px] disabled:opacity-90 ${RING}`}
              style={{
                background: state === "sent" ? C.ok : C.ink,
                color: state === "sent" ? C.onDark : C.amberBright,
                boxShadow: HARD_SM,
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

      <div className="grid grid-cols-1 gap-5 px-6 py-6 lg:grid-cols-3">
        <div className="space-y-5 lg:col-span-2">
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            {[
              { l: "Tarief", v: opdracht.tarief },
              { l: "Omvang", v: opdracht.uren },
              { l: "Start", v: opdracht.start },
              { l: "Match", v: `${opdracht.match}%` },
            ].map((m) => (
              <div
                key={m.l}
                className="p-4"
                style={{ background: C.paper, border: `1.5px solid ${C.ink}`, boxShadow: HARD_SM }}
              >
                <p
                  className="text-[10px] font-bold uppercase tracking-[0.1em]"
                  style={{ color: C.faint }}
                >
                  {m.l}
                </p>
                <p
                  className="mt-1.5 text-[17px] font-bold tabular-nums"
                  style={{ ...head, color: C.ink }}
                >
                  {m.v}
                </p>
              </div>
            ))}
          </div>

          {/* Verklaarbare match */}
          <div
            className="p-5"
            style={{ background: C.paper, border: `1.5px solid ${C.ink}`, boxShadow: HARD_SM }}
          >
            <h3 className="text-[18px] font-normal uppercase" style={{ ...display, color: C.ink }}>
              Waarom deze match
            </h3>
            <p className="mt-0.5 text-[12.5px]" style={{ color: C.sub }}>
              Transparant onderbouwd op basis van je geverifieerde profiel.
            </p>
            <div className="mt-4 grid grid-cols-1 gap-5 sm:grid-cols-2">
              <div>
                <p
                  className="inline-flex items-center gap-1.5 px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.12em]"
                  style={{
                    ...head,
                    background: C.okSoft,
                    color: C.ok,
                    border: `1px solid ${C.ok}`,
                  }}
                >
                  <Check size={12} strokeWidth={3} aria-hidden="true" /> Pluspunten
                </p>
                <ul className="mt-3 space-y-2">
                  {opdracht.redenen.plus.map((r) => (
                    <li
                      key={r}
                      className="flex items-start gap-2 text-[13px]"
                      style={{ color: C.ink }}
                    >
                      <span
                        className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center"
                        style={{ background: C.ink }}
                      >
                        <Check
                          size={11}
                          strokeWidth={3}
                          style={{ color: C.amberBright }}
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
                  style={{
                    ...head,
                    background: C.warnSoft,
                    color: C.warn,
                    border: `1px solid ${C.warn}`,
                  }}
                >
                  <AlertTriangle size={12} strokeWidth={2.6} aria-hidden="true" /> Aandacht
                </p>
                <ul className="mt-3 space-y-2">
                  {opdracht.redenen.min.map((r) => (
                    <li
                      key={r}
                      className="flex items-start gap-2 text-[13px]"
                      style={{ color: C.sub }}
                    >
                      <span
                        className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center"
                        style={{ background: C.warnSoft, border: `1px solid ${C.warn}` }}
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

        <div className="space-y-5">
          <div
            className="relative overflow-hidden p-5"
            style={{ background: C.charcoal, border: `2px solid ${C.ink}`, boxShadow: HARD_AMBER }}
          >
            <div
              className="pointer-events-none absolute -right-8 -top-12 h-44 w-44"
              style={{
                background:
                  "radial-gradient(circle, rgba(245,158,11,0.3) 0%, rgba(245,158,11,0) 70%)",
              }}
              aria-hidden="true"
            />
            <p
              className="relative text-[11px] font-bold uppercase tracking-[0.16em]"
              style={{ ...head, color: C.amberBright }}
            >
              Match-score
            </p>
            <div className="relative mt-2">
              <ShadowNumber value={`${opdracht.match}`} unit="%" tone="light" />
            </div>
            <p className="relative mt-2 text-[12.5px]" style={{ color: C.onDarkSub }}>
              Sterke koppeling met je profiel — reageer nu terwijl de kans in het licht staat.
            </p>
          </div>
          <div
            className="p-5"
            style={{ background: C.paper, border: `1.5px solid ${C.ink}`, boxShadow: HARD_SM }}
          >
            <p
              className="inline-flex items-center gap-1.5 px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.14em]"
              style={{ ...head, background: C.ink, color: C.amberBright }}
            >
              <ShieldCheck size={12} aria-hidden="true" /> Compliance-eis
            </p>
            <p className="mt-3 text-[12.5px]" style={{ color: C.sub }}>
              Vereiste credentials voor deze opdracht. Je voldoet aan de kern-eisen.
            </p>
            <ul className="mt-3 space-y-2.5">
              {CREDENTIALS.slice(0, 3).map((c) => {
                const t = credTone(c.status);
                const Icon = t.Icon;
                return (
                  <li key={c.naam} className="flex items-center gap-2.5">
                    <span
                      className="flex h-8 w-8 shrink-0 items-center justify-center"
                      style={{ background: t.soft, border: `1.5px solid ${C.ink}` }}
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
        kicker="Vast en zeker"
        title="Verificatie"
        sub="Je vertrouwen staat in het licht — elk geverifieerd bewijsstuk werpt een vaste schaduw."
      />
      <div className="space-y-6 px-6 py-6">
        {/* Vertrouwens-blok op donker */}
        <div
          className="relative overflow-hidden p-6"
          style={{ background: C.charcoal, border: `2px solid ${C.ink}`, boxShadow: HARD_AMBER }}
        >
          <div
            className="pointer-events-none absolute -left-10 -top-16 h-64 w-64"
            style={{
              background:
                "radial-gradient(circle, rgba(245,158,11,0.24) 0%, rgba(245,158,11,0) 70%)",
            }}
            aria-hidden="true"
          />
          <div className="relative flex flex-wrap items-center gap-6">
            <div>
              <p
                className="text-[11px] font-bold uppercase tracking-[0.16em]"
                style={{ ...head, color: C.amberBright }}
              >
                {PROFIEL.trust}
              </p>
              <div className="mt-2">
                <ShadowNumber value={`${verified}/${total}`} tone="light" />
              </div>
              <p className="mt-2 text-[12.5px]" style={{ color: C.onDarkSub }}>
                Nog {total - verified} bewijsstuk{total - verified === 1 ? "" : "ken"} te gaan voor
                een volledig profiel.
              </p>
            </div>
            <div className="ml-auto flex items-center gap-3">
              <div
                className="flex h-2 w-40 overflow-hidden"
                style={{ background: "rgba(255,255,255,0.14)" }}
                aria-hidden="true"
              >
                <div className="h-full" style={{ width: `${pct}%`, background: C.amberBright }} />
              </div>
              <span
                className="text-[16px] font-bold tabular-nums"
                style={{ ...head, color: C.amberBright }}
              >
                {pct}%
              </span>
            </div>
          </div>
        </div>

        {expiring && (
          <div
            className="flex flex-wrap items-center gap-4 p-4"
            style={{ background: C.warnSoft, border: `2px solid ${C.ink}`, boxShadow: HARD_SM }}
            role="alert"
          >
            <AlertTriangle
              size={22}
              style={{ color: C.warn }}
              className="shrink-0"
              aria-hidden="true"
            />
            <div className="min-w-[180px] flex-1">
              <p className="text-[13.5px] font-bold" style={{ color: C.ink }}>
                {expiring.naam} verloopt binnenkort
              </p>
              <p className="mt-0.5 text-[12.5px]" style={{ color: C.inkSoft }}>
                {expiring.detail}. Vernieuw op tijd zodat je zichtbaar blijft.
              </p>
            </div>
            <button
              onClick={() => onGo("acties")}
              className={`inline-flex items-center gap-1.5 px-3.5 py-2 text-[12.5px] font-bold uppercase tracking-wide transition-transform active:translate-x-[2px] active:translate-y-[2px] ${RING}`}
              style={{ background: C.ink, color: C.amberBright, boxShadow: HARD_SM }}
            >
              Vernieuwen <ArrowRight size={13} strokeWidth={2.6} aria-hidden="true" />
            </button>
          </div>
        )}

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {CREDENTIALS.map((c) => {
            const t = credTone(c.status);
            const Icon = t.Icon;
            return (
              <div
                key={c.naam}
                className="flex items-center gap-3.5 p-4"
                style={{ background: C.paper, border: `1.5px solid ${C.ink}`, boxShadow: HARD_SM }}
              >
                <span
                  className="flex h-12 w-12 shrink-0 items-center justify-center"
                  style={{ background: t.soft, border: `1.5px solid ${C.ink}` }}
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
        kicker="Volgende zet"
        title="Volgende acties"
        sub="Je actielijst op volgorde van urgentie — wat nu in de spotlight staat, pak je eerst."
      />
      <div className="space-y-4 px-6 py-6">
        {ACTIES.map((a, i) => {
          const warn = a.urgentie === "warning";
          const fg = warn ? C.amber : C.info;
          const soft = warn ? C.amberSoft : C.infoSoft;
          return (
            <div
              key={a.titel}
              className="flex flex-wrap items-start gap-4 p-4"
              style={{ background: C.paper, border: `1.5px solid ${C.ink}`, boxShadow: HARD_SM }}
            >
              <span
                className="flex h-11 w-11 shrink-0 items-center justify-center text-[16px] font-bold tabular-nums"
                style={{
                  ...head,
                  background: warn ? C.amberBright : C.ink,
                  color: warn ? C.charcoal : C.onDark,
                }}
              >
                {i + 1}
              </span>
              <div className="min-w-[180px] flex-1">
                <p
                  className="inline-flex items-center gap-1 px-1.5 py-0.5 text-[9.5px] font-bold uppercase tracking-[0.14em]"
                  style={{ ...head, background: soft, color: fg, border: `1px solid ${fg}` }}
                >
                  {warn ? "Waarschuwing" : "Kans"}
                </p>
                <p className="mt-1.5 text-[15px] font-bold" style={{ ...head, color: C.ink }}>
                  {a.titel}
                </p>
                <p className="mt-0.5 text-[12.5px]" style={{ color: C.sub }}>
                  {a.detail}
                </p>
              </div>
              <button
                onClick={() => onGo(warn ? "verificatie" : "marktplaats")}
                className={`inline-flex items-center gap-1.5 self-center px-3.5 py-2 text-[12.5px] font-bold uppercase tracking-wide transition-transform active:translate-x-[2px] active:translate-y-[2px] ${RING}`}
                style={{
                  background: warn ? C.amberBright : C.ink,
                  color: warn ? C.charcoal : C.amberBright,
                  boxShadow: HARD_SM,
                }}
              >
                {a.cta} <ChevronRight size={14} strokeWidth={2.6} aria-hidden="true" />
              </button>
            </div>
          );
        })}

        <div
          className="flex items-center gap-3 p-4"
          style={{ background: C.paperAlt, border: `1.5px dashed ${C.ink}` }}
        >
          <Sun size={16} strokeWidth={2.4} style={{ color: C.amber }} aria-hidden="true" />
          <p className="text-[12.5px]" style={{ color: C.sub }}>
            Verder is alles helder. Nieuwe acties verschijnen hier zodra er iets vraagt om je
            aandacht.
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
        kicker="Zwart op wit"
        title="Facturen"
        sub="Je omzet in scherp reliëf — wat binnen is en wat nog onderweg is, zonder ruis."
        right={
          <button
            className={`inline-flex items-center gap-2 px-3.5 py-2 text-[12.5px] font-bold uppercase tracking-wide transition-transform active:translate-x-[2px] active:translate-y-[2px] ${RING}`}
            style={{ background: C.ink, color: C.amberBright, boxShadow: HARD_SM }}
          >
            <Plus size={14} strokeWidth={2.6} aria-hidden="true" /> Nieuwe factuur
          </button>
        }
      />
      <div className="space-y-6 px-6 py-6">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div
            className="p-5"
            style={{ background: C.charcoal, border: `2px solid ${C.ink}`, boxShadow: HARD_AMBER }}
          >
            <p
              className="text-[10.5px] font-bold uppercase tracking-[0.12em]"
              style={{ ...head, color: C.amberBright }}
            >
              Ontvangen
            </p>
            <div className="mt-2">
              <ShadowNumber value={`€ ${betaald.toLocaleString("nl-NL")}`} tone="light" />
            </div>
          </div>
          <div
            className="p-5"
            style={{ background: C.paper, border: `1.5px solid ${C.ink}`, boxShadow: HARD_SM }}
          >
            <p
              className="text-[10.5px] font-bold uppercase tracking-[0.12em]"
              style={{ color: C.warn }}
            >
              Openstaand
            </p>
            <div className="mt-2">
              <ShadowNumber value={`€ ${open.toLocaleString("nl-NL")}`} tone="ink" />
            </div>
          </div>
          <div
            className="p-5"
            style={{ background: C.amberSoft, border: `1.5px solid ${C.ink}`, boxShadow: HARD_SM }}
          >
            <p
              className="text-[10.5px] font-bold uppercase tracking-[0.12em]"
              style={{ color: C.amber }}
            >
              Betaald-ratio
            </p>
            <div className="mt-2">
              <ShadowNumber value={`${pct}`} unit="%" tone="amber" />
            </div>
          </div>
        </div>

        <div
          className="overflow-x-auto"
          style={{ border: `1.5px solid ${C.ink}`, boxShadow: HARD_SM, background: C.paper }}
        >
          <table className="w-full text-left">
            <thead>
              <tr
                className="text-[10px] font-bold uppercase tracking-[0.08em]"
                style={{ background: C.ink, color: C.amberBright }}
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
                  <tr key={f.nr} style={{ borderTop: i === 0 ? "none" : `1.5px solid ${C.line}` }}>
                    <td
                      className="px-4 py-3.5 text-[12px] font-bold tabular-nums"
                      style={{ color: C.sub }}
                    >
                      {f.nr}
                    </td>
                    <td className="px-4 py-3.5 text-[13px]" style={{ color: C.ink }}>
                      {f.klant}
                    </td>
                    <td
                      className="hidden px-4 py-3.5 text-[12px] tabular-nums sm:table-cell"
                      style={{ color: C.faint }}
                    >
                      {f.datum}
                    </td>
                    <td
                      className="px-4 py-3.5 text-right text-[13px] font-bold tabular-nums"
                      style={{ ...head, color: C.ink }}
                    >
                      {f.bedrag}
                    </td>
                    <td className="px-4 py-3.5 text-right">
                      <span
                        className="inline-flex items-center gap-1.5 px-2 py-0.5 text-[11px] font-bold uppercase tracking-wide"
                        style={{ color: t.fg, background: t.soft, border: `1px solid ${t.fg}` }}
                      >
                        <span
                          className="h-1.5 w-1.5"
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
