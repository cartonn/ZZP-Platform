"use client";

// Concept 288 — "Herbarium" · Botanische illustratie / herbarium-vel (light).
// Signature: een botanisch herbarium-vel op crème papier met een fijn raster. Lijngetekende
// plant-motieven (inline SVG line-art), handgeschreven-achtige specimen-labels met montage-hoeken,
// een gedroogd-plant-palet (bosgroen, mos, klei-bruin, botergeel accent) en classificatie-etiketten
// bij opdrachten (Soort / Familie / Habitat). Rustig, wetenschappelijk-elegant, natuurlijk vertrouwen.
// Fonts: --font-lab-newsreader (serif display) + --font-lab-cormorant (serif accent) + --font-lab-franklin (labels).

import { useState, type CSSProperties, type ReactNode } from "react";
import {
  Sprout,
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
  Bookmark,
  BookmarkCheck,
  TrendingUp,
  TrendingDown,
  Hourglass,
  ShieldCheck,
  Leaf,
  Flower2,
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

// Dried-plant herbarium palette on crème paper. Forest green, moss, clay brown, buttery accent.
const C = {
  paper: "#f4eede",
  paper2: "#efe7d3",
  card: "#fbf8ee",
  cardWarm: "#f6f0df",
  grid: "#e4dcc4",
  line: "#d7cdb2",
  lineSoft: "#e6ddc7",
  ink: "#2c3527",
  fg: "#3d4735",
  muted: "#77765f",
  faint: "#a49f84",
  forest: "#33573b",
  forestSoft: "#dbe4d3",
  moss: "#6a7c46",
  mossSoft: "#e2e6cf",
  clay: "#9c6239",
  claySoft: "#ecdcc9",
  butter: "#b58a1e",
  butterSoft: "#f0e7c6",
  rust: "#a24632",
  rustSoft: "#eed4cc",
};

const serif: CSSProperties = { fontFamily: "var(--font-lab-newsreader), Georgia, serif" };
const serifAlt: CSSProperties = { fontFamily: "var(--font-lab-cormorant), Georgia, serif" };
const sans: CSSProperties = { fontFamily: "var(--font-lab-franklin), system-ui, sans-serif" };

const RING =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#33573b] focus-visible:ring-offset-2 focus-visible:ring-offset-[#f4eede]";

// A faint herbarium grid — like the printed graticule on a mounting sheet.
const SHEET_GRID =
  "repeating-linear-gradient(0deg, transparent 0px, transparent 27px, rgba(51,87,59,0.05) 27px, rgba(51,87,59,0.05) 28px), repeating-linear-gradient(90deg, transparent 0px, transparent 27px, rgba(51,87,59,0.05) 27px, rgba(51,87,59,0.05) 28px)";

const NAV_ICONS: Record<ScreenKey, LucideIcon> = {
  dashboard: Sprout,
  marktplaats: Search,
  opdracht: Leaf,
  verificatie: ShieldCheck,
  acties: Check,
  facturen: Wallet,
  documenten: FileText,
  berichten: Flower2,
};

const PLAAT: Record<ScreenKey, string> = {
  dashboard: "I",
  marktplaats: "II",
  opdracht: "III",
  verificatie: "IV",
  acties: "V",
  facturen: "VI",
  documenten: "VII",
  berichten: "VIII",
};

// ---- Line-art plant illustrations (decorative, aria-hidden) ------------------

function FernSprig({ color, style }: { color: string; style?: CSSProperties }) {
  const pinnae = Array.from({ length: 9 });
  return (
    <svg
      viewBox="0 0 60 150"
      fill="none"
      aria-hidden="true"
      style={{ color, ...style }}
      preserveAspectRatio="xMidYMax meet"
    >
      <path
        d="M30 148 C 30 108 30 54 30 8"
        stroke="currentColor"
        strokeWidth={1.4}
        strokeLinecap="round"
      />
      {pinnae.map((_, i) => {
        const y = 22 + i * 13;
        const len = 24 - i * 1.9;
        return (
          <g key={i} opacity={0.9}>
            <path
              d={`M30 ${y} q ${-len * 0.55} ${-3} ${-len} ${-11}`}
              stroke="currentColor"
              strokeWidth={1.05}
              strokeLinecap="round"
            />
            <path
              d={`M30 ${y} q ${len * 0.55} ${-3} ${len} ${-11}`}
              stroke="currentColor"
              strokeWidth={1.05}
              strokeLinecap="round"
            />
          </g>
        );
      })}
      <circle cx={30} cy={6} r={2} fill="currentColor" />
    </svg>
  );
}

function LeafBranch({ color, style }: { color: string; style?: CSSProperties }) {
  const leaves = Array.from({ length: 6 });
  return (
    <svg viewBox="0 0 140 70" fill="none" aria-hidden="true" style={{ color, ...style }}>
      <path
        d="M6 64 C 46 50 92 34 134 8"
        stroke="currentColor"
        strokeWidth={1.4}
        strokeLinecap="round"
      />
      {leaves.map((_, i) => {
        const t = i / (leaves.length - 1);
        const x = 6 + t * 128;
        const y = 64 - t * 56;
        const up = i % 2 === 0;
        const rot = up ? -38 : 32;
        return (
          <g key={i} transform={`translate(${x} ${y}) rotate(${rot})`} opacity={0.9}>
            <ellipse cx={up ? 9 : -9} cy={0} rx={9} ry={4} stroke="currentColor" strokeWidth={1} />
            <path d={up ? "M0 0 L 18 0" : "M0 0 L -18 0"} stroke="currentColor" strokeWidth={0.8} />
          </g>
        );
      })}
    </svg>
  );
}

function SeedPod({ color, style }: { color: string; style?: CSSProperties }) {
  const seeds = Array.from({ length: 5 });
  return (
    <svg viewBox="0 0 46 120" fill="none" aria-hidden="true" style={{ color, ...style }}>
      <path
        d="M23 118 C 23 90 23 60 23 34"
        stroke="currentColor"
        strokeWidth={1.4}
        strokeLinecap="round"
      />
      <path
        d="M23 78 q -16 -6 -19 -22"
        stroke="currentColor"
        strokeWidth={1}
        strokeLinecap="round"
      />
      <path d="M23 96 q 16 -6 19 -20" stroke="currentColor" strokeWidth={1} strokeLinecap="round" />
      <path
        d="M23 34 C 12 26 12 8 23 4 C 34 8 34 26 23 34 Z"
        stroke="currentColor"
        strokeWidth={1.2}
      />
      {seeds.map((_, i) => (
        <circle key={i} cx={23} cy={11 + i * 4.6} r={1.6} fill="currentColor" opacity={0.8} />
      ))}
    </svg>
  );
}

// Herbarium mounting corners — the little photo-corner ticks on a specimen sheet.
function MountCorners({ color = C.line }: { color?: string }) {
  const base = "pointer-events-none absolute h-3 w-3";
  return (
    <>
      <span
        className={`${base} left-1.5 top-1.5`}
        style={{ borderTop: `1.5px solid ${color}`, borderLeft: `1.5px solid ${color}` }}
        aria-hidden="true"
      />
      <span
        className={`${base} right-1.5 top-1.5`}
        style={{ borderTop: `1.5px solid ${color}`, borderRight: `1.5px solid ${color}` }}
        aria-hidden="true"
      />
      <span
        className={`${base} bottom-1.5 left-1.5`}
        style={{ borderBottom: `1.5px solid ${color}`, borderLeft: `1.5px solid ${color}` }}
        aria-hidden="true"
      />
      <span
        className={`${base} bottom-1.5 right-1.5`}
        style={{ borderBottom: `1.5px solid ${color}`, borderRight: `1.5px solid ${color}` }}
        aria-hidden="true"
      />
    </>
  );
}

// ---- Primitives -------------------------------------------------------------

function Sheet({
  children,
  className,
  corners = false,
  style,
}: {
  children: ReactNode;
  className?: string;
  corners?: boolean;
  style?: CSSProperties;
}) {
  return (
    <div
      className={`relative rounded-[4px] ${className ?? ""}`}
      style={{ background: C.card, border: `1px solid ${C.line}`, ...style }}
    >
      {corners && <MountCorners />}
      {children}
    </div>
  );
}

// A small typed specimen label — the handwritten-style card tab of a herbarium sheet.
function SpecimenLabel({
  plaat,
  soort,
  familie,
  habitat,
  tone = C.forest,
}: {
  plaat: string;
  soort: string;
  familie: string;
  habitat: string;
  tone?: string;
}) {
  return (
    <div
      className="relative rounded-[3px] px-3.5 py-3"
      style={{ background: C.cardWarm, border: `1px solid ${C.line}` }}
    >
      <MountCorners color={C.lineSoft} />
      <div className="flex items-center justify-between gap-2">
        <span
          className="text-[9.5px] font-semibold uppercase tracking-[0.18em]"
          style={{ ...sans, color: C.muted }}
        >
          Herbarium · No. {plaat}
        </span>
        <Leaf size={12} strokeWidth={1.8} style={{ color: tone }} aria-hidden="true" />
      </div>
      <div className="mt-2 space-y-1.5">
        <LabelRow k="Soort" v={soort} italic tone={tone} />
        <LabelRow k="Familie" v={familie} />
        <LabelRow k="Habitat" v={habitat} />
      </div>
    </div>
  );
}

function LabelRow({
  k,
  v,
  italic,
  tone,
}: {
  k: string;
  v: string;
  italic?: boolean;
  tone?: string;
}) {
  return (
    <div className="flex items-baseline gap-2">
      <span
        className="w-[52px] shrink-0 text-[9.5px] font-semibold uppercase tracking-[0.12em]"
        style={{ ...sans, color: C.faint }}
      >
        {k}
      </span>
      <span
        className={`min-w-0 flex-1 text-[13px] leading-snug ${italic ? "italic" : ""}`}
        style={{ ...(italic ? serifAlt : serif), color: italic ? (tone ?? C.forest) : C.ink }}
      >
        {v}
      </span>
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
      return { label: "Geverifieerd", Icon: BadgeCheck, tone: C.forest, soft: C.forestSoft };
    case "SUBMITTED":
      return { label: "In beoordeling", Icon: Hourglass, tone: C.moss, soft: C.mossSoft };
    case "EXPIRING":
      return { label: "Verloopt bijna", Icon: TriangleAlert, tone: C.butter, soft: C.butterSoft };
    case "REJECTED":
      return { label: "Afgewezen", Icon: XCircle, tone: C.rust, soft: C.rustSoft };
  }
}

function StatusBadge({ status }: { status: CredStatus }) {
  const { label, Icon, tone, soft } = statusMeta(status);
  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-full py-1 pl-1.5 pr-3 text-[11px] font-semibold"
      style={{ ...sans, color: tone, background: soft, border: `1px solid ${tone}22` }}
    >
      <span
        className="flex h-4 w-4 items-center justify-center rounded-full"
        style={{ background: tone }}
        aria-hidden="true"
      >
        <Icon size={10} strokeWidth={2.4} color={C.card} />
      </span>
      {label}
    </span>
  );
}

