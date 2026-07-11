"use client";

// Concept 259 — "Plotter" · Generative continuous-line pen-plotter aesthetic.
// Signature: a technical pen-plotter drawing on light cream paper. Everything reads as if
// output by a single-pen XY plotter — continuous single-stroke line illustrations, diagonal
// hatching as fill, one consistent thin stroke-width, and registration/corner marks like a
// plotter homing its head. Charts (KPI sparklines, invoice overview) are drawn as continuous
// plotter paths with hatch-filled areas. A subtle turbulence filter gives decorative lines a
// hand-plotted imperfection — never applied to data or text, so readability/AA stays intact.
// Fonts: Space Mono (technical headings/labels) + Inter (body). Deep plotter-blue ink #1e3a8a.

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
  PenTool,
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

// Plotter-ink palette on warm technical paper. Deep blue keeps AA on cream.
const C = {
  paper: "#f2ecdd",
  paper2: "#ece5d3",
  card: "#faf6ec",
  cardSoft: "#f3ecdb",
  line: "rgba(30,58,138,0.24)",
  lineFaint: "rgba(30,58,138,0.13)",
  ink: "#161a24",
  inkSoft: "#3b414f",
  muted: "#6a6e78",
  faint: "#9a9384",
  blue: "#1e3a8a",
  blueDeep: "#152a63",
  blueSoft: "#e4e6f2",
  green: "#2f6b3a",
  greenSoft: "#e2ecdd",
  amber: "#8a5a12",
  amberSoft: "#f0e7d0",
  red: "#a5342c",
  redSoft: "#f1ddd8",
};

