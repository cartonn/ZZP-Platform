"use client";

// Concept 49 — "Meter" · Instrumentencluster — analoge wijzermeters (DONKER, cockpit).
// De dashboards van een cockpit/precisie-auto: KPI's en match-scores als radiale meters met
// naalden, tick-bogen en digitale readouts. Kleine multiples van wijzerplaten, een
// horizon/kunstmatige-horizon-motief, verificatiestatussen als indicatorlampjes. Alles in
// inline-SVG (bogen via <path>, naald via geroteerde <g>). Precisie-engineering, geen ronde
// kaarten met sparklines — dit zijn échte ronde analoge meters met naalden.
// Onderscheidend van elk split-flap/dienstregeling-concept: dit is een instrumentenpaneel.
// Palet: paneel-bg #0f1417, paneel #161c22, ink #e8ece8, amber #f2b134, groen #34d399,
// redline #ef4444, hairline #2a3038.
// Fonts: --font-lab-space (display) + --font-lab-spline-mono (readouts).

import { useState } from "react";
import {
  Gauge as GaugeIcon,
  Radar,
  Briefcase,
  ShieldCheck,
  ListChecks,
  Receipt,
  Search,
  Bell,
  Check,
  Clock,
  AlertTriangle,
  Minus,
  MapPin,
  Plus,
  FileText,
  Send,
  Loader2,
  Power,
  Navigation,
  ChevronRight,
  Fuel,
  Activity,
  CircleDot,
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
  DOCUMENTEN,
  type ScreenKey,
  type CredStatus,
  type Opdracht,
} from "./mock";

/* ---------- Palet & typografie ---------- */

const C = {
  panelBg: "#0f1417",
  well: "#0b0f12",
  panel: "#161c22",
  panelHi: "#1b232a",
  ink: "#e8ece8",
  inkSoft: "#aeb7bd",
  muted: "#788088",
  faint: "#525a61",
  line: "#2a3038",
  lineSoft: "#20272e",
  amber: "#f2b134",
  amberSoft: "rgba(242,177,52,0.14)",
  green: "#34d399",
  greenSoft: "rgba(52,211,153,0.14)",
  red: "#ef4444",
  redSoft: "rgba(239,68,68,0.14)",
};

const display = { fontFamily: "var(--font-lab-space)" };
const mono = { fontFamily: "var(--font-lab-spline-mono)" };

type Tone = "green" | "amber" | "red";

const TONE: Record<Tone, { hex: string; soft: string }> = {
  green: { hex: C.green, soft: C.greenSoft },
  amber: { hex: C.amber, soft: C.amberSoft },
  red: { hex: C.red, soft: C.redSoft },
};

const NAV_ICONS: Record<ScreenKey, LucideIcon> = {
  dashboard: GaugeIcon,
  marktplaats: Radar,
  opdracht: Briefcase,
  verificatie: ShieldCheck,
  acties: ListChecks,
  facturen: Receipt,
  documenten: FileText,
  berichten: Bell,
};

function statusStyle(s: CredStatus): {
  label: string;
  tone: Tone;
  Icon: LucideIcon;
} {
  switch (s) {
    case "VERIFIED":
      return { label: "Geverifieerd", tone: "green", Icon: Check };
    case "SUBMITTED":
      return { label: "In beoordeling", tone: "amber", Icon: Clock };
    case "EXPIRING":
      return { label: "Verloopt bijna", tone: "amber", Icon: AlertTriangle };
    case "REJECTED":
      return { label: "Afgewezen", tone: "red", Icon: AlertTriangle };
  }
}

/* ---------- Geometrie ---------- */

// Hoek gemeten met de klok mee vanaf 12 uur (boven). 0 = boven, 90 = rechts.
function polar(cx: number, cy: number, r: number, angleDeg: number): { x: number; y: number } {
  const a = ((angleDeg - 90) * Math.PI) / 180;
  return { x: cx + r * Math.cos(a), y: cy + r * Math.sin(a) };
}

// Boog met de klok mee van startDeg naar endDeg.
function arcPath(cx: number, cy: number, r: number, startDeg: number, endDeg: number): string {
  const s = polar(cx, cy, r, startDeg);
  const e = polar(cx, cy, r, endDeg);
  const large = Math.abs(endDeg - startDeg) > 180 ? 1 : 0;
  return `M ${s.x.toFixed(2)} ${s.y.toFixed(2)} A ${r} ${r} 0 ${large} 1 ${e.x.toFixed(2)} ${e.y.toFixed(2)}`;
}

// Digits uit een readable string ("€ 8.240" → 8240, "92%" → 92).
function digits(v: string): number {
  const only = v.replace(/[^\d]/g, "");
  return only ? parseInt(only, 10) : 0;
}

const SWEEP = 270; // graden bogenbereik
const START = 225; // startpositie (7:30)

function dialConfig(i: number): { max: number; tone: Tone; redFrom?: number; caption: string } {
  switch (i) {
    case 0:
      return { max: 100, tone: "green", redFrom: 0.6, caption: "0–100 %" };
    case 1:
      return { max: 12, tone: "amber", caption: "0–12 reacties" };
    case 2:
      return { max: 10000, tone: "green", caption: "0–10k € / mnd" };
    default:
      return { max: 3000, tone: "amber", redFrom: 0.75, caption: "0–3k € open" };
  }
}

/* ---------- Instrument-primitieven ---------- */

// Vier decoratieve schroeven in de hoeken — instrumentenpaneel-gevoel.
function Screws() {
  const pos = ["left-2 top-2", "right-2 top-2", "left-2 bottom-2", "right-2 bottom-2"];
  return (
    <>
      {pos.map((p) => (
        <span
          key={p}
          aria-hidden="true"
          className={`pointer-events-none absolute ${p} h-2 w-2 rounded-full`}
          style={{
            background: "radial-gradient(circle at 35% 30%, #3a434c, #12171c)",
            boxShadow: "inset 0 0 0 1px rgba(0,0,0,0.6)",
          }}
        />
      ))}
    </>
  );
}

function Panel({
  children,
  className = "",
  screws = false,
}: {
  children: React.ReactNode;
  className?: string;
  screws?: boolean;
}) {
  return (
    <div
      className={`relative rounded-2xl ${className}`}
      style={{
        background: `linear-gradient(180deg, ${C.panelHi}, ${C.panel})`,
        border: `1px solid ${C.line}`,
        boxShadow: "0 1px 0 rgba(255,255,255,0.03) inset, 0 18px 40px -28px rgba(0,0,0,0.9)",
      }}
    >
      {screws && <Screws />}
      {children}
    </div>
  );
}

// Digitale readout in het cockpit-lettertype.
function Readout({
  value,
  unit,
  tone = "green",
  size = "md",
}: {
  value: string;
  unit?: string;
  tone?: Tone;
  size?: "sm" | "md" | "lg";
}) {
  const px = size === "lg" ? "text-[26px]" : size === "sm" ? "text-[13px]" : "text-[18px]";
  return (
    <span
      className={`inline-flex items-baseline gap-1 tabular-nums ${px} font-medium leading-none`}
      style={{
        ...mono,
        color: TONE[tone].hex,
        textShadow: `0 0 14px ${TONE[tone].soft}`,
      }}
    >
      {value}
      {unit && (
        <span className="text-[0.6em]" style={{ color: C.muted, textShadow: "none" }}>
          {unit}
        </span>
      )}
    </span>
  );
}

