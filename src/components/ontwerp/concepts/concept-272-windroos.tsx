"use client";

// Concept 272 — "Windroos" · Nautical wayfinding / zeekaart (dark maritime).
// Signature: a compass-rose (windrose) used as a real navigation element. The brand mark and an
// interactive radial selector are drawn with inline SVG (N/O/Z/W cardinals, hairline bearing lines /
// peilingen). The surface is a deep teal/navy sea-chart with a very subtle lat/long hairline grid and
// thin concentric rings — an engraved feel. Warm brass/gold accents on parchment/ivory text. Match is
// visualised as a compass BEARING: a small dial with a brass needle whose angle derives from the match
// value, always paired with a serif numeral so it is never needle- or colour-only. KPI values, amounts
// and match figures use old-chart serif numerals. Fonts: Geist (tekst) + Geist Mono (peilingen/codes).

import { useState, type CSSProperties, type ReactNode } from "react";
import {
  Compass,
  Anchor,
  Navigation,
  Waves,
  LayoutDashboard,
  Store,
  Briefcase,
  ShieldCheck,
  ListTodo,
  Receipt,
  Search,
  MapPin,
  Wallet,
  Clock,
  Calendar,
  Check,
  ArrowRight,
  ArrowLeft,
  BadgeCheck,
  TriangleAlert,
  XCircle,
  FileText,
  RefreshCw,
  CircleAlert,
  Plus,
  Minus,
  TrendingUp,
  TrendingDown,
  Bookmark,
  BookmarkCheck,
  LifeBuoy,
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
  DOCUMENTEN,
  type ScreenKey,
  type CredStatus,
  type Opdracht,
} from "./mock";

// Deep maritime sea-chart palette. Light parchment/ivory on deep teal & navy, warm brass accent.
const C = {
  bg: "#0b2427", // deep teal hull
  bg2: "#0e2033", // navy
  panel: "#12363a", // slightly lifted teal panel
  panelSoft: "#0f2c30",
  raise: "#164046", // hover / raised
  line: "rgba(217,180,92,0.18)", // brass hairline
  lineSoft: "rgba(217,180,92,0.09)",
  grid: "rgba(160,196,190,0.10)", // faint sea-grid
  brass: "#d9b45c",
  brassBright: "#e6c874",
  brassDeep: "#c9a24b",
  brassSoft: "rgba(217,180,92,0.14)",
  ivory: "#f4ecd8", // parchment ivory (primary text)
  parchment: "#e6dcc2",
  sea: "#9db6b1", // muted sea-grey (secondary text)
  seaDim: "#6f8a86",
  seaFaint: "#4f6a67",
  // status tones — each also carries its own icon + label (never colour alone)
  verified: "#5fb98f", // sea green
  verifiedSoft: "rgba(95,185,143,0.15)",
  submitted: "#6fa8d0", // sky blue
  submittedSoft: "rgba(111,168,208,0.15)",
  expiring: "#d9b45c", // brass amber
  expiringSoft: "rgba(217,180,92,0.16)",
  rejected: "#d98a6a", // terracotta
  rejectedSoft: "rgba(217,138,106,0.16)",
};

const geist = { fontFamily: "var(--font-lab-geist)" };
const mono = { fontFamily: "var(--font-lab-geist-mono)" };
// Old-chart serif numerals — a CSS font-family value, not an imported font/file.
const serif = { fontFamily: "Georgia, 'Times New Roman', serif" };

const RING =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#e6c874] focus-visible:ring-offset-2 focus-visible:ring-offset-[#0b2427]";

const NAV_ICONS: Record<ScreenKey, LucideIcon> = {
  dashboard: LayoutDashboard,
  marktplaats: Store,
  opdracht: Briefcase,
  verificatie: ShieldCheck,
  acties: ListTodo,
  facturen: Receipt,
  documenten: FileText,
  berichten: Search,
};

// A bearing label per screen — reinforces the wayfinding metaphor (peiling in graden).
const SCREEN_BEARING: Record<ScreenKey, { peiling: string; kwadrant: string }> = {
  dashboard: { peiling: "000°", kwadrant: "N" },
  marktplaats: { peiling: "060°", kwadrant: "NO" },
  opdracht: { peiling: "120°", kwadrant: "ZO" },
  verificatie: { peiling: "180°", kwadrant: "Z" },
  acties: { peiling: "240°", kwadrant: "ZW" },
  facturen: { peiling: "300°", kwadrant: "NW" },
  documenten: { peiling: "150°", kwadrant: "ZZO" },
  berichten: { peiling: "210°", kwadrant: "ZZW" },
};

// ---- Chart primitives -------------------------------------------------------

function panelStyle(): CSSProperties {
  return {
    background: C.panel,
    border: `1px solid ${C.line}`,
    borderRadius: 10,
    boxShadow: "0 1px 0 rgba(255,255,255,0.02) inset, 0 6px 18px rgba(0,0,0,0.28)",
  };
}

function Panel({
  children,
  className,
  style,
}: {
  children: ReactNode;
  className?: string;
  style?: CSSProperties;
}) {
  return (
    <div className={className} style={{ ...panelStyle(), ...style }}>
      {children}
    </div>
  );
}

// Very subtle sea-chart backdrop: latitude/longitude hairlines + faint concentric bearing rings.
function ChartBackdrop() {
  const rings = [70, 130, 190, 250];
  return (
    <svg
      className="pointer-events-none absolute inset-0 h-full w-full"
      aria-hidden="true"
      preserveAspectRatio="xMidYMid slice"
      viewBox="0 0 800 600"
    >
      {/* longitude lines */}
      {Array.from({ length: 9 }).map((_, i) => (
        <line
          key={`v${i}`}
          x1={(i / 8) * 800}
          y1={0}
          x2={(i / 8) * 800}
          y2={600}
          stroke={C.grid}
          strokeWidth={i % 2 === 0 ? 0.8 : 0.4}
        />
      ))}
      {/* latitude lines */}
      {Array.from({ length: 7 }).map((_, i) => (
        <line
          key={`h${i}`}
          x1={0}
          y1={(i / 6) * 600}
          x2={800}
          y2={(i / 6) * 600}
          stroke={C.grid}
          strokeWidth={i % 2 === 0 ? 0.8 : 0.4}
        />
      ))}
      {/* concentric bearing rings around a chart node */}
      {rings.map((r) => (
        <circle key={r} cx={640} cy={150} r={r} fill="none" stroke={C.lineSoft} strokeWidth={0.7} />
      ))}
      {/* radiating peilingen from the node */}
      {Array.from({ length: 16 }).map((_, i) => {
        const a = (i / 16) * Math.PI * 2;
        return (
          <line
            key={`p${i}`}
            x1={640}
            y1={150}
            x2={640 + Math.sin(a) * 250}
            y2={150 - Math.cos(a) * 250}
            stroke={C.lineSoft}
            strokeWidth={0.5}
          />
        );
      })}
    </svg>
  );
}

