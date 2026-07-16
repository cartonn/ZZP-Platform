"use client";

// Concept 344 — "Passer" · technisch drafting / precisie-instrument op wit.
// Een ontwerptaal geleend van de tekentafel: fijne cyaan-grijze constructielijnen, cirkelbogen
// van een passer, maatvoering met pijltjes en meetwaarden, hoekmarkeringen en een engineering-raster.
// Wit-technisch (geen donkere blauwdruk) — schoon, exact, meetbaar. Matching-scores worden getoond
// als "gemeten toleranties": elke match heeft een nominale waarde en een marge, alsof je hem opmeet.
// Precisie schept vertrouwen: verificatie voelt als een gekalibreerd instrument, niet als een gok.
// Fonts: --font-lab-geist (koppen, strak-technisch) + --font-lab-mono (maten) + --font-lab-plex (tekst).

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
  Ruler,
  Compass,
  Crosshair,
  Gauge,
  Sigma,
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

/* ---------- Palet (wit-technisch, cyaan constructielijnen) ---------- */

const C = {
  canvas: "#f4f6f8",
  paper: "#ffffff",
  paperAlt: "#fafbfc",
  ink: "#0f1720",
  inkSoft: "#33414f",
  sub: "#5b6b78",
  faint: "#93a2ae",
  line: "#dfe6ec",
  lineSoft: "#eef2f5",
  grid: "#e6edf1",
  gridStrong: "#d3dee5",
  cyan: "#0e7490", // cyaan-tekst, WCAG-veilig op wit
  cyanBright: "#06b6d4",
  cyanSoft: "#e0f5fa",
  cyanLine: "#7cd6e6",
  ok: "#0f7a43",
  okSoft: "#e2f4ea",
  warn: "#a65a04",
  warnSoft: "#fbf0df",
  alert: "#c02626",
  alertSoft: "#fbe6e6",
  info: "#1665c8",
  infoSoft: "#e5eefb",
};

const head = { fontFamily: "var(--font-lab-geist), system-ui, sans-serif" };
const body = { fontFamily: "var(--font-lab-plex), system-ui, sans-serif" };
const mono = { fontFamily: "var(--font-lab-mono), ui-monospace, monospace" };

const RING =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0e7490] focus-visible:ring-offset-2 focus-visible:ring-offset-white";

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

// Nominale tolerantie afgeleid van de match — puur presentationeel, deterministisch.
function tolerance(match: number): string {
  const t = (100 - match) / 20 + 0.05;
  return `± ${t.toFixed(2)}`;
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
      className="inline-flex items-center gap-1.5 rounded-[3px] px-2 py-0.5 text-[10.5px] font-semibold uppercase tracking-[0.06em]"
      style={{ ...mono, color: t.fg, background: t.soft, border: `1px solid ${t.fg}22` }}
    >
      <Icon size={11} strokeWidth={2.4} aria-hidden="true" />
      {t.label}
    </span>
  );
}

// Engineering-raster: fijne + sterke lijnen, tekentafel-gevoel.
function BlueprintGrid({
  tint = C.grid,
  strong = C.gridStrong,
}: {
  tint?: string;
  strong?: string;
}) {
  return (
    <svg className="absolute inset-0 h-full w-full" aria-hidden="true">
      <defs>
        <pattern id="pz-fine" width="16" height="16" patternUnits="userSpaceOnUse">
          <path d="M16 0H0V16" fill="none" stroke={tint} strokeWidth="0.6" />
        </pattern>
        <pattern id="pz-coarse" width="80" height="80" patternUnits="userSpaceOnUse">
          <rect width="80" height="80" fill="url(#pz-fine)" />
          <path d="M80 0H0V80" fill="none" stroke={strong} strokeWidth="0.8" />
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill="url(#pz-coarse)" />
    </svg>
  );
}

// Maatlijn met pijltjes en meetwaarde — de kern van de drafting-taal.
function DimensionLine({ label, className = "" }: { label: string; className?: string }) {
  return (
    <div className={`flex items-center gap-2 ${className}`} aria-hidden="true">
      <svg
        width="100%"
        height="14"
        viewBox="0 0 200 14"
        preserveAspectRatio="none"
        className="min-w-0 flex-1"
      >
        <line x1="1" y1="7" x2="199" y2="7" stroke={C.cyanLine} strokeWidth="1" />
        <path d="M1 2 L1 12 M1 7 L8 3.5 M1 7 L8 10.5" stroke={C.cyan} strokeWidth="1" fill="none" />
        <path
          d="M199 2 L199 12 M199 7 L192 3.5 M199 7 L192 10.5"
          stroke={C.cyan}
          strokeWidth="1"
          fill="none"
        />
      </svg>
      <span
        className="shrink-0 rounded-[2px] px-1.5 text-[10px] font-semibold tabular-nums"
        style={{ ...mono, color: C.cyan, background: C.paper, border: `1px solid ${C.cyanLine}` }}
      >
        {label}
      </span>
    </div>
  );
}