function VitalityTag({ value, size = "md" }: { value: number; size?: "sm" | "md" }) {
  const tone = value >= 90 ? C.forest : value >= 82 ? C.moss : C.clay;
  const soft = value >= 90 ? C.forestSoft : value >= 82 ? C.mossSoft : C.claySoft;
  return (
    <span
      className="inline-flex items-center gap-2 rounded-full px-2.5 py-1"
      style={{ background: soft }}
      aria-label={`Match ${value} procent`}
    >
      <Leaf
        size={size === "sm" ? 12 : 14}
        strokeWidth={2}
        style={{ color: tone }}
        aria-hidden="true"
      />
      <span
        className={`font-medium tabular-nums leading-none ${size === "sm" ? "text-[14px]" : "text-[18px]"}`}
        style={{ ...serif, color: tone }}
      >
        {value}
      </span>
      <span
        className="text-[9px] font-semibold uppercase tracking-[0.14em]"
        style={{ ...sans, color: tone }}
      >
        match
      </span>
    </span>
  );
}

function Sparkline({ data, tone, height = 32 }: { data: number[]; tone: string; height?: number }) {
  const max = Math.max(...data);
  const min = Math.min(...data);
  const span = max - min || 1;
  const pts = data.map((v, i) => {
    const x = (i / (data.length - 1)) * 100;
    const y = 100 - ((v - min) / span) * 64 - 18;
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
      <polygon points={`0,100 ${line} 100,100`} fill={tone} opacity={0.1} />
      <polyline
        points={line}
        fill="none"
        stroke={tone}
        strokeWidth={1.6}
        strokeLinecap="round"
        strokeLinejoin="round"
        vectorEffect="non-scaling-stroke"
      />
    </svg>
  );
}

function LeafButton({
  children,
  onClick,
  tone = C.forest,
  variant = "solid",
  className,
  ariaLabel,
  ariaPressed,
  active,
}: {
  children: ReactNode;
  onClick?: () => void;
  tone?: string;
  variant?: "solid" | "outline";
  className?: string;
  ariaLabel?: string;
  ariaPressed?: boolean;
  active?: boolean;
}) {
  const [hot, setHot] = useState(false);
  const painted = active || hot;
  if (variant === "solid") {
    return (
      <button
        onClick={onClick}
        onMouseEnter={() => setHot(true)}
        onMouseLeave={() => setHot(false)}
        onFocus={() => setHot(true)}
        onBlur={() => setHot(false)}
        aria-label={ariaLabel}
        aria-pressed={ariaPressed}
        className={`inline-flex items-center justify-center gap-2 rounded-full px-5 py-2.5 text-[13px] font-semibold transition-colors duration-300 ${RING} ${className ?? ""}`}
        style={{ ...sans, color: C.card, background: hot ? C.ink : tone }}
      >
        {children}
      </button>
    );
  }
  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHot(true)}
      onMouseLeave={() => setHot(false)}
      onFocus={() => setHot(true)}
      onBlur={() => setHot(false)}
      aria-label={ariaLabel}
      aria-pressed={ariaPressed}
      className={`inline-flex items-center justify-center gap-2 rounded-full px-4 py-2 text-[12.5px] font-semibold transition-colors duration-300 ${RING} ${className ?? ""}`}
      style={{
        ...sans,
        color: tone,
        background: painted ? `${tone}18` : "transparent",
        border: `1px solid ${painted ? tone : C.line}`,
      }}
    >
      {children}
    </button>
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
    <div className="mb-8 flex items-start justify-between gap-6">
      <div>
        <div className="mb-2.5 flex items-center gap-2.5">
          <span className="h-px w-8" style={{ background: C.moss }} aria-hidden="true" />
          <span
            className="text-[11px] font-semibold uppercase tracking-[0.22em]"
            style={{ ...sans, color: C.muted }}
          >
            Plaat No. {PLAAT[screenKey]}
          </span>
        </div>
        <h1
          className="text-[30px] font-normal leading-tight tracking-tight sm:text-[36px]"
          style={{ ...serif, color: C.ink }}
        >
          {title}
        </h1>
        {sub && (
          <p
            className="mt-3 max-w-xl text-[14.5px] italic leading-relaxed"
            style={{ ...serifAlt, color: C.fg }}
          >
            {sub}
          </p>
        )}
      </div>
      <FernSprig color={C.moss} style={{ height: 66, width: 26, opacity: 0.55 }} />
    </div>
  );
}