// The brand glyph — a compass rose drawn as inline SVG (N/O/Z/W cardinals + bearing star).
function CompassGlyph({ size = 40 }: { size?: number }) {
  const arm = size * 0.42;
  const diag = size * 0.26;
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      aria-hidden="true"
      style={{ display: "block" }}
    >
      <circle cx={50} cy={50} r={46} fill="none" stroke={C.brass} strokeWidth={2} />
      <circle cx={50} cy={50} r={38} fill="none" stroke={C.lineSoft} strokeWidth={1} />
      {/* diagonal (intercardinal) star */}
      {[45, 135, 225, 315].map((deg) => {
        const a = (deg * Math.PI) / 180;
        return (
          <line
            key={deg}
            x1={50}
            y1={50}
            x2={50 + Math.sin(a) * (diag / size) * 100}
            y2={50 - Math.cos(a) * (diag / size) * 100}
            stroke={C.brassDeep}
            strokeWidth={1.4}
          />
        );
      })}
      {/* cardinal star points as thin diamonds */}
      {[0, 90, 180, 270].map((deg) => {
        const a = (deg * Math.PI) / 180;
        const tipX = 50 + Math.sin(a) * (arm / size) * 100;
        const tipY = 50 - Math.cos(a) * (arm / size) * 100;
        const bx = 50 + Math.sin(a + Math.PI / 2) * 6;
        const by = 50 - Math.cos(a + Math.PI / 2) * 6;
        const bx2 = 50 + Math.sin(a - Math.PI / 2) * 6;
        const by2 = 50 - Math.cos(a - Math.PI / 2) * 6;
        return (
          <polygon
            key={deg}
            points={`${tipX},${tipY} ${bx},${by} ${bx2},${by2}`}
            fill={deg === 0 ? C.brassBright : C.brass}
          />
        );
      })}
      <circle cx={50} cy={50} r={3.4} fill={C.brassBright} />
      {/* N marker */}
      <text
        x={50}
        y={14}
        textAnchor="middle"
        fontSize={11}
        fontWeight={700}
        fill={C.ivory}
        style={serif}
      >
        N
      </text>
    </svg>
  );
}

// Signature: match% shown as a compass BEARING — a brass needle on a dial + a serif numeral label.
function BearingGauge({ value, size = 72 }: { value: number; size?: number }) {
  const bearing = (value / 100) * 360; // 0..360 degrees
  const tone = value >= 90 ? C.verified : value >= 82 ? C.brass : C.rejected;
  const cardinals: { label: string; deg: number }[] = [
    { label: "N", deg: 0 },
    { label: "O", deg: 90 },
    { label: "Z", deg: 180 },
    { label: "W", deg: 270 },
  ];
  return (
    <div
      className="relative shrink-0"
      style={{ width: size, height: size }}
      role="img"
      aria-label={`Match-peiling ${value} procent`}
    >
      <svg width={size} height={size} viewBox="0 0 100 100" aria-hidden="true">
        <circle cx={50} cy={50} r={47} fill={C.panelSoft} stroke={C.line} strokeWidth={1.4} />
        <circle cx={50} cy={50} r={40} fill="none" stroke={C.lineSoft} strokeWidth={1} />
        {/* degree ticks */}
        {Array.from({ length: 24 }).map((_, i) => {
          const a = (i / 24) * Math.PI * 2;
          const major = i % 6 === 0;
          const r1 = major ? 34 : 38;
          return (
            <line
              key={i}
              x1={50 + Math.sin(a) * r1}
              y1={50 - Math.cos(a) * r1}
              x2={50 + Math.sin(a) * 44}
              y2={50 - Math.cos(a) * 44}
              stroke={major ? C.brassDeep : C.lineSoft}
              strokeWidth={major ? 1.3 : 0.7}
            />
          );
        })}
        {/* cardinal letters */}
        {cardinals.map((cd) => {
          const a = (cd.deg * Math.PI) / 180;
          return (
            <text
              key={cd.label}
              x={50 + Math.sin(a) * 27}
              y={50 - Math.cos(a) * 27 + 3}
              textAnchor="middle"
              fontSize={7}
              fill={C.seaDim}
              style={serif}
            >
              {cd.label}
            </text>
          );
        })}
        {/* needle pointing to bearing */}
        <g transform={`rotate(${bearing} 50 50)`}>
          <polygon points="50,12 46,52 54,52" fill={tone} />
          <polygon points="50,88 46,50 54,50" fill={C.seaFaint} />
        </g>
        <circle cx={50} cy={50} r={4} fill={C.panel} stroke={C.brass} strokeWidth={1.4} />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span
          className="text-[16px] font-semibold tabular-nums leading-none"
          style={{ ...serif, color: C.ivory }}
        >
          {value}
        </span>
        <span
          className="mt-0.5 text-[7px] font-semibold uppercase tracking-[0.18em]"
          style={{ ...mono, color: C.seaDim }}
        >
          peiling
        </span>
      </div>
    </div>
  );
}

function statusMeta(s: CredStatus): {
  label: string;
  Icon: LucideIcon;
  tone: string;
  soft: string;
} {
  switch (s) {
    case "VERIFIED":
      return { label: "Geverifieerd", Icon: BadgeCheck, tone: C.verified, soft: C.verifiedSoft };
    case "SUBMITTED":
      return { label: "In beoordeling", Icon: Clock, tone: C.submitted, soft: C.submittedSoft };
    case "EXPIRING":
      return {
        label: "Verloopt bijna",
        Icon: TriangleAlert,
        tone: C.expiring,
        soft: C.expiringSoft,
      };
    case "REJECTED":
      return { label: "Afgewezen", Icon: XCircle, tone: C.rejected, soft: C.rejectedSoft };
  }
}

// Status always carries icon + label + tone — never colour alone.
function StatusBadge({ status }: { status: CredStatus }) {
  const { label, Icon, tone, soft } = statusMeta(status);
  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-full py-1 pl-1.5 pr-2.5 text-[11px] font-semibold"
      style={{ ...geist, color: tone, background: soft, border: `1px solid ${tone}55` }}
    >
      <Icon size={13} strokeWidth={2.2} aria-hidden="true" />
      {label}
    </span>
  );
}

function Sparkline({ data, tone, height = 30 }: { data: number[]; tone: string; height?: number }) {
  const max = Math.max(...data);
  const min = Math.min(...data);
  const span = max - min || 1;
  const pts = data.map((v, i) => {
    const x = (i / (data.length - 1)) * 100;
    const y = 100 - ((v - min) / span) * 66 - 17;
    return [x, y] as const;
  });
  const line = pts.map(([x, y]) => `${x.toFixed(1)},${y.toFixed(1)}`).join(" ");
  const last = pts[pts.length - 1];
  return (
    <svg
      viewBox="0 0 100 100"
      preserveAspectRatio="none"
      className="w-full"
      style={{ height }}
      aria-hidden="true"
    >
      <polygon points={`0,100 ${line} 100,100`} fill={tone} opacity={0.1} />
      <polyline
        points={line}
        fill="none"
        stroke={tone}
        strokeWidth={1.8}
        strokeLinecap="round"
        strokeLinejoin="round"
        vectorEffect="non-scaling-stroke"
      />
      {last && (
        <circle cx={last[0]} cy={last[1]} r={2.4} fill={tone} vectorEffect="non-scaling-stroke" />
      )}
    </svg>
  );
}