// Tolerantie-meter: match als nominale waarde met een gemeten boog en marge.
function ToleranceGauge({ value, size = 116 }: { value: number; size?: number }) {
  const cx = size / 2;
  const cy = size / 2;
  const r = size / 2 - 12;
  // halve-cirkel van 180° tot 360° (bovenboog)
  const startAngle = 180;
  const endAngle = 180 + (value / 100) * 180;
  const rad = (deg: number) => (deg * Math.PI) / 180;
  const x1 = cx + r * Math.cos(rad(startAngle));
  const y1 = cy + r * Math.sin(rad(startAngle));
  const x2 = cx + r * Math.cos(rad(endAngle));
  const y2 = cy + r * Math.sin(rad(endAngle));
  const large = endAngle - startAngle > 180 ? 1 : 0;
  const trackX2 = cx + r * Math.cos(rad(360));
  const trackY2 = cy + r * Math.sin(rad(360));
  return (
    <span
      className="relative flex shrink-0 items-center justify-center"
      style={{ width: size, height: size / 2 + 22 }}
      aria-hidden="true"
    >
      <svg width={size} height={size / 2 + 22} viewBox={`0 0 ${size} ${size / 2 + 22}`}>
        {/* tick-markeringen */}
        {[0, 25, 50, 75, 100].map((tk) => {
          const a = 180 + (tk / 100) * 180;
          const ox = cx + (r + 3) * Math.cos(rad(a));
          const oy = cy + (r + 3) * Math.sin(rad(a));
          const ix = cx + (r - 3) * Math.cos(rad(a));
          const iy = cy + (r - 3) * Math.sin(rad(a));
          return <line key={tk} x1={ix} y1={iy} x2={ox} y2={oy} stroke={C.faint} strokeWidth="1" />;
        })}
        <path
          d={`M ${x1} ${y1} A ${r} ${r} 0 0 1 ${trackX2} ${trackY2}`}
          fill="none"
          stroke={C.line}
          strokeWidth="6"
          strokeLinecap="round"
        />
        <path
          d={`M ${x1} ${y1} A ${r} ${r} 0 ${large} 1 ${x2} ${y2}`}
          fill="none"
          stroke={C.cyanBright}
          strokeWidth="6"
          strokeLinecap="round"
        />
        <circle cx={x2} cy={y2} r="4.5" fill={C.paper} stroke={C.cyan} strokeWidth="1.6" />
      </svg>
      <span className="absolute bottom-0 flex flex-col items-center leading-none">
        <span className="text-[26px] font-semibold tabular-nums" style={{ ...mono, color: C.ink }}>
          {value}
        </span>
        <span
          className="mt-0.5 text-[9px] font-semibold tabular-nums"
          style={{ ...mono, color: C.cyan }}
        >
          {tolerance(value)}
        </span>
      </span>
    </span>
  );
}

// Compact tolerantie-cijfer met boogje voor kaarten.
function ArcBadge({ value, size = 52 }: { value: number; size?: number }) {
  const stroke = 4;
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
          stroke={C.cyanBright}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={circ}
          strokeDashoffset={circ * (1 - value / 100)}
        />
      </svg>
      <span className="text-[13px] font-semibold tabular-nums" style={{ ...mono, color: C.ink }}>
        {value}
      </span>
    </span>
  );
}

