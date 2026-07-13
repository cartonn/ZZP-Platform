"use client";

// Concept 295 — "Echolood" · onderzeese sonar / spectrogram-waterval (donker).
// Signature: diep-marineblauw naar zwart, fosfor-groene/cyaan blips en peilstralen. De hoofd-
// datavisualisatie is een spectrogram-WATERVAL (frequentie x tijd, intensiteit als fosforgloed) —
// bewust anders dan een gewone radar. Concentrische sweep-ringen dienen als klein peilkompas;
// verder een diepte-peilprofiel en een akoestische golfvorm. Dunne raster-hairlines, monospace
// data-labels, rustig-technisch. Contrast bewaakt: leesbare tekst op donker.
// Fonts: --font-lab-geist (tekst) + --font-lab-spline-mono (data/labels).

import { useState, useMemo, type CSSProperties, type ReactNode } from "react";
import {
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
  Hourglass,
  Bookmark,
  BookmarkCheck,
  Radar,
  Waves,
  Anchor,
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

// Sonar-palet: diepzee-donker + fosfor-signaalkleuren.
const C = {
  abyss: "#050d14",
  hull: "#0a1622",
  panel: "#0e1e2c",
  panelHi: "#132836",
  line: "#1c3446",
  lineSoft: "#12212e",
  grid: "#122a3a",
  fg: "#cfe6e2",
  fgSoft: "#7fa3a8",
  muted: "#557079",
  phosphor: "#5ff2c8",
  cyan: "#48c9e6",
  amber: "#f5b545",
  red: "#ff5d6c",
};

const sans = { fontFamily: "var(--font-lab-geist), system-ui, sans-serif" };
const mono = {
  fontFamily: "var(--font-lab-spline-mono), var(--font-lab-mono), ui-monospace, monospace",
};

const RING =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5ff2c8] focus-visible:ring-offset-2 focus-visible:ring-offset-[#050d14]";

const SCREEN_INDEX: Record<ScreenKey, string> = {
  dashboard: "01",
  marktplaats: "02",
  opdracht: "03",
  verificatie: "04",
  acties: "05",
  facturen: "06",
  documenten: "07",
  berichten: "08",
};

// ---- Primitives -------------------------------------------------------------

// Dun raster-hairline op de achtergrond van een paneel — het "peilscherm".
function GridOverlay({ className, style }: { className?: string; style?: CSSProperties }) {
  return (
    <div
      aria-hidden="true"
      className={className}
      style={{
        backgroundImage: `linear-gradient(${C.grid} 1px, transparent 1px), linear-gradient(90deg, ${C.grid} 1px, transparent 1px)`,
        backgroundSize: "26px 26px",
        ...style,
      }}
    />
  );
}

function Mono({
  children,
  className,
  color = C.fgSoft,
  style,
}: {
  children: ReactNode;
  className?: string;
  color?: string;
  style?: CSSProperties;
}) {
  return (
    <span
      className={`text-[10.5px] uppercase tracking-[0.24em] ${className ?? ""}`}
      style={{ ...mono, color, ...style }}
    >
      {children}
    </span>
  );
}

type StatusVisual = { label: string; Icon: LucideIcon; color: string };

function statusVisual(s: CredStatus): StatusVisual {
  switch (s) {
    case "VERIFIED":
      return { label: "Geverifieerd", Icon: BadgeCheck, color: C.phosphor };
    case "SUBMITTED":
      return { label: "In beoordeling", Icon: Hourglass, color: C.cyan };
    case "EXPIRING":
      return { label: "Verloopt bijna", Icon: TriangleAlert, color: C.amber };
    case "REJECTED":
      return { label: "Afgewezen", Icon: XCircle, color: C.red };
  }
}

// Statusbadge: getinte gloed + gekleurde omtrek + icoon + label (nooit alleen kleur).
function StatusChip({ status, big = false }: { status: CredStatus; big?: boolean }) {
  const { label, Icon, color } = statusVisual(status);
  return (
    <span
      className={`inline-flex items-center gap-1.5 font-semibold uppercase tracking-[0.08em] ${
        big ? "px-3 py-1.5 text-[12px]" : "px-2.5 py-1 text-[11px]"
      }`}
      style={{
        ...mono,
        color,
        background: `${color}14`,
        border: `1px solid ${color}66`,
        borderRadius: 2,
      }}
    >
      <Icon size={big ? 14 : 12} strokeWidth={2.2} aria-hidden="true" />
      {label}
    </span>
  );
}

function MatchReadout({ value, size = "md" }: { value: number; size?: "sm" | "md" }) {
  const high = value >= 90;
  const tone = high ? C.phosphor : C.cyan;
  return (
    <span
      className="inline-flex items-center gap-2"
      aria-label={`Match ${value} procent`}
      style={{
        background: `${tone}12`,
        border: `1px solid ${tone}55`,
        borderRadius: 3,
        padding: size === "sm" ? "3px 8px" : "5px 10px",
      }}
    >
      <span
        className={`tabular-nums leading-none ${size === "sm" ? "text-[22px]" : "text-[30px]"}`}
        style={{ ...mono, color: tone, textShadow: `0 0 12px ${tone}77` }}
      >
        {value}
      </span>
      <span
        className="text-[8px] uppercase leading-tight tracking-[0.14em]"
        style={{ ...mono, color: C.muted }}
      >
        %<br />
        echo
      </span>
    </span>
  );
}

// Spectrogram-waterval: frequentie (kolommen) x tijd (rijen), intensiteit als fosforgloed.
// Deterministisch gegenereerd uit een seed zodat er geen willekeur per render is.
function Spectrogram({
  seed,
  cols = 24,
  rows = 9,
  tone = C.phosphor,
  className,
}: {
  seed: number[];
  cols?: number;
  rows?: number;
  tone?: string;
  className?: string;
}) {
  const cells = useMemo(() => {
    const base = seed.length ? seed : [1];
    const out: number[][] = [];
    for (let r = 0; r < rows; r++) {
      const row: number[] = [];
      for (let c = 0; c < cols; c++) {
        const b = base[c % base.length] as number;
        // Golfvormige intensiteit + demping over de diepte (rij). Vast, geen Math.random.
        const wave = 0.5 + 0.5 * Math.sin((c / cols) * Math.PI * 2 + r * 0.6 + b);
        const decay = 1 - r / (rows + 2);
        const v = Math.max(0, Math.min(1, wave * decay * (0.55 + (b % 5) / 8)));
        row.push(v);
      }
      out.push(row);
    }
    return out;
  }, [seed, cols, rows]);

  return (
    <div className={className} aria-hidden="true">
      <div className="flex flex-col gap-[2px]">
        {cells.map((row, r) => (
          <div key={r} className="flex gap-[2px]">
            {row.map((v, c) => (
              <div
                key={c}
                className="h-2.5 flex-1"
                style={{
                  background: v < 0.06 ? C.hull : tone,
                  opacity: v < 0.06 ? 1 : 0.16 + v * 0.84,
                  borderRadius: 1,
                }}
              />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

// Peilkompas: concentrische ringen + peilstralen + één sweep-gradient. Klein, ondersteunend.
function SweepDial({ value, size = 132 }: { value: number; size?: number }) {
  const cx = 50;
  const cy = 50;
  const rings = [16, 30, 44];
  const bearings = [0, 45, 90, 135, 180, 225, 270, 315];
  const angle = (value / 100) * 360 - 90;
  const rad = (angle * Math.PI) / 180;
  const bx = cx + 44 * Math.cos(rad);
  const by = cy + 44 * Math.sin(rad);
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      role="img"
      aria-label={`Peilkompas, echo ${value} procent`}
    >
      <defs>
        <radialGradient id="sweepGlow" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor={C.phosphor} stopOpacity="0.18" />
          <stop offset="70%" stopColor={C.phosphor} stopOpacity="0.03" />
          <stop offset="100%" stopColor={C.phosphor} stopOpacity="0" />
        </radialGradient>
      </defs>
      <circle cx={cx} cy={cy} r={46} fill={C.abyss} stroke={C.line} strokeWidth={0.6} />
      <circle cx={cx} cy={cy} r={46} fill="url(#sweepGlow)" />
      {rings.map((r) => (
        <circle key={r} cx={cx} cy={cy} r={r} fill="none" stroke={C.line} strokeWidth={0.5} />
      ))}
      {bearings.map((b) => {
        const rr = (b * Math.PI) / 180;
        return (
          <line
            key={b}
            x1={cx}
            y1={cy}
            x2={cx + 46 * Math.cos(rr)}
            y2={cy + 46 * Math.sin(rr)}
            stroke={C.line}
            strokeWidth={0.4}
          />
        );
      })}
      {/* sweep-straal naar de blip */}
      <line x1={cx} y1={cy} x2={bx} y2={by} stroke={C.phosphor} strokeWidth={1} opacity={0.85} />
      <circle cx={bx} cy={by} r={2.6} fill={C.phosphor} />
      <circle
        cx={bx}
        cy={by}
        r={5}
        fill="none"
        stroke={C.phosphor}
        strokeWidth={0.6}
        opacity={0.5}
      />
      <circle cx={cx} cy={cy} r={1.6} fill={C.cyan} />
      <text
        x={cx}
        y={cy - 20}
        textAnchor="middle"
        style={{ ...mono }}
        fontSize="9"
        fill={C.phosphor}
      >
        {value}
      </text>
    </svg>
  );
}

// Akoestische golfvorm — sonar-ping als lijn.
function Waveform({
  data,
  color = C.phosphor,
  height = 34,
}: {
  data: number[];
  color?: string;
  height?: number;
}) {
  const max = Math.max(...data);
  const min = Math.min(...data);
  const span = max - min || 1;
  const pts = data.map((v, i) => {
    const x = (i / (data.length - 1)) * 100;
    const y = 100 - ((v - min) / span) * 76 - 12;
    return [x, y] as const;
  });
  const line = pts.map(([x, y]) => `${x.toFixed(1)},${y.toFixed(1)}`).join(" ");
  return (
    <svg
      viewBox="0 0 100 100"
      preserveAspectRatio="none"
      className="w-full"
      style={{ height }}
      aria-hidden="true"
    >
      <line
        x1="0"
        y1="50"
        x2="100"
        y2="50"
        stroke={C.line}
        strokeWidth={0.5}
        vectorEffect="non-scaling-stroke"
      />
      <polyline
        points={line}
        fill="none"
        stroke={color}
        strokeWidth={1.6}
        strokeLinecap="round"
        strokeLinejoin="round"
        vectorEffect="non-scaling-stroke"
      />
      {pts.slice(-1).map(([x, y], i) => (
        <circle key={i} cx={x} cy={y} r={2} fill={color} />
      ))}
    </svg>
  );
}

// Diepte-peilprofiel: verticale schaal met echo-lijn die naar de diepte zakt.
function DepthProfile({ data, height = 60 }: { data: number[]; height?: number }) {
  const max = Math.max(...data) || 1;
  return (
    <div className="relative w-full" style={{ height }} aria-hidden="true">
      <div className="absolute inset-0 flex items-stretch gap-[3px]">
        {data.map((v, i) => {
          const d = (v / max) * 100;
          return (
            <div key={i} className="relative flex-1">
              <div className="absolute left-0 top-0 w-full" style={{ height: `${d}%` }}>
                <div
                  className="h-full w-full"
                  style={{
                    background: `linear-gradient(to bottom, ${C.phosphor}00, ${C.phosphor}44)`,
                    borderBottom: `2px solid ${C.phosphor}`,
                  }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// Primaire knop — fosfor-omtrek, gloed bij hover.
function GlowButton({
  children,
  onClick,
  className,
  ariaLabel,
  ariaPressed,
  tone = C.phosphor,
}: {
  children: ReactNode;
  onClick?: () => void;
  className?: string;
  ariaLabel?: string;
  ariaPressed?: boolean;
  tone?: string;
}) {
  const [hot, setHot] = useState(false);
  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHot(true)}
      onMouseLeave={() => setHot(false)}
      onFocus={() => setHot(true)}
      onBlur={() => setHot(false)}
      aria-label={ariaLabel}
      aria-pressed={ariaPressed}
      className={`inline-flex items-center justify-center gap-2 px-5 py-2.5 text-[12.5px] font-semibold uppercase tracking-[0.1em] transition-all duration-150 ${RING} ${className ?? ""}`}
      style={{
        ...mono,
        color: hot ? C.abyss : tone,
        background: hot ? tone : `${tone}12`,
        border: `1px solid ${tone}`,
        borderRadius: 3,
        boxShadow: hot ? `0 0 18px ${tone}77` : "none",
      }}
    >
      {children}
    </button>
  );
}

// Secundaire knop — dun paneel-omtrek.
function LineButton({
  children,
  onClick,
  className,
  ariaLabel,
  ariaPressed,
  active,
}: {
  children: ReactNode;
  onClick?: () => void;
  className?: string;
  ariaLabel?: string;
  ariaPressed?: boolean;
  active?: boolean;
}) {
  const [hot, setHot] = useState(false);
  const on = active || hot;
  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHot(true)}
      onMouseLeave={() => setHot(false)}
      onFocus={() => setHot(true)}
      onBlur={() => setHot(false)}
      aria-label={ariaLabel}
      aria-pressed={ariaPressed}
      className={`inline-flex items-center justify-center gap-2 px-4 py-2 text-[12px] font-semibold uppercase tracking-[0.08em] transition-colors duration-150 ${RING} ${className ?? ""}`}
      style={{
        ...mono,
        color: on ? C.phosphor : C.fgSoft,
        background: on ? `${C.phosphor}12` : "transparent",
        border: `1px solid ${on ? `${C.phosphor}66` : C.line}`,
        borderRadius: 3,
      }}
    >
      {children}
    </button>
  );
}

// Paneel-omhulsel met peilscherm-hoeken.
function Panel({
  children,
  className,
  style,
  bg = C.panel,
}: {
  children: ReactNode;
  className?: string;
  style?: CSSProperties;
  bg?: string;
}) {
  return (
    <div
      className={`relative ${className ?? ""}`}
      style={{ background: bg, border: `1px solid ${C.line}`, borderRadius: 6, ...style }}
    >
      {children}
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
  return (
    <div className="mb-8">
      <div className="mb-2 flex items-center gap-2.5">
        <span
          className="inline-flex h-6 items-center px-2 text-[11px] tabular-nums"
          style={{
            ...mono,
            color: C.phosphor,
            background: `${C.phosphor}14`,
            border: `1px solid ${C.phosphor}44`,
            borderRadius: 2,
          }}
        >
          SNR·{SCREEN_INDEX[screenKey]}
        </span>
        <span className="h-px flex-1" style={{ background: C.line }} aria-hidden="true" />
        <Mono color={C.muted}>Echolood</Mono>
      </div>
      <h1
        className="text-[30px] font-semibold leading-tight tracking-tight sm:text-[38px]"
        style={{ ...sans, color: C.fg }}
      >
        {title}
      </h1>
      {sub && (
        <p
          className="mt-2.5 max-w-xl text-[14px] leading-relaxed"
          style={{ ...sans, color: C.fgSoft }}
        >
          {sub}
        </p>
      )}
    </div>
  );
}

// ---- Screens ----------------------------------------------------------------

function Dashboard({ onOpen }: { onOpen: (o: Opdracht) => void }) {
  const top = OPDRACHTEN[0] as Opdracht;
  const voornaam = PROFIEL.naam.split(" ")[0];
  return (
    <div>
      {/* Peilscherm-hero met spectrogram-waterval */}
      <Panel className="mb-8 overflow-hidden" bg={C.hull}>
        <GridOverlay className="absolute inset-0 opacity-40" />
        <div className="relative grid grid-cols-1 gap-6 p-6 sm:p-8 md:grid-cols-[1.3fr,1fr] md:items-center">
          <div>
            <Mono color={C.phosphor}>
              {PROFIEL.plaats} · {PROFIEL.rol}
            </Mono>
            <h1
              className="mt-3 text-[36px] font-semibold leading-[1.02] tracking-tight sm:text-[46px]"
              style={{ ...sans, color: C.fg }}
            >
              Goedemorgen,
              <br />
              <span style={{ color: C.phosphor, textShadow: `0 0 20px ${C.phosphor}55` }}>
                {voornaam}.
              </span>
            </h1>
            <p
              className="mt-4 max-w-md text-[14px] leading-relaxed"
              style={{ ...sans, color: C.fgSoft }}
            >
              Je peilt de markt af als een sonar: elke echo is een kans. Alleen de sterkste signalen
              — en wat nu jouw aandacht vraagt — komen boven de ruis uit.
            </p>
            <div className="mt-6 flex flex-wrap items-center gap-3">
              <GlowButton onClick={() => onOpen(top)}>
                <Radar size={15} strokeWidth={2.2} aria-hidden="true" />
                Sterkste echo openen
              </GlowButton>
              <span
                className="inline-flex items-center gap-2 px-3 py-2"
                style={{
                  background: `${C.phosphor}0f`,
                  border: `1px solid ${C.phosphor}44`,
                  borderRadius: 3,
                }}
              >
                <BadgeCheck
                  size={15}
                  strokeWidth={2.2}
                  style={{ color: C.phosphor }}
                  aria-hidden="true"
                />
                <span
                  className="text-[12px] font-semibold uppercase tracking-[0.06em]"
                  style={{ ...mono, color: C.phosphor }}
                >
                  {PROFIEL.trust}
                </span>
              </span>
            </div>
          </div>
          <Panel className="p-4" bg={C.abyss}>
            <div className="mb-2 flex items-center justify-between">
              <Mono color={C.muted}>Spectrogram · afgelopen 7d</Mono>
              <Waves size={13} style={{ color: C.phosphor }} aria-hidden="true" />
            </div>
            <Spectrogram seed={KPIS[0]?.spark ?? [1, 2, 3]} />
            <div
              className="mt-3 flex items-center justify-between text-[9px]"
              style={{ ...mono, color: C.muted }}
            >
              <span>LAAG</span>
              <span>FREQUENTIE →</span>
              <span>HOOG</span>
            </div>
          </Panel>
        </div>
      </Panel>

      {/* KPI-peilstations */}
      <div className="mb-10 grid grid-cols-2 gap-4 lg:grid-cols-4">
        {KPIS.map((k, i) => (
          <Panel key={k.label} className="p-4" bg={C.panel}>
            <div className="flex items-center justify-between gap-2">
              <Mono color={C.muted} style={{ letterSpacing: "0.16em" }}>
                {String(i + 1).padStart(2, "0")}
              </Mono>
              <span
                className="px-1.5 py-0.5 text-[10px] tabular-nums"
                style={{
                  ...mono,
                  color: k.up ? C.phosphor : C.amber,
                  background: k.up ? `${C.phosphor}12` : `${C.amber}12`,
                  border: `1px solid ${k.up ? `${C.phosphor}44` : `${C.amber}44`}`,
                  borderRadius: 2,
                }}
              >
                {k.trend}
              </span>
            </div>
            <div
              className="mt-3 text-[28px] tabular-nums leading-none"
              style={{ ...mono, color: C.fg }}
            >
              {k.value}
            </div>
            <div className="mt-2 text-[11px]" style={{ ...sans, color: C.fgSoft }}>
              {k.label}
            </div>
            <div className="mt-3">
              <Waveform data={k.spark} color={k.up ? C.phosphor : C.amber} />
            </div>
          </Panel>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Sterkste echo */}
        <div className="lg:col-span-2">
          <div className="mb-3 flex items-baseline justify-between">
            <Mono color={C.phosphor}>Sterkste echo</Mono>
            <Mono color={C.muted}>{top.id}</Mono>
          </div>
          <Panel bg={C.panel}>
            <button
              onClick={() => onOpen(top)}
              className={`group block w-full p-5 text-left transition-colors ${RING}`}
            >
              <span className="flex items-start justify-between gap-4">
                <span className="min-w-0 flex-1">
                  <span
                    className="block text-[20px] font-semibold leading-tight tracking-tight"
                    style={{ ...sans, color: C.fg }}
                  >
                    {top.titel}
                  </span>
                  <span className="mt-1.5 block text-[13px]" style={{ ...sans, color: C.fgSoft }}>
                    {top.opdrachtgever} · {top.plaats} · {top.tarief}
                  </span>
                  <span className="mt-4 flex flex-wrap gap-2">
                    {top.tags.map((t) => (
                      <span
                        key={t}
                        className="px-2.5 py-0.5 text-[11px] font-medium"
                        style={{
                          ...mono,
                          color: C.fgSoft,
                          background: C.panelHi,
                          border: `1px solid ${C.line}`,
                          borderRadius: 2,
                        }}
                      >
                        {t}
                      </span>
                    ))}
                  </span>
                </span>
                <span className="flex shrink-0 flex-col items-end gap-3">
                  <MatchReadout value={top.match} />
                  <span
                    className="inline-flex h-9 w-9 items-center justify-center transition-transform duration-150 group-hover:translate-x-1"
                    style={{
                      background: `${C.phosphor}14`,
                      border: `1px solid ${C.phosphor}66`,
                      borderRadius: 3,
                    }}
                    aria-hidden="true"
                  >
                    <ArrowRight size={18} strokeWidth={2.2} style={{ color: C.phosphor }} />
                  </span>
                </span>
              </span>
            </button>
          </Panel>

          <Panel className="mt-4 flex items-start gap-4 p-5" bg={C.panel}>
            <span
              className="mt-0.5 inline-flex h-9 w-9 shrink-0 items-center justify-center"
              style={{
                background: `${C.phosphor}12`,
                border: `1px solid ${C.phosphor}55`,
                borderRadius: 4,
              }}
              aria-hidden="true"
            >
              <Anchor size={18} strokeWidth={2} style={{ color: C.phosphor }} />
            </span>
            <div>
              <div className="text-[15px] font-semibold" style={{ ...sans, color: C.fg }}>
                {PROFIEL.trust}
              </div>
              <p className="mt-1 text-[13px] leading-relaxed" style={{ ...sans, color: C.fgSoft }}>
                Je documenten zijn geverifieerd — opdrachtgevers pikken jouw signaal meteen op.
              </p>
            </div>
          </Panel>
        </div>

        {/* Peilkompas + acties */}
        <div>
          <div className="mb-3">
            <Mono color={C.phosphor}>Vraagt aandacht</Mono>
          </div>
          <Panel bg={C.panel} className="p-4">
            <div className="mb-4 flex items-center justify-center">
              <SweepDial value={top.match} />
            </div>
            <ul className="space-y-0">
              {ACTIES.map((a, i) => {
                const warn = a.urgentie === "warning";
                const tone = warn ? C.amber : C.cyan;
                return (
                  <li
                    key={a.titel}
                    className="flex items-start gap-3 py-3"
                    style={{ borderTop: `1px solid ${C.lineSoft}` }}
                  >
                    <span
                      className="mt-0.5 inline-flex h-5 w-5 shrink-0 items-center justify-center text-[10px] tabular-nums"
                      style={{
                        ...mono,
                        color: tone,
                        background: `${tone}12`,
                        border: `1px solid ${tone}44`,
                        borderRadius: 2,
                      }}
                    >
                      {String(i + 1).padStart(2, "0")}
                    </span>
                    <div className="min-w-0 flex-1">
                      <div
                        className="text-[12.5px] font-medium leading-snug"
                        style={{ ...sans, color: C.fg }}
                      >
                        {a.titel}
                      </div>
                      <div
                        className="mt-1 inline-flex items-center gap-1 text-[11px] font-semibold uppercase tracking-[0.06em]"
                        style={{ ...mono, color: tone }}
                      >
                        {a.cta}
                        <ArrowRight size={11} strokeWidth={2.4} aria-hidden="true" />
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
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
        title="Marktplaats"
        sub="Peil de markt af: waarom een opdracht als echo aanslaat — en waar de ruis zit. Eerlijk, zonder verborgen diepten."
      />

      <Panel bg={C.panel} className="mb-6 flex items-center gap-3 px-4 py-3">
        <Search
          size={16}
          strokeWidth={2}
          className="shrink-0"
          style={{ color: C.phosphor }}
          aria-hidden="true"
        />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Peil op titel, plaats of vaardigheid…"
          aria-label="Zoek opdrachten"
          className="w-full bg-transparent text-[14px] outline-none placeholder:opacity-45"
          style={{ ...sans, color: C.fg }}
        />
        <span
          className="px-2 py-0.5 text-[11px] tabular-nums"
          style={{
            ...mono,
            color: C.phosphor,
            background: `${C.phosphor}10`,
            border: `1px solid ${C.phosphor}33`,
            borderRadius: 2,
          }}
        >
          {String(filtered.length).padStart(2, "0")}/{String(OPDRACHTEN.length).padStart(2, "0")}
        </span>
        {query && (
          <button
            onClick={() => setQuery("")}
            className={`px-2 py-0.5 text-[11px] font-semibold uppercase tracking-[0.06em] ${RING}`}
            style={{ ...mono, color: C.amber }}
          >
            Wis
          </button>
        )}
      </Panel>

      {filtered.length === 0 ? (
        <Panel bg={C.panel} className="flex flex-col items-center gap-3 px-6 py-16 text-center">
          <span
            className="inline-flex h-14 w-14 items-center justify-center"
            style={{ background: `${C.cyan}10`, border: `1px solid ${C.cyan}44`, borderRadius: 8 }}
            aria-hidden="true"
          >
            <Radar size={26} strokeWidth={1.8} style={{ color: C.cyan }} />
          </span>
          <h3 className="text-[22px] font-semibold tracking-tight" style={{ ...sans, color: C.fg }}>
            Geen echo&apos;s
          </h3>
          <p className="max-w-xs text-[13px]" style={{ ...sans, color: C.fgSoft }}>
            De sonar vindt niets voor &ldquo;{query}&rdquo;. Verruim je peiling of wis het filter.
          </p>
          <div className="mt-1">
            <LineButton onClick={() => setQuery("")}>Filter wissen</LineButton>
          </div>
        </Panel>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {filtered.map((o, i) => {
            const isSaved = saved.has(o.id);
            const strong = o.match >= 90;
            const tone = strong ? C.phosphor : C.cyan;
            return (
              <Panel key={o.id} bg={C.panel} className="group overflow-hidden">
                <div className="grid grid-cols-1 gap-4 p-5 sm:grid-cols-[auto,1fr,auto] sm:items-start">
                  {/* mini-spectrogram als signaalvingerafdruk */}
                  <div className="hidden w-24 shrink-0 sm:block">
                    <Spectrogram seed={[i + 2, o.match % 7, i + 5]} cols={8} rows={6} tone={tone} />
                    <div
                      className="mt-1.5 text-center text-[8px] tabular-nums"
                      style={{ ...mono, color: C.muted }}
                    >
                      {o.id}
                    </div>
                  </div>
                  <div className="min-w-0">
                    <h3
                      className="text-[18px] font-semibold leading-tight tracking-tight"
                      style={{ ...sans, color: C.fg }}
                    >
                      {o.titel}
                    </h3>
                    <div className="mt-1 text-[13px]" style={{ ...sans, color: C.fgSoft }}>
                      {o.opdrachtgever}
                    </div>
                    <dl
                      className="mt-3 flex flex-wrap gap-x-4 gap-y-2 text-[12px]"
                      style={{ ...sans, color: C.fgSoft }}
                    >
                      {[
                        { Icon: MapPin, v: o.plaats },
                        { Icon: Wallet, v: o.tarief },
                        { Icon: Clock, v: o.uren },
                        { Icon: Calendar, v: o.start },
                      ].map((m, mi) => (
                        <div key={mi} className="flex items-center gap-1.5">
                          <m.Icon
                            size={13}
                            strokeWidth={2}
                            style={{ color: C.muted }}
                            aria-hidden="true"
                          />
                          {m.v}
                        </div>
                      ))}
                    </dl>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {o.tags.map((t) => (
                        <span
                          key={t}
                          className="px-2 py-0.5 text-[10.5px]"
                          style={{
                            ...mono,
                            color: C.fgSoft,
                            background: C.panelHi,
                            border: `1px solid ${C.line}`,
                            borderRadius: 2,
                          }}
                        >
                          {t}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div className="flex items-center justify-between gap-3 sm:flex-col sm:items-end">
                    <MatchReadout value={o.match} size="sm" />
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => toggleSave(o.id)}
                        aria-pressed={isSaved}
                        aria-label={isSaved ? "Verwijder uit bewaard" : "Bewaar opdracht"}
                        className={`flex h-9 w-9 items-center justify-center transition-colors ${RING}`}
                        style={{
                          color: isSaved ? C.phosphor : C.fgSoft,
                          background: isSaved ? `${C.phosphor}14` : "transparent",
                          border: `1px solid ${isSaved ? `${C.phosphor}66` : C.line}`,
                          borderRadius: 3,
                        }}
                      >
                        {isSaved ? (
                          <BookmarkCheck size={16} strokeWidth={2.2} aria-hidden="true" />
                        ) : (
                          <Bookmark size={16} strokeWidth={2.2} aria-hidden="true" />
                        )}
                      </button>
                      <GlowButton onClick={() => onOpen(o)} tone={tone}>
                        Bekijk
                        <ArrowRight size={14} strokeWidth={2.2} aria-hidden="true" />
                      </GlowButton>
                    </div>
                  </div>
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
      <div className="mb-6">
        <LineButton onClick={onBack} ariaLabel="Terug naar marktplaats">
          <ArrowLeft size={14} strokeWidth={2.2} aria-hidden="true" />
          Terug
        </LineButton>
      </div>

      <Panel bg={C.hull} className="mb-6 overflow-hidden">
        <GridOverlay className="absolute inset-0 opacity-30" />
        <div className="relative flex flex-wrap items-start justify-between gap-6 p-6 sm:p-7">
          <div className="min-w-0 flex-1">
            <Mono color={C.phosphor}>{opdracht.id}</Mono>
            <h2
              className="mt-3 text-[28px] font-semibold leading-[1.05] tracking-tight sm:text-[38px]"
              style={{ ...sans, color: C.fg }}
            >
              {opdracht.titel}
            </h2>
            <div className="mt-2 text-[14px]" style={{ ...sans, color: C.fgSoft }}>
              {opdracht.opdrachtgever} · {opdracht.plaats}
            </div>
          </div>
          <div className="flex flex-col items-end gap-3">
            <MatchReadout value={opdracht.match} />
            <LineButton
              onClick={() => toggleSave(opdracht.id)}
              active={isSaved}
              ariaPressed={isSaved}
              ariaLabel={isSaved ? "Verwijder uit bewaard" : "Bewaar opdracht"}
            >
              {isSaved ? (
                <BookmarkCheck size={14} strokeWidth={2.2} aria-hidden="true" />
              ) : (
                <Bookmark size={14} strokeWidth={2.2} aria-hidden="true" />
              )}
              {isSaved ? "Bewaard" : "Bewaar"}
            </LineButton>
          </div>
        </div>
      </Panel>

      <div className="mb-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
        {[
          { Icon: Wallet, label: "Tarief", value: opdracht.tarief },
          { Icon: Clock, label: "Inzet", value: opdracht.uren },
          { Icon: Calendar, label: "Start", value: opdracht.start },
          { Icon: MapPin, label: "Plaats", value: opdracht.plaats },
        ].map((m) => (
          <Panel key={m.label} bg={C.panel} className="p-4">
            <m.Icon size={15} strokeWidth={2} style={{ color: C.phosphor }} aria-hidden="true" />
            <div
              className="mt-2.5 text-[9px] uppercase tracking-[0.16em]"
              style={{ ...mono, color: C.muted }}
            >
              {m.label}
            </div>
            <div className="mt-0.5 text-[15px] font-semibold" style={{ ...sans, color: C.fg }}>
              {m.value}
            </div>
          </Panel>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <Panel bg={C.panel} className="p-5">
          <div className="mb-3 flex items-center gap-2">
            <span
              className="inline-flex h-6 w-6 items-center justify-center"
              style={{
                background: `${C.phosphor}14`,
                border: `1px solid ${C.phosphor}55`,
                borderRadius: 3,
              }}
              aria-hidden="true"
            >
              <Check size={13} strokeWidth={2.6} style={{ color: C.phosphor }} />
            </span>
            <span
              className="text-[13px] font-semibold uppercase tracking-[0.06em]"
              style={{ ...mono, color: C.phosphor }}
            >
              Sterk signaal
            </span>
          </div>
          <ul className="space-y-2">
            {opdracht.redenen.plus.map((r) => (
              <li
                key={r}
                className="flex items-start gap-2.5 rounded-sm p-2.5 text-[13.5px]"
                style={{
                  ...sans,
                  color: C.fg,
                  background: `${C.phosphor}0a`,
                  border: `1px solid ${C.phosphor}22`,
                }}
              >
                <Check
                  size={16}
                  strokeWidth={2.6}
                  className="mt-0.5 shrink-0"
                  style={{ color: C.phosphor }}
                  aria-hidden="true"
                />
                {r}
              </li>
            ))}
          </ul>
        </Panel>
        <Panel bg={C.panel} className="p-5">
          <div className="mb-3 flex items-center gap-2">
            <span
              className="inline-flex h-6 w-6 items-center justify-center"
              style={{
                background: `${C.amber}14`,
                border: `1px solid ${C.amber}55`,
                borderRadius: 3,
              }}
              aria-hidden="true"
            >
              <TriangleAlert size={13} strokeWidth={2.2} style={{ color: C.amber }} />
            </span>
            <span
              className="text-[13px] font-semibold uppercase tracking-[0.06em]"
              style={{ ...mono, color: C.amber }}
            >
              Ruis · let op
            </span>
          </div>
          <ul className="space-y-2">
            {opdracht.redenen.min.map((r) => (
              <li
                key={r}
                className="flex items-start gap-2.5 rounded-sm p-2.5 text-[13.5px]"
                style={{
                  ...sans,
                  color: C.fg,
                  background: `${C.amber}0a`,
                  border: `1px solid ${C.amber}22`,
                }}
              >
                <TriangleAlert
                  size={15}
                  strokeWidth={2.2}
                  className="mt-0.5 shrink-0"
                  style={{ color: C.amber }}
                  aria-hidden="true"
                />
                {r}
              </li>
            ))}
          </ul>
        </Panel>
      </div>

      <div className="mt-6 flex flex-wrap items-center gap-4">
        <GlowButton
          onClick={() => setApplied((v) => !v)}
          ariaPressed={applied}
          className="px-6 py-3 text-[13px]"
        >
          {applied ? (
            <Check size={16} strokeWidth={2.6} aria-hidden="true" />
          ) : (
            <ArrowRight size={16} strokeWidth={2.2} aria-hidden="true" />
          )}
          {applied ? "Signaal verzonden" : "Reageer op opdracht"}
        </GlowButton>
        {applied && (
          <span className="text-[12.5px]" style={{ ...sans, color: C.fgSoft }}>
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
}: {
  checked: Set<string>;
  toggleCheck: (naam: string) => void;
}) {
  return (
    <div>
      <ScreenHead
        screenKey="verificatie"
        title="Verificatie"
        sub="Elke status heeft een eigen signaalkleur, label én icoon — nooit alleen kleur. Zo peil je in één blik wat klopt."
      />

      <div className="mb-8 flex flex-wrap gap-2.5">
        {(["VERIFIED", "SUBMITTED", "EXPIRING", "REJECTED"] as CredStatus[]).map((s) => (
          <StatusChip key={s} status={s} big />
        ))}
      </div>

      <Panel bg={C.panel} className="mb-8 flex items-start gap-4 p-5">
        <span
          className="mt-0.5 inline-flex h-9 w-9 shrink-0 items-center justify-center"
          style={{
            background: `${C.phosphor}12`,
            border: `1px solid ${C.phosphor}55`,
            borderRadius: 4,
          }}
          aria-hidden="true"
        >
          <Anchor size={18} strokeWidth={2} style={{ color: C.phosphor }} />
        </span>
        <div>
          <div className="text-[15px] font-semibold" style={{ ...sans, color: C.fg }}>
            {PROFIEL.trust}
          </div>
          <p className="mt-1 text-[13px] leading-relaxed" style={{ ...sans, color: C.fgSoft }}>
            Je documenten liggen versleuteld in de kluis en worden alleen met jouw toestemming
            gepeild.
          </p>
        </div>
      </Panel>

      <div className="mb-3">
        <Mono color={C.phosphor}>Certificaten</Mono>
      </div>
      <div className="grid grid-cols-1 gap-3">
        {CREDENTIALS.map((c, i) => {
          const done = checked.has(c.naam);
          return (
            <Panel key={c.naam} bg={C.panel} className="flex items-center gap-4 p-4">
              <button
                onClick={() => toggleCheck(c.naam)}
                aria-pressed={done}
                aria-label={done ? `${c.naam} afgevinkt` : `Vink ${c.naam} af`}
                className={`flex h-7 w-7 shrink-0 items-center justify-center transition-colors ${RING}`}
                style={{
                  border: `1px solid ${done ? `${C.phosphor}88` : C.line}`,
                  background: done ? `${C.phosphor}18` : "transparent",
                  color: C.phosphor,
                  borderRadius: 3,
                }}
              >
                {done && <Check size={15} strokeWidth={2.6} aria-hidden="true" />}
              </button>
              <span
                className="hidden text-[12px] tabular-nums sm:inline"
                style={{ ...mono, color: C.muted }}
              >
                {String(i + 1).padStart(2, "0")}
              </span>
              <div className="min-w-0 flex-1">
                <div
                  className="text-[15px] font-semibold leading-tight"
                  style={{ ...sans, color: C.fg }}
                >
                  {c.naam}
                </div>
                <div className="mt-0.5 text-[12px]" style={{ ...sans, color: C.fgSoft }}>
                  {c.detail}
                </div>
              </div>
              <StatusChip status={c.status} />
            </Panel>
          );
        })}
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
        title="Acties"
        sub="Wat vandaag boven de ruis uitkomt — op volgorde van urgentie gepeild."
      />

      {openCount === 0 ? (
        <Panel bg={C.panel} className="flex flex-col items-center gap-3 px-6 py-16 text-center">
          <span
            className="inline-flex h-14 w-14 items-center justify-center"
            style={{
              background: `${C.phosphor}12`,
              border: `1px solid ${C.phosphor}55`,
              borderRadius: 8,
            }}
            aria-hidden="true"
          >
            <Check size={28} strokeWidth={2.4} style={{ color: C.phosphor }} />
          </span>
          <h3 className="text-[22px] font-semibold tracking-tight" style={{ ...sans, color: C.fg }}>
            Rustige wateren
          </h3>
          <p className="max-w-xs text-[13px]" style={{ ...sans, color: C.fgSoft }}>
            Geen actieve echo&apos;s meer vandaag. De sonar is stil.
          </p>
        </Panel>
      ) : (
        <>
          <div className="mb-6 inline-flex items-center gap-3">
            <span
              className="inline-flex h-12 items-center px-4 text-[30px] tabular-nums leading-none"
              style={{
                ...mono,
                color: C.phosphor,
                background: `${C.phosphor}12`,
                border: `1px solid ${C.phosphor}55`,
                borderRadius: 4,
                textShadow: `0 0 16px ${C.phosphor}66`,
              }}
            >
              {String(openCount).padStart(2, "0")}
            </span>
            <span
              className="text-[12px] uppercase tracking-[0.16em]"
              style={{ ...mono, color: C.fgSoft }}
            >
              {openCount === 1 ? "echo open" : "echo's open"}
            </span>
          </div>

          <div className="grid grid-cols-1 gap-3">
            {ACTIES.map((a, i) => {
              const isDone = done.has(a.titel);
              const warn = a.urgentie === "warning";
              const tone = warn ? C.amber : C.cyan;
              return (
                <Panel key={a.titel} bg={C.panel} className="flex items-start gap-4 p-4">
                  <button
                    onClick={() => toggleDone(a.titel)}
                    aria-pressed={isDone}
                    aria-label={isDone ? `${a.titel} afgerond` : `Markeer ${a.titel} als afgerond`}
                    className={`mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center transition-colors ${RING}`}
                    style={{
                      border: `1px solid ${isDone ? `${C.phosphor}88` : C.line}`,
                      background: isDone ? `${C.phosphor}18` : "transparent",
                      color: C.phosphor,
                      borderRadius: 3,
                    }}
                  >
                    {isDone && <Check size={15} strokeWidth={2.6} aria-hidden="true" />}
                  </button>
                  <span
                    className="mt-0.5 inline-flex h-6 w-6 shrink-0 items-center justify-center text-[11px] tabular-nums"
                    style={{
                      ...mono,
                      color: isDone ? C.muted : tone,
                      background: isDone ? "transparent" : `${tone}12`,
                      border: `1px solid ${isDone ? C.line : `${tone}44`}`,
                      borderRadius: 2,
                    }}
                  >
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div
                      className="text-[15px] font-semibold leading-snug"
                      style={{
                        ...sans,
                        color: C.fg,
                        textDecoration: isDone ? "line-through" : "none",
                        opacity: isDone ? 0.5 : 1,
                      }}
                    >
                      {a.titel}
                    </div>
                    <p
                      className="mt-1 text-[12.5px]"
                      style={{ ...sans, color: C.fgSoft, opacity: isDone ? 0.5 : 1 }}
                    >
                      {a.detail}
                    </p>
                    {!isDone && (
                      <span
                        className="mt-2 inline-flex items-center gap-1 text-[12px] font-semibold uppercase tracking-[0.06em]"
                        style={{ ...mono, color: tone }}
                      >
                        {a.cta}
                        <ArrowRight size={12} strokeWidth={2.4} aria-hidden="true" />
                      </span>
                    )}
                  </div>
                </Panel>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}

function Facturen() {
  const trend = [24.8, 13.5, 30.72, 8.8];
  const statusMeta = (status: string): { tone: string; Icon: LucideIcon } => {
    if (status === "Betaald") return { tone: C.phosphor, Icon: Check };
    if (status === "Openstaand") return { tone: C.amber, Icon: Clock };
    return { tone: C.muted, Icon: Hourglass };
  };
  return (
    <div>
      <ScreenHead
        screenKey="facturen"
        title="Facturen"
        sub="Helder gepeild en zonder gedoe — zodat je altijd weet waar je aan toe bent."
      />

      <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-4">
        {[
          { label: "Betaald (mnd)", value: "€ 5.552", tone: C.phosphor },
          { label: "Openstaand", value: "€ 1.350", tone: C.amber },
          { label: "Concept", value: "€ 880", tone: C.cyan },
        ].map((s) => (
          <Panel key={s.label} bg={C.panel} className="p-4">
            <div
              className="text-[9px] uppercase tracking-[0.16em]"
              style={{ ...mono, color: C.muted }}
            >
              {s.label}
            </div>
            <div
              className="mt-2 text-[26px] tabular-nums leading-none"
              style={{ ...mono, color: s.tone }}
            >
              {s.value}
            </div>
          </Panel>
        ))}
        <Panel bg={C.panel} className="flex flex-col justify-between p-4">
          <div
            className="text-[9px] uppercase tracking-[0.16em]"
            style={{ ...mono, color: C.muted }}
          >
            Diepteprofiel
          </div>
          <DepthProfile data={trend} />
        </Panel>
      </div>

      <Panel bg={C.panel} className="overflow-x-auto p-2">
        <table className="w-full min-w-[560px] text-left">
          <thead>
            <tr style={{ borderBottom: `1px solid ${C.line}` }}>
              {["Nr.", "Klant", "Datum", "Bedrag", "Status"].map((h, i) => (
                <th
                  key={h}
                  scope="col"
                  className="px-3 py-2.5 text-[10px] uppercase tracking-[0.14em]"
                  style={{ ...mono, color: C.muted, textAlign: i >= 3 ? "right" : "left" }}
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {FACTUREN.map((f) => {
              const st = statusMeta(f.status);
              return (
                <tr
                  key={f.nr}
                  className="transition-colors"
                  style={{ borderBottom: `1px solid ${C.lineSoft}` }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = C.panelHi)}
                  onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                >
                  <td
                    className="px-3 py-3.5 text-[12.5px] tabular-nums"
                    style={{ ...mono, color: C.fg }}
                  >
                    {f.nr}
                  </td>
                  <td className="px-3 py-3.5 text-[13px]" style={{ ...sans, color: C.fg }}>
                    {f.klant}
                  </td>
                  <td
                    className="px-3 py-3.5 text-[12.5px] tabular-nums"
                    style={{ ...mono, color: C.fgSoft }}
                  >
                    {f.datum}
                  </td>
                  <td
                    className="px-3 py-3.5 text-right text-[13.5px] tabular-nums"
                    style={{ ...mono, color: C.fg }}
                  >
                    {f.bedrag}
                  </td>
                  <td className="px-3 py-3.5 text-right">
                    <span
                      className="inline-flex items-center gap-1.5 px-2 py-0.5 text-[10.5px] font-semibold uppercase tracking-[0.06em]"
                      style={{
                        ...mono,
                        color: st.tone,
                        background: `${st.tone}12`,
                        border: `1px solid ${st.tone}44`,
                        borderRadius: 2,
                      }}
                    >
                      <st.Icon size={11} strokeWidth={2.4} aria-hidden="true" />
                      {f.status}
                    </span>
                  </td>
                </tr>
              );
            })}
            <tr style={{ borderTop: `1px solid ${C.line}` }}>
              <td
                className="px-3 py-3 text-[11px] uppercase tracking-[0.12em]"
                style={{ ...mono, color: C.muted }}
                colSpan={3}
              >
                Totaal
              </td>
              <td
                className="px-3 py-3 text-right text-[15px] tabular-nums"
                style={{ ...mono, color: C.phosphor }}
              >
                € 7.782
              </td>
              <td className="px-3 py-3" />
            </tr>
          </tbody>
        </table>
      </Panel>
    </div>
  );
}

// ---- Shell ------------------------------------------------------------------

export function Concept295() {
  const [screen, setScreen] = useState<ScreenKey>("dashboard");
  const [query, setQuery] = useState("");
  const [saved, setSaved] = useState<Set<string>>(new Set(["OPD-2041"]));
  const [checked, setChecked] = useState<Set<string>>(new Set());
  const [done, setDone] = useState<Set<string>>(new Set());
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
      style={{ ...sans, color: C.fg, background: C.abyss }}
    >
      <div className="mx-auto flex min-h-[680px] max-w-6xl flex-col px-4 py-6 sm:px-6 sm:py-8">
        <header className="mb-6 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span
              className="flex h-11 w-11 items-center justify-center"
              style={{
                background: `${C.phosphor}12`,
                border: `1px solid ${C.phosphor}55`,
                borderRadius: 8,
              }}
              aria-hidden="true"
            >
              <Radar size={20} strokeWidth={2} style={{ color: C.phosphor }} />
            </span>
            <div className="leading-tight">
              <div
                className="text-[17px] font-semibold tracking-tight"
                style={{ ...sans, color: C.fg }}
              >
                Echolood
              </div>
              <div
                className="text-[9px] uppercase tracking-[0.24em]"
                style={{ ...mono, color: C.muted }}
              >
                ZZP platform
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="hidden text-right leading-tight sm:block">
              <div className="text-[13px] font-semibold" style={{ ...sans, color: C.fg }}>
                {PROFIEL.naam}
              </div>
              <div
                className="inline-flex items-center gap-1 text-[11px]"
                style={{ ...sans, color: C.phosphor }}
              >
                <BadgeCheck size={12} strokeWidth={2} aria-hidden="true" />
                {PROFIEL.trust}
              </div>
            </div>
            <span
              className="flex h-11 w-11 items-center justify-center text-[12px] font-semibold tabular-nums"
              style={{
                ...mono,
                color: C.phosphor,
                background: `${C.phosphor}10`,
                border: `1px solid ${C.phosphor}44`,
                borderRadius: 8,
              }}
              aria-hidden="true"
            >
              {PROFIEL.initialen}
            </span>
          </div>
        </header>

        <nav className="mb-8 flex flex-wrap gap-2 overflow-x-auto" aria-label="Hoofdnavigatie">
          {SCREENS.map((s) => {
            const on = s.key === screen;
            return (
              <button
                key={s.key}
                onClick={() => setScreen(s.key)}
                aria-current={on ? "page" : undefined}
                className={`inline-flex shrink-0 items-center gap-2 px-3 py-2 text-[12px] font-semibold uppercase tracking-[0.06em] transition-colors ${RING}`}
                style={{
                  ...mono,
                  color: on ? C.phosphor : C.fgSoft,
                  background: on ? `${C.phosphor}12` : C.panel,
                  border: `1px solid ${on ? `${C.phosphor}66` : C.line}`,
                  borderRadius: 3,
                }}
              >
                <span
                  className="text-[9px] tabular-nums"
                  style={{ color: on ? C.phosphor : C.muted }}
                >
                  {SCREEN_INDEX[s.key]}
                </span>
                {s.label}
              </button>
            );
          })}
        </nav>

        <main className="flex-1">
          {screen === "dashboard" && (
            <Dashboard
              onOpen={(o) => {
                setActive(o);
                setScreen("opdracht");
              }}
            />
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
            />
          )}
          {screen === "acties" && (
            <Acties done={done} toggleDone={(t) => setDone((s) => toggleSet(s, t))} />
          )}
          {screen === "facturen" && <Facturen />}
        </main>

        <footer
          className="mt-10 flex flex-wrap items-center justify-between gap-2 pt-4 text-[10.5px]"
          style={{ ...mono, color: C.muted, borderTop: `1px solid ${C.line}` }}
        >
          <span className="inline-flex items-center gap-2">
            <span
              className="h-2 w-2 rounded-full"
              style={{ background: C.phosphor, boxShadow: `0 0 8px ${C.phosphor}` }}
              aria-hidden="true"
            />
            {SCREENS.length} schermen · echolood v295
          </span>
          <span className="uppercase tracking-[0.14em]">Spectrogram · peiling · diepte-echo</span>
        </footer>
      </div>
    </div>
  );
}
