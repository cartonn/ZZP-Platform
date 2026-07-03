"use client";

// Concept 40 — "Kwadrant" · Beslismatrix — analytisch coördinatenveld (LICHT, koel).
// De marktplaats wordt een scatter: elke opdracht is een punt, geplot op twee assen
// (verwantschap × tarief, of nabijheid × urgentie). Rasterlijnen, ticks, kruisdraden en
// kwadrant-tinten maken matching zichtbaar als positie; hover/focus licht een punt uit met
// een coördinaat-tooltip. Strak analytisch, tabulaire cijfers, monospace assen.
// Onderscheidend van Beurs (dichte terminal/sparklines) en Atlas (geografische kaart):
// hier een abstract coördinatenveld/beslismatrix, geen geografie en geen dienstregeling.
// Palet: bg #f7f8fa, fg #101318, accent blauw #2563eb, groen #059669 + rood #dc2626.
// Fonts: --font-lab-geist (display) + --font-lab-geist-mono (cijfers/assen).

import { useMemo, useState } from "react";
import {
  Search,
  Bell,
  ChevronRight,
  ArrowUpRight,
  ArrowDownRight,
  Check,
  Clock,
  AlertTriangle,
  Minus,
  MapPin,
  Plus,
  Crosshair,
  Grid2x2,
  FileText,
  Send,
  Target,
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
  NAV,
  DOCUMENTEN,
  type ScreenKey,
  type CredStatus,
  type Opdracht,
} from "./mock";

const C = {
  bg: "#f7f8fa",
  panel: "#ffffff",
  panelAlt: "#f1f3f7",
  ink: "#101318",
  inkSoft: "#3b4250",
  muted: "#6b7280",
  faint: "#9aa2b1",
  grid: "#e6e9ef",
  gridStrong: "#d3d8e1",
  blue: "#2563eb",
  blueSoft: "rgba(37,99,235,0.10)",
  blueLine: "rgba(37,99,235,0.28)",
  green: "#059669",
  greenSoft: "rgba(5,150,105,0.10)",
  greenLine: "rgba(5,150,105,0.28)",
  red: "#dc2626",
  redSoft: "rgba(220,38,38,0.09)",
  redLine: "rgba(220,38,38,0.26)",
  amber: "#d97706",
  amberSoft: "rgba(217,119,6,0.12)",
  amberLine: "rgba(217,119,6,0.3)",
};

const display = { fontFamily: "var(--font-lab-geist)" };
const mono = { fontFamily: "var(--font-lab-geist-mono)" };

const AXIS_LABEL: Record<ScreenKey, string> = {
  dashboard: "x/y · overzicht",
  marktplaats: "x/y · marktveld",
  opdracht: "x/y · positie",
  verificatie: "x/y · gereedheid",
  acties: "x/y · prioriteit",
  facturen: "x/y · kasstroom",
  documenten: "x/y · archief",
  berichten: "x/y · contact",
};

function tariefNum(o: Opdracht): number {
  const m = o.tarief.match(/\d+/);
  return m ? parseInt(m[0], 10) : 0;
}

// Deterministisch afgeleide, presentatieve dimensies (geen backend) voor het tweede assenpaar.
const REIS: Record<string, number> = { "OPD-2041": 12, "OPD-2038": 38, "OPD-2035": 15 };
const URGENTIE: Record<string, number> = { "OPD-2041": 84, "OPD-2038": 62, "OPD-2035": 38 };

type Pt = {
  o: Opdracht;
  x: number;
  y: number;
};

type Quad = { key: string; label: string; sub: string; color: string; tint: string };

type AxisView = {
  key: "waarde" | "bereik";
  label: string;
  xLabel: string;
  yLabel: string;
  xDomain: [number, number];
  yDomain: [number, number];
  xFmt: (n: number) => string;
  yFmt: (n: number) => string;
  point: (o: Opdracht) => { x: number; y: number };
  // Kwadranten met de klok mee vanaf rechtsboven (vaste tuple van 4).
  quads: [Quad, Quad, Quad, Quad];
};

const VIEWS: Record<AxisView["key"], AxisView> = {
  waarde: {
    key: "waarde",
    label: "Verwantschap × Tarief",
    xLabel: "Tarief (€/u)",
    yLabel: "Verwantschap (%)",
    xDomain: [44, 66],
    yDomain: [76, 96],
    xFmt: (n) => `€${Math.round(n)}`,
    yFmt: (n) => `${Math.round(n)}%`,
    point: (o) => ({ x: tariefNum(o), y: o.match }),
    quads: [
      {
        key: "tr",
        label: "Prioriteit",
        sub: "hoog tarief · sterke match",
        color: C.green,
        tint: C.greenSoft,
      },
      {
        key: "tl",
        label: "Sterke match",
        sub: "scherp tarief · sterke match",
        color: C.blue,
        tint: C.blueSoft,
      },
      {
        key: "bl",
        label: "Verkennen",
        sub: "scherp tarief · lagere match",
        color: C.muted,
        tint: "rgba(107,114,128,0.06)",
      },
      {
        key: "br",
        label: "Onderhandelen",
        sub: "hoog tarief · lagere match",
        color: C.amber,
        tint: C.amberSoft,
      },
    ],
  },
  bereik: {
    key: "bereik",
    label: "Nabijheid × Urgentie",
    xLabel: "Nabijheid (← ver · dichtbij →)",
    yLabel: "Urgentie (index)",
    xDomain: [0, 50],
    yDomain: [30, 92],
    xFmt: (n) => `${Math.round(50 - n)}m`,
    yFmt: (n) => `${Math.round(n)}`,
    // Nabijheid = 50 − reistijd, zodat dichterbij naar rechts loopt.
    point: (o) => ({ x: 50 - (REIS[o.id] ?? 25), y: URGENTIE[o.id] ?? 50 }),
    quads: [
      { key: "tr", label: "Nu reageren", sub: "dichtbij · urgent", color: C.red, tint: C.redSoft },
      {
        key: "tl",
        label: "Plan in",
        sub: "verder weg · urgent",
        color: C.amber,
        tint: C.amberSoft,
      },
      {
        key: "bl",
        label: "Later",
        sub: "verder weg · rustig",
        color: C.muted,
        tint: "rgba(107,114,128,0.06)",
      },
      { key: "br", label: "Comfort", sub: "dichtbij · rustig", color: C.green, tint: C.greenSoft },
    ],
  },
};

