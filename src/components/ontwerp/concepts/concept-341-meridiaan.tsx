"use client";

// Concept 341 — "Meridiaan" · nautische zeekaart & wayfinding-navigatie.
// Je zelfstandige praktijk als een reis over open water: de marktplaats is een kaart met
// koersen, matching is een "peiling" (bearing), en next-actions zijn "koers uitzetten".
// Latitude/longitude-hairlinegrid, kompasroos-accenten en koperkleurige koerslijnen op warm
// zeekaart-crème geven rust en richting. Verificatie is je vaarbewijs: heldere statuschips
// (label + icoon) tonen wat betrouwbaar aan boord is. Serif-koppen voor elegantie, mono voor
// coördinaten en cijfers — kalm, precies, premium.
// Fonts: --font-lab-fraunces (koppen) + --font-lab-mono (coördinaten/cijfers) + --font-lab-manrope (tekst).

import { useEffect, useState } from "react";
import {
  Compass,
  Map as MapIcon,
  Anchor,
  ShieldCheck,
  Route,
  Receipt,
  Search,
  Bell,
  ChevronRight,
  ArrowRight,
  Navigation,
  Waves,
  Wind,
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
  LifeBuoy,
  Ship,
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

/* ---------- Palet (warme zeekaart, koper & marine-inkt) ---------- */

const C = {
  canvas: "#efe6d5",
  chart: "#f4ede0", // zeekaart-crème
  surface: "#fbf7ee",
  surfaceAlt: "#f0e7d6",
  ink: "#1a2436", // diep marineblauw-inkt
  inkSoft: "#33405a",
  sub: "#5a6579",
  faint: "#8a8267",
  line: "#d9cdb4",
  lineSoft: "#e6dcc7",
  copper: "#a9682f", // koperkleurige koerslijnen
  copperSoft: "#f0e0cc",
  copperDeep: "#8a5222",
  brass: "#b98a3e",
  sea: "#2a5766", // diep zeegroen-blauw
  seaSoft: "#dbe7e8",
  ok: "#2f6b4f",
  okSoft: "#dcebe0",
  warn: "#9c5a12",
  warnSoft: "#f3e5cf",
  alert: "#9e2b25",
  alertSoft: "#f2ddd8",
  info: "#2a5766",
  infoSoft: "#dbe7e8",
  night: "#141c2b",
};

const head = { fontFamily: "var(--font-lab-fraunces), Georgia, serif" };
const body = { fontFamily: "var(--font-lab-manrope), system-ui, sans-serif" };
const mono = { fontFamily: "var(--font-lab-mono), ui-monospace, monospace" };

const RING =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#a9682f] focus-visible:ring-offset-2 focus-visible:ring-offset-[#f4ede0]";

/* ---------- Status → betekenis ---------- */

type Tone = { label: string; fg: string; soft: string; Icon: LucideIcon };

function credTone(s: CredStatus): Tone {
  switch (s) {
    case "VERIFIED":
      return { label: "Geverifieerd", fg: C.ok, soft: C.okSoft, Icon: BadgeCheck };
    case "SUBMITTED":
      return { label: "In peiling", fg: C.info, soft: C.infoSoft, Icon: Clock };
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

// Deterministische pseudo-coördinaten uit een id — geen random, altijd hetzelfde.
function coords(id: string): string {
  let sum = 0;
  for (let i = 0; i < id.length; i++) sum += id.charCodeAt(i);
  const lat = 51 + (sum % 30) / 10;
  const lon = 4 + ((sum >> 2) % 40) / 10;
  return `${lat.toFixed(1)}°N ${lon.toFixed(1)}°E`;
}

const NAV_ICONS: Record<ScreenKey, LucideIcon> = {
  dashboard: Compass,
  marktplaats: MapIcon,
  opdracht: Anchor,
  verificatie: ShieldCheck,
  acties: Route,
  facturen: Receipt,
  documenten: Receipt,
  berichten: Bell,
};

/* ---------- Decoratieve zeekaart-elementen ---------- */

// Latitude/longitude-hairlinegrid als achtergrond.
function ChartGrid() {
  const cols = [0, 1, 2, 3, 4, 5, 6, 7, 8];
  const rows = [0, 1, 2, 3, 4, 5];
  return (
    <svg
      className="pointer-events-none absolute inset-0 h-full w-full"
      aria-hidden="true"
      preserveAspectRatio="none"
      viewBox="0 0 800 480"
    >
      {cols.map((i) => (
        <line
          key={`v${i}`}
          x1={i * 100}
          y1="0"
          x2={i * 100}
          y2="480"
          stroke={C.copper}
          strokeWidth="0.6"
          strokeOpacity="0.14"
        />
      ))}
      {rows.map((i) => (
        <line
          key={`h${i}`}
          x1="0"
          y1={i * 96}
          x2="800"
          y2={i * 96}
          stroke={C.copper}
          strokeWidth="0.6"
          strokeOpacity="0.14"
        />
      ))}
      {cols.map((i) =>
        rows.map((j) => (
          <path
            key={`t${i}-${j}`}
            d={`M${i * 100 - 4} ${j * 96} h8 M${i * 100} ${j * 96 - 4} v8`}
            stroke={C.copper}
            strokeWidth="0.8"
            strokeOpacity="0.22"
          />
        )),
      )}
    </svg>
  );
}

// Kompasroos — decoratief richtaccent.
function CompassRose({ size = 120, tone = C.copper }: { size?: number; tone?: string }) {
  const c = size / 2;
  const r = c - 6;
  const pts = [0, 45, 90, 135, 180, 225, 270, 315];
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} aria-hidden="true">
      <circle cx={c} cy={c} r={r} fill="none" stroke={tone} strokeWidth="1" strokeOpacity="0.4" />
      <circle
        cx={c}
        cy={c}
        r={r * 0.62}
        fill="none"
        stroke={tone}
        strokeWidth="0.7"
        strokeOpacity="0.3"
      />
      {pts.map((deg) => {
        const rad = ((deg - 90) * Math.PI) / 180;
        const long = deg % 90 === 0;
        const inner = long ? r * 0.15 : r * 0.55;
        return (
          <line
            key={deg}
            x1={c + Math.cos(rad) * inner}
            y1={c + Math.sin(rad) * inner}
            x2={c + Math.cos(rad) * r}
            y2={c + Math.sin(rad) * r}
            stroke={tone}
            strokeWidth={long ? "1.4" : "0.7"}
            strokeOpacity={long ? "0.55" : "0.3"}
          />
        );
      })}
      <path
        d={`M${c} ${c - r * 0.8} L${c + r * 0.14} ${c} L${c} ${c + r * 0.8} L${c - r * 0.14} ${c} Z`}
        fill={tone}
        fillOpacity="0.18"
        stroke={tone}
        strokeWidth="1"
      />
      <circle cx={c} cy={c} r="3" fill={tone} />
    </svg>
  );
}

// Peiling-wijzer (bearing dial) — matching als kompaspeiling.
function BearingDial({
  value,
  size = 80,
  tone = C.copper,
  ring = C.line,
}: {
  value: number;
  size?: number;
  tone?: string;
  ring?: string;
}) {
  const c = size / 2;
  const r = c - 8;
  const deg = (value / 100) * 360;
  const rad = ((deg - 90) * Math.PI) / 180;
  const nx = c + Math.cos(rad) * (r - 4);
  const ny = c + Math.sin(rad) * (r - 4);
  const ticks = [0, 30, 60, 90, 120, 150, 180, 210, 240, 270, 300, 330];
  return (
    <span
      className="relative inline-flex shrink-0 items-center justify-center"
      style={{ width: size, height: size }}
      aria-hidden="true"
    >
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <circle cx={c} cy={c} r={r} fill="none" stroke={ring} strokeWidth="1.4" />
        {ticks.map((t) => {
          const tr = ((t - 90) * Math.PI) / 180;
          const long = t % 90 === 0;
          return (
            <line
              key={t}
              x1={c + Math.cos(tr) * (r - (long ? 7 : 4))}
              y1={c + Math.sin(tr) * (r - (long ? 7 : 4))}
              x2={c + Math.cos(tr) * r}
              y2={c + Math.sin(tr) * r}
              stroke={C.faint}
              strokeWidth={long ? "1.4" : "0.8"}
              strokeOpacity="0.6"
            />
          );
        })}
        <line x1={c} y1={c} x2={nx} y2={ny} stroke={tone} strokeWidth="2.4" strokeLinecap="round" />
        <circle cx={nx} cy={ny} r="3.2" fill={tone} />
        <circle cx={c} cy={c} r="3" fill={C.ink} />
      </svg>
      <span className="absolute flex flex-col items-center leading-none" style={{ top: "58%" }}>
        <span
          className="font-bold tabular-nums"
          style={{ ...mono, color: C.ink, fontSize: size >= 90 ? 15 : 12 }}
        >
          {value}
        </span>
      </span>
    </span>
  );
}

// Dieptelijn (sparkline als sounding-profiel).
function SoundingLine({
  data,
  color,
  height = 34,
  width = 92,
}: {
  data: number[];
  color: string;
  height?: number;
  width?: number;
}) {
  const min = Math.min(...data);
  const max = Math.max(...data);
  const span = max - min || 1;
  const pts = data
    .map((v, i) => {
      const x = (i / (data.length - 1)) * width;
      const y = height - ((v - min) / span) * (height - 6) - 3;
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(" ");
  const last = data.length - 1;
  const lx = width;
  const ly = height - ((data[last]! - min) / span) * (height - 6) - 3;
  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} aria-hidden="true">
      <polyline
        points={pts}
        fill="none"
        stroke={color}
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx={lx} cy={ly} r="2.6" fill={color} />
    </svg>
  );
}

// Grote koerslijn met peil-punten voor de hero.
function CourseChart({ data, color }: { data: number[]; color: string }) {
  const w = 320;
  const h = 92;
  const min = Math.min(...data);
  const max = Math.max(...data);
  const span = max - min || 1;
  const pts = data.map((v, i) => {
    const x = (i / (data.length - 1)) * w;
    const y = h - ((v - min) / span) * (h - 20) - 12;
    return [x, y] as const;
  });
  const line = pts
    .map((p, i) => `${i === 0 ? "M" : "L"}${p[0].toFixed(1)} ${p[1].toFixed(1)}`)
    .join(" ");
  const last = pts[pts.length - 1]!;
  return (
    <svg
      viewBox={`0 0 ${w} ${h}`}
      preserveAspectRatio="none"
      className="w-full"
      style={{ height: h }}
      aria-hidden="true"
    >
      <path
        d={line}
        fill="none"
        stroke={color}
        strokeWidth="2"
        strokeDasharray="1 6"
        strokeLinecap="round"
        strokeOpacity="0.9"
      />
      {pts.map((p, i) => (
        <circle key={i} cx={p[0]} cy={p[1]} r="2" fill={color} fillOpacity="0.55" />
      ))}
      <circle cx={last[0]} cy={last[1]} r="4.5" fill={color} />
      <circle cx={last[0]} cy={last[1]} r="8" fill={color} fillOpacity="0.2" />
    </svg>
  );
}

/* ---------- Bouwstenen ---------- */

function StatusPill({ status }: { status: CredStatus }) {
  const t = credTone(status);
  const Icon = t.Icon;
  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold"
      style={{ ...body, color: t.fg, background: t.soft, border: `1px solid ${t.fg}22` }}
    >
      <Icon size={12} strokeWidth={2.4} aria-hidden="true" />
      {t.label}
    </span>
  );
}