// The interactive radial windrose — a real navigation element: the 6 screens sit at bearings
// around a compass rose. Each point is a keyboard-reachable button that changes the screen.
function KompasRoos({ screen, onSelect }: { screen: ScreenKey; onSelect: (k: ScreenKey) => void }) {
  const size = 260;
  const c = size / 2;
  const R = size * 0.4;
  return (
    <div className="relative mx-auto" style={{ width: size, height: size }}>
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        aria-hidden="true"
        className="absolute inset-0"
      >
        {/* outer + inner rings */}
        <circle cx={c} cy={c} r={R + 20} fill="none" stroke={C.line} strokeWidth={1.2} />
        <circle cx={c} cy={c} r={R - 4} fill="none" stroke={C.lineSoft} strokeWidth={1} />
        <circle cx={c} cy={c} r={30} fill={C.panelSoft} stroke={C.line} strokeWidth={1.2} />
        {/* bearing spokes to each screen point */}
        {SCREENS.map((_, i) => {
          const a = (i / SCREENS.length) * Math.PI * 2;
          return (
            <line
              key={i}
              x1={c}
              y1={c}
              x2={c + Math.sin(a) * R}
              y2={c - Math.cos(a) * R}
              stroke={C.lineSoft}
              strokeWidth={0.8}
            />
          );
        })}
        {/* degree ticks */}
        {Array.from({ length: 36 }).map((_, i) => {
          const a = (i / 36) * Math.PI * 2;
          const major = i % 9 === 0;
          const r1 = major ? R + 10 : R + 15;
          return (
            <line
              key={`t${i}`}
              x1={c + Math.sin(a) * r1}
              y1={c - Math.cos(a) * r1}
              x2={c + Math.sin(a) * (R + 20)}
              y2={c - Math.cos(a) * (R + 20)}
              stroke={major ? C.brassDeep : C.lineSoft}
              strokeWidth={major ? 1.3 : 0.7}
            />
          );
        })}
        {/* central star */}
        {[0, 90, 180, 270].map((deg) => {
          const a = (deg * Math.PI) / 180;
          const tip = 26;
          const tx = c + Math.sin(a) * tip;
          const ty = c - Math.cos(a) * tip;
          const bx = c + Math.sin(a + Math.PI / 2) * 7;
          const by = c - Math.cos(a + Math.PI / 2) * 7;
          const bx2 = c + Math.sin(a - Math.PI / 2) * 7;
          const by2 = c - Math.cos(a - Math.PI / 2) * 7;
          return (
            <polygon
              key={deg}
              points={`${tx},${ty} ${bx},${by} ${bx2},${by2}`}
              fill={deg === 0 ? C.brassBright : C.brass}
            />
          );
        })}
        {/* cardinal letters */}
        {[
          { l: "N", d: 0 },
          { l: "O", d: 90 },
          { l: "Z", d: 180 },
          { l: "W", d: 270 },
        ].map((cd) => {
          const a = (cd.d * Math.PI) / 180;
          return (
            <text
              key={cd.l}
              x={c + Math.sin(a) * (R + 32)}
              y={c - Math.cos(a) * (R + 32) + 4}
              textAnchor="middle"
              fontSize={13}
              fontWeight={700}
              fill={C.parchment}
              style={serif}
            >
              {cd.l}
            </text>
          );
        })}
      </svg>
      {/* screen points as real buttons */}
      {SCREENS.map((s, i) => {
        const a = (i / SCREENS.length) * Math.PI * 2;
        const x = c + Math.sin(a) * R;
        const y = c - Math.cos(a) * R;
        const on = s.key === screen;
        const Icon = NAV_ICONS[s.key];
        return (
          <button
            key={s.key}
            onClick={() => onSelect(s.key)}
            aria-current={on ? "page" : undefined}
            aria-label={`Vaar naar ${s.label}`}
            className={`absolute flex h-11 w-11 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full transition-transform hover:scale-110 ${RING}`}
            style={{
              left: x,
              top: y,
              background: on ? C.brass : C.panel,
              border: `1.5px solid ${on ? C.brassBright : C.line}`,
              color: on ? C.bg : C.parchment,
              boxShadow: on ? "0 0 0 4px rgba(217,180,92,0.18)" : "0 4px 10px rgba(0,0,0,0.3)",
            }}
          >
            <Icon size={17} strokeWidth={2} aria-hidden="true" />
          </button>
        );
      })}
      {/* centre needle indicator toward active */}
      <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
        <Compass size={26} strokeWidth={1.6} style={{ color: C.brassBright }} aria-hidden="true" />
      </div>
    </div>
  );
}

function SectionTitle({ Icon, children }: { Icon: LucideIcon; children: ReactNode }) {
  return (
    <div className="mb-3 flex items-center gap-2">
      <Icon size={15} strokeWidth={2} style={{ color: C.brass }} aria-hidden="true" />
      <h2
        className="text-[13px] font-semibold uppercase tracking-[0.14em]"
        style={{ ...geist, color: C.parchment }}
      >
        {children}
      </h2>
    </div>
  );
}

function ScreenHead({
  screenKey,
  title,
  sub,
}: {
  screenKey: ScreenKey;
  title: string;
  sub?: string;
}) {
  const b = SCREEN_BEARING[screenKey];
  return (
    <div className="mb-6">
      <div className="mb-2 flex items-center gap-2">
        <span
          className="inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-semibold tabular-nums tracking-[0.12em]"
          style={{ ...mono, color: C.brass, borderColor: C.line, background: C.brassSoft }}
        >
          <Compass size={11} strokeWidth={2} aria-hidden="true" />
          {b.peiling} · {b.kwadrant}
        </span>
      </div>
      <h1
        className="text-[26px] font-semibold leading-tight tracking-tight sm:text-[30px]"
        style={{ ...geist, color: C.ivory }}
      >
        {title}
      </h1>
      {sub && (
        <p
          className="mt-2 max-w-xl text-[13.5px] leading-relaxed"
          style={{ ...geist, color: C.sea }}
        >
          {sub}
        </p>
      )}
    </div>
  );
}

// ---- Screens ----------------------------------------------------------------