function statusStyle(s: CredStatus): {
  label: string;
  fg: string;
  bg: string;
  line: string;
  Icon: LucideIcon;
} {
  switch (s) {
    case "VERIFIED":
      return {
        label: "Geverifieerd",
        fg: C.green,
        bg: C.greenSoft,
        line: C.greenLine,
        Icon: Check,
      };
    case "SUBMITTED":
      return { label: "In beoordeling", fg: C.blue, bg: C.blueSoft, line: C.blueLine, Icon: Clock };
    case "EXPIRING":
      return {
        label: "Verloopt bijna",
        fg: C.amber,
        bg: C.amberSoft,
        line: C.amberLine,
        Icon: AlertTriangle,
      };
    case "REJECTED":
      return { label: "Afgewezen", fg: C.red, bg: C.redSoft, line: C.redLine, Icon: AlertTriangle };
  }
}

/* ---------- Herbruikbare bouwstenen ---------- */

function Panel({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <div
      className={`rounded-lg ${className}`}
      style={{ background: C.panel, border: `1px solid ${C.grid}` }}
    >
      {children}
    </div>
  );
}

function SectionHead({ tag, title, note }: { tag: string; title: string; note?: string }) {
  return (
    <div>
      <div className="flex items-center gap-2">
        <Grid2x2 size={13} aria-hidden="true" style={{ color: C.blue }} />
        <p className="text-[11px] uppercase tracking-[0.2em]" style={{ color: C.blue, ...mono }}>
          {tag}
        </p>
      </div>
      <h1
        className="mt-2.5 text-[32px] font-semibold leading-[1.05] tracking-[-0.02em]"
        style={{ ...display, color: C.ink }}
      >
        {title}
      </h1>
      {note && (
        <p className="mt-2 max-w-xl text-[14px] leading-relaxed" style={{ color: C.muted }}>
          {note}
        </p>
      )}
    </div>
  );
}

function StatusChip({ status }: { status: CredStatus }) {
  const st = statusStyle(status);
  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-md px-2.5 py-1 text-[10.5px] font-medium"
      style={{ color: st.fg, background: st.bg, border: `1px solid ${st.line}` }}
    >
      <st.Icon size={11} aria-hidden="true" />
      {st.label}
    </span>
  );
}

function Sparkline({ data, color }: { data: number[]; color: string }) {
  const max = Math.max(...data);
  const min = Math.min(...data);
  const span = max - min || 1;
  const w = 84;
  const h = 26;
  const pts = data.map((d, i) => {
    const x = (i / (data.length - 1)) * w;
    const y = h - ((d - min) / span) * (h - 4) - 2;
    return [x, y] as const;
  });
  const line = pts.map((p) => `${p[0].toFixed(1)},${p[1].toFixed(1)}`).join(" ");
  const last = pts[pts.length - 1];
  return (
    <svg
      width={w}
      height={h}
      viewBox={`0 0 ${w} ${h}`}
      aria-hidden="true"
      className="overflow-visible"
    >
      <polyline
        points={line}
        fill="none"
        stroke={color}
        strokeWidth={1.4}
        strokeLinejoin="round"
        strokeLinecap="round"
      />
      {last && <circle cx={last[0]} cy={last[1]} r={2} fill={color} />}
    </svg>
  );
}

/* ---------- Kern: interactief coördinatenveld ---------- */

