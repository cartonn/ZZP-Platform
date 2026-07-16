"use client";

// Concept 346 — "Vlonder" · warm, natuurlijk, geaard. Een steiger/vlonder van planken.
// Horizontale plank-ritmes structureren het scherm: rustige rijen met dunne "nerf"-lijnen, ronde
// zachte hoeken en natuurtinten (warm hout, mosgroen, hemelblauw, zand) geven een buiten-gevoel —
// menselijk en rustgevend, maar strak-modern. Geen skeuomorfe houttextuur-plaatjes; de houtsfeer
// wordt gesuggereerd met kleur en lijn. Verificatie voelt hier geaard en betrouwbaar: wat vaststaat,
// staat als een stevige plank onder je voeten. Ruime, warme typografie.
// Fonts: --font-lab-sora (koppen, warm-geometrisch) + --font-lab-jakarta (tekst) + --font-lab-mono (cijfers).

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
  Leaf,
  Sprout,
  Sun,
  TreePine,
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

/* ---------- Palet (warm hout, mosgroen, hemelblauw, zand) ---------- */

const C = {
  canvas: "#f2ece1",
  paper: "#fbf7ef",
  paperAlt: "#f4eee2",
  ink: "#33291d",
  inkSoft: "#4c3f2e",
  sub: "#6f6150",
  faint: "#a6957e",
  line: "#e3d8c5",
  lineSoft: "#eee6d7",
  grain: "#e8ddc9",
  wood: "#b06a34", // warm hout-accent, WCAG-veilig op crème
  woodBright: "#d98a45",
  woodSoft: "#f6e6d2",
  moss: "#4f6d31", // mosgroen
  mossBright: "#6d9142",
  mossSoft: "#e8f0dc",
  sky: "#2f6d8f", // hemelblauw
  skySoft: "#dcecf3",
  sand: "#c9a75f",
  sandSoft: "#f4ead0",
  ok: "#4f6d31",
  okSoft: "#e8f0dc",
  warn: "#a8620f",
  warnSoft: "#f8e7cf",
  alert: "#b23b2e",
  alertSoft: "#f6ddd6",
  info: "#2f6d8f",
  infoSoft: "#dcecf3",
};

const head = { fontFamily: "var(--font-lab-sora), system-ui, sans-serif" };
const body = { fontFamily: "var(--font-lab-jakarta), system-ui, sans-serif" };
const mono = { fontFamily: "var(--font-lab-mono), ui-monospace, monospace" };

const RING =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4f6d31] focus-visible:ring-offset-2 focus-visible:ring-offset-[#f2ece1]";

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

// Plank-nerf: dunne horizontale lijnen die hout suggereren zonder textuur-plaatje.
function PlankGrain({ tint = C.grain, rows = 3 }: { tint?: string; rows?: number }) {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
      {Array.from({ length: rows }).map((_, i) => (
        <span
          key={i}
          className="absolute left-0 right-0 h-px"
          style={{ top: `${((i + 1) / (rows + 1)) * 100}%`, background: tint }}
        />
      ))}
    </div>
  );
}

// Groei-ring: match als een boom-jaarring / plantje dat opkomt.
function GrowthRing({
  value,
  size = 72,
  color = C.moss,
}: {
  value: number;
  size?: number;
  color?: string;
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
      <span
        className="text-[15px] font-semibold tabular-nums"
        style={{ ...mono, color: C.ink, fontSize: size >= 90 ? 22 : 15 }}
      >
        {value}
      </span>
    </span>
  );
}