// Technische meetgrafiek: lijn met meetpunt-kruisjes.
function PlotChart({
  data,
  color = C.cyan,
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
  const pts = data.map((v, i) => {
    const x = 6 + (i / (data.length - 1)) * (w - 12);
    const y = h - 8 - ((v - min) / span) * (h - 22);
    return [x, y] as const;
  });
  const line = pts
    .map((p, i) => `${i === 0 ? "M" : "L"}${p[0].toFixed(1)} ${p[1].toFixed(1)}`)
    .join(" ");
  return (
    <svg
      viewBox={`0 0 ${w} ${h}`}
      preserveAspectRatio="none"
      className="w-full"
      style={{ height }}
      aria-hidden="true"
    >
      {[0.25, 0.5, 0.75].map((g) => (
        <line
          key={g}
          x1="0"
          x2={w}
          y1={h * g}
          y2={h * g}
          stroke={C.lineSoft}
          strokeWidth="1"
          strokeDasharray="2 4"
        />
      ))}
      <path d={line} fill="none" stroke={color} strokeWidth="1.6" strokeLinejoin="round" />
      {pts.map((p, i) => (
        <g key={i} stroke={color} strokeWidth="1.2">
          <line x1={p[0] - 3} y1={p[1]} x2={p[0] + 3} y2={p[1]} />
          <line x1={p[0]} y1={p[1] - 3} x2={p[0]} y2={p[1] + 3} />
        </g>
      ))}
    </svg>
  );
}

function MiniPlot({ data, color = C.cyan }: { data: number[]; color?: string }) {
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
      <polyline points={pts} fill="none" stroke={color} strokeWidth="1.5" strokeLinejoin="round" />
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
    <div
      className="flex flex-wrap items-end justify-between gap-4 border-b px-6 py-5"
      style={{ borderColor: C.line }}
    >
      <div className="min-w-0">
        <p
          className="flex items-center gap-1.5 text-[10.5px] font-semibold uppercase tracking-[0.24em]"
          style={{ ...mono, color: C.cyan }}
        >
          <Crosshair size={12} aria-hidden="true" /> {kicker}
        </p>
        <h1
          className="mt-1.5 text-[25px] font-semibold leading-none tracking-tight"
          style={{ ...head, color: C.ink }}
        >
          {title}
        </h1>
        {sub && (
          <p className="mt-1.5 text-[12.5px]" style={{ color: C.sub }}>
            {sub}
          </p>
        )}
      </div>
      {right}
    </div>
  );
}

/* ---------- Hoofdcomponent ---------- */