function Coord({ children }: { children: React.ReactNode }) {
  return (
    <span
      className="inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[10.5px] font-semibold tracking-wide"
      style={{ ...mono, color: C.copperDeep, background: C.copperSoft }}
    >
      <Navigation size={10} strokeWidth={2.4} aria-hidden="true" />
      {children}
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
          className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-[0.24em]"
          style={{ ...mono, color: C.copper }}
        >
          <Waves size={13} aria-hidden="true" /> {kicker}
        </p>
        <h1
          className="mt-1.5 text-[28px] font-semibold leading-none tracking-tight"
          style={{ ...head, color: C.ink }}
        >
          {title}
        </h1>
        {sub && (
          <p className="mt-2 max-w-xl text-[13px]" style={{ color: C.sub }}>
            {sub}
          </p>
        )}
      </div>
      {right}
    </div>
  );
}

/* ---------- Hoofdcomponent ---------- */

export function Concept341() {
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
    const t = window.setTimeout(() => setReady(true), 360);
    return () => window.clearTimeout(t);
  }, [screen]);

  return (
    <div
      className="min-h-[680px] w-full antialiased"
      style={{ ...body, background: C.canvas, color: C.ink }}
    >
      <style>{`@keyframes me-fade{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}
      @keyframes me-pulse{0%,100%{opacity:.45}50%{opacity:.8}}
      @keyframes me-drift{0%,100%{transform:translateY(0)}50%{transform:translateY(-3px)}}`}</style>

      {/* Kop-navigatie */}
      <header className="relative border-b" style={{ borderColor: C.line, background: C.surface }}>
        <div className="flex h-14 items-center gap-3 px-5">
          <div
            className="flex h-9 w-9 items-center justify-center rounded-full"
            style={{ background: C.ink }}
            aria-hidden="true"
          >
            <Compass size={18} style={{ color: C.brass }} />
          </div>
          <div className="leading-none">
            <span
              className="text-[16px] font-semibold tracking-tight"
              style={{ ...head, color: C.ink }}
            >
              Meridiaan
            </span>
            <span
              className="ml-2 hidden rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide sm:inline"
              style={{ ...mono, background: C.copperSoft, color: C.copperDeep }}
            >
              Vaarlog
            </span>
          </div>

          <div className="ml-auto flex items-center gap-2">
            <span
              className="hidden items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold md:inline-flex"
              style={{ ...mono, color: C.sea, background: C.seaSoft }}
            >
              <Wind size={12} aria-hidden="true" /> Koers ZW · 6 kn
            </span>
            <button
              aria-label="Zoeken op de kaart"
              className={`rounded-lg p-2 transition-colors hover:bg-[#f0e7d6] ${RING}`}
              style={{ border: `1px solid ${C.line}`, color: C.sub }}
            >
              <Search size={15} aria-hidden="true" />
            </button>
            <button
              aria-label="Scheepsberichten"
              className={`relative rounded-lg p-2 transition-colors hover:bg-[#f0e7d6] ${RING}`}
              style={{ border: `1px solid ${C.line}`, color: C.sub }}
            >
              <Bell size={15} aria-hidden="true" />
              <span
                className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full"
                style={{ background: C.copper }}
                aria-hidden="true"
              />
            </button>
            <div className="ml-1 flex items-center gap-2.5">
              <div
                className="flex h-9 w-9 items-center justify-center rounded-full text-[11px] font-bold"
                style={{ ...mono, background: C.ink, color: C.brass }}
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
                  style={{ color: C.ok }}
                >
                  <ShieldCheck size={11} strokeWidth={2.6} aria-hidden="true" /> {PROFIEL.trust}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Scherm-tabs */}
        <nav className="flex gap-1 overflow-x-auto px-3 pb-2.5" aria-label="Hoofdnavigatie">
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
                  color: on ? C.surface : C.sub,
                  background: on ? C.ink : "transparent",
                  border: `1px solid ${on ? C.ink : "transparent"}`,
                  fontWeight: on ? 600 : 500,
                }}
              >
                <Icon size={15} aria-hidden="true" style={{ color: on ? C.brass : C.faint }} />
                {s.label}
              </button>
            );
          })}
        </nav>
      </header>

      {/* Content */}
      <div key={screen} className="mx-auto max-w-6xl" style={{ animation: "me-fade 0.34s ease" }}>
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
      <span className="sr-only">Kaart wordt geladen…</span>
      <div
        className="h-7 w-56 rounded-lg"
        style={{ background: C.surface, animation: "me-pulse 1.3s infinite" }}
      />
      <div
        className="mt-6 h-44 rounded-2xl"
        style={{
          background: C.surface,
          border: `1px solid ${C.line}`,
          animation: "me-pulse 1.3s infinite",
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
              animation: "me-pulse 1.3s infinite",
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
        kicker="Je vaarlog"
        title={`Vaste koers, ${PROFIEL.naam.split(" ")[0]}`}
        sub="Je positie deze maand — peilingen, koersen en wat er aan de horizon ligt."
      />

      <div className="space-y-5 px-6 py-5">
        {/* Hero — kaart met kompasroos */}
        <div
          className="relative overflow-hidden rounded-2xl"
          style={{ background: C.chart, border: `1px solid ${C.line}` }}
        >
          <ChartGrid />
          <div
            className="pointer-events-none absolute -right-6 -top-6 opacity-70"
            style={{ animation: "me-drift 6s ease-in-out infinite" }}
          >
            <CompassRose size={150} />
          </div>
          <div className="relative flex flex-wrap items-start justify-between gap-4 p-6">
            <div className="min-w-0">
              <p
                className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-[0.18em]"
                style={{ ...mono, color: C.copper }}
              >
                <Navigation size={13} aria-hidden="true" /> {hero.label}
              </p>
              <p
                className="mt-2 text-[46px] font-semibold tabular-nums leading-none"
                style={{ ...mono, color: C.ink }}
              >
                {hero.value}
              </p>
              <p className="mt-2 flex items-center gap-2 text-[12.5px]" style={{ color: C.sub }}>
                <span
                  className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-bold tabular-nums"
                  style={{ background: C.copperSoft, color: C.copperDeep }}
                >
                  {hero.up ? "▲" : "▼"} {hero.trend}
                </span>
                sinds vorige peiling · je ligt op koers
              </p>
            </div>
            <BearingDial value={matchAvg} size={92} />
          </div>
          <div className="relative px-4 pb-2">
            <CourseChart data={hero.spark} color={C.copper} />
          </div>
          {/* KPI-kiezer */}
          <div
            className="relative flex gap-1 overflow-x-auto border-t p-2"
            style={{ borderColor: C.line }}
            role="tablist"
            aria-label="Kies peiling"
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
                  style={{
                    background: on ? C.surface : "transparent",
                    border: `1px solid ${on ? C.line : "transparent"}`,
                  }}
                >
                  <span
                    className="text-[10.5px] font-semibold"
                    style={{ color: on ? C.copperDeep : C.faint }}
                  >
                    {k.label}
                  </span>
                  <span
                    className="text-[15px] font-bold tabular-nums"
                    style={{ ...mono, color: C.ink }}
                  >
                    {k.value}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Peiling-tegels */}
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
                  className="text-[10.5px] font-bold tabular-nums"
                  style={{ ...mono, color: k.up ? C.ok : C.warn }}
                >
                  {k.up ? "▲" : "▼"} {k.trend}
                </span>
              </div>
              <p
                className="mt-1.5 text-[22px] font-semibold tabular-nums leading-none"
                style={{ ...mono, color: C.ink }}
              >
                {k.value}
              </p>
              <div className="mt-2.5">
                <SoundingLine data={k.spark} color={k.up ? C.copper : C.warn} />
              </div>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          {/* Koers uitzetten */}
          {warn && (
            <div
              className="relative overflow-hidden rounded-2xl p-5 lg:col-span-2"
              style={{ background: C.ink, border: `1px solid ${C.night}` }}
              role="alert"
            >
              <div className="pointer-events-none absolute -bottom-8 -right-4 opacity-30">
                <CompassRose size={130} tone={C.brass} />
              </div>
              <p
                className="relative flex items-center gap-1.5 text-[10.5px] font-bold uppercase tracking-[0.16em]"
                style={{ ...mono, color: C.brass }}
              >
                <Route size={13} aria-hidden="true" /> Koers uitzetten
              </p>
              <h2
                className="relative mt-2 text-[20px] font-semibold leading-snug"
                style={{ ...head, color: C.surface }}
              >
                {warn.titel}
              </h2>
              <p className="relative mt-1.5 max-w-md text-[13px]" style={{ color: "#c8cdd6" }}>
                {warn.detail}
              </p>
              <button
                onClick={() => onGo("verificatie")}
                className={`relative mt-4 inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-[13px] font-bold transition-transform active:scale-[0.98] ${RING}`}
                style={{ background: C.brass, color: C.night }}
              >
                {warn.cta} <ArrowRight size={15} strokeWidth={2.6} aria-hidden="true" />
              </button>
            </div>
          )}

          {/* Scheepsbericht met error→loading→ok */}
          <div
            className="rounded-2xl p-5"
            style={{ background: C.surface, border: `1px solid ${C.line}` }}
          >
            <div className="flex items-center justify-between">
              <h3
                className="flex items-center gap-1.5 text-[14px] font-semibold"
                style={{ ...head, color: C.ink }}
              >
                <Anchor size={15} style={{ color: C.copper }} aria-hidden="true" /> Aan wal
              </h3>
              <span
                className="text-[11px] font-bold tabular-nums"
                style={{ ...mono, color: C.copper }}
              >
                Haven
              </span>
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
                    Verbinding met de haven verbroken.
                  </p>
                  <button
                    onClick={retry}
                    className={`mt-2 inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-[12px] font-semibold transition-colors hover:bg-[#f0e7d6] ${RING}`}
                    style={{ border: `1px solid ${C.line}`, color: C.ink }}
                  >
                    <RotateCcw size={12} aria-hidden="true" /> Opnieuw peilen
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
                      animation: "me-pulse 1.3s infinite",
                    }}
                  />
                  <span
                    className="block h-3 rounded-full"
                    style={{
                      background: C.lineSoft,
                      width: "85%",
                      animation: "me-pulse 1.3s infinite",
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

        {/* Beste peilingen */}
        <div>
          <div className="mb-3 flex items-center justify-between">
            <h2
              className="flex items-center gap-2 text-[17px] font-semibold"
              style={{ ...head, color: C.ink }}
            >
              <Compass size={17} style={{ color: C.copper }} aria-hidden="true" /> Sterkste
              peilingen
            </h2>
            <button
              onClick={() => onGo("marktplaats")}
              className={`inline-flex items-center gap-1 rounded-lg px-2 py-1 text-[12.5px] font-bold ${RING}`}
              style={{ color: C.copperDeep }}
            >
              Hele kaart <ChevronRight size={14} aria-hidden="true" />
            </button>
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {OPDRACHTEN.map((o) => (
              <button
                key={o.id}
                onClick={() => onOpen(o.id)}
                className={`rounded-2xl p-4 text-left transition-colors hover:border-[#a9682f66] ${RING}`}
                style={{ background: C.surface, border: `1px solid ${C.line}` }}
              >
                <div className="flex items-start justify-between">
                  <BearingDial value={o.match} size={56} />
                  <Coord>{coords(o.id)}</Coord>
                </div>
                <p
                  className="mt-3 text-[15px] font-semibold leading-snug"
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
                    style={{ ...mono, color: C.copperDeep }}
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
        kicker="De kaart"
        title="Marktplaats"
        sub="Opdrachten uitgezet op de zeekaart — de sterkste peilingen bovenaan."
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
                    background: on ? C.ink : "transparent",
                    color: on ? C.surface : C.sub,
                  }}
                >
                  {s === "match" ? "Peiling" : "Tarief"}
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
            style={{ border: `1px dashed ${C.line}`, background: C.chart }}
          >
            <span
              className="flex h-14 w-14 items-center justify-center rounded-full"
              style={{ background: C.surface, border: `1px solid ${C.line}` }}
              aria-hidden="true"
            >
              <LifeBuoy size={24} style={{ color: C.copper }} />
            </span>
            <p className="mt-4 text-[16px] font-semibold" style={{ ...head, color: C.ink }}>
              Geen bakens gevonden
            </p>
            <p className="mt-1 max-w-xs text-[12.5px]" style={{ color: C.sub }}>
              Niets komt overeen met “{q}”. Verruim je zoekbereik en peil opnieuw.
            </p>
            <button
              onClick={() => setQ("")}
              className={`mt-4 rounded-xl px-4 py-2 text-[12.5px] font-bold transition-colors hover:bg-[#f0e7d6] ${RING}`}
              style={{ border: `1px solid ${C.line}`, color: C.ink }}
            >
              Zoekbereik wissen
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
                        background: i === 0 ? C.copperSoft : C.surfaceAlt,
                        color: i === 0 ? C.copperDeep : C.faint,
                      }}
                    >
                      {i + 1}
                    </span>
                    <BearingDial value={o.match} size={58} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <Coord>{coords(o.id)}</Coord>
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
                        className="font-bold tabular-nums"
                        style={{ ...mono, color: C.copperDeep }}
                      >
                        {o.tarief}
                      </span>
                      <span style={{ color: C.sub }}>{o.uren}</span>
                      <span style={{ color: C.sub }}>{o.start}</span>
                    </div>
                  </div>
                  <button
                    onClick={() => onOpen(o.id)}
                    className={`inline-flex items-center gap-1.5 self-center rounded-xl px-3.5 py-2 text-[12.5px] font-bold transition-transform active:scale-[0.98] ${RING}`}
                    style={{ background: C.ink, color: C.brass }}
                  >
                    Zet koers <ArrowRight size={14} strokeWidth={2.6} aria-hidden="true" />
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
        kicker={coords(opdracht.id)}
        title={opdracht.titel}
        sub={`${opdracht.opdrachtgever} · ${opdracht.plaats}`}
        right={
          <div className="flex items-center gap-2">
            <button
              onClick={onBack}
              className={`rounded-xl px-3.5 py-2 text-[12.5px] font-bold transition-colors hover:bg-[#f0e7d6] ${RING}`}
              style={{ border: `1px solid ${C.line}`, color: C.sub }}
            >
              Terug naar kaart
            </button>
            <button
              onClick={react}
              disabled={state !== "idle"}
              aria-live="polite"
              className={`inline-flex items-center gap-2 rounded-xl px-4 py-2 text-[13px] font-bold transition-transform active:scale-[0.98] disabled:opacity-90 ${RING}`}
              style={{
                background: state === "sent" ? C.ok : C.ink,
                color: state === "sent" ? "#fff" : C.brass,
              }}
            >
              {state === "idle" && (
                <>
                  <Send size={15} strokeWidth={2.4} aria-hidden="true" /> Meld je aan
                </>
              )}
              {state === "sending" && "Versturen…"}
              {state === "sent" && (
                <>
                  <Check size={15} strokeWidth={3} aria-hidden="true" /> Aangemeld
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
              { l: "Vertrek", v: opdracht.start },
              { l: "Peiling", v: `${opdracht.match}%` },
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

          {/* Verklaarbare peiling */}
          <div
            className="rounded-2xl p-5"
            style={{ background: C.surface, border: `1px solid ${C.line}` }}
          >
            <h3 className="text-[17px] font-semibold" style={{ ...head, color: C.ink }}>
              Waarom deze peiling
            </h3>
            <p className="mt-0.5 text-[12.5px]" style={{ color: C.sub }}>
              Transparant onderbouwd op basis van je geverifieerde vaarlog.
            </p>
            <div className="mt-4 grid grid-cols-1 gap-5 sm:grid-cols-2">
              <div>
                <p
                  className="flex items-center gap-1.5 text-[10.5px] font-bold uppercase tracking-[0.12em]"
                  style={{ ...mono, color: C.ok }}
                >
                  <Check size={13} strokeWidth={3} aria-hidden="true" /> Rugwind
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
                  <Wind size={13} strokeWidth={2.6} aria-hidden="true" /> Tegenwind
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
            className="relative overflow-hidden rounded-2xl p-5"
            style={{ background: C.ink, border: `1px solid ${C.night}` }}
          >
            <div className="pointer-events-none absolute -right-6 -top-6 opacity-40">
              <CompassRose size={110} tone={C.brass} />
            </div>
            <div className="relative flex items-center gap-4">
              <BearingDial value={opdracht.match} size={72} tone={C.brass} ring="#3a465e" />
              <div>
                <p
                  className="text-[11px] font-bold uppercase tracking-[0.14em]"
                  style={{ ...mono, color: C.brass }}
                >
                  Peiling-score
                </p>
                <p className="mt-1 text-[13px]" style={{ color: "#c8cdd6" }}>
                  Sterke koppeling met je vaarlog — zet nu koers voor de beste kans.
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
              style={{ ...mono, color: C.copper }}
            >
              <ShieldCheck size={13} aria-hidden="true" /> Vaarbewijs-eis
            </p>
            <p className="mt-2 text-[12.5px]" style={{ color: C.sub }}>
              Vereiste papieren voor deze koers. Je voldoet aan de kern-eisen.
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
        kicker="Vaarbewijs"
        title="Verificatie"
        sub="Je papieren aan boord — elk geverifieerd bewijsstuk maakt je koers betrouwbaarder."
      />
      <div className="space-y-5 px-6 py-5">
        {/* Vertrouwens-meter */}
        <div
          className="relative flex flex-wrap items-center gap-5 overflow-hidden rounded-2xl p-6"
          style={{ background: C.ink, border: `1px solid ${C.night}` }}
        >
          <div className="pointer-events-none absolute -bottom-8 right-8 opacity-30">
            <CompassRose size={150} tone={C.brass} />
          </div>
          <BearingDial value={pct} size={92} tone={C.brass} ring="#3a465e" />
          <div className="relative min-w-[180px] flex-1">
            <p
              className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-[0.16em]"
              style={{ ...mono, color: C.brass }}
            >
              <Ship size={13} aria-hidden="true" /> {PROFIEL.trust}
            </p>
            <p
              className="mt-2 text-[24px] font-semibold tabular-nums"
              style={{ ...mono, color: C.surface }}
            >
              {verified}/{total} geverifieerd
            </p>
            <p className="mt-1 text-[12.5px]" style={{ color: "#c8cdd6" }}>
              Nog {total - verified} bewijsstuk{total - verified === 1 ? "" : "ken"} te gaan voor
              een volledig vaarbewijs.
            </p>
          </div>
        </div>

        {/* Verloop-waarschuwing */}
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
                {expiring.detail}. Vernieuw op tijd om aan boord te blijven.
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
        kicker="Reisplan"
        title="Koers uitzetten"
        sub="Je acties op volgorde van urgentie — zet de volgende koers en houd vaart."
      />
      <div className="space-y-3 px-6 py-5">
        {ACTIES.map((a, i) => {
          const warn = a.urgentie === "warning";
          const fg = warn ? C.copper : C.sea;
          const soft = warn ? C.copperSoft : C.seaSoft;
          return (
            <div
              key={a.titel}
              className="flex flex-wrap items-start gap-4 rounded-2xl p-4"
              style={{
                background: C.surface,
                border: `1px solid ${warn ? `${C.copper}44` : C.line}`,
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
                  {warn ? "Baken" : "Kans"}
                </p>
                <p className="mt-0.5 text-[15px] font-semibold" style={{ ...head, color: C.ink }}>
                  {a.titel}
                </p>
                <p className="mt-0.5 text-[12.5px]" style={{ color: C.sub }}>
                  {a.detail}
                </p>
              </div>
              <button
                onClick={() => onGo(warn ? "verificatie" : "marktplaats")}
                className={`inline-flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-[12.5px] font-bold transition-transform active:scale-[0.98] ${RING}`}
                style={{ background: warn ? C.copper : C.ink, color: warn ? "#fff" : C.brass }}
              >
                {a.cta} <ChevronRight size={14} strokeWidth={2.6} aria-hidden="true" />
              </button>
            </div>
          );
        })}

        <div
          className="flex items-center gap-3 rounded-2xl p-4"
          style={{ background: C.seaSoft, border: `1px solid ${C.sea}33` }}
        >
          <Anchor size={16} strokeWidth={2.4} style={{ color: C.sea }} aria-hidden="true" />
          <p className="text-[12.5px]" style={{ color: C.sub }}>
            Verder ligt alles op koers. Nieuwe bakens verschijnen hier vanzelf aan de horizon.
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
        kicker="Scheepskas"
        title="Facturen"
        sub="Je omzet als lading aan boord — wat binnen is en wat nog onderweg is."
        right={
          <button
            className={`inline-flex items-center gap-2 rounded-xl px-3.5 py-2 text-[12.5px] font-bold transition-transform active:scale-[0.98] ${RING}`}
            style={{ background: C.ink, color: C.brass }}
          >
            <Plus size={14} strokeWidth={2.6} aria-hidden="true" /> Nieuwe factuur
          </button>
        }
      />
      <div className="space-y-5 px-6 py-5">
        <div
          className="relative flex flex-wrap items-center gap-5 overflow-hidden rounded-2xl p-5"
          style={{ background: C.ink, border: `1px solid ${C.night}` }}
        >
          <div className="pointer-events-none absolute -right-4 -top-6 opacity-30">
            <CompassRose size={120} tone={C.brass} />
          </div>
          <BearingDial value={pct} size={80} tone={C.brass} ring="#3a465e" />
          <div className="relative flex flex-1 flex-wrap gap-6">
            <div>
              <p
                className="text-[10.5px] font-bold uppercase tracking-[0.12em]"
                style={{ ...mono, color: C.brass }}
              >
                Aan boord
              </p>
              <p
                className="mt-1 text-[24px] font-semibold tabular-nums"
                style={{ ...mono, color: C.surface }}
              >
                € {betaald.toLocaleString("nl-NL")}
              </p>
            </div>
            <div>
              <p
                className="text-[10.5px] font-bold uppercase tracking-[0.12em]"
                style={{ ...mono, color: "#e6b878" }}
              >
                Onderweg
              </p>
              <p
                className="mt-1 text-[24px] font-semibold tabular-nums"
                style={{ ...mono, color: C.surface }}
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