// Zachte heuvel-grafiek: natuurlijke golf, geen scherpe pieken.
function HillChart({
  data,
  color = C.moss,
  height = 84,
}: {
  data: number[];
  color?: string;
  height?: number;
}) {
  const w = 320;
  const h = height;
  const min = Math.min(...data);
  const max = Math.max(...data);
  const span = max - min || 1;
  const id = `vl-${color.replace("#", "")}-${height}`;
  const pts = data.map((v, i) => {
    const x = (i / (data.length - 1)) * w;
    const y = h - 6 - ((v - min) / span) * (h - 18);
    return [x, y] as const;
  });
  // vloeiende curve met eenvoudige kwadratische segmenten
  let d = `M${pts[0]?.[0].toFixed(1)} ${pts[0]?.[1].toFixed(1)}`;
  for (let i = 1; i < pts.length; i++) {
    const p = pts[i];
    const prev = pts[i - 1];
    if (!p || !prev) continue;
    const cx = (prev[0] + p[0]) / 2;
    d += ` Q${cx.toFixed(1)} ${prev[1].toFixed(1)} ${cx.toFixed(1)} ${((prev[1] + p[1]) / 2).toFixed(1)} T${p[0].toFixed(1)} ${p[1].toFixed(1)}`;
  }
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
          <stop offset="0%" stopColor={color} stopOpacity="0.24" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={`${d} L${w} ${h} L0 ${h} Z`} fill={`url(#${id})`} />
      <path
        d={d}
        fill="none"
        stroke={color}
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {last && (
        <circle cx={last[0]} cy={last[1]} r="4.5" fill={color} stroke={C.paper} strokeWidth="2" />
      )}
    </svg>
  );
}

function MiniHill({ data, color = C.moss }: { data: number[]; color?: string }) {
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
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
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
    <div className="flex flex-wrap items-end justify-between gap-4 px-6 pb-2 pt-7">
      <div className="min-w-0">
        <p
          className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.18em]"
          style={{ ...head, color: C.moss }}
        >
          <Sprout size={13} aria-hidden="true" /> {kicker}
        </p>
        <h1
          className="mt-2 text-[27px] font-semibold leading-tight tracking-tight"
          style={{ ...head, color: C.ink }}
        >
          {title}
        </h1>
        {sub && (
          <p className="mt-1.5 max-w-lg text-[13px]" style={{ color: C.sub }}>
            {sub}
          </p>
        )}
      </div>
      {right}
    </div>
  );
}

/* ---------- Hoofdcomponent ---------- */