/* ---------- De radiale meter ---------- */

function Gauge({
  value,
  max,
  display: displayValue,
  label,
  tone,
  redFrom,
  size = 190,
  animate = true,
}: {
  value: number;
  max: number;
  display: string;
  label: string;
  tone: Tone;
  redFrom?: number;
  size?: number;
  animate?: boolean;
}) {
  const t = Math.max(0, Math.min(1, value / max));
  const cx = 100;
  const cy = 100;
  const rArc = 82;
  const needleAngle = START + t * SWEEP;
  const color = TONE[tone].hex;

  // 11 hoofd-ticks + tussenliggende kleine ticks.
  const majors = Array.from({ length: 11 }, (_, i) => i);
  const minors = Array.from({ length: 51 }, (_, i) => i).filter((i) => i % 5 !== 0);

  return (
    <figure
      className="flex flex-col items-center"
      role="img"
      aria-label={`${label}: ${displayValue}`}
    >
      <svg
        viewBox="0 0 200 200"
        width={size}
        height={size}
        className="max-w-full"
        aria-hidden="true"
      >
        {/* Verzonken plaat */}
        <circle cx={cx} cy={cy} r={96} fill={C.well} stroke={C.line} strokeWidth={1} />
        <circle cx={cx} cy={cy} r={90} fill="none" stroke={C.lineSoft} strokeWidth={1} />

        {/* Achtergrondboog */}
        <path
          d={arcPath(cx, cy, rArc, START, START + SWEEP)}
          fill="none"
          stroke={C.line}
          strokeWidth={7}
          strokeLinecap="round"
        />

        {/* Redline-band */}
        {redFrom !== undefined && (
          <path
            d={arcPath(cx, cy, rArc, START + redFrom * SWEEP, START + SWEEP)}
            fill="none"
            stroke={C.red}
            strokeWidth={7}
            strokeLinecap="round"
            opacity={0.32}
          />
        )}

        {/* Waardeboog */}
        <path
          d={arcPath(cx, cy, rArc, START, needleAngle)}
          fill="none"
          stroke={color}
          strokeWidth={7}
          strokeLinecap="round"
          style={{ filter: `drop-shadow(0 0 6px ${TONE[tone].soft})` }}
        />

        {/* Kleine ticks */}
        {minors.map((i) => {
          const ang = START + (i / 50) * SWEEP;
          const a = polar(cx, cy, 70, ang);
          const b = polar(cx, cy, 74, ang);
          return (
            <line
              key={`mi${i}`}
              x1={a.x}
              y1={a.y}
              x2={b.x}
              y2={b.y}
              stroke={C.faint}
              strokeWidth={1}
            />
          );
        })}

        {/* Hoofd-ticks + labels */}
        {majors.map((i) => {
          const ang = START + (i / 10) * SWEEP;
          const a = polar(cx, cy, 66, ang);
          const b = polar(cx, cy, 74, ang);
          const lab = polar(cx, cy, 56, ang);
          const inRed = redFrom !== undefined && i / 10 >= redFrom;
          return (
            <g key={`ma${i}`}>
              <line
                x1={a.x}
                y1={a.y}
                x2={b.x}
                y2={b.y}
                stroke={inRed ? C.red : C.inkSoft}
                strokeWidth={1.6}
              />
              {i % 2 === 0 && (
                <text
                  x={lab.x}
                  y={lab.y + 3}
                  textAnchor="middle"
                  style={mono}
                  fontSize={8}
                  fill={inRed ? C.red : C.muted}
                >
                  {Math.round((i / 10) * max >= 1000 ? (i / 10) * (max / 1000) : (i / 10) * max)}
                  {max >= 1000 && i > 0 ? "k" : ""}
                </text>
              )}
            </g>
          );
        })}

        {/* Naald */}
        <g
          style={{
            transform: `rotate(${needleAngle}deg)`,
            transformOrigin: `${cx}px ${cy}px`,
            transition: animate ? "transform 0.8s cubic-bezier(0.34,1.4,0.5,1)" : undefined,
          }}
        >
          <line
            x1={cx}
            y1={cy}
            x2={cx}
            y2={cy - 60}
            stroke={color}
            strokeWidth={2.4}
            strokeLinecap="round"
            style={{ filter: `drop-shadow(0 0 4px ${TONE[tone].soft})` }}
          />
          <line
            x1={cx}
            y1={cy}
            x2={cx}
            y2={cy + 16}
            stroke={C.inkSoft}
            strokeWidth={3.4}
            strokeLinecap="round"
          />
        </g>

        {/* Naaf */}
        <circle cx={cx} cy={cy} r={8} fill={C.panelHi} stroke={C.line} strokeWidth={1.4} />
        <circle cx={cx} cy={cy} r={3} fill={color} />

        {/* Digitale readout binnen de plaat */}
        <text
          x={cx}
          y={cy + 40}
          textAnchor="middle"
          style={mono}
          fontSize={17}
          fontWeight={600}
          fill={color}
        >
          {displayValue}
        </text>
      </svg>
      <figcaption
        className="mt-1 text-center text-[10.5px] font-semibold uppercase tracking-[0.18em]"
        style={{ color: C.muted, ...display }}
      >
        {label}
      </figcaption>
    </figure>
  );
}

// Compacte mini-meter voor lijstrijen (alleen match-percentage).
function MiniGauge({ value, tone = "green" }: { value: number; tone?: Tone }) {
  const t = Math.max(0, Math.min(1, value / 100));
  const cx = 26;
  const cy = 26;
  const r = 20;
  const angle = START + t * SWEEP;
  const color = TONE[tone].hex;
  return (
    <span
      className="relative inline-flex shrink-0 items-center justify-center"
      role="img"
      aria-label={`Match ${value} procent`}
    >
      <svg viewBox="0 0 52 52" width={52} height={52} aria-hidden="true">
        <path
          d={arcPath(cx, cy, r, START, START + SWEEP)}
          fill="none"
          stroke={C.line}
          strokeWidth={4}
          strokeLinecap="round"
        />
        <path
          d={arcPath(cx, cy, r, START, angle)}
          fill="none"
          stroke={color}
          strokeWidth={4}
          strokeLinecap="round"
        />
        <g
          style={{
            transform: `rotate(${angle}deg)`,
            transformOrigin: `${cx}px ${cy}px`,
            transition: "transform 0.6s cubic-bezier(0.34,1.4,0.5,1)",
          }}
        >
          <line
            x1={cx}
            y1={cy}
            x2={cx}
            y2={cy - 15}
            stroke={color}
            strokeWidth={1.6}
            strokeLinecap="round"
          />
        </g>
        <circle cx={cx} cy={cy} r={3} fill={C.panelHi} stroke={color} strokeWidth={1} />
      </svg>
      <span
        className="absolute -bottom-0.5 text-[9px] font-semibold tabular-nums"
        style={{ ...mono, color }}
      >
        {value}
      </span>
    </span>
  );
}