const mono = { fontFamily: "var(--font-lab-space-mono)" };
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
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1e3a8a] focus-visible:ring-offset-2 focus-visible:ring-offset-[#f2ecdd]";

// Shared plotter defs: diagonal hatch patterns + a gentle wobble filter for decorative lines.
function PlotterDefs() {
  const hatch = (id: string, stroke: string, opacity: number) => (
    <pattern
      id={id}
      width={6}
      height={6}
      patternUnits="userSpaceOnUse"
      patternTransform="rotate(45)"
    >
      <line x1={0} y1={0} x2={0} y2={6} stroke={stroke} strokeWidth={1} opacity={opacity} />
    </pattern>
  );
  return (
    <svg width={0} height={0} className="absolute" aria-hidden="true">
      <defs>
        {hatch("p259-hatch-blue", C.blue, 0.5)}
        {hatch("p259-hatch-green", C.green, 0.55)}
        {hatch("p259-hatch-amber", C.amber, 0.55)}
        {hatch("p259-hatch-faint", C.blue, 0.22)}
        <filter id="p259-wobble">
          <feTurbulence type="fractalNoise" baseFrequency="0.014" numOctaves={2} seed={7} />
          <feDisplacementMap in="SourceGraphic" scale={2.2} />
        </filter>
      </defs>
    </svg>
  );
}

// Registration corner ticks — the plotter homing its head against the paper edges.
function RegMarks() {
  const tick = (pos: CSSProperties) => (
    <span className="absolute" style={{ ...pos, width: 10, height: 10 }} aria-hidden="true">
      <svg viewBox="0 0 10 10" width={10} height={10}>
        <path d="M5 0 V10 M0 5 H10" stroke={C.blue} strokeWidth={0.8} opacity={0.55} />
      </svg>
    </span>
  );
  return (
    <>
      {tick({ top: 5, left: 5 })}
      {tick({ top: 5, right: 5 })}
      {tick({ bottom: 5, left: 5 })}
      {tick({ bottom: 5, right: 5 })}
    </>
  );
}

function cardStyle(soft = false): CSSProperties {
  return {
    background: soft ? C.cardSoft : C.card,
    border: `1px solid ${C.line}`,
    borderRadius: 4,
    boxShadow: "0 1px 0 rgba(30,58,138,0.06)",
  };
}

// A card framed like a plotter sheet: thin border + registration ticks in the corners.
function Sheet({
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
    <div className={`relative ${className ?? ""}`} style={{ ...cardStyle(soft), ...style }}>
      <RegMarks />
      {children}
    </div>
  );
}

function statusMeta(s: CredStatus): { label: string; Icon: LucideIcon; fg: string; bg: string } {
  switch (s) {
    case "VERIFIED":
      return { label: "Geverifieerd", Icon: BadgeCheck, fg: C.green, bg: C.greenSoft };
    case "SUBMITTED":
      return { label: "In beoordeling", Icon: Clock, fg: C.blueDeep, bg: C.blueSoft };
    case "EXPIRING":
      return { label: "Verloopt bijna", Icon: TriangleAlert, fg: C.amber, bg: C.amberSoft };
    case "REJECTED":
      return { label: "Afgewezen", Icon: XCircle, fg: C.red, bg: C.redSoft };
  }
}

function StatusChip({ status }: { status: CredStatus }) {
  const { label, Icon, fg, bg } = statusMeta(status);
  return (
    <span
      className="inline-flex items-center gap-1.5 px-2.5 py-0.5 text-[11px] font-medium"
      style={{ ...mono, color: fg, background: bg, border: `1px solid ${fg}`, borderRadius: 3 }}
    >
      <Icon size={11} strokeWidth={1.8} aria-hidden="true" />
      {label}
    </span>
  );
}

// Continuous plotter line chart: one unbroken stroke with a hatch-filled area beneath it.
function PlotLine({
  data,
  tone = C.blue,
  hatch = "p259-hatch-faint",
  height = 34,
}: {
  data: number[];
  tone?: string;
  hatch?: string;
  height?: number;
}) {
  const max = Math.max(...data);
  const min = Math.min(...data);
  const span = max - min || 1;
  const pts = data.map((v, i) => {
    const x = (i / (data.length - 1)) * 100;
    const y = 100 - ((v - min) / span) * 74 - 13;
    return [x, y] as const;
  });
  const line = pts.map(([x, y]) => `${x.toFixed(1)},${y.toFixed(1)}`).join(" ");
  const area = `0,100 ${line} 100,100`;
  return (
    <svg
      viewBox="0 0 100 100"
      preserveAspectRatio="none"
      className="w-full"
      style={{ height }}
      aria-hidden="true"
    >
      <polygon points={area} fill={`url(#${hatch})`} stroke="none" />
      <polyline
        points={line}
        fill="none"
        stroke={tone}
        strokeWidth={1.4}
        strokeLinecap="round"
        strokeLinejoin="round"
        vectorEffect="non-scaling-stroke"
      />
      {pts.map(([x, y], i) => (
        <circle key={i} cx={x} cy={y} r={1.1} fill={C.card} stroke={tone} strokeWidth={0.8} />
      ))}
    </svg>
  );
}

// A decorative single-stroke plotter drawing — one continuous looping path.
function PlotterGlyph({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 120 80"
      className={className}
      fill="none"
      stroke={C.blue}
      strokeWidth={1.1}
      strokeLinecap="round"
      strokeLinejoin="round"
      style={{ filter: "url(#p259-wobble)" }}
      aria-hidden="true"
    >
      <path d="M6 62 C 22 10, 40 10, 46 40 S 62 74, 74 44 S 96 8, 114 30" opacity={0.85} />
      <path d="M6 70 C 26 40, 44 52, 58 30 S 84 20, 114 46" opacity={0.5} />
      <circle cx={46} cy={40} r={2.2} fill={C.blue} stroke="none" />
      <circle cx={74} cy={44} r={2.2} fill={C.blue} stroke="none" />
    </svg>
  );
}

function ScreenHead({ title, sub, code }: { title: string; sub?: string; code?: string }) {
  return (
    <div className="mb-6">
      {code && (
        <div
          className="mb-2 text-[10px] font-medium uppercase tracking-[0.22em]"
          style={{ ...mono, color: C.blue }}
        >
          {code}
        </div>
      )}
      <h1
        className="text-[26px] font-bold leading-tight tracking-tight sm:text-[30px]"
        style={{ ...mono, color: C.ink }}
      >
        {title}
      </h1>
      {sub && (
        <p
          className="mt-2 max-w-xl text-[13.5px] leading-relaxed"
          style={{ ...sans, color: C.inkSoft }}
        >
          {sub}
        </p>
      )}
    </div>
  );
}

// ---- Screens ---------------------------------------------------------------

function Dashboard({ onOpen }: { onOpen: () => void }) {
  const top = OPDRACHTEN[0] as Opdracht;
  const voornaam = PROFIEL.naam.split(" ")[0];
  return (
    <div>
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <div
            className="mb-1 text-[10px] font-medium uppercase tracking-[0.22em]"
            style={{ ...mono, color: C.blue }}
          >
            Plot · {PROFIEL.plaats}
          </div>
          <h1
            className="text-[26px] font-bold leading-none tracking-tight sm:text-[30px]"
            style={{ ...mono, color: C.ink }}
          >
            Dag, {voornaam}
          </h1>
          <p className="mt-2 text-[13px]" style={{ ...sans, color: C.muted }}>
            Je overzicht is uitgetekend. Eén punt vraagt vandaag om je pen.
          </p>
        </div>
        <PlotterGlyph className="h-16 w-24 shrink-0" />
      </div>

      <div className="mb-8 grid grid-cols-2 gap-3 lg:grid-cols-4">
        {KPIS.map((k) => {
          const Trend = k.up ? TrendingUp : TrendingDown;
          return (
            <Sheet key={k.label} className="p-4">
              <div className="flex items-center justify-between gap-2">
                <span
                  className="text-[10px] font-medium uppercase tracking-[0.12em]"
                  style={{ ...mono, color: C.muted }}
                >
                  {k.label}
                </span>
                <span
                  className="inline-flex items-center gap-0.5 text-[11px] font-bold tabular-nums"
                  style={{ ...mono, color: k.up ? C.green : C.amber }}
                >
                  <Trend size={11} strokeWidth={1.8} aria-hidden="true" />
                  {k.trend}
                </span>
              </div>
              <div
                className="mt-1.5 text-[24px] font-bold tabular-nums leading-none"
                style={{ ...mono, color: C.ink }}
              >
                {k.value}
              </div>
              <div className="mt-2">
                <PlotLine data={k.spark} />
              </div>
            </Sheet>
          );
        })}
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <div className="mb-3 flex items-center gap-2">
            <PenTool size={15} strokeWidth={1.8} style={{ color: C.blue }} aria-hidden="true" />
            <h2
              className="text-[13px] font-bold uppercase tracking-[0.12em]"
              style={{ ...mono, color: C.ink }}
            >
              Beste match
            </h2>
          </div>
          <button
            onClick={onOpen}
            className={`group flex w-full items-start gap-4 p-5 text-left transition-transform hover:-translate-y-0.5 ${RING}`}
            style={cardStyle()}
          >
            <MatchGauge value={top.match} />
            <div className="min-w-0 flex-1">
              <div
                className="text-[17px] font-bold leading-tight"
                style={{ ...mono, color: C.ink }}
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
                      ...sans,
                      color: C.inkSoft,
                      border: `1px solid ${C.line}`,
                      borderRadius: 3,
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

          <Sheet soft className="mt-6 flex items-start gap-4 p-5">
            <span
              className="flex h-11 w-11 shrink-0 items-center justify-center"
              style={{
                background: C.greenSoft,
                color: C.green,
                borderRadius: 3,
                border: `1px solid ${C.green}`,
              }}
              aria-hidden="true"
            >
              <ShieldCheck size={22} strokeWidth={1.8} />
            </span>
            <div>
              <div className="inline-flex items-center gap-2">
                <span className="text-[14px] font-bold" style={{ ...mono, color: C.ink }}>
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
                Je documenten zijn scherp uitgetekend en geverifieerd — opdrachtgevers zien meteen
                dat het klopt.
              </p>
            </div>
          </Sheet>
        </div>

        <div>
          <div className="mb-3 flex items-center gap-2">
            <ListTodo size={15} strokeWidth={1.8} style={{ color: C.blue }} aria-hidden="true" />
            <h2
              className="text-[13px] font-bold uppercase tracking-[0.12em]"
              style={{ ...mono, color: C.ink }}
            >
              Op de plotter
            </h2>
          </div>
          <ul className="space-y-2.5">
            {ACTIES.map((a) => (
              <Sheet key={a.titel} className="p-3.5">
                <div className="flex items-start gap-2">
                  <span
                    className="mt-0.5 h-2.5 w-2.5 shrink-0"
                    style={{
                      background: a.urgentie === "warning" ? C.amber : C.blue,
                      borderRadius: 1,
                    }}
                    aria-hidden="true"
                  />
                  <div className="min-w-0">
                    <div
                      className="text-[12.5px] font-semibold leading-snug"
                      style={{ ...sans, color: C.ink }}
                    >
                      {a.titel}
                    </div>
                    <div className="mt-0.5 text-[11.5px]" style={{ ...mono, color: C.muted }}>
                      {a.cta}
                    </div>
                  </div>
                </div>
              </Sheet>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}

// A circular plotter gauge — an arc drawn as a continuous stroke around the match score.
function MatchGauge({ value, size = 62 }: { value: number; size?: number }) {
  const r = 26;
  const circ = 2 * Math.PI * r;
  const dash = (value / 100) * circ;
  return (
    <span className="relative shrink-0" style={{ width: size, height: size }} aria-hidden="true">
      <svg viewBox="0 0 64 64" width={size} height={size}>
        <circle cx={32} cy={32} r={r} fill="none" stroke={C.lineFaint} strokeWidth={2} />
        <circle
          cx={32}
          cy={32}
          r={r}
          fill="none"
          stroke={C.blue}
          strokeWidth={2}
          strokeLinecap="round"
          strokeDasharray={`${dash} ${circ}`}
          transform="rotate(-90 32 32)"
        />
      </svg>
      <span className="absolute inset-0 flex flex-col items-center justify-center leading-none">
        <span className="text-[15px] font-bold tabular-nums" style={{ ...mono, color: C.blue }}>
          {value}
        </span>
        <span
          className="text-[7px] font-bold uppercase tracking-[0.12em]"
          style={{ ...mono, color: C.muted }}
        >
          match
        </span>
      </span>
    </span>
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
        code="Marktplaats · uitgelijnd op jouw profiel"
        title="Opdrachten, uitgetekend"
        sub="We tonen eerlijk waarom een opdracht past — en waar de lijn afwijkt."
      />

      <div className="mb-5 flex items-center gap-2 px-4 py-2.5" style={cardStyle()}>
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
            style={{ ...mono, color: C.blueDeep, background: C.blueSoft, borderRadius: 3 }}
          >
            Wis
          </button>
        )}
      </div>

      {filtered.length === 0 ? (
        <Sheet className="flex flex-col items-center gap-3 px-6 py-14 text-center">
          <PlotterGlyph className="h-16 w-24" />
          <h3 className="text-[18px] font-bold" style={{ ...mono, color: C.ink }}>
            Geen lijn gevonden
          </h3>
          <p className="max-w-xs text-[13px]" style={{ ...sans, color: C.muted }}>
            Geen match voor &ldquo;{query}&rdquo;. Probeer een andere zoekterm — de plotter tekent
            zodra er een pad is.
          </p>
          <button
            onClick={() => setQuery("")}
            className={`mt-1 px-5 py-2 text-[13px] font-semibold text-white ${RING}`}
            style={{ ...mono, background: C.blue, borderRadius: 3 }}
          >
            Filter wissen
          </button>
        </Sheet>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {filtered.map((o) => {
            const isSaved = saved.has(o.id);
            return (
              <Sheet
                key={o.id}
                className="flex h-full flex-col p-5 transition-transform hover:-translate-y-0.5"
              >
                <div className="flex items-start justify-between gap-3">
                  <MatchGauge value={o.match} size={54} />
                  <button
                    onClick={() => toggleSave(o.id)}
                    aria-pressed={isSaved}
                    aria-label={isSaved ? "Verwijder uit bewaard" : "Bewaar opdracht"}
                    className={`flex h-9 w-9 items-center justify-center transition-colors ${RING}`}
                    style={{
                      background: isSaved ? C.blueSoft : "transparent",
                      color: isSaved ? C.blue : C.muted,
                      border: `1px solid ${isSaved ? C.blue : C.line}`,
                      borderRadius: 3,
                    }}
                  >
                    {isSaved ? (
                      <BookmarkCheck size={15} strokeWidth={1.8} aria-hidden="true" />
                    ) : (
                      <Bookmark size={15} strokeWidth={1.8} aria-hidden="true" />
                    )}
                  </button>
                </div>
                <h3
                  className="mt-3 text-[15.5px] font-bold leading-tight"
                  style={{ ...mono, color: C.ink }}
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
                  style={{ ...mono, background: C.blue, borderRadius: 3 }}
                >
                  Bekijk opdracht
                  <ArrowRight
                    size={14}
                    strokeWidth={1.8}
                    className="transition-transform group-hover:translate-x-1"
                    aria-hidden="true"
                  />
                </button>
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
          borderRadius: 3,
        }}
      >
        <ArrowLeft size={14} strokeWidth={1.8} aria-hidden="true" />
        Terug
      </button>

      <Sheet className="p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex items-start gap-4">
            <MatchGauge value={opdracht.match} size={66} />
            <div>
              <div
                className="text-[10px] font-medium uppercase tracking-[0.2em]"
                style={{ ...mono, color: C.blue }}
              >
                {opdracht.id}
              </div>
              <h2
                className="text-[22px] font-bold leading-tight tracking-tight"
                style={{ ...mono, color: C.ink }}
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
              borderRadius: 3,
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
              style={{ background: C.cardSoft, border: `1px solid ${C.line}`, borderRadius: 3 }}
            >
              <m.Icon size={14} strokeWidth={1.8} style={{ color: C.blue }} aria-hidden="true" />
              <div
                className="mt-1 text-[9.5px] font-bold uppercase tracking-[0.12em]"
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
      </Sheet>

      <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
        <Sheet className="p-5">
          <div className="mb-3 flex items-center gap-2">
            <span
              className="flex h-6 w-6 items-center justify-center"
              style={{
                background: C.greenSoft,
                color: C.green,
                border: `1px solid ${C.green}`,
                borderRadius: 3,
              }}
              aria-hidden="true"
            >
              <Plus size={13} strokeWidth={2.2} />
            </span>
            <span
              className="text-[13px] font-bold uppercase tracking-[0.1em]"
              style={{ ...mono, color: C.ink }}
            >
              Waarom deze past
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
        </Sheet>
        <Sheet className="p-5">
          <div className="mb-3 flex items-center gap-2">
            <span
              className="flex h-6 w-6 items-center justify-center"
              style={{
                background: C.amberSoft,
                color: C.amber,
                border: `1px solid ${C.amber}`,
                borderRadius: 3,
              }}
              aria-hidden="true"
            >
              <Minus size={13} strokeWidth={2.2} />
            </span>
            <span
              className="text-[13px] font-bold uppercase tracking-[0.1em]"
              style={{ ...mono, color: C.ink }}
            >
              Even op letten
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
        </Sheet>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-3">
        <button
          onClick={() => setApplied((v) => !v)}
          aria-pressed={applied}
          className={`inline-flex items-center gap-2 px-6 py-3 text-[14px] font-semibold text-white transition-colors ${RING}`}
          style={{ ...mono, background: applied ? C.green : C.blue, borderRadius: 3 }}
        >
          {applied ? (
            <Check size={17} strokeWidth={2.2} aria-hidden="true" />
          ) : (
            <ArrowRight size={17} strokeWidth={1.8} aria-hidden="true" />
          )}
          {applied ? "Reactie verstuurd" : "Reageer op opdracht"}
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
      <ScreenHead
        code="Verificatie · privé & versleuteld"
        title="Documenten, scherp gecontroleerd"
        sub="Alles wat je gevoelige papieren betreft houden we privé en zorgvuldig bij."
      />

      <Sheet soft className="mb-6 flex items-center gap-4 p-5">
        <span
          className="flex h-12 w-12 shrink-0 items-center justify-center"
          style={{
            background: C.greenSoft,
            color: C.green,
            border: `1px solid ${C.green}`,
            borderRadius: 3,
          }}
          aria-hidden="true"
        >
          <ShieldCheck size={24} strokeWidth={1.8} />
        </span>
        <div>
          <div className="text-[14px] font-bold" style={{ ...mono, color: C.ink }}>
            {PROFIEL.trust}
          </div>
          <p className="mt-0.5 text-[13px]" style={{ ...sans, color: C.inkSoft }}>
            Je documenten worden versleuteld bewaard en alleen gedeeld met jouw toestemming.
          </p>
        </div>
      </Sheet>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="space-y-2.5 lg:col-span-2">
          {CREDENTIALS.map((c) => {
            const done = checked.has(c.naam);
            return (
              <Sheet key={c.naam} className="flex items-center gap-3 p-4">
                <button
                  onClick={() => toggleCheck(c.naam)}
                  aria-pressed={done}
                  aria-label={done ? `${c.naam} afgevinkt` : `Vink ${c.naam} af`}
                  className={`flex h-7 w-7 shrink-0 items-center justify-center transition-colors ${RING}`}
                  style={{
                    border: `1.5px solid ${done ? C.blue : C.line}`,
                    background: done ? C.blue : "transparent",
                    color: "#fff",
                    borderRadius: 3,
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
              </Sheet>
            );
          })}
        </div>

        <div>
          <div className="mb-3 flex items-center justify-between">
            <span
              className="inline-flex items-center gap-2 text-[13px] font-bold uppercase tracking-[0.1em]"
              style={{ ...mono, color: C.ink }}
            >
              <FileText size={16} strokeWidth={1.8} style={{ color: C.blue }} aria-hidden="true" />
              Documenten
            </span>
            <button
              onClick={() => setFeedState(feedState === "loading" ? "ok" : "loading")}
              className={`flex h-8 w-8 items-center justify-center ${RING}`}
              style={{
                background: C.cardSoft,
                color: C.blue,
                border: `1px solid ${C.line}`,
                borderRadius: 3,
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
                  borderRadius: 3,
                }}
              >
                {s === "ok" ? "Geladen" : s === "loading" ? "Laden" : "Fout"}
              </button>
            ))}
          </div>

          {feedState === "loading" && (
            <ul className="space-y-2" aria-busy="true" aria-label="Documenten laden">
              {[0, 1, 2, 3].map((i) => (
                <Sheet key={i} className="p-3.5">
                  <div
                    className="h-3 w-2/3 animate-pulse"
                    style={{ background: C.cardSoft, borderRadius: 2 }}
                  />
                  <div
                    className="mt-2 h-2.5 w-1/3 animate-pulse"
                    style={{ background: C.cardSoft, borderRadius: 2 }}
                  />
                </Sheet>
              ))}
            </ul>
          )}

          {feedState === "error" && (
            <Sheet className="flex flex-col items-center gap-2 px-4 py-8 text-center">
              <span
                className="flex h-12 w-12 items-center justify-center"
                style={{
                  background: C.redSoft,
                  color: C.red,
                  border: `1px solid ${C.red}`,
                  borderRadius: 3,
                }}
                aria-hidden="true"
              >
                <CircleAlert size={24} strokeWidth={1.8} />
              </span>
              <div className="text-[14px] font-bold" style={{ ...mono, color: C.ink }}>
                Even niet gelukt
              </div>
              <p className="text-[12px]" style={{ ...sans, color: C.muted }}>
                We konden je documentenkluis niet bereiken. Probeer het zo nog eens.
              </p>
              <button
                onClick={() => setFeedState("ok")}
                className={`mt-1 px-4 py-2 text-[12px] font-semibold text-white ${RING}`}
                style={{ ...mono, background: C.blue, borderRadius: 3 }}
              >
                Opnieuw proberen
              </button>
            </Sheet>
          )}

          {feedState === "ok" && (
            <ul className="space-y-2">
              {DOCUMENTEN.map((d) => (
                <Sheet key={d.naam} className="flex items-center gap-3 p-3">
                  <span
                    className="flex h-9 w-9 shrink-0 items-center justify-center text-[9px] font-bold"
                    style={{
                      ...mono,
                      background: C.cardSoft,
                      color: C.blueDeep,
                      border: `1px solid ${C.line}`,
                      borderRadius: 3,
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
                </Sheet>
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
      <ScreenHead code="Acties · takenlijst" title="Wat vandaag om je pen vraagt" />

      {openCount === 0 ? (
        <Sheet className="flex flex-col items-center gap-3 px-6 py-16 text-center">
          <PlotterGlyph className="h-16 w-24" />
          <h3 className="text-[19px] font-bold" style={{ ...mono, color: C.ink }}>
            Alles uitgetekend
          </h3>
          <p className="max-w-xs text-[13px]" style={{ ...sans, color: C.muted }}>
            Niets meer te doen vandaag. De plotter staat stil.
          </p>
        </Sheet>
      ) : (
        <>
          <div
            className="mb-4 inline-flex items-center gap-2 px-3.5 py-2"
            style={{ background: C.blueSoft, border: `1px solid ${C.blue}`, borderRadius: 3 }}
          >
            <span
              className="flex h-6 w-6 items-center justify-center text-[12px] font-bold tabular-nums text-white"
              style={{ ...mono, background: C.blue, borderRadius: 2 }}
              aria-hidden="true"
            >
              {openCount}
            </span>
            <span className="text-[12.5px] font-semibold" style={{ ...mono, color: C.blueDeep }}>
              {openCount} {openCount === 1 ? "punt" : "punten"} in de wachtrij
            </span>
          </div>

          <ul className="space-y-3">
            {ACTIES.map((a) => {
              const isDone = done.has(a.titel);
              return (
                <Sheet key={a.titel} className="flex items-start gap-4 p-5">
                  <button
                    onClick={() => toggleDone(a.titel)}
                    aria-pressed={isDone}
                    aria-label={isDone ? `${a.titel} afgerond` : `Markeer ${a.titel} als afgerond`}
                    className={`flex h-8 w-8 shrink-0 items-center justify-center transition-colors ${RING}`}
                    style={{
                      border: `1.5px solid ${isDone ? C.green : C.line}`,
                      background: isDone ? C.green : "transparent",
                      color: "#fff",
                      borderRadius: 3,
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
                        className="mt-2.5 inline-flex items-center gap-1 px-3 py-1.5 text-[12px] font-semibold"
                        style={{
                          ...mono,
                          color: a.urgentie === "warning" ? C.amber : C.blueDeep,
                          background: a.urgentie === "warning" ? C.amberSoft : C.blueSoft,
                          border: `1px solid ${a.urgentie === "warning" ? C.amber : C.blue}`,
                          borderRadius: 3,
                        }}
                      >
                        {a.cta}
                        <ArrowRight size={12} strokeWidth={1.8} aria-hidden="true" />
                      </span>
                    )}
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
  // Continuous plotter line over the paid-per-invoice trend.
  const trend = [24.8, 13.5, 30.72, 8.8];
  const badgeTone = (status: string): { fg: string; bg: string } =>
    status === "Betaald"
      ? { fg: C.green, bg: C.greenSoft }
      : status === "Openstaand"
        ? { fg: C.amber, bg: C.amberSoft }
        : { fg: C.muted, bg: C.cardSoft };
  return (
    <div>
      <ScreenHead
        code="Facturen · uitgetekend overzicht"
        title="Je facturen"
        sub="Overzichtelijk en zonder gedoe — zodat je weet waar je aan toe bent."
      />

      <div className="mb-6 grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3 lg:col-span-2">
          {[
            { label: "Betaald (mnd)", value: "€ 5.552", tone: C.green },
            { label: "Openstaand", value: "€ 1.350", tone: C.amber },
            { label: "Concept", value: "€ 880", tone: C.muted },
          ].map((s) => (
            <Sheet key={s.label} className="p-4">
              <div
                className="text-[10.5px] font-medium uppercase tracking-[0.1em]"
                style={{ ...mono, color: C.muted }}
              >
                {s.label}
              </div>
              <div
                className="mt-1 text-[21px] font-bold tabular-nums"
                style={{ ...mono, color: s.tone }}
              >
                {s.value}
              </div>
            </Sheet>
          ))}
        </div>
        <Sheet className="flex flex-col justify-between p-4">
          <div
            className="text-[10.5px] font-medium uppercase tracking-[0.1em]"
            style={{ ...mono, color: C.muted }}
          >
            Bedrag per factuur
          </div>
          <PlotLine data={trend} tone={C.blue} hatch="p259-hatch-blue" height={44} />
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
                    className="px-3 py-2.5 text-[10.5px] font-bold uppercase tracking-[0.1em]"
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
                    className="transition-colors hover:bg-[#f3ecdb]"
                    style={{ borderBottom: `1px solid ${C.lineFaint}` }}
                  >
                    <td
                      className="px-3 py-3 text-[12.5px] font-bold tabular-nums"
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
                          borderRadius: 3,
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
      </Sheet>
    </div>
  );
}

// ---- Shell -----------------------------------------------------------------

export function Concept259() {
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
      <PlotterDefs />
      <div className="mx-auto flex min-h-[680px] max-w-6xl flex-col px-4 py-6 sm:px-6 sm:py-8">
        <header className="mb-6 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span
              className="flex h-11 w-11 items-center justify-center text-white"
              style={{ background: C.blue, borderRadius: 4 }}
              aria-hidden="true"
            >
              <PenTool size={19} strokeWidth={1.8} />
            </span>
            <div className="leading-tight">
              <div
                className="text-[19px] font-bold tracking-tight"
                style={{ ...mono, color: C.ink }}
              >
                Plotter
              </div>
              <div
                className="text-[10px] font-medium uppercase tracking-[0.2em]"
                style={{ ...mono, color: C.muted }}
              >
                ZZP platform
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
                borderRadius: 4,
              }}
              aria-hidden="true"
            >
              {PROFIEL.initialen}
            </span>
          </div>
        </header>

        <nav className="mb-8 flex flex-wrap gap-1.5 overflow-x-auto" aria-label="Hoofdnavigatie">
          {SCREENS.map((s) => {
            const on = s.key === screen;
            const Icon = NAV_ICONS[s.key];
            return (
              <button
                key={s.key}
                onClick={() => setScreen(s.key)}
                aria-current={on ? "page" : undefined}
                className={`inline-flex shrink-0 items-center gap-1.5 px-3.5 py-2 text-[12.5px] font-semibold transition-colors ${RING}`}
                style={{
                  ...mono,
                  color: on ? "#fff" : C.inkSoft,
                  background: on ? C.blue : C.card,
                  border: `1px solid ${on ? C.blue : C.line}`,
                  borderRadius: 3,
                }}
              >
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
            <PenTool size={12} strokeWidth={1.8} style={{ color: C.blue }} aria-hidden="true" />
            Enkel-pen · {ACTIES.length} acties in wachtrij
          </span>
          <span>Uitgetekend met zorg</span>
        </footer>
      </div>
    </div>
  );
}