export function Concept344() {
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
      <style>{`@keyframes pz-fade{from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:translateY(0)}}
      @keyframes pz-pulse{0%,100%{opacity:.55}50%{opacity:.9}}
      @keyframes pz-sweep{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}`}</style>

      {/* Titelblok-header (zoals een tekening-hoekstempel) */}
      <header className="border-b" style={{ borderColor: C.line, background: C.paper }}>
        <div className="flex h-14 items-center gap-3 px-5">
          <div
            className="flex h-8 w-8 items-center justify-center rounded-[4px] border text-[13px] font-semibold"
            style={{ ...head, color: C.cyan, borderColor: C.cyanLine, background: C.cyanSoft }}
            aria-hidden="true"
          >
            <Compass size={16} strokeWidth={2} />
          </div>
          <div className="leading-none">
            <span className="text-[14.5px] font-semibold tracking-tight" style={head}>
              Passer
            </span>
            <span
              className="ml-2 text-[10px] font-semibold uppercase tracking-[0.14em]"
              style={{ ...mono, color: C.faint }}
            >
              rev. B
            </span>
          </div>

          <div className="ml-auto flex items-center gap-2">
            <button
              aria-label="Zoeken"
              className={`rounded-[4px] border p-2 transition-colors hover:bg-[#fafbfc] ${RING}`}
              style={{ borderColor: C.line, color: C.sub }}
            >
              <Search size={15} aria-hidden="true" />
            </button>
            <button
              aria-label="Meldingen"
              className={`relative rounded-[4px] border p-2 transition-colors hover:bg-[#fafbfc] ${RING}`}
              style={{ borderColor: C.line, color: C.sub }}
            >
              <Bell size={15} aria-hidden="true" />
              <span
                className="absolute right-1.5 top-1.5 h-1.5 w-1.5 rounded-full"
                style={{ background: C.cyanBright }}
                aria-hidden="true"
              />
            </button>
            <div className="ml-1 flex items-center gap-2.5">
              <div
                className="flex h-8 w-8 items-center justify-center rounded-[4px] border text-[10.5px] font-semibold"
                style={{ ...mono, borderColor: C.line, background: C.paperAlt, color: C.cyan }}
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
                className={`flex shrink-0 items-center gap-2 rounded-[4px] px-3 py-2 text-[12.5px] transition-colors ${RING}`}
                style={{
                  color: on ? C.ink : C.sub,
                  background: on ? C.cyanSoft : "transparent",
                  border: `1px solid ${on ? C.cyanLine : "transparent"}`,
                  fontWeight: on ? 600 : 500,
                }}
              >
                <Icon size={14} aria-hidden="true" style={{ color: on ? C.cyan : C.faint }} />
                {s.label}
              </button>
            );
          })}
        </nav>
      </header>

      <div key={screen} className="mx-auto max-w-6xl" style={{ animation: "pz-fade 0.32s ease" }}>
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
      <span className="sr-only">Tekening wordt geladen…</span>
      <div
        className="h-6 w-52 rounded-[4px]"
        style={{
          background: C.paper,
          border: `1px solid ${C.line}`,
          animation: "pz-pulse 1.3s infinite",
        }}
      />
      <div
        className="mt-6 h-44 rounded-[6px]"
        style={{
          background: C.paper,
          border: `1px solid ${C.line}`,
          animation: "pz-pulse 1.3s infinite",
        }}
      />
      <div className="mt-4 grid grid-cols-2 gap-3 lg:grid-cols-4">
        {[0, 1, 2, 3].map((i) => (
          <div
            key={i}
            className="h-24 rounded-[6px]"
            style={{
              background: C.paper,
              border: `1px solid ${C.line}`,
              animation: "pz-pulse 1.3s infinite",
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
        kicker="Meetstaat"
        title={`Gekalibreerd, ${PROFIEL.naam.split(" ")[0]}`}
        sub="Je praktijk opgemeten — nominale waarden, marges en wat binnen tolerantie ligt."
      />

      <div className="space-y-5 px-6 py-5">
        {/* Meet-hero */}
        <div
          className="relative overflow-hidden rounded-[8px] border"
          style={{ borderColor: C.line, background: C.paper }}
        >
          <BlueprintGrid />
          <div className="relative flex flex-wrap items-center justify-between gap-5 p-6">
            <div className="min-w-0">
              <p
                className="flex items-center gap-1.5 text-[10.5px] font-semibold uppercase tracking-[0.2em]"
                style={{ ...mono, color: C.cyan }}
              >
                <Gauge size={13} aria-hidden="true" /> {hero.label}
              </p>
              <p
                className="mt-2 text-[44px] font-semibold tabular-nums leading-none"
                style={{ ...mono, color: C.ink }}
              >
                {hero.value}
              </p>
              <p className="mt-2 flex items-center gap-2 text-[12px]" style={{ color: C.sub }}>
                <span
                  className="inline-flex items-center gap-1 rounded-[3px] px-1.5 py-0.5 text-[11px] font-semibold tabular-nums"
                  style={{
                    ...mono,
                    background: hero.up ? C.okSoft : C.warnSoft,
                    color: hero.up ? C.ok : C.warn,
                  }}
                >
                  {hero.up ? (
                    <ArrowUpRight size={11} aria-hidden="true" />
                  ) : (
                    <ArrowDownRight size={11} aria-hidden="true" />
                  )}
                  {hero.trend}
                </span>
                afwijking t.o.v. vorige meting — binnen tolerantie
              </p>
            </div>
            <div className="flex flex-col items-center">
              <ToleranceGauge value={matchAvg} />
              <p
                className="mt-1 text-[9.5px] font-semibold uppercase tracking-[0.16em]"
                style={{ ...mono, color: C.faint }}
              >
                gem. match
              </p>
            </div>
          </div>
          <div className="relative border-t px-3 pb-3 pt-2" style={{ borderColor: C.lineSoft }}>
            <PlotChart data={hero.spark} color={C.cyanBright} height={84} />
          </div>
          <div
            className="relative flex gap-1 overflow-x-auto border-t p-2"
            style={{ borderColor: C.lineSoft }}
            role="tablist"
            aria-label="Kies meetwaarde"
          >
            {KPIS.map((k, i) => {
              const on = i === focus;
              return (
                <button
                  key={k.label}
                  role="tab"
                  aria-selected={on}
                  onClick={() => setFocus(i)}
                  className={`flex flex-1 shrink-0 flex-col items-start gap-0.5 rounded-[4px] px-3 py-2 text-left transition-colors ${RING}`}
                  style={{
                    background: on ? C.cyanSoft : "transparent",
                    border: `1px solid ${on ? C.cyanLine : "transparent"}`,
                  }}
                >
                  <span
                    className="text-[10px] font-semibold uppercase tracking-[0.06em]"
                    style={{ color: on ? C.cyan : C.faint }}
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

        {/* Meetwaarden-tegels */}
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          {KPIS.map((k) => (
            <div
              key={k.label}
              className="rounded-[6px] border p-4"
              style={{ background: C.paper, borderColor: C.line }}
            >
              <div className="flex items-center justify-between">
                <p className="text-[10.5px] font-medium" style={{ color: C.sub }}>
                  {k.label}
                </p>
                <span
                  className="inline-flex items-center gap-0.5 text-[10px] font-semibold tabular-nums"
                  style={{ ...mono, color: k.up ? C.ok : C.warn }}
                >
                  {k.up ? (
                    <ArrowUpRight size={10} aria-hidden="true" />
                  ) : (
                    <ArrowDownRight size={10} aria-hidden="true" />
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
                <MiniPlot data={k.spark} color={k.up ? C.cyan : C.warn} />
              </div>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          {/* Volgende meting/actie */}
          {warn && (
            <div
              className="relative overflow-hidden rounded-[6px] border p-5 lg:col-span-2"
              style={{ background: C.paper, borderColor: C.cyanLine }}
              role="alert"
            >
              <div className="absolute right-4 top-4" aria-hidden="true">
                <DimensionLine label={tolerance(matchAvg)} className="w-28" />
              </div>
              <p
                className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.16em]"
                style={{ ...mono, color: C.cyan }}
              >
                <Ruler size={12} aria-hidden="true" /> Volgende meting
              </p>
              <h2
                className="mt-2 max-w-md text-[18px] font-semibold leading-snug"
                style={{ ...head, color: C.ink }}
              >
                {warn.titel}
              </h2>
              <p className="mt-1.5 max-w-md text-[12.5px]" style={{ color: C.sub }}>
                {warn.detail}
              </p>
              <button
                onClick={() => onGo("verificatie")}
                className={`mt-4 inline-flex items-center gap-2 rounded-[4px] px-4 py-2.5 text-[12.5px] font-semibold transition-transform active:scale-[0.98] ${RING}`}
                style={{ background: C.ink, color: C.paper }}
              >
                {warn.cta} <ArrowRight size={14} strokeWidth={2.4} aria-hidden="true" />
              </button>
            </div>
          )}

          {/* Bericht met error→loading→ok */}
          <div
            className="rounded-[6px] border p-5"
            style={{ background: C.paper, borderColor: C.line }}
          >
            <h3
              className="flex items-center gap-1.5 text-[12.5px] font-semibold"
              style={{ ...head, color: C.ink }}
            >
              <Sigma size={14} style={{ color: C.cyan }} aria-hidden="true" /> Laatste registratie
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
                    Meetkanaal niet bereikbaar.
                  </p>
                  <button
                    onClick={retry}
                    className={`mt-2 inline-flex items-center gap-1.5 rounded-[4px] border px-3 py-1.5 text-[12px] font-semibold transition-colors hover:bg-[#fafbfc] ${RING}`}
                    style={{ borderColor: C.line, color: C.ink }}
                  >
                    <RotateCcw size={12} aria-hidden="true" /> Opnieuw meten
                  </button>
                </div>
              )}
              {feed === "loading" && (
                <div className="space-y-2" role="status" aria-live="polite">
                  <span className="sr-only">Laden…</span>
                  <span
                    className="block h-3 rounded-[2px]"
                    style={{
                      background: C.lineSoft,
                      width: "60%",
                      animation: "pz-pulse 1.3s infinite",
                    }}
                  />
                  <span
                    className="block h-3 rounded-[2px]"
                    style={{
                      background: C.lineSoft,
                      width: "85%",
                      animation: "pz-pulse 1.3s infinite",
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
              className="flex items-center gap-2 text-[15px] font-semibold"
              style={{ ...head, color: C.ink }}
            >
              <Compass size={16} style={{ color: C.cyan }} aria-hidden="true" /> Opgemeten matches
            </h2>
            <button
              onClick={() => onGo("marktplaats")}
              className={`inline-flex items-center gap-1 rounded-[4px] px-2 py-1 text-[12px] font-semibold ${RING}`}
              style={{ color: C.cyan }}
            >
              Volledige staat <ChevronRight size={14} aria-hidden="true" />
            </button>
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {OPDRACHTEN.map((o) => (
              <button
                key={o.id}
                onClick={() => onOpen(o.id)}
                className={`rounded-[6px] border p-4 text-left transition-colors hover:border-[#7cd6e6] ${RING}`}
                style={{ background: C.paper, borderColor: C.line }}
              >
                <div className="flex items-start justify-between">
                  <ArcBadge value={o.match} />
                  <span
                    className="text-[10px] font-semibold tabular-nums"
                    style={{ ...mono, color: C.faint }}
                  >
                    {o.id}
                  </span>
                </div>
                <p
                  className="mt-3 text-[14px] font-semibold leading-snug"
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
                <div className="mt-3">
                  <DimensionLine label={tolerance(o.match)} />
                </div>
                <div className="mt-2 flex items-center justify-between">
                  <span
                    className="text-[13px] font-semibold tabular-nums"
                    style={{ ...mono, color: C.cyan }}
                  >
                    {o.tarief}
                  </span>
                  <span className="text-[11px]" style={{ color: C.faint }}>
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
        kicker="Onderdelenlijst"
        title="Marktplaats"
        sub="Opdrachten gerangschikt op gemeten match — de nauwste toleranties bovenaan."
        right={
          <div
            className="inline-flex items-center gap-0.5 rounded-[5px] border p-0.5"
            style={{ background: C.paperAlt, borderColor: C.line }}
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
                  className={`rounded-[4px] px-3 py-1.5 text-[12px] font-semibold transition-colors ${RING}`}
                  style={{
                    background: on ? C.paper : "transparent",
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
          className="mb-4 flex items-center gap-2.5 rounded-[5px] border px-3.5 py-2.5"
          style={{ background: C.paper, borderColor: C.line }}
        >
          <Search size={16} aria-hidden="true" style={{ color: C.faint }} />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Zoek op titel, plaats of opdrachtgever…"
            aria-label="Opdrachten zoeken"
            className="w-full bg-transparent text-[13px] outline-none"
            style={{ color: C.ink }}
          />
        </div>

        {filtered.length === 0 ? (
          <div
            className="flex flex-col items-center justify-center rounded-[6px] px-6 py-16 text-center"
            style={{ border: `1px dashed ${C.line}`, background: C.paperAlt }}
          >
            <span
              className="flex h-12 w-12 items-center justify-center rounded-[6px] border"
              style={{ background: C.paper, borderColor: C.line }}
              aria-hidden="true"
            >
              <Search size={20} style={{ color: C.faint }} />
            </span>
            <p className="mt-4 text-[15px] font-semibold" style={{ ...head, color: C.ink }}>
              Geen onderdelen gevonden
            </p>
            <p className="mt-1 max-w-xs text-[12.5px]" style={{ color: C.sub }}>
              Niets komt overeen met “{q}”. Verruim je zoektolerantie.
            </p>
            <button
              onClick={() => setQ("")}
              className={`mt-4 rounded-[4px] border px-4 py-2 text-[12.5px] font-semibold transition-colors hover:bg-[#fafbfc] ${RING}`}
              style={{ borderColor: C.line, color: C.ink }}
            >
              Zoekopdracht wissen
            </button>
          </div>
        ) : (
          <ul className="space-y-3">
            {filtered.map((o, i) => (
              <li
                key={o.id}
                className="rounded-[6px] border p-4"
                style={{ background: C.paper, borderColor: C.line }}
              >
                <div className="flex flex-wrap items-start gap-4">
                  <div className="flex items-center gap-3">
                    <span
                      className="flex h-7 w-7 items-center justify-center rounded-[4px] border text-[12px] font-semibold tabular-nums"
                      style={{
                        ...mono,
                        background: i === 0 ? C.cyanSoft : C.paperAlt,
                        color: i === 0 ? C.cyan : C.faint,
                        borderColor: i === 0 ? C.cyanLine : C.line,
                      }}
                    >
                      {i + 1}
                    </span>
                    <ArcBadge value={o.match} size={56} />
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
                          className="rounded-[3px] border px-2 py-0.5 text-[10.5px] font-medium"
                          style={{ background: C.paperAlt, color: C.sub, borderColor: C.line }}
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
                        style={{ ...mono, color: C.cyan }}
                      >
                        {o.tarief}
                      </span>
                      <span style={{ color: C.sub }}>{o.uren}</span>
                      <span style={{ color: C.sub }}>{o.start}</span>
                      <span
                        className="inline-flex items-center gap-1 rounded-[3px] px-1.5 text-[11px] font-semibold tabular-nums"
                        style={{ ...mono, background: C.cyanSoft, color: C.cyan }}
                      >
                        {tolerance(o.match)}
                      </span>
                    </div>
                  </div>
                  <button
                    onClick={() => onOpen(o.id)}
                    className={`inline-flex items-center gap-1.5 self-center rounded-[4px] px-3.5 py-2 text-[12.5px] font-semibold transition-transform active:scale-[0.98] ${RING}`}
                    style={{ background: C.ink, color: C.paper }}
                  >
                    Opmeten <ArrowRight size={14} strokeWidth={2.4} aria-hidden="true" />
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
              className={`rounded-[4px] border px-3.5 py-2 text-[12.5px] font-semibold transition-colors hover:bg-[#fafbfc] ${RING}`}
              style={{ borderColor: C.line, color: C.sub }}
            >
              Terug
            </button>
            <button
              onClick={react}
              disabled={state !== "idle"}
              aria-live="polite"
              className={`inline-flex items-center gap-2 rounded-[4px] px-4 py-2 text-[12.5px] font-semibold transition-transform active:scale-[0.98] disabled:opacity-90 ${RING}`}
              style={{ background: state === "sent" ? C.ok : C.ink, color: C.paper }}
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
                className="rounded-[6px] border p-4"
                style={{ background: C.paper, borderColor: C.line }}
              >
                <p
                  className="text-[10px] font-semibold uppercase tracking-[0.1em]"
                  style={{ ...mono, color: C.faint }}
                >
                  {m.l}
                </p>
                <p
                  className="mt-1.5 text-[16px] font-semibold tabular-nums"
                  style={{ ...mono, color: C.ink }}
                >
                  {m.v}
                </p>
              </div>
            ))}
          </div>

          {/* Verklaarbare match als meetrapport */}
          <div
            className="rounded-[6px] border p-5"
            style={{ background: C.paper, borderColor: C.line }}
          >
            <h3 className="text-[15px] font-semibold" style={{ ...head, color: C.ink }}>
              Meetrapport match
            </h3>
            <p className="mt-0.5 text-[12.5px]" style={{ color: C.sub }}>
              Elke bevinding is opgemeten aan je geverifieerde profiel.
            </p>
            <div className="mt-4 grid grid-cols-1 gap-5 sm:grid-cols-2">
              <div>
                <p
                  className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.12em]"
                  style={{ ...mono, color: C.ok }}
                >
                  <Check size={12} strokeWidth={3} aria-hidden="true" /> Binnen tolerantie
                </p>
                <ul className="mt-2.5 space-y-2">
                  {opdracht.redenen.plus.map((r) => (
                    <li
                      key={r}
                      className="flex items-start gap-2 text-[12.5px]"
                      style={{ color: C.ink }}
                    >
                      <span
                        className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-[3px]"
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
                  className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.12em]"
                  style={{ ...mono, color: C.warn }}
                >
                  <AlertTriangle size={12} strokeWidth={2.6} aria-hidden="true" /> Buiten marge
                </p>
                <ul className="mt-2.5 space-y-2">
                  {opdracht.redenen.min.map((r) => (
                    <li
                      key={r}
                      className="flex items-start gap-2 text-[12.5px]"
                      style={{ color: C.sub }}
                    >
                      <span
                        className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-[3px]"
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
            className="relative overflow-hidden rounded-[6px] border p-5"
            style={{ background: C.paper, borderColor: C.cyanLine }}
          >
            <BlueprintGrid tint={C.lineSoft} strong={C.line} />
            <div className="relative flex flex-col items-center">
              <ToleranceGauge value={opdracht.match} size={132} />
              <p
                className="mt-2 text-[10.5px] font-semibold uppercase tracking-[0.16em]"
                style={{ ...mono, color: C.cyan }}
              >
                gemeten match
              </p>
              <p className="mt-1 max-w-[220px] text-center text-[12px]" style={{ color: C.sub }}>
                Nauwe koppeling met je profiel — reageer voor de beste pasvorm.
              </p>
            </div>
          </div>
          <div
            className="rounded-[6px] border p-5"
            style={{ background: C.paper, borderColor: C.line }}
          >
            <p
              className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.14em]"
              style={{ ...mono, color: C.cyan }}
            >
              <ShieldCheck size={12} aria-hidden="true" /> Compliance-eis
            </p>
            <p className="mt-2 text-[12.5px]" style={{ color: C.sub }}>
              Vereiste bewijsstukken. Je voldoet aan de kern-eisen binnen specificatie.
            </p>
            <ul className="mt-3 space-y-2.5">
              {CREDENTIALS.slice(0, 3).map((c) => {
                const t = credTone(c.status);
                const Icon = t.Icon;
                return (
                  <li key={c.naam} className="flex items-center gap-2.5">
                    <span
                      className="flex h-8 w-8 shrink-0 items-center justify-center rounded-[4px]"
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
        kicker="Kalibratie"
        title="Verificatie"
        sub="Je kalibratiestaat — elk geverifieerd bewijsstuk brengt je vertrouwensmeting op nominaal."
      />
      <div className="space-y-5 px-6 py-5">
        <div
          className="relative overflow-hidden rounded-[8px] border"
          style={{ background: C.paper, borderColor: C.line }}
        >
          <BlueprintGrid />
          <div className="relative flex flex-wrap items-center gap-6 p-6">
            <div className="flex flex-col items-center">
              <ToleranceGauge value={pct} size={132} />
              <p
                className="mt-1 text-[9.5px] font-semibold uppercase tracking-[0.16em]"
                style={{ ...mono, color: C.faint }}
              >
                gekalibreerd
              </p>
            </div>
            <div className="min-w-[180px] flex-1">
              <p
                className="flex items-center gap-1.5 text-[10.5px] font-semibold uppercase tracking-[0.16em]"
                style={{ ...mono, color: C.cyan }}
              >
                <ShieldCheck size={13} aria-hidden="true" /> {PROFIEL.trust}
              </p>
              <p
                className="mt-2 text-[22px] font-semibold tabular-nums"
                style={{ ...mono, color: C.ink }}
              >
                {verified}/{total} geverifieerd
              </p>
              <p className="mt-1 max-w-sm text-[12.5px]" style={{ color: C.sub }}>
                Nog {total - verified} bewijsstuk{total - verified === 1 ? "" : "ken"} te kalibreren
                voor een volledige meting.
              </p>
            </div>
          </div>
        </div>

        {expiring && (
          <div
            className="flex flex-wrap items-center gap-4 rounded-[6px] border p-4"
            style={{ background: C.warnSoft, borderColor: `${C.warn}44` }}
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
                {expiring.naam} nadert einde geldigheid
              </p>
              <p className="mt-0.5 text-[12.5px]" style={{ color: C.sub }}>
                {expiring.detail}. Herkalibreer op tijd om binnen tolerantie te blijven.
              </p>
            </div>
            <button
              onClick={() => onGo("acties")}
              className={`inline-flex items-center gap-1.5 rounded-[4px] px-3.5 py-2 text-[12.5px] font-semibold transition-transform active:scale-[0.98] ${RING}`}
              style={{ background: C.warn, color: "#fff" }}
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
                className="flex items-center gap-3.5 rounded-[6px] border p-4"
                style={{ background: C.paper, borderColor: C.line }}
              >
                <span
                  className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[6px]"
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
        kicker="Werkorder"
        title="Volgende acties"
        sub="Je werkorder op volgorde van urgentie — meet af en houd je praktijk binnen specificatie."
      />
      <div className="space-y-3 px-6 py-5">
        {ACTIES.map((a, i) => {
          const warn = a.urgentie === "warning";
          const fg = warn ? C.warn : C.info;
          const soft = warn ? C.warnSoft : C.infoSoft;
          return (
            <div
              key={a.titel}
              className="flex flex-wrap items-start gap-4 rounded-[6px] border p-4"
              style={{ background: C.paper, borderColor: warn ? `${C.warn}44` : C.line }}
            >
              <span
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[5px] text-[14px] font-semibold tabular-nums"
                style={{ ...mono, background: soft, color: fg }}
              >
                {String(i + 1).padStart(2, "0")}
              </span>
              <div className="min-w-[180px] flex-1">
                <p
                  className="text-[9.5px] font-semibold uppercase tracking-[0.14em]"
                  style={{ ...mono, color: fg }}
                >
                  {warn ? "Buiten tolerantie" : "Kans"}
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
                className={`inline-flex items-center gap-1.5 rounded-[4px] px-3.5 py-2 text-[12.5px] font-semibold transition-transform active:scale-[0.98] ${RING}`}
                style={{ background: warn ? C.warn : C.ink, color: "#fff" }}
              >
                {a.cta} <ChevronRight size={14} strokeWidth={2.6} aria-hidden="true" />
              </button>
            </div>
          );
        })}

        <div
          className="flex items-center gap-3 rounded-[6px] border p-4"
          style={{ background: C.cyanSoft, borderColor: C.cyanLine }}
        >
          <Crosshair size={16} strokeWidth={2.4} style={{ color: C.cyan }} aria-hidden="true" />
          <p className="text-[12.5px]" style={{ color: C.sub }}>
            Verder ligt alles binnen tolerantie. Nieuwe werkorders verschijnen hier automatisch.
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
        kicker="Meetstaat omzet"
        title="Facturen"
        sub="Je omzet opgemeten — ontvangen versus openstaand, tot op de euro nauwkeurig."
        right={
          <button
            className={`inline-flex items-center gap-2 rounded-[4px] px-3.5 py-2 text-[12.5px] font-semibold transition-transform active:scale-[0.98] ${RING}`}
            style={{ background: C.ink, color: C.paper }}
          >
            <Plus size={14} strokeWidth={2.6} aria-hidden="true" /> Nieuwe factuur
          </button>
        }
      />
      <div className="space-y-5 px-6 py-5">
        <div
          className="relative overflow-hidden rounded-[8px] border"
          style={{ background: C.paper, borderColor: C.line }}
        >
          <BlueprintGrid />
          <div className="relative flex flex-wrap items-center gap-6 p-6">
            <div className="flex flex-col items-center">
              <ToleranceGauge value={pct} size={116} />
              <p
                className="mt-1 text-[9.5px] font-semibold uppercase tracking-[0.16em]"
                style={{ ...mono, color: C.faint }}
              >
                betaald-ratio
              </p>
            </div>
            <div className="flex flex-1 flex-wrap gap-6">
              <div>
                <p
                  className="text-[10px] font-semibold uppercase tracking-[0.12em]"
                  style={{ ...mono, color: C.ok }}
                >
                  Ontvangen
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
                  className="text-[10px] font-semibold uppercase tracking-[0.12em]"
                  style={{ ...mono, color: C.warn }}
                >
                  Openstaand
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
          className="overflow-x-auto rounded-[6px] border"
          style={{ borderColor: C.line, background: C.paper }}
        >
          <table className="w-full text-left">
            <thead>
              <tr
                className="text-[10px] font-semibold uppercase tracking-[0.08em]"
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
                        className="inline-flex items-center gap-1.5 rounded-[3px] px-2 py-0.5 text-[11px] font-semibold"
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