/* ---------- Kunstmatige horizon (attitude indicator) ---------- */

function HorizonIndicator({ pitch, roll }: { pitch: number; roll: number }) {
  // pitch/roll puur presentationeel: koppelt vertrouwensbalans visueel.
  const clipId = "horizon-clip-49";
  return (
    <div
      role="img"
      aria-label={`Vertrouwensbalans stabiel — ${PROFIEL.trust}`}
      className="relative"
    >
      <svg viewBox="0 0 200 200" width="100%" height="100%" aria-hidden="true">
        <defs>
          <clipPath id={clipId}>
            <circle cx={100} cy={100} r={84} />
          </clipPath>
          <linearGradient id="sky-49" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#1c4a5c" />
            <stop offset="100%" stopColor="#12303b" />
          </linearGradient>
          <linearGradient id="ground-49" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#3a2c16" />
            <stop offset="100%" stopColor="#241c0e" />
          </linearGradient>
        </defs>

        <circle cx={100} cy={100} r={90} fill={C.well} stroke={C.line} strokeWidth={1} />

        <g clipPath={`url(#${clipId})`}>
          <g
            style={{
              transform: `rotate(${roll}deg) translateY(${pitch}px)`,
              transformOrigin: "100px 100px",
              transition: "transform 0.9s ease",
            }}
          >
            <rect x={-40} y={-40} width={280} height={140} fill="url(#sky-49)" />
            <rect x={-40} y={100} width={280} height={180} fill="url(#ground-49)" />
            <line x1={-40} y1={100} x2={240} y2={100} stroke={C.ink} strokeWidth={1.4} />
            {[-40, -20, 20, 40].map((d) => (
              <g key={d}>
                <line
                  x1={100 - (d < 0 ? 18 : 12)}
                  y1={100 + d}
                  x2={100 + (d < 0 ? 18 : 12)}
                  y2={100 + d}
                  stroke={C.inkSoft}
                  strokeWidth={1}
                />
              </g>
            ))}
          </g>
        </g>

        {/* Vaste vliegtuig-referentie */}
        <g>
          <line x1={62} y1={100} x2={84} y2={100} stroke={C.amber} strokeWidth={3} />
          <line x1={116} y1={100} x2={138} y2={100} stroke={C.amber} strokeWidth={3} />
          <circle cx={100} cy={100} r={3} fill={C.amber} />
        </g>

        <circle cx={100} cy={100} r={84} fill="none" stroke={C.line} strokeWidth={2} />
        {/* Roll-ticks bovenaan */}
        {[-60, -45, -30, -15, 0, 15, 30, 45, 60].map((deg) => {
          const a = polar(100, 100, 84, deg + 180);
          const b = polar(100, 100, deg % 45 === 0 ? 74 : 79, deg + 180);
          return (
            <line
              key={deg}
              x1={a.x}
              y1={a.y}
              x2={b.x}
              y2={b.y}
              stroke={C.muted}
              strokeWidth={deg % 45 === 0 ? 1.6 : 1}
            />
          );
        })}
      </svg>
    </div>
  );
}

/* ---------- Indicatorlampje ---------- */

function Lamp({ tone, on = true }: { tone: Tone; on?: boolean }) {
  const color = TONE[tone].hex;
  return (
    <span
      aria-hidden="true"
      className="relative inline-flex h-3.5 w-3.5 items-center justify-center rounded-full"
      style={{
        background: C.well,
        boxShadow: `inset 0 0 0 1px ${C.line}`,
      }}
    >
      <span
        className={`h-2 w-2 rounded-full ${on ? "motion-safe:animate-pulse" : ""}`}
        style={{
          background: on ? color : C.faint,
          boxShadow: on ? `0 0 8px ${color}, 0 0 3px ${color}` : "none",
        }}
      />
    </span>
  );
}

/* ---------- Kicker / koppen ---------- */

function Kicker({ children }: { children: React.ReactNode }) {
  return (
    <p
      className="text-[10.5px] font-semibold uppercase tracking-[0.28em]"
      style={{ color: C.amber, ...mono }}
    >
      {children}
    </p>
  );
}

function SectionHead({ kicker, title, note }: { kicker: string; title: string; note?: string }) {
  return (
    <div>
      <Kicker>{kicker}</Kicker>
      <h1
        className="mt-2 text-[24px] font-semibold leading-tight tracking-tight sm:text-[28px]"
        style={{ ...display, color: C.ink }}
      >
        {title}
      </h1>
      {note && (
        <p className="mt-2 max-w-2xl text-[13px] leading-relaxed" style={{ color: C.inkSoft }}>
          {note}
        </p>
      )}
    </div>
  );
}

function Chip({ tone, children }: { tone: Tone; children: React.ReactNode }) {
  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10.5px] font-semibold"
      style={{
        color: TONE[tone].hex,
        background: TONE[tone].soft,
        border: `1px solid ${TONE[tone].hex}33`,
        ...mono,
      }}
    >
      {children}
    </span>
  );
}

/* ---------- Hoofdcomponent ---------- */