function Dashboard({ onSelect, onOpen }: { onSelect: (k: ScreenKey) => void; onOpen: () => void }) {
  const top = OPDRACHTEN[0] as Opdracht;
  const voornaam = PROFIEL.naam.split(" ")[0];
  return (
    <div>
      <div className="mb-8">
        <div className="mb-2 flex items-center gap-2">
          <Anchor size={13} strokeWidth={2} style={{ color: C.brass }} aria-hidden="true" />
          <span
            className="text-[11px] font-semibold uppercase tracking-[0.18em]"
            style={{ ...mono, color: C.seaDim }}
          >
            Thuishaven · {PROFIEL.plaats}
          </span>
        </div>
        <h1
          className="text-[30px] font-semibold leading-none tracking-tight sm:text-[36px]"
          style={{ ...geist, color: C.ivory }}
        >
          Aan boord, {voornaam}
        </h1>
        <p className="mt-2 text-[14px]" style={{ ...geist, color: C.sea }}>
          Je koers voor vandaag — uitgezet op de zeekaart.
        </p>
      </div>

      <div className="mb-8 grid grid-cols-2 gap-3 lg:grid-cols-4">
        {KPIS.map((k) => {
          const Trend = k.up ? TrendingUp : TrendingDown;
          const tone = k.up ? C.verified : C.expiring;
          return (
            <Panel key={k.label} className="overflow-hidden">
              <div className="p-4">
                <div className="flex items-start justify-between gap-2">
                  <span
                    className="text-[10px] font-semibold uppercase tracking-[0.1em]"
                    style={{ ...geist, color: C.seaDim }}
                  >
                    {k.label}
                  </span>
                  <span
                    className="inline-flex items-center gap-0.5 text-[11px] font-semibold tabular-nums"
                    style={{ ...mono, color: tone }}
                  >
                    <Trend size={11} strokeWidth={2.2} aria-hidden="true" />
                    {k.trend}
                  </span>
                </div>
                <div
                  className="mt-2 text-[26px] font-semibold tabular-nums leading-none"
                  style={{ ...serif, color: C.ivory }}
                >
                  {k.value}
                </div>
                <div className="mt-3">
                  <Sparkline data={k.spark} tone={C.brass} />
                </div>
              </div>
            </Panel>
          );
        })}
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <SectionTitle Icon={Navigation}>Beste peiling</SectionTitle>
          <button
            onClick={onOpen}
            className={`group flex w-full items-stretch gap-4 overflow-hidden p-0 text-left transition-transform hover:-translate-y-0.5 ${RING}`}
            style={panelStyle()}
          >
            <span
              className="flex w-1.5 shrink-0"
              style={{ background: C.brass }}
              aria-hidden="true"
            />
            <span className="flex flex-1 items-center gap-4 p-5">
              <BearingGauge value={top.match} />
              <span className="min-w-0 flex-1">
                <span
                  className="block text-[17px] font-semibold leading-tight"
                  style={{ ...geist, color: C.ivory }}
                >
                  {top.titel}
                </span>
                <span className="mt-0.5 block text-[13px]" style={{ ...geist, color: C.sea }}>
                  {top.opdrachtgever} · {top.plaats} · {top.tarief}
                </span>
                <span className="mt-3 flex flex-wrap gap-1.5">
                  {top.tags.map((t) => (
                    <span
                      key={t}
                      className="rounded-full px-2.5 py-0.5 text-[11px]"
                      style={{
                        ...geist,
                        color: C.parchment,
                        background: C.brassSoft,
                        border: `1px solid ${C.line}`,
                      }}
                    >
                      {t}
                    </span>
                  ))}
                </span>
              </span>
              <ArrowRight
                size={20}
                className="mt-1 shrink-0 transition-transform group-hover:translate-x-1"
                style={{ color: C.brass }}
                aria-hidden="true"
              />
            </span>
          </button>

          <Panel className="mt-6 overflow-hidden">
            <div className="flex items-start gap-4 p-5">
              <span
                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg"
                style={{
                  background: C.verifiedSoft,
                  color: C.verified,
                  border: `1px solid ${C.verified}44`,
                }}
                aria-hidden="true"
              >
                <ShieldCheck size={22} strokeWidth={2} />
              </span>
              <div>
                <span className="inline-flex items-center gap-2">
                  <span className="text-[14px] font-semibold" style={{ ...geist, color: C.ivory }}>
                    {PROFIEL.trust}
                  </span>
                  <BadgeCheck
                    size={15}
                    strokeWidth={2}
                    style={{ color: C.verified }}
                    aria-hidden="true"
                  />
                </span>
                <p className="mt-1 text-[13px] leading-relaxed" style={{ ...geist, color: C.sea }}>
                  Je documenten zijn geverifieerd — opdrachtgevers zien meteen dat je koersvast
                  bent.
                </p>
              </div>
            </div>
          </Panel>
        </div>

        <div>
          <SectionTitle Icon={ListTodo}>Volgende koerswijziging</SectionTitle>
          <ul className="space-y-3">
            {ACTIES.map((a) => {
              const warn = a.urgentie === "warning";
              const tone = warn ? C.expiring : C.submitted;
              return (
                <Panel key={a.titel} className="overflow-hidden">
                  <div className="flex">
                    <span
                      className="w-1 shrink-0"
                      style={{ background: tone }}
                      aria-hidden="true"
                    />
                    <div className="p-3.5">
                      <div
                        className="flex items-center gap-1.5 text-[13px] font-semibold leading-snug"
                        style={{ ...geist, color: C.ivory }}
                      >
                        {warn ? (
                          <TriangleAlert
                            size={13}
                            strokeWidth={2.2}
                            style={{ color: tone }}
                            aria-hidden="true"
                          />
                        ) : (
                          <LifeBuoy
                            size={13}
                            strokeWidth={2.2}
                            style={{ color: tone }}
                            aria-hidden="true"
                          />
                        )}
                        {a.titel}
                      </div>
                      <button
                        onClick={() => onSelect("acties")}
                        className={`mt-2 inline-flex items-center gap-1 rounded-md px-2.5 py-1 text-[12px] font-semibold transition-colors ${RING}`}
                        style={{
                          ...geist,
                          color: tone,
                          background: warn ? C.expiringSoft : C.submittedSoft,
                        }}
                      >
                        {a.cta}
                        <ArrowRight size={12} strokeWidth={2.2} aria-hidden="true" />
                      </button>
                    </div>
                  </div>
                </Panel>
              );
            })}
          </ul>

          <Panel className="mt-6 p-5">
            <SectionTitle Icon={Compass}>Kompas</SectionTitle>
            <p className="mb-3 text-[12px]" style={{ ...geist, color: C.sea }}>
              Kies je bestemming op de windroos.
            </p>
            <KompasRoos screen="dashboard" onSelect={onSelect} />
          </Panel>
        </div>
      </div>
    </div>
  );
}

function Marktplaats({
  query,
  setQuery,
  saved,
  toggleSave,
  onOpen,
}: {
  query: string;
  setQuery: (v: string) => void;
  saved: Set<string>;
  toggleSave: (id: string) => void;
  onOpen: (o: Opdracht) => void;
}) {
  const q = query.trim().toLowerCase();
  const filtered = OPDRACHTEN.filter(
    (o) =>
      o.titel.toLowerCase().includes(q) ||
      o.opdrachtgever.toLowerCase().includes(q) ||
      o.plaats.toLowerCase().includes(q) ||
      o.tags.some((t) => t.toLowerCase().includes(q)),
  );
  return (
    <div>
      <ScreenHead
        screenKey="marktplaats"
        title="Vaargebied"
        sub="Elke opdracht is een baken — we peilen eerlijk waarom het past en waar de koers afwijkt."
      />

      <div
        className="mb-5 flex items-center gap-2 rounded-lg px-4 py-2.5"
        style={{ background: C.panelSoft, border: `1px solid ${C.line}` }}
      >
        <Search size={16} className="shrink-0" style={{ color: C.brass }} aria-hidden="true" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Zoek op titel, haven of vaardigheid…"
          aria-label="Zoek opdrachten"
          className="w-full bg-transparent py-1 text-[14px] outline-none placeholder:opacity-60"
          style={{ ...geist, color: C.ivory }}
        />
        {query && (
          <button
            onClick={() => setQuery("")}
            className={`rounded-md px-3 py-1 text-[11px] font-semibold ${RING}`}
            style={{ ...geist, color: C.brass, background: C.brassSoft }}
          >
            Wis
          </button>
        )}
      </div>

      {filtered.length === 0 ? (
        <Panel className="flex flex-col items-center gap-3 px-6 py-14 text-center">
          <Waves size={40} strokeWidth={1.5} style={{ color: C.seaFaint }} aria-hidden="true" />
          <h3 className="text-[20px] font-semibold" style={{ ...geist, color: C.ivory }}>
            Geen baken in zicht
          </h3>
          <p className="max-w-xs text-[13px]" style={{ ...geist, color: C.sea }}>
            Geen peiling voor &ldquo;{query}&rdquo;. Verleg je koers met een andere zoekterm.
          </p>
          <button
            onClick={() => setQuery("")}
            className={`mt-1 rounded-md px-5 py-2 text-[13px] font-semibold ${RING}`}
            style={{ ...geist, background: C.brass, color: C.bg }}
          >
            Filter wissen
          </button>
        </Panel>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {filtered.map((o) => {
            const isSaved = saved.has(o.id);
            return (
              <Panel
                key={o.id}
                className="flex h-full flex-col overflow-hidden transition-transform hover:-translate-y-0.5"
              >
                <div
                  className="flex items-center justify-between gap-2 px-4 py-3"
                  style={{ borderBottom: `1px solid ${C.lineSoft}`, background: C.panelSoft }}
                >
                  <BearingGauge value={o.match} size={58} />
                  <button
                    onClick={() => toggleSave(o.id)}
                    aria-pressed={isSaved}
                    aria-label={isSaved ? "Haal van kaart" : "Zet baken op kaart"}
                    className={`flex h-8 w-8 items-center justify-center rounded-md transition-colors ${RING}`}
                    style={{
                      background: isSaved ? C.brassSoft : "transparent",
                      color: isSaved ? C.brass : C.seaDim,
                      border: `1px solid ${isSaved ? C.brass : C.line}`,
                    }}
                  >
                    {isSaved ? (
                      <BookmarkCheck size={15} strokeWidth={2.2} aria-hidden="true" />
                    ) : (
                      <Bookmark size={15} strokeWidth={2.2} aria-hidden="true" />
                    )}
                  </button>
                </div>
                <div className="flex flex-1 flex-col p-4">
                  <span
                    className="text-[9.5px] font-semibold uppercase tracking-[0.16em]"
                    style={{ ...mono, color: C.seaFaint }}
                  >
                    {o.id}
                  </span>
                  <h3
                    className="mt-1 text-[16px] font-semibold leading-tight"
                    style={{ ...geist, color: C.ivory }}
                  >
                    {o.titel}
                  </h3>
                  <div className="mt-0.5 text-[13px]" style={{ ...geist, color: C.sea }}>
                    {o.opdrachtgever}
                  </div>
                  <dl
                    className="mt-3 grid grid-cols-2 gap-x-3 gap-y-2 text-[12px]"
                    style={{ ...geist, color: C.parchment }}
                  >
                    <div className="flex items-center gap-1.5">
                      <MapPin
                        size={13}
                        strokeWidth={2}
                        style={{ color: C.seaDim }}
                        aria-hidden="true"
                      />
                      {o.plaats}
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Wallet
                        size={13}
                        strokeWidth={2}
                        style={{ color: C.seaDim }}
                        aria-hidden="true"
                      />
                      {o.tarief}
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Clock
                        size={13}
                        strokeWidth={2}
                        style={{ color: C.seaDim }}
                        aria-hidden="true"
                      />
                      {o.uren}
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Calendar
                        size={13}
                        strokeWidth={2}
                        style={{ color: C.seaDim }}
                        aria-hidden="true"
                      />
                      {o.start}
                    </div>
                  </dl>
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {o.tags.map((t) => (
                      <span
                        key={t}
                        className="rounded-full px-2.5 py-0.5 text-[10.5px]"
                        style={{
                          ...geist,
                          color: C.parchment,
                          background: C.brassSoft,
                          border: `1px solid ${C.lineSoft}`,
                        }}
                      >
                        {t}
                      </span>
                    ))}
                  </div>
                  {o.redenen.plus[0] && (
                    <div
                      className="mt-3 flex items-start gap-1.5 text-[12px]"
                      style={{ ...geist, color: C.sea }}
                    >
                      <Check
                        size={13}
                        strokeWidth={2.4}
                        className="mt-0.5 shrink-0"
                        style={{ color: C.verified }}
                        aria-hidden="true"
                      />
                      {o.redenen.plus[0]}
                    </div>
                  )}
                  <button
                    onClick={() => onOpen(o)}
                    className={`group mt-4 inline-flex items-center justify-center gap-1.5 rounded-md py-2.5 text-[13px] font-semibold transition-colors ${RING}`}
                    style={{ ...geist, background: C.brass, color: C.bg }}
                  >
                    Zet koers
                    <ArrowRight
                      size={14}
                      strokeWidth={2.2}
                      className="transition-transform group-hover:translate-x-1"
                      aria-hidden="true"
                    />
                  </button>
                </div>
              </Panel>
            );
          })}
        </div>
      )}
    </div>
  );
}