export function Concept346() {
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
      <style>{`@keyframes vl-fade{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}
      @keyframes vl-pulse{0%,100%{opacity:.5}50%{opacity:.85}}`}</style>

      {/* Header — warme houtbalk bovenaan */}
      <header
        className="relative"
        style={{ background: C.paper, borderBottom: `1px solid ${C.line}` }}
      >
        <span
          className="absolute inset-x-0 top-0 h-1"
          style={{
            background: `linear-gradient(90deg, ${C.woodBright}, ${C.sand}, ${C.mossBright})`,
          }}
          aria-hidden="true"
        />
        <div className="h-15 flex items-center gap-3 px-5" style={{ height: 60 }}>
          <div
            className="flex h-9 w-9 items-center justify-center rounded-xl text-[15px] font-semibold"
            style={{ ...head, color: C.paper, background: C.moss }}
            aria-hidden="true"
          >
            <TreePine size={18} strokeWidth={2} />
          </div>
          <span
            className="text-[16px] font-semibold tracking-tight"
            style={{ ...head, color: C.ink }}
          >
            Vlonder
          </span>
          <span
            className="ml-1 hidden rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide sm:inline"
            style={{ ...head, background: C.mossSoft, color: C.moss }}
          >
            ZZP
          </span>

          <div className="ml-auto flex items-center gap-2">
            <button
              aria-label="Zoeken"
              className={`rounded-xl border p-2 transition-colors hover:bg-[#f4eee2] ${RING}`}
              style={{ borderColor: C.line, color: C.sub }}
            >
              <Search size={15} aria-hidden="true" />
            </button>
            <button
              aria-label="Meldingen"
              className={`relative rounded-xl border p-2 transition-colors hover:bg-[#f4eee2] ${RING}`}
              style={{ borderColor: C.line, color: C.sub }}
            >
              <Bell size={15} aria-hidden="true" />
              <span
                className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full"
                style={{ background: C.wood }}
                aria-hidden="true"
              />
            </button>
            <div className="ml-1 flex items-center gap-2.5">
              <div
                className="flex h-9 w-9 items-center justify-center rounded-full text-[11px] font-semibold"
                style={{ ...head, background: C.woodSoft, color: C.wood }}
                aria-hidden="true"
              >
                {PROFIEL.initialen}
              </div>
              <div className="hidden leading-tight sm:block">
                <p className="text-[12.5px] font-semibold" style={{ color: C.ink }}>
                  {PROFIEL.naam}
                </p>
                <p
                  className="flex items-center gap-1 text-[10.5px] font-semibold"
                  style={{ color: C.moss }}
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
                className={`flex shrink-0 items-center gap-2 rounded-full px-3.5 py-2 text-[12.5px] transition-colors ${RING}`}
                style={{
                  color: on ? C.paper : C.sub,
                  background: on ? C.moss : C.paperAlt,
                  fontWeight: on ? 600 : 500,
                }}
              >
                <Icon size={14} aria-hidden="true" style={{ color: on ? C.mossSoft : C.faint }} />
                {s.label}
              </button>
            );
          })}
        </nav>
      </header>

      <div key={screen} className="mx-auto max-w-6xl" style={{ animation: "vl-fade 0.32s ease" }}>
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
        className="h-7 w-52 rounded-xl"
        style={{ background: C.paper, animation: "vl-pulse 1.3s infinite" }}
      />
      <div
        className="mt-6 h-44 rounded-3xl"
        style={{
          background: C.paper,
          border: `1px solid ${C.line}`,
          animation: "vl-pulse 1.3s infinite",
        }}
      />
      <div className="mt-4 grid grid-cols-2 gap-3 lg:grid-cols-4">
        {[0, 1, 2, 3].map((i) => (
          <div
            key={i}
            className="h-24 rounded-2xl"
            style={{
              background: C.paper,
              border: `1px solid ${C.line}`,
              animation: "vl-pulse 1.3s infinite",
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
  const matchAvg = Math.round(OPDRACHTEN.reduce((s, o) => s + o.match, 0) / OPDRACHTEN.length);

  const retry = () => {
    setFeed("loading");
    window.setTimeout(() => setFeed("ok"), 700);
  };

  return (
    <div>
      <PageHead
        kicker="Goedemorgen"
        title={`Stevig geworteld, ${PROFIEL.naam.split(" ")[0]}`}
        sub="Je praktijk op vaste grond — hoe alles groeit en wat vandaag om aandacht vraagt."
      />

      <div className="space-y-5 px-6 py-5">
        {/* Hero — warme houtplank met heuvel-grafiek */}
        <div
          className="relative overflow-hidden rounded-3xl"
          style={{ background: C.paper, border: `1px solid ${C.line}` }}
        >
          <span
            className="absolute inset-x-0 top-0 h-1.5"
            style={{ background: `linear-gradient(90deg, ${C.woodBright}, ${C.sand})` }}
            aria-hidden="true"
          />
          <PlankGrain rows={4} />
          <div className="relative flex flex-wrap items-center justify-between gap-5 p-6">
            <div className="min-w-0">
              <p
                className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.16em]"
                style={{ ...head, color: C.wood }}
              >
                <Sun size={13} aria-hidden="true" /> {hero.label}
              </p>
              <p
                className="mt-2 text-[42px] font-semibold tabular-nums leading-none"
                style={{ ...mono, color: C.ink }}
              >
                {hero.value}
              </p>
              <p className="mt-2 flex items-center gap-2 text-[12.5px]" style={{ color: C.sub }}>
                <span
                  className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold tabular-nums"
                  style={{
                    background: hero.up ? C.mossSoft : C.warnSoft,
                    color: hero.up ? C.moss : C.warn,
                  }}
                >
                  {hero.up ? (
                    <ArrowUpRight size={11} aria-hidden="true" />
                  ) : (
                    <ArrowDownRight size={11} aria-hidden="true" />
                  )}
                  {hero.trend}
                </span>
                sinds vorige periode · gestaag gegroeid
              </p>
            </div>
            <div className="flex flex-col items-center">
              <GrowthRing value={matchAvg} size={92} color={C.mossBright} />
              <p
                className="mt-1.5 text-[10px] font-semibold uppercase tracking-[0.14em]"
                style={{ color: C.faint }}
              >
                gem. match
              </p>
            </div>
          </div>
          <div className="relative px-3 pb-3">
            <HillChart data={hero.spark} color={C.mossBright} height={84} />
          </div>
          {/* KPI-kiezer */}
          <div
            className="relative flex gap-1.5 overflow-x-auto border-t p-2.5"
            style={{ borderColor: C.lineSoft }}
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
                  className={`flex flex-1 shrink-0 flex-col items-start gap-0.5 rounded-2xl px-3 py-2 text-left transition-colors ${RING}`}
                  style={{ background: on ? C.mossSoft : "transparent" }}
                >
                  <span
                    className="text-[10px] font-semibold uppercase tracking-wide"
                    style={{ color: on ? C.moss : C.faint }}
                  >
                    {k.label}
                  </span>
                  <span
                    className="text-[15px] font-semibold tabular-nums"
                    style={{ ...mono, color: C.ink }}
                  >
                    {k.value}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* KPI-tegels als planken */}
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          {KPIS.map((k) => (
            <div
              key={k.label}
              className="relative overflow-hidden rounded-2xl p-4"
              style={{ background: C.paper, border: `1px solid ${C.line}` }}
            >
              <PlankGrain rows={2} />
              <div className="relative">
                <div className="flex items-center justify-between">
                  <p className="text-[10.5px] font-medium" style={{ color: C.sub }}>
                    {k.label}
                  </p>
                  <span
                    className="inline-flex items-center gap-0.5 text-[10.5px] font-semibold tabular-nums"
                    style={{ color: k.up ? C.moss : C.warn }}
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
                  className="mt-1.5 text-[22px] font-semibold tabular-nums leading-none"
                  style={{ ...mono, color: C.ink }}
                >
                  {k.value}
                </p>
                <div className="mt-2.5">
                  <MiniHill data={k.spark} color={k.up ? C.moss : C.wood} />
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          {/* Volgende actie */}
          {warn && (
            <div
              className="rounded-3xl p-5 lg:col-span-2"
              style={{
                background: `linear-gradient(120deg, ${C.woodSoft}, ${C.paper})`,
                border: `1px solid ${C.woodSoft}`,
              }}
              role="alert"
            >
              <p
                className="flex items-center gap-1.5 text-[10.5px] font-semibold uppercase tracking-[0.14em]"
                style={{ ...head, color: C.wood }}
              >
                <Leaf size={13} aria-hidden="true" /> Onderhoud
              </p>
              <h2
                className="mt-2 max-w-md text-[19px] font-semibold leading-snug"
                style={{ ...head, color: C.ink }}
              >
                {warn.titel}
              </h2>
              <p className="mt-1.5 max-w-md text-[13px]" style={{ color: C.sub }}>
                {warn.detail}
              </p>
              <button
                onClick={() => onGo("verificatie")}
                className={`mt-4 inline-flex items-center gap-2 rounded-full px-4 py-2.5 text-[13px] font-semibold transition-transform active:scale-[0.98] ${RING}`}
                style={{ background: C.wood, color: C.paper }}
              >
                {warn.cta} <ArrowRight size={15} strokeWidth={2.4} aria-hidden="true" />
              </button>
            </div>
          )}

          {/* Bericht met error→loading→ok */}
          <div
            className="rounded-3xl p-5"
            style={{ background: C.paper, border: `1px solid ${C.line}` }}
          >
            <h3
              className="flex items-center gap-1.5 text-[13px] font-semibold"
              style={{ ...head, color: C.ink }}
            >
              <Sprout size={14} style={{ color: C.moss }} aria-hidden="true" /> Nieuwste bericht
            </h3>
            <div className="mt-4 border-t pt-3" style={{ borderColor: C.lineSoft }}>
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
                    className={`mt-2 inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-[12px] font-semibold transition-colors hover:bg-[#f4eee2] ${RING}`}
                    style={{ borderColor: C.line, color: C.ink }}
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
                      animation: "vl-pulse 1.3s infinite",
                    }}
                  />
                  <span
                    className="block h-3 rounded-full"
                    style={{
                      background: C.lineSoft,
                      width: "85%",
                      animation: "vl-pulse 1.3s infinite",
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
              className="flex items-center gap-2 text-[16px] font-semibold"
              style={{ ...head, color: C.ink }}
            >
              <Leaf size={16} style={{ color: C.moss }} aria-hidden="true" /> Passende opdrachten
            </h2>
            <button
              onClick={() => onGo("marktplaats")}
              className={`inline-flex items-center gap-1 rounded-full px-2 py-1 text-[12.5px] font-semibold ${RING}`}
              style={{ color: C.moss }}
            >
              Alles <ChevronRight size={14} aria-hidden="true" />
            </button>
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {OPDRACHTEN.map((o) => (
              <button
                key={o.id}
                onClick={() => onOpen(o.id)}
                className={`relative overflow-hidden rounded-3xl p-4 text-left transition-colors hover:border-[#6d9142] ${RING}`}
                style={{ background: C.paper, border: `1px solid ${C.line}` }}
              >
                <PlankGrain rows={3} />
                <div className="relative">
                  <div className="flex items-start justify-between">
                    <GrowthRing value={o.match} size={56} color={C.mossBright} />
                    <span
                      className="text-[10px] font-semibold tabular-nums"
                      style={{ ...mono, color: C.faint }}
                    >
                      {o.id}
                    </span>
                  </div>
                  <p
                    className="mt-3 text-[14.5px] font-semibold leading-snug"
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
                      className="text-[13px] font-semibold tabular-nums"
                      style={{ ...mono, color: C.wood }}
                    >
                      {o.tarief}
                    </span>
                    <span className="text-[11.5px]" style={{ color: C.faint }}>
                      {o.uren}
                    </span>
                  </div>
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
        kicker="Buiten kijken"
        title="Marktplaats"
        sub="Opdrachten die bij je passen — de best gewortelde matches bovenaan."
        right={
          <div
            className="inline-flex items-center gap-0.5 rounded-full p-0.5"
            style={{ background: C.paperAlt, border: `1px solid ${C.line}` }}
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
                  className={`rounded-full px-3 py-1.5 text-[12px] font-semibold transition-colors ${RING}`}
                  style={{ background: on ? C.moss : "transparent", color: on ? C.paper : C.sub }}
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
          className="mb-4 flex items-center gap-2.5 rounded-full px-4 py-2.5"
          style={{ background: C.paper, border: `1px solid ${C.line}` }}
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
            className="flex flex-col items-center justify-center rounded-3xl px-6 py-16 text-center"
            style={{ border: `1px dashed ${C.line}`, background: C.paperAlt }}
          >
            <span
              className="flex h-12 w-12 items-center justify-center rounded-2xl"
              style={{ background: C.paper, border: `1px solid ${C.line}` }}
              aria-hidden="true"
            >
              <Search size={20} style={{ color: C.faint }} />
            </span>
            <p className="mt-4 text-[15px] font-semibold" style={{ ...head, color: C.ink }}>
              Geen opdrachten gevonden
            </p>
            <p className="mt-1 max-w-xs text-[12.5px]" style={{ color: C.sub }}>
              Niets komt overeen met “{q}”. Verbreed je zoekopdracht.
            </p>
            <button
              onClick={() => setQ("")}
              className={`mt-4 rounded-full px-4 py-2 text-[12.5px] font-semibold transition-colors hover:bg-[#f4eee2] ${RING}`}
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
                className="relative overflow-hidden rounded-3xl p-4"
                style={{ background: C.paper, border: `1px solid ${C.line}` }}
              >
                <PlankGrain rows={3} />
                <div className="relative flex flex-wrap items-start gap-4">
                  <div className="flex items-center gap-3">
                    <span
                      className="flex h-7 w-7 items-center justify-center rounded-full text-[12px] font-semibold tabular-nums"
                      style={{
                        ...mono,
                        background: i === 0 ? C.mossSoft : C.paperAlt,
                        color: i === 0 ? C.moss : C.faint,
                      }}
                    >
                      {i + 1}
                    </span>
                    <GrowthRing value={o.match} size={58} color={C.mossBright} />
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
                          className="rounded-full px-2 py-0.5 text-[10.5px] font-medium"
                          style={{ background: C.paperAlt, color: C.sub }}
                        >
                          {t}
                        </span>
                      ))}
                    </div>
                    <p className="mt-1 text-[15px] font-semibold" style={{ ...head, color: C.ink }}>
                      {o.titel}
                    </p>
                    <p
                      className="mt-0.5 flex items-center gap-1 text-[12.5px]"
                      style={{ color: C.sub }}
                    >
                      <MapPin size={12} aria-hidden="true" /> {o.opdrachtgever} · {o.plaats}
                    </p>
                    <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-[12.5px]">
                      <span
                        className="font-semibold tabular-nums"
                        style={{ ...mono, color: C.wood }}
                      >
                        {o.tarief}
                      </span>
                      <span style={{ color: C.sub }}>{o.uren}</span>
                      <span style={{ color: C.sub }}>{o.start}</span>
                    </div>
                  </div>
                  <button
                    onClick={() => onOpen(o.id)}
                    className={`inline-flex items-center gap-1.5 self-center rounded-full px-3.5 py-2 text-[12.5px] font-semibold transition-transform active:scale-[0.98] ${RING}`}
                    style={{ background: C.moss, color: C.paper }}
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
              className={`rounded-full border px-3.5 py-2 text-[12.5px] font-semibold transition-colors hover:bg-[#f4eee2] ${RING}`}
              style={{ borderColor: C.line, color: C.sub }}
            >
              Terug
            </button>
            <button
              onClick={react}
              disabled={state !== "idle"}
              aria-live="polite"
              className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-[13px] font-semibold transition-transform active:scale-[0.98] disabled:opacity-90 ${RING}`}
              style={{ background: state === "sent" ? C.moss : C.wood, color: C.paper }}
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
                style={{ background: C.paper, border: `1px solid ${C.line}` }}
              >
                <p
                  className="text-[10px] font-semibold uppercase tracking-[0.1em]"
                  style={{ color: C.faint }}
                >
                  {m.l}
                </p>
                <p
                  className="mt-1.5 text-[17px] font-semibold tabular-nums"
                  style={{ ...mono, color: C.ink }}
                >
                  {m.v}
                </p>
              </div>
            ))}
          </div>

          {/* Verklaarbare match */}
          <div
            className="rounded-3xl p-5"
            style={{ background: C.paper, border: `1px solid ${C.line}` }}
          >
            <h3 className="text-[16px] font-semibold" style={{ ...head, color: C.ink }}>
              Waarom deze match
            </h3>
            <p className="mt-0.5 text-[12.5px]" style={{ color: C.sub }}>
              Transparant onderbouwd op basis van je geverifieerde profiel.
            </p>
            <div className="mt-4 grid grid-cols-1 gap-5 sm:grid-cols-2">
              <div>
                <p
                  className="flex items-center gap-1.5 text-[10.5px] font-semibold uppercase tracking-[0.12em]"
                  style={{ ...head, color: C.moss }}
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
                        style={{ background: C.mossSoft }}
                      >
                        <Check
                          size={11}
                          strokeWidth={3}
                          style={{ color: C.moss }}
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
                  className="flex items-center gap-1.5 text-[10.5px] font-semibold uppercase tracking-[0.12em]"
                  style={{ ...head, color: C.warn }}
                >
                  <AlertTriangle size={13} strokeWidth={2.6} aria-hidden="true" /> Aandacht
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
            className="relative overflow-hidden rounded-3xl p-5"
            style={{
              background: `linear-gradient(150deg, ${C.mossSoft}, ${C.paper})`,
              border: `1px solid ${C.mossSoft}`,
            }}
          >
            <div className="flex items-center gap-4">
              <GrowthRing value={opdracht.match} size={72} color={C.mossBright} />
              <div>
                <p
                  className="text-[11px] font-semibold uppercase tracking-[0.14em]"
                  style={{ ...head, color: C.moss }}
                >
                  Match-score
                </p>
                <p className="mt-1 text-[13px]" style={{ color: C.sub }}>
                  Sterke, geaarde koppeling met je profiel — reageer op je gemak.
                </p>
              </div>
            </div>
          </div>
          <div
            className="rounded-3xl p-5"
            style={{ background: C.paper, border: `1px solid ${C.line}` }}
          >
            <p
              className="flex items-center gap-1.5 text-[10.5px] font-semibold uppercase tracking-[0.14em]"
              style={{ ...head, color: C.sky }}
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
                      className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl"
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
        kicker="Vaste grond"
        title="Verificatie"
        sub="Je vertrouwen groeit met elk geverifieerd bewijsstuk — geaard, betrouwbaar, stevig."
      />
      <div className="space-y-5 px-6 py-5">
        {/* Vertrouwens-plank */}
        <div
          className="relative overflow-hidden rounded-3xl p-6"
          style={{ background: C.paper, border: `1px solid ${C.line}` }}
        >
          <span
            className="absolute inset-x-0 top-0 h-1.5"
            style={{ background: `linear-gradient(90deg, ${C.mossBright}, ${C.sand})` }}
            aria-hidden="true"
          />
          <PlankGrain rows={4} />
          <div className="relative flex flex-wrap items-center gap-6">
            <GrowthRing value={pct} size={92} color={C.mossBright} />
            <div className="min-w-[180px] flex-1">
              <p
                className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.16em]"
                style={{ ...head, color: C.moss }}
              >
                <ShieldCheck size={13} aria-hidden="true" /> {PROFIEL.trust}
              </p>
              <p
                className="mt-2 text-[24px] font-semibold tabular-nums"
                style={{ ...mono, color: C.ink }}
              >
                {verified}/{total} geverifieerd
              </p>
              <p className="mt-1 max-w-sm text-[12.5px]" style={{ color: C.sub }}>
                Nog {total - verified} bewijsstuk{total - verified === 1 ? "" : "ken"} te gaan voor
                een volledig geworteld profiel.
              </p>
            </div>
          </div>
        </div>

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
              <p className="text-[13.5px] font-semibold" style={{ color: C.ink }}>
                {expiring.naam} verloopt binnenkort
              </p>
              <p className="mt-0.5 text-[12.5px]" style={{ color: C.sub }}>
                {expiring.detail}. Vernieuw op tijd zodat je zichtbaar en betrouwbaar blijft.
              </p>
            </div>
            <button
              onClick={() => onGo("acties")}
              className={`inline-flex items-center gap-1.5 rounded-full px-3.5 py-2 text-[12.5px] font-semibold transition-transform active:scale-[0.98] ${RING}`}
              style={{ background: C.warn, color: C.paper }}
            >
              Vernieuwen <ArrowRight size={13} strokeWidth={2.6} aria-hidden="true" />
            </button>
          </div>
        )}

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {CREDENTIALS.map((c) => {
            const t = credTone(c.status);
            const Icon = t.Icon;
            return (
              <div
                key={c.naam}
                className="flex items-center gap-3.5 rounded-2xl p-4"
                style={{ background: C.paper, border: `1px solid ${C.line}` }}
              >
                <span
                  className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl"
                  style={{ background: t.soft }}
                >
                  <Icon size={20} style={{ color: t.fg }} aria-hidden="true" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-[13.5px] font-semibold" style={{ color: C.ink }}>
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
        kicker="Klusjes"
        title="Volgende acties"
        sub="Je onderhoudslijst op volgorde van urgentie — pak ze aan en houd alles gezond."
      />
      <div className="space-y-3 px-6 py-5">
        {ACTIES.map((a, i) => {
          const warn = a.urgentie === "warning";
          const fg = warn ? C.wood : C.sky;
          const soft = warn ? C.woodSoft : C.skySoft;
          return (
            <div
              key={a.titel}
              className="relative overflow-hidden rounded-3xl p-4"
              style={{ background: C.paper, border: `1px solid ${warn ? `${C.wood}33` : C.line}` }}
            >
              <PlankGrain rows={2} />
              <div className="relative flex flex-wrap items-start gap-4">
                <span
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl text-[15px] font-semibold tabular-nums"
                  style={{ ...mono, background: soft, color: fg }}
                >
                  {i + 1}
                </span>
                <div className="min-w-[180px] flex-1">
                  <p
                    className="text-[9.5px] font-semibold uppercase tracking-[0.14em]"
                    style={{ ...head, color: fg }}
                  >
                    {warn ? "Onderhoud" : "Kans"}
                  </p>
                  <p className="mt-0.5 text-[14px] font-semibold" style={{ ...head, color: C.ink }}>
                    {a.titel}
                  </p>
                  <p className="mt-0.5 text-[12.5px]" style={{ color: C.sub }}>
                    {a.detail}
                  </p>
                </div>
                <button
                  onClick={() => onGo(warn ? "verificatie" : "marktplaats")}
                  className={`inline-flex items-center gap-1.5 self-center rounded-full px-3.5 py-2 text-[12.5px] font-semibold transition-transform active:scale-[0.98] ${RING}`}
                  style={{ background: warn ? C.wood : C.moss, color: C.paper }}
                >
                  {a.cta} <ChevronRight size={14} strokeWidth={2.6} aria-hidden="true" />
                </button>
              </div>
            </div>
          );
        })}

        <div
          className="flex items-center gap-3 rounded-3xl p-4"
          style={{ background: C.mossSoft, border: `1px solid ${C.moss}22` }}
        >
          <Leaf size={16} strokeWidth={2.4} style={{ color: C.moss }} aria-hidden="true" />
          <p className="text-[12.5px]" style={{ color: C.sub }}>
            Verder staat alles gezond en stevig. Nieuwe klusjes verschijnen hier vanzelf.
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
        kicker="Oogst"
        title="Facturen"
        sub="Je omzet als oogst — wat binnen is en wat nog rijpt aan de tak."
        right={
          <button
            className={`inline-flex items-center gap-2 rounded-full px-3.5 py-2 text-[12.5px] font-semibold transition-transform active:scale-[0.98] ${RING}`}
            style={{ background: C.wood, color: C.paper }}
          >
            <Plus size={14} strokeWidth={2.6} aria-hidden="true" /> Nieuwe factuur
          </button>
        }
      />
      <div className="space-y-5 px-6 py-5">
        <div
          className="relative overflow-hidden rounded-3xl p-6"
          style={{ background: C.paper, border: `1px solid ${C.line}` }}
        >
          <span
            className="absolute inset-x-0 top-0 h-1.5"
            style={{ background: `linear-gradient(90deg, ${C.woodBright}, ${C.sand})` }}
            aria-hidden="true"
          />
          <PlankGrain rows={3} />
          <div className="relative flex flex-wrap items-center gap-6">
            <GrowthRing value={pct} size={80} color={C.mossBright} />
            <div className="flex flex-1 flex-wrap gap-6">
              <div>
                <p
                  className="text-[10.5px] font-semibold uppercase tracking-[0.12em]"
                  style={{ color: C.moss }}
                >
                  Geoogst
                </p>
                <p
                  className="mt-1 text-[24px] font-semibold tabular-nums"
                  style={{ ...mono, color: C.ink }}
                >
                  € {betaald.toLocaleString("nl-NL")}
                </p>
              </div>
              <div>
                <p
                  className="text-[10.5px] font-semibold uppercase tracking-[0.12em]"
                  style={{ color: C.wood }}
                >
                  Nog te rijpen
                </p>
                <p
                  className="mt-1 text-[24px] font-semibold tabular-nums"
                  style={{ ...mono, color: C.ink }}
                >
                  € {open.toLocaleString("nl-NL")}
                </p>
              </div>
            </div>
          </div>
        </div>

        <div
          className="overflow-x-auto rounded-3xl"
          style={{ border: `1px solid ${C.line}`, background: C.paper }}
        >
          <table className="w-full text-left">
            <thead>
              <tr
                className="text-[10.5px] font-semibold uppercase tracking-[0.08em]"
                style={{ background: C.paperAlt, color: C.faint }}
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
                      className="px-4 py-3.5 text-right text-[13px] font-semibold tabular-nums"
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