export function Concept49() {
  const [screen, setScreen] = useState<ScreenKey>("dashboard");
  const [activeId, setActiveId] = useState<string>(OPDRACHTEN[0]?.id ?? "");
  const active = OPDRACHTEN.find((o) => o.id === activeId) ?? (OPDRACHTEN[0] as Opdracht);

  const open = (id?: string) => {
    if (id) setActiveId(id);
    setScreen("opdracht");
  };

  return (
    <div
      className="relative min-h-[680px] w-full overflow-hidden antialiased"
      style={{ color: C.ink, background: C.panelBg, ...display }}
    >
      {/* Fijne rasterachtergrond — instrumentenpaneel */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 opacity-[0.5]"
        style={{
          backgroundImage: `linear-gradient(${C.lineSoft} 1px, transparent 1px), linear-gradient(90deg, ${C.lineSoft} 1px, transparent 1px)`,
          backgroundSize: "44px 44px",
          maskImage: "radial-gradient(120% 90% at 50% 0%, #000 40%, transparent 100%)",
        }}
      />

      <div className="relative flex min-h-[680px]">
        {/* Zijbalk */}
        <aside className="hidden w-[224px] shrink-0 flex-col p-4 md:flex">
          <div className="flex items-center gap-3 px-2 pb-6 pt-2">
            <div
              className="flex h-9 w-9 items-center justify-center rounded-xl"
              style={{
                background: `linear-gradient(180deg, ${C.panelHi}, ${C.well})`,
                border: `1px solid ${C.line}`,
                boxShadow: `0 0 14px ${C.amberSoft}`,
              }}
            >
              <GaugeIcon size={17} style={{ color: C.amber }} aria-hidden="true" />
            </div>
            <div className="leading-tight">
              <div className="text-[14px] font-semibold tracking-tight">Meter</div>
              <div className="text-[10px]" style={{ color: C.muted, ...mono }}>
                ZZP · instrumenten
              </div>
            </div>
          </div>

          <nav className="flex flex-col gap-1" aria-label="Hoofdnavigatie">
            {SCREENS.map((s) => {
              const Icon = NAV_ICONS[s.key];
              const on = s.key === screen;
              return (
                <button
                  key={s.key}
                  onClick={() => setScreen(s.key)}
                  aria-current={on ? "page" : undefined}
                  className="group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-[13px] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#f2b134]"
                  style={{
                    color: on ? C.ink : C.muted,
                    background: on ? C.panel : "transparent",
                    border: `1px solid ${on ? C.line : "transparent"}`,
                  }}
                >
                  <Icon size={16} aria-hidden="true" style={{ color: on ? C.amber : C.faint }} />
                  <span className="flex-1 font-medium">{s.label}</span>
                  {on && (
                    <span
                      className="h-1.5 w-1.5 rounded-full"
                      style={{ background: C.amber, boxShadow: `0 0 6px ${C.amber}` }}
                      aria-hidden="true"
                    />
                  )}
                </button>
              );
            })}
          </nav>

          <div className="mt-auto">
            <Panel className="p-3.5" screws>
              <div className="flex items-center gap-3">
                <div
                  className="flex h-9 w-9 items-center justify-center rounded-full text-[11px] font-semibold"
                  style={{
                    background: C.well,
                    border: `1px solid ${C.line}`,
                    color: C.amber,
                    ...mono,
                  }}
                >
                  {PROFIEL.initialen}
                </div>
                <div className="min-w-0">
                  <div className="truncate text-[12.5px] font-semibold">{PROFIEL.naam}</div>
                  <div
                    className="flex items-center gap-1.5 text-[10.5px]"
                    style={{ color: C.green, ...mono }}
                  >
                    <Lamp tone="green" /> {PROFIEL.trust}
                  </div>
                </div>
              </div>
            </Panel>
          </div>
        </aside>

        {/* Main */}
        <main className="flex min-w-0 flex-1 flex-col">
          <header
            className="flex h-16 shrink-0 items-center gap-3 px-5 sm:px-7"
            style={{ borderBottom: `1px solid ${C.lineSoft}` }}
          >
            <div className="flex items-center gap-2">
              <CircleDot size={14} style={{ color: C.green }} aria-hidden="true" />
              <h2 className="truncate text-[14px] font-semibold tracking-tight">
                {SCREENS.find((s) => s.key === screen)?.label}
              </h2>
              <span
                className="ml-1 hidden text-[10px] uppercase tracking-[0.2em] sm:inline"
                style={{ color: C.faint, ...mono }}
              >
                SYS · ONLINE
              </span>
            </div>
            <div className="ml-auto flex items-center gap-2.5">
              <button
                className="hidden items-center gap-2.5 rounded-lg px-3 py-2 text-[12px] transition-colors hover:bg-[#1b232a] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#f2b134] sm:flex"
                style={{
                  border: `1px solid ${C.line}`,
                  color: C.muted,
                  background: C.panel,
                  ...mono,
                }}
                aria-label="Zoeken openen"
              >
                <Search size={14} aria-hidden="true" />
                <span>Zoek opdrachten…</span>
              </button>
              <button
                className="relative rounded-lg p-2.5 transition-colors hover:bg-[#1b232a] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#f2b134]"
                style={{ border: `1px solid ${C.line}`, color: C.inkSoft, background: C.panel }}
                aria-label="Meldingen"
              >
                <Bell size={15} aria-hidden="true" />
                <span
                  className="absolute right-2 top-2 h-1.5 w-1.5 rounded-full"
                  style={{ background: C.amber, boxShadow: `0 0 6px ${C.amber}` }}
                  aria-hidden="true"
                />
              </button>
            </div>
          </header>

          {/* Mobiele tabs */}
          <div className="flex gap-1.5 overflow-x-auto px-4 py-2 md:hidden">
            {SCREENS.map((s) => {
              const on = s.key === screen;
              return (
                <button
                  key={s.key}
                  onClick={() => setScreen(s.key)}
                  aria-current={on ? "page" : undefined}
                  className="shrink-0 rounded-lg px-3 py-1.5 text-[12px] font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#f2b134]"
                  style={{
                    color: on ? C.ink : C.muted,
                    background: on ? C.panel : "transparent",
                    border: `1px solid ${on ? C.line : C.lineSoft}`,
                  }}
                >
                  {s.label}
                </button>
              );
            })}
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto px-5 py-6 sm:px-7">
            {screen === "dashboard" && <Dashboard onOpen={open} />}
            {screen === "marktplaats" && (
              <Marktplaats activeId={activeId} onSelect={setActiveId} onOpen={open} />
            )}
            {screen === "opdracht" && <OpdrachtDetail opdracht={active} />}
            {screen === "verificatie" && <Verificatie />}
            {screen === "acties" && <Acties />}
            {screen === "facturen" && <Facturen />}
          </div>
        </main>
      </div>
    </div>
  );
}

/* ---------- Dashboard — gauge-cluster ---------- */

function Dashboard({ onOpen }: { onOpen: (id?: string) => void }) {
  const ongelezen = BERICHTEN.filter((b) => b.ongelezen).length;
  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <SectionHead
          kicker="Instrumentencluster"
          title={`Aan boord, ${PROFIEL.naam.split(" ")[0]}`}
          note="Alle systemen nominaal. Vier meters houden je koers in de gaten; één waarschuwingslamp vraagt aandacht."
        />
        <div className="flex items-center gap-2">
          <Chip tone="green">
            <Power size={11} aria-hidden="true" /> Alle systemen nominaal
          </Chip>
        </div>
      </div>

      {/* Gauge-cluster */}
      <Panel className="p-5 sm:p-7" screws>
        <div className="mb-4 flex items-center justify-between">
          <span
            className="text-[10.5px] font-semibold uppercase tracking-[0.22em]"
            style={{ color: C.muted, ...mono }}
          >
            Hoofdcluster · realtime
          </span>
          <span
            className="flex items-center gap-1.5 text-[10.5px]"
            style={{ color: C.green, ...mono }}
          >
            <Lamp tone="green" /> LIVE
          </span>
        </div>
        <div className="grid grid-cols-2 gap-6 lg:grid-cols-4">
          {KPIS.map((k, i) => {
            const cfg = dialConfig(i);
            return (
              <div
                key={k.label}
                className="flex flex-col items-center rounded-xl p-2 transition-colors hover:bg-[#1b232a]"
              >
                <Gauge
                  value={digits(k.value)}
                  max={cfg.max}
                  display={k.value}
                  label={k.label}
                  tone={cfg.tone}
                  redFrom={cfg.redFrom}
                  size={168}
                />
                <div className="mt-1.5 flex items-center gap-1.5 text-[10.5px]" style={mono}>
                  <span style={{ color: k.up ? C.green : C.amber }}>
                    {k.up ? "▲" : "▼"} {k.trend}
                  </span>
                  <span style={{ color: C.faint }}>· {cfg.caption}</span>
                </div>
              </div>
            );
          })}
        </div>
      </Panel>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Beste matches */}
        <div className="space-y-6 lg:col-span-2">
          <Panel className="overflow-hidden" screws>
            <div
              className="flex items-center justify-between px-5 py-3.5"
              style={{ borderBottom: `1px solid ${C.lineSoft}` }}
            >
              <h3
                className="flex items-center gap-2 text-[13px] font-semibold tracking-tight"
                style={display}
              >
                <Radar size={15} style={{ color: C.amber }} aria-hidden="true" /> Radar · beste
                matches
              </h3>
              <span className="text-[10.5px]" style={{ color: C.muted, ...mono }}>
                verklaarbaar gesorteerd
              </span>
            </div>
            <div>
              {OPDRACHTEN.map((o, i) => (
                <button
                  key={o.id}
                  onClick={() => onOpen(o.id)}
                  className="flex w-full items-center gap-4 px-4 py-3.5 text-left transition-colors hover:bg-[#1b232a] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#f2b134]"
                  style={{ borderTop: i === 0 ? "none" : `1px solid ${C.lineSoft}` }}
                >
                  <MiniGauge value={o.match} tone={o.match >= 90 ? "green" : "amber"} />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[13.5px] font-medium">{o.titel}</p>
                    <p
                      className="mt-0.5 flex items-center gap-1.5 truncate text-[11.5px]"
                      style={{ color: C.muted, ...mono }}
                    >
                      <MapPin size={11} aria-hidden="true" /> {o.opdrachtgever} · {o.plaats}
                    </p>
                  </div>
                  <Readout
                    value={o.tarief.replace(/[^\d]/g, "")}
                    unit="€/u"
                    size="sm"
                    tone="green"
                  />
                  <ChevronRight size={16} aria-hidden="true" style={{ color: C.faint }} />
                </button>
              ))}
            </div>
          </Panel>

          {/* Berichten */}
          <Panel className="overflow-hidden" screws>
            <div
              className="flex items-center justify-between px-5 py-3.5"
              style={{ borderBottom: `1px solid ${C.lineSoft}` }}
            >
              <h3 className="text-[13px] font-semibold tracking-tight">Comms · berichten</h3>
              <span className="text-[10.5px]" style={{ color: C.amber, ...mono }}>
                {ongelezen} ongelezen
              </span>
            </div>
            {BERICHTEN.map((b, i) => (
              <div
                key={b.van}
                className="flex items-center gap-3.5 px-4 py-3.5"
                style={{ borderTop: i === 0 ? "none" : `1px solid ${C.lineSoft}` }}
              >
                <div
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-[10.5px] font-semibold"
                  style={{
                    background: C.well,
                    border: `1px solid ${b.ongelezen ? C.amber + "55" : C.line}`,
                    color: b.ongelezen ? C.amber : C.muted,
                    ...mono,
                  }}
                >
                  {b.initialen}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <p className="truncate text-[12.5px] font-semibold">{b.van}</p>
                    {b.ongelezen && <Lamp tone="amber" />}
                  </div>
                  <p className="truncate text-[11.5px]" style={{ color: C.muted }}>
                    {b.preview}
                  </p>
                </div>
                <span
                  className="shrink-0 text-[10.5px] tabular-nums"
                  style={{ color: C.faint, ...mono }}
                >
                  {b.tijd}
                </span>
              </div>
            ))}
          </Panel>
        </div>

        {/* Zijkolom: horizon + certificaten + actie */}
        <div className="space-y-6">
          <Panel className="p-5" screws>
            <div className="mb-3 flex items-center justify-between">
              <h3 className="flex items-center gap-2 text-[13px] font-semibold" style={display}>
                <Navigation size={14} style={{ color: C.amber }} aria-hidden="true" />{" "}
                Vertrouwenshorizon
              </h3>
              <Chip tone="green">stabiel</Chip>
            </div>
            <div className="mx-auto max-w-[220px]">
              <HorizonIndicator pitch={-6} roll={-4} />
            </div>
            <div className="mt-3 grid grid-cols-2 gap-2 text-center">
              <div
                className="rounded-lg py-2"
                style={{ background: C.well, border: `1px solid ${C.line}` }}
              >
                <div
                  className="text-[9.5px] uppercase tracking-[0.16em]"
                  style={{ color: C.muted, ...mono }}
                >
                  Niveau
                </div>
                <Readout value="Hoog" size="sm" tone="green" />
              </div>
              <div
                className="rounded-lg py-2"
                style={{ background: C.well, border: `1px solid ${C.line}` }}
              >
                <div
                  className="text-[9.5px] uppercase tracking-[0.16em]"
                  style={{ color: C.muted, ...mono }}
                >
                  Koers
                </div>
                <Readout value="036°" size="sm" tone="amber" />
              </div>
            </div>
          </Panel>

          <Panel className="p-5" screws>
            <h3 className="mb-3 flex items-center gap-2 text-[13px] font-semibold" style={display}>
              <ShieldCheck size={14} style={{ color: C.green }} aria-hidden="true" /> Statuslampjes
            </h3>
            <div className="space-y-2.5">
              {CREDENTIALS.map((c) => {
                const st = statusStyle(c.status);
                return (
                  <div key={c.naam} className="flex items-center gap-3">
                    <Lamp tone={st.tone} on={c.status !== "REJECTED"} />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[12px] font-medium">{c.naam}</p>
                    </div>
                    <span
                      className="text-[10px] font-semibold"
                      style={{ color: TONE[st.tone].hex, ...mono }}
                    >
                      {st.label}
                    </span>
                  </div>
                );
              })}
            </div>
          </Panel>

          {/* Aanbevolen actie */}
          <div
            className="relative overflow-hidden rounded-2xl p-5"
            style={{
              background: `linear-gradient(180deg, ${C.panelHi}, ${C.panel})`,
              border: `1px solid ${C.amber}44`,
              boxShadow: `0 0 30px -12px ${C.amberSoft}`,
            }}
          >
            <div className="flex items-center gap-2">
              <AlertTriangle size={13} style={{ color: C.amber }} aria-hidden="true" />
              <span
                className="text-[10px] font-semibold uppercase tracking-[0.24em]"
                style={{ color: C.amber, ...mono }}
              >
                Waarschuwing · nu
              </span>
            </div>
            <p className="mt-2 text-[16px] font-semibold leading-snug" style={display}>
              {ACTIES[0]?.titel}
            </p>
            <p className="mt-1.5 text-[12px] leading-relaxed" style={{ color: C.inkSoft }}>
              {ACTIES[0]?.detail}
            </p>
            <button
              onClick={() => onOpen()}
              className="mt-4 w-full rounded-lg py-2.5 text-[12.5px] font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#f2b134]"
              style={{ background: C.amber, color: "#1a1204" }}
            >
              {ACTIES[0]?.cta}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ---------- Marktplaats — lijst + detail-selectie ---------- */

function Marktplaats({
  activeId,
  onSelect,
  onOpen,
}: {
  activeId: string;
  onSelect: (id: string) => void;
  onOpen: (id?: string) => void;
}) {
  const [q, setQ] = useState("");
  const filtered = OPDRACHTEN.filter(
    (o) =>
      o.titel.toLowerCase().includes(q.toLowerCase()) ||
      o.plaats.toLowerCase().includes(q.toLowerCase()) ||
      o.opdrachtgever.toLowerCase().includes(q.toLowerCase()),
  );
  const sel = filtered.find((o) => o.id === activeId) ?? filtered[0];

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <SectionHead
        kicker="Marktradar"
        title="Open opdrachten"
        note="Elke opdracht heeft zijn eigen match-meter. Selecteer links; de detailmeter rechts stelt zich bij."
      />

      <Panel className="flex items-center gap-3 px-4 py-2.5" screws>
        <Search size={16} aria-hidden="true" style={{ color: C.amber }} />
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Zoek op titel, plaats of opdrachtgever…"
          aria-label="Opdrachten zoeken"
          className="w-full bg-transparent text-[13px] outline-none placeholder:text-[#788088]"
          style={{ color: C.ink, ...mono }}
        />
        <span className="shrink-0 text-[11px] tabular-nums" style={{ color: C.faint, ...mono }}>
          {filtered.length}/{OPDRACHTEN.length}
        </span>
      </Panel>

      {filtered.length === 0 ? (
        <Panel className="px-6 py-16 text-center" screws>
          <div
            className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl"
            style={{ background: C.well, border: `1px solid ${C.line}` }}
            aria-hidden="true"
          >
            <Search size={22} style={{ color: C.amber }} />
          </div>
          <p className="mt-4 text-[15px] font-semibold" style={display}>
            Geen signaal
          </p>
          <p className="mx-auto mt-1.5 max-w-xs text-[12.5px]" style={{ color: C.muted }}>
            De radar vindt niets voor &quot;{q}&quot;. Verbreed je zoekopdracht.
          </p>
          <button
            onClick={() => setQ("")}
            className="mt-5 inline-flex items-center gap-2 rounded-lg px-4 py-2 text-[12.5px] font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#f2b134]"
            style={{ background: C.amber, color: "#1a1204" }}
          >
            Radar resetten
          </button>
        </Panel>
      ) : (
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-[1.3fr_1fr]">
          {/* Lijst */}
          <div className="space-y-3">
            {filtered.map((o) => {
              const on = sel?.id === o.id;
              return (
                <button
                  key={o.id}
                  onClick={() => onSelect(o.id)}
                  className="w-full text-left transition-transform hover:-translate-y-0.5 focus-visible:outline-none"
                >
                  <div
                    className="relative flex items-center gap-4 rounded-2xl p-4"
                    style={{
                      background: on
                        ? `linear-gradient(180deg, ${C.panelHi}, ${C.panel})`
                        : C.panel,
                      border: `1px solid ${on ? C.amber + "66" : C.line}`,
                      boxShadow: on ? `0 0 26px -14px ${C.amberSoft}` : "none",
                    }}
                  >
                    <MiniGauge value={o.match} tone={o.match >= 90 ? "green" : "amber"} />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px]" style={{ color: C.faint, ...mono }}>
                          {o.id}
                        </span>
                        {on && <Lamp tone="amber" />}
                      </div>
                      <p className="truncate text-[14px] font-semibold leading-snug">{o.titel}</p>
                      <p
                        className="mt-0.5 flex items-center gap-1.5 truncate text-[11.5px]"
                        style={{ color: C.muted, ...mono }}
                      >
                        <MapPin size={11} aria-hidden="true" /> {o.opdrachtgever} · {o.plaats}
                      </p>
                    </div>
                    <div className="hidden text-right sm:block">
                      <Readout
                        value={o.tarief.replace(/[^\d]/g, "")}
                        unit="€/u"
                        size="sm"
                        tone="green"
                      />
                      <p className="mt-1 text-[10.5px]" style={{ color: C.muted, ...mono }}>
                        {o.uren}
                      </p>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Detailmeter */}
          {sel && (
            <Panel className="sticky top-4 h-fit p-5" screws>
              <div className="mb-2 flex items-center justify-between">
                <span
                  className="text-[10px] uppercase tracking-[0.2em]"
                  style={{ color: C.muted, ...mono }}
                >
                  Detailmeter
                </span>
                <span className="text-[10px]" style={{ color: C.faint, ...mono }}>
                  {sel.id}
                </span>
              </div>
              <div className="flex justify-center">
                <Gauge
                  value={sel.match}
                  max={100}
                  display={`${sel.match}%`}
                  label="Match-index"
                  tone={sel.match >= 90 ? "green" : "amber"}
                  redFrom={0.55}
                  size={200}
                />
              </div>
              <p className="mt-2 text-center text-[14px] font-semibold" style={display}>
                {sel.titel}
              </p>
              <div className="mt-4 grid grid-cols-3 gap-2">
                {[
                  {
                    l: "Tarief",
                    v: sel.tarief.replace(/[^\d]/g, ""),
                    u: "€/u",
                    t: "green" as Tone,
                  },
                  { l: "Omvang", v: sel.uren.replace(/[^\d]/g, ""), u: "u/w", t: "amber" as Tone },
                  {
                    l: "Start",
                    v: sel.start.replace(/[^\d]/g, "") || "—",
                    u: sel.start.includes("juli") ? "jul" : "",
                    t: "green" as Tone,
                  },
                ].map((m) => (
                  <div
                    key={m.l}
                    className="rounded-lg py-2 text-center"
                    style={{ background: C.well, border: `1px solid ${C.line}` }}
                  >
                    <div
                      className="text-[9px] uppercase tracking-[0.14em]"
                      style={{ color: C.muted, ...mono }}
                    >
                      {m.l}
                    </div>
                    <Readout value={m.v} unit={m.u} size="sm" tone={m.t} />
                  </div>
                ))}
              </div>
              <button
                onClick={() => onOpen(sel.id)}
                className="mt-4 flex w-full items-center justify-center gap-2 rounded-lg py-2.5 text-[12.5px] font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#f2b134]"
                style={{ background: C.amber, color: "#1a1204" }}
              >
                Opdracht openen <ChevronRight size={14} aria-hidden="true" />
              </button>
            </Panel>
          )}
        </div>
      )}
    </div>
  );
}

/* ---------- Opdracht-detail ---------- */

function OpdrachtDetail({ opdracht }: { opdracht: Opdracht }) {
  const [state, setState] = useState<"idle" | "sending" | "sent">("idle");
  const react = () => {
    if (state !== "idle") return;
    setState("sending");
    window.setTimeout(() => setState("sent"), 900);
  };
  const tone: Tone = opdracht.match >= 90 ? "green" : "amber";

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <Panel className="p-5 sm:p-7" screws>
        <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-5">
            <Gauge
              value={opdracht.match}
              max={100}
              display={`${opdracht.match}%`}
              label="Match"
              tone={tone}
              redFrom={0.55}
              size={150}
            />
            <div>
              <Kicker>{opdracht.id}</Kicker>
              <h1
                className="mt-1.5 text-[22px] font-semibold leading-tight tracking-tight"
                style={display}
              >
                {opdracht.titel}
              </h1>
              <p
                className="mt-1.5 flex items-center gap-1.5 text-[12.5px]"
                style={{ color: C.inkSoft, ...mono }}
              >
                <MapPin size={13} aria-hidden="true" /> {opdracht.opdrachtgever} · {opdracht.plaats}
              </p>
              <div className="mt-3 flex flex-wrap gap-1.5">
                {opdracht.tags.map((t) => (
                  <span
                    key={t}
                    className="rounded-md px-2 py-0.5 text-[10.5px]"
                    style={{
                      color: C.inkSoft,
                      background: C.well,
                      border: `1px solid ${C.line}`,
                      ...mono,
                    }}
                  >
                    {t}
                  </span>
                ))}
              </div>
            </div>
          </div>
          <button
            onClick={react}
            disabled={state !== "idle"}
            aria-live="polite"
            className="inline-flex shrink-0 items-center justify-center gap-2 rounded-lg px-5 py-2.5 text-[13px] font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#f2b134] disabled:opacity-90"
            style={{
              background: state === "sent" ? C.green : C.amber,
              color: state === "sent" ? "#04140d" : "#1a1204",
            }}
          >
            {state === "sending" && (
              <Loader2 size={15} aria-hidden="true" className="animate-spin" />
            )}
            {state === "sent" && <Check size={15} aria-hidden="true" />}
            {state === "idle" && <Send size={14} aria-hidden="true" />}
            {state === "idle"
              ? "Reageer op opdracht"
              : state === "sending"
                ? "Versturen…"
                : "Reactie verstuurd"}
          </button>
        </div>
      </Panel>

      {/* Metertjes voor de kernwaarden */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          { l: "Tarief", v: opdracht.tarief.replace(/[^\d]/g, ""), u: "€/u", t: "green" as Tone },
          { l: "Omvang", v: opdracht.uren.replace(/[^\d]/g, ""), u: "u/w", t: "amber" as Tone },
          { l: "Start", v: opdracht.start, u: "", t: "green" as Tone },
          { l: "Match", v: `${opdracht.match}`, u: "%", t: tone },
        ].map((m) => (
          <Panel key={m.l} className="p-4">
            <p
              className="text-[9.5px] font-medium uppercase tracking-[0.16em]"
              style={{ color: C.muted, ...mono }}
            >
              {m.l}
            </p>
            <div className="mt-2">
              <Readout value={m.v} unit={m.u} tone={m.t} />
            </div>
          </Panel>
        ))}
      </div>

      <Panel className="p-6" screws>
        <h3 className="flex items-center gap-2 text-[14px] font-semibold" style={display}>
          <Activity size={15} style={{ color: C.amber }} aria-hidden="true" /> Telemetrie · waarom
          deze match
        </h3>
        <p className="mt-1 text-[12px]" style={{ color: C.muted }}>
          Transparant onderbouwd op basis van je geverifieerde profiel.
        </p>
        <div className="mt-6 grid grid-cols-1 gap-8 sm:grid-cols-2">
          <div>
            <p
              className="flex items-center gap-1.5 text-[10.5px] font-semibold uppercase tracking-[0.16em]"
              style={{ color: C.green, ...mono }}
            >
              <Lamp tone="green" /> Pluspunten
            </p>
            <ul className="mt-3 space-y-2.5">
              {opdracht.redenen.plus.map((r) => (
                <li key={r} className="flex items-start gap-2.5 text-[13px]">
                  <Check
                    size={15}
                    className="mt-0.5 shrink-0"
                    style={{ color: C.green }}
                    aria-hidden="true"
                  />
                  {r}
                </li>
              ))}
            </ul>
          </div>
          <div>
            <p
              className="flex items-center gap-1.5 text-[10.5px] font-semibold uppercase tracking-[0.16em]"
              style={{ color: C.amber, ...mono }}
            >
              <Lamp tone="amber" /> Aandachtspunten
            </p>
            <ul className="mt-3 space-y-2.5">
              {opdracht.redenen.min.map((r) => (
                <li
                  key={r}
                  className="flex items-start gap-2.5 text-[13px]"
                  style={{ color: C.inkSoft }}
                >
                  <Minus
                    size={15}
                    className="mt-0.5 shrink-0"
                    style={{ color: C.amber }}
                    aria-hidden="true"
                  />
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

/* ---------- Verificatie — indicatorlampjes ---------- */

function Verificatie() {
  const verified = CREDENTIALS.filter((c) => c.status === "VERIFIED").length;
  const total = CREDENTIALS.length;
  const attention = CREDENTIALS.filter(
    (c) => c.status === "EXPIRING" || c.status === "REJECTED",
  ).length;

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <SectionHead
        kicker="Systeemcontrole"
        title="Verificatie"
        note="Elk certificaat is een indicatorlamp. Groen = veilig, amber = aandacht, rood = actie."
      />

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-[220px_1fr]">
        {/* Gereedheidsmeter */}
        <Panel className="flex flex-col items-center p-5" screws>
          <Gauge
            value={verified}
            max={total}
            display={`${verified}/${total}`}
            label="Gereedheid"
            tone="green"
            size={180}
          />
          <div className="mt-2 flex gap-2">
            <Chip tone="green">{verified} veilig</Chip>
            <Chip tone="amber">{attention} actie</Chip>
          </div>
        </Panel>

        {/* Lampenpaneel */}
        <Panel className="overflow-hidden" screws>
          <div className="px-5 py-3.5" style={{ borderBottom: `1px solid ${C.lineSoft}` }}>
            <h3 className="text-[13px] font-semibold" style={display}>
              Certificatenpaneel
            </h3>
          </div>
          {CREDENTIALS.map((c, i) => {
            const st = statusStyle(c.status);
            return (
              <div
                key={c.naam}
                className="flex items-center gap-4 px-5 py-4 transition-colors hover:bg-[#1b232a]"
                style={{ borderTop: i === 0 ? "none" : `1px solid ${C.lineSoft}` }}
              >
                <div
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl"
                  style={{ background: C.well, border: `1px solid ${TONE[st.tone].hex}33` }}
                >
                  {c.status === "SUBMITTED" ? (
                    <Loader2
                      size={17}
                      className="motion-safe:animate-spin"
                      style={{ color: TONE[st.tone].hex }}
                      aria-hidden="true"
                    />
                  ) : (
                    <st.Icon size={17} style={{ color: TONE[st.tone].hex }} aria-hidden="true" />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-[13.5px] font-medium">{c.naam}</p>
                  <p className="text-[11.5px]" style={{ color: C.muted, ...mono }}>
                    {c.detail}
                  </p>
                </div>
                <div className="flex items-center gap-2.5">
                  <Lamp tone={st.tone} on={c.status !== "REJECTED"} />
                  <Chip tone={st.tone}>{st.label}</Chip>
                </div>
              </div>
            );
          })}
        </Panel>
      </div>

      {/* Documenten */}
      <Panel className="overflow-hidden" screws>
        <div className="px-5 py-3.5" style={{ borderBottom: `1px solid ${C.lineSoft}` }}>
          <h3 className="text-[13px] font-semibold" style={display}>
            Documentenarchief
          </h3>
        </div>
        {DOCUMENTEN.map((d, i) => {
          const st = statusStyle(d.status);
          return (
            <div
              key={d.naam}
              className="flex items-center gap-3.5 px-4 py-3.5"
              style={{ borderTop: i === 0 ? "none" : `1px solid ${C.lineSoft}` }}
            >
              <span
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg"
                style={{ background: C.well, border: `1px solid ${C.line}` }}
                aria-hidden="true"
              >
                <FileText size={15} style={{ color: C.amber }} />
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-[12.5px] font-semibold">{d.naam}</p>
                <p className="truncate text-[11px]" style={{ color: C.muted, ...mono }}>
                  {d.type} · {d.grootte} · {d.bijgewerkt}
                </p>
              </div>
              <Chip tone={st.tone}>{st.label}</Chip>
            </div>
          );
        })}
      </Panel>
    </div>
  );
}

/* ---------- Acties ---------- */

function Acties() {
  const tone: Record<"warning" | "info", { t: Tone; Icon: LucideIcon; label: string }> = {
    warning: { t: "amber", Icon: AlertTriangle, label: "Waarschuwing" },
    info: { t: "green", Icon: Bell, label: "Melding" },
  };
  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <SectionHead
        kicker="Waarschuwingspaneel"
        title="Volgende acties"
        note="Op volgorde van urgentie — zoals waarschuwingslampjes die om aandacht vragen."
      />
      <div className="space-y-3.5">
        {ACTIES.map((a, i) => {
          const t = tone[a.urgentie];
          return (
            <Panel
              key={a.titel}
              className="flex items-start gap-4 p-5 transition-transform hover:-translate-y-0.5"
            >
              <div className="flex flex-col items-center gap-2 pt-0.5">
                <span
                  className="text-[10px] font-semibold tabular-nums"
                  style={{ color: C.faint, ...mono }}
                >
                  {String(i + 1).padStart(2, "0")}
                </span>
                <div
                  className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl"
                  style={{ background: C.well, border: `1px solid ${TONE[t.t].hex}44` }}
                >
                  <t.Icon size={19} style={{ color: TONE[t.t].hex }} aria-hidden="true" />
                </div>
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <Lamp tone={t.t} />
                  <Chip tone={t.t}>{t.label}</Chip>
                </div>
                <p className="mt-2 text-[13.5px] font-semibold">{a.titel}</p>
                <p className="mt-0.5 text-[12.5px]" style={{ color: C.muted }}>
                  {a.detail}
                </p>
              </div>
              <button
                className="shrink-0 self-center rounded-lg px-4 py-1.5 text-[12.5px] font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#f2b134]"
                style={{
                  color: TONE[t.t].hex,
                  background: TONE[t.t].soft,
                  border: `1px solid ${TONE[t.t].hex}44`,
                }}
              >
                {a.cta}
              </button>
            </Panel>
          );
        })}
      </div>
      <Panel className="flex items-center gap-4 p-5">
        <div
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full"
          style={{ background: C.well, border: `1px solid ${C.green}44` }}
        >
          <Check size={18} style={{ color: C.green }} aria-hidden="true" />
        </div>
        <p className="text-[12.5px] leading-relaxed" style={{ color: C.inkSoft }}>
          Alle systemen nominaal. Nieuwe waarschuwingen verschijnen hier zodra ze relevant worden —
          je hoeft de meters niet zelf te bewaken.
        </p>
      </Panel>
    </div>
  );
}

/* ---------- Facturen ---------- */

function Facturen() {
  const statusTone: Record<string, { t: Tone; Icon: LucideIcon; label: string }> = {
    Betaald: { t: "green", Icon: Check, label: "Betaald" },
    Openstaand: { t: "amber", Icon: Clock, label: "Openstaand" },
    Concept: { t: "amber", Icon: FileText, label: "Concept" },
  };
  const totaalBetaald = FACTUREN.filter((f) => f.status === "Betaald").reduce(
    (sum, f) => sum + digits(f.bedrag),
    0,
  );
  const totaalOpen = FACTUREN.filter((f) => f.status === "Openstaand").reduce(
    (sum, f) => sum + digits(f.bedrag),
    0,
  );

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <SectionHead
          kicker="Brandstofmeter"
          title="Facturen"
          note="Kasstroom afgelezen van de meters."
        />
        <button
          className="inline-flex shrink-0 items-center gap-2 rounded-lg px-4 py-2 text-[12.5px] font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#f2b134]"
          style={{ background: C.amber, color: "#1a1204" }}
        >
          <Plus size={14} aria-hidden="true" /> Nieuwe factuur
        </button>
      </div>

      {/* Twee brandstofmeters */}
      <div className="grid grid-cols-2 gap-3">
        <Panel className="flex items-center gap-4 p-5">
          <Fuel size={22} style={{ color: C.green }} aria-hidden="true" />
          <div>
            <p
              className="text-[9.5px] uppercase tracking-[0.18em]"
              style={{ color: C.muted, ...mono }}
            >
              Ontvangen
            </p>
            <Readout value={`€ ${totaalBetaald.toLocaleString("nl-NL")}`} tone="green" size="md" />
          </div>
        </Panel>
        <Panel className="flex items-center gap-4 p-5">
          <Clock size={22} style={{ color: C.amber }} aria-hidden="true" />
          <div>
            <p
              className="text-[9.5px] uppercase tracking-[0.18em]"
              style={{ color: C.muted, ...mono }}
            >
              Openstaand
            </p>
            <Readout value={`€ ${totaalOpen.toLocaleString("nl-NL")}`} tone="amber" size="md" />
          </div>
        </Panel>
      </div>

      <Panel className="overflow-hidden" screws>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr
                className="text-[10px] font-semibold uppercase tracking-[0.14em]"
                style={{ color: C.muted, borderBottom: `1px solid ${C.line}`, ...mono }}
              >
                <th className="px-5 py-3.5 font-semibold">Nummer</th>
                <th className="px-5 py-3.5 font-semibold">Klant</th>
                <th className="hidden px-5 py-3.5 font-semibold sm:table-cell">Datum</th>
                <th className="px-5 py-3.5 text-right font-semibold">Bedrag</th>
                <th className="px-5 py-3.5 text-right font-semibold">Status</th>
              </tr>
            </thead>
            <tbody>
              {FACTUREN.map((f) => {
                const t = statusTone[f.status] ?? statusTone.Concept!;
                return (
                  <tr
                    key={f.nr}
                    className="transition-colors hover:bg-[#1b232a]"
                    style={{ borderTop: `1px solid ${C.lineSoft}` }}
                  >
                    <td
                      className="px-5 py-4 text-[12px] tabular-nums"
                      style={{ color: C.inkSoft, ...mono }}
                    >
                      {f.nr}
                    </td>
                    <td className="px-5 py-4 text-[13px] font-medium">{f.klant}</td>
                    <td
                      className="hidden px-5 py-4 text-[12px] tabular-nums sm:table-cell"
                      style={{ color: C.muted, ...mono }}
                    >
                      {f.datum}
                    </td>
                    <td
                      className="px-5 py-4 text-right text-[13px] font-semibold tabular-nums"
                      style={mono}
                    >
                      {f.bedrag}
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex items-center justify-end gap-2">
                        <Lamp tone={t.t} on={f.status !== "Concept"} />
                        <Chip tone={t.t}>{t.label}</Chip>
                      </div>
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