function ScatterField({
  view,
  active,
  onHover,
  onSelect,
  compact = false,
}: {
  view: AxisView;
  active: number | null;
  onHover: (i: number | null) => void;
  onSelect?: (o: Opdracht) => void;
  compact?: boolean;
}) {
  // viewBox-geometrie
  const W = 720;
  const H = compact ? 360 : 460;
  const m = { l: 58, r: 22, t: 26, b: compact ? 40 : 48 };
  const pw = W - m.l - m.r;
  const ph = H - m.t - m.b;

  const [xd0, xd1] = view.xDomain;
  const [yd0, yd1] = view.yDomain;

  const sx = (v: number) => m.l + ((v - xd0) / (xd1 - xd0)) * pw;
  const sy = (v: number) => m.t + (1 - (v - yd0) / (yd1 - yd0)) * ph;

  const xMid = (xd0 + xd1) / 2;
  const yMid = (yd0 + yd1) / 2;
  const cx = sx(xMid);
  const cy = sy(yMid);

  const pts: Pt[] = useMemo(() => OPDRACHTEN.map((o) => ({ o, ...view.point(o) })), [view]);

  const xTicks = 5;
  const yTicks = 5;

  const hovered = active != null ? pts[active] : null;
  const hx = hovered ? sx(hovered.x) : 0;
  const hy = hovered ? sy(hovered.y) : 0;

  return (
    <div className="relative w-full select-none">
      <svg
        viewBox={`0 0 ${W} ${H}`}
        className="block w-full"
        role="img"
        aria-label={`Coördinatenveld ${view.label}: opdrachten geplot op ${view.xLabel} en ${view.yLabel}`}
      >
        {/* Kwadrant-tinten */}
        <rect x={cx} y={m.t} width={m.l + pw - cx} height={cy - m.t} fill={view.quads[0].tint} />
        <rect x={m.l} y={m.t} width={cx - m.l} height={cy - m.t} fill={view.quads[1].tint} />
        <rect x={m.l} y={cy} width={cx - m.l} height={m.t + ph - cy} fill={view.quads[2].tint} />
        <rect
          x={cx}
          y={cy}
          width={m.l + pw - cx}
          height={m.t + ph - cy}
          fill={view.quads[3].tint}
        />

        {/* Rasterlijnen + ticks */}
        {Array.from({ length: xTicks + 1 }).map((_, i) => {
          const v = xd0 + ((xd1 - xd0) * i) / xTicks;
          const x = sx(v);
          return (
            <g key={`x${i}`}>
              <line x1={x} y1={m.t} x2={x} y2={m.t + ph} stroke={C.grid} strokeWidth={1} />
              <text
                x={x}
                y={m.t + ph + 18}
                textAnchor="middle"
                fontSize={11}
                fill={C.faint}
                style={mono}
              >
                {view.xFmt(v)}
              </text>
            </g>
          );
        })}
        {Array.from({ length: yTicks + 1 }).map((_, i) => {
          const v = yd0 + ((yd1 - yd0) * i) / yTicks;
          const y = sy(v);
          return (
            <g key={`y${i}`}>
              <line x1={m.l} y1={y} x2={m.l + pw} y2={y} stroke={C.grid} strokeWidth={1} />
              <text
                x={m.l - 10}
                y={y + 4}
                textAnchor="end"
                fontSize={11}
                fill={C.faint}
                style={mono}
              >
                {view.yFmt(v)}
              </text>
            </g>
          );
        })}

        {/* Kruisdraden (mediaan-assen) */}
        <line
          x1={cx}
          y1={m.t}
          x2={cx}
          y2={m.t + ph}
          stroke={C.gridStrong}
          strokeWidth={1.4}
          strokeDasharray="4 4"
        />
        <line
          x1={m.l}
          y1={cy}
          x2={m.l + pw}
          y2={cy}
          stroke={C.gridStrong}
          strokeWidth={1.4}
          strokeDasharray="4 4"
        />

        {/* Kader */}
        <rect
          x={m.l}
          y={m.t}
          width={pw}
          height={ph}
          fill="none"
          stroke={C.gridStrong}
          strokeWidth={1.2}
        />

        {/* Kwadrant-labels */}
        {!compact && (
          <>
            <text
              x={m.l + pw - 10}
              y={m.t + 18}
              textAnchor="end"
              fontSize={11.5}
              fontWeight={600}
              fill={view.quads[0].color}
              style={display}
            >
              {view.quads[0].label}
            </text>
            <text
              x={m.l + 10}
              y={m.t + 18}
              textAnchor="start"
              fontSize={11.5}
              fontWeight={600}
              fill={view.quads[1].color}
              style={display}
            >
              {view.quads[1].label}
            </text>
            <text
              x={m.l + 10}
              y={m.t + ph - 10}
              textAnchor="start"
              fontSize={11.5}
              fontWeight={600}
              fill={view.quads[2].color}
              style={display}
            >
              {view.quads[2].label}
            </text>
            <text
              x={m.l + pw - 10}
              y={m.t + ph - 10}
              textAnchor="end"
              fontSize={11.5}
              fontWeight={600}
              fill={view.quads[3].color}
              style={display}
            >
              {view.quads[3].label}
            </text>
          </>
        )}

        {/* Actieve kruisdraad die het punt volgt */}
        {hovered && (
          <g>
            <line
              x1={hx}
              y1={m.t}
              x2={hx}
              y2={m.t + ph}
              stroke={C.blue}
              strokeWidth={1}
              strokeOpacity={0.5}
            />
            <line
              x1={m.l}
              y1={hy}
              x2={m.l + pw}
              y2={hy}
              stroke={C.blue}
              strokeWidth={1}
              strokeOpacity={0.5}
            />
          </g>
        )}

        {/* Punten */}
        {pts.map((p, i) => {
          const px = sx(p.x);
          const py = sy(p.y);
          const on = active === i;
          return (
            <g
              key={p.o.id}
              tabIndex={0}
              role="button"
              aria-label={`${p.o.titel}. ${view.xLabel} ${view.xFmt(p.x)}, ${view.yLabel} ${view.yFmt(p.y)}. Kies om te openen.`}
              className="cursor-pointer outline-none [&:focus-visible>circle:last-child]:stroke-[#2563eb]"
              onMouseEnter={() => onHover(i)}
              onMouseLeave={() => onHover(null)}
              onFocus={() => onHover(i)}
              onBlur={() => onHover(null)}
              onClick={() => onSelect?.(p.o)}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  onSelect?.(p.o);
                }
              }}
            >
              {on && <circle cx={px} cy={py} r={16} fill={C.blue} fillOpacity={0.12} />}
              <circle
                cx={px}
                cy={py}
                r={on ? 8 : 6}
                fill={on ? C.blue : C.panel}
                stroke={C.blue}
                strokeWidth={2}
              />
              <circle cx={px} cy={py} r={on ? 3 : 2.4} fill={on ? C.panel : C.blue} />
              {/* Onzichtbaar groter treffervlak + focus-ring-doel */}
              <circle
                cx={px}
                cy={py}
                r={18}
                fill="transparent"
                stroke="transparent"
                strokeWidth={2}
              />
            </g>
          );
        })}
      </svg>

      {/* Tooltip (HTML overlay op genormaliseerde coördinaten) */}
      {hovered && (
        <div
          className="pointer-events-none absolute z-10 w-max max-w-[220px] -translate-x-1/2 rounded-md px-3 py-2 text-left shadow-lg"
          style={{
            left: `${(hx / W) * 100}%`,
            top: `${(hy / H) * 100}%`,
            transform: `translate(-50%, calc(-100% - 14px))`,
            background: C.ink,
            border: `1px solid rgba(255,255,255,0.12)`,
          }}
          role="status"
        >
          <p
            className="text-[12px] font-semibold leading-tight"
            style={{ color: "#fff", ...display }}
          >
            {hovered.o.titel}
          </p>
          <p className="mt-0.5 text-[11px]" style={{ color: "rgba(255,255,255,0.6)" }}>
            {hovered.o.opdrachtgever}
          </p>
          <div
            className="mt-1.5 flex items-center gap-3 text-[11px] tabular-nums"
            style={{ ...mono, color: "rgba(255,255,255,0.85)" }}
          >
            <span>
              <span style={{ color: C.faint }}>x </span>
              {view.xFmt(hovered.x)}
            </span>
            <span>
              <span style={{ color: C.faint }}>y </span>
              {view.yFmt(hovered.y)}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}

// Losse legenda naast het veld (kwadrant-uitleg).
function QuadLegend({ view }: { view: AxisView }) {
  return (
    <div className="grid grid-cols-2 gap-2">
      {view.quads.map((q) => (
        <div
          key={q.key}
          className="rounded-md px-3 py-2.5"
          style={{ background: q.tint, border: `1px solid ${C.grid}` }}
        >
          <div className="flex items-center gap-1.5">
            <span
              className="h-2 w-2 rounded-full"
              style={{ background: q.color }}
              aria-hidden="true"
            />
            <p className="text-[12px] font-semibold" style={{ color: C.ink, ...display }}>
              {q.label}
            </p>
          </div>
          <p className="mt-0.5 text-[11px] leading-snug" style={{ color: C.muted }}>
            {q.sub}
          </p>
        </div>
      ))}
    </div>
  );
}

/* ---------- Hoofd-component ---------- */

export function Concept40() {
  const [screen, setScreen] = useState<ScreenKey>("dashboard");
  const active = OPDRACHTEN[0] as Opdracht;

  return (
    <div
      className="min-h-[680px] w-full antialiased"
      style={{ ...display, color: C.ink, background: C.bg }}
    >
      <div className="p-3 sm:p-5 lg:p-7">
        <div
          className="min-h-[640px] rounded-xl"
          style={{ background: C.bg, border: `1px solid ${C.grid}` }}
        >
          {/* Kop */}
          <header
            className="flex flex-col gap-4 px-6 pb-5 pt-6 sm:flex-row sm:items-center lg:px-10"
            style={{ borderBottom: `1px solid ${C.grid}` }}
          >
            <div className="flex items-center gap-3.5">
              <div
                className="flex h-11 w-11 items-center justify-center rounded-lg"
                style={{ background: C.blueSoft, border: `1px solid ${C.blueLine}` }}
              >
                <Grid2x2 size={20} aria-hidden="true" style={{ color: C.blue }} />
              </div>
              <div>
                <div
                  className="text-[17px] font-semibold leading-tight tracking-[-0.01em]"
                  style={display}
                >
                  ZZP · Kwadrant
                </div>
                <div
                  className="text-[10.5px] uppercase tracking-[0.18em]"
                  style={{ color: C.muted, ...mono }}
                >
                  {AXIS_LABEL[screen]}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2.5 sm:ml-auto">
              <button
                className="flex items-center gap-2.5 rounded-lg px-4 py-2 text-[12.5px] transition-colors hover:bg-[#f1f3f7] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2563eb]"
                style={{ color: C.muted, border: `1px solid ${C.grid}` }}
                aria-label="Zoeken"
              >
                <Search size={14} aria-hidden="true" />
                <span className="hidden sm:inline">Zoek in veld</span>
              </button>
              <button
                className="relative rounded-lg p-2.5 transition-colors hover:bg-[#f1f3f7] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2563eb]"
                style={{ color: C.muted, border: `1px solid ${C.grid}` }}
                aria-label="Meldingen"
              >
                <Bell size={15} aria-hidden="true" />
                <span
                  className="absolute right-2.5 top-2.5 h-1.5 w-1.5 rounded-full"
                  style={{ background: C.blue }}
                  aria-hidden="true"
                />
              </button>
              <div
                className="hidden items-center gap-2.5 rounded-lg py-1 pl-1 pr-3.5 sm:flex"
                style={{ border: `1px solid ${C.grid}` }}
              >
                <div
                  className="flex h-8 w-8 items-center justify-center rounded-md text-[11px] font-semibold text-white"
                  style={{ background: C.blue }}
                >
                  {PROFIEL.initialen}
                </div>
                <div className="leading-tight">
                  <div className="text-[11.5px] font-semibold" style={{ color: C.ink }}>
                    {PROFIEL.naam}
                  </div>
                  <div
                    className="text-[9.5px] uppercase tracking-[0.1em]"
                    style={{ color: C.green }}
                  >
                    {PROFIEL.trust}
                  </div>
                </div>
              </div>
            </div>
          </header>

          {/* Navigatie */}
          <nav
            className="flex gap-1 overflow-x-auto px-4 py-3 lg:px-8"
            style={{ borderBottom: `1px solid ${C.grid}` }}
            aria-label="Schermen"
          >
            {SCREENS.map((s, i) => {
              const on = s.key === screen;
              return (
                <button
                  key={s.key}
                  onClick={() => setScreen(s.key)}
                  aria-current={on ? "page" : undefined}
                  className="flex shrink-0 items-center gap-2 rounded-lg px-3.5 py-2 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2563eb]"
                  style={{ background: on ? C.ink : "transparent", color: on ? "#fff" : C.muted }}
                >
                  <span
                    className="text-[10px] tabular-nums"
                    style={{ ...mono, color: on ? C.faint : C.faint }}
                  >
                    {String(i).padStart(2, "0")}
                  </span>
                  <span className="text-[12.5px] font-medium">{s.label}</span>
                </button>
              );
            })}
          </nav>

          <div className="px-6 py-9 lg:px-12 lg:py-11">
            {screen === "dashboard" && (
              <Dashboard
                onOpen={() => setScreen("opdracht")}
                onScatter={() => setScreen("marktplaats")}
              />
            )}
            {screen === "marktplaats" && <Marktplaats onOpen={() => setScreen("opdracht")} />}
            {screen === "opdracht" && <OpdrachtDetail opdracht={active} />}
            {screen === "verificatie" && <Verificatie />}
            {screen === "acties" && <Acties />}
            {screen === "facturen" && <Facturen />}
          </div>

          <footer
            className="flex flex-wrap items-center gap-x-3 gap-y-1 px-6 py-4 text-[10px] uppercase tracking-[0.16em] lg:px-10"
            style={{ borderTop: `1px solid ${C.grid}`, color: C.faint, ...mono }}
          >
            <span>{AXIS_LABEL[screen]}</span>
            <span aria-hidden="true">·</span>
            {NAV.slice(2).map((n) => (
              <span key={n}>{n}</span>
            ))}
          </footer>
        </div>
      </div>
    </div>
  );
}

/* ---------- Dashboard ---------- */

function Dashboard({ onOpen, onScatter }: { onOpen: () => void; onScatter: () => void }) {
  const [hover, setHover] = useState<number | null>(0);
  const view = VIEWS.waarde;
  const primair = ACTIES[0] as (typeof ACTIES)[number];

  return (
    <div className="mx-auto max-w-5xl space-y-10">
      <SectionHead
        tag={AXIS_LABEL.dashboard}
        title={`Goedemorgen, ${PROFIEL.naam.split(" ")[0]}.`}
        note="Je positie in het marktveld in één oogopslag: drie opdrachten geplot, één bewijsstuk vraagt aandacht."
      />

      {/* KPI's */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {KPIS.map((k) => (
          <Panel key={k.label} className="px-4 py-4">
            <p className="text-[12px]" style={{ color: C.muted }}>
              {k.label}
            </p>
            <p
              className="mt-2 text-[28px] font-semibold tabular-nums leading-none tracking-[-0.02em]"
              style={{ ...display, color: C.ink }}
            >
              {k.value}
            </p>
            <div className="mt-3.5 flex items-center justify-between">
              <span
                className="inline-flex items-center gap-0.5 text-[11px] font-medium tabular-nums"
                style={{ color: k.up ? C.green : C.red }}
              >
                {k.up ? (
                  <ArrowUpRight size={12} aria-hidden="true" />
                ) : (
                  <ArrowDownRight size={12} aria-hidden="true" />
                )}
                {k.trend}
              </span>
              <Sparkline data={k.spark} color={k.up ? C.green : C.blue} />
            </div>
          </Panel>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Coördinatenveld */}
        <Panel className="overflow-hidden lg:col-span-2">
          <div className="flex items-center justify-between px-5 pb-1 pt-4">
            <div className="flex items-center gap-2">
              <Crosshair size={14} aria-hidden="true" style={{ color: C.blue }} />
              <h2 className="text-[13px] font-semibold" style={{ ...display, color: C.ink }}>
                Marktveld · {view.label}
              </h2>
            </div>
            <button
              onClick={onScatter}
              className="inline-flex items-center gap-1 rounded-md px-2.5 py-1 text-[11.5px] font-medium transition-colors hover:bg-[#f1f3f7] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2563eb]"
              style={{ color: C.blue }}
            >
              Volledig veld <ChevronRight size={13} aria-hidden="true" />
            </button>
          </div>
          <div className="px-3 pb-3">
            <ScatterField view={view} active={hover} onHover={setHover} onSelect={onOpen} compact />
          </div>
        </Panel>

        {/* Certificaten */}
        <div className="space-y-6">
          <Panel className="px-4 py-4">
            <h2 className="text-[13px] font-semibold" style={{ ...display, color: C.ink }}>
              Bewijsstukken
            </h2>
            <div className="mt-3.5 space-y-3.5">
              {CREDENTIALS.map((c) => {
                const st = statusStyle(c.status);
                return (
                  <div key={c.naam} className="flex items-start gap-3">
                    <span
                      className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-md"
                      style={{ background: st.bg, border: `1px solid ${st.line}` }}
                      aria-hidden="true"
                    >
                      <st.Icon size={13} style={{ color: st.fg }} />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[12.5px] font-medium">{c.naam}</p>
                      <p className="truncate text-[11.5px]" style={{ color: C.muted }}>
                        {c.detail}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </Panel>

          {/* Volgende stap */}
          <div className="rounded-lg px-5 py-5" style={{ background: C.ink }}>
            <p
              className="text-[10.5px] uppercase tracking-[0.18em]"
              style={{ color: C.faint, ...mono }}
            >
              Volgende beste stap
            </p>
            <p
              className="mt-2 text-[19px] font-semibold leading-tight tracking-[-0.01em]"
              style={{ ...display, color: "#fff" }}
            >
              {primair.titel}
            </p>
            <p
              className="mt-2 text-[12.5px] leading-relaxed"
              style={{ color: "rgba(255,255,255,0.66)" }}
            >
              {primair.detail}
            </p>
            <button
              className="mt-4 w-full rounded-md py-2.5 text-[12.5px] font-semibold text-white transition-colors hover:brightness-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/60"
              style={{ background: C.blue }}
            >
              {primair.cta}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ---------- Marktplaats (het volledige interactieve veld) ---------- */

function Marktplaats({ onOpen }: { onOpen: () => void }) {
  const [viewKey, setViewKey] = useState<AxisView["key"]>("waarde");
  const [hover, setHover] = useState<number | null>(null);
  const view = VIEWS[viewKey];
  const sel = hover != null ? (OPDRACHTEN[hover] ?? null) : null;

  return (
    <div className="mx-auto max-w-5xl space-y-7">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <SectionHead
          tag={AXIS_LABEL.marktplaats}
          title="Marktveld"
          note="Elke opdracht is een punt. Beweeg over een punt om de coördinaten te lezen; kies om te openen."
        />
        <div
          className="inline-flex shrink-0 rounded-lg p-1"
          style={{ background: C.panelAlt, border: `1px solid ${C.grid}` }}
          role="tablist"
          aria-label="Assenpaar kiezen"
        >
          {(Object.keys(VIEWS) as AxisView["key"][]).map((k) => {
            const on = k === viewKey;
            return (
              <button
                key={k}
                role="tab"
                aria-selected={on}
                onClick={() => {
                  setViewKey(k);
                  setHover(null);
                }}
                className="rounded-md px-3.5 py-1.5 text-[12px] font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2563eb]"
                style={{
                  background: on ? C.panel : "transparent",
                  color: on ? C.ink : C.muted,
                  boxShadow: on ? "0 1px 2px rgba(16,19,24,0.06)" : "none",
                }}
              >
                {VIEWS[k].label}
              </button>
            );
          })}
        </div>
      </div>

      <Panel className="overflow-hidden">
        <div
          className="flex flex-wrap items-center justify-between gap-2 px-5 py-3"
          style={{ borderBottom: `1px solid ${C.grid}` }}
        >
          <div className="flex items-center gap-2">
            <Crosshair size={14} aria-hidden="true" style={{ color: C.blue }} />
            <span className="text-[12.5px] font-medium" style={{ color: C.inkSoft }}>
              y: {view.yLabel}
            </span>
            <span className="text-[12.5px]" style={{ color: C.faint }}>
              ·
            </span>
            <span className="text-[12.5px] font-medium" style={{ color: C.inkSoft }}>
              x: {view.xLabel}
            </span>
          </div>
          <span className="text-[11px] tabular-nums" style={{ ...mono, color: C.faint }}>
            n = {OPDRACHTEN.length}
          </span>
        </div>
        <div className="grid grid-cols-1 gap-5 p-4 lg:grid-cols-[1fr_240px]">
          <ScatterField view={view} active={hover} onHover={setHover} onSelect={onOpen} />
          <div className="space-y-4">
            <QuadLegend view={view} />
            <div
              className="rounded-md px-3 py-3"
              style={{ background: C.panelAlt, border: `1px solid ${C.grid}` }}
            >
              <p
                className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.1em]"
                style={{ color: C.muted }}
              >
                <Target size={12} aria-hidden="true" /> Selectie
              </p>
              {sel ? (
                <div className="mt-2">
                  <p className="text-[13px] font-semibold" style={{ ...display, color: C.ink }}>
                    {sel.titel}
                  </p>
                  <p className="mt-0.5 text-[11.5px]" style={{ color: C.muted }}>
                    {sel.opdrachtgever} · {sel.plaats}
                  </p>
                  <div className="mt-2 flex gap-4 text-[12px] tabular-nums" style={mono}>
                    <span style={{ color: C.blue }}>x {view.xFmt(view.point(sel).x)}</span>
                    <span style={{ color: C.green }}>y {view.yFmt(view.point(sel).y)}</span>
                  </div>
                </div>
              ) : (
                <p className="mt-2 text-[12px] leading-snug" style={{ color: C.faint }}>
                  Beweeg over een punt of navigeer met Tab om de exacte positie te lezen.
                </p>
              )}
            </div>
          </div>
        </div>
      </Panel>

      {/* Tabulaire lijst onder het veld */}
      <Panel className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr
                className="text-[10.5px] uppercase tracking-[0.12em]"
                style={{ color: C.muted, borderBottom: `1px solid ${C.grid}` }}
              >
                <th className="px-5 py-3 font-semibold">Opdracht</th>
                <th className="px-5 py-3 font-semibold">Opdrachtgever</th>
                <th className="px-5 py-3 text-right font-semibold" style={mono}>
                  x
                </th>
                <th className="px-5 py-3 text-right font-semibold" style={mono}>
                  y
                </th>
                <th className="px-5 py-3 text-right font-semibold" />
              </tr>
            </thead>
            <tbody>
              {OPDRACHTEN.map((o, i) => {
                const p = view.point(o);
                const on = hover === i;
                return (
                  <tr
                    key={o.id}
                    onMouseEnter={() => setHover(i)}
                    onMouseLeave={() => setHover(null)}
                    className="cursor-pointer transition-colors"
                    style={{
                      borderTop: `1px solid ${C.grid}`,
                      background: on ? C.panelAlt : "transparent",
                    }}
                    onClick={onOpen}
                  >
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-2.5">
                        <span
                          className="h-2.5 w-2.5 rounded-full"
                          style={{
                            background: on ? C.blue : "transparent",
                            border: `2px solid ${C.blue}`,
                          }}
                          aria-hidden="true"
                        />
                        <span className="text-[13px] font-medium">{o.titel}</span>
                      </div>
                    </td>
                    <td className="px-5 py-3.5 text-[12.5px]" style={{ color: C.muted }}>
                      {o.opdrachtgever}
                    </td>
                    <td
                      className="px-5 py-3.5 text-right text-[12.5px] tabular-nums"
                      style={{ ...mono, color: C.inkSoft }}
                    >
                      {view.xFmt(p.x)}
                    </td>
                    <td
                      className="px-5 py-3.5 text-right text-[12.5px] tabular-nums"
                      style={{ ...mono, color: C.inkSoft }}
                    >
                      {view.yFmt(p.y)}
                    </td>
                    <td className="px-5 py-3.5 text-right">
                      <ChevronRight size={15} aria-hidden="true" style={{ color: C.faint }} />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Panel>
    </div>
  );
}

/* ---------- Opdracht-detail ---------- */

function OpdrachtDetail({ opdracht }: { opdracht: Opdracht }) {
  const view = VIEWS.waarde;
  const idx = OPDRACHTEN.findIndex((o) => o.id === opdracht.id);
  const [hover, setHover] = useState<number | null>(idx >= 0 ? idx : null);

  return (
    <div className="mx-auto max-w-4xl space-y-8">
      <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
        <SectionHead tag={`${AXIS_LABEL.opdracht} · ${opdracht.id}`} title={opdracht.titel} />
        <button
          className="flex shrink-0 items-center gap-2 rounded-lg px-6 py-3 text-[13px] font-semibold text-white transition-colors hover:brightness-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2563eb]"
          style={{ background: C.blue }}
        >
          <Send size={15} aria-hidden="true" /> Reageer op opdracht
        </button>
      </div>

      <p className="flex items-center gap-1.5 text-[13px]" style={{ color: C.muted }}>
        <MapPin size={14} aria-hidden="true" /> {opdracht.opdrachtgever} · {opdracht.plaats}
      </p>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {[
          { l: "Tarief", v: opdracht.tarief },
          { l: "Omvang", v: opdracht.uren },
          { l: "Start", v: opdracht.start },
          { l: "Verwant", v: `${opdracht.match}%` },
        ].map((mkpi) => (
          <Panel key={mkpi.l} className="px-4 py-3.5">
            <p className="text-[11px] uppercase tracking-[0.1em]" style={{ color: C.muted }}>
              {mkpi.l}
            </p>
            <p
              className="mt-1.5 text-[17px] font-semibold tabular-nums tracking-[-0.01em]"
              style={{ ...display, color: C.ink }}
            >
              {mkpi.v}
            </p>
          </Panel>
        ))}
      </div>

      {/* Positie in het veld */}
      <Panel className="overflow-hidden">
        <div className="flex items-center gap-2 px-5 pb-1 pt-4">
          <Crosshair size={14} aria-hidden="true" style={{ color: C.blue }} />
          <h3 className="text-[13px] font-semibold" style={{ ...display, color: C.ink }}>
            Positie in het marktveld
          </h3>
        </div>
        <p className="px-5 text-[12.5px]" style={{ color: C.muted }}>
          Deze opdracht (blauw) ten opzichte van de andere open opdrachten.
        </p>
        <div className="px-3 pb-3 pt-2">
          <ScatterField view={view} active={hover} onHover={(i) => setHover(i)} compact />
        </div>
      </Panel>

      {/* Determinatie */}
      <Panel className="px-6 py-6">
        <div className="flex items-center gap-2">
          <Grid2x2 size={13} aria-hidden="true" style={{ color: C.blue }} />
          <h3
            className="text-[11px] font-semibold uppercase tracking-[0.16em]"
            style={{ color: C.blue, ...mono }}
          >
            Onderbouwing
          </h3>
        </div>
        <p
          className="mt-2.5 text-[20px] font-semibold tracking-[-0.01em]"
          style={{ ...display, color: C.ink }}
        >
          Waarom deze match
        </p>
        <div className="mt-5 grid grid-cols-1 gap-5 sm:grid-cols-2">
          <div
            className="rounded-lg p-5"
            style={{ background: C.greenSoft, border: `1px solid ${C.greenLine}` }}
          >
            <p
              className="text-[10.5px] font-semibold uppercase tracking-[0.14em]"
              style={{ color: C.green }}
            >
              Pluspunten
            </p>
            <ul className="mt-3.5 space-y-3">
              {opdracht.redenen.plus.map((r) => (
                <li key={r} className="flex items-start gap-2.5 text-[13px]">
                  <span
                    className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full"
                    style={{ background: C.green }}
                    aria-hidden="true"
                  >
                    <Check size={12} style={{ color: "#fff" }} />
                  </span>
                  {r}
                </li>
              ))}
            </ul>
          </div>
          <div
            className="rounded-lg p-5"
            style={{ background: C.amberSoft, border: `1px solid ${C.amberLine}` }}
          >
            <p
              className="text-[10.5px] font-semibold uppercase tracking-[0.14em]"
              style={{ color: C.amber }}
            >
              Aandachtspunten
            </p>
            <ul className="mt-3.5 space-y-3">
              {opdracht.redenen.min.map((r) => (
                <li
                  key={r}
                  className="flex items-start gap-2.5 text-[13px]"
                  style={{ color: C.inkSoft }}
                >
                  <span
                    className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full"
                    style={{ background: C.amberSoft, border: `1px solid ${C.amberLine}` }}
                    aria-hidden="true"
                  >
                    <Minus size={12} style={{ color: C.amber }} />
                  </span>
                  {r}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </Panel>
    </div>
  );
}

/* ---------- Verificatie ---------- */

function Verificatie() {
  const verified = CREDENTIALS.filter((c) => c.status === "VERIFIED").length;
  const total = CREDENTIALS.length;
  const pct = Math.round((verified / total) * 100);

  return (
    <div className="mx-auto max-w-4xl space-y-8">
      <SectionHead tag={AXIS_LABEL.verificatie} title="Verificatie" />

      <Panel className="px-6 py-6">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4">
            <div
              className="flex h-14 w-14 shrink-0 items-center justify-center rounded-lg"
              style={{ background: C.greenSoft, border: `1px solid ${C.greenLine}` }}
            >
              <Check size={26} aria-hidden="true" style={{ color: C.green }} />
            </div>
            <div>
              <p
                className="text-[22px] font-semibold tracking-[-0.01em]"
                style={{ ...display, color: C.ink }}
              >
                {PROFIEL.trust}
              </p>
              <p className="mt-0.5 text-[12.5px]" style={{ color: C.inkSoft }}>
                <span className="tabular-nums">{verified}</span> van{" "}
                <span className="tabular-nums">{total}</span> bewijsstukken geverifieerd ·{" "}
                <span className="tabular-nums">1</span> vraagt aandacht.
              </p>
            </div>
          </div>
          <div className="w-full sm:w-56">
            <div
              className="flex items-center justify-between text-[11px]"
              style={{ color: C.muted }}
            >
              <span>Gereedheid</span>
              <span className="tabular-nums" style={{ ...mono, color: C.green }}>
                {pct}%
              </span>
            </div>
            <div
              className="mt-1.5 h-2 overflow-hidden rounded-full"
              style={{ background: C.panelAlt }}
            >
              <div
                className="h-full rounded-full"
                style={{ width: `${pct}%`, background: C.green }}
              />
            </div>
          </div>
        </div>
      </Panel>

      <div className="space-y-4">
        {CREDENTIALS.map((c) => {
          const st = statusStyle(c.status);
          return (
            <Panel key={c.naam} className="px-5 py-4">
              <div className="flex items-center gap-4">
                <div
                  className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg"
                  style={{ background: st.bg, border: `1px solid ${st.line}` }}
                >
                  <st.Icon size={18} aria-hidden="true" style={{ color: st.fg }} />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-[14.5px] font-medium leading-tight">{c.naam}</p>
                  <p className="text-[12px]" style={{ color: C.muted }}>
                    {c.detail}
                  </p>
                </div>
                <StatusChip status={c.status} />
              </div>
            </Panel>
          );
        })}
      </div>

      {/* Archief */}
      <div>
        <h2 className="mb-3 text-[13px] font-semibold" style={{ ...display, color: C.ink }}>
          Archief · documenten
        </h2>
        <Panel className="overflow-hidden">
          <div className="flex flex-col">
            {DOCUMENTEN.map((d, i) => {
              return (
                <div
                  key={d.naam}
                  className="flex items-center gap-3.5 px-4 py-3.5"
                  style={{ borderTop: i === 0 ? "none" : `1px solid ${C.grid}` }}
                >
                  <span
                    className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md"
                    style={{ background: C.panelAlt }}
                    aria-hidden="true"
                  >
                    <FileText size={15} style={{ color: C.muted }} />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[12.5px] font-medium">{d.naam}</p>
                    <p className="truncate text-[11px]" style={{ color: C.muted }}>
                      {d.type} · {d.grootte} · {d.bijgewerkt}
                    </p>
                  </div>
                  <StatusChip status={d.status} />
                </div>
              );
            })}
          </div>
        </Panel>
      </div>
    </div>
  );
}

/* ---------- Acties ---------- */

function Acties() {
  const tone: Record<
    "warning" | "info",
    { fg: string; bg: string; line: string; Icon: LucideIcon }
  > = {
    warning: { fg: C.amber, bg: C.amberSoft, line: C.amberLine, Icon: AlertTriangle },
    info: { fg: C.blue, bg: C.blueSoft, line: C.blueLine, Icon: Bell },
  };
  return (
    <div className="mx-auto max-w-3xl space-y-8">
      <SectionHead
        tag={AXIS_LABEL.acties}
        title="Volgende acties"
        note="Gesorteerd op prioriteit. Eén ding tegelijk — de rest bewaken wij."
      />
      <div className="space-y-4">
        {ACTIES.map((a, i) => {
          const t = tone[a.urgentie];
          return (
            <Panel key={a.titel} className="px-5 py-4">
              <div className="flex items-start gap-4">
                <div
                  className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg"
                  style={{ background: t.bg, border: `1px solid ${t.line}` }}
                >
                  <t.Icon size={19} aria-hidden="true" style={{ color: t.fg }} />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-baseline gap-2.5">
                    <span className="text-[10px] tabular-nums" style={{ ...mono, color: C.faint }}>
                      {String(i + 1).padStart(2, "0")}
                    </span>
                    <p
                      className="text-[15px] font-semibold leading-tight"
                      style={{ ...display, color: C.ink }}
                    >
                      {a.titel}
                    </p>
                  </div>
                  <p className="mt-1 text-[12.5px]" style={{ color: C.muted }}>
                    {a.detail}
                  </p>
                </div>
                <button
                  className="shrink-0 rounded-lg px-4 py-2 text-[12px] font-semibold transition-colors hover:bg-[#f1f3f7] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2563eb]"
                  style={{ color: t.fg, border: `1px solid ${t.line}` }}
                >
                  {a.cta}
                </button>
              </div>
            </Panel>
          );
        })}
      </div>

      <div
        className="flex items-center gap-4 rounded-lg px-5 py-4"
        style={{ background: C.panelAlt, border: `1px solid ${C.grid}` }}
      >
        <div
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg"
          style={{ background: C.greenSoft, border: `1px solid ${C.greenLine}` }}
        >
          <Check size={18} aria-hidden="true" style={{ color: C.green }} />
        </div>
        <p className="text-[12.5px] leading-relaxed" style={{ color: C.inkSoft }}>
          Alles bij? Mooi. Nieuwe acties verschijnen hier zodra ze relevant worden — je hoeft niets
          zelf te bewaken.
        </p>
      </div>
    </div>
  );
}

/* ---------- Facturen ---------- */

function Facturen() {
  const statusTone: Record<string, { fg: string; bg: string; line: string }> = {
    Betaald: { fg: C.green, bg: C.greenSoft, line: C.greenLine },
    Openstaand: { fg: C.amber, bg: C.amberSoft, line: C.amberLine },
    Concept: { fg: C.muted, bg: C.panelAlt, line: C.grid },
  };
  return (
    <div className="mx-auto max-w-4xl space-y-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <SectionHead tag={AXIS_LABEL.facturen} title="Facturen" />
        <button
          className="inline-flex items-center gap-2 rounded-lg px-5 py-2.5 text-[12.5px] font-semibold text-white transition-colors hover:brightness-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2563eb]"
          style={{ background: C.blue }}
        >
          <Plus size={14} aria-hidden="true" /> Nieuwe factuur
        </button>
      </div>

      <Panel className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr
                className="text-[10.5px] uppercase tracking-[0.12em]"
                style={{ color: C.muted, borderBottom: `1px solid ${C.grid}` }}
              >
                <th className="px-5 py-3 font-semibold" style={mono}>
                  Nummer
                </th>
                <th className="px-5 py-3 font-semibold">Klant</th>
                <th className="px-5 py-3 font-semibold">Datum</th>
                <th className="px-5 py-3 text-right font-semibold">Bedrag</th>
                <th className="px-5 py-3 text-right font-semibold">Status</th>
              </tr>
            </thead>
            <tbody>
              {FACTUREN.map((f) => {
                const t = statusTone[f.status] ?? { fg: C.muted, bg: C.panelAlt, line: C.grid };
                return (
                  <tr
                    key={f.nr}
                    className="transition-colors hover:bg-[#f1f3f7]"
                    style={{ borderTop: `1px solid ${C.grid}` }}
                  >
                    <td
                      className="px-5 py-3.5 text-[12.5px] tabular-nums"
                      style={{ ...mono, color: C.inkSoft }}
                    >
                      {f.nr}
                    </td>
                    <td className="px-5 py-3.5 text-[13px] font-medium">{f.klant}</td>
                    <td
                      className="px-5 py-3.5 text-[12.5px] tabular-nums"
                      style={{ ...mono, color: C.muted }}
                    >
                      {f.datum}
                    </td>
                    <td
                      className="px-5 py-3.5 text-right text-[13.5px] font-semibold tabular-nums"
                      style={{ ...mono, color: C.ink }}
                    >
                      {f.bedrag}
                    </td>
                    <td className="px-5 py-3.5 text-right">
                      <span
                        className="inline-flex items-center gap-1.5 rounded-md px-3 py-1 text-[11px] font-medium"
                        style={{ color: t.fg, background: t.bg, border: `1px solid ${t.line}` }}
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
      </Panel>
    </div>
  );
}