function OpdrachtDetail({
  opdracht,
  saved,
  toggleSave,
  onBack,
}: {
  opdracht: Opdracht;
  saved: Set<string>;
  toggleSave: (id: string) => void;
  onBack: () => void;
}) {
  const [applied, setApplied] = useState(false);
  const isSaved = saved.has(opdracht.id);
  return (
    <div>
      <button
        onClick={onBack}
        className={`mb-5 inline-flex items-center gap-1.5 rounded-md px-4 py-1.5 text-[12px] font-semibold ${RING}`}
        style={{ ...geist, color: C.parchment, background: C.panel, border: `1px solid ${C.line}` }}
      >
        <ArrowLeft size={14} strokeWidth={2.2} aria-hidden="true" />
        Terug naar het vaargebied
      </button>

      <Panel className="overflow-hidden">
        <div
          className="flex flex-wrap items-center justify-between gap-4 px-6 py-5"
          style={{ borderBottom: `1px solid ${C.lineSoft}`, background: C.panelSoft }}
        >
          <div className="flex items-center gap-4">
            <BearingGauge value={opdracht.match} size={84} />
            <div>
              <span
                className="text-[10px] font-semibold uppercase tracking-[0.16em]"
                style={{ ...mono, color: C.seaDim }}
              >
                {opdracht.id}
              </span>
              <h2
                className="text-[23px] font-semibold leading-tight tracking-tight"
                style={{ ...geist, color: C.ivory }}
              >
                {opdracht.titel}
              </h2>
              <div className="mt-1 text-[14px]" style={{ ...geist, color: C.sea }}>
                {opdracht.opdrachtgever} · {opdracht.plaats}
              </div>
            </div>
          </div>
          <button
            onClick={() => toggleSave(opdracht.id)}
            aria-pressed={isSaved}
            className={`inline-flex items-center gap-1.5 rounded-md px-4 py-2 text-[12px] font-semibold ${RING}`}
            style={{
              ...geist,
              color: isSaved ? C.brass : C.parchment,
              background: isSaved ? C.brassSoft : C.panel,
              border: `1px solid ${isSaved ? C.brass : C.line}`,
            }}
          >
            {isSaved ? (
              <BookmarkCheck size={14} strokeWidth={2.2} aria-hidden="true" />
            ) : (
              <Bookmark size={14} strokeWidth={2.2} aria-hidden="true" />
            )}
            {isSaved ? "Op kaart" : "Zet op kaart"}
          </button>
        </div>
        <div className="grid grid-cols-2 gap-2.5 p-6 sm:grid-cols-4">
          {[
            { Icon: Wallet, label: "Tarief", value: opdracht.tarief },
            { Icon: Clock, label: "Inzet", value: opdracht.uren },
            { Icon: Calendar, label: "Start", value: opdracht.start },
            { Icon: MapPin, label: "Haven", value: opdracht.plaats },
          ].map((m) => (
            <div
              key={m.label}
              className="rounded-lg p-3"
              style={{ background: C.panelSoft, border: `1px solid ${C.lineSoft}` }}
            >
              <m.Icon size={14} strokeWidth={2} style={{ color: C.brass }} aria-hidden="true" />
              <div
                className="mt-1.5 text-[10px] font-semibold uppercase tracking-[0.1em]"
                style={{ ...geist, color: C.seaDim }}
              >
                {m.label}
              </div>
              <div className="text-[14px] font-semibold" style={{ ...geist, color: C.ivory }}>
                {m.value}
              </div>
            </div>
          ))}
        </div>
      </Panel>

      <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
        <Panel className="overflow-hidden">
          <div
            className="flex items-center gap-2 px-5 py-3.5"
            style={{ borderBottom: `1px solid ${C.lineSoft}` }}
          >
            <span
              className="flex h-6 w-6 items-center justify-center rounded-md"
              style={{ background: C.verifiedSoft, color: C.verified }}
              aria-hidden="true"
            >
              <Plus size={13} strokeWidth={2.6} />
            </span>
            <span className="text-[14px] font-semibold" style={{ ...geist, color: C.ivory }}>
              Voor de wind
            </span>
          </div>
          <ul className="space-y-2.5 p-5">
            {opdracht.redenen.plus.map((r) => (
              <li
                key={r}
                className="flex items-start gap-2 text-[13px]"
                style={{ ...geist, color: C.parchment }}
              >
                <Check
                  size={15}
                  strokeWidth={2.6}
                  className="mt-0.5 shrink-0"
                  style={{ color: C.verified }}
                  aria-hidden="true"
                />
                {r}
              </li>
            ))}
          </ul>
        </Panel>
        <Panel className="overflow-hidden">
          <div
            className="flex items-center gap-2 px-5 py-3.5"
            style={{ borderBottom: `1px solid ${C.lineSoft}` }}
          >
            <span
              className="flex h-6 w-6 items-center justify-center rounded-md"
              style={{ background: C.expiringSoft, color: C.expiring }}
              aria-hidden="true"
            >
              <Minus size={13} strokeWidth={2.6} />
            </span>
            <span className="text-[14px] font-semibold" style={{ ...geist, color: C.ivory }}>
              Ondiepten
            </span>
          </div>
          <ul className="space-y-2.5 p-5">
            {opdracht.redenen.min.map((r) => (
              <li
                key={r}
                className="flex items-start gap-2 text-[13px]"
                style={{ ...geist, color: C.parchment }}
              >
                <TriangleAlert
                  size={15}
                  strokeWidth={2}
                  className="mt-0.5 shrink-0"
                  style={{ color: C.expiring }}
                  aria-hidden="true"
                />
                {r}
              </li>
            ))}
          </ul>
        </Panel>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-3">
        <button
          onClick={() => setApplied((v) => !v)}
          aria-pressed={applied}
          className={`inline-flex items-center gap-2 rounded-md px-6 py-3 text-[14px] font-semibold transition-colors ${RING}`}
          style={{ ...geist, background: applied ? C.verified : C.brass, color: C.bg }}
        >
          {applied ? (
            <Check size={17} strokeWidth={2.6} aria-hidden="true" />
          ) : (
            <Navigation size={16} strokeWidth={2.2} aria-hidden="true" />
          )}
          {applied ? "Koers gemeld" : "Meld je aan boord"}
        </button>
        {applied && (
          <span className="text-[12.5px]" style={{ ...geist, color: C.sea }}>
            De opdrachtgever peilt gemiddeld binnen 6 uur terug.
          </span>
        )}
      </div>
    </div>
  );
}

