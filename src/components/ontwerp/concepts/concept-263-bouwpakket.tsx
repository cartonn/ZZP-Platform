"use client";

// Concept 263 — "Bouwpakket" · Exploded-view montagehandleiding (light).
// Signature: the calm of a wordless IKEA/technical assembly manual. Thin engineering lines,
// numbered balloon callouts (a circle + dashed leader) that label each part, an exploded
// axonometric hero, and a "STAP 1 · 2 · 3" spine down every screen. Opdrachten are parts to fit;
// verification reads as "onderdeel geverifieerd / ontbreekt". One primary blue accent on paper
// white keeps it playful-technical yet razor clear.
// Fonts: IBM Plex Mono (labels/part-codes) + Inter (body). Blueprint blue #2563eb on #f6f7f9.

import { useState, type CSSProperties, type ReactNode } from "react";
import {
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
  Wrench,
  Package,
  Ruler,
  Bookmark,
  BookmarkCheck,
  TrendingUp,
  TrendingDown,
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

// Technical-manual palette: paper white, ink near-black, one blueprint blue.
const C = {
  paper: "#f6f7f9",
  paper2: "#eef1f5",
  card: "#ffffff",
  cardSoft: "#f3f5f8",
  line: "#d3d9e2",
  lineSoft: "#e4e8ee",
  ink: "#14181f",
  inkSoft: "#3b424e",
  muted: "#6b7280",
  faint: "#9aa2ad",
  blue: "#2563eb",
  blueDeep: "#1d4ed8",
  blueSoft: "#e5edfd",
  green: "#127a4b",
  greenSoft: "#dcefe6",
  amber: "#a76a0e",
  amberSoft: "#f6ecd6",
  red: "#c23b32",
  redSoft: "#f6dedb",
};

const mono = { fontFamily: "var(--font-lab-plex-mono)" };
const sans = { fontFamily: "var(--font-lab-inter)" };

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

const RING =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2563eb] focus-visible:ring-offset-2 focus-visible:ring-offset-[#f6f7f9]";

// A numbered balloon callout — a ringed circle with the step/part number.
function Balloon({
  n,
  tone = C.blue,
  size = 26,
}: {
  n: number | string;
  tone?: string;
  size?: number;
}) {
  return (
    <span
      className="inline-flex shrink-0 items-center justify-center rounded-full text-[12px] font-semibold tabular-nums"
      style={{
        ...mono,
        width: size,
        height: size,
        background: C.card,
        color: tone,
        border: `1.5px solid ${tone}`,
      }}
      aria-hidden="true"
    >
      {n}
    </span>
  );
}

function cardStyle(soft = false): CSSProperties {
  return {
    background: soft ? C.cardSoft : C.card,
    border: `1px solid ${C.line}`,
    borderRadius: 8,
    boxShadow: "0 1px 2px rgba(20,24,31,0.04)",
  };
}

function Card({
  children,
  soft,
  className,
  style,
}: {
  children: ReactNode;
  soft?: boolean;
  className?: string;
  style?: CSSProperties;
}) {
  return (
    <div className={className} style={{ ...cardStyle(soft), ...style }}>
      {children}
    </div>
  );
}

function statusMeta(s: CredStatus): { label: string; Icon: LucideIcon; fg: string; bg: string } {
  switch (s) {
    case "VERIFIED":
      return { label: "Onderdeel geverifieerd", Icon: BadgeCheck, fg: C.green, bg: C.greenSoft };
    case "SUBMITTED":
      return { label: "In montage", Icon: Clock, fg: C.blueDeep, bg: C.blueSoft };
    case "EXPIRING":
      return {
        label: "Slijtage — vervang bijna",
        Icon: TriangleAlert,
        fg: C.amber,
        bg: C.amberSoft,
      };
    case "REJECTED":
      return { label: "Onderdeel ontbreekt", Icon: XCircle, fg: C.red, bg: C.redSoft };
  }
}

function StatusChip({ status }: { status: CredStatus }) {
  const { label, Icon, fg, bg } = statusMeta(status);
  return (
    <span
      className="inline-flex items-center gap-1.5 px-2.5 py-0.5 text-[11px] font-medium"
      style={{ ...mono, color: fg, background: bg, border: `1px solid ${fg}`, borderRadius: 4 }}
    >
      <Icon size={12} strokeWidth={1.8} aria-hidden="true" />
      {label}
    </span>
  );
}

// The match score as a fit-gauge — a thin technical ring with a monospace read-out.
function FitGauge({ value, size = 60 }: { value: number; size?: number }) {
  const r = 25;
  const circ = 2 * Math.PI * r;
  const dash = (value / 100) * circ;
  return (
    <span className="relative shrink-0" style={{ width: size, height: size }} aria-hidden="true">
      <svg viewBox="0 0 64 64" width={size} height={size}>
        <circle cx={32} cy={32} r={r} fill="none" stroke={C.lineSoft} strokeWidth={3} />
        <circle
          cx={32}
          cy={32}
          r={r}
          fill="none"
          stroke={C.blue}
          strokeWidth={3}
          strokeLinecap="round"
          strokeDasharray={`${dash} ${circ}`}
          transform="rotate(-90 32 32)"
        />
        {/* tick marks */}
        {Array.from({ length: 8 }).map((_, i) => {
          const a = (i / 8) * Math.PI * 2;
          return (
            <line
              key={i}
              x1={32 + Math.cos(a) * 29}
              y1={32 + Math.sin(a) * 29}
              x2={32 + Math.cos(a) * 31}
              y2={32 + Math.sin(a) * 31}
              stroke={C.faint}
              strokeWidth={0.8}
            />
          );
        })}
      </svg>
      <span className="absolute inset-0 flex flex-col items-center justify-center leading-none">
        <span
          className="text-[16px] font-semibold tabular-nums"
          style={{ ...mono, color: C.blueDeep }}
        >
          {value}
        </span>
        <span
          className="text-[7px] font-medium uppercase tracking-[0.14em]"
          style={{ ...mono, color: C.muted }}
        >
          fit
        </span>
      </span>
    </span>
  );
}

// A technical bar sparkline with a dashed baseline.
function TechSpark({ data, height = 32 }: { data: number[]; height?: number }) {
  const max = Math.max(...data);
  const min = Math.min(...data);
  const span = max - min || 1;
  const n = data.length;
  const bw = 100 / n;
  return (
    <svg
      viewBox="0 0 100 100"
      preserveAspectRatio="none"
      className="w-full"
      style={{ height }}
      aria-hidden="true"
    >
      <line
        x1={0}
        y1={98}
        x2={100}
        y2={98}
        stroke={C.line}
        strokeWidth={1}
        strokeDasharray="3 3"
        vectorEffect="non-scaling-stroke"
      />
      {data.map((v, i) => {
        const h = ((v - min) / span) * 70 + 8;
        return (
          <rect
            key={i}
            x={i * bw + bw * 0.22}
            y={98 - h}
            width={bw * 0.56}
            height={h}
            fill={C.blue}
            opacity={0.3 + (i / n) * 0.6}
            rx={0.6}
          />
        );
      })}
    </svg>
  );
}

// The exploded-view hero: a stack of offset part-plates with dashed leader lines and balloons.
function ExplodedDiagram({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 160 110" className={className} fill="none" aria-hidden="true">
      {/* dashed assembly axis */}
      <line
        x1={80}
        y1={6}
        x2={80}
        y2={104}
        stroke={C.faint}
        strokeWidth={0.8}
        strokeDasharray="4 4"
      />
      {/* three offset plates in axonometric */}
      {[
        { y: 22, tone: C.blueSoft },
        { y: 50, tone: C.card },
        { y: 78, tone: C.cardSoft },
      ].map((p, i) => (
        <g key={i}>
          <path
            d={`M80 ${p.y - 12} L128 ${p.y} L80 ${p.y + 12} L32 ${p.y} Z`}
            fill={p.tone}
            stroke={C.blue}
            strokeWidth={1}
          />
          <path
            d={`M32 ${p.y} L32 ${p.y + 6} L80 ${p.y + 18} L80 ${p.y + 12}`}
            fill={C.blueSoft}
            stroke={C.blue}
            strokeWidth={0.8}
          />
          <path
            d={`M128 ${p.y} L128 ${p.y + 6} L80 ${p.y + 18} L80 ${p.y + 12}`}
            fill={C.cardSoft}
            stroke={C.blue}
            strokeWidth={0.8}
          />
        </g>
      ))}
      {/* balloon leaders */}
      <line
        x1={128}
        y1={22}
        x2={150}
        y2={16}
        stroke={C.blue}
        strokeWidth={0.8}
        strokeDasharray="3 2"
      />
      <circle cx={152} cy={14} r={6} fill={C.card} stroke={C.blue} strokeWidth={1} />
      <text
        x={152}
        y={17}
        fontSize={7}
        fill={C.blueDeep}
        textAnchor="middle"
        fontFamily="monospace"
      >
        1
      </text>
      <line
        x1={32}
        y1={50}
        x2={10}
        y2={44}
        stroke={C.blue}
        strokeWidth={0.8}
        strokeDasharray="3 2"
      />
      <circle cx={8} cy={42} r={6} fill={C.card} stroke={C.blue} strokeWidth={1} />
      <text x={8} y={45} fontSize={7} fill={C.blueDeep} textAnchor="middle" fontFamily="monospace">
        2
      </text>
      <line
        x1={128}
        y1={78}
        x2={150}
        y2={84}
        stroke={C.blue}
        strokeWidth={0.8}
        strokeDasharray="3 2"
      />
      <circle cx={152} cy={86} r={6} fill={C.card} stroke={C.blue} strokeWidth={1} />
      <text
        x={152}
        y={89}
        fontSize={7}
        fill={C.blueDeep}
        textAnchor="middle"
        fontFamily="monospace"
      >
        3
      </text>
    </svg>
  );
}

function StepHead({ step, title, sub }: { step: number; title: string; sub?: string }) {
  return (
    <div className="mb-6 flex items-start gap-3">
      <Balloon n={step} size={34} />
      <div>
        <div
          className="text-[10px] font-medium uppercase tracking-[0.24em]"
          style={{ ...mono, color: C.blue }}
        >
          Stap {step}
        </div>
        <h1
          className="text-[26px] font-bold leading-tight tracking-tight sm:text-[30px]"
          style={{ ...sans, color: C.ink }}
        >
          {title}
        </h1>
        {sub && (
          <p
            className="mt-1.5 max-w-xl text-[13.5px] leading-relaxed"
            style={{ ...sans, color: C.inkSoft }}
          >
            {sub}
          </p>
        )}
      </div>
    </div>
  );
}

// ---- Screens ---------------------------------------------------------------

function Dashboard({ onOpen }: { onOpen: () => void }) {
  const top = OPDRACHTEN[0] as Opdracht;
  const voornaam = PROFIEL.naam.split(" ")[0];
  return (
    <div>
      <Card className="mb-8 flex flex-wrap items-center justify-between gap-4 overflow-hidden p-5 sm:p-7">
        <div>
          <div
            className="mb-1 inline-flex items-center gap-1.5 text-[10px] font-medium uppercase tracking-[0.22em]"
            style={{ ...mono, color: C.blue }}
          >
            <Package size={12} strokeWidth={1.8} aria-hidden="true" />
            Montageoverzicht · {PROFIEL.plaats}
          </div>
          <h1
            className="text-[30px] font-bold leading-none tracking-tight sm:text-[36px]"
            style={{ ...sans, color: C.ink }}
          >
            Hoi {voornaam}, klaar om te bouwen?
          </h1>
          <p className="mt-2 text-[13.5px]" style={{ ...sans, color: C.inkSoft }}>
            Alle onderdelen liggen klaar. Eén stap vraagt vandaag om je aandacht.
          </p>
        </div>
        <ExplodedDiagram className="h-28 w-44 shrink-0" />
      </Card>

      <div className="mb-8 grid grid-cols-2 gap-3 lg:grid-cols-4">
        {KPIS.map((k, i) => {
          const Trend = k.up ? TrendingUp : TrendingDown;
          return (
            <Card key={k.label} className="relative p-4">
              <span className="absolute right-3 top-3">
                <Balloon n={i + 1} size={20} tone={C.faint} />
              </span>
              <span
                className="text-[10px] font-medium uppercase tracking-[0.1em]"
                style={{ ...mono, color: C.muted }}
              >
                {k.label}
              </span>
              <div
                className="mt-1 text-[26px] font-bold tabular-nums leading-none"
                style={{ ...sans, color: C.ink }}
              >
                {k.value}
              </div>
              <div
                className="mt-1.5 inline-flex items-center gap-0.5 text-[11px] font-semibold tabular-nums"
                style={{ ...mono, color: k.up ? C.green : C.amber }}
              >
                <Trend size={11} strokeWidth={1.8} aria-hidden="true" />
                {k.trend}
              </div>
              <div className="mt-2">
                <TechSpark data={k.spark} />
              </div>
            </Card>
          );
        })}
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <div className="mb-3 flex items-center gap-2">
            <Wrench size={15} strokeWidth={1.8} style={{ color: C.blue }} aria-hidden="true" />
            <h2
              className="text-[13px] font-bold uppercase tracking-[0.1em]"
              style={{ ...mono, color: C.ink }}
            >
              Eerst monteren
            </h2>
          </div>
          <button
            onClick={onOpen}
            className={`group flex w-full items-start gap-4 p-5 text-left transition-transform hover:-translate-y-0.5 ${RING}`}
            style={cardStyle()}
          >
            <FitGauge value={top.match} />
            <div className="min-w-0 flex-1">
              <div
                className="text-[17px] font-bold leading-tight"
                style={{ ...sans, color: C.ink }}
              >
                {top.titel}
              </div>
              <div className="mt-0.5 text-[13px]" style={{ ...sans, color: C.muted }}>
                {top.opdrachtgever} · {top.plaats} · {top.tarief}
              </div>
              <div className="mt-3 flex flex-wrap gap-1.5">
                {top.tags.map((t) => (
                  <span
                    key={t}
                    className="px-2.5 py-0.5 text-[11px]"
                    style={{
                      ...mono,
                      color: C.inkSoft,
                      border: `1px solid ${C.line}`,
                      borderRadius: 4,
                    }}
                  >
                    {t}
                  </span>
                ))}
              </div>
            </div>
            <ArrowRight
              size={19}
              className="mt-1 shrink-0 transition-transform group-hover:translate-x-1"
              style={{ color: C.blue }}
              aria-hidden="true"
            />
          </button>

          <Card soft className="mt-6 flex items-start gap-4 p-5">
            <span
              className="flex h-12 w-12 shrink-0 items-center justify-center"
              style={{
                background: C.greenSoft,
                color: C.green,
                border: `1px solid ${C.green}`,
                borderRadius: 8,
              }}
              aria-hidden="true"
            >
              <ShieldCheck size={24} strokeWidth={1.8} />
            </span>
            <div>
              <div className="inline-flex items-center gap-2">
                <span className="text-[14px] font-bold" style={{ ...sans, color: C.ink }}>
                  {PROFIEL.trust}
                </span>
                <BadgeCheck
                  size={15}
                  strokeWidth={1.8}
                  style={{ color: C.green }}
                  aria-hidden="true"
                />
              </div>
              <p className="mt-1 text-[13px] leading-relaxed" style={{ ...sans, color: C.inkSoft }}>
                Alle onderdelen zijn gecontroleerd en passen — opdrachtgevers zien meteen dat de
                montage klopt.
              </p>
            </div>
          </Card>
        </div>

        <div>
          <div className="mb-3 flex items-center gap-2">
            <ListTodo size={15} strokeWidth={1.8} style={{ color: C.blue }} aria-hidden="true" />
            <h2
              className="text-[13px] font-bold uppercase tracking-[0.1em]"
              style={{ ...mono, color: C.ink }}
            >
              Montagestappen
            </h2>
          </div>
          <ul className="space-y-2.5">
            {ACTIES.map((a, i) => (
              <Card key={a.titel} className="flex items-start gap-3 p-3.5">
                <Balloon n={i + 1} tone={a.urgentie === "warning" ? C.amber : C.blue} />
                <div className="min-w-0">
                  <div
                    className="text-[12.5px] font-semibold leading-snug"
                    style={{ ...sans, color: C.ink }}
                  >
                    {a.titel}
                  </div>
                  <div className="mt-0.5 text-[11px]" style={{ ...mono, color: C.blue }}>
                    {a.cta}
                  </div>
                </div>
              </Card>
            ))}
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
  return (
    <div>
      <StepHead
        step={2}
        title="Kies je onderdelen"
        sub="Elke opdracht is een onderdeel — we tonen precies hoe goed het past en waar het schuurt."
      />

      <div className="mb-6 flex items-center gap-2 px-4 py-2.5" style={cardStyle()}>
        <Search size={16} className="shrink-0" style={{ color: C.blue }} aria-hidden="true" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Zoek op titel, plaats of vaardigheid…"
          aria-label="Zoek opdrachten"
          className="w-full bg-transparent py-1 text-[13.5px] outline-none placeholder:opacity-60"
          style={{ ...sans, color: C.ink }}
        />
        {query && (
          <button
            onClick={() => setQuery("")}
            className={`px-2.5 py-1 text-[11px] font-semibold ${RING}`}
            style={{ ...mono, color: C.blueDeep, background: C.blueSoft, borderRadius: 4 }}
          >
            Wis
          </button>
        )}
      </div>

      {filtered.length === 0 ? (
        <Card className="flex flex-col items-center gap-3 px-6 py-14 text-center">
          <Package size={40} strokeWidth={1.5} style={{ color: C.blue }} aria-hidden="true" />
          <h3 className="text-[19px] font-bold" style={{ ...sans, color: C.ink }}>
            Geen onderdeel gevonden
          </h3>
          <p className="max-w-xs text-[13px]" style={{ ...sans, color: C.muted }}>
            Geen match voor &ldquo;{query}&rdquo;. Probeer een andere zoekterm — de doos is groot.
          </p>
          <button
            onClick={() => setQuery("")}
            className={`mt-1 px-5 py-2 text-[13px] font-semibold text-white ${RING}`}
            style={{ ...sans, background: C.blue, borderRadius: 6 }}
          >
            Filter wissen
          </button>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {filtered.map((o, i) => {
            const isSaved = saved.has(o.id);
            return (
              <Card
                key={o.id}
                className="relative flex h-full flex-col p-5 transition-transform hover:-translate-y-0.5"
              >
                <span className="absolute -left-2 -top-2">
                  <Balloon n={i + 1} size={26} />
                </span>
                <div className="flex items-start justify-between gap-3">
                  <FitGauge value={o.match} size={54} />
                  <button
                    onClick={() => toggleSave(o.id)}
                    aria-pressed={isSaved}
                    aria-label={isSaved ? "Verwijder uit bewaard" : "Bewaar opdracht"}
                    className={`flex h-9 w-9 items-center justify-center transition-colors ${RING}`}
                    style={{
                      background: isSaved ? C.blueSoft : "transparent",
                      color: isSaved ? C.blue : C.muted,
                      border: `1px solid ${isSaved ? C.blue : C.line}`,
                      borderRadius: 6,
                    }}
                  >
                    {isSaved ? (
                      <BookmarkCheck size={15} strokeWidth={1.8} aria-hidden="true" />
                    ) : (
                      <Bookmark size={15} strokeWidth={1.8} aria-hidden="true" />
                    )}
                  </button>
                </div>
                <div
                  className="mt-3 text-[10px] font-medium uppercase tracking-[0.14em]"
                  style={{ ...mono, color: C.blue }}
                >
                  Onderdeel {o.id}
                </div>
                <h3
                  className="mt-0.5 text-[15.5px] font-bold leading-tight"
                  style={{ ...sans, color: C.ink }}
                >
                  {o.titel}
                </h3>
                <div className="mt-0.5 text-[12.5px]" style={{ ...sans, color: C.muted }}>
                  {o.opdrachtgever}
                </div>
                <dl
                  className="mt-3 grid grid-cols-2 gap-x-3 gap-y-2 text-[12px]"
                  style={{ ...sans, color: C.inkSoft }}
                >
                  <div className="flex items-center gap-1.5">
                    <MapPin
                      size={13}
                      strokeWidth={1.8}
                      style={{ color: C.faint }}
                      aria-hidden="true"
                    />
                    {o.plaats}
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Wallet
                      size={13}
                      strokeWidth={1.8}
                      style={{ color: C.faint }}
                      aria-hidden="true"
                    />
                    {o.tarief}
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Clock
                      size={13}
                      strokeWidth={1.8}
                      style={{ color: C.faint }}
                      aria-hidden="true"
                    />
                    {o.uren}
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Calendar
                      size={13}
                      strokeWidth={1.8}
                      style={{ color: C.faint }}
                      aria-hidden="true"
                    />
                    {o.start}
                  </div>
                </dl>
                <button
                  onClick={() => onOpen(o)}
                  className={`group mt-4 inline-flex items-center justify-center gap-1.5 py-2.5 text-[13px] font-semibold text-white transition-colors ${RING}`}
                  style={{ ...sans, background: C.blue, borderRadius: 6 }}
                >
                  Bekijk montage
                  <ArrowRight
                    size={14}
                    strokeWidth={1.8}
                    className="transition-transform group-hover:translate-x-1"
                    aria-hidden="true"
                  />
                </button>
              </Card>
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
        className={`mb-5 inline-flex items-center gap-1.5 px-4 py-1.5 text-[12px] font-semibold ${RING}`}
        style={{
          ...mono,
          color: C.inkSoft,
          background: C.cardSoft,
          border: `1px solid ${C.line}`,
          borderRadius: 6,
        }}
      >
        <ArrowLeft size={14} strokeWidth={1.8} aria-hidden="true" />
        Terug naar onderdelen
      </button>

      <Card className="p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex items-start gap-4">
            <FitGauge value={opdracht.match} size={70} />
            <div>
              <div
                className="text-[10px] font-medium uppercase tracking-[0.2em]"
                style={{ ...mono, color: C.blue }}
              >
                Onderdeel {opdracht.id}
              </div>
              <h2
                className="text-[22px] font-bold leading-tight tracking-tight"
                style={{ ...sans, color: C.ink }}
              >
                {opdracht.titel}
              </h2>
              <div className="mt-1 text-[13.5px]" style={{ ...sans, color: C.muted }}>
                {opdracht.opdrachtgever} · {opdracht.plaats}
              </div>
            </div>
          </div>
          <button
            onClick={() => toggleSave(opdracht.id)}
            aria-pressed={isSaved}
            className={`inline-flex items-center gap-1.5 px-4 py-2 text-[12px] font-semibold ${RING}`}
            style={{
              ...mono,
              color: isSaved ? C.blue : C.inkSoft,
              background: isSaved ? C.blueSoft : C.cardSoft,
              border: `1px solid ${isSaved ? C.blue : C.line}`,
              borderRadius: 6,
            }}
          >
            {isSaved ? (
              <BookmarkCheck size={14} strokeWidth={1.8} aria-hidden="true" />
            ) : (
              <Bookmark size={14} strokeWidth={1.8} aria-hidden="true" />
            )}
            {isSaved ? "Bewaard" : "Bewaar"}
          </button>
        </div>

        <div className="mt-5 grid grid-cols-2 gap-2.5 sm:grid-cols-4">
          {[
            { Icon: Wallet, label: "Tarief", value: opdracht.tarief },
            { Icon: Clock, label: "Inzet", value: opdracht.uren },
            { Icon: Calendar, label: "Start", value: opdracht.start },
            { Icon: MapPin, label: "Plaats", value: opdracht.plaats },
          ].map((m) => (
            <div
              key={m.label}
              className="p-3"
              style={{ background: C.cardSoft, border: `1px solid ${C.line}`, borderRadius: 6 }}
            >
              <m.Icon size={14} strokeWidth={1.8} style={{ color: C.blue }} aria-hidden="true" />
              <div
                className="mt-1 text-[9.5px] font-medium uppercase tracking-[0.12em]"
                style={{ ...mono, color: C.muted }}
              >
                {m.label}
              </div>
              <div className="text-[13.5px] font-semibold" style={{ ...sans, color: C.ink }}>
                {m.value}
              </div>
            </div>
          ))}
        </div>
      </Card>

      <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
        <Card className="p-5">
          <div className="mb-3 flex items-center gap-2">
            <span
              className="flex h-6 w-6 items-center justify-center"
              style={{
                background: C.greenSoft,
                color: C.green,
                border: `1px solid ${C.green}`,
                borderRadius: 6,
              }}
              aria-hidden="true"
            >
              <Plus size={13} strokeWidth={2.2} />
            </span>
            <span
              className="text-[13px] font-bold uppercase tracking-[0.08em]"
              style={{ ...mono, color: C.ink }}
            >
              Past goed omdat
            </span>
          </div>
          <ul className="space-y-2.5">
            {opdracht.redenen.plus.map((r) => (
              <li
                key={r}
                className="flex items-start gap-2 text-[13px]"
                style={{ ...sans, color: C.inkSoft }}
              >
                <Check
                  size={15}
                  strokeWidth={2.2}
                  className="mt-0.5 shrink-0"
                  style={{ color: C.green }}
                  aria-hidden="true"
                />
                {r}
              </li>
            ))}
          </ul>
        </Card>
        <Card className="p-5">
          <div className="mb-3 flex items-center gap-2">
            <span
              className="flex h-6 w-6 items-center justify-center"
              style={{
                background: C.amberSoft,
                color: C.amber,
                border: `1px solid ${C.amber}`,
                borderRadius: 6,
              }}
              aria-hidden="true"
            >
              <Minus size={13} strokeWidth={2.2} />
            </span>
            <span
              className="text-[13px] font-bold uppercase tracking-[0.08em]"
              style={{ ...mono, color: C.ink }}
            >
              Let op bij montage
            </span>
          </div>
          <ul className="space-y-2.5">
            {opdracht.redenen.min.map((r) => (
              <li
                key={r}
                className="flex items-start gap-2 text-[13px]"
                style={{ ...sans, color: C.inkSoft }}
              >
                <TriangleAlert
                  size={15}
                  strokeWidth={1.8}
                  className="mt-0.5 shrink-0"
                  style={{ color: C.amber }}
                  aria-hidden="true"
                />
                {r}
              </li>
            ))}
          </ul>
        </Card>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-3">
        <button
          onClick={() => setApplied((v) => !v)}
          aria-pressed={applied}
          className={`inline-flex items-center gap-2 px-6 py-3 text-[14px] font-semibold text-white transition-colors ${RING}`}
          style={{ ...sans, background: applied ? C.green : C.blue, borderRadius: 6 }}
        >
          {applied ? (
            <Check size={17} strokeWidth={2.2} aria-hidden="true" />
          ) : (
            <Wrench size={17} strokeWidth={1.8} aria-hidden="true" />
          )}
          {applied ? "Reactie gemonteerd" : "Reageer op onderdeel"}
        </button>
        {applied && (
          <span className="text-[12.5px]" style={{ ...sans, color: C.muted }}>
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
      <StepHead
        step={3}
        title="Controleer de onderdelen"
        sub="Je gevoelige papieren bewaren we versleuteld — en verifiëren we onderdeel voor onderdeel."
      />

      <Card soft className="mb-6 flex items-center gap-4 p-5">
        <span
          className="flex h-12 w-12 shrink-0 items-center justify-center"
          style={{
            background: C.greenSoft,
            color: C.green,
            border: `1px solid ${C.green}`,
            borderRadius: 8,
          }}
          aria-hidden="true"
        >
          <ShieldCheck size={24} strokeWidth={1.8} />
        </span>
        <div>
          <div className="text-[14px] font-bold" style={{ ...sans, color: C.ink }}>
            {PROFIEL.trust}
          </div>
          <p className="mt-0.5 text-[13px]" style={{ ...sans, color: C.inkSoft }}>
            Je documenten worden versleuteld bewaard en alleen met jouw toestemming gedeeld.
          </p>
        </div>
      </Card>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="space-y-2.5 lg:col-span-2">
          {CREDENTIALS.map((c, i) => {
            const done = checked.has(c.naam);
            return (
              <Card key={c.naam} className="flex items-center gap-3 p-4">
                <Balloon n={i + 1} tone={C.faint} />
                <button
                  onClick={() => toggleCheck(c.naam)}
                  aria-pressed={done}
                  aria-label={done ? `${c.naam} afgevinkt` : `Vink ${c.naam} af`}
                  className={`flex h-7 w-7 shrink-0 items-center justify-center transition-colors ${RING}`}
                  style={{
                    border: `1.5px solid ${done ? C.blue : C.line}`,
                    background: done ? C.blue : "transparent",
                    color: "#fff",
                    borderRadius: 6,
                  }}
                >
                  {done && <Check size={15} strokeWidth={2.6} aria-hidden="true" />}
                </button>
                <div className="min-w-0 flex-1">
                  <div className="text-[14px] font-semibold" style={{ ...sans, color: C.ink }}>
                    {c.naam}
                  </div>
                  <div className="text-[12px]" style={{ ...mono, color: C.muted }}>
                    {c.detail}
                  </div>
                </div>
                <StatusChip status={c.status} />
              </Card>
            );
          })}
        </div>

        <div>
          <div className="mb-3 flex items-center justify-between">
            <span
              className="inline-flex items-center gap-2 text-[13px] font-bold uppercase tracking-[0.08em]"
              style={{ ...mono, color: C.ink }}
            >
              <FileText size={16} strokeWidth={1.8} style={{ color: C.blue }} aria-hidden="true" />
              Onderdelenlijst
            </span>
            <button
              onClick={() => setFeedState(feedState === "loading" ? "ok" : "loading")}
              className={`flex h-8 w-8 items-center justify-center ${RING}`}
              style={{
                background: C.cardSoft,
                color: C.blue,
                border: `1px solid ${C.line}`,
                borderRadius: 6,
              }}
              aria-label="Vernieuw documenten"
            >
              <RefreshCw size={14} strokeWidth={1.8} aria-hidden="true" />
            </button>
          </div>

          <div className="mb-3 flex gap-1.5" role="tablist" aria-label="Documentweergave">
            {(["ok", "loading", "error"] as const).map((s) => (
              <button
                key={s}
                role="tab"
                aria-selected={feedState === s}
                onClick={() => setFeedState(s)}
                className={`px-3 py-1 text-[11px] font-semibold ${RING}`}
                style={{
                  ...mono,
                  color: feedState === s ? "#fff" : C.muted,
                  background: feedState === s ? C.blue : C.cardSoft,
                  border: `1px solid ${feedState === s ? C.blue : C.line}`,
                  borderRadius: 4,
                }}
              >
                {s === "ok" ? "Geladen" : s === "loading" ? "Laden" : "Fout"}
              </button>
            ))}
          </div>

          {feedState === "loading" && (
            <ul className="space-y-2" aria-busy="true" aria-label="Documenten laden">
              {[0, 1, 2, 3].map((i) => (
                <Card key={i} className="p-3.5">
                  <div
                    className="h-3 w-2/3 animate-pulse"
                    style={{ background: C.cardSoft, borderRadius: 3 }}
                  />
                  <div
                    className="mt-2 h-2.5 w-1/3 animate-pulse"
                    style={{ background: C.cardSoft, borderRadius: 3 }}
                  />
                </Card>
              ))}
            </ul>
          )}

          {feedState === "error" && (
            <Card className="flex flex-col items-center gap-2 px-4 py-8 text-center">
              <span
                className="flex h-12 w-12 items-center justify-center"
                style={{
                  background: C.redSoft,
                  color: C.red,
                  border: `1px solid ${C.red}`,
                  borderRadius: 8,
                }}
                aria-hidden="true"
              >
                <CircleAlert size={24} strokeWidth={1.8} />
              </span>
              <div className="text-[14px] font-bold" style={{ ...sans, color: C.ink }}>
                Onderdeel niet gevonden
              </div>
              <p className="text-[12px]" style={{ ...sans, color: C.muted }}>
                We konden je onderdelenlijst niet bereiken. Probeer het zo nog eens.
              </p>
              <button
                onClick={() => setFeedState("ok")}
                className={`mt-1 px-4 py-2 text-[12px] font-semibold text-white ${RING}`}
                style={{ ...sans, background: C.blue, borderRadius: 6 }}
              >
                Opnieuw proberen
              </button>
            </Card>
          )}

          {feedState === "ok" && (
            <ul className="space-y-2">
              {DOCUMENTEN.map((d) => (
                <Card key={d.naam} className="flex items-center gap-3 p-3">
                  <span
                    className="flex h-9 w-9 shrink-0 items-center justify-center text-[9px] font-bold"
                    style={{
                      ...mono,
                      background: C.cardSoft,
                      color: C.blueDeep,
                      border: `1px solid ${C.line}`,
                      borderRadius: 6,
                    }}
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
                    <div className="text-[11px] tabular-nums" style={{ ...mono, color: C.muted }}>
                      {d.grootte} · {d.bijgewerkt}
                    </div>
                  </div>
                  <StatusChip status={d.status} />
                </Card>
              ))}
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
      <StepHead step={1} title="Doorloop de montagestappen" />

      {openCount === 0 ? (
        <Card className="flex flex-col items-center gap-3 px-6 py-16 text-center">
          <Check size={40} strokeWidth={1.6} style={{ color: C.green }} aria-hidden="true" />
          <h3 className="text-[19px] font-bold" style={{ ...sans, color: C.ink }}>
            Montage voltooid
          </h3>
          <p className="max-w-xs text-[13px]" style={{ ...sans, color: C.muted }}>
            Alle stappen afgerond. Je bouwpakket is compleet.
          </p>
        </Card>
      ) : (
        <>
          <div
            className="mb-5 inline-flex items-center gap-2 px-3.5 py-2"
            style={{ background: C.blueSoft, border: `1px solid ${C.blue}`, borderRadius: 6 }}
          >
            <span
              className="flex h-6 w-6 items-center justify-center text-[12px] font-bold tabular-nums text-white"
              style={{ ...mono, background: C.blue, borderRadius: 4 }}
              aria-hidden="true"
            >
              {openCount}
            </span>
            <span className="text-[12.5px] font-semibold" style={{ ...mono, color: C.blueDeep }}>
              {openCount} {openCount === 1 ? "stap" : "stappen"} te gaan
            </span>
          </div>

          <ol className="space-y-3">
            {ACTIES.map((a, i) => {
              const isDone = done.has(a.titel);
              return (
                <Card key={a.titel} className="flex items-start gap-4 p-5">
                  <Balloon n={i + 1} tone={isDone ? C.green : C.blue} size={30} />
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
                        className="mt-2.5 inline-flex items-center gap-1 px-3 py-1.5 text-[12px] font-semibold"
                        style={{
                          ...mono,
                          color: a.urgentie === "warning" ? C.amber : C.blueDeep,
                          background: a.urgentie === "warning" ? C.amberSoft : C.blueSoft,
                          border: `1px solid ${a.urgentie === "warning" ? C.amber : C.blue}`,
                          borderRadius: 4,
                        }}
                      >
                        {a.cta}
                        <ArrowRight size={12} strokeWidth={1.8} aria-hidden="true" />
                      </span>
                    )}
                  </div>
                  <button
                    onClick={() => toggleDone(a.titel)}
                    aria-pressed={isDone}
                    aria-label={isDone ? `${a.titel} afgerond` : `Markeer ${a.titel} als afgerond`}
                    className={`flex h-8 w-8 shrink-0 items-center justify-center transition-colors ${RING}`}
                    style={{
                      border: `1.5px solid ${isDone ? C.green : C.line}`,
                      background: isDone ? C.green : "transparent",
                      color: "#fff",
                      borderRadius: 6,
                    }}
                  >
                    {isDone && <Check size={16} strokeWidth={2.6} aria-hidden="true" />}
                  </button>
                </Card>
              );
            })}
          </ol>
        </>
      )}
    </div>
  );
}

function Facturen() {
  const trend = [24.8, 13.5, 30.72, 8.8];
  const badgeTone = (status: string): { fg: string; bg: string } =>
    status === "Betaald"
      ? { fg: C.green, bg: C.greenSoft }
      : status === "Openstaand"
        ? { fg: C.amber, bg: C.amberSoft }
        : { fg: C.muted, bg: C.cardSoft };
  return (
    <div>
      <StepHead
        step={4}
        title="Controleer de rekening"
        sub="Overzichtelijk en zonder ruis — zo weet je precies waar je aan toe bent."
      />

      <div className="mb-6 grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3 lg:col-span-2">
          {[
            { label: "Betaald (mnd)", value: "€ 5.552", tone: C.green },
            { label: "Openstaand", value: "€ 1.350", tone: C.amber },
            { label: "Concept", value: "€ 880", tone: C.muted },
          ].map((s, i) => (
            <Card key={s.label} className="relative p-4">
              <span className="absolute right-3 top-3">
                <Balloon n={i + 1} size={20} tone={C.faint} />
              </span>
              <div
                className="text-[10.5px] font-medium uppercase tracking-[0.08em]"
                style={{ ...mono, color: C.muted }}
              >
                {s.label}
              </div>
              <div
                className="mt-1 text-[21px] font-bold tabular-nums"
                style={{ ...sans, color: s.tone }}
              >
                {s.value}
              </div>
            </Card>
          ))}
        </div>
        <Card className="flex flex-col justify-between p-4">
          <div
            className="text-[10.5px] font-medium uppercase tracking-[0.08em]"
            style={{ ...mono, color: C.muted }}
          >
            Bedrag per factuur
          </div>
          <TechSpark data={trend} height={46} />
        </Card>
      </div>

      <Card className="overflow-hidden p-2">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[560px] text-left">
            <thead>
              <tr style={{ borderBottom: `1px solid ${C.line}` }}>
                {["Factuur", "Klant", "Datum", "Bedrag", "Status"].map((h) => (
                  <th
                    key={h}
                    scope="col"
                    className="px-3 py-2.5 text-[10.5px] font-medium uppercase tracking-[0.1em]"
                    style={{ ...mono, color: C.muted }}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {FACTUREN.map((f) => {
                const t = badgeTone(f.status);
                return (
                  <tr
                    key={f.nr}
                    className="transition-colors hover:bg-[#f3f5f8]"
                    style={{ borderBottom: `1px solid ${C.lineSoft}` }}
                  >
                    <td
                      className="px-3 py-3 text-[12.5px] font-semibold tabular-nums"
                      style={{ ...mono, color: C.blueDeep }}
                    >
                      {f.nr}
                    </td>
                    <td className="px-3 py-3 text-[13px]" style={{ ...sans, color: C.ink }}>
                      {f.klant}
                    </td>
                    <td
                      className="px-3 py-3 text-[12.5px] tabular-nums"
                      style={{ ...mono, color: C.muted }}
                    >
                      {f.datum}
                    </td>
                    <td
                      className="px-3 py-3 text-[13px] font-bold tabular-nums"
                      style={{ ...mono, color: C.ink }}
                    >
                      {f.bedrag}
                    </td>
                    <td className="px-3 py-3">
                      <span
                        className="inline-flex items-center gap-1.5 px-2.5 py-0.5 text-[11px] font-medium"
                        style={{
                          ...mono,
                          color: t.fg,
                          background: t.bg,
                          border: `1px solid ${t.fg}`,
                          borderRadius: 4,
                        }}
                      >
                        {f.status === "Betaald" ? (
                          <Check size={11} strokeWidth={2.4} aria-hidden="true" />
                        ) : f.status === "Openstaand" ? (
                          <Clock size={11} strokeWidth={1.8} aria-hidden="true" />
                        ) : (
                          <FileText size={11} strokeWidth={1.8} aria-hidden="true" />
                        )}
                        {f.status}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}

// ---- Shell -----------------------------------------------------------------

export function Concept263() {
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
      style={{ ...sans, color: C.ink, background: C.paper }}
    >
      <div className="mx-auto flex min-h-[680px] max-w-6xl flex-col px-4 py-6 sm:px-6 sm:py-8">
        <header className="mb-6 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span
              className="flex h-11 w-11 items-center justify-center text-white"
              style={{ background: C.blue, borderRadius: 8 }}
              aria-hidden="true"
            >
              <Package size={19} strokeWidth={1.8} />
            </span>
            <div className="leading-tight">
              <div
                className="text-[19px] font-bold tracking-tight"
                style={{ ...sans, color: C.ink }}
              >
                Bouwpakket
              </div>
              <div
                className="text-[10px] font-medium uppercase tracking-[0.2em]"
                style={{ ...mono, color: C.muted }}
              >
                ZZP platform · montagegids
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
                style={{ ...mono, color: C.green }}
              >
                <BadgeCheck size={12} strokeWidth={1.8} aria-hidden="true" />
                {PROFIEL.trust}
              </div>
            </div>
            <span
              className="flex h-11 w-11 items-center justify-center text-[13px] font-bold"
              style={{
                ...mono,
                background: C.blueSoft,
                color: C.blueDeep,
                border: `1px solid ${C.blue}`,
                borderRadius: 8,
              }}
              aria-hidden="true"
            >
              {PROFIEL.initialen}
            </span>
          </div>
        </header>

        <nav className="mb-8 flex flex-wrap gap-1.5 overflow-x-auto" aria-label="Hoofdnavigatie">
          {SCREENS.map((s, i) => {
            const on = s.key === screen;
            const Icon = NAV_ICONS[s.key];
            return (
              <button
                key={s.key}
                onClick={() => setScreen(s.key)}
                aria-current={on ? "page" : undefined}
                className={`inline-flex shrink-0 items-center gap-1.5 px-3 py-2 text-[12.5px] font-semibold transition-colors ${RING}`}
                style={{
                  ...mono,
                  color: on ? "#fff" : C.inkSoft,
                  background: on ? C.blue : C.card,
                  border: `1px solid ${on ? C.blue : C.line}`,
                  borderRadius: 6,
                }}
              >
                <span
                  className="text-[10px] tabular-nums"
                  style={{ color: on ? "rgba(255,255,255,0.7)" : C.faint }}
                  aria-hidden="true"
                >
                  {String(i + 1).padStart(2, "0")}
                </span>
                <Icon size={14} strokeWidth={1.8} aria-hidden="true" />
                {s.label}
              </button>
            );
          })}
        </nav>

        <main className="flex-1">
          {screen === "dashboard" && <Dashboard onOpen={() => setScreen("opdracht")} />}
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
          className="mt-10 flex flex-wrap items-center justify-between gap-2 border-t pt-4 text-[11px]"
          style={{ ...mono, borderColor: C.line, color: C.muted }}
        >
          <span className="inline-flex items-center gap-1.5">
            <Ruler size={12} strokeWidth={1.8} style={{ color: C.blue }} aria-hidden="true" />
            Montagegids · {ACTIES.length} stappen
          </span>
          <span>Gebouwd met zorg</span>
        </footer>
      </div>
    </div>
  );
}