// ---- Screens ----------------------------------------------------------------

function Dashboard({ onOpen }: { onOpen: (o: Opdracht) => void }) {
  const top = OPDRACHTEN[0] as Opdracht;
  const voornaam = PROFIEL.naam.split(" ")[0];
  const kpiTones = [C.forest, C.moss, C.clay, C.butter];
  return (
    <div>
      <Sheet corners className="mb-10 overflow-hidden">
        <div className="flex flex-wrap items-end justify-between gap-6 px-7 py-9 sm:px-10 sm:py-11">
          <div>
            <div
              className="mb-3 text-[11px] font-semibold uppercase tracking-[0.22em]"
              style={{ ...sans, color: C.moss }}
            >
              {PROFIEL.plaats} · {PROFIEL.rol}
            </div>
            <h1
              className="text-[34px] font-normal leading-none tracking-tight sm:text-[44px]"
              style={{ ...serif, color: C.ink }}
            >
              Goedemorgen, {voornaam}
            </h1>
            <p
              className="mt-4 max-w-md text-[15px] italic leading-relaxed"
              style={{ ...serifAlt, color: C.fg }}
            >
              Een gedroogd, geordend overzicht van je werk — elk stuk zorgvuldig op zijn plek
              gehecht.
            </p>
          </div>
          <div
            className="flex items-center gap-2.5 rounded-full px-4 py-2.5"
            style={{ background: C.forestSoft }}
          >
            <ShieldCheck size={16} strokeWidth={2} style={{ color: C.forest }} aria-hidden="true" />
            <span className="text-[12.5px] font-semibold" style={{ ...sans, color: C.forest }}>
              {PROFIEL.trust}
            </span>
          </div>
        </div>
        <div
          className="flex items-center gap-2 px-7 py-2.5 sm:px-10"
          style={{ borderTop: `1px solid ${C.lineSoft}`, background: C.cardWarm }}
        >
          <LeafBranch color={C.moss} style={{ height: 22, width: 44, opacity: 0.6 }} />
          <span
            className="text-[10.5px] uppercase tracking-[0.18em]"
            style={{ ...sans, color: C.faint }}
          >
            Verzameling · seizoen 2026
          </span>
        </div>
      </Sheet>

      <div className="mb-10 grid grid-cols-2 gap-3.5 lg:grid-cols-4">
        {KPIS.map((k, i) => {
          const Trend = k.up ? TrendingUp : TrendingDown;
          const tone = kpiTones[i % kpiTones.length] ?? C.forest;
          return (
            <Sheet key={k.label} className="p-5">
              <div className="flex items-center justify-between gap-2">
                <span
                  className="text-[10.5px] font-semibold uppercase tracking-[0.1em]"
                  style={{ ...sans, color: C.muted }}
                >
                  {k.label}
                </span>
                <span
                  className="inline-flex items-center gap-0.5 text-[11px] font-semibold tabular-nums"
                  style={{ ...sans, color: k.up ? C.forest : C.clay }}
                >
                  <Trend size={11} strokeWidth={2.2} aria-hidden="true" />
                  {k.trend}
                </span>
              </div>
              <div
                className="mt-2 text-[27px] font-normal tabular-nums leading-none"
                style={{ ...serif, color: C.ink }}
              >
                {k.value}
              </div>
              <div className="mt-3">
                <Sparkline data={k.spark} tone={tone} />
              </div>
            </Sheet>
          );
        })}
      </div>

      <div className="grid grid-cols-1 gap-7 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <div className="mb-4 flex items-center gap-2">
            <Leaf size={16} strokeWidth={2} style={{ color: C.forest }} aria-hidden="true" />
            <h2
              className="text-[16px] font-normal tracking-tight"
              style={{ ...serif, color: C.ink }}
            >
              Beste vondst
            </h2>
          </div>
          <button
            onClick={() => onOpen(top)}
            className={`group block w-full overflow-hidden rounded-[4px] p-0 text-left transition-colors duration-300 ${RING}`}
            style={{ background: C.card, border: `1px solid ${C.line}` }}
            onMouseEnter={(e) => (e.currentTarget.style.borderColor = C.moss)}
            onMouseLeave={(e) => (e.currentTarget.style.borderColor = C.line)}
          >
            <span className="flex items-stretch gap-0">
              <span
                className="hidden w-[92px] shrink-0 items-end justify-center py-6 sm:flex"
                style={{ background: C.cardWarm, borderRight: `1px solid ${C.lineSoft}` }}
              >
                <SeedPod color={C.moss} style={{ height: 96, width: 34, opacity: 0.7 }} />
              </span>
              <span className="min-w-0 flex-1 p-6">
                <span className="flex items-start justify-between gap-3">
                  <VitalityTag value={top.match} />
                  <span
                    className="text-[9.5px] font-semibold uppercase tracking-[0.18em]"
                    style={{ ...sans, color: C.faint }}
                  >
                    {top.id}
                  </span>
                </span>
                <span
                  className="mt-4 block text-[19px] font-normal leading-tight"
                  style={{ ...serif, color: C.ink }}
                >
                  {top.titel}
                </span>
                <span className="mt-1 block text-[13px]" style={{ ...sans, color: C.muted }}>
                  {top.opdrachtgever} · {top.plaats} · {top.tarief}
                </span>
                <span className="mt-3.5 flex flex-wrap gap-1.5">
                  {top.tags.map((t) => (
                    <span
                      key={t}
                      className="rounded-full px-2.5 py-0.5 text-[11px]"
                      style={{ ...sans, color: C.fg, background: C.paper2 }}
                    >
                      {t}
                    </span>
                  ))}
                </span>
                <span
                  className="mt-5 inline-flex items-center gap-1.5 text-[13px] font-semibold"
                  style={{ ...sans, color: C.forest }}
                >
                  Bekijk specimen
                  <ArrowRight
                    size={14}
                    strokeWidth={2}
                    className="transition-transform duration-300 group-hover:translate-x-1"
                    aria-hidden="true"
                  />
                </span>
              </span>
            </span>
          </button>

          <Sheet className="mt-5 flex items-start gap-4 p-6">
            <span
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full"
              style={{ background: C.forestSoft, color: C.forest }}
              aria-hidden="true"
            >
              <ShieldCheck size={21} strokeWidth={2} />
            </span>
            <div>
              <span className="inline-flex items-center gap-2">
                <span className="text-[14.5px] font-semibold" style={{ ...sans, color: C.ink }}>
                  {PROFIEL.trust}
                </span>
                <BadgeCheck
                  size={15}
                  strokeWidth={2}
                  style={{ color: C.forest }}
                  aria-hidden="true"
                />
              </span>
              <span
                className="mt-1 block text-[13px] leading-relaxed"
                style={{ ...sans, color: C.fg }}
              >
                Je documenten zijn geverifieerd en geordend — opdrachtgevers zien meteen een
                betrouwbaar dossier.
              </span>
            </div>
          </Sheet>
        </div>

        <div>
          <div className="mb-4 flex items-center gap-2">
            <Sprout size={16} strokeWidth={2} style={{ color: C.clay }} aria-hidden="true" />
            <h2
              className="text-[16px] font-normal tracking-tight"
              style={{ ...serif, color: C.ink }}
            >
              Vraagt aandacht
            </h2>
          </div>
          <ul className="space-y-3.5">
            {ACTIES.map((a) => {
              const tone = a.urgentie === "warning" ? C.clay : C.moss;
              const soft = a.urgentie === "warning" ? C.claySoft : C.mossSoft;
              return (
                <Sheet key={a.titel} className="overflow-hidden">
                  <span className="block h-1.5" style={{ background: soft }} aria-hidden="true" />
                  <div className="p-4">
                    <div
                      className="text-[13px] font-semibold leading-snug"
                      style={{ ...sans, color: C.ink }}
                    >
                      {a.titel}
                    </div>
                    <div
                      className="mt-1.5 inline-flex items-center gap-1 text-[12px] font-semibold"
                      style={{ ...sans, color: tone }}
                    >
                      {a.cta}
                      <ArrowRight size={12} strokeWidth={2.2} aria-hidden="true" />
                    </div>
                  </div>
                </Sheet>
              );
            })}
          </ul>
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
  const plants = [FernSprig, SeedPod, LeafBranch];
  return (
    <div>
      <ScreenHead
        screenKey="marktplaats"
        title="Veldwerk & vondsten"
        sub="Elke opdracht is geëtiketteerd als een specimen — met soort, familie en habitat."
      />

      <div
        className="mb-7 flex items-center gap-2.5 rounded-full px-5 py-3"
        style={{ background: C.card, border: `1px solid ${C.line}` }}
      >
        <Search size={16} className="shrink-0" style={{ color: C.moss }} aria-hidden="true" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Zoek in de verzameling — titel, plaats of vaardigheid…"
          aria-label="Zoek opdrachten"
          className="w-full bg-transparent text-[14px] outline-none placeholder:opacity-55"
          style={{ ...sans, color: C.ink }}
        />
        {query && (
          <button
            onClick={() => setQuery("")}
            className={`rounded-full px-3 py-1 text-[11px] font-semibold ${RING}`}
            style={{ ...sans, color: C.forest, background: C.forestSoft }}
          >
            Wis
          </button>
        )}
      </div>

      {filtered.length === 0 ? (
        <Sheet corners className="flex flex-col items-center gap-3 px-6 py-16 text-center">
          <FernSprig color={C.moss} style={{ height: 74, width: 30, opacity: 0.6 }} />
          <h3 className="text-[22px] font-normal" style={{ ...serif, color: C.ink }}>
            Leeg vel
          </h3>
          <p className="max-w-xs text-[13.5px] italic" style={{ ...serifAlt, color: C.muted }}>
            Geen specimen gevonden voor &ldquo;{query}&rdquo;. Probeer een andere zoekterm.
          </p>
          <div className="mt-1">
            <LeafButton onClick={() => setQuery("")} variant="outline" tone={C.forest}>
              Filter wissen
            </LeafButton>
          </div>
        </Sheet>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {filtered.map((o, idx) => {
            const isSaved = saved.has(o.id);
            const Plant = plants[idx % plants.length] ?? FernSprig;
            const tone = o.match >= 90 ? C.forest : o.match >= 82 ? C.moss : C.clay;
            return (
              <Sheet
                key={o.id}
                corners
                className="group flex h-full flex-col overflow-hidden transition-colors duration-300"
                style={{ borderColor: C.line }}
              >
                <div className="flex items-start justify-between gap-3 p-5 pb-0">
                  <VitalityTag value={o.match} size="sm" />
                  <button
                    onClick={() => toggleSave(o.id)}
                    aria-pressed={isSaved}
                    aria-label={isSaved ? "Verwijder uit bewaard" : "Bewaar specimen"}
                    className={`flex h-9 w-9 items-center justify-center rounded-full transition-colors ${RING}`}
                    style={{
                      color: isSaved ? tone : C.muted,
                      background: isSaved ? C.paper2 : "transparent",
                      border: `1px solid ${isSaved ? tone : C.line}`,
                    }}
                  >
                    {isSaved ? (
                      <BookmarkCheck size={16} strokeWidth={2.2} aria-hidden="true" />
                    ) : (
                      <Bookmark size={16} strokeWidth={2.2} aria-hidden="true" />
                    )}
                  </button>
                </div>

                <div className="flex items-center justify-center py-3">
                  <Plant color={tone} style={{ height: 58, width: 60, opacity: 0.55 }} />
                </div>

                <div className="px-5 pb-5">
                  <SpecimenLabel
                    plaat={o.id.replace("OPD-", "")}
                    soort={o.titel}
                    familie={o.opdrachtgever}
                    habitat={`${o.plaats} · ${o.tarief}`}
                    tone={tone}
                  />
                  <dl
                    className="mt-4 grid grid-cols-2 gap-x-3 gap-y-2.5 text-[12px]"
                    style={{ ...sans, color: C.fg }}
                  >
                    {[
                      { Icon: Clock, v: o.uren },
                      { Icon: Calendar, v: o.start },
                    ].map((m, mi) => (
                      <div key={mi} className="flex items-center gap-1.5">
                        <m.Icon
                          size={13}
                          strokeWidth={2}
                          style={{ color: C.faint }}
                          aria-hidden="true"
                        />
                        {m.v}
                      </div>
                    ))}
                  </dl>
                  <div className="mt-5">
                    <LeafButton onClick={() => onOpen(o)} tone={tone} className="w-full">
                      Bekijk specimen
                      <ArrowRight
                        size={14}
                        strokeWidth={2.2}
                        className="transition-transform group-hover:translate-x-1"
                        aria-hidden="true"
                      />
                    </LeafButton>
                  </div>
                </div>
              </Sheet>
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
  const tone = opdracht.match >= 90 ? C.forest : opdracht.match >= 82 ? C.moss : C.clay;
  return (
    <div>
      <div className="mb-6">
        <LeafButton
          onClick={onBack}
          variant="outline"
          tone={C.moss}
          ariaLabel="Terug naar veldwerk"
        >
          <ArrowLeft size={14} strokeWidth={2.2} aria-hidden="true" />
          Terug naar verzameling
        </LeafButton>
      </div>

      <Sheet corners className="overflow-hidden">
        <div className="flex flex-col gap-0 sm:flex-row">
          <div
            className="flex shrink-0 items-end justify-center px-8 py-8 sm:w-[180px]"
            style={{ background: C.cardWarm, borderRight: `1px solid ${C.lineSoft}` }}
          >
            <FernSprig color={tone} style={{ height: 150, width: 60, opacity: 0.7 }} />
          </div>
          <div className="flex-1 p-7">
            <div className="flex flex-wrap items-start justify-between gap-5">
              <div className="flex items-start gap-4">
                <VitalityTag value={opdracht.match} />
                <div>
                  <span
                    className="text-[9.5px] font-semibold uppercase tracking-[0.2em]"
                    style={{ ...sans, color: C.faint }}
                  >
                    {opdracht.id}
                  </span>
                  <h2
                    className="mt-1 text-[27px] font-normal leading-tight tracking-tight"
                    style={{ ...serif, color: C.ink }}
                  >
                    {opdracht.titel}
                  </h2>
                  <div className="mt-1 text-[14px] italic" style={{ ...serifAlt, color: C.muted }}>
                    {opdracht.opdrachtgever} · {opdracht.plaats}
                  </div>
                </div>
              </div>
              <LeafButton
                onClick={() => toggleSave(opdracht.id)}
                variant="outline"
                tone={C.clay}
                active={isSaved}
                ariaPressed={isSaved}
                ariaLabel={isSaved ? "Verwijder uit bewaard" : "Bewaar specimen"}
              >
                {isSaved ? (
                  <BookmarkCheck size={14} strokeWidth={2.2} aria-hidden="true" />
                ) : (
                  <Bookmark size={14} strokeWidth={2.2} aria-hidden="true" />
                )}
                {isSaved ? "Bewaard" : "Bewaar"}
              </LeafButton>
            </div>

            <div className="mt-6">
              <SpecimenLabel
                plaat={opdracht.id.replace("OPD-", "")}
                soort={opdracht.titel}
                familie={opdracht.opdrachtgever}
                habitat={opdracht.plaats}
                tone={tone}
              />
            </div>

            <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
              {[
                { Icon: Wallet, label: "Tarief", value: opdracht.tarief },
                { Icon: Clock, label: "Inzet", value: opdracht.uren },
                { Icon: Calendar, label: "Start", value: opdracht.start },
                { Icon: MapPin, label: "Plaats", value: opdracht.plaats },
              ].map((m) => (
                <div
                  key={m.label}
                  className="rounded-[4px] p-4"
                  style={{ background: C.cardWarm, border: `1px solid ${C.lineSoft}` }}
                >
                  <m.Icon size={15} strokeWidth={2} style={{ color: tone }} aria-hidden="true" />
                  <div
                    className="mt-2 text-[10px] font-semibold uppercase tracking-[0.1em]"
                    style={{ ...sans, color: C.muted }}
                  >
                    {m.label}
                  </div>
                  <div className="text-[14px] font-semibold" style={{ ...sans, color: C.ink }}>
                    {m.value}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </Sheet>

      <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
        <Sheet className="p-6">
          <div className="mb-3.5 flex items-center gap-2">
            <span
              className="flex h-7 w-7 items-center justify-center rounded-full"
              style={{ background: C.forestSoft, color: C.forest }}
              aria-hidden="true"
            >
              <Plus size={14} strokeWidth={2.6} />
            </span>
            <span className="text-[14.5px] font-semibold" style={{ ...sans, color: C.ink }}>
              Gunstige kenmerken
            </span>
          </div>
          <ul className="space-y-3">
            {opdracht.redenen.plus.map((r) => (
              <li
                key={r}
                className="flex items-start gap-2.5 text-[13.5px]"
                style={{ ...sans, color: C.fg }}
              >
                <Check
                  size={15}
                  strokeWidth={2.6}
                  className="mt-0.5 shrink-0"
                  style={{ color: C.forest }}
                  aria-hidden="true"
                />
                {r}
              </li>
            ))}
          </ul>
        </Sheet>
        <Sheet className="p-6">
          <div className="mb-3.5 flex items-center gap-2">
            <span
              className="flex h-7 w-7 items-center justify-center rounded-full"
              style={{ background: C.claySoft, color: C.clay }}
              aria-hidden="true"
            >
              <Minus size={14} strokeWidth={2.6} />
            </span>
            <span className="text-[14.5px] font-semibold" style={{ ...sans, color: C.ink }}>
              Even op letten
            </span>
          </div>
          <ul className="space-y-3">
            {opdracht.redenen.min.map((r) => (
              <li
                key={r}
                className="flex items-start gap-2.5 text-[13.5px]"
                style={{ ...sans, color: C.fg }}
              >
                <TriangleAlert
                  size={15}
                  strokeWidth={2}
                  className="mt-0.5 shrink-0"
                  style={{ color: C.clay }}
                  aria-hidden="true"
                />
                {r}
              </li>
            ))}
          </ul>
        </Sheet>
      </div>

      <div className="mt-5 flex flex-wrap items-center gap-3">
        <LeafButton
          onClick={() => setApplied((v) => !v)}
          tone={applied ? C.forest : C.clay}
          ariaPressed={applied}
          className="px-6 py-3 text-[14px]"
        >
          {applied ? (
            <Check size={17} strokeWidth={2.6} aria-hidden="true" />
          ) : (
            <ArrowRight size={17} strokeWidth={2.2} aria-hidden="true" />
          )}
          {applied ? "Reactie verstuurd" : "Reageer op opdracht"}
        </LeafButton>
        {applied && (
          <span className="text-[12.5px] italic" style={{ ...serifAlt, color: C.muted }}>
            De opdrachtgever reageert gemiddeld binnen 6 uur.
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
  return (
    <div>
      <ScreenHead
        screenKey="verificatie"
        title="Determinatie & bewaring"
        sub="Elke status heeft een eigen kleur, label én icoon — nooit alleen kleur. Documenten blijven privé."
      />

      <div className="mb-7 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {(["VERIFIED", "SUBMITTED", "EXPIRING", "REJECTED"] as CredStatus[]).map((s) => {
          const { label, Icon, tone, soft } = statusMeta(s);
          return (
            <div
              key={s}
              className="flex items-center gap-2.5 rounded-[4px] px-4 py-3.5"
              style={{ background: soft }}
            >
              <span
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full"
                style={{ background: tone, color: C.card }}
                aria-hidden="true"
              >
                <Icon size={15} strokeWidth={2.2} />
              </span>
              <span className="text-[12px] font-semibold" style={{ ...sans, color: C.ink }}>
                {label}
              </span>
            </div>
          );
        })}
      </div>

      <Sheet className="mb-7 flex items-center gap-4 p-6">
        <span
          className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full"
          style={{ background: C.forestSoft, color: C.forest }}
          aria-hidden="true"
        >
          <ShieldCheck size={24} strokeWidth={2} />
        </span>
        <div>
          <div className="text-[15px] font-semibold" style={{ ...sans, color: C.ink }}>
            {PROFIEL.trust}
          </div>
          <p className="mt-0.5 text-[13px]" style={{ ...sans, color: C.fg }}>
            Je documenten worden versleuteld bewaard en alleen gedeeld met jouw toestemming.
          </p>
        </div>
      </Sheet>

      <div className="grid grid-cols-1 gap-7 lg:grid-cols-3">
        <div className="space-y-3 lg:col-span-2">
          {CREDENTIALS.map((c) => {
            const done = checked.has(c.naam);
            const { tone, soft } = statusMeta(c.status);
            return (
              <Sheet key={c.naam} className="flex items-center gap-3.5 p-4">
                <button
                  onClick={() => toggleCheck(c.naam)}
                  aria-pressed={done}
                  aria-label={done ? `${c.naam} afgevinkt` : `Vink ${c.naam} af`}
                  className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full transition-colors ${RING}`}
                  style={{
                    border: `1.5px solid ${done ? C.forest : C.line}`,
                    background: done ? C.forest : "transparent",
                    color: C.card,
                  }}
                >
                  {done && <Check size={14} strokeWidth={2.6} aria-hidden="true" />}
                </button>
                <span
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full"
                  style={{ background: soft, color: tone }}
                  aria-hidden="true"
                >
                  <FileText size={16} strokeWidth={2} />
                </span>
                <div className="min-w-0 flex-1">
                  <div className="text-[14px] font-semibold" style={{ ...sans, color: C.ink }}>
                    {c.naam}
                  </div>
                  <div className="text-[12px]" style={{ ...sans, color: C.muted }}>
                    {c.detail}
                  </div>
                </div>
                <StatusBadge status={c.status} />
              </Sheet>
            );
          })}
        </div>

        <div>
          <div className="mb-4 flex items-center justify-between">
            <span
              className="inline-flex items-center gap-2 text-[15px] font-semibold"
              style={{ ...sans, color: C.ink }}
            >
              <FileText size={16} strokeWidth={2} style={{ color: C.clay }} aria-hidden="true" />
              Documenten
            </span>
            <button
              onClick={() => setFeedState(feedState === "loading" ? "ok" : "loading")}
              className={`flex h-8 w-8 items-center justify-center rounded-full ${RING}`}
              style={{ background: C.card, color: C.clay, border: `1px solid ${C.line}` }}
              aria-label="Vernieuw documenten"
            >
              <RefreshCw size={14} strokeWidth={2} aria-hidden="true" />
            </button>
          </div>

          <div className="mb-3.5 flex gap-1.5" role="tablist" aria-label="Documentweergave">
            {(["ok", "loading", "error"] as const).map((s) => (
              <button
                key={s}
                role="tab"
                aria-selected={feedState === s}
                onClick={() => setFeedState(s)}
                className={`rounded-full px-3.5 py-1 text-[11px] font-semibold transition-colors ${RING}`}
                style={{
                  ...sans,
                  color: feedState === s ? C.card : C.muted,
                  background: feedState === s ? C.forest : "transparent",
                  border: `1px solid ${feedState === s ? C.forest : C.line}`,
                }}
              >
                {s === "ok" ? "Geladen" : s === "loading" ? "Laden" : "Fout"}
              </button>
            ))}
          </div>

          {feedState === "loading" && (
            <ul className="space-y-2.5" aria-busy="true" aria-label="Documenten laden">
              {[0, 1, 2, 3].map((i) => (
                <Sheet key={i} className="p-4">
                  <div
                    className="h-3 w-2/3 animate-pulse rounded-full"
                    style={{ background: C.paper2 }}
                  />
                  <div
                    className="mt-2.5 h-2.5 w-1/3 animate-pulse rounded-full"
                    style={{ background: C.paper2 }}
                  />
                </Sheet>
              ))}
            </ul>
          )}

          {feedState === "error" && (
            <Sheet
              className="flex flex-col items-center gap-2 px-4 py-9 text-center"
              style={{ background: C.rustSoft }}
            >
              <span
                className="flex h-12 w-12 items-center justify-center rounded-full"
                style={{ background: C.card, color: C.rust }}
                aria-hidden="true"
              >
                <CircleAlert size={24} strokeWidth={2} />
              </span>
              <div className="text-[15px] font-semibold" style={{ ...sans, color: C.ink }}>
                Even niet gelukt
              </div>
              <p className="text-[12px]" style={{ ...sans, color: C.muted }}>
                We konden je documentenkluis niet bereiken. Probeer het zo nog eens.
              </p>
              <div className="mt-1">
                <LeafButton onClick={() => setFeedState("ok")} variant="outline" tone={C.rust}>
                  Opnieuw proberen
                </LeafButton>
              </div>
            </Sheet>
          )}

          {feedState === "ok" && (
            <ul className="space-y-2.5">
              {DOCUMENTEN.map((d) => {
                const { tone, soft } = statusMeta(d.status);
                return (
                  <Sheet key={d.naam} className="flex items-center gap-3 p-3.5">
                    <span
                      className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-[9px] font-bold"
                      style={{ ...sans, background: soft, color: tone }}
                      aria-hidden="true"
                    >
                      {d.type}
                    </span>
                    <div className="min-w-0 flex-1">
                      <div
                        className="truncate text-[12.5px] font-semibold"
                        style={{ ...sans, color: C.ink }}
                      >
                        {d.naam}
                      </div>
                      <div className="text-[11px] tabular-nums" style={{ ...sans, color: C.muted }}>
                        {d.grootte} · {d.bijgewerkt}
                      </div>
                    </div>
                    <StatusBadge status={d.status} />
                  </Sheet>
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
        title="Te verzorgen"
        sub="Wat vandaag om aandacht vraagt — vink af wat gedaan is."
      />

      {openCount === 0 ? (
        <Sheet corners className="flex flex-col items-center gap-3 px-6 py-16 text-center">
          <span
            className="flex h-16 w-16 items-center justify-center rounded-full"
            style={{ background: C.forestSoft, color: C.forest }}
            aria-hidden="true"
          >
            <Check size={30} strokeWidth={2.2} />
          </span>
          <h3 className="text-[22px] font-normal" style={{ ...serif, color: C.ink }}>
            Alles verzorgd
          </h3>
          <p className="max-w-xs text-[13.5px] italic" style={{ ...serifAlt, color: C.muted }}>
            Niets meer te doen vandaag. Het vel is compleet.
          </p>
        </Sheet>
      ) : (
        <>
          <div
            className="mb-5 inline-flex items-center gap-2.5 rounded-full px-4 py-2"
            style={{ background: C.mossSoft }}
          >
            <span
              className="flex h-6 w-6 items-center justify-center rounded-full text-[12px] font-bold tabular-nums"
              style={{ ...sans, background: C.moss, color: C.card }}
              aria-hidden="true"
            >
              {openCount}
            </span>
            <span className="text-[12.5px] font-semibold" style={{ ...sans, color: C.moss }}>
              {openCount} {openCount === 1 ? "taak" : "taken"} open
            </span>
          </div>

          <ul className="space-y-3.5">
            {ACTIES.map((a) => {
              const isDone = done.has(a.titel);
              const tone = isDone ? C.forest : a.urgentie === "warning" ? C.clay : C.moss;
              const soft = isDone
                ? C.forestSoft
                : a.urgentie === "warning"
                  ? C.claySoft
                  : C.mossSoft;
              return (
                <Sheet key={a.titel} className="overflow-hidden">
                  <span className="block h-1.5" style={{ background: soft }} aria-hidden="true" />
                  <div className="flex items-start gap-4 p-5">
                    <button
                      onClick={() => toggleDone(a.titel)}
                      aria-pressed={isDone}
                      aria-label={
                        isDone ? `${a.titel} afgerond` : `Markeer ${a.titel} als afgerond`
                      }
                      className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full transition-colors ${RING}`}
                      style={{
                        border: `1.5px solid ${isDone ? C.forest : C.line}`,
                        background: isDone ? C.forest : "transparent",
                        color: C.card,
                      }}
                    >
                      {isDone && <Check size={16} strokeWidth={2.6} aria-hidden="true" />}
                    </button>
                    <div className="min-w-0 flex-1">
                      <div
                        className="text-[15px] font-semibold leading-snug"
                        style={{
                          ...sans,
                          color: C.ink,
                          textDecoration: isDone ? "line-through" : "none",
                          opacity: isDone ? 0.55 : 1,
                        }}
                      >
                        {a.titel}
                      </div>
                      <p
                        className="mt-1 text-[12.5px]"
                        style={{ ...sans, color: C.muted, opacity: isDone ? 0.55 : 1 }}
                      >
                        {a.detail}
                      </p>
                      {!isDone && (
                        <span
                          className="mt-2.5 inline-flex items-center gap-1 rounded-full px-3 py-1.5 text-[12px] font-semibold"
                          style={{ ...sans, color: tone, background: soft }}
                        >
                          {a.cta}
                          <ArrowRight size={12} strokeWidth={2.2} aria-hidden="true" />
                        </span>
                      )}
                    </div>
                  </div>
                </Sheet>
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
  const statusMap = (status: string): { tone: string; soft: string; Icon: LucideIcon } =>
    status === "Betaald"
      ? { tone: C.forest, soft: C.forestSoft, Icon: Check }
      : status === "Openstaand"
        ? { tone: C.clay, soft: C.claySoft, Icon: Clock }
        : { tone: C.muted, soft: C.paper2, Icon: FileText };
  return (
    <div>
      <ScreenHead
        screenKey="facturen"
        title="Register"
        sub="Overzichtelijk bijgehouden — betaald, openstaand en concept, in nette cijfers."
      />

      <div className="mb-7 grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-3 lg:col-span-2">
          {[
            { label: "Betaald (mnd)", value: "€ 5.552", tone: C.forest },
            { label: "Openstaand", value: "€ 1.350", tone: C.clay },
            { label: "Concept", value: "€ 880", tone: C.muted },
          ].map((s) => (
            <Sheet key={s.label} className="p-5">
              <div
                className="text-[10.5px] font-semibold uppercase tracking-[0.1em]"
                style={{ ...sans, color: C.muted }}
              >
                {s.label}
              </div>
              <div
                className="mt-2 text-[24px] font-normal tabular-nums"
                style={{ ...serif, color: s.tone }}
              >
                {s.value}
              </div>
            </Sheet>
          ))}
        </div>
        <Sheet className="flex flex-col justify-between p-5">
          <div
            className="text-[10.5px] font-semibold uppercase tracking-[0.1em]"
            style={{ ...sans, color: C.muted }}
          >
            Bedrag per factuur
          </div>
          <Sparkline data={trend} tone={C.clay} height={48} />
        </Sheet>
      </div>

      <Sheet className="overflow-hidden p-2">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[560px] text-left">
            <thead>
              <tr style={{ borderBottom: `1px solid ${C.line}` }}>
                {["Factuur", "Klant", "Datum", "Bedrag", "Status"].map((h) => (
                  <th
                    key={h}
                    scope="col"
                    className="px-3 py-3 text-[10.5px] font-semibold uppercase tracking-[0.12em]"
                    style={{ ...sans, color: C.muted }}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {FACTUREN.map((f) => {
                const sm = statusMap(f.status);
                return (
                  <tr
                    key={f.nr}
                    className="transition-colors"
                    style={{ borderBottom: `1px solid ${C.lineSoft}` }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = C.cardWarm)}
                    onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                  >
                    <td
                      className="px-3 py-3.5 text-[12.5px] font-semibold tabular-nums"
                      style={{ ...sans, color: C.ink }}
                    >
                      {f.nr}
                    </td>
                    <td className="px-3 py-3.5 text-[13px]" style={{ ...sans, color: C.ink }}>
                      {f.klant}
                    </td>
                    <td
                      className="px-3 py-3.5 text-[12.5px] tabular-nums"
                      style={{ ...sans, color: C.muted }}
                    >
                      {f.datum}
                    </td>
                    <td
                      className="px-3 py-3.5 text-[13px] font-semibold tabular-nums"
                      style={{ ...sans, color: C.ink }}
                    >
                      {f.bedrag}
                    </td>
                    <td className="px-3 py-3.5">
                      <span
                        className="inline-flex items-center gap-1.5 rounded-full py-0.5 pl-1 pr-2.5 text-[11px] font-semibold"
                        style={{ ...sans, color: sm.tone, background: sm.soft }}
                      >
                        <span
                          className="flex h-4 w-4 items-center justify-center rounded-full"
                          style={{ background: sm.tone }}
                          aria-hidden="true"
                        >
                          <sm.Icon size={10} strokeWidth={2.6} color={C.card} />
                        </span>
                        {f.status}
                      </span>
                    </td>
                  </tr>
                );
              })}
              <tr>
                <td
                  className="px-3 py-3.5 text-[10.5px] font-semibold uppercase tracking-[0.1em]"
                  style={{ ...sans, color: C.muted }}
                >
                  Totaal
                </td>
                <td />
                <td />
                <td
                  className="px-3 py-3.5 text-[14px] font-normal tabular-nums"
                  style={{ ...serif, color: C.forest }}
                >
                  € 7.782
                </td>
                <td />
              </tr>
            </tbody>
          </table>
        </div>
      </Sheet>
    </div>
  );
}

// ---- Shell ------------------------------------------------------------------

export function Concept288() {
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
      style={{ ...sans, color: C.fg, background: C.paper, backgroundImage: SHEET_GRID }}
    >
      <div className="mx-auto flex min-h-[680px] max-w-6xl flex-col px-4 py-6 sm:px-6 sm:py-8">
        <header className="mb-7 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span
              className="flex h-11 w-11 items-center justify-center rounded-full"
              style={{ background: C.forest, color: C.card }}
              aria-hidden="true"
            >
              <Sprout size={19} strokeWidth={2.2} />
            </span>
            <div className="leading-tight">
              <div
                className="text-[20px] font-normal tracking-tight"
                style={{ ...serif, color: C.ink }}
              >
                Herbarium
              </div>
              <div
                className="text-[10px] font-semibold uppercase tracking-[0.24em]"
                style={{ ...sans, color: C.muted }}
              >
                ZZP platform · vel 288
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="hidden text-right leading-tight sm:block">
              <div className="text-[12.5px] font-semibold" style={{ ...sans, color: C.ink }}>
                {PROFIEL.naam}
              </div>
              <div
                className="inline-flex items-center gap-1 text-[11px]"
                style={{ ...sans, color: C.forest }}
              >
                <BadgeCheck size={12} strokeWidth={2} aria-hidden="true" />
                {PROFIEL.trust}
              </div>
            </div>
            <span
              className="flex h-11 w-11 items-center justify-center rounded-full text-[13px] font-semibold"
              style={{ ...serif, background: C.forestSoft, color: C.forest }}
              aria-hidden="true"
            >
              {PROFIEL.initialen}
            </span>
          </div>
        </header>

        <nav className="mb-9 flex flex-wrap gap-1.5 overflow-x-auto" aria-label="Hoofdnavigatie">
          {SCREENS.map((s) => {
            const on = s.key === screen;
            const Icon = NAV_ICONS[s.key];
            return (
              <button
                key={s.key}
                onClick={() => setScreen(s.key)}
                aria-current={on ? "page" : undefined}
                className={`inline-flex shrink-0 items-center gap-1.5 rounded-full px-4 py-2 text-[12.5px] font-semibold transition-colors duration-300 ${RING}`}
                style={{
                  ...sans,
                  color: on ? C.card : C.fg,
                  background: on ? C.forest : "transparent",
                  border: `1px solid ${on ? C.forest : C.line}`,
                }}
              >
                <Icon size={14} strokeWidth={2} aria-hidden="true" />
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
          className="mt-10 flex flex-wrap items-center justify-between gap-2 pt-5 text-[11px]"
          style={{ ...sans, borderTop: `1px solid ${C.line}`, color: C.muted }}
        >
          <span className="inline-flex items-center gap-1.5">
            <Leaf size={12} strokeWidth={2} style={{ color: C.moss }} aria-hidden="true" />
            {SCREENS.length} schermen · botanisch vel v288
          </span>
          <span className="italic" style={{ ...serifAlt }}>
            Rustig, natuurlijk, geordend
          </span>
        </footer>
      </div>
    </div>
  );
}