function Verificatie({
  checked,
  toggleCheck,
  feedState,
  setFeedState,
}: {
  checked: Set<string>;
  toggleCheck: (naam: string) => void;
  feedState: "ok" | "loading" | "error";
  setFeedState: (s: "ok" | "loading" | "error") => void;
}) {
  const order: CredStatus[] = ["VERIFIED", "SUBMITTED", "EXPIRING", "REJECTED"];
  return (
    <div>
      <ScreenHead
        screenKey="verificatie"
        title="Scheepspapieren"
        sub="Elke status vaart onder eigen vlag — herkenbaar aan icoon, label én kleur, nooit kleur alleen."
      />

      {/* Legend: the four verification flags */}
      <div className="mb-6 grid grid-cols-2 gap-2.5 sm:grid-cols-4">
        {order.map((s) => {
          const m = statusMeta(s);
          return (
            <Panel key={s} className="flex items-center gap-2 p-3">
              <span
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md"
                style={{ background: m.soft, color: m.tone, border: `1px solid ${m.tone}44` }}
                aria-hidden="true"
              >
                <m.Icon size={16} strokeWidth={2.2} />
              </span>
              <span className="text-[12px] font-semibold" style={{ ...geist, color: C.ivory }}>
                {m.label}
              </span>
            </Panel>
          );
        })}
      </div>

      <Panel className="mb-6 overflow-hidden">
        <div className="flex items-center gap-4 p-5">
          <span
            className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg"
            style={{
              background: C.verifiedSoft,
              color: C.verified,
              border: `1px solid ${C.verified}44`,
            }}
            aria-hidden="true"
          >
            <ShieldCheck size={24} strokeWidth={2} />
          </span>
          <div>
            <div className="text-[15px] font-semibold" style={{ ...geist, color: C.ivory }}>
              {PROFIEL.trust}
            </div>
            <p className="mt-0.5 text-[13px]" style={{ ...geist, color: C.sea }}>
              Je papieren liggen versleuteld in het ruim en gaan alleen mee aan wal met jouw
              toestemming.
            </p>
          </div>
        </div>
      </Panel>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="space-y-2.5 lg:col-span-2">
          {CREDENTIALS.map((c) => {
            const done = checked.has(c.naam);
            const m = statusMeta(c.status);
            return (
              <Panel key={c.naam} className="flex items-center gap-3 overflow-hidden">
                <span
                  className="w-1.5 self-stretch"
                  style={{ background: m.tone }}
                  aria-hidden="true"
                />
                <button
                  onClick={() => toggleCheck(c.naam)}
                  aria-pressed={done}
                  aria-label={done ? `${c.naam} afgevinkt` : `Vink ${c.naam} af`}
                  className={`my-3 flex h-7 w-7 shrink-0 items-center justify-center rounded-md transition-colors ${RING}`}
                  style={{
                    border: `1.5px solid ${done ? C.brass : C.line}`,
                    background: done ? C.brass : "transparent",
                    color: C.bg,
                  }}
                >
                  {done && <Check size={15} strokeWidth={2.6} aria-hidden="true" />}
                </button>
                <div className="min-w-0 flex-1 py-3">
                  <div className="text-[14px] font-semibold" style={{ ...geist, color: C.ivory }}>
                    {c.naam}
                  </div>
                  <div className="text-[12px]" style={{ ...geist, color: C.sea }}>
                    {c.detail}
                  </div>
                </div>
                <div className="pr-4">
                  <StatusBadge status={c.status} />
                </div>
              </Panel>
            );
          })}
        </div>

        <div>
          <div className="mb-3 flex items-center justify-between">
            <span
              className="inline-flex items-center gap-2 text-[15px] font-semibold"
              style={{ ...geist, color: C.ivory }}
            >
              <FileText size={16} strokeWidth={2} style={{ color: C.brass }} aria-hidden="true" />
              Documentenruim
            </span>
            <button
              onClick={() => setFeedState(feedState === "loading" ? "ok" : "loading")}
              className={`flex h-8 w-8 items-center justify-center rounded-md ${RING}`}
              style={{ background: C.panel, color: C.brass, border: `1px solid ${C.line}` }}
              aria-label="Vernieuw documentenruim"
            >
              <RefreshCw size={14} strokeWidth={2} aria-hidden="true" />
            </button>
          </div>

          <div className="mb-3 flex gap-1.5" role="tablist" aria-label="Weergave documentenruim">
            {(["ok", "loading", "error"] as const).map((s) => (
              <button
                key={s}
                role="tab"
                aria-selected={feedState === s}
                onClick={() => setFeedState(s)}
                className={`rounded-md px-3 py-1 text-[11px] font-semibold ${RING}`}
                style={{
                  ...geist,
                  color: feedState === s ? C.bg : C.sea,
                  background: feedState === s ? C.brass : C.panel,
                  border: `1px solid ${feedState === s ? C.brass : C.line}`,
                }}
              >
                {s === "ok" ? "Aan boord" : s === "loading" ? "Laden" : "Storing"}
              </button>
            ))}
          </div>

          {feedState === "loading" && (
            <ul className="space-y-2" aria-busy="true" aria-label="Documenten laden">
              {[0, 1, 2, 3].map((i) => (
                <Panel key={i} className="p-3.5">
                  <div
                    className="h-3 w-2/3 animate-pulse rounded"
                    style={{ background: C.raise }}
                  />
                  <div
                    className="mt-2 h-2.5 w-1/3 animate-pulse rounded"
                    style={{ background: C.raise }}
                  />
                </Panel>
              ))}
            </ul>
          )}

          {feedState === "error" && (
            <Panel className="flex flex-col items-center gap-2 px-4 py-8 text-center">
              <span
                className="flex h-12 w-12 items-center justify-center rounded-lg"
                style={{ background: C.rejectedSoft, color: C.rejected }}
                aria-hidden="true"
              >
                <CircleAlert size={24} strokeWidth={2} />
              </span>
              <div className="text-[15px] font-semibold" style={{ ...geist, color: C.ivory }}>
                Storing in de verbinding
              </div>
              <p className="text-[12px]" style={{ ...geist, color: C.sea }}>
                We konden het documentenruim niet bereiken. Probeer het zo opnieuw.
              </p>
              <button
                onClick={() => setFeedState("ok")}
                className={`mt-1 rounded-md px-4 py-2 text-[12px] font-semibold ${RING}`}
                style={{ ...geist, background: C.brass, color: C.bg }}
              >
                Opnieuw peilen
              </button>
            </Panel>
          )}

          {feedState === "ok" && (
            <ul className="space-y-2">
              {DOCUMENTEN.map((d) => {
                const m = statusMeta(d.status);
                return (
                  <Panel key={d.naam} className="flex items-center gap-3 p-3">
                    <span
                      className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md text-[9px] font-bold"
                      style={{
                        ...mono,
                        background: C.panelSoft,
                        color: C.brass,
                        border: `1px solid ${C.line}`,
                      }}
                      aria-hidden="true"
                    >
                      {d.type}
                    </span>
                    <div className="min-w-0 flex-1">
                      <div
                        className="truncate text-[12.5px] font-semibold"
                        style={{ ...geist, color: C.ivory }}
                      >
                        {d.naam}
                      </div>
                      <div
                        className="text-[11px] tabular-nums"
                        style={{ ...mono, color: C.seaDim }}
                      >
                        {d.grootte} · {d.bijgewerkt}
                      </div>
                    </div>
                    <span
                      className="flex h-7 w-7 items-center justify-center rounded-md"
                      style={{ background: m.soft, color: m.tone, border: `1px solid ${m.tone}44` }}
                      aria-label={m.label}
                      title={m.label}
                    >
                      <m.Icon size={14} strokeWidth={2.2} aria-hidden="true" />
                    </span>
                  </Panel>
                );
              })}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}

function Acties({ done, toggleDone }: { done: Set<string>; toggleDone: (t: string) => void }) {
  const openCount = ACTIES.filter((a) => !done.has(a.titel)).length;
  return (
    <div>
      <ScreenHead
        screenKey="acties"
        title="Wachtdienst"
        sub="Wat vandaag om aandacht vraagt aan boord."
      />

      {openCount === 0 ? (
        <Panel className="flex flex-col items-center gap-3 px-6 py-16 text-center">
          <Anchor size={40} strokeWidth={1.5} style={{ color: C.verified }} aria-hidden="true" />
          <h3 className="text-[20px] font-semibold" style={{ ...geist, color: C.ivory }}>
            Rustige zee
          </h3>
          <p className="max-w-xs text-[13px]" style={{ ...geist, color: C.sea }}>
            Niets meer op de wachtdienst vandaag. Koers vastgezet.
          </p>
        </Panel>
      ) : (
        <>
          <div
            className="mb-4 inline-flex items-center gap-2 rounded-full px-3.5 py-1.5"
            style={{ background: C.brassSoft, border: `1px solid ${C.line}` }}
          >
            <span
              className="flex h-6 w-6 items-center justify-center rounded-full text-[12px] font-bold tabular-nums"
              style={{ ...serif, background: C.brass, color: C.bg }}
              aria-hidden="true"
            >
              {openCount}
            </span>
            <span className="text-[12.5px] font-semibold" style={{ ...geist, color: C.brass }}>
              {openCount} {openCount === 1 ? "post" : "posten"} op de wacht
            </span>
          </div>

          <ul className="space-y-3">
            {ACTIES.map((a) => {
              const isDone = done.has(a.titel);
              const warn = a.urgentie === "warning";
              const tone = warn ? C.expiring : C.submitted;
              return (
                <Panel key={a.titel} className="flex items-stretch gap-0 overflow-hidden">
                  <span
                    className="w-1.5 shrink-0"
                    style={{ background: isDone ? C.verified : tone }}
                    aria-hidden="true"
                  />
                  <div className="flex flex-1 items-start gap-4 p-5">
                    <button
                      onClick={() => toggleDone(a.titel)}
                      aria-pressed={isDone}
                      aria-label={
                        isDone ? `${a.titel} afgerond` : `Markeer ${a.titel} als afgerond`
                      }
                      className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-md transition-colors ${RING}`}
                      style={{
                        border: `1.5px solid ${isDone ? C.verified : C.line}`,
                        background: isDone ? C.verified : "transparent",
                        color: C.bg,
                      }}
                    >
                      {isDone && <Check size={16} strokeWidth={2.6} aria-hidden="true" />}
                    </button>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span
                          className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[9.5px] font-semibold uppercase tracking-[0.12em]"
                          style={{
                            ...geist,
                            color: tone,
                            background: warn ? C.expiringSoft : C.submittedSoft,
                          }}
                        >
                          {warn ? (
                            <TriangleAlert size={10} strokeWidth={2.4} aria-hidden="true" />
                          ) : (
                            <LifeBuoy size={10} strokeWidth={2.4} aria-hidden="true" />
                          )}
                          {warn ? "Waarschuwing" : "Bericht"}
                        </span>
                      </div>
                      <div
                        className="mt-1.5 text-[15px] font-semibold leading-snug"
                        style={{
                          ...geist,
                          color: C.ivory,
                          textDecoration: isDone ? "line-through" : "none",
                          opacity: isDone ? 0.55 : 1,
                        }}
                      >
                        {a.titel}
                      </div>
                      <p
                        className="mt-1 text-[12.5px]"
                        style={{ ...geist, color: C.sea, opacity: isDone ? 0.55 : 1 }}
                      >
                        {a.detail}
                      </p>
                      {!isDone && (
                        <button
                          onClick={() => toggleDone(a.titel)}
                          className={`mt-2.5 inline-flex items-center gap-1 rounded-md px-3 py-1.5 text-[12px] font-semibold transition-colors ${RING}`}
                          style={{
                            ...geist,
                            color: tone,
                            background: warn ? C.expiringSoft : C.submittedSoft,
                          }}
                        >
                          {a.cta}
                          <ArrowRight size={12} strokeWidth={2.2} aria-hidden="true" />
                        </button>
                      )}
                    </div>
                  </div>
                </Panel>
              );
            })}
          </ul>
        </>
      )}
    </div>
  );
}

function Facturen() {
  const trend = [24.8, 13.5, 30.72, 8.8];
  const statusMetaFac = (status: string): { tone: string; soft: string; Icon: LucideIcon } =>
    status === "Betaald"
      ? { tone: C.verified, soft: C.verifiedSoft, Icon: Check }
      : status === "Openstaand"
        ? { tone: C.expiring, soft: C.expiringSoft, Icon: Clock }
        : { tone: C.sea, soft: C.brassSoft, Icon: FileText };
  return (
    <div>
      <ScreenHead
        screenKey="facturen"
        title="Scheepskas"
        sub="Overzichtelijk en zonder gedoe — zodat je weet waar je aan toe bent."
      />

      <div className="mb-6 grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3 lg:col-span-2">
          {[
            { label: "Betaald (mnd)", value: "€ 5.552", tone: C.verified },
            { label: "Openstaand", value: "€ 1.350", tone: C.expiring },
            { label: "Concept", value: "€ 880", tone: C.sea },
          ].map((s) => (
            <Panel key={s.label} className="overflow-hidden">
              <div className="h-1" style={{ background: s.tone }} aria-hidden="true" />
              <div className="p-4">
                <div
                  className="text-[10px] font-semibold uppercase tracking-[0.1em]"
                  style={{ ...geist, color: C.seaDim }}
                >
                  {s.label}
                </div>
                <div
                  className="mt-1.5 text-[24px] font-semibold tabular-nums"
                  style={{ ...serif, color: s.tone }}
                >
                  {s.value}
                </div>
              </div>
            </Panel>
          ))}
        </div>
        <Panel className="flex flex-col justify-between p-4">
          <div
            className="text-[10px] font-semibold uppercase tracking-[0.1em]"
            style={{ ...geist, color: C.seaDim }}
          >
            Bedrag per factuur
          </div>
          <Sparkline data={trend} tone={C.brass} height={46} />
        </Panel>
      </div>

      <Panel className="overflow-hidden p-2">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[560px] text-left">
            <thead>
              <tr style={{ borderBottom: `1px solid ${C.line}` }}>
                {["Factuur", "Klant", "Datum", "Bedrag", "Status"].map((h) => (
                  <th
                    key={h}
                    scope="col"
                    className="px-3 py-2.5 text-[10px] font-semibold uppercase tracking-[0.1em]"
                    style={{ ...geist, color: C.seaDim }}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {FACTUREN.map((f) => {
                const m = statusMetaFac(f.status);
                return (
                  <tr
                    key={f.nr}
                    className="transition-colors hover:bg-[#164046]"
                    style={{ borderBottom: `1px solid ${C.lineSoft}` }}
                  >
                    <td
                      className="px-3 py-3 text-[12.5px] font-semibold tabular-nums"
                      style={{ ...mono, color: C.parchment }}
                    >
                      {f.nr}
                    </td>
                    <td className="px-3 py-3 text-[13px]" style={{ ...geist, color: C.ivory }}>
                      {f.klant}
                    </td>
                    <td
                      className="px-3 py-3 text-[12.5px] tabular-nums"
                      style={{ ...mono, color: C.seaDim }}
                    >
                      {f.datum}
                    </td>
                    <td
                      className="px-3 py-3 text-[14px] font-semibold tabular-nums"
                      style={{ ...serif, color: C.ivory }}
                    >
                      {f.bedrag}
                    </td>
                    <td className="px-3 py-3">
                      <span
                        className="inline-flex items-center gap-1.5 rounded-full py-1 pl-1.5 pr-2.5 text-[11px] font-semibold"
                        style={{
                          ...geist,
                          color: m.tone,
                          background: m.soft,
                          border: `1px solid ${m.tone}44`,
                        }}
                      >
                        <m.Icon size={12} strokeWidth={2.4} aria-hidden="true" />
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

// ---- Shell ------------------------------------------------------------------

export function Concept272() {
  const [screen, setScreen] = useState<ScreenKey>("dashboard");
  const [query, setQuery] = useState("");
  const [saved, setSaved] = useState<Set<string>>(new Set(["OPD-2041"]));
  const [checked, setChecked] = useState<Set<string>>(new Set());
  const [done, setDone] = useState<Set<string>>(new Set());
  const [feedState, setFeedState] = useState<"ok" | "loading" | "error">("ok");
  const [active, setActive] = useState<Opdracht>(OPDRACHTEN[0] as Opdracht);

  const toggleSet = (s: Set<string>, key: string): Set<string> => {
    const n = new Set(s);
    if (n.has(key)) n.delete(key);
    else n.add(key);
    return n;
  };

  return (
    <div
      className="min-h-[680px] w-full antialiased"
      style={{ ...geist, color: C.ivory, background: C.bg }}
    >
      <div className="lg:flex">
        {/* Left rail — nav rendered along the compass, brass on deep teal */}
        <aside
          className="relative shrink-0 lg:min-h-[680px] lg:w-[248px]"
          style={{ background: C.bg2, borderRight: `1px solid ${C.line}` }}
        >
          <div
            className="flex items-center gap-3 px-5 py-5"
            style={{ borderBottom: `1px solid ${C.lineSoft}` }}
          >
            <CompassGlyph size={40} />
            <div className="leading-tight">
              <div
                className="text-[17px] font-semibold tracking-tight"
                style={{ ...serif, color: C.ivory }}
              >
                Windroos
              </div>
              <div
                className="text-[9.5px] font-semibold uppercase tracking-[0.2em]"
                style={{ ...mono, color: C.seaDim }}
              >
                ZZP platform
              </div>
            </div>
          </div>

          <nav
            className="flex gap-1.5 overflow-x-auto px-3 py-3 lg:flex-col lg:overflow-visible"
            aria-label="Hoofdnavigatie"
          >
            {SCREENS.map((s) => {
              const on = s.key === screen;
              const Icon = NAV_ICONS[s.key];
              const b = SCREEN_BEARING[s.key];
              return (
                <button
                  key={s.key}
                  onClick={() => setScreen(s.key)}
                  aria-current={on ? "page" : undefined}
                  className={`inline-flex shrink-0 items-center gap-2.5 rounded-lg px-3 py-2.5 text-left text-[13px] font-semibold transition-colors lg:w-full ${RING}`}
                  style={{
                    ...geist,
                    color: on ? C.bg : C.parchment,
                    background: on ? C.brass : "transparent",
                    border: `1px solid ${on ? C.brass : "transparent"}`,
                  }}
                >
                  <Icon size={16} strokeWidth={2} aria-hidden="true" />
                  <span className="flex-1">{s.label}</span>
                  <span
                    className="hidden text-[9.5px] font-semibold tabular-nums tracking-[0.08em] lg:inline"
                    style={{ ...mono, color: on ? C.bg : C.seaFaint }}
                  >
                    {b.peiling}
                  </span>
                </button>
              );
            })}
          </nav>

          <div className="hidden px-4 py-4 lg:block">
            <div
              className="flex items-center gap-3 rounded-lg p-3"
              style={{ background: C.panel, border: `1px solid ${C.line}` }}
            >
              <span
                className="flex h-10 w-10 items-center justify-center rounded-full text-[12px] font-bold"
                style={{ ...serif, background: C.brass, color: C.bg }}
                aria-hidden="true"
              >
                {PROFIEL.initialen}
              </span>
              <div className="min-w-0 leading-tight">
                <div
                  className="truncate text-[12.5px] font-semibold"
                  style={{ ...geist, color: C.ivory }}
                >
                  {PROFIEL.naam}
                </div>
                <div
                  className="inline-flex items-center gap-1 text-[10.5px]"
                  style={{ ...geist, color: C.verified }}
                >
                  <BadgeCheck size={11} strokeWidth={2} aria-hidden="true" />
                  {PROFIEL.trust}
                </div>
              </div>
            </div>
          </div>
        </aside>

        {/* Main chart area */}
        <div className="relative min-w-0 flex-1 overflow-hidden">
          <ChartBackdrop />
          <div className="relative mx-auto max-w-5xl px-4 py-6 sm:px-8 sm:py-8">
            <header className="mb-6 flex items-center justify-between gap-4">
              <div
                className="inline-flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.16em]"
                style={{ ...mono, color: C.seaDim }}
              >
                <Compass size={13} strokeWidth={2} style={{ color: C.brass }} aria-hidden="true" />
                Koers · {SCREEN_BEARING[screen].peiling} {SCREEN_BEARING[screen].kwadrant}
              </div>
              <div className="flex items-center gap-2 lg:hidden">
                <span
                  className="flex h-9 w-9 items-center justify-center rounded-full text-[12px] font-bold"
                  style={{ ...serif, background: C.brass, color: C.bg }}
                  aria-hidden="true"
                >
                  {PROFIEL.initialen}
                </span>
              </div>
            </header>

            <main className="pb-6">
              {screen === "dashboard" && (
                <Dashboard onSelect={setScreen} onOpen={() => setScreen("opdracht")} />
              )}
              {screen === "marktplaats" && (
                <Marktplaats
                  query={query}
                  setQuery={setQuery}
                  saved={saved}
                  toggleSave={(id) => setSaved((s) => toggleSet(s, id))}
                  onOpen={(o) => {
                    setActive(o);
                    setScreen("opdracht");
                  }}
                />
              )}
              {screen === "opdracht" && (
                <OpdrachtDetail
                  opdracht={active}
                  saved={saved}
                  toggleSave={(id) => setSaved((s) => toggleSet(s, id))}
                  onBack={() => setScreen("marktplaats")}
                />
              )}
              {screen === "verificatie" && (
                <Verificatie
                  checked={checked}
                  toggleCheck={(naam) => setChecked((s) => toggleSet(s, naam))}
                  feedState={feedState}
                  setFeedState={setFeedState}
                />
              )}
              {screen === "acties" && (
                <Acties done={done} toggleDone={(t) => setDone((s) => toggleSet(s, t))} />
              )}
              {screen === "facturen" && <Facturen />}
            </main>

            <footer
              className="mt-6 flex flex-wrap items-center justify-between gap-2 border-t pt-4 text-[11px]"
              style={{ ...mono, borderColor: C.line, color: C.seaDim }}
            >
              <span className="inline-flex items-center gap-1.5">
                <Compass size={12} strokeWidth={2} style={{ color: C.brass }} aria-hidden="true" />
                {SCREENS.length} bestemmingen · windroos v272
              </span>
              <span>Altijd koersvast</span>
            </footer>
          </div>
        </div>
      </div>
    </div>
  );
}
